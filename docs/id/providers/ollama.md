---
read_when:
    - Anda ingin menjalankan OpenClaw dengan model cloud atau lokal melalui Ollama
    - Anda memerlukan panduan penyiapan dan konfigurasi Ollama
    - Anda ingin menggunakan model vision Ollama untuk memahami gambar
summary: Jalankan OpenClaw dengan Ollama (model cloud dan lokal)
title: Ollama
x-i18n:
    generated_at: "2026-07-12T14:36:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw berkomunikasi dengan API native Ollama (`/api/chat`), bukan endpoint
`/v1` yang kompatibel dengan OpenAI. Tiga mode didukung:

| Mode          | Yang digunakan                                                                     |
| ------------- | ---------------------------------------------------------------------------------- |
| Cloud + Lokal | Host Ollama yang dapat dijangkau, yang menyajikan model lokal dan (jika sudah masuk) model `:cloud` |
| Hanya cloud   | `https://ollama.com` secara langsung, tanpa daemon lokal                           |
| Hanya lokal   | Host Ollama yang dapat dijangkau, hanya model lokal                                |

Untuk penyiapan khusus cloud dengan id penyedia khusus `ollama-cloud`, lihat
[Ollama Cloud](/id/providers/ollama-cloud). Gunakan referensi `ollama-cloud/<model>` saat
Anda ingin perutean cloud tetap terpisah dari penyedia `ollama` lokal.

<Warning>
Jangan gunakan URL `/v1` yang kompatibel dengan OpenAI (`http://host:11434/v1`). URL tersebut merusak pemanggilan alat dan model dapat mengeluarkan JSON pemanggilan alat mentah sebagai teks biasa. Gunakan URL native: `baseUrl: "http://host:11434"` (tanpa `/v1`).
</Warning>

Kunci konfigurasi kanonis adalah `baseUrl`. `baseURL` juga diterima untuk
contoh bergaya OpenAI SDK, tetapi konfigurasi baru sebaiknya menggunakan `baseUrl`.

## Aturan autentikasi

<AccordionGroup>
  <Accordion title="Host lokal dan LAN">
    URL Ollama local loopback, jaringan privat, `.local`, dan nama host polos tidak memerlukan token bearer yang sebenarnya. OpenClaw menggunakan penanda `ollama-local` untuk URL tersebut.
  </Accordion>
  <Accordion title="Host jarak jauh dan Ollama Cloud">
    Host publik jarak jauh dan `https://ollama.com` memerlukan kredensial yang sebenarnya: `OLLAMA_API_KEY`, profil autentikasi, atau `apiKey` penyedia. Untuk penggunaan langsung yang dihosting, utamakan penyedia `ollama-cloud`.
  </Accordion>
  <Accordion title="Id penyedia khusus">
    Penyedia khusus dengan `api: "ollama"` mengikuti aturan yang sama. Misalnya, penyedia `ollama-remote` yang diarahkan ke host LAN privat dapat menggunakan `apiKey: "ollama-local"`; subagen menyelesaikan penanda tersebut melalui hook penyedia Ollama alih-alih menganggapnya sebagai kredensial yang hilang. `agents.defaults.memorySearch.provider` juga dapat diarahkan ke id penyedia khusus agar embedding menggunakan endpoint Ollama tersebut.
  </Accordion>
  <Accordion title="Profil autentikasi">
    `auth-profiles.json` menyimpan kredensial untuk suatu id penyedia; letakkan pengaturan endpoint (`baseUrl`, `api`, model, header, batas waktu) di `models.providers.<id>`. Berkas datar lama seperti `{ "ollama-windows": { "apiKey": "ollama-local" } }` bukan format runtime; `openclaw doctor --fix` menulis ulang berkas tersebut menjadi profil kunci API kanonis `ollama-windows:default` beserta cadangannya. Nilai `baseUrl` dalam berkas lama tersebut tidak relevan dan harus dipindahkan ke konfigurasi penyedia.
  </Accordion>
  <Accordion title="Cakupan embedding memori">
    Autentikasi bearer untuk embedding memori Ollama dibatasi pada host tempat autentikasi tersebut dideklarasikan:

    - Kunci tingkat penyedia hanya dikirim ke host penyedia tersebut.
    - `agents.*.memorySearch.remote.apiKey` hanya dikirim ke host embedding jarak jauhnya.
    - Nilai env `OLLAMA_API_KEY` murni dianggap sebagai konvensi Ollama Cloud dan secara default tidak dikirim ke host lokal/yang dihosting sendiri.

  </Accordion>
</AccordionGroup>

## Memulai

