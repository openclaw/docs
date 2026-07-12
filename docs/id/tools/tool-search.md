---
read_when:
    - Anda ingin agen OpenClaw menggunakan katalog alat yang besar tanpa menambahkan setiap skema alat ke dalam prompt
    - Anda ingin alat OpenClaw, alat MCP, dan alat klien diekspos melalui satu antarmuka runtime yang ringkas
    - Anda sedang mengimplementasikan atau men-debug penemuan alat untuk proses OpenClaw
summary: 'Pencarian Alat: ringkas katalog alat OpenClaw yang besar di balik fungsi pencarian, deskripsi, dan pemanggilan'
title: Pencarian Alat
x-i18n:
    generated_at: "2026-07-12T14:43:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search adalah fitur eksperimental runtime agen OpenClaw. Fitur ini memberikan satu
cara ringkas bagi agen untuk menemukan dan memanggil katalog alat yang besar. Fitur ini berguna ketika proses
memiliki banyak alat yang tersedia, tetapi model kemungkinan hanya memerlukan beberapa di antaranya.

Halaman ini mendokumentasikan Tool Search OpenClaw. Ini bukan permukaan pencarian
alat atau alat dinamis bawaan Codex. Mode kode bawaan Codex, pencarian alat, alat dinamis
tertunda, dan pemanggilan alat bertingkat adalah permukaan harness Codex yang stabil dan
tidak bergantung pada `tools.toolSearch`.

