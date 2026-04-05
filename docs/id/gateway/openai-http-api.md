---
read_when:
    - Mengintegrasikan tool yang mengharapkan OpenAI Chat Completions
summary: Mengekspos endpoint HTTP `/v1/chat/completions` yang kompatibel dengan OpenAI dari Gateway
title: OpenAI Chat Completions
x-i18n:
    generated_at: "2026-04-05T13:54:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c374b2f32ce693a8c752e2b0a2532c5f0299ed280f9a0e97b1a9d73bcec37b95
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions (HTTP)

Gateway OpenClaw dapat menyajikan endpoint Chat Completions kecil yang kompatibel dengan OpenAI.

Endpoint ini **dinonaktifkan secara default**. Aktifkan terlebih dahulu di konfigurasi.

- `POST /v1/chat/completions`
- Port yang sama dengan Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Saat permukaan HTTP OpenAI-compatible milik Gateway diaktifkan, Gateway juga menyajikan:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Di balik layar, permintaan dijalankan sebagai eksekusi agen Gateway normal (jalur kode yang sama seperti `openclaw agent`), sehingga perutean/izin/konfigurasinya sesuai dengan Gateway Anda.

## Autentikasi

Menggunakan konfigurasi autentikasi Gateway.

Jalur autentikasi HTTP yang umum:

- autentikasi shared-secret (`gateway.auth.mode="token"` atau `"password"`):
  `Authorization: Bearer <token-or-password>`
- autentikasi HTTP tepercaya yang membawa identitas (`gateway.auth.mode="trusted-proxy"`):
  rutekan melalui proxy sadar identitas yang dikonfigurasi dan biarkan proxy tersebut menyuntikkan
  header identitas yang diperlukan
- autentikasi terbuka private-ingress (`gateway.auth.mode="none"`):
  tidak memerlukan header autentikasi

Catatan:

- Saat `gateway.auth.mode="token"`, gunakan `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
- Saat `gateway.auth.mode="password"`, gunakan `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
- Saat `gateway.auth.mode="trusted-proxy"`, permintaan HTTP harus berasal dari
  sumber trusted proxy non-loopback yang dikonfigurasi; proxy loopback pada host yang sama
  tidak memenuhi mode ini.
- Jika `gateway.auth.rateLimit` dikonfigurasi dan terlalu banyak kegagalan autentikasi terjadi, endpoint akan mengembalikan `429` dengan `Retry-After`.

## Batas keamanan (penting)

Perlakukan endpoint ini sebagai permukaan **akses operator penuh** untuk instance gateway.

- Autentikasi bearer HTTP di sini bukan model cakupan sempit per pengguna.
- Token/kata sandi Gateway yang valid untuk endpoint ini harus diperlakukan seperti kredensial pemilik/operator.
- Permintaan dijalankan melalui jalur agen control-plane yang sama seperti tindakan operator tepercaya.
- Tidak ada batas tool terpisah non-pemilik/per-pengguna pada endpoint ini; setelah pemanggil lolos autentikasi Gateway di sini, OpenClaw memperlakukan pemanggil itu sebagai operator tepercaya untuk gateway ini.
- Untuk mode autentikasi shared-secret (`token` dan `password`), endpoint memulihkan default operator penuh normal meskipun pemanggil mengirim header `x-openclaw-scopes` yang lebih sempit.
- Mode HTTP tepercaya yang membawa identitas (misalnya trusted proxy auth atau `gateway.auth.mode="none"`) menghormati `x-openclaw-scopes` bila ada dan jika tidak kembali ke himpunan cakupan default operator normal.
- Jika kebijakan agen target mengizinkan tool sensitif, endpoint ini dapat menggunakannya.
- Simpan endpoint ini hanya pada loopback/tailnet/private ingress; jangan ekspos langsung ke internet publik.

Matriks autentikasi:

- `gateway.auth.mode="token"` atau `"password"` + `Authorization: Bearer ...`
  - membuktikan kepemilikan secret operator gateway bersama
  - mengabaikan `x-openclaw-scopes` yang lebih sempit
  - memulihkan himpunan cakupan operator default penuh:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - memperlakukan giliran chat pada endpoint ini sebagai giliran pengirim pemilik
- mode HTTP tepercaya yang membawa identitas (misalnya trusted proxy auth, atau `gateway.auth.mode="none"` pada private ingress)
  - mengautentikasi identitas tepercaya luar atau batas deployment tertentu
  - menghormati `x-openclaw-scopes` saat header ada
  - kembali ke himpunan cakupan default operator normal saat header tidak ada
  - hanya kehilangan semantik pemilik ketika pemanggil secara eksplisit mempersempit cakupan dan menghilangkan `operator.admin`

