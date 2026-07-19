---
read_when:
    - Anda ingin mengaktifkan mode kode OpenClaw untuk suatu proses agen
    - Anda perlu menjelaskan mengapa Code Mode berbeda dari Codex Code Mode
    - Anda sedang meninjau kontrak alat ringkas, sandbox QuickJS-WASI, transformasi TypeScript, atau jembatan katalog alat tersembunyi
    - Anda sedang menambahkan atau meninjau integrasi registry namespace mode kode internal
sidebarTitle: Code Mode
summary: Gunakan Mode Kode OpenClaw untuk menemukan, memanggil, dan menggabungkan katalog alat yang besar dalam alur kerja JavaScript atau TypeScript yang ringkas
title: Mode Kode
x-i18n:
    generated_at: "2026-07-19T05:21:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b3edb486f470860fdf309d2e059517e6e174b48928bd3ffce06016d340b34820
    source_path: tools/code-mode.md
    workflow: 16
---

Mode kode adalah fitur eksperimental runtime agen OpenClaw yang bersifat opt-in. Saat
diaktifkan, model tidak lagi melihat setiap skema alat yang diaktifkan; sebagai gantinya, model melihat
`exec`, `wait`, dan alat khusus langsung apa pun yang hasil terstrukturnya tidak dapat melewati
jembatan tamu khusus JSON. Model menulis program JavaScript atau TypeScript kecil
yang mencari, mendeskripsikan, dan memanggil katalog alat tersembunyi.

Halaman ini mendokumentasikan mode kode OpenClaw, bukan Codex Code Mode. Kedua fitur
memiliki nama dan nama alat kontrol yang sama (`exec`, `wait`), tetapi keduanya merupakan
implementasi yang terpisah:

- Codex Code Mode berjalan di dalam harness pengodean Codex. Alat `exec`-nya adalah
  alat tata bahasa bebas: model menulis sumber JavaScript mentah (secara opsional
  diawali dengan baris pragma `// @exec: {...}` untuk opsi eksekusi), yang dieksekusi
  dalam runtime V8 Code Mode dalam proses milik Codex.
- Mode kode OpenClaw berjalan dalam runtime agen OpenClaw generik dan
  dinonaktifkan kecuali `tools.codeMode.enabled: true` dikonfigurasi. Alat `exec`-nya
  menerima payload JSON `{ code, language }`, yang dieksekusi dalam worker QuickJS-WASI.

Keduanya merupakan permukaan eksekusi JavaScript, bukan permukaan perintah shell. Perlakukan keduanya
sebagai fitur independen dengan implementasi berbeda yang kebetulan mengekspos
alat `exec`/`wait` bernama sama.

## Fungsinya

- Daftar alat yang terlihat oleh model menjadi `exec`, `wait`, ditambah alat khusus langsung apa pun
  seperti `computer` atau pemuat penglihatan native `image` yang hasil gambarnya
  tidak dapat melewati jembatan tamu.
- `exec` mengevaluasi JavaScript atau TypeScript yang dihasilkan model dalam thread
  worker QuickJS-WASI yang terisolasi.
- Setiap alat aktif yang memenuhi syarat katalog (inti OpenClaw, plugin, MCP, klien) disembunyikan sebagai
  alat model mandiri dan diekspos di dalam program tamu melalui `ALL_TOOLS`
  dan `tools`.
- Deskripsi `exec` membawa indeks cepat terbatas berisi ID katalog OpenClaw/plugin
  yang persis, petunjuk input ringkas, dan petunjuk output yang dideklarasikan secara ringkas ketika
  alat tepercaya menyediakan skema output. Deskripsi ini tidak menyertakan deskripsi, skema lengkap,
  entri MCP, dan entri yang melampaui batas; pencarian katalog di sisi tamu tetap menjadi cadangan.
- Kode tamu mencari katalog tersembunyi, mendeskripsikan skema alat, dan memanggil
  alat melalui jalur eksekusi yang sama dengan giliran agen normal (kebijakan,
  persetujuan, hook, dan telemetri tetap berlaku).
- Alat MCP dikelompokkan di bawah namespace `MCP`; dalam mode kode, ini adalah
  satu-satunya cara yang didukung untuk memanggilnya.
- `wait` melanjutkan proses mode kode yang ditangguhkan ketika panggilan alat bertingkat masih
  tertunda.

Mode kode hanya mengubah permukaan orkestrasi yang dihadapkan kepada model. Mode ini tidak
menggantikan alat, alat plugin, alat MCP, autentikasi, kebijakan persetujuan, perilaku
saluran, atau pemilihan model.

## Mengapa menggunakannya

- Permukaan prompt yang lebih kecil: penyedia mendapatkan dua alat kontrol, indeks alat native
  terbatas, dan hanya beberapa alat langsung yang diperlukan, alih-alih puluhan atau ratusan
  skema alat lengkap.
- Orkestrasi yang lebih baik: model dapat menggunakan perulangan, penggabungan, transformasi kecil,
  logika kondisional, dan panggilan alat bertingkat paralel dalam satu sel kode.
- Lebih sedikit perjalanan bolak-balik model: kontrak output yang dideklarasikan memungkinkan model memanggil dan
  mentransformasi hasil alat dalam satu `exec`; output yang tidak diketahui tetap mengutamakan bentuk mentah.
- Netral terhadap penyedia: berfungsi untuk alat OpenClaw, plugin, MCP, dan klien tanpa
  bergantung pada eksekusi kode native penyedia.
- Gagal secara tertutup: jika mode kode diaktifkan tetapi runtime QuickJS-WASI
  tidak tersedia, proses akan gagal alih-alih diam-diam kembali ke eksposur langsung
  alat yang luas.

Paling berguna untuk agen dengan katalog alat aktif yang besar, atau alur kerja ketika
model perlu mencari, menggabungkan, dan memanggil beberapa alat sebelum menjawab.

Pertahankan eksposur alat langsung untuk katalog kecil atau model yang tidak dapat secara andal
menulis program pendek. Gunakan [Pencarian Alat](/id/tools/tool-search) ketika Anda menginginkan
katalog ringkas tetapi lebih memilih kontrol pencarian/deskripsi/panggilan terstruktur daripada
tamu QuickJS-WASI.

## Mulai cepat

### Aktifkan Mode Kode

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Bentuk singkat:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

Mode kode tetap nonaktif ketika `tools.codeMode` dihilangkan, `false`, atau berupa objek
tanpa `enabled: true`.

