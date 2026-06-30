---
read_when:
    - Anda ingin menggunakan harness app-server Codex bawaan
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin deployment khusus Codex gagal alih-alih beralih kembali ke OpenClaw
summary: Jalankan giliran agen tertanam OpenClaw melalui harness app-server Codex yang dibundel
title: Perangkat uji Codex
x-i18n:
    generated_at: "2026-06-30T14:28:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1569dca11b6d5a870c2dde58d04046df7829e70a5c59f34b25cf79b209c530e5
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen OpenAI tertanam
melalui Codex app-server alih-alih harness OpenClaw bawaan.

Gunakan harness Codex saat Anda ingin Codex memiliki sesi agen tingkat rendah:
resume thread native, kelanjutan tool native, Compaction native, dan
eksekusi app-server. OpenClaw tetap memiliki channel chat, file sesi, pemilihan
model, tool dinamis OpenClaw, persetujuan, pengiriman media, dan cermin
transkrip yang terlihat.

Penyiapan normal menggunakan ref model OpenAI kanonis seperti `openai/gpt-5.5`.
Jangan konfigurasi ref GPT Codex lama. Letakkan urutan auth agen OpenAI
di bawah `auth.order.openai`; id profil auth Codex lama yang lebih lama dan
entri urutan auth Codex lama adalah state lama yang diperbaiki oleh
`openclaw doctor --fix`.

Saat tidak ada sandbox OpenClaw yang aktif, OpenClaw memulai thread Codex app-server
dengan mode kode native Codex diaktifkan sambil membiarkan code-mode-only nonaktif secara default.
Ini menjaga workspace native Codex dan kemampuan kode tetap tersedia sementara
tool dinamis OpenClaw berlanjut melalui bridge `item/tool/call` app-server.
Sandboxing OpenClaw aktif dan kebijakan tool terbatas menonaktifkan mode kode native
sepenuhnya kecuali Anda memilih jalur eksperimental sandbox exec-server.

Fitur native Codex ini terpisah dari
[mode kode OpenClaw](/id/reference/code-mode), yaitu runtime QuickJS-WASI opsional
untuk run OpenClaw generik dengan bentuk input `exec` yang berbeda.

Untuk pemisahan model/provider/runtime yang lebih luas, mulai dengan
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya adalah:
`openai/gpt-5.5` adalah ref model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau channel lain tetap menjadi permukaan komunikasi.

## Persyaratan

- OpenClaw dengan Plugin `codex` bawaan tersedia.
- Jika config Anda menggunakan `plugins.allow`, sertakan `codex`.
- Codex app-server `0.125.0` atau yang lebih baru. Plugin bawaan mengelola biner
  Codex app-server yang kompatibel secara default, sehingga perintah `codex` lokal di `PATH` tidak
  memengaruhi startup harness normal.
- Auth Codex tersedia melalui `openclaw models auth login --provider openai`,
  akun app-server di home Codex agen, atau profil auth API-key Codex eksplisit.

Untuk presedensi auth, isolasi environment, perintah app-server kustom, discovery model,
dan semua field config, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference).

## Mulai cepat

Sebagian besar pengguna yang menginginkan Codex di OpenClaw menginginkan jalur ini: masuk dengan
langganan ChatGPT/Codex, aktifkan Plugin `codex` bawaan, dan gunakan ref model
`openai/gpt-*` kanonis.

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

Restart Gateway setelah mengubah config Plugin. Jika chat yang ada sudah
memiliki sesi, gunakan `/new` atau `/reset` sebelum menguji perubahan runtime agar giliran
berikutnya menyelesaikan harness dari config saat ini.

## Konfigurasi

Config mulai cepat adalah config harness Codex minimum yang layak. Atur opsi harness
Codex di config OpenClaw, dan gunakan CLI hanya untuk auth Codex:

| Kebutuhan                              | Atur                                                                             | Lokasi                             |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Aktifkan harness                       | `plugins.entries.codex.enabled: true`                                            | Config OpenClaw                    |
| Pertahankan instalasi Plugin allowlist | Sertakan `codex` di `plugins.allow`                                              | Config OpenClaw                    |
| Rutekan giliran agen OpenAI melalui Codex | `agents.defaults.model` atau `agents.list[].model` sebagai `openai/gpt-*`      | Config agen OpenClaw               |
| Masuk dengan OAuth ChatGPT/Codex       | `openclaw models auth login --provider openai`                                   | Profil auth CLI                    |
| Tambahkan cadangan API-key untuk run Codex | Profil API-key `openai:*` yang tercantum setelah auth langganan di `auth.order.openai` | Profil auth CLI + config OpenClaw |
| Gagal tertutup saat Codex tidak tersedia | Provider atau model `agentRuntime.id: "codex"`                                 | Config model/provider OpenClaw     |
| Gunakan traffic API OpenAI langsung    | Provider atau model `agentRuntime.id: "openclaw"` dengan auth OpenAI normal      | Config model/provider OpenClaw     |
| Sesuaikan perilaku app-server          | `plugins.entries.codex.config.appServer.*`                                       | Config Plugin Codex                |
| Aktifkan aplikasi Plugin Codex native  | `plugins.entries.codex.config.codexPlugins.*`                                    | Config Plugin Codex                |
| Aktifkan Codex Computer Use            | `plugins.entries.codex.config.computerUse.*`                                     | Config Plugin Codex                |

