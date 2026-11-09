/** Internal SSE framing; the public API continues to yield event data strings.
 * https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
 */
async function* eventLines(
  chunks: AsyncIterable<Uint8Array>,
): AsyncGenerator<string> {
  // Streaming decoding preserves code points split between network chunks,
  // strips one leading BOM, and replaces malformed UTF-8 per the SSE spec.
  const decoder = new TextDecoder("utf-8");
  let parts: string[] = [];
  let afterCR = false;

  function* lines(text: string): Generator<string> {
    let start = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (afterCR) {
        afterCR = false;
        if (char === "\n") {
          start = i + 1;
          continue;
        }
      }
      if (char === "\r" || char === "\n") {
        parts.push(text.slice(start, i));
        const line = parts.join("");
        parts = [];
        start = i + 1;
        afterCR = char === "\r";
        yield line;
      }
    }
    if (start < text.length) parts.push(text.slice(start));
  }

  for await (const chunk of chunks)
    yield* lines(decoder.decode(chunk, { stream: true }));
  yield* lines(decoder.decode());
  // An unterminated line at EOF does not complete an event.
}

export async function* sseData(
  chunks: AsyncIterable<Uint8Array>,
): AsyncGenerator<string> {
  let data: string[] = [];
  for await (const line of eventLines(chunks)) {
    if (line === "") {
      if (data.length) {
        const value = data.join("\n");
        data = [];
        yield value;
      }
      continue;
    }
    const colon = line.indexOf(":");
    const field = colon < 0 ? line : line.slice(0, colon);
    if (field !== "data") continue;
    let value = colon < 0 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    data.push(value);
  }
  // Dispatch requires a blank line, including for the last event.
}
