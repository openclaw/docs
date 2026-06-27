---
read_when:
    - Memperbarui skema protokol atau codegen
summary: Skema TypeBox sebagai sumber kebenaran tunggal untuk protokol Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-06-27T17:27:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2f3da11e9dcf3250fd77e0c43f4ed918551a536d93fa71bce95eaf3d7539f6d
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox adalah pustaka skema yang mengutamakan TypeScript. Kami menggunakannya untuk mendefinisikan **protokol WebSocket Gateway** (handshake, permintaan/respons, peristiwa server). Skema tersebut menggerakkan **validasi runtime**, **ekspor JSON Schema**, dan **codegen Swift** untuk aplikasi macOS. Satu sumber kebenaran; yang lain dihasilkan secara otomatis.

Jika Anda menginginkan konteks protokol tingkat lebih tinggi, mulai dari
[arsitektur Gateway](/id/concepts/architecture).

## Model mental (30 detik)

Setiap pesan Gateway WS adalah salah satu dari tiga frame:

- **Permintaan**: `{ type: "req", id, method, params }`
- **Respons**: `{ type: "res", id, ok, payload | error }`
- **Peristiwa**: `{ type: "event", event, payload, seq?, stateVersion? }`

Frame pertama **harus** berupa permintaan `connect`. Setelah itu, klien dapat memanggil
metode (mis. `health`, `send`, `chat.send`) dan berlangganan peristiwa (mis.
`presence`, `tick`, `agent`).

Alur koneksi (minimal):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Metode + peristiwa umum:

| Kategori   | Contoh                                                     | Catatan                            |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Inti       | `connect`, `health`, `status`                              | `connect` harus pertama            |
| Pesan      | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | efek samping memerlukan `idempotencyKey` |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat menggunakan ini            |
| Sesi       | `sessions.list`, `sessions.patch`, `sessions.delete`       | admin sesi                         |
| Otomasi    | `wake`, `cron.list`, `cron.run`, `cron.runs`               | kontrol wake + cron                |
| Node       | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + aksi node             |
| Peristiwa  | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | push server                        |

Inventaris **discovery** resmi yang diiklankan berada di
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Tempat skema berada

- Sumber: `packages/gateway-protocol/src/schema.ts`
- Validator runtime (AJV): `packages/gateway-protocol/src/index.ts`
- Registry fitur/discovery yang diiklankan: `src/gateway/server-methods-list.ts`
- Handshake server + dispatch metode: `src/gateway/server.impl.ts`
- Klien Node: `src/gateway/client.ts`
- JSON Schema yang dihasilkan: `dist/protocol.schema.json`
- Model Swift yang dihasilkan: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline saat ini

- `pnpm protocol:gen`
  - menulis JSON Schema (draft-07) ke `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - menghasilkan model Gateway Swift
- `pnpm protocol:check`
  - menjalankan kedua generator dan memverifikasi output sudah di-commit

## Cara skema digunakan saat runtime

- **Sisi server**: setiap frame masuk divalidasi dengan AJV. Handshake hanya
  menerima permintaan `connect` yang parameternya cocok dengan `ConnectParams`.
- **Sisi klien**: klien JS memvalidasi frame peristiwa dan respons sebelum
  menggunakannya.
- **Discovery fitur**: Gateway mengirim daftar konservatif `features.methods`
  dan `features.events` dalam `hello-ok` dari `listGatewayMethods()` dan
  `GATEWAY_EVENTS`.
- Daftar discovery itu bukan dump yang dihasilkan otomatis dari setiap helper yang dapat dipanggil di
  `coreGatewayHandlers`; beberapa RPC helper diimplementasikan di
  `src/gateway/server-methods/*.ts` tanpa dicantumkan dalam daftar fitur yang diiklankan.

## Contoh frame

Connect (pesan pertama):

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

Respons hello-ok:

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
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Permintaan + respons:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Peristiwa:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Klien minimal (Node.js)

Alur berguna terkecil: connect + health.

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

## Contoh lengkap: menambahkan metode dari awal hingga akhir

Contoh: tambahkan permintaan `system.echo` baru yang mengembalikan `{ ok: true, text }`.

1. **Skema (sumber kebenaran)**

Tambahkan ke `packages/gateway-protocol/src/schema.ts`:

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

Tambahkan keduanya ke `ProtocolSchemas` dan ekspor tipe:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validasi**

Di `packages/gateway-protocol/src/index.ts`, ekspor validator AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Perilaku server**

Tambahkan handler di `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Daftarkan di `src/gateway/server-methods.ts` (sudah menggabungkan `systemHandlers`),
lalu tambahkan `"system.echo"` ke input `listGatewayMethods` di
`src/gateway/server-methods-list.ts`.

Jika metode dapat dipanggil oleh operator atau klien node, klasifikasikan juga di
`src/gateway/method-scopes.ts` agar penegakan cakupan dan iklan fitur `hello-ok`
tetap selaras.

4. **Hasilkan ulang**

```bash
pnpm protocol:check
```

5. **Pengujian + dokumentasi**

Tambahkan pengujian server di `src/gateway/server.*.test.ts` dan catat metode tersebut di dokumentasi.

## Perilaku codegen Swift

Generator Swift menghasilkan:

- enum `GatewayFrame` dengan kasus `req`, `res`, `event`, dan `unknown`
- struct/enum payload bertipe kuat
- nilai `ErrorCode`, `GATEWAY_PROTOCOL_VERSION`, dan `GATEWAY_MIN_PROTOCOL_VERSION`

Tipe frame yang tidak dikenal dipertahankan sebagai payload mentah untuk kompatibilitas ke depan.

## Versioning + kompatibilitas

- `PROTOCOL_VERSION` berada di `packages/gateway-protocol/src/version.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak rentang yang
  tidak menyertakan protokol saat ini.
- Model Swift mempertahankan tipe frame yang tidak dikenal agar tidak merusak klien lama.

## Pola dan konvensi skema

- Sebagian besar objek menggunakan `additionalProperties: false` untuk payload yang ketat.
- `NonEmptyString` adalah default untuk ID dan nama metode/peristiwa.
- `GatewayFrame` tingkat atas menggunakan **discriminator** pada `type`.
- Metode dengan efek samping biasanya memerlukan `idempotencyKey` dalam params
  (contoh: `send`, `poll`, `agent`, `chat.send`).
- `agent` menerima `internalEvents` opsional untuk konteks orkestrasi yang dihasilkan runtime
  (misalnya handoff penyelesaian tugas subagent/cron); perlakukan ini sebagai permukaan API internal.

## JSON skema live

JSON Schema yang dihasilkan ada di repo pada `dist/protocol.schema.json`. File mentah yang dipublikasikan biasanya tersedia di:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Saat Anda mengubah skema

1. Perbarui skema TypeBox.
2. Daftarkan metode/peristiwa di `src/gateway/server-methods-list.ts`.
3. Perbarui `src/gateway/method-scopes.ts` saat RPC baru memerlukan klasifikasi cakupan operator atau
   node.
4. Jalankan `pnpm protocol:check`.
5. Commit skema yang dihasilkan ulang + model Swift.

## Terkait

- [Protokol rich output](/id/reference/rich-output-protocol)
- [Adapter RPC](/id/reference/rpc)
