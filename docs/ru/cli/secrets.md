---
read_when:
    - Повторное разрешение ссылок на секреты во время выполнения
    - Аудит остатков открытого текста и неразрешённых ссылок
    - Настройка SecretRefs и применение одностороннего удаления секретов
summary: Справочник CLI для `openclaw secrets` (перезагрузка, аудит, настройка, применение)
title: Секреты
x-i18n:
    generated_at: "2026-07-13T18:02:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Управляйте SecretRef и поддерживайте активный снимок среды выполнения в исправном состоянии.

| Команда     | Назначение                                                                                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC Gateway (`secrets.reload`): повторно разрешает ссылки и заменяет снимок среды выполнения только при полном успехе (без записи конфигурации)                                                                      |
| `audit`     | Сканирование хранилищ конфигурации, аутентификации и сгенерированных моделей, а также устаревших остатков в режиме только для чтения: поиск открытого текста, неразрешённых ссылок и расхождений приоритетов (exec-ссылки пропускаются без `--allow-exec`)                      |
| `configure` | Интерактивный планировщик настройки провайдеров, сопоставления целей и предварительной проверки (требуется TTY)                                                                                                       |
| `apply`     | Выполняет сохранённый план (`--dry-run` только проверяет и по умолчанию пропускает проверки exec; режим записи отклоняет планы с exec без `--allow-exec`), затем удаляет целевые остатки открытого текста |

Рекомендуемый рабочий цикл оператора:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Если план включает SecretRef/провайдеры `exec`, передайте `--allow-exec` обеим командам `apply`: для пробного запуска и записи.

Коды завершения для CI/шлюзов проверки:

- `audit --check` возвращает `1` при обнаружении проблем.
- Неразрешённые ссылки возвращают `2` (независимо от `--check`).

См. также: [Управление секретами](/ru/gateway/secrets) · [Поверхность учётных данных SecretRef](/ru/reference/secretref-credential-surface) · [Безопасность](/ru/gateway/security)

## Перезагрузка снимка среды выполнения

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Использует метод RPC Gateway `secrets.reload`. Если разрешение завершается ошибкой, Gateway сохраняет последний заведомо исправный снимок и возвращает ошибку (частичной активации не происходит). Ответ JSON включает `warningCount`.

Параметры: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Аудит

Сканирует состояние OpenClaw на наличие:

- хранения секретов в открытом виде
- неразрешённых ссылок
- расхождений приоритетов (учётные данные `auth-profiles.json`, перекрывающие ссылки `openclaw.json`)
- остатков сгенерированных `agents/*/agent/models.json` (значения `apiKey` провайдера и конфиденциальные заголовки провайдера)
- устаревших остатков (записи устаревшего хранилища аутентификации, напоминания OAuth)

Обнаружение конфиденциальных заголовков провайдеров основано на эвристике имён: отмечаются заголовки, имена которых соответствуют распространённым фрагментам, связанным с аутентификацией или учётными данными (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Структура отчёта:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- коды обнаруженных проблем: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Настройка (интерактивный помощник)

Интерактивно сформируйте изменения провайдеров и SecretRef, выполните предварительную проверку и при необходимости примените их:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Порядок: сначала настройка провайдеров (добавление, изменение и удаление псевдонимов `secrets.providers`), затем сопоставление учётных данных (выбор полей и назначение ссылок `{source, provider, id}`), после этого предварительная проверка и необязательное применение.

Флаги:

- `--providers-only`: настроить только `secrets.providers`, пропустив сопоставление учётных данных
- `--skip-provider-setup`: пропустить настройку провайдеров и сопоставить учётные данные с существующими провайдерами
- `--agent <id>`: ограничить обнаружение целей `auth-profiles.json` и запись одним хранилищем агента
- `--allow-exec`: разрешить проверки exec SecretRef во время предварительной проверки и применения (могут выполняться команды провайдера)

`--providers-only` и `--skip-provider-setup` нельзя использовать вместе.

Примечания:

- Требуется интерактивный TTY.
- Обрабатывает содержащие секреты поля в `openclaw.json`, а также `auth-profiles.json` для выбранной области агента; каноническая поддерживаемая поверхность: [Поверхность учётных данных SecretRef](/ru/reference/secretref-credential-surface).
- Поддерживает создание новых сопоставлений `auth-profiles.json` непосредственно в процессе выбора.
- Перед применением выполняет предварительное разрешение.
- В создаваемых планах параметры очистки включены по умолчанию (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). Для очищенных значений открытого текста применение необратимо.
- Без `--apply` CLI всё равно запрашивает `Apply this plan now?` после предварительной проверки.
- С `--apply` (и без `--yes`) CLI запрашивает дополнительное подтверждение необратимой миграции.
- `--json` выводит план и отчёт предварительной проверки, но по-прежнему требует интерактивный TTY.

### Безопасность exec-провайдеров

Установки Homebrew часто предоставляют двоичные файлы через символические ссылки в `/opt/homebrew/bin/*`. Задавайте `allowSymlinkCommand: true` только при необходимости для доверенных путей менеджера пакетов и вместе с `trustedDirs` (например, `["/opt/homebrew"]`). В Windows, если для пути провайдера недоступна проверка ACL, OpenClaw применяет запрет по умолчанию; только для доверенных путей задайте `allowInsecurePath: true` для этого провайдера, чтобы обойти проверку безопасности пути.

## Применение сохранённого плана

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` выполняет предварительную проверку без записи файлов; при пробном запуске проверки exec SecretRef по умолчанию пропускаются. Режим записи отклоняет планы, содержащие exec SecretRef/провайдеры, без `--allow-exec`. Используйте `--allow-exec`, чтобы явно разрешить проверки и выполнение exec-провайдеров в любом режиме.

Что может обновлять `apply`:

- `openclaw.json` (цели SecretRef, а также добавление, обновление и удаление провайдеров)
- `auth-profiles.json` (очистка целей провайдеров)
- устаревшие остатки `auth.json`
- известные секретные ключи `~/.openclaw/.env`, значения которых были перенесены

Подробности контракта плана (разрешённые пути целей, правила проверки, семантика ошибок): [Контракт плана применения секретов](/ru/gateway/secrets-plan-contract).

### Почему резервные копии для отката не создаются

`secrets apply` намеренно не создаёт резервные копии для отката, содержащие старые значения в открытом виде. Безопасность обеспечивается строгой предварительной проверкой и условно атомарным применением с попыткой восстановления в памяти при ошибке.

## Пример

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Если `audit --check` по-прежнему сообщает о значениях в открытом виде, обновите остальные указанные пути целей и повторно запустите аудит.

## См. также

- [Справочник CLI](/ru/cli)
- [Управление секретами](/ru/gateway/secrets)
- [SecretRef Vault](/ru/plugins/vault)
