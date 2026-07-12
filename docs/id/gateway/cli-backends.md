---
read_when:
    - Anda menginginkan cadangan yang andal saat penyedia API gagal
    - Anda menjalankan CLI AI lokal dan ingin menggunakannya kembali
    - Anda ingin memahami jembatan local loopback MCP untuk akses alat backend CLI
summary: 'Backend CLI: fallback CLI AI lokal dengan jembatan alat MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-07-12T14:11:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw dapat menjalankan CLI AI lokal sebagai cadangan khusus teks ketika penyedia API tidak tersedia, terkena pembatasan laju, atau bermasalah. Pendekatan ini sengaja dibuat konservatif:

- Alat OpenClaw tidak disuntikkan secara langsung, tetapi backend dengan `bundleMcp: true` dapat menerima alat Gateway melalui jembatan MCP local loopback.
- Streaming JSONL untuk CLI yang mendukungnya.
- Sesi didukung, sehingga giliran lanjutan tetap koheren.
- Gambar diteruskan jika CLI menerima jalur gambar.

Gunakan sebagai jaring pengaman untuk respons teks yang "selalu berfungsi", bukan sebagai jalur utama. Untuk runtime harness lengkap dengan kontrol sesi ACP, tugas latar belakang, pengikatan utas/percakapan, dan sesi pengodean eksternal yang persisten, gunakan [Agen ACP](/id/tools/acp-agents); backend CLI bukan ACP.

<Tip>
  Membuat Plugin backend baru? Lihat [Plugin backend CLI](/id/plugins/cli-backend-plugins). Halaman ini membahas konfigurasi dan pengoperasian backend yang sudah terdaftar.
</Tip>

## Mulai cepat

