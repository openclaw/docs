---
read_when:
    - Anda ingin agen OpenClaw menggunakan katalog alat yang besar tanpa menambahkan setiap skema alat ke prompt
    - Anda ingin alat OpenClaw, alat MCP, dan alat klien diekspos melalui satu permukaan runtime yang ringkas
    - Anda sedang mengimplementasikan atau men-debug penemuan alat untuk proses OpenClaw
summary: 'Pencarian Alat: ringkas katalog alat OpenClaw yang besar di balik fungsi pencarian, deskripsi, dan pemanggilan'
title: Pencarian Alat
x-i18n:
    generated_at: "2026-07-19T05:15:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d31322d5ef108c52fd14d48771cc3c6c43fcfbc4bfb95652bc29a55fd706c903
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search adalah fitur eksperimental runtime agen OpenClaw. Fitur ini memberi agen satu
cara ringkas untuk menemukan dan memanggil katalog alat yang besar. Fitur ini berguna ketika proses
memiliki banyak alat yang tersedia, tetapi model kemungkinan hanya memerlukan beberapa di antaranya.

Halaman ini mendokumentasikan Tool Search OpenClaw. Ini bukan permukaan pencarian alat
atau alat dinamis bawaan Codex. Mode kode bawaan Codex, pencarian alat, alat dinamis yang
ditangguhkan, dan panggilan alat bertingkat merupakan permukaan harness Codex yang stabil dan
tidak bergantung pada `tools.toolSearch`.

Untuk runtime OpenClaw generik yang mengekspos permukaan QuickJS-WASI `exec`/`wait`
alih-alih kontrol Tool Search, lihat [Mode Kode](/tools/code-mode).

Saat diaktifkan untuk proses OpenClaw, model menerima satu alat `tool_search_code`
secara default, ditambah alat khusus-langsung yang hasil terstrukturnya tidak dapat melintasi
jembatan ringkas. Alat kode menjalankan isi JavaScript singkat dalam subproses
Node terisolasi dengan jembatan `openclaw.tools`:

```js
const hits = await openclaw.tools.search("buat issue GitHub");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash saat mulai",
  body: "Langkah-langkah untuk mereproduksi...",
});
```

Katalog dapat mencakup alat OpenClaw yang memenuhi syarat katalog, alat plugin, alat MCP,
dan alat yang disediakan klien. Model tidak melihat setiap skema yang dikatalogkan
sejak awal. Sebaliknya, model mencari deskriptor ringkas, mendeskripsikan satu alat yang dipilih
ketika memerlukan skema persisnya, lalu memanggil alat tersebut melalui OpenClaw.
Alat khusus-langsung tetap terlihat oleh model dan tidak ditambahkan ke katalog.

Proses harness Codex tidak menerima kontrol Tool Search OpenClaw eksperimental ini.
OpenClaw meneruskan kapabilitas produk kepada Codex sebagai alat dinamis, dan
Codex memiliki mode kode bawaan yang stabil, pencarian alat bawaan, alat dinamis yang
ditangguhkan, serta panggilan alat bertingkat.

## Cara giliran dijalankan

Pada waktu perencanaan, runner tertanam OpenClaw membangun katalog efektif untuk
proses:

1. Selesaikan kebijakan alat aktif untuk agen, profil, sandbox, dan sesi.
2. Cantumkan alat OpenClaw dan plugin yang memenuhi syarat.
3. Cantumkan alat MCP yang memenuhi syarat melalui runtime MCP sesi.
4. Tambahkan alat klien yang memenuhi syarat dan disediakan untuk proses saat ini.
5. Pertahankan alat khusus-langsung agar terlihat oleh model dan indekskan deskriptor ringkas untuk
   alat tersisa yang memenuhi syarat katalog.
6. Ekspos jembatan kode OpenClaw, alat fallback terstruktur, atau
   permukaan direktori ringkas bersama alat khusus-langsung tersebut.

Pada waktu eksekusi, setiap panggilan alat nyata kembali ke OpenClaw. Runtime Node
terisolasi tidak menyimpan implementasi plugin, objek klien MCP, atau rahasia.
`openclaw.tools.call(...)` melintasi jembatan kembali ke Gateway, tempat
penanganan kebijakan, persetujuan, hook, pencatatan, dan hasil normal tetap berlaku.

## Mode

`tools.toolSearch` memiliki tiga mode yang menghadap model:

- `code`: mengekspos `tool_search_code`, jembatan JavaScript ringkas default,
  bersama alat khusus-langsung.
- `tools`: mengekspos `tool_search`, `tool_describe`, dan `tool_call` sebagai alat
  terstruktur biasa untuk penyedia yang tidak boleh menerima kode, bersama
  alat khusus-langsung.
- `directory`: mengekspos `tool_search`, `tool_describe`, dan `tool_call` ditambah
  direktori prompt terbatas berisi nama dan deskripsi alat yang tersedia untuk
  penyedia yang harus melihat nama alat tanpa setiap skema lengkap. OpenClaw juga dapat
  mengekspos secara langsung sekumpulan kecil terbatas skema alat yang mungkin diperlukan atau diwajibkan
  untuk giliran saat ini. Alat khusus-langsung juga tetap terlihat dalam mode ini.

