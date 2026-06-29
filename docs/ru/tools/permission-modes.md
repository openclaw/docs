---
read_when:
    - Выбор auto, ask, allowlist, full или deny для разрешений команд
    - Настройка проверенных Codex Guardian подтверждений через tools.exec.mode
    - Сравнение подтверждений выполнения OpenClaw с разрешениями среды ACPX
summary: Режимы разрешений для выполнения на хосте, подтверждений Codex Guardian и сеансов обвязки ACPX
title: Режимы разрешений
x-i18n:
    generated_at: "2026-06-28T23:54:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ce89cadb45b3b96ce9ab62b35c06610d02f0ff02f15ef7d2128c59fbebb325a
    source_path: tools/permission-modes.md
    workflow: 16
---

Режимы разрешений определяют, сколько полномочий есть у агента до того, как он сможет запускать команды хоста, записывать файлы или запрашивать у backend harness дополнительный доступ. Начните с `tools.exec.mode: "auto"`, если хотите, чтобы OpenClaw сначала использовал списки разрешений, а затем встроенную автоматическую проверку Codex или маршрут подтверждения человеком для несовпадений.

<Note>
  Режим разрешений отделен от `tools.exec.host=auto`. `tools.exec.host`
  выбирает, где выполняется команда. `tools.exec.mode` выбирает, как
  подтверждается host exec.
</Note>

## Рекомендуемое значение по умолчанию

Используйте `auto` для агентов программирования, которым нужен полезный доступ к хосту без превращения каждого несовпадения в запрос к человеку:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Затем проверьте действующую политику:

```bash
openclaw exec-policy show
```

В режиме `auto` OpenClaw напрямую выполняет детерминированные совпадения со списком разрешений. Несовпадения для подтверждения сначала проходят через встроенный автоматический рецензент OpenClaw, а затем при необходимости откатываются к настроенному маршруту подтверждения человеком.

## Режимы host exec OpenClaw

`tools.exec.mode` — нормализованная поверхность политики для host `exec`.

| Режим       | Поведение                                                 | Когда использовать                                      |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| `deny`      | Блокировать host exec.                                    | Команды хоста не разрешены.                             |
| `allowlist` | Выполнять только команды из списка разрешений.             | У вас есть известный безопасный набор команд.           |
| `ask`       | Выполнять совпадения со списком разрешений и спрашивать при несовпадениях. | Человек должен проверять новые формы команд.            |
| `auto`      | Выполнять совпадения со списком разрешений, затем использовать автоматическую проверку. | Сеансам программирования нужен практичный защищенный доступ. |
| `full`      | Выполнять host exec без запросов.                          | Этот доверенный хост/сеанс должен пропускать шлюзы подтверждения. |

Полную политику host exec, локальный файл подтверждений, схему списка разрешений, безопасные bin-файлы и поведение пересылки см. в [Подтверждения exec](/ru/tools/exec-approvals).

## Сопоставление Codex Guardian

Для встроенных сеансов app-server Codex `tools.exec.mode: "auto"` сопоставляется с подтверждениями, проверяемыми Codex Guardian, когда локальные требования Codex это позволяют. OpenClaw обычно отправляет:

| Поле Codex          | Типичное значение |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

В режиме `auto` OpenClaw не сохраняет устаревшие небезопасные переопределения Codex, такие как `approvalPolicy: "never"` или `sandbox: "danger-full-access"`. Используйте `tools.exec.mode: "full"` только тогда, когда намеренно хотите режим без подтверждений.

Подробности о настройке app-server, порядке auth и встроенной среде выполнения Codex см. в [Harness Codex](/ru/plugins/codex-harness).

## Разрешения harness ACPX

Сеансы ACPX неинтерактивны, поэтому они не могут нажать запрос разрешения в TTY. ACPX использует отдельные настройки уровня harness в `plugins.entries.acpx.config`:

| Настройка                   | Обычное значение | Значение                                      |
| --------------------------- | ---------------- | --------------------------------------------- |
| `permissionMode`            | `approve-reads`  | Автоматически подтверждать только чтение.     |
| `permissionMode`            | `approve-all`    | Автоматически подтверждать записи и shell-команды. |
| `permissionMode`            | `deny-all`       | Отклонять все запросы разрешений.             |
| `nonInteractivePermissions` | `fail`           | Прерывать выполнение, когда потребовался бы запрос. |
| `nonInteractivePermissions` | `deny`           | Отклонять запрос и продолжать, когда возможно. |

Настройте разрешения ACPX отдельно от подтверждений exec в OpenClaw:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Используйте `approve-all` как эквивалент ACPX для аварийного режима сеанса harness без запросов. Подробности настройки и режимы отказа см. в [Настройка агентов ACP](/ru/tools/acp-agents-setup#permission-configuration).

## Выбор режима

| Цель                                                   | Настройка                                                   |
| ------------------------------------------------------ | ----------------------------------------------------------- |
| Полностью заблокировать команды хоста                  | `tools.exec.mode: "deny"`                                   |
| Разрешить запуск только известных безопасных команд    | `tools.exec.mode: "allowlist"`                              |
| Спрашивать человека для каждой новой формы команды     | `tools.exec.mode: "ask"`                                    |
| Использовать автоматическую проверку Codex/OpenClaw перед людьми | `tools.exec.mode: "auto"`                                   |
| Полностью пропустить подтверждения host exec           | `tools.exec.mode: "full"` плюс соответствующий файл подтверждений хоста |
| Разрешить неинтерактивным сеансам ACPX запись/exec     | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Если команда все еще показывает запрос или завершается ошибкой после изменения режима, проверьте оба уровня:

```bash
openclaw approvals get
openclaw exec-policy show
```

Host exec использует более строгий результат из конфигурации OpenClaw и локального для хоста файла подтверждений. Разрешения ACPX harness не ослабляют подтверждения host exec, а подтверждения host exec не ослабляют запросы ACPX harness.

## Связанные материалы

- [Подтверждения exec](/ru/tools/exec-approvals)
- [Подтверждения exec — расширенные](/ru/tools/exec-approvals-advanced)
- [Harness Codex](/ru/plugins/codex-harness)
- [Настройка агентов ACP](/ru/tools/acp-agents-setup#permission-configuration)
