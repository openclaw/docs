---
read_when:
    - Ви запускаєте openclaw без команди й хочете зрозуміти Crestodian
    - Вам потрібен безпечний для роботи без конфігурації спосіб перевірити або відновити OpenClaw
    - Ви проєктуєте або вмикаєте режим відновлення каналу повідомлень
summary: Довідник CLI і модель безпеки для Crestodian, помічника з налаштування та виправлення, безпечного для роботи без конфігурації
title: Crestodian
x-i18n:
    generated_at: "2026-05-11T20:27:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9124629ed8d4df00b8d4bee683bae3d336b7fadfa5a4fc8d84fb5e51be540fb
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian — це локальний помічник OpenClaw для налаштування, відновлення й конфігурації. Він
спроєктований так, щоб залишатися доступним, коли звичайний шлях агента зламаний.

Запуск `openclaw` без команди запускає Crestodian в інтерактивному терміналі.
Запуск `openclaw crestodian` явно запускає того самого помічника.

## Що показує Crestodian

Під час запуску інтерактивний Crestodian відкриває ту саму оболонку TUI, яку використовує
`openclaw tui`, з чат-бекендом Crestodian. Журнал чату починається з короткого
привітання:

- коли запускати Crestodian
- модель або шлях детермінованого планувальника, який Crestodian фактично використовує
- чинність конфігурації та типовий агент
- досяжність Gateway з першої перевірки під час запуску
- наступна дія налагодження, яку може виконати Crestodian

Він не виводить секрети й не завантажує команди CLI Plugin лише для запуску. TUI
й надалі надає звичайний заголовок, журнал чату, рядок стану, нижній колонтитул, автодоповнення
та елементи керування редактором.

Використовуйте `status` для докладного інвентаря зі шляхом конфігурації, шляхами docs/source,
локальними перевірками CLI, наявністю API-ключів, агентами, моделлю та деталями Gateway.

Crestodian використовує те саме виявлення довідкових матеріалів OpenClaw, що й звичайні агенти. У Git checkout
він вказує на локальні `docs/` і локальне дерево вихідного коду. В інсталяції npm-пакета він
використовує документацію, що входить до пакета, і посилається на
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), з явною
рекомендацією переглядати вихідний код, коли документації недостатньо.

## Приклади

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Усередині TUI Crestodian:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Безпечний запуск

Шлях запуску Crestodian навмисно малий. Він може працювати, коли:

- `openclaw.json` відсутній
- `openclaw.json` недійсний
- Gateway не працює
- реєстрація команд Plugin недоступна
- ще не налаштовано жодного агента

`openclaw --help` і `openclaw --version` і надалі використовують звичайні швидкі шляхи.
Неінтерактивний `openclaw` завершує роботу з коротким повідомленням замість друку кореневої
довідки, тому що продукт без команди — це Crestodian.

## Операції та схвалення

Crestodian використовує типізовані операції замість довільного редагування конфігурації.

Операції лише для читання можуть виконуватися негайно:

- показати огляд
- перелічити агентів
- перелічити встановлені plugins
- шукати plugins у ClawHub
- показати стан моделі/бекенду
- виконати перевірки стану або працездатності
- перевірити досяжність Gateway
- запустити doctor без інтерактивних виправлень
- перевірити конфігурацію
- показати шлях до журналу аудиту

Постійні операції потребують розмовного схвалення в інтерактивному режимі, якщо ви
не передали `--yes` для прямої команди:

- записати конфігурацію
- виконати `config set`
- встановити підтримувані значення SecretRef через `config set-ref`
- виконати bootstrap налаштування/онбордингу
- змінити типову модель
- запустити, зупинити або перезапустити Gateway
- створити агентів
- встановити plugins із ClawHub або npm
- видалити plugins
- виконати виправлення doctor, які перезаписують конфігурацію або стан

Застосовані записи фіксуються в:

```text
~/.openclaw/audit/crestodian.jsonl
```

Виявлення не аудитується. Журналюються лише застосовані операції та записи.

`openclaw onboard --modern` запускає Crestodian як попередній перегляд сучасного онбордингу.
Звичайний `openclaw onboard` і надалі запускає класичний онбординг.

## Bootstrap налаштування

`setup` — це chat-first bootstrap онбордингу. Він записує лише через типізовані
операції конфігурації та спершу запитує схвалення.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Коли модель не налаштована, setup вибирає перший придатний бекенд у такому
порядку й повідомляє, що саме вибрав:

- наявна явно задана модель, якщо її вже налаштовано
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Якщо нічого не доступно, setup усе одно записує типовий workspace і залишає
модель невстановленою. Встановіть або увійдіть у Codex/Claude Code, або надайте
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, потім запустіть setup знову.

## Планувальник за допомогою моделі

Crestodian завжди запускається в детермінованому режимі. Для нечітких команд, які
детермінований парсер не розуміє, локальний Crestodian може виконати один обмежений
хід планувальника через звичайні runtime-шляхи OpenClaw. Спершу він використовує
налаштовану модель OpenClaw. Якщо жодна налаштована модель ще не придатна, він може
повернутися до локальних runtime, які вже наявні на машині:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- harness Codex app-server: `openai/gpt-5.5`
- Codex CLI: `codex-cli/gpt-5.5`

