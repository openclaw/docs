---
read_when:
    - Anda ingin memahami cara OpenClaw menyusun konteks model
    - Anda sedang beralih antara mesin lama dan mesin Plugin
    - Anda sedang membuat plugin mesin konteks
sidebarTitle: Context engine
summary: 'Mesin konteks: penyusunan konteks yang dapat dipasangkan, Compaction, dan siklus hidup subagen'
title: Mesin konteks
x-i18n:
    generated_at: "2026-07-20T03:44:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 721780790dacebec44e3c7540b225bd853ee66bf5ae066b84df4344614d93a62
    source_path: concepts/context-engine.md
    workflow: 16
---

Sebuah **mesin konteks** mengontrol cara OpenClaw membangun konteks model untuk setiap proses: pesan mana yang disertakan, cara meringkas riwayat lama, dan cara mengelola konteks melintasi batas subagen.

OpenClaw disertai mesin `legacy` bawaan dan menggunakannya secara default. Instal dan pilih mesin Plugin hanya jika Anda menginginkan perilaku penyusunan, Compaction, atau pengingatan lintas sesi yang berbeda.

## Mulai cepat

<Steps>
  <Step title="Periksa mesin yang aktif">
    ```bash
    openclaw doctor
    # atau periksa konfigurasi secara langsung:
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
          contextEngine: "lossless-claw", // harus cocok dengan id mesin yang didaftarkan Plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Konfigurasi khusus Plugin ditempatkan di sini (lihat dokumentasi Plugin)
          },
        },
      },
    }
    ```

    Mulai ulang Gateway setelah menginstal dan mengonfigurasinya.

  </Step>
  <Step title="Beralih kembali ke mesin lama (opsional)">
    Tetapkan `contextEngine` ke `"legacy"` (atau hapus kunci tersebut sepenuhnya—`"legacy"` adalah nilai default).
  </Step>
</Steps>

## Cara kerjanya

Setiap kali OpenClaw menjalankan prompt model, mesin konteks berpartisipasi pada empat titik siklus hidup:

<AccordionGroup>
  <Accordion title="1. Penyerapan">
    Dipanggil saat pesan baru ditambahkan ke sesi. Mesin dapat menyimpan atau mengindeks pesan tersebut di penyimpanan datanya sendiri.
  </Accordion>
  <Accordion title="2. Penyusunan">
    Dipanggil sebelum setiap proses model. Mesin mengembalikan kumpulan pesan yang terurut (dan `systemPromptAddition` opsional) yang sesuai dengan anggaran token.
  </Accordion>
  <Accordion title="3. Compaction">
    Dipanggil saat jendela konteks penuh, atau saat pengguna menjalankan `/compact`. Mesin meringkas riwayat lama untuk mengosongkan ruang.
  </Accordion>
  <Accordion title="4. Setelah giliran">
    Dipanggil setelah proses selesai. Mesin dapat mempertahankan status, memicu Compaction di latar belakang, atau memperbarui indeks.
  </Accordion>
</AccordionGroup>

Mesin juga dapat mengimplementasikan metode `maintain()` opsional untuk pemeliharaan transkrip (penulisan ulang aman melalui `runtimeContext.rewriteTranscriptEntries()`) setelah bootstrap, giliran yang berhasil, atau Compaction. Tetapkan `info.turnMaintenanceMode: "background"` untuk menjalankannya sebagai pekerjaan tertunda, bukan memblokir balasan.

Untuk harness Codex non-ACP yang disertakan, OpenClaw menerapkan siklus hidup yang sama dengan memproyeksikan konteks yang telah disusun ke dalam instruksi pengembang Codex dan prompt giliran saat ini. Codex tetap mengelola riwayat utas native dan pemadat native-nya.

### Siklus hidup subagen (opsional)

OpenClaw memanggil dua hook siklus hidup subagen opsional:

<ParamField path="prepareSubagentSpawn" type="method">
  Siapkan status konteks bersama sebelum proses turunan dimulai. Hook menerima kunci sesi induk/turunan, `contextMode` (`isolated` atau `fork`), id/file transkrip yang tersedia, dan TTL opsional. Jika mengembalikan handel pembatalan, OpenClaw akan memanggilnya ketika pemijahan gagal setelah persiapan berhasil. Pemijahan subagen native yang meminta `lightContext` dan ditetapkan menjadi `contextMode="isolated"` secara sengaja melewati hook ini agar turunan dimulai dari konteks bootstrap ringan tanpa status pra-pemijahan yang dikelola mesin konteks.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Lakukan pembersihan saat sesi subagen selesai atau disapu.
</ParamField>

### Tambahan prompt sistem

Metode `assemble` dapat mengembalikan string `systemPromptAddition`. OpenClaw menambahkannya di awal prompt sistem untuk proses tersebut. Hal ini memungkinkan mesin menyuntikkan panduan pengingatan dinamis, instruksi pengambilan, atau petunjuk sadar konteks tanpa memerlukan file ruang kerja statis.

## Mesin lama

Mesin `legacy` bawaan mempertahankan perilaku asli OpenClaw:

- **Penyerapan**: tanpa operasi (pengelola sesi menangani persistensi pesan secara langsung).
- **Penyusunan**: diteruskan tanpa perubahan (pipeline sanitasi → validasi → pembatasan yang ada dalam runtime menangani penyusunan konteks).
- **Compaction**: mendelegasikan ke Compaction peringkasan bawaan, yang membuat satu ringkasan pesan lama dan mempertahankan pesan terbaru secara utuh.
- **Setelah giliran**: tanpa operasi.

Mesin lama tidak mendaftarkan alat atau menyediakan `systemPromptAddition`.

Jika `plugins.slots.contextEngine` tidak ditetapkan (atau ditetapkan ke `"legacy"`), mesin ini digunakan secara otomatis.

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
      // Simpan pesan di penyimpanan data Anda
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
          agentSessionKey: sessionKey,
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

Factory `ctx` menyertakan nilai `config`, `agentDir`, dan `workspaceDir`
opsional agar Plugin dapat menginisialisasi status per agen atau per ruang kerja sebelum
pemanggilan siklus hidup pertama. Sebelum pemanggilan `assemble()` non-lama, host menyelesaikan
persiapan prompt memori asinkron yang terdaftar. Pembantu sinkron
`buildMemorySystemPromptAddition(...)` membaca snapshot proses yang tidak dapat diubah tersebut;
teruskan konteks alat, kutipan, agen, dan sesi yang diberikan tanpa perubahan.

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

| Anggota             | Jenis     | Tujuan                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Properti | Id mesin, nama, versi, dan apakah mesin mengelola Compaction |
| `ingest(params)`   | Metode   | Menyimpan satu pesan                                   |
| `assemble(params)` | Metode   | Membangun konteks untuk proses model (mengembalikan `AssembleResult`) |
| `compact(params)`  | Metode   | Meringkas/mengurangi konteks                                 |

`assemble` mengembalikan `AssembleResult` dengan:

