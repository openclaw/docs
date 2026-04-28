---
read_when:
    - Ви хочете зрозуміти `openclaw.ai/install.sh`
    - Ви хочете автоматизувати встановлення (CI / без графічного інтерфейсу)
    - Ви хочете встановити з робочої копії GitHub
summary: Як працюють скрипти інсталятора (install.sh, install-cli.sh, install.ps1), прапорці й автоматизація
title: Внутрішні механізми інсталятора
x-i18n:
    generated_at: "2026-04-28T11:17:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 278e8d6a1a39651812b7f0955965c53c62afd3ad673b357484f8aecbcfbbdb1d
    source_path: install/installer.md
    workflow: 16
---

OpenClaw постачається з трьома скриптами встановлення, які надаються з `openclaw.ai`.

| Скрипт                            | Платформа            | Що він робить                                                                                                      |
| --------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [`install.sh`](#installsh)        | macOS / Linux / WSL  | Встановлює Node за потреби, встановлює OpenClaw через npm (типово) або git і може запускати онбординг.             |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL | Встановлює Node + OpenClaw у локальний префікс (`~/.openclaw`) у режимах npm або git checkout. root не потрібен.   |
| [`install.ps1`](#installps1)      | Windows (PowerShell) | Встановлює Node за потреби, встановлює OpenClaw через npm (типово) або git і може запускати онбординг.             |

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
Якщо встановлення успішне, але `openclaw` не знайдено в новому терміналі, див. [усунення несправностей Node.js](/uk/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Рекомендовано для більшості інтерактивних встановлень на macOS/Linux/WSL.
</Tip>

### Потік (install.sh)

<Steps>
  <Step title="Визначення ОС">
    Підтримує macOS і Linux (зокрема WSL). Якщо виявлено macOS, встановлює Homebrew, якщо його немає.
  </Step>
  <Step title="Забезпечення Node.js 24 типово">
    Перевіряє версію Node і встановлює Node 24 за потреби (Homebrew на macOS, скрипти налаштування NodeSource на Linux apt/dnf/yum). OpenClaw досі підтримує Node 22 LTS, наразі `22.14+`, для сумісності.
  </Step>
  <Step title="Забезпечення Git">
    Встановлює Git, якщо його немає.
  </Step>
  <Step title="Встановлення OpenClaw">
    - метод `npm` (типово): глобальне встановлення npm
    - метод `git`: клонувати/оновити репозиторій, встановити залежності за допомогою pnpm, зібрати, а потім встановити обгортку в `~/.local/bin/openclaw`

  </Step>
  <Step title="Завдання після встановлення">
    - Оновлює завантажену службу Gateway у режимі найкращого зусилля (`openclaw gateway install --force`, потім перезапуск)
    - Запускає `openclaw doctor --non-interactive` під час оновлень і встановлень git (найкраще зусилля)
    - Намагається виконати онбординг, коли це доречно (доступний TTY, онбординг не вимкнено, а перевірки bootstrap/config пройдено)
    - Типово встановлює `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### Виявлення checkout вихідного коду

Якщо запущено всередині checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), скрипт пропонує:

- використати checkout (`git`), або
- використати глобальне встановлення (`npm`)

Якщо TTY недоступний і метод встановлення не задано, типово використовується `npm` і виводиться попередження.

Скрипт завершується з кодом `2` у разі недійсного вибору методу або недійсних значень `--install-method`.

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
  <Tab title="Встановлення Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main через npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Пробний запуск">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник прапорців">

| Прапорець                             | Опис                                                         |
| ------------------------------------- | ------------------------------------------------------------ |
| `--install-method npm\|git`           | Вибрати метод встановлення (типово: `npm`). Псевдонім: `--method` |
| `--npm`                               | Скорочення для методу npm                                    |
| `--git`                               | Скорочення для методу git. Псевдонім: `--github`             |
| `--version <version\|dist-tag\|spec>` | Версія npm, dist-tag або специфікація пакета (типово: `latest`) |
| `--beta`                              | Використати beta dist-tag, якщо доступний, інакше fallback до `latest` |
| `--git-dir <path>`                    | Каталог checkout (типово: `~/openclaw`). Псевдонім: `--dir`  |
| `--no-git-update`                     | Пропустити `git pull` для наявного checkout                  |
| `--no-prompt`                         | Вимкнути підказки                                            |
| `--no-onboard`                        | Пропустити онбординг                                         |
| `--onboard`                           | Увімкнути онбординг                                          |
| `--dry-run`                           | Вивести дії без застосування змін                            |
| `--verbose`                           | Увімкнути налагоджувальний вивід (`set -x`, журнали npm рівня notice) |
| `--help`                              | Показати використання (`-h`)                                 |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                                                  | Опис                                          |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Метод встановлення                            |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Версія npm, dist-tag або специфікація пакета  |
| `OPENCLAW_BETA=0\|1`                                    | Використати beta, якщо доступний              |
| `OPENCLAW_GIT_DIR=<path>`                               | Каталог checkout                              |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Перемкнути оновлення git                      |
| `OPENCLAW_NO_PROMPT=1`                                  | Вимкнути підказки                             |
| `OPENCLAW_NO_ONBOARD=1`                                 | Пропустити онбординг                          |
| `OPENCLAW_DRY_RUN=1`                                    | Режим пробного запуску                        |
| `OPENCLAW_VERBOSE=1`                                    | Режим налагодження                            |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | Рівень журналювання npm                       |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Керувати поведінкою sharp/libvips (типово: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Спроєктовано для середовищ, де потрібно мати все під локальним префіксом
(типово `~/.openclaw`) і без системної залежності Node. Типово підтримує встановлення npm,
а також встановлення з git-checkout у тому самому потоці префікса.
</Info>

### Потік (install-cli.sh)

<Steps>
  <Step title="Встановлення локального середовища виконання Node">
    Завантажує закріплений підтримуваний tarball Node LTS (версію вбудовано в скрипт і оновлюється незалежно) до `<prefix>/tools/node-v<version>` і перевіряє SHA-256.
  </Step>
  <Step title="Забезпечення Git">
    Якщо Git відсутній, намагається встановити його через apt/dnf/yum на Linux або Homebrew на macOS.
  </Step>
  <Step title="Встановлення OpenClaw під префіксом">
    - метод `npm` (типово): встановлює під префіксом за допомогою npm, потім записує обгортку до `<prefix>/bin/openclaw`
    - метод `git`: клонує/оновлює checkout (типово `~/openclaw`) і все одно записує обгортку до `<prefix>/bin/openclaw`

  </Step>
  <Step title="Оновлення завантаженої служби Gateway">
    Якщо службу Gateway уже завантажено з того самого префікса, скрипт запускає
    `openclaw gateway install --force`, потім `openclaw gateway restart`, і
    перевіряє працездатність Gateway у режимі найкращого зусилля.
  </Step>
</Steps>

### Приклади (install-cli.sh)

<Tabs>
  <Tab title="Типово">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Власний префікс + версія">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Встановлення Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Вивід JSON для автоматизації">
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
  <Accordion title="Довідник прапорців">

| Прапорець                   | Опис                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Префікс встановлення (типово: `~/.openclaw`)                                    |
| `--install-method npm\|git` | Вибрати метод встановлення (типово: `npm`). Псевдонім: `--method`               |
| `--npm`                     | Скорочення для методу npm                                                       |
| `--git`, `--github`         | Скорочення для методу git                                                       |
| `--git-dir <path>`          | Каталог Git checkout (типово: `~/openclaw`). Псевдонім: `--dir`                 |
| `--version <ver>`           | Версія OpenClaw або dist-tag (типово: `latest`)                                 |
| `--node-version <ver>`      | Версія Node (типово: `22.22.0`)                                                 |
| `--json`                    | Виводити події NDJSON                                                           |
| `--onboard`                 | Запустити `openclaw onboard` після встановлення                                 |
| `--no-onboard`              | Пропустити онбординг (типово)                                                   |
| `--set-npm-prefix`          | На Linux примусово встановити префікс npm на `~/.npm-global`, якщо поточний префікс недоступний для запису |
| `--help`                    | Показати використання (`-h`)                                                    |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Variable                                    | Опис                                          |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Префікс установлення                          |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Метод установлення                            |
| `OPENCLAW_VERSION=<ver>`                    | Версія OpenClaw або dist-tag                  |
| `OPENCLAW_NODE_VERSION=<ver>`               | Версія Node                                   |
| `OPENCLAW_GIT_DIR=<path>`                   | Каталог checkout Git для встановлень через git |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Перемикач оновлень git для наявних checkout   |
| `OPENCLAW_NO_ONBOARD=1`                     | Пропустити початкове налаштування             |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Рівень журналювання npm                       |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Керування поведінкою sharp/libvips (за замовчуванням: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Послідовність (install.ps1)

<Steps>
  <Step title="Переконайтеся, що доступні PowerShell і середовище Windows">
    Потрібен PowerShell 5+.
  </Step>
  <Step title="За замовчуванням забезпечте Node.js 24">
    Якщо відсутній, виконується спроба встановлення через winget, потім Chocolatey, потім Scoop. Node 22 LTS, наразі `22.14+`, і далі підтримується для сумісності.
  </Step>
  <Step title="Установіть OpenClaw">
    - Метод `npm` (за замовчуванням): глобальне встановлення npm з використанням вибраного `-Tag`
    - Метод `git`: клонування/оновлення репозиторію, встановлення/збирання з pnpm і встановлення обгортки в `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Завдання після встановлення">
    - Додає потрібний bin-каталог до PATH користувача, коли це можливо
    - Оновлює завантажену службу gateway за принципом найкращого зусилля (`openclaw gateway install --force`, потім перезапуск)
    - Запускає `openclaw doctor --non-interactive` під час оновлень і встановлень через git (за принципом найкращого зусилля)

  </Step>
  <Step title="Обробка помилок">
    Установлення через `iwr ... | iex` і scriptblock повідомляють про завершальну помилку без закриття поточного сеансу PowerShell. Прямі встановлення через `powershell -File` / `pwsh -File` усе одно завершуються з ненульовим кодом для автоматизації.
  </Step>
</Steps>

### Приклади (install.ps1)

<Tabs>
  <Tab title="За замовчуванням">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Установлення через Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main через npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Власний каталог git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Пробний запуск">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Трасування налагодження">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник прапорців">

| Прапорець                   | Опис                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Метод установлення (за замовчуванням: `npm`)               |
| `-Tag <tag\|version\|spec>` | npm dist-tag, версія або специфікація пакета (за замовчуванням: `latest`) |
| `-GitDir <path>`            | Каталог checkout (за замовчуванням: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | Пропустити початкове налаштування                          |
| `-NoGitUpdate`              | Пропустити `git pull`                                      |
| `-DryRun`                   | Лише вивести дії                                           |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                             | Опис                         |
| ---------------------------------- | ---------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Метод установлення           |
| `OPENCLAW_GIT_DIR=<path>`          | Каталог checkout             |
| `OPENCLAW_NO_ONBOARD=1`            | Пропустити початкове налаштування |
| `OPENCLAW_GIT_UPDATE=0`            | Вимкнути git pull            |
| `OPENCLAW_DRY_RUN=1`               | Режим пробного запуску       |

  </Accordion>
</AccordionGroup>

<Note>
Якщо використовується `-InstallMethod git` і Git відсутній, скрипт завершується та виводить посилання на Git for Windows.
</Note>

---

## CI та автоматизація

Використовуйте неінтерактивні прапорці/змінні середовища для передбачуваних запусків.

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
  <Tab title="install.ps1 (пропустити початкове налаштування)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Чому потрібен Git?">
    Git потрібен для методу встановлення `git`. Для встановлень через `npm` Git усе одно перевіряється/встановлюється, щоб уникнути помилок `spawn git ENOENT`, коли залежності використовують git URL.
  </Accordion>

  <Accordion title="Чому npm отримує EACCES у Linux?">
    Деякі конфігурації Linux спрямовують глобальний префікс npm до шляхів, що належать root. `install.sh` може перемкнути префікс на `~/.npm-global` і додати експорти PATH до shell rc-файлів (коли такі файли існують).
  </Accordion>

  <Accordion title="Проблеми sharp/libvips">
    Скрипти за замовчуванням задають `SHARP_IGNORE_GLOBAL_LIBVIPS=1`, щоб sharp не збирався із системним libvips. Щоб перевизначити:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Установіть Git for Windows, повторно відкрийте PowerShell і знову запустіть інсталятор.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Запустіть `npm config get prefix` і додайте цей каталог до PATH користувача (у Windows суфікс `\bin` не потрібен), потім повторно відкрийте PowerShell.
  </Accordion>

  <Accordion title="Windows: як отримати докладний вивід інсталятора">
    `install.ps1` наразі не надає перемикач `-Verbose`.
    Використовуйте трасування PowerShell для діагностики на рівні скрипта:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw не знайдено після встановлення">
    Зазвичай це проблема PATH. Див. [усунення несправностей Node.js](/uk/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд установлення](/uk/install)
- [Оновлення](/uk/install/updating)
- [Видалення](/uk/install/uninstall)
