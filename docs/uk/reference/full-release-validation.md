---
read_when:
    - Запуск або повторний запуск повної валідації релізу
    - Порівняння стабільного та повного профілів валідації релізу
    - Налагодження збоїв етапу перевірки релізу
summary: Етапи повної валідації випуску, дочірні робочі процеси, профілі випуску, дескриптори повторного запуску та докази
title: Повна валідація релізу
x-i18n:
    generated_at: "2026-06-27T18:17:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` — це парасолька релізу. Це єдина ручна
точка входу для передрелізного підтвердження, але більшість роботи виконується
в дочірніх робочих процесах, щоб невдалий бокс можна було перезапустити без
перезапуску всіх релізних перевірок.

Запускайте його з довіреного посилання робочого процесу, зазвичай `main`, і
передайте релізну гілку, тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Дочірні робочі процеси використовують довірене посилання робочого процесу для
тестового стенда, а вхідний параметр `ref` — для кандидата, що тестується. Це
зберігає доступність нової логіки перевірки під час валідації старішої релізної
гілки або тега.

`release_profile=stable` і `release_profile=full` завжди запускають вичерпний
живий/Docker soak. Передайте `run_release_soak=true`, щоб додати ті самі soak
лінії з бета-профілем. Стабільна публікація відхиляє маніфест валідації без
цього soak і блокувальних доказів продуктивності продукту.

Приймальне тестування пакета зазвичай збирає tarball кандидата з розв’язаного
`ref`, включно із запусками за повним SHA, відправленими через `pnpm ci:full-release`.
Після публікації бети передайте `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`,
щоб повторно використати відвантажений npm-пакет у релізних перевірках,
приймальному тестуванні пакета, cross-OS, Docker релізного шляху та package
Telegram. Використовуйте `package_acceptance_package_spec` лише тоді, коли
приймальне тестування пакета має навмисно підтвердити інший пакет. Жива пакетна
лінія Plugin Codex дотримується того самого стану: опубліковані значення
`release_package_spec` виводять `codex_plugin_spec=npm:@openclaw/codex@<version>`;
запуски SHA/артефактів пакують `extensions/codex` з вибраного ref; а оператори
можуть напряму встановити `codex_plugin_spec` для джерел Plugin `npm:`,
`npm-pack:` або `git:`. Лінія надає явне схвалення встановлення Codex CLI,
потрібне цьому Plugin, а потім запускає передперевірку Codex CLI і ходи агента
OpenAI в тій самій сесії.

## Верхньорівневі етапи

| Етап                 | Деталі                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Розв’язання цілі     | **Завдання:** `Resolve target ref`<br />**Дочірній робочий процес:** немає<br />**Підтверджує:** розв’язує релізну гілку, тег або повний SHA коміту та записує вибрані вхідні параметри.<br />**Повторний запуск:** перезапустіть парасольку, якщо це не вдасться.                                                                                                                                                                                                      |
| Vitest і звичайний CI | **Завдання:** `Run normal full CI`<br />**Дочірній робочий процес:** `CI`<br />**Підтверджує:** ручний повний граф CI для цільового ref, включно з лініями Linux Node, шардами bundled Plugin, шардами контрактів Plugin і каналів, сумісністю Node 22, `check-*`, `check-additional-*`, smoke-перевірками зібраних артефактів, перевірками документації, Python Skills, Windows, macOS, Control UI i18n та Android через парасольку.<br />**Повторний запуск:** `rerun_group=ci`. |
| Передреліз Plugin   | **Завдання:** `Run plugin prerelease validation`<br />**Дочірній робочий процес:** `Plugin Prerelease`<br />**Підтверджує:** статичні перевірки Plugin лише для релізу, agentic-покриття Plugin, повні пакетні шарди розширень, передрелізні Docker-лінії Plugin і неблокувальний артефакт `plugin-inspector-advisory` для суміснісного triage.<br />**Повторний запуск:** `rerun_group=plugin-prerelease`.                                                      |
| Релізні перевірки    | **Завдання:** `Run release/live/Docker/QA validation`<br />**Дочірній робочий процес:** `OpenClaw Release Checks`<br />**Підтверджує:** install smoke, перевірки пакетів cross-OS, приймальне тестування пакета, parity QA Lab, live Matrix і live Telegram. Stable і full профілі також запускають вичерпні live/E2E набори та chunks Docker релізного шляху; beta може ввімкнути це через `run_release_soak=true`.<br />**Повторний запуск:** `rerun_group=release-checks` або вужчий дескриптор release-checks. |
| Package Telegram    | **Завдання:** `Run package Telegram E2E`<br />**Дочірній робочий процес:** `NPM Telegram Beta E2E`<br />**Підтверджує:** сфокусований E2E Telegram для опублікованого пакета, коли встановлено `release_package_spec` або `npm_telegram_package_spec`. Повна валідація кандидата натомість використовує канонічний Telegram E2E приймального тестування пакета.<br />**Повторний запуск:** `rerun_group=npm-telegram` з `release_package_spec` або `npm_telegram_package_spec`. |
| Верифікатор парасольки | **Завдання:** `Verify full validation`<br />**Дочірній робочий процес:** немає<br />**Підтверджує:** повторно перевіряє записані висновки дочірніх запусків і додає таблиці найповільніших завдань із дочірніх робочих процесів.<br />**Повторний запуск:** перезапустіть лише це завдання після перезапуску невдалого дочірнього процесу до зеленого стану.                                                                                                 |

