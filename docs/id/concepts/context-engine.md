---
read_when:
    - Anda ingin memahami cara OpenClaw menyusun konteks model
    - Anda sedang beralih antara mesin lama dan mesin Plugin
    - Anda sedang membangun plugin mesin konteks
sidebarTitle: Context engine
summary: 'Mesin konteks: penyusunan konteks yang dapat dipasangkan, compaction, dan siklus hidup subagen'
title: Mesin konteks
x-i18n:
    generated_at: "2026-07-19T04:54:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59edab25b7a57458db88a907759950d31e4adc4a42f6886695a425312ee4e29b
    source_path: concepts/context-engine.md
    workflow: 16
---

**Mesin konteks** mengontrol cara OpenClaw membangun konteks model untuk setiap proses: pesan mana yang disertakan, cara merangkum riwayat lama, dan cara mengelola konteks melintasi batas subagen.

OpenClaw dilengkapi dengan mesin `legacy` bawaan dan menggunakannya secara default. Instal dan pilih mesin plugin hanya jika Anda menginginkan perilaku perakitan, Compaction, atau pengingatan lintas sesi yang berbeda.

## Mulai cepat

<Steps>
  <Step title="Periksa mesin yang aktif">
    ```bash
    openclaw doctor
    # atau periksa konfigurasi secara langsung:
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
      <Tab title="Dari jalur lokal">
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
          contextEngine: "lossless-claw", // harus cocok dengan id mesin yang didaftarkan plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Konfigurasi khusus plugin ditempatkan di sini (lihat dokumentasi plugin)
          },
        },
      },
    }
    ```

    Mulai ulang Gateway setelah menginstal dan mengonfigurasinya.

  </Step>
  <Step title="Beralih kembali ke mesin lama (opsional)">
    Atur `contextEngine` menjadi `"legacy"` (atau hapus kunci tersebut sepenuhnya—`"legacy"` adalah nilai default).
  </Step>
</Steps>

## Cara kerjanya

Setiap kali OpenClaw menjalankan prompt model, mesin konteks berpartisipasi pada empat titik siklus hidup:

<AccordionGroup>
  <Accordion title="1. Penyerapan">
    Dipanggil saat pesan baru ditambahkan ke sesi. Mesin dapat menyimpan atau mengindeks pesan tersebut dalam penyimpanan datanya sendiri.
  </Accordion>
  <Accordion title="2. Perakitan">
    Dipanggil sebelum setiap proses model. Mesin mengembalikan sekumpulan pesan yang diurutkan (dan `systemPromptAddition` opsional) yang sesuai dengan anggaran token.
  </Accordion>
  <Accordion title="3. Pemadatan">
    Dipanggil saat jendela konteks penuh, atau saat pengguna menjalankan `/compact`. Mesin merangkum riwayat lama untuk mengosongkan ruang.
  </Accordion>
  <Accordion title="4. Setelah giliran">
    Dipanggil setelah suatu proses selesai. Mesin dapat mempertahankan status, memicu Compaction di latar belakang, atau memperbarui indeks.
  </Accordion>
</AccordionGroup>

Mesin juga dapat mengimplementasikan metode `maintain()` opsional untuk pemeliharaan transkrip (penulisan ulang aman melalui `runtimeContext.rewriteTranscriptEntries()`) setelah bootstrap, giliran yang berhasil, atau Compaction. Atur `info.turnMaintenanceMode: "background"` agar menjalankannya sebagai pekerjaan yang ditangguhkan alih-alih memblokir balasan.

Untuk harness Codex non-ACP yang disertakan, OpenClaw menerapkan siklus hidup yang sama dengan memproyeksikan konteks yang telah dirakit ke dalam instruksi pengembang Codex dan prompt giliran saat ini. Codex tetap mengelola riwayat utas native dan pemadat native-nya sendiri.

### Siklus hidup subagen (opsional)

OpenClaw memanggil dua hook siklus hidup subagen opsional:

