// ---- lib/leagues.mjs: a sports story's league ----
//
// Orbit News' 運動 by league, as Orbit Sports has them (Jay 11-14: "sport
// news should sort by league which matches the sports app more"): Sports'
// own leagues (the kit's sports-espn.mjs keys, in Sports' order for Taiwan)
// first, then the rest News carries. No imports: loaded on opening, and
// its own (only News sorts by league). Each headline of a story votes; the
// league named most is its. Nicknames two leagues share (Giants, Rangers,
// Cardinals, Kings, Panthers, Jets) vote for none.
const NBA_TEAMS = 'Hawks|Celtics|Nets|Hornets|Bulls|Cavaliers|Cavs|Mavericks|Mavs|Nuggets|Pistons|Warriors|Rockets|Pacers|Clippers|Lakers|Grizzlies|Heat|Bucks|Timberwolves|Pelicans|Knicks|Thunder|Magic|76ers|Sixers|Suns|Trail Blazers|Blazers|Spurs|Raptors|Jazz|Wizards|LeBron|Steph(?:en)? Curry|Wembanyama|Don[cč]i[cć]|Giannis|Jokic|Jokić|Embiid';
const MLB_TEAMS = 'Diamondbacks|D-backs|Braves|Orioles|Red Sox|Cubs|White Sox|Reds|Guardians|Rockies|Tigers|Astros|Royals|Angels|Dodgers|Marlins|Brewers|Twins|Mets|Yankees|Athletics|Phillies|Pirates|Padres|Mariners|Rays|Blue Jays|Nationals|Ohtani|World Series';
const NFL_TEAMS = 'Falcons|Ravens|Bills|Bears|Bengals|Browns|Cowboys|Broncos|Lions|Packers|Texans|Colts|Jaguars|Chiefs|Raiders|Chargers|Rams|Dolphins|Vikings|Patriots|Saints|Eagles|Steelers|49ers|Seahawks|Buccaneers|Bucs|Titans|Commanders|Super Bowl|quarterbacks?|QB|touchdowns?|Mahomes';
const NHL_TEAMS = 'Bruins|Sabres|Flames|Hurricanes|Blackhawks|Avalanche|Blue Jackets|Red Wings|Oilers|Canadiens|Predators|Devils|Islanders|Flyers|Penguins|Sharks|Kraken|Maple Leafs|Canucks|Golden Knights|Capitals|Mammoth|Stanley Cup';
const EPL_CLUBS = 'Premier League|Arsenal|Chelsea|Liverpool|Man(?:chester)? (?:United|City|Utd)|Tottenham|Newcastle|Aston Villa|Everton|West Ham|Brighton|Brentford|Fulham|Crystal Palace|Bournemouth|Wolves|Nottingham Forest|Sunderland|Leeds United';
const LEAGUE_RES = [
  ['cpbl', /中職|中華職棒|CPBL|中信兄弟|統一獅|統一7-ELEVEn獅|樂天桃猿|富邦悍將|味全龍|台鋼雄鷹|台灣大賽/],
  ['mlb', new RegExp(`\\b(?:MLB|${MLB_TEAMS})\\b|大聯盟|美職(?!足|籃)|世界大賽|道奇|洋基|大都會|小熊|紅襪|白襪|藍鳥|水手|教士|費城人|太空人|釀酒人|金鶯|光芒|守護者|響尾蛇|大谷|山本由伸|鈴木誠也|今永昇太`)],
  ['nba', new RegExp(`\\b(?:NBA|${NBA_TEAMS})\\b|勇士(?!.*(?:PLG|TPBL|富邦))|湖人|塞爾提克|尼克|公鹿|灰狼|金塊|獨行俠|快艇|拓荒者|馬刺|溜馬|活塞|巫師|暴龍|七六人|76人|老鷹|籃網|黃蜂|公牛|騎士|火箭|灰熊|熱火|鵜鶘|雷霆|魔術|太陽隊|爵士|柯瑞|詹皇|唐西奇|文班亞馬|杜蘭特|字母哥|約基奇|恩比德`)],
  ['epl', new RegExp(`\\b(?:${EPL_CLUBS})\\b|英超|兵工廠|阿森納|切爾西|利物浦|曼聯|曼城|熱刺|紐卡索`)],
  ['f1', /\bF1\b|\p{Script=Han}GP|Formula (?:1|One)|Verstappen|Leclerc|Piastri|Lando Norris|一級方程式|維斯塔潘/u],
  ['ucl', /Champions League|歐冠/],
  ['bundesliga', /Bundesliga|德甲|Bayern|拜仁|Dortmund|多特蒙德/],
  ['seriea', /Serie A|義甲|Juventus|尤文|Inter Milan|AC Milan|Napoli|拿坡里/],
  ['ligue1', /Ligue 1|法甲|\bPSG\b|Paris Saint-Germain|巴黎聖日耳曼/],
  ['uel', /Europa League|歐霸/],
  ['mls', /\bMLS\b|美職足|Inter Miami|邁阿密國際/],
  ['facup', /FA Cup|英足總盃/],
  ['nationsleague', /Nations League|歐國聯/],
  ['uecl', /Conference League|歐協聯/],
  ['scotland', /Scottish Premiership|蘇超/],
  ['nfl', new RegExp(`\\b(?:NFL|${NFL_TEAMS})\\b|美式足球|超級盃`)],
  ['nhl', new RegExp(`\\b(?:NHL|${NHL_TEAMS})\\b|冰球`)],
  ['ncaa', /\bNCAA\b|[Cc]ollege (?:football|basketball|sports)|College Football Playoff|\bCFP\b|Heisman|Big Ten|Big 12|Big East|\bSEC\b|\bACC\b|Pac-12|Mountain West|Sun Belt|Longhorns|Trojans|Crimson Tide|Buckeyes|Wolverines|Fighting Irish|Bulldogs|Hurricanes football|\b(?:LSU|USC|UCLA|Notre Dame|Ohio State|Penn State|Oregon|Alabama|Clemson|Texas A&M|Indiana|Michigan State|Iowa State|Kansas State|Oklahoma State|BYU|TCU|SMU)\b|[Hh]igh school|大學籃球|大學美式足球|\bUBA\b|\bHBL\b|高中/],
  ['tpbl', /\bPLG\b|P\.? ?LEAGUE\+?|\bTPBL\b|台灣職籃|新北國王|富邦勇士|雲豹|夢想家|海神|特攻|獵鷹|攻城獅|領航猿|戰神|台啤永豐/],
  ['npb', /日職|日本職棒|\bNPB\b|讀賣巨人|阪神|軟銀|火腿|養樂多|羅德/],
  ['kbo', /韓職|韓國職棒|\bKBO\b/],
  ['laliga', /La Liga|西甲|Real Madrid|Barcelona|皇馬|皇家馬德里|巴薩|巴塞隆納|Atl[eé]tico/],
  ['national', /台灣(?:克|勝|大戰|擊敗|不敵|輸給|對)(?:日本|南韓|韓國|澳洲)|抗日|對日|中華隊|國家隊|台灣隊|日本隊|韓國隊|澳洲隊|經典賽|\bWBC\b|12強|世界盃|World Cup|亞運|奧運|青奧|Olympic|亞冠|世界棒球|世錦賽|亞錦賽|U\d{2}/],
  ['tennis', /[Tt]ennis|網球|\bATP\b|\bWTA\b|Wimbledon|溫網|澳網|美網|法網/],
  ['golf', /[Gg]olf|高爾夫|\bPGA\b|\bLPGA\b|\bLIV\b|Masters/],
  ['soccer', /[Ss]occer|足球(?!.*美式)|\bFIFA\b|\bUEFA\b|\bFC\b|\bNWSL\b|\bWSL\b/],
  ['rugby', /[Rr]ugby|橄欖球/],
  ['cricket', /[Cc]ricket|板球/],
  ['fight', /\bUFC\b|\bMMA\b|[Bb]oxing|拳擊/]
];
// Each league's name, both languages: Sports' own as kit/sports-espn.mjs
// LEAGUES has them (a test holds them the same; News doesn't load that
// module), then those News names that Sports hasn't.
export const LEAGUE_NAMES = {
  mlb: ['MLB 美國職棒', 'MLB'], cpbl: ['中華職棒', 'CPBL'], nba: ['NBA', 'NBA'], epl: ['英超', 'Premier League'], bundesliga: ['德甲', 'Bundesliga'], seriea: ['義甲', 'Serie A'],
  ligue1: ['法甲', 'Ligue 1'], mls: ['美職足', 'MLS'], ucl: ['歐冠', 'Champions League'], uel: ['歐霸', 'Europa League'], uecl: ['歐協聯', 'Conference League'], facup: ['英足總盃', 'FA Cup'],
  scotland: ['蘇超', 'Scottish Premiership'], nationsleague: ['歐國聯', 'Nations League'], f1: ['F1 一級方程式', 'Formula 1'],
  nfl: ['NFL', 'NFL'], nhl: ['NHL', 'NHL'], ncaa: ['大學與學生', 'College & school'], tpbl: ['台灣職籃', 'Taiwan basketball'],
  npb: ['日職', 'NPB'], kbo: ['韓職', 'KBO'], laliga: ['西甲', 'La Liga'], national: ['國家隊與國際賽', 'National teams'],
  tennis: ['網球', 'Tennis'], golf: ['高爾夫', 'Golf'], soccer: ['其他足球', 'Other football'], rugby: ['橄欖球', 'Rugby'], cricket: ['板球', 'Cricket'], fight: ['格鬥', 'Combat sports'], other: ['其他運動', 'Other sports']
};
export const LEAGUE_ORDER = LEAGUE_RES.map(([k]) => k).concat('other');
export const leagueName = (k, lang = 'zh') => LEAGUE_NAMES[k]?.[lang === 'en' ? 1 : 0] || LEAGUE_NAMES.other[lang === 'en' ? 1 : 0];
// A story's league key ('nba', 'cpbl', 'epl', …, 'other'): its own titles
// count double, each outlet's headline once.
export function leagueOf(s) {
  const votes = new Map();
  const vote = (text, w) => {
    const t = String(text || '');
    for (const [k, re] of LEAGUE_RES) if (re.test(t)) votes.set(k, (votes.get(k) || 0) + w);
  };
  for (const t of [s?.title, s?.zh, s?.en]) vote(t, 2);
  for (const it of s?.items || []) vote(it[1], 1);
  let best = 'other';
  let most = 0;
  for (const k of LEAGUE_ORDER) if ((votes.get(k) || 0) > most) (best = k), (most = votes.get(k));
  return best;
}
