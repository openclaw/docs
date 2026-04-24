---
read_when:
    - Protokol şemalarını veya kod üretimini güncelleme
summary: Gateway protokolü için tek doğruluk kaynağı olarak TypeBox şemaları
title: TypeBox
x-i18n:
    generated_at: "2026-04-24T09:07:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0496db919ee5c50a5932aa9e51eb54e1f54791bc0a271f39d6fb9e6fe17a2a28
    source_path: concepts/typebox.md
    workflow: 15
---

# Protokol için doğruluk kaynağı olarak TypeBox

Son güncelleme: 2026-01-10

TypeBox, TypeScript öncelikli bir şema kütüphanesidir. Bunu **Gateway
WebSocket protokolünü** (handshake, istek/yanıt, sunucu olayları) tanımlamak için kullanıyoruz. Bu şemalar
**çalışma zamanı doğrulamasını**, **JSON Schema dışa aktarımını** ve
macOS uygulaması için **Swift kod üretimini** yönlendirir. Tek doğruluk kaynağı; diğer her şey üretilir.

Daha yüksek seviyeli protokol bağlamını istiyorsanız
[Gateway architecture](/tr/concepts/architecture) ile başlayın.

## Zihinsel model (30 saniye)

Her Gateway WS mesajı şu üç frame'den biridir:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

İlk frame **mutlaka** bir `connect` isteği olmalıdır. Ondan sonra istemciler
yöntemleri çağırabilir (ör. `health`, `send`, `chat.send`) ve olaylara abone olabilir (ör.
`presence`, `tick`, `agent`).

Bağlantı akışı (minimal):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Yaygın yöntemler + olaylar:

| Kategori   | Örnekler                                                   | Notlar                               |
| ---------- | ---------------------------------------------------------- | ------------------------------------ |
| Çekirdek   | `connect`, `health`, `status`                              | `connect` ilk olmalıdır              |
| Mesajlaşma | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | yan etkiler için `idempotencyKey` gerekir |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat bunları kullanır             |
| Oturumlar  | `sessions.list`, `sessions.patch`, `sessions.delete`       | oturum yönetimi                      |
| Otomasyon  | `wake`, `cron.list`, `cron.run`, `cron.runs`               | uyandırma + Cron denetimi            |
| Node'lar   | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + Node eylemleri          |
| Olaylar    | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | sunucu push                          |

