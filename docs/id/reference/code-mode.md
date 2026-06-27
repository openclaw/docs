---
read_when:
    - Anda ingin mengaktifkan mode kode OpenClaw untuk satu eksekusi agen
    - Anda perlu menjelaskan mengapa mode kode berbeda dari mode Codex Code
    - Anda sedang meninjau kontrak exec/wait, sandbox QuickJS-WASI, transformasi TypeScript, atau jembatan tool-catalog tersembunyi
    - Anda sedang menambahkan atau meninjau integrasi registry namespace mode kode internal
sidebarTitle: Code mode
summary: 'Mode kode OpenClaw: permukaan alat exec/wait opt-in yang didukung oleh QuickJS-WASI dan katalog alat tersembunyi yang tercakup pada run'
title: Mode kode
x-i18n:
    generated_at: "2026-06-27T18:09:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

Mode kode adalah fitur eksperimental runtime agen OpenClaw. Fitur ini nonaktif secara
default. Saat Anda mengaktifkannya, OpenClaw mengubah apa yang dilihat model untuk satu run:
alih-alih mengekspos setiap skema tool yang diaktifkan secara langsung, model hanya melihat
`exec` dan `wait`.

Halaman ini mendokumentasikan mode kode OpenClaw. Ini bukan mode Codex Code. Kedua
fitur memiliki nama yang sama, tetapi diimplementasikan oleh runtime yang berbeda dan mengekspos
kontrak `exec` yang berbeda:

- Codex Code Mode diaktifkan untuk thread app-server Codex kecuali kebijakan tool
  terbatas menonaktifkan mode kode native. Fitur ini berjalan di harness coding Codex,
  tempat model menulis perintah shell melalui kontrak `exec.command`.
- Mode kode OpenClaw dinonaktifkan kecuali `tools.codeMode.enabled: true`
  dikonfigurasi. Fitur ini berjalan di runtime agen generik OpenClaw, tempat model
  menulis program JavaScript atau TypeScript melalui kontrak `exec.code`.

Codex Code Mode dan pencarian tool dinamis native Codex adalah surface harness Codex
yang stabil. Mode kode OpenClaw adalah adapter tool-surface eksperimental milik OpenClaw
untuk run OpenClaw generik. Fitur ini menggunakan `quickjs-wasi`, katalog tool OpenClaw
tersembunyi, dan eksekutor tool OpenClaw normal.

## Apa ini?

Mode kode OpenClaw memungkinkan model menulis program JavaScript atau TypeScript kecil
alih-alih memilih langsung dari daftar tool yang panjang.

Saat mode kode aktif:

- Daftar tool yang terlihat oleh model persis `exec` dan `wait`.
- `exec` mengevaluasi JavaScript atau TypeScript yang dihasilkan model di dalam worker
  QuickJS-WASI yang dibatasi.
- Tool OpenClaw normal disembunyikan dari prompt model dan diekspos di dalam
  program tamu melalui `ALL_TOOLS` dan `tools`.
- Kode tamu dapat mencari katalog tersembunyi, mendeskripsikan tool, dan memanggil tool
  melalui jalur eksekusi OpenClaw yang sama yang digunakan oleh giliran agen normal.
- Tool MCP dikelompokkan di bawah namespace `MCP`. Dalam mode kode, namespace ini
  adalah satu-satunya cara yang didukung untuk memanggil tool MCP.
- `wait` melanjutkan run mode kode yang ditangguhkan saat panggilan tool bersarang masih
  tertunda.

Perbedaan penting: mode kode mengubah surface orkestrasi yang menghadap model.
Fitur ini tidak menggantikan tool OpenClaw, tool Plugin, tool MCP, auth,
kebijakan persetujuan, perilaku channel, atau pemilihan model.

## Mengapa ini bagus?

Mode kode membuat katalog tool besar lebih mudah digunakan oleh model.

- Surface prompt lebih kecil: provider menerima dua tool kontrol alih-alih puluhan
  atau ratusan skema tool lengkap.
- Orkestrasi yang lebih baik: model dapat menggunakan loop, join, transformasi kecil,
  logika bersyarat, dan panggilan tool bersarang paralel di dalam satu sel kode.
- Netral provider: fitur ini bekerja untuk OpenClaw, Plugin, MCP, dan tool klien tanpa
  bergantung pada eksekusi kode native provider.
- Kebijakan yang ada tetap berlaku: panggilan tool bersarang tetap melewati kebijakan,
  persetujuan, hook, konteks sesi, dan jalur audit OpenClaw.
- Mode kegagalan jelas: saat mode kode diaktifkan secara eksplisit dan runtime tidak
  tersedia, OpenClaw gagal tertutup alih-alih fallback ke eksposur tool langsung yang luas.

Mode kode sangat berguna untuk agen dengan katalog tool aktif yang besar atau
untuk workflow ketika model berulang kali perlu mencari, menggabungkan, dan memanggil
tool sebelum menghasilkan jawaban.

## Cara mengaktifkannya

Tambahkan `tools.codeMode.enabled: true` ke config agen atau runtime:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Bentuk singkat juga diterima:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

Mode kode tetap nonaktif saat `tools.codeMode` dihilangkan, `false`, atau berupa objek
tanpa `enabled: true`.

