---
read_when:
    - Ви змінюєте вбудоване середовище виконання агента або реєстр harness агента
    - Ви реєструєте harness агента з bundled або trusted plugin
    - Вам потрібно зрозуміти, як plugin Codex пов’язаний із постачальниками моделей
sidebarTitle: Agent Harness
summary: Експериментальна поверхня SDK для plugin, що замінюють низькорівневий вбудований виконавець агента
title: Plugin Harness агента
x-i18n:
    generated_at: "2026-04-23T16:05:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec858acedaae8670c730022f8cc700499ac3b95d3d4144584e01051b224fee64
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Plugin Harness агента

**Harness агента** — це низькорівневий виконавець для одного підготовленого ходу агента OpenClaw. Це не постачальник моделей, не канал і не реєстр інструментів.

Використовуйте цю поверхню лише для bundled або trusted native plugin. Контракт усе ще експериментальний, оскільки типи параметрів навмисно віддзеркалюють поточний вбудований runner.

## Коли використовувати harness

Реєструйте harness агента, коли сімейство моделей має власне native session runtime і звичайний транспорт постачальника OpenClaw є хибною абстракцією.

Приклади:

- native coding-agent server, який керує threads і Compaction
- локальний CLI або daemon, який має транслювати native plan/reasoning/tool events
- runtime моделі, якому потрібен власний resume id на додачу до транскрипту сесії OpenClaw

**Не** реєструйте harness лише для додавання нового API LLM. Для звичайних HTTP- або WebSocket- API моделей створіть [plugin постачальника](/uk/plugins/sdk-provider-plugins).

## Чим усе ще керує ядро

Перш ніж буде вибрано harness, OpenClaw уже визначив:

- постачальника й модель
- стан auth runtime
- рівень thinking і бюджет контексту
- файл транскрипту/сесії OpenClaw
- робочий простір, sandbox і політику інструментів
- callback-и відповіді каналу й callback-и streaming
- політику fallback моделі та live-перемикання моделей

Цей поділ навмисний. Harness виконує підготовлену спробу; він не вибирає постачальників, не замінює доставку каналу й не перемикає моделі непомітно.

## Зареєструвати harness

**Імпорт:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Політика вибору

OpenClaw вибирає harness після визначення постачальника/моделі:

1. Перемагає записаний id harness наявної сесії, щоб зміни config/env не перемикали цей транскрипт на інше runtime на льоту.
2. `OPENCLAW_AGENT_RUNTIME=<id>` примусово вибирає зареєстрований harness із цим id для сесій, які ще не закріплено.
3. `OPENCLAW_AGENT_RUNTIME=pi` примусово вибирає вбудований harness PI.
4. `OPENCLAW_AGENT_RUNTIME=auto` запитує в зареєстрованих harness, чи підтримують вони визначеного постачальника/модель.
5. Якщо жоден зареєстрований harness не підходить, OpenClaw використовує PI, якщо fallback PI не вимкнено.

Збої plugin harness відображаються як збої запуску. У режимі `auto` fallback до PI використовується лише тоді, коли жоден зареєстрований plugin harness не підтримує визначеного постачальника/модель. Щойно plugin harness уже взяв запуск на себе, OpenClaw не повторює той самий хід через PI, оскільки це може змінити семантику auth/runtime або дублювати побічні ефекти.

Вибраний id harness зберігається разом з id сесії після вбудованого запуску. Legacy-сесії, створені до закріплення harness, вважаються закріпленими за PI, щойно в них з’являється історія транскрипту. Використовуйте нову/скинуту сесію під час перемикання між PI і native plugin harness. `/status` показує id нетипових harness, наприклад `codex`, поруч із `Fast`; PI залишається прихованим, оскільки це типовий шлях сумісності.

Bundled plugin Codex реєструє `codex` як свій id harness. Ядро розглядає це як звичайний id plugin harness; специфічні для Codex псевдоніми мають належати plugin або config оператора, а не спільному селектору runtime.

## Поєднання постачальника і harness

Більшість harness також мають реєструвати постачальника. Постачальник робить refs моделей, статус auth, метадані моделей і вибір `/model` видимими для решти OpenClaw. Потім harness заявляє підтримку цього постачальника в `supports(...)`.

Bundled plugin Codex дотримується цього шаблону:

- id постачальника: `codex`
- refs моделей для користувача: `codex/gpt-5.4`, `codex/gpt-5.2` або інша модель, повернута app server Codex
- id harness: `codex`
- auth: synthetic availability постачальника, оскільки harness Codex керує native login/session Codex
- запит до app-server: OpenClaw надсилає Codex базовий id моделі й дозволяє harness взаємодіяти з native протоколом app-server

Plugin Codex є додатковим. Звичайні refs `openai/gpt-*` залишаються refs постачальника OpenAI і далі використовують звичайний шлях постачальника OpenClaw. Вибирайте `codex/gpt-*`, якщо вам потрібні auth під керуванням Codex, виявлення моделей Codex, native threads і виконання через app-server Codex. `/model` може перемикатися між моделями Codex, які повертає app server Codex, без потреби в облікових даних постачальника OpenAI.

Налаштування для операторів, приклади префіксів моделей і конфігурації лише для Codex дивіться в [Codex Harness](/uk/plugins/codex-harness).

