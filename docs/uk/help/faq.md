---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час виконання
    - Сортування проблем, про які повідомляють користувачі, перед глибшим налагодженням
summary: Поширені запитання про налаштування, конфігурацію та використання OpenClaw
title: Поширені запитання
x-i18n:
    generated_at: "2026-04-20T12:31:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9441a569bade4b862b115df0537183473b457470218e9b3e18539d503318f13
    source_path: help/faq.md
    workflow: 15
---

# Поширені запитання

Швидкі відповіді плюс глибше усунення несправностей для реальних сценаріїв налаштування (локальна розробка, VPS, multi-agent, OAuth/API ключі, резервне перемикання моделей). Для діагностики під час виконання дивіться [Усунення несправностей](/uk/gateway/troubleshooting). Для повного довідника з конфігурації дивіться [Конфігурація](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламано

1. **Швидкий статус (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидке локальне зведення: ОС + оновлення, доступність gateway/сервісу, агенти/сесії, конфігурація провайдера + проблеми під час виконання (коли gateway доступний).

2. **Звіт, який можна вставити й поширити (безпечно ділитися)**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з хвостом журналу (токени замасковано).

3. **Стан демона + порту**

   ```bash
   openclaw gateway status
   ```

   Показує стан supervisor під час виконання порівняно з доступністю RPC, цільову URL-адресу probe і яку конфігурацію сервіс, імовірно, використовував.

4. **Глибокі probe-перевірки**

   ```bash
   openclaw status --deep
   ```

   Виконує живу probe-перевірку стану gateway, включно з probe-перевірками каналів, коли це підтримується
   (потрібен доступний gateway). Дивіться [Стан](/uk/gateway/health).

5. **Переглянути останній журнал у реальному часі**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використайте запасний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові журнали відокремлені від журналів сервісу; дивіться [Журналювання](/uk/logging) і [Усунення несправностей](/uk/gateway/troubleshooting).

6. **Запустити doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує конфігурацію/стан + виконує перевірки стану. Дивіться [Doctor](/uk/gateway/doctor).

7. **Знімок стану gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # показує цільову URL-адресу + шлях до конфігурації при помилках
   ```

   Запитує в запущеного gateway повний знімок стану (лише WS). Дивіться [Стан](/uk/gateway/health).

## Швидкий старт і початкове налаштування

<AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб вибратися">
    Використайте локального AI-агента, який може **бачити вашу машину**. Це набагато ефективніше, ніж питати
    у Discord, тому що більшість випадків «я застряг» — це **локальні проблеми конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти журнали й допомагати виправляти
    налаштування на рівні машини (PATH, сервіси, дозволи, файли автентифікації). Надайте їм **повну checkout-копію вихідного коду** через
    hackable (git) install:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **з checkout-копії git**, тож агент може читати код + документацію та
    міркувати про точну версію, яку ви запускаєте. Ви завжди можете повернутися до стабільної версії пізніше,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати й супроводжувати** виправлення (крок за кроком), а потім виконати лише
    потрібні команди. Так зміни залишаються невеликими й їх легше перевірити.

    Якщо ви виявите реальну помилку або виправлення, будь ласка, створіть issue на GitHub або надішліть PR:
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

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламано](#перші-60-секунд-якщо-щось-зламано).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску Heartbeat:

    - `quiet-hours`: поза налаштованим вікном active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожній каркас або лише заголовки
    - `no-tasks-due`: режим завдань `HEARTBEAT.md` активний, але для жодного з інтервалів завдань ще не настав час
    - `alerts-disabled`: уся видимість heartbeat вимкнена (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові позначки настання строку оновлюються лише після завершення
    реального запуску heartbeat. Пропущені запуски не позначають завдання як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановлення й налаштування OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання онбордингу:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати UI-ресурси. Після онбордингу ви зазвичай запускаєте Gateway на порту **18789**.

    Із вихідного коду (contributors/dev):

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

  <Accordion title="Як відкрити dashboard після онбордингу?">
    Майстер відкриває ваш браузер із чистою (без токена) URL-адресою dashboard одразу після онбордингу, а також друкує посилання у підсумку. Залиште цю вкладку відкритою; якщо вона не запустилася, скопіюйте й вставте надруковану URL-адресу на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати dashboard на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується автентифікація за shared secret, вставте налаштований токен або пароль у налаштуваннях Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо shared secret ще не налаштовано, згенеруйте токен командою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште bind loopback, виконайте `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставлення shared secret, за умови довіреного хоста gateway); HTTP API однаково вимагають автентифікацію за shared secret, якщо ви свідомо не використовуєте private-ingress `none` або HTTP-автентифікацію trusted-proxy.
      Некоректні одночасні спроби автентифікації Serve від одного клієнта серіалізуються до того, як лімітатор невдалих автентифікацій зафіксує їх, тому вже під час другої невдалої повторної спроби може з’явитися `retry later`.
    - **Tailnet bind**: виконайте `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний shared secret у налаштуваннях dashboard.
    - **Identity-aware reverse proxy**: залиште Gateway за trusted proxy не на loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL-адресу proxy.
    - **SSH-тунель**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`. Автентифікація за shared secret і далі застосовується через тунель; вставте налаштований токен або пароль, якщо з’явиться запит.

    Дивіться [Dashboard](/web/dashboard) і [Веб-поверхні](/web) для подробиць про режими bind і автентифікацію.

  </Accordion>

  <Accordion title="Чому є дві конфігурації погодження exec для погоджень у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на погодження до чат-призначень
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом погоджень для погоджень exec

    Політика exec на хості все одно є реальним бар’єром погодження. Конфігурація чату лише визначає, де саме
    з’являються запити на погодження і як люди можуть на них відповідати.

    У більшості сценаріїв вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди й відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначити тих, хто погоджує, OpenClaw тепер автоматично вмикає нативні погодження DM-first, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні нативні картки/кнопки погодження, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve` лише якщо результат інструмента каже, що погодження в чаті недоступні або єдиний шлях — ручне погодження.
    - Використовуйте `approvals.exec` лише коли запити також потрібно пересилати до інших чатів або окремих ops-кімнат.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише якщо ви явно хочете, щоб запити на погодження публікувалися назад у вихідну кімнату/тему.
    - Погодження Plugin — це ще окрема категорія: вони типово використовують `/approve` у тому самому чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі нативні канали додатково зберігають нативну обробку погоджень Plugin.

    Коротко: пересилання — для маршрутизації, конфігурація нативного клієнта — для багатшого UX, специфічного для каналу.
    Дивіться [Погодження Exec](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке середовище виконання мені потрібне?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендований** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легкий — у документації вказано, що для особистого використання достатньо **512 МБ–1 ГБ RAM**, **1 ядра** та приблизно **500 МБ**
    дискового простору, а також зазначено, що **Raspberry Pi 4 може це запускати**.

    Якщо вам потрібен додатковий запас (журнали, медіа, інші сервіси), **рекомендовано 2 ГБ**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може хостити Gateway, а ви можете підключати **nodes** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Дивіться [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є якісь поради щодо встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте певних незручностей.

    - Використовуйте **64-бітну** ОС і Node >= 22.
    - Надавайте перевагу **hackable (git) install**, щоб бачити журнали й швидко оновлюватися.
    - Почніть без каналів/Skills, а потім додавайте їх по одному.
    - Якщо натрапите на дивні проблеми з бінарними файлами, зазвичай це проблема **сумісності ARM**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Все зависло на wake up my friend / onboarding не запускається. Що тепер?">
    Цей екран залежить від того, чи доступний і автентифікований Gateway. TUI також надсилає
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

    3. Якщо все одно зависає, виконайте:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що тунель/з’єднання Tailscale активне і що UI
    вказує на правильний Gateway. Дивіться [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini), не проходячи онбординг заново?">
    Так. Скопіюйте **каталог стану** і **workspace**, а потім один раз запустіть Doctor. Це
    збереже вашого бота «точно таким самим» (пам’ять, історія сесій, автентифікація та
    стан каналу), якщо ви скопіюєте **обидва** розташування:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте свій workspace (типово: `~/.openclaw/workspace`).
    4. Виконайте `openclaw doctor` і перезапустіть сервіс Gateway.

    Це зберігає конфігурацію, профілі автентифікації, облікові дані WhatsApp, сесії та пам’ять. Якщо ви працюєте
    у віддаленому режимі, пам’ятайте, що хост gateway володіє сховищем сесій і workspace.

    **Важливо:** якщо ви лише commit/push свій workspace у GitHub, ви створюєте резервну копію
    **пам’яті + bootstrap-файлів**, але **не** історії сесій або автентифікації. Вони зберігаються
    у `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Міграція](/uk/install/migrating), [Де все зберігається на диску](#where-things-live-on-disk),
    [Workspace агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи розташовані вгорі. Якщо верхній розділ позначено як **Unreleased**, то наступний датований
    розділ — це остання випущена версія. Записи згруповані за категоріями **Highlights**, **Changes** і
    **Fixes** (а також docs/інші розділи за потреби).

  </Accordion>

  <Accordion title="Не вдається отримати доступ до docs.openclaw.ai (помилка SSL)">
    Деякі підключення Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до allowlist, а потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати сайт, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дзеркалюється на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай стабільний реліз спочатку потрапляє в **beta**, а потім явний
    крок підвищення переміщує цю саму версію в `latest`. За потреби maintainers також можуть
    публікувати одразу в `latest`. Саме тому beta і stable можуть
    вказувати на **ту саму версію** після підвищення.

    Подивитися, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Для однорядкових команд встановлення і різниці між beta та dev дивіться accordion нижче.

  </Accordion>

  <Accordion title="Як установити beta-версію і яка різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (може збігатися з `latest` після підвищення).
    **Dev** — це рухома голова `main` (git); коли її публікують, використовується npm dist-tag `dev`.

    Однорядкові команди (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Інсталятор для Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Більше деталей: [Канали розробки](/uk/install/development-channels) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як спробувати найновіші зміни?">
    Є два варіанти:

    1. **Канал dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає вас на гілку `main` і оновлює з вихідного коду.

    2. **Hackable install (із сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає вам локальний репозиторій, який ви можете редагувати, а потім оновлювати через git.

    Якщо ви віддаєте перевагу чистому clone вручну, використайте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Оновлення](/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай займає встановлення та онбординг?">
    Приблизний орієнтир:

    - **Встановлення:** 2–5 хвилин
    - **Онбординг:** 5–15 хвилин залежно від того, скільки каналів/моделей ви налаштовуєте

    Якщо все зависає, використайте [Інсталятор завис?](#quick-start-and-first-run-setup)
    і швидкий цикл налагодження в [Я застряг](#quick-start-and-first-run-setup).

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

  <Accordion title="Під час встановлення у Windows з’являється git not found або openclaw not recognized">
    Дві поширені проблеми у Windows:

    **1) Помилка npm spawn git / git not found**

    - Установіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, потім повторно запустіть інсталятор.

    **2) Після встановлення `openclaw` не розпізнається**

    - Ваша глобальна папка bin npm відсутня в PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до вашого PATH користувача (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо вам потрібне максимально безпроблемне налаштування у Windows, використовуйте **WSL2** замість нативного Windows.
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

    Якщо ви все ще відтворюєте це в останній версії OpenClaw, відстежуйте/повідомляйте тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використайте **hackable (git) install**, щоб мати повний вихідний код і документацію локально, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг прочитати репозиторій і відповісти точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Більше деталей: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як установити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтеся інструкції для Linux, а потім запустіть онбординг.

    - Швидкий шлях для Linux + встановлення сервісу: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення та оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як установити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Установіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Інструкції: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де інструкції зі встановлення у хмарі/VPS?">
    У нас є **хаб хостингу** з поширеними провайдерами. Виберіть одного й дотримуйтесь інструкції:

    - [VPS-хостинг](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює у хмарі: **Gateway запускається на сервері**, а ви отримуєте до нього доступ
    зі свого ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан + workspace
    зберігаються на сервері, тож вважайте хост джерелом істини й робіть його резервні копії.

    Ви можете підключати **nodes** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб мати доступ
    до локального екрана/камери/canvas або запускати команди на ноутбуці, залишаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити самого себе?">
    Коротка відповідь: **можливо, але не рекомендовано**. Процес оновлення може перезапустити
    Gateway (що перерве активну сесію), може вимагати чистого git checkout і
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

    Документація: [Оновлення](/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить онбординг?">
    `openclaw onboard` — це рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделей/автентифікації** (OAuth провайдера, API ключі, Anthropic setup-token, а також варіанти локальних моделей, наприклад LM Studio)
    - розташування **workspace** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також bundled channel plugins, такі як QQ Bot)
    - **Встановлення демона** (LaunchAgent у macOS; systemd user unit у Linux/WSL2)
    - **Перевірки стану** і вибір **Skills**

    Він також попереджає, якщо налаштована модель невідома або для неї відсутня автентифікація.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw з **API ключами** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації в цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **API ключ Anthropic**: звичайне білінгування Anthropic API
    - **Claude CLI / автентифікація через підписку Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw розглядає використання `claude -p`
      як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довгоживучих хостів gateway API ключі Anthropic усе ще є більш
    передбачуваним варіантом налаштування. OpenAI Codex OAuth явно підтримується для зовнішніх
    інструментів, таких як OpenClaw.

    OpenClaw також підтримує інші хостовані варіанти у стилі підписки, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [Моделі GLM](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API ключа?">
    Так.

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому
    OpenClaw вважає автентифікацію через підписку Claude і використання `claude -p`
    санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
    Якщо вам потрібне найбільш передбачуване налаштування на стороні сервера, замість цього використовуйте API ключ Anthropic.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тому OpenClaw вважає
    повторне використання Claude CLI і використання `claude -p` санкціонованими для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Anthropic setup-token усе ще доступний як підтримуваний шлях токена OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI і `claude -p`, коли це доступно.
    Для production або багатокористувацьких навантажень автентифікація через API ключ Anthropic усе ще є
    безпечнішим і передбачуванішим вибором. Якщо вас цікавлять інші хостовані
    варіанти у стилі підписки в OpenClaw, дивіться [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
Це означає, що вашу **квоту/ліміт запитів Anthropic** вичерпано для поточного вікна. Якщо ви
використовуєте **Claude CLI**, зачекайте, поки вікно скинеться, або оновіть свій план. Якщо ви
використовуєте **API ключ Anthropic**, перевірте Anthropic Console
щодо використання/білінгу та за потреби підвищте ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, запит намагається використовувати
    1M context beta від Anthropic (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані мають право на білінг довгого контексту (білінг за API ключем або
    шлях входу OpenClaw Claude з увімкненим Extra Usage).

    Порада: налаштуйте **резервну модель**, щоб OpenClaw міг продовжувати відповідати, поки провайдер обмежений rate limit.
    Дивіться [Моделі](/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має bundled провайдер **Amazon Bedrock (Converse)**. За наявності AWS env markers OpenClaw може автоматично виявляти каталог Bedrock для streaming/text і об’єднувати його як неявний провайдер `amazon-bedrock`; в іншому разі ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис провайдера вручну. Дивіться [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний proxy перед Bedrock також залишається чинним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Онбординг може запустити OAuth-потік і за потреби встановить модель за замовчуванням `openai-codex/gpt-5.4`. Дивіться [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому ChatGPT GPT-5.4 не розблоковує openai/gpt-5.4 в OpenClaw?">
    OpenClaw розглядає ці два шляхи окремо:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = прямий API OpenAI Platform

    В OpenClaw вхід через ChatGPT/Codex прив’язаний до маршруту `openai-codex/*`,
    а не до прямого маршруту `openai/*`. Якщо ви хочете прямий API-шлях в
    OpenClaw, установіть `OPENAI_API_KEY` (або еквівалентну конфігурацію провайдера OpenAI).
    Якщо ви хочете вхід через ChatGPT/Codex в OpenClaw, використовуйте `openai-codex/*`.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    `openai-codex/*` використовує маршрут Codex OAuth, а його доступні вікна квот
    керуються OpenAI і залежать від плану. На практиці ці ліміти можуть відрізнятися від
    досвіду використання сайту/застосунку ChatGPT, навіть якщо обидва прив’язані до одного облікового запису.

    OpenClaw може показувати поточні видимі вікна використання/квоти провайдера в
    `openclaw models status`, але він не вигадує і не нормалізує права ChatGPT-web
    у прямий доступ до API. Якщо ви хочете прямий шлях білінгу/лімітів OpenAI Platform,
    використовуйте `openai/*` з API ключем.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth підписки OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання OAuth підписки в зовнішніх інструментах/процесах,
    таких як OpenClaw. Онбординг може запустити OAuth-потік для вас.

    Дивіться [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **Plugin auth flow**, а не client id чи secret у `openclaw.json`.

    Кроки:

    1. Установіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Модель за замовчуванням після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не працюють, установіть `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає OAuth-токени в профілях автентифікації на хості gateway. Деталі: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; малі карти обрізають і протікають. Якщо це необхідно, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і дивіться [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі підвищують ризик prompt injection — дивіться [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як утримувати трафік хостованих моделей у певному регіоні?">
    Вибирайте endpoint-и з прив’язкою до регіону. OpenRouter надає US-hosted варіанти для MiniMax, Kimi і GLM; вибирайте варіант, хостований у США, щоб дані залишалися в регіоні. Ви все одно можете перелічувати Anthropic/OpenAI поряд із ними, використовуючи `models.mode: "merge"`, щоб резервні варіанти залишалися доступними, водночас дотримуючись вибраного вами регіонального провайдера.
  </Accordion>

  <Accordion title="Чи потрібно купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini — необов’язковий: деякі люди
    купують його як постійно ввімкнений хост, але також підійде невеликий VPS, домашній сервер або пристрій класу Raspberry Pi.

    Mac потрібен лише для **інструментів лише для macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або підключайте macOS node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, на якому виконано вхід у Messages. Це **не** обов’язково має бути Mac mini —
    підійде будь-який Mac. Для iMessage **використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) — сервер BlueBubbles працює на macOS, тоді як Gateway може працювати на Linux або деінде.

    Типові сценарії:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac із входом у Messages.
    - Запускайте все на Mac, якщо хочете найпростішу конфігурацію на одній машині.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи зможу під’єднати його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може під’єднатися як
    **node** (супутній пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, як-от екран/камера/canvas і `system.run` на цьому пристрої.

    Типовий шаблон:

    - Gateway на Mac mini (завжди ввімкнений).
    - MacBook Pro запускає застосунок macOS або node host і під’єднується до Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я використовувати Bun?">
    Bun **не рекомендований**. Ми спостерігаємо помилки під час виконання, особливо з WhatsApp і Telegram.
    Для стабільних gateway використовуйте **Node**.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на непродакшн gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що має бути в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім’я користувача бота.

    Під час налаштування запитуються лише числові user ID. Якщо у вашій конфігурації вже є застарілі записи `@username`, `openclaw doctor --fix` може спробувати їх розв’язати.

    Безпечніший варіант (без стороннього бота):

    - Напишіть своєму боту в DM, потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть своєму боту в DM, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватний):

    - Напишіть у DM `@userinfobot` або `@getidsbot`.

    Дивіться [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними інстансами OpenClaw?">
    Так, через **маршрутизацію multi-agent**. Прив’яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, sender E.164 на кшталт `+15551234567`) до різного `agentId`, щоб кожна людина мала власний workspace і сховище сесій. Відповіді все одно надходитимуть з **того самого облікового запису WhatsApp**, а контроль доступу до DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Дивіться [Маршрутизація Multi-Agent](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента "швидкий чат" і агента "Opus для кодування"?'>
    Так. Використовуйте маршрутизацію multi-agent: надайте кожному агенту власну модель за замовчуванням, а потім прив’яжіть вхідні маршрути (обліковий запис провайдера або конкретні peers) до кожного агента. Приклад конфігурації наведено в [Маршрутизації Multi-Agent](/uk/concepts/multi-agent). Дивіться також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу включає `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, знаходилися в оболонках без входу в систему.
    Останні збірки також додають на початок типові каталоги user bin у сервісах Linux systemd (наприклад, `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо вони задані.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повний checkout вихідного коду, можна редагувати, найкраще для contributors.
      Ви локально запускаєте збірки й можете вносити зміни в код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію «просто запустити».
      Оновлення надходять із npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm і git install?">
    Так. Установіть інший варіант, а потім запустіть Doctor, щоб сервіс gateway вказував на нову entrypoint.
    Це **не видаляє ваші дані** — змінюється лише встановлення коду OpenClaw. Ваш стан
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

    Із git на npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor виявляє невідповідність entrypoint сервісу gateway і пропонує переписати конфігурацію сервісу відповідно до поточного встановлення (використовуйте `--repair` в автоматизації).

    Поради щодо резервного копіювання: дивіться [Стратегія резервного копіювання](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібен
    найменший тертя і ви нормально ставитеся до сну/перезапусків, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Переваги:** без вартості сервера, прямий доступ до локальних файлів, видиме вікно браузера в реальному часі.
    - **Недоліки:** сон/мережеві обриви = відключення, оновлення ОС/перезавантаження переривають роботу, машина має залишатися активною.

    **VPS / хмара**

    - **Переваги:** завжди увімкнено, стабільна мережа, немає проблем зі сном ноутбука, легше підтримувати безперервну роботу.
    - **Недоліки:** часто headless-режим (використовуйте скриншоти), лише віддалений доступ до файлів, для оновлень потрібен SSH.

    **Примітка щодо OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord чудово працюють із VPS. Єдиний реальний компроміс — це **headless browser** проти видимого вікна. Дивіться [Browser](/uk/tools/browser).

    **Рекомендовано за замовчуванням:** VPS, якщо у вас раніше були відключення gateway. Локальний запуск чудово підходить, коли ви активно користуєтеся Mac і хочете мати доступ до локальних файлів або автоматизації UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Це не обов’язково, але **рекомендується для надійності та ізоляції**.

    - **Окремий хост (VPS/Mac mini/Pi):** завжди увімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, легше підтримувати безперервну роботу.
    - **Спільний ноутбук/настільний ПК:** цілком підходить для тестування й активного використання, але очікуйте пауз, коли машина переходить у сон або оновлюється.

    Якщо ви хочете найкраще з обох світів, тримайте Gateway на окремому хості, а ноутбук під’єднуйте як **node** для локальних інструментів екрана/камери/exec. Дивіться [Nodes](/uk/nodes).
    Для рекомендацій із безпеки прочитайте [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і рекомендована ОС?">
    OpenClaw легкий. Для базового Gateway + одного чат-каналу:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM, ~500 МБ диска.
    - **Рекомендовано:** 1–2 vCPU, 2 ГБ RAM або більше для запасу (журнали, медіа, кілька каналів). Інструменти Node і автоматизація браузера можуть бути вимогливими до ресурсів.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях встановлення для Linux там протестований найкраще.

    Документація: [Linux](/uk/platforms/linux), [VPS-хостинг](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди ввімкненою, доступною і мати достатньо
    RAM для Gateway і будь-яких каналів, які ви ввімкнете.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM.
    - **Рекомендовано:** 2 ГБ RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера чи медіа-інструменти.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви працюєте у Windows, **WSL2 — це найпростіше налаштування у стилі VM** і воно має найкращу
    сумісність інструментів. Дивіться [Windows](/uk/platforms/windows), [VPS-хостинг](/uk/vps).
    Якщо ви запускаєте macOS у VM, дивіться [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw, в одному абзаці?">
    OpenClaw — це персональний AI-помічник, який ви запускаєте на власних пристроях. Він відповідає на поверхнях обміну повідомленнями, якими ви вже користуєтеся (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, а також bundled channel plugins, такі як QQ Bot) і також може працювати з голосом + live Canvas на підтримуваних платформах. **Gateway** — це постійно увімкнена control plane; помічник — це продукт.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не «просто обгортка для Claude». Це **локальна насамперед control plane**, яка дає вам змогу запускати
    потужного помічника на **вашому власному обладнанні**, доступного з чат-застосунків, якими ви вже користуєтеся, зі
    станом сесій, пам’яттю та інструментами — без передачі контролю над вашими процесами хостованому
    SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway там, де хочете (Mac, Linux, VPS), і зберігайте
      workspace + історію сесій локально.
    - **Реальні канали, а не веб-пісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      плюс мобільний голос і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо з маршрутизацією
      та резервним перемиканням на рівні агента.
    - **Варіант лише локально:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо ви цього хочете.
    - **Маршрутизація multi-agent:** окремі агенти для кожного каналу, облікового запису або завдання, кожен зі своїм
      workspace і налаштуваннями за замовчуванням.
    - **Відкритий код і hackable:** перевіряйте, розширюйте й self-host без vendor lock-in.

    Документація: [Gateway](/uk/gateway), [Канали](/uk/channels), [Multi-agent](/uk/concepts/multi-agent),
    [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно все налаштував — що мені зробити спочатку?">
    Хороші перші проєкти:

    - Створіть вебсайт (WordPress, Shopify або простий статичний сайт).
    - Прототипуйте мобільний застосунок (план, екрани, план API).
    - Організуйте файли та папки (очищення, найменування, тегування).
    - Під’єднайте Gmail і автоматизуйте підсумки або подальші дії.

    Він може виконувати великі завдання, але найкраще працює, коли ви ділите їх на фази і
    використовуєте sub agents для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найпоширеніших повсякденних сценаріїв використання OpenClaw?">
    Повсякденна користь зазвичай виглядає так:

    - **Персональні зведення:** підсумки пошти, календаря та новин, які для вас важливі.
    - **Дослідження та чернетки:** швидкі дослідження, підсумки й перші чернетки для листів або документів.
    - **Нагадування та подальші дії:** підказки й чеклісти на основі Cron або Heartbeat.
    - **Автоматизація браузера:** заповнення форм, збір даних і повторювані веб-завдання.
    - **Координація між пристроями:** надішліть завдання з телефону, дайте Gateway виконати його на сервері й отримайте результат назад у чат.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, рекламою та блогами для SaaS?">
    Так, для **дослідження, кваліфікації та створення чернеток**. Він може сканувати сайти, формувати shortlists,
    підсумовувати інформацію про потенційних клієнтів і писати чернетки outreach або рекламних текстів.

    Для **outreach або запуску реклами** залишайте людину в циклі. Уникайте спаму, дотримуйтеся місцевих законів і
    політик платформ, а також перевіряйте все перед надсиланням. Найбезпечніший шаблон — дозволити
    OpenClaw створити чернетку, а вам — погодити її.

    Документація: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний помічник** і рівень координації, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу кодування в репозиторії. Використовуйте OpenClaw, коли вам
    потрібні довготривала пам’ять, доступ із різних пристроїв та оркестрація інструментів.

    Переваги:

    - **Постійна пам’ять + workspace** між сесіями
    - **Доступ із різних платформ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (browser, files, scheduling, hooks)
    - **Постійно увімкнений Gateway** (запускайте на VPS, взаємодійте звідусіль)
    - **Nodes** для локального browser/screen/camera/exec

    Вітрина: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills і автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати skills, не залишаючи репозиторій у брудному стані?">
    Використовуйте керовані override-заміни замість редагування копії в репозиторії. Зберігайте свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, тож керовані override-заміни все одно мають пріоритет над bundled skills без змін у git. Якщо вам потрібно, щоб skill був установлений глобально, але видимий лише певним агентам, зберігайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` та `agents.list[].skills`. Лише зміни, варті апстріму, мають жити в репозиторії та надсилатися як PR.
  </Accordion>

  <Accordion title="Чи можу я завантажувати skills із власної папки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Пріоритет за замовчуванням: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` установлює в `./skills` за замовчуванням, що OpenClaw трактує як `<workspace>/skills` у наступній сесії. Якщо skill має бути видимим лише певним агентам, поєднайте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як використовувати різні моделі для різних завдань?">
    Сьогодні підтримуються такі шаблони:

    - **Cron jobs**: ізольовані завдання можуть задавати override `model` для кожного завдання.
    - **Sub-agents**: маршрутизуйте завдання до окремих агентів з різними моделями за замовчуванням.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб у будь-який момент перемкнути модель поточної сесії.

    Дивіться [Cron jobs](/uk/automation/cron-jobs), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent) і [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як це винести?">
    Використовуйте **sub-agents** для довгих або паралельних завдань. Sub-agents працюють у власній сесії,
    повертають підсумок і зберігають чутливість вашого основного чату.

    Попросіть бота «spawn a sub-agent for this task» або використайте `/subagents`.
    Використовуйте `/status` у чаті, щоб побачити, що Gateway робить просто зараз (і чи він зайнятий).

    Порада щодо токенів: довгі завдання й sub-agents обидва споживають токени. Якщо вартість важлива, установіть
    дешевшу модель для sub-agents через `agents.defaults.subagents.model`.

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють прив’язані до thread сесії subagent у Discord?">
    Використовуйте прив’язки thread. Ви можете прив’язати Discord thread до subagent або session target, щоб наступні повідомлення в цьому thread залишалися в межах цієї прив’язаної сесії.

    Базовий процес:

    - Створіть через `sessions_spawn` з `thread: true` (і за бажанням `mode: "session"` для постійших подальших повідомлень).
    - Або прив’яжіть вручну через `/focus <target>`.
    - Використовуйте `/agents`, щоб перевірити стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати автоматичним зняттям фокуса.
    - Використовуйте `/unfocus`, щоб від’єднати thread.

    Потрібна конфігурація:

    - Глобальні значення за замовчуванням: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override-значення для Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоприв’язка під час spawn: установіть `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Sub-agents](/uk/tools/subagents), [Discord](/uk/channels/discord), [Довідник із конфігурації](/uk/gateway/configuration-reference), [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent завершився, але оновлення про завершення надійшло не туди або взагалі не було опубліковано. Що перевірити?">
    Спочатку перевірте розв’язаний маршрут запитувача:

    - Доставка subagent у режимі completion надає перевагу будь-якому прив’язаному thread або маршруту розмови, якщо такий існує.
    - Якщо джерело completion містить лише канал, OpenClaw використовує запасний варіант — збережений маршрут сесії запитувача (`lastChannel` / `lastTo` / `lastAccountId`), щоб пряма доставка все одно могла спрацювати.
    - Якщо немає ні прив’язаного маршруту, ні придатного збереженого маршруту, пряма доставка може не вдатися, і тоді результат замість негайної публікації в чаті переходить до доставки через чергу сесії.
    - Некоректні або застарілі цілі все одно можуть змусити перейти до запасного варіанта з чергою або спричинити остаточну помилку доставки.
    - Якщо остання видима відповідь помічника від дочірнього елемента — це точний тихий токен `NO_REPLY` / `no_reply` або точно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує анонс, щоб не публікувати застарілий попередній прогрес.
    - Якщо дочірній елемент завершився за тайм-аутом після лише викликів інструментів, анонс може згорнути це в короткий підсумок часткового прогресу замість відтворення сирого виводу інструментів.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks), [Інструмент Session](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron виконується всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані завдання не виконуватимуться.

    Контрольний список:

    - Переконайтеся, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не встановлено.
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
    - Відсутня або некоректна ціль анонсу (`channel` / `to`) означає, що runner пропустив вихідну доставку.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що runner спробував виконати доставку, але облікові дані її заблокували.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` і нічого більше) вважається навмисно недоставлюваним, тому runner також пригнічує запасну доставку через чергу.

    Для ізольованих Cron jobs runner відповідає за фінальну доставку. Від агента очікується
    повернення підсумку звичайним текстом, який runner надішле. `--no-deliver` зберігає
    цей результат внутрішнім; він не дозволяє агенту натомість надсилати напряму через
    message tool.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований запуск cron переключив моделі або один раз повторився?">
    Зазвичай це шлях live-перемикання моделі, а не дубльоване планування.

    Ізольований cron може зберегти runtime-передачу моделі й повторити спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повторна спроба зберігає переключений
    provider/model, а якщо перемикання також містило новий override профілю автентифікації, cron
    зберігає і його перед повтором.

    Пов’язані правила вибору:

    - Override моделі хука Gmail має найвищий пріоритет, коли застосовується.
    - Потім іде `model` для конкретного завдання.
    - Потім будь-який збережений override моделі сесії cron.
    - Потім звичайний вибір моделі агента/за замовчуванням.

    Цикл повторних спроб обмежений. Після початкової спроби плюс 2 повторів перемикання
    cron перериває роботу замість нескінченного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [CLI cron](/cli/cron).

  </Accordion>

  <Accordion title="Як установити Skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або просто помістіть skills у свій workspace. UI Skills для macOS недоступний на Linux.
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

    Нативний `openclaw skills install` записує у каталог `skills/`
    активного workspace. Окремий CLI `clawhub` встановлюйте лише якщо хочете публікувати або
    синхронізувати власні skills. Для спільних встановлень між агентами розміщуйте skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете звузити коло агентів, які можуть його бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати завдання за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте планувальник Gateway:

    - **Cron jobs** для запланованих або повторюваних завдань (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок «основної сесії».
    - **Ізольовані завдання** для автономних агентів, які публікують підсумки або доставляють їх у чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати skills Apple лише для macOS із Linux?">
    Не напряму. Skills для macOS обмежуються `metadata.openclaw.os` плюс необхідними бінарними файлами, і skills з’являються в системному prompt лише тоді, коли вони придатні на **хості Gateway**. На Linux skills лише для `darwin` (як-от `apple-notes`, `apple-reminders`, `things-mac`) не завантажуватимуться, якщо ви не перевизначите це обмеження.

    У вас є три підтримувані шаблони:

    **Варіант A — запускати Gateway на Mac (найпростіше).**
    Запускайте Gateway там, де існують бінарні файли macOS, а потім підключайтеся з Linux у [віддаленому режимі](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажуються нормально, тому що хост Gateway — це macOS.

    **Варіант B — використовувати macOS node (без SSH).**
    Запускайте Gateway на Linux, під’єднайте macOS node (застосунок у menu bar) і встановіть **Node Run Commands** на «Always Ask» або «Always Allow» на Mac. OpenClaw може вважати skills лише для macOS придатними, коли потрібні бінарні файли існують на node. Агент запускає ці skills через інструмент `nodes`. Якщо ви виберете «Always Ask», підтвердження «Always Allow» у запиті додасть цю команду до allowlist.

    **Варіант C — проксувати бінарні файли macOS через SSH (просунутий).**
    Залиште Gateway на Linux, але зробіть так, щоб потрібні CLI-бінарні файли розв’язувалися у SSH-обгортки, які виконуються на Mac. Потім перевизначте skill, щоб дозволити Linux, і він залишався придатним.

    1. Створіть SSH-обгортку для бінарного файла (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Помістіть обгортку в `PATH` на хості Linux (наприклад `~/bin/memo`).
    3. Перевизначте metadata skill (workspace або `~/.openclaw/skills`), щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Почніть нову сесію, щоб оновився snapshot skills.

  </Accordion>

  <Accordion title="У вас є інтеграція з Notion або HeyGen?">
    Вбудованої наразі немає.

    Варіанти:

    - **Власний skill / Plugin:** найкраще для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Автоматизація браузера:** працює без коду, але повільніше й менш надійно.

    Якщо ви хочете зберігати контекст окремо для кожного клієнта (процеси агентства), простий шаблон такий:

    - Одна сторінка Notion на кожного клієнта (контекст + уподобання + активна робота).
    - Попросіть агента отримувати цю сторінку на початку сесії.

    Якщо ви хочете нативну інтеграцію, створіть запит на нову функцію або побудуйте skill,
    орієнтований на ці API.

    Установлення skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні встановлення потрапляють у каталог `skills/` активного workspace. Для спільних skills між агентами розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі агенти, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі skills очікують бінарні файли, установлені через Homebrew; на Linux це означає Linuxbrew (дивіться запис FAQ про Homebrew на Linux вище). Дивіться [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати свій уже авторизований Chrome з OpenClaw?">
    Використовуйте вбудований профіль browser `user`, який під’єднується через Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Якщо вам потрібна власна назва, створіть явний профіль MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Цей шлях може використовувати локальний browser хоста або під’єднаний browser node. Якщо Gateway працює деінде, або запускайте node host на машині з браузером, або використовуйте віддалений CDP.

    Поточні обмеження для `existing-session` / `user`:

    - дії керуються через ref, а не через CSS-селектори
    - завантаження файлів вимагає `ref` / `inputRef` і зараз підтримує лише один файл за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії все ще вимагають керованого browser або сирого профілю CDP

  </Accordion>
</AccordionGroup>

## Ізоляція та пам’ять

<AccordionGroup>
  <Accordion title="Чи є окрема документація про ізоляцію?">
    Так. Дивіться [Ізоляція](/uk/gateway/sandboxing). Для налаштування, специфічного для Docker (повний gateway у Docker або образи ізоляції), дивіться [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повні можливості?">
    Образ за замовчуванням орієнтований насамперед на безпеку й запускається від користувача `node`, тому він не
    містить системних пакетів, Homebrew або вбудованих браузерів. Для повнішого налаштування:

    - Зберігайте `/home/node` через `OPENCLAW_HOME_VOLUME`, щоб кеші не зникали.
    - Додавайте системні залежності в образ через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Установлюйте браузери Playwright через вбудований CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Установіть `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я зберегти DM особистими, а групи зробити публічними/ізольованими з одним агентом?">
    Так — якщо ваш приватний трафік це **DM**, а публічний трафік — **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб групові/канальні сесії (ключі non-main) працювали в Docker, а основна DM-сесія залишалася на хості. Потім обмежте, які інструменти доступні в ізольованих сесіях, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Групи: особисті DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Довідник з ключової конфігурації: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив’язати папку хоста до ізоляції?">
    Установіть `agents.defaults.sandbox.docker.binds` у `["host:path:mode"]` (наприклад, `"/home/user/src:/src:ro"`). Глобальні прив’язки й прив’язки на рівні агента об’єднуються; прив’язки на рівні агента ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для будь-чого чутливого й пам’ятайте, що прив’язки обходять файлові стіни ізоляції.

    OpenClaw перевіряє джерела bind як відносно нормалізованого шляху, так і відносно канонічного шляху, розв’язаного через найглибший наявний предок. Це означає, що виходи за межі через батьківський symlink все одно безпечно блокуються, навіть якщо останній сегмент шляху ще не існує, а перевірки allowed-root також застосовуються після розв’язання symlink.

    Дивіться [Ізоляція](/uk/gateway/sandboxing#custom-bind-mounts) і [Ізоляція vs політика інструментів vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) для прикладів і приміток щодо безпеки.

  </Accordion>

  <Accordion title="Як працює пам’ять?">
    Пам’ять OpenClaw — це просто Markdown-файли у workspace агента:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Кураторські довгострокові нотатки в `MEMORY.md` (лише основні/приватні сесії)

    OpenClaw також виконує **тихий pre-compaction flush пам’яті**, щоб нагадати моделі
    записати важливі нотатки перед автоматичною Compaction. Це виконується лише тоді, коли workspace
    доступний для запису (ізольовані середовища лише для читання це пропускають). Дивіться [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Пам’ять постійно забуває речі. Як зробити, щоб це зберігалося?">
    Попросіть бота **записати факт у пам’ять**. Довгострокові нотатки мають зберігатися в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це все ще сфера, яку ми покращуємо. Допомагає нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона продовжує забувати, перевірте, що Gateway використовує той самий
    workspace під час кожного запуску.

    Документація: [Пам’ять](/uk/concepts/memory), [Workspace агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Чи зберігається пам’ять назавжди? Які обмеження?">
    Файли пам’яті живуть на диску й зберігаються, доки ви їх не видалите. Обмеженням є ваше
    сховище, а не модель. **Контекст сесії** все одно обмежений вікном контексту
    моделі, тому довгі розмови можуть стискатися або обрізатися. Саме тому
    існує semantic memory search — він повертає в контекст лише релевантні частини.

    Документація: [Пам’ять](/uk/concepts/memory), [Контекст](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потрібен для semantic memory search API ключ OpenAI?">
    Лише якщо ви використовуєте **OpenAI embeddings**. Codex OAuth покриває chat/completions і
    **не** надає доступу до embeddings, тому **вхід через Codex (OAuth або
    вхід через Codex CLI)** не допомагає для semantic memory search. Для OpenAI embeddings
    усе ще потрібен справжній API ключ (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви явно не вказуєте провайдера, OpenClaw автоматично вибирає провайдера, коли
    може розв’язати API ключ (профілі автентифікації, `models.providers.*.apiKey` або env vars).
    Він віддає перевагу OpenAI, якщо розв’язується ключ OpenAI, інакше Gemini, якщо розв’язується ключ Gemini,
    потім Voyage, потім Mistral. Якщо віддалений ключ недоступний, memory
    search залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштовано й наявний шлях до локальної моделі, OpenClaw
    віддає перевагу `local`. Ollama підтримується, коли ви явно встановлюєте
    `memorySearch.provider = "ollama"`.

    Якщо ви волієте залишатися локально, установіть `memorySearch.provider = "local"` (і за бажанням
    `memorySearch.fallback = "none"`). Якщо вам потрібні Gemini embeddings, установіть
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо embedding-моделі **OpenAI, Gemini, Voyage, Mistral, Ollama або local** —
    дивіться [Пам’ять](/uk/concepts/memory) для деталей налаштування.

  </Accordion>
</AccordionGroup>

## Де все зберігається на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, що використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** сесії, файли пам’яті, конфігурація й workspace живуть на хості Gateway
      (`~/.openclaw` + каталог вашого workspace).
    - **Віддалено за необхідністю:** повідомлення, які ви надсилаєте провайдерам моделей (Anthropic/OpenAI тощо), надходять до
      їхніх API, а чат-платформи (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на
      своїх серверах.
    - **Ви контролюєте відбиток:** використання локальних моделей залишає prompt-и на вашій машині, але трафік
      каналів усе одно проходить через сервери відповідного каналу.

    Пов’язане: [Workspace агента](/uk/concepts/agent-workspace), [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе зберігається в `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Path                                                            | Призначення                                                         |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основна конфігурація (JSON5)                                       |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Імпорт застарілого OAuth (копіюється в профілі автентифікації під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Профілі автентифікації (OAuth, API ключі та необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язкове секретне корисне навантаження на основі файлу для провайдерів `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Файл застарілої сумісності (статичні записи `api_key` очищаються)  |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдера (наприклад `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан для кожного агента окремо (agentDir + sessions)               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і стан (для кожного агента)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані сесій (для кожного агента)                                |

    Застарілий шлях single-agent: `~/.openclaw/agent/*` (мігрується командою `openclaw doctor`).

    Ваш **workspace** (`AGENTS.md`, файли пам’яті, skills тощо) зберігається окремо й налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають зберігатися AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли зберігаються у **workspace агента**, а не в `~/.openclaw`.

    - **Workspace (для кожного агента):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (або застарілий запасний варіант `memory.md`, якщо `MEMORY.md` відсутній),
      `memory/YYYY-MM-DD.md`, необов’язковий `HEARTBEAT.md`.
    - **State dir (`~/.openclaw`)**: конфігурація, стан каналу/провайдера, профілі автентифікації, сесії, журнали,
      і спільні skills (`~/.openclaw/skills`).

    Workspace за замовчуванням — `~/.openclaw/workspace`, налаштовується через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот «забуває» після перезапуску, переконайтеся, що Gateway використовує той самий
    workspace під час кожного запуску (і пам’ятайте: віддалений режим використовує **workspace хоста gateway**,
    а не вашого локального ноутбука).

    Порада: якщо ви хочете зберегти поведінку або вподобання надовго, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладатися на історію чату.

    Дивіться [Workspace агента](/uk/concepts/agent-workspace) і [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Зберігайте свій **workspace агента** у **приватному** git-репозиторії й створюйте його резервні копії в
    приватному місці (наприклад, у приватному GitHub). Це збереже пам’ять + файли AGENTS/SOUL/USER
    і дозволить відновити «розум» помічника пізніше.

    **Не** робіть commit нічого з `~/.openclaw` (облікові дані, сесії, токени або зашифровані payload-и секретів).
    Якщо вам потрібне повне відновлення, окремо створюйте резервні копії як workspace, так і state directory
    (дивіться запитання про міграцію вище).

    Документація: [Workspace агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Дивіться окрему інструкцію: [Видалення](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть агенти працювати поза workspace?">
    Так. Workspace — це **cwd за замовчуванням** і якір пам’яті, а не жорстка ізоляція.
    Відносні шляхи розв’язуються всередині workspace, але абсолютні шляхи можуть отримати доступ до інших
    розташувань хоста, якщо ізоляцію не ввімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування ізоляції для окремого агента. Якщо ви
    хочете, щоб репозиторій був робочим каталогом за замовчуванням, вкажіть у цього агента
    `workspace` на корінь репозиторію. Репозиторій OpenClaw — це лише вихідний код; тримайте
    workspace окремо, якщо тільки ви свідомо не хочете, щоб агент працював усередині нього.

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

  <Accordion title="Віддалений режим: де зберігаються сесії?">
    Стан сесії належить **хосту gateway**. Якщо ви у віддаленому режимі, потрібне вам сховище сесій знаходиться на віддаленій машині, а не на вашому локальному ноутбуці. Дивіться [Керування сесіями](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи конфігурації

<AccordionGroup>
  <Accordion title="Який формат конфігурації? Де вона знаходиться?">
    OpenClaw читає необов’язкову конфігурацію **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються достатньо безпечні значення за замовчуванням (зокрема workspace за замовчуванням `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я встановив gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Для bind не на loopback **потрібен дійсний шлях автентифікації gateway**. На практиці це означає:

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
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як запасний варіант лише тоді, коли `gateway.auth.*` не задано.
    - Для автентифікації паролем натомість установіть `gateway.auth.mode: "password"` разом із `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef, але не розв’язано, розв’язання безпечно завершується помилкою (без маскувального запасного варіанта через remote).
    - Конфігурації shared-secret для Control UI автентифікуються через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях застосунку/UI). Режими з передаванням ідентичності, такі як Tailscale Serve або `trusted-proxy`, замість цього використовують заголовки запитів. Уникайте розміщення shared secrets в URL.
    - За `gateway.auth.mode: "trusted-proxy"` reverse proxy на loopback того самого хоста все одно **не** задовольняють автентифікацію trusted-proxy. Trusted proxy має бути налаштованим джерелом не на loopback.

  </Accordion>

  <Accordion title="Чому мені тепер потрібен токен на localhost?">
    OpenClaw за замовчуванням примусово застосовує автентифікацію gateway, зокрема і на loopback. У звичайному шляху за замовчуванням це означає автентифікацію токеном: якщо явний шлях автентифікації не налаштовано, під час запуску gateway вибирається режим токена і автоматично генерується токен, який зберігається в `gateway.auth.token`, тому **локальні WS-клієнти мають автентифікуватися**. Це блокує іншим локальним процесам можливість викликати Gateway.

    Якщо ви віддаєте перевагу іншому шляху автентифікації, можете явно вибрати режим пароля (або, для identity-aware reverse proxy не на loopback, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно встановіть `gateway.auth.mode: "none"` у конфігурації. Doctor може згенерувати токен для вас у будь-який момент: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни конфігурації?">
    Gateway стежить за конфігурацією і підтримує гаряче перезавантаження:

    - `gateway.reload.mode: "hybrid"` (типово): гаряче застосовує безпечні зміни, перезапускає для критичних
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
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: ротація кумедних/сезонних слоганів (типова поведінка).
    - Якщо ви взагалі не хочете банер, установіть env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути вебпошук (і web fetch)?">
    `web_fetch` працює без API ключа. `web_search` залежить від вибраного
    провайдера:

    - Провайдери на основі API, такі як Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, потребують звичайного налаштування API ключів.
    - Ollama Web Search не потребує ключа, але використовує налаштований вами хост Ollama і вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна інтеграція на основі HTML.
    - SearXNG не потребує ключа / self-hosted; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Рекомендовано:** виконайте `openclaw configure --section web` і виберіть провайдера.
    Альтернативи через змінні середовища:

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

    Специфічна для провайдера конфігурація вебпошуку тепер знаходиться в `plugins.entries.<plugin>.config.webSearch.*`.
    Застарілі шляхи провайдера `tools.web.search.*` усе ще тимчасово завантажуються для сумісності, але їх не слід використовувати для нових конфігурацій.
    Конфігурація запасного варіанта web-fetch для Firecrawl знаходиться в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlist, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` увімкнено за замовчуванням (якщо його явно не вимкнено).
    - Якщо `tools.web.fetch.provider` пропущено, OpenClaw автоматично виявляє першого готового резервного провайдера fetch із доступних облікових даних. Наразі bundled провайдер — це Firecrawl.
    - Демони читають env vars із `~/.openclaw/.env` (або середовища сервісу).

    Документація: [Веб-інструменти](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мій конфіг. Як відновитися і як цього уникнути?">
    `config.apply` замінює **всю конфігурацію повністю**. Якщо ви надсилаєте частковий об’єкт, усе
    інше видаляється.

    Поточний OpenClaw захищає від багатьох випадкових перезаписів:

    - Записи конфігурації, якими керує OpenClaw, перевіряють повну конфігурацію після зміни перед записом.
    - Некоректні або руйнівні записи, якими керує OpenClaw, відхиляються і зберігаються як `openclaw.json.rejected.*`.
    - Якщо пряме редагування ламає запуск або гаряче перезавантаження, Gateway відновлює останню відому робочу конфігурацію і зберігає відхилений файл як `openclaw.json.clobbered.*`.
    - Після відновлення основний агент отримує попередження під час запуску, щоб він не записав сліпо погану конфігурацію знову.

    Відновлення:

    - Перевірте `openclaw logs --follow` на наявність `Config auto-restored from last-known-good`, `Config write rejected:` або `config reload restored last-known-good config`.
    - Перегляньте найновіший `openclaw.json.clobbered.*` або `openclaw.json.rejected.*` поруч з активною конфігурацією.
    - Залиште активну відновлену конфігурацію, якщо вона працює, а потім поверніть лише потрібні ключі через `openclaw config set` або `config.patch`.
    - Виконайте `openclaw config validate` і `openclaw doctor`.
    - Якщо у вас немає останньої відомої робочої конфігурації або відхиленого payload, відновіть із резервної копії або повторно виконайте `openclaw doctor` і заново налаштуйте канали/моделі.
    - Якщо це було неочікувано, створіть bug і додайте останню відому конфігурацію або будь-яку резервну копію.
    - Локальний coding agent часто може відновити робочу конфігурацію з журналів або історії.

    Як уникнути цього:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивного редагування.
    - Спочатку використовуйте `config.schema.lookup`, коли ви не впевнені щодо точного шляху або форми поля; воно повертає неглибокий вузол схеми плюс підсумки безпосередніх дочірніх елементів для покрокового заглиблення.
    - Використовуйте `config.patch` для часткових RPC-редагувань; залишайте `config.apply` лише для повної заміни конфігурації.
    - Якщо ви використовуєте інструмент `gateway` лише для owner з запуску агента, він усе одно відхилятиме записи в `tools.exec.ask` / `tools.exec.security` (включно із застарілими псевдонімами `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Конфігурація](/cli/config), [Налаштування](/cli/configure), [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими workers на різних пристроях?">
    Типовий шаблон — **один Gateway** (наприклад Raspberry Pi) плюс **nodes** і **agents**:

    - **Gateway (центральний):** володіє каналами (Signal/WhatsApp), маршрутизацією та сесіями.
    - **Nodes (пристрої):** Mac/iOS/Android під’єднуються як периферія і надають локальні інструменти (`system.run`, `canvas`, `camera`).
    - **Agents (workers):** окремі «мізки»/workspace для спеціальних ролей (наприклад, «Hetzner ops», «Особисті дані»).
    - **Sub-agents:** запускають фонову роботу з основного агента, коли вам потрібен паралелізм.
    - **TUI:** під’єднується до Gateway і перемикає agents/sessions.

    Документація: [Nodes](/uk/nodes), [Віддалений доступ](/uk/gateway/remote), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [TUI](/web/tui).

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

    Типове значення — `false` (з видимим вікном). Headless-режим частіше викликає перевірки anti-bot на деяких сайтах. Дивіться [Browser](/uk/tools/browser).

    Headless використовує **той самий рушій Chromium** і працює для більшості автоматизацій (форми, кліки, scraping, входи). Основні відмінності:

    - Немає видимого вікна browser (використовуйте скриншоти, якщо вам потрібна візуалізація).
    - Деякі сайти суворіше ставляться до автоматизації в headless-режимі (CAPTCHA, anti-bot).
      Наприклад, X/Twitter часто блокує headless-сесії.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування browser?">
    Установіть `browser.executablePath` на ваш бінарний файл Brave (або будь-який browser на основі Chromium) і перезапустіть Gateway.
    Дивіться повні приклади конфігурації в [Browser](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway і nodes

<AccordionGroup>
  <Accordion title="Як команди поширюються між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає агента і
    лише потім викликає nodes через **WebSocket Gateway**, коли потрібен інструмент node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідного трафіку провайдера; вони отримують лише виклики RPC node.

  </Accordion>

  <Accordion title="Як мій агент може отримати доступ до мого комп’ютера, якщо Gateway розміщений віддалено?">
    Коротка відповідь: **під’єднайте свій комп’ютер як node**. Gateway працює деінде, але може
    викликати інструменти `node.*` (екран, камера, система) на вашій локальній машині через WebSocket Gateway.

    Типове налаштування:

    1. Запустіть Gateway на хості, який завжди увімкнений (VPS/домашній сервер).
    2. Помістіть хост Gateway і свій комп’ютер в одну й ту саму tailnet.
    3. Переконайтеся, що WS Gateway доступний (tailnet bind або SSH-тунель).
    4. Локально відкрийте застосунок macOS і під’єднайтеся в режимі **Remote over SSH** (або напряму через tailnet),
       щоб він міг зареєструватися як node.
    5. Погодьте node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP-міст не потрібен; nodes під’єднуються через WebSocket Gateway.

    Нагадування про безпеку: під’єднання macOS node дозволяє `system.run` на цій машині. Під’єднуйте
    лише ті пристрої, яким довіряєте, і перегляньте [Безпека](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Протокол Gateway](/uk/gateway/protocol), [Віддалений режим macOS](/uk/platforms/mac/remote), [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale під’єднано, але я не отримую відповідей. Що тепер?">
    Перевірте основи:

    - Gateway працює: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан каналів: `openclaw channels status`

    Потім перевірте автентифікацію та маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` налаштовано правильно.
    - Якщо ви під’єднуєтеся через SSH-тунель, переконайтеся, що локальний тунель активний і вказує на правильний порт.
    - Переконайтеся, що ваші allowlist-и (DM або група) включають ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Віддалений доступ](/uk/gateway/remote), [Канали](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два інстанси OpenClaw спілкуватися один з одним (локальний + VPS)?">
    Так. Вбудованого мосту «бот-до-бота» немає, але це можна налаштувати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний чат-канал, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай бот A надсилає повідомлення боту B, а потім бот B відповідає як зазвичай.

    **CLI-міст (загальний):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючись на чат, де слухає інший бот.
    Якщо один бот працює на віддаленому VPS, націльте свій CLI на той віддалений Gateway
    через SSH/Tailscale (дивіться [Віддалений доступ](/uk/gateway/remote)).

    Приклад шаблону (запускається на машині, яка може досягти цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте запобіжник, щоб два боти не зациклилися без кінця (відповіді лише на згадки, allowlist-и каналів або правило «не відповідати на повідомлення ботів»).

    Документація: [Віддалений доступ](/uk/gateway/remote), [CLI агента](/cli/agent), [Надсилання агентом](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох агентів?">
    Ні. Один Gateway може хостити кількох агентів, кожен зі своїм workspace, моделями за замовчуванням
    та маршрутизацією. Це нормальне налаштування, і воно набагато дешевше й простіше, ніж запускати
    окремий VPS для кожного агента.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні конфігурації, якими ви не хочете ділитися. В іншому випадку тримайте один Gateway і
    використовуйте кількох агентів або sub-agents.

  </Accordion>

  <Accordion title="Чи є перевага від використання node на моєму особистому ноутбуці замість SSH з VPS?">
    Так — nodes є основним способом доступу до вашого ноутбука з віддаленого Gateway, і вони
    дають більше, ніж просто доступ до оболонки. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким (достатньо невеликого VPS або пристрою класу Raspberry Pi; 4 ГБ RAM більш ніж достатньо), тому поширений
    сценарій — це завжди увімкнений хост плюс ваш ноутбук як node.

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до WebSocket Gateway і використовують парування пристроїв.
    - **Безпечніший контроль виконання.** `system.run` обмежується allowlist-ами/погодженнями node на цьому ноутбуці.
    - **Більше інструментів пристрою.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна автоматизація браузера.** Тримайте Gateway на VPS, але запускайте Chrome локально через node host на ноутбуці або під’єднуйтеся до локального Chrome на хості через Chrome MCP.

    SSH підходить для епізодичного доступу до оболонки, але nodes простіші для постійних агентних процесів і
    автоматизації пристроїв.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають nodes сервіс gateway?">
    Ні. На хості має працювати лише **один gateway**, якщо тільки ви навмисно не запускаєте ізольовані профілі (дивіться [Кілька gateway](/uk/gateway/multiple-gateways)). Nodes — це периферійні елементи, які підключаються
    до gateway (nodes iOS/Android або macOS «node mode» у застосунку menu bar). Для headless node
    host і керування через CLI дивіться [CLI Node host](/cli/node).

    Повний перезапуск потрібен для змін `gateway`, `discovery` і `canvasHost`.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати конфігурацію?">
    Так.

    - `config.schema.lookup`: перевірити одне піддерево конфігурації з його неглибоким вузлом схеми, відповідною UI-підказкою і підсумками безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний snapshot + hash
    - `config.patch`: безпечне часткове оновлення (переважний варіант для більшості RPC-редагувань); за можливості виконує гаряче перезавантаження, а за потреби — перезапуск
    - `config.apply`: перевірити й замінити всю конфігурацію; за можливості виконує гаряче перезавантаження, а за потреби — перезапуск
    - Інструмент runtime `gateway`, доступний лише owner, як і раніше відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

  </Accordion>

  <Accordion title="Мінімальна розумна конфігурація для першого встановлення">
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

    1. **Установіть + увійдіть на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Установіть + увійдіть на вашому Mac**
       - Використайте застосунок Tailscale і увійдіть у ту саму tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - У консолі адміністрування Tailscale увімкніть MagicDNS, щоб VPS мав стабільне ім’я.
    4. **Використовуйте ім’я хоста tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо ви хочете Control UI без SSH, використовуйте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це залишає gateway прив’язаним до loopback і відкриває HTTPS через Tailscale. Дивіться [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="Як підключити Mac node до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Control UI Gateway + WS**. Nodes підключаються через той самий endpoint Gateway WS.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS і Mac знаходяться в одній tailnet**.
    2. **Використовуйте застосунок macOS у режимі Remote** (ціллю SSH може бути ім’я хоста tailnet).
       Застосунок протунелює порт Gateway і підключиться як node.
    3. **Погодьте node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Протокол Gateway](/uk/gateway/protocol), [Discovery](/uk/gateway/discovery), [Віддалений режим macOS](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи варто встановлювати на другий ноутбук, чи просто додати node?">
    Якщо вам потрібні лише **локальні інструменти** (screen/camera/exec) на другому ноутбуці, додайте його як
    **node**. Це дозволяє зберегти один Gateway і уникнути дублювання конфігурації. Локальні інструменти node
    наразі доступні лише на macOS, але ми плануємо поширити їх і на інші ОС.

    Установлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes), [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars і завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує змінні середовища?">
    OpenClaw читає env vars із батьківського процесу (shell, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` з поточного робочого каталогу
    - глобальний запасний `.env` з `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден файл `.env` не перевизначає вже наявні env vars.

    Ви також можете визначити inline env vars у конфігурації (застосовуються лише якщо вони відсутні в env процесу):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Дивіться [/environment](/uk/help/environment) для повного порядку пріоритетів і джерел.

  </Accordion>

  <Accordion title="Я запустив Gateway через сервіс, і мої env vars зникли. Що тепер?">
    Два поширені виправлення:

    1. Помістіть відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися, навіть коли сервіс не успадковує env вашої shell.
    2. Увімкніть імпорт shell (opt-in convenience):

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

    Це запускає вашу login shell і імпортує лише відсутні очікувані ключі (ніколи нічого не перевизначає). Еквіваленти env vars:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Я встановив COPILOT_GITHUB_TOKEN, але models status показує "Shell env: off." Чому?'>
    `openclaw models status` показує, чи ввімкнено **імпорт env із shell**. "Shell env: off"
    **не** означає, що ваших env vars немає — це лише означає, що OpenClaw не завантажуватиме
    вашу login shell автоматично.

    Якщо Gateway працює як сервіс (launchd/systemd), він не успадковує середовище
    вашої shell. Виправте це одним із таких способів:

    1. Помістіть токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або ввімкніть імпорт shell (`env.shellEnv.enabled: true`).
    3. Або додайте його в блок `env` у конфігурації (застосовується лише якщо відсутній).

    Потім перезапустіть gateway і перевірте знову:

    ```bash
    openclaw models status
    ```

    Токени Copilot читаються з `COPILOT_GITHUB_TOKEN` (також `GH_TOKEN` / `GITHUB_TOKEN`).
    Дивіться [/concepts/model-providers](/uk/concepts/model-providers) і [/environment](/uk/help/environment).

  </Accordion>
</AccordionGroup>

## Сесії та кілька чатів

<AccordionGroup>
  <Accordion title="Як почати нову розмову?">
    Надішліть `/new` або `/reset` як окреме повідомлення. Дивіться [Керування сесіями](/uk/concepts/session).
  </Accordion>

  <Accordion title="Чи скидаються сесії автоматично, якщо я ніколи не надсилаю /new?">
    Термін дії сесій може завершуватися після `session.idleMinutes`, але це **вимкнено за замовчуванням** (типове значення **0**).
    Установіть додатне значення, щоб увімкнути завершення через неактивність. Коли це ввімкнено, **наступне**
    повідомлення після періоду неактивності запускає новий session id для цього ключа чату.
    Це не видаляє transcript-и — лише починає нову сесію.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб створити команду інстансів OpenClaw (один CEO і багато агентів)?">
    Так, через **маршрутизацію multi-agent** і **sub-agents**. Ви можете створити одного координуючого
    агента і кількох робочих агентів зі своїми workspace та моделями.

    Втім, найкраще сприймати це як **цікавий експеримент**. Це потребує багато токенів і часто
    менш ефективно, ніж використання одного бота з окремими сесіями. Типова модель, яку
    ми уявляємо, — це один бот, з яким ви спілкуєтеся, з різними сесіями для паралельної роботи. Цей
    бот також може за потреби запускати sub-agents.

    Документація: [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [CLI Agents](/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст було обрізано посеред завдання? Як цього уникнути?">
    Контекст сесії обмежений вікном моделі. Довгі чати, великі виводи інструментів або багато
    файлів можуть викликати Compaction або обрізання.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими завданнями, а `/new` — коли змінюєте тему.
    - Зберігайте важливий контекст у workspace і просіть бота зчитати його назад.
    - Використовуйте sub-agents для довгої або паралельної роботи, щоб основний чат залишався меншим.
    - Виберіть модель з більшим вікном контексту, якщо це трапляється часто.

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

    Потім повторно запустіть налаштування:

    ```bash
    openclaw onboard --install-daemon
    ```

    Примітки:

    - Онбординг також пропонує **Reset**, якщо бачить наявну конфігурацію. Дивіться [Онбординг (CLI)](/uk/start/wizard).
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скиньте кожен state dir (типові значення — `~/.openclaw-<profile>`).
    - Скидання dev: `openclaw gateway --dev --reset` (лише для dev; очищає конфігурацію dev + облікові дані + сесії + workspace).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або стиснути?'>
    Використовуйте один із цих варіантів:

    - **Compaction** (зберігає розмову, але підсумовує старіші ходи):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб спрямувати підсумок.

    - **Скидання** (новий ID сесії для того самого ключа чату):

      ```
      /new
      /reset
      ```

    Якщо це продовжує траплятися:

    - Увімкніть або налаштуйте **обрізання сесії** (`agents.defaults.contextPruning`), щоб обрізати старий вивід інструментів.
    - Використовуйте модель з більшим вікном контексту.

    Документація: [Compaction](/uk/concepts/compaction), [Обрізання сесії](/uk/concepts/session-pruning), [Керування сесіями](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка валідації провайдера: модель видала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що історія сесії застаріла або пошкоджена (часто після довгих thread
    або зміни tool/schema).

    Виправлення: почніть нову сесію через `/new` (окремим повідомленням).

  </Accordion>

  <Accordion title="Чому я отримую heartbeat-повідомлення кожні 30 хвилин?">
    Heartbeat запускається кожні **30m** за замовчуванням (**1h** при використанні OAuth-автентифікації). Налаштуйте або вимкніть його:

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

    Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки й markdown-заголовки
    на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб зекономити виклики API.
    Якщо файл відсутній, heartbeat усе одно запускається, і модель вирішує, що робити.

    Override-налаштування для окремого агента використовують `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "акаунт бота" до групи WhatsApp?'>
    Ні. OpenClaw працює від **вашого власного акаунта**, тож якщо ви є в групі, OpenClaw може її бачити.
    За замовчуванням відповіді в групах заблоковані, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

    Якщо ви хочете, щоб **лише ви** могли викликати відповіді в групі:

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
    Варіант 1 (найшвидший): переглядайте журнали і надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Шукайте `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/додано в allowlist): перелічіть групи з конфігурації:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/cli/directory), [Журнали](/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Дві поширені причини:

    - Увімкнено обмеження на згадки (типово). Ви маєте @згадати бота (або відповідати `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і цю групу не додано в allowlist.

    Дивіться [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи спільний контекст у груп/threads і DM?">
    Прямі чати за замовчуванням згортаються до основної сесії. Групи/канали мають власні ключі сесій, а теми Telegram / threads Discord — це окремі сесії. Дивіться [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки workspace і агентів я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але стежте за таким:

    - **Зростання диска:** сесії + transcript-и зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартість токенів:** більше агентів означає більше одночасного використання моделі.
    - **Операційні накладні витрати:** профілі автентифікації на рівні агента, workspace і маршрутизація каналів.

    Поради:

    - Тримайте один **активний** workspace на агента (`agents.defaults.workspace`).
    - Обрізайте старі сесії (видаляйте JSONL або записи сховища), якщо диск розростається.
    - Використовуйте `openclaw doctor`, щоб виявляти сторонні workspace і невідповідності профілів.

  </Accordion>

  <Accordion title="Чи можу я запускати кількох ботів або чатів одночасно (Slack), і як це краще налаштувати?">
    Так. Використовуйте **Маршрутизацію Multi-Agent**, щоб запускати кількох ізольованих агентів і маршрутизувати вхідні повідомлення за
    каналом/акаунтом/peer. Slack підтримується як канал і може бути прив’язаний до конкретних агентів.

    Доступ до браузера потужний, але це не «можна все, що може людина» — anti-bot, CAPTCHA і MFA
    все ще можуть блокувати автоматизацію. Для найнадійнішого керування браузером використовуйте локальний Chrome MCP на хості,
    або використовуйте CDP на машині, яка фактично запускає браузер.

    Найкраща практика налаштування:

    - Завжди увімкнений хост Gateway (VPS/Mac mini).
    - Один агент на роль (bindings).
    - Канал(и) Slack, прив’язані до цих агентів.
    - Локальний браузер через Chrome MCP або node за потреби.

    Документація: [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Browser](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі: типові значення, вибір, псевдоніми, перемикання

<AccordionGroup>
  <Accordion title='Що таке "модель за замовчуванням"?'>
    Модель за замовчуванням в OpenClaw — це те, що ви встановлюєте як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються у форматі `provider/model` (приклад: `openai/gpt-5.4`). Якщо ви пропускаєте провайдера, OpenClaw спочатку намагається знайти псевдонім, потім — унікальний збіг налаштованого провайдера для точного id цієї моделі, і лише після цього переходить до налаштованого провайдера за замовчуванням як до застарілого шляху сумісності. Якщо цей провайдер більше не надає налаштовану модель за замовчуванням, OpenClaw переходить до першого налаштованого провайдера/моделі замість того, щоб показувати застаріле значення за замовчуванням для видаленого провайдера. Але вам усе одно слід **явно** вказувати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендована модель за замовчуванням:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    **Для агентів з увімкненими інструментами або ненадійним входом:** ставте силу моделі вище за вартість.
    **Для звичайного/низькоризикового чату:** використовуйте дешевші резервні моделі й маршрутизуйте за роллю агента.

    Для MiniMax є окрема документація: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Практичне правило: використовуйте **найкращу модель, яку можете собі дозволити** для важливої роботи, і дешевшу
    модель для звичайного чату або підсумків. Ви можете маршрутизувати моделі на рівні агента і використовувати sub-agents для
    паралелізації довгих завдань (кожен sub-agent споживає токени). Дивіться [Моделі](/uk/concepts/models) і
    [Sub-agents](/uk/tools/subagents).

    Серйозне попередження: слабші або надмірно квантизовані моделі більш вразливі до prompt
    injection і небезпечної поведінки. Дивіться [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як переключати моделі, не стираючи конфігурацію?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни конфігурації.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для окремої сесії)
    - `openclaw models set ...` (оновлює лише конфігурацію моделі)
    - `openclaw configure --section model` (інтерактивно)
    - відредагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` з частковим об’єктом, якщо ви не маєте наміру замінити всю конфігурацію.
    Для RPC-редагувань спочатку перевірте через `config.schema.lookup` і надавайте перевагу `config.patch`. Payload lookup дає вам нормалізований шлях, неглибоку документацію/обмеження схеми та підсумки безпосередніх дочірніх елементів.
    для часткових оновлень.
    Якщо ви все ж перезаписали конфігурацію, відновіть її з резервної копії або повторно виконайте `openclaw doctor` для виправлення.

    Документація: [Моделі](/uk/concepts/models), [Налаштування](/cli/configure), [Конфігурація](/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати self-hosted моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Установіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо ви хочете також хмарні моделі, виконайте `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає вам хмарні моделі плюс ваші локальні моделі Ollama
    - хмарні моделі, такі як `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі більш вразливі до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все ж хочете малі моделі, увімкніть ізоляцію та суворі allowlist-и інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Провайдери моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Ізоляція](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - У цих розгортаннях усе може відрізнятися й змінюватися з часом; фіксованої рекомендації щодо провайдера немає.
    - Перевіряйте поточне налаштування під час виконання на кожному gateway через `openclaw models status`.
    - Для агентів, чутливих до безпеки/з інструментами, використовуйте найсильнішу доступну модель останнього покоління.
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

    Ви можете переглянути доступні моделі через `/model`, `/model list` або `/model status`.

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

    **Як зняти прив’язку профілю, який я встановив через @profile?**

    Повторно виконайте `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо ви хочете повернутися до типового значення, виберіть його через `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль автентифікації активний.

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.2 для щоденних завдань, а Codex 5.3 — для кодування?">
    Так. Установіть одну як типову і перемикайте за потреби:

    - **Швидке перемикання (для сесії):** `/model gpt-5.4` для щоденних завдань, `/model openai-codex/gpt-5.4` для кодування з Codex OAuth.
    - **Типове значення + перемикання:** установіть `agents.defaults.model.primary` в `openai/gpt-5.4`, а потім перемикайтеся на `openai-codex/gpt-5.4` під час кодування (або навпаки).
    - **Sub-agents:** маршрутизуйте завдання кодування до sub-agents з іншою моделлю за замовчуванням.

    Дивіться [Моделі](/uk/concepts/models) і [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати fast mode для GPT 5.4?">
    Використовуйте або перемикач сесії, або типове значення в конфігурації:

    - **Для сесії:** надішліть `/fast on`, коли сесія використовує `openai/gpt-5.4` або `openai-codex/gpt-5.4`.
    - **Типове значення для моделі:** установіть `agents.defaults.models["openai/gpt-5.4"].params.fastMode` у `true`.
    - **Також для Codex OAuth:** якщо ви також використовуєте `openai-codex/gpt-5.4`, установіть той самий прапорець і там.

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

    Для OpenAI fast mode відображається на `service_tier = "priority"` у підтримуваних нативних запитах Responses. Перевизначення сесії через `/fast` мають пріоритет над типовими значеннями конфігурації.

    Дивіться [Thinking and fast mode](/uk/tools/thinking) і [OpenAI fast mode](/uk/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо задано `agents.defaults.models`, це стає **allowlist-ом** для `/model` і будь-яких
    перевизначень сесії. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, приберіть allowlist або виберіть модель з `/model list`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **провайдера не налаштовано** (не знайдено конфігурації провайдера MiniMax або
    профілю автентифікації), тому модель не може бути розв’язана.

    Контрольний список для виправлення:

    1. Оновіться до актуального релізу OpenClaw (або запускайте з вихідного коду `main`), а потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (через майстер або JSON), або що автентифікація MiniMax
       існує в env/auth profiles, щоб відповідний провайдер можна було під’єднати
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений MiniMax
       OAuth для `minimax-portal`).
    3. Використовуйте точний id моделі (з урахуванням регістру) для вашого шляху автентифікації:
       `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed` для налаштування
       з API ключем, або `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` для налаштування через OAuth.
    4. Виконайте:

       ```bash
       openclaw models list
       ```

       і виберіть зі списку (або `/model list` у чаті).

    Дивіться [MiniMax](/uk/providers/minimax) і [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати MiniMax як типову модель, а OpenAI — для складних завдань?">
    Так. Використовуйте **MiniMax як типову модель** і перемикайте моделі **для окремої сесії**, коли потрібно.
    Резервні варіанти призначені для **помилок**, а не для «важких завдань», тому використовуйте `/model` або окремого агента.

    **Варіант A: перемикання для сесії**

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

    **Варіант B: окремі агенти**

    - Типова модель агента A: MiniMax
    - Типова модель агента B: OpenAI
    - Маршрутизуйте за агентом або використовуйте `/agent` для перемикання

    Документація: [Моделі](/uk/concepts/models), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома типовими скороченнями (вони застосовуються лише тоді, коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви задаєте власний псевдонім з тією самою назвою, перемагає ваше значення.

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

    Якщо ви посилаєтеся на `provider/model`, але бракує потрібного ключа провайдера, ви отримаєте помилку автентифікації під час виконання (наприклад, `No API key found for provider "zai"`).

    **Після додавання нового агента не знайдено API key для provider**

    Зазвичай це означає, що **новий агент** має порожнє сховище автентифікації. Автентифікація прив’язана до агента і
    зберігається в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Виконайте `openclaw agents add <id>` і налаштуйте автентифікацію через майстер.
    - Або скопіюйте `auth-profiles.json` з `agentDir` основного агента в `agentDir` нового агента.

    **Не** використовуйте один і той самий `agentDir` для різних агентів; це спричиняє конфлікти автентифікації/сесій.

  </Accordion>
</AccordionGroup>

## Резервне перемикання моделей і «Усі моделі завершилися помилкою»

<AccordionGroup>
  <Accordion title="Як працює резервне перемикання?">
    Резервне перемикання відбувається у два етапи:

    1. **Ротація auth profile** у межах одного провайдера.
    2. **Резервна модель** до наступної моделі в `agents.defaults.model.fallbacks`.

    До профілів, що дають помилки, застосовуються cooldown-и (експоненційний backoff), тому OpenClaw може продовжувати відповідати навіть тоді, коли провайдер обмежений rate limit або тимчасово недоступний.

    Кошик rate limit включає не лише звичайні відповіді `429`. OpenClaw
    також розглядає повідомлення на кшталт `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    ліміти вікна використання (`weekly/monthly limit reached`) як підставу
    для резервного перемикання через rate limit.

    Деякі відповіді, схожі на проблеми з білінгом, не мають коду `402`, і деякі відповіді HTTP `402`
    також лишаються в цьому тимчасовому кошику. Якщо провайдер повертає
    явний текст про білінг на `401` або `403`, OpenClaw все одно може залишити це
    у смузі білінгу, але provider-specific текстові зіставлення лишаються обмеженими
    тим провайдером, якому вони належать (наприклад OpenRouter `Key limit exceeded`). Якщо ж повідомлення `402`
    схоже на вікно використання, яке можна повторити,
    або ліміт витрат organization/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw розглядає це як
    `rate_limit`, а не як довге блокування через білінг.

    Помилки переповнення контексту відрізняються: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` лишаються на шляху Compaction/retry замість переходу до
    резервної моделі.

    Загальний текст помилок сервера навмисно вужчий, ніж «усе, де є
    unknown/error». OpenClaw дійсно розглядає provider-scoped перехідні форми,
    такі як просте Anthropic `An unknown error occurred`, просте OpenRouter
    `Provider returned error`, помилки stop-reason на кшталт `Unhandled stop reason:
    error`, JSON payload-и `api_error` з перехідним серверним текстом
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості провайдера, такі як `ModelNotReadyException`, як
    сигнали timeout/перевантаження, що варті резервного перемикання, коли контекст провайдера
    збігається.
    Загальний внутрішній запасний текст на кшталт `LLM request failed with an unknown
    error.` лишається консервативним і сам по собі не запускає резервне перемикання моделі.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система намагалася використати id auth profile `anthropic:default`, але не змогла знайти для нього облікові дані в очікуваному сховищі автентифікації.

    **Контрольний список для виправлення:**

    - **Переконайтеся, де зберігаються auth profiles** (нові проти застарілих шляхів)
      - Поточний шлях: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий шлях: `~/.openclaw/agent/*` (мігрується командою `openclaw doctor`)
    - **Переконайтеся, що вашу env var завантажено Gateway**
      - Якщо ви встановили `ANTHROPIC_API_KEY` у своїй shell, але запускаєте Gateway через systemd/launchd, він може не успадковувати його. Помістіть його в `~/.openclaw/.env` або ввімкніть `env.shellEnv`.
    - **Переконайтеся, що редагуєте правильного агента**
      - У multi-agent-конфігураціях може бути кілька файлів `auth-profiles.json`.
    - **Швидка перевірка стану model/auth**
      - Використовуйте `openclaw models status`, щоб побачити налаштовані моделі й те, чи автентифіковано провайдерів.

    **Контрольний список для виправлення "No credentials found for profile anthropic"**

    Це означає, що запуск прив’язаний до auth profile Anthropic, але Gateway
    не може знайти його у своєму сховищі автентифікації.

    - **Використовуйте Claude CLI**
      - Виконайте `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо ви хочете використовувати API key натомість**
      - Помістіть `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистіть будь-який закріплений порядок, який примусово вимагає відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Переконайтеся, що ви запускаєте команди на хості gateway**
      - У віддаленому режимі auth profiles живуть на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому він також спробував Google Gemini і завершився помилкою?">
    Якщо ваша конфігурація моделі включає Google Gemini як резервний варіант (або ви переключилися на скорочення Gemini), OpenClaw спробує його під час резервного перемикання моделей. Якщо ви не налаштували облікові дані Google, побачите `No API key found for provider "google"`.

    Виправлення: або надайте автентифікацію Google, або видаліть/уникайте моделей Google у `agents.defaults.model.fallbacks` / псевдонімах, щоб резервне перемикання не маршрутизувало туди.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Причина: історія сесії містить **блоки thinking без підписів** (часто через
    перерваний/частковий потік). Google Antigravity вимагає підписів для блоків thinking.

    Виправлення: тепер OpenClaw видаляє непідписані блоки thinking для Google Antigravity Claude. Якщо це все ще трапляється, почніть **нову сесію** або встановіть `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Auth profiles: що це таке і як ними керувати

Пов’язане: [/concepts/oauth](/uk/concepts/oauth) (OAuth-потоки, зберігання токенів, шаблони з кількома акаунтами)

<AccordionGroup>
  <Accordion title="Що таке auth profile?">
    Auth profile — це іменований запис облікових даних (OAuth або API key), прив’язаний до провайдера. Профілі зберігаються в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Які типові id профілів?">
    OpenClaw використовує id з префіксом провайдера, наприклад:

    - `anthropic:default` (типово, коли немає email identity)
    - `anthropic:<email>` для OAuth-ідентичностей
    - власні id, які ви вибираєте (наприклад `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який auth profile пробується першим?">
    Так. Конфігурація підтримує необов’язкові metadata для профілів і порядок для кожного провайдера (`auth.order.<provider>`). Це **не** зберігає секрети; це зіставляє id з provider/mode і задає порядок ротації.

    OpenClaw може тимчасово пропускати профіль, якщо він перебуває в короткому **cooldown** (rate limits/timeouts/auth failures) або в довшому стані **disabled** (billing/insufficient credits). Щоб перевірити це, виконайте `openclaw models status --json` і перегляньте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Cooldown-и через rate limit можуть бути scoped до моделі. Профіль, який перебуває в cooldown
    для однієї моделі, все ще може бути придатним для сусідньої моделі того самого провайдера,
    тоді як вікна billing/disabled усе ще блокують увесь профіль.

    Ви також можете встановити **перевизначення порядку для окремого агента** (зберігається в `auth-state.json` цього агента) через CLI:

    ```bash
    # За замовчуванням використовується типовий агент із конфігурації (пропустіть --agent)
    openclaw models auth order get --provider anthropic

    # Зафіксувати ротацію на одному профілі (пробувати лише цей)
    openclaw models auth order set --provider anthropic anthropic:default

    # Або встановити явний порядок (резервне перемикання в межах провайдера)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Очистити перевизначення (повернутися до config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Щоб націлитися на конкретного агента:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Щоб перевірити, що реально буде спробовано, використовуйте:

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

## Gateway: порти, «already running» і віддалений режим

<AccordionGroup>
  <Accordion title="Який порт використовує Gateway?">
    `gateway.port` керує єдиним мультиплексованим портом для WebSocket + HTTP (Control UI, hooks тощо).

    Пріоритет:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Чому `openclaw gateway status` показує "Runtime: running", але "Connectivity probe: failed"?'>
    Тому що "running" — це погляд **supervisor** (launchd/systemd/schtasks). А connectivity probe — це реальне підключення CLI до WebSocket gateway.

    Використовуйте `openclaw gateway status` і довіряйте цим рядкам:

    - `Probe target:` (URL, який probe фактично використав)
    - `Listening:` (що реально прив’язано до порту)
    - `Last gateway error:` (типова першопричина, коли процес живий, але порт не слухає)

  </Accordion>

  <Accordion title='Чому `openclaw gateway status` показує різні "Config (cli)" і "Config (service)"?'>
    Ви редагуєте один файл конфігурації, а сервіс запускає інший (часто це невідповідність `--profile` / `OPENCLAW_STATE_DIR`).

    Виправлення:

    ```bash
    openclaw gateway install --force
    ```

    Запускайте це з того самого `--profile` / середовища, яке ви хочете використовувати для сервісу.

  </Accordion>

  <Accordion title='Що означає "another gateway instance is already listening"?'>
    OpenClaw примусово забезпечує runtime lock, одразу прив’язуючи listener WebSocket під час запуску (типово `ws://127.0.0.1:18789`). Якщо bind завершується помилкою `EADDRINUSE`, викидається `GatewayLockError`, що означає: інший інстанс уже слухає.

    Виправлення: зупиніть інший інстанс, звільніть порт або запускайте з `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Як запустити OpenClaw у віддаленому режимі (клієнт підключається до Gateway деінде)?">
    Установіть `gateway.mode: "remote"` і вкажіть віддалену URL-адресу WebSocket, за потреби з shared-secret віддаленими обліковими даними:

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

    - `openclaw gateway` запускається лише тоді, коли `gateway.mode` має значення `local` (або якщо ви передали прапорець перевизначення).
    - Застосунок macOS стежить за файлом конфігурації і динамічно перемикає режими, коли ці значення змінюються.
    - `gateway.remote.token` / `.password` — це лише клієнтські віддалені облікові дані; самі по собі вони не вмикають локальну автентифікацію gateway.

  </Accordion>

  <Accordion title='Control UI каже "unauthorized" (або постійно перепідключається). Що тепер?'>
    Шлях автентифікації вашого gateway і метод автентифікації UI не збігаються.

    Факти (з коду):

    - Control UI зберігає токен у `sessionStorage` для поточної сесії вкладки браузера та вибраної URL-адреси gateway, тож оновлення в тій самій вкладці продовжують працювати без відновлення довготривалого збереження токена в localStorage.
    - За `AUTH_TOKEN_MISMATCH` довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном пристрою, коли gateway повертає підказки для повтору (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ця повторна спроба з кешованим токеном тепер повторно використовує кешовані погоджені scopes, збережені разом із токеном пристрою. Явні виклики `deviceToken` / явні `scopes` як і раніше зберігають свій запитаний набір scopes замість успадкування кешованих.
    - Поза цим шляхом повтору пріоритет автентифікації connect такий: спочатку явний shared token/password, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap token.
    - Перевірки scope для bootstrap token мають префікси ролей. Вбудований allowlist bootstrap-оператора задовольняє лише запити оператора; для node або інших ролей, що не є оператором, усе одно потрібні scopes під префіксом їхньої ролі.

    Виправлення:

    - Найшвидше: `openclaw dashboard` (виводить + копіює URL-адресу dashboard, намагається відкрити; у headless-режимі показує підказку про SSH).
    - Якщо у вас ще немає токена: `openclaw doctor --generate-gateway-token`.
    - Якщо віддалено, спочатку підніміть тунель: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`.
    - Режим shared-secret: установіть `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, а потім вставте відповідний секрет у налаштуваннях Control UI.
    - Режим Tailscale Serve: переконайтеся, що `gateway.auth.allowTailscale` увімкнено і ви відкриваєте URL Serve, а не сиру URL loopback/tailnet, яка обходить заголовки ідентичності Tailscale.
    - Режим trusted-proxy: переконайтеся, що ви заходите через налаштований identity-aware proxy не на loopback, а не через loopback proxy того самого хоста чи пряму URL-адресу gateway.
    - Якщо невідповідність зберігається після однієї повторної спроби, перевипустіть/повторно погодьте paired device token:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Якщо цей виклик rotate каже, що його відхилено, перевірте дві речі:
      - paired-device sessions можуть перевипускати лише **власний** пристрій, якщо тільки вони також не мають `operator.admin`
      - явні значення `--scope` не можуть перевищувати поточні operator scopes викликувача
    - Усе ще не вдається? Виконайте `openclaw status --all` і дотримуйтеся [Усунення несправностей](/uk/gateway/troubleshooting). Подробиці автентифікації дивіться в [Dashboard](/web/dashboard).

  </Accordion>

  <Accordion title="Я встановив gateway.bind tailnet, але він не може прив’язатися і нічого не слухає">
    Bind `tailnet` вибирає Tailscale IP з ваших мережевих інтерфейсів (100.64.0.0/10). Якщо машина не в Tailscale (або інтерфейс вимкнено), прив’язуватися нема до чого.

    Виправлення:

    - Запустіть Tailscale на цьому хості (щоб він мав адресу 100.x), або
    - Перемкніться на `gateway.bind: "loopback"` / `"lan"`.

    Примітка: `tailnet` — це явний режим. `auto` віддає перевагу loopback; використовуйте `gateway.bind: "tailnet"`, коли хочете bind лише для tailnet.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька Gateway на одному хості?">
    Зазвичай ні — один Gateway може запускати кілька каналів повідомлень і агентів. Використовуйте кілька Gateway лише тоді, коли вам потрібна надлишковість (наприклад rescue bot) або жорстка ізоляція.

    Так, але потрібно ізолювати:

    - `OPENCLAW_CONFIG_PATH` (окрема конфігурація для кожного інстансу)
    - `OPENCLAW_STATE_DIR` (окремий стан для кожного інстансу)
    - `agents.defaults.workspace` (ізоляція workspace)
    - `gateway.port` (унікальні порти)

    Швидке налаштування (рекомендовано):

    - Використовуйте `openclaw --profile <name> ...` для кожного інстансу (автоматично створює `~/.openclaw-<name>`).
    - Установіть унікальний `gateway.port` у конфігурації кожного профілю (або передавайте `--port` для ручних запусків).
    - Установіть сервіс для кожного профілю: `openclaw --profile <name> gateway install`.

    Профілі також додають суфікси до назв сервісів (`ai.openclaw.<profile>`; застарілі `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Повний посібник: [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Що означає "invalid handshake" / code 1008?'>
    Gateway — це **сервер WebSocket**, і він очікує, що найпершим повідомленням
    буде фрейм `connect`. Якщо отримує щось інше, він закриває з’єднання
    з **code 1008** (порушення політики).

    Поширені причини:

    - Ви відкрили URL **HTTP** у браузері (`http://...`) замість клієнта WS.
    - Ви використали неправильний порт або шлях.
    - Proxy або тунель зрізав заголовки автентифікації або надіслав не-Gateway-запит.

    Швидкі виправлення:

    1. Використовуйте URL WS: `ws://<host>:18789` (або `wss://...`, якщо HTTPS).
    2. Не відкривайте порт WS у звичайній вкладці браузера.
    3. Якщо автентифікацію ввімкнено, включіть токен/пароль у фрейм `connect`.

    Якщо ви використовуєте CLI або TUI, URL має виглядати так:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Подробиці протоколу: [Протокол Gateway](/uk/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Журналювання та налагодження

<AccordionGroup>
  <Accordion title="Де журнали?">
    Файлові журнали (структуровані):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Ви можете встановити стабільний шлях через `logging.file`. Рівень файлових журналів керується `logging.level`. Докладність консолі керується `--verbose` і `logging.consoleLevel`.

    Найшвидший перегляд хвоста журналу:

    ```bash
    openclaw logs --follow
    ```

    Журнали сервісу/supervisor (коли gateway працює через launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` і `gateway.err.log` (типово: `~/.openclaw/logs/...`; профілі використовують `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Докладніше дивіться в [Усуненні несправностей](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Як запустити/зупинити/перезапустити сервіс Gateway?">
    Використовуйте допоміжні команди gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви запускаєте gateway вручну, `openclaw gateway --force` може перехопити порт. Дивіться [Gateway](/uk/gateway).

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

    Якщо ви ніколи не встановлювали сервіс, запустіть його у foreground:

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

    Документація: [Windows (WSL2)](/uk/platforms/windows), [Runbook сервісу Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Gateway працює, але відповіді ніколи не приходять. Що перевірити?">
    Почніть із швидкої перевірки стану:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Поширені причини:

    - Автентифікацію моделі не завантажено на **хості gateway** (перевірте `models status`).
    - Парування/allowlist каналу блокує відповіді (перевірте конфігурацію каналу + журнали).
    - WebChat/Dashboard відкрито без правильного токена.

    Якщо ви працюєте віддалено, переконайтеся, що тунель/з’єднання Tailscale активне і що
    WebSocket Gateway доступний.

    Документація: [Канали](/uk/channels), [Усунення несправностей](/uk/gateway/troubleshooting), [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — що тепер?'>
    Зазвичай це означає, що UI втратив з’єднання WebSocket. Перевірте:

    1. Чи працює Gateway? `openclaw gateway status`
    2. Чи в порядку Gateway? `openclaw status`
    3. Чи має UI правильний токен? `openclaw dashboard`
    4. Якщо віддалено, чи активне з’єднання тунелю/Tailscale?

    Потім перегляньте журнали:

    ```bash
    openclaw logs --follow
    ```

    Документація: [Dashboard](/web/dashboard), [Віддалений доступ](/uk/gateway/remote), [Усунення несправностей](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands завершується помилкою. Що перевірити?">
    Почніть із журналів і стану каналу:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Потім зіставте помилку:

    - `BOT_COMMANDS_TOO_MUCH`: у меню Telegram забагато записів. OpenClaw уже обрізає список до ліміту Telegram і повторює спробу з меншою кількістю команд, але деякі записи меню все одно потрібно прибрати. Зменште кількість команд plugin/skill/custom або вимкніть `channels.telegram.commands.native`, якщо меню вам не потрібне.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` або подібні мережеві помилки: якщо ви на VPS або за proxy, переконайтеся, що вихідний HTTPS дозволений і DNS працює для `api.telegram.org`.

    Якщо Gateway віддалений, переконайтеся, що дивитеся журнали на хості Gateway.

    Документація: [Telegram](/uk/channels/telegram), [Усунення несправностей каналів](/uk/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI не показує виводу. Що перевірити?">
    Спочатку переконайтеся, що Gateway доступний і агент може працювати:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    У TUI використовуйте `/status`, щоб побачити поточний стан. Якщо ви очікуєте відповіді в чат-каналі,
    переконайтеся, що доставку ввімкнено (`/deliver on`).

    Документація: [TUI](/web/tui), [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як повністю зупинити, а потім запустити Gateway?">
    Якщо ви встановили сервіс:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Це зупиняє/запускає **керований сервіс** (launchd у macOS, systemd у Linux).
    Використовуйте це, коли Gateway працює у фоновому режимі як демон.

    Якщо ви запускаєте його у foreground, зупиніть через Ctrl-C, а потім:

    ```bash
    openclaw gateway run
    ```

    Документація: [Runbook сервісу Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Поясніть просто: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: перезапускає **фоновий сервіс** (launchd/systemd).
    - `openclaw gateway`: запускає gateway **у foreground** для цієї сесії термінала.

    Якщо ви встановили сервіс, використовуйте команди gateway. Використовуйте `openclaw gateway`, коли
    вам потрібен одноразовий запуск у foreground.

  </Accordion>

  <Accordion title="Найшвидший спосіб отримати більше деталей, коли щось ламається">
    Запустіть Gateway з `--verbose`, щоб отримати більше деталей у консолі. Потім перевірте файл журналу на помилки автентифікації каналу, маршрутизації моделі та RPC.
  </Accordion>
</AccordionGroup>

## Медіа та вкладення

<AccordionGroup>
  <Accordion title="Мій skill згенерував зображення/PDF, але нічого не було надіслано">
    Вихідні вкладення від агента мають містити рядок `MEDIA:<path-or-url>` (в окремому рядку). Дивіться [Налаштування помічника OpenClaw](/uk/start/openclaw) і [Надсилання агентом](/uk/tools/agent-send).

    Надсилання через CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Також перевірте:

    - Цільовий канал підтримує вихідні медіа і не блокується allowlist-ами.
    - Файл не перевищує ліміти розміру провайдера (зображення змінюють розмір до максимуму 2048px).
    - `tools.fs.workspaceOnly=true` обмежує надсилання локальних шляхів workspace, temp/media-store і файлами, перевіреними ізоляцією.
    - `tools.fs.workspaceOnly=false` дозволяє `MEDIA:` надсилати локальні файли хоста, які агент уже може читати, але лише для медіа та безпечних типів документів (зображення, аудіо, відео, PDF і Office-документи). Звичайний текст і файли, схожі на секрети, все одно блокуються.

    Дивіться [Зображення](/uk/nodes/images).

  </Accordion>
</AccordionGroup>

## Безпека та контроль доступу

<AccordionGroup>
  <Accordion title="Чи безпечно відкривати OpenClaw для вхідних DM?">
    Розглядайте вхідні DM як ненадійний вхід. Значення за замовчуванням створені для зменшення ризику:

    - Типова поведінка на каналах із підтримкою DM — **pairing**:
      - Невідомі відправники отримують pairing code; бот не обробляє їхнє повідомлення.
      - Погодження через: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Кількість очікуваних запитів обмежена **3 на канал**; перевіряйте `openclaw pairing list --channel <channel> [--account <id>]`, якщо код не надійшов.
    - Публічне відкриття DM вимагає явного opt-in (`dmPolicy: "open"` і allowlist `"*"`).

    Запустіть `openclaw doctor`, щоб виявити ризиковані політики DM.

  </Accordion>

  <Accordion title="Чи prompt injection — це проблема лише для публічних ботів?">
    Ні. Prompt injection стосується **ненадійного вмісту**, а не лише того, хто може писати боту в DM.
    Якщо ваш помічник читає зовнішній вміст (web search/fetch, сторінки браузера, email,
    документи, вкладення, вставлені журнали), цей вміст може містити інструкції, які намагаються
    перехопити керування моделлю. Це може статися, навіть якщо **єдиний відправник — ви**.

    Найбільший ризик виникає, коли ввімкнені інструменти: модель можна обдурити і змусити
    ексфільтрувати контекст або викликати інструменти від вашого імені. Зменшуйте зону ураження так:

    - використовуйте агента «reader» лише для читання або без інструментів, щоб підсумовувати ненадійний вміст
    - тримайте `web_search` / `web_fetch` / `browser` вимкненими для агентів з увімкненими інструментами
    - також розглядайте декодований текст файлів/документів як ненадійний: OpenResponses
      `input_file` і витягування тексту з медіавкладень обгортають витягнутий текст
      явними маркерами меж зовнішнього вмісту замість передачі сирого тексту файлу
    - використовуйте ізоляцію та суворі allowlist-и інструментів

    Подробиці: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи має у мого бота бути власний email, акаунт GitHub або номер телефону?">
    Так, для більшості сценаріїв. Ізоляція бота окремими акаунтами й номерами телефонів
    зменшує зону ураження, якщо щось піде не так. Це також спрощує ротацію
    облікових даних або відкликання доступу без впливу на ваші особисті акаунти.

    Починайте з малого. Давайте доступ лише до тих інструментів і акаунтів, які вам справді потрібні, і розширюйте
    пізніше, якщо буде потрібно.

    Документація: [Безпека](/uk/gateway/security), [Pairing](/uk/channels/pairing).

  </Accordion>

  <Accordion title="Чи можу я дати йому автономію над моїми текстовими повідомленнями, і чи це безпечно?">
    Ми **не** рекомендуємо повну автономію над вашими особистими повідомленнями. Найбезпечніший шаблон:

    - Тримайте DM у режимі **pairing** або з жорстким allowlist.
    - Використовуйте **окремий номер або акаунт**, якщо хочете, щоб він писав від вашого імені.
    - Нехай він створює чернетки, а ви **погоджуйте перед надсиланням**.

    Якщо хочете поекспериментувати, робіть це на окремому акаунті й тримайте його ізольованим. Дивіться
    [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи можу я використовувати дешевші моделі для завдань персонального помічника?">
    Так, **якщо** агент призначений лише для чату, а вхідні дані довірені. Менші рівні
    більш схильні до перехоплення інструкціями, тому уникайте їх для агентів з увімкненими інструментами
    або під час читання ненадійного вмісту. Якщо вам усе ж потрібна менша модель, жорстко обмежте
    інструменти й запускайте все в ізоляції. Дивіться [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Я виконав /start у Telegram, але не отримав pairing code">
    Pairing codes надсилаються **лише** коли невідомий відправник пише боту і
    `dmPolicy: "pairing"` увімкнено. Сам по собі `/start` не генерує код.

    Перевірте очікувані запити:

    ```bash
    openclaw pairing list telegram
    ```

    Якщо вам потрібен негайний доступ, додайте свій sender id в allowlist або встановіть `dmPolicy: "open"`
    для цього акаунта.

  </Accordion>

  <Accordion title="WhatsApp: чи буде він писати моїм контактам? Як працює pairing?">
    Ні. Типова політика WhatsApp DM — **pairing**. Невідомі відправники отримують лише pairing code, а їхнє повідомлення **не обробляється**. OpenClaw відповідає лише на чати, які він отримує, або на явні надсилання, які ви запускаєте.

    Погодження pairing:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Перелік очікуваних запитів:

    ```bash
    openclaw pairing list whatsapp
    ```

    Запит номера телефону в майстрі: він використовується для налаштування вашого **allowlist/owner**, щоб ваші власні DM були дозволені. Він не використовується для автоматичного надсилання. Якщо ви запускаєте на своєму особистому номері WhatsApp, використовуйте цей номер і ввімкніть `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Команди чату, скасування завдань і «воно не зупиняється»

<AccordionGroup>
  <Accordion title="Як зупинити показ внутрішніх системних повідомлень у чаті?">
    Більшість внутрішніх або інструментальних повідомлень з’являються лише тоді, коли для цієї сесії ввімкнено **verbose**, **trace** або **reasoning**.

    Виправлення в тому чаті, де ви це бачите:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Якщо все одно занадто шумно, перевірте налаштування сесії в Control UI і встановіть verbose
    на **inherit**. Також переконайтеся, що ви не використовуєте профіль бота з `verboseDefault`, установленим
    у `on` у конфігурації.

    Документація: [Thinking and verbose](/uk/tools/thinking), [Безпека](/uk/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Як зупинити/скасувати запущене завдання?">
    Надішліть будь-що з цього **як окреме повідомлення** (без слеша):

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

    Це тригери скасування (а не slash-команди).

    Для фонових процесів (з інструмента exec) ви можете попросити агента виконати:

    ```
    process action:kill sessionId:XXX
    ```

    Огляд slash-команд: дивіться [Slash-команди](/uk/tools/slash-commands).

    Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`, але кілька скорочень (наприклад `/status`) також працюють inline для відправників із allowlist.

  </Accordion>

  <Accordion title='Як надіслати повідомлення Discord з Telegram? ("Cross-context messaging denied")'>
    OpenClaw блокує повідомлення **між різними провайдерами** за замовчуванням. Якщо виклик інструмента прив’язаний
    до Telegram, він не надсилатиме в Discord, доки ви явно цього не дозволите.

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

  <Accordion title='Чому здається, ніби бот "ігнорує" повідомлення, надіслані одне за одним?'>
    Режим черги керує тим, як нові повідомлення взаємодіють із поточним запуском. Використовуйте `/queue`, щоб змінити режими:

    - `steer` - нові повідомлення перенаправляють поточне завдання
    - `followup` - повідомлення виконуються по одному
    - `collect` - збирає повідомлення пакетом і відповідає один раз (типово)
    - `steer-backlog` - спрямувати зараз, а потім обробити чергу
    - `interrupt` - перервати поточний запуск і почати заново

    Ви можете додавати параметри на кшталт `debounce:2s cap:25 drop:summarize` для режимів followup.

  </Accordion>
</AccordionGroup>

## Інше

<AccordionGroup>
  <Accordion title='Яка модель за замовчуванням для Anthropic з API key?'>
    В OpenClaw облікові дані та вибір моделі — це окремі речі. Установлення `ANTHROPIC_API_KEY` (або збереження API key Anthropic в auth profiles) вмикає автентифікацію, але фактична модель за замовчуванням — це те, що ви налаштували в `agents.defaults.model.primary` (наприклад, `anthropic/claude-sonnet-4-6` або `anthropic/claude-opus-4-6`). Якщо ви бачите `No credentials found for profile "anthropic:default"`, це означає, що Gateway не зміг знайти облікові дані Anthropic в очікуваному `auth-profiles.json` для агента, який зараз працює.
  </Accordion>
</AccordionGroup>

---

Усе ще застрягли? Запитайте в [Discord](https://discord.com/invite/clawd) або відкрийте [обговорення GitHub](https://github.com/openclaw/openclaw/discussions).
