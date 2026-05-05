---
read_when:
    - Запуск або повторний запуск повної валідації релізу
    - Порівняння стабільного та повного профілів перевірки релізу
    - Налагодження збоїв на етапі валідації релізу
summary: Етапи повної перевірки релізу, дочірні робочі процеси, профілі релізу, дескриптори повторного запуску та докази
title: Повна перевірка релізу
x-i18n:
    generated_at: "2026-05-05T01:33:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` — це парасольковий релізний процес. Це єдина ручна
точка входу для передрелізного підтвердження, але більшість роботи виконується в дочірніх workflow, щоб
невдалий бокс можна було перезапустити без перезапуску всього релізу.

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

Дочірні workflow використовують довірений ref workflow для тестового каркаса, а вхідний
`ref` — для кандидата, що тестується. Це зберігає доступність нової логіки валідації
під час перевірки старішої релізної гілки або тега.

За замовчуванням `release_profile=stable` запускає релізно-блокувальні доріжки й пропускає
вичерпний live/Docker soak. Передайте `run_release_soak=true`, щоб включити
soak-доріжки під час стабільного запуску. `release_profile=full` завжди вмикає soak-доріжки, щоб
широкий консультативний профіль ніколи непомітно не втрачав покриття.

Package Acceptance зазвичай збирає tarball кандидата з розв’язаного
`ref`, включно із запусками повного SHA, запущеними через `pnpm ci:full-release`. Після
публікації передайте `package_acceptance_package_spec=openclaw@YYYY.M.D` (або
`openclaw@beta`/`openclaw@latest`), щоб натомість запустити ту саму матрицю пакетів/оновлень проти
відвантаженого npm-пакета.

## Верхньорівневі етапи

| Етап                 | Деталі                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Розв’язання цілі     | **Job:** `Resolve target ref`<br />**Дочірній workflow:** немає<br />**Підтверджує:** розв’язує релізну гілку, тег або повний SHA коміту й записує вибрані вхідні параметри.<br />**Перезапуск:** перезапустіть парасольковий workflow, якщо це не вдасться.                                                                                                                                                                                 |
| Vitest і звичайний CI | **Job:** `Run normal full CI`<br />**Дочірній workflow:** `CI`<br />**Підтверджує:** ручний повний граф CI проти цільового ref, включно з доріжками Linux Node, шардами bundled Plugin, контрактами каналів, сумісністю з Node 22, `check`, `check-additional`, build smoke, перевірками документації, Python Skills, Windows, macOS, Control UI i18n і Android через парасольковий workflow.<br />**Перезапуск:** `rerun_group=ci`. |
| Передреліз Plugin   | **Job:** `Run plugin prerelease validation`<br />**Дочірній workflow:** `Plugin Prerelease`<br />**Підтверджує:** релізні статичні перевірки Plugin, agentic-покриття Plugin, повні пакетні шарди розширень і передрелізні Docker-доріжки Plugin.<br />**Перезапуск:** `rerun_group=plugin-prerelease`.                                                                                                                                       |
| Релізні перевірки    | **Job:** `Run release/live/Docker/QA validation`<br />**Дочірній workflow:** `OpenClaw Release Checks`<br />**Підтверджує:** install smoke, між-OS перевірки пакета, Package Acceptance, паритет QA Lab, live Matrix і live Telegram. З `run_release_soak=true` або `release_profile=full` також запускає вичерпні live/E2E набори й Docker-чанки релізного шляху.<br />**Перезапуск:** `rerun_group=release-checks` або вужчий release-checks handle. |
| Артефакт пакета      | **Job:** `Prepare release package artifact`<br />**Дочірній workflow:** немає<br />**Підтверджує:** створює батьківський tarball `release-package-under-test` достатньо рано для перевірок, орієнтованих на пакети, яким не потрібно чекати на `OpenClaw Release Checks`.<br />**Перезапуск:** перезапустіть парасольковий workflow або надайте `npm_telegram_package_spec` для `rerun_group=npm-telegram`. |
| Package Telegram    | **Job:** `Run package Telegram E2E`<br />**Дочірній workflow:** `NPM Telegram Beta E2E`<br />**Підтверджує:** підтвердження Telegram-пакета на основі батьківського артефакта для `rerun_group=all` з `release_profile=full`, або підтвердження Telegram для опублікованого пакета, коли задано `npm_telegram_package_spec`.<br />**Перезапуск:** `rerun_group=npm-telegram` з `npm_telegram_package_spec`. |
| Верифікатор парасолькового workflow | **Job:** `Verify full validation`<br />**Дочірній workflow:** немає<br />**Підтверджує:** повторно перевіряє записані висновки дочірніх запусків і додає таблиці найповільніших job з дочірніх workflow.<br />**Перезапуск:** після перезапуску невдалого дочірнього workflow до зеленого стану перезапустіть лише цей job.                                                                                                                                 |

