---
read_when:
    - Anda ingin menjalankan OpenClaw dengan model cloud atau lokal melalui Ollama
    - Anda memerlukan panduan penyiapan dan konfigurasi Ollama
    - Anda ingin menggunakan model vision Ollama untuk memahami gambar
summary: Jalankan OpenClaw dengan Ollama (model cloud dan lokal)
title: Ollama
x-i18n:
    generated_at: "2026-07-16T18:39:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9cde30d5b713be4c51e8a98fb7a380f856dca8a611b4b0adfe8e40cd738105fa
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw berkomunikasi dengan API native Ollama (`/api/chat`), bukan endpoint
`/v1` yang kompatibel dengan OpenAI. Tiga mode didukung:

| Mode          | Yang digunakan                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| Cloud + Lokal | Host Ollama yang dapat dijangkau, yang melayani model lokal dan (jika sudah masuk) model `:cloud` |
| Hanya cloud   | `https://ollama.com` secara langsung, tanpa daemon lokal                                   |
| Hanya lokal   | Host Ollama yang dapat dijangkau, hanya model lokal                                       |

Untuk penyiapan khusus cloud dengan id penyedia khusus `ollama-cloud`, lihat
[Ollama Cloud](/id/providers/ollama-cloud). Gunakan referensi `ollama-cloud/<model>` jika
Anda ingin perutean cloud tetap terpisah dari penyedia lokal `ollama`.

<Warning>
Jangan gunakan URL `/v1` yang kompatibel dengan OpenAI (`http://host:11434/v1`). URL tersebut merusak pemanggilan alat dan model dapat mengeluarkan JSON pemanggilan alat mentah sebagai teks biasa. Gunakan URL native: `baseUrl: "http://host:11434"` (tanpa `/v1`).
</Warning>

Kunci konfigurasi kanonis adalah `baseUrl`. `baseURL` juga diterima untuk
contoh bergaya OpenAI SDK, tetapi konfigurasi baru harus menggunakan `baseUrl`.

## Aturan autentikasi

<AccordionGroup>
  <Accordion title="Host lokal dan LAN">
    URL Ollama loopback, jaringan privat, `.local`, dan nama host polos tidak memerlukan token bearer yang sebenarnya. OpenClaw menggunakan penanda `ollama-local` untuk URL tersebut.
  </Accordion>
  <Accordion title="Host jarak jauh dan Ollama Cloud">
    Host jarak jauh publik dan `https://ollama.com` memerlukan kredensial yang sebenarnya: `OLLAMA_API_KEY`, profil autentikasi, atau `apiKey` milik penyedia. Untuk penggunaan langsung yang di-host, utamakan penyedia `ollama-cloud`.
  </Accordion>
  <Accordion title="Id penyedia kustom">
    Penyedia kustom dengan `api: "ollama"` mengikuti aturan yang sama. Misalnya, penyedia `ollama-remote` yang diarahkan ke host LAN privat dapat menggunakan `apiKey: "ollama-local"`; subagen menyelesaikan penanda tersebut melalui hook penyedia Ollama alih-alih menganggapnya sebagai kredensial yang hilang. `agents.defaults.memorySearch.provider` juga dapat diarahkan ke id penyedia kustom agar embedding menggunakan endpoint Ollama tersebut.
  </Accordion>
  <Accordion title="Profil autentikasi">
    `auth-profiles.json` menyimpan kredensial untuk suatu id penyedia; masukkan pengaturan endpoint (`baseUrl`, `api`, model, header, batas waktu) di `models.providers.<id>`. Berkas datar lama seperti `{ "ollama-windows": { "apiKey": "ollama-local" } }` bukan format runtime; `openclaw doctor --fix` menulis ulang berkas tersebut menjadi profil kunci API `ollama-windows:default` kanonis beserta cadangannya. Nilai `baseUrl` dalam berkas lama tersebut adalah derau dan harus dipindahkan ke konfigurasi penyedia.
  </Accordion>
  <Accordion title="Cakupan embedding memori">
    Autentikasi bearer untuk embedding memori Ollama dibatasi pada host tempat autentikasi tersebut dideklarasikan:

    - Kunci tingkat penyedia hanya dikirim ke host milik penyedia tersebut.
    - `agents.*.memorySearch.remote.apiKey` hanya dikirim ke host embedding jarak jauhnya.
    - Nilai env `OLLAMA_API_KEY` murni diperlakukan sebagai konvensi Ollama Cloud dan secara default tidak dikirim ke host lokal/yang di-host sendiri.

  </Accordion>
