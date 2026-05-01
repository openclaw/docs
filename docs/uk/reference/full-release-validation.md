---
read_when:
    - Запуск або повторний запуск повної перевірки релізу
    - Порівняння стабільного та повного профілів перевірки релізу
    - Налагодження збоїв на етапі перевірки релізу
summary: Етапи повної перевірки релізу, дочірні робочі процеси, профілі релізу, дескриптори повторного запуску та докази
title: Повна перевірка релізу
x-i18n:
    generated_at: "2026-05-01T02:24:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef87c4b54ed8e4834d5417f8be80b99e7d9c9476caefe0581b0864b07bcc4e1a
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` — це парасолька релізу. Це єдина ручна
точка входу для передрелізного підтвердження, але більшість роботи відбувається в дочірніх workflow, щоб
невдалий бокс можна було запустити повторно без перезапуску всього релізу.

Запускайте її з довіреного посилання workflow, зазвичай `main`, і передайте релізну гілку,
тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Дочірні workflow використовують довірене посилання workflow для harness і вхідний
`ref` для кандидата, що тестується. Це зберігає доступність нової логіки валідації
під час перевірки старішої релізної гілки або тегу.

## Верхньорівневі етапи

| Етап                  | Назва job у workflow                      | Дочірній workflow         | Що підтверджує                                                                                                                                                                                                                                                                  | Handle для повторного запуску                                  |
| --------------------- | ----------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Визначення target     | `Resolve target ref`                      | немає                     | Визначає релізну гілку, тег або повний SHA коміту та записує вибрані вхідні дані.                                                                                                                                                                                              | Повторно запустіть парасольку, якщо це не вдасться.             |
| Vitest і звичайний CI | `Run normal full CI`                      | `CI`                      | Ручний повний граф CI проти target ref, включно з Linux Node lanes, shards bundled plugin, контрактами каналів, сумісністю Node 22, `check`, `check-additional`, build smoke, перевірками документації, Python Skills, Windows, macOS, Control UI i18n і Android через парасольку. | `rerun_group=ci`                                                |
| Передреліз Plugin     | `Run plugin prerelease validation`        | `Plugin Prerelease`       | Статичні перевірки Plugin лише для релізу, покриття agentic plugin, повні shards batch extensions і передрелізні Docker lanes для Plugin.                                                                                                                                      | `rerun_group=plugin-prerelease`                                 |
| Перевірки релізу      | `Run release/live/Docker/QA validation`   | `OpenClaw Release Checks` | Install smoke, cross-OS перевірки пакета, live/E2E suites, Docker release-path chunks, Package Acceptance, QA Lab parity, live Matrix і live Telegram.                                                                                                                         | `rerun_group=release-checks` або вужчий release-checks handle   |
| Telegram після публікації | `Run post-publish Telegram E2E`       | `NPM Telegram Beta E2E`   | Необов’язкове підтвердження Telegram для опублікованого пакета, коли задано `npm_telegram_package_spec`.                                                                                                                                                                       | `rerun_group=npm-telegram`                                      |
| Перевірник парасольки | `Verify full validation`                  | немає                     | Повторно перевіряє записані висновки дочірніх запусків і додає таблиці найповільніших job із дочірніх workflow.                                                                                                                                                                | Повторно запустіть лише цю job після доведення невдалої дочірньої до green. |

Для `ref=main` і `rerun_group=all` новіша парасолька замінює старішу.
Коли parent скасовано, його монітор скасовує будь-який дочірній workflow, який він уже
запустив. Запуски валідації релізних гілок і тегів типово не скасовують один одного.

## Етапи перевірок релізу

`OpenClaw Release Checks` — найбільший дочірній workflow. Він один раз визначає target
і готує спільний артефакт `release-package-under-test`, коли він потрібен етапам,
орієнтованим на пакет або Docker.

| Етап                | Назва job у workflow                                      | Допоміжний workflow або jobs                    | Що тестує                                                                                                                                                                                                        | Handle для повторного запуску                              |
| ------------------- | --------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Release target      | `Resolve target ref`                                      | немає                                           | Валідує вибраний ref, необов’язковий очікуваний SHA, профіль, rerun group і сфокусований фільтр live suite.                                                                                                      | Повторно запустіть `release-checks`.                        |
| Артефакт пакета     | `Prepare release package artifact`                        | немає                                           | Пакує або визначає один candidate tarball і завантажує `release-package-under-test` для downstream перевірок, орієнтованих на пакет.                                                                             | Повторно запустіть відповідну групу package, cross-OS або live/E2E. |
| Install smoke       | `Run install smoke`                                       | `Install Smoke`                                 | Повний шлях встановлення з повторним використанням root Dockerfile smoke image, QR package install, root і Gateway Docker smokes, installer Docker tests, Bun global install image-provider smoke і швидкий bundled-plugin Docker E2E. | `rerun_group=install-smoke`                                 |
| Cross-OS            | `cross_os_release_checks`                                 | `OpenClaw Cross-OS Release Checks (Reusable)`   | Fresh і upgrade lanes на Linux, Windows і macOS для вибраного provider і mode з використанням candidate tarball плюс baseline package.                                                                           | `rerun_group=cross-os`                                      |
| Repo і live E2E     | `Run repo/live E2E validation`                            | `OpenClaw Live And E2E Checks (Reusable)`       | Repository E2E, live cache, OpenAI websocket streaming, native live provider і plugin shards, а також live model/backend/gateway harnesses на базі Docker, вибрані через `release_profile`.                       | `rerun_group=live-e2e`, необов’язково з `live_suite_filter` |
| Docker release path | `Run Docker release-path validation`                      | `OpenClaw Live And E2E Checks (Reusable)`       | Docker chunks release-path проти спільного артефакта пакета.                                                                                                                                                     | `rerun_group=live-e2e`                                      |
| Package Acceptance  | `Run package acceptance`                                  | `Package Acceptance`                            | Сумісність залежностей bundled-channel у нативному для артефакта режимі, offline plugin package fixtures і mock-OpenAI Telegram package acceptance проти того самого tarball.                                    | `rerun_group=package`                                       |
| QA parity           | `Run QA Lab parity lane` і `Run QA Lab parity report`     | прямі jobs                                      | Candidate і baseline agentic parity packs, потім parity report.                                                                                                                                                  | `rerun_group=qa-parity` або `rerun_group=qa`                |
| QA live Matrix      | `Run QA Lab live Matrix lane`                             | пряма job                                       | Швидкий профіль live Matrix QA в середовищі `qa-live-shared`.                                                                                                                                                    | `rerun_group=qa-live` або `rerun_group=qa`                  |
| QA live Telegram    | `Run QA Lab live Telegram lane`                           | пряма job                                       | Live Telegram QA з leases облікових даних Convex CI.                                                                                                                                                             | `rerun_group=qa-live` або `rerun_group=qa`                  |
| Перевірник релізу   | `Verify release checks`                                   | немає                                           | Перевіряє обов’язкові release-check jobs для вибраної rerun group.                                                                                                                                               | Повторно запустіть після успішного проходження сфокусованих дочірніх jobs. |

## Docker release-path chunks

Етап Docker release-path запускає ці chunks, коли `live_suite_filter`
порожній:

| Фрагмент                                                                                   | Покриття                                                                     |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `core`                                                                                     | Димові лінії основного Docker release-path.                                  |
| `package-update-openai`                                                                    | Поведінка встановлення та оновлення пакета OpenAI.                           |
| `package-update-anthropic`                                                                 | Поведінка встановлення та оновлення пакета Anthropic.                        |
| `package-update-core`                                                                      | Нейтральна до провайдера поведінка пакета й оновлення.                       |
| `plugins-runtime-plugins`                                                                  | Лінії середовища виконання Plugin, які перевіряють поведінку Plugin.         |
| `plugins-runtime-services`                                                                 | Лінії середовища виконання Plugin із сервісною підтримкою; включає OpenWebUI за запитом. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h`                            | Пакети встановлення/виконання Plugin, розділені для паралельної перевірки релізу. |
| `bundled-channels-core`                                                                    | Поведінка вбудованих каналів Docker.                                         |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | Поведінка оновлення вбудованих каналів.                                      |
| `bundled-channels-contracts`                                                               | Перевірки контрактів вбудованих каналів у Docker release path.               |

