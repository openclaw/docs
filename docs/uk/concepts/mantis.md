---
read_when:
    - Створення або запуск візуальної перевірки якості в реальному часі для помилок OpenClaw
    - Додавання перевірки «до» та «після» для запиту на злиття
    - Додавання сценаріїв для Discord, Slack, WhatsApp або інших реальних транспортів
    - Налагодження запусків QA, яким потрібні знімки екрана, автоматизація браузера або доступ через VNC
summary: Mantis — це система візуальної наскрізної перевірки для відтворення помилок OpenClaw на активних транспортних каналах, фіксації доказів до й після змін і прикріплення артефактів до PR.
title: Богомол
x-i18n:
    generated_at: "2026-05-03T14:30:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4ce96f271703e06036a893c01a88562d9c336f7781a0b91a15dc3d5bb41a2e7
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної перевірки OpenClaw для помилок, яким потрібні справжнє
середовище виконання, справжній транспорт і видимий доказ. Вона запускає сценарій на відомому
поганому ref, збирає докази, запускає той самий сценарій на кандидатному ref і
публікує порівняння як артефакти, які супровідник може переглянути з PR або
з локальної команди.

Mantis починається з Discord, тому що Discord дає нам цінну першу смугу:
справжню автентифікацію бота, справжні канали guild, реакції, threads, нативні команди й
браузерний UI, де люди можуть візуально підтвердити, що показав транспорт.

## Цілі

- Відтворити помилку з GitHub issue або PR з тією самою формою транспорту, яку бачать
  користувачі.
- Зібрати артефакт **before** на базовому ref перед застосуванням виправлення.
- Зібрати артефакт **after** на кандидатному ref після застосування виправлення.
- За можливості використовувати детермінований oracle, наприклад читання реакції
  Discord REST або перевірку транскрипту каналу.
- Збирати знімки екрана, коли помилка має видиму поверхню UI.
- Запускати локально з керованого агентом CLI і віддалено з GitHub.
- Зберігати достатньо стану машини для VNC-рятування, коли вхід, автоматизація браузера або
  автентифікація provider застрягає.
- Публікувати стислий статус в операторський канал Discord, коли запуск заблоковано,
  потрібна ручна допомога через VNC або запуск завершується.

## Нецілі

- Mantis не є заміною для модульних тестів. Запуск Mantis зазвичай має ставати
  меншим регресійним тестом після того, як виправлення зрозуміле.
- Mantis не є звичайним швидким CI-шлюзом. Він повільніший, використовує live-облікові дані й
  призначений для помилок, де live-середовище має значення.
- Mantis не має вимагати участі людини для нормальної роботи. Ручний VNC - це шлях
  рятування, а не основний сценарій.
- Mantis не зберігає сирі секрети в артефактах, логах, знімках екрана, Markdown
  звітах або коментарях PR.

## Відповідальність

Mantis живе у стеку QA OpenClaw.

- OpenClaw відповідає за середовище виконання сценаріїв, адаптери транспорту, схему доказів і
  локальний CLI під `pnpm openclaw qa mantis`.
- QA Lab відповідає за частини live transport harness, помічники захоплення браузера й
  записувачі артефактів.
- Crabbox відповідає за прогріті Linux-машини, коли потрібна віддалена VM.
- GitHub Actions відповідає за віддалену точку входу workflow і збереження артефактів.
- ClawSweeper відповідає за маршрутизацію коментарів GitHub: розбір команд супровідників,
  dispatch workflow і публікацію фінального коментаря PR.
- Агенти OpenClaw керують Mantis через Codex, коли сценарію потрібне агентне налаштування,
  налагодження або звітування про застряглий стан.

Ця межа тримає знання про транспорт в OpenClaw, планування машин у
Crabbox, а зв’язувальний код workflow супровідників у ClawSweeper.

## Форма Команди

Перша локальна команда перевіряє Discord-бота, guild, канал, надсилання повідомлення,
надсилання реакції та шлях артефактів:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Пізніший runner до і після має приймати таку форму:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

GitHub smoke workflow - це `Mantis Discord Smoke`. GitHub workflow до і після
має приймати еквівалентні inputs:

- `transport`: `discord` для першої версії.
- `scenario`: один або більше scenario ids.
- `baseline_ref`: типово `origin/main` або повідомлений поганий tag з пов’язаного issue.
- `candidate_ref`: SHA голови PR.
- `machine_provider`: типово `aws`, з пізнішим fallback `hetzner`.
- `post_to_pr`: чи має ClawSweeper коментувати результат.

Приклади команд ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Перша команда явна й зосереджена на сценарії. Друга згодом може зіставляти PR
або issue з рекомендованими сценаріями Mantis за labels, зміненими файлами й
знахідками review ClawSweeper.

## Життєвий Цикл Запуску

