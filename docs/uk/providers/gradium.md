---
read_when:
    - Вам потрібен Gradium для text-to-speech
    - Вам потрібен ключ API Gradium або конфігурація голосу
summary: Використання Gradium text-to-speech в OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-04-24T18:12:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 15
---

Gradium — це вбудований провайдер text-to-speech для OpenClaw. Він може генерувати звичайні аудіовідповіді, Opus-вивід, сумісний із голосовими повідомленнями, і 8 kHz u-law аудіо для телефонних поверхонь.

## Налаштування

Створіть ключ API Gradium, а потім передайте його OpenClaw:

```bash
export GRADIUM_API_KEY="gsk_..."
```

Ви також можете зберегти ключ у конфігурації під `messages.tts.providers.gradium.apiKey`.

## Конфігурація

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

## Голоси

| Назва     | ID голосу          |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Типовий голос: Emma.

## Вивід

- Відповіді у вигляді аудіофайлів використовують WAV.
- Відповіді у вигляді голосових повідомлень використовують Opus і позначаються як сумісні з голосовими повідомленнями.
- Телефонний синтез використовує `ulaw_8000` на 8 kHz.

## Пов’язане

- [Text-to-Speech](/uk/tools/tts)
- [Огляд медіа](/uk/tools/media-overview)
