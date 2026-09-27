// Mailable postcard: flip the "love letter" card to write on its back; sending
// postmarks the stamp (SDQ + today), slides the card into an envelope and
// flies it off. The letter itself goes out through a prefilled mailto: link.
import { buildLoveLetterMailto, isBudgetValue, postmarkDate, type LoveLetter } from '../../lib/play/postcard';
import { reducedMotion, wait } from './shared';

const STATES = ['is-flipped', 'is-postmarked', 'is-enveloping', 'is-sealed', 'is-flying', 'is-sent'] as const;

export function initPostcard(root: HTMLElement): void {
  const q = <T extends Element>(sel: string): T | null => root.querySelector<T>(sel);
  const flipBtn = q<HTMLButtonElement>('[data-postcard-flip]');
  const unflipBtn = q<HTMLButtonElement>('[data-postcard-unflip]');
  const againBtn = q<HTMLButtonElement>('[data-postcard-again]');
  const form = q<HTMLFormElement>('[data-postcard-form]');
  const front = q<HTMLElement>('[data-postcard-front]');
  const back = q<HTMLElement>('[data-postcard-back]');
  const flipper = q<HTMLElement>('[data-postcard-flipper]');
  const envelope = q<HTMLElement>('[data-postcard-envelope]');
  const dateEl = q<SVGTextElement>('[data-postmark-date]');
  const status = q<HTMLElement>('[data-postcard-status]');
  const fallback = q<HTMLAnchorElement>('[data-postcard-fallback]');
  const sent = q<HTMLElement>('[data-postcard-sent]');
  if (!flipBtn || !unflipBtn || !againBtn || !form || !front || !back || !flipper || !envelope || !sent) return;

  let busy = false;
  const flipDelay = (): number => (reducedMotion() ? 0 : 450);

  const setFlipped = (on: boolean, focus = true): void => {
    root.classList.toggle('is-flipped', on);
    front.inert = on;
    back.inert = !on;
    front.setAttribute('aria-hidden', String(on));
    back.setAttribute('aria-hidden', String(!on));
    if (!focus) return;
    setTimeout(() => (on ? form.querySelector<HTMLInputElement>('input[name="name"]') : flipBtn)?.focus({ preventScroll: true }), flipDelay());
  };

  /** Work out where the card has to shrink/move to sit inside the envelope. */
  const aimAtEnvelope = (): void => {
    const card = flipper.getBoundingClientRect();
    const env = envelope.getBoundingClientRect();
    const scale = Math.min((env.width * 0.86) / card.width, (env.height * 0.9) / card.height);
    const dx = env.left + env.width / 2 - (card.left + card.width / 2);
    const peek = env.top + env.height * 0.42 - (card.top + card.height / 2);
    const inside = env.top + env.height * 0.5 - (card.top + card.height / 2);
    root.style.setProperty('--mail-scale', scale.toFixed(3));
    root.style.setProperty('--mail-x', `${dx.toFixed(1)}px`);
    root.style.setProperty('--mail-y', `${peek.toFixed(1)}px`);
    root.style.setProperty('--mail-y-in', `${inside.toFixed(1)}px`);
  };

  const send = async (letter: LoveLetter): Promise<void> => {
    busy = true;
    const href = buildLoveLetterMailto(letter);
    if (fallback) fallback.href = href;
    if (dateEl) dateEl.textContent = postmarkDate(new Date());
    // Open the mail app inside the user gesture so no browser blocks it.
    window.location.href = href;

    root.classList.add('is-postmarked');
    if (!reducedMotion()) {
      await wait(750);
      aimAtEnvelope();
      root.classList.add('is-enveloping');
      await wait(950);
      root.classList.add('is-sealed');
      await wait(650);
      root.classList.add('is-flying');
      await wait(900);
    }
    back.inert = true;
    root.classList.add('is-sent');
    sent.hidden = false;
    if (status) status.textContent = "It's in the mail — your email app has the letter ready to send.";
    againBtn.focus({ preventScroll: true });
    busy = false;
  };

  flipBtn.hidden = false;
  back.hidden = false;
  setFlipped(false, false);

  flipBtn.addEventListener('click', () => setFlipped(true));
  unflipBtn.addEventListener('click', () => setFlipped(false));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (busy || !form.reportValidity()) return;
    const data = new FormData(form);
    const budget = String(data.get('budget') ?? '');
    void send({
      name: String(data.get('name') ?? ''),
      project: String(data.get('project') ?? ''),
      budget: isBudgetValue(budget) ? budget : '',
    });
  });

  againBtn.addEventListener('click', () => {
    root.classList.remove(...STATES);
    sent.hidden = true;
    form.reset();
    if (status) status.textContent = '';
    setFlipped(false);
  });
}
