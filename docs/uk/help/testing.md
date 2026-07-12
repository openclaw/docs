---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей і провайдерів
    - Налагодження поведінки Gateway і агента
summary: 'Набір для тестування: модульні, наскрізні та робочі набори тестів, засоби запуску Docker і охоплення кожного тесту'
title: Тестування
x-i18n:
    generated_at: "2026-07-12T13:17:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори тестів Vitest (модульні/інтеграційні, e2e, live), а також засоби запуску Docker. На цій сторінці описано призначення кожного набору, яку команду запускати для певного робочого процесу, як live-тести знаходять облікові дані та як додавати регресійні тести для реальних помилок провайдерів і моделей.

<Note>
**Стек QA (qa-lab, qa-channel, live-транспортні лінії)** документовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, набір команд, створення сценаріїв.
- [Матричний QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [Картка оцінювання зрілості](/uk/maturity/scorecard) — як свідчення QA для випуску допомагають ухвалювати рішення щодо стабільності та LTS.
- [Канал QA](/uk/channels/qa-channel) — синтетичний транспортний Plugin, який використовують сценарії на основі репозиторію.

Ця сторінка охоплює звичайні набори тестів і засоби запуску Docker/Parallels. У розділі [Засоби запуску для QA](#qa-specific-runners) нижче наведено конкретні виклики `qa` та посилання на зазначені вище довідкові матеріали.
</Note>

## Швидкий початок

У більшості випадків:

- Повна перевірка (очікується перед надсиланням змін): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужному комп’ютері: `pnpm test:max`
- Безпосередній цикл спостереження Vitest: `pnpm test:watch`
- Безпосереднє вказання файлу також спрямовує шляхи Plugin/каналів належним чином: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітеративного виправлення окремої помилки спочатку віддавайте перевагу цільовим запускам.
- Середовище QA на основі Docker: `pnpm qa:lab:up`
- Лінія QA на основі віртуальної машини Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете мати додаткову впевненість:

- Інформаційний звіт про покриття V8: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

## Тимчасові каталоги тестів

Використовуйте спільні допоміжні засоби з `test/helpers/temp-dir.ts` для тимчасових каталогів, якими володіють тести, щоб належність була явною, а очищення залишалося в межах життєвого циклу тесту:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` навмисно не надає методу ручного очищення — Vitest відповідає за очищення після кожного тесту. Старіші низькорівневі допоміжні засоби (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) досі існують для тестів, які ще не було перенесено; не використовуйте їх у новому коді та не додавайте нових прямих викликів `fs.mkdtemp*`, якщо тест явно не перевіряє базову поведінку тимчасового каталогу. Якщо прямий тимчасовий каталог справді потрібен, додайте придатний для аудиту дозвільний коментар із поясненням:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` повідомляє про нове пряме створення тимчасових каталогів і нове ручне використання спільних допоміжних засобів у доданих рядках різниці, не блокуючи наявні способи очищення. Він використовує ту саму класифікацію шляхів тестів, що й `scripts/changed-lanes.mjs`, і пропускає саму реалізацію спільного допоміжного засобу. `check:changed` запускає цей звіт для змінених шляхів тестів як сигнал CI лише у вигляді попередження (анотації попереджень GitHub, а не помилки).

## Робочі процеси live і Docker/Parallels

Під час налагодження реальних провайдерів/моделей (потрібні справжні облікові дані):

- Набір live (моделі та перевірки інструментів/зображень Gateway): `pnpm test:live`
- Тихий цільовий запуск одного live-файлу: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Звіти про продуктивність середовища виконання: запустіть `OpenClaw Performance` з
  `live_openai_candidate=true` для реального ходу агента `openai/gpt-5.6-luna` або
  `deep_profile=true` для артефактів CPU/купи/трасування Kova. Щоденні заплановані
  запуски публікують звіти ліній фіктивного провайдера, поглибленого профілю та GPT-5.6 Luna до
  `openclaw/clawgrit-reports` з окремого завдання публікації, яке споживає артефакти;
  відсутня або недійсна автентифікація видавця спричиняє помилку запланованих запусків і
  запусків із `profile=release`. Ручні запуски, що не належать до випуску, зберігають артефакти GitHub
  і вважають публікацію звіту рекомендаційною. Звіт фіктивного провайдера також
  містить показники запуску Gateway на рівні вихідного коду, пам’яті, навантаження Plugin,
  повторюваного циклу привітання фіктивної моделі та запуску CLI.
- Live-перевірка моделей у Docker: `pnpm test:docker:live-models`
  - Кожна вибрана модель виконує текстовий хід і невелику перевірку на кшталт читання файлу.
    Моделі, метадані яких оголошують підтримку вхідних даних `image`, також виконують невеликий хід із зображенням.
    Вимкніть додаткові перевірки за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте помилки провайдера.
  - Покриття CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` викликають повторно використовуваний робочий процес live/E2E з
    `include_live_suites: true`, який охоплює завдання матриці live-моделей Docker,
    розподілені на сегменти за провайдерами.
  - Для цільових повторних запусків CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високоінформативні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`,
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і робочих процесів
    запланованих запусків/випусків, які його викликають.
- Нативна димова перевірка прив’язаного чату Codex: `pnpm test:docker:live-codex-bind`
  - Запускає live-лінію Docker для шляху сервера застосунку Codex, прив’язує
    синтетичне приватне повідомлення Slack за допомогою `/codex bind`, перевіряє `/codex fast` і
    `/codex permissions`, а потім підтверджує, що звичайна відповідь і вкладене зображення
    проходять через нативну прив’язку Plugin, а не через ACP.
- Димова перевірка тестового середовища сервера застосунку Codex: `pnpm test:docker:live-codex-harness`
  - Запускає ходи агента Gateway через тестове середовище сервера застосунку Codex,
    яким володіє Plugin, перевіряє `/codex status` і `/codex models` та за замовчуванням
    виконує перевірки зображення, MCP Cron, підагента й Guardian. Вимкніть
    перевірку підагента за допомогою `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли
    ізолюєте інші помилки. Для цільової перевірки підагента вимкніть
    інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Після перевірки підагента процес завершується, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Димова перевірка встановлення Codex на вимогу: `pnpm test:docker:codex-on-demand`
  - Встановлює запакований tarball OpenClaw у Docker, виконує початкове налаштування
    з ключем API OpenAI та перевіряє, що Plugin Codex і залежність `@openai/codex`
    було завантажено на вимогу до кореневого каталогу керованого проєкту npm.
- Димова перевірка залежності інструмента live-Plugin: `pnpm test:docker:live-plugin-tool`
  - Пакує тестовий Plugin зі справжньою залежністю `slugify`, встановлює його
    через `npm-pack:`, перевіряє залежність у кореневому каталозі керованого проєкту npm,
    а потім просить live-модель OpenAI викликати інструмент Plugin і
    повернути прихований slug.
- Димова перевірка команди порятунку Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Необов’язкова подвійна перевірка інтерфейсу команди порятунку
    для каналу повідомлень. Виконує `/crestodian status`, ставить у чергу стійку
    зміну моделі, відповідає `/crestodian yes` і перевіряє шлях запису
    аудиту/конфігурації.
- Димова перевірка першого запуску Crestodian у Docker: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw і спершу підтверджує, що запакований
    CLI `openclaw crestodian` завершується безпечною відмовою без інференсу. Потім
    тестує та активує фіктивний Claude через запакований модуль активації.
    Лише після цього нечіткий запит до запакованого CLI потрапляє до планувальника й
    перетворюється на типізоване налаштування, після чого виконуються одноразові операції з моделлю, агентом,
    Plugin Discord і SecretRef. Перевіряє конфігурацію та записи аудиту. Це
    допоміжне свідчення роботи перевірки/операцій, а не підтвердження інтерактивного початкового налаштування чи
    агента/інструмента/затвердження Crestodian. Та сама лінія доступна в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Димова перевірка вартості Moonshot/Kimi: установивши `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім запустіть ізольовану команду
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє Moonshot/K2.6, а
  стенограма асистента зберігає нормалізоване значення `usage.cost`.

<Tip>
Якщо вам потрібен лише один помилковий випадок, звужуйте live-тести за допомогою змінних середовища списку дозволів, описаних нижче.
</Tip>

## Засоби запуску для QA

Ці команди доповнюють основні набори тестів, коли потрібен реалізм QA Lab.

CI запускає QA Lab у спеціалізованих робочих процесах. Відповідність агентного режиму вкладено в
`QA-Lab - All Lanes` і перевірку випуску, а не винесено в окремий робочий процес PR.
Для широкої перевірки слід використовувати `Full Release Validation` із
`rerun_group=qa-parity` або групу QA перевірок випуску. Стабільні/стандартні перевірки випуску
залишають вичерпне live/Docker-тестування під навантаженням за `run_release_soak=true`;
профіль `full` примусово вмикає його. `QA-Lab - All Lanes` запускається щоночі для `main` і
вручну з лінією відповідності на фіктивних даних, live-лінією Matrix,
керованою Convex live-лінією Telegram і керованою Convex live-лінією Discord як
паралельними завданнями. Заплановані перевірки QA та випуску явно передають Matrix `--profile fast`,
тоді як значення за замовчуванням для CLI Matrix і ручного введення робочого процесу залишається
`all`; ручний запуск може розподілити `all` на завдання `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` запускає
перевірку відповідності, а також швидкі лінії Matrix і Telegram до схвалення випуску, використовуючи
`mock-openai/gpt-5.6-luna` для транспортних перевірок випуску, щоб вони залишалися детермінованими
й не потребували звичайного запуску Plugin провайдера. Ці live-шлюзи транспортів
вимикають пошук у пам’яті; поведінка пам’яті й надалі перевіряється наборами тестів відповідності QA.

Повні live-сегменти медіаперевірок випуску використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, де вже встановлено
`ffmpeg` і `ffprobe`. Docker-сегменти live-перевірок моделей/бекендів використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, який збирається один раз для вибраного
коміту, а потім завантажується з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість повторного збирання
в кожному сегменті.

- `pnpm openclaw qa suite`
  - Запускає безпосередньо на хості сценарії QA, що зберігаються в репозиторії.
  - Записує артефакти верхнього рівня `qa-evidence.json`, `qa-suite-summary.json` і
    `qa-suite-report.md` для вибраного набору сценаріїв, зокрема
    вибрані сценарії змішаних потоків, Vitest і Playwright.
  - Під час запуску через `pnpm openclaw qa run --qa-profile <profile>` вбудовує
    картку оцінювання вибраного профілю таксономії в той самий файл `qa-evidence.json`.
    `smoke-ci` записує скорочені докази (`evidenceMode: "slim"`, без окремого
    `execution` для кожного запису). `release` охоплює сформований набір для перевірки
    готовності до випуску; `all` вибирає кожну активну категорію зрілості й призначений
    для явних запусків робочого процесу QA Profile Evidence, коли потрібен повний
    артефакт картки оцінювання.
  - За замовчуванням паралельно запускає кілька вибраних сценаріїв з ізольованими
    робочими процесами Gateway. Для `qa-channel` стандартний рівень паралельності
    дорівнює 4 (з обмеженням за кількістю вибраних сценаріїв). Використовуйте
    `--concurrency <count>`, щоб налаштувати кількість робочих процесів, або
    `--concurrency 1` для старішого послідовного конвеєра.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується невдало.
    Використовуйте `--allow-failures`, щоб отримати артефакти без ненульового коду
    завершення.
  - Підтримує режими постачальника `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер постачальника на основі AIMock для
    експериментального охоплення фікстур і імітації протоколу, не замінюючи
    орієнтований на сценарії конвеєр `mock-openai`.
- `pnpm openclaw qa coverage --match <query>`
  - Шукає за ідентифікаторами сценаріїв, назвами, поверхнями, ідентифікаторами
    покриття, посиланнями на документацію, посиланнями на код, plugins і вимогами
    до постачальників, а потім виводить відповідні цілі наборів.
  - Використовуйте це перед запуском QA Lab, якщо знаєте змінену поведінку або шлях
    до файлу, але не знаєте найменшого відповідного сценарію. Це лише рекомендація —
    усе одно вибирайте імітаційний, реальний, Multipass, Matrix або транспортний
    доказ відповідно до змінюваної поведінки.
- `pnpm test:plugins:kitchen-sink-live`
  - Запускає через QA Lab комплекс реальних випробувань Plugin OpenAI Kitchen Sink.
    Встановлює зовнішній пакет Kitchen Sink, перевіряє перелік поверхонь SDK Plugin,
    опитує `/healthz` і `/readyz`, записує докази використання процесора та RSS
    Gateway, виконує реальний запит до OpenAI і перевіряє діагностику за ворожих
    умов. Потребує реальних даних автентифікації OpenAI, як-от `OPENAI_API_KEY`.
    У підготовлених сеансах Testbox автоматично завантажує профіль реальної
    автентифікації Testbox, якщо наявний допоміжний засіб `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає тест продуктивності запуску Gateway разом із невеликим набором
    імітаційних сценаріїв QA Lab (`channel-chat-baseline`,
    `memory-failure-fallback`, `gateway-restart-inflight-run`) і записує
    об'єднаний звіт спостережень за процесором у
    `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише тривалі спостереження високого навантаження
    на процесор (`--cpu-core-warn`, стандартно `0.9`; `--hot-wall-warn-ms`,
    стандартно `30000`), тому короткі сплески під час запуску записуються як
    метрики, але не виглядають як регресія з багатохвилинним повним завантаженням
    Gateway.
  - Працює зі зібраними артефактами `dist`; спочатку виконайте збірку, якщо
    поточна робоча копія ще не має свіжих результатів виконання.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий набір QA у тимчасовій віртуальній машині Multipass Linux,
    зберігаючи ті самі прапорці вибору сценаріїв, постачальника й моделі, що й
    `qa suite`.
  - Реальні запуски передають доступні для гостьової системи вхідні дані
    автентифікації QA: ключі постачальників із змінних середовища, шлях до
    конфігурації реального постачальника QA та `CODEX_HOME`, якщо він наявний.
  - Каталоги виведення мають залишатися в корені репозиторію, щоб гостьова система
    могла записувати дані назад через змонтований робочий простір.
  - Записує звичайний звіт і зведення QA, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає сайт QA на основі Docker для роботи з QA в операторському режимі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Створює архів npm із поточної робочої копії, глобально встановлює його в
    Docker, виконує неінтерактивне первинне налаштування з ключем API OpenAI,
    за замовчуванням налаштовує Telegram, перевіряє, що середовище виконання
    упакованого Plugin завантажується без виправлення залежностей під час запуску,
    запускає doctor і виконує один локальний хід агента з імітованою кінцевою
    точкою OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий
    конвеєр встановлення пакета з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детерміновану швидку перевірку зібраного застосунку в Docker для
    стенограм вбудованого контексту середовища виконання. Перевіряє, що прихований
    контекст середовища виконання OpenClaw зберігається як невідображуване
    спеціальне повідомлення, а не потрапляє у видимий хід користувача, потім
    створює пошкоджений файл JSONL ураженого сеансу й перевіряє, що
    `openclaw doctor --fix` переписує його в активну гілку зі створенням резервної
    копії.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює пакет-кандидат OpenClaw у Docker, виконує первинне налаштування
    встановленого пакета, налаштовує Telegram через встановлений CLI, а потім
    повторно використовує реальний конвеєр QA Telegram, де встановлений пакет
    виступає Gateway системи, що тестується.
  - Обгортка монтує з поточної робочої копії лише вихідний код тестового
    середовища `qa-lab`; встановленому пакету належать `dist`,
    `openclaw/plugin-sdk` і середовище виконання вбудованих plugins, тому конвеєр
    не домішує plugins із поточної робочої копії до тестованого пакета.
  - За замовчуванням використовується
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; задайте
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати визначений локальний архів
    замість встановлення з реєстру.
  - За замовчуванням записує повторні вимірювання RTT у `qa-evidence.json` із
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Перевизначте
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` або
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, щоб налаштувати запуск.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` приймає розділений комами список
    ідентифікаторів перевірок QA Telegram для вибірки; якщо значення не задано,
    типовою перевіркою з підтримкою RTT є `telegram-mentioned-message-reply`.
  - Використовує ті самі облікові дані Telegram зі змінних середовища або джерело
    облікових даних Convex, що й `pnpm openclaw qa telegram`. Для автоматизації
    CI/випусків задайте `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` разом із
    `OPENCLAW_QA_CONVEX_SITE_URL` і секретом ролі. Якщо в CI наявні
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі Convex, обгортка Docker
    автоматично вибирає Convex.
  - Обгортка перевіряє змінні середовища облікових даних Telegram або Convex на
    хості до збирання чи встановлення в Docker. Задавайте
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` лише для навмисного
    налагодження підготовки до налаштування облікових даних.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    змінну `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього конвеєра. Якщо вибрано
    облікові дані Convex, але роль не задано, обгортка використовує `ci` в CI та
    `maintainer` поза CI.
  - GitHub Actions надає цей конвеєр як ручний робочий процес супровідників
    `NPM Telegram Beta E2E`. Він не запускається під час злиття. Робочий процес
    використовує середовище `qa-live-shared` і оренди облікових даних Convex CI.
- GitHub Actions також надає `Package Acceptance` для окремого запуску перевірки
  продукту з одним пакетом-кандидатом. Він приймає посилання Git, опубліковану
  специфікацію npm, URL архіву через HTTPS разом із SHA-256, політику довірених
  URL або артефакт архіву з іншого запуску
  (`source=ref|npm|url|trusted-url|artifact`), завантажує нормалізований
  `openclaw-current.tgz` як `package-under-test`, а потім запускає наявний
  планувальник E2E Docker із профілями конвеєрів `smoke`, `package`, `product`,
  `full` або `custom`. Задайте `telegram_mode=mock-openai` або `live-frontier`,
  щоб запустити робочий процес QA Telegram із тим самим артефактом
  `package-under-test`.
  - Перевірка продукту для останньої бета-версії:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Для перевірки за точним URL архіву потрібен дайджест; застосовується політика
  безпеки публічних URL:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Корпоративні або приватні дзеркала архівів використовують явну політику
  довіреного джерела:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` читає `.github/package-trusted-sources.json` із довіреного
посилання робочого процесу й не приймає облікові дані в URL або переданий через
вхідні дані робочого процесу обхід обмежень приватної мережі. Якщо вказана політика
визначає автентифікацію за токеном носія, налаштуйте фіксований секрет
`OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Перевірка за артефактом завантажує артефакт архіву з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Пакує й встановлює поточну збірку OpenClaw у Docker, запускає Gateway із
    налаштованим OpenAI, а потім вмикає вбудовані канали й plugins через зміни
    конфігурації.
  - Перевіряє, що виявлення під час налаштування не додає неналаштовані
    завантажувані plugins, перше налаштоване виправлення doctor явно встановлює
    кожен відсутній завантажуваний Plugin, а другий перезапуск не виконує
    прихованого виправлення залежностей.
  - Також встановлює відому старішу базову версію npm, вмикає Telegram перед
    запуском `openclaw update --tag <candidate>` і перевіряє, що doctor кандидата
    після оновлення очищає застарілі залишки залежностей plugins без виправлення
    після встановлення з боку тестового середовища.
- `pnpm test:parallels:npm-update`
  - Запускає нативну швидку перевірку оновлення встановленого пакета в гостьових
    системах Parallels. Кожна вибрана платформа спочатку встановлює запитаний
    базовий пакет, потім запускає встановлену команду `openclaw update` у тій
    самій гостьовій системі та перевіряє встановлену версію, стан оновлення,
    готовність Gateway і один локальний хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або
    `--platform linux` під час ітеративної роботи з однією гостьовою системою.
    Використовуйте `--json`, щоб отримати шлях до артефакту зведення та стан
    кожного конвеєра.
  - Конвеєр OpenAI за замовчуванням використовує `openai/gpt-5.6-luna` для
    перевірки реального ходу агента. Передайте `--model <provider/model>` або
    задайте `OPENCLAW_PARALLELS_OPENAI_MODEL`, щоб перевірити іншу модель OpenAI.
  - Обмежуйте тривалі локальні запуски тайм-аутом хоста, щоб зависання транспорту
    Parallels не могли використати решту часового вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали конвеєрів у
    `/tmp/openclaw-parallels-npm-update.*`. Перевірте `windows-update.log`,
    `macos-update.log` або `linux-update.log`, перш ніж вважати, що зовнішня
    обгортка зависла.
  - Оновлення Windows у холодній гостьовій системі може витрачати від 10 до 15
    хвилин на роботу doctor після оновлення та оновлення пакета; це все ще
    нормальний стан, якщо вкладений журнал налагодження npm продовжує оновлюватися.
  - Не запускайте цю сукупну обгортку паралельно з окремими конвеєрами швидкої
    перевірки Parallels для macOS, Windows або Linux. Вони спільно використовують
    стан віртуальної машини й можуть конфліктувати під час відновлення знімка,
    надання пакета або роботи Gateway у гостьовій системі.
  - Перевірка після оновлення запускає звичайну поверхню вбудованих plugins,
    оскільки фасади можливостей, як-от синтез мовлення, створення зображень і
    розпізнавання мультимедіа, завантажуються через вбудовані API середовища
    виконання, навіть якщо сам хід агента перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого димового
    тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає живий QA-сценарій Matrix із тимчасовим сервером Tuwunel,
    що працює на базі Docker. Доступно лише з вихідного коду — пакетні
    інсталяції не містять `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, змінні середовища та структура артефактів:
    [QA для Matrix](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає живий QA-сценарій Telegram у справжній приватній групі,
    використовуючи токени бота-драйвера та бота SUT зі змінних середовища.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим
    ідентифікатором чату Telegram.
  - Підтримує `--credential-source convex` для спільних об’єднаних облікових даних.
    Типово використовуйте режим змінних середовища або задайте
    `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути оренду зі спільного пулу.
  - Типовий набір охоплює canary-перевірку, обмеження за згадкою, адресування команд,
    `/status`, відповіді між ботами зі згадкою та відповіді основних нативних команд.
    Типовий набір `mock-openai` також охоплює детерміновані регресії ланцюжків
    відповідей і потокового передавання фінального повідомлення Telegram.
    Використовуйте `--list-scenarios` для додаткових перевірок, як-от `session_status`.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не проходить.
    Використовуйте `--allow-failures`, щоб отримати артефакти без коду завершення,
    який указує на помилку.
  - Потребує двох різних ботів в одній приватній групі, причому бот SUT
    повинен мати ім’я користувача Telegram.
  - Для стабільного спостереження за взаємодією між ботами ввімкніть
    Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся,
    що бот-драйвер може спостерігати за трафіком ботів у групі.
  - Записує звіт QA для Telegram, зведення та `qa-evidence.json` у
    `.artifacts/qa-e2e/...`. Сценарії з відповідями містять RTT від запиту
    бота-драйвера на надсилання до спостереженої відповіді SUT.

`Mantis Telegram Live` — це оболонка цього сценарію для доказів у PR. Вона запускає
кандидатне посилання з орендованими через Convex обліковими даними Telegram,
відтворює редагований пакет звіту/доказів QA у браузері робочого столу Crabbox,
записує докази у форматі MP4, створює GIF зі скороченими нерухомими фрагментами,
завантажує пакет артефактів і публікує вбудовані докази у PR через Mantis GitHub App,
коли задано `pr_number`. Супровідники можуть запустити її з інтерфейсу Actions
через `Mantis Scenario` (`scenario_id: telegram-live`) або безпосередньо
з коментаря до запиту на злиття:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` — це агентна оболонка нативного Telegram Desktop
для візуальних доказів стану до й після змін у PR. Запустіть її з інтерфейсу Actions
із довільними `instructions`, через `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) або з коментаря до PR:

```text
@openclaw-mantis telegram desktop proof
```

Агент Mantis читає PR, визначає, яка видима в Telegram поведінка доводить зміну,
запускає сценарій доказів Crabbox із Telegram Desktop від реального користувача
для базового та кандидатного посилань, повторює процес, доки нативні GIF не стануть
корисними, записує парний маніфест `motionPreview` і публікує ту саму таблицю GIF
із двома стовпцями через Mantis GitHub App, коли задано `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Орендує або повторно використовує робочий стіл Crabbox Linux, установлює
    нативний Telegram Desktop, налаштовує OpenClaw за допомогою орендованого
    токена бота Telegram SUT, запускає Gateway і записує докази у форматах
    знімка екрана/MP4 із видимого робочого столу VNC.
  - Типово використовує `--credential-source convex`, тому робочим процесам
    потрібен лише секрет брокера Convex. Використовуйте `--credential-source env`
    із тими самими змінними `OPENCLAW_QA_TELEGRAM_*`, що й
    `pnpm openclaw qa telegram`.
  - Telegram Desktop усе одно потребує входу користувача/профілю. Токен бота
    налаштовує лише OpenClaw. Використовуйте `--telegram-profile-archive-env <name>`
    для архіву профілю `.tgz` у форматі base64 або застосуйте `--keep-lease`
    й один раз увійдіть вручну через VNC.
  - Записує `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` і `telegram-desktop-builder.mp4`
    у каталог виведення.

Живі транспортні сценарії використовують єдиний стандартний контракт, щоб нові
транспорти не відхилялися від узгодженої реалізації; матриця охоплення кожного
сценарію наведена в розділі
[Огляд QA — охоплення живих транспортів](/uk/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` — це широкий синтетичний набір, який не входить до цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли для QA живого транспорту ввімкнено `--credential-source convex`
(або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`), лабораторія QA отримує ексклюзивну
оренду зі створеного на базі Convex пулу, надсилає Heartbeat для цієї оренди,
поки сценарій виконується, і звільняє оренду під час завершення роботи.
Назва розділу з’явилася до підтримки Discord, Slack і WhatsApp; контракт оренди
є спільним для всіх типів.

Еталонний каркас проєкту Convex: `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення зі змінної середовища: `OPENCLAW_QA_CREDENTIAL_ROLE`
    (типово `ci` у CI та `maintainer` в інших середовищах)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий ідентифікатор трасування)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє URL-адреси Convex із local loopback
  `http://` лише для локальної розробки.

За звичайної роботи `OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://`.

Адміністративні команди супровідника (додавання до пулу, видалення з пулу та
перегляд списку) потребують саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні команди CLI для супровідників:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Перед живими запусками використовуйте `doctor`, щоб перевірити URL-адресу сайту
Convex, секрети брокера, префікс кінцевої точки, тайм-аут HTTP і доступність
адміністративних операцій/списку без виведення значень секретів. Використовуйте
`--json` для машинозчитуваного виведення у скриптах і утилітах CI.

Типовий контракт кінцевої точки (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Запити автентифікуються за допомогою заголовка
`Authorization: Bearer <role secret>`; у наведених нижче тілах цей заголовок
пропущено:

- `POST /acquire`
  - Запит: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Успіх: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Пул вичерпано/можна повторити: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Успіх: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Успіх: `{ status: "ok" }` (або порожня відповідь `2xx`)
- `POST /release`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Успіх: `{ status: "ok" }` (або порожня відповідь `2xx`)
- `POST /admin/add` (лише секрет супровідника)
  - Запит: `{ kind, actorId, payload, note?, status? }`
  - Успіх: `{ status: "ok", credential }`
- `POST /admin/remove` (лише секрет супровідника)
  - Запит: `{ credentialId, actorId }`
  - Успіх: `{ status: "ok", changed, credential }`
  - Захист активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет супровідника)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма корисного навантаження для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим ідентифікатором чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні
  корисні навантаження.

Форма корисного навантаження для типу реального користувача Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` і `telegramApiId` мають бути числовими рядками.
- `tdlibArchiveSha256` і `desktopTdataArchiveSha256` мають бути шістнадцятковими
  рядками SHA-256.
- `kind: "telegram-user"` зарезервовано для робочого процесу доказів
  Mantis Telegram Desktop. Загальні сценарії лабораторії QA не повинні
  отримувати його.

Перевірювані брокером багатоканальні корисні навантаження:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Сценарії Slack також можуть орендувати дані з пулу, але перевірка корисного
навантаження Slack наразі виконується в засобі запуску QA для Slack, а не
в брокері. Для записів Slack використовуйте
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`.

### Додавання каналу до QA

Архітектуру та назви допоміжних засобів сценаріїв для нових адаптерів каналів
наведено в розділі
[Огляд QA — додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel).
Мінімальні вимоги: реалізувати засіб запуску транспорту на спільному інтерфейсі
хоста `qa-lab`, додати `adapterFactory` для спільних сценаріїв, оголосити
`qaRunners` у маніфесті плагіна, підключити як `openclaw qa <runner>` і створити
сценарії в `qa/scenarios/`.

## Набори тестів (що й де запускається)

Розглядайте набори як такі, що мають «зростальний реалізм» (і зростальну
нестабільність/вартість).

### Модульні / інтеграційні (типово)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір сегментів
  `vitest.full-*.config.ts` і можуть розгортати багатопроєктні сегменти
  в конфігурації для кожного проєкту, щоб планувати паралельне виконання
- Файли: переліки основних/модульних тестів у `src/**/*.test.ts`,
  `packages/**/*.test.ts` і `test/**/*.test.ts`; модульні тести інтерфейсу
  запускаються у виділеному сегменті `unit-ui`
- Охоплення:
  - Чисті модульні тести
  - Внутрішньопроцесні інтеграційні тести (автентифікація Gateway,
    маршрутизація, інструменти, розбір, конфігурація)
  - Детерміновані регресійні тести відомих помилок
- Очікування:
  - Запускаються в CI
  - Не потребують справжніх ключів
  - Мають бути швидкими та стабільними
  - Тести резолвера й завантажувача публічної поверхні мають доводити загальну
    резервну поведінку `api.js` і `runtime-api.js` за допомогою згенерованих
    мінімальних фікстур плагінів, а не справжніх API вихідного коду вбудованих
    плагінів. Завантаження API справжніх плагінів належать до наборів
    контрактних/інтеграційних тестів, якими володіють плагіни.

Політика щодо нативних залежностей:

- Типові тестові інсталяції пропускають необов’язкове збирання нативного
  кодека opus для Discord. Голосовий зв’язок Discord використовує вбудований
  `libopus-wasm`, а `@discordjs/opus` залишається вимкненим у `allowBuilds`,
  щоб локальні тести та сценарії Testbox не компілювали нативне доповнення.
- Порівнюйте продуктивність нативного opus у репозиторії тестів продуктивності
  `libopus-wasm`, а не в типових циклах інсталяції/тестування OpenClaw.
  Не встановлюйте для `@discordjs/opus` значення `true` у типовому
  `allowBuilds`; це змусить непов’язані цикли інсталяції/тестування
  компілювати нативний код.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Ненацілений запуск `pnpm test` виконує тринадцять менших конфігурацій сегментів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного процесу кореневого проєкту. Це зменшує пікове споживання RSS на навантажених машинах і запобігає тому, щоб завдання автоматичних відповідей або плагінів позбавляли ресурсів непов’язані набори тестів.
    - `pnpm test --watch` і надалі використовує нативний граф проєктів кореневого `vitest.config.ts`, оскільки цикл спостереження з кількома сегментами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку спрямовують явно вказані цільові файли або каталоги через обмежені смуги, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` не потребує повних витрат на запуск кореневого проєкту.
    - `pnpm test:changed` типово розгортає змінені шляхи git у недорогі обмежені смуги: безпосередньо змінені тести, сусідні файли `*.test.ts`, явні зіставлення вихідних файлів і локальні залежні модулі з графа імпортів. Зміни конфігурації, налаштування або пакетів не запускають широкого набору тестів, якщо явно не використати `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — звичайний інтелектуальний локальний контрольний етап для вузьких змін. Він класифікує різницю за категоріями ядра, тестів ядра, розширень, тестів розширень, застосунків, документації, метаданих випуску, інструментів інтерактивного Docker та інструментарію, а потім запускає відповідні команди перевірки типів, лінтингу й захисних перевірок. Він не запускає тести Vitest; для підтвердження тестами викличте `pnpm test:changed` або явно `pnpm test <target>`. Зміни лише версій у метаданих випуску запускають цільові перевірки версій, конфігурації та кореневих залежностей із захисною перевіркою, яка відхиляє зміни пакета поза полем версії верхнього рівня.
    - Зміни в інтерактивному Docker-оточенні ACP запускають цільові перевірки: синтаксис оболонки для скриптів автентифікації інтерактивного Docker та пробний запуск планувальника інтерактивного Docker. Зміни `package.json` включаються лише тоді, коли різниця обмежена `scripts["test:docker:live-*"]`; зміни залежностей, експортів, версій та інших поверхонь пакета й надалі проходять ширші захисні перевірки.
    - Модульні тести з малою кількістю імпортів для агентів, команд, плагінів, допоміжних засобів автоматичних відповідей, `plugin-sdk` та подібних областей із чистими утилітами спрямовуються через смугу `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; файли зі станом або значним навантаженням середовища виконання залишаються на наявних смугах.
    - Вибрані вихідні файли допоміжних засобів `plugin-sdk` і `commands` також зіставляють запуски в режимі змін з явними сусідніми тестами в цих легких смугах, тому зміни допоміжних засобів не потребують повторного запуску всього важкого набору для відповідного каталогу.
    - `auto-reply` має окремі групи для допоміжних засобів ядра верхнього рівня, інтеграційних тестів `reply.*` верхнього рівня та піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево відповідей на сегменти виконавця агентів, диспетчеризації та маршрутизації команд і стану, щоб одна група з великою кількістю імпортів не займала весь завершальний етап Node.
    - Звичайний CI для PR і основної гілки навмисно пропускає пакетний прогін вбудованих плагінів і призначений лише для випусків сегмент `agentic-plugins`. Повна перевірка випуску запускає окремий дочірній робочий процес `Plugin Prerelease` для цих наборів із великою кількістю плагінів у кандидатах на випуск.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Коли змінюєте вхідні дані виявлення інструментів повідомлень або контекст середовища виконання Compaction,
      зберігайте обидва рівні покриття.
    - Додавайте цільові регресійні тести допоміжних засобів для меж чистої маршрутизації
      та нормалізації.
    - Підтримуйте працездатність інтеграційних наборів вбудованого виконавця:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` і
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що ідентифікатори з обмеженою областю та поведінка Compaction і надалі проходять
      через справжні шляхи `run.ts` / `compact.ts`; тести лише допоміжних засобів
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований виконавець у кореневих проєктах, конфігураціях e2e та інтерактивних конфігураціях.
    - Коренева смуга UI зберігає налаштування `jsdom` та оптимізатор, але також працює
      на спільному неізольованому виконавці.
    - Кожен сегмент `pnpm test` успадковує ті самі типові параметри `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` до дочірніх процесів Node
      Vitest, щоб зменшити повторну роботу компілятора V8 під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.
    - `scripts/run-vitest.mjs` завершує явні запуски Vitest не в режимі спостереження
      після 5 хвилин без виведення в stdout або stderr. Установіть
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0`, щоб вимкнути сторожовий механізм для
      навмисно безмовного дослідження.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` показує, які архітектурні смуги активує різниця.
    - Хук перед комітом виконує лише форматування. Він повторно додає відформатовані файли
      до індексу та не запускає лінтинг, перевірку типів або тести.
    - Явно запускайте `pnpm check:changed` перед передаванням роботи або надсиланням змін, коли
      потрібен інтелектуальний локальний контрольний етап.
    - `pnpm test:changed` типово спрямовує виконання через недорогі обмежені смуги. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      визначає, що зміна тестового оточення, конфігурації, пакета або контракту справді потребує
      ширшого покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку
      маршрутизації, але з вищим обмеженням кількості робочих процесів.
    - Локальне автоматичне масштабування робочих процесів навмисно консервативне й зменшує навантаження,
      коли середнє навантаження хоста вже високе, тому кілька одночасних
      запусків Vitest типово створюють менше проблем.
    - Базова конфігурація Vitest позначає файли проєктів і конфігурації як
      `forceRerunTriggers`, щоб повторні запуски в режимі змін залишалися коректними після зміни
      підключення тестів.
    - Конфігурація залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на
      підтримуваних хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      для одного явно заданого розташування кешу під час безпосереднього профілювання.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів разом
      із деталізацією імпортів.
    - `pnpm test:perf:imports:changed` обмежує те саме подання профілювання
      файлами, зміненими відносно `origin/main`.
    - Дані про тривалість сегментів записуються до `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях конфігурації як ключ; сегменти CI
      з шаблоном включення додають назву сегмента, щоб відфільтровані сегменти можна було
      відстежувати окремо.
    - Якщо один навантажений тест усе ще витрачає більшу частину часу на початкові імпорти,
      розміщуйте важкі залежності за вузькою локальною межею `*.runtime.ts` і
      імітуйте безпосередньо цю межу замість глибокого імпорту допоміжних засобів середовища виконання
      лише для їх передавання через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із нативним шляхом кореневого проєкту для відповідної
      зафіксованої різниці та виводить фактичний час виконання разом із максимальним RSS у macOS.
    - `pnpm test:perf:changed:bench -- --worktree` вимірює продуктивність поточного
      дерева з незафіксованими змінами, спрямовуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує профіль CPU головного потоку для
      запуску Vitest/Vite та накладних витрат на перетворення.
    - `pnpm test:perf:profile:runner` записує профілі CPU й купи виконавця для
      модульного набору з вимкненим паралельним виконанням файлів.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` і `test/vitest/vitest.infra.config.ts`, кожна примусово використовує один робочий процес
- Область:
  - Запускає справжній Gateway через local loopback із типово ввімкненою діагностикою
  - Створює синтетичне навантаження повідомленнями Gateway, пам’яттю та великими корисними даними через шлях діагностичних подій
  - Виконує запит `diagnostics.stability` через Gateway WS RPC
  - Охоплює допоміжні засоби збереження пакета даних діагностики стабільності
  - Перевіряє, що рекордер залишається обмеженим, синтетичні вибірки RSS не перевищують бюджет навантаження, а глибина черг кожного сеансу знову зменшується до нуля
- Очікування:
  - Безпечно для CI та не потребує ключів
  - Вузька смуга для подальшої перевірки регресій стабільності, а не заміна повного набору Gateway

### E2E (сукупно для репозиторію)

- Команда: `pnpm test:e2e`
- Область:
  - Запускає смугу базової перевірки E2E для Gateway
  - Запускає смугу E2E браузера з імітацією для Control UI
- Очікування:
  - Безпечно для CI та не потребує ключів
  - Потребує встановленого Playwright Chromium

### E2E (базова перевірка Gateway)

- Команда: `pnpm test:e2e:gateway`
- Конфігурація: `test/vitest/vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести вбудованих плагінів у `extensions/`
- Типові параметри середовища виконання:
  - Використовує Vitest `threads` з `isolate: false`, відповідно до решти репозиторію.
  - Використовує адаптивну кількість робочих процесів (CI: до 2, локально: типово 1).
  - Типово працює в безмовному режимі, щоб зменшити накладні витрати на консольне введення-виведення.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового задання кількості робочих процесів (не більше 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення докладного консольного виведення.
- Область:
  - Наскрізна поведінка кількох екземплярів Gateway
  - Поверхні WebSocket/HTTP, сполучення Node і складніша мережева взаємодія
- Очікування:
  - Виконується в CI (коли ввімкнено в конвеєрі)
  - Справжні ключі не потрібні
  - Більше рухомих частин, ніж у модульних тестах (може працювати повільніше)

### E2E (імітація браузера Control UI)

- Команда: `pnpm test:ui:e2e`
- Конфігурація: `test/vitest/vitest.ui-e2e.config.ts`
- Файли: `ui/src/**/*.e2e.test.ts`
- Область:
  - Запускає Control UI у Vite
  - Керує справжньою сторінкою Chromium через Playwright
  - Замінює WebSocket Gateway детермінованими внутрішньобраузерними імітаціями
- Очікування:
  - Виконується в CI як частина `pnpm test:e2e`
  - Справжній Gateway, агенти або ключі постачальників не потрібні
  - Залежність браузера має бути наявна (`pnpm --dir ui exec playwright install chromium`)

### E2E: базова перевірка серверної частини OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Повторно використовує активний локальний Gateway OpenShell
  - Створює пісочницю з тимчасового локального Dockerfile
  - Перевіряє серверну частину OpenShell в OpenClaw через справжню команду `sandbox ssh-config` і виконання через SSH
  - Перевіряє канонічну для віддаленого середовища поведінку файлової системи через міст файлової системи пісочниці
- Очікування:
  - Лише за явної згоди; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працездатного демона Docker
  - Потребує активного локального Gateway OpenShell і джерела його конфігурації
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестову пісочницю
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання нетипового виконуваного файла CLI або скрипту-обгортки
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` для надання ізольованому тесту доступу до конфігурації зареєстрованого Gateway
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` для перевизначення IP-адреси Gateway Docker, яку використовує фікстура політики хоста

### Інтерактивні тести (справжні постачальники + справжні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `test/vitest/vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і тести в реальному середовищі для вбудованих плагінів у `extensions/`
- Типово: **увімкнено** командою `pnpm test:live` (установлює `OPENCLAW_LIVE_TEST=1`)
- Охоплення:
  - «Чи справді цей постачальник/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін форматів постачальників, особливостей виклику інструментів, проблем автентифікації та поведінки обмеження частоти запитів
- Очікування:
  - За задумом не гарантується стабільність у CI (реальні мережі, реальні політики постачальників, квоти, збої)
  - Потребує коштів / витрачає ліміти запитів
  - Замість запуску «всього» бажано запускати звужені підмножини
- Запуски в реальному середовищі використовують уже експортовані ключі API та підготовлені профілі автентифікації.
- Типово запуски в реальному середовищі все одно ізолюють `HOME` і копіюють конфігурацію та матеріали автентифікації до тимчасової тестової домашньої директорії, щоб модульні фікстури не могли змінити вашу справжню `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб тести в реальному середовищі використовували вашу справжню домашню директорію.
- `pnpm test:live` типово працює в тихішому режимі: зберігає виведення перебігу `[live] ...` і приглушує журнали початкового завантаження Gateway та повідомлення Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете знову отримувати повні журнали запуску.
- Ротація ключів API (залежно від постачальника): установіть `*_API_KEYS` у форматі зі значеннями, розділеними комами або крапками з комою, чи `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для окремого запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби у відповідь на обмеження частоти запитів.
- Виведення перебігу/Heartbeat:
  - Набори тестів у реальному середовищі виводять рядки перебігу до stderr, щоб тривалі виклики постачальника залишалися помітно активними, навіть коли перехоплення консолі Vitest працює в тихому режимі.
  - `test/vitest/vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки перебігу постачальника/Gateway під час запусків у реальному середовищі передавалися негайно.
  - Налаштовуйте Heartbeat безпосередніх моделей за допомогою `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat Gateway/перевірок за допомогою `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір тестів слід запустити?

Скористайтеся цією таблицею рішень:

- Редагування логіки/тестів: запустіть `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Зміни мережевої взаємодії Gateway / протоколу WS / сполучення: додайте `pnpm test:e2e`
- Налагодження проблем «мій бот не працює» / збоїв, специфічних для постачальника / виклику інструментів: запустіть звужений `pnpm test:live`

## Тести в реальному середовищі (з мережевою взаємодією)

Для матриці моделей у реальному середовищі, базових перевірок бекендів CLI, базових перевірок ACP, середовища
Codex app-server і всіх тестів постачальників медіа в реальному середовищі (Deepgram, BytePlus, ComfyUI,
зображення, музика, відео, середовище медіа), а також обробки облікових даних для запусків у реальному середовищі

- див. [Тестування наборів у реальному середовищі](/uk/help/testing-live). Спеціальний контрольний список перевірки оновлень і
  плагінів див. у
  [Тестування оновлень і плагінів](/uk/help/testing-updates-plugins).

## Виконавці Docker (необов’язкові перевірки «працює в Linux»)

Ці виконавці Docker поділяються на дві категорії:

- Виконавці моделей у реальному середовищі: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний файл тестів у реальному середовищі з ключем профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), підключаючи вашу локальну директорію конфігурації, робочий простір і необов’язковий файл середовища профілю. Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Виконавці Docker у реальному середовищі за потреби зберігають власні практичні обмеження:
  `test:docker:live-models` типово використовує підготовлений підтримуваний набір із високою інформативністю, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Установіть `OPENCLAW_LIVE_MAX_MODELS`
  або змінні середовища Gateway, коли вам явно потрібне менше обмеження або ширше сканування.
- `test:docker:all` один раз збирає Docker-образ для запусків у реальному середовищі через `test:docker:live-build`, один раз пакує OpenClaw як tar-архів npm за допомогою `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ — це лише виконавець Node/Git для сценаріїв установлення/оновлення/залежностей плагінів; ці сценарії підключають попередньо зібраний tar-архів. Функціональний образ установлює той самий tar-архів до `/app` для сценаріїв перевірки функціональності зібраного застосунку. Визначення сценаріїв Docker містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Сукупний запуск використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а обмеження ресурсів не дають важким сценаріям реального середовища, установлення npm і багатосервісним сценаріям запускатися одночасно. Якщо окремий сценарій важчий за активні обмеження, планувальник усе одно може запустити його, коли пул порожній, а потім виконуватиме його окремо, доки ресурс знову не стане доступним. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (та інші перевизначення `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`) лише тоді, коли хост Docker має більший запас ресурсів. Виконавець типово проводить попередню перевірку Docker, видаляє застарілі контейнери OpenClaw E2E, виводить стан кожні 30 секунд, зберігає тривалість успішних сценаріїв у `.artifacts/docker-tests/lane-timings.json` і використовує ці дані, щоб у наступних запусках спочатку запускати триваліші сценарії. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести зважений маніфест сценаріїв без збирання або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб вивести план CI для вибраних сценаріїв, потреб у пакунках/образах і облікових даних.
- `Package Acceptance` — це нативна для GitHub перевірка пакунка на відповідність запитанню «чи працює цей придатний до встановлення tar-архів як продукт?». Вона визначає один пакет-кандидат із `source=npm`, `source=ref`, `source=url`, `source=trusted-url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає повторно використовувані сценарії Docker E2E для цього точного tar-архіву замість повторного пакування вибраного посилання. Профілі впорядковано за шириною охоплення: `smoke`, `package`, `product` і `full` (а також `custom` для явного списку сценаріїв). Договір пакунка/оновлення/плагіна, матрицю збереження працездатності після оновлення опублікованої версії, типові параметри випуску та діагностику збоїв див. у [Тестування оновлень і плагінів](/uk/help/testing-updates-plugins).
- Перевірки збирання та випуску запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Запобіжник обходить статичний зібраний граф від `dist/entry.js` і `dist/cli/run-main.js` та завершується помилкою, якщо цей граф початкового завантаження до диспетчеризації статично імпортує будь-який зовнішній пакет (Commander, інтерфейс запитів, undici, журналювання й подібні важкі для запуску залежності також враховуються) до диспетчеризації команди; він також обмежує розмір зібраного фрагмента запуску Gateway до 70 КБ і забороняє статичні імпорти відомих рідко використовуваних шляхів Gateway (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) із цього фрагмента. `scripts/release-check.ts` окремо виконує базову перевірку запакованого CLI за допомогою `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` і `models list --provider openai`.
- Підтримку сумісності зі старими версіями в Package Acceptance обмежено версією `2026.4.25` (включно з `2026.4.25-beta.*`). До цього граничного значення середовище допускає лише прогалини в метаданих випущених пакетів: відсутні приватні записи переліку QA, відсутній `gateway install --wrapper`, відсутні файли виправлень у git-фікстурі, створеній із tar-архіву, відсутній збережений `update.channel`, застарілі розташування записів установлення плагінів, відсутнє збереження записів установлення з каталогу та міграцію метаданих конфігурації під час `plugins update`. Для пакетів після `2026.4.25` ці випадки вважаються безумовними збоями.
- Виконавці базових перевірок контейнерів: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.
- Сценарії Docker/Bash E2E, які встановлюють запакований tar-архів OpenClaw за допомогою `scripts/lib/openclaw-e2e-instance.sh`, обмежують час виконання `npm install` значенням `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (типово `600s`; установіть `0`, щоб вимкнути обгортку для налагодження).

Виконавці Docker для моделей у реальному середовищі також монтують лише потрібні домашні директорії автентифікації CLI
(або всі підтримувані, якщо запуск не звужено), а потім копіюють їх до домашньої директорії
контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени,
не змінюючи сховище автентифікації хоста:

- Безпосередні моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Базова перевірка прив’язки ACP: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово охоплює Claude, Codex і Gemini, зі строгим охопленням Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Базова перевірка бекенду CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Базова перевірка середовища Codex app-server: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Базові перевірки спостережуваності: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` і `pnpm qa:observability:smoke` — це приватні сценарії QA для робочої копії вихідного коду. Їх навмисно не включено до Docker-сценаріїв випуску пакунка, оскільки tar-архів npm не містить QA Lab.
- Базова перевірка Open WebUI у реальному середовищі: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер початкового налаштування (TTY, повне створення структури): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Базова перевірка початкового налаштування/каналу/агента для tar-архіву npm: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tar-архів OpenClaw у Docker, налаштовує OpenAI через початкове налаштування з посиланням на змінну середовища, а також типово Telegram, запускає doctor і виконує один імітований цикл агента OpenAI. Повторно використовуйте попередньо зібраний tar-архів за допомогою `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть повторне збирання на хості за допомогою `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал за допомогою `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` чи `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Смоук-тест користувацького сценарію релізу: `pnpm test:docker:release-user-journey` глобально встановлює запакований tarball OpenClaw у чистому домашньому каталозі Docker, запускає початкове налаштування, налаштовує імітований провайдер OpenAI, виконує один хід агента, встановлює та видаляє зовнішні плагіни, налаштовує ClickClack для локальної тестової фікстури, перевіряє вихідні та вхідні повідомлення, перезапускає Gateway і запускає doctor.
- Смоук-тест типізованого початкового налаштування релізу: `pnpm test:docker:release-typed-onboarding` встановлює запакований tarball, керує `openclaw onboard` через справжній TTY, налаштовує OpenAI як провайдер із посиланням на змінну середовища, перевіряє, що необроблений ключ не зберігається, і виконує імітований хід агента.
- Смоук-тест медіа та пам’яті релізу: `pnpm test:docker:release-media-memory` встановлює запакований tarball, перевіряє розуміння зображення з вкладення PNG, результат генерації зображень, сумісної з OpenAI, відтворення результатів пошуку в пам’яті та їх збереження після перезапуску Gateway.
- Смоук-тест користувацького сценарію оновлення релізу: `pnpm test:docker:release-upgrade-user-journey` за замовчуванням встановлює найновішу опубліковану базову версію, старішу за tarball-кандидат, налаштовує стан провайдера, плагіна та ClickClack в опублікованому пакеті, оновлює його до tarball-кандидата, а потім повторно виконує основний сценарій агента, плагіна та каналу. Якщо старішої опублікованої базової версії немає, повторно використовується версія-кандидат. Базову версію можна перевизначити за допомогою `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Смоук-тест маркетплейсу плагінів релізу: `pnpm test:docker:release-plugin-marketplace` встановлює плагін із локальної тестової фікстури маркетплейсу, оновлює встановлений плагін, видаляє його та перевіряє, що CLI плагіна зникає, а метадані встановлення очищено.
- Смоук-тест установлення Skill: `pnpm test:docker:skill-install` глобально встановлює запакований tarball OpenClaw у Docker, вимикає в конфігурації встановлення завантажених архівів, знаходить через пошук поточний ідентифікатор активного Skill у ClawHub, встановлює його за допомогою `openclaw skills install` і перевіряє встановлений Skill, а також метадані походження та блокування `.clawhub`.
- Смоук-тест перемикання каналу оновлень: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з пакета `stable` на git-канал `dev`, перевіряє збережений канал і роботу плагіна після оновлення, потім повертається до пакета `stable` та перевіряє стан оновлення.
- Смоук-тест збереження стану після оновлення: `pnpm test:docker:upgrade-survivor` встановлює запакований tarball OpenClaw поверх забрудненої фікстури старого користувача з агентами, конфігурацією каналів, списками дозволених плагінів, застарілим станом залежностей плагінів і наявними файлами робочого простору та сеансу. Він запускає оновлення пакета й неінтерактивний doctor без активних ключів провайдера чи каналу, потім запускає Gateway через local loopback і перевіряє збереження конфігурації та стану, а також обмеження часу запуску й отримання стану.
- Смоук-тест збереження стану після оновлення опублікованої версії: `pnpm test:docker:published-upgrade-survivor` за замовчуванням встановлює `openclaw@latest`, створює реалістичні файли наявного користувача, налаштовує цю базову версію за допомогою вбудованого набору команд, перевіряє отриману конфігурацію, оновлює опубліковане встановлення до tarball-кандидата, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає Gateway через local loopback і перевіряє налаштовані наміри, збереження стану, запуск, `/healthz`, `/readyz` та часові обмеження стану RPC. Одну базову версію можна перевизначити за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`; агрегованому планувальнику можна доручити розгорнути точні локальні базові версії за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, а фікстури, побудовані за формою звітів про проблеми, — за допомогою `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, наприклад `reported-issues`; набір reported-issues містить `configured-plugin-installs` для автоматичного відновлення встановлення зовнішніх плагінів OpenClaw. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`, розпізнає метатокени базових версій на кшталт `last-stable-4` або `all-since-2026.4.23`, а Full Release Validation розгортає пакетний шлюз тривалого тестування релізу до `last-stable-4 2026.4.23 2026.5.2 2026.4.15` разом із `reported-issues`.
- Смоук-тест контексту середовища виконання сеансу: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого контексту середовища виконання в транскрипті, а також виправлення за допомогою doctor уражених дубльованих гілок перезапису підказок.
- Смоук-тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його за допомогою `bun install -g` в ізольованому домашньому каталозі та перевіряє, що `openclaw infer image providers --json` повертає вбудовані провайдери зображень замість зависання. Попередньо зібраний tarball можна повторно використати за допомогою `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустити збірку на хості за допомогою `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіювати `dist/` із зібраного образу Docker за допомогою `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Смоук-тест інсталятора в Docker: `bash scripts/test-install-sh-docker.sh` використовує один кеш npm спільно для контейнерів root, оновлення та прямого npm. Смоук-тест оновлення за замовчуванням використовує npm `latest` як стабільну базову версію перед оновленням до tarball-кандидата. Локально це можна перевизначити за допомогою `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, а на GitHub — за допомогою вхідного параметра `update_baseline_version` робочого процесу Install Smoke. Перевірки інсталятора без прав root використовують ізольований кеш npm, щоб записи кешу, власником яких є root, не приховували поведінку локального встановлення користувача. Задайте `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root, оновлення та прямого npm під час локальних повторних запусків.
- CI Install Smoke пропускає дубльоване глобальне оновлення через прямий npm за допомогою `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; якщо потрібне покриття прямого `npm install -g`, запускайте скрипт локально без цієї змінної середовища.
- Смоук-тест CLI видалення агентами спільного робочого простору: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає образ із кореневого Dockerfile, створює двох агентів з одним робочим простором в ізольованому домашньому каталозі контейнера, запускає `agents delete --json` і перевіряє коректний JSON та поведінку зі збереженим робочим простором. Образ install-smoke можна повторно використати за допомогою `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway і життєвий цикл хоста: `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`) зберігає смоук-тест автентифікації та працездатності WebSocket у локальній мережі між двома контейнерами, а потім використовує Admin HTTP через local loopback, щоб довести блокування під час підготовки, збереження доступу до керування, відновлення після поновлення та підготовлену зупинку й запуск у тому самому контейнері. Перевірка перезапуску має завершитися до закінчення початкової оренди; вона перевіряє, що стан призупинення є локальним для процесу, тоді як збережена конфігурація Gateway та ідентичність контейнера не втрачаються, і виводить машиночитний JSON із часом виконання етапів.
- Смоук-тест знімка Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний образ E2E та шар Chromium, запускає Chromium із необробленим CDP, виконує `browser doctor --deep` і перевіряє, що знімки ролей CDP охоплюють URL-адреси посилань, клікабельні елементи, підвищені до такого статусу завдяки курсору, посилання iframe та метадані фреймів.
- Регресійний тест мінімального обсягу міркувань для `web_search` в OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає імітований сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово спричиняє відхилення схемою провайдера й перевіряє, що необроблені подробиці з’являються в журналах Gateway.
- Міст каналів MCP (попередньо заповнений Gateway + міст stdio + смоук-тест необробленого кадру сповіщення Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP у наборі OpenClaw (справжній сервер MCP через stdio + смоук-тест дозволів і заборон у вбудованому профілі OpenClaw): `pnpm test:docker:agent-bundle-mcp-tools` (скрипт: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Очищення MCP для Cron і підагентів (справжній Gateway + завершення дочірнього процесу MCP через stdio після ізольованих запусків cron і одноразового запуску підагента): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Плагіни (смоук-тест встановлення й оновлення для локального шляху, `file:`, реєстру npm із піднятими залежностями, некоректних метаданих пакета npm, рухомих посилань git, комплексного пакета ClawHub, оновлень маркетплейсу, а також увімкнення й перевірки набору Claude): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Задайте `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте стандартну пару комплексного пакета та середовища виконання за допомогою `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний сервер тестової фікстури ClawHub.
- Смоук-тест оновлення плагіна без змін: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Смоук-тест матриці життєвого циклу плагіна: `pnpm test:docker:plugin-lifecycle-matrix` встановлює запакований tarball OpenClaw у порожньому контейнері, встановлює плагін npm, перемикає його ввімкнення та вимкнення, оновлює та відкочує його через локальний реєстр npm, видаляє встановлений код, а потім перевіряє, що видалення плагіна все одно прибирає застарілий стан, водночас записуючи показники RSS і CPU для кожного етапу життєвого циклу.
- Смоук-тест метаданих перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Плагіни: `pnpm test:docker:plugins` охоплює смоук-тест встановлення й оновлення для локального шляху, `file:`, реєстру npm із піднятими залежностями, рухомих посилань git, фікстур ClawHub, оновлень маркетплейсу, а також увімкнення й перевірки набору Claude. `pnpm test:docker:plugin-update` охоплює поведінку оновлення встановлених плагінів без змін. `pnpm test:docker:plugin-lifecycle-matrix` охоплює встановлення, увімкнення, вимкнення, оновлення, відкат і видалення плагіна npm з відсутнім кодом із відстеженням ресурсів.

Щоб вручну попередньо зібрати й повторно використовувати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення образів для окремих наборів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, якщо їх задано. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` указує на віддалений спільний образ, скрипти завантажують його, якщо він ще відсутній локально. Тести QR та інсталятора в Docker зберігають власні Dockerfile, оскільки вони перевіряють поведінку пакета й установлення, а не спільне середовище виконання зібраного застосунку.

Docker-запускачі з активними моделями також монтують поточний робочий каталог у режимі лише для читання
та переносять його до тимчасового робочого каталогу всередині контейнера. Це зберігає
образ середовища виконання компактним і водночас дає змогу запускати Vitest точно для вашого локального
вихідного коду та конфігурації. Етап перенесення пропускає великі кеші, що існують лише локально, і результати
збірки застосунків, як-от `.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також
локальні для застосунків каталоги результатів `.build` або Gradle, щоб активні запуски Docker не
витрачали хвилини на копіювання артефактів, специфічних для конкретної машини. Вони також задають
`OPENCLAW_SKIP_CHANNELS=1`, щоб активні перевірки Gateway не запускали справжні
обробники каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити активне покриття Gateway
у цьому Docker-напрямі.

`test:docker:openwebui` — це високорівнева перевірка сумісності: вона запускає
контейнер Gateway OpenClaw з увімкненими HTTP-кінцевими точками, сумісними з OpenAI,
запускає закріплену версію контейнера Open WebUI, підключеного до цього Gateway, виконує вхід
через Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
справжній запит чату через проксі `/api/chat/completions` Open WebUI. Установіть
`OPENWEBUI_SMOKE_MODE=models` для перевірок CI у процесі випуску, які мають завершуватися
після входу в Open WebUI та виявлення моделі, не очікуючи на завершення відповіді моделі
в реальному середовищі. Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися
завантажити образ Open WebUI, а Open WebUI — завершити власне
налаштування холодного запуску. Цей напрям перевірок очікує придатний для використання ключ моделі в реальному середовищі, наданий через
середовище процесу, підготовлені профілі автентифікації або явно вказаний
`OPENCLAW_PROFILE_FILE`. Успішні запуски виводять невелике корисне навантаження JSON на кшталт
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` навмисно є детермінованим і не потребує
справжнього облікового запису Telegram, Discord або iMessage. Він запускає контейнер Gateway
із початковими даними, запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання стенограм, метадані
вкладень, поведінку черги подій у реальному часі, маршрутизацію вихідного надсилання та сповіщення
про канали й дозволи в стилі Claude через справжній stdio-міст MCP. Перевірка
сповіщень безпосередньо аналізує необроблені кадри stdio MCP, тому ця перевірка
валідує те, що фактично видає міст, а не лише те, що випадково надає
конкретний клієнтський SDK.

`test:docker:agent-bundle-mcp-tools` є детермінованим і не потребує
ключа моделі в реальному середовищі. Він збирає Docker-образ репозиторію, запускає справжній stdio-сервер
зондування MCP усередині контейнера, матеріалізує цей сервер через
вбудоване середовище виконання MCP комплекту OpenClaw, виконує інструмент, а потім перевіряє, що
`coding` і `messaging` зберігають інструменти `bundle-mcp`, тоді як `minimal` і
`tools.deny: ["bundle-mcp"]` відфільтровують їх.

`test:docker:cron-mcp-cleanup` є детермінованим і не потребує ключа моделі
в реальному середовищі. Він запускає Gateway із початковими даними та справжнім stdio-сервером зондування MCP,
виконує ізольований прохід cron і одноразовий дочірній прохід `sessions_spawn`, а потім
перевіряє, що дочірній процес MCP завершується після кожного запуску.

Ручна перевірка потоку ACP звичайною мовою (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей сценарій для робочих процесів регресійного тестування й налагодження. Він може знову знадобитися для валідації маршрутизації потоків ACP, тому не видаляйте його.

Корисні змінні середовища:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` монтується та завантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` — перевіряти лише змінні середовища, завантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги конфігурації/робочого простору й без зовнішніх монтувань автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`, якщо запуск уже не використовує каталог прив’язки CI/керованого середовища) монтується до `/home/node/.npm-global` для кешованих установлень CLI усередині Docker
- Зовнішні каталоги/файли автентифікації CLI у `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед початком тестів
  - Типові каталоги (використовуються, коли запуск не звужено до конкретних постачальників): `.factory`, `.gemini`, `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Запуски, звужені до постачальника, монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` — звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` — фільтрувати постачальників усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1` — повторно використати наявний образ `openclaw:local-live` для повторних запусків, які не потребують перебудови
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` — гарантувати, що облікові дані надходять зі сховища профілів (а не із середовища)
- `OPENCLAW_OPENWEBUI_MODEL=...` — вибрати модель, яку Gateway надає для перевірки Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` — перевизначити запит перевірки одноразового значення, який використовує перевірка Open WebUI
- `OPENWEBUI_IMAGE=...` — перевизначити закріплений тег образу Open WebUI

## Базова перевірка документації

Запускайте перевірки документації після її редагування: `pnpm check:docs`.
Запускайте повну валідацію якорів Mintlify, коли також потрібно перевірити заголовки всередині сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресійні перевірки «справжнього конвеєра» без справжніх постачальників:

- Виклик інструментів Gateway (імітація OpenAI, справжній Gateway + цикл агента): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує конфігурацію + примусово застосовує автентифікацію): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Імітований виклик інструментів через справжній Gateway + цикл агента (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють з’єднання сеансів і вплив конфігурації (`src/gateway/gateway.test.ts`).

Чого досі бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Ухвалення рішень:** коли Skills перелічені в запиті, чи вибирає агент правильну Skills (або уникає нерелевантних)?
- **Дотримання вимог:** чи читає агент `SKILL.md` перед використанням і чи виконує обов’язкові кроки/аргументи?
- **Контракти робочих процесів:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сеансу та межі ізольованого середовища.

Майбутні оцінювання насамперед мають залишатися детермінованими:

- Засіб запуску сценаріїв з імітованими постачальниками для перевірки викликів інструментів і їхнього порядку, читання файлів Skills та з’єднання сеансів.
- Невеликий набір сценаріїв, зосереджених на Skills (використовувати чи уникати, обмеження, ін’єкція запитів).
- Необов’язкові оцінювання в реальному середовищі (за згодою, обмежені змінними середовища) лише після впровадження безпечного для CI набору.

## Контрактні тести (структура plugin і каналу)

Контрактні тести перевіряють, що кожен зареєстрований plugin і канал відповідає
своєму контракту інтерфейсу. Вони перебирають усі виявлені plugins і запускають
набір перевірок структури та поведінки. Типовий модульний напрям `pnpm test`
навмисно пропускає ці спільні файли стиків і перевірок; запускайте контрактні
команди явно, коли змінюєте спільні поверхні каналу або постачальника.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти каналів: `pnpm test:contracts:channels`
- Лише контракти постачальників: `pnpm test:contracts:plugins`

### Контракти каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`. Поточні
категорії верхнього рівня:

- **каталог каналів** - метадані записів каталогу вбудованих/реєстрових каналів
- **plugin** (на основі реєстру, розподілений) - базова структура реєстрації plugin
- **лише поверхні** (на основі реєстру, розподілений) - перевірки структури окремих поверхонь для `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` і `gateway`
- **прив’язування сеансу** (на основі реєстру) - поведінка прив’язування сеансу
- **вихідне корисне навантаження** - структура та нормалізація корисного навантаження повідомлення
- **групова політика** (резервна) - застосування типової групової політики для кожного каналу
- **потоки** (на основі реєстру, розподілений) - обробка ідентифікатора потоку
- **каталог** (на основі реєстру, розподілений) - API каталогу/списку учасників
- **реєстр** і **ядро plugins.\*** - реєстр plugins каналів, завантажувач і внутрішні механізми авторизації запису конфігурації

Допоміжні засоби середовища тестування для перехоплення вхідної диспетчеризації та вихідного корисного навантаження, які використовують ці
набори, надаються внутрішньо через `src/plugin-sdk/channel-contract-testing.ts`
(виключено з npm, не є публічним підшляхом SDK); окремого файлу
`inbound.contract.test.ts` у цьому каталозі немає.

### Контракти постачальників

Розташовані в `src/plugins/contracts/*.contract.test.ts`. Поточні категорії
включають:

- **структура** - структура маніфесту plugin, API та експорту середовища виконання
- **реєстрація plugin** (+ паралельна) - випадки реєстрації маніфесту
- **маніфест пакета** - вимоги до маніфесту пакета
- **завантажувач** - поведінка налаштування/завершення роботи завантажувача plugin
- **реєстр** - вміст і пошук у реєстрі контрактів plugin
- **постачальники** - спільна поведінка вбудованих постачальників, а також постачальників вебпошуку
- **вибір автентифікації** - метадані вибору автентифікації та поведінка налаштування
- **застарівання каталогу постачальників** - метадані застарілих каталогів постачальників
- **визначення вибору майстра**, **вибір моделі майстра**, **параметри налаштування майстра** - контракти майстра налаштування постачальника
- **постачальник вбудовувань**, **постачальник вбудовувань пам’яті**, **постачальник веботримання**, **перетворення тексту на мовлення** - контракти постачальників для окремих можливостей
- **дії сеансу**, **вкладення сеансу**, **проєкція запису сеансу** - контракти стану сеансу, якими володіє plugin
- **заплановані проходи** - метадані запланованого проходу plugin і межі позначок часу
- **хуки хоста**, **життєвий цикл контексту запуску**, **побічні ефекти імпорту середовища виконання**, **стики середовища виконання** - контракти життєвого циклу хоста/середовища виконання plugin і меж імпорту
- **залежності середовища виконання розширень** - розміщення залежностей середовища виконання для розширень

### Коли запускати

- Після зміни експортів або підшляхів plugin-sdk
- Після додавання або зміни plugin каналу чи постачальника
- Після рефакторингу реєстрації або виявлення plugins

Контрактні тести виконуються в CI й не потребують справжніх ключів API.

## Додавання регресійних тестів (рекомендації)

Коли ви виправляєте проблему постачальника/моделі, виявлену в реальному середовищі:

- За можливості додайте безпечний для CI регресійний тест (імітація/заглушка постачальника або фіксація точного перетворення структури запиту)
- Якщо проблема за своєю природою проявляється лише в реальному середовищі (обмеження частоти, політики автентифікації), залишайте тест у реальному середовищі вузьким і вмикайте його лише через змінні середовища
- Віддавайте перевагу найменшому рівню, який виявляє помилку:
  - помилка перетворення/повторного відтворення запиту постачальника -> прямий тест моделей
  - помилка конвеєра сеансу/історії/інструментів Gateway -> перевірка Gateway у реальному середовищі або безпечний для CI імітований тест Gateway
- Захисний механізм обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` визначає одну вибіркову ціль для кожного класу SecretRef із метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що ідентифікатори виконання із сегментами обходу відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується невдало для некласифікованих ідентифікаторів цілей, щоб нові класи не можна було непомітно пропустити.

## Пов’язане

- [Тестування в реальному середовищі](/uk/help/testing-live)
- [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
