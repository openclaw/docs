---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час роботи системи
    - Сортування проблем, про які повідомили користувачі, перед глибшим налагодженням
summary: Поширені запитання про налаштування, конфігурацію та використання OpenClaw
title: Поширені запитання
x-i18n:
    generated_at: "2026-04-23T15:44:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 467e12fb93f778c544899e0c3a3837b84cff423f629db187e8be6e94627771c1
    source_path: help/faq.md
    workflow: 15
---

# Поширені запитання

Швидкі відповіді плюс глибше усунення несправностей для реальних сценаріїв налаштування (локальна розробка, VPS, multi-agent, OAuth/API keys, перемикання моделей у разі збою). Для діагностики під час роботи див. [Усунення несправностей](/uk/gateway/troubleshooting). Повний довідник із конфігурації див. у [Конфігурації](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламалося

1. **Швидкий стан (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидке локальне зведення: ОС + оновлення, доступність gateway/service, agents/sessions, конфігурація провайдерів + проблеми під час роботи (коли Gateway доступний).

2. **Звіт, який можна вставити (безпечний для поширення)**

   ```bash
   openclaw status --all
   ```

   Діагностика в режимі лише читання з хвостом логів (токени приховано).

3. **Стан daemon + port**

   ```bash
   openclaw gateway status
   ```

   Показує стан supervisor під час роботи порівняно з доступністю RPC, URL цілі перевірки та яку конфігурацію, ймовірно, використала служба.

4. **Глибокі перевірки**

   ```bash
   openclaw status --deep
   ```

   Запускає живу перевірку стану Gateway, зокрема перевірки каналів, коли це підтримується
   (потрібен доступний Gateway). Див. [Health](/uk/gateway/health).

5. **Показати останній лог**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використайте запасний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові логи відокремлені від логів служби; див. [Logging](/uk/logging) і [Усунення несправностей](/uk/gateway/troubleshooting).

6. **Запустити doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує config/state + запускає перевірки стану. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # показує URL цілі + шлях до config у разі помилок
   ```

   Запитує у запущеного Gateway повний знімок (лише WS). Див. [Health](/uk/gateway/health).

## Швидкий старт і налаштування першого запуску

<AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб вибратися">
    Використайте локальний AI agent, який може **бачити вашу машину**. Це значно ефективніше, ніж питати
    в Discord, тому що більшість випадків "я застряг" — це **локальні проблеми конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти логи та допомагати виправляти
    налаштування на рівні машини (PATH, служби, дозволи, auth-файли). Надайте їм **повний checkout вихідного коду**
    через hackable (git) встановлення:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **із git checkout**, тож agent може читати код + документацію
    й аналізувати точну версію, яку ви запускаєте. Ви завжди можете пізніше повернутися до стабільної версії,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть agent **спланувати й контролювати** виправлення (крок за кроком), а потім виконати лише
    необхідні команди. Це робить зміни меншими та полегшує аудит.

    Якщо ви виявите справжню помилку або виправлення, будь ласка, створіть issue на GitHub або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (діліться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану gateway/agent + базової конфігурації.
    - `openclaw models status`: перевіряє auth провайдерів + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє типові проблеми config/state.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламалося](#перші-60-секунд-якщо-щось-зламалося).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску Heartbeat:

    - `quiet-hours`: поза налаштованим вікном active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожню/лише-заголовок заготовку
    - `no-tasks-due`: режим завдань `HEARTBEAT.md` активний, але жоден з інтервалів завдань ще не настав
    - `alerts-disabled`: усю видимість heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові позначки настання оновлюються лише після завершення
    справжнього запуску heartbeat. Пропущені запуски не позначають завдання як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановлення та налаштування OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати UI assets. Після onboarding ви зазвичай запускаєте Gateway на порту **18789**.

    Із вихідного коду (contributors/dev):

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
    Майстер відкриває браузер із чистим (без токена) URL dashboard одразу після onboarding, а також друкує посилання у підсумку. Залиште цю вкладку відкритою; якщо вона не запустилася, скопіюйте й вставте надрукований URL на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати dashboard на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується автентифікація за спільним секретом, вставте налаштований токен або пароль у налаштуваннях Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо спільний секрет ще не налаштовано, згенеруйте токен командою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште bind loopback, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` дорівнює `true`, заголовки ідентифікації задовольняють автентифікацію Control UI/WebSocket (без вставлення спільного секрету, за умови довіреного хоста Gateway); HTTP API, як і раніше, вимагають автентифікації спільним секретом, якщо ви свідомо не використовуєте private-ingress `none` або HTTP-автентифікацію trusted-proxy.
      Некоректні одночасні спроби автентифікації Serve від того самого клієнта серіалізуються до того, як обмежувач невдалої автентифікації їх зафіксує, тож другий невдалий повтор уже може показати `retry later`.
    - **Прив’язка tailnet**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний спільний секрет у налаштуваннях dashboard.
    - **Зворотний proxy з awareness ідентичності**: тримайте Gateway за trusted proxy не-loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL proxy.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`. Автентифікація спільним секретом усе ще застосовується через tunnel; вставте налаштований токен або пароль, якщо буде запит.

    Див. [Dashboard](/uk/web/dashboard) і [Web surfaces](/uk/web) для деталей режимів bind та автентифікації.

  </Accordion>

  <Accordion title="Чому існують дві конфігурації схвалення exec для схвалень у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на схвалення до чат-призначень
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом схвалення для exec approvals

    Політика host exec як і раніше є справжнім шлюзом схвалення. Конфігурація чату лише визначає, де з’являються
    запити на схвалення та як люди можуть на них відповідати.

    У більшості налаштувань вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди та відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначати тих, хто схвалює, OpenClaw тепер автоматично вмикає нативні схвалення DM-first, коли `channels.<channel>.execApprovals.enabled` не задано або дорівнює `"auto"`.
    - Коли доступні нативні картки/кнопки схвалення, цей нативний UI є основним шляхом; agent має включати ручну команду `/approve` лише якщо результат інструмента каже, що схвалення в чаті недоступні або ручне схвалення — єдиний шлях.
    - Використовуйте `approvals.exec` лише тоді, коли запити також потрібно пересилати в інші чати або явні ops-кімнати.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише коли ви явно хочете, щоб запити на схвалення поверталися до початкової кімнати/теми.
    - Схвалення Plugin — це ще окремий випадок: вони типово використовують `/approve` у тому самому чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі нативні канали додатково зберігають нативну обробку plugin-схвалень.

    Коротко: пересилання — для маршрутизації, конфігурація нативного клієнта — для багатшого UX, специфічного для каналу.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке runtime мені потрібне?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендовано** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway є легким — у документації вказано, що для особистого використання достатньо **512MB-1GB RAM**, **1 core** і приблизно **500MB**
    диска, а також зазначено, що **Raspberry Pi 4 може його запускати**.

    Якщо вам потрібен додатковий запас (логи, медіа, інші служби), **рекомендовано 2GB**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може розміщувати Gateway, а ви можете під’єднати **nodes** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради щодо встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте шорстких кутів.

    - Використовуйте **64-bit** ОС і підтримуйте Node >= 22.
    - Віддавайте перевагу **hackable (git) install**, щоб мати доступ до логів і швидко оновлюватися.
    - Починайте без channels/Skills, а потім додавайте їх по одному.
    - Якщо натрапите на дивні проблеми з бінарними файлами, зазвичай це проблема **сумісності ARM**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Застрягає на wake up my friend / onboarding не запускається. Що робити?">
    Цей екран залежить від того, чи доступний Gateway і чи пройдена автентифікація. TUI також надсилає
    "Wake up, my friend!" автоматично під час першого hatch. Якщо ви бачите цей рядок і **немає відповіді**,
    а токени залишаються на 0, agent так і не запустився.

    1. Перезапустіть Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Перевірте стан + auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Якщо все одно зависає, виконайте:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що tunnel/Tailscale-з’єднання працює і що UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini) без повторного onboarding?">
    Так. Скопіюйте **каталог стану** і **робочий простір**, а потім один раз запустіть Doctor. Це
    збереже вашого бота **точно таким самим** (memory, історія сесій, auth і стан
    каналів), якщо ви скопіюєте **обидва** місця:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте ваш робочий простір (типово: `~/.openclaw/workspace`).
    4. Виконайте `openclaw doctor` і перезапустіть службу Gateway.

    Це зберігає config, профілі auth, облікові дані WhatsApp, сесії та memory. Якщо ви в
    remote mode, пам’ятайте, що хост gateway володіє сховищем сесій і робочим простором.

    **Важливо:** якщо ви лише commit/push свій робочий простір на GitHub, ви робите резервну
    копію **memory + bootstrap-файлів**, але **не** історії сесій чи auth. Вони зберігаються
    в `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Міграція](/uk/install/migrating), [Де що зберігається на диску](#where-things-live-on-disk),
    [Робочий простір agent](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Remote mode](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перегляньте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи розміщені вгорі. Якщо верхній розділ позначено як **Unreleased**, наступний датований
    розділ — це остання випущена версія. Записи згруповано за **Highlights**, **Changes** і
    **Fixes** (а також розділами документації/іншими розділами за потреби).

  </Accordion>

  <Accordion title="Не вдається отримати доступ до docs.openclaw.ai (помилка SSL)">
    Деякі з’єднання Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до allowlist, а потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати сайт, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дзеркально доступна на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **dist-tag npm**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай стабільний реліз спочатку потрапляє в **beta**, а потім явний
    крок просування переносить цю саму версію в `latest`. За потреби супровідники також можуть
    публікувати одразу в `latest`. Саме тому beta і stable можуть
    вказувати на **одну й ту саму версію** після просування.

    Подивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди для встановлення та різницю між beta і dev див. в акордеоні нижче.

  </Accordion>

  <Accordion title="Як встановити beta-версію і в чому різниця між beta та dev?">
    **Beta** — це dist-tag npm `beta` (може збігатися з `latest` після просування).
    **Dev** — це рухома вершина `main` (git); під час публікації вона використовує dist-tag npm `dev`.

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

  <Accordion title="Як спробувати найсвіжіші збірки?">
    Є два варіанти:

    1. **Dev channel (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає на гілку `main` і оновлює з вихідного коду.

    2. **Hackable install (із сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає вам локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо вам більше подобається вручну зробити чистий clone, використайте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Оновлення](/uk/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай триває встановлення та onboarding?">
    Приблизний орієнтир:

    - **Встановлення:** 2-5 хвилин
    - **Onboarding:** 5-15 хвилин залежно від того, скільки каналів/моделей ви налаштовуєте

    Якщо процес зависає, скористайтеся [Інсталятор завис?](#quick-start-and-first-run-setup)
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
    # install.ps1 поки що не має окремого прапорця -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Більше варіантів: [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Під час встановлення у Windows пише git not found або openclaw not recognized">
    Дві поширені проблеми у Windows:

    **1) npm error spawn git / git not found**

    - Встановіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, а потім повторно запустіть інсталятор.

    **2) openclaw is not recognized after install**

    - Ваша глобальна папка bin npm відсутня в PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до PATH користувача (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо вам потрібне максимально гладке налаштування Windows, використовуйте **WSL2** замість нативної Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="У Windows вивід exec показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність кодової сторінки консолі в нативних оболонках Windows.

    Симптоми:

    - вивід `system.run`/`exec` показує китайський текст як mojibake
    - та сама команда виглядає нормально в іншому профілі термінала

    Швидке обхідне рішення в PowerShell:

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

    Якщо ви все ще відтворюєте це в останній версії OpenClaw, відстежуйте/повідомте про це тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використайте **hackable (git) install**, щоб мати локально повний вихідний код і документацію, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг читати репозиторій і відповідати точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтеся інструкції для Linux, а потім запустіть onboarding.

    - Швидкий шлях для Linux + встановлення служби: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення та оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Встановіть систему на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де знайти посібники зі встановлення в хмарі/VPS?">
    У нас є **хаб хостингу** з поширеними провайдерами. Виберіть один і дотримуйтеся інструкції:

    - [VPS hosting](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте до нього доступ
    з ноутбука/телефона через Control UI (або Tailscale/SSH). Ваші state + workspace
    зберігаються на сервері, тож ставтеся до хоста як до джерела істини та створюйте його резервні копії.

    Ви можете під’єднати **nodes** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримати доступ
    до локального екрана/камери/canvas або запускати команди на ноутбуці, залишаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити себе самостійно?">
    Коротка відповідь: **можливо, але не рекомендовано**. Під час оновлення може перезапускатися
    Gateway (що розриває активну сесію), може знадобитися чистий git checkout, а також
    може з’явитися запит на підтвердження. Безпечніше запускати оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо вам усе ж потрібно автоматизувати це через agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Оновлення](/uk/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить onboarding?">
    `openclaw onboard` — це рекомендований шлях налаштування. У **local mode** він проводить вас через:

    - **Налаштування моделі/auth** (OAuth провайдера, API keys, Anthropic setup-token, а також варіанти локальних моделей, як-от LM Studio)
    - розташування **робочого простору** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані channel plugins, як-от QQ Bot)
    - **Встановлення daemon** (LaunchAgent на macOS; systemd user unit на Linux/WSL2)
    - **Перевірки стану** та вибір **Skills**

    Він також попереджає, якщо налаштована модель невідома або для неї бракує auth.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запустити?">
    Ні. Ви можете запускати OpenClaw з **API keys** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації в цих провайдерах.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **Anthropic API key**: звичайна оплата Anthropic API
    - **Claude CLI / auth через підписку Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw розглядає використання `claude -p`
      як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів gateway ключі Anthropic API усе ще залишаються більш
    передбачуваним варіантом налаштування. OAuth OpenAI Codex явно підтримується для зовнішніх
    інструментів, таких як OpenClaw.

    OpenClaw також підтримує інші розміщені варіанти в стилі підписки, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [GLM Models](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API key?">
    Так.

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тож
    OpenClaw вважає auth через підписку Claude та використання `claude -p` санкціонованими
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо вам потрібне
    найпередбачуваніше серверне налаштування, замість цього використовуйте ключ Anthropic API.

  </Accordion>

  <Accordion title="Чи підтримуєте ви auth через підписку Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тому OpenClaw вважає
    повторне використання Claude CLI та використання `claude -p` санкціонованими для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Anthropic setup-token як і раніше доступний як підтримуваний шлях токена в OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI та `claude -p`, коли це доступно.
    Для production або multi-user навантажень auth через ключ Anthropic API все ще є
    безпечнішим і передбачуванішим вибором. Якщо вам потрібні інші розміщені
    варіанти в стилі підписки в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
Це означає, що ваша **квота/ліміт запитів Anthropic** вичерпана для поточного вікна. Якщо ви
використовуєте **Claude CLI**, зачекайте, доки вікно не скинеться, або оновіть свій план. Якщо ви
використовуєте **ключ Anthropic API**, перевірте Anthropic Console
щодо використання/білінгу та за потреби підвищте ліміти.

    Якщо повідомлення має такий вигляд:
    `Extra usage is required for long context requests`, запит намагається використати
    бета-функцію Anthropic з контекстом 1M (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані підходять для білінгу довгого контексту (білінг API key або
    шлях входу Claude в OpenClaw з увімкненим Extra Usage).

    Порада: встановіть **резервну модель**, щоб OpenClaw міг продовжувати відповідати, коли провайдер упирається в rate limit.
    Див. [Models](/uk/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудований провайдер **Amazon Bedrock (Converse)**. За наявності маркерів env AWS OpenClaw може автоматично виявляти каталог Bedrock для streaming/text і об’єднувати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис провайдера вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний proxy перед Bedrock також залишається коректним варіантом.
  </Accordion>

  <Accordion title="Як працює auth Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Onboarding може запустити OAuth-потік і за потреби встановить модель за замовчуванням `openai-codex/gpt-5.4`. Див. [Провайдери моделей](/uk/concepts/model-providers) і [Onboarding (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому ChatGPT GPT-5.4 не відкриває openai/gpt-5.4 в OpenClaw?">
    OpenClaw розглядає ці два маршрути окремо:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = прямий API OpenAI Platform

    В OpenClaw вхід ChatGPT/Codex прив’язаний до маршруту `openai-codex/*`,
    а не до прямого маршруту `openai/*`. Якщо вам потрібен прямий шлях API в
    OpenClaw, задайте `OPENAI_API_KEY` (або еквівалентну конфігурацію провайдера OpenAI).
    Якщо вам потрібен вхід ChatGPT/Codex в OpenClaw, використовуйте `openai-codex/*`.

  </Accordion>

  <Accordion title="Чому ліміти OAuth Codex можуть відрізнятися від ChatGPT web?">
    `openai-codex/*` використовує маршрут OAuth Codex, а його доступні вікна квот
    керуються OpenAI та залежать від плану. На практиці ці ліміти можуть відрізнятися від
    досвіду використання на сайті/в застосунку ChatGPT, навіть коли обидва прив’язані до одного облікового запису.

    OpenClaw може показати поточні видимі вікна використання/квоти провайдера в
    `openclaw models status`, але не вигадує і не нормалізує права ChatGPT-web
    у прямий доступ до API. Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform,
    використовуйте `openai/*` з API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви auth через підписку OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth підписки OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання OAuth підписки в зовнішніх інструментах/робочих процесах
    на кшталт OpenClaw. Onboarding може запустити OAuth-потік за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Onboarding (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **потік auth Plugin**, а не client id чи secret у `openclaw.json`.

    Кроки:

    1. Локально встановіть Gemini CLI, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Модель за замовчуванням після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не вдаються, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає токени OAuth у профілях auth на хості gateway. Подробиці: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + надійної безпеки; малі карти обрізають і витікають. Якщо вже треба, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі підвищують ризик prompt injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як утримувати трафік до розміщених моделей у певному регіоні?">
    Вибирайте endpoints, прив’язані до регіону. OpenRouter надає варіанти з хостингом у США для MiniMax, Kimi і GLM; виберіть варіант із хостингом у США, щоб дані залишалися в межах регіону. Ви все одно можете перераховувати Anthropic/OpenAI поряд із ними, використовуючи `models.mode: "merge"`, щоб резервні варіанти залишалися доступними, водночас дотримуючись вибраного регіонального провайдера.
  </Accordion>

  <Accordion title="Чи обов’язково купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini — необов’язковий варіант:
    деякі люди купують його як хост, що завжди ввімкнений, але також підійде невеликий VPS, домашній сервер або пристрій класу Raspberry Pi.

    Mac вам потрібен лише **для інструментів тільки для macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти тільки для macOS, запускайте Gateway на Mac або під’єднайте macOS Node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, у якому виконано вхід у Messages. Це **не** обов’язково має бути Mac mini —
    підійде будь-який Mac. Для iMessage **використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) — сервер BlueBubbles працює на macOS, а Gateway може працювати на Linux або деінде.

    Поширені варіанти налаштування:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac, у якому виконано вхід у Messages.
    - Запускайте все на Mac, якщо хочете найпростішу конфігурацію з однією машиною.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи зможу я під’єднати його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може під’єднатися як
    **Node** (додатковий пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, як-от екран/камера/canvas і `system.run` на цьому пристрої.

    Поширений шаблон:

    - Gateway на Mac mini (завжди ввімкнений).
    - MacBook Pro запускає застосунок macOS або хост Node і під’єднується до Gateway.
    - Щоб побачити його, використовуйте `openclaw nodes status` / `openclaw nodes list`.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я використовувати Bun?">
    Bun **не рекомендовано**. Ми бачимо помилки під час роботи, особливо з WhatsApp і Telegram.
    Для стабільних Gateway використовуйте **Node**.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на не-production Gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім’я користувача бота.

    Під час налаштування запитуються лише числові user ID. Якщо у вашій конфігурації вже є застарілі записи `@username`, `openclaw doctor --fix` може спробувати їх розв’язати.

    Безпечніше (без стороннього бота):

    - Напишіть своєму боту в DM, потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть своєму боту в DM, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватний):

    - Напишіть у DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **маршрутизацію multi-agent**. Прив’яжіть WhatsApp **DM** кожного відправника (peer `kind: "direct"`, E.164 відправника на кшталт `+15551234567`) до різного `agentId`, щоб кожна людина мала власний робочий простір і сховище сесій. Відповіді все одно надходитимуть з **того самого облікового запису WhatsApp**, а контроль доступу DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Див. [Маршрутизація Multi-Agent](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
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

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH служби містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, визначалися в non-login оболонках.
    Останні збірки також додають попереду поширені користувацькі каталоги bin у службах Linux systemd (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо вони задані.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повний checkout вихідного коду, можна редагувати, найкраще для contributors.
      Ви локально запускаєте збірки та можете вносити зміни в код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію «просто запустити».
      Оновлення надходять із dist-tag npm.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm і git installs?">
    Так. Встановіть інший варіант, а потім запустіть Doctor, щоб служба gateway вказувала на нову точку входу.
    Це **не видаляє ваші дані** — змінюється лише встановлення коду OpenClaw. Ваші state
    (`~/.openclaw`) і workspace (`~/.openclaw/workspace`) залишаються недоторканими.

    Із npm до git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Із git до npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor виявляє невідповідність точки входу служби gateway і пропонує переписати конфігурацію служби відповідно до поточного встановлення (використовуйте `--repair` в автоматизації).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо ви хочете
    мінімального тертя й вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Плюси:** немає витрат на сервер, прямий доступ до локальних файлів, видиме вікно браузера в реальному часі.
    - **Мінуси:** сон/збої мережі = відключення, оновлення ОС/перезавантаження переривають роботу, пристрій має залишатися активним.

    **VPS / хмара**

    - **Плюси:** завжди ввімкнений, стабільна мережа, немає проблем через сон ноутбука, простіше підтримувати в роботі.
    - **Мінуси:** часто працює без дисплея (використовуйте знімки екрана), лише віддалений доступ до файлів, для оновлень потрібно підключатися через SSH.

    **Примітка щодо OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord усі добре працюють з VPS. Єдиний справжній компроміс — **headless browser** проти видимого вікна. Див. [Browser](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо у вас раніше були відключення gateway. Локальний запуск чудово підходить, коли ви активно користуєтеся Mac і хочете локальний доступ до файлів або автоматизацію UI у видимому браузері.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на виділеній машині?">
    Не обов’язково, але **рекомендовано для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** завжди ввімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, простіше підтримувати в роботі.
    - **Спільний ноутбук/настільний комп’ютер:** цілком нормально для тестування та активного використання, але очікуйте пауз, коли машина переходить у сон або оновлюється.

    Якщо ви хочете поєднати переваги обох варіантів, тримайте Gateway на виділеному хості, а ноутбук під’єднайте як **Node** для локальних інструментів екрана/камери/exec. Див. [Nodes](/uk/nodes).
    Для рекомендацій з безпеки прочитайте [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яку ОС рекомендовано?">
    OpenClaw є легким. Для базового Gateway + одного чат-каналу:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1-2 vCPU, 2GB RAM або більше із запасом (логи, медіа, кілька каналів). Інструменти Node і автоматизація браузера можуть бути ресурсомісткими.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях встановлення для Linux найкраще протестовано саме там.

    Документація: [Linux](/uk/platforms/linux), [VPS hosting](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди ввімкненою, доступною та мати достатньо
    RAM для Gateway і всіх каналів, які ви ввімкнете.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера або медіаінструменти.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви використовуєте Windows, **WSL2 — найпростіше налаштування у стилі VM** і воно має найкращу
    сумісність з інструментами. Див. [Windows](/uk/platforms/windows), [VPS hosting](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw в одному абзаці?">
    OpenClaw — це персональний AI assistant, який ви запускаєте на власних пристроях. Він відповідає на тих поверхнях обміну повідомленнями, якими ви вже користуєтеся (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat і вбудовані channel plugins, такі як QQ Bot) і також може працювати з голосом + live Canvas на підтримуваних платформах. **Gateway** — це контрольна площина, що завжди ввімкнена; assistant — це сам продукт.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не «просто обгортка навколо Claude». Це **control plane із пріоритетом локального запуску**, яка дає змогу запускати
    потужного assistant на **вашому власному обладнанні**, доступного з чат-застосунків, якими ви вже користуєтеся, із
    session history, memory та інструментами — без передавання контролю над вашими робочими процесами
    розміщеному SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway де завгодно (Mac, Linux, VPS) і зберігайте
      workspace + session history локально.
    - **Реальні канали, а не вебпісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      плюс мобільний голос і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо з маршрутизацією
      та перемиканням у разі збою для кожного agent окремо.
    - **Лише локальний варіант:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо ви цього хочете.
    - **Маршрутизація multi-agent:** окремі agents для кожного каналу, облікового запису чи завдання, кожен зі своїм
      workspace і значеннями за замовчуванням.
    - **Відкритий код і можливість змінювати:** перевіряйте, розширюйте та розміщуйте самостійно без прив’язки до постачальника.

    Документація: [Gateway](/uk/gateway), [Канали](/uk/channels), [Multi-agent](/uk/concepts/multi-agent),
    [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно все налаштував — що робити спочатку?">
    Хороші перші проєкти:

    - Створити вебсайт (WordPress, Shopify або простий статичний сайт).
    - Створити прототип мобільного застосунку (структура, екрани, план API).
    - Упорядкувати файли та папки (очищення, іменування, теги).
    - Під’єднати Gmail і автоматизувати підсумки або follow ups.

    Він може працювати з великими завданнями, але найкраще працює, коли ви ділите їх на фази й
    використовуєте sub agents для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найпоширеніших повсякденних сценаріїв використання OpenClaw?">
    Повсякденна користь зазвичай виглядає так:

    - **Персональні зведення:** підсумки inbox, календаря та важливих для вас новин.
    - **Дослідження та чернетки:** швидкі дослідження, підсумки та перші чернетки для листів або документів.
    - **Нагадування та follow ups:** підказки й чеклісти на основі Cron або Heartbeat.
    - **Автоматизація браузера:** заповнення форм, збирання даних і повторення вебзавдань.
    - **Координація між пристроями:** надішліть завдання з телефона, дозвольте Gateway виконати його на сервері й отримайте результат назад у чаті.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, ads і blog для SaaS?">
    Так, для **дослідження, кваліфікації та підготовки чернеток**. Він може сканувати сайти, створювати списки,
    підсумовувати інформацію про потенційних клієнтів і писати чернетки outreach або рекламних текстів.

    Для **outreach або запуску реклами** залишайте людину в циклі. Уникайте спаму, дотримуйтесь місцевих законів і
    політик платформ, і переглядайте все перед надсиланням. Найбезпечніший шаблон — дозволити
    OpenClaw підготувати чернетку, а ви її схвалюєте.

    Документація: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний assistant** і рівень координації, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу кодування всередині репозиторію. Використовуйте OpenClaw, коли вам
    потрібні довготривала memory, кроспристроєвий доступ і оркестрація інструментів.

    Переваги:

    - **Постійна memory + workspace** між сесіями
    - **Доступ із багатьох платформ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (browser, files, планування, hooks)
    - **Gateway, що завжди ввімкнений** (запуск на VPS, взаємодія звідусіль)
    - **Nodes** для локального browser/screen/camera/exec

    Вітрина: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills і автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати Skills, не забруднюючи репозиторій?">
    Використовуйте керовані перевизначення замість редагування копії в репозиторії. Розміщуйте свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`, тож керовані перевизначення все одно мають вищий пріоритет за вбудовані skills без зміни git. Якщо потрібно, щоб skill був встановлений глобально, але видимий лише деяким agents, тримайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` і `agents.list[].skills`. Лише зміни, які варті внесення вгору за течією, мають жити в репозиторії та надсилатися як PR.
  </Accordion>

  <Accordion title="Чи можу я завантажувати Skills із власної папки?">
    Так. Додавайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Типовий пріоритет: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`. `clawhub` типово встановлює в `./skills`, що OpenClaw розглядає як `<workspace>/skills` у наступній сесії. Якщо skill має бути видимий лише певним agents, поєднуйте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як я можу використовувати різні моделі для різних завдань?">
    Сьогодні підтримуються такі шаблони:

    - **Cron jobs**: ізольовані завдання можуть задавати перевизначення `model` для кожного завдання.
    - **Sub-agents**: маршрутизуйте завдання до окремих agents з різними моделями за замовчуванням.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб у будь-який момент перемкнути модель поточної сесії.

    Див. [Cron jobs](/uk/automation/cron-jobs), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent) і [Слеш-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як винести це окремо?">
    Використовуйте **sub-agents** для довгих або паралельних завдань. Sub-agents працюють у власній сесії,
    повертають підсумок і зберігають чутливість основного чату.

    Попросіть свого бота «spawn a sub-agent for this task» або використайте `/subagents`.
    Використовуйте `/status` у чаті, щоб бачити, що Gateway робить просто зараз (і чи він зайнятий).

    Порада щодо токенів: і довгі завдання, і sub-agents споживають токени. Якщо вартість має значення, задайте
    дешевшу модель для sub-agents через `agents.defaults.subagents.model`.

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють прив’язані до thread сесії subagent у Discord?">
    Використовуйте прив’язки thread. Ви можете прив’язати Discord thread до subagent або цілі session, щоб наступні повідомлення в цій thread залишалися на цій прив’язаній сесії.

    Базовий процес:

    - Створіть через `sessions_spawn` з `thread: true` (і, за потреби, `mode: "session"` для постійних наступних повідомлень).
    - Або прив’яжіть вручну через `/focus <target>`.
    - Використовуйте `/agents`, щоб перевірити стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати автоматичним зняттям фокусу.
    - Використовуйте `/unfocus`, щоб від’єднати thread.

    Потрібна конфігурація:

    - Глобальні значення за замовчуванням: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Перевизначення Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоприв’язка під час створення: задайте `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Sub-agents](/uk/tools/subagents), [Discord](/uk/channels/discord), [Довідник із конфігурації](/uk/gateway/configuration-reference), [Слеш-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent завершив роботу, але повідомлення про завершення пішло не туди або взагалі не було опубліковане. Що перевірити?">
    Спочатку перевірте розв’язаний маршрут запитувача:

    - Доставка subagent у режимі завершення надає перевагу будь-якому прив’язаному thread або маршруту conversation, якщо такий існує.
    - Якщо джерело завершення містить лише канал, OpenClaw використовує запасний варіант — збережений маршрут сесії запитувача (`lastChannel` / `lastTo` / `lastAccountId`), щоб пряма доставка все ще могла спрацювати.
    - Якщо немає ні прив’язаного маршруту, ні придатного збереженого маршруту, пряма доставка може завершитися невдачею, і результат замість негайної публікації в чаті перейде в доставку через чергу сесії.
    - Недійсні або застарілі цілі все одно можуть примусово перевести доставку до черги або спричинити остаточну помилку доставки.
    - Якщо остання видима відповідь assistant у дочірній сесії — це точний silent token `NO_REPLY` / `no_reply` або рівно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує announce замість публікації застарілого попереднього прогресу.
    - Якщо дочірня сесія завершилася за timeout після лише викликів інструментів, announce може згорнути це до короткого підсумку часткового прогресу замість відтворення сирого виводу інструментів.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks), [Інструмент Session](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron виконується всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані завдання не виконуватимуться.

    Чекліст:

    - Підтвердьте, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не задано.
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

    - `--no-deliver` / `delivery.mode: "none"` означає, що резервне надсилання runner не очікується.
    - Відсутня або недійсна ціль announce (`channel` / `to`) означає, що runner пропустив вихідну доставку.
    - Помилки auth каналу (`unauthorized`, `Forbidden`) означають, що runner намагався доставити повідомлення, але облікові дані це заблокували.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` only) вважається навмисно недоставним, тому runner також пригнічує резервну доставку через чергу.

    Для ізольованих Cron jobs agent усе одно може надсилати безпосередньо за допомогою інструмента `message`,
    коли маршрут чату доступний. `--announce` керує лише резервним шляхом runner
    для фінального тексту, який agent ще не надіслав самостійно.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований запуск cron переключив модель або повторився один раз?">
    Зазвичай це шлях живого перемикання моделі, а не дублювання планування.

    Ізольований cron може зберегти передавання моделі під час роботи й повторити спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Під час повторної спроби зберігаються переключені
    provider/model, а якщо перемикання містило нове перевизначення профілю auth, cron
    також зберігає його перед повторною спробою.

    Пов’язані правила вибору:

    - Спочатку, якщо застосовно, перемагає перевизначення моделі Gmail hook.
    - Потім — `model` для конкретного завдання.
    - Потім — будь-яке збережене перевизначення моделі cron-session.
    - Потім — звичайний вибір моделі agent/за замовчуванням.

    Цикл повторних спроб обмежений. Після початкової спроби плюс 2 повторів через перемикання
    cron завершує роботу замість нескінченного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [CLI cron](/uk/cli/cron).

  </Accordion>

  <Accordion title="Як встановити Skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або просто розміщуйте skills у своєму workspace. UI Skills для macOS недоступний на Linux.
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

    Нативний `openclaw skills install` записує у каталог `skills/` активного workspace. Окремий CLI `clawhub` встановлюйте лише якщо хочете публікувати або
    синхронізувати власні skills. Для спільних встановлень між agents розміщуйте skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете звузити коло agents, які можуть його бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати завдання за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте планувальник Gateway:

    - **Cron jobs** для запланованих або повторюваних завдань (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок «основної сесії».
    - **Ізольовані завдання** для автономних agents, які публікують підсумки або доставляють їх у чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати Apple skills лише для macOS із Linux?">
    Не напряму. macOS skills обмежуються через `metadata.openclaw.os` і потрібні бінарні файли, а skills з’являються в system prompt лише тоді, коли вони придатні на **хості Gateway**. У Linux skills лише для `darwin` (як-от `apple-notes`, `apple-reminders`, `things-mac`) не завантажуються, якщо ви не перевизначите це обмеження.

    Є три підтримувані варіанти:

    **Варіант A — запускати Gateway на Mac (найпростіше).**
    Запускайте Gateway там, де існують бінарні файли macOS, а потім підключайтеся з Linux у [remote mode](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажуються нормально, тому що хост Gateway — це macOS.

    **Варіант B — використовувати macOS Node (без SSH).**
    Запускайте Gateway на Linux, під’єднайте macOS Node (застосунок у рядку меню) і встановіть **Node Run Commands** у значення "Always Ask" або "Always Allow" на Mac. OpenClaw може вважати skills лише для macOS придатними, коли потрібні бінарні файли існують на Node. Agent запускає ці skills через інструмент `nodes`. Якщо ви виберете "Always Ask", підтвердження "Always Allow" у запиті додасть цю команду до allowlist.

    **Варіант C — проксувати бінарні файли macOS через SSH (просунутий варіант).**
    Тримайте Gateway на Linux, але забезпечте, щоб потрібні CLI-бінарні файли резолвилися до SSH-обгорток, які виконуються на Mac. Потім перевизначте skill, щоб дозволити Linux, і він залишався придатним.

    1. Створіть SSH-обгортку для бінарного файла (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Розмістіть обгортку в `PATH` на хості Linux (наприклад `~/bin/memo`).
    3. Перевизначте метадані skill (workspace або `~/.openclaw/skills`), щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Керування Apple Notes через CLI memo у macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Почніть нову сесію, щоб оновився знімок skills.

  </Accordion>

  <Accordion title="Чи є у вас інтеграція з Notion або HeyGen?">
    Сьогодні вбудованої немає.

    Варіанти:

    - **Власний skill / Plugin:** найкраще для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Автоматизація браузера:** працює без коду, але повільніше й крихкіше.

    Якщо ви хочете зберігати контекст для кожного клієнта окремо (робочі процеси агентства), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + налаштування + активна робота).
    - Просіть agent отримувати цю сторінку на початку сесії.

    Якщо вам потрібна нативна інтеграція, створіть feature request або побудуйте skill,
    орієнтований на ці API.

    Встановлення skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні встановлення потрапляють у каталог `skills/` активного workspace. Для спільних skills між agents розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі agents, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі skills очікують бінарні файли, встановлені через Homebrew; у Linux це означає Linuxbrew (див. запис FAQ про Homebrew на Linux вище). Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати свій уже авторизований Chrome з OpenClaw?">
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

    Цей шлях може використовувати локальний браузер хоста або підключений browser node. Якщо Gateway працює деінде, або запускайте хост Node на машині з браузером, або використовуйте віддалений CDP.

    Поточні обмеження `existing-session` / `user`:

    - дії ґрунтуються на ref, а не на CSS-selector
    - завантаження файлів потребують `ref` / `inputRef` і наразі підтримують лише один файл за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії все ще потребують керованого браузера або сирого профілю CDP

  </Accordion>
</AccordionGroup>

## Ізоляція та memory

<AccordionGroup>
  <Accordion title="Чи є окремий документ про ізоляцію?">
    Так. Див. [Ізоляція](/uk/gateway/sandboxing). Для налаштування, специфічного для Docker (повний Gateway у Docker або образи ізоляції), див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повні можливості?">
    Типовий образ орієнтований насамперед на безпеку і працює від користувача `node`, тому він не
    містить системних пакетів, Homebrew або вбудованих браузерів. Для повнішого налаштування:

    - Зберігайте `/home/node` через `OPENCLAW_HOME_VOLUME`, щоб кеші зберігалися між запусками.
    - Додавайте системні залежності в образ через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Встановлюйте браузери Playwright через вбудований CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Задайте `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я зберегти DM приватними, але зробити групи публічними/ізольованими з одним agent?">
    Так — якщо ваш приватний трафік це **DM**, а публічний трафік — це **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб групові/канальні сесії (ключі не-main) працювали у налаштованому бекенді ізоляції, тоді як основна сесія DM залишалася на хості. Docker — типовий бекенд, якщо ви не виберете інший. Потім обмежте, які інструменти доступні в ізольованих сесіях, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Групи: приватні DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Ключовий довідник із конфігурації: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив’язати папку хоста до ізольованого середовища?">
    Задайте `agents.defaults.sandbox.docker.binds` у вигляді `["host:path:mode"]` (наприклад, `"/home/user/src:/src:ro"`). Глобальні прив’язки та прив’язки для окремих agents об’єднуються; прив’язки для окремих agents ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для всього чутливого й пам’ятайте, що прив’язки обходять файлові межі ізольованого середовища.

    OpenClaw перевіряє джерела bind і за нормалізованим шляхом, і за канонічним шляхом, розв’язаним через найглибший наявний батьківський елемент. Це означає, що виходи за межі через symlink-parent усе одно надійно блокуються, навіть коли останній сегмент шляху ще не існує, а перевірки allowed-root усе одно застосовуються після розв’язання symlink.

    Приклади та зауваження з безпеки див. у [Ізоляція](/uk/gateway/sandboxing#custom-bind-mounts) і [Ізоляція vs політика інструментів vs elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Як працює memory?">
    Memory OpenClaw — це просто Markdown-файли в workspace agent:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Кураторські довгострокові нотатки в `MEMORY.md` (лише для main/private sessions)

    OpenClaw також виконує **тихий flush memory перед compaction**, щоб нагадати моделі
    записати довговічні нотатки перед auto-compaction. Це працює лише тоді, коли workspace
    доступний для запису (ізольовані середовища лише для читання це пропускають). Див. [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Memory постійно щось забуває. Як зробити, щоб воно закріплювалося?">
    Попросіть бота **записати факт у memory**. Довгострокові нотатки мають бути в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це все ще сфера, яку ми вдосконалюємо. Допомагає нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона й далі забуває, перевірте, що Gateway використовує той самий
    workspace під час кожного запуску.

    Документація: [Memory](/uk/concepts/memory), [Робочий простір agent](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Чи зберігається memory назавжди? Які є обмеження?">
    Файли memory живуть на диску й зберігаються, доки ви їх не видалите. Обмеженням є ваше
    сховище, а не модель. **Контекст сесії** усе ще обмежений вікном контексту
    моделі, тому довгі розмови можуть compact або truncate. Саме тому існує
    пошук по memory — він повертає в контекст лише релевантні частини.

    Документація: [Memory](/uk/concepts/memory), [Контекст](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потребує семантичний пошук по memory ключа OpenAI API?">
    Лише якщо ви використовуєте **embeddings OpenAI**. OAuth Codex покриває chat/completions і
    **не** надає доступу до embeddings, тож **вхід через Codex (OAuth або
    вхід через CLI Codex)** не допомагає для семантичного пошуку по memory. Embeddings OpenAI
    як і раніше потребують справжнього API key (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви явно не задаєте provider, OpenClaw автоматично вибирає provider, коли він
    може знайти API key (профілі auth, `models.providers.*.apiKey` або env vars).
    Він надає перевагу OpenAI, якщо доступний ключ OpenAI, інакше Gemini, якщо доступний ключ Gemini,
    потім Voyage, потім Mistral. Якщо жоден віддалений ключ недоступний, пошук по memory
    залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштовано й доступний шлях
    до локальної моделі, OpenClaw
    надає перевагу `local`. Ollama підтримується, коли ви явно задаєте
    `memorySearch.provider = "ollama"`.

    Якщо ви хочете залишатися локальними, задайте `memorySearch.provider = "local"` (і за бажанням
    `memorySearch.fallback = "none"`). Якщо вам потрібні embeddings Gemini, задайте
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо embedding-моделі **OpenAI, Gemini, Voyage, Mistral, Ollama або local** —
    подробиці налаштування див. у [Memory](/uk/concepts/memory).

  </Accordion>
</AccordionGroup>

## Де що зберігається на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, що використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw є локальним**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** sessions, файли memory, config і workspace живуть на хості Gateway
      (`~/.openclaw` + каталог вашого workspace).
    - **Віддалено за необхідністю:** повідомлення, які ви надсилаєте providers моделей (Anthropic/OpenAI тощо), ідуть до
      їхніх API, а чат-платформи (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на своїх
      серверах.
    - **Ви контролюєте слід:** використання локальних моделей зберігає prompts на вашій машині, але трафік
      каналів усе одно проходить через сервери каналу.

    Пов’язане: [Робочий простір agent](/uk/concepts/agent-workspace), [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе зберігається в `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Path                                                            | Призначення                                                        |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основний config (JSON5)                                            |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Застарілий імпорт OAuth (копіюється в профілі auth під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Профілі auth (OAuth, API keys і необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язкове файлове секретне корисне навантаження для providers SecretRef типу `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Файл сумісності зі застарілими версіями (статичні записи `api_key` очищуються) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан provider (наприклад `whatsapp/<accountId>/creds.json`)        |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан для кожного agent окремо (agentDir + sessions)                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і стан (для кожного agent окремо)                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані sessions (для кожного agent окремо)                       |

    Застарілий шлях для одного agent: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`).

    Ваш **workspace** (`AGENTS.md`, файли memory, skills тощо) зберігається окремо й налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають зберігатися AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли зберігаються в **workspace agent**, а не в `~/.openclaw`.

    - **Workspace (для кожного agent):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, необов’язковий `HEARTBEAT.md`.
      `memory.md` у нижньому регістрі в корені — це лише вхід для виправлення застарілих версій; `openclaw doctor --fix`
      може об’єднати його в `MEMORY.md`, коли існують обидва файли.
    - **Каталог стану (`~/.openclaw`)**: config, стан channel/provider, профілі auth, sessions, logs,
      і спільні skills (`~/.openclaw/skills`).

    Типовий workspace: `~/.openclaw/workspace`, налаштовується через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот «забуває» після перезапуску, переконайтеся, що Gateway використовує той самий
    workspace під час кожного запуску (і пам’ятайте: remote mode використовує workspace **хоста gateway**,
    а не вашого локального ноутбука).

    Порада: якщо ви хочете закріпити поведінку або вподобання надовго, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладатися на історію чату.

    Див. [Робочий простір agent](/uk/concepts/agent-workspace) і [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Помістіть свій **workspace agent** у **приватний** git-репозиторій і зберігайте його резервну копію десь
    приватно (наприклад у приватному GitHub). Це збереже memory + файли AGENTS/SOUL/USER
    і дасть змогу пізніше відновити «розум» assistant.

    **Не** робіть commit нічого з `~/.openclaw` (credentials, sessions, tokens або зашифровані секретні корисні навантаження).
    Якщо вам потрібне повне відновлення, створюйте резервні копії і workspace, і каталогу стану
    окремо (див. запитання про міграцію вище).

    Документація: [Робочий простір agent](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окремий посібник: [Видалення](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть agents працювати поза workspace?">
    Так. Workspace — це **типовий cwd** і прив’язка memory, а не жорстка ізоляція.
    Відносні шляхи розв’язуються всередині workspace, але абсолютні шляхи можуть звертатися до інших
    розташувань хоста, якщо ізоляцію не ввімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування ізоляції для окремих agents. Якщо ви
    хочете, щоб репозиторій був типовим робочим каталогом, вкажіть
    `workspace` цього agent на корінь репозиторію. Репозиторій OpenClaw — це лише вихідний код; тримайте
    workspace окремо, якщо тільки ви свідомо не хочете, щоб agent працював усередині нього.

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

  <Accordion title="Remote mode: де зберігаються sessions?">
    Стан sessions належить **хосту gateway**. Якщо ви в remote mode, потрібне вам сховище sessions перебуває на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Керування sessions](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи config

<AccordionGroup>
  <Accordion title="Який формат config? Де він зберігається?">
    OpenClaw читає необов’язковий config **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються доволі безпечні значення за замовчуванням (зокрема типовий workspace `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я встановив gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Bind не-loopback **потребують коректного шляху auth gateway**. На практиці це означає:

    - auth зі спільним секретом: токен або пароль
    - `gateway.auth.mode: "trusted-proxy"` за правильно налаштованим не-loopback reverse proxy з awareness ідентичності

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
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як запасний варіант лише тоді, коли `gateway.auth.*` не задано.
    - Для auth паролем задайте `gateway.auth.mode: "password"` плюс `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і їх не вдається розв’язати, розв’язання надійно завершується помилкою (без маскувального запасного варіанта через remote).
    - Налаштування Control UI зі спільним секретом автентифікуються через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях app/UI). Режими з передаванням ідентичності, як-от Tailscale Serve або `trusted-proxy`, натомість використовують заголовки запиту. Не розміщуйте спільні секрети в URL.
    - За `gateway.auth.mode: "trusted-proxy"` reverse proxy loopback на тому самому хості все одно **не** задовольняють auth trusted-proxy. Trusted proxy має бути налаштованим джерелом не-loopback.

  </Accordion>

  <Accordion title="Чому тепер на localhost потрібен токен?">
    OpenClaw типово примусово вимагає auth gateway, зокрема й на loopback. У звичайному типовому сценарії це означає auth токеном: якщо жоден явний шлях auth не налаштовано, під час запуску gateway вибирається режим токена і він автоматично генерується, зберігаючись у `gateway.auth.token`, тож **локальні WS clients мають проходити автентифікацію**. Це блокує іншим локальним процесам виклик Gateway.

    Якщо ви віддаєте перевагу іншому шляху auth, ви можете явно вибрати режим пароля (або, для не-loopback reverse proxy з awareness ідентичності, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно задайте `gateway.auth.mode: "none"` у своєму config. Doctor може будь-коли згенерувати для вас токен: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни config?">
    Gateway стежить за config і підтримує hot-reload:

    - `gateway.reload.mode: "hybrid"` (типово): безпечно застосовує зміни гаряче, для критичних — перезапускає
    - також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Як вимкнути кумедні tagline у CLI?">
    Задайте `cli.banner.taglineMode` у config:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: приховує текст tagline, але залишає рядок заголовка/версії banner.
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: ротація кумедних/сезонних tagline (типова поведінка).
    - Якщо ви хочете взагалі прибрати banner, задайте env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути web search (і web fetch)?">
    `web_fetch` працює без API key. `web_search` залежить від вибраного
    provider:

    - Providers на основі API, як-от Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, потребують звичайного налаштування API key.
    - Ollama Web Search не потребує ключа, але використовує налаштований хост Ollama і вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна інтеграція на основі HTML.
    - SearXNG не потребує ключа / є self-hosted; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Рекомендовано:** виконайте `openclaw configure --section web` і виберіть provider.
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

    Конфігурація web-search, специфічна для provider, тепер розміщується в `plugins.entries.<plugin>.config.webSearch.*`.
    Застарілі шляхи provider `tools.web.search.*` усе ще тимчасово завантажуються для сумісності, але їх не слід використовувати для нових config.
    Резервна конфігурація Firecrawl web-fetch розміщується в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlist, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` типово увімкнено (якщо його явно не вимкнути).
    - Якщо `tools.web.fetch.provider` пропущено, OpenClaw автоматично визначає першого готового fallback-provider для fetch на основі доступних облікових даних. Наразі вбудований provider — це Firecrawl.
    - Daemon читають env vars з `~/.openclaw/.env` (або з середовища служби).

    Документація: [Web tools](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мій config. Як відновитися й уникнути цього?">
    `config.apply` замінює **весь config**. Якщо ви надсилаєте частковий об’єкт, усе
    інше видаляється.

    Поточний OpenClaw захищає від багатьох випадкових перезаписів:

    - Записи config, що належать OpenClaw, перевіряють повний config після зміни перед записом.
    - Недійсні або руйнівні записи, що належать OpenClaw, відхиляються і зберігаються як `openclaw.json.rejected.*`.
    - Якщо пряме редагування ламає startup або hot reload, Gateway відновлює останній відомий справний config і зберігає відхилений файл як `openclaw.json.clobbered.*`.
    - Після відновлення основний agent отримує попередження під час завантаження, щоб не записати поганий config знову навмання.

    Відновлення:

    - Перевірте `openclaw logs --follow` на наявність `Config auto-restored from last-known-good`, `Config write rejected:` або `config reload restored last-known-good config`.
    - Перегляньте найновіший `openclaw.json.clobbered.*` або `openclaw.json.rejected.*` поруч з активним config.
    - Залиште активний відновлений config, якщо він працює, а потім поверніть лише потрібні ключі через `openclaw config set` або `config.patch`.
    - Виконайте `openclaw config validate` і `openclaw doctor`.
    - Якщо у вас немає last-known-good або відхиленого payload, відновіть з резервної копії або повторно виконайте `openclaw doctor` і заново налаштуйте channels/models.
    - Якщо це було неочікувано, створіть bug report і додайте свій останній відомий config або будь-яку резервну копію.
    - Локальний coding agent часто може відновити робочий config з логів або історії.

    Як уникнути цього:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивного редагування.
    - Спершу використовуйте `config.schema.lookup`, якщо не впевнені в точному шляху або формі поля; він повертає вузол поверхневої схеми та підсумки безпосередніх дочірніх елементів для подальшого заглиблення.
    - Використовуйте `config.patch` для часткових RPC-редагувань; залиште `config.apply` лише для повної заміни config.
    - Якщо ви використовуєте tool `gateway` тільки для власника з запуску agent, він усе одно відхилятиме записи в `tools.exec.ask` / `tools.exec.security` (включно із застарілими псевдонімами `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Config](/uk/cli/config), [Configure](/uk/cli/configure), [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими workers на різних пристроях?">
    Поширений шаблон — **один Gateway** (наприклад, Raspberry Pi) плюс **nodes** і **agents**:

    - **Gateway (центральний):** володіє channels (Signal/WhatsApp), маршрутизацією та sessions.
    - **Nodes (пристрої):** Mac/iOS/Android підключаються як периферія і надають локальні tools (`system.run`, `canvas`, `camera`).
    - **Agents (workers):** окремі brain/workspace для спеціальних ролей (наприклад, «Hetzner ops», «Personal data»).
    - **Sub-agents:** запускають фонову роботу з основного agent, коли вам потрібен паралелізм.
    - **TUI:** підключається до Gateway і перемикає agents/sessions.

    Документація: [Nodes](/uk/nodes), [Віддалений доступ](/uk/gateway/remote), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [TUI](/uk/web/tui).

  </Accordion>

  <Accordion title="Чи може browser OpenClaw працювати в режимі headless?">
    Так. Це параметр config:

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

    Типове значення — `false` (headful). Режим headless із більшою ймовірністю запускає anti-bot перевірки на деяких сайтах. Див. [Browser](/uk/tools/browser).

    Headless використовує **той самий рушій Chromium** і працює для більшості сценаріїв автоматизації (форми, кліки, скрейпінг, входи). Основні відмінності:

    - Немає видимого вікна браузера (якщо потрібна візуалізація, використовуйте знімки екрана).
    - Деякі сайти суворіше ставляться до автоматизації в режимі headless (CAPTCHA, anti-bot).
      Наприклад, X/Twitter часто блокує сесії headless.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування browser?">
    Задайте `browser.executablePath` на ваш бінарний файл Brave (або будь-який browser на базі Chromium) і перезапустіть Gateway.
    Повні приклади config див. у [Browser](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway і nodes

<AccordionGroup>
  <Accordion title="Як команди проходять між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає agent і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен node tool:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідний трафік provider; вони отримують лише виклики node RPC.

  </Accordion>

  <Accordion title="Як мій agent може отримати доступ до мого комп’ютера, якщо Gateway розміщено віддалено?">
    Коротка відповідь: **під’єднайте свій комп’ютер як node**. Gateway працює деінде, але він може
    викликати tools `node.*` (екран, камера, система) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на хості, який завжди ввімкнений (VPS/домашній сервер).
    2. Додайте хост Gateway і свій комп’ютер до однієї tailnet.
    3. Переконайтеся, що Gateway WS доступний (bind tailnet або SSH tunnel).
    4. Відкрийте локально застосунок macOS і підключіться в режимі **Remote over SSH** (або напряму через tailnet),
       щоб він міг зареєструватися як node.
    5. Схваліть node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP-міст не потрібен; nodes підключаються через Gateway WebSocket.

    Нагадування щодо безпеки: під’єднання macOS Node дозволяє `system.run` на цій машині. Під’єднуйте
    лише пристрої, яким довіряєте, і перегляньте [Безпека](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Протокол Gateway](/uk/gateway/protocol), [Віддалений режим macOS](/uk/platforms/mac/remote), [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключено, але я не отримую відповідей. Що тепер?">
    Перевірте базові речі:

    - Gateway працює: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан channel: `openclaw channels status`

    Потім перевірте auth і маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` налаштовано правильно.
    - Якщо ви підключаєтеся через SSH tunnel, підтвердьте, що локальний tunnel активний і вказує на правильний порт.
    - Переконайтеся, що ваші allowlist (DM або group) містять ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Віддалений доступ](/uk/gateway/remote), [Channels](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два екземпляри OpenClaw спілкуватися один з одним (локальний + VPS)?">
    Так. Вбудованого мосту «bot-to-bot» немає, але це можна під’єднати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний chat channel, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Bot A надішле повідомлення Bot B, а тоді Bot B відповість як зазвичай.

    **CLI-міст (загальний):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючи його на чат, де слухає інший бот.
    Якщо один бот працює на віддаленому VPS, націльте свій CLI на цей віддалений Gateway
    через SSH/Tailscale (див. [Віддалений доступ](/uk/gateway/remote)).

    Приклад шаблону (запускайте з машини, яка може досягти цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте запобіжник, щоб два боти не зациклювалися без кінця (лише згадки, channel
    allowlist або правило «не відповідати на повідомлення ботів»).

    Документація: [Віддалений доступ](/uk/gateway/remote), [CLI Agent](/uk/cli/agent), [Надсилання Agent](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох agents?">
    Ні. Один Gateway може розміщувати кількох agents, кожен зі своїм workspace, типовими моделями
    та маршрутизацією. Це нормальний варіант налаштування, і він значно дешевший і простіший, ніж запускати
    один VPS на кожного agent.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні config, якими ви не хочете ділитися. В іншому разі тримайте один Gateway і
    використовуйте кількох agents або sub-agents.

  </Accordion>

  <Accordion title="Чи є користь від використання node на моєму особистому ноутбуці замість SSH з VPS?">
    Так — nodes є основним способом доступу до вашого ноутбука з віддаленого Gateway, і вони
    відкривають більше, ніж просто доступ до оболонки. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким (достатньо невеликого VPS або пристрою класу Raspberry Pi; 4 GB RAM більш ніж вистачає), тому типовий
    варіант — це хост, що завжди ввімкнений, плюс ваш ноутбук як node.

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до Gateway WebSocket і використовують pairing пристроїв.
    - **Безпечніший контроль виконання.** `system.run` обмежується allowlist/схваленнями node на цьому ноутбуці.
    - **Більше інструментів пристрою.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна автоматизація browser.** Тримайте Gateway на VPS, але запускайте Chrome локально через node host на ноутбуці або під’єднуйтеся до локального Chrome на хості через Chrome MCP.

    SSH підходить для разового доступу до оболонки, але nodes простіші для постійних робочих процесів agent і
    автоматизації пристроїв.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають nodes службу gateway?">
    Ні. На хості має працювати лише **один gateway**, якщо тільки ви свідомо не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)). Nodes — це периферійні елементи, які підключаються
    до gateway (nodes iOS/Android або macOS у «режимі node» в застосунку рядка меню). Для headless node
    hosts і керування через CLI див. [CLI Node host](/uk/cli/node).

    Повний перезапуск потрібен для змін `gateway`, `discovery` і `canvasHost`.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати config?">
    Так.

    - `config.schema.lookup`: перевіряє одне піддерево config із його вузлом поверхневої схеми, відповідною UI-підказкою та підсумками безпосередніх дочірніх елементів перед записом
    - `config.get`: отримує поточний snapshot + hash
    - `config.patch`: безпечне часткове оновлення (рекомендовано для більшості редагувань RPC); виконує hot-reload, коли можливо, і перезапуск, коли потрібно
    - `config.apply`: перевіряє й замінює весь config; виконує hot-reload, коли можливо, і перезапуск, коли потрібно
    - Інструмент виконання `gateway` лише для власника, як і раніше, відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

  </Accordion>

  <Accordion title="Мінімальний осмислений config для першого встановлення">
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

    1. **Встановіть і виконайте вхід на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Встановіть і виконайте вхід на Mac**
       - Використайте застосунок Tailscale і увійдіть до тієї самої tailnet.
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

  <Accordion title="Як під’єднати Mac Node до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Gateway Control UI + WS**. Nodes підключаються через ту саму кінцеву точку Gateway WS.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS і Mac перебувають в одній tailnet**.
    2. **Використовуйте застосунок macOS у режимі Remote** (ціллю SSH може бути ім’я хоста tailnet).
       Застосунок протунелює порт Gateway і підключиться як node.
    3. **Схваліть node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Протокол Gateway](/uk/gateway/protocol), [Discovery](/uk/gateway/discovery), [Віддалений режим macOS](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи варто встановлювати систему на другий ноутбук чи просто додати node?">
    Якщо вам потрібні лише **локальні інструменти** (screen/camera/exec) на другому ноутбуці, додайте його як
    **node**. Це зберігає один Gateway і дозволяє уникнути дублювання config. Локальні інструменти node
    наразі доступні лише для macOS, але ми плануємо розширити їх на інші ОС.

    Встановлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes), [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars і завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує environment variables?">
    OpenClaw читає env vars із батьківського процесу (оболонка, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` з поточного робочого каталогу
    - глобальний резервний `.env` з `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден із файлів `.env` не перевизначає наявні env vars.

    Ви також можете визначити inline env vars у config (застосовуються лише якщо їх немає в env процесу):

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

  <Accordion title="Я запустив Gateway через службу, і мої env vars зникли. Що тепер?">
    Є два поширені способи виправити це:

    1. Розмістіть відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися, навіть коли служба не успадковує env вашої оболонки.
    2. Увімкніть імпорт оболонки (додаткова зручність):

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
    `openclaw models status` показує, чи увімкнено **імпорт env оболонки**. "Shell env: off"
    **не** означає, що ваших env vars немає — це лише означає, що OpenClaw не завантажуватиме
    вашу login shell автоматично.

    Якщо Gateway працює як служба (launchd/systemd), він не успадковує env
    вашої оболонки. Виправити це можна одним із таких способів:

    1. Розмістіть токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або увімкніть імпорт оболонки (`env.shellEnv.enabled: true`).
    3. Або додайте його в блок `env` свого config (застосовується лише якщо значення відсутнє).

    Потім перезапустіть gateway і перевірте ще раз:

    ```bash
    openclaw models status
    ```

    Токени Copilot зчитуються з `COPILOT_GITHUB_TOKEN` (також `GH_TOKEN` / `GITHUB_TOKEN`).
    Див. [/concepts/model-providers](/uk/concepts/model-providers) і [/environment](/uk/help/environment).

  </Accordion>
</AccordionGroup>

## Sessions і кілька чатів

<AccordionGroup>
  <Accordion title="Як почати нову розмову?">
    Надішліть `/new` або `/reset` як окреме повідомлення. Див. [Керування sessions](/uk/concepts/session).
  </Accordion>

  <Accordion title="Чи sessions скидаються автоматично, якщо я ніколи не надсилаю /new?">
    Sessions можуть завершуватися після `session.idleMinutes`, але це **типово вимкнено** (типове значення **0**).
    Задайте додатне значення, щоб увімкнути завершення через неактивність. Коли це ввімкнено, **наступне**
    повідомлення після періоду неактивності починає новий ідентифікатор session для цього ключа чату.
    Це не видаляє транскрипти — лише починає нову session.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб створити команду екземплярів OpenClaw (один CEO і багато agents)?">
    Так, через **маршрутизацію multi-agent** і **sub-agents**. Ви можете створити одного agent-координатора
    і кількох agent-воркерів із власними workspace та моделями.

    Водночас це краще розглядати як **цікавий експеримент**. Це витратно за токенами й часто
    менш ефективно, ніж використання одного бота з окремими sessions. Типова модель, яку ми
    уявляємо, — це один бот, з яким ви спілкуєтеся, із різними sessions для паралельної роботи. Цей
    бот також може породжувати sub-agents за потреби.

    Документація: [Маршрутизація multi-agent](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [CLI Agents](/uk/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст було урізано посеред завдання? Як цьому запобігти?">
    Контекст session обмежений вікном моделі. Довгі чати, великий вивід інструментів або багато
    файлів можуть запускати compaction або truncation.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими завданнями та `/new` при зміні теми.
    - Тримайте важливий контекст у workspace і просіть бота перечитати його.
    - Використовуйте sub-agents для довгої або паралельної роботи, щоб основний чат залишався меншим.
    - Виберіть модель із більшим вікном контексту, якщо це трапляється часто.

  </Accordion>

  <Accordion title="Як повністю скинути OpenClaw, але залишити його встановленим?">
    Використовуйте команду reset:

    ```bash
    openclaw reset
    ```

    Неінтерактивне повне скидання:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Потім знову виконайте налаштування:

    ```bash
    openclaw onboard --install-daemon
    ```

    Примітки:

    - Onboarding також пропонує **Reset**, якщо бачить наявний config. Див. [Onboarding (CLI)](/uk/start/wizard).
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скиньте кожен каталог стану (типово це `~/.openclaw-<profile>`).
    - Скидання dev: `openclaw gateway --dev --reset` (лише для dev; стирає dev config + credentials + sessions + workspace).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або виконати compact?'>
    Використайте один із цих варіантів:

    - **Compact** (зберігає розмову, але підсумовує старіші ходи):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб спрямувати підсумок.

    - **Reset** (новий ідентифікатор session для того самого ключа чату):

      ```
      /new
      /reset
      ```

    Якщо це продовжує траплятися:

    - Увімкніть або налаштуйте **обрізання session** (`agents.defaults.contextPruning`), щоб прибирати старий вивід інструментів.
    - Використовуйте модель із більшим вікном контексту.

    Документація: [Compaction](/uk/concepts/compaction), [Обрізання session](/uk/concepts/session-pruning), [Керування sessions](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка перевірки provider: модель згенерувала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що історія session застаріла або пошкоджена (часто після довгих thread
    або зміни tool/schema).

    Виправлення: почніть нову session за допомогою `/new` (окремим повідомленням).

  </Accordion>

  <Accordion title="Чому я отримую повідомлення heartbeat кожні 30 хвилин?">
    Heartbeat типово виконується кожні **30m** (**1h** при використанні OAuth auth). Налаштуйте або вимкніть це:

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
    на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб заощадити API calls.
    Якщо файла немає, heartbeat усе одно виконується, і модель сама вирішує, що робити.

    Для перевизначення на рівні agent використовуйте `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "обліковий запис бота" до групи WhatsApp?'>
    Ні. OpenClaw працює від **вашого власного облікового запису**, тож якщо ви є в групі, OpenClaw може її бачити.
    Типово відповіді в групах заблоковано, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

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
    Варіант 1 (найшвидший): переглядайте логи й надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Шукайте `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/додано в allowlist): перелічіть групи з config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/uk/cli/directory), [Логи](/uk/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Дві поширені причини:

    - Увімкнено обмеження за згадками (типово). Ви маєте @згадати бота (або відповідати `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і групу не додано до allowlist.

    Див. [Групи](/uk/channels/groups) і [Повідомлення в групах](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи групи/thread ділять контекст із DM?">
    Прямі чати типово згортаються до основної session. Групи/канали мають власні ключі session, а теми Telegram / threads Discord — це окремі sessions. Див. [Групи](/uk/channels/groups) і [Повідомлення в групах](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки workspaces і agents я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але звертайте увагу на:

    - **Зростання диска:** sessions + транскрипти зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартість токенів:** більше agents означає більше одночасного використання моделей.
    - **Операційні витрати:** профілі auth для окремих agents, workspaces і маршрутизація channel.

    Поради:

    - Тримайте один **активний** workspace для кожного agent (`agents.defaults.workspace`).
    - Очищуйте старі sessions (видаляйте JSONL або записи сховища), якщо диск розростається.
    - Використовуйте `openclaw doctor`, щоб виявляти stray workspaces і невідповідності профілів.

  </Accordion>

  <Accordion title="Чи можу я запускати кількох ботів або чатів одночасно (Slack), і як це краще налаштувати?">
    Так. Використовуйте **Маршрутизацію Multi-Agent**, щоб запускати кілька ізольованих agents і маршрутизувати вхідні повідомлення за
    channel/account/peer. Slack підтримується як channel і може бути прив’язаний до конкретних agents.

    Доступ до browser потужний, але це не «зробити все, що може людина» — anti-bot механізми, CAPTCHA і MFA
    все одно можуть блокувати автоматизацію. Для найнадійнішого керування browser використовуйте локальний Chrome MCP на хості
    або CDP на машині, яка фактично запускає browser.

    Рекомендоване налаштування:

    - Хост Gateway, що завжди ввімкнений (VPS/Mac mini).
    - Один agent на роль (прив’язки).
    - Slack channel(и), прив’язані до цих agents.
    - Локальний browser через Chrome MCP або node за потреби.

    Документація: [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Browser](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі: значення за замовчуванням, вибір, псевдоніми, перемикання

<AccordionGroup>
  <Accordion title='Що таке "модель за замовчуванням"?'>
    Типова модель OpenClaw — це те, що ви задаєте як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються як `provider/model` (приклад: `openai/gpt-5.4`). Якщо ви пропускаєте provider, OpenClaw спочатку пробує псевдонім, потім унікальний збіг налаштованого provider для точного id цієї моделі, і лише після цього переходить до налаштованого provider за замовчуванням як до застарілого шляху сумісності. Якщо цей provider більше не відкриває налаштовану модель за замовчуванням, OpenClaw переключається на перший налаштований provider/model замість того, щоб показувати застаріле типове значення з видаленого provider. Проте вам усе одно слід **явно** задавати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендований варіант за замовчуванням:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку providers.
    **Для agents з увімкненими tools або з недовіреним входом:** ставте силу моделі вище за вартість.
    **Для звичайного/низькоризикового чату:** використовуйте дешевші резервні моделі й маршрутизуйте за роллю agent.

    Для MiniMax є окрема документація: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Практичне правило: використовуйте **найкращу модель, яку можете собі дозволити** для високоризикової роботи, і дешевшу
    модель для звичайного чату або підсумків. Ви можете маршрутизувати моделі для кожного agent і використовувати sub-agents для
    паралелізації довгих завдань (кожен sub-agent споживає токени). Див. [Моделі](/uk/concepts/models) і
    [Sub-agents](/uk/tools/subagents).

    Серйозне попередження: слабші/надто квантизовані моделі вразливіші до prompt
    injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі без стирання config?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни config.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для окремої session)
    - `openclaw models set ...` (оновлює лише config model)
    - `openclaw configure --section model` (інтерактивно)
    - редагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` з частковим об’єктом, якщо ви не хочете замінити весь config.
    Для редагування RPC спочатку перевіряйте через `config.schema.lookup` і надавайте перевагу `config.patch`. Payload lookup дає вам нормалізований шлях, документацію/обмеження поверхневої схеми та підсумки безпосередніх дочірніх елементів
    для часткових оновлень.
    Якщо ви таки перезаписали config, відновіть його з резервної копії або повторно виконайте `openclaw doctor` для виправлення.

    Документація: [Моделі](/uk/concepts/models), [Configure](/uk/cli/configure), [Config](/uk/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати self-hosted моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Встановіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо вам потрібні також хмарні моделі, виконайте `ollama signin`
    4. Виконайте `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає вам хмарні моделі плюс ваші локальні моделі Ollama
    - хмарні моделі, як-от `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка з безпеки: менші або сильно квантизовані моделі вразливіші до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати tools.
    Якщо ви все ж хочете малі моделі, увімкніть ізоляцію та строгі allowlist для tools.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Провайдери моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Ізоляція](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - У цих розгортаннях усе може відрізнятися й змінюватися з часом; фіксованої рекомендації щодо provider немає.
    - Перевіряйте поточне налаштування під час роботи на кожному gateway через `openclaw models status`.
    - Для чутливих до безпеки agents / agents з увімкненими tools використовуйте найсильнішу модель останнього покоління з доступних.
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

    Це вбудовані псевдоніми. Користувацькі псевдоніми можна додати через `agents.defaults.models`.

    Ви можете перелічити доступні моделі через `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований вибір. Вибір за номером:

    ```
    /model 3
    ```

    Ви також можете примусово вибрати конкретний профіль auth для provider (для окремої session):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який agent активний, який файл `auth-profiles.json` використовується і який профіль auth буде спробовано наступним.
    Він також показує налаштований endpoint provider (`baseUrl`) і режим API (`api`), коли вони доступні.

    **Як зняти закріплення профілю, який я задав через @profile?**

    Повторно виконайте `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо ви хочете повернутися до типового значення, виберіть його через `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль auth активний.

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.2 для щоденних завдань, а Codex 5.3 — для кодування?">
    Так. Задайте одну модель як типову й перемикайтеся за потреби:

    - **Швидке перемикання (для окремої session):** `/model gpt-5.4` для щоденних завдань, `/model openai-codex/gpt-5.4` для кодування через OAuth Codex.
    - **Типове значення + перемикання:** задайте `agents.defaults.model.primary` як `openai/gpt-5.4`, а потім перемикайтеся на `openai-codex/gpt-5.4` під час кодування (або навпаки).
    - **Sub-agents:** маршрутизуйте завдання кодування до sub-agents з іншою типовою моделлю.

    Див. [Моделі](/uk/concepts/models) і [Слеш-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати fast mode для GPT 5.4?">
    Використовуйте або перемикач session, або типове значення в config:

    - **Для окремої session:** надішліть `/fast on`, поки session використовує `openai/gpt-5.4` або `openai-codex/gpt-5.4`.
    - **Типове значення для моделі:** задайте `agents.defaults.models["openai/gpt-5.4"].params.fastMode` як `true`.
    - **Також для OAuth Codex:** якщо ви також використовуєте `openai-codex/gpt-5.4`, задайте той самий прапорець і там.

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

    Для OpenAI fast mode відображається в `service_tier = "priority"` у підтримуваних нативних запитах Responses. `/fast` для session перевизначає типові значення config.

    Див. [Thinking і fast mode](/uk/tools/thinking) та [OpenAI fast mode](/uk/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо задано `agents.defaults.models`, це стає **allowlist** для `/model` і будь-яких
    перевизначень session. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, приберіть allowlist або виберіть модель із `/model list`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **provider не налаштований** (не знайдено config provider MiniMax або
    профіль auth), тому модель не вдається розв’язати.

    Чекліст виправлення:

    1. Оновіться до актуального релізу OpenClaw (або запускайте з вихідного коду `main`), а потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (майстром або через JSON), або що auth MiniMax
       існує в env/auth profiles, щоб можна було інжектувати відповідний provider
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений MiniMax
       OAuth для `minimax-portal`).
    3. Використовуйте точний id моделі (з урахуванням регістру) для вашого шляху auth:
       `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed` для налаштування
       з API key, або `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` для налаштування з OAuth.
    4. Виконайте:

       ```bash
       openclaw models list
       ```

       і виберіть зі списку (або `/model list` у чаті).

    Див. [MiniMax](/uk/providers/minimax) і [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати MiniMax як типову модель, а OpenAI — для складних завдань?">
    Так. Використовуйте **MiniMax як типову модель** і перемикайте моделі **для окремої session** за потреби.
    Fallback призначені для **помилок**, а не для «складних завдань», тому використовуйте `/model` або окремий agent.

    **Варіант A: перемикання для окремої session**

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

    - Типова модель agent A: MiniMax
    - Типова модель agent B: OpenAI
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

    Якщо ви задасте власний псевдонім із такою самою назвою, ваше значення матиме пріоритет.

  </Accordion>

  <Accordion title="Як визначати/перевизначати скорочення моделей (псевдоніми)?">
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

  <Accordion title="Як додати моделі від інших providers, як-от OpenRouter або Z.AI?">
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

    Якщо ви посилаєтеся на `provider/model`, але потрібний ключ provider відсутній, ви отримаєте помилку auth під час роботи (наприклад `No API key found for provider "zai"`).

    **No API key found for provider після додавання нового agent**

    Зазвичай це означає, що **новий agent** має порожнє сховище auth. Auth є окремим для кожного agent і
    зберігається в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Виконайте `openclaw agents add <id>` і налаштуйте auth під час майстра.
    - Або скопіюйте `auth-profiles.json` з `agentDir` основного agent до `agentDir` нового agent.

    **Не** використовуйте повторно `agentDir` між agents; це спричиняє конфлікти auth/session.

  </Accordion>
</AccordionGroup>

## Перемикання моделей у разі збою та «All models failed»

<AccordionGroup>
  <Accordion title="Як працює перемикання в разі збою?">
    Перемикання в разі збою відбувається у два етапи:

    1. **Ротація профілів auth** у межах того самого provider.
    2. **Fallback моделі** до наступної моделі в `agents.defaults.model.fallbacks`.

    До профілів, що дають збої, застосовуються cooldown (експоненційний backoff), тож OpenClaw може продовжувати відповідати навіть тоді, коли provider упирається в rate limit або тимчасово недоступний.

    Кошик rate-limit включає більше, ніж просто відповіді `429`. OpenClaw
    також вважає такими, що варті failover, повідомлення на кшталт `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    обмеження вікна використання (`weekly/monthly limit reached`).

    Деякі відповіді, схожі на billing, не є `402`, а деякі відповіді HTTP `402`
    також залишаються в цьому тимчасовому кошику. Якщо provider повертає
    явний текст billing у `401` або `403`, OpenClaw все одно може залишити це
    в смузі billing, але text matcher, специфічні для provider, залишаються в межах
    provider, якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Якщо ж повідомлення `402`
    більше схоже на повторюване вікно використання або
    обмеження витрат організації/робочого простору (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw трактує це як
    `rate_limit`, а не як довготривале вимкнення через billing.

    Помилки переповнення контексту — інші: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху compaction/retry замість переходу до model
    fallback.

    Узагальнений текст server-error навмисно вужчий, ніж «усе, де є
    unknown/error». OpenClaw вважає вартими failover перехідні форми,
    обмежені provider, як-от голе Anthropic `An unknown error occurred`, голе OpenRouter
    `Provider returned error`, помилки stop-reason на кшталт `Unhandled stop reason:
    error`, JSON payload `api_error` з перехідним серверним текстом
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості provider на кшталт `ModelNotReadyException` як
    сигнали timeout/перевантаження, що варті failover, коли контекст provider
    збігається.
    Узагальнений внутрішній fallback-текст на кшталт `LLM request failed with an unknown
    error.` навмисно обробляється обережно і сам по собі не запускає model fallback.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система намагалася використати id профілю auth `anthropic:default`, але не змогла знайти облікові дані для нього в очікуваному сховищі auth.

    **Чекліст виправлення:**

    - **Підтвердьте, де зберігаються профілі auth** (нові чи застарілі шляхи)
      - Поточний: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`)
    - **Підтвердьте, що ваш env var завантажується Gateway**
      - Якщо ви задали `ANTHROPIC_API_KEY` у своїй оболонці, але запускаєте Gateway через systemd/launchd, він може його не успадкувати. Розмістіть його в `~/.openclaw/.env` або увімкніть `env.shellEnv`.
    - **Переконайтеся, що ви редагуєте правильного agent**
      - У multi-agent налаштуваннях може бути кілька файлів `auth-profiles.json`.
    - **Перевірте стан model/auth**
      - Використовуйте `openclaw models status`, щоб побачити налаштовані моделі й те, чи пройшли providers автентифікацію.

    **Чекліст виправлення для "No credentials found for profile anthropic"**

    Це означає, що запуск прив’язаний до профілю auth Anthropic, але Gateway
    не може знайти його у своєму сховищі auth.

    - **Використовуйте Claude CLI**
      - Виконайте `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо ви хочете натомість використовувати API key**
      - Розмістіть `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистьте будь-який закріплений порядок, який примушує використовувати відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Підтвердьте, що ви виконуєте команди на хості gateway**
      - У remote mode профілі auth живуть на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому система також спробувала Google Gemini і зазнала збою?">
    Якщо ваш config model містить Google Gemini як fallback (або ви переключилися на скорочення Gemini), OpenClaw спробує його під час model fallback. Якщо ви не налаштували облікові дані Google, ви побачите `No API key found for provider "google"`.

    Виправлення: або надайте auth Google, або приберіть/уникайте моделей Google в `agents.defaults.model.fallbacks` / псевдонімах, щоб fallback не маршрутизував туди.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Причина: історія session містить **блоки thinking без підписів** (часто від
    перерваного/часткового потоку). Google Antigravity вимагає підписів для блоків thinking.

    Виправлення: OpenClaw тепер видаляє непідписані блоки thinking для Google Antigravity Claude. Якщо це все ще з’являється, почніть **нову session** або задайте `/thinking off` для цього agent.

  </Accordion>
</AccordionGroup>

## Профілі auth: що це таке і як ними керувати

Пов’язане: [/concepts/oauth](/uk/concepts/oauth) (потоки OAuth, зберігання токенів, шаблони для кількох облікових записів)

<AccordionGroup>
  <Accordion title="Що таке профіль auth?">
    Профіль auth — це іменований запис облікових даних (OAuth або API key), прив’язаний до provider. Профілі зберігаються в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Які типові id профілів?">
    OpenClaw використовує id з префіксом provider, наприклад:

    - `anthropic:default` (поширено, коли немає ідентичності email)
    - `anthropic:<email>` для ідентичностей OAuth
    - користувацькі id, які ви задаєте (наприклад `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який профіль auth пробується першим?">
    Так. Config підтримує необов’язкові метадані для профілів і порядок для кожного provider (`auth.order.<provider>`). Це **не** зберігає секрети; воно зіставляє id із provider/mode і задає порядок ротації.

    OpenClaw може тимчасово пропустити профіль, якщо він перебуває в короткому **cooldown** (rate limits/timeouts/auth failures) або в довшому стані **disabled** (billing/insufficient credits). Щоб перевірити це, виконайте `openclaw models status --json` і перевірте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Cooldown для rate-limit можуть бути прив’язані до моделі. Профіль, який перебуває в cooldown
    для однієї моделі, усе ще може бути придатним для спорідненої моделі в того самого provider,
    тоді як вікна billing/disabled як і раніше блокують увесь профіль.

    Ви також можете задати **перевизначення порядку для окремого agent** (зберігається в `auth-state.json` цього agent) через CLI:

    ```bash
    # Типово націлюється на типового agent з config (пропустіть --agent)
    openclaw models auth order get --provider anthropic

    # Заблокувати ротацію до одного профілю (пробувати лише його)
    openclaw models auth order set --provider anthropic anthropic:default

    # Або задати явний порядок (fallback у межах provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Очистити перевизначення (повернутися до config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Щоб націлитися на конкретного agent:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Щоб перевірити, що саме реально буде спробовано, використовуйте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль пропущено в явному порядку, probe повідомить
    `excluded_by_auth_order` для цього профілю замість того, щоб мовчки його пробувати.

  </Accordion>

  <Accordion title="OAuth чи API key — у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за підпискою (де це застосовно).
    - **API keys** використовують білінг за токени.

    Майстер явно підтримує Anthropic Claude CLI, OpenAI Codex OAuth і API keys.

  </Accordion>
</AccordionGroup>

## Gateway: порти, «already running» і remote mode

<AccordionGroup>
  <Accordion title="Який порт використовує Gateway?">
    `gateway.port` керує єдиним мультиплексованим портом для WebSocket + HTTP (Control UI, hooks тощо).

    Пріоритет:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Чому `openclaw gateway status` показує "Runtime: running", але "Connectivity probe: failed"?'>
    Тому що "running" — це погляд **supervisor** (launchd/systemd/schtasks). А connectivity probe — це фактичне підключення CLI до Gateway WebSocket.

    Використовуйте `openclaw gateway status` і довіряйте цим рядкам:

    - `Probe target:` (URL, який probe реально використав)
    - `Listening:` (що насправді прив’язано до порту)
    - `Last gateway error:` (типова коренева причина, коли процес живий, але порт не слухає)

  </Accordion>

  <Accordion title='Чому `openclaw gateway status` показує різні "Config (cli)" і "Config (service)"?'>
    Ви редагуєте один файл config, а служба працює з іншим (часто через невідповідність `--profile` / `OPENCLAW_STATE_DIR`).

    Виправлення:

    ```bash
    openclaw gateway install --force
    ```

    Виконуйте це з того самого `--profile` / середовища, яке служба має використовувати.

  </Accordion>

  <Accordion title='Що означає "another gateway instance is already listening"?'>
    OpenClaw примусово забезпечує блокування під час роботи, негайно прив’язуючи слухач WebSocket під час запуску (типово `ws://127.0.0.1:18789`). Якщо прив’язка завершується помилкою `EADDRINUSE`, викидається `GatewayLockError`, що означає: інший екземпляр уже слухає.

    Виправлення: зупиніть інший екземпляр, звільніть порт або запускайте з `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Як запускати OpenClaw у remote mode (client підключається до Gateway деінде)?">
    Задайте `gateway.mode: "remote"` і вкажіть URL віддаленого WebSocket, за потреби додавши віддалені облікові дані зі спільним секретом:

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

    - `openclaw gateway` запускається лише тоді, коли `gateway.mode` дорівнює `local` (або ви передали прапорець перевизначення).
    - Застосунок macOS стежить за файлом config і перемикає режими наживо, коли ці значення змінюються.
    - `gateway.remote.token` / `.password` — це лише віддалені облікові дані на боці client; самі по собі вони не вмикають auth локального gateway.

  </Accordion>

  <Accordion title='Control UI показує "unauthorized" (або постійно перепідключається). Що тепер?'>
    Ваш шлях auth gateway і метод auth у UI не збігаються.

    Факти (з коду):

    - Control UI зберігає токен у `sessionStorage` для поточної сесії вкладки браузера і вибраного URL gateway, тому оновлення в тій самій вкладці продовжують працювати без відновлення довготривалого зберігання токена в localStorage.
    - За `AUTH_TOKEN_MISMATCH` довірені clients можуть виконати одну обмежену повторну спробу з кешованим токеном пристрою, коли gateway повертає підказки для повтору (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ця повторна спроба з кешованим токеном тепер повторно використовує кешовані схвалені scope, збережені разом із токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` усе одно зберігають запитаний набір scope замість успадковування кешованих scope.
    - Поза цим шляхом повторної спроби пріоритет auth для підключення такий: спочатку явний спільний токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap-токен.
    - Перевірки scope bootstrap-токена мають префікс ролі. Вбудований allowlist bootstrap-operator задовольняє лише запити operator; node або інші ролі, відмінні від operator, усе одно потребують scope під власним префіксом ролі.

    Виправлення:

    - Найшвидше: `openclaw dashboard` (друкує + копіює URL dashboard, намагається відкрити; якщо середовище headless, показує підказку для SSH).
    - Якщо у вас ще немає токена: `openclaw doctor --generate-gateway-token`.
    - Якщо ви працюєте віддалено, спочатку створіть tunnel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`.
    - Режим зі спільним секретом: задайте `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, а потім вставте відповідний секрет у налаштуваннях Control UI.
    - Режим Tailscale Serve: переконайтеся, що `gateway.auth.allowTailscale` увімкнено і ви відкриваєте URL Serve, а не сирий URL loopback/tailnet, який обходить заголовки ідентичності Tailscale.
    - Режим trusted-proxy: переконайтеся, що ви заходите через налаштований не-loopback proxy з awareness ідентичності, а не через loopback proxy на тому самому хості чи сирий URL gateway.
    - Якщо невідповідність зберігається після однієї повторної спроби, ротуйте/повторно схваліть токен paired device:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Якщо виклик rotate каже, що його відхилено, перевірте дві речі:
      - сесії paired-device можуть ротувати лише **власний** пристрій, якщо лише вони не мають також `operator.admin`
      - явні значення `--scope` не можуть перевищувати поточні scope operator викликача
    - Усе ще застрягли? Виконайте `openclaw status --all` і дотримуйтесь [Усунення несправностей](/uk/gateway/troubleshooting). Деталі auth див. у [Dashboard](/uk/web/dashboard).

  </Accordion>

  <Accordion title="Я встановив gateway.bind tailnet, але прив’язка не виконується і нічого не слухає">
    Bind `tailnet` вибирає IP Tailscale з мережевих інтерфейсів (100.64.0.0/10). Якщо машина не в Tailscale (або інтерфейс вимкнено), прив’язуватися нема до чого.

    Виправлення:

    - Запустіть Tailscale на цьому хості (щоб він мав адресу 100.x), або
    - переключіться на `gateway.bind: "loopback"` / `"lan"`.

    Примітка: `tailnet` — явний режим. `auto` надає перевагу loopback; використовуйте `gateway.bind: "tailnet"`, коли вам потрібна прив’язка лише до tailnet.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька Gateway на одному хості?">
    Зазвичай ні — один Gateway може обслуговувати кілька channels і agents. Використовуйте кілька Gateway лише тоді, коли вам потрібне резервування (наприклад, аварійний бот) або жорстка ізоляція.

    Так, але потрібно ізолювати:

    - `OPENCLAW_CONFIG_PATH` (config для кожного екземпляра)
    - `OPENCLAW_STATE_DIR` (state для кожного екземпляра)
    - `agents.defaults.workspace` (ізоляція workspace)
    - `gateway.port` (унікальні порти)

    Швидке налаштування (рекомендовано):

    - Використовуйте `openclaw --profile <name> ...` для кожного екземпляра (автоматично створює `~/.openclaw-<name>`).
    - Задайте унікальний `gateway.port` у config кожного профілю (або передавайте `--port` для ручних запусків).
    - Встановіть службу для кожного профілю: `openclaw --profile <name> gateway install`.

    Профілі також додають суфікси до назв служб (`ai.openclaw.<profile>`; застарілі `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Повний посібник: [Кілька Gateway](/uk/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Що означає "invalid handshake" / код 1008?'>
    Gateway — це **сервер WebSocket**, і він очікує, що першим повідомленням
    буде кадр `connect`. Якщо він отримує щось інше, він закриває з’єднання
    з **кодом 1008** (порушення політики).

    Поширені причини:

    - Ви відкрили URL **HTTP** у браузері (`http://...`) замість клієнта WS.
    - Ви використали неправильний порт або шлях.
    - Proxy або tunnel прибрав заголовки auth чи надіслав запит, що не належить Gateway.

    Швидкі виправлення:

    1. Використовуйте URL WS: `ws://<host>:18789` (або `wss://...`, якщо HTTPS).
    2. Не відкривайте порт WS у звичайній вкладці браузера.
    3. Якщо auth увімкнено, включіть токен/пароль у кадр `connect`.

    Якщо ви використовуєте CLI або TUI, URL має виглядати так:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Подробиці протоколу: [Протокол Gateway](/uk/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Логи й налагодження

<AccordionGroup>
  <Accordion title="Де логи?">
    Файлові логи (структуровані):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Ви можете задати стабільний шлях через `logging.file`. Рівень файлового логування контролюється `logging.level`. Докладність консолі контролюється через `--verbose` і `logging.consoleLevel`.

    Найшвидший перегляд хвоста логів:

    ```bash
    openclaw logs --follow
    ```

    Логи служби/supervisor (коли gateway працює через launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` і `gateway.err.log` (типово: `~/.openclaw/logs/...`; профілі використовують `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Більше див. в [Усуненні несправностей](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Як запускати/зупиняти/перезапускати службу Gateway?">
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
    Почніть із швидкої перевірки стану:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Поширені причини:

    - Auth моделі не завантажено на **хості gateway** (перевірте `models status`).
    - Pairing/allowlist channel блокує відповіді (перевірте config channel + логи).
    - WebChat/Dashboard відкрито без правильного токена.

    Якщо ви працюєте віддалено, переконайтеся, що tunnel/Tailscale-з’єднання активне і що
    Gateway WebSocket доступний.

    Документація: [Channels](/uk/channels), [Усунення несправностей](/uk/gateway/troubleshooting), [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — що тепер?'>
    Зазвичай це означає, що UI втратив з’єднання WebSocket. Перевірте:

    1. Чи працює Gateway? `openclaw gateway status`
    2. Чи справний Gateway? `openclaw status`
    3. Чи має UI правильний токен? `openclaw dashboard`
    4. Якщо ви працюєте віддалено, чи активне з’єднання tunnel/Tailscale?

    Потім перегляньте хвіст логів:

    ```bash
    openclaw logs --follow
    ```

    Документація: [Dashboard](/uk/web/dashboard), [Віддалений доступ](/uk/gateway/remote), [Усунення несправностей](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Не вдається виконати Telegram setMyCommands. Що перевірити?">
    Почніть із логів і стану channel:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Потім зіставте помилку:

    - `BOT_COMMANDS_TOO_MUCH`: у меню Telegram забагато записів. OpenClaw уже обрізає список до ліміту Telegram і повторює спробу з меншою кількістю команд, але деякі пункти меню все одно треба прибрати. Зменште кількість команд Plugin/skill/custom або вимкніть `channels.telegram.commands.native`, якщо меню вам не потрібне.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` або подібні мережеві помилки: якщо ви на VPS або за proxy, переконайтеся, що вихідний HTTPS дозволено й DNS працює для `api.telegram.org`.

    Якщо Gateway віддалений, переконайтеся, що ви дивитеся логи на хості Gateway.

    Документація: [Telegram](/uk/channels/telegram), [Усунення несправностей каналів](/uk/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI не показує вивід. Що перевірити?">
    Спочатку переконайтеся, що Gateway доступний і agent може працювати:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    У TUI використовуйте `/status`, щоб побачити поточний стан. Якщо ви очікуєте відповіді в chat
    channel, переконайтеся, що доставку ввімкнено (`/deliver on`).

    Документація: [TUI](/uk/web/tui), [Слеш-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як повністю зупинити, а потім запустити Gateway?">
    Якщо ви встановили службу:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Це зупиняє/запускає **керовану службу** (launchd на macOS, systemd на Linux).
    Використовуйте це, коли Gateway працює у фоновому режимі як daemon.

    Якщо ви запускаєте його на передньому плані, зупиніть через Ctrl-C, а потім:

    ```bash
    openclaw gateway run
    ```

    Документація: [Runbook служби Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Поясніть просто: `openclaw gateway restart` vs `openclaw gateway`">
    - `openclaw gateway restart`: перезапускає **фонову службу** (launchd/systemd).
    - `openclaw gateway`: запускає gateway **на передньому плані** для цієї сесії термінала.

    Якщо ви встановили службу, використовуйте команди gateway. Використовуйте `openclaw gateway`, коли
    вам потрібен одноразовий запуск на передньому плані.

  </Accordion>

  <Accordion title="Найшвидший спосіб отримати більше деталей, коли щось ламається">
    Запустіть Gateway з `--verbose`, щоб отримати більше деталей у консолі. Потім перевірте файл логу на предмет auth каналу, маршрутизації моделей і помилок RPC.
  </Accordion>
</AccordionGroup>

## Медіа й вкладення

<AccordionGroup>
  <Accordion title="Мій skill згенерував зображення/PDF, але нічого не було надіслано">
    Вихідні вкладення від agent мають містити рядок `MEDIA:<path-or-url>` (в окремому рядку). Див. [Налаштування assistant OpenClaw](/uk/start/openclaw) і [Надсилання Agent](/uk/tools/agent-send).

    Надсилання через CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Також перевірте:

    - Цільовий channel підтримує вихідні медіа і не заблокований allowlist.
    - Файл не перевищує обмеження розміру provider (зображення змінюються до максимуму 2048px).
    - `tools.fs.workspaceOnly=true` обмежує надсилання локальних шляхів workspace, temp/media-store і файлами, перевіреними ізоляцією.
    - `tools.fs.workspaceOnly=false` дозволяє `MEDIA:` надсилати локальні файли хоста, які agent уже може читати, але лише для медіа плюс безпечних типів документів (зображення, аудіо, відео, PDF і документи Office). Звичайний текст і файли, схожі на секрети, усе одно блокуються.

    Див. [Зображення](/uk/nodes/images).

  </Accordion>
</AccordionGroup>

## Безпека й контроль доступу

<AccordionGroup>
  <Accordion title="Чи безпечно відкривати OpenClaw для вхідних DM?">
    Ставтеся до вхідних DM як до недовіреного входу. Типові значення налаштовано так, щоб зменшувати ризик:

    - Типова поведінка в channels із підтримкою DM — це **pairing**:
      - Невідомі відправники отримують код pairing; бот не обробляє їхнє повідомлення.
      - Схвалення: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Кількість очікуваних запитів обмежена **3 на канал**; перевіряйте `openclaw pairing list --channel <channel> [--account <id>]`, якщо код не надійшов.
    - Публічне відкриття DM вимагає явного увімкнення (`dmPolicy: "open"` і allowlist `"*"`).

    Запустіть `openclaw doctor`, щоб виявити ризиковані політики DM.

  </Accordion>

  <Accordion title="Чи prompt injection — це проблема лише для публічних ботів?">
    Ні. Prompt injection — це про **недовірений вміст**, а не лише про те, хто може надсилати боту DM.
    Якщо ваш assistant читає зовнішній вміст (web search/fetch, сторінки browser, emails,
    docs, вкладення, вставлені логи), цей вміст може містити інструкції, які намагаються
    перехопити керування моделлю. Це може статися, навіть якщо **ви єдиний відправник**.

    Найбільший ризик виникає, коли ввімкнено tools: модель можна обдурити й змусити
    ексфільтрувати контекст або викликати tools від вашого імені. Зменшуйте радіус ураження так:

    - використовуйте лише для читання або без tools agent типу «reader» для підсумування недовіреного вмісту
    - тримайте `web_search` / `web_fetch` / `browser` вимкненими для agents з увімкненими tools
    - також ставтеся до декодованого тексту файлів/документів як до недовіреного: OpenResponses
      `input_file` і витягування тексту з медіавкладень обгортають витягнутий текст у
      явні маркери меж зовнішнього вмісту замість передавання сирого тексту файла
    - використовуйте ізоляцію та строгі allowlist для tools

    Подробиці: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи має бот мати власну електронну пошту, обліковий запис GitHub або номер телефону?">
    Так, для більшості сценаріїв. Ізоляція бота за допомогою окремих облікових записів і номерів телефону
    зменшує радіус ураження, якщо щось піде не так. Це також полегшує ротацію
    облікових даних або відкликання доступу без впливу на ваші особисті облікові записи.

    Починайте з малого. Надавайте доступ лише до тих tools і облікових записів, які справді потрібні, і розширюйте
    його пізніше за потреби.

    Документація: [Безпека](/uk/gateway/security), [Pairing](/uk/channels/pairing).

  </Accordion>

  <Accordion title="Чи можу я надати йому автономність над моїми текстовими повідомленнями і чи це безпечно?">
    Ми **не** рекомендуємо повну автономність над вашими особистими повідомленнями. Найбезпечніший шаблон такий:

    - Тримайте DM у режимі **pairing** або в жорсткому allowlist.
    - Використовуйте **окремий номер або обліковий запис**, якщо хочете, щоб він надсилав повідомлення від вашого імені.
    - Нехай він створює чернетку, а ви **схвалюєте перед надсиланням**.

    Якщо хочете поекспериментувати, робіть це на окремому обліковому записі й тримайте його ізольованим. Див.
    [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи можу я використовувати дешевші моделі для завдань персонального assistant?">
    Так, **якщо** agent працює лише в чаті, а вхід є довіреним. Менші рівні
    більш уразливі до перехоплення інструкціями, тож уникайте їх для agents з увімкненими tools
    або коли читаєте недовірений вміст. Якщо вам усе ж потрібна менша модель, жорстко обмежте
    tools і запускайте в ізольованому середовищі. Див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Я виконав /start у Telegram, але не отримав код pairing">
    Коди pairing надсилаються **лише** тоді, коли невідомий відправник пише боту і
    ввімкнено `dmPolicy: "pairing"`. Сам по собі `/start` не генерує код.

    Перевірте очікувані запити:

    ```bash
    openclaw pairing list telegram
    ```

    Якщо вам потрібен негайний доступ, додайте свій sender id до allowlist або задайте `dmPolicy: "open"`
    для цього облікового запису.

  </Accordion>

  <Accordion title="WhatsApp: чи буде він писати моїм контактам? Як працює pairing?">
    Ні. Типова політика WhatsApp DM — **pairing**. Невідомі відправники лише отримують код pairing, а їхнє повідомлення **не обробляється**. OpenClaw відповідає лише в чатах, які сам отримує, або через явні надсилання, які ви запускаєте.

    Схвалення pairing:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Список очікуваних запитів:

    ```bash
    openclaw pairing list whatsapp
    ```

    Запит номера телефону в майстрі: він використовується для налаштування вашого **allowlist/owner**, щоб ваші власні DM були дозволені. Він не використовується для автоматичного надсилання. Якщо ви запускаєте систему на своєму особистому номері WhatsApp, використовуйте цей номер і ввімкніть `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Команди чату, переривання завдань і «воно не зупиняється»

<AccordionGroup>
  <Accordion title="Як зупинити показ внутрішніх системних повідомлень у чаті?">
    Більшість внутрішніх або tool-повідомлень з’являються лише тоді, коли для цієї session увімкнено **verbose**, **trace** або **reasoning**.

    Виправлення в чаті, де ви це бачите:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Якщо все одно занадто шумно, перевірте налаштування session у Control UI і встановіть verbose
    у значення **inherit**. Також переконайтеся, що ви не використовуєте профіль бота з `verboseDefault`, заданим
    як `on` у config.

    Документація: [Thinking і verbose](/uk/tools/thinking), [Безпека](/uk/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Як зупинити/скасувати завдання, що виконується?">
    Надішліть будь-яке з наведеного **як окреме повідомлення** (без слеша):

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

    Це тригери переривання (не слеш-команди).

    Для фонових процесів (із tool exec) ви можете попросити agent виконати:

    ```
    process action:kill sessionId:XXX
    ```

    Огляд слеш-команд див. у [Слеш-командах](/uk/tools/slash-commands).

    Більшість команд треба надсилати як **окреме** повідомлення, що починається з `/`, але деякі скорочення (наприклад `/status`) також працюють inline для відправників з allowlist.

  </Accordion>

  <Accordion title='Як надіслати повідомлення Discord із Telegram? ("Cross-context messaging denied")'>
    OpenClaw типово блокує повідомлення **між різними providers**. Якщо виклик tool прив’язаний
    до Telegram, він не надсилатиме в Discord, якщо ви явно цього не дозволите.

    Увімкніть крос-provider повідомлення для agent:

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

    Після редагування config перезапустіть gateway.

  </Accordion>

  <Accordion title='Чому здається, що бот "ігнорує" швидку серію повідомлень?'>
    Режим queue керує тим, як нові повідомлення взаємодіють із запуском, що вже виконується. Використовуйте `/queue`, щоб змінити режими:

    - `steer` — нові повідомлення перенаправляють поточне завдання
    - `followup` — повідомлення виконуються по одному
    - `collect` — повідомлення збираються в пакет і надсилається одна відповідь (типово)
    - `steer-backlog` — перенаправити зараз, а потім обробити backlog
    - `interrupt` — перервати поточний запуск і почати заново

    Ви можете додавати параметри, як-от `debounce:2s cap:25 drop:summarize`, для режимів followup.

  </Accordion>
</AccordionGroup>

## Різне

<AccordionGroup>
  <Accordion title='Яка типова модель для Anthropic з API key?'>
    В OpenClaw облікові дані й вибір моделі — це окремі речі. Задання `ANTHROPIC_API_KEY` (або збереження ключа Anthropic API у профілях auth) вмикає автентифікацію, але фактична типова модель — це те, що ви налаштовуєте в `agents.defaults.model.primary` (наприклад, `anthropic/claude-sonnet-4-6` або `anthropic/claude-opus-4-6`). Якщо ви бачите `No credentials found for profile "anthropic:default"`, це означає, що Gateway не зміг знайти облікові дані Anthropic в очікуваному `auth-profiles.json` для agent, який виконується.
  </Accordion>
</AccordionGroup>

---

Усе ще застрягли? Запитайте в [Discord](https://discord.com/invite/clawd) або відкрийте [обговорення GitHub](https://github.com/openclaw/openclaw/discussions).
