---
read_when:
    - Anda menginginkan fallback yang andal ketika penyedia API gagal
    - Anda menjalankan CLI AI lokal dan ingin menggunakannya kembali
    - Anda ingin memahami jembatan loopback MCP untuk akses alat backend CLI
summary: 'Backend CLI: fallback CLI AI lokal dengan bridge alat MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-07-20T03:51:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d71300fa7383b021ee12bdeafedfc48cb9f0d7746a02efff5e609544c7b4b081
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw dapat menjalankan CLI AI lokal sebagai fallback khusus teks ketika penyedia API tidak aktif, dibatasi laju, atau bermasalah. Pendekatan ini sengaja dibuat konservatif:

- Alat OpenClaw tidak diinjeksi secara langsung, tetapi backend dengan `bundleMcp: true` dapat menerima alat Gateway melalui jembatan MCP loopback.
- Streaming JSONL untuk CLI yang mendukungnya.
- Sesi didukung, sehingga giliran lanjutan tetap koheren.
- Gambar diteruskan jika CLI menerima jalur gambar.

Gunakan sebagai jaring pengaman untuk respons teks yang "selalu berfungsi", bukan sebagai jalur utama. Untuk runtime harness lengkap dengan kontrol sesi ACP, tugas latar belakang, pengikatan utas/percakapan, dan sesi pengodean eksternal persisten, gunakan [Agen ACP](/id/tools/acp-agents); backend CLI bukan ACP.

<Tip>
  Membuat plugin backend baru? Lihat [Plugin backend CLI](/id/plugins/cli-backend-plugins). Halaman ini membahas konfigurasi dan pengoperasian backend yang sudah terdaftar.
</Tip>

## Mulai cepat

Plugin Anthropic bawaan mendaftarkan backend `claude-cli` default, sehingga dapat digunakan tanpa konfigurasi selain memasang Claude Code dan masuk ke akun:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` adalah id agen default ketika tidak ada daftar agen eksplisit yang dikonfigurasi; jika tidak, ganti dengan id agen Anda sendiri.

Jika Gateway berjalan di bawah launchd/systemd dengan `PATH` minimal, tentukan biner secara eksplisit:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

Jika Anda menggunakan backend CLI bawaan sebagai penyedia pesan utama pada host Gateway, OpenClaw secara otomatis memuat plugin bawaan pemiliknya ketika konfigurasi Anda merujuk backend tersebut dalam referensi model atau di bawah `agents.defaults.cliBackends`.

## Menggunakannya sebagai fallback

Tambahkan backend CLI ke daftar fallback agar hanya berjalan ketika model utama gagal:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

Fallback yang dikonfigurasi tetap memenuhi syarat ketika penyedia utama gagal (autentikasi, batas laju, batas waktu), meskipun tidak tercantum dalam `agents.defaults.modelPolicy.allow`. Tambahkan model backend CLI ke kebijakan tersebut hanya ketika pengguna juga harus dapat memilihnya secara langsung melalui `/model`, penggantian sesi, atau `--model`. `agents.defaults.models` hanya mengelola alias, parameter, dan metadata per model.

## Konfigurasi

Semua backend CLI berada di bawah `agents.defaults.cliBackends`, dengan kunci berupa id penyedia (misalnya `claude-cli`, `my-cli`). Id penyedia menjadi sisi kiri referensi model: `<provider>/<model>`.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // Flag khusus untuk file prompt:
          // systemPromptFileArg: "--system-file",
          // Atau gunakan flag penggantian konfigurasi bergaya Codex:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Aktifkan hanya jika backend ini boleh menyemai ulang sesi yang dibatalkan dari
          // riwayat transkrip mentah OpenClaw yang dibatasi sebelum compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Cara kerjanya

1. Memilih backend berdasarkan prefiks penyedia (`claude-cli/...`).
2. Membuat prompt sistem menggunakan prompt OpenClaw dan konteks ruang kerja yang sama.
3. Menjalankan CLI dengan id sesi (jika didukung) agar riwayat tetap konsisten. Backend `claude-cli` bawaan mempertahankan proses stdio Claude tetap aktif untuk setiap sesi OpenClaw dan mengirim giliran lanjutan melalui stdin stream-json.
4. Mengurai keluaran (JSON atau teks biasa) dan mengembalikan teks akhir.
5. Menyimpan id sesi per backend agar giliran lanjutan menggunakan kembali sesi CLI yang sama.

## Batas waktu dan pekerjaan jangka panjang

Backend CLI memiliki dua batas independen:

- `agents.defaults.timeoutSeconds` membatasi keseluruhan giliran agen. Giliran Gateway normal mewarisi nilai default 48 jam; `0` membuat anggaran giliran tidak terbatas. Penggantian yang tersimpan seperti `600` menggantikan nilai default tersebut.
- Pengawas tanpa keluaran CLI menghentikan subproses yang tetap tidak mengeluarkan apa pun. Pengawas ini menggunakan profil baru/lanjutan terpisah di bawah `agents.defaults.cliBackends.<id>.reliability.watchdog` dan tetap aktif meskipun anggaran giliran keseluruhan tidak terbatas.

Hapus penggantian batas waktu keseluruhan yang singkat untuk kembali ke nilai default 48 jam, atau tetapkan anggaran eksplisit seperti 12 jam:

```bash
# Kembali ke nilai default 48 jam:
openclaw config unset agents.defaults.timeoutSeconds

