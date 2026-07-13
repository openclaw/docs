---
read_when:
    - Запуск тестов локально или в CI
    - Добавление регрессионных тестов для ошибок моделей и провайдеров
    - Отладка поведения Gateway и агента
summary: 'Набор инструментов для тестирования: модульные, сквозные и проводимые в реальной среде наборы тестов, Docker-раннеры и область проверки каждого теста'
title: Тестирование
x-i18n:
    generated_at: "2026-07-13T19:51:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw включает три набора тестов Vitest (модульные/интеграционные, e2e, live), а также
средства запуска Docker. На этой странице описано, что проверяет каждый набор, какую команду выполнять для
конкретного рабочего процесса, как live-тесты обнаруживают учётные данные и как добавлять
регрессионные тесты для реальных ошибок провайдеров и моделей.

<Note>
**Стек QA (qa-lab, qa-channel, live-контуры транспортов)** описан отдельно:

- [Обзор QA](/ru/concepts/qa-e2e-automation) — архитектура, набор команд и создание сценариев.
- [Матрица QA](/ru/concepts/qa-matrix) — справочник по `pnpm openclaw qa matrix`.
- [Оценочная таблица зрелости](/ru/maturity/scorecard) — как свидетельства QA релиза помогают принимать решения о стабильности и LTS.
- [Канал QA](/ru/channels/qa-channel) — синтетический транспортный плагин, используемый сценариями из репозитория.

