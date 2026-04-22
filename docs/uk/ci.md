---
read_when:
    - Вам потрібно зрозуміти, чому завдання CI запустилося або не запустилося
    - Ви налагоджуєте збої перевірок GitHub Actions
summary: Граф завдань CI, межі області дії та їхні перевірки, а також локальні еквіваленти команд
title: Конвеєр CI
x-i18n:
    generated_at: "2026-04-22T15:00:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc6f7ae078e5d6fc43f4516016861b96197cce10ced72e3b3a0407cc9da1d2fb
    source_path: ci.md
    workflow: 15
---

# Конвеєр CI

CI запускається при кожному push до `main` і для кожного pull request. Він використовує розумне визначення області дії, щоб пропускати дорогі завдання, коли змінилися лише не пов’язані ділянки.

## Огляд завдань

| Завдання                         | Призначення                                                                                     | Коли запускається                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `preflight`                      | Визначає зміни лише в документації, змінені області дії, змінені розширення та збирає CI-маніфест | Завжди для push і PR, які не є draft |
| `security-scm-fast`              | Виявлення приватних ключів і аудит workflow через `zizmor`                                       | Завжди для push і PR, які не є draft |
| `security-dependency-audit`      | Аудит production lockfile без залежностей за advisory з npm                                      | Завжди для push і PR, які не є draft |
| `security-fast`                  | Обов’язковий агрегат для швидких завдань безпеки                                                 | Завжди для push і PR, які не є draft |
| `build-artifacts`                | Один раз збирає `dist/` і Control UI, завантажує повторно використовувані артефакти для наступних завдань | Зміни, пов’язані з Node             |
| `checks-fast-core`               | Швидкі Linux-перевірки коректності, такі як bundled/plugin-contract/protocol checks              | Зміни, пов’язані з Node             |
| `checks-fast-contracts-channels` | Шардовані перевірки контрактів каналів зі стабільним агрегованим результатом                     | Зміни, пов’язані з Node             |
| `checks-node-extensions`         | Повні шардовані тести bundled-plugin для всього набору розширень                                 | Зміни, пов’язані з Node             |
| `checks-node-core-test`          | Шардовані тести core Node, окрім lane для каналів, bundled, контрактів і розширень              | Зміни, пов’язані з Node             |
| `extension-fast`                 | Цільові тести лише для змінених bundled plugins                                                  | Коли виявлено зміни в розширеннях   |
| `check`                          | Шардований еквівалент основної локальної перевірки: production types, lint, guards, test types і strict smoke | Зміни, пов’язані з Node             |
| `check-additional`               | Шарди для архітектури, меж, guards поверхні розширень, package-boundary і gateway-watch          | Зміни, пов’язані з Node             |
| `build-smoke`                    | Smoke-тести зібраного CLI і smoke перевірка пам’яті під час запуску                              | Зміни, пов’язані з Node             |
| `checks`                         | Решта Linux Node lane: тести каналів і сумісність лише для push з Node 22                        | Зміни, пов’язані з Node             |
| `check-docs`                     | Форматування документації, lint і перевірки битих посилань                                       | Коли змінено документацію           |
| `skills-python`                  | Ruff + pytest для Skills на основі Python                                                        | Зміни, релевантні Python Skills     |
| `checks-windows`                 | Специфічні для Windows test lane                                                                  | Зміни, релевантні Windows           |
| `macos-node`                     | Лінія тестів TypeScript на macOS з використанням спільних зібраних артефактів                    | Зміни, релевантні macOS             |
| `macos-swift`                    | Swift lint, build і тести для застосунку macOS                                                   | Зміни, релевантні macOS             |
| `android`                        | Матриця build і test для Android                                                                  | Зміни, релевантні Android           |

## Порядок Fail-Fast

Завдання впорядковані так, щоб дешеві перевірки падали раніше, ніж запустяться дорогі:

1. `preflight` вирішує, які lane взагалі існують. Логіка `docs-scope` і `changed-scope` — це кроки всередині цього завдання, а не окремі завдання.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` і `skills-python` падають швидко, не чекаючи важчих завдань з артефактами та платформеними матрицями.
3. `build-artifacts` виконується паралельно зі швидкими Linux lane, щоб наступні споживачі могли стартувати, щойно спільна збірка буде готова.
4. Після цього розгалужуються важчі платформені та runtime lane: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` і `android`.

