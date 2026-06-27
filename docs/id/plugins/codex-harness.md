---
read_when:
    - Anda ingin menggunakan harness server aplikasi Codex bawaan
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin penerapan khusus Codex gagal alih-alih beralih kembali ke OpenClaw
summary: Jalankan putaran agen tertanam OpenClaw melalui harness app-server Codex bawaan
title: Harness Codex
x-i18n:
    generated_at: "2026-06-27T17:46:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfa04f53d01aad16dd6ea499ea1c04b1050c80ed12326db6fb4fa88c9c40a68c
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen OpenAI
tertanam melalui Codex app-server alih-alih harness OpenClaw bawaan.

Gunakan harness Codex saat Anda ingin Codex memiliki sesi agen tingkat rendah:
melanjutkan thread native, kelanjutan tool native, compaction native, dan
eksekusi app-server. OpenClaw tetap memiliki channel chat, file sesi, pemilihan
model, tool dinamis OpenClaw, persetujuan, pengiriman media, dan cermin
transkrip yang terlihat.

Penyiapan normal menggunakan referensi model OpenAI kanonis seperti
`openai/gpt-5.5`. Jangan konfigurasikan referensi GPT Codex lama. Letakkan urutan
auth agen OpenAI di bawah `auth.order.openai`; id profil auth Codex lama yang
lebih lama dan entri urutan auth Codex lama adalah state lama yang diperbaiki
oleh `openclaw doctor --fix`.

Saat tidak ada sandbox OpenClaw yang aktif, OpenClaw memulai thread Codex
app-server dengan mode kode native Codex diaktifkan sambil membiarkan
code-mode-only nonaktif secara default. Itu membuat workspace native Codex dan
kapabilitas kode tetap tersedia sementara tool dinamis OpenClaw tetap berjalan
melalui bridge `item/tool/call` app-server. Sandboxing OpenClaw aktif dan
kebijakan tool terbatas menonaktifkan mode kode native sepenuhnya kecuali Anda
ikut memakai jalur sandbox exec-server eksperimental.

Fitur native Codex ini terpisah dari
[mode kode OpenClaw](/id/reference/code-mode), yaitu runtime QuickJS-WASI opsional
untuk run OpenClaw generik dengan bentuk input `exec` yang berbeda.

Untuk pemisahan model/provider/runtime yang lebih luas, mulai dengan
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya:
`openai/gpt-5.5` adalah referensi model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau channel lain tetap menjadi permukaan komunikasi.

## Persyaratan

- OpenClaw dengan plugin `codex` bawaan tersedia.
- Jika konfigurasi Anda menggunakan `plugins.allow`, sertakan `codex`.
- Codex app-server `0.125.0` atau yang lebih baru. Plugin bawaan mengelola biner
  Codex app-server yang kompatibel secara default, jadi perintah `codex` lokal
  di `PATH` tidak memengaruhi startup harness normal.
- Auth Codex tersedia melalui `openclaw models auth login --provider openai`,
  akun app-server di home Codex agen, atau profil auth API key Codex eksplisit.

Untuk prioritas auth, isolasi lingkungan, perintah app-server kustom, penemuan
model, dan semua field konfigurasi, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference).

## Mulai cepat

Sebagian besar pengguna yang menginginkan Codex di OpenClaw menginginkan jalur
ini: masuk dengan langganan ChatGPT/Codex, aktifkan plugin `codex` bawaan, dan
gunakan referensi model `openai/gpt-*` kanonis.

Masuk dengan Codex OAuth:

```bash
openclaw models auth login --provider openai
```

Aktifkan plugin `codex` bawaan dan pilih model agen OpenAI:

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

Jika konfigurasi Anda menggunakan `plugins.allow`, tambahkan `codex` di sana
juga:

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

Mulai ulang gateway setelah mengubah konfigurasi plugin. Jika chat yang sudah
ada sudah memiliki sesi, gunakan `/new` atau `/reset` sebelum menguji perubahan
runtime agar giliran berikutnya menyelesaikan harness dari konfigurasi saat ini.

## Konfigurasi

Konfigurasi mulai cepat adalah konfigurasi harness Codex minimum yang layak.
Atur opsi harness Codex di konfigurasi OpenClaw, dan gunakan CLI hanya untuk
auth Codex:

| Kebutuhan                              | Atur                                                                             | Lokasi                             |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Aktifkan harness                       | `plugins.entries.codex.enabled: true`                                            | Konfigurasi OpenClaw               |
| Pertahankan instalasi plugin yang diizinkan | Sertakan `codex` di `plugins.allow`                                         | Konfigurasi OpenClaw               |
| Rutekan giliran agen OpenAI melalui Codex | `agents.defaults.model` atau `agents.list[].model` sebagai `openai/gpt-*`     | Konfigurasi agen OpenClaw          |
| Masuk dengan ChatGPT/Codex OAuth       | `openclaw models auth login --provider openai`                                   | Profil auth CLI                    |
| Tambahkan cadangan API key untuk run Codex | Profil API key `openai:*` dicantumkan setelah auth langganan di `auth.order.openai` | Profil auth CLI + konfigurasi OpenClaw |
| Gagal tertutup saat Codex tidak tersedia | `agentRuntime.id: "codex"` provider atau model                                  | Konfigurasi model/provider OpenClaw |
| Gunakan traffic API OpenAI langsung    | `agentRuntime.id: "openclaw"` provider atau model dengan auth OpenAI normal      | Konfigurasi model/provider OpenClaw |
| Sesuaikan perilaku app-server          | `plugins.entries.codex.config.appServer.*`                                       | Konfigurasi plugin Codex           |
| Aktifkan app plugin native Codex       | `plugins.entries.codex.config.codexPlugins.*`                                    | Konfigurasi plugin Codex           |
| Aktifkan Codex Computer Use            | `plugins.entries.codex.config.computerUse.*`                                     | Konfigurasi plugin Codex           |

