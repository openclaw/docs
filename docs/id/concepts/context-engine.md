---
read_when:
    - Anda ingin memahami bagaimana OpenClaw menyusun konteks model
    - Anda sedang beralih antara mesin lama dan mesin Plugin
    - Anda sedang membangun plugin mesin konteks
sidebarTitle: Context engine
summary: 'Mesin konteks: perakitan konteks yang dapat di-plug, Compaction, dan siklus hidup subagen'
title: Mesin konteks
x-i18n:
    generated_at: "2026-06-27T17:23:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

Mesin **konteks** mengontrol bagaimana OpenClaw membangun konteks model untuk setiap run: pesan mana yang disertakan, bagaimana meringkas riwayat lama, dan bagaimana mengelola konteks melintasi batas subagent.

OpenClaw dikirimkan dengan mesin bawaan `legacy` dan menggunakannya secara default - sebagian besar pengguna tidak perlu mengubah ini. Instal dan pilih mesin plugin hanya ketika Anda menginginkan perilaku assembly, Compaction, atau recall lintas-sesi yang berbeda.

## Mulai cepat

<Steps>
  <Step title="Periksa mesin mana yang aktif">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Instal mesin plugin">
    Plugin mesin konteks diinstal seperti plugin OpenClaw lainnya.

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
    Atur `contextEngine` ke `"legacy"` (atau hapus key sepenuhnya - `"legacy"` adalah default).
  </Step>
</Steps>

## Cara kerjanya

Setiap kali OpenClaw menjalankan prompt model, mesin konteks berpartisipasi pada empat titik siklus hidup:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Dipanggil saat pesan baru ditambahkan ke sesi. Mesin dapat menyimpan atau mengindeks pesan di penyimpanan datanya sendiri.
  </Accordion>
  <Accordion title="2. Assemble">
    Dipanggil sebelum setiap run model. Mesin mengembalikan sekumpulan pesan berurutan (dan `systemPromptAddition` opsional) yang sesuai dengan anggaran token.
  </Accordion>
  <Accordion title="3. Compact">
    Dipanggil saat jendela konteks penuh, atau saat pengguna menjalankan `/compact`. Mesin meringkas riwayat lama untuk mengosongkan ruang.
  </Accordion>
  <Accordion title="4. After turn">
    Dipanggil setelah run selesai. Mesin dapat mempertahankan state, memicu Compaction latar belakang, atau memperbarui indeks.
  </Accordion>
</AccordionGroup>

Untuk harness Codex non-ACP bawaan, OpenClaw menerapkan siklus hidup yang sama dengan memproyeksikan konteks yang telah dirakit ke instruksi developer Codex dan prompt turn saat ini. Codex tetap memiliki riwayat thread native dan compactor native-nya sendiri.

### Siklus hidup subagent (opsional)

OpenClaw memanggil dua hook siklus hidup subagent opsional:

<ParamField path="prepareSubagentSpawn" type="method">
  Siapkan state konteks bersama sebelum run child dimulai. Hook menerima key sesi parent/child, `contextMode` (`isolated` atau `fork`), id/file transkrip yang tersedia, dan TTL opsional. Jika mengembalikan handle rollback, OpenClaw memanggilnya ketika spawn gagal setelah persiapan berhasil. Spawn subagent native yang meminta `lightContext` dan terselesaikan menjadi `contextMode="isolated"` sengaja melewati hook ini agar child dimulai dari konteks bootstrap ringan tanpa state pra-spawn yang dikelola mesin konteks.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bersihkan saat sesi subagent selesai atau disapu.
</ParamField>

### Tambahan prompt sistem

Metode `assemble` dapat mengembalikan string `systemPromptAddition`. OpenClaw menambahkan ini di awal prompt sistem untuk run. Ini memungkinkan mesin menyuntikkan panduan recall dinamis, instruksi retrieval, atau petunjuk sadar konteks tanpa memerlukan file workspace statis.

## Mesin legacy

