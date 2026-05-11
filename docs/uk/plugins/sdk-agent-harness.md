---
read_when:
    - Ви змінюєте вбудоване середовище виконання агента або реєстр обв’язок
    - Ви реєструєте агентну обв’язку з вбудованого або довіреного Plugin
    - Потрібно зрозуміти, як Plugin Codex пов’язаний із провайдерами моделей
sidebarTitle: Agent Harness
summary: Експериментальна поверхня SDK для Plugin, які замінюють низькорівневий вбудований виконавець агента
title: Плагіни середовища агента
x-i18n:
    generated_at: "2026-05-11T20:49:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**agent harness** — це низькорівневий виконавець для одного підготовленого ходу агента OpenClaw. Він не є постачальником моделі, каналом чи реєстром інструментів.
Опис користувацької ментальної моделі дивіться в [середовищах виконання агентів](/uk/concepts/agent-runtimes).

Використовуйте цю поверхню лише для вбудованих або довірених нативних plugins. Контракт
досі експериментальний, оскільки типи параметрів навмисно віддзеркалюють поточний
вбудований runner.

## Коли використовувати harness

Реєструйте agent harness, коли сімейство моделей має власне нативне середовище
виконання сесій, а звичайний транспорт постачальника OpenClaw є хибною абстракцією.

Приклади:

- нативний сервер coding-agent, який володіє потоками та compaction
- локальний CLI або daemon, який має транслювати нативні події плану/міркувань/інструментів
- середовище виконання моделі, якому потрібен власний resume id на додачу до
  транскрипту сесії OpenClaw

**Не** реєструйте harness лише для додавання нового LLM API. Для звичайних HTTP або
WebSocket API моделей створіть [provider plugin](/uk/plugins/sdk-provider-plugins).

## Чим досі володіє core

Перш ніж буде вибрано harness, OpenClaw уже визначає:

- постачальника та модель
- стан автентифікації середовища виконання
- рівень thinking і бюджет контексту
- файл транскрипту/сесії OpenClaw
- workspace, sandbox і політику інструментів
- callbacks відповіді каналу та callbacks streaming
- політику fallback моделі та live перемикання моделей

Такий поділ є навмисним. Harness виконує підготовлену спробу; він не вибирає
постачальників, не замінює доставку через канал і не перемикає моделі непомітно.

Підготовлена спроба також містить `params.runtimePlan`, пакет політик, яким володіє OpenClaw,
для рішень середовища виконання, що мають лишатися спільними для PI та нативних
harnesses:

- `runtimePlan.tools.normalize(...)` і
  `runtimePlan.tools.logDiagnostics(...)` для політики схем інструментів з урахуванням постачальника
- `runtimePlan.transcript.resolvePolicy(...)` для sanitization транскрипту та
  політики repair викликів інструментів
- `runtimePlan.delivery.isSilentPayload(...)` для спільного `NO_REPLY` та приглушення
  доставки media
- `runtimePlan.outcome.classifyRunResult(...)` для класифікації fallback моделі
- `runtimePlan.observability` для визначених metadata постачальника/моделі/harness

Harnesses можуть використовувати plan для рішень, які мають відповідати поведінці PI, але
все одно повинні трактувати його як стан спроби, яким володіє host. Не змінюйте його й не використовуйте
для перемикання постачальників/моделей усередині ходу.

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

OpenClaw вибирає harness після визначення постачальника/моделі:

1. Спершу застосовується runtime policy на рівні моделі.
2. Далі застосовується runtime policy на рівні постачальника.
3. `auto` запитує зареєстровані harnesses, чи підтримують вони визначену
   пару постачальник/модель.
4. Якщо жоден зареєстрований harness не збігається, OpenClaw використовує PI, якщо PI fallback
   не вимкнено.

Збої plugin harness відображаються як збої запуску. У режимі `auto` PI fallback
використовується лише тоді, коли жоден зареєстрований plugin harness не підтримує визначену
пару постачальник/модель. Щойно plugin harness заявив право на запуск, OpenClaw не
відтворює той самий хід через PI, оскільки це може змінити семантику auth/runtime
або дублювати побічні ефекти.

