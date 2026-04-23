---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час виконання
    - Тріаж проблем, про які повідомили користувачі, перед глибшим налагодженням
summary: Поширені запитання про налаштування, конфігурацію та використання OpenClaw
title: Поширені запитання
x-i18n:
    generated_at: "2026-04-23T20:05:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4bad3e6334e6a198f726dfbac1f9bd9d6a293183425216f9c10d1e553be24e4
    source_path: help/faq.md
    workflow: 15
---

# Поширені запитання

Швидкі відповіді та глибше усунення несправностей для реальних середовищ (локальна розробка, VPS, мультиагентність, OAuth/API keys, аварійне перемикання моделей). Для діагностики під час виконання див. [Troubleshooting](/uk/gateway/troubleshooting). Повний довідник із конфігурації див. у [Configuration](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламалося

1. **Швидкий статус (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидке локальне зведення: ОС + оновлення, доступність gateway/сервісу, агенти/сесії, конфігурація провайдера + проблеми під час виконання (коли gateway доступний).

2. **Звіт, який можна вставити (безпечний для поширення)**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з хвостом журналу (токени замасковані).

3. **Стан демона + порту**

   ```bash
   openclaw gateway status
   ```

   Показує runtime супервізора проти доступності RPC, цільову URL-адресу probe та яку конфігурацію сервіс, імовірно, використав.

4. **Глибокі probe-перевірки**

   ```bash
   openclaw status --deep
   ```

   Запускає live probe перевірки стану gateway, включно з probe-перевірками каналів, коли це підтримується
   (потрібен доступний gateway). Див. [Health](/uk/gateway/health).

5. **Переглянути хвіст останнього журналу**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використайте запасний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові журнали відокремлені від журналів сервісу; див. [Logging](/uk/logging) і [Troubleshooting](/uk/gateway/troubleshooting).

6. **Запустити doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує конфігурацію та стан + запускає перевірки стану. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # показує цільову URL-адресу + шлях до конфігурації при помилках
   ```

   Запитує у запущеного gateway повний знімок (лише WS). Див. [Health](/uk/gateway/health).

## Швидкий старт і початкове налаштування

<AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб вибратися">
    Використовуйте локального AI-агента, який може **бачити вашу машину**. Це набагато ефективніше, ніж питати
    у Discord, тому що більшість випадків «я застряг» — це **локальні проблеми конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, виконувати команди, перевіряти журнали та допомагати виправляти
    налаштування на рівні машини (PATH, сервіси, дозволи, файли auth). Надайте їм **повну checkout-копію вихідного коду**
    через hackable (git) install:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **із git checkout**, щоб агент міг читати код + документацію та
    працювати з точною версією, яку ви запускаєте. Ви завжди можете пізніше повернутися до стабільної версії,
    повторно запустивши встановлювач без `--install-method git`.

    Порада: попросіть агента **спланувати та контролювати** виправлення (крок за кроком), а потім виконати лише
    потрібні команди. Це зберігає зміни невеликими та спрощує аудит.

    Якщо ви виявили справжній баг або виправлення, будь ласка, створіть issue на GitHub або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (діліться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану gateway/агента + базової конфігурації.
    - `openclaw models status`: перевіряє auth провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє типові проблеми конфігурації/стану.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламалося](#перші-60-секунд-якщо-щось-зламалося).
    Документація зі встановлення: [Install](/uk/install), [Installer flags](/uk/install/installer), [Updating](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску heartbeat:

    - `quiet-hours`: поза налаштованим вікном active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожню/лише із заголовком структуру
    - `no-tasks-due`: режим завдань `HEARTBEAT.md` активний, але жоден з інтервалів завдань ще не настав
    - `alerts-disabled`: всю видимість heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові позначки настання оновлюються лише після завершення
    реального виконання heartbeat. Пропущені виконання не позначають завдання як завершені.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Automation & Tasks](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановлення та налаштування OpenClaw">
    У репозиторії рекомендовано запуск із вихідного коду та використання onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати UI-ресурси. Після onboarding ви зазвичай запускаєте Gateway на порту **18789**.

    Із вихідного коду (для контриб'юторів/розробників):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Якщо у вас ще немає глобального встановлення, запускайте через `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Як відкрити dashboard після onboarding?">
    Майстер відкриває браузер із чистою (без токенів) URL-адресою dashboard одразу після onboarding, а також друкує посилання у зведенні. Залиште цю вкладку відкритою; якщо вона не запустилася, скопіюйте/вставте надруковану URL-адресу на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати dashboard на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо буде запитано auth зі спільним секретом, вставте налаштований токен або пароль у налаштуваннях Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо спільний секрет ще не налаштовано, згенеруйте токен через `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште прив'язку до loopback, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки identity задовольняють вимоги auth для Control UI/WebSocket (без вставлення спільного секрету, за умови довіреного хоста gateway); HTTP API усе одно вимагають auth зі спільним секретом, якщо ви навмисно не використовуєте private-ingress `none` або HTTP auth через trusted-proxy.
      Помилкові одночасні спроби auth через Serve від того самого клієнта серіалізуються до того, як обмежувач failed-auth їх зафіксує, тому вже друга помилкова повторна спроба може показати `retry later`.
    - **Прив'язка tailnet**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте auth через пароль), відкрийте `http://<tailscale-ip>:18789/`, потім вставте відповідний спільний секрет у налаштуваннях dashboard.
    - **Identity-aware reverse proxy**: залиште Gateway за trusted proxy без loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, потім відкрийте URL-адресу proxy.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`. Auth зі спільним секретом усе ще застосовується через тунель; якщо буде запит, вставте налаштований токен або пароль.

    Докладніше див. [Dashboard](/uk/web/dashboard) і [Web surfaces](/uk/web) щодо режимів прив'язки та подробиць auth.

  </Accordion>

  <Accordion title="Чому існують дві конфігурації схвалення exec для схвалень у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на схвалення до чат-призначень
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом схвалення для exec approvals

    Політика host exec усе ще є справжнім шлюзом схвалення. Конфігурація чату лише визначає, де
    з'являються запити на схвалення та як люди можуть на них відповідати.

    У більшості середовищ вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди та відповіді, `/approve` у тому ж чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначати тих, хто схвалює, OpenClaw тепер автоматично вмикає нативні схвалення DM-first, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні нативні картки/кнопки схвалення, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve`, лише якщо результат інструмента вказує, що схвалення через чат недоступні або ручне схвалення — єдиний шлях.
    - Використовуйте `approvals.exec` лише тоді, коли запити також потрібно пересилати в інші чати або спеціальні ops-кімнати.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише тоді, коли ви явно хочете, щоб запити на схвалення поверталися в початкову кімнату/тему.
    - Схвалення Plugin — ще окремий випадок: вони за замовчуванням використовують `/approve` у тому ж чаті, необов'язкове пересилання `approvals.plugin`, і лише деякі нативні канали зберігають поверх цього нативну обробку схвалення Plugin.

    Коротко: пересилання — для маршрутизації, конфігурація нативного клієнта — для багатшого UX, специфічного для каналу.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке runtime потрібне?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендовано** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легкий — у документації вказано, що для особистого використання достатньо **512MB-1GB RAM**, **1 core** і близько **500MB**
    дискового простору, а також зазначено, що **Raspberry Pi 4 може його запускати**.

    Якщо вам потрібен додатковий запас (журнали, медіа, інші сервіси), **рекомендовано 2GB**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може розміщувати Gateway, а ви можете підключати **nodes** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради щодо встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте певних шорсткостей.

    - Використовуйте **64-bit** ОС і Node >= 22.
    - Віддавайте перевагу **hackable (git) install**, щоб мати доступ до журналів і швидко оновлюватися.
    - Починайте без channels/Skills, а потім додавайте їх по одному.
    - Якщо ви зіткнулися з дивними проблемами з бінарними файлами, зазвичай це проблема **ARM compatibility**.

    Документація: [Linux](/uk/platforms/linux), [Install](/uk/install).

  </Accordion>

  <Accordion title="Зависло на wake up my friend / onboarding не може hatch. Що робити?">
    Цей екран залежить від доступності та автентифікації Gateway. TUI також автоматично надсилає
    «Wake up, my friend!» під час першого hatch. Якщо ви бачите цей рядок **без відповіді**
    і кількість токенів залишається 0, агент так і не запустився.

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

    3. Якщо все ще зависає, виконайте:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що tunnel/Tailscale-з'єднання працює і що UI
    вказує на правильний Gateway. Див. [Remote access](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє середовище на нову машину (Mac mini) без повторного onboarding?">
    Так. Скопіюйте **каталог стану** та **workspace**, а потім один раз запустіть Doctor. Це
    збереже вашого бота «точно таким самим» (memory, історія сесій, auth і стан
    каналу), якщо ви скопіюєте **обидва** місця:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте ваш workspace (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть сервіс Gateway.

    Це зберігає конфігурацію, профілі auth, облікові дані WhatsApp, сесії та memory. Якщо ви працюєте у
    віддаленому режимі, пам’ятайте, що хост gateway володіє сховищем сесій і workspace.

    **Важливо:** якщо ви лише commit/push ваш workspace до GitHub, ви створюєте резервну копію
    **memory + bootstrap-файлів**, але **не** історії сесій чи auth. Вони зберігаються
    у `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Migrating](/uk/install/migrating), [Where things live on disk](#where-things-live-on-disk),
    [Agent workspace](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Remote mode](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи розташовані зверху. Якщо верхній розділ позначений як **Unreleased**, наступний датований
    розділ є останньою випущеною версією. Записи згруповані за **Highlights**, **Changes** і
    **Fixes** (а також розділами docs/іншими, коли це потрібно).

  </Accordion>

  <Accordion title="Не вдається відкрити docs.openclaw.ai (помилка SSL)">
    Деякі з’єднання Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до allowlist, а потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати сайт, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дзеркалюється на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай stable-реліз спочатку потрапляє в **beta**, а потім явний
    крок просування переводить ту саму версію в `latest`. За потреби мейнтейнери також можуть
    публікувати одразу в `latest`. Саме тому після просування beta і stable можуть
    вказувати на **одну й ту саму версію**.

    Подивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди для встановлення та різницю між beta і dev див. в accordion нижче.

  </Accordion>

  <Accordion title="Як встановити beta-версію і в чому різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (після просування може збігатися з `latest`).
    **Dev** — це рухома head-версія `main` (git); під час публікації вона використовує npm dist-tag `dev`.

    Однорядкові команди (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Встановлювач для Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Детальніше: [Development channels](/uk/install/development-channels) і [Installer flags](/uk/install/installer).

  </Accordion>

  <Accordion title="Як спробувати найновіші збірки?">
    Є два варіанти:

    1. **Канал dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає на гілку `main` і оновлює з вихідного коду.

    2. **Hackable install (із сайту встановлювача):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає вам локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо ви надаєте перевагу ручному чистому clone, використовуйте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Update](/uk/cli/update), [Development channels](/uk/install/development-channels),
    [Install](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай триває встановлення та onboarding?">
    Приблизно:

    - **Встановлення:** 2-5 хвилин
    - **Onboarding:** 5-15 хвилин залежно від того, скільки каналів/моделей ви налаштовуєте

    Якщо процес зависає, див. [Installer stuck](#quick-start-and-first-run-setup)
    і швидкий цикл налагодження в [I am stuck](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Завис встановлювач? Як отримати більше зворотного зв’язку?">
    Повторно запустіть встановлювач із **докладним виводом**:

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

    Інші варіанти: [Installer flags](/uk/install/installer).

  </Accordion>

  <Accordion title="Під час встановлення на Windows з’являється git not found або openclaw not recognized">
    Дві поширені проблеми у Windows:

    **1) npm error spawn git / git not found**

    - Встановіть **Git for Windows** і переконайтеся, що `git` є у PATH.
    - Закрийте й знову відкрийте PowerShell, потім повторно запустіть встановлювач.

    **2) після встановлення openclaw is not recognized**

    - Ваша глобальна папка npm bin відсутня у PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до PATH вашого користувача (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо вам потрібне найгладше налаштування у Windows, використовуйте **WSL2** замість нативного Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="Вивід exec у Windows показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність code page консолі в нативних оболонках Windows.

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

    Якщо це й далі відтворюється в останній версії OpenClaw, відстежуйте/повідомляйте тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використовуйте **hackable (git) install**, щоб мати повний вихідний код і документацію локально, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг прочитати репозиторій і дати точну відповідь.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Детальніше: [Install](/uk/install) і [Installer flags](/uk/install/installer).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтесь керівництва для Linux, а потім запустіть onboarding.

    - Швидкий шлях для Linux + встановлення сервісу: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Getting Started](/uk/start/getting-started).
    - Встановлювач + оновлення: [Install & updates](/uk/install/updating).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Встановіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Керівництва: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Gateway remote](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де знайти посібники зі встановлення в хмарі/VPS?">
    У нас є **центральна сторінка хостингу** з поширеними провайдерами. Виберіть потрібного й дотримуйтесь посібника:

    - [VPS hosting](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте до нього доступ
    з ноутбука/телефона через Control UI (або Tailscale/SSH). Ваші state + workspace
    живуть на сервері, тож вважайте хост джерелом істини та робіть його резервні копії.

    Ви можете підключати **nodes** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб мати доступ
    до локального екрана/камери/canvas або виконувати команди на ноутбуці, залишаючи
    Gateway у хмарі.

    Центральна сторінка: [Platforms](/uk/platforms). Віддалений доступ: [Gateway remote](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [Nodes CLI](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити себе самостійно?">
    Коротка відповідь: **можливо, але не рекомендовано**. Процес оновлення може перезапустити
    Gateway (що розірве активну сесію), може вимагати чистий git checkout і
    може просити підтвердження. Безпечніше запускати оновлення з оболонки як оператору.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо вам усе ж потрібно автоматизувати це через агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Update](/uk/cli/update), [Updating](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить onboarding?">
    `openclaw onboard` — рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/auth** (OAuth провайдера, API keys, Anthropic setup-token, а також варіанти локальних моделей, як-от LM Studio)
    - Розташування **workspace** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані channel plugins, як-от QQ Bot)
    - **Встановлення демона** (LaunchAgent на macOS; systemd user unit на Linux/WSL2)
    - **Перевірки стану** та вибір **Skills**

    Він також попереджає, якщо ваша налаштована модель невідома або для неї відсутній auth.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запустити?">
    Ні. Ви можете запускати OpenClaw з **API keys** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації в цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **Anthropic API key**: звичайна оплата Anthropic API
    - **Claude CLI / auth підписки Claude в OpenClaw**: співробітники Anthropic
      сказали нам, що таке використання знову дозволене, і OpenClaw розглядає використання `claude -p`
      як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів gateway Anthropic API keys усе ще є більш
    передбачуваним налаштуванням. OAuth OpenAI Codex явно підтримується для зовнішніх
    інструментів, як-от OpenClaw.

    OpenClaw також підтримує інші розміщені варіанти в стилі підписки, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [GLM Models](/uk/providers/glm),
    [Local models](/uk/gateway/local-models), [Models](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API key?">
    Так.

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тож
    OpenClaw вважає auth через підписку Claude та використання `claude -p` санкціонованими
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо вам потрібне
    найбільш передбачуване налаштування на боці сервера, натомість використовуйте Anthropic API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви auth через підписку Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тому OpenClaw вважає
    повторне використання Claude CLI та використання `claude -p` санкціонованими для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Anthropic setup-token і далі доступний як підтримуваний шлях токена OpenClaw, але тепер OpenClaw віддає перевагу повторному використанню Claude CLI та `claude -p`, коли це можливо.
    Для production або багатокористувацьких навантажень auth через Anthropic API key усе ще є
    безпечнішим і передбачуванішим вибором. Якщо вам потрібні інші розміщені
    варіанти в стилі підписки в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
    Це означає, що вашу **квоту/ліміт запитів Anthropic** вичерпано для поточного вікна. Якщо ви
    використовуєте **Claude CLI**, дочекайтеся скидання вікна або оновіть свій план. Якщо ви
    використовуєте **Anthropic API key**, перевірте Anthropic Console
    щодо використання/білінгу та за потреби підвищте ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, запит намагається використати
    1M context beta від Anthropic (`context1m: true`). Це працює, лише коли ваші
    облікові дані мають право на білінг long-context (білінг API key або
    шлях входу в Claude OpenClaw з увімкненим Extra Usage).

    Порада: налаштуйте **fallback model**, щоб OpenClaw міг і надалі відповідати, поки провайдер має обмеження за rate limit.
    Див. [Models](/uk/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудований провайдер **Amazon Bedrock (Converse)**. Якщо присутні маркери AWS env, OpenClaw може автоматично виявити каталог Bedrock streaming/text і об’єднати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис провайдера вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Model providers](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-compatible proxy перед Bedrock також залишається коректним варіантом.
  </Accordion>

  <Accordion title="Як працює auth Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Нові посилання на моделі мають використовувати канонічний шлях `openai/gpt-5.5`; `openai-codex/gpt-*` залишається застарілим alias сумісності. Див. [Model providers](/uk/concepts/model-providers) і [Onboarding (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому OpenClaw усе ще згадує openai-codex?">
    `openai-codex` усе ще є внутрішнім id провайдера auth/profile для OAuth ChatGPT/Codex. Посилання на модель має бути канонічним OpenAI:

    - `openai/gpt-5.5` = канонічне посилання на модель GPT-5.5
    - `openai-codex/gpt-5.5` = застарілий alias сумісності
    - `openai-codex:...` = id профілю auth, а не посилання на модель

    Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform, задайте
    `OPENAI_API_KEY`. Якщо вам потрібен auth через підписку ChatGPT/Codex, увійдіть за допомогою
    `openclaw models auth login --provider openai-codex` і залишайте посилання на моделі як
    `openai/*` у нових конфігураціях.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT у вебверсії?">
    Codex OAuth використовує керовані OpenAI вікна квот, які залежать від плану. На практиці
    ці ліміти можуть відрізнятися від досвіду використання сайту/застосунку ChatGPT, навіть коли
    обидва прив’язані до одного облікового запису.

    OpenClaw може показувати поточні видимі вікна використання/квот провайдера в
    `openclaw models status`, але він не вигадує і не нормалізує права доступу ChatGPT-web
    у прямий доступ до API. Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform,
    використовуйте `openai/*` з API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви auth через підписку OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **subscription OAuth OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання subscription OAuth у зовнішніх інструментах/робочих процесах
    на кшталт OpenClaw. Onboarding може виконати OAuth-потік за вас.

    Див. [OAuth](/uk/concepts/oauth), [Model providers](/uk/concepts/model-providers) і [Onboarding (CLI)](/uk/start/wizard).

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
    5. Якщо запити завершуються помилкою, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає OAuth tokens у профілях auth на хості gateway. Докладніше: [Model providers](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для звичайних чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + надійного захисту; малі картки обрізають контекст і допускають витоки. Якщо вам це все ж потрібно, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі підвищують ризик prompt injection — див. [Security](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як тримати трафік розміщених моделей у певному регіоні?">
    Вибирайте endpoints із прив’язкою до регіону. OpenRouter надає варіанти MiniMax, Kimi та GLM, розміщені у США; виберіть варіант, розміщений у США, щоб зберігати дані в межах регіону. Ви все ще можете перелічувати Anthropic/OpenAI поруч із ними, використовуючи `models.mode: "merge"`, щоб fallback залишалися доступними, одночасно дотримуючись вибраного провайдера з регіональною прив’язкою.
  </Accordion>

  <Accordion title="Чи потрібно купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini — необов’язковий варіант:
    деякі користувачі купують його як хост, що завжди увімкнений, але також підійде невеликий VPS, домашній сервер або пристрій класу Raspberry Pi.

    Mac потрібен лише **для інструментів, доступних тільки в macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux чи деінде. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або підключайте macOS Node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Mac remote mode](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **будь-який пристрій з macOS**, у якому виконано вхід у Messages. Це **не обов’язково** має бути Mac mini —
    підійде будь-який Mac. Для iMessage **використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) — сервер BlueBubbles працює на macOS, тоді як Gateway може працювати на Linux або деінде.

    Поширені сценарії:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac із входом у Messages.
    - Запускайте все на Mac, якщо хочете найпростішу конфігурацію з однією машиною.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Mac remote mode](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи зможу я підключити його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключатися як
    **Node** (супутній пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, як-от screen/camera/canvas і `system.run` на цьому пристрої.

    Поширений сценарій:

    - Gateway на Mac mini (завжди увімкнений).
    - MacBook Pro запускає macOS-застосунок або хост Node і підключається до Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можна використовувати Bun?">
    Bun **не рекомендовано**. Ми спостерігаємо помилки runtime, особливо з WhatsApp і Telegram.
    Для стабільних gateway використовуйте **Node**.

    Якщо ви все ж хочете експериментувати з Bun, робіть це на непродукційному gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що має бути в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім’я користувача бота.

    Під час налаштування запитуються лише числові user ID. Якщо у вашій конфігурації вже є застарілі записи `@username`, `openclaw doctor --fix` може спробувати їх розв’язати.

    Безпечніший варіант (без стороннього бота):

    - Напишіть своєму боту в DM, потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть своєму боту в DM, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній сервіс (менш приватно):

    - Напишіть у DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **маршрутизацію multi-agent**. Прив’яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, sender E.164 на кшталт `+15551234567`) до різного `agentId`, щоб кожна людина мала власні workspace і сховище сесій. Відповіді все одно надходитимуть з **того самого облікового запису WhatsApp**, а керування доступом для DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Див. [Multi-Agent Routing](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента "швидкий чат" і агента "Opus for coding"?'>
    Так. Використовуйте маршрутизацію multi-agent: задайте кожному агенту власну модель за замовчуванням, а потім прив’яжіть вхідні маршрути (обліковий запис провайдера або конкретні peers) до кожного агента. Приклад конфігурації наведено в [Multi-Agent Routing](/uk/concepts/multi-agent). Див. також [Models](/uk/concepts/models) і [Configuration](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, визначалися в non-login оболонках.
    Останні збірки також додають на початок PATH поширені користувацькі каталоги bin у Linux systemd services (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо їх задано.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повний checkout вихідного коду, можливість редагування, найкращий варіант для контриб’юторів.
      Ви збираєте все локально й можете вносити зміни до коду/документації.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію «просто запустити».
      Оновлення надходять через npm dist-tags.

    Документація: [Getting started](/uk/start/getting-started), [Updating](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm і git install?">
    Так. Встановіть інший варіант, а потім запустіть Doctor, щоб сервіс gateway вказував на нову entrypoint.
    Це **не видаляє ваші дані** — змінюється лише спосіб встановлення коду OpenClaw. Ваш state
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

    Doctor виявляє невідповідність entrypoint сервісу gateway і пропонує переписати конфігурацію сервісу відповідно до поточного install (в automation використовуйте `--repair`).

    Поради щодо резервного копіювання: див. [Backup strategy](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібен
    найменший поріг входу і вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Переваги:** без витрат на сервер, прямий доступ до локальних файлів, видиме вікно браузера в реальному часі.
    - **Недоліки:** сон/розриви мережі = роз'єднання, оновлення ОС/перезавантаження переривають роботу, пристрій має залишатися увімкненим.

    **VPS / хмара**

    - **Переваги:** завжди увімкнений, стабільна мережа, немає проблем через сон ноутбука, простіше підтримувати безперервну роботу.
    - **Недоліки:** часто працює без GUI (використовуйте знімки екрана), віддалений доступ до файлів, для оновлень потрібен SSH.

    **Примітка щодо OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord чудово працюють із VPS. Єдиний реальний компроміс — **браузер без GUI** проти видимого вікна. Див. [Browser](/uk/tools/browser).

    **Рекомендовано за замовчуванням:** VPS, якщо у вас раніше були розриви з gateway. Локальний варіант чудовий, коли ви активно користуєтесь Mac і хочете доступ до локальних файлів або UI automation із видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Не обов’язково, але **рекомендовано для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** завжди увімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, простіше підтримувати роботу.
    - **Спільний ноутбук/десктоп:** цілком підходить для тестування та активного використання, але очікуйте пауз, коли машина переходить у сон або оновлюється.

    Якщо ви хочете найкраще з обох світів, тримайте Gateway на виділеному хості, а ноутбук підключайте як **Node** для локальних інструментів screen/camera/exec. Див. [Nodes](/uk/nodes).
    Рекомендації з безпеки див. у [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яка ОС рекомендована?">
    OpenClaw легкий. Для базового Gateway + одного chat channel:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1-2 vCPU, 2GB RAM або більше для запасу (журнали, медіа, кілька каналів). Інструменти Node і browser automation можуть бути ресурсомісткими.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях встановлення для Linux найкраще протестовано саме там.

    Документація: [Linux](/uk/platforms/linux), [VPS hosting](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди увімкнена, доступна та мати достатньо
    RAM для Gateway і будь-яких channels, які ви вмикаєте.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька каналів, browser automation або медіа-інструменти.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви використовуєте Windows, **WSL2 — найпростіший варіант налаштування у стилі VM** і має найкращу
    сумісність з інструментами. Див. [Windows](/uk/platforms/windows), [VPS hosting](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw в одному абзаці?">
    OpenClaw — це персональний AI-помічник, який ви запускаєте на власних пристроях. Він відповідає на поверхнях обміну повідомленнями, якими ви вже користуєтеся (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, а також вбудовані channel plugins, наприклад QQ Bot) і також підтримує голос + живий Canvas на підтримуваних платформах. **Gateway** — це завжди увімкнена control plane; помічник — це сам продукт.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не «просто обгортка над Claude». Це **local-first control plane**, що дозволяє запускати
    потужного помічника на **вашому власному обладнанні**, доступного з чат-застосунків, якими ви вже користуєтеся,
    зі сесіями зі станом, memory та інструментами — без передачі контролю над вашими робочими процесами
    хостинговому SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway де завгодно (Mac, Linux, VPS) і зберігайте
      workspace + історію сесій локально.
    - **Справжні канали, а не веб-пісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      а також мобільний голос і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо, з маршрутизацією
      та аварійним перемиканням на рівні агента.
    - **Варіант лише з локальними моделями:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо ви цього хочете.
    - **Маршрутизація multi-agent:** окремі агенти для кожного каналу, облікового запису або завдання, кожен зі своїм
      workspace і значеннями за замовчуванням.
    - **Відкритий код і можливість змін:** перевіряйте, розширюйте й самостійно хостіть без прив’язки до постачальника.

    Документація: [Gateway](/uk/gateway), [Channels](/uk/channels), [Multi-agent](/uk/concepts/multi-agent),
    [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно все налаштував — що мені зробити спочатку?">
    Хороші перші проєкти:

    - Створити сайт (WordPress, Shopify або простий статичний сайт).
    - Прототип мобільного застосунку (структура, екрани, план API).
    - Організувати файли та папки (очищення, найменування, тегування).
    - Підключити Gmail і автоматизувати підсумки або подальші дії.

    Він може працювати з великими завданнями, але найкраще працює, коли ви розбиваєте їх на етапи
    і використовуєте sub-agents для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найпоширеніших повсякденних сценаріїв використання OpenClaw?">
    Повсякденна користь зазвичай виглядає так:

    - **Персональні брифінги:** підсумки inbox, календаря та важливих для вас новин.
    - **Дослідження та підготовка чернеток:** швидкі дослідження, підсумки та перші чернетки для листів або документів.
    - **Нагадування та подальші дії:** підказки та чеклісти на основі Cron або Heartbeat.
    - **Browser automation:** заповнення форм, збирання даних і повторення веб-завдань.
    - **Координація між пристроями:** надішліть завдання з телефона, дайте Gateway виконати його на сервері й отримайте результат назад у чаті.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, ads і блогами для SaaS?">
    Так — для **дослідження, кваліфікації та підготовки чернеток**. Він може сканувати сайти, складати короткі списки,
    підсумовувати інформацію про потенційних клієнтів і писати чернетки для outreach або рекламних текстів.

    Для **outreach або запуску реклами** залишайте людину в циклі. Уникайте спаму, дотримуйтеся місцевих законів і
    правил платформ, і перевіряйте все перед відправленням. Найбезпечніший шаблон — дозволити
    OpenClaw підготувати чернетку, а вам — її схвалити.

    Документація: [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний помічник** і шар координації, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу програмування в репозиторії. Використовуйте OpenClaw, коли вам
    потрібні довготривала memory, доступ із різних пристроїв і оркестрація інструментів.

    Переваги:

    - **Стійка memory + workspace** між сесіями
    - **Доступ із різних платформ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (браузер, файли, планування, hooks)
    - **Завжди увімкнений Gateway** (запуск на VPS, взаємодія звідусіль)
    - **Nodes** для локальних браузера/екрана/камери/exec

    Вітрина: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills та автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати Skills, не тримаючи репозиторій у брудному стані?">
    Використовуйте керовані override замість редагування копії в репозиторії. Розміщуйте свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, тож керовані override все одно мають вищий пріоритет за bundled Skills без змін у git. Якщо вам потрібно встановити skill глобально, але зробити його видимим лише для деяких агентів, тримайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` та `agents.list[].skills`. Лише зміни, варті включення в upstream, повинні жити в репозиторії та надсилатися як PR.
  </Accordion>

  <Accordion title="Чи можу я завантажувати Skills із власної папки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Типовий пріоритет: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` за замовчуванням встановлює в `./skills`, що OpenClaw трактує як `<workspace>/skills` у наступній сесії. Якщо skill має бути видимим лише для певних агентів, поєднайте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як використовувати різні моделі для різних завдань?">
    Наразі підтримуються такі шаблони:

    - **Cron jobs**: ізольовані завдання можуть задавати override `model` для кожного завдання.
    - **Sub-agents**: маршрутизуйте завдання до окремих агентів з різними моделями за замовчуванням.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб у будь-який момент змінити модель поточної сесії.

    Див. [Cron jobs](/uk/automation/cron-jobs), [Multi-Agent Routing](/uk/concepts/multi-agent) і [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як перенести це навантаження?">
    Використовуйте **sub-agents** для довгих або паралельних завдань. Sub-agents працюють у власній сесії,
    повертають підсумок і зберігають чутливість вашого основного чату.

    Попросіть бота «spawn a sub-agent for this task» або використовуйте `/subagents`.
    Використовуйте `/status` у чаті, щоб побачити, що Gateway робить просто зараз (і чи він зайнятий).

    Порада щодо токенів: і довгі завдання, і sub-agents споживають токени. Якщо важлива вартість, задайте
    дешевшу модель для sub-agents через `agents.defaults.subagents.model`.

    Документація: [Sub-agents](/uk/tools/subagents), [Background Tasks](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють прив’язані до thread сесії subagent у Discord?">
    Використовуйте прив’язки thread. Ви можете прив’язати Discord thread до subagent або цілі session, щоб подальші повідомлення в цьому thread залишалися в межах прив’язаної сесії.

    Базовий сценарій:

    - Запускайте через `sessions_spawn` з `thread: true` (і за бажанням `mode: "session"` для постійних подальших повідомлень).
    - Або вручну прив’яжіть через `/focus <target>`.
    - Використовуйте `/agents`, щоб перевірити стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати автоматичним зняттям фокуса.
    - Використовуйте `/unfocus`, щоб від’єднати thread.

    Потрібна конфігурація:

    - Глобальні значення за замовчуванням: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override для Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоматична прив’язка під час spawn: задайте `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Sub-agents](/uk/tools/subagents), [Discord](/uk/channels/discord), [Configuration Reference](/uk/gateway/configuration-reference), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Sub-agent завершив роботу, але повідомлення про завершення надійшло не туди або взагалі не було опубліковане. Що перевірити?">
    Спочатку перевірте визначений маршрут запитувача:

    - Доставка sub-agent у режимі завершення віддає перевагу будь-якому прив’язаному thread або маршруту conversation, якщо такий існує.
    - Якщо джерело завершення містить лише channel, OpenClaw повертається до збереженого маршруту сесії запитувача (`lastChannel` / `lastTo` / `lastAccountId`), щоб пряма доставка все одно могла спрацювати.
    - Якщо немає ні прив’язаного маршруту, ні придатного збереженого маршруту, пряма доставка може не вдатися, і результат повернеться до доставки через queue сесії замість негайної публікації в чат.
    - Некоректні або застарілі цілі все одно можуть примусово перевести доставку в queue fallback або спричинити остаточну помилку доставки.
    - Якщо остання видима відповідь assistant від дочірнього процесу — це точний мовчазний токен `NO_REPLY` / `no_reply` або рівно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує анонс замість публікації застарілого попереднього прогресу.
    - Якщо дочірній процес вийшов за тайм-аут після одних лише викликів tools, анонс може звести це до короткого підсумку часткового прогресу замість відтворення сирого виводу tool.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Sub-agents](/uk/tools/subagents), [Background Tasks](/uk/automation/tasks), [Session Tools](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron виконується всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані завдання не запускатимуться.

    Контрольний список:

    - Підтвердьте, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не задано.
    - Перевірте, що Gateway працює 24/7 (без сну/перезапусків).
    - Переконайтеся в правильності налаштувань часового поясу для завдання (`--tz` проти часового поясу хоста).

    Налагодження:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Automation & Tasks](/uk/automation).

  </Accordion>

  <Accordion title="Cron спрацював, але нічого не було надіслано в channel. Чому?">
    Спочатку перевірте режим доставки:

    - `--no-deliver` / `delivery.mode: "none"` означає, що runner fallback send не очікується.
    - Відсутня або некоректна ціль анонсу (`channel` / `to`) означає, що runner пропустив вихідну доставку.
    - Помилки auth каналу (`unauthorized`, `Forbidden`) означають, що runner спробував виконати доставку, але облікові дані її заблокували.
    - Мовчазний ізольований результат (`NO_REPLY` / `no_reply` only) вважається навмисно недоставлюваним, тому runner також пригнічує queued fallback delivery.

    Для ізольованих Cron jobs агент усе ще може надсилати повідомлення напряму за допомогою tool `message`,
    коли доступний маршрут чату. `--announce` керує лише шляхом runner
    fallback для фінального тексту, який агент ще не надіслав сам.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Background Tasks](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований запуск cron змінив модель або один раз повторив спробу?">
    Зазвичай це шлях live-перемикання моделі, а не дубльоване планування.

    Ізольований cron може зберегти runtime-передачу моделі й повторити спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повторна спроба зберігає перемкненого
    провайдера/модель, і якщо перемикання містило новий override профілю auth, cron
    також зберігає його перед повторною спробою.

    Пов’язані правила вибору:

    - Override моделі Gmail hook має найвищий пріоритет, коли застосовується.
    - Потім іде `model` на рівні завдання.
    - Потім будь-який збережений override моделі cron-session.
    - Потім звичайний вибір моделі агента/моделі за замовчуванням.

    Цикл повторних спроб обмежений. Після початкової спроби плюс 2 повторних спроб перемикання
    cron припиняє роботу замість нескінченного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [cron CLI](/uk/cli/cron).

  </Accordion>

  <Accordion title="Як установити Skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або покладіть Skills у свій workspace. UI Skills для macOS недоступний на Linux.
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

    Нативна команда `openclaw skills install` записує в каталог `skills/`
    активного workspace. Окремий CLI `clawhub` встановлюйте лише якщо хочете публікувати або
    синхронізувати власні Skills. Для спільних встановлень між агентами розміщуйте skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете звузити перелік агентів, які можуть його бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати завдання за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте планувальник Gateway:

    - **Cron jobs** для запланованих або повторюваних завдань (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок «основної сесії».
    - **Ізольовані завдання** для автономних агентів, які публікують підсумки або доставляють їх у чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Automation & Tasks](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати Apple Skills лише для macOS з Linux?">
    Не напряму. macOS Skills обмежуються через `metadata.openclaw.os` плюс потрібні бінарні файли, і Skills з’являються в system prompt лише тоді, коли вони придатні на **хості Gateway**. На Linux Skills лише для `darwin` (наприклад `apple-notes`, `apple-reminders`, `things-mac`) не завантажаться, якщо ви не перевизначите це обмеження.

    Підтримуються три варіанти:

    **Варіант A — запускати Gateway на Mac (найпростіше).**
    Запускайте Gateway там, де доступні бінарні файли macOS, а потім підключайтеся з Linux у [віддаленому режимі](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажуються як звичайно, тому що хост Gateway — macOS.

    **Варіант B — використовувати macOS Node (без SSH).**
    Запускайте Gateway на Linux, підключіть macOS Node (застосунок меню-бару) і встановіть **Node Run Commands** у значення "Always Ask" або "Always Allow" на Mac. OpenClaw може вважати Skills лише для macOS придатними, коли потрібні бінарні файли є на Node. Агент запускає ці Skills через tool `nodes`. Якщо ви виберете "Always Ask", підтвердження "Always Allow" у prompt додасть цю команду до allowlist.

    **Варіант C — проксіювати бінарні файли macOS через SSH (просунутий варіант).**
    Залиште Gateway на Linux, але зробіть так, щоб потрібні CLI-бінарні файли розв’язувалися в SSH-обгортки, які запускаються на Mac. Потім перевизначте skill, щоб дозволити Linux, і він залишався придатним.

    1. Створіть SSH-обгортку для бінарного файлу (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Додайте обгортку в `PATH` на Linux-хості (наприклад `~/bin/memo`).
    3. Перевизначте метадані skill (у workspace або `~/.openclaw/skills`), щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Керування Apple Notes через CLI `memo` у macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Запустіть нову сесію, щоб оновився знімок Skills.

  </Accordion>

  <Accordion title="Чи є у вас інтеграція з Notion або HeyGen?">
    Вбудованої інтеграції наразі немає.

    Варіанти:

    - **Власний skill / Plugin:** найкраще для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Browser automation:** працює без коду, але повільніше й крихкіше.

    Якщо ви хочете зберігати контекст окремо для кожного клієнта (workflow агенції), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + налаштування + активна робота).
    - Попросіть агента отримувати цю сторінку на початку сесії.

    Якщо вам потрібна нативна інтеграція, створіть feature request або розробіть skill,
    орієнтований на ці API.

    Установлення Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні встановлення потрапляють у каталог `skills/` активного workspace. Для спільних Skills між агентами розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі агенти, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі Skills очікують бінарні файли, установлені через Homebrew; на Linux це означає Linuxbrew (див. запис FAQ про Homebrew на Linux вище). Див. [Skills](/uk/tools/skills), [Skills config](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати свій наявний вхід у Chrome з OpenClaw?">
    Використовуйте вбудований профіль браузера `user`, який підключається через Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Якщо вам потрібна власна назва, створіть явний профіль MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Цей шлях може використовувати локальний браузер хоста або підключений browser node. Якщо Gateway працює деінде, або запустіть node host на машині з браузером, або використовуйте віддалений CDP.

    Поточні обмеження для `existing-session` / `user`:

    - дії керуються через ref, а не через CSS-selector
    - uploads потребують `ref` / `inputRef` і наразі підтримують лише один файл за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії все ще потребують керованого браузера або профілю raw CDP

  </Accordion>
</AccordionGroup>

## Ізоляція та memory

<AccordionGroup>
  <Accordion title="Чи є окрема документація про ізоляцію?">
    Так. Див. [Sandboxing](/uk/gateway/sandboxing). Налаштування для Docker (повний gateway у Docker або образи sandbox) див. у [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повну функціональність?">
    Образ за замовчуванням орієнтований на безпеку й запускається від користувача `node`, тому він не
    містить системних пакетів, Homebrew або вбудованих браузерів. Для повнішого налаштування:

    - Зберігайте `/home/node` за допомогою `OPENCLAW_HOME_VOLUME`, щоб кеші не зникали.
    - Вбудовуйте системні залежності в образ через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Встановлюйте браузери Playwright через вбудований CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Задайте `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я зберегти DM особистими, а групи зробити публічними/ізольованими з одним агентом?">
    Так — якщо ваш приватний трафік це **DM**, а публічний трафік це **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб сесії груп/channel (ключі не-main) виконувалися в налаштованому backend sandbox, тоді як основна DM-сесія залишалася на хості. Docker є backend за замовчуванням, якщо ви не вибрали інший. Потім обмежте набір tools, доступних в ізольованих сесіях, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Групи: особисті DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Довідник щодо ключової конфігурації: [Gateway configuration](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив’язати папку хоста до sandbox?">
    Задайте `agents.defaults.sandbox.docker.binds` як `["host:path:mode"]` (наприклад `"/home/user/src:/src:ro"`). Глобальні прив’язки та прив’язки на рівні агента об’єднуються; прив’язки на рівні агента ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для всього чутливого й пам’ятайте, що прив’язки обходять файлові стіни sandbox.

    OpenClaw перевіряє джерела bind і за нормалізованим шляхом, і за канонічним шляхом, розв’язаним через найглибший наявний ancestor. Це означає, що виходи через symlink-parent усе одно безпечно блокуються навіть тоді, коли останній сегмент шляху ще не існує, а перевірки allowed-root усе одно застосовуються після розв’язання symlink.

    Приклади та примітки з безпеки див. у [Sandboxing](/uk/gateway/sandboxing#custom-bind-mounts) і [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Як працює memory?">
    Memory в OpenClaw — це просто файли Markdown у workspace агента:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Кураторські довгострокові нотатки в `MEMORY.md` (лише основні/приватні сесії)

    OpenClaw також виконує **тихе скидання memory перед Compaction**, щоб нагадати моделі
    записати довговічні нотатки перед автоматичною Compaction. Це працює лише тоді, коли workspace
    доступний для запису (sandbox у режимі лише читання це пропускають). Див. [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Memory постійно все забуває. Як зробити так, щоб інформація зберігалася?">
    Попросіть бота **записати факт у memory**. Довгострокові нотатки мають бути в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це все ще напрям, який ми вдосконалюємо. Корисно нагадувати моделі зберігати спогади;
    вона зрозуміє, що робити. Якщо вона все одно забуває, перевірте, що Gateway використовує той самий
    workspace під час кожного запуску.

    Документація: [Memory](/uk/concepts/memory), [Agent workspace](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Чи зберігається memory назавжди? Які є обмеження?">
    Файли memory зберігаються на диску й існують, доки ви їх не видалите. Обмеженням є ваше
    сховище, а не модель. **Контекст сесії** все одно обмежений
    вікном контексту моделі, тому довгі розмови можуть ущільнюватися або обрізатися. Саме тому
    існує пошук у memory — він повертає в контекст лише релевантні частини.

    Документація: [Memory](/uk/concepts/memory), [Context](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потребує семантичний пошук у memory OpenAI API key?">
    Лише якщо ви використовуєте **OpenAI embeddings**. Codex OAuth покриває chat/completions і
    **не** надає доступу до embeddings, тож **вхід через Codex (OAuth або
    через логін Codex CLI)** не допомагає для семантичного пошуку в memory. Для OpenAI embeddings
    усе ще потрібен справжній API key (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви не задаєте провайдера явно, OpenClaw автоматично вибирає провайдера, коли
    може знайти API key (профілі auth, `models.providers.*.apiKey` або env vars).
    Він віддає перевагу OpenAI, якщо знайдено ключ OpenAI, інакше Gemini, якщо знайдено ключ Gemini,
    потім Voyage, потім Mistral. Якщо жоден віддалений ключ недоступний, пошук у memory
    залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштовано й доступний шлях
    до локальної моделі, OpenClaw
    віддає перевагу `local`. Ollama підтримується, коли ви явно задаєте
    `memorySearch.provider = "ollama"`.

    Якщо ви хочете залишатися локальними, задайте `memorySearch.provider = "local"` (і за бажанням
    `memorySearch.fallback = "none"`). Якщо вам потрібні Gemini embeddings, задайте
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо embedding-моделі **OpenAI, Gemini, Voyage, Mistral, Ollama або local** —
    подробиці налаштування див. у [Memory](/uk/concepts/memory).

  </Accordion>
</AccordionGroup>

## Де що зберігається на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, що використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** сесії, файли memory, конфігурація та workspace живуть на хості Gateway
      (`~/.openclaw` + каталог вашого workspace).
    - **Віддалено за необхідністю:** повідомлення, які ви надсилаєте провайдерам моделей (Anthropic/OpenAI тощо), потрапляють
      до їхніх API, а chat platforms (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на
      своїх серверах.
    - **Ви керуєте слідом даних:** використання локальних моделей залишає prompt на вашій машині, але трафік
      каналів усе одно проходить через сервери каналу.

    Пов’язане: [Agent workspace](/uk/concepts/agent-workspace), [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе зберігається в `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Path                                                            | Призначення                                                       |
    | --------------------------------------------------------------- | ----------------------------------------------------------------- |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основна конфігурація (JSON5)                                      |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Застарілий імпорт OAuth (копіюється в профілі auth під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Профілі auth (OAuth, API keys і необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язкове файлове сховище секретів для провайдерів SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Файл застарілої сумісності (статичні записи `api_key` очищено)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдера (наприклад `whatsapp/<accountId>/creds.json`)     |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан для кожного агента (agentDir + sessions)                     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і стан (для кожного агента)                        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані сесій (для кожного агента)                               |

    Застарілий шлях single-agent: `~/.openclaw/agent/*` (мігрується за допомогою `openclaw doctor`).

    Ваш **workspace** (`AGENTS.md`, файли memory, Skills тощо) зберігається окремо й налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають зберігатися AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли зберігаються у **workspace агента**, а не в `~/.openclaw`.

    - **Workspace (для кожного агента)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, необов’язковий `HEARTBEAT.md`.
      Root-файл `memory.md` у нижньому регістрі — лише вхід для виправлення застарілих даних; `openclaw doctor --fix`
      може об’єднати його в `MEMORY.md`, коли існують обидва файли.
    - **Каталог state (`~/.openclaw`)**: конфігурація, стан channel/provider, профілі auth, сесії, журнали,
      і спільні Skills (`~/.openclaw/skills`).

    Типовий workspace — `~/.openclaw/workspace`, налаштовується так:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот «забуває» після перезапуску, переконайтеся, що Gateway використовує той самий
    workspace під час кожного запуску (і пам’ятайте: віддалений режим використовує **workspace хоста gateway**,
    а не вашого локального ноутбука).

    Порада: якщо вам потрібна стійка поведінка чи налаштування, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладайтеся на історію чату.

    Див. [Agent workspace](/uk/concepts/agent-workspace) і [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Розмістіть свій **workspace агента** в **приватному** git-репозиторії та створюйте його резервну копію
    у приватному місці (наприклад, у приватному GitHub). Це охоплює memory + файли AGENTS/SOUL/USER
    і дозволяє пізніше відновити «розум» помічника.

    **Не** робіть commit нічого з `~/.openclaw` (облікові дані, сесії, токени або зашифровані дані секретів).
    Якщо вам потрібне повне відновлення, створюйте резервні копії і workspace, і каталогу state
    окремо (див. питання про міграцію вище).

    Документація: [Agent workspace](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окремий посібник: [Uninstall](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть агенти працювати поза workspace?">
    Так. Workspace — це **типовий cwd** і опорна точка для memory, а не жорсткий sandbox.
    Відносні шляхи розв’язуються всередині workspace, але абсолютні шляхи можуть відкривати доступ до інших
    місць на хості, якщо sandboxing не ввімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування sandbox для окремих агентів. Якщо ви
    хочете, щоб репозиторій був типовим робочим каталогом, вкажіть для цього агента
    `workspace` як root репозиторію. Репозиторій OpenClaw — це лише вихідний код; тримайте
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

  <Accordion title="Віддалений режим: де знаходиться сховище сесій?">
    Станом сесій володіє **хост gateway**. Якщо ви працюєте у віддаленому режимі, потрібне вам сховище сесій знаходиться на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Session management](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи конфігурації

<AccordionGroup>
  <Accordion title="Який формат має конфігурація? Де вона знаходиться?">
    OpenClaw читає необов’язкову конфігурацію **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються відносно безпечні значення за замовчуванням (зокрема workspace за замовчуванням `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я встановив gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Прив’язки не до loopback **потребують чинного шляху auth gateway**. На практиці це означає:

    - auth зі спільним секретом: токен або пароль
    - `gateway.auth.mode: "trusted-proxy"` за правильно налаштованим identity-aware reverse proxy не на loopback

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

    - `gateway.remote.token` / `.password` **самі по собі** не вмикають auth локального gateway.
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як fallback лише тоді, коли `gateway.auth.*` не задано.
    - Для auth через пароль задайте `gateway.auth.mode: "password"` разом із `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання безпечно завершується помилкою (без маскування через віддалений fallback).
    - Налаштування Control UI зі спільним секретом автентифікуються через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях app/UI). Режими з ідентифікацією, такі як Tailscale Serve або `trusted-proxy`, замість цього використовують заголовки запиту. Не розміщуйте спільні секрети в URL.
    - З `gateway.auth.mode: "trusted-proxy"` reverse proxy на loopback того самого хоста все одно **не** задовольняють auth trusted-proxy. Trusted proxy має бути налаштованим джерелом не на loopback.

  </Accordion>

  <Accordion title="Чому тепер мені потрібен токен на localhost?">
    OpenClaw примусово вимагає auth gateway за замовчуванням, включно з loopback. У звичайному типовому сценарії це означає auth через токен: якщо явний шлях auth не налаштовано, під час запуску gateway вибирається режим токена й він автоматично генерується, зберігаючись у `gateway.auth.token`, тому **локальні WS-клієнти повинні автентифікуватися**. Це блокує доступ інших локальних процесів до Gateway.

    Якщо ви віддаєте перевагу іншому шляху auth, можете явно вибрати режим пароля (або, для identity-aware reverse proxy не на loopback, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно задайте `gateway.auth.mode: "none"` у конфігурації. Doctor може згенерувати токен для вас будь-коли: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни конфігурації?">
    Gateway відстежує конфігурацію і підтримує hot-reload:

    - `gateway.reload.mode: "hybrid"` (типово): безпечно застосовує hot-зміни, а для критичних виконує перезапуск
    - також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Як вимкнути кумедні слогани CLI?">
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

    - `off`: приховує текст слогана, але залишає рядок заголовка/version banner.
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: ротація кумедних/сезонних слоганів (типова поведінка).
    - Якщо ви хочете повністю прибрати banner, задайте env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути web search (і web fetch)?">
    `web_fetch` працює без API key. `web_search` залежить від вибраного
    провайдера:

    - Провайдери на основі API, такі як Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, потребують звичайного налаштування API key.
    - Ollama Web Search не потребує ключа, але використовує налаштований хост Ollama і вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна інтеграція на основі HTML.
    - SearXNG не потребує ключа / може бути self-hosted; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

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

    Конфігурація web-search для конкретного провайдера тепер розміщується в `plugins.entries.<plugin>.config.webSearch.*`.
    Застарілі шляхи провайдера `tools.web.search.*` тимчасово все ще завантажуються для сумісності, але не повинні використовуватися в нових конфігураціях.
    Конфігурація fallback для Firecrawl web-fetch розміщується в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlists, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` увімкнено за замовчуванням (якщо не вимкнено явно).
    - Якщо `tools.web.fetch.provider` пропущено, OpenClaw автоматично визначає першого готового fallback-провайдера fetch серед доступних облікових даних. Наразі вбудований провайдер — Firecrawl.
    - Демони читають env vars з `~/.openclaw/.env` (або з оточення сервісу).

    Документація: [Web tools](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мою конфігурацію. Як відновити її і як цього уникнути?">
    `config.apply` замінює **всю конфігурацію**. Якщо ви надсилаєте частковий об’єкт, усе
    інше видаляється.

    Поточна версія OpenClaw захищає від багатьох випадкових руйнівних перезаписів:

    - Записи конфігурації, керовані OpenClaw, перевіряють повну конфігурацію після зміни перед записом.
    - Некоректні або руйнівні записи, керовані OpenClaw, відхиляються і зберігаються як `openclaw.json.rejected.*`.
    - Якщо пряме редагування ламає запуск або hot reload, Gateway відновлює останню коректну конфігурацію і зберігає відхилений файл як `openclaw.json.clobbered.*`.
    - Після відновлення основний агент отримує попередження під час запуску, щоб не записувати некоректну конфігурацію повторно навмання.

    Відновлення:

    - Перевірте `openclaw logs --follow` на наявність `Config auto-restored from last-known-good`, `Config write rejected:` або `config reload restored last-known-good config`.
    - Перегляньте найновіший `openclaw.json.clobbered.*` або `openclaw.json.rejected.*` поруч з активною конфігурацією.
    - Залиште активну відновлену конфігурацію, якщо вона працює, потім поверніть лише потрібні ключі через `openclaw config set` або `config.patch`.
    - Запустіть `openclaw config validate` і `openclaw doctor`.
    - Якщо у вас немає last-known-good або відхиленого payload, відновіть із резервної копії або повторно запустіть `openclaw doctor` і заново налаштуйте channels/models.
    - Якщо це було неочікувано, створіть bug report і додайте вашу останню відому конфігурацію або будь-яку резервну копію.
    - Локальний coding agent часто може відновити робочу конфігурацію з журналів або історії.

    Як уникнути цього:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивного редагування.
    - Спочатку використовуйте `config.schema.lookup`, коли не впевнені щодо точного шляху або форми поля; він повертає неглибокий вузол схеми та підсумки безпосередніх дочірніх елементів для подальшого перегляду.
    - Використовуйте `config.patch` для часткових RPC-редагувань; залишайте `config.apply` лише для повної заміни конфігурації.
    - Якщо ви використовуєте доступний лише owner інструмент `gateway` із запуску агента, він усе одно відхиляє записи в `tools.exec.ask` / `tools.exec.security` (включно із застарілими alias `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Config](/uk/cli/config), [Configure](/uk/cli/configure), [Gateway troubleshooting](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими воркерами на різних пристроях?">
    Найпоширеніший шаблон — **один Gateway** (наприклад, Raspberry Pi) плюс **nodes** і **agents**:

    - **Gateway (центральний):** володіє channels (Signal/WhatsApp), маршрутизацією та сесіями.
    - **Nodes (пристрої):** Mac/iOS/Android підключаються як периферія і надають локальні tools (`system.run`, `canvas`, `camera`).
    - **Agents (воркери):** окремі brain/workspace для спеціальних ролей (наприклад, «Hetzner ops», «Personal data»).
    - **Sub-agents:** запускають фонову роботу з основного агента, коли потрібен паралелізм.
    - **TUI:** підключається до Gateway і перемикає agents/sessions.

    Документація: [Nodes](/uk/nodes), [Remote access](/uk/gateway/remote), [Multi-Agent Routing](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [TUI](/uk/web/tui).

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

    Значення за замовчуванням — `false` (із видимим вікном). Headless-режим з більшою ймовірністю викликає anti-bot перевірки на деяких сайтах. Див. [Browser](/uk/tools/browser).

    Headless використовує **той самий рушій Chromium** і працює для більшості сценаріїв автоматизації (форми, кліки, скрейпінг, логіни). Основні відмінності:

    - Немає видимого вікна браузера (використовуйте знімки екрана, якщо потрібна візуалізація).
    - Деякі сайти суворіше ставляться до автоматизації в headless-режимі (CAPTCHA, anti-bot).
      Наприклад, X/Twitter часто блокує headless-сесії.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування браузером?">
    Задайте `browser.executablePath` для вашого бінарного файлу Brave (або будь-якого браузера на базі Chromium) і перезапустіть Gateway.
    Повні приклади конфігурації див. у [Browser](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway і nodes

<AccordionGroup>
  <Accordion title="Як команди проходять між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає агента і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен tool вузла:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідний трафік провайдера; вони отримують лише виклики node RPC.

  </Accordion>

  <Accordion title="Як мій агент може отримати доступ до мого комп’ютера, якщо Gateway розміщений віддалено?">
    Коротка відповідь: **підключіть свій комп’ютер як Node**. Gateway працює в іншому місці, але він може
    викликати tools `node.*` (екран, камера, система) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на хості, який завжди увімкнений (VPS/домашній сервер).
    2. Додайте хост Gateway і ваш комп’ютер до однієї tailnet.
    3. Переконайтеся, що Gateway WS доступний (прив’язка tailnet або SSH tunnel).
    4. Відкрийте застосунок macOS локально і підключіться в режимі **Remote over SSH** (або напряму через tailnet),
       щоб він міг зареєструватися як Node.
    5. Підтвердьте Node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP bridge не потрібен; nodes підключаються через Gateway WebSocket.

    Нагадування щодо безпеки: підключення macOS Node дозволяє `system.run` на цій машині. Підключайте
    лише пристрої, яким довіряєте, і перегляньте [Security](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Gateway protocol](/uk/gateway/protocol), [macOS remote mode](/uk/platforms/mac/remote), [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключений, але я не отримую відповідей. Що тепер?">
    Перевірте базові речі:

    - Gateway запущений: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан channel: `openclaw channels status`

    Потім перевірте auth і маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` задано правильно.
    - Якщо ви підключаєтеся через SSH tunnel, переконайтеся, що локальний тунель піднятий і вказує на правильний порт.
    - Переконайтеся, що ваші allowlists (DM або group) включають ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Remote access](/uk/gateway/remote), [Channels](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два екземпляри OpenClaw спілкуватися між собою (локальний + VPS)?">
    Так. Вбудованого мосту «bot-to-bot» немає, але це можна налаштувати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний chat channel, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Bot A надсилає повідомлення Bot B, а Bot B відповідає як зазвичай.

    **Міст через CLI (універсально):** запустіть скрипт, який викликає інший Gateway за допомогою
    `openclaw agent --message ... --deliver`, націливши його на чат, який слухає інший бот.
    Якщо один бот розміщений на віддаленому VPS, направте свій CLI на цей віддалений Gateway
    через SSH/Tailscale (див. [Remote access](/uk/gateway/remote)).

    Приклад шаблону (запускається з машини, яка може дістатися до цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте запобіжник, щоб два боти не зациклилися нескінченно (відповіді лише на згадки, channel
    allowlists або правило «не відповідати на повідомлення ботів»).

    Документація: [Remote access](/uk/gateway/remote), [Agent CLI](/uk/cli/agent), [Agent send](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох агентів?">
    Ні. Один Gateway може розміщувати кількох агентів, кожен зі своїм workspace, типовими моделями
    та маршрутизацією. Це нормальна конфігурація, і вона значно дешевша та простіша, ніж запускати
    один VPS на кожного агента.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні конфігурації, якими ви не хочете ділитися. В іншому разі залишайте один Gateway і
    використовуйте кількох агентів або sub-agents.

  </Accordion>

  <Accordion title="Чи є перевага у використанні Node на моєму особистому ноутбуці замість SSH із VPS?">
    Так — nodes є основним способом доступу до вашого ноутбука з віддаленого Gateway, і вони
    дають більше, ніж просто доступ до оболонки. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким (достатньо невеликого VPS або пристрою класу Raspberry Pi; 4 GB RAM більш ніж достатньо), тож поширений
    сценарій — це хост, що завжди увімкнений, плюс ваш ноутбук як Node.

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до Gateway WebSocket і використовують pairing пристрою.
    - **Безпечніший контроль виконання.** `system.run` на цьому ноутбуці обмежується allowlists/підтвердженнями Node.
    - **Більше інструментів пристрою.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна browser automation.** Тримайте Gateway на VPS, але запускайте Chrome локально через node host на ноутбуці або підключайтеся до локального Chrome на хості через Chrome MCP.

    SSH підходить для епізодичного доступу до оболонки, але nodes простіші для постійних workflow агента та
    автоматизації пристрою.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/uk/cli/nodes), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають nodes сервіс gateway?">
    Ні. На одному хості має працювати лише **один gateway**, якщо тільки ви навмисно не запускаєте ізольовані профілі (див. [Multiple gateways](/uk/gateway/multiple-gateways)). Nodes — це периферійні компоненти, які підключаються
    до gateway (nodes iOS/Android або macOS у «режимі node» в застосунку меню-бару). Для headless node
    hosts і керування через CLI див. [Node host CLI](/uk/cli/node).

    Для змін `gateway`, `discovery` і `canvasHost` потрібен повний перезапуск.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати конфігурацію?">
    Так.

    - `config.schema.lookup`: перевірити одне піддерево конфігурації з його неглибоким вузлом схеми, підібраною підказкою UI та підсумками безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний snapshot + hash
    - `config.patch`: безпечне часткове оновлення (рекомендовано для більшості RPC-редагувань); виконує hot-reload, коли це можливо, і перезапуск, коли потрібно
    - `config.apply`: перевіряє й замінює повну конфігурацію; виконує hot-reload, коли це можливо, і перезапуск, коли потрібно
    - Доступний лише owner runtime tool `gateway` усе одно відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; застарілі alias `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

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

    1. **Встановлення + вхід на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Встановлення + вхід на Mac**
       - Використайте застосунок Tailscale і увійдіть у ту саму tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - У консолі адміністрування Tailscale увімкніть MagicDNS, щоб VPS мав стабільне ім’я.
    4. **Використовуйте ім’я хоста tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо вам потрібен Control UI без SSH, використайте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це залишає gateway прив’язаним до loopback і відкриває HTTPS через Tailscale. Див. [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="Як підключити Mac Node до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Gateway Control UI + WS**. Nodes підключаються через ту саму кінцеву точку Gateway WS.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS + Mac перебувають в одній tailnet**.
    2. **Використовуйте застосунок macOS у віддаленому режимі** (SSH-ціллю може бути ім’я хоста tailnet).
       Застосунок протунелює порт Gateway і підключиться як Node.
    3. **Підтвердьте Node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Gateway protocol](/uk/gateway/protocol), [Discovery](/uk/gateway/discovery), [macOS remote mode](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи варто встановлювати на другий ноутбук чи просто додати Node?">
    Якщо вам потрібні лише **локальні tools** (screen/camera/exec) на другому ноутбуці, додайте його як
    **Node**. Це дозволяє зберегти один Gateway і уникнути дублювання конфігурації. Локальні node tools
    наразі доступні лише на macOS, але ми плануємо поширити їх на інші ОС.

    Встановлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/uk/cli/nodes), [Multiple gateways](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars і завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує змінні середовища?">
    OpenClaw читає env vars з батьківського процесу (shell, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` з поточного робочого каталогу
    - глобальний fallback `.env` з `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден із `.env` файлів не перевизначає вже наявні env vars.

    Ви також можете визначити вбудовані env vars у конфігурації (застосовуються лише якщо їх немає в env процесу):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Повний порядок пріоритетів і джерела див. у [/environment](/uk/help/environment).

  </Accordion>

  <Accordion title="Я запустив Gateway через сервіс, і мої env vars зникли. Що тепер?">
    Є два поширені способи виправити це:

    1. Помістіть відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися, навіть коли сервіс не успадковує env вашої shell.
    2. Увімкніть імпорт shell (зручна опція за бажанням):

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

  <Accordion title='Я задав COPILOT_GITHUB_TOKEN, але models status показує "Shell env: off." Чому?'>
    `openclaw models status` повідомляє, чи увімкнено **імпорт shell env**. "Shell env: off"
    **не** означає, що ваші env vars відсутні — це лише означає, що OpenClaw не завантажуватиме
    вашу login shell автоматично.

    Якщо Gateway працює як сервіс (launchd/systemd), він не успадковує середовище
    вашої shell. Виправити це можна одним із таких способів:

    1. Помістіть токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або увімкніть імпорт shell (`env.shellEnv.enabled: true`).
    3. Або додайте його в блок `env` конфігурації (застосовується лише якщо він відсутній).

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
    Надішліть `/new` або `/reset` як окреме повідомлення. Див. [Session management](/uk/concepts/session).
  </Accordion>

  <Accordion title="Чи скидаються сесії автоматично, якщо я ніколи не надсилаю /new?">
    Сесії можуть завершуватися за `session.idleMinutes`, але це **вимкнено за замовчуванням** (значення за замовчуванням — **0**).
    Задайте додатне значення, щоб увімкнути завершення через неактивність. Коли це увімкнено, **наступне**
    повідомлення після періоду неактивності починає новий id сесії для цього ключа чату.
    Це не видаляє транскрипти — лише запускає нову сесію.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб створити команду з екземплярів OpenClaw (один CEO і багато агентів)?">
    Так, через **маршрутизацію multi-agent** і **sub-agents**. Ви можете створити одного агента-координатора
    і кількох агентів-воркерів із власними workspace і моделями.

    Втім, це радше варто розглядати як **цікавий експеримент**. Це витратно за токенами і часто
    менш ефективно, ніж використання одного бота з окремими сесіями. Типова модель, яку ми
    бачимо, — один бот, з яким ви спілкуєтеся, але з різними сесіями для паралельної роботи. Такий
    бот також може запускати sub-agents за потреби.

    Документація: [Multi-agent routing](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [Agents CLI](/uk/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст було обрізано посеред завдання? Як цього уникнути?">
    Контекст сесії обмежений вікном моделі. Довгі чати, великі виводи tools або велика кількість
    файлів можуть спричиняти compaction або обрізання.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими завданнями, а `/new` — під час зміни теми.
    - Тримайте важливий контекст у workspace і просіть бота перечитувати його.
    - Використовуйте sub-agents для довгої або паралельної роботи, щоб основний чат залишався меншим.
    - Оберіть модель із більшим вікном контексту, якщо це трапляється часто.

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

    Потім повторно запустіть налаштування:

    ```bash
    openclaw onboard --install-daemon
    ```

    Примітки:

    - Onboarding також пропонує **Reset**, якщо бачить наявну конфігурацію. Див. [Onboarding (CLI)](/uk/start/wizard).
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скиньте кожен каталог state (типові шляхи — `~/.openclaw-<profile>`).
    - Скидання для dev: `openclaw gateway --dev --reset` (лише для dev; стирає конфігурацію dev + облікові дані + сесії + workspace).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або ущільнити контекст?'>
    Використайте один із варіантів:

    - **Compaction** (зберігає розмову, але підсумовує старіші ходи):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб керувати підсумком.

    - **Скидання** (новий id сесії для того самого ключа чату):

      ```
      /new
      /reset
      ```

    Якщо це трапляється постійно:

    - Увімкніть або налаштуйте **pruning сесій** (`agents.defaults.contextPruning`), щоб обрізати старий вивід tools.
    - Використовуйте модель із більшим вікном контексту.

    Документація: [Compaction](/uk/concepts/compaction), [Session pruning](/uk/concepts/session-pruning), [Session management](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка валідації провайдера: модель згенерувала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що історія сесії застаріла або пошкоджена (часто після довгих threads
    або зміни tool/schema).

    Виправлення: почніть нову сесію командою `/new` (окремим повідомленням).

  </Accordion>

  <Accordion title="Чому я отримую Heartbeat-повідомлення кожні 30 хвилин?">
    Heartbeat виконується кожні **30m** за замовчуванням (**1h** при використанні OAuth auth). Налаштуйте або вимкніть його:

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
    на кшталт `# Heading`), OpenClaw пропускає виконання heartbeat, щоб зекономити API-виклики.
    Якщо файл відсутній, heartbeat усе одно виконується, і модель сама вирішує, що робити.

    Override для окремих агентів задаються через `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "обліковий запис бота" до групи WhatsApp?'>
    Ні. OpenClaw працює від **вашого власного облікового запису**, тож якщо ви є в групі, OpenClaw може її бачити.
    За замовчуванням відповіді в групах заблоковані, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

    Якщо ви хочете, щоб запускати відповіді в групі могли лише **ви**:

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
    Варіант 1 (найшвидший): перегляньте журнали і надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Шукайте `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/додано в allowlist): перегляньте групи з конфігурації:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/uk/cli/directory), [Logs](/uk/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Дві поширені причини:

    - Увімкнено gating за згадками (типово). Ви маєте @згадати бота (або збігтися з `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і групу не додано в allowlist.

    Див. [Groups](/uk/channels/groups) і [Group messages](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи ділять групи/threads контекст із DM?">
    Прямі чати за замовчуванням згортаються до основної сесії. Групи/channels мають власні ключі сесій, а теми Telegram / threads Discord є окремими сесіями. Див. [Groups](/uk/channels/groups) і [Group messages](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки workspace і агентів я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але стежте за таким:

    - **Зростання диска:** сесії + транскрипти зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартість токенів:** більше агентів означає більше одночасного використання моделей.
    - **Операційні витрати:** профілі auth, workspace і маршрутизація channel для кожного агента.

    Поради:

    - Тримайте один **активний** workspace на агента (`agents.defaults.workspace`).
    - Очищуйте старі сесії (видаляйте JSONL або записи сховища), якщо диск переповнюється.
    - Використовуйте `openclaw doctor`, щоб знаходити зайві workspace і невідповідності профілів.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька ботів або чатів одночасно (Slack), і як це краще налаштувати?">
    Так. Використовуйте **Multi-Agent Routing**, щоб запускати кількох ізольованих агентів і маршрутизувати вхідні повідомлення за
    channel/account/peer. Slack підтримується як channel і може бути прив’язаний до конкретних агентів.

    Доступ до браузера потужний, але це не «можливість робити все, що може людина» — anti-bot, CAPTCHA і MFA
    усе ще можуть блокувати автоматизацію. Для найнадійнішого керування браузером використовуйте локальний Chrome MCP на хості
    або CDP на машині, яка фактично запускає браузер.

    Рекомендоване налаштування:

    - Хост Gateway, що завжди увімкнений (VPS/Mac mini).
    - Один агент на роль (bindings).
    - Канал(и) Slack, прив’язані до цих агентів.
    - Локальний браузер через Chrome MCP або Node, коли потрібно.

    Документація: [Multi-Agent Routing](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Browser](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі: значення за замовчуванням, вибір, alias, перемикання

<AccordionGroup>
  <Accordion title='Що таке "модель за замовчуванням"?'>
    Модель OpenClaw за замовчуванням — це те, що ви задали як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються як `provider/model` (приклад: `openai/gpt-5.5`). Якщо ви не вказуєте провайдера, OpenClaw спочатку намагається знайти alias, потім — унікальний збіг серед налаштованих провайдерів для точного id моделі, і лише потім повертається до налаштованого провайдера за замовчуванням як до застарілого шляху сумісності. Якщо цей провайдер більше не надає налаштовану модель за замовчуванням, OpenClaw повертається до першої налаштованої пари провайдер/модель замість показу застарілого типового значення від вилученого провайдера. Але вам усе одно слід **явно** задавати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендоване типове значення:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    **Для агентів з увімкненими tools або з недовіреним вхідним потоком:** надавайте перевагу силі моделі над вартістю.
    **Для рутинного/малоризикового чату:** використовуйте дешевші fallback-моделі та маршрутизуйте за роллю агента.

    У MiniMax є окрема документація: [MiniMax](/uk/providers/minimax) і
    [Local models](/uk/gateway/local-models).

    Практичне правило: використовуйте **найкращу модель, яку можете собі дозволити** для важливих завдань, і дешевшу
    модель для повсякденного чату або підсумків. Ви можете маршрутизувати моделі для кожного агента і використовувати sub-agents для
    паралелізації довгих завдань (кожен sub-agent споживає токени). Див. [Models](/uk/concepts/models) і
    [Sub-agents](/uk/tools/subagents).

    Серйозне попередження: слабші/надмірно квантизовані моделі більш вразливі до prompt
    injection і небезпечної поведінки. Див. [Security](/uk/gateway/security).

    Більше контексту: [Models](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як переключати моделі без стирання конфігурації?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни конфігурації.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для окремої сесії)
    - `openclaw models set ...` (оновлює лише конфігурацію моделі)
    - `openclaw configure --section model` (інтерактивно)
    - редагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` з частковим об’єктом, якщо ви не плануєте замінити всю конфігурацію.
    Для RPC-редагувань спочатку перевіряйте через `config.schema.lookup` і віддавайте перевагу `config.patch`. Payload lookup дає нормалізований шлях, документацію/обмеження неглибокої схеми та підсумки безпосередніх дочірніх елементів.
    для часткових оновлень.
    Якщо ви все ж перезаписали конфігурацію, відновіть її з резервної копії або повторно запустіть `openclaw doctor` для виправлення.

    Документація: [Models](/uk/concepts/models), [Configure](/uk/cli/configure), [Config](/uk/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати self-hosted моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Установіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо ви також хочете хмарні моделі, виконайте `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає вам хмарні моделі плюс ваші локальні моделі Ollama
    - хмарні моделі, такі як `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі більш вразливі до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати tools.
    Якщо ви все ж хочете маленькі моделі, увімкніть sandboxing і суворі tool allowlists.

    Документація: [Ollama](/uk/providers/ollama), [Local models](/uk/gateway/local-models),
    [Model providers](/uk/concepts/model-providers), [Security](/uk/gateway/security),
    [Sandboxing](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися й змінюватися з часом; фіксованої рекомендації щодо провайдера немає.
    - Перевіряйте поточне runtime-налаштування на кожному gateway через `openclaw models status`.
    - Для агентів, чутливих до безпеки / з увімкненими tools, використовуйте найсильнішу доступну модель останнього покоління.
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

    Це вбудовані alias. Власні alias можна додати через `agents.defaults.models`.

    Ви можете переглянути доступні моделі через `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований список вибору. Вибір за номером:

    ```
    /model 3
    ```

    Ви також можете примусово вибрати конкретний профіль auth для провайдера (для окремої сесії):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який агент активний, який файл `auth-profiles.json` використовується і який профіль auth буде спробовано наступним.
    Він також показує налаштований endpoint провайдера (`baseUrl`) і режим API (`api`), коли вони доступні.

    **Як зняти прив’язку профілю, який я задав через @profile?**

    Повторно виконайте `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо ви хочете повернутися до значення за замовчуванням, виберіть його через `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль auth активний.

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.5 для щоденних завдань, а Codex 5.5 — для програмування?">
    Так. Задайте одну як типову, а за потреби перемикайте:

    - **Швидке перемикання (для сесії):** `/model gpt-5.5` для щоденних завдань або збережіть ту саму модель і за потреби переключайте auth/profile.
    - **Типове значення:** задайте `agents.defaults.model.primary` як `openai/gpt-5.5`.
    - **Sub-agents:** маршрутизуйте завдання програмування до sub-agents з іншою моделлю за замовчуванням.

    Див. [Models](/uk/concepts/models) і [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати fast mode для GPT 5.5?">
    Використовуйте або перемикач для сесії, або значення за замовчуванням у конфігурації:

    - **Для сесії:** надішліть `/fast on`, поки сесія використовує `openai/gpt-5.5`.
    - **Типове значення для моделі:** задайте `agents.defaults.models["openai/gpt-5.5"].params.fastMode` як `true`.
    - **Застарілі alias:** старіші записи `openai-codex/gpt-*` можуть зберігати власні параметри, але в нових конфігураціях параметри слід задавати для `openai/gpt-*`.

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

    Для OpenAI fast mode відповідає `service_tier = "priority"` у підтримуваних нативних запитах Responses. Сесійні override через `/fast` мають вищий пріоритет за типові значення конфігурації.

    Див. [Thinking and fast mode](/uk/tools/thinking) і [OpenAI fast mode](/uk/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо задано `agents.defaults.models`, це стає **allowlist** для `/model` і будь-яких
    override сесії. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, приберіть allowlist або виберіть модель через `/model list`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **провайдер не налаштований** (не знайдено конфігурацію провайдера MiniMax або профіль
    auth), тому модель не може бути розв’язана.

    Контрольний список для виправлення:

    1. Оновіться до поточного релізу OpenClaw (або запускайте з вихідного коду `main`), а потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (через майстер або JSON), або що auth MiniMax
       існує в env/профілях auth, щоб відповідний провайдер міг бути ін’єктований
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений MiniMax
       OAuth для `minimax-portal`).
    3. Використовуйте точний id моделі (з урахуванням регістру) для вашого шляху auth:
       `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed` для налаштування з API key,
       або `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` для налаштування з OAuth.
    4. Виконайте:

       ```bash
       openclaw models list
       ```

       і виберіть зі списку (або `/model list` у чаті).

    Див. [MiniMax](/uk/providers/minimax) і [Models](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати MiniMax як типову модель, а OpenAI — для складних завдань?">
    Так. Використовуйте **MiniMax як типову модель** і перемикайте моделі **для окремих сесій** за потреби.
    Fallback призначені для **помилок**, а не для «складних завдань», тому використовуйте `/model` або окремого агента.

    **Варіант A: перемикання для окремої сесії**

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

    Документація: [Models](/uk/concepts/models), [Multi-Agent Routing](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома типовими shorthand-іменами (застосовуються лише коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви задасте власний alias з такою самою назвою, пріоритет матиме ваше значення.

  </Accordion>

  <Accordion title="Як визначати/перевизначати скорочення моделей (alias)?">
    Alias беруться з `agents.defaults.models.<modelId>.alias`. Приклад:

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

    Тоді `/model sonnet` (або `/<alias>`, коли підтримується) буде розв’язуватися до цього ID моделі.

  </Accordion>

  <Accordion title="Як додати моделі від інших провайдерів, таких як OpenRouter або Z.AI?">
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

    Якщо ви посилаєтесь на `provider/model`, але потрібний ключ провайдера відсутній, ви отримаєте runtime-помилку auth (наприклад, `No API key found for provider "zai"`).

    **Після додавання нового агента з’являється помилка No API key found for provider**

    Зазвичай це означає, що в **нового агента** порожнє сховище auth. Auth прив’язаний до агента і
    зберігається в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Запустіть `openclaw agents add <id>` і налаштуйте auth у майстрі.
    - Або скопіюйте `auth-profiles.json` з `agentDir` основного агента в `agentDir` нового агента.

    **Не** використовуйте один і той самий `agentDir` для кількох агентів; це спричиняє конфлікти auth/сесій.

  </Accordion>
</AccordionGroup>

## Fallback моделей і "All models failed"

<AccordionGroup>
  <Accordion title="Як працює fallback?">
    Fallback відбувається у два етапи:

    1. **Ротація профілів auth** в межах одного провайдера.
    2. **Fallback моделі** до наступної моделі в `agents.defaults.model.fallbacks`.

    До профілів, що помиляються, застосовуються cooldown (експоненційний backoff), тому OpenClaw може й далі відповідати, навіть коли провайдер обмежений за rate limit або тимчасово не працює.

    До bucket rate limit входять не лише прості відповіді `429`. OpenClaw
    також трактує повідомлення на кшталт `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    ліміти вікна використання (`weekly/monthly limit reached`) як rate limit,
    гідні переходу на fallback.

    Деякі відповіді, схожі на білінгові, не мають коду `402`, а деякі HTTP `402`
    також залишаються в цьому transient bucket. Якщо провайдер повертає
    явний білінговий текст на `401` або `403`, OpenClaw усе ще може лишити це в
    білінговому bucket, але специфічні для провайдера text matcher-и залишаються прив’язаними до
    провайдера, якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Якщо ж повідомлення `402`
    більше схоже на вікно використання, яке можна повторити, або
    ліміт витрат organization/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw трактує це як
    `rate_limit`, а не як довготривале вимкнення через білінг.

    Помилки переповнення контексту — це інше: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху compaction/retry замість переходу до model
    fallback.

    Загальний текст server error навмисно вужчий, ніж «усе, що містить
    unknown/error». OpenClaw справді трактує transient-форми, обмежені провайдером,
    такі як Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, помилки stop-reason на кшталт `Unhandled stop reason:
    error`, JSON `api_error` payloads із transient server text
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості провайдера, такі як `ModelNotReadyException`, як сигнали timeout/overloaded,
    гідні fallback, коли контекст провайдера збігається.
    Загальний внутрішній fallback text на кшталт `LLM request failed with an unknown
    error.` лишається консервативним і сам по собі не запускає model fallback.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система намагалася використати ID профілю auth `anthropic:default`, але не змогла знайти для нього облікові дані в очікуваному сховищі auth.

    **Контрольний список для виправлення:**

    - **Переконайтеся, де зберігаються профілі auth** (нові та застарілі шляхи)
      - Поточний шлях: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий шлях: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`)
    - **Переконайтеся, що Gateway завантажив вашу env var**
      - Якщо ви задали `ANTHROPIC_API_KEY` у shell, але запускаєте Gateway через systemd/launchd, він може її не успадкувати. Помістіть її в `~/.openclaw/.env` або увімкніть `env.shellEnv`.
    - **Переконайтеся, що редагуєте правильного агента**
      - У multi-agent-налаштуваннях може бути кілька файлів `auth-profiles.json`.
    - **Базова перевірка статусу model/auth**
      - Використовуйте `openclaw models status`, щоб побачити налаштовані моделі та чи автентифіковано провайдерів.

    **Контрольний список для виправлення "No credentials found for profile anthropic"**

    Це означає, що запуск прив’язаний до профілю auth Anthropic, але Gateway
    не може знайти його у своєму сховищі auth.

    - **Використайте Claude CLI**
      - Запустіть `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо ви натомість хочете використовувати API key**
      - Помістіть `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистьте будь-який примусовий порядок, який вимагає відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Переконайтеся, що запускаєте команди на хості gateway**
      - У віддаленому режимі профілі auth живуть на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому він також спробував Google Gemini і завершився помилкою?">
    Якщо ваша конфігурація моделі містить Google Gemini як fallback (або ви перемкнулися на shorthand Gemini), OpenClaw спробує його під час model fallback. Якщо ви не налаштували облікові дані Google, ви побачите `No API key found for provider "google"`.

    Виправлення: або надайте auth Google, або приберіть/уникайте моделей Google у `agents.defaults.model.fallbacks` / alias, щоб fallback не маршрутизував туди.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Причина: історія сесії містить **thinking blocks без сигнатур** (часто через
    перерваний/частковий потік). Google Antigravity вимагає сигнатури для thinking blocks.

    Виправлення: тепер OpenClaw видаляє thinking blocks без сигнатур для Google Antigravity Claude. Якщо це все ще з’являється, почніть **нову сесію** або задайте `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Профілі auth: що це таке і як ними керувати

Пов’язане: [/concepts/oauth](/uk/concepts/oauth) (OAuth flows, зберігання токенів, шаблони для кількох облікових записів)

<AccordionGroup>
  <Accordion title="Що таке профіль auth?">
    Профіль auth — це іменований запис облікових даних (OAuth або API key), прив’язаний до провайдера. Профілі зберігаються в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Які типові ID профілів?">
    OpenClaw використовує ID з префіксом провайдера, наприклад:

    - `anthropic:default` (поширений варіант, коли немає email-ідентичності)
    - `anthropic:<email>` для OAuth-ідентичностей
    - власні ID на ваш вибір (наприклад `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я контролювати, який профіль auth спробується першим?">
    Так. Конфігурація підтримує необов’язкові метадані для профілів і порядок для кожного провайдера (`auth.order.<provider>`). Це **не** зберігає секрети; воно лише зіставляє ID з провайдером/режимом і задає порядок ротації.

    OpenClaw може тимчасово пропустити профіль, якщо він перебуває в короткому **cooldown** (rate limit/timeouts/auth failures) або в довшому стані **disabled** (billing/insufficient credits). Щоб перевірити це, виконайте `openclaw models status --json` і подивіться `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Cooldown через rate limit може бути прив’язаний до моделі. Профіль, який перебуває в cooldown
    для однієї моделі, усе ще може бути придатним для спорідненої моделі того самого провайдера,
    тоді як billing/disabled-вікна все одно блокують увесь профіль.

    Ви також можете задати **override порядку для окремого агента** (зберігається в `auth-state.json` цього агента) через CLI:

    ```bash
    # За замовчуванням використовується типовий агент із конфігурації (опустіть --agent)
    openclaw models auth order get --provider anthropic

    # Зафіксувати ротацію на одному профілі (пробувати лише цей)
    openclaw models auth order set --provider anthropic anthropic:default

    # Або задати явний порядок (fallback у межах провайдера)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Очистити override (повернутися до config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Щоб націлитися на конкретного агента:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Щоб перевірити, що справді буде спробовано, використовуйте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль пропущено в явному порядку, probe повідомить
    `excluded_by_auth_order` для цього профілю замість мовчазної спроби.

  </Accordion>

  <Accordion title="OAuth vs API key — у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за підпискою (де це можливо).
    - **API keys** використовують оплату за токени.

    Майстер явно підтримує Anthropic Claude CLI, OpenAI Codex OAuth і API keys.

  </Accordion>
</AccordionGroup>

## Gateway: порти, "already running" і віддалений режим

<AccordionGroup>
  <Accordion title="Який порт використовує Gateway?">
    `gateway.port` керує єдиним мультиплексованим портом для WebSocket + HTTP (Control UI, hooks тощо).

    Пріоритет:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > типове значення 18789
    ```

  </Accordion>

  <Accordion title='Чому openclaw gateway status показує "Runtime: running", але "Connectivity probe: failed"?'>
    Тому що "running" — це погляд **супервізора** (launchd/systemd/schtasks). А connectivity probe — це фактична спроба CLI підключитися до gateway WebSocket.

    Використовуйте `openclaw gateway status` і орієнтуйтеся на ці рядки:

    - `Probe target:` (URL, який probe фактично використав)
    - `Listening:` (що реально прив’язано до порту)
    - `Last gateway error:` (типова коренева причина, коли процес живий, але порт не слухає)

  </Accordion>

  <Accordion title='Чому openclaw gateway status показує різні "Config (cli)" і "Config (service)"?'>
    Ви редагуєте один файл конфігурації, а сервіс працює з іншим (часто через невідповідність `--profile` / `OPENCLAW_STATE_DIR`).

    Виправлення:

    ```bash
    openclaw gateway install --force
    ```

    Запускайте це з того самого `--profile` / середовища, яке має використовувати сервіс.

  </Accordion>

  <Accordion title='Що означає "another gateway instance is already listening"?'>
    OpenClaw примусово використовує runtime-lock, одразу прив’язуючи слухач WebSocket під час запуску (типово `ws://127.0.0.1:18789`). Якщо прив’язка завершується з `EADDRINUSE`, викидається `GatewayLockError`, який означає, що інший екземпляр уже слухає.

    Виправлення: зупиніть інший екземпляр, звільніть порт або запускайте з `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Як запустити OpenClaw у віддаленому режимі (клієнт підключається до Gateway в іншому місці)?">
    Задайте `gateway.mode: "remote"` і вкажіть URL віддаленого WebSocket, за потреби разом із віддаленими обліковими даними зі спільним секретом:

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

    - `openclaw gateway` запускається лише коли `gateway.mode` має значення `local` (або якщо ви передали прапорець override).
    - Застосунок macOS стежить за файлом конфігурації і в реальному часі перемикає режими, коли ці значення змінюються.
    - `gateway.remote.token` / `.password` — це лише клієнтські віддалені облікові дані; самі по собі вони не вмикають auth локального gateway.

  </Accordion>

  <Accordion title='Control UI показує "unauthorized" (або постійно перепідключається). Що робити?'>
    Шлях auth вашого gateway і метод auth у UI не збігаються.

    Факти (з коду):

    - Control UI зберігає токен у `sessionStorage` для поточної сесії вкладки браузера та вибраної URL-адреси gateway, тож оновлення в межах тієї самої вкладки продовжують працювати без відновлення довготривалої прив’язки токена в localStorage.
    - За `AUTH_TOKEN_MISMATCH` довірені клієнти можуть спробувати один обмежений повторний запит із кешованим токеном пристрою, коли gateway повертає підказки для повтору (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Цей повтор із кешованим токеном тепер повторно використовує кешовані дозволені scopes, збережені разом із токеном пристрою. Явні виклики `deviceToken` / явні `scopes` усе одно зберігають свій запитаний набір scopes замість успадковування кешованих.
    - Поза цим шляхом повтору пріоритет auth під час підключення такий: спочатку явний shared token/password, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap token.
    - Перевірки scope bootstrap token мають префікси ролей. Вбудований allowlist для bootstrap operator задовольняє лише запити operator; Node або інші не-operator ролі все одно потребують scopes під власним префіксом ролі.

    Виправлення:

    - Найшвидше: `openclaw dashboard` (друкує + копіює URL dashboard, намагається відкрити; якщо режим headless, показує підказку для SSH).
    - Якщо у вас ще немає токена: `openclaw doctor --generate-gateway-token`.
    - Якщо віддалено, спочатку створіть тунель: `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`.
    - Режим shared-secret: задайте `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, потім вставте відповідний секрет у налаштуваннях Control UI.
    - Режим Tailscale Serve: переконайтеся, що `gateway.auth.allowTailscale` увімкнено і ви відкриваєте URL Serve, а не сирий loopback/tailnet URL, який обходить заголовки ідентичності Tailscale.
    - Режим trusted-proxy: переконайтеся, що ви заходите через налаштований identity-aware proxy не на loopback, а не через loopback proxy на тому самому хості чи сирий URL gateway.
    - Якщо невідповідність залишається після однієї повторної спроби, перевипустіть/повторно підтвердьте токен парного пристрою:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Якщо цей виклик rotate повідомляє, що його відхилено, перевірте дві речі:
      - сесії парних пристроїв можуть перевипускати лише **власний** пристрій, якщо в них немає також `operator.admin`
      - явні значення `--scope` не можуть перевищувати поточні operator scopes викликача
    - Усе ще не виходить? Запустіть `openclaw status --all` і дотримуйтеся [Troubleshooting](/uk/gateway/troubleshooting). Подробиці auth див. у [Dashboard](/uk/web/dashboard).

  </Accordion>

  <Accordion title="Я встановив gateway.bind tailnet, але він не може прив’язатися і нічого не слухає">
    Прив’язка `tailnet` вибирає IP-адресу Tailscale з мережевих інтерфейсів (100.64.0.0/10). Якщо машина не в Tailscale (або інтерфейс вимкнений), прив’язуватися немає до чого.

    Виправлення:

    - Запустіть Tailscale на цьому хості (щоб він мав адресу 100.x), або
    - Перемкніться на `gateway.bind: "loopback"` / `"lan"`.

    Примітка: `tailnet` задається явно. `auto` віддає перевагу loopback; використовуйте `gateway.bind: "tailnet"`, коли вам потрібна прив’язка лише до tailnet.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька Gateway на одному хості?">
    Зазвичай ні — один Gateway може обслуговувати кілька messaging channels і агентів. Кілька Gateway використовуйте лише тоді, коли вам потрібна резервність (наприклад, rescue bot) або жорстка ізоляція.

    Так, але вам потрібно ізолювати:

    - `OPENCLAW_CONFIG_PATH` (окрема конфігурація для кожного екземпляра)
    - `OPENCLAW_STATE_DIR` (окремий state для кожного екземпляра)
    - `agents.defaults.workspace` (ізоляція workspace)
    - `gateway.port` (унікальні порти)

    Швидке налаштування (рекомендовано):

    - Використовуйте `openclaw --profile <name> ...` для кожного екземпляра (автоматично створює `~/.openclaw-<name>`).
    - Задайте унікальний `gateway.port` у конфігурації кожного профілю (або передавайте `--port` для ручних запусків).
    - Встановіть сервіс для кожного профілю: `openclaw --profile <name> gateway install`.

    Профілі також додають суфікс до назв сервісів (`ai.openclaw.<profile>`; застарілі `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Повний посібник: [Multiple gateways](/uk/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Що означає "invalid handshake" / code 1008?'>
    Gateway — це **сервер WebSocket**, і він очікує, що першим повідомленням
    буде кадр `connect`. Якщо він отримує щось інше, то закриває з’єднання
    з **code 1008** (порушення політики).

    Поширені причини:

    - Ви відкрили **HTTP** URL у браузері (`http://...`) замість WS-клієнта.
    - Ви використали неправильний порт або шлях.
    - Proxy або tunnel видалив заголовки auth або надіслав запит не до Gateway.

    Швидкі виправлення:

    1. Використовуйте WS URL: `ws://<host>:18789` (або `wss://...`, якщо HTTPS).
    2. Не відкривайте WS-порт у звичайній вкладці браузера.
    3. Якщо auth увімкнено, передайте токен/пароль у кадрі `connect`.

    Якщо ви використовуєте CLI або TUI, URL має виглядати так:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Подробиці протоколу: [Gateway protocol](/uk/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Журнали та налагодження

<AccordionGroup>
  <Accordion title="Де знаходяться журнали?">
    Файлові журнали (структуровані):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Ви можете задати стабільний шлях через `logging.file`. Рівень файлового журналювання контролюється `logging.level`. Детальність консолі контролюється через `--verbose` і `logging.consoleLevel`.

    Найшвидший перегляд хвоста журналу:

    ```bash
    openclaw logs --follow
    ```

    Журнали сервісу/супервізора (коли gateway працює через launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` і `gateway.err.log` (типово: `~/.openclaw/logs/...`; для профілів — `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Докладніше див. у [Troubleshooting](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Як запустити/зупинити/перезапустити сервіс Gateway?">
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

    Відкрийте PowerShell, увійдіть у WSL, потім перезапустіть:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви ніколи не встановлювали сервіс, запустіть його на передньому плані:

    ```bash
    openclaw gateway run
    ```

    **2) Нативний Windows (не рекомендовано):** Gateway працює безпосередньо у Windows.

    Відкрийте PowerShell і виконайте:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви запускаєте його вручну (без сервісу), використовуйте:

    ```powershell
    openclaw gateway run
    ```

    Документація: [Windows (WSL2)](/uk/platforms/windows), [Gateway service runbook](/uk/gateway).

  </Accordion>

  <Accordion title="Gateway запущено, але відповіді не надходять. Що перевірити?">
    Почніть із швидкої перевірки стану:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Поширені причини:

    - Auth моделі не завантажено на **хості gateway** (перевірте `models status`).
    - Pairing/allowlist каналу блокує відповіді (перевірте конфігурацію channel + журнали).
    - WebChat/Dashboard відкрито без правильного токена.

    Якщо ви працюєте віддалено, переконайтеся, що tunnel/Tailscale-з’єднання підняте і що
    Gateway WebSocket доступний.

    Документація: [Channels](/uk/channels), [Troubleshooting](/uk/gateway/troubleshooting), [Remote access](/uk/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — що тепер?'>
    Зазвичай це означає, що UI втратив з’єднання WebSocket. Перевірте:

    1. Чи запущений Gateway? `openclaw gateway status`
    2. Чи справний Gateway? `openclaw status`
    3. Чи має UI правильний токен? `openclaw dashboard`
    4. Якщо віддалено, чи працює tunnel/Tailscale-з’єднання?

    Потім перегляньте журнали:

    ```bash
    openclaw logs --follow
    ```

    Документація: [Dashboard](/uk/web/dashboard), [Remote access](/uk/gateway/remote), [Troubleshooting](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Не вдається виконати Telegram setMyCommands. Що перевірити?">
    Почніть із журналів і статусу channel:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Далі зіставте з помилкою:

    - `BOT_COMMANDS_TOO_MUCH`: у меню Telegram забагато елементів. OpenClaw уже обрізає список до ліміту Telegram і повторює спробу з меншою кількістю команд, але деякі записи меню все одно потрібно прибрати. Зменште кількість команд plugin/skill/custom або вимкніть `channels.telegram.commands.native`, якщо меню вам не потрібне.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` або подібні мережеві помилки: якщо ви на VPS або за proxy, переконайтеся, що вихідний HTTPS дозволений і DNS працює для `api.telegram.org`.

    Якщо Gateway віддалений, переконайтеся, що ви дивитесь журнали саме на хості Gateway.

    Документація: [Telegram](/uk/channels/telegram), [Channel troubleshooting](/uk/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI не показує вивід. Що перевірити?">
    Спочатку переконайтеся, що Gateway доступний і агент може працювати:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    У TUI використовуйте `/status`, щоб побачити поточний стан. Якщо ви очікуєте відповіді в chat
    channel, переконайтеся, що доставку увімкнено (`/deliver on`).

    Документація: [TUI](/uk/web/tui), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як повністю зупинити, а потім знову запустити Gateway?">
    Якщо ви встановили сервіс:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Це зупиняє/запускає **керований сервіс** (launchd на macOS, systemd на Linux).
    Використовуйте це, коли Gateway працює у фоновому режимі як демон.

    Якщо ви запускаєте його на передньому плані, зупиніть через Ctrl-C, потім:

    ```bash
    openclaw gateway run
    ```

    Документація: [Gateway service runbook](/uk/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: перезапускає **фоновий сервіс** (launchd/systemd).
    - `openclaw gateway`: запускає gateway **на передньому плані** для цієї сесії термінала.

    Якщо ви встановили сервіс, використовуйте команди gateway. Використовуйте `openclaw gateway`, коли
    вам потрібен одноразовий запуск на передньому плані.

  </Accordion>

  <Accordion title="Найшвидший спосіб отримати більше подробиць, коли щось ламається">
    Запустіть Gateway з `--verbose`, щоб отримати докладніший консольний вивід. Потім перевірте файл журналу на предмет auth channel, маршрутизації моделі та помилок RPC.
  </Accordion>
</AccordionGroup>

## Медіа та вкладення

<AccordionGroup>
  <Accordion title="Мій skill згенерував зображення/PDF, але нічого не було надіслано">
    Вихідні вкладення від агента мають містити рядок `MEDIA:<path-or-url>` (окремим рядком). Див. [OpenClaw assistant setup](/uk/start/openclaw) і [Agent send](/uk/tools/agent-send).

    Надсилання через CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Також перевірте:

    - Цільовий channel підтримує вихідні медіа й не блокується allowlists.
    - Файл не перевищує обмеження розміру провайдера (зображення змінюються до максимуму 2048px).
    - `tools.fs.workspaceOnly=true` обмежує надсилання локальних шляхів workspace, temp/media-store і файлами, перевіреними sandbox.
    - `tools.fs.workspaceOnly=false` дозволяє `MEDIA:` надсилати локальні файли хоста, які агент уже може читати, але лише для медіа плюс безпечних типів документів (зображення, аудіо, відео, PDF і Office-документи). Звичайні текстові та схожі на секрети файли все одно блокуються.

    Див. [Images](/uk/nodes/images).

  </Accordion>
</AccordionGroup>

## Безпека та контроль доступу

<AccordionGroup>
  <Accordion title="Чи безпечно відкривати OpenClaw для вхідних DM?">
    Ставтеся до вхідних DM як до недовіреного вводу. Значення за замовчуванням розроблені так, щоб зменшувати ризик:

    - Типова поведінка на channels, що підтримують DM, — це **pairing**:
      - Невідомі відправники отримують pairing code; бот не обробляє їхнє повідомлення.
      - Схвалення: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Кількість очікуваних запитів обмежена **3 на channel**; перевіряйте `openclaw pairing list --channel <channel> [--account <id>]`, якщо код не надійшов.
    - Публічне відкриття DM потребує явної згоди (`dmPolicy: "open"` і allowlist `"*"`).

    Запустіть `openclaw doctor`, щоб виявити ризиковані політики DM.

  </Accordion>

  <Accordion title="Чи є prompt injection проблемою лише для публічних ботів?">
    Ні. Prompt injection — це про **недовірений вміст**, а не лише про те, хто може писати боту в DM.
    Якщо ваш помічник читає зовнішній вміст (web search/fetch, сторінки браузера, email,
    документи, вкладення, вставлені журнали), цей вміст може містити інструкції, які намагаються
    перехопити контроль над моделлю. Це може трапитися, навіть якщо **єдиний відправник — ви самі**.

    Найбільший ризик виникає, коли ввімкнено tools: модель можна змусити
    витягувати контекст або викликати tools від вашого імені. Зменшуйте зону ураження так:

    - використовуйте агента «reader» лише для читання або без tools, щоб підсумовувати недовірений вміст
    - тримайте `web_search` / `web_fetch` / `browser` вимкненими для агентів з увімкненими tools
    - також ставтеся до декодованого тексту файлів/документів як до недовіреного: OpenResponses
      `input_file` і витяг тексту з медіа-вкладень обидва обгортають витягнутий текст
      явними маркерами меж зовнішнього вмісту замість передавання сирого тексту файлу
    - використовуйте sandboxing і суворі tool allowlists

    Подробиці: [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи повинен мій бот мати окремий email, обліковий запис GitHub або номер телефону?">
    Так, для більшості конфігурацій. Ізоляція бота за допомогою окремих облікових записів і номерів телефону
    зменшує зону ураження, якщо щось піде не так. Це також спрощує ротацію
    облікових даних або відкликання доступу без впливу на ваші особисті облікові записи.

    Починайте з малого. Надавайте доступ лише до тих tools і облікових записів, які вам справді потрібні, і за
    потреби розширюйте пізніше.

    Документація: [Security](/uk/gateway/security), [Pairing](/uk/channels/pairing).

  </Accordion>

  <Accordion title="Чи можу я дати йому автономність над моїми текстовими повідомленнями, і чи це безпечно?">
    Ми **не** рекомендуємо повну автономність щодо ваших особистих повідомлень. Найбезпечніший шаблон такий:

    - Тримайте DM у режимі **pairing** або зі строгим allowlist.
    - Використовуйте **окремий номер або обліковий запис**, якщо хочете, щоб він надсилав повідомлення від вашого імені.
    - Дозвольте йому створювати чернетки, а потім **схвалюйте перед надсиланням**.

    Якщо хочете поекспериментувати, робіть це на окремому обліковому записі й тримайте його ізольованим. Див.
    [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи можу я використовувати дешевші моделі для завдань персонального помічника?">
    Так, **якщо** агент працює лише в чаті, а вхідні дані довірені. Менші рівні
    більш схильні до перехоплення інструкцій, тож уникайте їх для агентів з увімкненими tools
    або під час читання недовіреного вмісту. Якщо вам усе ж потрібна менша модель, жорстко обмежте
    tools і запускайте всередині sandbox. Див. [Security](/uk/gateway/security).
  </Accordion>

  <Accordion title="Я виконав /start у Telegram, але не отримав pairing code">
    Pairing codes надсилаються **лише** тоді, коли невідомий відправник пише боту і
    ввімкнено `dmPolicy: "pairing"`. Сам по собі `/start` не генерує код.

    Перевірте очікувані запити:

    ```bash
    openclaw pairing list telegram
    ```

    Якщо вам потрібен негайний доступ, додайте свій id відправника в allowlist або задайте `dmPolicy: "open"`
    для цього облікового запису.

  </Accordion>

  <Accordion title="WhatsApp: чи буде він писати моїм контактам? Як працює pairing?">
    Ні. Типова політика WhatsApp DM — **pairing**. Невідомі відправники отримують лише pairing code, а їхнє повідомлення **не обробляється**. OpenClaw відповідає лише на чати, які отримує, або на явні надсилання, які ви ініціюєте.

    Схвалення pairing:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Перелік очікуваних запитів:

    ```bash
    openclaw pairing list whatsapp
    ```

    Запит номера телефону в майстрі: він використовується, щоб налаштувати ваш **allowlist/owner**, аби ваші власні DM були дозволені. Він не використовується для автоматичного надсилання. Якщо ви запускаєте систему на своєму особистому номері WhatsApp, використовуйте цей номер і ввімкніть `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Команди чату, переривання завдань і "воно не зупиняється"

<AccordionGroup>
  <Accordion title="Як не показувати внутрішні системні повідомлення в чаті?">
    Більшість внутрішніх або tool-повідомлень з’являються лише коли для цієї сесії увімкнено **verbose**, **trace** або **reasoning**.

    Виправлення в чаті, де ви це бачите:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Якщо все одно занадто шумно, перевірте налаштування сесії в Control UI і задайте verbose
    як **inherit**. Також переконайтеся, що ви не використовуєте профіль бота з `verboseDefault`, встановленим
    у `on` у конфігурації.

    Документація: [Thinking and verbose](/uk/tools/thinking), [Security](/uk/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Як зупинити/скасувати завдання, що виконується?">
    Надішліть будь-яке з цього **як окреме повідомлення** (без слеша):

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

    Для фонових процесів (з tool exec) ви можете попросити агента виконати:

    ```
    process action:kill sessionId:XXX
    ```

    Огляд slash-команд: див. [Slash commands](/uk/tools/slash-commands).

    Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`, але кілька скорочень (як-от `/status`) також працюють inline для відправників з allowlist.

  </Accordion>

  <Accordion title='Як надіслати повідомлення в Discord із Telegram? ("Cross-context messaging denied")'>
    OpenClaw за замовчуванням блокує повідомлення **між різними провайдерами**. Якщо виклик tool прив’язаний
    до Telegram, він не надсилатиме в Discord, якщо ви явно цього не дозволите.

    Увімкніть міжпровайдерні повідомлення для агента:

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

  <Accordion title='Чому здається, що бот "ігнорує" швидкі серії повідомлень?'>
    Режим queue визначає, як нові повідомлення взаємодіють із уже активним запуском. Використовуйте `/queue`, щоб змінити режими:

    - `steer` - нові повідомлення перенаправляють поточне завдання
    - `followup` - повідомлення виконуються по одному
    - `collect` - повідомлення збираються в пакет і відповідь надсилається один раз (типово)
    - `steer-backlog` - спочатку перенаправлення, потім обробка черги
    - `interrupt` - перервати поточний запуск і почати заново

    Ви можете додавати параметри, такі як `debounce:2s cap:25 drop:summarize` для режимів followup.

  </Accordion>
</AccordionGroup>

## Різне

<AccordionGroup>
  <Accordion title='Яка модель є типовою для Anthropic з API key?'>
    В OpenClaw облікові дані й вибір моделі розділені. Установлення `ANTHROPIC_API_KEY` (або збереження API key Anthropic у профілях auth) увімкне автентифікацію, але фактична модель за замовчуванням — це те, що ви налаштували в `agents.defaults.model.primary` (наприклад, `anthropic/claude-sonnet-4-6` або `anthropic/claude-opus-4-6`). Якщо ви бачите `No credentials found for profile "anthropic:default"`, це означає, що Gateway не зміг знайти облікові дані Anthropic в очікуваному `auth-profiles.json` для агента, який виконується.
  </Accordion>
</AccordionGroup>

---

Усе ще застрягли? Запитайте в [Discord](https://discord.com/invite/clawd) або відкрийте [GitHub discussion](https://github.com/openclaw/openclaw/discussions).