<Tabs>
  <Tab title="Orientasi awal (disarankan)">
    <Steps>
      <Step title="Jalankan orientasi awal">
        ```bash
        openclaw onboard
        ```

        Pilih **Ollama**, lalu pilih mode: **Cloud + Lokal**, **Hanya cloud**, atau **Hanya lokal**.
      </Step>
      <Step title="Pilih model">
        `Cloud only` meminta `OLLAMA_API_KEY` dan menyarankan default cloud yang dihosting. `Cloud + Local` dan `Local only` meminta URL dasar Ollama, menemukan model yang tersedia, dan otomatis menarik model lokal yang dipilih jika belum ada. Tag `:latest` yang terpasang seperti `gemma4:latest` ditampilkan satu kali agar tidak menduplikasi `gemma4`. `Cloud + Local` juga memeriksa apakah host sudah masuk untuk akses cloud.
      </Step>
      <Step title="Verifikasi">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    Noninteraktif:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` dan `--custom-model-id` bersifat opsional; jika dihilangkan, host lokal default dan model yang disarankan `gemma4` akan digunakan.

  </Tab>

  <Tab title="Penyiapan manual">
    <Steps>
      <Step title="Instal dan jalankan Ollama">
        Dapatkan dari [ollama.com/download](https://ollama.com/download), lalu tarik sebuah model:

        ```bash
        ollama pull gemma4
        ```

        Untuk akses cloud hibrida, jalankan `ollama signin` pada host yang sama.
      </Step>
      <Step title="Tetapkan kredensial">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # host lokal/LAN, nilai apa pun dapat digunakan
        export OLLAMA_API_KEY="your-real-key"   # hanya https://ollama.com
        ```

        Atau dalam konfigurasi: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="Pilih model">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Atau dalam konfigurasi:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Model cloud melalui host lokal

`Cloud + Local` merutekan model lokal dan model `:cloud` melalui satu
host Ollama yang dapat dijangkau — ini adalah alur hibrida Ollama dan mode yang dipilih selama penyiapan
saat Anda menginginkan keduanya.

OpenClaw meminta URL dasar, menemukan model lokal, dan memeriksa
status `ollama signin`. Saat sudah masuk, OpenClaw menyarankan default yang dihosting
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Jika
belum masuk, penyiapan tetap hanya lokal sampai Anda menjalankan `ollama signin`.

Untuk akses khusus cloud tanpa daemon lokal, gunakan `openclaw onboard --auth-choice ollama-cloud` dan lihat [Ollama Cloud](/id/providers/ollama-cloud) — jalur tersebut tidak memerlukan `ollama signin` atau server yang sedang berjalan:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

Daftar model cloud yang ditampilkan selama `openclaw onboard` diisi secara langsung dari
`https://ollama.com/api/tags`, dibatasi hingga 500 entri, sehingga pemilih mencerminkan
katalog yang dihosting saat ini. Jika `ollama.com` tidak dapat dijangkau atau tidak mengembalikan
model saat penyiapan, OpenClaw beralih ke daftar saran bawaan agar
orientasi awal tetap selesai.

## Penemuan model (penyedia implisit)

Saat `OLLAMA_API_KEY` (atau profil autentikasi) ditetapkan dan baik
`models.providers.ollama` maupun penyedia khusus lain dengan `api: "ollama"` tidak
didefinisikan, OpenClaw menemukan model dari `http://127.0.0.1:11434`:

| Perilaku             | Detail                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kueri katalog        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| Deteksi kemampuan    | Pembacaan upaya terbaik `/api/show` membaca `contextWindow`, parameter Modelfile `num_ctx`, dan kemampuan (visi/alat/penalaran)                                                                                                                                                                |
| Model visi           | Kemampuan `vision` dari `/api/show` menandai model sebagai mampu memproses gambar (`input: ["text", "image"]`)                                                                                                                                                                                |
| Deteksi penalaran    | Menggunakan kemampuan `thinking` dari `/api/show` jika tersedia; beralih ke heuristik nama (`r1`, `reason`, `reasoning`, `think`) saat Ollama tidak menyertakan kemampuan. `glm-5.2:cloud` dan `deepseek-v4-flash\|pro:cloud` selalu dianggap sebagai model penalaran, terlepas dari kemampuan yang dilaporkan. |
| Batas token          | `maxTokens` secara default menggunakan batas maksimum token Ollama milik OpenClaw                                                                                                                                                                                                              |
| Biaya                | Semua biaya adalah `0`                                                                                                                                                                                                                                                                        |

```bash
ollama list
openclaw models list
```

