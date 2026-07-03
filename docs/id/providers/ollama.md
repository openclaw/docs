---
read_when:
    - Anda ingin menjalankan OpenClaw dengan model awan atau lokal melalui Ollama
    - Anda membutuhkan panduan penyiapan dan konfigurasi Ollama
    - Anda menginginkan model vision Ollama untuk pemahaman gambar
summary: Jalankan OpenClaw dengan Ollama (model cloud dan lokal)
title: Ollama
x-i18n:
    generated_at: "2026-07-03T10:00:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d91871ef96c3bdc027fe7cfceecae7e1d050913d859e3c6840725002fdf57af
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw terintegrasi dengan API native Ollama (`/api/chat`) untuk model cloud yang dihosting dan server Ollama lokal/self-hosted. Anda dapat menggunakan Ollama dalam tiga mode: `Cloud + Local` melalui host Ollama yang dapat dijangkau, `Cloud only` terhadap `https://ollama.com`, atau `Local only` terhadap host Ollama yang dapat dijangkau.

OpenClaw juga mendaftarkan `ollama-cloud` sebagai id penyedia terhosting kelas utama untuk
penggunaan Ollama Cloud langsung. Gunakan ref seperti `ollama-cloud/kimi-k2.5:cloud` ketika Anda
menginginkan perutean khusus cloud tanpa berbagi id penyedia `ollama` lokal.

Untuk halaman penyiapan khusus cloud saja, lihat [Ollama Cloud](/id/providers/ollama-cloud).

<Warning>
**Pengguna Ollama jarak jauh**: Jangan gunakan URL kompatibel OpenAI `/v1` (`http://host:11434/v1`) dengan OpenClaw. Ini merusak pemanggilan tool dan model dapat mengeluarkan JSON tool mentah sebagai teks biasa. Gunakan URL API native Ollama sebagai gantinya: `baseUrl: "http://host:11434"` (tanpa `/v1`).
</Warning>

Konfigurasi penyedia Ollama menggunakan `baseUrl` sebagai kunci kanonis. OpenClaw juga menerima `baseURL` untuk kompatibilitas dengan contoh bergaya SDK OpenAI, tetapi konfigurasi baru sebaiknya menggunakan `baseUrl`.

## Aturan auth

<AccordionGroup>
  <Accordion title="Host lokal dan LAN">
    Host Ollama lokal dan LAN tidak memerlukan token bearer sungguhan. OpenClaw menggunakan penanda lokal `ollama-local` hanya untuk loopback, jaringan privat, `.local`, dan URL dasar Ollama dengan nama host polos.
  </Accordion>
  <Accordion title="Host jarak jauh dan Ollama Cloud">
    Host publik jarak jauh dan Ollama Cloud (`https://ollama.com`) memerlukan kredensial sungguhan melalui `OLLAMA_API_KEY`, profil auth, atau `apiKey` milik penyedia. Untuk penggunaan terhosting langsung, utamakan penyedia `ollama-cloud`.
  </Accordion>
  <Accordion title="Id penyedia kustom">
    Id penyedia kustom yang menetapkan `api: "ollama"` mengikuti aturan yang sama. Misalnya, penyedia `ollama-remote` yang mengarah ke host Ollama LAN privat dapat menggunakan `apiKey: "ollama-local"` dan sub-agen akan menyelesaikan penanda itu melalui hook penyedia Ollama alih-alih memperlakukannya sebagai kredensial yang hilang. Pencarian memori juga dapat menetapkan `agents.defaults.memorySearch.provider` ke id penyedia kustom tersebut agar embedding menggunakan endpoint Ollama yang sesuai.
  </Accordion>
  <Accordion title="Profil auth">
    `auth-profiles.json` menyimpan kredensial untuk id penyedia. Letakkan pengaturan endpoint (`baseUrl`, `api`, id model, header, timeout) di `models.providers.<id>`. File profil auth datar lama seperti `{ "ollama-windows": { "apiKey": "ollama-local" } }` bukan format runtime; jalankan `openclaw doctor --fix` untuk menulis ulangnya menjadi profil kunci API kanonis `ollama-windows:default` dengan cadangan. `baseUrl` dalam file tersebut adalah gangguan kompatibilitas dan harus dipindahkan ke konfigurasi penyedia.
  </Accordion>
  <Accordion title="Cakupan embedding memori">
    Ketika Ollama digunakan untuk embedding memori, auth bearer dicakupkan ke host tempat ia dideklarasikan:

    - Kunci tingkat penyedia hanya dikirim ke host Ollama milik penyedia tersebut.
    - `agents.*.memorySearch.remote.apiKey` hanya dikirim ke host embedding jarak jauhnya.
    - Nilai env `OLLAMA_API_KEY` murni diperlakukan sebagai konvensi Ollama Cloud, tidak dikirim ke host lokal atau self-hosted secara default.

  </Accordion>
</AccordionGroup>

## Memulai

Pilih metode dan mode penyiapan yang Anda inginkan.

