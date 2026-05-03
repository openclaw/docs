---
read_when:
    - Anda ingin menggunakan harness app-server Codex bawaan
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin deployment khusus Codex gagal alih-alih beralih kembali ke PI
summary: Jalankan putaran agen tersemat OpenClaw melalui kerangka uji app-server Codex yang disertakan
title: Kerangka Codex
x-i18n:
    generated_at: "2026-05-03T21:35:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5187e54e2dc94e511c0243227f741d3486669f595c2b15cf239b1c03ea466c8
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen tertanam melalui
server aplikasi Codex alih-alih harness PI bawaan.

Gunakan ini saat Anda ingin Codex memiliki sesi agen tingkat rendah: penemuan
model, lanjutkan thread native, compaction native, dan eksekusi server aplikasi.
OpenClaw tetap memiliki kanal chat, file sesi, pemilihan model, alat,
persetujuan, pengiriman media, dan cermin transkrip yang terlihat.

Saat giliran chat sumber berjalan melalui harness Codex, balasan yang terlihat
secara default menggunakan alat `message` OpenClaw jika deployment belum secara
eksplisit mengonfigurasi `messages.visibleReplies`. Agen tetap dapat
menyelesaikan giliran Codex-nya secara privat; agen hanya mengirim ke kanal saat
memanggil `message(action="send")`. Tetapkan `messages.visibleReplies: "automatic"`
untuk mempertahankan balasan final chat langsung pada jalur pengiriman otomatis
legacy.

Giliran Heartbeat Codex juga mendapatkan alat `heartbeat_respond` secara default,
sehingga agen dapat mencatat apakah wake harus tetap senyap atau memberi
notifikasi tanpa menyandikan alur kontrol itu dalam teks final.

Panduan inisiatif khusus Heartbeat dikirim sebagai instruksi developer mode
kolaborasi Codex pada giliran Heartbeat itu sendiri. Giliran chat biasa
memulihkan mode Codex Default alih-alih membawa filosofi Heartbeat dalam prompt
runtime normalnya.

Jika Anda mencoba memahami konteksnya, mulailah dengan
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya adalah:
`openai/gpt-5.5` adalah ref model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau kanal lain tetap menjadi permukaan komunikasi.

## Konfigurasi cepat

Sebagian besar pengguna yang menginginkan "Codex di OpenClaw" menginginkan rute
ini: masuk dengan langganan ChatGPT/Codex, lalu jalankan giliran agen tertanam
melalui runtime server aplikasi Codex native. Ref model tetap kanonis sebagai
`openai/gpt-*`; autentikasi langganan berasal dari akun/profil Codex, bukan
dari prefiks model `openai-codex/*`.

Pertama, masuk dengan OAuth Codex jika belum:

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
konfigurasi berlaku untuk sesi baru atau yang direset; sesi yang ada
mempertahankan runtime yang telah direkam.

## Apa yang diubah Plugin ini

Plugin `codex` bawaan menyumbangkan beberapa kemampuan terpisah:

| Kemampuan                         | Cara menggunakannya                                  | Fungsinya                                                                      |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Runtime tertanam native           | `agentRuntime.id: "codex"`                          | Menjalankan giliran agen tertanam OpenClaw melalui server aplikasi Codex.     |
| Perintah kontrol-chat native      | `/codex bind`, `/codex resume`, `/codex steer`, ... | Mengikat dan mengontrol thread server aplikasi Codex dari percakapan pesan.   |
| Penyedia/katalog server aplikasi Codex | internal `codex`, dimunculkan melalui harness        | Memungkinkan runtime menemukan dan memvalidasi model server aplikasi.         |
| Jalur pemahaman media Codex       | Jalur kompatibilitas model gambar `codex/*`         | Menjalankan giliran server aplikasi Codex terbatas untuk model pemahaman gambar yang didukung. |
| Relay hook native                 | Hook Plugin di sekitar peristiwa native Codex       | Memungkinkan OpenClaw mengamati/memblokir peristiwa alat/finalisasi native Codex yang didukung. |

Mengaktifkan Plugin membuat kemampuan tersebut tersedia. Itu **tidak**:

- mulai menggunakan Codex untuk setiap model OpenAI
- mengubah ref model `openai-codex/*` menjadi runtime native
- menjadikan ACP/acpx jalur Codex default
- melakukan hot-switch sesi yang ada yang sudah merekam runtime PI
- mengganti pengiriman kanal OpenClaw, file sesi, penyimpanan profil autentikasi, atau
  perutean pesan

Plugin yang sama juga memiliki permukaan perintah kontrol-chat `/codex` native.
Jika Plugin diaktifkan dan pengguna meminta untuk mengikat, melanjutkan,
mengarahkan, menghentikan, atau memeriksa thread Codex dari chat, agen harus
memilih `/codex ...` daripada ACP. ACP tetap menjadi fallback eksplisit saat
pengguna meminta ACP/acpx atau sedang menguji adapter ACP Codex.

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

Plugin juga dapat mendaftarkan middleware hasil-alat netral-runtime untuk menulis
ulang hasil alat dinamis OpenClaw setelah OpenClaw mengeksekusi alat dan sebelum
hasil dikembalikan ke Codex. Ini terpisah dari hook Plugin publik
`tool_result_persist`, yang mentransformasi penulisan hasil-alat transkrip milik
OpenClaw.

Untuk semantik hook Plugin itu sendiri, lihat [Hook Plugin](/id/plugins/hooks)
dan [Perilaku penjaga Plugin](/id/tools/plugin).

Harness nonaktif secara default. Konfigurasi baru harus menjaga ref model OpenAI
tetap kanonis sebagai `openai/gpt-*` dan secara eksplisit memaksa
`agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex` saat menginginkan
eksekusi server aplikasi native. Ref model legacy `codex/*` masih memilih
harness secara otomatis untuk kompatibilitas, tetapi prefiks penyedia legacy yang
didukung runtime tidak ditampilkan sebagai pilihan model/penyedia normal.

Jika Plugin `codex` diaktifkan tetapi model utama masih
`openai-codex/*`, `openclaw doctor` memperingatkan alih-alih mengubah rute. Itu
disengaja: `openai-codex/*` tetap menjadi jalur OAuth/langganan PI Codex, dan
eksekusi server aplikasi native tetap menjadi pilihan runtime eksplisit.