Plugin Anthropic bawaan mendaftarkan backend `claude-cli` default, sehingga dapat digunakan tanpa konfigurasi selain memasang Claude Code dan masuk ke akun:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` adalah id agen default ketika tidak ada daftar agen eksplisit yang dikonfigurasi; jika ada, ganti dengan id agen Anda sendiri.

Jika Gateway berjalan di bawah launchd/systemd dengan `PATH` minimal, arahkan ke biner secara eksplisit:

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

Jika Anda menggunakan backend CLI bawaan sebagai penyedia pesan utama pada host Gateway, OpenClaw secara otomatis memuat Plugin bawaan pemiliknya ketika konfigurasi Anda merujuk backend tersebut dalam referensi model atau di bawah `agents.defaults.cliBackends`.

## Menggunakannya sebagai cadangan

Tambahkan backend CLI ke daftar cadangan agar hanya berjalan ketika model utama gagal:

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

Jika Anda menggunakan `agents.defaults.models` sebagai daftar izin, sertakan juga model backend CLI Anda di sana. Ketika penyedia utama gagal (autentikasi, pembatasan laju, batas waktu), OpenClaw selanjutnya mencoba backend CLI.

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
          // Flag khusus untuk berkas prompt:
          // systemPromptFileArg: "--system-file",
          // Sebagai gantinya, flag penggantian konfigurasi bergaya Codex:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Aktifkan hanya jika backend ini boleh mengisi ulang sesi yang dibatalkan dari
          // riwayat transkrip mentah OpenClaw yang dibatasi sebelum Compaction.
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
2. Membuat prompt sistem menggunakan prompt dan konteks ruang kerja OpenClaw yang sama.
3. Menjalankan CLI dengan id sesi (jika didukung) agar riwayat tetap konsisten. Backend `claude-cli` bawaan mempertahankan satu proses stdio Claude tetap aktif per sesi OpenClaw dan mengirim giliran lanjutan melalui stdin stream-json.
4. Mengurai keluaran (JSON atau teks biasa) dan mengembalikan teks akhir.
5. Menyimpan id sesi per backend agar tindak lanjut menggunakan kembali sesi CLI yang sama.

### Hal khusus pada Claude CLI

Backend `claude-cli` bawaan mengutamakan penyelesai skill native Claude Code. Ketika snapshot Skills saat ini memiliki setidaknya satu skill terpilih dengan jalur yang telah diwujudkan, OpenClaw meneruskan Plugin Claude Code sementara melalui `--plugin-dir` dan menghilangkan katalog Skills OpenClaw duplikat dari prompt sistem yang ditambahkan. Tanpa skill Plugin yang telah diwujudkan, OpenClaw mempertahankan katalog prompt sebagai cadangan. Penggantian variabel lingkungan/kunci API skill tetap diterapkan ke lingkungan proses anak untuk eksekusi tersebut.

Claude CLI memiliki mode izin noninteraktifnya sendiri; OpenClaw memetakannya ke kebijakan eksekusi yang sudah ada, bukan menambahkan konfigurasi khusus Claude. Untuk sesi langsung Claude yang dikelola OpenClaw, kebijakan eksekusi efektif bersifat menentukan: YOLO (`tools.exec.security: "full"` dan `tools.exec.ask: "off"`) menjalankan Claude dengan `--permission-mode bypassPermissions`, sedangkan kebijakan yang membatasi menjalankannya dengan `--permission-mode default`. Pengaturan `agents.list[].tools.exec` per agen menggantikan `tools.exec` global untuk agen tersebut. Argumen backend mentah tetap dapat menyertakan `--permission-mode`, tetapi peluncuran langsung Claude menormalkan flag tersebut agar sesuai dengan kebijakan efektif.

Backend juga memetakan level `/think` OpenClaw ke flag native `--effort` milik Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, dan `high`/`xhigh`/`max` diteruskan secara langsung. `adaptive` menghapus flag `--effort` yang dikonfigurasi dan tidak memberikan pengganti, sehingga Claude Code menentukan upaya efektif dari lingkungan, pengaturan, dan default modelnya sendiri. Backend CLI lain memerlukan Plugin pemiliknya untuk mendeklarasikan pemeta argv yang setara sebelum `/think` memengaruhi CLI yang dijalankan.

Sebelum OpenClaw dapat menggunakan `claude-cli`, Claude Code sendiri harus sudah masuk ke akun pada host yang sama:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Instalasi Docker mengharuskan Claude Code dipasang dan sudah masuk ke akun di dalam direktori home kontainer yang dipertahankan, bukan hanya pada host; lihat [Backend Claude CLI di Docker](/id/install/docker#claude-cli-backend-in-docker).

Atur `agents.defaults.cliBackends.claude-cli.command` hanya ketika biner `claude` belum tersedia di `PATH`.

## Sesi

- Jika CLI mendukung sesi, atur `sessionArg` (misalnya `--session-id`), atau `sessionArgs` (placeholder `{sessionId}`) ketika id perlu ditempatkan pada beberapa flag.
- Jika CLI menggunakan subperintah pelanjutan dengan flag berbeda, atur `resumeArgs` (menggantikan `args` saat melanjutkan) dan secara opsional `resumeOutput` untuk pelanjutan non-JSON.
- `sessionMode`:
  - `always`: selalu kirim id sesi (UUID baru jika belum ada yang tersimpan).
  - `existing`: hanya kirim id sesi jika sebelumnya sudah tersimpan.
  - `none`: jangan pernah kirim id sesi.
- `claude-cli` secara default menggunakan `liveSession: "claude-stdio"`, `output: "jsonl"`, dan `input: "stdin"`, sehingga giliran lanjutan menggunakan kembali proses Claude yang aktif selama proses tersebut masih berjalan, termasuk untuk konfigurasi khusus yang menghilangkan bidang transportasi. Jika Gateway dimulai ulang atau proses menganggur berhenti, OpenClaw melanjutkan dari id sesi Claude yang tersimpan. Id sesi yang tersimpan diverifikasi terhadap transkrip proyek yang dapat dibaca sebelum dilanjutkan; transkrip yang tidak ada akan menghapus pengikatan (dicatat sebagai `reason=transcript-missing`), alih-alih diam-diam memulai sesi baru dengan `--resume`.
- Sesi langsung Claude mempertahankan batas keluaran JSONL: 8 MiB dan 20.000 baris JSONL mentah per giliran secara default. Naikkan per backend dengan `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` dan `maxTurnLines`; OpenClaw membatasi pengaturan tersebut hingga 64 MiB dan 100.000 baris.
- Sesi CLI yang tersimpan merupakan kontinuitas milik penyedia. Pengaturan ulang sesi harian implisit tidak memutusnya; `/reset` dan kebijakan `session.reset` eksplisit tetap memutusnya.
- Sesi CLI baru biasanya hanya diisi ulang dari ringkasan Compaction OpenClaw beserta bagian setelah Compaction. Untuk memulihkan sesi pendek yang dibatalkan sebelum Compaction, backend dapat mengaktifkan `reseedFromRawTranscriptWhenUncompacted: true`. Pengisian ulang transkrip mentah tetap dibatasi dan hanya berlaku untuk pembatalan yang aman, seperti transkrip CLI yang hilang, bagian akhir penggunaan alat yang terputus, perubahan kebijakan pesan/prompt sistem/cwd/MCP, atau percobaan ulang sesi yang kedaluwarsa; perubahan profil autentikasi atau periode kredensial tidak pernah mengisi ulang riwayat transkrip mentah.

Serialisasi: `serialize: true` menjaga agar eksekusi pada jalur yang sama tetap berurutan (sebagian besar CLI melakukan serialisasi pada satu jalur penyedia). OpenClaw juga membatalkan penggunaan kembali sesi CLI yang tersimpan ketika identitas autentikasi yang dipilih berubah, termasuk perubahan id profil autentikasi, kunci API statis, token statis, atau identitas akun OAuth ketika CLI mengeksposnya; rotasi token akses/penyegaran OAuth saja tidak memutus sesi. Jika CLI tidak memiliki id akun OAuth yang stabil, OpenClaw membiarkan CLI tersebut menerapkan izin pelanjutannya sendiri.

## Pendahuluan cadangan dari sesi claude-cli

Ketika percobaan `claude-cli` beralih karena kegagalan ke kandidat non-CLI dalam [`agents.defaults.model.fallbacks`](/id/concepts/model-failover), OpenClaw membekali percobaan berikutnya dengan pendahuluan konteks yang diambil dari transkrip JSONL lokal Claude Code (di bawah `~/.claude/projects/`, dengan kunci per ruang kerja). Tanpa bekal ini, penyedia cadangan dimulai tanpa konteks, karena transkrip sesi OpenClaw sendiri kosong untuk eksekusi `claude-cli`.

- Pendahuluan mengutamakan ringkasan `/compact` terbaru atau penanda `compact_boundary`, lalu menambahkan giliran terbaru setelah batas tersebut hingga mencapai anggaran karakter. Giliran sebelum batas dibuang karena ringkasan sudah merepresentasikannya.
- Blok alat digabungkan menjadi petunjuk ringkas `(pemanggilan alat: nama)` dan `(hasil alat: …)` agar anggaran prompt tetap akurat; ringkasan yang terlalu besar dipotong dan diberi label `(dipotong)`.
- Peralihan cadangan dari `claude-cli` ke `claude-cli` dengan penyedia yang sama mengandalkan `--resume` milik Claude dan melewati pendahuluan.
- Bekal tersebut menggunakan kembali validasi jalur berkas sesi Claude yang sudah ada, sehingga jalur sembarang tidak dapat dibaca.

## Gambar

Jika CLI Anda menerima jalur gambar, atur `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw menulis gambar base64 ke berkas sementara. Jika `imageArg` diatur, jalur tersebut diteruskan sebagai argumen CLI; jika tidak, OpenClaw menambahkan jalur berkas ke prompt (injeksi jalur), yang berfungsi untuk CLI yang secara otomatis memuat berkas lokal dari jalur biasa.