Jika Anda menggunakan agen dalam sandbox dengan server MCP yang dikonfigurasi, izinkan juga
plugin MCP bawaan dalam kebijakan alat sandbox, misalnya
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Lihat
[Konfigurasi - alat dan penyedia kustom](/id/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Tetapkan batas eksplisit agar lebih ketat:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      timeoutMs: 10000,
      memoryLimitBytes: 67108864,
      maxOutputBytes: 65536,
      maxSnapshotBytes: 10485760,
      maxPendingToolCalls: 16,
      snapshotTtlSeconds: 900,
      searchDefaultLimit: 8,
      maxSearchLimit: 50,
    },
  },
}
```

### Yang dilakukan model

Untuk alat dengan output yang dideklarasikan seperti
`Array<{ id: string; paid: boolean; tons: number }>`, satu program tamu dapat
memilih, memanggil, dan mentransformasikannya:

```javascript
const [shipmentTool] = await tools.search("list shipments");
const shipments = await tools.callValue(shipmentTool.id, {});
return shipments.filter((shipment) => !shipment.paid && shipment.tons > 10);
```

Ketika baris indeks cepat diakhiri dengan `-> ?`, bentuk output tidak diketahui. Pemanggilan
`exec` pertama harus mengembalikan `await tools.callValue(...)` tanpa perubahan. `exec` berikutnya dapat
mentransformasi nilai yang diamati. Ini memerlukan satu giliran model tambahan, tetapi mencegah
model menebak nama bidang.

### Verifikasi permukaan aktif

Untuk mengonfirmasi bentuk payload model saat melakukan debug, jalankan Gateway dengan
pencatatan log yang ditargetkan:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Saat mode kode aktif, nama alat yang dihadapkan kepada model dalam log seharusnya adalah `exec` dan
`wait`. Untuk payload penyedia lengkap yang telah disamarkan, tambahkan
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` untuk sesi debug singkat.

## Tur teknis

Bagian selanjutnya dari halaman ini membahas kontrak runtime dan detail implementasi,
untuk pengelola, penulis plugin yang melakukan debug eksposur alat, dan operator yang
memvalidasi deployment berisiko tinggi.

## Status runtime

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Runtime             | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                               |
| Status default      | dinonaktifkan                                                                               |
| Stabilitas          | permukaan eksperimental OpenClaw (Codex Code Mode adalah permukaan harness Codex stabil yang terpisah) |
| Permukaan target    | proses agen OpenClaw generik                                                                |
| Postur keamanan     | kode model bersifat berbahaya                                                               |
| Janji kepada pengguna | mengaktifkan mode kode tidak pernah diam-diam kembali ke eksposur alat langsung yang luas |

## Cakupan

Mode kode mengelola bentuk orkestrasi yang dihadapkan kepada model untuk proses yang telah disiapkan. Mode ini
tidak mengelola pemilihan model, perilaku saluran, autentikasi, kebijakan alat, atau implementasi
alat.

Termasuk dalam cakupan: definisi alat kontrol/langsung yang terlihat oleh model, konstruksi katalog alat
tersembunyi, eksekusi tamu JavaScript/TypeScript, runtime worker QuickJS-WASI,
callback host untuk pencarian/deskripsi/panggilan, status yang dapat dilanjutkan untuk
program tamu yang ditangguhkan, batas output/waktu tunggu/memori/panggilan tertunda/snapshot,
serta proyeksi telemetri/jejak untuk panggilan alat bertingkat.

Di luar cakupan: eksekusi kode jarak jauh native penyedia, semantik eksekusi
shell, perubahan otorisasi alat yang ada, skrip persisten yang ditulis pengguna,
akses pengelola paket/berkas/jaringan/modul dalam kode tamu, dan penggunaan ulang langsung
internal Codex Code Mode.

Alat milik penyedia seperti sandbox Python jarak jauh merupakan alat terpisah. Lihat
[Eksekusi kode](/id/tools/code-execution).

## Istilah

- **Mode kode**: mode runtime OpenClaw yang menyembunyikan alat model yang kompatibel dengan katalog
  dan mengekspos `exec`, `wait`, ditambah alat khusus langsung yang diperlukan.
- **Runtime tamu**: VM JavaScript QuickJS-WASI yang mengevaluasi kode model.
- **Jembatan host**: permukaan callback sempit yang kompatibel dengan JSON dari kode tamu
  kembali ke OpenClaw.
- **Katalog**: daftar alat efektif dalam lingkup proses setelah resolusi normal
  kebijakan alat, plugin, MCP, dan alat klien.
- **Panggilan alat bertingkat**: panggilan alat yang dilakukan dari kode tamu melalui jembatan
  host.
- **Snapshot**: status VM QuickJS-WASI terserialisasi yang disimpan agar `wait` dapat melanjutkan
  proses mode kode yang ditangguhkan.

## Konfigurasi

`tools.codeMode.enabled` adalah gerbang aktivasi; menetapkan bidang lain tidak
mengaktifkan fitur ini dengan sendirinya.

| Bidang                | Default                        | Batas                                           |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| `enabled`             | `false`                        | boolean; hanya `true` yang mengaktifkan mode kode |
| `runtime`             | `"quickjs-wasi"`               | satu-satunya nilai yang didukung                 |
| `mode`                | `"only"`                       | mengekspos alat kontrol/langsung, mengatalogkan sisanya |
| `languages`           | `["javascript", "typescript"]` | subset apa pun dari keduanya                    |
| `timeoutMs`           | `10000`                        | `100`-`60000`                                   |
| `memoryLimitBytes`    | `67108864`                     | `1048576`-`1073741824`                          |
| `maxOutputBytes`      | `65536`                        | `1024`-`10485760`                               |
| `maxSnapshotBytes`    | `10485760`                     | `1024`-`268435456`                              |
| `maxPendingToolCalls` | `16`                           | `1`-`128`                                       |
| `snapshotTtlSeconds`  | `900`                          | `1`-`86400`                                     |
| `searchDefaultLimit`  | `8`                            | dibatasi hingga `maxSearchLimit`                 |
| `maxSearchLimit`      | `50`                           | `1`-`50`                                        |

Jika mode kode diaktifkan tetapi QuickJS-WASI tidak dapat dimuat, OpenClaw gagal secara tertutup
untuk proses tersebut; OpenClaw tidak diam-diam mengekspos alat normal sebagai cadangan.

## Aktivasi

Mode kode dievaluasi setelah kebijakan alat efektif diketahui dan sebelum
permintaan model akhir disusun:

1. Tentukan agen, model, penyedia, sandbox, saluran, pengirim, dan kebijakan
   eksekusi.
2. Susun daftar alat OpenClaw yang efektif, dengan menambahkan alat plugin, MCP, dan
   klien yang memenuhi syarat.
3. Terapkan kebijakan izinkan/tolak.
4. Jika `tools.codeMode.enabled` bernilai false, lanjutkan dengan eksposur alat normal.
5. Jika diaktifkan dan alat aktif untuk eksekusi tersebut, pertahankan alat wajib
   khusus-langsung dan daftarkan setiap alat efektif yang memenuhi syarat katalog ke
   katalog mode kode.
6. Hapus alat yang telah dikatalogkan dari daftar yang terlihat oleh model; tambahkan `exec` dan
   `wait` bersama alat khusus-langsung yang dipertahankan.

Eksekusi yang sengaja tidak memiliki alat (panggilan model mentah, `disableTools: true`,
atau daftar `tools.allow` kosong) tidak mengaktifkan permukaan mode kode meskipun
`tools.codeMode.enabled: true` dikonfigurasi. Mode kode dan Pencarian Alat OpenClaw
saling eksklusif untuk satu eksekusi; jika mode kode aktif, compaction Pencarian Alat
tidak dijalankan.

Katalog mode kode dicakup per eksekusi dan tidak boleh membocorkan alat dari
agen, sesi, pengirim, atau eksekusi lain.