<ParamField path="prepareSubagentSpawn" type="method">
  Siapkan status konteks bersama sebelum proses turunan dimulai. Hook menerima kunci sesi induk/turunan, `contextMode` (`isolated` atau `fork`), id/file transkrip yang tersedia, dan TTL opsional. Jika mengembalikan handle rollback, OpenClaw memanggilnya ketika pembuatan gagal setelah persiapan berhasil. Pembuatan subagen native yang meminta `lightContext` dan diselesaikan menjadi `contextMode="isolated"` sengaja melewati hook ini agar turunan dimulai dari konteks bootstrap ringan tanpa status prapembuatan yang dikelola mesin konteks.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Bersihkan saat sesi subagen selesai atau dihapus.
</ParamField>

### Penambahan prompt sistem

Metode `assemble` dapat mengembalikan string `systemPromptAddition`. OpenClaw menambahkannya di awal prompt sistem untuk proses tersebut. Hal ini memungkinkan mesin menyisipkan panduan pengingatan dinamis, instruksi pengambilan, atau petunjuk yang peka terhadap konteks tanpa memerlukan file ruang kerja statis.

## Mesin lama

Mesin `legacy` bawaan mempertahankan perilaku asli OpenClaw:

- **Penyerapan**: tanpa operasi (pengelola sesi menangani persistensi pesan secara langsung).
- **Perakitan**: diteruskan tanpa perubahan (pipeline sanitasi → validasi → pembatasan yang ada dalam runtime menangani perakitan konteks).
- **Pemadatan**: mendelegasikan ke Compaction perangkuman bawaan, yang membuat satu ringkasan pesan lama dan mempertahankan pesan terbaru tanpa perubahan.
- **Setelah giliran**: tanpa operasi.

Mesin lama tidak mendaftarkan alat atau menyediakan `systemPromptAddition`.

Jika tidak ada `plugins.slots.contextEngine` yang ditetapkan (atau nilainya ditetapkan menjadi `"legacy"`), mesin ini digunakan secara otomatis.

## Mesin plugin

