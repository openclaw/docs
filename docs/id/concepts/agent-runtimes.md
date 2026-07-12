---
read_when:
    - Anda sedang memilih antara OpenClaw, Codex, ACP, atau runtime agen native lainnya
    - Anda bingung dengan label penyedia/model/runtime dalam status atau konfigurasi
    - Anda sedang mendokumentasikan kesetaraan dukungan untuk harness native
summary: Cara OpenClaw memisahkan penyedia model, model, saluran, dan runtime agen
title: Runtime agen
x-i18n:
    generated_at: "2026-07-12T14:04:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Sebuah **runtime agen** memiliki satu perulangan model yang telah disiapkan: runtime ini menerima prompt,
mengendalikan keluaran model, menangani pemanggilan alat native, dan mengembalikan giliran yang telah selesai
ke OpenClaw.

Runtime mudah tertukar dengan penyedia karena keduanya muncul di sekitar konfigurasi
model. Keduanya merupakan lapisan yang berbeda:

| Lapisan       | Contoh                                       | Arti                                                                          |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| Penyedia      | `anthropic`, `github-copilot`, `openai`      | Cara OpenClaw mengautentikasi, menemukan model, dan menamai referensi model.  |
| Model         | `claude-opus-4-6`, `gpt-5.6-sol`             | Model yang dipilih untuk giliran agen.                                        |
| Runtime agen  | `claude-cli`, `codex`, `copilot`, `openclaw` | Perulangan tingkat rendah atau backend yang mengeksekusi giliran yang disiapkan. |
| Saluran       | Discord, Slack, Telegram, WhatsApp           | Tempat pesan masuk dan keluar dari OpenClaw.                                  |

Sebuah **harness** adalah implementasi yang menyediakan runtime agen (istilah
kode). Misalnya, harness Codex yang dibundel mengimplementasikan runtime `codex`.
Konfigurasi publik menggunakan `agentRuntime.id` pada entri penyedia atau model; kunci runtime
untuk keseluruhan agen merupakan warisan dan diabaikan. `openclaw doctor --fix` menghapus
sematan runtime lama untuk keseluruhan agen dan menulis ulang referensi model runtime warisan menjadi referensi
penyedia/model kanonis beserta kebijakan runtime yang dicakup per model jika diperlukan.

Dua keluarga runtime:

- **Harness tertanam** berjalan di dalam perulangan agen OpenClaw yang telah disiapkan:
  runtime bawaan `openclaw`, serta harness Plugin terdaftar seperti
  `codex` dan `copilot`.
- **Backend CLI** menjalankan proses CLI lokal sambil mempertahankan referensi model
  kanonis. Misalnya, `anthropic/claude-opus-4-8` dengan
  `agentRuntime.id: "claude-cli"` yang dicakup per model berarti "pilih model Anthropic, eksekusi
  melalui Claude CLI." `claude-cli` bukan id harness tertanam dan tidak boleh
  diteruskan ke pemilihan AgentHarness.

Harness `copilot` adalah harness Plugin eksternal yang terpisah dan bersifat ikut serta untuk
GitHub Copilot CLI; lihat [runtime agen GitHub Copilot](/id/plugins/copilot) untuk
keputusan yang ditujukan kepada pengguna antara runtime agen PI, Codex, dan GitHub Copilot.

## Permukaan Codex

Beberapa permukaan menggunakan nama Codex:

| Permukaan                                        | Nama/konfigurasi OpenClaw              | Fungsinya                                                                                                                 |
| ------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Runtime app-server Codex native                  | Referensi model `openai/*`              | Menjalankan giliran agen tertanam OpenAI melalui app-server Codex. Ini adalah pengaturan langganan ChatGPT/Codex yang umum. |
| Profil autentikasi OAuth Codex                   | Profil OAuth `openai`                   | Menyimpan autentikasi langganan ChatGPT/Codex yang digunakan oleh harness app-server Codex.                               |
| Adaptor ACP Codex                                | `runtime: "acp"`, `agentId: "codex"`    | Menjalankan Codex melalui bidang kontrol ACP/acpx eksternal. Gunakan hanya jika ACP/acpx diminta secara eksplisit.         |
| Kumpulan perintah kontrol percakapan Codex native | `/codex ...`                           | Mengikat, melanjutkan, mengarahkan, menghentikan, dan memeriksa utas app-server Codex dari percakapan.                    |
| Rute API Platform OpenAI untuk permukaan nonagen | `openai/*` ditambah autentikasi kunci API | API OpenAI langsung seperti gambar, embedding, ucapan, dan waktu nyata.                                                    |

