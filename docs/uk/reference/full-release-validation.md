---
read_when:
    - Запуск або повторний запуск повної перевірки релізу
    - Порівняння профілів перевірки стабільного та повного релізу
    - Налагодження збоїв етапу перевірки релізу
summary: Етапи повної перевірки випуску, дочірні робочі процеси, профілі випуску, дескриптори повторного запуску та докази
title: Повна перевірка релізу
x-i18n:
    generated_at: "2026-05-03T12:10:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` є загальною перевіркою релізу. Це єдина ручна
точка входу для передрелізного підтвердження, але більшість роботи відбувається в дочірніх workflow, щоб
невдалий box можна було перезапустити без перезапуску всього релізу.

Запускайте його з довіреного ref workflow, зазвичай `main`, і передавайте релізну гілку,
тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Дочірні workflow використовують довірений ref workflow для harness і вхідний
`ref` для кандидата, що тестується. Це забезпечує доступність нової логіки валідації
під час перевірки старішої релізної гілки або тегу.

Package Acceptance зазвичай збирає tarball кандидата з розв’язаного
`ref`, включно із запусками для повного SHA, відправленими через `pnpm ci:full-release`. Після
публікації передайте `package_acceptance_package_spec=openclaw@YYYY.M.D` (або
`openclaw@beta`/`openclaw@latest`), щоб натомість запустити ту саму матрицю package/update для
поставленого npm-пакета.

## Етапи верхнього рівня

| Етап                 | Подробиці                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Розв’язання цілі     | **Завдання:** `Resolve target ref`<br />**Дочірній workflow:** немає<br />**Підтверджує:** розв’язує релізну гілку, тег або повний SHA коміту та записує вибрані вхідні дані.<br />**Повторний запуск:** перезапустіть загальну перевірку, якщо це не вдається.                                                                                                                                                                              |
| Vitest і звичайний CI | **Завдання:** `Run normal full CI`<br />**Дочірній workflow:** `CI`<br />**Підтверджує:** ручний повний граф CI для цільового ref, включно з Linux Node lanes, shards для bundled plugin, контрактами каналів, сумісністю Node 22, `check`, `check-additional`, build smoke, перевірками документації, Python skills, Windows, macOS, i18n Control UI та Android через загальну перевірку.<br />**Повторний запуск:** `rerun_group=ci`. |
| Передрелізна перевірка Plugin | **Завдання:** `Run plugin prerelease validation`<br />**Дочірній workflow:** `Plugin Prerelease`<br />**Підтверджує:** релізні статичні перевірки Plugin, agentic-покриття plugin, повні batch shards розширень і передрелізні Docker lanes для plugin.<br />**Повторний запуск:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Перевірки релізу     | **Завдання:** `Run release/live/Docker/QA validation`<br />**Дочірній workflow:** `OpenClaw Release Checks`<br />**Підтверджує:** install smoke, крос-OS перевірки package, live/E2E suites, chunks релізного Docker-шляху, Package Acceptance, паритет QA Lab, live Matrix і live Telegram.<br />**Повторний запуск:** `rerun_group=release-checks` або вужчий handle release-checks.                                |
| Артефакт package     | **Завдання:** `Prepare release package artifact`<br />**Дочірній workflow:** немає<br />**Підтверджує:** створює батьківський tarball `release-package-under-test` достатньо рано для перевірок, орієнтованих на package, яким не потрібно чекати на `OpenClaw Release Checks`.<br />**Повторний запуск:** перезапустіть загальну перевірку або надайте `npm_telegram_package_spec` для `rerun_group=npm-telegram`.                                   |
| Package Telegram     | **Завдання:** `Run package Telegram E2E`<br />**Дочірній workflow:** `NPM Telegram Beta E2E`<br />**Підтверджує:** підтвердження package Telegram, підкріплене батьківським артефактом, для `rerun_group=all` з `release_profile=full`, або підтвердження Telegram для опублікованого package, коли встановлено `npm_telegram_package_spec`.<br />**Повторний запуск:** `rerun_group=npm-telegram` з `npm_telegram_package_spec`.                              |
| Верифікатор загальної перевірки | **Завдання:** `Verify full validation`<br />**Дочірній workflow:** немає<br />**Підтверджує:** повторно перевіряє записані висновки дочірніх запусків і додає таблиці найповільніших завдань із дочірніх workflow.<br />**Повторний запуск:** перезапустіть лише це завдання після успішного перезапуску невдалого дочірнього workflow.                                                                                                                                   |

Для `ref=main` і `rerun_group=all` новіша загальна перевірка замінює старішу.
Коли батьківський workflow скасовано, його monitor скасовує будь-який дочірній workflow, який він уже
відправив. Запуски перевірки релізних гілок і тегів за замовчуванням не скасовують один одного.

## Етапи перевірок релізу

