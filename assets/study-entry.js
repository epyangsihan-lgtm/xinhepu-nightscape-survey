(() => {
  'use strict';
  const page=document.createElement('section');
  page.id='studyEntry';page.className='study-page';page.hidden=true;
  page.setAttribute('aria-label','夜间光景感知问卷');
  page.innerHTML=`<div class="sequence-shell"><header class="sequence-header"><span>新河浦夜间光景调研</span><button id="studyBack" type="button">退出问卷</button></header>
    <div class="sequence-layout"><aside class="station-rail" id="stationRail" aria-label="十站漫游进度"><p>漫游进度</p><ol id="stationStops"></ol><small id="stationPosition">1 / 10</small></aside><div class="sequence-content"><main id="studyStage1"></main></div></div></div>`;
  document.getElementById('app').appendChild(page);
  const modal=document.getElementById('researchModal');
  const card=modal.querySelector('.research-card');
  let active=false;
  const stops=document.getElementById('stationStops');
  for(let index=0;index<10;index++){
    const stop=document.createElement('li');stop.dataset.station=String(index);stop.innerHTML=`<button type="button" class="station-dot" aria-label="浏览第${index+1}站">${index+1}</button><span class="station-label">第 ${index+1} 站</span>`;stop.querySelector('button').onclick=()=>window.selectSurveyStation?.(index);stops.appendChild(stop);
  }
  window.setSurveyStation=(index,completed=[])=>{
    stops.querySelectorAll('li').forEach((stop,position)=>{
      const done=completed.includes(position);stop.classList.toggle('done',done);stop.classList.toggle('current',position===index);
      stop.setAttribute('aria-label',`第${position+1}站，${done?'已完成':position===index?'当前站':'待完成'}`);
      if(position===index)stop.setAttribute('aria-current','step');else stop.removeAttribute('aria-current');
      const button=stop.querySelector('button');if(position===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
      stop.querySelector('.station-dot').textContent=done?'✓':String(position+1);
    });
    document.getElementById('stationPosition').textContent=`${index+1} / 10`;
  };
  window.setSurveyStation(0);
  window.selectStudyPhase=()=>{
    document.getElementById('studyStage1').hidden=false;
    document.getElementById('stationRail').hidden=false;
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
      active=false;document.body.classList.remove('sequence-active');modal.appendChild(card);
      if(nodeSurveyMode)closeResearch();
    }
  }
  window.openStudyEntry=()=>{if(location.hash==='#survey')render();else location.hash='survey';};
  window.exitStudySequence=()=>{
    history.replaceState(null,'',location.pathname+location.search);render();
    document.getElementById('intro').classList.remove('hidden');
  };
  document.getElementById('studyBack').onclick=()=>{if(nodeSurveyMode)closeResearch();else window.exitStudySequence();};
  window.addEventListener('node-survey-ready',start);
  window.addEventListener('hashchange',render);render();
})();
