---
read_when:
    - Protokol şemalarını veya codegen'i güncelliyorsunuz
summary: Gateway protokolü için tek doğruluk kaynağı olarak TypeBox şemaları
title: TypeBox
x-i18n:
    generated_at: "2026-04-05T13:52:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f508523998f94d12fbd6ce98d8a7d49fa641913196a4ab7b01f91f83c01c7eb
    source_path: concepts/typebox.md
    workflow: 15
---

# Protokol için doğruluk kaynağı olarak TypeBox

Son güncelleme: 2026-01-10

TypeBox, TypeScript öncelikli bir şema kitaplığıdır. Bunu **Gateway
WebSocket protokolünü** tanımlamak için kullanıyoruz (el sıkışma, istek/yanıt, sunucu olayları). Bu şemalar **çalışma zamanı doğrulamasını**, **JSON Schema dışa aktarmasını** ve macOS uygulaması için **Swift codegen** sürecini yönlendirir. Tek bir doğruluk kaynağı; diğer her şey üretilir.

Daha üst düzey protokol bağlamını istiyorsanız, şuradan başlayın:
[Gateway mimarisi](/concepts/architecture).

## Zihinsel model (30 saniye)

Her Gateway WS mesajı şu üç çerçeveden biridir:

- **İstek**: `{ type: "req", id, method, params }`
- **Yanıt**: `{ type: "res", id, ok, payload | error }`
- **Olay**: `{ type: "event", event, payload, seq?, stateVersion? }`

İlk çerçeve **zorunlu olarak** bir `connect` isteği olmalıdır. Bundan sonra istemciler
yöntem çağırabilir (ör. `health`, `send`, `chat.send`) ve olaylara abone olabilir
(ör. `presence`, `tick`, `agent`).

Bağlantı akışı (en düşük düzeyde):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Yaygın yöntemler + olaylar:

| Kategori   | Örnekler                                                   | Notlar                             |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Çekirdek   | `connect`, `health`, `status`                              | `connect` ilk olmalıdır            |
| Mesajlaşma | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | yan etkiler için `idempotencyKey` gerekir |
| Sohbet     | `chat.history`, `chat.send`, `chat.abort`                  | WebChat bunları kullanır           |
| Oturumlar  | `sessions.list`, `sessions.patch`, `sessions.delete`       | oturum yönetimi                    |
| Otomasyon  | `wake`, `cron.list`, `cron.run`, `cron.runs`               | uyandırma + cron kontrolü          |
| Düğümler   | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + düğüm eylemleri       |
| Olaylar    | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | sunucu itmesi                      |

