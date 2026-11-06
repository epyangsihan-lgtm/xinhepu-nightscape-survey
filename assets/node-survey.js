(() => {
 'use strict';
 const $=selector=>document.querySelector(selector);
 let config,index=0,viewed=new Set(),completed=[],nonce='',frame=null,timer=null,starting=false;
 const current=()=>config.stations[index];
 const ready=station=>station?.name&&station.activity&&station.scenes.length===3;
 function clear(){clearTimeout(timer);frame=null;nonce='';}
 async function openStation(position){
  index=position;viewed=new Set();clear();window.setSurveyStation?.(index,completed);
  await startResearch(current().id,{studyPreview:true,nodeSurvey:true});
 }
 window.startSequentialSurvey=async()=>{
  if(starting)return;starting=true;
  try{config=await window.flowSettingsReady;completed=[];index=0;
   document.querySelectorAll('#stationStops li').forEach((stop,i)=>stop.title=config.stations[i]?.name||`第${i+1}站`);
   if(!ready(current())){document.getElementById('studyStage1').innerHTML='<div class="node-survey-done"><h3>问卷暂未开放</h3><p>第一个节点尚未配置完整。</p></div>';return;}
   await openStation(0);
  }catch(error){document.getElementById('studyStage1').insertAdjacentHTML('beforeend','<p class="node-survey-message">问卷配置暂时无法加载，请刷新重试。</p>');}
  finally{starting=false;}
 };
 window.onNodeSurveySceneReady=(id,sceneIndex)=>{
  if(!nodeSurveyMode||id!==current()?.id)return;viewed.add(sceneIndex);
  const button=$('#nodeSurveyAnswerButton');if(button)button.hidden=!(viewed.size===3&&sceneIndex===2);
 };
 function finish(){
  clear();if(!completed.includes(index))completed.push(index);window.setSurveyStation?.(index,completed);
  const body=$('#researchBody');body.innerHTML='<section class="node-survey-done"><h3>本节点已完成</h3><div id="nextStationAction"></div></section>';
  const button=document.createElement('button');button.className='primary';button.type='button';
  if(index===config.stations.length-1){button.textContent='进入完整问卷 →';button.onclick=()=>window.selectStudyPhase(2);}
  else if(ready(config.stations[index+1])){button.textContent='下一节点 →';button.onclick=()=>openStation(index+1);}
  else{const note=document.createElement('p');note.textContent='下一节点问卷待接入。';$('#nextStationAction').appendChild(note);button.textContent='返回首页';button.onclick=()=>closeResearch();}
  $('#nextStationAction').appendChild(button);
 }
 window.openNodeSurveyQuestions=()=>{
  if(!nodeSurveyMode||researchNode?.id!==current().id||viewed.size!==3)return;
  destroyPanoViewer();clear();const station=current();$('#researchTitle').textContent=`${station.name} · 节点评价`;
  $('#researchBody').innerHTML='<section class="node-survey-card"><div class="node-survey-frame-wrap"><iframe id="nodeSurveyFrame" title="节点评价问卷" allow="clipboard-write"></iframe><div class="node-survey-loading" id="nodeSurveyLoading">正在加载问卷…</div></div><p class="node-survey-message" id="nodeSurveyMessage" role="status" hidden></p><div class="node-survey-actions"><button type="button" class="secondary" id="nodeSurveyBack">返回全景</button><a id="nodeSurveyExternal" target="_blank" rel="noopener noreferrer">问卷无法显示？↗</a></div></section>';
  nonce=crypto.randomUUID();frame=$('#nodeSurveyFrame');frame.src=`assets/wjx-node.html?activity=${station.activity}&nonce=${nonce}`;
  $('#nodeSurveyExternal').href=`https://v.wjx.cn/vm/${station.activity}.aspx`;
  $('#nodeSurveyBack').onclick=()=>{clear();startResearch(station.id,{studyPreview:true,nodeSurvey:true});};
  timer=setTimeout(()=>{if(!$('#nodeSurveyLoading'))return;$('#nodeSurveyLoading').hidden=true;$('#nodeSurveyMessage').hidden=false;$('#nodeSurveyMessage').textContent='加载较慢，可点击下方链接打开问卷。';},18000);
 };
 window.addEventListener('message',event=>{
  if(!nodeSurveyMode||!frame||event.source!==frame.contentWindow||event.origin!==location.origin)return;
  const value=event.data;if(!value||value.channel!=='xinhepu-wjx'||value.nonce!==nonce||value.activity!==current().activity)return;
  if(value.type==='submitted'){finish();return;}
  if(value.type==='ready'){clearTimeout(timer);$('#nodeSurveyLoading').hidden=true;}
  if(value.type==='error'){clearTimeout(timer);$('#nodeSurveyLoading').hidden=true;$('#nodeSurveyMessage').hidden=false;$('#nodeSurveyMessage').textContent='请点击下方链接打开问卷。';}
 });
 window.dispatchEvent(new Event('node-survey-ready'));
})();