На этой странице рассматриваются обычные наборы тестов и средства запуска Docker/Parallels. В разделе [Средства запуска для QA](#qa-specific-runners) ниже перечислены конкретные вызовы `qa` и приведены ссылки на указанные выше справочные материалы.
</Note>

## Быстрый старт

В большинстве случаев:

- Полная проверка (ожидается перед отправкой изменений): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Более быстрый локальный запуск полного набора на мощной машине: `pnpm test:max`
- Прямой цикл наблюдения Vitest: `pnpm test:watch`
- Прямое указание файлов также направляет пути плагинов/каналов: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- При работе над одной ошибкой сначала предпочитайте целевые запуски.
- QA-сайт на базе Docker: `pnpm qa:lab:up`
- QA-контур на базе виртуальной машины Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

При изменении тестов или для дополнительной уверенности:

- Информационный отчёт о покрытии V8: `pnpm test:coverage`
- Набор E2E: `pnpm test:e2e`

## Временные каталоги тестов

Используйте общие вспомогательные средства из `test/helpers/temp-dir.ts` для временных
каталогов, принадлежащих тестам, чтобы принадлежность была явной, а очистка оставалась частью жизненного цикла теста:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("использует временное рабочее пространство", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // использовать workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` намеренно не предоставляет ручного
метода очистки — Vitest выполняет очистку после каждого теста. Старые низкоуровневые
вспомогательные средства (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) по-прежнему существуют
для ещё не перенесённых тестов; избегайте их использования в новом коде, а также новых прямых
вызовов `fs.mkdtemp*`, если только тест явно не проверяет необработанное поведение
временных каталогов. Если прямое создание временного каталога действительно необходимо, добавьте проверяемый
разрешающий комментарий с указанием причины:

```ts
// openclaw-temp-dir: allow проверяет необработанное поведение очистки файловой системы
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` сообщает о новых прямых операциях создания временных каталогов
и новом ручном использовании общего вспомогательного средства в добавленных строках различий, не
блокируя существующие способы очистки. Он использует ту же классификацию путей тестов,
что и `scripts/changed-lanes.mjs`, и пропускает саму реализацию общего вспомогательного
средства. `check:changed` запускает этот отчёт для изменённых путей тестов как
неблокирующий сигнал CI (предупреждающие аннотации GitHub, а не ошибки).

## Рабочие процессы live и Docker/Parallels

При отладке реальных провайдеров/моделей (требуются реальные учётные данные):

- Набор live-тестов (модели и проверки инструментов/изображений Gateway): `pnpm test:live`
- Тихий целевой запуск одного файла live-тестов: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Отчёты о производительности среды выполнения: запустите `OpenClaw Performance` с
  `live_openai_candidate=true` для реального хода агента `openai/gpt-5.6-luna` или
  `deep_profile=true` для артефактов CPU/кучи/трассировки Kova. Ежедневные запланированные запуски
  публикуют отчёты контуров фиктивного провайдера, глубокого профилирования и GPT-5.6 Luna в
  `openclaw/clawgrit-reports` из отдельного задания публикации, использующего артефакты;
  отсутствие или недействительность аутентификации издателя приводит к сбою запланированных запусков и
  запусков `profile=release`. При ручных запусках не для релиза артефакты GitHub
  сохраняются, а публикация отчётов считается рекомендательной. Отчёт фиктивного провайдера также
  включает показатели запуска Gateway на уровне исходного кода, памяти, нагрузки плагинов, повторяющегося
  цикла приветствия фиктивной модели и запуска CLI.
- Перебор live-моделей в Docker: `pnpm test:docker:live-models`
  - Для каждой выбранной модели выполняется текстовый ход и небольшая проверка в стиле чтения файла.
    Модели, в метаданных которых заявлен ввод `image`, также выполняют небольшой ход с изображением.
    Отключите дополнительные проверки с помощью `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` или
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` при локализации сбоев провайдера.
  - Покрытие CI: ежедневный `OpenClaw Scheduled Live And E2E Checks` и запускаемый вручную
    `OpenClaw Release Checks` вызывают повторно используемый рабочий процесс live/E2E с
    `include_live_suites: true`, который включает задания матрицы live-моделей Docker,
    разделённые по провайдерам.
  - Для целевых повторных запусков CI запустите `OpenClaw Live And E2E Checks (Reusable)`
    с `include_live_suites: true` и `live_models_only: true`.
  - Добавляйте новые высокоинформативные секреты провайдеров в `scripts/ci-hydrate-live-auth.sh`,
    а также в `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` и вызывающие его
    запланированные и релизные процессы.
- Нативная быстрая проверка привязанного чата Codex: `pnpm test:docker:live-codex-bind`
  - Запускает live-контур Docker через путь сервера приложения Codex, привязывает
    синтетическое личное сообщение Slack с помощью `/codex bind`, выполняет `/codex fast` и
    `/codex permissions`, затем проверяет, что простой ответ и вложение с изображением
    проходят через нативную привязку плагина, а не через ACP.
- Быстрая проверка тестового стенда сервера приложения Codex: `pnpm test:docker:live-codex-harness`
  - Выполняет ходы агента Gateway через принадлежащий плагину тестовый стенд сервера
    приложения Codex, проверяет `/codex status` и `/codex models` и по умолчанию
    выполняет проверки изображений, MCP для cron, подагента и Guardian. Отключите
    проверку подагента с помощью `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` при
    локализации других сбоев. Для целевой проверки подагента отключите
    остальные проверки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    После проверки подагента процесс завершится, если
    не задано `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Быстрая проверка установки Codex по требованию: `pnpm test:docker:codex-on-demand`
  - Устанавливает упакованный tar-архив OpenClaw в Docker, выполняет
    первоначальную настройку ключа API OpenAI и проверяет, что плагин Codex и зависимость `@openai/codex`
    были по требованию загружены в корень управляемого проекта npm.
- Live-проверка зависимости инструмента плагина: `pnpm test:docker:live-plugin-tool`
  - Упаковывает тестовый плагин с реальной зависимостью `slugify`, устанавливает его
    через `npm-pack:`, проверяет зависимость в корне управляемого проекта npm,
    затем просит live-модель OpenAI вызвать инструмент плагина и
    вернуть скрытый идентификатор.
- Быстрая проверка команды восстановления Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Необязательная усиленная проверка
    поверхности команды восстановления канала сообщений. Выполняет `/crestodian status`, ставит в очередь постоянное
    изменение модели, отвечает `/crestodian yes` и проверяет путь записи
    аудита/конфигурации.
- Первая быстрая проверка Crestodian в Docker: `pnpm test:docker:crestodian-first-run`
  - Начинает с пустого каталога состояния OpenClaw и сначала доказывает, что упакованный
    CLI `openclaw crestodian` завершается безопасным отказом без логического вывода. Затем
    тестирует и активирует фиктивный Claude через упакованный модуль активации.
    Только после этого неточный запрос упакованного CLI достигает планировщика и
    преобразуется в типизированную настройку, за которой следуют однократные операции с моделью, агентом, плагином
    Discord и SecretRef. Проверяются конфигурация и записи аудита. Это
    вспомогательные свидетельства для шлюза/операций, а не подтверждение интерактивной первоначальной настройки или
    агента/инструмента/одобрения Crestodian. Тот же контур доступен в лаборатории QA через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Быстрая проверка стоимости Moonshot/Kimi: задав `MOONSHOT_API_KEY`, выполните
  `openclaw models list --provider moonshot --json`, затем выполните изолированный
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Убедитесь, что JSON сообщает Moonshot/K2.6, а
  стенограмма ассистента хранит нормализованное значение `usage.cost`.

<Tip>
Если требуется проверить только один сбойный случай, предпочтительно сужайте набор live-тестов с помощью переменных окружения со списками разрешённых значений, описанных ниже.
</Tip>

## Средства запуска для QA

Эти команды дополняют основные наборы тестов, когда требуется реалистичность лаборатории QA.

CI запускает лабораторию QA в отдельных рабочих процессах. Паритет агентного поведения вложен в
`QA-Lab - All Lanes` и проверку релиза, а не выделен в отдельный рабочий процесс PR.
Для широкой проверки следует использовать `Full Release Validation` с
`rerun_group=qa-parity` или группу QA проверок релиза. Стабильные проверки и проверки релиза по умолчанию
оставляют исчерпывающий live/Docker-прогон под управлением `run_release_soak=true`; профиль
`full` принудительно включает длительный прогон. `QA-Lab - All Lanes` выполняется каждую ночь в `main` и
при ручном запуске с контуром паритета фиктивного провайдера, live-контуром Matrix,
управляемым Convex live-контуром Telegram и управляемым Convex live-контуром Discord в качестве
параллельных заданий. Запланированные проверки QA и проверки релиза явно передают Matrix `--profile fast`,
а значение по умолчанию для CLI Matrix и входных данных ручного рабочего процесса остаётся
`all`; при ручном запуске `all` можно разделить на задания `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` и `e2ee-cli`. `OpenClaw Release Checks` выполняет
проверку паритета, а также быстрые контуры Matrix и Telegram перед одобрением релиза, используя
`mock-openai/gpt-5.6-luna` для релизных проверок транспортов, чтобы они оставались детерминированными
и не запускали обычные плагины провайдеров. Эти live-шлюзы транспортов
отключают поиск в памяти; поведение памяти по-прежнему проверяется наборами паритета QA.

Полные релизные сегменты live-проверок мультимедиа используют
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, где уже заданы
`ffmpeg` и `ffprobe`. Сегменты live-моделей/серверных частей Docker используют общий
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, однократно собранный для выбранного
коммита, а затем загружают его с помощью `OPENCLAW_SKIP_DOCKER_BUILD=1` вместо повторной сборки
в каждом сегменте.

- `pnpm openclaw qa suite`
  - Запускает сценарии QA из репозитория непосредственно на хосте.
  - Записывает верхнеуровневые артефакты `qa-evidence.json`, `qa-suite-summary.json` и
    `qa-suite-report.md` для выбранного набора сценариев, включая
    смешанные потоки и выбранные сценарии Vitest и Playwright.
  - При запуске через `pnpm openclaw qa run --qa-profile <profile>` встраивает
    оценочную таблицу выбранного профиля таксономии в тот же `qa-evidence.json`.
    `smoke-ci` записывает сокращённые свидетельства (`evidenceMode: "slim"`, без
    `execution` для каждой записи). `release` охватывает отобранный срез готовности к выпуску; `all`
    выбирает все активные категории зрелости и предназначен для явных запусков
    рабочего процесса QA Profile Evidence, когда требуется полный артефакт оценочной таблицы.
  - По умолчанию запускает несколько выбранных сценариев параллельно с изолированными
    рабочими процессами Gateway. Для `qa-channel` по умолчанию задан параллелизм 4 (ограниченный
    числом выбранных сценариев). Используйте `--concurrency <count>`, чтобы настроить число
    рабочих процессов, или `--concurrency 1` для прежнего последовательного режима.
  - Завершается с ненулевым кодом, если любой сценарий завершается сбоем. Используйте `--allow-failures` для
    получения артефактов без ненулевого кода завершения.
  - Поддерживает режимы провайдера `live-frontier`, `mock-openai` и `aimock`.
    `aimock` запускает локальный сервер провайдера на основе AIMock для экспериментального
    покрытия фикстур и имитации протокола, не заменяя учитывающий сценарии
    режим `mock-openai`.
- `pnpm openclaw qa coverage --match <query>`
  - Выполняет поиск по идентификаторам сценариев, заголовкам, поверхностям, идентификаторам покрытия, ссылкам на документацию и код,
    плагинам и требованиям провайдеров, а затем выводит соответствующие цели
    наборов тестов.
  - Используйте это перед запуском QA Lab, когда известно затронутое поведение или путь к файлу,
    но неизвестен минимальный сценарий. Это лишь рекомендация — по-прежнему выбирайте имитационное,
    реальное, Multipass-, Matrix- или транспортное подтверждение в зависимости от изменяемого
    поведения.
- `pnpm test:plugins:kitchen-sink-live`
  - Запускает через QA Lab комплекс реальных испытаний плагина OpenAI Kitchen Sink.
    Устанавливает внешний пакет Kitchen Sink, проверяет инвентарь поверхностей SDK
    плагинов, тестирует `/healthz` и `/readyz`, записывает данные
    CPU/RSS Gateway, выполняет реальный запрос к OpenAI и проверяет диагностику
    при некорректных входных данных. Требуется действующая авторизация OpenAI, например `OPENAI_API_KEY`. В
    подготовленных сеансах Testbox автоматически подключает профиль реальной авторизации
    Testbox, если присутствует вспомогательный скрипт `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускает тест производительности старта Gateway и небольшой набор имитационных сценариев QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`), а затем записывает сводку совмещённых
    наблюдений за CPU в `.artifacts/gateway-cpu-scenarios/`.
  - По умолчанию отмечает только продолжительные наблюдения высокой загрузки CPU (`--cpu-core-warn`,
    значение по умолчанию `0.9`; `--hot-wall-warn-ms`, значение по умолчанию `30000`), поэтому краткие всплески
    при запуске записываются как метрики и не выглядят как регрессия
    Gateway с многоминутной полной загрузкой.
  - Работает с собранными артефактами `dist`; сначала выполните сборку, если в рабочей копии
    ещё нет свежих результатов среды выполнения.
- `pnpm openclaw qa suite --runner multipass`
  - Запускает тот же набор QA внутри одноразовой виртуальной машины Multipass с Linux,
    сохраняя те же флаги выбора сценариев, провайдера и модели, что и `qa suite`.
  - При реальных запусках гостевой системе передаются применимые входные данные авторизации QA:
    ключи провайдеров из переменных среды, путь к конфигурации реального провайдера QA и
    `CODEX_HOME`, если он присутствует.
  - Каталоги вывода должны оставаться в корне репозитория, чтобы гостевая система могла записывать данные обратно
    через подключённое рабочее пространство.
  - Записывает стандартный отчёт и сводку QA, а также журналы Multipass в
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускает сайт QA на основе Docker для выполнения QA в операторском режиме.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Создаёт npm-архив из текущей рабочей копии, глобально устанавливает его в
    Docker, выполняет неинтерактивную первоначальную настройку с API-ключом OpenAI, по умолчанию настраивает
    Telegram, проверяет загрузку среды выполнения упакованных плагинов без
    исправления зависимостей при запуске, запускает doctor и выполняет один локальный запрос агента
    к имитируемой конечной точке OpenAI.
  - Используйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, чтобы запустить тот же режим
    установки пакета с Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускает детерминированную дымовую проверку собранного приложения в Docker для расшифровок
    встроенного контекста среды выполнения. Проверяет, что скрытый контекст среды выполнения OpenClaw сохраняется как
    неотображаемое пользовательское сообщение и не попадает в видимый запрос
    пользователя, затем создаёт повреждённый файл JSONL затронутого сеанса и проверяет, что
    `openclaw doctor --fix` перезаписывает его в активную ветвь с созданием резервной копии.
- `pnpm test:docker:npm-telegram-live`
  - Устанавливает кандидатный пакет OpenClaw в Docker, выполняет первоначальную настройку
    установленного пакета, настраивает Telegram через установленный CLI, а затем повторно использует
    режим реального QA Telegram с этим установленным пакетом в качестве тестируемого
    Gateway.
  - Обёртка подключает из рабочей копии только исходный код тестовой оснастки `qa-lab`;
    установленный пакет управляет `dist`, `openclaw/plugin-sdk` и средой выполнения
    встроенных плагинов, поэтому этот режим не подмешивает плагины из текущей рабочей копии
    в тестируемый пакет.
  - По умолчанию используется `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; задайте
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` или
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, чтобы протестировать разрешённый локальный архив
    вместо установки из реестра.
  - По умолчанию записывает повторные измерения RTT в `qa-evidence.json` с
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Переопределите
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` или
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, чтобы настроить запуск.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` принимает разделённый запятыми список
    идентификаторов проверок QA Telegram для выборочного выполнения; если значение не задано, по умолчанию используется
    поддерживающая RTT проверка `telegram-mentioned-message-reply`.
  - Использует те же учётные данные Telegram из переменных среды или источник учётных данных Convex, что и
    `pnpm openclaw qa telegram`. Для автоматизации CI/выпуска задайте
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` вместе с
    `OPENCLAW_QA_CONVEX_SITE_URL` и секретом роли. Если
    `OPENCLAW_QA_CONVEX_SITE_URL` и секрет роли Convex присутствуют в
    CI, обёртка Docker автоматически выбирает Convex.
  - Перед сборкой Docker и установкой обёртка проверяет на хосте переменные среды
    с учётными данными Telegram или Convex. Задавайте
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` только при
    целенаправленной отладке настройки до предоставления учётных данных.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` переопределяет
    общий `OPENCLAW_QA_CREDENTIAL_ROLE` только для этого режима. Если выбраны учётные данные
    Convex, но роль не задана, обёртка использует `ci` в CI
    и `maintainer` вне CI.
  - GitHub Actions предоставляет этот режим как запускаемый вручную сопровождающими рабочий процесс
    `NPM Telegram Beta E2E`. Он не запускается при слиянии. Рабочий процесс использует
    среду `qa-live-shared` и аренду учётных данных Convex для CI.
- GitHub Actions также предоставляет `Package Acceptance` для параллельного подтверждения продукта
  на одном кандидатном пакете. Он принимает ссылку Git, опубликованную спецификацию npm,
  HTTPS-URL архива с SHA-256, политику доверенных URL или артефакт архива
  из другого запуска (`source=ref|npm|url|trusted-url|artifact`), загружает
  нормализованный `openclaw-current.tgz` как `package-under-test`, а затем запускает
  существующий планировщик Docker E2E с профилями режимов `smoke`, `package`, `product`, `full`
  или `custom`. Задайте `telegram_mode=mock-openai` или
  `live-frontier`, чтобы запустить рабочий процесс QA Telegram с тем же
  артефактом `package-under-test`.
  - Подтверждение продукта для последней бета-версии:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Для подтверждения по точному URL архива требуется дайджест и применяется политика безопасности публичных URL:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Для корпоративных или частных зеркал архивов применяется явная политика доверенного источника:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` считывает `.github/package-trusted-sources.json` из доверенной ссылки рабочего процесса и не принимает учётные данные в URL или передаваемый через входные данные рабочего процесса обход ограничений частной сети. Если именованная политика предусматривает авторизацию по токену Bearer, настройте фиксированный секрет `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- При подтверждении по артефакту архив загружается из другого запуска Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Упаковывает и устанавливает текущую сборку OpenClaw в Docker, запускает
    Gateway с настроенным OpenAI, а затем включает встроенные каналы и плагины посредством
    изменения конфигурации.
  - Проверяет, что обнаружение при настройке не добавляет ненастроенные загружаемые плагины,
    первое исправление через doctor для настроенной конфигурации явно устанавливает каждый отсутствующий
    загружаемый плагин, а второй перезапуск не выполняет
    скрытое исправление зависимостей.
  - Также устанавливает заведомо более старую базовую версию npm, включает Telegram перед
    запуском `openclaw update --tag <candidate>` и проверяет, что
    doctor кандидата после обновления удаляет устаревшие остатки зависимостей плагинов
    без исправления postinstall со стороны тестовой оснастки.
- `pnpm test:parallels:npm-update`
  - Запускает нативную дымовую проверку обновления установленного пакета в гостевых системах Parallels.
    На каждой выбранной платформе сначала устанавливается запрошенный базовый пакет,
    затем в той же гостевой системе запускается установленная команда `openclaw update` и
    проверяются установленная версия, состояние обновления, готовность Gateway и
    один локальный запрос агента.
  - При работе с одной гостевой системой используйте `--platform macos`, `--platform windows` или `--platform linux`.
    Используйте `--json` для пути к сводному артефакту
    и состояния каждого режима.
  - По умолчанию режим OpenAI использует `openai/gpt-5.6-luna` для подтверждения реальным запросом агента.
    Передайте `--model <provider/model>` или задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, чтобы проверить другую модель OpenAI.
  - Ограничивайте длительные локальные запуски тайм-аутом хоста, чтобы зависания транспорта Parallels
    не заняли всё оставшееся окно тестирования:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записывает вложенные журналы режимов в
    `/tmp/openclaw-parallels-npm-update.*`. Проверьте `windows-update.log`,
    `macos-update.log` или `linux-update.log`, прежде чем считать внешнюю
    обёртку зависшей.
  - На холодной гостевой системе Windows обновление может занимать от 10 до 15 минут на выполнение doctor
    после обновления и обновление пакета; это остаётся нормальным, пока
    вложенный журнал отладки npm продолжает обновляться.
  - Не запускайте эту агрегирующую обёртку параллельно с отдельными режимами дымовой проверки Parallels
    для macOS, Windows или Linux. Они совместно используют состояние виртуальных машин и могут
    конфликтовать при восстановлении снимков, раздаче пакетов или работе Gateway в гостевой системе.
  - После обновления подтверждение охватывает стандартную поверхность встроенных плагинов, поскольку
    фасады возможностей, такие как распознавание речи, генерация изображений и анализ
    мультимедиа, загружаются через встроенные API среды выполнения, даже если сам запрос
    агента проверяет только простой текстовый ответ.

- `pnpm openclaw qa aimock`
  - Запускает только локальный сервер провайдера AIMock для непосредственного дымового
    тестирования протокола.
- `pnpm openclaw qa matrix`
  - Запускает канал живого QA Matrix с одноразовым домашним сервером Tuwunel
    на базе Docker. Доступно только из исходного кода — в пакетные установки
    `qa-lab` не входит.
  - Полное описание CLI, каталога профилей и сценариев, переменных окружения и структуры артефактов:
    [QA Matrix](/ru/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускает канал живого QA Telegram в реальной приватной группе, используя
    токены бота-драйвера и тестируемой системы из переменных окружения.
  - Требуются `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` и
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Идентификатор группы должен быть числовым
    идентификатором чата Telegram.
  - Поддерживает `--credential-source convex` для общих учетных данных из пула.
    По умолчанию используйте режим переменных окружения либо задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`,
    чтобы включить аренду из пула.
  - Набор по умолчанию охватывает канареечную проверку, фильтрацию по упоминаниям, адресацию команд, `/status`,
    ответы между ботами с упоминанием и ответы основных нативных команд.
    Набор `mock-openai` по умолчанию также охватывает регрессии детерминированных цепочек ответов и
    потоковой передачи итоговых сообщений Telegram. Используйте `--list-scenarios`
    для необязательных проверок, таких как `session_status`.
  - Завершается с ненулевым кодом при сбое любого сценария. Используйте `--allow-failures`,
    чтобы создавать артефакты без ненулевого кода завершения.
  - Требуются два разных бота в одной приватной группе, причем тестируемый бот
    должен иметь имя пользователя Telegram.
  - Для стабильного наблюдения за взаимодействием между ботами включите Bot-to-Bot Communication Mode
    в `@BotFather` для обоих ботов и убедитесь, что бот-драйвер может видеть
    трафик ботов в группе.
  - Записывает отчет QA Telegram, сводку и `qa-evidence.json` в
    `.artifacts/qa-e2e/...`. Сценарии с ответами включают RTT от запроса
    на отправку драйвером до наблюдаемого ответа тестируемой системы.

`Mantis Telegram Live` — оболочка этого канала для сбора доказательств в PR. Она запускает
кандидатную ссылку с учетными данными Telegram, арендованными через Convex, отображает
редактированный отчет QA и пакет доказательств в браузере рабочего стола Crabbox, записывает
доказательство в формате MP4, создает GIF с удаленными неподвижными фрагментами, загружает пакет артефактов и
публикует встроенные доказательства в PR через приложение Mantis для GitHub, когда задано `pr_number`.
Сопровождающие могут запустить ее в интерфейсе Actions через `Mantis Scenario`
(`scenario_id: telegram-live`) или непосредственно из комментария к запросу на включение изменений:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` — агентная нативная оболочка Telegram Desktop
для визуального доказательства в PR до и после изменения. Запустите ее в интерфейсе Actions с
произвольным `instructions`, через `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) или из комментария к PR:

```text
@openclaw-mantis telegram desktop proof
```

Агент Mantis читает PR, определяет, какое видимое в Telegram поведение доказывает
изменение, запускает канал доказательства Telegram Desktop с реальным пользователем в Crabbox для
базовой и кандидатной ссылок, повторяет процесс, пока нативные GIF-файлы не станут полезными,
записывает парный манифест `motionPreview` и публикует ту же двухколоночную таблицу GIF-файлов
через приложение Mantis для GitHub, когда задано `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Арендует или повторно использует рабочий стол Crabbox Linux, устанавливает нативный Telegram
    Desktop, настраивает OpenClaw с арендованным токеном тестируемого бота Telegram,
    запускает Gateway и записывает доказательства в виде снимков экрана и MP4 с
    видимого рабочего стола VNC.
  - По умолчанию используется `--credential-source convex`, поэтому рабочим процессам требуется только
    секрет брокера Convex. Используйте `--credential-source env` с теми же
    переменными `OPENCLAW_QA_TELEGRAM_*`, что и для `pnpm openclaw qa telegram`.
  - Для Telegram Desktop по-прежнему требуется вход пользователя и профиль. Токен бота
    настраивает только OpenClaw. Используйте `--telegram-profile-archive-env <name>`
    для архива профиля `.tgz` в кодировке base64 либо используйте `--keep-lease` и один раз войдите
    вручную через VNC.
  - Записывает `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` и `telegram-desktop-builder.mp4`
    в выходной каталог.

Каналы живого транспорта используют единый стандартный контракт, чтобы новые транспорты
не расходились; матрица покрытия отдельных каналов находится в разделе
[Обзор QA — покрытие живого транспорта](/ru/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` — широкий набор синтетических тестов, не входящий в эту матрицу.

### Общие учетные данные Telegram через Convex (v1)