Saat Anda menggunakan agen tersandbox dengan server MCP yang dikonfigurasi, pastikan juga
kebijakan tool sandbox mengizinkan Plugin MCP bawaan, misalnya dengan
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Lihat
[Konfigurasi - tool dan provider kustom](/id/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Gunakan batas eksplisit saat Anda menginginkan batas yang lebih ketat:

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

Untuk mengonfirmasi bentuk payload model saat debugging, jalankan Gateway dengan
logging tertarget:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Dengan mode kode aktif, nama tool yang menghadap model dalam log seharusnya `exec` dan
`wait`. Jika Anda memerlukan payload provider yang telah disunting, tambahkan
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` untuk sesi debugging singkat.

## Tur teknis

Sisa halaman ini menjelaskan kontrak runtime dan detail implementasi.
Ini ditujukan untuk maintainer, penulis Plugin yang men-debug eksposur tool, dan
operator yang memvalidasi deployment berisiko tinggi.

## Status runtime

- Runtime: [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi).
- Status default: dinonaktifkan.
- Stabilitas: surface OpenClaw eksperimental; mode Codex Code adalah surface harness Codex
  stabil yang terpisah.
- Surface target: run agen OpenClaw generik.
- Postur keamanan: kode model bersifat hostile.
- Janji yang menghadap pengguna: mengaktifkan mode kode tidak pernah diam-diam fallback ke
  eksposur tool langsung yang luas.

## Cakupan

Mode kode memiliki bentuk orkestrasi yang menghadap model untuk run yang sudah disiapkan. Fitur ini
tidak memiliki pemilihan model, perilaku channel, auth, kebijakan tool, atau implementasi
tool.

Dalam cakupan:

- definisi tool `exec` dan `wait` yang terlihat oleh model
- konstruksi katalog tool tersembunyi
- eksekusi tamu JavaScript dan TypeScript
- runtime worker QuickJS-WASI
- callback host untuk pencarian katalog, deskripsi skema, dan panggilan tool
- state yang dapat dilanjutkan untuk program tamu yang ditangguhkan
- batas output, timeout, memori, panggilan tertunda, dan snapshot
- telemetri dan proyeksi trajectory untuk panggilan tool bersarang

Di luar cakupan:

- eksekusi kode jarak jauh native provider
- semantik eksekusi shell
- mengubah otorisasi tool yang ada
- skrip persisten yang ditulis pengguna
- akses package manager, file, jaringan, atau modul dalam kode tamu
- penggunaan ulang langsung internal mode Codex Code

Tool milik provider seperti sandbox Python jarak jauh tetap menjadi tool terpisah. Lihat
[Eksekusi kode](/id/tools/code-execution).

## Istilah

**Mode kode** adalah mode runtime OpenClaw yang menyembunyikan tool model normal dan
hanya mengekspos `exec` dan `wait`.

**Runtime tamu** adalah VM JavaScript QuickJS-WASI yang mengevaluasi kode model.

**Bridge host** adalah surface callback sempit yang kompatibel JSON dari kode tamu
kembali ke OpenClaw.

**Katalog** adalah daftar tool efektif berskop run setelah kebijakan tool normal,
resolusi Plugin, MCP, dan tool klien.

**Panggilan tool bersarang** adalah panggilan tool yang dibuat dari kode tamu melalui bridge host.

**Snapshot** adalah state VM QuickJS-WASI yang diserialisasi dan disimpan agar `wait` dapat melanjutkan
run mode kode yang ditangguhkan.

## Konfigurasi

`tools.codeMode.enabled` adalah gerbang aktivasi. Mengatur field mode kode lain
tidak mengaktifkan fitur ini.

Field yang didukung:

- `enabled`: boolean. Default `false`. Mengaktifkan mode kode hanya saat `true`.
- `runtime`: `"quickjs-wasi"`. Satu-satunya runtime yang didukung.
- `mode`: `"only"`. Mengekspos `exec` dan `wait`, menyembunyikan tool model normal.
- `languages`: array berisi `"javascript"` dan `"typescript"`. Default mencakup
  keduanya.
- `timeoutMs`: batas wall-clock untuk satu `exec` atau `wait`. Default `10000`.
  Clamp runtime: `100` hingga `60000`.
- `memoryLimitBytes`: batas heap QuickJS. Default `67108864`. Clamp runtime:
  `1048576` hingga `1073741824`.
- `maxOutputBytes`: batas untuk teks, JSON, dan log yang dikembalikan. Default `65536`.
  Clamp runtime: `1024` hingga `10485760`.
- `maxSnapshotBytes`: batas untuk snapshot VM yang diserialisasi. Default `10485760`.
  Clamp runtime: `1024` hingga `268435456`.
- `maxPendingToolCalls`: batas untuk panggilan tool bersarang konkuren. Default `16`.
  Clamp runtime: `1` hingga `128`.
- `snapshotTtlSeconds`: berapa lama VM yang ditangguhkan dapat dilanjutkan. Default `900`.
  Clamp runtime: `1` hingga `86400`.
- `searchDefaultLimit`: jumlah hasil pencarian katalog tersembunyi default. Default `8`.
  Runtime meng-clamp ini ke `maxSearchLimit`.
- `maxSearchLimit`: jumlah maksimum hasil pencarian katalog tersembunyi. Default `50`.
  Clamp runtime: `1` hingga `50`.

Jika mode kode diaktifkan tetapi QuickJS-WASI tidak dapat dimuat, OpenClaw gagal tertutup untuk
run tersebut. OpenClaw tidak diam-diam mengekspos tool normal sebagai fallback.

## Aktivasi

Mode kode dievaluasi setelah kebijakan tool efektif diketahui dan sebelum
permintaan model final disusun.

Urutan aktivasi:

1. Resolve agen, model, provider, sandbox, channel, pengirim, dan kebijakan run.
2. Bangun daftar tool OpenClaw efektif.
3. Tambahkan tool Plugin, MCP, dan klien yang memenuhi syarat.
4. Terapkan kebijakan allow dan deny.
5. Jika `tools.codeMode.enabled` false, lanjutkan dengan eksposur tool normal.
6. Jika diaktifkan dan tool aktif untuk run, daftarkan tool efektif dalam
   katalog mode kode.
7. Hapus semua tool normal dari daftar tool yang terlihat oleh model.
8. Tambahkan `exec` dan `wait` mode kode.

Run yang sengaja tidak memiliki tool, seperti panggilan model mentah, `disableTools`,
atau allowlist kosong, tidak mengaktifkan surface mode kode walaupun config
berisi `tools.codeMode.enabled: true`.

Katalog mode kode berskop run. Katalog ini tidak boleh membocorkan tool dari agen,
sesi, pengirim, atau run lain.

## Tool yang terlihat oleh model

Saat mode kode aktif, model melihat persis tool tingkat atas berikut:

- `exec`
- `wait`

Semua tool lain yang diaktifkan disembunyikan dari daftar tool yang menghadap model dan didaftarkan
dalam katalog mode kode.

Model sebaiknya menggunakan `exec` untuk orkestrasi tool, penggabungan data, loop,
panggilan bersarang paralel, dan transformasi terstruktur. Model sebaiknya menggunakan
`wait` hanya saat `exec` mengembalikan hasil `waiting` yang dapat dilanjutkan.

## `exec`

`exec` memulai sel mode kode dan mengembalikan satu hasil. Kode input dihasilkan model
dan harus diperlakukan sebagai hostile.

Input:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Aturan input:

- Salah satu dari `code` atau `command` harus tidak kosong.
- `code` adalah field terdokumentasi yang menghadap model.
- `command` diterima sebagai alias yang kompatibel dengan exec untuk kebijakan hook dan
  rewrite tepercaya; saat keduanya ada, nilainya harus cocok.
- Event hook `exec` mode kode luar menyertakan `toolKind: "code_mode_exec"` dan
  menyertakan `toolInputKind: "javascript" | "typescript"` saat bahasa input
  diketahui, sehingga kebijakan dapat membedakan sel mode kode dari panggilan `exec`
  bergaya shell yang berbagi nama tool yang sama.
- `language` default ke `"javascript"`.
- Jika `language` adalah `"typescript"`, OpenClaw mentranspilasi sebelum evaluasi.
- `exec` menolak `import`, `require`, import dinamis, dan pola module-loader
  di v1.
- `exec` tidak mengekspos implementasi `exec` shell normal secara rekursif.

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

`exec` mengembalikan `waiting` saat VM QuickJS ditangguhkan dengan state yang dapat dilanjutkan yang
masih memerlukan kelanjutan yang terlihat oleh model. Hasilnya menyertakan `runId` untuk
`wait`. Panggilan bridge namespace, termasuk panggilan namespace MCP, dikuras otomatis
di dalam panggilan `exec`/`wait` yang sama selama siap, sehingga blok kode yang ringkas
dapat memeriksa `$api()` dan memanggil tool MCP tanpa memaksa satu panggilan tool model per
await namespace.

`exec` mengembalikan `completed` hanya ketika VM tamu tidak memiliki pekerjaan tertunda dan nilai akhir kompatibel dengan JSON setelah adapter output OpenClaw berjalan.

## `wait`

`wait` melanjutkan VM mode kode yang ditangguhkan.

Input:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

Output-nya adalah union `CodeModeResult` yang sama seperti yang dikembalikan oleh `exec`.

`wait` ada karena alat OpenClaw bertingkat dapat lambat, interaktif, dibatasi persetujuan, atau mengalirkan pembaruan parsial. Model tidak perlu mempertahankan satu panggilan `exec` yang panjang terbuka sementara host menunggu pekerjaan eksternal.

Snapshot dan pemulihan QuickJS-WASI adalah mekanisme lanjutkan v1:

1. `exec` mengevaluasi kode hingga selesai, gagal, atau ditangguhkan.
2. Saat penangguhan, OpenClaw mengambil snapshot VM QuickJS dan mencatat pekerjaan host yang tertunda.
3. Ketika pekerjaan tertunda selesai, `wait` memulihkan snapshot VM.
4. OpenClaw mendaftarkan ulang callback host dengan nama stabil.
5. OpenClaw mengirimkan hasil alat bertingkat ke VM yang dipulihkan.
6. OpenClaw menguras pekerjaan QuickJS yang tertunda.
7. `wait` mengembalikan hasil `completed`, `failed`, atau `waiting` lainnya.

Snapshot adalah status runtime, bukan artefak pengguna. Snapshot dibatasi ukuran, kedaluwarsa, dan dicakup ke run serta sesi yang membuatnya.

`wait` gagal ketika:

- `runId` tidak dikenal.
- snapshot kedaluwarsa.
- run atau sesi induk dibatalkan.
- pemanggil tidak berada dalam cakupan run/sesi yang sama.
- pemulihan QuickJS-WASI gagal.
- pemulihan akan melampaui batas yang dikonfigurasi.

## API runtime tamu

Runtime tamu mengekspos API global kecil:

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` adalah metadata ringkas untuk katalog bercakupan run. Secara default, ini tidak berisi skema lengkap.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "plugin" | "mcp" | "client";
  sourceName?: string;
};
```

Skema lengkap hanya dimuat sesuai permintaan:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

Helper katalog:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Fungsi alat praktis hanya dipasang untuk nama aman yang tidak ambigu:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

Entri katalog MCP tidak dapat dipanggil melalui `tools.call(...)` atau fungsi praktis dalam mode kode. Entri tersebut hanya diekspos melalui namespace `MCP` yang dihasilkan. File deklarasi bergaya TypeScript tersedia melalui permukaan file virtual `API` hanya-baca, sehingga agen dapat memeriksa tanda tangan MCP tanpa menambahkan skema MCP ke prompt:

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

`API.read("mcp/<server>.d.ts")` mengembalikan deklarasi ringkas yang disimpulkan dari metadata alat MCP:

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

File deklarasi bersifat virtual, bukan file yang ditulis di bawah workspace atau direktori status. Untuk setiap panggilan `exec` mode kode, OpenClaw membangun katalog alat bercakupan run, mempertahankan entri MCP yang terlihat, merender `mcp/index.d.ts` ditambah satu deklarasi `mcp/<server>.d.ts` per server yang terlihat, dan menyuntikkan tabel kecil hanya-baca itu ke worker QuickJS. Kode tamu hanya melihat objek `API`: `API.list(prefix?)` mengembalikan metadata file dan `API.read(path)` mengembalikan konten deklarasi yang dipilih. Jalur yang tidak dikenal serta segmen `.` / `..` ditolak.

Ini menjaga skema MCP besar tetap di luar prompt model. Agen mengetahui bahwa API virtual ada dari deskripsi alat `exec`, hanya membaca file deklarasi yang diperlukan, lalu memanggil `MCP.<server>.<tool>()` dengan satu argumen objek. `MCP.<server>.$api()` tetap tersedia sebagai fallback inline ketika agen memerlukan respons skema satu alat di dalam program.

Runtime tamu tidak boleh mengekspos objek host secara langsung. Input dan output melintasi bridge sebagai nilai yang kompatibel dengan JSON dengan batas ukuran eksplisit.

## Namespace internal

Namespace internal memberi mode kode API domain yang ringkas tanpa menambahkan lebih banyak alat yang terlihat oleh model. Integrasi milik loader dapat mendaftarkan namespace seperti `Issues`, `Fictions`, atau `Calendar`; kode tamu kemudian memanggil namespace tersebut di dalam program QuickJS sementara OpenClaw tetap hanya menampilkan `exec` dan `wait` kepada model.

Namespace bersifat internal untuk saat ini. Tidak ada API namespace SDK Plugin publik: namespace plugin eksternal memerlukan kontrak milik loader agar identitas plugin, manifes terpasang, status autentikasi, dan deskriptor katalog cache tidak menyimpang dari alat plugin yang mendukung namespace. Mode kode inti hanya memiliki sandbox, serialisasi, gating katalog, dan pengiriman bridge.

Kode tamu kemudian dapat menggunakan global langsung atau peta `namespaces`:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Siklus hidup registry

Registry namespace bersifat lokal proses dan dikunci berdasarkan id namespace. Run umum mengikuti jalur ini:

1. Loader tepercaya memanggil `registerCodeModeNamespaceForPlugin(pluginId, registration)`.
2. Mode kode membuat `ToolSearchRuntime` tersembunyi untuk run dan membaca katalog bercakupan run-nya.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` hanya mempertahankan pendaftaran yang semua `requiredToolNames`-nya terlihat dan dimiliki oleh `pluginId` yang sama.
4. Setiap namespace yang terlihat memanggil `createScope(ctx)` untuk run saat ini. Scope menerima konteks run seperti `agentId`, `sessionKey`, `sessionId`, `runId`, config, dan status abort.
5. Data scope diserialisasi menjadi deskriptor polos dan disuntikkan ke QuickJS sebagai global langsung dan `namespaces.<globalName>`.
6. Panggilan tamu ditangguhkan melalui bridge worker, menyelesaikan jalur namespace pada host, memetakan panggilan ke alat katalog milik plugin yang dideklarasikan, dan mengeksekusi alat tersebut melalui `ToolSearchRuntime.call`.
7. OpenClaw otomatis menguras panggilan bridge namespace yang siap di dalam panggilan alat `exec`/`wait` aktif. Jika pekerjaan namespace masih tertunda saat timeout atau tamu secara eksplisit yield, `wait` melanjutkan runtime namespace yang sama nanti.
8. Rollback atau pencopotan plugin memanggil `clearCodeModeNamespacesForPlugin(pluginId)` sehingga global usang tidak bertahan dari pemuatan plugin yang gagal.

