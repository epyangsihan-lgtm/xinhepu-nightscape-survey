(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  let viewer=null,node=null,tour=[],index=0,viewed=new Set(),busy=false,failed=false;
  let active=false,starting=false,generation=0,rotationTimer=null;

  function controls(){
    $('completeSceneBadge').textContent=`${index+1} / ${tour.length}`;
    $('completePrev').disabled=busy||index===0;
    $('completeNext').disabled=busy||index===tour.length-1;
    $('completeQuestionnaire').hidden=busy||failed||viewed.size!==tour.length;
  }
  function rotate(){
    clearTimeout(rotationTimer);
    viewer.stopAutorotate();
    viewer.rotate({longitude:Number(tour[index].longitude)||0,latitude:0});
    rotationTimer=setTimeout(()=>{if(active&&viewer&&!busy&&!failed)viewer.startAutorotate();},500);
  }
  function loaded(instance){
    if(viewer!==instance)return;
    busy=false;failed=false;viewed.add(index);
    $('completeLoading').classList.add('hidden');
    $('completeError').hidden=true;
    rotate();controls();
    // 预读下一张，保持与地图漫游相同的清晰度与加载策略。
    if(tour[index+1]&&!panoramaConnection?.saveData){
      const image=new Image();image.src=getOptimizedPanoramaUrl(tour[index+1].panoramaUrl);
    }
  }
  function error(instance){
    if(viewer!==instance)return;
    busy=false;failed=true;clearTimeout(rotationTimer);instance.stopAutorotate();
    $('completeLoading').classList.add('hidden');$('completeError').hidden=false;controls();
  }
  async function change(direction){
    if(busy||!viewer)return;
    const target=Math.max(0,Math.min(tour.length-1,index+direction));
    if(target===index&&!failed)return;
    index=target;busy=true;failed=false;
    clearTimeout(rotationTimer);viewer.stopAutorotate();
    $('completeLoading').classList.remove('hidden');$('completeError').hidden=true;controls();
    const instance=viewer;
    try{
      const success=await instance.setPanorama(getOptimizedPanoramaUrl(tour[index].panoramaUrl),{longitude:Number(tour[index].longitude)||0,transition:false});
      if(success!==false)loaded(instance);else error(instance);
    }catch{error(instance);}
  }
  window.openCompleteSurvey=async()=>{
    active=true;
    if(viewer){if(!busy&&!failed)rotate();return;}
    if(starting)return;
    starting=true;const run=generation;
    let config;
    try{config=await window.flowSettingsReady;}catch{config={completeActivity:'waEFtBG'};}
    if(run!==generation){return;}
    starting=false;
    const panel=$('studyStage2');
    const eligible=nodes.filter(item=>isSurveyNode(item)&&PANORAMA_TOURS[item.id]?.length);
    if(!eligible.length){panel.innerHTML='<p class="pano-help">暂无可浏览的场景，请先在点位页面配置全景图。</p>';return;}
    node=eligible[Math.floor(Math.random()*eligible.length)];
    // 使用地图配置的完整组合，不使用第一阶段选择的三张图。
    tour=PANORAMA_TOURS[node.id];index=0;viewed=new Set();busy=true;failed=false;
    panel.dataset.nodeId=node.id;
    panel.innerHTML=`<header class="complete-survey-head"><h2 id="completeSceneTitle"></h2></header>
      <div class="pano-stage">
        <div class="pano-viewer"><div id="completePanoViewer" aria-label="完整场景全景图"></div></div>
        <div class="pano-loading" id="completeLoading" role="status"><div class="pano-loading-inner"><strong>正在加载全景…</strong></div></div>
        <div class="pano-scene-badge" id="completeSceneBadge"></div>
        <div class="ground-nav">
          <button class="ground-arrow next" id="completeNext" type="button" aria-label="进入下一张全景" title="进入下一张全景"></button>
          <button class="ground-arrow prev" id="completePrev" type="button" aria-label="退回上一张全景" title="退回上一张全景"></button>
        </div>
      </div>
      <p class="pano-help">拖动图片可以进行360°环视，点击箭头浏览下一张图像。看完全部图片后填写问卷。</p>
      <div id="completeError" class="node-survey-message" role="status" hidden>图片加载失败。<button type="button" id="completeRetry">重新加载</button></div>
      <a class="primary" id="completeQuestionnaire" target="_blank" rel="noopener noreferrer" hidden>填写完整问卷 →</a>`;
    $('completeSceneTitle').textContent=node.name;
    $('completeQuestionnaire').href=`https://v.wjx.cn/vm/${config.completeActivity||'waEFtBG'}.aspx#`;
    $('completeNext').onclick=()=>change(1);$('completePrev').onclick=()=>change(-1);$('completeRetry').onclick=()=>change(0);
    controls();
    if(!window.PhotoSphereViewer){
      $('completeLoading').classList.add('hidden');$('completeError').textContent='全景播放器加载失败，请刷新重试。';$('completeError').hidden=false;return;
    }
    const instance=new PhotoSphereViewer.Viewer({
      container:$('completePanoViewer'),panorama:getOptimizedPanoramaUrl(tour[0].panoramaUrl),
      navbar:['autorotate','zoom','fullscreen'],mousewheel:true,mousemove:true,
      minFov:30,maxFov:92,defaultZoomLvl:18,autorotateZoomLvl:18,
      autorotateDelay:null,autorotateIdle:false,autorotateSpeed:'0.65rpm',defaultLong:Number(tour[0].longitude)||0
    });
    viewer=instance;
    instance.on('ready',()=>loaded(instance));
    instance.prop.loadingPromise?.catch(()=>error(instance));
  };
  window.pauseCompleteTour=()=>{active=false;clearTimeout(rotationTimer);viewer?.stopAutorotate();};
  window.resetCompleteTour=()=>{
    window.pauseCompleteTour();generation++;starting=false;
    const instance=viewer;viewer=null;node=null;tour=[];viewed.clear();
    if(instance){
      const pending=instance.prop?.loadingPromise;
      if(pending){instance.textureLoader.abortLoading();Promise.resolve(pending).catch(()=>{}).then(()=>instance.destroy());}
      else instance.destroy();
    }
    $('studyStage2').replaceChildren();delete $('studyStage2').dataset.nodeId;
  };
})();
