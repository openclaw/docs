---
read_when:
    - Аудит того, чому рефакторинг вхідної обробки каналів додав забагато коду
    - Перенесення політики маршруту, команди, події, активації або групи доступу з вбудованих плагінів до ядра
    - Перевірка, чи допоміжна функція вхідного потоку каналу справді видаляє код вбудованого Plugin
sidebarTitle: Ingress core deletion
summary: План із пріоритетом видалення для перенесення повторюваної зв’язувальної логіки вхідної обробки каналів у ядро.
title: План видалення ядра вхідного трафіку
x-i18n:
    generated_at: "2026-05-12T00:59:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
---

# План видалення ingress core

Рефакторинг ingress не є здоровим, доки додає тисячі чистих рядків. Централізація
core має значення лише тоді, коли production код вбудованих плагінів стає меншим,
а сумісність зі старим стороннім SDK ізольована в shim-шарах SDK/core.

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

Вбудовані плагіни не повинні перекладати ingress назад у локальні форми
`AccessResult`, `GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` або
`{ allowed, reasonCode }`, якщо цей тип не є публічним API плагіна.

## Бюджет

Виміряно відносно PR merge-base з `origin/main`, включно з untracked файлами.

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
занадто поблажливим, бо включав відновлені пояснювальні коментарі QQBot; цей
документ відстежує лише переміщення виконуваного коду/docs/test.

Повторно вимірюйте після кожної хвилі прибирання:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Діагноз

Перший прохід додав спільне ядро ingress, а потім залишив поруч із ним забагато
плагін-локальної авторизації:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Це дублює модель. Core production зріс приблизно на 3 376 рядків, тоді як
production код вбудованих плагінів став меншим на 1 240 рядків. Це краще, ніж
перший прохід, але ще не входить у мінімальний бюджет. Виправлення лишається
delete-first:

- видалити DTO плагінів, які лише перейменовують поля ingress
- видалити тести, які лише перевіряють форму wrapper
- додавати core helpers лише тоді, коли той самий patch видаляє код вбудованого плагіна
- тримати сумісність зі старим SDK лише в shim-шарах SDK/core
- перепакувати core після того, як видалення wrapper відкриє стабільну форму

## Гарячі точки

Додатні production файли вбудованих плагінів, які ще мають зменшитися:

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

Гілка ще не входить у мінімальний бюджет. Решта review-релевантної роботи має
видаляти повторюваний authorization flow, turn scaffolding або wrapper tests перед
додаванням чергової core абстракції.

## Поточне читання коду

Здорова core межа вже існує в `src/channels/message-access/runtime.ts`: вона
володіє identity adapters, effective allowlists, читанням pairing-store, route
descriptors, command/event presets, access groups і фінальною resolved
проєкцією `ResolvedChannelMessageIngress`.

Залишкове зростання здебільшого є плагінним glue, накладеним поверх цієї межі:

- `extensions/telegram/src/ingress.ts` обгортає core decisions у
  Telegram-специфічні command/event helpers, а call sites і далі передають
  попередньо обчислені normalized allowlists і owner lists.
- `extensions/discord/src/monitor/dm-command-auth.ts`,
  `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts`
  і `extensions/matrix/src/matrix/monitor/access-state.ts` досі тримають локальні
  policy DTO або legacy назви decision поруч з ingress.