Invarian penting: panggilan namespace adalah panggilan alat katalog. Panggilan tersebut menggunakan hook kebijakan, persetujuan, penanganan abort, telemetri, proyeksi transkrip, dan perilaku tunda/lanjutkan yang sama seperti `tools.call(...)`.

### Bentuk pendaftaran

Daftarkan namespace dari integrasi yang memiliki alat pendukung. Jaga scope tetap kecil dan hanya ekspos verba domain yang memetakan ke alat katalog yang dideklarasikan.

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

`createCodeModeNamespaceTool(toolName, inputMapper)` menandai anggota scope sebagai fungsi namespace yang dapat dipanggil. `inputMapper` opsional menerima argumen tamu dan mengembalikan objek input untuk alat katalog pendukung. Tanpa mapper input, argumen tamu pertama digunakan, atau `{}` ketika dihilangkan.

Fungsi host mentah ditolak sebelum kode tamu berjalan:

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### Kepemilikan dan visibilitas

Kepemilikan namespace terikat ke `pluginId` milik pemanggil pendaftaran. `requiredToolNames` adalah gate visibilitas sekaligus pemeriksaan kepemilikan:

- setiap alat wajib harus ada dalam katalog run
- setiap alat wajib harus memiliki `sourceName === pluginId`
- namespace disembunyikan ketika ada alat wajib yang tidak ada atau dimiliki oleh plugin lain
- setiap jalur yang dapat dipanggil hanya boleh menargetkan alat yang disebutkan dalam `requiredToolNames`

