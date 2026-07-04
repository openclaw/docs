---
read_when:
    - Вам потрібно встановити Node.js перед встановленням OpenClaw
    - 'Ви встановили OpenClaw, але `openclaw`: команду не знайдено'
    - npm install -g завершується помилкою через проблеми з дозволами або PATH
summary: Установлення та налаштування Node.js для OpenClaw — вимоги до версії, варіанти встановлення та усунення несправностей PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-04T11:00:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c556593982efa7f6fcd6e24787cca7ca6af30d265f54bb927a0608d2efc58d6
    source_path: install/node.md
    workflow: 16
---

OpenClaw потребує **Node 22.19+, Node 23.11+ або Node 24+**. **Node 24 є типовим і рекомендованим середовищем виконання** для встановлень, CI та робочих процесів релізу. Node 22 залишається підтримуваним через активну гілку LTS. [Скрипт встановлення](/uk/install#alternative-install-methods) автоматично виявить і встановить Node - ця сторінка для випадків, коли ви хочете налаштувати Node самостійно й переконатися, що все правильно підключено (версії, PATH, глобальні встановлення).

## Перевірте свою версію

```bash
node -v
```

Якщо це виводить `v24.x.x` або вище, ви використовуєте рекомендований типовий варіант. Якщо це виводить `v22.19.x` або вище, ви використовуєте підтримуваний шлях Node 22 LTS, але ми все одно рекомендуємо перейти на Node 24, коли буде зручно. Версії Node 23 до `v23.11.0` не підтримуються. Якщо Node не встановлено або версія поза підтримуваним діапазоном, виберіть спосіб встановлення нижче.

## Установіть Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (рекомендовано):

    ```bash
    brew install node
    ```

    Або завантажте інсталятор macOS з [nodejs.org](https://nodejs.org/).

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

    Або скористайтеся менеджером версій (див. нижче).

  </Tab>
  <Tab title="Windows">
    **winget** (рекомендовано):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Або завантажте інсталятор Windows з [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Використання менеджера версій (nvm, fnm, mise, asdf)">
  Менеджери версій дають змогу легко перемикатися між версіями Node. Популярні варіанти:

- [**fnm**](https://github.com/Schniz/fnm) - швидкий, кросплатформний
- [**nvm**](https://github.com/nvm-sh/nvm) - широко використовується на macOS/Linux
- [**mise**](https://mise.jdx.dev/) - багатомовний (Node, Python, Ruby тощо)

Приклад з fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Переконайтеся, що ваш менеджер версій ініціалізовано у файлі запуску оболонки (`~/.zshrc` або `~/.bashrc`). Якщо ні, `openclaw` може не знаходитися в нових сеансах термінала, оскільки PATH не міститиме bin-каталог Node.
  </Warning>
</Accordion>

## Усунення несправностей

### `openclaw: command not found`

Це майже завжди означає, що глобальний bin-каталог npm не додано до вашого PATH.

<Steps>
  <Step title="Знайдіть свій глобальний префікс npm">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Перевірте, чи він є у вашому PATH">
    ```bash
    echo "$PATH"
    ```

    Знайдіть `<npm-prefix>/bin` (macOS/Linux) або `<npm-prefix>` (Windows) у виводі.

  </Step>
  <Step title="Додайте його до файлу запуску оболонки">
    <Tabs>
      <Tab title="macOS / Linux">
        Додайте до `~/.zshrc` або `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Потім відкрийте новий термінал (або виконайте `rehash` у zsh / `hash -r` у bash).
      </Tab>
      <Tab title="Windows">
        Додайте вивід `npm prefix -g` до системного PATH через Налаштування → Система → Змінні середовища.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Помилки дозволів під час `npm install -g` (Linux)

Якщо ви бачите помилки `EACCES`, перемкніть глобальний префікс npm на каталог, доступний користувачу для запису:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Додайте рядок `export PATH=...` до вашого `~/.bashrc` або `~/.zshrc`, щоб зробити це постійним.

## Пов’язане

- [Огляд встановлення](/uk/install) - усі способи встановлення
- [Оновлення](/uk/install/updating) - підтримання OpenClaw в актуальному стані
- [Початок роботи](/uk/start/getting-started) - перші кроки після встановлення