Gunakan ref model `openai/gpt-*` untuk giliran agen OpenAI yang didukung Codex. Utamakan
`auth.order.openai` untuk urutan langganan-terlebih-dahulu/cadangan-API-key. Id profil
auth Codex lama yang ada dan urutan auth Codex lama adalah state lama khusus doctor;
jangan tulis ref GPT Codex lama yang baru.

Jangan atur `compaction.model` atau `compaction.provider` pada agen yang didukung Codex.
Codex melakukan compaction melalui state thread app-server native-nya, sehingga OpenClaw mengabaikan
override peringkas lokal tersebut saat runtime dan `openclaw doctor --fix` menghapusnya
saat agen menggunakan Codex.

Lossless tetap didukung sebagai engine konteks untuk perakitan, ingest, dan
pemeliharaan di sekitar giliran Codex. Konfigurasikan melalui
`plugins.slots.contextEngine: "lossless-claw"` dan
`plugins.entries.lossless-claw.config.summaryModel`, bukan melalui
`agents.defaults.compaction.provider`. `openclaw doctor --fix` memigrasikan bentuk lama
`compaction.provider: "lossless-claw"` ke slot engine konteks Lossless
saat Codex adalah runtime aktif, tetapi Codex native tetap memiliki Compaction.

Harness Codex app-server native mendukung engine konteks yang memerlukan
perakitan pra-prompt. Backend CLI generik, termasuk `codex-cli`, tidak menyediakan
kemampuan host tersebut.

Untuk agen yang didukung Codex, `/compact` memulai compaction Codex app-server native pada
thread terikat. OpenClaw tidak menunggu penyelesaian, memberlakukan timeout OpenClaw,
memulai ulang app-server bersama, atau fallback ke engine konteks atau
peringkas OpenAI publik. Jika binding thread Codex native hilang atau
usang, perintah gagal tertutup sehingga operator melihat batas runtime yang sebenarnya
alih-alih diam-diam berpindah backend Compaction.

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
isolasi environment, timeout, dan field transport app-server, lihat
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

