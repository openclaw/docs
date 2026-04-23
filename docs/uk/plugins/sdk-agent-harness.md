---
read_when:
    - Ви змінюєте вбудований runtime агента або реєстр каркаса.
    - Ви реєструєте каркас агента з bundled або trusted plugin.
    - Вам потрібно зрозуміти, як plugin Codex пов’язаний із постачальниками моделей.
sidebarTitle: Agent Harness
summary: Експериментальна поверхня SDK для plugin, які замінюють низькорівневий вбудований виконавець агента.
title: Плагіни каркаса агента
x-i18n:
    generated_at: "2026-04-23T20:06:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0c0bd3ef17ce7609a50354eb3bd717ddc45102eaf3ebca022c6861169b0753c
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Плагіни каркаса агента

**Каркас агента** — це низькорівневий виконавець одного підготовленого ходу
агента OpenClaw. Це не постачальник моделей, не channel і не реєстр інструментів.

Використовуйте цю поверхню лише для bundled або trusted native plugin. Контракт
усе ще є експериментальним, оскільки типи параметрів навмисно віддзеркалюють поточний
вбудований виконавець.

## Коли використовувати каркас

Реєструйте каркас агента, коли сімейство моделей має власний native session
runtime і звичайний транспорт provider OpenClaw є хибною абстракцією.

Приклади:

- native-сервер агента для програмування, який керує threads і Compaction
- локальний CLI або daemon, який має транслювати native-події plan/reasoning/tool
- runtime моделі, якому потрібен власний resume id на додачу до transcript
  session OpenClaw

**Не** реєструйте каркас лише для того, щоб додати новий API LLM. Для звичайних
HTTP- або WebSocket-API моделей створіть [plugin provider](/uk/plugins/sdk-provider-plugins).

## Що core усе ще контролює

Перед тим як буде вибрано каркас, OpenClaw уже визначив:

- provider і модель
- стан автентифікації runtime
- рівень thinking і бюджет контексту
- файл transcript/session OpenClaw
- workspace, sandbox і політику інструментів
- callback-функції відповіді channel і callback-функції streaming
- політику fallback моделі та live-перемикання моделей

Цей поділ є навмисним. Каркас виконує підготовлену спробу; він не вибирає
provider, не замінює доставку channel і не перемикає моделі непомітно.

## Зареєструвати каркас

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

OpenClaw вибирає каркас після визначення provider/моделі:

1. Ідентифікатор каркаса, записаний в наявній session, має пріоритет, щоб зміни config/env не
   перемикали цей transcript на інший runtime гарячим способом.
2. `OPENCLAW_AGENT_RUNTIME=<id>` примусово вибирає зареєстрований каркас із цим id для
   session, які ще не закріплено.
3. `OPENCLAW_AGENT_RUNTIME=pi` примусово вибирає вбудований каркас PI.
4. `OPENCLAW_AGENT_RUNTIME=auto` запитує зареєстровані каркаси, чи підтримують вони
   визначені provider/модель.
5. Якщо жоден зареєстрований каркас не підходить, OpenClaw використовує PI, якщо fallback PI
   не вимкнено.

Збої каркасів plugin відображаються як збої виконання. У режимі `auto` fallback на PI
використовується лише тоді, коли жоден зареєстрований каркас plugin не підтримує визначені
provider/модель. Щойно каркас plugin узяв виконання на себе, OpenClaw не
повторює той самий хід через PI, оскільки це може змінити семантику auth/runtime
або дублювати побічні ефекти.

Вибраний id каркаса зберігається разом з id session після вбудованого виконання.
Старі session, створені до появи закріплення каркасів, вважаються закріпленими за PI, щойно
вони мають історію transcript. Використовуйте нову/скинуту session під час перемикання між PI та
native-каркасом plugin. `/status` показує нестандартні id каркасів, наприклад `codex`,
поруч із `Fast`; PI залишається прихованим, бо це стандартний сумісний шлях.

Bundled plugin Codex реєструє `codex` як свій id каркаса. Core сприймає це як
звичайний id каркаса plugin; псевдоніми, специфічні для Codex, мають належати plugin
або config оператора, а не спільному селектору runtime.

## Поєднання provider і каркаса

Більшість каркасів також мають реєструвати provider. Provider робить посилання на моделі,
стан auth, метадані моделі та вибір `/model` видимими для решти
OpenClaw. Потім каркас заявляє підтримку цього provider у `supports(...)`.

Bundled plugin Codex дотримується цього шаблону:

- id provider: `codex`
- посилання моделі для користувача: канонічне `openai/gpt-5.5` плюс
  `embeddedHarness.runtime: "codex"`; старі посилання `codex/gpt-*` і далі приймаються
  для сумісності
- id каркаса: `codex`
- auth: синтетична доступність provider, оскільки каркас Codex контролює
  native-вхід/session Codex
- запит до app-server: OpenClaw надсилає до Codex базовий id моделі й дозволяє
  каркасу працювати з native-протоколом app-server

Plugin Codex є адитивним. Звичайні посилання `openai/gpt-*` і далі використовують
звичайний шлях provider OpenClaw, якщо ви явно не примусите каркас Codex через
`embeddedHarness.runtime: "codex"`. Старі посилання `codex/gpt-*` і далі вибирають
provider і каркас Codex для сумісності.

Щодо налаштування оператором, прикладів префіксів моделей і config лише для Codex, див.
[Каркас Codex](/uk/plugins/codex-harness).