## Alat yang terlihat oleh model

Saat mode kode aktif, model melihat `exec`, `wait`, dan semua alat wajib
khusus-langsung. Setiap alat aktif lainnya disembunyikan dari daftar alat yang
ditampilkan kepada model dan didaftarkan dalam katalog mode kode.

Gunakan `exec` untuk orkestrasi alat, penggabungan data, perulangan, panggilan bertingkat paralel,
dan transformasi terstruktur. Gunakan `wait` hanya ketika `exec` mengembalikan hasil
`waiting` yang dapat dilanjutkan.

## `exec`

`exec` memulai sel mode kode dan mengembalikan satu hasil. Kode masukan dihasilkan
oleh model dan harus diperlakukan sebagai berbahaya.

Masukan:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Aturan:

- Salah satu dari `code` atau `command` harus tidak kosong.
- `code` adalah bidang yang didokumentasikan dan ditampilkan kepada model.
- `command` diterima sebagai alias yang kompatibel dengan eksekusi untuk kebijakan hook dan
  penulisan ulang tepercaya (alat eksekusi shell OpenClaw normal juga menggunakan bidang `command`);
  jika keduanya tersedia, nilainya harus sama.
- `language` secara default bernilai `"javascript"`; skema mengeksposnya sebagai enum
  string datar (`"javascript" | "typescript"`), bukan union `oneOf`/`anyOf`,
  karena beberapa penyedia menolak bentuk tersebut.
- Jika `language` adalah `"typescript"`, OpenClaw melakukan transpilasi sebelum evaluasi.
- `exec` menolak `import`, `require`, impor dinamis, dan pola pemuat modul.
- `exec` tidak pernah mengekspos implementasi `exec` shell normal secara rekursif.
- Peristiwa hook `exec` mode kode luar membawa `toolKind: "code_mode_exec"` dan
  `toolInputKind: "javascript" | "typescript"` (jika diketahui), sehingga kebijakan dapat
  membedakan sel mode kode dari panggilan `exec` bergaya shell yang memakai
  nama alat yang sama.

Hasil:

```typescript
type CodeModeResult = CodeModeCompletedResult | CodeModeWaitingResult | CodeModeFailedResult;

type CodeModeCompletedResult = {
  status: "completed";
  value: unknown;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeWaitingResult = {
  status: "waiting";
  runId: string;
  reason: "pending_tools" | "yield";
  pendingToolCalls?: CodeModePendingToolCall[];
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeFailedResult = {
  status: "failed";
  error: string;
  code?: CodeModeErrorCode;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};
```

`exec` mengembalikan `waiting` ketika guest ditangguhkan dengan status yang dapat dilanjutkan dan masih
memerlukan kelanjutan yang terlihat oleh model—`yield_control(...)` eksplisit, atau
panggilan alat jembatan yang belum terselesaikan dalam tenggat eksekusi. Hasilnya
menyertakan `runId` untuk `wait`. Panggilan alat jembatan—`tools.search`/`describe`/
`call` dan panggilan namespace, termasuk panggilan namespace MCP—dikuras secara otomatis
di dalam panggilan `exec`/`wait` yang sama selama terselesaikan dalam tenggat, sehingga
blok kode ringkas yang menunggu beberapa alat dapat berjalan hingga selesai dalam satu giliran
model, alih-alih memaksakan satu panggilan alat model per operasi tunggu. Eksekusi yang aman terhadap
mulai ulang tidak pernah dikuras secara otomatis; pekerjaan tertundanya tetap melalui pemeriksaan yang aman untuk pemutaran ulang.

`exec` mengembalikan `completed` hanya ketika VM guest tidak memiliki pekerjaan tertunda dan
nilai akhirnya kompatibel dengan JSON setelah adaptor keluaran OpenClaw dijalankan.

## `wait`

`wait` melanjutkan VM mode kode yang ditangguhkan.

Masukan:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

Keluarannya adalah union `CodeModeResult` yang sama dengan yang dikembalikan oleh `exec`.

`wait` tersedia karena alat OpenClaw bertingkat dapat berjalan lambat, interaktif, dibatasi
persetujuan, atau mengalirkan pembaruan parsial; model tidak perlu mempertahankan satu panggilan
`exec` yang panjang tetap terbuka saat host menunggu pekerjaan eksternal.

Snapshot/pemulihan QuickJS-WASI adalah mekanisme pelanjutannya:

1. `exec` mengevaluasi kode hingga selesai, gagal, atau ditangguhkan.
2. Saat ditangguhkan, OpenClaw membuat snapshot VM QuickJS dan mencatat pekerjaan host
   yang tertunda.
3. Ketika pekerjaan tertunda selesai, `wait` memulihkan snapshot VM dan
   mendaftarkan ulang callback host berdasarkan nama yang stabil.
4. OpenClaw mengirimkan hasil alat bertingkat ke VM yang dipulihkan dan menguras
   pekerjaan QuickJS yang tertunda.
5. `wait` mengembalikan `completed`, `failed`, atau hasil `waiting` lainnya.

Snapshot merupakan status runtime, bukan artefak pengguna: snapshot hanya berada dalam
peta dalam proses (tanpa penulisan ke basis data atau disk), memiliki batas ukuran, kedaluwarsa, dan
dicakup ke eksekusi dan sesi yang membuatnya.

`wait` gagal (sebagai hasil `failed`) ketika:

- `runId` tidak dikenal atau snapshot-nya sudah kedaluwarsa.
- pemanggil tidak berada dalam cakupan eksekusi/sesi yang sama dengan eksekusi yang ditangguhkan.
- sebuah `wait` sudah berlangsung untuk `runId` tersebut.
- pemulihan QuickJS-WASI gagal.
- pelanjutan akan melampaui `maxOutputBytes` atau `maxSnapshotBytes`.

## API runtime guest

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` adalah metadata ringkas untuk katalog yang dicakup per eksekusi; metadata ini secara default
tidak memuat skema lengkap. Deskripsi `exec` yang terlihat oleh model juga menyertakan
subset terbatas dan deterministik dari ID OpenClaw/plugin yang persis, petunjuk masukan
ringkas, dan petunjuk keluaran terdeklarasi yang tepercaya. Deskripsi tetap ditangguhkan agar
prosa katalog yang bersifat adversarial tidak dapat mengarahkan model. Ketika indeks tersebut menghilangkan suatu alat,
baca `ALL_TOOLS` atau panggil `tools.search(...)` di dalam program guest.

Panah pada setiap baris indeks cepat menjelaskan nilai `tools.callValue(...)`.
`-> Array<{ id: string }>` adalah petunjuk keluaran terdeklarasi; `-> ?` berarti keluaran tidak diketahui.
Keluaran yang tidak diketahui tetap mengutamakan data mentah: kembalikan nilainya tanpa perubahan, amati, lalu
filter atau petakan dalam `exec` berikutnya, alih-alih menebak nama bidang. Hal ini juga
berlaku ketika pembacaan keluaran terdeklarasi diteruskan ke panggilan `-> ?` akhir: kembalikan
nilai mentah panggilan tersebut tanpa membungkusnya dalam bentuk jawaban yang diminta.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "mcp" | "client";
  sourceName?: string;
  input: string;
  output?: string;
};
```

