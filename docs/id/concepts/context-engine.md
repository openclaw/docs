---
read_when:
    - Anda ingin memahami cara OpenClaw merakit konteks model
    - Anda sedang beralih antara mesin legacy dan mesin Plugin
    - Anda sedang membangun Plugin mesin konteks
summary: 'Mesin konteks: perakitan konteks yang dapat dipasang, Compaction, dan siklus hidup subagen'
title: Mesin konteks
x-i18n:
    generated_at: "2026-04-24T09:03:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f4e5f01f945f7fe3056587f2aa60bec607dd0dd64b29e9ab2afe8e77b5d2f1e
    source_path: concepts/context-engine.md
    workflow: 15
---

Sebuah **mesin konteks** mengontrol cara OpenClaw membangun konteks model untuk setiap run:
pesan mana yang harus disertakan, cara merangkum riwayat lama, dan cara mengelola
konteks melintasi batas subagen.

OpenClaw menyediakan mesin `legacy` bawaan dan menggunakannya secara default — sebagian besar
pengguna tidak perlu mengubah ini. Instal dan pilih mesin Plugin hanya ketika
Anda menginginkan perilaku perakitan, Compaction, atau recall lintas sesi yang berbeda.

## Mulai cepat

Periksa mesin mana yang aktif:

```bash
openclaw doctor
# atau periksa konfigurasi secara langsung:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Menginstal Plugin mesin konteks

Plugin mesin konteks diinstal seperti Plugin OpenClaw lainnya. Instal
terlebih dahulu, lalu pilih mesin pada slot:

```bash
# Instal dari npm
openclaw plugins install @martian-engineering/lossless-claw

# Atau instal dari path lokal (untuk pengembangan)
openclaw plugins install -l ./my-context-engine
```

Lalu aktifkan Plugin dan pilih sebagai mesin aktif di konfigurasi Anda:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // harus cocok dengan id mesin terdaftar Plugin
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Konfigurasi khusus Plugin diletakkan di sini (lihat dokumentasi Plugin)
      },
    },
  },
}
```

Mulai ulang gateway setelah instalasi dan konfigurasi.

Untuk kembali ke mesin bawaan, setel `contextEngine` ke `"legacy"` (atau
hapus key-nya sepenuhnya — `"legacy"` adalah default).

## Cara kerjanya

Setiap kali OpenClaw menjalankan prompt model, mesin konteks ikut berpartisipasi pada
empat titik siklus hidup:

1. **Ingest** — dipanggil saat pesan baru ditambahkan ke sesi. Mesin
   dapat menyimpan atau mengindeks pesan tersebut di penyimpanan datanya sendiri.
2. **Assemble** — dipanggil sebelum setiap run model. Mesin mengembalikan sekumpulan
   pesan terurut (dan `systemPromptAddition` opsional) yang muat dalam
   anggaran token.
3. **Compact** — dipanggil saat jendela konteks penuh, atau saat pengguna menjalankan
   `/compact`. Mesin merangkum riwayat lama untuk mengosongkan ruang.
4. **After turn** — dipanggil setelah run selesai. Mesin dapat mempertahankan status,
   memicu Compaction latar belakang, atau memperbarui indeks.

Untuk harness Codex non-ACP bawaan, OpenClaw menerapkan siklus hidup yang sama dengan
memproyeksikan konteks yang telah dirakit ke instruksi pengembang Codex dan prompt
giliran saat ini. Codex tetap memiliki riwayat thread native dan Compaction native-nya sendiri.

### Siklus hidup subagen (opsional)

OpenClaw memanggil dua hook siklus hidup subagen opsional:

- **prepareSubagentSpawn** — menyiapkan status konteks bersama sebelum child run
  dimulai. Hook menerima key sesi induk/anak, `contextMode`
  (`isolated` atau `fork`), id/file transkrip yang tersedia, dan TTL opsional.
  Jika hook mengembalikan handle rollback, OpenClaw akan memanggilnya ketika spawn gagal setelah
  persiapan berhasil.
- **onSubagentEnded** — membersihkan saat sesi subagen selesai atau disapu.

### Penambahan system prompt