Mesin bawaan `legacy` mempertahankan perilaku asli OpenClaw:

- **Ingest**: no-op (manajer sesi menangani persistensi pesan secara langsung).
- **Assemble**: pass-through (pipeline sanitize → validate → limit yang ada di runtime menangani assembly konteks).
- **Compact**: mendelegasikan ke Compaction peringkasan bawaan, yang membuat satu ringkasan pesan lama dan mempertahankan pesan terbaru tetap utuh.
- **After turn**: no-op.

Mesin legacy tidak mendaftarkan tool atau menyediakan `systemPromptAddition`.

Ketika tidak ada `plugins.slots.contextEngine` yang disetel (atau disetel ke `"legacy"`), mesin ini digunakan secara otomatis.

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

| Anggota            | Jenis    | Tujuan                                                   |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Properti | Id mesin, nama, versi, dan apakah ia memiliki Compaction |
| `ingest(params)`   | Metode   | Menyimpan satu pesan                                     |
| `assemble(params)` | Metode   | Membangun konteks untuk run model (mengembalikan `AssembleResult`) |
| `compact(params)`  | Metode   | Meringkas/mengurangi konteks                             |

`assemble` mengembalikan `AssembleResult` dengan:

<ParamField path="messages" type="Message[]" required>
  Pesan berurutan untuk dikirim ke model.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Estimasi mesin untuk total token dalam konteks yang telah dirakit. OpenClaw menggunakan ini untuk keputusan ambang Compaction dan pelaporan diagnostik.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Ditambahkan di awal prompt sistem.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Mengontrol estimasi token mana yang digunakan runner untuk precheck overflow
  preemptif. Default ke `"assembled"`, yang berarti hanya estimasi prompt
  yang telah dirakit yang diperiksa - sesuai untuk mesin yang mengembalikan
  konteks berjendela dan mandiri. Setel ke `"preassembly_may_overflow"` hanya
  ketika tampilan yang telah dirakit dapat menyembunyikan risiko overflow pada
  transkrip yang mendasarinya; runner kemudian mengambil nilai maksimum dari
  estimasi yang telah dirakit dan estimasi riwayat sesi pra-assembly (tanpa jendela)
  saat memutuskan apakah akan melakukan Compact secara preemptif. Bagaimanapun,
  pesan yang Anda kembalikan tetap merupakan apa yang dilihat model -
  `promptAuthority` hanya memengaruhi precheck.
</ParamField>

`compact` mengembalikan `CompactResult`. Ketika Compaction merotasi transkrip
aktif, `result.sessionId` dan `result.sessionFile` mengidentifikasi sesi penerus
yang harus digunakan retry atau turn berikutnya.

Anggota opsional:

| Anggota                        | Jenis  | Tujuan                                                                                                          |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metode | Menginisialisasi state mesin untuk sesi. Dipanggil sekali saat mesin pertama kali melihat sesi (misalnya, impor riwayat). |
| `ingestBatch(params)`          | Metode | Meng-ingest turn yang selesai sebagai batch. Dipanggil setelah run selesai, dengan semua pesan dari turn tersebut sekaligus. |
| `afterTurn(params)`            | Metode | Pekerjaan siklus hidup pasca-run (mempertahankan state, memicu Compaction latar belakang).                      |
| `prepareSubagentSpawn(params)` | Metode | Menyiapkan state bersama untuk sesi child sebelum dimulai.                                                       |
| `onSubagentEnded(params)`      | Metode | Membersihkan setelah subagent berakhir.                                                                         |
| `dispose()`                    | Metode | Melepaskan resource. Dipanggil selama shutdown gateway atau reload plugin - bukan per sesi.                     |

### Pengaturan runtime

Hook siklus hidup yang berjalan di dalam OpenClaw menerima objek
`runtimeSettings` opsional. Ini adalah permukaan API internal
producer/consumer yang berversi dan hanya-baca: OpenClaw memproduksinya untuk mesin konteks
yang dipilih, dan mesin konteks mengonsumsinya di dalam hook siklus hidup. Ini tidak
dirender langsung kepada pengguna dan tidak membuat permukaan pelaporan khusus.