Для `ref=main` і `rerun_group=all` новіший парасольковий workflow замінює старіший.
Коли батьківський workflow скасовано, його монітор скасовує будь-який дочірній workflow, який він уже
запустив. Запуски валідації релізних гілок і тегів за замовчуванням не скасовують одне одного.

## Етапи релізних перевірок

`OpenClaw Release Checks` — найбільший дочірній workflow. Він один раз розв’язує ціль
і готує спільний артефакт `release-package-under-test`, коли він потрібен пакетним
або Docker-орієнтованим етапам.

| Етап                | Подробиці                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ціль релізу         | **Завдання:** `Resolve target ref`<br />**Базовий workflow:** немає<br />**Тести:** вибраний ref, необов’язковий очікуваний SHA, профіль, група повторного запуску та фільтр сфокусованого live-набору.<br />**Повторний запуск:** `rerun_group=release-checks`.                                                                                                                                                                                                                                           |
| Артефакт пакета     | **Завдання:** `Prepare release package artifact`<br />**Базовий workflow:** немає<br />**Тести:** пакує або знаходить один кандидатний tarball і завантажує `release-package-under-test` для подальших перевірок, орієнтованих на пакет.<br />**Повторний запуск:** відповідна група пакета, cross-OS або live/E2E.                                                                                                                                                                                        |
| Install smoke       | **Завдання:** `Run install smoke`<br />**Базовий workflow:** `Install Smoke`<br />**Тести:** повний шлях інсталяції з повторним використанням smoke-образу кореневого Dockerfile, інсталяція QR-пакета, Docker smoke для кореня та Gateway, Docker-тести інсталятора, smoke для image-provider через глобальну інсталяцію Bun і швидкий E2E інсталяції/видалення bundled-Plugin.<br />**Повторний запуск:** `rerun_group=install-smoke`.                                                               |
| Cross-OS            | **Завдання:** `cross_os_release_checks`<br />**Базовий workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Тести:** свіжі та upgrade lanes на Linux, Windows і macOS для вибраного провайдера та режиму з використанням кандидатного tarball і базового пакета.<br />**Повторний запуск:** `rerun_group=cross-os`.                                                                                                                                                                           |
| Repo та live E2E    | **Завдання:** `Run repo/live E2E validation`<br />**Базовий workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тести:** repository E2E, live-кеш, OpenAI websocket streaming, native live provider і Plugin shards, а також Docker-backed live model/backend/gateway harnesses, вибрані через `release_profile`.<br />**Запуски:** `run_release_soak=true`, `release_profile=full` або сфокусований `rerun_group=live-e2e`.<br />**Повторний запуск:** `rerun_group=live-e2e`, необов’язково з `live_suite_filter`. |
| Шлях Docker-релізу  | **Завдання:** `Run Docker release-path validation`<br />**Базовий workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тести:** Docker chunks для release-path проти спільного артефакта пакета.<br />**Запуски:** `run_release_soak=true`, `release_profile=full` або сфокусований `rerun_group=live-e2e`.<br />**Повторний запуск:** `rerun_group=live-e2e`.                                                                                                                                    |
| Package Acceptance  | **Завдання:** `Run package acceptance`<br />**Базовий workflow:** `Package Acceptance`<br />**Тести:** офлайн-фікстури пакетів Plugin, оновлення Plugin, package acceptance для mock-OpenAI Telegram і перевірки survivor для published-upgrade проти того самого tarball. Блокувальні release checks використовують стандартний останній опублікований baseline; soak checks розширюються до кожного стабільного npm-релізу від `2026.4.23` включно плюс фікстури повідомлених проблем.<br />**Повторний запуск:** `rerun_group=package`. |
| QA parity           | **Завдання:** `Run QA Lab parity lane` і `Run QA Lab parity report`<br />**Базовий workflow:** прямі завдання<br />**Тести:** кандидатні та базові пакети agentic parity, потім parity report.<br />**Повторний запуск:** `rerun_group=qa-parity` або `rerun_group=qa`.                                                                                                                                                                                                                                      |
| QA live Matrix      | **Завдання:** `Run QA Lab live Matrix lane`<br />**Базовий workflow:** пряме завдання<br />**Тести:** швидкий live Matrix QA-профіль у середовищі `qa-live-shared`.<br />**Повторний запуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                                                                                                                             |
| QA live Telegram    | **Завдання:** `Run QA Lab live Telegram lane`<br />**Базовий workflow:** пряме завдання<br />**Тести:** live Telegram QA з leases облікових даних Convex CI.<br />**Повторний запуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                                                                                                                                 |
| Верифікатор релізу  | **Завдання:** `Verify release checks`<br />**Базовий workflow:** немає<br />**Тести:** обов’язкові release-check завдання для вибраної групи повторного запуску.<br />**Повторний запуск:** повторіть запуск після проходження сфокусованих дочірніх завдань.                                                                                                                                                                                                                                           |

