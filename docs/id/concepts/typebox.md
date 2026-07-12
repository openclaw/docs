---
read_when:
    - Memperbarui skema protokol atau pembuatan kode
summary: Skema TypeBox sebagai satu-satunya sumber kebenaran untuk protokol Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-07-12T14:07:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox adalah pustaka skema yang mengutamakan TypeScript. OpenClaw menggunakannya untuk mendefinisikan **protokol WebSocket Gateway** (handshake, permintaan/respons, peristiwa server). Skema tersebut menggerakkan **validasi runtime** (AJV), **ekspor JSON Schema**, dan **pembuatan kode Swift** untuk aplikasi macOS. Satu sumber kebenaran; semua yang lain dihasilkan darinya.

Untuk konteks protokol tingkat lebih tinggi, mulailah dengan [arsitektur Gateway](/id/concepts/architecture).

## Model mental (30 detik)

Setiap pesan WS Gateway merupakan salah satu dari tiga frame:

- **Permintaan**: `{ type: "req", id, method, params }`
- **Respons**: `{ type: "res", id, ok, payload | error }`
- **Peristiwa**: `{ type: "event", event, payload, seq?, stateVersion? }`

Frame pertama **harus** berupa permintaan `connect`. Setelah itu, klien memanggil metode (misalnya `health`, `send`, `chat.send`) dan berlangganan peristiwa (misalnya `presence`, `tick`, `agent`).

Alur koneksi (minimal):

```text
Klien                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Metode dan peristiwa umum:

| Kategori   | Contoh                                                     | Catatan                                             |
| ---------- | ---------------------------------------------------------- | --------------------------------------------------- |
| Inti       | `connect`, `health`, `status`                              | `connect` harus menjadi yang pertama                |
| Pesan      | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | metode dengan efek samping memerlukan `idempotencyKey` |
| Obrolan    | `chat.history`, `chat.send`, `chat.abort`                  | WebChat menggunakan metode ini                      |
| Sesi       | `sessions.list`, `sessions.patch`, `sessions.delete`       | administrasi sesi                                   |
| Otomatisasi | `wake`, `cron.list`, `cron.run`, `cron.runs`              | kontrol wake dan cron                               |
| Node       | `node.list`, `node.invoke`, `node.pair.*`                  | WS Gateway ditambah tindakan node                   |
| Peristiwa  | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | pengiriman otomatis dari server                     |

Inventaris **penemuan** resmi yang diumumkan berada di `src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Lokasi skema

- Barrel sumber: `packages/gateway-protocol/src/schema.ts` mengekspor ulang modul domain di bawah `packages/gateway-protocol/src/schema/*.ts` (`frames.ts` untuk envelope tingkat atas dan handshake, serta `agent.ts`, `sessions.ts`, `cron.ts`, dan sebagainya untuk setiap area fitur). `protocol-schemas.ts` adalah registri pusat `ProtocolSchemas` yang memetakan nama skema ke definisi TypeBox-nya.
- Validator runtime (AJV): `packages/gateway-protocol/src/index.ts`
- Registri fitur/penemuan yang diumumkan: `src/gateway/server-methods-list.ts`
- Handshake server dan pengiriman metode: `src/gateway/server.impl.ts`
- Klien Node: `src/gateway/client.ts`
- JSON Schema yang dihasilkan: `dist/protocol.schema.json` (keluaran build, tidak di-commit)
- Model Swift yang dihasilkan: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## Alur saat ini

- `pnpm protocol:gen` menulis JSON Schema (draft-07) ke `dist/protocol.schema.json`.
- `pnpm protocol:gen:swift` menghasilkan model Gateway Swift.
- `pnpm protocol:check` menjalankan kedua generator dan memverifikasi bahwa keluaran Swift telah di-commit (keluaran JSON Schema adalah artefak build yang diabaikan Git).

## Cara skema digunakan saat runtime

