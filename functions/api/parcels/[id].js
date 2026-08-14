export async function onRequestGet(context) {
  const id = context.params.id;
  if (!/^[0-9A-Za-z]{10}$/.test(id)) return Response.json({error:'Not found'}, {status:404});
  const meta = await context.env.PARCELS.prepare('SELECT id, chunks FROM parcels WHERE id=?1').bind(id).first();
  if (!meta) return Response.json({error:'Not found'}, {status:404});
  const rows = await context.env.PARCELS.prepare('SELECT data FROM parcel_chunks WHERE parcel_id=?1 ORDER BY chunk_index').bind(id).all();
  const json = (rows.results||[]).map(r=>r.data).join('');
  try { return Response.json(JSON.parse(json), {headers:{'Cache-Control':'public, max-age=300'}}); }
  catch { return Response.json({error:'Parcel data is invalid'}, {status:500}); }
}
