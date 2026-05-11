---
read_when:
    - Аналіз причин, чому рефакторинг вхідної обробки каналу додав забагато коду
    - Перенесення політики маршруту, команди, події, активації або групи доступу з вбудованих плагінів у ядро
    - Перевірка того, чи допоміжний засіб вхідного каналу насправді видаляє код вбудованого Plugin
sidebarTitle: Ingress core deletion
summary: План із пріоритетом видалення для перенесення повторюваного зв’язувального коду вхідної обробки каналів у ядро.
title: План видалення ядра вхідного трафіку
x-i18n:
    generated_at: "2026-05-11T20:56:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# План видалення ядра ingress

Рефакторинг ingress не є здоровим, поки додає тисячі чистих рядків. Централізація
ядра рахується лише тоді, коли production-код вбудованих плагінів стає меншим, а
стара сумісність стороннього SDK ізольована в SDK/core shim.

Бажана форма runtime:

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

Вбудовані плагіни не мають перекладати ingress назад у локальні форми
`AccessResult`, `GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` або
`{ allowed, reasonCode }`, якщо цей тип не є публічним API плагіна.

## Бюджет

Виміряно відносно merge-base PR з `origin/main`, включно з невідстежуваними
файлами.

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

Мінімальне прибирання, що залишилося:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

Видалення лише коментарів не рахується як прибирання. Попередній прохід бюджету був
надто щедрим, бо включав відновлені пояснювальні коментарі QQBot; цей документ
відстежує лише переміщення виконуваного коду, документації та тестів.

Повторно вимірюйте після кожної хвилі прибирання:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Діагноз

Перший прохід додав спільне ядро ingress, а потім залишив забагато локальної
авторизації плагінів поруч із ним:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Це дублює модель. Production-код ядра зріс приблизно на 3 376 рядків, тоді як
production-код вбудованих плагінів став меншим на 1 240 рядків. Це краще, ніж
перший прохід, але не вкладається в мінімальний бюджет. Виправлення залишається
орієнтованим на видалення:

- видалити DTO плагінів, які лише перейменовують поля ingress
- видалити тести, які лише перевіряють форму wrapper
- додавати core helpers лише тоді, коли той самий patch видаляє код вбудованих плагінів
- тримати стару сумісність SDK лише в SDK/core shim
- перепакувати ядро після того, як видалення wrapper відкриє стабільну форму

## Гарячі точки

Production-файли вбудованих плагінів із позитивним приростом, які ще треба зменшити:

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

Гілка ще не вкладається в мінімальний бюджет. Залишкова робота, релевантна для
review, має видаляти повторюваний потік авторизації, turn scaffolding або тести
wrapper перед додаванням ще однієї core abstraction.

## Поточне читання коду

Здоровий core seam уже існує в `src/channels/message-access/runtime.ts`: він
володіє identity adapters, effective allowlists, читанням pairing-store, route
descriptors, command/event presets, access groups і фінальною resolved-проєкцією
`ResolvedChannelMessageIngress`.

Залишкове зростання здебільшого є glue плагінів, нашарованим поверх цього seam:

- `extensions/telegram/src/ingress.ts` обгортає рішення ядра в command/event helpers,
  специфічні для Telegram, а call sites все ще передають попередньо обчислені
  normalized allowlists і owner lists.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`
  і `extensions/matrix/src/matrix/monitor/access-state.ts` все ще тримають
  локальні policy DTO або legacy decision names поруч з ingress.
- `extensions/signal/src/monitor/access-policy.ts` правильно тримає нормалізацію
  ідентичності Signal і pairing replies локальними, але все ще має wrapper seam,
  який має згорнутися в пряме споживання ingress.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` і
  `extensions/zalouser/src/monitor.ts` все ще повторюють route/envelope/turn
  assembly, який можна перенести до спільних turn helpers поза ядром ingress.

Висновок: переносити більше коду в ядро корисно лише якщо це видаляє ці wrapper
layers плагінів у тому самому patch. Додавання ще однієї abstraction зі збереженням
wrapper returns повторює помилку.

## Межа

Ядро володіє generic policy:

- нормалізація й зіставлення allowlist
- розгортання access-group і діагностика
- читання DM allowlist з pairing-store
- route, sender, command, event і activation gates
- admission mapping: dispatch, drop, skip, observe, pairing
- редагований стан, рішення, діагностика та проєкції сумісності SDK
- reusable generic descriptors для identity, route, command, event, activation
  і outcomes

Плагіни володіють transport facts і side effects:

- автентичність webhook/socket/request
- витягування platform identity і API lookups
- channel-specific policy defaults
- pairing challenge delivery, replies, acks, reactions, typing, media, history,
  setup, doctor, status, logs і user-facing copy

Ядро має залишатися channel-agnostic: жодних Discord, Slack, Telegram, Matrix, room,
guild, space, API client або plugin-specific default у
`src/channels/message-access`.

## Правило приймання

Кожен новий core helper має негайно видаляти production-код вбудованих плагінів.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Зупинитися й перепроєктувати, якщо:

- production LOC плагінів зростає
- тести ростуть швидше, ніж скорочується production-код
- bundled hot path повертає DTO, який лише перейменовує `ResolvedChannelMessageIngress`
- core helper потребує channel id, platform object, API client або
  channel-specific default

## Робочі пакети

1. Заморозити бюджет.
   Додати LOC у PR, тримати deprecated-ingress lint зеленим і включати before/after
   LOC у cleanup commits.

