---
read_when:
    - Anda ingin menggunakan harness app-server Codex bawaan
    - Anda memerlukan contoh konfigurasi harness Codex
    - Anda ingin deployment khusus Codex gagal alih-alih kembali ke OpenClaw
summary: Jalankan giliran agen tersemat OpenClaw melalui harness app-server Codex yang dibundel
title: Harness Codex
x-i18n:
    generated_at: "2026-07-04T11:04:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1cf51f87f1ccaab2611926ea6bdba73f53de9a88b44da2395eb5f4c147da188
    source_path: plugins/codex-harness.md
    workflow: 16
---

Plugin `codex` bawaan memungkinkan OpenClaw menjalankan giliran agen OpenAI tertanam
melalui Codex app-server, bukan melalui harness OpenClaw bawaan.

Gunakan harness Codex saat Anda ingin Codex memiliki sesi agen level rendah:
resume thread native, kelanjutan alat native, compaction native, dan
eksekusi app-server. OpenClaw tetap memiliki saluran chat, berkas sesi, pemilihan
model, alat dinamis OpenClaw, persetujuan, pengiriman media, dan cermin
transkrip yang terlihat.

Penyiapan normal menggunakan referensi model OpenAI kanonis seperti `openai/gpt-5.5`.
Jangan konfigurasi referensi GPT Codex lama. Letakkan urutan auth agen OpenAI
di bawah `auth.order.openai`; id profil auth Codex lama yang lebih lama dan
entri urutan auth Codex lama adalah status lama yang diperbaiki oleh
`openclaw doctor --fix`.

Saat tidak ada sandbox OpenClaw yang aktif, OpenClaw memulai thread Codex app-server
dengan mode kode native Codex diaktifkan sambil membiarkan code-mode-only nonaktif secara default.
Ini menjaga workspace native dan kapabilitas kode Codex tetap tersedia sementara
alat dinamis OpenClaw terus berjalan melalui bridge `item/tool/call` app-server.
Sandboxing OpenClaw aktif dan kebijakan alat terbatas menonaktifkan mode kode native
sepenuhnya kecuali Anda memilih ikut pada jalur sandbox exec-server eksperimental.

Fitur native Codex ini terpisah dari
[mode kode OpenClaw](/id/reference/code-mode), yaitu runtime QuickJS-WASI opsional
untuk run OpenClaw generik dengan bentuk input `exec` yang berbeda.

Untuk pemisahan model/penyedia/runtime yang lebih luas, mulai dari
[Runtime agen](/id/concepts/agent-runtimes). Versi singkatnya:
`openai/gpt-5.5` adalah referensi model, `codex` adalah runtime, dan Telegram,
Discord, Slack, atau saluran lain tetap menjadi permukaan komunikasi.

## Persyaratan

- OpenClaw dengan Plugin `codex` bawaan tersedia.
- Jika config Anda menggunakan `plugins.allow`, sertakan `codex`.
- Codex app-server `0.125.0` atau yang lebih baru. Plugin bawaan mengelola biner
  Codex app-server yang kompatibel secara default, sehingga perintah `codex` lokal di `PATH` tidak
  memengaruhi startup harness normal.
- Auth Codex tersedia melalui `openclaw models auth login --provider openai`,
  akun app-server di home Codex agen, atau profil auth API-key Codex eksplisit.

Untuk prioritas auth, isolasi environment, perintah app-server kustom, penemuan model,
dan semua field config, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference).

## Mulai cepat

Sebagian besar pengguna yang menginginkan Codex di OpenClaw menginginkan jalur ini: masuk dengan
langganan ChatGPT/Codex, aktifkan Plugin `codex` bawaan, dan gunakan
referensi model `openai/gpt-*` kanonis.

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

Restart gateway setelah mengubah config Plugin. Jika chat yang sudah ada
sudah memiliki sesi, gunakan `/new` atau `/reset` sebelum menguji perubahan runtime agar giliran berikutnya
menyelesaikan harness dari config saat ini.

## Bagikan thread dengan Codex Desktop dan CLI

Default `appServer.homeScope: "agent"` menjaga setiap agen OpenClaw tetap terisolasi
dari status native Codex milik operator. Untuk memungkinkan pemilik meminta OpenClaw memeriksa
dan mengelola thread native yang sama yang ditampilkan oleh Codex Desktop dan Codex CLI,
pilih untuk menggunakan home Codex pengguna:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

Mode user-home hanya tersedia dengan transport stdio lokal. Mode ini menggunakan
`$CODEX_HOME` saat disetel dan `~/.codex` jika tidak, termasuk auth, config,
Plugin, dan penyimpanan thread native Codex milik home tersebut. OpenClaw tidak menyuntikkan
profil auth OpenClaw ke app-server ini.

Giliran pemilik mendapatkan alat `codex_threads`. Alat ini dapat mencantumkan, mencari, membaca, fork,
mengganti nama, mengarsipkan, dan memulihkan thread native. Minta agen untuk melakukan fork thread saat
Anda ingin melanjutkannya di OpenClaw; fork tersebut dilampirkan ke sesi
OpenClaw saat ini dan tetap terlihat oleh klien native Codex lain. Arsip
memerlukan konfirmasi eksplisit bahwa thread ditutup di tempat lain.

Jangan resume atau menulis thread yang sama secara bersamaan dari OpenClaw dan klien
Codex lain. Codex mengoordinasikan penulis live di dalam satu proses app-server, bukan
di seluruh proses Desktop, CLI, dan OpenClaw yang independen. Fork membuat
kelanjutan terpisah dan merupakan jalur koeksistensi yang aman.

## Konfigurasi

Config mulai cepat adalah config harness Codex minimum yang layak. Setel opsi
harness Codex di config OpenClaw, dan gunakan CLI hanya untuk auth Codex:

| Kebutuhan                              | Setel                                                                            | Lokasi                             |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Aktifkan harness                       | `plugins.entries.codex.enabled: true`                                            | Config OpenClaw                    |
| Pertahankan instalasi Plugin allowlist | Sertakan `codex` di `plugins.allow`                                              | Config OpenClaw                    |
| Rutekan giliran agen OpenAI melalui Codex | `agents.defaults.model` atau `agents.list[].model` sebagai `openai/gpt-*`        | Config agen OpenClaw               |
| Masuk dengan OAuth ChatGPT/Codex       | `openclaw models auth login --provider openai`                                   | Profil auth CLI                    |
| Tambahkan cadangan API-key untuk run Codex | Profil API-key `openai:*` dicantumkan setelah auth langganan di `auth.order.openai` | Profil auth CLI + config OpenClaw |
| Gagal tertutup saat Codex tidak tersedia | `agentRuntime.id: "codex"` penyedia atau model                                  | Config model/penyedia OpenClaw     |
| Gunakan traffic API OpenAI langsung    | `agentRuntime.id: "openclaw"` penyedia atau model dengan auth OpenAI normal      | Config model/penyedia OpenClaw     |
| Sesuaikan perilaku app-server          | `plugins.entries.codex.config.appServer.*`                                       | Config Plugin Codex                |
| Aktifkan app Plugin native Codex       | `plugins.entries.codex.config.codexPlugins.*`                                    | Config Plugin Codex                |
| Aktifkan Codex Computer Use            | `plugins.entries.codex.config.computerUse.*`                                     | Config Plugin Codex                |

Gunakan referensi model `openai/gpt-*` untuk giliran agen OpenAI yang didukung Codex. Utamakan
`auth.order.openai` untuk urutan langganan lebih dulu/cadangan API-key. Id profil auth
Codex lama yang sudah ada dan urutan auth Codex lama adalah status lama khusus doctor;
jangan tulis referensi GPT Codex lama yang baru.

Jangan setel `compaction.model` atau `compaction.provider` pada agen yang didukung Codex.
Codex melakukan compaction melalui status thread app-server native-nya, sehingga OpenClaw mengabaikan
override peringkas lokal tersebut saat runtime dan `openclaw doctor --fix` menghapusnya
saat agen menggunakan Codex.

Lossless tetap didukung sebagai mesin konteks untuk assembly, ingestion, dan
maintenance di sekitar giliran Codex. Konfigurasikan melalui
`plugins.slots.contextEngine: "lossless-claw"` dan
`plugins.entries.lossless-claw.config.summaryModel`, bukan melalui
`agents.defaults.compaction.provider`. `openclaw doctor --fix` memigrasikan bentuk lama
`compaction.provider: "lossless-claw"` ke slot mesin konteks Lossless
saat Codex adalah runtime aktif, tetapi Codex native tetap memiliki compaction.

Harness native Codex app-server mendukung mesin konteks yang memerlukan
assembly sebelum prompt. Backend CLI generik, termasuk `codex-cli`, tidak menyediakan
kapabilitas host tersebut.

Untuk agen yang didukung Codex, `/compact` memulai compaction native Codex app-server pada
thread yang terikat. OpenClaw tidak menunggu penyelesaian, memberlakukan timeout
OpenClaw, memulai ulang app-server bersama, atau fallback ke mesin konteks atau
peringkas OpenAI publik. Jika binding thread native Codex hilang atau
stale, perintah gagal tertutup sehingga operator melihat batas runtime yang sebenarnya
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

Dalam bentuk tersebut, kedua profil tetap berjalan melalui Codex untuk giliran agen
`openai/gpt-*`. API key hanya fallback auth, bukan permintaan untuk beralih ke OpenClaw atau
OpenAI Responses biasa.

Sisa halaman ini membahas varian umum yang harus dipilih pengguna:
bentuk deployment, routing gagal tertutup, kebijakan persetujuan guardian, Plugin native Codex,
dan Computer Use. Untuk daftar opsi lengkap, default, enum, penemuan,
isolasi environment, timeout, dan field transport app-server, lihat
[Referensi harness Codex](/id/plugins/codex-harness-reference).

## Verifikasi runtime Codex

Gunakan `/status` di chat tempat Anda mengharapkan Codex. Giliran agen OpenAI yang didukung Codex
menampilkan:

```text
Runtime: OpenAI Codex
```

Lalu periksa status Codex app-server:

```text
/codex status
/codex models
```