Ini mencegah plugin lain mengekspos namespace dengan mendaftarkan alat bernama sama. Ini juga menjaga namespace tetap selaras dengan kebijakan agen biasa: jika run tidak dapat melihat alat pendukung, run tidak dapat melihat namespace.

Misalnya, namespace GitHub sebaiknya berada di balik ekstensi milik GitHub yang memiliki autentikasi GitHub, klien REST atau GraphQL, batas laju, persetujuan tulis, dan pengujian. Mode kode inti tidak boleh menyematkan API khusus GitHub, penanganan token, atau kebijakan penyedia.

### Aturan serialisasi scope

`createScope(ctx)` dapat mengembalikan objek polos yang berisi nilai kompatibel JSON, array, objek bertingkat, dan penanda panggilan `createCodeModeNamespaceTool(...)`. Objek host tidak pernah masuk ke QuickJS secara langsung.

Serializer menolak:

- fungsi mentah
- grafik objek sirkular
- segmen jalur tidak aman: `__proto__`, `constructor`, `prototype`, kunci kosong, atau kunci yang berisi pemisah jalur internal
- nilai `globalName` yang bukan identifier JavaScript
- tabrakan `globalName` dengan global mode kode bawaan seperti `tools`, `namespaces`, `text`, `json`, `yield_control`, atau `__openclaw*`

