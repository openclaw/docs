---
read_when:
    - Вам потрібні відтворювані встановлення з можливістю відкату
    - Ви вже використовуєте Nix/NixOS/Home Manager
    - Ви хочете, щоб усе було зафіксовано за версіями та керувалося декларативно
summary: Встановлення OpenClaw декларативним способом за допомогою Nix
title: Nix
x-i18n:
    generated_at: "2026-07-12T13:23:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

Встановіть OpenClaw декларативно за допомогою **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — офіційного повнофункціонального модуля Home Manager.

<Info>
Репозиторій [nix-openclaw](https://github.com/openclaw/nix-openclaw) є джерелом достовірної інформації щодо встановлення через Nix. На цій сторінці наведено стислий огляд.
</Info>

## Що ви отримаєте

- Gateway + застосунок для macOS + інструменти (whisper, spotify, камери), усі із зафіксованими версіями
- Служба launchd, яка продовжує працювати після перезавантажень
- Система Plugin із декларативною конфігурацією
- Миттєве відкочування: `home-manager switch --rollback`

## Швидкий початок

<Steps>
  <Step title="Установіть Determinate Nix">
    Якщо Nix ще не встановлено, дотримуйтеся інструкцій [інсталятора Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Створіть локальний flake">
    Скористайтеся шаблоном, орієнтованим на агента, з репозиторію nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Скопіюйте templates/agent-first/flake.nix із репозиторію nix-openclaw
    ```
  </Step>
  <Step title="Налаштуйте секрети">
    Налаштуйте токен бота для обміну повідомленнями та ключ API постачальника моделі. Звичайні файли в `~/.secrets/` цілком підходять.
  </Step>
  <Step title="Заповніть заповнювачі в шаблоні та застосуйте конфігурацію">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Перевірте">
    Переконайтеся, що служба launchd працює, а ваш бот відповідає на повідомлення.
  </Step>
</Steps>

Повний перелік параметрів модуля та приклади див. у [README nix-openclaw](https://github.com/openclaw/nix-openclaw).

## Поведінка середовища виконання в режимі Nix

Коли встановлено `OPENCLAW_NIX_MODE=1` (автоматично з nix-openclaw), OpenClaw переходить у детермінований режим для встановлень, керованих Nix. Інші пакети Nix також можуть установлювати цей режим; nix-openclaw є офіційною еталонною реалізацією.

Його також можна встановити вручну:

```bash
export OPENCLAW_NIX_MODE=1
```

У macOS застосунок із графічним інтерфейсом не успадковує змінні середовища оболонки. Натомість увімкніть режим Nix через `defaults`:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Що змінюється в режимі Nix

- Потоки автоматичного встановлення та самомодифікації вимкнено.
- `openclaw.json` вважається незмінним. Значення за замовчуванням, визначені під час запуску, залишаються лише в середовищі виконання, а засоби запису конфігурації (початкове налаштування, перше налаштування, `openclaw update` зі змінами, установлення/оновлення/видалення/увімкнення Plugin, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set`) відмовляються редагувати файл.
- Натомість редагуйте вихідний код Nix. Для nix-openclaw скористайтеся орієнтованим на агента посібником [Швидкий початок](https://github.com/openclaw/nix-openclaw#quick-start) і задайте конфігурацію в `programs.openclaw.config` або `instances.<name>.config`.
- Для відсутніх залежностей відображаються спеціальні повідомлення Nix із рекомендаціями щодо усунення проблеми.
- В інтерфейсі відображається банер режиму Nix лише для читання.

### Шляхи конфігурації та стану

OpenClaw читає конфігурацію JSON5 із `OPENCLAW_CONFIG_PATH` і зберігає змінювані дані в `OPENCLAW_STATE_DIR`. У Nix явно задайте для них розташування, керовані Nix, щоб стан середовища виконання та конфігурація зберігалися поза незмінним сховищем.

| Змінна                 | Значення за замовчуванням               |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Виявлення PATH служби

Служба Gateway для launchd/systemd автоматично виявляє виконувані файли профілю Nix, тому Plugin та інструменти, які запускають установлені через `nix` виконувані файли з оболонки, працюють без ручного налаштування PATH:

- Коли встановлено `NIX_PROFILES`, кожен запис додається до PATH служби з пріоритетом справа наліво (відповідно до пріоритету оболонки Nix: крайній праворуч має перевагу).
- Коли `NIX_PROFILES` не встановлено, `~/.nix-profile/bin` додається як резервний варіант.

Це стосується як середовищ служби launchd у macOS, так і systemd у Linux.

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Офіційний модуль Home Manager і повний посібник із налаштування.
  </Card>
  <Card title="Майстер налаштування" href="/uk/start/wizard" icon="wand-magic-sparkles">
    Покрокове налаштування через CLI без використання Nix.
  </Card>
  <Card title="Docker" href="/uk/install/docker" icon="docker">
    Контейнеризоване налаштування як альтернатива без використання Nix.
  </Card>
  <Card title="Оновлення" href="/uk/install/updating" icon="arrow-up-right-from-square">
    Оновлення керованих Home Manager встановлень разом із пакетом.
  </Card>
</CardGroup>
