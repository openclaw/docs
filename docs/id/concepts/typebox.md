---
read_when:
    - Memperbarui skema protokol atau pembuatan kode
summary: Skema TypeBox sebagai sumber kebenaran tunggal untuk protokol Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-11T20:28:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecc9a69ac6d4ac101a4a6f34e44acfbe952dce0f90d178d4f8559191fb92c3b4
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox adalah pustaka skema yang mengutamakan TypeScript. Kami menggunakannya untuk mendefinisikan **protokol WebSocket Gateway** (handshake, request/response, event server). Skema tersebut menggerakkan **validasi runtime**, **ekspor JSON Schema**, dan **codegen Swift** untuk aplikasi macOS. Satu sumber kebenaran; yang lainnya dihasilkan.

Jika Anda menginginkan konteks protokol tingkat lebih tinggi, mulai dari
[Arsitektur Gateway](/id/concepts/architecture).

## Model mental (30 detik)

Setiap pesan Gateway WS adalah salah satu dari tiga frame:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

Frame pertama **harus** berupa request `connect`. Setelah itu, klien dapat memanggil
method (misalnya `health`, `send`, `chat.send`) dan berlangganan event (misalnya
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

Method + event umum:

| Kategori   | Contoh                                                     | Catatan                            |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Inti       | `connect`, `health`, `status`                              | `connect` harus pertama            |
| Perpesanan | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | efek samping perlu `idempotencyKey` |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat menggunakan ini            |
| Sesi       | `sessions.list`, `sessions.patch`, `sessions.delete`       | administrasi sesi                  |
| Otomasi    | `wake`, `cron.list`, `cron.run`, `cron.runs`               | kontrol wake + cron                |
| Node       | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + tindakan node         |
| Event      | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | push server                        |

Inventaris **discovery** yang diiklankan dan otoritatif berada di
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Lokasi skema

- Sumber: `src/gateway/protocol/schema.ts`
- Validator runtime (AJV): `src/gateway/protocol/index.ts`
- Registri fitur/discovery yang diiklankan: `src/gateway/server-methods-list.ts`
- Handshake server + dispatch method: `src/gateway/server.impl.ts`
- Klien Node: `src/gateway/client.ts`
- JSON Schema yang dihasilkan: `dist/protocol.schema.json`
- Model Swift yang dihasilkan: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Pipeline saat ini

- `pnpm protocol:gen`
  - menulis JSON Schema (draft-07) ke `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - menghasilkan model gateway Swift
- `pnpm protocol:check`
  - menjalankan kedua generator dan memverifikasi output sudah di-commit

## Cara skema digunakan saat runtime

- **Sisi server**: setiap frame masuk divalidasi dengan AJV. Handshake hanya
  menerima request `connect` yang parameternya cocok dengan `ConnectParams`.
- **Sisi klien**: klien JS memvalidasi frame event dan response sebelum
  menggunakannya.
- **Discovery fitur**: Gateway mengirim daftar `features.methods`
  dan `features.events` yang konservatif dalam `hello-ok` dari `listGatewayMethods()` dan
  `GATEWAY_EVENTS`.
- Daftar discovery tersebut bukan dump yang dihasilkan dari semua helper yang dapat dipanggil di
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

Response hello-ok:

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

Request + response:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Event:

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

## Contoh lengkap: menambahkan method end-to-end

Contoh: tambahkan request `system.echo` baru yang mengembalikan `{ ok: true, text }`.

1. **Skema (sumber kebenaran)**

Tambahkan ke `src/gateway/protocol/schema.ts`:

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

Di `src/gateway/protocol/index.ts`, ekspor validator AJV:

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

Jika method dapat dipanggil oleh operator atau klien node, klasifikasikan juga di
`src/gateway/method-scopes.ts` agar penegakan scope dan iklan fitur `hello-ok`
tetap selaras.

4. **Hasilkan ulang**

```bash
pnpm protocol:check
```

5. **Test + dokumen**

Tambahkan test server di `src/gateway/server.*.test.ts` dan catat method tersebut di dokumen.

## Perilaku codegen Swift

Generator Swift menghasilkan:

- enum `GatewayFrame` dengan case `req`, `res`, `event`, dan `unknown`
- struct/enum payload yang bertipe kuat
- nilai `ErrorCode`, `GATEWAY_PROTOCOL_VERSION`, dan `GATEWAY_MIN_PROTOCOL_VERSION`

Tipe frame yang tidak dikenal dipertahankan sebagai payload mentah untuk kompatibilitas ke depan.

## Versioning + kompatibilitas

- `PROTOCOL_VERSION` berada di `src/gateway/protocol/version.ts`.
- Klien mengirim `minProtocol` + `maxProtocol`; server menolak rentang yang
  tidak menyertakan protokol saat ini.
- Model Swift mempertahankan tipe frame yang tidak dikenal agar klien lama tidak rusak.

## Pola dan konvensi skema

- Sebagian besar objek menggunakan `additionalProperties: false` untuk payload ketat.
- `NonEmptyString` adalah default untuk ID dan nama method/event.
- `GatewayFrame` tingkat atas menggunakan **discriminator** pada `type`.
- Method dengan efek samping biasanya memerlukan `idempotencyKey` dalam params
  (contoh: `send`, `poll`, `agent`, `chat.send`).
- `agent` menerima `internalEvents` opsional untuk konteks orkestrasi yang dihasilkan runtime
  (misalnya handoff penyelesaian tugas subagent/cron); perlakukan ini sebagai permukaan API internal.

## JSON skema live

JSON Schema yang dihasilkan ada di repo pada `dist/protocol.schema.json`. File mentah
yang dipublikasikan biasanya tersedia di:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Saat Anda mengubah skema

1. Perbarui skema TypeBox.
2. Daftarkan method/event di `src/gateway/server-methods-list.ts`.
3. Perbarui `src/gateway/method-scopes.ts` saat RPC baru memerlukan klasifikasi scope operator atau
   node.
4. Jalankan `pnpm protocol:check`.
5. Commit skema + model Swift yang dihasilkan ulang.

## Terkait

- [Protokol rich output](/id/reference/rich-output-protocol)
- [Adapter RPC](/id/reference/rpc)