Для `ref=main` і `rerun_group=all` новіша парасолька замінює старішу.
Коли батьківський процес скасовано, його монітор скасовує будь-який дочірній
робочий процес, який він уже відправив. Запуски валідації релізних гілок і
тегів за замовчуванням не скасовують один одного.

## Етапи релізних перевірок

`OpenClaw Release Checks` — найбільший дочірній робочий процес. Він один раз
розв’язує ціль і готує спільний артефакт `release-package-under-test`, коли він
потрібен пакетним або Docker-орієнтованим етапам.

| Етап                | Деталі                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ціль релізу         | **Завдання:** `Resolve target ref`<br />**Базовий workflow:** немає<br />**Тести:** вибраний ref, необов’язковий очікуваний SHA, профіль, група повторного запуску та фільтр сфокусованого live-набору.<br />**Повторний запуск:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                   |
| Артефакт пакета     | **Завдання:** `Prepare release package artifact`<br />**Базовий workflow:** немає<br />**Тести:** пакує або визначає один кандидатний tarball і завантажує `release-package-under-test` для подальших перевірок, орієнтованих на пакет.<br />**Повторний запуск:** відповідний пакет, cross-OS або група live/E2E.                                                                                                                                                                                                 |
| Install smoke       | **Завдання:** `Run install smoke`<br />**Базовий workflow:** `Install Smoke`<br />**Тести:** повний шлях встановлення з повторним використанням smoke-образу кореневого Dockerfile, встановлення QR-пакета, Docker smokes для root і Gateway, Docker-тести інсталятора, smoke для Bun global install image-provider і швидкий E2E встановлення/видалення bundled-plugin.<br />**Повторний запуск:** `rerun_group=install-smoke`.                                                                                      |
| Cross-OS            | **Завдання:** `cross_os_release_checks`<br />**Базовий workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Тести:** fresh- і upgrade-смуги на Linux, Windows і macOS для вибраного провайдера й режиму, з використанням кандидатного tarball та базового пакета.<br />**Повторний запуск:** `rerun_group=cross-os`.                                                                                                                                                                                   |
| Repo і live E2E     | **Завдання:** `Run repo/live E2E validation`<br />**Базовий workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тести:** E2E репозиторію, live-кеш, OpenAI websocket streaming, native live provider і plugin shards, а також Docker-backed live model/backend/gateway harnesses, вибрані `release_profile`.<br />**Запуски:** `run_release_soak=true`, `release_profile=full` або сфокусований `rerun_group=live-e2e`.<br />**Повторний запуск:** `rerun_group=live-e2e`, необов’язково з `live_suite_filter`. |
| Docker release path | **Завдання:** `Run Docker release-path validation`<br />**Базовий workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тести:** Docker-фрагменти release-path щодо спільного артефакта пакета.<br />**Запуски:** `run_release_soak=true`, `release_profile=full` або сфокусований `rerun_group=live-e2e`.<br />**Повторний запуск:** `rerun_group=live-e2e`.                                                                                                                                                  |
| Package Acceptance  | **Завдання:** `Run package acceptance`<br />**Базовий workflow:** `Package Acceptance`<br />**Тести:** офлайн-фікстури plugin package, оновлення plugin, канонічний E2E пакета mock-OpenAI Telegram і перевірки збереження після published-upgrade щодо того самого tarball. Блокувальні release checks використовують типову останню опубліковану baseline; soak checks розширюються до кожного стабільного npm-релізу на або після `2026.4.23` плюс фікстури reported-issue.<br />**Повторний запуск:** `rerun_group=package`. |
| Паритет QA          | **Завдання:** `Run QA Lab parity lane` і `Run QA Lab parity report`<br />**Базовий workflow:** прямі завдання<br />**Тести:** кандидатні та baseline agentic parity packs, потім parity report.<br />**Повторний запуск:** `rerun_group=qa-parity` або `rerun_group=qa`.                                                                                                                                                                                                                                             |
| QA live Matrix      | **Завдання:** `Run QA Lab live Matrix lane`<br />**Базовий workflow:** пряме завдання<br />**Тести:** швидкий live Matrix QA profile в середовищі `qa-live-shared`.<br />**Повторний запуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                                                                                                                                          |
| QA live Telegram    | **Завдання:** `Run QA Lab live Telegram lane`<br />**Базовий workflow:** пряме завдання<br />**Тести:** live Telegram QA з lease-ами облікових даних Convex CI.<br />**Повторний запуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                                                                                                                                              |
| Верифікатор релізу  | **Завдання:** `Verify release checks`<br />**Базовий workflow:** немає<br />**Тести:** обов’язкові завдання release-check для вибраної групи повторного запуску.<br />**Повторний запуск:** повторіть після успішного проходження сфокусованих дочірніх завдань.                                                                                                                                                                                                                                                   |

