---
read_when:
    - Запуск або повторний запуск повної перевірки релізу
    - Порівняння стабільного та повного профілів перевірки релізу
    - Налагодження збоїв на етапі перевірки випуску
summary: Етапи повної перевірки релізу, дочірні робочі процеси, профілі релізу, дескриптори повторного запуску та докази
title: Повна перевірка релізу
x-i18n:
    generated_at: "2026-05-04T22:29:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: d67b7f9d413aa0f367b71f03d5325ff73591ee1ee6c77623712ebd15d295ca8b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` — це парасолька релізу. Це єдина ручна
точка входу для дорелізного підтвердження, але більшість роботи відбувається в дочірніх робочих процесах, щоб
збійний блок можна було запустити повторно без перезапуску всього релізу.

Запускайте його з довіреного посилання робочого процесу, зазвичай `main`, і передавайте гілку релізу,
тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Дочірні робочі процеси використовують довірене посилання робочого процесу для обв’язки та вхідний
`ref` для кандидата, що тестується. Це зберігає доступність нової логіки валідації
під час перевірки старішої гілки релізу або тегу.

За замовчуванням `release_profile=stable` запускає блокувальні для релізу напрямки й пропускає
вичерпний live/Docker soak. Передайте `run_release_soak=true`, щоб включити
soak-напрямки у стабільний запуск. `release_profile=full` завжди вмикає soak-напрямки, щоб
широкий дорадчий профіль ніколи не втрачав покриття непомітно.

Package Acceptance зазвичай збирає tarball кандидата з розв’язаного
`ref`, включно із запусками за повним SHA, відправленими через `pnpm ci:full-release`. Після
публікації передайте `package_acceptance_package_spec=openclaw@YYYY.M.D` (або
`openclaw@beta`/`openclaw@latest`), щоб натомість запустити ту саму матрицю пакетів/оновлень проти
опублікованого npm-пакета.

## Етапи верхнього рівня

| Етап                 | Деталі                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Розв’язання цілі     | **Завдання:** `Resolve target ref`<br />**Дочірній робочий процес:** немає<br />**Підтверджує:** розв’язує гілку релізу, тег або повний SHA коміту й записує вибрані вхідні дані.<br />**Повторний запуск:** повторно запустіть парасольку, якщо це завершиться збоєм.                                                                                                                                                                      |
| Vitest і звичайний CI | **Завдання:** `Run normal full CI`<br />**Дочірній робочий процес:** `CI`<br />**Підтверджує:** ручний повний граф CI проти цільового ref, включно з напрямками Linux Node, шардами bundled Plugin, контрактами каналів, сумісністю з Node 22, `check`, `check-additional`, build smoke, перевірками документації, Python skills, Windows, macOS, Control UI i18n та Android через парасольку.<br />**Повторний запуск:** `rerun_group=ci`. |
| Дореліз Plugin       | **Завдання:** `Run plugin prerelease validation`<br />**Дочірній робочий процес:** `Plugin Prerelease`<br />**Підтверджує:** лише релізні статичні перевірки Plugin, agentic-покриття Plugin, повні шарди batch розширень і дорелізні Docker-напрямки Plugin.<br />**Повторний запуск:** `rerun_group=plugin-prerelease`.                                                                                                                   |
| Перевірки релізу     | **Завдання:** `Run release/live/Docker/QA validation`<br />**Дочірній робочий процес:** `OpenClaw Release Checks`<br />**Підтверджує:** install smoke, cross-OS перевірки пакета, Package Acceptance, паритет QA Lab, live Matrix і live Telegram. З `run_release_soak=true` або `release_profile=full` також запускає вичерпні live/E2E набори та Docker-фрагменти шляху релізу.<br />**Повторний запуск:** `rerun_group=release-checks` або вужчий дескриптор release-checks. |
| Артефакт пакета      | **Завдання:** `Prepare release package artifact`<br />**Дочірній робочий процес:** немає<br />**Підтверджує:** створює батьківський tarball `release-package-under-test` достатньо рано для перевірок, орієнтованих на пакет, яким не потрібно чекати на `OpenClaw Release Checks`.<br />**Повторний запуск:** повторно запустіть парасольку або надайте `npm_telegram_package_spec` для `rerun_group=npm-telegram`.                         |
| Package Telegram     | **Завдання:** `Run package Telegram E2E`<br />**Дочірній робочий процес:** `NPM Telegram Beta E2E`<br />**Підтверджує:** підтвердження пакета Telegram на основі батьківського артефакту для `rerun_group=all` з `release_profile=full` або підтвердження Telegram для опублікованого пакета, коли задано `npm_telegram_package_spec`.<br />**Повторний запуск:** `rerun_group=npm-telegram` з `npm_telegram_package_spec`.                |
| Верифікатор парасольки | **Завдання:** `Verify full validation`<br />**Дочірній робочий процес:** немає<br />**Підтверджує:** повторно перевіряє записані висновки дочірніх запусків і додає таблиці найповільніших завдань із дочірніх робочих процесів.<br />**Повторний запуск:** повторно запустіть лише це завдання після повторного запуску невдалого дочірнього процесу до зеленого стану.                                                                       |

