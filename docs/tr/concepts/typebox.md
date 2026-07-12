---
read_when:
    - Protokol şemalarını veya kod üretimini güncelleme
summary: Gateway protokolü için tek doğruluk kaynağı olarak TypeBox şemaları
title: TypeBox
x-i18n:
    generated_at: "2026-07-12T11:40:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox, TypeScript öncelikli bir şema kütüphanesidir. OpenClaw bunu **Gateway WebSocket protokolünü** (el sıkışma, istek/yanıt, sunucu olayları) tanımlamak için kullanır. Bu şemalar macOS uygulaması için **çalışma zamanı doğrulamasını** (AJV), **JSON Schema dışa aktarımını** ve **Swift kod üretimini** yönlendirir. Tek bir doğruluk kaynağı vardır; diğer her şey bundan üretilir.

Üst düzey protokol bağlamı için [Gateway mimarisi](/tr/concepts/architecture) ile başlayın.

## Zihinsel model (30 saniye)

Her Gateway WS iletisi şu üç çerçeveden biridir:

- **İstek**: `{ type: "req", id, method, params }`
- **Yanıt**: `{ type: "res", id, ok, payload | error }`
- **Olay**: `{ type: "event", event, payload, seq?, stateVersion? }`

İlk çerçeve bir `connect` isteği **olmalıdır**. Bundan sonra istemciler yöntemleri çağırır (ör. `health`, `send`, `chat.send`) ve olaylara abone olur (ör. `presence`, `tick`, `agent`).

Bağlantı akışı (asgari):

```text
İstemci                  Gateway
  |---- istek:connect ------>|
  |<---- yanıt:hello-ok ------|
  |<---- olay:tick -----------|
  |---- istek:health -------->|
  |<---- yanıt:health --------|
```

Yaygın yöntemler ve olaylar:

| Kategori     | Örnekler                                                   | Notlar                                           |
| ------------ | ---------------------------------------------------------- | ------------------------------------------------ |
| Çekirdek     | `connect`, `health`, `status`                              | `connect` ilk olmalıdır                          |
| Mesajlaşma   | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | yan etkili yöntemler `idempotencyKey` gerektirir |
| Sohbet       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat bunları kullanır                         |
| Oturumlar    | `sessions.list`, `sessions.patch`, `sessions.delete`       | oturum yönetimi                                  |
| Otomasyon    | `wake`, `cron.list`, `cron.run`, `cron.runs`               | uyandırma ve cron denetimi                       |
| Node'lar     | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS ve node eylemleri                     |
| Olaylar      | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | sunucudan anlık gönderim                         |

Yetkili olarak duyurulan **keşif** envanteri `src/gateway/server-methods-list.ts` içindeki `listGatewayMethods` ve `GATEWAY_EVENTS` öğelerinde bulunur.

## Şemaların bulunduğu yer

- Kaynak dışa aktarım dosyası: `packages/gateway-protocol/src/schema.ts`, `packages/gateway-protocol/src/schema/*.ts` altındaki etki alanı modüllerini yeniden dışa aktarır (üst düzey zarflar ve el sıkışma için `frames.ts`; özellik alanına göre `agent.ts`, `sessions.ts`, `cron.ts` vb.). `protocol-schemas.ts`, şema adlarını TypeBox tanımlarıyla eşleyen merkezi `ProtocolSchemas` kayıt defteridir.
- Çalışma zamanı doğrulayıcıları (AJV): `packages/gateway-protocol/src/index.ts`
- Duyurulan özellik/keşif kayıt defteri: `src/gateway/server-methods-list.ts`
- Sunucu el sıkışması ve yöntem yönlendirmesi: `src/gateway/server.impl.ts`
- Node istemcisi: `src/gateway/client.ts`
- Üretilen JSON Schema: `dist/protocol.schema.json` (derleme çıktısıdır, depoya kaydedilmez)
- Üretilen Swift modelleri: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## Güncel işlem hattı

- `pnpm protocol:gen`, JSON Schema'yı (draft-07) `dist/protocol.schema.json` konumuna yazar.
- `pnpm protocol:gen:swift`, Swift Gateway modellerini üretir.
- `pnpm protocol:check`, her iki üreticiyi de çalıştırır ve Swift çıktısının depoya kaydedildiğini doğrular (JSON Schema çıktısı, git tarafından yok sayılan bir derleme eseridir).

## Şemaların çalışma zamanında kullanımı

- **Sunucu tarafı**: Gelen her çerçeve AJV ile doğrulanır. El sıkışma yalnızca parametreleri `ConnectParams` ile eşleşen bir `connect` isteğini kabul eder.
- **İstemci tarafı**: JS istemcisi, olay ve yanıt çerçevelerini kullanmadan önce doğrular.
- **Özellik keşfi**: Gateway, `listGatewayMethods()` ve `GATEWAY_EVENTS` kaynaklarından alınan ihtiyatlı bir `features.methods` ve `features.events` listesini `hello-ok` içinde gönderir.
- Bu keşif listesi, `coreGatewayHandlers` içindeki çağrılabilir her yardımcının üretilmiş bir dökümü değildir; bazı yardımcı RPC'ler, duyurulan özellik listesinde numaralandırılmadan `src/gateway/server-methods/*.ts` içinde uygulanır.

