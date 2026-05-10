---
read_when:
    - Anda sedang memilih antara PI, Codex, ACP, atau runtime agen native lainnya
    - Anda bingung dengan label penyedia/model/runtime dalam status atau konfigurasi
    - Anda sedang mendokumentasikan kesetaraan dukungan untuk perangkat uji asli
summary: Cara OpenClaw memisahkan penyedia model, model, saluran, dan runtime agen
title: Runtime agen
x-i18n:
    generated_at: "2026-05-10T19:30:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc5493bbcfb9fd60d4060455215780ca752040cc09b1b5a4d05bd84a59ce5a1e
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**Runtime agen** adalah komponen yang memiliki satu loop model yang sudah disiapkan: komponen ini
menerima prompt, menjalankan keluaran model, menangani pemanggilan tool native, dan mengembalikan
turn yang selesai ke OpenClaw.

Runtime mudah tertukar dengan penyedia karena keduanya muncul dekat konfigurasi
model. Keduanya adalah lapisan yang berbeda:

| Lapisan       | Contoh                                | Artinya                                                            |
| ------------- | ------------------------------------- | ------------------------------------------------------------------ |
| Penyedia      | `openai`, `anthropic`, `openai-codex` | Cara OpenClaw mengautentikasi, menemukan model, dan menamai ref model. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Model yang dipilih untuk turn agen.                                |
| Runtime agen  | `pi`, `codex`, `claude-cli`           | Loop atau backend tingkat rendah yang mengeksekusi turn yang disiapkan. |
| Channel       | Telegram, Discord, Slack, WhatsApp    | Tempat pesan masuk dan keluar dari OpenClaw.                       |

Anda juga akan melihat kata **harness** di kode. Harness adalah implementasi
yang menyediakan runtime agen. Misalnya, harness Codex bawaan
mengimplementasikan runtime `codex`. Konfigurasi publik menggunakan `agentRuntime.id` pada
entri penyedia atau model; kunci runtime seluruh agen bersifat legacy dan diabaikan.
`openclaw doctor --fix` menghapus pin runtime seluruh agen lama dan menulis ulang
ref model runtime legacy menjadi ref penyedia/model kanonis plus kebijakan runtime
berlingkup model jika diperlukan.

Ada dua keluarga runtime:

- **Harness tertanam** berjalan di dalam loop agen OpenClaw yang sudah disiapkan. Saat ini ini
  adalah runtime `pi` bawaan plus harness plugin terdaftar seperti
  `codex`.
- **Backend CLI** menjalankan proses CLI lokal sambil mempertahankan ref model
  tetap kanonis. Misalnya, `anthropic/claude-opus-4-7` dengan
  `agentRuntime.id: "claude-cli"` berlingkup model berarti "pilih model Anthropic,
  eksekusi melalui Claude CLI." `claude-cli` bukan id harness tertanam
  dan tidak boleh diteruskan ke pemilihan AgentHarness.

## Permukaan Codex

Sebagian besar kebingungan berasal dari beberapa permukaan berbeda yang berbagi nama Codex:

| Permukaan                                       | Nama/konfigurasi OpenClaw              | Fungsinya                                                                                                      |
| ----------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Runtime app-server Codex native                 | ref model `openai/*`                   | Menjalankan turn agen tertanam OpenAI melalui app-server Codex. Ini adalah setup langganan ChatGPT/Codex biasa. |
| Profil auth OAuth Codex                         | penyedia auth `openai-codex`           | Menyimpan auth langganan ChatGPT/Codex yang digunakan harness app-server Codex.                                |
| Adapter ACP Codex                               | `runtime: "acp"`, `agentId: "codex"`   | Menjalankan Codex melalui control plane ACP/acpx eksternal. Gunakan hanya ketika ACP/acpx diminta secara eksplisit. |
| Set perintah kontrol chat Codex native          | `/codex ...`                           | Mengikat, melanjutkan, mengarahkan, menghentikan, dan memeriksa thread app-server Codex dari chat.             |
| Rute API OpenAI Platform untuk permukaan non-agen | `openai/*` plus auth kunci API        | Digunakan untuk API OpenAI langsung seperti gambar, embeddings, speech, dan realtime.                          |

Permukaan tersebut sengaja independen. Mengaktifkan plugin `codex` membuat
fitur app-server native tersedia; `openclaw doctor --fix` memiliki perbaikan rute
`openai-codex/*` legacy dan pembersihan pin sesi basi. Memilih
`openai/*` untuk model agen sekarang berarti "jalankan ini melalui Codex" kecuali
permukaan API OpenAI non-agen sedang digunakan.

Setup langganan ChatGPT/Codex yang umum menggunakan OAuth Codex untuk auth, tetapi mempertahankan
ref model sebagai `openai/*` dan memilih runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Itu berarti OpenClaw memilih ref model OpenAI, lalu meminta runtime app-server Codex
untuk menjalankan turn agen tertanam. Itu tidak berarti "gunakan penagihan API," dan
tidak berarti channel, katalog penyedia model, atau penyimpanan sesi OpenClaw
menjadi Codex.