## Docker-фрагменти release-path

Етап Docker release-path запускає ці фрагменти, коли `live_suite_filter`
порожній:

| Фрагмент                                                       | Покриття                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                         | Core Docker release-path smoke-смуги.                                                                                       |
| `package-update-openai`                                        | Поведінка встановлення/оновлення пакета OpenAI, встановлення Codex on-demand, live-звернення Codex plugin і виклики інструментів Chat Completions. |
| `package-update-anthropic`                                     | Поведінка встановлення та оновлення пакета Anthropic.                                                                       |
| `package-update-core`                                          | Провайдер-нейтральна поведінка пакета й оновлення.                                                                          |
| `plugins-runtime-plugins`                                      | Plugin runtime-смуги, які перевіряють поведінку plugin.                                                                     |
| `plugins-runtime-services`                                     | Service-backed і live plugin runtime-смуги; містить OpenWebUI за запитом.                                                   |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Пакети встановлення/runtime plugin, розділені для паралельної валідації релізу.                                             |

Використовуйте цільовий `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow, коли
збій стався лише в одній Docker-смузі. Артефакти релізу містять команди повторного запуску для кожної смуги
з артефактом пакета та вхідними даними повторного використання образу, коли вони доступні.

## Профілі релізу

`release_profile` переважно керує шириною live/provider у release checks.
Він не вилучає звичайний full CI, Plugin Prerelease, install smoke, package
acceptance або QA Lab. Профілі stable і full завжди запускають вичерпне покриття repo/live
E2E та Docker release-path soak. Профіль beta може долучитися через
`run_release_soak=true`. Package Acceptance надає канонічний package
Telegram E2E для кожного full-кандидата, тому umbrella не дублює цей
live poller.

| Профіль  | Призначення                         | Включене live/provider-покриття                                                                                                                                                      |
| -------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `minimum` | Найшвидший release-critical smoke. | OpenAI/core live path, Docker live models для OpenAI, native gateway core, native OpenAI gateway profile, native OpenAI plugin і Docker live gateway OpenAI.                        |
| `stable` | Типовий профіль схвалення релізу.  | `minimum` плюс Anthropic smoke, Google, MiniMax, backend, native live test harness, Docker live CLI backend, Docker ACP bind, Docker Codex harness і OpenCode Go smoke shard.        |
| `full`   | Широкий advisory sweep.             | `stable` плюс advisory providers, plugin live shards і media live shards.                                                                                                           |

## Додатки лише для full

Ці набори пропускаються в `stable` і включаються в `full`:

| Область                          | Покриття лише для full                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker live models               | OpenCode Go, OpenRouter, xAI, Z.ai і Fireworks.                                                                             |
| Docker live gateway              | Advisory providers, розділені на shards DeepSeek/Fireworks, OpenCode Go/OpenRouter і xAI/Z.ai.                              |
| Native gateway provider profiles | Full Anthropic Opus і Sonnet/Haiku shards, Fireworks, DeepSeek, full OpenCode Go model shards, OpenRouter, xAI і Z.ai.      |
| Native plugin live shards        | Plugins A-K, L-N, O-Z other, Moonshot і xAI.                                                                                |
| Native media live shards         | Audio, Google music, MiniMax music і video groups A-D.                                                                      |

`stable` містить `native-live-src-gateway-profiles-anthropic-smoke` і
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` натомість використовує ширші
Anthropic і OpenCode Go model shards. Сфокусовані повторні запуски все ще можуть використовувати
агреговані handles `native-live-src-gateway-profiles-anthropic` або
`native-live-src-gateway-profiles-opencode-go`.