1. Отримати облікові дані.
2. Виділити або повторно використати VM.
3. Підготувати чистий checkout для базового ref.
4. Встановити залежності й зібрати лише те, що потрібно сценарію.
5. Запустити дочірній OpenClaw Gateway з ізольованою директорією стану.
6. Налаштувати live-транспорт, provider, модель і профіль браузера.
7. Запустити сценарій і зібрати базові докази.
8. Зупинити gateway і зберегти логи.
9. Підготувати кандидатний ref у тій самій VM.
10. Запустити той самий сценарій і зібрати кандидатні докази.
11. Порівняти результати oracle і візуальні докази.
12. Записати Markdown, JSON, логи, знімки екрана й необов’язкові trace-артефакти.
13. Завантажити артефакти GitHub Actions.
14. Опублікувати стислий статус PR або Discord.

Сценарій має мати змогу завершуватися помилкою двома різними способами:

- **Помилку відтворено**: baseline не пройшов очікуваним способом.
- **Помилка harness**: налаштування середовища, облікові дані, Discord API, браузер або
  provider не спрацювали до того, як bug oracle став змістовним.

Фінальний звіт має розділяти ці випадки, щоб супровідники не плутали нестабільне
середовище з поведінкою продукту.

## Discord MVP

Перший сценарій має націлюватися на status reactions Discord у guild channels, де
режим доставки source reply - `message_tool_only`.

Чому це хороший seed для Mantis:

- Він видимий у Discord як реакції на triggering message.
- Він має сильний REST oracle через стан реакцій повідомлення Discord.
- Він перевіряє справжній OpenClaw Gateway, автентифікацію Discord-бота, dispatch повідомлень,
  режим доставки source reply, стан status reaction і життєвий цикл model turn.
- Він достатньо вузький, щоб перша реалізація залишалася чесною.

Очікувана форма сценарію:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

Базові докази мають показувати queued acknowledgement reaction, але без
lifecycle transition у tool-only режимі. Кандидатні докази мають показувати, що lifecycle
status reactions запускаються, коли `messages.statusReactions.enabled` явно
`true`.

## Наявні Частини QA

Mantis має будуватися на наявному приватному стеку QA, а не починатися з
нуля:

- `pnpm openclaw qa discord` уже запускає live Discord lane з driver і
  SUT bots.
- Наявний live transport runner уже записує звіти й observed-message
  artifacts під `.artifacts/qa-e2e/`.
- Оренди облікових даних Convex уже надають ексклюзивний доступ до спільних live
  transport credentials.
- Сервіс керування браузером уже підтримує знімки екрана, snapshots,
  headless managed profiles і remote CDP profiles.
- QA Lab уже має UI налагоджувача і bus для transport-shaped testing.

Перша реалізація Mantis може бути тонким before/after runner поверх цих
частин, плюс один шар візуальних доказів.

## Модель Доказів

Кожен запуск записує стабільну директорію артефактів:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` має бути машинозчитуваним джерелом істини. Markdown
звіту призначений для коментарів PR і людського review.

Summary має містити:

- refs і SHAs, які тестувалися
- транспорт і scenario id
- machine provider і machine id або lease id
- джерело облікових даних без секретних значень
- результат baseline
- результат candidate
- чи відтворилася помилка на baseline
- чи candidate її виправив
- шляхи артефактів
- санітизовані проблеми setup або cleanup

Знімки екрана - це докази, а не секрети. Вони все одно потребують дисципліни редагування:
можуть з’являтися приватні назви каналів, імена користувачів або вміст повідомлень. Для публічних PR
надавайте перевагу посиланням на GitHub Actions artifacts замість inline images, доки історія
редагування не стане сильнішою.

## Браузер І VNC

Браузерна lane має два режими:

- **Headless automation**: типово для CI. Chrome запускається з увімкненим CDP, а
  Playwright або OpenClaw browser control збирає знімки екрана.
- **VNC rescue**: увімкнено на тій самій VM, коли login, MFA, Discord anti-automation
  або visual debugging потребує людини.

Профіль браузера observer Discord має бути достатньо persistent, щоб уникати
входу для кожного запуску, але ізольований від особистого стану браузера. Профіль
належить пулу машин Mantis, а не ноутбуку розробника.

Коли Mantis застрягає, він публікує статусне повідомлення Discord з:

- run id
- scenario id
- machine provider
- директорією артефактів
- інструкціями підключення VNC або noVNC, якщо доступні
- коротким текстом блокера

Перше приватне розгортання може публікувати ці повідомлення в наявний операторський
канал і пізніше перейти до виділеного каналу Mantis.

## Машини

Mantis має надавати перевагу AWS через Crabbox для першої віддаленої реалізації.
Crabbox дає нам прогріті машини, відстеження leases, hydration, логи, результати й
cleanup. Якщо capacity AWS занадто повільна або недоступна, додайте Hetzner provider
за тим самим machine interface.

Мінімальні вимоги до VM:

- Linux з desktop-capable Chrome або Chromium install
- доступ CDP для автоматизації браузера
- VNC або noVNC для рятування
- Node 22 і pnpm
- checkout OpenClaw і cache залежностей
- cache браузера Playwright Chromium, коли використовується Playwright
- достатньо CPU і пам’яті для одного OpenClaw Gateway, одного браузера й одного model run
- outbound access до Discord, GitHub, model providers і credential broker

VM не має зберігати довгоживучі сирі секрети поза очікуваними сховищами облікових даних або
профілів браузера.

## Секрети

Секрети живуть у GitHub organization або repository secrets для віддалених запусків, і в
локальному керованому оператором secret file для локальних запусків.

Рекомендовані назви секретів:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` для публічних GitHub artifact uploads
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

