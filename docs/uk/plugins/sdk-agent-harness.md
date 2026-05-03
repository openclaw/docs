---
read_when:
    - Ви змінюєте вбудоване середовище виконання агента або реєстр обв’язки
    - Ви реєструєте обв'язку агента з вбудованого або довіреного Plugin
    - Потрібно зрозуміти, як Plugin Codex пов’язаний із постачальниками моделей
sidebarTitle: Agent Harness
summary: Експериментальний інтерфейс SDK для плагінів, які замінюють низькорівневий вбудований виконавець агента
title: Плагіни обв’язки агента
x-i18n:
    generated_at: "2026-05-03T04:51:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed416bbb433fc502c60fd8c24d20cd0f862d45472ff2eb0e2484b256b58f1b35
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**обв’язка агента** — це низькорівневий виконавець для одного підготовленого ходу агента OpenClaw.
Це не провайдер моделі, не канал і не реєстр інструментів.
Для користувацької ментальної моделі див. [Середовища виконання агентів](/uk/concepts/agent-runtimes).

Використовуйте цю поверхню лише для вбудованих або довірених нативних plugins. Контракт
досі експериментальний, тому що типи параметрів навмисно віддзеркалюють поточний
вбудований runner.

## Коли використовувати обв’язку

Зареєструйте обв’язку агента, коли сімейство моделей має власне нативне середовище
сеансу, а звичайний транспорт провайдера OpenClaw є хибною абстракцією.

Приклади:

- нативний сервер агента для кодування, який володіє потоками й compaction
- локальний CLI або daemon, який має транслювати нативні події плану/міркування/інструментів
- середовище виконання моделі, якому потрібен власний resume id на додачу до транскрипту
  сеансу OpenClaw

**Не** реєструйте обв’язку лише для додавання нового LLM API. Для звичайних HTTP або
WebSocket API моделей створіть [provider plugin](/uk/plugins/sdk-provider-plugins).

## Чим усе ще володіє core

Перед вибором обв’язки OpenClaw уже визначив:

- провайдера й модель
- стан runtime auth
- рівень thinking і бюджет контексту
- файл транскрипту/сеансу OpenClaw
- workspace, sandbox і політику інструментів
- callbacks відповіді каналу та streaming callbacks
- політику fallback моделі та live перемикання моделей

Такий поділ навмисний. Обв’язка виконує підготовлену спробу; вона не вибирає
провайдерів, не замінює доставку каналу й не перемикає моделі непомітно.

Підготовлена спроба також містить `params.runtimePlan`, пакет політик, яким володіє OpenClaw,
для runtime-рішень, що мають залишатися спільними для PI та нативних обв’язок:

- `runtimePlan.tools.normalize(...)` і
  `runtimePlan.tools.logDiagnostics(...)` для provider-aware політики схем інструментів
- `runtimePlan.transcript.resolvePolicy(...)` для санітизації транскрипту та
  політики відновлення викликів інструментів
- `runtimePlan.delivery.isSilentPayload(...)` для спільного `NO_REPLY` і придушення
  доставки медіа
- `runtimePlan.outcome.classifyRunResult(...)` для класифікації fallback моделі
- `runtimePlan.observability` для визначених метаданих провайдера/моделі/обв’язки

Обв’язки можуть використовувати план для рішень, які мають збігатися з поведінкою PI, але
все одно повинні ставитися до нього як до стану спроби, яким володіє host. Не змінюйте його й не використовуйте
для перемикання провайдерів/моделей усередині ходу.

## Зареєструвати обв’язку

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

OpenClaw вибирає обв’язку після визначення провайдера/моделі:

1. Записаний harness id наявного сеансу має пріоритет, тому зміни config/env не
   перемикають цей транскрипт гарячим способом на інше середовище виконання.
2. `OPENCLAW_AGENT_RUNTIME=<id>` примусово використовує зареєстровану обв’язку з цим id для
   сеансів, які ще не закріплені.
3. `OPENCLAW_AGENT_RUNTIME=pi` примусово використовує вбудовану обв’язку PI.
4. `OPENCLAW_AGENT_RUNTIME=auto` запитує зареєстровані обв’язки, чи підтримують вони
   визначеного провайдера/модель.
5. Якщо жодна зареєстрована обв’язка не підходить, OpenClaw використовує PI, якщо fallback PI
   не вимкнено.

