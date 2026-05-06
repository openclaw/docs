---
read_when:
    - Protokol şemalarını veya kod üretimini güncelleme
summary: Gateway protokolü için tek doğruluk kaynağı olarak TypeBox şemaları
title: TypeBox
x-i18n:
    generated_at: "2026-05-06T09:10:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e188ec0fefcbaf01c8b575a1898eafbbcf309d3032930aa0c09c2d9a63b93e5
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox, TypeScript öncelikli bir şema kitaplığıdır. Onu **Gateway
WebSocket protokolünü** (el sıkışma, istek/yanıt, sunucu olayları) tanımlamak için kullanırız. Bu şemalar
macOS uygulaması için **çalışma zamanı doğrulamasını**, **JSON Schema dışa aktarımını** ve **Swift kod üretimini**
yönlendirir. Tek doğruluk kaynağı; geri kalan her şey üretilir.

Daha üst düzey protokol bağlamını istiyorsanız
[Gateway mimarisi](/tr/concepts/architecture) ile başlayın.

## Zihinsel model (30 saniye)

Her Gateway WS iletisi üç çerçeveden biridir:

- **İstek**: `{ type: "req", id, method, params }`
- **Yanıt**: `{ type: "res", id, ok, payload | error }`
- **Olay**: `{ type: "event", event, payload, seq?, stateVersion? }`

İlk çerçeve **mutlaka** bir `connect` isteği olmalıdır. Bundan sonra istemciler
yöntemleri çağırabilir (örn. `health`, `send`, `chat.send`) ve olaylara abone olabilir (örn.
`presence`, `tick`, `agent`).

Bağlantı akışı (asgari):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Yaygın yöntemler + olaylar:

| Kategori   | Örnekler                                                   | Notlar                              |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Çekirdek   | `connect`, `health`, `status`                              | `connect` ilk olmalıdır            |
| Mesajlaşma | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | yan etkiler `idempotencyKey` gerektirir |
| Sohbet     | `chat.history`, `chat.send`, `chat.abort`                  | WebChat bunları kullanır           |
| Oturumlar  | `sessions.list`, `sessions.patch`, `sessions.delete`       | oturum yönetimi                    |
| Otomasyon  | `wake`, `cron.list`, `cron.run`, `cron.runs`               | uyandırma + cron denetimi          |
| Düğümler   | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + düğüm eylemleri       |
| Olaylar    | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | sunucu gönderimi                   |

