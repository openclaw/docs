---
read_when:
    - Ви запускаєте openclaw без команди та хочете зрозуміти Crestodian
    - Потрібен безпечний для роботи без конфігурації спосіб перевірити або відновити OpenClaw
    - Ви проєктуєте або вмикаєте режим аварійного відновлення через канал повідомлень
summary: Довідник CLI і модель безпеки для Crestodian, помічника з налаштування та виправлення, безпечного для роботи без конфігурації
title: Crestodian
x-i18n:
    generated_at: "2026-05-02T03:16:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e7cd9bea920cb1201d4f17f3db7b04eafdb4c87e8a62f99229e6aeb177f64c
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian — це локальний помічник OpenClaw для налаштування, відновлення та конфігурації. Він
спроєктований так, щоб залишатися доступним, коли звичайний шлях агента зламаний.

Запуск `openclaw` без команди запускає Crestodian в інтерактивному терміналі.
Запуск `openclaw crestodian` запускає того самого помічника явно.

## Що показує Crestodian

Під час запуску інтерактивний Crestodian відкриває ту саму оболонку TUI, яку використовує
`openclaw tui`, із чат-бекендом Crestodian. Журнал чату починається з короткого
привітання:

- коли запускати Crestodian
- модель або шлях детермінованого планувальника, який Crestodian фактично використовує
- чинність конфігурації та типовий агент
- доступність Gateway за результатом першої стартової перевірки
- наступна налагоджувальна дія, яку може виконати Crestodian

Він не виводить секрети й не завантажує команди CLI plugin лише для запуску. TUI
й надалі надає звичайний заголовок, журнал чату, рядок стану, нижній колонтитул, автодоповнення
та елементи керування редактором.

Використовуйте `status` для докладної інвентаризації зі шляхом конфігурації, шляхами до документації/джерел,
локальними перевірками CLI, наявністю API-ключів, агентами, моделлю та подробицями Gateway.

Crestodian використовує те саме виявлення довідкових матеріалів OpenClaw, що й звичайні агенти. У Git checkout
він спрямовує себе на локальні `docs/` і локальне дерево джерел. В інсталяції npm-пакета він
використовує bundled-документацію пакета та посилається на
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), з явною
порадою переглядати джерела, коли документації недостатньо.

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

У TUI Crestodian:

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
- Gateway вимкнений
- реєстрація команд plugin недоступна
- ще не налаштовано жодного агента

`openclaw --help` і `openclaw --version` і надалі використовують звичайні швидкі шляхи.
Неінтерактивний `openclaw` завершується з коротким повідомленням замість друку кореневої
довідки, тому що продукт без команди — це Crestodian.

## Операції та підтвердження

Crestodian використовує типізовані операції замість довільного редагування конфігурації.

Операції лише для читання можуть виконуватися негайно:

- показати огляд
- перелічити агентів
- перелічити встановлені plugin-и
- шукати plugin-и ClawHub
- показати стан моделі/бекенду
- виконати перевірки стану або працездатності
- перевірити доступність Gateway
- запустити doctor без інтерактивних виправлень
- перевірити конфігурацію
- показати шлях до журналу аудиту

Постійні операції потребують розмовного підтвердження в інтерактивному режимі, якщо
ви не передаєте `--yes` для прямої команди:

- записати конфігурацію
- виконати `config set`
- задати підтримувані значення SecretRef через `config set-ref`
- виконати setup/onboarding bootstrap
- змінити типову модель
- запустити, зупинити або перезапустити Gateway
- створити агентів
- встановити plugin-и з ClawHub або npm
- видалити plugin-и
- виконати виправлення doctor, що перезаписують конфігурацію або стан

Застосовані записи фіксуються в:

```text
~/.openclaw/audit/crestodian.jsonl
```

Виявлення не аудитується. Журналюються лише застосовані операції та записи.

`openclaw onboard --modern` запускає Crestodian як сучасний preview onboarding.
Звичайний `openclaw onboard` і надалі запускає класичний onboarding.

## Bootstrap налаштування

`setup` — це чат-орієнтований onboarding bootstrap. Він записує лише через типізовані
операції конфігурації та спершу просить підтвердження.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Коли модель не налаштована, setup вибирає перший придатний бекенд у такому
порядку й повідомляє, що саме він вибрав:

- наявна явна модель, якщо вже налаштована
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Якщо жоден недоступний, setup усе одно записує типовий workspace і залишає
модель незаданою. Встановіть або увійдіть у Codex/Claude Code, або надайте
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, потім запустіть setup знову.

## Планувальник із підтримкою моделі

