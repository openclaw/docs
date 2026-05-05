---
read_when:
    - Anda ingin menggunakan kerangka server aplikasi Codex bawaan
    - Anda membutuhkan contoh konfigurasi harness Codex
    - Anda ingin penerapan yang hanya menggunakan Codex gagal, bukan beralih kembali ke PI
summary: Jalankan giliran agen tertanam OpenClaw melalui harness app-server Codex yang disertakan
title: Kerangka Codex
x-i18n:
    generated_at: "2026-05-05T01:48:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76302351e7e162e858dd6e3cffca84b3fd54497dd060104da9f90fe4c1a33f9b
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen tertanam melalui
server aplikasi Codex, bukan melalui harness PI bawaan.

Gunakan ini saat Anda ingin Codex memiliki sesi agen tingkat rendah: penemuan
model, pelanjutan thread native, Compaction native, dan eksekusi server
aplikasi. OpenClaw tetap memiliki kanal obrolan, berkas sesi, pemilihan model,
alat, persetujuan, pengiriman media, dan cermin transkrip yang terlihat.

Saat giliran obrolan sumber berjalan melalui harness Codex, balasan yang terlihat
secara default menggunakan alat OpenClaw `message` jika deployment belum
mengonfigurasi `messages.visibleReplies` secara eksplisit. Agen tetap dapat
menyelesaikan giliran Codex-nya secara privat; agen hanya memposting ke kanal
saat memanggil `message(action="send")`. Atur
`messages.visibleReplies: "automatic"` untuk mempertahankan balasan akhir
obrolan langsung pada jalur pengiriman otomatis lama.

Giliran Heartbeat Codex juga mendapatkan alat `heartbeat_respond` secara
default, sehingga agen dapat mencatat apakah bangun tersebut harus tetap senyap
atau memberi notifikasi tanpa mengodekan alur kontrol itu dalam teks akhir.

Panduan inisiatif khusus Heartbeat dikirim sebagai instruksi developer mode
kolaborasi Codex pada giliran Heartbeat itu sendiri. Giliran obrolan biasa
memulihkan mode Default Codex, bukan membawa filosofi Heartbeat dalam prompt
runtime normalnya.

Jika Anda mencoba memahami konteksnya, mulai dari
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya adalah:
`openai/gpt-5.5` adalah ref model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau kanal lain tetap menjadi permukaan komunikasi.

## Konfigurasi cepat

Sebagian besar pengguna yang menginginkan "Codex di OpenClaw" menginginkan rute
ini: masuk dengan langganan ChatGPT/Codex, lalu jalankan giliran agen tertanam
melalui runtime server aplikasi Codex native. Ref model tetap kanonis sebagai
`openai/gpt-*`; auth langganan berasal dari akun/profil Codex, bukan dari
prefiks model `openai-codex/*`.

Masuk terlebih dahulu dengan OAuth Codex jika belum:

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

Jangan gunakan `openai-codex/gpt-*` saat yang Anda maksud adalah runtime Codex
native. Prefiks itu adalah rute eksplisit "OAuth Codex melalui PI". Perubahan
konfigurasi berlaku untuk sesi baru atau yang direset; sesi yang sudah ada tetap
mempertahankan runtime yang direkam.

## Yang diubah Plugin ini

Plugin `codex` bawaan menyumbangkan beberapa kapabilitas terpisah:

| Kapabilitas                         | Cara Anda menggunakannya                          | Yang dilakukannya                                                              |
| ----------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| Runtime tertanam native             | `agentRuntime.id: "codex"`                        | Menjalankan giliran agen tertanam OpenClaw melalui server aplikasi Codex.      |
| Perintah kontrol obrolan native     | `/codex bind`, `/codex resume`, `/codex steer`, ... | Mengikat dan mengontrol thread server aplikasi Codex dari percakapan pesan.    |
| Penyedia/katalog server aplikasi Codex | internal `codex`, diekspos melalui harness       | Memungkinkan runtime menemukan dan memvalidasi model server aplikasi.          |
| Jalur pemahaman media Codex         | jalur kompatibilitas model gambar `codex/*`       | Menjalankan giliran server aplikasi Codex terbatas untuk model pemahaman gambar yang didukung. |
| Relay hook native                   | Hook Plugin di sekitar peristiwa native Codex     | Memungkinkan OpenClaw mengamati/memblokir peristiwa alat/finalisasi native Codex yang didukung. |

Mengaktifkan Plugin membuat kapabilitas tersebut tersedia. Itu **tidak**:

- mulai menggunakan Codex untuk setiap model OpenAI
- mengonversi ref model `openai-codex/*` menjadi runtime native
- menjadikan ACP/acpx sebagai jalur Codex default
- melakukan hot-switch pada sesi yang sudah merekam runtime PI
- mengganti pengiriman kanal OpenClaw, berkas sesi, penyimpanan profil auth, atau
  perutean pesan

Plugin yang sama juga memiliki permukaan perintah kontrol obrolan native
`/codex`. Jika Plugin diaktifkan dan pengguna meminta untuk mengikat,
melanjutkan, mengarahkan, menghentikan, atau memeriksa thread Codex dari
obrolan, agen harus lebih memilih `/codex ...` daripada ACP. ACP tetap menjadi
fallback eksplisit saat pengguna meminta ACP/acpx atau sedang menguji adapter
Codex ACP.

