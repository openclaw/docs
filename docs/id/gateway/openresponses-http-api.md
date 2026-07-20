---
read_when:
    - Mengintegrasikan klien yang menggunakan API OpenResponses
    - Anda menginginkan input berbasis item, pemanggilan alat klien, atau peristiwa SSE
summary: Ekspos endpoint HTTP `/v1/responses` yang kompatibel dengan OpenResponses dari Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-07-20T03:53:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5bfd6ca3bf0cecd761fde865b41a95cff3fc5681f74f31b3adae5cd2e0b0be95
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway dapat menyediakan endpoint `POST /v1/responses` yang kompatibel dengan OpenResponses. Endpoint ini **dinonaktifkan secara default** dan menggunakan port yang sama dengan Gateway (multipleks WS + HTTP): `http://<gateway-host>:<port>/v1/responses`.

Permintaan dijalankan seperti proses agen Gateway biasa (jalur kode yang sama dengan `openclaw agent`), sehingga perutean, izin, dan konfigurasi sesuai dengan Gateway Anda.

Aktifkan atau nonaktifkan dengan `gateway.http.endpoints.responses.enabled`. Saat diaktifkan, permukaan kompatibilitas yang sama juga menyediakan `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings`, dan `POST /v1/chat/completions`.

## Autentikasi, keamanan, dan perutean

Perilaku operasional sesuai dengan [OpenAI Chat Completions](/id/gateway/openai-http-api):