Gunakan referensi model `openai/gpt-*` untuk giliran agen OpenAI yang didukung
Codex. Utamakan `auth.order.openai` untuk pengurutan langganan-pertama/cadangan-
API-key. Id profil auth Codex lama yang sudah ada dan urutan auth Codex lama
adalah state lama khusus doctor; jangan tulis referensi GPT Codex lama yang baru.

Jangan atur `compaction.model` atau `compaction.provider` pada agen yang
didukung Codex. Codex memadatkan melalui state thread app-server native-nya,
jadi OpenClaw mengabaikan override peringkas lokal tersebut saat runtime dan
`openclaw doctor --fix` menghapusnya saat agen menggunakan Codex.

Lossless tetap didukung sebagai mesin konteks untuk assembly, ingestion, dan
pemeliharaan di sekitar giliran Codex. Konfigurasikan melalui
`plugins.slots.contextEngine: "lossless-claw"` dan
`plugins.entries.lossless-claw.config.summaryModel`, bukan melalui
`agents.defaults.compaction.provider`. `openclaw doctor --fix` memigrasikan
bentuk lama `compaction.provider: "lossless-claw"` ke slot mesin konteks
Lossless saat Codex adalah runtime aktif, tetapi Codex native tetap memiliki
compaction.

Harness native Codex app-server mendukung mesin konteks yang memerlukan assembly
pra-prompt. Backend CLI generik, termasuk `codex-cli`, tidak menyediakan
kapabilitas host tersebut.

Untuk agen yang didukung Codex, `/compact` memulai compaction native Codex
app-server pada thread yang terikat. OpenClaw tidak menunggu penyelesaian,
memberlakukan timeout OpenClaw, memulai ulang app-server bersama, atau kembali
ke mesin konteks atau peringkas OpenAI publik. Jika binding thread native Codex
hilang atau stale, perintah gagal tertutup agar operator melihat batas runtime
sebenarnya alih-alih diam-diam beralih backend compaction.

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
`openai/gpt-*`. API key hanya fallback auth, bukan permintaan untuk beralih ke
OpenClaw atau OpenAI Responses biasa.

Sisa halaman ini membahas varian umum yang harus dipilih pengguna: bentuk
deployment, routing gagal-tertutup, kebijakan persetujuan guardian, plugin
native Codex, dan Computer Use. Untuk daftar opsi lengkap, default, enum,
penemuan, isolasi lingkungan, timeout, dan field transport app-server, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference).

## Verifikasi runtime Codex

Gunakan `/status` di chat tempat Anda mengharapkan Codex. Giliran agen OpenAI
yang didukung Codex menampilkan:

```text
Runtime: OpenAI Codex
```

Lalu periksa state Codex app-server:

```text
/codex status
/codex models
```

