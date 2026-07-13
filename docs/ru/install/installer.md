---
read_when:
    - Вы хотите понять `openclaw.ai/install.sh`
    - Вы хотите автоматизировать установку (CI / без графического интерфейса)
    - Вы хотите установить из рабочей копии репозитория GitHub
summary: Как работают скрипты установки (install.sh, install-cli.sh, install.ps1), флаги и автоматизация
title: Внутреннее устройство установщика
x-i18n:
    generated_at: "2026-07-13T18:19:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 8bb0d92c20d05120b28804b73b115cb41bd2858de2cc83b341c79313a6b101ac
    source_path: install/installer.md
    workflow: 16
---

OpenClaw поставляется с тремя скриптами установки, доступными по адресу `openclaw.ai`.

| Скрипт                             | Платформа             | Назначение                                                                                   |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | При необходимости устанавливает Node, устанавливает OpenClaw через npm (по умолчанию) или git и может запустить первоначальную настройку.       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Устанавливает Node и OpenClaw в локальный префикс (`~/.openclaw`) через npm или git. Права root не требуются. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | При необходимости устанавливает Node, устанавливает OpenClaw через npm (по умолчанию) или git и может запустить первоначальную настройку.       |

Все три скрипта поддерживают Node **22.22.3+, 24.15+ или 25.9+**; для новых установок по умолчанию используется Node 24.