Crestodian завжди запускається в детермінованому режимі. Для нечітких команд, які
детермінований парсер не розуміє, локальний Crestodian може виконати один обмежений
хід планувальника через звичайні runtime-шляхи OpenClaw. Спершу він використовує
налаштовану модель OpenClaw. Якщо жодна налаштована модель ще не придатна, він може
повернутися до локальних runtime, які вже є на машині:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` з `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Планувальник із підтримкою моделі не може безпосередньо змінювати конфігурацію. Він має перетворити
запит на одну з типізованих команд Crestodian, після чого застосовуються звичайні правила
підтвердження й аудиту. Crestodian друкує модель, яку використав, і інтерпретовану
команду перед виконанням будь-чого. Ходи fallback-планувальника без конфігурації є
тимчасовими, без інструментів там, де runtime це підтримує, і використовують тимчасовий
workspace/session.

Режим порятунку через канал повідомлень не використовує планувальник із підтримкою моделі. Віддалений
порятунок лишається детермінованим, щоб зламаний або скомпрометований звичайний шлях агента не міг
використовуватися як редактор конфігурації.

## Перемикання на агента

Використовуйте selector природною мовою, щоб вийти з Crestodian і відкрити звичайний TUI:

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

Перемикання агентів усередині TUI залишають breadcrumb, що `/crestodian` доступний.

## Режим порятунку через повідомлення

Режим порятунку через повідомлення — це entrypoint каналу повідомлень для Crestodian. Він призначений для
випадку, коли ваш звичайний агент не працює, але довірений канал, такий як WhatsApp,
досі приймає команди.

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

Створення агента також можна поставити в чергу з локального prompt або режиму порятунку:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Віддалений режим порятунку — це адміністративна поверхня. До нього потрібно ставитися як до віддаленого
відновлення конфігурації, а не як до звичайного чату.

Контракт безпеки для віддаленого порятунку:

- Вимкнений, коли sandboxing активний. Якщо агент/session працює в sandbox,
  Crestodian має відмовити у віддаленому порятунку й пояснити, що потрібне
  відновлення через локальний CLI.
- Типовий ефективний стан — `auto`: дозволяти віддалений порятунок лише в довіреній YOLO
  операції, де runtime вже має несандбоксовані локальні повноваження.
- Вимагати явну ідентичність власника. Порятунок не має приймати wildcard-правила відправника,
  відкриту групову політику, неавтентифіковані webhooks або анонімні канали.
- За замовчуванням лише DM власника. Порятунок у групі/каналі потребує явного opt-in.
- Пошук і список plugin-ів доступні лише для читання. Встановлення plugin локальне за замовчуванням,
  тому що воно завантажує виконуваний код. Видалення plugin може бути дозволене як
  підтверджена операція відновлення, коли політика порятунку дозволяє постійні записи.
- Віддалений порятунок не може відкривати локальний TUI або перемикатися в інтерактивну
  session агента. Використовуйте локальний `openclaw` для передачі агенту.
- Постійні записи й надалі потребують підтвердження, навіть у режимі порятунку.
- Аудіюйте кожну застосовану операцію порятунку. Порятунок через канал повідомлень записує channel,
  account, sender і metadata source-address. Операції, що змінюють конфігурацію, також
  записують хеші конфігурації до та після.
- Ніколи не відлунюйте секрети. Перевірка SecretRef має повідомляти доступність, а не
  значення.
- Якщо Gateway живий, надавайте перевагу типізованим операціям Gateway. Якщо Gateway
  недоступний, використовуйте лише мінімальну локальну поверхню відновлення, яка не залежить від
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

- `"auto"`: типово. Дозволяти лише коли ефективний runtime — YOLO і
  sandboxing вимкнений.
- `false`: ніколи не дозволяти порятунок через канал повідомлень.
- `true`: явно дозволити порятунок, коли перевірки власника/каналу пройдено. Це
  все одно не має обходити відмову через sandboxing.

Типова YOLO-позиція `"auto"`:

- sandbox mode resolves to `off`
- `tools.exec.security` resolves to `full`
- `tools.exec.ask` resolves to `off`

Віддалений порятунок покривається Docker lane:

```bash
pnpm test:docker:crestodian-rescue
```

Локальний fallback планувальника без конфігурації покривається:

```bash
pnpm test:docker:crestodian-planner
```

Opt-in live smoke для поверхні команд каналу перевіряє `/crestodian status` плюс
постійний approval roundtrip через rescue handler:

```bash
pnpm test:live:crestodian-rescue-channel
```

Свіже налаштування без конфігурації через Crestodian покривається:

```bash
pnpm test:docker:crestodian-first-run
```

Ця lane починається з порожнього state dir, спрямовує голий `openclaw` до Crestodian,
задає типову модель, створює додаткового агента, налаштовує Discord через
увімкнення plugin плюс token SecretRef, перевіряє конфігурацію та перевіряє журнал аудиту.
QA Lab також має сценарій, підпертий репозиторієм, для того самого потоку Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Doctor](/uk/cli/doctor)
- [TUI](/uk/cli/tui)
- [Sandbox](/uk/cli/sandbox)
- [Безпека](/uk/cli/security)
