function json(data, status=200){
  return Response.json(data,{status,headers:{'Cache-Control':'public, max-age=86400'}});
}

function platformFor(url=''){
  try{
    const h=new URL(url).hostname.toLowerCase();
    if(h.includes('spotify.com')) return 'Spotify';
    if(h.includes('youtube.com') || h.includes('youtu.be')) return 'YouTube';
    if(h.includes('music.apple.com')) return 'Apple Music';
    if(h.includes('soundcloud.com')) return 'SoundCloud';
  }catch{}
  return 'Music';
}

export async function onRequestGet(context){
  const url=context.request.url;
  const target=new URL(url).searchParams.get('url')||'';
  if(!/^https?:\/\//i.test(target)) return json({error:'Invalid song URL.'},400);

  const platform=platformFor(target);
  try{
    if(platform==='Spotify' || platform==='YouTube'){
      const endpoint=(platform==='Spotify'
        ? 'https://open.spotify.com/oembed?url='
        : 'https://www.youtube.com/oembed?url=') + encodeURIComponent(target) + (platform==='YouTube' ? '&format=json' : '');
      const res=await fetch(endpoint,{headers:{'User-Agent':'Little Parcel/1.0','Accept':'application/json'}});
      if(res.ok){
        const d=await res.json();
        return json({title:d.title||'',artist:d.author_name||'',cover:d.thumbnail_url||'',platform});
      }
    }

    if(platform==='Apple Music'){
      const u=new URL(target);
      const trackId=u.searchParams.get('i');
      if(trackId && /^\d+$/.test(trackId)){
        const res=await fetch('https://itunes.apple.com/lookup?entity=song&id='+encodeURIComponent(trackId),{headers:{'User-Agent':'Little Parcel/1.0'}});
        if(res.ok){
          const d=await res.json();
          const x=d.results?.find(r=>r.wrapperType==='track')||d.results?.[0];
          if(x){
            return json({
              title:x.trackName||x.collectionName||'',
              artist:x.artistName||'',
              cover:(x.artworkUrl100||x.artworkUrl60||'').replace(/\d+x\d+bb\./,'1200x1200bb.'),
              platform
            });
          }
        }
      }
      const slug=u.pathname.split('/').filter(Boolean).pop()||'';
      const term=decodeURIComponent(slug).replace(/-\d+$/,'').replace(/-/g,' ').trim();
      if(term){
        const res=await fetch('https://itunes.apple.com/search?entity=song&limit=1&term='+encodeURIComponent(term),{headers:{'User-Agent':'Little Parcel/1.0'}});
        if(res.ok){
          const d=await res.json(); const x=d.results?.[0];
          if(x) return json({title:x.trackName||term,artist:x.artistName||'',cover:(x.artworkUrl100||'').replace('100x100','1200x1200'),platform});
        }
      }
    }
  }catch{}

  return json({title:'',artist:'',cover:'',platform},200);
}
