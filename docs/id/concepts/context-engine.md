---
read_when:
    - Anda ingin memahami bagaimana OpenClaw menyusun konteks model
    - Anda sedang beralih antara mesin lama dan mesin Plugin
    - Anda sedang membangun Plugin mesin konteks
sidebarTitle: Context engine
summary: 'Mesin konteks: penyusunan konteks yang dapat diperluas, Compaction, dan siklus hidup subagen'
title: Mesin konteks
x-i18n:
    generated_at: "2026-05-06T09:06:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c33c94971751d92a2ce695db545a0c0abb7adcbe1820383b83f4201fa7e628d
    source_path: concepts/context-engine.md
    workflow: 16
---

Sebuah **mesin konteks** mengontrol bagaimana OpenClaw membangun konteks model untuk setiap proses: pesan mana yang disertakan, bagaimana meringkas riwayat lama, dan bagaimana mengelola konteks lintas batas subagent.

OpenClaw dilengkapi mesin bawaan `legacy` dan menggunakannya secara default - sebagian besar pengguna tidak perlu mengubah ini. Instal dan pilih mesin Plugin hanya ketika Anda menginginkan perilaku assembly, Compaction, atau pengingatan lintas-sesi yang berbeda.

## Mulai cepat

<Steps>
  <Step title="Periksa mesin mana yang aktif">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Instal mesin Plugin">
    Plugin mesin konteks diinstal seperti Plugin OpenClaw lainnya.

    <Tabs>
      <Tab title="Dari npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Dari path lokal">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Aktifkan dan pilih mesin">
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

    Mulai ulang gateway setelah menginstal dan mengonfigurasi.

  </Step>
  <Step title="Beralih kembali ke legacy (opsional)">
    Atur `contextEngine` ke `"legacy"` (atau hapus kunci sepenuhnya - `"legacy"` adalah default).
  </Step>
</Steps>

## Cara kerjanya

Setiap kali OpenClaw menjalankan prompt model, mesin konteks berpartisipasi pada empat titik siklus hidup:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Dipanggil ketika pesan baru ditambahkan ke sesi. Mesin dapat menyimpan atau mengindeks pesan dalam penyimpanan datanya sendiri.
  </Accordion>
  <Accordion title="2. Assemble">
    Dipanggil sebelum setiap proses model. Mesin mengembalikan sekumpulan pesan berurutan (dan `systemPromptAddition` opsional) yang sesuai dengan anggaran token.
  </Accordion>
  <Accordion title="3. Compact">
    Dipanggil ketika jendela konteks penuh, atau ketika pengguna menjalankan `/compact`. Mesin meringkas riwayat lama untuk mengosongkan ruang.
  </Accordion>
  <Accordion title="4. Setelah giliran">
    Dipanggil setelah proses selesai. Mesin dapat mempertahankan status, memicu Compaction latar belakang, atau memperbarui indeks.
  </Accordion>
</AccordionGroup>

Untuk harness Codex non-ACP bawaan, OpenClaw menerapkan siklus hidup yang sama dengan memproyeksikan konteks yang telah dirakit ke dalam instruksi developer Codex dan prompt giliran saat ini. Codex tetap memiliki riwayat thread native dan compactor native-nya sendiri.

### Siklus hidup subagent (opsional)

OpenClaw memanggil dua hook siklus hidup subagent opsional:

<ParamField path="prepareSubagentSpawn" type="method">
  Siapkan status konteks bersama sebelum proses turunan dimulai. Hook menerima kunci sesi induk/turunan, `contextMode` (`isolated` atau `fork`), id/file transkrip yang tersedia, dan TTL opsional. Jika mengembalikan handle rollback, OpenClaw memanggilnya ketika spawn gagal setelah persiapan berhasil.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bersihkan saat sesi subagent selesai atau disapu.
</ParamField>

### Penambahan prompt sistem

Metode `assemble` dapat mengembalikan string `systemPromptAddition`. OpenClaw menambahkannya di awal prompt sistem untuk proses tersebut. Ini memungkinkan mesin menyuntikkan panduan pengingatan dinamis, instruksi retrieval, atau petunjuk sadar-konteks tanpa memerlukan file workspace statis.

## Mesin legacy

Mesin `legacy` bawaan mempertahankan perilaku asli OpenClaw:

- **Ingest**: no-op (manajer sesi menangani persistensi pesan secara langsung).
- **Assemble**: pass-through (pipeline sanitize → validate → limit yang ada di runtime menangani assembly konteks).
- **Compact**: mendelegasikan ke Compaction peringkasan bawaan, yang membuat satu ringkasan pesan lama dan menjaga pesan terbaru tetap utuh.
- **Setelah giliran**: no-op.

