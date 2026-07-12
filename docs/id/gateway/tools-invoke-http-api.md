---
read_when:
    - Memanggil alat tanpa menjalankan satu giliran agen penuh
    - Membangun otomatisasi yang memerlukan penegakan kebijakan alat
summary: Panggil satu alat secara langsung melalui endpoint HTTP Gateway
title: Alat memanggil API
x-i18n:
    generated_at: "2026-07-12T14:15:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d07f765d63255e718d5e558b662589e77b2992538f43288cd83e6e3f2a06dda
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

Gateway OpenClaw mengekspos endpoint HTTP untuk memanggil satu alat secara langsung. Endpoint ini selalu diaktifkan dan menggunakan autentikasi Gateway beserta kebijakan alat. Seperti permukaan `/v1/*` yang kompatibel dengan OpenAI, autentikasi bearer dengan rahasia bersama diperlakukan sebagai akses operator tepercaya untuk seluruh gateway.

- `POST /tools/invoke`
- Port yang sama dengan Gateway (multipleks WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`
- Ukuran maksimum default isi permintaan: 2 MB

## Autentikasi

Menggunakan konfigurasi autentikasi Gateway.

Jalur autentikasi HTTP yang umum:

- autentikasi rahasia bersama (`gateway.auth.mode="token"` atau `"password"`): `Authorization: Bearer <token-or-password>`
- autentikasi HTTP tepercaya yang membawa identitas (`gateway.auth.mode="trusted-proxy"`): rutekan melalui proksi sadar-identitas yang dikonfigurasi dan biarkan proksi tersebut menyisipkan header identitas yang diperlukan
- autentikasi terbuka pada ingress privat (`gateway.auth.mode="none"`): header autentikasi tidak diperlukan

Catatan:

- `mode="token"` menggunakan `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
- `mode="password"` menggunakan `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
- `mode="trusted-proxy"` mengharuskan permintaan HTTP berasal dari sumber proksi tepercaya yang dikonfigurasi; proksi local loopback pada host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit.
- Pemanggil internal pada host yang sama yang melewati proksi dapat menggunakan `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` sebagai fallback langsung lokal. Adanya bukti header `Forwarded`, `X-Forwarded-*`, atau `X-Real-IP` akan tetap mempertahankan permintaan pada jalur proksi tepercaya.
- Jika `gateway.auth.rateLimit` dikonfigurasi dan terjadi terlalu banyak kegagalan autentikasi, endpoint mengembalikan `429` dengan `Retry-After`.

## Batas keamanan (penting)

Perlakukan endpoint ini sebagai permukaan dengan **akses operator penuh** untuk instans gateway.

- Autentikasi bearer HTTP di sini bukan model cakupan sempit per pengguna.
- Token/kata sandi Gateway yang valid untuk endpoint ini harus diperlakukan seperti kredensial pemilik/operator.
- Untuk mode autentikasi rahasia bersama (`token` dan `password`), endpoint memulihkan cakupan default operator penuh yang normal meskipun pemanggil mengirim header `x-openclaw-scopes` yang lebih sempit.
- Autentikasi rahasia bersama juga memperlakukan pemanggilan alat langsung pada endpoint ini sebagai giliran dari pengirim-pemilik.
- Mode HTTP tepercaya yang membawa identitas (autentikasi proksi tepercaya, atau `gateway.auth.mode="none"` pada ingress privat) mematuhi `x-openclaw-scopes` jika tersedia dan jika tidak, kembali ke kumpulan cakupan default operator yang normal.
- Pertahankan endpoint ini hanya pada local loopback/tailnet/ingress privat; jangan mengeksposnya secara langsung ke internet publik.

Matriks autentikasi:

| Mode autentikasi                                                                        | Perilaku                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token` atau `password` + `Authorization: Bearer ...`                                   | Membuktikan kepemilikan rahasia operator gateway bersama. Mengabaikan `x-openclaw-scopes` yang lebih sempit. Memulihkan kumpulan cakupan default operator penuh: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Memperlakukan pemanggilan alat langsung sebagai giliran dari pengirim-pemilik. |
| HTTP tepercaya yang membawa identitas (autentikasi proksi tepercaya, atau `mode="none"` pada ingress privat) | Mengautentikasi identitas tepercaya eksternal atau batas penerapan. Mematuhi `x-openclaw-scopes` jika tersedia. Kembali ke kumpulan cakupan default operator yang normal jika header tidak ada. Hanya kehilangan semantik pemilik ketika pemanggil secara eksplisit mempersempit cakupan dan tidak menyertakan `operator.admin`.                                                                     |

## Isi permintaan

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Bidang:

- `tool` / `name` (string, wajib): nama alat yang akan dipanggil. `name` diprioritaskan jika keduanya dikirim.
- `action` (string, opsional): digabungkan ke dalam `args.action` jika skema alat mendukung properti `action` dan `args` belum menetapkannya.
- `args` (objek, opsional): argumen khusus alat.
- `sessionKey` (string, opsional): kunci sesi target. Jika dihilangkan atau `"main"`, Gateway menggunakan kunci sesi utama yang dikonfigurasi (mematuhi `session.mainKey` dan agen default, atau `global` dalam cakupan sesi global).
- `agentId` (string, opsional): menyelesaikan kunci sesi untuk agen tersebut. Menghasilkan kesalahan `400` jika bertentangan dengan `sessionKey` eksplisit yang sudah dipetakan ke agen lain.
- `idempotencyKey` (string, opsional): digunakan untuk menghasilkan ID pemanggilan alat yang stabil bagi pemanggilan tersebut.
- `dryRun` (boolean, opsional): dicadangkan untuk penggunaan mendatang; saat ini diabaikan.

## Perilaku kebijakan + perutean

Ketersediaan alat difilter melalui rantai kebijakan yang sama dengan yang digunakan oleh agen Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- kebijakan grup (jika kunci sesi dipetakan ke grup atau kanal)
- kebijakan subagen (ketika memanggil dengan kunci sesi subagen)

Jika suatu alat tidak diizinkan oleh kebijakan, endpoint mengembalikan **404**.

Catatan penting tentang batas:

- Persetujuan eksekusi adalah pagar pengaman operator, bukan batas otorisasi terpisah untuk endpoint HTTP ini. Jika suatu alat dapat dijangkau di sini melalui autentikasi Gateway + kebijakan alat, `/tools/invoke` tidak menambahkan permintaan persetujuan tambahan per panggilan.
- Jika `exec` dapat dijangkau di sini, perlakukan sebagai permukaan shell yang dapat mengubah keadaan. Menolak `write`, `edit`, `apply_patch`, atau alat tulis sistem berkas melalui HTTP tidak membuat eksekusi shell menjadi hanya-baca.
- Jangan bagikan kredensial bearer Gateway dengan pemanggil yang tidak tepercaya. Jika Anda memerlukan pemisahan lintas batas kepercayaan, jalankan gateway terpisah (idealnya pada pengguna OS/host yang terpisah).

HTTP Gateway juga menerapkan daftar penolakan keras secara default (meskipun kebijakan sesi mengizinkan alat tersebut):

| Alat             | Alasan                                                             |
| ---------------- | ------------------------------------------------------------------ |
| `exec`           | Eksekusi perintah langsung (permukaan RCE)                         |
| `spawn`          | Pembuatan proses anak arbitrer (permukaan RCE)                     |
| `shell`          | Eksekusi perintah shell (permukaan RCE)                            |
| `fs_write`       | Perubahan berkas arbitrer pada host                                |
| `fs_delete`      | Penghapusan berkas arbitrer pada host                              |
| `fs_move`        | Pemindahan/penggantian nama berkas arbitrer pada host              |
| `apply_patch`    | Penerapan patch dapat menulis ulang berkas arbitrer                |
| `sessions_spawn` | Orkestrasi sesi; membuat agen dari jarak jauh merupakan RCE        |
| `sessions_send`  | Penyisipan pesan lintas sesi                                       |
| `cron`           | Bidang kendali otomatisasi persisten                               |
| `gateway`        | Bidang kendali Gateway; mencegah konfigurasi ulang melalui HTTP    |
| `nodes`          | Relai perintah Node dapat menjangkau `system.run` pada host tertaut |

`cron`, `gateway`, dan `nodes` juga hanya untuk pemilik: bahkan di luar daftar penolakan default ini, pemanggil yang bukan pemilik tidak dapat memanggilnya pada permukaan ini.

Sesuaikan daftar penolakan umum melalui `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list for owner/admin callers
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` adalah penggantian paparan, bukan peningkatan cakupan. Dalam mode HTTP yang membawa identitas, `cron`, `gateway`, dan `nodes` tetap tidak tersedia bagi pemanggil tanpa identitas pemilik/admin (`operator.admin`), meskipun tercantum dalam `gateway.tools.allow`. Autentikasi bearer rahasia bersama tetap mengikuti aturan operator tepercaya penuh di atas.

Untuk membantu kebijakan grup menyelesaikan konteks, Anda dapat menetapkan secara opsional:

- `x-openclaw-message-channel: <channel>` (contoh: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (ketika terdapat beberapa akun)
- `x-openclaw-message-to: <target>` (target pengiriman untuk kebijakan alat pesan)
- `x-openclaw-thread-id: <threadId>` (konteks utas untuk kebijakan alat pesan)

## Respons

| Status | Arti                                                                                                                        |
| ------ | --------------------------------------------------------------------------------------------------------------------------- |
| `200`  | `{ ok: true, result }`                                                                                                      |
| `400`  | `{ ok: false, error: { type, message } }` (permintaan tidak valid atau kesalahan masukan alat)                              |
| `401`  | Tidak terotorisasi                                                                                                          |
| `403`  | `{ ok: false, error: { type, message, requiresApproval? } }` (panggilan alat diblokir oleh kebijakan)                       |
| `404`  | Alat tidak tersedia (tidak ditemukan atau tidak masuk daftar izin)                                                         |
| `405`  | Metode tidak diizinkan                                                                                                      |
| `408`  | Waktu pembacaan isi permintaan habis                                                                                        |
| `413`  | Isi permintaan melebihi ukuran muatan maksimum                                                                              |
| `429`  | Autentikasi dibatasi lajunya (`Retry-After` ditetapkan)                                                                     |
| `500`  | `{ ok: false, error: { type, message } }` (kesalahan eksekusi alat yang tidak terduga; pesan telah disanitasi)              |

## Contoh

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## Terkait

- [Protokol Gateway](/id/gateway/protocol)
- [Alat dan plugin](/id/tools)