У довгостроковій перспективі credential pool Convex має залишатися звичайним джерелом для live
transport credentials. GitHub secrets bootstrap the broker and fallback lanes.

Mantis runner ніколи не має друкувати:

- токени Discord bot
- API keys provider
- browser cookies
- вміст auth profile
- VNC passwords
- сирі credential payloads

Публічні artifact uploads також мають редагувати target metadata Discord, такі як bot,
guild, channel і message ids. GitHub smoke workflow вмикає
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` з цієї причини.

Якщо token випадково вставлено в issue, PR, chat або log, rotate it
після збереження нового secret.

## GitHub Artifacts І Коментарі PR

Перша GitHub-версія має завантажувати знімки екрана як Actions artifacts і посилатися
на них з коментаря PR. Inline images можуть з’явитися пізніше, коли redaction, retention
і поведінка public/private repo будуть узгоджені.

Коментар PR має бути коротким:

```md
Mantis Discord verification: pass

- Scenario: `discord-status-reactions-tool-only`
- Baseline: reproduced on `<sha>`
- Candidate: fixed on `<sha>`
- Evidence: <artifact link>
- Screenshots: baseline and candidate message-row captures in the artifact
```

Коли запуск завершується невдало через failure harness, коментар має сказати саме це,
а не натякати, що candidate не пройшов.

## Нотатки Щодо Приватного Розгортання

Приватне розгортання вже може мати застосунок Mantis Discord. Повторно використовуйте цей
застосунок замість створення іншого app, коли він має правильні bot
permissions і може бути безпечно rotated.

Задайте початковий канал сповіщень оператора через secrets або конфігурацію
розгортання. Спершу він може вказувати на наявний канал супроводу чи операцій,
а потім перейти до виділеного каналу Mantis, коли такий з’явиться.

Не розміщуйте guild ids, channel ids, bot tokens, browser cookies або VNC passwords
у цьому документі. Зберігайте їх у GitHub secrets, credential broker або
локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- ідентифікатор і назву
- транспорт
- потрібні облікові дані
- політику baseline ref
- політику candidate ref
- патч конфігурації OpenClaw
- кроки налаштування
- стимул
- очікуваний baseline oracle
- очікуваний candidate oracle
- цілі візуального захоплення
- бюджет часу очікування
- кроки очищення

Сценарії мають віддавати перевагу невеликим типізованим oracle:

- стан реакції Discord для помилок реакцій
- посилання на повідомлення Discord для помилок гілкування
- thread ts Slack і стан reaction API для помилок Slack
- ідентифікатори повідомлень електронної пошти та заголовки для помилок електронної пошти
- знімки екрана браузера, коли UI є єдиним надійним спостережуваним результатом

Перевірки зору мають бути додатковими. Якщо API платформи може довести помилку, використовуйте
API як oracle проходження/непроходження, а знімки екрана залишайте для впевненості людини.

## Розширення провайдерів

Після Discord той самий runner може додати:

- Slack: реакції, гілки, згадки застосунку, модальні вікна, завантаження файлів.
- Email: автентифікація Gmail і гілкування повідомлень за допомогою `gog`, коли конекторів
  недостатньо.
- WhatsApp: вхід через QR, повторна ідентифікація, доставка повідомлень, медіа, реакції.
- Telegram: обмеження згадок у групах, команди, реакції там, де доступні.
- Matrix: зашифровані кімнати, зв’язки гілок або відповідей, відновлення після перезапуску.

Кожен транспорт повинен мати один дешевий smoke-сценарій і один або кілька сценаріїв
класів помилок. Дорогі візуальні сценарії мають залишатися opt-in.

## Відкриті питання

- Який бот Discord має бути driver, а який SUT, коли повторно використовується
  наявний бот Mantis?
- Чи має вхід observer browser використовувати людський обліковий запис Discord, тестовий обліковий запис
  або лише доступні боту REST-докази для першого етапу?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування
  команди супровідника?
- Чи потрібно редагувати або обрізати знімки екрана перед завантаженням для публічних PR?