</AccordionGroup>

## Memulai

<Tabs>
  <Tab title="Onboarding (disarankan)">
    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard
        ```

        Pilih **Ollama**, lalu pilih mode: **Cloud + Lokal**, **Hanya cloud**, atau **Hanya lokal**.

        Pada penyiapan terpandu baru, OpenClaw terlebih dahulu memeriksa host
        Ollama default atau yang dikonfigurasi. Jika model yang terinstal menyatakan dukungan alat, alur
        penyiapan bersama CLI/macOS langsung menawarkannya dan memverifikasinya dengan completion
        nyata. Pemeriksaan otomatis ini tidak pernah menarik model; jika tidak ada model terinstal
        yang sesuai, onboarding berlanjut ke pemilih Ollama normal.
      </Step>
      <Step title="Pilih model">
        `Cloud only` meminta `OLLAMA_API_KEY` dan menyarankan default cloud yang di-host. `Cloud + Local` dan `Local only` meminta URL dasar Ollama, menemukan model yang tersedia, dan secara otomatis menarik model lokal yang dipilih jika belum tersedia. Tag `:latest` yang terinstal seperti `gemma4:latest` ditampilkan sekali alih-alih menduplikasi `gemma4`. `Cloud + Local` juga memeriksa apakah host sudah masuk untuk akses cloud.
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
      <Step title="Instal dan mulai Ollama">
        Dapatkan dari [ollama.com/download](https://ollama.com/download), lalu tarik model:

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

`Cloud + Local` merutekan model lokal dan `:cloud` melalui satu host
Ollama yang dapat dijangkau — ini adalah alur hibrida Ollama dan mode yang harus dipilih selama penyiapan
jika Anda menginginkan keduanya.

OpenClaw meminta URL dasar, menemukan model lokal, dan memeriksa
status `ollama signin`. Saat sudah masuk, OpenClaw menyarankan default yang di-host
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Jika
belum masuk, penyiapan tetap hanya lokal hingga Anda menjalankan `ollama signin`.

Untuk akses khusus cloud tanpa daemon lokal, gunakan `openclaw onboard --auth-choice ollama-cloud` dan lihat [Ollama Cloud](/id/providers/ollama-cloud) — jalur tersebut tidak memerlukan `ollama signin` atau server yang sedang berjalan:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

Daftar model cloud yang ditampilkan selama `openclaw onboard` diisi secara langsung dari
`https://ollama.com/api/tags`, dibatasi hingga 500 entri, sehingga pemilih mencerminkan
katalog yang di-host saat ini. Jika `ollama.com` tidak dapat dijangkau atau tidak mengembalikan
model pada saat penyiapan, OpenClaw kembali menggunakan daftar saran bawaan agar
onboarding tetap selesai.

## Penemuan model (penyedia implisit)

Saat `OLLAMA_API_KEY` (atau profil autentikasi) ditetapkan dan baik
`models.providers.ollama` maupun penyedia kustom lain dengan `api: "ollama"` tidak
ditentukan, OpenClaw menemukan model dari `http://127.0.0.1:11434`:

| Perilaku             | Detail                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kueri katalog        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| Deteksi kapabilitas | `/api/show` dengan upaya terbaik membaca `contextWindow`, parameter Modelfile `num_ctx`, dan kapabilitas (visi/alat/berpikir)                                                                                                                                                                       |
| Model visi        | Kapabilitas `vision` dari `/api/show` menandai model sebagai mendukung gambar (`input: ["text", "image"]`)                                                                                                                                                                                             |
| Deteksi penalaran  | Menggunakan kapabilitas `thinking` dari `/api/show` jika tersedia; kembali menggunakan heuristik nama (`r1`, `reason`, `reasoning`, `think`) saat Ollama menghilangkan kapabilitas. `glm-5.2:cloud` dan `deepseek-v4-flash\|pro:cloud` selalu diperlakukan sebagai model penalaran terlepas dari kapabilitas yang dilaporkan. |
| Batas token         | `maxTokens` secara default menggunakan batas token maksimum Ollama milik OpenClaw                                                                                                                                                                                                                                       |
| Biaya                | Semua biaya adalah `0`                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