Для `ref=main` і `rerun_group=all` новіша парасолька замінює старішу.
Коли батьківський процес скасовується, його монітор скасовує будь-який дочірній робочий процес, який він уже
відправив. Запуски валідації гілок релізу й тегів за замовчуванням не скасовують один одного.

## Етапи перевірок релізу

`OpenClaw Release Checks` — найбільший дочірній робочий процес. Він один раз розв’язує ціль
і готує спільний артефакт `release-package-under-test`, коли це потрібно етапам,
орієнтованим на пакет або Docker.

| Етап                | Подробиці                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ціль релізу         | **Завдання:** `Resolve target ref`<br />**Базовий workflow:** немає<br />**Тести:** вибраний ref, необов’язковий очікуваний SHA, профіль, група повторного запуску та сфокусований фільтр live-набору.<br />**Повторний запуск:** `rerun_group=release-checks`.                                                                                                                                                                                                                                          |
| Артефакт пакета     | **Завдання:** `Prepare release package artifact`<br />**Базовий workflow:** немає<br />**Тести:** пакує або визначає один кандидатний tarball і завантажує `release-package-under-test` для подальших перевірок, орієнтованих на пакет.<br />**Повторний запуск:** відповідна група пакета, cross-OS або live/E2E.                                                                                                                                                                                       |
| Install smoke       | **Завдання:** `Run install smoke`<br />**Базовий workflow:** `Install Smoke`<br />**Тести:** повний шлях встановлення з повторним використанням smoke-образу кореневого Dockerfile, встановлення QR-пакета, root і gateway Docker smokes, Docker-тести інсталятора, Bun global install image-provider smoke і швидкий E2E встановлення/видалення bundled-plugin.<br />**Повторний запуск:** `rerun_group=install-smoke`.                                                                                 |
| Cross-OS            | **Завдання:** `cross_os_release_checks`<br />**Базовий workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Тести:** свіжі та upgrade-напрями на Linux, Windows і macOS для вибраного провайдера та режиму з використанням кандидатного tarball і baseline-пакета.<br />**Повторний запуск:** `rerun_group=cross-os`.                                                                                                                                                                      |
| Repo і live E2E     | **Завдання:** `Run repo/live E2E validation`<br />**Базовий workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тести:** repository E2E, live cache, OpenAI websocket streaming, native live provider і Plugin shards, а також Docker-backed live model/backend/gateway harnesses, вибрані через `release_profile`.<br />**Запускається:** `run_release_soak=true`, `release_profile=full` або сфокусований `rerun_group=live-e2e`.<br />**Повторний запуск:** `rerun_group=live-e2e`, необов’язково з `live_suite_filter`. |
| Шлях Docker-релізу  | **Завдання:** `Run Docker release-path validation`<br />**Базовий workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тести:** Docker chunks для release-path на спільному артефакті пакета.<br />**Запускається:** `run_release_soak=true`, `release_profile=full` або сфокусований `rerun_group=live-e2e`.<br />**Повторний запуск:** `rerun_group=live-e2e`.                                                                                                                                   |
| Package Acceptance  | **Завдання:** `Run package acceptance`<br />**Базовий workflow:** `Package Acceptance`<br />**Тести:** offline fixtures пакетів Plugin, оновлення Plugin, приймання mock-OpenAI Telegram-пакета та перевірки survivor для published-upgrade на тому самому tarball. Блокувальні release-перевірки використовують стандартний останній опублікований baseline; soak-перевірки розширюються до кожного стабільного npm-релізу від `2026.4.23` включно плюс fixtures для повідомлених проблем.<br />**Повторний запуск:** `rerun_group=package`. |
| QA parity           | **Завдання:** `Run QA Lab parity lane` і `Run QA Lab parity report`<br />**Базовий workflow:** прямі jobs<br />**Тести:** кандидатні та baseline agentic parity packs, потім parity report.<br />**Повторний запуск:** `rerun_group=qa-parity` або `rerun_group=qa`.                                                                                                                                                                                                                                      |
| QA live Matrix      | **Завдання:** `Run QA Lab live Matrix lane`<br />**Базовий workflow:** пряме job<br />**Тести:** швидкий live Matrix QA-профіль у середовищі `qa-live-shared`.<br />**Повторний запуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                                                                                                                                 |
| QA live Telegram    | **Завдання:** `Run QA Lab live Telegram lane`<br />**Базовий workflow:** пряме job<br />**Тести:** live Telegram QA з орендами облікових даних Convex CI.<br />**Повторний запуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                                                                                                                                   |
| Верифікатор релізу  | **Завдання:** `Verify release checks`<br />**Базовий workflow:** немає<br />**Тести:** обов’язкові release-check jobs для вибраної групи повторного запуску.<br />**Повторний запуск:** повторно запустіть після успішного проходження сфокусованих дочірніх jobs.                                                                                                                                                                                                                                       |

