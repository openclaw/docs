---
read_when:
    - Ви хочете, щоб ваш агент звучав менш шаблонно
    - Ви редагуєте SOUL.md
    - Ви хочете сильнішу особистість, не порушуючи безпечність чи стислість
summary: Використовуйте SOUL.md, щоб дати вашому агенту OpenClaw справжній голос замість загальної асистентської прісності
title: Посібник з особистості SOUL.md
x-i18n:
    generated_at: "2026-04-23T20:51:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0268ef086f272257c83e2147ec1f4fa7772645cdd93cdf59dd4e661a311830a
    source_path: concepts/soul.md
    workflow: 15
---

`SOUL.md` — це місце, де живе голос вашого агента.

OpenClaw додає його в нормальні сесії, тож він справді має вагу. Якщо ваш агент
звучить прісно, обережно або дивно по-корпоративному, зазвичай виправляти треба саме цей файл.

## Що має бути в SOUL.md

Сюди варто поміщати те, що змінює відчуття від спілкування з агентом:

- тон
- погляди
- стислість
- гумор
- межі
- типовий рівень прямолінійності

**Не** перетворюйте його на:

- життєву історію
- changelog
- злив безпекової політики
- гігантську стіну вайбу без жодного поведінкового ефекту

Коротко краще, ніж довго. Чітко краще, ніж розмито.

## Чому це працює

Це узгоджується з рекомендаціями OpenAI щодо prompt engineering:

- Посібник з prompt engineering каже, що поведінка високого рівня, тон, цілі та
  приклади мають бути у високопріоритетному шарі інструкцій, а не заховані в
  повідомленні користувача.
- Той самий посібник радить ставитися до prompt як до того, що ви ітеративно
  вдосконалюєте, фіксуєте й оцінюєте, а не як до магічної прози, яку пишуть один раз і забувають.

Для OpenClaw `SOUL.md` і є таким шаром.

Якщо хочете кращу особистість, пишіть сильніші інструкції. Якщо хочете стабільну
особистість, тримайте їх стислими та версійованими.

Джерела OpenAI:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Prompt Molty

Вставте це у свого агента й дайте йому переписати `SOUL.md`.

Шлях виправлено для робочих просторів OpenClaw: використовуйте `SOUL.md`, а не `http://SOUL.md`.

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## Як виглядає хороший результат

Хороші правила для `SOUL.md` звучать так:

- май свою позицію
- пропускай заповнювачі
- будь дотепним, коли це доречно
- рано вказуй на погані ідеї
- залишайся стислим, якщо глибина справді не потрібна

Погані правила для `SOUL.md` звучать так:

- maintain professionalism at all times
- provide comprehensive and thoughtful assistance
- ensure a positive and supportive experience

Оцей другий список і перетворює все на кашу.

## Одне попередження

Особистість — це не дозвіл бути недбалим.

Тримайте `AGENTS.md` для операційних правил. Тримайте `SOUL.md` для голосу, позиції та
стилю. Якщо ваш агент працює у спільних каналах, публічних відповідях або на
поверхнях для клієнтів, переконайтеся, що тон усе ще відповідає ситуації.

Гострота — це добре. Дратівливість — ні.

## Пов’язана документація

- [Робочий простір агента](/uk/concepts/agent-workspace)
- [System prompt](/uk/concepts/system-prompt)
- [Шаблон SOUL.md](/uk/reference/templates/SOUL)
