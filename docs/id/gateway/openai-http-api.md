---
read_when:
    - Mengintegrasikan alat yang mengharapkan OpenAI Chat Completions
summary: Ekspos endpoint HTTP `/v1/chat/completions` yang kompatibel dengan OpenAI dari Gateway
title: OpenAI chat completions
x-i18n:
    generated_at: "2026-04-24T09:08:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55f581d56edbc23a8e8a6f8f1c5960db46042991abb3ee4436f477abafde2926
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions (HTTP)

Gateway OpenClaw dapat menyajikan endpoint Chat Completions kecil yang kompatibel dengan OpenAI.

Endpoint ini **dinonaktifkan secara default**. Aktifkan dulu di config.

- `POST /v1/chat/completions`
- Port yang sama dengan Gateway (WS + HTTP termultipleks): `http://<gateway-host>:<port>/v1/chat/completions`

Saat surface HTTP kompatibel OpenAI milik Gateway diaktifkan, Gateway juga menyajikan:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Di balik layar, permintaan dieksekusi sebagai run agen Gateway normal (jalur kode yang sama seperti `openclaw agent`), jadi perutean/izin/config sesuai dengan Gateway Anda.

## Autentikasi

Menggunakan konfigurasi autentikasi Gateway.

Jalur autentikasi HTTP yang umum:

- autentikasi shared-secret (`gateway.auth.mode="token"` atau `"password"`):
  `Authorization: Bearer <token-or-password>`
- autentikasi HTTP tepercaya yang membawa identitas (`gateway.auth.mode="trusted-proxy"`):
  arahkan melalui proxy sadar-identitas yang dikonfigurasi dan biarkan proxy itu menyuntikkan
  header identitas yang diperlukan
- autentikasi terbuka untuk ingress privat (`gateway.auth.mode="none"`):
  tidak perlu header autentikasi

Catatan:

- Saat `gateway.auth.mode="token"`, gunakan `gateway.auth.token` (atau `OPENCLAW_GATEWAY_TOKEN`).
- Saat `gateway.auth.mode="password"`, gunakan `gateway.auth.password` (atau `OPENCLAW_GATEWAY_PASSWORD`).
- Saat `gateway.auth.mode="trusted-proxy"`, permintaan HTTP harus berasal dari
  sumber trusted proxy non-loopback yang dikonfigurasi; proxy loopback pada host yang sama
  tidak memenuhi mode ini.
- Jika `gateway.auth.rateLimit` dikonfigurasi dan terlalu banyak kegagalan autentikasi terjadi, endpoint mengembalikan `429` dengan `Retry-After`.

## Batas keamanan (penting)

Perlakukan endpoint ini sebagai surface **akses operator penuh** untuk instans gateway.

- Autentikasi bearer HTTP di sini bukan model cakupan sempit per pengguna.
- Token/password Gateway yang valid untuk endpoint ini harus diperlakukan seperti kredensial owner/operator.
- Permintaan berjalan melalui jalur agen control-plane yang sama seperti aksi operator tepercaya.
- Tidak ada batas alat terpisah non-owner/per-pengguna pada endpoint ini; setelah pemanggil melewati autentikasi Gateway di sini, OpenClaw memperlakukan pemanggil itu sebagai operator tepercaya untuk gateway ini.
- Untuk mode autentikasi shared-secret (`token` dan `password`), endpoint memulihkan default operator penuh yang normal meskipun pemanggil mengirim header `x-openclaw-scopes` yang lebih sempit.
- Mode HTTP tepercaya yang membawa identitas (misalnya autentikasi trusted proxy atau `gateway.auth.mode="none"`) menghormati `x-openclaw-scopes` saat ada dan jika tidak menggunakan fallback ke kumpulan cakupan default operator normal.
- Jika kebijakan agen target mengizinkan alat sensitif, endpoint ini dapat menggunakannya.
- Pertahankan endpoint ini hanya pada loopback/tailnet/private ingress; jangan mengeksposnya langsung ke internet publik.

Matriks autentikasi:

- `gateway.auth.mode="token"` atau `"password"` + `Authorization: Bearer ...`
  - membuktikan kepemilikan secret operator gateway bersama
  - mengabaikan `x-openclaw-scopes` yang lebih sempit
  - memulihkan kumpulan cakupan default operator penuh:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - memperlakukan giliran chat di endpoint ini sebagai giliran pengirim owner
- mode HTTP tepercaya yang membawa identitas (misalnya autentikasi trusted proxy, atau `gateway.auth.mode="none"` pada private ingress)
  - mengautentikasi identitas luar tepercaya atau batas deployment
  - menghormati `x-openclaw-scopes` saat header ada
  - menggunakan fallback ke kumpulan cakupan default operator normal saat header tidak ada
  - hanya kehilangan semantik owner saat pemanggil secara eksplisit mempersempit cakupan dan menghilangkan `operator.admin`