Планувальник за допомогою моделі не може безпосередньо змінювати конфігурацію. Він має перетворити
запит на одну з типізованих команд Crestodian, після чого застосовуються звичайні правила
схвалення й аудиту. Crestodian друкує модель, яку використав, і інтерпретовану
команду перед виконанням будь-чого. Ходи fallback-планувальника без конфігурації є
тимчасовими, з вимкненими інструментами там, де runtime це підтримує, і використовують тимчасовий
workspace/session.

Режим аварійного відновлення через канал повідомлень не використовує планувальник за допомогою моделі. Віддалене
відновлення залишається детермінованим, щоб зламаний або скомпрометований звичайний шлях агента не можна було
використати як редактор конфігурації.

## Перемикання на агента

Використовуйте селектор природною мовою, щоб залишити Crestodian і відкрити звичайний TUI:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` і `openclaw terminal` і надалі відкривають звичайний
TUI агента напряму. Вони не запускають Crestodian.

Після перемикання у звичайний TUI використовуйте `/crestodian`, щоб повернутися до Crestodian.
Можна додати подальший запит:

```text
/crestodian
/crestodian restart gateway
```

Перемикання агентів усередині TUI залишають підказку, що `/crestodian` доступний.

## Режим аварійного відновлення через повідомлення

Режим аварійного відновлення через повідомлення — це точка входу Crestodian через канал повідомлень. Він призначений для
випадку, коли ваш звичайний агент не працює, але довірений канал, як-от WhatsApp,
усе ще приймає команди.

Підтримувана текстова команда:

- `/crestodian <request>`

Потік оператора:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

Створення агента також можна поставити в чергу з локального prompt або режиму аварійного відновлення:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Віддалений режим аварійного відновлення — це адміністративна поверхня. До нього потрібно ставитися як до віддаленого
ремонту конфігурації, а не як до звичайного чату.

Контракт безпеки для віддаленого відновлення:

- Вимкнено, коли sandboxing активний. Якщо агент/session працює в sandbox,
  Crestodian має відмовити у віддаленому відновленні та пояснити, що потрібне
  локальне виправлення через CLI.
- Типовий ефективний стан — `auto`: дозволяти віддалене відновлення лише в довіреній YOLO
  операції, де runtime вже має локальні повноваження без sandbox.
- Потрібна явна ідентичність власника. Відновлення не має приймати wildcard-правила відправника,
  відкриту групову політику, неавтентифіковані webhooks або анонімні канали.
- За замовчуванням лише DM власника. Відновлення в групах/каналах потребує явного opt-in.
- Пошук і список Plugin є лише для читання. Встановлення Plugin за замовчуванням лише локальне,
  оскільки воно завантажує виконуваний код. Видалення Plugin можна дозволити як
  схвалену операцію відновлення, коли політика rescue дозволяє постійні записи.
- Віддалене відновлення не може відкрити локальний TUI або перемкнутися в інтерактивну
  session агента. Використовуйте локальний `openclaw` для передачі керування агенту.
- Постійні записи все одно потребують схвалення, навіть у режимі rescue.
- Аудитуйте кожну застосовану операцію відновлення. Відновлення через канал повідомлень записує метадані каналу,
  облікового запису, відправника та вихідної адреси. Операції, що змінюють конфігурацію, також
  записують хеші конфігурації до і після.
- Ніколи не повторюйте секрети. Перевірка SecretRef має повідомляти про наявність, а не
  значення.
- Якщо Gateway живий, надавайте перевагу типізованим операціям Gateway. Якщо Gateway
  не працює, використовуйте лише мінімальну локальну поверхню відновлення, яка не залежить від
  звичайного циклу агента.

Форма конфігурації:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` має приймати:

- `"auto"`: типово. Дозволяти лише тоді, коли ефективний runtime є YOLO і
  sandboxing вимкнено.
- `false`: ніколи не дозволяти відновлення через канал повідомлень.
- `true`: явно дозволити відновлення, коли перевірки власника/каналу проходять. Це
  все одно не має обходити відмову через sandboxing.

Типова YOLO-позиція `"auto"`:

- sandbox mode resolves to `off`
- `tools.exec.security` resolves to `full`
- `tools.exec.ask` resolves to `off`

Віддалене відновлення покривається Docker-ланкою:

```bash
pnpm test:docker:crestodian-rescue
```

Fallback локального планувальника без конфігурації покривається:

```bash
pnpm test:docker:crestodian-planner
```

Opt-in smoke для поверхні команд live-каналу перевіряє `/crestodian status` плюс
постійний roundtrip схвалення через обробник rescue:

```bash
pnpm test:live:crestodian-rescue-channel
```

Свіже налаштування без конфігурації через Crestodian покривається:

```bash
pnpm test:docker:crestodian-first-run
```

Ця ланка починає з порожнього каталогу стану, маршрутизує голий `openclaw` до Crestodian,
встановлює типову модель, створює додаткового агента, налаштовує Discord через
увімкнення Plugin плюс SecretRef токена, перевіряє конфігурацію та перевіряє журнал аудиту.
QA Lab також має сценарій на основі репозиторію для того самого потоку Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Doctor](/uk/cli/doctor)
- [TUI](/uk/cli/tui)
- [Sandbox](/uk/cli/sandbox)
- [Безпека](/uk/cli/security)