Saat diaktifkan untuk proses OpenClaw, secara default model menerima satu alat `tool_search_code`,
ditambah alat khusus-langsung yang hasil terstrukturnya tidak dapat melewati
jembatan ringkas. Alat kode menjalankan isi JavaScript singkat dalam subproses
Node terisolasi dengan jembatan `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Katalog dapat mencakup alat OpenClaw yang memenuhi syarat katalog, alat Plugin, alat MCP,
dan alat yang disediakan klien. Model tidak melihat setiap skema yang dikatalogkan
sejak awal. Sebagai gantinya, model mencari deskriptor ringkas, mendeskripsikan satu
alat yang dipilih ketika memerlukan skema persisnya, dan memanggil alat tersebut melalui OpenClaw.
Alat khusus-langsung tetap terlihat oleh model dan tidak ditambahkan ke katalog.

Proses harness Codex tidak menerima kontrol Tool Search OpenClaw
eksperimental ini. OpenClaw meneruskan kapabilitas produk ke Codex sebagai alat dinamis, dan
Codex memiliki mode kode bawaan yang stabil, pencarian alat bawaan, alat dinamis
tertunda, dan pemanggilan alat bertingkat.

## Cara giliran dijalankan

Pada waktu perencanaan, runner tertanam OpenClaw membangun katalog efektif untuk
proses tersebut:

1. Menentukan kebijakan alat aktif untuk agen, profil, sandbox, dan sesi.
2. Mencantumkan alat OpenClaw dan Plugin yang memenuhi syarat.
3. Mencantumkan alat MCP yang memenuhi syarat melalui runtime MCP sesi.
4. Menambahkan alat klien yang memenuhi syarat dan disediakan untuk proses saat ini.
5. Mempertahankan alat khusus-langsung agar terlihat oleh model dan mengindeks deskriptor ringkas untuk
   alat lain yang memenuhi syarat katalog.
6. Mengekspos jembatan kode OpenClaw, alat fallback terstruktur, atau
   permukaan direktori ringkas bersama alat khusus-langsung tersebut.

Pada waktu eksekusi, setiap pemanggilan alat yang sebenarnya kembali ke OpenClaw. Runtime Node
terisolasi tidak menyimpan implementasi Plugin, objek klien MCP, atau rahasia.
`openclaw.tools.call(...)` melintasi jembatan kembali ke Gateway, tempat
kebijakan, persetujuan, hook, pencatatan, dan penanganan hasil normal tetap berlaku.

## Mode

`tools.toolSearch` memiliki tiga mode yang dihadapkan ke model:

- `code`: mengekspos `tool_search_code`, jembatan JavaScript ringkas default,
  bersama alat khusus-langsung.
- `tools`: mengekspos `tool_search`, `tool_describe`, dan `tool_call` sebagai alat
  terstruktur biasa bagi penyedia yang tidak boleh menerima kode, bersama
  alat khusus-langsung.
- `directory`: mengekspos `tool_search`, `tool_describe`, dan `tool_call` beserta
  direktori prompt terbatas berisi nama dan deskripsi alat yang tersedia bagi
  penyedia yang harus melihat nama alat tanpa setiap skema lengkap. OpenClaw juga dapat
  mengekspos sekumpulan kecil dan terbatas skema alat yang kemungkinan diperlukan atau diwajibkan secara langsung
  untuk giliran saat ini. Alat khusus-langsung juga tetap terlihat dalam mode ini.

Semua mode menggunakan katalog terfilter kebijakan yang sama dan jalur eksekusi OpenClaw
normal. Alat yang ditandai `catalogMode: "direct-only"` tetap berada di luar katalog tersebut dan
tetap terlihat oleh model. Jika runtime saat ini tidak dapat meluncurkan proses anak
mode kode Node terisolasi, mode `code` default beralih ke `tools` sebelum Compaction
katalog. Dalam mode `directory`, alat yang disediakan klien tetap terlihat secara langsung
untuk proses saat ini, sedangkan alat OpenClaw, alat Plugin, dan alat MCP dapat
diringkas di balik katalog direktori. Pemanggilan langsung ke nama direktori tersembunyi
yang persis akan dihidrasi dari katalog terotorisasi yang sama sebelum eksekusi.

Semua mode bersifat eksperimental. Utamakan eksposur alat langsung untuk katalog alat OpenClaw
yang kecil, dan utamakan permukaan stabil bawaan Codex untuk proses harness Codex.

Tidak ada konfigurasi pemilihan sumber terpisah. Saat Tool Search diaktifkan,
katalog mencakup alat OpenClaw, MCP, dan klien yang memenuhi syarat katalog setelah
pemfilteran kebijakan normal; alat khusus-langsung dipertahankan secara terpisah.

## Alasan fitur ini ada

Katalog besar berguna tetapi mahal. Mengirim setiap skema alat ke model
memperbesar permintaan, memperlambat perencanaan, dan meningkatkan pemilihan alat
yang tidak disengaja.

Tool Search mengubah bentuknya:

- alat langsung: model melihat setiap skema yang dipilih sebelum token pertama
- mode kode Tool Search: model melihat satu alat kode ringkas, kontrak API
  singkat, dan semua alat khusus-langsung
- mode alat Tool Search: model melihat tiga alat fallback terstruktur yang ringkas
  beserta semua alat khusus-langsung
- mode direktori Tool Search: model melihat direktori terbatas beserta
  kontrol pencarian/deskripsi/pemanggilan dan sekumpulan kecil serta terbatas skema yang kemungkinan diperlukan atau diwajibkan,
  ditambah semua alat khusus-langsung
- selama giliran: model dapat memuat skema lainnya sesuai kebutuhan

Eksposur alat langsung tetap merupakan pilihan default yang tepat untuk katalog kecil. Tool Search
paling sesuai ketika satu proses dapat melihat banyak alat, terutama dari server MCP atau
alat aplikasi yang disediakan klien.

## API

`openclaw.tools.search(query, options?)`

Mencari katalog efektif untuk proses saat ini. Hasilnya ringkas dan aman
untuk dimasukkan kembali ke dalam konteks prompt.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Memuat metadata lengkap untuk satu hasil pencarian, termasuk skema input yang persis.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Memanggil alat yang dipilih melalui OpenClaw.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

Mode fallback terstruktur mengekspos operasi yang sama sebagai alat:

- `tool_search`
- `tool_describe`
- `tool_call`

Mode direktori mengekspos:

- `tool_search`
- `tool_describe`
- `tool_call`

Mode ini juga mempertahankan alat yang disediakan klien dan semua alat khusus-langsung agar terlihat secara langsung,
serta dapat mengekspos sekumpulan kecil dan terbatas skema alat katalog yang kemungkinan diperlukan atau diwajibkan
secara langsung untuk giliran saat ini. Jika direktori terbatas menghilangkan entri, gunakan
`tool_search` untuk menemukannya. Jika model meminta nama alat direktori tersembunyi
yang persis secara langsung, OpenClaw menghidrasinya dari katalog terotorisasi sebelum
eksekusi normal.
Nama alat klien dalam mode direktori tidak boleh bertabrakan dengan nama alat OpenClaw, Plugin, atau MCP
karena pengiriman tertunda yang persis menggunakan nama-nama tersebut.

## Batas runtime

Jembatan kode berjalan dalam subproses Node berumur pendek. Subproses dimulai
dengan mode izin Node aktif, lingkungan kosong, tanpa izin sistem berkas atau
jaringan, serta tanpa izin proses anak atau worker. OpenClaw memberlakukan
batas waktu jam dinding pada proses induk dan menghentikan subproses saat batas waktu habis, termasuk
setelah kelanjutan asinkron.

Runtime hanya mengekspos:

- `console.log`, `console.warn`, dan `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Perilaku normal OpenClaw tetap berlaku untuk pemanggilan akhir:

- kebijakan izin dan penolakan alat
- pembatasan alat per agen dan per sandbox
- kebijakan alat kanal/runtime
- hook persetujuan
- hook Plugin `before_tool_call`
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

Sesuaikan batas waktu mode kode dan batas hasil pencarian (nilai yang ditampilkan adalah nilai default):

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

Tool Search mencatat telemetri yang cukup untuk membandingkannya dengan eksposur alat langsung:

- total bita alat dan prompt terserialisasi yang dikirim ke harness
- ukuran katalog dan perincian sumber
- jumlah pencarian, deskripsi, dan pemanggilan
- pemanggilan alat akhir yang dieksekusi melalui OpenClaw
- ID dan sumber alat yang dipilih

Log sesi harus memungkinkan untuk menjawab:

- berapa banyak skema alat yang dilihat model sejak awal
- berapa banyak operasi pencarian dan deskripsi yang dilakukannya
- alat akhir mana yang dipanggil
- apakah hasilnya berasal dari OpenClaw, MCP, atau alat klien

## Validasi E2E

Skenario Gateway QA Lab membuktikan kedua jalur dengan runtime OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Skenario ini membuat Plugin palsu sementara dengan katalog alat yang besar, memulai penyedia
OpenAI tiruan, memulai Gateway sekali dalam mode langsung dan sekali dengan Tool Search
diaktifkan, lalu membandingkan payload permintaan penyedia dan log sesi.

Regresi tersebut membuktikan:

1. Mode langsung dapat memanggil alat Plugin palsu.
2. Tool Search dapat memanggil alat Plugin palsu yang sama.
3. Mode langsung mengekspos skema alat Plugin palsu secara langsung kepada penyedia.
4. Tool Search hanya mengekspos jembatan ringkas beserta semua alat khusus-langsung.
5. Payload permintaan Tool Search lebih kecil untuk katalog palsu yang besar.
6. Log sesi menunjukkan jumlah pemanggilan alat dan telemetri pemanggilan yang dijembatani sesuai harapan.

## Perilaku kegagalan

Tool Search harus gagal secara tertutup:

- jika suatu alat tidak ada dalam kebijakan efektif, pencarian tidak boleh mengembalikannya
- jika alat yang dipilih menjadi tidak tersedia, `tool_call` harus gagal
- jika kebijakan atau persetujuan memblokir eksekusi, hasil pemanggilan harus melaporkan
  pemblokiran tersebut alih-alih melewatinya
- jika jembatan kode tidak dapat membuat runtime terisolasi, gunakan `mode: "tools"` atau
  nonaktifkan Tool Search untuk penerapan tersebut

## Terkait

- [Alat dan Plugin](/id/tools)
- [Sandbox dan alat multiagen](/id/tools/multi-agent-sandbox-tools)
- [Alat eksekusi](/id/tools/exec)
- [Penyiapan agen ACP](/id/tools/acp-agents-setup)
- [Membangun Plugin](/id/plugins/building-plugins)
