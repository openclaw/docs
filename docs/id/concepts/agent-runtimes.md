---
read_when:
    - Anda sedang memilih antara Pi, Codex, ACP, atau runtime agen native lainnya
    - Anda bingung dengan label provider/model/runtime di status atau konfigurasi
    - Anda sedang mendokumentasikan paritas dukungan untuk harness native
summary: Bagaimana OpenClaw memisahkan provider model, model, channel, dan runtime agen
title: Runtime agen
x-i18n:
    generated_at: "2026-04-26T11:26:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: f99e88a47a78c48b2f2408a3feedf15cde66a6bacc4e7bfadb9e47c74f7ce633
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

Sebuah **runtime agen** adalah komponen yang memiliki satu loop model yang sudah disiapkan: komponen ini
menerima prompt, mengendalikan output model, menangani panggilan tool native, dan mengembalikan
giliran yang sudah selesai ke OpenClaw.

Runtime mudah tertukar dengan provider karena keduanya muncul dekat konfigurasi
model. Keduanya adalah lapisan yang berbeda:

| Lapisan       | Contoh                                | Artinya                                                            |
| ------------- | ------------------------------------- | ------------------------------------------------------------------ |
| Provider      | `openai`, `anthropic`, `openai-codex` | Cara OpenClaw mengautentikasi, menemukan model, dan menamai referensi model. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Model yang dipilih untuk giliran agen.                             |
| Runtime agen  | `pi`, `codex`, `claude-cli`           | Loop tingkat rendah atau backend yang mengeksekusi giliran yang sudah disiapkan. |
| Channel       | Telegram, Discord, Slack, WhatsApp    | Tempat pesan masuk dan keluar dari OpenClaw.                       |

Anda juga akan melihat kata **harness** di dalam kode. Harness adalah implementasi
yang menyediakan runtime agen. Misalnya, harness Codex bawaan
mengimplementasikan runtime `codex`. Konfigurasi publik menggunakan `agentRuntime.id`; `openclaw
doctor --fix` menulis ulang kunci kebijakan runtime lama ke bentuk tersebut.

Ada dua keluarga runtime:

- **Harness tertanam** berjalan di dalam loop agen yang sudah disiapkan oleh OpenClaw. Saat ini
  ini adalah runtime `pi` bawaan ditambah harness plugin terdaftar seperti
  `codex`.
- **Backend CLI** menjalankan proses CLI lokal sambil menjaga referensi model tetap
  kanonis. Misalnya, `anthropic/claude-opus-4-7` dengan
  `agentRuntime.id: "claude-cli"` berarti "pilih model Anthropic, eksekusi
  melalui Claude CLI." `claude-cli` bukan ID harness tertanam dan tidak boleh
  diberikan ke pemilihan AgentHarness.

## Tiga hal yang bernama Codex

Kebanyakan kebingungan berasal dari tiga permukaan berbeda yang memakai nama Codex:

| Permukaan                                            | Nama/konfigurasi OpenClaw            | Fungsinya                                                                                           |
| ---------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Rute provider OAuth Codex                            | referensi model `openai-codex/*`     | Menggunakan OAuth langganan ChatGPT/Codex melalui runner PI OpenClaw normal.                        |
| Runtime app-server Codex native                      | `agentRuntime.id: "codex"`           | Menjalankan giliran agen tertanam melalui harness app-server Codex bawaan.                          |
| Adaptor ACP Codex                                    | `runtime: "acp"`, `agentId: "codex"` | Menjalankan Codex melalui control plane ACP/acpx eksternal. Gunakan hanya saat ACP/acpx diminta secara eksplisit. |
| Set perintah chat-control Codex native               | `/codex ...`                         | Mengikat, melanjutkan, mengarahkan, menghentikan, dan memeriksa thread app-server Codex dari chat. |
| Rute API OpenAI Platform untuk model gaya GPT/Codex  | referensi model `openai/*`           | Menggunakan autentikasi API key OpenAI kecuali override runtime, seperti `runtime: "codex"`, menjalankan giliran. |

Permukaan-permukaan tersebut sengaja dibuat independen. Mengaktifkan plugin `codex` membuat
fitur app-server native tersedia; itu tidak menulis ulang
`openai-codex/*` menjadi `openai/*`, tidak mengubah sesi yang sudah ada, dan tidak
menjadikan ACP sebagai default Codex. Memilih `openai-codex/*` berarti "gunakan rute provider OAuth
Codex" kecuali Anda secara terpisah memaksa runtime.

Penyiapan Codex yang umum menggunakan provider `openai` dengan runtime `codex`:

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

Itu berarti OpenClaw memilih referensi model OpenAI, lalu meminta runtime
app-server Codex untuk menjalankan giliran agen tertanam. Itu tidak berarti channel, provider
katalog model, atau penyimpanan sesi OpenClaw menjadi Codex.

