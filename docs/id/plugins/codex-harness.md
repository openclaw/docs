---
read_when:
    - Anda ingin menggunakan harness app-server Codex yang dibundel
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin deployment khusus Codex gagal alih-alih beralih kembali ke OpenClaw
summary: Jalankan giliran agen tertanam OpenClaw melalui harness app-server Codex bawaan
title: Kerangka pengujian Codex
x-i18n:
    generated_at: "2026-07-03T17:41:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589aed06678207b3349c17dd1997c2d17abd5f4b8747fc18fd858b5a03a2d003
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen OpenAI tertanam
melalui Codex app-server, bukan harness OpenClaw bawaan.

Gunakan harness Codex saat Anda ingin Codex memiliki sesi agen tingkat rendah:
resume thread native, kelanjutan alat native, compaction native, dan
eksekusi app-server. OpenClaw tetap memiliki saluran chat, file sesi, pemilihan
model, alat dinamis OpenClaw, persetujuan, pengiriman media, dan cermin
transkrip yang terlihat.

Penyiapan normal menggunakan ref model OpenAI kanonis seperti `openai/gpt-5.5`.
Jangan konfigurasikan ref GPT Codex lama. Letakkan urutan auth agen OpenAI
di bawah `auth.order.openai`; id profil auth Codex lama yang lebih lama dan
entri urutan auth Codex lama adalah state warisan yang diperbaiki oleh
`openclaw doctor --fix`.

Saat tidak ada sandbox OpenClaw yang aktif, OpenClaw memulai thread Codex app-server
dengan mode kode native Codex diaktifkan sambil membiarkan khusus-mode-kode nonaktif secara default.
Ini menjaga workspace native Codex dan kemampuan kode tetap tersedia sementara
alat dinamis OpenClaw berlanjut melalui bridge `item/tool/call` app-server.
Sandboxing OpenClaw aktif dan kebijakan alat terbatas menonaktifkan mode kode native
sepenuhnya kecuali Anda memilih jalur exec-server sandbox eksperimental.

Fitur native Codex ini terpisah dari
[mode kode OpenClaw](/id/reference/code-mode), yaitu runtime QuickJS-WASI opsional
untuk run OpenClaw generik dengan bentuk input `exec` yang berbeda.

Untuk pemisahan model/provider/runtime yang lebih luas, mulai dengan
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya adalah:
`openai/gpt-5.5` adalah ref model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau saluran lain tetap menjadi permukaan komunikasi.

## Persyaratan

- OpenClaw dengan Plugin `codex` bawaan tersedia.
- Jika config Anda menggunakan `plugins.allow`, sertakan `codex`.
- Codex app-server `0.125.0` atau lebih baru. Plugin bawaan mengelola biner
  Codex app-server yang kompatibel secara default, sehingga perintah `codex` lokal di `PATH` tidak
  memengaruhi startup harness normal.
- Auth Codex tersedia melalui `openclaw models auth login --provider openai`,
  akun app-server di home Codex agen, atau profil auth API-key Codex eksplisit.

Untuk presedensi auth, isolasi lingkungan, perintah app-server kustom, discovery
model, dan semua field config, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference).

## Mulai cepat

Kebanyakan pengguna yang menginginkan Codex di OpenClaw menginginkan jalur ini: masuk dengan
langganan ChatGPT/Codex, aktifkan Plugin `codex` bawaan, dan gunakan
ref model `openai/gpt-*` kanonis.

Masuk dengan OAuth Codex:

```bash
openclaw models auth login --provider openai
```