- **Sisi server**: setiap frame masuk divalidasi dengan AJV. Handshake hanya menerima permintaan `connect` yang parameternya cocok dengan `ConnectParams`.
- **Sisi klien**: klien JS memvalidasi frame peristiwa dan respons sebelum menggunakannya.
- **Penemuan fitur**: Gateway mengirim daftar konservatif `features.methods` dan `features.events` dalam `hello-ok`, dari `listGatewayMethods()` dan `GATEWAY_EVENTS`.
- Daftar penemuan tersebut bukan hasil pembuatan otomatis yang memuat setiap helper yang dapat dipanggil dalam `coreGatewayHandlers`; beberapa RPC helper diterapkan dalam `src/gateway/server-methods/*.ts` tanpa dicantumkan dalam daftar fitur yang diumumkan.

## Contoh frame

Koneksi (pesan pertama):

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
    "auth": { "role": "operator", "scopes": ["operator.read"] },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Permintaan dan respons:

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

Alur berguna paling sederhana: koneksi + pemeriksaan kesehatan.

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

Tambahkan ke `packages/gateway-protocol/src/schema/system.ts` (atau modul fitur terdekat yang sesuai):

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

Impor keduanya ke `packages/gateway-protocol/src/schema/protocol-schemas.ts`, tambahkan ke registri `ProtocolSchemas`, lalu ekspor tipe turunannya:

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

Daftarkan di `src/gateway/server-methods.ts` (yang sudah menggabungkan `systemHandlers`), lalu tambahkan `"system.echo"` ke input `listGatewayMethods` di `src/gateway/server-methods-list.ts`.

Jika metode tersebut dapat dipanggil oleh klien operator atau node, klasifikasikan juga di `src/gateway/method-scopes.ts` agar penerapan cakupan dan pengumuman fitur `hello-ok` tetap selaras.

4. **Buat ulang**

```bash
pnpm protocol:check
```

5. **Pengujian dan dokumentasi**

Tambahkan pengujian server di `src/gateway/server.*.test.ts` dan catat metode tersebut dalam dokumentasi.

## Perilaku pembuatan kode Swift

Generator Swift menghasilkan:

- enum `GatewayFrame` dengan kasus `req`, `res`, `event`, dan `unknown`
- struct/enum payload dengan tipe yang kuat
- nilai `ErrorCode`, `GATEWAY_PROTOCOL_VERSION`, dan `GATEWAY_MIN_PROTOCOL_VERSION`

Jenis frame yang tidak dikenal dipertahankan sebagai payload mentah untuk kompatibilitas ke depan.

## Pembuatan versi dan kompatibilitas

- `PROTOCOL_VERSION` berada di `packages/gateway-protocol/src/version.ts` (nilai saat ini: `4`).
- Klien mengirim `minProtocol` dan `maxProtocol`; server menolak rentang yang tidak mencakup protokolnya saat ini.
- Model Swift mempertahankan jenis frame yang tidak dikenal agar tidak merusak klien lama.

## Pola dan konvensi skema

- Sebagian besar objek menggunakan `additionalProperties: false` untuk payload yang ketat.
- `NonEmptyString` (`Type.String({ minLength: 1 })`) adalah nilai baku untuk ID serta nama metode/peristiwa.
- `GatewayFrame` tingkat atas menggunakan **diskriminator** pada `type`.
- Metode dengan efek samping biasanya memerlukan `idempotencyKey` dalam parameter (contoh: `send`, `poll`, `agent`, `chat.send`).
- `agent` menerima `internalEvents` opsional untuk konteks orkestrasi yang dihasilkan runtime (misalnya serah terima penyelesaian tugas subagen/cron); perlakukan ini sebagai permukaan API internal.

## JSON skema langsung

JSON Schema yang dihasilkan adalah artefak build dan tidak di-commit ke repositori. Berkas mentah yang dipublikasikan biasanya tersedia di:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Saat Anda mengubah skema

1. Perbarui skema TypeBox dalam modul pemilik `packages/gateway-protocol/src/schema/*.ts` dan daftarkan di `protocol-schemas.ts`.
2. Daftarkan metode/peristiwa di `src/gateway/server-methods-list.ts`.
3. Perbarui `src/gateway/method-scopes.ts` ketika RPC baru memerlukan klasifikasi cakupan operator atau node.
4. Jalankan `pnpm protocol:check`.
5. Commit model Swift yang dibuat ulang.

## Terkait

- [Protokol keluaran kaya](/id/reference/rich-output-protocol)
- [Adaptor RPC](/id/reference/rpc)
