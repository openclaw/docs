---
read_when:
    - Ви хочете, щоб ваш агент звучав менш шаблонно
    - Ви редагуєте SOUL.md
    - Ви хочете виразнішого характеру без шкоди для безпеки чи лаконічності
summary: Використовуйте SOUL.md, щоб надати своєму агенту OpenClaw справжній голос замість шаблонної асистентської води
title: Посібник з особистості SOUL.md
x-i18n:
    generated_at: "2026-06-27T17:29:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` — це місце, де живе голос вашого агента.

OpenClaw додає його у звичайні сесії, тому він справді має вагу. Якщо ваш агент
звучить прісно, ухильно або дивно корпоративно, зазвичай виправляти треба саме цей файл.

## Що має бути в SOUL.md

Додайте те, що змінює відчуття від розмови з агентом:

- тон
- позиції
- лаконічність
- гумор
- межі
- типовий рівень прямоти

**Не** перетворюйте його на:

- історію життя
- журнал змін
- звалище політик безпеки
- величезну стіну настроїв без поведінкового ефекту

Коротке краще за довге. Чітке краще за розмите.

## Чому це працює

Це узгоджується з настановами OpenAI щодо промптів:

- Посібник з інженерії промптів каже, що високорівнева поведінка, тон, цілі та
  приклади мають бути в шарі інструкцій із високим пріоритетом, а не заховані в
  репліці користувача.
- Той самий посібник рекомендує ставитися до промптів як до того, що ви ітеруєте,
  фіксуєте та оцінюєте, а не як до магічного тексту, який пишуть один раз і забувають.

Для OpenClaw `SOUL.md` є саме таким шаром.

Якщо хочете кращу особистість, пишіть сильніші інструкції. Якщо хочете стабільну
особистість, тримайте їх стислими й версіонованими.

Посилання OpenAI:

- [Інженерія промптів](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Ролі повідомлень і дотримання інструкцій](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Промпт Molty

Вставте це у свого агента й дозвольте йому переписати `SOUL.md`.

Шлях зафіксовано для робочих просторів OpenClaw: використовуйте `SOUL.md`, а не `http://SOUL.md`.

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

- майте позицію
- пропускайте наповнювач
- жартуйте, коли це доречно
- рано вказуйте на погані ідеї
- залишайтеся стислими, якщо глибина справді не корисна

Погані правила `SOUL.md` звучать так:

- завжди підтримуйте професійність
- надавайте вичерпну й вдумливу допомогу
- забезпечуйте позитивний і підтримувальний досвід

Саме другий список дає кашу.

## Одне застереження

Особистість — це не дозвіл бути недбалим.

Тримайте `AGENTS.md` для операційних правил. Тримайте `SOUL.md` для голосу, позиції та
стилю. Якщо ваш агент працює у спільних каналах, публічних відповідях або клієнтських
поверхнях, переконайтеся, що тон усе ще відповідає ситуації.

Гострота — це добре. Дратівливість — ні.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/uk/concepts/agent-workspace" icon="folder-open">
    Файли робочого простору, які OpenClaw додає в контекст моделі.
  </Card>
  <Card title="System prompt" href="/uk/concepts/system-prompt" icon="message-lines">
    Як `SOUL.md` компонують у runtime-контекст OpenClaw і Codex.
  </Card>
  <Card title="SOUL.md template" href="/uk/reference/templates/SOUL" icon="file-lines">
    Початковий шаблон для файлу особистості.
  </Card>
</CardGroup>