- Jalur autentikasi sesuai dengan `gateway.auth.mode`: rahasia bersama (`token`/`password`) menggunakan `Authorization: Bearer <token-or-password>`; proksi tepercaya menggunakan header proksi berbasis identitas (proksi loopback pada host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true`, dengan fallback langsung pada host yang sama melalui `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` saat tidak ada header `Forwarded`/`X-Forwarded-*`/`X-Real-IP`); `none` pada ingress privat tidak memerlukan header autentikasi. Lihat [Autentikasi proksi tepercaya](/id/gateway/trusted-proxy-auth).
- Perlakukan endpoint sebagai akses operator penuh ke instans gateway.
- Mode autentikasi rahasia bersama mengabaikan `x-openclaw-scopes` yang lebih sempit dan dideklarasikan oleh bearer, lalu memulihkan kumpulan cakupan operator default lengkap: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Giliran percakapan pada endpoint ini diperlakukan sebagai giliran pengirim-pemilik.
- Mode HTTP tepercaya yang membawa identitas (proksi tepercaya, atau `gateway.auth.mode="none"`) mematuhi `x-openclaw-scopes` jika tersedia; jika tidak, mode tersebut kembali ke kumpulan cakupan operator default. Semantik pemilik hilang hanya ketika pemanggil secara eksplisit mempersempit cakupan dan menghilangkan `operator.admin`.
- Pilih agen dengan `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"`, atau header `x-openclaw-agent-id`.
- Gunakan `x-openclaw-model` untuk mengganti model backend agen yang dipilih (memerlukan `operator.admin` pada jalur autentikasi yang membawa identitas).
- Gunakan `x-openclaw-session-key` untuk perutean sesi eksplisit (ditolak dengan `400 invalid_request_error` jika menggunakan namespace yang dicadangkan: `subagent:`, `cron:`, `acp:`).
- Gunakan `x-openclaw-message-channel` untuk konteks kanal ingress sintetis non-default.

Untuk penjelasan kanonis mengenai model target agen, `openclaw/default`, penerusan embedding, dan penggantian model backend, lihat [OpenAI Chat Completions](/id/gateway/openai-http-api#agent-first-model-contract).

Lihat [Cakupan operator](/id/gateway/operator-scopes) dan [Keamanan](/id/gateway/security).

## Perilaku sesi

Secara default, endpoint bersifat **tanpa status untuk setiap permintaan** (kunci sesi baru dibuat pada setiap panggilan).

Jika permintaan menyertakan string OpenResponses `user`, Gateway memperoleh kunci sesi stabil darinya agar panggilan berulang dapat berbagi satu sesi agen.

`previous_response_id` menggunakan kembali sesi respons sebelumnya ketika permintaan tetap berada dalam cakupan agen/pengguna/sesi yang diminta yang sama (dicocokkan berdasarkan subjek autentikasi, ID agen, dan `x-openclaw-session-key`).

## Bentuk permintaan

| Bidang                                                            | Dukungan                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `input`                                                          | String atau larik objek item.                                                                                               |
| `instructions`                                                   | Digabungkan ke dalam prompt sistem.                                                                                                 |
| `tools`                                                          | Definisi alat klien (alat fungsi).                                                                                      |
| `tool_choice`                                                    | `"auto"`, `"none"`, `"required"`, atau `{ "type": "function", "name": "..." }` untuk memfilter atau mewajibkan alat klien.                |
| `stream`                                                         | Mengaktifkan streaming SSE.                                                                                                         |
| `max_output_tokens`                                              | Batas keluaran upaya terbaik (bergantung pada penyedia).                                                                                 |
| `temperature`                                                    | Suhu sampling upaya terbaik. Diabaikan oleh backend Codex Responses berbasis ChatGPT, yang menggunakan sampling tetap di sisi server. |
| `top_p`                                                          | Sampling nukleus upaya terbaik. Peringatan Codex Responses yang sama seperti `temperature`.                                                    |
| `user`                                                           | Perutean sesi stabil.                                                                                                        |
| `previous_response_id`                                           | Kontinuitas sesi (lihat di atas).                                                                                                |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | Diterima tetapi saat ini diabaikan.                                                                                                |

## Item (masukan)

### `message`

Peran: `system`, `developer`, `user`, `assistant`.

- `system` dan `developer` ditambahkan ke prompt sistem.
- Item `user` atau `function_call_output` yang paling baru menjadi "pesan saat ini".
- Pesan pengguna/asisten sebelumnya disertakan sebagai riwayat untuk konteks.

### `function_call_output` (alat berbasis giliran)

Kirim kembali hasil alat ke model:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` dan `item_reference`

Diterima untuk kompatibilitas skema tetapi diabaikan saat membangun prompt.

## Alat (alat fungsi sisi klien)

Sediakan alat dengan `tools: [{ type: "function", name, description?, parameters? }]`.

Jika agen memanggil alat, respons mengembalikan item keluaran `function_call`. Kirim permintaan lanjutan dengan `function_call_output` untuk melanjutkan giliran.

Untuk `tool_choice: "required"` dan `tool_choice` yang disematkan ke fungsi, endpoint mempersempit kumpulan alat fungsi klien yang diekspos, menginstruksikan runtime agar memanggil alat klien sebelum merespons, dan menolak giliran jika tidak menyertakan panggilan alat klien terstruktur yang cocok, sesuai dengan kontrak `/v1/chat/completions`. Permintaan non-streaming mengembalikan `502` dengan `api_error`; permintaan streaming memancarkan peristiwa `response.failed`.

## Gambar (`input_image`)

Mendukung sumber base64 atau URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Jenis MIME yang diizinkan (default): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`. Ukuran maksimum (default): 10MB.

## Berkas (`input_file`)

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

Jenis MIME yang diizinkan (default): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`. Ukuran maksimum (default): 5MB.

Perilaku saat ini:

- Konten berkas didekode dan ditambahkan ke **prompt sistem**, bukan pesan pengguna, sehingga tetap bersifat sementara (tidak dipertahankan dalam riwayat sesi).
- Teks berkas yang didekode dibungkus sebagai **konten eksternal yang tidak tepercaya** sebelum ditambahkan, sehingga byte berkas diperlakukan sebagai data, bukan instruksi tepercaya. Blok yang disuntikkan menggunakan penanda batas eksplisit (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) dan baris metadata `Source: External`. Blok tersebut sengaja tidak menyertakan banner panjang `SECURITY NOTICE:` untuk mempertahankan anggaran prompt; penanda batas dan metadata tetap berlaku.
- PDF terlebih dahulu diurai untuk mengambil teks. Jika hanya sedikit teks yang ditemukan, halaman-halaman pertama dirasterisasi menjadi gambar dan diteruskan ke model, serta blok berkas yang disuntikkan menggunakan placeholder `[PDF content rendered to images]`.

Penguraian PDF disediakan oleh plugin bawaan `document-extract`, yang menggunakan `clawpdf` beserta runtime WebAssembly PDFium yang dikemas untuk ekstraksi teks dan perenderan halaman.

Default pengambilan URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (total bagian `input_file` + `input_image` berbasis URL per permintaan)
- Permintaan dilindungi (resolusi DNS, pemblokiran IP privat, batas pengalihan, batas waktu).
- Daftar izin nama host opsional didukung untuk setiap jenis masukan (`files.urlAllowlist`, `images.urlAllowlist`): host persis (`"cdn.example.com"`) atau subdomain wildcard (`"*.assets.example.com"`, tidak cocok dengan domain apex). Daftar izin yang kosong atau tidak dicantumkan berarti tidak ada pembatasan berdasarkan daftar izin nama host.
- Untuk menonaktifkan pengambilan berbasis URL sepenuhnya, tetapkan `files.allowUrl: false` dan/atau `images.allowUrl: false`.

## Batas berkas + gambar

Endpoint menggunakan batas bawaan sebesar 20 MB untuk isi permintaan. Kebijakan sumber berkas dan gambar
tetap dapat dikonfigurasi di bawah `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
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
            maxChars: 60000,
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

Default jika tidak dicantumkan:

| Kunci                      | Default   |
| ------------------------ | --------- |
| `maxUrlParts`            | 8         |
| `files.maxBytes`         | 5MB       |
| `files.maxChars`         | 60k       |
| `files.maxRedirects`     | 3         |
| `files.timeoutMs`        | 10s       |
| `files.pdf.maxPages`     | 4         |
| `files.pdf.maxPixels`    | 4,000,000 |
| `files.pdf.minTextChars` | 200       |
| `images.maxBytes`        | 10MB      |
| `images.maxRedirects`    | 3         |
| `images.timeoutMs`       | 10s       |

Sumber HEIC/HEIF `input_image` dinormalisasi menjadi JPEG sebelum dikirimkan ke penyedia melalui pemroses gambar bersama OpenClaw (Rastermill), yang beralih ke konverter sistem (`sips`, ImageMagick, GraphicsMagick, atau ffmpeg) untuk format yang memerlukan dukungan codec eksternal.

Catatan keamanan: daftar izin URL diterapkan sebelum pengambilan dan pada setiap lompatan pengalihan. Memasukkan nama host ke daftar izin tidak melewati pemblokiran IP privat/internal. Untuk Gateway yang terpapar internet, terapkan kontrol lalu lintas keluar jaringan selain perlindungan tingkat aplikasi. Lihat [Keamanan](/id/gateway/security).

## Streaming (SSE)

Atur `stream: true` untuk menerima Server-Sent Events:

- `Content-Type: text/event-stream`
- Setiap baris peristiwa adalah `event: <type>` dan `data: <json>`
- Aliran berakhir dengan `data: [DONE]`

Jenis peristiwa yang saat ini dipancarkan: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (saat terjadi kesalahan).

## Penggunaan

`usage` diisi saat penyedia yang mendasarinya melaporkan jumlah token. OpenClaw menormalisasi alias umum bergaya OpenAI sebelum penghitung tersebut mencapai permukaan status/sesi hilir, termasuk `input_tokens` / `output_tokens` dan `prompt_tokens` / `completion_tokens`.

## Kesalahan

Kesalahan menggunakan objek JSON seperti:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Kasus umum: `400` isi permintaan tidak valid, `401` autentikasi tidak ada/tidak valid, `403` cakupan operator tidak ada, `405` metode salah, `429` terlalu banyak upaya autentikasi yang gagal (dengan `Retry-After`).

## Contoh

Tanpa streaming:

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

- [Penyelesaian percakapan OpenAI](/id/gateway/openai-http-api)
- [Cakupan operator](/id/gateway/operator-scopes)
- [OpenAI](/id/providers/openai)