## Фрагменти Docker release-path

Етап Docker release-path запускає ці фрагменти, коли `live_suite_filter`
порожній:

| Фрагмент                                                       | Покриття                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `core`                                                         | Core Docker release-path smoke-напрями.                                  |
| `package-update-openai`                                        | Поведінка встановлення та оновлення пакета OpenAI.                       |
| `package-update-anthropic`                                     | Поведінка встановлення та оновлення пакета Anthropic.                    |
| `package-update-core`                                          | Нейтральна щодо провайдера поведінка пакета й оновлення.                 |
| `plugins-runtime-plugins`                                      | Напрями runtime Plugin, які перевіряють поведінку Plugin.                |
| `plugins-runtime-services`                                     | Напрями runtime Plugin з підтримкою сервісів; включає OpenWebUI за запитом. |
| `plugins-runtime-install-a` до `plugins-runtime-install-h`     | Пакети встановлення/runtime Plugin, розділені для паралельної валідації релізу. |

Використовуйте цільові `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow, коли
збій стався лише в одному Docker-напрямі. Артефакти релізу містять команди
повторного запуску для кожного напряму з artifact пакета та вхідними даними повторного використання образу, коли вони доступні.

## Профілі релізу

`release_profile` переважно керує шириною live/provider усередині release checks.
Він не прибирає звичайний full CI, Plugin Prerelease, install smoke, package
acceptance або QA Lab. Для `stable` вичерпні repo/live E2E і Docker
release-path chunks є soak-покриттям і запускаються, коли `run_release_soak=true`.
`full` примусово вмикає soak-покриття, а також змушує umbrella-запуск виконувати package Telegram
E2E проти артефакта пакета батьківського релізу, коли `rerun_group=all`, щоб повний
pre-publish кандидат не пропускав непомітно цей напрям Telegram package.

| Профіль  | Призначене використання              | Включене live/provider-покриття                                                                                                                                         |
| -------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Найшвидший критичний для релізу smoke. | OpenAI/core live path, Docker live models для OpenAI, native gateway core, native OpenAI gateway profile, native OpenAI plugin і Docker live gateway OpenAI.            |
| `stable` | Стандартний профіль схвалення релізу. | `minimum` плюс Anthropic smoke, Google, MiniMax, backend, native live test harness, Docker live CLI backend, Docker ACP bind, Docker Codex harness і OpenCode Go smoke shard. |
| `full`   | Широкий advisory sweep.              | `stable` плюс advisory providers, plugin live shards і media live shards.                                                                                               |

## Додатки лише для full

Ці набори пропускаються в `stable` і включаються в `full`:

| Область                         | Покриття лише для full                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker live models              | OpenCode Go, OpenRouter, xAI, Z.ai і Fireworks.                                                                             |
| Docker live gateway             | Advisory providers, розділені на shards DeepSeek/Fireworks, OpenCode Go/OpenRouter і xAI/Z.ai.                              |
| Native gateway provider profiles | Full Anthropic Opus і Sonnet/Haiku shards, Fireworks, DeepSeek, full OpenCode Go model shards, OpenRouter, xAI і Z.ai.       |
| Native plugin live shards       | Plugins A-K, L-N, O-Z other, Moonshot і xAI.                                                                                |
| Native media live shards        | Audio, Google music, MiniMax music і video groups A-D.                                                                      |

`stable` включає `native-live-src-gateway-profiles-anthropic-smoke` і
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` натомість використовує ширші
Anthropic і OpenCode Go model shards. Сфокусовані повторні запуски все ще можуть використовувати
агреговані handles `native-live-src-gateway-profiles-anthropic` або
`native-live-src-gateway-profiles-opencode-go`.

