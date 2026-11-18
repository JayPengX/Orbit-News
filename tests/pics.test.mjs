// An outlet's picture asked at the size it's shown (lib/pics.mjs), and the
// order a story's pictures are tried in (lib/stories.mjs picturesOf).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sized, heavy, notPicture } from '../public/lib/pics.mjs';
import { picturesOf } from '../public/lib/stories.mjs';

test("each outlet's own smaller size, from its own server", () => {
  const cases = [
    ['https://i.ytimg.com/vi/KqsT5eZjkpw/hqdefault.jpg', 's', 'https://i.ytimg.com/vi/KqsT5eZjkpw/mqdefault.jpg'],
    ['https://i.ytimg.com/vi/KqsT5eZjkpw/hqdefault.jpg', 'l', 'https://i.ytimg.com/vi/KqsT5eZjkpw/hqdefault.jpg'],
    ['https://storage.ctinews.com/compression/files/default/cut-1-a.PNG', 's', 'https://ctinews.com/_ipx/w_480&f_webp&q_80/https://storage.ctinews.com/compression/files/default/cut-1-a.PNG'],
    ['https://attach.setn.com/newsimages/2026/11/10/5783055-PH.jpg', 's', 'https://attach.setn.com/newsimages/2026/11/10/5783055-XXL.jpg'],
    ['https://v3-statics.mirrormedia.mg/images/abc-w1600.jpg', 'l', 'https://v3-statics.mirrormedia.mg/images/abc-w800.jpg'],
    ['https://static01.nyt.com/images/2026/11/10/x/x-mediumSquareAt3X.jpg', 's', 'https://static01.nyt.com/images/2026/11/10/x/x-articleLarge.jpg'],
    ['https://ichef.bbci.co.uk/ace/standard/976/cpsprodpb/5391/live/a.jpg', 's', 'https://ichef.bbci.co.uk/ace/standard/480/cpsprodpb/5391/live/a.jpg'],
    ['https://static.independent.co.uk/2026/a.jpeg?width=1200&auto=webp', 's', 'https://static.independent.co.uk/2026/a.jpeg?width=480&auto=webp'],
    ['https://nypost.com/wp-content%2Fuploads%2Fa.jpg?w%3D1024', 's', 'https://nypost.com/wp-content%2Fuploads%2Fa.jpg?w=480'],
    ['https://a57.foxnews.com/static.foxnews.com/foxnews.com/content/uploads/2026/11/931/523/a.jpg?ve=1&tl=1', 's', 'https://a57.foxnews.com/static.foxnews.com/foxnews.com/content/uploads/2026/11/480/270/a.jpg?ve=1&tl=1'],
    ['https://i.insider.com/6af392e1?format=jpeg', 's', 'https://i.insider.com/6af392e1?format=jpeg&width=480'],
    ['https://npr.brightspotcdn.com/dims3/default/strip/false/crop/6000x4000+0+0/resize/6000x4000!/quality/85/?url=x', 's', 'https://npr.brightspotcdn.com/dims3/default/strip/false/crop/6000x4000+0+0/resize/480/quality/85/?url=x'],
    ['https://news-images.tvbs.com.tw/api/v1/image/a.jpg?t=16x9&w=1200&h=675', 's', 'https://news-images.tvbs.com.tw/api/v1/image/a.jpg?t=16x9&w=480&h=270'],
    // (11-18: the ones a first opening spent most on: 壹電視's 2.2 MB PNG among them.)
    ['https://image.nexttv.com.tw/material/news/img/2026/11/20261117220015WKjr.png', 's', 'https://image.nexttv.com.tw/material/news/img/480x270/2026/11/20261117220015WKjr.png'],
    ['https://image.nexttv.com.tw/material/news/img/2026/11/20261117220015WKjr.png', 'l', 'https://image.nexttv.com.tw/material/news/img/960x540/2026/11/20261117220015WKjr.png'],
    ['https://images2.minutemediacdn.com/image/upload/c_crop,w_4052,h_2279,x_210,y_242/c_fill,w_2880,ar_16:9,f_auto,q_auto,g_auto/images/a.jpg', 's', 'https://images2.minutemediacdn.com/image/upload/c_crop,w_4052,h_2279,x_210,y_242/c_fill,w_480,ar_16:9,f_auto,q_auto,g_auto/images/a.jpg'],
    ['https://imgcdn.cna.com.tw/www/WebPhotos/1024/20261117/1024x768_wmky_0_C20261117000077.jpg', 's', 'https://imgcdn.cna.com.tw/www/WebPhotos/400/20261117/1024x768_wmky_0_C20261117000077.jpg'],
    ['https://img.ltn.com.tw/Upload/news/600/2026/11/17/76.jpg', 's', 'https://img.ltn.com.tw/Upload/news/250/2026/11/17/76.jpg'],
    ['https://pgw.udn.com.tw/gw/photo.php?u=https://uc.udn.com.tw/photo/t3/2026/11/17/35527375.jpg&M=1&s=Y&x=0&y=62&sw=1280&sh=854&exp=3600', 's', 'https://pgw.udn.com.tw/gw/photo.php?u=https%3A%2F%2Fuc.udn.com.tw%2Fphoto%2Ft3%2F2026%2F11%2F17%2F35527375.jpg&M=1&s=Y&x=0&y=62&sw=1280&sh=854&exp=3600&w=480'],
    ['https://img.theepochtimes.com/assets/uploads/2026/04/14/id6011617-Vance-1080x720.jpg', 's', 'https://img.theepochtimes.com/assets/uploads/2026/04/14/id6011617-Vance-600x400.jpg'],
    ['https://i.cbc.ca/ais/7e82f1df,1794854743123/full/max/0/default.jpg?im=Crop%2Crect%3D%280%2C0%2C1280%2C720%29%3B', 's', 'https://i.cbc.ca/ais/7e82f1df,1794854743123/full/max/0/default.jpg?im=Crop%2Crect%3D%280%2C0%2C1280%2C720%29%3BResize%3D480'],
    ['https://i0.wp.com/asiatimes.com/wp-content/uploads/2026/11/download.jpeg?fit=1024%2C689&ssl=1', 's', 'https://i0.wp.com/asiatimes.com/wp-content/uploads/2026/11/download.jpeg?ssl=1&w=480']
  ];
  for (const [src, size, want] of cases) assert.equal(sized(src, size), want, src);
});

