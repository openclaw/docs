---
read_when:
    - Ви змінюєте вбудований runtime агента або реєстр harness
    - Ви реєструєте agent harness із вбудованого або довіреного Plugin
    - Вам потрібно зрозуміти, як Plugin Codex пов’язаний із provider моделей
sidebarTitle: Agent Harness
summary: Експериментальна поверхня SDK для Plugin, які замінюють низькорівневий вбудований виконавець агента
title: Plugins для agent harness
x-i18n:
    generated_at: "2026-04-23T21:02:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69d0c4febbc0f0397d4fc8a212039a2d78764798b82f48e600daf68626826904
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Agent harness — це низькорівневий виконавець одного підготовленого ходу агента OpenClaw. Це не provider моделі, не канал і не реєстр tools.

Використовуйте цю поверхню лише для вбудованих або довірених нативних Plugin. Контракт
усе ще експериментальний, оскільки типи параметрів навмисно віддзеркалюють поточний
вбудований runner.

## Коли використовувати harness

Реєструйте agent harness, коли сімейство моделей має власний нативний runtime
сесії, а звичайний транспорт provider OpenClaw є неправильною абстракцією.

Приклади:

- нативний сервер coding-agent, який володіє threads і Compaction
- локальний CLI або daemon, який має передавати нативні події plan/reasoning/tool через streaming
- runtime моделі, якому потрібен власний resume id на додачу до транскрипту сесії OpenClaw

**Не** реєструйте harness лише для додавання нового LLM API. Для звичайних HTTP- або
WebSocket-API моделей створюйте [provider plugin](/uk/plugins/sdk-provider-plugins).

## Чим і далі володіє core

До вибору harness OpenClaw уже розв’язав:

- provider і model
- стан auth runtime
- рівень thinking і бюджет контексту
- транскрипт/файл сесії OpenClaw
- робочий простір, sandbox і політику tools
- callback для відповідей каналу й callback для streaming
- fallback моделі та політику перемикання live-моделі

Такий розподіл є навмисним. Harness виконує підготовлену спробу; він не вибирає
providers, не замінює доставку каналом і не перемикає моделі мовчки.

## Реєстрація harness

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

OpenClaw вибирає harness після розв’язання provider/model:

1. Зафіксований id harness у наявній сесії має пріоритет, щоб зміни config/env
   не перемикали цей транскрипт гарячим способом на інший runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` примусово задає зареєстрований harness з цим id для
   сесій, які ще не закріплені.
3. `OPENCLAW_AGENT_RUNTIME=pi` примусово задає вбудований harness PI.
4. `OPENCLAW_AGENT_RUNTIME=auto` запитує зареєстровані harness, чи підтримують вони
   розв’язаний provider/model.
5. Якщо жоден зареєстрований harness не підходить, OpenClaw використовує PI, якщо fallback PI
   не вимкнено.

Збої harness Plugin проявляються як збої запуску. У режимі `auto` fallback PI
використовується лише тоді, коли жоден зареєстрований Plugin harness не підтримує розв’язаний
provider/model. Щойно Plugin harness узяв run, OpenClaw не
програє той самий хід через PI, оскільки це може змінити семантику auth/runtime
або дублювати побічні ефекти.

Вибраний id harness зберігається разом з id сесії після вбудованого запуску.
Застарілі сесії, створені до закріплення harness, трактуються як закріплені за PI, щойно
в них з’являється історія транскрипту. Використовуйте нову/скинуту сесію під час перемикання між PI і
нативним Plugin harness. `/status` показує нетипові id harness, такі як `codex`,
поруч із `Fast`; PI не показується, бо це типовий сумісний шлях.

Вбудований Plugin Codex реєструє `codex` як свій id harness. Core трактує це
як звичайний id harness Plugin; псевдоніми, специфічні для Codex, мають належати в Plugin
або в конфігурацію оператора, а не в спільний selector runtime.

## Поєднання provider і harness

Більшість harness також мають реєструвати provider. Provider робить refs моделей,
стан auth, метадані моделі та вибір `/model` видимими для решти
OpenClaw. Потім harness заявляє цей provider у `supports(...)`.

Вбудований Plugin Codex дотримується цього шаблону:

- id provider: `codex`
- refs моделей для користувача: канонічний `openai/gpt-5.5` плюс
  `embeddedHarness.runtime: "codex"`; застарілі refs `codex/gpt-*` і далі приймаються
  для сумісності
- id harness: `codex`
- auth: синтетична доступність provider, оскільки harness Codex володіє
  нативним входом/сесією Codex
- запит app-server: OpenClaw надсилає до Codex чистий id моделі й дозволяє
  harness спілкуватися з нативним протоколом app-server

Plugin Codex є додатковим. Звичайні refs `openai/gpt-*` і далі використовують
нормальний шлях provider OpenClaw, якщо ви примусово не задасте harness Codex через
`embeddedHarness.runtime: "codex"`. Старіші refs `codex/gpt-*` і далі вибирають
provider і harness Codex для сумісності.

Налаштування для оператора, приклади префіксів моделей і конфігурації лише для Codex див.
у [Codex Harness](/uk/plugins/codex-harness).

OpenClaw вимагає Codex app-server `0.118.0` або новіший. Plugin Codex перевіряє
initialize handshake app-server і блокує старіші або безверсійні сервери, щоб
OpenClaw працював лише з тією поверхнею протоколу, з якою його було протестовано.

### Middleware результатів tools для Codex app-server

Вбудовані Plugin також можуть підключати middleware `tool_result`, специфічне для Codex app-server, через `api.registerCodexAppServerExtensionFactory(...)`, коли їхній
маніфест оголошує `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
Це seam довіреного Plugin для асинхронних перетворень результатів tools, які потрібно
виконувати всередині нативного harness Codex до того, як вивід tool буде спроєктовано назад
у транскрипт OpenClaw.

