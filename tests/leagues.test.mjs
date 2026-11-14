// A sports story's league (lib/leagues.mjs), as Orbit Sports names its leagues.
import test from 'node:test';
import assert from 'node:assert/strict';

test("a story's league: as Orbit Sports names it, by what its headlines name most (Jay 11-14)", async () => {
  const { leagueOf, LEAGUE_NAMES, leagueName } = await import('../public/lib/leagues.mjs');
  const { LEAGUES } = await import('#kit/sports-espn.mjs');
  for (const [k, l] of Object.entries(LEAGUES)) assert.deepEqual(LEAGUE_NAMES[k], [l.zh, l.en], k);
  const s = (title, heads = []) => ({ title, items: heads.map(t => ['x', t, 'https://x/', 0]) });
  assert.equal(leagueOf(s('詹皇再休兵沒差 七六人上演17分逆轉秀擊退暴龍')), 'nba');
  assert.equal(leagueOf(s('Harry Kane breaks caps record as England reach Nations League knockouts')), 'nationsleague');
  assert.equal(leagueOf(s('Mauricio Pochettino announced as new Manchester United manager')), 'epl');
  assert.equal(leagueOf(s('富邦悍將宣布新任總教練')), 'cpbl');
  assert.equal(leagueOf(s('Vikings to start reacquired QB Kirk Cousins vs. Packers')), 'nfl');
  assert.equal(leagueOf(s('柔道男神楊勇緯上演大逆轉 勇奪大獎賽金牌')), 'other', 'a judo Grand Prix is no F1');
  assert.equal(leagueName('nba', 'zh'), 'NBA');
  assert.equal(leagueName('nope', 'en'), 'Other sports');
});