Yetkili olarak duyurulan **keşif** envanteri
`src/gateway/server-methods-list.ts` içinde bulunur (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Şemalar nerede bulunur

- Kaynak: `src/gateway/protocol/schema.ts`
- Çalışma zamanı doğrulayıcıları (AJV): `src/gateway/protocol/index.ts`
- Duyurulan özellik/keşif kaydı: `src/gateway/server-methods-list.ts`
- Sunucu el sıkışması + yöntem sevki: `src/gateway/server.impl.ts`
- Düğüm istemcisi: `src/gateway/client.ts`
- Üretilen JSON Schema: `dist/protocol.schema.json`
- Üretilen Swift modelleri: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Geçerli işlem hattı

- `pnpm protocol:gen`
  - JSON Schema'yı (draft‑07) `dist/protocol.schema.json` dosyasına yazar
- `pnpm protocol:gen:swift`
  - Swift Gateway modellerini üretir
- `pnpm protocol:check`
  - her iki üreticiyi de çalıştırır ve çıktının commit edildiğini doğrular

## Şemalar çalışma zamanında nasıl kullanılır

- **Sunucu tarafı**: gelen her çerçeve AJV ile doğrulanır. El sıkışma yalnızca
  parametreleri `ConnectParams` ile eşleşen bir `connect` isteğini kabul eder.
- **İstemci tarafı**: JS istemcisi, olay ve yanıt çerçevelerini
  kullanmadan önce doğrular.
- **Özellik keşfi**: Gateway, `hello-ok` içinde temkinli bir `features.methods`
  ve `features.events` listesini `listGatewayMethods()` ve
  `GATEWAY_EVENTS` üzerinden gönderir.
- Bu keşif listesi, `coreGatewayHandlers` içindeki çağrılabilir her yardımcı işlevin
  üretilmiş bir dökümü değildir; bazı yardımcı RPC'ler,
  duyurulan özellik listesinde numaralandırılmadan
  `src/gateway/server-methods/*.ts` içinde uygulanır.

## Örnek çerçeveler

Bağlanma (ilk mesaj):

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

## En düşük düzey istemci (Node.js)

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

## Uçtan uca yöntem ekleme: işlenmiş örnek

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

Her ikisini de `ProtocolSchemas` içine ekleyin ve türleri dışa aktarın:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Doğrulama**

`src/gateway/protocol/index.ts` içinde bir AJV doğrulayıcıyı dışa aktarın:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Sunucu davranışı**

`src/gateway/server-methods/system.ts` içine bir işleyici ekleyin:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Bunu `src/gateway/server-methods.ts` içinde kaydedin (`systemHandlers` zaten birleştirilir),
ardından `"system.echo"` değerini
`src/gateway/server-methods-list.ts` içindeki `listGatewayMethods` girdisine ekleyin.

Yöntem operatör veya düğüm istemcileri tarafından çağrılabiliyorsa, kapsam zorlaması ile `hello-ok` özellik duyurusu uyumlu kalsın diye bunu
`src/gateway/method-scopes.ts` içinde de sınıflandırın.

4. **Yeniden üretin**

```bash
pnpm protocol:check
```

5. **Testler + belgeler**

`src/gateway/server.*.test.ts` içine bir sunucu testi ekleyin ve belgelerde yöntemden bahsedin.

## Swift codegen davranışı

Swift üreticisi şunları çıkarır:

- `req`, `res`, `event` ve `unknown` durumlarına sahip `GatewayFrame` enum'u
- Güçlü türlendirilmiş payload struct/enum'ları
- `ErrorCode` değerleri ve `GATEWAY_PROTOCOL_VERSION`

İleri uyumluluk için bilinmeyen çerçeve türleri ham payload olarak korunur.

## Sürümleme + uyumluluk

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu eşleşmezlikleri reddeder.
- Swift modelleri, eski istemcileri bozmamak için bilinmeyen çerçeve türlerini korur.

## Şema kalıpları ve kuralları

- Çoğu nesne, katı payload'lar için `additionalProperties: false` kullanır.
- `NonEmptyString`, kimlikler ve yöntem/olay adları için varsayılandır.
- Üst düzey `GatewayFrame`, `type` üzerinde bir **ayırt edici** kullanır.
- Yan etkili yöntemler genellikle parametrelerde bir `idempotencyKey` gerektirir
  (örnek: `send`, `poll`, `agent`, `chat.send`).
- `agent`, çalışma zamanında üretilen orkestrasyon bağlamı için isteğe bağlı `internalEvents` kabul eder
  (örneğin alt ajan/cron görevi tamamlama aktarımı); bunu iç API yüzeyi olarak değerlendirin.

## Canlı şema JSON

Üretilen JSON Schema repoda `dist/protocol.schema.json` içinde bulunur. Yayımlanmış ham dosya genellikle şu adreste bulunabilir:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Şemaları değiştirdiğinizde

1. TypeBox şemalarını güncelleyin.
2. Yöntemi/olayı `src/gateway/server-methods-list.ts` içinde kaydedin.
3. Yeni RPC operatör veya
   düğüm kapsamı sınıflandırması gerektiriyorsa `src/gateway/method-scopes.ts` dosyasını güncelleyin.
4. `pnpm protocol:check` çalıştırın.
5. Yeniden üretilen şema + Swift modellerini commit edin.
