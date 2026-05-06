---
read_when:
    - Вам потрібні відтворювані встановлення з можливістю відкату
    - Ви вже використовуєте Nix/NixOS/Home Manager
    - Ви хочете, щоб усе було зафіксовано та керувалося декларативно
summary: Встановіть OpenClaw декларативно за допомогою Nix
title: Nix
x-i18n:
    generated_at: "2026-05-06T02:05:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

Встановіть OpenClaw декларативно за допомогою **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - модуля Home Manager з усім необхідним.

<Info>
Репозиторій [nix-openclaw](https://github.com/openclaw/nix-openclaw) є джерелом істини для встановлення через Nix. Ця сторінка є коротким оглядом.
</Info>

## Що ви отримуєте

- Gateway + застосунок macOS + інструменти (whisper, spotify, cameras) -- усе зафіксовано
- Служба launchd, яка переживає перезавантаження
- Система Plugin з декларативною конфігурацією
- Миттєвий відкат: `home-manager switch --rollback`

## Швидкий старт

<Steps>
  <Step title="Install Determinate Nix">
    Якщо Nix ще не встановлено, дотримуйтеся інструкцій [інсталятора Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Create a local flake">
    Використайте шаблон agent-first з репозиторію nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configure secrets">
    Налаштуйте токен бота для обміну повідомленнями та API-ключ постачальника моделі. Звичайні файли в `~/.secrets/` цілком підходять.
  </Step>
  <Step title="Fill in template placeholders and switch">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verify">
    Переконайтеся, що служба launchd працює, а ваш бот відповідає на повідомлення.
  </Step>
</Steps>

Повні параметри модуля та приклади дивіться в [README nix-openclaw](https://github.com/openclaw/nix-openclaw).

## Поведінка середовища виконання в режимі Nix

Коли встановлено `OPENCLAW_NIX_MODE=1` (автоматично з nix-openclaw), OpenClaw переходить у детермінований режим, який вимикає потоки автоматичного встановлення.

Його також можна встановити вручну:

```bash
export OPENCLAW_NIX_MODE=1
```

У macOS застосунок GUI не успадковує змінні середовища оболонки автоматично. Натомість увімкніть режим Nix через defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Що змінюється в режимі Nix

- Потоки автоматичного встановлення та самозміни вимкнено
- Відсутні залежності показують повідомлення про виправлення, специфічні для Nix
- UI показує банер режиму Nix лише для читання

### Шляхи конфігурації та стану

OpenClaw читає конфігурацію JSON5 з `OPENCLAW_CONFIG_PATH` і зберігає змінювані дані в `OPENCLAW_STATE_DIR`. Під час запуску під Nix явно задайте ці значення на розташування, керовані Nix, щоб стан середовища виконання та конфігурація залишалися поза незмінюваним сховищем.

| Змінна                 | Типове значення                        |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Виявлення PATH для служби

Служба gateway launchd/systemd автоматично виявляє бінарні файли профілю Nix, щоб
plugins та інструменти, які запускають виконувані файли, встановлені через `nix`,
працювали без ручного налаштування PATH:

- Коли встановлено `NIX_PROFILES`, кожен запис додається до PATH служби з
  пріоритетом справа наліво (відповідає пріоритету оболонки Nix - перемагає найправіший).
- Коли `NIX_PROFILES` не встановлено, `~/.nix-profile/bin` додається як резервний варіант.

Це стосується середовищ служб macOS launchd і Linux systemd.

## Пов’язане

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Модуль Home Manager, що є джерелом істини, і повний посібник із налаштування.
  </Card>
  <Card title="Setup wizard" href="/uk/start/wizard" icon="wand-magic-sparkles">
    Покрокове налаштування CLI без Nix.
  </Card>
  <Card title="Docker" href="/uk/install/docker" icon="docker">
    Контейнеризоване налаштування як альтернатива без Nix.
  </Card>
  <Card title="Updating" href="/uk/install/updating" icon="arrow-up-right-from-square">
    Оновлення встановлень, керованих Home Manager, разом із пакетом.
  </Card>
</CardGroup>