`OpenClaw Release Checks` є найбільшим дочірнім workflow. Він розв’язує ціль
один раз і готує спільний артефакт `release-package-under-test`, коли він потрібен етапам,
орієнтованим на package або Docker.

| Етап                | Подробиці                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Релізна ціль        | **Завдання:** `Resolve target ref`<br />**Підтримувальний workflow:** немає<br />**Тести:** вибраний ref, необов’язковий очікуваний SHA, профіль, група повторного запуску та сфокусований фільтр live suite.<br />**Повторний запуск:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Артефакт package    | **Завдання:** `Prepare release package artifact`<br />**Підтримувальний workflow:** немає<br />**Тести:** пакує або розв’язує один tarball кандидата й завантажує `release-package-under-test` для подальших перевірок, орієнтованих на package.<br />**Повторний запуск:** відповідна група package, cross-OS або live/E2E.                                                                                                           |
| Install smoke       | **Завдання:** `Run install smoke`<br />**Підтримувальний workflow:** `Install Smoke`<br />**Тести:** повний шлях установлення з повторним використанням root Dockerfile smoke image, встановлення QR package, root і gateway Docker smokes, Docker-тести інсталятора, Bun global install image-provider smoke і швидкий bundled-plugin install/uninstall E2E.<br />**Повторний запуск:** `rerun_group=install-smoke`.                              |
| Cross-OS            | **Завдання:** `cross_os_release_checks`<br />**Підтримувальний workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Тести:** fresh і upgrade lanes у Linux, Windows і macOS для вибраного provider і mode, з використанням tarball кандидата та baseline package.<br />**Повторний запуск:** `rerun_group=cross-os`.                                                                               |
| Repo та live E2E    | **Завдання:** `Run repo/live E2E validation`<br />**Підтримувальний workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тести:** repository E2E, live cache, OpenAI websocket streaming, native live provider і plugin shards, а також Docker-backed live model/backend/gateway harnesses, вибрані за `release_profile`.<br />**Повторний запуск:** `rerun_group=live-e2e`, необов’язково з `live_suite_filter`. |
| Docker release path | **Завдання:** `Run Docker release-path validation`<br />**Підтримувальний workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тести:** chunks релізного Docker-шляху для спільного артефакта package.<br />**Повторний запуск:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Завдання:** `Run package acceptance`<br />**Підтримувальний workflow:** `Package Acceptance`<br />**Тести:** offline fixtures package plugin, оновлення plugin, приймання package mock-OpenAI Telegram і перевірки збереження published-upgrade з кожного stable npm release на або після `2026.4.23` для того самого tarball.<br />**Повторний запуск:** `rerun_group=package`.                                         |
| QA parity           | **Завдання:** `Run QA Lab parity lane` і `Run QA Lab parity report`<br />**Підтримувальний workflow:** прямі завдання<br />**Тести:** candidate і baseline agentic parity packs, потім parity report.<br />**Повторний запуск:** `rerun_group=qa-parity` або `rerun_group=qa`.                                                                                                                                       |
| QA live Matrix      | **Завдання:** `Run QA Lab live Matrix lane`<br />**Підтримувальний workflow:** пряме завдання<br />**Тести:** швидкий live Matrix QA profile у середовищі `qa-live-shared`.<br />**Повторний запуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                                        |
| QA live Telegram    | **Завдання:** `Run QA Lab live Telegram lane`<br />**Підтримувальний workflow:** пряме завдання<br />**Тести:** live Telegram QA з leases облікових даних Convex CI.<br />**Повторний запуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                                                    |
| Верифікатор релізу  | **Завдання:** `Verify release checks`<br />**Підтримувальний workflow:** немає<br />**Тести:** обов’язкові завдання release-check для вибраної групи повторного запуску.<br />**Повторний запуск:** перезапустіть після проходження сфокусованих дочірніх завдань.                                                                                                                                                                                                 |

## Chunks Docker release-path

Етап Docker release-path запускає ці chunks, коли `live_suite_filter` є
порожнім:

| Chunk                                                           | Покриття                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Core Docker release-path smoke lanes.                                   |
| `package-update-openai`                                         | Поведінка встановлення й оновлення package OpenAI.                             |
| `package-update-anthropic`                                      | Поведінка встановлення й оновлення package Anthropic.                          |
| `package-update-core`                                           | Нейтральна щодо provider поведінка package і update.                           |
| `plugins-runtime-plugins`                                       | Runtime lanes Plugin, що перевіряють поведінку plugin.                     |
| `plugins-runtime-services`                                      | Runtime lanes Plugin, підкріплені сервісом; включає OpenWebUI, коли запитано. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Batch встановлення/runtime Plugin, розділені для паралельної валідації релізу.   |

Використовуйте цільовий `docker_lanes=<lane[,lane]>` у повторно використовуваному live/E2E workflow, коли
завершився з помилкою лише один Docker-лан. Артефакти релізу містять команди
повторного запуску для кожного лану з вхідними параметрами повторного використання
артефакта пакета й образу, коли вони доступні.

