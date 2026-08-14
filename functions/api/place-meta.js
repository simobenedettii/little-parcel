function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'public, max-age=86400'}})}

function decodePart(value=''){
  try{return decodeURIComponent(value).replace(/\+/g,' ').trim()}catch{return value.replace(/\+/g,' ').trim()}
}

function parsePlaceUrl(target=''){
  try{
    const u=new URL(target);
    const q=u.searchParams.get('q')||u.searchParams.get('query')||u.searchParams.get('destination')||u.searchParams.get('search')||u.searchParams.get('place');
    const at=u.href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if(at) return {query:q?decodePart(q):'',lat:Number(at[1]),lon:Number(at[2])};
    if(q) return {query:decodePart(q)};
    const data=decodePart(u.pathname+(u.hash||''));
    const m=data.match(/(?:place|search)\/([^/]+)/i);
    if(m) return {query:decodePart(m[1].replace(/[-_]+/g,' '))};
    const coordName=u.pathname.match(/\/([^/]+)\/@-?\d+\.\d+,-?\d+\.\d+/);
    if(coordName) return {query:decodePart(coordName[1].replace(/[-_]+/g,' '))};
  }catch{}
  return {};
}

export async function onRequestGet(context){
  const requested=new URL(context.request.url).searchParams.get('url')||'';
  const name=new URL(context.request.url).searchParams.get('name')||'';
  if(!/^https?:\/\//i.test(requested) && !name.trim()) return json({error:'No place supplied.'},400);

  const parsed=parsePlaceUrl(requested);
  let lat=parsed.lat, lon=parsed.lon, display='';
  const query=parsed.query||name.trim();

  try{
    if(lat==null || lon==null){
      const q=query||name.trim();
      if(!q) return json({error:'No searchable place information found.'},200);
      const endpoint='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q='+encodeURIComponent(q);
      const res=await fetch(endpoint,{headers:{'User-Agent':'Little Parcel/1.0 (place lookup)'}});
      if(res.ok){
        const data=await res.json();
        const hit=data?.[0];
        if(hit){lat=Number(hit.lat);lon=Number(hit.lon);display=hit.display_name||q;}
      }
    }
  }catch{}

  if(lat==null || lon==null || Number.isNaN(lat) || Number.isNaN(lon)) return json({name:query||name||'A special place',lat:null,lon:null});
  return json({name:display||query||name||'A special place',lat,lon});
}