`input` adalah signature bergaya TypeScript yang terbatas untuk kasus umum. Gunakan
`tools.describe(...)` ketika skema lengkap yang persis masih diperlukan. Entri MCP jarak jauh
dan klien menggunakan `input: "unknown"` agar skema tidak tepercaya mereka tetap
ditangguhkan hingga `describe`. `output`
hanya tersedia untuk petunjuk ringkas lengkap yang diturunkan dari inti OpenClaw
tepercaya atau `outputSchema` plugin. Klaim skema keluaran MCP dan klien tidak dinaikkan
menjadi petunjuk katalog tepercaya ini.

Alat plugin menggunakan `source: "openclaw"` dengan `sourceName` yang diatur ke ID
plugin pemilik; tidak ada nilai sumber `"plugin"` yang terpisah. `source: "mcp"`
hanya digunakan untuk entri MCP dalam metadata `sourceName`/`mcp` (dan difilter keluar
dari `ALL_TOOLS`/`tools.*`, lihat di bawah).

Skema lengkap hanya dimuat sesuai permintaan:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
  outputSchema?: unknown;
};
```

Pembantu katalog:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  callValue(id: string, input?: unknown): Promise<unknown>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Fungsi alat praktis hanya dipasang untuk nama aman yang tidak ambigu:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.callValue(fileRead.id, { path: "README.md" });

// Jika katalog tersembunyi memiliki entri `web_search` yang tidak ambigu:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

`tools.callValue(...)` secara langsung mengembalikan nilai `details` JSON dari alat normal.
`tools.call(...)` mempertahankan envelope `{ tool, result }` mentah bagi pemanggil
yang memerlukan blok konten atau metadata hasil lainnya.

## Kontrak keluaran terdeklarasi

Alat OpenClaw dapat mendeklarasikan `outputSchema` untuk nilai terstruktur yang ditempatkan dalam
`AgentToolResult.details`. Ini berguna untuk Mode Kode dan Pencarian Alat; ini
bukan skema respons alat native penyedia dan tidak mengubah eksposur alat langsung.

Untuk alat yang dibuat dengan `defineToolPlugin`, deklarasikan skema di samping
`parameters`:

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

const Shipment = Type.Object(
  {
    id: Type.String(),
    paid: Type.Boolean(),
    tons: Type.Number(),
  },
  { additionalProperties: false },
);

export default defineToolPlugin({
  id: "shipping",
  name: "Shipping",
  description: "Alat pengiriman.",
  tools: (tool) => [
    tool({
      name: "shipping_list",
      description: "Cantumkan pengiriman.",
      parameters: Type.Object({}),
      outputSchema: Type.Array(Shipment),
      execute: async () => loadShipments(),
    }),
  ],
});
```

Untuk `api.registerTool(...)` atau alat factory, tempatkan properti `outputSchema` yang sama
pada objek `AnyAgentTool` yang dikembalikan.

Kontrak bawaan saat ini mencakup `agents_list`, `apply_patch`,
`conversations_list`, `conversations_send`, `conversations_turn`, `edit`,
`openclaw`, `read`, `screen`,
`sessions_history`, `sessions_list`, `sessions_search`, `sessions_send`,
`session_status`, `spawn_task`, `terminal`, `web_fetch`, dan `web_search`.
Penerusan persis dapat menggunakan kembali skema protokol pemiliknya alih-alih
menduplikasi kontrak khusus model. Misalnya, alat percakapan mengekspos
skema hasil Gateway yang sama dengan yang digunakan oleh `conversations.list`,
`conversations.send`, dan `conversations.turn`; `web_fetch` memiliki skema
lokal alat yang petunjuknya mengekspos metadata stabil, teks, status cache, dan
metadata luapan bertingkat; `web_search` mendeklarasikan union persis hasil
ternormalisasi/jawaban/kesalahan/mentah sebagai petunjuk indeks cepat yang lengkap.
Kontrak sistem berkas mengembalikan hasil terstruktur untuk teks yang dibaca,
gambar, pemotongan, dan opsional-tidak-ditemukan; status perubahan pengeditan
eksplisit beserta data diff/patch; serta ringkasan jalur apply-patch. Ketika
indeks cepat mendeklarasikan bidang-bidangnya, satu sel dapat menggabungkan
penemuan dan pengiriman tanpa giliran pemeriksaan terpisah:

```javascript
const listed = await tools.conversations_list({ query: "build bot" });
const target = listed.conversations.find((item) => item.label === "Build bot");
if (!target) throw new Error("conversation not found");
return await tools.conversations_send({
  conversationRef: target.conversationRef,
  message: "Build finished.",
});
```

Pemanggilan bertingkat tetap menggunakan kebijakan alat, hook, dan persetujuan
normal. Jika kontrak lengkap bersifat persis tetapi terlalu besar untuk indeks
cepat yang dibatasi, kontrak tersebut tetap tersedia melalui `tools.describe(...)`
dan panah tetap `-> ?`.

Aturan kontraknya ketat:

- Jelaskan nilai `details` persis yang kompatibel dengan JSON, bukan blok
  `content` yang dirender atau amplop penyedia.
- Sertakan setiap varian keberhasilan atau kesalahan yang tidak melempar.
  Hilangkan `outputSchema` jika alat tidak memiliki hasil terstruktur yang stabil.
- Tutup lapisan objek dengan `{ additionalProperties: false }` untuk menghasilkan petunjuk
  indeks cepat yang lengkap. Skema terbuka, terlalu besar, atau parsial karena
  alasan lain tetap tersedia melalui `tools.describe(...)`, tetapi tidak
  memungkinkan penggunaan bidang dalam satu giliran.
- OpenClaw mengompilasi skema sebelum menjalankan alat, lalu memvalidasi
  `details` akhir setelah hook alat normal dan sebelum pemanggilan katalog
  dikembalikan. Skema yang tidak valid tidak dapat menjalankan alat; ketidakcocokan
  akan gagal tanpa mencetak nilainya.
- Petunjuk ringkas bersifat deterministik dan dibatasi. `tools.describe(...)`
  mengekspos skema tepercaya lengkap ketika petunjuk ringkas tidak memadai.
- Kode plugin yang terpasang sudah merupakan kode lokal tepercaya. Metadata
  MCP dan klien jarak jauh tetap tidak tepercaya dan tidak dapat ikut serta
  dalam petunjuk indeks cepat ini.

