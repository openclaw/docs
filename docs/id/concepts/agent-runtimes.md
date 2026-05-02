---
read_when:
    - Anda sedang memilih antara PI, Codex, ACP, atau runtime agen native lainnya
    - Anda bingung dengan label penyedia/model/runtime dalam status atau konfigurasi
    - Anda sedang mendokumentasikan kesetaraan dukungan untuk kerangka pengujian asli
summary: Cara OpenClaw memisahkan penyedia model, model, saluran, dan runtime agen
title: Lingkungan eksekusi agen
x-i18n:
    generated_at: "2026-05-02T09:17:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: bae2dd55491e5411983da942b2bdc4868d3b2cb5a4eb5d94fbb5a779dc4d679a
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**runtime agen** adalah komponen yang memiliki satu loop model yang sudah disiapkan: komponen ini menerima prompt, menggerakkan output model, menangani pemanggilan alat native, dan mengembalikan giliran yang selesai ke OpenClaw.

Runtime mudah tertukar dengan penyedia karena keduanya muncul di dekat konfigurasi model. Keduanya adalah lapisan yang berbeda:

| Lapisan       | Contoh                                | Artinya                                                            |
| ------------- | ------------------------------------- | ------------------------------------------------------------------ |
| Penyedia      | `openai`, `anthropic`, `openai-codex` | Cara OpenClaw mengautentikasi, menemukan model, dan menamai ref model. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Model yang dipilih untuk giliran agen.                             |
| Runtime agen  | `pi`, `codex`, `claude-cli`           | Loop atau backend tingkat rendah yang mengeksekusi giliran yang sudah disiapkan. |
| Kanal         | Telegram, Discord, Slack, WhatsApp    | Tempat pesan masuk dan keluar dari OpenClaw.                       |

Anda juga akan melihat kata **harness** di kode. Harness adalah implementasi yang menyediakan runtime agen. Misalnya, harness Codex bawaan mengimplementasikan runtime `codex`. Konfigurasi publik menggunakan `agentRuntime.id`; `openclaw doctor --fix` menulis ulang kunci kebijakan runtime lama ke bentuk tersebut.

Ada dua keluarga runtime:

- **Harness tertanam** berjalan di dalam loop agen OpenClaw yang sudah disiapkan. Saat ini ini adalah runtime `pi` bawaan ditambah harness Plugin terdaftar seperti `codex`.
- **Backend CLI** menjalankan proses CLI lokal sambil mempertahankan ref model kanonis. Misalnya, `anthropic/claude-opus-4-7` dengan `agentRuntime.id: "claude-cli"` berarti "pilih model Anthropic, eksekusi melalui Claude CLI." `claude-cli` bukan id harness tertanam dan tidak boleh diteruskan ke pemilihan AgentHarness.

## Permukaan Codex

Sebagian besar kebingungan berasal dari beberapa permukaan berbeda yang berbagi nama Codex:

| Permukaan                                            | Nama/konfigurasi OpenClaw                  | Yang dilakukan                                                                                              |
| ---------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Runtime app-server Codex native                      | `openai/*` plus `agentRuntime.id: "codex"` | Menjalankan giliran agen tertanam melalui Codex app-server. Ini adalah penyiapan langganan ChatGPT/Codex yang umum. |
| Rute penyedia OAuth Codex                            | ref model `openai-codex/*`                 | Menggunakan OAuth langganan ChatGPT/Codex melalui runner PI OpenClaw normal.                               |
| Adapter ACP Codex                                    | `runtime: "acp"`, `agentId: "codex"`       | Menjalankan Codex melalui bidang kontrol ACP/acpx eksternal. Gunakan hanya ketika ACP/acpx diminta secara eksplisit. |
| Kumpulan perintah kontrol chat Codex native          | `/codex ...`                               | Mengikat, melanjutkan, mengarahkan, menghentikan, dan memeriksa thread Codex app-server dari chat.         |
| Rute OpenAI Platform API untuk model bergaya GPT/Codex | ref model `openai/*`                     | Menggunakan auth kunci API OpenAI kecuali override runtime, seperti `agentRuntime.id: "codex"`, menjalankan giliran. |

Permukaan-permukaan tersebut sengaja dibuat independen. Mengaktifkan Plugin `codex` membuat fitur app-server native tersedia; itu tidak menulis ulang `openai-codex/*` menjadi `openai/*`, tidak mengubah sesi yang sudah ada, dan tidak menjadikan ACP default Codex. Memilih `openai-codex/*` berarti "gunakan rute penyedia OAuth Codex" kecuali Anda secara terpisah memaksa runtime.

Penyiapan langganan ChatGPT/Codex yang umum menggunakan OAuth Codex untuk auth, tetapi mempertahankan ref model sebagai `openai/*` dan memilih runtime `codex`:

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

