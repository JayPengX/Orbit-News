// 我的追蹤 (Jay 11-13: News like Sports' follows): what this person follows
// in News (people and any words, topics, outlets: lib/reading.mjs keys),
// each let go with its ✕ (復原 in the toast, as Sports' 我的設定); every
// topic a chip to follow at a tap; a field to follow a name; what Orbit
// Securities and Sports bring in (you change those there). And the one
// follow button every screen uses (the kit's, Sports' look).
import { h, sheet, empty } from '#kit/ui.mjs';
import * as kitUI from '#kit/ui.mjs';
import * as kitNews from '#kit/news-outlets.mjs';
import { state, hooks, W, isFollowing, outletName, outletMark, topicName } from '../shell.mjs';
import { followKey, followsOf } from '../lib/reading.mjs';
import { fold } from '../lib/search.mjs';

// A follow button for one key (`+ 追蹤` / `✓ 追蹤中`): the kit's, or the
// same pill drawn here on a phone still on an older kit.
export function followPill(key, { label, on } = {}) {
  const toggle = () => hooks.follow(key, !isFollowing(key));
  if (kitUI.followButton) return kitUI.followButton(() => isFollowing(key), toggle, { ...(label ? { label } : {}), ...(on ? { on } : {}) });
  const b = h('button', { type: 'button', class: 'q-follow' });
  const paint = () => {
    const yes = isFollowing(key);
    b.textContent = yes ? `✓ ${on || W('追蹤中', 'Following')}` : `+ ${label || W('追蹤', 'Follow')}`;
    b.classList.toggle('on', yes);
  };
  b.addEventListener('click', e => (e.stopPropagation(), toggle(), paint()));
  paint();
  return b;
}

// Words followed as a person or a name: the same words once, however typed.
export function wordsKey(q) {
  const t = String(q || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  if (!t) return '';
  const have = followsOf(state.log).find(f => f.kind === 'w' && fold(f.id) === fold(t));
  return have ? have.key : followKey('w', t);
}

// A follow's name, in the page's language.
export const followName = f => (f.kind === 't' ? topicName(f.id, 'tw') : f.kind === 'o' ? outletName(f.id) : f.id);

const TOPICS = () => (kitNews.TOPICS || []).filter(t => t.on !== false).map(t => t.id);

export function openFollows() {
  const body = h('div', { class: 'nw-follows' });
  const letGo = f => {
    hooks.follow(f.key, false);
    paint();
    kitUI.toast?.(W(`已取消追蹤${followName(f)}`, `Unfollowed ${followName(f)}`), { action: { label: W('復原', 'Undo'), onTap: () => (hooks.follow(f.key, true), paint()) } });
  };
  const row = (f, icon) =>
    h('div', { class: 'q-ritem nw-follow-row' }, [
      icon,
      h('span', { class: 'q-ritem-text' }, [h('span', { class: 'q-ritem-title', text: followName(f) })]),
      h('button', { type: 'button', class: 'nw-follow-x', 'aria-label': W(`取消追蹤${followName(f)}`, `Unfollow ${followName(f)}`), html: kitUI.icons?.x || '✕', onclick: () => letGo(f) })
    ]);
  // (A name typed and sent: followed, the field emptied.)
  const field = kitUI.search({
    placeholder: W('追蹤人物、公司或關鍵字', 'Follow a person, company or words'),
    onSubmit: v => {
      const key = wordsKey(v);
      if (!key) return;
      hooks.follow(key, true);
      field.input.value = '';
      paint();
    }
  });
  const paint = () => {
    const all = followsOf(state.log);
    const words = all.filter(f => f.kind === 'w');
    const outlets = all.filter(f => f.kind === 'o');
    const family = state.interests || [];
    body.replaceChildren(...[
      h('section', { class: 'nw-follow-sec' }, [
        h('h3', { class: 'nw-story-h', text: W('人物與關鍵字', 'People and words') }),
        field,
        words.length ? h('div', { class: 'q-list' }, words.map(f => row(f, h('span', { class: 'q-tile nw-follow-ico', 'aria-hidden': 'true', html: kitUI.icons?.search || '' })))) : null
      ]),
      h('section', { class: 'nw-follow-sec' }, [
        h('h3', { class: 'nw-story-h', text: W('主題', 'Topics') }),
        h('div', { class: 'q-chips nw-follow-topics' }, TOPICS().map(t => {
          const key = followKey('t', t);
          const on = isFollowing(key);
          return h('button', { type: 'button', class: `q-chip${on ? ' on' : ''}`, 'aria-pressed': String(on), text: topicName(t, 'tw'), onclick: () => (hooks.follow(key, !on), paint()) });
        }))
      ]),
      h('section', { class: 'nw-follow-sec' }, [
        h('h3', { class: 'nw-story-h', text: W('媒體', 'Outlets') }),
        outlets.length ? h('div', { class: 'q-list' }, outlets.map(f => row(f, outletMark(f.id, 28)))) : h('p', { class: 'nw-lede', text: W('在「媒體」點一家就能追蹤。', 'Follow one from any outlet’s page in Outlets.') })
      ]),
      family.length
        ? h('section', { class: 'nw-follow-sec' }, [
            h('h3', { class: 'nw-story-h', text: W('來自其他 Orbit', 'From your other Orbit apps') }),
            h('div', { class: 'q-chips' }, family.map(i => h('span', { class: 'q-chip nw-follow-family', text: `${i.kind === 'hold' ? W('持股', 'Held') : W('追蹤', 'Following')} ${i.label}` })))
          ])
        : null
    ].filter(Boolean));
  };
  paint();
  sheet({ title: W('我的追蹤', 'Following'), cls: 'nw-follows-sheet', body: [body] });
}

// Nothing followed yet: one line, and the way in.
export const noFollows = () => empty({ icon: 'star', title: W('還沒追蹤', 'Nothing followed yet'), action: { label: W('選要追蹤的', 'Choose what to follow'), onTap: openFollows } });