## Сфокусовані повторні запуски

Використовуйте `rerun_group`, щоб не повторювати непов’язані бокси випуску:

| Обробник            | Область                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Усі етапи повної валідації випуску.                                                             |
| `ci`                | Лише дочірній процес ручного повного CI.                                                        |
| `plugin-prerelease` | Лише дочірній процес попереднього випуску Plugin.                                               |
| `release-checks`    | Усі етапи перевірок випуску OpenClaw.                                                           |
| `install-smoke`     | Install Smoke через перевірки випуску.                                                          |
| `cross-os`          | Крос-ОС перевірки випуску.                                                                      |
| `live-e2e`          | Валідація repo/live E2E та Docker-шляху випуску.                                                |
| `package`           | Приймання пакета.                                                                               |
| `qa`                | Паритет QA плюс live-доріжки QA.                                                                |
| `qa-parity`         | Лише доріжки паритету QA та звіт.                                                               |
| `qa-live`           | Live Matrix/Telegram для QA плюс gated-доріжки Discord, WhatsApp і Slack, коли ввімкнено.      |
| `npm-telegram`      | E2E Telegram для опублікованого пакета; потребує `release_package_spec` або `npm_telegram_package_spec`. |

Використовуйте `live_suite_filter` з `rerun_group=live-e2e`, коли впав один live-набір.
Дійсні ідентифікатори фільтрів визначені в перевикористовуваному workflow live/E2E, зокрема
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` і
`live-codex-harness-docker`.

Обробник `live-gateway-advisory-docker` є агрегованим обробником повторного запуску для його
трьох шардів провайдерів, тож він усе одно розгалужується на всі advisory Docker Gateway jobs.

Використовуйте `cross_os_suite_filter` з `rerun_group=cross-os`, коли впала одна крос-ОС доріжка.
Фільтр приймає ідентифікатор ОС, ідентифікатор набору або пару ОС/набір, наприклад
`windows/packaged-upgrade`, `windows` або `packaged-fresh`. Крос-ОС
підсумки містять часові показники для кожної фази packaged upgrade-доріжок, а довготривалі
команди друкують рядки heartbeat, щоб зависле оновлення Windows було видно до
тайм-ауту job.

Збої QA у перевірках випуску блокують звичайну валідацію випуску. Обов’язковий дрейф
динамічних інструментів OpenClaw у стандартному рівні також блокує верифікатор перевірок випуску.
Запуски Tideclaw alpha все ще можуть трактувати доріжки перевірок випуску, не пов’язані з
безпекою пакета, як advisory. Коли `live_suite_filter` явно запитує gated live-доріжку QA,
таку як Discord, WhatsApp або Slack, відповідну repo variable
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` має бути ввімкнено; інакше
захоплення вводу завершується помилкою замість тихого пропуску доріжки. Повторно запустіть `rerun_group=qa`,
`qa-parity` або `qa-live`, коли потрібні свіжі докази QA.

## Докази, які слід зберігати

Зберігайте підсумок `Full Release Validation` як індекс рівня випуску. Він містить посилання
на ідентифікатори дочірніх запусків і таблиці найповільніших job. У разі збоїв спочатку
перевірте дочірній workflow, а потім повторно запустіть найменший відповідний обробник вище.

Корисні артефакти:

- `release-package-under-test` з перевірок випуску OpenClaw
- Артефакти Docker-шляху випуску в `.artifacts/docker-tests/`
- `package-under-test` із приймання пакета та артефакти приймання Docker
- Артефакти крос-ОС перевірок випуску для кожної ОС і набору
- Артефакти паритету QA, Matrix і Telegram

## Файли workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
