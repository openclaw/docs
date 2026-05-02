---
read_when:
    - Ви хочете зрозуміти `openclaw.ai/install.sh`
    - Ви хочете автоматизувати встановлення (CI / без інтерфейсу)
    - Ви хочете встановити з робочої копії GitHub
summary: Як працюють сценарії інсталятора (install.sh, install-cli.sh, install.ps1), прапорці й автоматизація
title: Внутрішня реалізація інсталятора
x-i18n:
    generated_at: "2026-05-02T05:00:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 119d94edae8cae2460e1bce9fe6bb31dc3c91d23443090cd34bf10adde9e10f1
    source_path: install/installer.md
    workflow: 16
---

OpenClaw постачається з трьома скриптами встановлення, які подаються з `openclaw.ai`.

| Скрипт                            | Платформа            | Що він робить                                                                                                             |
| --------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)        | macOS / Linux / WSL  | За потреби встановлює Node, встановлює OpenClaw через npm (типово) або git і може запустити початкове налаштування.      |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Встановлює Node + OpenClaw у локальний префікс (`~/.openclaw`) у режимах npm або git checkout. root не потрібен.         |
| [`install.ps1`](#installps1)      | Windows (PowerShell) | За потреби встановлює Node, встановлює OpenClaw через npm (типово) або git і може запустити початкове налаштування.      |

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
Якщо встановлення завершилося успішно, але `openclaw` не знайдено в новому терміналі, див. [усунення неполадок Node.js](/uk/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Рекомендовано для більшості інтерактивних встановлень на macOS/Linux/WSL.
</Tip>

### Потік (install.sh)

<Steps>
  <Step title="Виявлення ОС">
    Підтримує macOS і Linux (зокрема WSL). Якщо виявлено macOS, встановлює Homebrew, якщо його немає.
  </Step>
  <Step title="Забезпечення Node.js 24 типово">
    Перевіряє версію Node і за потреби встановлює Node 24 (Homebrew на macOS, скрипти налаштування NodeSource на Linux apt/dnf/yum). OpenClaw і далі підтримує Node 22 LTS, наразі `22.14+`, для сумісності.
  </Step>
  <Step title="Забезпечення Git">
    Встановлює Git, якщо його немає.
  </Step>
  <Step title="Встановлення OpenClaw">
    - метод `npm` (типово): глобальне встановлення npm
    - метод `git`: клонувати/оновити репозиторій, встановити залежності через pnpm, зібрати, а потім встановити обгортку в `~/.local/bin/openclaw`

  </Step>
  <Step title="Завдання після встановлення">
    - Оновлює завантажений сервіс gateway у режимі найкращої спроби (`openclaw gateway install --force`, потім перезапуск)
    - Запускає `openclaw doctor --non-interactive` під час оновлень і git-встановлень (найкраща спроба)
    - Намагається виконати початкове налаштування, коли це доречно (TTY доступний, початкове налаштування не вимкнено, а перевірки bootstrap/config проходять)
    - Типово встановлює `SHARP_IGNORE_GLOBAL_LIBVIPS=1`

  </Step>
</Steps>

### Виявлення checkout вихідного коду

Якщо запущено всередині checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), скрипт пропонує:

- використати checkout (`git`), або
- використати глобальне встановлення (`npm`)

Якщо TTY недоступний і метод встановлення не задано, він типово використовує `npm` і виводить попередження.

Скрипт завершується з кодом `2` у разі недійсного вибору методу або недійсних значень `--install-method`.

### Приклади (install.sh)

<Tabs>
  <Tab title="Типово">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Пропустити початкове налаштування">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git-встановлення">
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

| Прапорець                             | Опис                                                          |
| ------------------------------------- | ------------------------------------------------------------- |
| `--install-method npm\|git`           | Вибрати метод встановлення (типово: `npm`). Псевдонім: `--method` |
| `--npm`                               | Скорочення для методу npm                                     |
| `--git`                               | Скорочення для методу git. Псевдонім: `--github`              |
| `--version <version\|dist-tag\|spec>` | Версія npm, dist-tag або специфікація пакета (типово: `latest`) |
| `--beta`                              | Використати beta dist-tag, якщо доступний, інакше повернутися до `latest` |
| `--git-dir <path>`                    | Каталог checkout (типово: `~/openclaw`). Псевдонім: `--dir`   |
| `--no-git-update`                     | Пропустити `git pull` для наявного checkout                   |
| `--no-prompt`                         | Вимкнути запити                                               |
| `--no-onboard`                        | Пропустити початкове налаштування                             |
| `--onboard`                           | Увімкнути початкове налаштування                              |
| `--dry-run`                           | Вивести дії без застосування змін                             |
| `--verbose`                           | Увімкнути діагностичний вивід (`set -x`, журнали npm рівня notice) |
| `--help`                              | Показати використання (`-h`)                                  |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                                                 | Опис                                               |
| ------------------------------------------------------ | -------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                     | Метод встановлення                                 |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Версія npm, dist-tag або специфікація пакета       |
| `OPENCLAW_BETA=0\|1`                                   | Використати beta, якщо доступна                    |
| `OPENCLAW_GIT_DIR=<path>`                              | Каталог checkout                                   |
| `OPENCLAW_GIT_UPDATE=0\|1`                             | Перемкнути оновлення git                           |
| `OPENCLAW_NO_PROMPT=1`                                 | Вимкнути запити                                    |
| `OPENCLAW_NO_ONBOARD=1`                                | Пропустити початкове налаштування                  |
| `OPENCLAW_DRY_RUN=1`                                   | Режим пробного запуску                             |
| `OPENCLAW_VERBOSE=1`                                   | Режим діагностики                                  |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`            | Рівень журналювання npm                            |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                     | Керування поведінкою sharp/libvips (типово: `1`)   |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Призначено для середовищ, де потрібно розмістити все під локальним префіксом
(типово `~/.openclaw`) і не мати системної залежності Node. Типово підтримує npm-встановлення,
а також git-checkout-встановлення в тому самому потоці префікса.
</Info>

### Потік (install-cli.sh)

<Steps>
  <Step title="Встановлення локального середовища виконання Node">
    Завантажує закріплений підтримуваний tarball Node LTS (версія вбудована в скрипт і оновлюється незалежно) до `<prefix>/tools/node-v<version>` і перевіряє SHA-256.
  </Step>
  <Step title="Забезпечення Git">
    Якщо Git відсутній, намагається встановити його через apt/dnf/yum на Linux або Homebrew на macOS.
  </Step>
  <Step title="Встановлення OpenClaw під префіксом">
    - метод `npm` (типово): встановлює під префіксом через npm, потім записує обгортку до `<prefix>/bin/openclaw`
    - метод `git`: клонує/оновлює checkout (типово `~/openclaw`) і все одно записує обгортку до `<prefix>/bin/openclaw`

  </Step>
  <Step title="Оновлення завантаженого сервісу gateway">
    Якщо сервіс gateway уже завантажено з того самого префікса, скрипт запускає
    `openclaw gateway install --force`, потім `openclaw gateway restart` і
    перевіряє стан gateway у режимі найкращої спроби.
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
  <Tab title="Git-встановлення">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="JSON-вивід для автоматизації">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Запустити початкове налаштування">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник прапорців">

| Прапорець                   | Опис                                                                          |
| --------------------------- | ----------------------------------------------------------------------------- |
| `--prefix <path>`           | Префікс встановлення (типово: `~/.openclaw`)                                  |
| `--install-method npm\|git` | Вибрати метод встановлення (типово: `npm`). Псевдонім: `--method`             |
| `--npm`                     | Скорочення для методу npm                                                     |
| `--git`, `--github`         | Скорочення для методу git                                                     |
| `--git-dir <path>`          | Каталог Git checkout (типово: `~/openclaw`). Псевдонім: `--dir`               |
| `--version <ver>`           | Версія OpenClaw або dist-tag (типово: `latest`)                               |
| `--node-version <ver>`      | Версія Node (типово: `22.22.0`)                                               |
| `--json`                    | Виводити події NDJSON                                                         |
| `--onboard`                 | Запустити `openclaw onboard` після встановлення                               |
| `--no-onboard`              | Пропустити початкове налаштування (типово)                                    |
| `--set-npm-prefix`          | На Linux примусово встановити префікс npm на `~/.npm-global`, якщо поточний префікс недоступний для запису |
| `--help`                    | Показати використання (`-h`)                                                  |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                                      | Опис                                          |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Префікс встановлення                          |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Спосіб встановлення                           |
| `OPENCLAW_VERSION=<ver>`                    | Версія OpenClaw або dist-tag                  |
| `OPENCLAW_NODE_VERSION=<ver>`               | Версія Node                                   |
| `OPENCLAW_GIT_DIR=<path>`                   | Каталог Git checkout для встановлень через git |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Перемикач оновлень git для наявних checkout   |
| `OPENCLAW_NO_ONBOARD=1`                     | Пропустити onboarding                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Рівень журналювання npm                       |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | Керування поведінкою sharp/libvips (типово: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Потік (install.ps1)

<Steps>
  <Step title="Ensure PowerShell + Windows environment">
    Потрібен PowerShell 5+.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Якщо відсутній, намагається встановити через winget, потім Chocolatey, потім Scoop. Node 22 LTS, наразі `22.14+`, залишається підтримуваним для сумісності.
  </Step>
  <Step title="Install OpenClaw">
    - Спосіб `npm` (типово): глобальне встановлення npm з вибраним `-Tag`, запущене з доступного для запису тимчасового каталогу інсталятора, щоб оболонки, відкриті в захищених папках, як-от `C:\`, усе одно працювали
    - Спосіб `git`: клонувати/оновити репозиторій, встановити/зібрати за допомогою pnpm і встановити wrapper у `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Post-install tasks">
    - Додає потрібний bin-каталог до PATH користувача, коли це можливо
    - Оновлює завантажену службу Gateway у режимі best-effort (`openclaw gateway install --force`, потім restart)
    - Запускає `openclaw doctor --non-interactive` під час оновлень і встановлень через git (best effort)

  </Step>
  <Step title="Handle failures">
    `iwr ... | iex` і встановлення через scriptblock повідомляють про критичну помилку без закриття поточного сеансу PowerShell. Прямі встановлення `powershell -File` / `pwsh -File` усе ще завершуються з ненульовим кодом для автоматизації.
  </Step>
</Steps>

### Приклади (install.ps1)

<Tabs>
  <Tab title="Default">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git install">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Custom git directory">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Dry run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debug trace">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Прапорець                   | Опис                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Спосіб встановлення (типово: `npm`)                        |
| `-Tag <tag\|version\|spec>` | npm dist-tag, версія або package spec (типово: `latest`)   |
| `-GitDir <path>`            | Каталог checkout (типово: `%USERPROFILE%\openclaw`)        |
| `-NoOnboard`                | Пропустити onboarding                                      |
| `-NoGitUpdate`              | Пропустити `git pull`                                      |
| `-DryRun`                   | Лише вивести дії                                           |

  </Accordion>

  <Accordion title="Environment variables reference">

| Змінна                             | Опис                         |
| ---------------------------------- | ---------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Спосіб встановлення          |
| `OPENCLAW_GIT_DIR=<path>`          | Каталог checkout             |
| `OPENCLAW_NO_ONBOARD=1`            | Пропустити onboarding        |
| `OPENCLAW_GIT_UPDATE=0`            | Вимкнути git pull            |
| `OPENCLAW_DRY_RUN=1`               | Режим dry run                |

  </Accordion>
</AccordionGroup>

<Note>
Якщо використано `-InstallMethod git` і Git відсутній, скрипт завершується та виводить посилання Git for Windows.
</Note>

---

## CI та автоматизація

Використовуйте неінтерактивні прапорці/env vars для передбачуваних запусків.

<Tabs>
  <Tab title="install.sh (non-interactive npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (non-interactive git)">
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
  <Tab title="install.ps1 (skip onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Why is Git required?">
    Git потрібен для способу встановлення `git`. Для встановлень через `npm` Git усе одно перевіряється/встановлюється, щоб уникнути помилок `spawn git ENOENT`, коли залежності використовують git URL.
  </Accordion>

  <Accordion title="Why does npm hit EACCES on Linux?">
    Деякі конфігурації Linux спрямовують глобальний префікс npm на шляхи, що належать root. `install.sh` може перемкнути префікс на `~/.npm-global` і додати експорти PATH до shell rc-файлів (коли ці файли існують).
  </Accordion>

  <Accordion title="sharp/libvips issues">
    Скрипти типово встановлюють `SHARP_IGNORE_GLOBAL_LIBVIPS=1`, щоб уникнути збирання sharp із системним libvips. Щоб перевизначити:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Встановіть Git for Windows, знову відкрийте PowerShell і повторно запустіть інсталятор.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Виконайте `npm config get prefix` і додайте цей каталог до PATH користувача (суфікс `\bin` у Windows не потрібен), потім знову відкрийте PowerShell.
  </Accordion>

  <Accordion title="Windows: how to get verbose installer output">
    `install.ps1` наразі не надає перемикач `-Verbose`.
    Використовуйте трасування PowerShell для діагностики на рівні скрипта:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw not found after install">
    Зазвичай це проблема PATH. Див. [усунення несправностей Node.js](/uk/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Оновлення](/uk/install/updating)
- [Видалення](/uk/install/uninstall)