test('an outlet with no smaller size, or an address not in its shape, is asked as it is', () => {
  for (const src of ['https://www.cts.com.tw/data/news/photo/cts/202611/1.jpg', 'https://i.guim.co.uk/img/media/a/master/1.jpg?width=700&s=sig', 'https://a57.foxnews.com/static.foxnews.com/a.jpg', 'http://insecure.example/a.jpg', 'not a url', ''])
    assert.equal(sized(src, 's'), src);
  // (Fox's already small enough: never asked bigger.)
  assert.equal(sized('https://a57.foxnews.com/x/uploads/2026/11/320/180/a.jpg', 'l'), 'https://a57.foxnews.com/x/uploads/2026/11/320/180/a.jpg');
});

test("a story's pictures: a video stream left out, the megabyte ones last in a row", () => {
  assert.ok(notPicture('https://x.akamaized.net/a/index.m3u8'));
  assert.ok(heavy('https://static.politico.com/86/a.jpg'));
  assert.ok(heavy('https://media.zenfs.com/en/last_word_on_sports_293/a.jpg'));
  const story = { img: 'https://static.politico.com/a.jpg', imgBy: 'politico', alts: [['https://x.akamaized.net/a/index.m3u8', 'nbc'], ['https://ichef.bbci.co.uk/ace/standard/976/a.jpg', 'bbc'], ['https://static.politico.com/a.jpg', 'politico']] };
  assert.deepEqual(picturesOf(story), [['https://static.politico.com/a.jpg', 'politico'], ['https://ichef.bbci.co.uk/ace/standard/976/a.jpg', 'bbc']]);
  assert.deepEqual(picturesOf(story, { light: true }), [['https://ichef.bbci.co.uk/ace/standard/976/a.jpg', 'bbc'], ['https://static.politico.com/a.jpg', 'politico']]);
});
