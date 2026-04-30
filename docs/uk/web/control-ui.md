---
read_when:
    - Ви хочете керувати Gateway з браузера
    - Вам потрібен доступ до Tailnet без SSH-тунелів
sidebarTitle: Control UI
summary: Браузерний інтерфейс керування для Gateway (чат, вузли, конфігурація)
title: Інтерфейс керування
x-i18n:
    generated_at: "2026-04-30T00:05:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 982d25d48770b753faa4e57d9a284e9bff10c15cda21dd9c00848d2a6b912d41
    source_path: web/control-ui.md
    workflow: 16
---

Control UI — це невеликий односторінковий застосунок **Vite + Lit**, який обслуговує Gateway:

- типово: `http://<host>:18789/`
- необов’язковий префікс: задайте `gateway.controlUi.basePath` (наприклад, `/openclaw`)

Він працює **напряму з Gateway WebSocket** на тому самому порту.

## Швидке відкриття (локально)

Якщо Gateway запущено на тому самому комп’ютері, відкрийте:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (або [http://localhost:18789/](http://localhost:18789/))

Якщо сторінка не завантажується, спочатку запустіть Gateway: `openclaw gateway`.

Автентифікація передається під час WebSocket handshake через:

- `connect.params.auth.token`
- `connect.params.auth.password`
- заголовки ідентичності Tailscale Serve, коли `gateway.auth.allowTailscale: true`
- заголовки ідентичності trusted-proxy, коли `gateway.auth.mode: "trusted-proxy"`

Панель налаштувань dashboard зберігає токен для поточної сесії вкладки браузера та вибраної URL-адреси gateway; паролі не зберігаються. Onboarding зазвичай генерує gateway token для автентифікації зі спільним секретом під час першого підключення, але password auth також працює, коли `gateway.auth.mode` має значення `"password"`.

## Спарювання пристрою (перше підключення)

Коли ви підключаєтеся до Control UI з нового браузера або пристрою, Gateway зазвичай вимагає **одноразового схвалення спарювання**. Це захід безпеки для запобігання несанкціонованому доступу.

**Що ви побачите:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Список запитів в очікуванні">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Схвалення за ID запиту">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Якщо браузер повторює спарювання зі зміненими даними автентифікації (role/scopes/public key), попередній запит в очікуванні замінюється, і створюється новий `requestId`. Перед схваленням повторно запустіть `openclaw devices list`.

Якщо браузер уже спарено, і ви змінюєте його з доступу для читання на доступ для запису/admin, це обробляється як підвищення схвалення, а не як тихе повторне підключення. OpenClaw залишає старе схвалення активним, блокує ширше повторне підключення та просить вас явно схвалити новий набір scope.

Після схвалення пристрій запам’ятовується і не потребуватиме повторного схвалення, якщо ви не відкличете його за допомогою `openclaw devices revoke --device <id> --role <role>`. Див. [CLI пристроїв](/uk/cli/devices) щодо ротації та відкликання токенів.

<Note>
- Прямі браузерні підключення через local loopback (`127.0.0.1` / `localhost`) схвалюються автоматично.
- Tailscale Serve може пропустити цикл спарювання для operator sessions у Control UI, коли `gateway.auth.allowTailscale: true`, ідентичність Tailscale підтверджується, а браузер надає свою ідентичність пристрою.
- Прямі прив’язки Tailnet, браузерні підключення з LAN і профілі браузера без ідентичності пристрою все ще потребують явного схвалення.
- Кожен профіль браузера генерує унікальний ID пристрою, тому перехід між браузерами або очищення даних браузера потребуватиме повторного спарювання.

</Note>

## Особиста ідентичність (локальна для браузера)

Control UI підтримує персональну ідентичність для кожного браузера (відображуване ім’я та аватар), яка додається до вихідних повідомлень для атрибуції у спільних сесіях. Вона зберігається у сховищі браузера, обмежена поточним профілем браузера і не синхронізується з іншими пристроями та не зберігається на сервері, окрім звичайних метаданих авторства transcript для повідомлень, які ви фактично надсилаєте. Очищення даних сайту або зміна браузера скидає її до порожнього стану.

Та сама локальна для браузера модель застосовується до перевизначення аватара assistant. Завантажені аватари assistant накладаються на ідентичність, визначену gateway, лише в локальному браузері та ніколи не проходять зворотний обмін через `config.patch`. Спільне поле конфігурації `ui.assistant.avatar` усе ще доступне для клієнтів не з UI, які записують поле напряму (наприклад, scripted gateways або custom dashboards).

## Endpoint runtime-конфігурації

Control UI отримує свої runtime-налаштування з `/__openclaw/control-ui-config.json`. Цей endpoint захищений тією самою gateway auth, що й решта HTTP-поверхні: неавтентифіковані браузери не можуть його отримати, а успішне отримання потребує вже дійсного gateway token/password, ідентичності Tailscale Serve або ідентичності trusted-proxy.

## Підтримка мов

Control UI може локалізуватися під час першого завантаження на основі locale вашого браузера. Щоб змінити це пізніше, відкрийте **Overview -> Gateway Access -> Language**. Вибір locale міститься в картці Gateway Access, а не в Appearance.

- Підтримувані locale: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Неанглійські переклади lazy-loaded у браузері.
- Вибраний locale зберігається у сховищі браузера та повторно використовується під час майбутніх відвідувань.
- Відсутні ключі перекладу повертаються до англійської.

Переклади документації генеруються для того самого набору неанглійських locale, але вбудований у сайт документації перемикач мов Mintlify обмежений кодами locale, які приймає Mintlify. Документація тайською (`th`) і перською (`fa`) все ще генерується в publish repo; вона може не з’являтися в цьому перемикачі, доки Mintlify не підтримуватиме ці коди.

## Теми вигляду

Панель Appearance зберігає вбудовані теми Claw, Knot і Dash, а також один локальний для браузера слот імпорту tweakcn. Щоб імпортувати тему, відкрийте [tweakcn themes](https://tweakcn.com/themes), виберіть або створіть тему, натисніть **Share** і вставте скопійоване посилання на тему в Appearance. Імпортер також приймає registry URL `https://tweakcn.com/r/themes/<id>`, URL редактора на кшталт `https://tweakcn.com/editor/theme?theme=amethyst-haze`, відносні шляхи `/themes/<id>`, сирі ID тем і назви типових тем, як-от `amethyst-haze`.

Імпортовані теми зберігаються лише в поточному профілі браузера. Вони не записуються в gateway config і не синхронізуються між пристроями. Заміна імпортованої теми оновлює один локальний слот; очищення перемикає активну тему назад на Claw, якщо імпортовану тему було вибрано.

## Що він може робити (сьогодні)

<AccordionGroup>
  <Accordion title="Чат і розмова">
    - Спілкуватися з моделлю через Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Розмовляти через browser realtime sessions. OpenAI використовує direct WebRTC, Google Live використовує constrained одноразовий browser token через WebSocket, а backend-only realtime voice plugins використовують relay transport Gateway. Relay зберігає provider credentials на Gateway, тоді як браузер stream-ить microphone PCM через RPC `talk.realtime.relay*` і надсилає tool calls `openclaw_agent_consult` назад через `chat.send` для більшої налаштованої моделі OpenClaw.
    - Stream tool calls + картки live tool output у Chat (agent events).

  </Accordion>
  <Accordion title="Канали, інстанси, сесії, сни">
    - Канали: вбудовані плюс стан bundled/external plugin channels, QR login і конфігурація для кожного каналу (`channels.status`, `web.login.*`, `config.patch`).
    - Інстанси: список присутності + оновлення (`system-presence`).
    - Сесії: список + перевизначення model/thinking/fast/verbose/trace/reasoning для кожної сесії (`sessions.list`, `sessions.patch`).
    - Сни: стан dreaming, перемикач увімкнення/вимкнення та reader Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Cron jobs: список/додавання/редагування/запуск/увімкнення/вимкнення + історія запусків (`cron.*`).
    - Skills: стан, увімкнення/вимкнення, встановлення, оновлення API key (`skills.*`).
    - Nodes: список + caps (`node.list`).
    - Exec approvals: редагування gateway або node allowlists + ask policy для `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Конфігурація">
    - Перегляд/редагування `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Застосування + перезапуск із валідацією (`config.apply`) і пробудження останньої активної сесії.
    - Записи містять base-hash guard, щоб запобігти перезапису паралельних редагувань.
    - Записи (`config.set`/`config.apply`/`config.patch`) виконують preflight resolution активних SecretRef для refs у надісланому config payload; unresolved active submitted refs відхиляються до запису.
    - Schema + rendering форми (`config.schema` / `config.schema.lookup`, включно з полями `title` / `description`, matched UI hints, immediate child summaries, docs metadata на вкладених object/wildcard/array/composition nodes, а також plugin + channel schemas, коли доступні); Raw JSON editor доступний лише тоді, коли snapshot має безпечний raw round-trip.
    - Якщо snapshot не може безпечно виконати round-trip сирого тексту, Control UI примусово вмикає Form mode і вимикає Raw mode для цього snapshot.
    - У Raw JSON editor "Reset to saved" зберігає raw-authored shape (форматування, коментарі, layout `$include`) замість повторного rendering плаского snapshot, тому зовнішні редагування переживають reset, коли snapshot може безпечно виконати round-trip.
    - Структуровані значення об’єктів SecretRef відображаються read-only у текстових input форми, щоб запобігти випадковому пошкодженню object-to-string.

  </Accordion>
  <Accordion title="Налагодження, логи, оновлення">
    - Налагодження: snapshots status/health/models + event log + ручні RPC calls (`status`, `health`, `models.list`).
    - Логи: live tail gateway file logs із фільтром/експортом (`logs.tail`).
    - Оновлення: запуск package/git update + перезапуск (`update.run`) зі звітом про перезапуск, потім polling `update.status` після повторного підключення для перевірки версії запущеного gateway.

  </Accordion>
  <Accordion title="Примітки панелі Cron jobs">
    - Для ізольованих jobs delivery типово налаштовано на announce summary. Ви можете перемкнути на none, якщо потрібні internal-only runs.
    - Поля channel/target з’являються, коли вибрано announce.
    - Webhook mode використовує `delivery.mode = "webhook"` з `delivery.to`, встановленим на дійсну HTTP(S) webhook URL.
    - Для main-session jobs доступні webhook і none delivery modes.
    - Advanced edit controls містять delete-after-run, clear agent override, cron exact/stagger options, agent model/thinking overrides і best-effort delivery toggles.
    - Валідація форми inline з помилками на рівні полів; недійсні значення вимикають кнопку save, доки їх не буде виправлено.
    - Задайте `cron.webhookToken`, щоб надсилати dedicated bearer token; якщо пропущено, webhook надсилається без auth header.
    - Deprecated fallback: збережені legacy jobs із `notify: true` все ще можуть використовувати `cron.webhook` до міграції.

  </Accordion>
</AccordionGroup>

## Поведінка чату

<AccordionGroup>
  <Accordion title="Семантика надсилання та історії">
    - `chat.send` є **неблокувальним**: він одразу підтверджує отримання через `{ runId, status: "started" }`, а відповідь передається потоком через події `chat`.
    - Завантаження в чат приймають зображення та невідеофайли. Зображення зберігають власний шлях до зображення; інші файли зберігаються як керовані медіа й показуються в історії як посилання на вкладення.
    - Повторне надсилання з тим самим `idempotencyKey` повертає `{ status: "in_flight" }` під час виконання і `{ status: "ok" }` після завершення.
    - Відповіді `chat.history` обмежені за розміром для безпеки UI. Коли записи транскрипту завеликі, Gateway може обрізати довгі текстові поля, опускати важкі блоки метаданих і замінювати надмірно великі повідомлення заповнювачем (`[chat.history omitted: message too large]`).
    - Зображення асистента або згенеровані зображення зберігаються як керовані медіапосилання й повертаються через автентифіковані медіа-URL Gateway, тому перезавантаження не залежать від того, чи лишаються сирі base64-навантаження зображень у відповіді історії чату.
    - `chat.history` також прибирає з видимого тексту асистента службові inline-теги директив лише для відображення (наприклад `[[reply_to_*]]` і `[[audio_as_voice]]`), plain-text XML-навантаження викликів інструментів (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів), а також витоки ASCII/повноширинних контрольних токенів моделі, і опускає записи асистента, весь видимий текст яких є лише точним silent-токеном `NO_REPLY` / `no_reply`.
    - Під час активного надсилання та фінального оновлення історії подання чату зберігає видимими локальні оптимістичні повідомлення користувача/асистента, якщо `chat.history` на короткий час повертає старіший знімок; канонічний транскрипт замінює ці локальні повідомлення, щойно історія Gateway наздоганяє стан.
    - `chat.inject` додає нотатку асистента до транскрипту сесії та транслює подію `chat` для оновлень лише UI (без запуску агента, без доставки в канал).
    - Пікери моделі та thinking у заголовку чату негайно змінюють активну сесію через `sessions.patch`; це сталі перевизначення сесії, а не параметри надсилання лише для одного ходу.
    - Пікер моделі чату запитує налаштоване подання моделей Gateway. Якщо присутній `agents.defaults.models`, цей allowlist керує пікером. Інакше пікер показує явні записи `models.providers.*.models` і провайдерів із придатною автентифікацією. Повний каталог лишається доступним через debug RPC `models.list` з `view: "all"`.
    - Коли свіжі звіти Gateway про використання сесії показують високий тиск контексту, область composer чату показує сповіщення про контекст, а на рекомендованих рівнях Compaction - кнопку compact, що запускає звичайний шлях Compaction сесії. Застарілі знімки токенів приховуються, доки Gateway знову не повідомить свіже використання.

  </Accordion>
  <Accordion title="Режим розмови (браузерний realtime)">
    Режим розмови використовує зареєстрованого провайдера голосу realtime. Налаштуйте OpenAI за допомогою `talk.provider: "openai"` разом із `talk.providers.openai.apiKey`, або налаштуйте Google за допомогою `talk.provider: "google"` разом із `talk.providers.google.apiKey`; конфігурацію realtime-провайдера Voice Call усе ще можна повторно використати як fallback. Браузер ніколи не отримує стандартний API-ключ провайдера. OpenAI отримує ефемерний клієнтський секрет Realtime для WebRTC. Google Live отримує одноразовий обмежений auth-токен Live API для браузерної WebSocket-сесії, з інструкціями та деклараціями інструментів, зафіксованими в токені Gateway. Провайдери, які надають лише backend realtime bridge, працюють через relay-транспорт Gateway, тож облікові дані й vendor-сокети лишаються на сервері, а браузерний аудіопотік проходить через автентифіковані RPC Gateway. Prompt realtime-сесії збирає Gateway; `talk.realtime.session` не приймає надані викликачем перевизначення інструкцій.

    У composer чату елемент керування Talk - це кнопка з хвилями поруч із кнопкою диктування через мікрофон. Коли Talk запускається, рядок стану composer показує `Connecting Talk...`, потім `Talk live`, коли аудіо підключено, або `Asking OpenClaw...`, коли realtime-виклик інструмента консультується з налаштованою більшою моделлю через `chat.send`.

    Maintainer live smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` перевіряє OpenAI браузерний WebRTC SDP exchange, Google Live constrained-token browser WebSocket setup і Gateway relay browser adapter з фейковими медіа мікрофона. Команда друкує лише статус провайдера й не журналює секрети.

  </Accordion>
  <Accordion title="Зупинка та переривання">
    - Натисніть **Stop** (викликає `chat.abort`).
    - Поки запуск активний, звичайні подальші повідомлення стають у чергу. Натисніть **Steer** на повідомленні в черзі, щоб вставити це подальше повідомлення в поточний хід.
    - Введіть `/stop` (або окремі фрази переривання, як-от `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), щоб перервати поза основним каналом.
    - `chat.abort` підтримує `{ sessionKey }` (без `runId`), щоб перервати всі активні запуски для цієї сесії.

  </Accordion>
  <Accordion title="Збереження часткового результату після переривання">
    - Коли запуск перервано, частковий текст асистента все ще може показуватися в UI.
    - Gateway зберігає перерваний частковий текст асистента в історії транскрипту, коли існує буферизований вивід.
    - Збережені записи містять метадані переривання, щоб споживачі транскрипту могли відрізнити часткові результати переривання від звичайного виводу завершення.

  </Accordion>
</AccordionGroup>

## Установлення PWA та web push

Control UI постачається з `manifest.webmanifest` і service worker, тому сучасні браузери можуть установити його як автономну PWA. Web Push дає Gateway змогу будити встановлену PWA сповіщеннями, навіть коли вкладку або вікно браузера не відкрито.

| Поверхня                                              | Що вона робить                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Маніфест PWA. Браузери пропонують "Install app", щойно він стає доступним. |
| `ui/public/sw.js`                                     | Service worker, що обробляє події `push` і кліки сповіщень.        |
| `push/vapid-keys.json` (у директорії стану OpenClaw)  | Автоматично згенерована пара ключів VAPID, яку використовують для підписування Web Push-навантажень. |
| `push/web-push-subscriptions.json`                    | Збережені endpoint-и браузерних підписок.                          |

Перевизначте пару ключів VAPID через змінні середовища в процесі Gateway, коли потрібно зафіксувати ключі (для multi-host розгортань, ротації секретів або тестів):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (типово `mailto:openclaw@localhost`)

Control UI використовує ці scope-gated методи Gateway, щоб реєструвати й тестувати браузерні підписки:

- `push.web.vapidPublicKey` — отримує активний публічний ключ VAPID.
- `push.web.subscribe` — реєструє `endpoint` разом із `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — видаляє зареєстрований endpoint.
- `push.web.test` — надсилає тестове сповіщення до підписки викликача.

<Note>
Web Push незалежний від шляху relay iOS APNS (див. [Конфігурація](/uk/gateway/configuration) для push із підтримкою relay) і наявного методу `push.test`, націленого на нативне мобільне спарювання.
</Note>

## Розміщені embeds

Повідомлення асистента можуть рендерити розміщений вебвміст inline через shortcode `[embed ...]`. Політикою iframe sandbox керує `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Вимикає виконання скриптів усередині розміщених embeds.
  </Tab>
  <Tab title="scripts (default)">
    Дозволяє інтерактивні embeds, зберігаючи ізоляцію origin; це типовий режим, і зазвичай його достатньо для самодостатніх браузерних ігор/віджетів.
  </Tab>
  <Tab title="trusted">
    Додає `allow-same-origin` поверх `allow-scripts` для same-site документів, яким навмисно потрібні сильніші привілеї.
  </Tab>
</Tabs>

Приклад:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
Використовуйте `trusted` лише тоді, коли вбудованому документу справді потрібна same-origin поведінка. Для більшості згенерованих агентом ігор та інтерактивних canvas `scripts` є безпечнішим вибором.
</Warning>

Абсолютні зовнішні URL embeds `http(s)` типово лишаються заблокованими. Якщо ви навмисно хочете, щоб `[embed url="https://..."]` завантажував сторонні сторінки, встановіть `gateway.controlUi.allowExternalEmbedUrls: true`.

## Доступ tailnet (рекомендовано)

<Tabs>
  <Tab title="Інтегрований Tailscale Serve (бажано)">
    Тримайте Gateway на loopback і дозвольте Tailscale Serve проксувати його через HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Відкрийте:

    - `https://<magicdns>/` (або ваш налаштований `gateway.controlUi.basePath`)

    Типово запити Control UI/WebSocket Serve можуть автентифікуватися через заголовки ідентичності Tailscale (`tailscale-user-login`), коли `gateway.auth.allowTailscale` має значення `true`. OpenClaw перевіряє ідентичність, розв'язуючи адресу `x-forwarded-for` через `tailscale whois` і зіставляючи її із заголовком, і приймає їх лише тоді, коли запит потрапляє на loopback із заголовками `x-forwarded-*` від Tailscale. Для operator-сесій Control UI з ідентичністю браузерного пристрою цей перевірений шлях Serve також пропускає round trip спарювання пристрою; браузери без пристрою та з'єднання node-role усе ще проходять звичайні перевірки пристрою. Встановіть `gateway.auth.allowTailscale: false`, якщо хочете вимагати явні облікові дані shared-secret навіть для трафіку Serve. Потім використовуйте `gateway.auth.mode: "token"` або `"password"`.

    Для цього асинхронного шляху ідентичності Serve невдалі спроби автентифікації для тієї самої IP-адреси клієнта та auth scope серіалізуються перед записами rate-limit. Тому одночасні невдалі повтори з того самого браузера можуть показати `retry later` на другому запиті замість двох звичайних невідповідностей, що змагаються паралельно.

    <Warning>
    Auth Serve без токена припускає, що host gateway є довіреним. Якщо на цьому host може виконуватися недовірений локальний код, вимагайте token/password auth.
    </Warning>

  </Tab>
  <Tab title="Bind до tailnet + токен">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Потім відкрийте:

    - `http://<tailscale-ip>:18789/` (або ваш налаштований `gateway.controlUi.basePath`)

    Вставте відповідний shared secret у налаштування UI (надсилається як `connect.params.auth.token` або `connect.params.auth.password`).

  </Tab>
</Tabs>

## Небезпечний HTTP

Якщо ви відкриваєте dashboard через plain HTTP (`http://<lan-ip>` або `http://<tailscale-ip>`), браузер працює в **non-secure context** і блокує WebCrypto. Типово OpenClaw **блокує** з'єднання Control UI без ідентичності пристрою.

Задокументовані винятки:

- сумісність insecure HTTP лише для localhost із `gateway.controlUi.allowInsecureAuth=true`
- успішна auth operator Control UI через `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Рекомендоване виправлення:** використовуйте HTTPS (Tailscale Serve) або відкрийте UI локально:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (на gateway host)

<AccordionGroup>
  <Accordion title="Поведінка перемикача insecure-auth">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` є лише локальним перемикачем сумісності:

    - Він дозволяє localhost-сесіям Control UI продовжуватися без ідентичності пристрою в non-secure HTTP contexts.
    - Він не обходить перевірки спарювання.
    - Він не послаблює вимоги до ідентичності віддаленого (не localhost) пристрою.

  </Accordion>
  <Accordion title="Лише break-glass">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` вимикає перевірки ідентичності пристрою Control UI та є серйозним зниженням рівня безпеки. Швидко поверніть налаштування після екстреного використання.
    </Warning>

  </Accordion>
  <Accordion title="Примітка про довірений proxy">
    - Успішна автентифікація через довірений proxy може дозволити сеанси Control UI рівня **оператор** без ідентичності пристрою.
    - Це **не** поширюється на сеанси Control UI з роллю вузла.
    - Зворотні proxy того самого хоста через loopback усе ще не задовольняють автентифікацію через довірений proxy; див. [Автентифікація через довірений proxy](/uk/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Див. [Tailscale](/uk/gateway/tailscale), щоб отримати вказівки з налаштування HTTPS.

## Політика безпеки вмісту

Control UI постачається зі строгою політикою `img-src`: дозволено лише ресурси **того самого джерела**, URL-адреси `data:` і локально згенеровані URL-адреси `blob:`. Віддалені URL-адреси зображень `http(s)` і URL-адреси зображень, відносні до протоколу, відхиляються браузером і не створюють мережевих запитів.

Що це означає на практиці:

- Аватари й зображення, що обслуговуються за відносними шляхами (наприклад, `/avatars/<id>`), усе ще відображаються, включно з автентифікованими маршрутами аватарів, які UI отримує та перетворює на локальні URL-адреси `blob:`.
- Вбудовані URL-адреси `data:image/...` усе ще відображаються (корисно для навантажень у межах протоколу).
- Локальні URL-адреси `blob:`, створені Control UI, усе ще відображаються.
- Віддалені URL-адреси аватарів, що надходять із метаданих каналу, видаляються допоміжними функціями аватарів Control UI і замінюються вбудованим логотипом/бейджем, тому скомпрометований або зловмисний канал не може примусити браузер оператора виконувати довільні віддалені запити зображень.

Вам не потрібно нічого змінювати, щоб отримати таку поведінку — вона завжди ввімкнена й не налаштовується.

## Автентифікація маршруту аватара

Коли автентифікацію gateway налаштовано, кінцева точка аватара Control UI вимагає той самий токен gateway, що й решта API:

- `GET /avatar/<agentId>` повертає зображення аватара лише автентифікованим викликачам. `GET /avatar/<agentId>?meta=1` повертає метадані аватара за тим самим правилом.
- Неавтентифіковані запити до будь-якого з цих маршрутів відхиляються (відповідно до спорідненого маршруту медіа асистента). Це запобігає витоку ідентичності агента через маршрут аватара на хостах, які інакше захищені.
- Сам Control UI пересилає токен gateway як bearer-заголовок під час отримання аватарів і використовує автентифіковані URL-адреси blob, щоб зображення все одно відображалося на панелях.

Якщо ви вимкнете автентифікацію gateway (не рекомендовано на спільних хостах), маршрут аватара також стане неавтентифікованим, відповідно до решти gateway.

## Збирання UI

Gateway обслуговує статичні файли з `dist/control-ui`. Зберіть їх за допомогою:

```bash
pnpm ui:build
```

Необов’язкова абсолютна база (коли потрібні фіксовані URL-адреси ресурсів):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Для локальної розробки (окремий dev-сервер):

```bash
pnpm ui:dev
```

Потім спрямуйте UI на URL Gateway WS (наприклад, `ws://127.0.0.1:18789`).

## Налагодження/тестування: dev-сервер + віддалений Gateway

Control UI — це статичні файли; ціль WebSocket налаштовується й може відрізнятися від HTTP-джерела. Це зручно, коли ви хочете використовувати локальний dev-сервер Vite, але Gateway працює деінде.

<Steps>
  <Step title="Запустіть dev-сервер UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Відкрийте з gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Необов’язкова одноразова автентифікація (за потреби):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Примітки">
    - `gatewayUrl` зберігається в localStorage після завантаження й видаляється з URL.
    - Якщо ви передаєте повну кінцеву точку `ws://` або `wss://` через `gatewayUrl`, закодуйте значення `gatewayUrl` для URL, щоб браузер правильно розібрав рядок запиту.
    - `token` слід передавати через фрагмент URL (`#token=...`), коли це можливо. Фрагменти не надсилаються на сервер, що запобігає витоку в журналах запитів і Referer. Застарілі параметри запиту `?token=` усе ще імпортуються один раз для сумісності, але лише як запасний варіант, і негайно видаляються після bootstrap.
    - `password` зберігається лише в пам’яті.
    - Коли `gatewayUrl` задано, UI не повертається до облікових даних із конфігурації або середовища. Надайте `token` (або `password`) явно. Відсутність явних облікових даних є помилкою.
    - Використовуйте `wss://`, коли Gateway розташований за TLS (Tailscale Serve, HTTPS proxy тощо).
    - `gatewayUrl` приймається лише у вікні верхнього рівня (не вбудованому), щоб запобігти clickjacking.
    - Розгортання Control UI не через loopback мають явно задати `gateway.controlUi.allowedOrigins` (повні джерела). Це включає віддалені dev-налаштування.
    - Під час запуску Gateway може додати локальні джерела, як-от `http://localhost:<port>` і `http://127.0.0.1:<port>`, з ефективної прив’язки та порту середовища виконання, але віддалені джерела браузера все одно потребують явних записів.
    - Не використовуйте `gateway.controlUi.allowedOrigins: ["*"]`, крім випадків суворо контрольованого локального тестування. Це означає дозволити будь-яке джерело браузера, а не «зіставити будь-який хост, який я використовую».
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` вмикає режим fallback для джерела з Host-заголовка, але це небезпечний режим безпеки.

  </Accordion>
</AccordionGroup>

Приклад:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Деталі налаштування віддаленого доступу: [Віддалений доступ](/uk/gateway/remote).

## Пов’язане

- [Панель](/uk/web/dashboard) — панель gateway
- [Перевірки стану](/uk/gateway/health) — моніторинг стану gateway
- [TUI](/uk/web/tui) — термінальний інтерфейс користувача
- [WebChat](/uk/web/webchat) — браузерний інтерфейс чату
