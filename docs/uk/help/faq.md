---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час виконання
    - Тріаж проблем, про які повідомляють користувачі, перед глибшим налагодженням
summary: Поширені запитання про налаштування, конфігурацію та використання OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-06T15:34:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: bddcde55cf4bcec4913aadab4c665b235538104010e445e4c99915a1672b1148
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Швидкі відповіді та глибше усунення несправностей для реальних сценаріїв налаштування (локальна розробка, VPS, багатоагентність, OAuth/API-ключі, резервне перемикання моделей). Для діагностики під час виконання див. [Усунення несправностей](/uk/gateway/troubleshooting). Повний довідник конфігурації див. у [Конфігурації](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламалося

1. **Швидкий статус (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидке локальне зведення: ОС + оновлення, доступність gateway/service, агенти/сесії, конфігурація провайдерів + проблеми під час виконання (коли gateway доступний).

2. **Звіт, який можна вставити (безпечний для поширення)**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з хвостом логів (токени замасковано).

3. **Стан демона + порту**

   ```bash
   openclaw gateway status
   ```

   Показує runtime супервізора проти доступності RPC, цільовий URL перевірки та яку конфігурацію сервіс, імовірно, використав.

4. **Глибокі перевірки**

   ```bash
   openclaw status --deep
   ```

   Виконує живу перевірку стану gateway, включно з перевірками каналів, коли це підтримується
   (потрібен доступний gateway). Див. [Стан](/uk/gateway/health).

5. **Показати кінець останнього логу**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використовуйте запасний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові логи відокремлені від логів сервісу; див. [Логування](/uk/logging) та [Усунення несправностей](/uk/gateway/troubleshooting).

6. **Запустити doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує конфігурацію/стан + запускає перевірки стану. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Запитує у запущеного gateway повний знімок (лише WS). Див. [Стан](/uk/gateway/health).

## Швидкий старт і налаштування першого запуску

<AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб вибратися">
    Використовуйте локального AI-агента, який може **бачити вашу машину**. Це значно ефективніше, ніж питати
    в Discord, тому що більшість випадків «я застряг» — це **локальні проблеми конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти логи та допомагати виправляти
    налаштування на рівні машини (PATH, сервіси, дозволи, файли автентифікації). Дайте їм **повний checkout вихідного коду**
    через hackable (git) встановлення:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **з git checkout**, тож агент може читати код + документацію та
    аналізувати точну версію, яку ви запускаєте. Ви завжди можете повернутися до stable пізніше,
    повторно запустивши встановлювач без `--install-method git`.

    Порада: попросіть агента **спланувати та проконтролювати** виправлення (крок за кроком), а потім виконати лише
    потрібні команди. Так зміни будуть невеликими й легшими для аудиту.

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

    - `openclaw status`: швидкий знімок стану gateway/агента + базова конфігурація.
    - `openclaw models status`: перевіряє автентифікацію провайдерів + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє поширені проблеми конфігурації/стану.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламалося](#first-60-seconds-if-something-is-broken).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці встановлювача](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску heartbeat:

    - `quiet-hours`: поза налаштованим вікном active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожній текст/каркас із заголовків
    - `no-tasks-due`: активний режим завдань `HEARTBEAT.md`, але жоден інтервал завдань ще не настав
    - `alerts-disabled`: вся видимість heartbeat вимкнена (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові позначки виконання зсуваються лише після завершення
    реального запуску heartbeat. Пропущені запуски не позначають завдання як завершені.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановлення та налаштування OpenClaw">
    Репозиторій рекомендує запуск із джерела та використання онбордингу:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати ресурси UI. Після онбордингу зазвичай ви запускаєте Gateway на порту **18789**.

    Із джерела (для учасників/розробки):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # auto-installs UI deps on first run
    openclaw onboard
    ```

    Якщо у вас ще немає глобального встановлення, запустіть це через `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Як відкрити dashboard після онбордингу?">
    Майстер відкриває ваш браузер із чистим URL dashboard (без токена) одразу після онбордингу, а також друкує посилання в підсумку. Залиште цю вкладку відкритою; якщо вона не запустилася, скопіюйте/вставте надрукований URL на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати dashboard на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитує автентифікацію shared-secret, вставте налаштований токен або пароль у налаштуваннях Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо shared secret ще не налаштовано, згенеруйте токен командою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залишайте bind loopback, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` дорівнює `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставляння shared secret, за умови довіреного хоста gateway); HTTP API усе ще вимагають shared-secret auth, якщо ви навмисно не використовуєте private-ingress `none` або HTTP-аутентифікацію trusted-proxy.
      Некоректні одночасні спроби автентифікації Serve від одного клієнта серіалізуються до того, як лімітер невдалих автентифікацій зафіксує їх, тож друга невдала спроба вже може показати `retry later`.
    - **Tailnet bind**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний shared secret у налаштування dashboard.
    - **Identity-aware reverse proxy**: тримайте Gateway за trusted proxy без loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, потім відкрийте URL проксі.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, після чого відкрийте `http://127.0.0.1:18789/`. Автентифікація shared-secret усе ще застосовується через тунель; вставте налаштований токен або пароль, якщо буде запит.

    Див. [Dashboard](/web/dashboard) і [Web surfaces](/web) для режимів bind та деталей автентифікації.

  </Accordion>

  <Accordion title="Чому є дві конфігурації підтвердження exec для підтверджень у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на підтвердження до адрес чатів
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом підтвердження для exec approvals

    Політика exec на хості все одно є реальним бар’єром підтвердження. Конфігурація чату лише визначає, де з’являються
    запити на підтвердження і як люди можуть на них відповідати.

    У більшості налаштувань вам **не** потрібні обидва варіанти:

    - Якщо чат уже підтримує команди та відповіді, `/approve` у тому ж чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначати тих, хто підтверджує, OpenClaw тепер автоматично вмикає DM-first native approvals, коли `channels.<channel>.execApprovals.enabled` не задано або дорівнює `"auto"`.
    - Коли доступні нативні картки/кнопки підтвердження, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve`, лише якщо результат інструмента каже, що підтвердження через чат недоступні або ручне підтвердження — єдиний шлях.
    - Використовуйте `approvals.exec` лише тоді, коли запити також потрібно пересилати в інші чати або окремі кімнати ops.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише якщо ви явно хочете, щоб запити на підтвердження публікувалися назад у вихідну кімнату/тему.
    - Підтвердження plugins знову окремі: за замовчуванням вони використовують `/approve` у тому ж чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі нативні канали зберігають plugin-approval-native обробку поверх цього.

    Коротко: пересилання — для маршрутизації, конфігурація нативного клієнта — для багатшого UX, специфічного для каналу.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке runtime мені потрібне?">
    Потрібен Node **>= 22**. Рекомендується `pnpm`. Bun **не рекомендовано** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легкий — у документації вказано, що для особистого використання достатньо **512MB-1GB RAM**, **1 core** та приблизно **500MB**
    диска, а також зазначено, що **Raspberry Pi 4 може його запускати**.

    Якщо вам потрібен додатковий запас (логи, медіа, інші сервіси), **рекомендується 2GB**, але це
    не жорсткий мінімум.

    Порада: маленький Pi/VPS може хостити Gateway, а ви можете під’єднати **nodes** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Чи є поради для встановлення на Raspberry Pi?">
    Коротко: працює, але очікуйте гострих кутів.

    - Використовуйте **64-bit** ОС і Node >= 22.
    - Надавайте перевагу **hackable (git) install**, щоб бачити логи й швидко оновлюватися.
    - Починайте без каналів/Skills, потім додавайте їх по одному.
    - Якщо натрапили на дивні проблеми з бінарниками, зазвичай це проблема **ARM compatibility**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Застрягає на wake up my friend / онбординг не вилуплюється. Що тепер?">
    Цей екран залежить від того, чи доступний і автентифікований Gateway. TUI також автоматично надсилає
    «Wake up, my friend!» під час першого hatch. Якщо ви бачите цей рядок **без відповіді**
    і токени залишаються на 0, агент ніколи не запускався.

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

    Якщо Gateway віддалений, переконайтеся, що тунель/з’єднання Tailscale працює, а UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini) без повторного онбордингу?">
    Так. Скопіюйте **директорію стану** та **workspace**, потім один раз запустіть Doctor. Це
    збереже вашого бота «точно таким самим» (пам’ять, історію сесій, автентифікацію та
    стан каналів), якщо ви скопіюєте **обидва** розташування:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте ваш workspace (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть сервіс Gateway.

    Це збереже конфігурацію, профілі автентифікації, WhatsApp credentials, сесії та пам’ять. Якщо ви працюєте у
    віддаленому режимі, пам’ятайте, що хост gateway володіє сховищем сесій і workspace.

    **Важливо:** якщо ви лише commit/push свій workspace на GitHub, ви резервуєте
    **пам’ять + bootstrap файли**, але **не** історію сесій чи автентифікацію. Вони живуть
    у `~/.openclaw/` (наприклад `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Міграція](/uk/install/migrating), [Де що зберігається на диску](#where-things-live-on-disk),
    [Workspace агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи — зверху. Якщо верхній розділ позначено як **Unreleased**, наступний датований
    розділ — це остання випущена версія. Записи згруповано за **Highlights**, **Changes** та
    **Fixes** (а також docs/іншими розділами, коли потрібно).

  </Accordion>

  <Accordion title="Не можу зайти на docs.openclaw.ai (помилка SSL)">
    Деякі з’єднання Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть це або додайте `docs.openclaw.ai` в allowlist, а потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати це, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете зайти на сайт, документація дзеркалюється на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай stable-реліз спочатку потрапляє в **beta**, а потім явний
    крок підвищення переміщує цю саму версію в `latest`. Супровідники також можуть
    опублікувати відразу в `latest`, коли це потрібно. Тому beta і stable можуть
    вказувати на **ту саму версію** після підвищення.

    Див. що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Для однорядкових команд встановлення та різниці між beta і dev див. accordion нижче.

  </Accordion>

  <Accordion title="Як встановити beta-версію і в чому різниця між beta і dev?">
    **Beta** — це npm dist-tag `beta` (після підвищення може збігатися з `latest`).
    **Dev** — це рухома голова `main` (git); при публікації вона використовує npm dist-tag `dev`.

    Однорядкові команди (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Встановлювач для Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Більше деталей: [Канали розробки](/uk/install/development-channels) і [Прапорці встановлювача](/uk/install/installer).

  </Accordion>

  <Accordion title="Як спробувати найновіші збірки?">
    Два варіанти:

    1. **Dev channel (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає вас на гілку `main` і оновлює з джерела.

    2. **Hackable install (із сайту встановлювача):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає вам локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо ви надаєте перевагу чистому ручному clone, використовуйте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Оновлення](/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай триває встановлення та онбординг?">
    Приблизно:

    - **Встановлення:** 2-5 хвилин
    - **Онбординг:** 5-15 хвилин залежно від кількості каналів/моделей, які ви налаштовуєте

    Якщо зависає, використовуйте [Встановлювач завис?](#quick-start-and-first-run-setup)
    і швидкий цикл налагодження в [Я застряг](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Встановлювач завис? Як отримати більше зворотного зв’язку?">
    Повторно запустіть встановлювач із **детальним виводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Встановлення beta з детальним виводом:

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

    Більше варіантів: [Прапорці встановлювача](/uk/install/installer).

  </Accordion>

  <Accordion title="Під час встановлення на Windows пише git not found або openclaw not recognized">
    Дві поширені проблеми Windows:

    **1) npm error spawn git / git not found**

    - Встановіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, потім повторно запустіть встановлювач.

    **2) openclaw is not recognized після встановлення**

    - Ваша глобальна тека npm bin не додана до PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до PATH користувача (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо ви хочете найплавніше налаштування Windows, використовуйте **WSL2** замість нативного Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="Вивід exec у Windows показує зіпсований китайський текст — що робити?">
    Зазвичай це невідповідність code page консолі у нативних оболонках Windows.

    Симптоми:

    - Вивід `system.run`/`exec` показує китайську як mojibake
    - Та сама команда має нормальний вигляд в іншому профілі термінала

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

    Якщо це все ще відтворюється в останньому OpenClaw, відстежуйте/повідомляйте тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використовуйте **hackable (git) install**, щоб мати повний вихідний код і документацію локально, а тоді запитайте
    вашого бота (або Claude/Codex) _з цієї папки_, щоб він міг читати репозиторій і відповідати точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Більше деталей: [Встановлення](/uk/install) і [Прапорці встановлювача](/uk/install/installer).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтесь гайда для Linux, а потім запустіть онбординг.

    - Швидкий шлях для Linux + встановлення сервісу: [Linux](/uk/platforms/linux).
    - Повний покроковий гайд: [Початок роботи](/uk/start/getting-started).
    - Встановлювач + оновлення: [Встановлення та оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Встановіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Гайди: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де інструкції зі встановлення в хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з поширеними провайдерами. Оберіть одного і дотримуйтесь гайда:

    - [VPS hosting](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте до нього доступ
    з ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан + workspace
    живуть на сервері, тож вважайте хост джерелом істини й робіть його резервні копії.

    Ви можете під’єднувати **nodes** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримати доступ
    до локального екрана/камери/canvas або запускати команди на ноутбуці, залишаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити самого себе?">
    Коротка відповідь: **можливо, але не рекомендується**. Потік оновлення може перезапустити
    Gateway (що розірве активну сесію), може потребувати чистого git checkout і
    може запитувати підтвердження. Безпечніше запускати оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо вам обов’язково потрібно автоматизувати це від агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Оновлення](/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить onboarding?">
    `openclaw onboard` — це рекомендований шлях налаштування. У **локальному режимі** він проведе вас через:

    - **Налаштування моделей/автентифікації** (OAuth провайдера, API-ключі, setup-token Anthropic, а також локальні варіанти моделей, наприклад LM Studio)
    - Розташування **workspace** + bootstrap файли
    - **Налаштування gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також bundled channel plugins, такі як QQ Bot)
    - **Встановлення демона** (LaunchAgent на macOS; systemd user unit на Linux/WSL2)
    - **Перевірки стану** та вибір **Skills**

    Він також попереджає, якщо налаштована модель невідома або бракує автентифікації.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації в цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **Anthropic API key**: звичайна оплата Anthropic API
    - **Claude CLI / Claude subscription auth в OpenClaw**: співробітники Anthropic
      сказали нам, що таке використання знову дозволене, і OpenClaw розглядає використання `claude -p`
      як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довгоживучих хостів gateway Anthropic API keys усе ще є більш
    передбачуваним налаштуванням. OpenAI Codex OAuth явно підтримується для зовнішніх
    інструментів, таких як OpenClaw.

    OpenClaw також підтримує інші хостингові варіанти підписки, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [GLM Models](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API-ключа?">
    Так.

    Співробітники Anthropic сказали нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому
    OpenClaw розглядає автентифікацію через підписку Claude і використання `claude -p` як санкціоновані
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо ви хочете
    найпередбачуваніше серверне налаштування, замість цього використовуйте Anthropic API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic сказали нам, що таке використання знову дозволене, тому OpenClaw вважає
    повторне використання Claude CLI і `claude -p` санкціонованими для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Setup-token Anthropic усе ще доступний як підтримуваний токен-шлях OpenClaw, але OpenClaw тепер віддає перевагу повторному використанню Claude CLI і `claude -p`, коли це доступно.
    Для production або багатокористувацьких навантажень автентифікація через Anthropic API key усе ще є
    безпечнішим і передбачуванішим вибором. Якщо вам потрібні інші підпискові
    хостингові варіанти в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax), і [GLM
    Models](/uk/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
Це означає, що ваша **квота/ліміт швидкості Anthropic** вичерпано для поточного вікна. Якщо ви
використовуєте **Claude CLI**, дочекайтеся скидання вікна або оновіть план. Якщо ви
використовуєте **Anthropic API key**, перевірте Anthropic Console
на предмет використання/білінгу і за потреби збільште ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, запит намагається використати
    1M context beta Anthropic (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані мають право на long-context billing (оплата API key або
    шлях OpenClaw Claude-login з увімкненим Extra Usage).

    Порада: задайте **fallback model**, щоб OpenClaw міг продовжувати відповідати, поки провайдер обмежений rate limit.
    Див. [Моделі](/cli/models), [OAuth](/uk/concepts/oauth), і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має bundled-провайдера **Amazon Bedrock (Converse)**. За наявності маркерів середовища AWS OpenClaw може автоматично виявити каталог streaming/text Bedrock і об’єднати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати ручний запис провайдера. Див. [Amazon Bedrock](/uk/providers/bedrock) та [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний proxy перед Bedrock теж є дійсним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Під час онбордингу можна запустити потік OAuth, і за потреби він встановить типовою модель `openai-codex/gpt-5.4`. Див. [Провайдери моделей](/uk/concepts/model-providers) та [Онбординг (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому ChatGPT GPT-5.4 не відкриває openai/gpt-5.4 в OpenClaw?">
    OpenClaw розділяє ці два маршрути:

    - `openai-codex/gpt-5.4` = ChatGPT/Codex OAuth
    - `openai/gpt-5.4` = прямий OpenAI Platform API

    У OpenClaw вхід через ChatGPT/Codex прив’язаний до маршруту `openai-codex/*`,
    а не до прямого маршруту `openai/*`. Якщо ви хочете прямий API-шлях у
    OpenClaw, задайте `OPENAI_API_KEY` (або еквівалентну конфігурацію провайдера OpenAI).
    Якщо ви хочете вхід через ChatGPT/Codex в OpenClaw, використовуйте `openai-codex/*`.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    `openai-codex/*` використовує маршрут Codex OAuth, і його доступні вікна квоти
    керуються OpenAI та залежать від плану. На практиці ці ліміти можуть відрізнятися від
    досвіду на сайті/в застосунку ChatGPT, навіть коли обидва прив’язані до одного облікового запису.

    OpenClaw може показувати поточні видимі вікна використання/квоти провайдера в
    `openclaw models status`, але не вигадує і не нормалізує права ChatGPT-web
    у прямий доступ до API. Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform,
    використовуйте `openai/*` з API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OpenAI Code (Codex) subscription OAuth**.
    OpenAI прямо дозволяє використання subscription OAuth у зовнішніх інструментах/потоках
    на кшталт OpenClaw. Під час онбордингу можна запустити потік OAuth за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers), і [Онбординг (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **plugin auth flow**, а не client id або secret у `openclaw.json`.

    Кроки:

    1. Встановіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Типова модель після входу: `google-gemini-cli/gemini-3.1-pro-preview`
    5. Якщо запити не працюють, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає OAuth-токени в профілях автентифікації на хості gateway. Деталі: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; малі картки обрізають і пропускають зайве. Якщо вже потрібно, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантовані моделі підвищують ризик prompt injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як тримати трафік hosted-моделей у певному регіоні?">
    Вибирайте region-pinned endpoints. OpenRouter надає варіанти з хостингом у США для MiniMax, Kimi та GLM; обирайте US-hosted варіант, щоб дані залишалися в регіоні. Ви все одно можете перелічити Anthropic/OpenAI поряд із ними, використовуючи `models.mode: "merge"`, щоб резервні варіанти лишалися доступними й водночас поважали обраного регіонального провайдера.
  </Accordion>

  <Accordion title="Чи потрібно купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini — необов’язковий —
    дехто купує його як постійно ввімкнений хост, але маленький VPS, домашній сервер або коробка класу Raspberry Pi теж підійдуть.

    Mac потрібен лише для **інструментів лише для macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) —
    сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або під’єднайте macOS node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, на якому виконано вхід у Messages. Це **не** обов’язково має бути Mac mini —
    підійде будь-який Mac. **Використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) для iMessage — сервер BlueBubbles працює на macOS, а Gateway може працювати на Linux або в іншому місці.

    Поширені налаштування:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac із входом у Messages.
    - Запускайте все на Mac, якщо хочете найпростіше налаштування на одній машині.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для OpenClaw, чи зможу під’єднати його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключитися як
    **node** (додатковий пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, такі як screen/camera/canvas і `system.run` на цьому пристрої.

    Поширений шаблон:

    - Gateway на Mac mini (постійно ввімкнений).
    - MacBook Pro запускає застосунок macOS або хост node і під’єднується до Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я використовувати Bun?">
    Bun **не рекомендовано**. Ми бачимо runtime-баґи, особливо з WhatsApp і Telegram.
    Для стабільних gateway використовуйте **Node**.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на не production gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не username бота.

    Під час онбордингу можна ввести `@username`, і він буде перетворений на числовий ID, але авторизація OpenClaw використовує лише числові ID.

    Безпечніший варіант (без стороннього бота):

    - Напишіть боту в DM, потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть боту в DM, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватний):

    - Напишіть `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **багатоагентну маршрутизацію**. Прив’яжіть WhatsApp **DM** кожного відправника (peer `kind: "direct"`, E.164 відправника, наприклад `+15551234567`) до різного `agentId`, щоб кожна людина мала власний workspace і сховище сесій. Відповіді все одно надходитимуть із **того самого облікового запису WhatsApp**, а контроль доступу до DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для цього облікового запису WhatsApp. Див. [Багатоагентна маршрутизація](/uk/concepts/multi-agent) та [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я мати агента для "швидкого чату" і агента "Opus для кодування"?'>
    Так. Використовуйте багатоагентну маршрутизацію: дайте кожному агенту власну типову модель, а потім прив’яжіть вхідні маршрути (обліковий запис провайдера або конкретні peers) до кожного агента. Приклад конфігурації є в [Багатоагентній маршрутизації](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) та [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, визначалися в оболонках без входу.
    Останні збірки також додають поширені користувацькі теки bin у Linux systemd services (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` та `FNM_DIR`, коли вони задані.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повний checkout вихідного коду, можна редагувати, найкраще для учасників.
      Ви локально запускаєте збірки та можете вносити зміни в код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для «просто запустити».
      Оновлення приходять із npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm і git install?">
    Так. Встановіть інший варіант, потім запустіть Doctor, щоб сервіс gateway вказував на нову entrypoint.
    Це **не видаляє ваші дані** — змінюється лише спосіб встановлення коду OpenClaw. Ваш стан
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

    Doctor виявляє невідповідність entrypoint сервісу gateway і пропонує переписати конфігурацію сервісу відповідно до поточного встановлення (в автоматизації використовуйте `--repair`).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібен
    найменший поріг входу і вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Переваги:** без вартості сервера, прямий доступ до локальних файлів, видиме вікно браузера.
    - **Недоліки:** сон/обриви мережі = роз’єднання, оновлення ОС/перезавантаження переривають, машина має залишатися активною.

    **VPS / хмара**

    - **Переваги:** завжди ввімкнено, стабільна мережа, немає проблем зі сном ноутбука, легше підтримувати запуск.
    - **Недоліки:** часто headless (використовуйте скріншоти), доступ до файлів лише віддалено, для оновлень потрібен SSH.

    **Примітка, специфічна для OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord чудово працюють із VPS. Єдина реальна різниця — **headless browser** проти видимого вікна. Див. [Browser](/uk/tools/browser).

    **Рекомендовано за замовчуванням:** VPS, якщо у вас раніше були роз’єднання gateway. Локальний запуск чудовий, коли ви активно користуєтесь Mac і хочете локальний доступ до файлів або автоматизацію UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Не обов’язково, але **рекомендується для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** завжди ввімкнений, менше перерв через сон/перезавантаження, чистіші дозволи, простіше тримати запущеним.
    - **Спільний ноутбук/десктоп:** цілком нормально для тестування й активного використання, але очікуйте пауз під час сну машини або оновлень.

    Якщо ви хочете найкраще з обох світів, тримайте Gateway на виділеному хості, а ноутбук під’єднуйте як **node** для локальних інструментів screen/camera/exec. Див. [Nodes](/uk/nodes).
    Для рекомендацій із безпеки прочитайте [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яку ОС рекомендовано?">
    OpenClaw легкий. Для базового Gateway + одного каналу чату:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1-2 vCPU, 2GB RAM або більше для запасу (логи, медіа, кілька каналів). Інструменти node і автоматизація браузера можуть споживати багато ресурсів.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Саме цей шлях встановлення для Linux протестовано найкраще.

    Документація: [Linux](/uk/platforms/linux), [VPS hosting](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди ввімкнена, доступна й мати достатньо
    RAM для Gateway і будь-яких каналів, які ви вмикаєте.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера або медіа-інструменти.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви на Windows, **WSL2 — найпростіший варіант у стилі VM** і має найкращу
    сумісність інструментів. Див. [Windows](/uk/platforms/windows), [VPS hosting](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw, в одному абзаці?">
    OpenClaw — це персональний AI-асистент, який ви запускаєте на власних пристроях. Він відповідає на платформах обміну повідомленнями, якими ви вже користуєтесь (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, а також bundled channel plugins, такі як QQ Bot), а також може працювати з голосом + живим Canvas на підтримуваних платформах. **Gateway** — це завжди ввімкнений control plane; асистент — це сам продукт.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не «просто обгортка над Claude». Це **локальний-first control plane**, який дозволяє вам запускати
    потужного асистента на **вашому власному обладнанні**, доступного з чат-застосунків, якими ви вже користуєтесь, із
    сесіями зі станом, пам’яттю та інструментами — без передачі контролю над вашими робочими процесами
    хостинговому SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway де завгодно (Mac, Linux, VPS) і тримайте
      workspace + історію сесій локально.
    - **Реальні канали, а не web sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      плюс мобільний голос і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо, з маршрутизацією
      та резервуванням на рівні агента.
    - **Лише локальний варіант:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо ви цього хочете.
    - **Багатоагентна маршрутизація:** окремі агенти на канал, обліковий запис або завдання, кожен зі своїм
      workspace і типовими значеннями.
    - **Відкритий код і можливість зламувати/розширювати:** перевіряйте, розширюйте та self-host без vendor lock-in.

    Документація: [Gateway](/uk/gateway), [Канали](/uk/channels), [Багатоагентність](/uk/concepts/multi-agent),
    [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно все налаштував — що мені робити спочатку?">
    Хороші перші проєкти:

    - Створити сайт (WordPress, Shopify або простий статичний сайт).
    - Прототипувати мобільний застосунок (структура, екрани, план API).
    - Організувати файли та папки (очищення, назви, теги).
    - Під’єднати Gmail і автоматизувати підсумки чи follow-up.

    Він може впоратися з великими завданнями, але найкраще працює, коли ви ділите їх на етапи
    і використовуєте sub-agents для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найкращих щоденних сценаріїв використання OpenClaw?">
    Щоденна користь зазвичай виглядає так:

    - **Персональні брифінги:** підсумки пошти, календаря та новин, які вам важливі.
    - **Дослідження і чернетки:** швидке дослідження, підсумки та перші чернетки листів або документів.
    - **Нагадування та follow-up:** підказки та чеклісти на основі cron або heartbeat.
    - **Автоматизація браузера:** заповнення форм, збирання даних і повторення веб-завдань.
    - **Координація між пристроями:** надішліть завдання з телефону, дайте Gateway виконати його на сервері й отримайте результат назад у чат.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, ads і блогами для SaaS?">
    Так, для **дослідження, кваліфікації та підготовки чернеток**. Він може сканувати сайти, складати короткі списки,
    підсумовувати потенційних клієнтів і писати чернетки outreach або рекламного тексту.

    Для **outreach або запуску реклами** залишайте людину в циклі. Уникайте спаму, дотримуйтеся місцевих законів і
    політик платформ, і перевіряйте все перед відправленням. Найбезпечніший шаблон — нехай
    OpenClaw готує чернетку, а ви затверджуєте.

    Документація: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний асистент** і рівень координації, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу кодування всередині репозиторію. Використовуйте OpenClaw, коли
    вам потрібні стійка пам’ять, доступ між пристроями та оркестрація інструментів.

    Переваги:

    - **Постійна пам’ять + workspace** між сесіями
    - **Доступ із багатьох платформ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (browser, files, scheduling, hooks)
    - **Завжди ввімкнений Gateway** (запускайте на VPS, взаємодійте звідусіль)
    - **Nodes** для локальних browser/screen/camera/exec

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills і автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати Skills, не роблячи репозиторій брудним?">
    Використовуйте керовані overrides замість редагування копії в репозиторії. Додавайте свої зміни у `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, тож керовані overrides все одно мають пріоритет над bundled Skills без змін у git. Якщо вам потрібно, щоб Skill був встановлений глобально, але видимий лише для деяких агентів, тримайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` та `agents.list[].skills`. Лише зміни, гідні upstream, мають жити в репозиторії й виходити як PR.
  </Accordion>

  <Accordion title="Чи можу я завантажувати Skills із власної папки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Типовий пріоритет: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` за замовчуванням встановлює у `./skills`, що OpenClaw обробляє як `<workspace>/skills` у наступній сесії. Якщо Skill має бути видимим лише певним агентам, поєднайте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як використовувати різні моделі для різних завдань?">
    Сьогодні підтримуються такі шаблони:

    - **Cron jobs**: ізольовані завдання можуть задавати override `model` для кожного завдання.
    - **Sub-agents**: маршрутизуйте завдання до окремих агентів із різними типовими моделями.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб будь-коли змінити модель поточної сесії.

    Див. [Cron jobs](/uk/automation/cron-jobs), [Багатоагентна маршрутизація](/uk/concepts/multi-agent), і [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як це винести?">
    Використовуйте **sub-agents** для довгих або паралельних завдань. Sub-agents працюють у власній сесії,
    повертають підсумок і зберігають чутливість вашого основного чату.

    Попросіть бота «створити sub-agent для цього завдання» або використовуйте `/subagents`.
    Використовуйте `/status` у чаті, щоб побачити, що Gateway робить просто зараз (і чи він зайнятий).

    Порада щодо токенів: довгі завдання й sub-agents обидва витрачають токени. Якщо важлива
    вартість, задайте дешевшу модель для sub-agents через `agents.defaults.subagents.model`.

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють thread-bound subagent sessions у Discord?">
    Використовуйте прив’язки тредів. Ви можете прив’язати Discord thread до subagent або цільової session, щоб наступні повідомлення в цьому треді залишалися на цій прив’язаній сесії.

    Базовий процес:

    - Створіть через `sessions_spawn` з `thread: true` (і за бажанням `mode: "session"` для постійної подальшої роботи).
    - Або вручну прив’яжіть через `/focus <target>`.
    - Використовуйте `/agents`, щоб перевірити стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати автоматичним зняттям фокуса.
    - Використовуйте `/unfocus`, щоб від’єднати тред.

    Потрібна конфігурація:

    - Глобальні типові значення: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Перевизначення Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоматична прив’язка під час spawn: задайте `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Sub-agents](/uk/tools/subagents), [Discord](/uk/channels/discord), [Довідник конфігурації](/uk/gateway/configuration-reference), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent завершився, але оновлення про завершення пішло не туди або взагалі не опублікувалося. Що перевірити?">
    Спочатку перевірте визначений маршрут запитувача:

    - Доставка completion-mode subagent віддає перевагу будь-якому прив’язаному треду або маршруту розмови, якщо такий існує.
    - Якщо походження завершення несе лише канал, OpenClaw повертається до збереженого маршруту сесії запитувача (`lastChannel` / `lastTo` / `lastAccountId`), тож пряма доставка все ще може спрацювати.
    - Якщо немає ні прив’язаного маршруту, ні придатного збереженого маршруту, пряма доставка може не вдатися, і результат повернеться до queued session delivery замість негайної публікації в чат.
    - Недійсні або застарілі цілі все одно можуть змусити перейти до queue fallback або остаточної помилки доставки.
    - Якщо остання видима відповідь assistant у дочірньому процесі — це точний тихий токен `NO_REPLY` / `no_reply` або точно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує announce замість публікації застарілого попереднього прогресу.
    - Якщо дочірній процес завершився за тайм-аутом після одних лише викликів інструментів, announce може згорнути це в короткий підсумок часткового прогресу замість відтворення сирого виводу інструментів.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks), [Інструмент Session](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron працює всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані завдання не запускатимуться.

    Чекліст:

    - Підтвердьте, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не задано.
    - Переконайтеся, що Gateway працює 24/7 (без сну/перезапусків).
    - Перевірте налаштування часової зони для завдання (`--tz` проти часової зони хоста).

    Налагодження:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Cron спрацював, але в канал нічого не надіслано. Чому?">
    Спочатку перевірте режим доставки:

    - `--no-deliver` / `delivery.mode: "none"` означає, що зовнішнє повідомлення не очікується.
    - Відсутня або недійсна announce target (`channel` / `to`) означає, що runner пропустив вихідну доставку.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що runner спробував доставити, але credentials заблокували це.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` лише) вважається навмисно недоставним, тому runner також пригнічує queued fallback delivery.

    Для ізольованих cron jobs фінальною доставкою керує runner. Очікується,
    що агент поверне текстовий підсумок для відправлення runner-ом. `--no-deliver` зберігає
    цей результат внутрішнім; це не дозволяє агентові надсилати безпосередньо через
    message tool.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований cron run змінив модель або один раз повторився?">
    Зазвичай це шлях live model-switch, а не дублювання розкладу.

    Ізольований cron може зберегти runtime handoff моделі та повторити спробу, коли активний
    run кидає `LiveSessionModelSwitchError`. Повторна спроба зберігає перемкненого
    провайдера/модель, а якщо перемикання несло новий override профілю автентифікації, cron
    також зберігає його перед повтором.

    Пов’язані правила вибору:

    - Перевизначення моделі Gmail hook має найвищий пріоритет, коли застосовно.
    - Потім `model` для кожного завдання.
    - Потім будь-яке збережене перевизначення моделі cron-session.
    - Потім звичайний вибір типової моделі агента.

    Цикл повторів обмежений. Після початкової спроби плюс 2 повторів через перемикання
    cron переривається, а не зациклюється назавжди.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Як встановлювати Skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або просто додайте Skills у свій workspace. UI Skills для macOS недоступний на Linux.
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

    Нативний `openclaw skills install` записує у каталог `skills/` активного workspace.
    Окремий CLI `clawhub` встановлюйте лише якщо хочете публікувати або
    синхронізувати власні Skills. Для спільного встановлення між агентами розмістіть Skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете звузити видимість для агентів.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати завдання за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте планувальник Gateway:

    - **Cron jobs** для запланованих або повторюваних завдань (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок «основної сесії».
    - **Ізольовані jobs** для автономних агентів, які публікують підсумки або доставляють у чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати Apple macOS-only Skills із Linux?">
    Не напряму. macOS Skills обмежуються через `metadata.openclaw.os` плюс потрібні бінарники, і Skills потрапляють у system prompt лише тоді, коли вони придатні на **хості Gateway**. На Linux Skills лише для `darwin` (наприклад `apple-notes`, `apple-reminders`, `things-mac`) не завантажаться, якщо ви не перевизначите це обмеження.

    Є три підтримувані шаблони:

    **Варіант A - запускати Gateway на Mac (найпростіше).**
    Запускайте Gateway там, де існують бінарники macOS, а потім підключайтеся з Linux у [віддаленому режимі](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажуються нормально, бо хост Gateway — це macOS.

    **Варіант B - використовувати macOS node (без SSH).**
    Запускайте Gateway на Linux, під’єднайте macOS node (menubar app) і встановіть **Node Run Commands** у режим «Always Ask» або «Always Allow» на Mac. OpenClaw може вважати macOS-only Skills придатними, коли потрібні бінарники існують на node. Агент запускає ці Skills через інструмент `nodes`. Якщо ви обираєте «Always Ask», підтвердження «Always Allow» у запиті додає цю команду до allowlist.

    **Варіант C - проксувати бінарники macOS через SSH (просунутий).**
    Тримайте Gateway на Linux, але зробіть так, щоб потрібні CLI-бінарники вказували на SSH-обгортки, які запускаються на Mac. Потім перевизначте Skill, щоб дозволити Linux і зберегти його придатність.

    1. Створіть SSH-обгортку для бінарника (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Додайте обгортку в `PATH` на хості Linux (наприклад `~/bin/memo`).
    3. Перевизначте metadata Skill (workspace або `~/.openclaw/skills`), щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Почніть нову сесію, щоб знімок Skills оновився.

  </Accordion>

  <Accordion title="У вас є інтеграція з Notion або HeyGen?">
    Наразі вбудованої немає.

    Варіанти:

    - **Власний Skill / plugin:** найкраще для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Автоматизація браузера:** працює без коду, але повільніше й крихкіше.

    Якщо ви хочете зберігати контекст окремо для кожного клієнта (агентські workflows), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + уподобання + активна робота).
    - Попросіть агента отримувати цю сторінку на початку сесії.

    Якщо ви хочете нативну інтеграцію, відкрийте feature request або створіть Skill
    під ці API.

    Встановлення Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні встановлення потрапляють у каталог `skills/` активного workspace. Для спільних Skills між агентами розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі агенти, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі Skills очікують бінарники, встановлені через Homebrew; на Linux це означає Linuxbrew (див. вище пункт FAQ про Homebrew на Linux). Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config), і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати вже залогінений Chrome з OpenClaw?">
    Використовуйте вбудований профіль браузера `user`, який підключається через Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Якщо хочете власну назву, створіть явний MCP profile:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Цей шлях є локальним для хоста. Якщо Gateway працює десь інде, або запускайте node host на машині браузера, або використовуйте remote CDP.

    Поточні обмеження `existing-session` / `user`:

    - дії прив’язані до ref, а не до CSS-селекторів
    - uploads вимагають `ref` / `inputRef` і наразі підтримують один файл за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії все ще потребують managed browser або raw CDP profile

  </Accordion>
</AccordionGroup>

## Ізоляція та пам’ять

<AccordionGroup>
  <Accordion title="Чи є окрема документація про sandboxing?">
    Так. Див. [Sandboxing](/uk/gateway/sandboxing). Для налаштування, пов’язаного з Docker (повний gateway у Docker або sandbox images), див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повні можливості?">
    Типовий image орієнтований на безпеку й працює від користувача `node`, тому не
    містить системних пакетів, Homebrew або bundled browsers. Для повнішого налаштування:

    - Збережіть `/home/node` через `OPENCLAW_HOME_VOLUME`, щоб кеші переживали перезапуски.
    - Вбудуйте системні залежності в image через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Встановіть браузери Playwright через bundled CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Задайте `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я зберегти DM приватними, а групи зробити публічними/ізольованими з одним агентом?">
    Так — якщо ваш приватний трафік це **DM**, а публічний трафік це **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб сесії груп/каналів (неосновні ключі) працювали в Docker, тоді як основна DM-сесія залишалася на хості. Потім обмежте доступні інструменти в ізольованих сесіях через `tools.sandbox.tools`.

    Покрокова інструкція + приклад конфігурації: [Групи: особисті DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Довідник ключової конфігурації: [Конфігурація gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив’язати папку хоста до sandbox?">
    Задайте `agents.defaults.sandbox.docker.binds` як `["host:path:mode"]` (наприклад `"/home/user/src:/src:ro"`). Глобальні й per-agent binds об’єднуються; per-agent binds ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для всього чутливого й пам’ятайте, що binds обходять бар’єри файлової системи sandbox.

    OpenClaw перевіряє джерела bind і за нормалізованим шляхом, і за канонічним шляхом, визначеним через найглибшого наявного предка. Це означає, що вихід через symlink-батьків усе одно fail-closed навіть тоді, коли останній сегмент шляху ще не існує, і перевірки дозволених коренів усе одно застосовуються після визначення symlink.

    Див. [Sandboxing](/uk/gateway/sandboxing#custom-bind-mounts) і [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) для прикладів і приміток з безпеки.

  </Accordion>

  <Accordion title="Як працює пам’ять?">
    Пам’ять OpenClaw — це просто файли Markdown у workspace агента:

    - Щоденні нотатки у `memory/YYYY-MM-DD.md`
    - Керовані довгострокові нотатки в `MEMORY.md` (лише основні/приватні сесії)

    OpenClaw також виконує **тихий pre-compaction memory flush**, щоб нагадати моделі
    записати стійкі нотатки перед auto-compaction. Це працює лише тоді, коли workspace
    придатний для запису (у sandbox лише для читання це пропускається). Див. [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Пам’ять постійно щось забуває. Як зробити це стійким?">
    Попросіть бота **записати факт у пам’ять**. Довгострокові нотатки мають бути в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це ще сфера, яку ми покращуємо. Корисно нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона все одно забуває, перевірте, що Gateway використовує той самий
    workspace при кожному запуску.

    Документація: [Пам’ять](/uk/concepts/memory), [Workspace агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Пам’ять зберігається назавжди? Які обмеження?">
    Файли пам’яті живуть на диску й зберігаються, доки ви їх не видалите. Обмеження — це
    ваше сховище, а не модель. **Контекст сесії** все одно обмежений контекстним вікном моделі,
    тому довгі розмови можуть стискатися або обрізатися. Саме тому існує
    пошук по пам’яті — він повертає назад у контекст лише релевантні частини.

    Документація: [Пам’ять](/uk/concepts/memory), [Контекст](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потрібен OpenAI API key для semantic memory search?">
    Лише якщо ви використовуєте **OpenAI embeddings**. Codex OAuth покриває chat/completions і
    **не** надає доступу до embeddings, тому **вхід через Codex (OAuth або
    логін Codex CLI)** не допомагає для semantic memory search. Для OpenAI embeddings
    усе одно потрібен справжній API key (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви явно не задаєте провайдера, OpenClaw автоматично вибирає провайдера, коли
    може визначити API key (auth profiles, `models.providers.*.apiKey` або env vars).
    Він віддає перевагу OpenAI, якщо визначається ключ OpenAI, інакше Gemini, якщо визначається ключ Gemini,
    потім Voyage, потім Mistral. Якщо жодного віддаленого ключа немає, memory
    search залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштований і наявний
    локальний шлях до моделі, OpenClaw
    віддає перевагу `local`. Ollama підтримується, коли ви явно задаєте
    `memorySearch.provider = "ollama"`.

    Якщо ви хочете залишитися локально, задайте `memorySearch.provider = "local"` (і за бажанням
    `memorySearch.fallback = "none"`). Якщо ви хочете embeddings Gemini, задайте
    `memorySearch.provider = "gemini"` і вкажіть `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо embedding-моделі **OpenAI, Gemini, Voyage, Mistral, Ollama або local** —
    див. [Пам’ять](/uk/concepts/memory) для деталей налаштування.

  </Accordion>
</AccordionGroup>

## Де що зберігається на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, які використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** сесії, файли пам’яті, конфігурація та workspace живуть на хості Gateway
      (`~/.openclaw` + ваш каталог workspace).
    - **Віддалено за необхідністю:** повідомлення, які ви надсилаєте провайдерам моделей (Anthropic/OpenAI тощо), ідуть до
      їхніх API, а чат-платформи (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на своїх
      серверах.
    - **Ви контролюєте обсяг:** використання локальних моделей тримає prompts на вашій машині, але трафік каналу
      усе одно проходить через сервери цього каналу.

    Пов’язане: [Workspace агента](/uk/concepts/agent-workspace), [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе живе під `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Path                                                            | Призначення                                                        |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основна конфігурація (JSON5)                                       |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Застарілий імпорт OAuth (копіюється в auth profiles при першому використанні) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Профілі автентифікації (OAuth, API keys і необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язковий file-backed secret payload для провайдерів `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Застарілий файл сумісності (статичні записи `api_key` очищено)     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдера (наприклад `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан для кожного агента (agentDir + sessions)                      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і стан (для кожного агента)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані сесій (для кожного агента)                                |

    Застарілий шлях для одного агента: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`).

    Ваш **workspace** (`AGENTS.md`, файли пам’яті, Skills тощо) розташований окремо й налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають лежати AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли живуть у **workspace агента**, а не в `~/.openclaw`.

    - **Workspace (для кожного агента)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (або застарілий запасний варіант `memory.md`, якщо `MEMORY.md` відсутній),
      `memory/YYYY-MM-DD.md`, необов’язковий `HEARTBEAT.md`.
    - **State dir (`~/.openclaw`)**: конфігурація, стан каналів/провайдерів, auth profiles, sessions, logs,
      і спільні Skills (`~/.openclaw/skills`).

    Типовий workspace — `~/.openclaw/workspace`, налаштовується через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот «забуває» після перезапуску, переконайтеся, що Gateway використовує той самий
    workspace при кожному запуску (і пам’ятайте: у віддаленому режимі використовується **workspace хоста gateway**,
    а не вашого локального ноутбука).

    Порада: якщо ви хочете стійку поведінку або вподобання, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладатися на історію чату.

    Див. [Workspace агента](/uk/concepts/agent-workspace) і [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Помістіть ваш **workspace агента** у **приватний** git-репозиторій і робіть його резервні копії
    у приватному місці (наприклад приватний GitHub). Це збереже пам’ять + файли AGENTS/SOUL/USER
    та дозволить вам пізніше відновити «розум» асистента.

    **Не** робіть commit нічого з `~/.openclaw` (credentials, sessions, tokens або encrypted secrets payloads).
    Якщо вам потрібне повне відновлення, робіть резервні копії і workspace, і state directory
    окремо (див. питання про міграцію вище).

    Документація: [Workspace агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окремий гайд: [Видалення](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть агенти працювати поза workspace?">
    Так. Workspace — це **типовий cwd** і якір пам’яті, а не жорсткий sandbox.
    Відносні шляхи визначаються всередині workspace, але абсолютні шляхи можуть звертатися до інших
    розташувань хоста, якщо sandboxing не ввімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування sandbox для окремих агентів. Якщо ви
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

  <Accordion title="Віддалений режим: де зберігаються сесії?">
    Станом сесій володіє **хост gateway**. Якщо ви працюєте у віддаленому режимі, потрібне вам сховище сесій знаходиться на віддаленій машині, а не на локальному ноутбуці. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи конфігурації

<AccordionGroup>
  <Accordion title="Який формат конфігурації? Де вона?">
    OpenClaw читає необов’язкову конфігурацію **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються досить безпечні типові значення (включно з типовим workspace `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я встановив gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Bind без loopback **вимагає дійсного шляху автентифікації gateway**. На практиці це означає:

    - shared-secret auth: токен або пароль
    - `gateway.auth.mode: "trusted-proxy"` за правильно налаштованим identity-aware reverse proxy без loopback

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
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як запасний варіант лише тоді, коли `gateway.auth.*` не задано.
    - Для автентифікації паролем задайте `gateway.auth.mode: "password"` разом із `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef, але не визначено, визначення fail-closed (без маскувального remote fallback).
    - Налаштування shared-secret у Control UI автентифікуються через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях app/UI). Режими з ідентичністю, такі як Tailscale Serve або `trusted-proxy`, натомість використовують заголовки запитів. Уникайте розміщення shared secrets в URL.
    - З `gateway.auth.mode: "trusted-proxy"` reverse proxy на loopback на тому самому хості все одно **не** задовольняють trusted-proxy auth. Trusted proxy має бути налаштованим джерелом без loopback.

  </Accordion>

  <Accordion title="Чому тепер на localhost мені потрібен токен?">
    OpenClaw за замовчуванням вимагає автентифікацію gateway, включно з loopback. У нормальному типовому сценарії це означає token auth: якщо явний шлях автентифікації не налаштовано, запуск gateway переходить у режим token і автоматично генерує його, зберігаючи в `gateway.auth.token`, тому **локальні WS-клієнти мають автентифікуватися**. Це блокує інші локальні процеси від виклику Gateway.

    Якщо вам більше підходить інший шлях автентифікації, ви можете явно вибрати режим пароля (або, для identity-aware reverse proxy без loopback, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно задайте `gateway.auth.mode: "none"` у конфігурації. Doctor може згенерувати токен у будь-який момент: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни конфігурації?">
    Gateway відстежує конфігурацію і підтримує hot-reload:

    - `gateway.reload.mode: "hybrid"` (типово): hot-apply для безпечних змін, restart для критичних
    - також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Як вимкнути кумедні tagline у CLI?">
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

    - `off`: приховує текст tagline, але залишає рядок назви/версії banner.
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: ротаційні кумедні/сезонні tagline (типова поведінка).
    - Якщо ви взагалі не хочете banner, задайте env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути web search (і web fetch)?">
    `web_fetch` працює без API key. `web_search` залежить від вибраного
    провайдера:

    - Провайдери на основі API, такі як Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, вимагають звичайного налаштування API key.
    - Ollama Web Search не потребує ключа, але використовує налаштований хост Ollama і вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна HTML-інтеграція.
    - SearXNG не потребує ключа/self-hosted; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Рекомендовано:** виконайте `openclaw configure --section web` і виберіть провайдера.
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

    Конфігурація web-search для провайдера тепер знаходиться під `plugins.entries.<plugin>.config.webSearch.*`.
    Застарілі шляхи провайдера `tools.web.search.*` усе ще тимчасово завантажуються для сумісності, але їх не слід використовувати для нових конфігурацій.
    Конфігурація запасного web-fetch Firecrawl знаходиться під `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlists, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` увімкнено за замовчуванням (якщо його явно не вимкнено).
    - Якщо `tools.web.fetch.provider` опущено, OpenClaw автоматично визначає першого готового запасного провайдера fetch з доступних credentials. Наразі bundled-провайдер — Firecrawl.
    - Демони читають env vars з `~/.openclaw/.env` (або з середовища сервісу).

    Документація: [Web tools](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мою конфігурацію. Як відновитися і уникнути цього?">
    `config.apply` замінює **всю конфігурацію**. Якщо ви надсилаєте частковий об’єкт, все
    інше видаляється.

    Відновлення:

    - Відновіть із резервної копії (git або скопійований `~/.openclaw/openclaw.json`).
    - Якщо резервної копії немає, повторно запустіть `openclaw doctor` і знову налаштуйте канали/моделі.
    - Якщо це сталося неочікувано, створіть bug report і додайте вашу останню відому конфігурацію або будь-яку резервну копію.
    - Локальний coding-агент часто може відновити робочу конфігурацію з логів або історії.

    Як уникнути:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивного редагування.
    - Спочатку використовуйте `config.schema.lookup`, якщо ви не впевнені в точному шляху або формі поля; він повертає поверхневий вузол схеми плюс короткі зведення безпосередніх дочірніх елементів для поетапного заглиблення.
    - Використовуйте `config.patch` для часткових RPC-редагувань; залиште `config.apply` лише для повної заміни конфігурації.
    - Якщо ви використовуєте owner-only інструмент `gateway` у запуску агента, він усе одно відхилить записи в `tools.exec.ask` / `tools.exec.security` (включно зі застарілими псевдонімами `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими workers на різних пристроях?">
    Поширений шаблон — **один Gateway** (наприклад Raspberry Pi) плюс **nodes** і **agents**:

    - **Gateway (центральний):** володіє каналами (Signal/WhatsApp), маршрутизацією і сесіями.
    - **Nodes (пристрої):** Mac/iOS/Android підключаються як периферія та надають локальні інструменти (`system.run`, `canvas`, `camera`).
    - **Agents (workers):** окремі «мізки»/workspace для спеціальних ролей (наприклад «Hetzner ops», «Personal data»).
    - **Sub-agents:** породжують фонову роботу з основного агента, коли потрібен паралелізм.
    - **TUI:** підключається до Gateway і перемикає агентів/сесії.

    Документація: [Nodes](/uk/nodes), [Віддалений доступ](/uk/gateway/remote), [Багатоагентна маршрутизація](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Чи може браузер OpenClaw працювати у headless-режимі?">
    Так. Це опція конфігурації:

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

    За замовчуванням `false` (headful). Headless частіше викликає антибот-перевірки на деяких сайтах. Див. [Browser](/uk/tools/browser).

    Headless використовує **той самий рушій Chromium** і працює для більшості автоматизації (форми, кліки, скрапінг, логіни). Основні відмінності:

    - Немає видимого вікна браузера (використовуйте скріншоти, якщо потрібна візуалізація).
    - Деякі сайти суворіше ставляться до автоматизації в режимі headless (CAPTCHAs, anti-bot).
      Наприклад, X/Twitter часто блокує headless sessions.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування браузером?">
    Задайте `browser.executablePath` для вашого бінарника Brave (або будь-якого браузера на базі Chromium) і перезапустіть Gateway.
    Див. повні приклади конфігурації в [Browser](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateways і nodes

<AccordionGroup>
  <Accordion title="Як команди проходять між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляє **gateway**. Gateway запускає агента і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен інструмент node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідний трафік провайдера; вони отримують лише виклики node RPC.

  </Accordion>

  <Accordion title="Як мій агент може отримати доступ до мого комп’ютера, якщо Gateway розміщений віддалено?">
    Коротка відповідь: **під’єднайте ваш комп’ютер як node**. Gateway працює деінде, але він може
    викликати інструменти `node.*` (screen, camera, system) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на постійно ввімкненому хості (VPS/домашній сервер).
    2. Помістіть хост Gateway і ваш комп’ютер в один tailnet.
    3. Переконайтеся, що Gateway WS доступний (tailnet bind або SSH tunnel).
    4. Локально відкрийте застосунок macOS і підключіться в режимі **Remote over SSH** (або напряму через tailnet),
       щоб він міг зареєструватися як node.
    5. Підтвердьте node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP bridge не потрібен; nodes підключаються через Gateway WebSocket.

    Нагадування щодо безпеки: під’єднання macOS node дозволяє `system.run` на цій машині. Підключайте
    лише пристрої, яким довіряєте, і перегляньте [Безпеку](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Gateway protocol](/uk/gateway/protocol), [віддалений режим macOS](/uk/platforms/mac/remote), [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключений, але я не отримую відповідей. Що тепер?">
    Перевірте основи:

    - Gateway працює: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан каналу: `openclaw channels status`

    Потім перевірте автентифікацію та маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` задано правильно.
    - Якщо ви підключаєтеся через SSH tunnel, переконайтеся, що локальний тунель активний і вказує на правильний порт.
    - Переконайтеся, що ваші allowlists (DM або group) містять ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Віддалений доступ](/uk/gateway/remote), [Канали](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два екземпляри OpenClaw спілкуватися між собою (локальний + VPS)?">
    Так. Вбудованого моста «бот-до-бота» немає, але це можна зібрати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний чат-канал, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Бот A надсилає повідомлення Боту B, а тоді Бот B відповідає як завжди.

    **CLI bridge (загальний):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючись на чат, який слухає інший бот.
    Якщо один бот працює на віддаленому VPS, направте ваш CLI на цей віддалений Gateway
    через SSH/Tailscale (див. [Віддалений доступ](/uk/gateway/remote)).

    Приклад шаблону (запускати з машини, яка може досягнути цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте обмеження, щоб два боти не зациклювалися безкінечно (режим лише за згадкою, channel
    allowlists або правило «не відповідати на повідомлення ботів»).

    Документація: [Віддалений доступ](/uk/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох агентів?">
    Ні. Один Gateway може хостити кількох агентів, кожен зі своїм workspace, типовими моделями
    та маршрутизацією. Це нормальна схема, і вона значно дешевша й простіша, ніж запуск
    одного VPS на агента.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні конфігурації, які ви не хочете ділити. В іншому разі тримайте один Gateway і
    використовуйте кілька агентів або sub-agents.

  </Accordion>

  <Accordion title="Чи є перевага у використанні node на моєму особистому ноутбуці замість SSH із VPS?">
    Так — nodes є основним способом дістатися до ноутбука з віддаленого Gateway, і вони
    відкривають більше, ніж просто shell-доступ. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким (малий VPS або коробка класу Raspberry Pi цілком підходять; 4 GB RAM більш ніж достатньо), тому поширене
    налаштування — це постійно ввімкнений хост плюс ваш ноутбук як node.

    - **Немає потреби у вхідному SSH.** Nodes самі підключаються до Gateway WebSocket і використовують pairинг пристроїв.
    - **Безпечніший контроль виконання.** `system.run` контролюється allowlists/approvals node на цьому ноутбуці.
    - **Більше інструментів пристрою.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна автоматизація браузера.** Тримайте Gateway на VPS, але запускайте Chrome локально через node host на ноутбуці або підключайтеся до локального Chrome на хості через Chrome MCP.

    SSH підходить для епізодичного shell-доступу, але nodes простіші для постійних агентських workflows і
    автоматизації пристроїв.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають nodes сервіс gateway?">
    Ні. Лише **один gateway** має працювати на хості, якщо тільки ви навмисно не запускаєте ізольовані профілі (див. [Кілька gateways](/uk/gateway/multiple-gateways)). Nodes — це периферія, яка підключається
    до gateway (nodes на iOS/Android або режим «node mode» у menubar app на macOS). Для headless node
    hosts і керування через CLI див. [Node host CLI](/cli/node).

    Повний restart потрібен для змін `gateway`, `discovery` і `canvasHost`.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати конфігурацію?">
    Так.

    - `config.schema.lookup`: перевірити одне піддерево конфігурації з його поверхневим вузлом схеми, підібраною підказкою UI та короткими зведеннями безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний знімок + hash
    - `config.patch`: безпечне часткове оновлення (переважно для більшості RPC-редагувань)
    - `config.apply`: перевірити + замінити повну конфігурацію, потім перезапустити
    - Owner-only runtime tool `gateway` усе ще відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

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

  <Accordion title="Як налаштувати Tailscale на VPS і під’єднатися з Mac?">
    Мінімальні кроки:

    1. **Встановіть + увійдіть на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Встановіть + увійдіть на Mac**
       - Використайте застосунок Tailscale і увійдіть у той самий tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - У консолі адміністратора Tailscale увімкніть MagicDNS, щоб VPS мав стабільну назву.
    4. **Використовуйте ім’я хоста tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо ви хочете Control UI без SSH, використовуйте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це залишає gateway прив’язаним до loopback і відкриває HTTPS через Tailscale. Див. [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="Як підключити Mac node до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Gateway Control UI + WS**. Nodes підключаються через ту ж WS endpoint Gateway.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS + Mac в одному tailnet**.
    2. **Використовуйте застосунок macOS у Remote mode** (ціллю SSH може бути ім’я хоста tailnet).
       Застосунок пробросить порт Gateway і підключиться як node.
    3. **Підтвердьте node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Gateway protocol](/uk/gateway/protocol), [Discovery](/uk/gateway/discovery), [віддалений режим macOS](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи варто встановлювати на другий ноутбук, чи просто додати node?">
    Якщо вам потрібні лише **локальні інструменти** (screen/camera/exec) на другому ноутбуці, додайте його як
    **node**. Так ви збережете один Gateway і уникнете дублювання конфігурації. Локальні node tools
    наразі доступні лише на macOS, але ми плануємо поширити їх на інші ОС.

    Встановлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes), [Кілька gateways](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars і завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує environment variables?">
    OpenClaw читає env vars із батьківського процесу (shell, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` з поточного робочого каталогу
    - глобальний fallback `.env` з `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден із `.env` файлів не перевизначає вже наявні env vars.

    Ви також можете задавати inline env vars у конфігурації (застосовуються лише якщо їх бракує у process env):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Див. [/environment](/uk/help/environment) для повного пріоритету та джерел.

  </Accordion>

  <Accordion title="Я запустив Gateway через сервіс, і мої env vars зникли. Що тепер?">
    Два поширені виправлення:

    1. Помістіть відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися, навіть коли сервіс не успадковує env вашої оболонки.
    2. Увімкніть імпорт оболонки (опційна зручність):

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

    Це запускає вашу login shell і імпортує лише очікувані відсутні ключі (ніколи не перевизначає). Еквіваленти env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Я задав COPILOT_GITHUB_TOKEN, але models status показує "Shell env: off." Чому?'>
    `openclaw models status` повідомляє, чи увімкнено **імпорт shell env**. «Shell env: off»
    **не** означає, що ваших env vars бракує — це лише означає, що OpenClaw не буде
    автоматично завантажувати вашу login shell.

    Якщо Gateway працює як сервіс (launchd/systemd), він не успадковує середовище вашої оболонки.
    Виправлення — зробити одне з цього:

    1. Помістити токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або ввімкнути імпорт shell (`env.shellEnv.enabled: true`).
    3. Або додати його в блок `env` конфігурації (застосовується лише якщо ключа бракує).

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

  <Accordion title="Чи скидаються сесії автоматично, якщо я ніколи не надсилаю /new?">
    Сесії можуть завершуватися після `session.idleMinutes`, але це **вимкнено за замовчуванням** (типово **0**).
    Задайте додатне значення, щоб увімкнути завершення через бездіяльність. Коли це ввімкнено, **наступне**
    повідомлення після періоду бездіяльності запускає новий session id для цього chat key.
    Це не видаляє транскрипти — просто починає нову сесію.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб зробити команду з екземплярів OpenClaw (один CEO і багато агентів)?">
    Так, через **багатоагентну маршрутизацію** і **sub-agents**. Ви можете створити одного координатора
    та кількох агентів-працівників із власними workspace і моделями.

    Втім, краще ставитися до цього як до **цікавого експерименту**. Це важко для токенів і часто
    менш ефективно, ніж використання одного бота з окремими сесіями. Типова модель, яку
    ми уявляємо, — це один бот, з яким ви говорите, але з різними сесіями для паралельної роботи. Цей
    бот також може за потреби породжувати sub-agents.

    Документація: [Багатоагентна маршрутизація](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст обрізався посеред завдання? Як цьому запобігти?">
    Контекст сесії обмежений вікном моделі. Довгі чати, великий вивід інструментів або багато
    файлів можуть спричинити стискання або обрізання.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими завданнями та `/new` під час зміни тем.
    - Зберігайте важливий контекст у workspace і попросіть бота знову його прочитати.
    - Використовуйте sub-agents для довгої чи паралельної роботи, щоб основний чат залишався меншим.
    - Оберіть модель із більшим контекстним вікном, якщо це часто трапляється.

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

    - Онбординг також пропонує **Reset**, якщо бачить наявну конфігурацію. Див. [Онбординг (CLI)](/uk/start/wizard).
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скиньте кожен state dir (типово це `~/.openclaw-<profile>`).
    - Скидання для dev: `openclaw gateway --dev --reset` (лише для dev; стирає dev config + credentials + sessions + workspace).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або стиснути?'>
    Використовуйте один із цих варіантів:

    - **Стиснення** (зберігає розмову, але підсумовує старі ходи):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб спрямувати підсумок.

    - **Скидання** (новий session ID для того самого chat key):

      ```
      /new
      /reset
      ```

    Якщо це продовжує траплятися:

    - Увімкніть або налаштуйте **session pruning** (`agents.defaults.contextPruning`), щоб обрізати старий вивід інструментів.
    - Використовуйте модель із більшим контекстним вікном.

    Документація: [Compaction](/uk/concepts/compaction), [Session pruning](/uk/concepts/session-pruning), [Керування сесіями](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка валідації провайдера: модель згенерувала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що історія сесії застаріла або пошкоджена (часто після довгих тредів
    або зміни інструмента/схеми).

    Виправлення: почніть нову сесію через `/new` (окреме повідомлення).

  </Accordion>

  <Accordion title="Чому я отримую heartbeat-повідомлення кожні 30 хвилин?">
    За замовчуванням heartbeats запускаються кожні **30m** (**1h** при використанні OAuth auth). Налаштуйте або вимкніть їх:

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

    Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та markdown-заголовки
    на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб заощадити API-виклики.
    Якщо файл відсутній, heartbeat усе одно запускається, і модель сама вирішує, що робити.

    Перевизначення для кожного агента використовують `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "bot account" до групи WhatsApp?'>
    Ні. OpenClaw працює на **вашому власному обліковому записі**, тож якщо ви є в групі, OpenClaw може її бачити.
    За замовчуванням відповіді в групах блокуються, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

    Якщо ви хочете, щоб тільки **ви** могли запускати відповіді в групі:

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
    Варіант 1 (найшвидший): дивіться логи та надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Шукайте `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/в allowlist): перелічіть групи з конфігурації:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/cli/directory), [Логи](/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Дві поширені причини:

    - Увімкнено керування згадками (типово). Ви повинні @згадати бота (або відповідати `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і група не входить до allowlist.

    Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи ділять групи/треди контекст із DM?">
    Direct chats за замовчуванням згортаються в основну сесію. Групи/канали мають власні ключі сесій, а Telegram topics / Discord threads — це окремі сесії. Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки workspace і агентів я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але звертайте увагу на:

    - **Зростання диска:** sessions + transcripts живуть у `~/.openclaw/agents/<agentId>/sessions/`.
    - **Витрати токенів:** більше агентів означає більше одночасного використання моделей.
    - **Операційне навантаження:** auth profiles, workspaces і channel routing для кожного агента.

    Поради:

    - Тримайте один **активний** workspace на агента (`agents.defaults.workspace`).
    - Очищайте старі сесії (видаляйте JSONL або записи сховища), якщо диск росте.
    - Використовуйте `openclaw doctor`, щоб знаходити зайві workspaces і невідповідності профілів.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька ботів або чатів одночасно (Slack), і як це налаштувати?">
    Так. Використовуйте **Багатоагентну маршрутизацію**, щоб запускати кілька ізольованих агентів і маршрутизувати вхідні повідомлення за
    каналом/обліковим записом/peer. Slack підтримується як канал і може бути прив’язаний до конкретних агентів.

    Доступ браузера потужний, але це не «робить усе, що може людина» — anti-bot, CAPTCHAs і MFA можуть
    усе одно блокувати автоматизацію. Для найнадійнішого керування браузером використовуйте локальний Chrome MCP на хості
    або CDP на машині, яка фактично запускає браузер.

    Найкраща практика налаштування:

    - Завжди ввімкнений хост Gateway (VPS/Mac mini).
    - Один агент на роль (bindings).
    - Канали Slack, прив’язані до цих агентів.
    - Локальний браузер через Chrome MCP або node, коли це потрібно.

    Документація: [Багатоагентна маршрутизація](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Browser](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі: типові значення, вибір, псевдоніми, перемикання

<AccordionGroup>
  <Accordion title='Що таке "типова модель"?'>
    Типова модель OpenClaw — це те, що ви задаєте як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються як `provider/model` (приклад: `openai/gpt-5.4`). Якщо ви оп