const { VedikaClient } = require('../dist');
const drawing={plan:{units:'metres',trueNorthDeg:0,plot:{polygon:[[0,0],[12,0],[12,9],[0,9]]},rooms:[{id:'k',polygon:[[0,0],[4,0],[4,3],[0,3]]}]},titleBlock:{project:'Synthetic residence',architect:'Surveyor'},format:'html'};
test('drawing method forwards retained idempotency and preserves billing envelope',async()=>{
 const client=new VedikaClient({apiKey:'test-key'});
 const receipt={success:true,data:{html:'<html>synthetic sheet</html>',scaleDenominator:100},billing:{chargedCents:1}};
 const post=jest.spyOn(client.client,'post').mockResolvedValue({data:{__envelope:receipt}});
 expect(await client.vastuDrawingSheet(drawing,{idempotencyKey:'retained-drawing'})).toEqual(receipt);
 expect(post.mock.calls[0][0]).toContain('/report/drawing-sheet');expect(post.mock.calls[0][1]).toEqual(drawing);
 expect(post.mock.calls[0][2].headers['Idempotency-Key']).toBe('retained-drawing');
});
test.each(['properties','jobs','get','list','reset','webhook','report'])('workspace %s uses the isolated root and preserves zero-charge envelope',async op=>{
 const client=new VedikaClient({apiKey:'test-key'});const receipt={success:true,data:{records:[]},mode:'sandbox',billing:{chargedCents:0}};
 const post=jest.spyOn(client.client,'post').mockResolvedValue({data:{__envelope:receipt}});
 expect(await client.vastuWorkspace(op,{})).toEqual(receipt);expect(post).toHaveBeenCalledWith(`/sandbox/v2/vastu/workspace/${op}`,{});
});

test('workspace operation cannot escape its route root at runtime', async()=>{
 const client=new VedikaClient({apiKey:'test-key'});const post=jest.spyOn(client.client,'post');
 await expect(client.vastuWorkspace('../../properties/get',{})).rejects.toThrow('Unknown workspace operation');expect(post).not.toHaveBeenCalled();
});
