---
read_when:
    - Выполнение или повторное выполнение полной проверки релиза
    - Сравнение профилей проверки стабильного и полного релиза
    - Отладка сбоев этапа проверки релиза
summary: Этапы полной проверки релиза, дочерние рабочие процессы, профили релиза, обработчики повторного запуска и доказательства
title: Полная проверка релиза
x-i18n:
    generated_at: "2026-06-28T23:43:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` — это общий зонтик релиза. Это единая ручная
точка входа для дорелизного подтверждения, но большая часть работы выполняется в дочерних workflows, чтобы
упавшую среду можно было перезапустить без повторного запуска всего релиза.

Запускайте его из доверенной ссылки workflow, обычно `main`, и передавайте релизную ветку,
тег или полный SHA коммита как `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Дочерние workflows используют доверенную ссылку workflow для harness и входной
`ref` для проверяемого кандидата. Это позволяет использовать новую логику валидации
при проверке более старой релизной ветки или тега.

`release_profile=stable` и `release_profile=full` всегда запускают исчерпывающий
live/Docker soak. Передайте `run_release_soak=true`, чтобы включить те же soak lanes
для beta-профиля. Публикация стабильного релиза отклоняет манифест валидации без этого
soak и блокирующего evidence по product-performance.

Package Acceptance обычно собирает tarball кандидата из разрешенного
`ref`, включая запуски по полному SHA, отправленные через `pnpm ci:full-release`. После
публикации beta передайте `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`, чтобы повторно использовать
опубликованный npm-пакет во всех release checks, Package Acceptance, cross-OS,
release-path Docker и package Telegram. Используйте `package_acceptance_package_spec`
только когда Package Acceptance должен намеренно подтвердить другой пакет.
Live package lane Plugin Codex следует тому же состоянию: опубликованные
значения `release_package_spec` выводят `codex_plugin_spec=npm:@openclaw/codex@<version>`;
запуски по SHA/артефакту упаковывают `extensions/codex` из выбранного ref; а операторы
могут задать `codex_plugin_spec` напрямую для источников Plugin
`npm:`, `npm-pack:` или `git:`. Lane выдает явное разрешение на установку Codex CLI,
требуемое этим Plugin, затем запускает preflight Codex CLI и ходы агента OpenAI в той же сессии.

## Верхнеуровневые этапы

| Этап                 | Подробности                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Разрешение target    | **Job:** `Resolve target ref`<br />**Дочерний workflow:** нет<br />**Подтверждает:** разрешает релизную ветку, тег или полный SHA коммита и записывает выбранные входные данные.<br />**Повторный запуск:** перезапустите umbrella, если это завершилось ошибкой.                                                                                                                                                                                          |
| Vitest и обычный CI  | **Job:** `Run normal full CI`<br />**Дочерний workflow:** `CI`<br />**Подтверждает:** ручной полный граф CI для target ref, включая Linux Node lanes, шарды bundled plugin, шарды контрактов plugin и каналов, совместимость с Node 22, `check-*`, `check-additional-*`, smoke-проверки build-артефактов, проверки документации, Python skills, Windows, macOS, i18n Control UI и Android через umbrella.<br />**Повторный запуск:** `rerun_group=ci`. |
| Дорелизная проверка Plugin | **Job:** `Run plugin prerelease validation`<br />**Дочерний workflow:** `Plugin Prerelease`<br />**Подтверждает:** релизные статические проверки Plugin, agentic-покрытие Plugin, полные batch-шарды расширений, дорелизные Docker lanes Plugin и неблокирующий артефакт `plugin-inspector-advisory` для триажа совместимости.<br />**Повторный запуск:** `rerun_group=plugin-prerelease`.                                                         |
| Release checks       | **Job:** `Run release/live/Docker/QA validation`<br />**Дочерний workflow:** `OpenClaw Release Checks`<br />**Подтверждает:** install smoke, cross-OS package checks, Package Acceptance, паритет QA Lab, live Matrix и live Telegram. Stable- и full-профили также запускают исчерпывающие live/E2E suites и release-path chunks Docker; beta может включить их через `run_release_soak=true`.<br />**Повторный запуск:** `rerun_group=release-checks` или более узкий handle release-checks. |
| Package Telegram     | **Job:** `Run package Telegram E2E`<br />**Дочерний workflow:** `NPM Telegram Beta E2E`<br />**Подтверждает:** сфокусированный Telegram E2E для опубликованного пакета, когда задан `release_package_spec` или `npm_telegram_package_spec`. Полная валидация кандидата вместо этого использует канонический Package Acceptance Telegram E2E.<br />**Повторный запуск:** `rerun_group=npm-telegram` с `release_package_spec` или `npm_telegram_package_spec`. |
| Верификатор umbrella | **Job:** `Verify full validation`<br />**Дочерний workflow:** нет<br />**Подтверждает:** повторно проверяет записанные заключения дочерних запусков и добавляет таблицы самых медленных jobs из дочерних workflows.<br />**Повторный запуск:** перезапускайте только этот job после перезапуска упавшего дочернего workflow до зеленого состояния.                                                                                                     |

Для `ref=main` и `rerun_group=all` более новый umbrella заменяет более старый.
Когда родительский workflow отменяется, его монитор отменяет любой дочерний workflow, который он уже
отправил. Запуски валидации релизных веток и тегов по умолчанию не отменяют друг друга.

## Этапы release checks

`OpenClaw Release Checks` — самый большой дочерний workflow. Он один раз разрешает target
и подготавливает общий артефакт `release-package-under-test`, когда он нужен этапам,
работающим с пакетами или Docker.

| Этап                | Сведения                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Цель релиза         | **Задание:** `Resolve target ref`<br />**Базовый workflow:** нет<br />**Тесты:** выбранный ref, необязательный ожидаемый SHA, профиль, группа перезапуска и фильтр сфокусированного live-набора.<br />**Перезапуск:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                |
| Артефакт пакета     | **Задание:** `Prepare release package artifact`<br />**Базовый workflow:** нет<br />**Тесты:** упаковывает или выбирает один кандидатный tarball и загружает `release-package-under-test` для последующих проверок, связанных с пакетом.<br />**Перезапуск:** затронутая группа пакета, cross-OS или live/E2E.                                                                                                                                                                                     |
| Install smoke       | **Задание:** `Run install smoke`<br />**Базовый workflow:** `Install Smoke`<br />**Тесты:** полный путь установки с повторным использованием smoke-образа корневого Dockerfile, установка QR-пакета, Docker smoke для корня и Gateway, Docker-тесты установщика, smoke для глобальной установки Bun image-provider и быстрый E2E установки/удаления bundled Plugin.<br />**Перезапуск:** `rerun_group=install-smoke`.                                                                              |
| Cross-OS            | **Задание:** `cross_os_release_checks`<br />**Базовый workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Тесты:** fresh- и upgrade-дорожки в Linux, Windows и macOS для выбранного провайдера и режима с использованием кандидатного tarball и базового пакета.<br />**Перезапуск:** `rerun_group=cross-os`.                                                                                                                                                                         |
| Repo и live E2E     | **Задание:** `Run repo/live E2E validation`<br />**Базовый workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тесты:** repository E2E, live-кэш, websocket-стриминг OpenAI, native live-шарды провайдеров и Plugin, а также Docker-backed live model/backend/gateway harnesses, выбранные через `release_profile`.<br />**Запуски:** `run_release_soak=true`, `release_profile=full` или сфокусированный `rerun_group=live-e2e`.<br />**Перезапуск:** `rerun_group=live-e2e`, необязательно с `live_suite_filter`. |
| Docker release path | **Задание:** `Run Docker release-path validation`<br />**Базовый workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тесты:** Docker-чанки release-path на общем артефакте пакета.<br />**Запуски:** `run_release_soak=true`, `release_profile=full` или сфокусированный `rerun_group=live-e2e`.<br />**Перезапуск:** `rerun_group=live-e2e`.                                                                                                                                           |
| Package Acceptance  | **Задание:** `Run package acceptance`<br />**Базовый workflow:** `Package Acceptance`<br />**Тесты:** офлайн-фикстуры пакетов Plugin, обновление Plugin, канонический package E2E mock-OpenAI Telegram и проверки published-upgrade survivor на том же tarball. Блокирующие проверки релиза используют стандартную последнюю опубликованную baseline-версию; soak-проверки расширяются до каждого стабильного npm-релиза начиная с `2026.4.23` включительно плюс фикстуры reported-issue.<br />**Перезапуск:** `rerun_group=package`. |
| QA parity           | **Задание:** `Run QA Lab parity lane` и `Run QA Lab parity report`<br />**Базовый workflow:** прямые задания<br />**Тесты:** кандидатные и baseline agentic parity packs, затем отчет parity.<br />**Перезапуск:** `rerun_group=qa-parity` или `rerun_group=qa`.                                                                                                                                                                                                                                   |
| QA live Matrix      | **Задание:** `Run QA Lab live Matrix lane`<br />**Базовый workflow:** прямое задание<br />**Тесты:** быстрый live Matrix QA-профиль в окружении `qa-live-shared`.<br />**Перезапуск:** `rerun_group=qa-live` или `rerun_group=qa`.                                                                                                                                                                                                                                                                |
| QA live Telegram    | **Задание:** `Run QA Lab live Telegram lane`<br />**Базовый workflow:** прямое задание<br />**Тесты:** live Telegram QA с арендой учетных данных Convex CI.<br />**Перезапуск:** `rerun_group=qa-live` или `rerun_group=qa`.                                                                                                                                                                                                                                                                     |
| Верификатор релиза  | **Задание:** `Verify release checks`<br />**Базовый workflow:** нет<br />**Тесты:** обязательные задания release-check для выбранной группы перезапуска.<br />**Перезапуск:** перезапустить после успешного прохождения сфокусированных дочерних заданий.                                                                                                                                                                                                                                          |

## Docker-чанки release-path

Этап Docker release-path запускает эти чанки, когда `live_suite_filter`
пуст:

| Чанк                                                            | Покрытие                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Core Docker smoke-дорожки release-path.                                                                                    |
| `package-update-openai`                                         | Поведение установки/обновления пакета OpenAI, установка Codex по требованию, live-ходы Plugin Codex и вызовы инструментов Chat Completions. |
| `package-update-anthropic`                                      | Поведение установки и обновления пакета Anthropic.                                                                         |
| `package-update-core`                                           | Нейтральное к провайдерам поведение пакета и обновления.                                                                   |
| `plugins-runtime-plugins`                                       | Дорожки runtime Plugin, которые проверяют поведение Plugin.                                                                |
| `plugins-runtime-services`                                      | Дорожки runtime Plugin с сервисной поддержкой и live; включает OpenWebUI по запросу.                                      |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Пакеты установки/runtime Plugin, разделенные для параллельной валидации релиза.                                           |

Используйте целевой `docker_lanes=<lane[,lane]>` в переиспользуемом live/E2E workflow, когда
сбой произошел только в одной Docker-дорожке. Артефакты релиза включают команды
перезапуска по дорожкам с входными данными для артефакта пакета и повторного использования образа, когда они доступны.

## Профили релиза

`release_profile` в основном управляет широтой live/provider внутри проверок релиза.
Он не удаляет обычный полный CI, Plugin Prerelease, install smoke, package
acceptance или QA Lab. Профили stable и full всегда запускают исчерпывающее покрытие
repo/live E2E и Docker release-path soak. Профиль beta может включить его через
`run_release_soak=true`. Package Acceptance предоставляет канонический package
Telegram E2E для каждого полного кандидата, поэтому umbrella не дублирует этот
live poller.

| Профиль  | Предполагаемое использование          | Включенное покрытие live/provider                                                                                                                                                    |
| -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `minimum` | Самый быстрый release-critical smoke. | Live-путь OpenAI/core, Docker live-модели для OpenAI, native gateway core, native OpenAI gateway profile, native OpenAI Plugin и Docker live gateway OpenAI.                        |
| `stable`  | Стандартный профиль одобрения релиза. | `minimum` плюс Anthropic smoke, Google, MiniMax, backend, native live test harness, Docker live CLI backend, Docker ACP bind, Docker Codex harness и smoke-шард OpenCode Go.        |
| `full`    | Широкий advisory sweep.               | `stable` плюс advisory-провайдеры, live-шарды Plugin и live-шарды media.                                                                                                            |

## Добавления только для full

Эти наборы пропускаются в `stable` и включаются в `full`:

| Область                          | Покрытие только для full                                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker live models               | OpenCode Go, OpenRouter, xAI, Z.ai и Fireworks.                                                                             |
| Docker live gateway              | Advisory-провайдеры, разделенные на шарды DeepSeek/Fireworks, OpenCode Go/OpenRouter и xAI/Z.ai.                           |
| Native gateway provider profiles | Full-шарды Anthropic Opus и Sonnet/Haiku, Fireworks, DeepSeek, full-шарды моделей OpenCode Go, OpenRouter, xAI и Z.ai.     |
| Native plugin live shards        | Plugins A-K, L-N, O-Z other, Moonshot и xAI.                                                                                |
| Native media live shards         | Audio, Google music, MiniMax music и video groups A-D.                                                                      |

`stable` включает `native-live-src-gateway-profiles-anthropic-smoke` и
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` вместо этого использует более широкие
шарды моделей Anthropic и OpenCode Go. Сфокусированные перезапуски все еще могут использовать
агрегированные handles `native-live-src-gateway-profiles-anthropic` или
`native-live-src-gateway-profiles-opencode-go`.