Aktifkan Plugin `codex` bawaan dan pilih model agen OpenAI:

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
    },
  },
}
```

Jika config Anda menggunakan `plugins.allow`, tambahkan juga `codex` di sana:

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

Mulai ulang gateway setelah mengubah config plugin. Jika chat yang ada sudah
memiliki sesi, gunakan `/new` atau `/reset` sebelum menguji perubahan runtime agar giliran berikutnya
menyelesaikan harness dari config saat ini.

## Konfigurasi

Config mulai cepat adalah config harness Codex minimum yang layak. Tetapkan opsi
harness Codex di config OpenClaw, dan gunakan CLI hanya untuk auth Codex:

| Kebutuhan                              | Tetapkan                                                                         | Tempat                             |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Aktifkan harness                       | `plugins.entries.codex.enabled: true`                                            | Config OpenClaw                    |
| Pertahankan instalasi plugin allowlist | Sertakan `codex` di `plugins.allow`                                              | Config OpenClaw                    |
| Rutekan giliran agen OpenAI melalui Codex | `agents.defaults.model` atau `agents.list[].model` sebagai `openai/gpt-*`      | Config agen OpenClaw               |
| Masuk dengan OAuth ChatGPT/Codex       | `openclaw models auth login --provider openai`                                   | Profil auth CLI                    |
| Tambahkan cadangan API-key untuk run Codex | Profil API-key `openai:*` tercantum setelah auth langganan di `auth.order.openai` | Profil auth CLI + config OpenClaw |
| Gagal tertutup saat Codex tidak tersedia | Provider atau model `agentRuntime.id: "codex"`                                 | Config model/provider OpenClaw     |
| Gunakan traffic API OpenAI langsung    | Provider atau model `agentRuntime.id: "openclaw"` dengan auth OpenAI normal      | Config model/provider OpenClaw     |
| Setel perilaku app-server              | `plugins.entries.codex.config.appServer.*`                                       | Config Plugin Codex                |
| Aktifkan aplikasi Plugin Codex native  | `plugins.entries.codex.config.codexPlugins.*`                                    | Config Plugin Codex                |
| Aktifkan Codex Computer Use            | `plugins.entries.codex.config.computerUse.*`                                     | Config Plugin Codex                |

Gunakan ref model `openai/gpt-*` untuk giliran agen OpenAI yang didukung Codex. Utamakan
`auth.order.openai` untuk pengurutan langganan-terlebih-dahulu/cadangan-API-key. Id profil auth
Codex lama yang ada dan urutan auth Codex lama adalah state warisan khusus doctor;
jangan tulis ref GPT Codex lama baru.

Jangan tetapkan `compaction.model` atau `compaction.provider` pada agen yang didukung Codex.
Codex melakukan compaction melalui state thread app-server native-nya, sehingga OpenClaw mengabaikan
override peringkas lokal tersebut saat runtime dan `openclaw doctor --fix` menghapus
override itu saat agen menggunakan Codex.

Lossless tetap didukung sebagai engine konteks untuk assembly, ingestion, dan
pemeliharaan di sekitar giliran Codex. Konfigurasikan melalui
`plugins.slots.contextEngine: "lossless-claw"` dan
`plugins.entries.lossless-claw.config.summaryModel`, bukan melalui
`agents.defaults.compaction.provider`. `openclaw doctor --fix` memigrasikan bentuk lama
`compaction.provider: "lossless-claw"` ke slot engine konteks Lossless
saat Codex adalah runtime aktif, tetapi Codex native tetap memiliki compaction.

Harness Codex app-server native mendukung engine konteks yang memerlukan
assembly pra-prompt. Backend CLI generik, termasuk `codex-cli`, tidak menyediakan
kemampuan host tersebut.

Untuk agen yang didukung Codex, `/compact` memulai compaction Codex app-server native pada
thread terikat. OpenClaw tidak menunggu penyelesaian, menerapkan timeout OpenClaw,
memulai ulang app-server bersama, atau fallback ke engine konteks atau
peringkas OpenAI publik. Jika binding thread Codex native hilang atau
stale, perintah gagal tertutup agar operator melihat batas runtime nyata
alih-alih diam-diam beralih backend compaction.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Dalam bentuk itu, kedua profil tetap berjalan melalui Codex untuk giliran agen
`openai/gpt-*`. API key hanya fallback auth, bukan permintaan untuk beralih ke OpenClaw atau
OpenAI Responses biasa.

Sisa halaman ini membahas varian umum yang harus dipilih pengguna:
bentuk deployment, routing gagal-tertutup, kebijakan persetujuan guardian, Plugin Codex
native, dan Computer Use. Untuk daftar opsi lengkap, default, enum, discovery,
isolasi lingkungan, timeout, dan field transport app-server, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference).

## Verifikasi runtime Codex

Gunakan `/status` di chat tempat Anda mengharapkan Codex. Giliran agen OpenAI yang didukung Codex
menampilkan:

```text
Runtime: OpenAI Codex
```

Lalu periksa state Codex app-server:

```text
/codex status
/codex models
```

`/codex status` melaporkan konektivitas app-server, akun, batas rate, server MCP,
dan skills. `/codex models` mencantumkan katalog Codex app-server live untuk
harness dan akun. Jika `/status` mengejutkan, lihat
[Pemecahan masalah](#troubleshooting).

## Routing dan pemilihan model

Pisahkan ref provider dan kebijakan runtime:

- Gunakan `openai/gpt-*` untuk giliran agen OpenAI melalui Codex.
- Jangan gunakan ref GPT Codex lama di config. Jalankan `openclaw doctor --fix` untuk
  memperbaiki ref lama dan pin rute sesi stale.
- `agentRuntime.id: "codex"` opsional untuk mode otomatis OpenAI normal, tetapi berguna
  saat deployment harus gagal tertutup jika Codex tidak tersedia.
- `agentRuntime.id: "openclaw"` memilih provider atau model ke dalam runtime tertanam OpenClaw
  saat itu disengaja.
- `/codex ...` mengontrol percakapan Codex app-server native dari chat.
- ACP/acpx adalah jalur harness eksternal terpisah. Gunakan hanya saat pengguna meminta
  ACP/acpx atau adapter harness eksternal.

Routing perintah umum:

| Niat pengguna                                          | Gunakan                                                                                               |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Lampirkan chat saat ini                               | `/codex bind [--cwd <path>]`                                                                          |
| Resume thread Codex yang ada                          | `/codex resume <thread-id>`                                                                           |
| Cantumkan atau filter thread Codex                    | `/codex threads [filter]`                                                                             |
| Cantumkan Plugin Codex native                         | `/codex plugins list`                                                                                 |
| Aktifkan atau nonaktifkan Plugin Codex native terkonfigurasi | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                |
| Lampirkan sesi Codex CLI yang ada pada node berpasangan | `/codex sessions --host <node> [filter]`, lalu `/codex resume <session-id> --host <node> --bind here` |
| Kirim umpan balik Codex saja                          | `/codex diagnostics [note]`                                                                           |
| Mulai tugas ACP/acpx                                  | Perintah sesi ACP/acpx, bukan `/codex`                                                               |

| Kasus penggunaan                                    | Konfigurasi                                                           | Verifikasi                              | Catatan                                      |
| --------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------- |
| Langganan ChatGPT/Codex dengan runtime Codex native | `openai/gpt-*` plus plugin `codex` yang diaktifkan                    | `/status` menampilkan `Runtime: OpenAI Codex` | Jalur yang direkomendasikan                  |
| Gagal tertutup jika Codex tidak tersedia            | Provider atau model `agentRuntime.id: "codex"`                        | Turn gagal alih-alih fallback tertanam  | Gunakan untuk deployment khusus Codex        |
| Trafik kunci API OpenAI langsung melalui OpenClaw   | Provider atau model `agentRuntime.id: "openclaw"` dan auth OpenAI normal | `/status` menampilkan runtime OpenClaw  | Gunakan hanya jika OpenClaw memang disengaja |
| Konfigurasi lama                                    | ref GPT Codex lama                                                    | `openclaw doctor --fix` menulis ulangnya | Jangan tulis konfigurasi baru dengan cara ini |
| Adapter ACP/acpx Codex                              | ACP `sessions_spawn({ runtime: "acp" })`                              | Status tugas/sesi ACP                   | Terpisah dari harness Codex native           |

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan `openai/gpt-*`
untuk rute OpenAI normal dan `codex/gpt-*` hanya ketika pemahaman gambar
harus berjalan melalui turn server aplikasi Codex yang dibatasi. Jangan gunakan
ref GPT Codex lama; doctor menulis ulang prefiks lama itu ke `openai/gpt-*`.

## Pola deployment

### Deployment Codex dasar

Gunakan konfigurasi quickstart ketika semua turn agen OpenAI harus menggunakan Codex secara
default.

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
    },
  },
}
```

