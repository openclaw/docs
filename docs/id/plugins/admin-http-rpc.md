---
read_when:
    - Membangun perkakas host yang tidak dapat menggunakan klien RPC WebSocket Gateway
    - Mengekspos otomatisasi admin Gateway di balik ingress privat tepercaya
    - Mengaudit model keamanan untuk akses HTTP ke metode Gateway
summary: Mengekspos metode control-plane Gateway yang dipilih melalui plugin admin-http-rpc bawaan yang bersifat opt-in
title: Plugin RPC HTTP admin
x-i18n:
    generated_at: "2026-06-27T17:43:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Plugin bawaan `admin-http-rpc` mengekspos metode bidang kontrol Gateway tertentu melalui HTTP untuk otomatisasi host tepercaya yang tidak dapat menggunakan klien RPC WebSocket Gateway normal.

Plugin ini disertakan dengan OpenClaw, tetapi nonaktif secara bawaan. Saat dinonaktifkan, rute tidak didaftarkan. Saat diaktifkan, Plugin ini menambahkan:

- `POST /api/v1/admin/rpc`
- listener yang sama dengan Gateway: `http://<gateway-host>:<port>/api/v1/admin/rpc`

Aktifkan hanya untuk alat host privat, otomatisasi tailnet, atau ingress internal tepercaya. Jangan mengekspos rute ini langsung ke internet publik.

## Sebelum Anda mengaktifkannya

Admin HTTP RPC adalah permukaan bidang kontrol operator penuh. Pemanggil apa pun yang lolos autentikasi HTTP Gateway dapat memanggil metode yang masuk daftar izin di halaman ini.

Gunakan ini saat semua hal berikut benar:

- Pemanggil dipercaya untuk mengoperasikan Gateway.
- Pemanggil tidak dapat menggunakan klien RPC WebSocket.
- Rute hanya dapat dijangkau di loopback, tailnet, atau ingress privat yang terautentikasi.
- Anda telah meninjau metode yang diizinkan dan metode tersebut sesuai dengan otomatisasi yang Anda rencanakan untuk dijalankan.

Gunakan jalur RPC WebSocket untuk klien OpenClaw dan alat interaktif yang dapat mempertahankan koneksi WebSocket Gateway tetap terbuka.

## Aktifkan

Aktifkan Plugin bawaan:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Rute didaftarkan saat startup Plugin. Mulai ulang Gateway setelah mengubah konfigurasi Plugin.

Nonaktifkan saat Anda tidak lagi memerlukan permukaan HTTP:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Verifikasi rute

Gunakan `health` sebagai permintaan aman terkecil:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

