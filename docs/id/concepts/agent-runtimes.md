---
read_when:
    - Anda sedang memilih antara PI, Codex, ACP, atau runtime agen native lainnya
    - Anda bingung dengan label penyedia/model/runtime di status atau konfigurasi
    - Anda sedang mendokumentasikan paritas dukungan untuk harness asli
summary: Cara OpenClaw memisahkan penyedia model, model, saluran, dan runtime agen
title: Runtime agen
x-i18n:
    generated_at: "2026-05-07T13:15:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417a3a7e12a881bc33023cc87553dd3536a63ad955d1e93d26f1014032303469
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**Runtime agen** adalah komponen yang memiliki satu loop model yang sudah disiapkan: runtime
menerima prompt, menggerakkan output model, menangani panggilan alat native, dan mengembalikan
giliran yang selesai ke OpenClaw.

Runtime mudah tertukar dengan provider karena keduanya muncul dekat konfigurasi model.
Keduanya adalah lapisan yang berbeda:

| Lapisan       | Contoh                                | Artinya                                                             |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `openai-codex` | Cara OpenClaw melakukan autentikasi, menemukan model, dan menamai referensi model. |
| Model         | `gpt-5.5`, `claude-opus-4-6`          | Model yang dipilih untuk giliran agen.                              |
| Runtime agen  | `pi`, `codex`, `claude-cli`           | Loop atau backend tingkat rendah yang mengeksekusi giliran yang disiapkan. |
| Channel       | Telegram, Discord, Slack, WhatsApp    | Tempat pesan masuk dan keluar dari OpenClaw.                        |

Anda juga akan melihat kata **harness** di kode. Harness adalah implementasi
yang menyediakan runtime agen. Misalnya, harness Codex bawaan
mengimplementasikan runtime `codex`. Konfigurasi publik menggunakan `agentRuntime.id`; `openclaw
doctor --fix` menulis ulang kunci kebijakan runtime lama ke bentuk tersebut.

Ada dua keluarga runtime:

- **Harness tertanam** berjalan di dalam loop agen OpenClaw yang disiapkan. Saat ini ini
  adalah runtime bawaan `pi` ditambah harness Plugin terdaftar seperti
  `codex`.
- **Backend CLI** menjalankan proses CLI lokal sambil mempertahankan referensi model
  kanonis. Misalnya, `anthropic/claude-opus-4-7` dengan
  `agentRuntime.id: "claude-cli"` berarti "pilih model Anthropic, eksekusi
  melalui Claude CLI." `claude-cli` bukan id harness tertanam dan tidak boleh
  diteruskan ke pemilihan AgentHarness.

## Permukaan Codex

Sebagian besar kebingungan berasal dari beberapa permukaan berbeda yang memakai nama Codex:

| Permukaan                                        | Nama/konfigurasi OpenClaw            | Fungsinya                                                                                                      |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Runtime app-server Codex native                  | referensi model `openai/*`          | Menjalankan giliran agen tertanam OpenAI melalui app-server Codex. Ini adalah pengaturan langganan ChatGPT/Codex yang umum. |
| Profil auth OAuth Codex                          | provider auth `openai-codex`         | Menyimpan auth langganan ChatGPT/Codex yang dikonsumsi harness app-server Codex.                               |
| Adapter ACP Codex                                | `runtime: "acp"`, `agentId: "codex"` | Menjalankan Codex melalui bidang kontrol ACP/acpx eksternal. Gunakan hanya ketika ACP/acpx diminta secara eksplisit. |
| Set perintah kontrol chat Codex native           | `/codex ...`                         | Mengikat, melanjutkan, mengarahkan, menghentikan, dan memeriksa thread app-server Codex dari chat.             |
| Rute API OpenAI Platform untuk permukaan non-agen | `openai/*` plus auth kunci API       | Digunakan untuk API OpenAI langsung seperti gambar, embeddings, ucapan, dan realtime.                          |

Permukaan-permukaan tersebut sengaja independen. Mengaktifkan Plugin `codex` membuat
fitur app-server native tersedia; `openclaw doctor --fix` memiliki perbaikan rute
`openai-codex/*` lama dan pembersihan pin sesi usang. Memilih
`openai/*` untuk model agen sekarang berarti "jalankan ini melalui Codex" kecuali
permukaan API OpenAI non-agen sedang digunakan.

Pengaturan langganan ChatGPT/Codex yang umum menggunakan OAuth Codex untuk auth, tetapi tetap
mempertahankan referensi model sebagai `openai/*` dan memilih runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Itu berarti OpenClaw memilih referensi model OpenAI, lalu meminta runtime app-server Codex
untuk menjalankan giliran agen tertanam. Itu tidak berarti "gunakan penagihan API," dan
itu tidak berarti channel, katalog provider model, atau penyimpanan sesi OpenClaw
menjadi Codex.

