---
read_when:
    - Вы хотите, чтобы ваш агент звучал менее шаблонно
    - Вы редактируете SOUL.md
    - Вам нужна более выраженная индивидуальность без ущерба для безопасности или краткости
summary: Используйте SOUL.md, чтобы придать вашему агенту OpenClaw настоящий голос вместо безликого типового текста ассистента
title: Руководство по личности SOUL.md
x-i18n:
    generated_at: "2026-06-28T22:53:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` — это место, где живет голос вашего агента.

OpenClaw внедряет его в обычные сессии, поэтому у него есть реальный вес. Если ваш агент
звучит пресно, уклончиво или странно корпоративно, обычно исправлять нужно именно этот файл.

## Что должно быть в SOUL.md

Поместите туда то, что меняет ощущение от общения с агентом:

- тон
- мнения
- краткость
- юмор
- границы
- уровень прямоты по умолчанию

**Не** превращайте его в:

- историю жизни
- changelog
- сводку политики безопасности
- огромную стену вайбов без поведенческого эффекта

Короткое лучше длинного. Точное лучше расплывчатого.

## Почему это работает

Это согласуется с рекомендациями OpenAI по промптам:

- Руководство по проектированию промптов говорит, что высокоуровневое поведение, тон, цели и
  примеры должны быть в высокоприоритетном слое инструкций, а не скрыты в
  пользовательском сообщении.
- То же руководство рекомендует относиться к промптам как к тому, что вы итеративно улучшаете,
  фиксируете и оцениваете, а не как к магической прозе, которую пишут один раз и забывают.

Для OpenClaw `SOUL.md` — это именно такой слой.

Если хотите более выразительную личность, пишите более сильные инструкции. Если хотите стабильную
личность, держите их краткими и версионированными.

Ссылки OpenAI:

- [Проектирование промптов](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Роли сообщений и следование инструкциям](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Промпт Molty

Вставьте это в своего агента и дайте ему переписать `SOUL.md`.

Путь зафиксирован для рабочих пространств OpenClaw: используйте `SOUL.md`, а не `http://SOUL.md`.

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

## Как выглядит хороший результат

Хорошие правила `SOUL.md` звучат так:

- иметь позицию
- пропускать воду
- шутить, когда это уместно
- заранее указывать на плохие идеи
- оставаться кратким, если глубина не дает реальной пользы

Плохие правила `SOUL.md` звучат так:

- всегда сохранять профессионализм
- предоставлять всестороннюю и вдумчивую помощь
- обеспечивать позитивный и поддерживающий опыт

Второй список — рецепт каши.

## Одно предупреждение

Личность не дает права быть небрежным.

Держите `AGENTS.md` для операционных правил. Держите `SOUL.md` для голоса, позиции и
стиля. Если ваш агент работает в общих каналах, публичных ответах или клиентских
поверхностях, убедитесь, что тон все еще соответствует ситуации.

Острота — это хорошо. Раздражение — нет.

## Связано

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/ru/concepts/agent-workspace" icon="folder-open">
    Файлы рабочего пространства, которые OpenClaw внедряет в контекст модели.
  </Card>
  <Card title="System prompt" href="/ru/concepts/system-prompt" icon="message-lines">
    Как `SOUL.md` включается в runtime-контекст OpenClaw и Codex.
  </Card>
  <Card title="SOUL.md template" href="/ru/reference/templates/SOUL" icon="file-lines">
    Стартовый шаблон для файла личности.
  </Card>
</CardGroup>
