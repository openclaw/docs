---
read_when:
    - Створення або налагодження клієнтів Node (режим Node на iOS/Android/macOS)
    - Дослідження збоїв сполучення або автентифікації мосту
    - Аудит поверхні Node, яку надає Gateway
summary: 'Історичний міст-протокол (застарілі Node): TCP JSONL, сполучення, RPC з областю дії'
title: Міст-протокол
x-i18n:
    generated_at: "2026-04-24T18:10:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

<Warning>
TCP-міст було **видалено**. Поточні збірки OpenClaw не постачають слухач мосту, а ключі конфігурації `bridge.*` більше не входять до схеми. Цю сторінку збережено лише для історичної довідки. Для всіх клієнтів Node/операторів використовуйте [Gateway Protocol](/uk/gateway/protocol).
</Warning>

## Чому він існував

- **Межа безпеки**: міст надає невеликий allowlist замість
  повної поверхні API gateway.
- **Сполучення + ідентичність Node**: допуск Node контролюється gateway і прив’язаний
  до токена для кожного Node.
- **UX виявлення**: Node можуть знаходити gateway через Bonjour у LAN або підключатися
  напряму через tailnet.
- **Loopback WS**: повна площина керування WS залишається локальною, якщо її не тунелювати через SSH.

## Транспорт

- TCP, по одному JSON-об’єкту в рядку (JSONL).
- Необов’язковий TLS (коли `bridge.tls.enabled` має значення true).
- Історичний типовий порт слухача був `18790` (поточні збірки не запускають
  TCP-міст).

Коли TLS увімкнено, записи TXT виявлення містять `bridgeTls=1` плюс
`bridgeTlsSha256` як неприховану підказку. Зверніть увагу, що записи TXT Bonjour/mDNS не
автентифіковані; клієнти не повинні розглядати рекламований відбиток як
авторитетне закріплення без явного наміру користувача або іншої позасмугової перевірки.

## Рукостискання + сполучення

1. Клієнт надсилає `hello` з метаданими Node + токеном (якщо вже виконано сполучення).
2. Якщо сполучення не виконано, gateway відповідає `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Клієнт надсилає `pair-request`.
4. Gateway очікує схвалення, а потім надсилає `pair-ok` і `hello-ok`.

Історично `hello-ok` повертав `serverName` і міг містити
`canvasHostUrl`.

## Фрейми

Клієнт → Gateway:

- `req` / `res`: RPC gateway з областю дії (chat, sessions, config, health, voicewake, skills.bins)
- `event`: сигнали Node (транскрипт голосу, запит агента, підписка на chat, життєвий цикл exec)

Gateway → Клієнт:

- `invoke` / `invoke-res`: команди Node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: оновлення chat для сесій із підпискою
- `ping` / `pong`: підтримання з’єднання

Історичне забезпечення allowlist знаходилося в `src/gateway/server-bridge.ts` (видалено).

## Події життєвого циклу Exec

Node можуть надсилати події `exec.finished` або `exec.denied`, щоб відображати активність system.run.
Вони зіставляються із системними подіями в gateway. (Застарілі Node все ще можуть надсилати `exec.started`.)

Поля payload (усі необов’язкові, якщо не зазначено інше):

- `sessionKey` (обов’язкове): сесія агента, яка має отримати системну подію.
- `runId`: унікальний id exec для групування.
- `command`: сирий або форматований рядок команди.
- `exitCode`, `timedOut`, `success`, `output`: відомості про завершення (лише для finished).
- `reason`: причина відмови (лише для denied).

## Історичне використання tailnet

- Прив’яжіть міст до IP tailnet: `bridge.bind: "tailnet"` у
  `~/.openclaw/openclaw.json` (лише історично; `bridge.*` більше не є дійсним).
- Клієнти підключаються через ім’я MagicDNS або IP tailnet.
- Bonjour **не** працює між мережами; використовуйте ручний host/port або wide-area DNS‑SD,
  коли це потрібно.

## Версіонування

Міст був **неявною v1** (без узгодження min/max). Цей розділ —
лише історична довідка; поточні клієнти Node/операторів використовують WebSocket
[Gateway Protocol](/uk/gateway/protocol).

## Пов’язане

- [Gateway protocol](/uk/gateway/protocol)
- [Nodes](/uk/nodes)