`/codex status` melaporkan konektivitas app-server, akun, batas laju, server
MCP, dan Skills. `/codex models` mencantumkan katalog Codex app-server live untuk
harness dan akun. Jika `/status` mengejutkan, lihat
[Pemecahan masalah](#troubleshooting).

## Routing dan pemilihan model

Pisahkan ref provider dan kebijakan runtime:

- Gunakan `openai/gpt-*` untuk giliran agen OpenAI melalui Codex.
- Jangan gunakan ref GPT Codex lama di config. Jalankan `openclaw doctor --fix` untuk
  memperbaiki ref lama dan pin rute sesi usang.
- `agentRuntime.id: "codex"` opsional untuk mode otomatis OpenAI normal, tetapi berguna
  saat deployment harus gagal tertutup jika Codex tidak tersedia.
- `agentRuntime.id: "openclaw"` mengikutsertakan provider atau model ke runtime
  tertanam OpenClaw saat itu disengaja.
- `/codex ...` mengontrol percakapan Codex app-server native dari chat.
- ACP/acpx adalah jalur harness eksternal terpisah. Gunakan hanya saat pengguna meminta
  ACP/acpx atau adapter harness eksternal.

Routing perintah umum:

| Maksud pengguna                                        | Gunakan                                                                                               |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Lampirkan chat saat ini                               | `/codex bind [--cwd <path>]`                                                                          |
| Resume thread Codex yang ada                          | `/codex resume <thread-id>`                                                                           |
| Cantumkan atau filter thread Codex                    | `/codex threads [filter]`                                                                             |
| Cantumkan Plugin Codex native                         | `/codex plugins list`                                                                                 |
| Aktifkan atau nonaktifkan Plugin Codex native yang dikonfigurasi | `/codex plugins enable <name>`, `/codex plugins disable <name>`                              |
| Lampirkan sesi Codex CLI yang ada pada node yang dipasangkan | `/codex sessions --host <node> [filter]`, lalu `/codex resume <session-id> --host <node> --bind here` |
| Kirim hanya umpan balik Codex                         | `/codex diagnostics [note]`                                                                           |
| Mulai task ACP/acpx                                   | Perintah sesi ACP/acpx, bukan `/codex`                                                                |

| Kasus penggunaan                                     | Konfigurasi                                                            | Verifikasi                              | Catatan                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Langganan ChatGPT/Codex dengan runtime Codex native  | `openai/gpt-*` plus Plugin `codex` yang diaktifkan                     | `/status` menampilkan `Runtime: OpenAI Codex` | Jalur yang direkomendasikan           |
| Gagal tertutup jika Codex tidak tersedia             | Provider atau model `agentRuntime.id: "codex"`                         | Turn gagal, bukan fallback tertanam     | Gunakan untuk deployment khusus Codex |
| Traffic kunci API OpenAI langsung melalui OpenClaw   | Provider atau model `agentRuntime.id: "openclaw"` dan auth OpenAI normal | `/status` menampilkan runtime OpenClaw  | Gunakan hanya saat OpenClaw disengaja |
| Config legacy                                        | ref GPT Codex legacy                                                   | `openclaw doctor --fix` menulis ulangnya | Jangan tulis config baru dengan cara ini |
| Adapter Codex ACP/acpx                               | ACP `sessions_spawn({ runtime: "acp" })`                               | Status tugas/sesi ACP                   | Terpisah dari harness Codex native    |

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan `openai/gpt-*`
untuk rute OpenAI normal dan `codex/gpt-*` hanya ketika pemahaman gambar
harus berjalan melalui turn server aplikasi Codex yang dibatasi. Jangan gunakan
ref GPT Codex legacy; doctor menulis ulang prefiks legacy itu menjadi `openai/gpt-*`.

## Pola deployment

### Deployment Codex dasar

Gunakan config quickstart ketika semua turn agen OpenAI harus menggunakan Codex secara
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

Dengan config ini, agen `main` menggunakan jalur provider normalnya dan agen
`codex` menggunakan server aplikasi Codex.

### Deployment Codex gagal-tertutup

Untuk turn agen OpenAI, `openai/gpt-*` sudah diselesaikan ke Codex ketika
Plugin bawaan tersedia. Tambahkan kebijakan runtime eksplisit ketika Anda menginginkan aturan
gagal-tertutup tertulis:

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

Dengan Codex dipaksa, OpenClaw gagal lebih awal jika Plugin Codex dinonaktifkan,
server aplikasi terlalu lama, atau server aplikasi tidak dapat dimulai.

## Kebijakan server aplikasi

Secara default, Plugin memulai binary Codex terkelola OpenClaw secara lokal dengan transport
stdio. Tetapkan `appServer.command` hanya ketika Anda sengaja ingin menjalankan
executable yang berbeda. Gunakan transport WebSocket hanya ketika server aplikasi sudah
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

Sesi server aplikasi stdio lokal default ke postur operator lokal tepercaya:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Jika persyaratan Codex lokal melarang postur YOLO
implisit itu, OpenClaw memilih izin guardian yang diizinkan sebagai gantinya.
Ketika sandbox OpenClaw aktif untuk sesi, OpenClaw menonaktifkan Code Mode
native Codex, server MCP pengguna, dan eksekusi Plugin berbasis aplikasi untuk
turn itu alih-alih mengandalkan sandboxing sisi host Codex. Akses shell diekspos
melalui alat dinamis berbasis sandbox OpenClaw seperti `sandbox_exec` dan
`sandbox_process` ketika alat exec/process normal tersedia.

Gunakan mode exec OpenClaw yang dinormalisasi ketika Anda menginginkan auto-review native Codex sebelum
escape sandbox atau izin tambahan:

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

Untuk sesi server aplikasi Codex, OpenClaw memetakan `tools.exec.mode: "auto"` ke approval
yang ditinjau Guardian oleh Codex, biasanya
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, dan
`sandbox: "workspace-write"` ketika persyaratan lokal mengizinkan nilai-nilai itu.
Dalam `tools.exec.mode: "auto"`, OpenClaw tidak mempertahankan override Codex legacy yang tidak aman
`approvalPolicy: "never"` atau `sandbox: "danger-full-access"`; gunakan
`tools.exec.mode: "full"` untuk postur Codex tanpa approval yang disengaja. Preset
legacy `plugins.entries.codex.config.appServer.mode: "guardian"` masih
berfungsi, tetapi `tools.exec.mode: "auto"` adalah permukaan OpenClaw yang dinormalisasi.

Untuk perbandingan tingkat mode dengan approval exec host dan izin ACPX,
lihat [Mode izin](/id/tools/permission-modes).

Untuk setiap field server aplikasi, urutan auth, isolasi lingkungan, discovery, dan
perilaku timeout, lihat [Referensi harness Codex](/id/plugins/codex-harness-reference).

## Perintah dan diagnostik

Plugin bawaan mendaftarkan `/codex` sebagai perintah slash pada channel apa pun yang
mendukung perintah teks OpenClaw.

Eksekusi dan kontrol native memerlukan owner atau client Gateway `operator.admin`.
Ini mencakup binding atau melanjutkan thread, mengirim atau menghentikan turn,
mengubah model, fast-mode, atau status izin, melakukan compact atau review, dan
melepas binding. Pengirim terotorisasi lainnya mempertahankan perintah read-only untuk status,
bantuan, akun, model, thread, server MCP, skill, dan inspeksi binding.

Bentuk umum:

- `/codex status` memeriksa konektivitas server aplikasi, model, akun, batas rate,
  server MCP, dan skills.
- `/codex models` mencantumkan model server aplikasi Codex live.
- `/codex threads [filter]` mencantumkan thread server aplikasi Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke
  thread Codex yang sudah ada.
- `/codex compact` meminta server aplikasi Codex untuk melakukan compact pada thread terlampir.
- `/codex review` memulai review native Codex untuk thread terlampir.
- `/codex diagnostics [note]` meminta izin sebelum mengirim feedback Codex untuk
  thread terlampir.
- `/codex account` menampilkan status akun dan batas rate.
- `/codex mcp` mencantumkan status server MCP server aplikasi Codex.
- `/codex skills` mencantumkan skills server aplikasi Codex.

Untuk sebagian besar laporan dukungan, mulai dengan `/diagnostics [note]` di percakapan
tempat bug terjadi. Perintah ini membuat satu laporan diagnostik Gateway dan, untuk sesi
harness Codex, meminta approval untuk mengirim bundel feedback Codex yang relevan.
Lihat [Ekspor diagnostik](/id/gateway/diagnostics) untuk model privasi dan perilaku
chat grup.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan upload
feedback Codex untuk thread yang saat ini terlampir tanpa bundel diagnostik Gateway
lengkap.

### Inspeksi thread Codex secara lokal

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
   `auth.order.openai`. Jalankan `openclaw doctor --fix` untuk memigrasikan id profil auth Codex
   legacy yang lebih lama dan urutan auth Codex legacy.
2. Akun server aplikasi yang sudah ada di home Codex agen itu.
3. Khusus untuk peluncuran server aplikasi stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, ketika tidak ada akun server aplikasi dan auth OpenAI
   masih diperlukan.

Ketika OpenClaw melihat profil auth Codex bergaya langganan ChatGPT, OpenClaw menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses child Codex yang dibuat. Itu
menjaga kunci API tingkat Gateway tetap tersedia untuk embeddings atau model OpenAI langsung
tanpa membuat turn server aplikasi Codex native ditagihkan melalui API secara tidak sengaja.
Profil kunci API Codex eksplisit dan fallback env-key stdio lokal menggunakan login server aplikasi
alih-alih env proses child yang diwariskan. Koneksi server aplikasi WebSocket
tidak menerima fallback kunci API env Gateway; gunakan profil auth eksplisit atau
akun milik server aplikasi remote.
Ketika Plugin Codex native dikonfigurasi, OpenClaw menginstal atau menyegarkan Plugin tersebut
melalui server aplikasi yang terhubung sebelum mengekspos aplikasi milik Plugin ke
thread Codex. `app/list` tetap menjadi sumber kebenaran untuk id aplikasi,
aksesibilitas, dan metadata, tetapi OpenClaw memiliki keputusan pengaktifan per thread:
jika kebijakan mengizinkan aplikasi terdaftar yang dapat diakses, OpenClaw mengirim
`thread/start.config.apps[appId].enabled = true` bahkan ketika `app/list` saat ini
melaporkan aplikasi itu dinonaktifkan. Jalur ini tidak membuat instalasi aplikasi untuk
id yang tidak dikenal; OpenClaw hanya mengaktifkan Plugin marketplace dengan `plugin/install`
lalu menyegarkan inventaris.

Jika profil langganan mencapai batas penggunaan Codex, OpenClaw mencatat waktu reset
ketika Codex melaporkannya dan mencoba profil auth berurutan berikutnya untuk run Codex yang sama.
Ketika waktu reset berlalu, profil langganan kembali memenuhi syarat
tanpa mengubah model `openai/gpt-*` atau runtime Codex yang dipilih.

Untuk peluncuran server aplikasi stdio lokal, OpenClaw menetapkan `CODEX_HOME` ke direktori
per agen sehingga config Codex, file auth/akun, cache/data Plugin, dan status thread
native tidak membaca atau menulis `~/.codex` pribadi operator secara
default. OpenClaw mempertahankan `HOME` proses normal; subprocess yang dijalankan Codex
masih dapat menemukan config dan token user-home, dan Codex dapat menemukan entri bersama
`$HOME/.agents/skills` dan `$HOME/.agents/plugins/marketplace.json`.

Jika deployment memerlukan isolasi lingkungan tambahan, tambahkan variabel tersebut ke
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

`appServer.clearEnv` hanya memengaruhi proses child server aplikasi Codex yang dibuat.
OpenClaw menghapus `CODEX_HOME` dan `HOME` dari daftar ini selama normalisasi peluncuran lokal:
`CODEX_HOME` tetap per agen, dan `HOME` tetap diwariskan agar
subprocess dapat menggunakan status user-home normal.

Tool dinamis Codex secara default menggunakan pemuatan `searchable`. OpenClaw tidak mengekspos
tool dinamis yang menduplikasi operasi ruang kerja native Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process`, dan `update_plan`. Sebagian besar tool integrasi
OpenClaw lainnya seperti perpesanan, media, cron, browser, node,
gateway, dan `heartbeat_respond` tersedia melalui pencarian tool Codex di bawah
namespace `openclaw`, sehingga konteks model awal tetap lebih kecil. Pencarian web
menggunakan tool `web_search` ter-hosting milik Codex secara default saat pencarian diaktifkan dan tidak ada
penyedia terkelola yang dipilih. Pencarian ter-hosting native dan tool dinamis
`web_search` terkelola milik OpenClaw saling eksklusif sehingga pencarian terkelola tidak dapat melewati
pembatasan domain native. OpenClaw menggunakan tool terkelola saat pencarian ter-hosting
tidak tersedia, dinonaktifkan secara eksplisit, atau digantikan oleh penyedia terkelola yang dipilih.
OpenClaw menjaga ekstensi mandiri `web.run` milik Codex tetap dinonaktifkan karena
lalu lintas app-server produksi menolak namespace `web` yang ditentukan pengguna.
`tools.web.search.enabled: false` menonaktifkan kedua jalur, begitu juga eksekusi khusus LLM
dengan tool dinonaktifkan. Codex memperlakukan `"cached"` sebagai preferensi dan menyelesaikannya menjadi akses
eksternal langsung untuk giliran app-server tanpa pembatasan. Fallback terkelola otomatis
gagal secara tertutup saat `allowedDomains` native ditetapkan sehingga allowlist tidak dapat
dilewati. Perubahan kebijakan pencarian efektif yang persisten memutar thread Codex
terikat sebelum giliran berikutnya. Pembatasan sementara per giliran menggunakan thread
terbatas sementara dan mempertahankan binding yang ada untuk resume nanti.
`sessions_yield` dan balasan sumber khusus tool pesan tetap langsung karena
itu adalah kontrak kontrol giliran. `sessions_spawn` tetap searchable sehingga
`spawn_agent` native milik Codex tetap menjadi permukaan subagen Codex utama, sementara delegasi
OpenClaw atau ACP eksplisit tetap tersedia melalui namespace tool dinamis
`openclaw`. Instruksi kolaborasi Heartbeat memberi tahu Codex untuk mencari
`heartbeat_respond` sebelum mengakhiri giliran heartbeat saat tool belum
dimuat.

Tetapkan `codexDynamicToolsLoading: "direct"` hanya saat menghubungkan ke app-server Codex
khusus yang tidak dapat mencari tool dinamis tertunda atau saat men-debug payload
tool lengkap.

Field Plugin Codex tingkat atas yang didukung:

| Field                      | Default        | Arti                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Gunakan `"direct"` untuk menempatkan tool dinamis OpenClaw langsung di konteks tool Codex awal. |
| `codexDynamicToolsExclude` | `[]`           | Nama tool dinamis OpenClaw tambahan yang akan dihilangkan dari giliran app-server Codex. |
| `codexPlugins`             | dinonaktifkan  | Dukungan plugin/app Codex native untuk plugin kurasi yang dimigrasikan dan diinstal dari sumber. |

Field `appServer` yang didukung:

| Bidang                                        | Bawaan                                                | Arti                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                                                                                                                                                                                  |
| `command`                                     | biner Codex terkelola                                  | Executable untuk transport stdio. Biarkan tidak disetel untuk menggunakan biner terkelola; setel hanya untuk override eksplisit.                                                                                                                                                                                                                                                                |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumen untuk transport stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | tidak disetel                                          | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | tidak disetel                                          | Token Bearer untuk transport WebSocket. Menerima string literal atau SecretInput seperti `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                           |
| `headers`                                     | `{}`                                                   | Header WebSocket tambahan. Nilai header menerima string literal atau nilai SecretInput, misalnya `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya. OpenClaw mempertahankan `CODEX_HOME` per agen dan `HOME` yang diwariskan untuk peluncuran lokal.                                                                                                                                                 |
| `codeModeOnly`                                | `false`                                                | Memilih menggunakan permukaan alat khusus mode kode Codex. Alat dinamis OpenClaw tetap terdaftar dengan Codex sehingga panggilan `tools.*` bersarang dikembalikan melalui bridge `item/tool/call` app-server.                                                                                                                                                                                    |
| `remoteWorkspaceRoot`                         | tidak disetel                                          | Root workspace app-server Codex jarak jauh. Saat disetel, OpenClaw menyimpulkan root workspace lokal dari workspace OpenClaw yang terselesaikan, mempertahankan suffix cwd saat ini di bawah root jarak jauh ini, dan hanya mengirim cwd app-server akhir ke Codex. Jika cwd berada di luar root workspace OpenClaw yang terselesaikan, OpenClaw gagal tertutup alih-alih mengirim path gateway-lokal ke app-server jarak jauh. |
| `requestTimeoutMs`                            | `60000`                                                | Timeout untuk panggilan control-plane app-server.                                                                                                                                                                                                                                                                                                                                               |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Jendela senyap setelah Codex menerima satu turn atau setelah permintaan app-server dalam cakupan turn saat OpenClaw menunggu `turn/completed`.                                                                                                                                                                                                                                                   |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Penjaga completion-idle dan progres yang digunakan setelah handoff alat, penyelesaian alat native, progres asisten mentah pasca-alat, penyelesaian reasoning mentah, atau progres reasoning saat OpenClaw menunggu `turn/completed`. Gunakan ini untuk workload tepercaya atau berat ketika sintesis pasca-alat secara sah dapat tetap senyap lebih lama daripada anggaran rilis asisten akhir. |
| `mode`                                        | `"yolo"` kecuali persyaratan Codex lokal melarang YOLO | Preset untuk eksekusi YOLO atau yang ditinjau guardian. Persyaratan stdio lokal yang menghilangkan `danger-full-access`, persetujuan `never`, atau peninjau `user` membuat default implisit menjadi guardian.                                                                                                                                                                                    |
| `approvalPolicy`                              | `"never"` atau kebijakan persetujuan guardian yang diizinkan | Kebijakan persetujuan native Codex yang dikirim ke thread start/resume/turn. Default guardian lebih memilih `"on-request"` saat diizinkan.                                                                                                                                                                                                                                                       |
| `sandbox`                                     | `"danger-full-access"` atau sandbox guardian yang diizinkan | Mode sandbox native Codex yang dikirim ke thread start/resume. Default guardian lebih memilih `"workspace-write"` saat diizinkan, jika tidak `"read-only"`. Saat sandbox OpenClaw aktif, turn `danger-full-access` menggunakan Codex `workspace-write` dengan akses jaringan yang diturunkan dari pengaturan egress sandbox OpenClaw.                                                            |
| `approvalsReviewer`                           | `"user"` atau peninjau guardian yang diizinkan         | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native saat diizinkan, jika tidak `guardian_subagent` atau `user`. `guardian_subagent` tetap menjadi alias legacy.                                                                                                                                                                                                               |
| `serviceTier`                                 | tidak disetel                                          | Tingkat layanan app-server Codex opsional. `"priority"` mengaktifkan routing fast-mode, `"flex"` meminta pemrosesan flex, `null` menghapus override, dan legacy `"fast"` diterima sebagai `"priority"`.                                                                                                                                                                                          |
| `networkProxy`                                | dinonaktifkan                                          | Memilih menggunakan jaringan profil izin Codex untuk perintah app-server. OpenClaw mendefinisikan config `permissions.<profile>.network` yang dipilih dan memilihnya dengan `default_permissions` alih-alih mengirim `sandbox`.                                                                                                                                                                 |
| `experimental.sandboxExecServer`              | `false`                                                | Opt-in pratinjau yang mendaftarkan lingkungan Codex yang didukung sandbox OpenClaw dengan app-server Codex 0.132.0 atau yang lebih baru sehingga eksekusi native Codex dapat berjalan di dalam sandbox OpenClaw aktif.                                                                                                                                                                           |

`appServer.networkProxy` bersifat eksplisit karena mengubah kontrak sandbox
Codex. Saat diaktifkan, OpenClaw juga menyetel `features.network_proxy.enabled` dan
`default_permissions` dalam config thread Codex sehingga profil izin yang
dihasilkan dapat memulai jaringan terkelola Codex. Secara default, OpenClaw menghasilkan
nama profil `openclaw-network-<fingerprint>` yang tahan benturan dari
isi profil; gunakan `profileName` hanya ketika nama lokal yang stabil diperlukan.

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

Jika runtime app-server normal akan berupa `danger-full-access`, mengaktifkan
`networkProxy` menggunakan akses sistem file bergaya workspace untuk profil
izin yang dihasilkan. Penegakan jaringan terkelola Codex adalah jaringan tersandbox,
sehingga profil full-access tidak akan melindungi lalu lintas keluar.
Entri domain menggunakan `allow` atau `deny`; entri soket Unix menggunakan nilai
`allow` atau `none` milik Codex.

Panggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: permintaan Codex `item/tool/call` menggunakan watchdog
OpenClaw 90 detik secara default. Argumen `timeoutMs` per panggilan yang bernilai
positif memperpanjang atau mempersingkat anggaran alat spesifik tersebut. Alat
`image_generate` menggunakan `agents.defaults.imageGenerationModel.timeoutMs` ketika
panggilan alat tidak menyediakan timeout sendiri, atau default pembuatan gambar 120
detik jika tidak. Alat `image` untuk pemahaman media menggunakan
`tools.media.image.timeoutSeconds` atau default media 60 detiknya. Untuk pemahaman
gambar, timeout tersebut berlaku pada permintaan itu sendiri dan tidak dikurangi
oleh pekerjaan persiapan sebelumnya. Anggaran alat dinamis dibatasi hingga
600000 ms. Saat timeout, OpenClaw membatalkan sinyal alat jika didukung dan
mengembalikan respons alat dinamis yang gagal ke Codex agar giliran dapat berlanjut
alih-alih meninggalkan sesi dalam `processing`. Watchdog ini adalah anggaran
`item/tool/call` dinamis terluar; timeout permintaan khusus penyedia berjalan di
dalam panggilan tersebut dan mempertahankan semantik timeout masing-masing.

Setelah Codex menerima sebuah giliran, dan setelah OpenClaw merespons permintaan
server aplikasi yang tercakup pada giliran, harness mengharapkan Codex membuat
kemajuan giliran saat ini dan akhirnya menyelesaikan giliran native dengan
`turn/completed`. Jika server aplikasi diam selama
`appServer.turnCompletionIdleTimeoutMs`, OpenClaw berupaya sebaik mungkin untuk
menginterupsi giliran Codex, mencatat timeout diagnostik, dan melepaskan jalur sesi
OpenClaw agar pesan chat lanjutan tidak mengantre di belakang giliran native yang
stale. Sebagian besar notifikasi non-terminal untuk giliran yang sama menonaktifkan
watchdog singkat itu karena Codex telah membuktikan bahwa giliran tersebut masih
hidup. Handoff alat menggunakan anggaran idle pasca-alat yang lebih panjang: setelah
OpenClaw mengembalikan respons `item/tool/call`, setelah item alat native seperti
`commandExecution` selesai, setelah penyelesaian mentah `custom_tool_call_output`,
dan setelah kemajuan asisten mentah pasca-alat, penyelesaian reasoning mentah, atau
kemajuan reasoning. Guard menggunakan
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` saat dikonfigurasi dan
secara default lima menit jika tidak. Anggaran pasca-alat yang sama juga memperluas
watchdog kemajuan untuk jendela sintesis senyap sebelum Codex memancarkan event
giliran saat ini berikutnya. Notifikasi server aplikasi global, seperti pembaruan
batas laju, tidak mereset kemajuan idle giliran. Penyelesaian reasoning,
penyelesaian `agentMessage` commentary, dan kemajuan reasoning atau asisten mentah
pra-alat dapat diikuti oleh balasan akhir otomatis, sehingga semuanya menggunakan
guard balasan pasca-kemajuan alih-alih langsung melepaskan jalur sesi. Hanya item
`agentMessage` selesai yang final/non-commentary dan penyelesaian asisten mentah
pra-alat yang memasang pelepasan output asisten: jika Codex kemudian diam tanpa
`turn/completed`, OpenClaw berupaya sebaik mungkin untuk menginterupsi giliran
native dan melepaskan jalur sesi. Kegagalan server aplikasi stdio yang aman untuk
replay, termasuk timeout idle penyelesaian giliran tanpa bukti asisten, alat, item
aktif, atau efek samping, dicoba ulang satu kali pada percobaan server aplikasi
baru. Timeout yang tidak aman tetap memensiunkan klien server aplikasi yang macet
dan melepaskan jalur sesi OpenClaw. Timeout tersebut juga membersihkan binding
thread native yang stale alih-alih direplay secara otomatis. Timeout pemantauan
penyelesaian menampilkan teks timeout khusus Codex: kasus yang aman untuk replay
menyatakan bahwa respons mungkin tidak lengkap, sedangkan kasus yang tidak aman
memberi tahu pengguna untuk memverifikasi status saat ini sebelum mencoba lagi.
Diagnostik timeout publik mencakup bidang struktural seperti metode notifikasi
server aplikasi terakhir, id/jenis/peran item respons asisten mentah, jumlah
permintaan/item aktif, dan status pemantauan yang terpasang. Saat notifikasi
terakhir adalah item respons asisten mentah, diagnostik juga menyertakan pratinjau
teks asisten yang dibatasi. Diagnostik tidak menyertakan prompt mentah atau konten
alat.

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
Konfigurasi lebih disarankan untuk deployment yang dapat diulang karena menjaga
perilaku plugin di file yang sama yang ditinjau bersama sisa penyiapan harness
Codex.

## Plugin Codex native

Dukungan plugin Codex native menggunakan kemampuan aplikasi dan plugin milik
server aplikasi Codex sendiri di thread Codex yang sama dengan giliran harness
OpenClaw. OpenClaw tidak menerjemahkan plugin Codex menjadi alat dinamis OpenClaw
`codex_plugin_*` sintetis.

`codexPlugins` hanya memengaruhi sesi yang memilih harness Codex native. Ini tidak
berpengaruh pada eksekusi harness bawaan, eksekusi penyedia OpenAI normal, binding
percakapan ACP, atau harness lainnya.

Konfigurasi minimal yang dimigrasikan:

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

Konfigurasi aplikasi thread dihitung saat OpenClaw membuat sesi harness Codex
atau mengganti binding thread Codex yang stale. Ini tidak dihitung ulang pada
setiap giliran. Setelah mengubah `codexPlugins`, gunakan `/new`, `/reset`, atau
mulai ulang Gateway agar sesi harness Codex mendatang dimulai dengan set aplikasi
yang diperbarui.

Untuk kelayakan migrasi, inventaris aplikasi, kebijakan tindakan destruktif,
elisitasi, dan diagnostik plugin native, lihat
[Plugin Codex native](/id/plugins/codex-native-plugins).

Akses aplikasi dan plugin di sisi OpenAI dikendalikan oleh akun Codex yang sedang
masuk dan, untuk workspace Business dan Enterprise/Edu, kontrol aplikasi
workspace. Lihat
[Menggunakan Codex dengan paket ChatGPT Anda](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
untuk ringkasan akun dan kontrol workspace OpenAI.

## Computer Use

Computer Use dibahas dalam panduan penyiapannya sendiri:
[Codex Computer Use](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak mem-vendor aplikasi kontrol desktop atau
menjalankan tindakan desktop sendiri. OpenClaw menyiapkan server aplikasi Codex,
memverifikasi bahwa server MCP `computer-use` tersedia, lalu membiarkan Codex
memiliki panggilan alat MCP native selama giliran mode Codex.

## Batas runtime

Harness Codex hanya mengubah eksekutor agen tertanam tingkat rendah.

- Alat dinamis OpenClaw didukung. Codex meminta OpenClaw menjalankan alat-alat
  tersebut, sehingga OpenClaw tetap berada di jalur eksekusi.
- Alat shell, patch, MCP, dan aplikasi native Codex dimiliki oleh Codex.
  OpenClaw dapat mengamati atau memblokir event native tertentu melalui relay
  yang didukung, tetapi tidak menulis ulang argumen alat native.
- Codex memiliki compaction native. OpenClaw menyimpan cermin transkrip untuk
  riwayat channel, pencarian, `/new`, `/reset`, dan peralihan model atau harness
  di masa mendatang, tetapi tidak mengganti compaction Codex dengan peringkas
  OpenClaw atau mesin konteks.
- Pembuatan media, pemahaman media, TTS, approval, dan output alat messaging
  tetap melalui pengaturan penyedia/model OpenClaw yang sesuai.
- `tool_result_persist` berlaku untuk hasil alat transkrip milik OpenClaw, bukan
  catatan hasil alat native Codex.

Untuk lapisan hook, permukaan V1 yang didukung, penanganan izin native,
pengarahan antrean, mekanisme unggah feedback Codex, dan detail compaction, lihat
[Runtime harness Codex](/id/plugins/codex-harness-runtime).

## Pemecahan masalah

**Codex tidak muncul sebagai penyedia `/model` normal:** ini diharapkan untuk
konfigurasi baru. Pilih model `openai/gpt-*`, aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan harness bawaan alih-alih Codex:** pastikan ref model adalah
`openai/gpt-*` pada penyedia resmi OpenAI dan plugin Codex telah terpasang serta
diaktifkan. Jika Anda memerlukan bukti ketat saat pengujian, setel provider atau
model `agentRuntime.id: "codex"`. Runtime Codex yang dipaksa akan gagal alih-alih
fallback ke OpenClaw.

**Runtime OpenAI Codex fallback ke jalur kunci API:** kumpulkan cuplikan Gateway
yang telah disunting yang menunjukkan model, runtime, penyedia yang dipilih, dan
kegagalan. Minta kolaborator terdampak menjalankan perintah hanya-baca ini pada
host OpenClaw mereka:

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

Cuplikan yang berguna biasanya mencakup `openai/gpt-5.5` atau `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` atau `harnessRuntime`,
`candidateProvider: "openai"`, dan hasil `401`, `Incorrect API key`, atau
`No API key`. Eksekusi yang telah diperbaiki seharusnya menunjukkan jalur OAuth
OpenAI alih-alih kegagalan kunci API OpenAI biasa.

**Konfigurasi ref model Codex legacy masih ada:** jalankan `openclaw doctor --fix`.
Doctor menulis ulang ref model legacy ke `openai/*`, menghapus pin runtime sesi
dan seluruh agen yang stale, serta mempertahankan override profil auth yang ada.

**Server aplikasi ditolak:** gunakan server aplikasi Codex `0.125.0` atau lebih
baru. Prarilis versi yang sama atau versi dengan sufiks build seperti
`0.125.0-alpha.2` atau `0.125.0+custom` ditolak karena OpenClaw menguji batas
bawah protokol stabil `0.125.0`.

**`/codex status` tidak dapat terhubung:** periksa bahwa plugin `codex` bawaan
diaktifkan, bahwa `plugins.allow` menyertakannya saat allowlist dikonfigurasi,
dan bahwa `appServer.command`, `url`, `authToken`, atau header kustom apa pun
valid.

**Penemuan model lambat:** turunkan
`plugins.entries.codex.config.discovery.timeoutMs` atau nonaktifkan penemuan.
Lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
header, dan bahwa server aplikasi remote berbicara dengan versi protokol server
aplikasi Codex yang sama.

**Alat shell atau patch native diblokir dengan `Native hook relay unavailable`:**
thread Codex masih mencoba menggunakan id relay hook native yang tidak lagi
terdaftar di OpenClaw. Ini adalah masalah transport hook Codex native, bukan
kegagalan backend ACP, penyedia, GitHub, atau perintah shell. Mulai sesi baru di
chat terdampak dengan `/new` atau `/reset`, lalu coba ulang perintah yang tidak
berbahaya. Jika berhasil sekali tetapi panggilan alat native berikutnya gagal
lagi, perlakukan `/new` hanya sebagai solusi sementara: salin prompt ke sesi baru
setelah memulai ulang server aplikasi Codex atau OpenClaw Gateway agar thread
lama dibuang dan registrasi hook native dibuat ulang.

**Model non-Codex menggunakan harness bawaan:** ini diharapkan kecuali kebijakan
runtime penyedia atau model mengarahkannya ke harness lain. Ref penyedia non-OpenAI
biasa tetap berada pada jalur penyedia normalnya dalam mode `auto`.

**Computer Use terinstal tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika sebuah alat melaporkan
`Native hook relay unavailable`, gunakan pemulihan native hook relay di atas. Lihat
[Codex Computer Use](/id/plugins/codex-computer-use#troubleshooting).

## Terkait

- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Codex Computer Use](/id/plugins/codex-computer-use)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Penyedia model](/id/concepts/model-providers)
- [Penyedia OpenAI](/id/providers/openai)
- [Bantuan OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Hook Plugin](/id/plugins/hooks)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Status](/id/cli/status)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
