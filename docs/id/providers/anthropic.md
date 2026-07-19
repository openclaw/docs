---
read_when:
    - Anda ingin menggunakan model Anthropic di OpenClaw
    - Anda ingin menelusuri sesi Claude CLI atau Claude Desktop di seluruh komputer yang dipasangkan
summary: Gunakan Anthropic Claude melalui kunci API atau Claude CLI di OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-19T05:32:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 527129e8d43fbb73f476b3cce7bd4fa05f8450ea337bf36f7ce71219d6cb1a5e
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic mengembangkan keluarga model **Claude**. OpenClaw mendukung dua jalur autentikasi:

- **Kunci API** - akses langsung ke API Anthropic dengan penagihan berbasis penggunaan (model `anthropic/*`)
- **Claude CLI** - gunakan kembali login Claude Code yang sudah ada pada host yang sama

## Pelacakan penggunaan dan biaya

OpenClaw mendeteksi kredensial Anthropic yang tersedia dan memilih tampilan penggunaan yang sesuai:

- Kredensial langganan/penyiapan Claude menampilkan periode kuota dan anggaran penggunaan tambahan opsional.
- `ANTHROPIC_ADMIN_KEY` atau `ANTHROPIC_ADMIN_API_KEY` menampilkan biaya organisasi dan penggunaan Messages API yang dilaporkan penyedia selama 30 hari di **Penggunaan** pada Control UI, termasuk pengeluaran harian, total token/cache, model teratas, dan kategori biaya.
- Kredensial `sk-ant-admin...` yang disimpan dalam profil penyedia Anthropic secara otomatis terdeteksi sebagai kunci Admin API.

Riwayat biaya Admin API berasal dari [Usage and Cost API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) Anthropic. Ini adalah penagihan penyedia yang sebenarnya, terpisah dari estimasi biaya OpenClaw yang berasal dari sesi.

<Warning>
Backend Claude CLI OpenClaw menjalankan Claude Code CLI yang terinstal dalam
mode cetak noninteraktif (`claude -p`). Dokumentasi Claude Code Anthropic saat ini
menjelaskan mode tersebut sebagai penggunaan Agent SDK/programatis. Pembaruan dukungan
Anthropic pada 15 Juni 2026 menangguhkan perubahan penagihan Agent SDK terpisah yang
telah diumumkan: penggunaan Claude Agent SDK, `claude -p`, dan aplikasi pihak ketiga
masih mengurangi batas penggunaan langganan yang digunakan untuk login, dan kredit bulanan
Agent SDK yang sebelumnya diumumkan tidak tersedia selama Anthropic merevisi rencana tersebut.