<Tabs>
  <Tab title="Onboarding (direkomendasikan)">
    **Terbaik untuk:** jalur tercepat ke penyiapan cloud atau lokal Ollama yang berfungsi.

    <Steps>
      <Step title="Jalankan onboarding">
        ```bash
        openclaw onboard
        ```

        Pilih **Ollama** dari daftar penyedia.
      </Step>
      <Step title="Pilih mode Anda">
        - **Cloud + Lokal** — host Ollama lokal plus model cloud yang dirutekan melalui host tersebut
        - **Cloud saja** — model Ollama terhosting melalui `https://ollama.com`
        - **Lokal saja** — hanya model lokal

      </Step>
      <Step title="Pilih model">
        `Cloud only` meminta `OLLAMA_API_KEY` dan menyarankan default cloud terhosting. `Cloud + Local` dan `Local only` meminta URL dasar Ollama, menemukan model yang tersedia, dan menarik otomatis model lokal yang dipilih jika belum tersedia. Ketika Ollama melaporkan tag `:latest` yang terpasang seperti `gemma4:latest`, penyiapan menampilkan model terpasang itu sekali alih-alih menampilkan `gemma4` dan `gemma4:latest` atau menarik alias polos lagi. `Cloud + Local` juga memeriksa apakah host Ollama tersebut sudah masuk untuk akses cloud.
      </Step>
      <Step title="Verifikasi model tersedia">
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

  <Tab title="Penyiapan manual">
    **Terbaik untuk:** kontrol penuh atas penyiapan cloud atau lokal.

    <Steps>
      <Step title="Pilih cloud atau lokal">
        - **Cloud + Lokal**: pasang Ollama, masuk dengan `ollama signin`, dan rutekan permintaan cloud melalui host tersebut
        - **Cloud saja**: gunakan `https://ollama.com` dengan `OLLAMA_API_KEY`
        - **Lokal saja**: pasang Ollama dari [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Tarik model lokal (lokal saja)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Aktifkan Ollama untuk OpenClaw">
        Untuk `Cloud only`, gunakan `OLLAMA_API_KEY` Anda yang sungguhan. Untuk penyiapan berbasis host, nilai placeholder apa pun berfungsi:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Periksa dan tetapkan model Anda">
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
  <Tab title="Cloud + Lokal">
    `Cloud + Local` menggunakan host Ollama yang dapat dijangkau sebagai titik kontrol untuk model lokal dan cloud. Ini adalah alur hibrida pilihan Ollama.

    Gunakan **Cloud + Lokal** selama penyiapan. OpenClaw meminta URL dasar Ollama, menemukan model lokal dari host tersebut, dan memeriksa apakah host sudah masuk untuk akses cloud dengan `ollama signin`. Ketika host sudah masuk, OpenClaw juga menyarankan default cloud terhosting seperti `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, dan `glm-5.1:cloud`.

    Jika host belum masuk, OpenClaw mempertahankan penyiapan lokal saja sampai Anda menjalankan `ollama signin`.

  </Tab>

  <Tab title="Cloud saja">
    `Cloud only` berjalan terhadap API terhosting Ollama di `https://ollama.com`.

    Gunakan **Cloud saja** selama penyiapan. OpenClaw meminta `OLLAMA_API_KEY`, menetapkan `baseUrl: "https://ollama.com"`, dan mengisi daftar model cloud terhosting. Jalur ini **tidak** memerlukan server Ollama lokal atau `ollama signin`.

    Daftar model cloud yang ditampilkan selama `openclaw onboard` diisi secara langsung dari `https://ollama.com/api/tags`, dibatasi hingga 500 entri, sehingga pemilih mencerminkan katalog terhosting saat ini, bukan seed statis. Jika `ollama.com` tidak dapat dijangkau atau tidak mengembalikan model pada waktu penyiapan, OpenClaw kembali ke saran hardcoded sebelumnya sehingga onboarding tetap selesai.

    Anda juga dapat mengonfigurasi penyedia cloud kelas utama secara langsung:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Lokal saja">
    Dalam mode lokal saja, OpenClaw menemukan model dari instans Ollama yang dikonfigurasi. Jalur ini untuk server Ollama lokal atau self-hosted.

    OpenClaw saat ini menyarankan `gemma4` sebagai default lokal.

  </Tab>
</Tabs>

## Penemuan model (penyedia implisit)

Ketika Anda menetapkan `OLLAMA_API_KEY` (atau profil auth) dan **tidak** mendefinisikan `models.providers.ollama` atau penyedia jarak jauh kustom lain dengan `api: "ollama"`, OpenClaw menemukan model dari instans Ollama lokal di `http://127.0.0.1:11434`.

| Perilaku             | Detail                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kueri katalog        | Mengueri `/api/tags`                                                                                                                                                 |
| Deteksi kapabilitas | Menggunakan lookup best-effort `/api/show` untuk membaca `contextWindow`, parameter Modelfile `num_ctx` yang diperluas, dan kapabilitas termasuk vision/tools        |
| Model vision         | Model dengan kapabilitas `vision` yang dilaporkan oleh `/api/show` ditandai sebagai mampu gambar (`input: ["text", "image"]`), sehingga OpenClaw menyuntikkan gambar otomatis ke prompt |
| Deteksi penalaran   | Menggunakan kapabilitas `/api/show` jika tersedia, termasuk `thinking`; fallback ke heuristik nama model (`r1`, `reasoning`, `think`) ketika Ollama menghilangkan kapabilitas |
| Batas token          | Menetapkan `maxTokens` ke batas token maksimum default Ollama yang digunakan oleh OpenClaw                                                                           |
| Biaya                | Menetapkan semua biaya ke `0`                                                                                                                                        |

Ini menghindari entri model manual sembari menjaga katalog tetap selaras dengan instans Ollama lokal. Anda dapat menggunakan ref lengkap seperti `ollama/<pulled-model>:latest` di `infer model run` lokal; OpenClaw menyelesaikan model terpasang itu dari katalog langsung Ollama tanpa memerlukan entri `models.json` yang ditulis tangan.

Untuk host Ollama yang sudah masuk, beberapa model `:cloud` dapat digunakan melalui `/api/chat`
dan `/api/show` sebelum muncul di `/api/tags`. Ketika Anda secara eksplisit memilih ref
lengkap `ollama/<model>:cloud`, OpenClaw memvalidasi model yang hilang persis itu dengan
`/api/show` dan menambahkannya ke katalog runtime hanya jika Ollama mengonfirmasi
metadata model. Salah ketik tetap gagal sebagai model tidak dikenal alih-alih dibuat otomatis.

```bash
# See what models are available
ollama list
openclaw models list
```

Untuk uji smoke pembuatan teks sempit yang menghindari seluruh permukaan tool agen,
gunakan `infer model run` lokal dengan ref model Ollama lengkap:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Jalur itu tetap menggunakan penyedia, auth, dan transport native Ollama
yang dikonfigurasi OpenClaw, tetapi tidak memulai giliran agen chat atau memuat konteks MCP/tool. Jika
ini berhasil sementara balasan agen normal gagal, selidiki kapasitas prompt/tool agen
model berikutnya.

Untuk uji smoke model vision yang sempit pada jalur ramping yang sama, tambahkan satu atau beberapa
file gambar ke `infer model run`. Ini mengirim prompt dan gambar langsung ke
model vision Ollama yang dipilih tanpa memuat tool chat, memori, atau konteks
sesi sebelumnya:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` menerima file yang terdeteksi sebagai `image/*`, termasuk input PNG,
JPEG, dan WebP umum. File non-gambar ditolak sebelum Ollama dipanggil.
Untuk pengenalan ucapan, gunakan `openclaw infer audio transcribe` sebagai gantinya.

Saat Anda mengalihkan percakapan dengan `/model ollama/<model>`, OpenClaw memperlakukannya
sebagai pilihan pengguna yang persis. Jika `baseUrl` Ollama yang dikonfigurasi tidak dapat
dijangkau, balasan berikutnya gagal dengan galat penyedia alih-alih diam-diam
menjawab dari model fallback lain yang dikonfigurasi.

Pekerjaan cron terisolasi menjalankan satu pemeriksaan keamanan lokal tambahan sebelum memulai giliran agen.
Jika model yang dipilih terselesaikan ke penyedia Ollama lokal, jaringan privat, atau `.local`
dan `/api/tags` tidak dapat dijangkau, OpenClaw mencatat run cron tersebut
sebagai `skipped` dengan `ollama/<model>` yang dipilih dalam teks galat. Preflight endpoint
di-cache selama 5 menit, sehingga beberapa pekerjaan cron yang diarahkan ke daemon Ollama
yang sama-sama berhenti tidak semuanya meluncurkan permintaan model yang gagal.

Verifikasi langsung jalur teks lokal, jalur stream native, dan embeddings terhadap
Ollama lokal dengan:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Untuk smoke test kunci API Ollama Cloud, arahkan pengujian langsung ke `https://ollama.com`
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

Smoke cloud menjalankan teks, stream native, dan pencarian web. Secara default, embeddings
dilewati untuk `https://ollama.com` karena kunci API Ollama Cloud mungkin tidak mengotorisasi
`/api/embed`. Atur `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` saat Anda secara eksplisit ingin
pengujian langsung gagal jika kunci cloud yang dikonfigurasi tidak dapat menggunakan endpoint embed.

Untuk menambahkan model baru, cukup pull model tersebut dengan Ollama:

```bash
ollama pull mistral
```

Model baru akan otomatis ditemukan dan tersedia untuk digunakan.

<Note>
Jika Anda mengatur `models.providers.ollama` secara eksplisit, atau mengonfigurasi penyedia jarak jauh khusus seperti `models.providers.ollama-cloud` dengan `api: "ollama"`, penemuan otomatis dilewati dan Anda harus mendefinisikan model secara manual. Penyedia khusus loopback seperti `http://127.0.0.2:11434` tetap diperlakukan sebagai lokal. Lihat bagian konfigurasi eksplisit di bawah.
</Note>

## Inferensi lokal Node

Agen dapat mendelegasikan tugas singkat ke model Ollama yang terpasang pada node
desktop atau server yang dipasangkan. Prompt dan respons melintasi koneksi
Gateway/node terautentikasi yang sudah ada; permintaan model berjalan pada node yang dipilih terhadap
endpoint Ollama loopback standarnya (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Start Ollama on the node">
    Pull setidaknya satu model chat dan biarkan Ollama tetap berjalan:

    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```

  </Step>
  <Step title="Connect the node host">
    Pada mesin yang sama dengan Ollama, hubungkan host node ke Gateway:

    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Setujui perangkat baru dan perintah node yang dideklarasikannya pada host Gateway,
    lalu verifikasi node:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Koneksi pertama dan upgrade yang menambahkan perintah Ollama sama-sama dapat
    memicu persetujuan perintah node. Jika node terhubung tanpa mengiklankan
    `ollama.models` dan `ollama.chat`, periksa `openclaw nodes pending` lagi.

  </Step>
  <Step title="Ask an agent to use local inference">
    Plugin Ollama bawaan mengekspos tool `node_inference`. Agen terlebih dahulu
    menggunakan `action: "discover"`, lalu `action: "run"` dengan node dan
    model yang dikembalikan. Jika tepat satu node yang mampu terhubung, `run` dapat menghilangkan node.

    Misalnya: “Temukan model Ollama pada node saya, lalu gunakan model termuat
    tercepat untuk merangkum teks ini.”

  </Step>
</Steps>

Penemuan membaca `/api/tags`, memeriksa kapabilitas `/api/show`, dan menggunakan `/api/ps`
saat tersedia untuk memberi peringkat model yang sudah termuat terlebih dahulu. Ini hanya mengembalikan
model lokal yang mampu chat: baris Ollama Cloud dan model khusus embedding dikecualikan.
Setiap run meminta Ollama menonaktifkan thinking model dan membatasi output pada 512 token
kecuali pemanggilan tool meminta nilai `maxTokens` yang berbeda. Beberapa model, seperti
GPT-OSS, tidak mendukung penonaktifan thinking dan mungkin tetap menggunakan token penalaran.

Untuk membiarkan Ollama tetap berjalan pada node tanpa membuatnya tersedia bagi agen, atur
hal berikut dalam konfigurasi yang digunakan oleh host node tersebut:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Jika node menggunakan perintah foreground `openclaw node run` dari pengaturan
di atas, hentikan proses tersebut dan jalankan perintahnya lagi. Jika menggunakan layanan node
terpasang, jalankan `openclaw node restart`.

Node berhenti mengiklankan `ollama.models` dan `ollama.chat`; Ollama sendiri dan
penyedia Ollama milik Gateway tetap tidak berubah. Atur nilainya ke `true` dan
mulai ulang node untuk mengiklankan inferensi lokal lagi. Permukaan perintah yang berubah
mungkin memerlukan persetujuan melalui `openclaw nodes pending` setelah tersambung ulang.

Anda dapat memverifikasi perintah node yang sama tanpa giliran agen:

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

Inferensi lokal node sengaja tidak menggunakan kembali
`models.providers.ollama.baseUrl` jarak jauh atau cloud. Jalankan Ollama pada endpoint
loopback standar node. Perintah node tersedia secara default pada host node macOS, Linux, dan
Windows serta tetap tunduk pada kebijakan pairing node dan perintah normal.

## Vision dan deskripsi gambar

Plugin Ollama bawaan mendaftarkan Ollama sebagai penyedia pemahaman media yang mampu menangani gambar. Ini memungkinkan OpenClaw merutekan permintaan deskripsi gambar eksplisit dan default model gambar yang dikonfigurasi melalui model vision Ollama lokal atau hosted.

Untuk vision lokal, pull model yang mendukung gambar:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Lalu verifikasi dengan CLI infer:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` harus berupa ref `<provider/model>` lengkap. Saat diatur, `openclaw infer image describe` mencoba model tersebut terlebih dahulu alih-alih melewati deskripsi karena model mendukung vision native. Jika pemanggilan model gagal, OpenClaw dapat melanjutkan melalui `agents.defaults.imageModel.fallbacks` yang dikonfigurasi; galat persiapan file atau URL tetap gagal sebelum percobaan fallback.

Gunakan `infer image describe` saat Anda menginginkan alur penyedia pemahaman gambar OpenClaw, `agents.defaults.imageModel` yang dikonfigurasi, dan bentuk output deskripsi gambar. Gunakan `infer model run --file` saat Anda menginginkan probe model multimodal mentah dengan prompt khusus dan satu atau beberapa gambar.

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

Utamakan ref lengkap `ollama/<model>`. Jika model yang sama tercantum di bawah `models.providers.ollama.models` dengan `input: ["text", "image"]` dan tidak ada penyedia gambar lain yang dikonfigurasi mengekspos ID model bare tersebut, OpenClaw juga menormalkan ref `imageModel` bare seperti `qwen2.5vl:7b` menjadi `ollama/qwen2.5vl:7b`. Jika lebih dari satu penyedia gambar yang dikonfigurasi memiliki ID bare yang sama, gunakan prefiks penyedia secara eksplisit.

Model vision lokal yang lambat mungkin memerlukan timeout pemahaman gambar yang lebih panjang daripada model cloud. Model tersebut juga dapat crash atau berhenti saat Ollama mencoba mengalokasikan konteks vision penuh yang diiklankan pada perangkat keras terbatas. Atur timeout kapabilitas, dan batasi `num_ctx` pada entri model saat Anda hanya memerlukan giliran deskripsi gambar normal:

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

Timeout ini berlaku untuk pemahaman gambar masuk dan untuk tool `image` eksplisit yang dapat dipanggil agen selama giliran. `models.providers.ollama.timeoutSeconds` tingkat penyedia tetap mengontrol guard permintaan HTTP Ollama yang mendasarinya untuk pemanggilan model normal.

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

OpenClaw menolak permintaan deskripsi gambar untuk model yang tidak ditandai mampu gambar. Dengan penemuan implisit, OpenClaw membaca ini dari Ollama saat `/api/show` melaporkan kapabilitas vision.

## Konfigurasi

<Tabs>
  <Tab title="Basic (implicit discovery)">
    Jalur pengaktifan paling sederhana untuk lokal saja adalah melalui variabel lingkungan:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Jika `OLLAMA_API_KEY` diatur, Anda dapat menghilangkan `apiKey` dalam entri penyedia dan OpenClaw akan mengisinya untuk pemeriksaan ketersediaan.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Gunakan konfigurasi eksplisit saat Anda menginginkan pengaturan cloud hosted, Ollama berjalan pada host/port lain, Anda ingin memaksa jendela konteks atau daftar model tertentu, atau Anda menginginkan definisi model sepenuhnya manual.

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
  <Accordion title="Model lokal dengan penemuan otomatis">
    Gunakan ini ketika Ollama berjalan pada mesin yang sama dengan Gateway dan Anda ingin OpenClaw menemukan model yang terpasang secara otomatis.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Jalur ini menjaga konfigurasi tetap minimal. Jangan tambahkan blok `models.providers.ollama` kecuali Anda ingin mendefinisikan model secara manual.

  </Accordion>

  <Accordion title="Host Ollama LAN dengan model manual">
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

    `contextWindow` adalah anggaran konteks di sisi OpenClaw. `params.num_ctx` dikirim ke Ollama untuk permintaan. Jaga keduanya tetap selaras ketika perangkat keras Anda tidak dapat menjalankan konteks penuh yang diiklankan model.

  </Accordion>

  <Accordion title="Hanya Ollama Cloud">
    Gunakan ini ketika Anda tidak menjalankan daemon lokal dan ingin model Ollama terhosting secara langsung.

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

  <Accordion title="Cloud plus lokal melalui daemon yang sudah masuk">
    Gunakan ini ketika daemon Ollama lokal atau LAN sudah masuk dengan `ollama signin` dan harus melayani model lokal serta model `:cloud`.

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
    Gunakan ID provider khusus ketika Anda memiliki lebih dari satu server Ollama. Setiap provider mendapatkan host, model, autentikasi, batas waktu, dan referensi modelnya sendiri.

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

    Ketika OpenClaw mengirim permintaan, prefiks provider aktif dihapus sehingga `ollama-large/qwen3.5:27b` sampai ke Ollama sebagai `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Profil model lokal ramping">
    Beberapa model lokal dapat menjawab prompt sederhana tetapi kesulitan dengan seluruh permukaan alat agent. Mulailah dengan membatasi alat dan konteks sebelum mengubah pengaturan runtime global.

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

    Gunakan `compat.supportsTools: false` hanya ketika model atau server secara andal gagal pada skema alat. Ini menukar kemampuan agent dengan stabilitas.
    `localModelLean` menghapus browser, cron, dan alat pesan dari permukaan agent langsung serta secara default menempatkan katalog yang lebih besar di balik kontrol Tool Search terstruktur kecuali ketika sebuah run harus mempertahankan semantik pengiriman pesan langsung, tetapi tidak mengubah konteks runtime atau mode berpikir Ollama. Pasangkan dengan `params.num_ctx` eksplisit dan `params.thinking: false` untuk model berpikir kecil bergaya Qwen yang berulang atau menghabiskan anggaran responsnya pada penalaran tersembunyi.

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

ID provider Ollama khusus juga didukung. Ketika referensi model menggunakan prefiks
provider aktif, seperti `ollama-spark/qwen3:32b`, OpenClaw hanya menghapus
prefiks tersebut sebelum memanggil Ollama sehingga server menerima `qwen3:32b`.

Untuk model lokal yang lambat, utamakan penyetelan permintaan dalam cakupan provider sebelum menaikkan
batas waktu runtime seluruh agent:

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
header, streaming body, dan total pembatalan guarded-fetch. `params.keep_alive`
diteruskan ke Ollama sebagai `keep_alive` tingkat atas pada permintaan `/api/chat` native;
tetapkan per model ketika waktu pemuatan giliran pertama menjadi hambatan.

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

Untuk host jarak jauh, ganti `127.0.0.1` dengan host yang digunakan di `baseUrl`. Jika `curl` berfungsi tetapi OpenClaw tidak, periksa apakah Gateway berjalan pada mesin, kontainer, atau akun layanan yang berbeda.

## Ollama Web Search

OpenClaw mendukung **Ollama Web Search** sebagai provider `web_search` bawaan.

| Properti    | Detail                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | Menggunakan host Ollama yang Anda konfigurasi (`models.providers.ollama.baseUrl` jika ditetapkan, jika tidak `http://127.0.0.1:11434`); `https://ollama.com` menggunakan API terhosting secara langsung |
| Autentikasi | Tanpa kunci untuk host Ollama lokal yang sudah masuk; `OLLAMA_API_KEY` atau autentikasi provider yang dikonfigurasi untuk pencarian langsung `https://ollama.com` atau host yang dilindungi autentikasi |
| Persyaratan | Host lokal/self-hosted harus berjalan dan masuk dengan `ollama signin`; pencarian terhosting langsung memerlukan `baseUrl: "https://ollama.com"` plus kunci API Ollama nyata |

Pilih **Ollama Web Search** selama `openclaw onboard` atau `openclaw configure --section web`, atau tetapkan:

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

Untuk pencarian terhosting langsung melalui Ollama Cloud:

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

Untuk daemon lokal yang sudah masuk, OpenClaw menggunakan proxy `/api/experimental/web_search` milik daemon. Untuk `https://ollama.com`, OpenClaw memanggil endpoint terhosting `/api/web_search` secara langsung.

<Note>
Untuk penyiapan lengkap dan detail perilaku, lihat [Ollama Web Search](/id/tools/ollama-search).
</Note>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Mode kompatibel OpenAI lama">
    <Warning>
    **Pemanggilan alat tidak andal dalam mode kompatibel OpenAI.** Gunakan mode ini hanya jika Anda memerlukan format OpenAI untuk proxy dan tidak bergantung pada perilaku pemanggilan alat native.
    </Warning>

    Jika Anda perlu menggunakan endpoint kompatibel OpenAI sebagai gantinya (misalnya, di belakang proxy yang hanya mendukung format OpenAI), tetapkan `api: "openai-completions"` secara eksplisit:

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

    Ketika `api: "openai-completions"` digunakan dengan Ollama, OpenClaw menyuntikkan `options.num_ctx` secara default sehingga Ollama tidak diam-diam kembali ke jendela konteks 4096. Jika proxy/upstream Anda menolak field `options` yang tidak dikenal, nonaktifkan perilaku ini:

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

    Anda dapat menetapkan default `contextWindow`, `contextTokens`, dan `maxTokens` tingkat penyedia untuk setiap model di bawah penyedia Ollama tersebut, lalu menimpanya per model saat diperlukan. `contextWindow` adalah anggaran prompt dan Compaction OpenClaw. Permintaan Ollama native membiarkan `options.num_ctx` tidak disetel kecuali Anda secara eksplisit mengonfigurasi `params.num_ctx`, sehingga Ollama dapat menerapkan default model, `OLLAMA_CONTEXT_LENGTH`, atau berbasis VRAM miliknya sendiri. Untuk membatasi atau memaksa konteks runtime per permintaan Ollama tanpa membangun ulang Modelfile, setel `params.num_ctx`; nilai tidak valid, nol, negatif, dan non-finite diabaikan. Jika Anda memutakhirkan konfigurasi lama yang hanya menggunakan `contextWindow` atau `maxTokens` untuk memaksa konteks permintaan Ollama native, jalankan `openclaw doctor --fix` untuk menyalin anggaran penyedia atau model eksplisit tersebut ke `params.num_ctx`. Adapter Ollama kompatibel OpenAI tetap menyuntikkan `options.num_ctx` secara default dari `params.num_ctx` atau `contextWindow` yang dikonfigurasi; nonaktifkan dengan `injectNumCtxForOpenAICompat: false` jika upstream Anda menolak `options`.

    Entri model Ollama native juga menerima opsi runtime Ollama umum di bawah `params`, termasuk `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread`, dan `use_mmap`. OpenClaw hanya meneruskan kunci permintaan Ollama, sehingga parameter runtime OpenClaw seperti `streaming` tidak dibocorkan ke Ollama. Gunakan `params.think` atau `params.thinking` untuk mengirim `think` Ollama tingkat atas; `false` menonaktifkan thinking tingkat API untuk model thinking bergaya Qwen.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` per model juga berfungsi. Jika keduanya dikonfigurasi, entri model penyedia eksplisit menang atas default agent.

  </Accordion>

  <Accordion title="Kontrol thinking">
    Untuk model Ollama native, OpenClaw meneruskan kontrol thinking sebagaimana diharapkan Ollama: `think` tingkat atas, bukan `options.think`. Model yang ditemukan otomatis dengan respons `/api/show` yang menyertakan kapabilitas `thinking` mengekspos `/think low`, `/think medium`, `/think high`, dan `/think max`; model non-thinking hanya mengekspos `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Anda juga dapat menetapkan default model:

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

    `params.think` atau `params.thinking` per model dapat menonaktifkan atau memaksa thinking API Ollama untuk model terkonfigurasi tertentu. OpenClaw mempertahankan parameter model eksplisit tersebut saat run aktif hanya memiliki default implisit `off`; perintah runtime selain off seperti `/think medium` tetap menimpa run aktif.

  </Accordion>

  <Accordion title="Model reasoning">
    OpenClaw memperlakukan model dengan nama seperti `deepseek-r1`, `reasoning`, atau `think` sebagai berkapabilitas reasoning secara default.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Tidak diperlukan konfigurasi tambahan. OpenClaw menandainya secara otomatis.

  </Accordion>

  <Accordion title="Biaya model">
    Ollama gratis dan berjalan secara lokal, sehingga semua biaya model disetel ke $0. Ini berlaku untuk model yang ditemukan otomatis maupun yang didefinisikan secara manual.
  </Accordion>

  <Accordion title="Embedding memori">
    Plugin Ollama bawaan mendaftarkan penyedia embedding memori untuk
    [pencarian memori](/id/concepts/memory). Plugin ini menggunakan URL dasar Ollama
    dan kunci API yang dikonfigurasi, memanggil endpoint `/api/embed` Ollama saat ini, dan melakukan batch
    beberapa potongan memori ke dalam satu permintaan `input` jika memungkinkan.

    Saat `proxy.enabled=true`, permintaan embedding memori Ollama ke origin
    local loopback host yang tepat yang diturunkan dari `baseUrl` yang dikonfigurasi menggunakan
    jalur langsung terlindungi OpenClaw alih-alih proxy terusan terkelola. Nama host
    yang dikonfigurasi itu sendiri harus berupa `localhost` atau literal IP loopback;
    nama DNS yang hanya resolve ke loopback tetap menggunakan jalur proxy terkelola.
    Host Ollama LAN, tailnet, jaringan privat, dan publik juga tetap berada di
    jalur proxy terkelola. Redirect ke host atau port lain tidak mewarisi kepercayaan.
    Operator masih dapat menetapkan pengaturan global `proxy.loopbackMode: "proxy"` untuk
    mengirim traffic loopback melalui proxy, atau `proxy.loopbackMode: "block"`
    untuk menolak koneksi loopback sebelum membuka koneksi; lihat
    [Proxy terkelola](/id/security/network-proxy#gateway-loopback-mode) untuk
    dampak seluruh proses dari pengaturan ini.

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

    Untuk host embedding jarak jauh, pertahankan auth terbatas pada host tersebut:

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
    Integrasi Ollama OpenClaw menggunakan **API Ollama native** (`/api/chat`) secara default, yang sepenuhnya mendukung streaming dan tool calling secara bersamaan. Tidak diperlukan konfigurasi khusus.

    Untuk permintaan `/api/chat` native, OpenClaw juga meneruskan kontrol thinking langsung ke Ollama: `/think off` dan `openclaw agent --thinking off` mengirim `think: false` tingkat atas kecuali nilai model eksplisit `params.think`/`params.thinking` dikonfigurasi, sementara `/think low|medium|high` mengirim string effort `think` tingkat atas yang sesuai. `/think max` dipetakan ke effort native tertinggi Ollama, `think: "high"`.

    <Tip>
    Jika Anda perlu menggunakan endpoint kompatibel OpenAI, lihat bagian "Mode kompatibel OpenAI lama" di atas. Streaming dan tool calling mungkin tidak berfungsi secara bersamaan dalam mode tersebut.
    </Tip>

  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Loop crash WSL2 (reboot berulang)">
    Pada WSL2 dengan NVIDIA/CUDA, installer Linux resmi Ollama membuat unit systemd `ollama.service` dengan `Restart=always`. Jika layanan tersebut autostart dan memuat model berbasis GPU saat boot WSL2, Ollama dapat menahan memori host saat model dimuat. Reklaim memori Hyper-V tidak selalu dapat mereklaim halaman yang tertahan tersebut, sehingga Windows dapat menghentikan VM WSL2, systemd memulai Ollama lagi, dan loop berulang.

    Bukti umum:

    - reboot atau penghentian WSL2 berulang dari sisi Windows
    - CPU tinggi di `app.slice` atau `ollama.service` sesaat setelah startup WSL2
    - SIGTERM dari systemd, bukan peristiwa OOM-killer Linux

    OpenClaw mencatat peringatan startup saat mendeteksi WSL2, `ollama.service` diaktifkan dengan `Restart=always`, dan penanda CUDA terlihat.

    Mitigasi:

    ```bash
    sudo systemctl disable ollama
    ```

    Tambahkan ini ke `%USERPROFILE%\.wslconfig` di sisi Windows, lalu jalankan `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Setel keep-alive yang lebih pendek di lingkungan layanan Ollama, atau mulai Ollama secara manual hanya saat Anda membutuhkannya:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Lihat [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama tidak terdeteksi">
    Pastikan Ollama berjalan dan Anda menyetel `OLLAMA_API_KEY` (atau profil auth), dan Anda **tidak** mendefinisikan entri eksplisit `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Verifikasi bahwa API dapat diakses:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Tidak ada model yang tersedia">
    Jika model Anda tidak tercantum, tarik model secara lokal atau definisikan secara eksplisit di `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Koneksi ditolak">
    Periksa bahwa Ollama berjalan pada port yang benar:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Host jarak jauh berfungsi dengan curl tetapi tidak dengan OpenClaw">
    Verifikasi dari mesin dan runtime yang sama yang menjalankan Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Penyebab umum:

    - `baseUrl` menunjuk ke `localhost`, tetapi Gateway berjalan di Docker atau pada host lain.
    - URL menggunakan `/v1`, yang memilih perilaku kompatibel OpenAI alih-alih Ollama native.
    - Host jarak jauh memerlukan perubahan firewall atau binding LAN di sisi Ollama.
    - Model ada di daemon laptop Anda tetapi tidak di daemon jarak jauh.

  </Accordion>

  <Accordion title="Model mengeluarkan JSON tool sebagai teks">
    Ini biasanya berarti penyedia menggunakan mode kompatibel OpenAI atau model tidak dapat menangani skema tool.

    Lebih disarankan mode Ollama native:

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

    Jika model lokal kecil masih gagal pada skema tool, setel `compat.supportsTools: false` pada entri model tersebut dan uji ulang.

  </Accordion>

  <Accordion title="Kimi atau GLM mengembalikan simbol kacau">
    Respons Kimi/GLM hosted yang panjang dan berupa rangkaian simbol non-linguistik diperlakukan sebagai output penyedia yang gagal, bukan jawaban asisten yang berhasil. Ini memungkinkan retry, fallback, atau penanganan error normal mengambil alih tanpa menyimpan teks rusak ke dalam sesi.

    Jika terjadi berulang kali, tangkap nama model mentah, file sesi saat ini, dan apakah run menggunakan `Cloud + Local` atau `Cloud only`, lalu coba sesi baru dan model fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Model lokal dingin mengalami timeout">
    Model lokal besar dapat membutuhkan pemuatan pertama yang lama sebelum streaming dimulai. Pertahankan timeout terbatas pada penyedia Ollama, dan secara opsional minta Ollama mempertahankan model tetap dimuat antar turn:

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

    Jika host itu sendiri lambat menerima koneksi, `timeoutSeconds` juga memperpanjang batas waktu koneksi Undici yang dijaga untuk penyedia ini.

  </Accordion>

  <Accordion title="Model konteks besar terlalu lambat atau kehabisan memori">
    Banyak model Ollama mengiklankan konteks yang lebih besar daripada yang dapat dijalankan perangkat keras Anda dengan nyaman. Ollama native menggunakan default konteks runtime Ollama sendiri kecuali Anda mengatur `params.num_ctx`. Batasi anggaran OpenClaw dan konteks permintaan Ollama ketika Anda menginginkan latensi token pertama yang dapat diprediksi:

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

    Turunkan `contextWindow` terlebih dahulu jika OpenClaw mengirim prompt terlalu banyak. Turunkan `params.num_ctx` jika Ollama memuat konteks runtime yang terlalu besar untuk mesin. Turunkan `maxTokens` jika pembuatan berjalan terlalu lama.

  </Accordion>
</AccordionGroup>

<Note>
Bantuan lebih lanjut: [Pemecahan masalah](/id/help/troubleshooting) dan [FAQ](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Penyedia model" href="/id/concepts/model-providers" icon="layers">
    Ikhtisar semua penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Pemilihan model" href="/id/concepts/models" icon="brain">
    Cara memilih dan mengonfigurasi model.
  </Card>
  <Card title="Ollama Web Search" href="/id/tools/ollama-search" icon="magnifying-glass">
    Penyiapan lengkap dan detail perilaku untuk pencarian web yang didukung Ollama.
  </Card>
  <Card title="Konfigurasi" href="/id/gateway/configuration" icon="gear">
    Referensi konfigurasi lengkap.
  </Card>
</CardGroup>
