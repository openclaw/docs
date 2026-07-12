---
read_when:
    - Перед установкой OpenClaw необходимо установить Node.js
    - Вы установили OpenClaw, но команда `openclaw` не найдена
    - Сбой `npm install -g` из-за проблем с разрешениями или `PATH`
summary: 'Установка и настройка Node.js для OpenClaw: требования к версии, варианты установки и устранение неполадок с PATH'
title: Node.js
x-i18n:
    generated_at: "2026-07-12T11:29:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410686b714fe2830a0c6d77a52850eab5720a97747b9579bd730808db23a9dda
    source_path: install/node.md
    workflow: 16
---

Для OpenClaw требуется **Node 22.19+, Node 23.11+ или Node 24+**. **Node 24 — среда выполнения по умолчанию и рекомендуемый вариант** для установки, CI и процессов выпуска; Node 22 по-прежнему поддерживается в рамках активной ветки LTS. [Скрипт установки](/ru/install#alternative-install-methods) автоматически обнаруживает и устанавливает Node — используйте эту страницу, если хотите настроить Node самостоятельно (версии, PATH, глобальные установки).

## Проверка версии

```bash
node -v
```

Рекомендуемый вариант по умолчанию — `v24.x.x` или более поздняя версия. Для поддерживаемой ветки Node 22 LTS требуется `v22.19.x` или более поздняя версия (при удобном случае обновитесь до Node 24). Сборки Node 23 до `v23.11.0` не поддерживаются. Если Node отсутствует или его версия находится вне поддерживаемого диапазона, выберите один из способов установки ниже.

## Установка Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (рекомендуется):

    ```bash
    brew install node
    ```

    Либо загрузите установщик для macOS с сайта [nodejs.org](https://nodejs.org/).

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

    Либо используйте менеджер версий (см. ниже).

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

    Либо загрузите установщик для Windows с сайта [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Использование менеджера версий (nvm, fnm, mise, asdf)">
  Менеджеры версий позволяют легко переключаться между версиями Node. Популярные варианты:

- [**fnm**](https://github.com/Schniz/fnm) — быстрый и кроссплатформенный
- [**nvm**](https://github.com/nvm-sh/nvm) — широко используется в macOS и Linux
- [**mise**](https://mise.jdx.dev/) — поддерживает множество языков (Node, Python, Ruby и другие)

Пример с fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Инициализируйте менеджер версий в файле запуска командной оболочки (`~/.zshrc` или `~/.bashrc`). Если пропустить этот шаг, команда `openclaw` может быть недоступна в новых сеансах терминала, поскольку PATH не будет содержать каталог исполняемых файлов Node.
  </Warning>
</Accordion>

## Устранение неполадок

### `openclaw: command not found`

Почти всегда это означает, что глобальный каталог исполняемых файлов npm отсутствует в PATH.

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

    Найдите в выводе `<npm-prefix>/bin` (macOS/Linux) или `<npm-prefix>` (Windows).

  </Step>
  <Step title="Добавьте его в файл запуска командной оболочки">
    <Tabs>
      <Tab title="macOS / Linux">
        Добавьте в `~/.zshrc` или `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Затем откройте новый терминал (либо выполните `rehash` в zsh или `hash -r` в bash).
      </Tab>
      <Tab title="Windows">
        Добавьте результат команды `npm prefix -g` в системную переменную PATH через Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Ошибки прав доступа при выполнении `npm install -g` (Linux)

Если возникают ошибки `EACCES`, измените глобальный префикс npm на каталог, доступный пользователю для записи:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Чтобы изменение сохранялось постоянно, добавьте строку `export PATH=...` в файл `~/.bashrc` или `~/.zshrc`.

## Связанные материалы

- [Обзор установки](/ru/install) — все способы установки
- [Обновление](/ru/install/updating) — поддержание OpenClaw в актуальном состоянии
- [Начало работы](/ru/start/getting-started) — первые шаги после установки