Mesin legacy tidak mendaftarkan alat atau menyediakan `systemPromptAddition`.

Ketika tidak ada `plugins.slots.contextEngine` yang ditetapkan (atau diatur ke `"legacy"`), mesin ini digunakan secara otomatis.

## Mesin Plugin

Sebuah Plugin dapat mendaftarkan mesin konteks menggunakan API Plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
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
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

Factory `ctx` mencakup nilai `config`, `agentDir`, dan `workspaceDir`
opsional sehingga Plugin dapat menginisialisasi status per-agen atau per-workspace sebelum
hook siklus hidup pertama berjalan.

Lalu aktifkan di config:

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

| Anggota            | Jenis    | Tujuan                                                     |
| ------------------ | -------- | ---------------------------------------------------------- |
| `info`             | Properti | Id mesin, nama, versi, dan apakah mesin memiliki Compaction |
| `ingest(params)`   | Metode   | Menyimpan satu pesan                                       |
| `assemble(params)` | Metode   | Membangun konteks untuk proses model (mengembalikan `AssembleResult`) |
| `compact(params)`  | Metode   | Meringkas/mengurangi konteks                               |

`assemble` mengembalikan `AssembleResult` dengan:

<ParamField path="messages" type="Message[]" required>
  Pesan berurutan yang akan dikirim ke model.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Perkiraan mesin atas total token dalam konteks yang dirakit. OpenClaw menggunakan ini untuk keputusan ambang Compaction dan pelaporan diagnostik.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Ditambahkan di awal prompt sistem.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Mengontrol estimasi token mana yang digunakan runner untuk precheck overflow
  preventif. Default-nya `"assembled"`, yang berarti hanya estimasi prompt
  yang telah dirakit yang diperiksa - sesuai untuk mesin yang mengembalikan
  konteks berjendela dan mandiri. Atur ke `"preassembly_may_overflow"` hanya
  ketika tampilan rakitan Anda dapat menyembunyikan risiko overflow dalam
  transkrip yang mendasarinya; runner kemudian mengambil maksimum dari estimasi
  rakitan dan estimasi riwayat sesi pra-assembly (tanpa jendela) saat memutuskan
  apakah akan melakukan Compaction secara preventif. Bagaimanapun, pesan yang Anda
  kembalikan tetap yang dilihat model - `promptAuthority` hanya memengaruhi precheck.
</ParamField>

`compact` mengembalikan `CompactResult`. Ketika Compaction merotasi transkrip
aktif, `result.sessionId` dan `result.sessionFile` mengidentifikasi sesi penerus
yang harus digunakan oleh percobaan ulang atau giliran berikutnya.

Anggota opsional:

| Anggota                        | Jenis  | Tujuan                                                                                                          |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metode | Menginisialisasi status mesin untuk sesi. Dipanggil sekali saat mesin pertama kali melihat sesi (misalnya, impor riwayat). |
| `ingestBatch(params)`          | Metode | Mengingest giliran yang selesai sebagai batch. Dipanggil setelah proses selesai, dengan semua pesan dari giliran tersebut sekaligus. |
| `afterTurn(params)`            | Metode | Pekerjaan siklus hidup pasca-proses (mempertahankan status, memicu Compaction latar belakang).                 |
| `prepareSubagentSpawn(params)` | Metode | Menyiapkan status bersama untuk sesi turunan sebelum dimulai.                                                   |
| `onSubagentEnded(params)`      | Metode | Membersihkan setelah subagent berakhir.                                                                         |
| `dispose()`                    | Metode | Melepaskan resource. Dipanggil saat gateway dimatikan atau Plugin dimuat ulang - bukan per sesi.               |

### ownsCompaction

`ownsCompaction` mengontrol apakah auto-compaction bawaan dalam-percobaan milik Pi tetap aktif untuk proses tersebut:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Mesin memiliki perilaku Compaction. OpenClaw menonaktifkan auto-compaction bawaan Pi untuk proses tersebut, dan implementasi `compact()` milik mesin bertanggung jawab atas `/compact`, Compaction pemulihan overflow, dan Compaction proaktif apa pun yang ingin dilakukan di `afterTurn()`. OpenClaw mungkin masih menjalankan pengaman overflow pra-prompt; ketika memprediksi seluruh transkrip akan overflow, jalur pemulihan memanggil `compact()` milik mesin aktif sebelum mengirim prompt lain.
  </Accordion>
  <Accordion title="ownsCompaction: false atau tidak ditetapkan">
    Auto-compaction bawaan Pi mungkin masih berjalan selama eksekusi prompt, tetapi metode `compact()` milik mesin aktif tetap dipanggil untuk `/compact` dan pemulihan overflow.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **tidak** berarti OpenClaw secara otomatis fallback ke jalur Compaction mesin legacy.
