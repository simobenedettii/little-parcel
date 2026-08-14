const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const CHUNK_SIZE = 850000;
const MAX_PAYLOAD_BYTES = 8 * 1024 * 1024;

function makeId() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    if (!payload || !Array.isArray(payload.i) || payload.i.length === 0) {
      return Response.json({error:'Parcel must contain at least one item.'}, {status:400});
    }

    const json = JSON.stringify(payload);
    const size = new TextEncoder().encode(json).byteLength;
    if (size > MAX_PAYLOAD_BYTES) {
      return Response.json({error:'Parcel is too large. Please use smaller media files.'}, {status:413});
    }

    let id;
    for (let attempt=0; attempt<5; attempt++) {
      const candidate = makeId();
      const exists = await context.env.PARCELS.prepare('SELECT id FROM parcels WHERE id=?1').bind(candidate).first();
      if (!exists) { id = candidate; break; }
    }
    if (!id) return Response.json({error:'Could not create parcel id.'}, {status:503});

    const chunks=[];
    for(let i=0;i<json.length;i+=CHUNK_SIZE) chunks.push(json.slice(i,i+CHUNK_SIZE));

    const stmts=[context.env.PARCELS.prepare('INSERT INTO parcels (id, created_at, chunks, size_bytes) VALUES (?1, ?2, ?3, ?4)').bind(id,new Date().toISOString(),chunks.length,size)];
    for(let i=0;i<chunks.length;i++) {
      stmts.push(context.env.PARCELS.prepare('INSERT INTO parcel_chunks (parcel_id, chunk_index, data) VALUES (?1, ?2, ?3)').bind(id,i,chunks[i]));
    }
    await context.env.PARCELS.batch(stmts);

    const url = new URL(context.request.url);
    url.pathname = '/';
    url.search = '?p=' + id;
    url.hash = '';
    return Response.json({id,url:url.toString()});
  } catch (err) {
    return Response.json({error:'Could not save parcel.'}, {status:500});
  }
}