Nilai yang tidak dapat diserialisasi ke JSON dikonversi menjadi nilai fallback aman JSON sebelum melintasi bridge. Data biner, handle, soket, klien, dan instance kelas sebaiknya tetap berada di balik alat katalog biasa.

### Prompt

`description` namespace dan `prompt` opsional ditambahkan ke skema `exec` yang terlihat oleh model hanya ketika namespace terlihat untuk run tersebut. Gunakan keduanya untuk mengajarkan permukaan berguna terkecil:

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

Jaga prompt tetap tentang kontrak namespace, bukan penyiapan autentikasi, riwayat implementasi, atau perilaku plugin yang tidak terkait.

### Pembersihan

Namespace adalah registrasi lokal proses. Hapus saat Plugin pemiliknya
dinonaktifkan, dihapus instalasinya, atau di-rollback:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

Pembersihan mode kode dimiliki oleh Plugin; hapus registrasi namespace Plugin
saat siklus hidupnya berakhir alih-alih mempertahankan handle teardown per namespace. Pengujian
dapat memanggil `clearCodeModeNamespacesForTest()` untuk menghindari kebocoran registrasi
antar kasus.

### Daftar periksa pengujian

Perubahan namespace harus mencakup batas keamanan dan perilaku tamu:

- teks prompt namespace hanya muncul saat alat pendukung terlihat
- alat bernama sama dari `sourceName` lain tidak mengekspos namespace
- fungsi scope mentah ditolak
- id namespace palsu dan path palsu ditolak
- path yang dapat dipanggil tidak dapat menargetkan alat yang tidak dideklarasikan
- objek bersarang dan referensi bersama diserialisasi dengan benar
- panggilan namespace dieksekusi melalui alat katalog dan mengembalikan detail yang aman untuk JSON
- kegagalan dapat ditangkap oleh kode tamu
- panggilan namespace yang ditangguhkan dilanjutkan melalui `wait`
- rollback Plugin menghapus registrasi namespace pemilik

Namespace melengkapi katalog generik `tools.search` / `tools.call`. Gunakan
katalog untuk alat OpenClaw, Plugin, dan klien arbitrer yang diaktifkan; gunakan `MCP` untuk
alat MCP; gunakan namespace lain untuk API domain terdokumentasi milik Plugin ketika
kode ringkas lebih andal daripada lookup skema berulang.