Semua mode menggunakan katalog terfilter kebijakan dan jalur eksekusi OpenClaw
normal yang sama. Alat yang ditandai `catalogMode: "direct-only"` tetap berada di luar katalog tersebut dan
tetap terlihat oleh model. Jika runtime saat ini tidak dapat meluncurkan proses anak mode kode
Node terisolasi, mode default `code` beralih ke `tools` sebelum pemadatan
katalog. Dalam mode `directory`, alat yang disediakan klien tetap terlihat secara langsung
untuk proses saat ini, sedangkan alat OpenClaw, alat plugin, dan alat MCP dapat
dipadatkan di balik katalog direktori. Panggilan langsung ke nama direktori tersembunyi yang persis
dihidrasi dari katalog resmi yang sama sebelum eksekusi.

Semua mode bersifat eksperimental. Utamakan eksposur alat langsung untuk katalog alat
OpenClaw yang kecil, dan utamakan permukaan stabil bawaan Codex untuk proses harness Codex.

Tidak ada konfigurasi pemilihan sumber terpisah. Saat Tool Search diaktifkan,
katalog mencakup alat OpenClaw, MCP, dan klien yang memenuhi syarat katalog setelah
pemfilteran kebijakan normal; alat khusus-langsung dipertahankan secara terpisah.

## Alasan fitur ini ada

Katalog besar berguna, tetapi mahal. Mengirim setiap skema alat ke model
memperbesar permintaan, memperlambat perencanaan, dan meningkatkan pemilihan alat
yang tidak disengaja.

Tool Search mengubah bentuknya:

- alat langsung: model melihat setiap skema yang dipilih sebelum token pertama
- mode kode Tool Search: model melihat satu alat kode ringkas, kontrak API
  singkat, dan alat khusus-langsung apa pun
- mode alat Tool Search: model melihat tiga alat fallback terstruktur ringkas
  ditambah alat khusus-langsung apa pun
- mode direktori Tool Search: model melihat direktori terbatas ditambah
  kontrol pencarian/deskripsi/panggilan dan sekumpulan kecil terbatas skema yang mungkin diperlukan atau diwajibkan,
  ditambah alat khusus-langsung apa pun
- selama giliran: model dapat memuat skema tersisa sesuai kebutuhan

Eksposur alat langsung tetap menjadi default yang tepat untuk katalog kecil. Tool Search
paling sesuai ketika satu proses dapat melihat banyak alat, terutama dari server MCP atau
alat aplikasi yang disediakan klien.

## API

`openclaw.tools.search(query, options?)`

Mencari katalog efektif untuk proses saat ini. Hasilnya ringkas dan aman
untuk dimasukkan kembali ke konteks prompt. Setiap hasil menyertakan tanda tangan `input`
bergaya TypeScript yang terbatas, seperti `{ id: string; mode?: "drip" | "flood" }`, sehingga
model dapat melewati `describe` ketika tanda tangan tersebut sudah memadai. Alat inti atau plugin
OpenClaw tepercaya juga dapat menyertakan petunjuk ringkas `output`, seperti
`Array<{ id: string; paid: boolean }>`. Klaim skema keluaran MCP dan klien
tidak dipromosikan menjadi petunjuk tepercaya ini. Skema masukan tidak tepercaya mereka juga
ditangguhkan sebagai `input: "unknown"`; gunakan `describe` sebelum memanggilnya. Skema keluaran
terbuka, terlalu besar, atau parsial dengan cara lain menghilangkan petunjuk tersebut dan tetap
tersedia melalui `describe` sebagai gantinya.

```js
const hits = await openclaw.tools.search("acara kalender", { limit: 5 });
```

`openclaw.tools.describe(id)`