Pins середовища виконання для цілої сесії та цілого агента ігноруються під час вибору. Це
включає застарілі значення сесії `agentHarnessId`, `agents.defaults.agentRuntime`,
`agents.list[].agentRuntime` і `OPENCLAW_AGENT_RUNTIME`. `/status` показує
ефективне середовище виконання, вибране з маршруту постачальник/модель.
Якщо вибраний harness несподіваний, увімкніть debug logging `agents/harness` і
перегляньте структурований запис gateway `agent harness selected`. Він містить
id вибраного harness, причину вибору, політику runtime/fallback і, у режимі
`auto`, результат підтримки кожного кандидата plugin.

Вбудований Codex plugin реєструє `codex` як свій harness id. Core трактує це
як звичайний plugin harness id; специфічні для Codex aliases мають бути в plugin
або operator config, а не в спільному selector середовища виконання.

## Поєднання постачальника та harness

Більшість harnesses також мають реєструвати постачальника. Постачальник робить refs моделей,
статус auth, metadata моделей і вибір `/model` видимими для решти
OpenClaw. Після цього harness заявляє цього постачальника в `supports(...)`.

Вбудований Codex plugin дотримується цього шаблону:

- бажані refs користувацьких моделей: `openai/gpt-5.5`
- refs сумісності: застарілі refs `codex/gpt-*` досі приймаються, але нові
  configs не повинні використовувати їх як звичайні refs постачальник/модель
- harness id: `codex`
- auth: синтетична доступність постачальника, оскільки Codex harness володіє
  нативним login/session Codex
- запит app-server: OpenClaw надсилає Codex лише bare model id і дозволяє
  harness працювати з нативним protocol app-server

Codex plugin є additive. Звичайні refs агентів `openai/gpt-*` на офіційному
постачальнику OpenAI за замовчуванням вибирають Codex harness. Старі refs `codex/gpt-*`
досі вибирають Codex provider і harness для сумісності.

Для налаштування operator, прикладів model prefix і configs лише для Codex дивіться
[Codex Harness](/uk/plugins/codex-harness).

OpenClaw потребує Codex app-server `0.125.0` або новішого. Codex plugin перевіряє
initialize handshake app-server і блокує старіші або безверсійні сервери, щоб
OpenClaw запускався лише проти protocol surface, з якою його тестували. Поріг
`0.125.0` включає підтримку payload нативного MCP hook, яка зʼявилася в
Codex `0.124.0`, водночас привʼязуючи OpenClaw до новішої протестованої stable line.

### Middleware результатів інструментів

Вбудовані plugins можуть приєднувати runtime-neutral middleware результатів інструментів через
`api.registerAgentToolResultMiddleware(...)`, коли їхній manifest оголошує
цільові runtime ids у `contracts.agentToolResultMiddleware`. Цей довірений
seam призначений для async перетворень результатів інструментів, які мають виконатися до того, як PI або Codex передасть
вивід інструменту назад у модель.

Застарілі вбудовані plugins усе ще можуть використовувати
`api.registerCodexAppServerExtensionFactory(...)` для middleware лише Codex app-server,
але нові result transforms повинні використовувати runtime-neutral API.
Pi-only hook `api.registerEmbeddedExtensionFactory(...)` вилучено;
Pi tool-result transforms мають використовувати runtime-neutral middleware.

### Класифікація terminal outcome

Нативні harnesses, які володіють власною protocol projection, можуть використовувати
`classifyAgentHarnessTerminalOutcome(...)` з
`openclaw/plugin-sdk/agent-harness-runtime`, коли завершений хід не створив
видимого тексту assistant. Helper повертає `empty`, `reasoning-only` або
`planning-only`, щоб fallback policy OpenClaw могла вирішити, чи повторювати спробу на
іншій моделі. Він навмисно не класифікує prompt errors, in-flight turns і
навмисні silent replies, такі як `NO_REPLY`.

### Нативний режим Codex harness

Вбудований harness `codex` є нативним режимом Codex для вбудованих ходів агента OpenClaw.
Спершу ввімкніть вбудований plugin `codex` і додайте `codex` до
`plugins.allow`, якщо ваш config використовує restrictive allowlist. Нативні configs app-server
мають використовувати `openai/gpt-*`; ходи агентів OpenAI за замовчуванням вибирають Codex harness.
Застарілі маршрути `openai-codex/*` слід виправити за допомогою
`openclaw doctor --fix`, а застарілі refs моделей `codex/*` лишаються compatibility
aliases для нативного harness.

