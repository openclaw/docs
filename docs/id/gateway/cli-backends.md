---
read_when:
    - Anda menginginkan fallback yang andal saat penyedia API gagal
    - Anda menjalankan CLI AI lokal dan ingin menggunakannya kembali
    - Anda ingin memahami jembatan loopback MCP untuk akses alat backend CLI
summary: 'Backend CLI: fallback CLI AI lokal dengan jembatan alat MCP opsional'
title: Backend CLI
x-i18n:
    generated_at: "2026-07-16T18:02:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ffeb19e582819f511212326da83381ba2c52e9f5743263f1ef9e0dc0fbbaf08e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw dapat menjalankan CLI AI lokal sebagai fallback khusus teks ketika penyedia API tidak aktif, terkena pembatasan laju, atau berperilaku tidak semestinya. Pendekatan ini sengaja dibuat konservatif:

- Alat OpenClaw tidak diinjeksi secara langsung, tetapi backend dengan `bundleMcp: true` dapat menerima alat Gateway melalui jembatan MCP loopback.
- Streaming JSONL untuk CLI yang mendukungnya.
- Sesi didukung, sehingga giliran lanjutan tetap koheren.
- Gambar diteruskan jika CLI menerima jalur gambar.

Gunakan ini sebagai jaring pengaman untuk respons teks yang "selalu berfungsi", bukan sebagai jalur utama. Untuk runtime harness lengkap dengan kontrol sesi ACP, tugas latar belakang, pengikatan utas/percakapan, dan sesi pengodean eksternal yang persisten, gunakan [Agen ACP](/id/tools/acp-agents) sebagai gantinya; backend CLI bukan ACP.

<Tip>
  Membuat plugin backend baru? Lihat [Plugin backend CLI](/id/plugins/cli-backend-plugins). Halaman ini membahas konfigurasi dan pengoperasian backend yang sudah terdaftar.
</Tip>

## Mulai cepat