### Deployment provider campuran

Bentuk ini mempertahankan Claude sebagai agen default dan menambahkan agen Codex bernama:

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
      model: "anthropic/claude-opus-4-6",
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
      },
    ],
  },
}
```

Dengan konfigurasi ini, agen `main` menggunakan jalur provider normalnya dan agen
`codex` menggunakan server aplikasi Codex.

### Deployment Codex gagal tertutup

Untuk turn agen OpenAI, `openai/gpt-*` sudah terselesaikan ke Codex ketika
plugin bawaan tersedia. Tambahkan kebijakan runtime eksplisit ketika Anda menginginkan aturan
gagal tertutup tertulis:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

Dengan Codex yang dipaksakan, OpenClaw gagal lebih awal jika plugin Codex dinonaktifkan,
server aplikasi terlalu lama, atau server aplikasi tidak dapat dimulai.

## Kebijakan server aplikasi

Secara default, plugin memulai binary Codex terkelola OpenClaw secara lokal dengan transport
stdio. Atur `appServer.command` hanya ketika Anda memang ingin menjalankan executable
yang berbeda. Gunakan transport WebSocket hanya ketika server aplikasi sudah
berjalan di tempat lain:

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
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Sesi server aplikasi stdio lokal secara default menggunakan postur operator lokal tepercaya:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Jika persyaratan Codex lokal tidak mengizinkan
postur YOLO implisit itu, OpenClaw memilih izin guardian yang diizinkan sebagai gantinya.
Ketika sandbox OpenClaw aktif untuk sesi tersebut, OpenClaw menonaktifkan Code Mode
native Codex, server MCP pengguna, dan eksekusi plugin yang didukung aplikasi untuk
turn itu alih-alih mengandalkan sandboxing sisi host Codex. Akses shell diekspos
melalui alat dinamis yang didukung sandbox OpenClaw seperti `sandbox_exec` dan
`sandbox_process` ketika alat exec/proses normal tersedia.

Gunakan mode exec OpenClaw ternormalisasi ketika Anda menginginkan tinjauan otomatis native Codex sebelum
keluar dari sandbox atau izin tambahan:

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

Untuk sesi server aplikasi Codex, OpenClaw memetakan `tools.exec.mode: "auto"` ke persetujuan yang ditinjau
Guardian oleh Codex, biasanya
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, dan
`sandbox: "workspace-write"` ketika persyaratan lokal mengizinkan nilai tersebut.
Dalam `tools.exec.mode: "auto"`, OpenClaw tidak mempertahankan override Codex lama yang tidak aman
`approvalPolicy: "never"` atau `sandbox: "danger-full-access"`; gunakan
`tools.exec.mode: "full"` untuk postur Codex tanpa persetujuan yang disengaja. Preset lama
`plugins.entries.codex.config.appServer.mode: "guardian"` masih berfungsi, tetapi
`tools.exec.mode: "auto"` adalah permukaan OpenClaw yang ternormalisasi.

Untuk perbandingan tingkat mode dengan persetujuan exec host dan izin ACPX,
lihat [Mode izin](/id/tools/permission-modes).

Untuk setiap field server aplikasi, urutan auth, isolasi environment, discovery, dan
perilaku timeout, lihat [Referensi harness Codex](/id/plugins/codex-harness-reference).

## Perintah dan diagnostik

Plugin bawaan mendaftarkan `/codex` sebagai perintah garis miring di channel apa pun yang
mendukung perintah teks OpenClaw.

Eksekusi dan kontrol native memerlukan owner atau klien Gateway `operator.admin`.
Ini mencakup mengikat atau melanjutkan thread, mengirim atau menghentikan turn,
mengubah model, fast-mode, atau status izin, melakukan compact atau review, dan
melepas binding. Pengirim terotorisasi lainnya mempertahankan perintah inspeksi status baca-saja, bantuan,
akun, model, thread, server MCP, skill, dan binding.

Bentuk umum:

- `/codex status` memeriksa konektivitas server aplikasi, model, akun, batas rate,
  server MCP, dan Skills.
- `/codex models` mencantumkan model server aplikasi Codex live.
- `/codex threads [filter]` mencantumkan thread server aplikasi Codex terbaru.
- `/codex resume <thread-id>` memasang sesi OpenClaw saat ini ke
  thread Codex yang sudah ada.
- `/codex compact` meminta server aplikasi Codex untuk melakukan compact pada thread yang terpasang.
- `/codex review` memulai review native Codex untuk thread yang terpasang.
- `/codex diagnostics [note]` meminta konfirmasi sebelum mengirim feedback Codex untuk
  thread yang terpasang.
- `/codex account` menampilkan status akun dan batas rate.
- `/codex mcp` mencantumkan status server MCP server aplikasi Codex.
- `/codex skills` mencantumkan skills server aplikasi Codex.

Untuk sebagian besar laporan dukungan, mulai dengan `/diagnostics [note]` dalam percakapan
tempat bug terjadi. Perintah ini membuat satu laporan diagnostik Gateway dan, untuk sesi
harness Codex, meminta persetujuan untuk mengirim bundle feedback Codex yang relevan.
Lihat [Ekspor diagnostik](/id/gateway/diagnostics) untuk model privasi dan perilaku
chat grup.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara spesifik menginginkan upload
feedback Codex untuk thread yang saat ini terpasang tanpa bundle diagnostik Gateway
lengkap.

### Periksa thread Codex secara lokal

Cara tercepat untuk memeriksa run Codex yang buruk sering kali adalah membuka thread Codex
native secara langsung:

```bash
codex resume <thread-id>
```

Dapatkan id thread dari balasan `/diagnostics` yang selesai, `/codex binding`, atau
`/codex threads [filter]`.

Untuk mekanisme upload dan batas diagnostik tingkat runtime, lihat
[Runtime harness Codex](/id/plugins/codex-harness-runtime#codex-feedback-upload).

Auth dipilih dalam urutan ini:

1. Profil auth OpenAI berurutan untuk agen, sebaiknya di bawah
   `auth.order.openai`. Jalankan `openclaw doctor --fix` untuk memigrasikan
   id profil auth Codex lama yang lebih lama dan urutan auth Codex lama.
2. Akun server aplikasi yang sudah ada di home Codex agen tersebut.
3. Hanya untuk peluncuran server aplikasi stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, ketika tidak ada akun server aplikasi dan auth OpenAI
   masih diperlukan.

Ketika OpenClaw melihat profil auth Codex bergaya langganan ChatGPT, OpenClaw menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses anak Codex yang dibuat. Ini
menjaga kunci API tingkat Gateway tetap tersedia untuk embedding atau model OpenAI langsung
tanpa membuat turn server aplikasi Codex native tertagih melalui API secara tidak sengaja.
Profil kunci API Codex eksplisit dan fallback env-key stdio lokal menggunakan login server aplikasi
alih-alih env proses anak yang diwarisi. Koneksi server aplikasi WebSocket
tidak menerima fallback kunci API env Gateway; gunakan profil auth eksplisit atau
akun milik server aplikasi jarak jauh.
Ketika plugin Codex native dikonfigurasi, OpenClaw menginstal atau me-refresh plugin tersebut
melalui server aplikasi yang terhubung sebelum mengekspos aplikasi milik plugin ke
thread Codex. `app/list` tetap menjadi sumber kebenaran untuk id aplikasi,
aksesibilitas, dan metadata, tetapi OpenClaw memiliki keputusan enablement per thread:
jika kebijakan mengizinkan aplikasi terdaftar yang dapat diakses, OpenClaw mengirim
`thread/start.config.apps[appId].enabled = true` bahkan ketika `app/list` saat ini
melaporkan aplikasi itu dinonaktifkan. Jalur ini tidak menciptakan instalasi aplikasi untuk
id yang tidak dikenal; OpenClaw hanya mengaktifkan plugin marketplace dengan `plugin/install`
lalu me-refresh inventaris.

Jika profil langganan terkena batas penggunaan Codex, OpenClaw mencatat waktu reset
ketika Codex melaporkannya dan mencoba profil auth berurutan berikutnya untuk run
Codex yang sama. Ketika waktu reset lewat, profil langganan kembali memenuhi syarat
tanpa mengubah model `openai/gpt-*` yang dipilih atau runtime Codex.

Untuk peluncuran server aplikasi stdio lokal, OpenClaw menetapkan `CODEX_HOME` ke direktori
per agen sehingga konfigurasi Codex, file auth/akun, cache/data plugin, dan status
thread native tidak membaca atau menulis `~/.codex` pribadi operator secara
default. OpenClaw mempertahankan proses normal `HOME`; subprocess yang dijalankan Codex
masih dapat menemukan konfigurasi dan token user-home, dan Codex dapat menemukan entri
bersama `$HOME/.agents/skills` dan `$HOME/.agents/plugins/marketplace.json`.

Jika deployment membutuhkan isolasi environment tambahan, tambahkan variabel tersebut ke
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

`appServer.clearEnv` hanya memengaruhi proses anak server aplikasi Codex yang dibuat.
OpenClaw menghapus `CODEX_HOME` dan `HOME` dari daftar ini selama normalisasi peluncuran lokal:
`CODEX_HOME` tetap per agen, dan `HOME` tetap diwarisi agar subprocess dapat menggunakan
status user-home normal.

Codex dynamic tools secara default menggunakan pemuatan `searchable`. OpenClaw tidak mengekspos
dynamic tools yang menduplikasi operasi workspace native Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process`, dan `update_plan`. Sebagian besar
alat integrasi OpenClaw lainnya seperti messaging, media, cron, browser, nodes,
gateway, dan `heartbeat_respond` tersedia melalui pencarian alat Codex di bawah
namespace `openclaw`, sehingga konteks model awal lebih kecil. Pencarian web
menggunakan alat `web_search` ter-hosting milik Codex secara default saat pencarian diaktifkan dan tidak ada
penyedia terkelola yang dipilih. Pencarian ter-hosting native dan dynamic tool
`web_search` terkelola milik OpenClaw saling eksklusif sehingga pencarian terkelola tidak dapat melewati
pembatasan domain native. OpenClaw menggunakan alat terkelola saat pencarian ter-hosting
tidak tersedia, dinonaktifkan secara eksplisit, atau diganti oleh penyedia terkelola yang dipilih.
OpenClaw tetap menonaktifkan ekstensi mandiri `web.run` milik Codex karena
traffic app-server produksi menolak namespace `web` yang ditentukan pengguna.
`tools.web.search.enabled: false` menonaktifkan kedua jalur, begitu pula run khusus LLM dengan alat dinonaktifkan. Codex memperlakukan `"cached"` sebagai preferensi dan menyelesaikannya menjadi akses eksternal live
untuk giliran app-server tanpa pembatasan. Fallback terkelola otomatis
gagal tertutup saat `allowedDomains` native diatur sehingga allowlist tidak dapat
dilewati. Perubahan kebijakan pencarian efektif yang persisten merotasi thread Codex
terikat sebelum giliran berikutnya. Pembatasan sementara per giliran menggunakan thread
terbatas sementara dan mempertahankan binding yang ada untuk resume nanti.
`sessions_yield` dan balasan sumber khusus alat pesan tetap langsung karena
itu adalah kontrak kontrol giliran. `sessions_spawn` tetap dapat dicari sehingga
`spawn_agent` native milik Codex tetap menjadi permukaan subagent Codex utama, sementara delegasi
OpenClaw atau ACP eksplisit masih tersedia melalui namespace dynamic tool
`openclaw`. Instruksi kolaborasi Heartbeat memberi tahu Codex untuk mencari
`heartbeat_respond` sebelum mengakhiri giliran heartbeat saat alat belum
dimuat.

