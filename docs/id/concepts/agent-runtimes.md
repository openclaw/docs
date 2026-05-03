---
read_when:
    - Anda sedang memilih antara PI, Codex, ACP, atau lingkungan eksekusi agen asli lainnya
    - Anda bingung dengan label penyedia/model/waktu eksekusi dalam status atau konfigurasi
    - Anda mendokumentasikan paritas dukungan untuk kerangka uji native.
summary: Cara OpenClaw memisahkan penyedia model, model, saluran, dan runtime agen
title: Runtime agen
x-i18n:
    generated_at: "2026-05-03T09:15:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cd0e0e8508f88c04db63ebcbbca61d9a023ee661f59ea1ed7a1341b357088c7
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**Runtime agen** adalah komponen yang memiliki satu loop model yang sudah disiapkan: komponen ini
menerima prompt, menjalankan keluaran model, menangani pemanggilan tool native, dan mengembalikan
turn yang selesai ke OpenClaw.

Runtime mudah tertukar dengan penyedia karena keduanya muncul di sekitar konfigurasi
model. Keduanya adalah lapisan yang berbeda:

| Lapisan       | Contoh                                | Artinya                                                             |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Penyedia      | `openai`, `anthropic`, `openai-codex` | Cara OpenClaw mengautentikasi, menemukan model, dan menamai ref model. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Model yang dipilih untuk turn agen.                                 |
| Runtime agen  | `pi`, `codex`, `claude-cli`           | Loop atau backend tingkat rendah yang mengeksekusi turn yang sudah disiapkan. |
| Saluran       | Telegram, Discord, Slack, WhatsApp    | Tempat pesan masuk dan keluar dari OpenClaw.                        |

Anda juga akan melihat kata **harness** di kode. Harness adalah implementasi
yang menyediakan runtime agen. Misalnya, harness Codex bawaan
mengimplementasikan runtime `codex`. Konfigurasi publik menggunakan `agentRuntime.id`; `openclaw
doctor --fix` menulis ulang kunci runtime-policy lama ke bentuk tersebut.

Ada dua keluarga runtime:

- **Harness tertanam** berjalan di dalam loop agen OpenClaw yang sudah disiapkan. Saat ini ini
  adalah runtime `pi` bawaan ditambah harness Plugin terdaftar seperti
  `codex`.
- **Backend CLI** menjalankan proses CLI lokal sambil menjaga ref model tetap
  kanonis. Misalnya, `anthropic/claude-opus-4-7` dengan
  `agentRuntime.id: "claude-cli"` berarti "pilih model Anthropic, eksekusi
  melalui Claude CLI." `claude-cli` bukan id harness tertanam dan tidak boleh
  diteruskan ke pemilihan AgentHarness.

## Permukaan Codex

Sebagian besar kebingungan berasal dari beberapa permukaan berbeda yang memakai nama Codex:

| Permukaan                                            | Nama/konfigurasi OpenClaw                 | Fungsinya                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Runtime app-server Codex native                      | `openai/*` plus `agentRuntime.id: "codex"` | Menjalankan turn agen tertanam melalui app-server Codex. Ini adalah pengaturan langganan ChatGPT/Codex yang umum. |
| Rute penyedia OAuth Codex                            | ref model `openai-codex/*`                | Menggunakan OAuth langganan ChatGPT/Codex melalui runner PI OpenClaw normal.                               |
| Adapter ACP Codex                                    | `runtime: "acp"`, `agentId: "codex"`       | Menjalankan Codex melalui bidang kontrol ACP/acpx eksternal. Gunakan hanya saat ACP/acpx diminta secara eksplisit. |
| Set perintah kontrol chat Codex native               | `/codex ...`                               | Mengikat, melanjutkan, mengarahkan, menghentikan, dan memeriksa thread app-server Codex dari chat.         |
| Rute OpenAI Platform API untuk model gaya GPT/Codex  | ref model `openai/*`                      | Menggunakan autentikasi kunci API OpenAI kecuali override runtime, seperti `agentRuntime.id: "codex"`, menjalankan turn. |

Permukaan tersebut sengaja dibuat independen. Mengaktifkan Plugin `codex` membuat
fitur app-server native tersedia; ini tidak menulis ulang
`openai-codex/*` menjadi `openai/*`, tidak mengubah sesi yang ada, dan tidak
menjadikan ACP sebagai default Codex. Memilih `openai-codex/*` berarti "gunakan rute
penyedia OAuth Codex" kecuali Anda secara terpisah memaksa runtime.

