---
read_when:
    - Anda ingin menjalankan OpenClaw dengan model cloud atau lokal melalui Ollama
    - Anda memerlukan panduan penyiapan dan konfigurasi Ollama
    - Anda menginginkan model vision Ollama untuk pemahaman gambar
summary: Jalankan OpenClaw dengan Ollama (model cloud dan lokal)
title: Ollama
x-i18n:
    generated_at: "2026-07-01T08:33:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e047ee6c0531d1d0231d5ccad00f9af0889039d527cd1247c9b802bc406eadf
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw terintegrasi dengan API native Ollama (`/api/chat`) untuk model cloud terhosting dan server Ollama lokal/self-hosted. Anda dapat menggunakan Ollama dalam tiga mode: `Cloud + Local` melalui host Ollama yang dapat dijangkau, `Cloud only` terhadap `https://ollama.com`, atau `Local only` terhadap host Ollama yang dapat dijangkau.

OpenClaw juga mendaftarkan `ollama-cloud` sebagai id penyedia terhosting kelas utama untuk penggunaan langsung Ollama Cloud. Gunakan ref seperti `ollama-cloud/kimi-k2.5:cloud` ketika Anda menginginkan perutean khusus cloud tanpa berbagi id penyedia `ollama` lokal.

Untuk halaman penyiapan khusus cloud-only, lihat [Ollama Cloud](/id/providers/ollama-cloud).

<Warning>
**Pengguna Ollama jarak jauh**: Jangan gunakan URL kompatibel OpenAI `/v1` (`http://host:11434/v1`) dengan OpenClaw. Ini merusak pemanggilan tool dan model dapat menghasilkan JSON tool mentah sebagai teks biasa. Gunakan URL API native Ollama sebagai gantinya: `baseUrl: "http://host:11434"` (tanpa `/v1`).
</Warning>

Konfigurasi penyedia Ollama menggunakan `baseUrl` sebagai kunci kanonis. OpenClaw juga menerima `baseURL` untuk kompatibilitas dengan contoh bergaya OpenAI SDK, tetapi konfigurasi baru sebaiknya mengutamakan `baseUrl`.