Tetapkan `codexDynamicToolsLoading: "direct"` hanya saat terhubung ke app-server Codex kustom
yang tidak dapat mencari dynamic tools yang ditunda atau saat men-debug payload
alat lengkap.

Kolom Plugin Codex tingkat atas yang didukung:

| Kolom                      | Default        | Arti                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Gunakan `"direct"` untuk menaruh dynamic tools OpenClaw langsung di konteks alat Codex awal. |
| `codexDynamicToolsExclude` | `[]`           | Nama dynamic tool OpenClaw tambahan yang akan dihilangkan dari giliran app-server Codex.              |
| `codexPlugins`             | dinonaktifkan       | Dukungan plugin/app Codex native untuk plugin kurasi yang dimigrasikan dan dipasang dari sumber.           |

Kolom `appServer` yang didukung:

| Bidang                                        | Bawaan                                                 | Makna                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                                                                                                                                                                                  |
| `command`                                     | biner Codex terkelola                                  | Berkas eksekusi untuk transport stdio. Biarkan tidak diatur untuk memakai biner terkelola; atur hanya untuk penimpaan eksplisit.                                                                                                                                                                                                                                                                |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumen untuk transport stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | tidak diatur                                           | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | tidak diatur                                           | Token Bearer untuk transport WebSocket. Menerima string literal atau SecretInput seperti `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                           |
| `headers`                                     | `{}`                                                   | Header WebSocket tambahan. Nilai header menerima string literal atau nilai SecretInput, misalnya `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya. OpenClaw mempertahankan `CODEX_HOME` per agen dan `HOME` yang diwarisi untuk peluncuran lokal.                                                                                                                                                   |
| `codeModeOnly`                                | `false`                                                | Ikut serta dalam permukaan alat khusus mode kode milik Codex. Alat dinamis OpenClaw tetap terdaftar dengan Codex sehingga panggilan `tools.*` bertingkat kembali melalui jembatan app-server `item/tool/call`.                                                                                                                                                                                   |
| `remoteWorkspaceRoot`                         | tidak diatur                                           | Root workspace app-server Codex jarak jauh. Jika diatur, OpenClaw menyimpulkan root workspace lokal dari workspace OpenClaw yang di-resolve, mempertahankan sufiks cwd saat ini di bawah root jarak jauh ini, dan hanya mengirim cwd app-server final ke Codex. Jika cwd berada di luar root workspace OpenClaw yang di-resolve, OpenClaw gagal tertutup alih-alih mengirim jalur lokal-gateway ke app-server jarak jauh. |
| `requestTimeoutMs`                            | `60000`                                                | Timeout untuk panggilan bidang kontrol app-server.                                                                                                                                                                                                                                                                                                                                              |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Jendela tanpa aktivitas setelah Codex menerima satu giliran atau setelah permintaan app-server yang dibatasi giliran saat OpenClaw menunggu `turn/completed`.                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Penjaga idle-penyelesaian dan progres yang digunakan setelah serah terima alat, penyelesaian alat bawaan, progres asisten mentah pasca-alat, penyelesaian penalaran mentah, atau progres penalaran saat OpenClaw menunggu `turn/completed`. Gunakan ini untuk beban kerja tepercaya atau berat ketika sintesis pasca-alat secara sah dapat tetap hening lebih lama daripada anggaran rilis asisten final. |
| `mode`                                        | `"yolo"` kecuali persyaratan Codex lokal melarang YOLO | Preset untuk eksekusi YOLO atau yang ditinjau guardian. Persyaratan stdio lokal yang menghilangkan approval `danger-full-access`, `never`, atau peninjau `user` membuat bawaan implisit menjadi guardian.                                                                                                                                                                                        |
| `approvalPolicy`                              | `"never"` atau kebijakan approval guardian yang diizinkan | Kebijakan approval Codex native yang dikirim ke thread start/resume/turn. Bawaan guardian lebih memilih `"on-request"` ketika diizinkan.                                                                                                                                                                                                                                                         |
| `sandbox`                                     | `"danger-full-access"` atau sandbox guardian yang diizinkan | Mode sandbox Codex native yang dikirim ke thread start/resume. Bawaan guardian lebih memilih `"workspace-write"` ketika diizinkan, jika tidak `"read-only"`. Saat sandbox OpenClaw aktif, giliran `danger-full-access` menggunakan Codex `workspace-write` dengan akses jaringan yang diturunkan dari pengaturan egress sandbox OpenClaw.                                                            |
| `approvalsReviewer`                           | `"user"` atau peninjau guardian yang diizinkan         | Gunakan `"auto_review"` untuk membiarkan Codex meninjau prompt approval native ketika diizinkan, jika tidak `guardian_subagent` atau `user`. `guardian_subagent` tetap menjadi alias legacy.                                                                                                                                                                                                     |
| `serviceTier`                                 | tidak diatur                                           | Tingkat layanan app-server Codex opsional. `"priority"` mengaktifkan routing mode cepat, `"flex"` meminta pemrosesan flex, `null` menghapus penimpaan, dan `"fast"` legacy diterima sebagai `"priority"`.                                                                                                                                                                                        |
| `networkProxy`                                | dinonaktifkan                                          | Ikut serta dalam jaringan profil izin Codex untuk perintah app-server. OpenClaw mendefinisikan config `permissions.<profile>.network` yang dipilih dan memilihnya dengan `default_permissions`, bukan mengirim `sandbox`.                                                                                                                                                                       |
| `experimental.sandboxExecServer`              | `false`                                                | Opt-in pratinjau yang mendaftarkan lingkungan Codex yang didukung sandbox OpenClaw dengan app-server Codex 0.132.0 atau yang lebih baru sehingga eksekusi Codex native dapat berjalan di dalam sandbox OpenClaw yang aktif.                                                                                                                                                                      |