Yetkili olarak duyurulan **keşif** envanteri
`src/gateway/server-methods-list.ts` içinde bulunur (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Şemaların bulunduğu yer

- Kaynak: `src/gateway/protocol/schema.ts`
- Çalışma zamanı doğrulayıcıları (AJV): `src/gateway/protocol/index.ts`
- Duyurulan özellik/keşif kayıt defteri: `src/gateway/server-methods-list.ts`
- Sunucu el sıkışması + yöntem yönlendirme: `src/gateway/server.impl.ts`
- Node istemcisi: `src/gateway/client.ts`
- Üretilen JSON Schema: `dist/protocol.schema.json`
- Üretilen Swift modelleri: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Mevcut işlem hattı

- `pnpm protocol:gen`
  - JSON Schema'yı (draft-07) `dist/protocol.schema.json` konumuna yazar
- `pnpm protocol:gen:swift`
  - Swift gateway modellerini üretir
- `pnpm protocol:check`
  - iki üreticiyi de çalıştırır ve çıktının commit edildiğini doğrular

## Şemalar çalışma zamanında nasıl kullanılır?

- **Sunucu tarafı**: gelen her çerçeve AJV ile doğrulanır. El sıkışma yalnızca
  parametreleri `ConnectParams` ile eşleşen bir `connect` isteğini kabul eder.
- **İstemci tarafı**: JS istemcisi, olay ve yanıt çerçevelerini kullanmadan önce
  doğrular.
- **Özellik keşfi**: Gateway, `listGatewayMethods()` ve
  `GATEWAY_EVENTS` üzerinden `hello-ok` içinde tutucu bir `features.methods`
  ve `features.events` listesi gönderir.
- Bu keşif listesi, `coreGatewayHandlers` içindeki her çağrılabilir yardımcı işlevin
  üretilmiş bir dökümü değildir; bazı yardımcı RPC'ler duyurulan
  özellik listesinde sıralanmadan `src/gateway/server-methods/*.ts` içinde uygulanır.

## Örnek çerçeveler

Connect (ilk ileti):

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

## Asgari istemci (Node.js)

En küçük yararlı akış: connect + health.

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

## Çalışılmış örnek: uçtan uca bir yöntem ekleme

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

İkisini de `ProtocolSchemas` içine ekleyin ve türleri dışa aktarın:

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

`src/gateway/server-methods/system.ts` içinde bir işleyici ekleyin:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Bunu `src/gateway/server-methods.ts` içinde kaydedin (`systemHandlers` zaten birleştirilir),
ardından `src/gateway/server-methods-list.ts` içindeki `listGatewayMethods` girdisine
`"system.echo"` ekleyin.

Yöntem operatör veya düğüm istemcileri tarafından çağrılabiliyorsa,
kapsam zorlaması ve `hello-ok` özellik duyurumu uyumlu kalsın diye bunu
`src/gateway/method-scopes.ts` içinde de sınıflandırın.

4. **Yeniden üretme**

```bash
pnpm protocol:check
```

5. **Testler + belgeler**

`src/gateway/server.*.test.ts` içinde bir sunucu testi ekleyin ve yöntemi belgelerde belirtin.

## Swift kod üretimi davranışı

Swift üreticisi şunları yayar:

- `req`, `res`, `event` ve `unknown` durumlarını içeren `GatewayFrame` enum'u
- Güçlü türlendirilmiş yük struct/enum'ları
- `ErrorCode` değerleri ve `GATEWAY_PROTOCOL_VERSION`

Bilinmeyen çerçeve türleri, ileriye dönük uyumluluk için ham yükler olarak korunur.

## Sürümleme + uyumluluk

- `PROTOCOL_VERSION`, `src/gateway/protocol/schema.ts` içinde bulunur.
- İstemciler `minProtocol` + `maxProtocol` gönderir; sunucu uyumsuzlukları reddeder.
- Swift modelleri, eski istemcileri bozmamak için bilinmeyen çerçeve türlerini korur.

## Şema kalıpları ve kurallar

- Çoğu nesne, katı yükler için `additionalProperties: false` kullanır.
- `NonEmptyString`, kimlikler ve yöntem/olay adları için varsayılandır.
- Üst düzey `GatewayFrame`, `type` üzerinde bir **discriminator** kullanır.
- Yan etkileri olan yöntemler genellikle params içinde bir `idempotencyKey` gerektirir
  (örnek: `send`, `poll`, `agent`, `chat.send`).
- `agent`, çalışma zamanında üretilen orkestrasyon bağlamı için isteğe bağlı `internalEvents` kabul eder
  (örneğin alt ajan/cron görevi tamamlama devri); bunu dahili API yüzeyi olarak ele alın.

## Canlı şema JSON'u

Üretilen JSON Schema depoda `dist/protocol.schema.json` konumundadır. Yayımlanan
ham dosya genellikle şu adreste bulunur:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Şemaları değiştirdiğinizde

1. TypeBox şemalarını güncelleyin.
2. Yöntemi/olayı `src/gateway/server-methods-list.ts` içinde kaydedin.
3. Yeni RPC operatör veya
   düğüm kapsamı sınıflandırması gerektirdiğinde `src/gateway/method-scopes.ts` dosyasını güncelleyin.
4. `pnpm protocol:check` çalıştırın.
5. Yeniden üretilen şemayı + Swift modellerini commit edin.

## İlgili

- [Zengin çıktı protokolü](/tr/reference/rich-output-protocol)
- [RPC bağdaştırıcıları](/tr/reference/rpc)
