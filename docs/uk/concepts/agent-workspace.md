---
read_when:
    - Потрібно пояснити робочий простір агента або його файлову структуру
    - Ви хочете створити резервну копію або перенести робочий простір агента
sidebarTitle: Agent workspace
summary: 'Робочий простір агента: розташування, структура та стратегія резервного копіювання'
title: Робочий простір агента
x-i18n:
    generated_at: "2026-05-11T20:31:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: adb2ae19c702589010cc67907940ae21feb669cca262e36790a3059aa7d7744c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

The workspace — це домівка агента. Це єдиний робочий каталог, який використовується для файлових інструментів і контексту workspace. Зберігайте його приватним і розглядайте як пам’ять.

Це окремо від `~/.openclaw/`, де зберігаються конфігурація, облікові дані та сесії.

<Warning>
Workspace — це **типовий cwd**, а не жорстка пісочниця. Інструменти розв’язують відносні шляхи відносно workspace, але абсолютні шляхи все ще можуть діставатися інших місць на хості, якщо sandboxing не ввімкнено. Якщо вам потрібна ізоляція, використовуйте [`agents.defaults.sandbox`](/uk/gateway/sandboxing) (та/або sandbox-конфігурацію для окремого агента).

Коли sandboxing увімкнено, а `workspaceAccess` не є `"rw"`, інструменти працюють усередині sandbox workspace в `~/.openclaw/sandboxes`, а не у вашому workspace на хості.
</Warning>

## Типове розташування

- Типово: `~/.openclaw/workspace`
- Якщо `OPENCLAW_PROFILE` задано і він не `"default"`, типовим стає `~/.openclaw/workspace-<profile>`.
- Перевизначення в `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` або `openclaw setup` створять workspace і заповнять початкові файли, якщо їх немає.

<Note>
Копіювання seed-файлів sandbox приймає лише звичайні файли всередині workspace; псевдоніми symlink/hardlink, які розв’язуються поза вихідним workspace, ігноруються.
</Note>

Якщо ви вже самостійно керуєте файлами workspace, можна вимкнути створення початкових файлів:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Додаткові папки workspace

Старіші встановлення могли створити `~/openclaw`. Наявність кількох каталогів workspace може спричиняти плутанину з автентифікацією або розбіжність стану, оскільки одночасно активний лише один workspace.

<Note>
**Рекомендація:** тримайте один активний workspace. Якщо ви більше не використовуєте додаткові папки, заархівуйте їх або перемістіть у Кошик (наприклад, `trash ~/openclaw`). Якщо ви навмисно тримаєте кілька workspace, переконайтеся, що `agents.defaults.workspace` вказує на активний.

`openclaw doctor` попереджає, коли виявляє додаткові каталоги workspace.
</Note>

## Мапа файлів workspace

Це стандартні файли, які OpenClaw очікує всередині workspace:

