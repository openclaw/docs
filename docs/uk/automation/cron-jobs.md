---
read_when:
    - Планування фонових завдань або пробуджень
    - Підключення зовнішніх тригерів (webhooks, Gmail) до OpenClaw
    - Вибір між Heartbeat і Cron для запланованих завдань
sidebarTitle: Scheduled tasks
summary: Заплановані завдання, webhooks і тригери Gmail PubSub для планувальника Gateway
title: Заплановані завдання
x-i18n:
    generated_at: "2026-06-27T17:08:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97097c9809afea699caa0c60d2ab5b71cd3794f90d9e002d35d25e76ca40d63c
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron — це вбудований планувальник Gateway. Він зберігає завдання, пробуджує агента в потрібний час і може доставляти вивід назад у канал чату або Webhook endpoint.

## Швидкий старт

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Як працює cron

- Cron працює **всередині процесу Gateway** (не всередині моделі).
- Визначення завдань, стан виконання й історія запусків зберігаються у спільній SQLite-базі стану OpenClaw, тому перезапуски не втрачають розклади.
- Під час оновлення запустіть `openclaw doctor --fix`, щоб імпортувати застарілі файли `~/.openclaw/cron/jobs.json`, `jobs-state.json` і `runs/*.jsonl` у SQLite та перейменувати їх із суфіксом `.migrated`. Некоректно сформовані рядки завдань пропускаються під час виконання й копіюються в `jobs-quarantine.json` для подальшого виправлення або перегляду.
- `cron.store` все ще задає логічний ключ сховища cron і шлях імпорту doctor. Після імпорту редагування цього JSON-файлу більше не змінює активні завдання cron; натомість використовуйте `openclaw cron add|edit|remove` або методи Gateway cron RPC.
- Усі виконання cron створюють записи [фонових завдань](/uk/automation/tasks).
- Під час запуску Gateway прострочені ізольовані завдання agent-turn переплановуються за межі вікна підключення каналу, а не відтворюються негайно, тому запуск Discord/Telegram і налаштування нативних команд залишаються чуйними після перезапусків.
- Одноразові завдання (`--at`) типово автоматично видаляються після успішного виконання.
- Ізольовані запуски cron намагаються закрити відстежувані вкладки/процеси браузера для свого сеансу `cron:<jobId>` після завершення запуску, щоб від’єднана браузерна автоматизація не залишала сирітських процесів.
- Ізольовані запуски cron, які отримують вузький дозвіл на самоочищення cron, усе ще можуть читати статус планувальника, самовідфільтрований список свого поточного завдання й історію запусків цього завдання, щоб перевірки статусу/Heartbeat могли переглядати власний розклад без ширшого доступу до змін cron.
- Ізольовані запуски cron також захищаються від застарілих підтверджувальних відповідей. Якщо перший результат — лише проміжне оновлення статусу (`on it`, `pulling everything together` і подібні підказки), а жоден нащадковий subagent-запуск більше не відповідає за фінальну відповідь, OpenClaw один раз повторно запитує фактичний результат перед доставкою.
- Ізольовані запуски cron використовують структуровані метадані відмови у виконанні з вбудованого запуску, зокрема обгортки node-host `UNAVAILABLE`, у яких вкладене повідомлення про помилку починається з `SYSTEM_RUN_DENIED` або `INVALID_REQUEST`, щоб заблокована команда не звітувалася як успішний запуск, а звичайна проза асистента не трактувалася як відмова.
- Ізольовані запуски cron також трактують збої агента на рівні запуску як помилки завдання, навіть коли payload відповіді не створено, тому збої моделі/провайдера збільшують лічильники помилок і запускають сповіщення про невдачу замість того, щоб позначати завдання успішним.
- Коли ізольоване завдання agent-turn досягає `timeoutSeconds`, cron перериває базовий запуск агента й дає йому коротке вікно очищення. Якщо запуск не завершується, очищення, яким володіє Gateway, примусово очищає володіння сеансом цього запуску до того, як cron зафіксує тайм-аут, тож робота чату в черзі не лишається за застарілим сеансом обробки.
- Якщо ізольований agent-turn зависає до старту runner або до першого виклику моделі, cron записує фазово-специфічний тайм-аут, як-от `setup timed out before runner start` або `stalled before first model call (last phase: context-engine)`. Ці watchdog-механізми покривають вбудованих провайдерів і провайдерів на основі CLI до фактичного запуску їхнього зовнішнього CLI-процесу та обмежуються незалежно від довгих значень `timeoutSeconds`, щоб збої cold-start/auth/context проявлялися швидко, а не чекали повного бюджету завдання.
- Якщо ви використовуєте системний cron або інший зовнішній планувальник для запуску `openclaw agent`, обгорніть його ескалацією з примусовим завершенням, навіть попри те, що CLI обробляє `SIGTERM`/`SIGINT`. Запуски через Gateway просять Gateway перервати прийняті запуски; локальні й вбудовані fallback-запуски отримують той самий сигнал переривання. Для GNU `timeout` надавайте перевагу `timeout -k 60 600 openclaw agent ...` замість простого `timeout 600 ...`; значення `-k` є резервним обмеженням супервізора, якщо процес не може завершитися штатно. Для systemd units зберігайте ту саму форму, використовуючи стоп-сигнал `SIGTERM` плюс пільгове вікно, як-от `TimeoutStopSec`, перед будь-яким фінальним kill. Якщо повторна спроба повторно використовує `--run-id`, поки оригінальний Gateway-запуск ще активний, дублікат звітується як такий, що вже виконується, замість запуску другого виконання.