- `schemaVersion`: saat ini `1`
- `runtime`: host OpenClaw, mode runtime (`normal`, `fallback`, atau
  `degraded`), dan id harness/runtime opsional
- `contextEngineSelection`: id mesin konteks yang dipilih dan sumber pemilihan
- `executionHost`: id host dan label untuk permukaan yang memanggil hook
- `model`: model yang diminta, model yang di-resolve, provider, dan family model opsional
- `limits`: anggaran token prompt dan token output maksimum saat diketahui
- `diagnostics`: kode alasan fallback tertutup dan degraded saat diketahui

Field yang dapat tidak diketahui direpresentasikan sebagai `null`; field discriminator
seperti mode runtime dan sumber pemilihan tetap non-nullable. Mesin lama tetap
kompatibel: jika mesin legacy yang ketat menolak `runtimeSettings` sebagai properti
yang tidak dikenal, OpenClaw mencoba ulang panggilan siklus hidup tanpanya alih-alih mengarantina
mesin.

### Persyaratan host

Mesin konteks dapat mendeklarasikan persyaratan kapabilitas host pada `info.hostRequirements`.
OpenClaw memeriksa persyaratan ini sebelum memulai operasi dan gagal tertutup
dengan error deskriptif ketika runtime yang dipilih tidak dapat memenuhinya.

Untuk run agent, deklarasikan `assemble-before-prompt` ketika mesin harus mengontrol
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

Run agent Codex native dan embedded OpenClaw memenuhi `assemble-before-prompt`.
Backend CLI generik tidak, sehingga mesin yang membutuhkannya ditolak sebelum
proses CLI dimulai.

### Isolasi kegagalan

OpenClaw mengisolasi mesin plugin yang dipilih dari jalur balasan inti. Jika
mesin non-legacy hilang, gagal validasi kontrak, melempar selama pembuatan
factory, atau melempar dari metode siklus hidup, OpenClaw mengarantina mesin tersebut
untuk proses Gateway saat ini dan menurunkan pekerjaan mesin konteks ke mesin
bawaan `legacy`. Error dicatat bersama operasi yang gagal sehingga operator
dapat memperbaiki, memperbarui, atau menonaktifkan plugin tanpa membuat agent
diam.

Host requirement failures berbeda: ketika sebuah engine menyatakan bahwa runtime
tidak memiliki kapabilitas wajib, OpenClaw gagal secara tertutup sebelum memulai eksekusi. Itu
melindungi engine yang akan merusak state jika berjalan di host yang tidak didukung.

### ownsCompaction

`ownsCompaction` mengontrol apakah auto-Compaction bawaan dalam percobaan milik runtime OpenClaw tetap diaktifkan untuk eksekusi tersebut:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Engine memiliki perilaku Compaction. OpenClaw menonaktifkan auto-Compaction bawaan runtime OpenClaw untuk eksekusi itu, dan implementasi `compact()` milik engine bertanggung jawab atas `/compact`, Compaction pemulihan overflow, dan Compaction proaktif apa pun yang ingin dilakukannya di `afterTurn()`. OpenClaw masih dapat menjalankan pengaman overflow pra-prompt; ketika pengaman ini memprediksi transkrip lengkap akan overflow, jalur pemulihan memanggil `compact()` milik engine aktif sebelum mengirim prompt lain.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Auto-Compaction bawaan runtime OpenClaw masih dapat berjalan selama eksekusi prompt, tetapi metode `compact()` milik engine aktif tetap dipanggil untuk `/compact` dan pemulihan overflow.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **tidak** berarti OpenClaw otomatis kembali ke jalur Compaction engine lama.
</Warning>

Itu berarti ada dua pola Plugin yang valid:

<Tabs>
  <Tab title="Owning mode">
    Implementasikan algoritma Compaction Anda sendiri dan tetapkan `ownsCompaction: true`.
  </Tab>
  <Tab title="Delegating mode">
    Tetapkan `ownsCompaction: false` dan buat `compact()` memanggil `delegateCompactionToRuntime(...)` dari `openclaw/plugin-sdk/core` untuk menggunakan perilaku Compaction bawaan OpenClaw.
  </Tab>
</Tabs>

`compact()` no-op tidak aman untuk engine aktif yang tidak memiliki Compaction karena menonaktifkan jalur Compaction normal `/compact` dan pemulihan overflow untuk slot engine tersebut.

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
Slot ini eksklusif saat runtime - hanya satu engine konteks terdaftar yang di-resolve untuk eksekusi atau operasi Compaction tertentu. Plugin `kind: "context-engine"` lain yang diaktifkan masih dapat dimuat dan menjalankan kode registrasinya; `plugins.slots.contextEngine` hanya memilih id engine terdaftar mana yang di-resolve OpenClaw saat membutuhkan engine konteks.
</Note>

<Note>
**Penghapusan instalasi Plugin:** saat Anda menghapus instalasi Plugin yang saat ini dipilih sebagai `plugins.slots.contextEngine`, OpenClaw mengatur ulang slot kembali ke default (`legacy`). Perilaku pengaturan ulang yang sama berlaku untuk `plugins.slots.memory`. Tidak diperlukan pengeditan konfigurasi manual.
</Note>

## Hubungan dengan Compaction dan memori

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction adalah salah satu tanggung jawab engine konteks. Engine lama mendelegasikan ke peringkasan bawaan OpenClaw. Engine Plugin dapat menerapkan strategi Compaction apa pun (ringkasan DAG, pengambilan vektor, dll.).
  </Accordion>
  <Accordion title="Memory plugins">
    Plugin memori (`plugins.slots.memory`) terpisah dari engine konteks. Plugin memori menyediakan pencarian/pengambilan; engine konteks mengontrol apa yang dilihat model. Keduanya dapat bekerja bersama - engine konteks mungkin menggunakan data Plugin memori selama penyusunan. Engine Plugin yang menginginkan jalur prompt memori aktif sebaiknya menggunakan `buildMemorySystemPromptAddition(...)` dari `openclaw/plugin-sdk/core`, yang mengonversi bagian prompt memori aktif menjadi `systemPromptAddition` siap-ditambahkan-di-awal. Jika engine membutuhkan kontrol tingkat lebih rendah, engine masih dapat mengambil baris mentah dari `openclaw/plugin-sdk/memory-host-core` melalui `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Session pruning">
    Pemangkasan hasil tool lama di dalam memori tetap berjalan terlepas dari engine konteks mana yang aktif.
  </Accordion>
</AccordionGroup>

## Tips

- Gunakan `openclaw doctor` untuk memverifikasi bahwa engine Anda dimuat dengan benar.
- Jika berganti engine, sesi yang ada tetap berlanjut dengan riwayatnya saat ini. Engine baru mengambil alih untuk eksekusi mendatang.
- Error engine dicatat dan engine Plugin yang dipilih dikarantina untuk proses Gateway saat ini. OpenClaw kembali ke `legacy` untuk giliran pengguna agar balasan dapat terus berlanjut, tetapi Anda tetap harus memperbaiki, memperbarui, menonaktifkan, atau menghapus instalasi Plugin yang rusak.
- Untuk pengembangan, gunakan `openclaw plugins install -l ./my-engine` untuk menautkan direktori Plugin lokal tanpa menyalin.

## Terkait

- [Compaction](/id/concepts/compaction) - meringkas percakapan panjang
- [Konteks](/id/concepts/context) - bagaimana konteks dibangun untuk giliran agen
- [Arsitektur Plugin](/id/plugins/architecture) - mendaftarkan Plugin engine konteks
- [Manifest Plugin](/id/plugins/manifest) - kolom manifest Plugin
- [Plugin](/id/tools/plugin) - ringkasan Plugin