Metode `assemble` dapat mengembalikan string `systemPromptAddition`. OpenClaw
menambahkan ini di awal system prompt untuk run tersebut. Ini memungkinkan mesin menyisipkan
panduan recall dinamis, instruksi retrieval, atau petunjuk yang sadar konteks
tanpa memerlukan file workspace statis.

## Mesin legacy

Mesin `legacy` bawaan mempertahankan perilaku asli OpenClaw:

- **Ingest**: no-op (manajer sesi menangani persistensi pesan secara langsung).
- **Assemble**: pass-through (pipeline sanitize → validate → limit yang sudah ada
  di runtime menangani perakitan konteks).
- **Compact**: mendelegasikan ke Compaction peringkasan bawaan, yang membuat
  satu ringkasan pesan lama dan mempertahankan pesan terbaru tetap utuh.
- **After turn**: no-op.

Mesin legacy tidak mendaftarkan tool atau menyediakan `systemPromptAddition`.

Ketika `plugins.slots.contextEngine` tidak diatur (atau diatur ke `"legacy"`), mesin ini
digunakan secara otomatis.

## Mesin Plugin

Sebuah Plugin dapat mendaftarkan mesin konteks menggunakan API Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Simpan pesan di penyimpanan data Anda
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Kembalikan pesan yang muat dalam anggaran
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Ringkas konteks lama
      return { ok: true, compacted: true };
    },
  }));
}
```

Lalu aktifkan di konfigurasi:

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

Anggota wajib:

| Anggota           | Jenis    | Tujuan                                                    |
| ----------------- | -------- | --------------------------------------------------------- |
| `info`            | Properti | Id, nama, versi mesin, dan apakah mesin memiliki Compaction |
| `ingest(params)`   | Metode   | Menyimpan satu pesan                                      |
| `assemble(params)` | Metode   | Membangun konteks untuk model run (mengembalikan `AssembleResult`) |
| `compact(params)`  | Metode   | Meringkas/mengurangi konteks                              |

`assemble` mengembalikan `AssembleResult` dengan:

- `messages` — pesan terurut yang dikirim ke model.
- `estimatedTokens` (wajib, `number`) — perkiraan mesin atas total
  token dalam konteks yang dirakit. OpenClaw menggunakan ini untuk ambang Compaction
  dan pelaporan diagnostik.
- `systemPromptAddition` (opsional, `string`) — ditambahkan di awal system prompt.

Anggota opsional:

| Anggota                       | Jenis  | Tujuan                                                                                                         |
| ----------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`           | Metode | Menginisialisasi status mesin untuk sebuah sesi. Dipanggil sekali saat mesin pertama kali melihat sesi (mis., impor riwayat). |
| `ingestBatch(params)`         | Metode | Melakukan ingest satu giliran penuh sebagai batch. Dipanggil setelah run selesai, dengan semua pesan dari giliran tersebut sekaligus. |
| `afterTurn(params)`           | Metode | Pekerjaan siklus hidup pascarun (mempertahankan status, memicu Compaction latar belakang).                    |
| `prepareSubagentSpawn(params)` | Metode | Menyiapkan status bersama untuk sesi anak sebelum dimulai.                                                     |
| `onSubagentEnded(params)`     | Metode | Membersihkan setelah subagen berakhir.                                                                         |
| `dispose()`                   | Metode | Melepaskan sumber daya. Dipanggil saat shutdown gateway atau reload Plugin — bukan per sesi.                  |

### ownsCompaction

`ownsCompaction` mengontrol apakah auto-Compaction in-attempt bawaan Pi tetap
aktif untuk run tersebut:

- `true` — mesin memiliki perilaku Compaction. OpenClaw menonaktifkan auto-Compaction bawaan Pi
  untuk run tersebut, dan implementasi `compact()` milik mesin bertanggung jawab atas
  `/compact`, Compaction pemulihan overflow, dan Compaction proaktif apa pun
  yang ingin dilakukan di `afterTurn()`.
- `false` atau tidak diatur — auto-Compaction bawaan Pi masih dapat berjalan selama eksekusi
  prompt, tetapi metode `compact()` milik mesin aktif tetap dipanggil untuk
  `/compact` dan pemulihan overflow.

