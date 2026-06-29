---
read_when:
    - Вы хотите подключить OpenClaw к рабочему пространству Raft
    - Вы настраиваете внешний агент Raft
    - Вы отлаживаете доставку пробуждения Raft
sidebarTitle: Raft
summary: Поддержка внешних агентов Raft через мост пробуждения Raft CLI
title: Raft
x-i18n:
    generated_at: "2026-06-28T22:36:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

Поддержка Raft подключает агента OpenClaw к внешнему агенту Raft через локальный
Raft CLI. Raft отправляет аутентифицированные сигналы пробуждения в Gateway. Затем агент использует
Raft CLI для проверки и отправки сообщений.

## Установка

Raft — официальный внешний плагин. Установите его на хосте Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Подробнее: [Плагины](/ru/tools/plugin)

## Предварительные требования

- Рабочая область Raft с внешним агентом.
- Raft CLI установлен на том же хосте, что и OpenClaw Gateway.
- Профиль Raft CLI, в который уже выполнен вход и который связан с этим внешним агентом.

Плагин не хранит учетные данные Raft. Raft CLI хранит эту аутентификацию
в собственном профиле.

## Настройка

Задайте профиль в конфигурации:

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

Для учетной записи по умолчанию вместо этого можно задать `RAFT_PROFILE` в окружении
Gateway:

```bash
RAFT_PROFILE=openclaw
```

Используйте именованную учетную запись, когда один Gateway подключается к нескольким внешним агентам Raft:

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

Интерактивный процесс настройки записывает тот же профиль:

```bash
openclaw channels setup raft
```

## Как это работает

При запуске Gateway плагин:

1. Открывает HTTP-эндпоинт пробуждения только для loopback на эфемерном порту.
2. Запускает `raft --profile <profile> agent bridge` с этим эндпоинтом и
   токеном для текущего процесса.
3. Принимает только аутентифицированные сигналы пробуждения без содержимого с идентификатором повтора от локального моста.
4. Требует одно из полей: `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id` или `id`.
5. Дедуплицирует недавние повторные доставки пробуждения по идентификатору события моста, в том числе между перезапусками Gateway.
6. Возвращает стабильную runtime-сессию для текущего моста и пустой пакет очистки активности для протокола Raft CLI.
7. Запускает один сериализованный ход агента OpenClaw для каждого принятого пробуждения.

Мост отвечает за повторные попытки доставки Raft и переподключения. Ход OpenClaw получает
только уведомление о пробуждении, а не скопированное тело сообщения Raft. Он использует CLI для чтения
ожидающих сообщений и отправки ответа:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft не является обычным транспортом push-сообщений. OpenClaw не отправляет автоматически
итоговый текст модели обратно через мост, поэтому агент должен использовать
Raft CLI после обработки пробуждения.
</Note>

## Проверка

Проверьте, что OpenClaw может найти CLI и имеет настроенный профиль:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Затем отправьте сообщение внешнему агенту Raft. В журнале Gateway должен появиться запуск
моста Raft, а затем входящее пробуждение. Агент должен использовать
настроенный профиль Raft для проверки ожидающих сообщений.

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Raft CLI отсутствует">
    Установите Raft CLI на хост Gateway и сделайте `raft` доступным в
    `PATH` службы. Проверьте это с помощью `raft --help`, затем перезапустите Gateway.
  </Accordion>
  <Accordion title="Мост сразу завершает работу">
    Убедитесь, что для настроенного профиля выполнен вход и что он принадлежит нужному
    внешнему агенту Raft. Запустите `raft --profile <profile> agent bridge` напрямую,
    чтобы увидеть диагностическое сообщение CLI.
  </Accordion>
  <Accordion title="Пробуждение приходит, но ответ Raft не отправляется">
    Это ожидаемо, если агент не вызывает Raft CLI. Мост пробуждения
    не передает тела сообщений или автоматические итоговые ответы. Проверьте
    политику инструментов агента и убедитесь, что он может запускать `raft --profile <profile> message
    check` и `message send`.
  </Accordion>
</AccordionGroup>

## Ссылки

- [Raft](https://raft.build/)
- [Документация Raft](https://docs.raft.build/welcome/)
- [Интеграция Hermes Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