Permukaan ini sengaja dibuat independen. Mengaktifkan Plugin `codex`
menyediakan fitur app-server native; `openclaw doctor --fix` menangani
perbaikan rute Codex warisan dan pembersihan sematan sesi usang. Memilih `openai/*`
untuk model agen kini berarti "jalankan ini melalui Codex", kecuali jika permukaan API
OpenAI nonagen sedang digunakan.

Pengaturan langganan ChatGPT/Codex yang umum menggunakan OAuth Codex untuk autentikasi, tetapi
mempertahankan referensi model sebagai `openai/*` dan memilih runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Artinya, OpenClaw memilih referensi model OpenAI, lalu meminta runtime
app-server Codex untuk menjalankan giliran agen tertanam. Ini bukan berarti "gunakan
penagihan API", dan bukan berarti saluran, katalog penyedia model, atau
penyimpanan sesi OpenClaw menjadi Codex.

Saat Plugin `codex` yang dibundel diaktifkan, gunakan permukaan perintah native `/codex`
(`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`,
`/codex stop`) untuk mengontrol Codex dengan bahasa alami sebagai pengganti ACP. Gunakan ACP untuk
Codex hanya jika pengguna secara eksplisit meminta ACP/acpx atau sedang menguji jalur adaptor ACP.
Claude Code, Gemini CLI, OpenCode, Cursor, dan harness eksternal serupa
tetap menggunakan ACP.

Pohon keputusan:

1. **Pengikatan/kontrol/utas/melanjutkan/mengarahkan/menghentikan Codex** -> permukaan perintah native `/codex` saat Plugin `codex` yang dibundel diaktifkan.
2. **Codex sebagai runtime tertanam** atau pengalaman agen Codex normal yang didukung langganan -> `openai/<model>`.
3. **OpenClaw dipilih secara eksplisit untuk model OpenAI** -> pertahankan referensi model sebagai `openai/<model>` dan atur kebijakan runtime penyedia/model menjadi `agentRuntime.id: "openclaw"`. Profil OAuth `openai` yang dipilih dirutekan secara internal melalui transportasi autentikasi Codex milik OpenClaw.
4. **Referensi model Codex warisan dalam konfigurasi** -> perbaiki dengan `openclaw doctor --fix` menjadi `openai/<model>`; doctor mempertahankan rute autentikasi Codex dengan menambahkan `agentRuntime.id: "codex"` yang dicakup per penyedia/model jika referensi model lama menyiratkannya. Referensi model **`codex-cli/*`** warisan diperbaiki menjadi rute app-server Codex `openai/<model>` yang sama; OpenClaw tidak lagi mempertahankan backend Codex CLI yang dibundel.
5. **ACP, acpx, atau adaptor ACP Codex diminta secara eksplisit** -> `runtime: "acp"` dan `agentId: "codex"`.
6. **Claude Code, Gemini CLI, OpenCode, Cursor, Droid, atau harness eksternal lainnya** -> ACP/acpx, bukan runtime subagen native.

| Yang Anda maksud...                    | Gunakan...                                      |
| -------------------------------------- | ----------------------------------------------- |
| Kontrol percakapan/utas app-server Codex | `/codex ...` dari Plugin `codex` yang dibundel |
| Runtime agen tertanam app-server Codex | Referensi model agen `openai/*`                 |
| OAuth OpenAI Codex                     | Profil OAuth `openai`                           |
| Claude Code atau harness eksternal lain | ACP/acpx                                       |