`appServer.networkProxy` bersifat eksplisit karena mengubah kontrak sandbox
Codex. Saat diaktifkan, OpenClaw juga mengatur `features.network_proxy.enabled` dan
`default_permissions` dalam config thread Codex sehingga profil izin yang
dihasilkan dapat memulai jaringan terkelola Codex. Secara bawaan, OpenClaw menghasilkan
nama profil `openclaw-network-<fingerprint>` yang tahan tabrakan dari isi
profil; gunakan `profileName` hanya ketika nama lokal yang stabil diperlukan.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Jika runtime app-server normal adalah `danger-full-access`, mengaktifkan
`networkProxy` menggunakan akses sistem berkas bergaya workspace untuk profil
izin yang dihasilkan. Penegakan jaringan terkelola Codex adalah jaringan yang
di-sandbox, sehingga profil akses penuh tidak akan melindungi lalu lintas keluar.
Entri domain menggunakan `allow` atau `deny`; entri soket Unix menggunakan nilai
`allow` atau `none` milik Codex.

Panggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: permintaan Codex `item/tool/call` menggunakan
watchdog OpenClaw 90 detik secara default. Argumen `timeoutMs` positif per
panggilan memperpanjang atau mempersingkat anggaran alat khusus tersebut. Alat
`image_generate` menggunakan `agents.defaults.imageGenerationModel.timeoutMs`
ketika panggilan alat tidak menyediakan timeout sendiri, atau default pembuatan
gambar 120 detik jika tidak. Alat `image` untuk pemahaman media menggunakan
`tools.media.image.timeoutSeconds` atau default medianya 60 detik. Untuk
pemahaman gambar, timeout tersebut berlaku pada permintaan itu sendiri dan tidak
dikurangi oleh pekerjaan persiapan sebelumnya. Anggaran alat dinamis dibatasi
hingga 600000 ms. Saat timeout, OpenClaw membatalkan sinyal alat jika didukung
dan mengembalikan respons alat-dinamis yang gagal ke Codex agar giliran dapat
berlanjut alih-alih membiarkan sesi tetap dalam `processing`.
Watchdog ini adalah anggaran luar `item/tool/call` dinamis; timeout permintaan
khusus penyedia berjalan di dalam panggilan tersebut dan mempertahankan semantik
timeout-nya sendiri.