Pengaturan langganan ChatGPT/Codex yang umum menggunakan OAuth Codex untuk autentikasi, tetapi mempertahankan
ref model sebagai `openai/*` dan memilih runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Itu berarti OpenClaw memilih ref model OpenAI, lalu meminta runtime app-server Codex
untuk menjalankan turn agen tertanam. Itu tidak berarti "gunakan penagihan API," dan
itu tidak berarti saluran, katalog penyedia model, atau penyimpanan sesi OpenClaw
menjadi Codex.

Saat Plugin `codex` bawaan diaktifkan, kontrol Codex berbahasa alami
sebaiknya menggunakan permukaan perintah `/codex` native (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) alih-alih ACP. Gunakan ACP untuk
Codex hanya saat pengguna secara eksplisit meminta ACP/acpx atau sedang menguji jalur
adapter ACP. Claude Code, Gemini CLI, OpenCode, Cursor, dan harness eksternal serupa
tetap menggunakan ACP.

Ini adalah pohon keputusan yang dihadapi agen:

1. Jika pengguna meminta **bind/kontrol/thread/resume/steer/stop Codex**, gunakan
   permukaan perintah `/codex` native saat Plugin `codex` bawaan diaktifkan.
2. Jika pengguna meminta **Codex sebagai runtime tertanam** atau menginginkan pengalaman agen Codex
   normal yang didukung langganan, gunakan
   `openai/<model>` dengan `agentRuntime.id: "codex"`.
3. Jika pengguna meminta **autentikasi OAuth/langganan Codex pada runner OpenClaw
   normal**, gunakan `openai-codex/<model>` dan biarkan runtime sebagai PI.
4. Jika pengguna secara eksplisit mengatakan **ACP**, **acpx**, atau **adapter ACP Codex**, gunakan
   ACP dengan `runtime: "acp"` dan `agentId: "codex"`.
5. Jika permintaan adalah untuk **Claude Code, Gemini CLI, OpenCode, Cursor, Droid, atau
   harness eksternal lain**, gunakan ACP/acpx, bukan runtime sub-agen native.

| Maksud Anda...                         | Gunakan...                                  |
| --------------------------------------- | -------------------------------------------- |
| Kontrol chat/thread app-server Codex    | `/codex ...` dari Plugin `codex` bawaan     |
| Runtime agen tertanam app-server Codex  | `agentRuntime.id: "codex"`                   |
| OAuth OpenAI Codex pada runner PI       | ref model `openai-codex/*`                  |
| Claude Code atau harness eksternal lain | ACP/acpx                                     |