<ParamField path="messages" type="Message[]" required>
  Pesan terurut yang akan dikirim ke model.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Estimasi mesin atas jumlah total token dalam konteks yang telah disusun. OpenClaw menggunakan ini untuk keputusan ambang Compaction dan pelaporan diagnostik.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Ditambahkan di awal prompt sistem.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Mengontrol estimasi token mana yang digunakan runner untuk pemeriksaan awal luapan
  secara preventif. Nilai defaultnya adalah `"assembled"`, yang berarti hanya estimasi
  prompt yang telah disusun yang diperiksa untuk mesin yang tidak mengelola Compaction.
  Mesin yang menetapkan `ownsCompaction: true` mengelola penerimaan promptnya sendiri,
  sehingga secara default OpenClaw melewati pemeriksaan awal pra-prompt generik. Tetapkan
  `"preassembly_may_overflow"` hanya jika tampilan yang Anda susun dapat menyembunyikan risiko
  luapan dalam transkrip yang mendasarinya; runner kemudian mempertahankan pemeriksaan awal
  generik dan mengambil nilai maksimum antara estimasi yang telah disusun dan estimasi
  riwayat sesi pra-penyusunan (tanpa jendela) saat memutuskan apakah perlu melakukan
  Compaction secara preventif. Dalam kedua kasus, pesan yang Anda kembalikan tetap menjadi apa yang
  dilihat model—`promptAuthority` hanya memengaruhi pemeriksaan awal.
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  Siklus hidup proyeksi opsional untuk host dengan utas backend persisten (misalnya app-server Codex). `mode: "thread_bootstrap"` dengan `epoch` yang stabil meminta host menyuntikkan konteks yang telah disusun sekali per epoch dan menggunakan kembali utas backend hingga epoch berubah, alih-alih memproyeksikan ulang setiap giliran. Hilangkan bidang ini untuk proyeksi normal per giliran.
</ParamField>

`compact` mengembalikan `CompactResult`. Saat Compaction mengubah identitas sesi aktif,
`result.sessionTarget` (`ContextEngineSessionTarget` bertipe yang membawa
identitas sesi dan cakupan penyimpanan) mengidentifikasi sesi penerus yang harus digunakan oleh
percobaan ulang atau giliran berikutnya; `result.sessionId` mencerminkan id penerus tersebut.

Anggota opsional:

| Anggota                         | Jenis   | Tujuan                                                                                                                                      |
| ------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Metode | Menginisialisasi status mesin untuk sebuah sesi. Dipanggil sekali saat mesin pertama kali menemukan sesi (misalnya, mengimpor riwayat).                              |
| `maintain(params)`             | Metode | Pemeliharaan transkrip setelah bootstrap, giliran yang berhasil, atau Compaction. Gunakan `runtimeContext.rewriteTranscriptEntries()` untuk penulisan ulang yang aman. |
| `ingestBatch(params)`          | Metode | Menyerap giliran yang selesai sebagai batch. Dipanggil setelah proses selesai, dengan semua pesan dari giliran tersebut sekaligus.                                  |
| `afterTurn(params)`            | Metode | Pekerjaan siklus hidup pascaproses (mempertahankan status, memicu Compaction di latar belakang).                                                                      |
| `prepareSubagentSpawn(params)` | Metode | Menyiapkan status bersama untuk sesi turunan sebelum dimulai.                                                                                    |
| `onSubagentEnded(params)`      | Metode | Melakukan pembersihan setelah subagen berakhir.                                                                                                              |
| `dispose()`                    | Metode | Melepaskan sumber daya. Dipanggil selama penghentian Gateway atau pemuatan ulang Plugin—bukan per sesi.                                                        |

### Pengaturan runtime

Hook siklus hidup yang berjalan di dalam OpenClaw menerima objek
`runtimeSettings` opsional. Ini adalah permukaan API produsen/konsumen internal
hanya-baca dan berversi: OpenClaw memproduksinya untuk mesin konteks yang
dipilih, dan mesin konteks mengonsumsinya di dalam hook siklus hidup. Objek ini tidak
dirender langsung kepada pengguna dan tidak membuat permukaan pelaporan khusus.

- `schemaVersion`: saat ini `1`
- `runtime`: host OpenClaw, mode runtime (`normal`, `fallback`, atau
  `degraded`), serta id harness/runtime opsional
- `contextEngineSelection`: id mesin konteks yang dipilih dan sumber pemilihan
- `executionHost`: id dan label host untuk permukaan yang memanggil hook
- `model`: model yang diminta, model yang ditetapkan, penyedia, dan keluarga model opsional
- `limits`: anggaran token prompt dan token keluaran maksimum jika diketahui
- `diagnostics`: kode alasan fallback tertutup dan kondisi terdegradasi jika diketahui

