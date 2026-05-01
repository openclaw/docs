---
read_when:
    - Запуск або повторний запуск повної валідації релізу
    - Порівняння стабільного та повного профілів валідації релізу
    - Усунення збоїв на етапі перевірки релізу
summary: Етапи повної перевірки випуску, дочірні робочі процеси, профілі випуску, ідентифікатори повторного запуску та підтвердження
title: Повна перевірка випуску
x-i18n:
    generated_at: "2026-05-01T02:43:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` — це загальна перевірка релізу. Це єдина ручна
точка входу для передрелізного підтвердження, але більшість роботи виконується
в дочірніх workflow, щоб невдалу машину можна було перезапустити без повторного
запуску всього релізу.

Запускайте її з довіреного ref workflow, зазвичай `main`, і передавайте гілку
релізу, тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Дочірні workflow використовують довірений ref workflow для harness і вхідний
`ref` для кандидата, що тестується. Це зберігає доступність нової логіки
валідації під час перевірки старішої гілки релізу або тегу.

## Етапи верхнього рівня

| Етап                  | Подробиці                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Визначення цілі       | **Завдання:** `Resolve target ref`<br />**Дочірній workflow:** немає<br />**Підтверджує:** визначає гілку релізу, тег або повний SHA коміту та записує вибрані вхідні параметри.<br />**Перезапуск:** перезапустіть umbrella, якщо це завершиться помилкою.                                                                                                                                          |
| Vitest і звичайний CI | **Завдання:** `Run normal full CI`<br />**Дочірній workflow:** `CI`<br />**Підтверджує:** ручний повний граф CI для цільового ref, включно з Linux Node lanes, shards вбудованих плагінів, контрактами каналів, сумісністю Node 22, `check`, `check-additional`, build smoke, перевірками документації, Python skills, Windows, macOS, i18n Control UI та Android через umbrella.<br />**Перезапуск:** `rerun_group=ci`. |
| Попередній реліз Plugin | **Завдання:** `Run plugin prerelease validation`<br />**Дочірній workflow:** `Plugin Prerelease`<br />**Підтверджує:** релізні статичні перевірки Plugin, agentic покриття плагінів, повні batch shards розширень і Docker lanes передрелізу плагінів.<br />**Перезапуск:** `rerun_group=plugin-prerelease`.                                                                                         |
| Перевірки релізу      | **Завдання:** `Run release/live/Docker/QA validation`<br />**Дочірній workflow:** `OpenClaw Release Checks`<br />**Підтверджує:** install smoke, cross-OS перевірки пакетів, live/E2E набори, Docker chunks релізного шляху, Package Acceptance, parity QA Lab, live Matrix і live Telegram.<br />**Перезапуск:** `rerun_group=release-checks` або вужчий handle release-checks.                      |
| Telegram після публікації | **Завдання:** `Run post-publish Telegram E2E`<br />**Дочірній workflow:** `NPM Telegram Beta E2E`<br />**Підтверджує:** необов’язкове підтвердження Telegram для опублікованого пакета, коли задано `npm_telegram_package_spec`.<br />**Перезапуск:** `rerun_group=npm-telegram`.                                                                                                                  |
| Верифікатор umbrella  | **Завдання:** `Verify full validation`<br />**Дочірній workflow:** немає<br />**Підтверджує:** повторно перевіряє записані висновки дочірніх запусків і додає таблиці найповільніших завдань із дочірніх workflow.<br />**Перезапуск:** перезапустіть лише це завдання після перезапуску невдалого дочірнього workflow до зеленого стану.                                                              |

Для `ref=main` і `rerun_group=all` новіший umbrella замінює старіший. Коли
батьківський workflow скасовано, його monitor скасовує будь-який дочірній
workflow, який він уже відправив. Запуски валідації гілок релізу й тегів за
замовчуванням не скасовують одне одного.

## Етапи перевірок релізу

`OpenClaw Release Checks` — найбільший дочірній workflow. Він один раз визначає
ціль і готує спільний артефакт `release-package-under-test`, коли він потрібен
етапам, що працюють із пакетами або Docker.