Plugin dapat mendaftarkan mesin konteks menggunakan API plugin:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Simpan pesan dalam penyimpanan data Anda
      return { ingested: true };
    },

    async assemble({
      sessionId,
      sessionKey,
      messages,
      tokenBudget,
      availableTools,
      citationsMode,
    }) {
      // Kembalikan pesan yang sesuai dengan anggaran
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Rangkum konteks lama
      return { ok: true, compacted: true };
    },
  }));
}
```

Factory `ctx` menyertakan nilai `config`, `agentDir`, dan `workspaceDir`
opsional agar plugin dapat menginisialisasi status per agen atau per ruang kerja sebelum
panggilan siklus hidup pertama. Sebelum panggilan `assemble()` non-lama, host menyelesaikan
persiapan prompt memori asinkron yang terdaftar. Pembantu sinkron
`buildMemorySystemPromptAddition(...)` membaca snapshot proses yang tidak dapat diubah tersebut;
teruskan konteks alat, kutipan, agen, dan sesi yang disediakan tanpa perubahan.

Kemudian aktifkan dalam konfigurasi:

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
| `info`             | Properti | Id, nama, versi mesin, dan apakah mesin tersebut mengelola Compaction |
| `ingest(params)`   | Metode   | Menyimpan satu pesan                                     |
| `assemble(params)` | Metode   | Membangun konteks untuk proses model (mengembalikan `AssembleResult`) |
| `compact(params)`  | Metode   | Merangkum/mengurangi konteks                             |

`assemble` mengembalikan `AssembleResult` dengan:

<ParamField path="messages" type="Message[]" required>
  Pesan terurut yang akan dikirim ke model.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Perkiraan mesin mengenai jumlah total token dalam konteks yang telah dirakit. OpenClaw menggunakannya untuk keputusan ambang batas Compaction dan pelaporan diagnostik.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Ditambahkan di awal prompt sistem.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Mengontrol perkiraan token mana yang digunakan runner untuk pemeriksaan awal
  luapan secara preventif. Nilai defaultnya adalah `"assembled"`, yang berarti hanya
  perkiraan prompt yang telah dirakit yang diperiksa untuk mesin yang tidak mengelola Compaction.
  Mesin yang menetapkan `ownsCompaction: true` mengelola penerimaan prompt-nya sendiri,
  sehingga secara default OpenClaw melewati pemeriksaan awal generik sebelum prompt. Tetapkan
  `"preassembly_may_overflow"` hanya jika tampilan yang telah dirakit dapat menyembunyikan risiko
  luapan dalam transkrip yang mendasarinya; runner kemudian mempertahankan
  pemeriksaan awal generik tetap aktif dan mengambil nilai maksimum dari perkiraan yang telah dirakit dan
  perkiraan riwayat sesi praperakitan (tanpa jendela) saat memutuskan apakah perlu
  melakukan Compaction secara preventif. Bagaimanapun, pesan yang Anda kembalikan tetap menjadi apa yang
  dilihat model—`promptAuthority` hanya memengaruhi pemeriksaan awal.
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  Siklus hidup proyeksi opsional untuk host dengan utas backend persisten (misalnya app-server Codex). `mode: "thread_bootstrap"` dengan `epoch` yang stabil meminta host menyisipkan konteks yang telah dirakit sekali per epoke dan menggunakan kembali utas backend hingga epoke berubah, alih-alih memproyeksikan ulang setiap giliran. Hilangkan bidang ini untuk proyeksi normal per giliran.
</ParamField>

`compact` mengembalikan `CompactResult`. Ketika Compaction mengubah identitas sesi
aktif, `result.sessionTarget` (`ContextEngineSessionTarget` bertipe yang membawa
identitas sesi dan cakupan penyimpanan) mengidentifikasi sesi penerus yang harus digunakan oleh
percobaan ulang atau giliran berikutnya; `result.sessionId` mencerminkan id penerus.

Anggota opsional:

| Anggota                        | Jenis  | Tujuan                                                                                                                                       |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metode | Menginisialisasi status mesin untuk suatu sesi. Dipanggil sekali saat mesin pertama kali menemukan sesi (misalnya, mengimpor riwayat).       |
| `maintain(params)`             | Metode | Pemeliharaan transkrip setelah bootstrap, giliran yang berhasil, atau Compaction. Gunakan `runtimeContext.rewriteTranscriptEntries()` untuk penulisan ulang yang aman. |
| `ingestBatch(params)`          | Metode | Menyerap giliran yang telah selesai sebagai batch. Dipanggil setelah suatu proses selesai, dengan semua pesan dari giliran tersebut sekaligus. |
| `afterTurn(params)`            | Metode | Pekerjaan siklus hidup pascaproses (mempertahankan status, memicu Compaction di latar belakang).                                              |
| `prepareSubagentSpawn(params)` | Metode | Menyiapkan status bersama untuk sesi turunan sebelum dimulai.                                                                                 |
| `onSubagentEnded(params)`      | Metode | Membersihkan setelah subagen berakhir.                                                                                                        |
| `dispose()`                    | Metode | Melepaskan sumber daya. Dipanggil selama penghentian Gateway atau pemuatan ulang plugin—bukan per sesi.                                      |

### Pengaturan runtime

Hook siklus hidup yang berjalan di dalam OpenClaw menerima objek
`runtimeSettings` opsional. Objek ini merupakan permukaan API
produsen/konsumen internal yang hanya-baca dan memiliki versi: OpenClaw menghasilkannya untuk mesin
konteks yang dipilih, dan mesin konteks menggunakannya di dalam hook siklus hidup. Objek ini tidak
dirender secara langsung kepada pengguna dan tidak membuat permukaan pelaporan khusus.

- `schemaVersion`: saat ini `1`
- `runtime`: host OpenClaw, mode runtime (`normal`, `fallback`, atau
  `degraded`), dan id harness/runtime opsional
- `contextEngineSelection`: id mesin konteks yang dipilih dan sumber pemilihan
- `executionHost`: id dan label host untuk permukaan yang memanggil hook
- `model`: model yang diminta, model yang dihasilkan dari resolusi, penyedia, dan kelompok model opsional
- `limits`: anggaran token prompt dan token keluaran maksimum jika diketahui
- `diagnostics`: kode alasan fallback tertutup dan penurunan fungsi jika diketahui

Bidang yang mungkin tidak diketahui direpresentasikan sebagai `null`; bidang diskriminator seperti
mode runtime dan sumber pemilihan tetap tidak dapat bernilai null. Mesin lama tetap
kompatibel: jika mesin lama yang ketat menolak `runtimeSettings` sebagai properti
yang tidak dikenal, OpenClaw mencoba kembali panggilan siklus hidup tanpa properti tersebut alih-alih mengarantina
mesin.

### Persyaratan host

Mesin konteks dapat mendeklarasikan persyaratan kemampuan host pada `info.hostRequirements`.
OpenClaw memeriksa persyaratan ini sebelum memulai operasi dan gagal secara tertutup
dengan galat deskriptif jika runtime yang dipilih tidak dapat memenuhinya.

Untuk proses agen, deklarasikan `assemble-before-prompt` jika mesin harus mengendalikan
prompt model yang sebenarnya melalui `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "Mesin Konteks Saya",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Gunakan Codex native atau runtime tertanam OpenClaw, atau pilih mesin konteks lama.",
    },
  },
}
```

Proses agen Codex native dan OpenClaw tertanam memenuhi `assemble-before-prompt`.
Backend CLI generik tidak memenuhinya, sehingga mesin yang memerlukannya ditolak sebelum
proses CLI dimulai.

### Isolasi kegagalan

OpenClaw mengisolasi mesin plugin yang dipilih dari jalur balasan inti. Jika
mesin nonlama tidak ditemukan, gagal dalam validasi kontrak, melempar pengecualian selama pembuatan
factory, atau melempar pengecualian dari metode siklus hidup, OpenClaw mengarantina mesin tersebut
untuk proses Gateway saat ini dan menurunkan pekerjaan mesin konteks ke
mesin bawaan `legacy`. Galat dicatat bersama operasi yang gagal agar
operator dapat memperbaiki, memperbarui, atau menonaktifkan plugin tanpa menyebabkan agen
tidak memberikan respons.

Kegagalan persyaratan host bersifat berbeda: ketika mesin mendeklarasikan bahwa runtime
tidak memiliki kemampuan yang diwajibkan, OpenClaw gagal secara tertutup sebelum memulai proses. Hal ini
melindungi mesin yang akan merusak status jika dijalankan pada host yang tidak didukung.

### ownsCompaction

`ownsCompaction` mengendalikan apakah kompaksi otomatis bawaan dalam percobaan milik runtime OpenClaw tetap diaktifkan untuk proses tersebut:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Mesin memiliki kendali atas perilaku kompaksi. OpenClaw menonaktifkan kompaksi otomatis bawaan runtime OpenClaw dan pemeriksaan awal luapan generik sebelum prompt untuk proses tersebut, dan implementasi `compact()` milik mesin bertanggung jawab atas `/compact`, kompaksi pemulihan luapan penyedia, serta kompaksi proaktif apa pun yang ingin dilakukannya dalam `afterTurn()`. OpenClaw tetap menjalankan pengamanan luapan sebelum prompt saat mesin mengembalikan `promptAuthority: "preassembly_may_overflow"` dari `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false atau tidak ditetapkan">
    Kompaksi otomatis bawaan runtime OpenClaw mungkin tetap berjalan selama eksekusi prompt, tetapi metode `compact()` milik mesin aktif tetap dipanggil untuk `/compact` dan pemulihan luapan.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **tidak** berarti OpenClaw secara otomatis melakukan fallback ke jalur kompaksi mesin lama.
