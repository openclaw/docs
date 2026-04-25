---
read_when:
    - Нове встановлення, зависання початкового налаштування або помилки під час першого запуску
    - Вибір автентифікації та підписок постачальника
    - Неможливо отримати доступ до docs.openclaw.ai, неможливо відкрити панель керування, встановлення зависло
sidebarTitle: First-run FAQ
summary: 'FAQ: швидкий старт і налаштування першого запуску — встановлення, початкове налаштування, автентифікація, підписки, початкові збої'
title: 'FAQ: налаштування першого запуску'
x-i18n:
    generated_at: "2026-04-25T17:32:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a3f410b9618df614263c26e5e5c9c45c775b8d05e887e06e02be49f11b7cec
    source_path: help/faq-first-run.md
    workflow: 15
---

  Швидкі запитання й відповіді щодо швидкого старту та першого запуску. Для щоденних операцій, моделей, автентифікації, сеансів і усунення несправностей дивіться основний [FAQ](/uk/help/faq).

  ## Швидкий старт і налаштування першого запуску

  <AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб вирішити проблему">
    Використайте локального AI-агента, який може **бачити вашу машину**. Це значно ефективніше, ніж питати
    у Discord, тому що більшість випадків "я застряг" — це **проблеми локальної конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, виконувати команди, перевіряти журнали та допомагати виправляти
    налаштування на рівні вашої машини (PATH, служби, дозволи, файли автентифікації). Надайте їм **повну копію вихідного коду**
    через встановлення hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **із git checkout**, тож агент може читати код і документацію та
    працювати з точною версією, яку ви запускаєте. Ви завжди можете пізніше повернутися до стабільної версії,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати й контролювати** виправлення (крок за кроком), а потім виконати лише
    необхідні команди. Це робить зміни меншими й простішими для аудиту.

    Якщо ви виявите реальну помилку або виправлення, будь ласка, створіть issue на GitHub або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (поділіться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану Gateway/агента + базова конфігурація.
    - `openclaw models status`: перевіряє автентифікацію постачальника + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє поширені проблеми конфігурації/стану.

    Інші корисні CLI-перевірки: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламалося](#first-60-seconds-if-something-is-broken).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску Heartbeat:

    - `quiet-hours`: поза межами налаштованого вікна active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожній каркас або каркас лише із заголовком
    - `no-tasks-due`: режим завдань `HEARTBEAT.md` активний, але жоден з інтервалів завдань ще не настав
    - `alerts-disabled`: усю видимість heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові позначки настання оновлюються лише після завершення
    реального запуску heartbeat. Пропущені запуски не позначають завдання як завершені.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація й завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановлення й налаштування OpenClaw">
    У репозиторії рекомендовано запуск із вихідного коду та використання onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати UI-ресурси. Після onboarding ви зазвичай запускаєте Gateway на порту **18789**.

    Із вихідного коду (для учасників/розробників):

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
    Майстер відкриває ваш браузер із чистою URL-адресою панелі керування (без токена) одразу після onboarding, а також виводить посилання в підсумку. Залиште цю вкладку відкритою; якщо вона не запустилася, скопіюйте й вставте надруковану URL-адресу на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати панель керування на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується автентифікація зі спільним секретом, вставте налаштований токен або пароль у налаштуваннях Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо спільний секрет ще не налаштовано, згенеруйте токен за допомогою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште прив’язку loopback, виконайте `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставлення спільного секрету, за умови довіреного хоста Gateway); HTTP API усе одно вимагають автентифікації зі спільним секретом, якщо тільки ви навмисно не використовуєте private-ingress `none` або HTTP-автентифікацію trusted-proxy.
      Невдалі одночасні спроби автентифікації Serve від того самого клієнта серіалізуються до того, як обмежувач невдалих автентифікацій зафіксує їх, тож друга невдала повторна спроба вже може показувати `retry later`.
    - **Прив’язка Tailnet**: виконайте `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний спільний секрет у налаштуваннях панелі керування.
    - **Реверсний проксі з урахуванням ідентичності**: залиште Gateway за trusted-proxy без loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL проксі.
    - **SSH-тунель**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`. Автентифікація зі спільним секретом усе одно застосовується через тунель; вставте налаштований токен або пароль, якщо буде запит.

    Див. [Панель керування](/uk/web/dashboard) і [Веб-поверхні](/uk/web) для режимів прив’язки й подробиць автентифікації.

  </Accordion>

  <Accordion title="Чому є дві конфігурації підтвердження exec для погоджень у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на погодження в призначення чату
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом погодження для exec-погоджень

    Політика host exec усе одно залишається справжнім бар’єром погодження. Конфігурація чату лише керує тим,
    де з’являються запити на погодження і як люди можуть на них відповідати.

    У більшості налаштувань вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди й відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначити погоджувачів, OpenClaw тепер автоматично вмикає DM-first нативні погодження, коли `channels.<channel>.execApprovals.enabled` не задано або дорівнює `"auto"`.
    - Коли доступні нативні картки/кнопки погодження, цей нативний UI є основним шляхом; агент має додавати ручну команду `/approve` лише якщо результат інструмента каже, що погодження в чаті недоступні або ручне погодження — єдиний шлях.
    - Використовуйте `approvals.exec` лише коли запити також потрібно пересилати в інші чати або явні кімнати ops.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише якщо ви явно хочете, щоб запити на погодження публікувалися назад у початкову кімнату/тему.
    - Погодження Plugin знову ж таки окремі: вони за замовчуванням використовують `/approve` у тому самому чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі нативні канали зберігають додаткову нативну обробку plugin-погоджень.

    Коротко: пересилання — для маршрутизації, конфігурація нативного клієнта — для багатшого UX, специфічного для каналу.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке середовище виконання мені потрібне?">
    Потрібен Node **>= 22**. Рекомендується `pnpm`. Bun **не рекомендується** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легкий — у документації вказано, що для особистого використання достатньо **512 МБ–1 ГБ RAM**, **1 ядра** і приблизно **500 МБ**
    диска, а також зазначено, що **Raspberry Pi 4 може його запускати**.

    Якщо вам потрібен додатковий запас (журнали, медіа, інші служби), **рекомендується 2 ГБ**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може розмістити Gateway, а ви можете підключати **nodes** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є якісь поради для встановлення на Raspberry Pi?">
    Коротко: працює, але очікуйте певних труднощів.

    - Використовуйте **64-бітну** ОС і Node >= 22.
    - Віддавайте перевагу **hackable (git) install**, щоб можна було бачити журнали й швидко оновлюватися.
    - Починайте без channels/Skills, а потім додавайте їх по одному.
    - Якщо зіткнетеся з дивними проблемами бінарних файлів, зазвичай це проблема **сумісності ARM**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Застрягає на wake up my friend / onboarding не завершується. Що робити?">
    Цей екран залежить від того, чи доступний Gateway і чи пройдена автентифікація. TUI також надсилає
    "Wake up, my friend!" автоматично під час першого hatch. Якщо ви бачите цей рядок і **немає відповіді**,
    а токени залишаються на 0, агент так і не запустився.

    1. Перезапустіть Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Перевірте статус і автентифікацію:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Якщо все ще зависає, виконайте:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що тунель/з’єднання Tailscale працює і що UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini), не проходячи onboarding заново?">
    Так. Скопіюйте **каталог стану** і **робочий простір**, а потім один раз запустіть Doctor. Це
    збереже вашого бота "точно таким самим" (пам’ять, історію сеансів, автентифікацію та стан
    каналу), якщо ви скопіюєте **обидва** розташування:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте свій робочий простір (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть службу Gateway.

    Це збереже конфігурацію, профілі автентифікації, облікові дані WhatsApp, сеанси й пам’ять. Якщо ви працюєте у
    віддаленому режимі, пам’ятайте, що хост gateway володіє сховищем сеансів і робочим простором.

    **Важливо:** якщо ви лише робите commit/push свого робочого простору на GitHub, ви створюєте резервну
    копію **пам’яті + bootstrap-файлів**, але **не** історії сеансів або автентифікації. Вони зберігаються
    у `~/.openclaw/` (наприклад `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язано: [Міграція](/uk/install/migrating), [Де все зберігається на диску](#where-things-live-on-disk),
    [Робочий простір агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи — угорі. Якщо верхній розділ позначено як **Unreleased**, то наступний датований
    розділ — це остання випущена версія. Записи згруповано за **Highlights**, **Changes** і
    **Fixes** (а також за розділами документації/іншими, коли потрібно).

  </Accordion>

  <Accordion title="Неможливо отримати доступ до docs.openclaw.ai (помилка SSL)">
    Деякі з’єднання Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до списку дозволених, а потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати сайт, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете отримати доступ до сайту, документацію дзеркально розміщено на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай стабільний реліз спочатку потрапляє в **beta**, а потім явний
    крок просування переміщує цю саму версію до `latest`. За потреби супровідники також можуть
    публікувати одразу в `latest`. Саме тому beta і stable можуть вказувати на **ту саму версію** після просування.

    Подивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди для встановлення та різницю між beta і dev дивіться в акордеоні нижче.

  </Accordion>

  <Accordion title="Як установити beta-версію і яка різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (після просування може збігатися з `latest`).
    **Dev** — це рухома вершина `main` (git); коли її публікують, вона використовує npm dist-tag `dev`.

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

  <Accordion title="Як спробувати найновіші збірки?">
    Є два варіанти:

    1. **Канал dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає на гілку `main` і оновлює з вихідного коду.

    2. **Hackable install (із сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Так ви отримаєте локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо ви віддаєте перевагу чистому ручному клонуванню, використайте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Оновлення](/uk/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай триває встановлення й onboarding?">
    Приблизно:

    - **Встановлення:** 2–5 хвилин
    - **Onboarding:** 5–15 хвилин залежно від того, скільки каналів/моделей ви налаштовуєте

    Якщо все зависає, скористайтеся [Інсталятор завис?](#quick-start-and-first-run-setup)
    і швидким циклом налагодження в [Я застряг](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Інсталятор завис? Як отримати більше зворотного зв’язку?">
    Повторно запустіть інсталятор із **докладним виводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Встановлення beta з докладним виводом:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Для hackable (git) install:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Еквівалент для Windows (PowerShell):

    ```powershell
    # install.ps1 ще не має окремого прапорця -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Більше варіантів: [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Під час встановлення на Windows з’являється git not found або openclaw not recognized">
    Дві поширені проблеми Windows:

    **1) Помилка npm spawn git / git not found**

    - Установіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, потім повторно запустіть інсталятор.

    **2) Після встановлення openclaw is not recognized**

    - Ваша глобальна папка bin npm відсутня в PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до свого користувацького PATH (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо вам потрібне максимально плавне налаштування Windows, використовуйте **WSL2** замість нативного Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="Вивід exec у Windows показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність кодової сторінки консолі в нативних оболонках Windows.

    Симптоми:

    - вивід `system.run`/`exec` показує китайський текст як mojibake
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

    Якщо це все ще відтворюється в останній версії OpenClaw, відстежуйте/повідомляйте про це тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використайте **hackable (git) install**, щоб мати локально весь вихідний код і документацію, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг читати репозиторій і відповідати точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як установити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтесь посібника для Linux, а потім запустіть onboarding.

    - Швидкий шлях для Linux + встановлення служби: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення й оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як установити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Установіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де посібники зі встановлення в хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з поширеними провайдерами. Виберіть одного та дотримуйтесь посібника:

    - [VPS-хостинг](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте доступ до нього
    зі свого ноутбука/телефона через Control UI (або Tailscale/SSH). Ваші state + workspace
    живуть на сервері, тож розглядайте хост як джерело істини й робіть його резервні копії.

    Ви можете підключати **nodes** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримати доступ
    до локального екрана/камери/canvas або запускати команди на своєму ноутбуці, зберігаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити себе самостійно?">
    Коротка відповідь: **можливо, але не рекомендовано**. Процес оновлення може перезапустити
    Gateway (що перерве активний сеанс), може потребувати чистого git checkout і
    може запитувати підтвердження. Безпечніше: запускати оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо вам усе ж потрібно автоматизувати це з агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Оновлення](/uk/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить onboarding?">
    `openclaw onboard` — це рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/автентифікації** (OAuth постачальника, API-ключі, Anthropic setup-token, а також локальні варіанти моделей, наприклад LM Studio)
    - Розташування **робочого простору** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані channel Plugins, як-от QQ Bot)
    - **Встановлення демона** (LaunchAgent у macOS; systemd user unit у Linux/WSL2)
    - **Перевірки стану** і вибір **Skills**

    Він також попереджає, якщо налаштована вами модель невідома або для неї відсутня автентифікація.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw за допомогою **API-ключів** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації в цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **API-ключ Anthropic**: звичайна оплата Anthropic API
    - **Claude CLI / автентифікація через підписку Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw розглядає використання `claude -p`
      як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів Gateway API-ключі Anthropic усе ще є більш
    передбачуваним налаштуванням. OpenAI Codex OAuth офіційно підтримується для зовнішніх
    інструментів, таких як OpenClaw.

    OpenClaw також підтримує інші розміщені варіанти у стилі підписки, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [GLM Models](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API-ключа?">
    Так.

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тож
    OpenClaw розглядає автентифікацію через підписку Claude та використання `claude -p` як санкціоновані
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо ви хочете
    найпередбачуваніше серверне налаштування, натомість використовуйте API-ключ Anthropic.

  </Accordion>

  <Accordion title="Чи підтримується автентифікація через підписку Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тож OpenClaw розглядає
    повторне використання Claude CLI та використання `claude -p` як санкціоновані для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Anthropic setup-token усе ще доступний як підтримуваний шлях токена OpenClaw, але OpenClaw тепер віддає перевагу повторному використанню Claude CLI і `claude -p`, коли це доступно.
    Для production або багатокористувацьких навантажень автентифікація через API-ключ Anthropic усе ще є
    безпечнішим і передбачуванішим вибором. Якщо вам потрібні інші розміщені варіанти у стилі підписки
    в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
    Це означає, що вашу **квоту/ліміт частоти Anthropic** вичерпано для поточного вікна. Якщо ви
    використовуєте **Claude CLI**, зачекайте, поки вікно скинеться, або оновіть свій план. Якщо ви
    використовуєте **API-ключ Anthropic**, перевірте Anthropic Console
    щодо використання/оплати й за потреби підвищте ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, це означає, що запит намагається використовувати
    1M context beta Anthropic (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані мають право на оплату long-context (оплата за API-ключем або
    шлях входу Claude OpenClaw з увімкненим Extra Usage).

    Порада: установіть **fallback model**, щоб OpenClaw міг продовжувати відповідати, поки провайдер обмежений rate limit.
    Див. [Models](/uk/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудований провайдер **Amazon Bedrock (Converse)**. Якщо присутні AWS env markers, OpenClaw може автоматично виявляти каталог Bedrock для streaming/text і додавати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис провайдера вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний проксі перед Bedrock також залишається коректним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Використовуйте
    `openai-codex/gpt-5.5` для Codex OAuth через стандартний runner PI. Використовуйте
    `openai/gpt-5.5` для прямого доступу через API-ключ OpenAI. GPT-5.5 також може використовувати
    підписку/OAuth через `openai-codex/gpt-5.5` або нативні запуски Codex app-server
    з `openai/gpt-5.5` і `embeddedHarness.runtime: "codex"`.
    Див. [Провайдери моделей](/uk/concepts/model-providers) і [Onboarding (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому OpenClaw досі згадує openai-codex?">
    `openai-codex` — це ідентифікатор провайдера та auth profile для ChatGPT/Codex OAuth.
    Це також явний префікс моделі PI для Codex OAuth:

    - `openai/gpt-5.5` = поточний прямий маршрут API-ключа OpenAI у PI
    - `openai-codex/gpt-5.5` = маршрут Codex OAuth у PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = нативний маршрут Codex app-server
    - `openai-codex:...` = ідентифікатор auth profile, а не посилання на модель

    Якщо вам потрібен прямий шлях оплати/лімітів OpenAI Platform, установіть
    `OPENAI_API_KEY`. Якщо вам потрібна автентифікація через підписку ChatGPT/Codex, увійдіть через
    `openclaw models auth login --provider openai-codex` і використовуйте
    посилання на моделі `openai-codex/*` для запусків PI.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    Codex OAuth використовує керовані OpenAI вікна квот, що залежать від плану. На практиці
    ці ліміти можуть відрізнятися від досвіду використання сайту/застосунку ChatGPT, навіть коли
    обидва прив’язані до одного облікового запису.

    OpenClaw може показувати поточні видимі вікна використання/квот провайдера в
    `openclaw models status`, але він не вигадує і не нормалізує права ChatGPT web
    до прямого доступу API. Якщо вам потрібен прямий шлях оплати/лімітів OpenAI Platform,
    використовуйте `openai/*` з API-ключем.

  </Accordion>

  <Accordion title="Чи підтримується автентифікація через підписку OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **subscription OAuth OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання subscription OAuth у зовнішніх інструментах/робочих процесах,
    таких як OpenClaw. Onboarding може виконати цей потік OAuth за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Onboarding (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **plugin auth flow**, а не client id чи secret у `openclaw.json`.

    Кроки:

    1. Установіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Типова модель після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити завершуються помилкою, установіть `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає токени OAuth в auth profiles на хості gateway. Докладніше: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для звичайних чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; малі карти обрізають і пропускають витоки. Якщо вам це все ж потрібно, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і дивіться [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі підвищують ризик prompt injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як утримувати трафік hosted model у певному регіоні?">
    Обирайте endpoints із фіксацією регіону. OpenRouter надає варіанти з хостингом у США для MiniMax, Kimi і GLM; виберіть варіант із хостингом у США, щоб зберігати дані в межах регіону. Ви все одно можете перелічувати Anthropic/OpenAI поряд із ними, використовуючи `models.mode: "merge"`, щоб fallback залишалися доступними з дотриманням вибраного вами регіонального провайдера.
  </Accordion>

  <Accordion title="Чи потрібно купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini не є обов’язковим — дехто
    купує його як постійно ввімкнений хост, але також підійде невеликий VPS, домашній сервер або пристрій класу Raspberry Pi.

    Mac вам потрібен лише для **інструментів лише для macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux чи деінде. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або підключіть macOS Node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, увійшовший у Messages. Це **не обов’язково** має бути Mac mini —
    підійде будь-який Mac. Для iMessage **використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) — сервер BlueBubbles працює на macOS, тоді як Gateway може працювати на Linux чи деінде.

    Поширені налаштування:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac, увійшовшому в Messages.
    - Запускайте все на Mac, якщо хочете найпростішу конфігурацію на одній машині.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи можу я підключити його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключатися як
    **Node** (допоміжний пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, такі як screen/camera/canvas і `system.run` на цьому пристрої.

    Поширений сценарій:

    - Gateway на Mac mini (постійно ввімкнений).
    - MacBook Pro запускає застосунок macOS або хост Node і сполучається з Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я використовувати Bun?">
    Bun **не рекомендується**. Ми бачимо помилки середовища виконання, особливо з WhatsApp і Telegram.
    Для стабільних Gateway використовуйте **Node**.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на непродукційному gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім’я користувача бота.

    Під час налаштування запитуються лише числові user ID. Якщо у вас уже є застарілі записи `@username` у конфігурації, `openclaw doctor --fix` може спробувати їх розв’язати.

    Безпечніший варіант (без стороннього бота):

    - Напишіть своєму боту в DM, потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть своєму боту в DM, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватний):

    - Напишіть у DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **маршрутизацію multi-agent**. Прив’яжіть DM WhatsApp **кожного відправника** (peer `kind: "direct"`, E.164 відправника, наприклад `+15551234567`) до іншого `agentId`, щоб кожна людина мала власний workspace і сховище сеансів. Відповіді все одно надходитимуть із **того самого облікового запису WhatsApp**, а контроль доступу DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Див. [Маршрутизація Multi-Agent](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента "швидкий чат" і агента "Opus для кодування"?'>
    Так. Використовуйте маршрутизацію multi-agent: задайте кожному агенту власну типову модель, а потім прив’яжіть вхідні маршрути (обліковий запис провайдера або конкретні peers) до кожного агента. Приклад конфігурації є в [Маршрутизація Multi-Agent](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH служби містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, розпізнавалися в non-login shells.
    Останні збірки також додають на початок поширені каталоги користувацьких bin у службах Linux systemd (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо їх задано.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повний checkout вихідного коду, можна редагувати, найкраще для учасників.
      Ви локально запускаєте збірки й можете виправляти код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію "просто запустити".
      Оновлення надходять через npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між встановленнями npm і git?">
    Так. Установіть інший варіант, а потім запустіть Doctor, щоб служба gateway вказувала на нову точку входу.
    Це **не видаляє ваші дані** — змінюється лише встановлення коду OpenClaw. Ваші state
    (`~/.openclaw`) і workspace (`~/.openclaw/workspace`) залишаються недоторканими.

    Від npm до git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Від git до npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor виявляє невідповідність точки входу служби gateway і пропонує переписати конфігурацію служби відповідно до поточного встановлення (використовуйте `--repair` в автоматизації).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібен
    найменший тертя і вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Плюси:** немає витрат на сервер, прямий доступ до локальних файлів, видиме вікно браузера.
    - **Мінуси:** сон/мережеві збої = відключення, оновлення ОС/перезавантаження переривають роботу, комп’ютер має залишатися активним.

    **VPS / хмара**

    - **Плюси:** завжди ввімкнено, стабільна мережа, немає проблем через сон ноутбука, простіше підтримувати роботу.
    - **Мінуси:** часто працює без голови (використовуйте знімки екрана), доступ до файлів лише віддалений, для оновлень потрібен SSH.

    **Примітка щодо OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord чудово працюють із VPS. Єдиний справжній компроміс — **браузер без голови** чи видиме вікно. Див. [Браузер](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо у вас раніше вже були відключення gateway. Локальний варіант чудово підходить, коли ви активно користуєтеся Mac і хочете мати доступ до локальних файлів або автоматизацію UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Це не обов’язково, але **рекомендовано для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** завжди ввімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, простіше підтримувати безперервну роботу.
    - **Спільний ноутбук/настільний комп’ютер:** цілком підходить для тестування й активного використання, але очікуйте пауз, коли машина переходить у сон або оновлюється.

    Якщо ви хочете найкраще з обох варіантів, тримайте Gateway на виділеному хості, а ноутбук підключіть як **Node** для локальних інструментів screen/camera/exec. Див. [Nodes](/uk/nodes).
    Для рекомендацій щодо безпеки прочитайте [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яка ОС рекомендована?">
    OpenClaw легкий. Для базового Gateway + одного каналу чату:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM, ~500 МБ диска.
    - **Рекомендовано:** 1–2 vCPU, 2 ГБ RAM або більше із запасом (журнали, медіа, кілька каналів). Інструменти Node і автоматизація браузера можуть бути вимогливими до ресурсів.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях встановлення для Linux там протестовано найкраще.

    Документація: [Linux](/uk/platforms/linux), [VPS hosting](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди ввімкненою, доступною й мати достатньо
    RAM для Gateway і будь-яких увімкнених вами каналів.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM.
    - **Рекомендовано:** 2 ГБ RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера або медіаінструменти.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви використовуєте Windows, **WSL2 — це найпростіше налаштування у стилі VM** і воно має найкращу
    сумісність інструментів. Див. [Windows](/uk/platforms/windows), [VPS hosting](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Пов’язано

- [FAQ](/uk/help/faq) — основний FAQ (моделі, сеанси, gateway, безпека тощо)
- [Огляд встановлення](/uk/install)
- [Початок роботи](/uk/start/getting-started)
- [Усунення несправностей](/uk/help/troubleshooting)