Plugin Anthropic bawaan mendaftarkan backend `claude-cli` default, sehingga dapat digunakan tanpa konfigurasi selain memasang Claude Code dan masuk:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` adalah id agen default jika tidak ada daftar agen eksplisit yang dikonfigurasi; jika ada, gantilah dengan id agen Anda sendiri.

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

Jika Anda menggunakan backend CLI bawaan sebagai penyedia pesan utama pada host Gateway, OpenClaw otomatis memuat plugin bawaan pemiliknya ketika konfigurasi Anda merujuk backend tersebut dalam referensi model atau di bawah `agents.defaults.cliBackends`.

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

Jika Anda menggunakan `agents.defaults.models` sebagai daftar yang diizinkan, sertakan juga model backend CLI Anda di sana. Ketika penyedia utama gagal (autentikasi, pembatasan laju, batas waktu), OpenClaw mencoba backend CLI berikutnya.

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
          // Atau gunakan flag penggantian konfigurasi bergaya Codex:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Ikut serta hanya jika backend ini boleh menginisialisasi ulang sesi yang dibatalkan dari
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
2. Menyusun prompt sistem menggunakan prompt OpenClaw dan konteks ruang kerja yang sama.
3. Menjalankan CLI dengan id sesi (jika didukung) agar riwayat tetap konsisten. Backend `claude-cli` bawaan mempertahankan proses stdio Claude tetap aktif untuk setiap sesi OpenClaw dan mengirim giliran lanjutan melalui stdin stream-json.
4. Mengurai keluaran (JSON atau teks biasa) dan mengembalikan teks akhir.
5. Menyimpan id sesi per backend agar tindak lanjut menggunakan kembali sesi CLI yang sama.

### Detail khusus Claude CLI

Backend `claude-cli` bawaan mengutamakan resolver skill native Claude Code. Ketika snapshot skill saat ini memiliki setidaknya satu skill terpilih dengan jalur yang telah dimaterialisasi, OpenClaw meneruskan plugin Claude Code sementara melalui `--plugin-dir` dan menghilangkan katalog skill OpenClaw yang duplikat dari prompt sistem tambahan. Tanpa skill plugin yang dimaterialisasi, OpenClaw mempertahankan katalog prompt sebagai fallback. Penggantian env/kunci API skill tetap diterapkan ke lingkungan proses turunan untuk proses tersebut.

Claude CLI memiliki mode izin noninteraktifnya sendiri; OpenClaw memetakannya ke kebijakan exec yang sudah ada alih-alih menambahkan konfigurasi khusus Claude. Untuk sesi langsung Claude yang dikelola OpenClaw, kebijakan exec efektif bersifat otoritatif: YOLO (`tools.exec.security: "full"` dan `tools.exec.ask: "off"`) biasanya menjalankan Claude dengan `--permission-mode bypassPermissions`, sedangkan kebijakan restriktif menjalankannya dengan `--permission-mode default`. Gateway yang dijalankan sebagai root juga menggunakan `default` karena Claude Code menolak mode bypass untuk root; OpenClaw tetap menjawab permintaan kontrol alat stdio Claude berdasarkan kebijakan exec yang dikonfigurasi. Pengaturan `agents.list[].tools.exec` per agen menggantikan `tools.exec` global untuk agen tersebut. Argumen backend mentah masih dapat menyertakan `--permission-mode`, tetapi peluncuran langsung Claude menormalkan flag tersebut agar sesuai dengan kebijakan efektif dan pembatasan host.

Backend juga memetakan level `/think` OpenClaw ke flag `--effort` native Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, dan `high`/`xhigh`/`max` diteruskan secara langsung. Ini menjaga agar level upaya Fable 5 yang didukung tetap sama untuk Claude CLI berbasis langganan dan rute kunci API. `adaptive` menghapus flag `--effort` yang dikonfigurasi dan tidak memberikan pengganti, sehingga Claude Code menentukan upaya efektif dari lingkungan, pengaturan, dan default modelnya sendiri. Backend CLI lain memerlukan plugin pemiliknya untuk mendeklarasikan pemeta argv yang setara sebelum `/think` memengaruhi CLI yang dijalankan.

Sebelum OpenClaw dapat menggunakan `claude-cli`, Claude Code sendiri harus sudah masuk pada host yang sama:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Instalasi Docker memerlukan Claude Code dipasang dan sudah masuk di dalam direktori home kontainer persisten, bukan hanya di host; lihat [Backend Claude CLI di Docker](/id/install/docker#claude-cli-backend-in-docker).

Tetapkan `agents.defaults.cliBackends.claude-cli.command` hanya ketika biner `claude` belum ada di `PATH`.

## Sesi

- Jika CLI mendukung sesi, tetapkan `sessionArg` (misalnya `--session-id`), atau `sessionArgs` (placeholder `{sessionId}`) ketika id perlu ditempatkan dalam beberapa flag.
- Jika CLI menggunakan subperintah resume dengan flag yang berbeda, tetapkan `resumeArgs` (menggantikan `args` saat melanjutkan) dan secara opsional `resumeOutput` untuk pelanjutan non-JSON.
- `sessionMode`:
  - `always`: selalu kirim id sesi (UUID baru jika tidak ada yang tersimpan).
  - `existing`: hanya kirim id sesi jika sebelumnya sudah tersimpan.
  - `none`: jangan pernah mengirim id sesi.
- `claude-cli` secara default menggunakan `liveSession: "claude-stdio"`, `output: "jsonl"`, dan `input: "stdin"`, sehingga giliran lanjutan menggunakan kembali proses Claude langsung selama masih aktif, termasuk untuk konfigurasi khusus yang menghilangkan bidang transportasi. Jika Gateway dimulai ulang atau proses menganggur berhenti, OpenClaw melanjutkan dari id sesi Claude yang tersimpan. Id sesi tersimpan diverifikasi terhadap transkrip proyek yang dapat dibaca sebelum pelanjutan; transkrip yang hilang menghapus pengikatan (dicatat sebagai `reason=transcript-missing`) alih-alih diam-diam memulai sesi baru di bawah `--resume`.
- Sesi langsung Claude mempertahankan pembatas keluaran JSONL: secara default 8 MiB dan 20,000 baris JSONL mentah per giliran. Tingkatkan per backend dengan `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` dan `maxTurnLines`; OpenClaw membatasi pengaturan tersebut hingga 64 MiB dan 100,000 baris.
- Sesi CLI tersimpan adalah kontinuitas milik penyedia. Pengaturan ulang sesi harian implisit tidak memutusnya; `/reset` dan kebijakan `session.reset` eksplisit tetap memutusnya.
- Sesi CLI baru biasanya hanya diinisialisasi ulang dari ringkasan compaction OpenClaw beserta bagian setelah compaction. Untuk memulihkan sesi singkat yang dibatalkan sebelum compaction, backend dapat ikut serta dengan `reseedFromRawTranscriptWhenUncompacted: true`. Inisialisasi ulang transkrip mentah tetap dibatasi dan hanya berlaku untuk pembatalan yang aman, seperti transkrip CLI yang hilang, bagian akhir penggunaan alat yang terpisah, perubahan kebijakan pesan/prompt sistem/cwd/MCP, atau percobaan ulang karena sesi kedaluwarsa; perubahan profil autentikasi atau epoch kredensial tidak pernah menginisialisasi ulang riwayat transkrip mentah.

Serialisasi: `serialize: true` menjaga proses pada jalur yang sama tetap berurutan (sebagian besar CLI diserialisasi pada satu jalur penyedia). OpenClaw juga menghentikan penggunaan kembali sesi CLI tersimpan ketika identitas autentikasi yang dipilih berubah, termasuk perubahan id profil autentikasi, kunci API statis, token statis, atau identitas akun OAuth jika CLI menyediakannya; rotasi token akses/refresh OAuth saja tidak memutus sesi. Jika CLI tidak memiliki id akun OAuth yang stabil, OpenClaw membiarkan CLI tersebut memberlakukan izin pelanjutannya sendiri.

## Pendahuluan fallback dari sesi claude-cli

Ketika percobaan `claude-cli` beralih ke kandidat non-CLI dalam [`agents.defaults.model.fallbacks`](/id/concepts/model-failover), OpenClaw menginisialisasi percobaan berikutnya dengan pendahuluan konteks yang diambil dari transkrip JSONL lokal Claude Code (di bawah `~/.claude/projects/`, dengan kunci per ruang kerja). Tanpa inisialisasi ini, penyedia fallback dimulai tanpa konteks karena transkrip sesi OpenClaw sendiri kosong untuk proses `claude-cli`.

- Pendahuluan mengutamakan ringkasan `/compact` atau penanda `compact_boundary` terbaru, lalu menambahkan giliran terbaru setelah batas hingga mencapai anggaran karakter. Giliran sebelum batas dihapus karena ringkasan sudah mewakilinya.
- Blok alat digabungkan menjadi petunjuk `(tool call: name)` dan `(tool result: …)` yang ringkas agar anggaran prompt tetap akurat; ringkasan yang terlalu besar dipotong dan diberi label `(truncated)`.
- Fallback penyedia yang sama dari `claude-cli` ke `claude-cli` mengandalkan `--resume` milik Claude sendiri dan melewati pendahuluan.
- Inisialisasi menggunakan kembali validasi jalur berkas sesi Claude yang sudah ada, sehingga jalur arbitrer tidak dapat dibaca.

## Gambar

Jika CLI Anda menerima jalur gambar, tetapkan `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw menulis gambar base64 ke berkas sementara. Jika `imageArg` ditetapkan, jalur tersebut diteruskan sebagai argumen CLI; jika tidak, OpenClaw menambahkan jalur berkas ke prompt (injeksi jalur), yang berfungsi untuk CLI yang otomatis memuat berkas lokal dari jalur teks biasa.