</Warning>

Artinya, terdapat dua pola plugin yang valid:

<Tabs>
  <Tab title="Mode kepemilikan">
    Implementasikan algoritma kompaksi Anda sendiri dan tetapkan `ownsCompaction: true`.
  </Tab>
  <Tab title="Mode delegasi">
    Tetapkan `ownsCompaction: false` dan buat `compact()` memanggil `delegateCompactionToRuntime(...)` dari `openclaw/plugin-sdk/core` untuk menggunakan perilaku kompaksi bawaan OpenClaw.
  </Tab>
</Tabs>

`compact()` yang tidak melakukan apa pun tidak aman untuk mesin aktif yang tidak memiliki kendali karena tindakan tersebut menonaktifkan jalur kompaksi normal `/compact` dan pemulihan luapan bagi slot mesin tersebut.

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
Slot bersifat eksklusif pada waktu proses—hanya satu mesin konteks terdaftar yang dihasilkan dari resolusi untuk proses atau operasi kompaksi tertentu. Plugin `kind: "context-engine"` lain yang diaktifkan tetap dapat dimuat dan menjalankan kode pendaftarannya; `plugins.slots.contextEngine` hanya memilih id mesin terdaftar yang dihasilkan dari resolusi oleh OpenClaw ketika memerlukan mesin konteks.
</Note>

