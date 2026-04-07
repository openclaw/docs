---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час виконання
    - Тріаж проблем, про які повідомляють користувачі, перед глибшим налагодженням
summary: Поширені запитання про налаштування, конфігурацію та використання OpenClaw
title: Поширені запитання
x-i18n:
    generated_at: "2026-04-07T12:04:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa44229d4c0f9f448b4b11be141ecc9fdc89ddaefff37f18f14173cd95cd5b49
    source_path: help/faq.md
    workflow: 15
---

# Поширені запитання

Швидкі відповіді та глибше усунення несправностей для реальних сценаріїв налаштування (локальна розробка, VPS, кілька агентів, OAuth/API-ключі, резервне перемикання моделей). Для діагностики під час виконання див. [Усунення несправностей](/uk/gateway/troubleshooting). Для повної довідки з конфігурації див. [Конфігурація](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламалося

1. **Швидкий статус (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидкий локальний підсумок: ОС + оновлення, доступність gateway/сервісу, агенти/сесії, конфігурація провайдера + проблеми під час виконання (коли gateway доступний).

2. **Звіт, який можна вставити й поділитися ним**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з хвостом журналу (токени приховано).

3. **Стан демона + порту**

   ```bash
   openclaw gateway status
   ```

   Показує runtime супервізора проти досяжності RPC, цільовий URL probe та яку конфігурацію сервіс імовірно використовував.

4. **Глибокі probe-перевірки**

   ```bash
   openclaw status --deep
   ```

   Виконує живу probe-перевірку стану gateway, зокрема channel probes, коли це підтримується
   (потребує доступного gateway). Див. [Health](/uk/gateway/health).

5. **Переглянути останній журнал у реальному часі**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використайте запасний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Журнали файлів відокремлені від журналів сервісу; див. [Логування](/uk/logging) і [Усунення несправностей](/uk/gateway/troubleshooting).

6. **Запустити doctor (відновлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує конфігурацію/стан + запускає перевірки справності. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок стану Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # показує цільовий URL + шлях до конфігурації у разі помилок
   ```

   Запитує у запущеного gateway повний знімок стану (лише WS). Див. [Health](/uk/gateway/health).

## Швидкий старт і початкове налаштування

<AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб розблокуватися">
    Використайте локального AI-агента, який може **бачити вашу машину**. Це значно ефективніше, ніж питати
    у Discord, тому що більшість випадків "я застряг" — це **локальні проблеми конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, виконувати команди, перевіряти журнали й допомагати виправити
    налаштування на рівні машини (PATH, сервіси, дозволи, файли автентифікації). Надайте їм **повну копію вихідного коду**
    через змінне (git) встановлення:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **з git checkout**, тож агент може читати код + документацію і
    міркувати саме про ту версію, яку ви запускаєте. Ви завжди можете повернутися до стабільної версії пізніше,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати й проконтролювати** виправлення (покроково), а потім виконати лише
    потрібні команди. Це зменшує зміни й спрощує аудит.

    Якщо ви виявите реальну помилку або виправлення, будь ласка, створіть GitHub issue або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (діліться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану gateway/агента + базова конфігурація.
    - `openclaw models status`: перевіряє автентифікацію провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє поширені проблеми конфігурації/стану.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламалося](#перші-60-секунд-якщо-щось-зламалося).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску heartbeat:

    - `quiet-hours`: поза налаштованим вікном active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожній каркас/заголовки
    - `no-tasks-due`: увімкнено режим завдань `HEARTBEAT.md`, але жоден з інтервалів завдань ще не настав
    - `alerts-disabled`: всю видимість heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` вимкнені)

    У режимі завдань часові позначки виконання оновлюються лише після завершення
    реального запуску heartbeat. Пропущені запуски не позначають завдання як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановити та налаштувати OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання онбордингу:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати UI assets. Після онбордингу ви зазвичай запускаєте Gateway на порту **18789**.

    Із вихідного коду (учасники/розробники):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # автоматично встановлює залежності UI під час першого запуску
    openclaw onboard
    ```

    Якщо у вас ще немає глобального встановлення, запускайте через `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Як відкрити dashboard після онбордингу?">
    Майстер відкриває ваш браузер із чистим (без токена) URL dashboard одразу після онбордингу, а також друкує посилання в підсумку. Тримайте цю вкладку відкритою; якщо вона не відкрилася, скопіюйте та вставте надрукований URL на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати dashboard на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо система запитує автентифікацію через shared secret, вставте налаштований токен або пароль у параметри Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо shared secret ще не налаштовано, згенеруйте токен через `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште bind loopback, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставляння shared secret, за умови довіреного хоста gateway); HTTP API все одно вимагають автентифікації через shared secret, якщо ви навмисно не використовуєте private-ingress `none` або HTTP-автентифікацію trusted-proxy.
      Невдалі одночасні спроби Serve-автентифікації від того самого клієнта серіалізуються до того, як лімітер невдалих автентифікацій їх зафіксує, тому вже друга невдала спроба може показати `retry later`.
    - **Bind tailnet**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний shared secret у параметри dashboard.
    - **Identity-aware reverse proxy**: залиште Gateway за trusted proxy не на loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL proxy.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`. Автентифікація shared secret усе ще застосовується через тунель; якщо буде запит, вставте налаштований токен або пароль.

    Див. [Dashboard](/web/dashboard) і [Web surfaces](/web) для режимів bind і деталей автентифікації.

  </Accordion>

  <Accordion title="Чому є дві конфігурації затвердження exec для затверджень у чаті?">
    Вони керують різними шарами:

    - `approvals.exec`: пересилає запити на затвердження до чатів-призначень
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом затвердження для exec approvals

    Політика host exec залишається фактичним бар’єром затвердження. Конфігурація чату лише визначає,
    де з’являються запити на затвердження та як люди можуть на них відповідати.

    У більшості налаштувань вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди та відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначити тих, хто затверджує, OpenClaw тепер автоматично вмикає нативні затвердження DM-first, коли `channels.<channel>.execApprovals.enabled` не задано або дорівнює `"auto"`.
    - Коли доступні нативні картки/кнопки затвердження, цей нативний UI є основним шляхом; агент повинен включати ручну команду `/approve`, лише якщо результат інструмента каже, що затвердження в чаті недоступні або ручне затвердження — єдиний шлях.
    - Використовуйте `approvals.exec` лише тоді, коли запити також потрібно пересилати в інші чати чи окремі кімнати для ops.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише тоді, коли ви явно хочете, щоб запити на затвердження публікувалися назад у вихідну кімнату/тему.
    - Затвердження plugin — окрема історія: вони типово використовують `/approve` у тому самому чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі нативні канали залишають поверх цього нативну обробку plugin approvals.

    Коротко: пересилання — для маршрутизації, конфігурація нативного клієнта — для більш насиченого UX, специфічного для каналу.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке runtime мені потрібне?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендовано** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легковажний — у документації зазначено, що **512MB-1GB RAM**, **1 ядро** та приблизно **500MB**
    диска достатньо для особистого використання, а також зазначено, що **Raspberry Pi 4 може його запускати**.

    Якщо ви хочете трохи більше запасу (журнали, медіа, інші сервіси), **рекомендовано 2GB**,
    але це не жорсткий мінімум.

    Порада: невеликий Pi/VPS може розмістити Gateway, а ви можете спарити **nodes** на своєму ноутбуці/телефоні для
    локального screen/camera/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є якісь поради для встановлення на Raspberry Pi?">
    Коротко: працює, але очікуйте певних шорсткостей.

    - Використовуйте **64-bit** ОС і Node >= 22.
    - Віддавайте перевагу **змінному (git) встановленню**, щоб бачити журнали й швидко оновлюватися.
    - Починайте без channels/Skills, а потім додавайте їх по одному.
    - Якщо натрапите на дивні проблеми з бінарниками, зазвичай це проблема **ARM compatibility**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Застрягає на wake up my friend / онбординг не вилуплюється. Що робити?">
    Цей екран залежить від того, чи доступний Gateway і чи пройдено автентифікацію. TUI також надсилає
    "Wake up, my friend!" автоматично під час першого hatch. Якщо ви бачите цей рядок **без відповіді**
    і токени залишаються на 0, агент так і не запустився.

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

    3. Якщо все ще зависає, виконайте:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що tunnel/Tailscale-з’єднання активне і що UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести свій setup на нову машину (Mac mini), не проходячи онбординг заново?">
    Так. Скопіюйте **каталог стану** та **workspace**, а потім один раз запустіть Doctor. Це
    збереже вашого бота "точно таким самим" (пам’ять, історія сесій, автентифікація та стан
    каналу), якщо ви скопіюєте **обидва** розташування:

    1. Встановіть OpenClaw на нову машину.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте свій workspace (типово: `~/.openclaw/workspace`).
    4. Виконайте `openclaw doctor` і перезапустіть сервіс Gateway.

    Це збереже конфігурацію, auth profiles, облікові дані WhatsApp, сесії та пам’ять. Якщо ви працюєте в
    remote mode, пам’ятайте, що сховище сесій і workspace належать хосту gateway.

    **Важливо:** якщо ви лише комітите/пушите свій workspace до GitHub, ви зберігаєте
    **пам’ять + bootstrap-файли**, але **не** історію сесій чи автентифікацію. Вони зберігаються
    у `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Міграція](/uk/install/migrating), [Де що зберігається на диску](#де-що-зберігається-на-диску),
    [Workspace агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Remote mode](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи зверху. Якщо верхній розділ позначено як **Unreleased**, то наступний датований
    розділ — це остання випущена версія. Записи згруповані за **Highlights**, **Changes** і
    **Fixes** (а також документація/інші розділи за потреби).

  </Accordion>

  <Accordion title="Не вдається відкрити docs.openclaw.ai (помилка SSL)">
    Деякі з’єднання Comcast/Xfinity некоректно блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до allowlist, а потім спробуйте ще раз.
    Будь ласка, допоможіть нам розблокувати сайт, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо сайт усе одно недоступний, документація дзеркалиться на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай стабільний реліз спочатку потрапляє в **beta**, а потім окремий
    крок просування переміщує ту саму версію в `latest`. За потреби мейнтейнери також можуть
    публікувати одразу в `latest`. Саме тому beta і stable можуть
    вказувати на **одну й ту саму версію** після просування.

    Подивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди для встановлення та різницю між beta і dev див. в accordion нижче.

  </Accordion>

  <Accordion title="Як встановити beta-версію і яка різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (може збігатися з `latest` після просування).
    **Dev** — це рухома вершина `main` (git); під час публікації використовується npm dist-tag `dev`.

    Однорядкові команди (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Інсталятор для Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Детальніше: [Канали розробки](/uk/install/development-channels) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як спробувати найсвіжіші збірки?">
    Є два варіанти:

    1. **Канал dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемкне вас на гілку `main` і оновить із вихідного коду.

    2. **Змінне встановлення (з сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо вам зручніше вручну зробити чистий clone, використайте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Оновлення](/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай займають встановлення й онбординг?">
    Приблизно:

    - **Встановлення:** 2-5 хвилин
    - **Онбординг:** 5-15 хвилин залежно від того, скільки channels/models ви налаштовуєте

    Якщо процес зависає, скористайтеся [Інсталятор завис](#швидкий-старт-і-початкове-налаштування)
    і швидким циклом налагодження з [Я застряг](#швидкий-старт-і-початкове-налаштування).

  </Accordion>

  <Accordion title="Інсталятор завис? Як отримати більше зворотного зв’язку?">
    Повторно запустіть інсталятор з **докладним виводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Встановлення beta з докладним виводом:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Для змінного (git) встановлення:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Еквівалент для Windows (PowerShell):

    ```powershell
    # install.ps1 поки що не має окремого прапорця -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Більше варіантів: [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Під час встановлення на Windows з’являється git not found або openclaw not recognized">
    Дві поширені проблеми Windows:

    **1) помилка npm spawn git / git not found**

    - Встановіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, потім повторно запустіть інсталятор.

    **2) openclaw не розпізнається після встановлення**

    - Ваша глобальна папка npm bin відсутня в PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до PATH вашого користувача (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Після оновлення PATH закрийте й знову відкрийте PowerShell.

    Якщо ви хочете найзручніше налаштування на Windows, використовуйте **WSL2**, а не нативну Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="У Windows вивід exec показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність code page консолі в нативних оболонках Windows.

    Симптоми:

    - вивід `system.run`/`exec` показує китайський текст як mojibake
    - та сама команда в іншому профілі термінала виглядає нормально

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

    Якщо на останній версії OpenClaw проблема все ще відтворюється, відстежуйте/повідомляйте про неї тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використайте **змінне (git) встановлення**, щоб мати повний локальний код і документацію, а тоді запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг читати репозиторій і відповідати точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Детальніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтеся інструкції для Linux, а потім запустіть онбординг.

    - Швидкий шлях для Linux + встановлення сервісу: [Linux](/uk/platforms/linux).
    - Повний посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення й оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Встановіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Gateway remote](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де знаходяться інструкції зі встановлення в хмарі/VPS?">
    Ми підтримуємо **hosting hub** із поширеними провайдерами. Оберіть одного з них і дотримуйтеся посібника:

    - [VPS hosting](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви звертаєтеся до нього
    зі свого ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан + workspace
    живуть на сервері, тож ставтеся до хоста як до джерела істини і робіть резервні копії.

    Ви можете спарити **nodes** (Mac/iOS/Android/headless) із цим хмарним Gateway, щоб отримати доступ до
    локального screen/camera/canvas або запускати команди на своєму ноутбуці, водночас
    тримаючи Gateway у хмарі.

    Hub: [Платформи](/uk/platforms). Віддалений доступ: [Gateway remote](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити самого себе?">
    Коротка відповідь: **можливо, але не рекомендовано**. Потік оновлення може перезапустити
    Gateway (що обірве активну сесію), може вимагати чистого git checkout і
    може запитати підтвердження. Безпечніше: запускати оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо вам обов’язково потрібно автоматизувати це з агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Оновлення](/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить онбординг?">
    `openclaw onboard` — рекомендований шлях початкового налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/автентифікації** (OAuth провайдера, API-ключі, setup-token Anthropic, а також варіанти локальних моделей на кшталт LM Studio)
    - Розташування **workspace** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також bundled channel plugins на кшталт QQ Bot)
    - **Встановлення демона** (LaunchAgent на macOS; systemd user unit на Linux/WSL2)
    - **Перевірки справності** й вибір **Skills**

    Він також попереджає, якщо вашу налаштовану модель не розпізнано або для неї бракує автентифікації.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запустити?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **Anthropic API key**: звичайна оплата Anthropic API
    - **Автентифікація Claude CLI / підпискою Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw трактує використання `claude -p`
      як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів gateway Anthropic API-ключі все ще є більш
    передбачуваним варіантом. OpenAI Codex OAuth явно підтримується для зовнішніх
    інструментів на кшталт OpenClaw.

    OpenClaw також підтримує інші хостовані варіанти у стилі підписки, зокрема
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
    OpenClaw трактує автентифікацію через підписку Claude та використання `claude -p` як санкціоновані
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо ви хочете
    найбільш передбачуване серверне налаштування, використовуйте Anthropic API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тож OpenClaw трактує
    повторне використання Claude CLI і `claude -p` як санкціоновані для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Setup-token Anthropic усе ще доступний як підтримуваний шлях токена OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI та `claude -p`, коли це доступно.
    Для production або багатокористувацьких навантажень автентифікація через Anthropic API key усе ще є
    безпечнішим і передбачуванішим варіантом. Якщо вас цікавлять інші хостовані
    варіанти у стилі підписки в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
Це означає, що ваша **квота/ліміт швидкості Anthropic** вичерпана для поточного вікна. Якщо ви
використовуєте **Claude CLI**, дочекайтеся скидання вікна або оновіть свій тариф. Якщо ви
використовуєте **Anthropic API key**, перевірте Anthropic Console
на предмет використання/білінгу й за потреби підвищіть ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, запит намагається використати
    1M context beta від Anthropic (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані мають право на білінг довгого контексту (білінг API key або
    шлях входу OpenClaw через Claude з увімкненим Extra Usage).

    Порада: задайте **резервну модель**, щоб OpenClaw міг продовжувати відповідати, поки у провайдера діє rate limit.
    Див. [Моделі](/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має bundled-провайдер **Amazon Bedrock (Converse)**. Якщо присутні AWS env markers, OpenClaw може автоматично знайти потоковий/текстовий каталог Bedrock і об’єднати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати ручний запис провайдера. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний proxy перед Bedrock теж є цілком коректним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Під час онбордингу можна пройти OAuth-потік, і за потреби буде встановлено модель за замовчуванням `openai-codex/gpt-5.4`. Див. [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому ChatGPT GPT-5.4 не відкриває openai/gpt-5.4 в OpenClaw?">
    OpenClaw розглядає ці два шляхи окремо:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = прямий OpenAI Platform API

    В OpenClaw вхід через ChatGPT/Codex прив’язаний до шляху `openai-codex/*`,
    а не до прямого `openai/*`. Якщо ви хочете прямий API-шлях у
    OpenClaw, задайте `OPENAI_API_KEY` (або еквівалентну конфігурацію провайдера OpenAI).
    Якщо ви хочете вхід через ChatGPT/Codex у OpenClaw, використовуйте `openai-codex/*`.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    `openai-codex/*` використовує шлях Codex OAuth, а доступні вікна квоти
    керуються OpenAI й залежать від тарифу. На практиці ці ліміти можуть відрізнятися від
    досвіду на сайті/в застосунку ChatGPT, навіть якщо обидва прив’язані до одного облікового запису.

    OpenClaw може показувати поточні видимі вікна використання/квоти провайдера у
    `openclaw models status`, але не вигадує й не нормалізує права ChatGPT web
    у прямий доступ до API. Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform,
    використовуйте `openai/*` з API-ключем.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth через підписку OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання subscription OAuth у зовнішніх інструментах/робочих процесах
    на кшталт OpenClaw. Онбординг може провести цей OAuth-потік за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **plugin auth flow**, а не client id чи secret в `openclaw.json`.

    Кроки:

    1. Встановіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Модель за замовчуванням після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не працюють, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає OAuth-токени в auth profiles на хості gateway. Деталі: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; малі карти обрізають дані й пропускають витоки. Якщо все ж потрібно, запускайте **найбільшу** локальну збірку моделі, яку можете собі дозволити (LM Studio), і дивіться [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі підвищують ризик prompt injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як утримувати трафік до хостованої моделі в конкретному регіоні?">
    Обирайте endpoint-и, прив’язані до регіону. OpenRouter надає варіанти, розміщені в США, для MiniMax, Kimi і GLM; обирайте варіант, розміщений у США, щоб дані залишалися в регіоні. Ви все одно можете додати Anthropic/OpenAI поруч із ними, використавши `models.mode: "merge"`, щоб резервні маршрути залишалися доступними, водночас дотримуючись вибраного регіонального провайдера.
  </Accordion>

  <Accordion title="Чи обов’язково купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini — необов’язковий варіант:
    деякі люди купують його як постійно увімкнений хост, але невеликий VPS, домашній сервер або Raspberry Pi-клас пристрою теж підійде.

    Вам потрібен Mac лише **для інструментів, доступних тільки на macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти лише для macOS, запустіть Gateway на Mac або спаріть macOS node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Mac remote mode](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, увійшовший у Messages. Це **не обов’язково** має бути Mac mini —
    підійде будь-який Mac. Для iMessage **використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) — сервер BlueBubbles працює на macOS, тоді як Gateway може працювати на Linux або в іншому місці.

    Поширені сценарії:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac, що увійшов у Messages.
    - Запустіть усе на Mac, якщо хочете найпростіше налаштування на одній машині.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Mac remote mode](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи можу підключити його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключатися як
    **node** (додатковий пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, як-от screen/camera/canvas і `system.run` на цьому пристрої.

    Поширений шаблон:

    - Gateway на Mac mini (завжди увімкнений).
    - MacBook Pro запускає macOS app або node host і спарюється з Gateway.
    - Щоб побачити його, використовуйте `openclaw nodes status` / `openclaw nodes list`.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можна використовувати Bun?">
    Bun **не рекомендовано**. Ми бачимо помилки під час виконання, особливо з WhatsApp і Telegram.
    Для стабільних gateway використовуйте **Node**.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на неproduction gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що має бути в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не username бота.

    Під час онбордингу можна ввести `@username`, і система перетворить його на числовий ID, але авторизація OpenClaw використовує лише числові ID.

    Безпечніший спосіб (без стороннього бота):

    - Надішліть DM своєму боту, а потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Надішліть DM своєму боту, а потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватно):

    - Надішліть DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **multi-agent routing**. Прив’яжіть WhatsApp **DM** кожного відправника (peer `kind: "direct"`, sender E.164 на кшталт `+15551234567`) до різного `agentId`, щоб кожна людина мала свій workspace і сховище сесій. Відповіді все одно надходитимуть з **того самого облікового запису WhatsApp**, а контроль доступу до DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для цього облікового запису WhatsApp. Див. [Multi-Agent Routing](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента для "швидкого чату" і агента "Opus для кодування"?'>
    Так. Використовуйте multi-agent routing: призначте кожному агенту свою модель за замовчуванням, а потім прив’яжіть вхідні маршрути (обліковий запис провайдера або конкретних peers) до кожного агента. Приклад конфігурації є в [Multi-Agent Routing](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, знаходилися в оболонках без входу.
    Останні збірки також додають поширені user bin dirs у Linux systemd services (наприклад, `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, коли вони задані.

  </Accordion>

  <Accordion title="Різниця між змінним git-встановленням і npm install">
    - **Змінне (git) встановлення:** повний checkout вихідного коду, можна редагувати, найкраще для учасників.
      Ви локально запускаєте збірки й можете змінювати код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію "просто запустити".
      Оновлення приходять через npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm і git-встановленням?">
    Так. Встановіть інший варіант, а потім запустіть Doctor, щоб сервіс gateway вказував на нову entrypoint.
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

    Doctor виявляє невідповідність entrypoint сервісу gateway і пропонує переписати конфігурацію сервісу так, щоб вона відповідала поточному встановленню (використовуйте `--repair` в автоматизації).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#де-що-зберігається-на-диску).

  </Accordion>

  <Accordion title="Чи слід запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібен
    найменший тертя й вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Плюси:** немає витрат на сервер, прямий доступ до локальних файлів, живе вікно браузера.
    - **Мінуси:** сон/обриви мережі = розриви з’єднання, оновлення ОС/перезавантаження заважають, машина має не засинати.

    **VPS / хмара**

    - **Плюси:** завжди увімкнений, стабільна мережа, немає проблем із сном ноутбука, легше підтримувати роботу.
    - **Мінуси:** часто безголовий режим (використовуйте знімки екрана), лише віддалений доступ до файлів, для оновлень потрібен SSH.

    **Примітка, специфічна для OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord чудово працюють на VPS. Єдиний реальний компроміс — **headless browser** проти видимого вікна. Див. [Browser](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо у вас уже були розриви gateway. Локальний запуск чудовий, коли ви активно користуєтеся Mac і хочете локальний доступ до файлів або UI automation з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Не обов’язково, але **рекомендовано для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** завжди увімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, легше підтримувати роботу.
    - **Спільний ноутбук/десктоп:** цілком нормально для тестування й активного використання, але очікуйте пауз, коли машина засинає або оновлюється.

    Якщо ви хочете найкраще з обох світів, тримайте Gateway на виділеному хості й спаріть ноутбук як **node** для локальних screen/camera/exec-інструментів. Див. [Nodes](/uk/nodes).
    Для рекомендацій із безпеки читайте [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яку ОС рекомендовано?">
    OpenClaw легковажний. Для базового Gateway + одного каналу чату:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1-2 vCPU, 2GB RAM або більше для запасу (журнали, медіа, кілька каналів). Node tools і browser automation можуть бути ресурсоємними.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях встановлення для Linux там протестовано найкраще.

    Документація: [Linux](/uk/platforms/linux), [VPS hosting](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запустити OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди увімкненою, доступною та мати достатньо
    RAM для Gateway і всіх увімкнених каналів.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька каналів, browser automation чи media tools.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви на Windows, **WSL2 — найпростіший стиль налаштування VM** і з найкращою сумісністю
    інструментів. Див. [Windows](/uk/platforms/windows), [VPS hosting](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw в одному абзаці?">
    OpenClaw — це персональний AI-помічник, який ви запускаєте на власних пристроях. Він відповідає на тих поверхнях обміну повідомленнями, якими ви вже користуєтеся (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat і bundled channel plugins, як-от QQ Bot), а також може працювати з голосом + живим Canvas на підтримуваних платформах. **Gateway** — це завжди увімкнена control plane; помічник і є самим продуктом.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не "просто обгортка навколо Claude". Це **локальна control plane**, яка дає змогу запускати
    потужного помічника на **вашому власному обладнанні**, доступного з чат-застосунків, якими ви вже користуєтеся, зі
    станом, сесіями, пам’яттю та інструментами — без передавання контролю над вашими робочими процесами
    хостованому SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway де завгодно (Mac, Linux, VPS) і зберігайте
      workspace + історію сесій локально.
    - **Справжні канали, а не web-пісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      а також мобільний голос і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо з маршрутизацією
      та резервним перемиканням на рівні агента.
    - **Варіант лише локально:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо захочете.
    - **Multi-agent routing:** окремі агенти для каналу, облікового запису або завдання, кожен зі своїм
      workspace і налаштуваннями за замовчуванням.
    - **Open source і можливість змінювати:** перевіряйте, розширюйте та self-host без vendor lock-in.

    Документація: [Gateway](/uk/gateway), [Канали](/uk/channels), [Multi-agent](/uk/concepts/multi-agent),
    [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно це налаштував — що зробити спочатку?">
    Гарні перші проєкти:

    - Створити вебсайт (WordPress, Shopify або простий статичний сайт).
    - Прототипувати мобільний застосунок (план, екрани, план API).
    - Організувати файли й папки (очищення, назви, теги).
    - Підключити Gmail й автоматизувати підсумки або follow-up.

    Він може впоратися з великими завданнями, але найкраще працює, коли ви розбиваєте їх на фази й
    використовуєте sub agents для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найкращих щоденних сценаріїв використання OpenClaw?">
    Щоденні переваги зазвичай виглядають так:

    - **Персональні зведення:** підсумки inbox, календаря та новин, які вас цікавлять.
    - **Дослідження та чернетки:** швидке дослідження, підсумки й перші чернетки для листів або документів.
    - **Нагадування та follow-up:** підказки й чеклисти на основі cron або heartbeat.
    - **Browser automation:** заповнення форм, збір даних і повторення web-завдань.
    - **Координація між пристроями:** надішліть завдання з телефону, дозвольте Gateway виконати його на сервері та отримайте результат назад у чаті.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, рекламою та блогами для SaaS?">
    Так, для **дослідження, кваліфікації та підготовки чернеток**. Він може сканувати сайти, будувати shortlists,
    підсумовувати потенційних клієнтів і писати чернетки для outreach або рекламних текстів.

    Для **outreach або запуску реклами** тримайте людину в циклі. Уникайте спаму, дотримуйтесь місцевих законів і
    правил платформ, а також перевіряйте все перед відправленням. Найбезпечніша схема — дозволити
    OpenClaw створити чернетку, а вам — затвердити її.

    Документація: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для web-розробки?">
    OpenClaw — це **персональний помічник** і шар координації, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу кодування всередині репозиторію. Використовуйте OpenClaw, коли
    вам потрібні довготривала пам’ять, доступ з різних пристроїв та оркестрація інструментів.

    Переваги:

    - **Постійна пам’ять + workspace** між сесіями
    - **Доступ із багатьох платформ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (browser, файли, розклад, hooks)
    - **Завжди увімкнений Gateway** (запускайте на VPS, взаємодійте звідусіль)
    - **Nodes** для локального browser/screen/camera/exec

    Вітрина: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills і автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати Skills, не тримаючи репозиторій брудним?">
    Використовуйте керовані перевизначення замість редагування копії в репозиторії. Розмістіть зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, тож керовані перевизначення все одно мають пріоритет над bundled Skills, не торкаючись git. Якщо вам потрібно встановити skill глобально, але зробити його видимим лише для деяких агентів, тримайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` та `agents.list[].skills`. У репозиторії й у PR мають опинятися лише зміни, варті upstream.
  </Accordion>

  <Accordion title="Чи можна завантажувати Skills з власної папки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Пріоритет за замовчуванням: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` типово встановлює у `./skills`, які OpenClaw трактує як `<workspace>/skills` у наступній сесії. Якщо skill має бути видимий лише певним агентам, поєднайте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як використовувати різні моделі для різних завдань?">
    Сьогодні підтримуються такі шаблони:

    - **Cron jobs**: ізольовані завдання можуть задавати перевизначення `model` для кожного завдання.
    - **Sub-agents**: маршрутизуйте завдання до окремих агентів з різними моделями за замовчуванням.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб у будь-який момент перемкнути модель поточної сесії.

    Див. [Cron jobs](/uk/automation/cron-jobs), [Multi-Agent Routing](/uk/concepts/multi-agent) і [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як це вивантажити?">
    Використовуйте **sub-agents** для довгих або паралельних завдань. Sub-agents працюють у власній сесії,
    повертають підсумок і зберігають основний чат чутливим до відповіді.

    Попросіть бота "spawn a sub-agent for this task" або використайте `/subagents`.
    Використовуйте `/status` у чаті, щоб побачити, що Gateway робить зараз (і чи він зайнятий).

    Порада щодо токенів: довгі завдання і sub-agents обидва споживають токени. Якщо вас хвилює вартість, задайте
    дешевшу модель для sub-agents через `agents.defaults.subagents.model`.

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють прив’язані до thread сесії subagent на Discord?">
    Використовуйте прив’язки thread. Ви можете прив’язати thread Discord до subagent або цілі сесії, щоб наступні повідомлення в цьому thread залишалися у прив’язаній сесії.

    Базовий процес:

    - Створіть через `sessions_spawn` з `thread: true` (і за потреби `mode: "session"` для сталого follow-up).
    - Або вручну прив’яжіть через `/focus <target>`.
    - Використовуйте `/agents`, щоб перевірити стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати автоматичним unfocus.
    - Використовуйте `/unfocus`, щоб відв’язати thread.

    Потрібна конфігурація:

    - Глобальні значення за замовчуванням: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Перевизначення Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоприв’язка під час spawn: задайте `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Sub-agents](/uk/tools/subagents), [Discord](/uk/channels/discord), [Configuration Reference](/uk/gateway/configuration-reference), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent завершився, але оновлення про завершення пішло не туди або взагалі не опублікувалося. Що перевірити?">
    Спочатку перевірте визначений маршрут запитувача:

    - Доставка completion-mode subagent надає перевагу будь-якому прив’язаному thread або маршруту розмови, якщо він існує.
    - Якщо origin завершення містить лише канал, OpenClaw переходить до збереженого маршруту сесії запитувача (`lastChannel` / `lastTo` / `lastAccountId`), щоб пряма доставка все ще могла спрацювати.
    - Якщо немає ні прив’язаного маршруту, ні придатного збереженого маршруту, пряма доставка може зірватися, і результат потрапить у доставку через чергу сесії замість негайної публікації в чат.
    - Некоректні або застарілі цілі все ще можуть примусово переводити до fallback через чергу або до остаточного збою доставки.
    - Якщо остання видима відповідь помічника дитини — це точний тихий токен `NO_REPLY` / `no_reply` або рівно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує оголошення, замість того щоб публікувати застарілий попередній прогрес.
    - Якщо дочірній агент завершився за тайм-аутом після одних лише викликів інструментів, оголошення може згорнути це в короткий підсумок часткового прогресу замість відтворення сирого виводу інструментів.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks), [Session Tools](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron виконується всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані завдання не запускатимуться.

    Чеклист:

    - Переконайтеся, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не задано.
    - Переконайтеся, що Gateway працює 24/7 (без сну/перезапусків).
    - Перевірте налаштування часового поясу для завдання (`--tz` проти часового поясу хоста).

    Налагодження:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Cron спрацював, але нічого не було надіслано в канал. Чому?">
    Спочатку перевірте режим доставки:

    - `--no-deliver` / `delivery.mode: "none"` означає, що зовнішнє повідомлення не очікується.
    - Відсутня або недійсна announce target (`channel` / `to`) означає, що runner пропустив вихідну доставку.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що runner спробував доставити, але облікові дані заблокували це.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` лише) вважається навмисно недоставлюваним, тому runner також пригнічує доставку через queued fallback.

    Для ізольованих cron jobs саме runner відповідає за остаточну доставку. Від агента очікується
    звичайний текстовий підсумок, який runner надсилає. `--no-deliver` залишає
    цей результат внутрішнім; він не дозволяє агенту натомість відправляти напряму через
    message tool.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований запуск cron перемкнув моделі або один раз повторився?">
    Зазвичай це шлях live model-switch, а не дубльоване планування.

    Ізольований cron може зберегти runtime-передачу моделі й повторити спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повторна спроба зберігає
    перемкненого provider/model, і якщо перемикання містило нове перевизначення auth profile, cron
    теж зберігає його перед повторною спробою.

    Пов’язані правила вибору:

    - Спочатку переважає перевизначення моделі Gmail hook, якщо застосовується.
    - Потім `model` для кожного завдання.
    - Потім будь-яке збережене перевизначення моделі cron-session.
    - Потім звичайний вибір агента/моделі за замовчуванням.

    Цикл повторних спроб обмежений. Після початкової спроби плюс 2 повторів через перемикання
    cron припиняється замість нескінченного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Як встановити Skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або просто покладіть Skills у свій workspace. UI Skills для macOS недоступний на Linux.
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

    Нативний `openclaw skills install` записує у каталог `skills/`
    активного workspace. Встановлюйте окремий CLI `clawhub`, лише якщо хочете публікувати або
    синхронізувати власні Skills. Для спільних встановлень між агентами покладіть skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете звузити список агентів, які можуть його бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати завдання за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте scheduler Gateway:

    - **Cron jobs** для запланованих або повторюваних завдань (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок "main session".
    - **Ізольовані jobs** для автономних агентів, які публікують підсумки або доставляють у чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати Apple macOS-only Skills з Linux?">
    Не напряму. Skills для macOS обмежуються через `metadata.openclaw.os` плюс потрібні бінарники, і Skills з’являються в системному prompt лише тоді, коли вони придатні на **хості Gateway**. У Linux Skills тільки для `darwin` (наприклад, `apple-notes`, `apple-reminders`, `things-mac`) не завантажаться, якщо ви не перевизначите обмеження.

    У вас є три підтримувані шаблони:

    **Варіант A — запускати Gateway на Mac (найпростіше).**
    Запускайте Gateway там, де доступні бінарники macOS, а потім підключайтеся з Linux у [remote mode](#gateway-порти-вже-запущені-й-remote-mode) або через Tailscale. Skills завантажаться нормально, оскільки хост Gateway — це macOS.

    **Варіант B — використовувати macOS node (без SSH).**
    Запустіть Gateway на Linux, спаріть macOS node (menubar app) і встановіть **Node Run Commands** у "Always Ask" або "Always Allow" на Mac. OpenClaw може вважати macOS-only Skills придатними, якщо потрібні бінарники існують на node. Агент запускає ці Skills через інструмент `nodes`. Якщо вибрати "Always Ask", підтвердження "Always Allow" у prompt додає цю команду до allowlist.

    **Варіант C — проксувати бінарники macOS через SSH (для досвідчених).**
    Залиште Gateway на Linux, але зробіть так, щоб потрібні CLI-бінарники розв’язувалися у SSH-обгортки, які виконуються на Mac. Потім перевизначте skill, щоб дозволити Linux і зберегти його придатним.

    1. Створіть SSH-обгортку для бінарника (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Додайте обгортку в `PATH` на хості Linux (наприклад, `~/bin/memo`).
    3. Перевизначте metadata skill, щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Керування Apple Notes через CLI memo на macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Почніть нову сесію, щоб оновився знімок Skills.

  </Accordion>

  <Accordion title="У вас є інтеграція з Notion або HeyGen?">
    Наразі вбудованої немає.

    Варіанти:

    - **Власний skill / plugin:** найкраще для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Browser automation:** працює без коду, але повільніше й крихкіше.

    Якщо ви хочете зберігати контекст окремо для кожного клієнта (робочі процеси агенції), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + уподобання + активна робота).
    - Попросіть агента отримувати цю сторінку на початку сесії.

    Якщо вам потрібна нативна інтеграція, відкрийте запит на функцію або створіть skill,
    орієнтований на ці API.

    Встановлення Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні встановлення потрапляють у каталог `skills/` активного workspace. Для спільних Skills між агентами розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі агенти, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі Skills очікують бінарники, встановлені через Homebrew; на Linux це означає Linuxbrew (див. пункт FAQ про Homebrew на Linux вище). Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати вже наявний вхід у Chrome з OpenClaw?">
    Використовуйте вбудований browser profile `user`, який підключається через Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Якщо ви хочете власну назву, створіть явний MCP profile:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Цей шлях локальний для хоста. Якщо Gateway працює деінде, або запускайте node host на машині з браузером, або використовуйте remote CDP.

    Поточні обмеження `existing-session` / `user`:

    - дії керуються ref, а не CSS-selector
    - завантаження файлів потребують `ref` / `inputRef` і наразі підтримують лише один файл за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і batch actions усе ще потребують керованого браузера або сирого CDP profile

  </Accordion>
</AccordionGroup>

## Пісочниця і пам’ять

<AccordionGroup>
  <Accordion title="Чи є окремий документ про пісочницю?">
    Так. Див. [Sandboxing](/uk/gateway/sandboxing). Для налаштування, специфічного для Docker (повний gateway у Docker або образи пісочниці), див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повну функціональність?">
    Стандартний образ орієнтований на безпеку й запускається від користувача `node`, тому
    не містить системних пакетів, Homebrew або bundled browsers. Для повнішого налаштування:

    - Зберігайте `/home/node` через `OPENCLAW_HOME_VOLUME`, щоб кеші переживали перезапуски.
    - Вбудовуйте системні залежності в образ через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Встановлюйте браузери Playwright через bundled CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Задайте `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я зберегти DM приватними, а групи зробити публічними/ізольованими в пісочниці з одним агентом?">
    Так — якщо ваш приватний трафік — це **DM**, а публічний трафік — **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб сесії груп/каналів (ключі не main) запускалися в Docker, тоді як основна DM-сесія залишалася на хості. Потім обмежте інструменти, доступні в сесіях пісочниці, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Групи: особисті DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Ключова довідка з конфігурації: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив’язати папку хоста до пісочниці?">
    Задайте `agents.defaults.sandbox.docker.binds` як `["host:path:mode"]` (наприклад, `"/home/user/src:/src:ro"`). Глобальні прив’язки та прив’язки на рівні агента об’єднуються; прив’язки для агента ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для всього чутливого і пам’ятайте, що прив’язки обходять файлові межі пісочниці.

    OpenClaw перевіряє джерела bind і за нормалізованим шляхом, і за канонічним шляхом, отриманим через найглибший наявний батьківський каталог. Це означає, що виходи за межі через symlink-parent все одно закриваються безпечно, навіть коли останній сегмент шляху ще не існує, а перевірки дозволених коренів усе ще застосовуються після розв’язання symlink.

    Див. [Sandboxing](/uk/gateway/sandboxing#custom-bind-mounts) і [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) для прикладів і приміток щодо безпеки.

  </Accordion>

  <Accordion title="Як працює пам’ять?">
    Пам’ять OpenClaw — це просто Markdown-файли у workspace агента:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Кураторські довготривалі нотатки в `MEMORY.md` (лише для main/private sessions)

    OpenClaw також виконує **тихий flush пам’яті перед compaction**, щоб нагадати моделі
    записати довговічні нотатки перед auto-compaction. Це виконується лише тоді, коли workspace
    доступний на запис (пісочниці лише для читання це пропускають). Див. [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Пам’ять постійно все забуває. Як зробити так, щоб інформація зберігалася?">
    Попросіть бота **записати факт у пам’ять**. Довгострокові нотатки мають зберігатися в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це все ще зона, яку ми вдосконалюємо. Корисно нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона й далі забуває, перевірте, чи Gateway використовує той самий
    workspace під час кожного запуску.

    Документація: [Пам’ять](/uk/concepts/memory), [Workspace агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Чи зберігається пам’ять назавжди? Які є обмеження?">
    Файли пам’яті живуть на диску й зберігаються, доки ви їх не видалите. Обмеження — це ваше
    сховище, а не модель. **Контекст сесії** все одно обмежений контекстним
    вікном моделі, тож довгі розмови можуть стискатися або обрізатися. Саме тому
    існує пошук по пам’яті — він повертає в контекст лише релевантні частини.

    Документація: [Пам’ять](/uk/concepts/memory), [Контекст](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потрібен OpenAI API key для semantic memory search?">
    Лише якщо ви використовуєте **OpenAI embeddings**. Codex OAuth покриває chat/completions і
    **не** надає доступу до embeddings, тож **вхід через Codex (OAuth або
    вхід через Codex CLI)** не допомагає для semantic memory search. OpenAI embeddings
    усе ще потребують справжнього API key (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви не задаєте провайдера явно, OpenClaw автоматично обирає провайдера, коли
    може розв’язати API key (auth profiles, `models.providers.*.apiKey` або env vars).
    Він надає перевагу OpenAI, якщо розв’язується ключ OpenAI, інакше Gemini, якщо ключ Gemini
    розв’язується, потім Voyage, потім Mistral. Якщо жоден віддалений ключ недоступний, memory
    search залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштований і доступний
    шлях до локальної моделі, OpenClaw
    надає перевагу `local`. Ollama підтримується, якщо ви явно задасте
    `memorySearch.provider = "ollama"`.

    Якщо ви хочете залишитися локально, задайте `memorySearch.provider = "local"` (і за бажанням
    `memorySearch.fallback = "none"`). Якщо вам потрібні Gemini embeddings, задайте
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо embedding-моделі **OpenAI, Gemini, Voyage, Mistral, Ollama або local** —
    див. [Пам’ять](/uk/concepts/memory) для деталей налаштування.

  </Accordion>
</AccordionGroup>

## Де що зберігається на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, що використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** сесії, файли пам’яті, конфігурація та workspace живуть на хості Gateway
      (`~/.openclaw` + каталог вашого workspace).
    - **Віддалено за потреби:** повідомлення, які ви надсилаєте провайдерам моделей (Anthropic/OpenAI тощо), ідуть до
      їхніх API, а чат-платформи (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на своїх
      серверах.
    - **Ви контролюєте слід:** використання локальних моделей зберігає prompt на вашій машині, але
      трафік каналів усе одно проходить через сервери відповідного каналу.

    Пов’язане: [Workspace агента](/uk/concepts/agent-workspace), [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе живе під `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Шлях                                                            | Призначення                                                        |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основна конфігурація (JSON5)                                       |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Імпорт застарілого OAuth (копіюється в auth profiles при першому використанні) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, API keys і необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язкове файлове корисне навантаження secret для провайдерів `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Файл застарілої сумісності (статичні записи `api_key` очищено)     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдера (наприклад, `whatsapp/<accountId>/creds.json`)     |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан на рівні агента (agentDir + сесії)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і стан (на рівні агента)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані сесій (на рівні агента)                                   |

    Застарілий шлях для одного агента: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`).

    Ваш **workspace** (`AGENTS.md`, файли пам’яті, Skills тощо) відокремлений і налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають зберігатися AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли живуть у **workspace агента**, а не в `~/.openclaw`.

    - **Workspace (на рівні агента)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (або застарілий запасний `memory.md`, коли `MEMORY.md` відсутній),
      `memory/YYYY-MM-DD.md`, необов’язковий `HEARTBEAT.md`.
    - **Каталог стану (`~/.openclaw`)**: конфігурація, стан каналу/провайдера, auth profiles, сесії, журнали,
      і спільні Skills (`~/.openclaw/skills`).

    Workspace за замовчуванням — `~/.openclaw/workspace`, налаштовується через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот "забуває" після перезапуску, переконайтеся, що Gateway використовує той самий
    workspace під час кожного запуску (і пам’ятайте: remote mode використовує **workspace хоста gateway**,
    а не вашого локального ноутбука).

    Порада: якщо вам потрібна стійка поведінка або вподобання, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладатися на історію чату.

    Див. [Workspace агента](/uk/concepts/agent-workspace) і [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Розмістіть свій **workspace агента** у **приватному** git-репозиторії і робіть його резервні копії
    у приватному місці (наприклад, приватний GitHub). Це зберігає пам’ять + файли AGENTS/SOUL/USER
    і дає змогу відновити "свідомість" помічника пізніше.

    **Не** комітьте нічого з `~/.openclaw` (облікові дані, сесії, токени або зашифровані корисні навантаження секретів).
    Якщо вам потрібно повне відновлення, окремо резервуйте і workspace, і каталог стану
    (див. питання про міграцію вище).

    Документація: [Workspace агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окремий посібник: [Видалення](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть агенти працювати поза workspace?">
    Так. Workspace — це **робочий каталог cwd за замовчуванням** і якір пам’яті, а не жорстка пісочниця.
    Відносні шляхи розв’язуються всередині workspace, але абсолютні шляхи можуть звертатися до інших
    місць хоста, якщо пісочницю не ввімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування пісочниці на рівні агента. Якщо ви
    хочете, щоб репозиторій був робочим каталогом за замовчуванням, вкажіть
    `workspace` цього агента на корінь репозиторію. Репозиторій OpenClaw — це лише вихідний код; тримайте
    workspace окремо, якщо ви навмисно не хочете, щоб агент працював усередині нього.

    Приклад (репозиторій як cwd за замовчуванням):

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

  <Accordion title="Remote mode: де знаходиться сховище сесій?">
    Стан сесій належить **хосту gateway**. Якщо ви в remote mode, потрібне вам сховище сесій знаходиться на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи конфігурації

<AccordionGroup>
  <Accordion title="Який формат конфігурації? Де вона знаходиться?">
    OpenClaw читає необов’язкову конфігурацію **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються відносно безпечні значення за замовчуванням (зокрема workspace за замовчуванням `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я встановив gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Bind не на loopback **вимагає коректного шляху автентифікації gateway**. На практиці це означає:

    - автентифікація через shared secret: токен або пароль
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

    - `gateway.remote.token` / `.password` самі по собі **не** вмикають локальну автентифікацію gateway.
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як fallback лише тоді, коли `gateway.auth.*` не задано.
    - Для автентифікації паролем задайте `gateway.auth.mode: "password"` плюс `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і його не вдається розв’язати, розв’язання завершується в безпечний бік (без маскування fallback до remote).
    - Налаштування shared secret у Control UI автентифікуються через `connect.params.auth.token` або `connect.params.auth.password` (зберігається в налаштуваннях app/UI). Режими на основі ідентичності, як-от Tailscale Serve або `trusted-proxy`, натомість використовують заголовки запитів. Не додавайте shared secrets у URL.
    - За `gateway.auth.mode: "trusted-proxy"` навіть reverse proxy на loopback того ж хоста **не** задовольняють trusted-proxy auth. Trusted proxy має бути налаштованим джерелом не на loopback.

  </Accordion>

  <Accordion title="Чому тепер мені потрібен токен на localhost?">
    OpenClaw примусово вимагає автентифікацію gateway за замовчуванням, зокрема й на loopback. У звичайному шляху за замовчуванням це означає автентифікацію токеном: якщо явний шлях автентифікації не налаштовано, під час запуску gateway система переходить у режим токена й автоматично генерує його, зберігаючи в `gateway.auth.token`, тому **локальні WS-клієнти мають автентифікуватися**. Це блокує інші локальні процеси від виклику Gateway.

    Якщо ви надаєте перевагу іншому шляху автентифікації, можна явно вибрати режим пароля (або, для identity-aware reverse proxy не на loopback, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно задайте `gateway.auth.mode: "none"` у своїй конфігурації. Doctor може згенерувати токен у будь-який момент: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни конфігурації?">
    Gateway відстежує конфігурацію й підтримує hot-reload:

    - `gateway.reload.mode: "hybrid"` (типово): безпечні зміни застосовуються на льоту, критичні — через перезапуск
    - також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Як вимкнути кумедні tagline в CLI?">
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

    - `off`: приховує текст tagline, але залишає рядок назви/версії в banner.
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: циклічні кумедні/сезонні tagline (поведінка за замовчуванням).
    - Якщо ви взагалі не хочете banner, задайте env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути web search (і web fetch)?">
    `web_fetch` працює без API key. `web_search` залежить від обраного
    провайдера:

    - Провайдери на основі API, як-от Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, вимагають свого стандартного налаштування API key.
    - Ollama Web Search не потребує ключа, але використовує ваш налаштований хост Ollama і вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна інтеграція на основі HTML.
    - SearXNG не потребує ключа/self-hosted; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Рекомендовано:** запустіть `openclaw configure --section web` і оберіть провайдера.
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

    Конфігурація web-search для конкретного провайдера тепер живе під `plugins.entries.<plugin>.config.webSearch.*`.
    Застарілі шляхи провайдера `tools.web.search.*` тимчасово все ще завантажуються для сумісності, але їх не слід використовувати в нових конфігураціях.
    Конфігурація fallback для Firecrawl web-fetch живе під `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlist, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` увімкнено за замовчуванням (якщо його явно не вимкнено).
    - Якщо `tools.web.fetch.provider` пропущено, OpenClaw автоматично визначає першого готового fallback-провайдера для fetch за наявними обліковими даними. Наразі bundled-провайдер — Firecrawl.
    - Демони читають env vars з `~/.openclaw/.env` (або з середовища сервісу).

    Документація: [Web tools](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мою конфігурацію. Як відновитися і як цього уникнути?">
    `config.apply` замінює **всю конфігурацію**. Якщо ви надсилаєте частковий об’єкт, все
    інше буде видалено.

    Відновлення:

    - Відновіть із резервної копії (git або збережений `~/.openclaw/openclaw.json`).
    - Якщо резервної копії немає, повторно запустіть `openclaw doctor` і заново налаштуйте channels/models.
    - Якщо це сталося неочікувано, створіть bug report і додайте останню відому конфігурацію або будь-яку резервну копію.
    - Локальний агент для коду часто може відновити робочу конфігурацію з журналів або історії.

    Як уникнути:

    - Для невеликих змін використовуйте `openclaw config set`.
    - Для інтерактивного редагування використовуйте `openclaw configure`.
    - Якщо ви не впевнені щодо точного шляху або форми поля, спочатку використовуйте `config.schema.lookup`; він повертає неглибокий вузол схеми плюс короткі описи безпосередніх дочірніх елементів для подальшого заглиблення.
    - Для часткових редагувань RPC використовуйте `config.patch`; залишайте `config.apply` лише для повної заміни конфігурації.
    - Якщо ви використовуєте owner-only інструмент `gateway` з запуску агента, він усе одно відхилятиме записи в `tools.exec.ask` / `tools.exec.security` (зокрема застарілі псевдоніми `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими воркерами на різних пристроях?">
    Поширений шаблон — **один Gateway** (наприклад, Raspberry Pi) плюс **nodes** і **agents**:

    - **Gateway (центральний):** володіє channels (Signal/WhatsApp), маршрутизацією та сесіями.
    - **Nodes (пристрої):** Mac/iOS/Android підключаються як периферія і відкривають локальні інструменти (`system.run`, `canvas`, `camera`).
    - **Agents (воркери):** окремі "мізки"/workspace для спеціалізованих ролей (наприклад, "Hetzner ops", "Personal data").
    - **Sub-agents:** породжують фонову роботу з основного агента, коли потрібен паралелізм.
    - **TUI:** підключається до Gateway і перемикає агентів/сесії.

    Документація: [Nodes](/uk/nodes), [Віддалений доступ](/uk/gateway/remote), [Multi-Agent Routing](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Чи може браузер OpenClaw працювати в режимі headless?">
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

    Значення за замовчуванням — `false` (з видимим інтерфейсом). Режим headless частіше провокує anti-bot перевірки на деяких сайтах. Див. [Browser](/uk/tools/browser).

    Headless використовує **той самий рушій Chromium** і підходить для більшості сценаріїв автоматизації (форми, кліки, scraping, логіни). Основні відмінності:

    - Немає видимого вікна браузера (використовуйте скриншоти, якщо потрібна візуалізація).
    - Деякі сайти суворіше ставляться до автоматизації в режимі headless (CAPTCHA, anti-bot).
      Наприклад, X/Twitter часто блокує headless-сесії.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування браузером?">
    Задайте `browser.executablePath` для вашого бінарника Brave (або будь-якого іншого браузера на базі Chromium) і перезапустіть Gateway.
    Повні приклади конфігурації див. у [Browser](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway і nodes

<AccordionGroup>
  <Accordion title="Як команди проходять між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає агента
    і лише потім викликає nodes через **Gateway WebSocket**, коли потрібен node tool:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідний трафік провайдерів; вони отримують лише node RPC-виклики.

  </Accordion>

  <Accordion title="Як агент може отримати доступ до мого комп’ютера, якщо Gateway розміщено віддалено?">
    Коротка відповідь: **спаріть свій комп’ютер як node**. Gateway працює деінде, але може
    викликати `node.*` tools (screen, camera, system) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на постійно ввімкненому хості (VPS/домашній сервер).
    2. Додайте хост Gateway і свій комп’ютер до однієї tailnet.
    3. Переконайтеся, що Gateway WS доступний (bind tailnet або SSH tunnel).
    4. Локально відкрийте macOS app і підключіться в режимі **Remote over SSH** (або напряму через tailnet),
       щоб вона могла зареєструватися як node.
    5. Затвердьте node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP bridge не потрібен; nodes підключаються через Gateway WebSocket.

    Нагадування щодо безпеки: спарювання macOS node дозволяє `system.run` на цій машині. Спарюйте
    лише ті пристрої, яким довіряєте, і ознайомтеся з [Безпекою](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Протокол Gateway](/uk/gateway/protocol), [macOS remote mode](/uk/platforms/mac/remote), [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключено, але я не отримую відповідей. Що тепер?">
    Перевірте основу:

    - Gateway працює: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан каналів: `openclaw channels status`

    Потім перевірте автентифікацію та маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` налаштовано правильно.
    - Якщо ви підключаєтеся через SSH tunnel, переконайтеся, що локальний тунель активний і вказує на правильний порт.
    - Переконайтеся, що ваші allowlist (DM або група) містять ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Віддалений доступ](/uk/gateway/remote), [Канали](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два екземпляри OpenClaw спілкуватися один з одним (локальний + VPS)?">
    Так. Вбудованого "bot-to-bot" bridge немає, але це можна зібрати кількома
    надійними способами:

    **Найпростіше:** використайте звичайний чат-канал, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Bot A надішле повідомлення Bot B, а тоді Bot B відповість як завжди.

    **CLI bridge (загальний):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючись на чат, який слухає інший бот.
    Якщо один бот працює на віддаленому VPS, направте свій CLI на цей віддалений Gateway
    через SSH/Tailscale (див. [Віддалений доступ](/uk/gateway/remote)).

    Шаблон прикладу (запускайте з машини, яка може дістатися цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте запобіжник, щоб боти не зациклювалися нескінченно (лише згадки, channel
    allowlists або правило "не відповідати на повідомлення ботів").

    Документація: [Віддалений доступ](/uk/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох агентів?">
    Ні. Один Gateway може розміщувати кілька агентів, кожен зі своїм workspace, моделями за замовчуванням
    і маршрутизацією. Це нормальне налаштування, і воно значно дешевше й простіше, ніж запускати
    один VPS на агента.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні конфігурації, які ви не хочете спільно використовувати. В іншому разі залишайте один Gateway і
    використовуйте кілька агентів або sub-agents.

  </Accordion>

  <Accordion title="Чи є користь від використання node на моєму особистому ноутбуці замість SSH з VPS?">
    Так — nodes є основним способом доступу до вашого ноутбука з віддаленого Gateway, і вони
    відкривають більше, ніж просто shell-доступ. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким, тож поширений сценарій — це постійно ввімкнений хост плюс ваш ноутбук як node.

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до Gateway WebSocket і використовують спарювання пристроїв.
    - **Безпечніші механізми виконання.** `system.run` на цьому ноутбуці захищено allowlist/затвердженнями node.
    - **Більше інструментів пристрою.** Nodes відкривають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна browser automation.** Тримайте Gateway на VPS, але запускайте Chrome локально через node host на ноутбуці або під’єднуйтеся до локального Chrome на хості через Chrome MCP.

    SSH підходить для епізодичного shell-доступу, але nodes простіші для постійних робочих процесів агентів і
    автоматизації пристроїв.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають nodes сервіс gateway?">
    Ні. На хості має працювати лише **один gateway**, якщо ви навмисно не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)). Nodes — це периферія, яка підключається
    до gateway (nodes iOS/Android або macOS у "node mode" в menubar app). Для headless node
    hosts і керування через CLI див. [Node host CLI](/cli/node).

    Повний перезапуск потрібен для змін `gateway`, `discovery` і `canvasHost`.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати конфігурацію?">
    Так.

    - `config.schema.lookup`: перевірити одне піддерево конфігурації разом із його неглибоким вузлом схеми, відповідною підказкою UI та короткими описами безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний snapshot + hash
    - `config.patch`: безпечне часткове оновлення (бажаний варіант для більшості RPC-редагувань); виконує hot-reload, коли можливо, і перезапуск, коли потрібно
    - `config.apply`: перевіряє й замінює повну конфігурацію; виконує hot-reload, коли можливо, і перезапуск, коли потрібно
    - owner-only runtime tool `gateway` усе ще відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

  </Accordion>

  <Accordion title="Мінімальна осмислена конфігурація для першого встановлення">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Це задає ваш workspace й обмежує, хто може запускати бота.

  </Accordion>

  <Accordion title="Як налаштувати Tailscale на VPS і підключитися з Mac?">
    Мінімальні кроки:

    1. **Встановіть і увійдіть на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Встановіть і увійдіть на Mac**
       - Використайте app Tailscale і увійдіть у ту саму tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - У консолі адміністратора Tailscale увімкніть MagicDNS, щоб VPS мав стабільну назву.
    4. **Використовуйте hostname tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо ви хочете Control UI без SSH, використовуйте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це залишає gateway прив’язаним до loopback і відкриває HTTPS через Tailscale. Див. [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="Як підключити Mac node до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Control UI + WS для Gateway**. Nodes підключаються через той самий endpoint Gateway WS.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS і Mac у тій самій tailnet**.
    2. **Використовуйте macOS app у Remote mode** (SSH target може бути hostname tailnet).
       App створить тунель порту Gateway і підключиться як node.
    3. **Затвердьте node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Протокол Gateway](/uk/gateway/protocol), [Discovery](/uk/gateway/discovery), [macOS remote mode](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи слід встановлювати на другий ноутбук, чи достатньо просто додати node?">
    Якщо вам потрібні лише **локальні інструменти** (screen/camera/exec) на другому ноутбуці, додайте його як
    **node**. Це дозволяє зберегти один Gateway і уникнути дублювання конфігурації. Локальні node tools
    наразі доступні лише на macOS, але ми плануємо поширити їх і на інші ОС.

    Встановлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes), [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars і завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує environment variables?">
    OpenClaw читає env vars із батьківського процесу (shell, launchd/systemd, CI тощо), а також додатково завантажує:

    - `.env` з поточного робочого каталогу
    - глобальний fallback `.env` з `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден із файлів `.env` не перевизначає вже наявні env vars.

    Ви також можете визначати inline env vars у конфігурації (застосовуються лише якщо відсутні в env процесу):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Див. [/environment](/uk/help/environment) для повного порядку пріоритетів і джерел.

  </Accordion>

  <Accordion title="Я запустив Gateway через сервіс, і мої env vars зникли. Що робити?">
    Два поширені варіанти виправлення:

    1. Помістіть відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися, навіть коли сервіс не успадковує env вашої shell.
    2. Увімкніть імпорт shell (необов’язкова зручність):

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

    Це запускає вашу login shell і імпортує лише відсутні очікувані ключі (ніколи не перевизначає). Еквіваленти env vars:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Я встановив COPILOT_GITHUB_TOKEN, але models status показує "Shell env: off." Чому?'>
    `openclaw models status` повідомляє, чи увімкнено **імпорт env із shell**. "Shell env: off"
    **не** означає, що ваших env vars немає — це лише означає, що OpenClaw не завантажуватиме
    вашу login shell автоматично.

    Якщо Gateway працює як сервіс (launchd/systemd), він не успадковує ваше shell-
    середовище. Виправлення — одне з таких:

    1. Помістіть токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або увімкніть імпорт shell (`env.shellEnv.enabled: true`).
    3. Або додайте його до блоку `env` у конфігурації (застосовується лише якщо відсутній).

    Потім перезапустіть gateway і перевірте знову:

    ```bash
    openclaw models status
    ```

    Токени Copilot читаються з `COPILOT_GITHUB_TOKEN` (також `GH_TOKEN` / `GITHUB_TOKEN`).
    Див. [/concepts/model-providers](/uk/concepts/model-providers) і [/environment](/uk/help/environment).

  </Accordion>
</AccordionGroup>

## Сесії і кілька чатів

<AccordionGroup>
  <Accordion title="Як почати нову розмову?">
    Надішліть `/new` або `/reset` як окреме повідомлення. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>

  <Accordion title="Чи скидаються сесії автоматично, якщо я ніколи не надсилаю /new?">
    Термін дії сесій може завершуватися після `session.idleMinutes`, але це **вимкнено за замовчуванням** (типове значення **0**).
    Задайте додатне значення, щоб увімкнути завершення за неактивністю. Коли це ввімкнено, **наступне**
    повідомлення після періоду неактивності починає новий session id для цього ключа чату.
    Це не видаляє транскрипти — просто починає нову сесію.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб створити команду з екземплярів OpenClaw (один CEO і багато агентів)?">
    Так, через **multi-agent routing** і **sub-agents**. Ви можете створити одного координатора
    і кількох агентів-воркерів зі своїми workspace і моделями.

    Водночас це краще сприймати як **цікавий експеримент**. Він витрачає багато токенів і часто
    менш ефективний, ніж використання одного бота з окремими сесіями. Типова модель, яку ми
    уявляємо, — це один бот, з яким ви спілкуєтеся, і різні сесії для паралельної роботи. Цей
    бот також може за потреби породжувати sub-agents.

    Документація: [Multi-agent routing](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст обрізався посеред завдання? Як цьому запобігти?">
    Контекст сесії обмежений вікном моделі. Довгі чати, великі виводи інструментів або багато
    файлів можуть запускати compaction або truncation.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими завданнями, а `/new` — під час зміни теми.
    - Тримайте важливий контекст у workspace і просіть бота знову його прочитати.
    - Використовуйте sub-agents для довгих або паралельних завдань, щоб основний чат залишався меншим.
    - Оберіть модель із більшим контекстним вікном, якщо це трапляється часто.

  </Accordion>

  <Accordion title="Як повністю скинути OpenClaw, але залишити його встановленим?">
    Використовуйте команду скидання:

    ```bash
    openclaw reset
    ```

    Повне неінтерактивне скидання:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Потім знову запустіть налаштування:

    ```bash
    openclaw onboard --install-daemon
    ```

    Примітки:

    - Онбординг також пропонує **Reset**, якщо бачить наявну конфігурацію. Див. [Онбординг (CLI)](/uk/start/wizard).
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скидайте кожен каталог стану (типові — `~/.openclaw-<profile>`).
    - Dev-скидання: `openclaw gateway --dev --reset` (лише для dev; стирає dev-конфігурацію + облікові дані + сесії + workspace).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або стиснути?'>
    Використайте один із цих варіантів:

    - **Стиснення** (зберігає розмову, але підсумовує старіші ходи):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб підказати, як робити підсумок.

    - **Скидання** (новий session ID для того самого chat key):

      ```
      /new
      /reset
      ```

    Якщо це продовжує траплятися:

    - Увімкніть або налаштуйте **обрізання сесій** (`agents.defaults.contextPruning`), щоб скорочувати старий вивід інструментів.
    - Використовуйте модель із більшим контекстним вікном.

    Документація: [Compaction](/uk/concepts/compaction), [Обрізання сесій](/uk/concepts/session-pruning), [Керування сесіями](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка перевірки провайдера: модель видала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що історія сесії застаріла або пошкоджена (часто після довгих threads
    або зміни tool/schema).

    Виправлення: почніть нову сесію з `/new` (окреме повідомлення).

  </Accordion>

  <Accordion title="Чому я отримую heartbeat-повідомлення кожні 30 хвилин?">
    Heartbeat запускається кожні **30m** за замовчуванням (**1h** при використанні OAuth auth). Налаштуйте або вимкніть:

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

    Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та markdown-
    заголовки на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб заощадити API-виклики.
    Якщо файл відсутній, heartbeat усе одно виконується, а модель сама вирішує, що робити.

    Перевизначення на рівні агента використовують `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "bot account" до групи WhatsApp?'>
    Ні. OpenClaw працює від **вашого власного облікового запису**, тому якщо ви є в групі, OpenClaw може її бачити.
    За замовчуванням групові відповіді заблоковані, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

    Якщо ви хочете, щоб лише **ви** могли запускати групові відповіді:

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
    Варіант 1 (найшвидший): перегляньте журнали й надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Знайдіть `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/додано в allowlist): перелічіть групи з конфігурації:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/cli/directory), [Журнали](/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Дві поширені причини:

    - Увімкнено gating за згадкою (типово). Ви маєте @згадати бота (або відповідати `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і групу не внесено до allowlist.

    Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи діляться групи/threads контекстом з DM?">
    Прямі чати за замовчуванням згортаються до основної сесії. Групи/канали мають власні ключі сесій, а теми Telegram / threads Discord — це окремі сесії. Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки workspace і агентів я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — нормально, але звертайте увагу на:

    - **Зростання диска:** сесії + транскрипти зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.
    - **Витрати токенів:** більше агентів означає більше одночасного використання моделей.
    - **Операційні накладні витрати:** auth profiles, workspace і channel routing на рівні агента.

    Поради:

    - Тримайте один **активний** workspace на агента (`agents.defaults.workspace`).
    - Обрізайте старі сесії (видаляйте JSONL або записи сховища), якщо диск розростається.
    - Використовуйте `openclaw doctor`, щоб виявляти stray workspace і невідповідності профілів.

  </Accordion>

  <Accordion title="Чи можу я одночасно запускати кілька ботів або чатів (Slack), і як це краще налаштувати?">