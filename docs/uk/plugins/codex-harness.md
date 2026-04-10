---
read_when:
    - Ви хочете використовувати комплектний harness app-server Codex
    - Вам потрібні посилання на моделі Codex і приклади конфігурації
    - Ви хочете вимкнути резервний перехід на PI для розгортань лише з Codex
summary: Запускайте вбудовані ходи агента OpenClaw через комплектний harness app-server Codex
title: Harness Codex
x-i18n:
    generated_at: "2026-04-10T21:05:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1babe5b3498eb2a963f3e66a46975bd261886398499453d0d240e1fbc309bf4
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness Codex

Комплектний плагін `codex` дає OpenClaw змогу запускати вбудовані ходи агента через
app-server Codex замість вбудованого harness PI.

Використовуйте це, коли хочете, щоб Codex керував низькорівневою сесією агента: виявленням
моделей, нативним відновленням потоку, нативною компакцією та виконанням app-server.
OpenClaw і далі керує чат-каналами, файлами сесій, вибором моделі, інструментами,
погодженнями, доставленням медіа та видимим дзеркалом транскрипту.

Harness вимкнений за замовчуванням. Він вибирається лише тоді, коли плагін `codex`
увімкнено і визначена модель є моделлю `codex/*`, або коли ви явно
примусово задаєте `embeddedHarness.runtime: "codex"` чи `OPENCLAW_AGENT_RUNTIME=codex`.
Якщо ви ніколи не налаштовуєте `codex/*`, наявні запуски PI, OpenAI, Anthropic, Gemini, local
і custom-provider зберігають поточну поведінку.

## Виберіть правильний префікс моделі

OpenClaw має окремі маршрути для доступу у формі OpenAI та Codex:

| Посилання на модель   | Шлях runtime                                 | Використовуйте, коли                                                     |
| --------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`      | Провайдер OpenAI через інфраструктуру OpenClaw/PI | Вам потрібен прямий доступ до OpenAI Platform API через `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.4` | Провайдер OpenAI Codex OAuth через PI       | Вам потрібен ChatGPT/Codex OAuth без harness app-server Codex.           |
| `codex/gpt-5.4`       | Комплектний провайдер Codex плюс harness Codex | Вам потрібне нативне виконання app-server Codex для вбудованого ходу агента. |

Harness Codex обробляє лише посилання на моделі `codex/*`. Наявні посилання `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local і custom provider зберігають
свої звичайні шляхи.

## Вимоги

- OpenClaw із доступним комплектним плагіном `codex`.
- App-server Codex версії `0.118.0` або новішої.
- Автентифікація Codex, доступна процесу app-server.

Плагін блокує старіші або неверсійовані узгодження app-server. Це дає змогу
OpenClaw працювати на поверхні протоколу, з якою його було протестовано.

Для live- і Docker smoke-тестів автентифікація зазвичай надходить із `OPENAI_API_KEY`, а також
необов’язкових файлів Codex CLI, таких як `~/.codex/auth.json` і
`~/.codex/config.toml`. Використовуйте ті самі матеріали автентифікації, що й ваш локальний app-server Codex.

## Мінімальна конфігурація

Використовуйте `codex/gpt-5.4`, увімкніть комплектний плагін і примусово задайте harness `codex`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Якщо у вашій конфігурації використовується `plugins.allow`, додайте туди також `codex`:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Установлення `agents.defaults.model` або моделі агента в `codex/<model>` також
автоматично вмикає комплектний плагін `codex`. Явний запис плагіна все одно
корисний у спільних конфігураціях, оскільки робить намір розгортання очевидним.

## Додайте Codex без заміни інших моделей

Залишайте `runtime: "auto"`, якщо хочете використовувати Codex для моделей `codex/*`, а PI — для
усього іншого:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

За такої форми:

- `/model codex` або `/model codex/gpt-5.4` використовує harness app-server Codex.
- `/model gpt` або `/model openai/gpt-5.4` використовує шлях провайдера OpenAI.
- `/model opus` використовує шлях провайдера Anthropic.
- Якщо вибрано не-Codex модель, PI залишається harness сумісності.

## Розгортання лише з Codex

Вимкніть резервний перехід на PI, якщо вам потрібно підтвердити, що кожен вбудований хід агента використовує
harness Codex:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Перевизначення через змінні середовища:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Якщо резервний перехід вимкнено, OpenClaw завершує роботу на ранньому етапі, якщо плагін Codex вимкнено,
запитана модель не є посиланням `codex/*`, app-server застарілий або
app-server не вдається запустити.

## Codex для окремого агента

Ви можете зробити одного агента лише з Codex, тоді як типовий агент зберігатиме звичайний
автовибір:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Використовуйте звичайні команди сесії, щоб перемикати агентів і моделі. `/new` створює нову
сесію OpenClaw, а harness Codex створює або відновлює свій побічний потік app-server
за потреби. `/reset` очищає прив’язку сесії OpenClaw для цього потоку.

## Виявлення моделей

За замовчуванням плагін Codex запитує в app-server доступні моделі. Якщо
виявлення не вдається або перевищує час очікування, використовується комплектний резервний каталог:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

Ви можете налаштувати виявлення в `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Вимкніть виявлення, якщо хочете, щоб під час запуску не виконувалася перевірка Codex і використовувався
резервний каталог:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Інструменти, медіа та компакція

Harness Codex змінює лише низькорівневий виконавець вбудованого агента.

OpenClaw, як і раніше, формує список інструментів і отримує динамічні результати інструментів від
harness. Текст, зображення, відео, музика, TTS, погодження та вивід інструментів повідомлень
і далі проходять звичайним шляхом доставлення OpenClaw.

Коли вибрана модель використовує harness Codex, нативна компакція потоку
делегується app-server Codex. OpenClaw зберігає дзеркало транскрипту для історії каналу,
пошуку, `/new`, `/reset` і майбутнього перемикання моделі або harness.

Генерація медіа не потребує PI. Генерація зображень, відео, музики, PDF, TTS і розуміння медіа
і далі використовують відповідні налаштування провайдера/моделі, такі як
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` і
`messages.tts`.

## Усунення проблем

**Codex не з’являється в `/model`:** увімкніть `plugins.entries.codex.enabled`,
установіть посилання на модель `codex/*` або перевірте, чи `plugins.allow` не виключає `codex`.

**OpenClaw повертається до PI:** установіть `embeddedHarness.fallback: "none"` або
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` під час тестування.

**App-server відхиляється:** оновіть Codex, щоб узгодження app-server
повідомляло версію `0.118.0` або новішу.

**Виявлення моделей працює повільно:** зменште `plugins.entries.codex.config.discovery.timeoutMs`
або вимкніть виявлення.

**Не-Codex модель використовує PI:** це очікувана поведінка. Harness Codex обробляє лише
посилання на моделі `codex/*`.

## Пов’язане

- [Плагіни Agent Harness](/uk/plugins/sdk-agent-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Тестування](/uk/help/testing#live-codex-app-server-harness-smoke)