`/codex status` melaporkan konektivitas app-server, akun, batas rate, server
MCP, dan Skills. `/codex models` mencantumkan katalog Codex app-server langsung
untuk harness dan akun. Jika `/status` mengejutkan, lihat
[Pemecahan masalah](#troubleshooting).

## Routing dan pemilihan model

Pisahkan referensi provider dan kebijakan runtime:

- Gunakan `openai/gpt-*` untuk giliran agen OpenAI melalui Codex.
- Jangan gunakan referensi GPT Codex lama di konfigurasi. Jalankan
  `openclaw doctor --fix` untuk memperbaiki referensi lama dan pin rute sesi
  stale.
- `agentRuntime.id: "codex"` bersifat opsional untuk mode otomatis OpenAI
  normal, tetapi berguna saat deployment harus gagal tertutup jika Codex tidak
  tersedia.
- `agentRuntime.id: "openclaw"` mengarahkan provider atau model ke runtime
  tertanam OpenClaw saat itu disengaja.
- `/codex ...` mengontrol percakapan native Codex app-server dari chat.
- ACP/acpx adalah jalur harness eksternal terpisah. Gunakan hanya saat pengguna
  meminta ACP/acpx atau adapter harness eksternal.

Routing perintah umum:

| Niat pengguna                                         | Gunakan                                                                                               |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Lampirkan chat saat ini                               | `/codex bind [--cwd <path>]`                                                                          |
| Lanjutkan thread Codex yang sudah ada                 | `/codex resume <thread-id>`                                                                           |
| Cantumkan atau filter thread Codex                    | `/codex threads [filter]`                                                                             |
| Cantumkan plugin native Codex                         | `/codex plugins list`                                                                                 |
| Aktifkan atau nonaktifkan plugin native Codex yang dikonfigurasi | `/codex plugins enable <name>`, `/codex plugins disable <name>`                              |
| Lampirkan sesi Codex CLI yang sudah ada pada node yang dipasangkan | `/codex sessions --host <node> [filter]`, lalu `/codex resume <session-id> --host <node> --bind here` |
| Kirim hanya umpan balik Codex                         | `/codex diagnostics [note]`                                                                           |
| Mulai tugas ACP/acpx                                  | Perintah sesi ACP/acpx, bukan `/codex`                                                                |

| Kasus penggunaan                                     | Konfigurasi                                                            | Verifikasi                              | Catatan                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Langganan ChatGPT/Codex dengan runtime Codex native  | `openai/gpt-*` plus Plugin `codex` yang diaktifkan                     | `/status` menampilkan `Runtime: OpenAI Codex` | Jalur yang direkomendasikan           |
| Gagal secara tertutup jika Codex tidak tersedia      | Provider atau model `agentRuntime.id: "codex"`                         | Giliran gagal alih-alih fallback tertanam | Gunakan untuk deployment khusus Codex |
| Traffic kunci API OpenAI langsung melalui OpenClaw   | Provider atau model `agentRuntime.id: "openclaw"` dan auth OpenAI normal | `/status` menampilkan runtime OpenClaw  | Gunakan hanya jika OpenClaw memang dimaksudkan |
| Konfigurasi legacy                                   | ref GPT Codex legacy                                                   | `openclaw doctor --fix` menulis ulangnya | Jangan tulis konfigurasi baru dengan cara ini |
| Adapter Codex ACP/acpx                               | ACP `sessions_spawn({ runtime: "acp" })`                               | Status tugas/sesi ACP                   | Terpisah dari harness Codex native    |

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan `openai/gpt-*`
untuk rute OpenAI normal dan `codex/gpt-*` hanya ketika pemahaman gambar
harus berjalan melalui giliran app-server Codex yang dibatasi. Jangan gunakan
ref GPT Codex legacy; doctor menulis ulang prefiks legacy itu menjadi `openai/gpt-*`.

## Pola deployment

### Deployment Codex dasar

Gunakan konfigurasi quickstart ketika semua giliran agen OpenAI harus menggunakan Codex secara
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
`codex` menggunakan app-server Codex.

### Deployment Codex fail-closed

Untuk giliran agen OpenAI, `openai/gpt-*` sudah diselesaikan ke Codex ketika
Plugin bundled tersedia. Tambahkan kebijakan runtime eksplisit ketika Anda menginginkan aturan
fail-closed tertulis:

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

Dengan Codex dipaksakan, OpenClaw gagal lebih awal jika Plugin Codex dinonaktifkan,
app-server terlalu lama, atau app-server tidak dapat dimulai.

## Kebijakan app-server

Secara default, Plugin memulai binary Codex terkelola OpenClaw secara lokal dengan transport
stdio. Atur `appServer.command` hanya ketika Anda sengaja ingin menjalankan
executable berbeda. Gunakan transport WebSocket hanya ketika app-server sudah
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

Sesi app-server stdio lokal default ke postur operator lokal tepercaya:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Jika persyaratan Codex lokal tidak mengizinkan
postur YOLO implisit itu, OpenClaw memilih izin guardian yang diizinkan sebagai gantinya.
Ketika sandbox OpenClaw aktif untuk sesi, OpenClaw menonaktifkan Mode Kode
native Codex, server MCP pengguna, dan eksekusi Plugin yang didukung app untuk
giliran itu alih-alih mengandalkan sandboxing sisi host Codex. Akses shell diekspos
melalui alat dinamis yang didukung sandbox OpenClaw seperti `sandbox_exec` dan
`sandbox_process` ketika alat exec/proses normal tersedia.

Gunakan mode exec OpenClaw ternormalisasi ketika Anda menginginkan auto-review native Codex sebelum
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

Untuk sesi app-server Codex, OpenClaw memetakan `tools.exec.mode: "auto"` ke approval
yang ditinjau Guardian oleh Codex, biasanya
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, dan
`sandbox: "workspace-write"` ketika persyaratan lokal mengizinkan nilai tersebut.
Dalam `tools.exec.mode: "auto"`, OpenClaw tidak mempertahankan override Codex legacy yang tidak aman
`approvalPolicy: "never"` atau `sandbox: "danger-full-access"`; gunakan
`tools.exec.mode: "full"` untuk postur Codex tanpa approval yang disengaja. Preset
legacy `plugins.entries.codex.config.appServer.mode: "guardian"` masih
berfungsi, tetapi `tools.exec.mode: "auto"` adalah permukaan OpenClaw yang ternormalisasi.

Untuk perbandingan tingkat mode dengan approval exec host dan izin ACPX,
lihat [Mode izin](/id/tools/permission-modes).

Untuk setiap field app-server, urutan auth, isolasi lingkungan, discovery, dan
perilaku timeout, lihat [Referensi harness Codex](/id/plugins/codex-harness-reference).

## Perintah dan diagnostik

Plugin bundled mendaftarkan `/codex` sebagai slash command pada channel apa pun yang
mendukung perintah teks OpenClaw.

Bentuk umum:

- `/codex status` memeriksa konektivitas app-server, model, akun, batas laju,
  server MCP, dan Skills.
- `/codex models` mencantumkan model app-server Codex live.
- `/codex threads [filter]` mencantumkan thread app-server Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke
  thread Codex yang ada.
- `/codex compact` meminta app-server Codex untuk memadatkan thread yang dilampirkan.
- `/codex review` memulai review native Codex untuk thread yang dilampirkan.
- `/codex diagnostics [note]` meminta konfirmasi sebelum mengirim feedback Codex untuk
  thread yang dilampirkan.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP app-server Codex.
- `/codex skills` mencantumkan Skills app-server Codex.

Untuk sebagian besar laporan dukungan, mulai dengan `/diagnostics [note]` dalam percakapan
tempat bug terjadi. Ini membuat satu laporan diagnostik Gateway dan, untuk sesi
harness Codex, meminta approval untuk mengirim bundle feedback Codex yang relevan.
Lihat [Ekspor diagnostik](/id/gateway/diagnostics) untuk model privasi dan perilaku
chat grup.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan upload
feedback Codex untuk thread yang saat ini dilampirkan tanpa bundle diagnostik Gateway
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
   id profil auth Codex legacy yang lebih lama dan urutan auth Codex legacy.
2. Akun app-server yang sudah ada di home Codex agen itu.
3. Hanya untuk peluncuran app-server stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, ketika tidak ada akun app-server dan auth OpenAI
   masih diperlukan.

Ketika OpenClaw melihat profil auth Codex bergaya langganan ChatGPT, OpenClaw menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses child Codex yang dibuat. Itu
membuat kunci API tingkat Gateway tetap tersedia untuk embedding atau model OpenAI langsung
tanpa membuat giliran app-server Codex native tertagih melalui API secara tidak sengaja.
Profil kunci API Codex eksplisit dan fallback env-key stdio lokal menggunakan login app-server
alih-alih env proses child yang diwarisi. Koneksi app-server WebSocket
tidak menerima fallback kunci API env Gateway; gunakan profil auth eksplisit atau
akun milik app-server remote.
Ketika Plugin Codex native dikonfigurasi, OpenClaw menginstal atau menyegarkan Plugin tersebut
melalui app-server yang terhubung sebelum mengekspos app milik Plugin ke
thread Codex. `app/list` tetap menjadi sumber kebenaran untuk id app,
aksesibilitas, dan metadata, tetapi OpenClaw memiliki keputusan pengaktifan per thread:
jika kebijakan mengizinkan app yang tercantum dan dapat diakses, OpenClaw mengirim
`thread/start.config.apps[appId].enabled = true` bahkan ketika `app/list` saat ini
melaporkan app tersebut dinonaktifkan. Jalur ini tidak menciptakan instalasi app untuk
id yang tidak dikenal; OpenClaw hanya mengaktifkan Plugin marketplace dengan `plugin/install`
lalu menyegarkan inventaris.

Jika profil langganan mencapai batas penggunaan Codex, OpenClaw mencatat waktu reset
ketika Codex melaporkannya dan mencoba profil auth berurutan berikutnya untuk run Codex yang sama.
Ketika waktu reset lewat, profil langganan menjadi memenuhi syarat lagi
tanpa mengubah model `openai/gpt-*` yang dipilih atau runtime Codex.

Untuk peluncuran app-server stdio lokal, OpenClaw mengatur `CODEX_HOME` ke direktori
per agen agar konfigurasi Codex, file auth/akun, cache/data Plugin, dan status
thread native tidak membaca atau menulis `~/.codex` pribadi operator secara
default. OpenClaw mempertahankan proses normal `HOME`; subprocess yang dijalankan Codex
masih dapat menemukan konfigurasi dan token user-home, dan Codex dapat menemukan entri
`$HOME/.agents/skills` dan `$HOME/.agents/plugins/marketplace.json` bersama.

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

`appServer.clearEnv` hanya memengaruhi proses child app-server Codex yang dibuat.
OpenClaw menghapus `CODEX_HOME` dan `HOME` dari daftar ini selama normalisasi peluncuran lokal:
`CODEX_HOME` tetap per agen, dan `HOME` tetap diwarisi agar
subprocess dapat menggunakan status user-home normal.

Alat dinamis Codex secara default menggunakan pemuatan `searchable`. OpenClaw tidak mengekspos
alat dinamis yang menduplikasi operasi ruang kerja native Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process`, dan `update_plan`. Sebagian besar alat
integrasi OpenClaw lainnya seperti perpesanan, media, cron, browser, node,
gateway, dan `heartbeat_respond` tersedia melalui pencarian alat Codex di bawah
namespace `openclaw`, sehingga konteks model awal tetap lebih kecil. Pencarian web
menggunakan alat `web_search` terhosting milik Codex secara default saat pencarian
diaktifkan dan tidak ada penyedia terkelola yang dipilih. Pencarian terhosting
native dan alat dinamis `web_search` terkelola milik OpenClaw saling eksklusif
sehingga pencarian terkelola tidak dapat melewati pembatasan domain native.
OpenClaw menggunakan alat terkelola saat pencarian terhosting tidak tersedia,
dinonaktifkan secara eksplisit, atau diganti oleh penyedia terkelola yang dipilih.
OpenClaw tetap menonaktifkan ekstensi `web.run` mandiri milik Codex karena
lalu lintas app-server produksi menolak namespace `web` yang ditentukan pengguna.
`tools.web.search.enabled: false` menonaktifkan kedua jalur, begitu juga proses
khusus LLM dengan alat yang dinonaktifkan. Codex memperlakukan `"cached"` sebagai
preferensi dan menyelesaikannya menjadi akses eksternal langsung untuk giliran
app-server tanpa pembatasan. Fallback terkelola otomatis gagal tertutup saat
`allowedDomains` native ditetapkan sehingga daftar izin tidak dapat dilewati.
Perubahan kebijakan pencarian efektif yang persisten memutar utas Codex yang
terikat sebelum giliran berikutnya. Pembatasan sementara per giliran menggunakan
utas terbatas sementara dan mempertahankan ikatan yang ada untuk dilanjutkan
nanti. Balasan sumber khusus `sessions_yield` dan alat pesan tetap langsung
karena itu adalah kontrak pengendalian giliran. `sessions_spawn` tetap dapat
dicari sehingga `spawn_agent` native milik Codex tetap menjadi permukaan subagen
Codex utama, sementara delegasi OpenClaw atau ACP eksplisit tetap tersedia melalui
namespace alat dinamis `openclaw`. Instruksi kolaborasi Heartbeat memberi tahu
Codex untuk mencari `heartbeat_respond` sebelum mengakhiri giliran heartbeat saat
alat belum dimuat.

Tetapkan `codexDynamicToolsLoading: "direct"` hanya saat terhubung ke app-server
Codex khusus yang tidak dapat mencari alat dinamis yang ditangguhkan atau saat
men-debug payload alat lengkap.

Kolom Plugin Codex tingkat atas yang didukung:

| Kolom                      | Default        | Makna                                                                                    |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Gunakan `"direct"` untuk menaruh alat dinamis OpenClaw langsung di konteks alat Codex awal. |
| `codexDynamicToolsExclude` | `[]`           | Nama alat dinamis OpenClaw tambahan yang akan dihilangkan dari giliran app-server Codex.  |
| `codexPlugins`             | dinonaktifkan  | Dukungan Plugin/app Codex native untuk Plugin terkurasi yang dimigrasikan dan diinstal dari sumber. |

Kolom `appServer` yang didukung:

| Bidang                                        | Bawaan                                                | Makna                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                                                                                                                                                                                  |
| `command`                                     | biner Codex terkelola                                  | Executable untuk transport stdio. Biarkan tidak disetel untuk menggunakan biner terkelola; setel hanya untuk override eksplisit.                                                                                                                                                                                                                                                                |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumen untuk transport stdio.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | tidak disetel                                          | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | tidak disetel                                          | Token Bearer untuk transport WebSocket. Menerima string literal atau SecretInput seperti `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                           |
| `headers`                                     | `{}`                                                   | Header WebSocket tambahan. Nilai header menerima string literal atau nilai SecretInput, misalnya `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya. OpenClaw mempertahankan `CODEX_HOME` per agen dan `HOME` yang diwariskan untuk peluncuran lokal.                                                                                                                                                |
| `codeModeOnly`                                | `false`                                                | Ikut serta ke permukaan alat khusus mode kode Codex. Alat dinamis OpenClaw tetap terdaftar dengan Codex sehingga panggilan `tools.*` bersarang kembali melalui bridge app-server `item/tool/call`.                                                                                                                                                                                              |
| `remoteWorkspaceRoot`                         | tidak disetel                                          | Root ruang kerja app-server Codex jarak jauh. Saat disetel, OpenClaw menyimpulkan root ruang kerja lokal dari ruang kerja OpenClaw yang diselesaikan, mempertahankan sufiks cwd saat ini di bawah root jarak jauh ini, dan hanya mengirim cwd app-server akhir ke Codex. Jika cwd berada di luar root ruang kerja OpenClaw yang diselesaikan, OpenClaw gagal tertutup alih-alih mengirim path lokal Gateway ke app-server jarak jauh. |
| `requestTimeoutMs`                            | `60000`                                                | Timeout untuk panggilan bidang kontrol app-server.                                                                                                                                                                                                                                                                                                                                              |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Jendela senyap setelah Codex menerima giliran atau setelah permintaan app-server yang tercakup giliran saat OpenClaw menunggu `turn/completed`.                                                                                                                                                                                                                                                 |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Penjaga idle penyelesaian dan progres yang digunakan setelah handoff alat, penyelesaian alat native, progres asisten mentah pasca-alat, penyelesaian penalaran mentah, atau progres penalaran saat OpenClaw menunggu `turn/completed`. Gunakan ini untuk beban kerja tepercaya atau berat ketika sintesis pasca-alat secara sah dapat tetap senyap lebih lama daripada anggaran rilis asisten akhir. |
| `mode`                                        | `"yolo"` kecuali persyaratan Codex lokal melarang YOLO | Preset untuk eksekusi YOLO atau yang ditinjau guardian. Persyaratan stdio lokal yang menghilangkan `danger-full-access`, persetujuan `never`, atau peninjau `user` membuat bawaan implisit menjadi guardian.                                                                                                                                                                                    |
| `approvalPolicy`                              | `"never"` atau kebijakan persetujuan guardian yang diizinkan | Kebijakan persetujuan Codex native yang dikirim ke thread start/resume/turn. Bawaan guardian memilih `"on-request"` saat diizinkan.                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` atau sandbox guardian yang diizinkan | Mode sandbox Codex native yang dikirim ke thread start/resume. Bawaan guardian memilih `"workspace-write"` saat diizinkan, jika tidak `"read-only"`. Saat sandbox OpenClaw aktif, giliran `danger-full-access` menggunakan Codex `workspace-write` dengan akses jaringan yang berasal dari pengaturan egress sandbox OpenClaw.                                                                    |
| `approvalsReviewer`                           | `"user"` atau peninjau guardian yang diizinkan         | Gunakan `"auto_review"` agar Codex meninjau prompt persetujuan native saat diizinkan, jika tidak `guardian_subagent` atau `user`. `guardian_subagent` tetap menjadi alias lama.                                                                                                                                                                                                                |
| `serviceTier`                                 | tidak disetel                                          | Tingkat layanan app-server Codex opsional. `"priority"` mengaktifkan routing mode cepat, `"flex"` meminta pemrosesan flex, `null` menghapus override, dan `"fast"` lama diterima sebagai `"priority"`.                                                                                                                                                                                         |
| `networkProxy`                                | dinonaktifkan                                          | Ikut serta ke jaringan profil izin Codex untuk perintah app-server. OpenClaw mendefinisikan konfigurasi `permissions.<profile>.network` yang dipilih dan memilihnya dengan `default_permissions` alih-alih mengirim `sandbox`.                                                                                                                                                                 |
| `experimental.sandboxExecServer`              | `false`                                                | Keikutsertaan pratinjau yang mendaftarkan lingkungan Codex yang didukung sandbox OpenClaw dengan app-server Codex 0.132.0 atau yang lebih baru sehingga eksekusi Codex native dapat berjalan di dalam sandbox OpenClaw aktif.                                                                                                                                                                  |

`appServer.networkProxy` bersifat eksplisit karena mengubah kontrak sandbox
Codex. Saat diaktifkan, OpenClaw juga menyetel `features.network_proxy.enabled` dan
`default_permissions` dalam konfigurasi thread Codex sehingga profil izin yang
dihasilkan dapat memulai jaringan terkelola Codex. Secara bawaan, OpenClaw menghasilkan
nama profil `openclaw-network-<fingerprint>` yang tahan benturan dari isi
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

Jika runtime app-server normal akan berupa `danger-full-access`, mengaktifkan
`networkProxy` menggunakan akses sistem berkas bergaya workspace untuk profil
izin yang dihasilkan. Penegakan jaringan terkelola Codex adalah jaringan yang di-sandbox,
sehingga profil akses penuh tidak akan melindungi lalu lintas keluar.
Entri domain menggunakan `allow` atau `deny`; entri socket Unix menggunakan nilai
`allow` atau `none` milik Codex.

Panggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: permintaan Codex `item/tool/call` menggunakan
watchdog OpenClaw 90 detik secara default. Argumen `timeoutMs` positif per
panggilan memperpanjang atau mempersingkat anggaran alat spesifik tersebut. Alat
`image_generate` menggunakan `agents.defaults.imageGenerationModel.timeoutMs`
ketika panggilan alat tidak menyediakan timeout sendiri, atau default pembuatan
gambar 120 detik jika tidak. Alat `image` untuk pemahaman media menggunakan
`tools.media.image.timeoutSeconds` atau default media 60 detiknya. Untuk
pemahaman gambar, timeout tersebut berlaku pada permintaan itu sendiri dan tidak
dikurangi oleh pekerjaan persiapan sebelumnya. Anggaran alat dinamis dibatasi
hingga 600000 ms. Saat timeout, OpenClaw membatalkan sinyal alat jika didukung
dan mengembalikan respons alat dinamis yang gagal ke Codex agar giliran dapat
berlanjut alih-alih meninggalkan sesi dalam `processing`. Watchdog ini adalah
anggaran luar `item/tool/call` dinamis; timeout permintaan khusus penyedia
berjalan di dalam panggilan tersebut dan mempertahankan semantik timeoutnya
sendiri.

Setelah Codex menerima giliran, dan setelah OpenClaw merespons permintaan
app-server yang tercakup pada giliran, harness mengharapkan Codex membuat
kemajuan pada giliran saat ini dan akhirnya menyelesaikan giliran native dengan
`turn/completed`. Jika app-server diam selama
`appServer.turnCompletionIdleTimeoutMs`, OpenClaw berupaya sebaik mungkin untuk
menginterupsi giliran Codex, mencatat timeout diagnostik, dan melepaskan jalur
sesi OpenClaw agar pesan chat lanjutan tidak mengantre di belakang giliran native
yang basi. Sebagian besar notifikasi non-terminal untuk giliran yang sama
menonaktifkan watchdog singkat tersebut karena Codex telah membuktikan giliran
masih aktif. Serah terima alat menggunakan anggaran idle pasca-alat yang lebih
panjang: setelah OpenClaw mengembalikan respons `item/tool/call`, setelah item
alat native seperti `commandExecution` selesai, setelah penyelesaian mentah
`custom_tool_call_output`, dan setelah kemajuan asisten mentah pasca-alat,
penyelesaian penalaran mentah, atau kemajuan penalaran. Guard menggunakan
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` jika dikonfigurasi dan
jika tidak default ke lima menit. Anggaran pasca-alat yang sama juga
memperpanjang watchdog kemajuan untuk jendela sintesis senyap sebelum Codex
memancarkan event giliran saat ini berikutnya. Notifikasi app-server global,
seperti pembaruan batas laju, tidak mereset kemajuan idle giliran. Penyelesaian
penalaran, penyelesaian `agentMessage` commentary, dan kemajuan penalaran mentah
atau asisten pra-alat dapat diikuti oleh balasan akhir otomatis, sehingga mereka
menggunakan guard balasan pasca-kemajuan alih-alih langsung melepaskan jalur
sesi. Hanya item `agentMessage` selesai final/non-commentary dan penyelesaian
asisten mentah pra-alat yang mengaktifkan pelepasan output asisten: jika Codex
kemudian diam tanpa `turn/completed`, OpenClaw berupaya sebaik mungkin untuk
menginterupsi giliran native dan melepaskan jalur sesi. Kegagalan app-server
stdio yang aman diputar ulang, termasuk timeout idle penyelesaian giliran tanpa
bukti asisten, alat, item aktif, atau efek samping, dicoba ulang sekali pada
upaya app-server baru. Timeout yang tidak aman tetap menghentikan klien
app-server yang macet dan melepaskan jalur sesi OpenClaw. Timeout tersebut juga
menghapus binding thread native yang basi alih-alih diputar ulang secara
otomatis. Timeout pemantauan penyelesaian menampilkan teks timeout khusus Codex:
kasus yang aman diputar ulang mengatakan respons mungkin tidak lengkap,
sementara kasus yang tidak aman memberi tahu pengguna untuk memverifikasi status
saat ini sebelum mencoba lagi. Diagnostik timeout publik menyertakan kolom
struktural seperti metode notifikasi app-server terakhir, id/tipe/peran item
respons asisten mentah, jumlah permintaan/item aktif, dan status watch yang
aktif. Ketika notifikasi terakhir adalah item respons asisten mentah, diagnostik
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
Config lebih disarankan untuk deployment yang dapat diulang karena menjaga
perilaku plugin di file yang sama yang ditinjau bersama sisa penyiapan harness
Codex.

## Plugin Codex Native

Dukungan plugin Codex native menggunakan kemampuan app dan plugin milik Codex
app-server sendiri dalam thread Codex yang sama dengan giliran harness OpenClaw.
OpenClaw tidak menerjemahkan plugin Codex menjadi alat dinamis OpenClaw
`codex_plugin_*` sintetis.

`codexPlugins` hanya memengaruhi sesi yang memilih harness Codex native. Ini
tidak berpengaruh pada proses harness bawaan, proses penyedia OpenAI normal,
binding percakapan ACP, atau harness lain.

Config migrasi minimal:

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

Config app thread dihitung ketika OpenClaw membuat sesi harness Codex atau
mengganti binding thread Codex yang basi. Ini tidak dihitung ulang pada setiap
giliran. Setelah mengubah `codexPlugins`, gunakan `/new`, `/reset`, atau mulai
ulang Gateway agar sesi harness Codex berikutnya dimulai dengan set app yang
diperbarui.

Untuk kelayakan migrasi, inventaris app, kebijakan tindakan destruktif,
elisitasi, dan diagnostik plugin native, lihat
[Plugin Codex native](/id/plugins/codex-native-plugins).

Akses app dan plugin sisi OpenAI dikendalikan oleh akun Codex yang masuk dan,
untuk workspace Business dan Enterprise/Edu, kontrol app workspace. Lihat
[Menggunakan Codex dengan paket ChatGPT Anda](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
untuk ringkasan akun dan kontrol workspace OpenAI.

## Computer Use

Computer Use dibahas dalam panduan penyiapannya sendiri:
[Codex Computer Use](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak mem-vendor app kontrol desktop atau mengeksekusi
tindakan desktop sendiri. OpenClaw menyiapkan Codex app-server, memverifikasi
bahwa server MCP `computer-use` tersedia, lalu membiarkan Codex memiliki
panggilan alat MCP native selama giliran mode Codex.

## Batas Runtime

Harness Codex hanya mengubah eksekutor agen tersemat tingkat rendah.

- Alat dinamis OpenClaw didukung. Codex meminta OpenClaw untuk mengeksekusi alat
  tersebut, sehingga OpenClaw tetap berada di jalur eksekusi.
- Alat shell, patch, MCP, dan app native milik Codex dimiliki oleh Codex.
  OpenClaw dapat mengamati atau memblokir event native tertentu melalui relay
  yang didukung, tetapi tidak menulis ulang argumen alat native.
- Codex memiliki Compaction native. OpenClaw menyimpan mirror transkrip untuk
  riwayat channel, pencarian, `/new`, `/reset`, dan pengalihan model atau
  harness di masa mendatang, tetapi tidak mengganti Compaction Codex dengan
  peringkas OpenClaw atau context-engine.
- Pembuatan media, pemahaman media, TTS, persetujuan, dan output alat perpesanan
  tetap melalui pengaturan penyedia/model OpenClaw yang cocok.
- `tool_result_persist` berlaku untuk hasil alat transkrip milik OpenClaw, bukan
  catatan hasil alat native Codex.

Untuk lapisan hook, surface V1 yang didukung, penanganan izin native, pengarah
antrean, mekanisme unggah umpan balik Codex, dan detail Compaction, lihat
[Runtime harness Codex](/id/plugins/codex-harness-runtime).

## Pemecahan Masalah

**Codex tidak muncul sebagai penyedia `/model` normal:** ini diharapkan untuk
config baru. Pilih model `openai/gpt-*`, aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow`
mengecualikan `codex`.

**OpenClaw menggunakan harness bawaan alih-alih Codex:** pastikan ref model
adalah `openai/gpt-*` pada penyedia resmi OpenAI dan plugin Codex terinstal
serta diaktifkan. Jika Anda membutuhkan bukti ketat saat menguji, setel penyedia
atau model `agentRuntime.id: "codex"`. Runtime Codex yang dipaksa akan gagal
alih-alih fallback ke OpenClaw.

**Runtime OpenAI Codex fallback ke jalur API-key:** kumpulkan kutipan Gateway
yang disunting yang menunjukkan model, runtime, penyedia yang dipilih, dan
kegagalan. Minta kolaborator terdampak menjalankan perintah read-only ini pada
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

Kutipan yang berguna biasanya menyertakan `openai/gpt-5.5` atau
`openai/gpt-5.4`, `Runtime: OpenAI Codex`, `agentRuntime.id` atau
`harnessRuntime`, `candidateProvider: "openai"`, dan hasil `401`,
`Incorrect API key`, atau `No API key`. Proses yang sudah diperbaiki seharusnya
menampilkan jalur OAuth OpenAI alih-alih kegagalan API-key OpenAI biasa.

**Config ref model Codex lama masih ada:** jalankan `openclaw doctor --fix`.
Doctor menulis ulang ref model lama ke `openai/*`, menghapus pin runtime sesi
dan seluruh agen yang basi, serta mempertahankan override profil autentikasi
yang sudah ada.

**App-server ditolak:** gunakan Codex app-server `0.125.0` atau yang lebih baru.
Prerelease versi yang sama atau versi bersufiks build seperti `0.125.0-alpha.2`
atau `0.125.0+custom` ditolak karena OpenClaw menguji batas bawah protokol stabil
`0.125.0`.

**`/codex status` tidak dapat terhubung:** periksa bahwa plugin `codex` bawaan
diaktifkan, bahwa `plugins.allow` menyertakannya ketika allowlist dikonfigurasi,
dan bahwa `appServer.command`, `url`, `authToken`, atau header kustom valid.

**Penemuan model lambat:** turunkan
`plugins.entries.codex.config.discovery.timeoutMs` atau nonaktifkan penemuan.
Lihat [Referensi harness Codex](/id/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
header, dan bahwa app-server jarak jauh berbicara dengan versi protokol
app-server Codex yang sama.

**Alat shell atau patch native diblokir dengan `Native hook relay unavailable`:**
thread Codex masih mencoba menggunakan id relay hook native yang tidak lagi
terdaftar di OpenClaw. Ini adalah masalah transport hook Codex native, bukan
kegagalan backend ACP, penyedia, GitHub, atau perintah shell. Mulai sesi baru di
chat terdampak dengan `/new` atau `/reset`, lalu coba lagi perintah yang tidak
berbahaya. Jika itu berhasil sekali tetapi panggilan alat native berikutnya
gagal lagi, perlakukan `/new` hanya sebagai workaround sementara: salin prompt
ke sesi baru setelah memulai ulang Codex app-server atau OpenClaw Gateway agar
thread lama dibuang dan pendaftaran hook native dibuat ulang.

**Model non-Codex menggunakan harness bawaan:** itu diharapkan kecuali kebijakan
runtime penyedia atau model merutekannya ke harness lain. Ref penyedia non-OpenAI
biasa tetap berada pada jalur penyedia normalnya dalam mode `auto`.

**Penggunaan Komputer terinstal tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika alat melaporkan
`Native hook relay unavailable`, gunakan pemulihan relay hook native di atas. Lihat
[Codex Penggunaan Komputer](/id/plugins/codex-computer-use#troubleshooting).

## Terkait

- [Referensi harness Codex](/id/plugins/codex-harness-reference)
- [Runtime harness Codex](/id/plugins/codex-harness-runtime)
- [Plugin Codex native](/id/plugins/codex-native-plugins)
- [Codex Penggunaan Komputer](/id/plugins/codex-computer-use)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Penyedia model](/id/concepts/model-providers)
- [Penyedia OpenAI](/id/providers/openai)
- [Bantuan OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
- [Hook Plugin](/id/plugins/hooks)
- [Ekspor diagnostik](/id/gateway/diagnostics)
- [Status](/id/cli/status)
- [Pengujian](/id/help/testing-live#live-codex-app-server-harness-smoke)
