(() => {
  'use strict';
  const page=document.createElement('section');
  page.id='studyEntry';page.className='study-page';page.hidden=true;
  page.setAttribute('aria-label','夜间光景感知问卷');
  page.innerHTML=`<div class="sequence-shell"><header class="sequence-header"><span>新河浦夜间光景调研</span><button id="studyBack" type="button">退出问卷</button></header>
    <ol class="sequence-steps" aria-label="调研阶段"><li aria-current="step"><button type="button" id="studyPhase1" aria-controls="studyStage1" aria-pressed="true"><span>1</span>节点漫游与评价</button></li><li><button type="button" id="studyPhase2" aria-controls="studyStage2" aria-pressed="false"><span>2</span>完整问卷 <i aria-hidden="true">↗</i></button></li></ol>
    <div class="sequence-layout"><aside class="station-rail" id="stationRail" aria-label="十站漫游进度"><p>漫游进度</p><ol id="stationStops"></ol><small id="stationPosition">1 / 10</small></aside><div class="sequence-content"><main id="studyStage1"></main><section id="studyStage2" hidden></section></div></div></div>`;
  document.getElementById('app').appendChild(page);
  const modal=document.getElementById('researchModal');
  const card=modal.querySelector('.research-card');
  let active=false;
  const stops=document.getElementById('stationStops');
  for(let index=0;index<10;index++){
    const stop=document.createElement('li');stop.dataset.station=String(index);stop.innerHTML=`<span class="station-dot" aria-hidden="true">${index+1}</span><span class="station-label">第 ${index+1} 站</span>`;stops.appendChild(stop);
  }
  window.setSurveyStation=(index,completed=[])=>{
    stops.querySelectorAll('li').forEach((stop,position)=>{
      const done=completed.includes(position);stop.classList.toggle('done',done);stop.classList.toggle('current',position===index&&!done);
      stop.setAttribute('aria-label',`第${position+1}站，${done?'已完成':position===index?'当前站':'待完成'}`);
      if(position===index&&!done)stop.setAttribute('aria-current','step');else stop.removeAttribute('aria-current');
      stop.querySelector('.station-dot').textContent=done?'✓':String(position+1);
    });
    document.getElementById('stationPosition').textContent=`${index+1} / 10`;
  };
  window.setSurveyStation(0);
  window.selectStudyPhase=phase=>{
    document.getElementById('studyStage1').hidden=phase!==1;
    document.getElementById('studyStage2').hidden=phase!==2;
    document.getElementById('stationRail').hidden=phase!==1;
    document.querySelector('.sequence-layout').classList.toggle('phase-two',phase===2);
    [1,2].forEach(number=>{const button=document.getElementById(`studyPhase${number}`);button.setAttribute('aria-pressed',String(number===phase));if(number===phase)button.parentElement.setAttribute('aria-current','step');else button.parentElement.removeAttribute('aria-current');});
    if(phase===2){activePanoViewer?.stopAutorotate();window.openCompleteSurvey?.();}
    else{window.pauseCompleteTour?.();if(activePanoViewer)activePanoViewer.startAutorotate();}
  };
  function start(){if(active&&!nodeSurveyMode&&window.startSequentialSurvey)window.startSequentialSurvey();}
  function render(){
    const open=location.hash==='#survey';
    page.hidden=!open;
    if(open&&!active){
      active=true;document.body.classList.add('sequence-active');
      window.selectStudyPhase(1);
      document.getElementById('studyStage1').appendChild(card);
      requestAnimationFrame(start);
    }else if(!open&&active){
      active=false;window.resetCompleteTour?.();document.body.classList.remove('sequence-active');modal.appendChild(card);
      if(nodeSurveyMode)closeResearch();
    }
  }
  window.openStudyEntry=()=>{if(location.hash==='#survey')render();else location.hash='survey';};
  window.exitStudySequence=()=>{
    history.replaceState(null,'',location.pathname+location.search);render();
    document.getElementById('intro').classList.remove('hidden');
  };
  document.getElementById('studyBack').onclick=()=>{if(nodeSurveyMode)closeResearch();else window.exitStudySequence();};
  document.getElementById('studyPhase1').onclick=()=>window.selectStudyPhase(1);
  document.getElementById('studyPhase2').onclick=()=>window.selectStudyPhase(2);
  window.addEventListener('node-survey-ready',start);
  window.addEventListener('hashchange',render);render();
})();