Lihat [Security](/gateway/security) dan [Remote access](/gateway/remote).

## Kontrak model yang berpusat pada agen

OpenClaw memperlakukan field OpenAI `model` sebagai **target agen**, bukan id model penyedia mentah.

- `model: "openclaw"` merutekan ke agen default yang dikonfigurasi.
- `model: "openclaw/default"` juga merutekan ke agen default yang dikonfigurasi.
- `model: "openclaw/<agentId>"` merutekan ke agen tertentu.

Header permintaan opsional:

- `x-openclaw-model: <provider/model-or-bare-id>` mengoverride model backend untuk agen yang dipilih.
- `x-openclaw-agent-id: <agentId>` tetap didukung sebagai override kompatibilitas.
- `x-openclaw-session-key: <sessionKey>` mengontrol perutean sesi sepenuhnya.
- `x-openclaw-message-channel: <channel>` menetapkan konteks channel ingress sintetis untuk prompt dan kebijakan yang sadar channel.

Alias kompatibilitas yang masih diterima:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Mengaktifkan endpoint

Setel `gateway.http.endpoints.chatCompletions.enabled` ke `true`:

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

Setel `gateway.http.endpoints.chatCompletions.enabled` ke `false`:

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

Jika permintaan menyertakan string OpenAI `user`, Gateway menurunkan kunci sesi stabil darinya, sehingga panggilan berulang dapat berbagi satu sesi agen.

## Mengapa permukaan ini penting

Ini adalah himpunan kompatibilitas dengan daya ungkit tertinggi untuk frontend dan tool self-hosted:

- Sebagian besar penyiapan Open WebUI, LobeChat, dan LibreChat mengharapkan `/v1/models`.
- Banyak sistem RAG mengharapkan `/v1/embeddings`.
- Klien chat OpenAI yang ada biasanya dapat mulai dengan `/v1/chat/completions`.
- Klien yang lebih native agen semakin cenderung memilih `/v1/responses`.

## Daftar model dan perutean agen

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    Daftar target agen OpenClaw.

    Id yang dikembalikan adalah entri `openclaw`, `openclaw/default`, dan `openclaw/<agentId>`.
    Gunakan langsung sebagai nilai `model` OpenAI.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    Endpoint ini mencantumkan target agen tingkat atas, bukan model penyedia backend dan bukan sub-agen.

    Sub-agen tetap menjadi topologi eksekusi internal. Sub-agen tidak muncul sebagai pseudo-model.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` adalah alias stabil untuk agen default yang dikonfigurasi.

    Itu berarti klien dapat terus menggunakan satu id yang dapat diprediksi meskipun id agen default yang sebenarnya berubah antar lingkungan.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    Gunakan `x-openclaw-model`.

    Contoh:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.4`

    Jika Anda menghilangkannya, agen yang dipilih akan berjalan dengan pilihan model normal yang telah dikonfigurasi.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` menggunakan id `model` target agen yang sama.

    Gunakan `model: "openclaw/default"` atau `model: "openclaw/<agentId>"`.
    Saat Anda membutuhkan model embedding tertentu, kirimkan dalam `x-openclaw-model`.
    Tanpa header itu, permintaan akan diteruskan ke penyiapan embedding normal milik agen yang dipilih.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Setel `stream: true` untuk menerima Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Setiap baris event adalah `data: <json>`
- Stream berakhir dengan `data: [DONE]`

## Penyiapan cepat Open WebUI

Untuk koneksi Open WebUI dasar:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL Docker di macOS: `http://host.docker.internal:18789/v1`
- Kunci API: token bearer Gateway Anda
- Model: `openclaw/default`

Perilaku yang diharapkan:

- `GET /v1/models` harus mencantumkan `openclaw/default`
- Open WebUI harus menggunakan `openclaw/default` sebagai id model chat
- Jika Anda menginginkan penyedia/model backend tertentu untuk agen tersebut, setel model default normal agen itu atau kirim `x-openclaw-model`

Smoke test cepat:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Jika itu mengembalikan `openclaw/default`, sebagian besar penyiapan Open WebUI dapat terhubung dengan base URL dan token yang sama.

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

Mencantumkan model:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Mengambil satu model:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Membuat embedding:

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

- `/v1/models` mengembalikan target agen OpenClaw, bukan katalog penyedia mentah.
- `openclaw/default` selalu ada sehingga satu id stabil dapat bekerja lintas lingkungan.
- Override penyedia/model backend ditempatkan di `x-openclaw-model`, bukan field `model` OpenAI.
- `/v1/embeddings` mendukung `input` sebagai string atau array string.