Yetkili ilan edilmiş **discovery** envanteri
`src/gateway/server-methods-list.ts` içinde yaşar (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Şemalar nerede bulunur

- Kaynak: `src/gateway/protocol/schema.ts`
- Çalışma zamanı doğrulayıcıları (AJV): `src/gateway/protocol/index.ts`
- İlan edilen özellik/discovery kayıt defteri: `src/gateway/server-methods-list.ts`
- Sunucu handshake + yöntem dağıtımı: `src/gateway/server.impl.ts`
- Node istemcisi: `src/gateway/client.ts`
- Üretilmiş JSON Schema: `dist/protocol.schema.json`
- Üretilmiş Swift modelleri: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Geçerli işlem hattı

- `pnpm protocol:gen`
  - JSON Schema'yı (draft‑07) `dist/protocol.schema.json` dosyasına yazar
- `pnpm protocol:gen:swift`
  - Swift Gateway modellerini üretir
- `pnpm protocol:check`
  - iki üreticiyi de çalıştırır ve çıktının commit edildiğini doğrular

## Şemalar çalışma zamanında nasıl kullanılır

- **Sunucu tarafı**: gelen her frame AJV ile doğrulanır. Handshake, yalnızca
  parametreleri `ConnectParams` ile eşleşen bir `connect` isteğini kabul eder.
- **İstemci tarafı**: JS istemcisi, kullanmadan önce olay ve yanıt frame'lerini doğrular.
- **Özellik discovery**: Gateway, `hello-ok` içinde `listGatewayMethods()` ve
  `GATEWAY_EVENTS` üzerinden korumacı bir `features.methods`
  ve `features.events` listesi gönderir.
- Bu discovery listesi, `coreGatewayHandlers` içindeki çağrılabilir her helper'ın
  üretilmiş bir dökümü değildir; bazı helper RPC'ler
  `src/gateway/server-methods/*.ts` içinde uygulanır ancak ilan edilen
  özellik listesinde numaralandırılmaz.

## Örnek frame'ler

Connect (ilk mesaj):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "openclaw-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

Hello-ok yanıtı:

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

İstek + yanıt:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Olay:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Minimal istemci (Node.js)

En küçük kullanışlı akış: connect + health.

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

## Uçtan uca örnek: bir yöntem ekleme

Örnek: `{ ok: true, text }` döndüren yeni bir `system.echo` isteği ekleyin.

1. **Şema (doğruluk kaynağı)**

`src/gateway/protocol/schema.ts` dosyasına ekleyin:

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

Bunların ikisini de `ProtocolSchemas` içine ekleyin ve türleri dışa aktarın:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Doğrulama**

`src/gateway/protocol/index.ts` içinde bir AJV doğrulayıcısı dışa aktarın:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Sunucu davranışı**

`src/gateway/server-methods/system.ts` içine bir handler ekleyin:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Bunu `src/gateway/server-methods.ts` içinde kaydedin (`systemHandlers` zaten birleştiriliyor),
ardından `"system.echo"` girdisini
`src/gateway/server-methods-list.ts` içindeki `listGatewayMethods` girdisine ekleyin.

Yöntem operatör veya Node istemcileri tarafından çağrılabiliyorsa, bunu
`src/gateway/method-scopes.ts` içinde de sınıflandırın; böylece kapsam uygulaması ve `hello-ok` özellik
ilanı hizalı kalır.

4. **Yeniden üretme**

```bash
pnpm protocol:check
```

5. **Testler + belgeler**

`src/gateway/server.*.test.ts` içine bir sunucu testi ekleyin ve yöntemi belgelere not edin.

## Swift kod üretimi davranışı

Swift üreticisi şunları üretir:

- `req`, `res`, `event` ve `unknown` durumlarına sahip `GatewayFrame` enum'u
- Güçlü şekilde türlenmiş payload struct/enum'ları
- `ErrorCode` değerleri ve `GATEWAY_PROTOCOL_VERSION`

Bilinmeyen frame türleri, ileri uyumluluk için ham payload'lar olarak korunur.

## Sürümleme + uyumluluk

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyumsuzlukları reddeder.
- Swift modelleri, eski istemcileri bozmamak için bilinmeyen frame türlerini korur.

## Şema desenleri ve kuralları

- Nesnelerin çoğu katı payload'lar için `additionalProperties: false` kullanır.
- `NonEmptyString`, kimlikler ve yöntem/olay adları için varsayılandır.
- Üst düzey `GatewayFrame`, `type` üzerinde bir **discriminator** kullanır.
- Yan etkili yöntemler genellikle params içinde bir `idempotencyKey` gerektirir
  (örnek: `send`, `poll`, `agent`, `chat.send`).
- `agent`, çalışma zamanında üretilen orkestrasyon bağlamı için isteğe bağlı `internalEvents` kabul eder
  (örneğin alt agent/Cron görevi tamamlama devri); bunu iç API yüzeyi olarak değerlendirin.

## Canlı şema JSON'u

Üretilmiş JSON Schema, repoda `dist/protocol.schema.json` içinde bulunur. Yayımlanmış
ham dosya genellikle şurada erişilebilir olur:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Şemaları değiştirdiğinizde

1. TypeBox şemalarını güncelleyin.
2. Yöntemi/olayı `src/gateway/server-methods-list.ts` içinde kaydedin.
3. Yeni RPC'nin operatör veya
   Node kapsam sınıflandırmasına ihtiyacı varsa `src/gateway/method-scopes.ts` dosyasını güncelleyin.
4. `pnpm protocol:check` çalıştırın.
5. Yeniden üretilmiş şema + Swift modellerini commit edin.

## İlgili

- [Rich output protocol](/tr/reference/rich-output-protocol)
- [RPC adapters](/tr/reference/rpc)