| Етап                | Подробиці                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ціль релізу         | **Завдання:** `Resolve target ref`<br />**Базовий workflow:** немає<br />**Тести:** вибраний ref, необов’язковий очікуваний SHA, профіль, група перезапуску та сфокусований фільтр live suite.<br />**Перезапуск:** `rerun_group=release-checks`.                                                                                                                                                    |
| Артефакт пакета     | **Завдання:** `Prepare release package artifact`<br />**Базовий workflow:** немає<br />**Тести:** пакує або визначає один tarball кандидата та завантажує `release-package-under-test` для наступних перевірок, що працюють із пакетами.<br />**Перезапуск:** відповідна група package, cross-OS або live/E2E.                                                                                       |
| Install smoke       | **Завдання:** `Run install smoke`<br />**Базовий workflow:** `Install Smoke`<br />**Тести:** повний шлях встановлення з повторним використанням root Dockerfile smoke image, встановлення QR-пакета, root і gateway Docker smokes, Docker-тести інсталятора, Bun global install image-provider smoke і швидкий bundled-plugin Docker E2E.<br />**Перезапуск:** `rerun_group=install-smoke`.            |
| Cross-OS            | **Завдання:** `cross_os_release_checks`<br />**Базовий workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Тести:** fresh і upgrade lanes у Linux, Windows і macOS для вибраного provider і mode з використанням tarball кандидата та базового пакета.<br />**Перезапуск:** `rerun_group=cross-os`.                                                                                    |
| Repo і live E2E     | **Завдання:** `Run repo/live E2E validation`<br />**Базовий workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тести:** repository E2E, live cache, OpenAI websocket streaming, native live provider і plugin shards, а також Docker-backed live model/backend/gateway harnesses, вибрані через `release_profile`.<br />**Перезапуск:** `rerun_group=live-e2e`, необов’язково з `live_suite_filter`. |
| Docker release path | **Завдання:** `Run Docker release-path validation`<br />**Базовий workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Тести:** Docker chunks релізного шляху зі спільним артефактом пакета.<br />**Перезапуск:** `rerun_group=live-e2e`.                                                                                                                                                     |
| Package Acceptance  | **Завдання:** `Run package acceptance`<br />**Базовий workflow:** `Package Acceptance`<br />**Тести:** artifact-native сумісність залежностей вбудованих каналів, офлайн fixtures пакетів плагінів і mock-OpenAI Telegram package acceptance для того самого tarball.<br />**Перезапуск:** `rerun_group=package`.                                                                                   |
| QA parity           | **Завдання:** `Run QA Lab parity lane` і `Run QA Lab parity report`<br />**Базовий workflow:** прямі завдання<br />**Тести:** agentic parity packs кандидата й baseline, потім parity report.<br />**Перезапуск:** `rerun_group=qa-parity` або `rerun_group=qa`.                                                                                                                                      |
| QA live Matrix      | **Завдання:** `Run QA Lab live Matrix lane`<br />**Базовий workflow:** пряме завдання<br />**Тести:** швидкий live Matrix QA profile у середовищі `qa-live-shared`.<br />**Перезапуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                                  |
| QA live Telegram    | **Завдання:** `Run QA Lab live Telegram lane`<br />**Базовий workflow:** пряме завдання<br />**Тести:** live Telegram QA з credential leases Convex CI.<br />**Перезапуск:** `rerun_group=qa-live` або `rerun_group=qa`.                                                                                                                                                                               |
| Верифікатор релізу  | **Завдання:** `Verify release checks`<br />**Базовий workflow:** немає<br />**Тести:** обов’язкові завдання release-check для вибраної групи перезапуску.<br />**Перезапуск:** перезапустіть після успішного проходження сфокусованих дочірніх завдань.                                                                                                                                             |

## Docker chunks релізного шляху

Етап Docker release-path запускає ці chunks, коли `live_suite_filter`
порожній:

| Chunk                                                                                       | Покриття                                                                |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                                                      | Core Docker smoke lanes релізного шляху.                                |
| `package-update-openai`                                                                     | Поведінка встановлення й оновлення пакета OpenAI.                       |
| `package-update-anthropic`                                                                  | Поведінка встановлення й оновлення пакета Anthropic.                    |
| `package-update-core`                                                                       | Provider-neutral поведінка пакета й оновлення.                          |
| `plugins-runtime-plugins`                                                                   | Runtime lanes плагінів, які перевіряють поведінку плагінів.             |
| `plugins-runtime-services`                                                                  | Runtime lanes плагінів із сервісною підтримкою; включає OpenWebUI за запитом. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h`                             | Batch перевірки встановлення/runtime плагінів, розділені для паралельної релізної валідації. |
| `bundled-channels-core`                                                                     | Docker-поведінка вбудованих каналів.                                    |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | Поведінка оновлення вбудованих каналів.                                 |
| `bundled-channels-contracts`                                                                | Перевірки контрактів вбудованих каналів у Docker release path.          |

Використовуйте цільовий `docker_lanes=<lane[,lane]>` у повторно використовуваному live/E2E workflow, коли
збій стався лише в одній Docker-смузі. Артефакти релізу містять команди
повторного запуску для кожної смуги з вхідними параметрами повторного використання артефакта пакета й образу, коли вони доступні.

## Профілі релізу

`release_profile` керує лише широтою live/provider у межах перевірок релізу. Він
не вилучає звичайний повний CI, Plugin Prerelease, install smoke, package
acceptance, QA Lab або частини Docker release-path.

| Профіль  | Призначення                            | Включене live/provider-покриття                                                                                                                                                         |
| -------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Найшвидший критичний smoke для релізу. | Live-шлях OpenAI/core, Docker live-моделі для OpenAI, ядро native gateway, профіль native OpenAI gateway, native OpenAI plugin і Docker live gateway OpenAI.                            |
| `stable`  | Стандартний профіль схвалення релізу.  | `minimum` плюс Anthropic, Google, MiniMax, backend, native live test harness, Docker live CLI backend, Docker ACP bind, Docker Codex harness і smoke-шард OpenCode Go.                  |
| `full`    | Широкий advisory sweep.                | `stable` плюс advisory-провайдери, plugin live-шарди й media live-шарди.                                                                                                                |

## Доповнення лише для full

Ці набори пропускаються в `stable` і включаються в `full`:

| Область                         | Покриття лише для full                                                       |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Docker live models               | OpenCode Go, OpenRouter, xAI, Z.ai і Fireworks.                               |
| Docker live gateway              | Advisory-шард для DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI і Z.ai.   |
| Native gateway provider profiles | Fireworks, DeepSeek, повні шарди моделей OpenCode Go, OpenRouter, xAI і Z.ai. |
| Native plugin live shards        | Plugins A-K, L-N, O-Z other, Moonshot і xAI.                                  |
| Native media live shards         | Audio, Google music, MiniMax music і video groups A-D.                        |

`stable` включає `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
натомість використовує ширші шарди моделей OpenCode Go.

## Сфокусовані повторні запуски

Використовуйте `rerun_group`, щоб не повторювати непов’язані релізні бокси:

| Дескриптор          | Область                                           |
| ------------------- | ------------------------------------------------- |
| `all`               | Усі етапи Full Release Validation.                |
| `ci`                | Лише дочірній ручний повний CI.                   |
| `plugin-prerelease` | Лише дочірній Plugin Prerelease.                  |
| `release-checks`    | Усі етапи OpenClaw Release Checks.                |
| `install-smoke`     | Install Smoke через release checks.               |
| `cross-os`          | Cross-OS release checks.                          |
| `live-e2e`          | Repo/live E2E і Docker release-path validation.   |
| `package`           | Package Acceptance.                               |
| `qa`                | QA parity плюс QA live-смуги.                     |
| `qa-parity`         | QA parity-смуги й лише звіт.                      |
| `qa-live`           | QA live Matrix і лише Telegram.                   |
| `npm-telegram`      | Лише необов’язковий Telegram E2E після публікації. |

Використовуйте `live_suite_filter` із `rerun_group=live-e2e`, коли збій стався в
одному live-наборі. Чинні ідентифікатори фільтрів визначені в повторно
використовуваному live/E2E workflow, зокрема
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` і
`live-codex-harness-docker`.

## Докази, які потрібно зберегти

Зберігайте зведення `Full Release Validation` як індекс рівня релізу. Воно
посилається на ідентифікатори дочірніх запусків і містить таблиці найповільніших
завдань. У разі збоїв спочатку перевірте дочірній workflow, а потім повторно
запустіть найменший відповідний дескриптор вище.

Корисні артефакти:

- `release-package-under-test` з `OpenClaw Release Checks`
- Артефакти Docker release-path у `.artifacts/docker-tests/`
- Package Acceptance `package-under-test` і Docker acceptance artifacts
- Артефакти Cross-OS release-check для кожної ОС і набору
- Артефакти QA parity, Matrix і Telegram

## Файли workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