Giliran Codex native mempertahankan hook Plugin OpenClaw sebagai lapisan
kompatibilitas publik. Ini adalah hook OpenClaw dalam proses, bukan hook perintah
Codex `hooks.json`:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` untuk catatan transkrip yang dicerminkan
- `before_agent_finalize` melalui relay `Stop` Codex
- `agent_end`

Plugin juga dapat mendaftarkan middleware hasil alat yang netral-runtime untuk
menulis ulang hasil alat dinamis OpenClaw setelah OpenClaw mengeksekusi alat dan
sebelum hasil dikembalikan ke Codex. Ini terpisah dari hook Plugin publik
`tool_result_persist`, yang mentransformasi penulisan hasil alat transkrip milik
OpenClaw.

Untuk semantik hook Plugin itu sendiri, lihat [Hook Plugin](/id/plugins/hooks)
dan [Perilaku guard Plugin](/id/tools/plugin).

Harness nonaktif secara default. Konfigurasi baru harus mempertahankan ref model
OpenAI secara kanonis sebagai `openai/gpt-*` dan secara eksplisit memaksa
`agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex` saat menginginkan
eksekusi server aplikasi native. Ref model lama `codex/*` masih memilih harness
secara otomatis untuk kompatibilitas, tetapi prefiks penyedia lama yang didukung
runtime tidak ditampilkan sebagai pilihan model/penyedia normal.

Jika Plugin `codex` diaktifkan tetapi model utama masih
`openai-codex/*`, `openclaw doctor` memberi peringatan alih-alih mengubah
rute. Itu disengaja: `openai-codex/*` tetap menjadi jalur OAuth/langganan PI
Codex, dan eksekusi server aplikasi native tetap menjadi pilihan runtime
eksplisit.

## Peta rute

Gunakan tabel ini sebelum mengubah konfigurasi:

| Perilaku yang diinginkan                            | Ref model                  | Konfigurasi runtime                    | Rute auth/profil             | Label status yang diharapkan   |
| --------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Langganan ChatGPT/Codex dengan runtime Codex native | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | OAuth Codex atau akun Codex  | `Runtime: OpenAI Codex`        |
| API OpenAI melalui runner OpenClaw normal           | `openai/gpt-*`             | dihilangkan atau `runtime: "pi"`       | Kunci API OpenAI             | `Runtime: OpenClaw Pi Default` |
| Langganan ChatGPT/Codex melalui PI                  | `openai-codex/gpt-*`       | dihilangkan atau `runtime: "pi"`       | Penyedia OAuth OpenAI Codex  | `Runtime: OpenClaw Pi Default` |
| Penyedia campuran dengan mode otomatis konservatif  | ref khusus penyedia        | `agentRuntime.id: "auto"`              | Per penyedia yang dipilih    | Bergantung pada runtime yang dipilih |
| Sesi adapter ACP Codex eksplisit                    | bergantung prompt/model ACP | `sessions_spawn` dengan `runtime: "acp"` | Auth backend ACP             | Status tugas/sesi ACP          |

Pemisahan pentingnya adalah penyedia versus runtime:

- `openai-codex/*` menjawab "rute penyedia/auth mana yang harus digunakan PI?"
- `agentRuntime.id: "codex"` menjawab "loop mana yang harus mengeksekusi giliran
  tertanam ini?"
- `/codex ...` menjawab "percakapan Codex native mana yang harus diikat atau
  dikontrol obrolan ini?"
- ACP menjawab "proses harness eksternal mana yang harus diluncurkan acpx?"

## Pilih prefiks model yang tepat

Rute keluarga OpenAI bersifat spesifik-prefiks. Untuk setup umum langganan plus
runtime Codex native, gunakan `openai/*` dengan `agentRuntime.id: "codex"`.
Gunakan `openai-codex/*` hanya saat Anda sengaja menginginkan OAuth Codex
melalui PI:

| Ref model                                     | Jalur runtime                                | Gunakan saat                                                               |
| --------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Penyedia OpenAI melalui plumbing OpenClaw/PI | Anda menginginkan akses API OpenAI Platform langsung saat ini dengan `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OAuth OpenAI Codex melalui OpenClaw/PI       | Anda menginginkan auth langganan ChatGPT/Codex dengan runner PI default.   |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness server aplikasi Codex               | Anda menginginkan auth langganan ChatGPT/Codex dengan eksekusi Codex native. |

GPT-5.5 dapat muncul pada rute kunci API OpenAI langsung maupun langganan Codex
saat akun Anda mengeksposnya. Gunakan `openai/gpt-5.5` dengan harness server
aplikasi Codex untuk runtime Codex native, `openai-codex/gpt-5.5` untuk OAuth
PI, atau `openai/gpt-5.5` tanpa override runtime Codex untuk lalu lintas kunci
API langsung.

Ref lama `codex/gpt-*` tetap diterima sebagai alias kompatibilitas. Migrasi
kompatibilitas doctor menulis ulang ref runtime utama lama menjadi ref model
kanonis dan merekam kebijakan runtime secara terpisah, sementara ref lama yang
hanya fallback dibiarkan tidak berubah karena runtime dikonfigurasi untuk seluruh
kontainer agen. Konfigurasi OAuth PI Codex baru harus menggunakan
`openai-codex/gpt-*`; konfigurasi harness server aplikasi native baru harus
menggunakan `openai/gpt-*` plus `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan
`openai-codex/gpt-*` saat pemahaman gambar harus berjalan melalui jalur penyedia
OAuth OpenAI Codex. Gunakan `codex/gpt-*` saat pemahaman gambar harus berjalan
melalui giliran server aplikasi Codex terbatas. Model server aplikasi Codex
harus mengiklankan dukungan input gambar; model Codex hanya-teks gagal sebelum
giliran media dimulai.

Gunakan `/status` untuk mengonfirmasi harness efektif bagi sesi saat ini. Jika
pilihannya mengejutkan, aktifkan pencatatan debug untuk subsistem
`agents/harness` dan periksa catatan terstruktur `agent harness selected` milik
Gateway. Catatan itu mencakup id harness yang dipilih, alasan pemilihan,
kebijakan runtime/fallback, dan, dalam mode `auto`, hasil dukungan setiap
kandidat Plugin.

### Arti peringatan doctor

`openclaw doctor` memberi peringatan saat semua hal ini benar:

- Plugin `codex` bawaan diaktifkan atau diizinkan
- model utama agen adalah `openai-codex/*`
- runtime efektif agen tersebut bukan `codex`

Peringatan itu ada karena pengguna sering mengharapkan "Plugin Codex diaktifkan"
berarti "runtime server aplikasi Codex native." OpenClaw tidak melakukan lompatan
itu. Peringatan tersebut berarti:

- **Tidak diperlukan perubahan** jika Anda memang menginginkan OAuth
  ChatGPT/Codex melalui PI.
- Ubah model menjadi `openai/<model>` dan atur
  `agentRuntime.id: "codex"` jika Anda menginginkan eksekusi server aplikasi
  native.
- Sesi yang sudah ada tetap memerlukan `/new` atau `/reset` setelah perubahan
  runtime, karena pin runtime sesi bersifat lengket.

Pemilihan harness bukan kontrol sesi live. Saat giliran tertanam berjalan,
OpenClaw merekam id harness yang dipilih pada sesi tersebut dan terus
menggunakannya untuk giliran berikutnya dalam id sesi yang sama. Ubah konfigurasi
`agentRuntime` atau `OPENCLAW_AGENT_RUNTIME` saat Anda ingin sesi mendatang
menggunakan harness lain; gunakan `/new` atau `/reset` untuk memulai sesi baru
sebelum mengganti percakapan yang sudah ada antara PI dan Codex. Ini menghindari
pemutaran ulang satu transkrip melalui dua sistem sesi native yang tidak
kompatibel.

Sesi lama yang dibuat sebelum pin harness diperlakukan sebagai dipin ke PI setelah
memiliki riwayat transkrip. Gunakan `/new` atau `/reset` untuk mengikutsertakan
percakapan itu ke Codex setelah mengubah konfigurasi.

`/status` menampilkan runtime model efektif. Harness PI bawaan muncul sebagai
`Runtime: OpenClaw Pi Default`, dan harness app-server Codex muncul sebagai
`Runtime: OpenAI Codex`.

## Persyaratan

- OpenClaw dengan plugin `codex` bawaan tersedia.
- App-server Codex `0.125.0` atau yang lebih baru. Plugin bawaan mengelola biner
  app-server Codex yang kompatibel secara default, sehingga perintah `codex`
  lokal di `PATH` tidak memengaruhi startup harness normal.
- Auth Codex tersedia untuk proses app-server atau untuk jembatan auth Codex
  OpenClaw. Peluncuran app-server lokal menggunakan home Codex yang dikelola
  OpenClaw untuk setiap agen dan `HOME` anak yang terisolasi, sehingga secara
  default tidak membaca akun, skills, plugins, konfigurasi, status thread, atau
  `$HOME/.agents/skills` native pribadi Anda di `~/.codex`.

Plugin memblokir handshake app-server lama atau tanpa versi. Ini menjaga
OpenClaw tetap pada permukaan protokol yang telah diuji.

Untuk uji smoke live dan Docker, auth biasanya berasal dari akun CLI Codex
atau profil auth `openai-codex` OpenClaw. Peluncuran app-server stdio lokal juga
dapat fallback ke `CODEX_API_KEY` / `OPENAI_API_KEY` ketika tidak ada akun.

## File bootstrap workspace

Codex menangani `AGENTS.md` sendiri melalui penemuan dokumen proyek native. OpenClaw
tidak menulis file dokumen proyek Codex sintetis atau bergantung pada nama file
fallback Codex untuk file persona, karena fallback Codex hanya berlaku saat
`AGENTS.md` tidak ada.

Untuk paritas workspace OpenClaw, harness Codex menyelesaikan file bootstrap lain
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md`, dan `MEMORY.md` jika ada) dan meneruskannya melalui instruksi
konfigurasi Codex pada `thread/start` dan `thread/resume`. Ini membuat konteks
persona/profil workspace `SOUL.md` dan terkait tetap terlihat tanpa
menduplikasi `AGENTS.md`.

## Tambahkan Codex bersama model lain

Jangan tetapkan `agentRuntime.id: "codex"` secara global jika agen yang sama harus bebas beralih
antara Codex dan model penyedia non-Codex. Runtime yang dipaksa berlaku untuk setiap
giliran tertanam untuk agen atau sesi tersebut. Jika Anda memilih model Anthropic saat
runtime itu dipaksa, OpenClaw tetap mencoba harness Codex dan gagal tertutup
alih-alih secara diam-diam merutekan giliran itu melalui PI.

Gunakan salah satu bentuk ini sebagai gantinya:

- Letakkan Codex pada agen khusus dengan `agentRuntime.id: "codex"`.
- Pertahankan agen default pada `agentRuntime.id: "auto"` dan fallback PI untuk penggunaan
  penyedia campuran normal.
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

- Agen default `main` menggunakan jalur penyedia normal dan fallback kompatibilitas PI.
- Agen `codex` menggunakan harness app-server Codex.
- Jika Codex hilang atau tidak didukung untuk agen `codex`, giliran gagal
  alih-alih diam-diam menggunakan PI.

## Perutean perintah agen

Agen harus merutekan permintaan pengguna berdasarkan maksud, bukan hanya kata "Codex":

| Pengguna meminta...                                    | Agen harus menggunakan...                        |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Ikat chat ini ke Codex"                               | `/codex bind`                                    |
| "Lanjutkan thread Codex `<id>` di sini"                | `/codex resume <id>`                             |
| "Tampilkan thread Codex"                               | `/codex threads`                                 |
| "Ajukan laporan dukungan untuk proses Codex yang buruk" | `/diagnostics [note]`                            |
| "Kirim hanya umpan balik Codex untuk thread terlampir ini" | `/codex diagnostics [note]`                      |
| "Gunakan langganan ChatGPT/Codex saya dengan runtime Codex" | `openai/*` plus `agentRuntime.id: "codex"`       |
| "Gunakan langganan ChatGPT/Codex saya melalui PI"      | ref model `openai-codex/*`                       |
| "Jalankan Codex melalui ACP/acpx"                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Mulai Claude Code/Gemini/OpenCode/Cursor dalam thread" | ACP/acpx, bukan `/codex` dan bukan sub-agen native |

OpenClaw hanya mengiklankan panduan spawn ACP kepada agen saat ACP diaktifkan,
dapat dikirim, dan didukung oleh backend runtime yang dimuat. Jika ACP tidak tersedia,
prompt sistem dan skills plugin tidak boleh mengajari agen tentang perutean ACP.

## Deployment khusus Codex

Paksa harness Codex saat Anda perlu membuktikan bahwa setiap giliran agen tertanam
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

Dengan Codex dipaksa, OpenClaw gagal lebih awal jika plugin Codex dinonaktifkan,
app-server terlalu lama, atau app-server tidak dapat dimulai.

## Codex per agen

Anda dapat membuat satu agen khusus Codex sementara agen default tetap menggunakan
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
OpenClaw baru dan harness Codex membuat atau melanjutkan thread app-server sidecar
sesuai kebutuhan. `/reset` menghapus binding sesi OpenClaw untuk thread tersebut
dan memungkinkan giliran berikutnya menyelesaikan harness dari konfigurasi saat ini lagi.

## Penemuan model

Secara default, plugin Codex meminta model yang tersedia kepada app-server. Jika
penemuan gagal atau timeout, plugin menggunakan katalog fallback bawaan untuk:

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

Nonaktifkan penemuan saat Anda ingin startup menghindari probing Codex dan tetap pada
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

## Koneksi dan kebijakan app-server

Secara default, plugin memulai biner Codex terkelola OpenClaw secara lokal dengan:

```bash
codex app-server --listen stdio://
```

Biner terkelola dikirim bersama paket plugin `codex`. Ini menjaga versi
app-server tetap terikat ke plugin bawaan, bukan ke CLI Codex terpisah apa pun
yang kebetulan terinstal secara lokal. Tetapkan `appServer.command` hanya saat
Anda memang ingin menjalankan executable yang berbeda.

Secara default, OpenClaw memulai sesi harness Codex lokal dalam mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Ini adalah postur operator lokal tepercaya yang digunakan
untuk Heartbeat otonom: Codex dapat menggunakan alat shell dan jaringan tanpa
berhenti pada prompt persetujuan native yang tidak ada orang di sekitar untuk menjawab.

Untuk ikut serta dalam persetujuan yang ditinjau guardian Codex, tetapkan `appServer.mode:
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

Mode guardian menggunakan jalur persetujuan tinjauan otomatis native Codex. Saat Codex meminta
keluar dari sandbox, menulis di luar workspace, atau menambahkan izin seperti akses jaringan,
Codex merutekan permintaan persetujuan itu ke peninjau native alih-alih prompt manusia.
Peninjau menerapkan kerangka risiko Codex dan menyetujui atau menolak permintaan spesifik
tersebut. Gunakan Guardian saat Anda menginginkan lebih banyak guardrail daripada mode YOLO
tetapi tetap membutuhkan agen tanpa pengawasan untuk terus berjalan.

Preset `guardian` diperluas menjadi `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"`.
Field kebijakan individual tetap menimpa `mode`, sehingga deployment lanjutan dapat mencampur
preset dengan pilihan eksplisit. Nilai peninjau lama `guardian_subagent` masih
diterima sebagai alias kompatibilitas, tetapi konfigurasi baru sebaiknya menggunakan
`auto_review`.

Untuk app-server yang sudah berjalan, gunakan transport WebSocket:

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

Peluncuran app-server stdio mewarisi lingkungan proses OpenClaw secara default,
tetapi OpenClaw memiliki jembatan akun app-server Codex dan menetapkan
`CODEX_HOME` serta `HOME` ke direktori per agen di bawah status OpenClaw agen tersebut.
Pemuat skill Codex sendiri membaca `$CODEX_HOME/skills` dan
`$HOME/.agents/skills`, sehingga kedua nilai diisolasi untuk peluncuran app-server
lokal. Ini menjaga skills, plugins, konfigurasi, akun, dan status thread native Codex
tetap berada dalam cakupan agen OpenClaw alih-alih bocor dari home CLI Codex pribadi
operator.

Plugin OpenClaw dan snapshot skill OpenClaw tetap mengalir melalui registry plugin dan pemuat
skill milik OpenClaw sendiri. Aset CLI Codex pribadi tidak. Jika Anda memiliki
skills atau plugins CLI Codex yang berguna dan harus menjadi bagian dari agen OpenClaw,
inventarisasikan secara eksplisit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Penyedia migrasi Codex menyalin skills ke workspace agen OpenClaw saat ini.
Plugin, hook, dan file konfigurasi native Codex dilaporkan atau diarsipkan
untuk peninjauan manual alih-alih diaktifkan otomatis, karena mereka dapat
mengeksekusi perintah, mengekspos server MCP, atau membawa kredensial.

Auth dipilih dalam urutan ini:

1. Profil auth Codex OpenClaw eksplisit untuk agen.
2. Akun app-server yang sudah ada di home Codex agen tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, saat tidak ada akun app-server dan auth OpenAI masih
   diperlukan.

Saat OpenClaw melihat profil auth Codex bergaya langganan ChatGPT, OpenClaw menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses anak Codex yang di-spawn. Ini
menjaga kunci API tingkat Gateway tetap tersedia untuk embeddings atau model OpenAI langsung
tanpa membuat giliran app-server Codex native ditagihkan melalui API secara tidak sengaja.
Profil kunci API Codex eksplisit dan fallback kunci lingkungan stdio lokal menggunakan login
app-server alih-alih env proses anak yang diwarisi. Koneksi app-server WebSocket
tidak menerima fallback kunci API env Gateway; gunakan profil auth eksplisit atau akun
app-server jarak jauh sendiri.

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

`appServer.clearEnv` hanya memengaruhi proses anak app-server Codex yang dijalankan.

Tools dinamis Codex secara default menggunakan profil `native-first`. Dalam mode itu,
OpenClaw tidak mengekspos tools dinamis yang menduplikasi operasi workspace
native Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process`, dan
`update_plan`. Tools integrasi OpenClaw seperti perpesanan, sesi, media,
cron, browser, node, gateway, `heartbeat_respond`, dan `web_search` tetap
tersedia.

Field Plugin Codex tingkat atas yang didukung:

| Field                      | Default          | Arti                                                                                      |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Gunakan `"openclaw-compat"` untuk mengekspos set tool dinamis OpenClaw lengkap ke app-server Codex. |
| `codexDynamicToolsExclude` | `[]`             | Nama tool dinamis OpenClaw tambahan yang dihilangkan dari giliran app-server Codex.       |

Field `appServer` yang didukung:

| Field               | Default                                  | Arti                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                    |
| `command`           | binary Codex terkelola                   | Executable untuk transport stdio. Biarkan tidak disetel untuk menggunakan binary terkelola; setel hanya untuk override eksplisit.                                                                                                 |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                                                                                                                                                                                    |
| `url`               | tidak disetel                            | URL app-server WebSocket.                                                                                                                                                                                                         |
| `authToken`         | tidak disetel                            | Token bearer untuk transport WebSocket.                                                                                                                                                                                           |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                                                                                                                                                                                        |
| `clearEnv`          | `[]`                                     | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan turunannya. `CODEX_HOME` dan `HOME` dicadangkan untuk isolasi Codex per agen milik OpenClaw pada peluncuran lokal. |
| `requestTimeoutMs`  | `60000`                                  | Timeout untuk panggilan control-plane app-server.                                                                                                                                                                                 |
| `mode`              | `"yolo"`                                 | Preset untuk eksekusi YOLO atau yang ditinjau guardian.                                                                                                                                                                           |
| `approvalPolicy`    | `"never"`                                | Kebijakan persetujuan native Codex yang dikirim ke thread start/resume/turn.                                                                                                                                                      |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox native Codex yang dikirim ke thread start/resume.                                                                                                                                                                    |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native. `guardian_subagent` tetap menjadi alias lama.                                                                                                             |
| `serviceTier`       | tidak disetel                            | Tier layanan app-server Codex opsional: `"fast"`, `"flex"`, atau `null`. Nilai lama yang tidak valid diabaikan.                                                                                                                   |

Panggilan tool dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: setiap permintaan `item/tool/call` Codex harus
menerima respons OpenClaw dalam 30 detik. Saat timeout, OpenClaw membatalkan
sinyal tool jika didukung dan mengembalikan respons dynamic-tool yang gagal ke
Codex agar giliran dapat berlanjut, alih-alih membiarkan sesi berada dalam
`processing`.

Setelah OpenClaw merespons permintaan app-server Codex yang berlaku untuk satu
giliran, harness juga mengharapkan Codex menyelesaikan giliran native dengan
`turn/completed`. Jika app-server diam selama 60 detik setelah respons itu,
OpenClaw berupaya sebaik mungkin menginterupsi giliran Codex, mencatat timeout
diagnostik, dan melepaskan lane sesi OpenClaw agar pesan chat lanjutan tidak
diantrekan di belakang giliran native yang sudah basi.

Override lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati binary terkelola saat
`appServer.command` tidak disetel.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai. Config
lebih disarankan untuk deployment yang dapat diulang karena menjaga perilaku Plugin
dalam file yang ditinjau yang sama dengan penyiapan harness Codex lainnya.

## Penggunaan komputer

Penggunaan Komputer dibahas dalam panduan penyiapannya sendiri:
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak mem-vendor app kontrol desktop atau mengeksekusi
tindakan desktop sendiri. OpenClaw menyiapkan app-server Codex, memverifikasi bahwa
server MCP `computer-use` tersedia, lalu membiarkan Codex menangani panggilan tool
MCP native selama giliran mode Codex.

Untuk akses driver TryCua langsung di luar alur marketplace Codex, daftarkan
`cua-driver mcp` dengan `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Lihat [Penggunaan Komputer Codex](/id/plugins/codex-computer-use) untuk perbedaan
antara Penggunaan Komputer milik Codex dan pendaftaran MCP langsung.

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

Penyiapan dapat diperiksa atau diinstal dari permukaan command:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Penggunaan Komputer khusus macOS dan mungkin memerlukan izin OS lokal sebelum
server MCP Codex dapat mengontrol app. Jika `computerUse.enabled` bernilai true
dan server MCP tidak tersedia, giliran mode Codex gagal sebelum thread dimulai,
alih-alih berjalan diam-diam tanpa tools Penggunaan Komputer native. Lihat
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use) untuk pilihan marketplace,
batas katalog jarak jauh, alasan status, dan pemecahan masalah.

Saat `computerUse.autoInstall` bernilai true, OpenClaw dapat mendaftarkan
marketplace Codex Desktop standar yang dibundel dari
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` jika Codex
belum menemukan marketplace lokal. Gunakan `/new` atau `/reset` setelah
mengubah config runtime atau Penggunaan Komputer agar sesi yang sudah ada tidak
menyimpan binding thread PI atau Codex lama.

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

Persetujuan Codex yang ditinjau guardian:

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

App-server jarak jauh dengan header eksplisit:

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
provider, kebijakan persetujuan, sandbox, dan tier layanan yang sedang dipilih
ke app-server lagi. Beralih dari `openai/gpt-5.5` ke `openai/gpt-5.2` mempertahankan
binding thread tetapi meminta Codex melanjutkan dengan model yang baru dipilih.

## Command Codex

Plugin yang dibundel mendaftarkan `/codex` sebagai slash command yang diotorisasi. Command ini
generik dan berfungsi pada channel apa pun yang mendukung command teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas server aplikasi aktif, model, akun, batas laju, server MCP, dan Skills.
- `/codex models` mencantumkan model server aplikasi Codex aktif.
- `/codex threads [filter]` mencantumkan thread Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke thread Codex yang sudah ada.
- `/codex compact` meminta server aplikasi Codex untuk memadatkan thread yang terlampir.
- `/codex review` memulai peninjauan native Codex untuk thread yang terlampir.
- `/codex diagnostics [note]` meminta konfirmasi sebelum mengirim umpan balik diagnostik Codex untuk thread yang terlampir.
- `/codex computer-use status` memeriksa Plugin Computer Use dan server MCP yang dikonfigurasi.
- `/codex computer-use install` menginstal Plugin Computer Use yang dikonfigurasi dan memuat ulang server MCP.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP server aplikasi Codex.
- `/codex skills` mencantumkan Skills server aplikasi Codex.

Saat Codex melaporkan kegagalan batas penggunaan, OpenClaw menyertakan waktu reset
server aplikasi berikutnya jika Codex menyediakannya. Gunakan `/codex account` dalam
percakapan yang sama untuk memeriksa jendela akun dan batas laju saat ini.

### Alur kerja debugging umum

Saat agen berbasis Codex melakukan sesuatu yang mengejutkan di Telegram, Discord, Slack,
atau saluran lain, mulai dari percakapan tempat masalah terjadi:

1. Jalankan `/diagnostics bad tool choice after image upload` atau catatan singkat lain
   yang menjelaskan apa yang Anda lihat.
2. Setujui permintaan diagnostik satu kali. Persetujuan membuat zip diagnostik Gateway
   lokal dan, karena sesi menggunakan harness Codex, juga mengirim bundel umpan balik
   Codex yang relevan ke server OpenAI.
3. Salin balasan diagnostik yang selesai ke laporan bug atau thread dukungan.
   Balasan tersebut menyertakan jalur bundel lokal, ringkasan privasi, id sesi OpenClaw,
   id thread Codex, dan baris `Inspect locally` untuk setiap thread Codex.
4. Jika Anda ingin men-debug run itu sendiri, jalankan perintah `Inspect locally`
   yang dicetak di terminal. Bentuknya seperti `codex resume <thread-id>` dan membuka
   thread native Codex agar Anda dapat memeriksa percakapan, melanjutkannya secara lokal,
   atau bertanya kepada Codex mengapa ia memilih alat atau rencana tertentu.

Gunakan `/codex diagnostics [note]` hanya saat Anda secara khusus menginginkan unggahan
umpan balik Codex untuk thread yang saat ini terlampir tanpa bundel diagnostik OpenClaw
Gateway penuh. Untuk sebagian besar laporan dukungan, `/diagnostics [note]` adalah
titik awal yang lebih baik karena menghubungkan status Gateway lokal dan id thread Codex
dalam satu balasan. Lihat [Ekspor diagnostik](/id/gateway/diagnostics)
untuk model privasi lengkap dan perilaku obrolan grup.

Inti OpenClaw juga mengekspos `/diagnostics [note]` khusus pemilik sebagai perintah
diagnostik Gateway umum. Prompt persetujuannya menampilkan pembukaan data sensitif,
menautkan ke [Ekspor Diagnostik](/id/gateway/diagnostics), dan meminta
`openclaw gateway diagnostics export --json` melalui persetujuan eksekusi eksplisit
setiap kali. Jangan menyetujui diagnostik dengan aturan izinkan-semua. Setelah disetujui,
OpenClaw mengirim laporan yang dapat ditempel dengan jalur bundel lokal dan ringkasan
manifes. Saat sesi OpenClaw aktif menggunakan harness Codex, persetujuan yang sama
juga mengotorisasi pengiriman bundel umpan balik Codex yang relevan ke server OpenAI.
Prompt persetujuan mengatakan bahwa umpan balik Codex akan dikirim, tetapi tidak
mencantumkan id sesi atau thread Codex sebelum persetujuan.

Jika `/diagnostics` dipanggil oleh pemilik dalam obrolan grup, OpenClaw menjaga
saluran bersama tetap bersih: grup hanya menerima pemberitahuan singkat, sementara
pembukaan diagnostik, prompt persetujuan, dan id sesi/thread Codex dikirim kepada
pemilik melalui rute persetujuan privat. Jika tidak ada rute pemilik privat,
OpenClaw menolak permintaan grup dan meminta pemilik menjalankannya dari DM.

Unggahan Codex yang disetujui memanggil `feedback/upload` server aplikasi Codex dan meminta
server aplikasi untuk menyertakan log bagi setiap thread yang tercantum dan subthread Codex
yang dibuat saat tersedia. Unggahan melewati jalur umpan balik normal Codex ke server
OpenAI; jika umpan balik Codex dinonaktifkan di server aplikasi tersebut, perintah
mengembalikan kesalahan server aplikasi. Balasan diagnostik yang selesai mencantumkan
saluran, id sesi OpenClaw, id thread Codex, dan perintah lokal `codex resume <thread-id>`
untuk thread yang dikirim. Jika Anda menolak atau mengabaikan persetujuan,
OpenClaw tidak mencetak id Codex tersebut. Unggahan ini tidak menggantikan ekspor
diagnostik Gateway lokal.

`/codex resume` menulis file binding sidecar yang sama dengan yang digunakan harness untuk
giliran normal. Pada pesan berikutnya, OpenClaw melanjutkan thread Codex tersebut, meneruskan
model OpenClaw yang saat ini dipilih ke server aplikasi, dan mempertahankan riwayat
diperluas tetap aktif.

### Memeriksa thread Codex dari CLI

Cara tercepat untuk memahami run Codex yang buruk sering kali adalah membuka thread native Codex
secara langsung:

```sh
codex resume <thread-id>
```

Gunakan ini saat Anda melihat bug dalam percakapan saluran dan ingin memeriksa sesi Codex
yang bermasalah, melanjutkannya secara lokal, atau bertanya kepada Codex mengapa ia membuat
pilihan alat atau penalaran tertentu. Jalur termudah biasanya menjalankan
`/diagnostics [note]` terlebih dahulu: setelah Anda menyetujuinya, laporan yang selesai
mencantumkan setiap thread Codex dan mencetak perintah `Inspect locally`, misalnya
`codex resume <thread-id>`. Anda dapat menyalin perintah itu langsung ke terminal.

Anda juga dapat memperoleh id thread dari `/codex binding` untuk obrolan saat ini atau
`/codex threads [filter]` untuk thread server aplikasi Codex terbaru, lalu menjalankan
perintah `codex resume` yang sama di shell Anda.

Permukaan perintah memerlukan server aplikasi Codex `0.125.0` atau yang lebih baru. Metode
kontrol individual dilaporkan sebagai `unsupported by this Codex app-server` jika
server aplikasi masa depan atau kustom tidak mengekspos metode JSON-RPC tersebut.

## Batas hook

Harness Codex memiliki tiga lapisan hook:

| Lapisan                               | Pemilik                  | Tujuan                                                              |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/Plugin di seluruh harness PI dan Codex.       |
| Middleware ekstensi server aplikasi Codex | Plugin bawaan OpenClaw | Perilaku adaptor per giliran di sekitar alat dinamis OpenClaw.      |
| Hook native Codex                     | Codex                    | Siklus hidup Codex level rendah dan kebijakan alat native dari konfigurasi Codex. |

OpenClaw tidak menggunakan file `hooks.json` proyek atau global Codex untuk merutekan
perilaku Plugin OpenClaw. Untuk bridge alat native dan izin yang didukung,
OpenClaw menyuntikkan konfigurasi Codex per thread untuk `PreToolUse`, `PostToolUse`,
`PermissionRequest`, dan `Stop`. Hook Codex lain seperti `SessionStart` dan
`UserPromptSubmit` tetap menjadi kontrol level Codex; keduanya tidak diekspos sebagai
hook Plugin OpenClaw dalam kontrak v1.

Untuk alat dinamis OpenClaw, OpenClaw menjalankan alat setelah Codex meminta panggilan,
sehingga OpenClaw menjalankan perilaku Plugin dan middleware yang dimilikinya di adaptor
harness. Untuk alat native Codex, Codex memiliki catatan alat kanonis. OpenClaw dapat
mencerminkan peristiwa tertentu, tetapi tidak dapat menulis ulang thread native Codex
kecuali Codex mengekspos operasi tersebut melalui server aplikasi atau callback hook
native.

Proyeksi siklus hidup Compaction dan LLM berasal dari notifikasi server aplikasi Codex
dan status adaptor OpenClaw, bukan perintah hook native Codex. Peristiwa
`before_compaction`, `after_compaction`, `llm_input`, dan `llm_output` OpenClaw adalah
observasi level adaptor, bukan tangkapan byte-demi-byte dari permintaan internal atau
payload Compaction Codex.

Notifikasi server aplikasi `hook/started` dan `hook/completed` native Codex
diproyeksikan sebagai peristiwa agen `codex_app_server.hook` untuk trajektori dan debugging.
Notifikasi tersebut tidak memanggil hook Plugin OpenClaw.

## Kontrak dukungan V1

Mode Codex bukan PI dengan panggilan model berbeda di bawahnya. Codex memiliki lebih banyak
loop model native, dan OpenClaw menyesuaikan permukaan Plugin dan sesinya di sekitar batas itu.

Didukung dalam runtime Codex v1:

| Permukaan                                     | Dukungan                                | Alasan                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop model OpenAI melalui Codex               | Didukung                                | Server aplikasi Codex memiliki giliran OpenAI, pelanjutan thread native, dan kelanjutan alat native.                                                                                                   |
| Perutean dan pengiriman saluran OpenClaw      | Didukung                                | Telegram, Discord, Slack, WhatsApp, iMessage, dan saluran lain tetap berada di luar runtime model.                                                                                                     |
| Alat dinamis OpenClaw                         | Didukung                                | Codex meminta OpenClaw menjalankan alat ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                                                                                        |
| Prompt dan Plugin konteks                     | Didukung                                | OpenClaw membangun overlay prompt dan memproyeksikan konteks ke giliran Codex sebelum memulai atau melanjutkan thread.                                                                                |
| Siklus hidup mesin konteks                    | Didukung                                | Perakitan, ingest atau pemeliharaan setelah giliran, dan koordinasi Compaction mesin konteks berjalan untuk giliran Codex.                                                                            |
| Hook alat dinamis                             | Didukung                                | `before_tool_call`, `after_tool_call`, dan middleware hasil alat berjalan di sekitar alat dinamis milik OpenClaw.                                                                                     |
| Hook siklus hidup                             | Didukung sebagai observasi adaptor      | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` aktif dengan payload mode Codex yang jujur.                                                                       |
| Gerbang revisi jawaban akhir                  | Didukung melalui relay hook native      | `Stop` Codex direlay ke `before_agent_finalize`; `revise` meminta Codex untuk satu lintasan model lagi sebelum finalisasi.                                                                            |
| Blokir atau observasi shell, patch, dan MCP native | Didukung melalui relay hook native | `PreToolUse` dan `PostToolUse` Codex direlay untuk permukaan alat native yang dikomit, termasuk payload MCP pada server aplikasi Codex `0.125.0` atau yang lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak. |
| Kebijakan izin native                         | Didukung melalui relay hook native      | `PermissionRequest` Codex dapat dirutekan melalui kebijakan OpenClaw saat runtime mengeksposnya. Jika OpenClaw tidak mengembalikan keputusan, Codex melanjutkan melalui guardian normal atau jalur persetujuan pengguna. |
| Penangkapan trajektori server aplikasi        | Didukung                                | OpenClaw merekam permintaan yang dikirimnya ke server aplikasi dan notifikasi server aplikasi yang diterimanya.                                                                                       |

Tidak didukung dalam runtime Codex v1:

| Surface                                             | Batas V1                                                                                                                                        | Jalur masa depan                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutasi argumen alat native                          | Hook pra-alat native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen alat native Codex.                                      | Memerlukan dukungan hook/skema Codex untuk input alat pengganti.                          |
| Riwayat transkrip native Codex yang dapat diedit    | Codex memiliki riwayat thread native kanonis. OpenClaw memiliki cermin dan dapat memproyeksikan konteks masa depan, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API app-server Codex eksplisit jika operasi thread native diperlukan.           |
| `tool_result_persist` untuk rekaman alat native Codex | Hook tersebut mentransformasi penulisan transkrip milik OpenClaw, bukan rekaman alat native Codex.                                             | Dapat mencerminkan rekaman yang ditransformasi, tetapi penulisan ulang kanonis memerlukan dukungan Codex. |
| Metadata Compaction native kaya                     | OpenClaw mengamati awal dan penyelesaian Compaction, tetapi tidak menerima daftar kept/dropped yang stabil, delta token, atau payload ringkasan. | Memerlukan event Compaction Codex yang lebih kaya.                                        |
| Intervensi Compaction                               | Hook Compaction OpenClaw saat ini berada pada tingkat notifikasi dalam mode Codex.                                                              | Tambahkan hook pra/pasca Compaction Codex jika plugins perlu memveto atau menulis ulang Compaction native. |
| Penangkapan permintaan API model byte demi byte     | OpenClaw dapat menangkap permintaan dan notifikasi app-server, tetapi core Codex membangun permintaan akhir OpenAI API secara internal.          | Memerlukan event penelusuran permintaan model Codex atau API debug.                       |

## Alat, media, dan Compaction

Harness Codex hanya mengubah eksekutor agen tertanam tingkat rendah.

OpenClaw tetap membangun daftar alat dan menerima hasil alat dinamis dari
harness. Teks, gambar, video, musik, TTS, persetujuan, dan output alat pesan
tetap melewati jalur pengiriman OpenClaw normal.

Relay hook native sengaja dibuat generik, tetapi kontrak dukungan v1 dibatasi
pada jalur alat native Codex dan izin yang diuji OpenClaw. Dalam runtime Codex,
itu mencakup payload shell, patch, dan MCP `PreToolUse`,
`PostToolUse`, dan `PermissionRequest`. Jangan berasumsi setiap event hook
Codex di masa depan adalah surface Plugin OpenClaw sampai kontrak runtime
menamainya.

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan izinkan atau
tolak eksplisit saat kebijakan memutuskan. Hasil tanpa keputusan bukanlah
izin. Codex memperlakukannya sebagai tidak ada keputusan hook dan meneruskannya
ke jalur guardian atau persetujuan pengguna miliknya sendiri.

Elisitasi persetujuan alat MCP Codex dirutekan melalui alur persetujuan Plugin
OpenClaw saat Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt Codex `request_user_input` dikirim kembali ke chat
asal, dan pesan tindak lanjut berikutnya yang diantrekan menjawab permintaan
server native tersebut alih-alih diarahkan sebagai konteks tambahan. Permintaan
elisitasi MCP lain tetap gagal tertutup.

Pengarahan antrean active-run dipetakan ke `turn/steer` app-server Codex. Dengan
default `messages.queue.mode: "steer"`, OpenClaw mengelompokkan pesan chat yang
diantrekan selama jendela senyap yang dikonfigurasi dan mengirimnya sebagai satu
permintaan `turn/steer` dalam urutan kedatangan. Mode lama `queue` mengirim
permintaan `turn/steer` terpisah. Giliran ulasan Codex dan Compaction manual
dapat menolak pengarahan pada giliran yang sama, dan dalam kasus itu OpenClaw
menggunakan antrean tindak lanjut saat mode yang dipilih mengizinkan fallback.
Lihat [Antrean pengarahan](/id/concepts/queue-steering).

Saat model yang dipilih menggunakan harness Codex, Compaction thread native
didelegasikan ke app-server Codex. OpenClaw menyimpan cermin transkrip untuk
riwayat channel, pencarian, `/new`, `/reset`, dan peralihan model atau harness
di masa depan. Cermin tersebut mencakup prompt pengguna, teks asisten akhir, dan
rekaman penalaran atau rencana Codex ringan saat app-server memancarkannya. Saat
ini, OpenClaw hanya merekam sinyal awal dan penyelesaian Compaction native.
OpenClaw belum mengekspos ringkasan Compaction yang dapat dibaca manusia atau
daftar yang dapat diaudit tentang entri mana yang dipertahankan Codex setelah
Compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` saat ini
tidak menulis ulang rekaman hasil alat native Codex. Ini hanya berlaku saat
OpenClaw menulis hasil alat transkrip sesi milik OpenClaw.

Pembuatan media tidak memerlukan PI. Gambar, video, musik, PDF, TTS, dan
pemahaman media tetap menggunakan pengaturan penyedia/model yang sesuai seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan masalah

**Codex tidak muncul sebagai penyedia `/model` normal:** itu memang diharapkan
untuk konfigurasi baru. Pilih model `openai/gpt-*` dengan
`agentRuntime.id: "codex"` (atau ref lama `codex/*`), aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan PI alih-alih Codex:** `agentRuntime.id: "auto"` masih dapat menggunakan PI sebagai
backend kompatibilitas saat tidak ada harness Codex yang mengklaim run. Atur
`agentRuntime.id: "codex"` untuk memaksa pemilihan Codex saat pengujian. Runtime
Codex yang dipaksa gagal alih-alih fallback ke PI. Setelah app-server Codex
dipilih, kegagalannya muncul langsung.

**App-server ditolak:** tingkatkan Codex agar handshake app-server
melaporkan versi `0.125.0` atau lebih baru. Prarilis versi yang sama atau versi
bersufiks build seperti `0.125.0-alpha.2` atau `0.125.0+custom` ditolak karena
lantai protokol stabil `0.125.0` adalah yang diuji OpenClaw.

**Penemuan model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan penemuan.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan pastikan app-server jarak jauh berbicara versi protokol app-server Codex yang sama.

**Model non-Codex menggunakan PI:** itu memang diharapkan kecuali Anda memaksa
`agentRuntime.id: "codex"` untuk agen tersebut atau memilih ref lama
`codex/*`. Ref `openai/gpt-*` biasa dan ref penyedia lain tetap berada di jalur
penyedia normalnya dalam mode `auto`. Jika Anda memaksa `agentRuntime.id: "codex"`, setiap giliran tertanam
untuk agen tersebut harus berupa model OpenAI yang didukung Codex.

**Computer Use terpasang tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika alat melaporkan
`Native hook relay unavailable`, gunakan `/new` atau `/reset`; jika tetap terjadi, mulai ulang
gateway untuk membersihkan pendaftaran hook native yang kedaluwarsa. Jika `computer-use.list_apps`
habis waktu, mulai ulang Codex Computer Use atau Codex Desktop dan coba lagi.

## Terkait

- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Penyedia model](/id/concepts/model-providers)
- [Penyedia OpenAI](/id/providers/openai)
- [Status](/id/cli/status)
- [Hook Plugin](/id/plugins/hooks)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
