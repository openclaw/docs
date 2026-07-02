---
read_when:
    - Планування фонових завдань або пробуджень
    - Під’єднання зовнішніх тригерів (webhooks, Gmail) до OpenClaw
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Scheduled tasks
summary: Заплановані завдання, webhooks і тригери Gmail PubSub для планувальника Gateway
title: Заплановані завдання
x-i18n:
    generated_at: "2026-07-02T08:44:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron — це вбудований планувальник Gateway. Він зберігає завдання, пробуджує агента в потрібний час і може доставляти результат назад у канал чату або кінцеву точку Webhook.

## Швидкий старт

<Steps>
  <Step title="Додайте одноразове нагадування">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Перевірте свої завдання">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="Перегляньте історію запусків">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Як працює cron

- Cron виконується **всередині процесу Gateway** (а не всередині моделі).
- Визначення завдань, стан виконання та історія запусків зберігаються у спільній SQLite-базі стану OpenClaw, тому перезапуски не призводять до втрати розкладів.
- Під час оновлення виконайте `openclaw doctor --fix`, щоб імпортувати застарілі файли `~/.openclaw/cron/jobs.json`, `jobs-state.json` і `runs/*.jsonl` у SQLite та перейменувати їх із суфіксом `.migrated`. Некоректні рядки завдань пропускаються під час виконання та копіюються в `jobs-quarantine.json` для подальшого виправлення або перегляду.
- `cron.store` досі позначає логічний ключ сховища cron і шлях імпорту doctor. Після імпорту редагування цього JSON-файлу більше не змінює активні cron-завдання; натомість використовуйте `openclaw cron add|edit|remove` або RPC-методи Gateway для cron.
- Усі виконання cron створюють записи [фонового завдання](/uk/automation/tasks).
- Під час запуску Gateway прострочені ізольовані завдання agent-turn переплановуються за межі вікна підключення каналу, а не відтворюються негайно, тож запуск Discord/Telegram і налаштування нативних команд залишаються чуйними після перезапусків.
- Одноразові завдання (`--at`) за замовчуванням автоматично видаляються після успіху.
- Ізольовані cron-запуски з максимальними зусиллями закривають відстежувані вкладки браузера/процеси для свого сеансу `cron:<jobId>` після завершення запуску, щоб від'єднана браузерна автоматизація не залишала сирітські процеси.
- Ізольовані cron-запуски, які отримують вузький дозвіл cron на самоочищення, усе ще можуть читати стан планувальника, самовідфільтрований список свого поточного завдання та історію запусків цього завдання, щоб перевірки стану/Heartbeat могли оглядати власний розклад без ширшого доступу до зміни cron.
- Ізольовані cron-запуски також захищаються від застарілих відповідей-підтверджень. Якщо перший результат є лише проміжним оновленням стану (`on it`, `pulling everything together` і подібні підказки), а жоден дочірній subagent-запуск більше не відповідає за фінальну відповідь, OpenClaw один раз повторно надсилає запит на фактичний результат перед доставкою.
- Ізольовані cron-запуски використовують структуровані метадані відмови у виконанні з вбудованого запуску, зокрема обгортки node-host `UNAVAILABLE`, вкладене повідомлення про помилку яких починається з `SYSTEM_RUN_DENIED` або `INVALID_REQUEST`, тож заблокована команда не звітується як успішний запуск, а звичайний текст асистента не сприймається як відмова.
- Ізольовані cron-запуски також трактують помилки агента на рівні запуску як помилки завдання, навіть коли payload відповіді не створено, тож помилки моделі/провайдера збільшують лічильники помилок і запускають сповіщення про збій замість позначення завдання як успішного.
- Коли ізольоване завдання agent-turn досягає `timeoutSeconds`, cron перериває базовий запуск агента й надає йому коротке вікно для очищення. Якщо запуск не завершується, очищення під керуванням Gateway примусово очищає власність сеансу цього запуску перед тим, як cron зафіксує тайм-аут, тож поставлена в чергу робота чату не залишається за застарілим обробним сеансом.
- Якщо ізольований agent-turn зависає до старту runner або до першого виклику моделі, cron записує фазоспецифічний тайм-аут, наприклад `setup timed out before runner start` або `stalled before first model call (last phase: context-engine)`. Ці watchdog-перевірки охоплюють вбудованих провайдерів і провайдерів на базі CLI до фактичного старту їхнього зовнішнього CLI-процесу та обмежуються незалежно від довгих значень `timeoutSeconds`, щоб збої холодного старту/автентифікації/контексту проявлялися швидко, а не чекали повного бюджету завдання.
- Якщо ви використовуєте системний cron або інший зовнішній планувальник для запуску `openclaw agent`, обгорніть його ескалацією hard-kill, навіть якщо CLI обробляє `SIGTERM`/`SIGINT`. Запуски через Gateway просять Gateway перервати прийняті запуски; локальні та вбудовані fallback-запуски отримують той самий сигнал переривання. Для GNU `timeout` надавайте перевагу `timeout -k 60 600 openclaw agent ...` замість простого `timeout 600 ...`; значення `-k` є резервним обмежувачем supervisor, якщо процес не може завершитися. Для systemd unit зберігайте ту саму форму, використовуючи сигнал зупинки `SIGTERM` плюс пільгове вікно, наприклад `TimeoutStopSec`, перед будь-яким фінальним kill. Якщо повторна спроба повторно використовує `--run-id`, поки оригінальний запуск Gateway усе ще активний, дублікат звітується як такий, що вже виконується, замість старту другого запуску.