<Note>
**Penghapusan instalasi plugin:** saat Anda menghapus instalasi plugin yang saat ini dipilih sebagai `plugins.slots.contextEngine`, OpenClaw mengatur ulang slot ke nilai default (`legacy`). Perilaku pengaturan ulang yang sama berlaku untuk `plugins.slots.memory`. Pengeditan konfigurasi secara manual tidak diperlukan.
</Note>

## Hubungan dengan kompaksi dan memori

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction adalah salah satu tanggung jawab mesin konteks. Mesin lama mendelegasikan ke peringkasan bawaan OpenClaw. Mesin plugin dapat mengimplementasikan strategi kompaksi apa pun (ringkasan DAG, pengambilan vektor, dan sebagainya).
  </Accordion>
  <Accordion title="Plugin memori">
    Plugin memori (`plugins.slots.memory`) terpisah dari mesin konteks. Plugin memori menyediakan pencarian/pengambilan; mesin konteks mengendalikan apa yang dilihat model. Keduanya dapat bekerja bersama—mesin konteks dapat menggunakan data plugin memori selama perakitan. Mesin plugin yang menginginkan jalur prompt memori aktif sebaiknya menggunakan `buildMemorySystemPromptAddition(...)` dari `openclaw/plugin-sdk/core`, yang mengonversi bagian prompt memori aktif menjadi `systemPromptAddition` yang siap ditambahkan di awal. Jika mesin memerlukan kendali tingkat lebih rendah, mesin tersebut tetap dapat mengambil baris mentah dari `openclaw/plugin-sdk/memory-host-core` melalui `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Pemangkasan sesi">
    Pemangkasan hasil alat lama dalam memori tetap berjalan terlepas dari mesin konteks mana yang aktif.
  </Accordion>
</AccordionGroup>

## Kiat

- Gunakan `openclaw doctor` untuk memverifikasi bahwa mesin Anda dimuat dengan benar.
- Jika beralih mesin, sesi yang ada berlanjut dengan riwayatnya saat ini. Mesin baru mengambil alih proses berikutnya.
- Galat mesin dicatat dan mesin plugin yang dipilih dikarantina untuk proses Gateway saat ini. OpenClaw melakukan fallback ke `legacy` untuk giliran pengguna agar balasan dapat berlanjut, tetapi Anda tetap harus memperbaiki, memperbarui, menonaktifkan, atau menghapus instalasi plugin yang rusak.
- Untuk pengembangan, gunakan `openclaw plugins install -l ./my-engine` untuk menautkan direktori plugin lokal tanpa menyalinnya.

## Terkait

- [Compaction](/id/concepts/compaction) - meringkas percakapan panjang
- [Konteks](/id/concepts/context) - cara konteks dibangun untuk giliran agen
- [Arsitektur Plugin](/id/plugins/architecture) - mendaftarkan plugin mesin konteks
- [Manifes plugin](/id/plugins/manifest) - bidang manifes plugin
- [Plugin](/id/tools/plugin) - ikhtisar plugin