2. Видалити тонкі DTO seams.
   Замінити plugin-local wrapper returns на пряме використання
   `ResolvedChannelMessageIngress`, `senderAccess`, `commandAccess`, `routeAccess` або
   `ingress`. Почати з QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix,
   iMessage і Tlon. Видалити wrapper-shape tests; залишити behavior tests.

3. Додавати outcome classification лише разом із видаленнями.
   Generic classifier може відкривати `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender` і
   `drop-ingress`. Він має виводитися з decision graph, а не з reason strings,
   і мігрувати щонайменше три плагіни в тому самому patch.

4. Додавати route descriptor builders лише разом із видаленнями.
   Generic route target і route sender helpers прийнятні лише якщо вони одразу
   зменшують route-heavy plugins: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo і Zalo Personal.

5. Додавати command/event presets лише разом із видаленнями.
   Централізувати text-command, native-command, callback і origin-subject shapes.
   Command consumers мають за замовчуванням бути unauthorized, коли command gate
   не запускався; events не мають починати pairing.

6. Додавати identity presets лише там, де вони прибирають boilerplate.
   Stable-id, stable-id-plus-aliases, phone/e164 і multi-identifier helpers
   дозволені, коли raw values входять лише в adapter input, а redacted state
   тримає opaque ids/counts.

7. Спільно використовувати authorized turn assembly.
   Поза ядром ingress видалити повторюваний route/envelope/context/reply
   scaffolding з QA Channel, IRC, Nextcloud Talk, Zalo і Zalo Personal.
   Ядро може володіти route/session/envelope/dispatch sequencing; плагіни
   зберігають delivery і channel-specific context.

8. Ізолювати сумісність.
   Deprecated SDK helpers залишаються source-compatible, але bundled hot paths
   не мають імпортувати deprecated ingress або command-auth facades. Compatibility
   tests мають використовувати фейкові сторонні плагіни, а не internals вбудованих
   плагінів.

9. Перепакувати ядро.
   Після того як plugins споживають runtime projections напряму, згорнути one-use
   modules, видалити unused exports, перенести compatibility projection з hot paths
   і залишити сфокусовані тести для identity, route, command/event, activation,
   access groups і compatibility shims.

## Хвилі видалення

Запускати в цьому порядку. Кожна хвиля має знижувати bundled production LOC.

1. Згортання wrapper, очікувана plugin delta: -400 до -600.
   Замінити plugin-local result types `resolveXAccess`, `resolveXCommandAccess` і
   `accessFromIngress` прямими читаннями з `ResolvedChannelMessageIngress`. Перші
   цілі: Discord DM command auth, Feishu policy, Matrix access state,
   Telegram ingress, Signal access policy, QQBot SDK adapter.

2. Спільні outcome helpers, очікувана plugin delta: -200 до -350.
   Додати один generic classifier лише якщо він видаляє повторювані
   `shouldBlockControlCommand`, pairing, activation skip, route block і sender
   block ladders щонайменше у трьох плагінах.

3. Route descriptor builders, очікувана plugin delta: -200 до -350.
   Перенести повторюваний route target і route sender descriptor assembly у core
   helpers. Перші цілі: Google Chat, IRC, Microsoft Teams, Nextcloud Talk,
   Mattermost, Slack, Zalo, Zalo Personal.

4. Спільний turn assembly, очікувана plugin delta: -250 до -450.
   Використати спільне route/session/envelope/dispatch sequencing для простих
   inbound plugins. Перші цілі: QA Channel, IRC, Nextcloud Talk, Zalo,
   Zalo Personal.

5. Перепакування ядра, очікувана core delta: -300 до -700.
   Після того як plugins напряму споживають runtime projections, видалити one-use
   modules, злити tiny files назад у `runtime.ts` або сфокусовані siblings і тримати
   SDK compatibility files окремо від bundled hot paths.

6. Обрізання тестів, очікувана test delta: -300 до -600.
   Видалити тести, які лише перевіряють прибрані wrapper shapes. Залишити behavior
   tests для command denial, group fallback, origin-subject matching,
   activation skip, access groups, pairing і redaction.

Очікувана мінімальна форма landing після цих хвиль:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Не переміщати

Не переміщуйте стандартні значення конфігурації платформи, UX налаштування, текст doctor/fix, API lookup-и,
перевірки присутності власника Slack, обробку alias/verification Matrix, розбір callback-ів Telegram,
розбір синтаксису команд, реєстрацію нативних команд, розбір payload-ів реакцій, відповіді на спарювання, відповіді команд, acks, typing, media, history
або logs.

## Перевірка

Цільовий локальний цикл:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Використовуйте Testbox для широких changed gates/доказу повного набору тестів, щойно тренд LOC
буде в межах бюджету.

Кожен робочий пакет фіксує:

- LOC до/після за категорією
- видалені обгортки Plugin
- LOC нових core helper-ів, якщо є
- виконані цільові тести
- список решти hotspot-ів

## Критерії виходу

- вбудовані production imports не мають застарілих фасадів channel-access або command-auth
- код сумісності ізольовано в SDK/core seams
- вбудовані Plugin споживають ingress projections або generic outcomes напряму
- production LOC Plugin має щонайменше 1 500 net negative проти `origin/main`
- core production LOC становить <= +1 500, або будь-яке перевищення компенсовано, доки загальний показник лишається
  <= +2 000
- репрезентативні тести покривають redaction, route, command/event, activation,
  access-group і channel-specific fallback behavior
