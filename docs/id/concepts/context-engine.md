---
read_when:
    - Anda ingin memahami bagaimana OpenClaw menyusun konteks model
    - Anda sedang beralih antara mesin lama dan mesin plugin
    - Anda sedang membangun Plugin mesin konteks
sidebarTitle: Context engine
summary: 'Mesin konteks: perakitan konteks yang dapat di-plug-in, Compaction, dan siklus hidup subagen'
title: Mesin konteks
x-i18n:
    generated_at: "2026-06-30T14:27:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

Sebuah **mesin konteks** mengontrol cara OpenClaw membangun konteks model untuk setiap run: pesan mana yang akan disertakan, cara meringkas riwayat lama, dan cara mengelola konteks melintasi batas subagen.

OpenClaw menyertakan mesin bawaan `legacy` dan menggunakannya secara default - sebagian besar pengguna tidak perlu mengubah ini. Instal dan pilih mesin plugin hanya ketika Anda menginginkan perilaku perakitan, Compaction, atau pengingatan lintas-sesi yang berbeda.

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
    Atur `contextEngine` ke `"legacy"` (atau hapus kunci sepenuhnya - `"legacy"` adalah default).
  </Step>
</Steps>

## Cara kerjanya

Setiap kali OpenClaw menjalankan prompt model, mesin konteks berpartisipasi pada empat titik siklus hidup:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Dipanggil saat pesan baru ditambahkan ke sesi. Mesin dapat menyimpan atau mengindeks pesan dalam penyimpanan datanya sendiri.
  </Accordion>
  <Accordion title="2. Assemble">
    Dipanggil sebelum setiap run model. Mesin mengembalikan sekumpulan pesan berurutan (dan `systemPromptAddition` opsional) yang muat dalam anggaran token.
  </Accordion>
  <Accordion title="3. Compact">
    Dipanggil saat jendela konteks penuh, atau saat pengguna menjalankan `/compact`. Mesin meringkas riwayat lama untuk mengosongkan ruang.
  </Accordion>
  <Accordion title="4. After turn">
    Dipanggil setelah sebuah run selesai. Mesin dapat mempertahankan state, memicu Compaction latar belakang, atau memperbarui indeks.
  </Accordion>
</AccordionGroup>

Untuk harness Codex non-ACP yang dibundel, OpenClaw menerapkan siklus hidup yang sama dengan memproyeksikan konteks yang dirakit ke dalam instruksi developer Codex dan prompt giliran saat ini. Codex tetap memiliki riwayat thread native dan compactor native-nya sendiri.

### Siklus hidup subagen (opsional)

OpenClaw memanggil dua hook siklus hidup subagen opsional:

<ParamField path="prepareSubagentSpawn" type="method">
  Menyiapkan state konteks bersama sebelum run anak dimulai. Hook menerima kunci sesi induk/anak, `contextMode` (`isolated` atau `fork`), id/file transkrip yang tersedia, dan TTL opsional. Jika mengembalikan handle rollback, OpenClaw memanggilnya ketika spawn gagal setelah persiapan berhasil. Spawn subagen native yang meminta `lightContext` dan terselesaikan menjadi `contextMode="isolated"` sengaja melewati hook ini agar anak dimulai dari konteks bootstrap ringan tanpa state pra-spawn yang dikelola mesin konteks.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Membersihkan saat sesi subagen selesai atau disapu.
</ParamField>

### Tambahan prompt sistem

Metode `assemble` dapat mengembalikan string `systemPromptAddition`. OpenClaw menambahkan ini di awal prompt sistem untuk run tersebut. Ini memungkinkan mesin menyuntikkan panduan pengingatan dinamis, instruksi retrieval, atau petunjuk sadar konteks tanpa memerlukan file workspace statis.

## Mesin legacy

Mesin bawaan `legacy` mempertahankan perilaku asli OpenClaw:

- **Ingest**: no-op (manajer sesi menangani persistensi pesan secara langsung).
- **Assemble**: pass-through (pipeline sanitize → validate → limit yang ada di runtime menangani perakitan konteks).
- **Compact**: mendelegasikan ke Compaction peringkasan bawaan, yang membuat satu ringkasan pesan lama dan menjaga pesan terbaru tetap utuh.
- **After turn**: no-op.