## Docker release-path chunks

Етап Docker release-path запускає ці chunks, коли `live_suite_filter`
порожній:

| Chunk                                                           | Покриття                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `core`                                                          | Core Docker release-path smoke lanes.                                    |
| `package-update-openai`                                         | Поведінка інсталяції та оновлення пакета OpenAI.                         |
| `package-update-anthropic`                                      | Поведінка інсталяції та оновлення пакета Anthropic.                      |
| `package-update-core`                                           | Провайдер-нейтральна поведінка пакета та оновлення.                      |
| `plugins-runtime-plugins`                                       | Plugin runtime lanes, що перевіряють поведінку Plugin.                   |
| `plugins-runtime-services`                                      | Service-backed Plugin runtime lanes; включає OpenWebUI за запитом.       |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Пакети інсталяції/runtime Plugin, розділені для паралельної release validation. |

Використовуйте цільовий `docker_lanes=<lane[,lane]>` у reusable live/E2E workflow, коли
зламалася лише одна Docker lane. Артефакти релізу містять команди повторного
запуску для кожної lane з вхідними даними артефакта пакета та повторного використання образу, коли вони доступні.

## Профілі релізу

`release_profile` здебільшого керує шириною live/provider всередині release checks.
Він не прибирає звичайний full CI, Plugin Prerelease, install smoke, package
acceptance або QA Lab. Для `stable` вичерпні repo/live E2E та Docker
release-path chunks є soak-покриттям і запускаються, коли `run_release_soak=true`.
`full` примусово вмикає soak-покриття, а також змушує umbrella-запуск виконувати package Telegram
E2E проти артефакта батьківського release package, коли `rerun_group=all`, щоб повний
pre-publish кандидат не пропускав цю Telegram package lane непомітно.

| Профіль  | Призначення                         | Включене live/provider-покриття                                                                                                                                              |
| -------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Найшвидший release-critical smoke.  | OpenAI/core live path, Docker live models для OpenAI, native gateway core, native OpenAI gateway profile, native OpenAI Plugin і Docker live gateway OpenAI.                 |
| `stable`  | Стандартний профіль схвалення релізу. | `minimum` плюс Anthropic smoke, Google, MiniMax, backend, native live test harness, Docker live CLI backend, Docker ACP bind, Docker Codex harness і OpenCode Go smoke shard. |
| `full`    | Широкий advisory sweep.             | `stable` плюс advisory providers, Plugin live shards і media live shards.                                                                                                    |

## Додавання лише для full

Ці набори пропускаються у `stable` і включаються у `full`:

