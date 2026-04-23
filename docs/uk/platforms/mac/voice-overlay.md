---
read_when:
    - Налаштування поведінки голосового оверлею
summary: Життєвий цикл голосового оверлею, коли wake-word і push-to-talk перекриваються
title: Голосовий оверлей
x-i18n:
    generated_at: "2026-04-23T21:01:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca195d981b5b4c63fca84edcaf8a15fde0c1c04972ef0f331d34837d82a75074
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Життєвий цикл голосового оверлею (macOS)

Аудиторія: учасники розробки macOS-застосунку. Мета: зробити голосовий оверлей передбачуваним, коли wake-word і push-to-talk перекриваються.

## Поточний намір

- Якщо оверлей уже видимий через wake-word і користувач натискає гарячу клавішу, сесія гарячої клавіші _усиновлює_ наявний текст замість скидання. Оверлей залишається відкритим, доки гарячу клавішу утримують. Коли користувач відпускає: надсилати, якщо є обрізаний текст, інакше закривати.
- Wake-word сам по собі, як і раніше, автоматично надсилає після тиші; push-to-talk надсилає одразу після відпускання.

## Реалізовано (9 грудня 2025)

- Сесії оверлею тепер несуть token для кожного capture (wake-word або push-to-talk). Оновлення partial/final/send/dismiss/level відкидаються, якщо token не збігається, що запобігає застарілим callback-ам.
- Push-to-talk усиновлює будь-який текст видимого оверлею як префікс (тобто натискання гарячої клавіші, коли wake-оверлей уже відкрито, зберігає текст і додає нову мову). Він очікує до 1.5 с на фінальний транскрипт, перш ніж використовувати fallback до поточного тексту.
- Логування chime/overlay тепер відбувається на рівні `info` в категоріях `voicewake.overlay`, `voicewake.ptt` і `voicewake.chime` (старт сесії, partial, final, send, dismiss, причина chime).

## Наступні кроки

1. **VoiceSessionCoordinator (actor)**
   - Володіє рівно однією `VoiceSession` за раз.
   - API (на основі token-ів): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Відкидає callback-и, які несуть застарілі token-и (це запобігає повторному відкриттю оверлею старими recognizer-ами).
2. **VoiceSession (model)**
   - Поля: `token`, `source` (wakeWord|pushToTalk), committed/volatile text, прапорці chime, таймери (auto-send, idle), `overlayMode` (display|editing|sending), дедлайн cooldown.
3. **Прив’язка оверлею**
   - `VoiceSessionPublisher` (`ObservableObject`) дзеркалить активну сесію у SwiftUI.
   - `VoiceWakeOverlayView` рендериться лише через publisher; він ніколи не мутує напряму глобальні singleton-и.
   - Дії користувача в оверлеї (`sendNow`, `dismiss`, `edit`) викликають callback у coordinator із token-ом сесії.
4. **Уніфікований шлях надсилання**
   - Під час `endCapture`: якщо обрізаний текст порожній → закрити; інакше `performSend(session:)` (один раз відтворює send chime, пересилає, закриває).
   - Push-to-talk: без затримки; wake-word: необов’язкова затримка для auto-send.
   - Після завершення push-to-talk застосовується короткий cooldown до runtime wake, щоб wake-word не тригерився знову одразу.
5. **Логування**
   - Coordinator надсилає логи `.info` у subsystem `ai.openclaw`, категорії `voicewake.overlay` і `voicewake.chime`.
   - Ключові події: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Checklist налагодження

- Потоково переглядайте логи під час відтворення “липкого” оверлею:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Переконайтеся, що активний лише один token сесії; застарілі callback-и coordinator має відкидати.
- Переконайтеся, що відпускання push-to-talk завжди викликає `endCapture` з активним token-ом; якщо текст порожній, очікуйте `dismiss` без chime або send.

## Кроки міграції (рекомендовано)

1. Додайте `VoiceSessionCoordinator`, `VoiceSession` і `VoiceSessionPublisher`.
2. Переробіть `VoiceWakeRuntime`, щоб він створював/оновлював/завершував сесії замість прямої роботи з `VoiceWakeOverlayController`.
3. Переробіть `VoicePushToTalk`, щоб він усиновлював наявні сесії й викликав `endCapture` після відпускання; застосовуйте cooldown runtime.
4. Під’єднайте `VoiceWakeOverlayController` до publisher; приберіть прямі виклики з runtime/PTT.
5. Додайте integration-тести для усиновлення сесії, cooldown і закриття за порожнього тексту.