OpenClaw вимагає Codex app-server версії `0.118.0` або новішої. Plugin Codex перевіряє
initialize-handshake app-server і блокує старіші або безверсійні сервери, щоб
OpenClaw працював лише з поверхнею протоколу, з якою його було протестовано.

### Middleware результатів інструментів Codex app-server

Bundled plugin також можуть підключати middleware `tool_result`, специфічний для Codex app-server,
через `api.registerCodexAppServerExtensionFactory(...)`, коли їхній manifest оголошує
`contracts.embeddedExtensionFactories: ["codex-app-server"]`.
Це seam trusted-plugin для асинхронних перетворень `tool_result`, які мають
працювати всередині native-каркаса Codex, перш ніж вивід інструмента буде спроєктовано
назад у transcript OpenClaw.

### Режим native-каркаса Codex

Bundled каркас `codex` — це native-режим Codex для вбудованих ходів
агента OpenClaw. Спочатку увімкніть bundled plugin `codex` і додайте `codex` до
`plugins.allow`, якщо ваш config використовує обмежувальний allowlist. Нові config мають
використовувати `openai/gpt-*` з `embeddedHarness.runtime: "codex"`. Старі
посилання моделей `openai-codex/*` і `codex/*` залишаються псевдонімами сумісності.

Коли цей режим працює, Codex контролює native id thread, поведінку resume,
Compaction і виконання app-server. OpenClaw і далі контролює chat channel,
видиме дзеркало transcript, політику інструментів, approvals, доставку медіа та вибір
session. Використовуйте `embeddedHarness.runtime: "codex"` разом з
`embeddedHarness.fallback: "none"`, коли вам потрібно довести, що лише шлях
Codex app-server може взяти це виконання. Цей config є лише захистом вибору:
збої Codex app-server уже напряму завершуються помилкою замість повторної спроби через PI.

## Вимкнення fallback PI

За замовчуванням OpenClaw запускає вбудованих агентів з `agents.defaults.embeddedHarness`,
встановленим у `{ runtime: "auto", fallback: "pi" }`. У режимі `auto` зареєстровані каркаси plugin
можуть узяти на себе пару provider/модель. Якщо жоден не підходить, OpenClaw повертається до PI.

Установіть `fallback: "none"`, коли вам потрібно, щоб відсутність вибору каркаса plugin
призводила до помилки замість використання PI. Збої вже вибраного каркаса plugin і так завершуються жорстко. Це
не блокує явний `runtime: "pi"` або `OPENCLAW_AGENT_RUNTIME=pi`.

Для вбудованих виконань лише з Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Якщо ви хочете, щоб будь-який зареєстрований каркас plugin міг узяти відповідні моделі, але
ніколи не хочете, щоб OpenClaw непомітно повертався до PI, залиште `runtime: "auto"` і вимкніть
fallback:

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

Перевизначення для окремого агента використовують ту саму форму:

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
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` і далі перевизначає налаштований runtime. Використовуйте
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб вимкнути fallback на PI через
середовище.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Коли fallback вимкнено, session завершується помилкою на ранньому етапі, якщо запитаний каркас не
зареєстровано, не підтримує визначені provider/модель або завершується помилкою до
створення побічних ефектів ходу. Це зроблено навмисно для розгортань лише з Codex і
для live-тестів, які мають довести, що шлях Codex app-server справді використовується.

Цей параметр керує лише каркасом вбудованого агента. Він не вимикає
маршрутизацію моделей, специфічну для provider, для image, video, music, TTS, PDF чи інших типів.

## Native session і дзеркало transcript

Каркас може зберігати native id session, id thread або токен resume на боці daemon.
Явно підтримуйте зв’язок цього прив’язування із session OpenClaw і
продовжуйте дзеркалити видимий користувачеві вивід assistant/tool у transcript OpenClaw.

Transcript OpenClaw залишається шаром сумісності для:

- видимої в channel історії session
- пошуку та індексації transcript
- повернення до вбудованого каркаса PI на наступному ході
- загальної поведінки `/new`, `/reset` і видалення session

Якщо ваш каркас зберігає sidecar-прив’язування, реалізуйте `reset(...)`, щоб OpenClaw міг
очистити його під час скидання пов’язаної session OpenClaw.

## Результати інструментів і медіа

Core формує список інструментів OpenClaw і передає його в підготовлену спробу.
Коли каркас виконує динамічний виклик інструмента, повертайте результат інструмента через
форму результату каркаса, а не надсилайте медіа в channel самостійно.

Це зберігає text, image, video, music, TTS, approval і виводи інструментів обміну повідомленнями
на тому самому шляху доставки, що й у виконаннях на базі PI.

## Поточні обмеження

- Публічний шлях імпорту є загальним, але деякі псевдоніми типів attempt/result і далі
  містять назви `Pi` для сумісності.
- Установлення сторонніх каркасів є експериментальним. Надавайте перевагу plugin provider,
  доки вам не стане потрібен native session runtime.
- Перемикання каркасів між ходами підтримується. Не перемикайте каркаси посеред
  ходу після того, як уже почалися native-інструменти, approvals, текст assistant або
  надсилання повідомлень.

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview)
- [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)
- [Плагіни provider](/uk/plugins/sdk-provider-plugins)
- [Каркас Codex](/uk/plugins/codex-harness)
- [Постачальники моделей](/uk/concepts/model-providers)