Ketika plugin `codex` bawaan diaktifkan, kontrol Codex bahasa alami
sebaiknya menggunakan permukaan perintah `/codex` native (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) alih-alih ACP. Gunakan ACP untuk
Codex hanya ketika pengguna secara eksplisit meminta ACP/acpx atau sedang menguji jalur
adapter ACP. Claude Code, Gemini CLI, OpenCode, Cursor, dan harness eksternal
serupa tetap menggunakan ACP.

Ini adalah pohon keputusan yang dihadapi agen:

1. Jika pengguna meminta **bind/control/thread/resume/steer/stop Codex**, gunakan
   permukaan perintah `/codex` native ketika plugin `codex` bawaan diaktifkan.
2. Jika pengguna meminta **Codex sebagai runtime tertanam** atau menginginkan pengalaman
   agen Codex normal yang didukung langganan, gunakan `openai/<model>`.
3. Jika pengguna secara eksplisit memilih **PI untuk model OpenAI**, pertahankan ref model
   sebagai `openai/<model>` dan set kebijakan runtime penyedia/model ke
   `agentRuntime.id: "pi"`. Profil auth `openai-codex` yang dipilih dirutekan
   secara internal melalui transport auth Codex legacy milik PI.
4. Jika konfigurasi legacy masih berisi **ref model `openai-codex/*`**, perbaiki menjadi
   `openai/<model>` dengan `openclaw doctor --fix`; doctor mempertahankan rute auth Codex
   dengan menambahkan `agentRuntime.id: "codex"` berlingkup penyedia/model ketika ref model
   lama menyiratkannya.
5. Jika pengguna secara eksplisit mengatakan **ACP**, **acpx**, atau **adapter ACP Codex**, gunakan
   ACP dengan `runtime: "acp"` dan `agentId: "codex"`.
6. Jika permintaan adalah untuk **Claude Code, Gemini CLI, OpenCode, Cursor, Droid, atau
   harness eksternal lain**, gunakan ACP/acpx, bukan runtime sub-agen native.

| Maksud Anda...                         | Gunakan...                                  |
| -------------------------------------- | ------------------------------------------- |
| Kontrol chat/thread app-server Codex   | `/codex ...` dari plugin `codex` bawaan     |
| Runtime agen tertanam app-server Codex | ref model agen `openai/*`                   |
| OAuth OpenAI Codex                     | profil auth `openai-codex`                  |
| Claude Code atau harness eksternal lain | ACP/acpx                                   |