## Masukan dan keluaran

- `output: "text"` (default) memperlakukan stdout sebagai respons akhir.
- `output: "json"` mencoba mengurai JSON dan mengekstrak teks serta id sesi.
- `output: "jsonl"` mengurai aliran JSONL dan mengekstrak pesan agen akhir beserta pengenal sesi jika ada.
- Untuk keluaran JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan penggunaan dari `stats` ketika `usage` tidak ada atau kosong. Default Gemini CLI bawaan menggunakan `stream-json`; penggantian lama `--output-format json` tetap menggunakan pengurai JSON.

Mode masukan:

- `input: "arg"` (default) meneruskan prompt sebagai argumen CLI terakhir.
- `input: "stdin"` mengirimkan prompt melalui stdin.
- Jika prompt sangat panjang dan `maxPromptArgChars` diatur, stdin akan digunakan sebagai gantinya.

## Default milik Plugin

Default backend CLI merupakan bagian dari permukaan Plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- `id` backend menjadi prefiks penyedia dalam referensi model.
- Konfigurasi pengguna di `agents.defaults.cliBackends.<id>` tetap menggantikan default Plugin.
- Pembersihan konfigurasi khusus backend tetap menjadi tanggung jawab Plugin melalui hook opsional `normalizeConfig`.