## Masukan dan keluaran

- `output: "text"` (default) memperlakukan stdout sebagai respons akhir.
- `output: "json"` mencoba mengurai JSON dan mengekstrak teks beserta id sesi.
- `output: "jsonl"` mengurai aliran JSONL dan mengekstrak pesan agen terakhir beserta pengenal sesi jika tersedia.
- Untuk keluaran JSON Gemini CLI, OpenClaw membaca teks balasan dari `response` dan penggunaan dari `stats` ketika `usage` tidak ada atau kosong. Default Gemini CLI bawaan menggunakan `stream-json`; penggantian `--output-format json` lama tetap menggunakan pengurai JSON.

Mode masukan:

- `input: "arg"` (default) meneruskan prompt sebagai argumen CLI terakhir.
- `input: "stdin"` mengirimkan prompt melalui stdin.
- Jika prompt sangat panjang dan `maxPromptArgChars` ditetapkan, stdin akan digunakan sebagai gantinya.

## Default milik Plugin

Default backend CLI merupakan bagian dari permukaan plugin:

- Plugin mendaftarkannya dengan `api.registerCliBackend(...)`.
- `id` backend menjadi prefiks penyedia dalam referensi model.
- Konfigurasi pengguna di `agents.defaults.cliBackends.<id>` tetap mengesampingkan default plugin.
- Pembersihan konfigurasi khusus backend tetap menjadi milik plugin melalui hook opsional `normalizeConfig`.