| Область                          | Покриття лише у full                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Docker live models               | OpenCode Go, OpenRouter, xAI, Z.ai і Fireworks.                                                                           |
| Docker live gateway              | Advisory providers, розділені на шарди DeepSeek/Fireworks, OpenCode Go/OpenRouter і xAI/Z.ai.                            |
| Native gateway provider profiles | Full Anthropic Opus і шарди Sonnet/Haiku, Fireworks, DeepSeek, full OpenCode Go model shards, OpenRouter, xAI і Z.ai.    |
| Native Plugin live shards        | Plugins A-K, L-N, O-Z other, Moonshot і xAI.                                                                              |
| Native media live shards         | Audio, Google music, MiniMax music і video groups A-D.                                                                    |

`stable` включає `native-live-src-gateway-profiles-anthropic-smoke` і
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` натомість використовує ширші
Anthropic і OpenCode Go model shards. Сфокусовані повторні запуски все ще можуть використовувати
агреговані handles `native-live-src-gateway-profiles-anthropic` або
`native-live-src-gateway-profiles-opencode-go`.

## Сфокусовані повторні запуски

Використовуйте `rerun_group`, щоб не повторювати непов’язані release boxes:

| Дескриптор          | Область                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Усі етапи повної валідації релізу.                                    |
| `ci`                | Лише дочірній ручний повний CI.                                       |
| `plugin-prerelease` | Лише дочірній попередній реліз Plugin.                                |
| `release-checks`    | Усі етапи перевірок релізу OpenClaw.                                  |
| `install-smoke`     | Install Smoke через перевірки релізу.                                 |
| `cross-os`          | Крос-ОС перевірки релізу.                                             |
| `live-e2e`          | Валідація repo/live E2E і Docker release-path.                        |
| `package`           | Приймання пакета.                                                     |
| `qa`                | Паритет QA плюс живі лінії QA.                                        |
| `qa-parity`         | Лише лінії паритету QA та звіт.                                       |
| `qa-live`           | Лише жива матриця QA і Telegram.                                      |
| `npm-telegram`      | E2E Telegram для опублікованого пакета; потребує `npm_telegram_package_spec`. |

Використовуйте `live_suite_filter` з `rerun_group=live-e2e`, коли відмовив один живий набір тестів.
Дійсні ідентифікатори фільтрів визначені в багаторазовому workflow live/E2E, зокрема
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` і
`live-codex-harness-docker`.

Дескриптор `live-gateway-advisory-docker` є агрегованим дескриптором повторного запуску для своїх
трьох шардів провайдерів, тому він усе одно розгортається на всі advisory Docker Gateway jobs.

Використовуйте `cross_os_suite_filter` з `rerun_group=cross-os`, коли відмовила одна крос-ОС лінія.
Фільтр приймає ідентифікатор ОС, ідентифікатор набору тестів або пару ОС/набір тестів, наприклад
`windows/packaged-upgrade`, `windows` або `packaged-fresh`. Крос-ОС
зведення містять таймінги за фазами для ліній оновлення пакетованої версії, а довготривалі
команди друкують рядки Heartbeat, щоб зависле оновлення Windows було видно до
тайм-ауту завдання.

Лінії QA для перевірок релізу мають рекомендаційний характер. Відмова лише QA повідомляється як попередження
і не блокує верифікатор перевірок релізу; перезапустіть `rerun_group=qa`,
`qa-parity` або `qa-live`, коли потрібні свіжі докази QA.

## Докази, які слід зберегти

Зберігайте зведення `Full Release Validation` як індекс рівня релізу. Воно містить посилання
на ідентифікатори дочірніх запусків і таблиці найповільніших завдань. У разі відмов спочатку перевірте дочірній
workflow, а потім перезапустіть найменший відповідний дескриптор вище.

Корисні артефакти:

- `release-package-under-test` з батьківського Full Release Validation і `OpenClaw Release Checks`
- Артефакти Docker release-path у `.artifacts/docker-tests/`
- `package-under-test` з приймання пакета та артефакти приймання Docker
- Артефакти крос-ОС перевірок релізу для кожної ОС і набору тестів
- Артефакти паритету QA, Matrix і Telegram

## Файли workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
