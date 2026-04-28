---
read_when:
    - Ви хочете зрозуміти `openclaw.ai/install.sh`
    - Ви хочете автоматизувати встановлення (CI / безголовий режим)
    - Ви хочете встановити з checkout GitHub
summary: Як працюють скрипти встановлення (install.sh, install-cli.sh, install.ps1), параметри та автоматизація
title: Внутрішня будова інсталятора
x-i18n:
    generated_at: "2026-04-26T07:02:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f932fb3713e8ecfa75215b05d7071b3b75e6d1135d7c326313739f294023e2
    source_path: install/installer.md
    workflow: 15
---

OpenClaw постачається з трьома скриптами встановлення, які роздаються з `openclaw.ai`.

| Скрипт                             | Платформа            | Що він робить                                                                                                   |
| ---------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Установлює Node за потреби, установлює OpenClaw через npm (типово) або git і може запустити онбординг.         |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Установлює Node + OpenClaw у локальний префікс (`~/.openclaw`) через npm або в режимі git checkout. Root не потрібен. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Установлює Node за потреби, установлює OpenClaw через npm (типово) або git і може запустити онбординг.         |

## Швидкі команди

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Якщо встановлення успішне, але `openclaw` не знайдено в новому терміналі, див. [Усунення проблем із Node.js](/uk/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Рекомендовано для більшості інтерактивних установлень на macOS/Linux/WSL.
</Tip>

### Потік виконання (install.sh)

<Steps>
  <Step title="Визначення ОС">
    Підтримує macOS і Linux (включно з WSL). Якщо виявлено macOS, установлює Homebrew, якщо його немає.
  </Step>
  <Step title="Забезпечення Node.js 24 за замовчуванням">
    Перевіряє версію Node та встановлює Node 24 за потреби (Homebrew на macOS, скрипти налаштування NodeSource на Linux apt/dnf/yum). OpenClaw як і раніше підтримує Node 22 LTS, наразі `22.14+`, для сумісності.
  </Step>
  <Step title="Забезпечення Git">
    Установлює Git, якщо його немає.
  </Step>
  <Step title="Установлення OpenClaw">
    - метод `npm` (типово): глобальне встановлення npm
    - метод `git`: клонує/оновлює репозиторій, установлює залежності через pnpm, збирає, а потім установлює обгортку в `~/.local/bin/openclaw`

  </Step>
  <Step title="Завдання після встановлення">
    - Найкращою можливою спробою оновлює завантажену службу gateway (`openclaw gateway install --force`, потім перезапуск)
    - Запускає `openclaw doctor --non-interactive` під час оновлень і git-встановлень (найкращою можливою спробою)
    - Намагається виконати онбординг, коли це доречно (доступний TTY, онбординг не вимкнено, перевірки bootstrap/config пройдено)
    - Типово встановлює `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### Виявлення source checkout

Якщо запущено всередині checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), скрипт пропонує:

- використати checkout (`git`), або
- використати глобальне встановлення (`npm`)

Якщо TTY недоступний і метод встановлення не задано, типово використовується `npm` і виводиться попередження.

Скрипт завершується з кодом `2` у разі неправильного вибору методу або неправильних значень `--install-method`.

### Приклади (install.sh)

<Tabs>
  <Tab title="Типово">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Пропустити онбординг">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Встановлення через Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main через npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Сухий запуск">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідка щодо параметрів">

| Параметр                             | Опис                                                       |
| ------------------------------------ | ---------------------------------------------------------- |
| `--install-method npm\|git`          | Вибрати метод встановлення (типово: `npm`). Псевдонім: `--method` |
| `--npm`                              | Скорочення для методу npm                                  |
| `--git`                              | Скорочення для методу git. Псевдонім: `--github`           |
| `--version <version\|dist-tag\|spec>`| Версія npm, dist-tag або специфікація пакета (типово: `latest`) |
| `--beta`                             | Використовувати beta dist-tag, якщо доступний, інакше резервно `latest` |
| `--git-dir <path>`                   | Каталог checkout (типово: `~/openclaw`). Псевдонім: `--dir` |
| `--no-git-update`                    | Пропустити `git pull` для наявного checkout                |
| `--no-prompt`                        | Вимкнути запити                                            |
| `--no-onboard`                       | Пропустити онбординг                                       |
| `--onboard`                          | Увімкнути онбординг                                        |
| `--dry-run`                          | Показати дії без застосування змін                         |
| `--verbose`                          | Увімкнути відлагоджувальний вивід (`set -x`, журнали npm рівня notice) |
| `--help`                             | Показати використання (`-h`)                               |

  </Accordion>

  <Accordion title="Довідка щодо змінних середовища">

| Змінна                                                 | Опис                                          |
| ------------------------------------------------------ | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                     | Метод встановлення                            |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>`| Версія npm, dist-tag або специфікація пакета  |
| `OPENCLAW_BETA=0\|1`                                   | Використовувати beta, якщо доступно           |
| `OPENCLAW_GIT_DIR=<path>`                              | Каталог checkout                              |
| `OPENCLAW_GIT_UPDATE=0\|1`                             | Перемикач оновлень git                        |
| `OPENCLAW_NO_PROMPT=1`                                 | Вимкнути запити                               |
| `OPENCLAW_NO_ONBOARD=1`                                | Пропустити онбординг                          |
| `OPENCLAW_DRY_RUN=1`                                   | Режим сухого запуску                          |
| `OPENCLAW_VERBOSE=1`                                   | Режим налагодження                            |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`            | Рівень журналювання npm                       |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                     | Керування поведінкою sharp/libvips (типово: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Призначено для середовищ, де ви хочете мати все в локальному префіксі
(типово `~/.openclaw`) і без системної залежності від Node. Типово підтримує встановлення
через npm, а також встановлення через git-checkout у тому самому потоці префікса.
</Info>

### Потік виконання (install-cli.sh)

<Steps>
  <Step title="Установлення локального середовища виконання Node">
    Завантажує закріплений tarball підтримуваної Node LTS (версію вбудовано в скрипт і оновлюється незалежно) у `<prefix>/tools/node-v<version>` і перевіряє SHA-256.
  </Step>
  <Step title="Забезпечення Git">
    Якщо Git відсутній, намагається встановити його через apt/dnf/yum на Linux або Homebrew на macOS.
  </Step>
  <Step title="Установлення OpenClaw у префікс">
    - метод `npm` (типово): установлює в префікс через npm, а потім записує обгортку в `<prefix>/bin/openclaw`
    - метод `git`: клонує/оновлює checkout (типово `~/openclaw`) і все одно записує обгортку в `<prefix>/bin/openclaw`

  </Step>
  <Step title="Оновлення завантаженої служби gateway">
    Якщо служба gateway уже завантажена з того самого префікса, скрипт виконує
    `openclaw gateway install --force`, потім `openclaw gateway restart` і
    найкращою можливою спробою перевіряє працездатність gateway.
  </Step>
</Steps>

### Приклади (install-cli.sh)

<Tabs>
  <Tab title="Типово">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Користувацький префікс + версія">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Встановлення через Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="JSON-вивід для автоматизації">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Запустити онбординг">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідка щодо параметрів">

| Параметр                    | Опис                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Префікс встановлення (типово: `~/.openclaw`)                                    |
| `--install-method npm\|git` | Вибрати метод встановлення (типово: `npm`). Псевдонім: `--method`               |
| `--npm`                     | Скорочення для методу npm                                                       |
| `--git`, `--github`         | Скорочення для методу git                                                       |
| `--git-dir <path>`          | Каталог git checkout (типово: `~/openclaw`). Псевдонім: `--dir`                 |
| `--version <ver>`           | Версія OpenClaw або dist-tag (типово: `latest`)                                 |
| `--node-version <ver>`      | Версія Node (типово: `22.22.0`)                                                 |
| `--json`                    | Виводити події NDJSON                                                           |
| `--onboard`                 | Запустити `openclaw onboard` після встановлення                                 |
| `--no-onboard`              | Пропустити онбординг (типово)                                                   |
| `--set-npm-prefix`          | У Linux примусово встановити префікс npm у `~/.npm-global`, якщо поточний префікс недоступний для запису |
| `--help`                    | Показати використання (`-h`)                                                    |

  </Accordion>

  <Accordion title="Довідка щодо змінних середовища">

| Змінна                                     | Опис                                         |
| ------------------------------------------ | -------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                   | Префікс встановлення                         |
| `OPENCLAW_INSTALL_METHOD=git\|npm`         | Метод встановлення                           |
| `OPENCLAW_VERSION=<ver>`                   | Версія OpenClaw або dist-tag                 |
| `OPENCLAW_NODE_VERSION=<ver>`              | Версія Node                                  |
| `OPENCLAW_GIT_DIR=<path>`                  | Каталог git checkout для git-встановлень     |
| `OPENCLAW_GIT_UPDATE=0\|1`                 | Перемикач оновлень git для наявних checkout  |
| `OPENCLAW_NO_ONBOARD=1`                    | Пропустити онбординг                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`| Рівень журналювання npm                      |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`         | Керування поведінкою sharp/libvips (типово: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Потік виконання (install.ps1)

<Steps>
  <Step title="Забезпечення PowerShell + середовища Windows">
    Потребує PowerShell 5+.
  </Step>
  <Step title="Забезпечення Node.js 24 за замовчуванням">
    Якщо Node відсутній, намагається встановити його через winget, потім Chocolatey, потім Scoop. Node 22 LTS, наразі `22.14+`, залишається підтримуваним для сумісності.
  </Step>
  <Step title="Установлення OpenClaw">
    - метод `npm` (типово): глобальне встановлення npm із використанням вибраного `-Tag`
    - метод `git`: клонує/оновлює репозиторій, виконує встановлення/збирання через pnpm і встановлює обгортку в `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Завдання після встановлення">
    - Додає потрібний каталог bin до PATH користувача, коли це можливо
    - Найкращою можливою спробою оновлює завантажену службу gateway (`openclaw gateway install --force`, потім перезапуск)
    - Запускає `openclaw doctor --non-interactive` під час оновлень і git-встановлень (найкращою можливою спробою)

  </Step>
  <Step title="Обробка збоїв">
    Встановлення через `iwr ... | iex` і scriptblock повідомляють про завершальну помилку, не закриваючи поточний сеанс PowerShell. Прямі встановлення через `powershell -File` / `pwsh -File` як і раніше завершуються з ненульовим кодом для автоматизації.
  </Step>
</Steps>

### Приклади (install.ps1)

<Tabs>
  <Tab title="Типово">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Встановлення через Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main через npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Користувацький каталог git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Сухий запуск">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Відлагоджувальне трасування">
    ```powershell
    # install.ps1 поки що не має окремого параметра -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідка щодо параметрів">

| Параметр                    | Опис                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Метод встановлення (типово: `npm`)                         |
| `-Tag <tag\|version\|spec>` | npm dist-tag, версія або специфікація пакета (типово: `latest`) |
| `-GitDir <path>`            | Каталог checkout (типово: `%USERPROFILE%\openclaw`)        |
| `-NoOnboard`                | Пропустити онбординг                                       |
| `-NoGitUpdate`              | Пропустити `git pull`                                      |
| `-DryRun`                   | Лише показати дії                                          |

  </Accordion>

  <Accordion title="Довідка щодо змінних середовища">

| Змінна                            | Опис               |
| --------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`| Метод встановлення |
| `OPENCLAW_GIT_DIR=<path>`         | Каталог checkout   |
| `OPENCLAW_NO_ONBOARD=1`           | Пропустити онбординг |
| `OPENCLAW_GIT_UPDATE=0`           | Вимкнути `git pull` |
| `OPENCLAW_DRY_RUN=1`              | Режим сухого запуску |

  </Accordion>
</AccordionGroup>

<Note>
Якщо використовується `-InstallMethod git` і Git відсутній, скрипт завершує роботу та виводить посилання на Git for Windows.
</Note>

---

## CI та автоматизація

Використовуйте неінтерактивні параметри/змінні середовища для передбачуваних запусків.

<Tabs>
  <Tab title="install.sh (неінтерактивний npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (неінтерактивний git)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (пропустити онбординг)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Усунення проблем

<AccordionGroup>
  <Accordion title="Чому потрібен Git?">
    Git потрібен для методу встановлення `git`. Для встановлень через `npm` Git усе одно перевіряється/встановлюється, щоб уникнути збоїв `spawn git ENOENT`, коли залежності використовують git URL.
  </Accordion>

  <Accordion title="Чому npm видає EACCES на Linux?">
    У деяких конфігураціях Linux глобальний префікс npm вказує на шляхи, що належать root. `install.sh` може переключити префікс на `~/.npm-global` і додати експорти PATH до shell rc-файлів (коли ці файли існують).
  </Accordion>

  <Accordion title="Проблеми з sharp/libvips">
    Скрипти типово встановлюють `SHARP_IGNORE_GLOBAL_LIBVIPS=1`, щоб уникнути збирання sharp проти системного libvips. Щоб перевизначити:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Установіть Git for Windows, знову відкрийте PowerShell і повторно запустіть інсталятор.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Запустіть `npm config get prefix` і додайте цей каталог до PATH користувача (у Windows суфікс `\bin` не потрібен), потім знову відкрийте PowerShell.
  </Accordion>

  <Accordion title="Windows: як отримати докладний вивід інсталятора">
    `install.ps1` наразі не має параметра `-Verbose`.
    Використовуйте трасування PowerShell для діагностики на рівні скрипта:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw не знайдено після встановлення">
    Зазвичай це проблема з PATH. Див. [Усунення проблем із Node.js](/uk/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Пов’язано

- [Огляд встановлення](/uk/install)
- [Оновлення](/uk/install/updating)
- [Видалення](/uk/install/uninstall)