</Warning>

Itu berarti ada dua pola Plugin yang valid:

<Tabs>
  <Tab title="Mode memiliki">
    Implementasikan algoritma Compaction Anda sendiri dan tetapkan `ownsCompaction: true`.
  </Tab>
  <Tab title="Mode delegasi">
    Tetapkan `ownsCompaction: false` dan buat `compact()` memanggil `delegateCompactionToRuntime(...)` dari `openclaw/plugin-sdk/core` untuk menggunakan perilaku Compaction bawaan OpenClaw.
  </Tab>
</Tabs>

`compact()` no-op tidak aman untuk mesin non-owning aktif karena menonaktifkan jalur Compaction normal `/compact` dan pemulihan overflow untuk slot mesin tersebut.

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

<Note>
Slot bersifat eksklusif saat runtime - hanya satu mesin konteks terdaftar yang di-resolve untuk proses atau operasi Compaction tertentu. Plugin `kind: "context-engine"` lain yang aktif tetap dapat dimuat dan menjalankan kode registrasinya; `plugins.slots.contextEngine` hanya memilih id mesin terdaftar mana yang di-resolve OpenClaw ketika membutuhkan mesin konteks.
</Note>

<Note>
**Uninstal Plugin:** ketika Anda menguninstal Plugin yang saat ini dipilih sebagai `plugins.slots.contextEngine`, OpenClaw mereset slot kembali ke default (`legacy`). Perilaku reset yang sama berlaku untuk `plugins.slots.memory`. Tidak diperlukan edit config manual.
</Note>

## Hubungan dengan Compaction dan memori

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction adalah salah satu tanggung jawab mesin konteks. Mesin lama mendelegasikan ke peringkasan bawaan OpenClaw. Mesin Plugin dapat menerapkan strategi Compaction apa pun (ringkasan DAG, pengambilan vektor, dll.).
  </Accordion>
  <Accordion title="Plugin memori">
    Plugin memori (`plugins.slots.memory`) terpisah dari mesin konteks. Plugin memori menyediakan pencarian/pengambilan; mesin konteks mengontrol apa yang dilihat model. Keduanya dapat bekerja bersama - mesin konteks mungkin menggunakan data Plugin memori selama perakitan. Mesin Plugin yang menginginkan jalur prompt memori aktif sebaiknya menggunakan `buildMemorySystemPromptAddition(...)` dari `openclaw/plugin-sdk/core`, yang mengonversi bagian prompt memori aktif menjadi `systemPromptAddition` yang siap ditambahkan di awal. Jika sebuah mesin membutuhkan kontrol tingkat lebih rendah, mesin itu tetap dapat mengambil baris mentah dari `openclaw/plugin-sdk/memory-host-core` melalui `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Pemangkasan sesi">
    Pemotongan hasil alat lama di memori tetap berjalan terlepas dari mesin konteks mana yang aktif.
  </Accordion>
</AccordionGroup>

## Tips

- Gunakan `openclaw doctor` untuk memverifikasi mesin Anda dimuat dengan benar.
- Jika beralih mesin, sesi yang ada terus berjalan dengan riwayatnya saat ini. Mesin baru mengambil alih untuk eksekusi berikutnya.
- Kesalahan mesin dicatat dan ditampilkan dalam diagnostik. Jika mesin Plugin gagal didaftarkan atau id mesin yang dipilih tidak dapat diselesaikan, OpenClaw tidak otomatis beralih ke cadangan; eksekusi gagal sampai Anda memperbaiki Plugin atau mengalihkan `plugins.slots.contextEngine` kembali ke `"legacy"`.
- Untuk pengembangan, gunakan `openclaw plugins install -l ./my-engine` untuk menautkan direktori Plugin lokal tanpa menyalin.

## Terkait

- [Compaction](/id/concepts/compaction) - meringkas percakapan panjang
- [Konteks](/id/concepts/context) - cara konteks dibangun untuk giliran agen
- [Arsitektur Plugin](/id/plugins/architecture) - mendaftarkan Plugin mesin konteks
- [Manifes Plugin](/id/plugins/manifest) - kolom manifes Plugin
- [Plugin](/id/tools/plugin) - ikhtisar Plugin