Itu berarti OpenClaw memilih ref model OpenAI, lalu meminta runtime Codex app-server menjalankan giliran agen tertanam. Itu tidak berarti "gunakan penagihan API," dan tidak berarti kanal, katalog penyedia model, atau penyimpanan sesi OpenClaw menjadi Codex.

Ketika Plugin `codex` bawaan diaktifkan, kontrol Codex dengan bahasa alami sebaiknya menggunakan permukaan perintah `/codex` native (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) alih-alih ACP. Gunakan ACP untuk Codex hanya ketika pengguna secara eksplisit meminta ACP/acpx atau sedang menguji jalur adapter ACP. Claude Code, Gemini CLI, OpenCode, Cursor, dan harness eksternal serupa tetap menggunakan ACP.

Ini adalah pohon keputusan yang dihadapi agen:

1. Jika pengguna meminta **bind/kontrol/thread/resume/steer/stop Codex**, gunakan permukaan perintah `/codex` native ketika Plugin `codex` bawaan diaktifkan.
2. Jika pengguna meminta **Codex sebagai runtime tertanam** atau menginginkan pengalaman agen Codex normal yang didukung langganan, gunakan `openai/<model>` dengan `agentRuntime.id: "codex"`.
3. Jika pengguna meminta **auth OAuth/langganan Codex pada runner OpenClaw normal**, gunakan `openai-codex/<model>` dan biarkan runtime sebagai PI.
4. Jika pengguna secara eksplisit mengatakan **ACP**, **acpx**, atau **adapter ACP Codex**, gunakan ACP dengan `runtime: "acp"` dan `agentId: "codex"`.
5. Jika permintaan adalah untuk **Claude Code, Gemini CLI, OpenCode, Cursor, Droid, atau harness eksternal lain**, gunakan ACP/acpx, bukan runtime sub-agen native.

| Maksud Anda...                         | Gunakan...                                  |
| -------------------------------------- | ------------------------------------------- |
| Kontrol chat/thread Codex app-server   | `/codex ...` dari Plugin `codex` bawaan     |
| Runtime agen tertanam Codex app-server | `agentRuntime.id: "codex"`                  |
| OAuth OpenAI Codex pada runner PI      | ref model `openai-codex/*`                  |
| Claude Code atau harness eksternal lain | ACP/acpx                                    |