## Aturan autentikasi

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    Host Ollama lokal dan LAN tidak memerlukan token bearer asli. OpenClaw menggunakan penanda lokal `ollama-local` hanya untuk URL dasar Ollama loopback, jaringan privat, `.local`, dan hostname polos.
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    Host publik jarak jauh dan Ollama Cloud (`https://ollama.com`) memerlukan kredensial asli melalui `OLLAMA_API_KEY`, profil autentikasi, atau `apiKey` milik penyedia. Untuk penggunaan terhosting langsung, utamakan penyedia `ollama-cloud`.
  </Accordion>
  <Accordion title="Custom provider ids">
    Id penyedia kustom yang menetapkan `api: "ollama"` mengikuti aturan yang sama. Misalnya, penyedia `ollama-remote` yang mengarah ke host Ollama LAN privat dapat menggunakan `apiKey: "ollama-local"` dan sub-agent akan menyelesaikan penanda tersebut melalui hook penyedia Ollama alih-alih memperlakukannya sebagai kredensial yang hilang. Pencarian memori juga dapat menetapkan `agents.defaults.memorySearch.provider` ke id penyedia kustom tersebut agar embedding menggunakan endpoint Ollama yang cocok.
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` menyimpan kredensial untuk id penyedia. Letakkan pengaturan endpoint (`baseUrl`, `api`, id model, header, timeout) di `models.providers.<id>`. File profil autentikasi flat lama seperti `{ "ollama-windows": { "apiKey": "ollama-local" } }` bukan format runtime; jalankan `openclaw doctor --fix` untuk menulis ulang ke profil kunci API kanonis `ollama-windows:default` dengan cadangan. `baseUrl` di file tersebut adalah gangguan kompatibilitas dan sebaiknya dipindahkan ke konfigurasi penyedia.
  </Accordion>
  <Accordion title="Memory embedding scope">
    Ketika Ollama digunakan untuk embedding memori, autentikasi bearer dibatasi ke host tempat ia dideklarasikan:

    - Kunci tingkat penyedia hanya dikirim ke host Ollama penyedia tersebut.
    - `agents.*.memorySearch.remote.apiKey` hanya dikirim ke host embedding jarak jauhnya.
    - Nilai env `OLLAMA_API_KEY` murni diperlakukan sebagai konvensi Ollama Cloud, tidak dikirim ke host lokal atau self-hosted secara default.

  </Accordion>
</AccordionGroup>

## Memulai

Pilih metode dan mode penyiapan yang Anda inginkan.

<Tabs>
  <Tab title="Onboarding (recommended)">
    **Terbaik untuk:** jalur tercepat menuju penyiapan Ollama cloud atau lokal yang berfungsi.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        Pilih **Ollama** dari daftar penyedia.
      </Step>
      <Step title="Choose your mode">
        - **Cloud + Local** — host Ollama lokal plus model cloud yang dirutekan melalui host tersebut
        - **Cloud only** — model Ollama terhosting melalui `https://ollama.com`
        - **Local only** — hanya model lokal

      </Step>
      <Step title="Select a model">
        `Cloud only` meminta `OLLAMA_API_KEY` dan menyarankan default cloud terhosting. `Cloud + Local` dan `Local only` meminta URL dasar Ollama, menemukan model yang tersedia, dan otomatis menarik model lokal yang dipilih jika belum tersedia. Ketika Ollama melaporkan tag `:latest` yang terinstal seperti `gemma4:latest`, penyiapan menampilkan model terinstal tersebut satu kali alih-alih menampilkan `gemma4` dan `gemma4:latest` atau menarik alias polosnya lagi. `Cloud + Local` juga memeriksa apakah host Ollama tersebut sudah masuk untuk akses cloud.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Mode non-interaktif

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    Secara opsional tentukan URL dasar atau model kustom:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manual setup">
    **Terbaik untuk:** kendali penuh atas penyiapan cloud atau lokal.

    <Steps>
      <Step title="Choose cloud or local">
        - **Cloud + Local**: instal Ollama, masuk dengan `ollama signin`, dan rutekan permintaan cloud melalui host tersebut
        - **Cloud only**: gunakan `https://ollama.com` dengan `OLLAMA_API_KEY`
        - **Local only**: instal Ollama dari [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Pull a local model (local only)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Enable Ollama for OpenClaw">
        Untuk `Cloud only`, gunakan `OLLAMA_API_KEY` asli Anda. Untuk penyiapan berbasis host, nilai placeholder apa pun bisa digunakan:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspect and set your model">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Atau tetapkan default di konfigurasi:

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

## Model cloud

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` menggunakan host Ollama yang dapat dijangkau sebagai titik kendali untuk model lokal dan cloud. Ini adalah alur hibrida yang diutamakan Ollama.

    Gunakan **Cloud + Local** selama penyiapan. OpenClaw meminta URL dasar Ollama, menemukan model lokal dari host tersebut, dan memeriksa apakah host sudah masuk untuk akses cloud dengan `ollama signin`. Ketika host sudah masuk, OpenClaw juga menyarankan default cloud terhosting seperti `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, dan `glm-5.1:cloud`.

    Jika host belum masuk, OpenClaw menjaga penyiapan tetap local-only sampai Anda menjalankan `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` berjalan terhadap API terhosting Ollama di `https://ollama.com`.

    Gunakan **Cloud only** selama penyiapan. OpenClaw meminta `OLLAMA_API_KEY`, menetapkan `baseUrl: "https://ollama.com"`, dan mengisi awal daftar model cloud terhosting. Jalur ini **tidak** memerlukan server Ollama lokal atau `ollama signin`.

    Daftar model cloud yang ditampilkan selama `openclaw onboard` diisi langsung dari `https://ollama.com/api/tags`, dibatasi hingga 500 entri, sehingga pemilih mencerminkan katalog terhosting saat ini, bukan seed statis. Jika `ollama.com` tidak dapat dijangkau atau tidak mengembalikan model saat penyiapan, OpenClaw kembali ke saran hardcoded sebelumnya agar onboarding tetap selesai.

    Anda juga dapat mengonfigurasi penyedia cloud kelas utama secara langsung:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    Dalam mode local-only, OpenClaw menemukan model dari instance Ollama yang dikonfigurasi. Jalur ini untuk server Ollama lokal atau self-hosted.

    OpenClaw saat ini menyarankan `gemma4` sebagai default lokal.

  </Tab>
</Tabs>

## Penemuan model (penyedia implisit)

Ketika Anda menetapkan `OLLAMA_API_KEY` (atau profil autentikasi) dan **tidak** mendefinisikan `models.providers.ollama` atau penyedia jarak jauh kustom lain dengan `api: "ollama"`, OpenClaw menemukan model dari instance Ollama lokal di `http://127.0.0.1:11434`.

| Perilaku             | Detail                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kueri katalog        | Mengueri `/api/tags`                                                                                                                                                 |
| Deteksi kapabilitas | Menggunakan lookup `/api/show` best-effort untuk membaca `contextWindow`, parameter Modelfile `num_ctx` yang diperluas, dan kapabilitas termasuk vision/tools        |
| Model vision         | Model dengan kapabilitas `vision` yang dilaporkan oleh `/api/show` ditandai sebagai berkemampuan gambar (`input: ["text", "image"]`), sehingga OpenClaw otomatis menyuntikkan gambar ke prompt |
| Deteksi reasoning    | Menggunakan kapabilitas `/api/show` ketika tersedia, termasuk `thinking`; kembali ke heuristik nama model (`r1`, `reasoning`, `think`) ketika Ollama menghilangkan kapabilitas |
| Batas token          | Menetapkan `maxTokens` ke batas token maksimum default Ollama yang digunakan oleh OpenClaw                                                                            |
| Biaya                | Menetapkan semua biaya ke `0`                                                                                                                                         |

Ini menghindari entri model manual sambil menjaga katalog tetap selaras dengan instance Ollama lokal. Anda dapat menggunakan ref penuh seperti `ollama/<pulled-model>:latest` dalam `infer model run` lokal; OpenClaw menyelesaikan model terinstal tersebut dari katalog live Ollama tanpa memerlukan entri `models.json` yang ditulis tangan.

Untuk host Ollama yang sudah masuk, beberapa model `:cloud` mungkin dapat digunakan melalui `/api/chat` dan `/api/show` sebelum muncul di `/api/tags`. Ketika Anda secara eksplisit memilih ref penuh `ollama/<model>:cloud`, OpenClaw memvalidasi model hilang persis tersebut dengan `/api/show` dan menambahkannya ke katalog runtime hanya jika Ollama mengonfirmasi metadata model. Salah ketik tetap gagal sebagai model yang tidak dikenal alih-alih dibuat otomatis.

```bash
# See what models are available
ollama list
openclaw models list
```

Untuk smoke test pembuatan teks yang sempit dan menghindari seluruh permukaan tool agent, gunakan `infer model run` lokal dengan ref model Ollama penuh:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Jalur tersebut masih menggunakan penyedia, autentikasi, dan transport native Ollama yang dikonfigurasi OpenClaw, tetapi tidak memulai giliran chat-agent atau memuat konteks MCP/tool. Jika ini berhasil sementara balasan agent normal gagal, selidiki kapasitas prompt/tool agent milik model berikutnya.

Untuk smoke test model vision yang sempit pada jalur ramping yang sama, tambahkan satu atau beberapa file gambar ke `infer model run`. Ini mengirim prompt dan gambar langsung ke model vision Ollama yang dipilih tanpa memuat tool chat, memori, atau konteks sesi sebelumnya:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` menerima berkas yang terdeteksi sebagai `image/*`, termasuk input PNG,
JPEG, dan WebP umum. Berkas non-gambar ditolak sebelum Ollama dipanggil.
Untuk pengenalan ucapan, gunakan `openclaw infer audio transcribe` sebagai gantinya.

Saat Anda mengalihkan percakapan dengan `/model ollama/<model>`, OpenClaw memperlakukan
itu sebagai pilihan pengguna yang tepat. Jika `baseUrl` Ollama yang dikonfigurasi
tidak dapat dijangkau, balasan berikutnya gagal dengan galat penyedia, bukan diam-diam
menjawab dari model fallback lain yang dikonfigurasi.

Cron job terisolasi melakukan satu pemeriksaan keamanan lokal tambahan sebelum memulai giliran agen.
Jika model yang dipilih diselesaikan ke penyedia Ollama lokal, jaringan privat, atau `.local`
dan `/api/tags` tidak dapat dijangkau, OpenClaw mencatat eksekusi cron itu
sebagai `skipped` dengan `ollama/<model>` yang dipilih dalam teks galat. Preflight endpoint
di-cache selama 5 menit, sehingga beberapa cron job yang diarahkan ke daemon Ollama
yang sama yang berhenti tidak semuanya meluncurkan permintaan model yang gagal.

Verifikasi langsung jalur teks lokal, jalur stream native, dan embeddings terhadap
Ollama lokal dengan:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Untuk smoke test kunci API Ollama Cloud, arahkan live test ke `https://ollama.com`
dan pilih model hosted dari katalog saat ini:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Smoke test cloud menjalankan teks, stream native, dan pencarian web. Secara default,
pengujian ini melewati embeddings untuk `https://ollama.com` karena kunci API Ollama Cloud
mungkin tidak mengizinkan `/api/embed`. Setel `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`
saat Anda secara eksplisit ingin live test gagal jika kunci cloud yang dikonfigurasi
tidak dapat menggunakan endpoint embed.

Untuk menambahkan model baru, cukup pull model tersebut dengan Ollama:

```bash
ollama pull mistral
```

Model baru akan ditemukan secara otomatis dan tersedia untuk digunakan.

<Note>
Jika Anda menyetel `models.providers.ollama` secara eksplisit, atau mengonfigurasi penyedia remote kustom seperti `models.providers.ollama-cloud` dengan `api: "ollama"`, penemuan otomatis dilewati dan Anda harus mendefinisikan model secara manual. Penyedia kustom loopback seperti `http://127.0.0.2:11434` tetap diperlakukan sebagai lokal. Lihat bagian konfigurasi eksplisit di bawah.
</Note>

## Vision dan deskripsi gambar

Plugin Ollama bawaan mendaftarkan Ollama sebagai penyedia pemahaman media berkemampuan gambar. Ini memungkinkan OpenClaw merutekan permintaan deskripsi gambar eksplisit dan default model gambar yang dikonfigurasi melalui model vision Ollama lokal atau hosted.

Untuk vision lokal, pull model yang mendukung gambar:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Lalu verifikasi dengan infer CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` harus berupa referensi `<provider/model>` penuh. Saat disetel, `openclaw infer image describe` mencoba model itu terlebih dahulu alih-alih melewati deskripsi karena model mendukung vision native. Jika panggilan model gagal, OpenClaw dapat melanjutkan melalui `agents.defaults.imageModel.fallbacks` yang dikonfigurasi; galat persiapan berkas atau URL tetap gagal sebelum upaya fallback.

Gunakan `infer image describe` saat Anda menginginkan alur penyedia pemahaman gambar OpenClaw, `agents.defaults.imageModel` yang dikonfigurasi, dan bentuk output deskripsi gambar. Gunakan `infer model run --file` saat Anda menginginkan probe model multimodal mentah dengan prompt kustom dan satu atau beberapa gambar.

Untuk menjadikan Ollama sebagai model pemahaman gambar default untuk media masuk, konfigurasikan `agents.defaults.imageModel`:

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

Utamakan referensi penuh `ollama/<model>`. Jika model yang sama tercantum di bawah `models.providers.ollama.models` dengan `input: ["text", "image"]` dan tidak ada penyedia gambar terkonfigurasi lain yang mengekspos ID model polos tersebut, OpenClaw juga menormalkan referensi `imageModel` polos seperti `qwen2.5vl:7b` menjadi `ollama/qwen2.5vl:7b`. Jika lebih dari satu penyedia gambar terkonfigurasi memiliki ID polos yang sama, gunakan prefiks penyedia secara eksplisit.

Model vision lokal yang lambat dapat memerlukan timeout pemahaman gambar yang lebih lama daripada model cloud. Model tersebut juga dapat crash atau berhenti saat Ollama mencoba mengalokasikan seluruh konteks vision yang diiklankan pada perangkat keras terbatas. Setel timeout kapabilitas, dan batasi `num_ctx` pada entri model saat Anda hanya memerlukan giliran deskripsi gambar normal:

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

Timeout ini berlaku untuk pemahaman gambar masuk dan untuk tool `image` eksplisit yang dapat dipanggil agen selama satu giliran. `models.providers.ollama.timeoutSeconds` tingkat penyedia tetap mengontrol penjaga permintaan HTTP Ollama yang mendasari untuk panggilan model normal.

Verifikasi langsung tool gambar eksplisit terhadap Ollama lokal dengan:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Jika Anda mendefinisikan `models.providers.ollama.models` secara manual, tandai model vision dengan dukungan input gambar:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw menolak permintaan deskripsi gambar untuk model yang tidak ditandai berkemampuan gambar. Dengan penemuan implisit, OpenClaw membaca ini dari Ollama saat `/api/show` melaporkan kapabilitas vision.

## Konfigurasi

<Tabs>
  <Tab title="Basic (implicit discovery)">
    Jalur pengaktifan lokal saja yang paling sederhana adalah melalui variabel lingkungan:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Jika `OLLAMA_API_KEY` disetel, Anda dapat menghilangkan `apiKey` di entri penyedia dan OpenClaw akan mengisinya untuk pemeriksaan ketersediaan.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Gunakan konfigurasi eksplisit saat Anda menginginkan setup cloud hosted, Ollama berjalan pada host/port lain, Anda ingin memaksa context window atau daftar model tertentu, atau Anda ingin definisi model sepenuhnya manual.

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

  <Tab title="Custom base URL">
    Jika Ollama berjalan pada host atau port berbeda (konfigurasi eksplisit menonaktifkan penemuan otomatis, jadi definisikan model secara manual):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Jangan tambahkan `/v1` ke URL. Jalur `/v1` menggunakan mode kompatibel OpenAI, tempat pemanggilan tool tidak andal. Gunakan URL dasar Ollama tanpa sufiks jalur.
    </Warning>

  </Tab>
</Tabs>

## Resep umum

Gunakan ini sebagai titik awal dan ganti ID model dengan nama persis dari `ollama list` atau `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    Gunakan ini saat Ollama berjalan pada mesin yang sama dengan Gateway dan Anda ingin OpenClaw menemukan model yang terinstal secara otomatis.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Jalur ini menjaga konfigurasi tetap minimal. Jangan tambahkan blok `models.providers.ollama` kecuali Anda ingin mendefinisikan model secara manual.

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
    Gunakan URL Ollama native untuk host LAN. Jangan tambahkan `/v1`.

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

    `contextWindow` adalah anggaran konteks sisi OpenClaw. `params.num_ctx` dikirim ke Ollama untuk permintaan. Jaga keduanya tetap selaras saat perangkat keras Anda tidak dapat menjalankan konteks penuh yang diiklankan model.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    Gunakan ini saat Anda tidak menjalankan daemon lokal dan menginginkan model Ollama hosted secara langsung.

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

  </Accordion>

  <Accordion title="Cloud plus local through a signed-in daemon">
    Gunakan ini saat daemon Ollama lokal atau LAN sudah masuk dengan `ollama signin` dan harus melayani model lokal maupun model `:cloud`.

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
    Gunakan ID provider khusus saat Anda memiliki lebih dari satu server Ollama. Setiap provider mendapatkan host, model, autentikasi, timeout, dan referensi modelnya sendiri.

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

    Saat OpenClaw mengirim permintaan, awalan provider aktif dihapus sehingga `ollama-large/qwen3.5:27b` sampai ke Ollama sebagai `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Profil model lokal ramping">
    Beberapa model lokal dapat menjawab prompt sederhana tetapi kesulitan dengan seluruh permukaan alat agen. Mulailah dengan membatasi alat dan konteks sebelum mengubah pengaturan runtime global.

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

    Gunakan `compat.supportsTools: false` hanya saat model atau server secara konsisten gagal pada skema alat. Ini menukar kapabilitas agen dengan stabilitas.
    `localModelLean` menghapus alat browser, cron, dan pesan dari permukaan agen langsung serta secara default menempatkan katalog yang lebih besar di balik kontrol Pencarian Alat terstruktur kecuali saat sebuah run harus mempertahankan semantik pengiriman pesan langsung, tetapi ini tidak mengubah konteks runtime atau mode berpikir Ollama. Pasangkan dengan `params.num_ctx` eksplisit dan `params.thinking: false` untuk model berpikir kecil bergaya Qwen yang berulang atau menghabiskan anggaran responsnya untuk penalaran tersembunyi.

  </Accordion>
</AccordionGroup>

### Pemilihan model

Setelah dikonfigurasi, semua model Ollama Anda tersedia:

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

ID provider Ollama khusus juga didukung. Saat referensi model menggunakan awalan
provider aktif, seperti `ollama-spark/qwen3:32b`, OpenClaw hanya menghapus
awalan tersebut sebelum memanggil Ollama sehingga server menerima `qwen3:32b`.

Untuk model lokal yang lambat, lebih baik gunakan penyetelan permintaan per provider sebelum menaikkan
timeout seluruh runtime agen:

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

`timeoutSeconds` berlaku untuk permintaan HTTP model, termasuk penyiapan koneksi,
header, streaming body, dan total abort guarded-fetch. `params.keep_alive`
diteruskan ke Ollama sebagai `keep_alive` tingkat atas pada permintaan native `/api/chat`;
atur per model saat waktu muat giliran pertama menjadi hambatan.

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

Untuk host jarak jauh, ganti `127.0.0.1` dengan host yang digunakan di `baseUrl`. Jika `curl` berfungsi tetapi OpenClaw tidak, periksa apakah Gateway berjalan di mesin, container, atau akun layanan yang berbeda.

## Ollama Web Search

OpenClaw mendukung **Ollama Web Search** sebagai provider `web_search` bawaan.

| Properti    | Detail                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | Menggunakan host Ollama yang Anda konfigurasi (`models.providers.ollama.baseUrl` jika diatur, jika tidak `http://127.0.0.1:11434`); `https://ollama.com` menggunakan API hosted secara langsung |
| Autentikasi | Tanpa kunci untuk host Ollama lokal yang sudah masuk; `OLLAMA_API_KEY` atau autentikasi provider yang dikonfigurasi untuk pencarian langsung `https://ollama.com` atau host yang dilindungi autentikasi               |
| Persyaratan | Host lokal/self-hosted harus berjalan dan sudah masuk dengan `ollama signin`; pencarian hosted langsung memerlukan `baseUrl: "https://ollama.com"` plus kunci API Ollama nyata |

Pilih **Ollama Web Search** saat `openclaw onboard` atau `openclaw configure --section web`, atau atur:

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

Untuk pencarian hosted langsung melalui Ollama Cloud:

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

Untuk daemon lokal yang sudah masuk, OpenClaw menggunakan proxy `/api/experimental/web_search` milik daemon. Untuk `https://ollama.com`, OpenClaw memanggil endpoint hosted `/api/web_search` secara langsung.

<Note>
Untuk detail penyiapan dan perilaku lengkap, lihat [Ollama Web Search](/id/tools/ollama-search).
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Mode kompatibel OpenAI lama">
    <Warning>
    **Pemanggilan alat tidak andal dalam mode kompatibel OpenAI.** Gunakan mode ini hanya jika Anda memerlukan format OpenAI untuk proxy dan tidak bergantung pada perilaku pemanggilan alat native.
    </Warning>

    Jika Anda perlu menggunakan endpoint kompatibel OpenAI sebagai gantinya (misalnya, di balik proxy yang hanya mendukung format OpenAI), atur `api: "openai-completions"` secara eksplisit:

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

    Mode ini mungkin tidak mendukung streaming dan pemanggilan alat secara bersamaan. Anda mungkin perlu menonaktifkan streaming dengan `params: { streaming: false }` dalam konfigurasi model.

    Saat `api: "openai-completions"` digunakan dengan Ollama, OpenClaw menyuntikkan `options.num_ctx` secara default agar Ollama tidak diam-diam kembali ke jendela konteks 4096. Jika proxy/upstream Anda menolak kolom `options` yang tidak dikenal, nonaktifkan perilaku ini:

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
    Untuk model yang ditemukan otomatis, OpenClaw menggunakan jendela konteks yang dilaporkan oleh Ollama jika tersedia, termasuk nilai `PARAMETER num_ctx` yang lebih besar dari Modelfile khusus. Jika tidak, OpenClaw kembali ke jendela konteks default Ollama yang digunakan oleh OpenClaw.

    Anda dapat mengatur default `contextWindow`, `contextTokens`, dan `maxTokens` tingkat provider untuk setiap model di bawah provider Ollama tersebut, lalu menimpanya per model bila diperlukan. `contextWindow` adalah anggaran prompt dan Compaction OpenClaw. Permintaan native Ollama membiarkan `options.num_ctx` tidak diatur kecuali Anda secara eksplisit mengonfigurasi `params.num_ctx`, sehingga Ollama dapat menerapkan default modelnya sendiri, `OLLAMA_CONTEXT_LENGTH`, atau default berbasis VRAM. Untuk membatasi atau memaksa konteks runtime per permintaan Ollama tanpa membangun ulang Modelfile, atur `params.num_ctx`; nilai tidak valid, nol, negatif, dan tidak hingga diabaikan. Jika Anda meningkatkan konfigurasi lama yang hanya menggunakan `contextWindow` atau `maxTokens` untuk memaksa konteks permintaan native Ollama, jalankan `openclaw doctor --fix` untuk menyalin anggaran provider atau model eksplisit tersebut ke `params.num_ctx`. Adapter Ollama kompatibel OpenAI tetap menyuntikkan `options.num_ctx` secara default dari `params.num_ctx` atau `contextWindow` yang dikonfigurasi; nonaktifkan dengan `injectNumCtxForOpenAICompat: false` jika upstream Anda menolak `options`.

    Entri model native Ollama juga menerima opsi runtime umum Ollama di bawah `params`, termasuk `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread`, dan `use_mmap`. OpenClaw hanya meneruskan kunci permintaan Ollama, sehingga parameter runtime OpenClaw seperti `streaming` tidak bocor ke Ollama. Gunakan `params.think` atau `params.thinking` untuk mengirim `think` tingkat atas Ollama; `false` menonaktifkan berpikir tingkat API untuk model berpikir bergaya Qwen.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` per model juga berfungsi. Jika keduanya dikonfigurasi, entri model provider eksplisit menang atas default agen.

  </Accordion>

  <Accordion title="Kontrol berpikir">
    Untuk model native Ollama, OpenClaw meneruskan kontrol berpikir sesuai ekspektasi Ollama: `think` tingkat atas, bukan `options.think`. Model yang ditemukan otomatis yang respons `/api/show`-nya mencakup kapabilitas `thinking` mengekspos `/think low`, `/think medium`, `/think high`, dan `/think max`; model non-berpikir hanya mengekspos `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Anda juga dapat mengatur default model:

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

    `params.think` atau `params.thinking` per model dapat menonaktifkan atau memaksa berpikir API Ollama untuk model terkonfigurasi tertentu. OpenClaw mempertahankan parameter model eksplisit tersebut saat run aktif hanya memiliki default implisit `off`; perintah runtime non-off seperti `/think medium` tetap menimpa run aktif.

  </Accordion>

  <Accordion title="Model penalaran">
    OpenClaw memperlakukan model dengan nama seperti `deepseek-r1`, `reasoning`, atau `think` sebagai berkemampuan penalaran secara default.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Tidak diperlukan konfigurasi tambahan. OpenClaw menandainya secara otomatis.

  </Accordion>

  <Accordion title="Model costs">
    Ollama gratis dan berjalan secara lokal, sehingga semua biaya model ditetapkan ke $0. Ini berlaku untuk model yang ditemukan otomatis maupun yang ditentukan secara manual.
  </Accordion>

  <Accordion title="Memory embeddings">
    Plugin Ollama bawaan mendaftarkan penyedia embedding memori untuk
    [pencarian memori](/id/concepts/memory). Plugin ini menggunakan URL dasar Ollama
    dan kunci API yang dikonfigurasi, memanggil endpoint `/api/embed` Ollama saat ini, dan mengelompokkan
    beberapa potongan memori ke dalam satu permintaan `input` bila memungkinkan.

    Saat `proxy.enabled=true`, permintaan embedding memori Ollama ke origin
    host-local loopback persis yang diturunkan dari `baseUrl` yang dikonfigurasi menggunakan
    jalur langsung terlindungi OpenClaw, bukan proxy penerusan terkelola. Nama host
    yang dikonfigurasi harus berupa `localhost` atau literal IP loopback;
    nama DNS yang hanya resolve ke loopback tetap menggunakan jalur proxy terkelola.
    Host Ollama LAN, tailnet, jaringan privat, dan publik juga tetap berada di
    jalur proxy terkelola. Pengalihan ke host atau port lain tidak mewarisi kepercayaan.
    Operator tetap dapat mengatur setelan global `proxy.loopbackMode: "proxy"` untuk
    mengirim lalu lintas loopback melalui proxy, atau `proxy.loopbackMode: "block"`
    untuk menolak koneksi loopback sebelum membuka koneksi; lihat
    [Proxy terkelola](/id/security/network-proxy#gateway-loopback-mode) untuk
    efek setelan ini di seluruh proses.

    | Properti      | Nilai               |
    | ------------- | ------------------- |
    | Model default | `nomic-embed-text`  |
    | Auto-pull     | Ya — model embedding ditarik secara otomatis jika belum ada secara lokal |

    Embedding saat kueri menggunakan prefiks retrieval untuk model yang memerlukan atau merekomendasikannya, termasuk `nomic-embed-text`, `qwen3-embedding`, dan `mxbai-embed-large`. Batch dokumen memori tetap mentah sehingga indeks yang ada tidak memerlukan migrasi format.

    Untuk memilih Ollama sebagai penyedia embedding pencarian memori:

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

    Untuk host embedding jarak jauh, pertahankan auth tetap tercakup pada host tersebut:

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

  <Accordion title="Streaming configuration">
    Integrasi Ollama OpenClaw menggunakan **API Ollama native** (`/api/chat`) secara default, yang sepenuhnya mendukung streaming dan pemanggilan alat secara bersamaan. Tidak diperlukan konfigurasi khusus.

    Untuk permintaan native `/api/chat`, OpenClaw juga meneruskan kontrol thinking langsung ke Ollama: `/think off` dan `openclaw agent --thinking off` mengirim `think: false` tingkat teratas kecuali nilai eksplisit model `params.think`/`params.thinking` dikonfigurasi, sedangkan `/think low|medium|high` mengirim string effort `think` tingkat teratas yang sesuai. `/think max` dipetakan ke effort native tertinggi Ollama, `think: "high"`.

    <Tip>
    Jika Anda perlu menggunakan endpoint yang kompatibel dengan OpenAI, lihat bagian "Mode kompatibel OpenAI lama" di atas. Streaming dan pemanggilan alat mungkin tidak bekerja secara bersamaan dalam mode tersebut.
    </Tip>

  </Accordion>
</AccordionGroup>

## Pemecahan Masalah

<AccordionGroup>
  <Accordion title="WSL2 crash loop (repeated reboots)">
    Pada WSL2 dengan NVIDIA/CUDA, penginstal Linux resmi Ollama membuat unit systemd `ollama.service` dengan `Restart=always`. Jika layanan tersebut mulai otomatis dan memuat model berbasis GPU selama boot WSL2, Ollama dapat mengunci memori host saat model dimuat. Reclaim memori Hyper-V tidak selalu dapat mengambil kembali halaman yang terkunci tersebut, sehingga Windows dapat menghentikan VM WSL2, systemd memulai Ollama lagi, dan loop berulang.

    Bukti umum:

    - reboot atau penghentian WSL2 berulang dari sisi Windows
    - CPU tinggi di `app.slice` atau `ollama.service` tidak lama setelah startup WSL2
    - SIGTERM dari systemd, bukan peristiwa OOM-killer Linux

    OpenClaw mencatat peringatan startup saat mendeteksi WSL2, `ollama.service` aktif dengan `Restart=always`, dan penanda CUDA yang terlihat.

    Mitigasi:

    ```bash
    sudo systemctl disable ollama
    ```

    Tambahkan ini ke `%USERPROFILE%\.wslconfig` di sisi Windows, lalu jalankan `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Tetapkan keep-alive yang lebih pendek di lingkungan layanan Ollama, atau mulai Ollama secara manual hanya saat Anda membutuhkannya:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Lihat [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama not detected">
    Pastikan Ollama sedang berjalan dan Anda telah mengatur `OLLAMA_API_KEY` (atau profil auth), serta Anda **tidak** mendefinisikan entri `models.providers.ollama` eksplisit:

    ```bash
    ollama serve
    ```

    Verifikasi bahwa API dapat diakses:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No models available">
    Jika model Anda tidak tercantum, tarik model secara lokal atau definisikan secara eksplisit di `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Connection refused">
    Periksa bahwa Ollama berjalan pada port yang benar:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Remote host works with curl but not OpenClaw">
    Verifikasi dari mesin dan runtime yang sama yang menjalankan Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Penyebab umum:

    - `baseUrl` mengarah ke `localhost`, tetapi Gateway berjalan di Docker atau di host lain.
    - URL menggunakan `/v1`, yang memilih perilaku kompatibel OpenAI, bukan Ollama native.
    - Host jarak jauh memerlukan perubahan firewall atau binding LAN di sisi Ollama.
    - Model ada di daemon laptop Anda tetapi tidak di daemon jarak jauh.

  </Accordion>

  <Accordion title="Model outputs tool JSON as text">
    Ini biasanya berarti penyedia menggunakan mode kompatibel OpenAI atau model tidak dapat menangani skema alat.

    Pilih mode Ollama native:

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

    Jika model lokal kecil masih gagal pada skema alat, atur `compat.supportsTools: false` pada entri model tersebut dan uji ulang.

  </Accordion>

  <Accordion title="Kimi or GLM returns garbled symbols">
    Respons Kimi/GLM ter-hosting yang panjang dan berupa rangkaian simbol non-linguistik diperlakukan sebagai output penyedia yang gagal, bukan jawaban asisten yang berhasil. Dengan begitu retry, fallback, atau penanganan error normal dapat mengambil alih tanpa menyimpan teks rusak ke dalam sesi.

    Jika terjadi berulang kali, ambil nama model mentah, file sesi saat ini, dan apakah run menggunakan `Cloud + Local` atau `Cloud only`, lalu coba sesi baru dan model fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Cold local model times out">
    Model lokal besar dapat memerlukan pemuatan pertama yang lama sebelum streaming dimulai. Pertahankan timeout tetap tercakup pada penyedia Ollama, dan secara opsional minta Ollama menjaga model tetap dimuat antar giliran:

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

    Jika host itu sendiri lambat menerima koneksi, `timeoutSeconds` juga memperpanjang timeout koneksi Undici terlindungi untuk penyedia ini.

  </Accordion>

  <Accordion title="Large-context model is too slow or runs out of memory">
    Banyak model Ollama mengiklankan konteks yang lebih besar daripada yang dapat dijalankan perangkat keras Anda dengan nyaman. Ollama native menggunakan default konteks runtime Ollama sendiri kecuali Anda mengatur `params.num_ctx`. Batasi anggaran OpenClaw dan konteks permintaan Ollama saat Anda menginginkan latensi token pertama yang dapat diprediksi:

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

    Turunkan `contextWindow` terlebih dahulu jika OpenClaw mengirim prompt terlalu banyak. Turunkan `params.num_ctx` jika Ollama memuat konteks runtime yang terlalu besar untuk mesin tersebut. Turunkan `maxTokens` jika generasi berjalan terlalu lama.

  </Accordion>
</AccordionGroup>

<Note>
Bantuan lainnya: [Pemecahan Masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Model providers" href="/id/concepts/model-providers" icon="layers">
    Ikhtisar semua penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Model selection" href="/id/concepts/models" icon="brain">
    Cara memilih dan mengonfigurasi model.
  </Card>
  <Card title="Ollama Web Search" href="/id/tools/ollama-search" icon="magnifying-glass">
    Detail lengkap penyiapan dan perilaku untuk pencarian web berbasis Ollama.
  </Card>
  <Card title="Configuration" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap.
  </Card>
</CardGroup>