<AccordionGroup>
  <Accordion title="AGENTS.md - робочі інструкції">
    Робочі інструкції для агента й те, як він має використовувати пам’ять. Завантажується на початку кожної сесії. Добре місце для правил, пріоритетів і деталей про те, «як поводитися».
  </Accordion>
  <Accordion title="SOUL.md - персона й тон">
    Персона, тон і межі. Завантажується в кожній сесії. Посібник: [посібник з особистості SOUL.md](/uk/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - хто такий користувач">
    Хто такий користувач і як до нього звертатися. Завантажується в кожній сесії.
  </Accordion>
  <Accordion title="IDENTITY.md - ім’я, вайб, емодзі">
    Ім’я агента, вайб і емодзі. Створюється/оновлюється під час bootstrap-ритуалу.
  </Accordion>
  <Accordion title="TOOLS.md - локальні домовленості щодо інструментів">
    Нотатки про ваші локальні інструменти й домовленості. Не керує доступністю інструментів; це лише настанови.
  </Accordion>
  <Accordion title="HEARTBEAT.md - контрольний список heartbeat">
    Необов’язковий маленький контрольний список для запусків heartbeat. Тримайте його коротким, щоб уникнути витрат токенів.
  </Accordion>
  <Accordion title="BOOT.md - контрольний список запуску">
    Необов’язковий контрольний список запуску, який автоматично виконується під час перезапуску Gateway (коли ввімкнено [внутрішні hooks](/uk/automation/hooks)). Тримайте його коротким; використовуйте message tool для вихідних надсилань.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - ритуал першого запуску">
    Одноразовий ритуал першого запуску. Створюється лише для абсолютно нового workspace. Видаліть його після завершення ритуалу.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - щоденний журнал пам’яті">
    Щоденний журнал пам’яті (один файл на день). Рекомендовано читати сьогоднішній + вчорашній на початку сесії.
  </Accordion>
  <Accordion title="MEMORY.md - кураторована довготривала пам’ять (необов’язково)">
    Кураторована довготривала пам’ять: сталі факти, уподобання, рішення й короткі підсумки. Тримайте докладні журнали в `memory/YYYY-MM-DD.md`, щоб інструменти пам’яті могли отримувати їх на вимогу без вставляння в кожен prompt. Завантажуйте `MEMORY.md` лише в основній приватній сесії (не в shared/group-контекстах). Див. [Memory](/uk/concepts/memory) щодо workflow та автоматичного скидання пам’яті.
  </Accordion>
  <Accordion title="skills/ - Skills workspace (необов’язково)">
    Skills, специфічні для workspace. Розташування Skills з найвищим пріоритетом для цього workspace. Перевизначає Skills агента проєкту, особисті Skills агента, керовані Skills, вбудовані Skills і `skills.load.extraDirs`, коли назви збігаються.
  </Accordion>
  <Accordion title="canvas/ - файли Canvas UI (необов’язково)">
    Файли Canvas UI для відображень вузлів (наприклад, `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Якщо будь-якого bootstrap-файлу немає, OpenClaw вставляє в сесію маркер «missing file» і продовжує. Великі bootstrap-файли обрізаються під час вставлення; налаштуйте ліміти через `agents.defaults.bootstrapMaxChars` (типово: 12000) і `agents.defaults.bootstrapTotalMaxChars` (типово: 60000). `openclaw setup` може відтворити відсутні типові файли без перезапису наявних.
</Note>

## Чого НЕ має бути у workspace

Це розташовано в `~/.openclaw/` і НЕ має комітитися в репозиторій workspace:

- `~/.openclaw/openclaw.json` (конфігурація)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (профілі автентифікації моделей: OAuth + API keys)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (окремий для агента обліковий запис runtime Codex, конфігурація, Skills, plugins і нативний стан thread)
- `~/.openclaw/credentials/` (стан channel/provider плюс застарілі дані імпорту OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (транскрипти сесій + метадані)
- `~/.openclaw/skills/` (керовані Skills)

Якщо потрібно перенести сесії або конфігурацію, скопіюйте їх окремо й не додавайте до контролю версій.

## Git-резервна копія (рекомендовано, приватно)

Розглядайте workspace як приватну пам’ять. Помістіть його в **приватний** git-репозиторій, щоб він мав резервну копію й міг бути відновлений.

Виконайте ці кроки на машині, де працює Gateway (саме там розташований workspace).

<Steps>
  <Step title="Ініціалізуйте репозиторій">
    Якщо git встановлено, абсолютно нові workspace ініціалізуються автоматично. Якщо цей workspace ще не є репозиторієм, виконайте:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Додайте приватний remote">
    <Tabs>
      <Tab title="Вебінтерфейс GitHub">
        1. Створіть новий **приватний** репозиторій на GitHub.
        2. Не ініціалізуйте з README (це уникає merge conflicts).
        3. Скопіюйте HTTPS remote URL.
        4. Додайте remote і виконайте push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="Вебінтерфейс GitLab">
        1. Створіть новий **приватний** репозиторій на GitLab.
        2. Не ініціалізуйте з README (це уникає merge conflicts).
        3. Скопіюйте HTTPS remote URL.
        4. Додайте remote і виконайте push:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Поточні оновлення">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Не комітьте секрети

<Warning>
Навіть у приватному репозиторії уникайте зберігання секретів у workspace:

- API keys, OAuth tokens, passwords або приватні облікові дані.
- Будь-що під `~/.openclaw/`.
- Сирі дампи чатів або чутливих вкладень.

Якщо потрібно зберігати чутливі посилання, використовуйте placeholders і тримайте справжній секрет в іншому місці (password manager, environment variables або `~/.openclaw/`).
</Warning>

Рекомендований початковий `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Перенесення workspace на нову машину

<Steps>
  <Step title="Клонуйте репозиторій">
    Клонуйте репозиторій у потрібний шлях (типово `~/.openclaw/workspace`).
  </Step>
  <Step title="Оновіть конфігурацію">
    Встановіть `agents.defaults.workspace` на цей шлях у `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Заповніть відсутні файли">
    Виконайте `openclaw setup --workspace <path>`, щоб додати будь-які відсутні файли.
  </Step>
  <Step title="Скопіюйте сесії (необов’язково)">
    Якщо вам потрібні сесії, окремо скопіюйте `~/.openclaw/agents/<agentId>/sessions/` зі старої машини.
  </Step>
</Steps>

## Розширені нотатки

- Multi-agent routing може використовувати різні workspaces для кожного агента. Див. [Channel routing](/uk/channels/channel-routing) щодо конфігурації routing.
- Якщо `agents.defaults.sandbox` увімкнено, non-main сесії можуть використовувати per-session sandbox workspaces під `agents.defaults.sandbox.workspaceRoot`.

## Пов’язане

- [Heartbeat](/uk/gateway/heartbeat) - файл workspace HEARTBEAT.md
- [Sandboxing](/uk/gateway/sandboxing) - доступ до workspace у sandboxed середовищах
- [Session](/uk/concepts/session) - шляхи зберігання сесій
- [Standing orders](/uk/automation/standing-orders) - постійні інструкції у файлах workspace