## Örnek çerçeveler

Bağlanma (ilk ileti):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
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
    "protocol": 4,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "auth": { "role": "operator", "scopes": ["operator.read"] },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

İstek ve yanıt:

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

Kullanışlı en küçük akış: bağlanma + sistem durumu.

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
        minProtocol: 4,
        maxProtocol: 4,
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

## Uygulamalı örnek: uçtan uca yöntem ekleme

Örnek: `{ ok: true, text }` döndüren yeni bir `system.echo` isteği ekleyin.

1. **Şema (doğruluk kaynağı)**

`packages/gateway-protocol/src/schema/system.ts` dosyasına (veya en yakın eşleşen özellik modülüne) ekleyin:

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

Her ikisini de `packages/gateway-protocol/src/schema/protocol-schemas.ts` içine aktarın, `ProtocolSchemas` kayıt defterine ekleyin ve türetilmiş türleri dışa aktarın:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Doğrulama**

`packages/gateway-protocol/src/index.ts` içinde bir AJV doğrulayıcısını dışa aktarın:

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

Bunu `src/gateway/server-methods.ts` içinde kaydedin (`systemHandlers` zaten birleştirilir), ardından `"system.echo"` öğesini `src/gateway/server-methods-list.ts` içindeki `listGatewayMethods` girdisine ekleyin.

Yöntem operatör veya node istemcileri tarafından çağrılabiliyorsa kapsam zorlaması ile `hello-ok` özellik duyurusunun uyumlu kalması için yöntemi ayrıca `src/gateway/method-scopes.ts` içinde sınıflandırın.

4. **Yeniden üretme**

```bash
pnpm protocol:check
```

5. **Testler ve belgeler**

`src/gateway/server.*.test.ts` içine bir sunucu testi ekleyin ve yöntemi belgelerde belirtin.

## Swift kod üretimi davranışı

Swift üreticisi şunları oluşturur:

- `req`, `res`, `event` ve `unknown` durumlarını içeren bir `GatewayFrame` enum'u
- kesin türlendirilmiş yük struct'ları/enum'ları
- `ErrorCode` değerleri, `GATEWAY_PROTOCOL_VERSION` ve `GATEWAY_MIN_PROTOCOL_VERSION`

Bilinmeyen çerçeve türleri, ileriye dönük uyumluluk için ham yükler olarak korunur.

## Sürümleme ve uyumluluk

- `PROTOCOL_VERSION`, `packages/gateway-protocol/src/version.ts` içinde bulunur (güncel değer: `4`).
- İstemciler `minProtocol` ve `maxProtocol` gönderir; sunucu, güncel protokolünü içermeyen aralıkları reddeder.
- Swift modelleri, eski istemcilerin bozulmasını önlemek için bilinmeyen çerçeve türlerini korur.

## Şema kalıpları ve kuralları

- Çoğu nesne, katı yükler için `additionalProperties: false` kullanır.
- Kimlikler ve yöntem/olay adları için varsayılan değer `NonEmptyString` (`Type.String({ minLength: 1 })`) olur.
- Üst düzey `GatewayFrame`, `type` üzerinde bir **ayırt edici** kullanır.
- Yan etkileri olan yöntemler genellikle parametrelerde bir `idempotencyKey` gerektirir (örnek: `send`, `poll`, `agent`, `chat.send`).
- `agent`, çalışma zamanında üretilen düzenleme bağlamı için isteğe bağlı `internalEvents` kabul eder (örneğin alt ajan/cron görevi tamamlama devri); bunu dahili API yüzeyi olarak değerlendirin.

## Canlı şema JSON'u

Üretilen JSON Schema bir derleme eseridir ve depoya kaydedilmez. Yayımlanan ham dosya genellikle şu adreste bulunur:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Şemaları değiştirdiğinizde

1. Sahibi olan `packages/gateway-protocol/src/schema/*.ts` modülündeki TypeBox şemalarını güncelleyin ve bunları `protocol-schemas.ts` içine kaydedin.
2. Yöntemi/olayı `src/gateway/server-methods-list.ts` içine kaydedin.
3. Yeni RPC'nin operatör veya node kapsamı sınıflandırmasına ihtiyaç duyması durumunda `src/gateway/method-scopes.ts` dosyasını güncelleyin.
4. `pnpm protocol:check` komutunu çalıştırın.
5. Yeniden üretilen Swift modellerini depoya kaydedin.

## İlgili

- [Zengin çıktı protokolü](/tr/reference/rich-output-protocol)
- [RPC bağdaştırıcıları](/tr/reference/rpc)