Anthropic memiliki `claude-cli` dan Google memiliki `google-gemini-cli`. Eksekusi agen OpenAI Codex menggunakan harness app-server Codex melalui `openai/*`; OpenClaw tidak lagi mendaftarkan backend `codex-cli` bawaan.

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

| Kunci                     | Nilai                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------- |
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

Prasyarat: Gemini CLI lokal harus diinstal dan tersedia di `PATH` sebagai `gemini` (`brew install gemini-cli` atau `npm install -g @google/gemini-cli`).

Catatan keluaran Gemini CLI:

- Parser `stream-json` default membaca peristiwa `message` asisten, peristiwa alat, penggunaan akhir `result`, dan peristiwa kesalahan fatal Gemini.
- Jika Anda mengganti argumen Gemini menjadi `--output-format json`, OpenClaw menormalkan backend tersebut kembali ke `output: "json"` dan membaca teks balasan dari bidang JSON `response`.
- Penggunaan beralih ke `stats` ketika `usage` tidak ada atau kosong; `stats.cached` dinormalkan menjadi `cacheRead` OpenClaw, dan jika `stats.input` tidak ada, token masukan diperoleh dari `stats.input_tokens - stats.cached`.

Ganti default hanya jika diperlukan (paling umum berupa jalur absolut `command`).

## Overlay transformasi teks