Lihat [Plugin alat](/id/plugins/tool-plugins#output-contracts) untuk detail
pembuatan plugin.

Entri katalog MCP tidak dapat dipanggil melalui `tools.callValue(...)`,
`tools.call(...)`, atau fungsi praktis dalam mode kode; entri tersebut hanya
diekspos melalui namespace `MCP` yang dihasilkan. Berkas deklarasi
bergaya TypeScript tersedia melalui permukaan berkas virtual hanya-baca
`API`, sehingga agen dapat memeriksa tanda tangan MCP tanpa
menambahkan skema MCP ke prompt:

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigate gateway logs",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` mengembalikan deklarasi ringkas yang disimpulkan dari
metadata alat MCP:

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Return this TypeScript-style API header. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Create a GitHub issue.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

Berkas deklarasi bersifat virtual, tidak ditulis di bawah ruang kerja atau
direktori status. Untuk setiap pemanggilan `exec` mode kode,
OpenClaw membuat katalog alat bercakupan eksekusi, mempertahankan entri MCP
yang terlihat, merender `mcp/index.d.ts` beserta satu `mcp/<server>.d.ts`
untuk setiap server yang terlihat, dan menyuntikkan tabel kecil hanya-baca
tersebut ke worker QuickJS. Kode tamu hanya melihat objek `API`:
`API.list(prefix?)` mengembalikan metadata berkas dan `API.read(path)`
mengembalikan konten deklarasi yang dipilih. Jalur yang tidak dikenal serta
segmen `.`/`..` ditolak.

Hal ini mencegah skema MCP berukuran besar masuk ke prompt model: agen
mengetahui bahwa API virtual tersedia dari deskripsi alat `exec`,
hanya membaca berkas deklarasi yang diperlukan, lalu memanggil
`MCP.<server>.<tool>()` dengan satu argumen objek. `MCP.<server>.$api()` tetap
tersedia sebagai fallback sebaris untuk respons skema satu alat di dalam
program.

Runtime tamu tidak pernah melihat objek host secara langsung. Masukan dan
keluaran melintasi jembatan sebagai nilai yang kompatibel dengan JSON dengan
batas ukuran eksplisit.

## Namespace internal

Namespace internal memberi mode kode API domain yang ringkas tanpa menambahkan
lebih banyak alat yang terlihat oleh model. Integrasi milik pemuat mendaftarkan
namespace seperti `Issues` atau `Calendar`; kode tamu kemudian
memanggil namespace tersebut di dalam program QuickJS sementara model tetap
melihat permukaan kontrol/langsung yang ringkas.

Untuk saat ini, namespace bersifat internal. Tidak ada API namespace SDK plugin
publik: namespace plugin eksternal memerlukan kontrak milik pemuat agar identitas
plugin, manifes yang terpasang, status autentikasi, dan deskriptor katalog yang
di-cache tidak menyimpang dari alat plugin yang mendukung namespace tersebut.
Mode kode inti hanya memiliki sandbox, serialisasi, pembatasan katalog, dan
pengiriman jembatan.

Kode tamu dapat menggunakan global langsung atau peta `namespaces`:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Siklus hidup registri

Registri namespace bersifat lokal proses dan diberi kunci berdasarkan id
namespace:

1. Pemuat tepercaya memanggil `registerCodeModeNamespaceForPlugin(pluginId, registration)`.
2. Mode kode membuat `ToolSearchRuntime` tersembunyi untuk eksekusi tersebut
   dan membaca katalog bercakupan eksekusinya.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` hanya mempertahankan pendaftaran
   yang semua `requiredToolNames`-nya terlihat dan dimiliki oleh `pluginId`
   yang sama.
4. Setiap namespace yang terlihat memanggil `createScope(ctx)` untuk
   eksekusi saat ini, menerima konteks eksekusi seperti `agentId`,
   `sessionKey`, `sessionId`, `runId`, konfigurasi,
   dan status pembatalan.
5. Data cakupan diserialisasi menjadi deskriptor biasa dan disuntikkan ke
   QuickJS sebagai global langsung dan `namespaces.<globalName>`.
6. Pemanggilan tamu ditangguhkan melalui jembatan worker, menyelesaikan jalur
   namespace pada host, memetakan pemanggilan ke alat katalog milik plugin yang
   dideklarasikan, dan menjalankan alat tersebut melalui `ToolSearchRuntime.callExactId`.
7. Pemanggilan jembatan namespace yang siap dikuras secara otomatis di dalam
   pemanggilan `exec`/`wait` yang aktif; jika pekerjaan
   namespace masih tertunda saat batas waktu tercapai atau tamu menghasilkan
   kendali secara eksplisit, `wait` melanjutkan runtime namespace
   yang sama nanti.
8. Rollback atau penghapusan instalasi plugin memanggil
   `clearCodeModeNamespacesForPlugin(pluginId)` agar global usang tidak bertahan setelah pemuatan plugin
   yang gagal.

Pemanggilan namespace adalah pemanggilan alat katalog: pemanggilan tersebut
menggunakan hook kebijakan, persetujuan, penanganan pembatalan, telemetri,
proyeksi transkrip, dan perilaku tangguhkan/lanjutkan yang sama seperti
`tools.call(...)`.

### Bentuk pendaftaran

Daftarkan namespace dari integrasi yang memiliki alat pendukung. Jaga cakupan
tetap kecil dan hanya ekspos verba domain yang dipetakan ke alat katalog yang
dideklarasikan.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "GitHub issue helpers for the current repository.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) and Issues.update(number, patch).",
  createScope: (ctx) => ({
    repository: ctx.config,
    list: createCodeModeNamespaceTool("github_list_issues", ([params]) => params ?? {}),
    update: createCodeModeNamespaceTool("github_update_issue", ([number, patch]) => ({
      number,
      patch,
    })),
  }),
});
```

`createCodeModeNamespaceTool(toolName, inputMapper)` menandai anggota cakupan sebagai fungsi namespace yang
dapat dipanggil. `inputMapper` opsional menerima argumen tamu dan
mengembalikan objek masukan untuk alat katalog pendukung; tanpanya, argumen
tamu pertama digunakan, atau `{}` jika dihilangkan.

Fungsi host mentah ditolak sebelum kode tamu berjalan:

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### Kepemilikan dan visibilitas

Kepemilikan namespace terikat pada `pluginId` milik pemanggil
pendaftaran. `requiredToolNames` merupakan gerbang visibilitas sekaligus
pemeriksaan kepemilikan:

- setiap alat yang diperlukan harus ada dalam katalog eksekusi
- setiap alat yang diperlukan harus memiliki `sourceName === pluginId`
- namespace disembunyikan ketika alat yang diperlukan tidak ada atau dimiliki
  oleh plugin lain
- setiap jalur yang dapat dipanggil hanya boleh menargetkan alat yang namanya
  tercantum dalam `requiredToolNames`

Hal ini mencegah plugin lain mengekspos namespace dengan mendaftarkan alat
bernama sama, serta menjaga namespace tetap selaras dengan kebijakan agen
biasa: jika eksekusi tidak dapat melihat alat pendukungnya, eksekusi tersebut
tidak dapat melihat namespace.

Misalnya, namespace GitHub seharusnya berada di balik plugin milik GitHub yang
memiliki autentikasi GitHub, klien REST/GraphQL, batas laju, persetujuan
penulisan, dan pengujian. Mode kode inti tidak boleh menyematkan API khusus
GitHub, penanganan token, atau kebijakan penyedia.

### Aturan serialisasi cakupan

`createScope(ctx)` dapat mengembalikan objek biasa yang berisi nilai yang
kompatibel dengan JSON, larik, objek bertingkat, dan penanda pemanggilan
`createCodeModeNamespaceTool(...)`. Objek host tidak pernah memasuki QuickJS secara langsung.

Penyerial menolak:

- fungsi mentah
- graf objek melingkar
- segmen jalur yang tidak aman: `__proto__`, `constructor`,
  `prototype`, kunci kosong, atau kunci yang berisi pemisah jalur internal
- nilai `globalName` yang bukan pengidentifikasi JavaScript
- benturan `globalName` dengan global mode kode bawaan seperti
  `tools`, `namespaces`, `text`,
  `json`, `yield_control`, `MCP`,
  `API`, `ALL_TOOLS`, atau `__openclaw*`

Nilai yang tidak dapat diserialisasi ke JSON dikonversi menjadi nilai fallback
yang aman untuk JSON sebelum melintasi jembatan. Data biner, handle, soket,
klien, dan instans kelas harus tetap berada di balik alat katalog biasa.

### Prompt

`description` namespace dan `prompt` opsional ditambahkan ke
skema `exec` yang terlihat oleh model hanya ketika namespace
terlihat untuk eksekusi tersebut. Gunakan keduanya untuk mengajarkan permukaan
berguna yang paling kecil:

```typescript
{
  description: "Helper layanan produksi fiksi.",
  prompt:
    "Gunakan Fictions.riskAudit(), Fictions.promoteIfReady(id, status), dan Fictions.unpaidOver(amount).",
}
```

Pertahankan prompt agar membahas kontrak namespace, bukan penyiapan autentikasi, riwayat
implementasi, atau perilaku plugin yang tidak terkait.

### Pembersihan

Namespace adalah pendaftaran yang bersifat lokal bagi proses. Hapus namespace saat
plugin pemiliknya dinonaktifkan, dihapus instalasinya, atau dikembalikan ke versi sebelumnya:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

Pembersihan mode kode dimiliki oleh plugin; hapus pendaftaran namespace milik plugin
ketika siklus hidupnya berakhir, alih-alih mempertahankan handle pembongkaran per namespace.
Pengujian dapat memanggil `clearCodeModeNamespacesForTest()` untuk menghindari kebocoran
pendaftaran antar kasus.

### Daftar periksa pengujian

Perubahan namespace harus mencakup batas keamanan dan perilaku tamu:

- teks prompt namespace hanya muncul saat alat pendukung terlihat
- alat bernama sama dari `sourceName` lain tidak mengekspos namespace
- fungsi cakupan mentah ditolak
- id namespace palsu dan jalur palsu ditolak
- jalur yang dapat dipanggil tidak dapat menargetkan alat yang tidak dideklarasikan
- objek bersarang dan referensi bersama diserialisasi dengan benar
- panggilan namespace dijalankan melalui alat katalog dan mengembalikan detail yang aman untuk JSON
- kegagalan dapat ditangkap oleh kode tamu
- panggilan namespace yang ditangguhkan dilanjutkan melalui `wait`
- pengembalian plugin menghapus pendaftaran namespace miliknya

Namespace melengkapi katalog generik `tools.search`/`tools.call`: gunakan
katalog untuk alat OpenClaw, plugin, dan klien sembarang yang diaktifkan; gunakan `MCP`
untuk alat MCP; gunakan namespace lain untuk API domain terdokumentasi milik plugin
ketika kode ringkas lebih andal daripada pencarian skema berulang.

## API keluaran

- `text(value)` menambahkan keluaran yang dapat dibaca manusia ke array `output`.
- `json(value)` menambahkan item keluaran terstruktur setelah serialisasi
  yang kompatibel dengan JSON.
- Nilai akhir yang dikembalikan kode tamu menjadi `value` dalam hasil `completed`.

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Aturan: urutan keluaran sesuai dengan urutan panggilan tamu; keluaran dibatasi oleh
`maxOutputBytes`; nilai yang tidak dapat diserialisasi dikonversi menjadi string biasa atau
galat; nilai biner tidak didukung. Gambar dan berkas dikirim melalui
alat OpenClaw biasa, bukan melalui jembatan mode kode.

## Katalog alat

Katalog tersembunyi mencakup alat setelah pemfilteran kebijakan efektif, dalam urutan
berikut: alat inti OpenClaw, alat plugin bawaan, alat plugin eksternal, alat MCP,
lalu alat yang disediakan klien untuk eksekusi saat ini.

Id katalog stabil dalam satu eksekusi dan deterministik di antara kumpulan
alat yang setara jika memungkinkan. Bentuk aktual:

```text
<source>:<owner>:<tool-name>
```

dengan `<source>` adalah `openclaw`, `mcp`, atau `client` (alat plugin menggunakan
`openclaw` dengan id plugin sebagai `<owner>`; alat inti menggunakan `openclaw:core:*`).
Contoh:

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

Katalog tidak menyertakan alat kontrol mode kode (`exec`, `wait`, `tool_search_code`,
`tool_search`, `tool_describe`, `tool_call`) dan alat khusus-langsung. Kontrol
tidak boleh melakukan rekursi melalui katalog; alat khusus-langsung tetap terlihat oleh model
karena hasil terstrukturnya tidak dapat melintasi jembatan QuickJS.

Entri MCP tetap berada dalam katalog yang dicakup oleh eksekusi sehingga kebijakan, persetujuan, hook,
telemetri, proyeksi transkrip, dan id alat yang tepat tetap digunakan bersama dengan
eksekusi alat normal. Tampilan `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)`, `tools.callValue(...)`, dan `tools.call(...)` yang ditujukan bagi tamu tidak menyertakan entri MCP. Namespace
`MCP.<server>.<tool>({ ...input })` yang dihasilkan kembali mengarah ke
id katalog yang tepat dan melakukan dispatch melalui jalur eksekutor yang sama.

## Interaksi Pencarian Alat

Mode kode menggantikan permukaan model Pencarian Alat OpenClaw untuk eksekusi yang
mengaktifkannya.

Saat `tools.codeMode.enabled` bernilai true dan mode kode aktif:

- OpenClaw tidak mengekspos `tool_search_code`, `tool_search`, `tool_describe`,
  atau `tool_call` sebagai alat yang terlihat oleh model.
- Gagasan pembuatan katalog yang sama dipindahkan ke dalam runtime tamu.
- Runtime tamu menerima metadata `ALL_TOOLS` yang ringkas serta helper pencarian/deskripsi/
  panggilan untuk alat non-MCP.
- Panggilan MCP menggunakan namespace `MCP` yang dihasilkan dan header `$api()` miliknya,
  alih-alih `tools.call(...)`.
- Panggilan bersarang melakukan dispatch melalui jalur eksekutor OpenClaw yang sama dengan yang digunakan
  Pencarian Alat.

Lihat [Pencarian Alat](/id/tools/tool-search) untuk jembatan katalog ringkas OpenClaw
yang digantikan mode kode untuk eksekusi aktif.

## Nama alat dan tabrakan

Alat `exec` yang terlihat oleh model adalah alat mode kode. Jika alat shell
`exec` OpenClaw normal diaktifkan, alat tersebut disembunyikan dari model dan dimasukkan ke katalog seperti
alat lainnya.

Di dalam runtime tamu:

- `tools.call("openclaw:core:exec", input)` dapat memanggil alat eksekusi shell jika
  kebijakan mengizinkannya.
- `tools.exec(...)` dipasang hanya jika entri katalog eksekusi shell memiliki
  nama aman yang tidak ambigu.
- alat mode kode `exec` tidak pernah tersedia secara rekursif melalui `tools`.

Jika dua alat dinormalisasi menjadi nama praktis aman yang sama, OpenClaw tidak menyertakan
fungsi praktis tersebut dan mewajibkan `tools.call(id, input)`.

## Eksekusi alat bersarang

Setiap panggilan alat bersarang melintasi jembatan host dan masuk kembali ke OpenClaw,
dengan mempertahankan: id agen aktif, id dan kunci sesi, konteks pengirim dan saluran,
kebijakan sandbox, kebijakan persetujuan, hook `before_tool_call` plugin, sinyal
pembatalan, pembaruan streaming jika tersedia, serta peristiwa lintasan/audit.

Panggilan bersarang diproyeksikan ke transkrip sebagai panggilan alat nyata sehingga bundel
dukungan menunjukkan apa yang terjadi, dengan proyeksi yang mengidentifikasi panggilan
alat mode kode induk dan id alat bersarang.

Panggilan bersarang paralel diizinkan hingga `maxPendingToolCalls`.

## Siklus hidup eksekusi dan snapshot

Setiap eksekusi mode kode dilacak dalam map dalam proses dengan kunci `runId` (tidak
dipersistenkan ke disk atau basis data). `exec`/`wait` mengembalikan salah satu dari tiga status
hasil: `completed`, `waiting`, atau `failed`.

- Hasil `waiting` menyimpan snapshot QuickJS, permintaan jembatan yang tertunda, dan
  metadata cakupan (id eksekusi agen, id/kunci sesi) hingga `wait` melanjutkannya atau
  masa berlakunya habis.
- Nilai `runId` yang kedaluwarsa, salah sesi, salah eksekusi, dan tidak dikenal/sedang dilanjutkan
  tidak menghasilkan status terminal yang berbeda; nilai tersebut muncul sebagai
  hasil `failed` (`code: "invalid_input"`) dengan pesan seperti `code mode
run is unavailable or expired.` atau `code mode run belongs to a different
session.`.
- Snapshot suatu eksekusi dihapus dari map segera setelah eksekusi tersebut berakhir sebagai
  `completed` atau `failed`, atau dihapus saat Gateway dimatikan (tidak ada yang
  bertahan setelah dimulai ulang: ini adalah status runtime sementara).
- Untuk pekerjaan hanya-baca, `exec` dapat menetapkan `restartSafe: true`. OpenClaw kemudian menolak
  panggilan katalog yang menimbulkan efek samping dan namespace plugin sebelum eksekusi serta
  menandai hasil yang ditangguhkan sebagai aman untuk diputar ulang. Jika proses dimulai ulang saat `wait`,
  [pemulihan setelah dimulai ulang](/id/gateway/restart-recovery) merekonstruksi giliran dari
  transkrip alih-alih memulihkan snapshot lokal proses. Giliran pemulihan itu sendiri
  tetap dibatasi pada alat inti hanya-baca yang diaudit dan alat plugin yang secara eksplisit
  aman untuk diputar ulang.
- OpenClaw membatasi jumlah eksekusi yang ditangguhkan secara bersamaan per proses (64) dan
  menolak penangguhan baru yang melampaui batas tersebut dengan `too many suspended code mode
runs.`.

Penyimpanan snapshot dibatasi oleh `maxSnapshotBytes` per eksekusi, batas eksekusi
tertangguh per proses di atas, dan `snapshotTtlSeconds`.

## Runtime QuickJS-WASI

OpenClaw memuat `quickjs-wasi` sebagai dependensi langsung dalam paket pemilik; OpenClaw
tidak mengandalkan salinan transitif yang dipasang untuk dependensi yang tidak terkait.

Tanggung jawab runtime: mengompilasi/memuat modul WebAssembly QuickJS-WASI;
membuat satu VM terisolasi per eksekusi atau pelanjutan mode kode; mendaftarkan callback host
dengan nama stabil; menetapkan batas memori dan interupsi; mengevaluasi JavaScript; menguras
pekerjaan tertunda; membuat snapshot status VM yang ditangguhkan; memulihkan snapshot untuk `wait`;
membuang handle VM dan snapshot setelah status terminal.

Runtime dijalankan dalam thread worker Node.js, di luar
perulangan peristiwa utama OpenClaw. Perulangan tak terbatas milik tamu tidak boleh memblokir proses Gateway
tanpa batas; handler interupsi worker menerapkan batas waktu nyata
secara independen dari kerja sama kode tamu.

## TypeScript

Dukungan TypeScript hanya merupakan transformasi sumber: masukan yang diterima adalah satu
string kode TypeScript; keluarannya adalah string JavaScript yang dievaluasi oleh
QuickJS-WASI. Tidak ada pemeriksaan tipe, resolusi modul, maupun
`import`/`require`. Diagnostik dikembalikan sebagai hasil `failed`.

Kompilator TypeScript dimuat secara lazy hanya untuk sel TypeScript; sel
JavaScript biasa dan mode kode yang dinonaktifkan tidak pernah memuatnya.

## Batas keamanan

Kode model bersifat berbahaya. Runtime menggunakan pertahanan berlapis:

- menjalankan QuickJS-WASI di luar perulangan peristiwa utama, dalam thread worker
- memuat `quickjs-wasi` sebagai dependensi langsung, bukan melalui Codex atau
  paket transitif
- tidak ada sistem berkas, jaringan, subproses, impor modul, variabel lingkungan,
  atau objek global host di dalam tamu
- menggunakan batas memori dan interupsi QuickJS serta batas waktu nyata
  proses induk
- menerapkan batas keluaran, snapshot, log, dan panggilan tertunda
- menserialisasi nilai jembatan host melalui adaptor JSON yang sempit
- mengonversi galat host menjadi galat tamu biasa, bukan objek realm host
- menghapus snapshot saat batas waktu terlampaui, dibatalkan, sesi berakhir, atau kedaluwarsa
- menolak akses rekursif ke `exec`, `wait`, dan alat kontrol Pencarian Alat
- mencegah tabrakan nama praktis membayangi helper katalog

Sandbox merupakan salah satu lapisan keamanan; operator mungkin tetap memerlukan
pengerasan tingkat OS untuk penerapan berisiko tinggi.

## Kode galat

```typescript
type CodeModeErrorCode =
  | "invalid_input"
  | "runtime_unavailable"
  | "timeout"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "internal_error";
```

`invalid_input` mencakup argumen `exec`/`wait` yang buruk, bahasa yang dinonaktifkan,
akses modul yang ditolak, kegagalan transformasi TypeScript, nilai `runId` yang tidak dikenal/kedaluwarsa/
salah cakupan, dan terlalu banyak eksekusi yang ditangguhkan. `runtime_unavailable`
mencakup worker QuickJS yang gagal dimulai atau keluar dengan nilai bukan nol.

Galat yang dikembalikan kepada tamu berupa data biasa; instance `Error` host, objek
stack, prototipe, dan fungsi host tidak masuk ke QuickJS.

## Telemetri

Kolom `telemetry` setiap hasil melaporkan: ukuran katalog tersembunyi dan perincian
sumber (jumlah `openclaw`/`mcp`/`client`), jumlah kumulatif pencarian/deskripsi/panggilan
untuk katalog eksekusi, dan nama alat yang terlihat oleh model (`exec`,
`wait`, serta alat khusus-langsung yang dipertahankan).

Telemetri tidak boleh mencakup rahasia, nilai lingkungan mentah, atau masukan
alat yang tidak disunting di luar kebijakan lintasan OpenClaw yang ada.

## Debugging

Gunakan pencatatan log transportasi model yang tertarget saat perilaku mode kode berbeda dari
eksekusi alat normal:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Untuk men-debug bentuk payload, gunakan `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Ini mencatat snapshot JSON permintaan model yang dibatasi dan disunting; gunakan hanya
saat men-debug, karena prompt dan teks pesan masih dapat muncul.

Untuk men-debug stream, gunakan `OPENCLAW_DEBUG_SSE=peek` guna mencatat lima peristiwa SSE
pertama yang telah disunting. Mode kode juga gagal secara tertutup jika payload akhir
penyedia tidak berisi tepat satu `exec`, satu `wait`, dan hanya alat khusus-langsung
yang disetujui setelah permukaan mode kode diaktifkan.

## Tata letak implementasi

- kontrak konfigurasi: `tools.codeMode`
- pembuat katalog: alat efektif menjadi entri ringkas dan peta id
- adaptor permukaan model: mengganti alat yang terlihat dengan alat kontrol/langsung
- adaptor runtime QuickJS-WASI: memuat, mengevaluasi, mengambil snapshot, memulihkan, membuang
- pengawas worker: batas waktu, pembatalan, isolasi crash
- adaptor bridge: callback host yang aman untuk JSON dan pengiriman hasil
- adaptor transformasi TypeScript
- penyimpanan snapshot: TTL, batas ukuran, cakupan proses/sesi
- proyeksi lintasan untuk pemanggilan alat bertingkat
- penghitung telemetri dan diagnostik

Implementasi menggunakan kembali konsep katalog dan eksekutor dari Pencarian Alat, tetapi
tidak menggunakan turunan `node:vm` sebagai sandbox.

## Daftar periksa validasi

Cakupan mode kode harus membuktikan:

- konfigurasi yang dinonaktifkan membiarkan eksposur alat yang ada tidak berubah
- konfigurasi objek tanpa `enabled: true` membiarkan mode kode tetap dinonaktifkan
- konfigurasi yang diaktifkan mengekspos `exec`, `wait`, dan hanya alat khusus-langsung yang diperlukan kepada
  model ketika alat aktif untuk proses tersebut
- proses mentah tanpa alat, `disableTools`, dan daftar izin kosong tidak memicu
  penegakan payload mode kode
- semua alat efektif non-MCP yang memenuhi syarat katalog muncul di `ALL_TOOLS`
- alat khusus-langsung tetap terlihat oleh model dan tidak muncul di `ALL_TOOLS`
- alat yang ditolak tidak muncul di `ALL_TOOLS`
- `tools.search`, `tools.describe`, `tools.callValue`, dan `tools.call` berfungsi untuk alat OpenClaw
- `API.list("mcp")` dan `API.read("mcp/<server>.d.ts")` mengekspos deklarasi MCP
  bergaya TypeScript tanpa pemanggilan bridge/alat
- namespace MCP `$api()` tetap tersedia sebagai fallback inline untuk skema
- pemanggilan namespace MCP berfungsi untuk alat MCP yang terlihat dengan satu input objek, sedangkan
  entri katalog MCP langsung tidak ada di `tools.*`
- alat kontrol Pencarian Alat disembunyikan dari permukaan model maupun
  katalog tersembunyi
- pemanggilan bertingkat mempertahankan perilaku persetujuan dan hook
- shell `exec` disembunyikan dari model tetapi dapat dipanggil berdasarkan id katalog jika
  diizinkan
- `exec` dan `wait` mode kode rekursif tidak dapat dipanggil dari kode guest
- input TypeScript ditransformasi dan dievaluasi tanpa memuat TypeScript pada
  jalur yang dinonaktifkan atau khusus JavaScript
- `import`, `require`, serta akses sistem berkas, jaringan, dan lingkungan gagal
- perulangan tak terbatas mencapai batas waktu dan tidak dapat memblokir Gateway
- kegagalan batas memori menghentikan VM guest
- batas output dan snapshot diberlakukan untuk pemanggilan yang selesai dan ditangguhkan
- `wait` melanjutkan snapshot yang ditangguhkan dan mengembalikan nilai akhir
- nilai `runId` yang kedaluwarsa, dibatalkan, berasal dari sesi yang salah, dan tidak dikenal akan gagal
- pemutaran ulang dan persistensi transkrip mempertahankan pemanggilan kontrol mode kode
- transkrip dan telemetri menampilkan pemanggilan alat bertingkat dengan jelas

## Rencana pengujian E2E

Jalankan ini sebagai pengujian integrasi atau menyeluruh saat mengubah runtime:

1. Mulai Gateway dengan `tools.codeMode.enabled: false`.
2. Kirim giliran agen dengan sekumpulan kecil alat langsung.
3. Pastikan alat yang terlihat oleh model tidak berubah.
4. Mulai ulang dengan `tools.codeMode.enabled: true`.
5. Kirim giliran agen dengan alat pengujian OpenClaw, plugin, MCP, dan klien.
6. Pastikan daftar alat yang terlihat oleh model adalah `exec`, `wait`, ditambah hanya alat
   khusus-langsung yang dikonfigurasi.
7. Di `exec`, baca `ALL_TOOLS` dan pastikan alat pengujian efektif yang memenuhi
   syarat katalog tersedia sedangkan alat khusus-langsung tidak tersedia.
8. Di `exec`, panggil alat OpenClaw/plugin/klien melalui `tools.search`,
   `tools.describe`, dan `tools.callValue` (atau `tools.call` mentah).
9. Di `exec`, panggil `API.list("mcp")` dan `API.read("mcp/<server>.d.ts")`, lalu
   pastikan berkas deklarasi mendeskripsikan alat MCP yang terlihat.
10. Di `exec`, panggil alat MCP melalui `MCP.<server>.<tool>({ ...input })`, lalu
    pastikan entri katalog MCP langsung tidak ada di `ALL_TOOLS` dan
    `tools.*`.
11. Pastikan alat yang ditolak tidak tersedia dan tidak dapat dipanggil dengan id tebakan.
12. Mulai pemanggilan alat bertingkat yang diselesaikan setelah `exec` mengembalikan `waiting`.
13. Panggil `wait` dan pastikan VM yang dipulihkan menerima hasil alat.
14. Pastikan jawaban akhir berisi output yang dihasilkan setelah pemulihan.
15. Pastikan batas waktu, pembatalan, dan kedaluwarsa snapshot membersihkan status runtime.
16. Ekspor lintasan dan pastikan pemanggilan bertingkat terlihat di bawah pemanggilan
    mode kode induk.

Perubahan khusus dokumentasi pada halaman ini tetap harus menjalankan `pnpm check:docs`.

## Terkait

- [Pencarian Alat](/id/tools/tool-search)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Alat Exec](/id/tools/exec)
- [Eksekusi kode](/id/tools/code-execution)