# Atau pilih batas eksplisit 12 jam:
openclaw config set agents.defaults.timeoutSeconds 43200
```

Pekerjaan latar belakang yang dimulai di dalam CLI tetap menjadi bagian dari subproses CLI tersebut. Jika giliran induk mencapai batas keseluruhannya, OpenClaw menghentikan subproses beserta tugas latar belakang internal CLI secara bersamaan. Untuk pekerjaan panjang yang tahan lama, gunakan [subagen](/id/tools/subagents) OpenClaw terpisah atau [agen ACP](/id/tools/acp-agents); subagen terpisah secara default tidak memiliki batas waktu eksekusi.

Perintah `openclaw agent` juga memiliki tenggat permintaan sendiri. Nilai fallback default 600 detiknya berlaku untuk pemanggilan perintah tersebut, bukan untuk giliran Gateway biasa; lihat [`openclaw agent`](/id/cli/agent).

### Detail khusus Claude CLI

Backend `claude-cli` bawaan mengutamakan resolver keterampilan native Claude Code. Ketika snapshot keterampilan saat ini memiliki setidaknya satu keterampilan terpilih dengan jalur yang telah dimaterialisasi, OpenClaw meneruskan plugin Claude Code sementara melalui `--plugin-dir` dan menghilangkan katalog keterampilan OpenClaw duplikat dari prompt sistem yang ditambahkan. Tanpa keterampilan plugin yang dimaterialisasi, OpenClaw mempertahankan katalog prompt sebagai fallback. Penggantian variabel lingkungan/kunci API keterampilan tetap diterapkan ke lingkungan proses anak selama eksekusi.

Claude CLI memiliki mode izin noninteraktifnya sendiri; OpenClaw memetakannya ke kebijakan exec yang ada alih-alih menambahkan konfigurasi khusus Claude. Untuk sesi langsung Claude yang dikelola OpenClaw, kebijakan exec efektif bersifat otoritatif: YOLO (`tools.exec.security: "full"` dan `tools.exec.ask: "off"`) biasanya menjalankan Claude dengan `--permission-mode bypassPermissions`, sedangkan kebijakan yang restriktif menjalankannya dengan `--permission-mode default`. Gateway yang dijalankan sebagai root juga menggunakan `default` karena Claude Code menolak mode bypass untuk root; OpenClaw tetap menjawab permintaan kontrol alat stdio Claude berdasarkan kebijakan exec yang dikonfigurasi. Pengaturan `agents.list[].tools.exec` per agen menggantikan `tools.exec` global untuk agen tersebut. Argumen backend mentah masih dapat menyertakan `--permission-mode`, tetapi peluncuran Claude langsung menormalkan flag tersebut agar sesuai dengan kebijakan efektif dan pembatasan host.

Backend juga memetakan tingkat `/think` OpenClaw ke flag `--effort` native Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, dan `high`/`xhigh`/`max` diteruskan secara langsung. Ini menjaga agar tingkat upaya Fable 5 yang didukung tetap sama untuk Claude CLI berbasis langganan dan rute kunci API. `adaptive` menghapus flag `--effort` yang dikonfigurasi dan tidak memberikan pengganti, sehingga Claude Code menentukan upaya efektif dari lingkungan, pengaturan, dan nilai default modelnya sendiri. Backend CLI lain memerlukan plugin pemiliknya untuk mendeklarasikan pemeta argv yang setara sebelum `/think` memengaruhi CLI yang dijalankan.

Sebelum OpenClaw dapat menggunakan `claude-cli`, Claude Code sendiri harus sudah masuk ke akun pada host yang sama:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Instalasi Docker mengharuskan Claude Code dipasang dan masuk ke akun di dalam home kontainer yang dipersistenkan, bukan hanya pada host; lihat [Backend Claude CLI di Docker](/id/install/docker#claude-cli-backend-in-docker).

Tetapkan `agents.defaults.cliBackends.claude-cli.command` hanya ketika biner `claude` belum tersedia di `PATH`.

## Sesi

- Jika CLI mendukung sesi, tetapkan `sessionArg` (misalnya `--session-id`), atau `sessionArgs` (placeholder `{sessionId}`) ketika id perlu ditempatkan dalam beberapa flag.
- Jika CLI menggunakan subperintah lanjutan dengan flag berbeda, tetapkan `resumeArgs` (menggantikan `args` saat melanjutkan) dan secara opsional `resumeOutput` untuk proses lanjutan non-JSON.
- `sessionMode`:
  - `always`: selalu kirim id sesi (UUID baru jika tidak ada yang tersimpan).
  - `existing`: hanya kirim id sesi jika sebelumnya sudah tersimpan.
  - `none`: jangan pernah mengirim id sesi.
- `claude-cli` secara default menggunakan `liveSession: "claude-stdio"`, `output: "jsonl"`, dan `input: "stdin"`, sehingga giliran lanjutan menggunakan kembali proses Claude langsung selama proses tersebut aktif, termasuk untuk konfigurasi khusus yang tidak menyertakan bidang transportasi. Jika Gateway dimulai ulang atau proses menganggur berhenti, OpenClaw melanjutkan dari id sesi Claude yang tersimpan. Id sesi yang tersimpan diverifikasi terhadap transkrip proyek yang dapat dibaca sebelum dilanjutkan; transkrip yang hilang menghapus pengikatan (dicatat sebagai `reason=transcript-missing`) alih-alih diam-diam memulai sesi baru di bawah `--resume`.
- Sesi langsung Claude mempertahankan pelindung keluaran JSONL yang dibatasi: 8 MiB dan 20.000 baris JSONL mentah per giliran.
- Sesi CLI yang tersimpan merupakan kontinuitas milik penyedia. Reset otomatis dinonaktifkan secara default; `/reset` dan kebijakan harian atau menganggur `session.reset` yang eksplisit tetap memutuskannya.
- Sesi CLI baru biasanya hanya disemai ulang dari ringkasan compaction OpenClaw beserta bagian setelah compaction. Untuk memulihkan sesi singkat yang dibatalkan sebelum compaction, backend dapat mengaktifkan `reseedFromRawTranscriptWhenUncompacted: true`. Penyemaian ulang transkrip mentah tetap dibatasi dan hanya berlaku untuk pembatalan yang aman, seperti transkrip CLI yang hilang, bagian akhir penggunaan alat yang yatim, perubahan kebijakan pesan/prompt sistem/cwd/MCP, atau percobaan ulang karena sesi kedaluwarsa; perubahan profil autentikasi atau epoch kredensial tidak pernah menyemai ulang riwayat transkrip mentah.

Serialisasi: `serialize: true` menjaga urutan eksekusi pada jalur yang sama (sebagian besar CLI melakukan serialisasi pada satu jalur penyedia). OpenClaw juga menghentikan penggunaan kembali sesi CLI yang tersimpan ketika identitas autentikasi yang dipilih berubah, termasuk perubahan id profil autentikasi, kunci API statis, token statis, atau identitas akun OAuth jika CLI mengeksposnya; rotasi token akses/refresh OAuth saja tidak memutus sesi. Jika CLI tidak memiliki id akun OAuth yang stabil, OpenClaw membiarkan CLI tersebut menerapkan izin pelanjutannya sendiri.

## Pendahuluan fallback dari sesi claude-cli

Ketika percobaan `claude-cli` beralih karena kegagalan ke kandidat non-CLI dalam [`agents.defaults.model.fallbacks`](/id/concepts/model-failover), OpenClaw menyemai percobaan berikutnya dengan pendahuluan konteks yang diambil dari transkrip JSONL lokal Claude Code (di bawah `~/.claude/projects/`, dengan kunci per ruang kerja). Tanpa semaian ini, penyedia fallback memulai tanpa konteks, karena transkrip sesi OpenClaw sendiri kosong untuk eksekusi `claude-cli`.

- Prelude memprioritaskan ringkasan `/compact` terbaru atau penanda `compact_boundary`, lalu menambahkan giliran terbaru setelah batas hingga mencapai batas karakter. Giliran sebelum batas dibuang karena sudah direpresentasikan oleh ringkasan.
- Blok alat digabungkan menjadi petunjuk ringkas `(tool call: name)` dan `(tool result: …)` agar anggaran prompt tetap akurat; ringkasan yang terlalu besar dipangkas dan diberi label `(truncated)`.
- Fallback dari `claude-cli` ke `claude-cli` dalam penyedia yang sama mengandalkan `--resume` milik Claude sendiri dan melewati prelude.
- Seed menggunakan kembali validasi jalur file sesi Claude yang sudah ada, sehingga jalur sembarang tidak dapat dibaca.

## Gambar

Jika CLI Anda menerima jalur gambar, atur `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw menulis gambar base64 ke file sementara. Jika `imageArg` diatur, jalur tersebut diteruskan sebagai argumen CLI; jika tidak, OpenClaw menambahkan jalur file ke prompt (injeksi jalur), yang berfungsi untuk CLI yang otomatis memuat file lokal dari jalur teks biasa.

