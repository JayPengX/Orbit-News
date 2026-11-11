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
    ['https://news-images.tvbs.com.tw/api/v1/image/a.jpg?t=16x9&w=1200&h=675', 's', 'https://news-images.tvbs.com.tw/api/v1/image/a.jpg?t=16x9&w=480&h=270']
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
  const story = { img: 'https://static.politico.com/a.jpg', imgBy: 'politico', alts: [['https://x.akamaized.net/a/index.m3u8', 'nbc'], ['https://ichef.bbci.co.uk/ace/standard/976/a.jpg', 'bbc'], ['https://static.politico.com/a.jpg', 'politico']] };
  assert.deepEqual(picturesOf(story), [['https://static.politico.com/a.jpg', 'politico'], ['https://ichef.bbci.co.uk/ace/standard/976/a.jpg', 'bbc']]);
  assert.deepEqual(picturesOf(story, { light: true }), [['https://ichef.bbci.co.uk/ace/standard/976/a.jpg', 'bbc'], ['https://static.politico.com/a.jpg', 'politico']]);
});