## API output

`text(value)` menambahkan output yang dapat dibaca manusia ke array `output`.

`json(value)` menambahkan item output terstruktur setelah serialisasi yang kompatibel
dengan JSON.

Nilai akhir yang dikembalikan oleh kode tamu menjadi `value` dalam hasil `completed`.

Item output:

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Aturan output:

- urutan output cocok dengan panggilan tamu
- output dibatasi oleh `maxOutputBytes`
- nilai yang tidak dapat diserialisasi dikonversi menjadi string biasa atau error
- nilai biner tidak didukung di v1
- gambar dan file melewati alat OpenClaw biasa, bukan melalui
  bridge mode kode

## Katalog alat

Katalog tersembunyi menyertakan alat setelah pemfilteran kebijakan efektif:

1. Alat inti OpenClaw.
2. Alat Plugin bawaan.
3. Alat Plugin eksternal.
4. Alat MCP.
5. Alat yang disediakan klien untuk run saat ini.

Id katalog stabil dalam satu run dan deterministik di antara set alat yang ekuivalen
jika memungkinkan.

Bentuk id yang direkomendasikan:

```text
<source>:<owner>:<tool-name>
```

Contoh:

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

Katalog menghilangkan alat kontrol mode kode:

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

Ini mencegah rekursi dan menjaga kontrak yang terlihat model tetap sempit.

Entri MCP tetap berada dalam katalog berscope run sehingga kebijakan, persetujuan, hook,
telemetri, proyeksi transkrip, dan id alat persis tetap dibagikan dengan eksekusi
alat normal. Tampilan yang menghadap tamu `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)`, dan `tools.call(...)` menghilangkan entri MCP. Namespace
`MCP.<server>.<tool>({ ...input })` yang dihasilkan di-resolve kembali ke
id katalog persis lalu dikirim melalui path executor yang sama.

## Interaksi Tool Search

Mode kode menggantikan permukaan model OpenClaw Tool Search untuk run saat aktif.

Saat `tools.codeMode.enabled` bernilai true dan mode kode aktif:

- OpenClaw tidak mengekspos `tool_search_code`, `tool_search`, `tool_describe`,
  atau `tool_call` sebagai alat yang terlihat model.
- Ide pengatalogan yang sama berpindah ke dalam runtime tamu.
- Runtime tamu menerima metadata `ALL_TOOLS` yang ringkas serta helper pencarian, deskripsi,
  dan panggilan untuk alat non-MCP.
- Panggilan MCP menggunakan namespace `MCP` yang dihasilkan dan header `$api()`-nya
  alih-alih `tools.call(...)`.
- Panggilan bersarang dikirim melalui path executor OpenClaw yang sama dengan yang digunakan Tool Search.

Halaman [Tool Search](/id/tools/tool-search) yang sudah ada menjelaskan bridge katalog ringkas
OpenClaw. Mode kode adalah alternatif OpenClaw generik untuk run yang dapat
menggunakan `exec` dan `wait`.

## Nama alat dan tabrakan

Alat `exec` yang terlihat model adalah alat mode kode. Jika alat shell OpenClaw
normal `exec` diaktifkan, alat itu disembunyikan dari model dan dikatalogkan seperti
alat lainnya.

Di dalam runtime tamu:

- `tools.call("openclaw:core:exec", input)` dapat memanggil alat shell exec jika
  kebijakan mengizinkannya.
- `tools.exec(...)` hanya dipasang jika entri katalog shell exec memiliki nama aman
  yang tidak ambigu.
- alat mode kode `exec` tidak pernah tersedia secara rekursif melalui `tools`.

Jika dua alat dinormalisasi ke nama kemudahan aman yang sama, OpenClaw menghilangkan
fungsi kemudahan dan mewajibkan `tools.call(id, input)`.

## Eksekusi alat bersarang

Setiap panggilan alat bersarang melintasi bridge host dan masuk kembali ke OpenClaw.

Eksekusi bersarang mempertahankan:

- id agen aktif
- id sesi dan kunci sesi
- konteks pengirim dan channel
- kebijakan sandbox
- kebijakan persetujuan
- hook Plugin `before_tool_call`
- sinyal abort
- pembaruan streaming jika tersedia
- event trajectory dan audit

Panggilan bersarang diproyeksikan ke transkrip sebagai panggilan alat nyata sehingga bundle dukungan
dapat menunjukkan apa yang terjadi. Proyeksi mengidentifikasi panggilan alat mode kode induk
dan id alat bersarang.

Panggilan bersarang paralel diizinkan hingga `maxPendingToolCalls`.

## State runtime

Setiap run mode kode memiliki mesin state:

- `running`: VM sedang mengeksekusi atau panggilan bersarang sedang berjalan.
- `waiting`: snapshot VM ada dan dapat dilanjutkan dengan `wait`.
- `completed`: nilai akhir dikembalikan; snapshot dihapus.
- `failed`: error dikembalikan; snapshot dihapus.
- `expired`: snapshot atau state tertunda melampaui retensi; tidak dapat dilanjutkan.
- `aborted`: run/sesi induk dibatalkan; snapshot dihapus.