Setelah Codex menerima sebuah giliran, dan setelah OpenClaw merespons
permintaan app-server yang tercakup pada giliran, harness mengharapkan Codex
membuat progres pada giliran saat ini dan pada akhirnya menyelesaikan giliran
native dengan `turn/completed`. Jika app-server diam selama
`appServer.turnCompletionIdleTimeoutMs`, OpenClaw berupaya sebaik mungkin untuk
menginterupsi giliran Codex, mencatat timeout diagnostik, dan melepaskan jalur
sesi OpenClaw agar pesan chat lanjutan tidak mengantre di belakang giliran
native yang sudah usang. Sebagian besar notifikasi non-terminal untuk giliran
yang sama menonaktifkan watchdog singkat itu karena Codex telah membuktikan
bahwa giliran masih hidup. Serah terima alat menggunakan anggaran idle pasca-alat
yang lebih panjang: setelah OpenClaw mengembalikan respons `item/tool/call`,
setelah item alat native seperti `commandExecution` selesai, setelah penyelesaian
mentah `custom_tool_call_output`, dan setelah progres asisten mentah pasca-alat,
penyelesaian penalaran mentah, atau progres penalaran. Guard menggunakan
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` jika dikonfigurasi dan
secara default menggunakan lima menit jika tidak. Anggaran pasca-alat yang sama
juga memperpanjang watchdog progres untuk jendela sintesis senyap sebelum Codex
memancarkan event giliran saat ini berikutnya. Notifikasi app-server global,
seperti pembaruan batas laju, tidak mereset progres idle giliran. Penyelesaian
penalaran, penyelesaian `agentMessage` commentary, dan progres penalaran mentah
atau asisten mentah pra-alat dapat diikuti oleh balasan final otomatis, sehingga
semuanya menggunakan guard balasan pasca-progres alih-alih segera melepaskan
jalur sesi. Hanya item `agentMessage` selesai final/non-commentary dan
penyelesaian asisten mentah pra-alat yang mengaktifkan pelepasan output asisten:
jika Codex kemudian diam tanpa `turn/completed`, OpenClaw berupaya sebaik
mungkin untuk menginterupsi giliran native dan melepaskan jalur sesi. Jika
watch giliran lain memenangkan perlombaan pelepasan itu, OpenClaw tetap menerima
item asisten final yang selesai setelah tidak ada permintaan native, item, atau
penyelesaian alat dinamis yang masih aktif dan pelepasan output asisten masih
milik item selesai terbaru, tanpa penyelesaian item berikutnya. Ini dapat
mempertahankan jawaban final setelah pekerjaan alat selesai tanpa memutar ulang
giliran. Delta asisten parsial, balasan lama yang usang, dan penyelesaian
berikutnya yang kosong tidak memenuhi syarat. Kegagalan app-server stdio yang
aman untuk diputar ulang, termasuk timeout idle penyelesaian giliran tanpa bukti
asisten, alat, item aktif, atau efek samping, dicoba ulang sekali pada upaya
app-server baru. Timeout yang tidak aman tetap memensiunkan klien app-server
yang macet dan melepaskan jalur sesi OpenClaw. Timeout tersebut juga
membersihkan binding thread native yang usang alih-alih diputar ulang secara
otomatis. Timeout watch penyelesaian menampilkan teks timeout khusus Codex:
kasus yang aman untuk diputar ulang mengatakan respons mungkin tidak lengkap,
sedangkan kasus yang tidak aman memberi tahu pengguna untuk memverifikasi status
saat ini sebelum mencoba lagi. Diagnostik timeout publik mencakup field
struktural seperti metode notifikasi app-server terakhir, id/tipe/peran item
respons asisten mentah, jumlah permintaan/item aktif, dan status watch yang
aktif. Jika notifikasi terakhir adalah item respons asisten mentah, diagnostik
juga menyertakan pratinjau teks asisten yang dibatasi. Diagnostik tidak
menyertakan prompt mentah atau konten alat.

Override lingkungan tetap tersedia untuk pengujian lokal:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` melewati biner terkelola ketika
`appServer.command` tidak disetel.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` telah dihapus. Gunakan
`plugins.entries.codex.config.appServer.mode: "guardian"` sebagai gantinya, atau
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` untuk pengujian lokal sekali pakai.
Konfigurasi lebih disukai untuk deployment yang dapat diulang karena menjaga
perilaku plugin dalam file yang ditinjau sama dengan penyiapan harness Codex
lainnya.

