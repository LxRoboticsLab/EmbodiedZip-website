import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLandscapeData, projectPoint } from '../landscape.mjs';
import { configurations } from '../data.mjs';

test('unmeasured configurations never become zero-valued points',()=>{
  const data=buildLandscapeData(configurations);
  assert.equal(data.points.length,0);
  assert.equal(data.pending,configurations.length);
  assert.equal(data.bounds.latency,null);
  assert.equal(data.bounds.memory,null);
});
test('only complete physically valid finite measurements are plotted',()=>{
  const valid={id:'fixture',latencyMs:40,memoryGb:2,successRate:80};
  const rows=[valid,{...valid,latencyMs:null},{...valid,memoryGb:undefined},{...valid,successRate:NaN},{...valid,latencyMs:Infinity},{...valid,memoryGb:-1},{...valid,successRate:101},{...valid,latencyMs:'40'}];
  const data=buildLandscapeData(rows);
  assert.equal(data.points.length,1);
  assert.equal(data.pending,7);
  assert.equal(data.points[0].row,valid);
  for(const coordinate of data.points[0].position) assert.ok(coordinate>=-.5 && coordinate<=.5);
  assert.ok(data.bounds.latency>=40);
  assert.ok(data.bounds.memory>=2);
  assert.equal(data.bounds.success,100);
});
test('zero measurements remain valid and never cause division by zero',()=>{
  const data=buildLandscapeData([{id:'zero',latencyMs:0,memoryGb:0,successRate:0}]);
  assert.equal(data.points.length,1);
  assert.deepEqual(data.points[0].position,[-.5,-.5,-.5]);
  assert.ok(data.bounds.latency>0 && data.bounds.memory>0);
});
test('filtering rows changes plotted points and scale without altering source data',()=>{
  const first={id:'a',latencyMs:10,memoryGb:1,successRate:90};
  const second={id:'b',latencyMs:100,memoryGb:12,successRate:60};
  assert.equal(buildLandscapeData([first,second]).points.length,2);
  assert.ok(buildLandscapeData([first]).bounds.latency<buildLandscapeData([first,second]).bounds.latency);
  assert.deepEqual(first,{id:'a',latencyMs:10,memoryGb:1,successRate:90});
});
test('orthographic projection preserves axis directions for both 2D views',()=>{
  const origin=projectPoint([0,0,0],{yaw:0,pitch:0});
  const latency=projectPoint([1,0,0],{yaw:0,pitch:0});
  const success=projectPoint([0,1,0],{yaw:0,pitch:0});
  const memory=projectPoint([0,0,1],{yaw:Math.PI/2,pitch:0});
  assert.ok(latency.x>origin.x);
  assert.ok(success.y<origin.y);
  assert.ok(memory.x>origin.x);
  for(const yaw of [-Math.PI,0,Math.PI]) for(const pitch of [-Math.PI/3,0,Math.PI/3]) {
    const projected=projectPoint([.5,.5,.5],{yaw,pitch});
    assert.ok(Object.values(projected).every(Number.isFinite));
  }
});
