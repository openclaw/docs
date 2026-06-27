---
read_when:
    - Новий інсталяційний запуск, зависання під час онбордингу або помилки першого запуску
    - Вибір автентифікації та підписок провайдерів
    - Не вдається отримати доступ до docs.openclaw.ai, не вдається відкрити панель керування, встановлення зависло
sidebarTitle: First-run FAQ
summary: 'FAQ: швидкий старт і налаштування першого запуску — встановлення, onboarding, автентифікація, підписки, початкові збої'
title: 'FAQ: налаштування першого запуску'
x-i18n:
    generated_at: "2026-06-27T17:38:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 182022cc91cea7ec4857aeb222fe1d001a1476a90c221f610616cc7da7ba8a98
    source_path: help/faq-first-run.md
    workflow: 16
---

  Питання й відповіді для швидкого старту та першого запуску. Для щоденних операцій, моделей, автентифікації, сеансів
  і усунення несправностей див. основний [FAQ](/uk/help/faq).

  ## Швидкий старт і налаштування першого запуску

  <AccordionGroup>
  <Accordion title="Я застряг, найшвидший спосіб розблокуватися">
    Використайте локального AI-агента, який може **бачити вашу машину**. Це значно ефективніше, ніж питати
    в Discord, бо більшість випадків "я застряг" — це **локальні проблеми конфігурації або середовища**, які
    віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти журнали й допомагати виправляти
    налаштування на рівні машини (PATH, сервіси, дозволи, файли автентифікації). Надайте їм **повний checkout вихідного коду** через
    hackable (git) install:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **з git checkout**, тож агент може читати код і документацію та
    міркувати про точну версію, яку ви запускаєте. Ви завжди можете пізніше повернутися до stable,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати й супроводжувати** виправлення (крок за кроком), а потім виконати лише
    необхідні команди. Так зміни будуть малими й простішими для аудиту.

    Якщо ви виявили справжній баг або виправлення, створіть issue на GitHub або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (діліться виводом, коли просите допомоги):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану gateway/агента + базова конфігурація.
    - `openclaw models status`: перевіряє автентифікацію провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє й виправляє типові проблеми конфігурації/стану.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламано](/uk/help/faq#first-60-seconds-if-something-is-broken).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску Heartbeat:

    - `quiet-hours`: поза налаштованим вікном активних годин
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожні рядки, коментарі, заголовки, огорожі або заготовку порожнього checklist
    - `no-tasks-due`: режим задач `HEARTBEAT.md` активний, але інтервали жодної задачі ще не настали
    - `alerts-disabled`: уся видимість Heartbeat вимкнена (`showOk`, `showAlerts` і `useIndicator` вимкнені)

    У режимі задач часові мітки виконання просуваються лише після завершення реального запуску Heartbeat.
    Пропущені запуски не позначають задачі як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановити й налаштувати OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати UI-ресурси. Після onboarding ви зазвичай запускаєте Gateway на порту **18789**.

    З вихідного коду (для контриб’юторів/розробників):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Якщо у вас ще немає глобального встановлення, запустіть це через `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Як відкрити панель керування після onboarding?">
    Майстер відкриває браузер із чистою (без токена в URL) адресою панелі керування одразу після onboarding, а також друкує посилання в підсумку. Залиште цю вкладку відкритою; якщо вона не запустилася, скопіюйте/вставте надрукований URL на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати панель керування на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується автентифікація зі спільним секретом, вставте налаштований токен або пароль у налаштування Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо спільний секрет ще не налаштовано, згенеруйте токен за допомогою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште прив’язку до loopback, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставлення спільного секрету, за умови довіреного хоста gateway); HTTP API все одно потребують автентифікації зі спільним секретом, якщо ви навмисно не використовуєте private-ingress `none` або HTTP-автентифікацію trusted-proxy.
      Невдалі паралельні спроби автентифікації Serve від того самого клієнта серіалізуються до того, як лімітатор невдалої автентифікації їх запише, тому друга невдала повторна спроба вже може показати `retry later`.
    - **Прив’язка до tailnet**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, потім вставте відповідний спільний секрет у налаштування панелі керування.
    - **Reverse proxy з урахуванням ідентичності**: тримайте Gateway за довіреним proxy, налаштуйте `gateway.auth.mode: "trusted-proxy"`, потім відкрийте URL proxy. Loopback proxy на тому самому хості потребують явного `gateway.auth.trustedProxy.allowLoopback = true`.
    - **SSH-тунель**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`. Автентифікація зі спільним секретом усе одно застосовується через тунель; вставте налаштований токен або пароль, якщо буде запит.

    Див. [Панель керування](/uk/web/dashboard) і [Вебповерхні](/uk/web) для режимів bind і подробиць автентифікації.

  </Accordion>

  <Accordion title="Чому є дві конфігурації погодження exec для погоджень у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити погодження до чат-призначень
    - `channels.<channel>.execApprovals`: змушує цей канал діяти як нативний клієнт погоджень для погоджень exec

    Політика exec хоста все ще є справжнім шлюзом погодження. Конфігурація чату лише керує тим, де
    з’являються запити погодження і як люди можуть на них відповідати.

    У більшості налаштувань вам **не** потрібні обидва:

    - Якщо чат уже підтримує команди й відповіді, same-chat `/approve` працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначати approvers, OpenClaw тепер автоматично вмикає DM-first нативні погодження, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні нативні картки/кнопки погодження, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve` лише якщо результат інструмента каже, що погодження в чаті недоступні або ручне погодження є єдиним шляхом.
    - Використовуйте `approvals.exec` лише коли запити також потрібно пересилати до інших чатів або явних ops-кімнат.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише коли ви явно хочете, щоб запити погодження публікувалися назад у початкову кімнату/тему.
    - Погодження Plugin знову окремі: вони використовують same-chat `/approve` за замовчуванням, опційне пересилання `approvals.plugin`, і лише деякі нативні канали зберігають plugin-approval-native обробку поверх цього.

    Коротко: пересилання відповідає за маршрутизацію, а конфігурація нативного клієнта — за багатший UX, специфічний для каналу.
    Див. [Погодження Exec](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Який runtime потрібен?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендовано** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легкий — документація вказує **512MB-1GB RAM**, **1 ядро** і приблизно **500MB**
    диска як достатні для особистого використання, а також зазначає, що **Raspberry Pi 4 може його запускати**.

    Якщо потрібен додатковий запас (журнали, медіа, інші сервіси), **рекомендовано 2GB**, але це
    не жорсткий мінімум.

    Порада: невеликий Raspberry Pi/VPS може хостити Gateway, а ви можете під’єднати **вузли** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Вузли](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради для встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте шорстких країв.

    - Використовуйте **64-bit** OS і тримайте Node >= 22.
    - Надавайте перевагу **hackable (git) install**, щоб бачити журнали й швидко оновлюватися.
    - Почніть без каналів/Skills, потім додавайте їх по одному.
    - Якщо натрапите на дивні проблеми з binary, зазвичай це проблема **ARM-сумісності**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Застрягло на wake up my friend / onboarding не вилуплюється. Що тепер?">
    Цей екран залежить від того, чи Gateway доступний і автентифікований. TUI також автоматично надсилає
    "Wake up, my friend!" під час першого hatch. Якщо ви бачите цей рядок **без відповіді**,
    а токени залишаються на 0, агент ніколи не запускався.

    1. Перезапустіть Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Перевірте статус + автентифікацію:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Якщо все ще зависає, запустіть:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що tunnel/Tailscale з’єднання активне і що UI
    спрямований на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini), не повторюючи onboarding?">
    Так. Скопіюйте **каталог стану** і **workspace**, потім один раз запустіть Doctor. Це
    зберігає вашого бота "точно таким самим" (пам’ять, історію сеансів, автентифікацію та стан каналів),
    якщо ви скопіюєте **обидві** локації:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (за замовчуванням: `~/.openclaw`) зі старої машини.
    3. Скопіюйте свій workspace (за замовчуванням: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть сервіс Gateway.

    Це зберігає конфігурацію, профілі автентифікації, облікові дані WhatsApp, сеанси й пам’ять. Якщо ви в
    віддаленому режимі, пам’ятайте, що gateway host володіє сховищем сеансів і workspace.

    **Важливо:** якщо ви лише commit/push свій workspace на GitHub, ви створюєте резервну копію
    **пам’яті + bootstrap-файлів**, але **не** історії сеансів або автентифікації. Вони живуть
    у `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язано: [Міграція](/uk/install/migrating), [Де все зберігається на диску](/uk/help/faq#where-things-live-on-disk),
    [Workspace агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи розташовані вгорі. Якщо верхній розділ позначено **Unreleased**, наступний датований
    розділ є останньою випущеною версією. Записи згруповано за **Highlights**, **Changes** і
    **Fixes** (плюс розділи документації/іншого, коли потрібно).

  </Accordion>

  <Accordion title="Немає доступу до docs.openclaw.ai (помилка SSL)">
    Деякі підключення Comcast/Xfinity неправильно блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть це або додайте `docs.openclaw.ai` до allowlist, потім повторіть спробу.
    Допоможіть нам розблокувати це, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документацію продубльовано на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай стабільний реліз спочатку потрапляє в **beta**, а потім явний
    крок просування переносить ту саму версію в `latest`. Мейнтейнери також можуть
    публікувати безпосередньо в `latest`, коли це потрібно. Саме тому beta і stable можуть
    вказувати на **ту саму версію** після просування.

    Перегляньте, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди встановлення та різницю між beta і dev див. в акордеоні нижче.

  </Accordion>

  <Accordion title="Як установити beta-версію і яка різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (може збігатися з `latest` після просування).
    **Dev** — це рухома верхівка `main` (git); після публікації вона використовує npm dist-tag `dev`.

    Однорядкові команди (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Інсталятор для Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Докладніше: [Канали розробки](/uk/install/development-channels) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як спробувати найсвіжіші компоненти?">
    Два варіанти:

    1. **Канал dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає на гілку `main` і оновлює з вихідного коду.

    2. **Встановлення з можливістю редагування (із сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає вам локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо ви віддаєте перевагу чистому клонуванню вручну, використайте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Оновлення](/uk/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай тривають встановлення й онбординг?">
    Орієнтовно:

    - **Встановлення:** 2-5 хвилин
    - **Онбординг:** 5-15 хвилин залежно від того, скільки каналів/моделей ви налаштовуєте

    Якщо процес зависає, скористайтеся [Інсталятор завис](#quick-start-and-first-run-setup)
    і швидким циклом налагодження в [Я застряг](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Інсталятор завис? Як отримати більше відгуку?">
    Перезапустіть інсталятор із **докладним виводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Встановлення beta з докладним виводом:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Для встановлення з можливістю редагування (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Еквівалент для Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Додаткові параметри: [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Встановлення у Windows повідомляє, що git не знайдено або openclaw не розпізнано">
    Дві поширені проблеми у Windows:

    **1) помилка npm spawn git / git не знайдено**

    - Установіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, потім повторно запустіть інсталятор.

    **2) openclaw не розпізнається після встановлення**

    - Ваш глобальний bin-каталог npm не додано до PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до PATH користувача (у Windows суфікс `\bin` не потрібен; у більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Для налаштування робочого столу використовуйте нативний застосунок **Windows Hub**. Для налаштування
    лише через термінал підтримуються як інсталятор PowerShell, так і шляхи WSL2 Gateway.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="Вивід exec у Windows показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність кодової сторінки консолі в нативних оболонках Windows.

    Симптоми:

    - вивід `system.run`/`exec` відображає китайський текст як mojibake
    - та сама команда виглядає нормально в іншому профілі термінала

    Швидкий обхідний шлях у PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Потім перезапустіть Gateway і повторіть команду:

    ```powershell
    openclaw gateway restart
    ```

    Якщо це все ще відтворюється в найновішій версії OpenClaw, відстежуйте/повідомте про це тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використайте **встановлення з можливістю редагування (git)**, щоб мати повний вихідний код і документацію локально, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг прочитати репозиторій і відповісти точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як установити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтеся посібника для Linux, потім запустіть онбординг.

    - Швидкий шлях для Linux + встановлення служби: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення й оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як установити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Установіть на сервері, а потім використовуйте SSH/Tailscale, щоб під’єднатися до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де посібники зі встановлення в хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з поширеними провайдерами. Виберіть один і дотримуйтеся посібника:

    - [VPS-хостинг](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте доступ до нього
    з ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан + робочий простір
    зберігаються на сервері, тож вважайте хост джерелом істини й створюйте його резервні копії.

    Ви можете спарювати **вузли** (Mac/iOS/Android/headless) із цим хмарним Gateway, щоб отримувати доступ
    до локального екрана/камери/полотна або запускати команди на ноутбуці, залишаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Вузли: [Вузли](/uk/nodes), [CLI вузлів](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можна попросити OpenClaw оновити сам себе?">
    Коротка відповідь: **можливо, не рекомендовано**. Потік оновлення може перезапустити
    Gateway (що скидає активний сеанс), може потребувати чистого git checkout і
    може запитати підтвердження. Безпечніше: запускайте оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо потрібно автоматизувати з агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Оновлення](/uk/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить онбординг?">
    `openclaw onboard` — рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/автентифікації** (OAuth провайдера, API-ключі, Anthropic setup-token, а також параметри локальних моделей, як-от LM Studio)
    - Розташування **робочого простору** + початкові файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані Plugin каналів, як-от QQ Bot)
    - **Встановлення демона** (LaunchAgent на macOS; systemd user unit на Linux/WSL2)
    - **Перевірки справності** і вибір **skills**

    Він також попереджає, якщо ваша налаштована модель невідома або для неї бракує автентифікації.

  </Accordion>

  <Accordion title="Чи потрібна підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації в цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **API-ключ Anthropic**: звичайний білінг Anthropic API
    - **Claude CLI / автентифікація підписки Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що це використання знову дозволене, і OpenClaw вважає використання `claude -p`
      санкціонованим для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів Gateway API-ключі Anthropic усе ще є
    передбачуванішим налаштуванням. OpenAI Codex OAuth явно підтримується для зовнішніх
    інструментів, як-от OpenClaw.

    OpenClaw також підтримує інші розміщені варіанти у стилі підписки, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [Z.AI (GLM)](/uk/providers/zai),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можна використовувати підписку Claude Max без API-ключа?">
    Так.

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому
    OpenClaw вважає автентифікацію підписки Claude і використання `claude -p` санкціонованими
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо вам потрібне
    найбільш передбачуване серверне налаштування, натомість використовуйте API-ключ Anthropic.

  </Accordion>

  <Accordion title="Чи підтримується автентифікація підписки Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що це використання знову дозволене, тому OpenClaw вважає
    повторне використання Claude CLI і використання `claude -p` санкціонованими для цієї інтеграції
    якщо Anthropic не опублікує нову політику.

    Anthropic setup-token усе ще доступний як підтримуваний шлях токена OpenClaw, але OpenClaw тепер віддає перевагу повторному використанню Claude CLI і `claude -p`, коли це доступно.
    Для production або багатокористувацьких навантажень автентифікація API-ключем Anthropic усе ще є
    безпечнішим і передбачуванішим вибором. Якщо вам потрібні інші розміщені
    варіанти у стилі підписки в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
    Це означає, що ваша **квота/ліміт частоти Anthropic** вичерпана для поточного вікна. Якщо ви
    використовуєте **Claude CLI**, зачекайте, доки вікно скинеться, або оновіть свій план. Якщо ви
    використовуєте **API-ключ Anthropic**, перевірте Anthropic Console
    щодо використання/білінгу й за потреби підвищте ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, запит намагається використати
    контекстне вікно Anthropic на 1 млн токенів (GA-сумісну модель Claude 4.x на 1 млн або застарілу
    конфігурацію `context1m: true`). Це працює лише тоді, коли ваші облікові дані придатні
    для тарифікації довгого контексту (тарифікація API-ключа або шлях входу OpenClaw через Claude
    з увімкненим Extra Usage).

    Порада: задайте **резервну модель**, щоб OpenClaw міг продовжувати відповідати, коли провайдер обмежений лімітом швидкості.
    Див. [Моделі](/uk/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудованого провайдера **Amazon Bedrock (Converse)**. Якщо наявні маркери середовища AWS, OpenClaw може автоматично виявити потоковий/текстовий каталог Bedrock і об’єднати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис провайдера вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний проксі перед Bedrock також залишається чинним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід ChatGPT). Використовуйте
    `openai/gpt-5.5` для типової схеми: автентифікація за підпискою ChatGPT/Codex плюс
    нативне виконання сервером застосунку Codex. Застарілі посилання Codex GPT є
    застарілою конфігурацією, яку виправляє `openclaw doctor --fix`. Прямий доступ
    за API-ключем OpenAI залишається доступним для неагентних поверхонь OpenAI API і для агентних
    моделей через упорядкований профіль API-ключа `openai`.
    Див. [Провайдери моделей](/uk/concepts/model-providers) і [Початкове налаштування (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому OpenClaw досі згадує застарілий префікс OpenAI Codex?">
    `openai` — це ідентифікатор провайдера та профілю автентифікації як для API-ключів OpenAI, так і для
    OAuth ChatGPT/Codex. Ви все ще можете бачити застарілий префікс OpenAI Codex у застарілій конфігурації та
    попередженнях міграції.
    Старіші конфігурації також використовували його як префікс моделі:

    - `openai/gpt-5.5` = автентифікація за підпискою ChatGPT/Codex із нативним середовищем виконання Codex для ходів агента
    - застаріле посилання Codex GPT-5.5 = застарілий маршрут моделі, який виправляє `openclaw doctor --fix`
    - `openai/gpt-5.5` плюс упорядкований профіль API-ключа `openai` = автентифікація API-ключем для агентної моделі OpenAI
    - застарілі ідентифікатори профілю автентифікації Codex = застарілий ідентифікатор профілю автентифікації, який мігрує `openclaw doctor --fix`

    Якщо вам потрібен прямий шлях тарифікації/лімітів OpenAI Platform, задайте
    `OPENAI_API_KEY`. Якщо вам потрібна автентифікація за підпискою ChatGPT/Codex, увійдіть через
    `openclaw models auth login --provider openai`. Залиште посилання моделі як
    `openai/gpt-5.5`; застарілі посилання моделей Codex є застарілою конфігурацією, яку
    `openclaw doctor --fix` переписує.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT у вебі?">
    Codex OAuth використовує керовані OpenAI вікна квот, що залежать від плану. На практиці
    ці ліміти можуть відрізнятися від досвіду використання вебсайту/застосунку ChatGPT, навіть коли
    обидва прив’язані до того самого облікового запису.

    OpenClaw може показати поточні видимі вікна використання/квот провайдера в
    `openclaw models status`, але він не вигадує й не нормалізує права ChatGPT у вебі
    в прямий доступ до API. Якщо вам потрібен прямий шлях тарифікації/лімітів OpenAI Platform,
    використовуйте `openai/*` з API-ключем.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію за підпискою OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth за підпискою OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання OAuth за підпискою у зовнішніх інструментах/робочих процесах
    на кшталт OpenClaw. Початкове налаштування може виконати потік OAuth за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Початкове налаштування (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **потік автентифікації Plugin**, а не ідентифікатор клієнта чи секрет у `openclaw.json`.

    Кроки:

    1. Установіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Типова модель після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не виконуються, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway

    Це зберігає токени OAuth у профілях автентифікації на хості Gateway. Докладно: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для звичайних чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту й сильної безпеки; малі карти обрізають контекст і допускають витоки. Якщо мусите, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантовані моделі збільшують ризик ін’єкції підказок - див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як утримувати трафік розміщених моделей у конкретному регіоні?">
    Вибирайте кінцеві точки, прив’язані до регіону. OpenRouter надає варіанти, розміщені у США, для MiniMax, Kimi та GLM; виберіть варіант, розміщений у США, щоб дані залишалися в регіоні. Ви все ще можете додати Anthropic/OpenAI поряд із ними, використовуючи `models.mode: "merge"`, щоб резервні варіанти залишалися доступними з дотриманням вибраного регіонального провайдера.
  </Accordion>

  <Accordion title="Чи потрібно купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini необов’язковий - деякі люди
    купують його як постійно ввімкнений хост, але невеликий VPS, домашній сервер або пристрій класу Raspberry Pi теж підходить.

    Mac потрібен лише **для інструментів, доступних тільки на macOS**. Для iMessage використовуйте [iMessage](/uk/channels/imessage) з `imsg` на будь-якому Mac, де виконано вхід у Messages. Якщо Gateway працює на Linux або деінде, задайте `channels.imessage.cliPath` як SSH-обгортку, що запускає `imsg` на цьому Mac. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або під’єднайте вузол macOS.

    Документація: [iMessage](/uk/channels/imessage), [Вузли](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, де виконано вхід у Messages. Це **не** обов’язково має бути Mac mini -
    підійде будь-який Mac. **Використовуйте [iMessage](/uk/channels/imessage)** з `imsg`; Gateway може працювати на цьому Mac або може працювати деінде з SSH-обгорткою `cliPath`.

    Поширені схеми:

    - Запустіть Gateway на Linux/VPS і задайте `channels.imessage.cliPath` як SSH-обгортку, що запускає `imsg` на Mac, де виконано вхід у Messages.
    - Запустіть усе на Mac, якщо хочете найпростішу схему з однією машиною.

    Документація: [iMessage](/uk/channels/imessage), [Вузли](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи можу під’єднати його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може під’єднатися як
    **вузол** (супровідний пристрій). Вузли не запускають Gateway - вони надають додаткові
    можливості, як-от екран/камера/полотно та `system.run` на цьому пристрої.

    Поширений шаблон:

    - Gateway на Mac mini (постійно ввімкнений).
    - MacBook Pro запускає застосунок macOS або хост вузла й поєднується з Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Вузли](/uk/nodes), [CLI вузлів](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можна використовувати Bun?">
    Bun **не рекомендується**. Ми бачимо помилки середовища виконання, особливо з WhatsApp і Telegram.
    Використовуйте **Node** для стабільних Gateway.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на невиробничому Gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **ідентифікатор користувача Telegram людини-відправника** (числовий). Це не ім’я користувача бота.

    Налаштування запитує лише числові ідентифікатори користувачів. Якщо у вас уже є застарілі записи `@username` у конфігурації, `openclaw doctor --fix` може спробувати їх розпізнати.

    Безпечніше (без стороннього бота):

    - Надішліть DM своєму боту, потім запустіть `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Надішліть DM своєму боту, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватний):

    - Надішліть DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними інстансами OpenClaw?">
    Так, через **маршрутизацію кількох агентів**. Прив’яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, відправник E.164 на кшталт `+15551234567`) до іншого `agentId`, щоб кожна людина отримала власний робочий простір і сховище сеансів. Відповіді все одно надходитимуть з **того самого облікового запису WhatsApp**, а контроль доступу DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Див. [Маршрутизація кількох агентів](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента "швидкого чату" й агента "Opus для кодування"?'>
    Так. Використовуйте маршрутизацію кількох агентів: задайте кожному агенту власну типову модель, а потім прив’яжіть вхідні маршрути (обліковий запис провайдера або конкретні peers) до кожного агента. Приклад конфігурації є в [Маршрутизація кількох агентів](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, розпізнавалися в оболонках без входу.
    Останні збірки також додають на початок поширені користувацькі каталоги bin у сервісах Linux systemd (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, коли їх задано.

  </Accordion>

  <Accordion title="Різниця між встановленням через git для редагування та встановленням через npm">
    - **Встановлення для редагування (git):** повний checkout вихідного коду, придатний до редагування, найкращий для контриб’юторів.
      Ви запускаєте збірки локально й можете виправляти код/документацію.
    - **Встановлення npm:** глобальне встановлення CLI, без репозиторію, найкраще для «просто запустити».
      Оновлення надходять із dist-tags npm.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між встановленнями npm і git?">
    Так. Використовуйте `openclaw update --channel ...`, коли OpenClaw уже встановлено.
    Це **не видаляє ваші дані** - це лише змінює встановлення коду OpenClaw.
    Ваш стан (`~/.openclaw`) і робочий простір (`~/.openclaw/workspace`) залишаються недоторканими.

    З npm на git:

    ```bash
    openclaw update --channel dev
    ```

    З git на npm:

    ```bash
    openclaw update --channel stable
    ```

    Додайте `--dry-run`, щоб спочатку переглянути заплановане перемикання режиму. Оновлювач запускає
    наступні дії Doctor, оновлює джерела Plugin для цільового каналу та
    перезапускає Gateway, якщо ви не передасте `--no-restart`.

    Інсталятор також може примусово вибрати будь-який режим:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](/uk/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібен
    найнижчий поріг входу й вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Переваги:** немає витрат на сервер, прямий доступ до локальних файлів, видиме вікно браузера.
    - **Недоліки:** сон/збої мережі = роз’єднання, оновлення ОС/перезавантаження переривають роботу, пристрій має не засинати.

    **VPS / хмара**

    - **Переваги:** завжди ввімкнено, стабільна мережа, немає проблем зі сном ноутбука, простіше підтримувати роботу.
    - **Недоліки:** часто працює без екрана (використовуйте знімки екрана), лише віддалений доступ до файлів, для оновлень потрібно підключатися через SSH.

    **Примітка щодо OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord чудово працюють із VPS. Єдиний реальний компроміс — **браузер без графічного інтерфейсу** проти видимого вікна. Див. [Браузер](/uk/tools/browser).

    **Рекомендовано за замовчуванням:** VPS, якщо раніше у вас були роз’єднання Gateway. Локальний запуск чудово підходить, коли ви активно користуєтеся Mac і хочете доступ до локальних файлів або автоматизацію UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на виділеній машині?">
    Не обов’язково, але **рекомендовано для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Raspberry Pi):** завжди ввімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, простіше підтримувати роботу.
    - **Спільний ноутбук/настільний комп’ютер:** цілком підходить для тестування й активного використання, але очікуйте пауз, коли машина засинає або оновлюється.

    Якщо хочете найкраще з обох варіантів, тримайте Gateway на виділеному хості та під’єднайте ноутбук як **Node** для локальних інструментів екрана/камери/виконання команд. Див. [Nodes](/uk/nodes).
    Поради з безпеки див. у [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і рекомендована ОС?">
    OpenClaw легкий. Для базового Gateway + одного каналу чату:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM, ~500 МБ диска.
    - **Рекомендовано:** 1-2 vCPU, 2 ГБ RAM або більше для запасу (журнали, медіа, кілька каналів). Інструменти Node та автоматизація браузера можуть потребувати багато ресурсів.

    ОС: використовуйте **Ubuntu LTS** (або будь-яку сучасну Debian/Ubuntu). Шлях встановлення для Linux найкраще протестований саме там.

    Документація: [Linux](/uk/platforms/linux), [VPS-хостинг](/uk/vps).

  </Accordion>

  <Accordion title="Чи можна запускати OpenClaw у VM і які вимоги?">
    Так. Розглядайте VM так само, як VPS: вона має бути завжди ввімкнена, доступна та мати достатньо
    RAM для Gateway і всіх каналів, які ви ввімкнете.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM.
    - **Рекомендовано:** 2 ГБ RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера або медіаінструменти.
    - **ОС:** Ubuntu LTS або інша сучасна Debian/Ubuntu.

    Якщо ви на Windows, використовуйте **Windows Hub** для налаштування робочого столу або WSL2, коли
    вам спеціально потрібна VM Gateway у стилі Linux із широкою сумісністю
    інструментів. Див. [Windows](/uk/platforms/windows), [VPS-хостинг](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [FAQ](/uk/help/faq) — основний FAQ (моделі, сеанси, gateway, безпека та інше)
- [Огляд встановлення](/uk/install)
- [Початок роботи](/uk/start/getting-started)
- [Усунення несправностей](/uk/help/troubleshooting)
