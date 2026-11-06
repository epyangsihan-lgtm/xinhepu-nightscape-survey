window.flowSettingsReady=fetch('assets/survey/flow.json',{cache:'no-store'}).then(response=>{
 if(!response.ok)throw new Error('无法读取问卷配置');return response.json();
}).then(config=>{
 window.studySurveyNodes=config.stations.map((station,index)=>{
  const base=nodes.find(node=>node.id===station.sourceNodeId)||{};
  return {...base,id:station.id,name:station.name||`第${index+1}站`,surveyScenes:station.scenes,panoramaUrl:station.scenes[0]?.panoramaUrl};
 });
 return config;
});
