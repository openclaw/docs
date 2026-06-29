---
read_when:
    - Вам нужны воспроизводимые установки с возможностью отката
    - Вы уже используете Nix/NixOS/Home Manager
    - Вы хотите, чтобы всё было закреплено и управлялось декларативно
summary: Установите OpenClaw декларативно с помощью Nix
title: Nix
x-i18n:
    generated_at: "2026-06-28T23:07:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
---

Устанавливайте OpenClaw декларативно с **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - официальным модулем Home Manager с полным набором возможностей.

<Info>
Репозиторий [nix-openclaw](https://github.com/openclaw/nix-openclaw) является источником истины для установки через Nix. Эта страница - краткий обзор.
</Info>

## Что вы получаете

- Gateway + приложение macOS + инструменты (whisper, spotify, cameras) -- все с закрепленными версиями
- Сервис launchd, который сохраняется после перезагрузок
- Система Plugin с декларативной конфигурацией
- Мгновенный откат: `home-manager switch --rollback`

## Быстрый старт

<Steps>
  <Step title="Установите Determinate Nix">
    Если Nix еще не установлен, следуйте инструкциям [установщика Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Создайте локальный flake">
    Используйте шаблон agent-first из репозитория nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Настройте секреты">
    Настройте токен бота для обмена сообщениями и API-ключ поставщика модели. Обычные файлы в `~/.secrets/` вполне подходят.
  </Step>
  <Step title="Заполните заполнители шаблона и переключитесь">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Проверьте">
    Убедитесь, что сервис launchd запущен и ваш бот отвечает на сообщения.
  </Step>
</Steps>

Полные параметры модуля и примеры см. в [README nix-openclaw](https://github.com/openclaw/nix-openclaw).

## Поведение среды выполнения в режиме Nix

Когда задано `OPENCLAW_NIX_MODE=1` (автоматически с nix-openclaw), OpenClaw переходит в детерминированный режим для установок, управляемых Nix. Другие пакеты Nix могут задавать тот же режим; nix-openclaw является официальным эталоном.

Его также можно задать вручную:

```bash
export OPENCLAW_NIX_MODE=1
```

В macOS приложение с графическим интерфейсом не наследует переменные окружения оболочки автоматически. Вместо этого включите режим Nix через defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Что меняется в режиме Nix

- Потоки автоустановки и самоизменения отключены
- `openclaw.json` рассматривается как неизменяемый. Значения по умолчанию, полученные при запуске, остаются только в среде выполнения, а средства записи конфигурации, такие как настройка, onboarding, изменяющий `openclaw update`, установка/обновление/удаление/включение Plugin, `doctor --fix`, `doctor --generate-gateway-token` и `openclaw config set`, отказываются редактировать файл.
- Вместо этого агенты должны редактировать исходный код Nix. Для nix-openclaw используйте agent-first [Быстрый старт](https://github.com/openclaw/nix-openclaw#quick-start) и задавайте конфигурацию в `programs.openclaw.config` или `instances.<name>.config`.
- Отсутствующие зависимости выводят сообщения по исправлению, специфичные для Nix
- UI показывает баннер режима Nix только для чтения

### Пути конфигурации и состояния

OpenClaw читает конфигурацию JSON5 из `OPENCLAW_CONFIG_PATH` и хранит изменяемые данные в `OPENCLAW_STATE_DIR`. При запуске под Nix задавайте их явно в расположения, управляемые Nix, чтобы состояние среды выполнения и конфигурация оставались вне неизменяемого хранилища.

| Переменная             | Значение по умолчанию                  |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Обнаружение PATH сервиса

Сервис gateway launchd/systemd автоматически обнаруживает бинарные файлы Nix-профиля, чтобы
plugins и инструменты, запускающие исполняемые файлы, установленные через `nix`, работали без
ручной настройки PATH:

- Когда задан `NIX_PROFILES`, каждая запись добавляется в PATH сервиса с
  приоритетом справа налево (соответствует приоритету оболочки Nix - самая правая запись побеждает).
- Когда `NIX_PROFILES` не задан, `~/.nix-profile/bin` добавляется как fallback.

Это относится как к окружениям сервиса launchd в macOS, так и systemd в Linux.

## Связанное

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Модуль Home Manager, являющийся источником истины, и полное руководство по настройке.
  </Card>
  <Card title="Мастер настройки" href="/ru/start/wizard" icon="wand-magic-sparkles">
    Пошаговая настройка CLI без Nix.
  </Card>
  <Card title="Docker" href="/ru/install/docker" icon="docker">
    Контейнеризованная настройка как альтернатива без Nix.
  </Card>
  <Card title="Обновление" href="/ru/install/updating" icon="arrow-up-right-from-square">
    Обновление установок, управляемых Home Manager, вместе с пакетом.
  </Card>
</CardGroup>