`/codex status` melaporkan konektivitas app-server, akun, rate limit, server MCP,
dan Skills. `/codex models` mencantumkan katalog Codex app-server live untuk
harness dan akun. Jika `/status` mengejutkan, lihat
[Pemecahan masalah](#troubleshooting).

## Routing dan pemilihan model

Pisahkan referensi penyedia dan kebijakan runtime:

- Gunakan `openai/gpt-*` untuk giliran agen OpenAI melalui Codex.
- Jangan gunakan referensi GPT Codex lama dalam config. Jalankan `openclaw doctor --fix` untuk
  memperbaiki referensi lama dan pin rute sesi yang stale.
- `agentRuntime.id: "codex"` bersifat opsional untuk mode otomatis OpenAI normal, tetapi berguna
  saat deployment harus gagal tertutup jika Codex tidak tersedia.
- `agentRuntime.id: "openclaw"` memilih penyedia atau model ke runtime tertanam
  OpenClaw saat itu disengaja.
- `/codex ...` mengontrol percakapan native Codex app-server dari chat.
- ACP/acpx adalah jalur harness eksternal terpisah. Gunakan hanya saat pengguna meminta
  ACP/acpx atau adapter harness eksternal.

Routing perintah umum:

| Niat pengguna                                        | Gunakan                                                                                               |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Lampirkan chat saat ini                              | `/codex bind [--cwd <path>]`                                                                          |
| Lanjutkan thread Codex yang sudah ada                | `/codex resume <thread-id>`                                                                           |
| Cantumkan atau filter thread Codex                   | `/codex threads [filter]`                                                                             |
| Cantumkan plugin Codex native                        | `/codex plugins list`                                                                                 |
| Aktifkan atau nonaktifkan plugin Codex native yang sudah dikonfigurasi | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Lampirkan sesi Codex CLI yang sudah ada pada node yang dipasangkan | `/codex sessions --host <node> [filter]`, lalu `/codex resume <session-id> --host <node> --bind here` |
| Kirim masukan Codex saja                             | `/codex diagnostics [note]`                                                                           |
| Mulai tugas ACP/acpx                                 | Perintah sesi ACP/acpx, bukan `/codex`                                                               |

| Kasus penggunaan                                    | Konfigurasi                                                           | Verifikasi                              | Catatan                               |
| --------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Langganan ChatGPT/Codex dengan runtime Codex native | `openai/gpt-*` ditambah plugin `codex` yang diaktifkan                | `/status` menampilkan `Runtime: OpenAI Codex` | Jalur yang direkomendasikan           |
| Gagal tertutup jika Codex tidak tersedia            | Provider atau model `agentRuntime.id: "codex"`                        | Giliran gagal alih-alih fallback tertanam | Gunakan untuk deployment khusus Codex |
| Arahkan traffic kunci API OpenAI langsung melalui OpenClaw | Provider atau model `agentRuntime.id: "openclaw"` dan auth OpenAI normal | `/status` menampilkan runtime OpenClaw  | Gunakan hanya jika OpenClaw memang disengaja |
| Konfigurasi legacy                                  | referensi GPT Codex legacy                                            | `openclaw doctor --fix` menulis ulangnya | Jangan tulis konfigurasi baru dengan cara ini |
| Adapter ACP/acpx Codex                              | ACP `sessions_spawn({ runtime: "acp" })`                              | Status tugas/sesi ACP                   | Terpisah dari harness Codex native    |

`agents.defaults.imageModel` mengikuti pemisahan prefiks yang sama. Gunakan `openai/gpt-*`
untuk rute OpenAI normal dan `codex/gpt-*` hanya ketika pemahaman gambar
harus berjalan melalui giliran server aplikasi Codex yang dibatasi. Jangan gunakan
referensi GPT Codex legacy; doctor menulis ulang prefiks legacy tersebut ke `openai/gpt-*`.

## Pola deployment

### Deployment Codex dasar

Gunakan konfigurasi quickstart ketika semua giliran agen OpenAI harus menggunakan Codex
secara default.

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

Untuk giliran agen OpenAI, `openai/gpt-*` sudah terselesaikan ke Codex ketika
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

Dengan Codex dipaksa, OpenClaw gagal lebih awal jika plugin Codex dinonaktifkan,
server aplikasi terlalu lama, atau server aplikasi tidak dapat dimulai.

## Kebijakan server aplikasi

Secara default, plugin memulai biner Codex yang dikelola OpenClaw secara lokal dengan transport
stdio. Tetapkan `appServer.command` hanya ketika Anda memang ingin menjalankan
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

Sesi server aplikasi stdio lokal secara default memakai postur operator lokal tepercaya:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, dan
`sandbox: "danger-full-access"`. Jika persyaratan Codex lokal tidak mengizinkan
postur YOLO implisit tersebut, OpenClaw memilih izin guardian yang diizinkan sebagai gantinya.
Ketika sandbox OpenClaw aktif untuk sesi, OpenClaw menonaktifkan Code Mode
native Codex, server MCP pengguna, dan eksekusi plugin berbasis aplikasi untuk
giliran tersebut, alih-alih mengandalkan sandboxing sisi host Codex. Akses shell diekspos
melalui alat dinamis berbasis sandbox OpenClaw seperti `sandbox_exec` dan
`sandbox_process` ketika alat exec/proses normal tersedia.

Gunakan mode exec OpenClaw yang dinormalisasi ketika Anda menginginkan auto-review native Codex sebelum
pelolosan sandbox atau izin tambahan:

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

Untuk sesi server aplikasi Codex, OpenClaw memetakan `tools.exec.mode: "auto"` ke persetujuan
yang ditinjau Guardian oleh Codex, biasanya
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, dan
`sandbox: "workspace-write"` ketika persyaratan lokal mengizinkan nilai tersebut.
Dalam `tools.exec.mode: "auto"`, OpenClaw tidak mempertahankan override Codex legacy yang tidak aman
`approvalPolicy: "never"` atau `sandbox: "danger-full-access"`; gunakan
`tools.exec.mode: "full"` untuk postur Codex tanpa persetujuan yang disengaja. Preset legacy
`plugins.entries.codex.config.appServer.mode: "guardian"` masih
berfungsi, tetapi `tools.exec.mode: "auto"` adalah permukaan OpenClaw yang dinormalisasi.

Untuk perbandingan tingkat mode dengan persetujuan exec host dan izin ACPX,
lihat [Mode izin](/id/tools/permission-modes).

Untuk setiap field server aplikasi, urutan auth, isolasi lingkungan, discovery, dan
perilaku timeout, lihat [Referensi harness Codex](/id/plugins/codex-harness-reference).

## Perintah dan diagnostik

Plugin bawaan mendaftarkan `/codex` sebagai perintah garis miring pada channel apa pun yang
mendukung perintah teks OpenClaw.

Eksekusi dan kontrol native memerlukan pemilik atau klien Gateway `operator.admin`.
Ini mencakup binding atau melanjutkan thread, mengirim atau menghentikan giliran,
mengubah model, mode cepat, atau status izin, melakukan compact atau review, dan
melepas binding. Pengirim resmi lainnya tetap memiliki perintah baca-saja untuk status,
bantuan, akun, model, thread, server MCP, skill, dan inspeksi binding.

Bentuk umum:

- `/codex status` memeriksa konektivitas server aplikasi, model, akun, batas laju,
  server MCP, dan skills.
- `/codex models` mencantumkan model server aplikasi Codex live.
- `/codex threads [filter]` mencantumkan thread server aplikasi Codex terbaru.
- `/codex resume <thread-id>` melampirkan sesi OpenClaw saat ini ke
  thread Codex yang sudah ada.
- `/codex compact` meminta server aplikasi Codex untuk melakukan compact pada thread yang dilampirkan.
- `/codex review` memulai review native Codex untuk thread yang dilampirkan.
- `/codex diagnostics [note]` meminta izin sebelum mengirim masukan Codex untuk
  thread yang dilampirkan.
- `/codex account` menampilkan status akun dan batas laju.
- `/codex mcp` mencantumkan status server MCP server aplikasi Codex.
- `/codex skills` mencantumkan skills server aplikasi Codex.

Untuk sebagian besar laporan dukungan, mulai dengan `/diagnostics [note]` dalam percakapan
tempat bug terjadi. Perintah ini membuat satu laporan diagnostik Gateway dan, untuk sesi
harness Codex, meminta persetujuan untuk mengirim bundel masukan Codex yang relevan.
Lihat [Ekspor diagnostik](/id/gateway/diagnostics) untuk model privasi dan perilaku
chat grup.

Gunakan `/codex diagnostics [note]` hanya ketika Anda secara khusus menginginkan unggahan
masukan Codex untuk thread yang saat ini dilampirkan tanpa bundel diagnostik Gateway
lengkap.

### Inspeksi thread Codex secara lokal

Cara tercepat untuk memeriksa run Codex yang buruk sering kali adalah membuka thread Codex
native secara langsung:

```bash
codex resume <thread-id>
```

Dapatkan id thread dari balasan `/diagnostics` yang selesai, `/codex binding`, atau
`/codex threads [filter]`.

Untuk mekanisme unggahan dan batas diagnostik tingkat runtime, lihat
[Runtime harness Codex](/id/plugins/codex-harness-runtime#codex-feedback-upload).

Di home per agen default, auth dipilih dalam urutan ini:

1. Profil auth OpenAI berurutan untuk agen, sebaiknya di bawah
   `auth.order.openai`. Jalankan `openclaw doctor --fix` untuk memigrasikan
   id profil auth Codex legacy lama dan urutan auth Codex legacy.
2. Akun server aplikasi yang sudah ada di home Codex agen tersebut.
3. Hanya untuk peluncuran server aplikasi stdio lokal, `CODEX_API_KEY`, lalu
   `OPENAI_API_KEY`, ketika tidak ada akun server aplikasi dan auth OpenAI
   masih diperlukan.

Ketika OpenClaw melihat profil auth Codex bergaya langganan ChatGPT, OpenClaw menghapus
`CODEX_API_KEY` dan `OPENAI_API_KEY` dari proses anak Codex yang dibuat. Itu
membuat kunci API tingkat Gateway tetap tersedia untuk embeddings atau model OpenAI langsung
tanpa membuat giliran server aplikasi Codex native tertagih melalui API secara tidak sengaja.
Profil kunci API Codex eksplisit dan fallback kunci env stdio lokal menggunakan login server aplikasi
alih-alih env proses anak yang diwarisi. Koneksi server aplikasi WebSocket
tidak menerima fallback kunci API env Gateway; gunakan profil auth eksplisit atau akun
milik server aplikasi jarak jauh.
Ketika plugin Codex native dikonfigurasi, OpenClaw memasang atau memperbarui plugin tersebut
melalui server aplikasi yang terhubung sebelum mengekspos aplikasi milik plugin ke
thread Codex. `app/list` tetap menjadi sumber kebenaran untuk id aplikasi,
aksesibilitas, dan metadata, tetapi OpenClaw memiliki keputusan pengaktifan per thread:
jika kebijakan mengizinkan aplikasi terdaftar yang dapat diakses, OpenClaw mengirim
`thread/start.config.apps[appId].enabled = true` bahkan ketika `app/list` saat ini
melaporkan aplikasi tersebut dinonaktifkan. Jalur ini tidak menciptakan instalasi aplikasi untuk
id yang tidak dikenal; OpenClaw hanya mengaktifkan plugin marketplace dengan `plugin/install`
lalu memperbarui inventaris.

Jika profil langganan mencapai batas penggunaan Codex, OpenClaw mencatat waktu reset
ketika Codex melaporkannya dan mencoba profil auth berurutan berikutnya untuk run
Codex yang sama. Ketika waktu reset berlalu, profil langganan kembali memenuhi syarat
tanpa mengubah model `openai/gpt-*` yang dipilih atau runtime Codex.

Untuk peluncuran app-server stdio lokal, OpenClaw menetapkan `CODEX_HOME` ke direktori per agen sehingga konfigurasi Codex, file auth/akun, cache/data plugin, dan status thread native tidak membaca atau menulis `~/.codex` pribadi milik operator secara default. OpenClaw mempertahankan `HOME` proses normal; subproses yang dijalankan Codex tetap dapat menemukan konfigurasi dan token di home pengguna, dan Codex dapat menemukan entri bersama `$HOME/.agents/skills` dan `$HOME/.agents/plugins/marketplace.json`. Dengan `appServer.homeScope: "user"`, OpenClaw sebagai gantinya menggunakan home Codex pengguna native dan akun yang sudah ada tanpa menyuntikkan profil auth OpenClaw.

Jika deployment membutuhkan isolasi lingkungan tambahan, tambahkan variabel tersebut ke `appServer.clearEnv`:

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

`appServer.clearEnv` hanya memengaruhi proses anak app-server Codex yang dijalankan. OpenClaw menghapus `CODEX_HOME` dan `HOME` dari daftar ini selama normalisasi peluncuran lokal: `CODEX_HOME` tetap diarahkan ke cakupan agen atau pengguna yang dipilih, dan `HOME` tetap diwariskan sehingga subproses dapat menggunakan status home pengguna normal.

Alat dinamis Codex secara default menggunakan pemuatan `searchable`. OpenClaw tidak mengekspos alat dinamis yang menduplikasi operasi workspace native Codex: `read`, `write`, `edit`, `apply_patch`, `exec`, `process`, dan `update_plan`. Sebagian besar alat integrasi OpenClaw lain seperti perpesanan, media, cron, browser, node, Gateway, dan `heartbeat_respond` tersedia melalui pencarian alat Codex di bawah namespace `openclaw`, sehingga konteks model awal lebih kecil. Pencarian web menggunakan alat hosted `web_search` milik Codex secara default ketika pencarian diaktifkan dan tidak ada penyedia terkelola yang dipilih. Pencarian hosted native dan alat dinamis `web_search` terkelola milik OpenClaw saling eksklusif sehingga pencarian terkelola tidak dapat melewati pembatasan domain native. OpenClaw menggunakan alat terkelola ketika pencarian hosted tidak tersedia, dinonaktifkan secara eksplisit, atau digantikan oleh penyedia terkelola yang dipilih. OpenClaw tetap menonaktifkan ekstensi mandiri `web.run` milik Codex karena traffic app-server produksi menolak namespace `web` yang ditentukan pengguna. `tools.web.search.enabled: false` menonaktifkan kedua jalur, demikian juga run khusus LLM dengan alat dinonaktifkan. Codex memperlakukan `"cached"` sebagai preferensi dan menyelesaikannya menjadi akses eksternal live untuk giliran app-server tanpa pembatasan. Fallback terkelola otomatis gagal tertutup ketika `allowedDomains` native ditetapkan sehingga allowlist tidak dapat dilewati. Perubahan kebijakan pencarian efektif yang persisten merotasi thread Codex yang terikat sebelum giliran berikutnya. Pembatasan sementara per giliran menggunakan thread terbatas sementara dan mempertahankan binding yang ada untuk dilanjutkan nanti. Balasan sumber khusus `sessions_yield` dan message-tool-only tetap langsung karena itu adalah kontrak kontrol giliran. `sessions_spawn` tetap searchable sehingga `spawn_agent` native milik Codex tetap menjadi permukaan subagen Codex utama, sementara delegasi OpenClaw atau ACP eksplisit tetap tersedia melalui namespace alat dinamis `openclaw`. Instruksi kolaborasi Heartbeat memberi tahu Codex untuk mencari `heartbeat_respond` sebelum mengakhiri giliran Heartbeat ketika alat tersebut belum dimuat.

Tetapkan `codexDynamicToolsLoading: "direct"` hanya ketika terhubung ke app-server Codex kustom yang tidak dapat mencari alat dinamis yang ditangguhkan atau ketika men-debug payload alat penuh.

Bidang plugin Codex tingkat atas yang didukung:

| Bidang                     | Default        | Makna                                                                                         |
| -------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Gunakan `"direct"` untuk menaruh alat dinamis OpenClaw langsung di konteks alat Codex awal.   |
| `codexDynamicToolsExclude` | `[]`           | Nama alat dinamis OpenClaw tambahan yang akan dihilangkan dari giliran app-server Codex.       |
| `codexPlugins`             | dinonaktifkan  | Dukungan plugin/app Codex native untuk plugin kurasi yang dimigrasikan dan dipasang dari sumber. |

Bidang `appServer` yang didukung:

| Bidang                                        | Default                                                | Makna                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` menjalankan Codex; `"websocket"` terhubung ke `url`.                                                                                                                                                                                                                                                                                                                                              |
| `homeScope`                                   | `"agent"`                                              | `"agent"` mengisolasi status Codex per agen OpenClaw. `"user"` membagikan `$CODEX_HOME` native atau `~/.codex`, menggunakan autentikasi native, dan mengaktifkan pengelolaan utas khusus pemilik. Cakupan pengguna memerlukan stdio.                                                                                                                                                                        |
| `command`                                     | biner Codex terkelola                                  | Executable untuk transport stdio. Biarkan tidak disetel untuk menggunakan biner terkelola; setel hanya untuk override eksplisit.                                                                                                                                                                                                                                                                            |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumen untuk transport stdio.                                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | belum disetel                                          | URL app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                                   |
| `authToken`                                   | belum disetel                                          | Token Bearer untuk transport WebSocket. Menerima string literal atau SecretInput seperti `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                                       |
| `headers`                                     | `{}`                                                   | Header WebSocket tambahan. Nilai header menerima string literal atau nilai SecretInput, misalnya `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                                           |
| `clearEnv`                                    | `[]`                                                   | Nama variabel lingkungan tambahan yang dihapus dari proses app-server stdio yang dijalankan setelah OpenClaw membangun lingkungan warisannya. OpenClaw mempertahankan `CODEX_HOME` yang dipilih dan `HOME` yang diwarisi untuk peluncuran lokal.                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Ikut serta ke permukaan alat khusus mode kode milik Codex. Alat dinamis OpenClaw tetap terdaftar dengan Codex sehingga panggilan `tools.*` bertingkat kembali melalui jembatan `item/tool/call` app-server.                                                                                                                                                                                                 |
| `remoteWorkspaceRoot`                         | belum disetel                                          | Root ruang kerja app-server Codex jarak jauh. Saat disetel, OpenClaw menyimpulkan root ruang kerja lokal dari ruang kerja OpenClaw yang telah di-resolve, mempertahankan sufiks cwd saat ini di bawah root jarak jauh ini, dan hanya mengirim cwd app-server final ke Codex. Jika cwd berada di luar root ruang kerja OpenClaw yang telah di-resolve, OpenClaw gagal secara tertutup alih-alih mengirim jalur lokal Gateway ke app-server jarak jauh. |
| `requestTimeoutMs`                            | `60000`                                                | Timeout untuk panggilan control-plane app-server.                                                                                                                                                                                                                                                                                                                                                           |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Jendela senyap setelah Codex menerima giliran atau setelah permintaan app-server bercakupan giliran saat OpenClaw menunggu `turn/completed`.                                                                                                                                                                                                                                                                |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Penjaga idle penyelesaian dan progres yang digunakan setelah serah terima alat, penyelesaian alat native, progres asisten mentah pasca-alat, penyelesaian reasoning mentah, atau progres reasoning saat OpenClaw menunggu `turn/completed`. Gunakan ini untuk beban kerja tepercaya atau berat ketika sintesis pasca-alat secara sah dapat tetap senyap lebih lama daripada anggaran rilis asisten akhir. |
| `mode`                                        | `"yolo"` kecuali persyaratan Codex lokal melarang YOLO | Preset untuk eksekusi YOLO atau yang ditinjau penjaga. Persyaratan stdio lokal yang menghilangkan approval `danger-full-access`, `never`, atau peninjau `user` membuat default implisit menjadi penjaga.                                                                                                                                                                                                     |
| `approvalPolicy`                              | `"never"` atau kebijakan approval penjaga yang diizinkan | Kebijakan approval Codex native yang dikirim ke start/resume/turn utas. Default penjaga memilih `"on-request"` saat diizinkan.                                                                                                                                                                                                                                                                              |
| `sandbox`                                     | `"danger-full-access"` atau sandbox penjaga yang diizinkan | Mode sandbox Codex native yang dikirim ke start/resume utas. Default penjaga memilih `"workspace-write"` saat diizinkan, jika tidak `"read-only"`. Saat sandbox OpenClaw aktif, giliran `danger-full-access` menggunakan Codex `workspace-write` dengan akses jaringan yang diturunkan dari pengaturan egress sandbox OpenClaw.                                                                              |
| `approvalsReviewer`                           | `"user"` atau peninjau penjaga yang diizinkan          | Gunakan `"auto_review"` untuk membiarkan Codex meninjau prompt approval native saat diizinkan, jika tidak `guardian_subagent` atau `user`. `guardian_subagent` tetap menjadi alias lama.                                                                                                                                                                                                                   |
| `serviceTier`                                 | belum disetel                                          | Tier layanan app-server Codex opsional. `"priority"` mengaktifkan perutean mode cepat, `"flex"` meminta pemrosesan fleksibel, `null` menghapus override, dan `"fast"` lama diterima sebagai `"priority"`.                                                                                                                                                                                                   |
| `networkProxy`                                | dinonaktifkan                                          | Ikut serta ke jaringan profil izin Codex untuk perintah app-server. OpenClaw mendefinisikan konfigurasi `permissions.<profile>.network` yang dipilih dan memilihnya dengan `default_permissions` alih-alih mengirim `sandbox`.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Keikutsertaan pratinjau yang mendaftarkan lingkungan Codex berbasis sandbox OpenClaw dengan app-server Codex 0.132.0 atau yang lebih baru sehingga eksekusi Codex native dapat berjalan di dalam sandbox OpenClaw yang aktif.                                                                                                                                                                              |

`appServer.networkProxy` bersifat eksplisit karena mengubah kontrak sandbox
Codex. Saat diaktifkan, OpenClaw juga menetapkan `features.network_proxy.enabled` dan
`default_permissions` dalam konfigurasi utas Codex sehingga profil izin yang
dihasilkan dapat memulai jaringan terkelola Codex. Secara default, OpenClaw menghasilkan
nama profil `openclaw-network-<fingerprint>` yang tahan benturan dari isi
profil; gunakan `profileName` hanya saat nama lokal yang stabil diperlukan.

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
`networkProxy` menggunakan akses filesystem bergaya workspace untuk profil izin
yang dihasilkan. Penegakan jaringan yang dikelola Codex adalah jaringan
tersandbox, sehingga profil akses penuh tidak akan melindungi lalu lintas
keluar. Entri domain menggunakan `allow` atau `deny`; entri soket Unix
menggunakan nilai Codex `allow` atau `none`.

Panggilan alat dinamis milik OpenClaw dibatasi secara independen dari
`appServer.requestTimeoutMs`: permintaan Codex `item/tool/call` menggunakan
watchdog OpenClaw 90 detik secara default. Argumen `timeoutMs` per panggilan
yang positif memperpanjang atau memperpendek anggaran alat spesifik tersebut.
Alat `image_generate` menggunakan
`agents.defaults.imageGenerationModel.timeoutMs` ketika panggilan alat tidak
menyediakan timeout-nya sendiri, atau default pembuatan gambar 120 detik jika
tidak. Alat `image` untuk pemahaman media menggunakan
`tools.media.image.timeoutSeconds` atau default media 60 detiknya. Untuk
pemahaman gambar, timeout tersebut berlaku pada permintaan itu sendiri dan
tidak dikurangi oleh pekerjaan persiapan sebelumnya. Anggaran alat dinamis
dibatasi hingga 600000 md. Saat timeout, OpenClaw membatalkan sinyal alat jika
didukung dan mengembalikan respons alat dinamis yang gagal ke Codex agar turn
dapat berlanjut alih-alih membiarkan sesi dalam status `processing`.
Watchdog ini adalah anggaran luar `item/tool/call` dinamis; timeout permintaan
spesifik penyedia berjalan di dalam panggilan tersebut dan mempertahankan
semantik timeout-nya sendiri.

Setelah Codex menerima sebuah turn, dan setelah OpenClaw merespons permintaan
app-server yang tercakup pada turn, harness mengharapkan Codex membuat kemajuan
turn saat ini dan akhirnya menyelesaikan turn native dengan `turn/completed`.
Jika app-server diam selama `appServer.turnCompletionIdleTimeoutMs`, OpenClaw
berupaya sebaik mungkin menginterupsi turn Codex, mencatat timeout diagnostik,
dan melepaskan lane sesi OpenClaw sehingga pesan chat lanjutan tidak mengantre
di belakang turn native yang basi. Sebagian besar notifikasi non-terminal untuk
turn yang sama menonaktifkan watchdog singkat tersebut karena Codex telah
membuktikan turn masih hidup. Handoff alat menggunakan anggaran diam pasca-alat
yang lebih panjang: setelah OpenClaw mengembalikan respons `item/tool/call`,
setelah item alat native seperti `commandExecution` selesai, setelah penyelesaian
mentah `custom_tool_call_output`, dan setelah kemajuan asisten mentah
pasca-alat, penyelesaian reasoning, atau kemajuan reasoning. Guard menggunakan
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` jika dikonfigurasi dan
default ke lima menit jika tidak. Anggaran pasca-alat yang sama juga
memperpanjang watchdog kemajuan untuk jendela sintesis senyap sebelum Codex
memancarkan event turn saat ini berikutnya. Notifikasi app-server global,
seperti pembaruan batas laju, tidak mereset kemajuan turn-idle. Penyelesaian
reasoning, penyelesaian `agentMessage` commentary, serta kemajuan reasoning
atau asisten mentah pra-alat dapat diikuti oleh balasan final otomatis, sehingga
semuanya menggunakan guard balasan pasca-kemajuan alih-alih langsung melepas
lane sesi. Hanya item `agentMessage` final/non-commentary yang selesai dan
penyelesaian asisten mentah pra-alat yang mengaktifkan pelepasan output
asisten: jika Codex kemudian diam tanpa `turn/completed`, OpenClaw berupaya
sebaik mungkin menginterupsi turn native dan melepas lane sesi. Jika watch turn
lain memenangkan balapan pelepasan tersebut, OpenClaw masih menerima item
asisten final yang selesai setelah tidak ada permintaan native, item, atau
penyelesaian alat dinamis yang tetap aktif dan pelepasan output asisten masih
milik item selesai terbaru, tanpa penyelesaian item yang lebih baru. Ini dapat
mempertahankan jawaban final setelah pekerjaan alat selesai tanpa memutar ulang
turn. Delta asisten parsial, balasan lama yang basi, dan penyelesaian berikutnya
yang kosong tidak memenuhi syarat. Kegagalan app-server stdio yang aman untuk
diputar ulang, termasuk timeout idle penyelesaian turn tanpa bukti asisten,
alat, item aktif, atau efek samping, dicoba ulang sekali pada percobaan
app-server baru. Timeout yang tidak aman tetap memensiunkan klien app-server
yang macet dan melepas lane sesi OpenClaw. Timeout tersebut juga menghapus
binding thread native yang basi alih-alih diputar ulang secara otomatis. Timeout
completion-watch menampilkan teks timeout khusus Codex: kasus yang aman untuk
diputar ulang mengatakan respons mungkin tidak lengkap, sedangkan kasus yang
tidak aman meminta pengguna memverifikasi status saat ini sebelum mencoba ulang.
Diagnostik timeout publik menyertakan field struktural seperti metode notifikasi
app-server terakhir, id/tipe/peran item respons asisten mentah, jumlah
permintaan/item aktif, dan status watch yang aktif. Ketika notifikasi terakhir
adalah item respons asisten mentah, diagnostik juga menyertakan pratinjau teks
asisten yang dibatasi. Diagnostik tidak menyertakan prompt mentah atau konten
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
Config lebih disarankan untuk deployment yang dapat diulang karena menjaga
perilaku Plugin dalam file yang sama-sama ditinjau seperti sisa penyiapan
harness Codex.

## Plugin Codex native

Dukungan Plugin Codex native menggunakan kemampuan app dan Plugin milik
app-server Codex sendiri dalam thread Codex yang sama dengan turn harness
OpenClaw. OpenClaw tidak menerjemahkan Plugin Codex menjadi alat dinamis
OpenClaw sintetis `codex_plugin_*`.

`codexPlugins` hanya memengaruhi sesi yang memilih harness Codex native. Ini
tidak berpengaruh pada run harness bawaan, run penyedia OpenAI normal, binding
percakapan ACP, atau harness lain.

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
turn. Setelah mengubah `codexPlugins`, gunakan `/new`, `/reset`, atau mulai
ulang gateway agar sesi harness Codex mendatang dimulai dengan set app yang
diperbarui.

Untuk kelayakan migrasi, inventaris app, kebijakan tindakan destruktif,
elisitasi, dan diagnostik Plugin native, lihat
[Plugin Codex native](/id/plugins/codex-native-plugins).

Akses app dan Plugin di sisi OpenAI dikendalikan oleh akun Codex yang masuk dan,
untuk workspace Business dan Enterprise/Edu, kontrol app workspace. Lihat
[Menggunakan Codex dengan paket ChatGPT Anda](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
untuk ikhtisar kontrol akun dan workspace OpenAI.

## Penggunaan Komputer

Penggunaan Komputer dibahas dalam panduan penyiapannya sendiri:
[Penggunaan Komputer Codex](/id/plugins/codex-computer-use).

Versi singkatnya: OpenClaw tidak mem-vendor app kontrol desktop atau
mengeksekusi tindakan desktop itu sendiri. OpenClaw menyiapkan app-server Codex,
memverifikasi bahwa server MCP `computer-use` tersedia, lalu membiarkan Codex
memiliki panggilan alat MCP native selama turn mode Codex.

## Batas runtime

Harness Codex hanya mengubah eksekutor agen tertanam level rendah.

- Alat dinamis OpenClaw didukung. Codex meminta OpenClaw mengeksekusi alat
  tersebut, sehingga OpenClaw tetap berada dalam jalur eksekusi.
- Shell, patch, MCP, dan alat app native milik Codex dimiliki oleh Codex.
  OpenClaw dapat mengamati atau memblokir event native tertentu melalui relay
  yang didukung, tetapi tidak menulis ulang argumen alat native.
- Codex memiliki Compaction native. OpenClaw menyimpan cermin transkrip untuk
  riwayat channel, pencarian, `/new`, `/reset`, dan peralihan model atau harness
  di masa depan, tetapi tidak mengganti Compaction Codex dengan peringkas
  OpenClaw atau context-engine.
- Pembuatan media, pemahaman media, TTS, persetujuan, dan output alat pesan
  terus melalui pengaturan penyedia/model OpenClaw yang sesuai.
- `tool_result_persist` berlaku pada hasil alat transkrip milik OpenClaw, bukan
  record hasil alat native Codex.

Untuk layer hook, permukaan V1 yang didukung, penanganan izin native,
pengarahan antrean, mekanisme unggah feedback Codex, dan detail Compaction,
lihat [Runtime harness Codex](/id/plugins/codex-harness-runtime).

## Pemecahan masalah

**Codex tidak muncul sebagai penyedia `/model` normal:** itu diharapkan untuk
config baru. Pilih model `openai/gpt-*`, aktifkan
`plugins.entries.codex.enabled`, dan periksa apakah `plugins.allow` mengecualikan
`codex`.

**OpenClaw menggunakan harness bawaan alih-alih Codex:** pastikan ref model
adalah `openai/gpt-*` pada penyedia OpenAI resmi dan Plugin Codex terinstal
serta aktif. Jika Anda membutuhkan bukti ketat saat pengujian, setel
`agentRuntime.id: "codex"` pada penyedia atau model. Runtime Codex yang dipaksa
akan gagal alih-alih fallback ke OpenClaw.

**Runtime OpenAI Codex fallback ke jalur API-key:** kumpulkan kutipan gateway
yang disunting yang menunjukkan model, runtime, penyedia terpilih, dan
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
`Incorrect API key`, atau `No API key`. Run yang sudah diperbaiki seharusnya
menunjukkan jalur OAuth OpenAI alih-alih kegagalan API-key OpenAI biasa.

**Config ref model Codex legacy masih ada:** jalankan `openclaw doctor --fix`.
Doctor menulis ulang ref model legacy ke `openai/*`, menghapus pin runtime sesi
yang basi dan pin runtime seluruh agen, serta mempertahankan override profil
auth yang ada.

**App-server ditolak:** gunakan app-server Codex `0.125.0` atau lebih baru.
Prerelease versi sama atau versi dengan sufiks build seperti `0.125.0-alpha.2`
atau `0.125.0+custom` ditolak karena OpenClaw menguji lantai protokol stabil
`0.125.0`.

**`/codex status` tidak dapat terhubung:** periksa bahwa Plugin `codex` bawaan
aktif, bahwa `plugins.allow` menyertakannya ketika allowlist dikonfigurasi, dan
bahwa `appServer.command`, `url`, `authToken`, atau header kustom apa pun valid.

**Discovery model lambat:** turunkan
`plugins.entries.codex.config.discovery.timeoutMs` atau nonaktifkan discovery.
Lihat [Referensi harness Codex](/id/plugins/codex-harness-reference#model-discovery).

**Transport WebSocket langsung gagal:** periksa `appServer.url`, `authToken`,
header, dan bahwa app-server jarak jauh menggunakan versi protokol app-server
Codex yang sama.

**Alat shell native atau patch diblokir dengan `Native hook relay unavailable`:**
thread Codex masih mencoba menggunakan id relay hook native yang tidak lagi
terdaftar di OpenClaw. Ini adalah masalah transport hook Codex native, bukan
kegagalan backend ACP, penyedia, GitHub, atau perintah shell. Mulai sesi baru di
chat yang terdampak dengan `/new` atau `/reset`, lalu coba lagi perintah yang
tidak berbahaya. Jika berhasil sekali tetapi panggilan alat native berikutnya
gagal lagi, perlakukan `/new` hanya sebagai solusi sementara: salin prompt ke
sesi baru setelah memulai ulang app-server Codex atau OpenClaw Gateway agar
thread lama dibuang dan pendaftaran hook native dibuat ulang.

**Model non-Codex menggunakan harness bawaan:** itu sesuai harapan kecuali
kebijakan runtime penyedia atau model merutekannya ke harness lain. Ref penyedia
non-OpenAI biasa tetap berada di jalur penyedia normalnya dalam mode `auto`.

**Computer Use terinstal tetapi alat tidak berjalan:** periksa
`/codex computer-use status` dari sesi baru. Jika alat melaporkan
`Native hook relay unavailable`, gunakan pemulihan relay hook native di atas.
Lihat [Codex Computer Use](/id/plugins/codex-computer-use#troubleshooting).

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
