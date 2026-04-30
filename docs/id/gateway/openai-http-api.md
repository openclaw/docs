---
read_when:
    - Mengintegrasikan alat yang mengharapkan OpenAI Chat Completions
summary: Ekspos endpoint HTTP /v1/chat/completions yang kompatibel dengan OpenAI dari Gateway
title: Penyelesaian chat OpenAI
x-i18n:
    generated_at: "2026-04-30T09:50:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a19f9d9d6d8ce6d605f8af5324ae3eb0c100c167609341c8dfb569970b0b2c9
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway OpenClaw dapat menyajikan endpoint Chat Completions kecil yang kompatibel dengan OpenAI.

Endpoint ini **dinonaktifkan secara default**. Aktifkan di konfigurasi terlebih dahulu.

- `POST /v1/chat/completions`
- Port yang sama dengan Gateway (multipleks WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Saat permukaan HTTP Gateway yang kompatibel dengan OpenAI diaktifkan, ia juga menyajikan:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Di balik layar, permintaan dijalankan sebagai proses agent Gateway normal (codepath yang sama seperti `openclaw agent`), sehingga perutean/izin/konfigurasi cocok dengan Gateway Anda.

## Autentikasi

Menggunakan konfigurasi autentikasi Gateway.

Jalur autentikasi HTTP umum:

- autentikasi shared-secret (`gateway.auth.mode="token"` atau `"password"`):
  `Authorization: Bearer <token-or-password>`
- autentikasi HTTP tepercaya yang membawa identitas (`gateway.auth.mode="trusted-proxy"`):
  rutekan melalui proxy yang sadar identitas yang dikonfigurasi dan biarkan proxy itu menyuntikkan
  header identitas yang diperlukan
- autentikasi terbuka private-ingress (`gateway.auth.mode="none"`):
  tidak memerlukan header autentikasi

Catatan:

- Saat `gateway.auth.mode="token"`, gunakan `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
- Saat `gateway.auth.mode="password"`, gunakan `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
- Saat `gateway.auth.mode="trusted-proxy"`, permintaan HTTP harus berasal dari
  sumber proxy tepercaya yang dikonfigurasi; proxy loopback host yang sama memerlukan
  `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit.
- Jika `gateway.auth.rateLimit` dikonfigurasi dan terjadi terlalu banyak kegagalan autentikasi, endpoint mengembalikan `429` dengan `Retry-After`.

## Batas keamanan (penting)

Perlakukan endpoint ini sebagai permukaan **akses operator penuh** untuk instans Gateway.

- Autentikasi bearer HTTP di sini bukan model cakupan per pengguna yang sempit.
- Token/kata sandi Gateway yang valid untuk endpoint ini harus diperlakukan seperti kredensial pemilik/operator.
- Permintaan berjalan melalui jalur agent control-plane yang sama seperti tindakan operator tepercaya.
- Tidak ada batas tool non-pemilik/per pengguna yang terpisah pada endpoint ini; setelah pemanggil lolos autentikasi Gateway di sini, OpenClaw memperlakukan pemanggil itu sebagai operator tepercaya untuk Gateway ini.
- Untuk mode autentikasi shared-secret (`token` dan `password`), endpoint memulihkan default operator penuh normal meskipun pemanggil mengirim header `x-openclaw-scopes` yang lebih sempit.
- Mode HTTP tepercaya yang membawa identitas (misalnya autentikasi proxy tepercaya atau `gateway.auth.mode="none"`) menghormati `x-openclaw-scopes` saat ada dan jika tidak ada kembali ke set cakupan default operator normal.
- Jika kebijakan agent target mengizinkan tool sensitif, endpoint ini dapat menggunakannya.
- Simpan endpoint ini hanya di loopback/tailnet/ingress privat; jangan mengeksposnya langsung ke internet publik.

Matriks autentikasi:

- `gateway.auth.mode="token"` atau `"password"` + `Authorization: Bearer ...`
  - membuktikan kepemilikan rahasia operator Gateway bersama
  - mengabaikan `x-openclaw-scopes` yang lebih sempit
  - memulihkan set cakupan operator default penuh:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - memperlakukan giliran chat pada endpoint ini sebagai giliran pengirim-pemilik
- mode HTTP tepercaya yang membawa identitas (misalnya autentikasi proxy tepercaya, atau `gateway.auth.mode="none"` pada ingress privat)
  - mengautentikasi identitas tepercaya luar atau batas deployment tertentu
  - menghormati `x-openclaw-scopes` saat header ada
  - kembali ke set cakupan default operator normal saat header tidak ada
  - hanya kehilangan semantik pemilik saat pemanggil secara eksplisit mempersempit cakupan dan menghilangkan `operator.admin`

Lihat [Keamanan](/id/gateway/security) dan [Akses jarak jauh](/id/gateway/remote).

## Kontrak model yang mengutamakan agent

OpenClaw memperlakukan field OpenAI `model` sebagai **target agent**, bukan id model provider mentah.

- `model: "openclaw"` merutekan ke agent default yang dikonfigurasi.
- `model: "openclaw/default"` juga merutekan ke agent default yang dikonfigurasi.
- `model: "openclaw/<agentId>"` merutekan ke agent tertentu.

Header permintaan opsional:

- `x-openclaw-model: <provider/model-or-bare-id>` mengganti model backend untuk agent yang dipilih.
- `x-openclaw-agent-id: <agentId>` tetap didukung sebagai override kompatibilitas.
- `x-openclaw-session-key: <sessionKey>` sepenuhnya mengontrol perutean sesi.
- `x-openclaw-message-channel: <channel>` menetapkan konteks channel ingress sintetis untuk prompt dan kebijakan yang sadar channel.

Alias kompatibilitas yang masih diterima:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Mengaktifkan endpoint

Atur `gateway.http.endpoints.chatCompletions.enabled` ke `true`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## Menonaktifkan endpoint

Atur `gateway.http.endpoints.chatCompletions.enabled` ke `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Perilaku sesi

Secara default endpoint ini **stateless per permintaan** (kunci sesi baru dibuat pada setiap panggilan).

Jika permintaan menyertakan string OpenAI `user`, Gateway menurunkan kunci sesi stabil darinya, sehingga panggilan berulang dapat berbagi sesi agent.

## Mengapa permukaan ini penting

Ini adalah set kompatibilitas dengan leverage tertinggi untuk frontend dan tooling yang di-host sendiri:

- Sebagian besar setup Open WebUI, LobeChat, dan LibreChat mengharapkan `/v1/models`.
- Banyak sistem RAG mengharapkan `/v1/embeddings`.
- Klien chat OpenAI yang ada biasanya dapat memulai dengan `/v1/chat/completions`.
- Semakin banyak klien yang lebih native agent memilih `/v1/responses`.

## Daftar model dan perutean agent

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    Daftar target agent OpenClaw.

    Id yang dikembalikan adalah entri `openclaw`, `openclaw/default`, dan `openclaw/<agentId>`.
    Gunakan langsung sebagai nilai OpenAI `model`.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    Ini mencantumkan target agent tingkat atas, bukan model provider backend dan bukan sub-agent.

    Sub-agent tetap menjadi topologi eksekusi internal. Mereka tidak muncul sebagai pseudo-model.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` adalah alias stabil untuk agent default yang dikonfigurasi.

    Artinya, klien dapat tetap menggunakan satu id yang dapat diprediksi meskipun id agent default sebenarnya berubah antar lingkungan.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    Gunakan `x-openclaw-model`.

    Contoh:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Jika Anda menghilangkannya, agent yang dipilih berjalan dengan pilihan model normal yang dikonfigurasi.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` menggunakan id `model` target agent yang sama.

    Gunakan `model: "openclaw/default"` atau `model: "openclaw/<agentId>"`.
    Saat Anda memerlukan model embedding tertentu, kirimkan di `x-openclaw-model`.
    Tanpa header itu, permintaan diteruskan ke setup embedding normal milik agent yang dipilih.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Atur `stream: true` untuk menerima Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Setiap baris event adalah `data: <json>`
- Stream berakhir dengan `data: [DONE]`

## Setup cepat Open WebUI

Untuk koneksi Open WebUI dasar:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL Docker di macOS: `http://host.docker.internal:18789/v1`
- API key: token bearer Gateway Anda
- Model: `openclaw/default`

Perilaku yang diharapkan:

- `GET /v1/models` harus mencantumkan `openclaw/default`
- Open WebUI harus menggunakan `openclaw/default` sebagai id model chat
- Jika Anda menginginkan provider/model backend tertentu untuk agent itu, atur model default normal milik agent atau kirim `x-openclaw-model`

Smoke cepat:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Jika itu mengembalikan `openclaw/default`, sebagian besar setup Open WebUI dapat terhubung dengan Base URL dan token yang sama.

## Contoh

Non-streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Daftar model:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Ambil satu model:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Buat embedding:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

Catatan:

- `/v1/models` mengembalikan target agent OpenClaw, bukan katalog provider mentah.
- `openclaw/default` selalu ada sehingga satu id stabil berfungsi di berbagai lingkungan.
- Override provider/model backend ditempatkan di `x-openclaw-model`, bukan field OpenAI `model`.
- `/v1/embeddings` mendukung `input` sebagai string atau array string.

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [OpenAI](/id/providers/openai)