State diberi scope oleh run agen, sesi, dan id panggilan alat. Panggilan `wait` dari
run atau sesi berbeda gagal.

Penyimpanan snapshot dibatasi:

- byte snapshot maksimum per run
- snapshot live maksimum per proses
- TTL snapshot
- pembersihan saat run berakhir
- pembersihan saat Gateway dimatikan jika persistensi tidak didukung

## Runtime QuickJS-WASI

OpenClaw memuat `quickjs-wasi` sebagai dependensi langsung dalam paket pemilik. Runtime
tidak bergantung pada salinan transitif yang dipasang untuk proxy, PAC, atau dependensi
tidak terkait lainnya.

Tanggung jawab runtime:

- mengompilasi atau memuat modul WebAssembly QuickJS-WASI
- membuat satu VM terisolasi per run mode kode atau resume
- mendaftarkan callback host dengan nama stabil
- mengatur batas memori dan interupsi
- mengevaluasi JavaScript
- menguras job tertunda
- membuat snapshot state VM yang ditangguhkan
- memulihkan snapshot untuk `wait`
- membuang handle VM dan snapshot setelah state terminal

Runtime mengeksekusi di luar event loop utama OpenClaw dalam worker. Loop tak terbatas
tamu tidak boleh memblokir proses Gateway tanpa batas.

## TypeScript

Dukungan TypeScript hanya berupa transformasi sumber:

- input yang diterima: satu string kode TypeScript
- output: string JavaScript yang dievaluasi oleh QuickJS-WASI
- tanpa typechecking
- tanpa resolusi modul
- tanpa `import` atau `require` di v1
- diagnostik dikembalikan sebagai hasil `failed`

Kompiler TypeScript dimuat secara malas hanya untuk sel TypeScript. Sel
JavaScript biasa dan mode kode yang dinonaktifkan tidak memuat kompiler.

Transformasi harus mempertahankan nomor baris yang berguna jika memungkinkan.

## Batas keamanan

Kode model bersifat hostile. Runtime menggunakan defense in depth:

- menjalankan QuickJS-WASI di luar event loop utama
- memuat `quickjs-wasi` sebagai dependensi langsung, bukan melalui Codex atau paket
  transitif
- tidak ada filesystem, jaringan, subprocess, impor modul, variabel lingkungan, atau
  objek global host di tamu
- menggunakan batas memori dan interupsi QuickJS
- menegakkan timeout wall-clock proses induk
- menegakkan batas output, snapshot, log, dan panggilan tertunda
- menserialisasi nilai bridge host melalui adapter JSON sempit
- mengonversi error host menjadi error tamu biasa, tidak pernah objek realm host
- membuang snapshot saat timeout, abort, sesi berakhir, atau kedaluwarsa
- menolak akses rekursif ke `exec`, `wait`, dan alat kontrol Tool Search
- mencegah tabrakan nama kemudahan menutupi helper katalog

Sandbox adalah satu lapisan keamanan. Operator tetap dapat memerlukan hardening tingkat OS
untuk deployment berisiko tinggi.

## Kode error

```typescript
type CodeModeErrorCode =
  | "runtime_unavailable"
  | "invalid_config"
  | "invalid_input"
  | "unsupported_language"
  | "typescript_transform_failed"
  | "module_access_denied"
  | "timeout"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "snapshot_expired"
  | "snapshot_restore_failed"
  | "too_many_pending_tool_calls"
  | "nested_tool_failed"
  | "aborted"
  | "internal_error";
```

Error yang dikembalikan kepada tamu adalah data biasa. Instance `Error` host, objek stack,
prototipe, dan fungsi host tidak menyeberang ke QuickJS.

## Telemetri

Mode kode melaporkan:

- nama alat terlihat yang dikirim ke model
- ukuran katalog tersembunyi dan rincian sumber
- jumlah `exec` dan `wait`
- jumlah pencarian, deskripsi, dan panggilan bersarang
- id alat bersarang yang dipanggil
- kegagalan batas timeout, memori, snapshot, dan output
- event siklus hidup snapshot

Telemetri tidak boleh menyertakan secret, nilai lingkungan mentah, atau input alat tanpa redaksi
di luar kebijakan trajectory OpenClaw yang sudah ada.

## Debugging