Plugin yang memerlukan shim kompatibilitas prompt/pesan kecil dapat mendeklarasikan transformasi teks dua arah tanpa mengganti penyedia atau backend CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` menulis ulang prompt sistem dan prompt pengguna yang diteruskan ke CLI. `output` menulis ulang teks asisten yang dialirkan dan teks akhir yang diuraikan sebelum OpenClaw menangani penanda kontrolnya sendiri dan pengiriman kanal; untuk panggilan model berbasis penyedia, fitur ini juga memulihkan nilai string di dalam argumen panggilan alat terstruktur setelah perbaikan aliran dan sebelum eksekusi alat. Fragmen JSON mentah penyedia dibiarkan tidak berubah; konsumen sebaiknya menggunakan payload parsial, akhir, atau hasil yang terstruktur.

Untuk CLI yang memancarkan peristiwa JSONL khusus penyedia, tetapkan `jsonlDialect` pada konfigurasi backend tersebut: `claude-stream-json` untuk aliran yang kompatibel dengan Claude Code, `gemini-stream-json` untuk peristiwa `stream-json` Gemini CLI.

## Kepemilikan Compaction native

Beberapa backend CLI menjalankan agen yang melakukan Compaction pada transkripnya sendiri, sehingga OpenClaw tidak boleh menjalankan peringkas perlindungannya terhadap backend tersebut—melakukannya akan bertentangan dengan Compaction milik backend dan dapat menyebabkan giliran gagal total.

`claude-cli` tidak memiliki endpoint harness (Claude Code melakukan Compaction secara internal), sehingga mendeklarasikan `ownsNativeCompaction: true` dan jalur Compaction OpenClaw mengembalikan entri sesi tanpa perubahan. OpenClaw meneruskan anggaran konteks efektif eksekusi melalui [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) yang didokumentasikan Claude Code, sehingga Compaction otomatis native tetap selaras dengan batas `contextTokens` Anthropic yang dikonfigurasi. Sesi harness native seperti Codex tetap diarahkan ke endpoint Compaction harness-nya.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Hanya deklarasikan `ownsNativeCompaction` untuk backend yang benar-benar memiliki Compaction: backend harus secara andal membatasi transkripnya sendiri di sekitar jendela konteks dan mempertahankan sesi yang dapat dilanjutkan (misalnya `--resume` / `--session-id`), atau sesi yang ditangguhkan dapat tetap melampaui anggaran.

## Overlay MCP bundel

Backend CLI tidak menerima panggilan alat OpenClaw secara langsung, tetapi backend dapat memilih untuk menggunakan overlay konfigurasi MCP yang dihasilkan dengan `bundleMcp: true`. Perilaku bawaan saat ini:

- `claude-cli`: berkas konfigurasi MCP ketat yang dihasilkan.
- `google-gemini-cli`: berkas pengaturan sistem Gemini yang dihasilkan.

Saat MCP bundel diaktifkan, OpenClaw:

- menjalankan server HTTP MCP loopback yang mengekspos alat gateway ke proses CLI, diautentikasi dengan pemberian konteks per eksekusi (`OPENCLAW_MCP_TOKEN`) yang hanya aktif untuk upaya eksekusi saat ini;
- mengikat akses alat ke konteks sesi, akun, dan kanal yang dipilih Gateway, alih-alih memercayai header proses anak;
- memuat server MCP bundel yang diaktifkan untuk ruang kerja saat ini dan menggabungkannya dengan bentuk konfigurasi/pengaturan MCP backend yang sudah ada;
- menulis ulang konfigurasi peluncuran menggunakan mode integrasi milik backend dari plugin pemilik.

Jika tidak ada server MCP yang diaktifkan, OpenClaw tetap menyuntikkan konfigurasi ketat ketika backend memilih MCP bundel, sehingga eksekusi latar belakang tetap terisolasi.

Runtime MCP bawaan yang tercakup dalam sesi di-cache untuk digunakan kembali dalam satu sesi, lalu dihentikan setelah `mcp.sessionIdleTtlMs` milidetik tanpa aktivitas (default 10 menit; tetapkan `0` untuk menonaktifkan). Eksekusi tersemat sekali jalan seperti pemeriksaan autentikasi, pembuatan slug, dan pemanggilan kembali active-memory meminta pembersihan pada akhir eksekusi agar proses anak stdio dan aliran HTTP/SSE Streamable tidak bertahan lebih lama daripada eksekusi.

## Batas riwayat reseed

Saat sesi CLI baru diisi dari transkrip OpenClaw sebelumnya (misalnya setelah percobaan ulang `session_expired`), blok `<conversation_history>` yang dirender dibatasi agar prompt reseed tidak membengkak. Defaultnya adalah 12.288 karakter (sekitar 3.000 token).

Backend Claude CLI menskalakan batas ini berdasarkan jendela konteks Claude yang diselesaikan: jendela konteks yang lebih besar memperoleh cuplikan riwayat sebelumnya yang lebih besar, hingga batas maksimum tetap; backend CLI lainnya mempertahankan default konservatif. Batas ini hanya mengatur blok riwayat sebelumnya pada prompt reseed—batas keluaran sesi aktif disetel secara terpisah di bawah `reliability.outputLimits` (lihat [Sesi](#sessions)).

## Keterbatasan

- Tidak ada panggilan alat OpenClaw langsung: OpenClaw tidak menyuntikkan panggilan alat ke dalam protokol backend CLI. Backend hanya melihat alat gateway ketika memilih untuk menggunakan `bundleMcp: true`.
- Streaming bersifat khusus backend: beberapa backend mengalirkan JSONL, sedangkan yang lain menampung hingga proses selesai.
- Keluaran terstruktur bergantung pada format JSON milik CLI.

## Pemecahan masalah

| Gejala                  | Perbaikan                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------- |
| CLI tidak ditemukan     | Tetapkan `command` ke jalur lengkap.                                      |
| Nama model salah        | Gunakan `modelAliases` untuk memetakan `provider/model` ke ID model CLI.     |
| Tidak ada kontinuitas sesi | Pastikan `sessionArg` ditetapkan dan `sessionMode` bukan `none`. |
| Gambar diabaikan        | Tetapkan `imageArg` dan pastikan CLI mendukung jalur berkas.                |

## Terkait

- [Panduan operasional Gateway](/id/gateway)
- [Model lokal](/id/gateway/local-models)
