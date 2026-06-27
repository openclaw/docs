---
read_when:
    - Memanggil alat tanpa menjalankan giliran agen penuh
    - Membangun otomatisasi yang memerlukan penegakan kebijakan alat
summary: Panggil satu alat secara langsung melalui endpoint HTTP Gateway
title: Tools memanggil API
x-i18n:
    generated_at: "2026-06-27T17:34:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2023505f5a705b62e2fd685d64d3f9bd7788d09adfe89ac99604e6660c78ad8a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

Gateway OpenClaw mengekspos endpoint HTTP sederhana untuk memanggil satu tool secara langsung. Endpoint ini selalu aktif dan menggunakan auth Gateway serta kebijakan tool. Seperti permukaan yang kompatibel dengan OpenAI `/v1/*`, auth bearer rahasia bersama diperlakukan sebagai akses operator tepercaya untuk seluruh gateway.

- `POST /tools/invoke`
- Port yang sama dengan Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

Ukuran payload maksimum default adalah 2 MB.

## Autentikasi

Menggunakan konfigurasi auth Gateway.

Jalur auth HTTP umum:

- auth rahasia bersama (`gateway.auth.mode="token"` atau `"password"`):
  `Authorization: Bearer <token-or-password>`
- auth HTTP pembawa identitas tepercaya (`gateway.auth.mode="trusted-proxy"`):
  rutekan melalui proxy sadar-identitas yang dikonfigurasi dan biarkan proxy tersebut menyisipkan
  header identitas yang diperlukan
- auth terbuka private-ingress (`gateway.auth.mode="none"`):
  tidak memerlukan header auth

Catatan:

- Ketika `gateway.auth.mode="token"`, gunakan `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
- Ketika `gateway.auth.mode="password"`, gunakan `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
- Ketika `gateway.auth.mode="trusted-proxy"`, permintaan HTTP harus berasal dari
  sumber proxy tepercaya yang dikonfigurasi; proxy loopback pada host yang sama memerlukan
  `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit.
- Pemanggil internal pada host yang sama yang melewati proxy dapat menggunakan
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` sebagai fallback langsung lokal.
  Bukti header `Forwarded`, `X-Forwarded-*`, atau `X-Real-IP` apa pun
  akan tetap menempatkan permintaan pada jalur trusted-proxy.
- Jika `gateway.auth.rateLimit` dikonfigurasi dan terlalu banyak kegagalan auth terjadi, endpoint mengembalikan `429` dengan `Retry-After`.

## Batas keamanan (penting)

Perlakukan endpoint ini sebagai permukaan **akses operator penuh** untuk instance gateway.

- Auth bearer HTTP di sini bukan model cakupan per pengguna yang sempit.
- Token/kata sandi Gateway yang valid untuk endpoint ini harus diperlakukan seperti kredensial pemilik/operator.
- Untuk mode auth rahasia bersama (`token` dan `password`), endpoint memulihkan default operator penuh yang normal meskipun pemanggil mengirim header `x-openclaw-scopes` yang lebih sempit.
- Auth rahasia bersama juga memperlakukan pemanggilan tool langsung pada endpoint ini sebagai giliran owner-sender.
- Mode HTTP pembawa identitas tepercaya (misalnya auth proxy tepercaya atau `gateway.auth.mode="none"` pada private ingress) menghormati `x-openclaw-scopes` saat ada dan jika tidak ada akan fallback ke set cakupan default operator normal.
- Pertahankan endpoint ini hanya pada loopback/tailnet/private ingress; jangan mengeksposnya langsung ke internet publik.

Matriks auth:

- `gateway.auth.mode="token"` atau `"password"` + `Authorization: Bearer ...`
  - membuktikan kepemilikan rahasia operator gateway bersama
  - mengabaikan `x-openclaw-scopes` yang lebih sempit
  - memulihkan set cakupan operator default penuh:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - memperlakukan pemanggilan tool langsung pada endpoint ini sebagai giliran owner-sender
- mode HTTP pembawa identitas tepercaya (misalnya auth proxy tepercaya, atau `gateway.auth.mode="none"` pada private ingress)
  - mengautentikasi identitas tepercaya luar atau batas deployment tertentu
  - menghormati `x-openclaw-scopes` ketika header ada
  - fallback ke set cakupan default operator normal ketika header tidak ada
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