Gunakan logging transport model yang ditargetkan saat mode kode berperilaku berbeda dari
run alat normal:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Untuk debugging bentuk payload, gunakan `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Ini mencatat snapshot JSON permintaan model yang dibatasi dan diredaksi; ini hanya boleh
digunakan saat debugging karena prompt dan teks pesan masih dapat muncul.

Untuk debugging stream, gunakan `OPENCLAW_DEBUG_SSE=peek` untuk mencatat lima event SSE
teredaksi pertama. Mode kode juga fail closed jika payload provider akhir
tidak berisi tepat `exec` dan `wait` setelah permukaan mode kode
diaktifkan.

## Tata letak implementasi

Unit implementasi:

- kontrak config: `tools.codeMode`
- pembuat katalog: alat efektif menjadi entri ringkas dan peta id
- adapter permukaan model: mengganti alat terlihat dengan `exec` dan `wait`
- adapter runtime QuickJS-WASI: load, eval, snapshot, restore, dispose
- supervisor worker: timeout, abort, isolasi crash
- adapter bridge: callback host yang aman untuk JSON dan pengiriman hasil
- adapter transformasi TypeScript
- penyimpanan snapshot: TTL, batas ukuran, scope run/sesi
- proyeksi trajectory untuk panggilan alat bersarang
- penghitung telemetri dan diagnostik

Implementasi menggunakan kembali konsep katalog dan executor dari Tool Search, tetapi
tidak menggunakan child `node:vm` sebagai sandbox.

## Daftar periksa validasi

Cakupan mode kode harus membuktikan:

- konfigurasi yang dinonaktifkan membiarkan eksposur tool yang ada tetap tidak berubah
- konfigurasi objek tanpa `enabled: true` membiarkan mode kode tetap dinonaktifkan
- konfigurasi yang diaktifkan hanya mengekspos `exec` dan `wait` ke model ketika tool
  aktif untuk proses berjalan tersebut
- proses berjalan mentah tanpa tool, `disableTools`, dan allowlist kosong tidak memicu
  penegakan payload mode kode
- semua tool non-MCP yang efektif muncul di `ALL_TOOLS`
- tool yang ditolak tidak muncul di `ALL_TOOLS`
- `tools.search`, `tools.describe`, dan `tools.call` berfungsi untuk tool OpenClaw
- `API.list("mcp")` dan `API.read("mcp/<server>.d.ts")` mengekspos deklarasi MCP bergaya
  TypeScript tanpa panggilan bridge/tool
- namespace MCP `$api()` tetap tersedia sebagai fallback sebaris untuk skema
- panggilan namespace MCP berfungsi untuk tool MCP yang terlihat dengan satu input objek, sementara
  entri katalog MCP langsung tidak ada dari `tools.*`
- tool kontrol Tool Search disembunyikan dari permukaan model maupun katalog tersembunyi
- panggilan bertingkat mempertahankan perilaku persetujuan dan hook
- shell `exec` disembunyikan dari model tetapi dapat dipanggil berdasarkan id katalog saat diizinkan
- `exec` dan `wait` mode kode rekursif tidak dapat dipanggil dari kode tamu
- input TypeScript ditransformasikan dan dievaluasi tanpa memuat TypeScript pada
  jalur yang dinonaktifkan atau khusus JavaScript
- akses `import`, `require`, sistem berkas, jaringan, dan lingkungan gagal
- loop tak terbatas mengalami timeout dan tidak dapat memblokir Gateway
- kegagalan batas memori menghentikan VM tamu
- batas output dan snapshot diberlakukan untuk panggilan yang selesai dan ditangguhkan
- `wait` melanjutkan snapshot yang ditangguhkan dan mengembalikan nilai akhir
- nilai `runId` yang kedaluwarsa, dibatalkan, salah sesi, dan tidak dikenal gagal
- pemutaran ulang dan persistensi transkrip mempertahankan panggilan kontrol mode kode
- transkrip dan telemetri menampilkan panggilan tool bertingkat dengan jelas

## Rencana pengujian E2E

Jalankan ini sebagai pengujian integrasi atau end-to-end saat mengubah runtime:

1. Mulai Gateway dengan `tools.codeMode.enabled: false`.
2. Kirim satu giliran agen dengan set tool langsung yang kecil.
3. Pastikan tool yang terlihat oleh model tidak berubah.
4. Mulai ulang dengan `tools.codeMode.enabled: true`.
5. Kirim satu giliran agen dengan OpenClaw, plugin, MCP, dan tool uji klien.
6. Pastikan daftar tool yang terlihat oleh model persis `exec`, `wait`.
7. Di `exec`, baca `ALL_TOOLS` dan pastikan tool uji efektif ada.
8. Di `exec`, panggil tool OpenClaw/plugin/klien melalui `tools.search`,
   `tools.describe`, dan `tools.call`.
9. Di `exec`, panggil `API.list("mcp")` dan `API.read("mcp/<server>.d.ts")` dan
   pastikan file deklarasi mendeskripsikan tool MCP yang terlihat.
10. Di `exec`, panggil tool MCP melalui `MCP.<server>.<tool>({ ...input })` dan
    pastikan entri katalog MCP langsung tidak ada dari `ALL_TOOLS` dan `tools.*`.
11. Pastikan tool yang ditolak tidak ada dan tidak dapat dipanggil dengan id yang ditebak.
12. Mulai panggilan tool bertingkat yang diselesaikan setelah `exec` mengembalikan `waiting`.
13. Panggil `wait` dan pastikan VM yang dipulihkan menerima hasil tool.
14. Pastikan jawaban akhir berisi output yang dihasilkan setelah pemulihan.
15. Pastikan timeout, pembatalan, dan kedaluwarsa snapshot membersihkan status runtime.
16. Ekspor trajectory dan pastikan panggilan bertingkat terlihat di bawah panggilan
    mode kode induk.

Perubahan khusus dokumentasi pada halaman ini tetap harus menjalankan `pnpm check:docs`.

## Terkait

- [Tool Search](/id/tools/tool-search)
- [Runtime agen](/id/concepts/agent-runtimes)
- [Tool exec](/id/tools/exec)
- [Eksekusi kode](/id/tools/code-execution)
