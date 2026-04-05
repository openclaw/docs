---
read_when:
    - Anda ingin memahami bagaimana OpenClaw merakit konteks model
    - Anda sedang beralih antara mesin lama dan mesin plugin
    - Anda sedang membangun plugin mesin konteks
summary: 'Mesin konteks: perakitan konteks yang dapat dipasang, pemadatan, dan siklus hidup subagen'
title: Mesin Konteks
x-i18n:
    generated_at: "2026-04-05T13:51:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd8cbb0e953f58fd84637fc4ceefc65984312cf2896d338318bc8cf860e6d9
    source_path: concepts/context-engine.md
    workflow: 15
---

# Mesin Konteks

**Mesin konteks** mengontrol bagaimana OpenClaw membangun konteks model untuk setiap eksekusi.
Mesin ini menentukan pesan mana yang disertakan, bagaimana merangkum riwayat lama, dan bagaimana
mengelola konteks melintasi batas subagen.

OpenClaw dilengkapi dengan mesin bawaan `legacy`. Plugin dapat mendaftarkan
mesin alternatif yang menggantikan siklus hidup context engine yang aktif.

## Mulai cepat

Periksa mesin mana yang aktif:

```bash
openclaw doctor
# or inspect config directly:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Menginstal plugin mesin konteks

Plugin mesin konteks diinstal seperti plugin OpenClaw lainnya. Instal
terlebih dahulu, lalu pilih mesin tersebut di slot:

```bash
# Install from npm
openclaw plugins install @martian-engineering/lossless-claw

# Or install from a local path (for development)
openclaw plugins install -l ./my-context-engine
```

Lalu aktifkan plugin dan pilih sebagai mesin aktif dalam config Anda:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // must match the plugin's registered engine id
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Plugin-specific config goes here (see the plugin's docs)
      },
    },
  },
}
```

Mulai ulang gateway setelah instalasi dan konfigurasi.

Untuk beralih kembali ke mesin bawaan, setel `contextEngine` ke `"legacy"` (atau
hapus kuncinya sepenuhnya — `"legacy"` adalah default).

## Cara kerjanya

Setiap kali OpenClaw menjalankan prompt model, mesin konteks berpartisipasi pada
empat titik siklus hidup:

1. **Ingest** — dipanggil saat pesan baru ditambahkan ke sesi. Mesin
   dapat menyimpan atau mengindeks pesan di penyimpanan datanya sendiri.
2. **Assemble** — dipanggil sebelum setiap eksekusi model. Mesin mengembalikan sekumpulan
   pesan berurutan (dan `systemPromptAddition` opsional) yang muat dalam
   anggaran token.
3. **Compact** — dipanggil saat jendela konteks penuh, atau saat pengguna menjalankan
   `/compact`. Mesin merangkum riwayat lama untuk membebaskan ruang.
4. **After turn** — dipanggil setelah eksekusi selesai. Mesin dapat menyimpan status,
   memicu pemadatan latar belakang, atau memperbarui indeks.

### Siklus hidup subagen (opsional)

OpenClaw saat ini memanggil satu hook siklus hidup subagen:

- **onSubagentEnded** — bersihkan saat sesi subagen selesai atau disapu.

Hook `prepareSubagentSpawn` adalah bagian dari antarmuka untuk penggunaan di masa depan, tetapi
runtime belum memanggilnya.

### Penambahan prompt sistem

Metode `assemble` dapat mengembalikan string `systemPromptAddition`. OpenClaw
menambahkan ini ke awal prompt sistem untuk eksekusi tersebut. Ini memungkinkan mesin menyisipkan
panduan recall dinamis, instruksi retrieval, atau petunjuk yang sadar konteks
tanpa memerlukan file workspace statis.

## Mesin legacy

Mesin bawaan `legacy` mempertahankan perilaku asli OpenClaw:

- **Ingest**: no-op (manajer sesi menangani persistensi pesan secara langsung).
- **Assemble**: pass-through (pipeline sanitize → validate → limit yang ada
  di runtime menangani perakitan konteks).
- **Compact**: mendelegasikan ke pemadatan peringkasan bawaan, yang membuat
  satu ringkasan pesan lama dan menjaga pesan terbaru tetap utuh.
- **After turn**: no-op.

Mesin legacy tidak mendaftarkan tools atau menyediakan `systemPromptAddition`.

Saat `plugins.slots.contextEngine` tidak disetel (atau disetel ke `"legacy"`), mesin ini
digunakan secara otomatis.

## Mesin plugin

Plugin dapat mendaftarkan mesin konteks menggunakan API plugin:

