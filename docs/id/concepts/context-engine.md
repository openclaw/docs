---
read_when:
    - Anda ingin memahami bagaimana OpenClaw menyusun konteks model
    - Anda sedang beralih antara mesin lama dan mesin Plugin
    - Anda sedang membangun Plugin mesin konteks
sidebarTitle: Context engine
summary: 'Mesin konteks: perakitan konteks yang dapat dipasangkan, Compaction, dan siklus hidup subagen'
title: Mesin konteks
x-i18n:
    generated_at: "2026-05-02T09:18:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7477dd1d48f9633586dce67204912a810e0931d7bc9f2d6719ba465fe19681b
    source_path: concepts/context-engine.md
    workflow: 16
---

**mesin konteks** mengontrol cara OpenClaw membangun konteks model untuk setiap run: pesan mana yang disertakan, cara meringkas riwayat lama, dan cara mengelola konteks melintasi batas subagent.

OpenClaw menyertakan mesin bawaan `legacy` dan menggunakannya secara default — sebagian besar pengguna tidak perlu mengubah ini. Instal dan pilih mesin plugin hanya ketika Anda menginginkan perilaku assembly, compaction, atau ingatan lintas sesi yang berbeda.

## Mulai cepat

<Steps>
  <Step title="Periksa mesin mana yang aktif">
    ```bash
    openclaw doctor
    # atau periksa config secara langsung:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Instal mesin plugin">
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
    Atur `contextEngine` ke `"legacy"` (atau hapus kuncinya sepenuhnya — `"legacy"` adalah default).
  </Step>
</Steps>

## Cara kerjanya

Setiap kali OpenClaw menjalankan prompt model, mesin konteks berpartisipasi pada empat titik lifecycle:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Dipanggil ketika pesan baru ditambahkan ke sesi. Mesin dapat menyimpan atau mengindeks pesan tersebut di penyimpanan datanya sendiri.
  </Accordion>
  <Accordion title="2. Assemble">
    Dipanggil sebelum setiap run model. Mesin mengembalikan sekumpulan pesan berurutan (dan `systemPromptAddition` opsional) yang muat dalam anggaran token.
  </Accordion>
  <Accordion title="3. Compact">
    Dipanggil ketika jendela konteks penuh, atau ketika pengguna menjalankan `/compact`. Mesin meringkas riwayat lama untuk mengosongkan ruang.
  </Accordion>
  <Accordion title="4. Setelah turn">
    Dipanggil setelah sebuah run selesai. Mesin dapat mempertahankan state, memicu Compaction latar belakang, atau memperbarui indeks.
  </Accordion>
</AccordionGroup>

Untuk harness Codex non-ACP bawaan, OpenClaw menerapkan lifecycle yang sama dengan memproyeksikan konteks yang telah dirakit ke dalam instruksi developer Codex dan prompt turn saat ini. Codex tetap memiliki riwayat thread native dan compactor native-nya sendiri.

### Lifecycle subagent (opsional)

OpenClaw memanggil dua hook lifecycle subagent opsional:

<ParamField path="prepareSubagentSpawn" type="method">
  Siapkan state konteks bersama sebelum run child dimulai. Hook menerima kunci sesi parent/child, `contextMode` (`isolated` atau `fork`), id/file transkrip yang tersedia, dan TTL opsional. Jika hook mengembalikan handle rollback, OpenClaw memanggilnya ketika spawn gagal setelah persiapan berhasil.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bersihkan ketika sesi subagent selesai atau disapu.
</ParamField>

### Tambahan prompt sistem

Metode `assemble` dapat mengembalikan string `systemPromptAddition`. OpenClaw menambahkan ini di awal prompt sistem untuk run tersebut. Ini memungkinkan mesin menyuntikkan panduan ingatan dinamis, instruksi retrieval, atau petunjuk sadar konteks tanpa memerlukan file workspace statis.

## Mesin legacy

Mesin bawaan `legacy` mempertahankan perilaku asli OpenClaw:

- **Ingest**: no-op (manager sesi menangani persistensi pesan secara langsung).
- **Assemble**: pass-through (pipeline sanitize → validate → limit yang ada di runtime menangani assembly konteks).
- **Compact**: mendelegasikan ke Compaction peringkasan bawaan, yang membuat satu ringkasan dari pesan lama dan mempertahankan pesan terbaru apa adanya.
- **Setelah turn**: no-op.

Mesin legacy tidak mendaftarkan tool atau menyediakan `systemPromptAddition`.

Ketika `plugins.slots.contextEngine` tidak diatur (atau diatur ke `"legacy"`), mesin ini digunakan secara otomatis.

## Mesin plugin

Plugin dapat mendaftarkan mesin konteks menggunakan API plugin:

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

Factory `ctx` menyertakan nilai `config`, `agentDir`, dan `workspaceDir`
opsional agar plugin dapat menginisialisasi state per-agent atau per-workspace sebelum
hook lifecycle pertama berjalan.

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

| Anggota            | Jenis    | Tujuan                                                   |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Properti | Id mesin, nama, versi, dan apakah mesin memiliki Compaction |
| `ingest(params)`   | Metode   | Menyimpan satu pesan                                    |
| `assemble(params)` | Metode   | Membangun konteks untuk run model (mengembalikan `AssembleResult`) |
| `compact(params)`  | Metode   | Meringkas/mengurangi konteks                            |

`assemble` mengembalikan `AssembleResult` dengan:

<ParamField path="messages" type="Message[]" required>
  Pesan berurutan untuk dikirim ke model.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Estimasi mesin atas total token dalam konteks yang telah dirakit. OpenClaw menggunakan ini untuk keputusan ambang Compaction dan pelaporan diagnostik.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Ditambahkan di awal prompt sistem.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Mengontrol estimasi token mana yang digunakan runner untuk precheck overflow
  preemptif. Default ke `"assembled"`, yang berarti hanya estimasi
  prompt yang telah dirakit yang diperiksa — sesuai untuk mesin yang mengembalikan
  konteks berjendela dan mandiri. Atur ke `"preassembly_may_overflow"` hanya
  ketika tampilan yang dirakit dapat menyembunyikan risiko overflow dalam
  transkrip yang mendasarinya; runner kemudian mengambil nilai maksimum dari estimasi yang dirakit
  dan estimasi riwayat sesi pra-assembly (tanpa jendela) saat memutuskan
  apakah akan melakukan Compaction preemptif. Dalam kedua kasus, pesan yang Anda kembalikan
  tetap menjadi yang dilihat model — `promptAuthority` hanya memengaruhi precheck.
</ParamField>

`compact` mengembalikan `CompactResult`. Ketika Compaction merotasi transkrip
aktif, `result.sessionId` dan `result.sessionFile` mengidentifikasi sesi penerus
yang harus digunakan oleh retry atau turn berikutnya.

Anggota opsional:

| Anggota                        | Jenis  | Tujuan                                                                                                          |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metode | Menginisialisasi state mesin untuk sebuah sesi. Dipanggil sekali ketika mesin pertama kali melihat sesi (misalnya, import riwayat). |
| `ingestBatch(params)`          | Metode | Meng-ingest turn yang selesai sebagai batch. Dipanggil setelah run selesai, dengan semua pesan dari turn tersebut sekaligus. |
| `afterTurn(params)`            | Metode | Pekerjaan lifecycle pasca-run (mempertahankan state, memicu Compaction latar belakang).                         |
| `prepareSubagentSpawn(params)` | Metode | Menyiapkan state bersama untuk sesi child sebelum dimulai.                                                       |
| `onSubagentEnded(params)`      | Metode | Membersihkan setelah subagent berakhir.                                                                          |
| `dispose()`                    | Metode | Melepaskan resource. Dipanggil saat gateway dimatikan atau plugin dimuat ulang — bukan per-sesi.                 |

### ownsCompaction

`ownsCompaction` mengontrol apakah auto-compaction bawaan dalam-upaya milik Pi tetap aktif untuk run tersebut:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Mesin memiliki perilaku Compaction. OpenClaw menonaktifkan auto-compaction bawaan Pi untuk run tersebut, dan implementasi `compact()` milik mesin bertanggung jawab atas `/compact`, Compaction pemulihan overflow, dan Compaction proaktif apa pun yang ingin dilakukan di `afterTurn()`. OpenClaw masih dapat menjalankan safeguard overflow pra-prompt; ketika safeguard memprediksi transkrip penuh akan overflow, jalur pemulihan memanggil `compact()` milik mesin aktif sebelum mengirim prompt lain.
  </Accordion>
  <Accordion title="ownsCompaction: false atau tidak diatur">
    Auto-compaction bawaan Pi masih dapat berjalan selama eksekusi prompt, tetapi metode `compact()` milik mesin aktif tetap dipanggil untuk `/compact` dan pemulihan overflow.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **tidak** berarti OpenClaw secara otomatis fallback ke jalur Compaction mesin legacy.
</Warning>

Artinya ada dua pola plugin yang valid:

<Tabs>
  <Tab title="Mode pemilik">
    Implementasikan algoritma Compaction Anda sendiri dan atur `ownsCompaction: true`.
  </Tab>
  <Tab title="Mode delegasi">
    Atur `ownsCompaction: false` dan buat `compact()` memanggil `delegateCompactionToRuntime(...)` dari `openclaw/plugin-sdk/core` untuk menggunakan perilaku Compaction bawaan OpenClaw.
  </Tab>
</Tabs>

`compact()` no-op tidak aman untuk mesin non-pemilik yang aktif karena menonaktifkan jalur Compaction normal `/compact` dan pemulihan overflow untuk slot mesin tersebut.

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
Slot bersifat eksklusif saat run time — hanya satu mesin konteks terdaftar yang di-resolve untuk run atau operasi Compaction tertentu. Plugin `kind: "context-engine"` lain yang aktif tetap dapat dimuat dan menjalankan kode registrasinya; `plugins.slots.contextEngine` hanya memilih id mesin terdaftar mana yang di-resolve OpenClaw ketika membutuhkan mesin konteks.
</Note>

<Note>
**Uninstall plugin:** ketika Anda menghapus instalasi plugin yang saat ini dipilih sebagai `plugins.slots.contextEngine`, OpenClaw mengatur ulang slot kembali ke default (`legacy`). Perilaku reset yang sama berlaku untuk `plugins.slots.memory`. Tidak diperlukan edit config manual.
</Note>

## Hubungan dengan Compaction dan memori

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction adalah salah satu tanggung jawab mesin konteks. Mesin lama mendelegasikan ke peringkasan bawaan OpenClaw. Mesin Plugin dapat mengimplementasikan strategi compaction apa pun (ringkasan DAG, pengambilan vektor, dll.).
  </Accordion>
  <Accordion title="Plugin memori">
    Plugin memori (`plugins.slots.memory`) terpisah dari mesin konteks. Plugin memori menyediakan pencarian/pengambilan; mesin konteks mengontrol apa yang dilihat model. Keduanya dapat bekerja bersama — mesin konteks mungkin menggunakan data plugin memori saat perakitan. Mesin Plugin yang menginginkan jalur prompt memori aktif sebaiknya memilih `buildMemorySystemPromptAddition(...)` dari `openclaw/plugin-sdk/core`, yang mengonversi bagian prompt memori aktif menjadi `systemPromptAddition` siap-ditambahkan-di-awal. Jika mesin memerlukan kontrol tingkat lebih rendah, mesin tersebut tetap dapat mengambil baris mentah dari `openclaw/plugin-sdk/memory-host-core` melalui `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Pemangkasan sesi">
    Pemangkasan hasil alat lama di memori tetap berjalan terlepas dari mesin konteks mana yang aktif.
  </Accordion>
