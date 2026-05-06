---
read_when:
    - Ви хочете, щоб ваш агент звучав менш шаблонно
    - Ви редагуєте SOUL.md
    - Вам потрібен виразніший характер без шкоди для безпеки чи лаконічності
summary: Використовуйте SOUL.md, щоб надати своєму агенту OpenClaw справжній голос замість типової асистентської шаблонності
title: Посібник із персональності SOUL.md
x-i18n:
    generated_at: "2026-05-06T01:42:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2101c0c7a22ab1fe5acfd0d2d413a002326dca380fc6e020a7d77a242d13c3d7
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` — це місце, де живе голос вашого агента.

OpenClaw додає його у звичайних сеансах, тому він має реальну вагу. Якщо ваш агент
звучить прісно, ухильно або дивно корпоративно, зазвичай потрібно виправити саме цей файл.

## Що має бути в SOUL.md

Додавайте те, що змінює відчуття від спілкування з агентом:

- тон
- погляди
- лаконічність
- гумор
- межі
- типовий рівень прямоти

**Не** перетворюйте його на:

- історію життя
- changelog
- вивантаження політики безпеки
- величезну стіну настрою без поведінкового ефекту

Коротке краще за довге. Чітке краще за розмите.

## Чому це працює

Це узгоджується з рекомендаціями OpenAI щодо промптів:

- Посібник із prompt engineering каже, що високорівнева поведінка, тон, цілі та
  приклади мають бути в шарі інструкцій із високим пріоритетом, а не заховані в
  повідомленні користувача.
- Той самий посібник радить ставитися до промптів як до того, що ви ітеруєте,
  фіксуєте й оцінюєте, а не як до магічного тексту, який пишете один раз і забуваєте.

Для OpenClaw `SOUL.md` є саме цим шаром.

Якщо хочете кращої індивідуальності, пишіть сильніші інструкції. Якщо хочете стабільної
індивідуальності, тримайте їх стислими й версійованими.

Посилання OpenAI:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Ролі повідомлень і дотримання інструкцій](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Промпт Molty

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

## Як виглядає добре

Добрі правила `SOUL.md` звучать так:

- мати позицію
- пропускати зайве
- бути дотепним, коли це доречно
- рано вказувати на погані ідеї
- залишатися стислим, якщо глибина справді не потрібна

Погані правила `SOUL.md` звучать так:

- завжди підтримувати професіоналізм
- надавати всебічну й продуману допомогу
- забезпечувати позитивний і підтримувальний досвід

Другий список — це шлях до безформної каші.

## Одне попередження

Індивідуальність не дає дозволу бути недбалим.

Тримайте `AGENTS.md` для операційних правил. Тримайте `SOUL.md` для голосу, позиції та
стилю. Якщо ваш агент працює у спільних каналах, публічних відповідях або клієнтських
поверхнях, переконайтеся, що тон усе ще відповідає контексту.

Гострота — це добре. Дратівливість — ні.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/uk/concepts/agent-workspace" icon="folder-open">
    Файли робочого простору, які OpenClaw додає в системний промпт.
  </Card>
  <Card title="System prompt" href="/uk/concepts/system-prompt" icon="message-lines">
    Як `SOUL.md` складається в системний промпт для кожного ходу.
  </Card>
  <Card title="SOUL.md template" href="/uk/reference/templates/SOUL" icon="file-lines">
    Початковий шаблон для файлу індивідуальності.
  </Card>
</CardGroup>