<a id="maintenance"></a>

<Note>
Узгодження завдань для cron спершу належить runtime, а вже потім спирається на довговічну історію: активне cron-завдання залишається живим, доки runtime cron усе ще відстежує це завдання як запущене, навіть якщо старий рядок дочірнього сеансу все ще існує. Щойно runtime припиняє володіти завданням і 5-хвилинне пільгове вікно спливає, обслуговування перевіряє збережені журнали запусків і стан завдання для відповідного запуску `cron:<jobId>:<startedAt>`. Якщо ця довговічна історія показує термінальний результат, ledger завдань фіналізується з неї; інакше обслуговування під керуванням Gateway може позначити завдання як `lost`. Офлайн-аудит CLI може відновитися з довговічної історії, але не трактує власний порожній внутрішньопроцесний набір активних завдань як доказ того, що cron-запуск під керуванням Gateway зник.
</Note>

## Типи розкладів

| Вид     | CLI-прапорець | Опис                                                    |
| ------- | ------------- | ------------------------------------------------------- |
| `at`    | `--at`        | Одноразова позначка часу (ISO 8601 або відносна, як `20m`) |
| `every` | `--every`     | Фіксований інтервал                                     |
| `cron`  | `--cron`      | 5-польовий або 6-польовий вираз cron з необов'язковим `--tz` |

Позначки часу без часового поясу трактуються як UTC. Додайте `--tz America/New_York` для планування за місцевим настінним часом.

Повторювані вирази на початок години автоматично розподіляються з відхиленням до 5 хвилин, щоб зменшити піки навантаження. Використовуйте `--exact`, щоб примусово задати точний час, або `--stagger 30s` для явного вікна.

### День місяця і день тижня використовують логіку OR