Коли цей режим працює, Codex володіє нативним thread id, поведінкою resume,
compaction і виконанням app-server. OpenClaw досі володіє chat channel,
видимим дзеркалом транскрипту, політикою інструментів, approvals, media delivery і вибором
сесії. Використовуйте provider/model `agentRuntime.id: "codex"`, коли потрібно довести,
що лише шлях Codex app-server може заявити запуск. Явні plugin runtimes
завершуються fail-closed; збої вибору Codex app-server і runtime failures не
повторюються через PI.

## Суворість runtime

За замовчуванням OpenClaw використовує runtime policy постачальник/модель `auto`: зареєстровані
plugin harnesses можуть заявити пару постачальник/модель, а PI обробляє хід, коли
збігів немає. Refs агентів OpenAI на офіційному постачальнику OpenAI за замовчуванням використовують Codex.
Використовуйте явний provider/model plugin runtime, наприклад
`agentRuntime.id: "codex"`, коли відсутній вибір harness має завершуватися помилкою замість
маршрутизації через PI. Збої вибраних plugin harness завжди завершуються жорсткою помилкою. Це
не блокує явний provider/model `agentRuntime.id: "pi"`.

Для вбудованих запусків лише Codex:

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5"
    }
  }
}
```

Якщо потрібен CLI backend для однієї canonical model, розмістіть runtime у цьому
записі моделі:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Per-agent overrides використовують ту саму model-scoped форму:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Застарілі приклади whole-agent runtime, як цей, ігноруються:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

З явним plugin runtime сесія завершується рано, коли запитаний
harness не зареєстрований, не підтримує визначену пару постачальник/модель або
зазнає збою до створення побічних ефектів ходу. Це навмисно для розгортань лише Codex
і для live tests, які мають довести, що шлях Codex app-server справді
використовується.

Цей параметр керує лише вбудованим agent harness. Він не вимикає
маршрутизацію моделей для image, video, music, TTS, PDF або інших специфічних для постачальника можливостей.

## Нативні сесії та дзеркало транскрипту

Harness може зберігати нативний session id, thread id або resume token на боці daemon.
Тримайте цю привʼязку явно повʼязаною із сесією OpenClaw і продовжуйте
дзеркалити видимий для користувача assistant/tool output у транскрипт OpenClaw.

Транскрипт OpenClaw лишається compatibility layer для:

- видимої в каналі історії сесії
- пошуку та індексації транскриптів
- перемикання назад на вбудований PI harness у пізнішому ході
- generic поведінки `/new`, `/reset` і видалення сесії

Якщо ваш harness зберігає sidecar binding, реалізуйте `reset(...)`, щоб OpenClaw міг
очистити її, коли відповідну сесію OpenClaw скинуто.

## Результати інструментів і media

Core створює список інструментів OpenClaw і передає його до підготовленої спроби.
Коли harness виконує dynamic tool call, поверніть результат інструменту через
форму результату harness замість самостійного надсилання channel media.

Це тримає text, image, video, music, TTS, approval і messaging-tool outputs
на тому самому delivery path, що й запуски з підтримкою PI.

## Поточні обмеження

- Публічний шлях імпорту є generic, але деякі aliases типів attempt/result досі
  містять назви `Pi` для сумісності.
- Встановлення third-party harness є експериментальним. Віддавайте перевагу provider plugins,
  доки вам не потрібне нативне середовище виконання сесії.
- Перемикання harness підтримується між ходами. Не перемикайте harnesses посередині
  ходу після запуску native tools, approvals, assistant text або message
  sends.

## Повʼязане

- [Огляд SDK](/uk/plugins/sdk-overview)
- [Допоміжні засоби середовища виконання](/uk/plugins/sdk-runtime)
- [Plugins постачальників](/uk/plugins/sdk-provider-plugins)
- [Codex Harness](/uk/plugins/codex-harness)
- [Постачальники моделей](/uk/concepts/model-providers)