## Masukan dan keluaran

- `output: "text"` (default) memperlakukan stdout sebagai respons akhir.
- `output: "json"` mencoba mengurai JSON dan mengekstrak teks beserta ID sesi.
- `output: "jsonl"` mengurai aliran JSONL dan mengekstrak pesan agen terakhir beserta pengidentifikasi sesi jika tersedia.
- Untuk keluaran JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan penggunaan dari `stats` ketika `usage` tidak ada atau kosong. Default Gemini CLI bawaan menggunakan `stream-json`; penggantian lama `--output-format json` masih menggunakan pengurai JSON.

Mode masukan:

- `input: "arg"` (default) meneruskan prompt sebagai argumen CLI terakhir.
- `input: "stdin"` mengirimkan prompt melalui stdin.
- Jika prompt sangat panjang dan `maxPromptArgChars` diatur, stdin akan digunakan sebagai gantinya.

## Default milik Plugin

Default backend CLI merupakan bagian dari permukaan Plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- Backend `id` menjadi prefiks penyedia dalam referensi model.
- Konfigurasi pengguna dalam `agents.defaults.cliBackends.<id>` tetap menggantikan default Plugin.
- Pembersihan konfigurasi khusus backend tetap dimiliki Plugin melalui hook opsional `normalizeConfig`.