Cron-вирази розбираються [croner](https://github.com/Hexagon/croner). Коли поля дня місяця і дня тижня обидва не є wildcard, croner збігається, коли збігається **будь-яке** з полів, а не обидва. Це стандартна поведінка Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Це спрацьовує приблизно 5-6 разів на місяць замість 0-1 разу на місяць. OpenClaw тут використовує стандартну OR-поведінку Croner. Щоб вимагати обидві умови, використовуйте модифікатор дня тижня Croner `+` (`0 9 15 * +1`) або плануйте за одним полем і перевіряйте інше в prompt чи команді вашого завдання.

## Стилі виконання

| Стиль          | Значення `--session` | Виконується в              | Найкраще для                   |
| -------------- | -------------------- | -------------------------- | ------------------------------ |
| Основний сеанс | `main`               | Виділена смуга пробудження cron | Нагадування, системні події    |
| Ізольований    | `isolated`           | Виділений `cron:<jobId>`   | Звіти, фонові справи           |
| Поточний сеанс | `current`            | Прив'язується під час створення | Повторювана робота з урахуванням контексту |
| Власний сеанс  | `session:custom-id`  | Постійний іменований сеанс | Workflows, що будуються на історії |

<AccordionGroup>
  <Accordion title="Основний сеанс, ізольований і власний">
    Завдання **основного сеансу** ставлять системну подію в чергу в керованій cron смузі запусків і за потреби пробуджують Heartbeat (`--wake now` або `--wake next-heartbeat`). Вони можуть використовувати останній контекст доставки цільового основного сеансу для відповідей, але не додають рутинні cron-ходи до людської смуги чату й не подовжують свіжість щоденного/idle reset для цільового сеансу. **Ізольовані** завдання виконують виділений agent turn зі свіжим сеансом. **Власні сеанси** (`session:xxx`) зберігають контекст між запусками, уможливлюючи workflows на кшталт щоденних стендапів, що будуються на попередніх підсумках.

    Cron-події основного сеансу є самодостатніми нагадуваннями системних подій. Вони не
    включають автоматично інструкцію "Read
    HEARTBEAT.md" зі стандартного prompt Heartbeat. Якщо повторюване нагадування має звертатися до
    `HEARTBEAT.md`, скажіть це явно в тексті cron-події або у
    власних інструкціях агента.

  </Accordion>
  <Accordion title="Що означає «свіжий сеанс» для ізольованих завдань">
    Для ізольованих завдань «свіжий сеанс» означає новий transcript/session id для кожного запуску. OpenClaw може переносити безпечні налаштування, як-от параметри thinking/fast/verbose, мітки та явні обрані користувачем перевизначення моделі/автентифікації, але не успадковує навколишній контекст розмови зі старішого рядка cron: маршрутизацію каналу/групи, політику надсилання або черги, elevation, origin чи прив'язку runtime ACP. Використовуйте `current` або `session:<id>`, коли повторюване завдання має навмисно будуватися на тому самому контексті розмови.
  </Accordion>
  <Accordion title="Очищення runtime">
    Для ізольованих завдань завершення runtime тепер включає best-effort очищення браузера для цього cron-сеансу. Помилки очищення ігноруються, щоб фактичний результат cron усе одно мав пріоритет.

    Ізольовані cron-запуски також звільняють будь-які bundled екземпляри runtime MCP, створені для завдання, через спільний шлях runtime-cleanup. Це відповідає тому, як клієнти MCP основного сеансу та власного сеансу завершуються, тож ізольовані cron-завдання не залишають stdio дочірні процеси або довгоживучі MCP-з'єднання між запусками.

  </Accordion>
  <Accordion title="Subagent і доставка в Discord">
    Коли ізольовані cron-запуски оркеструють subagents, доставка також надає перевагу фінальному дочірньому результату над застарілим проміжним текстом батьківського запуску. Якщо дочірні запуски все ще виконуються, OpenClaw пригнічує це часткове батьківське оновлення замість оголошення його.

    Для текстових цілей оголошень Discord OpenClaw надсилає канонічний фінальний текст асистента один раз замість повторного відтворення і streamed/intermediate текстових payload, і фінальної відповіді. Медіа та структуровані payload Discord усе ще доставляються як окремі payload, щоб вкладення й компоненти не втрачалися.

  </Accordion>
</AccordionGroup>

### Payload команд

Використовуйте payload команд для детермінованих скриптів, які мають виконуватися всередині планувальника Gateway без старту ізольованого agent turn на базі моделі. Командні завдання виконуються на хості Gateway, захоплюють stdout/stderr, записують запуск в історію cron і повторно використовують ті самі режими доставки `announce`, `webhook` і `none`, що й ізольовані завдання.

<Note>
Командний cron — це operator-admin поверхня автоматизації Gateway, а не виклик
`tools.exec` агента. Створення, оновлення, видалення або ручний запуск cron-завдань
вимагає `operator.admin`; заплановані командні запуски пізніше виконуються всередині
процесу Gateway як ця створена адміністратором автоматизація. Політика exec агента, як-от
`tools.exec.mode`, запити підтвердження та per-agent tool allowlists, керує
видимими для моделі exec-інструментами, а не командними cron payload.
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` зберігає `argv: ["sh", "-lc", <shell>]`. Використовуйте `--command-argv '["node","scripts/report.mjs"]'`, коли потрібно точне виконання argv без розбору shell. Необов'язкові поля `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` і `--output-max-bytes` керують середовищем процесу, stdin і межами виводу.

Якщо stdout непорожній, цей текст є доставленим результатом. Якщо stdout порожній, а stderr непорожній, доставляється stderr. Якщо присутні обидва потоки, cron доставляє невеликий блок `stdout:` / `stderr:`. Нульовий код виходу записує запуск як `ok`; ненульовий вихід, сигнал, тайм-аут або тайм-аут без виводу записує `error` і може запускати сповіщення про збій. Команда, яка друкує лише `NO_REPLY`, використовує звичайне приглушення silent-token у cron і нічого не надсилає назад у чат.

### Параметри payload для ізольованих завдань

<ParamField path="--message" type="string" required>
  Текст prompt (обов’язковий для isolated).
</ParamField>
<ParamField path="--model" type="string">
  Перевизначення моделі; використовує вибрану дозволену модель для завдання.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Список fallback-моделей для окремого завдання, наприклад `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Передайте `--fallbacks ""` для строгого запуску без fallback.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  У `cron edit` видаляє перевизначення fallback для окремого завдання, щоб завдання дотримувалося налаштованого пріоритету fallback. Не можна поєднувати з `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  У `cron edit` видаляє перевизначення моделі для окремого завдання, щоб завдання дотримувалося звичайного пріоритету вибору моделі cron (збережене перевизначення cron-session, якщо задане, інакше модель агента/за замовчуванням). Не можна поєднувати з `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Перевизначення рівня мислення.
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  У `cron edit` видаляє перевизначення мислення для окремого завдання, щоб завдання дотримувалося звичайного пріоритету мислення cron. Не можна поєднувати з `--thinking`.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Пропустити ін’єкцію bootstrap-файлів робочого простору.
</ParamField>
<ParamField path="--tools" type="string">
  Обмежити, які інструменти може використовувати завдання, наприклад `--tools exec,read`.
</ParamField>

`--model` використовує вибрану дозволену модель як основну модель цього завдання. Це не те саме, що перевизначення `/model` у chat-session: налаштовані fallback-ланцюжки все одно застосовуються, коли основна модель завдання не спрацьовує. Якщо запитана модель не дозволена або її неможливо розв’язати, cron завершує запуск із явною помилкою валідації замість тихого fallback до вибору моделі агента/за замовчуванням для завдання.

Cron-завдання також можуть містити `fallbacks` на рівні payload. Якщо такий список присутній, він замінює налаштований fallback-ланцюжок для завдання. Використовуйте `fallbacks: []` у payload/API завдання, коли потрібен строгий запуск cron, який пробує лише вибрану модель. Якщо завдання має `--model`, але не має ні payload-fallback, ні налаштованих fallback, OpenClaw передає явне порожнє перевизначення fallback, щоб основна модель агента не додавалася як прихована додаткова ціль повторної спроби.

Перевірки preflight для локального провайдера проходять налаштовані fallback перед позначенням запуску cron як `skipped`; `fallbacks: []` зберігає цей preflight-шлях строгим.

Пріоритет вибору моделі для ізольованих завдань:

1. Перевизначення моделі Gmail hook (коли запуск прийшов із Gmail і це перевизначення дозволене)
2. `model` у payload окремого завдання
3. Збережене перевизначення моделі cron-сесії, вибране користувачем
4. Вибір моделі агента/за замовчуванням

Швидкий режим також дотримується розв’язаного live-вибору. Якщо конфіг вибраної моделі має `params.fastMode`, isolated cron використовує його за замовчуванням. Збережене перевизначення `fastMode` у сесії все одно має пріоритет над конфігом в обох напрямках. Auto mode використовує поріг `params.fastAutoOnSeconds` вибраної моделі, якщо він присутній, інакше за замовчуванням 60 секунд.

Якщо isolated-запуск потрапляє на handoff перемикання live-моделі, cron повторює спробу з перемкненим провайдером/моделлю і зберігає цей live-вибір для активного запуску перед повтором. Коли перемикання також несе новий auth-профіль, cron також зберігає перевизначення цього auth-профілю для активного запуску. Повторні спроби обмежені: після початкової спроби плюс 2 повторні спроби перемикання cron перериває виконання замість нескінченного циклу.

Перед входом isolated cron-запуску в agent runner OpenClaw перевіряє доступні локальні endpoint провайдера для налаштованих провайдерів `api: "ollama"` і `api: "openai-completions"`, у яких `baseUrl` є loopback, приватною мережею або `.local`. Якщо цей endpoint недоступний, запуск записується як `skipped` із чіткою помилкою провайдера/моделі замість початку виклику моделі. Результат endpoint кешується на 5 хвилин, тому багато завдань із наставшим часом, які використовують той самий недоступний локальний сервер Ollama, vLLM, SGLang або LM Studio, ділять одну невелику перевірку замість створення шквалу запитів. Пропущені через provider-preflight запуски не збільшують backoff помилок виконання; увімкніть `failureAlert.includeSkipped`, коли потрібні повторні сповіщення про пропуск.

## Доставка та вивід

| Режим     | Що відбувається                                                       |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Доставляє фінальний текст до цілі через fallback, якщо агент не надіслав |
| `webhook`  | Надсилає POST payload події завершення на URL                       |
| `none`     | Немає fallback-доставки runner                                      |

Використовуйте `--announce --channel telegram --to "-1001234567890"` для доставки в канал. Для тем форуму Telegram використовуйте `-1001234567890:topic:123`; OpenClaw також приймає скорочення `-1001234567890:123`, яке належить Telegram. Прямі RPC/config-виклики можуть передавати `delivery.threadId` як рядок або число. Цілі Slack/Discord/Mattermost мають використовувати явні префікси (`channel:<id>`, `user:<id>`). Ідентифікатори кімнат Matrix чутливі до регістру; використовуйте точний ID кімнати або форму `room:!room:server` з Matrix.

Коли announce-доставка використовує `channel: "last"` або пропускає `channel`, ціль із префіксом провайдера, наприклад `telegram:123`, може вибрати канал до того, як cron повернеться до історії сесії або одного налаштованого каналу. Лише префікси, оголошені завантаженим plugin, є селекторами провайдера. Якщо `delivery.channel` задано явно, префікс цілі має називати того самого провайдера; наприклад, `channel: "whatsapp"` з `to: "telegram:123"` відхиляється замість того, щоб дозволити WhatsApp інтерпретувати Telegram ID як номер телефону. Префікси типу цілі та сервісу, такі як `channel:<id>`, `user:<id>`, `imessage:<handle>` і `sms:<number>`, залишаються синтаксисом цілі, яким володіє канал, а не селекторами провайдера.

Для isolated-завдань доставка в чат є спільною. Якщо доступний маршрут чату, агент може використовувати інструмент `message`, навіть коли завдання використовує `--no-deliver`. Якщо агент надсилає до налаштованої/поточної цілі, OpenClaw пропускає fallback announce. Інакше `announce`, `webhook` і `none` контролюють лише те, що runner робить із фінальною відповіддю після ходу агента.

Коли агент створює isolated-нагадування з активного чату, OpenClaw зберігає збережену live-ціль доставки для fallback-маршруту announce. Внутрішні ключі сесії можуть бути в нижньому регістрі; цілі доставки провайдера не реконструюються з цих ключів, коли доступний поточний контекст чату.

Неявна announce-доставка використовує налаштовані allowlist каналів, щоб валідувати й перенаправляти застарілі цілі. Затвердження зі сховища пар DM не є одержувачами fallback-автоматизації; задайте `delivery.to` або налаштуйте запис `allowFrom` каналу, коли заплановане завдання має проактивно надсилати в DM.

## Мова виводу

Cron-завдання не виводять мову відповіді з каналу, локалі або попередніх
повідомлень. Додайте правило мови в заплановане повідомлення або шаблон:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Для файлів шаблонів тримайте інструкцію щодо мови в згенерованому prompt і
перевіряйте, що placeholders на кшталт `{{language}}` заповнені до запуску завдання. Якщо
вивід змішує мови, зробіть правило явним, наприклад: "Use Chinese
for narrative text and keep technical terms in English."

Сповіщення про збої використовують окремий шлях призначення:

- `cron.failureDestination` задає глобальне значення за замовчуванням для сповіщень про збої.
- `job.delivery.failureDestination` перевизначає його для окремого завдання.
- Якщо жодне з них не задане, а завдання вже доставляє через `announce`, сповіщення про збої тепер повертаються до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний режим доставки не є `webhook`.
- `failureAlert.includeSkipped: true` вмикає для завдання або глобальної політики cron-сповіщень повторні сповіщення про пропущені запуски. Пропущені запуски ведуть окремий лічильник послідовних пропусків, тому не впливають на backoff помилок виконання.

## Приклади CLI

<Tabs>
  <Tab title="Одноразове нагадування">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Повторюване isolated-завдання">
    ```bash
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Перевизначення моделі та мислення">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Вивід Webhook">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Вивід команди">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## Webhook

Gateway може відкривати HTTP Webhook endpoint для зовнішніх тригерів. Увімкніть у конфігу:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Автентифікація

Кожен запит має містити hook-токен через header:

- `Authorization: Bearer <token>` (рекомендовано)
- `x-openclaw-token: <token>`

Токени в query string відхиляються.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Додати системну подію в чергу для основної сесії:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Опис події.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` або `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Запустити isolated-хід агента:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Поля: `message` (обов’язкове), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Зіставлені hooks (POST /hooks/<name>)">
    Користувацькі назви hook розв’язуються через `hooks.mappings` у конфігу. Mappings можуть перетворювати довільні payload на дії `wake` або `agent` за допомогою шаблонів або code transforms.
  </Accordion>
</AccordionGroup>

<Warning>
Тримайте hook endpoint за loopback, tailnet або довіреним reverse proxy.

- Використовуйте окремий токен хука; не використовуйте повторно токени автентифікації gateway.
- Тримайте `hooks.path` на окремому підшляху; `/` відхиляється.
- Установіть `hooks.allowedAgentIds`, щоб обмежити, на якого ефективного агента може націлюватися хук, включно з агентом за замовчуванням, коли `agentId` опущено.
- Тримайте `hooks.allowRequestSessionKey=false`, якщо вам не потрібні сеанси, вибрані викликачем.
- Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити допустимі форми ключів сеансу.
- Payload хука за замовчуванням обгортаються межами безпеки.

</Warning>

## Інтеграція Gmail PubSub

Під’єднайте тригери вхідної пошти Gmail до OpenClaw через Google PubSub.

<Note>
**Передумови:** CLI `gcloud`, `gog` (gogcli), увімкнені хуки OpenClaw, Tailscale для публічної HTTPS-точки доступу.
</Note>

### Налаштування майстром (рекомендовано)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Це записує конфігурацію `hooks.gmail`, вмикає пресет Gmail і використовує Tailscale Funnel для push-точки доступу.

### Автозапуск Gateway

Коли встановлено `hooks.enabled=true` і задано `hooks.gmail.account`, Gateway запускає `gog gmail watch serve` під час завантаження та автоматично поновлює watch. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб відмовитися.

### Ручне одноразове налаштування

<Steps>
  <Step title="Виберіть проєкт GCP">
    Виберіть проєкт GCP, якому належить клієнт OAuth, що використовується `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Створіть topic і надайте Gmail push-доступ">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Запустіть watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Перевизначення моделі Gmail

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Керування завданнями

```bash
# Список усіх завдань
openclaw cron list

# Отримати одне збережене завдання як JSON
openclaw cron get <jobId>

# Показати одне завдання, включно з визначеним маршрутом доставки
openclaw cron show <jobId>

# Редагувати завдання
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Примусово запустити завдання зараз
openclaw cron run <jobId>

# Примусово запустити завдання зараз і дочекатися його кінцевого стану
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Запустити лише якщо настав час
openclaw cron run <jobId> --due

# Переглянути історію запусків
openclaw cron runs --id <jobId> --limit 50

# Переглянути один точний запуск
openclaw cron runs --id <jobId> --run-id <runId>

# Видалити завдання
openclaw cron remove <jobId>

# Вибір агента (налаштування з кількома агентами)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` повертається після додавання ручного запуску до черги. Використовуйте `--wait` для shutdown-хуків, скриптів обслуговування або іншої автоматизації, яка має блокуватися, доки запуск у черзі не завершиться. Режим очікування опитує точний повернений `runId`; він завершується з `0` для статусу `ok` і з ненульовим кодом для `error`, `skipped` або тайм-ауту очікування.

Інструмент агента `cron` повертає компактні підсумки завдань (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) з `cron(action: "list")`; використовуйте `cron(action: "get", jobId: "...")` для одного повного визначення завдання. Прямі викликачі Gateway можуть передати `compact: true` до `cron.list`; якщо його опустити, зберігається наявна повна відповідь із попередніми переглядами доставки.

`openclaw cron create` є псевдонімом для `openclaw cron add`, а нові завдання можуть використовувати позиційний розклад (`"0 9 * * 1"`, `"every 1h"`, `"20m"` або ISO timestamp), після якого йде позиційний prompt агента. Використовуйте `--webhook <url>` у `cron add|create` або `cron edit`, щоб POST-ити payload завершеного запуску до HTTP-точки доступу. Доставку Webhook не можна поєднувати з прапорцями доставки в чат, такими як `--announce`, `--channel`, `--to`, `--thread-id` або `--account`. У `cron edit` `--clear-channel`, `--clear-to`, `--clear-thread-id` і `--clear-account` скасовують ці поля маршрутизації окремо (кожен відхиляється разом із відповідним прапорцем установлення), що відрізняється від `--no-deliver`, який вимикає fallback-доставку runner.

<Note>
Примітка щодо перевизначення моделі:

- `openclaw cron add|edit --model ...` змінює вибрану модель завдання.
- Якщо модель дозволена, саме цей provider/model доходить до ізольованого запуску агента.
- Якщо вона не дозволена або її не вдається розв’язати, cron завершує запуск помилкою з явним повідомленням про валідацію.
- Payload-патчі API `cron.update` можуть установити `model: null`, щоб очистити збережене перевизначення моделі завдання.
- `openclaw cron edit <job-id> --clear-model` очищає це перевизначення з CLI (той самий ефект, що й патч `model: null`) і не може поєднуватися з `--model`.
- Налаштовані fallback-ланцюжки все одно застосовуються, бо cron `--model` є основною моделлю завдання, а не перевизначенням сеансу `/model`.
- `openclaw cron add|edit --fallbacks ...` установлює `fallbacks` у payload, замінюючи налаштовані fallback для цього завдання; `--fallbacks ""` вимикає fallback і робить запуск суворим. `openclaw cron edit <job-id> --clear-fallbacks` очищає перевизначення для окремого завдання.
- Простий `--model` без явного або налаштованого списку fallback не переходить до основної моделі агента як мовчазної додаткової цілі повторної спроби.

</Note>

## Конфігурація

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` обмежує як заплановане відправлення cron, так і виконання ізольованих ходів агента, і за замовчуванням дорівнює 8. Ізольовані ходи cron-агента внутрішньо використовують виділену чергу виконання `cron-nested`, тому збільшення цього значення дає незалежним cron LLM-запускам змогу просуватися паралельно, а не лише запускати зовнішні cron-обгортки. Спільна не-cron черга `nested` цим налаштуванням не розширюється.

`cron.store` є логічним ключем сховища та шляхом імпорту legacy doctor. Запустіть `openclaw doctor --fix`, щоб імпортувати наявні JSON-сховища в SQLite і заархівувати їх; майбутні зміни cron мають виконуватися через CLI або Gateway API.

Вимкнути cron: `cron.enabled: false` або `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Поведінка повторних спроб">
    **Одноразова повторна спроба**: тимчасові помилки (rate limit, overload, network, server error) повторюються до 3 разів з експоненційним backoff. Постійні помилки вимикають негайно.

    **Повторна спроба для повторюваних запусків**: експоненційний backoff (від 30s до 60m) між повторними спробами. Backoff скидається після наступного успішного запуску.

  </Accordion>
  <Accordion title="Обслуговування">
    `cron.sessionRetention` (за замовчуванням `24h`) очищає записи ізольованих run-session. `cron.runLog.keepLines` обмежує збережені рядки історії запусків SQLite для кожного завдання; `maxBytes` зберігається для сумісності конфігурації зі старішими файловими журналами запусків.
  </Accordion>
</AccordionGroup>

## Усунення несправностей

### Драбина команд

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron не спрацьовує">
    - Перевірте `cron.enabled` і env var `OPENCLAW_SKIP_CRON`.
    - Переконайтеся, що Gateway працює безперервно.
    - Для розкладів `cron` перевірте timezone (`--tz`) порівняно з timezone хоста.
    - `reason: not-due` у виводі запуску означає, що ручний запуск було перевірено через `openclaw cron run <jobId> --due`, і час завдання ще не настав.

  </Accordion>
  <Accordion title="Cron спрацював, але доставки немає">
    - Режим доставки `none` означає, що fallback-надсилання runner не очікується. Агент усе ще може надсилати напряму за допомогою інструмента `message`, коли доступний маршрут чату.
    - Відсутня або недійсна ціль доставки (`channel`/`to`) означає, що вихідне надсилання було пропущено.
    - Для Matrix скопійовані або legacy-завдання з room ID у `delivery.to`, приведеними до нижнього регістру, можуть не працювати, бо Matrix room ID чутливі до регістру. Відредагуйте завдання до точного значення `!room:server` або `room:!room:server` з Matrix.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що доставку було заблоковано обліковими даними.
    - Якщо ізольований запуск повертає лише silent token (`NO_REPLY` / `no_reply`), OpenClaw пригнічує пряму вихідну доставку, а також пригнічує fallback-шлях зведення в черзі, тому нічого не публікується назад у чат.
    - Якщо агент має сам написати користувачу, перевірте, що завдання має придатний маршрут (`channel: "last"` із попереднім чатом або явний канал/ціль).

  </Accordion>
  <Accordion title="Cron або Heartbeat, здається, перешкоджає rollover /new-style">
    - Свіжість щоденного та idle-скидання не базується на `updatedAt`; див. [Керування сеансами](/uk/concepts/session#session-lifecycle).
    - Пробудження Cron, запуски Heartbeat, exec-сповіщення та службові записи gateway можуть оновлювати рядок сеансу для маршрутизації/статусу, але вони не подовжують `sessionStartedAt` або `lastInteractionAt`.
    - Для legacy-рядків, створених до появи цих полів, OpenClaw може відновити `sessionStartedAt` із заголовка сеансу transcript JSONL, коли файл досі доступний. Legacy idle-рядки без `lastInteractionAt` використовують цей відновлений час початку як свою idle-базу.

  </Accordion>
  <Accordion title="Підводні камені timezone">
    - Cron без `--tz` використовує timezone хоста gateway.
    - Розклади `at` без timezone трактуються як UTC.
    - Heartbeat `activeHours` використовує налаштоване розв’язання timezone.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Автоматизація](/uk/automation) — усі механізми автоматизації одним поглядом
- [Фонові завдання](/uk/automation/tasks) — журнал завдань для виконань cron
- [Heartbeat](/uk/gateway/heartbeat) — періодичні ходи основного сеансу
- [Timezone](/uk/concepts/timezone) — конфігурація timezone
