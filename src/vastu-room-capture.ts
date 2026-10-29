/**
 * Named helpers for the two room-scan operations, `ar/room-capture` and
 * `ar/capture-merge`. They sit beside the generic `vastuOperation`
 * and add the checks the Swift `RoomCaptureUploader` already makes before a
 * round trip: an untagged capture is refused, and a merge never goes out
 * without the caller's retained Idempotency-Key.
 *
 * Each function takes the client as its first argument and sends through
 * `vastuOperation`, so auth, retries and error mapping stay exactly where they
 * are.
 */

import type { VedikaClient } from './client';
import { ValidationError } from './exceptions';
import type {
  VastuArCaptureMergeRequest,
  VastuArRoomCaptureRequest,
  VastuCallOptions,
  VastuDeviceAttestation,
  VastuOperationContracts,
  VastuRoomCapture,
} from './types';

/** The one client method these helpers use; any `VedikaClient` satisfies it. */
export type VastuRoomScanClient = Pick<VedikaClient, 'vastuOperation'>;

export type VastuRoomCaptureResult = VastuOperationContracts['ar/room-capture']['response'];
export type VastuCaptureMergeResult = VastuOperationContracts['ar/capture-merge']['response'];

export interface UploadRoomCaptureOptions extends VastuCallOptions {
  zoneResolution?: 8 | 16 | 32;
  deviceAttestation?: VastuDeviceAttestation;
}

const ROOM_CAPTURE_SCHEMA = 'vedika.roomCapture/1';
const KEY_RE = /^[\x21-\x7e]{1,256}$/;

/**
 * Uploads a `vedika.roomCapture/1` to `POST /v2/astrology/vastu/ar/room-capture`.
 * Refuses before sending when the capture is not that schema or has no tagged room.
 * `idempotencyKey` is optional; keep it across retries of the same capture.
 */
export async function uploadRoomCapture(
  client: VastuRoomScanClient,
  capture: VastuRoomCapture,
  options: UploadRoomCaptureOptions = {}
): Promise<VastuRoomCaptureResult> {
  if (!capture || typeof capture !== 'object' || capture.schema !== ROOM_CAPTURE_SCHEMA) {
    throw new ValidationError(`capture must be a ${ROOM_CAPTURE_SCHEMA} object from the room scan`);
  }
  if (!(capture.quality && capture.quality.roomsTagged > 0)) {
    throw new ValidationError('Tag at least one room before uploading: the API refuses a capture with no labelled room');
  }
  const { zoneResolution, deviceAttestation, ...callOptions } = options;
  const request: VastuArRoomCaptureRequest = { capture };
  if (zoneResolution !== undefined) request.zoneResolution = zoneResolution;
  if (deviceAttestation !== undefined) request.deviceAttestation = deviceAttestation;
  return client.vastuOperation('ar/room-capture', request, callOptions);
}

/**
 * Merges floor captures through `POST /v2/astrology/vastu/ar/capture-merge`.
 * The merge is billed, so a caller-retained `idempotencyKey` is mandatory: a
 * retry with the same key replays the first result instead of charging again.
 */
export async function mergeRoomCaptures(
  client: VastuRoomScanClient,
  request: VastuArCaptureMergeRequest,
  options: VastuCallOptions & { idempotencyKey: string }
): Promise<VastuCaptureMergeResult> {
  if (!options || typeof options.idempotencyKey !== 'string' || !KEY_RE.test(options.idempotencyKey)) {
    throw new ValidationError('A caller-retained Idempotency-Key (1-256 visible ASCII characters) is required to merge captures');
  }
  return client.vastuOperation('ar/capture-merge', request, options);
}
