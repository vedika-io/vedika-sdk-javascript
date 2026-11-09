const { VedikaClient, ValidationError } = require("../dist");

const JOB = "vjob_0123456789abcdef0123456789abcdef";
const cycles = [
  ["a", "a"],
  ["a", "b", "a"],
  ["a", "b", "c", "a"],
  ["prefix", "a", "b", "a"],
];

function clientFor(nextCursors, empty = false) {
  const client = new VedikaClient({ apiKey: "vk_test_local" });
  const calls = [];
  client.vastuJobResults = jest.fn(async (jobId, options) => {
    expect(jobId).toBe(JOB);
    const index = calls.length;
    calls.push(options?.cursor);
    if (index >= nextCursors.length) {
      throw new Error("iterator requested a page after a repeated cursor");
    }
    const item = { id: `p${index}`, index, status: 200, response: {} };
    return {
      success: true,
      data: {
        jobId: JOB,
        jobStatus: "running",
        results: empty ? [] : [item],
        nextCursor: nextCursors[index],
      },
    };
  });
  return { client, calls };
}

describe.each([false, true])("pagination with empty=%s", (empty) => {
  test.each(cycles.map((cycle) => [cycle.join(" -> "), cycle]))(
    "stops before requesting a cursor again: %s",
    async (_, nextCursors) => {
      const { client, calls } = clientFor(nextCursors, empty);
      const yielded = [];
      const consume = async () => {
        for await (const item of client.vastuJobResultItems(JOB)) {
          yielded.push(item.index);
        }
      };
      await expect(consume()).rejects.toThrow(ValidationError);
      expect(calls).toEqual([undefined, ...nextCursors.slice(0, -1)]);
      expect(yielded).toEqual(empty ? [] : nextCursors.map((_, i) => i));
    },
  );
});

test("follows an empty page and preserves duplicate item IDs", async () => {
  const client = new VedikaClient({ apiKey: "vk_test_local" });
  const item = { id: "same-id", index: 0, status: 200, response: {} };
  client.vastuJobResults = jest
    .fn()
    .mockResolvedValueOnce({ data: { results: [item], nextCursor: "a" } })
    .mockResolvedValueOnce({ data: { results: [], nextCursor: "b" } })
    .mockResolvedValueOnce({ data: { results: [item], nextCursor: null } });
  const result = [];
  for await (const value of client.vastuJobResultItems(JOB)) result.push(value);
  expect(result).toEqual([item, item]);
  expect(client.vastuJobResults).toHaveBeenCalledTimes(3);
});

test("empty terminal page stops without another request", async () => {
  const { client, calls } = clientFor([null], true);
  const result = [];
  for await (const item of client.vastuJobResultItems(JOB)) result.push(item);
  expect(result).toEqual([]);
  expect(calls).toEqual([undefined]);
});

test("seen cursors are local to each iterator", async () => {
  const client = new VedikaClient({ apiKey: "vk_test_local" });
  client.vastuJobResults = jest.fn(async (_, options) => ({
    data: { results: [], nextCursor: options?.cursor ? null : "a" },
  }));
  for (let run = 0; run < 2; run++) {
    const result = [];
    for await (const item of client.vastuJobResultItems(JOB)) result.push(item);
    expect(result).toEqual([]);
  }
  expect(client.vastuJobResults).toHaveBeenCalledTimes(4);
});

test("closing iteration does not fetch the next page", async () => {
  const { client, calls } = clientFor(["a", null]);
  for await (const item of client.vastuJobResultItems(JOB)) {
    expect(item.index).toBe(0);
    break;
  }
  expect(calls).toEqual([undefined]);
});

test("page failure propagates without another request", async () => {
  const client = new VedikaClient({ apiKey: "vk_test_local" });
  const error = new Error("page unavailable");
  client.vastuJobResults = jest.fn().mockRejectedValue(error);
  await expect(client.vastuJobResultItems(JOB).next()).rejects.toBe(error);
  expect(client.vastuJobResults).toHaveBeenCalledTimes(1);
});