Mesin legacy tidak mendaftarkan tool atau menyediakan `systemPromptAddition`.

Ketika tidak ada `plugins.slots.contextEngine` yang ditetapkan (atau ditetapkan ke `"legacy"`), mesin ini digunakan secara otomatis.

## Mesin plugin

Sebuah plugin dapat mendaftarkan mesin konteks menggunakan API plugin:

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
opsional sehingga plugin dapat menginisialisasi state per-agen atau per-workspace sebelum
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

| Anggota            | Jenis    | Tujuan                                                        |
| ------------------ | -------- | ------------------------------------------------------------- |
| `info`             | Properti | Id mesin, nama, versi, dan apakah mesin memiliki Compaction    |
| `ingest(params)`   | Metode   | Menyimpan satu pesan                                          |
| `assemble(params)` | Metode   | Membangun konteks untuk run model (mengembalikan `AssembleResult`) |
| `compact(params)`  | Metode   | Meringkas/mengurangi konteks                                  |

`assemble` mengembalikan `AssembleResult` dengan:

<ParamField path="messages" type="Message[]" required>
  Pesan berurutan yang akan dikirim ke model.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Estimasi mesin atas total token dalam konteks yang dirakit. OpenClaw menggunakan ini untuk keputusan ambang Compaction dan pelaporan diagnostik.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Ditambahkan di awal prompt sistem.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Mengontrol estimasi token mana yang digunakan runner untuk precheck overflow
  preventif. Default ke `"assembled"`, yang berarti hanya estimasi prompt
  yang dirakit yang diperiksa untuk mesin yang tidak memiliki Compaction.
  Mesin yang menetapkan `ownsCompaction: true` mengelola admission prompt
  mereka sendiri, jadi OpenClaw melewati precheck pra-prompt generik secara default. Tetapkan
  `"preassembly_may_overflow"` hanya ketika tampilan yang dirakit dapat menyembunyikan risiko overflow
  dalam transkrip yang mendasarinya; runner kemudian menjaga precheck generik
  tetap aktif dan mengambil maksimum dari estimasi yang dirakit dan estimasi
  riwayat sesi pra-perakitan (tanpa jendela) saat memutuskan apakah akan
  melakukan compact secara preventif. Bagaimanapun, pesan yang Anda kembalikan tetap yang
  dilihat model - `promptAuthority` hanya memengaruhi precheck.
</ParamField>

`compact` mengembalikan `CompactResult`. Ketika Compaction merotasi transkrip
aktif, `result.sessionId` dan `result.sessionFile` mengidentifikasi sesi penerus
yang harus digunakan retry atau giliran berikutnya.

Anggota opsional:

| Anggota                        | Jenis  | Tujuan                                                                                                                  |
| ------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metode | Menginisialisasi state mesin untuk sebuah sesi. Dipanggil sekali saat mesin pertama kali melihat sesi (mis., mengimpor riwayat). |
| `ingestBatch(params)`          | Metode | Menelan giliran yang selesai sebagai batch. Dipanggil setelah sebuah run selesai, dengan semua pesan dari giliran itu sekaligus. |
| `afterTurn(params)`            | Metode | Pekerjaan siklus hidup pasca-run (mempertahankan state, memicu Compaction latar belakang).                              |
| `prepareSubagentSpawn(params)` | Metode | Menyiapkan state bersama untuk sesi anak sebelum dimulai.                                                               |
| `onSubagentEnded(params)`      | Metode | Membersihkan setelah subagen berakhir.                                                                                  |
| `dispose()`                    | Metode | Melepaskan sumber daya. Dipanggil selama shutdown gateway atau reload plugin - bukan per-sesi.                          |

### Pengaturan runtime