Anthropic memiliki `claude-cli` dan Google memiliki `google-gemini-cli`. Eksekusi agen OpenAI Codex menggunakan harness server aplikasi Codex melalui `openai/*`; OpenClaw tidak lagi mendaftarkan backend `codex-cli` bawaan.

Plugin Anthropic bawaan mendaftarkan hal berikut untuk `claude-cli`:

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

Plugin Google bawaan mendaftarkan diri untuk `google-gemini-cli`:

| Kunci                     | Nilai                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | sama, dengan `--resume {sessionId}`                                                     |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Prasyarat: Gemini CLI lokal harus terinstal dan tersedia di `PATH` sebagai `gemini` (`brew install gemini-cli` atau `npm install -g @google/gemini-cli`).

Catatan keluaran Gemini CLI:

- Pengurai `stream-json` bawaan membaca peristiwa `message` asisten, peristiwa alat, penggunaan `result` akhir, dan peristiwa galat fatal Gemini.
- Jika Anda mengganti argumen Gemini menjadi `--output-format json`, OpenClaw menormalkan backend tersebut kembali menjadi `output: "json"` dan membaca teks balasan dari bidang `response` JSON.
- Penggunaan beralih menggunakan `stats` jika `usage` tidak ada atau kosong; `stats.cached` dinormalkan menjadi `cacheRead` OpenClaw, dan jika `stats.input` tidak ada, token masukan diperoleh dari `stats.input_tokens - stats.cached`.

Ganti nilai bawaan hanya jika diperlukan (paling umum berupa jalur absolut `command`).

## Lapisan transformasi teks