Когда для QA живого транспорта включен `--credential-source convex` (или `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
лаборатория QA получает эксклюзивную аренду из пула на базе
Convex, отправляет Heartbeat этой аренды во время работы канала и
освобождает аренду при завершении работы. Название раздела появилось до поддержки Discord, Slack и
WhatsApp; контракт аренды общий для всех типов.

Эталонная заготовка проекта Convex: `qa/convex-credential-broker/`

Обязательные переменные окружения:

- `OPENCLAW_QA_CONVEX_SITE_URL` (например, `https://your-deployment.convex.site`)
- Один секрет для выбранной роли:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Выбор роли учетных данных:
  - CLI: `--credential-role maintainer|ci`
  - Значение переменной окружения по умолчанию: `OPENCLAW_QA_CREDENTIAL_ROLE` (по умолчанию `ci` в CI, иначе `maintainer`)

Необязательные переменные окружения:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (по умолчанию `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (по умолчанию `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (по умолчанию `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (по умолчанию `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (по умолчанию `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необязательный идентификатор трассировки)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` разрешает закольцованные URL-адреса Convex `http://` только для локальной разработки.

При обычной работе `OPENCLAW_QA_CONVEX_SITE_URL` должен использовать `https://`.

Для административных команд сопровождающих (добавление, удаление и просмотр пула)
требуется именно `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Вспомогательные команды CLI для сопровождающих:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Перед живыми запусками используйте `doctor`, чтобы проверить URL сайта Convex, секреты брокера,
префикс конечной точки, тайм-аут HTTP и доступность административных операций и списка, не выводя
значения секретов. Используйте `--json` для машиночитаемого вывода в скриптах и
инструментах CI.

Контракт конечной точки по умолчанию (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Запросы проходят аутентификацию с помощью заголовка `Authorization: Bearer <role secret>`;
в приведенных ниже телах запросов этот заголовок опущен:

- `POST /acquire`
  - Запрос: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Успех: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Пул исчерпан/можно повторить: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Запрос: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Успех: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Запрос: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Успех: `{ status: "ok" }` (или пустой `2xx`)
- `POST /release`
  - Запрос: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Успех: `{ status: "ok" }` (или пустой `2xx`)
- `POST /admin/add` (только секрет сопровождающего)
  - Запрос: `{ kind, actorId, payload, note?, status? }`
  - Успех: `{ status: "ok", credential }`
- `POST /admin/remove` (только секрет сопровождающего)
  - Запрос: `{ credentialId, actorId }`
  - Успех: `{ status: "ok", changed, credential }`
  - Защита активной аренды: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (только секрет сопровождающего)
  - Запрос: `{ kind?, status?, includePayload?, limit? }`
  - Успех: `{ status: "ok", credentials, count }`

Формат полезной нагрузки для типа Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` должен быть строкой с числовым идентификатором чата Telegram.
- `admin/add` проверяет этот формат для `kind: "telegram"` и отклоняет некорректные полезные нагрузки.

Формат полезной нагрузки для типа реального пользователя Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` и `telegramApiId` должны быть числовыми строками.
- `tdlibArchiveSha256` и `desktopTdataArchiveSha256` должны быть шестнадцатеричными строками SHA-256.
- `kind: "telegram-user"` зарезервирован для рабочего процесса доказательства Mantis в Telegram Desktop. Обычные каналы лаборатории QA не должны его арендовать.

Проверяемые брокером многоканальные полезные нагрузки:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Каналы Slack также могут арендовать учетные данные из пула, но проверка полезной нагрузки Slack
сейчас выполняется в средстве запуска QA Slack, а не в брокере. Используйте
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
для строк Slack.

### Добавление канала в QA

Архитектура и имена вспомогательных функций сценариев для новых адаптеров каналов описаны в разделе
[Обзор QA — добавление канала](/ru/concepts/qa-e2e-automation#adding-a-channel).
Минимальные требования: реализовать средство запуска транспорта на общем интерфейсе хоста `qa-lab`,
добавить `adapterFactory` для общих сценариев, объявить `qaRunners` в
манифесте плагина, смонтировать как `openclaw qa <runner>` и создать сценарии в
`qa/scenarios/`.

## Наборы тестов (что где запускается)

Рассматривайте наборы как «возрастающий реализм» (а вместе с ним — нестабильность и стоимость).

### Модульные/интеграционные тесты (по умолчанию)

- Команда: `pnpm test`
- Конфигурация: нецелевые запуски используют набор сегментов `vitest.full-*.config.ts` и могут
  разворачивать сегменты с несколькими проектами в отдельные конфигурации для каждого проекта для параллельного
  планирования
- Файлы: основной и модульный наборы в `src/**/*.test.ts`,
  `packages/**/*.test.ts` и `test/**/*.test.ts`; модульные тесты интерфейса запускаются в
  выделенном сегменте `unit-ui`
- Область:
  - Чистые модульные тесты
  - Внутрипроцессные интеграционные тесты (аутентификация Gateway, маршрутизация, инструменты, синтаксический анализ, конфигурация)
  - Детерминированные регрессионные тесты известных ошибок
- Ожидания:
  - Запускаются в CI
  - Реальные ключи не требуются
  - Должны быть быстрыми и стабильными
  - Тесты резолвера и загрузчика публичной поверхности должны подтверждать широкое резервное поведение `api.js` и
    `runtime-api.js` с помощью сгенерированных минимальных фикстур плагинов,
    а не реальных API исходного кода встроенных плагинов. Загрузки API реальных плагинов должны проверяться в
    принадлежащих плагинам контрактных и интеграционных наборах.

Политика нативных зависимостей:

- Тестовые установки по умолчанию пропускают необязательную сборку нативного opus для Discord. Голосовая связь Discord
  использует встроенный `libopus-wasm`, а `@discordjs/opus` остается отключенным в
  `allowBuilds`, чтобы локальные тесты и каналы Testbox не компилировали нативное
  дополнение.
- Сравнивайте производительность нативного opus в репозитории тестов производительности `libopus-wasm`, а не
  в стандартных циклах установки и тестирования OpenClaw. Не задавайте для `@discordjs/opus` значение
  `true` в стандартном `allowBuilds`; из-за этого несвязанные циклы установки и тестирования
  будут компилировать нативный код.

<AccordionGroup>
  <Accordion title="Проекты, сегменты и специализированные каналы">

    - Нецелевой запуск `pnpm test` использует тринадцать меньших конфигураций шардов (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) вместо одного огромного нативного процесса корневого проекта. Это снижает пиковый RSS на загруженных машинах и не позволяет задачам автоответа и плагинов лишать ресурсов несвязанные наборы тестов.
    - `pnpm test --watch` по-прежнему использует нативный граф проекта `vitest.config.ts` корневого уровня, поскольку цикл отслеживания изменений с несколькими шардами непрактичен.
    - `pnpm test`, `pnpm test:watch` и `pnpm test:perf:imports` сначала направляют явно заданные целевые файлы и каталоги в специализированные потоки, поэтому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` не несёт полных затрат на запуск корневого проекта.
    - `pnpm test:changed` по умолчанию распределяет изменённые пути git по быстрым специализированным потокам: непосредственные изменения тестов, соседние файлы `*.test.ts`, явные сопоставления исходного кода и локальные зависимые узлы графа импортов. Изменения конфигурации, настройки или пакетов не запускают широкий набор тестов, если явно не использовать `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — стандартный интеллектуальный локальный контрольный этап для узких изменений. Он классифицирует различия по категориям: ядро, тесты ядра, расширения, тесты расширений, приложения, документация, метаданные выпуска, инструменты для live Docker и инструментарий, — а затем запускает соответствующие команды проверки типов, линтинга и защитных проверок. Он не запускает тесты Vitest; для подтверждения тестами вызовите `pnpm test:changed` или явно укажите `pnpm test <target>`. Изменения только версий в метаданных выпуска запускают целевые проверки версий, конфигурации и корневых зависимостей с защитой, отклоняющей изменения пакетов за пределами поля версии верхнего уровня.
    - Изменения live Docker-стенда ACP запускают специализированные проверки: синтаксис оболочки для скриптов аутентификации live Docker и пробный запуск планировщика live Docker. Изменения `package.json` учитываются только тогда, когда различия ограничены `scripts["test:docker:live-*"]`; изменения зависимостей, экспортов, версий и других поверхностей пакета по-прежнему проходят более широкие защитные проверки.
    - Модульные тесты с небольшим объёмом импортов для агентов, команд, плагинов, вспомогательных средств автоответа, `plugin-sdk` и аналогичных областей чистых утилит направляются в поток `unit-fast`, который пропускает `test/setup-openclaw-runtime.ts`; файлы с состоянием или высокой нагрузкой среды выполнения остаются в существующих потоках.
    - Некоторые исходные файлы вспомогательных средств `plugin-sdk` и `commands` также сопоставляют запуски в режиме изменений с явно заданными соседними тестами в этих лёгких потоках, поэтому изменения вспомогательных средств не приводят к повторному запуску всего тяжёлого набора тестов этого каталога.
    - `auto-reply` содержит отдельные группы для вспомогательных средств ядра верхнего уровня, интеграционных тестов `reply.*` верхнего уровня и поддерева `src/auto-reply/reply/**`. CI дополнительно разделяет поддерево ответов на шарды исполнителя агентов, диспетчеризации и маршрутизации команд и состояния, чтобы одна группа с большим объёмом импортов не занимала весь завершающий этап Node.
    - Обычный CI для PR и main намеренно пропускает пакетный прогон встроенных плагинов и предназначенный только для выпусков шард `agentic-plugins`. Полная проверка выпуска запускает отдельный дочерний рабочий процесс `Plugin Prerelease` для этих насыщенных плагинами наборов тестов на кандидатах в выпуск.

  </Accordion>

  <Accordion title="Покрытие встроенного исполнителя">

    - При изменении входных данных обнаружения инструментов сообщений или контекста среды выполнения Compaction
      сохраняйте оба уровня покрытия.
    - Добавляйте специализированные регрессионные тесты вспомогательных средств для границ чистой маршрутизации и нормализации.
    - Поддерживайте работоспособность интеграционных наборов тестов встроенного исполнителя:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` и
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Эти наборы проверяют, что идентификаторы областей и поведение Compaction по-прежнему проходят
      через реальные пути `run.ts` / `compact.ts`; тесты только вспомогательных средств
      недостаточны для замены этих интеграционных путей.

  </Accordion>

  <Accordion title="Значения по умолчанию для пула и изоляции Vitest">

    - Базовая конфигурация Vitest по умолчанию использует `threads`.
    - Общая конфигурация Vitest фиксирует `isolate: false` и использует
      неизолированный исполнитель в корневых проектах, конфигурациях e2e и live.
    - Корневой поток UI сохраняет настройку и оптимизатор `jsdom`, но также работает на
      общем неизолированном исполнителе.
    - Каждый шард `pnpm test` наследует одинаковые значения по умолчанию `threads` + `isolate: false`
      из общей конфигурации Vitest.
    - `scripts/run-vitest.mjs` по умолчанию добавляет `--no-maglev` для дочерних процессов Node
      Vitest, чтобы сократить повторную компиляцию V8 при крупных локальных запусках.
      Установите `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, чтобы сравнить со стандартным
      поведением V8.
    - `scripts/run-vitest.mjs` завершает явные запуски Vitest вне режима отслеживания,
      если в течение 5 минут нет вывода в stdout или stderr. Установите
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`, чтобы отключить сторожевой таймер
      для намеренно бесшумного исследования.

  </Accordion>

  <Accordion title="Быстрые локальные итерации">

    - `pnpm changed:lanes` показывает, какие архитектурные потоки затрагивают различия.
    - Хук перед коммитом выполняет только форматирование. Он повторно добавляет отформатированные файлы
      в индекс и не запускает линтинг, проверку типов или тесты.
    - Перед передачей работы или отправкой изменений явно запустите `pnpm check:changed`, если
      требуется интеллектуальный локальный контрольный этап.
    - `pnpm test:changed` по умолчанию направляет задачи в быстрые специализированные потоки. Используйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` только тогда, когда агент
      решит, что изменение стенда, конфигурации, пакета или контракта действительно требует
      более широкого покрытия Vitest.
    - `pnpm test:max` и `pnpm test:changed:max` сохраняют то же поведение
      маршрутизации, но с более высоким ограничением числа рабочих процессов.
    - Локальное автоматическое масштабирование рабочих процессов намеренно консервативно и снижает их число,
      когда средняя нагрузка хоста уже высока, поэтому несколько параллельных
      запусков Vitest по умолчанию наносят меньше ущерба.
    - Базовая конфигурация Vitest помечает файлы проектов и конфигурации как
      `forceRerunTriggers`, чтобы повторные запуски в режиме изменений оставались корректными при изменении
      связей тестов.
    - Конфигурация сохраняет `OPENCLAW_VITEST_FS_MODULE_CACHE` включённым на
      поддерживаемых хостах; задайте `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      для единственного явно указанного расположения кеша при непосредственном профилировании.

  </Accordion>

  <Accordion title="Отладка производительности">

    - `pnpm test:perf:imports` включает отчёт Vitest о длительности импортов вместе
      с подробной разбивкой импортов.
    - `pnpm test:perf:imports:changed` ограничивает это же представление профилирования
      файлами, изменёнными после `origin/main`.
    - Данные о времени выполнения шардов записываются в `.artifacts/vitest-shard-timings.json`.
      Запуски всей конфигурации используют путь конфигурации в качестве ключа; CI-шарды
      с шаблоном включения добавляют имя шарда, чтобы отфильтрованные шарды можно было отслеживать
      отдельно.
    - Если один ресурсоёмкий тест по-прежнему тратит большую часть времени на импорты при запуске,
      оставляйте тяжёлые зависимости за узким локальным интерфейсом `*.runtime.ts` и
      создавайте мок непосредственно для этого интерфейса вместо глубокого импорта вспомогательных средств среды выполнения
      только ради их передачи через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` сравнивает направленный
      `test:changed` с нативным путём корневого проекта для этих
      закоммиченных различий и выводит фактическое время вместе с максимальным RSS в macOS.
    - `pnpm test:perf:changed:bench -- --worktree` измеряет производительность текущего
      рабочего дерева с незакоммиченными изменениями, направляя список изменённых файлов через
      `scripts/test-projects.mjs` и корневую конфигурацию Vitest.
    - `pnpm test:perf:profile:main` записывает профиль ЦП основного потока для
      накладных расходов запуска и преобразования Vitest/Vite.
    - `pnpm test:perf:profile:runner` записывает профили ЦП и кучи исполнителя для
      набора модульных тестов с отключённым параллелизмом файлов.

  </Accordion>
</AccordionGroup>

### Стабильность (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфигурация: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` и `test/vitest/vitest.infra.config.ts`, каждая принудительно ограничена одним рабочим процессом
- Область:
  - Запускает реальный Gateway на loopback-интерфейсе с диагностикой, включённой по умолчанию
  - Создаёт синтетическую нагрузку сообщениями Gateway, операциями с памятью и крупными полезными данными через путь диагностических событий
  - Запрашивает `diagnostics.stability` через WS RPC Gateway
  - Охватывает вспомогательные средства сохранения диагностического пакета стабильности
  - Проверяет, что размер регистратора остаётся ограниченным, синтетические показатели RSS не превышают бюджет нагрузки, а глубина очередей каждого сеанса возвращается к нулю
- Ожидания:
  - Безопасно для CI и не требует ключей
  - Узкий поток для последующей проверки регрессий стабильности, а не замена полного набора тестов Gateway

### E2E (совокупно для репозитория)

- Команда: `pnpm test:e2e`
- Область:
  - Запускает поток дымовых E2E-тестов Gateway
  - Запускает поток браузерных E2E-тестов Control UI с моками
- Ожидания:
  - Безопасно для CI и не требует ключей
  - Требуется установленный Playwright Chromium

### E2E (дымовые тесты Gateway)

- Команда: `pnpm test:e2e:gateway`
- Конфигурация: `test/vitest/vitest.e2e.config.ts`
- Файлы: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` и E2E-тесты встроенных плагинов в `extensions/`
- Значения среды выполнения по умолчанию:
  - Использует Vitest `threads` с `isolate: false`, как и остальная часть репозитория.
  - Использует адаптивное число рабочих процессов (CI: до 2, локально: по умолчанию 1).
  - По умолчанию работает в бесшумном режиме, чтобы снизить накладные расходы консольного ввода-вывода.
- Полезные переопределения:
  - `OPENCLAW_E2E_WORKERS=<n>` для принудительного задания числа рабочих процессов (не более 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного включения подробного консольного вывода.
- Область:
  - Сквозное поведение Gateway с несколькими экземплярами
  - Интерфейсы WebSocket/HTTP, сопряжение узлов и более интенсивная сетевая нагрузка
- Ожидания:
  - Запускается в CI (если включено в конвейере)
  - Реальные ключи не требуются
  - Больше взаимодействующих компонентов, чем в модульных тестах (может работать медленнее)

### E2E (браузер Control UI с моками)

- Команда: `pnpm test:ui:e2e`
- Конфигурация: `test/vitest/vitest.ui-e2e.config.ts`
- Файлы: `ui/src/**/*.e2e.test.ts`
- Область:
  - Запускает Control UI на Vite
  - Управляет реальной страницей Chromium через Playwright
  - Заменяет WebSocket Gateway детерминированными внутрибраузерными моками
- Ожидания:
  - Запускается в CI как часть `pnpm test:e2e`
  - Реальный Gateway, агенты и ключи провайдеров не требуются
  - Должна присутствовать браузерная зависимость (`pnpm --dir ui exec playwright install chromium`)

### E2E: дымовой тест бэкенда OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Повторно использует активный локальный Gateway OpenShell
  - Создаёт песочницу из временного локального Dockerfile
  - Проверяет бэкенд OpenShell в OpenClaw через реальные `sandbox ssh-config` и выполнение по SSH
  - Проверяет каноническое удалённое поведение файловой системы через мост файловой системы песочницы
- Ожидания:
  - Только по явному включению; не входит в стандартный запуск `pnpm test:e2e`
  - Требуется локальный CLI `openshell` и работающий демон Docker
  - Требуется активный локальный Gateway OpenShell и источник его конфигурации
  - Использует изолированные `HOME` / `XDG_CONFIG_HOME`, а затем уничтожает тестовую песочницу
- Полезные переопределения:
  - `OPENCLAW_E2E_OPENSHELL=1` для включения теста при ручном запуске более широкого набора e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для указания нестандартного исполняемого файла CLI или скрипта-обёртки
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` для предоставления зарегистрированной конфигурации Gateway изолированному тесту
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` для переопределения IP-адреса Docker Gateway, используемого фикстурой политики хоста

### Live (реальные провайдеры и реальные модели)

- Команда: `pnpm test:live`
- Конфигурация: `test/vitest/vitest.live.config.ts`
- Файлы: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` и live-тесты встроенных плагинов в `extensions/`
- По умолчанию: **включено** посредством `pnpm test:live` (задаёт `OPENCLAW_LIVE_TEST=1`)
- Область проверки:
  - «Действительно ли этот провайдер/модель работает _сегодня_ с реальными учётными данными?»
  - Выявление изменений формата провайдера, особенностей вызова инструментов, проблем аутентификации и поведения при ограничении частоты запросов
- Ожидания:
  - По замыслу не гарантируется стабильность в CI (реальные сети, реальные политики провайдеров, квоты, сбои)
  - Требует денежных затрат / расходует лимиты запросов
  - Предпочтительно запускать узкие подмножества, а не «всё»
- Live-запуски используют уже экспортированные ключи API и подготовленные профили аутентификации.
- По умолчанию live-запуски по-прежнему изолируют `HOME` и копируют конфигурацию и данные аутентификации во временный тестовый домашний каталог, чтобы модульные фикстуры не могли изменить ваш реальный `~/.openclaw`.
- Задавайте `OPENCLAW_LIVE_USE_REAL_HOME=1` только тогда, когда намеренно хотите, чтобы live-тесты использовали ваш реальный домашний каталог.
- `pnpm test:live` по умолчанию использует более тихий режим: сохраняет вывод хода выполнения `[live] ...` и отключает журналы начальной загрузки Gateway/сообщения Bonjour. Задайте `OPENCLAW_LIVE_TEST_QUIET=0`, если хотите снова видеть полные журналы запуска.
- Ротация ключей API (для конкретного провайдера): задайте `*_API_KEYS` в формате с запятыми/точками с запятой либо `*_API_KEY_1`, `*_API_KEY_2` (например, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) или переопределение для конкретного live-запуска через `OPENCLAW_LIVE_*_KEY`; при ответах об ограничении частоты запросов тесты выполняют повторные попытки.
- Вывод хода выполнения/Heartbeat:
  - Live-наборы выводят строки хода выполнения в stderr, поэтому длительные вызовы провайдера остаются визуально активными, даже когда захват консоли Vitest не выводит сообщений.
  - `test/vitest/vitest.live.config.ts` отключает перехват консоли Vitest, чтобы строки хода выполнения провайдера/Gateway немедленно выводились во время live-запусков.
  - Настраивайте Heartbeat прямых моделей с помощью `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Настраивайте Heartbeat Gateway/проверок с помощью `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Какой набор следует запустить?

Используйте эту таблицу решений:

- Изменение логики/тестов: запустите `pnpm test` (и `pnpm test:coverage`, если вы изменили многое)
- Изменение сетевого взаимодействия Gateway / протокола WS / сопряжения: добавьте `pnpm test:e2e`
- Отладка проблем «мой бот не работает» / сбоев конкретного провайдера / вызова инструментов: запустите узкий набор `pnpm test:live`

## Live-тесты (с обращением к сети)

Описание live-матрицы моделей, быстрых проверок бэкенда CLI, быстрых проверок ACP, стенда
сервера приложений Codex и всех live-тестов медиапровайдеров (Deepgram, BytePlus, ComfyUI,
изображения, музыка, видео, мультимедийный стенд), а также обработки учётных данных для live-запусков

- см. в разделе [Тестирование live-наборов](/ru/help/testing-live). Специализированный контрольный список проверки обновлений и
  плагинов см. в разделе
  [Тестирование обновлений и плагинов](/ru/help/testing-updates-plugins).

## Средства запуска Docker (необязательные проверки «работает в Linux»)

Эти средства запуска Docker разделены на две категории:

- Средства запуска live-моделей: `test:docker:live-models` и `test:docker:live-gateway` запускают внутри Docker-образа репозитория только соответствующий профилю ключа файл live-тестов (`src/agents/models.profiles.live.test.ts` и `src/gateway/gateway-models.profiles.live.test.ts`), подключая локальный каталог конфигурации, рабочее пространство и необязательный файл переменных окружения профиля. Соответствующие локальные точки входа: `test:live:models-profiles` и `test:live:gateway-profiles`.
- Средства запуска live-тестов Docker при необходимости сохраняют собственные практические ограничения:
  `test:docker:live-models` по умолчанию использует отобранный поддерживаемый набор наиболее информативных проверок, а
  `test:docker:live-gateway` по умолчанию использует `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` и
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Задайте `OPENCLAW_LIVE_MAX_MODELS`
  или переменные окружения Gateway, если вам явно требуется меньшее ограничение или более широкий охват.
- `test:docker:all` один раз собирает live-образ Docker посредством `test:docker:live-build`, один раз упаковывает OpenClaw в tar-архив npm с помощью `scripts/package-openclaw-for-docker.mjs`, а затем собирает/переиспользует два образа `scripts/e2e/Dockerfile`. Базовый образ содержит только среду выполнения Node/Git для сценариев установки/обновления/зависимостей плагинов; эти сценарии подключают предварительно собранный tar-архив. Функциональный образ устанавливает тот же tar-архив в `/app` для сценариев проверки функций собранного приложения. Определения сценариев Docker находятся в `scripts/lib/docker-e2e-scenarios.mjs`; логика планировщика — в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` выполняет выбранный план. Агрегатор использует взвешенный локальный планировщик: `OPENCLAW_DOCKER_ALL_PARALLELISM` управляет слотами процессов, а ограничения ресурсов не позволяют одновременно запускать все ресурсоёмкие live-сценарии, установки npm и сценарии с несколькими сервисами. Если отдельный сценарий требует больше ресурсов, чем допускают активные ограничения, планировщик всё равно может запустить его, когда пул пуст, а затем выполнять его в одиночку, пока ресурсы снова не станут доступны. Значения по умолчанию: 10 слотов, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` и `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; настраивайте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` или `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (и другие переопределения `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`) только при наличии достаточного запаса ресурсов на хосте Docker. По умолчанию средство запуска выполняет предварительную проверку Docker, удаляет устаревшие контейнеры OpenClaw E2E, выводит состояние каждые 30 секунд, сохраняет длительности успешно выполненных сценариев в `.artifacts/docker-tests/lane-timings.json` и использует эти данные, чтобы при последующих запусках сначала начинать более длительные сценарии. Используйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, чтобы вывести взвешенный манифест сценариев без сборки или запуска Docker, либо `node scripts/test-docker-all.mjs --plan-json`, чтобы вывести план CI для выбранных сценариев, потребностей в пакетах/образах и учётных данных.
- `Package Acceptance` — нативная для GitHub проверка пакета на предмет того, «работает ли этот устанавливаемый tar-архив как продукт?». Она выбирает один пакет-кандидат из `source=npm`, `source=ref`, `source=url`, `source=trusted-url` или `source=artifact`, загружает его как `package-under-test`, а затем запускает переиспользуемые сценарии Docker E2E с этим точным tar-архивом вместо повторной упаковки выбранной ссылки. Профили упорядочены по широте охвата: `smoke`, `package`, `product` и `full` (а также `custom` для явного списка сценариев). Контракт пакета/обновления/плагина, матрицу сохранения работоспособности после обновления опубликованных версий, значения по умолчанию для выпуска и разбор сбоев см. в разделе [Тестирование обновлений и плагинов](/ru/help/testing-updates-plugins).
- Проверки сборки и выпуска запускают `scripts/check-cli-bootstrap-imports.mjs` после tsdown. Защитная проверка обходит статический граф сборки, начиная с `dist/entry.js` и `dist/cli/run-main.js`, и завершается ошибкой, если этот граф начальной загрузки до диспетчеризации команд статически импортирует какой-либо внешний пакет (Commander, интерфейс подсказок, undici, ведение журналов и аналогичные тяжёлые для запуска зависимости также учитываются); кроме того, она ограничивает размер включённого в сборку фрагмента запуска Gateway значением 70 KB и запрещает статический импорт известных редко используемых путей Gateway (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) из этого фрагмента. `scripts/release-check.ts` отдельно выполняет быструю проверку упакованного CLI с помощью `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` и `models list --provider openai`.
- Поддержка устаревшей совместимости в Package Acceptance ограничена версией `2026.4.25` (включая `2026.4.25-beta.*`). До этой границы стенд допускает только пробелы в метаданных опубликованных пакетов: отсутствие закрытых записей инвентаризации QA, отсутствие `gateway install --wrapper`, отсутствие файлов исправлений в созданной из tar-архива фикстуре git, отсутствие сохранённого `update.channel`, устаревшие расположения записей установки плагинов, отсутствие сохранения записей установки из магазина и миграцию метаданных конфигурации во время `plugins update`. Для пакетов после `2026.4.25` эти ситуации считаются безусловными ошибками.
- Средства быстрой проверки контейнеров: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` и `test:docker:config-reload` запускают один или несколько реальных контейнеров и проверяют высокоуровневые пути интеграции.
- Сценарии Docker/Bash E2E, которые устанавливают упакованный tar-архив OpenClaw через `scripts/lib/openclaw-e2e-instance.sh`, ограничивают `npm install` значением `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (по умолчанию `600s`; задайте `0`, чтобы отключить обёртку для отладки).

Средства запуска live-моделей Docker также подключают только необходимые домашние каталоги аутентификации CLI
(или все поддерживаемые, если запуск не сужен), а затем копируют их в домашний каталог
контейнера перед запуском, чтобы OAuth внешнего CLI мог обновлять токены,
не изменяя хранилище аутентификации хоста:

- Прямые модели: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Быстрая проверка привязки ACP: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; по умолчанию охватывает Claude, Codex и Gemini, со строгим охватом Droid/OpenCode посредством `pnpm test:docker:live-acp-bind:droid` и `pnpm test:docker:live-acp-bind:opencode`)
- Быстрая проверка бэкенда CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Быстрая проверка стенда сервера приложений Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент разработки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Быстрые проверки наблюдаемости: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` и `pnpm qa:observability:smoke` — закрытые сценарии QA для исходного рабочего дерева. Они намеренно не входят в Docker-сценарии выпуска пакета, поскольку tar-архив npm не содержит QA Lab.
- Live-проверка Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Мастер первоначальной настройки (TTY, полное создание структуры): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Быстрая проверка первоначальной настройки/канала/агента из tar-архива npm: `pnpm test:docker:npm-onboard-channel-agent` глобально устанавливает упакованный tar-архив OpenClaw в Docker, по умолчанию настраивает OpenAI посредством первоначальной настройки со ссылкой на переменную окружения, а также Telegram, запускает doctor и выполняет один ход агента с имитацией OpenAI. Переиспользуйте предварительно собранный tar-архив с помощью `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустите повторную сборку на хосте с помощью `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` или смените канал с помощью `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` либо `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Дымовая проверка пользовательского сценария релиза: `pnpm test:docker:release-user-journey` глобально устанавливает упакованный tarball OpenClaw в чистый домашний каталог Docker, запускает первоначальную настройку, настраивает имитируемого провайдера OpenAI, выполняет один ход агента, устанавливает и удаляет внешние плагины, настраивает ClickClack для локальной фикстуры, проверяет исходящие и входящие сообщения, перезапускает Gateway и запускает doctor.
- Дымовая проверка типизированной первоначальной настройки релиза: `pnpm test:docker:release-typed-onboarding` устанавливает упакованный tarball, управляет `openclaw onboard` через реальный TTY, настраивает OpenAI как провайдера со ссылкой на переменную окружения, проверяет отсутствие сохранения необработанного ключа и выполняет имитируемый ход агента.
- Дымовая проверка мультимедиа и памяти релиза: `pnpm test:docker:release-media-memory` устанавливает упакованный tarball, проверяет распознавание изображения из вложения PNG, результат генерации изображений через OpenAI-совместимый интерфейс, извлечение данных поиском по памяти и сохранение возможности извлечения после перезапуска Gateway.
- Дымовая проверка пользовательского сценария обновления релиза: `pnpm test:docker:release-upgrade-user-journey` по умолчанию устанавливает самую новую опубликованную базовую версию, предшествующую версии кандидатного tarball, настраивает состояние провайдера, плагина и ClickClack в опубликованном пакете, обновляет его до кандидатного tarball, а затем повторно выполняет основной сценарий агента, плагина и канала. Если более ранней опубликованной базовой версии не существует, используется версия кандидата. Переопределите базовую версию с помощью `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Дымовая проверка магазина плагинов релиза: `pnpm test:docker:release-plugin-marketplace` устанавливает плагин из локальной фикстуры магазина, обновляет установленный плагин, удаляет его и проверяет, что CLI плагина исчезает, а метаданные установки очищаются.
- Дымовая проверка установки Skills: `pnpm test:docker:skill-install` глобально устанавливает упакованный tarball OpenClaw в Docker, отключает в конфигурации установку загруженных архивов, находит по результатам поиска текущий идентификатор опубликованного навыка ClawHub, устанавливает его с помощью `openclaw skills install` и проверяет установленный навык, а также метаданные происхождения и блокировки `.clawhub`.
- Дымовая проверка переключения канала обновлений: `pnpm test:docker:update-channel-switch` глобально устанавливает упакованный tarball OpenClaw в Docker, переключается с пакета `stable` на git `dev`, проверяет сохранённый канал и работу плагина после обновления, затем переключается обратно на пакет `stable` и проверяет состояние обновления.
- Дымовая проверка сохранности при обновлении: `pnpm test:docker:upgrade-survivor` устанавливает упакованный tarball OpenClaw поверх загрязнённой фикстуры старого пользователя с агентами, конфигурацией канала, списками разрешённых плагинов, устаревшим состоянием зависимостей плагинов и существующими файлами рабочих пространств и сеансов. Проверка выполняет обновление пакета и неинтерактивный запуск doctor без действующих ключей провайдера или канала, затем запускает Gateway на петлевом интерфейсе и проверяет сохранность конфигурации и состояния, а также соблюдение лимитов запуска и получения состояния.
- Дымовая проверка сохранности при обновлении опубликованной версии: `pnpm test:docker:published-upgrade-survivor` по умолчанию устанавливает `openclaw@latest`, создаёт реалистичные файлы существующего пользователя, настраивает эту базовую версию с помощью встроенного сценария команд, проверяет полученную конфигурацию, обновляет опубликованную установку до кандидатного tarball, запускает doctor в неинтерактивном режиме, записывает `.artifacts/upgrade-survivor/summary.json`, затем запускает Gateway на петлевом интерфейсе и проверяет настроенные намерения, сохранность состояния, запуск, `/healthz`, `/readyz` и лимиты состояния RPC. Переопределите одну базовую версию с помощью `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, укажите агрегированному планировщику разворачивать точные локальные базовые версии с помощью `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, например `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, и разворачивать фикстуры, соответствующие описаниям проблем, с помощью `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, например `reported-issues`; набор зарегистрированных проблем включает `configured-plugin-installs` для автоматического исправления установки внешнего плагина OpenClaw. Приёмочное тестирование пакета предоставляет их как `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` и `published_upgrade_survivor_scenarios`, разрешает метатокены базовых версий, такие как `last-stable-4` или `all-since-2026.4.23`, а полная проверка релиза расширяет пакетный этап выдержки релиза до `last-stable-4 2026.4.23 2026.5.2 2026.4.15` и `reported-issues`.
- Дымовая проверка контекста среды выполнения сеанса: `pnpm test:docker:session-runtime-context` проверяет сохранение скрытого контекста среды выполнения в расшифровке сеанса, а также исправление с помощью doctor затронутых дублирующихся ветвей перезаписи запроса.
- Дымовая проверка глобальной установки Bun: `bash scripts/e2e/bun-global-install-smoke.sh` упаковывает текущее дерево, устанавливает его с помощью `bun install -g` в изолированный домашний каталог и проверяет, что `openclaw infer image providers --json` возвращает встроенных провайдеров изображений, а не зависает. Повторно используйте предварительно собранный tarball с помощью `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустите сборку на хосте с помощью `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` или скопируйте `dist/` из собранного образа Docker с помощью `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Дымовая проверка установщика в Docker: `bash scripts/test-install-sh-docker.sh` использует один кэш npm совместно для контейнеров root, обновления и прямой установки через npm. Дымовая проверка обновления по умолчанию использует npm `latest` как стабильную базовую версию перед обновлением до кандидатного tarball. Переопределите её локально с помощью `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` или входного параметра `update_baseline_version` рабочего процесса Install Smoke на GitHub. Проверки установщика без прав root сохраняют изолированный кэш npm, чтобы принадлежащие root записи кэша не скрывали поведение локальной пользовательской установки. Задайте `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, чтобы повторно использовать кэш root, обновления и прямой установки через npm при локальных повторных запусках.
- В CI Install Smoke дублирующее глобальное обновление напрямую через npm пропускается с помощью `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без этой переменной окружения, когда требуется покрытие прямого `npm install -g`.
- Дымовая проверка CLI удаления агентов с общим рабочим пространством: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) по умолчанию собирает образ из корневого Dockerfile, создаёт двух агентов с одним рабочим пространством в изолированном домашнем каталоге контейнера, запускает `agents delete --json` и проверяет корректность JSON и сохранение рабочего пространства. Повторно используйте образ дымовой проверки установки с помощью `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Сеть Gateway и жизненный цикл хоста: `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`) сохраняет двухконтейнерную дымовую проверку аутентификации и работоспособности WebSocket по локальной сети, затем использует Admin HTTP на петлевом интерфейсе, чтобы подтвердить блокировку на этапе подготовки, доступ с сохранённым управлением, восстановление после возобновления и подготовленную остановку и повторный запуск в том же контейнере. Проверка перезапуска должна завершиться до истечения исходного срока аренды; она проверяет, что состояние приостановки локально для процесса, тогда как сохранённая конфигурация Gateway и идентичность контейнера сохраняются, и выводит машиночитаемый JSON с длительностью этапов.
- Дымовая проверка снимка CDP браузера: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) собирает исходный образ E2E и слой Chromium, запускает Chromium с прямым CDP, выполняет `browser doctor --deep` и проверяет, что снимки ролей CDP охватывают URL ссылок, интерактивные элементы, определённые по курсору, ссылки iframe и метаданные фреймов.
- Регрессионная проверка минимального рассуждения для web_search в OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускает имитируемый сервер OpenAI через Gateway, проверяет, что `web_search` повышает `reasoning.effort` с `minimal` до `low`, затем принудительно вызывает отклонение схемы провайдером и проверяет, что необработанные сведения появляются в журналах Gateway.
- Мост канала MCP (предварительно заполненный Gateway + мост stdio + дымовая проверка необработанного кадра уведомления Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Инструменты MCP из комплекта OpenClaw (настоящий сервер MCP через stdio + дымовая проверка разрешения и запрета во встроенном профиле OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (скрипт: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Очистка MCP для Cron и подагента (настоящий Gateway + завершение дочернего процесса MCP через stdio после изолированных запусков Cron и одноразового подагента): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Плагины (дымовая проверка установки и обновления для локального пути, `file:`, реестра npm с поднятыми зависимостями, некорректных метаданных пакета npm, перемещаемых ссылок git, комплексной фикстуры ClawHub, обновлений магазина и включения и проверки комплекта Claude): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Задайте `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, чтобы пропустить блок ClawHub, или переопределите пару пакета и среды выполнения комплексной фикстуры по умолчанию с помощью `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` и `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест использует герметичный локальный сервер фикстуры ClawHub.
- Дымовая проверка обновления плагина без изменений: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Дымовая проверка матрицы жизненного цикла плагина: `pnpm test:docker:plugin-lifecycle-matrix` устанавливает упакованный tarball OpenClaw в пустой контейнер, устанавливает плагин npm, переключает его включение и отключение, обновляет и понижает его версию через локальный реестр npm, удаляет установленный код, а затем проверяет, что удаление плагина по-прежнему устраняет устаревшее состояние, одновременно регистрируя метрики RSS и CPU для каждого этапа жизненного цикла.
- Дымовая проверка метаданных перезагрузки конфигурации: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Плагины: `pnpm test:docker:plugins` охватывает дымовую проверку установки и обновления для локального пути, `file:`, реестра npm с поднятыми зависимостями, перемещаемых ссылок git, фикстур ClawHub, обновлений магазина и включения и проверки комплекта Claude. `pnpm test:docker:plugin-update` охватывает поведение обновления без изменений для установленных плагинов. `pnpm test:docker:plugin-lifecycle-matrix` охватывает установку плагина npm с отслеживанием ресурсов, включение, отключение, повышение версии, понижение версии и удаление при отсутствующем коде.

Чтобы вручную предварительно собрать и повторно использовать общий функциональный образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Переопределения образов для отдельных наборов, такие как `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, при наличии по-прежнему имеют приоритет. Когда `OPENCLAW_SKIP_DOCKER_BUILD=1` указывает на удалённый общий образ, скрипты загружают его, если он ещё не доступен локально. QR-тесты и Docker-тесты установщика сохраняют собственные Dockerfile, поскольку проверяют поведение пакета и установки, а не общую среду выполнения собранного приложения.

Docker-среды запуска с действующей моделью также монтируют текущую рабочую копию в режиме только для чтения
и переносят её во временный рабочий каталог внутри контейнера. Это позволяет сохранить
небольшой размер образа среды выполнения и при этом запускать Vitest для ваших точных локальных
исходного кода и конфигурации. На этапе переноса пропускаются крупные локальные кэши и результаты сборки
приложений, такие как `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а также локальные для
приложения `.build` или каталоги результатов Gradle, чтобы при непосредственных запусках в Docker
не тратить минуты на копирование артефактов, зависящих от конкретной машины. Они также задают
`OPENCLAW_SKIP_CHANNELS=1`, чтобы непосредственные проверки Gateway не запускали внутри контейнера
настоящие процессы каналов Telegram, Discord и т. д.
`test:docker:live-models` всё ещё запускает `pnpm test:live`, поэтому также передайте
`OPENCLAW_LIVE_GATEWAY_*`, когда требуется сузить или исключить непосредственное покрытие Gateway
из этого этапа Docker.

`test:docker:openwebui` — дымовая проверка совместимости более высокого уровня: она запускает
контейнер Gateway OpenClaw с включёнными OpenAI-совместимыми конечными точками HTTP,
запускает закреплённую версию контейнера Open WebUI для работы с этим Gateway, выполняет вход через
Open WebUI, проверяет, что `/api/models` предоставляет `openclaw/default`, затем отправляет
настоящий запрос чата через прокси `/api/chat/completions` в Open WebUI. Задайте
`OPENWEBUI_SMOKE_MODE=models` для проверок CI по пути релиза, которые должны завершаться
после входа в Open WebUI и обнаружения модели, не ожидая завершения ответа действующей модели.
Первый запуск может быть заметно медленнее, поскольку Docker может потребоваться
загрузить образ Open WebUI, а Open WebUI — завершить собственную
первоначальную настройку при холодном запуске. Для этого этапа требуется пригодный ключ действующей модели,
предоставленный через окружение процесса, подготовленные профили аутентификации или явный
`OPENCLAW_PROFILE_FILE`. Успешные запуски выводят небольшой объект JSON, например
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` намеренно детерминирован и не требует
настоящей учётной записи Telegram, Discord или iMessage. Он запускает предварительно заполненный контейнер
Gateway, запускает второй контейнер, который создаёт `openclaw mcp serve`, затем
проверяет обнаружение маршрутизируемых разговоров, чтение расшифровок, метаданные
вложений, поведение очереди событий в реальном времени, маршрутизацию исходящей отправки и уведомления
в стиле Claude о каналах и разрешениях через настоящий мост MCP по stdio. Проверка
уведомлений анализирует необработанные кадры MCP по stdio напрямую, поэтому дымовая проверка
проверяет фактические данные, выдаваемые мостом, а не только те, которые конкретный клиентский SDK
случайно предоставляет.

`test:docker:agent-bundle-mcp-tools` детерминирован и не требует
ключа действующей модели. Он собирает Docker-образ репозитория, запускает внутри контейнера реальный
сервер-зонд MCP через stdio, материализует этот сервер посредством
встроенной среды выполнения MCP из комплекта OpenClaw, выполняет инструмент, а затем проверяет,
что `coding` и `messaging` сохраняют инструменты `bundle-mcp`, а `minimal` и
`tools.deny: ["bundle-mcp"]` отфильтровывают их.

`test:docker:cron-mcp-cleanup` детерминирован и не требует ключа
действующей модели. Он запускает Gateway с начальными данными и реальным сервером-зондом MCP через stdio,
выполняет изолированный проход cron и однократный дочерний проход `sessions_spawn`, а затем
проверяет, что дочерний процесс MCP завершается после каждого запуска.

Ручная дымовая проверка потока ACP на естественном языке (не для CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Сохраните этот скрипт для рабочих процессов регрессионного тестирования и отладки. Он может снова понадобиться для проверки маршрутизации потоков ACP, поэтому не удаляйте его.

Полезные переменные среды:

- `OPENCLAW_CONFIG_DIR=...` (по умолчанию: `~/.openclaw`) монтируется в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (по умолчанию: `~/.openclaw/workspace`) монтируется в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` монтируется и подключается перед запуском тестов
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` для проверки только переменных среды, подключённых из `OPENCLAW_PROFILE_FILE`, с использованием временных каталогов конфигурации и рабочей области без монтирования внешних данных аутентификации CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (по умолчанию: `~/.cache/openclaw/docker-cli-tools`, если запуск ещё не использует каталог привязки CI или управляемый каталог) монтируется в `/home/node/.npm-global` для кэшированных установок CLI внутри Docker
- Внешние каталоги и файлы аутентификации CLI в `$HOME` монтируются только для чтения в `/host-auth...`, а затем копируются в `/home/node/...` перед запуском тестов
  - Каталоги по умолчанию (используются, когда запуск не ограничен конкретными провайдерами): `.factory`, `.gemini`, `.minimax`
  - Файлы по умолчанию: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - При запусках, ограниченных провайдером, монтируются только необходимые каталоги и файлы, определённые по `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Переопределите вручную с помощью `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` или списка через запятую, например `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для ограничения запуска
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фильтрации провайдеров внутри контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1` для повторного использования существующего образа `openclaw:local-live` при повторных запусках, не требующих пересборки
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, чтобы гарантировать получение учётных данных из хранилища профилей, а не из переменных среды
- `OPENCLAW_OPENWEBUI_MODEL=...` для выбора модели, предоставляемой шлюзом для дымовой проверки Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` для переопределения запроса проверки одноразового значения, используемого дымовой проверкой Open WebUI
- `OPENWEBUI_IMAGE=...` для переопределения закреплённого тега образа Open WebUI

## Проверка документации

После правок документации запустите проверки: `pnpm check:docs`.
Когда также требуется проверка внутристранничных заголовков, запустите полную проверку якорей Mintlify: `pnpm docs:check-links:anchors`.

## Автономная регрессионная проверка (безопасная для CI)

Это регрессионные проверки «реального конвейера» без реальных провайдеров:

- Вызов инструментов через Gateway (имитация OpenAI, реальные шлюз и цикл агента): `src/gateway/gateway.test.ts` (сценарий: «выполняет сквозной вызов инструмента через имитацию OpenAI и цикл агента шлюза»)
- Мастер Gateway (WS `wizard.start`/`wizard.next`, записывает конфигурацию и принудительно применяет аутентификацию): `src/gateway/gateway.test.ts` (сценарий: «запускает мастер через ws и записывает конфигурацию токена аутентификации»)

## Оценки надёжности агента (навыки)

У нас уже есть несколько безопасных для CI тестов, работающих как «оценки надёжности агента»:

- Имитация вызова инструментов через реальные Gateway и цикл агента (`src/gateway/gateway.test.ts`).
- Сквозные сценарии мастера, проверяющие связность сеанса и влияние конфигурации (`src/gateway/gateway.test.ts`).

Чего ещё не хватает для навыков (см. [Skills](/ru/tools/skills)):

- **Принятие решений:** когда навыки перечислены в запросе, выбирает ли агент правильный навык (и избегает ли нерелевантных)?
- **Соблюдение требований:** читает ли агент `SKILL.md` перед использованием и выполняет ли обязательные шаги с нужными аргументами?
- **Контракты рабочего процесса:** многоходовые сценарии, проверяющие порядок инструментов, перенос истории сеанса и границы песочницы.

Будущие оценки прежде всего должны оставаться детерминированными:

- Средство запуска сценариев с имитациями провайдеров для проверки вызовов инструментов и их порядка, чтения файлов навыков и связности сеанса.
- Небольшой набор сценариев, ориентированных на навыки (использование или отказ от использования, проверки допуска, внедрение инструкций в запрос).
- Необязательные оценки с реальными сервисами (явно включаемые и управляемые переменными среды) — только после создания безопасного для CI набора.

## Контрактные тесты (структура плагинов и каналов)

Контрактные тесты проверяют соответствие каждого зарегистрированного плагина и канала
его контракту интерфейса. Они перебирают все обнаруженные плагины и запускают
набор проверок структуры и поведения. Стандартная модульная линия `pnpm test`
намеренно пропускает эти общие файлы проверки стыков и дымового тестирования; при изменении
общих поверхностей каналов или провайдеров запускайте контрактные
команды явно.

### Команды

- Все контракты: `pnpm test:contracts`
- Только контракты каналов: `pnpm test:contracts:channels`
- Только контракты провайдеров: `pnpm test:contracts:plugins`

### Контракты каналов

Расположены в `src/channels/plugins/contracts/*.contract.test.ts`. Текущие
категории верхнего уровня:

- **channel-catalog** — метаданные записей каталога встроенных каналов и каналов из реестра
- **plugin** (на основе реестра, разделённый на сегменты) — базовая структура регистрации плагина
- **surfaces-only** (на основе реестра, разделённый на сегменты) — проверки структуры отдельных поверхностей для `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` и `gateway`
- **session-binding** (на основе реестра) — поведение привязки сеанса
- **outbound-payload** — структура и нормализация полезной нагрузки сообщения
- **group-policy** (резервный вариант) — применение политики групп по умолчанию для каждого канала
- **threading** (на основе реестра, разделённый на сегменты) — обработка идентификатора потока
- **directory** (на основе реестра, разделённый на сегменты) — API каталога и списка участников
- **registry** и **plugins-core.\*** — реестр плагинов каналов, загрузчик и внутренние механизмы авторизации записи конфигурации

Вспомогательные средства перехвата входящей диспетчеризации и проверки исходящей полезной нагрузки, используемые этими
наборами, доступны для внутреннего использования через `src/plugin-sdk/channel-contract-testing.ts`
(исключено из npm, не является общедоступным подпутём SDK); отдельного файла
`inbound.contract.test.ts` в этом каталоге нет.

### Контракты провайдеров

Расположены в `src/plugins/contracts/*.contract.test.ts`. Текущие категории
включают:

- **shape** — структура манифеста плагина, API и экспортов среды выполнения
- **plugin-registration** (+ параллельные варианты) — сценарии регистрации манифеста
- **package-manifest** — требования к манифесту пакета
- **loader** — поведение настройки и завершения работы загрузчика плагинов
- **registry** — содержимое и поиск в реестре контрактов плагинов
- **providers** — общее поведение встроенных провайдеров, включая провайдеров веб-поиска
- **auth-choice** — метаданные выбора аутентификации и поведение настройки
- **provider-catalog-deprecation** — метаданные устаревших элементов каталога провайдеров
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** — контракты мастера настройки провайдеров
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** — контракты провайдеров для отдельных возможностей
- **session-actions**, **session-attachments**, **session-entry-projection** — контракты состояния сеанса, принадлежащего плагину
- **scheduled-turns** — метаданные запланированных ходов плагина и границы временных меток
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** — контракты жизненного цикла хоста и среды выполнения плагина, а также границ импорта
- **extension-runtime-dependencies** — размещение зависимостей среды выполнения для расширений

### Когда запускать

- После изменения экспортов или подпутей plugin-sdk
- После добавления или изменения плагина канала или провайдера
- После рефакторинга регистрации или обнаружения плагинов

Контрактные тесты выполняются в CI и не требуют реальных ключей API.

## Добавление регрессионных проверок (рекомендации)

При исправлении обнаруженной при работе с реальным сервисом проблемы провайдера или модели:

- По возможности добавьте безопасную для CI регрессионную проверку (имитацию или заглушку провайдера либо фиксацию точного преобразования структуры запроса)
- Если проверка по своей природе возможна только с реальным сервисом (ограничения частоты, политики аутентификации), оставьте её узкой и явно включаемой через переменные среды
- Предпочитайте тестирование наименьшего уровня, способного обнаружить ошибку:
  - ошибка преобразования или повторного воспроизведения запроса провайдера -> непосредственный тест моделей
  - ошибка конвейера сеанса, истории или инструментов шлюза -> дымовая проверка Gateway с реальным сервисом или безопасный для CI тест Gateway с имитацией
- Защита обхода SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` определяет по одной тестовой цели для каждого класса SecretRef из метаданных реестра (`listSecretTargetRegistryEntries()`), а затем проверяет отклонение идентификаторов выполнения с сегментами обхода.
  - Если вы добавляете новое семейство целей SecretRef `includeInPlan` в `src/secrets/target-registry-data.ts`, обновите `classifyTargetClass` в этом тесте. Тест намеренно завершается с ошибкой для неклассифицированных идентификаторов целей, чтобы новые классы нельзя было незаметно пропустить.

## Связанные материалы

- [Тестирование с реальными сервисами](/ru/help/testing-live)
- [Тестирование обновлений и плагинов](/ru/help/testing-updates-plugins)
- [CI](/ru/ci)
