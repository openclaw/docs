---
read_when:
    - Anda ingin agen OpenClaw menggunakan katalog alat yang besar tanpa menambahkan setiap skema alat ke prompt
    - Anda ingin alat OpenClaw, alat MCP, dan alat klien diekspos melalui satu permukaan runtime yang ringkas
    - Anda sedang mengimplementasikan atau mendiagnosis penemuan alat untuk eksekusi OpenClaw
summary: 'Pencarian Alat: ringkas katalog alat OpenClaw yang besar di balik pencarian, deskripsi, dan panggilan'
title: Pencarian Alat
x-i18n:
    generated_at: "2026-06-30T14:29:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81036277d763be8040526b42c116b2e503589921a58b3f765ff38670554a751c
    source_path: tools/tool-search.md
    workflow: 16
---

Pencarian Alat adalah fitur runtime agen OpenClaw eksperimental. Fitur ini memberi agen satu cara
ringkas untuk menemukan dan memanggil katalog alat yang besar. Fitur ini berguna ketika proses
memiliki banyak alat yang tersedia tetapi model kemungkinan hanya membutuhkan beberapa di antaranya.

Halaman ini mendokumentasikan Pencarian Alat OpenClaw. Ini bukan permukaan pencarian
alat native Codex atau alat dinamis. Mode kode native Codex, pencarian alat, alat dinamis
yang ditangguhkan, dan panggilan alat bertingkat adalah permukaan harness Codex yang stabil dan
tidak bergantung pada `tools.toolSearch`.

Saat diaktifkan untuk proses OpenClaw, model menerima satu alat `tool_search_code`
secara default. Alat itu menjalankan isi JavaScript pendek dalam subproses Node
terisolasi dengan bridge `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Katalog dapat mencakup alat OpenClaw, alat Plugin, alat MCP, dan
alat yang disediakan klien. Model tidak melihat setiap skema lengkap sejak awal.
Sebagai gantinya, model mencari deskriptor ringkas, mendeskripsikan satu alat terpilih ketika
membutuhkan skema persisnya, dan memanggil alat tersebut melalui OpenClaw.

Proses harness Codex tidak menerima kontrol Pencarian Alat OpenClaw eksperimental ini.
OpenClaw meneruskan kapabilitas produk ke Codex sebagai alat dinamis, dan
Codex memiliki mode kode native yang stabil, pencarian alat native, alat dinamis
yang ditangguhkan, dan panggilan alat bertingkat.

## Cara giliran berjalan

Pada waktu perencanaan, runner tertanam OpenClaw membangun katalog efektif untuk
proses:

1. Menyelesaikan kebijakan alat aktif untuk agen, profil, sandbox, dan sesi.
2. Mencantumkan alat OpenClaw dan Plugin yang memenuhi syarat.
3. Mencantumkan alat MCP yang memenuhi syarat melalui runtime MCP sesi.
4. Menambahkan alat klien yang memenuhi syarat yang disediakan untuk proses saat ini.
5. Mengindeks deskriptor ringkas untuk pencarian.
6. Mengekspos bridge kode OpenClaw, alat fallback terstruktur, atau permukaan
   direktori ringkas ke model.

Pada waktu eksekusi, setiap panggilan alat nyata kembali ke OpenClaw. Runtime Node
terisolasi tidak menyimpan implementasi Plugin, objek klien MCP, atau rahasia.
`openclaw.tools.call(...)` melintasi bridge kembali ke Gateway, tempat
kebijakan, persetujuan, hook, logging, dan penanganan hasil normal tetap berlaku.

## Mode

`tools.toolSearch` memiliki tiga mode yang terlihat oleh model:

- `code`: mengekspos `tool_search_code`, bridge JavaScript ringkas default.
- `tools`: mengekspos `tool_search`, `tool_describe`, dan `tool_call` sebagai alat
  terstruktur biasa untuk penyedia yang tidak boleh menerima kode.
- `directory`: mengekspos `tool_search`, `tool_describe`, dan `tool_call` ditambah
  direktori prompt terbatas berisi nama dan deskripsi alat yang tersedia untuk
  penyedia yang harus melihat nama alat tanpa setiap skema lengkap. OpenClaw juga dapat
  mengekspos sekumpulan kecil skema alat yang kemungkinan dibutuhkan atau wajib secara langsung
  untuk giliran saat ini.

Semua mode menggunakan katalog yang sama yang telah difilter kebijakan dan jalur eksekusi
OpenClaw normal. Jika runtime saat ini tidak dapat meluncurkan proses anak
mode kode Node terisolasi, mode `code` default fallback ke `tools` sebelum
Compaction katalog. Dalam mode `directory`, alat yang disediakan klien tetap terlihat
langsung untuk proses saat ini sementara alat OpenClaw, alat Plugin, dan alat MCP dapat
diringkas di balik katalog direktori. Panggilan langsung ke nama direktori tersembunyi
yang persis dihidrasi dari katalog resmi yang sama sebelum eksekusi.

Semua mode bersifat eksperimental. Pilih eksposur alat langsung untuk katalog alat OpenClaw
kecil, dan pilih permukaan stabil native Codex untuk proses harness Codex.

Tidak ada konfigurasi pemilihan sumber terpisah. Saat Pencarian Alat diaktifkan,
katalog mencakup alat OpenClaw, MCP, dan klien yang memenuhi syarat setelah pemfilteran
kebijakan normal.

## Mengapa ini ada

Katalog besar berguna tetapi mahal. Mengirim setiap skema alat ke model
membuat permintaan lebih besar, memperlambat perencanaan, dan meningkatkan pemilihan alat
yang tidak disengaja.

Pencarian Alat mengubah bentuknya:

- alat langsung: model melihat setiap skema yang dipilih sebelum token pertama
- mode kode Pencarian Alat: model melihat satu alat kode ringkas dan kontrak API pendek
- mode alat Pencarian Alat: model melihat tiga alat fallback terstruktur ringkas
- mode direktori Pencarian Alat: model melihat direktori terbatas ditambah
  kontrol search/describe/call dan sekumpulan kecil skema yang kemungkinan dibutuhkan atau wajib
- selama giliran: model dapat memuat skema yang tersisa sesuai kebutuhan

Eksposur alat langsung masih menjadi default yang tepat untuk katalog kecil. Pencarian Alat
paling cocok ketika satu proses dapat melihat banyak alat, terutama dari server MCP atau
alat aplikasi yang disediakan klien.

## API

`openclaw.tools.search(query, options?)`

Mencari katalog efektif untuk proses saat ini. Hasilnya ringkas dan aman
untuk dimasukkan kembali ke konteks prompt.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Memuat metadata lengkap untuk satu hasil pencarian, termasuk skema input persisnya.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

Memanggil alat terpilih melalui OpenClaw.

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

Mode ini juga menjaga alat yang disediakan klien tetap terlihat langsung dan dapat mengekspos sekumpulan
kecil skema alat katalog yang kemungkinan dibutuhkan atau wajib secara langsung untuk
giliran saat ini. Jika direktori terbatas menghilangkan entri, gunakan `tool_search` untuk menemukannya. Jika
model meminta nama alat direktori tersembunyi yang persis secara langsung, OpenClaw
menghidrasinya dari katalog resmi sebelum eksekusi normal.
Nama alat klien mode direktori tidak boleh bertabrakan dengan nama alat OpenClaw, Plugin, atau MCP
karena dispatch tertunda yang persis menggunakan nama tersebut.

## Batas runtime

Bridge kode berjalan dalam subproses Node berumur pendek. Subproses dimulai
dengan mode izin Node diaktifkan, lingkungan kosong, tanpa grant sistem file atau
jaringan, dan tanpa grant proses anak atau worker. OpenClaw memberlakukan
timeout wall-clock proses induk dan mematikan subproses saat timeout, termasuk
setelah kelanjutan asinkron.

Runtime hanya mengekspos:

- `console.log`, `console.warn`, dan `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Perilaku OpenClaw normal tetap berlaku untuk panggilan akhir:

- kebijakan izinkan dan tolak alat
- pembatasan alat per agen dan per sandbox
- kebijakan alat channel/runtime
- hook persetujuan
- hook Plugin `before_tool_call`
- identitas sesi, log, dan telemetri

## Konfigurasi

Aktifkan Pencarian Alat untuk proses OpenClaw dengan bridge kode default:

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

Sesuaikan timeout mode kode dan batas hasil pencarian:

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

Nonaktifkan:

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## Prompt dan telemetri

Pencarian Alat mencatat telemetri yang cukup untuk membandingkannya dengan eksposur alat langsung:

- total byte alat terserialisasi dan prompt yang dikirim ke harness
- ukuran katalog dan rincian sumber
- jumlah search, describe, dan call
- panggilan alat akhir yang dieksekusi melalui OpenClaw
- id alat dan sumber yang dipilih

Log sesi harus memungkinkan untuk menjawab:

- berapa banyak skema alat yang dilihat model sejak awal
- berapa banyak operasi search dan describe yang dilakukan
- alat akhir mana yang dipanggil
- apakah hasil berasal dari OpenClaw, MCP, atau alat klien

## Validasi E2E

Skenario Gateway QA Lab membuktikan kedua jalur dengan runtime OpenClaw:

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

Skenario ini membuat Plugin palsu sementara dengan katalog alat besar, memulai penyedia
OpenAI tiruan, memulai Gateway sekali dalam mode langsung dan sekali dengan Pencarian Alat
diaktifkan, lalu membandingkan payload permintaan penyedia dan log sesi.

Regresi membuktikan:

1. Mode langsung dapat memanggil alat Plugin palsu.
2. Pencarian Alat dapat memanggil alat Plugin palsu yang sama.
3. Mode langsung mengekspos skema alat Plugin palsu langsung ke penyedia.
4. Pencarian Alat hanya mengekspos bridge ringkas.
5. Payload permintaan Pencarian Alat lebih kecil untuk katalog palsu yang besar.
6. Log sesi menunjukkan jumlah panggilan alat yang diharapkan dan telemetri panggilan yang dijembatani.

## Perilaku kegagalan

Pencarian Alat harus gagal tertutup:

- jika alat tidak ada dalam kebijakan efektif, pencarian tidak boleh mengembalikannya
- jika alat terpilih menjadi tidak tersedia, `tool_call` harus gagal
- jika kebijakan atau persetujuan memblokir eksekusi, hasil panggilan harus melaporkan
  blokir tersebut alih-alih melewatinya
- jika bridge kode tidak dapat membuat runtime terisolasi, gunakan `mode: "tools"` atau
  nonaktifkan Pencarian Alat untuk deployment tersebut

## Terkait

- [Alat dan Plugin](/id/tools)
- [Sandbox multi-agen dan alat](/id/tools/multi-agent-sandbox-tools)
- [Alat exec](/id/tools/exec)
- [Penyiapan agen ACP](/id/tools/acp-agents-setup)
- [Membangun Plugin](/id/plugins/building-plugins)
