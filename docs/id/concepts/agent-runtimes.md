---
read_when:
    - Anda sedang memilih antara OpenClaw, Codex, ACP, atau runtime agen native lain
    - Anda bingung dengan label penyedia/model/runtime dalam status atau konfigurasi
    - Anda sedang mendokumentasikan kesetaraan dukungan untuk harness native
summary: Bagaimana OpenClaw memisahkan penyedia model, model, saluran, dan runtime agen
title: Runtime agen
x-i18n:
    generated_at: "2026-06-27T17:22:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb818e682ffb11a073ee0053c0e7b7e2ea60239141aab7f96cd82520ded9d22f
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Sebuah **runtime agen** adalah komponen yang memiliki satu loop model yang telah disiapkan: komponen ini menerima prompt, menggerakkan keluaran model, menangani panggilan tool native, dan mengembalikan giliran yang sudah selesai ke OpenClaw.

Runtime mudah tertukar dengan penyedia karena keduanya muncul di dekat konfigurasi model. Keduanya adalah lapisan yang berbeda:

| Lapisan       | Contoh                                       | Artinya                                                             |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| Penyedia      | `openai`, `anthropic`, `github-copilot`      | Cara OpenClaw melakukan autentikasi, menemukan model, dan menamai ref model. |
| Model         | `gpt-5.5`, `claude-opus-4-6`                 | Model yang dipilih untuk giliran agen.                              |
| Runtime agen  | `openclaw`, `codex`, `copilot`, `claude-cli` | Loop atau backend tingkat rendah yang mengeksekusi giliran yang telah disiapkan. |
| Saluran       | Telegram, Discord, Slack, WhatsApp           | Tempat pesan masuk dan keluar dari OpenClaw.                        |

Anda juga akan melihat kata **harness** di kode. Harness adalah implementasi yang menyediakan runtime agen. Misalnya, harness Codex bawaan mengimplementasikan runtime `codex`. Konfigurasi publik menggunakan `agentRuntime.id` pada entri penyedia atau model; kunci runtime seluruh agen bersifat legacy dan diabaikan. `openclaw doctor --fix` menghapus pin runtime seluruh agen lama dan menulis ulang ref model runtime legacy menjadi ref penyedia/model kanonis ditambah kebijakan runtime cakupan model jika diperlukan.

Ada dua keluarga runtime:

- **Harness tertanam** berjalan di dalam loop agen yang telah disiapkan OpenClaw. Saat ini ini mencakup runtime bawaan `openclaw` plus harness Plugin terdaftar seperti `codex` dan `copilot`.
- **Backend CLI** menjalankan proses CLI lokal sambil menjaga ref model tetap kanonis. Misalnya, `anthropic/claude-opus-4-8` dengan `agentRuntime.id: "claude-cli"` bercakupan model berarti "pilih model Anthropic, eksekusi melalui Claude CLI." `claude-cli` bukan id harness tertanam dan tidak boleh diteruskan ke pemilihan AgentHarness.

Harness `copilot` adalah harness Plugin eksternal terpisah yang bersifat opt-in untuk GitHub Copilot CLI; lihat [runtime agen GitHub Copilot](/id/plugins/copilot) untuk keputusan yang menghadap pengguna antara PI, Codex, dan runtime agen GitHub Copilot.

## Permukaan Codex

Sebagian besar kebingungan berasal dari beberapa permukaan berbeda yang memakai nama Codex:

| Permukaan                                       | Nama/konfigurasi OpenClaw            | Fungsinya                                                                                                      |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Runtime app-server Codex native                  | Ref model `openai/*`                 | Menjalankan giliran agen tertanam OpenAI melalui app-server Codex. Ini adalah penyiapan langganan ChatGPT/Codex yang umum. |
| Profil auth OAuth Codex                          | Profil OAuth `openai`                | Menyimpan auth langganan ChatGPT/Codex yang digunakan harness app-server Codex.                                |
| Adapter ACP Codex                                | `runtime: "acp"`, `agentId: "codex"` | Menjalankan Codex melalui bidang kendali ACP/acpx eksternal. Gunakan hanya ketika ACP/acpx diminta secara eksplisit. |
| Set perintah kontrol chat Codex native           | `/codex ...`                         | Mengikat, melanjutkan, mengarahkan, menghentikan, dan memeriksa thread app-server Codex dari chat.             |
| Rute API OpenAI Platform untuk permukaan non-agen | `openai/*` plus auth kunci API       | Digunakan untuk API OpenAI langsung seperti gambar, embedding, ucapan, dan realtime.                           |

