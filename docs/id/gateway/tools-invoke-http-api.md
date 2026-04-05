---
read_when:
    - Memanggil tool tanpa menjalankan satu giliran agen penuh
    - Membangun automasi yang memerlukan penegakan kebijakan tool
summary: Memanggil satu tool secara langsung melalui endpoint HTTP Gateway
title: API Tools Invoke
x-i18n:
    generated_at: "2026-04-05T13:55:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: e924f257ba50b25dea0ec4c3f9eed4c8cac8a53ddef18215f87ac7de330a37fd
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Tools Invoke (HTTP)

Gateway OpenClaw mengekspos endpoint HTTP sederhana untuk memanggil satu tool secara langsung. Endpoint ini selalu aktif dan menggunakan auth Gateway plus kebijakan tool. Seperti permukaan `/v1/*` yang kompatibel dengan OpenAI, auth bearer shared-secret diperlakukan sebagai akses operator tepercaya untuk seluruh gateway.

- `POST /tools/invoke`
- Port yang sama dengan Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

Ukuran payload maksimum default adalah 2 MB.

## Autentikasi

Menggunakan konfigurasi auth Gateway.

Jalur auth HTTP yang umum:

- auth shared-secret (`gateway.auth.mode="token"` atau `"password"`):
  `Authorization: Bearer <token-or-password>`
- auth HTTP tepercaya yang membawa identitas (`gateway.auth.mode="trusted-proxy"`):
  rutekan melalui proxy sadar identitas yang dikonfigurasi dan biarkan proxy itu menyuntikkan
  header identitas yang diperlukan
- auth terbuka private-ingress (`gateway.auth.mode="none"`):
  tidak memerlukan header auth

Catatan:

- Saat `gateway.auth.mode="token"`, gunakan `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
- Saat `gateway.auth.mode="password"`, gunakan `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
- Saat `gateway.auth.mode="trusted-proxy"`, permintaan HTTP harus berasal dari
  sumber trusted proxy non-loopback yang dikonfigurasi; proxy loopback pada host yang sama
  tidak memenuhi mode ini.
- Jika `gateway.auth.rateLimit` dikonfigurasi dan terlalu banyak kegagalan auth terjadi, endpoint mengembalikan `429` dengan `Retry-After`.

## Batas keamanan (penting)

Perlakukan endpoint ini sebagai permukaan **akses operator penuh** untuk instance gateway.

- Auth bearer HTTP di sini bukan model cakupan sempit per pengguna.
- Token/password Gateway yang valid untuk endpoint ini harus diperlakukan seperti kredensial pemilik/operator.
- Untuk mode auth shared-secret (`token` dan `password`), endpoint memulihkan default operator penuh yang normal bahkan jika pemanggil mengirim header `x-openclaw-scopes` yang lebih sempit.
- Auth shared-secret juga memperlakukan pemanggilan tool langsung pada endpoint ini sebagai giliran owner-sender.
- Mode HTTP tepercaya yang membawa identitas (misalnya auth trusted proxy atau `gateway.auth.mode="none"` pada private ingress) menghormati `x-openclaw-scopes` saat ada dan jika tidak menggunakan fallback ke set cakupan default operator normal.
- Simpan endpoint ini hanya pada loopback/tailnet/private ingress; jangan mengeksposnya langsung ke internet publik.

Matriks auth:

- `gateway.auth.mode="token"` atau `"password"` + `Authorization: Bearer ...`
  - membuktikan kepemilikan secret operator gateway bersama
  - mengabaikan `x-openclaw-scopes` yang lebih sempit
  - memulihkan set cakupan operator penuh default:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - memperlakukan pemanggilan tool langsung pada endpoint ini sebagai giliran owner-sender