### Режим нативного harness Codex

Вбудований harness `codex` — це нативний режим Codex для вбудованих ходів
агента OpenClaw. Спочатку ввімкніть вбудований Plugin `codex`, а також включіть `codex` у
`plugins.allow`, якщо ваша конфігурація використовує обмежувальний allowlist. Нові конфігурації мають
використовувати `openai/gpt-*` з `embeddedHarness.runtime: "codex"`. Застарілі
refs моделей `openai-codex/*` і `codex/*` і далі залишаються псевдонімами сумісності.

Коли цей режим працює, Codex володіє нативним thread id, поведінкою resume,
Compaction і виконанням app-server. OpenClaw і далі володіє каналом чату,
видимим дзеркалом транскрипту, політикою tools, approvals, доставкою медіа та
вибором сесії. Використовуйте `embeddedHarness.runtime: "codex"` разом із
`embeddedHarness.fallback: "none"`, коли вам потрібно довести, що лише шлях
Codex app-server може взяти run. Ця конфігурація є лише запобіжником вибору:
збої Codex app-server вже напряму завершуються помилкою без повторної спроби через PI.

## Вимкнення fallback PI

Типово OpenClaw запускає вбудованих агентів з `agents.defaults.embeddedHarness`,
установленим у `{ runtime: "auto", fallback: "pi" }`. У режимі `auto` зареєстровані Plugin
harness можуть узяти пару provider/model. Якщо жоден не підходить, OpenClaw повертається до PI.

Установіть `fallback: "none"`, якщо вам потрібно, щоб відсутність вибору Plugin harness
призводила до помилки замість використання PI. Збої вже вибраного Plugin harness і так завершуються жорсткою помилкою. Це не блокує явний `runtime: "pi"` або `OPENCLAW_AGENT_RUNTIME=pi`.

Для вбудованих запусків лише з Codex:

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

Якщо ви хочете, щоб будь-який зареєстрований Plugin harness міг брати відповідні моделі, але не хочете, щоб OpenClaw мовчки повертався до PI, залиште `runtime: "auto"` і вимкніть fallback:

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

Перевизначення для конкретного агента використовують ту саму форму:

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
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб вимкнути fallback PI із
середовища.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Коли fallback вимкнено, сесія завершується помилкою на ранньому етапі, якщо запитаний harness не
зареєстрований, не підтримує розв’язаний provider/model або завершується помилкою до
створення побічних ефектів ходу. Це навмисно для розгортань лише з Codex і
для live-тестів, які мають довести, що шлях Codex app-server справді використовується.

Цей параметр керує лише вбудованим agent harness. Він не вимикає
маршрутизацію моделей, специфічну для image, video, music, TTS, PDF або інших provider.

## Нативні сесії та дзеркало транскрипту

Harness може зберігати нативний session id, thread id або токен resume на стороні daemon.
Тримайте це прив’язування явно пов’язаним із сесією OpenClaw і продовжуйте
дзеркалити видимий для користувача вивід assistant/tool у транскрипт OpenClaw.

Транскрипт OpenClaw залишається шаром сумісності для:

- видимої в каналі історії сесій
- пошуку й індексації транскриптів
- повернення до вбудованого harness PI на пізнішому ході
- загальної поведінки `/new`, `/reset` і видалення сесії

Якщо ваш harness зберігає sidecar-прив’язку, реалізуйте `reset(...)`, щоб OpenClaw міг
очистити її, коли пов’язану сесію OpenClaw буде скинуто.

## Результати tools і медіа

Core будує список tools OpenClaw і передає його в підготовлену спробу.
Коли harness виконує динамічний виклик tool, повертайте результат tool назад через
форму результату harness, а не надсилайте медіа каналу самостійно.

Це зберігає text, image, video, music, TTS, approval і виводи tools обміну повідомленнями
в тому самому шляху доставки, що й запуски, підкріплені PI.

## Поточні обмеження

- Публічний шлях імпорту є загальним, але деякі псевдоніми типів спроб/результатів і далі
  містять назви `Pi` для сумісності.
- Встановлення сторонніх harness усе ще експериментальне. Надавайте перевагу provider plugins,
  доки вам не знадобиться нативний runtime сесії.
- Перемикання harness між ходами підтримується. Не перемикайте harness
  посеред ходу після того, як уже почалися нативні tools, approvals, текст assistant або
  надсилання повідомлень.

## Пов’язане

- [SDK Overview](/uk/plugins/sdk-overview)
- [Runtime Helpers](/uk/plugins/sdk-runtime)
- [Provider Plugins](/uk/plugins/sdk-provider-plugins)
- [Codex Harness](/uk/plugins/codex-harness)
- [Model Providers](/uk/concepts/model-providers)
