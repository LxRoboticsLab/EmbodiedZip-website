import test from 'node:test';
import assert from 'node:assert/strict';
import { activeSectionAt, activationLine } from '../section-navigation.mjs';
import { viewerUrl, recordingUrl, DEFAULT_RERUN_VERSION } from '../recording-viewer.mjs';
const sections=[{id:'overview',top:700},{id:'leaderboard',top:1400},{id:'tasks',top:3800},{id:'analysis',top:6000},{id:'methodology',top:7100}];
const at=scrollY=>activeSectionAt(sections,{scrollY,viewportHeight:900,documentHeight:8500,offset:140});
test('navigation remains on a tall section until the next heading crosses the reading line',()=>{
  assert.equal(at(0),'overview');assert.equal(at(1260),'leaderboard');assert.equal(at(2500),'leaderboard');assert.equal(at(3659),'leaderboard');assert.equal(at(3660),'tasks');assert.equal(at(5000),'tasks');
});
test('reverse scrolling, direct jumps and page bottom are deterministic',()=>{
  assert.equal(at(6500),'analysis');assert.equal(at(3000),'leaderboard');assert.equal(at(4000),'tasks');assert.equal(at(7600),'methodology');
  assert.equal(activeSectionAt([],{scrollY:0,viewportHeight:900,documentHeight:900}),null);
});
test('activation line accommodates anchor padding and responsive viewport size',()=>{
  assert.ok(activationLine(900,124)>124);assert.equal(activationLine(400,44),96);assert.equal(activationLine(2000,124),160);assert.equal(activationLine(900,180),181);
});
test('versioned empty Rerun viewer does not fabricate a recording URL',()=>{
  const url=new URL(viewerUrl());assert.equal(url.origin,'https://app.rerun.io');assert.equal(url.pathname,`/version/${DEFAULT_RERUN_VERSION}/`);assert.equal(url.searchParams.get('theme'),'light');assert.equal(url.searchParams.get('renderer'),'webgl');assert.equal(url.searchParams.has('url'),false);
});
test('recording URLs preserve query parameters and resolve GitHub Pages subpaths',()=>{
  const source='https://data.example.org/episode.rrd?run=1&part=2';const url=new URL(viewerUrl({url:source,version:'0.41.0'}));assert.equal(url.searchParams.get('url'),source);assert.equal(url.pathname,'/version/0.41.0/');
  assert.equal(recordingUrl('./recordings/episode.rrd','https://example.org/EmbodiedZip-website/'),'https://example.org/EmbodiedZip-website/recordings/episode.rrd');
});
test('unsafe schemes, credentials and malformed viewer versions are rejected',()=>{
  for(const url of ['javascript:alert(1)','data:text/html,test','file:///private.rrd','https://name:token@example.org/a.rrd']) assert.throws(()=>recordingUrl(url,'https://example.org/'));
  for(const version of ['latest','0.42','../../','0.42.0/?url=other']) assert.throws(()=>viewerUrl({version}));
});
