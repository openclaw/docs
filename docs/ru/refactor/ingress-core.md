---
read_when:
    - Аудит причин, по которым рефакторинг входящего потока канала добавил слишком много кода
    - Перенос политик маршрутов, команд, событий, активации или групп доступа из встроенных plugins в ядро
    - Проверка того, действительно ли вспомогательная функция входящего потока канала удаляет код встроенного Plugin
sidebarTitle: Ingress core deletion
summary: План с приоритетом удаления для переноса повторяющейся связующей логики входящего потока каналов в ядро.
title: План удаления ядра Ingress
x-i18n:
    generated_at: "2026-06-28T23:42:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
---

# План удаления ядра ingress

Рефакторинг ingress не является здоровым, пока он добавляет тысячи чистых строк. Централизация в ядре засчитывается только тогда, когда production-код встроенных Plugin становится меньше, а совместимость со старыми сторонними SDK изолирована в шимаx SDK/ядра.

Желаемая форма runtime:

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

Встроенные Plugin не должны переводить ingress обратно в локальные формы `AccessResult`, `GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` или `{ allowed, reasonCode }`, если этот тип не является публичным API Plugin.

## Бюджет

Измерено относительно merge-base PR с `origin/main`, включая неотслеживаемые файлы.

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

Минимальная оставшаяся очистка:

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

Удаление только комментариев не считается очисткой. Предыдущий проход по бюджету был слишком щедрым, потому что включал восстановленные поясняющие комментарии QQBot; этот документ отслеживает только перемещение исполняемого кода, документации и тестов.

Повторно измеряйте после каждой волны очистки:

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Диагноз

Первый проход добавил общее ядро ingress, а затем оставил рядом с ним слишком много локальной для Plugin авторизации:

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Это дублирует модель. Production-код ядра вырос примерно на 3 376 строк, тогда как production-код встроенных Plugin стал меньше на 1 240 строк. Это лучше, чем первый проход, но все еще не укладывается в минимальный бюджет. Исправление по-прежнему должно начинаться с удаления:

- удалить DTO Plugin, которые только переименовывают поля ingress
- удалить тесты, которые проверяют только форму обертки
- добавлять хелперы ядра только тогда, когда тот же патч удаляет код встроенных Plugin
- держать старую совместимость SDK только в шимаx SDK/ядра
- переупаковать ядро после того, как удаление оберток проявит стабильную форму

## Горячие точки

Положительные production-файлы встроенных Plugin, которые все еще нужно сократить:

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

Ветка еще не укладывается в минимальный бюджет. Оставшаяся релевантная для ревью работа должна удалять повторяющийся поток авторизации, каркас turn или тесты оберток до добавления очередной абстракции ядра.

## Текущий анализ кода

Здоровая граница ядра уже существует в `src/channels/message-access/runtime.ts`: она владеет адаптерами идентичности, эффективными allowlist, чтением pairing-store, дескрипторами маршрутов, пресетами команд/событий, группами доступа и итоговой разрешенной проекцией `ResolvedChannelMessageIngress`.

Оставшийся рост в основном связан с клеевым кодом Plugin, наложенным поверх этой границы:

- `extensions/telegram/src/ingress.ts` оборачивает решения ядра в специфичные для Telegram хелперы команд/событий, а места вызова все еще передают заранее вычисленные нормализованные allowlist и списки владельцев.
- `extensions/discord/src/monitor/dm-command-auth.ts`, `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts` и `extensions/matrix/src/matrix/monitor/access-state.ts` все еще держат локальные DTO политики или устаревшие имена решений рядом с ingress.
- `extensions/signal/src/monitor/access-policy.ts` правильно оставляет нормализацию идентичности Signal и ответы pairing локальными, но все еще имеет границу-обертку, которую нужно свернуть в прямое потребление ingress.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`, `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` и `extensions/zalouser/src/monitor.ts` все еще повторяют сборку маршрута/конверта/turn, которую можно перенести в общие хелперы turn вне ядра ingress.

Вывод: перенос большего количества кода в ядро полезен только в том случае, если в том же патче удаляются эти слои оберток Plugin. Добавление еще одной абстракции при сохранении возвращаемых обертками значений повторяет ошибку.

## Граница

Ядро владеет общей политикой:

- нормализация и сопоставление allowlist
- расширение групп доступа и диагностика
- чтение allowlist DM из pairing-store
- гейты маршрута, отправителя, команды, события и активации
- сопоставление допуска: dispatch, drop, skip, observe, pairing
- отредактированное состояние, решения, диагностика и проекции совместимости SDK
- переиспользуемые общие дескрипторы для идентичности, маршрута, команды, события, активации и исходов

Plugin владеют транспортными фактами и побочными эффектами:

- подлинность webhook/socket/request
- извлечение платформенной идентичности и API-запросы
- специфичные для канала значения политики по умолчанию
- доставка pairing challenge, ответы, подтверждения, реакции, typing, медиа, история, setup, doctor, status, логи и пользовательский текст

Ядро должно оставаться независимым от каналов: никаких Discord, Slack, Telegram, Matrix, room, guild, space, API client или специфичных для Plugin значений по умолчанию в `src/channels/message-access`.

## Правило приемки

Каждый новый хелпер ядра должен сразу удалять production-код встроенных Plugin.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Остановитесь и перепроектируйте, если:

- production LOC Plugin увеличивается
- тесты растут быстрее, чем сокращается production-код
- встроенный горячий путь возвращает DTO, который только переименовывает `ResolvedChannelMessageIngress`
- хелперу ядра нужен идентификатор канала, объект платформы, API-клиент или специфичное для канала значение по умолчанию

## Рабочие пакеты

1. Зафиксировать бюджет.
   Поместите LOC в PR, держите deprecated-ingress lint зеленым и включайте LOC до/после в коммиты очистки.

2. Удалить тонкие границы DTO.
   Замените локальные для Plugin возвращаемые значения оберток на прямое использование `ResolvedChannelMessageIngress`, `senderAccess`, `commandAccess`, `routeAccess` или `ingress`. Начните с QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage и Tlon. Удалите тесты формы оберток; сохраните поведенческие тесты.

3. Добавлять классификацию исходов только вместе с удалениями.
   Общий классификатор может предоставлять `dispatch`, `pairing-required`, `skip-activation`, `drop-command`, `drop-route`, `drop-sender` и `drop-ingress`. Он должен выводиться из графа решений, а не из строк причин, и мигрировать как минимум три Plugin в том же патче.

4. Добавлять билдеры дескрипторов маршрута только вместе с удалениями.
   Общие хелперы цели маршрута и отправителя маршрута допустимы только если они сразу сокращают Plugin с большим количеством маршрутов: Google Chat, IRC, Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo и Zalo Personal.

5. Добавлять пресеты команд/событий только вместе с удалениями.
   Централизуйте формы text-command, native-command, callback и origin-subject. Потребители команд должны по умолчанию считать команду неавторизованной, если гейт команды не выполнялся; события не должны запускать pairing.

6. Добавлять пресеты идентичности только там, где они удаляют шаблонный код.
   Хелперы stable-id, stable-id-plus-aliases, phone/e164 и multi-identifier разрешены, когда сырые значения поступают только во вход адаптера, а отредактированное состояние хранит непрозрачные идентификаторы/счетчики.

7. Разделить сборку авторизованного turn.
   Вне ядра ingress удалите повторяющийся каркас route/session/envelope/context/reply из QA Channel, IRC, Nextcloud Talk, Zalo и Zalo Personal. Ядро может владеть последовательностью route/session/envelope/dispatch; Plugin сохраняют доставку и специфичный для канала контекст.

8. Изолировать совместимость.
   Устаревшие хелперы SDK остаются source-compatible, но встроенные горячие пути не должны импортировать устаревшие ingress или фасады command-auth. Тесты совместимости должны использовать поддельные сторонние Plugin, а не внутренности встроенных Plugin.

9. Переупаковать ядро.
   После того как Plugin начнут напрямую потреблять runtime-проекции, сверните одноразовые модули, удалите неиспользуемые экспорты, вынесите проекцию совместимости из горячих путей и оставьте сфокусированные тесты для идентичности, маршрута, команды/события, активации, групп доступа и шимаx совместимости.

## Волны удаления

Запускайте их по порядку. Каждая волна должна снижать production LOC встроенных Plugin.

1. Сворачивание оберток, ожидаемая дельта Plugin: от -400 до -600.
   Замените локальные для Plugin типы результатов `resolveXAccess`, `resolveXCommandAccess` и `accessFromIngress` на прямое чтение из `ResolvedChannelMessageIngress`. Первые цели: Discord DM command auth, Feishu policy, Matrix access state, Telegram ingress, Signal access policy, QQBot SDK adapter.

2. Общие хелперы исходов, ожидаемая дельта Plugin: от -200 до -350.
   Добавьте один общий классификатор только если он удаляет повторяющиеся лестницы `shouldBlockControlCommand`, pairing, activation skip, route block и sender block как минимум в трех Plugin.

3. Билдеры дескрипторов маршрута, ожидаемая дельта Plugin: от -200 до -350.
   Перенесите повторяющуюся сборку дескрипторов цели маршрута и отправителя маршрута в хелперы ядра. Первые цели: Google Chat, IRC, Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo, Zalo Personal.

4. Разделение сборки turn, ожидаемая дельта Plugin: от -250 до -450.
   Используйте общую последовательность route/session/envelope/dispatch для простых входящих Plugin. Первые цели: QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Переупаковка ядра, ожидаемая дельта ядра: от -300 до -700.
   После того как Plugin начнут напрямую потреблять runtime-проекции, удалите одноразовые модули, объедините маленькие файлы обратно в `runtime.ts` или сфокусированные соседние файлы и держите файлы совместимости SDK отдельно от встроенных горячих путей.

6. Прореживание тестов, ожидаемая дельта тестов: от -300 до -600.
   Удалите тесты, которые проверяют только удаленные формы оберток. Сохраните поведенческие тесты для отказа команды, group fallback, сопоставления origin-subject, activation skip, групп доступа, pairing и редактирования.

Ожидаемая минимальная форма для landing после этих волн:

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Не перемещать

Не перемещайте стандартные настройки конфигурации платформы, UX настройки, текст doctor/fix, API-запросы,
проверки присутствия владельца Slack, обработку псевдонимов/проверки Matrix, разбор callback Telegram,
разбор синтаксиса команд, регистрацию нативных команд, разбор payload реакций, ответы сопряжения,
ответы команд, подтверждения, индикацию набора, медиа, историю
или логи.

## Проверка

Целевой локальный цикл:

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Используйте Testbox для широких проверок измененного кода/доказательства полного набора, когда тренд LOC
уложится в бюджет.

Каждый рабочий пакет фиксирует:

- LOC до/после по категориям
- удаленные обертки plugin
- LOC новых вспомогательных средств ядра, если есть
- выполненные целевые тесты
- оставшийся список горячих точек

## Критерии выхода

- bundled production imports не используют устаревшие фасады channel-access или command-auth
- код совместимости изолирован в швах SDK/ядра
- bundled plugins напрямую потребляют ingress projections или generic outcomes
- production LOC plugin как минимум на 1 500 меньше относительно `origin/main`
- production LOC ядра `<= +1,500`, либо любое превышение компенсировано, пока общий показатель
  остается `<= +2,000`
- репрезентативные тесты покрывают редактирование, маршруты, команды/события, активацию,
  access-group и channel-specific fallback behavior
