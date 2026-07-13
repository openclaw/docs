---
read_when:
    - Перед установкой OpenClaw необходимо установить Node.js
    - Вы установили OpenClaw, но при запуске `openclaw` появляется ошибка «command not found»
    - Сбой `npm install -g` из-за проблем с разрешениями или `PATH`
summary: 'Установка и настройка Node.js для OpenClaw: требования к версии, варианты установки и устранение неполадок с PATH'
title: Node.js
x-i18n:
    generated_at: "2026-07-13T19:53:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: ef4df255c24a11a549c757b597a07b00852e60973a5e513bdcf60796037a462a
    source_path: install/node.md
    workflow: 16
---

OpenClaw требует **Node 22.22.3+, Node 24.15+ или Node 25.9+**. **Node 24 — среда выполнения по умолчанию и рекомендуемая среда** для установки, CI и процессов выпуска; Node 22 по-прежнему поддерживается в рамках активной ветки LTS. Node 23 не поддерживается. [Скрипт установки](/ru/install#alternative-install-methods) автоматически обнаруживает и устанавливает Node — используйте эту страницу, если хотите настроить Node самостоятельно (версии, PATH, глобальные установки).

## Проверка версии

```bash
node -v
```

`v24.15.0` или более новая версия 24.x рекомендуется по умолчанию. `v22.22.3` или более новая версия 22.x поддерживается в рамках ветки Node 22 LTS; Node `v25.9.0+` также поддерживается. Node 23 не поддерживается. Если Node отсутствует или его версия находится вне поддерживаемого диапазона, выберите один из способов установки ниже.

## Установка Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (рекомендуется):

    ```bash
    brew install node
    ```

    Или скачайте установщик для macOS с сайта [nodejs.org](https://nodejs.org/).

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    Или используйте менеджер версий (см. ниже).

  </Tab>
  <Tab title="Windows">
    **winget** (рекомендуется):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Или скачайте установщик для Windows с сайта [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Использование менеджера версий (nvm, fnm, mise, asdf)">
  Менеджеры версий позволяют легко переключаться между версиями Node. Популярные варианты:

- [**fnm**](https://github.com/Schniz/fnm) — быстрый, кроссплатформенный
- [**nvm**](https://github.com/nvm-sh/nvm) — широко используется в macOS/Linux
- [**mise**](https://mise.jdx.dev/) — поддерживает несколько языков (Node, Python, Ruby и т. д.)

Пример с fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Инициализируйте менеджер версий в файле запуска командной оболочки (`~/.zshrc` или `~/.bashrc`). Если пропустить этот шаг, команда `openclaw` может быть недоступна в новых сеансах терминала, поскольку PATH не будет содержать каталог bin Node.
  </Warning>
</Accordion>

## Устранение неполадок

### `openclaw: command not found`

Это почти всегда означает, что глобальный каталог bin npm отсутствует в PATH.

<Steps>
  <Step title="Определите глобальный префикс npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Проверьте, присутствует ли он в PATH">
    ```bash
    echo "$PATH"
    ```

    Найдите `<npm-prefix>/bin` (macOS/Linux) или `<npm-prefix>` (Windows) в выводе.

  </Step>
  <Step title="Добавьте его в файл запуска командной оболочки">
    <Tabs>
      <Tab title="macOS / Linux">
        Добавьте в `~/.zshrc` или `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Затем откройте новый терминал (или выполните `rehash` в zsh / `hash -r` в bash).
      </Tab>
      <Tab title="Windows">
        Добавьте вывод `npm prefix -g` в системную переменную PATH через Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Ошибки прав доступа при `npm install -g` (Linux)

Если возникают ошибки `EACCES`, измените глобальный префикс npm на каталог, доступный пользователю для записи:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Добавьте строку `export PATH=...` в `~/.bashrc` или `~/.zshrc`, чтобы сохранить настройку.

## См. также

- [Обзор установки](/ru/install) — все способы установки
- [Обновление](/ru/install/updating) — поддержание OpenClaw в актуальном состоянии
- [Начало работы](/ru/start/getting-started) — первые шаги после установки
