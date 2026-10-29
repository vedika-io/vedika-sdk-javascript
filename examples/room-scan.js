#!/usr/bin/env node
/**
 * Room scan example: upload a finished room scan, then show the merge rule.
 *
 * A room scan runs in a page (WebXR) or a native scanner (RoomPlan, ARCore) and ends as
 * a `vedika.roomCapture/1` object. `uploadRoomCapture` sends it to
 * POST /v2/astrology/vastu/ar/room-capture and `mergeRoomCaptures` joins floors through
 * POST /v2/astrology/vastu/ar/capture-merge.
 *
 * Run it with no key to see exactly what would be sent. Nothing leaves the machine:
 *
 *   node room-scan.js
 *
 * `--live` sends the upload and the two-floor merge for real. Both calls are billed, so it needs your API key:
 *
 *   VEDIKA_API_KEY=vk_live_... node room-scan.js --live
 */

const { VedikaClient, uploadRoomCapture, mergeRoomCaptures } = require('@vedika-io/sdk');

// A 3 m x 4 m kitchen in a traced 9 m x 12 m house. Replace it with the capture your scanner produced.
const capture = {
  "attestation": "caller-reported",
  "captureId": "fx-room-3x4-yaw0",
  "capturedAtEpoch": 1789000000,
  "device": {
    "depth": "none",
    "method": "webxr-hit",
    "platform": "web"
  },
  "frame": {
    "axes": "+X east,+Y true north",
    "north": {
      "compassConfidence": 0.939,
      "declinationDeg": 1.2,
      "declinationProvenance": "fixture",
      "headingSource": "deviceorientationabsolute",
      "referenceFrame": "true",
      "yawSamples": 17,
      "yawSpreadDeg": 1.22
    },
    "planToWorld": {
      "origin": [
        0.7,
        -1.4,
        2.3
      ],
      "units": "metres",
      "xAxis": [
        1.0,
        0,
        -5.12e-07
      ],
      "yAxis": [
        -5.12e-07,
        0,
        -1.0
      ]
    },
    "units": "metres"
  },
  "outline": {
    "polygon": [
      [
        0.0,
        0.0
      ],
      [
        9.0,
        0.0
      ],
      [
        9.0,
        12.0
      ],
      [
        0.0,
        12.0
      ]
    ],
    "source": "traced"
  },
  "quality": {
    "closureGapM": 0.0,
    "coveragePercent": null,
    "expectedRoomCount": 1,
    "gpsConfidence": null,
    "pointCloudDensity": null,
    "pointCloudDensityBasis": "none",
    "polygonClosure": true,
    "roomCount": 1,
    "roomsTagged": 1,
    "scanDurationSec": 160,
    "scannedAreaM2": 108
  },
  "rooms": [
    {
      "areaM2": 12.0,
      "floorIndex": 0,
      "heightM": 2.8,
      "id": "r1",
      "label": "kitchen",
      "labelSource": "user",
      "openings": [
        {
          "centerXY": [
            9.0,
            1.0
          ],
          "confidence": "high",
          "heightM": 2.1,
          "kind": "door",
          "widthM": 0.9
        }
      ],
      "polygon": [
        [
          6.0,
          0.0
        ],
        [
          9.0,
          0.0
        ],
        [
          9.0,
          4.0
        ],
        [
          6.0,
          4.0
        ]
      ]
    }
  ],
  "schema": "vedika.roomCapture/1"
};

/** The same house's upstairs scan: a merge needs 2 to 32 captures, each on a floor with its own frame. */
function upstairs(base) {
  return {
    ...base,
    captureId: `${base.captureId}-upstairs`,
    rooms: base.rooms.map((room) => ({ ...room, floorIndex: 1 })),
  };
}

/** Two floors, one capture each, no links: the smallest merge the API accepts. */
function mergeBody(base) {
  return {
    captures: [
      { id: 'ground', floorIndex: 0, payload: base },
      { id: 'upstairs', floorIndex: 1, payload: upstairs(base) },
    ],
    floors: [
      { floorIndex: 0, originXY: [0, 0], bearingDeg: 0, elevationM: 0 },
      { floorIndex: 1, originXY: [0, 0], bearingDeg: 0, elevationM: 3 },
    ],
    links: [],
    toleranceM: 0.05,
  };
}

const live = process.argv.includes('--live');

/** The one method the helpers use, printed instead of sent. */
function dryRunClient() {
  return {
    async vastuOperation(operation, request, options = {}) {
      console.log('REQUEST ' + JSON.stringify({ operation, idempotencyKey: options.idempotencyKey || null, keys: Object.keys(request), captures: (request.captures || []).length }));
      return { dryRun: true, operation };
    },
  };
}

async function main() {
  let client = dryRunClient();
  if (live) {
    const apiKey = process.env.VEDIKA_API_KEY;
    if (!apiKey) {
      console.log('Set VEDIKA_API_KEY to use --live');
      process.exit(1);
    }
    client = new VedikaClient({ apiKey, baseUrl: process.env.VEDIKA_BASE_URL || 'https://api.vedika.io' });
  }

  // One key per capture. Keep it for every retry: the API replays the first answer
  // instead of charging again.
  const idempotencyKey = `room-${capture.captureId}`;
  const first = await uploadRoomCapture(client, capture, { zoneResolution: 16, idempotencyKey });
  console.log('Uploaded:', JSON.stringify(first).slice(0, 200));
  await uploadRoomCapture(client, capture, { zoneResolution: 16, idempotencyKey });

  // A capture with no tagged room is refused before any request.
  const untagged = { ...capture, quality: { ...capture.quality, roomsTagged: 0 } };
  try {
    await uploadRoomCapture(client, untagged);
  } catch (error) {
    console.log('REFUSED untagged capture:', error.message);
  }

  // A merge is billed, so it never goes out without the key you keep for it.
  const body = mergeBody(capture);
  try {
    await mergeRoomCaptures(client, body, {});
  } catch (error) {
    console.log('REFUSED merge without a key:', error.message);
  }
  await mergeRoomCaptures(client, body, { idempotencyKey: `merge-${capture.captureId}` });
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Room scan example failed:', error.message);
    process.exit(1);
  });
}

module.exports = { capture, mergeBody };