Claude Code interaktif masih mengurangi batas paket Claude yang digunakan untuk login.
Autentikasi kunci API menggunakan penagihan bayar sesuai pemakaian secara langsung dan tidak
bergantung pada paket tersebut. Untuk host Gateway berumur panjang, otomatisasi bersama,
dan pengeluaran produksi yang dapat diprediksi, gunakan kunci API Anthropic.

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
    **Paling cocok untuk:** akses API standar dan penagihan berbasis penggunaan.

    <Steps>
      <Step title="Dapatkan kunci API Anda">
        Buat kunci API di [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Jalankan orientasi awal">
        ```bash
        openclaw onboard
        # pilih: kunci API Anthropic
        ```

        Atau berikan kunci secara langsung:

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
      <Step title="Pastikan Claude CLI terinstal dan sudah login">
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
    Penggunaan kembali Claude CLI mengharuskan proses OpenClaw berjalan pada host yang
    sama dengan login Claude CLI. Instalasi Docker dapat mempertahankan direktori home
    kontainer dan login ke Claude Code di sana; lihat
    [Backend Claude CLI di Docker](/id/install/docker#claude-cli-backend-in-docker).
    Instalasi kontainer lain seperti [Podman](/id/install/podman) tidak memasang
    `~/.claude` host ke dalam penyiapan atau runtime; gunakan kunci API Anthropic
    di sana, atau pilih penyedia dengan OAuth yang dikelola OpenClaw seperti
    [OpenAI Codex](/id/providers/openai).
    </Warning>

    ### Dapatkan token penyiapan

    Jalankan `claude setup-token` pada mesin mana pun yang telah menginstal Claude Code. Perintah ini mencetak
    token berumur panjang yang diawali dengan `sk-ant-oat01-`.

    Selama orientasi awal, tempel token di aplikasi macOS dengan memilih
    **Token penyiapan Anthropic** di bawah **Hubungkan dengan kunci API atau token**, atau gunakan:

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### Contoh konfigurasi

    Utamakan referensi model Anthropic kanonis beserta penggantian runtime CLI:

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

    Referensi model `claude-cli/claude-opus-4-7` lama masih berfungsi demi
    kompatibilitas, tetapi konfigurasi baru harus mempertahankan pemilihan penyedia/model sebagai
    `anthropic/*` dan menempatkan backend eksekusi dalam kebijakan runtime penyedia/model.

    ### Penagihan dan `claude -p`

    OpenClaw menggunakan jalur `claude -p` noninteraktif Claude Code untuk eksekusi
    Claude CLI. Anthropic saat ini memperlakukan jalur tersebut sebagai penggunaan Agent SDK/programatis:

    - Pembaruan dukungan Anthropic pada 15 Juni 2026 menangguhkan rencana
      kredit Agent SDK terpisah yang sebelumnya diumumkan.
    - Penggunaan Claude Agent SDK paket langganan, `claude -p`, dan aplikasi pihak ketiga
      masih mengurangi batas penggunaan langganan yang digunakan untuk login.
    - Kredit bulanan Agent SDK yang sebelumnya diumumkan tidak tersedia selama
      Anthropic merevisi rencana tersebut.
    - Login Console/kunci API menggunakan penagihan API bayar sesuai pemakaian dan tidak
      menerima kredit Agent SDK langganan.

    Lihat [artikel paket Agent SDK
    Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    untuk pemberitahuan penangguhan, serta artikel paket Claude Code untuk perilaku langganan
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    dan
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic dapat mengubah perilaku penagihan dan batas laju Claude Code tanpa
    rilis OpenClaw. Periksa `claude auth status`, `/status`, dan
    dokumentasi Anthropic yang ditautkan jika prediktabilitas penagihan penting.

    <Tip>
    Untuk otomatisasi produksi bersama, gunakan kunci API Anthropic sebagai pengganti
    Claude CLI. OpenClaw juga mendukung opsi bergaya langganan dari
    [OpenAI Codex](/id/providers/openai), [Qwen Cloud](/id/providers/qwen),
    [MiniMax](/id/providers/minimax), dan [Z.AI / GLM](/id/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Sesi Claude di berbagai komputer

Plugin Anthropic bawaan menambahkan grup **Claude Code** ke bilah samping sesi
normal. Baris dibuka di panel Percakapan normal. Plugin ini menemukan sesi Claude
Code yang tidak diarsipkan pada Gateway dan pada host node yang terhubung:

- Sesi Claude CLI berasal dari catatan indeks proyek yang valid dan file JSONL
  saat ini yang awalan metadata terbatasnya mengidentifikasi sesi `sdk-cli`
  non-sidechain di bawah `~/.claude/projects/`.
- Sesi Claude Desktop menggunakan judul Desktop, waktu aktivitas, dan
  status arsip ketika metadatanya menunjuk ke ID sesi Claude Code yang sama.
- Sesi khusus CLI tidak memiliki penanda arsip, sehingga tetap terlihat selama
  transkripnya tersedia.

Tidak diperlukan konfigurasi OpenClaw tambahan untuk penemuan. Plugin Anthropic
disertakan dan diaktifkan secara default; node macOS native mengiklankan perintah
sesi Claude hanya-baca ketika direktori `~/.claude/projects/` lokal tersedia.
Setujui peningkatan pemasangan node saat perintah tersebut pertama kali muncul.

Bilah samping mengelompokkan baris berdasarkan host Gateway atau node yang dipasangkan
dan menampilkan halaman terbatas terbaru setiap host segera setelah komputer tersebut merespons.
Bilah samping melakukan rekonsiliasi ulang setelah perubahan konektivitas host, ketika halaman
kembali mendapatkan fokus, dan paling sering setiap 30 detik saat terlihat, sehingga sesi Claude
yang dibuat di luar OpenClaw muncul tanpa memuat ulang. Katalog yang berubah akan mendapatkan
proses lanjutan yang lebih cepat. Gunakan **Muat lebih banyak sesi** di bawah grup katalog untuk
menambahkan halaman berikutnya bagi setiap host yang memiliki lebih banyak riwayat; baris yang
ditambahkan tetap terlihat dan diambil ulang hingga kedalaman yang sama di seluruh penyegaran.
Klien katalog menggunakan `sessions.catalog.list`; membuka baris menggunakan
`sessions.catalog.read`.

Pengambilalihan terminal menyelesaikan `claude` dari PATH shell login pengguna
host pemilik sebelum PATH layanan/daemon. Hal ini menjaga sesi yang diluncurkan aplikasi
tetap selaras dengan Claude CLI yang diperoleh operator di terminal normal.

Memilih sebuah baris akan membaca halaman transkrip terbaru terlebih dahulu. **Muat item
transkrip yang lebih lama** mengikuti kursor byte buram dan membaca bagian terbatas lain
dari file JSONL alih-alih memuat seluruh riwayat. Konten pengguna, asisten,
penalaran, pemanggilan alat, dan hasil alat normal dipertahankan. Item individual
yang lebih besar dari batas keamanan node/Gateway ditandai dengan jelas sebagai terpotong.

Untuk baris `claude-cli` lokal Gateway, mengetik di kolom penulisan normal akan memanggil
`sessions.catalog.continue`. OpenClaw menyelesaikan ulang catatan katalog lokal,
membuat atau menggunakan kembali sesi native yang terkunci pada model, mengimpor paling banyak
200 item yang terlihat atau 512 KiB, dan menyiapkan pengikatan Claude CLI. Giliran pertama
dilanjutkan dengan `--fork-session`; Claude memberikan ID sesi baru kepada fork, sehingga
giliran berikutnya menggunakan fork dan sesi sumber tetap tidak tersentuh.

Host node headless juga dapat membuat baris Claude CLI-nya dapat dilanjutkan dengan
mengaktifkan pengaturan lokal node di bawah ini dan memulai ulang host node:

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
dan executable `claude` lokalnya dapat ditemukan. OpenClaw menyelesaikan ulang catatan
katalog pada node tersebut, mengimpor riwayat terbatas yang sama, dan mengikat sesi
yang diadopsi ke node serta direktori kerja yang dilaporkan katalog. Setiap giliran menjalankan
proses `claude -p` asli node menggunakan file Claude dan login node tersebut. Kebijakan
persetujuan eksekusi node tetap berlaku; Gateway tidak dapat memaksakan persetujuan tersebut.

Kelanjutan node v1 hanya bersifat sekali jalan. Fitur ini menghilangkan konfigurasi MCP loopback
Gateway dan argumen Plugin Skills Gateway, tidak melakukan penyiapan ulang dari transkrip
Gateway, serta menolak lampiran dan gambar. Baris Claude Desktop tetap hanya-baca. Node
aplikasi macOS native juga tetap hanya-baca hingga aplikasi mengiklankan perintah eksekusi.

<Note>
Sesi Claude pada node yang dipasangkan tetap hanya-baca kecuali node headless secara eksplisit
mengiklankan `agent.cli.claude.run.v1`. OpenClaw tidak pernah mengubah metadata
Claude Desktop atau mengarsipkan sesi Claude. Halaman ini memerlukan koneksi operator
dengan cakupan tulis karena menggunakan `node.invoke` terautentikasi; operasi daftar dan baca
tetap hanya-baca bahkan pada node yang mendukung kelanjutan.
</Note>

Lihat [Node: sesi dan transkrip Claude](/id/nodes#claude-sessions-and-transcripts)
untuk perintah Node dan batas keamanan.

## Default thinking (Claude Sonnet 5, Mythos 5, Fable 5, 4.8, dan 4.6)

`anthropic/claude-sonnet-5` menggunakan thinking adaptif pada tingkat upaya `high` secara default.
Gunakan `/think off` untuk menonaktifkan thinking, atau `/think xhigh|max` untuk tingkat
upaya native model yang lebih tinggi. OpenClaw tidak menyertakan anggaran thinking manual, parameter
sampling khusus, prefill asisten, dan Priority Tier untuk Sonnet 5 karena
Anthropic tidak mendukung fitur permintaan tersebut pada model ini.
Katalog menggunakan harga input/output perkenalan Anthropic sebesar `$2/$10` hingga
31 Agustus 2026; harga standar `$3/$15` mulai berlaku pada 1 September 2026.

`anthropic/claude-fable-5` selalu menggunakan thinking adaptif dan secara default memakai tingkat upaya
`high`. Anthropic tidak mengizinkan thinking dinonaktifkan untuk model ini, sehingga
`/think off` dan `/think minimal` dipetakan ke tingkat upaya `low`. OpenClaw juga
tidak menyertakan nilai temperature khusus untuk permintaan Fable 5 karena Anthropic menolak
penggantian temperature pada setiap permintaan yang mengaktifkan thinking.

`anthropic/claude-mythos-5` adalah model dengan akses terbatas yang memiliki kontrak
thinking adaptif yang sama dan selalu aktif. OpenClaw secara default menggunakan `high`, memetakan `/think off` dan
`/think minimal` ke `low`, serta tidak menyertakan parameter sampling yang dipilih pemanggil.
Katalog memublikasikan jendela konteks 1.000.000 token, batas output
128.000 token, input gambar, dan harga input/output `$10/$50`.

Claude Opus 4.8 mempertahankan thinking dalam keadaan nonaktif secara default di OpenClaw. Saat Anda secara eksplisit
mengaktifkan thinking adaptif dengan `/think high|xhigh|max`, OpenClaw mengirim
nilai upaya Opus 4.8 milik Anthropic; model Claude 4.6 (Opus 4.6 dan Sonnet 4.6)
secara default menggunakan `adaptive`.

Ganti per pesan dengan `/think:<level>` atau dalam parameter model:

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
- [Thinking adaptif](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Thinking diperluas](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Fallback penolakan keamanan (Claude Fable 5)

<Warning>
Menggunakan Claude Fable 5 berarti juga menggunakan Claude Opus 4.8. Fable 5 disertai
pengklasifikasi keamanan yang dapat menolak permintaan, dan pemulihan yang disetujui Anthropic
adalah meminta `claude-opus-4-8` menangani giliran tersebut. OpenClaw memilih mekanisme ini
secara otomatis untuk permintaan langsung dengan kunci API, sehingga beberapa giliran Fable dijawab
dan ditagih sebagai Claude Opus 4.8. Jika kebijakan atau anggaran Anda tidak dapat menerima
giliran yang ditangani Opus, jangan pilih `anthropic/claude-fable-5`.
</Warning>

### Alasan fitur ini tersedia

Pengklasifikasi Fable 5 mengembalikan `stop_reason: "refusal"` pada permintaan dalam domain
terbatas, dan juga menghasilkan positif palsu pada pekerjaan aman yang berdekatan (peralatan
keamanan, ilmu hayati, atau bahkan meminta model mereproduksi penalaran mentahnya).
Tanpa fallback, giliran berakhir dengan kesalahan meskipun model Claude lain
bersedia menanganinya—pesan penolakan Anthropic sendiri memberi tahu integrator API
agar mengonfigurasi model fallback.

### Cara kerjanya

1. Untuk setiap permintaan langsung dengan kunci API ke `anthropic/claude-fable-5`, OpenClaw
   mengirim persetujuan fallback sisi server milik Anthropic: header beta
   `server-side-fallback-2026-06-01` ditambah
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 adalah satu-satunya
   target fallback yang diizinkan Anthropic untuk Fable 5.
2. Hanya penolakan pengklasifikasi keamanan yang memicu fallback. Batas laju,
   kelebihan beban, dan kesalahan server berperilaku persis seperti sebelumnya dan melalui
   [failover model](/id/concepts/model-failover) normal OpenClaw.
3. Penyelamatan berlangsung dalam panggilan yang sama. Penolakan sebelum output apa pun
   tidak terlihat selain dari latensi; seluruh jawaban berasal dari Opus 4.8. Pada
   penolakan di tengah streaming, teks parsial dipertahankan sebagai prefiks yang dilanjutkan
   oleh model fallback, sedangkan penalaran dan pemanggilan alat dari model yang menolak
   dibuang sesuai aturan pemutaran ulang Anthropic (keduanya tidak boleh dikirim kembali atau
   dijalankan).
4. Jika Claude Opus 4.8 juga menolak, giliran menampilkan penolakan tersebut sebagai
   kesalahan, persis seperti sebelum fitur ini tersedia.

Fallback berlangsung pada tingkat API Anthropic, sehingga `claude-opus-4-8` tidak
perlu ada dalam daftar model atau rantai fallback yang Anda konfigurasi—kunci API yang mendukung Fable
selalu dapat menangani Opus.

### Observabilitas dan penagihan

- Giliran yang ditangani fallback mencatat diagnostik `provider_fallback` pada
  pesan asisten yang menyebutkan `fromModel` dan `toModel`, serta
  `responseModel` pesan tersebut melaporkan `claude-opus-4-8`.
- Anthropic menagih per percobaan: penolakan sebelum output tidak dikenai biaya, dan penyelamatan
  ditagih dengan tarif Claude Opus 4.8 (saat ini separuh tarif Fable 5). Estimasi
  biaya per giliran OpenClaw menghitung giliran yang ditangani fallback dengan tarif Opus agar sesuai.
- Penolakan di tengah streaming juga mengenakan biaya untuk bagian parsial Fable yang telah di-streaming
  di sisi Anthropic; bagian tersebut dilaporkan dalam penggunaan per percobaan
  API, tetapi tidak dimasukkan ke dalam estimasi per giliran OpenClaw.

### Cakupan

Berlaku untuk `anthropic/claude-fable-5` dengan autentikasi kunci API terhadap
`api.anthropic.com`. Permintaan OAuth (penggunaan kembali langganan Claude CLI), URL dasar proksi,
Bedrock, Vertex, dan Foundry tidak berubah dan tetap menampilkan
penolakan sebagai kesalahan di sana.

Diverifikasi secara langsung: prompt aman yang meminta Fable 5 mereproduksi rantai
pemikiran mentahnya ditolak dengan `category: "reasoning_extraction"` saat dikirim tanpa
fallback, dan prompt yang sama melalui OpenClaw mengembalikan jawaban normal yang ditangani Opus
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
    Gunakan parameter tingkat model sebagai dasar, lalu ganti untuk agen tertentu melalui `agents.list[].params`:

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
    2. `agents.list[].params` (mencocokkan `id`, menimpa berdasarkan kunci)

    Ini memungkinkan satu agen mempertahankan cache berumur panjang sementara agen lain pada model yang sama menonaktifkan caching untuk lalu lintas yang melonjak/penggunaan ulang rendah.

  </Accordion>

  <Accordion title="Catatan Claude di Bedrock">
    - Model Anthropic Claude di Bedrock (`amazon-bedrock/*anthropic.claude*`) menerima penerusan `cacheRetention` saat dikonfigurasi.
    - Model Bedrock non-Anthropic dipaksa menjadi `cacheRetention: "none"` saat runtime.
    - Default cerdas kunci API juga menetapkan nilai awal `cacheRetention: "short"` untuk referensi Claude-di-Bedrock saat tidak ada nilai eksplisit yang ditetapkan.

  </Accordion>
</AccordionGroup>

## Konfigurasi lanjutan

<AccordionGroup>
  <Accordion title="Mode cepat">
    Tombol alih `/fast` bersama milik OpenClaw menetapkan bidang `service_tier` Anthropic untuk lalu lintas langsung dengan kunci API ke `api.anthropic.com`.

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
    - Hanya berlaku untuk permintaan `api.anthropic.com` langsung yang dibuat dengan kunci API. Permintaan OAuth/token langganan dan rute proksi tidak pernah mendapatkan bidang `service_tier`.
    - Parameter `serviceTier` atau `service_tier` yang eksplisit menimpa `/fast` saat keduanya ditetapkan.
    - Pada akun tanpa kapasitas Priority Tier, `service_tier: "auto"` dapat diresolusikan menjadi `standard`.

    </Note>

  </Accordion>

  <Accordion title="Pemahaman media (gambar dan PDF)">
    Plugin Anthropic bawaan mendaftarkan pemahaman gambar dan PDF. OpenClaw
    meresolusikan kemampuan media secara otomatis dari autentikasi Anthropic yang dikonfigurasi; tidak
    diperlukan konfigurasi tambahan.

    | Properti        | Nilai                 |
    | --------------- | --------------------- |
    | Model default   | `claude-opus-4-8`     |
    | Input yang didukung | Gambar, dokumen PDF |

    Saat gambar atau PDF dilampirkan ke percakapan, OpenClaw secara otomatis
    merutekannya melalui penyedia pemahaman media Anthropic.

  </Accordion>

  <Accordion title="Jendela konteks 1M">
    Claude Sonnet 5, Mythos 5, dan Fable 5 memiliki jendela input tepat
    1.000.000 token dan mendukung hingga 128.000 token output. Jendela konteks
    1M Anthropic juga tersedia secara umum pada model Claude 4.x dengan pemikiran adaptif: Opus 4.8,
    Opus 4.7, Opus 4.6, dan Sonnet 4.6. OpenClaw menentukan ukuran model-model ini
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

    Konfigurasi lama dapat mempertahankan `params.context1m: true`; parameter tersebut merupakan no-op yang tidak berbahaya untuk
    model-model ini dan OpenClaw tidak lagi mengirim header beta
    `context-1m-2025-08-07` yang telah dihentikan. Entri konfigurasi `anthropicBeta` lama
    dengan nilai tersebut dihapus selama resolusi header permintaan, dan
    model Claude lama yang tidak didukung tetap menggunakan jendela konteks normalnya.

    `params.context1m: true` berperilaku dengan cara yang sama untuk backend CLI Claude
    (`claude-cli/*`): model Opus dan Sonnet yang memenuhi syarat dan mendukung ketersediaan umum telah mendapatkan
    jendela 1M secara otomatis, sehingga parameter tersebut juga opsional di sana.

    <Warning>
    Memerlukan akses konteks panjang pada kredensial Anthropic Anda. Autentikasi OAuth/token langganan mempertahankan header beta Anthropic yang diwajibkan, tetapi OpenClaw menghapus header beta 1M yang telah dihentikan jika masih tersisa dalam konfigurasi lama.
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
    Autentikasi Anthropic berlaku **per agen**; agen baru tidak mewarisi kunci agen utama. Jalankan kembali orientasi awal untuk agen tersebut (atau konfigurasikan kunci API pada host gateway), lalu verifikasi dengan `openclaw models status`.
  </Accordion>

  <Accordion title='Tidak ditemukan kredensial untuk profil "anthropic:default"'>
    Jalankan `openclaw models status` untuk melihat profil autentikasi yang aktif. Jalankan kembali orientasi awal, atau konfigurasikan kunci API untuk jalur profil tersebut.
  </Accordion>

  <Accordion title="Tidak ada profil autentikasi yang tersedia (semuanya dalam masa tunggu)">
    Periksa `openclaw models status --json` untuk `auth.unusableProfiles`. Masa tunggu akibat batas laju Anthropic dapat berlaku khusus untuk model, sehingga model Anthropic lain yang terkait mungkin masih dapat digunakan. Tambahkan profil Anthropic lain atau tunggu hingga masa tunggu berakhir.
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
    Detail autentikasi dan aturan penggunaan ulang kredensial.
  </Card>
</CardGroup>
