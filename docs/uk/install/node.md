---
read_when:
    - Потрібно встановити Node.js перед установленням OpenClaw
    - Ви встановили OpenClaw, але команда `openclaw` не знайдена
    - npm install -g завершується помилкою через проблеми з дозволами або PATH
summary: Установлення та налаштування Node.js для OpenClaw - вимоги до версії, варіанти встановлення та усунення проблем із PATH
title: Node.js
x-i18n:
    generated_at: "2026-05-07T13:22:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8ef8d00c8996741187000f55d07d15a2d09e89b6deb99cf687b6b9128ad266
    source_path: install/node.md
    workflow: 16
---

OpenClaw вимагає **Node 22.16 або новішої версії**. **Node 24 є стандартним і рекомендованим середовищем виконання** для інсталяцій, CI та робочих процесів випуску. Node 22 залишається підтримуваним через активну гілку LTS. [Скрипт інсталятора](/uk/install#alternative-install-methods) автоматично виявить і встановить Node - ця сторінка призначена для випадків, коли ви хочете налаштувати Node самостійно й переконатися, що все під'єднано правильно (версії, PATH, глобальні інсталяції).

## Перевірте свою версію

```bash
node -v
```

Якщо команда виводить `v24.x.x` або вище, ви використовуєте рекомендовану стандартну версію. Якщо вона виводить `v22.16.x` або вище, ви використовуєте підтримуваний шлях Node 22 LTS, але ми все одно рекомендуємо перейти на Node 24, коли буде зручно. Якщо Node не встановлено або версія занадто стара, виберіть спосіб інсталяції нижче.

## Встановіть Node

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
- [**mise**](https://mise.jdx.dev/) - поліглотний (Node, Python, Ruby тощо)

Приклад із fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Переконайтеся, що ваш менеджер версій ініціалізовано у файлі запуску оболонки (`~/.zshrc` або `~/.bashrc`). Якщо ні, `openclaw` може не знаходитися в нових сеансах термінала, бо PATH не міститиме bin-каталог Node.
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
        Додайте результат `npm prefix -g` до системного PATH через Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Помилки дозволів під час `npm install -g` (Linux)

Якщо ви бачите помилки `EACCES`, змініть глобальний префікс npm на каталог, доступний користувачу для запису:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Додайте рядок `export PATH=...` до свого `~/.bashrc` або `~/.zshrc`, щоб зробити це постійним.

## Пов'язане

- [Огляд інсталяції](/uk/install) - усі способи інсталяції
- [Оновлення](/uk/install/updating) - підтримання OpenClaw в актуальному стані
- [Початок роботи](/uk/start/getting-started) - перші кроки після інсталяції