Permukaan-permukaan itu sengaja dibuat independen. Mengaktifkan Plugin `codex` membuat fitur app-server native tersedia; `openclaw doctor --fix` memiliki perbaikan rute Codex legacy dan pembersihan pin sesi usang. Memilih `openai/*` untuk model agen kini berarti "jalankan ini melalui Codex" kecuali permukaan API OpenAI non-agen sedang digunakan.

Penyiapan langganan ChatGPT/Codex yang umum menggunakan OAuth Codex untuk auth, tetapi tetap memakai ref model `openai/*` dan memilih runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Itu berarti OpenClaw memilih ref model OpenAI, lalu meminta runtime app-server Codex menjalankan giliran agen tertanam. Itu tidak berarti "gunakan penagihan API," dan tidak berarti saluran, katalog penyedia model, atau penyimpanan sesi OpenClaw menjadi Codex.

Ketika Plugin `codex` bawaan diaktifkan, kontrol Codex bahasa alami harus menggunakan permukaan perintah native `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) alih-alih ACP. Gunakan ACP untuk Codex hanya ketika pengguna secara eksplisit meminta ACP/acpx atau sedang menguji jalur adapter ACP. Claude Code, Gemini CLI, OpenCode, Cursor, dan harness eksternal serupa tetap menggunakan ACP.

Ini adalah pohon keputusan yang menghadap agen:

1. Jika pengguna meminta **bind/control/thread/resume/steer/stop Codex**, gunakan permukaan perintah native `/codex` ketika Plugin `codex` bawaan diaktifkan.
2. Jika pengguna meminta **Codex sebagai runtime tertanam** atau menginginkan pengalaman agen Codex normal yang didukung langganan, gunakan `openai/<model>`.
3. Jika pengguna secara eksplisit memilih **OpenClaw untuk model OpenAI**, pertahankan ref model sebagai `openai/<model>` dan tetapkan kebijakan runtime penyedia/model ke `agentRuntime.id: "openclaw"`. Profil OAuth `openai` yang dipilih dirutekan secara internal melalui transport auth Codex milik OpenClaw.
4. Jika konfigurasi legacy masih berisi **ref model Codex legacy**, perbaiki menjadi `openai/<model>` dengan `openclaw doctor --fix`; doctor mempertahankan rute auth Codex dengan menambahkan `agentRuntime.id: "codex"` bercakupan penyedia/model jika ref model lama mengimplikasikannya.
   Ref model legacy **`codex-cli/*`** diperbaiki ke rute app-server Codex `openai/<model>` yang sama; OpenClaw tidak lagi mempertahankan backend CLI Codex bawaan.
5. Jika pengguna secara eksplisit mengatakan **ACP**, **acpx**, atau **adapter ACP Codex**, gunakan ACP dengan `runtime: "acp"` dan `agentId: "codex"`.
6. Jika permintaan adalah untuk **Claude Code, Gemini CLI, OpenCode, Cursor, Droid, atau harness eksternal lain**, gunakan ACP/acpx, bukan runtime sub-agen native.

| Yang Anda maksud...                  | Gunakan...                                  |
| ------------------------------------ | ------------------------------------------- |
| Kontrol chat/thread app-server Codex | `/codex ...` dari Plugin `codex` bawaan     |
| Runtime agen tertanam app-server Codex | Ref model agen `openai/*`                 |
| OAuth OpenAI Codex                   | Profil OAuth `openai`                       |
| Claude Code atau harness eksternal lain | ACP/acpx                                  |

Untuk pemisahan prefiks keluarga OpenAI, lihat [OpenAI](/id/providers/openai) dan [Penyedia model](/id/concepts/model-providers). Untuk kontrak dukungan runtime Codex, lihat [Runtime harness Codex](/id/plugins/codex-harness-runtime#v1-support-contract).

## Kepemilikan runtime

Runtime yang berbeda memiliki bagian loop yang berbeda.

| Permukaan                   | Tertanam OpenClaw                            | App-server Codex                                                            |
| --------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| Pemilik loop model          | OpenClaw melalui runner tertanam OpenClaw     | App-server Codex                                                            |
| Status thread kanonis       | Transkrip OpenClaw                            | Thread Codex, plus cermin transkrip OpenClaw                                |
| Tool dinamis OpenClaw       | Loop tool OpenClaw native                     | Dijembatani melalui adapter Codex                                           |
| Tool shell dan file native  | Jalur OpenClaw                                | Tool native Codex, dijembatani melalui hook native jika didukung            |
| Mesin konteks               | Perakitan konteks native OpenClaw             | OpenClaw merangkai konteks proyek ke dalam giliran Codex                    |
| Compaction                  | OpenClaw atau mesin konteks yang dipilih      | Compaction native Codex, dengan notifikasi OpenClaw dan pemeliharaan cermin |
| Pengiriman saluran          | OpenClaw                                      | OpenClaw                                                                    |

Pemisahan kepemilikan ini adalah aturan desain utama:

- Jika OpenClaw memiliki permukaan, OpenClaw dapat menyediakan perilaku hook Plugin normal.
- Jika runtime native memiliki permukaan, OpenClaw memerlukan event runtime atau hook native.
- Jika runtime native memiliki status thread kanonis, OpenClaw harus mencerminkan dan memproyeksikan konteks, bukan menulis ulang internal yang tidak didukung.

## Pemilihan runtime

OpenClaw memilih runtime tertanam setelah resolusi penyedia dan model:

1. Kebijakan runtime bercakupan model menang. Ini dapat berada di entri model penyedia yang dikonfigurasi atau di `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`. Wildcard penyedia seperti `agents.defaults.models["vllm/*"].agentRuntime` diterapkan setelah kebijakan model persis, sehingga model penyedia yang ditemukan secara dinamis dapat berbagi satu runtime tanpa menimpa pengecualian persis per model.
2. Kebijakan runtime bercakupan penyedia berikutnya di `models.providers.<provider>.agentRuntime`.
3. Dalam mode `auto`, runtime Plugin terdaftar dapat mengklaim pasangan penyedia/model yang didukung.
4. Jika tidak ada runtime yang mengklaim giliran dalam mode `auto`, OpenClaw menggunakan `openclaw` sebagai runtime kompatibilitas. Gunakan id runtime eksplisit ketika proses harus ketat.

Pin runtime seluruh sesi dan seluruh agen diabaikan. Itu mencakup `OPENCLAW_AGENT_RUNTIME`, status sesi `agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime`, dan `agents.list[].agentRuntime`. Jalankan `openclaw doctor --fix` untuk menghapus konfigurasi runtime seluruh agen yang usang dan mengonversi ref model runtime legacy jika OpenClaw dapat mempertahankan maksudnya.

Runtime Plugin penyedia/model eksplisit gagal tertutup. Misalnya, `agentRuntime.id: "codex"` pada penyedia atau model berarti Codex atau error pemilihan/runtime yang jelas; itu tidak pernah diam-diam dirutekan kembali ke OpenClaw.

Alias backend CLI berbeda dari id harness tertanam. Bentuk Claude CLI yang disarankan adalah:

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

Ref legacy seperti `claude-cli/claude-opus-4-7` tetap didukung untuk kompatibilitas, tetapi konfigurasi baru harus menjaga penyedia/model tetap kanonis dan menaruh backend eksekusi di kebijakan runtime penyedia/model.

Ref legacy `codex-cli/*` berbeda: doctor memigrasikannya ke `openai/*` agar berjalan melalui harness app-server Codex alih-alih mempertahankan backend CLI Codex.

Mode `auto` sengaja konservatif untuk sebagian besar penyedia. Model agen OpenAI adalah pengecualian: runtime yang tidak disetel dan `auto` sama-sama beresolusi ke harness Codex. Konfigurasi runtime OpenClaw eksplisit tetap menjadi rute kompatibilitas opt-in untuk giliran agen `openai/*`; ketika dipasangkan dengan profil OAuth `openai` yang dipilih, OpenClaw merutekan jalur itu secara internal melalui transport auth Codex sambil menjaga ref model publik sebagai `openai/*`. Pin sesi runtime OpenAI usang diabaikan oleh pemilihan runtime dan dapat dibersihkan dengan `openclaw doctor --fix`.

Jika `openclaw doctor` memperingatkan bahwa Plugin `codex` diaktifkan sementara
ref model Codex lama masih ada dalam konfigurasi, perlakukan itu sebagai status rute lama. Jalankan
`openclaw doctor --fix` untuk menulis ulangnya ke `openai/*` dengan runtime Codex.

## Runtime agen GitHub Copilot

Plugin eksternal `@openclaw/copilot` mendaftarkan runtime `copilot` yang bersifat opt-in
dan didukung oleh GitHub Copilot CLI (`@github/copilot-sdk`). Plugin ini mengklaim
penyedia langganan kanonis `github-copilot` dan **tidak pernah** dipilih oleh
`auto`. Ikut serta per model atau per penyedia melalui `agentRuntime.id`:

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

Harness mengklaim penyedia, runtime, kunci sesi CLI, dan prefiks profil auth
miliknya di `extensions/copilot/doctor-contract-api.ts`, yang dimuat otomatis oleh
`openclaw doctor`. Untuk konfigurasi, auth, pencerminan transkrip,
Compaction, kontrak doctor deklaratif, dan keputusan SDK PI vs Codex vs
Copilot yang lebih luas, lihat [runtime agen GitHub Copilot](/id/plugins/copilot).

## Kontrak kompatibilitas

Saat sebuah runtime bukan OpenClaw, runtime tersebut harus mendokumentasikan permukaan OpenClaw apa yang didukungnya.
Gunakan bentuk ini untuk dokumentasi runtime:

| Pertanyaan                            | Mengapa ini penting                                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Siapa yang memiliki loop model?       | Menentukan di mana retry, kelanjutan tool, dan keputusan jawaban akhir terjadi.                     |
| Siapa yang memiliki riwayat thread kanonis? | Menentukan apakah OpenClaw dapat mengedit riwayat atau hanya mencerminkannya.                 |
| Apakah tool dinamis OpenClaw berfungsi? | Messaging, sesi, Cron, dan tool milik OpenClaw bergantung pada ini.                              |
| Apakah hook tool dinamis berfungsi?   | Plugin mengharapkan `before_tool_call`, `after_tool_call`, dan middleware di sekitar tool milik OpenClaw. |
| Apakah hook tool native berfungsi?    | Shell, patch, dan tool milik runtime memerlukan dukungan hook native untuk kebijakan dan observasi. |
| Apakah siklus hidup mesin konteks berjalan? | Plugin memori dan konteks bergantung pada siklus hidup assemble, ingest, after-turn, dan Compaction. |
| Data Compaction apa yang diekspos?    | Sebagian Plugin hanya memerlukan notifikasi, sementara yang lain memerlukan metadata yang dipertahankan/dibuang. |
| Apa yang sengaja tidak didukung?      | Pengguna tidak boleh mengasumsikan kesetaraan OpenClaw saat runtime native memiliki lebih banyak status. |

Kontrak dukungan runtime Codex didokumentasikan di
[runtime harness Codex](/id/plugins/codex-harness-runtime#v1-support-contract).

## Label status

Output status dapat menampilkan label `Execution` dan `Runtime` sekaligus. Bacalah keduanya sebagai
diagnostik, bukan sebagai nama penyedia.

- Ref model seperti `openai/gpt-5.5` memberi tahu Anda penyedia/model yang dipilih.
- Id runtime seperti `codex` memberi tahu Anda loop mana yang mengeksekusi turn.
- Label channel seperti Telegram atau Discord memberi tahu Anda di mana percakapan terjadi.

Jika sebuah run masih menampilkan runtime yang tidak diharapkan, periksa kebijakan runtime
penyedia/model yang dipilih terlebih dahulu. Pin runtime sesi lama tidak lagi menentukan routing.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Runtime agen GitHub Copilot](/id/plugins/copilot)
- [OpenAI](/id/providers/openai)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Loop agen](/id/concepts/agent-loop)
- [Model](/id/concepts/models)
- [Status](/id/cli/status)
