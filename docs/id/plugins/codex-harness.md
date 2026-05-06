---
read_when:
    - Anda ingin menggunakan perangkat uji server aplikasi Codex bawaan
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin penerapan khusus Codex gagal alih-alih beralih kembali ke PI
summary: Jalankan giliran agen tertanam OpenClaw melalui harness app-server Codex yang dibundel
title: Harness Codex
x-i18n:
    generated_at: "2026-05-06T09:21:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: a35ab08c1a7327437aadb6c2517bd962071bbb25982718d4c0b043680163ab70
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen tertanam melalui
app-server Codex alih-alih harness PI bawaan.

Gunakan ini ketika Anda ingin Codex menangani sesi agen tingkat rendah: penemuan
model, pelanjutan thread native, compaction native, dan eksekusi app-server.
OpenClaw tetap menangani saluran chat, file sesi, pemilihan model, alat,
persetujuan, pengiriman media, dan cermin transkrip yang terlihat.

Ketika giliran chat sumber berjalan melalui harness Codex, balasan yang terlihat
secara default menggunakan alat `message` OpenClaw jika deployment belum secara
eksplisit mengonfigurasi `messages.visibleReplies`. Agen tetap dapat menyelesaikan
giliran Codex-nya secara privat; ia hanya memposting ke saluran ketika memanggil
`message(action="send")`. Atur `messages.visibleReplies: "automatic"` untuk
mempertahankan balasan akhir chat langsung pada jalur pengiriman otomatis lama.

Giliran heartbeat Codex juga mendapatkan alat `heartbeat_respond` secara default,
sehingga agen dapat mencatat apakah wake harus tetap senyap atau memberi tahu
tanpa menyandikan alur kontrol tersebut dalam teks akhir.

Panduan inisiatif khusus Heartbeat dikirim sebagai instruksi developer mode
kolaborasi Codex pada giliran heartbeat itu sendiri. Giliran chat biasa
mengembalikan mode Default Codex alih-alih membawa filosofi heartbeat dalam
prompt runtime normalnya.

Jika Anda mencoba memahami arahnya, mulai dari
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya adalah:
`openai/gpt-5.5` adalah referensi model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau saluran lain tetap menjadi permukaan komunikasi.

## Konfigurasi cepat

Sebagian besar pengguna yang menginginkan "Codex di OpenClaw" menginginkan rute
ini: masuk dengan langganan ChatGPT/Codex, lalu jalankan giliran agen tertanam
melalui runtime app-server Codex native. Referensi model tetap kanonis sebagai
`openai/gpt-*`; autentikasi langganan berasal dari akun/profil Codex, bukan
dari prefiks model `openai-codex/*`.

Pertama masuk dengan OAuth Codex jika belum:

```bash
openclaw models auth login --provider openai-codex
```

Lalu aktifkan Plugin `codex` bawaan dan paksa runtime Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
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

Jika konfigurasi Anda menggunakan `plugins.allow`, sertakan juga `codex` di sana:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Jangan gunakan `openai-codex/gpt-*` dalam konfigurasi. Prefiks tersebut adalah
rute lama yang ditulis ulang oleh `openclaw doctor --fix` menjadi `openai/gpt-*`
di seluruh model utama, fallback, override heartbeat/subagen/compaction, hook,
override saluran, dan pin rute sesi tersimpan yang usang.

## Apa yang diubah Plugin ini

Plugin `codex` bawaan menyumbangkan beberapa kemampuan terpisah:

| Kemampuan                         | Cara menggunakannya                                | Yang dilakukan                                                                 |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Runtime tertanam native           | `agentRuntime.id: "codex"`                          | Menjalankan giliran agen tertanam OpenClaw melalui app-server Codex.           |
| Perintah kontrol chat native      | `/codex bind`, `/codex resume`, `/codex steer`, ... | Mengikat dan mengontrol thread app-server Codex dari percakapan pesan.         |
| Provider/katalog app-server Codex | internal `codex`, ditampilkan melalui harness       | Memungkinkan runtime menemukan dan memvalidasi model app-server.               |
| Jalur pemahaman media Codex       | jalur kompatibilitas model gambar `codex/*`         | Menjalankan giliran app-server Codex terbatas untuk model pemahaman gambar yang didukung. |
| Relay hook native                 | Hook Plugin di sekitar event native Codex           | Memungkinkan OpenClaw mengamati/memblokir event alat/finalisasi native Codex yang didukung. |

Mengaktifkan Plugin membuat kemampuan tersebut tersedia. Ini **tidak**:

- mulai menggunakan Codex untuk setiap model OpenAI
- mengonversi referensi model `openai-codex/*` menjadi runtime native tanpa doctor
  memverifikasi bahwa Codex terpasang, aktif, menyumbangkan harness `codex`,
  dan siap OAuth
- menjadikan ACP/acpx sebagai jalur Codex default
- melakukan hot-switch sesi yang sudah mencatat runtime PI
- menggantikan pengiriman saluran OpenClaw, file sesi, penyimpanan profil auth, atau
  perutean pesan

Plugin yang sama juga memiliki permukaan perintah kontrol chat native `/codex`.
Jika Plugin aktif dan pengguna meminta untuk mengikat, melanjutkan, mengarahkan,
menghentikan, atau memeriksa thread Codex dari chat, agen sebaiknya memilih
`/codex ...` daripada ACP. ACP tetap menjadi fallback eksplisit ketika pengguna
meminta ACP/acpx atau sedang menguji adaptor ACP Codex.

