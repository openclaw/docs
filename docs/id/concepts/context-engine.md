---
read_when:
    - Anda ingin memahami cara OpenClaw menyusun konteks model
    - Anda sedang beralih antara mesin lama dan mesin Plugin
    - Anda sedang membangun Plugin mesin konteks
sidebarTitle: Context engine
summary: 'Mesin konteks: perakitan konteks yang dapat dipasang, Compaction, dan siklus hidup subagen'
title: Mesin konteks
x-i18n:
    generated_at: "2026-04-30T09:43:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

Sebuah **mesin konteks** mengontrol bagaimana OpenClaw membangun konteks model untuk setiap eksekusi: pesan mana yang disertakan, bagaimana meringkas riwayat lama, dan bagaimana mengelola konteks melintasi batas subagen.

OpenClaw hadir dengan mesin bawaan `legacy` dan menggunakannya secara default — sebagian besar pengguna tidak perlu mengubah ini. Pasang dan pilih mesin Plugin hanya saat Anda menginginkan perilaku perakitan, Compaction, atau pemanggilan ulang lintas-sesi yang berbeda.

## Mulai cepat

<Steps>
  <Step title="Check which engine is active">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Install a plugin engine">
    Plugin mesin konteks dipasang seperti Plugin OpenClaw lainnya.

    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="From a local path">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Enable and select the engine">
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

    Mulai ulang gateway setelah memasang dan mengonfigurasi.

  </Step>
  <Step title="Switch back to legacy (optional)">
    Atur `contextEngine` ke `"legacy"` (atau hapus kunci tersebut sepenuhnya — `"legacy"` adalah default).
  </Step>
</Steps>

## Cara kerjanya

Setiap kali OpenClaw menjalankan prompt model, mesin konteks berpartisipasi pada empat titik siklus hidup:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Dipanggil saat pesan baru ditambahkan ke sesi. Mesin dapat menyimpan atau mengindeks pesan di penyimpanan datanya sendiri.
  </Accordion>
  <Accordion title="2. Assemble">
    Dipanggil sebelum setiap eksekusi model. Mesin mengembalikan sekumpulan pesan berurutan (dan `systemPromptAddition` opsional) yang muat dalam anggaran token.
  </Accordion>
  <Accordion title="3. Compact">
    Dipanggil saat jendela konteks penuh, atau saat pengguna menjalankan `/compact`. Mesin meringkas riwayat lama untuk mengosongkan ruang.
  </Accordion>
  <Accordion title="4. After turn">
    Dipanggil setelah eksekusi selesai. Mesin dapat mempertahankan status, memicu Compaction latar belakang, atau memperbarui indeks.
  </Accordion>
</AccordionGroup>

Untuk harness Codex non-ACP yang dibundel, OpenClaw menerapkan siklus hidup yang sama dengan memproyeksikan konteks yang dirakit ke instruksi developer Codex dan prompt giliran saat ini. Codex tetap memiliki riwayat thread native dan compactor native miliknya.

### Siklus hidup subagen (opsional)

OpenClaw memanggil dua hook siklus hidup subagen opsional:

<ParamField path="prepareSubagentSpawn" type="method">
  Siapkan status konteks bersama sebelum eksekusi anak dimulai. Hook menerima kunci sesi induk/anak, `contextMode` (`isolated` atau `fork`), id/file transkrip yang tersedia, dan TTL opsional. Jika mengembalikan handle rollback, OpenClaw memanggilnya saat spawn gagal setelah persiapan berhasil.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bersihkan saat sesi subagen selesai atau disapu.
</ParamField>

### Penambahan prompt sistem

Metode `assemble` dapat mengembalikan string `systemPromptAddition`. OpenClaw menambahkan ini di awal prompt sistem untuk eksekusi tersebut. Ini memungkinkan mesin menyuntikkan panduan pemanggilan ulang dinamis, instruksi retrieval, atau petunjuk sadar-konteks tanpa memerlukan file workspace statis.

## Mesin legacy

Mesin bawaan `legacy` mempertahankan perilaku asli OpenClaw:

- **Ingest**: no-op (manajer sesi menangani persistensi pesan secara langsung).
- **Assemble**: pass-through (pipeline sanitize → validate → limit yang ada di runtime menangani perakitan konteks).
- **Compact**: mendelegasikan ke Compaction peringkasan bawaan, yang membuat satu ringkasan pesan lama dan menjaga pesan terbaru tetap utuh.
- **After turn**: no-op.

Mesin legacy tidak mendaftarkan alat atau menyediakan `systemPromptAddition`.

Saat `plugins.slots.contextEngine` tidak diatur (atau diatur ke `"legacy"`), mesin ini digunakan secara otomatis.

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

Factory `ctx` menyertakan nilai `config`, `agentDir`, dan `workspaceDir` opsional agar Plugin dapat menginisialisasi status per-agen atau per-workspace sebelum hook siklus hidup pertama berjalan.

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

| Anggota            | Jenis    | Tujuan                                                   |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Properti | Id mesin, nama, versi, dan apakah mesin memiliki Compaction |
| `ingest(params)`   | Metode   | Menyimpan satu pesan                                    |
| `assemble(params)` | Metode   | Membangun konteks untuk eksekusi model (mengembalikan `AssembleResult`) |
| `compact(params)`  | Metode   | Meringkas/mengurangi konteks                            |

`assemble` mengembalikan `AssembleResult` dengan:

<ParamField path="messages" type="Message[]" required>
  Pesan berurutan untuk dikirim ke model.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Estimasi mesin atas total token dalam konteks yang dirakit. OpenClaw menggunakan ini untuk keputusan ambang Compaction dan pelaporan diagnostik.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Ditambahkan di awal prompt sistem.
</ParamField>

`compact` mengembalikan `CompactResult`. Saat Compaction merotasi transkrip aktif, `result.sessionId` dan `result.sessionFile` mengidentifikasi sesi penerus yang harus digunakan oleh percobaan ulang atau giliran berikutnya.

Anggota opsional:

| Anggota                        | Jenis  | Tujuan                                                                                                          |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metode | Menginisialisasi status mesin untuk sebuah sesi. Dipanggil sekali saat mesin pertama kali melihat sebuah sesi (misalnya, mengimpor riwayat). |
| `ingestBatch(params)`          | Metode | Menelan giliran yang selesai sebagai batch. Dipanggil setelah eksekusi selesai, dengan semua pesan dari giliran tersebut sekaligus. |
| `afterTurn(params)`            | Metode | Pekerjaan siklus hidup setelah eksekusi (mempertahankan status, memicu Compaction latar belakang). |
| `prepareSubagentSpawn(params)` | Metode | Menyiapkan status bersama untuk sesi anak sebelum dimulai. |
| `onSubagentEnded(params)`      | Metode | Membersihkan setelah subagen berakhir. |
| `dispose()`                    | Metode | Melepaskan sumber daya. Dipanggil saat gateway dimatikan atau Plugin dimuat ulang — bukan per-sesi. |

### ownsCompaction

`ownsCompaction` mengontrol apakah Compaction otomatis dalam-percobaan bawaan Pi tetap aktif untuk eksekusi:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Mesin memiliki perilaku Compaction. OpenClaw menonaktifkan Compaction otomatis bawaan Pi untuk eksekusi tersebut, dan implementasi `compact()` milik mesin bertanggung jawab atas `/compact`, Compaction pemulihan overflow, dan Compaction proaktif apa pun yang ingin dilakukan di `afterTurn()`. OpenClaw mungkin masih menjalankan safeguard overflow pra-prompt; saat memprediksi bahwa transkrip penuh akan overflow, jalur pemulihan memanggil `compact()` milik mesin aktif sebelum mengirim prompt lain.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Compaction otomatis bawaan Pi mungkin masih berjalan selama eksekusi prompt, tetapi metode `compact()` milik mesin aktif tetap dipanggil untuk `/compact` dan pemulihan overflow.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **tidak** berarti OpenClaw secara otomatis kembali ke jalur Compaction milik mesin legacy.
</Warning>

Itu berarti ada dua pola Plugin yang valid:

<Tabs>
  <Tab title="Owning mode">
    Implementasikan algoritme Compaction Anda sendiri dan atur `ownsCompaction: true`.
  </Tab>
  <Tab title="Delegating mode">
    Atur `ownsCompaction: false` dan buat `compact()` memanggil `delegateCompactionToRuntime(...)` dari `openclaw/plugin-sdk/core` untuk menggunakan perilaku Compaction bawaan OpenClaw.
  </Tab>
</Tabs>

`compact()` no-op tidak aman untuk mesin non-owning yang aktif karena menonaktifkan jalur Compaction `/compact` dan pemulihan overflow normal untuk slot mesin tersebut.

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
Slot bersifat eksklusif pada waktu eksekusi — hanya satu mesin konteks terdaftar yang di-resolve untuk eksekusi atau operasi Compaction tertentu. Plugin `kind: "context-engine"` lain yang aktif masih dapat dimuat dan menjalankan kode registrasinya; `plugins.slots.contextEngine` hanya memilih id mesin terdaftar mana yang di-resolve OpenClaw saat membutuhkan mesin konteks.
</Note>

<Note>
**Penghapusan Plugin:** saat Anda menghapus Plugin yang saat ini dipilih sebagai `plugins.slots.contextEngine`, OpenClaw mereset slot kembali ke default (`legacy`). Perilaku reset yang sama berlaku untuk `plugins.slots.memory`. Tidak diperlukan pengeditan konfigurasi manual.
</Note>

## Hubungan dengan Compaction dan memori

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction adalah salah satu tanggung jawab mesin konteks. Mesin lama mendelegasikan ke peringkasan bawaan OpenClaw. Mesin Plugin dapat mengimplementasikan strategi pemadatan apa pun (ringkasan DAG, pengambilan vektor, dan sebagainya).
  </Accordion>
  <Accordion title="Plugin memori">
    Plugin memori (`plugins.slots.memory`) terpisah dari mesin konteks. Plugin memori menyediakan pencarian/pengambilan; mesin konteks mengontrol apa yang dilihat model. Keduanya dapat bekerja bersama — sebuah mesin konteks dapat menggunakan data Plugin memori saat perakitan. Mesin Plugin yang menginginkan alur prompt memori aktif sebaiknya memilih `buildMemorySystemPromptAddition(...)` dari `openclaw/plugin-sdk/core`, yang mengonversi bagian prompt memori aktif menjadi `systemPromptAddition` yang siap ditambahkan di awal. Jika sebuah mesin memerlukan kontrol tingkat lebih rendah, mesin tersebut masih dapat mengambil baris mentah dari `openclaw/plugin-sdk/memory-host-core` melalui `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Pemangkasan sesi">
    Pemangkasan hasil alat lama dalam memori tetap berjalan terlepas dari mesin konteks mana yang aktif.
  </Accordion>
</AccordionGroup>

## Tips

- Gunakan `openclaw doctor` untuk memverifikasi bahwa mesin Anda dimuat dengan benar.
- Jika beralih mesin, sesi yang ada tetap berlanjut dengan riwayatnya saat ini. Mesin baru mengambil alih untuk eksekusi mendatang.
- Kesalahan mesin dicatat dan ditampilkan dalam diagnostik. Jika mesin Plugin gagal mendaftar atau id mesin yang dipilih tidak dapat diresolusikan, OpenClaw tidak melakukan fallback secara otomatis; eksekusi gagal hingga Anda memperbaiki Plugin atau mengalihkan `plugins.slots.contextEngine` kembali ke `"legacy"`.
- Untuk pengembangan, gunakan `openclaw plugins install -l ./my-engine` untuk menautkan direktori Plugin lokal tanpa menyalin.

## Terkait

- [Compaction](/id/concepts/compaction) — meringkas percakapan panjang
- [Konteks](/id/concepts/context) — bagaimana konteks dibangun untuk giliran agen
- [Arsitektur Plugin](/id/plugins/architecture) — mendaftarkan Plugin mesin konteks
- [Manifes Plugin](/id/plugins/manifest) — bidang manifes Plugin
- [Plugin](/id/tools/plugin) — ikhtisar Plugin