## Plugin Codex native

Dukungan plugin Codex native menggunakan kapabilitas app dan plugin milik
Codex app-server sendiri dalam thread Codex yang sama dengan giliran harness
OpenClaw. OpenClaw tidak menerjemahkan plugin Codex menjadi alat dinamis OpenClaw
sintetis `codex_plugin_*`.

`codexPlugins` hanya memengaruhi sesi yang memilih harness Codex native. Ini
tidak berdampak pada run harness bawaan, run penyedia OpenAI normal, binding
percakapan ACP, atau harness lain.

Konfigurasi migrasi minimal:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Konfigurasi app thread dihitung ketika OpenClaw membuat sesi harness Codex atau
mengganti binding thread Codex yang usang. Konfigurasi ini tidak dihitung ulang
pada setiap giliran. Setelah mengubah `codexPlugins`, gunakan `/new`, `/reset`,
atau mulai ulang gateway agar sesi harness Codex berikutnya dimulai dengan set
app yang diperbarui.

Untuk kelayakan migrasi, inventaris app, kebijakan tindakan destruktif,
elisitasi, dan diagnostik plugin native, lihat
[Plugin Codex native](/id/plugins/codex-native-plugins).

Akses app dan plugin sisi OpenAI dikendalikan oleh akun Codex yang masuk dan,
untuk workspace Business dan Enterprise/Edu, kontrol app workspace. Lihat
[Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
untuk ringkasan akun dan kontrol workspace OpenAI.

## Computer Use

Computer Use dibahas dalam panduan penyiapannya sendiri:
[Codex Computer Use](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak mem-vendor app kontrol desktop atau menjalankan
tindakan desktop sendiri. OpenClaw menyiapkan Codex app-server, memverifikasi
bahwa server MCP `computer-use` tersedia, lalu membiarkan Codex memiliki
panggilan alat MCP native selama giliran mode Codex.

## Batas runtime

Harness Codex hanya mengubah executor agen tertanam tingkat rendah.

- Alat dinamis OpenClaw didukung. Codex meminta OpenClaw menjalankan alat
  tersebut, sehingga OpenClaw tetap berada dalam jalur eksekusi.
- Shell, patch, MCP, dan alat app native milik Codex dimiliki oleh Codex.
  OpenClaw dapat mengamati atau memblokir event native tertentu melalui relay
  yang didukung, tetapi tidak menulis ulang argumen alat native.
- Codex memiliki Compaction native. OpenClaw menyimpan cermin transkrip untuk
  riwayat channel, pencarian, `/new`, `/reset`, dan peralihan model atau harness
  di masa mendatang, tetapi tidak mengganti Compaction Codex dengan peringkas
  OpenClaw atau context-engine.
- Pembuatan media, pemahaman media, TTS, persetujuan, dan output alat pesan
  tetap melalui pengaturan penyedia/model OpenClaw yang sesuai.
- `tool_result_persist` berlaku untuk hasil alat transkrip milik OpenClaw, bukan
  catatan hasil alat native Codex.

Untuk lapisan hook, surface V1 yang didukung, penanganan izin native, pengarah
antrean, mekanik unggah umpan balik Codex, dan detail Compaction, lihat
[Runtime harness Codex](/id/plugins/codex-harness-runtime).

## Pemecahan masalah

**Codex tidak muncul sebagai penyedia `/model` normal:** ini memang diharapkan
untuk konfigurasi baru. Pilih model `openai/gpt-*`, aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow`
mengecualikan `codex`.

**OpenClaw menggunakan harness bawaan alih-alih Codex:** pastikan ref model adalah
`openai/gpt-*` pada penyedia OpenAI resmi dan plugin Codex terinstal serta
diaktifkan. Jika Anda membutuhkan bukti ketat saat menguji, setel provider atau
model `agentRuntime.id: "codex"`. Runtime Codex yang dipaksa akan gagal
alih-alih fallback ke OpenClaw.

**Runtime OpenAI Codex fallback ke jalur kunci API:** kumpulkan cuplikan
gateway yang telah disunting yang menunjukkan model, runtime, penyedia yang
dipilih, dan kegagalan. Minta kolaborator yang terdampak menjalankan perintah
hanya-baca ini pada host OpenClaw mereka:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Cuplikan yang berguna biasanya menyertakan `openai/gpt-5.5` atau
`openai/gpt-5.4`, `Runtime: OpenAI Codex`, `agentRuntime.id` atau
`harnessRuntime`, `candidateProvider: "openai"`, dan hasil `401`,
`Incorrect API key`, atau `No API key`. Run yang dikoreksi seharusnya
menunjukkan jalur OAuth OpenAI alih-alih kegagalan kunci API OpenAI biasa.

**Konfigurasi ref model Codex legacy masih ada:** jalankan `openclaw doctor --fix`.
Doctor menulis ulang ref model legacy ke `openai/*`, menghapus pin runtime sesi
dan seluruh agen yang usang, serta mempertahankan override profil autentikasi
yang ada.

**App-server ditolak:** gunakan Codex app-server `0.125.0` atau yang lebih baru.
Prerelease versi yang sama atau versi bersufiks build seperti `0.125.0-alpha.2`
atau `0.125.0+custom` ditolak karena OpenClaw menguji batas bawah protokol
stabil `0.125.0`.

**`/codex status` tidak dapat terhubung:** periksa bahwa plugin `codex` bawaan
diaktifkan, bahwa `plugins.allow` menyertakannya ketika allowlist dikonfigurasi,
dan bahwa `appServer.command`, `url`, `authToken`, atau header kustom apa pun
valid.

**Penemuan model lambat:** turunkan
`plugins.entries.codex.config.discovery.timeoutMs` atau nonaktifkan penemuan.
Lihat [Referensi harness Codex](/id/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
header, dan bahwa app-server jarak jauh berbicara dengan versi protokol
Codex app-server yang sama.

**Shell native atau alat patch diblokir dengan `Native hook relay unavailable`:**
thread Codex masih mencoba menggunakan id native hook relay yang tidak lagi
terdaftar di OpenClaw. Ini adalah masalah transport native Codex hook, bukan
kegagalan backend ACP, provider, GitHub, atau perintah shell. Mulai sesi baru di
chat yang terdampak dengan `/new` atau `/reset`, lalu coba lagi perintah yang tidak berbahaya. Jika itu
berhasil sekali tetapi pemanggilan alat native berikutnya gagal lagi, perlakukan `/new` hanya sebagai solusi sementara: salin prompt ke sesi baru setelah memulai ulang Codex
app-server atau OpenClaw Gateway agar thread lama dihapus dan pendaftaran native hook
dibuat ulang.

**Model non-Codex menggunakan harness bawaan:** itu memang diharapkan kecuali
kebijakan runtime provider atau model mengarahkannya ke harness lain. Ref provider
non-OpenAI biasa tetap berada di jalur provider normalnya dalam mode `auto`.

**Computer Use terpasang tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika alat melaporkan
`Native hook relay unavailable`, gunakan pemulihan native hook relay di atas. Lihat
[Codex Computer Use](/id/plugins/codex-computer-use#troubleshooting).

## Terkait

- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Plugin native Codex](/id/plugins/codex-native-plugins)
- [Codex Computer Use](/id/plugins/codex-computer-use)
- [Runtime agent](/id/concepts/agent-runtimes)
- [Provider model](/id/concepts/model-providers)
- [Provider OpenAI](/id/providers/openai)
- [Bantuan OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugin harness agent](/id/plugins/sdk-agent-harness)
- [Hook Plugin](/id/plugins/hooks)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Status](/id/cli/status)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