Anthropic memiliki `claude-cli` dan Google memiliki `google-gemini-cli`. Proses agen OpenAI Codex menggunakan harness app-server Codex melalui `openai/*`; OpenClaw tidak lagi mendaftarkan backend bawaan `codex-cli`.

Plugin Anthropic bawaan mendaftar untuk `claude-cli`:

| Kunci                 | Nilai                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArg`          | `--session-id`                                                                                                                                                                                                |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

Plugin Google bawaan mendaftar untuk `google-gemini-cli`:

| Kunci                     | Nilai                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | sama, dengan `--resume {sessionId}`                                                      |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Prasyarat: Gemini CLI lokal harus terinstal dan tersedia di `PATH` sebagai `gemini` (`brew install gemini-cli` atau `npm install -g @google/gemini-cli`).

Catatan keluaran Gemini CLI:

- Pengurai default `stream-json` membaca peristiwa `message` asisten, peristiwa alat, penggunaan akhir `result`, dan peristiwa kesalahan fatal Gemini.
- Jika Anda mengganti argumen Gemini menjadi `--output-format json`, OpenClaw menormalkan backend tersebut kembali menjadi `output: "json"` dan membaca teks balasan dari bidang JSON `response`.
- Penggunaan beralih ke `stats` ketika `usage` tidak ada atau kosong; `stats.cached` dinormalkan menjadi `cacheRead` OpenClaw, dan jika `stats.input` tidak ada, token masukan diturunkan dari `stats.input_tokens - stats.cached`.

Ganti default hanya jika diperlukan (paling umum berupa jalur absolut `command`).

## Overlay transformasi teks

Plugin yang memerlukan shim kompatibilitas kecil untuk prompt/pesan dapat mendeklarasikan transformasi teks dua arah tanpa mengganti penyedia atau backend CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` menulis ulang prompt sistem dan prompt pengguna yang diteruskan ke CLI. `output` menulis ulang teks asisten yang dialirkan dan teks akhir yang diurai sebelum OpenClaw menangani penanda kontrolnya sendiri dan pengiriman kanal; untuk panggilan model berbasis penyedia, ini juga memulihkan nilai string di dalam argumen panggilan alat terstruktur setelah perbaikan aliran dan sebelum eksekusi alat. Fragmen JSON mentah dari penyedia dibiarkan tidak berubah; konsumen harus menggunakan payload parsial, akhir, atau hasil yang terstruktur.