Hook siklus hidup yang berjalan di dalam OpenClaw menerima objek
`runtimeSettings` opsional. Ini adalah permukaan API produsen/konsumen internal
berversi dan baca-saja: OpenClaw memproduksinya untuk mesin konteks yang dipilih,
dan mesin konteks mengonsumsinya di dalam hook siklus hidup. Ini tidak
dirender langsung kepada pengguna dan tidak membuat permukaan pelaporan khusus.

- `schemaVersion`: saat ini `1`
- `runtime`: host OpenClaw, mode runtime (`normal`, `fallback`, atau
  `degraded`), dan id harness/runtime opsional
- `contextEngineSelection`: id mesin konteks yang dipilih dan sumber pemilihan
- `executionHost`: id host dan label untuk permukaan yang memanggil hook
- `model`: model yang diminta, model yang terselesaikan, provider, dan family model opsional
- `limits`: anggaran token prompt dan token output maksimum jika diketahui
- `diagnostics`: kode alasan fallback tertutup dan degraded jika diketahui

Field yang dapat tidak diketahui direpresentasikan sebagai `null`; field diskriminator seperti
mode runtime dan sumber pemilihan tetap non-nullable. Mesin lama tetap
kompatibel: jika mesin legacy ketat menolak `runtimeSettings` sebagai properti
tidak dikenal, OpenClaw mencoba ulang panggilan siklus hidup tanpanya alih-alih mengarantina
mesin.

### Persyaratan host

Mesin konteks dapat mendeklarasikan persyaratan kapabilitas host pada `info.hostRequirements`.
OpenClaw memeriksa persyaratan ini sebelum memulai operasi dan gagal tertutup
dengan error deskriptif ketika runtime yang dipilih tidak dapat memenuhinya.

Untuk run agen, deklarasikan `assemble-before-prompt` ketika mesin harus mengontrol
prompt model aktual melalui `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

Run agen native Codex dan embedded OpenClaw memenuhi `assemble-before-prompt`.
Backend CLI generik tidak, jadi mesin yang memerlukannya ditolak sebelum
proses CLI dimulai.

### Isolasi kegagalan

OpenClaw mengisolasi mesin plugin yang dipilih dari jalur balasan inti. Jika
mesin non-legacy tidak ada, gagal validasi kontrak, melempar error selama
pembuatan factory, atau melempar error dari metode lifecycle, OpenClaw mengarantina mesin tersebut
untuk proses Gateway saat ini dan menurunkan pekerjaan context-engine ke mesin
bawaan `legacy`. Error dicatat dengan operasi yang gagal sehingga
operator dapat memperbaiki, memperbarui, atau menonaktifkan plugin tanpa agent menjadi
diam.

Kegagalan persyaratan host berbeda: ketika mesin menyatakan bahwa sebuah runtime
tidak memiliki capability yang diperlukan, OpenClaw gagal tertutup sebelum memulai run. Hal itu
melindungi mesin yang akan merusak state jika dijalankan di host yang tidak didukung.

### ownsCompaction

`ownsCompaction` mengontrol apakah auto-compaction bawaan dalam-attempt milik runtime OpenClaw tetap aktif untuk run tersebut:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Mesin memiliki perilaku compaction. OpenClaw menonaktifkan auto-compaction bawaan runtime OpenClaw dan precheck overflow pra-prompt generik untuk run tersebut, dan implementasi `compact()` milik mesin bertanggung jawab atas `/compact`, compaction pemulihan overflow provider, dan compaction proaktif apa pun yang ingin dilakukan di `afterTurn()`. OpenClaw tetap menjalankan perlindungan overflow pra-prompt ketika mesin mengembalikan `promptAuthority: "preassembly_may_overflow"` dari `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Auto-compaction bawaan runtime OpenClaw masih dapat berjalan selama eksekusi prompt, tetapi metode `compact()` milik mesin aktif tetap dipanggil untuk `/compact` dan pemulihan overflow.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **tidak** berarti OpenClaw otomatis fallback ke jalur compaction mesin legacy.
</Warning>

Itu berarti ada dua pola plugin yang valid:

<Tabs>
  <Tab title="Mode memiliki">
    Implementasikan algoritme compaction Anda sendiri dan tetapkan `ownsCompaction: true`.
  </Tab>
  <Tab title="Mode delegasi">
    Tetapkan `ownsCompaction: false` dan buat `compact()` memanggil `delegateCompactionToRuntime(...)` dari `openclaw/plugin-sdk/core` untuk menggunakan perilaku compaction bawaan OpenClaw.
  </Tab>
</Tabs>

`compact()` no-op tidak aman untuk mesin aktif yang tidak memiliki compaction karena menonaktifkan jalur compaction normal `/compact` dan pemulihan overflow untuk slot mesin tersebut.

## Referensi konfigurasi

```json5
{
  plugins: {
    slots: {
      // Pilih mesin konteks aktif. Default: "legacy".
      // Tetapkan ke id plugin untuk menggunakan mesin plugin.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Slot ini eksklusif saat run time - hanya satu mesin konteks terdaftar yang di-resolve untuk run atau operasi compaction tertentu. Plugin `kind: "context-engine"` lain yang aktif masih dapat dimuat dan menjalankan kode registrasinya; `plugins.slots.contextEngine` hanya memilih id mesin terdaftar mana yang di-resolve OpenClaw ketika membutuhkan mesin konteks.
</Note>

<Note>
**Uninstall plugin:** ketika Anda menghapus plugin yang saat ini dipilih sebagai `plugins.slots.contextEngine`, OpenClaw mereset slot kembali ke default (`legacy`). Perilaku reset yang sama berlaku untuk `plugins.slots.memory`. Tidak diperlukan edit konfigurasi manual.
</Note>

## Hubungan dengan compaction dan memori

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction adalah salah satu tanggung jawab mesin konteks. Mesin legacy mendelegasikan ke summarization bawaan OpenClaw. Mesin plugin dapat mengimplementasikan strategi compaction apa pun (ringkasan DAG, vector retrieval, dll.).
  </Accordion>
  <Accordion title="Plugin memori">
    Plugin memori (`plugins.slots.memory`) terpisah dari mesin konteks. Plugin memori menyediakan pencarian/retrieval; mesin konteks mengontrol apa yang dilihat model. Keduanya dapat bekerja bersama - mesin konteks mungkin menggunakan data plugin memori selama assembly. Mesin plugin yang menginginkan jalur prompt memori aktif sebaiknya memilih `buildMemorySystemPromptAddition(...)` dari `openclaw/plugin-sdk/core`, yang mengonversi bagian prompt memori aktif menjadi `systemPromptAddition` siap-ditambahkan-di-awal. Jika mesin membutuhkan kontrol tingkat lebih rendah, mesin masih dapat mengambil baris mentah dari `openclaw/plugin-sdk/memory-host-core` melalui `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Pemangkasan sesi">
    Pemangkasan hasil tool lama di memori tetap berjalan terlepas dari mesin konteks mana yang aktif.
  </Accordion>
</AccordionGroup>

## Tips

- Gunakan `openclaw doctor` untuk memverifikasi mesin Anda dimuat dengan benar.
- Jika mengganti mesin, sesi yang ada berlanjut dengan riwayatnya saat ini. Mesin baru mengambil alih untuk run mendatang.
- Error mesin dicatat dan mesin plugin yang dipilih dikarantina untuk proses Gateway saat ini. OpenClaw fallback ke `legacy` untuk giliran pengguna agar balasan dapat berlanjut, tetapi Anda tetap harus memperbaiki, memperbarui, menonaktifkan, atau menghapus plugin yang rusak.
- Untuk pengembangan, gunakan `openclaw plugins install -l ./my-engine` untuk menautkan direktori plugin lokal tanpa menyalin.

## Terkait

- [Compaction](/id/concepts/compaction) - meringkas percakapan panjang
- [Konteks](/id/concepts/context) - bagaimana konteks dibangun untuk giliran agent
- [Arsitektur Plugin](/id/plugins/architecture) - mendaftarkan plugin mesin konteks
- [Manifest plugin](/id/plugins/manifest) - field manifest plugin
- [Plugin](/id/tools/plugin) - gambaran umum plugin