## Быстрые команды

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
Если установка завершилась успешно, но `openclaw` не находится в новом терминале, см. раздел [Устранение неполадок Node.js](/ru/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Рекомендуется для большинства интерактивных установок в macOS/Linux/WSL.
</Tip>

### Процесс (install.sh)

<Steps>
  <Step title="Определение ОС">
    Поддерживаются macOS и Linux (включая WSL).
  </Step>
  <Step title="Установка Node.js 24 по умолчанию">
    Проверяет версию Node и при необходимости устанавливает Node 24 (через Homebrew в macOS и скрипты настройки NodeSource для apt/dnf/yum в Linux). В macOS Homebrew устанавливается только тогда, когда он требуется установщику для Node или Git. Поддерживаются Node 22.22.3+, Node 24.15+ и Node 25.9+; Node 23 не поддерживается.
    В Alpine/musl Linux установщик использует пакеты apk вместо NodeSource и проверяет фактическую версию подключённой библиотеки SQLite. Текущие стабильные ветки пакетов Alpine могут предоставлять достаточно новую версию Node с уязвимой системной SQLite; в таком случае используйте официальный контейнер `node:24-alpine` или хост на основе glibc.
  </Step>
  <Step title="Установка Git">
    Если Git отсутствует, устанавливает его с помощью обнаруженного менеджера пакетов, включая Homebrew в macOS и apk в Alpine.
  </Step>
  <Step title="Установка OpenClaw">
    - Метод `npm` (по умолчанию): глобальная установка через npm
    - Метод `git`: клонирование или обновление репозитория, установка зависимостей через pnpm, сборка и последующая установка обёртки в `~/.local/bin/openclaw`

  </Step>
  <Step title="Задачи после установки">
    - Определяет путь к только что установленному исполняемому файлу `openclaw` для последующих команд
    - Для ненастроенной установки запускает первоначальную настройку до проверок doctor или Gateway. При использовании `--no-onboard` или отсутствии TTY выводит команду для завершения настройки позднее.
    - Для настроенной установки по возможности обновляет и перезапускает загруженную службу Gateway, а затем запускает doctor. При обновлении по возможности обновляет плагины либо выводит команду для ручного выполнения при запуске без интерфейса, но с включёнными запросами.
    - При запуске `--verify` проверяет установленную версию, а состояние Gateway — только при наличии конфигурации.

  </Step>
</Steps>

### Обнаружение исходного рабочего дерева

При запуске внутри рабочего дерева OpenClaw (`package.json` + `pnpm-workspace.yaml`) скрипт предлагает:

- использовать рабочее дерево (`git`) или
- использовать глобальную установку (`npm`)

Если TTY недоступен и метод установки не задан, по умолчанию используется `npm` и выводится предупреждение.

Скрипт завершается с кодом `2`, если выбран недопустимый метод или указано недопустимое значение `--install-method`.

### Примеры (install.sh)

<Tabs>
  <Tab title="По умолчанию">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Пропустить первоначальную настройку">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Установка через Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Рабочее дерево main с GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Пробный запуск">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Проверка после установки">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Справочник флагов">

| Флаг                                    | Описание                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Выбор метода установки (по умолчанию: `npm`)                                  |
| `--npm`                                 | Сокращённый вариант выбора метода npm                                                 |
| `--git \| --github`                     | Сокращённый вариант выбора метода git                                                 |
| `--version <version\|dist-tag\|spec>`   | Версия npm, тег дистрибутива или спецификация пакета (по умолчанию: `latest`)              |
| `--beta`                                | Использовать тег дистрибутива beta, если он доступен, иначе вернуться к `latest`              |
| `--git-dir \| --dir <path>`             | Каталог рабочего дерева (по умолчанию: `~/openclaw`)                              |
| `--no-git-update`                       | Пропустить `git pull` для существующего рабочего дерева                                   |
| `--no-prompt`                           | Отключить запросы                                                         |
| `--no-onboard`                          | Пропустить первоначальную настройку                                                         |
| `--onboard`                             | Включить первоначальную настройку                                                       |
| `--verify`                              | Выполнить быструю проверку после установки (`--version`, а также состояние Gateway, если он загружен) |
| `--dry-run`                             | Вывести действия без применения изменений                                  |
| `--verbose`                             | Включить отладочный вывод (`set -x`, журналы npm уровня notice)                   |
| `--help \| -h`                          | Показать справку                                                              |

  </Accordion>

  <Accordion title="Справочник переменных окружения">

| Переменная                                          | Описание                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Метод установки                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | Версия npm, тег дистрибутива или спецификация пакета                             |
| `OPENCLAW_BETA=0\|1`                              | Использовать beta, если доступна                                              |
| `OPENCLAW_HOME=<path>`                            | Базовый каталог для состояния OpenClaw и путей git/первоначальной настройки по умолчанию |
| `OPENCLAW_GIT_DIR=<path>`                         | Каталог рабочего дерева                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Включение или отключение обновлений git                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | Отключить запросы                                                    |
| `OPENCLAW_VERIFY_INSTALL=1`                       | Выполнить быструю проверку после установки                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | Пропустить первоначальную настройку                                                    |
| `OPENCLAW_DRY_RUN=1`                              | Режим пробного запуска                                                       |
| `OPENCLAW_VERBOSE=1`                              | Режим отладки                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | Уровень журналирования npm (по умолчанию: `error`, скрывает сообщения npm об устаревании)      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Предназначен для сред, где всё должно находиться под локальным префиксом
(по умолчанию `~/.openclaw`) без зависимости от системной установки Node. По умолчанию поддерживает установку
через npm, а также установку из рабочего дерева git в рамках того же процесса с префиксом.
</Info>

### Процесс (install-cli.sh)

<Steps>
  <Step title="Установка локальной среды выполнения Node">
    Загружает архив tar закреплённой поддерживаемой версии Node LTS (версия встроена в скрипт и обновляется независимо, по умолчанию `24.15.0`) в `<prefix>/tools/node-v<version>` и проверяет SHA-256.
    В Linux ARMv7 используется Node `22.22.3`, поскольку официальные двоичные файлы Node 24+ для ARMv7 недоступны.
    В Alpine/musl Linux, для которой Node не публикует совместимые архивы tar закреплённой версии среды выполнения, устанавливает `nodejs` и `npm` с помощью `apk`, а затем проверяет как Node, так и фактически подключённую библиотеку SQLite. Текущие стабильные ветки пакетов Alpine могут по-прежнему подключать уязвимую SQLite даже при достаточно новой версии Node; если проверка безопасности отклоняет пакет, используйте официальный контейнер `node:24-alpine` или хост на основе glibc.
  </Step>
  <Step title="Установка Git">
    Если Git отсутствует, пытается установить его через apt/dnf/yum/apk в Linux или Homebrew в macOS.
  </Step>
  <Step title="Установка OpenClaw под префиксом">
    - Метод `npm` (по умолчанию): устанавливает через npm под префиксом, затем записывает обёртку в `<prefix>/bin/openclaw`
    - Метод `git`: клонирует или обновляет рабочее дерево (по умолчанию `~/openclaw`) и также записывает обёртку в `<prefix>/bin/openclaw`

  </Step>
  <Step title="Обновление загруженной службы Gateway">
    Если служба Gateway уже загружена из того же префикса, скрипт выполняет
    `openclaw gateway install --force`, затем `openclaw gateway restart` и
    по возможности проверяет состояние Gateway.
  </Step>
</Steps>

### Примеры (install-cli.sh)

<Tabs>
  <Tab title="По умолчанию">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Пользовательский префикс и версия">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Установка через Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Вывод JSON для автоматизации">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Запуск первоначальной настройки">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Справочник флагов">

| Флаг                                    | Описание                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Префикс установки (по умолчанию: `~/.openclaw`)                                         |
| `--install-method \| --method npm\|git` | Выбор способа установки (по умолчанию: `npm`)                                          |
| `--npm`                                 | Сокращённый вариант для способа npm                                                         |
| `--git \| --github`                     | Сокращённый вариант для способа git                                                         |
| `--git-dir \| --dir <path>`             | Каталог рабочей копии Git (по умолчанию: `~/openclaw`)                                  |
| `--version <ver>`                       | Версия или dist-tag OpenClaw (по умолчанию: `latest`)                                |
| `--node-version <ver>`                  | Версия Node (по умолчанию: `24.15.0`; `22.22.3` в Linux ARMv7)                     |
| `--json`                                | Вывод событий NDJSON                                                              |
| `--onboard`                             | Запуск `openclaw onboard` после установки                                            |
| `--no-onboard`                          | Пропуск первоначальной настройки (по умолчанию)                                                       |
| `--set-npm-prefix`                      | В Linux принудительно задать префикс npm равным `~/.npm-global`, если текущий префикс недоступен для записи |
| `--help \| -h`                          | Показать справку по использованию                                                                      |

  </Accordion>

  <Accordion title="Справочник переменных окружения">

| Переменная                                    | Описание                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Префикс установки                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Способ установки                                                     |
| `OPENCLAW_VERSION=<ver>`                    | Версия или dist-tag OpenClaw                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Версия Node                                                       |
| `OPENCLAW_HOME=<path>`                      | Базовый каталог для состояния OpenClaw и путей git/первоначальной настройки по умолчанию |
| `OPENCLAW_GIT_DIR=<path>`                   | Каталог рабочей копии Git для установок через git                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Включение или отключение обновлений git для существующих рабочих копий                          |
| `OPENCLAW_NO_ONBOARD=1`                     | Пропуск первоначальной настройки                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Уровень журналирования npm (по умолчанию: `error`)                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` и другие спецификации исходного кода GitHub не являются допустимыми целями `--version` для установок через npm. Вместо них используйте `--install-method git --version main`.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Последовательность работы (install.ps1)

<Steps>
  <Step title="Проверка PowerShell и среды Windows">
    Требуется PowerShell 5+.
  </Step>
  <Step title="Проверка наличия Node.js 24 по умолчанию">
    Если Node.js отсутствует, предпринимается попытка установки через winget, затем Chocolatey, затем Scoop. Если ни один менеджер пакетов недоступен, скрипт загружает официальный zip-архив Node.js 24 для Windows в `%LOCALAPPDATA%\OpenClaw\deps\portable-node` и добавляет его в PATH текущего процесса и пользователя. Поддерживаются Node 22.22.3+, Node 24.15+ и Node 25.9+; Node 23 не поддерживается.
  </Step>
  <Step title="Установка OpenClaw">
    - Способ `npm` (по умолчанию): глобальная установка npm с использованием выбранного `-Tag`, запускаемая из доступного для записи временного каталога установщика, чтобы оболочки, открытые в защищённых каталогах, таких как `C:\`, продолжали работать
    - Способ `git`: клонирование или обновление репозитория, установка и сборка с помощью pnpm, а также установка обёртки в `%USERPROFILE%\.local\bin\openclaw.cmd`. Если Git отсутствует, скрипт развёртывает пользовательскую локальную копию MinGit в `%LOCALAPPDATA%\OpenClaw\deps\portable-git` и добавляет её в PATH текущего процесса и пользователя.

  </Step>
  <Step title="Задачи после установки">
    - По возможности добавляет необходимый каталог исполняемых файлов в пользовательский PATH
    - По возможности обновляет загруженную службу Gateway (`openclaw gateway install --force`, затем перезапуск)
    - Запускает `openclaw doctor --non-interactive` при обновлениях и установках через git (по возможности)

  </Step>
  <Step title="Обработка сбоев">
    Установки через `iwr ... | iex` и блок скрипта сообщают о завершающей ошибке, не закрывая текущий сеанс PowerShell. Прямые установки через `powershell -File` / `pwsh -File` по-прежнему завершаются с ненулевым кодом для автоматизации.
  </Step>
</Steps>

### Примеры (install.ps1)

<Tabs>
  <Tab title="По умолчанию">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Установка через Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="Рабочая копия основной ветки GitHub">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="Пользовательский каталог git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Пробный запуск">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Справочник флагов">

| Флаг                        | Описание                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Способ установки (по умолчанию: `npm`)                            |
| `-Tag <tag\|version\|spec>` | dist-tag, версия или спецификация пакета npm (по умолчанию: `latest`) |
| `-GitDir <path>`            | Каталог рабочей копии (по умолчанию: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | Пропуск первоначальной настройки                                            |
| `-NoGitUpdate`              | Пропуск `git pull`                                            |
| `-DryRun`                   | Только вывести действия                                         |

  </Accordion>

  <Accordion title="Справочник переменных окружения">

| Переменная                           | Описание        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Способ установки     |
| `OPENCLAW_GIT_DIR=<path>`          | Каталог рабочей копии |
| `OPENCLAW_NO_ONBOARD=1`            | Пропуск первоначальной настройки    |
| `OPENCLAW_GIT_UPDATE=0`            | Отключение git pull   |
| `OPENCLAW_DRY_RUN=1`               | Режим пробного запуска       |

  </Accordion>
</AccordionGroup>

<Note>
Если используется `-InstallMethod git`, а Git отсутствует, скрипт пытается сначала развернуть пользовательскую локальную копию MinGit, а затем выводит ссылку на Git for Windows.
</Note>

---

## CI и автоматизация

Для предсказуемого выполнения используйте неинтерактивные флаги и переменные окружения.

<Tabs>
  <Tab title="install.sh (неинтерактивный npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (неинтерактивный git)">
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
  <Tab title="install.ps1 (пропуск первоначальной настройки)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Почему требуется Git?">
    Git необходим для способа установки `git`. При установках через `npm` наличие Git также проверяется и при необходимости он устанавливается, чтобы избежать сбоев `spawn git ENOENT`, когда зависимости используют URL-адреса git.
  </Accordion>

  <Accordion title="Почему npm выдаёт EACCES в Linux?">
    В некоторых конфигурациях Linux глобальный префикс npm указывает на пути, принадлежащие пользователю root. `install.sh` может изменить префикс на `~/.npm-global` и добавить команды экспорта PATH в rc-файлы оболочки (если эти файлы существуют).
  </Accordion>

  <Accordion title='Windows: «npm error spawn git / ENOENT»'>
    Повторно запустите установщик, чтобы он мог развернуть пользовательскую локальную копию MinGit, либо установите Git for Windows и заново откройте PowerShell.
  </Accordion>

  <Accordion title='Windows: «openclaw is not recognized»'>
    Выполните `npm config get prefix` и добавьте этот каталог в пользовательский PATH (в Windows суффикс `\bin` не требуется), затем заново откройте PowerShell.
  </Accordion>

  <Accordion title="Windows: как получить подробный вывод установщика">
    `install.ps1` не предоставляет переключатель `-Verbose`.
    Для диагностики на уровне скрипта используйте трассировку PowerShell:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw не найден после установки">
    Обычно это проблема с PATH. См. раздел [Устранение неполадок Node.js](/ru/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Связанные материалы

- [Обзор установки](/ru/install)
- [Обновление](/ru/install/updating)
- [Удаление](/ru/install/uninstall)