## Профілі релізу

`release_profile` переважно керує широтою live/провайдерів у перевірках релізу.
Він не прибирає звичайний повний CI, Plugin Prerelease, install smoke, package
acceptance, QA Lab або фрагменти Docker release-path. `full` також змушує
зонтичний запуск виконувати package Telegram E2E з батьківським артефактом пакета релізу, коли
`rerun_group=all`, тож повний кандидат перед публікацією не пропускає тихо цей
Telegram package-лан.

| Профіль  | Призначення                            | Включене покриття live/провайдерів                                                                                                                                                    |
| -------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Найшвидший критичний smoke для релізу. | OpenAI/core live path, Docker live models для OpenAI, нативне ядро Gateway, нативний профіль OpenAI Gateway, нативний OpenAI Plugin і Docker live gateway OpenAI.                     |
| `stable`  | Типовий профіль схвалення релізу.      | `minimum` плюс Anthropic smoke, Google, MiniMax, backend, нативний live test harness, Docker live CLI backend, Docker ACP bind, Docker Codex harness і smoke-шард OpenCode Go. |
| `full`    | Широкий консультативний sweep.         | `stable` плюс консультативні провайдери, live-шарди Plugin і live-шарди медіа.                                                                                                        |

## Доповнення лише для full

Ці набори пропускаються в `stable` і включаються в `full`:

| Область                         | Покриття лише для full                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker live models              | OpenCode Go, OpenRouter, xAI, Z.ai і Fireworks.                                                                             |
| Docker live gateway             | Консультативні провайдери, розділені на шарди DeepSeek/Fireworks, OpenCode Go/OpenRouter і xAI/Z.ai.                        |
| Нативні профілі провайдерів Gateway | Повні шарди Anthropic Opus і Sonnet/Haiku, Fireworks, DeepSeek, повні шарди моделей OpenCode Go, OpenRouter, xAI і Z.ai. |
| Нативні live-шарди Plugin       | Plugins A-K, L-N, O-Z other, Moonshot і xAI.                                                                                |
| Нативні live-шарди медіа        | Audio, Google music, MiniMax music і video groups A-D.                                                                      |

`stable` включає `native-live-src-gateway-profiles-anthropic-smoke` і
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` натомість використовує ширші
шарди моделей Anthropic і OpenCode Go. Сфокусовані повторні запуски все ще можуть використовувати
агреговані handle `native-live-src-gateway-profiles-anthropic` або
`native-live-src-gateway-profiles-opencode-go`.

## Сфокусовані повторні запуски

Використовуйте `rerun_group`, щоб не повторювати не пов’язані з цим релізні бокси:

| Handle              | Обсяг                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Усі етапи Full Release Validation.                                    |
| `ci`                | Лише дочірній ручний повний CI.                                       |
| `plugin-prerelease` | Лише дочірній Plugin Prerelease.                                      |
| `release-checks`    | Усі етапи OpenClaw Release Checks.                                    |
| `install-smoke`     | Install Smoke через перевірки релізу.                                 |
| `cross-os`          | Перевірки релізу Cross-OS.                                            |
| `live-e2e`          | Repo/live E2E і перевірка Docker release-path.                        |
| `package`           | Package Acceptance.                                                   |
| `qa`                | QA parity плюс QA live-лани.                                          |
| `qa-parity`         | Лише QA parity-лани та звіт.                                          |
| `qa-live`           | Лише QA live Matrix і Telegram.                                       |
| `npm-telegram`      | Published-package Telegram E2E; потребує `npm_telegram_package_spec`. |

Використовуйте `live_suite_filter` з `rerun_group=live-e2e`, коли збій стався в одному live-наборі.
Дійсні ідентифікатори фільтрів визначені в повторно використовуваному live/E2E workflow, зокрема
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` і
`live-codex-harness-docker`.

Handle `live-gateway-advisory-docker` є агрегованим handle повторного запуску для його
трьох шардів провайдерів, тому він усе одно розгортається на всі завдання advisory Docker gateway.

## Докази, які потрібно зберегти

Зберігайте зведення `Full Release Validation` як індекс рівня релізу. Воно посилається на
ідентифікатори дочірніх запусків і містить таблиці найповільніших завдань. Для збоїв спершу
перегляньте дочірній workflow, а потім повторно запустіть найменший відповідний handle вище.

Корисні артефакти:

- `release-package-under-test` з батьківського Full Release Validation і `OpenClaw Release Checks`
- Артефакти Docker release-path у `.artifacts/docker-tests/`
- `package-under-test` з Package Acceptance і артефакти Docker acceptance
- Артефакти перевірок релізу Cross-OS для кожної ОС і набору
- Артефакти QA parity, Matrix і Telegram

## Файли workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
