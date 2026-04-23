---
read_when:
    - Створення або налагодження клієнтів Node (режим Node на iOS/Android/macOS)
    - Діагностика збоїв pairing або автентифікації bridge
    - Аудит поверхні Node, яку відкриває Gateway
summary: 'Історичний протокол bridge (застарілі Node): TCP JSONL, pairing, scoped RPC'
title: Протокол bridge
x-i18n:
    generated_at: "2026-04-23T20:52:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: da4664a7ca10306259592f3b5c6b5721afa5beaafde8fa02172f6ecb9c743b3d
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Протокол bridge (застарілий транспорт Node)

<Warning>
TCP bridge було **видалено**. Поточні збірки OpenClaw не постачають listener bridge, а ключі конфігурації `bridge.*` більше не входять до схеми. Цю сторінку збережено лише для історичної довідки. Для всіх клієнтів Node/operator використовуйте [Протокол Gateway](/uk/gateway/protocol).
</Warning>

## Навіщо він існував

- **Межа безпеки**: bridge відкриває невеликий allowlist замість
  повної поверхні API Gateway.
- **Pairing + ідентичність Node**: допуск Node належить Gateway і прив’язаний
  до токена для кожного Node.
- **UX виявлення**: Node можуть знаходити Gateway через Bonjour у LAN або підключатися
  напряму через tailnet.
- **Loopback WS**: повна площина керування WS залишається локальною, якщо її не тунелювати через SSH.

## Транспорт

- TCP, по одному JSON-об’єкту на рядок (JSONL).
- Необов’язковий TLS (коли `bridge.tls.enabled` має значення true).
- Історичний типовий порт listener був `18790` (поточні збірки не запускають
  TCP bridge).

Коли TLS увімкнено, TXT-записи discovery включають `bridgeTls=1` плюс
`bridgeTlsSha256` як несекретну підказку. Зверніть увагу, що TXT-записи Bonjour/mDNS неавтентифіковані; клієнти не повинні трактувати advertised fingerprint як авторитетний pin без явного наміру користувача або іншої позасмугової перевірки.

## Handshake + pairing

1. Клієнт надсилає `hello` з метаданими Node + токеном (якщо pairing уже виконано).
2. Якщо pairing не виконано, Gateway відповідає `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Клієнт надсилає `pair-request`.
4. Gateway чекає схвалення, а потім надсилає `pair-ok` і `hello-ok`.

Історично `hello-ok` повертав `serverName` і міг містити
`canvasHostUrl`.

## Фрейми

Клієнт → Gateway:

- `req` / `res`: scoped RPC Gateway (chat, sessions, config, health, voicewake, skills.bins)
- `event`: сигнали Node (voice transcript, запит агента, підписка чату, життєвий цикл exec)

Gateway → Клієнт:

- `invoke` / `invoke-res`: команди Node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: оновлення чату для сесій із підпискою
- `ping` / `pong`: keepalive

Історично примусове застосування allowlist містилося в `src/gateway/server-bridge.ts` (видалено).

## Події життєвого циклу Exec

Node можуть надсилати події `exec.finished` або `exec.denied`, щоб показувати активність system.run.
Вони мапляться на системні події в Gateway. (Застарілі Node усе ще можуть надсилати `exec.started`.)

Поля payload (усі необов’язкові, якщо не зазначено інше):

- `sessionKey` (обов’язково): сесія агента, яка має отримати системну подію.
- `runId`: унікальний id exec для групування.
- `command`: сирий або відформатований рядок команди.
- `exitCode`, `timedOut`, `success`, `output`: деталі завершення (лише для finished).
- `reason`: причина відмови (лише для denied).

## Історичне використання tailnet

- Прив’язати bridge до IP tailnet: `bridge.bind: "tailnet"` у
  `~/.openclaw/openclaw.json` (лише історично; `bridge.*` більше не є валідним).
- Клієнти підключаються через ім’я MagicDNS або IP tailnet.
- Bonjour **не** працює між мережами; за потреби використовуйте ручне задання host/port або wide-area DNS‑SD.

## Версіонування

Bridge був **неявною v1** (без узгодження min/max). Цей розділ наведено
лише для історичної довідки; поточні клієнти Node/operator використовують WebSocket
[Протокол Gateway](/uk/gateway/protocol).