Bidang yang nilainya mungkin tidak diketahui direpresentasikan sebagai `null`; bidang diskriminator seperti
mode runtime dan sumber pemilihan tetap tidak dapat bernilai null. Mesin lama tetap
kompatibel: jika mesin lama yang ketat menolak `runtimeSettings` sebagai properti yang
tidak dikenal, OpenClaw mencoba kembali pemanggilan siklus hidup tanpa properti tersebut alih-alih mengarantina
mesin.

### Persyaratan host

Mesin konteks dapat mendeklarasikan persyaratan kemampuan host pada `info.hostRequirements`.
OpenClaw memeriksa persyaratan ini sebelum memulai operasi dan gagal secara tertutup
dengan pesan kesalahan deskriptif ketika runtime yang dipilih tidak dapat memenuhinya.

Untuk proses agen, deklarasikan `assemble-before-prompt` ketika mesin harus mengendalikan
prompt model yang sebenarnya melalui `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Gunakan runtime native Codex atau runtime tertanam OpenClaw, atau pilih mesin konteks lama.",
    },
  },
}
```

Proses agen native Codex dan agen tertanam OpenClaw memenuhi `assemble-before-prompt`.
Backend CLI generik tidak memenuhinya, sehingga mesin yang memerlukannya ditolak sebelum
proses CLI dimulai.

### Isolasi kegagalan

OpenClaw mengisolasi mesin plugin yang dipilih dari jalur balasan inti. Jika
mesin nonlama tidak tersedia, gagal dalam validasi kontrak, melempar kesalahan saat
pembuatan factory, atau melempar kesalahan dari metode siklus hidup, OpenClaw mengarantina mesin tersebut
untuk proses Gateway saat ini dan menurunkan pekerjaan mesin konteks ke
mesin bawaan `legacy`. Kesalahan dicatat bersama operasi yang gagal agar
operator dapat memperbaiki, memperbarui, atau menonaktifkan plugin tanpa membuat agen
berhenti merespons.

Kegagalan persyaratan host berbeda: ketika mesin mendeklarasikan bahwa suatu runtime
tidak memiliki kemampuan yang diwajibkan, OpenClaw gagal secara tertutup sebelum memulai proses. Hal itu
melindungi mesin yang dapat merusak status jika dijalankan pada host yang tidak didukung.

### ownsCompaction