Ketika Plugin `codex` bawaan diaktifkan, kontrol Codex dengan bahasa alami
harus menggunakan permukaan perintah native `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) alih-alih ACP. Gunakan ACP untuk
Codex hanya ketika pengguna secara eksplisit meminta ACP/acpx atau sedang menguji jalur
adapter ACP. Claude Code, Gemini CLI, OpenCode, Cursor, dan harness eksternal serupa
tetap menggunakan ACP.

Ini adalah pohon keputusan yang dihadapi agen:

1. Jika pengguna meminta **bind/kontrol/thread/resume/steer/stop Codex**, gunakan
   permukaan perintah native `/codex` ketika Plugin `codex` bawaan diaktifkan.
2. Jika pengguna meminta **Codex sebagai runtime tertanam** atau menginginkan pengalaman agen Codex
   normal yang didukung langganan, gunakan `openai/<model>`.
3. Jika pengguna secara eksplisit memilih **PI untuk model OpenAI**, pertahankan referensi model
   sebagai `openai/<model>` dan setel `agentRuntime.id: "pi"`. Profil auth
   `openai-codex` yang dipilih dirutekan secara internal melalui transport auth Codex lama milik PI.
4. Jika konfigurasi lama masih berisi **referensi model `openai-codex/*`**, perbaiki menjadi
   `openai/<model>` dengan `openclaw doctor --fix`.
5. Jika pengguna secara eksplisit mengatakan **ACP**, **acpx**, atau **adapter ACP Codex**, gunakan
   ACP dengan `runtime: "acp"` dan `agentId: "codex"`.
6. Jika permintaan adalah untuk **Claude Code, Gemini CLI, OpenCode, Cursor, Droid, atau
   harness eksternal lain**, gunakan ACP/acpx, bukan runtime sub-agen native.

| Yang Anda maksud...                 | Gunakan...                                  |
| ----------------------------------- | ------------------------------------------- |
| Kontrol chat/thread app-server Codex | `/codex ...` dari Plugin `codex` bawaan     |
| Runtime agen tertanam app-server Codex | referensi model agen `openai/*`           |
| OAuth OpenAI Codex                  | profil auth `openai-codex`                  |
| Claude Code atau harness eksternal lain | ACP/acpx                                 |

Untuk pemisahan prefix keluarga OpenAI, lihat [OpenAI](/id/providers/openai) dan
[Provider model](/id/concepts/model-providers). Untuk kontrak dukungan runtime Codex,
lihat [Harness Codex](/id/plugins/codex-harness#v1-support-contract).

## Kepemilikan runtime

Runtime yang berbeda memiliki bagian loop yang berbeda.

| Permukaan                   | PI tertanam OpenClaw                   | App-server Codex                                                            |
| --------------------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| Pemilik loop model          | OpenClaw melalui runner tertanam PI    | App-server Codex                                                            |
| Status thread kanonis       | Transkrip OpenClaw                     | Thread Codex, plus cermin transkrip OpenClaw                                |
| Alat dinamis OpenClaw       | Loop alat native OpenClaw              | Dijembatani melalui adapter Codex                                           |
| Alat shell dan file native  | Jalur PI/OpenClaw                      | Alat native Codex, dijembatani melalui hook native jika didukung            |
| Mesin konteks               | Perakitan konteks native OpenClaw      | OpenClaw menyusun konteks proyek ke dalam giliran Codex                     |
| Compaction                  | OpenClaw atau mesin konteks yang dipilih | Compaction native Codex, dengan notifikasi OpenClaw dan pemeliharaan cermin |
| Pengiriman channel          | OpenClaw                               | OpenClaw                                                                    |

Pemisahan kepemilikan ini adalah aturan desain utama:

- Jika OpenClaw memiliki permukaan, OpenClaw dapat menyediakan perilaku hook Plugin normal.
- Jika runtime native memiliki permukaan, OpenClaw memerlukan peristiwa runtime atau hook native.
- Jika runtime native memiliki status thread kanonis, OpenClaw harus mencerminkan dan memproyeksikan konteks, bukan menulis ulang internal yang tidak didukung.

## Pemilihan runtime

OpenClaw memilih runtime tertanam setelah resolusi provider dan model:

1. Runtime yang direkam sesi menang. Perubahan konfigurasi tidak melakukan hot-switch
   transkrip yang ada ke sistem thread native lain.
2. `OPENCLAW_AGENT_RUNTIME=<id>` memaksa runtime tersebut untuk sesi baru atau yang direset.
3. `agents.defaults.agentRuntime.id` atau `agents.list[].agentRuntime.id` dapat mengatur
   `auto`, `pi`, id harness tertanam terdaftar seperti `codex`, atau
   alias backend CLI yang didukung seperti `claude-cli`.
4. Dalam mode `auto`, runtime Plugin terdaftar dapat mengklaim pasangan provider/model
   yang didukung.
5. Jika tidak ada runtime yang mengklaim giliran dalam mode `auto`, OpenClaw menggunakan PI sebagai
   runtime kompatibilitas. Gunakan id runtime eksplisit ketika run harus
   ketat.

Runtime Plugin eksplisit gagal tertutup. Misalnya, `agentRuntime.id: "codex"`
berarti Codex atau galat pemilihan/runtime yang jelas; itu tidak pernah diam-diam dirutekan kembali
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

Referensi lama seperti `claude-cli/claude-opus-4-7` tetap didukung untuk
kompatibilitas, tetapi konfigurasi baru harus mempertahankan provider/model tetap kanonis dan menaruh
backend eksekusi di `agentRuntime.id`.

Mode `auto` sengaja konservatif untuk sebagian besar provider. Model agen OpenAI
adalah pengecualian: runtime yang tidak disetel dan `auto` sama-sama diselesaikan ke harness Codex.
Konfigurasi runtime PI eksplisit tetap menjadi rute kompatibilitas opt-in untuk
giliran agen `openai/*`; ketika dipasangkan dengan profil auth `openai-codex` yang dipilih,
OpenClaw merutekan PI secara internal melalui transport auth Codex lama sambil
mempertahankan referensi model publik sebagai `openai/*`. Pin sesi PI OpenAI usang tanpa
konfigurasi eksplisit diperbaiki kembali ke Codex.

Jika `openclaw doctor` memperingatkan bahwa Plugin `codex` diaktifkan sementara
`openai-codex/*` masih ada di konfigurasi, perlakukan itu sebagai status rute lama. Jalankan
`openclaw doctor --fix` untuk menulis ulang menjadi `openai/*` dengan runtime Codex.

## Kontrak kompatibilitas

Ketika runtime bukan PI, runtime harus mendokumentasikan permukaan OpenClaw apa saja yang didukungnya.
Gunakan bentuk ini untuk dokumentasi runtime:

| Pertanyaan                            | Mengapa ini penting                                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Siapa yang memiliki loop model?       | Menentukan tempat retry, kelanjutan alat, dan keputusan jawaban akhir terjadi.                     |
| Siapa yang memiliki riwayat thread kanonis? | Menentukan apakah OpenClaw dapat mengedit riwayat atau hanya mencerminkannya.                 |
| Apakah alat dinamis OpenClaw berfungsi? | Messaging, sesi, cron, dan alat milik OpenClaw bergantung pada ini.                              |
| Apakah hook alat dinamis berfungsi?   | Plugin mengharapkan `before_tool_call`, `after_tool_call`, dan middleware di sekitar alat milik OpenClaw. |
| Apakah hook alat native berfungsi?    | Shell, patch, dan alat milik runtime membutuhkan dukungan hook native untuk kebijakan dan observasi. |
| Apakah siklus hidup mesin konteks berjalan? | Plugin memori dan konteks bergantung pada siklus hidup assemble, ingest, after-turn, dan compaction. |
| Data compaction apa yang diekspos?    | Beberapa Plugin hanya membutuhkan notifikasi, sementara yang lain membutuhkan metadata kept/dropped. |
| Apa yang sengaja tidak didukung?      | Pengguna tidak boleh mengasumsikan kesetaraan PI ketika runtime native memiliki lebih banyak status. |

Kontrak dukungan runtime Codex didokumentasikan di
[harness Codex](/id/plugins/codex-harness#v1-support-contract).

## Label status

Output status dapat menampilkan label `Execution` dan `Runtime`. Bacalah keduanya sebagai
diagnostik, bukan sebagai nama penyedia.

- Referensi model seperti `openai/gpt-5.5` memberi tahu Anda penyedia/model yang dipilih.
- ID runtime seperti `codex` memberi tahu Anda loop mana yang mengeksekusi giliran tersebut.
- Label kanal seperti Telegram atau Discord memberi tahu Anda di mana percakapan berlangsung.

Jika sesi masih menampilkan PI setelah mengubah konfigurasi runtime, mulai sesi baru
dengan `/new` atau hapus sesi saat ini dengan `/reset`. Sesi yang ada mempertahankan
runtime yang tercatat sehingga transkrip tidak diputar ulang melalui dua sistem sesi native
yang tidak kompatibel.

## Terkait

- [harness Codex](/id/plugins/codex-harness)
- [OpenAI](/id/providers/openai)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Loop agen](/id/concepts/agent-loop)
- [Model](/id/concepts/models)
- [Status](/id/cli/status)