## Сфокусовані повторні запуски

Використовуйте `rerun_group`, щоб не повторювати непов’язані release boxes:

| Ідентифікатор       | Область                                                              |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Усі етапи повної валідації релізу.                                    |
| `ci`                | Лише дочірній ручний повний CI.                                       |
| `plugin-prerelease` | Лише дочірній попередній реліз Plugin.                                |
| `release-checks`    | Усі етапи перевірок релізу OpenClaw.                                  |
| `install-smoke`     | Install Smoke через перевірки релізу.                                 |
| `cross-os`          | Перевірки релізу для різних ОС.                                       |
| `live-e2e`          | Валідація E2E repo/live і шляху релізу Docker.                        |
| `package`           | Приймання пакета.                                                     |
| `qa`                | Паритет QA плюс live-напрями QA.                                      |
| `qa-parity`         | Лише напрями паритету QA і звіт.                                      |
| `qa-live`           | Лише live Matrix і Telegram для QA.                                   |
| `npm-telegram`      | E2E Telegram для опублікованого пакета; потребує `npm_telegram_package_spec`. |

Використовуйте `live_suite_filter` з `rerun_group=live-e2e`, коли один live-набір не пройшов.
Дійсні ідентифікатори фільтрів визначені в повторно використовуваному live/E2E workflow, зокрема
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` і
`live-codex-harness-docker`.

Ідентифікатор `live-gateway-advisory-docker` є агрегованим ідентифікатором повторного запуску для своїх
трьох сегментів провайдерів, тому він усе одно розгортається до всіх advisory-завдань Docker gateway.

## Докази, які слід зберегти

Зберігайте зведення `Full Release Validation` як індекс рівня релізу. Воно посилається на
ідентифікатори дочірніх запусків і містить таблиці найповільніших завдань. У разі збоїв спершу перевірте дочірній
workflow, потім повторно запустіть найменший відповідний ідентифікатор вище.

Корисні артефакти:

- `release-package-under-test` з батьківського Full Release Validation і `OpenClaw Release Checks`
- Артефакти шляху релізу Docker у `.artifacts/docker-tests/`
- Package Acceptance `package-under-test` і артефакти приймання Docker
- Артефакти перевірок релізу для різних ОС для кожної ОС і набору
- Артефакти паритету QA, Matrix і Telegram

## Файли workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