Untuk CLI yang menghasilkan peristiwa JSONL khusus penyedia, atur `jsonlDialect` pada konfigurasi backend tersebut: `claude-stream-json` untuk aliran yang kompatibel dengan Claude Code, `gemini-stream-json` untuk peristiwa `stream-json` Gemini CLI.

## Kepemilikan Compaction native

Beberapa backend CLI menjalankan agen yang memadatkan transkripnya sendiri, sehingga OpenClaw tidak boleh menjalankan peringkas pengamannya terhadap backend tersebut—melakukannya akan bertentangan dengan Compaction milik backend dan dapat menyebabkan giliran gagal total.

`claude-cli` tidak memiliki endpoint harness (Claude Code melakukan Compaction secara internal), sehingga mendeklarasikan `ownsNativeCompaction: true` dan jalur Compaction OpenClaw mengembalikan entri sesi tanpa perubahan. OpenClaw meneruskan anggaran konteks efektif proses melalui [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) yang didokumentasikan Claude Code, sehingga Compaction otomatis native tetap selaras dengan batas `contextTokens` Anthropic yang dikonfigurasi. Sesi harness native seperti Codex tetap dirutekan ke endpoint Compaction harness masing-masing.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Hanya deklarasikan `ownsNativeCompaction` untuk backend yang benar-benar memiliki Compaction: backend tersebut harus secara andal membatasi transkripnya sendiri mendekati jendela konteks dan menyimpan sesi yang dapat dilanjutkan (misalnya `--resume` / `--session-id`), atau sesi yang ditangguhkan dapat tetap melampaui anggaran.

