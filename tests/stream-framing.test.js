const http = require("node:http");
const { Readable } = require("node:stream");
const { VedikaClient } = require("../dist");
const cases = require("./fixtures/sse-events.json");

const query = {
  question: "test",
  birthDetails: { datetime: "2000-01-01T00:00:00Z", latitude: 0, longitude: 0 },
};
const collect = async (stream) => {
  const out = [];
  for await (const value of stream) out.push(value);
  return out;
};

async function consume(chunks) {
  const client = new VedikaClient({ apiKey: "vk_test_local" });
  const post = jest.spyOn(client.client, "post").mockResolvedValue({
    data: (async function* () {
      for (const chunk of chunks) yield chunk;
    })(),
  });
  const values = await collect(client.askQuestionStream(query));
  expect(post).toHaveBeenCalledTimes(1);
  return values;
}

// The identical corpus is used by the Python SDK. Partition the wire bytes,
// not characters: transport boundaries may fall inside a UTF-8 code point.
test.each(cases)(
  "$name survives every byte boundary",
  async ({ wire, expected }) => {
    const bytes = Buffer.from(wire);
    expect(await consume([bytes])).toEqual(expected);
    for (let split = 0; split <= bytes.length; split++) {
      expect(
        await consume([bytes.subarray(0, split), bytes.subarray(split)]),
      ).toEqual(expected);
    }
    expect(
      await consume([...bytes].map((byte) => Buffer.from([byte]))),
    ).toEqual(expected);
  },
);

test("malformed UTF-8 uses replacement decoding without dropping the event", async () => {
  expect(
    await consume([
      Buffer.from("data: "),
      Buffer.from([0xff]),
      Buffer.from("\n\n"),
    ]),
  ).toEqual(["\ufffd"]);
});

test("yields an event before EOF and closes the source on cancellation", async () => {
  let closed = false;
  async function* source() {
    try {
      yield Buffer.from("data: first\n\n");
      throw new Error("read past cancellation");
    } finally {
      closed = true;
    }
  }
  const client = new VedikaClient({ apiKey: "vk_test_local" });
  jest.spyOn(client.client, "post").mockResolvedValue({ data: source() });
  const stream = client.askQuestionStream(query);
  expect(await stream.next()).toEqual({ value: "first", done: false });
  await stream.return();
  expect(closed).toBe(true);
});

test("propagates a mid-stream failure without retrying or delivering partial data", async () => {
  const failure = new Error("connection lost");
  async function* source() {
    yield Buffer.from("data: first\n\ndata: partial");
    throw failure;
  }
  const client = new VedikaClient({ apiKey: "vk_test_local", maxRetries: 3 });
  const post = jest
    .spyOn(client.client, "post")
    .mockResolvedValue({ data: source() });
  const stream = client.askQuestionStream(query);
  expect((await stream.next()).value).toBe("first");
  await expect(stream.next()).rejects.toBe(failure);
  expect(post).toHaveBeenCalledTimes(1);
});

test("cancellation destroys a Node readable response", async () => {
  const source = Readable.from([
    Buffer.from("data: first\n\n"),
    Buffer.from("data: second\n\n"),
  ]);
  const client = new VedikaClient({ apiKey: "vk_test_local" });
  jest.spyOn(client.client, "post").mockResolvedValue({ data: source });
  for await (const value of client.askQuestionStream(query)) {
    expect(value).toBe("first");
    break;
  }
  expect(source.destroyed).toBe(true);
});

test("assembles a fragmented response through the real HTTP transport", async () => {
  let requests = 0;
  const server = http.createServer((req, res) => {
    requests++;
    req.resume();
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      res.write("da");
      setTimeout(() => res.end("ta: hello\n\n"), 20);
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const client = new VedikaClient({
      apiKey: "vk_test_local",
      baseUrl: `http://127.0.0.1:${server.address().port}`,
    });
    expect(await collect(client.askQuestionStream(query))).toEqual(["hello"]);
    expect(requests).toBe(1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