Memuat metadata lengkap untuk satu hasil pencarian, termasuk skema masukan persis dan
`outputSchema` lengkap tepercaya ketika alat mendeklarasikannya.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Memanggil alat yang dipilih melalui OpenClaw dan mengembalikan envelope `{ tool, result }`
mentah. Alat yang mengembalikan JSON biasanya menempatkan nilainya di
`result.details`. Jika alat tepercaya mendeklarasikan `outputSchema`, OpenClaw mengompilasi
skema sebelum eksekusi dan memvalidasi `details` akhir setelah hook alat normal
sebelum mengembalikan panggilan katalog.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Perencanaan",
  start: "2026-05-09T14:00:00Z",
});
```

Pembuat alat mendeklarasikan kontrak keluaran pada properti `outputSchema` alat tersebut.
Properti ini mendeskripsikan `AgentToolResult.details`, bukan blok konten yang dirender. Sertakan
semua varian yang tidak melempar error atau hilangkan untuk hasil yang tidak stabil. Lihat
[Kontrak keluaran Mode Kode](/tools/code-mode#declared-output-contracts) dan
[Plugin alat](/id/plugins/tool-plugins#output-contracts).

Mode fallback terstruktur mengekspos operasi yang sama sebagai alat:

- `tool_search`
- `tool_describe`
- `tool_call`

Mode direktori mengekspos:

- `tool_search`
- `tool_describe`
- `tool_call`

Mode ini juga mempertahankan alat yang disediakan klien dan semua alat khusus-langsung agar terlihat secara langsung,
serta dapat mengekspos secara langsung sekumpulan kecil terbatas skema alat katalog yang mungkin diperlukan atau diwajibkan
untuk giliran saat ini. Jika direktori terbatas menghilangkan entri, gunakan
`tool_search` untuk menemukannya. Jika model meminta nama alat direktori tersembunyi yang persis
secara langsung, OpenClaw menghidrasinya dari katalog resmi sebelum
eksekusi normal.
Nama alat klien mode direktori tidak boleh bertabrakan dengan nama alat OpenClaw, plugin, atau MCP
karena pengiriman tertunda yang persis menggunakan nama tersebut.

## Batas runtime

Jembatan kode berjalan dalam subproses Node berumur pendek. Subproses dimulai
dengan mode izin Node diaktifkan, lingkungan kosong, tanpa izin sistem berkas atau
jaringan, serta tanpa izin proses anak atau worker. OpenClaw memberlakukan
batas waktu jam dinding proses induk dan menghentikan subproses saat waktu habis, termasuk
setelah kelanjutan asinkron.

Runtime hanya mengekspos:

- `console.log`, `console.warn`, dan `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Perilaku OpenClaw normal tetap berlaku pada panggilan akhir:

- kebijakan mengizinkan dan menolak alat
- pembatasan alat per agen dan per sandbox
- kebijakan alat kanal/runtime
- hook persetujuan
- hook `before_tool_call` plugin
- identitas sesi, log, dan telemetri

## Konfigurasi

Aktifkan Tool Search untuk proses OpenClaw dengan jembatan kode default:

```bash
openclaw config set tools.toolSearch true
```

JSON yang setara:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

Gunakan alat fallback terstruktur sebagai gantinya untuk proses OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Gunakan permukaan direktori ringkas sebagai gantinya untuk proses OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

Sesuaikan batas waktu mode kode dan batas hasil pencarian (nilai yang ditampilkan adalah default):

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

Runtime membatasi `codeTimeoutMs` ke 1000-60000, `maxSearchLimit` ke 1-50, dan
`searchDefaultLimit` ke 1..`maxSearchLimit`.

Nonaktifkan:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt dan telemetri

Tool Search mencatat telemetri yang memadai untuk membandingkannya dengan eksposur alat langsung:

- total byte alat dan prompt terserialisasi yang dikirim ke harness
- ukuran katalog dan perincian sumber
- jumlah pencarian, deskripsi, dan panggilan
- panggilan alat akhir yang dieksekusi melalui OpenClaw
- id dan sumber alat yang dipilih

Log sesi seharusnya memungkinkan untuk menjawab:

- berapa banyak skema alat yang dilihat model sejak awal
- berapa banyak operasi pencarian dan deskripsi yang dilakukan
- alat akhir mana yang dipanggil
- apakah hasil berasal dari OpenClaw, MCP, atau alat klien

## Validasi E2E

Skenario Gateway QA Lab membuktikan kedua jalur dengan runtime OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Skenario ini membuat plugin palsu sementara dengan katalog alat besar, memulai penyedia
OpenAI tiruan, memulai Gateway satu kali dalam mode langsung dan satu kali dengan Tool Search
diaktifkan, lalu membandingkan payload permintaan penyedia dan log sesi.

Regresi ini membuktikan:

1. Mode langsung dapat memanggil alat plugin palsu.
2. Tool Search dapat memanggil alat plugin palsu yang sama.
3. Mode langsung mengekspos skema alat plugin palsu secara langsung kepada penyedia.
4. Tool Search hanya mengekspos jembatan ringkas beserta alat apa pun yang hanya tersedia secara langsung.
5. Payload permintaan Tool Search lebih kecil untuk katalog palsu yang besar.
6. Log sesi menunjukkan jumlah panggilan alat yang diharapkan dan telemetri panggilan yang dijembatani.

## Perilaku kegagalan

Tool Search harus gagal secara tertutup:

- jika alat tidak tercakup dalam kebijakan efektif, pencarian tidak boleh mengembalikannya
- jika alat yang dipilih menjadi tidak tersedia, `tool_call` harus gagal
- jika kebijakan atau persetujuan memblokir eksekusi, hasil panggilan harus melaporkan
  pemblokiran tersebut alih-alih melewatinya
- jika jembatan kode tidak dapat membuat runtime terisolasi, gunakan `mode: "tools"` atau
  nonaktifkan Tool Search untuk deployment tersebut

## Terkait

- [Alat dan plugin](/id/tools)
- [Sandbox dan alat multiagen](/id/tools/multi-agent-sandbox-tools)
- [Alat Exec](/id/tools/exec)
- [Penyiapan agen ACP](/id/tools/acp-agents-setup)
- [Membangun plugin](/id/plugins/building-plugins)