`ownsCompaction` mengontrol apakah pemadatan otomatis bawaan dalam percobaan milik runtime OpenClaw tetap diaktifkan untuk proses tersebut:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Mesin memiliki perilaku pemadatan. OpenClaw menonaktifkan pemadatan otomatis bawaan runtime OpenClaw dan pemeriksaan awal luapan generik sebelum prompt untuk proses tersebut, dan implementasi `compact()` milik mesin bertanggung jawab atas `/compact`, pemadatan pemulihan luapan penyedia, serta pemadatan proaktif apa pun yang ingin dilakukannya dalam `afterTurn()`. OpenClaw tetap menjalankan perlindungan luapan sebelum prompt ketika mesin mengembalikan `promptAuthority: "preassembly_may_overflow"` dari `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false atau tidak ditetapkan">
    Pemadatan otomatis bawaan runtime OpenClaw mungkin tetap berjalan selama eksekusi prompt, tetapi metode `compact()` milik mesin aktif tetap dipanggil untuk `/compact` dan pemulihan luapan.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **tidak** berarti OpenClaw secara otomatis melakukan fallback ke jalur pemadatan mesin lama.
</Warning>

Artinya, terdapat dua pola plugin yang valid:

<Tabs>
  <Tab title="Mode kepemilikan">
    Implementasikan algoritme pemadatan Anda sendiri dan tetapkan `ownsCompaction: true`.
  </Tab>
  <Tab title="Mode delegasi">
    Tetapkan `ownsCompaction: false` dan buat `compact()` memanggil `delegateCompactionToRuntime(...)` dari `openclaw/plugin-sdk/core` untuk menggunakan perilaku pemadatan bawaan OpenClaw.
  </Tab>
</Tabs>

Implementasi tanpa operasi pada `compact()` tidak aman untuk mesin aktif yang tidak memiliki pemadatan karena implementasi tersebut menonaktifkan jalur pemadatan normal `/compact` dan pemulihan luapan untuk slot mesin tersebut.

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
Slot bersifat eksklusif saat runtime—hanya satu mesin konteks terdaftar yang ditetapkan untuk suatu proses atau operasi pemadatan. Plugin `kind: "context-engine"` lain yang diaktifkan tetap dapat dimuat dan menjalankan kode pendaftarannya; `plugins.slots.contextEngine` hanya memilih id mesin terdaftar yang ditetapkan OpenClaw ketika membutuhkan mesin konteks.
</Note>

<Note>
**Penghapusan instalasi plugin:** ketika Anda menghapus instalasi plugin yang saat ini dipilih sebagai `plugins.slots.contextEngine`, OpenClaw mengatur ulang slot ke nilai default (`legacy`). Perilaku pengaturan ulang yang sama berlaku untuk `plugins.slots.memory`. Tidak diperlukan pengeditan konfigurasi secara manual.
</Note>

## Hubungan dengan pemadatan dan memori

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction adalah salah satu tanggung jawab mesin konteks. Mesin lama mendelegasikan ke peringkasan bawaan OpenClaw. Mesin plugin dapat mengimplementasikan strategi pemadatan apa pun (ringkasan DAG, pengambilan vektor, dan sebagainya).
  </Accordion>
  <Accordion title="Plugin memori">
    Plugin memori (`plugins.slots.memory`) terpisah dari mesin konteks. Plugin memori menyediakan pencarian/pengambilan; mesin konteks mengontrol apa yang dilihat model. Keduanya dapat bekerja bersama—mesin konteks dapat menggunakan data plugin memori selama perakitan. Mesin plugin yang ingin menggunakan jalur prompt memori aktif harus menggunakan `buildMemorySystemPromptAddition(...)` dari `openclaw/plugin-sdk/core`, yang mengonversi bagian prompt memori yang disiapkan host menjadi `systemPromptAddition` yang siap ditambahkan di awal tanpa mengekspos tata letak plugin memori.
  </Accordion>
  <Accordion title="Pemangkasan sesi">
    Pemangkasan hasil alat lama dalam memori tetap berjalan terlepas dari mesin konteks mana yang aktif.
  </Accordion>
</AccordionGroup>

## Kiat

- Gunakan `openclaw doctor` untuk memverifikasi bahwa mesin Anda dimuat dengan benar.
- Saat beralih mesin, sesi yang ada tetap menggunakan riwayat saat ini. Mesin baru mengambil alih untuk proses berikutnya.
- Kesalahan mesin dicatat dan mesin plugin yang dipilih dikarantina untuk proses Gateway saat ini. OpenClaw melakukan fallback ke `legacy` untuk giliran pengguna agar balasan dapat berlanjut, tetapi Anda tetap harus memperbaiki, memperbarui, menonaktifkan, atau menghapus instalasi plugin yang rusak.
- Untuk pengembangan, gunakan `openclaw plugins install -l ./my-engine` untuk menautkan direktori plugin lokal tanpa menyalinnya.

## Terkait

- [Compaction](/id/concepts/compaction) - meringkas percakapan panjang
- [Konteks](/id/concepts/context) - cara konteks dibangun untuk giliran agen
- [Arsitektur Plugin](/id/plugins/architecture) - mendaftarkan plugin mesin konteks
- [Manifes plugin](/id/plugins/manifest) - bidang manifes plugin
- [Plugin](/id/tools/plugin) - ikhtisar plugin