## Сфокусированные перезапуски

Используйте `rerun_group`, чтобы не повторять несвязанные релизные задания:

| Дескриптор          | Область                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Все этапы полной релизной валидации.                                                            |
| `ci`                | Только дочерний ручной полный CI.                                                               |
| `plugin-prerelease` | Только дочерний предварительный выпуск Plugin.                                                   |
| `release-checks`    | Все этапы релизных проверок OpenClaw.                                                           |
| `install-smoke`     | Install Smoke через релизные проверки.                                                          |
| `cross-os`          | Кросс-ОС релизные проверки.                                                                     |
| `live-e2e`          | Репозиторные/live E2E и валидация релизного пути Docker.                                        |
| `package`           | Приемка пакета.                                                                                 |
| `qa`                | Паритет QA плюс live-линии QA.                                                                  |
| `qa-parity`         | Только линии и отчет паритета QA.                                                               |
| `qa-live`           | Live-линии Matrix/Telegram для QA плюс закрытые линиями Discord, WhatsApp и Slack, если включены. |
| `npm-telegram`      | E2E Telegram для опубликованного пакета; требует `release_package_spec` или `npm_telegram_package_spec`. |

Используйте `live_suite_filter` с `rerun_group=live-e2e`, когда отказал один live-набор.
Допустимые идентификаторы фильтров определены в переиспользуемом live/E2E workflow, включая
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` и
`live-codex-harness-docker`.

Дескриптор `live-gateway-advisory-docker` — это агрегированный дескриптор повторного запуска для его
трех шардов провайдеров, поэтому он по-прежнему разворачивается во все advisory-задания Docker Gateway.

Используйте `cross_os_suite_filter` с `rerun_group=cross-os`, когда отказала одна кросс-ОС линия.
Фильтр принимает идентификатор ОС, идентификатор набора или пару ОС/набор, например
`windows/packaged-upgrade`, `windows` или `packaged-fresh`. Кросс-ОС
сводки включают тайминги по фазам для линий packaged upgrade, а длительные
команды печатают строки Heartbeat, чтобы зависшее обновление Windows было видно до
тайм-аута задания.

Сбои релизных проверок QA блокируют обычную релизную валидацию. Требуемое смещение
динамических инструментов OpenClaw в стандартном уровне также блокирует верификатор релизных проверок.
Запуски Tideclaw alpha могут по-прежнему считать линии релизных проверок, не связанные с безопасностью пакета,
рекомендательными. Когда `live_suite_filter` явно запрашивает закрытую live-линию QA,
например Discord, WhatsApp или Slack, соответствующая переменная репозитория
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` должна быть включена; иначе
захват ввода завершится ошибкой вместо молчаливого пропуска линии. Перезапустите `rerun_group=qa`,
`qa-parity` или `qa-live`, когда нужны свежие доказательства QA.

## Доказательства, которые нужно сохранить

Сохраняйте сводку `Full Release Validation` как индекс релизного уровня. Она ссылается
на идентификаторы дочерних запусков и включает таблицы самых медленных заданий. При сбоях сначала
проверьте дочерний workflow, затем повторно запустите наименьший подходящий дескриптор выше.

Полезные артефакты:

- `release-package-under-test` из `OpenClaw Release Checks`
- Артефакты релизного пути Docker в `.artifacts/docker-tests/`
- `package-under-test` приемки пакета и артефакты приемки Docker
- Артефакты кросс-ОС релизных проверок для каждой ОС и набора
- Артефакты паритета QA, Matrix и Telegram

## Файлы workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