Lihat [Keamanan](/id/gateway/security) dan [Akses jarak jauh](/id/gateway/remote).

## Kontrak model yang agent-first

OpenClaw memperlakukan field OpenAI `model` sebagai **target agen**, bukan id model provider mentah.

- `model: "openclaw"` mengarahkan ke agen default yang dikonfigurasi.
- `model: "openclaw/default"` juga mengarahkan ke agen default yang dikonfigurasi.
- `model: "openclaw/<agentId>"` mengarahkan ke agen tertentu.

Header permintaan opsional:

- `x-openclaw-model: <provider/model-or-bare-id>` mengoverride model backend untuk agen yang dipilih.
- `x-openclaw-agent-id: <agentId>` tetap didukung sebagai override kompatibilitas.
- `x-openclaw-session-key: <sessionKey>` mengendalikan penuh perutean sesi.
- `x-openclaw-message-channel: <channel>` menetapkan konteks ingress channel sintetis untuk prompt dan kebijakan yang sadar channel.

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

Secara default, endpoint ini **stateless per permintaan** (kunci sesi baru dibuat setiap panggilan).

Jika permintaan menyertakan string OpenAI `user`, Gateway menurunkan kunci sesi stabil darinya, sehingga panggilan berulang dapat berbagi satu sesi agen.

## Mengapa surface ini penting

Ini adalah set kompatibilitas dengan leverage tertinggi untuk frontend dan alat self-hosted:

- Sebagian besar penyiapan Open WebUI, LobeChat, dan LibreChat mengharapkan `/v1/models`.
- Banyak sistem RAG mengharapkan `/v1/embeddings`.
- Klien chat OpenAI yang sudah ada biasanya dapat mulai dengan `/v1/chat/completions`.
- Klien yang lebih native-agen semakin memilih `/v1/responses`.

## Daftar model dan perutean agen

<AccordionGroup>
  <Accordion title="Apa yang dikembalikan `/v1/models`?">
    Daftar target agen OpenClaw.

    Id yang dikembalikan adalah entri `openclaw`, `openclaw/default`, dan `openclaw/<agentId>`.
    Gunakan langsung sebagai nilai OpenAI `model`.

  </Accordion>
  <Accordion title="Apakah `/v1/models` mencantumkan agen atau subagen?">
    Endpoint ini mencantumkan target agen tingkat atas, bukan model provider backend dan bukan subagen.

    Subagen tetap merupakan topologi eksekusi internal. Subagen tidak muncul sebagai pseudo-model.

  </Accordion>
  <Accordion title="Mengapa `openclaw/default` disertakan?">
    `openclaw/default` adalah alias stabil untuk agen default yang dikonfigurasi.

    Itu berarti klien dapat terus menggunakan satu id yang dapat diprediksi meskipun id agen default yang sebenarnya berubah antar environment.

  </Accordion>
  <Accordion title="Bagaimana saya mengoverride model backend?">
    Gunakan `x-openclaw-model`.

    Contoh:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Jika Anda tidak mengirimkannya, agen yang dipilih berjalan dengan pilihan model normal yang dikonfigurasinya.

  </Accordion>
  <Accordion title="Bagaimana embeddings cocok dengan kontrak ini?">
    `/v1/embeddings` menggunakan id `model` target agen yang sama.

    Gunakan `model: "openclaw/default"` atau `model: "openclaw/<agentId>"`.
    Saat Anda membutuhkan model embedding tertentu, kirimkan di `x-openclaw-model`.
    Tanpa header itu, permintaan diteruskan ke penyiapan embedding normal agen yang dipilih.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Atur `stream: true` untuk menerima Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Setiap baris event adalah `data: <json>`
- Stream berakhir dengan `data: [DONE]`

## Penyiapan cepat Open WebUI

Untuk koneksi Open WebUI dasar:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL Docker di macOS: `http://host.docker.internal:18789/v1`
- API key: token bearer Gateway Anda
- Model: `openclaw/default`

Perilaku yang diharapkan:

- `GET /v1/models` seharusnya mencantumkan `openclaw/default`
- Open WebUI seharusnya menggunakan `openclaw/default` sebagai id model chat
- Jika Anda menginginkan provider/model backend tertentu untuk agen itu, atur model default normal agen atau kirim `x-openclaw-model`

Smoke cepat:

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

Buat embeddings:

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

- `/v1/models` mengembalikan target agen OpenClaw, bukan katalog provider mentah.
- `openclaw/default` selalu ada sehingga satu id stabil dapat bekerja lintas environment.
- Override provider/model backend berada di `x-openclaw-model`, bukan field OpenAI `model`.
- `/v1/embeddings` mendukung `input` sebagai string atau array string.

## Terkait

- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [OpenAI](/id/providers/openai)