Збої обв’язок Plugin відображаються як збої виконання. У режимі `auto` fallback PI
використовується лише тоді, коли жодна зареєстрована обв’язка Plugin не підтримує визначеного
провайдера/модель. Щойно обв’язка Plugin прийняла виконання, OpenClaw не
відтворює той самий хід через PI, бо це може змінити семантику auth/runtime
або дублювати побічні ефекти.

Id вибраної обв’язки зберігається разом із session id після вбудованого виконання.
Legacy-сеанси, створені до появи закріплень обв’язок, вважаються закріпленими за PI, щойно вони
мають історію транскрипту. Використовуйте новий/скинутий сеанс під час перемикання між PI і
нативною обв’язкою Plugin. `/status` показує нестандартні harness id, такі як `codex`,
поруч із `Fast`; PI приховано, бо це типовий шлях сумісності.
Якщо вибрана обв’язка несподівана, увімкніть debug logging `agents/harness` і
перевірте структурований запис Gateway `agent harness selected`. Він містить
id вибраної обв’язки, причину вибору, політику runtime/fallback і, в режимі
`auto`, результат підтримки кожного кандидата Plugin.

Вбудований Codex Plugin реєструє `codex` як свій harness id. Core розглядає його
як звичайний harness id Plugin; Codex-specific aliases мають належати Plugin
або operator config, а не спільному runtime selector.

## Поєднання провайдера та обв’язки

Більшість обв’язок також мають реєструвати провайдера. Провайдер робить model refs,
auth status, model metadata і вибір `/model` видимими для решти
OpenClaw. Потім обв’язка заявляє цей провайдер у `supports(...)`.

Вбудований Codex Plugin дотримується цього шаблону:

- бажані model refs користувача: `openai/gpt-5.5` плюс
  `agentRuntime.id: "codex"`
- refs сумісності: legacy `codex/gpt-*` refs залишаються прийнятими, але нові
  configs не повинні використовувати їх як звичайні provider/model refs
- harness id: `codex`
- auth: синтетична доступність провайдера, бо обв’язка Codex володіє
  нативним login/session Codex
- запит app-server: OpenClaw надсилає bare model id до Codex і дозволяє
  обв’язці говорити з нативним протоколом app-server

Codex Plugin є адитивним. Звичайні `openai/gpt-*` refs і далі використовують
звичайний шлях провайдера OpenClaw, якщо ви не примусите обв’язку Codex через
`agentRuntime.id: "codex"`. Старіші `codex/gpt-*` refs усе ще вибирають
провайдера й обв’язку Codex для сумісності.

Для operator setup, прикладів model prefix і Codex-only configs див.
[Обв’язка Codex](/uk/plugins/codex-harness).

OpenClaw потребує Codex app-server `0.125.0` або новішого. Codex Plugin перевіряє
initialize handshake app-server і блокує старіші або unversioned servers, щоб
OpenClaw працював лише з тією поверхнею протоколу, з якою його протестовано. Поріг
`0.125.0` містить підтримку native MCP hook payload, що з’явилася в
Codex `0.124.0`, водночас закріплюючи OpenClaw на новішій протестованій stable line.

### Middleware результатів інструментів

Вбудовані plugins можуть під’єднувати runtime-neutral middleware результатів інструментів через
`api.registerAgentToolResultMiddleware(...)`, коли їхній manifest оголошує
цільові runtime ids у `contracts.agentToolResultMiddleware`. Ця довірена
поверхня призначена для async трансформацій результатів інструментів, які мають виконатися перед тим, як PI або Codex передасть
вивід інструмента назад у модель.

Legacy вбудовані plugins усе ще можуть використовувати
`api.registerCodexAppServerExtensionFactory(...)` для middleware лише Codex app-server,
але нові трансформації результатів мають використовувати runtime-neutral API.
Pi-only hook `api.registerEmbeddedExtensionFactory(...)` вилучено;
трансформації результатів інструментів Pi мають використовувати runtime-neutral middleware.

### Класифікація термінального результату

Нативні обв’язки, які володіють власною проєкцією протоколу, можуть використовувати
`classifyAgentHarnessTerminalOutcome(...)` з
`openclaw/plugin-sdk/agent-harness-runtime`, коли завершений хід не створив
видимого тексту асистента. Helper повертає `empty`, `reasoning-only` або
`planning-only`, щоб політика fallback OpenClaw могла вирішити, чи повторювати спробу на
іншій моделі. Він навмисно не класифікує prompt errors, in-flight turns і
навмисні тихі відповіді, такі як `NO_REPLY`.

### Нативний режим обв’язки Codex

