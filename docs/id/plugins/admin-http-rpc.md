---
read_when:
    - Membangun alat untuk host yang tidak dapat menggunakan klien RPC WebSocket Gateway
    - Mengekspos otomatisasi admin Gateway di balik ingress privat tepercaya
    - Mengaudit model keamanan untuk akses HTTP ke metode Gateway
summary: Ekspos metode bidang kontrol Gateway yang dipilih melalui Plugin admin-http-rpc bawaan yang bersifat opsional
title: Plugin RPC HTTP admin
x-i18n:
    generated_at: "2026-07-12T14:24:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

Plugin bawaan `admin-http-rpc` mengekspos sekumpulan metode bidang kontrol Gateway yang tercantum dalam daftar izin melalui HTTP, untuk otomatisasi host tepercaya yang tidak dapat mempertahankan koneksi WebSocket Gateway tetap terbuka.

Plugin ini disertakan bersama OpenClaw tetapi dinonaktifkan secara bawaan; saat dinonaktifkan, rute tidak didaftarkan. Saat diaktifkan, plugin ini menambahkan `POST /api/v1/admin/rpc` pada listener yang sama dengan Gateway (`http://<gateway-host>:<port>/api/v1/admin/rpc`).

Aktifkan hanya untuk peralatan host privat, otomatisasi tailnet, atau ingress internal tepercaya. Jangan pernah mengekspos rute ini secara langsung ke internet publik.

## Sebelum Anda mengaktifkannya

RPC HTTP admin adalah permukaan bidang kontrol operator penuh: setiap pemanggil yang lolos autentikasi HTTP Gateway dapat memanggil metode dalam daftar izin di bawah. Aktifkan hanya jika semua hal berikut terpenuhi:

- Pemanggil dipercaya untuk mengoperasikan Gateway.
- Pemanggil tidak dapat menggunakan klien RPC WebSocket.
- Rute hanya dapat dijangkau melalui loopback, tailnet, atau ingress privat yang diautentikasi.
- Anda telah meninjau metode yang diizinkan dan metode tersebut sesuai dengan otomatisasi yang akan dijalankan.

Untuk klien OpenClaw dan alat interaktif yang dapat mempertahankan koneksi WebSocket Gateway tetap terbuka, gunakan RPC WebSocket sebagai gantinya.

## Mengaktifkan

Aktifkan Plugin bawaan:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="Konfigurasi">
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

Rute didaftarkan saat Plugin dimulai, jadi mulai ulang Gateway setelah mengubah konfigurasi Plugin.

Nonaktifkan saat Anda tidak lagi memerlukan permukaan HTTP:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## Memverifikasi rute

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
- autentikasi HTTP tepercaya yang memuat identitas (`gateway.auth.mode="trusted-proxy"`): rutekan melalui proksi sadar-identitas yang dikonfigurasi dan biarkan proksi tersebut menyuntikkan header identitas yang diperlukan
- autentikasi terbuka pada ingress privat (`gateway.auth.mode="none"`): tidak memerlukan header autentikasi

## Model keamanan

Perlakukan Plugin ini sebagai permukaan operator Gateway penuh.

- Mengaktifkan Plugin secara sengaja menyediakan akses ke metode RPC admin dalam daftar izin di `/api/v1/admin/rpc`.
- Plugin mendeklarasikan kontrak manifes khusus `contracts.gatewayMethodDispatch: ["authenticated-request"]`, yang memungkinkan rute HTTP-nya yang diautentikasi Gateway meneruskan metode bidang kontrol dalam proses. Ini bukan sandbox: kontrak tersebut mencegah penggunaan pembantu SDK khusus secara tidak sengaja, tetapi Plugin tepercaya tetap berjalan dalam proses Gateway.
- Autentikasi bearer dengan rahasia bersama (mode `token`/`password`) membuktikan kepemilikan rahasia operator Gateway; header `x-openclaw-scopes` yang lebih sempit diabaikan pada jalur tersebut dan cakupan bawaan operator penuh yang normal dipulihkan.
- Autentikasi HTTP tepercaya yang memuat identitas (mode `trusted-proxy`) mematuhi `x-openclaw-scopes` jika tersedia.
- `gateway.auth.mode="none"` berarti rute ini tidak diautentikasi jika Plugin diaktifkan. Gunakan hanya di belakang ingress privat yang sepenuhnya Anda percayai.
- Permintaan diteruskan melalui penangan metode dan pemeriksaan cakupan Gateway yang sama seperti RPC WebSocket setelah autentikasi rute Plugin berhasil.
- Rute tetap dapat dijangkau selama lease penangguhan yang telah disiapkan. Validasi permintaan terbatas dan respons penemuan lokal `commands.list` tetap tersedia. Dari metode yang diteruskan ke Gateway, hanya `gateway.suspend.prepare`, `gateway.suspend.status`, dan `gateway.suspend.resume` yang dapat berjalan saat penerimaan ditutup; metode lain dalam daftar izin mengembalikan respons Gateway `UNAVAILABLE` normal yang dapat dicoba ulang.
- Pertahankan rute ini pada loopback, tailnet, atau ingress privat tepercaya. Jangan mengeksposnya secara langsung ke internet publik. Gunakan Gateway terpisah jika pemanggil melintasi batas kepercayaan.

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