## Overlay MCP bundel

Backend CLI tidak menerima panggilan alat OpenClaw secara langsung, tetapi backend dapat memilih untuk menggunakan overlay konfigurasi MCP yang dihasilkan dengan `bundleMcp: true`. Perilaku bawaan saat ini:

- `claude-cli`: file konfigurasi MCP ketat yang dihasilkan.
- `google-gemini-cli`: file pengaturan sistem Gemini yang dihasilkan.

Saat MCP bundel diaktifkan, OpenClaw:

- menjalankan server MCP HTTP loopback yang mengekspos alat Gateway kepada proses CLI, diautentikasi dengan pemberian konteks per proses (`OPENCLAW_MCP_TOKEN`) yang hanya aktif untuk upaya eksekusi saat ini;
- mengikat akses alat ke konteks sesi, akun, dan kanal yang dipilih Gateway, alih-alih memercayai header proses anak;
- memuat server MCP bundel yang diaktifkan untuk ruang kerja saat ini dan menggabungkannya dengan bentuk konfigurasi/pengaturan MCP backend yang sudah ada;
- menulis ulang konfigurasi peluncuran menggunakan mode integrasi milik backend dari Plugin pemiliknya.

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menyuntikkan konfigurasi ketat ketika backend memilih MCP bundel, sehingga proses latar belakang tetap terisolasi.

Runtime MCP bawaan dengan cakupan sesi disimpan dalam cache untuk digunakan kembali di dalam sesi, lalu dihentikan setelah 10 menit tidak aktif. Proses tersemat sekali jalan seperti probe autentikasi, pembuatan slug, dan pengambilan kembali active-memory meminta pembersihan pada akhir proses agar proses anak stdio serta aliran HTTP/SSE yang dapat dialirkan tidak bertahan lebih lama daripada proses tersebut.

## Batas riwayat reseed

Ketika sesi CLI baru diinisialisasi dari transkrip OpenClaw sebelumnya (misalnya setelah percobaan ulang `session_expired`), blok `<conversation_history>` yang dirender dibatasi agar prompt inisialisasi ulang tidak membengkak. Nilai defaultnya adalah 12.288 karakter (sekitar 3.000 token).

Backend CLI Claude menyesuaikan batas ini berdasarkan jendela konteks Claude yang telah ditentukan: jendela konteks yang lebih besar mendapatkan potongan riwayat sebelumnya yang lebih besar, hingga batas maksimum tetap; backend CLI lainnya mempertahankan nilai default yang konservatif. Batas ini hanya mengatur blok riwayat sebelumnya pada prompt inisialisasi ulang.

## Keterbatasan

- Tidak ada pemanggilan alat OpenClaw secara langsung: OpenClaw tidak menyisipkan pemanggilan alat ke dalam protokol backend CLI. Backend hanya melihat alat Gateway saat memilih untuk menggunakan `bundleMcp: true`.
- Streaming bergantung pada backend: beberapa backend melakukan streaming JSONL, sedangkan yang lain menampung data hingga proses selesai.
- Keluaran terstruktur bergantung pada format JSON milik CLI sendiri.

## Pemecahan masalah

| Gejala                   | Perbaikan                                                                   |
| ------------------------ | --------------------------------------------------------------------------- |
| CLI tidak ditemukan      | Tetapkan `command` ke path lengkap.                                |
| Nama model salah         | Gunakan `modelAliases` untuk memetakan `provider/model` ke id model CLI. |
| Tidak ada kontinuitas sesi | Pastikan `sessionArg` telah ditetapkan dan `sessionMode` bukan `none`. |
| Gambar diabaikan         | Tetapkan `imageArg` dan pastikan CLI mendukung path file.           |

## Terkait

- [Panduan operasional Gateway](/id/gateway)
- [Model lokal](/id/gateway/local-models)