Untuk pemisahan prefiks keluarga OpenAI, lihat [OpenAI](/id/providers/openai) dan
[Penyedia model](/id/concepts/model-providers). Untuk kontrak dukungan runtime Codex,
lihat [Runtime harness Codex](/id/plugins/codex-harness-runtime#v1-support-contract).

## Kepemilikan runtime

Runtime yang berbeda memiliki bagian loop yang berbeda.

| Permukaan                    | OpenClaw PI tertanam                   | App-server Codex                                                           |
| ---------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Pemilik loop model           | OpenClaw melalui runner tertanam PI    | App-server Codex                                                           |
| Status thread kanonis        | Transkrip OpenClaw                     | Thread Codex, plus cermin transkrip OpenClaw                               |
| Tool dinamis OpenClaw        | Loop tool OpenClaw native              | Dijembatani melalui adapter Codex                                          |
| Tool shell dan file native   | Jalur PI/OpenClaw                      | Tool native Codex, dijembatani melalui hook native jika didukung           |
| Mesin konteks                | Perakitan konteks OpenClaw native      | OpenClaw memproyeksikan konteks yang dirakit ke dalam turn Codex           |
| Compaction                   | OpenClaw atau mesin konteks yang dipilih | Compaction native Codex, dengan notifikasi OpenClaw dan pemeliharaan cermin |
| Pengiriman channel           | OpenClaw                               | OpenClaw                                                                   |

Pemisahan kepemilikan ini adalah aturan desain utama:

- Jika OpenClaw memiliki permukaan, OpenClaw dapat menyediakan perilaku hook plugin normal.
- Jika runtime native memiliki permukaan, OpenClaw membutuhkan event runtime atau hook native.
- Jika runtime native memiliki status thread kanonis, OpenClaw harus mencerminkan dan memproyeksikan konteks, bukan menulis ulang internal yang tidak didukung.

## Pemilihan runtime

OpenClaw memilih runtime tertanam setelah resolusi penyedia dan model:

1. Kebijakan runtime berlingkup model menang. Ini dapat berada di entri model penyedia
   yang dikonfigurasi atau di `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`.
2. Kebijakan runtime berlingkup penyedia berikutnya di
   `models.providers.<provider>.agentRuntime`.
3. Dalam mode `auto`, runtime plugin terdaftar dapat mengklaim pasangan penyedia/model
   yang didukung.
4. Jika tidak ada runtime yang mengklaim turn dalam mode `auto`, OpenClaw menggunakan PI sebagai
   runtime kompatibilitas. Gunakan id runtime eksplisit ketika eksekusi harus
   ketat.

Pin runtime seluruh sesi dan seluruh agen diabaikan. Itu mencakup
`OPENCLAW_AGENT_RUNTIME`, status sesi `agentHarnessId`/`agentRuntimeOverride`,
`agents.defaults.agentRuntime`, dan `agents.list[].agentRuntime`. Jalankan
`openclaw doctor --fix` untuk menghapus konfigurasi runtime seluruh agen yang basi dan mengonversi
ref model runtime legacy jika OpenClaw dapat mempertahankan niatnya.

Runtime plugin penyedia/model eksplisit gagal tertutup. Misalnya,
`agentRuntime.id: "codex"` pada penyedia atau model berarti Codex atau error
pemilihan/runtime yang jelas; itu tidak pernah secara diam-diam dirutekan kembali ke PI.

Alias backend CLI berbeda dari id harness tertanam. Bentuk Claude CLI yang disarankan adalah:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Ref legacy seperti `claude-cli/claude-opus-4-7` tetap didukung untuk
kompatibilitas, tetapi konfigurasi baru harus mempertahankan penyedia/model tetap kanonis dan menaruh
backend eksekusi dalam kebijakan runtime penyedia/model.

Mode `auto` sengaja konservatif untuk sebagian besar penyedia. Model agen OpenAI
adalah pengecualian: runtime yang tidak di-set dan `auto` keduanya terselesaikan ke harness Codex.
Konfigurasi runtime PI eksplisit tetap menjadi rute kompatibilitas opt-in untuk
turn agen `openai/*`; ketika dipasangkan dengan profil auth `openai-codex` yang dipilih,
OpenClaw merutekan PI secara internal melalui transport auth Codex legacy sambil
mempertahankan ref model publik sebagai `openai/*`. Pin sesi PI OpenAI basi
diabaikan oleh pemilihan runtime dan dapat dibersihkan dengan `openclaw doctor --fix`.

Jika `openclaw doctor` memperingatkan bahwa plugin `codex` diaktifkan sementara
`openai-codex/*` tetap ada di konfigurasi, perlakukan itu sebagai status rute legacy. Jalankan
`openclaw doctor --fix` untuk menulis ulangnya menjadi `openai/*` dengan runtime Codex.

## Kontrak kompatibilitas

Ketika runtime bukan PI, runtime tersebut harus mendokumentasikan permukaan OpenClaw yang didukungnya.
Gunakan bentuk ini untuk dokumen runtime:

| Pertanyaan                            | Mengapa ini penting                                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Siapa yang memiliki loop model?       | Menentukan di mana percobaan ulang, kelanjutan alat, dan keputusan jawaban akhir terjadi.                |
| Siapa yang memiliki riwayat utas kanonis? | Menentukan apakah OpenClaw dapat mengedit riwayat atau hanya mencerminkannya.                         |
| Apakah alat dinamis OpenClaw berfungsi? | Messaging, sesi, Cron, dan alat milik OpenClaw bergantung pada ini.                                    |
| Apakah hook alat dinamis berfungsi?   | Plugin mengharapkan `before_tool_call`, `after_tool_call`, dan middleware di sekitar alat milik OpenClaw. |
| Apakah hook alat native berfungsi?    | Shell, patch, dan alat milik runtime memerlukan dukungan hook native untuk kebijakan dan observasi.      |
| Apakah siklus hidup mesin konteks berjalan? | Plugin memori dan konteks bergantung pada siklus hidup assemble, ingest, after-turn, dan Compaction. |
| Data Compaction apa yang diekspos?    | Sebagian plugin hanya membutuhkan notifikasi, sementara yang lain membutuhkan metadata yang dipertahankan/dibuang. |
| Apa yang sengaja tidak didukung?      | Pengguna tidak boleh mengasumsikan kesetaraan PI ketika runtime native memiliki lebih banyak status.     |

Kontrak dukungan runtime Codex didokumentasikan di
[Runtime harness Codex](/id/plugins/codex-harness-runtime#v1-support-contract).

## Label status

Output status dapat menampilkan label `Execution` dan `Runtime` sekaligus. Bacalah sebagai
diagnostik, bukan sebagai nama penyedia.

- Referensi model seperti `openai/gpt-5.5` memberi tahu Anda penyedia/model yang dipilih.
- ID runtime seperti `codex` memberi tahu Anda loop mana yang mengeksekusi giliran.
- Label kanal seperti Telegram atau Discord memberi tahu Anda di mana percakapan berlangsung.

Jika suatu eksekusi masih menampilkan runtime yang tidak diharapkan, periksa kebijakan runtime
penyedia/model yang dipilih terlebih dahulu. Pin runtime sesi lama tidak lagi menentukan perutean.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [OpenAI](/id/providers/openai)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Loop agen](/id/concepts/agent-loop)
- [Model](/id/concepts/models)
- [Status](/id/cli/status)
