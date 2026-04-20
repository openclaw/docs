---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час виконання.
    - Сортування проблем, про які повідомляють користувачі, перед глибшим налагодженням
summary: Поширені запитання про налаштування, конфігурацію та використання OpenClaw
title: Поширені запитання
x-i18n:
    generated_at: "2026-04-20T04:35:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bdb17fc4d8c61a36f3a9fc3ca4a20f723cfa6c9bbbc92f963d6e313181f3451
    source_path: help/faq.md
    workflow: 15
---

# Поширені запитання

Швидкі відповіді плюс глибше усунення проблем для реальних середовищ (локальна розробка, VPS, multi-agent, OAuth/API keys, резервне перемикання моделей). Для діагностики під час виконання див. [Усунення несправностей](/uk/gateway/troubleshooting). Для повного довідника з конфігурації див. [Конфігурація](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламалося

1. **Швидкий статус (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидке локальне зведення: ОС + оновлення, доступність gateway/service, agents/sessions, конфігурація провайдера + проблеми під час виконання (коли gateway доступний).

2. **Звіт, який можна вставити й поділитися ним (безпечний для поширення)**

   ```bash
   openclaw status --all
   ```

   Діагностика в режимі лише читання з хвостом логів (токени замасковано).

3. **Стан демона + порту**

   ```bash
   openclaw gateway status
   ```

   Показує середовище виконання supervisor порівняно з доступністю RPC, цільову URL-адресу probe та те, яку конфігурацію служба, ймовірно, використовувала.

4. **Глибокі probe-перевірки**

   ```bash
   openclaw status --deep
   ```

   Виконує живу probe-перевірку стану gateway, включно з probe-перевірками каналів, коли це підтримується
   (потрібен доступний gateway). Див. [Стан](/uk/gateway/health).

5. **Показати хвіст останнього логу**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, скористайтеся запасним варіантом:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові логи відокремлені від логів служби; див. [Логування](/uk/logging) і [Усунення несправностей](/uk/gateway/troubleshooting).

6. **Запустіть doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує конфігурацію/стан + виконує перевірки стану. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок стану Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # показує цільову URL-адресу + шлях до конфігурації у разі помилок
   ```

   Запитує в запущеного gateway повний знімок стану (лише WS). Див. [Стан](/uk/gateway/health).

## Швидкий старт і початкове налаштування

<AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб розблокуватися">
    Використайте локального AI-агента, який може **бачити вашу машину**. Це набагато ефективніше, ніж питати
    у Discord, тому що більшість випадків "я застряг" — це **локальні проблеми з конфігурацією або середовищем**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти логи й допомагати виправити
    налаштування на рівні машини (PATH, служби, дозволи, auth-файли). Надайте їм **повний checkout вихідного коду** через
    зламуваний (git) спосіб встановлення:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **із git checkout**, тож агент може читати код + документацію та
    аналізувати точну версію, яку ви використовуєте. Ви завжди можете повернутися до стабільної версії пізніше,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати та супроводжувати** виправлення (покроково), а потім виконати лише
    потрібні команди. Так зміни залишаться невеликими, і їх буде простіше перевірити.

    Якщо ви виявили справжню помилку або виправлення, будь ласка, створіть issue на GitHub або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (поділіться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану gateway/agent + базової конфігурації.
    - `openclaw models status`: перевіряє auth провайдера + доступність моделі.
    - `openclaw doctor`: перевіряє та виправляє типові проблеми з конфігурацією/станом.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламалося](#перші-60-секунд,-якщо-щось-зламалося).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску Heartbeat:

    - `quiet-hours`: поза налаштованим вікном active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожню/лише-заголовкову заготовку
    - `no-tasks-due`: режим задач у `HEARTBEAT.md` активний, але жоден з інтервалів задач ще не настав
    - `alerts-disabled`: уся видимість heartbeat вимкнена (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі задач мітки часу настання оновлюються лише після завершення
    реального запуску heartbeat. Пропущені запуски не позначають задачі як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація та задачі](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановлення та налаштування OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати UI assets. Після onboarding ви зазвичай запускаєте Gateway на порту **18789**.

    Із вихідного коду (для контриб'юторів/розробників):

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

  <Accordion title="Як відкрити dashboard після onboarding?">
    Майстер відкриває браузер із чистою (без токена) URL-адресою dashboard одразу після onboarding, а також виводить посилання у зведенні. Тримайте цю вкладку відкритою; якщо її не було запущено, скопіюйте/вставте надруковану URL-адресу на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати dashboard на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується auth зі спільним секретом, вставте налаштований токен або пароль у налаштуваннях Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо спільний секрет ще не налаштовано, згенеруйте токен за допомогою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште bind loopback, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки identity задовольняють auth для Control UI/WebSocket (без вставлення спільного секрету, за умови довіри до хоста gateway); HTTP API усе одно вимагають auth зі спільним секретом, якщо ви навмисно не використовуєте private-ingress `none` або auth HTTP trusted-proxy.
      Некоректні одночасні спроби auth від того самого клієнта серіалізуються до того, як обмежувач failed-auth зафіксує їх, тож друга невдала повторна спроба вже може показувати `retry later`.
    - **Прив’язка до tailnet**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте auth за паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний спільний секрет у налаштуваннях dashboard.
    - **Reverse proxy з awareness identity**: залиште Gateway за trusted proxy не на loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL-адресу proxy.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`. Auth зі спільним секретом усе одно застосовується через tunnel; якщо буде запит, вставте налаштований токен або пароль.

    Див. [Dashboard](/web/dashboard) і [Web surfaces](/web) щодо режимів bind та деталей auth.

  </Accordion>

  <Accordion title="Чому є дві конфігурації схвалення exec для chat approvals?">
    Вони керують різними шарами:

    - `approvals.exec`: пересилає запити на схвалення до призначень у чаті
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом схвалення для exec approvals

    Політика host exec усе одно залишається справжнім бар’єром схвалення. Конфігурація чату лише визначає, де з’являються
    запити на схвалення і як люди можуть на них відповідати.

    У більшості середовищ вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди та відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначати тих, хто схвалює, OpenClaw тепер автоматично вмикає нативні схвалення DM-first, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні нативні картки/кнопки схвалення, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve` лише якщо результат інструмента повідомляє, що chat approvals недоступні або ручне схвалення є єдиним шляхом.
    - Використовуйте `approvals.exec` лише тоді, коли запити також потрібно пересилати в інші чати або явні кімнати ops.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише тоді, коли ви явно хочете, щоб запити на схвалення публікувалися назад у вихідну кімнату/тему.
    - Схвалення Plugin знову ж окремі: за замовчуванням вони використовують `/approve` у тому самому чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі нативні канали додатково зберігають нативну обробку plugin-approval.

    Коротко: пересилання — для маршрутизації, конфігурація нативного клієнта — для багатшого UX, специфічного для каналу.
    Див. [Схвалення Exec](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке середовище виконання мені потрібне?">
    Потрібен Node **>= 22**. Рекомендується `pnpm`. Bun **не рекомендується** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway є легким — у документації вказано, що для персонального використання достатньо **512MB-1GB RAM**, **1 core** та приблизно **500MB**
    дискового простору, а також зазначено, що **Raspberry Pi 4 може це запускати**.

    Якщо вам потрібен додатковий запас (логи, медіа, інші служби), **рекомендується 2GB**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може хостити Gateway, а ви можете підключити **nodes** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Чи є поради щодо встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте шорсткі моменти.

    - Використовуйте **64-bit** ОС і Node >= 22.
    - Віддавайте перевагу **зламуваному (git) встановленню**, щоб бачити логи та швидко оновлюватися.
    - Починайте без channels/Skills, а потім додавайте їх по одному.
    - Якщо натрапите на дивні проблеми з бінарниками, зазвичай це проблема **сумісності ARM**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Застрягає на wake up my friend / onboarding не hatch. Що тепер?">
    Цей екран залежить від того, чи доступний Gateway і чи пройдено auth. TUI також автоматично надсилає
    "Wake up, my friend!" під час першого hatch. Якщо ви бачите цей рядок **без відповіді**
    і токени залишаються на 0, agent так і не запустився.

    1. Перезапустіть Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Перевірте статус + auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Якщо це все ще зависає, виконайте:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що tunnel/Tailscale з’єднання активне і що UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє середовище на нову машину (Mac mini), не проходячи onboarding заново?">
    Так. Скопіюйте **каталог стану** та **workspace**, а потім один раз запустіть Doctor. Це
    збереже вашого бота "точно таким самим" (пам’ять, історію сесій, auth і стан
    каналів), якщо ви скопіюєте **обидва** розташування:

    1. Встановіть OpenClaw на нову машину.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте ваш workspace (типово: `~/.openclaw/workspace`).
    4. Виконайте `openclaw doctor` і перезапустіть службу Gateway.

    Це зберігає конфігурацію, auth-профілі, облікові дані WhatsApp, сесії та пам’ять. Якщо ви працюєте
    у віддаленому режимі, пам’ятайте, що хост gateway зберігає сховище сесій і workspace.

    **Важливо:** якщо ви лише commit/push свій workspace на GitHub, ви створюєте резервну копію
    **пам’яті + bootstrap-файлів**, але **не** історії сесій чи auth. Вони зберігаються
    у `~/.openclaw/` (наприклад `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Міграція](/uk/install/migrating), [Де що зберігається на диску](#де-що-зберігається-на-диску),
    [Workspace агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перегляньте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи зверху. Якщо верхній розділ позначено як **Unreleased**, то наступний датований
    розділ — це остання випущена версія. Записи згруповані за **Основне**, **Зміни** та
    **Виправлення** (а також розділами документації/іншими, коли потрібно).

  </Accordion>

  <Accordion title="Не вдається отримати доступ до docs.openclaw.ai (помилка SSL)">
    Деякі з’єднання Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до allowlist, а потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати це, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дзеркалюється на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай stable-реліз спочатку потрапляє в **beta**, а потім явний
    крок підвищення переміщує ту саму версію в `latest`. Мейнтейнери також можуть
    опублікувати одразу в `latest`, коли це потрібно. Ось чому beta і stable можуть
    вказувати на **одну й ту саму версію** після підвищення.

    Дивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди для встановлення та різницю між beta і dev дивіться в акордеоні нижче.

  </Accordion>

  <Accordion title="Як встановити beta-версію і яка різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (може збігатися з `latest` після підвищення).
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

    1. **Dev channel (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає вас на гілку `main` і оновлює з вихідного коду.

    2. **Зламуване встановлення (із сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає вам локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо ви віддаєте перевагу чистому клонуванню вручну, скористайтеся:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Оновлення](/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай тривають встановлення й onboarding?">
    Приблизний орієнтир:

    - **Встановлення:** 2–5 хвилин
    - **Onboarding:** 5–15 хвилин залежно від того, скільки каналів/моделей ви налаштовуєте

    Якщо все зависло, скористайтеся [Інсталятор завис?](#швидкий-старт-і-початкове-налаштування)
    і швидким циклом налагодження в [Я застряг](#швидкий-старт-і-початкове-налаштування).

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

    Для зламуваного (git) встановлення:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Еквівалент для Windows (PowerShell):

    ```powershell
    # install.ps1 поки не має окремого прапорця -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Більше варіантів: [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Під час встановлення на Windows пише, що git не знайдено або openclaw не розпізнано">
    Дві поширені проблеми у Windows:

    **1) npm error spawn git / git not found**

    - Встановіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, а потім повторно запустіть інсталятор.

    **2) Після встановлення openclaw не розпізнається**

    - Ваша глобальна папка npm bin відсутня в PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до вашого користувацького PATH (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо ви хочете найплавніше налаштування у Windows, використовуйте **WSL2** замість нативної Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="У виводі exec у Windows відображається спотворений китайський текст — що робити?">
    Зазвичай це невідповідність code page консолі в нативних оболонках Windows.

    Симптоми:

    - Вивід `system.run`/`exec` показує китайський текст як mojibake
    - Та сама команда нормально виглядає в іншому профілі термінала

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

    Якщо ви все ще відтворюєте це в останній версії OpenClaw, відстежуйте/повідомляйте тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використайте **зламуване (git) встановлення**, щоб мати локально повний вихідний код і документацію, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг прочитати репозиторій і дати точну відповідь.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтесь інструкції для Linux, а потім запустіть onboarding.

    - Швидкий шлях для Linux + встановлення служби: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення й оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Встановіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Інструкції: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де знаходяться інструкції зі встановлення у хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з поширеними провайдерами. Оберіть потрібного й дотримуйтесь інструкції:

    - [Хостинг VPS](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте до нього доступ
    зі свого ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан + workspace
    зберігаються на сервері, тож вважайте хост джерелом істини й робіть його резервні копії.

    Ви можете під’єднати **nodes** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримати доступ
    до локального екрана/камери/canvas або виконувати команди на ноутбуці, зберігаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити самого себе?">
    Коротка відповідь: **можливо, але не рекомендується**. Процес оновлення може перезапустити
    Gateway (що розірве активну сесію), може вимагати чистого git checkout і
    може запитувати підтвердження. Безпечніше запускати оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо вам обов’язково потрібна автоматизація з agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Оновлення](/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить onboarding?">
    `openclaw onboard` — це рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/auth** (OAuth провайдера, API keys, Anthropic setup-token, а також локальні варіанти моделей, як-от LM Studio)
    - Розташування **workspace** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також bundled channel plugins, як-от QQ Bot)
    - **Встановлення демона** (LaunchAgent у macOS; systemd user unit у Linux/WSL2)
    - **Перевірки стану** та вибір **Skills**

    Він також попереджає, якщо налаштована вами модель невідома або для неї відсутній auth.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw з **API keys** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації у цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **Anthropic API key**: звичайна оплата Anthropic API
    - **Claude CLI / auth підписки Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw розглядає використання `claude -p`
      як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів gateway ключі Anthropic API все ще залишаються
    більш передбачуваним варіантом налаштування. OpenAI Codex OAuth явно підтримується для зовнішніх
    інструментів на кшталт OpenClaw.

    OpenClaw також підтримує інші розміщені варіанти на основі підписки, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [Моделі GLM](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API key?">
    Так.

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тож
    OpenClaw вважає auth через підписку Claude та використання `claude -p` санкціонованими
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо вам потрібне
    найбільш передбачуване серверне налаштування, використовуйте ключ Anthropic API.

  </Accordion>

  <Accordion title="Чи підтримуєте ви auth через підписку Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тому OpenClaw вважає
    повторне використання Claude CLI та використання `claude -p` санкціонованими для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Anthropic setup-token усе ще доступний як підтримуваний шлях токена OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI та `claude -p`, коли це доступно.
    Для production або multi-user навантажень auth за ключем Anthropic API усе ще є
    безпечнішим і більш передбачуваним вибором. Якщо вас цікавлять інші розміщені
    варіанти у стилі підписки в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [Моделі
    GLM](/uk/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
Це означає, що ваша **квота/обмеження швидкості Anthropic** вичерпано для поточного вікна. Якщо ви
використовуєте **Claude CLI**, дочекайтеся скидання вікна або оновіть свій план. Якщо ви
використовуєте **ключ Anthropic API**, перевірте Anthropic Console
щодо використання/білінгу та за потреби збільште ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, запит намагається використовувати
    1M context beta від Anthropic (`context1m: true`). Це працює лише тоді, коли ваш
    обліковий запис має право на білінг long-context (білінг за API key або
    шлях входу в Claude через OpenClaw з увімкненим Extra Usage).

    Порада: задайте **резервну модель**, щоб OpenClaw міг продовжувати відповідати, поки провайдер обмежений rate limit.
    Див. [Моделі](/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має bundled провайдер **Amazon Bedrock (Converse)**. Якщо присутні маркери середовища AWS, OpenClaw може автоматично виявляти каталог Bedrock для streaming/text і об’єднувати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис провайдера вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку з ключем, OpenAI-сумісний proxy перед Bedrock також залишається коректним варіантом.
  </Accordion>

  <Accordion title="Як працює auth Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Onboarding може запустити OAuth-потік і за потреби встановить модель за замовчуванням `openai-codex/gpt-5.4`. Див. [Провайдери моделей](/uk/concepts/model-providers) і [Onboarding (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому ChatGPT GPT-5.4 не відкриває openai/gpt-5.4 в OpenClaw?">
    OpenClaw розглядає ці два шляхи окремо:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = прямий API OpenAI Platform

    В OpenClaw вхід через ChatGPT/Codex прив’язаний до маршруту `openai-codex/*`,
    а не до прямого маршруту `openai/*`. Якщо ви хочете прямий API-шлях в
    OpenClaw, задайте `OPENAI_API_KEY` (або еквівалентну конфігурацію провайдера OpenAI).
    Якщо ви хочете вхід ChatGPT/Codex в OpenClaw, використовуйте `openai-codex/*`.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    `openai-codex/*` використовує маршрут Codex OAuth, і його доступні вікна квот
    керуються OpenAI та залежать від плану. На практиці ці ліміти можуть відрізнятися від
    досвіду використання сайту/застосунку ChatGPT, навіть якщо обидва прив’язані до одного облікового запису.

    OpenClaw може показувати поточні видимі вікна використання/квоти провайдера в
    `openclaw models status`, але він не вигадує і не нормалізує права ChatGPT-web
    у прямий доступ до API. Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform,
    використовуйте `openai/*` з API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви auth через підписку OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth підписки OpenAI Code (Codex)**.
    OpenAI прямо дозволяє використання OAuth підписки в зовнішніх інструментах/процесах
    на кшталт OpenClaw. Onboarding може запустити OAuth-потік за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Onboarding (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **потік auth Plugin**, а не client id чи secret у `openclaw.json`.

    Кроки:

    1. Встановіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Модель за замовчуванням після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не працюють, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає токени OAuth у auth-профілях на хості gateway. Деталі: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; малі картки обрізають і пропускають витоки. Якщо все ж потрібно, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі підвищують ризик prompt-injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як зберегти трафік до розміщених моделей у певному регіоні?">
    Обирайте endpoint-и, прив’язані до регіону. OpenRouter надає варіанти з розміщенням у США для MiniMax, Kimi та GLM; оберіть варіант із розміщенням у США, щоб зберігати дані в межах регіону. Ви все одно можете перелічити Anthropic/OpenAI поряд із ними, використавши `models.mode: "merge"`, щоб резервні варіанти залишалися доступними з повагою до вибраного вами регіонального провайдера.
  </Accordion>

  <Accordion title="Чи потрібно купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini — необов’язковий: дехто
    купує його як постійно ввімкнений хост, але також підійде невеликий VPS, домашній сервер або пристрій класу Raspberry Pi.

    Mac потрібен лише **для інструментів тільки для macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або підключіть macOS Node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій з macOS**, увійдений у Messages. Це **не обов’язково** має бути Mac mini —
    підійде будь-який Mac. **Використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) для iMessage — сервер BlueBubbles працює на macOS, а Gateway може працювати на Linux або деінде.

    Типові варіанти:

    - Запустіть Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac, увійденому в Messages.
    - Запустіть усе на Mac, якщо хочете найпростішу конфігурацію на одній машині.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи можу я підключити його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключатися як
    **Node** (супутній пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, як-от screen/camera/canvas і `system.run` на цьому пристрої.

    Типовий шаблон:

    - Gateway на Mac mini (постійно ввімкнений).
    - MacBook Pro запускає застосунок macOS або хост Node і підключається до Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я використовувати Bun?">
    Bun **не рекомендується**. Ми бачимо помилки під час виконання, особливо з WhatsApp і Telegram.
    Використовуйте **Node** для стабільних gateway.

    Якщо ви все ж хочете експериментувати з Bun, робіть це на non-production gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що має бути в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім’я користувача бота.

    Налаштування запитує лише числові user ID. Якщо у вашій конфігурації вже є застарілі записи `@username`, `openclaw doctor --fix` може спробувати розв’язати їх.

    Безпечніший варіант (без стороннього бота):

    - Напишіть своєму боту в DM, потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть своєму боту в DM, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватний):

    - Напишіть у DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **маршрутизацію multi-agent**. Прив’яжіть WhatsApp **DM** кожного відправника (peer `kind: "direct"`, E.164 відправника на кшталт `+15551234567`) до іншого `agentId`, щоб кожна людина мала власний workspace і сховище сесій. Відповіді все одно надходитимуть з **того самого облікового запису WhatsApp**, а контроль доступу DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Див. [Маршрутизація Multi-Agent](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити agent "швидкий чат" і agent "Opus для кодування"?'>
    Так. Використовуйте маршрутизацію multi-agent: призначте кожному agent власну модель за замовчуванням, а потім прив’яжіть вхідні маршрути (обліковий запис провайдера або конкретні peers) до кожного agent. Приклад конфігурації наведено в [Маршрутизації Multi-Agent](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH служби містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, знаходилися в non-login shells.
    Нещодавні збірки також додають на початок типові user bin directories у Linux systemd services (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо вони задані.

  </Accordion>

  <Accordion title="Різниця між зламуваним git-встановленням і npm install">
    - **Зламуване (git) встановлення:** повний checkout вихідного коду, можна редагувати, найкраще для контриб’юторів.
      Ви локально запускаєте збірки й можете вносити виправлення в код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію "просто запустити".
      Оновлення надходять із npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm- і git-встановленнями?">
    Так. Встановіть інший варіант, а потім запустіть Doctor, щоб служба gateway вказувала на нову точку входу.
    Це **не видаляє ваші дані** — змінюється лише встановлений код OpenClaw. Ваш стан
    (`~/.openclaw`) і workspace (`~/.openclaw/workspace`) залишаються недоторканими.

    З npm на git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    З git на npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor виявляє невідповідність точки входу служби gateway і пропонує переписати конфігурацію служби відповідно до поточного встановлення (використовуйте `--repair` в автоматизації).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#де-що-зберігається-на-диску).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібен
    найменший поріг входу і вас влаштовують режим сну/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Плюси:** немає витрат на сервер, прямий доступ до локальних файлів, видиме вікно браузера.
    - **Мінуси:** сон/обриви мережі = відключення, оновлення ОС/перезавантаження переривають роботу, комп’ютер має залишатися активним.

    **VPS / хмара**

    - **Плюси:** завжди ввімкнено, стабільна мережа, немає проблем із режимом сну ноутбука, простіше підтримувати роботу.
    - **Мінуси:** часто працює без голови (використовуйте знімки екрана), лише віддалений доступ до файлів, для оновлень треба підключатися через SSH.

    **Примітка, специфічна для OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord чудово працюють з VPS. Єдиний реальний компроміс — **безголовий браузер** проти видимого вікна. Див. [Браузер](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо у вас уже були розриви gateway. Локальний запуск чудово підходить, коли ви активно працюєте на Mac і хочете мати локальний доступ до файлів або автоматизацію UI через видимий браузер.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на виділеній машині?">
    Не обов’язково, але **рекомендується для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** завжди ввімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, простіше підтримувати роботу.
    - **Спільний ноутбук/настільний ПК:** цілком нормально для тестування й активного використання, але очікуйте пауз, коли машина переходить у сон або оновлюється.

    Якщо ви хочете найкраще з обох світів, тримайте Gateway на виділеному хості, а ноутбук підключайте як **Node** для локальних інструментів screen/camera/exec. Див. [Nodes](/uk/nodes).
    Для рекомендацій із безпеки прочитайте [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яка ОС рекомендується?">
    OpenClaw є легким. Для базового Gateway + одного каналу чату:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1–2 vCPU, 2GB RAM або більше із запасом (логи, медіа, кілька каналів). Інструменти Node та автоматизація браузера можуть бути ресурсомісткими.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях встановлення для Linux там протестовано найкраще.

    Документація: [Linux](/uk/platforms/linux), [VPS hosting](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди ввімкнена, доступна й мати достатньо
    RAM для Gateway і будь-яких каналів, які ви вмикаєте.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера чи медіаінструменти.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви використовуєте Windows, **WSL2 — це найпростіше середовище у стилі VM** з найкращою
    сумісністю інструментів. Див. [Windows](/uk/platforms/windows), [VPS hosting](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw, в одному абзаці?">
    OpenClaw — це персональний AI-помічник, який ви запускаєте на власних пристроях. Він відповідає у вже знайомих вам каналах обміну повідомленнями (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat і bundled channel plugins, таких як QQ Bot), а також може працювати з голосом + live Canvas на підтримуваних платформах. **Gateway** — це завжди ввімкнена control plane; помічник — це продукт.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не "просто обгортка для Claude". Це **local-first control plane**, яка дає змогу запускати
    потужного помічника на **вашому власному обладнанні**, доступного з чат-застосунків, якими ви вже користуєтеся, зі
    сесіями зі станом, пам’яттю та інструментами — без передачі контролю над вашими робочими процесами розміщеному
    SaaS.

    Основне:

    - **Ваші пристрої, ваші дані:** запускайте Gateway де завгодно (Mac, Linux, VPS) і зберігайте
      workspace + історію сесій локально.
    - **Справжні канали, а не веб-пісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      а також мобільний голос і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо, з маршрутизацією
      та резервним перемиканням на рівні agent.
    - **Варіант лише локально:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо хочете.
    - **Маршрутизація multi-agent:** окремі agents за каналом, обліковим записом або задачею, кожен із власним
      workspace і типовими налаштуваннями.
    - **Відкритий код і можливість змінювати:** перевіряйте, розширюйте та self-host без прив’язки до постачальника.

    Документація: [Gateway](/uk/gateway), [Канали](/uk/channels), [Multi-agent](/uk/concepts/multi-agent),
    [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно все налаштував — що робити спочатку?">
    Хороші перші проєкти:

    - Створити вебсайт (WordPress, Shopify або простий статичний сайт).
    - Зробити прототип мобільного застосунку (структура, екрани, план API).
    - Упорядкувати файли й папки (очищення, найменування, теги).
    - Підключити Gmail і автоматизувати зведення або подальші дії.

    Він може впоратися з великими задачами, але найкраще працює, коли ви ділите їх на етапи й
    використовуєте sub-agents для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найпоширеніших повсякденних сценаріїв використання OpenClaw?">
    Щоденні виграші зазвичай виглядають так:

    - **Персональні зведення:** підсумки inbox, календаря та новин, які вас цікавлять.
    - **Дослідження та чернетки:** швидке дослідження, підсумки й перші чернетки листів або документів.
    - **Нагадування та подальші дії:** підштовхування й чеклісти на основі cron або heartbeat.
    - **Автоматизація браузера:** заповнення форм, збирання даних і повторення вебзадач.
    - **Координація між пристроями:** надішліть задачу з телефона, дозвольте Gateway виконати її на сервері й отримайте результат назад у чат.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, ads і blogs для SaaS?">
    Так — для **дослідження, кваліфікації та підготовки чернеток**. Він може сканувати сайти, створювати короткі списки,
    підсумовувати інформацію про потенційних клієнтів і писати чернетки outreach або рекламних текстів.

    Для **outreach або запуску реклами** тримайте людину в циклі. Уникайте спаму, дотримуйтеся місцевих законів і
    політик платформ, і переглядайте все перед відправленням. Найбезпечніший шаблон — дозволити
    OpenClaw підготувати чернетку, а вам її схвалити.

    Документація: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний помічник** і рівень координації, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу кодування всередині репозиторію. Використовуйте OpenClaw, коли вам
    потрібні тривала пам’ять, доступ з різних пристроїв і оркестрація інструментів.

    Переваги:

    - **Постійна пам’ять + workspace** між сесіями
    - **Доступ із різних платформ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (браузер, файли, планування, hooks)
    - **Завжди ввімкнений Gateway** (запуск на VPS, взаємодія звідусіль)
    - **Nodes** для локального browser/screen/camera/exec

    Вітрина: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills та автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати skills, не забруднюючи репозиторій?">
    Використовуйте керовані перевизначення замість редагування копії в репозиторії. Розміщуйте свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, тож керовані перевизначення все одно мають вищий пріоритет за bundled skills без змін у git. Якщо вам потрібно, щоб skill був установлений глобально, але видимий лише деяким agents, зберігайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` та `agents.list[].skills`. Лише зміни, варті додавання в upstream, мають жити в репозиторії й надсилатися як PR.
  </Accordion>

  <Accordion title="Чи можу я завантажувати skills із власної папки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Типовий порядок пріоритету: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` типово встановлює в `./skills`, що OpenClaw розглядає як `<workspace>/skills` у наступній сесії. Якщо skill має бути видимим лише певним agents, поєднайте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як використовувати різні моделі для різних задач?">
    Наразі підтримуються такі шаблони:

    - **Cron jobs**: ізольовані задачі можуть задавати перевизначення `model` для кожної задачі.
    - **Sub-agents**: маршрутизуйте задачі до окремих agents з різними типовими моделями.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб у будь-який момент змінити модель поточної сесії.

    Див. [Cron jobs](/uk/automation/cron-jobs), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent) і [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як це винести?">
    Використовуйте **sub-agents** для тривалих або паралельних задач. Sub-agents працюють у власній сесії,
    повертають підсумок і зберігають чуйність вашого основного чату.

    Попросіть бота "spawn a sub-agent for this task" або використайте `/subagents`.
    Використовуйте `/status` у чаті, щоб побачити, що Gateway робить просто зараз (і чи він зайнятий).

    Порада щодо токенів: і довгі задачі, і sub-agents споживають токени. Якщо вартість має значення, задайте
    дешевшу модель для sub-agents через `agents.defaults.subagents.model`.

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові задачі](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як на Discord працюють сесії subagent, прив’язані до тредів?">
    Використовуйте прив’язки тредів. Ви можете прив’язати тред Discord до subagent або цільової сесії, щоб подальші повідомлення в цьому треді залишалися в межах прив’язаної сесії.

    Базовий процес:

    - Запустіть через `sessions_spawn` з `thread: true` (і, за потреби, `mode: "session"` для постійної подальшої роботи).
    - Або прив’яжіть вручну за допомогою `/focus <target>`.
    - Використовуйте `/agents`, щоб перевірити стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати автоматичним зняттям фокусу.
    - Використовуйте `/unfocus`, щоб від’єднати тред.

    Потрібна конфігурація:

    - Глобальні значення за замовчуванням: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Перевизначення Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоматична прив’язка під час spawn: задайте `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Sub-agents](/uk/tools/subagents), [Discord](/uk/channels/discord), [Довідник із конфігурації](/uk/gateway/configuration-reference), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent завершив роботу, але оновлення про завершення пішло не туди або взагалі не було опубліковане. Що перевірити?">
    Спочатку перевірте визначений маршрут запитувача:

    - Доставка subagent у режимі завершення надає перевагу будь-якому прив’язаному треду або маршруту розмови, якщо такий існує.
    - Якщо джерело завершення містить лише канал, OpenClaw повертається до збереженого маршруту сесії запитувача (`lastChannel` / `lastTo` / `lastAccountId`), щоб пряма доставка все ще могла спрацювати.
    - Якщо немає ні прив’язаного маршруту, ні придатного збереженого маршруту, пряма доставка може не вдатися, і тоді результат повертається до доставки через чергу сесії замість негайної публікації в чат.
    - Некоректні або застарілі цілі все ще можуть примусово перевести доставку в чергу або спричинити остаточну помилку доставки.
    - Якщо остання видима відповідь assistant у дочірній сесії — це точний тихий токен `NO_REPLY` / `no_reply` або рівно `ANNOUNCE_SKIP`, OpenClaw навмисно приглушує оголошення замість публікації застарілого попереднього прогресу.
    - Якщо дочірня сесія завершилася за тайм-аутом після одних лише викликів інструментів, оголошення може згорнути це до короткого підсумку часткового прогресу замість відтворення сирого виводу інструментів.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові задачі](/uk/automation/tasks), [Інструмент сесій](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron запускається всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані задачі не виконуватимуться.

    Контрольний список:

    - Переконайтеся, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не задано.
    - Перевірте, що Gateway працює 24/7 (без режиму сну/перезапусків).
    - Перевірте налаштування часового поясу для задачі (`--tz` проти часового поясу хоста).

    Налагодження:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та задачі](/uk/automation).

  </Accordion>

  <Accordion title="Cron спрацював, але в канал нічого не було надіслано. Чому?">
    Спочатку перевірте режим доставки:

    - `--no-deliver` / `delivery.mode: "none"` означає, що зовнішнє повідомлення не очікується.
    - Відсутня або некоректна ціль оголошення (`channel` / `to`) означає, що runner пропустив вихідну доставку.
    - Помилки auth каналу (`unauthorized`, `Forbidden`) означають, що runner намагався доставити повідомлення, але облікові дані це заблокували.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` лише) вважається навмисно недоставним, тому runner також приглушує запасну доставку через чергу.

    Для ізольованих cron jobs runner відповідає за фінальну доставку. Очікується,
    що agent поверне текстовий підсумок, який runner надішле. `--no-deliver` зберігає
    цей результат внутрішнім; це не дозволяє agent натомість надсилати напряму через
    message tool.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Фонові задачі](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований запуск cron змінив модель або одноразово повторив спробу?">
    Зазвичай це шлях live-перемикання моделі, а не дубльоване планування.

    Ізольований cron може зберегти runtime-передачу моделі та повторити спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повторна спроба зберігає перемкнений
    provider/model, а якщо перемикання несло нове перевизначення auth-профілю, cron
    також зберігає його перед повторною спробою.

    Пов’язані правила вибору:

    - Спочатку застосовується перевизначення моделі Gmail hook, якщо воно доречне.
    - Потім `model` для конкретної задачі.
    - Потім будь-яке збережене перевизначення моделі cron-сесії.
    - Потім звичайний вибір моделі agent/типової моделі.

    Цикл повторних спроб обмежений. Після початкової спроби плюс 2 повторних спроб перемикання
    cron перериває виконання замість нескінченного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Як встановлювати skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або просто додавайте skills у свій workspace. UI Skills для macOS недоступний на Linux.
    Переглянути skills можна на [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    Нативна команда `openclaw skills install` записує у каталог `skills/`
    активного workspace. Окремий CLI `clawhub` встановлюйте лише якщо хочете публікувати або
    синхронізувати власні skills. Для спільного встановлення між agents розміщуйте skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете звузити коло agents, які можуть його бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати задачі за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте планувальник Gateway:

    - **Cron jobs** для запланованих або повторюваних задач (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок "основної сесії".
    - **Ізольовані jobs** для автономних agents, які публікують підсумки або доставляють їх у чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та задачі](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати Apple macOS-only skills з Linux?">
    Не напряму. Skills для macOS обмежуються через `metadata.openclaw.os` плюс потрібні бінарні файли, і skills з’являються в system prompt лише тоді, коли вони придатні на **хості Gateway**. На Linux skills лише для `darwin` (як-от `apple-notes`, `apple-reminders`, `things-mac`) не завантажуватимуться, якщо ви не перевизначите це обмеження.

    Є три підтримувані варіанти:

    **Варіант A — запускати Gateway на Mac (найпростіше).**
    Запускайте Gateway там, де існують бінарні файли macOS, а потім підключайтеся з Linux у [віддаленому режимі](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажуються звичайним чином, оскільки хост Gateway — це macOS.

    **Варіант B — використовувати macOS Node (без SSH).**
    Запустіть Gateway на Linux, підключіть macOS Node (застосунок у menubar) і встановіть **Node Run Commands** у значення "Always Ask" або "Always Allow" на Mac. OpenClaw може вважати macOS-only skills придатними, якщо потрібні бінарні файли існують на Node. Agent запускає ці skills через інструмент `nodes`. Якщо ви оберете "Always Ask", підтвердження "Always Allow" у запиті додає цю команду до allowlist.

    **Варіант C — проксувати бінарні файли macOS через SSH (розширений варіант).**
    Залиште Gateway на Linux, але налаштуйте так, щоб потрібні CLI-бінарники розв’язувалися у SSH-обгортки, які запускаються на Mac. Потім перевизначте skill, щоб дозволити Linux і зберегти його придатним.

    1. Створіть SSH-обгортку для бінарного файлу (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Розмістіть обгортку в `PATH` на Linux-хості (наприклад `~/bin/memo`).
    3. Перевизначте metadata skill (workspace або `~/.openclaw/skills`), щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Керування Apple Notes через CLI `memo` на macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Почніть нову сесію, щоб знімок skills оновився.

  </Accordion>

  <Accordion title="У вас є інтеграція з Notion або HeyGen?">
    Вбудованої наразі немає.

    Варіанти:

    - **Власний skill / Plugin:** найкраще для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Автоматизація браузера:** працює без коду, але повільніше й крихкіше.

    Якщо ви хочете зберігати контекст для кожного клієнта (agency workflows), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + налаштування + активна робота).
    - Попросіть agent отримати цю сторінку на початку сесії.

    Якщо вам потрібна нативна інтеграція, створіть запит на нову функцію або побудуйте skill,
    націлений на ці API.

    Встановлення skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні встановлення потрапляють у каталог `skills/` активного workspace. Для спільних skills між agents розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі agents, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі skills очікують бінарні файли, встановлені через Homebrew; на Linux це означає Linuxbrew (див. запис FAQ про Homebrew на Linux вище). Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати вже виконаний вхід у Chrome з OpenClaw?">
    Використовуйте вбудований профіль браузера `user`, який підключається через Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Якщо ви хочете власну назву, створіть явний MCP-профіль:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Цей шлях може використовувати локальний браузер хоста або підключений browser Node. Якщо Gateway працює деінде, або запустіть хост Node на машині з браузером, або використовуйте віддалений CDP.

    Поточні обмеження для `existing-session` / `user`:

    - дії прив’язані до ref, а не до CSS-селекторів
    - завантаження файлів потребує `ref` / `inputRef` і наразі підтримує лише один файл за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії все ще потребують керованого браузера або сирого профілю CDP

  </Accordion>
</AccordionGroup>

## Ізоляція та пам’ять

<AccordionGroup>
  <Accordion title="Чи є окрема документація про sandboxing?">
    Так. Див. [Ізоляція](/uk/gateway/sandboxing). Для налаштування, специфічного для Docker (повний gateway у Docker або образи sandbox), див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути всі можливості?">
    Образ за замовчуванням орієнтований на безпеку і запускається від користувача `node`, тож він не
    містить системних пакетів, Homebrew або bundled браузерів. Для повнішого налаштування:

    - Зберігайте `/home/node` через `OPENCLAW_HOME_VOLUME`, щоб кеші не втрачалися.
    - Додавайте системні залежності в образ через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Встановлюйте браузери Playwright через bundled CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Задайте `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я тримати DM приватними, а групи зробити публічними/ізольованими з одним agent?">
    Так — якщо ваш приватний трафік це **DM**, а публічний трафік це **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб сесії груп/каналів (ключі не-main) запускалися в Docker, а основна сесія DM залишалася на хості. Потім обмежте доступні інструменти в ізольованих сесіях через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Групи: приватні DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Довідка з ключової конфігурації: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив’язати папку хоста до sandbox?">
    Задайте `agents.defaults.sandbox.docker.binds` у вигляді `["host:path:mode"]` (наприклад `"/home/user/src:/src:ro"`). Глобальні прив’язки та прив’язки для конкретного agent об’єднуються; прив’язки для конкретного agent ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для всього чутливого й пам’ятайте, що прив’язки обходять файлові стіни sandbox.

    OpenClaw перевіряє джерела прив’язок і за нормалізованим шляхом, і за канонічним шляхом, визначеним через найглибшого наявного предка. Це означає, що виходи за межі через батьківський symlink усе одно надійно блокуються, навіть коли останній сегмент шляху ще не існує, а перевірки дозволеного кореня все одно застосовуються після розв’язання symlink.

    Див. [Ізоляція](/uk/gateway/sandboxing#custom-bind-mounts) і [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) для прикладів і приміток щодо безпеки.

  </Accordion>

  <Accordion title="Як працює пам’ять?">
    Пам’ять OpenClaw — це просто Markdown-файли у workspace агента:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Відібрані довгострокові нотатки в `MEMORY.md` (лише для main/private sessions)

    OpenClaw також виконує **тихий flush пам’яті перед Compaction**, щоб нагадати моделі
    записати стійкі нотатки перед автоматичним Compaction. Це виконується лише тоді, коли workspace
    доступний для запису (read-only sandbox це пропускають). Див. [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Пам’ять постійно щось забуває. Як зробити, щоб це зберігалося?">
    Попросіть бота **записати факт у пам’ять**. Довгострокові нотатки мають бути в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це все ще напрям, який ми покращуємо. Корисно нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона продовжує забувати, перевірте, що Gateway використовує той самий
    workspace під час кожного запуску.

    Документація: [Пам’ять](/uk/concepts/memory), [Workspace агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Чи зберігається пам’ять назавжди? Які є обмеження?">
    Файли пам’яті живуть на диску й зберігаються, доки ви їх не видалите. Обмеженням є ваше
    сховище, а не модель. **Контекст сесії** все одно обмежений вікном контексту моделі,
    тому довгі розмови можуть ущільнюватися або обрізатися. Саме тому існує
    пошук у пам’яті — він повертає в контекст лише релевантні частини.

    Документація: [Пам’ять](/uk/concepts/memory), [Контекст](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потрібен ключ OpenAI API для семантичного пошуку в пам’яті?">
    Лише якщо ви використовуєте **embeddings OpenAI**. OAuth Codex покриває chat/completions і
    **не** надає доступу до embeddings, тому **вхід через Codex (OAuth або
    вхід через CLI Codex)** не допомагає для семантичного пошуку в пам’яті. Для embeddings OpenAI
    усе одно потрібен справжній API key (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви явно не задаєте провайдера, OpenClaw автоматично вибирає провайдера, коли
    може визначити API key (auth-профілі, `models.providers.*.apiKey` або env vars).
    Він надає перевагу OpenAI, якщо визначається ключ OpenAI, інакше Gemini, якщо визначається ключ Gemini,
    далі Voyage, потім Mistral. Якщо віддалений ключ недоступний, пошук у пам’яті
    залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштовано локальний шлях до моделі
    і він наявний, OpenClaw
    надає перевагу `local`. Ollama підтримується, якщо ви явно задаєте
    `memorySearch.provider = "ollama"`.

    Якщо ви хочете залишитися локально, задайте `memorySearch.provider = "local"` (і за бажанням
    `memorySearch.fallback = "none"`). Якщо вам потрібні embeddings Gemini, задайте
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо embedding-моделі **OpenAI, Gemini, Voyage, Mistral, Ollama або local** —
    див. [Пам’ять](/uk/concepts/memory) для деталей налаштування.

  </Accordion>
</AccordionGroup>

## Де що зберігається на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, що використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні служби все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** sessions, файли пам’яті, конфігурація та workspace живуть на хості Gateway
      (`~/.openclaw` + каталог вашого workspace).
    - **Віддалено за необхідністю:** повідомлення, які ви надсилаєте провайдерам моделей (Anthropic/OpenAI тощо), надходять до
      їхніх API, а платформи чатів (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на
      своїх серверах.
    - **Ви контролюєте слід:** використання локальних моделей залишає prompts на вашій машині, але трафік
      каналів усе одно проходить через сервери відповідного каналу.

    Пов’язане: [Workspace агента](/uk/concepts/agent-workspace), [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе зберігається в `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Path                                                            | Призначення                                                        |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основна конфігурація (JSON5)                                       |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Імпорт застарілого OAuth (копіюється в auth-профілі під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth-профілі (OAuth, API keys та необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язкове файлове сховище секретів для провайдерів `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Файл сумісності із застарілими версіями (статичні записи `api_key` очищені) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдера (наприклад `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан для кожного агента окремо (agentDir + sessions)               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і стан (для кожного агента)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані сесій (для кожного агента)                                |

    Застарілий шлях для одного агента: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`).

    Ваш **workspace** (`AGENTS.md`, файли пам’яті, skills тощо) відокремлений і налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають зберігатися AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли живуть у **workspace агента**, а не в `~/.openclaw`.

    - **Workspace (для кожного агента):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (або застарілий запасний варіант `memory.md`, коли `MEMORY.md` відсутній),
      `memory/YYYY-MM-DD.md`, необов’язковий `HEARTBEAT.md`.
    - **Каталог стану (`~/.openclaw`)**: конфігурація, стан channel/provider, auth-профілі, sessions, логи
      і спільні skills (`~/.openclaw/skills`).

    Типовий workspace: `~/.openclaw/workspace`, налаштовується через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот "забуває" після перезапуску, переконайтеся, що Gateway використовує той самий
    workspace під час кожного запуску (і пам’ятайте: у віддаленому режимі використовується workspace **хоста gateway**,
    а не вашого локального ноутбука).

    Порада: якщо ви хочете стійку поведінку або налаштування, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладатися на історію чату.

    Див. [Workspace агента](/uk/concepts/agent-workspace) і [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Розмістіть свій **workspace агента** в **приватному** git-репозиторії та створюйте його резервні копії десь
    у приватному місці (наприклад, у приватному GitHub). Це збереже пам’ять + файли AGENTS/SOUL/USER
    і дасть змогу пізніше відновити "мислення" помічника.

    **Не** виконуйте commit для будь-чого з `~/.openclaw` (облікові дані, сесії, токени або зашифровані секретні payloads).
    Якщо вам потрібне повне відновлення, окремо робіть резервні копії і workspace, і каталогу стану
    (див. питання про міграцію вище).

    Документація: [Workspace агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окремий посібник: [Видалення](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть агенти працювати поза межами workspace?">
    Так. Workspace — це **типовий cwd** і якір пам’яті, а не жорсткий sandbox.
    Відносні шляхи розв’язуються всередині workspace, але абсолютні шляхи можуть отримувати доступ до інших
    розташувань хоста, якщо sandboxing не ввімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування sandbox для конкретного агента. Якщо ви
    хочете, щоб репозиторій був типовим робочим каталогом, вкажіть `workspace`
    цього агента на корінь репозиторію. Репозиторій OpenClaw — це лише вихідний код; тримайте
    workspace окремо, якщо тільки ви навмисно не хочете, щоб агент працював усередині нього.

    Приклад (репозиторій як типовий cwd):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Віддалений режим: де міститься сховище сесій?">
    Стан сесій належить **хосту gateway**. Якщо ви працюєте у віддаленому режимі, потрібне вам сховище сесій розташоване на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи конфігурації

<AccordionGroup>
  <Accordion title="Який формат конфігурації? Де вона знаходиться?">
    OpenClaw читає необов’язкову конфігурацію **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються відносно безпечні типові значення (включно з типовим workspace `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я задав gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Прив’язки не до loopback **вимагають дійсного шляху auth gateway**. На практиці це означає:

    - auth зі спільним секретом: токен або пароль
    - `gateway.auth.mode: "trusted-proxy"` за правильно налаштованим reverse proxy з awareness identity не на loopback

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Примітки:

    - `gateway.remote.token` / `.password` **самі по собі** не вмикають локальний auth gateway.
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як запасний варіант лише тоді, коли `gateway.auth.*` не задано.
    - Для auth за паролем задайте натомість `gateway.auth.mode: "password"` плюс `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання завершується в закритому режимі (без маскувального запасного варіанту через remote).
    - Конфігурації Control UI зі спільним секретом автентифікуються через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях app/UI). Режими з identity, такі як Tailscale Serve або `trusted-proxy`, натомість використовують заголовки запитів. Уникайте розміщення спільних секретів в URL.
    - При `gateway.auth.mode: "trusted-proxy"` reverse proxy на loopback того ж хоста все одно **не** задовольняють trusted-proxy auth. Trusted proxy має бути налаштованим джерелом не на loopback.

  </Accordion>

  <Accordion title="Чому тепер мені потрібен токен на localhost?">
    OpenClaw примусово застосовує auth gateway за замовчуванням, включно з loopback. У звичайному типовому шляху це означає auth за токеном: якщо явний шлях auth не налаштовано, запуск gateway переходить у режим токена й автоматично генерує його, зберігаючи в `gateway.auth.token`, тож **локальні WS-клієнти мають автентифікуватися**. Це блокує інші локальні процеси від виклику Gateway.

    Якщо ви віддаєте перевагу іншому шляху auth, можна явно вибрати режим пароля (або, для reverse proxy з awareness identity не на loopback, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно задайте `gateway.auth.mode: "none"` у своїй конфігурації. Doctor може згенерувати токен для вас у будь-який момент: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни конфігурації?">
    Gateway стежить за конфігурацією і підтримує гаряче перезавантаження:

    - `gateway.reload.mode: "hybrid"` (типово): безпечно застосовує зміни на гарячу, перезапускає для критичних
    - також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Як вимкнути кумедні слогани в CLI?">
    Задайте `cli.banner.taglineMode` у конфігурації:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: приховує текст слогана, але залишає рядок назви/версії банера.
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: обертові кумедні/сезонні слогани (типова поведінка).
    - Якщо ви не хочете банер узагалі, задайте env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути web search (і web fetch)?">
    `web_fetch` працює без API key. `web_search` залежить від вибраного
    провайдера:

    - Провайдери на основі API, такі як Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, потребують звичайного налаштування API key.
    - Ollama Web Search не потребує ключа, але використовує налаштований хост Ollama і вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна інтеграція на основі HTML.
    - SearXNG не потребує ключа/може бути self-hosted; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Рекомендовано:** запустіть `openclaw configure --section web` і виберіть провайдера.
    Альтернативи через середовище:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` або `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` або `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` або `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // необов’язково; пропустіть для auto-detect
            },
          },
        },
    }
    ```

    Специфічна для провайдера конфігурація web-search тепер розміщується в `plugins.entries.<plugin>.config.webSearch.*`.
    Застарілі шляхи провайдера `tools.web.search.*` тимчасово все ще завантажуються для сумісності, але їх не слід використовувати для нових конфігурацій.
    Конфігурація запасного варіанта Firecrawl для web-fetch розміщується в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlist, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` увімкнено за замовчуванням (якщо його явно не вимкнено).
    - Якщо `tools.web.fetch.provider` пропущено, OpenClaw автоматично визначає першого готового запасного провайдера fetch із доступних облікових даних. Наразі bundled провайдером є Firecrawl.
    - Демони читають env vars з `~/.openclaw/.env` (або із середовища служби).

    Документація: [Web tools](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мою конфігурацію. Як відновитися й уникнути цього?">
    `config.apply` замінює **всю конфігурацію цілком**. Якщо ви надсилаєте частковий об’єкт, усе
    інше буде видалено.

    Відновлення:

    - Відновіть із резервної копії (git або скопійованого `~/.openclaw/openclaw.json`).
    - Якщо резервної копії немає, знову запустіть `openclaw doctor` і повторно налаштуйте channels/models.
    - Якщо це було неочікувано, створіть bug report і додайте останню відому конфігурацію або будь-яку резервну копію.
    - Локальний агент для кодування часто може відновити працездатну конфігурацію з логів або історії.

    Як уникнути:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивного редагування.
    - Спочатку використовуйте `config.schema.lookup`, коли ви не впевнені в точному шляху або формі поля; він повертає вузол неглибокої схеми плюс підсумки безпосередніх дочірніх елементів для подальшого заглиблення.
    - Використовуйте `config.patch` для часткових редагувань через RPC; залишайте `config.apply` лише для повної заміни конфігурації.
    - Якщо ви використовуєте owner-only інструмент `gateway` із запуску agent, він усе одно відхилятиме записи в `tools.exec.ask` / `tools.exec.security` (включно із застарілими псевдонімами `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими workers на різних пристроях?">
    Поширений шаблон — **один Gateway** (наприклад Raspberry Pi) плюс **nodes** і **agents**:

    - **Gateway (центральний):** володіє channels (Signal/WhatsApp), маршрутизацією та сесіями.
    - **Nodes (пристрої):** Mac/iOS/Android підключаються як периферія та надають локальні інструменти (`system.run`, `canvas`, `camera`).
    - **Agents (workers):** окремі інтелекти/workspaces для спеціальних ролей (наприклад "Hetzner ops", "Personal data").
    - **Sub-agents:** запускають фонову роботу з основного agent, коли вам потрібен паралелізм.
    - **TUI:** підключається до Gateway і перемикає agents/sessions.

    Документація: [Nodes](/uk/nodes), [Віддалений доступ](/uk/gateway/remote), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Чи може браузер OpenClaw працювати в headless-режимі?">
    Так. Це параметр конфігурації:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Типове значення — `false` (з інтерфейсом). Headless-режим частіше викликає anti-bot перевірки на деяких сайтах. Див. [Браузер](/uk/tools/browser).

    Headless використовує **той самий рушій Chromium** і працює для більшості сценаріїв автоматизації (форми, кліки, скрапінг, логіни). Основні відмінності:

    - Немає видимого вікна браузера (використовуйте знімки екрана, якщо вам потрібна візуалізація).
    - Деякі сайти суворіше ставляться до автоматизації в headless-режимі (CAPTCHA, anti-bot).
      Наприклад, X/Twitter часто блокує headless-сеанси.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування браузером?">
    Задайте `browser.executablePath` для вашого бінарного файлу Brave (або будь-якого браузера на основі Chromium) і перезапустіть Gateway.
    Див. повні приклади конфігурації в [Браузер](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway і nodes

<AccordionGroup>
  <Accordion title="Як команди проходять між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає agent і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен інструмент Node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідного трафіку провайдера; вони отримують лише виклики node RPC.

  </Accordion>

  <Accordion title="Як мій agent може отримати доступ до мого комп’ютера, якщо Gateway розміщено віддалено?">
    Коротка відповідь: **підключіть свій комп’ютер як Node**. Gateway працює в іншому місці, але він може
    викликати інструменти `node.*` (екран, камера, система) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на постійно ввімкненому хості (VPS/домашній сервер).
    2. Додайте хост Gateway і ваш комп’ютер до однієї tailnet.
    3. Переконайтеся, що Gateway WS доступний (прив’язка tailnet або SSH tunnel).
    4. Відкрийте застосунок macOS локально й підключіться в режимі **Remote over SSH** (або напряму через tailnet),
       щоб він міг зареєструватися як Node.
    5. Схваліть Node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP bridge не потрібен; nodes підключаються через Gateway WebSocket.

    Нагадування щодо безпеки: підключення macOS Node дозволяє `system.run` на цій машині. Підключайте
    лише пристрої, яким довіряєте, і перегляньте [Безпека](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Протокол Gateway](/uk/gateway/protocol), [Віддалений режим macOS](/uk/platforms/mac/remote), [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключено, але я не отримую відповідей. Що робити?">
    Перевірте базові речі:

    - Gateway запущено: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан каналів: `openclaw channels status`

    Потім перевірте auth і маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` налаштовано правильно.
    - Якщо ви підключаєтеся через SSH tunnel, переконайтеся, що локальний tunnel активний і вказує на правильний порт.
    - Переконайтеся, що ваші allowlist (DM або група) містять ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Віддалений доступ](/uk/gateway/remote), [Channels](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два екземпляри OpenClaw спілкуватися між собою (локальний + VPS)?">
    Так. Вбудованого мосту "бот-до-бота" немає, але це можна організувати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний канал чату, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Bot A надішле повідомлення Bot B, а тоді Bot B відповість як зазвичай.

    **CLI-міст (універсальний):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючись на чат, де слухає інший бот.
    Якщо один бот працює на віддаленому VPS, спрямуйте свій CLI на цей віддалений Gateway
    через SSH/Tailscale (див. [Віддалений доступ](/uk/gateway/remote)).

    Приклад шаблону (запускається з машини, яка може дістатися до цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте запобіжник, щоб два боти не зациклилися безкінечно (лише згадки, channel
    allowlist або правило "не відповідати на повідомлення ботів").

    Документація: [Віддалений доступ](/uk/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох agents?">
    Ні. Один Gateway може хостити кілька agents, кожен із власним workspace, типовими моделями
    та маршрутизацією. Це нормальний варіант налаштування, і він значно дешевший і простіший, ніж запуск
    окремого VPS для кожного agent.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні конфігурації, які ви не хочете ділити. В інших випадках залишайте один Gateway і
    використовуйте кілька agents або sub-agents.

  </Accordion>

  <Accordion title="Чи є перевага у використанні Node на моєму особистому ноутбуці замість SSH із VPS?">
    Так — nodes є основним способом доступу до вашого ноутбука з віддаленого Gateway, і вони
    відкривають більше, ніж просто доступ до оболонки. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким, тож типовий варіант — це постійно ввімкнений хост плюс ваш ноутбук як Node
    (підійде невеликий VPS або пристрій класу Raspberry Pi; 4 GB RAM більш ніж достатньо).

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до Gateway WebSocket і використовують pairing пристроїв.
    - **Безпечніший контроль виконання.** `system.run` обмежується allowlist/схваленнями Node на цьому ноутбуці.
    - **Більше інструментів пристрою.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна автоматизація браузера.** Тримайте Gateway на VPS, але запускайте Chrome локально через хост Node на ноутбуці або підключайтеся до локального Chrome на хості через Chrome MCP.

    SSH підходить для епізодичного доступу до оболонки, але nodes простіші для постійних agent-workflow
    та автоматизації пристроїв.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають nodes службу gateway?">
    Ні. На одному хості має працювати лише **один gateway**, якщо тільки ви навмисно не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)). Nodes — це периферійні пристрої, які підключаються
    до gateway (nodes на iOS/Android або macOS у "режимі Node" в menubar app). Для headless-хостів Node
    і керування через CLI див. [Node host CLI](/cli/node).

    Для змін `gateway`, `discovery` і `canvasHost` потрібен повний перезапуск.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати конфігурацію?">
    Так.

    - `config.schema.lookup`: перевірити одне піддерево конфігурації з його неглибоким вузлом схеми, відповідною UI-підказкою та зведеннями безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний знімок + hash
    - `config.patch`: безпечне часткове оновлення (рекомендовано для більшості RPC-редагувань); по можливості гаряче перезавантажує, а коли потрібно — перезапускає
    - `config.apply`: перевіряє й замінює всю конфігурацію; по можливості гаряче перезавантажує, а коли потрібно — перезапускає
    - owner-only runtime tool `gateway` усе одно відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

  </Accordion>

  <Accordion title="Мінімальна адекватна конфігурація для першого встановлення">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Це задає ваш workspace і обмежує, хто може активувати бота.

  </Accordion>

  <Accordion title="Як налаштувати Tailscale на VPS і підключитися з Mac?">
    Мінімальні кроки:

    1. **Встановіть і увійдіть на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Встановіть і увійдіть на Mac**
       - Використайте застосунок Tailscale і увійдіть у ту саму tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - У консолі адміністратора Tailscale увімкніть MagicDNS, щоб VPS мав стабільне ім’я.
    4. **Використовуйте ім’я хоста tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо ви хочете Control UI без SSH, використовуйте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це залишає gateway прив’язаним до loopback і відкриває HTTPS через Tailscale. Див. [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="Як підключити Mac Node до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Gateway Control UI + WS**. Nodes підключаються через ту саму кінцеву точку Gateway WS.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS і Mac знаходяться в одній tailnet**.
    2. **Використовуйте застосунок macOS у віддаленому режимі** (ціллю SSH може бути ім’я хоста tailnet).
       Застосунок прокине порт Gateway через tunnel і підключиться як Node.
    3. **Схваліть Node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Протокол Gateway](/uk/gateway/protocol), [Виявлення](/uk/gateway/discovery), [Віддалений режим macOS](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи варто встановлювати на другий ноутбук чи просто додати Node?">
    Якщо вам потрібні лише **локальні інструменти** (screen/camera/exec) на другому ноутбуці, додайте його як
    **Node**. Це залишає один Gateway і дозволяє уникнути дублювання конфігурації. Локальні інструменти Node
    наразі доступні лише на macOS, але ми плануємо розширити їх на інші ОС.

    Встановлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes), [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Змінні середовища та завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує змінні середовища?">
    OpenClaw читає env vars із батьківського процесу (shell, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` з поточного робочого каталогу
    - глобальний запасний `.env` з `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден із `.env`-файлів не перевизначає наявні env vars.

    Ви також можете визначати вбудовані env vars у конфігурації (застосовуються лише якщо їх немає в env процесу):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Див. [/environment](/uk/help/environment) для повного порядку пріоритету та джерел.

  </Accordion>

  <Accordion title="Я запустив Gateway через службу, і мої env vars зникли. Що тепер?">
    Є два поширені виправлення:

    1. Розмістіть відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися, навіть коли служба не успадковує env вашої оболонки.
    2. Увімкніть імпорт оболонки (зручність за явною згодою):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Це запускає вашу login shell і імпортує лише відсутні очікувані ключі (ніколи не перевизначає). Еквіваленти env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Я задав COPILOT_GITHUB_TOKEN, але models status показує "Shell env: off." Чому?'>
    `openclaw models status` повідомляє, чи ввімкнено **імпорт env оболонки**. "Shell env: off"
    **не** означає, що ваші env vars відсутні — це лише означає, що OpenClaw не завантажуватиме
    вашу login shell автоматично.

    Якщо Gateway працює як служба (launchd/systemd), він не успадковує середовище
    вашої оболонки. Виправити можна одним із таких способів:

    1. Розмістіть токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або увімкніть імпорт оболонки (`env.shellEnv.enabled: true`).
    3. Або додайте його в блок `env` вашої конфігурації (застосовується лише якщо значення відсутнє).

    Потім перезапустіть gateway і перевірте ще раз:

    ```bash
    openclaw models status
    ```

    Токени Copilot читаються з `COPILOT_GITHUB_TOKEN` (також `GH_TOKEN` / `GITHUB_TOKEN`).
    Див. [/concepts/model-providers](/uk/concepts/model-providers) і [/environment](/uk/help/environment).

  </Accordion>
</AccordionGroup>

## Сесії та кілька чатів

<AccordionGroup>
  <Accordion title="Як почати нову розмову?">
    Надішліть `/new` або `/reset` окремим повідомленням. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>

  <Accordion title="Чи сесії автоматично скидаються, якщо я ніколи не надсилаю /new?">
    Сесії можуть завершуватися після `session.idleMinutes`, але це **вимкнено за замовчуванням** (типове значення **0**).
    Задайте додатне значення, щоб увімкнути завершення за неактивністю. Коли це ввімкнено, **наступне**
    повідомлення після періоду неактивності починає новий id сесії для цього ключа чату.
    Це не видаляє стенограми — просто починає нову сесію.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб створити команду екземплярів OpenClaw (один CEO і багато агентів)?">
    Так, через **маршрутизацію multi-agent** і **sub-agents**. Ви можете створити одного координуючого
    agent і кількох робочих agents із власними workspaces і моделями.

    Тим не менш, на це краще дивитися як на **цікавий експеримент**. Це дуже
    затратне за токенами й часто менш ефективне, ніж використання одного бота з окремими сесіями. Типова модель, яку
    ми уявляємо, — це один бот, з яким ви спілкуєтеся, з різними сесіями для паралельної роботи. Цей
    бот також може запускати sub-agents за потреби.

    Документація: [Маршрутизація multi-agent](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст обрізався посеред задачі? Як цьому запобігти?">
    Контекст сесії обмежений вікном моделі. Довгі чати, великі виводи інструментів або багато
    файлів можуть викликати Compaction або обрізання.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими задачами, а `/new` — під час зміни тем.
    - Зберігайте важливий контекст у workspace і просіть бота знову його прочитати.
    - Використовуйте sub-agents для довгої або паралельної роботи, щоб основний чат залишався меншим.
    - Виберіть модель із більшим вікном контексту, якщо це трапляється часто.

  </Accordion>

  <Accordion title="Як повністю скинути OpenClaw, але залишити його встановленим?">
    Використовуйте команду скидання:

    ```bash
    openclaw reset
    ```

    Неінтерактивне повне скидання:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Потім знову запустіть налаштування:

    ```bash
    openclaw onboard --install-daemon
    ```

    Примітки:

    - Onboarding також пропонує **Reset**, якщо бачить наявну конфігурацію. Див. [Onboarding (CLI)](/uk/start/wizard).
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скиньте кожен каталог стану (типово це `~/.openclaw-<profile>`).
    - Скидання для dev: `openclaw gateway --dev --reset` (лише для dev; стирає конфігурацію dev + облікові дані + сесії + workspace).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або ущільнити?'>
    Використайте один із цих варіантів:

    - **Compaction** (зберігає розмову, але підсумовує старіші ходи):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб спрямувати підсумок.

    - **Скидання** (новий id сесії для того самого ключа чату):

      ```
      /new
      /reset
      ```

    Якщо це продовжує траплятися:

    - Увімкніть або налаштуйте **очищення сесії** (`agents.defaults.contextPruning`), щоб обрізати старий вивід інструментів.
    - Використовуйте модель із більшим вікном контексту.

    Документація: [Compaction](/uk/concepts/compaction), [Очищення сесії](/uk/concepts/session-pruning), [Керування сесіями](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка валідації провайдера: модель вивела блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що історія сесії застаріла або пошкоджена (часто після довгих тредів
    або зміни інструмента/схеми).

    Виправлення: почніть нову сесію за допомогою `/new` (окремим повідомленням).

  </Accordion>

  <Accordion title="Чому я отримую heartbeat-повідомлення кожні 30 хвилин?">
    Heartbeat запускається кожні **30m** за замовчуванням (**1h** під час використання OAuth auth). Налаштуйте або вимкніть його:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // або "0m", щоб вимкнути
          },
        },
      },
    }
    ```

    Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та markdown-заголовки
    на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб заощадити виклики API.
    Якщо файл відсутній, heartbeat усе одно виконується, і модель вирішує, що робити.

    Перевизначення для конкретного agent використовують `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "акаунт бота" до групи WhatsApp?'>
    Ні. OpenClaw працює на **вашому власному обліковому записі**, тож якщо ви є в групі, OpenClaw може її бачити.
    За замовчуванням відповіді в групах заблоковано, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

    Якщо ви хочете, щоб активувати відповіді в групі могли лише **ви**:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Як отримати JID групи WhatsApp?">
    Варіант 1 (найшвидший): перегляньте хвіст логів і надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Шукайте `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/додано до allowlist): перелічіть групи з конфігурації:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/cli/directory), [Логи](/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Дві поширені причини:

    - Увімкнено gating за згадкою (типово). Ви маєте @згадати бота (або збігтися з `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і цю групу не додано до allowlist.

    Див. [Групи](/uk/channels/groups) і [Повідомлення в групах](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи групи/треди ділять контекст із DM?">
    Прямі чати за замовчуванням згортаються до основної сесії. Групи/канали мають власні ключі сесій, а теми Telegram / треди Discord є окремими сесіями. Див. [Групи](/uk/channels/groups) і [Повідомлення в групах](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки workspaces і agents я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але зважайте на таке:

    - **Зростання диска:** sessions + стенограми живуть у `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартість токенів:** більше agents означає більше одночасного використання моделі.
    - **Операційні витрати:** auth-профілі, workspaces і маршрутизація каналів для кожного agent окремо.

    Поради:

    - Тримайте один **активний** workspace на agent (`agents.defaults.workspace`).
    - Очищуйте старі сесії (видаляйте JSONL або записи сховища), якщо диск розростається.
    - Використовуйте `openclaw doctor`, щоб виявляти stray workspaces і невідповідності профілів.

  </Accordion>

  <Accordion title="Чи можу я одночасно запускати кількох ботів або чати (Slack), і як це краще налаштувати?">
    Так. Використовуйте **Маршрутизацію Multi-Agent**, щоб запускати кількох ізольованих agents і маршрутизувати вхідні повідомлення за
    каналом/обліковим записом/peer. Slack підтримується як канал і може бути прив’язаний до конкретних agents.

    Доступ до браузера є потужним, але це не "зробити все, що може людина" — anti-bot, CAPTCHA і MFA
    усе ще можуть блокувати автоматизацію. Для найнадійнішого керування браузером використовуйте локальний Chrome MCP на хості
    або CDP на машині, яка реально запускає браузер.

    Найкраща практика налаштування:

    - Хост Gateway, який завжди ввімкнений (VPS/Mac mini).
    - Один agent на роль (прив’язки).
    - Канал(и) Slack, прив’язані до цих agents.
    - Локальний браузер через Chrome MCP або Node, коли це потрібно.

    Документація: [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Браузер](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі: типові значення, вибір, псевдоніми, перемикання

<AccordionGroup>
  <Accordion title='Що таке "модель за замовчуванням"?'>
    Типова модель OpenClaw — це те, що ви задаєте як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються як `provider/model` (приклад: `openai/gpt-5.4`). Якщо ви пропускаєте провайдера, OpenClaw спочатку пробує псевдонім, потім унікальний збіг налаштованого провайдера для цього точного id моделі і лише потім повертається до налаштованого провайдера за замовчуванням як застарілого шляху сумісності. Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw повертається до першого налаштованого провайдера/моделі замість показу застарілого типового значення від видаленого провайдера. Вам усе одно слід **явно** задавати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендоване типове значення:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    **Для agents з інструментами або з недовіреним вхідним вмістом:** віддавайте перевагу силі моделі над вартістю.
    **Для рутинних/невисокоризикових чатів:** використовуйте дешевші резервні моделі та маршрутизуйте за роллю agent.

    Для MiniMax є окрема документація: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Правило великого пальця: використовуйте **найкращу модель, яку можете собі дозволити** для задач із високими ставками, і дешевшу
    модель для рутинних чатів або підсумків. Ви можете маршрутизувати моделі для кожного agent окремо й використовувати sub-agents для
    паралелізації довгих задач (кожен sub-agent споживає токени). Див. [Моделі](/uk/concepts/models) і
    [Sub-agents](/uk/tools/subagents).

    Сильне попередження: слабші/надмірно квантизовані моделі вразливіші до prompt
    injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі без стирання конфігурації?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни конфігурації.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для сесії)
    - `openclaw models set ...` (оновлює лише конфігурацію моделі)
    - `openclaw configure --section model` (інтерактивно)
    - відредагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` з частковим об’єктом, якщо тільки ви не хочете замінити всю конфігурацію.
    Для RPC-редагувань спочатку перевіряйте через `config.schema.lookup` і віддавайте перевагу `config.patch`. Payload lookup дає вам нормалізований шлях, документацію/обмеження неглибокої схеми та зведення безпосередніх дочірніх елементів
    для часткових оновлень.
    Якщо ви все ж перезаписали конфігурацію, відновіть її з резервної копії або знову запустіть `openclaw doctor` для виправлення.

    Документація: [Моделі](/uk/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати self-hosted моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Встановіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо ви хочете також хмарні моделі, виконайте `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає вам хмарні моделі плюс ваші локальні моделі Ollama
    - хмарні моделі, як-от `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі вразливіші до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все ж хочете малі моделі, увімкніть sandboxing і строгі allowlist інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Провайдери моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Ізоляція](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися й змінюватися з часом; фіксованої рекомендації щодо провайдера немає.
    - Перевіряйте поточне runtime-налаштування на кожному gateway через `openclaw models status`.
    - Для чутливих до безпеки agents з інструментами використовуйте найсильнішу доступну модель останнього покоління.
  </Accordion>

  <Accordion title="Як перемикати моделі на льоту (без перезапуску)?">
    Використовуйте команду `/model` як окреме повідомлення:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Це вбудовані псевдоніми. Власні псевдоніми можна додати через `agents.defaults.models`.

    Ви можете перелічити доступні моделі за допомогою `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований вибір. Вибір за номером:

    ```
    /model 3
    ```

    Ви також можете примусово задати конкретний auth-профіль для провайдера (на рівні сесії):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який agent активний, який файл `auth-profiles.json` використовується та який auth-профіль буде спробовано наступним.
    Він також показує налаштований endpoint провайдера (`baseUrl`) і режим API (`api`), коли вони доступні.

    **Як зняти закріплення профілю, який я задав через @profile?**

    Повторно виконайте `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо ви хочете повернутися до типового значення, виберіть його в `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який auth-профіль активний.

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.2 для щоденних задач і Codex 5.3 для кодування?">
    Так. Задайте одну як типову і перемикайте за потреби:

    - **Швидке перемикання (на рівні сесії):** `/model gpt-5.4` для щоденних задач, `/model openai-codex/gpt-5.4` для кодування з Codex OAuth.
    - **Типова + перемикання:** задайте `agents.defaults.model.primary` як `openai/gpt-5.4`, а потім перемикайтеся на `openai-codex/gpt-5.4` під час кодування (або навпаки).
    - **Sub-agents:** маршрутизуйте задачі кодування до sub-agents з іншою типовою моделлю.

    Див. [Моделі](/uk/concepts/models) і [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати fast mode для GPT 5.4?">
    Використовуйте або перемикач для сесії, або типове значення в конфігурації:

    - **Для сесії:** надішліть `/fast on`, поки сесія використовує `openai/gpt-5.4` або `openai-codex/gpt-5.4`.
    - **Типове значення для моделі:** задайте `agents.defaults.models["openai/gpt-5.4"].params.fastMode` як `true`.
    - **Також для Codex OAuth:** якщо ви також використовуєте `openai-codex/gpt-5.4`, задайте той самий прапорець і там.

    Приклад:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Для OpenAI fast mode відображається в `service_tier = "priority"` у підтримуваних нативних запитах Responses. Сесійне `/fast` має пріоритет над типовими значеннями конфігурації.

    Див. [Мислення та fast mode](/uk/tools/thinking) і [Fast mode OpenAI](/uk/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім не отримую відповіді?'>
    Якщо задано `agents.defaults.models`, це стає **allowlist** для `/model` і будь-яких
    перевизначень на рівні сесії. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, приберіть allowlist або виберіть модель із `/model list`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **провайдера не налаштовано** (не знайдено конфігурацію провайдера MiniMax або auth-профіль),
    тому модель не вдається розв’язати.

    Контрольний список виправлення:

    1. Оновіться до поточного релізу OpenClaw (або запускайте з вихідного коду `main`), а потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (майстер або JSON), або що auth MiniMax
       існує в env/auth-профілях, щоб можна було вставити відповідний провайдер
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений MiniMax
       OAuth для `minimax-portal`).
    3. Використовуйте точний id моделі (з урахуванням регістру) для вашого шляху auth:
       `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed` для
       налаштування через API key, або `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` для налаштування через OAuth.
    4. Виконайте:

       ```bash
       openclaw models list
       ```

       і виберіть зі списку (або `/model list` у чаті).

    Див. [MiniMax](/uk/providers/minimax) і [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати MiniMax як типову модель, а OpenAI — для складних задач?">
    Так. Використовуйте **MiniMax як типову модель** і перемикайте моделі **на рівні сесії** за потреби.
    Резервні варіанти призначені для **помилок**, а не для "складних задач", тож використовуйте `/model` або окремого agent.

    **Варіант A: перемикання на рівні сесії**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Потім:

    ```
    /model gpt
    ```

    **Варіант B: окремі agents**

    - Типове значення Agent A: MiniMax
    - Типове значення Agent B: OpenAI
    - Маршрутизуйте за agent або використовуйте `/agent` для перемикання

    Документація: [Моделі](/uk/concepts/models), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома типовими скороченнями (застосовуються лише тоді, коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви задасте власний псевдонім із тим самим ім’ям, ваше значення матиме пріоритет.

  </Accordion>

  <Accordion title="Як визначити/перевизначити скорочення моделей (псевдоніми)?">
    Псевдоніми беруться з `agents.defaults.models.<modelId>.alias`. Приклад:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Тоді `/model sonnet` (або `/<alias>`, коли це підтримується) розв’язується в цей id моделі.

  </Accordion>

  <Accordion title="Як додати моделі від інших провайдерів, як-от OpenRouter або Z.AI?">
    OpenRouter (оплата за токени; багато моделей):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (моделі GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Якщо ви посилаєтесь на `provider/model`, але потрібний ключ провайдера відсутній, ви отримаєте помилку auth під час виконання (наприклад `No API key found for provider "zai"`).

    **Не знайдено API key для провайдера після додавання нового agent**

    Зазвичай це означає, що **новий agent** має порожнє сховище auth. Auth є прив’язаним до agent і
    зберігається тут:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Виконайте `openclaw agents add <id>` і налаштуйте auth під час майстра.
    - Або скопіюйте `auth-profiles.json` з `agentDir` основного agent до `agentDir` нового agent.

    **Не** використовуйте спільний `agentDir` для кількох agents; це спричиняє колізії auth/сесій.

  </Accordion>
</AccordionGroup>

## Резервне перемикання моделей і "All models failed"

<AccordionGroup>
  <Accordion title="Як працює резервне перемикання?">
    Резервне перемикання відбувається у два етапи:

    1. **Ротація auth-профілів** у межах одного провайдера.
    2. **Резервна модель** до наступної моделі в `agents.defaults.model.fallbacks`.

    Для профілів, що дають збої, застосовуються cooldown (експоненційний backoff), тому OpenClaw може продовжувати відповідати, навіть коли провайдер обмежений rate limit або тимчасово не працює.

    Кошик rate limit включає більше, ніж просто відповіді `429`. OpenClaw
    також вважає такими, що заслуговують резервного перемикання, повідомлення на кшталт `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    обмеження вікна використання (`weekly/monthly limit reached`).

    Деякі відповіді, схожі на білінгові, не є `402`, і деякі відповіді HTTP `402`
    також залишаються в цьому транзитному кошику. Якщо провайдер повертає
    явний білінговий текст на `401` або `403`, OpenClaw усе одно може залишити це
    в білінговому напрямку, але специфічні для провайдера текстові збіги залишаються обмеженими
    провайдером, якому вони належать (наприклад OpenRouter `Key limit exceeded`). Якщо повідомлення `402`
    натомість схоже на повторюване вікно використання або
    ліміт витрат organization/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw трактує це як
    `rate_limit`, а не як довготривале відключення через білінг.

    Помилки переповнення контексту — інші: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху Compaction/повторної спроби замість переходу до
    резервної моделі.

    Загальний текст серверних помилок навмисно вужчий, ніж "усе, де є
    unknown/error". OpenClaw вважає такими, що заслуговують резервного перемикання, тимчасові форми в межах провайдера,
    як-от Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, помилки stop-reason, як-от `Unhandled stop reason:
    error`, JSON-повідомлення `api_error` із тимчасовим серверним текстом
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості провайдера, як-от `ModelNotReadyException`, як сигнали timeout/overloaded,
    якщо контекст провайдера збігається.
    Загальний внутрішній текст резервного варіанта на кшталт `LLM request failed with an unknown
    error.` лишається консервативним і сам по собі не запускає резервне перемикання моделі.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система намагалася використати id auth-профілю `anthropic:default`, але не змогла знайти для нього облікові дані в очікуваному сховищі auth.

    **Контрольний список виправлення:**

    - **Підтвердьте, де живуть auth-профілі** (нові та застарілі шляхи)
      - Поточний: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`)
    - **Підтвердьте, що ваша env var завантажується Gateway**
      - Якщо ви задали `ANTHROPIC_API_KEY` у своїй оболонці, але запускаєте Gateway через systemd/launchd, він може її не успадковувати. Розмістіть її в `~/.openclaw/.env` або увімкніть `env.shellEnv`.
    - **Переконайтеся, що ви редагуєте правильного agent**
      - У середовищах multi-agent може бути кілька файлів `auth-profiles.json`.
    - **Перевірте стан моделі/auth**
      - Використовуйте `openclaw models status`, щоб побачити налаштовані моделі й те, чи автентифіковані провайдери.

    **Контрольний список виправлення для "No credentials found for profile anthropic"**

    Це означає, що виконання закріплене за auth-профілем Anthropic, але Gateway
    не може знайти його у своєму сховищі auth.

    - **Використовуйте Claude CLI**
      - Виконайте `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо ви хочете використовувати API key**
      - Розмістіть `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистьте будь-який закріплений порядок, який примушує використовувати відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Підтвердьте, що ви запускаєте команди на хості gateway**
      - У віддаленому режимі auth-профілі живуть на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому він також спробував Google Gemini і не зміг?">
    Якщо ваша конфігурація моделі включає Google Gemini як резервний варіант (або ви перемкнулися на скорочення Gemini), OpenClaw спробує його під час резервного перемикання моделі. Якщо ви не налаштували облікові дані Google, побачите `No API key found for provider "google"`.

    Виправлення: або надайте auth Google, або приберіть/уникайте моделей Google в `agents.defaults.model.fallbacks` / псевдонімах, щоб резервне перемикання не маршрутизувало туди.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Причина: історія сесії містить **thinking-блоки без підписів** (часто через
    перерваний/частковий стрім). Google Antigravity вимагає підписів для thinking-блоків.

    Виправлення: OpenClaw тепер видаляє непідписані thinking-блоки для Google Antigravity Claude. Якщо це все одно трапляється, почніть **нову сесію** або задайте `/thinking off` для цього agent.

  </Accordion>
</AccordionGroup>

## Auth-профілі: що це таке і як ними керувати

Пов’язане: [/concepts/oauth](/uk/concepts/oauth) (OAuth-потоки, зберігання токенів, шаблони multi-account)

<AccordionGroup>
  <Accordion title="Що таке auth-профіль?">
    Auth-профіль — це іменований запис облікових даних (OAuth або API key), прив’язаний до провайдера. Профілі зберігаються тут:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Які типові id профілів?">
    OpenClaw використовує id з префіксом провайдера, наприклад:

    - `anthropic:default` (поширено, коли немає email-ідентичності)
    - `anthropic:<email>` для OAuth-ідентичностей
    - власні id, які ви обираєте (наприклад `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який auth-профіль пробується першим?">
    Так. Конфігурація підтримує необов’язкові метадані для профілів і порядок для кожного провайдера (`auth.order.<provider>`). Це **не** зберігає секрети; воно зіставляє id з провайдером/режимом і задає порядок ротації.

    OpenClaw може тимчасово пропускати профіль, якщо він перебуває у короткому **cooldown** (rate limits/timeouts/auth failures) або в довшому стані **disabled** (billing/insufficient credits). Щоб перевірити це, запустіть `openclaw models status --json` і подивіться `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Cooldown через rate limit можуть бути прив’язані до моделі. Профіль, який перебуває на cooldown
    для однієї моделі, усе ще може бути придатним для сусідньої моделі того самого провайдера,
    тоді як білінгові/disabled-вікна все одно блокують увесь профіль.

    Ви також можете задати **перевизначення порядку для кожного agent окремо** (зберігається в `auth-state.json` цього agent) через CLI:

    ```bash
    # Типово для налаштованого agent за замовчуванням (опустіть --agent)
    openclaw models auth order get --provider anthropic

    # Зафіксувати ротацію на одному профілі (пробувати лише його)
    openclaw models auth order set --provider anthropic anthropic:default

    # Або задати явний порядок (резервне перемикання в межах провайдера)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Очистити перевизначення (повернутися до config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Щоб націлитися на конкретного agent:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Щоб перевірити, що насправді пробуватиметься, використовуйте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль опущено з явного порядку, probe повідомляє
    `excluded_by_auth_order` для цього профілю замість мовчазної спроби використати його.

  </Accordion>

  <Accordion title="OAuth проти API key — у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за підпискою (де це застосовно).
    - **API keys** використовують білінг pay-per-token.

    Майстер явно підтримує Anthropic Claude CLI, OpenAI Codex OAuth і API keys.

  </Accordion>
</AccordionGroup>

## Gateway: порти, "already running" і віддалений режим

<AccordionGroup>
  <Accordion title="Який порт використовує Gateway?">
    `gateway.port` керує єдиним мультиплексованим портом для WebSocket + HTTP (Control UI, hooks тощо).

    Пріоритет:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Чому openclaw gateway status показує "Runtime: running", але "RPC probe: failed"?'>
    Тому що "running" — це погляд **supervisor** (launchd/systemd/schtasks). RPC probe — це фактичне підключення CLI до gateway WebSocket і виклик `status`.

    Використовуйте `openclaw gateway status` і довіряйте цим рядкам:

    - `Probe target:` (URL, який probe реально використав)
    - `Listening:` (що реально прив’язано до порту)
    - `Last gateway error:` (поширена першопричина, коли процес живий, але порт не слухає)

  </Accordion>

  <Accordion title='Чому openclaw gateway status показує різні "Config (cli)" і "Config (service)"?'>
    Ви редагуєте один файл конфігурації, тоді як служба використовує інший (часто це невідповідність `--profile` / `OPENCLAW_STATE_DIR`).

    Виправлення:

    ```bash
    openclaw gateway install --force
    ```

    Запустіть це з тим самим `--profile` / середовищем, яке ви хочете, щоб використовувала служба.

  </Accordion>

  <Accordion title='Що означає "another gateway instance is already listening"?'>
    OpenClaw забезпечує runtime-блокування, одразу прив’язуючи прослуховувач WebSocket під час запуску (типово `ws://127.0.0.1:18789`). Якщо прив’язка завершується помилкою `EADDRINUSE`, він викидає `GatewayLockError`, що означає, що інший екземпляр уже слухає.

    Виправлення: зупиніть інший екземпляр, звільніть порт або запускайте з `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Як запускати OpenClaw у віддаленому режимі (клієнт підключається до Gateway в іншому місці)?">
    Задайте `gateway.mode: "remote"` і вкажіть віддалену URL-адресу WebSocket, за потреби з віддаленими обліковими даними спільного секрету:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Примітки:

    - `openclaw gateway` запускається лише тоді, коли `gateway.mode` має значення `local` (або ви передаєте прапорець перевизначення).
    - Застосунок macOS стежить за файлом конфігурації і перемикає режими в реальному часі, коли ці значення змінюються.
    - `gateway.remote.token` / `.password` — це лише облікові дані клієнта для remote; самі по собі вони не вмикають локальний auth gateway.

  </Accordion>

  <Accordion title='Control UI показує "unauthorized" (або постійно перепідключається). Що робити?'>
    Ваш шлях auth gateway і метод auth в UI не збігаються.

    Факти (з коду):

    - Control UI зберігає токен у `sessionStorage` для поточної сесії вкладки браузера та вибраної URL-адреси gateway, тож оновлення в тій самій вкладці продовжують працювати без відновлення довготривалого зберігання токена в localStorage.
    - При `AUTH_TOKEN_MISMATCH` довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном пристрою, коли gateway повертає підказки для повтору (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ця повторна спроба з кешованим токеном тепер повторно використовує кешовані схвалені scopes, збережені разом із токеном пристрою. Явні виклики `deviceToken` / явні `scopes` все одно зберігають свій запитаний набір scopes замість успадкування кешованих scopes.
    - Поза цим шляхом повторної спроби порядок auth для підключення такий: спочатку явний спільний токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap-токен.
    - Перевірки scope bootstrap-токена мають префікси ролей. Вбудований allowlist операторів bootstrap задовольняє лише запити операторів; Node або інші ролі, не пов’язані з оператором, усе одно потребують scopes під власним префіксом ролі.

    Виправлення:

    - Найшвидше: `openclaw dashboard` (виводить + копіює URL-адресу dashboard, намагається відкрити; показує SSH-підказку, якщо середовище без голови).
    - Якщо у вас ще немає токена: `openclaw doctor --generate-gateway-token`.
    - Якщо remote — спочатку підніміть tunnel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`.
    - Режим спільного секрету: задайте `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, а потім вставте відповідний секрет у налаштуваннях Control UI.
    - Режим Tailscale Serve: переконайтеся, що `gateway.auth.allowTailscale` увімкнено і ви відкриваєте URL-адресу Serve, а не сиру loopback/tailnet URL-адресу, яка обходить заголовки identity Tailscale.
    - Режим trusted-proxy: переконайтеся, що ви заходите через налаштований reverse proxy з awareness identity не на loopback, а не через loopback proxy на тому ж хості чи пряму URL-адресу gateway.
    - Якщо невідповідність зберігається після однієї повторної спроби, перевипустіть/повторно схваліть paired токен пристрою:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Якщо виклик rotate каже, що йому відмовлено, перевірте дві речі:
      - paired-device sessions можуть перевипускати лише **власний** пристрій, якщо тільки вони також не мають `operator.admin`
      - явні значення `--scope` не можуть перевищувати поточні scopes оператора викликача
    - Усе ще застрягли? Запустіть `openclaw status --all` і дотримуйтеся [Усунення несправностей](/uk/gateway/troubleshooting). Див. [Dashboard](/web/dashboard) для деталей auth.

  </Accordion>

  <Accordion title="Я задав gateway.bind tailnet, але він не може прив’язатися, і нічого не слухає">
    Прив’язка `tailnet` вибирає Tailscale IP з мережевих інтерфейсів (100.64.0.0/10). Якщо машина не в Tailscale (або інтерфейс вимкнений), прив’язуватися немає до чого.

    Виправлення:

    - Запустіть Tailscale на цьому хості (щоб він мав адресу 100.x), або
    - Перемкніться на `gateway.bind: "loopback"` / `"lan"`.

    Примітка: `tailnet` є явним. `auto` віддає перевагу loopback; використовуйте `gateway.bind: "tailnet"`, коли хочете прив’язку лише до tailnet.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька Gateway на одному хості?">
    Зазвичай ні — один Gateway може запускати кілька каналів обміну повідомленнями та agents. Використовуйте кілька Gateway лише тоді, коли вам потрібна надлишковість (наприклад rescue bot) або жорстка ізоляція.

    Так, але ви маєте ізолювати:

    - `OPENCLAW_CONFIG_PATH` (конфігурація для кожного екземпляра)
    - `OPENCLAW_STATE_DIR` (стан для кожного екземпляра)
    - `agents.defaults.workspace` (ізоляція workspace)
    - `gateway.port` (унікальні порти)

    Швидке налаштування (рекомендовано):

    - Використовуйте `openclaw --profile <name> ...` для кожного екземпляра (автоматично створює `~/.openclaw-<name>`).
    - Задайте унікальний `gateway.port` у конфігурації кожного профілю (або передавайте `--port` для ручних запусків).
    - Встановіть службу для конкретного профілю: `openclaw --profile <name> gateway install`.

    Профілі також додають суфікси до назв служб (`ai.openclaw.<profile>`; застарілі `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Повний посібник: [Кілька Gateway](/uk/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Що означає "invalid handshake" / code 1008?'>
    Gateway — це **сервер WebSocket**, і він очікує, що найперше повідомлення
    буде кадром `connect`. Якщо він отримує щось інше, він закриває з’єднання
    з **code 1008** (порушення політики).

    Поширені причини:

    - Ви відкрили URL-адресу **HTTP** у браузері (`http://...`) замість WS-клієнта.
    - Ви використали неправильний порт або шлях.
    - Proxy або tunnel зрізав заголовки auth або надіслав не-Gateway запит.

    Швидкі виправлення:

    1. Використовуйте URL-адресу WS: `ws://<host>:18789` (або `wss://...`, якщо це HTTPS).
    2. Не відкривайте WS-порт у звичайній вкладці браузера.
    3. Якщо auth увімкнено, включіть токен/пароль у кадр `connect`.

    Якщо ви використовуєте CLI або TUI, URL-адреса має виглядати так:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Деталі протоколу: [Протокол Gateway](/uk/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Логування та налагодження

<AccordionGroup>
  <Accordion title="Де знаходяться логи?">
    Файлові логи (структуровані):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Ви можете задати стабільний шлях через `logging.file`. Рівень файлового логування контролюється `logging.level`. Докладність консолі контролюється `--verbose` і `logging.consoleLevel`.

    Найшвидший перегляд хвоста логів:

    ```bash
    openclaw logs --follow
    ```

    Логи служби/supervisor (коли gateway запускається через launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` і `gateway.err.log` (типово: `~/.openclaw/logs/...`; профілі використовують `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Докладніше див. [Усунення несправностей](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Як запустити/зупинити/перезапустити службу Gateway?">
    Використовуйте допоміжні команди gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви запускаєте gateway вручну, `openclaw gateway --force` може повернути собі порт. Див. [Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Я закрив термінал у Windows — як перезапустити OpenClaw?">
    Є **два режими встановлення у Windows**:

    **1) WSL2 (рекомендовано):** Gateway працює всередині Linux.

    Відкрийте PowerShell, увійдіть у WSL, а потім перезапустіть:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви ніколи не встановлювали службу, запустіть її на передньому плані:

    ```bash
    openclaw gateway run
    ```

    **2) Нативна Windows (не рекомендується):** Gateway працює безпосередньо у Windows.

    Відкрийте PowerShell і виконайте:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви запускаєте його вручну (без служби), використовуйте:

    ```powershell
    openclaw gateway run
    ```

    Документація: [Windows (WSL2)](/uk/platforms/windows), [Інструкція зі служби Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Gateway запущено, але відповіді ніколи не приходять. Що перевірити?">
    Почніть із швидкої перевірки стану:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Поширені причини:

    - Auth моделі не завантажено на **хості gateway** (перевірте `models status`).
    - Pairing/allowlist каналу блокує відповіді (перевірте конфігурацію каналу + логи).
    - WebChat/Dashboard відкрито без правильного токена.

    Якщо ви працюєте віддалено, переконайтеся, що tunnel/Tailscale-з’єднання активне і що
    Gateway WebSocket доступний.

    Документація: [Channels](/uk/channels), [Усунення несправностей](/uk/gateway/troubleshooting), [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — що робити?'>
    Зазвичай це означає, що UI втратив з’єднання WebSocket. Перевірте:

    1. Чи запущений Gateway? `openclaw gateway status`
    2. Чи справний Gateway? `openclaw status`
    3. Чи має UI правильний токен? `openclaw dashboard`
    4. Якщо remote — чи активне з’єднання tunnel/Tailscale?

    Потім перегляньте хвіст логів:

    ```bash
    openclaw logs --follow
    ```

    Документація: [Dashboard](/web/dashboard), [Віддалений доступ](/uk/gateway/remote), [Усунення несправностей](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Помилка Telegram setMyCommands. Що перевірити?">
    Почніть з логів і стану каналу:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Потім зіставте помилку:

    - `BOT_COMMANDS_TOO_MUCH`: у меню Telegram забагато записів. OpenClaw уже обрізає їх до ліміту Telegram і повторює спробу з меншою кількістю команд, але деякі записи меню все одно треба прибрати. Зменште кількість Plugin/skill/custom-команд або вимкніть `channels.telegram.commands.native`, якщо меню вам не потрібне.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` або подібні мережеві помилки: якщо ви на VPS або за proxy, переконайтеся, що вихідний HTTPS дозволений і DNS працює для `api.telegram.org`.

    Якщо Gateway віддалений, переконайтеся, що ви дивитеся логи на хості Gateway.

    Документація: [Telegram](/uk/channels/telegram), [Усунення несправностей каналів](/uk/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI не показує вивід. Що перевірити?">
    Спочатку переконайтеся, що Gateway доступний і agent може виконуватися:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    У TUI використовуйте `/status`, щоб побачити поточний стан. Якщо ви очікуєте відповіді в чат-каналі,
    переконайтеся, що доставку ввімкнено (`/deliver on`).

    Документація: [TUI](/web/tui), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як повністю зупинити, а потім знову запустити Gateway?">
    Якщо ви встановили службу:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Це зупиняє/запускає **керовану службу** (launchd на macOS, systemd на Linux).
    Використовуйте це, коли Gateway працює у фоновому режимі як демон.

    Якщо ви запускаєте у foreground, зупиніть через Ctrl-C, потім:

    ```bash
    openclaw gateway run
    ```

    Документація: [Інструкція зі служби Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Поясніть простими словами: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: перезапускає **фонову службу** (launchd/systemd).
    - `openclaw gateway`: запускає gateway **у foreground** для цієї сесії термінала.

    Якщо ви встановили службу, використовуйте команди gateway. Використовуйте `openclaw gateway`, коли
    хочете одноразовий запуск у foreground.

  </Accordion>

  <Accordion title="Найшвидший спосіб отримати більше деталей, коли щось ламається">
    Запустіть Gateway з `--verbose`, щоб отримати більше деталей у консолі. Потім перевірте лог-файл на помилки auth каналу, маршрутизації моделі та RPC.
  </Accordion>
</AccordionGroup>

## Медіа та вкладення

<AccordionGroup>
  <Accordion title="Мій skill згенерував зображення/PDF, але нічого не було надіслано">
    Вихідні вкладення від agent мають містити рядок `MEDIA:<path-or-url>` (в окремому рядку). Див. [Налаштування помічника OpenClaw](/uk/start/openclaw) і [Agent send](/uk/tools/agent-send).

    Надсилання через CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Також перевірте:

    - Цільовий канал підтримує вихідні медіа й не заблокований allowlist.
    - Файл не перевищує обмежень розміру провайдера (зображення змінюють розмір до максимуму 2048px).
    - `tools.fs.workspaceOnly=true` обмежує надсилання локальних шляхів workspace, temp/media-store та файлами, перевіреними sandbox.
    - `tools.fs.workspaceOnly=false` дозволяє `MEDIA:` надсилати локальні файли хоста, які agent уже може читати, але лише для медіа та безпечних типів документів (зображення, аудіо, відео, PDF і документи Office). Звичайний текст і файли, схожі на секрети, усе одно блокуються.

    Див. [Зображення](/uk/nodes/images).

  </Accordion>
</AccordionGroup>

## Безпека та контроль доступу

<AccordionGroup>
  <Accordion title="Чи безпечно відкривати OpenClaw для вхідних DM?">
    Ставтеся до вхідних DM як до недовіреного вмісту. Типові значення спроєктовано так, щоб зменшити ризик:

    - Типова поведінка на каналах, що підтримують DM, — це **pairing**:
      - Невідомі відправники отримують код pairing; бот не обробляє їхнє повідомлення.
      - Схвалення: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Кількість очікуваних запитів обмежено до **3 на канал**; перевіряйте `openclaw pairing list --channel <channel> [--account <id>]`, якщо код не надійшов.
    - Публічне відкриття DM потребує явної згоди (`dmPolicy: "open"` і allowlist `"*"`).

    Запустіть `openclaw doctor`, щоб виявити ризиковані політики DM.

  </Accordion>

  <Accordion title="Чи є prompt injection проблемою лише для публічних ботів?">
    Ні. Prompt injection стосується **недовіреного вмісту**, а не лише того, хто може написати боту в DM.
    Якщо ваш помічник читає зовнішній вміст (web search/fetch, сторінки браузера, email,
    документи, вкладення, вставлені логи), цей вміст може містити інструкції, які намагаються
    перехопити контроль над моделлю. Це може статися, навіть якщо **ви є єдиним відправником**.

    Найбільший ризик виникає, коли ввімкнені інструменти: модель можна змусити
    витягувати контекст або викликати інструменти від вашого імені. Зменшуйте радіус ураження таким чином:

    - використовуйте "reader" agent лише для читання або без інструментів, щоб підсумовувати недовірений вміст
    - тримайте `web_search` / `web_fetch` / `browser` вимкненими для agents з увімкненими інструментами
    - ставтеся до декодованого тексту файлів/документів також як до недовіреного: OpenResponses
      `input_file` і витягування з медіавкладень обгортають витягнутий текст
      явними маркерами меж зовнішнього вмісту замість передачі сирого тексту файла
    - використовуйте sandboxing і суворі allowlist інструментів

    Деталі: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи повинен мій бот мати власний email, GitHub-акаунт або номер телефону?">
    Так, для більшості налаштувань. Ізоляція бота в окремих облікових записах і номерах телефону
    зменшує радіус ураження, якщо щось піде не так. Це також полегшує ротацію
    облікових даних або відкликання доступу без впливу на ваші особисті облікові записи.

    Починайте з малого. Надавайте доступ лише до тих інструментів і облікових записів, які вам справді потрібні, і розширюйте
    пізніше, якщо знадобиться.

    Документація: [Безпека](/uk/gateway/security), [Pairing](/uk/channels/pairing).

  </Accordion>

  <Accordion title="Чи можу я дати йому автономність над моїми текстовими повідомленнями і чи це безпечно?">
    Ми **не** рекомендуємо повну автономність над вашими особистими повідомленнями. Найбезпечніший шаблон:

    - Тримайте DM у режимі **pairing** або в жорсткому allowlist.
    - Використовуйте **окремий номер або обліковий запис**, якщо хочете, щоб він писав від вашого імені.
    - Нехай він створює чернетку, а потім **схвалюйте перед надсиланням**.

    Якщо хочете експериментувати, робіть це на виділеному обліковому записі та тримайте його ізольованим. Див.
    [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи можу я використовувати дешевші моделі для задач персонального помічника?">
    Так, **якщо** agent лише для чату і вхідні дані довірені. Менші рівні
    більш схильні до перехоплення інструкцій, тому уникайте їх для agents з увімкненими інструментами
    або при читанні недовіреного вмісту. Якщо вам усе ж потрібна менша модель, жорстко обмежте
    інструменти й запускайте всередині sandbox. Див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Я виконав /start у Telegram, але не отримав код pairing">
    Коди pairing надсилаються **лише** тоді, коли невідомий відправник пише боту і
    `dmPolicy: "pairing"` увімкнено. Сам по собі `/start` не генерує код.

    Перевірте запити в очікуванні:

    ```bash
    openclaw pairing list telegram
    ```

    Якщо ви хочете негайний доступ, додайте свій id відправника в allowlist або задайте `dmPolicy: "open"`
    для цього облікового запису.

  </Accordion>

  <Accordion title="WhatsApp: чи буде він писати моїм контактам? Як працює pairing?">
    Ні. Типова політика DM у WhatsApp — **pairing**. Невідомі відправники отримують лише код pairing, а їхнє повідомлення **не обробляється**. OpenClaw відповідає лише на чати, які він отримує, або на явні надсилання, які ви ініціюєте.

    Схвалити pairing:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Перелічити запити в очікуванні:

    ```bash
    openclaw pairing list whatsapp
    ```

    Запит номера телефону в майстрі: він використовується для налаштування вашого **allowlist/owner**, щоб дозволити ваші власні DM. Він не використовується для автоматичного надсилання. Якщо ви запускаєте на своєму особистому номері WhatsApp, використовуйте цей номер і увімкніть `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Команди чату, переривання задач і "він не зупиняється"

<AccordionGroup>
  <Accordion title="Як зробити так, щоб внутрішні системні повідомлення не показувалися в чаті?">
    Більшість внутрішніх або інструментальних повідомлень з’являються лише тоді, коли для цієї сесії ввімкнено **verbose**, **trace** або **reasoning**.

    Виправлення в чаті, де ви це бачите:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Якщо все ще надто шумно, перевірте налаштування сесії в Control UI і встановіть verbose
    у значення **inherit**. Також переконайтеся, що ви не використовуєте профіль бота з `verboseDefault`, встановленим
    у `on` у конфігурації.

    Документація: [Thinking and verbose](/uk/tools/thinking), [Безпека](/uk/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Як зупинити/скасувати виконувану задачу?">
    Надішліть будь-яке з цього **окремим повідомленням** (без слеша):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Це тригери переривання (не slash commands).

    Для фонових процесів (з інструмента exec) ви можете попросити agent виконати:

    ```
    process action:kill sessionId:XXX
    ```

    Огляд slash commands: див. [Slash commands](/uk/tools/slash-commands).

    Більшість команд треба надсилати як **окреме** повідомлення, яке починається з `/`, але кілька скорочень (як-от `/status`) також працюють inline для відправників з allowlist.

  </Accordion>

  <Accordion title='Як надіслати повідомлення Discord із Telegram? ("Cross-context messaging denied")'>
    OpenClaw блокує повідомлення **між різними провайдерами** за замовчуванням. Якщо виклик інструмента прив’язаний
    до Telegram, він не надсилатиме в Discord, якщо ви явно цього не дозволите.

    Увімкніть міжпровайдерні повідомлення для agent:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Після редагування конфігурації перезапустіть gateway.

  </Accordion>

  <Accordion title='Чому здається, що бот "ігнорує" швидку серію повідомлень?'>
    Режим черги керує тим, як нові повідомлення взаємодіють із поточним виконанням. Використовуйте `/queue`, щоб змінити режими:

    - `steer` - нові повідомлення перенаправляють поточну задачу
    - `followup` - повідомлення виконуються по одному
    - `collect` - пакетування повідомлень і одна відповідь (типово)
    - `steer-backlog` - перенаправити зараз, потім обробити накопичене
    - `interrupt` - перервати поточне виконання і почати заново

    Ви можете додавати параметри на кшталт `debounce:2s cap:25 drop:summarize` для режимів followup.

  </Accordion>
</AccordionGroup>

## Різне

<AccordionGroup>
  <Accordion title='Яка типова модель для Anthropic з API key?'>
    В OpenClaw облікові дані та вибір моделі — це окремі речі. Задання `ANTHROPIC_API_KEY` (або збереження ключа Anthropic API в auth-профілях) вмикає автентифікацію, але фактична типова модель — це те, що ви налаштували в `agents.defaults.model.primary` (наприклад `anthropic/claude-sonnet-4-6` або `anthropic/claude-opus-4-6`). Якщо ви бачите `No credentials found for profile "anthropic:default"`, це означає, що Gateway не зміг знайти облікові дані Anthropic в очікуваному `auth-profiles.json` для agent, який виконується.
  </Accordion>
</AccordionGroup>

---

Усе ще застрягли? Запитайте в [Discord](https://discord.com/invite/clawd) або відкрийте [обговорення GitHub](https://github.com/openclaw/openclaw/discussions).