Giliran Codex native mempertahankan hook Plugin OpenClaw sebagai lapisan
kompatibilitas publik. Ini adalah hook OpenClaw dalam proses, bukan hook perintah
`hooks.json` Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` untuk rekaman transkrip yang dicerminkan
- `before_agent_finalize` melalui relay `Stop` Codex
- `agent_end`

Plugin juga dapat mendaftarkan middleware hasil alat yang netral runtime untuk
menulis ulang hasil alat dinamis OpenClaw setelah OpenClaw menjalankan alat dan
sebelum hasilnya dikembalikan ke Codex. Ini terpisah dari hook Plugin publik
`tool_result_persist`, yang mentransformasi penulisan hasil alat transkrip milik
OpenClaw.

Untuk semantik hook Plugin itu sendiri, lihat [Hook Plugin](/id/plugins/hooks)
dan [Perilaku guard Plugin](/id/tools/plugin).

Harness nonaktif secara default. Konfigurasi baru sebaiknya mempertahankan
referensi model OpenAI yang kanonis sebagai `openai/gpt-*` dan secara eksplisit
memaksa `agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex` ketika
menginginkan eksekusi app-server native. Referensi model lama `codex/*` tetap
memilih harness secara otomatis untuk kompatibilitas, tetapi prefiks provider
lama yang didukung runtime tidak ditampilkan sebagai pilihan model/provider normal.

Jika ada rute model yang dikonfigurasi masih berupa `openai-codex/*`,
`openclaw doctor --fix` menulis ulangnya menjadi `openai/*`. Untuk rute agen
yang cocok, perintah ini menetapkan runtime agen ke `codex` hanya ketika Plugin
Codex terpasang, aktif, menyumbangkan harness `codex`, dan memiliki OAuth yang
dapat digunakan; jika tidak, runtime ditetapkan ke `pi`.

## Peta rute

Gunakan tabel ini sebelum mengubah konfigurasi:

| Perilaku yang diinginkan                            | Referensi model          | Konfigurasi runtime                   | Rute auth/profil             | Label status yang diharapkan   |
| --------------------------------------------------- | ------------------------ | ------------------------------------- | ---------------------------- | ------------------------------ |
| Langganan ChatGPT/Codex dengan runtime Codex native | `openai/gpt-*`           | `agentRuntime.id: "codex"`            | OAuth Codex atau akun Codex  | `Runtime: OpenAI Codex`        |
| API OpenAI melalui runner OpenClaw normal           | `openai/gpt-*`           | dihilangkan atau `runtime: "pi"`      | Kunci API OpenAI             | `Runtime: OpenClaw Pi Default` |
| Konfigurasi lama yang perlu perbaikan doctor        | `openai-codex/gpt-*`     | diperbaiki menjadi `codex` atau `pi`  | Auth yang sudah dikonfigurasi | Periksa ulang setelah `doctor --fix` |
| Provider campuran dengan mode otomatis konservatif  | referensi khusus provider | `agentRuntime.id: "auto"`             | Per provider yang dipilih    | Bergantung pada runtime yang dipilih |
| Sesi adaptor ACP Codex eksplisit                    | bergantung prompt/model ACP | `sessions_spawn` dengan `runtime: "acp"` | Auth backend ACP             | Status tugas/sesi ACP          |

Pemisahan pentingnya adalah provider versus runtime:

- `openai-codex/*` adalah rute lama yang ditulis ulang oleh doctor.
- `agentRuntime.id: "codex"` membutuhkan harness Codex dan gagal tertutup jika
  tidak tersedia.
- `agentRuntime.id: "auto"` memungkinkan harness terdaftar mengklaim rute
  provider yang cocok, tetapi referensi OpenAI kanonis tetap dimiliki PI kecuali
  sebuah harness mendukung pasangan provider/model tersebut.
- `/codex ...` menjawab "percakapan Codex native mana yang harus diikat atau
  dikontrol oleh chat ini?"
- ACP menjawab "proses harness eksternal mana yang harus diluncurkan acpx?"

## Pilih prefiks model yang tepat

Rute keluarga OpenAI bersifat spesifik prefiks. Untuk setup umum langganan plus
runtime Codex native, gunakan `openai/*` dengan `agentRuntime.id: "codex"`.
Perlakukan `openai-codex/*` sebagai konfigurasi lama yang harus ditulis ulang
oleh doctor:

| Referensi model                              | Jalur runtime                                | Gunakan ketika                                                            |
| -------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                             | Provider OpenAI melalui plumbing OpenClaw/PI | Anda menginginkan akses API OpenAI Platform langsung saat ini dengan `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                       | Rute lama yang diperbaiki oleh doctor        | Anda memakai konfigurasi lama; jalankan `openclaw doctor --fix` untuk menulis ulangnya. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness app-server Codex                    | Anda menginginkan auth langganan ChatGPT/Codex dengan eksekusi Codex native. |

GPT-5.5 dapat muncul pada rute kunci API OpenAI langsung dan rute langganan Codex
ketika akun Anda mengeksposnya. Gunakan `openai/gpt-5.5` dengan harness
app-server Codex untuk runtime Codex native, atau `openai/gpt-5.5` tanpa override
runtime Codex untuk trafik kunci API langsung.

Referensi lama `codex/gpt-*` tetap diterima sebagai alias kompatibilitas. Migrasi
kompatibilitas doctor menulis ulang referensi runtime lama menjadi referensi
model kanonis dan mencatat kebijakan runtime secara terpisah. Konfigurasi harness
app-server native baru sebaiknya menggunakan `openai/gpt-*` plus
`agentRuntime.id: "codex"`.

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan
`openai/gpt-*` untuk rute OpenAI normal dan `codex/gpt-*` ketika pemahaman gambar
harus berjalan melalui giliran app-server Codex terbatas. Jangan gunakan
`openai-codex/gpt-*`; doctor menulis ulang prefiks lama itu menjadi
`openai/gpt-*`. Model app-server Codex harus mengiklankan dukungan input gambar;
model Codex khusus teks gagal sebelum giliran media dimulai.

Gunakan `/status` untuk mengonfirmasi harness efektif untuk sesi saat ini. Jika
pilihannya mengejutkan, aktifkan logging debug untuk subsistem `agents/harness`
dan periksa rekaman terstruktur `agent harness selected` milik Gateway. Rekaman
itu menyertakan id harness yang dipilih, alasan pemilihan, kebijakan
runtime/fallback, dan, dalam mode `auto`, hasil dukungan setiap kandidat Plugin.

### Arti peringatan doctor

`openclaw doctor` memperingatkan ketika referensi model yang dikonfigurasi atau
state rute sesi tersimpan masih menggunakan `openai-codex/*`. `openclaw doctor --fix`
menulis ulang rute tersebut menjadi:

- `openai/<model>`
- `agentRuntime.id: "codex"` ketika Codex terpasang, aktif, menyumbangkan harness
  `codex`, dan memiliki OAuth yang dapat digunakan
- `agentRuntime.id: "pi"` jika tidak

Rute `codex` memaksa harness Codex native. Rute `pi` mempertahankan agen pada
runner OpenClaw default alih-alih mengaktifkan atau memasang Codex sebagai efek
samping pembersihan rute lama.
Doctor juga memperbaiki pin sesi tersimpan yang usang di seluruh penyimpanan sesi
agen yang ditemukan sehingga percakapan lama tidak tetap macet pada rute yang
dihapus.

Pemilihan harness bukan kontrol sesi langsung. Saat giliran tersemat berjalan,
OpenClaw mencatat id harness yang dipilih pada sesi tersebut dan terus menggunakannya untuk
giliran berikutnya dalam id sesi yang sama. Ubah konfigurasi `agentRuntime` atau
`OPENCLAW_AGENT_RUNTIME` saat Anda ingin sesi mendatang menggunakan harness lain;
gunakan `/new` atau `/reset` untuk memulai sesi baru sebelum mengalihkan percakapan
yang ada antara PI dan Codex. Ini mencegah pemutaran ulang satu transkrip melalui
dua sistem sesi native yang tidak kompatibel.

Sesi lama yang dibuat sebelum pin harness diperlakukan sebagai terpin ke PI setelah
memiliki riwayat transkrip. Gunakan `/new` atau `/reset` untuk memasukkan percakapan itu ke
Codex setelah mengubah konfigurasi.

`/status` menampilkan runtime model efektif. Harness PI default muncul sebagai
`Runtime: OpenClaw Pi Default`, dan harness server aplikasi Codex muncul sebagai
`Runtime: OpenAI Codex`.

## Persyaratan

- OpenClaw dengan Plugin `codex` bawaan yang tersedia.
- Server aplikasi Codex `0.125.0` atau yang lebih baru. Plugin bawaan mengelola biner
  server aplikasi Codex yang kompatibel secara default, sehingga perintah `codex` lokal di `PATH`
  tidak memengaruhi startup harness normal.
- Autentikasi Codex tersedia untuk proses server aplikasi atau untuk bridge autentikasi Codex
  OpenClaw. Peluncuran server aplikasi lokal menggunakan home Codex yang dikelola OpenClaw untuk setiap
  agen dan `HOME` child yang terisolasi, sehingga secara default tidak membaca akun
  `~/.codex`, skills, plugin, konfigurasi, status thread, atau
  `$HOME/.agents/skills` native pribadi Anda.

Plugin memblokir handshake server aplikasi yang lebih lama atau tanpa versi. Ini menjaga
OpenClaw tetap pada permukaan protokol yang sudah diuji.

Untuk pengujian smoke live dan Docker, autentikasi biasanya berasal dari akun CLI Codex
atau profil autentikasi `openai-codex` OpenClaw. Peluncuran server aplikasi stdio lokal juga dapat
fallback ke `CODEX_API_KEY` / `OPENAI_API_KEY` saat tidak ada akun.

## File bootstrap workspace

Codex menangani `AGENTS.md` sendiri melalui penemuan dokumen proyek native. OpenClaw
tidak menulis file dokumen proyek Codex sintetis atau bergantung pada nama file fallback Codex
untuk file persona, karena fallback Codex hanya berlaku saat
`AGENTS.md` tidak ada.

Untuk paritas workspace OpenClaw, harness Codex menyelesaikan file bootstrap lain
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md`, dan `MEMORY.md` saat ada) dan meneruskannya melalui instruksi developer Codex
pada `thread/start` dan `thread/resume`. Ini menjaga
`SOUL.md` dan konteks persona/profil workspace terkait tetap terlihat pada lane pembentuk perilaku
native Codex tanpa menduplikasi `AGENTS.md`.

## Tambahkan Codex bersama model lain

Jangan atur `agentRuntime.id: "codex"` secara global jika agen yang sama harus bebas beralih
antara Codex dan model provider non-Codex. Runtime paksa berlaku untuk setiap
giliran tersemat bagi agen atau sesi tersebut. Jika Anda memilih model Anthropic saat
runtime itu dipaksa, OpenClaw tetap mencoba harness Codex dan gagal tertutup
alih-alih secara diam-diam merutekan giliran itu melalui PI.

Gunakan salah satu bentuk ini sebagai gantinya:

- Letakkan Codex pada agen khusus dengan `agentRuntime.id: "codex"`.
- Pertahankan agen default pada `agentRuntime.id: "auto"` dan fallback PI untuk penggunaan
  provider campuran normal.
- Gunakan ref lama `codex/*` hanya untuk kompatibilitas. Konfigurasi baru sebaiknya memilih
  `openai/*` plus kebijakan runtime Codex eksplisit.

Misalnya, ini mempertahankan agen default pada pemilihan otomatis normal dan
menambahkan agen Codex terpisah:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Dengan bentuk ini:

- Agen `main` default menggunakan jalur provider normal dan fallback kompatibilitas PI.
- Agen `codex` menggunakan harness server aplikasi Codex.
- Jika Codex hilang atau tidak didukung untuk agen `codex`, giliran akan gagal
  alih-alih diam-diam menggunakan PI.

## Perutean perintah agen

Agen harus merutekan permintaan pengguna berdasarkan maksud, bukan berdasarkan kata "Codex" saja:

| Pengguna meminta...                                    | Agen harus menggunakan...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Ikat chat ini ke Codex"                               | `/codex bind`                                    |
| "Lanjutkan thread Codex `<id>` di sini"                | `/codex resume <id>`                             |
| "Tampilkan thread Codex"                               | `/codex threads`                                 |
| "Ajukan laporan dukungan untuk eksekusi Codex yang buruk" | `/diagnostics [note]`                         |
| "Hanya kirim umpan balik Codex untuk thread terlampir ini" | `/codex diagnostics [note]`                   |
| "Gunakan langganan ChatGPT/Codex saya dengan runtime Codex" | `openai/*` plus `agentRuntime.id: "codex"`    |
| "Perbaiki pin konfigurasi/sesi `openai-codex/*` lama"  | `openclaw doctor --fix`                          |
| "Jalankan Codex melalui ACP/acpx"                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Mulai Claude Code/Gemini/OpenCode/Cursor dalam thread" | ACP/acpx, bukan `/codex` dan bukan sub-agen native |

OpenClaw hanya mengiklankan panduan spawn ACP kepada agen saat ACP diaktifkan,
dapat didispatch, dan didukung oleh backend runtime yang dimuat. Jika ACP tidak tersedia,
prompt sistem dan skills plugin tidak boleh mengajari agen tentang perutean ACP.

## Deployment khusus Codex

Paksa harness Codex saat Anda perlu membuktikan bahwa setiap giliran agen tersemat
menggunakan Codex. Runtime plugin eksplisit gagal tertutup dan tidak pernah dicoba ulang
secara diam-diam melalui PI:

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

Override lingkungan:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Dengan Codex dipaksa, OpenClaw gagal lebih awal jika Plugin Codex dinonaktifkan,
server aplikasi terlalu lama, atau server aplikasi tidak dapat dimulai.

## Codex per agen

Anda dapat membuat satu agen khusus Codex sementara agen default tetap memakai
pemilihan otomatis normal:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Gunakan perintah sesi normal untuk beralih agen dan model. `/new` membuat sesi
OpenClaw baru dan harness Codex membuat atau melanjutkan thread server aplikasi sidecar
sesuai kebutuhan. `/reset` menghapus binding sesi OpenClaw untuk thread tersebut
dan membiarkan giliran berikutnya menyelesaikan harness dari konfigurasi saat ini lagi.

## Penemuan model

Secara default, Plugin Codex meminta daftar model yang tersedia kepada server aplikasi. Jika
penemuan gagal atau waktu habis, ia menggunakan katalog fallback bawaan untuk:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Anda dapat menyesuaikan penemuan di bawah `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Nonaktifkan penemuan saat Anda ingin startup menghindari probing Codex dan tetap memakai
katalog fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Koneksi dan kebijakan server aplikasi

Secara default, Plugin memulai biner Codex yang dikelola OpenClaw secara lokal dengan:

```bash
codex app-server --listen stdio://
```

Biner terkelola dikirim bersama paket Plugin `codex`. Ini menjaga versi
server aplikasi tetap terikat ke Plugin bawaan, bukan ke CLI Codex terpisah apa pun
yang kebetulan terinstal secara lokal. Atur `appServer.command` hanya saat
Anda sengaja ingin menjalankan executable yang berbeda.

Secara default, OpenClaw memulai sesi harness Codex lokal dalam mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Ini adalah postur operator lokal tepercaya yang digunakan
untuk Heartbeat otonom: Codex dapat menggunakan shell dan alat jaringan tanpa
berhenti pada prompt persetujuan native yang tidak ada orang untuk menjawabnya.

Untuk ikut menggunakan persetujuan yang ditinjau guardian Codex, atur `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Mode Guardian menggunakan jalur persetujuan tinjauan otomatis native Codex. Saat Codex meminta untuk
keluar dari sandbox, menulis di luar workspace, atau menambahkan izin seperti akses jaringan,
Codex merutekan permintaan persetujuan itu ke reviewer native alih-alih
prompt manusia. Reviewer menerapkan kerangka risiko Codex dan menyetujui atau menolak
permintaan spesifik tersebut. Gunakan Guardian saat Anda menginginkan lebih banyak guardrail daripada mode YOLO
tetapi tetap membutuhkan agen tanpa pengawasan untuk terus berjalan.

Preset `guardian` diperluas menjadi `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"`.
Field kebijakan individual tetap menimpa `mode`, sehingga deployment lanjutan dapat mencampur
preset dengan pilihan eksplisit. Nilai reviewer lama `guardian_subagent` masih
diterima sebagai alias kompatibilitas, tetapi konfigurasi baru sebaiknya menggunakan
`auto_review`.

Untuk server aplikasi yang sudah berjalan, gunakan transport WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Peluncuran server aplikasi stdio mewarisi lingkungan proses OpenClaw secara default,
tetapi OpenClaw memiliki bridge akun server aplikasi Codex dan menetapkan
`CODEX_HOME` serta `HOME` ke direktori per agen di bawah state OpenClaw agen tersebut.
Loader skill Codex sendiri membaca `$CODEX_HOME/skills` dan
`$HOME/.agents/skills`, sehingga kedua nilai diisolasi untuk peluncuran server aplikasi
lokal. Ini menjaga skills, plugin, konfigurasi, akun, dan state thread native Codex
tetap terskop ke agen OpenClaw alih-alih bocor dari home CLI Codex pribadi
operator.

Plugin OpenClaw dan snapshot skill OpenClaw tetap mengalir melalui registry plugin dan loader skill
OpenClaw sendiri. Aset CLI Codex pribadi tidak. Jika Anda memiliki
skills atau plugin CLI Codex yang berguna dan harus menjadi bagian dari agen OpenClaw,
inventarisasikan secara eksplisit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Provider migrasi Codex menyalin skills ke workspace agen OpenClaw saat ini.
Plugin native Codex, hook, dan file konfigurasi dilaporkan atau diarsipkan
untuk peninjauan manual alih-alih diaktifkan secara otomatis, karena mereka dapat
menjalankan perintah, mengekspos server MCP, atau membawa kredensial.

Autentikasi dipilih dalam urutan ini:

1. Profil autentikasi Codex OpenClaw eksplisit untuk agen.
2. Akun server aplikasi yang ada di home Codex agen tersebut.
3. Hanya untuk peluncuran server aplikasi stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, saat tidak ada akun server aplikasi dan autentikasi OpenAI
   masih diperlukan.

Saat OpenClaw melihat profil autentikasi Codex bergaya langganan ChatGPT, OpenClaw menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses turunan Codex yang dijalankan. Itu
menjaga kunci API tingkat Gateway tetap tersedia untuk embeddings atau model OpenAI
langsung tanpa membuat giliran app-server Codex native tertagih melalui API secara tidak sengaja.
Profil kunci API Codex eksplisit dan fallback kunci env stdio lokal menggunakan login
app-server alih-alih env proses turunan yang diwariskan. Koneksi app-server WebSocket
tidak menerima fallback kunci API env Gateway; gunakan profil autentikasi eksplisit atau akun
milik app-server remote sendiri.

Jika deployment membutuhkan isolasi lingkungan tambahan, tambahkan variabel tersebut ke
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` hanya memengaruhi proses turunan app-server Codex yang dijalankan.

Dynamic tools Codex default ke profil `native-first`. Dalam mode itu,
OpenClaw tidak mengekspos dynamic tools yang menduplikasi operasi workspace
native Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process`, dan
`update_plan`. Tool integrasi OpenClaw seperti messaging, sessions, media,
cron, browser, nodes, gateway, `heartbeat_respond`, dan `web_search` tetap
tersedia.

Field Plugin Codex tingkat atas yang didukung:

| Field                      | Default          | Arti                                                                                   |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Gunakan `"openclaw-compat"` untuk mengekspos set dynamic tool OpenClaw lengkap ke app-server Codex. |
| `codexDynamicToolsExclude` | `[]`             | Nama dynamic tool OpenClaw tambahan yang dihilangkan dari giliran app-server Codex.               |

Field `appServer` yang didukung:

| Field               | Default                                  | Arti                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                             |
| `command`           | biner Codex terkelola                     | Executable untuk transport stdio. Biarkan tidak disetel untuk menggunakan biner terkelola; setel hanya untuk override eksplisit.                                                                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                                                                                                                                                                                       |
| `url`               | tidak disetel                                    | URL app-server WebSocket.                                                                                                                                                                                                            |
| `authToken`         | tidak disetel                                    | Bearer token untuk transport WebSocket.                                                                                                                                                                                                |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                                                                                                                                                                                             |
| `clearEnv`          | `[]`                                     | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya. `CODEX_HOME` dan `HOME` dicadangkan untuk isolasi Codex per agen milik OpenClaw pada peluncuran lokal. |
| `requestTimeoutMs`  | `60000`                                  | Timeout untuk panggilan control-plane app-server.                                                                                                                                                                                          |
| `mode`              | `"yolo"`                                 | Preset untuk eksekusi YOLO atau yang ditinjau guardian.                                                                                                                                                                                      |
| `approvalPolicy`    | `"never"`                                | Kebijakan approval native Codex yang dikirim ke thread start/resume/turn.                                                                                                                                                                       |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox native Codex yang dikirim ke thread start/resume.                                                                                                                                                                               |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"auto_review"` agar Codex meninjau prompt approval native. `guardian_subagent` tetap menjadi alias legacy.                                                                                                                         |
| `serviceTier`       | tidak disetel                                    | Tingkat layanan app-server Codex opsional: `"fast"`, `"flex"`, atau `null`. Nilai legacy yang tidak valid diabaikan.                                                                                                                            |

Panggilan dynamic tool milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: setiap permintaan Codex `item/tool/call` harus menerima
respons OpenClaw dalam 30 detik. Saat timeout, OpenClaw membatalkan sinyal tool
jika didukung dan mengembalikan respons dynamic-tool yang gagal ke Codex agar
giliran dapat berlanjut alih-alih membiarkan sesi dalam status `processing`.

Setelah OpenClaw merespons permintaan app-server bercakupan giliran Codex, harness
juga mengharapkan Codex menyelesaikan giliran native dengan `turn/completed`. Jika
app-server diam selama 60 detik setelah respons tersebut, OpenClaw berupaya
sebaik mungkin menginterupsi giliran Codex, mencatat timeout diagnostik, dan merilis
lane sesi OpenClaw agar pesan chat lanjutan tidak mengantre di belakang giliran
native yang basi.

Override lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati biner terkelola saat
`appServer.command` tidak disetel.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai. Config
lebih disukai untuk deployment yang dapat diulang karena menjaga perilaku Plugin dalam
file yang ditinjau yang sama dengan sisa setup harness Codex.

## Penggunaan komputer

Computer Use dibahas dalam panduan setup tersendiri:
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak mem-vendor aplikasi kontrol desktop atau mengeksekusi
aksi desktop sendiri. OpenClaw menyiapkan app-server Codex, memverifikasi bahwa server MCP
`computer-use` tersedia, lalu membiarkan Codex menangani panggilan tool MCP native
selama giliran mode Codex.

Untuk akses driver TryCua langsung di luar alur marketplace Codex, daftarkan
`cua-driver mcp` dengan `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Lihat [Penggunaan Komputer Codex](/id/plugins/codex-computer-use) untuk perbedaan
antara Computer Use milik Codex dan pendaftaran MCP langsung.

Config minimal:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
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

Setup dapat diperiksa atau diinstal dari command surface:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use khusus macOS dan mungkin memerlukan izin OS lokal sebelum server MCP
Codex dapat mengontrol aplikasi. Jika `computerUse.enabled` adalah true dan server MCP
tidak tersedia, giliran mode Codex gagal sebelum thread dimulai alih-alih
berjalan diam-diam tanpa tool Computer Use native. Lihat
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use) untuk pilihan marketplace,
batas katalog remote, alasan status, dan troubleshooting.

Saat `computerUse.autoInstall` adalah true, OpenClaw dapat mendaftarkan marketplace
Codex Desktop standar yang dibundel dari
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` jika Codex
belum menemukan marketplace lokal. Gunakan `/new` atau `/reset` setelah
mengubah runtime atau config Computer Use agar sesi yang ada tidak mempertahankan
binding PI atau thread Codex lama.

## Resep umum

Codex lokal dengan transport stdio default:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Validasi harness khusus Codex:

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
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Approval Codex yang ditinjau guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

App-server remote dengan header eksplisit:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Peralihan model tetap dikendalikan OpenClaw. Saat sesi OpenClaw dilampirkan
ke thread Codex yang sudah ada, giliran berikutnya mengirim model OpenAI,
provider, kebijakan approval, sandbox, dan tingkat layanan yang saat ini dipilih
ke app-server lagi. Beralih dari `openai/gpt-5.5` ke `openai/gpt-5.2` mempertahankan
binding thread tetapi meminta Codex melanjutkan dengan model yang baru dipilih.

## Command Codex

Plugin yang dibundel mendaftarkan `/codex` sebagai slash command yang diotorisasi. Command ini
generik dan berfungsi di channel apa pun yang mendukung command teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas server aplikasi langsung, model, akun, batas laju, server MCP, dan Skills.
- `/codex models` mencantumkan model server aplikasi Codex langsung.
- `/codex threads [filter]` mencantumkan thread Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke thread Codex yang sudah ada.
- `/codex compact` meminta server aplikasi Codex untuk memadatkan thread yang terlampir.
- `/codex review` memulai ulasan native Codex untuk thread yang terlampir.
- `/codex diagnostics [note]` meminta konfirmasi sebelum mengirim umpan balik diagnostik Codex untuk thread yang terlampir.
- `/codex computer-use status` memeriksa Plugin Computer Use dan server MCP yang dikonfigurasi.
- `/codex computer-use install` menginstal Plugin Computer Use yang dikonfigurasi dan memuat ulang server MCP.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP server aplikasi Codex.
- `/codex skills` mencantumkan Skills server aplikasi Codex.

Ketika Codex melaporkan kegagalan batas penggunaan, OpenClaw menyertakan waktu reset
server aplikasi berikutnya jika Codex menyediakannya. Gunakan `/codex account` dalam
percakapan yang sama untuk memeriksa akun saat ini dan jendela batas laju.

### Alur kerja debugging umum

Ketika agen berbasis Codex melakukan sesuatu yang mengejutkan di Telegram, Discord, Slack,
atau saluran lain, mulai dari percakapan tempat masalah terjadi:

1. Jalankan `/diagnostics bad tool choice after image upload` atau catatan singkat lain
   yang menjelaskan apa yang Anda lihat.
2. Setujui permintaan diagnostik sekali. Persetujuan membuat zip diagnostik Gateway
   lokal dan, karena sesi menggunakan kerangka Codex, juga
   mengirim bundel umpan balik Codex yang relevan ke server OpenAI.
3. Salin balasan diagnostik yang selesai ke laporan bug atau thread dukungan.
   Balasan itu mencakup jalur bundel lokal, ringkasan privasi, id sesi OpenClaw,
   id thread Codex, dan baris `Inspect locally` untuk setiap thread Codex.
4. Jika Anda ingin men-debug jalannya sendiri, jalankan perintah `Inspect locally`
   yang dicetak di terminal. Perintah itu terlihat seperti `codex resume <thread-id>` dan membuka
   thread native Codex sehingga Anda dapat memeriksa percakapan, melanjutkannya secara lokal,
   atau bertanya kepada Codex mengapa ia memilih tool atau rencana tertentu.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan unggahan
umpan balik Codex untuk thread yang saat ini terlampir tanpa bundel diagnostik
Gateway OpenClaw penuh. Untuk sebagian besar laporan dukungan, `/diagnostics [note]` adalah
titik awal yang lebih baik karena mengikat status Gateway lokal dan id thread Codex
dalam satu balasan. Lihat [Ekspor diagnostik](/id/gateway/diagnostics)
untuk model privasi lengkap dan perilaku obrolan grup.

Inti OpenClaw juga mengekspos `/diagnostics [note]` khusus pemilik sebagai perintah
diagnostik Gateway umum. Prompt persetujuannya menampilkan pembukaan data sensitif,
menautkan ke [Ekspor Diagnostik](/id/gateway/diagnostics), dan meminta
`openclaw gateway diagnostics export --json` melalui persetujuan exec eksplisit
setiap kali. Jangan menyetujui diagnostik dengan aturan izinkan-semua. Setelah persetujuan,
OpenClaw mengirim laporan yang dapat ditempel dengan jalur bundel lokal dan ringkasan
manifest. Ketika sesi OpenClaw aktif menggunakan kerangka Codex, persetujuan
yang sama juga mengotorisasi pengiriman bundel umpan balik Codex yang relevan ke
server OpenAI. Prompt persetujuan mengatakan bahwa umpan balik Codex akan dikirim, tetapi
tidak mencantumkan id sesi atau thread Codex sebelum persetujuan.

Jika `/diagnostics` dipanggil oleh pemilik dalam obrolan grup, OpenClaw menjaga
saluran bersama tetap bersih: grup hanya menerima pemberitahuan singkat, sementara
pembukaan diagnostik, prompt persetujuan, dan id sesi/thread Codex dikirim ke
pemilik melalui rute persetujuan privat. Jika tidak ada rute pemilik privat,
OpenClaw menolak permintaan grup dan meminta pemilik menjalankannya dari DM.

Unggahan Codex yang disetujui memanggil `feedback/upload` server aplikasi Codex dan meminta
server aplikasi menyertakan log untuk setiap thread yang tercantum dan subthread Codex yang dibuat
jika tersedia. Unggahan melewati jalur umpan balik normal Codex ke server OpenAI;
jika umpan balik Codex dinonaktifkan di server aplikasi itu, perintah mengembalikan
kesalahan server aplikasi. Balasan diagnostik yang selesai mencantumkan saluran,
id sesi OpenClaw, id thread Codex, dan perintah lokal `codex resume <thread-id>`
untuk thread yang dikirim. Jika Anda menolak atau mengabaikan persetujuan,
OpenClaw tidak mencetak id Codex tersebut. Unggahan ini tidak menggantikan ekspor
diagnostik Gateway lokal.

`/codex resume` menulis berkas pengikat sidecar yang sama dengan yang digunakan kerangka untuk
giliran normal. Pada pesan berikutnya, OpenClaw melanjutkan thread Codex itu, meneruskan
model OpenClaw yang saat ini dipilih ke server aplikasi, dan tetap mengaktifkan riwayat
yang diperluas.

### Periksa thread Codex dari CLI

Cara tercepat untuk memahami jalannya Codex yang buruk sering kali adalah membuka thread native Codex
secara langsung:

```sh
codex resume <thread-id>
```

Gunakan ini ketika Anda melihat bug dalam percakapan saluran dan ingin memeriksa
sesi Codex yang bermasalah, melanjutkannya secara lokal, atau bertanya kepada Codex mengapa ia membuat
pilihan tool atau penalaran tertentu. Jalur termudah biasanya menjalankan
`/diagnostics [note]` terlebih dahulu: setelah Anda menyetujuinya, laporan yang selesai mencantumkan
setiap thread Codex dan mencetak perintah `Inspect locally`, misalnya
`codex resume <thread-id>`. Anda dapat menyalin perintah itu langsung ke terminal.

Anda juga dapat memperoleh id thread dari `/codex binding` untuk obrolan saat ini atau
`/codex threads [filter]` untuk thread server aplikasi Codex terbaru, lalu menjalankan perintah
`codex resume` yang sama di shell Anda.

Permukaan perintah memerlukan server aplikasi Codex `0.125.0` atau yang lebih baru. Metode
kontrol individual dilaporkan sebagai `unsupported by this Codex app-server` jika
server aplikasi masa depan atau kustom tidak mengekspos metode JSON-RPC tersebut.

## Batas hook

Kerangka Codex memiliki tiga lapisan hook:

| Lapisan                               | Pemilik                  | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/Plugin di seluruh kerangka PI dan Codex.      |
| Middleware ekstensi server aplikasi Codex | Plugin bawaan OpenClaw | Perilaku adaptor per giliran di sekitar tool dinamis OpenClaw.      |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan tool native dari konfigurasi Codex. |

OpenClaw tidak menggunakan berkas `hooks.json` proyek atau global Codex untuk merutekan
perilaku Plugin OpenClaw. Untuk tool native dan bridge izin yang didukung,
OpenClaw menyuntikkan konfigurasi Codex per thread untuk `PreToolUse`, `PostToolUse`,
`PermissionRequest`, dan `Stop`. Hook Codex lain seperti `SessionStart` dan
`UserPromptSubmit` tetap menjadi kontrol tingkat Codex; hook tersebut tidak diekspos sebagai
hook Plugin OpenClaw dalam kontrak v1.

Untuk tool dinamis OpenClaw, OpenClaw mengeksekusi tool setelah Codex meminta
panggilan, sehingga OpenClaw menjalankan perilaku Plugin dan middleware yang dimilikinya dalam
adaptor kerangka. Untuk tool native Codex, Codex memiliki catatan tool kanonis.
OpenClaw dapat mencerminkan event tertentu, tetapi tidak dapat menulis ulang thread native Codex
kecuali Codex mengekspos operasi itu melalui server aplikasi atau callback hook native.

Proyeksi Compaction dan siklus hidup LLM berasal dari notifikasi server aplikasi Codex
dan status adaptor OpenClaw, bukan perintah hook native Codex.
Event `before_compaction`, `after_compaction`, `llm_input`, dan
`llm_output` OpenClaw adalah observasi tingkat adaptor, bukan tangkapan byte-demi-byte
dari permintaan internal atau muatan Compaction Codex.

Notifikasi server aplikasi `hook/started` dan `hook/completed` native Codex
diproyeksikan sebagai event agen `codex_app_server.hook` untuk trajektori dan debugging.
Notifikasi tersebut tidak memanggil hook Plugin OpenClaw.

## Kontrak dukungan V1

Mode Codex bukan PI dengan panggilan model berbeda di bawahnya. Codex memiliki lebih banyak bagian dari
loop model native, dan OpenClaw mengadaptasi permukaan Plugin dan sesinya
di sekitar batas tersebut.

Didukung dalam runtime Codex v1:

| Permukaan                                     | Dukungan                                | Alasan                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop model OpenAI melalui Codex               | Didukung                                | Server aplikasi Codex memiliki giliran OpenAI, pelanjutan thread native, dan kelanjutan tool native.                                                                                                  |
| Perutean dan pengiriman saluran OpenClaw      | Didukung                                | Telegram, Discord, Slack, WhatsApp, iMessage, dan saluran lain tetap berada di luar runtime model.                                                                                                     |
| Tool dinamis OpenClaw                         | Didukung                                | Codex meminta OpenClaw mengeksekusi tool ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                                                                                       |
| Plugin prompt dan konteks                     | Didukung                                | OpenClaw membangun overlay prompt dan memproyeksikan konteks ke giliran Codex sebelum memulai atau melanjutkan thread.                                                                                |
| Siklus hidup mesin konteks                    | Didukung                                | Perakitan, ingest atau pemeliharaan setelah giliran, dan koordinasi Compaction mesin konteks berjalan untuk giliran Codex.                                                                            |
| Hook tool dinamis                             | Didukung                                | `before_tool_call`, `after_tool_call`, dan middleware hasil tool berjalan di sekitar tool dinamis milik OpenClaw.                                                                                     |
| Hook siklus hidup                             | Didukung sebagai observasi adaptor      | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` berjalan dengan muatan mode Codex yang jujur.                                                                     |
| Gerbang revisi jawaban akhir                  | Didukung melalui relai hook native      | `Stop` Codex diteruskan ke `before_agent_finalize`; `revise` meminta Codex melakukan satu lintasan model lagi sebelum finalisasi.                                                                     |
| Shell, patch, dan MCP native blokir atau observasi | Didukung melalui relai hook native | `PreToolUse` dan `PostToolUse` Codex diteruskan untuk permukaan tool native yang telah dikomit, termasuk muatan MCP pada server aplikasi Codex `0.125.0` atau yang lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak. |
| Kebijakan izin native                         | Didukung melalui relai hook native      | `PermissionRequest` Codex dapat dirutekan melalui kebijakan OpenClaw tempat runtime mengeksposnya. Jika OpenClaw tidak mengembalikan keputusan, Codex berlanjut melalui jalur guardian atau persetujuan pengguna normalnya. |
| Penangkapan trajektori server aplikasi        | Didukung                                | OpenClaw merekam permintaan yang dikirimnya ke server aplikasi dan notifikasi server aplikasi yang diterimanya.                                                                                       |

Tidak didukung dalam runtime Codex v1:

| Permukaan                                           | Batas V1                                                                                                                                        | Jalur masa depan                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutasi argumen alat native                          | Hook pra-alat native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen alat native Codex.                                      | Memerlukan dukungan hook/skema Codex untuk input alat pengganti.                          |
| Riwayat transkrip native Codex yang dapat diedit    | Codex memiliki riwayat thread native kanonis. OpenClaw memiliki mirror dan dapat memproyeksikan konteks masa depan, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API app-server Codex eksplisit jika pembedahan thread native diperlukan.         |
| `tool_result_persist` untuk catatan alat native Codex | Hook tersebut mengubah penulisan transkrip milik OpenClaw, bukan catatan alat native Codex.                                                     | Dapat me-mirror catatan yang diubah, tetapi penulisan ulang kanonis memerlukan dukungan Codex. |
| Metadata compaction native yang kaya                | OpenClaw mengamati awal dan penyelesaian compaction, tetapi tidak menerima daftar tetap yang dipertahankan/dihapus, delta token, atau payload ringkasan. | Memerlukan peristiwa compaction Codex yang lebih kaya.                                     |
| Intervensi compaction                               | Hook compaction OpenClaw saat ini berada pada tingkat notifikasi dalam mode Codex.                                                              | Tambahkan hook pra/pasca compaction Codex jika plugin perlu memveto atau menulis ulang compaction native. |
| Penangkapan permintaan API model byte demi byte     | OpenClaw dapat menangkap permintaan dan notifikasi app-server, tetapi inti Codex membangun permintaan API OpenAI final secara internal.          | Memerlukan peristiwa pelacakan permintaan model Codex atau API debug.                      |

## Alat, media, dan compaction

Harness Codex hanya mengubah eksekutor agen tertanam tingkat rendah.

OpenClaw tetap membangun daftar alat dan menerima hasil alat dinamis dari
harness. Teks, gambar, video, musik, TTS, persetujuan, dan keluaran alat
pesan terus melewati jalur pengiriman OpenClaw normal.

Relay hook native sengaja dibuat generik, tetapi kontrak dukungan v1
dibatasi pada jalur alat dan izin native Codex yang diuji OpenClaw. Dalam
runtime Codex, ini mencakup payload shell, patch, dan MCP `PreToolUse`,
`PostToolUse`, serta `PermissionRequest`. Jangan berasumsi setiap peristiwa
hook Codex di masa depan adalah permukaan plugin OpenClaw sampai kontrak
runtime menamainya.

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan izinkan atau
tolak eksplisit ketika kebijakan memutuskan. Hasil tanpa keputusan bukanlah
izin. Codex memperlakukannya sebagai tanpa keputusan hook dan meneruskannya ke
guardian miliknya sendiri atau jalur persetujuan pengguna.

Elisitasi persetujuan alat MCP Codex dirutekan melalui alur persetujuan plugin
OpenClaw ketika Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt `request_user_input` Codex dikirim kembali ke chat
asal, dan pesan tindak lanjut berikutnya yang mengantre menjawab permintaan
server native tersebut alih-alih diarahkan sebagai konteks tambahan. Permintaan
elisitasi MCP lainnya tetap gagal tertutup.

Pengarahan antrean run aktif dipetakan ke app-server Codex `turn/steer`. Dengan
default `messages.queue.mode: "steer"`, OpenClaw mengelompokkan pesan chat yang
mengantre selama jendela tenang yang dikonfigurasi dan mengirimkannya sebagai
satu permintaan `turn/steer` dalam urutan kedatangan. Mode `queue` lama
mengirim permintaan `turn/steer` terpisah. Giliran tinjauan Codex dan
compaction manual dapat menolak pengarahan pada giliran yang sama, dalam hal
ini OpenClaw menggunakan antrean tindak lanjut ketika mode yang dipilih
mengizinkan fallback. Lihat [Antrean pengarahan](/id/concepts/queue-steering).

Ketika model yang dipilih menggunakan harness Codex, compaction thread native
didelegasikan ke app-server Codex. OpenClaw mempertahankan mirror transkrip
untuk riwayat kanal, pencarian, `/new`, `/reset`, dan peralihan model atau
harness di masa depan. Mirror mencakup prompt pengguna, teks asisten final, dan
catatan penalaran atau rencana Codex ringan ketika app-server memancarkannya.
Saat ini, OpenClaw hanya mencatat sinyal awal dan penyelesaian compaction
native. OpenClaw belum mengekspos ringkasan compaction yang dapat dibaca
manusia atau daftar yang dapat diaudit tentang entri mana yang dipertahankan
Codex setelah compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` saat ini
tidak menulis ulang catatan hasil alat native Codex. Ini hanya berlaku ketika
OpenClaw menulis hasil alat transkrip sesi milik OpenClaw.

Pembuatan media tidak memerlukan PI. Pemahaman gambar, video, musik, PDF, TTS,
dan media tetap menggunakan pengaturan penyedia/model yang sesuai seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan masalah

**Codex tidak muncul sebagai penyedia `/model` normal:** ini diharapkan untuk
konfigurasi baru. Pilih model `openai/gpt-*` dengan
`agentRuntime.id: "codex"` (atau ref `codex/*` lama), aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan PI, bukan Codex:** `agentRuntime.id: "auto"` masih dapat menggunakan PI sebagai
backend kompatibilitas ketika tidak ada harness Codex yang mengambil run. Atur
`agentRuntime.id: "codex"` untuk memaksa pemilihan Codex saat pengujian.
Runtime Codex yang dipaksa gagal alih-alih fallback ke PI. Setelah app-server
Codex dipilih, kegagalannya muncul secara langsung.

**App-server ditolak:** tingkatkan Codex agar handshake app-server
melaporkan versi `0.125.0` atau yang lebih baru. Prarilis dengan versi yang sama
atau versi bersufiks build seperti `0.125.0-alpha.2` atau `0.125.0+custom`
ditolak karena batas bawah protokol stabil `0.125.0` adalah yang diuji
OpenClaw.

**Penemuan model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan penemuan.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan pastikan app-server jarak jauh berbicara dengan versi protokol app-server
Codex yang sama.

**Model non-Codex menggunakan PI:** ini diharapkan kecuali Anda memaksa
`agentRuntime.id: "codex"` untuk agen tersebut atau memilih ref lama
`codex/*`. Ref `openai/gpt-*` biasa dan ref penyedia lain tetap berada di jalur
penyedia normalnya dalam mode `auto`. Jika Anda memaksa `agentRuntime.id: "codex"`, setiap giliran tertanam
untuk agen tersebut harus berupa model OpenAI yang didukung Codex.

**Computer Use terpasang tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika suatu alat melaporkan
`Native hook relay unavailable`, gunakan `/new` atau `/reset`; jika masih
berlanjut, mulai ulang gateway untuk membersihkan pendaftaran hook native yang
basi. Jika `computer-use.list_apps` kehabisan waktu, mulai ulang Codex Computer
Use atau Codex Desktop dan coba lagi.

## Terkait

- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Penyedia model](/id/concepts/model-providers)
- [Penyedia OpenAI](/id/providers/openai)
- [Status](/id/cli/status)
- [Hook plugin](/id/plugins/hooks)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