- `extensions/signal/src/monitor/access-policy.ts` правильно залишає Signal
  identity normalization і pairing replies локальними, але досі має wrapper seam,
  який слід згорнути в пряме споживання ingress.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`,
  `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` і
  `extensions/zalouser/src/monitor.ts` досі повторюють route/envelope/turn
  assembly, який можна перенести до shared turn helpers поза ingress kernel.

Висновок: переносити більше коду в core корисно лише якщо це видаляє ці плагінні
wrapper шари в тому самому patch. Додавання ще однієї абстракції, залишаючи
wrapper returns на місці, повторює помилку.

## Межа

Core володіє generic policy:

- allowlist normalization і matching
- access-group expansion і diagnostics
- pairing-store DM allowlist reads
- route, sender, command, event і activation gates
- admission mapping: dispatch, drop, skip, observe, pairing
- redacted state, decisions, diagnostics і SDK compatibility projections
- reusable generic descriptors для identity, route, command, event, activation
  і outcomes

Плагіни володіють transport facts і side effects:

- справжність webhook/socket/request
- platform identity extraction і API lookups
- channel-specific policy defaults
- pairing challenge delivery, replies, acks, reactions, typing, media, history,
  setup, doctor, status, logs і user-facing copy

Core має залишатися channel-agnostic: жодних Discord, Slack, Telegram, Matrix, room,
guild, space, API client або plugin-specific default у
`src/channels/message-access`.

## Правило прийняття

Кожен новий core helper має одразу видаляти production код вбудованого плагіна.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Зупиніться й перепроєктуйте, якщо:

- plugin production LOC зростає
- тести ростуть швидше, ніж зменшується production
- вбудований hot path повертає DTO, який лише перейменовує `ResolvedChannelMessageIngress`
- core helper потребує channel id, platform object, API client або
  channel-specific default

## Робочі пакети

1. Заморозити бюджет.
   Додайте LOC у PR, тримайте deprecated-ingress lint зеленим і включайте before/after
   LOC у cleanup commits.

2. Видалити тонкі DTO seams.
   Замініть plugin-local wrapper returns на пряме використання
   `ResolvedChannelMessageIngress`, `senderAccess`, `commandAccess`, `routeAccess`
   або `ingress`. Почніть із QQBot, Telegram, Slack, Discord, Signal, Feishu,
   Matrix, iMessage і Tlon. Видаліть wrapper-shape tests; залиште behavior tests.

3. Додавати outcome classification лише разом із видаленнями.
   Generic classifier може expose `dispatch`, `pairing-required`,
   `skip-activation`, `drop-command`, `drop-route`, `drop-sender` і
   `drop-ingress`. Він має виводитися з decision graph, а не з reason strings,
   і мігрувати щонайменше три плагіни в тому самому patch.

4. Додавати route descriptor builders лише разом із видаленнями.
   Generic route target і route sender helpers прийнятні лише якщо вони одразу
   зменшують route-heavy плагіни: Google Chat, IRC, Microsoft Teams,
   Nextcloud Talk, Mattermost, Slack, Zalo і Zalo Personal.

5. Додавати command/event presets лише разом із видаленнями.
   Централізуйте text-command, native-command, callback і origin-subject shapes.
   Command consumers мають за замовчуванням вважатися unauthorized, коли command
   gate не запускався; events не мають починати pairing.

6. Додавати identity presets лише там, де вони прибирають boilerplate.
   Stable-id, stable-id-plus-aliases, phone/e164 і multi-identifier helpers
   дозволені, коли raw values входять лише в adapter input, а redacted state
   зберігає opaque ids/counts.

7. Спільно використовувати authorized turn assembly.
   Поза ingress kernel приберіть повторюваний route/envelope/context/reply
   scaffolding з QA Channel, IRC, Nextcloud Talk, Zalo і Zalo Personal.
   Core може володіти route/session/envelope/dispatch sequencing; плагіни
   зберігають delivery і channel-specific context.

8. Ізолювати compatibility.
   Deprecated SDK helpers лишаються source-compatible, але вбудовані hot paths не
   повинні імпортувати deprecated ingress або command-auth facades. Compatibility
   tests мають використовувати fake third-party plugins, а не internals
   вбудованих плагінів.

9. Перепакувати core.
   Після того як плагіни напряму споживатимуть runtime projections, згорніть
   one-use modules, видаліть unused exports, винесіть compatibility projection з
   hot paths і залиште сфокусовані тести для identity, route, command/event,
   activation, access groups і compatibility shims.

## Хвилі видалення

Запускайте їх у цьому порядку. Кожна хвиля має зменшувати bundled production LOC.

1. Wrapper collapse, очікувана plugin delta: -400 до -600.
   Замініть plugin-local `resolveXAccess`, `resolveXCommandAccess` і
   `accessFromIngress` result types на прямі читання з
   `ResolvedChannelMessageIngress`. Перші цілі: Discord DM command auth,
   Feishu policy, Matrix access state, Telegram ingress, Signal access policy,
   QQBot SDK adapter.

2. Shared outcome helpers, очікувана plugin delta: -200 до -350.
   Додайте один generic classifier лише якщо він видаляє повторювані
   `shouldBlockControlCommand`, pairing, activation skip, route block і sender
   block ladders у щонайменше трьох плагінах.

3. Route descriptor builders, очікувана plugin delta: -200 до -350.
   Перенесіть повторювану route target і route sender descriptor assembly у core
   helpers. Перші цілі: Google Chat, IRC, Microsoft Teams, Nextcloud Talk,
   Mattermost, Slack, Zalo, Zalo Personal.

4. Turn assembly sharing, очікувана plugin delta: -250 до -450.
   Використайте спільне route/session/envelope/dispatch sequencing для простих
   inbound plugins. Перші цілі: QA Channel, IRC, Nextcloud Talk, Zalo,
   Zalo Personal.

5. Core repack, очікувана core delta: -300 до -700.
   Після того як плагіни напряму споживатимуть runtime projections, видаліть
   one-use modules, злийте tiny files назад у `runtime.ts` або focused siblings
   і тримайте SDK compatibility files окремо від bundled hot paths.

6. Test pruning, очікувана test delta: -300 до -600.
   Видаліть тести, які лише перевіряють видалені wrapper shapes. Залиште
   behavior tests для command denial, group fallback, origin-subject matching,
   activation skip, access groups, pairing і redaction.

Очікувана мінімальна форма для landing після цих хвиль:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Не переносити

Не переміщуйте стандартні значення конфігурації платформи, UX налаштування, тексти doctor/fix, пошуки API,
перевірки присутності власника Slack, обробку псевдонімів/перевірки Matrix, розбір callback Telegram, розбір синтаксису команд, реєстрацію нативних команд, розбір payload реакцій, відповіді на спарювання, відповіді команд, підтвердження, набір тексту, медіа, історію або журнали.

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

Використовуйте Testbox для широких змінених gates/доказу повного набору тестів, щойно тенденція LOC
вкладеться в бюджет.

Кожен робочий пакет фіксує:

- LOC до/після за категорією
- видалені обгортки plugin
- нові LOC основних helper, якщо є
- виконані цільові тести
- список решти гарячих точок

## Критерії завершення

- bundled production imports не використовують застарілі фасади channel-access або command-auth
- код сумісності ізольовано в seams SDK/core
- bundled plugins споживають ingress projections або generic outcomes безпосередньо
- plugin production LOC щонайменше на 1 500 net negative відносно `origin/main`
- core production LOC становить `<= +1,500`, або будь-яке перевищення компенсовано, поки загальний обсяг
  залишається `<= +2,000`
- репрезентативні тести покривають редагування, маршрут, команду/подію, активацію,
  access-group і channel-specific fallback behavior
