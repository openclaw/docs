---
read_when:
    - Memanggil alat tanpa menjalankan giliran agen penuh
    - Membangun otomatisasi yang memerlukan penegakan kebijakan alat
summary: Panggil satu alat secara langsung melalui endpoint HTTP Gateway
title: API pemanggilan alat
x-i18n:
    generated_at: "2026-05-06T09:14:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fcd490d4eaa63f23b0d502e537c4094ade88afcdd04e2b7df1a5f0484a11c57
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

Gateway OpenClaw mengekspos endpoint HTTP sederhana untuk memanggil satu alat secara langsung. Endpoint ini selalu diaktifkan dan menggunakan autentikasi Gateway serta kebijakan alat. Seperti permukaan yang kompatibel dengan OpenAI `/v1/*`, autentikasi bearer rahasia-bersama diperlakukan sebagai akses operator tepercaya untuk seluruh gateway.

- `POST /tools/invoke`
- Port yang sama dengan Gateway (multipleks WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

Ukuran payload maksimum bawaan adalah 2 MB.

## Autentikasi

Menggunakan konfigurasi autentikasi Gateway.

Jalur autentikasi HTTP umum:

- autentikasi rahasia-bersama (`gateway.auth.mode="token"` atau `"password"`):
  `Authorization: Bearer <token-or-password>`
- autentikasi HTTP tepercaya yang membawa identitas (`gateway.auth.mode="trusted-proxy"`):
  rutekan melalui proxy sadar-identitas yang dikonfigurasi dan biarkan proxy tersebut menyisipkan
  header identitas yang diperlukan
- autentikasi terbuka ingress privat (`gateway.auth.mode="none"`):
  tidak memerlukan header autentikasi

Catatan:

- Ketika `gateway.auth.mode="token"`, gunakan `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
- Ketika `gateway.auth.mode="password"`, gunakan `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
- Ketika `gateway.auth.mode="trusted-proxy"`, permintaan HTTP harus datang dari
  sumber proxy tepercaya yang dikonfigurasi; proxy local loopback pada host yang sama memerlukan
  `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit.
- Jika `gateway.auth.rateLimit` dikonfigurasi dan terjadi terlalu banyak kegagalan autentikasi, endpoint mengembalikan `429` dengan `Retry-After`.

## Batas keamanan (penting)

Perlakukan endpoint ini sebagai permukaan **akses operator penuh** untuk instans gateway.

- Autentikasi bearer HTTP di sini bukan model cakupan per pengguna yang sempit.
- Token/kata sandi Gateway yang valid untuk endpoint ini harus diperlakukan seperti kredensial pemilik/operator.
- Untuk mode autentikasi rahasia-bersama (`token` dan `password`), endpoint mengembalikan default operator penuh yang normal sekalipun pemanggil mengirim header `x-openclaw-scopes` yang lebih sempit.
- Autentikasi rahasia-bersama juga memperlakukan pemanggilan alat langsung pada endpoint ini sebagai giliran pengirim-pemilik.
- Mode HTTP tepercaya yang membawa identitas (misalnya autentikasi proxy tepercaya atau `gateway.auth.mode="none"` pada ingress privat) menghormati `x-openclaw-scopes` saat ada dan jika tidak ada akan kembali ke set cakupan default operator normal.
- Simpan endpoint ini hanya pada loopback/tailnet/ingress privat; jangan ekspos langsung ke internet publik.

Matriks autentikasi:

- `gateway.auth.mode="token"` atau `"password"` + `Authorization: Bearer ...`
  - membuktikan kepemilikan rahasia operator gateway bersama
  - mengabaikan `x-openclaw-scopes` yang lebih sempit
  - mengembalikan set cakupan operator default penuh:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - memperlakukan pemanggilan alat langsung pada endpoint ini sebagai giliran pengirim-pemilik
- mode HTTP tepercaya yang membawa identitas (misalnya autentikasi proxy tepercaya, atau `gateway.auth.mode="none"` pada ingress privat)
  - mengautentikasi identitas tepercaya luar atau batas deployment tertentu
  - menghormati `x-openclaw-scopes` ketika header ada
  - kembali ke set cakupan default operator normal ketika header tidak ada
  - hanya kehilangan semantik pemilik ketika pemanggil secara eksplisit mempersempit cakupan dan menghilangkan `operator.admin`

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

Kolom:

- `tool` (string, wajib): nama alat yang akan dipanggil.
- `action` (string, opsional): dipetakan ke dalam args jika skema alat mendukung `action` dan payload args menghilangkannya.
- `args` (object, opsional): argumen khusus alat.
- `sessionKey` (string, opsional): kunci sesi target. Jika dihilangkan atau `"main"`, Gateway menggunakan kunci sesi utama yang dikonfigurasi (menghormati `session.mainKey` dan agen default, atau `global` dalam cakupan global).
- `dryRun` (boolean, opsional): dicadangkan untuk penggunaan mendatang; saat ini diabaikan.

## Perilaku kebijakan + perutean

Ketersediaan alat difilter melalui rantai kebijakan yang sama dengan yang digunakan oleh agen Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- kebijakan grup (jika kunci sesi dipetakan ke grup atau saluran)
- kebijakan subagen (ketika memanggil dengan kunci sesi subagen)

Jika alat tidak diizinkan oleh kebijakan, endpoint mengembalikan **404**.

Catatan batas penting:

- Persetujuan eksekusi adalah pagar pembatas operator, bukan batas otorisasi terpisah untuk endpoint HTTP ini. Jika sebuah alat dapat dijangkau di sini melalui autentikasi Gateway + kebijakan alat, `/tools/invoke` tidak menambahkan prompt persetujuan per panggilan tambahan.
- Jangan bagikan kredensial bearer Gateway dengan pemanggil yang tidak tepercaya. Jika Anda membutuhkan pemisahan lintas batas kepercayaan, jalankan gateway terpisah (dan idealnya pengguna/host OS terpisah).

HTTP Gateway juga menerapkan daftar tolak keras secara bawaan (meskipun kebijakan sesi mengizinkan alat tersebut):

- `exec` - eksekusi perintah langsung (permukaan RCE)
- `spawn` - pembuatan proses anak arbitrer (permukaan RCE)
- `shell` - eksekusi perintah shell (permukaan RCE)
- `fs_write` - mutasi file arbitrer pada host
- `fs_delete` - penghapusan file arbitrer pada host
- `fs_move` - pemindahan/penggantian nama file arbitrer pada host
- `apply_patch` - penerapan patch dapat menulis ulang file arbitrer
- `sessions_spawn` - orkestrasi sesi; menelurkan agen dari jarak jauh adalah RCE
- `sessions_send` - injeksi pesan lintas sesi
- `cron` - bidang kontrol otomasi persisten
- `gateway` - bidang kontrol gateway; mencegah rekonfigurasi melalui HTTP
- `nodes` - relai perintah node dapat menjangkau system.run pada host yang dipasangkan
- `whatsapp_login` - penyiapan interaktif yang memerlukan pemindaian QR terminal; macet pada HTTP

Anda dapat menyesuaikan daftar tolak ini melalui `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

Untuk membantu kebijakan grup menyelesaikan konteks, Anda dapat secara opsional menetapkan:

- `x-openclaw-message-channel: <channel>` (contoh: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (ketika ada beberapa akun)

## Respons

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (permintaan tidak valid atau kesalahan input alat)
- `401` → tidak terotorisasi
- `429` → autentikasi dibatasi laju (`Retry-After` ditetapkan)
- `404` → alat tidak tersedia (tidak ditemukan atau tidak masuk daftar izin)
- `405` → metode tidak diizinkan
- `500` → `{ ok: false, error: { type, message } }` (kesalahan eksekusi alat tak terduga; pesan disanitasi)

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
- [Alat dan Plugin](/id/tools)