Plugin yang memerlukan shim kompatibilitas kecil untuk prompt/pesan dapat mendeklarasikan transformasi teks dua arah tanpa mengganti penyedia atau backend CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` menulis ulang prompt sistem dan prompt pengguna yang diteruskan ke CLI. `output` menulis ulang teks asisten yang dialirkan dan teks akhir yang telah diurai sebelum OpenClaw menangani penanda kontrol serta pengiriman kanalnya sendiri; untuk pemanggilan model berbasis penyedia, ini juga memulihkan nilai string di dalam argumen pemanggilan alat terstruktur setelah perbaikan aliran dan sebelum eksekusi alat. Fragmen JSON mentah dari penyedia tidak diubah; konsumen harus menggunakan muatan parsial, akhir, atau hasil yang terstruktur.

Untuk CLI yang memancarkan peristiwa JSONL khusus penyedia, atur `jsonlDialect` pada konfigurasi backend tersebut: `claude-stream-json` untuk aliran yang kompatibel dengan Claude Code, `gemini-stream-json` untuk peristiwa `stream-json` Gemini CLI.

## Kepemilikan Compaction native

Beberapa backend CLI menjalankan agen yang melakukan Compaction pada transkripnya sendiri, sehingga OpenClaw tidak boleh menjalankan perangkum pengamannya terhadap backend tersebut—tindakan itu akan bertentangan dengan Compaction milik backend dan dapat menyebabkan giliran gagal total.

`claude-cli` tidak memiliki titik akhir harness (Claude Code melakukan Compaction secara internal), sehingga mendeklarasikan `ownsNativeCompaction: true` dan jalur Compaction OpenClaw mengembalikan entri sesi tanpa perubahan. Sebaliknya, sesi harness native seperti Codex tetap diarahkan ke titik akhir Compaction harness-nya.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Deklarasikan `ownsNativeCompaction` hanya untuk backend yang benar-benar memiliki Compaction: backend tersebut harus secara andal membatasi transkripnya sendiri di sekitar jendela konteks dan mempertahankan sesi yang dapat dilanjutkan (misalnya `--resume` / `--session-id`), atau sesi yang ditunda dapat tetap melampaui batas anggaran.

## Lapisan MCP bundel

Backend CLI tidak menerima pemanggilan alat OpenClaw secara langsung, tetapi backend dapat memilih menggunakan lapisan konfigurasi MCP yang dihasilkan dengan `bundleMcp: true`. Perilaku bawaan saat ini:

- `claude-cli`: berkas konfigurasi MCP ketat yang dihasilkan.
- `google-gemini-cli`: berkas pengaturan sistem Gemini yang dihasilkan.

Saat MCP bundel diaktifkan, OpenClaw:

- menjalankan server MCP HTTP local loopback yang mengekspos alat Gateway kepada proses CLI, diautentikasi dengan pemberian konteks per proses (`OPENCLAW_MCP_TOKEN`) yang hanya aktif untuk percobaan eksekusi saat ini;
- mengikat akses alat ke konteks sesi, akun, dan kanal yang dipilih Gateway, alih-alih memercayai header proses anak;
- memuat server MCP bundel yang diaktifkan untuk ruang kerja saat ini dan menggabungkannya dengan bentuk konfigurasi/pengaturan MCP backend yang sudah ada;
- menulis ulang konfigurasi peluncuran menggunakan mode integrasi milik backend dari Plugin pemiliknya.

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menyisipkan konfigurasi ketat saat backend memilih menggunakan MCP bundel, sehingga proses latar belakang tetap terisolasi.

Runtime MCP bawaan dengan cakupan sesi disimpan dalam cache untuk digunakan kembali dalam satu sesi, kemudian dihentikan setelah `mcp.sessionIdleTtlMs` milidetik waktu menganggur (bawaan 10 menit; atur `0` untuk menonaktifkan). Proses tersemat sekali jalan seperti pemeriksaan autentikasi, pembuatan slug, dan pengambilan kembali active-memory meminta pembersihan pada akhir proses agar proses anak stdio serta aliran HTTP/SSE yang dapat dialirkan tidak bertahan lebih lama daripada proses tersebut.

## Batas riwayat penyemaian ulang

Saat sesi CLI baru disemai dari transkrip OpenClaw sebelumnya (misalnya setelah percobaan ulang `session_expired`), blok `<conversation_history>` yang dirender dibatasi agar prompt penyemaian ulang tidak membengkak. Nilai bawaannya adalah 12.288 karakter (sekitar 3.000 token).

Backend Claude CLI menyesuaikan batas ini berdasarkan jendela konteks Claude yang telah ditentukan: jendela konteks yang lebih besar mendapatkan cuplikan riwayat sebelumnya yang lebih besar, hingga batas maksimum tetap; backend CLI lainnya mempertahankan nilai bawaan yang konservatif. Batas ini hanya mengatur blok riwayat sebelumnya pada prompt penyemaian ulang—batas keluaran sesi aktif disetel secara terpisah di bawah `reliability.outputLimits` (lihat [Sesi](#sessions)).

## Keterbatasan

- Tidak ada pemanggilan alat OpenClaw langsung: OpenClaw tidak menyisipkan pemanggilan alat ke dalam protokol backend CLI. Backend hanya melihat alat Gateway saat memilih menggunakan `bundleMcp: true`.
- Pengaliran bersifat khusus backend: beberapa backend mengalirkan JSONL, sedangkan yang lain menyangga hingga proses berakhir.
- Keluaran terstruktur bergantung pada format JSON milik CLI.

## Pemecahan masalah

| Gejala                  | Perbaikan                                                                  |
| ----------------------- | -------------------------------------------------------------------------- |
| CLI tidak ditemukan     | Atur `command` ke jalur lengkap.                                           |
| Nama model salah        | Gunakan `modelAliases` untuk memetakan `provider/model` ke id model CLI.   |
| Tidak ada kontinuitas sesi | Pastikan `sessionArg` diatur dan `sessionMode` bukan `none`.             |
| Gambar diabaikan        | Atur `imageArg` dan pastikan CLI mendukung jalur berkas.                    |

## Terkait

- [Panduan operasional Gateway](/id/gateway)
- [Model lokal](/id/gateway/local-models)