Saat plugin `codex` bawaan diaktifkan, kontrol Codex bahasa alami
sebaiknya menggunakan permukaan perintah native `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) alih-alih ACP. Gunakan ACP untuk
Codex hanya saat pengguna secara eksplisit meminta ACP/acpx atau sedang menguji jalur
adaptor ACP. Claude Code, Gemini CLI, OpenCode, Cursor, dan harness eksternal serupa
tetap menggunakan ACP.

Ini adalah pohon keputusan yang dihadapi agen:

1. Jika pengguna meminta **Codex bind/control/thread/resume/steer/stop**, gunakan
   permukaan perintah native `/codex` saat plugin `codex` bawaan diaktifkan.
2. Jika pengguna meminta **Codex sebagai runtime tertanam**, gunakan
   `openai/<model>` dengan `agentRuntime.id: "codex"`.
3. Jika pengguna meminta **autentikasi OAuth/langganan Codex pada runner OpenClaw
   normal**, gunakan `openai-codex/<model>` dan biarkan runtime tetap PI.
4. Jika pengguna secara eksplisit mengatakan **ACP**, **acpx**, atau **adaptor ACP Codex**, gunakan
   ACP dengan `runtime: "acp"` dan `agentId: "codex"`.
5. Jika permintaan adalah untuk **Claude Code, Gemini CLI, OpenCode, Cursor, Droid, atau
   harness eksternal lainnya**, gunakan ACP/acpx, bukan runtime sub-agen native.

| Maksud Anda...                           | Gunakan...                                    |
| ---------------------------------------- | --------------------------------------------- |
| Kontrol chat/thread app-server Codex     | `/codex ...` dari plugin `codex` bawaan       |
| Runtime agen tertanam app-server Codex   | `agentRuntime.id: "codex"`                    |
| OAuth OpenAI Codex pada runner PI        | referensi model `openai-codex/*`              |
| Claude Code atau harness eksternal lain  | ACP/acpx                                      |

Untuk pemisahan prefix keluarga OpenAI, lihat [OpenAI](/id/providers/openai) dan
[Provider model](/id/concepts/model-providers). Untuk kontrak dukungan runtime
Codex, lihat [Codex harness](/id/plugins/codex-harness#v1-support-contract).

## Kepemilikan runtime

Runtime yang berbeda memiliki bagian loop yang berbeda.

| Permukaan                  | OpenClaw PI tertanam                     | App-server Codex                                                            |
| -------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| Pemilik loop model         | OpenClaw melalui runner PI tertanam      | App-server Codex                                                            |
| Status thread kanonis      | Transkrip OpenClaw                       | Thread Codex, ditambah mirror transkrip OpenClaw                            |
| Tool dinamis OpenClaw      | Loop tool OpenClaw native                | Dijembatani melalui adaptor Codex                                           |
| Tool shell dan file native | Jalur PI/OpenClaw                        | Tool native Codex, dijembatani melalui hook native bila didukung            |
| Mesin konteks              | Perakitan konteks OpenClaw native        | Proyek OpenClaw merakit konteks ke dalam giliran Codex                      |
| Compaction                 | OpenClaw atau mesin konteks terpilih     | Compaction native Codex, dengan notifikasi OpenClaw dan pemeliharaan mirror |
| Pengiriman channel         | OpenClaw                                 | OpenClaw                                                                    |

Pemisahan kepemilikan ini adalah aturan desain utama:

- Jika OpenClaw memiliki permukaan tersebut, OpenClaw dapat menyediakan perilaku hook plugin normal.
- Jika runtime native memiliki permukaan tersebut, OpenClaw memerlukan peristiwa runtime atau hook native.
- Jika runtime native memiliki status thread kanonis, OpenClaw harus memirror dan memproyeksikan konteks, bukan menulis ulang internal yang tidak didukung.

## Pemilihan runtime

OpenClaw memilih runtime tertanam setelah resolusi provider dan model:

1. Runtime yang tercatat pada sebuah sesi menjadi penentu. Perubahan konfigurasi tidak akan melakukan hot-switch
   transkrip yang sudah ada ke sistem thread native yang berbeda.
2. `OPENCLAW_AGENT_RUNTIME=<id>` memaksa runtime tersebut untuk sesi baru atau yang di-reset.
3. `agents.defaults.agentRuntime.id` atau `agents.list[].agentRuntime.id` dapat menetapkan
   `auto`, `pi`, ID harness tertanam terdaftar seperti `codex`, atau
   alias backend CLI yang didukung seperti `claude-cli`.
4. Dalam mode `auto`, runtime plugin terdaftar dapat mengklaim pasangan provider/model
   yang didukung.
5. Jika tidak ada runtime yang mengklaim sebuah giliran dalam mode `auto` dan `fallback: "pi"` diatur
   (default), OpenClaw menggunakan PI sebagai fallback kompatibilitas. Atur
   `fallback: "none"` agar pemilihan mode `auto` yang tidak cocok gagal.

Runtime plugin eksplisit gagal tertutup secara default. Misalnya,
`runtime: "codex"` berarti Codex atau error pemilihan yang jelas kecuali Anda mengatur
`fallback: "pi"` dalam cakupan override yang sama. Override runtime tidak mewarisi
pengaturan fallback yang lebih luas, sehingga `runtime: "codex"` tingkat agen tidak akan diam-diam
dirutekan kembali ke PI hanya karena default menggunakan `fallback: "pi"`.

Alias backend CLI berbeda dari ID harness tertanam. Bentuk Claude CLI
yang disukai adalah:

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

Referensi lama seperti `claude-cli/claude-opus-4-7` tetap didukung untuk
kompatibilitas, tetapi konfigurasi baru sebaiknya menjaga provider/model tetap kanonis dan meletakkan
backend eksekusi di `agentRuntime.id`.

Mode `auto` sengaja konservatif. Runtime plugin dapat mengklaim
pasangan provider/model yang mereka pahami, tetapi plugin Codex tidak mengklaim
provider `openai-codex` dalam mode `auto`. Ini menjaga
`openai-codex/*` sebagai rute OAuth Codex PI yang eksplisit dan menghindari
memindahkan konfigurasi autentikasi langganan secara diam-diam ke harness app-server native.

Jika `openclaw doctor` memperingatkan bahwa plugin `codex` diaktifkan sementara
`openai-codex/*` masih dirutekan melalui PI, perlakukan itu sebagai diagnosis, bukan
migrasi. Biarkan konfigurasi tetap tidak berubah jika OAuth Codex PI memang yang Anda inginkan.
Beralih ke `openai/<model>` plus `agentRuntime.id: "codex"` hanya saat Anda menginginkan eksekusi
app-server Codex native.

## Kontrak kompatibilitas

Saat sebuah runtime bukan PI, runtime tersebut sebaiknya mendokumentasikan permukaan OpenClaw apa yang didukung.
Gunakan bentuk ini untuk dokumentasi runtime:

| Pertanyaan                             | Mengapa ini penting                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Siapa yang memiliki loop model?        | Menentukan di mana retry, kelanjutan tool, dan keputusan jawaban akhir terjadi.                   |
| Siapa yang memiliki riwayat thread kanonis? | Menentukan apakah OpenClaw dapat mengedit riwayat atau hanya memirror.                        |
| Apakah tool dinamis OpenClaw berfungsi? | Pesan, sesi, Cron, dan tool milik OpenClaw bergantung pada ini.                                  |
| Apakah hook tool dinamis berfungsi?    | Plugin mengharapkan `before_tool_call`, `after_tool_call`, dan middleware di sekitar tool milik OpenClaw. |
| Apakah hook tool native berfungsi?     | Tool shell, patch, dan tool milik runtime memerlukan dukungan hook native untuk kebijakan dan observasi. |
| Apakah siklus hidup mesin konteks berjalan? | Plugin memori dan konteks bergantung pada siklus hidup assemble, ingest, after-turn, dan compaction. |
| Data Compaction apa yang diekspos?     | Beberapa plugin hanya memerlukan notifikasi, sementara yang lain memerlukan metadata dipertahankan/dibuang. |
| Apa yang sengaja tidak didukung?       | Pengguna tidak boleh mengasumsikan kesetaraan dengan PI ketika runtime native memiliki lebih banyak status. |

Kontrak dukungan runtime Codex didokumentasikan di
[Codex harness](/id/plugins/codex-harness#v1-support-contract).

## Label status

Output status dapat menampilkan label `Execution` dan `Runtime`. Baca keduanya sebagai
diagnostik, bukan sebagai nama provider.

- Referensi model seperti `openai/gpt-5.5` memberi tahu Anda provider/model yang dipilih.
- ID runtime seperti `codex` memberi tahu Anda loop mana yang mengeksekusi giliran.
- Label channel seperti Telegram atau Discord memberi tahu Anda di mana percakapan terjadi.

Jika sebuah sesi masih menampilkan PI setelah mengubah konfigurasi runtime, mulai sesi baru
dengan `/new` atau hapus sesi saat ini dengan `/reset`. Sesi yang sudah ada mempertahankan runtime
yang tercatat agar transkrip tidak diputar ulang melalui dua sistem sesi
native yang tidak kompatibel.

## Terkait

- [Codex harness](/id/plugins/codex-harness)
- [OpenAI](/id/providers/openai)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Loop agen](/id/concepts/agent-loop)
- [Models](/id/concepts/models)
- [Status](/id/cli/status)
