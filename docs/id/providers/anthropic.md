---
read_when:
    - Anda ingin menggunakan model Anthropic di OpenClaw
    - Anda ingin menelusuri sesi Claude CLI atau Claude Desktop di seluruh komputer yang dipasangkan
summary: Gunakan Anthropic Claude melalui kunci API atau Claude CLI di OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-16T18:31:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a61b4585092586727df48f7b809be73d80b0a9f1400294e76aea1b48313a216
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic membangun keluarga model **Claude**. OpenClaw mendukung dua jalur autentikasi:

- **Kunci API** - akses langsung ke API Anthropic dengan penagihan berdasarkan penggunaan (model `anthropic/*`)
- **Claude CLI** - gunakan kembali login Claude Code yang sudah ada pada host yang sama

## Pelacakan penggunaan dan biaya

OpenClaw mendeteksi kredensial Anthropic yang tersedia dan memilih tampilan penggunaan yang sesuai:

- Kredensial langganan/penyiapan Claude menampilkan periode kuota dan anggaran penggunaan tambahan opsional.
- `ANTHROPIC_ADMIN_KEY` atau `ANTHROPIC_ADMIN_API_KEY` menampilkan biaya organisasi yang dilaporkan penyedia dan penggunaan Messages API selama 30 hari di **Penggunaan** pada Control UI, termasuk pengeluaran harian, total token/cache, model teratas, dan kategori biaya.
- Kredensial `sk-ant-admin...` yang disimpan dalam profil penyedia Anthropic secara otomatis terdeteksi sebagai kunci Admin API.

Riwayat biaya Admin API berasal dari [API Penggunaan dan Biaya](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) Anthropic. Ini merupakan tagihan penyedia yang sebenarnya, terpisah dari estimasi biaya OpenClaw yang diperoleh dari sesi.

<Warning>
Backend Claude CLI OpenClaw menjalankan Claude Code CLI yang terinstal dalam
mode cetak noninteraktif (`claude -p`). Dokumentasi Claude Code Anthropic saat ini
menjelaskan mode tersebut sebagai penggunaan Agent SDK/terprogram. Pembaruan dukungan Anthropic pada 15 Juni 2026
menangguhkan perubahan penagihan Agent SDK terpisah yang telah diumumkan: penggunaan Claude
Agent SDK, `claude -p`, dan aplikasi pihak ketiga masih menggunakan batas penggunaan
langganan yang digunakan untuk masuk, dan kredit bulanan Agent SDK yang sebelumnya diumumkan
tidak tersedia selama Anthropic merevisi rencana tersebut.

Claude Code interaktif tetap menggunakan batas paket Claude yang digunakan untuk masuk.
Autentikasi kunci API menggunakan penagihan bayar sesuai penggunaan secara langsung dan tidak bergantung pada paket tersebut.
Untuk host Gateway jangka panjang, otomatisasi bersama, dan pengeluaran produksi yang
dapat diprediksi, gunakan kunci API Anthropic.

Artikel dukungan Anthropic saat ini dapat mengubah perilaku ini tanpa
rilis OpenClaw:

- [Referensi Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Menggunakan Claude Agent SDK dengan paket Claude Anda](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Menggunakan Claude Code dengan paket Pro atau Max Anda](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Menggunakan Claude Code dengan paket Team atau Enterprise Anda](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Mengelola biaya Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Memulai

<Tabs>
  <Tab title="Kunci API">
    **Paling cocok untuk:** akses API standar dan penagihan berdasarkan penggunaan.

    <Steps>
      <Step title="Dapatkan kunci API Anda">
        Buat kunci API di [Konsol Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Jalankan orientasi awal">
        ```bash
        openclaw onboard
        # pilih: Kunci API Anthropic
        ```

        Atau teruskan kunci secara langsung:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Pastikan model tersedia">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Contoh konfigurasi

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Paling cocok untuk:** menggunakan kembali login Claude CLI yang sudah ada tanpa kunci API terpisah.

    <Steps>
      <Step title="Pastikan Claude CLI terinstal dan sudah masuk">
        Verifikasi dengan:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Jalankan orientasi awal">
        ```bash
        openclaw onboard
        # pilih: Claude CLI
        ```

        OpenClaw mendeteksi dan menggunakan kembali kredensial Claude CLI yang sudah ada.
      </Step>
      <Step title="Pastikan model tersedia">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Detail penyiapan dan runtime untuk backend Claude CLI tersedia di [Backend CLI](/id/gateway/cli-backends).
    </Note>

    <Warning>
    Penggunaan kembali Claude CLI mengharuskan proses OpenClaw berjalan pada host yang sama dengan
    login Claude CLI. Instalasi Docker dapat mempertahankan direktori home kontainer dan masuk ke
    Claude Code di sana; lihat
    [Backend Claude CLI di Docker](/id/install/docker#claude-cli-backend-in-docker).
    Instalasi kontainer lain seperti [Podman](/id/install/podman) tidak memasang
    `~/.claude` host ke dalam penyiapan atau runtime; gunakan kunci API Anthropic di sana, atau pilih
    penyedia dengan OAuth yang dikelola OpenClaw seperti
    [OpenAI Codex](/id/providers/openai).
    </Warning>

    ### Dapatkan token penyiapan

    Jalankan `claude setup-token` pada mesin apa pun yang telah menginstal Claude Code. Perintah tersebut mencetak
    token berumur panjang yang diawali dengan `sk-ant-oat01-`.

    Selama orientasi awal, tempelkan token di aplikasi macOS dengan memilih
    **Anthropic setup-token** di bawah **Connect with an API key or token**, atau gunakan:

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### Contoh konfigurasi

    Utamakan referensi model Anthropic kanonis ditambah penggantian runtime CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Referensi model `claude-cli/claude-opus-4-7` lama masih berfungsi untuk
    kompatibilitas, tetapi konfigurasi baru harus mempertahankan pemilihan penyedia/model sebagai
    `anthropic/*` dan menempatkan backend eksekusi dalam kebijakan runtime penyedia/model.

    ### Penagihan dan `claude -p`

    OpenClaw menggunakan jalur `claude -p` noninteraktif Claude Code untuk proses Claude CLI.
    Anthropic saat ini memperlakukan jalur tersebut sebagai penggunaan Agent SDK/terprogram:

    - Pembaruan dukungan Anthropic pada 15 Juni 2026 menangguhkan rencana kredit
      Agent SDK terpisah yang sebelumnya diumumkan.
    - Penggunaan Claude Agent SDK, `claude -p`, dan aplikasi pihak ketiga dalam paket langganan
      masih menggunakan batas penggunaan langganan yang digunakan untuk masuk.
    - Kredit bulanan Agent SDK yang sebelumnya diumumkan tidak tersedia selama
      Anthropic merevisi rencana tersebut.
    - Login Konsol/kunci API menggunakan penagihan API bayar sesuai penggunaan dan tidak menerima
      kredit Agent SDK langganan.

    Lihat [artikel paket Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    Anthropic untuk pemberitahuan penangguhan, dan artikel paket Claude Code untuk perilaku langganan
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    dan
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic dapat mengubah perilaku penagihan dan batas laju Claude Code tanpa
    rilis OpenClaw. Periksa `claude auth status`, `/status`, dan
    dokumentasi Anthropic yang ditautkan ketika kepastian penagihan penting.

    <Tip>
    Untuk otomatisasi produksi bersama, gunakan kunci API Anthropic sebagai pengganti
    Claude CLI. OpenClaw juga mendukung opsi bergaya langganan dari
    [OpenAI Codex](/id/providers/openai), [Qwen Cloud](/id/providers/qwen),
    [MiniMax](/id/providers/minimax), dan [Z.AI / GLM](/id/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Sesi Claude lintas komputer

Plugin Anthropic bawaan menambahkan grup **Claude Code** ke bilah samping sesi
normal. Baris dibuka di panel Obrolan normal. Plugin ini menemukan sesi Claude
Code yang tidak diarsipkan di Gateway dan host Node yang terhubung:

- Sesi Claude CLI berasal dari catatan indeks proyek yang valid dan file JSONL
  saat ini yang awalan metadata terbatasnya mengidentifikasi sesi `sdk-cli`
  non-sidechain di bawah `~/.claude/projects/`.
- Sesi Claude Desktop menggunakan judul Desktop, waktu aktivitas, dan
  status arsip ketika metadatanya mengarah ke ID sesi Claude Code yang sama.
- Sesi khusus CLI tidak memiliki penanda arsip, sehingga tetap terlihat selama
  transkripnya tersedia.

Tidak diperlukan konfigurasi OpenClaw tambahan untuk penemuan. Plugin Anthropic
disertakan dan diaktifkan secara default; Node macOS native mengiklankan perintah
sesi Claude hanya-baca ketika direktori lokal `~/.claude/projects/` tersedia.
Setujui peningkatan pemasangan Node ketika perintah tersebut pertama kali muncul.

Bilah samping mengelompokkan baris berdasarkan host Gateway atau Node terpasangnya, dimulai dengan
halaman terbatas terbaru dari setiap host, dan diperbarui mengikuti interval normal 30 detik.
Gunakan **Muat lebih banyak sesi** di bawah grup katalog untuk menambahkan halaman berikutnya
bagi setiap host yang memiliki riwayat tambahan; baris yang ditambahkan tetap terlihat dan
diambil ulang hingga kedalaman yang sama pada setiap pembaruan. Klien katalog menggunakan
`sessions.catalog.list`; membuka baris menggunakan `sessions.catalog.read`.

Pengambilalihan terminal me-resolve `claude` dari PATH shell login pengguna host pemilik
sebelum PATH layanan/daemon. Hal ini menjaga sesi yang diluncurkan aplikasi tetap selaras
dengan Claude CLI yang diperoleh operator di terminal normal.

Memilih baris akan membaca halaman transkrip terbaru terlebih dahulu. **Muat item transkrip
yang lebih lama** mengikuti kursor byte opak dan membaca bagian terbatas lainnya dari
file JSONL, alih-alih memuat seluruh riwayat. Konten normal dari pengguna, asisten,
penalaran, pemanggilan alat, dan hasil alat dipertahankan. Item individual yang
lebih besar daripada batas keamanan Node/Gateway ditandai dengan jelas sebagai terpotong.

Untuk baris `claude-cli` lokal Gateway, mengetik di komposer normal akan memanggil
`sessions.catalog.continue`. OpenClaw me-resolve ulang catatan katalog lokal,
membuat atau menggunakan kembali sesi native yang dikunci ke model, mengimpor maksimal 200 item
yang terlihat atau 512 KiB, dan menyiapkan binding Claude CLI. Giliran pertama dilanjutkan dengan
`--fork-session`; Claude menetapkan ID sesi baru kepada fork, sehingga giliran berikutnya menggunakan
fork tersebut dan sesi sumber tetap tidak tersentuh.

Host Node headless juga dapat membuat baris Claude CLI-nya dapat dilanjutkan dengan mengaktifkan
pengaturan lokal Node berikut dan memulai ulang host Node:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Node mengiklankan `agent.cli.claude.run.v1` hanya ketika pengaturan tersebut diaktifkan
dan executable lokal `claude` dapat ditemukan. OpenClaw me-resolve ulang catatan katalog
pada Node tersebut, mengimpor riwayat terbatas yang sama, dan mengikat sesi yang diadopsi
ke Node dan direktori kerja yang dilaporkan katalog. Setiap giliran menjalankan
proses `claude -p` asli milik Node menggunakan file Claude dan login Node tersebut.
Kebijakan persetujuan eksekusi Node tetap berlaku; Gateway tidak dapat memaksakan keikutsertaan.

Pelanjutan Node v1 hanya sekali jalan. Fitur ini tidak menyertakan konfigurasi MCP loopback Gateway dan
argumen Plugin Skills Gateway, tidak melakukan penyiapan ulang dari transkrip Gateway, serta
menolak lampiran dan gambar. Baris Claude Desktop tetap hanya dapat dilihat. Node aplikasi
macOS native juga tetap hanya dapat dilihat sampai aplikasi mengiklankan perintah eksekusi.

<Note>
Sesi Claude Node terpasang tetap hanya-baca kecuali Node headless secara eksplisit
mengiklankan `agent.cli.claude.run.v1`. OpenClaw tidak pernah mengubah metadata
Claude Desktop atau mengarsipkan sesi Claude. Halaman ini memerlukan koneksi operator
dengan cakupan tulis karena menggunakan `node.invoke` terautentikasi; daftar dan pembacaan
tetap hanya-baca bahkan pada Node yang mendukung pelanjutan.
</Note>

Lihat [Node: sesi dan transkrip Claude](/id/nodes#claude-sessions-and-transcripts)
untuk perintah Node dan batas keamanan.

## Default pemikiran (Claude Sonnet 5, Mythos 5, Fable 5, 4.8, dan 4.6)

`anthropic/claude-sonnet-5` menggunakan pemikiran adaptif dengan upaya `high` secara default.
Gunakan `/think off` untuk menonaktifkan pemikiran, atau `/think xhigh|max` untuk tingkat
upaya bawaan model yang lebih tinggi. OpenClaw tidak menyertakan anggaran pemikiran manual, parameter
sampling khusus, prefill asisten, dan Priority Tier untuk Sonnet 5 karena
Anthropic tidak mendukung fitur permintaan tersebut pada model ini.
Katalog menggunakan harga input/output perkenalan Anthropic sebesar `$2/$10` hingga
31 Agustus 2026; harga standar `$3/$15` mulai berlaku pada 1 September 2026.

`anthropic/claude-fable-5` selalu menggunakan pemikiran adaptif dan secara default memakai upaya
`high`. Anthropic tidak mengizinkan pemikiran dinonaktifkan untuk model ini, sehingga
`/think off` dan `/think minimal` dipetakan ke upaya `low`. OpenClaw juga
tidak menyertakan nilai suhu khusus untuk permintaan Fable 5, karena Anthropic menolak
penggantian suhu pada setiap permintaan yang mengaktifkan pemikiran.

`anthropic/claude-mythos-5` adalah model dengan akses terbatas yang memiliki kontrak
pemikiran adaptif selalu aktif yang sama. OpenClaw secara default memakai `high`, memetakan `/think off` dan
`/think minimal` ke `low`, serta tidak menyertakan parameter sampling yang dipilih pemanggil.
Katalog memublikasikan jendela konteks 1.000.000 token, batas output
128.000 token, input gambar, dan harga input/output `$10/$50`.

Claude Opus 4.8 mempertahankan pemikiran dalam keadaan nonaktif secara default di OpenClaw. Saat Anda secara eksplisit
mengaktifkan pemikiran adaptif dengan `/think high|xhigh|max`, OpenClaw mengirim
nilai upaya Opus 4.8 milik Anthropic; model Claude 4.6 (Opus 4.6 dan Sonnet 4.6)
secara default memakai `adaptive`.

Ganti untuk setiap pesan dengan `/think:<level>` atau dalam parameter model:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Dokumentasi Anthropic terkait:
- [Pemikiran adaptif](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Pemikiran diperluas](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Fallback penolakan keamanan (Claude Fable 5)

<Warning>
Menggunakan Claude Fable 5 berarti juga menggunakan Claude Opus 4.8. Fable 5 dilengkapi dengan
pengklasifikasi keamanan yang dapat menolak permintaan, dan pemulihan yang disetujui Anthropic
adalah meminta `claude-opus-4-8` melayani giliran tersebut. OpenClaw mengaktifkan pilihan ini
secara otomatis untuk permintaan langsung dengan kunci API, sehingga beberapa giliran Fable dijawab
dan ditagih sebagai Claude Opus 4.8. Jika kebijakan atau anggaran Anda tidak dapat menerima
giliran yang dilayani Opus, jangan pilih `anthropic/claude-fable-5`.
</Warning>

### Alasan fitur ini ada

Pengklasifikasi Fable 5 mengembalikan `stop_reason: "refusal"` untuk permintaan dalam domain
yang dibatasi, dan juga menghasilkan positif palsu pada pekerjaan yang berdekatan dengan area sensitif tetapi tidak berbahaya (alat
keamanan, ilmu hayati, atau bahkan meminta model mereproduksi
penalaran mentahnya). Tanpa fallback, giliran berakhir dengan galat meskipun
model Claude lain bersedia melayaninya - pesan penolakan Anthropic sendiri
meminta integrator API untuk mengonfigurasi model fallback.

### Cara kerjanya

1. Untuk setiap permintaan langsung dengan kunci API ke `anthropic/claude-fable-5`, OpenClaw
   mengirim pengaktifan fallback sisi server milik Anthropic: header beta
   `server-side-fallback-2026-06-01` beserta
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 adalah satu-satunya
   target fallback yang diizinkan Anthropic untuk Fable 5.
2. Hanya penolakan pengklasifikasi keamanan yang memicu fallback. Batas laju,
   kelebihan beban, dan galat server berperilaku sama persis seperti sebelumnya dan diproses melalui
   [failover model](/id/concepts/model-failover) normal OpenClaw.
3. Pemulihan berlangsung dalam panggilan yang sama. Penolakan sebelum ada output
   tidak terlihat selain dari latensi; seluruh jawaban berasal dari Opus 4.8. Pada
   penolakan di tengah streaming, teks parsial dipertahankan sebagai prefiks yang dilanjutkan
   oleh model fallback, sedangkan penalaran dan panggilan alat dari model yang menolak
   dibuang sesuai aturan pemutaran ulang Anthropic (keduanya tidak boleh dikirim kembali atau
   dijalankan).
4. Jika Claude Opus 4.8 juga menolak, giliran menampilkan penolakan sebagai
   galat, sama persis seperti sebelum fitur ini tersedia.

Fallback berlangsung pada tingkat API Anthropic, sehingga `claude-opus-4-8` tidak
perlu berada dalam daftar model atau rantai fallback yang Anda konfigurasi - kunci API
yang mendukung Fable selalu dapat melayani Opus.

### Observabilitas dan penagihan

- Giliran yang dilayani fallback mencatat diagnostik `provider_fallback` pada
  pesan asisten yang menyebutkan `fromModel` dan `toModel`, dan
  `responseModel` pesan tersebut melaporkan `claude-opus-4-8`.
- Anthropic menagih per percobaan: penolakan sebelum output tidak dikenai biaya, dan pemulihan
  ditagih sesuai tarif Claude Opus 4.8 (saat ini setengah dari tarif Fable 5). Estimasi
  biaya per giliran OpenClaw menetapkan harga giliran yang dilayani fallback sesuai tarif Opus agar selaras.
- Penolakan di tengah streaming juga menagih bagian parsial Fable yang sudah dialirkan
  di sisi Anthropic; bagian tersebut dilaporkan dalam penggunaan per percobaan
  API, tetapi tidak dimasukkan ke dalam estimasi per giliran OpenClaw.

### Cakupan

Berlaku untuk `anthropic/claude-fable-5` dengan autentikasi kunci API terhadap
`api.anthropic.com`. OAuth (penggunaan kembali langganan Claude CLI), URL dasar proksi,
permintaan Bedrock, Vertex, dan Foundry tidak berubah dan tetap menampilkan
penolakan sebagai galat di sana.

Diverifikasi secara langsung: perintah tidak berbahaya yang meminta Fable 5 mereproduksi alur
pemikiran mentahnya ditolak dengan `category: "reasoning_extraction"` saat dikirim tanpa
fallback, sedangkan perintah yang sama melalui OpenClaw mengembalikan jawaban normal yang dilayani Opus
dengan diagnostik `provider_fallback` terlampir.

Lihat [panduan penolakan dan fallback
Anthropic](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
untuk perilaku yang mendasarinya.

## Caching prompt

OpenClaw mendukung fitur caching prompt Anthropic untuk autentikasi kunci API.

| Nilai               | Durasi cache | Deskripsi                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (default) | 5 menit      | Diterapkan secara otomatis untuk autentikasi kunci API |
| `"long"`            | 1 jam         | Cache diperpanjang                         |
| `"none"`            | Tanpa caching     | Nonaktifkan caching prompt                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Penggantian cache per agen">
    Gunakan parameter tingkat model sebagai nilai dasar, lalu ganti untuk agen tertentu melalui `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Urutan penggabungan konfigurasi:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (yang cocok dengan `id`, menimpa berdasarkan kunci)

    Ini memungkinkan satu agen mempertahankan cache berumur panjang sementara agen lain pada model yang sama menonaktifkan caching untuk lalu lintas yang melonjak/penggunaan ulang rendah.

  </Accordion>

  <Accordion title="Catatan Claude Bedrock">
    - Model Anthropic Claude di Bedrock (`amazon-bedrock/*anthropic.claude*`) menerima penerusan `cacheRetention` saat dikonfigurasi.
    - Model Bedrock non-Anthropic dipaksa ke `cacheRetention: "none"` saat runtime.
    - Default cerdas kunci API juga menetapkan nilai awal `cacheRetention: "short"` untuk referensi Claude-on-Bedrock jika tidak ada nilai eksplisit yang ditetapkan.

  </Accordion>
</AccordionGroup>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Mode cepat">
    Tombol alih `/fast` bersama milik OpenClaw menetapkan bidang `service_tier` Anthropic untuk lalu lintas kunci API langsung ke `api.anthropic.com`.

    | Perintah | Dipetakan ke |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Hanya berlaku untuk permintaan `api.anthropic.com` langsung yang dibuat dengan kunci API. Permintaan token OAuth/langganan dan rute proksi tidak pernah menerima bidang `service_tier`.
    - Parameter `serviceTier` atau `service_tier` eksplisit menimpa `/fast` jika keduanya ditetapkan.
    - Pada akun tanpa kapasitas Priority Tier, `service_tier: "auto"` dapat diselesaikan menjadi `standard`.

    </Note>

  </Accordion>

  <Accordion title="Pemahaman media (gambar dan PDF)">
    Plugin Anthropic yang disertakan mendaftarkan pemahaman gambar dan PDF. OpenClaw
    secara otomatis menentukan kemampuan media dari autentikasi Anthropic yang dikonfigurasi; tidak
    diperlukan konfigurasi tambahan.

    | Properti         | Nilai                 |
    | ---------------- | --------------------- |
    | Model default    | `claude-opus-4-8`     |
    | Input yang didukung | Gambar, dokumen PDF |

    Saat gambar atau PDF dilampirkan ke percakapan, OpenClaw secara otomatis
    merutekannya melalui penyedia pemahaman media Anthropic.

  </Accordion>

  <Accordion title="Jendela konteks 1M">
    Claude Sonnet 5, Mythos 5, dan Fable 5 memiliki jendela input tepat
    1.000.000 token dan mendukung hingga 128.000 token output. Jendela konteks
    1M Anthropic juga tersedia secara umum pada model Claude 4.x dengan pemikiran adaptif: Opus 4.8,
    Opus 4.7, Opus 4.6, dan Sonnet 4.6. OpenClaw mengatur ukuran model-model ini
    secara otomatis, tanpa memerlukan `params.context1m`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Konfigurasi lama dapat mempertahankan `params.context1m: true`; ini adalah no-op yang tidak berbahaya untuk
    model-model ini dan OpenClaw tidak lagi mengirimkan header beta
    `context-1m-2025-08-07` yang telah dihentikan, apa pun kondisinya. Entri konfigurasi `anthropicBeta` lama
    dengan nilai tersebut dihapus selama resolusi header permintaan, dan
    model Claude lama yang tidak didukung tetap menggunakan jendela konteks normalnya.

    `params.context1m: true` berperilaku dengan cara yang sama untuk backend CLI Claude
    (`claude-cli/*`): model Opus dan Sonnet yang memenuhi syarat dan mendukung ketersediaan umum sudah mendapatkan
    jendela 1M secara otomatis, sehingga parameter tersebut juga opsional di sana.

    <Warning>
    Memerlukan akses konteks panjang pada kredensial Anthropic Anda. Autentikasi token OAuth/langganan tetap menggunakan header beta Anthropic yang diwajibkan, tetapi OpenClaw menghapus header beta 1M yang telah dihentikan jika masih terdapat dalam konfigurasi lama.
    </Warning>

  </Accordion>

  <Accordion title="Konteks 1M Claude Opus 4.8">
    `anthropic/claude-opus-4-8` dan varian `claude-cli`-nya memiliki jendela konteks
    1M secara default; tidak memerlukan `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Kesalahan 401 / token tiba-tiba tidak valid">
    Autentikasi token Anthropic dapat kedaluwarsa dan dicabut. Untuk penyiapan baru, gunakan kunci API Anthropic sebagai gantinya.
  </Accordion>

  <Accordion title='Tidak ditemukan kunci API untuk penyedia "anthropic"'>
    Autentikasi Anthropic bersifat **per agen**; agen baru tidak mewarisi kunci agen utama. Jalankan kembali proses orientasi untuk agen tersebut (atau konfigurasikan kunci API pada host Gateway), lalu verifikasi dengan `openclaw models status`.
  </Accordion>

  <Accordion title='Tidak ditemukan kredensial untuk profil "anthropic:default"'>
    Jalankan `openclaw models status` untuk melihat profil autentikasi yang aktif. Jalankan kembali proses orientasi, atau konfigurasikan kunci API untuk jalur profil tersebut.
  </Accordion>

  <Accordion title="Tidak ada profil autentikasi yang tersedia (semuanya dalam masa tunggu)">
    Periksa `openclaw models status --json` untuk `auth.unusableProfiles`. Masa tunggu akibat batas laju Anthropic dapat berlaku khusus untuk model tertentu, sehingga model Anthropic lain yang terkait mungkin masih dapat digunakan. Tambahkan profil Anthropic lain atau tunggu hingga masa tunggu berakhir.
  </Accordion>
</AccordionGroup>

<Note>
Bantuan selengkapnya: [Pemecahan masalah](/id/help/troubleshooting) dan [Pertanyaan umum](/id/help/faq).
</Note>

## Terkait

<CardGroup cols={2}>
  <Card title="Pemilihan model" href="/id/concepts/model-providers" icon="layers">
    Memilih penyedia, referensi model, dan perilaku failover.
  </Card>
  <Card title="Backend CLI" href="/id/gateway/cli-backends" icon="terminal">
    Penyiapan backend Claude CLI dan detail runtime.
  </Card>
  <Card title="Caching prompt" href="/id/reference/prompt-caching" icon="database">
    Cara kerja caching prompt di berbagai penyedia.
  </Card>
  <Card title="OAuth dan autentikasi" href="/id/gateway/authentication" icon="key">
    Detail autentikasi dan aturan penggunaan kembali kredensial.
  </Card>
</CardGroup>