Вбудована обв’язка `codex` — це нативний режим Codex для вбудованих
ходів агента OpenClaw. Спочатку ввімкніть вбудований Plugin `codex` і додайте `codex` до
`plugins.allow`, якщо ваша config використовує обмежувальний allowlist. Native app-server
configs повинні використовувати `openai/gpt-*` з `agentRuntime.id: "codex"`.
Використовуйте `openai-codex/*` для Codex OAuth через PI. Legacy `codex/*`
model refs залишаються compatibility aliases для нативної обв’язки.

Коли цей режим працює, Codex володіє native thread id, resume behavior,
compaction і виконанням app-server. OpenClaw усе ще володіє chat channel,
видимим дзеркалом транскрипту, політикою інструментів, approvals, доставкою медіа та вибором
сеансу. Використовуйте `agentRuntime.id: "codex"`, коли потрібно довести, що лише
шлях Codex app-server може прийняти виконання. Явні plugin runtimes fail closed;
збої вибору Codex app-server і runtime failures не повторюються через
PI.

## Строгість runtime

За замовчуванням OpenClaw запускає вбудованих агентів з OpenClaw Pi. У режимі `auto`
зареєстровані обв’язки Plugin можуть прийняти пару провайдер/модель, а PI обробляє
хід, коли жодна не підходить. Використовуйте явний plugin runtime, такий як
`agentRuntime.id: "codex"`, коли відсутній вибір обв’язки має завершуватися збоєм замість
маршрутизації через PI. Збої вибраних обв’язок Plugin завжди завершуються жорстким збоєм. Це
не блокує явний `agentRuntime.id: "pi"` або
`OPENCLAW_AGENT_RUNTIME=pi`.

Для Codex-only вбудованих виконань:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Якщо ви хочете, щоб будь-яка зареєстрована обв’язка Plugin приймала відповідні моделі, а інакше
використовувався PI, задайте `id: "auto"`:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto"
      }
    }
  }
}
```

Per-agent overrides використовують ту саму форму:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": { "id": "auto" }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": { "id": "codex" }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` усе ще перевизначає налаштований runtime.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

З явним plugin runtime сеанс завершується рано, коли запитана
обв’язка не зареєстрована, не підтримує визначеного провайдера/модель або
завершується збоєм до створення побічних ефектів ходу. Це навмисно для Codex-only
deployments і live tests, які мають довести, що шлях Codex app-server
справді використовується.

Це налаштування керує лише вбудованою обв’язкою агента. Воно не вимикає
image, video, music, TTS, PDF або іншу provider-specific маршрутизацію моделей.

## Нативні сеанси та дзеркало транскрипту

Обв’язка може зберігати native session id, thread id або daemon-side resume token.
Тримайте цю прив’язку явно пов’язаною із сеансом OpenClaw і продовжуйте
дзеркалити видимий для користувача вивід асистента/інструментів у транскрипт OpenClaw.

Транскрипт OpenClaw залишається compatibility layer для:

- видимої в каналі історії сеансу
- пошуку й індексації транскриптів
- перемикання назад на вбудовану обв’язку PI під час пізнішого ходу
- загальної поведінки `/new`, `/reset` і видалення сеансів

Якщо ваша обв’язка зберігає sidecar binding, реалізуйте `reset(...)`, щоб OpenClaw міг
очистити її під час скидання відповідного сеансу OpenClaw.

## Результати інструментів і медіа

Core формує список інструментів OpenClaw і передає його в підготовлену спробу.
Коли обв’язка виконує dynamic tool call, поверніть результат інструмента назад через
форму результату обв’язки замість самостійного надсилання channel media.

Це утримує текстові, image, video, music, TTS, approval і messaging-tool outputs
на тому самому шляху доставки, що й виконання з PI.

## Поточні обмеження

- Публічний шлях імпорту є загальним, але деякі псевдоніми типів спроб/результатів досі
  містять назви `Pi` для сумісності.
- Встановлення стороннього harness є експериментальним. Надавайте перевагу Plugin-ам провайдерів,
  доки вам не знадобиться нативне середовище виконання сесії.
- Перемикання harness підтримується між ходами. Не перемикайте harness
  посеред ходу після того, як почалися нативні інструменти, затвердження, текст асистента або
  надсилання повідомлень.

## Пов’язане

- [Огляд SDK](/uk/plugins/sdk-overview)
- [Допоміжні засоби середовища виконання](/uk/plugins/sdk-runtime)
- [Plugin-и провайдерів](/uk/plugins/sdk-provider-plugins)
- [Codex Harness](/uk/plugins/codex-harness)
- [Провайдери моделей](/uk/concepts/model-providers)