<a id="maintenance"></a>

<Note>
Узгодження завдань для cron спершу належить runtime, а вже потім спирається на довговічну історію: активне cron-завдання лишається живим, доки cron runtime усе ще відстежує це завдання як таке, що виконується, навіть якщо старий рядок дочірнього сеансу досі існує. Щойно runtime припиняє володіти завданням і 5-хвилинне пільгове вікно минає, maintenance перевіряє збережені журнали запусків і стан завдання для відповідного запуску `cron:<jobId>:<startedAt>`. Якщо ця довговічна історія показує термінальний результат, ledger завдання фіналізується з неї; інакше maintenance, яким володіє Gateway, може позначити завдання як `lost`. Офлайн-аудит CLI може відновлюватися з довговічної історії, але він не трактує власний порожній in-process набір активних завдань як доказ того, що cron-запуск, яким володіє Gateway, зник.
</Note>

## Типи розкладів

| Вид     | Прапорець CLI | Опис                                                    |
| ------- | ------------- | ------------------------------------------------------- |
| `at`    | `--at`        | Одноразова часова мітка (ISO 8601 або відносна, як `20m`) |
| `every` | `--every`     | Фіксований інтервал                                     |
| `cron`  | `--cron`      | 5-польовий або 6-польовий cron-вираз з опційним `--tz`  |

Часові мітки без часового поясу трактуються як UTC. Додайте `--tz America/New_York` для планування за локальним настінним часом.

Повторювані вирази на початку години автоматично розносяться до 5 хвилин, щоб зменшити піки навантаження. Використовуйте `--exact`, щоб примусово задати точний час, або `--stagger 30s` для явного вікна.

### День місяця й день тижня використовують логіку OR