Menetapkan `models.providers.ollama` dengan array `models` eksplisit, atau
penyedia khusus dengan `api: "ollama"` dan `baseUrl` non-local loopback, menonaktifkan
penemuan otomatis; model kemudian harus didefinisikan secara manual (lihat
[Konfigurasi](#configuration)). Entri `models.providers.ollama` yang diarahkan ke
`https://ollama.com` yang dihosting juga melewati penemuan, karena model Ollama Cloud
dikelola oleh penyedia. Penyedia local loopback khusus seperti
`http://127.0.0.2:11434` tetap dianggap lokal dan mempertahankan penemuan otomatis.

Anda dapat menggunakan referensi lengkap seperti `ollama/<pulled-model>:latest` tanpa
entri `models.json` yang ditulis manual; OpenClaw menyelesaikannya secara langsung. Untuk host
yang sudah masuk, memilih referensi `ollama/<model>:cloud` yang tidak terdaftar akan memvalidasi model persis tersebut
dengan `/api/show` dan menambahkannya ke katalog runtime hanya jika Ollama
mengonfirmasi metadata — salah ketik tetap gagal sebagai model yang tidak dikenal.

### Uji asap

Untuk pemeriksaan teks terbatas yang melewati seluruh permukaan alat agen:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Tambahkan `--file` dengan gambar untuk pemeriksaan model visi yang ringan (menerima PNG/JPEG/WebP;
berkas non-gambar ditolak sebelum Ollama dipanggil — gunakan
`openclaw infer audio transcribe` untuk audio):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

Kedua jalur tersebut tidak memuat alat obrolan, memori, atau konteks sesi. Jika jalur ini berhasil
sementara balasan agen normal gagal, masalahnya kemungkinan terletak pada kapasitas alat/agen
model, bukan endpoint.

Memilih model dengan `/model ollama/<model>` merupakan pilihan pengguna yang persis: jika
`baseUrl` yang dikonfigurasi tidak dapat dijangkau, balasan berikutnya gagal dengan kesalahan penyedia,
alih-alih diam-diam beralih ke model lain yang dikonfigurasi.

Tugas cron terisolasi menambahkan satu pemeriksaan keamanan lokal sebelum memulai giliran agen:
jika model yang dipilih diselesaikan ke penyedia Ollama lokal/jaringan privat/`.local`
dan `/api/tags` tidak dapat dijangkau, OpenClaw mencatat proses tersebut sebagai
`skipped` dengan model dalam teks kesalahan. Pemeriksaan endpoint ini disimpan dalam cache selama
5 menit per host, sehingga tugas cron berulang terhadap daemon yang berhenti tidak semuanya
meluncurkan permintaan yang akan gagal.

Verifikasi langsung:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Untuk Ollama Cloud, arahkan pengujian langsung yang sama ke endpoint ter-host (melewati
embedding secara default; paksa dengan `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` karena
kunci cloud mungkin tidak mengizinkan `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Untuk menambahkan model, tarik model tersebut dan model akan ditemukan secara otomatis:

```bash
ollama pull mistral
```

## Inferensi lokal Node

Agen dapat mendelegasikan tugas singkat ke model Ollama pada desktop atau
Node server yang dipasangkan. Prompt dan respons melewati koneksi
Gateway/Node terautentikasi yang sudah ada; permintaan dijalankan pada endpoint
Ollama local loopback milik Node (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Mulai Ollama pada Node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Hubungkan host Node">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Setujui perangkat dan perintah Node-nya pada host Gateway, lalu verifikasi:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Koneksi pertama, atau peningkatan yang menambahkan perintah Ollama, dapat memicu
    persetujuan perintah Node. Jika Node terhubung tanpa mengiklankan
    `ollama.models` dan `ollama.chat`, periksa kembali `openclaw nodes pending`.

  </Step>
  <Step title="Gunakan dari agen">
    Plugin Ollama bawaan menyediakan alat `node_inference`. Agen terlebih dahulu
    memanggil `action: "discover"`, lalu `action: "run"` dengan Node dan model dari
    hasil tersebut (`run` dapat menghilangkan Node ketika tepat satu Node berkemampuan
    terhubung). Contoh: "Temukan model Ollama pada Node saya, lalu gunakan
    model termuat yang paling cepat untuk merangkum teks ini."
  </Step>
</Steps>

Penemuan membaca `/api/tags`, memeriksa kemampuan `/api/show`, dan menggunakan
`/api/ps` jika tersedia untuk memprioritaskan model yang sudah termuat. Penemuan hanya
mengembalikan model lokal yang dilaporkan Ollama sebagai berkemampuan percakapan
(kemampuan `completion`) — baris Ollama Cloud dan model khusus embedding dikecualikan.
Setiap eksekusi menonaktifkan pemikiran model dan menetapkan keluaran default sebanyak
512 token (batas mutlak 8192), kecuali pemanggilan alat meminta `maxTokens` yang berbeda;
beberapa model (misalnya GPT-OSS) tidak mendukung penonaktifan pemikiran dan mungkin
tetap menghasilkan token penalaran.

Untuk mempertahankan Ollama tetap berjalan pada Node tanpa menyediakannya kepada agen:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Mulai ulang Node (`openclaw node restart`, atau hentikan/jalankan ulang
`openclaw node run` untuk sesi latar depan). Node berhenti mengiklankan
`ollama.models` dan `ollama.chat`; Ollama itu sendiri dan penyedia Ollama milik Gateway
tidak terpengaruh. Atur kembali nilainya menjadi `true` dan mulai ulang untuk mengaktifkannya
kembali; permukaan perintah yang berubah mungkin memerlukan persetujuan
`openclaw nodes pending` lagi setelah tersambung kembali.

Verifikasi perintah Node secara langsung, tanpa giliran agen:

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

`--invoke-timeout` membatasi durasi yang dimiliki Node untuk menjalankan perintah;
`--timeout` membatasi keseluruhan panggilan Gateway dan harus lebih besar.

Inferensi lokal Node selalu menggunakan endpoint local loopback milik Node — inferensi ini
tidak menggunakan kembali `models.providers.ollama.baseUrl` jarak jauh/cloud yang
dikonfigurasi. Perintah Node tersedia secara default pada host Node macOS, Linux, dan
Windows serta tetap tunduk pada kebijakan pemasangan/perintah Node yang normal.

## Penglihatan dan deskripsi gambar

Plugin Ollama bawaan mendaftarkan Ollama sebagai penyedia pemahaman media
berkemampuan gambar, sehingga OpenClaw dapat merutekan permintaan deskripsi gambar
eksplisit dan default model gambar yang dikonfigurasi melalui model penglihatan Ollama
lokal atau ter-host.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` harus berupa referensi `<provider/model>` lengkap; ketika ditetapkan, `infer image
describe` mencoba model tersebut terlebih dahulu alih-alih melewati deskripsi untuk model
yang sudah mendukung penglihatan native. Jika panggilan gagal, OpenClaw dapat melanjutkan
melalui `agents.defaults.imageModel.fallbacks`; kesalahan penyiapan file/URL menyebabkan
kegagalan sebelum fallback dicoba. Gunakan `infer image describe` untuk alur pemahaman
gambar OpenClaw dan `imageModel` yang dikonfigurasi; gunakan `infer model run
--file` untuk pemeriksaan multimodal mentah dengan prompt khusus.

Untuk menjadikan Ollama penyedia pemahaman gambar default bagi media masuk:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Utamakan referensi `ollama/<model>` lengkap. Referensi `imageModel` polos seperti
`qwen2.5vl:7b` dinormalisasi menjadi `ollama/qwen2.5vl:7b` hanya ketika model persis
tersebut tercantum di bawah `models.providers.ollama.models` dengan
`input: ["text", "image"]` dan tidak ada penyedia gambar lain yang dikonfigurasi
menyediakan id polos yang sama; jika tidak, gunakan prefiks penyedia secara eksplisit.

Model penglihatan lokal yang lambat mungkin memerlukan batas waktu pemahaman gambar
yang lebih panjang daripada model cloud, dan dapat mogok pada perangkat keras terbatas
jika Ollama mencoba mengalokasikan seluruh konteks penglihatan yang diiklankan model.
Tetapkan batas waktu kemampuan dan batasi `num_ctx`:

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

Batas waktu ini berlaku untuk pemahaman gambar masuk dan alat `image` eksplisit.
`models.providers.ollama.timeoutSeconds` tetap mengendalikan pembatas permintaan HTTP
Ollama yang mendasari untuk panggilan model normal.

Verifikasi langsung:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Jika Anda mendefinisikan `models.providers.ollama.models` secara manual, tandai model
penglihatan secara eksplisit:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw menolak permintaan deskripsi gambar untuk model yang tidak ditandai
berkemampuan gambar. Dengan penemuan implisit, informasi ini berasal dari kemampuan
penglihatan `/api/show`.

## Konfigurasi

<Tabs>
  <Tab title="Dasar (penemuan implisit)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Jika `OLLAMA_API_KEY` ditetapkan, Anda dapat menghilangkan `apiKey` dalam entri penyedia; OpenClaw mengisinya untuk pemeriksaan ketersediaan.
    </Tip>

  </Tab>

  <Tab title="Eksplisit (model manual)">
    Gunakan konfigurasi eksplisit untuk penyiapan cloud ter-host, host/port non-default,
    jendela konteks yang dipaksakan, atau daftar model yang sepenuhnya manual:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="URL dasar khusus">
    Konfigurasi eksplisit menonaktifkan penemuan otomatis, sehingga model harus dicantumkan:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Tanpa /v1 - URL API native Ollama
            api: "ollama", // Eksplisit: menjamin perilaku pemanggilan alat native
            timeoutSeconds: 300, // Opsional: anggaran koneksi/aliran lebih panjang untuk model lokal yang belum termuat
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Opsional: pertahankan model tetap termuat di antara giliran
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Jangan tambahkan `/v1`. Jalur tersebut memilih mode kompatibel OpenAI, yang pemanggilan alatnya tidak andal.
    </Warning>

  </Tab>
</Tabs>

## Resep umum

Ganti ID model dengan nama persis dari `ollama list` atau
`openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Model lokal dengan penemuan otomatis">
    Ollama pada mesin yang sama dengan Gateway, ditemukan secara otomatis:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Jangan tambahkan blok `models.providers.ollama` kecuali Anda memerlukan model manual.

  </Accordion>

  <Accordion title="Host Ollama LAN dengan model manual">
    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` adalah anggaran konteks OpenClaw; `params.num_ctx` dikirim ke
    Ollama. Selaraskan keduanya ketika perangkat keras tidak dapat menjalankan seluruh
    konteks yang diiklankan model.

  </Accordion>

  <Accordion title="Hanya Ollama Cloud">
    Tanpa daemon lokal, langsung menggunakan model ter-host:

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

    Untuk id penyedia khusus `ollama-cloud` sebagai pengganti bentuk ini, lihat
    [Ollama Cloud](/id/providers/ollama-cloud).

  </Accordion>

  <Accordion title="Cloud dan lokal melalui daemon yang sudah masuk">
    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Beberapa host Ollama">
    Gunakan ID penyedia khusus saat menjalankan lebih dari satu server Ollama; masing-masing memiliki
    host, model, autentikasi, dan batas waktunya sendiri.

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    OpenClaw menghapus prefiks penyedia aktif (dengan kembali menggunakan prefiks
    `ollama/` saja sebagai cadangan) sebelum memanggil Ollama, sehingga `ollama-large/qwen3.5:27b`
    diterima Ollama sebagai `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Profil model lokal ringan">
    Beberapa model lokal dapat menangani prompt sederhana, tetapi kesulitan dengan seluruh
    cakupan alat agen. Batasi alat dan konteks sebelum mengubah pengaturan
    runtime global:

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    Gunakan `compat.supportsTools: false` hanya ketika model atau server selalu
    gagal memproses skema alat — pengaturan ini mengorbankan kemampuan agen demi stabilitas.
    `localModelLean` menghapus alat berat untuk peramban, cron, pesan, pembuatan media,
    suara, dan PDF dari cakupan langsung agen kecuali diwajibkan secara eksplisit,
    serta menempatkan katalog yang lebih besar di balik Pencarian Alat. Pengaturan ini tidak mengubah
    konteks runtime atau mode berpikir Ollama. Padukan dengan `params.num_ctx` dan
    `params.thinking: false` untuk model berpikir kecil bergaya Qwen yang berulang
    atau menghabiskan anggarannya untuk penalaran tersembunyi.

  </Accordion>
</AccordionGroup>

### Pemilihan model

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

ID penyedia khusus bekerja dengan cara yang sama: untuk referensi yang menggunakan prefiks
penyedia aktif, seperti `ollama-spark/qwen3:32b`, OpenClaw menghapus prefiks tersebut sebelum
memanggil Ollama dan mengirimkan `qwen3:32b`.

Untuk model lokal yang lambat, utamakan penyesuaian dalam lingkup penyedia sebelum meningkatkan
batas waktu seluruh runtime agen:

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` mencakup permintaan HTTP model: penyiapan koneksi, header,
pengaliran isi, dan pembatalan total pengambilan terlindungi. `params.keep_alive`
diteruskan sebagai `keep_alive` tingkat teratas pada permintaan `/api/chat` native; atur
per model ketika waktu pemuatan giliran pertama menjadi hambatan utama.

### Verifikasi cepat

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Untuk host jarak jauh, ganti `127.0.0.1` dengan host `baseUrl`. Jika `curl`
berfungsi tetapi OpenClaw tidak, periksa apakah Gateway berjalan pada
mesin, kontainer, atau akun layanan yang berbeda.

## Pencarian Web Ollama

OpenClaw menyertakan **Pencarian Web Ollama** sebagai penyedia `web_search`.

| Properti     | Detail                                                                                                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host         | `models.providers.ollama.baseUrl` jika ditetapkan, jika tidak `http://127.0.0.1:11434`; `https://ollama.com` menggunakan API yang dihosting secara langsung                                               |
| Autentikasi  | Tanpa kunci untuk host lokal yang telah masuk; `OLLAMA_API_KEY` atau autentikasi penyedia yang dikonfigurasi untuk pencarian langsung melalui `https://ollama.com` atau host yang dilindungi autentikasi   |
| Persyaratan  | Host lokal/yang dihosting sendiri harus berjalan dan telah masuk dengan `ollama signin`; pencarian yang dihosting secara langsung memerlukan `baseUrl: "https://ollama.com"` beserta kunci API yang valid |

Pilih saat menjalankan `openclaw onboard` atau `openclaw configure --section web`, atau tetapkan:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Untuk pencarian yang dihosting secara langsung melalui Ollama Cloud:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

Untuk host yang dihosting sendiri, OpenClaw terlebih dahulu mencoba proksi lokal
`/api/experimental/web_search`, lalu kembali menggunakan jalur `/api/web_search`
yang dihosting pada host yang sama; daemon lokal yang telah masuk biasanya merespons
melalui proksi lokal. Panggilan langsung ke `https://ollama.com` selalu menggunakan
endpoint `/api/web_search` yang dihosting.

<Note>
Untuk penyiapan dan perilaku lengkap, lihat [Pencarian Web Ollama](/id/tools/ollama-search).
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Mode kompatibel OpenAI lama">
    <Warning>
    **Pemanggilan alat tidak dapat diandalkan dalam mode ini.** Gunakan hanya jika proksi memerlukan format OpenAI dan Anda tidak bergantung pada pemanggilan alat native.
    </Warning>

    Tetapkan `api: "openai-completions"` secara eksplisit untuk proksi di belakang
    `/v1/chat/completions`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Mode ini mungkin tidak mendukung pengaliran dan pemanggilan alat secara bersamaan; Anda
    mungkin perlu menetapkan `params: { streaming: false }` pada model.

    OpenClaw menyisipkan `options.num_ctx` secara default dalam mode ini agar Ollama
    tidak secara diam-diam kembali menggunakan konteks 4096 token. Jika proksi Anda menolak
    bidang `options` yang tidak dikenal, nonaktifkan:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Jendela konteks">
    Untuk model yang ditemukan secara otomatis, OpenClaw menggunakan jendela konteks yang dilaporkan
    oleh `/api/show`, termasuk nilai `PARAMETER num_ctx` yang lebih besar dari
    Modelfile khusus; jika tidak, OpenClaw kembali menggunakan jendela konteks
    Ollama default miliknya.

    `contextWindow`, `contextTokens`, dan `maxTokens` tingkat penyedia menetapkan
    nilai default untuk setiap model di bawah penyedia tersebut dan dapat ditimpa per
    model. `contextWindow` adalah anggaran prompt/Compaction milik OpenClaw. Permintaan
    `/api/chat` native membiarkan `options.num_ctx` tidak ditetapkan kecuali Anda menetapkan
    `params.num_ctx` secara eksplisit, sehingga Ollama menerapkan nilai default modelnya sendiri,
    `OLLAMA_CONTEXT_LENGTH`, atau nilai berbasis VRAM; nilai `params.num_ctx` yang tidak valid,
    nol, negatif, atau bukan bilangan terbatas akan diabaikan. Jika konfigurasi lama hanya
    menggunakan `contextWindow`/`maxTokens` untuk memaksakan konteks permintaan native, jalankan
    `openclaw doctor --fix` untuk menyalinnya ke `params.num_ctx`. Adaptor yang
    kompatibel dengan OpenAI tetap menyisipkan `options.num_ctx` secara default dari
    `params.num_ctx` atau `contextWindow` yang dikonfigurasi; nonaktifkan dengan
    `injectNumCtxForOpenAICompat: false` jika layanan hulu menolak `options`.

    Entri model native juga menerima opsi runtime Ollama umum di bawah
    `params`, yang diteruskan sebagai `options` native `/api/chat`: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap`, dan `num_thread`.
    Beberapa kunci (`format`, `keep_alive`, `truncate`, `shift`) diteruskan sebagai
    bidang permintaan tingkat teratas, bukan `options` bertingkat. OpenClaw hanya
    meneruskan kunci permintaan Ollama ini, sehingga parameter khusus runtime seperti
    `streaming` tidak pernah dikirim ke Ollama. Gunakan `params.think` (atau
    `params.thinking`) untuk menetapkan `think` tingkat teratas; `false` menonaktifkan
    pemikiran tingkat API untuk model berpikir bergaya Qwen.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    `agents.defaults.models["ollama/<model>"].params.num_ctx` per model juga
    berfungsi; entri model penyedia eksplisit diutamakan jika keduanya ditetapkan.

  </Accordion>

  <Accordion title="Kontrol pemikiran">
    OpenClaw meneruskan pemikiran sesuai yang diharapkan Ollama: `think` tingkat teratas,
    bukan `options.think`. Model yang ditemukan secara otomatis dan kemampuan `thinking`-nya
    dilaporkan oleh `/api/show` menyediakan `/think low`, `/think medium`, `/think high`,
    dan `/think max`; model tanpa kemampuan berpikir hanya menyediakan `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Atau tetapkan nilai default model:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    `params.think`/`params.thinking` per model dapat menonaktifkan atau memaksakan
    proses berpikir API untuk model tertentu. OpenClaw mempertahankan konfigurasi eksplisit tersebut
    ketika proses aktif hanya memiliki nilai bawaan implisit `off`; perintah runtime selain off
    seperti `/think medium` tetap menggantikannya. Permintaan proses berpikir yang bernilai benar
    tidak pernah dikirim ke model yang secara eksplisit ditandai
    `reasoning: false`; permintaan `think: false` selalu dikirim dalam kondisi apa pun.

  </Accordion>

  <Accordion title="Model penalaran">
    Model bernama `deepseek-r1`, `reasoning`, `reason`, atau `think` secara bawaan
    dianggap mampu melakukan penalaran — tidak memerlukan konfigurasi tambahan:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Biaya model">
    Ollama berjalan secara lokal dan gratis, sehingga semua biaya model adalah `0`, baik untuk
    model yang ditemukan secara otomatis maupun yang ditentukan secara manual.
  </Accordion>

  <Accordion title="Embedding memori">
    Plugin Ollama bawaan mendaftarkan penyedia embedding memori untuk
    [pencarian memori](/id/concepts/memory). Penyedia ini menggunakan URL dasar Ollama
    dan kunci API yang dikonfigurasi, memanggil `/api/embed`, serta mengelompokkan beberapa potongan memori ke dalam
    satu permintaan `input` jika memungkinkan.

    Saat `proxy.enabled=true`, permintaan embedding ke origin local loopback host yang sama persis
    dan diturunkan dari `baseUrl` yang dikonfigurasi menggunakan jalur langsung
    terlindungi milik OpenClaw, bukan proksi penerusan terkelola. Nama host yang dikonfigurasi
    harus berupa `localhost` atau literal IP loopback — nama DNS
    yang sekadar di-resolve ke loopback tetap menggunakan jalur proksi terkelola. Host Ollama di LAN,
    tailnet, jaringan privat, dan publik selalu tetap menggunakan
    jalur proksi terkelola, dan pengalihan ke host/port lain tidak mewarisi
    kepercayaan. `proxy.loopbackMode: "proxy"` tetap merutekan lalu lintas loopback melalui
    proksi; `proxy.loopbackMode: "block"` menolaknya sebelum tersambung —
    lihat [Proksi terkelola](/id/security/network-proxy#gateway-loopback-mode).

    | Properti | Nilai |
    | --- | --- |
    | Model bawaan | `nomic-embed-text` |
    | Penarikan otomatis | Ya, jika belum tersedia secara lokal |
    | Konkurensi inline bawaan | 1 (penyedia lain memiliki nilai bawaan yang lebih tinggi; tingkatkan dengan `nonBatchConcurrency` jika host mampu menanganinya) |

    Embedding saat kueri menggunakan prefiks pengambilan untuk model yang mewajibkan atau
    merekomendasikannya: `nomic-embed-text`, `qwen3-embedding`, dan
    `mxbai-embed-large`. Batch dokumen tetap mentah, sehingga indeks yang sudah ada
    tidak memerlukan migrasi format.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Untuk host embedding jarak jauh, batasi cakupan autentikasi hanya pada host tersebut:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Konfigurasi streaming">
    Ollama menggunakan **API native** (`/api/chat`) secara bawaan, yang mendukung
    streaming dan pemanggilan alat secara bersamaan — tidak memerlukan konfigurasi khusus.

    Untuk permintaan native, kontrol proses berpikir diteruskan secara langsung: `/think off`
    dan `openclaw agent --thinking off` mengirim `think: false` pada tingkat teratas, kecuali
    `params.think`/`params.thinking` eksplisit telah dikonfigurasi; `/think
    low|medium|high` mengirim string tingkat upaya yang sesuai; `/think max` dipetakan ke
    tingkat upaya tertinggi Ollama, yaitu `think: "high"`.

    <Tip>
    Untuk menggunakan endpoint kompatibel OpenAI, lihat "Mode kompatibel OpenAI lama" di atas — streaming dan pemanggilan alat mungkin tidak dapat bekerja bersamaan di sana.
    </Tip>

  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Siklus crash WSL2 (boot ulang berulang)">
    Pada WSL2 dengan NVIDIA/CUDA, penginstal Linux resmi Ollama membuat
    unit systemd `ollama.service` dengan `Restart=always`. Jika layanan tersebut
    dimulai otomatis dan memuat model berbasis GPU selama proses boot WSL2, Ollama dapat mengunci
    memori host selama pemuatan; pengambilan kembali memori Hyper-V tidak selalu dapat mengambil kembali
    halaman-halaman tersebut, sehingga Windows dapat menghentikan VM WSL2, systemd memulai ulang
    Ollama, dan siklus tersebut berulang.

    Indikasi: boot ulang/penghentian WSL2 berulang, penggunaan CPU tinggi di `app.slice` atau
    `ollama.service` tepat setelah WSL2 dimulai, serta SIGTERM dari systemd, bukan
    dari penghenti OOM Linux.

    OpenClaw mencatat peringatan saat mulai ketika mendeteksi WSL2, `ollama.service`
    diaktifkan dengan `Restart=always`, dan penanda CUDA terlihat.

    Mitigasi:

    ```bash
    sudo systemctl disable ollama
    ```

    Di sisi Windows, tambahkan konfigurasi berikut ke `%USERPROFILE%\.wslconfig`, lalu jalankan
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Atau persingkat keep-alive / mulai Ollama secara manual hanya saat diperlukan:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Lihat [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama tidak terdeteksi">
    Pastikan Ollama sedang berjalan, `OLLAMA_API_KEY` (atau profil autentikasi) telah diatur,
    dan `models.providers.ollama` **tidak** ditentukan secara eksplisit:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Tidak ada model yang tersedia">
    Tarik model secara lokal atau tentukan secara eksplisit di
    `models.providers.ollama`:

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Koneksi ditolak">
    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Host jarak jauh berfungsi dengan curl tetapi tidak dengan OpenClaw">
    Verifikasi dari mesin dan runtime yang sama dengan yang menjalankan Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Penyebab umum:

    - `baseUrl` mengarah ke `localhost`, tetapi Gateway berjalan di Docker atau host lain.
    - URL menggunakan `/v1`, sehingga memilih perilaku kompatibel OpenAI, bukan Ollama native.
    - Host jarak jauh memerlukan perubahan firewall atau pengikatan LAN.
    - Model berada di daemon laptop Anda, tetapi tidak di daemon jarak jauh.

  </Accordion>

  <Accordion title="Model menghasilkan JSON alat sebagai teks">
    Biasanya penyedia berada dalam mode kompatibel OpenAI, atau model tidak dapat
    menangani skema alat. Utamakan mode native:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    Jika model lokal kecil masih gagal menangani skema alat, atur
    `compat.supportsTools: false` pada entri model tersebut dan uji kembali.

  </Accordion>

  <Accordion title="Kimi atau GLM menghasilkan simbol yang kacau">
    Respons Kimi/GLM yang dihosting dan berupa rangkaian simbol panjang nonlinguistik
    diperlakukan sebagai panggilan penyedia yang gagal, bukan balasan yang berhasil, sehingga
    penanganan percobaan ulang/fallback/kesalahan normal mengambil alih, alih-alih menyimpan
    teks rusak ke dalam sesi.

    Jika masalah terulang, catat nama model, berkas sesi saat ini, dan
    apakah proses menggunakan `Cloud + Local` atau `Cloud only`, lalu coba sesi baru
    dan model fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Model lokal yang belum dimuat mengalami batas waktu">
    Model lokal berukuran besar dapat memerlukan waktu lama untuk pemuatan pertama. Batasi cakupan batas waktu ke
    penyedia Ollama dan, secara opsional, pertahankan model tetap dimuat di antara giliran:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    Jika host itu sendiri lambat menerima koneksi, `timeoutSeconds` juga
    memperpanjang batas waktu koneksi terlindungi untuk penyedia ini.

  </Accordion>

  <Accordion title="Model berkonteks besar terlalu lambat atau kehabisan memori">
    Banyak model menawarkan konteks yang lebih besar daripada yang dapat dijalankan perangkat keras Anda
    dengan nyaman. Ollama native menggunakan nilai bawaan runtime-nya sendiri, kecuali
    `params.num_ctx` diatur. Batasi anggaran OpenClaw dan konteks permintaan Ollama
    agar latensi token pertama dapat diprediksi:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    Turunkan `contextWindow` jika OpenClaw mengirim terlalu banyak prompt. Turunkan
    `params.num_ctx` jika konteks runtime Ollama terlalu besar untuk mesin.
    Turunkan `maxTokens` jika pembuatan keluaran berlangsung terlalu lama.

  </Accordion>
</AccordionGroup>

<Note>
Bantuan lainnya: [Pemecahan masalah](/id/help/troubleshooting) dan [Pertanyaan umum](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/id/providers/ollama-cloud" icon="cloud">
    Penyiapan khusus cloud dengan penyedia khusus `ollama-cloud`.
  </Card>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Ikhtisar semua penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/models" icon="brain">
    Cara memilih dan mengonfigurasi model.
  </Card>
  <Card title="Pencarian Web Ollama" href="/id/tools/ollama-search" icon="magnifying-glass">
    Detail lengkap penyiapan dan perilaku pencarian web yang didukung Ollama.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap.
  </Card>
</CardGroup>