</AccordionGroup>

## Kiat

- Gunakan `openclaw doctor` untuk memverifikasi mesin Anda dimuat dengan benar.
- Jika mengganti mesin, sesi yang ada tetap berlanjut dengan riwayatnya saat ini. Mesin baru mengambil alih untuk eksekusi mendatang.
- Kesalahan mesin dicatat dan ditampilkan dalam diagnostik. Jika mesin Plugin gagal didaftarkan atau id mesin yang dipilih tidak dapat diselesaikan, OpenClaw tidak otomatis kembali ke alternatif; eksekusi gagal sampai Anda memperbaiki Plugin atau mengalihkan `plugins.slots.contextEngine` kembali ke `"legacy"`.
- Untuk pengembangan, gunakan `openclaw plugins install -l ./my-engine` untuk menautkan direktori Plugin lokal tanpa menyalin.

## Terkait

- [Compaction](/id/concepts/compaction) — meringkas percakapan panjang
- [Konteks](/id/concepts/context) — cara konteks dibangun untuk giliran agen
- [Arsitektur Plugin](/id/plugins/architecture) — mendaftarkan Plugin mesin konteks
- [Manifes Plugin](/id/plugins/manifest) — bidang manifes Plugin
- [Plugin](/id/tools/plugin) — ikhtisar Plugin
