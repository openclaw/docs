---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час виконання
    - Тріаж проблем, про які повідомляють користувачі, перед глибшим налагодженням
summary: Поширені запитання про налаштування, конфігурацію та використання OpenClaw
title: Поширені запитання
x-i18n:
    generated_at: "2026-04-23T20:55:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd98f014ec2cdfe3c85e69303126fcd8bb94ade15e9770d15311484a7ef78480
    source_path: help/faq.md
    workflow: 15
---

Короткі відповіді плюс глибше усунення неполадок для реальних конфігурацій (локальна розробка, VPS, мультиагентність, OAuth/API keys, запасні варіанти моделей). Для діагностики під час виконання див. [Усунення неполадок](/uk/gateway/troubleshooting). Повний довідник із конфігурації див. у [Конфігурація](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламано

1. **Швидкий стан (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидкий локальний підсумок: ОС + оновлення, доступність gateway/служби, агенти/сесії, конфігурація провайдера + проблеми під час виконання (коли gateway доступний).

2. **Придатний для вставлення звіт (безпечний для поширення)**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з tail журналу (токени відредаговано).

3. **Стан демона + порту**

   ```bash
   openclaw gateway status
   ```

   Показує runtime supervisor проти досяжності RPC, цільову URL-адресу перевірки та те, яку конфігурацію служба, ймовірно, використовувала.

4. **Глибокі перевірки**

   ```bash
   openclaw status --deep
   ```

   Запускає живу перевірку здоров’я gateway, включно з перевірками каналів, якщо вони підтримуються
   (потрібен доступний gateway). Див. [Health](/uk/gateway/health).

5. **Перегляд останнього журналу в режимі tail**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використовуйте запасний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові журнали відокремлені від журналів служби; див. [Журналювання](/uk/logging) і [Усунення неполадок](/uk/gateway/troubleshooting).

6. **Запустіть doctor (відновлення)**

   ```bash
   openclaw doctor
   ```

   Відновлює/мігрує конфігурацію/стан + запускає перевірки здоров’я. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Запитує в запущеного gateway повний знімок (лише WS). Див. [Health](/uk/gateway/health).

## Швидкий старт і налаштування першого запуску

<AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб розблокуватися?">
    Використовуйте локального AI-агента, який може **бачити вашу машину**. Це набагато ефективніше, ніж питати
    в Discord, тому що більшість випадків "я застряг" — це **локальні проблеми конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти журнали та допомагати виправляти налаштування
    на рівні машини (PATH, служби, права доступу, файли автентифікації). Дайте їм **повний source checkout** через
    hackable (git) install:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **з git checkout**, тож агент може читати код + документацію і
    аналізувати точну версію, яку ви запускаєте. Ви завжди можете пізніше повернутися до stable,
    повторно запустивши installer без `--install-method git`.

    Порада: попросіть агента **спланувати та проконтролювати** виправлення (крок за кроком), а потім виконати лише
    потрібні команди. Це зберігає зміни невеликими та легшими для аудиту.

    Якщо ви знайдете реальну помилку або виправлення, будь ласка, створіть issue на GitHub або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (поділіться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок здоров’я gateway/агента + базової конфігурації.
    - `openclaw models status`: перевіряє автентифікацію провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє поширені проблеми конфігурації/стану.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламано](#first-60-seconds-if-something-is-broken).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці installer](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску Heartbeat:

    - `quiet-hours`: поза налаштованим вікном active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожній/лише заголовковий каркас
    - `no-tasks-due`: режим завдань `HEARTBEAT.md` активний, але ще не настав час для жодного інтервалу завдань
    - `alerts-disabled`: усю видимість Heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові мітки due пересуваються лише після завершення
    реального запуску Heartbeat. Пропущені запуски не позначають завдання як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Який рекомендований спосіб встановити й налаштувати OpenClaw?">
    Репозиторій рекомендує запуск із source і використання onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати ресурси UI. Після onboarding ви зазвичай запускаєте Gateway на порту **18789**.

    Із source (для контриб’юторів/розробки):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Якщо у вас ще немає глобального встановлення, запустіть через `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Як відкрити панель після onboarding?">
    Майстер відкриває ваш browser із чистою (без токена) URL-адресою панелі одразу після onboarding і також виводить посилання в підсумку. Тримайте цю вкладку відкритою; якщо вона не запустилася, скопіюйте/вставте надруковану URL-адресу на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати панель на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо з’явиться запит на автентифікацію спільним секретом, вставте налаштований токен або пароль у налаштування Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо спільний секрет ще не налаштовано, згенеруйте токен через `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште bind loopback, виконайте `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки identity задовольняють автентифікацію Control UI/WebSocket (без вставлення спільного секрету, за умови довіреного хоста gateway); HTTP API, як і раніше, потребують автентифікації спільним секретом, якщо ви свідомо не використовуєте приватний ingress `none` або trusted-proxy HTTP auth.
      Невдалі одночасні спроби автентифікації Serve від того самого клієнта серіалізуються до того, як лімітер невдалої автентифікації зафіксує їх, тому вже друга невдала повторна спроба може показувати `retry later`.
    - **Прив’язка до tailnet**: виконайте `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний спільний секрет у налаштуваннях панелі.
    - **Reverse proxy з awareness про identity**: тримайте Gateway за trusted proxy поза loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL-адресу proxy.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`. Автентифікація спільним секретом, як і раніше, діє через тунель; вставте налаштований токен або пароль, якщо з’явиться запит.

    Докладніше про режими bind та автентифікацію див. у [Панель](/uk/web/dashboard) і [Веб-поверхні](/uk/web).

  </Accordion>

  <Accordion title="Чому є дві конфігурації exec approvals для підтверджень у чаті?">
    Вони керують різними шарами:

    - `approvals.exec`: пересилає запити на підтвердження в цільові чати
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом підтвердження для exec approvals

    Політика exec на хості все одно є справжнім бар’єром підтвердження. Конфігурація чату лише керує тим,
    де з’являються запити на підтвердження і як люди можуть відповісти на них.

    У більшості конфігурацій вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди та відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначити підтверджувачів, OpenClaw тепер автоматично вмикає нативні DM-first підтвердження, коли `channels.<channel>.execApprovals.enabled` не встановлено або має значення `"auto"`.
    - Коли доступні нативні картки/кнопки підтвердження, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що підтвердження в чаті недоступні або ручне підтвердження — єдиний шлях.
    - Використовуйте `approvals.exec` лише тоді, коли запити також треба пересилати в інші чати або явні ops-кімнати.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише тоді, коли ви явно хочете, щоб запити на підтвердження публікувалися назад у вихідну кімнату/тему.
    - Підтвердження Plugin — це ще окремий випадок: вони типово використовують `/approve` у тому самому чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі нативні канали додатково зберігають нативну обробку підтверджень Plugin.

    Коротко: пересилання потрібне для маршрутизації, конфігурація нативного клієнта — для багатшого UX, специфічного для каналу.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке runtime мені потрібне?">
    Потрібен Node **>= 22**. Рекомендується `pnpm`. Bun **не рекомендований** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легкий — у документації вказано, що для особистого використання достатньо **512 МБ-1 ГБ RAM**, **1 ядра** і приблизно **500 МБ**
    диска, а також зазначено, що **Raspberry Pi 4 може його запускати**.

    Якщо вам потрібен додатковий запас (журнали, медіа, інші служби), **рекомендується 2 ГБ**,
    але це не жорсткий мінімум.

    Порада: невеликий Pi/VPS може хостити Gateway, а ви можете спарювати **nodes** на своєму ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є якісь поради для встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте певних шорсткостей.

    - Використовуйте **64-бітну** ОС і Node >= 22.
    - Віддавайте перевагу **hackable (git) install**, щоб мати змогу бачити журнали та швидко оновлюватися.
    - Починайте без каналів/Skills, а потім додавайте їх по одному.
    - Якщо натрапляєте на дивні проблеми з двійковими файлами, зазвичай це проблема **сумісності з ARM**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Зависло на wake up my friend / onboarding не завершується. Що тепер?">
    Цей екран залежить від того, чи доступний і автентифікований Gateway. TUI також надсилає
    "Wake up, my friend!" автоматично під час першого hatch. Якщо ви бачите цей рядок **без відповіді**
    і кількість токенів залишається 0, агент так і не запустився.

    1. Перезапустіть Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Перевірте стан + автентифікацію:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Якщо все ще зависає, виконайте:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що тунель/Tailscale-з’єднання активне і що UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini) без повторного onboarding?">
    Так. Скопіюйте **каталог стану** та **робочий простір**, а потім один раз запустіть Doctor. Це
    дозволяє зберегти вашого бота "точно таким самим" (пам’ять, історію сесій, автентифікацію та
    стан каналів), якщо ви скопіюєте **обидва** розташування:

    1. Установіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте свій робочий простір (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть службу Gateway.

    Це зберігає конфігурацію, профілі автентифікації, облікові дані WhatsApp, сесії та пам’ять. Якщо ви працюєте в
    віддаленому режимі, пам’ятайте, що саме хост gateway володіє сховищем сесій і робочим простором.

    **Важливо:** якщо ви лише commit/push свій робочий простір на GitHub, ви створюєте резервну
    копію **пам’яті + bootstrap-файлів**, але **не** історії сесій чи автентифікації. Вони зберігаються
    у `~/.openclaw/` (наприклад `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Міграція](/uk/install/migrating), [Де що знаходиться на диску](#where-things-live-on-disk),
    [Робочий простір агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи розташовані зверху. Якщо верхній розділ позначено як **Unreleased**, наступний датований
    розділ — це остання випущена версія. Записи згруповано за розділами **Highlights**, **Changes** і
    **Fixes** (а також docs/інші розділи, коли це потрібно).

  </Accordion>

  <Accordion title="Не можу відкрити docs.openclaw.ai (помилка SSL)">
    Деякі з’єднання Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до allowlist, а потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати це, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дзеркалюється на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі лінії коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай stable release спочатку потрапляє в **beta**, а потім явний
    крок просування переміщує ту саму версію в `latest`. За потреби мейнтейнери також можуть
    публікувати одразу в `latest`. Саме тому після просування beta і stable можуть
    вказувати на **одну й ту саму версію**.

    Подивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди встановлення та різницю між beta і dev див. в акордеоні нижче.

  </Accordion>

  <Accordion title="Як установити beta-версію і в чому різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (після просування може збігатися з `latest`).
    **Dev** — це рухома вершина `main` (git); коли публікується, використовує npm dist-tag `dev`.

    Однорядкові команди (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Installer для Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Докладніше: [Канали розробки](/uk/install/development-channels) і [Прапорці installer](/uk/install/installer).

  </Accordion>

  <Accordion title="Як спробувати найновіші зміни?">
    Є два варіанти:

    1. **Канал dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає вас на гілку `main` і оновлює з source.

    2. **Hackable install (із сайту installer):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає вам локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо ви віддаєте перевагу чистому clone вручну, використовуйте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Update](/uk/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай займає встановлення та onboarding?">
    Орієнтовно:

    - **Встановлення:** 2-5 хвилин
    - **Onboarding:** 5-15 хвилин залежно від кількості каналів/моделей, які ви налаштовуєте

    Якщо зависає, використовуйте [Installer stuck](#quick-start-and-first-run-setup)
    і швидкий цикл налагодження в [Я застряг](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer завис? Як отримати більше зворотного зв’язку?">
    Повторно запустіть installer з **докладним виводом**:

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
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Більше варіантів: [Прапорці installer](/uk/install/installer).

  </Accordion>

  <Accordion title="Під час встановлення на Windows пише git not found або openclaw not recognized">
    Дві поширені проблеми на Windows:

    **1) npm error spawn git / git not found**

    - Установіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, а потім повторно запустіть installer.

    **2) openclaw is not recognized after install**

    - Ваша глобальна тека bin npm відсутня в PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до свого користувацького PATH (у Windows суфікс `\bin` не потрібен; на більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо вам потрібне найплавніше налаштування на Windows, використовуйте **WSL2** замість нативної Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="У Windows вивід exec показує зіпсований китайський текст — що робити?">
    Зазвичай це невідповідність code page консолі в нативних оболонках Windows.

    Симптоми:

    - вивід `system.run`/`exec` показує китайський текст як mojibake
    - та сама команда нормально виглядає в іншому профілі термінала

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

    Якщо ви все ще можете відтворити це на останній версії OpenClaw, відстежуйте/повідомляйте тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використовуйте **hackable (git) install**, щоб мати повний source і документацію локально, а потім запитайте
    свого бота (або Claude/Codex) _з цієї теки_, щоб він міг читати репозиторій і відповідати точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці installer](/uk/install/installer).

  </Accordion>

  <Accordion title="Як установити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтеся посібника для Linux, а потім запустіть onboarding.

    - Швидкий шлях для Linux + встановлення служби: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Installer + оновлення: [Встановлення та оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як установити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Установіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де посібники зі встановлення в хмарі / на VPS?">
    Ми підтримуємо **центр хостингу** з поширеними провайдерами. Оберіть одного з них і дотримуйтеся посібника:

    - [Хостинг VPS](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway запускається на сервері**, а ви отримуєте доступ до нього
    зі свого ноутбука/телефона через Control UI (або Tailscale/SSH). Ваші стан + робочий простір
    живуть на сервері, тож сприймайте хост як джерело істини й робіть його резервні копії.

    Ви можете pair **nodes** (Mac/iOS/Android/headless) з цим хмарним Gateway, щоб отримати доступ до
    локального екрана/камери/canvas або запускати команди на своєму ноутбуці, залишаючи
    Gateway у хмарі.

    Центр: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити себе?">
    Коротка відповідь: **можливо, але не рекомендується**. Потік оновлення може перезапустити
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

    Якщо вам усе ж потрібно автоматизувати це з агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Update](/uk/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що саме робить onboarding?">
    `openclaw onboard` — це рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/автентифікації** (OAuth провайдера, API keys, Anthropic setup-token, а також варіанти локальних моделей, як-от LM Studio)
    - Розташування **робочого простору** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані Plugins каналів, такі як QQ Bot)
    - **Встановлення демона** (LaunchAgent на macOS; user unit systemd на Linux/WSL2)
    - **Перевірки здоров’я** та вибір **Skills**

    Він також попереджає, якщо вашу налаштовану модель не розпізнано або для неї бракує автентифікації.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw з **API keys** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації для цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **Anthropic API key**: звичайний білінг Anthropic API
    - **Claude CLI / автентифікація через підписку Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw розглядає використання `claude -p`
      як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів gateway Anthropic API keys усе ще є більш
    передбачуваним варіантом. OpenAI Codex OAuth явно підтримується для зовнішніх
    інструментів, таких як OpenClaw.

    OpenClaw також підтримує інші варіанти у стилі хостованих підписок, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [GLM Models](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API key?">
    Так.

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому
    OpenClaw розглядає автентифікацію через підписку Claude і використання `claude -p` як санкціоновані
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо вам потрібне
    найбільш передбачуване серверне налаштування, використовуйте Anthropic API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тому OpenClaw розглядає
    повторне використання Claude CLI і `claude -p` як санкціоновані для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Anthropic setup-token усе ще доступний як підтримуваний токеновий шлях OpenClaw, але OpenClaw тепер віддає перевагу повторному використанню Claude CLI і `claude -p`, коли це доступно.
    Для production або багатокористувацьких навантажень автентифікація через Anthropic API key усе ще є
    безпечнішим і передбачуванішим вибором. Якщо вас цікавлять інші хостовані
    варіанти у стилі підписок в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
    Це означає, що вашу **квоту/ліміт частоти Anthropic** вичерпано для поточного вікна. Якщо ви
    використовуєте **Claude CLI**, зачекайте, поки вікно скинеться, або оновіть свій тарифний план. Якщо ви
    використовуєте **Anthropic API key**, перевірте Anthropic Console
    щодо використання/білінгу та за потреби підвищте ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, запит намагається використати
    beta Anthropic для контексту 1M (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані придатні для білінгу довгого контексту (білінг API key або
    шлях входу Claude в OpenClaw з увімкненим Extra Usage).

    Порада: установіть **запасну модель**, щоб OpenClaw міг продовжувати відповідати, коли провайдер має rate limit.
    Див. [Моделі](/uk/cli/models), [OAuth](/uk/concepts/oauth), і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудованого провайдера **Amazon Bedrock (Converse)**. Коли присутні env markers AWS, OpenClaw може автоматично виявити потоковий/текстовий каталог Bedrock і об’єднати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис провайдера вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-compatible proxy перед Bedrock також залишається коректним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Нові посилання на моделі мають використовувати канонічний шлях `openai/gpt-5.5`; `openai-codex/gpt-*` залишається застарілим псевдонімом сумісності. Див. [Провайдери моделей](/uk/concepts/model-providers) і [Onboarding (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому OpenClaw досі згадує openai-codex?">
    `openai-codex` досі є внутрішнім id провайдера автентифікації/профілю для ChatGPT/Codex OAuth. Посилання на модель має бути канонічним OpenAI:

    - `openai/gpt-5.5` = канонічне посилання на модель GPT-5.5
    - `openai-codex/gpt-5.5` = застарілий псевдонім сумісності
    - `openai-codex:...` = id профілю автентифікації, а не посилання на модель

    Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform, установіть
    `OPENAI_API_KEY`. Якщо вам потрібна автентифікація через підписку ChatGPT/Codex, увійдіть через
    `openclaw models auth login --provider openai-codex` і використовуйте посилання на моделі
    `openai/*` у нових конфігураціях.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    Codex OAuth використовує керовані OpenAI вікна квот, що залежать від тарифного плану. На практиці
    ці ліміти можуть відрізнятися від досвіду в ChatGPT на сайті/у застосунку, навіть коли
    обидва прив’язані до одного й того самого облікового запису.

    OpenClaw може показувати поточні видимі вікна використання/квоти провайдера в
    `openclaw models status`, але він не вигадує і не нормалізує права ChatGPT web
    у прямий API-доступ. Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform,
    використовуйте `openai/*` з API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth підписки OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання OAuth підписки у зовнішніх інструментах/робочих процесах
    на кшталт OpenClaw. Onboarding може запустити OAuth-потік за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Onboarding (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **потік автентифікації Plugin**, а не client id чи secret у `openclaw.json`.

    Кроки:

    1. Установіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Типова модель після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не проходять, установіть `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає OAuth-токени в профілях автентифікації на хості gateway. Докладніше: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; маленькі моделі обрізають і допускають витік. Якщо вам це все ж потрібно, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі підвищують ризик prompt injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як зберігати трафік до хостованої моделі в конкретному регіоні?">
    Обирайте endpoint, прив’язані до регіону. OpenRouter надає варіанти, розміщені в США, для MiniMax, Kimi і GLM; вибирайте варіант, розміщений у США, щоб зберігати дані в межах регіону. Ви все одно можете перелічувати Anthropic/OpenAI поруч із ними, використовуючи `models.mode: "merge"`, щоб запасні варіанти залишалися доступними, водночас дотримуючись вибраного вами провайдера з прив’язкою до регіону.
  </Accordion>

  <Accordion title="Чи обов’язково купувати Mac Mini, щоб установити це?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini необов’язковий — деякі люди
    купують його як постійно ввімкнений хост, але невеликий VPS, домашній сервер або пристрій класу Raspberry Pi теж підійде.

    Mac потрібен лише **для інструментів лише для macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або pair macOS node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, увійшовший у Messages. Це **не обов’язково** має бути Mac mini —
    підійде будь-який Mac. Для iMessage **використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) — сервер BlueBubbles працює на macOS, тоді як Gateway може працювати на Linux або деінде.

    Поширені конфігурації:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac, увійшовшому в Messages.
    - Запускайте все на Mac, якщо хочете найпростішу конфігурацію з однією машиною.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи можу я підключити його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключатися як
    **node** (супутній пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, як-от screen/camera/canvas і `system.run` на цьому пристрої.

    Поширений шаблон:

    - Gateway на Mac mini (постійно ввімкнений).
    - MacBook Pro запускає застосунок macOS або хост node і pair-иться з Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я використовувати Bun?">
    Bun **не рекомендований**. Ми бачимо помилки runtime, особливо з WhatsApp і Telegram.
    Для стабільних gateway використовуйте **Node**.

    Якщо ви все ж хочете експериментувати з Bun, робіть це на непродукційному gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що має бути в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім’я користувача бота.

    Налаштування запитує лише числові user ID. Якщо у вас уже є застарілі записи `@username` у конфігурації, `openclaw doctor --fix` може спробувати визначити їх.

    Безпечніше (без стороннього бота):

    - Напишіть боту в DM, а потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть боту в DM, а потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватний):

    - Напишіть у DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **мультиагентну маршрутизацію**. Прив’яжіть WhatsApp **DM** кожного відправника (peer `kind: "direct"`, sender E.164 на кшталт `+15551234567`) до різного `agentId`, щоб кожна людина отримувала власний робочий простір і сховище сесій. Відповіді все одно надходитимуть з **того самого облікового запису WhatsApp**, а контроль доступу до особистих повідомлень (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Див. [Мультиагентна маршрутизація](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я мати агента "fast chat" і агента "Opus for coding"?'>
    Так. Використовуйте мультиагентну маршрутизацію: призначте кожному агенту власну типову модель, а потім прив’яжіть вхідні маршрути (обліковий запис провайдера або конкретних peers) до кожного агента. Приклад конфігурації є в [Мультиагентна маршрутизація](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH служби включає `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, визначалися в оболонках без входу в систему.
    Останні збірки також додають на початок поширені user bin-каталоги в службах Linux systemd (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, коли вони встановлені.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повний source checkout, редагований, найкращий для контриб’юторів.
      Ви виконуєте локальні build і можете патчити код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію "просто запустити".
      Оновлення надходять через npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm і git install?">
    Так. Установіть інший варіант, а потім запустіть Doctor, щоб служба gateway вказувала на новий entrypoint.
    Це **не видаляє ваші дані** — змінюється лише встановлення коду OpenClaw. Ваш стан
    (`~/.openclaw`) і робочий простір (`~/.openclaw/workspace`) залишаються недоторканими.

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

    Doctor виявляє невідповідність entrypoint служби gateway і пропонує переписати конфігурацію служби відповідно до поточного встановлення (для автоматизації використовуйте `--repair`).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо ви хочете
    мінімального тертя і вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Переваги:** без вартості сервера, прямий доступ до локальних файлів, видиме вікно browser.
    - **Недоліки:** сон/обриви мережі = відключення, оновлення/перезавантаження ОС переривають роботу, машина має залишатися активною.

    **VPS / хмара**

    - **Переваги:** постійно ввімкнено, стабільна мережа, немає проблем через сон ноутбука, простіше підтримувати роботу.
    - **Недоліки:** часто headless-режим (використовуйте знімки екрана), доступ до файлів лише віддалено, для оновлень потрібен SSH.

    **Примітка, специфічна для OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord усі нормально працюють з VPS. Єдиний реальний компроміс — це **headless browser** проти видимого вікна. Див. [Browser](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо у вас уже були відключення gateway. Локальний запуск чудовий, коли ви активно користуєтеся Mac і хочете локальний доступ до файлів або UI-автоматизацію з видимим browser.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Це не обов’язково, але **рекомендується для надійності й ізоляції**.

    - **Окремий хост (VPS/Mac mini/Pi):** постійно ввімкнений, менше переривань через сон/перезавантаження, чистіші права доступу, простіше підтримувати роботу.
    - **Спільний ноутбук/десктоп:** цілком підходить для тестування й активного використання, але очікуйте пауз, коли машина засинає або оновлюється.

    Якщо ви хочете найкраще з обох світів, тримайте Gateway на окремому хості, а свій ноутбук pair-те як **node** для локальних інструментів screen/camera/exec. Див. [Nodes](/uk/nodes).
    Для рекомендацій з безпеки прочитайте [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яка ОС рекомендована?">
    OpenClaw легкий. Для базового Gateway + одного каналу чату:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM, ~500 МБ диска.
    - **Рекомендовано:** 1-2 vCPU, 2 ГБ RAM або більше для запасу (журнали, медіа, кілька каналів). Інструменти Node і browser-автоматизація можуть вимагати багато ресурсів.

    ОС: використовуйте **Ubuntu LTS** (або будь-яку сучасну Debian/Ubuntu). Саме там шлях встановлення для Linux протестований найкраще.

    Документація: [Linux](/uk/platforms/linux), [Хостинг VPS](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Сприймайте VM так само, як VPS: вона має бути завжди ввімкненою, доступною та мати достатньо
    RAM для Gateway і будь-яких увімкнених каналів.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM.
    - **Рекомендовано:** 2 ГБ RAM або більше, якщо ви запускаєте кілька каналів, browser-автоматизацію чи медіа-інструменти.
    - **ОС:** Ubuntu LTS або інша сучасна Debian/Ubuntu.

    Якщо ви працюєте на Windows, **WSL2 — це найпростіша конфігурація у стилі VM** і вона має найкращу
    сумісність інструментів. Див. [Windows](/uk/platforms/windows), [Хостинг VPS](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw, в одному абзаці?">
    OpenClaw — це персональний AI-помічник, який ви запускаєте на власних пристроях. Він відповідає на тих поверхнях обміну повідомленнями, якими ви вже користуєтеся (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat і вбудовані Plugins каналів, такі як QQ Bot), а також може надавати voice + live Canvas на підтримуваних платформах. **Gateway** — це постійно ввімкнена площина керування; помічник і є продуктом.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не "просто обгортка для Claude". Це **local-first площина керування**, яка дає змогу запускати
    потужного помічника на **вашому власному обладнанні**, доступного з чат-застосунків, якими ви вже користуєтеся, з
    сесіями зі станом, пам’яттю та інструментами — без передачі керування вашими робочими процесами
    хостованому SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway де завгодно (Mac, Linux, VPS) і зберігайте
      робочий простір + історію сесій локально.
    - **Реальні канали, а не вебпісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      а також mobile voice і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо, з маршрутизацією
      для кожного агента й запасними варіантами.
    - **Варіант лише локально:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо ви цього хочете.
    - **Мультиагентна маршрутизація:** окремі агенти для кожного каналу, облікового запису або завдання, кожен зі своїм
      робочим простором і типовими налаштуваннями.
    - **Відкритий код і hackable:** перевіряйте, розширюйте та self-host без vendor lock-in.

    Документація: [Gateway](/uk/gateway), [Канали](/uk/channels), [Мультиагентність](/uk/concepts/multi-agent),
    [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно це налаштував — що мені зробити спочатку?">
    Хороші перші проєкти:

    - Створити сайт (WordPress, Shopify або простий статичний сайт).
    - Прототипувати мобільний застосунок (план, екрани, план API).
    - Організувати файли та теки (очищення, назви, теґи).
    - Підключити Gmail і автоматизувати підсумки або подальші дії.

    Він може виконувати великі завдання, але працює найкраще, коли ви ділите їх на фази й
    використовуєте субагентів для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найпоширеніших повсякденних сценаріїв використання OpenClaw?">
    Повсякденні виграші зазвичай виглядають так:

    - **Персональні брифінги:** підсумки inbox, календаря та новин, які вас цікавлять.
    - **Дослідження та чорновики:** швидкі дослідження, підсумки й перші чернетки для листів або документів.
    - **Нагадування та подальші дії:** nudges і checklists на основі Cron або Heartbeat.
    - **Browser-автоматизація:** заповнення форм, збирання даних і повторення вебзавдань.
    - **Координація між пристроями:** надішліть завдання з телефона, дозвольте Gateway виконати його на сервері й отримайте результат назад у чаті.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, ads і blog для SaaS?">
    Так — для **дослідження, кваліфікації та підготовки чорновиків**. Він може сканувати сайти, створювати shortlists,
    підсумовувати prospects і писати чернетки outreach або рекламних текстів.

    Для **outreach або запуску ads** залишайте людину в циклі. Уникайте спаму, дотримуйтеся місцевих законів і
    політик платформ та переглядайте все перед надсиланням. Найбезпечніший шаблон —
    дозволити OpenClaw створити чернетку, а вам — схвалити її.

    Документація: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний помічник** і шар координації, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу кодування в репозиторії. Використовуйте OpenClaw, коли вам
    потрібні стійка пам’ять, міжпристроєвий доступ і оркестрація інструментів.

    Переваги:

    - **Постійна пам’ять + робочий простір** між сесіями
    - **Багатоплатформний доступ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (browser, файли, планування, hooks)
    - **Постійно ввімкнений Gateway** (запускайте на VPS, взаємодійте звідусіль)
    - **Nodes** для локальних browser/screen/camera/exec

    Демонстрація: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills та автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати Skills, не роблячи репозиторій брудним?">
    Використовуйте керовані перевизначення замість редагування копії в репозиторії. Розміщуйте свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте теку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`, тож керовані перевизначення все одно мають пріоритет над вбудованими Skills, не торкаючись git. Якщо Skill має бути встановлений глобально, але видимий лише деяким агентам, тримайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` і `agents.list[].skills`. Лише зміни, гідні upstream, мають жити в репозиторії та надсилатися як PR.
  </Accordion>

  <Accordion title="Чи можу я завантажувати Skills з власної теки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Типовий пріоритет: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`. `clawhub` типово встановлює в `./skills`, що OpenClaw трактує як `<workspace>/skills` у наступній сесії. Якщо Skill має бути видимий лише певним агентам, поєднайте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як використовувати різні моделі для різних завдань?">
    Сьогодні підтримуються такі шаблони:

    - **Cron jobs**: ізольовані завдання можуть встановлювати перевизначення `model` для кожного завдання.
    - **Субагенти**: маршрутизуйте завдання до окремих агентів з різними типовими моделями.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб будь-коли перемикати модель поточної сесії.

    Див. [Cron jobs](/uk/automation/cron-jobs), [Мультиагентна маршрутизація](/uk/concepts/multi-agent) і [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як це винести окремо?">
    Використовуйте **субагентів** для довгих або паралельних завдань. Субагенти працюють у власній сесії,
    повертають підсумок і зберігають чутливість вашого основного чату.

    Попросіть бота "створити субагента для цього завдання" або використовуйте `/subagents`.
    Використовуйте `/status` у чаті, щоб побачити, що зараз робить Gateway (і чи він зайнятий).

    Порада щодо токенів: і довгі завдання, і субагенти витрачають токени. Якщо вас турбує вартість, установіть
    дешевшу модель для субагентів через `agents.defaults.subagents.model`.

    Документація: [Субагенти](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють сесії субагентів, прив’язані до потоку, у Discord?">
    Використовуйте прив’язки потоків. Ви можете прив’язати потік Discord до цілі субагента або сесії, щоб follow-up повідомлення в цьому потоці залишалися на прив’язаній сесії.

    Базовий потік:

    - Створюйте через `sessions_spawn`, використовуючи `thread: true` (і за потреби `mode: "session"` для постійного follow-up).
    - Або прив’язуйте вручну через `/focus <target>`.
    - Використовуйте `/agents`, щоб переглянути стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>` для керування автоматичним unfocus.
    - Використовуйте `/unfocus`, щоб від’єднати потік.

    Потрібна конфігурація:

    - Глобальні типові значення: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Перевизначення Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоприв’язка під час створення: установіть `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Субагенти](/uk/tools/subagents), [Discord](/uk/channels/discord), [Довідник із конфігурації](/uk/gateway/configuration-reference), [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Субагент завершився, але оновлення про завершення надійшло не туди або взагалі не було опубліковане. Що перевірити?">
    Спочатку перевірте визначений маршрут запитувача:

    - Доставка субагента в режимі completion віддає перевагу будь-якому прив’язаному потоку або маршруту розмови, якщо такий існує.
    - Якщо джерело завершення містить лише канал, OpenClaw використовує запасний варіант — збережений маршрут сесії запитувача (`lastChannel` / `lastTo` / `lastAccountId`), тож пряма доставка все одно може спрацювати.
    - Якщо немає ні прив’язаного маршруту, ні придатного збереженого маршруту, пряма доставка може не вдатися, і результат переходить до доставки через чергу сесії замість негайної публікації в чаті.
    - Недійсні або застарілі цілі все одно можуть примусово активувати запасний варіант через чергу або остаточний збій доставки.
    - Якщо остання видима відповідь помічника в дочірньому процесі — це точний тихий токен `NO_REPLY` / `no_reply` або точно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує оголошення замість публікації застарілого попереднього прогресу.
    - Якщо дочірній процес перевищив тайм-аут після одних лише викликів інструментів, оголошення може згорнути це до короткого підсумку часткового прогресу замість відтворення сирого виводу інструментів.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Субагенти](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks), [Інструменти сесії](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron працює всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані завдання не запускатимуться.

    Контрольний список:

    - Підтвердьте, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не встановлено.
    - Переконайтеся, що Gateway працює 24/7 (без сну/перезапусків).
    - Перевірте налаштування часового поясу для завдання (`--tz` проти часового поясу хоста).

    Налагодження:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Cron спрацював, але в канал нічого не було надіслано. Чому?">
    Спочатку перевірте режим доставки:

    - `--no-deliver` / `delivery.mode: "none"` означає, що резервне надсилання через runner не очікується.
    - Відсутня або недійсна ціль оголошення (`channel` / `to`) означає, що runner пропустив вихідну доставку.
    - Збої автентифікації каналу (`unauthorized`, `Forbidden`) означають, що runner спробував доставити, але облікові дані це заблокували.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` і нічого більше) вважається навмисно непридатним до доставки, тому runner також пригнічує резервну доставку через чергу.

    Для ізольованих завдань cron агент усе одно може надсилати напряму через інструмент `message`,
    коли доступний маршрут чату. `--announce` керує лише резервним шляхом runner
    для фінального тексту, який агент ще не надіслав сам.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований запуск cron змінив модель або повторився один раз?">
    Зазвичай це шлях живого перемикання моделі, а не дублювання планування.

    Ізольований cron може зберігати передачу runtime-моделі та повторювати запуск, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повторна спроба зберігає перемкненого
    провайдера/модель, і якщо перемикання також несло нове перевизначення профілю автентифікації, cron
    теж зберігає його перед повторною спробою.

    Пов’язані правила вибору:

    - Перевизначення моделі hook Gmail має найвищий пріоритет, коли застосовно.
    - Потім `model` для кожного завдання.
    - Потім будь-яке збережене перевизначення моделі cron-сесії.
    - Потім звичайний вибір моделі агента/типової моделі.

    Цикл повторних спроб обмежений. Після початкової спроби плюс 2 повторних спроб перемикання
    cron переривається замість нескінченного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [CLI cron](/uk/cli/cron).

  </Accordion>

  <Accordion title="Як установити Skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або просто розміщуйте Skills у своєму робочому просторі. UI Skills для macOS недоступний на Linux.
    Переглянути Skills можна на [https://clawhub.ai](https://clawhub.ai).

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

    Нативний `openclaw skills install` записує в каталог `skills/`
    активного робочого простору. Окремий CLI `clawhub` потрібен лише тоді, якщо ви хочете публікувати або
    синхронізувати власні Skills. Для спільного встановлення між агентами розмістіть Skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете звузити, які агенти можуть його бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати завдання за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте планувальник Gateway:

    - **Cron jobs** для запланованих або повторюваних завдань (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок "головної сесії".
    - **Ізольовані завдання** для автономних агентів, які публікують підсумки або доставляють їх у чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати Apple-макОS-only Skills з Linux?">
    Не безпосередньо. Skills macOS обмежуються через `metadata.openclaw.os` разом із потрібними двійковими файлами, і Skills з’являються в системному запиті лише тоді, коли вони придатні на **хості Gateway**. На Linux Skills лише для `darwin` (як-от `apple-notes`, `apple-reminders`, `things-mac`) не завантажуватимуться, якщо ви не перевизначите це обмеження.

    У вас є три підтримувані шаблони:

    **Варіант A — запускати Gateway на Mac (найпростіше).**
    Запускайте Gateway там, де існують двійкові файли macOS, а потім підключайтеся з Linux у [віддаленому режимі](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажуються нормально, тому що хост Gateway — це macOS.

    **Варіант B — використовувати node macOS (без SSH).**
    Запускайте Gateway на Linux, pair-те node macOS (menubar app) і встановіть **Node Run Commands** у "Always Ask" або "Always Allow" на Mac. OpenClaw може вважати macOS-only Skills придатними, коли потрібні двійкові файли існують на node. Агент запускає ці Skills через інструмент `nodes`. Якщо ви обираєте "Always Ask", схвалення "Always Allow" у запиті додає цю команду до allowlist.

    **Варіант C — проксіювати двійкові файли macOS через SSH (просунутий варіант).**
    Залишайте Gateway на Linux, але зробіть так, щоб потрібні CLI-двійкові файли визначалися як SSH-wrapper-и, які виконуються на Mac. Потім перевизначте Skill так, щоб дозволити Linux і він залишався придатним.

    1. Створіть SSH-wrapper для двійкового файла (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Додайте wrapper у `PATH` на хості Linux (наприклад `~/bin/memo`).
    3. Перевизначте метадані Skill (робочий простір або `~/.openclaw/skills`), щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Почніть нову сесію, щоб знімок Skills оновився.

  </Accordion>

  <Accordion title="Чи є у вас інтеграція з Notion або HeyGen?">
    Наразі не вбудовано.

    Варіанти:

    - **Власний Skill / Plugin:** найкращий варіант для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Browser-автоматизація:** працює без коду, але повільніше й крихкіше.

    Якщо ви хочете зберігати контекст для кожного клієнта окремо (робочі процеси агентства), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + вподобання + активна робота).
    - Попросіть агента отримувати цю сторінку на початку сесії.

    Якщо вам потрібна нативна інтеграція, відкрийте feature request або створіть Skill,
    націлений на ці API.

    Установлення Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні встановлення потрапляють у каталог `skills/` активного робочого простору. Для спільних Skills між агентами розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі агенти, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі Skills очікують наявності двійкових файлів, установлених через Homebrew; на Linux це означає Linuxbrew (див. запис FAQ про Homebrew на Linux вище). Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати свій наявний Chrome, у якому вже виконано вхід, з OpenClaw?">
    Використовуйте вбудований профіль browser `user`, який підключається через Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Якщо вам потрібна власна назва, створіть явний профіль MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Цей шлях може використовувати локальний browser хоста або підключений browser node. Якщо Gateway працює десьінде, або запустіть хост node на машині з browser, або використовуйте віддалений CDP.

    Поточні обмеження для `existing-session` / `user`:

    - дії прив’язані до ref, а не до CSS-selector
    - завантаження потребують `ref` / `inputRef` і наразі підтримують лише один файл за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії все ще потребують керованого browser або сирого профілю CDP

  </Accordion>
</AccordionGroup>

## Sandboxing і пам’ять

<AccordionGroup>
  <Accordion title="Чи є окремий документ про sandboxing?">
    Так. Див. [Sandboxing](/uk/gateway/sandboxing). Для налаштування, специфічного для Docker (повний gateway у Docker або образи sandbox), див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повні можливості?">
    Типовий образ орієнтований на безпеку і працює від імені користувача `node`, тому не
    містить системних пакетів, Homebrew або вбудованих browser. Для повнішого налаштування:

    - Зберігайте `/home/node` через `OPENCLAW_HOME_VOLUME`, щоб кеші не зникали.
    - Вбудовуйте системні залежності в образ через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Установлюйте browser Playwright через вбудований CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Установіть `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я зберегти особисті повідомлення приватними, а групи зробити публічними/у sandbox з одним агентом?">
    Так — якщо ваш приватний трафік це **особисті повідомлення**, а публічний трафік — **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб групові/канальні сесії (ключі не `main`) працювали в налаштованому бекенді sandbox, тоді як основна DM-сесія залишалася на хості. Docker є типовим бекендом, якщо ви не виберете інший. Потім обмежте, які інструменти доступні в sandbox-сесіях, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Групи: приватні DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Довідник по ключовій конфігурації: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив’язати теку хоста до sandbox?">
    Установіть `agents.defaults.sandbox.docker.binds` у `["host:path:mode"]` (наприклад `"/home/user/src:/src:ro"`). Глобальні прив’язки + прив’язки для конкретного агента об’єднуються; прив’язки для конкретного агента ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для всього чутливого і пам’ятайте, що прив’язки обходять файлові стіни sandbox.

    OpenClaw перевіряє джерела bind як за нормалізованим шляхом, так і за канонічним шляхом, визначеним через найглибшого наявного предка. Це означає, що виходи через symlink-parent і далі блокуються в закритому режимі, навіть коли останній сегмент шляху ще не існує, а перевірки allowed-root все одно застосовуються після визначення symlink.

    Приклади й примітки з безпеки див. у [Sandboxing](/uk/gateway/sandboxing#custom-bind-mounts) і [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Як працює пам’ять?">
    Пам’ять OpenClaw — це просто Markdown-файли в робочому просторі агента:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Кураторські довготривалі нотатки в `MEMORY.md` (лише для головних/приватних сесій)

    OpenClaw також виконує **тихий pre-compaction memory flush**, щоб нагадати моделі
    записати стійкі нотатки перед автоматичним Compaction. Це запускається лише тоді, коли робочий простір
    доступний для запису (sandbox у режимі лише для читання це пропускає). Див. [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Пам’ять постійно щось забуває. Як зробити так, щоб це закріпилося?">
    Попросіть бота **записати факт у пам’ять**. Довготривалі нотатки мають бути в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це все ще сфера, яку ми покращуємо. Допомагає нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона продовжує забувати, перевірте, що Gateway використовує той самий
    робочий простір під час кожного запуску.

    Документація: [Пам’ять](/uk/concepts/memory), [Робочий простір агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Чи зберігається пам’ять назавжди? Які є обмеження?">
    Файли пам’яті живуть на диску й зберігаються, доки ви їх не видалите. Обмеженням є ваше
    сховище, а не модель. **Контекст сесії** все одно обмежений
    контекстним вікном моделі, тому довгі розмови можуть стискатися або обрізатися. Саме тому
    існує пошук у пам’яті — він повертає в контекст лише релевантні частини.

    Документація: [Пам’ять](/uk/concepts/memory), [Контекст](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи вимагає семантичний пошук у пам’яті OpenAI API key?">
    Лише якщо ви використовуєте **embeddings OpenAI**. Codex OAuth покриває chat/completions і
    **не** надає доступу до embeddings, тому **вхід через Codex (OAuth або
    логін через Codex CLI)** не допомагає для семантичного пошуку в пам’яті. Embeddings OpenAI
    все одно потребують справжнього API key (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви не вказуєте провайдера явно, OpenClaw автоматично вибирає провайдера, коли
    може визначити API key (профілі автентифікації, `models.providers.*.apiKey` або env vars).
    Він віддає перевагу OpenAI, якщо визначається ключ OpenAI, інакше Gemini, якщо визначається ключ Gemini,
    потім Voyage, потім Mistral. Якщо віддалений ключ недоступний, пошук у пам’яті
    залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштовано й наявний шлях до локальної моделі, OpenClaw
    віддає перевагу `local`. Ollama підтримується, коли ви явно встановлюєте
    `memorySearch.provider = "ollama"`.

    Якщо ви хочете залишитися локально, установіть `memorySearch.provider = "local"` (і за потреби
    `memorySearch.fallback = "none"`). Якщо вам потрібні embeddings Gemini, установіть
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо embedding-моделі **OpenAI, Gemini, Voyage, Mistral, Ollama або local**
    — деталі налаштування див. у [Пам’ять](/uk/concepts/memory).

  </Accordion>
</AccordionGroup>

## Де що знаходиться на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, що використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні служби все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** сесії, файли пам’яті, конфігурація та робочий простір живуть на хості Gateway
      (`~/.openclaw` + каталог вашого робочого простору).
    - **Віддалено за потребою:** повідомлення, які ви надсилаєте провайдерам моделей (Anthropic/OpenAI тощо), потрапляють
      до їхніх API, а платформи чатів (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на
      своїх серверах.
    - **Ви контролюєте площу сліду:** використання локальних моделей залишає запити на вашій машині, але трафік
      каналів усе одно проходить через сервери самого каналу.

    Пов’язане: [Робочий простір агента](/uk/concepts/agent-workspace), [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе живе під `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Шлях                                                            | Призначення                                                        |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основна конфігурація (JSON5)                                       |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Застарілий імпорт OAuth (копіюється в профілі автентифікації під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Профілі автентифікації (OAuth, API keys та необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язковий payload секретів на основі файлів для провайдерів `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Застарілий файл сумісності (статичні записи `api_key` очищено)     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдерів (наприклад `whatsapp/<accountId>/creds.json`)     |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан для кожного агента (agentDir + sessions)                      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і стан (для кожного агента)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані сесій (для кожного агента)                                |

    Застарілий шлях для одного агента: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`).

    Ваш **робочий простір** (AGENTS.md, файли пам’яті, Skills тощо) відокремлений і налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають знаходитися AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли живуть у **робочому просторі агента**, а не в `~/.openclaw`.

    - **Робочий простір (для кожного агента)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, необов’язковий `HEARTBEAT.md`.
      Нижній регістр кореневого `memory.md` — це лише застарілий вхід для відновлення; `openclaw doctor --fix`
      може об’єднати його в `MEMORY.md`, коли існують обидва файли.
    - **Каталог стану (`~/.openclaw`)**: конфігурація, стан каналів/провайдерів, профілі автентифікації, сесії, журнали
      і спільні Skills (`~/.openclaw/skills`).

    Типовий робочий простір — `~/.openclaw/workspace`, його можна налаштувати через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот "забуває" після перезапуску, переконайтеся, що Gateway використовує той самий
    робочий простір при кожному запуску (і пам’ятайте: у віддаленому режимі використовується робочий простір
    **хоста gateway**, а не вашого локального ноутбука).

    Порада: якщо ви хочете закріпити певну поведінку або вподобання, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладатися на історію чату.

    Див. [Робочий простір агента](/uk/concepts/agent-workspace) і [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Помістіть свій **робочий простір агента** у **приватний** git-репозиторій і робіть резервні копії
    кудись у приватне місце (наприклад, у приватний GitHub). Це зберігає пам’ять + файли AGENTS/SOUL/USER
    і дозволяє пізніше відновити "свідомість" помічника.

    **Не** commit-ьте нічого з `~/.openclaw` (облікові дані, сесії, токени чи зашифровані payload секретів).
    Якщо вам потрібне повне відновлення, робіть резервні копії і робочого простору, і каталогу стану
    окремо (див. запитання про міграцію вище).

    Документація: [Робочий простір агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окремий посібник: [Видалення](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть агенти працювати поза робочим простором?">
    Так. Робочий простір — це **типовий cwd** і якір пам’яті, а не жорсткий sandbox.
    Відносні шляхи визначаються всередині робочого простору, але абсолютні шляхи можуть давати доступ до інших
    розташувань на хості, якщо sandboxing не ввімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування sandbox для окремого агента. Якщо ви
    хочете, щоб репозиторій був типовим робочим каталогом, вкажіть
    `workspace` цього агента на корінь репозиторію. Репозиторій OpenClaw — це лише source code; тримайте
    робочий простір окремо, якщо тільки ви навмисно не хочете, щоб агент працював усередині нього.

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

  <Accordion title="Віддалений режим: де знаходиться сховище сесій?">
    Станом сесій володіє **хост gateway**. Якщо ви працюєте у віддаленому режимі, потрібне вам сховище сесій знаходиться на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи конфігурації

<AccordionGroup>
  <Accordion title="Який формат конфігурації? Де вона знаходиться?">
    OpenClaw читає необов’язкову конфігурацію **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються відносно безпечні типові значення (включно з типовим робочим простором `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я встановив gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Прив’язки поза loopback **потребують дійсного шляху автентифікації gateway**. На практиці це означає:

    - автентифікацію спільним секретом: токен або пароль
    - `gateway.auth.mode: "trusted-proxy"` за правильно налаштованим reverse proxy поза loopback з awareness про identity

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

    - `gateway.remote.token` / `.password` самі по собі **не** вмикають локальну автентифікацію gateway.
    - Локальні шляхи викликів можуть використовувати `gateway.remote.*` як запасний варіант лише тоді, коли `gateway.auth.*` не встановлено.
    - Для автентифікації паролем замість цього встановіть `gateway.auth.mode: "password"` разом із `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і його не вдається визначити, визначення завершується в закритому режимі (без маскувального віддаленого запасного варіанта).
    - Конфігурації Control UI зі спільним секретом автентифікуються через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях app/UI). Режими з перенесенням identity, такі як Tailscale Serve або `trusted-proxy`, використовують натомість заголовки запиту. Уникайте розміщення спільних секретів в URL-адресах.
    - З `gateway.auth.mode: "trusted-proxy"` reverse proxy loopback на тому самому хості все одно **не** задовольняють автентифікацію trusted-proxy. Trusted proxy має бути налаштованим джерелом поза loopback.

  </Accordion>

  <Accordion title="Чому тепер мені потрібен токен на localhost?">
    OpenClaw примусово вимагає автентифікацію gateway за замовчуванням, включно з loopback. У звичайному типовому шляху це означає автентифікацію токеном: якщо явний шлях автентифікації не налаштовано, запуск gateway переходить у режим токена і автоматично генерує його, зберігаючи в `gateway.auth.token`, тому **локальні WS-клієнти мають автентифікуватися**. Це блокує інші локальні процеси від викликів Gateway.

    Якщо ви віддаєте перевагу іншому шляху автентифікації, можете явно вибрати режим пароля (або, для reverse proxy поза loopback з awareness про identity, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно встановіть `gateway.auth.mode: "none"` у своїй конфігурації. Doctor може будь-коли згенерувати токен для вас: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни конфігурації?">
    Gateway стежить за конфігурацією і підтримує hot-reload:

    - `gateway.reload.mode: "hybrid"` (типово): hot-apply для безпечних змін, перезапуск для критичних
    - також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Як вимкнути кумедні слогани CLI?">
    Установіть `cli.banner.taglineMode` у конфігурації:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: приховує текст слогана, але залишає рядок заголовка/версії банера.
    - `default`: завжди використовує `All your chats, one OpenClaw.`.
    - `random`: обертові кумедні/сезонні слогани (типова поведінка).
    - Якщо ви взагалі не хочете банер, установіть env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути web search (і web fetch)?">
    `web_fetch` працює без API key. `web_search` залежить від вибраного
    провайдера:

    - Провайдери на основі API, такі як Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, потребують свого звичайного налаштування API key.
    - Ollama Web Search не потребує ключа, але використовує ваш налаштований хост Ollama і вимагає `ollama signin`.
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
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    Специфічна для провайдера конфігурація web-search тепер розміщується в `plugins.entries.<plugin>.config.webSearch.*`.
    Застарілі шляхи провайдера `tools.web.search.*` усе ще тимчасово завантажуються заради сумісності, але їх не слід використовувати в нових конфігураціях.
    Конфігурація запасного варіанта Firecrawl для web-fetch розміщується в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlist, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` увімкнений за замовчуванням (якщо його явно не вимкнено).
    - Якщо `tools.web.fetch.provider` пропущено, OpenClaw автоматично виявляє першого готового провайдера запасного варіанта для fetch за наявними обліковими даними. Наразі вбудованим провайдером є Firecrawl.
    - Демони читають env vars з `~/.openclaw/.env` (або середовища служби).

    Документація: [Веб-інструменти](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мою конфігурацію. Як відновитися і як цього уникнути?">
    `config.apply` замінює **всю конфігурацію**. Якщо ви надсилаєте частковий об’єкт, усе
    інше видаляється.

    Поточний OpenClaw захищає від багатьох випадкових перезаписів:

    - Записи конфігурації, якими керує OpenClaw, перевіряють повну конфігурацію після зміни перед записом.
    - Некоректні або руйнівні записи, якими керує OpenClaw, відхиляються і зберігаються як `openclaw.json.rejected.*`.
    - Якщо пряме редагування ламає запуск або hot reload, Gateway відновлює останню відому робочу конфігурацію і зберігає відхилений файл як `openclaw.json.clobbered.*`.
    - Головний агент отримує попередження під час запуску після відновлення, щоб не записувати погану конфігурацію повторно наосліп.

    Відновлення:

    - Перевірте `openclaw logs --follow` на наявність `Config auto-restored from last-known-good`, `Config write rejected:` або `config reload restored last-known-good config`.
    - Перегляньте найновіший `openclaw.json.clobbered.*` або `openclaw.json.rejected.*` поруч з активною конфігурацією.
    - Залиште активну відновлену конфігурацію, якщо вона працює, а потім скопіюйте назад лише потрібні ключі через `openclaw config set` або `config.patch`.
    - Запустіть `openclaw config validate` і `openclaw doctor`.
    - Якщо у вас немає ні last-known-good, ні rejected payload, відновіть із резервної копії або повторно запустіть `openclaw doctor` і заново налаштуйте канали/моделі.
    - Якщо це було неочікувано, створіть bug report і додайте свою останню відому конфігурацію або будь-яку резервну копію.
    - Локальний coding agent часто може відновити робочу конфігурацію з журналів або історії.

    Як уникнути:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивного редагування.
    - Спочатку використовуйте `config.schema.lookup`, коли не впевнені щодо точного шляху або форми поля; він повертає поверхневий вузол схеми плюс підсумки безпосередніх дочірніх елементів для drill-down.
    - Використовуйте `config.patch` для часткових RPC-редагувань; залишайте `config.apply` лише для повної заміни конфігурації.
    - Якщо ви використовуєте інструмент `gateway`, доступний лише власнику, з запуску агента, він усе одно відхилятиме записи до `tools.exec.ask` / `tools.exec.security` (включно із застарілими псевдонімами `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Config](/uk/cli/config), [Configure](/uk/cli/configure), [Усунення неполадок Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими worker на різних пристроях?">
    Поширений шаблон — це **один Gateway** (наприклад, Raspberry Pi) плюс **nodes** і **agents**:

    - **Gateway (центральний):** володіє каналами (Signal/WhatsApp), маршрутизацією та сесіями.
    - **Nodes (пристрої):** Mac/iOS/Android підключаються як периферійні пристрої та надають локальні інструменти (`system.run`, `canvas`, `camera`).
    - **Agents (workers):** окремі "мізки"/робочі простори для спеціальних ролей (наприклад, "Hetzner ops", "Personal data").
    - **Субагенти:** створюють фонову роботу з головного агента, коли потрібен паралелізм.
    - **TUI:** підключайтеся до Gateway і перемикайте агентів/сесії.

    Документація: [Nodes](/uk/nodes), [Віддалений доступ](/uk/gateway/remote), [Мультиагентна маршрутизація](/uk/concepts/multi-agent), [Субагенти](/uk/tools/subagents), [TUI](/uk/web/tui).

  </Accordion>

  <Accordion title="Чи може browser OpenClaw працювати в headless-режимі?">
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

    Типове значення — `false` (із вікном). Headless з більшою ймовірністю викликає anti-bot перевірки на деяких сайтах. Див. [Browser](/uk/tools/browser).

    Headless використовує **той самий рушій Chromium** і працює для більшості автоматизацій (форми, кліки, скрапінг, логіни). Основні відмінності:

    - Немає видимого вікна browser (використовуйте знімки екрана, якщо потрібна візуалізація).
    - Деякі сайти суворіше ставляться до автоматизації в headless-режимі (CAPTCHA, anti-bot).
      Наприклад, X/Twitter часто блокує headless-сесії.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування browser?">
    Установіть `browser.executablePath` на двійковий файл Brave (або будь-який інший browser на основі Chromium) і перезапустіть Gateway.
    Повні приклади конфігурації див. у [Browser](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway і nodes

<AccordionGroup>
  <Accordion title="Як команди проходять між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає агента і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен node tool:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідного трафіку провайдера; вони отримують лише виклики node RPC.

  </Accordion>

  <Accordion title="Як мій агент може отримати доступ до мого комп’ютера, якщо Gateway хоститься віддалено?">
    Коротка відповідь: **pair-те свій комп’ютер як node**. Gateway працює в іншому місці, але він може
    викликати інструменти `node.*` (screen, camera, system) на вашій локальній машині через Gateway WebSocket.

    Типова конфігурація:

    1. Запустіть Gateway на постійно ввімкненому хості (VPS/домашній сервер).
    2. Розмістіть хост Gateway і свій комп’ютер в одному tailnet.
    3. Переконайтеся, що WS Gateway доступний (bind у tailnet або SSH tunnel).
    4. Локально відкрийте застосунок macOS і підключіться в режимі **Remote over SSH** (або напряму через tailnet),
       щоб він міг зареєструватися як node.
    5. Схваліть node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP bridge не потрібен; nodes підключаються через Gateway WebSocket.

    Нагадування про безпеку: pairing node macOS дозволяє `system.run` на цій машині. Pair-те
    лише пристрої, яким довіряєте, і перегляньте [Безпека](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Протокол Gateway](/uk/gateway/protocol), [Віддалений режим macOS](/uk/platforms/mac/remote), [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключено, але я не отримую відповідей. Що тепер?">
    Перевірте основи:

    - Gateway працює: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан каналу: `openclaw channels status`

    Потім перевірте автентифікацію і маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` встановлено правильно.
    - Якщо ви підключаєтеся через SSH tunnel, підтвердьте, що локальний тунель активний і вказує на правильний порт.
    - Переконайтеся, що ваші allowlist (DM або група) включають ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Віддалений доступ](/uk/gateway/remote), [Канали](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два екземпляри OpenClaw спілкуватися між собою (локальний + VPS)?">
    Так. Вбудованого bridge "бот-до-бота" немає, але це можна організувати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний чат-канал, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Bot A надішле повідомлення Bot B, а тоді Bot B відповість як зазвичай.

    **CLI bridge (загальний):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючись на чат, де слухає інший бот.
    Якщо один бот розташований на віддаленому VPS, націльте свій CLI на той віддалений Gateway
    через SSH/Tailscale (див. [Віддалений доступ](/uk/gateway/remote)).

    Приклад шаблону (запустіть на машині, яка може дістатися до цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте запобіжник, щоб два боти не зациклилися нескінченно (лише згадки, channel
    allowlist або правило "не відповідати на повідомлення ботів").

    Документація: [Віддалений доступ](/uk/gateway/remote), [CLI Agent](/uk/cli/agent), [Надсилання агентом](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох агентів?">
    Ні. Один Gateway може хостити кількох агентів, кожен зі своїм робочим простором, типовими моделями
    і маршрутизацією. Це звичайна конфігурація, і вона набагато дешевша й простіша, ніж запускати
    один VPS на агента.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні конфігурації, якими ви не хочете ділитися. В іншому разі залишайте один Gateway і
    використовуйте кількох агентів або субагентів.

  </Accordion>

  <Accordion title="Чи є перевага у використанні node на моєму особистому ноутбуці замість SSH з VPS?">
    Так — nodes є основним способом дістатися до вашого ноутбука з віддаленого Gateway, і вони
    відкривають більше, ніж просто доступ до оболонки. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким (невеликий VPS або пристрій класу Raspberry Pi цілком підходить; 4 ГБ RAM більш ніж достатньо), тому типовою
    конфігурацією є постійно ввімкнений хост плюс ваш ноутбук як node.

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до Gateway WebSocket і використовують device pairing.
    - **Безпечніше керування виконанням.** `system.run` на цьому ноутбуці контролюється через allowlist/approvals node.
    - **Більше інструментів пристрою.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна browser-автоматизація.** Тримайте Gateway на VPS, але запускайте Chrome локально через хост node на ноутбуці, або підключайтеся до локального Chrome на хості через Chrome MCP.

    SSH підходить для разового доступу до оболонки, але nodes простіші для постійних робочих процесів агента і
    автоматизації пристроїв.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають nodes службу gateway?">
    Ні. На хості має працювати лише **один gateway**, якщо тільки ви свідомо не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)). Nodes — це периферійні пристрої, які підключаються
    до gateway (nodes iOS/Android або "node mode" у menubar app на macOS). Для headless node
    host і керування через CLI див. [CLI Node host](/uk/cli/node).

    Для змін у `gateway`, `discovery` і `canvasHost` потрібен повний перезапуск.

  </Accordion>

  <Accordion title="Чи є API / RPC спосіб застосовувати конфігурацію?">
    Так.

    - `config.schema.lookup`: переглянути одне піддерево конфігурації з його поверхневим вузлом схеми, відповідною підказкою UI та підсумками безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний знімок + hash
    - `config.patch`: безпечне часткове оновлення (переважний варіант для більшості RPC-редагувань); виконує hot-reload, коли це можливо, і перезапускає, коли це потрібно
    - `config.apply`: перевірити + замінити всю конфігурацію; виконує hot-reload, коли це можливо, і перезапускає, коли це потрібно
    - Інструмент runtime `gateway`, доступний лише власнику, і далі відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

  </Accordion>

  <Accordion title="Мінімальна розумна конфігурація для першого встановлення">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Це встановлює ваш робочий простір і обмежує, хто може активувати бота.

  </Accordion>

  <Accordion title="Як налаштувати Tailscale на VPS і підключитися з мого Mac?">
    Мінімальні кроки:

    1. **Установіть + увійдіть на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Установіть + увійдіть на Mac**
       - Використайте застосунок Tailscale і увійдіть у той самий tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - У консолі адміністратора Tailscale увімкніть MagicDNS, щоб VPS мав стабільне ім’я.
    4. **Використовуйте hostname tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - WS Gateway: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо ви хочете Control UI без SSH, використовуйте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це залишає gateway прив’язаним до loopback і відкриває HTTPS через Tailscale. Див. [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="Як підключити node Mac до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Control UI + WS Gateway**. Nodes підключаються через той самий endpoint Gateway WS.

    Рекомендована конфігурація:

    1. **Переконайтеся, що VPS + Mac знаходяться в одному tailnet**.
    2. **Використовуйте застосунок macOS у Remote mode** (ціллю SSH може бути hostname tailnet).
       Застосунок протунелює порт Gateway і підключиться як node.
    3. **Схваліть node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Протокол Gateway](/uk/gateway/protocol), [Виявлення](/uk/gateway/discovery), [Віддалений режим macOS](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи краще встановити на другому ноутбуці повністю, чи просто додати node?">
    Якщо вам потрібні лише **локальні інструменти** (screen/camera/exec) на другому ноутбуці, додайте його як
    **node**. Це дозволяє зберегти один Gateway і уникнути дублювання конфігурації. Локальні інструменти node
    наразі доступні лише на macOS, але ми плануємо поширити їх і на інші ОС.

    Установлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремих боти.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes), [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars і завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує змінні середовища?">
    OpenClaw читає env vars з батьківського процесу (оболонка, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` з поточного робочого каталогу
    - глобальний запасний `.env` з `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден із `.env`-файлів не перевизначає вже наявні env vars.

    Ви також можете визначати inline env vars у конфігурації (застосовуються лише якщо їх немає в env процесу):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Повний порядок пріоритету та джерела див. у [/environment](/uk/help/environment).

  </Accordion>

  <Accordion title="Я запустив Gateway через службу, і мої env vars зникли. Що тепер?">
    Є два поширені виправлення:

    1. Помістіть відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися, навіть коли служба не успадковує env вашої оболонки.
    2. Увімкніть імпорт оболонки (зручна можливість за бажанням):

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

    Це запускає вашу login shell і імпортує лише відсутні очікувані ключі (ніколи не перевизначає наявні). Еквіваленти env vars:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Я встановив COPILOT_GITHUB_TOKEN, але models status показує "Shell env: off." Чому?'>
    `openclaw models status` повідомляє, чи ввімкнено **імпорт env оболонки**. "Shell env: off"
    **не** означає, що ваших env vars немає — це лише означає, що OpenClaw не буде
    автоматично завантажувати вашу login shell.

    Якщо Gateway працює як служба (launchd/systemd), він не успадковує середовище вашої оболонки.
    Виправити можна одним із таких способів:

    1. Помістіть токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або увімкніть імпорт оболонки (`env.shellEnv.enabled: true`).
    3. Або додайте його до блоку `env` у конфігурації (застосовується лише якщо відсутній).

    Потім перезапустіть gateway і перевірте знову:

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
    Надішліть `/new` або `/reset` як окреме повідомлення. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>

  <Accordion title="Чи скидаються сесії автоматично, якщо я ніколи не надсилаю /new?">
    Сесії можуть завершуватися після `session.idleMinutes`, але це **вимкнено за замовчуванням** (типове значення **0**).
    Установіть додатне значення, щоб увімкнути завершення за неактивністю. Коли це ввімкнено, **наступне**
    повідомлення після періоду неактивності починає новий id сесії для цього ключа чату.
    Це не видаляє transcript — просто починається нова сесія.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб зробити команду екземплярів OpenClaw (один CEO і багато агентів)?">
    Так, через **мультиагентну маршрутизацію** і **субагентів**. Ви можете створити одного агента-координатора
    і кількох агентів-робітників з власними робочими просторами та моделями.

    Водночас це краще сприймати як **цікавий експеримент**. Це витрачає багато токенів і часто
    менш ефективно, ніж використання одного бота з окремими сесіями. Типова модель, яку
    ми уявляємо, — це один бот, з яким ви спілкуєтеся, але з різними сесіями для паралельної роботи. Такий
    бот також може за потреби створювати субагентів.

    Документація: [Мультиагентна маршрутизація](/uk/concepts/multi-agent), [Субагенти](/uk/tools/subagents), [CLI Agents](/uk/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст обрізався посеред завдання? Як цьому запобігти?">
    Контекст сесії обмежений вікном моделі. Довгі чати, великі результати інструментів або багато
    файлів можуть спричиняти Compaction або усікання.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими завданнями і `/new` при зміні теми.
    - Тримайте важливий контекст у робочому просторі й просіть бота знову його прочитати.
    - Використовуйте субагентів для довгої або паралельної роботи, щоб основний чат залишався меншим.
    - Виберіть модель із більшим контекстним вікном, якщо це трапляється часто.

  </Accordion>

  <Accordion title="Як повністю скинути OpenClaw, але залишити його встановленим?">
    Використовуйте команду reset:

    ```bash
    openclaw reset
    ```

    Повне скидання в non-interactive режимі:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Потім повторно запустіть налаштування:

    ```bash
    openclaw onboard --install-daemon
    ```

    Примітки:

    - Onboarding також пропонує **Reset**, якщо бачить наявну конфігурацію. Див. [Onboarding (CLI)](/uk/start/wizard).
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скиньте кожен каталог стану (типово це `~/.openclaw-<profile>`).
    - Скидання для dev: `openclaw gateway --dev --reset` (лише для dev; стирає конфігурацію dev + облікові дані + сесії + робочий простір).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або виконати compact?'>
    Використовуйте один із цих варіантів:

    - **Compact** (зберігає розмову, але підсумовує старіші ходи):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб спрямувати підсумовування.

    - **Reset** (новий id сесії для того самого ключа чату):

      ```
      /new
      /reset
      ```

    Якщо це продовжує траплятися:

    - Увімкніть або налаштуйте **обрізання сесії** (`agents.defaults.contextPruning`), щоб обрізати старий вивід інструментів.
    - Використовуйте модель із більшим контекстним вікном.

    Документація: [Compaction](/uk/concepts/compaction), [Обрізання сесії](/uk/concepts/session-pruning), [Керування сесіями](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка перевірки провайдера: модель згенерувала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що історія сесії застаріла або пошкоджена (часто після довгих потоків
    або зміни інструмента/схеми).

    Виправлення: почніть нову сесію за допомогою `/new` (окреме повідомлення).

  </Accordion>

  <Accordion title="Чому я отримую повідомлення Heartbeat кожні 30 хвилин?">
    Heartbeats типово запускаються кожні **30 хв** (**1 год**, якщо використовується OAuth auth). Налаштуйте або вимкніть їх:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки й markdown-заголовки
    на кшталт `# Heading`), OpenClaw пропускає запуск Heartbeat, щоб зберегти API calls.
    Якщо файла немає, Heartbeat усе одно запускається, і модель сама вирішує, що робити.

    Для перевизначень на рівні агента використовуйте `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "обліковий запис бота" до групи WhatsApp?'>
    Ні. OpenClaw працює на **вашому власному обліковому записі**, тож якщо ви є в групі, OpenClaw може її бачити.
    За замовчуванням відповіді в групах заблоковано, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

    Якщо ви хочете, щоб відповіді в групі могли активувати лише **ви**:

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
    Варіант 1 (найшвидший): переглядайте журнали в режимі tail і надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Шукайте `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/є в allowlist): перелічіть групи з конфігурації:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/uk/cli/directory), [Logs](/uk/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Є дві поширені причини:

    - Увімкнено обмеження за згадками (типово). Ви маєте @згадати бота (або відповідати `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і група не входить до allowlist.

    Див. [Groups](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи спільний контекст у груп/потоків і особистих повідомлень?">
    Прямі чати типово згортаються в головну сесію. Групи/канали мають власні ключі сесій, а теми Telegram / потоки Discord є окремими сесіями. Див. [Groups](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки робочих просторів і агентів я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але стежте за:

    - **Зростанням диска:** сесії + transcript зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартістю токенів:** більше агентів означає більше одночасного використання моделей.
    - **Операційними витратами:** профілі автентифікації, робочі простори та маршрутизація каналів для кожного агента.

    Поради:

    - Залишайте один **активний** робочий простір на агента (`agents.defaults.workspace`).
    - Очищайте старі сесії (видаляйте JSONL або записи сховища), якщо диск розростається.
    - Використовуйте `openclaw doctor`, щоб виявляти зайві робочі простори та невідповідності профілів.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька ботів або чатів одночасно (Slack), і як це краще налаштувати?">
    Так. Використовуйте **Multi-Agent Routing**, щоб запускати кілька ізольованих агентів і маршрутизувати вхідні повідомлення за
    каналом/обліковим записом/peer. Slack підтримується як канал і може бути прив’язаний до конкретних агентів.

    Доступ до browser потужний, але це не означає "робити все, що може людина" — anti-bot, CAPTCHA та MFA все ще
    можуть блокувати автоматизацію. Для найнадійнішого керування browser використовуйте локальний Chrome MCP на хості
    або CDP на машині, яка фактично запускає browser.

    Найкраща практика налаштування:

    - Постійно ввімкнений хост Gateway (VPS/Mac mini).
    - Один агент на роль (bindings).
    - Канал(и) Slack, прив’язані до цих агентів.
    - Локальний browser через Chrome MCP або node, коли це потрібно.

    Документація: [Multi-Agent Routing](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Browser](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі: типові значення, вибір, псевдоніми, перемикання

<AccordionGroup>
  <Accordion title='Що таке "типова модель"?'>
    Типова модель OpenClaw — це те, що ви встановили як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються як `provider/model` (приклад: `openai/gpt-5.5`). Якщо ви пропускаєте провайдера, OpenClaw спочатку намагається знайти псевдонім, потім — унікальний збіг exact model id серед налаштованих провайдерів, і лише після цього використовує запасний варіант — налаштований типовий провайдер — як застарілий шлях сумісності. Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw використовує запасний варіант — перший налаштований провайдер/модель — замість того, щоб показувати застаріле типове значення від видаленого провайдера. Вам усе одно слід **явно** встановлювати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендоване типове значення:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    **Для агентів з інструментами або недовіреним вводом:** ставте силу моделі вище за вартість.
    **Для звичайного/низькоризикового чату:** використовуйте дешевші запасні моделі та маршрутизуйте за роллю агента.

    Для MiniMax є окрема документація: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Практичне правило: використовуйте **найкращу модель, яку можете собі дозволити**, для високоризикової роботи, а дешевшу
    модель — для повсякденного чату або підсумків. Ви можете маршрутизувати моделі для кожного агента й використовувати субагентів для
    паралелізації довгих завдань (кожен субагент витрачає токени). Див. [Моделі](/uk/concepts/models) і
    [Субагенти](/uk/tools/subagents).

    Серйозне попередження: слабші/надто квантизовані моделі більш вразливі до prompt
    injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі, не стираючи конфігурацію?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни конфігурації.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для окремої сесії)
    - `openclaw models set ...` (оновлює лише конфігурацію моделі)
    - `openclaw configure --section model` (інтерактивно)
    - редагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` з частковим об’єктом, якщо тільки ви справді не хочете замінити всю конфігурацію.
    Для RPC-редагувань спершу перегляньте через `config.schema.lookup` і віддавайте перевагу `config.patch`. Payload lookup надає нормалізований шлях, поверхневу документацію/обмеження схеми та підсумки безпосередніх дочірніх елементів
    для часткових оновлень.
    Якщо ви все ж перезаписали конфігурацію, відновіть її з резервної копії або повторно запустіть `openclaw doctor` для відновлення.

    Документація: [Моделі](/uk/concepts/models), [Configure](/uk/cli/configure), [Config](/uk/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати self-hosted моделі (llama.cpp, vLLM, Ollama)?">
    Так. Найпростішим шляхом для локальних моделей є Ollama.

    Найшвидше налаштування:

    1. Установіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо ви також хочете хмарні моделі, виконайте `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає вам і хмарні моделі, і локальні моделі Ollama
    - хмарні моделі, такі як `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі більш уразливі до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все ж хочете малі моделі, увімкніть sandboxing і суворі allowlist інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Провайдери моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Sandboxing](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - У цих розгортаннях вони можуть відрізнятися та змінюватися з часом; фіксованої рекомендації щодо провайдера немає.
    - Перевіряйте поточне налаштування runtime на кожному gateway через `openclaw models status`.
    - Для агентів із чутливими до безпеки/інструментальними завданнями використовуйте найсильнішу доступну модель останнього покоління.
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

    Ви можете перелічити доступні моделі через `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований вибір. Вибирайте за номером:

    ```
    /model 3
    ```

    Ви також можете примусово вибрати конкретний профіль автентифікації для провайдера (для сесії):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який агент активний, який файл `auth-profiles.json` використовується і який профіль автентифікації буде спробовано наступним.
    Він також показує налаштований endpoint провайдера (`baseUrl`) і режим API (`api`), коли вони доступні.

    **Як зняти закріплення профілю, який я встановив через @profile?**

    Повторно запустіть `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо ви хочете повернутися до типового значення, виберіть його з `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль автентифікації активний.

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.5 для щоденних завдань, а Codex 5.5 — для кодування?">
    Так. Установіть одну як типову й перемикайтеся за потреби:

    - **Швидке перемикання (для сесії):** `/model gpt-5.5` для щоденних завдань або залиште ту саму модель і перемикайте автентифікацію/профіль за потреби.
    - **Типове значення:** установіть `agents.defaults.model.primary` у `openai/gpt-5.5`.
    - **Субагенти:** маршрутизуйте завдання кодування до субагентів з іншою типовою моделлю.

    Див. [Моделі](/uk/concepts/models) і [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати fast mode для GPT 5.5?">
    Використовуйте або перемикач для сесії, або типове значення в конфігурації:

    - **Для сесії:** надішліть `/fast on`, поки сесія використовує `openai/gpt-5.5`.
    - **Типове значення для моделі:** установіть `agents.defaults.models["openai/gpt-5.5"].params.fastMode` у `true`.
    - **Застарілі псевдоніми:** старіші записи `openai-codex/gpt-*` можуть зберігати власні params, але нові конфігурації повинні розміщувати params на `openai/gpt-*`.

    Приклад:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Для OpenAI fast mode відображається в `service_tier = "priority"` у підтримуваних нативних запитах Responses. `/fast` для сесії має пріоритет над типовими значеннями конфігурації.

    Див. [Thinking і fast mode](/uk/tools/thinking) та [OpenAI fast mode](/uk/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо встановлено `agents.defaults.models`, це стає **allowlist** для `/model` і будь-яких
    перевизначень сесії. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, видаліть allowlist або виберіть модель з `/model list`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **провайдера не налаштовано** (не знайдено ні конфігурації провайдера MiniMax, ні
    профілю автентифікації), тому модель не вдається визначити.

    Контрольний список виправлення:

    1. Оновіться до поточного випуску OpenClaw (або запускайте з source `main`), а потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (майстер або JSON), або що автентифікація MiniMax
       існує в env/профілях автентифікації, щоб відповідний провайдер міг бути вставлений
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений MiniMax
       OAuth для `minimax-portal`).
    3. Використовуйте точний id моделі (з урахуванням регістру) для вашого шляху автентифікації:
       `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed` для налаштування
       API key, або `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` для налаштування OAuth.
    4. Запустіть:

       ```bash
       openclaw models list
       ```

       і виберіть зі списку (або `/model list` у чаті).

    Див. [MiniMax](/uk/providers/minimax) і [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати MiniMax як типове значення, а OpenAI — для складних завдань?">
    Так. Використовуйте **MiniMax як типове значення** і перемикайте моделі **для кожної сесії** за потреби.
    Запасні варіанти призначені для **помилок**, а не для "складних завдань", тому використовуйте `/model` або окремого агента.

    **Варіант A: перемикання для сесії**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Потім:

    ```
    /model gpt
    ```

    **Варіант B: окремі агенти**

    - Типове значення агента A: MiniMax
    - Типове значення агента B: OpenAI
    - Маршрутизуйте за агентом або використовуйте `/agent` для перемикання

    Документація: [Моделі](/uk/concepts/models), [Мультиагентна маршрутизація](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома типовими shorthand-ами (застосовуються лише тоді, коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви встановите власний псевдонім з такою самою назвою, переможе ваше значення.

  </Accordion>

  <Accordion title="Як визначати/перевизначати скорочення моделей (псевдоніми)?">
    Псевдоніми походять з `agents.defaults.models.<modelId>.alias`. Приклад:

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

    Тоді `/model sonnet` (або `/<alias>`, де це підтримується) визначається в цей ID моделі.

  </Accordion>

  <Accordion title="Як додати моделі від інших провайдерів, як-от OpenRouter або Z.AI?">
    OpenRouter (оплата за токен; багато моделей):

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

    Якщо ви посилаєтеся на `provider/model`, але потрібний ключ провайдера відсутній, ви отримаєте помилку автентифікації під час виконання (наприклад `No API key found for provider "zai"`).

    **No API key found for provider після додавання нового агента**

    Зазвичай це означає, що **новий агент** має порожнє сховище автентифікації. Автентифікація прив’язана до агента і
    зберігається тут:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Запустіть `openclaw agents add <id>` і налаштуйте автентифікацію під час роботи майстра.
    - Або скопіюйте `auth-profiles.json` з `agentDir` головного агента до `agentDir` нового агента.

    **Не** використовуйте один `agentDir` повторно для кількох агентів; це спричиняє колізії автентифікації/сесій.

  </Accordion>
</AccordionGroup>

## Запасні варіанти моделей і "All models failed"

<AccordionGroup>
  <Accordion title="Як працює failover?">
    Failover відбувається у два етапи:

    1. **Ротація профілів автентифікації** в межах одного провайдера.
    2. **Запасний варіант моделі** на наступну модель у `agents.defaults.model.fallbacks`.

    До профілів, які дають збій, застосовуються cooldown (експоненційний backoff), тож OpenClaw може продовжувати відповідати навіть тоді, коли провайдер має rate limit або тимчасово дає збої.

    Категорія rate-limit включає не лише звичайні відповіді `429`. OpenClaw
    також розглядає як придатні для failover повідомлення на кшталт `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    ліміти вікон використання (`weekly/monthly limit reached`).

    Деякі відповіді, схожі на billing, не є `402`, і деякі HTTP `402`
    теж залишаються в цій тимчасовій категорії. Якщо провайдер повертає
    явний текст про billing на `401` або `403`, OpenClaw все одно може тримати це
    в смузі billing, але специфічні для провайдера text matcher-и залишаються обмеженими
    провайдером, якому вони належать (наприклад OpenRouter `Key limit exceeded`). Якщо повідомлення `402`
    натомість виглядає як повторюване вікно використання або
    ліміт витрат організації/робочого простору (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw трактує це як
    `rate_limit`, а не як довге вимкнення через billing.

    Помилки переповнення контексту відрізняються: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху Compaction/retry замість переходу до запасної
    моделі.

    Загальний текст про помилки сервера навмисно вужчий, ніж "усе, що має
    unknown/error". OpenClaw справді трактує як придатні для failover специфічні для провайдера транзитні форми,
    такі як bare `An unknown error occurred` у Anthropic, bare
    `Provider returned error` в OpenRouter, помилки reason завершення на кшталт `Unhandled stop reason:
    error`, JSON payload-и `api_error` з транзитним server-текстом
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості провайдера, такі як `ModelNotReadyException`, як
    сигнали timeout/перевантаження, придатні для failover, коли збігається контекст
    провайдера.
    Загальний внутрішній fallback-текст на кшталт `LLM request failed with an unknown
    error.` залишається консервативним і сам по собі не запускає запасний варіант моделі.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система намагалася використати ID профілю автентифікації `anthropic:default`, але не змогла знайти для нього облікові дані в очікуваному сховищі автентифікації.

    **Контрольний список виправлення:**

    - **Підтвердьте, де живуть профілі автентифікації** (нові та застарілі шляхи)
      - Поточний: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`)
    - **Підтвердьте, що ваша env var завантажена Gateway**
      - Якщо ви встановили `ANTHROPIC_API_KEY` у своїй оболонці, але запускаєте Gateway через systemd/launchd, він може її не успадкувати. Помістіть її в `~/.openclaw/.env` або ввімкніть `env.shellEnv`.
    - **Переконайтеся, що ви редагуєте правильного агента**
      - У мультиагентних конфігураціях може існувати кілька файлів `auth-profiles.json`.
    - **Перевірте стан моделі/автентифікації**
      - Використовуйте `openclaw models status`, щоб побачити налаштовані моделі й те, чи автентифіковані провайдери.

    **Контрольний список виправлення для "No credentials found for profile anthropic"**

    Це означає, що запуск закріплено за профілем автентифікації Anthropic, але Gateway
    не може знайти його у своєму сховищі автентифікації.

    - **Використовуйте Claude CLI**
      - Запустіть `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо ви хочете замість цього використовувати API key**
      - Помістіть `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистьте будь-який закріплений порядок, який примушує використовувати відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Підтвердьте, що ви запускаєте команди на хості gateway**
      - У віддаленому режимі профілі автентифікації живуть на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому він також спробував Google Gemini і завершився помилкою?">
    Якщо ваша конфігурація моделі включає Google Gemini як запасний варіант (або ви перемкнулися на shorthand Gemini), OpenClaw спробує її під час запасного переходу між моделями. Якщо ви не налаштували облікові дані Google, ви побачите `No API key found for provider "google"`.

    Виправлення: або надайте автентифікацію Google, або видаліть/уникайте моделей Google у `agents.defaults.model.fallbacks` / псевдонімах, щоб запасний перехід не маршрутизував туди.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Причина: історія сесії містить **thinking-блоки без сигнатур** (часто через
    перерваний/частковий потік). Google Antigravity вимагає сигнатур для thinking-блоків.

    Виправлення: OpenClaw тепер видаляє thinking-блоки без сигнатур для Google Antigravity Claude. Якщо це все ще з’являється, почніть **нову сесію** або встановіть `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Профілі автентифікації: що це таке і як ними керувати

Пов’язане: [/concepts/oauth](/uk/concepts/oauth) (потоки OAuth, зберігання токенів, шаблони для кількох облікових записів)

<AccordionGroup>
  <Accordion title="Що таке профіль автентифікації?">
    Профіль автентифікації — це іменований запис облікових даних (OAuth або API key), прив’язаний до провайдера. Профілі живуть тут:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Які типові ID профілів?">
    OpenClaw використовує ID з префіксом провайдера, наприклад:

    - `anthropic:default` (типово, коли немає email-identity)
    - `anthropic:<email>` для OAuth-identity
    - ваші власні ID (наприклад `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який профіль автентифікації пробується першим?">
    Так. Конфігурація підтримує необов’язкові метадані для профілів і порядок для кожного провайдера (`auth.order.<provider>`). Це **не** зберігає секрети; воно зіставляє ID з провайдером/режимом і встановлює порядок ротації.

    OpenClaw може тимчасово пропустити профіль, якщо він перебуває в короткому **cooldown** (rate limits/timeouts/auth failures) або в довшому стані **disabled** (billing/insufficient credits). Щоб перевірити це, запустіть `openclaw models status --json` і перегляньте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Cooldown для rate-limit може залежати від моделі. Профіль, який перебуває в cooldown
    для однієї моделі, усе ще може бути придатним для сусідньої моделі того самого провайдера,
    тоді як вікна billing/disabled усе одно блокують увесь профіль.

    Ви також можете встановити **перевизначення порядку для кожного агента** (зберігається в `auth-state.json` цього агента) через CLI:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Щоб націлитися на конкретного агента:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Щоб перевірити, що насправді буде спробовано, використовуйте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль пропущено в явному порядку, перевірка повідомить
    `excluded_by_auth_order` для цього профілю замість мовчазної спроби його використати.

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

  <Accordion title='Чому openclaw gateway status каже "Runtime: running", але "Connectivity probe: failed"?'>
    Тому що "running" — це погляд **supervisor** (launchd/systemd/schtasks). Перевірка підключення — це CLI, який фактично підключається до gateway WebSocket.

    Використовуйте `openclaw gateway status` і довіряйте цим рядкам:

    - `Probe target:` (URL-адреса, яку перевірка фактично використовувала)
    - `Listening:` (що фактично прив’язано до порту)
    - `Last gateway error:` (поширена першопричина, коли процес живий, але порт не слухає)

  </Accordion>

  <Accordion title='Чому openclaw gateway status показує різні "Config (cli)" і "Config (service)"?'>
    Ви редагуєте один файл конфігурації, тоді як служба працює з іншим (часто через невідповідність `--profile` / `OPENCLAW_STATE_DIR`).

    Виправлення:

    ```bash
    openclaw gateway install --force
    ```

    Запустіть це з того самого `--profile` / середовища, яке ви хочете, щоб використовувала служба.

  </Accordion>

  <Accordion title='Що означає "another gateway instance is already listening"?'>
    OpenClaw забезпечує runtime-блокування, прив’язуючи слухач WebSocket одразу під час запуску (типово `ws://127.0.0.1:18789`). Якщо прив’язка не вдається з `EADDRINUSE`, він викидає `GatewayLockError`, вказуючи, що вже слухає інший екземпляр.

    Виправлення: зупиніть інший екземпляр, звільніть порт або запускайте з `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Як запустити OpenClaw у віддаленому режимі (клієнт підключається до Gateway десь в іншому місці)?">
    Установіть `gateway.mode: "remote"` і вкажіть віддалену WebSocket URL-адресу, за потреби разом із віддаленими обліковими даними зі спільним секретом:

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
    - Застосунок macOS стежить за файлом конфігурації й живо перемикає режими, коли ці значення змінюються.
    - `gateway.remote.token` / `.password` — це лише клієнтські віддалені облікові дані; вони самі по собі не вмикають локальну автентифікацію gateway.

  </Accordion>

  <Accordion title='Control UI каже "unauthorized" (або постійно перепідключається). Що тепер?'>
    Шлях автентифікації вашого gateway і спосіб автентифікації UI не збігаються.

    Факти (з коду):

    - Control UI зберігає токен у `sessionStorage` для поточної сесії вкладки browser і вибраної URL-адреси gateway, тож оновлення цієї самої вкладки продовжують працювати без відновлення довготривалого зберігання токена в localStorage.
    - При `AUTH_TOKEN_MISMATCH` довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном пристрою, коли gateway повертає підказки для повторної спроби (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ця повторна спроба з кешованим токеном тепер повторно використовує кешовані схвалені області дії, збережені разом із токеном пристрою. Виклики з явними `deviceToken` / явними `scopes` усе одно зберігають власний запитаний набір областей дії замість успадкування кешованих.
    - Поза цим шляхом повторної спроби пріоритет автентифікації connect такий: спочатку явний спільний токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap token.
    - Перевірки області дії bootstrap token мають префікс ролі. Вбудований allowlist bootstrap operator задовольняє лише запити оператора; node або інші ролі, що не є операторськими, усе одно потребують областей дії під власним префіксом ролі.

    Виправлення:

    - Найшвидше: `openclaw dashboard` (виводить + копіює URL-адресу панелі, намагається відкрити; у headless-режимі показує підказку SSH).
    - Якщо у вас ще немає токена: `openclaw doctor --generate-gateway-token`.
    - Якщо віддалено, спочатку створіть тунель: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`.
    - Режим спільного секрету: установіть `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, а потім вставте відповідний секрет у налаштуваннях Control UI.
    - Режим Tailscale Serve: переконайтеся, що `gateway.auth.allowTailscale` увімкнено і що ви відкриваєте URL-адресу Serve, а не raw loopback/tailnet URL, яка обходить заголовки identity Tailscale.
    - Режим trusted-proxy: переконайтеся, що ви приходите через налаштований reverse proxy поза loopback з awareness про identity, а не через proxy loopback на тому самому хості або raw URL gateway.
    - Якщо невідповідність зберігається після однієї повторної спроби, виконайте rotate/re-approve paired device token:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Якщо цей виклик rotate каже, що йому відмовлено, перевірте дві речі:
      - paired-device sessions можуть виконувати rotate лише для **власного** пристрою, якщо тільки вони також не мають `operator.admin`
      - явні значення `--scope` не можуть перевищувати поточні області дії оператора викликача
    - Усе ще застрягли? Запустіть `openclaw status --all` і дотримуйтеся [Усунення неполадок](/uk/gateway/troubleshooting). Деталі автентифікації див. у [Dashboard](/uk/web/dashboard).

  </Accordion>

  <Accordion title="Я встановив gateway.bind tailnet, але він не може прив’язатися і нічого не слухає">
    Прив’язка `tailnet` вибирає Tailscale IP з ваших мережевих інтерфейсів (100.64.0.0/10). Якщо машина не в Tailscale (або інтерфейс вимкнено), прив’язуватися нема до чого.

    Виправлення:

    - Запустіть Tailscale на цьому хості (щоб він мав адресу 100.x), або
    - Перемкніться на `gateway.bind: "loopback"` / `"lan"`.

    Примітка: `tailnet` є явним режимом. `auto` віддає перевагу loopback; використовуйте `gateway.bind: "tailnet"`, коли вам потрібна прив’язка лише до tailnet.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька Gateway на одному хості?">
    Зазвичай ні — один Gateway може запускати кілька каналів повідомлень і агентів. Використовуйте кілька Gateway лише тоді, коли вам потрібна надмірність (наприклад, rescue bot) або жорстка ізоляція.

    Так, але ви повинні ізолювати:

    - `OPENCLAW_CONFIG_PATH` (конфігурація для кожного екземпляра)
    - `OPENCLAW_STATE_DIR` (стан для кожного екземпляра)
    - `agents.defaults.workspace` (ізоляція робочого простору)
    - `gateway.port` (унікальні порти)

    Швидке налаштування (рекомендовано):

    - Використовуйте `openclaw --profile <name> ...` для кожного екземпляра (автоматично створює `~/.openclaw-<name>`).
    - Установіть унікальний `gateway.port` у конфігурації кожного профілю (або передавайте `--port` для ручних запусків).
    - Установіть службу для кожного профілю: `openclaw --profile <name> gateway install`.

    Профілі також додають суфікси до назв служб (`ai.openclaw.<profile>`; застарілі `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Повний посібник: [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Що означає "invalid handshake" / код 1008?'>
    Gateway — це **WebSocket server**, і він очікує, що найпершим повідомленням
    буде кадр `connect`. Якщо він отримує щось інше, то закриває з’єднання
    з **кодом 1008** (порушення політики).

    Поширені причини:

    - Ви відкрили **HTTP** URL-адресу в browser (`http://...`) замість WS-клієнта.
    - Ви використали неправильний порт або шлях.
    - Проксі або тунель видалив заголовки автентифікації або надіслав не-Gateway запит.

    Швидкі виправлення:

    1. Використовуйте WS URL-адресу: `ws://<host>:18789` (або `wss://...`, якщо HTTPS).
    2. Не відкривайте WS-порт у звичайній вкладці browser.
    3. Якщо автентифікацію ввімкнено, включіть токен/пароль у кадр `connect`.

    Якщо ви використовуєте CLI або TUI, URL-адреса має виглядати так:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Деталі протоколу: [Протокол Gateway](/uk/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Журналювання і налагодження

<AccordionGroup>
  <Accordion title="Де журнали?">
    Файлові журнали (структуровані):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Ви можете встановити стабільний шлях через `logging.file`. Рівень файлового журналу контролюється `logging.level`. Докладність консолі контролюється через `--verbose` і `logging.consoleLevel`.

    Найшвидший tail журналу:

    ```bash
    openclaw logs --follow
    ```

    Журнали служби/supervisor (коли gateway працює через launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` і `gateway.err.log` (типово: `~/.openclaw/logs/...`; профілі використовують `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Більше інформації див. в [Усунення неполадок](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Як запустити/зупинити/перезапустити службу Gateway?">
    Використовуйте допоміжні команди gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви запускаєте gateway вручну, `openclaw gateway --force` може захопити порт. Див. [Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Я закрив свій термінал у Windows — як перезапустити OpenClaw?">
    Є **два режими встановлення на Windows**:

    **1) WSL2 (рекомендовано):** Gateway працює всередині Linux.

    Відкрийте PowerShell, зайдіть у WSL, а потім перезапустіть:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви ніколи не встановлювали службу, запустіть її на передньому плані:

    ```bash
    openclaw gateway run
    ```

    **2) Нативна Windows (не рекомендовано):** Gateway працює безпосередньо у Windows.

    Відкрийте PowerShell і виконайте:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви запускаєте його вручну (без служби), використовуйте:

    ```powershell
    openclaw gateway run
    ```

    Документація: [Windows (WSL2)](/uk/platforms/windows), [Runbook служби Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Gateway працює, але відповіді так і не надходять. Що перевірити?">
    Почніть зі швидкої перевірки здоров’я:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Поширені причини:

    - Автентифікація моделі не завантажена на **хості gateway** (перевірте `models status`).
    - Pairing/allowlist каналу блокує відповіді (перевірте конфігурацію каналу + журнали).
    - WebChat/Dashboard відкрито без правильного токена.

    Якщо ви працюєте віддалено, переконайтеся, що тунель/Tailscale-з’єднання активне і що
    Gateway WebSocket доступний.

    Документація: [Канали](/uk/channels), [Усунення неполадок](/uk/gateway/troubleshooting), [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — що тепер?'>
    Зазвичай це означає, що UI втратив WebSocket-з’єднання. Перевірте:

    1. Чи працює Gateway? `openclaw gateway status`
    2. Чи Gateway здоровий? `openclaw status`
    3. Чи має UI правильний токен? `openclaw dashboard`
    4. Якщо віддалено, чи активне з’єднання тунелю/Tailscale?

    Потім переглядайте журнали в режимі tail:

    ```bash
    openclaw logs --follow
    ```

    Документація: [Dashboard](/uk/web/dashboard), [Віддалений доступ](/uk/gateway/remote), [Усунення неполадок](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands завершується помилкою. Що перевірити?">
    Почніть із журналів і стану каналу:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Потім зіставте помилку:

    - `BOT_COMMANDS_TOO_MUCH`: у меню Telegram забагато записів. OpenClaw уже обрізає їх до ліміту Telegram і повторює спробу з меншою кількістю команд, але деякі записи меню все одно потрібно прибрати. Зменште кількість команд Plugin/Skills/власних команд або вимкніть `channels.telegram.commands.native`, якщо меню вам не потрібне.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` або подібні мережеві помилки: якщо ви працюєте на VPS або за проксі, переконайтеся, що вихідний HTTPS дозволено і що DNS працює для `api.telegram.org`.

    Якщо Gateway віддалений, переконайтеся, що ви дивитеся журнали саме на хості Gateway.

    Документація: [Telegram](/uk/channels/telegram), [Усунення неполадок каналів](/uk/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI не показує вивід. Що перевірити?">
    Спочатку підтвердьте, що Gateway доступний і агент може запускатися:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    У TUI використовуйте `/status`, щоб побачити поточний стан. Якщо ви очікуєте відповіді в чаті
    каналу, переконайтеся, що доставку ввімкнено (`/deliver on`).

    Документація: [TUI](/uk/web/tui), [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як повністю зупинити, а потім запустити Gateway?">
    Якщо ви встановили службу:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Це зупиняє/запускає **керовану службу** (launchd на macOS, systemd на Linux).
    Використовуйте це, коли Gateway працює у фоновому режимі як демон.

    Якщо ви запускаєте на передньому плані, зупиніть через Ctrl-C, а потім:

    ```bash
    openclaw gateway run
    ```

    Документація: [Runbook служби Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Поясніть як для п’ятирічної дитини: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: перезапускає **фонову службу** (launchd/systemd).
    - `openclaw gateway`: запускає gateway **на передньому плані** для цієї сесії термінала.

    Якщо ви встановили службу, використовуйте команди gateway. Використовуйте `openclaw gateway`, коли
    вам потрібен одноразовий запуск на передньому плані.

  </Accordion>

  <Accordion title="Найшвидший спосіб отримати більше деталей, коли щось ламається">
    Запустіть Gateway з `--verbose`, щоб отримати більше деталей у консолі. Потім перегляньте файл журналу для автентифікації каналу, маршрутизації моделей і помилок RPC.
  </Accordion>
</AccordionGroup>

## Медіа та вкладення

<AccordionGroup>
  <Accordion title="Мій Skill згенерував зображення/PDF, але нічого не було надіслано">
    Вихідні вкладення від агента мають включати рядок `MEDIA:<path-or-url>` (окремим рядком). Див. [Налаштування помічника OpenClaw](/uk/start/openclaw) і [Надсилання агентом](/uk/tools/agent-send).

    Надсилання через CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Також перевірте:

    - Цільовий канал підтримує вихідні медіа і не заблокований allowlist.
    - Файл не перевищує ліміти розміру провайдера (зображення змінюють розмір до максимуму 2048px).
    - `tools.fs.workspaceOnly=true` обмежує надсилання локальних шляхів робочим простором, temp/media-store і файлами, перевіреними sandbox.
    - `tools.fs.workspaceOnly=false` дозволяє `MEDIA:` надсилати локальні файли хоста, які агент уже може читати, але лише для медіа плюс безпечних типів документів (зображення, аудіо, відео, PDF і документи Office). Звичайний текст і файли, схожі на секрети, усе одно блокуються.

    Див. [Зображення](/uk/nodes/images).

  </Accordion>
</AccordionGroup>

## Безпека і контроль доступу

<AccordionGroup>
  <Accordion title="Чи безпечно відкривати OpenClaw для вхідних особистих повідомлень?">
    Сприймайте вхідні особисті повідомлення як недовірений ввід. Типові значення розроблені для зниження ризику:

    - Типова поведінка на каналах, що підтримують особисті повідомлення, — **pairing**:
      - Невідомі відправники отримують код pairing; бот не обробляє їхнє повідомлення.
      - Схвалення: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Очікувані запити обмежено **3 на канал**; перевіряйте `openclaw pairing list --channel <channel> [--account <id>]`, якщо код не надійшов.
    - Публічне відкриття особистих повідомлень вимагає явної згоди (`dmPolicy: "open"` і allowlist `"*"`).

    Запустіть `openclaw doctor`, щоб побачити ризиковані політики особистих повідомлень.

  </Accordion>

  <Accordion title="Чи prompt injection є проблемою лише для публічних ботів?">
    Ні. Prompt injection стосується **недовіреного вмісту**, а не лише того, хто може писати боту в DM.
    Якщо ваш помічник читає зовнішній вміст (web search/fetch, сторінки browser, emails,
    docs, вкладення, вставлені журнали), цей вміст може містити інструкції, які намагаються
    перехопити керування моделлю. Це може статися, навіть якщо **ви — єдиний відправник**.

    Найбільший ризик виникає, коли ввімкнено інструменти: модель можна обдурити так, щоб вона
    ексфільтрувала контекст або викликала інструменти від вашого імені. Зменшуйте радіус ураження так:

    - використовуйте "reader"-агента лише для читання або без інструментів, щоб підсумовувати недовірений вміст
    - тримайте `web_search` / `web_fetch` / `browser` вимкненими для агентів з інструментами
    - сприймайте декодований текст файлів/документів також як недовірений: OpenResponses
      `input_file` і витяг тексту з медіавкладень обидва загортають витягнутий текст у
      явні boundary marker-и зовнішнього вмісту замість передавання сирого тексту файла
    - використовуйте sandboxing і суворі allowlist інструментів

    Деталі: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи має мій бот мати власну email-адресу, GitHub-обліковий запис або номер телефону?">
    Так, для більшості конфігурацій. Ізоляція бота окремими обліковими записами та номерами телефонів
    зменшує радіус ураження, якщо щось піде не так. Це також полегшує ротацію
    облікових даних або відкликання доступу без впливу на ваші особисті облікові записи.

    Починайте з малого. Надавайте доступ лише до тих інструментів і облікових записів, які вам реально потрібні, і
    розширюйте пізніше за потреби.

    Документація: [Безпека](/uk/gateway/security), [Pairing](/uk/channels/pairing).

  </Accordion>

  <Accordion title="Чи можу я дати йому автономність над моїми текстовими повідомленнями, і чи це безпечно?">
    Ми **не** рекомендуємо повну автономність над вашими особистими повідомленнями. Найбезпечніший шаблон:

    - Тримайте особисті повідомлення в режимі **pairing** або зі суворим allowlist.
    - Використовуйте **окремий номер або обліковий запис**, якщо хочете, щоб він писав від вашого імені.
    - Нехай він створює чернетку, а ви **схвалюйте перед надсиланням**.

    Якщо ви хочете поекспериментувати, робіть це на окремому обліковому записі й тримайте його ізольованим. Див.
    [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи можу я використовувати дешевші моделі для завдань персонального помічника?">
    Так, **якщо** агент використовується лише для чату і ввід є довіреним. Менші рівні
    більш схильні до перехоплення інструкцій, тому уникайте їх для агентів з інструментами
    або коли читаєте недовірений вміст. Якщо вам усе ж потрібно використовувати меншу модель, жорстко обмежте
    інструменти й запускайте всередині sandbox. Див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Я запустив /start у Telegram, але не отримав код pairing">
    Коди pairing надсилаються **лише** тоді, коли невідомий відправник пише боту і
    ввімкнено `dmPolicy: "pairing"`. Сам по собі `/start` не генерує коду.

    Перевірте очікувані запити:

    ```bash
    openclaw pairing list telegram
    ```

    Якщо вам потрібен негайний доступ, додайте свій sender id до allowlist або встановіть `dmPolicy: "open"`
    для цього облікового запису.

  </Accordion>

  <Accordion title="WhatsApp: чи буде він писати моїм контактам? Як працює pairing?">
    Ні. Типова політика особистих повідомлень WhatsApp — **pairing**. Невідомі відправники отримують лише код pairing, і їхнє повідомлення **не обробляється**. OpenClaw відповідає лише на чати, які він отримує, або на явні надсилання, які ви ініціюєте.

    Схвалення pairing:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Перелік очікуваних запитів:

    ```bash
    openclaw pairing list whatsapp
    ```

    Запит номера телефону в майстрі: він використовується для встановлення вашого **allowlist/owner**, щоб ваші власні особисті повідомлення були дозволені. Він не використовується для автоматичного надсилання. Якщо ви запускаєте на своєму особистому номері WhatsApp, використовуйте цей номер і ввімкніть `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Команди чату, переривання завдань і "воно не зупиняється"

<AccordionGroup>
  <Accordion title="Як зробити так, щоб внутрішні системні повідомлення не показувалися в чаті?">
    Більшість внутрішніх або tool-повідомлень з’являються лише тоді, коли для цієї сесії ввімкнено **verbose**, **trace** або **reasoning**.

    Виправлення в чаті, де ви це бачите:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Якщо шум усе ще є, перевірте налаштування сесії в Control UI і встановіть verbose
    у **inherit**. Також переконайтеся, що ви не використовуєте профіль бота з `verboseDefault`, установленим
    у `on` в конфігурації.

    Документація: [Thinking і verbose](/uk/tools/thinking), [Безпека](/uk/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Як зупинити/скасувати завдання, що виконується?">
    Надішліть будь-який із цих варіантів **як окреме повідомлення** (без слеша):

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

    Це тригери переривання (не slash-команди).

    Для фонових процесів (з інструмента exec) ви можете попросити агента виконати:

    ```
    process action:kill sessionId:XXX
    ```

    Огляд slash-команд: див. [Slash-команди](/uk/tools/slash-commands).

    Більшість команд мають надсилатися як **окреме** повідомлення, що починається з `/`, але кілька скорочень (як-от `/status`) також працюють inline для allowlist-відправників.

  </Accordion>

  <Accordion title='Як надіслати повідомлення Discord з Telegram? ("Cross-context messaging denied")'>
    OpenClaw типово блокує **міжпровайдерний** обмін повідомленнями. Якщо виклик інструмента прив’язаний
    до Telegram, він не надсилатиме в Discord, якщо ви явно цього не дозволите.

    Увімкніть міжпровайдерний обмін повідомленнями для агента:

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
    Режим черги керує тим, як нові повідомлення взаємодіють із запуском, що вже виконується. Використовуйте `/queue`, щоб змінювати режими:

    - `steer` — нові повідомлення перенаправляють поточне завдання
    - `followup` — запускати повідомлення по одному
    - `collect` — пакетувати повідомлення й відповідати один раз (типово)
    - `steer-backlog` — спрямувати зараз, потім обробити backlog
    - `interrupt` — перервати поточний запуск і почати заново

    Ви можете додавати параметри, як-от `debounce:2s cap:25 drop:summarize`, для режимів followup.

  </Accordion>
</AccordionGroup>

## Різне

<AccordionGroup>
  <Accordion title='Яка типова модель для Anthropic з API key?'>
    В OpenClaw облікові дані та вибір моделі — це окремі речі. Установлення `ANTHROPIC_API_KEY` (або збереження Anthropic API key у профілях автентифікації) вмикає автентифікацію, але фактична типова модель — це те, що ви налаштували в `agents.defaults.model.primary` (наприклад `anthropic/claude-sonnet-4-6` або `anthropic/claude-opus-4-6`). Якщо ви бачите `No credentials found for profile "anthropic:default"`, це означає, що Gateway не зміг знайти облікові дані Anthropic в очікуваному `auth-profiles.json` для агента, який виконується.
  </Accordion>
</AccordionGroup>

---

Усе ще застрягли? Запитайте в [Discord](https://discord.com/invite/clawd) або відкрийте [обговорення на GitHub](https://github.com/openclaw/openclaw/discussions).
