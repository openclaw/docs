---
read_when:
    - Mengintegrasikan klien yang menggunakan OpenResponses API
    - Anda menginginkan input berbasis item, pemanggilan alat klien, atau peristiwa SSE
summary: Ekspos endpoint HTTP /v1/responses yang kompatibel dengan OpenResponses dari Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-06-27T17:31:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw's Gateway dapat menyajikan endpoint `POST /v1/responses` yang kompatibel dengan OpenResponses.

Endpoint ini **dinonaktifkan secara default**. Aktifkan terlebih dahulu di konfigurasi.

- `POST /v1/responses`
- Port yang sama dengan Gateway (multipleks WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Di balik layar, permintaan dieksekusi sebagai run agen Gateway normal (codepath yang sama dengan
`openclaw agent`), sehingga routing/izin/konfigurasi cocok dengan Gateway Anda.

## Autentikasi, keamanan, dan routing

Perilaku operasional cocok dengan [OpenAI Chat Completions](/id/gateway/openai-http-api):

- gunakan jalur autentikasi HTTP Gateway yang sesuai:
  - autentikasi rahasia bersama (`gateway.auth.mode="token"` atau `"password"`): `Authorization: Bearer <token-or-password>`
  - autentikasi trusted-proxy (`gateway.auth.mode="trusted-proxy"`): header proxy sadar-identitas dari sumber proxy tepercaya yang dikonfigurasi; proxy loopback host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` eksplisit
  - fallback langsung lokal trusted-proxy: pemanggil host yang sama tanpa header `Forwarded`, `X-Forwarded-*`, atau `X-Real-IP` dapat menggunakan `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`
  - autentikasi terbuka private-ingress (`gateway.auth.mode="none"`): tanpa header autentikasi
- perlakukan endpoint sebagai akses operator penuh untuk instans gateway
- untuk mode autentikasi rahasia bersama (`token` dan `password`), abaikan nilai `x-openclaw-scopes` yang lebih sempit yang dideklarasikan bearer dan pulihkan default operator penuh yang normal
- untuk mode HTTP yang membawa identitas tepercaya (misalnya autentikasi trusted proxy atau `gateway.auth.mode="none"`), hormati `x-openclaw-scopes` saat ada dan jika tidak gunakan set cakupan default operator normal sebagai fallback
- pilih agen dengan `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"`, atau `x-openclaw-agent-id`
- gunakan `x-openclaw-model` saat Anda ingin menimpa model backend agen yang dipilih
- gunakan `x-openclaw-session-key` untuk routing sesi eksplisit
- gunakan `x-openclaw-message-channel` saat Anda menginginkan konteks channel ingress sintetis non-default

Matriks autentikasi:

- `gateway.auth.mode="token"` atau `"password"` + `Authorization: Bearer ...`
  - membuktikan kepemilikan rahasia operator gateway bersama
  - mengabaikan `x-openclaw-scopes` yang lebih sempit
  - memulihkan set cakupan operator default penuh:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - memperlakukan giliran chat pada endpoint ini sebagai giliran owner-sender
- mode HTTP yang membawa identitas tepercaya (misalnya autentikasi trusted proxy, atau `gateway.auth.mode="none"` pada private ingress)
  - menghormati `x-openclaw-scopes` saat header ada
  - menggunakan set cakupan default operator normal sebagai fallback saat header tidak ada
  - hanya kehilangan semantik owner saat pemanggil secara eksplisit mempersempit cakupan dan menghilangkan `operator.admin`

Aktifkan atau nonaktifkan endpoint ini dengan `gateway.http.endpoints.responses.enabled`.

Permukaan kompatibilitas yang sama juga mencakup:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Untuk penjelasan kanonis tentang bagaimana model target agen, `openclaw/default`, pass-through embeddings, dan override model backend saling cocok, lihat [OpenAI Chat Completions](/id/gateway/openai-http-api#agent-first-model-contract) dan [Daftar model dan routing agen](/id/gateway/openai-http-api#model-list-and-agent-routing).

## Perilaku sesi

Secara default endpoint ini **stateless per permintaan** (kunci sesi baru dibuat setiap panggilan).

Jika permintaan menyertakan string `user` OpenResponses, Gateway memperoleh kunci sesi stabil
darinya, sehingga panggilan berulang dapat berbagi sesi agen.

## Bentuk permintaan (didukung)

Permintaan mengikuti API OpenResponses dengan input berbasis item. Dukungan saat ini:

- `input`: string atau array objek item.
- `instructions`: digabungkan ke prompt sistem.
- `tools`: definisi tool klien (tool fungsi).
- `tool_choice`: `"auto"`, `"none"`, `"required"`, atau `{ "type": "function", "name": "..." }` untuk memfilter atau mewajibkan tool klien.
- `stream`: mengaktifkan streaming SSE.
- `max_output_tokens`: batas output upaya terbaik (bergantung pada provider).
- `temperature`: temperatur sampling upaya terbaik yang diteruskan ke provider. Diabaikan oleh backend Codex Responses berbasis ChatGPT, yang menggunakan sampling sisi server tetap.
- `top_p`: sampling nukleus upaya terbaik yang diteruskan ke provider. Catatan Codex Responses yang sama seperti `temperature`.
- `user`: routing sesi stabil.

Diterima tetapi **saat ini diabaikan**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Didukung:

- `previous_response_id`: OpenClaw menggunakan kembali sesi respons sebelumnya saat permintaan tetap berada dalam cakupan agen/pengguna/sesi yang diminta yang sama.

## Item (`input`)

### `message`

Peran: `system`, `developer`, `user`, `assistant`.

- `system` dan `developer` ditambahkan ke prompt sistem.
- Item `user` atau `function_call_output` terbaru menjadi "pesan saat ini."
- Pesan user/assistant sebelumnya disertakan sebagai riwayat untuk konteks.

### `function_call_output` (tool berbasis giliran)

Kirim hasil tool kembali ke model:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` dan `item_reference`

Diterima untuk kompatibilitas skema tetapi diabaikan saat membangun prompt.

## Tool (tool fungsi sisi klien)

Sediakan tool dengan `tools: [{ type: "function", name, description?, parameters? }]`.

Jika agen memutuskan untuk memanggil tool, respons mengembalikan item output `function_call`.
Anda kemudian mengirim permintaan lanjutan dengan `function_call_output` untuk melanjutkan giliran.

Untuk `tool_choice: "required"` dan `tool_choice` yang dipatok ke fungsi, endpoint mempersempit set tool fungsi klien yang diekspos, menginstruksikan runtime untuk memanggil tool klien sebelum merespons, dan menolak giliran jika tidak menyertakan panggilan tool klien terstruktur yang cocok. Kontrak ini berlaku untuk daftar HTTP `tools` yang disediakan pemanggil, bukan setiap tool agen OpenClaw internal. Permintaan non-streaming mengembalikan `502` dengan `api_error`; permintaan streaming memancarkan event `response.failed`. Ini cocok dengan kontrak `/v1/chat/completions`.

## Gambar (`input_image`)

Mendukung sumber base64 atau URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Jenis MIME yang diizinkan (saat ini): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Ukuran maksimum (saat ini): 10MB.

## File (`input_file`)

Mendukung sumber base64 atau URL:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

Jenis MIME yang diizinkan (saat ini): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Ukuran maksimum (saat ini): 5MB.

Perilaku saat ini:

- Konten file didekode dan ditambahkan ke **prompt sistem**, bukan pesan pengguna,
  sehingga tetap sementara (tidak dipertahankan dalam riwayat sesi).
- Teks file yang didekode dibungkus sebagai **konten eksternal tidak tepercaya** sebelum ditambahkan,
  sehingga byte file diperlakukan sebagai data, bukan instruksi tepercaya.
- Blok yang disisipkan menggunakan penanda batas eksplisit seperti
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` dan menyertakan baris metadata
  `Source: External`.
- Jalur input file ini sengaja menghilangkan banner panjang `SECURITY NOTICE:` untuk
  mempertahankan anggaran prompt; penanda batas dan metadata tetap dipertahankan.
- PDF diuraikan untuk teks terlebih dahulu. Jika hanya sedikit teks ditemukan, halaman pertama
  dirasterisasi menjadi gambar dan diteruskan ke model, dan blok file yang disisipkan menggunakan
  placeholder `[PDF content rendered to images]`.

Penguraian PDF disediakan oleh Plugin bawaan `document-extract`, yang menggunakan
`clawpdf` dan runtime WebAssembly PDFium terpaketnya untuk ekstraksi teks dan
rendering halaman.

Default pengambilan URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (total bagian `input_file` + `input_image` berbasis URL per permintaan)
- Permintaan dijaga (resolusi DNS, pemblokiran IP pribadi, batas redirect, timeout).
- Allowlist hostname opsional didukung per jenis input (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host persis: `"cdn.example.com"`
  - Subdomain wildcard: `"*.assets.example.com"` (tidak cocok dengan apex)
  - Allowlist yang kosong atau dihilangkan berarti tidak ada pembatasan allowlist hostname.
- Untuk menonaktifkan pengambilan berbasis URL sepenuhnya, setel `files.allowUrl: false` dan/atau `images.allowUrl: false`.

## Batas file + gambar (konfigurasi)

Default dapat disetel di bawah `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Default saat dihilangkan:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- Sumber `input_image` HEIC/HEIF diterima saat konverter sistem tersedia dan dinormalisasi ke JPEG sebelum pengiriman provider. Konverter yang didukung adalah `sips` macOS, ImageMagick, GraphicsMagick, atau ffmpeg.

Catatan keamanan:

- Allowlist URL diberlakukan sebelum pengambilan dan pada hop redirect.
- Mengizinkan hostname dalam allowlist tidak melewati pemblokiran IP pribadi/internal.
- Untuk gateway yang terekspos internet, terapkan kontrol egress jaringan selain guard tingkat aplikasi.
  Lihat [Keamanan](/id/gateway/security).

## Streaming (SSE)

Setel `stream: true` untuk menerima Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Setiap baris event adalah `event: <type>` dan `data: <json>`
- Stream berakhir dengan `data: [DONE]`

Jenis event yang saat ini dipancarkan:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (saat error)

## Penggunaan

`usage` diisi saat provider yang mendasarinya melaporkan jumlah token.
OpenClaw menormalisasi alias umum bergaya OpenAI sebelum penghitung tersebut mencapai
permukaan status/sesi downstream, termasuk `input_tokens` / `output_tokens`
dan `prompt_tokens` / `completion_tokens`.

## Error

Error menggunakan objek JSON seperti:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Kasus umum:

- `401` autentikasi hilang/tidak valid
- `400` isi permintaan tidak valid
- `405` metode salah

## Contoh

Non-streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

Streaming:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## Terkait

- [Penyelesaian obrolan OpenAI](/id/gateway/openai-http-api)
- [OpenAI](/id/providers/openai)