Використовуйте цільовий `docker_lanes=<lane[,lane]>` у повторно використовуваному workflow live/E2E, коли
збій стався лише в одній лінії Docker. Артефакти релізу містять команди повторного запуску
для кожної лінії з вхідними даними повторного використання артефакта пакета та образу, коли вони доступні.

## Профілі релізу

`release_profile` керує лише широтою live/provider у перевірках релізу. Він
не прибирає звичайний повний CI, Plugin Prerelease, install smoke, package
acceptance, QA Lab або фрагменти Docker release-path.

| Профіль  | Призначене використання              | Увімкнене покриття live/provider                                                                                                                                              |
| -------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Найшвидший критичний для релізу smoke. | Live-шлях OpenAI/core, live-моделі Docker для OpenAI, ядро native gateway, профіль native OpenAI gateway, native OpenAI plugin і Docker live gateway OpenAI.                  |
| `stable`  | Типовий профіль схвалення релізу.    | `minimum` плюс Anthropic, Google, MiniMax, backend, native live test harness, Docker live CLI backend, Docker ACP bind, Docker Codex harness і OpenCode Go smoke shard.       |
| `full`    | Широке advisory-перевіряння.         | `stable` плюс advisory-провайдери, plugin live shards і media live shards.                                                                                                    |