Menetapkan `models.providers.ollama` dengan array `models` eksplisit, atau
penyedia kustom dengan `api: "ollama"` dan `baseUrl` non-loopback, menonaktifkan
penemuan otomatis; model kemudian harus ditentukan secara manual (lihat
[Konfigurasi](#configuration)). Entri `models.providers.ollama` yang diarahkan ke
`https://ollama.com` yang di-host juga melewati penemuan, karena model Ollama Cloud
dikelola oleh penyedia. Penyedia kustom loopback seperti
`http://127.0.0.2:11434` tetap dianggap lokal dan mempertahankan penemuan otomatis.

Anda dapat menggunakan referensi lengkap seperti `ollama/<pulled-model>:latest` tanpa
entri `models.json` yang ditulis manual; OpenClaw menyelesaikannya secara langsung. Untuk host yang sudah masuk,
memilih referensi `ollama/<model>:cloud` yang tidak tercantum akan memvalidasi model tersebut secara tepat
dengan `/api/show` dan menambahkannya ke katalog runtime hanya jika Ollama
mengonfirmasi metadata — salah ketik tetap gagal sebagai model yang tidak dikenal.

### Uji cepat

Untuk probe teks sempit yang melewati seluruh permukaan alat agen:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Tambahkan `--file` dengan gambar untuk probe model visi yang ringan (menerima PNG/JPEG/WebP;
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

Memilih model dengan `/model ollama/<model>` merupakan pilihan pengguna yang tepat: jika
`baseUrl` yang dikonfigurasi tidak dapat dijangkau, balasan berikutnya gagal dengan galat penyedia
alih-alih diam-diam beralih ke model lain yang dikonfigurasi.

Pekerjaan cron terisolasi menambahkan satu pemeriksaan keamanan lokal sebelum memulai giliran agen:
jika model yang dipilih mengarah ke penyedia Ollama jaringan-lokal/pribadi/`.local`
dan `/api/tags` tidak dapat dijangkau, OpenClaw mencatat eksekusi tersebut sebagai
`skipped` dengan model dalam teks kesalahan. Pemeriksaan endpoint ini di-cache selama
5 menit per host, sehingga pekerjaan cron berulang terhadap daemon yang berhenti tidak semuanya
meluncurkan permintaan yang gagal.

Verifikasi langsung:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Untuk Ollama Cloud, arahkan pengujian langsung yang sama ke endpoint yang di-host (secara default
melewati embedding; paksa dengan `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` karena
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

## Inferensi lokal di Node

Agen dapat mendelegasikan tugas singkat ke model Ollama pada desktop atau
Node server yang dipasangkan. Prompt dan respons melewati koneksi
Gateway/Node terautentikasi yang sudah ada; permintaan berjalan pada endpoint Ollama
loopback milik Node sendiri (`http://127.0.0.1:11434`).

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
    Plugin Ollama bawaan mengekspos alat `node_inference`. Agen memanggil
    `action: "discover"` terlebih dahulu, lalu `action: "run"` dengan Node dan model dari
    hasil tersebut (`run` dapat menghilangkan Node jika tepat satu Node yang mampu
    sedang terhubung). Contoh: "Temukan model Ollama pada Node saya, lalu gunakan
    model termuat yang paling cepat untuk merangkum teks ini."
  </Step>
</Steps>

Penemuan membaca `/api/tags`, memeriksa kemampuan `/api/show`, dan menggunakan
`/api/ps` jika tersedia untuk memprioritaskan model yang sudah dimuat. Penemuan hanya mengembalikan
model lokal yang dilaporkan Ollama mampu melakukan percakapan (kemampuan `completion`) —
baris Ollama Cloud dan model khusus embedding dikecualikan. Setiap eksekusi menonaktifkan
pemikiran model dan secara default membatasi keluaran hingga 512 token (batas mutlak 8192), kecuali
panggilan alat meminta `maxTokens` yang berbeda; beberapa model (misalnya GPT-OSS)
tidak mendukung penonaktifan pemikiran dan mungkin tetap menghasilkan token penalaran.

Untuk mempertahankan Ollama tetap berjalan pada suatu Node tanpa mengeksposnya kepada agen:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Mulai ulang Node (`openclaw node restart`, atau hentikan/jalankan kembali `openclaw node run`
untuk sesi latar depan). Node berhenti mengiklankan `ollama.models` dan
`ollama.chat`; Ollama itu sendiri dan penyedia Ollama milik Gateway tidak terpengaruh.
Atur kembali nilainya menjadi `true` dan mulai ulang untuk mengaktifkannya kembali; permukaan perintah yang berubah
mungkin memerlukan persetujuan `openclaw nodes pending` lagi setelah tersambung kembali.

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

`--invoke-timeout` membatasi berapa lama Node dapat menjalankan perintah;
`--timeout` membatasi keseluruhan panggilan Gateway dan harus lebih besar.

Inferensi lokal di Node selalu menggunakan endpoint loopback milik Node sendiri — inferensi ini
tidak menggunakan kembali `models.providers.ollama.baseUrl` jarak jauh/cloud yang dikonfigurasi. Perintah
Node tersedia secara default pada host Node macOS, Linux, dan Windows
serta tetap tunduk pada kebijakan pemasangan/perintah Node normal.

## Visi dan deskripsi gambar

Plugin Ollama bawaan mendaftarkan Ollama sebagai penyedia
pemahaman media yang mendukung gambar, sehingga OpenClaw dapat merutekan permintaan
deskripsi gambar eksplisit dan default model gambar yang dikonfigurasi melalui model visi Ollama
lokal atau yang di-host.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` harus berupa referensi `<provider/model>` lengkap; jika ditetapkan, `infer image
describe` mencoba model tersebut terlebih dahulu alih-alih melewati deskripsi untuk model
yang sudah mendukung visi native. Jika panggilan gagal, OpenClaw dapat melanjutkan
melalui `agents.defaults.imageModel.fallbacks`; kesalahan penyiapan berkas/URL
gagal sebelum fallback dicoba. Gunakan `infer image describe` untuk alur
pemahaman gambar OpenClaw dan `imageModel` yang dikonfigurasi; gunakan `infer model run
--file` untuk penyelidikan multimodal mentah dengan prompt khusus.

Untuk menjadikan Ollama sebagai penyedia pemahaman gambar default bagi media masuk:

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

Utamakan referensi `ollama/<model>` lengkap. Referensi `imageModel` tanpa prefiks seperti
`qwen2.5vl:7b` dinormalisasi menjadi `ollama/qwen2.5vl:7b` hanya jika model persis tersebut
tercantum di bawah `models.providers.ollama.models` dengan
`input: ["text", "image"]` dan tidak ada penyedia gambar terkonfigurasi lain yang mengekspos
ID tanpa prefiks yang sama; jika tidak, gunakan prefiks penyedia secara eksplisit.

Model visi lokal yang lambat mungkin memerlukan batas waktu pemahaman gambar yang lebih lama daripada
model cloud, dan dapat mengalami crash pada perangkat keras terbatas jika Ollama mencoba
mengalokasikan seluruh konteks visi yang diiklankan model. Tetapkan batas waktu
kemampuan dan batasi `num_ctx`:

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

Batas waktu ini berlaku untuk pemahaman gambar masuk dan alat eksplisit
`image`. `models.providers.ollama.timeoutSeconds` tetap mengendalikan
pelindung permintaan HTTP Ollama yang mendasari untuk panggilan model normal.

Verifikasi langsung:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Jika Anda menentukan `models.providers.ollama.models` secara manual, tandai model visi
secara eksplisit:

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
mendukung gambar. Dengan penemuan implisit, informasi ini berasal dari kemampuan visi
`/api/show`.

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
    Gunakan konfigurasi eksplisit untuk penyiapan cloud yang di-host, host/port non-default, jendela
    konteks yang dipaksakan, atau daftar model yang sepenuhnya manual:

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
            baseUrl: "http://ollama-host:11434", // Tanpa /v1 - URL API Ollama native
            api: "ollama", // Eksplisit: menjamin perilaku pemanggilan alat native
            timeoutSeconds: 300, // Opsional: anggaran koneksi/aliran lebih lama untuk model lokal yang belum dimuat
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Opsional: pertahankan model tetap dimuat di antara giliran
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
    Tanpa daemon lokal, langsung menggunakan model yang di-host:

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

    Untuk id penyedia khusus `ollama-cloud`, bukan bentuk ini, lihat
    [Ollama Cloud](/id/providers/ollama-cloud).

  </Accordion>

  <Accordion title="Cloud dan lokal melalui daemon yang telah masuk">
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
    `ollama/` tanpa kualifikasi) sebelum memanggil Ollama, sehingga `ollama-large/qwen3.5:27b`
    sampai ke Ollama sebagai `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Profil model lokal ringan">
    Beberapa model lokal mampu menangani prompt sederhana, tetapi kesulitan dengan seluruh
    permukaan alat agen. Batasi alat dan konteks sebelum mengubah pengaturan
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

    Gunakan `compat.supportsTools: false` hanya jika model atau server secara konsisten
    gagal pada skema alat — opsi ini mengorbankan kemampuan agen demi stabilitas.
    `localModelLean` menghapus alat berat untuk peramban, cron, pesan, pembuatan media,
    suara, dan PDF dari permukaan agen langsung kecuali diwajibkan secara eksplisit,
    serta menempatkan katalog yang lebih besar di balik Pencarian Alat. Opsi ini tidak mengubah
    konteks runtime atau mode berpikir Ollama. Padukan dengan `params.num_ctx` dan
    `params.thinking: false` untuk model berpikir kecil bergaya Qwen yang mengalami perulangan atau
    menghabiskan anggarannya untuk penalaran tersembunyi.

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

ID penyedia khusus bekerja dengan cara yang sama: untuk referensi yang menggunakan prefiks penyedia
aktif, seperti `ollama-spark/qwen3:32b`, OpenClaw menghapus prefiks tersebut sebelum
memanggil Ollama, lalu mengirimkan `qwen3:32b`.

Untuk model lokal yang lambat, utamakan penyesuaian pada cakupan penyedia sebelum menaikkan batas waktu
runtime agen secara keseluruhan:

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
streaming isi, dan pembatalan guarded-fetch secara keseluruhan. `params.keep_alive`
diteruskan sebagai `keep_alive` tingkat atas pada permintaan native `/api/chat`; atur per
model jika waktu pemuatan giliran pertama menjadi hambatan.

### Verifikasi cepat

```bash
# Daemon Ollama terlihat oleh mesin ini
curl http://127.0.0.1:11434/api/tags

# Katalog OpenClaw dan model yang dipilih
openclaw models list --provider ollama
openclaw models status

# Uji cepat model secara langsung
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Balas tepat dengan: ok"
```

Untuk host jarak jauh, ganti `127.0.0.1` dengan host `baseUrl`. Jika `curl`
berfungsi tetapi OpenClaw tidak, periksa apakah Gateway berjalan pada mesin,
kontainer, atau akun layanan yang berbeda.

## Ollama Web Search

OpenClaw menyertakan **Ollama Web Search** sebagai penyedia `web_search`.

| Properti    | Detail                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | `models.providers.ollama.baseUrl` jika ditetapkan, jika tidak `http://127.0.0.1:11434`; `https://ollama.com` menggunakan API yang dihosting secara langsung                          |
| Autentikasi | Tanpa kunci untuk host lokal yang telah masuk; `OLLAMA_API_KEY` atau autentikasi penyedia yang dikonfigurasi untuk pencarian `https://ollama.com` langsung atau host yang dilindungi autentikasi           |
| Persyaratan | Host lokal/yang dihosting sendiri harus berjalan dan telah masuk dengan `ollama signin`; pencarian langsung yang dihosting memerlukan `baseUrl: "https://ollama.com"` serta kunci API yang valid |

Pilih selama `openclaw onboard` atau `openclaw configure --section web`, atau tetapkan:

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

Untuk pencarian langsung yang dihosting melalui Ollama Cloud:

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
`/api/experimental/web_search`, lalu kembali menggunakan jalur `/api/web_search` yang dihosting pada host yang sama;
daemon lokal yang telah masuk biasanya merespons melalui proksi lokal. Panggilan
`https://ollama.com` langsung selalu menggunakan endpoint `/api/web_search` yang dihosting.

<Note>
Untuk penyiapan dan perilaku lengkap, lihat [Ollama Web Search](/id/tools/ollama-search).
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Mode kompatibel OpenAI lama">
    <Warning>
    **Pemanggilan alat tidak andal dalam mode ini.** Gunakan hanya jika proksi memerlukan format OpenAI dan Anda tidak bergantung pada pemanggilan alat native.
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
            injectNumCtxForOpenAICompat: true, // bawaan: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Mode ini mungkin tidak mendukung streaming dan pemanggilan alat secara bersamaan; Anda
    mungkin memerlukan `params: { streaming: false }` pada model.

    OpenClaw menyisipkan `options.num_ctx` secara bawaan dalam mode ini agar Ollama
    tidak diam-diam kembali menggunakan konteks 4096 token. Jika proksi Anda menolak
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
    Untuk model yang ditemukan otomatis, OpenClaw menggunakan jendela konteks yang dilaporkan
    `/api/show`, termasuk nilai `PARAMETER num_ctx` yang lebih besar dari
    Modelfile khusus; jika tidak, OpenClaw kembali menggunakan jendela konteks Ollama
    bawaannya.

    `contextWindow`, `contextTokens`, dan `maxTokens` tingkat penyedia menetapkan
    nilai bawaan untuk setiap model di bawah penyedia tersebut dan dapat ditimpa per
    model. `contextWindow` adalah anggaran prompt/Compaction milik OpenClaw. Permintaan native
    `/api/chat` membiarkan `options.num_ctx` tidak ditetapkan kecuali Anda menetapkan
    `params.num_ctx` secara eksplisit, sehingga Ollama menerapkan nilai bawaan model,
    `OLLAMA_CONTEXT_LENGTH`, atau berbasis VRAM miliknya sendiri; nilai `params.num_ctx` yang tidak valid,
    nol, negatif, atau bukan bilangan berhingga akan diabaikan. Jika konfigurasi lama hanya menggunakan
    `contextWindow`/`maxTokens` untuk memaksakan konteks permintaan native, jalankan
    `openclaw doctor --fix` untuk menyalinnya ke `params.num_ctx`. Adaptor yang
    kompatibel dengan OpenAI tetap menyisipkan `options.num_ctx` secara bawaan dari
    `params.num_ctx` atau `contextWindow` yang dikonfigurasi; nonaktifkan dengan
    `injectNumCtxForOpenAICompat: false` jika upstream menolak `options`.

    Entri model native juga menerima opsi runtime Ollama umum di bawah
    `params`, yang diteruskan sebagai `options` `/api/chat` native: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap`, dan `num_thread`.
    Beberapa kunci (`format`, `keep_alive`, `truncate`, `shift`) diteruskan sebagai
    bidang permintaan tingkat atas, bukan `options` bersarang. OpenClaw hanya
    meneruskan kunci permintaan Ollama ini, sehingga parameter khusus runtime seperti
    `streaming` tidak pernah dikirim ke Ollama. Gunakan `params.think` (atau
    `params.thinking`) untuk menetapkan `think` tingkat atas; `false` menonaktifkan
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
    berfungsi; entri model penyedia eksplisit diprioritaskan jika keduanya ditetapkan.

  </Accordion>

  <Accordion title="Kontrol pemikiran">
    OpenClaw meneruskan pemikiran sebagaimana yang diharapkan Ollama: `think` tingkat atas, bukan
    `options.think`. Model yang ditemukan otomatis dan `/api/show`-nya melaporkan
    kemampuan `thinking` menyediakan `/think low`, `/think medium`, `/think high`,
    dan `/think max`; model tanpa pemikiran hanya menyediakan `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Atau tetapkan default model:

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

    `params.think`/`params.thinking` per model dapat menonaktifkan atau memaksa
    penalaran API untuk model tertentu. OpenClaw mempertahankan konfigurasi eksplisit
    tersebut ketika proses aktif hanya memiliki default implisit `off`;
    perintah runtime yang bukan nonaktif seperti `/think medium` tetap
    menimpanya. Permintaan penalaran yang bernilai benar tidak pernah dikirim ke
    model yang secara eksplisit ditandai `reasoning: false`; permintaan
    `think: false` selalu dikirim apa pun kondisinya.

  </Accordion>

  <Accordion title="Model penalaran">
    Model bernama `deepseek-r1`, `reasoning`, `reason`, atau `think`
    secara default dianggap mendukung penalaran — tidak diperlukan konfigurasi tambahan:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Biaya model">
    Ollama berjalan secara lokal dan gratis, sehingga semua biaya model adalah
    `0` untuk model yang ditemukan secara otomatis maupun yang
    ditentukan secara manual.
  </Accordion>

  <Accordion title="Embedding memori">
    Plugin Ollama bawaan mendaftarkan penyedia embedding memori untuk
    [pencarian memori](/id/concepts/memory). Plugin ini menggunakan URL dasar Ollama
    dan kunci API yang dikonfigurasi, memanggil `/api/embed`, serta
    mengelompokkan beberapa potongan memori ke dalam satu permintaan
    `input` jika memungkinkan.

    Ketika `proxy.enabled=true`, permintaan embedding ke origin loopback lokal-host
    yang sama persis dan diturunkan dari `baseUrl` yang dikonfigurasi
    menggunakan jalur langsung terlindungi milik OpenClaw, bukan proksi penerusan
    terkelola. Nama host yang dikonfigurasi harus berupa `localhost` atau
    literal IP loopback — nama DNS yang sekadar diresolusikan ke loopback tetap
    menggunakan jalur proksi terkelola. Host Ollama di LAN, tailnet, jaringan
    privat, dan publik selalu tetap menggunakan jalur proksi terkelola, dan
    pengalihan ke host/port lain tidak mewarisi kepercayaan.
    `proxy.loopbackMode: "proxy"` tetap merutekan lalu lintas loopback melalui proksi;
    `proxy.loopbackMode: "block"` menolaknya sebelum terhubung — lihat
    [Proksi terkelola](/id/security/network-proxy#gateway-loopback-mode).

    | Properti | Nilai |
    | --- | --- |
    | Model default | `nomic-embed-text` |
    | Penarikan otomatis | Ya, jika belum tersedia secara lokal |
    | Konkurensi inline default | 1 (default penyedia lain lebih tinggi; tingkatkan dengan `nonBatchConcurrency` jika host mampu menanganinya) |

    Embedding saat kueri menggunakan prefiks pengambilan untuk model yang
    mewajibkan atau merekomendasikannya: `nomic-embed-text`,
    `qwen3-embedding`, dan `mxbai-embed-large`. Batch dokumen tetap mentah,
    sehingga indeks yang ada tidak memerlukan migrasi format.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default untuk Ollama. Tingkatkan pada host yang lebih besar jika pengindeksan ulang terlalu lambat.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Untuk host embedding jarak jauh, batasi cakupan autentikasi ke host tersebut:

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
    Ollama secara default menggunakan **API native** (`/api/chat`), yang
    mendukung streaming dan pemanggilan alat secara bersamaan — tidak diperlukan
    konfigurasi khusus.

    Untuk permintaan native, kontrol penalaran diteruskan secara langsung:
    `/think off` dan `openclaw agent --thinking off` mengirim `think: false`
    tingkat teratas kecuali `params.think`/`params.thinking` eksplisit
    dikonfigurasi; `/think
    low|medium|high` mengirim string tingkat upaya yang sesuai;
    `/think max` dipetakan ke tingkat upaya tertinggi Ollama,
    `think: "high"`.

    <Tip>
    Untuk menggunakan endpoint yang kompatibel dengan OpenAI, lihat "Mode kompatibel OpenAI lama" di atas — streaming dan pemanggilan alat mungkin tidak dapat digunakan bersamaan di sana.
    </Tip>

  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Perulangan crash WSL2 (boot ulang berulang)">
    Pada WSL2 dengan NVIDIA/CUDA, penginstal Linux Ollama resmi membuat unit
    systemd `ollama.service` dengan `Restart=always`. Jika layanan tersebut
    dimulai otomatis dan memuat model yang didukung GPU saat WSL2 melakukan boot,
    Ollama dapat menahan memori host selama pemuatan; pengambilan kembali memori
    Hyper-V tidak selalu dapat mengambil kembali halaman tersebut, sehingga
    Windows dapat menghentikan VM WSL2, systemd memulai ulang Ollama, dan
    perulangan tersebut berulang.

    Bukti: boot ulang/penghentian WSL2 berulang, penggunaan CPU tinggi pada
    `app.slice` atau `ollama.service` tepat setelah WSL2 dimulai, dan
    SIGTERM dari systemd, bukan penghenti OOM Linux.

    OpenClaw mencatat peringatan saat startup ketika mendeteksi WSL2,
    `ollama.service` diaktifkan dengan `Restart=always`, dan penanda CUDA
    terlihat.

    Mitigasi:

    ```bash
    sudo systemctl disable ollama
    ```

    Di sisi Windows, tambahkan ini ke `%USERPROFILE%\.wslconfig`, lalu jalankan
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Atau persingkat waktu keep-alive / mulai Ollama secara manual hanya saat diperlukan:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Lihat [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama tidak terdeteksi">
    Pastikan Ollama sedang berjalan, `OLLAMA_API_KEY` (atau profil autentikasi)
    telah ditetapkan, dan `models.providers.ollama` **tidak** didefinisikan secara
    eksplisit:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Tidak ada model yang tersedia">
    Tarik model secara lokal, atau tentukan secara eksplisit di
    `models.providers.ollama`:

    ```bash
    ollama list  # Lihat apa yang terinstal
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Atau model lain
    ```

  </Accordion>

  <Accordion title="Koneksi ditolak">
    ```bash
    # Periksa apakah Ollama sedang berjalan
    ps aux | grep ollama

    # Atau mulai ulang Ollama
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
    - URL menggunakan `/v1`, sehingga memilih perilaku yang kompatibel dengan OpenAI, bukan Ollama native.
    - Host jarak jauh memerlukan perubahan firewall atau pengikatan LAN.
    - Model berada pada daemon laptop Anda, bukan pada daemon jarak jauh.

  </Accordion>

  <Accordion title="Model menghasilkan JSON alat sebagai teks">
    Biasanya penyedia berada dalam mode kompatibel dengan OpenAI, atau model
    tidak dapat menangani skema alat. Utamakan mode native:

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

    Jika model lokal kecil masih gagal menangani skema alat, tetapkan
    `compat.supportsTools: false` pada entri model tersebut dan uji ulang.

  </Accordion>

  <Accordion title="Kimi atau GLM menghasilkan simbol yang tidak terbaca">
    Respons Kimi/GLM yang dihosting dan berupa rangkaian simbol panjang
    nonlinguistik diperlakukan sebagai panggilan penyedia yang gagal, bukan
    balasan yang berhasil, sehingga penanganan percobaan ulang/fallback/kesalahan
    normal mengambil alih alih-alih menyimpan teks rusak ke dalam sesi.

    Jika masalah berulang, catat nama model, file sesi saat ini, dan apakah
    proses menggunakan `Cloud + Local` atau `Cloud only`, lalu coba sesi
    baru dan model fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Model lokal yang masih dingin mengalami waktu habis">
    Model lokal besar mungkin memerlukan waktu lama untuk pemuatan pertama.
    Batasi cakupan waktu habis ke penyedia Ollama dan, jika diinginkan,
    pertahankan model tetap dimuat di antara giliran:

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
    memperpanjang waktu habis koneksi terlindungi untuk penyedia ini.

  </Accordion>

  <Accordion title="Model berkonteks besar terlalu lambat atau kehabisan memori">
    Banyak model mengiklankan konteks yang lebih besar daripada yang dapat
    dijalankan perangkat keras Anda dengan nyaman. Ollama native menggunakan
    default runtime-nya sendiri kecuali `params.num_ctx` ditetapkan. Batasi
    anggaran OpenClaw dan konteks permintaan Ollama untuk latensi token pertama
    yang dapat diprediksi:

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

    Turunkan `contextWindow` jika OpenClaw mengirim terlalu banyak prompt.
    Turunkan `params.num_ctx` jika konteks runtime Ollama terlalu besar untuk
    mesin. Turunkan `maxTokens` jika pembuatan berlangsung terlalu lama.

  </Accordion>
</AccordionGroup>

<Note>
Bantuan selengkapnya: [Pemecahan masalah](/id/help/troubleshooting) dan [Tanya Jawab Umum](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/id/providers/ollama-cloud" icon="cloud">
    Penyiapan khusus cloud dengan penyedia `ollama-cloud` khusus.
  </Card>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Ringkasan semua penyedia, referensi model, dan perilaku failover.
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