Field:

- `tool` (string, wajib): nama tool yang akan dipanggil.
- `action` (string, opsional): dipetakan ke dalam args jika skema tool mendukung `action` dan payload args menghilangkannya.
- `args` (object, opsional): argumen khusus tool.
- `sessionKey` (string, opsional): kunci sesi target. Jika dihilangkan atau `"main"`, Gateway menggunakan kunci sesi utama yang dikonfigurasi (menghormati `session.mainKey` dan agen default, atau `global` dalam cakupan global).
- `dryRun` (boolean, opsional): dicadangkan untuk penggunaan mendatang; saat ini diabaikan.

## Perilaku kebijakan + routing

Ketersediaan tool difilter melalui rantai kebijakan yang sama dengan yang digunakan oleh agen Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- kebijakan grup (jika kunci sesi dipetakan ke grup atau channel)
- kebijakan subagent (ketika memanggil dengan kunci sesi subagent)

Jika tool tidak diizinkan oleh kebijakan, endpoint mengembalikan **404**.

Catatan batas penting:

- Persetujuan exec adalah guardrail operator, bukan batas otorisasi terpisah untuk endpoint HTTP ini. Jika sebuah tool dapat dijangkau di sini melalui auth Gateway + kebijakan tool, `/tools/invoke` tidak menambahkan prompt persetujuan ekstra per panggilan.
- Jika `exec` dapat dijangkau di sini, perlakukan itu sebagai permukaan shell yang memutasi. Menolak `write`, `edit`, `apply_patch`, atau tool HTTP penulisan-filesystem tidak membuat eksekusi shell menjadi read-only.
- Jangan bagikan kredensial bearer Gateway dengan pemanggil yang tidak tepercaya. Jika Anda memerlukan pemisahan lintas batas kepercayaan, jalankan gateway terpisah (dan idealnya pengguna/host OS terpisah).

HTTP Gateway juga menerapkan daftar penolakan keras secara default (meskipun kebijakan sesi mengizinkan tool):

- `exec` - eksekusi perintah langsung (permukaan RCE)
- `spawn` - pembuatan proses anak arbitrer (permukaan RCE)
- `shell` - eksekusi perintah shell (permukaan RCE)
- `fs_write` - mutasi file arbitrer pada host
- `fs_delete` - penghapusan file arbitrer pada host
- `fs_move` - pemindahan/penggantian nama file arbitrer pada host
- `apply_patch` - penerapan patch dapat menulis ulang file arbitrer
- `sessions_spawn` - orkestrasi sesi; men-spawn agen dari jarak jauh adalah RCE
- `sessions_send` - injeksi pesan lintas sesi
- `cron` - bidang kendali automasi persisten
- `gateway` - bidang kendali gateway; mencegah konfigurasi ulang melalui HTTP
- `nodes` - relay perintah node dapat menjangkau system.run pada host yang dipasangkan
- `whatsapp_login` - penyiapan interaktif yang memerlukan pemindaian QR terminal; hang pada HTTP

Anda dapat menyesuaikan daftar penolakan ini melalui `gateway.tools`:

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

`gateway.tools.allow` adalah override eksposur, bukan peningkatan cakupan. Dalam
mode HTTP pembawa identitas, `cron`, `gateway`, dan `nodes` tetap tidak tersedia
bagi pemanggil yang tidak memiliki identitas owner/admin (`operator.admin`) meskipun
ketiganya tercantum dalam `gateway.tools.allow`. Auth bearer rahasia bersama tetap mengikuti
aturan operator tepercaya penuh di atas.

Untuk membantu kebijakan grup menyelesaikan konteks, Anda dapat secara opsional menetapkan:

- `x-openclaw-message-channel: <channel>` (contoh: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (ketika ada beberapa akun)

## Respons

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (permintaan tidak valid atau error input tool)
- `401` → tidak terotorisasi
- `429` → auth terkena rate limit (`Retry-After` ditetapkan)
- `404` → tool tidak tersedia (tidak ditemukan atau tidak masuk allowlist)
- `405` → metode tidak diizinkan
- `500` → `{ ok: false, error: { type, message } }` (error eksekusi tool yang tidak terduga; pesan disanitasi)

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
- [Tool dan plugin](/id/tools)