`ownsCompaction: false` **tidak** berarti OpenClaw otomatis fallback ke
jalur Compaction mesin legacy.

Artinya ada dua pola Plugin yang valid:

- **Mode owning** — implementasikan algoritma Compaction Anda sendiri dan setel
  `ownsCompaction: true`.
- **Mode delegating** — setel `ownsCompaction: false` dan buat `compact()` memanggil
  `delegateCompactionToRuntime(...)` dari `openclaw/plugin-sdk/core` untuk menggunakan
  perilaku Compaction bawaan OpenClaw.

`compact()` no-op tidak aman untuk mesin aktif non-owning karena
menonaktifkan jalur `/compact` normal dan Compaction pemulihan overflow untuk
slot mesin tersebut.

## Referensi konfigurasi

```json5
{
  plugins: {
    slots: {
      // Pilih mesin konteks aktif. Default: "legacy".
      // Setel ke id Plugin untuk menggunakan mesin Plugin.
      contextEngine: "legacy",
    },
  },
}
```

Slot ini eksklusif saat runtime — hanya satu mesin konteks terdaftar yang
diselesaikan untuk run atau operasi Compaction tertentu. Plugin
`kind: "context-engine"` lain yang aktif tetap dapat dimuat dan menjalankan kode
pendaftarannya; `plugins.slots.contextEngine` hanya memilih id mesin terdaftar mana
yang diselesaikan OpenClaw saat membutuhkan mesin konteks.

## Hubungan dengan Compaction dan memori

- **Compaction** adalah salah satu tanggung jawab mesin konteks. Mesin legacy
  mendelegasikan ke peringkasan bawaan OpenClaw. Mesin Plugin dapat mengimplementasikan
  strategi Compaction apa pun (ringkasan DAG, vector retrieval, dll.).
- **Plugin memori** (`plugins.slots.memory`) terpisah dari mesin konteks.
  Plugin memori menyediakan pencarian/retrieval; mesin konteks mengontrol apa yang
  dilihat model. Keduanya dapat bekerja bersama — mesin konteks dapat menggunakan data
  Plugin memori selama perakitan. Mesin Plugin yang ingin menggunakan jalur prompt
  memori aktif sebaiknya menggunakan `buildMemorySystemPromptAddition(...)` dari
  `openclaw/plugin-sdk/core`, yang mengubah bagian prompt memori aktif
  menjadi `systemPromptAddition` yang siap ditambahkan di depan. Jika mesin memerlukan kontrol
  tingkat lebih rendah, mesin tetap dapat mengambil baris mentah dari
  `openclaw/plugin-sdk/memory-host-core` melalui
  `buildActiveMemoryPromptSection(...)`.
- **Session pruning** (memangkas hasil tool lama di memori) tetap berjalan
  terlepas dari mesin konteks mana yang aktif.

## Tips

- Gunakan `openclaw doctor` untuk memverifikasi bahwa mesin Anda dimuat dengan benar.
- Jika berpindah mesin, sesi yang ada akan melanjutkan riwayatnya saat ini.
  Mesin baru akan mengambil alih untuk run berikutnya.
- Error mesin dicatat dalam log dan ditampilkan dalam diagnostik. Jika mesin Plugin
  gagal mendaftar atau id mesin yang dipilih tidak dapat diselesaikan, OpenClaw
  tidak otomatis fallback; run akan gagal sampai Anda memperbaiki Plugin atau
  mengembalikan `plugins.slots.contextEngine` ke `"legacy"`.
- Untuk pengembangan, gunakan `openclaw plugins install -l ./my-engine` untuk menautkan
  direktori Plugin lokal tanpa menyalin.

Lihat juga: [Compaction](/id/concepts/compaction), [Konteks](/id/concepts/context),
[Plugins](/id/tools/plugin), [Manifest Plugin](/id/plugins/manifest).

## Terkait

- [Konteks](/id/concepts/context) — bagaimana konteks dibangun untuk giliran agen
- [Arsitektur Plugin](/id/plugins/architecture) — mendaftarkan Plugin mesin konteks
- [Compaction](/id/concepts/compaction) — meringkas percakapan panjang
