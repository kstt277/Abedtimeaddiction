'use strict';
const source = window.SLEEP_DATA;
const rows = source.rows.map(r => ({type:r[0], occupation:r[1], phone:r[2], sleep:r[3], fatigue:r[4]}));
const types = ['Morning Lark', 'Intermediate', 'Night Owl'];
const colours = {'Morning Lark':'#267b63', Intermediate:'#da755c', 'Night Owl':'#7b72bb'};
const byId = id => document.getElementById(id);
const mean = values => values.reduce((a,b) => a+b,0)/values.length;
const fmt = (n,d=2) => Number.isFinite(n) ? n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}) : '—';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selectedType = 'all';

function quantile(sorted,p) {
  const index = (sorted.length-1)*p;
  const lower = Math.floor(index);
  return sorted[lower]+(sorted[Math.ceil(index)]-sorted[lower])*(index-lower);
}
function statistics(values) {
  const a = values.slice().sort((x,y)=>x-y);
  const q1=quantile(a,.25), q3=quantile(a,.75), iqr=q3-q1, average=mean(a);
  return {n:a.length,mean:mean(a),median:quantile(a,.5),q1,q3,min:a[0],max:a[a.length-1],
    low:a.find(x=>x>=q1-1.5*iqr),high:a.slice().reverse().find(x=>x<=q3+1.5*iqr),
    sd:a.length>1?Math.sqrt(a.reduce((sum,x)=>sum+(x-average)**2,0)/(a.length-1)):NaN};
}
function svgStart(w,h,label) {return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>`;}
function text(x,y,value,anchor='middle',colour='#677282',size=11) {return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${colour}" font-size="${size}">${esc(value)}</text>`;}
function line(x1,y1,x2,y2,colour='#e7ebe7',extra='') {return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colour}" ${extra}/>`;}
function axes(w,h,max,steps,dark=false) {
  let s='';const left=45,top=20,bottom=h-48,colour=dark?'#536774':'#e7ebe7';
  for(let i=0;i<=steps;i++){const value=max*i/steps,y=bottom-(bottom-top)*i/steps;s+=line(left,y,w-15,y,colour)+text(left-8,y+4,fmt(value,value%1?1:0),'end',dark?'#c5d1d5':'#677282');}
  return s;
}
function table(headers,data) {return `<table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${data.map(row=>`<tr>${row.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
function boxMarkup(values,x,yScale,width,colour,description) {
  const s=statistics(values),cy=yScale(s.median),top=yScale(s.q3),bottom=yScale(s.q1);
  let mark=line(x,yScale(s.low),x,yScale(s.high),colour,'stroke-width="1.5"');
  mark+=line(x-width/3,yScale(s.low),x+width/3,yScale(s.low),colour);
  mark+=line(x-width/3,yScale(s.high),x+width/3,yScale(s.high),colour);
  mark+=`<rect x="${x-width/2}" y="${top}" width="${width}" height="${Math.max(bottom-top,1)}" fill="${colour}" fill-opacity=".45" stroke="${colour}"/>`;
  mark+=line(x-width/2,cy,x+width/2,cy,colour,'stroke-width="3"');
  return `<g tabindex="0" role="img" aria-label="${esc(description)}"><title>${esc(description)}</title>${mark}</g>`;
}
function averages(data,activeTypes) {
  const measures=[['phone','Bedtime phone use','minutes',80],['fatigue','Next-day fatigue','score',10],['sleep','Total sleep','hours',10]];
  byId('averages').innerHTML=measures.map(([key,label,unit,max])=>{
    const w=355,h=265,bottom=h-48;let s=svgStart(w,h,`${label} by chronotype`)+axes(w,h,max,4);
    activeTypes.forEach((type,i)=>{
      const group=data.filter(r=>r.type===type),value=mean(group.map(r=>r[key]));
      if(!group.length)return;
      const x=55+(w-75)*(i+.5)/activeTypes.length,y=bottom-(bottom-20)*value/max;
      s+=`<rect tabindex="0" x="${x-24}" y="${y}" width="48" height="${bottom-y}" rx="3" fill="${colours[type]}"><title>${esc(type)} · ${fmt(value)} ${unit} · n=${group.length}</title></rect>`;
      s+=text(x,y-8,fmt(value,1),'middle','#202c3c',12)+text(x,bottom+20,type==='Morning Lark'?'Morning':type==='Night Owl'?'Night Owl':type);
    });
    return `<div class="chart"><p class="chart-title">${label} (${unit})</p>${s}</svg></div>`;
  }).join('');
  const groups=activeTypes.map(type=>({type,data:data.filter(r=>r.type===type)})).filter(g=>g.data.length);
  byId('average-insight').textContent=groups.map(g=>`${g.type} · ${fmt(mean(g.data.map(r=>r.sleep)))} sleep hours · ${fmt(mean(g.data.map(r=>r.fatigue)))} fatigue score`).join('   /   ');
}
function sleepBoxes(data,activeTypes) {
  const w=950,h=320,bottom=h-48,y=v=>bottom-(bottom-20)*v/10;
  let s=svgStart(w,h,'Sleep duration distributions by chronotype')+axes(w,h,10,5);const stats=[];
  activeTypes.forEach((type,i)=>{
    const group=data.filter(r=>r.type===type).map(r=>r.sleep);if(!group.length)return;
    const st=statistics(group),x=45+(w-60)*(i+.5)/activeTypes.length;
    s+=boxMarkup(group,x,y,Math.min(90,500/activeTypes.length),colours[type],`${type}. n=${st.n}. Median=${fmt(st.median)} hours. Middle 50%=${fmt(st.q1)}–${fmt(st.q3)} hours.`);
    s+=text(x,bottom+25,type);
    stats.push([type,st.n,fmt(st.mean),fmt(st.median),fmt(st.sd),fmt(st.min),fmt(st.max)]);
  });
  byId('sleep-boxes').innerHTML=s+'</svg>';
  byId('sleep-table').innerHTML=table(['Chronotype','n','Mean (h)','Median (h)','SD (h)','Min (h)','Max (h)'],stats);
}
function fatigueBoxes(data,activeTypes) {
  const stats=[];
  byId('fatigue-boxes').innerHTML=activeTypes.map(type=>{
    const w=355,h=310,bottom=h-48,y=v=>bottom-(bottom-20)*v/10;
    let s=svgStart(w,h,`Fatigue within sleep intervals for ${type}`)+axes(w,h,10,5);
    for(let bin=3;bin<=9;bin++){
      const values=data.filter(r=>r.type===type && r.sleep>=bin && (bin===9?r.sleep<=10:r.sleep<bin+1)).map(r=>r.fatigue);
      const x=45+(w-60)*(bin-3+.5)/7;
      s+=text(x,bottom+20,`${bin}–${bin+1}`,'middle','#677282',10);
      if(!values.length)continue;
      const st=statistics(values);
      const description=`${type}, ${bin} to ${bin+1} hours. n=${st.n}. Median fatigue=${fmt(st.median)}.`;
      s+=boxMarkup(values,x,y,25,colours[type],description);
      stats.push([type,`${bin}–${bin+1}`,st.n,fmt(st.median),fmt(st.mean)]);
    }
    return `<div class="chart"><p class="chart-title">${esc(type)}</p>${s}</svg></div>`;
  }).join('');
  byId('fatigue-table').innerHTML=table(['Chronotype','Sleep interval (h)','n','Median fatigue','Mean fatigue'],stats);
}
function occupationChart(data,activeTypes) {
  const occupations=source.occupations,w=1080,h=350,bottom=h-68,top=20,max=10;
  let s=svgStart(w,h,'Mean sleep duration by occupation and chronotype');
  for(let i=0;i<=5;i++){const y=bottom-(bottom-top)*i/5;s+=line(45,y,w-15,y)+text(37,y+4,i*2,'end');}
  occupations.forEach((occupation,index)=>{
    const centre=45+(w-60)*(index+.5)/occupations.length;
    activeTypes.forEach((type,j)=>{
      const group=data.filter(r=>r.occupation===occupation&&r.type===type);if(!group.length)return;
      const value=mean(group.map(r=>r.sleep)),x=centre+(j-(activeTypes.length-1)/2)*37,y=bottom-(bottom-top)*value/max;
      s+=`<rect tabindex="0" x="${x-15}" y="${y}" width="30" height="${bottom-y}" rx="2" fill="${colours[type]}"><title>${esc(occupation)} · ${esc(type)} · ${fmt(value)} hours · n=${group.length}</title></rect>`;
    });
    const short=occupation.replace('Healthcare / Shift Worker','Healthcare / Shift').replace('Freelance / Creative','Freelance / Creative');
    s+=text(centre,bottom+25,short);
  });
  byId('occupation-chart').innerHTML=s+'</svg>';
}
function updateExplorer() {
  const occupation=byId('occupation').value;
  const filtered=rows.filter(r=>(occupation==='all'||r.occupation===occupation)&&(selectedType==='all'||r.type===selectedType));
  const activeTypes=selectedType==='all'?types:[selectedType];
  byId('selection').textContent=`Showing ${filtered.length.toLocaleString()} of 8,500 simulated observations · ${occupation==='all'?'All occupations':occupation} · ${selectedType==='all'?'All chronotypes':selectedType}`;
  const measures=[['Observations',filtered.length,'',0],['Average sleep',mean(filtered.map(r=>r.sleep)),'hours',2],['Average bedtime phone use',mean(filtered.map(r=>r.phone)),'minutes',1],['Average fatigue',mean(filtered.map(r=>r.fatigue)),'score',2]];
  byId('metrics').innerHTML=measures.map(([label,value,unit,d])=>`<div class="metric"><span>${label}</span><strong>${fmt(value,d)}</strong><small>${unit}</small></div>`).join('');
  averages(filtered,activeTypes);sleepBoxes(filtered,activeTypes);fatigueBoxes(filtered,activeTypes);occupationChart(filtered,activeTypes);
}
function predict(model,type,occupation,phone) {
  const c=model.coefficients;const chrono=type==='Intermediate'?'':`chronotype${type}`;
  return c['(Intercept)']+c.bedtime_phone_minutes*phone+(c[chrono]||0)+(c[`bedtime_phone_minutes:${chrono}`]||0)*phone+(c[`occupation_type${occupation}`]||0);
}
function updateModel() {
  const phone=Number(byId('phone').value),occupation=byId('model-occupation').value,model=source.models[1];
  byId('phone-value').textContent=`${phone} minutes`;
  byId('predictions').innerHTML=types.map(type=>`<div class="prediction-row"><span>${esc(type)}</span><strong>${fmt(predict(model,type,occupation,phone))} h</strong></div>`).join('');
  const w=700,h=365,bottom=h-48,top=20,x=v=>45+(w-65)*v/180,y=v=>bottom-(bottom-top)*v/10;
  let s=svgStart(w,h,'Model 2 predicted sleep hours by phone time and chronotype')+axes(w,h,10,5,true);
  const floor=y(3.2);s+=line(45,floor,w-15,floor,'#92a5af','stroke-dasharray="4 5"')+text(w-20,floor-7,'Observed sleep floor 3.2 h','end','#aebfc7',10);
  for(let p=0;p<=180;p+=30)s+=text(x(p),bottom+22,p,'middle','#c5d1d5');
  types.forEach(type=>{
    const observed=rows.filter(r=>r.type===type&&r.occupation===occupation).map(r=>r.phone);
    const min=Math.min(...observed),max=Math.max(...observed);
    let points='';for(let p=min;p<=max;p++)points+=`${x(p)},${y(predict(model,type,occupation,p))} `;
    s+=`<polyline fill="none" stroke="${colours[type]}" stroke-width="3" points="${points}"><title>${esc(type)}. Observed phone range ${min}–${max} minutes.</title></polyline>`;
    const value=predict(model,type,occupation,phone);
    s+=`<circle cx="${x(phone)}" cy="${y(value)}" r="5" fill="${colours[type]}" stroke="#fff"><title>${esc(type)} · ${fmt(value)} predicted hours</title></circle>`;
  });
  s+=line(x(phone),top,x(phone),bottom,'#c4c7b3','stroke-dasharray="4 4"');
  s+=text(w/2,h-3,'Bedtime phone use (minutes)','middle','#c5d1d5');
  s+=text(45,12,'Predicted sleep (hours)','start','#c5d1d5',10);
  byId('model-chart').innerHTML=s+'</svg>';
}
for(const occupation of source.occupations) {
  byId('occupation').add(new Option(occupation,occupation));
  byId('model-occupation').add(new Option(occupation,occupation));
}
byId('model-cards').innerHTML=source.models.map((model,i)=>`<div class="model-card"><div><h3>Model ${i+1}${i?' · + Occupation':''}</h3><p>${i?'Phone use × chronotype + occupation':'Phone use × chronotype'}<br>Training RMSE ${fmt(model.rmse,3)} hours · n = ${model.n.toLocaleString()}</p></div><div><strong>${fmt(model.adjustedR2,3)}</strong><span>Adjusted R²</span></div></div>`).join('');
const terms=Object.keys(source.models[1].coefficients);
byId('coefficient-table').innerHTML=table(['Term','Model 1','Model 2'],terms.map(term=>[term,term in source.models[0].coefficients?fmt(source.models[0].coefficients[term],5):'—',fmt(source.models[1].coefficients[term],5)]));
byId('occupation').addEventListener('change',updateExplorer);
document.querySelectorAll('[data-type]').forEach(button=>button.addEventListener('click',()=>{
  selectedType=button.dataset.type;
  document.querySelectorAll('[data-type]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  updateExplorer();
}));
byId('reset').addEventListener('click',()=>{byId('occupation').value='all';document.querySelector('[data-type="all"]').click();});
byId('phone').addEventListener('input',updateModel);
byId('model-occupation').addEventListener('change',updateModel);
updateExplorer();updateModel();
