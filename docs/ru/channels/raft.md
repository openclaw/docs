---
read_when:
    - Вы хотите подключить OpenClaw к рабочему пространству Raft
    - Вы настраиваете внешний агент Raft
    - Вы отлаживаете доставку пробуждения Raft
sidebarTitle: Raft
summary: Поддержка внешних агентов Raft через мост пробуждения Raft CLI
title: Raft
x-i18n:
    generated_at: "2026-07-13T19:31:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft подключает агента OpenClaw к внешнему агенту Raft через локальный
CLI Raft. Raft отправляет аутентифицированные сигналы пробуждения в Gateway; затем агент
использует CLI Raft для проверки и отправки сообщений. Только личные чаты (без групп).

## Установка

Raft — официальный внешний плагин. Установите его на хосте Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Подробнее: [Плагины](/ru/tools/plugin)

## Предварительные требования

- Рабочее пространство Raft с внешним агентом.
- CLI Raft, установленный на том же хосте, что и Gateway OpenClaw, в
  `PATH` службы.
- Профиль CLI Raft, в котором уже выполнен вход и который связан с этим
  внешним агентом.

Плагин не хранит учётные данные Raft; CLI Raft сохраняет данные
аутентификации в собственном профиле.

## Настройка

Укажите профиль в конфигурации:

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

Для учётной записи по умолчанию вместо этого можно задать `RAFT_PROFILE` в окружении
Gateway:

```bash
RAFT_PROFILE=openclaw
```

Используйте именованную учётную запись, если один Gateway подключается более чем к одному внешнему агенту Raft:

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

При интерактивной настройке сохраняется тот же профиль:

```bash
openclaw channels add --channel raft
```

## Принцип работы

При запуске Gateway плагин:

1. Открывает HTTP-эндпоинт пробуждения только на loopback-интерфейсе, используя временный порт.
2. Запускает `raft --profile <profile> agent bridge` с этим эндпоинтом и
   токеном для текущего процесса.
3. Принимает от локального моста только аутентифицированные сигналы пробуждения без содержимого и с идентификатором для защиты от повторного воспроизведения.
4. Требует наличия `eventId`, `attemptId`, `messageId`, `delivery_id`,
   `wake_id` или `id` в каждой полезной нагрузке пробуждения.
5. В течение 24 часов устраняет дубликаты повторно доставленных пробуждений по идентификатору события моста,
   в том числе после перезапусков Gateway.
6. Возвращает стабильную сессию среды выполнения для текущего моста и пустой
   пакет очистки активности для протокола CLI Raft.
7. Запускает один последовательный цикл агента OpenClaw для каждого принятого пробуждения.

Мост отвечает за повторные попытки доставки Raft и повторные подключения. Цикл OpenClaw
получает только уведомление о пробуждении, а не копию тела сообщения Raft. Он использует CLI,
чтобы прочитать ожидающие сообщения и отправить ответ:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft не является транспортом push-сообщений. OpenClaw не отправляет автоматически итоговый текст модели обратно через мост, поэтому после обработки пробуждения агент должен использовать CLI Raft.
</Note>

## Проверка

Убедитесь, что OpenClaw может найти CLI и что профиль настроен:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Затем отправьте сообщение внешнему агенту Raft. В журнале Gateway сначала должен отобразиться
запуск моста Raft, а затем входящее пробуждение. Агент должен использовать
настроенный профиль Raft для проверки ожидающих сообщений.

## Устранение неполадок

<AccordionGroup>
  <Accordion title="CLI Raft отсутствует">
    Установите CLI Raft на хосте Gateway и сделайте `raft` доступным в
    `PATH` службы. Проверьте его с помощью `raft --help`, затем перезапустите Gateway.
  </Accordion>
  <Accordion title="Мост немедленно завершает работу">
    Убедитесь, что в настроенном профиле выполнен вход и что он принадлежит нужному
    внешнему агенту Raft. Запустите `raft --profile <profile> agent bridge` напрямую,
    чтобы просмотреть диагностические данные CLI.
  </Accordion>
  <Accordion title="Пробуждение поступает, но ответ Raft не отправляется">
    Это ожидаемое поведение, если агент не вызывает CLI Raft. Мост пробуждения
    не передаёт тела сообщений и не отправляет итоговые ответы автоматически. Проверьте
    политику инструментов агента и убедитесь, что он может выполнять `raft --profile <profile>
    message check` и `message send`.
  </Accordion>
</AccordionGroup>

## Ссылки

- [Raft](https://raft.build/)
- [Документация Raft](https://docs.raft.build/welcome/)
- [Интеграция Raft с Hermes](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