```ts
export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: "Use lcm_grep to search history...",
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

Lalu aktifkan dalam config:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### Antarmuka ContextEngine

Anggota yang wajib:

| Member             | Kind     | Purpose                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | Engine id, name, version, and whether it owns compaction |
| `ingest(params)`   | Method   | Store a single message                                   |
| `assemble(params)` | Method   | Build context for a model run (returns `AssembleResult`) |
| `compact(params)`  | Method   | Summarize/reduce context                                 |

`assemble` mengembalikan `AssembleResult` dengan:

- `messages` — pesan berurutan yang akan dikirim ke model.
- `estimatedTokens` (wajib, `number`) — perkiraan mesin atas total
  token dalam konteks yang dirakit. OpenClaw menggunakan ini untuk keputusan
  ambang pemadatan dan pelaporan diagnostik.
- `systemPromptAddition` (opsional, `string`) — ditambahkan ke awal prompt sistem.

Anggota opsional:

| Member                         | Kind   | Purpose                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | Initialize engine state for a session. Called once when the engine first sees a session (e.g., import history). |
| `ingestBatch(params)`          | Method | Ingest a completed turn as a batch. Called after a run completes, with all messages from that turn at once.     |
| `afterTurn(params)`            | Method | Post-run lifecycle work (persist state, trigger background compaction).                                         |
| `prepareSubagentSpawn(params)` | Method | Set up shared state for a child session.                                                                        |
| `onSubagentEnded(params)`      | Method | Clean up after a subagent ends.                                                                                 |
| `dispose()`                    | Method | Release resources. Called during gateway shutdown or plugin reload — not per-session.                           |

### ownsCompaction

`ownsCompaction` mengontrol apakah auto-compaction bawaan Pi di dalam upaya tetap
diaktifkan untuk eksekusi tersebut:

- `true` — mesin memiliki perilaku pemadatan. OpenClaw menonaktifkan
  auto-compaction bawaan Pi untuk eksekusi itu, dan implementasi `compact()` milik mesin
  bertanggung jawab atas `/compact`, pemadatan pemulihan overflow, dan pemadatan proaktif
  apa pun yang ingin dilakukannya di `afterTurn()`.
- `false` atau tidak disetel — auto-compaction bawaan Pi masih dapat berjalan selama eksekusi
  prompt, tetapi metode `compact()` milik mesin aktif tetap dipanggil untuk
  `/compact` dan pemulihan overflow.

`ownsCompaction: false` **tidak** berarti OpenClaw secara otomatis kembali ke
jalur pemadatan mesin legacy.

Itu berarti ada dua pola plugin yang valid:

- **Mode owning** — implementasikan algoritme pemadatan Anda sendiri dan setel
  `ownsCompaction: true`.
- **Mode delegating** — setel `ownsCompaction: false` dan biarkan `compact()` memanggil
  `delegateCompactionToRuntime(...)` dari `openclaw/plugin-sdk/core` untuk menggunakan
  perilaku pemadatan bawaan OpenClaw.

`compact()` no-op tidak aman untuk mesin non-owning aktif karena
ini menonaktifkan jalur normal `/compact` dan pemadatan pemulihan overflow untuk
slot mesin tersebut.

## Referensi konfigurasi

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

Slot ini eksklusif saat runtime — hanya satu mesin konteks terdaftar yang
diresolusikan untuk eksekusi atau operasi pemadatan tertentu. Plugin lain yang diaktifkan
dengan `kind: "context-engine"` tetap dapat dimuat dan menjalankan kode
pendaftarannya; `plugins.slots.contextEngine` hanya memilih id mesin terdaftar mana yang
diresolusikan OpenClaw saat membutuhkan mesin konteks.

## Hubungan dengan pemadatan dan memori

- **Pemadatan** adalah salah satu tanggung jawab mesin konteks. Mesin legacy
  mendelegasikan ke peringkasan bawaan OpenClaw. Mesin plugin dapat mengimplementasikan
  strategi pemadatan apa pun (ringkasan DAG, vector retrieval, dll.).
- **Plugin memori** (`plugins.slots.memory`) terpisah dari mesin konteks.
  Plugin memori menyediakan pencarian/retrieval; mesin konteks mengontrol apa yang
  dilihat model. Keduanya dapat bekerja bersama — mesin konteks mungkin menggunakan data
  plugin memori selama perakitan.
- **Pemangkasan sesi** (memangkas hasil tool lama di memori) tetap berjalan
  tanpa memedulikan mesin konteks mana yang aktif.

## Tips

- Gunakan `openclaw doctor` untuk memverifikasi bahwa mesin Anda dimuat dengan benar.
- Jika beralih mesin, sesi yang ada akan tetap melanjutkan dengan riwayat saat ini.
  Mesin baru mengambil alih untuk eksekusi berikutnya.
- Kesalahan mesin dicatat dalam log dan ditampilkan dalam diagnostik. Jika mesin plugin
  gagal didaftarkan atau id mesin yang dipilih tidak dapat diresolusikan, OpenClaw
  tidak otomatis kembali; eksekusi akan gagal sampai Anda memperbaiki plugin atau
  mengalihkan `plugins.slots.contextEngine` kembali ke `"legacy"`.
- Untuk pengembangan, gunakan `openclaw plugins install -l ./my-engine` untuk menautkan
  direktori plugin lokal tanpa menyalin.

Lihat juga: [Pemadatan](/concepts/compaction), [Konteks](/concepts/context),
[Plugins](/tools/plugin), [Manifest plugin](/plugins/manifest).

## Terkait

- [Konteks](/concepts/context) — bagaimana konteks dibangun untuk giliran agen
- [Arsitektur Plugin](/plugins/architecture) — mendaftarkan plugin mesin konteks
- [Pemadatan](/concepts/compaction) — merangkum percakapan panjang