Kolom:

- `id` (string, opsional): disalin ke respons. UUID dibuat jika dihilangkan.
- `method` (string, wajib): nama metode Gateway yang diizinkan.
- `params` (apa pun, opsional): parameter khusus metode.

Ukuran maksimum bawaan isi permintaan adalah 1 MB.

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

Status HTTP mengikuti kode kesalahan:

| Kode kesalahan             | Status HTTP |
| -------------------------- | ----------- |
| `INVALID_REQUEST`          | 400         |
| `APPROVAL_NOT_FOUND`       | 404         |
| `NOT_LINKED`, `NOT_PAIRED` | 409         |
| `UNAVAILABLE`              | 503         |
| `AGENT_TIMEOUT`            | 504         |
| kode lainnya               | 500         |

## Metode yang diizinkan

- penemuan: `commands.list`
  Mengembalikan nama metode RPC HTTP yang diizinkan oleh Plugin ini.
- Gateway: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`, `gateway.suspend.prepare`, `gateway.suspend.status`, `gateway.suspend.resume`
- konfigurasi: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- saluran: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- web: `web.login.start`, `web.login.wait`
- model: `models.list`, `models.authStatus`
- agen: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- persetujuan: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- perangkat: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- Node: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- tugas: `tasks.list`, `tasks.get`, `tasks.cancel`
- diagnostik: `doctor.memory.status`, `update.status`

Metode Gateway lainnya diblokir hingga ditambahkan secara sengaja.

## Perbandingan WebSocket

Jalur RPC WebSocket Gateway normal tetap menjadi API bidang kontrol yang diutamakan untuk klien OpenClaw. Gunakan RPC HTTP admin hanya untuk peralatan host yang memerlukan permukaan permintaan/respons HTTP.

Klien WebSocket dengan token bersama tanpa identitas perangkat tepercaya tidak dapat mendeklarasikan sendiri cakupan admin saat tersambung. RPC HTTP admin secara sengaja mengikuti model operator HTTP tepercaya yang sudah ada: saat Plugin diaktifkan, autentikasi bearer dengan rahasia bersama diperlakukan sebagai akses operator penuh untuk permukaan admin ini.

## Pemecahan masalah

`404 Not Found`

: Plugin dinonaktifkan, Gateway belum dimulai ulang sejak Plugin diaktifkan, atau permintaan dikirim ke proses Gateway yang berbeda.

`401 Unauthorized`

: Permintaan tidak memenuhi autentikasi HTTP Gateway. Periksa token bearer atau header identitas proksi tepercaya.

`405 Method Not Allowed`

: Permintaan menggunakan metode selain `POST`.

`413 Payload Too Large`

: Isi permintaan melampaui batas 1 MB.

`400 INVALID_REQUEST`

: Isi permintaan bukan JSON yang valid, kolom `method` tidak ada, metode tidak terdapat dalam daftar izin Plugin, atau ID pelanjutan penangguhan tidak cocok dengan lease aktif.

`503 UNAVAILABLE`

: Metode Gateway sedang dimulai, dibatasi lajunya, ditangguhkan, atau menunggu operasi penangguhan/pelanjutan lain yang bersaing. Periksa `error.details` jika tersedia dan patuhi `error.retryAfterMs` sebelum mencoba lagi.

## Terkait

- [Cakupan operator](/id/gateway/operator-scopes)
- [Keamanan Gateway](/id/gateway/security)
- [Akses jarak jauh](/id/gateway/remote)
- [Manifes Plugin](/id/plugins/manifest#contracts-reference)
- [Subjalur SDK](/id/plugins/sdk-subpaths)