Respons yang berhasil memiliki `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

Saat Plugin dinonaktifkan, rute mengembalikan `404` karena tidak didaftarkan.

## Autentikasi

Rute Plugin menggunakan autentikasi HTTP Gateway.

Jalur autentikasi umum:

- autentikasi rahasia bersama (`gateway.auth.mode="token"` atau `"password"`): `Authorization: Bearer <token-or-password>`
- autentikasi HTTP pembawa identitas tepercaya (`gateway.auth.mode="trusted-proxy"`): rutekan melalui proxy sadar identitas yang dikonfigurasi dan biarkan proxy menyuntikkan header identitas yang diperlukan
- autentikasi terbuka ingress privat (`gateway.auth.mode="none"`): tidak memerlukan header autentikasi

## Model keamanan

Perlakukan Plugin ini sebagai permukaan operator Gateway penuh.

- Mengaktifkan Plugin secara sengaja memberikan akses ke metode RPC admin yang masuk daftar izin di `/api/v1/admin/rpc`.
- Plugin mendeklarasikan kontrak manifes `contracts.gatewayMethodDispatch: ["authenticated-request"]` yang dicadangkan agar rute HTTP yang diautentikasi Gateway dapat mendispatch metode bidang kontrol di dalam proses.
- Autentikasi bearer rahasia bersama membuktikan kepemilikan rahasia operator gateway.
- Untuk autentikasi `token` dan `password`, header `x-openclaw-scopes` yang lebih sempit diabaikan dan default operator penuh normal dipulihkan.
- Mode HTTP pembawa identitas tepercaya menghormati `x-openclaw-scopes` saat ada.
- `gateway.auth.mode="none"` berarti rute ini tidak terautentikasi jika Plugin diaktifkan. Gunakan itu hanya di balik ingress privat yang sepenuhnya Anda percaya.
- Permintaan didispatch melalui handler metode Gateway dan pemeriksaan cakupan yang sama seperti RPC WebSocket setelah autentikasi rute Plugin lolos.
- Pertahankan rute ini pada loopback, tailnet, atau ingress privat tepercaya. Jangan mengeksposnya langsung ke internet publik.
- Kontrak manifes Plugin bukan sandbox. Kontrak tersebut mencegah penggunaan tidak sengaja atas helper SDK yang dicadangkan; Plugin tepercaya tetap berjalan di dalam proses Gateway.

Gunakan gateway terpisah saat pemanggil melintasi batas kepercayaan.

## Permintaan

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

Bidang:

- `id` (string, opsional): disalin ke dalam respons. UUID dibuat saat dihilangkan.
- `method` (string, wajib): nama metode Gateway yang diizinkan.
- `params` (apa pun, opsional): params khusus metode.

Ukuran badan permintaan maksimum bawaan adalah 1 MB.

## Respons

Respons berhasil menggunakan bentuk RPC Gateway:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

Kesalahan metode Gateway menggunakan:

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

Status HTTP mengikuti kesalahan Gateway jika memungkinkan. Misalnya, `INVALID_REQUEST` mengembalikan `400`, dan `UNAVAILABLE` mengembalikan `503`.

## Metode yang diizinkan

- discovery: `commands.list`
  Mengembalikan nama metode HTTP RPC yang diizinkan oleh Plugin ini.
- gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- config: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- channels: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- models: `models.list`, `models.authStatus`
- agents: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- approvals: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- devices: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- nodes: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- tasks: `tasks.list`, `tasks.get`, `tasks.cancel`
- diagnostics: `doctor.memory.status`, `update.status`

Metode Gateway lainnya diblokir sampai metode tersebut sengaja ditambahkan.

## Perbandingan WebSocket

Jalur RPC WebSocket Gateway normal tetap menjadi API bidang kontrol yang disukai untuk klien OpenClaw. Gunakan admin HTTP RPC hanya untuk alat host yang memerlukan permukaan HTTP permintaan/respons.

Klien WebSocket token bersama tanpa identitas perangkat tepercaya tidak dapat mendeklarasikan sendiri cakupan admin saat terhubung. Admin HTTP RPC secara sengaja mengikuti model operator HTTP tepercaya yang sudah ada: saat Plugin diaktifkan, autentikasi bearer rahasia bersama diperlakukan sebagai akses operator penuh untuk permukaan admin ini.

## Pemecahan masalah

`404 Not Found`

: Plugin dinonaktifkan, Gateway belum dimulai ulang sejak diaktifkan, atau permintaan menuju proses Gateway yang berbeda.

`401 Unauthorized`

: Permintaan tidak memenuhi autentikasi HTTP Gateway. Periksa token bearer atau header identitas trusted-proxy.

`400 INVALID_REQUEST`

: Badan permintaan bukan JSON yang valid, bidang `method` tidak ada, atau metode tidak ada dalam daftar izin Plugin.

`503 UNAVAILABLE`

: Handler metode Gateway tidak tersedia. Periksa log Gateway dan coba lagi setelah Gateway selesai startup.

## Terkait

- [Cakupan operator](/id/gateway/operator-scopes)
- [Keamanan Gateway](/id/gateway/security)
- [Akses jarak jauh](/id/gateway/remote)
- [Manifes Plugin](/id/plugins/manifest#contracts)
- [Subpath SDK](/id/plugins/sdk-subpaths)
