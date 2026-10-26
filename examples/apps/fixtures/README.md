# Fixture provenance

Recorded 2026-10-08 with no key, synthetic published-example birth inputs and no production calls. sandbox-panchang.json: GET `/v2/astrology/panchang?date=2026-05-15&latitude=28.6139&longitude=77.209&timezone=Asia%2FKolkata`. sandbox-birth.json and sandbox-kundli.json: POST the corresponding paths with the public birth-chart request example. sandbox-match.json: POST `/v2/astrology/kundali-matching` with its public male/female request example. All requests used the public sandbox server, https://api.vedika.io/sandbox.

These are exact recorded mock responses, which ignore inputs. No claim of real astrological accuracy. Apps use only fields documented in the public OpenAPI document; missing documented score fields in sandbox matching are displayed as unavailable.

spec-birth.json, spec-kundli.json, spec-match.json and chat.sse are exact published response examples from the public OpenAPI document, not live captures. They verify documented response handling. The sandbox chat stream returned 404; fixture mode replays the published SSE example and labels it. No real keys or live requests are used in tests.

Recorded sandbox houses currently omit the documented `house` number. The demo shows the returned planetary table and marks the house diagram unavailable rather than deriving house numbers from array positions.