## Додатки лише для full

Ці набори пропускаються у `stable` і включаються у `full`:

| Область                          | Покриття лише для full                                                         |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Docker live models               | OpenCode Go, OpenRouter, xAI, Z.ai і Fireworks.                                |
| Docker live gateway              | Advisory shard для DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI і Z.ai.   |
| Native gateway provider profiles | Fireworks, DeepSeek, повні шарди моделей OpenCode Go, OpenRouter, xAI і Z.ai.  |
| Native plugin live shards        | Plugins A-K, L-N, O-Z other, Moonshot і xAI.                                   |
| Native media live shards         | Audio, Google music, MiniMax music і video groups A-D.                         |

`stable` включає `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
натомість використовує ширші шарди моделей OpenCode Go.

## Сфокусовані повторні запуски

Використовуйте `rerun_group`, щоб не повторювати не пов’язані з цим release boxes:

| Ідентифікатор       | Обсяг                                             |
| ------------------- | ------------------------------------------------- |
| `all`               | Усі етапи Full Release Validation.                |
| `ci`                | Лише дочірній ручний full CI.                     |
| `plugin-prerelease` | Лише дочірній Plugin Prerelease.                  |
| `release-checks`    | Усі етапи OpenClaw Release Checks.                |
| `install-smoke`     | Install Smoke через release checks.               |
| `cross-os`          | Перевірки релізу Cross-OS.                        |
| `live-e2e`          | Repo/live E2E і перевірка Docker release-path.    |
| `package`           | Package Acceptance.                               |
| `qa`                | QA parity плюс QA live lanes.                     |
| `qa-parity`         | Лише QA parity lanes і звіт.                      |
| `qa-live`           | Лише QA live Matrix і Telegram.                   |
| `npm-telegram`      | Лише необов’язковий Telegram E2E після публікації. |

Використовуйте `live_suite_filter` з `rerun_group=live-e2e`, коли одна live suite завершилася збоєм.
Чинні ідентифікатори фільтрів визначені в повторно використовуваному workflow live/E2E, зокрема
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` і
`live-codex-harness-docker`.

## Докази, які слід зберігати

Зберігайте зведення `Full Release Validation` як індекс рівня релізу. Воно посилається
на ідентифікатори дочірніх запусків і містить таблиці найповільніших jobs. У разі збоїв спочатку перевірте дочірній
workflow, а потім повторно запустіть найменший відповідний ідентифікатор вище.

Корисні артефакти:

- `release-package-under-test` з `OpenClaw Release Checks`
- Артефакти Docker release-path у `.artifacts/docker-tests/`
- `package-under-test` з Package Acceptance і артефакти Docker acceptance
- Артефакти Cross-OS release-check для кожної OS і suite
- Артефакти QA parity, Matrix і Telegram

## Файли workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