OpenClaw вимагає Codex app-server `0.118.0` або новішої версії. Plugin Codex перевіряє initialize handshake app-server і блокує старіші або неверсіоновані server, щоб OpenClaw працював лише з тією поверхнею протоколу, з якою його було протестовано.

### Middleware результатів інструментів Codex app-server

Bundled plugin також можуть підключати middleware `tool_result`, специфічний для Codex app-server, через `api.registerCodexAppServerExtensionFactory(...)`, коли їхній manifest оголошує `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
Це seam trusted-plugin для асинхронних перетворень результатів інструментів, які мають виконуватися всередині native harness Codex до того, як вивід інструмента буде спроєктовано назад у транскрипт OpenClaw.

### Режим native harness Codex

Bundled harness `codex` — це native-режим Codex для вбудованих ходів агента OpenClaw. Спочатку увімкніть bundled plugin `codex` і додайте `codex` до `plugins.allow`, якщо у вашій config використовується обмежувальний allowlist. Це відрізняється від `openai-codex/*`:

- `openai-codex/*` використовує OAuth ChatGPT/Codex через звичайний шлях постачальника OpenClaw.
- `codex/*` використовує bundled-постачальника Codex і маршрутизує хід через app-server Codex.

Коли цей режим працює, Codex керує native thread id, поведінкою resume, Compaction і виконанням app-server. OpenClaw усе ще керує chat-каналом, видимим дзеркалом транскрипту, політикою інструментів, погодженнями, доставкою медіа та вибором сесії. Використовуйте `embeddedHarness.runtime: "codex"` разом із `embeddedHarness.fallback: "none"`, коли потрібно довести, що запуск може взяти на себе лише шлях app-server Codex. Ця config є лише запобіжником вибору: збої app-server Codex і так одразу завершуються помилкою без повторної спроби через PI.

## Вимкнення fallback до PI

Типово OpenClaw запускає вбудованих агентів із `agents.defaults.embeddedHarness`, установленим у `{ runtime: "auto", fallback: "pi" }`. У режимі `auto` зареєстровані plugin harness можуть взяти на себе пару постачальник/модель. Якщо жоден не підходить, OpenClaw повертається до PI.

Установіть `fallback: "none"`, коли потрібно, щоб за відсутності вибору plugin harness виконання завершувалося помилкою замість використання PI. Збої вже вибраного plugin harness і так завершуються жорсткою помилкою. Це не блокує явний `runtime: "pi"` або `OPENCLAW_AGENT_RUNTIME=pi`.

Для вбудованих запусків лише з Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Якщо ви хочете, щоб будь-який зареєстрований plugin harness міг узяти на себе відповідні моделі, але ніколи не хочете, щоб OpenClaw непомітно повертався до PI, залиште `runtime: "auto"` і вимкніть fallback:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Перевизначення на рівні агента використовують ту саму форму:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` усе ще перевизначає налаштоване runtime. Використовуйте `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб вимкнути fallback до PI через середовище.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Якщо fallback вимкнено, сесія завершується помилкою рано, коли запитаний harness не зареєстровано, не підтримує визначеного постачальника/модель або завершується помилкою до появи побічних ефектів ходу. Це навмисно для розгортань лише з Codex і для live-тестів, які мають доводити, що шлях app-server Codex справді використовується.

Цей параметр керує лише вбудованим harness агента. Він не вимикає маршрутизацію моделей, специфічну для постачальників, для зображень, відео, музики, TTS, PDF чи інших типів.

## Native-сесії та дзеркало транскрипту

Harness може зберігати native session id, thread id або daemon-side resume token.
Явно пов’язуйте цю прив’язку із сесією OpenClaw і продовжуйте дзеркалити видимий користувачеві вивід assistant/tool у транскрипт OpenClaw.

Транскрипт OpenClaw залишається шаром сумісності для:

- видимої в каналі історії сесії
- пошуку та індексації транскриптів
- повернення до вбудованого harness PI на пізнішому ході
- узагальненої поведінки `/new`, `/reset` і видалення сесій

Якщо ваш harness зберігає sidecar-прив’язку, реалізуйте `reset(...)`, щоб OpenClaw міг очистити її, коли відповідну сесію OpenClaw скидають.

## Результати інструментів і медіа

Ядро формує список інструментів OpenClaw і передає його в підготовлену спробу.
Коли harness виконує динамічний виклик інструмента, повертайте результат інструмента назад через форму результату harness замість того, щоб самостійно надсилати медіа в канал.

Це зберігає текст, зображення, відео, музику, TTS, погодження та вивід інструментів обміну повідомленнями на тому самому шляху доставки, що й для запусків на базі PI.

## Поточні обмеження

- Публічний шлях імпорту є узагальненим, але деякі псевдоніми типів спроб/результатів і далі містять назви `Pi` для сумісності.
- Установлення сторонніх harness є експериментальним. Віддавайте перевагу plugin постачальників, доки вам не знадобиться native session runtime.
- Перемикання harness між ходами підтримується. Не перемикайте harness посеред ходу після того, як уже почалися native tools, погодження, текст assistant або надсилання повідомлень.

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview)
- [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)
- [Plugin постачальників](/uk/plugins/sdk-provider-plugins)
- [Codex Harness](/uk/plugins/codex-harness)
- [Постачальники моделей](/uk/concepts/model-providers)
