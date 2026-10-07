const { VedikaClient } = require('../dist');
const corpus = require('../../../web/vedika-public/js/catalog/vastu-sandbox-demos.json');
test.each([
  ['import-dxf', 'vastuPlanImportDxf', { dxf: 'synthetic', maxChargeUsd: '0.01' }],
  ['export-ifc', 'vastuPlanExportIfc', { plan: {}, outputUnits: 'mm', maxChargeUsd: '0.02' }],
  ['convert-units', 'vastuPlanConvertUnits', { plan: {}, inputUnits: 'm', outputUnits: 'ft' }],
  ['export-dxf', 'vastuPlanExportDxf', { plan: {}, maxChargeUsd: '0.02' }],
  ['import-ifc', 'vastuPlanImportIfc', { ifc: 'synthetic', maxChargeUsd: '0.03' }],
])('CAD %s preserves the debit ceiling and decodes a real Rust recording', async (tail, method, body) => {
  const client = new VedikaClient({ apiKey: 'vk_test' });
  const fixture = corpus.demos['vastu__plan_' + tail.replace('-', '_')];
  expect(fixture.success).toBe(true);
  const post = jest.spyOn(client.client, 'post').mockResolvedValue({ data: fixture });
  const result = await client[method](body, { idempotencyKey: 'cad-retry' });
  expect(post.mock.calls[0][0]).toContain('/plan/' + tail);
  expect(post.mock.calls[0][1]).toEqual(body);
  expect(post.mock.calls[0][2].headers['Idempotency-Key']).toBe('cad-retry');
  expect(result.data).toEqual(fixture.data);
});