Untuk pemisahan prefiks keluarga OpenAI, lihat [OpenAI](/id/providers/openai) dan [Penyedia model](/id/concepts/model-providers). Untuk kontrak dukungan runtime Codex, lihat [Harness Codex](/id/plugins/codex-harness#v1-support-contract).

## Kepemilikan runtime

Runtime yang berbeda memiliki bagian loop yang berbeda.

| Permukaan                   | OpenClaw PI tertanam                    | Codex app-server                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Pemilik loop model          | OpenClaw melalui runner PI tertanam     | Codex app-server                                                            |
| Status thread kanonis       | Transkrip OpenClaw                      | Thread Codex, ditambah mirror transkrip OpenClaw                            |
| Alat dinamis OpenClaw       | Loop alat OpenClaw native               | Dijembatani melalui adapter Codex                                           |
| Alat shell dan file native  | Jalur PI/OpenClaw                       | Alat native Codex, dijembatani melalui hook native jika didukung            |
| Mesin konteks               | Perakitan konteks OpenClaw native       | OpenClaw memproyeksikan konteks yang dirakit ke dalam giliran Codex         |
| Compaction                  | OpenClaw atau mesin konteks yang dipilih | Compaction native Codex, dengan notifikasi OpenClaw dan pemeliharaan mirror |
| Pengiriman kanal            | OpenClaw                                | OpenClaw                                                                    |

Pembagian kepemilikan ini adalah aturan desain utama:

- Jika OpenClaw memiliki permukaan, OpenClaw dapat menyediakan perilaku hook Plugin normal.
- Jika runtime native memiliki permukaan, OpenClaw membutuhkan peristiwa runtime atau hook native.
- Jika runtime native memiliki status thread kanonis, OpenClaw harus me-mirror dan memproyeksikan konteks, bukan menulis ulang internal yang tidak didukung.

## Pemilihan runtime

OpenClaw memilih runtime tertanam setelah resolusi penyedia dan model:

1. Runtime yang tercatat pada sesi menang. Perubahan konfigurasi tidak langsung mengalihkan transkrip yang sudah ada ke sistem thread native yang berbeda.
2. `OPENCLAW_AGENT_RUNTIME=<id>` memaksa runtime tersebut untuk sesi baru atau sesi yang direset.
3. `agents.defaults.agentRuntime.id` atau `agents.list[].agentRuntime.id` dapat menetapkan `auto`, `pi`, id harness tertanam terdaftar seperti `codex`, atau alias backend CLI yang didukung seperti `claude-cli`.
4. Dalam mode `auto`, runtime Plugin terdaftar dapat mengklaim pasangan penyedia/model yang didukung.
5. Jika tidak ada runtime yang mengklaim giliran dalam mode `auto` dan `fallback: "pi"` ditetapkan (default), OpenClaw menggunakan PI sebagai fallback kompatibilitas. Tetapkan `fallback: "none"` agar pemilihan mode `auto` yang tidak cocok gagal.

Runtime Plugin eksplisit gagal tertutup secara default. Misalnya, `agentRuntime.id: "codex"` berarti Codex atau kesalahan pemilihan yang jelas kecuali Anda menetapkan `fallback: "pi"` dalam cakupan override yang sama. Override runtime tidak mewarisi pengaturan fallback yang lebih luas, jadi `agentRuntime.id: "codex"` tingkat agen tidak diam-diam diarahkan kembali ke PI hanya karena default menggunakan `fallback: "pi"`.

Alias backend CLI berbeda dari id harness tertanam. Bentuk Claude CLI yang direkomendasikan adalah:

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

Ref lama seperti `claude-cli/claude-opus-4-7` tetap didukung untuk kompatibilitas, tetapi konfigurasi baru sebaiknya mempertahankan penyedia/model tetap kanonis dan menempatkan backend eksekusi di `agentRuntime.id`.

Mode `auto` sengaja konservatif. Runtime Plugin dapat mengklaim pasangan penyedia/model yang mereka pahami, tetapi Plugin Codex tidak mengklaim penyedia `openai-codex` dalam mode `auto`. Itu mempertahankan `openai-codex/*` sebagai rute OAuth Codex PI eksplisit dan menghindari pemindahan diam-diam konfigurasi auth langganan ke harness app-server native.

Jika `openclaw doctor` memperingatkan bahwa Plugin `codex` diaktifkan sementara `openai-codex/*` masih dirutekan melalui PI, perlakukan itu sebagai diagnosis, bukan migrasi. Pertahankan konfigurasi tanpa perubahan ketika OAuth Codex PI adalah yang Anda inginkan. Beralihlah ke `openai/<model>` plus `agentRuntime.id: "codex"` hanya ketika Anda menginginkan eksekusi native Codex app-server.

## Kontrak kompatibilitas

Ketika runtime bukan PI, runtime tersebut harus mendokumentasikan permukaan OpenClaw yang didukungnya. Gunakan bentuk ini untuk dokumentasi runtime:

| Pertanyaan                            | Mengapa ini penting                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Siapa yang memiliki loop model?       | Menentukan di mana percobaan ulang, kelanjutan alat, dan keputusan jawaban akhir terjadi.            |
| Siapa yang memiliki riwayat thread kanonis? | Menentukan apakah OpenClaw dapat mengedit riwayat atau hanya mencerminkannya.                        |
| Apakah alat dinamis OpenClaw berfungsi? | Pesan, sesi, cron, dan alat milik OpenClaw bergantung pada ini.                                      |
| Apakah hook alat dinamis berfungsi?   | Plugin mengharapkan `before_tool_call`, `after_tool_call`, dan middleware di sekitar alat milik OpenClaw. |
| Apakah hook alat native berfungsi?    | Shell, patch, dan alat milik runtime memerlukan dukungan hook native untuk kebijakan dan observasi.  |
| Apakah siklus hidup mesin konteks berjalan? | Plugin memori dan konteks bergantung pada siklus hidup assemble, ingest, after-turn, dan Compaction. |
| Data Compaction apa yang diekspos?    | Beberapa Plugin hanya memerlukan notifikasi, sementara yang lain memerlukan metadata yang dipertahankan/dibuang. |
| Apa yang sengaja tidak didukung?      | Pengguna tidak boleh mengasumsikan kesetaraan PI ketika runtime native memiliki lebih banyak state.  |

Kontrak dukungan runtime Codex didokumentasikan di
[Harness Codex](/id/plugins/codex-harness#v1-support-contract).

## Label status

Output status dapat menampilkan label `Execution` dan `Runtime` sekaligus. Bacalah label tersebut sebagai
diagnostik, bukan sebagai nama penyedia.

- Referensi model seperti `openai/gpt-5.5` memberi tahu penyedia/model yang dipilih.
- ID runtime seperti `codex` memberi tahu loop mana yang mengeksekusi giliran.
- Label kanal seperti Telegram atau Discord memberi tahu tempat percakapan berlangsung.

Jika sesi masih menampilkan PI setelah mengubah konfigurasi runtime, mulai sesi baru
dengan `/new` atau kosongkan sesi saat ini dengan `/reset`. Sesi yang ada mempertahankan
runtime yang tercatat agar transkrip tidak diputar ulang melalui dua sistem sesi native
yang tidak kompatibel.

## Terkait

- [Harness Codex](/id/plugins/codex-harness)
- [OpenAI](/id/providers/openai)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Loop agen](/id/concepts/agent-loop)
- [Model](/id/concepts/models)
- [Status](/id/cli/status)