Cron-вирази розбираються [croner](https://github.com/Hexagon/croner). Коли поля дня місяця й дня тижня обидва не є wildcard, croner збігається, коли збігається **будь-яке** з полів — не обидва. Це стандартна поведінка Vixie cron.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

Це спрацьовує приблизно 5–6 разів на місяць замість 0–1 разу на місяць. Тут OpenClaw використовує типову OR-поведінку Croner. Щоб вимагати обидві умови, використовуйте модифікатор дня тижня Croner `+` (`0 9 15 * +1`) або плануйте за одним полем і перевіряйте інше в prompt чи команді завдання.

## Стилі виконання

| Стиль           | Значення `--session` | Де виконується           | Найкраще для                    |
| --------------- | -------------------- | ------------------------ | ------------------------------- |
| Основний сеанс  | `main`               | Виділена cron wake lane  | Нагадування, системні події     |
| Ізольований     | `isolated`           | Виділений `cron:<jobId>` | Звіти, фонові операції          |
| Поточний сеанс  | `current`            | Прив’язується під час створення | Повторювана робота з урахуванням контексту |
| Власний сеанс   | `session:custom-id`  | Постійний іменований сеанс | Workflow, що будуються на історії |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    Завдання **основного сеансу** ставлять системну подію в чергу cron-owned run lane й опційно пробуджують Heartbeat (`--wake now` або `--wake next-heartbeat`). Вони можуть використовувати останній контекст доставки цільового основного сеансу для відповідей, але не додають рутинні cron-turns до людської смуги чату й не продовжують актуальність щоденного/idle reset для цільового сеансу. **Ізольовані** завдання виконують виділений agent turn зі свіжим сеансом. **Власні сеанси** (`session:xxx`) зберігають контекст між запусками, уможливлюючи workflow на кшталт щоденних стендапів, що будуються на попередніх підсумках.

    Cron-події основного сеансу — це самодостатні нагадування system-event. Вони не
    містять автоматично інструкцію "Read
    HEARTBEAT.md" з типового Heartbeat prompt. Якщо повторюване нагадування має звертатися до
    `HEARTBEAT.md`, явно скажіть це в тексті cron-події або у
    власних інструкціях агента.

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    Для ізольованих завдань "свіжий сеанс" означає новий transcript/session id для кожного запуску. OpenClaw може переносити безпечні налаштування, як-от thinking/fast/verbose, мітки та явно вибрані користувачем перевизначення model/auth, але він не успадковує навколишній контекст розмови зі старішого cron-рядка: маршрутизацію channel/group, політику send або queue, elevation, origin чи прив’язку ACP runtime. Використовуйте `current` або `session:<id>`, коли повторюване завдання має навмисно будуватися на тому самому контексті розмови.
  </Accordion>
  <Accordion title="Runtime cleanup">
    Для ізольованих завдань завершення runtime тепер включає best-effort очищення браузера для цього cron-сеансу. Збої очищення ігноруються, щоб фактичний cron-результат усе одно мав пріоритет.

    Ізольовані запуски cron також звільняють будь-які bundled MCP runtime instances, створені для завдання через спільний шлях runtime-cleanup. Це відповідає тому, як завершуються MCP-клієнти основного сеансу й власного сеансу, тому ізольовані cron-завдання не витікають stdio child processes або довготривалі MCP-з’єднання між запусками.

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    Коли ізольовані запуски cron оркеструють subagents, доставка також надає перевагу фінальному виводу нащадка над застарілим проміжним текстом батьківського запуску. Якщо нащадки ще виконуються, OpenClaw пригнічує це часткове оновлення батьківського запуску замість того, щоб оголошувати його.

    Для текстових цілей оголошення Discord OpenClaw надсилає канонічний фінальний текст асистента один раз замість повторного відтворення і streamed/intermediate text payloads, і фінальної відповіді. Медіа й структуровані Discord payloads усе ще доставляються як окремі payloads, щоб вкладення й компоненти не губилися.

  </Accordion>
</AccordionGroup>

### Payloads команд

Використовуйте command payloads для детермінованих скриптів, які мають виконуватися всередині планувальника Gateway без запуску model-backed ізольованого agent turn. Command jobs виконуються на хості Gateway, захоплюють stdout/stderr, записують запуск в історію cron і повторно використовують ті самі режими доставки `announce`, `webhook` і `none`, що й ізольовані завдання.

<Note>
Command cron — це операторсько-адміністративна поверхня автоматизації Gateway, а не
виклик агента `tools.exec`. Створення, оновлення, видалення або ручний запуск cron-завдань
потребує `operator.admin`; заплановані command runs згодом виконуються всередині
процесу Gateway як ця автоматизація, створена адміністратором. Політика agent exec, як-от
`tools.exec.mode`, prompts затвердження й allowlists інструментів для окремого агента, керує
model-visible exec tools, а не command cron payloads.
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

`--command <shell>` зберігає `argv: ["sh", "-lc", <shell>]`. Використовуйте `--command-argv '["node","scripts/report.mjs"]'`, коли потрібне точне виконання argv без shell parsing. Опційні поля `--command-env KEY=VALUE`, `--command-input`, `--timeout-seconds`, `--no-output-timeout-seconds` і `--output-max-bytes` керують середовищем процесу, stdin і межами виводу.

Якщо stdout не порожній, цей текст є доставленим результатом. Якщо stdout порожній, а stderr не порожній, доставляється stderr. Якщо присутні обидва потоки, cron доставляє невеликий блок `stdout:` / `stderr:`. Нульовий код виходу записує запуск як `ok`; ненульовий вихід, сигнал, тайм-аут або тайм-аут без виводу записує `error` і може запускати сповіщення про помилки. Команда, яка друкує лише `NO_REPLY`, використовує звичайне придушення silent-token у cron і нічого не надсилає назад у чат.

### Параметри payload для ізольованих завдань

<ParamField path="--message" type="string" required>
  Текст prompt (обов’язковий для ізольованого запуску).
</ParamField>
<ParamField path="--model" type="string">
  Перевизначення моделі; використовує вибрану дозволену модель для завдання.
</ParamField>
<ParamField path="--fallbacks" type="string">
  Список fallback-моделей для окремого завдання, наприклад `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`. Передайте `--fallbacks ""` для суворого запуску без fallback.
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  У `cron edit` прибирає перевизначення fallback для окремого завдання, щоб завдання дотримувалося налаштованого пріоритету fallback. Не можна поєднувати з `--fallbacks`.
</ParamField>
<ParamField path="--clear-model" type="boolean">
  У `cron edit` прибирає перевизначення моделі для окремого завдання, щоб завдання дотримувалося звичайного пріоритету вибору моделі cron (збережене перевизначення cron-session, якщо задано, інакше модель агента/типова). Не можна поєднувати з `--model`.
</ParamField>
<ParamField path="--thinking" type="string">
  Перевизначення рівня мислення.
</ParamField>
<ParamField path="--light-context" type="boolean">
  Пропустити ін’єкцію файлів bootstrap робочого простору.
</ParamField>
<ParamField path="--tools" type="string">
  Обмежити інструменти, які може використовувати завдання, наприклад `--tools exec,read`.
</ParamField>

`--model` використовує вибрану дозволену модель як основну модель цього завдання. Це не те саме, що перевизначення `/model` у chat-session: налаштовані ланцюжки fallback усе одно застосовуються, коли основна модель завдання зазнає збою. Якщо запитана модель не дозволена або її не вдається розв’язати, cron завершує запуск явною помилкою валідації, замість того щоб мовчки повертатися до вибору моделі агента/типової моделі для завдання.

Завдання Cron також можуть містити `fallbacks` на рівні payload. Якщо такий список присутній, він замінює налаштований ланцюжок fallback для завдання. Використовуйте `fallbacks: []` у payload/API завдання, коли потрібен суворий запуск cron, який пробує лише вибрану модель. Якщо завдання має `--model`, але не має fallback ні в payload, ні в конфігурації, OpenClaw передає явне порожнє перевизначення fallback, щоб основна модель агента не додавалася як прихована додаткова ціль повторної спроби.

Preflight-перевірки локального провайдера проходять налаштовані fallback перед тим, як позначити запуск cron як `skipped`; `fallbacks: []` зберігає цей preflight-шлях суворим.

Пріоритет вибору моделі для ізольованих завдань:

1. Перевизначення моделі Gmail hook (коли запуск надійшов із Gmail і це перевизначення дозволене)
2. `model` у payload окремого завдання
3. Збережене користувачем перевизначення моделі cron session
4. Вибір моделі агента/типової моделі

Швидкий режим також дотримується розв’язаного live-вибору. Якщо конфігурація вибраної моделі має `params.fastMode`, ізольований cron використовує його за замовчуванням. Збережене перевизначення `fastMode` у session усе одно має пріоритет над конфігурацією в будь-якому напрямку. Автоматичний режим використовує поріг `params.fastAutoOnSeconds` вибраної моделі, якщо він присутній, зі стандартним значенням 60 секунд.

Якщо ізольований запуск потрапляє в handoff live-перемикання моделі, cron повторює спробу з перемкненим провайдером/моделлю і зберігає цей live-вибір для активного запуску перед повторною спробою. Коли перемикання також містить новий профіль auth, cron також зберігає це перевизначення профілю auth для активного запуску. Повторні спроби обмежені: після початкової спроби плюс 2 повторні спроби перемикання cron перериває виконання замість нескінченного циклу.

Перш ніж ізольований запуск cron увійде в runner агента, OpenClaw перевіряє досяжні локальні endpoint провайдерів для налаштованих провайдерів `api: "ollama"` і `api: "openai-completions"`, у яких `baseUrl` є loopback, private-network або `.local`. Якщо цей endpoint не працює, запуск записується як `skipped` із чіткою помилкою провайдера/моделі замість запуску виклику моделі. Результат endpoint кешується на 5 хвилин, тому багато належних до запуску завдань, що використовують той самий недоступний локальний сервер Ollama, vLLM, SGLang або LM Studio, спільно використовують один невеликий probe замість створення шквалу запитів. Пропущені через provider-preflight запуски не збільшують backoff помилок виконання; увімкніть `failureAlert.includeSkipped`, коли потрібні повторювані сповіщення про пропуски.

## Доставка та вивід

| Режим     | Що відбувається                                                    |
| --------- | ------------------------------------------------------------------ |
| `announce` | Fallback-доставка фінального тексту до цілі, якщо агент не надіслав |
| `webhook`  | POST payload події завершення на URL                              |
| `none`     | Немає fallback-доставки runner                                    |

Використовуйте `--announce --channel telegram --to "-1001234567890"` для доставки в канал. Для тем форуму Telegram використовуйте `-1001234567890:topic:123`; OpenClaw також приймає скорочення, що належить Telegram, `-1001234567890:123`. Прямі RPC/config-викликачі можуть передавати `delivery.threadId` як рядок або число. Цілі Slack/Discord/Mattermost мають використовувати явні префікси (`channel:<id>`, `user:<id>`). ID кімнат Matrix чутливі до регістру; використовуйте точний ID кімнати або форму `room:!room:server` з Matrix.

Коли announce-доставка використовує `channel: "last"` або пропускає `channel`, ціль із префіксом провайдера, наприклад `telegram:123`, може вибрати канал до того, як cron повернеться до історії session або одного налаштованого каналу. Лише префікси, оголошені завантаженим plugin, є селекторами провайдера. Якщо `delivery.channel` задано явно, префікс цілі має називати того самого провайдера; наприклад, `channel: "whatsapp"` із `to: "telegram:123"` відхиляється, замість того щоб дозволити WhatsApp інтерпретувати Telegram ID як номер телефону. Префікси типу цілі та сервісу, як-от `channel:<id>`, `user:<id>`, `imessage:<handle>` і `sms:<number>`, залишаються синтаксисом цілі, яким володіє канал, а не селекторами провайдера.

Для ізольованих завдань доставка в чат спільна. Якщо доступний маршрут чату, агент може використовувати інструмент `message`, навіть коли завдання використовує `--no-deliver`. Якщо агент надсилає до налаштованої/поточної цілі, OpenClaw пропускає fallback announce. Інакше `announce`, `webhook` і `none` лише контролюють, що runner робить із фінальною відповіддю після turn агента.

Коли агент створює ізольоване нагадування з активного чату, OpenClaw зберігає збережену live-ціль доставки для fallback-маршруту announce. Внутрішні ключі session можуть бути в нижньому регістрі; цілі доставки провайдера не реконструюються з цих ключів, коли доступний поточний контекст чату.

Неявна announce-доставка використовує налаштовані allowlist каналів для валідації та перенаправлення застарілих цілей. Схвалення зі сховища пар DM не є отримувачами fallback-автоматизації; задайте `delivery.to` або налаштуйте запис `allowFrom` каналу, коли заплановане завдання має проактивно надсилати в DM.

## Мова виводу

Завдання Cron не виводять мову відповіді з каналу, локалі або попередніх
повідомлень. Додайте правило мови в заплановане повідомлення або шаблон:

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

Для файлів шаблонів тримайте мовну інструкцію в згенерованому prompt і
перевіряйте, що placeholder, як-от `{{language}}`, заповнені до запуску завдання. Якщо
вивід змішує мови, зробіть правило явним, наприклад: "Use Chinese
for narrative text and keep technical terms in English."

Сповіщення про помилки йдуть окремим шляхом призначення:

- `cron.failureDestination` задає глобальне типове призначення для сповіщень про помилки.
- `job.delivery.failureDestination` перевизначає його для окремого завдання.
- Якщо жодне не задано, а завдання вже доставляє через `announce`, сповіщення про помилки тепер fallback-повертаються до цієї основної цілі announce.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо основний режим доставки не `webhook`.
- `failureAlert.includeSkipped: true` вмикає для завдання або глобальної політики сповіщень cron повторювані сповіщення про пропущені запуски. Пропущені запуски мають окремий лічильник послідовних пропусків, тому вони не впливають на backoff помилок виконання.

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
  <Tab title="Повторюване ізольоване завдання">
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
  <Tab title="Webhook-вивід">
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

## Webhooks

Gateway може надавати HTTP webhook endpoint для зовнішніх тригерів. Увімкніть у конфігурації:

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

Кожен запит має містити hook token через заголовок:

- `Authorization: Bearer <token>` (рекомендовано)
- `x-openclaw-token: <token>`

Токени в query-string відхиляються.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Поставити system event у чергу для основної session:

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
    Запустити ізольований turn агента:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Поля: `message` (обов’язкове), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Зіставлені hooks (POST /hooks/<name>)">
    Користувацькі назви hook розв’язуються через `hooks.mappings` у конфігурації. Mappings можуть перетворювати довільні payload на дії `wake` або `agent` за допомогою шаблонів чи code transforms.
  </Accordion>
</AccordionGroup>

<Warning>
Тримайте hook endpoints за loopback, tailnet або довіреним reverse proxy.

- Використовуйте окремий hook token; не використовуйте повторно токени auth Gateway.
- Тримайте `hooks.path` на окремому subpath; `/` відхиляється.
- Задайте `hooks.allowedAgentIds`, щоб обмежити, на якого effective agent може націлюватися hook, включно з типовим агентом, коли `agentId` пропущено.
- Тримайте `hooks.allowRequestSessionKey=false`, якщо вам не потрібні session, вибрані викликачем.
- Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити дозволені форми ключів session.
- Payload hook за замовчуванням обгортаються safety boundaries.

</Warning>

## Інтеграція Gmail PubSub

Під’єднайте тригери вхідних Gmail до OpenClaw через Google PubSub.

<Note>
**Передумови:** CLI `gcloud`, `gog` (gogcli), увімкнені hooks OpenClaw, Tailscale для публічної HTTPS-кінцевої точки.
</Note>

### Налаштування через майстер (рекомендовано)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

Це записує конфігурацію `hooks.gmail`, вмикає пресет Gmail і використовує Tailscale Funnel для push-кінцевої точки.

### Автозапуск Gateway

Коли встановлено `hooks.enabled=true` і задано `hooks.gmail.account`, Gateway запускає `gog gmail watch serve` під час старту й автоматично поновлює watch. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб відмовитися від цього.

### Ручне одноразове налаштування

<Steps>
  <Step title="Виберіть проєкт GCP">
    Виберіть проєкт GCP, якому належить OAuth-клієнт, що використовується `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Створіть topic і надайте Gmail доступ для push">
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
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` повертається після додавання ручного запуску в чергу. Використовуйте `--wait` для shutdown hooks, скриптів обслуговування або іншої автоматизації, яка має блокуватися, доки запуск у черзі не завершиться. Режим очікування опитує точно повернений `runId`; він завершується з `0` для статусу `ok` і з ненульовим кодом для `error`, `skipped` або тайм-ауту очікування.

Інструмент агента `cron` повертає стислі зведення завдань (`id`, `name`, `enabled`, `nextRunAtMs`, `scheduleKind`, `lastRunStatus`) з `cron(action: "list")`; використовуйте `cron(action: "get", jobId: "...")` для повного визначення одного завдання. Прямі виклики Gateway можуть передавати `compact: true` до `cron.list`; якщо пропустити цей параметр, зберігається наявна повна відповідь із попередніми переглядами доставки.

`openclaw cron create` є псевдонімом для `openclaw cron add`, а нові завдання можуть використовувати позиційний розклад (`"0 9 * * 1"`, `"every 1h"`, `"20m"` або ISO-мітку часу), за яким іде позиційний prompt агента. Використовуйте `--webhook <url>` у `cron add|create` або `cron edit`, щоб POST-ити payload завершеного запуску до HTTP-кінцевої точки. Доставку Webhook не можна поєднувати з прапорцями доставки в чат, як-от `--announce`, `--channel`, `--to`, `--thread-id` або `--account`. У `cron edit` параметри `--clear-channel`, `--clear-to`, `--clear-thread-id` і `--clear-account` окремо скидають ці поля маршрутизації (кожен відхиляється разом із відповідним прапорцем установлення), що відрізняється від вимкнення fallback-доставки runner через `--no-deliver`.

<Note>
Примітка щодо перевизначення моделі:

- `openclaw cron add|edit --model ...` змінює вибрану модель завдання.
- Якщо модель дозволена, саме цей provider/model доходить до ізольованого запуску агента.
- Якщо її не дозволено або не вдається розв’язати, cron завершує запуск помилкою з явною помилкою валідації.
- Патчі payload API `cron.update` можуть задавати `model: null`, щоб очистити збережене перевизначення моделі завдання.
- `openclaw cron edit <job-id> --clear-model` очищає це перевизначення з CLI (той самий ефект, що й патч `model: null`) і не може поєднуватися з `--model`.
- Налаштовані fallback-ланцюги все одно застосовуються, бо cron `--model` є основною моделлю завдання, а не перевизначенням `/model` сесії.
- `openclaw cron add|edit --fallbacks ...` задає payload `fallbacks`, замінюючи налаштовані fallback для цього завдання; `--fallbacks ""` вимикає fallback і робить запуск строгим. `openclaw cron edit <job-id> --clear-fallbacks` очищає перевизначення для конкретного завдання.
- Простий `--model` без явного або налаштованого списку fallback не переходить до основної моделі агента як прихованої додаткової цілі повторної спроби.

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

`maxConcurrentRuns` обмежує як заплановану диспетчеризацію cron, так і виконання ізольованих ходів агента, і за замовчуванням дорівнює 8. Ізольовані ходи cron-агента внутрішньо використовують виділену чергу виконання `cron-nested`, тому збільшення цього значення дає незалежним cron-запускам LLM просуватися паралельно, а не лише запускати їхні зовнішні cron-обгортки. Спільна не-cron черга `nested` цим параметром не розширюється.

`cron.store` є логічним ключем сховища та застарілим шляхом імпорту doctor. Запустіть `openclaw doctor --fix`, щоб імпортувати наявні JSON-сховища в SQLite і заархівувати їх; майбутні зміни cron мають проходити через CLI або Gateway API.

Вимкнути cron: `cron.enabled: false` або `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Поведінка повторних спроб">
    **Одноразова повторна спроба**: тимчасові помилки (ліміт частоти, перевантаження, мережа, помилка сервера) повторюються до 3 разів з експоненційною затримкою. Постійні помилки вимикають негайно.

    **Повторна спроба для періодичних запусків**: експоненційна затримка (від 30 с до 60 хв) між повторними спробами. Затримка скидається після наступного успішного запуску.

  </Accordion>
  <Accordion title="Обслуговування">
    `cron.sessionRetention` (за замовчуванням `24h`) очищає записи ізольованих run-session. `cron.runLog.keepLines` обмежує кількість збережених рядків історії запусків SQLite на завдання; `maxBytes` збережено для сумісності конфігурації зі старішими файловими журналами запусків.
  </Accordion>
</AccordionGroup>

## Усунення несправностей

### Сходи команд

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
    - Перевірте `cron.enabled` і змінну середовища `OPENCLAW_SKIP_CRON`.
    - Підтвердьте, що Gateway працює безперервно.
    - Для розкладів `cron` перевірте часовий пояс (`--tz`) порівняно з часовим поясом хоста.
    - `reason: not-due` у виводі запуску означає, що ручний запуск було перевірено через `openclaw cron run <jobId> --due`, і час завдання ще не настав.

  </Accordion>
  <Accordion title="Cron спрацював, але доставки немає">
    - Режим доставки `none` означає, що fallback-надсилання runner не очікується. Агент усе ще може надсилати напряму через інструмент `message`, коли доступний маршрут чату.
    - Відсутня/некоректна ціль доставки (`channel`/`to`) означає, що вихідне надсилання було пропущено.
    - Для Matrix скопійовані або застарілі завдання з room ID у `delivery.to`, переведеними в нижній регістр, можуть завершуватися невдачею, оскільки room ID Matrix чутливі до регістру. Відредагуйте завдання до точного значення `!room:server` або `room:!room:server` з Matrix.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що доставку заблоковано обліковими даними.
    - Якщо ізольований запуск повертає лише silent token (`NO_REPLY` / `no_reply`), OpenClaw пригнічує пряму вихідну доставку, а також fallback-шлях зведення в черзі, тож назад у чат нічого не публікується.
    - Якщо агент має сам надіслати повідомлення користувачу, перевірте, що завдання має придатний маршрут (`channel: "last"` із попереднім чатом або явний канал/ціль).

  </Accordion>
  <Accordion title="Cron або Heartbeat, схоже, заважає rollover у стилі /new">
    - Свіжість щоденного та idle reset не базується на `updatedAt`; див. [Керування сесіями](/uk/concepts/session#session-lifecycle).
    - Пробудження Cron, запуски Heartbeat, exec-сповіщення та службові записи Gateway можуть оновлювати рядок сесії для маршрутизації/статусу, але вони не подовжують `sessionStartedAt` або `lastInteractionAt`.
    - Для застарілих рядків, створених до появи цих полів, OpenClaw може відновити `sessionStartedAt` із заголовка сесії transcript JSONL, якщо файл усе ще доступний. Застарілі idle-рядки без `lastInteractionAt` використовують цей відновлений час початку як свою базову точку idle.

  </Accordion>
  <Accordion title="Підводні камені часових поясів">
    - Cron без `--tz` використовує часовий пояс хоста Gateway.
    - Розклади `at` без часового поясу трактуються як UTC.
    - Heartbeat `activeHours` використовує налаштоване розв’язання часового поясу.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Автоматизація](/uk/automation) — усі механізми автоматизації стисло
- [Фонові завдання](/uk/automation/tasks) — ledger завдань для виконань cron
- [Heartbeat](/uk/gateway/heartbeat) — періодичні ходи основної сесії
- [Часовий пояс](/uk/concepts/timezone) — конфігурація часового поясу