Untuk pemisahan prefiks keluarga OpenAI, lihat [OpenAI](/id/providers/openai) dan
[Penyedia model](/id/concepts/model-providers). Untuk kontrak dukungan runtime Codex,
lihat [Harness Codex](/id/plugins/codex-harness#v1-support-contract).

## Kepemilikan runtime

Runtime yang berbeda memiliki bagian loop yang berbeda.

| Permukaan                   | OpenClaw PI tertanam                   | App-server Codex                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Pemilik loop model          | OpenClaw melalui runner PI tertanam     | App-server Codex                                                            |
| Status thread kanonis       | Transkrip OpenClaw                      | Thread Codex, ditambah cermin transkrip OpenClaw                            |
| Tool dinamis OpenClaw       | Loop tool OpenClaw native               | Dijembatani melalui adapter Codex                                           |
| Tool shell dan file native  | Jalur PI/OpenClaw                       | Tool native Codex, dijembatani melalui hook native jika didukung            |
| Mesin konteks               | Perakitan konteks OpenClaw native       | OpenClaw menyusun konteks proyek ke dalam turn Codex                        |
| Compaction                  | OpenClaw atau mesin konteks terpilih    | Compaction native Codex, dengan notifikasi OpenClaw dan pemeliharaan cermin |
| Pengiriman saluran          | OpenClaw                                | OpenClaw                                                                    |

Pemisahan kepemilikan ini adalah aturan desain utama:

- Jika OpenClaw memiliki permukaan, OpenClaw dapat menyediakan perilaku hook Plugin normal.
- Jika runtime native memiliki permukaan, OpenClaw memerlukan event runtime atau hook native.
- Jika runtime native memiliki status thread kanonis, OpenClaw sebaiknya mencerminkan dan memproyeksikan konteks, bukan menulis ulang internal yang tidak didukung.

## Pemilihan runtime

OpenClaw memilih runtime tertanam setelah resolusi penyedia dan model:

1. Runtime yang tercatat dalam sesi menang. Perubahan konfigurasi tidak melakukan hot-switch
   transkrip yang ada ke sistem thread native yang berbeda.
2. `OPENCLAW_AGENT_RUNTIME=<id>` memaksa runtime tersebut untuk sesi baru atau yang direset.
3. `agents.defaults.agentRuntime.id` atau `agents.list[].agentRuntime.id` dapat menetapkan
   `auto`, `pi`, id harness tertanam terdaftar seperti `codex`, atau alias backend CLI
   yang didukung seperti `claude-cli`.
4. Dalam mode `auto`, runtime Plugin terdaftar dapat mengklaim pasangan penyedia/model
   yang didukung.
5. Jika tidak ada runtime yang mengklaim turn dalam mode `auto`, OpenClaw menggunakan PI sebagai
   runtime kompatibilitas. Gunakan id runtime eksplisit saat run harus
   ketat.

Runtime Plugin eksplisit gagal secara tertutup. Misalnya, `agentRuntime.id: "codex"`
berarti Codex atau kesalahan pemilihan/runtime yang jelas; ini tidak pernah secara diam-diam dirutekan kembali
ke PI.

Alias backend CLI berbeda dari id harness tertanam. Bentuk Claude CLI yang disarankan adalah:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

Ref lama seperti `claude-cli/claude-opus-4-7` tetap didukung untuk
kompatibilitas, tetapi konfigurasi baru sebaiknya menjaga penyedia/model tetap kanonis dan menaruh
backend eksekusi di `agentRuntime.id`.

Mode `auto` sengaja konservatif. Runtime Plugin dapat mengklaim
pasangan penyedia/model yang mereka pahami, tetapi Plugin Codex tidak mengklaim
penyedia `openai-codex` dalam mode `auto`. Itu mempertahankan
`openai-codex/*` sebagai rute OAuth Codex PI eksplisit dan menghindari pemindahan diam-diam
konfigurasi autentikasi langganan ke harness app-server native.

Jika `openclaw doctor` memperingatkan bahwa Plugin `codex` diaktifkan sementara
`openai-codex/*` masih dirutekan melalui PI, anggap itu sebagai diagnosis, bukan
migrasi. Biarkan konfigurasi tidak berubah saat OAuth Codex PI adalah yang Anda inginkan.
Beralih ke `openai/<model>` plus `agentRuntime.id: "codex"` hanya saat Anda menginginkan eksekusi
app-server Codex native.

## Kontrak kompatibilitas

Saat runtime bukan PI, runtime tersebut sebaiknya mendokumentasikan permukaan OpenClaw yang didukungnya.
Gunakan bentuk ini untuk dokumentasi runtime:

| Pertanyaan                            | Mengapa ini penting                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Siapa yang memiliki loop model?        | Menentukan tempat retry, kelanjutan tool, dan keputusan jawaban akhir terjadi.                    |
| Siapa yang memiliki riwayat thread kanonis? | Menentukan apakah OpenClaw dapat mengedit riwayat atau hanya mencerminkannya.                  |
| Apakah tool dinamis OpenClaw berfungsi? | Pesan, sesi, cron, dan tool milik OpenClaw bergantung pada ini.                                  |
| Apakah hook tool dinamis berfungsi?    | Plugin mengharapkan `before_tool_call`, `after_tool_call`, dan middleware di sekitar tool milik OpenClaw. |
| Apakah hook tool native berfungsi?     | Shell, patch, dan tool milik runtime memerlukan dukungan hook native untuk kebijakan dan observasi. |
| Apakah siklus hidup mesin konteks berjalan? | Plugin memori dan konteks bergantung pada siklus hidup assemble, ingest, after-turn, dan compaction. |
| Data compaction apa yang diekspos?     | Sebagian Plugin hanya memerlukan notifikasi, sementara yang lain memerlukan metadata yang disimpan/dihapus. |
| Apa yang sengaja tidak didukung?       | Pengguna tidak boleh mengasumsikan kesetaraan PI ketika runtime native memiliki lebih banyak status. |

Kontrak dukungan runtime Codex didokumentasikan di
[Harness Codex](/id/plugins/codex-harness#v1-support-contract).

## Label status

Output status mungkin menampilkan label `Execution` dan `Runtime`. Baca keduanya sebagai
diagnostik, bukan sebagai nama penyedia.

- Referensi model seperti `openai/gpt-5.5` memberi tahu Anda penyedia/model yang dipilih.
- ID runtime seperti `codex` memberi tahu Anda loop mana yang mengeksekusi giliran tersebut.
- Label saluran seperti Telegram atau Discord memberi tahu Anda di mana percakapan berlangsung.

Jika sesi masih menampilkan PI setelah mengubah konfigurasi runtime, mulai sesi baru
dengan `/new` atau kosongkan sesi saat ini dengan `/reset`. Sesi yang sudah ada mempertahankan
runtime yang terekam sehingga transkrip tidak diputar ulang melalui dua sistem sesi native
yang tidak kompatibel.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [OpenAI](/id/providers/openai)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Loop agen](/id/concepts/agent-loop)
- [Model](/id/concepts/models)
- [Status](/id/cli/status)