## Peta rute

Gunakan tabel ini sebelum mengubah konfigurasi:

| Perilaku yang diinginkan                           | Ref model                  | Konfigurasi runtime                   | Rute autentikasi/profil      | Label status yang diharapkan   |
| -------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------ |
| Langganan ChatGPT/Codex dengan runtime Codex native | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | OAuth Codex atau akun Codex  | `Runtime: OpenAI Codex`        |
| OpenAI API melalui runner OpenClaw normal           | `openai/gpt-*`             | dihilangkan atau `runtime: "pi"`       | Kunci OpenAI API             | `Runtime: OpenClaw Pi Default` |
| Langganan ChatGPT/Codex melalui PI                  | `openai-codex/gpt-*`       | dihilangkan atau `runtime: "pi"`       | Penyedia OAuth OpenAI Codex  | `Runtime: OpenClaw Pi Default` |
| Penyedia campuran dengan mode otomatis konservatif  | ref khusus penyedia        | `agentRuntime.id: "auto"`              | Per penyedia yang dipilih    | Bergantung pada runtime yang dipilih |
| Sesi adapter ACP Codex eksplisit                    | Bergantung pada prompt/model ACP | `sessions_spawn` dengan `runtime: "acp"` | Autentikasi backend ACP      | Status tugas/sesi ACP          |

Pemisahan pentingnya adalah penyedia versus runtime:

- `openai-codex/*` menjawab "rute penyedia/autentikasi mana yang harus digunakan PI?"
- `agentRuntime.id: "codex"` menjawab "loop mana yang harus mengeksekusi
  giliran tertanam ini?"
- `/codex ...` menjawab "percakapan Codex native mana yang harus diikat atau
  dikontrol chat ini?"
- ACP menjawab "proses harness eksternal mana yang harus diluncurkan acpx?"

## Pilih prefiks model yang tepat

Rute keluarga OpenAI bersifat khusus prefiks. Untuk penyiapan umum langganan
plus runtime Codex native, gunakan `openai/*` dengan `agentRuntime.id: "codex"`.
Gunakan `openai-codex/*` hanya saat Anda memang menginginkan OAuth Codex melalui PI:

| Ref model                                     | Jalur runtime                                | Gunakan saat                                                              |
| --------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | Penyedia OpenAI melalui plumbing OpenClaw/PI | Anda menginginkan akses OpenAI Platform API langsung saat ini dengan `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                        | OAuth OpenAI Codex melalui OpenClaw/PI       | Anda menginginkan autentikasi langganan ChatGPT/Codex dengan runner PI default. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness server aplikasi Codex                | Anda menginginkan autentikasi langganan ChatGPT/Codex dengan eksekusi Codex native. |

GPT-5.5 dapat muncul pada rute kunci API OpenAI langsung dan langganan Codex
saat akun Anda mengeksposnya. Gunakan `openai/gpt-5.5` dengan harness server
aplikasi Codex untuk runtime Codex native, `openai-codex/gpt-5.5` untuk OAuth
PI, atau `openai/gpt-5.5` tanpa override runtime Codex untuk traffic kunci API
langsung.

Ref legacy `codex/gpt-*` tetap diterima sebagai alias kompatibilitas. Migrasi
kompatibilitas Doctor menulis ulang ref runtime utama legacy menjadi ref model
kanonis dan merekam kebijakan runtime secara terpisah, sedangkan ref legacy yang
hanya fallback dibiarkan tidak berubah karena runtime dikonfigurasi untuk seluruh
kontainer agen. Konfigurasi OAuth PI Codex baru harus menggunakan
`openai-codex/gpt-*`; konfigurasi harness server aplikasi native baru harus
menggunakan `openai/gpt-*` plus `agentRuntime.id: "codex"`.

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan
`openai-codex/gpt-*` saat pemahaman gambar harus berjalan melalui jalur penyedia
OAuth OpenAI Codex. Gunakan `codex/gpt-*` saat pemahaman gambar harus berjalan
melalui giliran server aplikasi Codex terbatas. Model server aplikasi Codex harus
mengiklankan dukungan input gambar; model Codex khusus teks gagal sebelum giliran
media dimulai.

Gunakan `/status` untuk mengonfirmasi harness efektif untuk sesi saat ini. Jika
pilihannya mengejutkan, aktifkan logging debug untuk subsistem `agents/harness`
dan periksa rekaman terstruktur `agent harness selected` milik Gateway. Rekaman
itu mencakup id harness yang dipilih, alasan pemilihan, kebijakan
runtime/fallback, dan, dalam mode `auto`, hasil dukungan setiap kandidat Plugin.

### Arti peringatan doctor

`openclaw doctor` memperingatkan saat semua ini benar:

- Plugin `codex` bawaan diaktifkan atau diizinkan
- model utama agen adalah `openai-codex/*`
- runtime efektif agen tersebut bukan `codex`

Peringatan itu ada karena pengguna sering mengharapkan "Plugin Codex diaktifkan"
berarti "runtime server aplikasi Codex native." OpenClaw tidak membuat lompatan
itu. Peringatan berarti:

- **Tidak diperlukan perubahan** jika Anda bermaksud menggunakan OAuth ChatGPT/Codex melalui PI.
- Ubah model menjadi `openai/<model>` dan tetapkan
  `agentRuntime.id: "codex"` jika Anda bermaksud menggunakan eksekusi
  server aplikasi native.
- Sesi yang ada tetap membutuhkan `/new` atau `/reset` setelah perubahan runtime,
  karena pin runtime sesi bersifat melekat.

Pemilihan harness bukan kontrol sesi langsung. Saat giliran tertanam berjalan,
OpenClaw merekam id harness yang dipilih pada sesi itu dan terus menggunakannya
untuk giliran berikutnya dalam id sesi yang sama. Ubah konfigurasi `agentRuntime`
atau `OPENCLAW_AGENT_RUNTIME` saat Anda ingin sesi mendatang menggunakan harness
lain; gunakan `/new` atau `/reset` untuk memulai sesi baru sebelum mengalihkan
percakapan yang ada antara PI dan Codex. Ini menghindari pemutaran ulang satu
transkrip melalui dua sistem sesi native yang tidak kompatibel.

Sesi lama yang dibuat sebelum pin harness diperlakukan sebagai dipin ke PI setelah memiliki riwayat transkrip. Gunakan `/new` atau `/reset` untuk mengikutsertakan percakapan tersebut ke Codex setelah mengubah konfigurasi.

`/status` menampilkan runtime model yang berlaku. Harness PI bawaan muncul sebagai `Runtime: OpenClaw Pi Default`, dan harness server aplikasi Codex muncul sebagai `Runtime: OpenAI Codex`.

## Persyaratan

- OpenClaw dengan plugin `codex` bawaan tersedia.
- Server aplikasi Codex `0.125.0` atau yang lebih baru. Plugin bawaan mengelola biner server aplikasi Codex yang kompatibel secara default, sehingga perintah `codex` lokal di `PATH` tidak memengaruhi startup harness normal.
- Autentikasi Codex tersedia untuk proses server aplikasi atau untuk jembatan autentikasi Codex OpenClaw. Peluncuran server aplikasi stdio lokal menggunakan rumah Codex yang dikelola OpenClaw untuk setiap agen dan `HOME` anak yang terisolasi, sehingga secara default tidak membaca akun, skills, plugins, konfigurasi, status thread, atau `$HOME/.agents/skills` native pribadi Anda dari `~/.codex`.

Plugin memblokir handshake server aplikasi lama atau tanpa versi. Ini menjaga OpenClaw tetap berada pada permukaan protokol yang telah diuji.

Untuk pengujian smoke live dan Docker, autentikasi biasanya berasal dari akun CLI Codex atau profil autentikasi OpenClaw `openai-codex`. Peluncuran server aplikasi stdio lokal juga dapat fallback ke `CODEX_API_KEY` / `OPENAI_API_KEY` ketika tidak ada akun.

## File bootstrap ruang kerja

Codex menangani `AGENTS.md` sendiri melalui penemuan dokumen proyek native. OpenClaw tidak menulis file dokumen proyek Codex sintetis atau bergantung pada nama file fallback Codex untuk file persona, karena fallback Codex hanya berlaku ketika `AGENTS.md` tidak ada.

Untuk paritas ruang kerja OpenClaw, harness Codex me-resolve file bootstrap lain (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, dan `MEMORY.md` jika ada) dan meneruskannya melalui instruksi konfigurasi Codex pada `thread/start` dan `thread/resume`. Ini menjaga `SOUL.md` dan konteks persona/profil ruang kerja terkait tetap terlihat tanpa menduplikasi `AGENTS.md`.

## Tambahkan Codex bersama model lain

Jangan tetapkan `agentRuntime.id: "codex"` secara global jika agen yang sama harus bebas beralih antara Codex dan model penyedia non-Codex. Runtime yang dipaksa berlaku untuk setiap giliran tertanam bagi agen atau sesi tersebut. Jika Anda memilih model Anthropic saat runtime itu dipaksa, OpenClaw tetap mencoba harness Codex dan gagal tertutup alih-alih secara diam-diam merutekan giliran itu melalui PI.

Gunakan salah satu bentuk berikut sebagai gantinya:

- Tempatkan Codex pada agen khusus dengan `agentRuntime.id: "codex"`.
- Pertahankan agen default pada `agentRuntime.id: "auto"` dan fallback PI untuk penggunaan penyedia campuran normal.
- Gunakan ref lama `codex/*` hanya untuk kompatibilitas. Konfigurasi baru sebaiknya memilih `openai/*` ditambah kebijakan runtime Codex eksplisit.

Contohnya, ini mempertahankan agen default pada pemilihan otomatis normal dan menambahkan agen Codex terpisah:

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

- Agen `main` default menggunakan jalur penyedia normal dan fallback kompatibilitas PI.
- Agen `codex` menggunakan harness server aplikasi Codex.
- Jika Codex hilang atau tidak didukung untuk agen `codex`, giliran tersebut gagal alih-alih diam-diam menggunakan PI.

## Perutean perintah agen

Agen harus merutekan permintaan pengguna berdasarkan maksud, bukan hanya berdasarkan kata "Codex":

| Pengguna meminta...                                    | Agen harus menggunakan...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| "Ikat chat ini ke Codex"                               | `/codex bind`                                    |
| "Lanjutkan thread Codex `<id>` di sini"                | `/codex resume <id>`                             |
| "Tampilkan thread Codex"                               | `/codex threads`                                 |
| "Buat laporan dukungan untuk eksekusi Codex yang buruk" | `/diagnostics [note]`                            |
| "Kirim umpan balik Codex hanya untuk thread terlampir ini" | `/codex diagnostics [note]`                      |
| "Gunakan langganan ChatGPT/Codex saya dengan runtime Codex" | `openai/*` plus `agentRuntime.id: "codex"`       |
| "Gunakan langganan ChatGPT/Codex saya melalui PI"      | ref model `openai-codex/*`                       |
| "Jalankan Codex melalui ACP/acpx"                      | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "Mulai Claude Code/Gemini/OpenCode/Cursor dalam thread" | ACP/acpx, bukan `/codex` dan bukan sub-agen native |

OpenClaw hanya mengiklankan panduan spawn ACP kepada agen ketika ACP diaktifkan, dapat dikirim, dan didukung oleh backend runtime yang dimuat. Jika ACP tidak tersedia, prompt sistem dan Skills plugin tidak boleh mengajari agen tentang perutean ACP.

## Deployment khusus Codex

Paksa harness Codex ketika Anda perlu membuktikan bahwa setiap giliran agen tertanam menggunakan Codex. Runtime plugin eksplisit gagal tertutup dan tidak pernah dicoba ulang secara diam-diam melalui PI:

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

Dengan Codex dipaksa, OpenClaw gagal lebih awal jika plugin Codex dinonaktifkan, server aplikasi terlalu lama, atau server aplikasi tidak dapat dimulai.

## Codex per agen

Anda dapat membuat satu agen khusus Codex sementara agen default mempertahankan
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
OpenClaw baru dan harness Codex membuat atau melanjutkan utas app-server
sidecar-nya sesuai kebutuhan. `/reset` menghapus pengikatan sesi OpenClaw untuk
utas tersebut dan memungkinkan giliran berikutnya menyelesaikan harness dari
konfigurasi saat ini lagi.

## Penemuan model

Secara default, Plugin Codex meminta model yang tersedia kepada app-server. Jika
penemuan gagal atau habis waktu, Plugin menggunakan katalog fallback bawaan
untuk:

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

Nonaktifkan penemuan saat Anda ingin startup menghindari probing Codex dan tetap
menggunakan katalog fallback:

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

Secara default, Plugin memulai biner Codex terkelola OpenClaw secara lokal
dengan:

```bash
codex app-server --listen stdio://
```

Biner terkelola dikirim bersama paket Plugin `codex`. Ini menjaga versi
app-server tetap terikat pada Plugin bawaan, bukan pada Codex CLI terpisah mana
pun yang kebetulan terpasang secara lokal. Atur `appServer.command` hanya saat
Anda sengaja ingin menjalankan executable yang berbeda.

Secara default, OpenClaw memulai sesi harness Codex lokal dalam mode YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Ini adalah postur operator lokal tepercaya yang
digunakan untuk Heartbeat otonom: Codex dapat menggunakan shell dan alat jaringan
tanpa berhenti pada prompt persetujuan native yang tidak ada orang di sekitar
untuk menjawabnya.

Untuk ikut menggunakan persetujuan yang ditinjau guardian Codex, atur
`appServer.mode: "guardian"`:

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

Mode Guardian menggunakan jalur persetujuan tinjauan otomatis native Codex. Saat
Codex meminta untuk keluar dari sandbox, menulis di luar workspace, atau
menambahkan izin seperti akses jaringan, Codex merutekan permintaan persetujuan
tersebut ke peninjau native, bukan prompt manusia. Peninjau menerapkan kerangka
risiko Codex dan menyetujui atau menolak permintaan spesifik tersebut. Gunakan
Guardian saat Anda menginginkan guardrail yang lebih banyak daripada mode YOLO
tetapi tetap membutuhkan agen tanpa pengawasan untuk terus berjalan.

Preset `guardian` diperluas menjadi `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, dan `sandbox: "workspace-write"`.
Field kebijakan individual tetap menimpa `mode`, sehingga deployment lanjutan
dapat mencampur preset dengan pilihan eksplisit. Nilai peninjau lama
`guardian_subagent` masih diterima sebagai alias kompatibilitas, tetapi
konfigurasi baru sebaiknya menggunakan `auto_review`.

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

Peluncuran app-server stdio mewarisi environment proses OpenClaw secara default,
tetapi OpenClaw memiliki bridge akun app-server Codex dan menetapkan baik
`CODEX_HOME` maupun `HOME` ke direktori per agen di bawah state OpenClaw milik
agen tersebut. Loader skill milik Codex membaca `$CODEX_HOME/skills` dan
`$HOME/.agents/skills`, sehingga kedua nilai diisolasi untuk peluncuran
app-server lokal. Itu menjaga skill native Codex, Plugin, konfigurasi, akun, dan
state utas tetap tercakup ke agen OpenClaw, bukan bocor dari home Codex CLI
pribadi operator.

Plugin OpenClaw dan snapshot skill OpenClaw tetap mengalir melalui registri
Plugin dan loader skill milik OpenClaw sendiri. Aset Codex CLI pribadi tidak.
Jika Anda memiliki skill atau Plugin Codex CLI berguna yang seharusnya menjadi
bagian dari agen OpenClaw, inventarisasikan secara eksplisit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Penyedia migrasi Codex menyalin skill ke workspace agen OpenClaw saat ini.
Plugin native Codex, hook, dan file konfigurasi dilaporkan atau diarsipkan untuk
peninjauan manual alih-alih diaktifkan otomatis, karena item tersebut dapat
mengeksekusi perintah, mengekspos server MCP, atau membawa kredensial.

Auth dipilih dalam urutan ini:

1. Profil auth Codex OpenClaw eksplisit untuk agen.
2. Akun app-server yang sudah ada di home Codex agen tersebut.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, saat tidak ada akun app-server dan auth OpenAI masih
   diperlukan.

Saat OpenClaw melihat profil auth Codex bergaya langganan ChatGPT, OpenClaw
menghapus `CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses anak Codex yang
dijalankan. Itu menjaga kunci API level Gateway tetap tersedia untuk embedding
atau model OpenAI langsung tanpa membuat giliran app-server native Codex ditagih
melalui API secara tidak sengaja. Profil kunci API Codex eksplisit dan fallback
kunci env stdio lokal menggunakan login app-server, bukan env proses anak yang
diwarisi. Koneksi app-server WebSocket tidak menerima fallback kunci API env
Gateway; gunakan profil auth eksplisit atau akun milik app-server jarak jauh.

Jika deployment membutuhkan isolasi environment tambahan, tambahkan variabel
tersebut ke `appServer.clearEnv`:

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

Alat dinamis Codex secara default menggunakan profil `native-first`. Dalam mode itu,
OpenClaw tidak mengekspos alat dinamis yang menduplikasi operasi ruang kerja bawaan Codex:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, dan
`update_plan`. Alat integrasi OpenClaw seperti perpesanan, sesi, media,
cron, browser, node, gateway, `heartbeat_respond`, dan `web_search` tetap
tersedia.

Bidang plugin Codex tingkat atas yang didukung:

| Bidang                     | Default          | Makna                                                                                     |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Gunakan `"openclaw-compat"` untuk mengekspos set lengkap alat dinamis OpenClaw ke app-server Codex. |
| `codexDynamicToolsExclude` | `[]`             | Nama alat dinamis OpenClaw tambahan yang akan dihilangkan dari giliran app-server Codex.   |

Bidang `appServer` yang didukung:

| Bidang              | Default                                  | Makna                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                        |
| `command`           | biner Codex terkelola                    | Executable untuk transport stdio. Biarkan tidak disetel untuk menggunakan biner terkelola; setel hanya untuk override eksplisit.                                                                                                      |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumen untuk transport stdio.                                                                                                                                                                                                        |
| `url`               | tidak disetel                            | URL app-server WebSocket.                                                                                                                                                                                                             |
| `authToken`         | tidak disetel                            | Token Bearer untuk transport WebSocket.                                                                                                                                                                                               |
| `headers`           | `{}`                                     | Header WebSocket tambahan.                                                                                                                                                                                                            |
| `clearEnv`          | `[]`                                     | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya. `CODEX_HOME` dan `HOME` dicadangkan untuk isolasi Codex per agen milik OpenClaw pada peluncuran lokal. |
| `requestTimeoutMs`  | `60000`                                  | Timeout untuk panggilan control-plane app-server.                                                                                                                                                                                     |
| `mode`              | `"yolo"`                                 | Preset untuk eksekusi YOLO atau yang ditinjau guardian.                                                                                                                                                                               |
| `approvalPolicy`    | `"never"`                                | Kebijakan persetujuan Codex native yang dikirim ke thread start/resume/turn.                                                                                                                                                          |
| `sandbox`           | `"danger-full-access"`                   | Mode sandbox Codex native yang dikirim ke thread start/resume.                                                                                                                                                                        |
| `approvalsReviewer` | `"user"`                                 | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native. `guardian_subagent` tetap menjadi alias legacy.                                                                                                                |
| `serviceTier`       | tidak disetel                            | Tingkat layanan app-server Codex opsional: `"fast"`, `"flex"`, atau `null`. Nilai legacy yang tidak valid diabaikan.                                                                                                                  |

Panggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: setiap permintaan Codex `item/tool/call` harus menerima
respons OpenClaw dalam 30 detik. Saat timeout, OpenClaw membatalkan sinyal alat
jika didukung dan mengembalikan respons alat-dinamis yang gagal ke Codex agar
giliran dapat berlanjut alih-alih membiarkan sesi berada dalam `processing`.

Setelah OpenClaw merespons permintaan app-server berskala giliran Codex, harness
juga mengharapkan Codex menyelesaikan giliran native dengan `turn/completed`. Jika
app-server tidak merespons selama 60 detik setelah respons itu, OpenClaw berupaya
sebaik mungkin menginterupsi giliran Codex, mencatat timeout diagnostik, dan melepas
jalur sesi OpenClaw agar pesan chat lanjutan tidak mengantre di belakang giliran
native yang sudah basi.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai. Konfigurasi
lebih disarankan untuk deployment yang dapat diulang karena menjaga perilaku plugin
di file yang sama yang telah ditinjau dengan sisa penyiapan harness Codex.

## Penggunaan komputer

Penggunaan Komputer dibahas dalam panduan penyiapannya sendiri:
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak menyertakan app kontrol desktop sebagai vendor atau mengeksekusi
aksi desktop sendiri. OpenClaw menyiapkan app-server Codex, memverifikasi bahwa server MCP
`computer-use` tersedia, lalu membiarkan Codex menangani panggilan alat MCP native
selama giliran mode Codex.

Untuk akses driver TryCua langsung di luar alur marketplace Codex, daftarkan
`cua-driver mcp` dengan `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Lihat [Penggunaan Komputer Codex](/id/plugins/codex-computer-use) untuk perbedaan
antara Penggunaan Komputer milik Codex dan pendaftaran MCP langsung.

Konfigurasi minimal:

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

Penyiapan dapat diperiksa atau diinstal dari permukaan perintah:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Penggunaan Komputer khusus macOS dan mungkin memerlukan izin OS lokal sebelum
server MCP Codex dapat mengontrol app. Jika `computerUse.enabled` bernilai true dan server MCP
tidak tersedia, giliran mode Codex gagal sebelum thread dimulai alih-alih
berjalan diam-diam tanpa alat Penggunaan Komputer native. Lihat
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use) untuk pilihan marketplace,
batas katalog jarak jauh, alasan status, dan pemecahan masalah.

Saat `computerUse.autoInstall` bernilai true, OpenClaw dapat mendaftarkan marketplace
Codex Desktop terbundel standar dari
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` jika Codex
belum menemukan marketplace lokal. Gunakan `/new` atau `/reset` setelah
mengubah konfigurasi runtime atau Penggunaan Komputer agar sesi yang ada tidak mempertahankan
pengikatan thread PI atau Codex lama.

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

Pergantian model tetap dikendalikan OpenClaw. Saat sesi OpenClaw dilampirkan
ke thread Codex yang ada, giliran berikutnya mengirim model OpenAI, provider,
kebijakan persetujuan, sandbox, dan tingkat layanan yang saat ini dipilih ke
app-server lagi. Beralih dari `openai/gpt-5.5` ke `openai/gpt-5.2` mempertahankan
pengikatan thread tetapi meminta Codex melanjutkan dengan model yang baru dipilih.

## Perintah Codex

Plugin terbundel mendaftarkan `/codex` sebagai perintah slash yang diotorisasi. Perintah ini
generik dan berfungsi di channel apa pun yang mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` menampilkan konektivitas server aplikasi langsung, model, akun, batas laju, server MCP, dan Skills.
- `/codex models` mencantumkan model server aplikasi Codex langsung.
- `/codex threads [filter]` mencantumkan thread Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke thread Codex yang sudah ada.
- `/codex compact` meminta server aplikasi Codex untuk memadatkan thread yang dilampirkan.
- `/codex review` memulai peninjauan native Codex untuk thread yang dilampirkan.
- `/codex diagnostics [note]` meminta konfirmasi sebelum mengirim umpan balik diagnostik Codex untuk thread yang dilampirkan.
- `/codex computer-use status` memeriksa Plugin Computer Use dan server MCP yang dikonfigurasi.
- `/codex computer-use install` menginstal Plugin Computer Use yang dikonfigurasi dan memuat ulang server MCP.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP server aplikasi Codex.
- `/codex skills` mencantumkan Skills server aplikasi Codex.

### Alur kerja debugging umum

Saat agen berbasis Codex melakukan sesuatu yang mengejutkan di Telegram, Discord, Slack,
atau saluran lain, mulai dari percakapan tempat masalah terjadi:

1. Jalankan `/diagnostics bad tool choice after image upload` atau catatan singkat lain
   yang menjelaskan apa yang Anda lihat.
2. Setujui permintaan diagnostik satu kali. Persetujuan membuat zip diagnostik Gateway
   lokal dan, karena sesi menggunakan harness Codex, juga
   mengirim bundel umpan balik Codex yang relevan ke server OpenAI.
3. Salin balasan diagnostik yang selesai ke laporan bug atau thread dukungan.
   Balasan itu menyertakan jalur bundel lokal, ringkasan privasi, id sesi OpenClaw,
   id thread Codex, dan baris `Inspect locally` untuk setiap thread Codex.
4. Jika Anda ingin men-debug run sendiri, jalankan perintah `Inspect locally`
   yang dicetak di terminal. Bentuknya seperti `codex resume <thread-id>` dan membuka
   thread native Codex sehingga Anda dapat memeriksa percakapan, melanjutkannya secara lokal,
   atau bertanya kepada Codex mengapa memilih alat atau rencana tertentu.

Gunakan `/codex diagnostics [note]` hanya saat Anda secara khusus menginginkan unggahan
umpan balik Codex untuk thread yang saat ini dilampirkan tanpa bundel diagnostik
Gateway OpenClaw lengkap. Untuk sebagian besar laporan dukungan, `/diagnostics [note]` adalah
titik awal yang lebih baik karena mengikat status Gateway lokal dan id thread Codex
bersama dalam satu balasan. Lihat [Ekspor diagnostik](/id/gateway/diagnostics)
untuk model privasi lengkap dan perilaku obrolan grup.

Inti OpenClaw juga mengekspos `/diagnostics [note]` khusus pemilik sebagai perintah
diagnostik Gateway umum. Prompt persetujuannya menampilkan pengantar data sensitif,
menautkan ke [Ekspor Diagnostik](/id/gateway/diagnostics), dan meminta
`openclaw gateway diagnostics export --json` melalui persetujuan eksekusi eksplisit
setiap kali. Jangan menyetujui diagnostik dengan aturan izinkan-semua. Setelah disetujui,
OpenClaw mengirim laporan yang dapat ditempel dengan jalur bundel lokal dan ringkasan
manifest. Saat sesi OpenClaw aktif menggunakan harness Codex, persetujuan
yang sama juga mengotorisasi pengiriman bundel umpan balik Codex yang relevan ke
server OpenAI. Prompt persetujuan menyatakan bahwa umpan balik Codex akan dikirim, tetapi
tidak mencantumkan id sesi atau thread Codex sebelum persetujuan.

Jika `/diagnostics` dipanggil oleh pemilik di obrolan grup, OpenClaw menjaga
saluran bersama tetap bersih: grup hanya menerima pemberitahuan singkat, sedangkan
pengantar diagnostik, prompt persetujuan, dan id sesi/thread Codex dikirim ke
pemilik melalui rute persetujuan privat. Jika tidak ada rute pemilik privat,
OpenClaw menolak permintaan grup dan meminta pemilik menjalankannya dari DM.

Unggahan Codex yang disetujui memanggil `feedback/upload` server aplikasi Codex dan meminta
server aplikasi menyertakan log untuk setiap thread yang dicantumkan dan subthread Codex
yang dibuat jika tersedia. Unggahan melewati jalur umpan balik normal Codex ke server
OpenAI; jika umpan balik Codex dinonaktifkan di server aplikasi itu, perintah mengembalikan
galat server aplikasi. Balasan diagnostik yang selesai mencantumkan saluran,
id sesi OpenClaw, id thread Codex, dan perintah lokal `codex resume <thread-id>`
untuk thread yang dikirim. Jika Anda menolak atau mengabaikan persetujuan,
OpenClaw tidak mencetak id Codex tersebut. Unggahan ini tidak menggantikan ekspor
diagnostik Gateway lokal.

`/codex resume` menulis file binding sidecar yang sama dengan yang digunakan harness untuk
giliran normal. Pada pesan berikutnya, OpenClaw melanjutkan thread Codex tersebut, meneruskan
model OpenClaw yang saat ini dipilih ke server aplikasi, dan menjaga riwayat diperluas
tetap aktif.

### Memeriksa thread Codex dari CLI

Cara tercepat untuk memahami run Codex yang buruk sering kali adalah membuka thread native Codex
secara langsung:

```sh
codex resume <thread-id>
```

Gunakan ini saat Anda melihat bug dalam percakapan saluran dan ingin memeriksa sesi
Codex yang bermasalah, melanjutkannya secara lokal, atau bertanya kepada Codex mengapa membuat
pilihan alat atau penalaran tertentu. Jalur termudah biasanya menjalankan
`/diagnostics [note]` terlebih dahulu: setelah Anda menyetujuinya, laporan yang selesai mencantumkan
setiap thread Codex dan mencetak perintah `Inspect locally`, misalnya
`codex resume <thread-id>`. Anda dapat menyalin perintah itu langsung ke terminal.

Anda juga bisa mendapatkan id thread dari `/codex binding` untuk obrolan saat ini atau
`/codex threads [filter]` untuk thread server aplikasi Codex terbaru, lalu menjalankan perintah
`codex resume` yang sama di shell Anda.

Permukaan perintah memerlukan server aplikasi Codex `0.125.0` atau lebih baru. Metode
kontrol individual dilaporkan sebagai `unsupported by this Codex app-server` jika
server aplikasi masa depan atau khusus tidak mengekspos metode JSON-RPC tersebut.

## Batas hook

Harness Codex memiliki tiga lapisan hook:

| Lapisan                               | Pemilik                  | Tujuan                                                               |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| Hook Plugin OpenClaw                  | OpenClaw                 | Kompatibilitas produk/Plugin di seluruh harness PI dan Codex.        |
| Middleware ekstensi server aplikasi Codex | Plugin bawaan OpenClaw | Perilaku adaptor per giliran di sekitar alat dinamis OpenClaw.       |
| Hook native Codex                     | Codex                    | Siklus hidup Codex tingkat rendah dan kebijakan alat native dari config Codex. |

OpenClaw tidak menggunakan file `hooks.json` Codex proyek atau global untuk merutekan
perilaku Plugin OpenClaw. Untuk bridge alat native dan izin yang didukung,
OpenClaw menyuntikkan config Codex per thread untuk `PreToolUse`, `PostToolUse`,
`PermissionRequest`, dan `Stop`. Hook Codex lain seperti `SessionStart` dan
`UserPromptSubmit` tetap menjadi kontrol tingkat Codex; hook tersebut tidak diekspos sebagai
hook Plugin OpenClaw dalam kontrak v1.

Untuk alat dinamis OpenClaw, OpenClaw mengeksekusi alat setelah Codex meminta
panggilan, sehingga OpenClaw menjalankan perilaku Plugin dan middleware yang dimilikinya di
adaptor harness. Untuk alat native Codex, Codex memiliki rekaman alat kanonis.
OpenClaw dapat mencerminkan peristiwa tertentu, tetapi tidak dapat menulis ulang thread native Codex
kecuali Codex mengekspos operasi itu melalui server aplikasi atau callback hook native.

Proyeksi Compaction dan siklus hidup LLM berasal dari notifikasi server aplikasi Codex
dan status adaptor OpenClaw, bukan perintah hook native Codex.
Peristiwa `before_compaction`, `after_compaction`, `llm_input`, dan
`llm_output` OpenClaw adalah observasi tingkat adaptor, bukan tangkapan byte-per-byte
dari permintaan internal atau payload Compaction Codex.

Notifikasi server aplikasi `hook/started` dan `hook/completed` native Codex
diproyeksikan sebagai peristiwa agen `codex_app_server.hook` untuk trajektori dan debugging.
Notifikasi tersebut tidak memanggil hook Plugin OpenClaw.

## Kontrak dukungan V1

Mode Codex bukanlah PI dengan panggilan model yang berbeda di bawahnya. Codex memiliki lebih banyak
loop model native, dan OpenClaw mengadaptasi permukaan Plugin dan sesinya
di sekitar batas itu.

Didukung dalam runtime Codex v1:

| Permukaan                                     | Dukungan                                | Alasan                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Loop model OpenAI melalui Codex               | Didukung                                | Server aplikasi Codex memiliki giliran OpenAI, lanjutkan thread native, dan kelanjutan alat native.                                                                                                    |
| Perutean dan pengiriman saluran OpenClaw      | Didukung                                | Telegram, Discord, Slack, WhatsApp, iMessage, dan saluran lain tetap berada di luar runtime model.                                                                                                     |
| Alat dinamis OpenClaw                         | Didukung                                | Codex meminta OpenClaw mengeksekusi alat-alat ini, sehingga OpenClaw tetap berada di jalur eksekusi.                                                                                                   |
| Plugin prompt dan konteks                     | Didukung                                | OpenClaw membangun overlay prompt dan memproyeksikan konteks ke giliran Codex sebelum memulai atau melanjutkan thread.                                                                                 |
| Siklus hidup mesin konteks                    | Didukung                                | Assemble, ingest atau pemeliharaan setelah giliran, dan koordinasi Compaction mesin konteks berjalan untuk giliran Codex.                                                                              |
| Hook alat dinamis                             | Didukung                                | `before_tool_call`, `after_tool_call`, dan middleware hasil alat berjalan di sekitar alat dinamis milik OpenClaw.                                                                                      |
| Hook siklus hidup                             | Didukung sebagai observasi adaptor      | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, dan `after_compaction` berjalan dengan payload mode Codex yang jujur.                                                                     |
| Gate revisi jawaban akhir                     | Didukung melalui relay hook native      | `Stop` Codex direlay ke `before_agent_finalize`; `revise` meminta Codex melakukan satu pass model lagi sebelum finalisasi.                                                                             |
| Shell native, patch, dan blokir atau amati MCP | Didukung melalui relay hook native     | `PreToolUse` dan `PostToolUse` Codex direlay untuk permukaan alat native yang dikomit, termasuk payload MCP pada server aplikasi Codex `0.125.0` atau lebih baru. Pemblokiran didukung; penulisan ulang argumen tidak. |
| Kebijakan izin native                         | Didukung melalui relay hook native      | `PermissionRequest` Codex dapat dirutekan melalui kebijakan OpenClaw jika runtime mengeksposnya. Jika OpenClaw tidak mengembalikan keputusan, Codex melanjutkan melalui guardian normal atau jalur persetujuan pengguna. |
| Tangkapan trajektori server aplikasi          | Didukung                                | OpenClaw merekam permintaan yang dikirim ke server aplikasi dan notifikasi server aplikasi yang diterimanya.                                                                                           |

Tidak didukung dalam runtime Codex v1:

| Surface                                             | Batas V1                                                                                                                                     | Jalur mendatang                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutasi argumen alat native                          | Hook pra-alat native Codex dapat memblokir, tetapi OpenClaw tidak menulis ulang argumen alat native Codex.                                               | Memerlukan dukungan hook/skema Codex untuk input alat pengganti.                            |
| Riwayat transkrip native Codex yang dapat diedit            | Codex memiliki riwayat thread native kanonis. OpenClaw memiliki mirror dan dapat memproyeksikan konteks mendatang, tetapi tidak boleh memutasi internal yang tidak didukung. | Tambahkan API app-server Codex eksplisit jika pembedahan thread native diperlukan.                    |
| `tool_result_persist` untuk catatan alat native Codex | Hook itu mentransformasi penulisan transkrip milik OpenClaw, bukan catatan alat native Codex.                                                           | Dapat melakukan mirror catatan yang ditransformasi, tetapi penulisan ulang kanonis memerlukan dukungan Codex.              |
| Metadata compaction native yang kaya                     | OpenClaw mengamati mulai dan selesainya compaction, tetapi tidak menerima daftar yang dipertahankan/dibuang yang stabil, delta token, atau payload ringkasan.            | Memerlukan event compaction Codex yang lebih kaya.                                                     |
| Intervensi compaction                             | Hook compaction OpenClaw saat ini berada pada tingkat notifikasi dalam mode Codex.                                                                         | Tambahkan hook pra/pasca compaction Codex jika plugins perlu memveto atau menulis ulang compaction native. |
| Penangkapan permintaan API model byte demi byte             | OpenClaw dapat menangkap permintaan dan notifikasi app-server, tetapi core Codex membangun permintaan API OpenAI final secara internal.                      | Memerlukan event pelacakan permintaan model Codex atau API debug.                                   |

## Alat, media, dan compaction

Harness Codex hanya mengubah eksekutor agen tertanam tingkat rendah.

OpenClaw tetap membangun daftar alat dan menerima hasil alat dinamis dari
harness. Teks, gambar, video, musik, TTS, persetujuan, dan keluaran alat pesan
tetap melalui jalur pengiriman OpenClaw normal.

Relay hook native sengaja dibuat generik, tetapi kontrak dukungan v1
dibatasi pada jalur alat dan izin native Codex yang diuji OpenClaw. Dalam
runtime Codex, itu mencakup payload shell, patch, dan MCP `PreToolUse`,
`PostToolUse`, dan `PermissionRequest`. Jangan berasumsi setiap event hook
Codex di masa mendatang adalah surface plugin OpenClaw sampai kontrak runtime
menamainya.

Untuk `PermissionRequest`, OpenClaw hanya mengembalikan keputusan izinkan atau
tolak eksplisit ketika kebijakan memutuskan. Hasil tanpa keputusan bukanlah
izin. Codex memperlakukannya sebagai tidak ada keputusan hook dan meneruskan ke
jalur guardian atau persetujuan penggunanya sendiri.

Permintaan persetujuan alat MCP Codex dirutekan melalui alur persetujuan plugin
OpenClaw ketika Codex menandai `_meta.codex_approval_kind` sebagai
`"mcp_tool_call"`. Prompt `request_user_input` Codex dikirim kembali ke chat
asal, dan pesan tindak lanjut berikutnya dalam antrean menjawab permintaan
server native itu alih-alih diarahkan sebagai konteks tambahan. Permintaan
elisitasi MCP lainnya tetap gagal tertutup.

Pengarahan antrean active-run dipetakan ke `turn/steer` app-server Codex. Dengan
default `messages.queue.mode: "steer"`, OpenClaw mengelompokkan pesan chat yang
diantrekan selama jendela hening yang dikonfigurasi dan mengirimkannya sebagai
satu permintaan `turn/steer` dalam urutan kedatangan. Mode lama `queue`
mengirim permintaan `turn/steer` terpisah. Giliran review dan compaction manual
Codex dapat menolak pengarahan giliran yang sama, dalam hal ini OpenClaw
menggunakan antrean tindak lanjut ketika mode yang dipilih mengizinkan fallback. Lihat
[Antrean pengarahan](/id/concepts/queue-steering).

Ketika model yang dipilih menggunakan harness Codex, compaction thread native
didelegasikan ke app-server Codex. OpenClaw menyimpan mirror transkrip untuk
riwayat channel, pencarian, `/new`, `/reset`, dan pengalihan model atau harness
di masa mendatang. Mirror mencakup prompt pengguna, teks asisten final, dan
catatan reasoning atau rencana Codex ringan ketika app-server memancarkannya.
Saat ini, OpenClaw hanya mencatat sinyal mulai dan selesai compaction native.
OpenClaw belum mengekspos ringkasan compaction yang dapat dibaca manusia atau
daftar teraudit entri mana yang dipertahankan Codex setelah compaction.

Karena Codex memiliki thread native kanonis, `tool_result_persist` saat ini
tidak menulis ulang catatan hasil alat native Codex. Ini hanya berlaku ketika
OpenClaw menulis hasil alat transkrip sesi milik OpenClaw.

Pembuatan media tidak memerlukan PI. Gambar, video, musik, PDF, TTS, dan
pemahaman media tetap menggunakan pengaturan provider/model yang sesuai seperti
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, dan
`messages.tts`.

## Pemecahan masalah

**Codex tidak muncul sebagai provider `/model` normal:** itu memang diharapkan untuk
konfigurasi baru. Pilih model `openai/gpt-*` dengan
`agentRuntime.id: "codex"` (atau ref `codex/*` lama), aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan PI alih-alih Codex:** `agentRuntime.id: "auto"` masih dapat menggunakan PI sebagai
backend kompatibilitas ketika tidak ada harness Codex yang mengklaim run. Atur
`agentRuntime.id: "codex"` untuk memaksa pemilihan Codex saat pengujian.
Runtime Codex yang dipaksa akan gagal alih-alih fallback ke PI. Setelah
app-server Codex dipilih, kegagalannya muncul langsung.

**App-server ditolak:** tingkatkan Codex agar handshake app-server
melaporkan versi `0.125.0` atau lebih baru. Prarilis versi yang sama atau versi
bersufiks build seperti `0.125.0-alpha.2` atau `0.125.0+custom` ditolak karena
floor protokol stabil `0.125.0` adalah yang diuji OpenClaw.

**Penemuan model lambat:** turunkan `plugins.entries.codex.config.discovery.timeoutMs`
atau nonaktifkan penemuan.

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
dan pastikan app-server jarak jauh berbicara dengan versi protokol app-server Codex yang sama.

**Model non-Codex menggunakan PI:** itu memang diharapkan kecuali Anda memaksa
`agentRuntime.id: "codex"` untuk agen itu atau memilih ref `codex/*` lama.
`openai/gpt-*` biasa dan ref provider lainnya tetap berada di jalur provider
normalnya dalam mode `auto`. Jika Anda memaksa `agentRuntime.id: "codex"`, setiap
giliran tertanam untuk agen itu harus berupa model OpenAI yang didukung Codex.

**Computer Use terpasang tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika sebuah alat melaporkan
`Native hook relay unavailable`, gunakan `/new` atau `/reset`; jika tetap terjadi, mulai ulang
gateway untuk membersihkan pendaftaran hook native yang usang. Jika `computer-use.list_apps`
mengalami timeout, mulai ulang Codex Computer Use atau Codex Desktop dan coba lagi.

## Terkait

- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Provider model](/id/concepts/model-providers)
- [Provider OpenAI](/id/providers/openai)
- [Status](/id/cli/status)
- [Hook plugin](/id/plugins/hooks)
- [Referensi konfigurasi](/id/gateway/configuration-reference)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