- mode HTTP tepercaya yang membawa identitas (misalnya auth trusted proxy, atau `gateway.auth.mode="none"` pada private ingress)
  - mengautentikasi identitas tepercaya luar atau batas deployment
  - menghormati `x-openclaw-scopes` saat header tersebut ada
  - menggunakan fallback ke set cakupan default operator normal saat header tidak ada
  - hanya kehilangan semantik owner ketika pemanggil secara eksplisit mempersempit cakupan dan menghilangkan `operator.admin`

## Body permintaan

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
- `action` (string, opsional): dipetakan ke args jika skema tool mendukung `action` dan payload args tidak menyertakannya.
- `args` (object, opsional): argumen spesifik tool.
- `sessionKey` (string, opsional): kunci sesi target. Jika dihilangkan atau `"main"`, Gateway menggunakan kunci sesi main yang dikonfigurasi (menghormati `session.mainKey` dan agen default, atau `global` dalam cakupan global).
- `dryRun` (boolean, opsional): dicadangkan untuk penggunaan di masa mendatang; saat ini diabaikan.

## Perilaku kebijakan + routing

Ketersediaan tool difilter melalui rantai kebijakan yang sama yang digunakan oleh agen Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- kebijakan grup (jika kunci sesi dipetakan ke grup atau channel)
- kebijakan subagent (saat memanggil dengan kunci sesi subagent)

Jika tool tidak diizinkan oleh kebijakan, endpoint mengembalikan **404**.

Catatan batas penting:

- Persetujuan exec adalah guardrail operator, bukan batas otorisasi terpisah untuk endpoint HTTP ini. Jika sebuah tool dapat dijangkau di sini melalui auth Gateway + kebijakan tool, `/tools/invoke` tidak menambahkan prompt persetujuan ekstra per panggilan.
- Jangan membagikan kredensial bearer Gateway kepada pemanggil yang tidak tepercaya. Jika Anda memerlukan pemisahan lintas batas kepercayaan, jalankan gateway terpisah (dan idealnya pengguna OS/host yang terpisah).

HTTP Gateway juga menerapkan daftar deny keras secara default (bahkan jika kebijakan sesi mengizinkan tool tersebut):

- `exec` — eksekusi perintah langsung (permukaan RCE)
- `spawn` — pembuatan child process arbitrer (permukaan RCE)
- `shell` — eksekusi perintah shell (permukaan RCE)
- `fs_write` — mutasi file arbitrer pada host
- `fs_delete` — penghapusan file arbitrer pada host
- `fs_move` — pemindahan/penggantian nama file arbitrer pada host
- `apply_patch` — penerapan patch dapat menulis ulang file arbitrer
- `sessions_spawn` — orkestrasi sesi; memunculkan agen dari jarak jauh adalah RCE
- `sessions_send` — injeksi pesan lintas sesi
- `cron` — control plane automasi persisten
- `gateway` — control plane gateway; mencegah rekonfigurasi melalui HTTP
- `nodes` — relay perintah node dapat mencapai `system.run` pada host yang sudah terpairing
- `whatsapp_login` — penyiapan interaktif yang memerlukan pemindaian QR terminal; akan hang pada HTTP

Anda dapat menyesuaikan daftar deny ini melalui `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Tool tambahan yang akan diblokir melalui HTTP /tools/invoke
      deny: ["browser"],
      // Hapus tool dari daftar deny default
      allow: ["gateway"],
    },
  },
}
```

Untuk membantu kebijakan grup me-resolve konteks, Anda dapat menetapkan secara opsional:

- `x-openclaw-message-channel: <channel>` (contoh: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (saat ada beberapa akun)

## Respons

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (permintaan tidak valid atau error input tool)
- `401` → unauthorized
- `429` → auth rate-limited (`Retry-After` ditetapkan)
- `404` → tool tidak tersedia (tidak ditemukan atau tidak ada di allowlist)
- `405` → method not allowed
- `500` → `{ ok: false, error: { type, message } }` (error eksekusi tool yang tidak terduga; pesan sudah disanitasi)

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