Untuk pemisahan prefiks keluarga OpenAI, lihat [OpenAI](/id/providers/openai) dan
[Penyedia model](/id/concepts/model-providers). Untuk kontrak dukungan runtime Codex,
lihat [Runtime harness Codex](/id/plugins/codex-harness-runtime#v1-support-contract).

## Kepemilikan runtime

Runtime yang berbeda memiliki bagian perulangan dalam cakupan yang berbeda:

| Permukaan                   | Tertanam OpenClaw                                     | App-server Codex                                                                  |
| --------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| Pemilik perulangan model    | OpenClaw, melalui runner tertanam OpenClaw             | App-server Codex                                                                  |
| Status utas kanonis         | Transkrip OpenClaw                                     | Utas Codex, beserta cerminan transkrip OpenClaw                                   |
| Alat dinamis OpenClaw       | Perulangan alat native OpenClaw                        | Dijembatani melalui adaptor Codex                                                  |
| Alat shell dan berkas native | Jalur OpenClaw                                        | Alat native Codex, dijembatani melalui hook native jika didukung                  |
| Mesin konteks               | Perakitan konteks native OpenClaw                      | OpenClaw memproyeksikan konteks yang dirakit ke dalam giliran Codex                |
| Compaction                  | OpenClaw atau mesin konteks yang dipilih               | Compaction native Codex, dengan notifikasi OpenClaw dan pemeliharaan cerminan     |
| Pengiriman saluran          | OpenClaw                                               | OpenClaw                                                                           |

Aturan desain: jika OpenClaw memiliki permukaan tersebut, OpenClaw dapat menyediakan perilaku hook
Plugin normal. Jika runtime native memiliki permukaan tersebut, OpenClaw memerlukan peristiwa runtime
atau hook native. Jika runtime native memiliki status utas kanonis,
OpenClaw mencerminkan dan memproyeksikan konteks alih-alih menulis ulang bagian internal
yang tidak didukung.

## Pemilihan runtime

OpenClaw menentukan runtime tertanam setelah penentuan penyedia dan model, dengan
urutan berikut:

1. **Kebijakan runtime yang dicakup per model** diutamakan. Kebijakan ini berada dalam entri model
   penyedia yang dikonfigurasi, atau dalam `agents.defaults.models["provider/model"].agentRuntime`
   / `agents.list[].models["provider/model"].agentRuntime`. Karakter pengganti penyedia
   seperti `agents.defaults.models["vllm/*"].agentRuntime` diterapkan
   setelah kebijakan model yang persis, sehingga model penyedia yang ditemukan secara dinamis dapat
   berbagi satu runtime tanpa menimpa pengecualian persis per model.
2. **Kebijakan runtime yang dicakup per penyedia**: `models.providers.<provider>.agentRuntime`.
3. **Mode `auto`**: runtime Plugin terdaftar dapat mengklaim pasangan penyedia/model yang didukung.
4. Jika tidak ada yang mengklaim giliran dalam mode `auto`, OpenClaw beralih ke
   `openclaw` sebagai runtime kompatibilitas. Gunakan id runtime eksplisit jika
   eksekusi harus ketat.

Sematan runtime untuk keseluruhan sesi dan keseluruhan agen diabaikan: `OPENCLAW_AGENT_RUNTIME`,
status sesi `agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime`,
dan `agents.list[].agentRuntime`. Jalankan `openclaw doctor --fix` untuk menghapus konfigurasi
runtime usang untuk keseluruhan agen dan mengonversi referensi model runtime warisan jika maksudnya
dapat dipertahankan.

Runtime Plugin penyedia/model eksplisit gagal secara tertutup: `agentRuntime.id: "codex"`
pada penyedia atau model berarti Codex, atau menghasilkan kesalahan pemilihan/runtime yang jelas—runtime tersebut
tidak pernah secara diam-diam dirutekan kembali ke OpenClaw. Hanya `auto` yang dapat merutekan giliran
yang tidak cocok ke OpenClaw.

Alias backend CLI berbeda dari id harness tertanam. Bentuk Claude CLI yang disarankan:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Referensi warisan seperti `claude-cli/claude-opus-4-7` tetap didukung untuk
kompatibilitas, tetapi konfigurasi baru harus mempertahankan penyedia/model kanonis dan
menempatkan backend eksekusi dalam kebijakan runtime penyedia/model.

Referensi `codex-cli/*` warisan berbeda: doctor memigrasikannya ke `openai/*` agar
referensi tersebut berjalan melalui harness app-server Codex alih-alih mempertahankan backend
Codex CLI.

Mode `auto` sengaja bersifat konservatif untuk sebagian besar penyedia. Model agen OpenAI
merupakan pengecualian: runtime yang tidak ditetapkan dan `auto` sama-sama ditentukan ke harness
Codex. Konfigurasi runtime OpenClaw eksplisit tetap menjadi rute kompatibilitas yang bersifat
ikut serta untuk giliran agen `openai/*`; saat dipasangkan dengan profil OAuth `openai`
yang dipilih, OpenClaw merutekan jalur tersebut secara internal melalui transportasi autentikasi
Codex sambil mempertahankan referensi model publik sebagai `openai/*`. Sematan sesi runtime OpenAI
yang usang diabaikan oleh pemilihan runtime dan dapat dibersihkan dengan
`openclaw doctor --fix`.

Jika `openclaw doctor` memperingatkan bahwa Plugin `codex` diaktifkan sementara referensi
model Codex warisan masih ada dalam konfigurasi, perlakukan hal tersebut sebagai status rute warisan dan jalankan
`openclaw doctor --fix` untuk menulis ulangnya menjadi `openai/*` dengan runtime Codex.

## Runtime agen GitHub Copilot

Plugin eksternal `@openclaw/copilot` mendaftarkan runtime `copilot` yang harus diaktifkan secara eksplisit
dan didukung oleh GitHub Copilot CLI (`@github/copilot-sdk`). Plugin ini mengklaim
penyedia langganan kanonis `github-copilot` dan **tidak pernah** dipilih oleh
`auto`. Aktifkan per model atau per penyedia melalui `agentRuntime.id`:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/gpt-5.5",
      models: {
        "github-copilot/gpt-5.5": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Harness mengklaim penyedia, runtime, kunci sesi CLI, dan prefiks profil autentikasinya
di `extensions/copilot/doctor-contract-api.ts`, yang dimuat otomatis oleh `openclaw doctor`.
Untuk konfigurasi, autentikasi, pencerminan transkrip, compaction, kontrak doctor
deklaratif, dan keputusan yang lebih luas antara PI, Codex, dan Copilot SDK,
lihat [runtime agen GitHub Copilot](/id/plugins/copilot).

## Kontrak kompatibilitas

Jika suatu runtime bukan OpenClaw, dokumentasinya harus menyatakan permukaan OpenClaw
mana yang didukungnya:

| Pertanyaan | Mengapa ini penting |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Siapa yang memiliki loop model? | Menentukan tempat percobaan ulang, kelanjutan alat, dan keputusan jawaban akhir dilakukan. |
| Siapa yang memiliki riwayat utas kanonis? | Menentukan apakah OpenClaw dapat mengedit riwayat atau hanya mencerminkannya. |
| Apakah alat dinamis OpenClaw berfungsi? | Perpesanan, sesi, cron, dan alat milik OpenClaw bergantung pada hal ini. |
| Apakah hook alat dinamis berfungsi? | Plugin mengharapkan `before_tool_call`, `after_tool_call`, dan middleware di sekitar alat milik OpenClaw. |
| Apakah hook alat native berfungsi? | Shell, patch, dan alat milik runtime memerlukan dukungan hook native untuk kebijakan dan observasi. |
| Apakah siklus hidup mesin konteks berjalan? | Plugin memori dan konteks bergantung pada siklus hidup perakitan, penyerapan, setelah giliran, dan compaction. |
| Data compaction apa yang diekspos? | Beberapa Plugin hanya memerlukan notifikasi; yang lain memerlukan metadata yang dipertahankan/dibuang. |
| Apa yang sengaja tidak didukung? | Pengguna tidak boleh menganggapnya setara dengan OpenClaw ketika runtime native memiliki lebih banyak status. |

Kontrak dukungan runtime Codex didokumentasikan dalam
[runtime harness Codex](/id/plugins/codex-harness-runtime#v1-support-contract).

## Label status

Keluaran status dapat menampilkan label `Execution` dan `Runtime`. Baca label tersebut sebagai
diagnostik, bukan nama penyedia:

- Referensi model seperti `openai/gpt-5.6-sol` adalah penyedia/model yang dipilih.
- ID runtime seperti `codex` adalah loop yang mengeksekusi giliran.
- Label kanal seperti Telegram atau Discord menunjukkan tempat percakapan berlangsung.

Jika suatu proses menunjukkan runtime yang tidak diharapkan, periksa terlebih dahulu kebijakan runtime
penyedia/model yang dipilih. Pin runtime sesi lama tidak lagi menentukan perutean.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Runtime agen GitHub Copilot](/id/plugins/copilot)
- [OpenAI](/id/providers/openai)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Loop agen](/id/concepts/agent-loop)
- [Model](/id/concepts/models)
- [Status](/id/cli/status)