Логіка області дії знаходиться в `scripts/ci-changed-scope.mjs` і покрита unit-тестами в `src/scripts/ci-changed-scope.test.ts`.
Окремий workflow `install-smoke` повторно використовує той самий скрипт області дії через власне завдання `preflight`. Він обчислює `run_install_smoke` із вужчого сигналу changed-smoke, тому Docker/install smoke запускається лише для змін, пов’язаних з install, packaging і контейнерами.

Локальна логіка changed-lane знаходиться в `scripts/changed-lanes.mjs` і виконується через `scripts/check-changed.mjs`. Ця локальна перевірка суворіша щодо архітектурних меж, ніж широка CI-область платформ: зміни core production запускають typecheck core prod плюс тести core, зміни лише в тестах core запускають лише typecheck/tests для тестів core, зміни extension production запускають typecheck extension prod плюс тести extension, а зміни лише в тестах extension запускають лише typecheck/tests для тестів extension. Зміни в публічному Plugin SDK або plugin-contract розширюють перевірку до validation розширень, оскільки розширення залежать від цих контрактів core. Зміни лише в release metadata version bump запускають цільові перевірки version/config/root-dependency. Невідомі зміни root/config у fail-safe режимі вмикають усі lane.

Для push матриця `checks` додає lane `compat-node22`, який запускається лише для push. Для pull request цей lane пропускається, а матриця зосереджується на звичайних test/channel lane.

Найповільніші сімейства тестів Node розбиті на include-file shard, щоб кожне завдання залишалося невеликим: контракти каналів розділяють покриття registry і core на вісім зважених shard кожне, тести команд відповіді auto-reply розбиті на чотири shard за include-pattern, а інші великі групи префіксів відповіді auto-reply — на два shard кожна. `check-additional` також відокремлює package-boundary compile/canary роботу від runtime topology gateway/architecture роботи.

GitHub може позначати застарілі завдання як `cancelled`, коли новіший push потрапляє в той самий PR або ref `main`. Вважайте це шумом CI, якщо тільки найновіший запуск для того самого ref також не падає. Агреговані shard-перевірки використовують `!cancelled() && always()`, тому вони все одно повідомляють про звичайні збої shard, але не стають у чергу після того, як увесь workflow уже був витіснений новішим запуском.
Ключ конкурентності CI має версіонування (`CI-v2-*`), тому zombie-процес на боці GitHub у старій групі черги не може безкінечно блокувати новіші запуски `main`.

## Runners

| Runner                           | Завдання                                                                                                                                                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, короткі завдання-агрегатори перевірки (`security-fast`, `check`, `check-additional`, `checks-fast-contracts-channels`), workflow-sanity, labeler, auto-response; preflight для install-smoke також використовує GitHub-hosted Ubuntu, щоб матриця Blacksmith могла стати в чергу раніше |
| `blacksmith-8vcpu-ubuntu-2404`   | `security-scm-fast`, `security-dependency-audit`, `build-artifacts`, Linux-перевірки, окрім `check-lint`, довгі матричні завдання-агрегатори перевірки, перевірки документації, Python Skills, `android`                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, який лишається настільки чутливим до CPU, що 8 vCPU коштували дорожче, ніж давали вигоду                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` у `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` у `openclaw/openclaw`; для fork використовується запасний варіант `macos-latest`                                                                                                                                                                        |

## Локальні еквіваленти

```bash
pnpm changed:lanes   # переглянути локальний класифікатор changed-lane для origin/main...HEAD
pnpm check:changed   # розумна локальна перевірка: changed typecheck/lint/tests за lane меж
pnpm check          # швидка локальна перевірка: production tsgo + шардований lint + паралельні швидкі guards
pnpm check:test-types
pnpm check:timed    # та сама перевірка з таймінгами для кожного етапу
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # тести vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # форматування документації + lint + перевірка битих посилань
pnpm build          # зібрати dist, коли важливі lane CI artifact/build-smoke
```
