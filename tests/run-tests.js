const assert = require('assert');
const { readLogs, readStats } = require('../lib/logReader');

(async () => {
  const res = await readLogs({ limit: 5 });
  assert(res.items && Array.isArray(res.items));
  console.log('readLogs basic OK, items:', res.items.length, 'total:', res.total);

  const resIllegal = await readLogs({ status: 'illegal', limit: 5 });
  assert(resIllegal.items.every(it => it.legal === false));
  console.log('readLogs illegal filter OK');

  const stats = await readStats({});
  assert(typeof stats.total === 'number');
  assert(Array.isArray(stats.topSources));
  console.log('readStats basic OK, total:', stats.total);

  console.log('All tests passed');
})().catch(e => { console.error('Tests failed', e); process.exit(1); });

