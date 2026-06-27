---
read_when:
    - Anda ingin agen OpenClaw menggunakan katalog alat yang besar tanpa menambahkan setiap skema alat ke prompt
    - Anda ingin alat OpenClaw, alat MCP, dan alat klien diekspos melalui satu permukaan runtime yang ringkas
    - Anda sedang mengimplementasikan atau men-debug penemuan alat untuk run OpenClaw
summary: 'Pencarian Alat: ringkas katalog alat OpenClaw yang besar di balik pencarian, deskripsi, dan pemanggilan'
title: Pencarian Alat
x-i18n:
    generated_at: "2026-06-27T18:22:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23b46264bab307bbfdfeb1e358c566d498f3bcf77f187ba05d2ae319e115e1f4
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search adalah fitur runtime agen OpenClaw yang eksperimental. Fitur ini memberi agen satu cara ringkas untuk menemukan dan memanggil katalog alat yang besar. Fitur ini berguna ketika suatu run memiliki banyak alat yang tersedia, tetapi model kemungkinan hanya membutuhkan sebagian kecil darinya.

Halaman ini mendokumentasikan OpenClaw Tool Search. Ini bukan pencarian alat native Codex atau surface dynamic-tools. Mode kode native Codex, pencarian alat, dynamic tools yang ditangguhkan, dan panggilan alat bertingkat adalah surface harness Codex yang stabil dan tidak bergantung pada `tools.toolSearch`.

Ketika diaktifkan untuk run OpenClaw, model menerima satu alat `tool_search_code` secara default. Alat itu menjalankan body JavaScript singkat dalam subproses Node terisolasi dengan bridge `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Katalog dapat mencakup alat OpenClaw, alat plugin, alat MCP, dan alat yang disediakan klien. Model tidak melihat setiap skema lengkap sejak awal. Sebaliknya, model mencari deskriptor ringkas, mendeskripsikan satu alat terpilih ketika membutuhkan skema persisnya, lalu memanggil alat tersebut melalui OpenClaw.

Run harness Codex tidak menerima kontrol OpenClaw Tool Search eksperimental ini. OpenClaw meneruskan kapabilitas produk ke Codex sebagai dynamic tools, dan Codex memiliki mode kode native yang stabil, pencarian alat native, dynamic tools yang ditangguhkan, dan panggilan alat bertingkat.

## Cara turn berjalan

Pada waktu perencanaan, runner tertanam OpenClaw membangun katalog efektif untuk run:

1. Menyelesaikan kebijakan alat aktif untuk agen, profil, sandbox, dan sesi.
2. Mencantumkan alat OpenClaw dan plugin yang memenuhi syarat.
3. Mencantumkan alat MCP yang memenuhi syarat melalui runtime MCP sesi.
4. Menambahkan alat klien yang memenuhi syarat yang disediakan untuk run saat ini.
5. Mengindeks deskriptor ringkas untuk pencarian.
6. Mengekspos bridge kode OpenClaw, alat fallback terstruktur, atau surface direktori ringkas kepada model.

Pada waktu eksekusi, setiap panggilan alat nyata kembali ke OpenClaw. Runtime Node terisolasi tidak menyimpan implementasi plugin, objek klien MCP, atau rahasia. `openclaw.tools.call(...)` melintasi bridge kembali ke Gateway, tempat kebijakan, persetujuan, hook, logging, dan penanganan hasil normal tetap berlaku.

## Mode

`tools.toolSearch` memiliki tiga mode yang terlihat oleh model:

- `code`: mengekspos `tool_search_code`, bridge JavaScript ringkas default.
- `tools`: mengekspos `tool_search`, `tool_describe`, dan `tool_call` sebagai alat terstruktur biasa untuk provider yang tidak boleh menerima kode.
- `directory`: mengekspos `tool_search`, `tool_describe`, dan `tool_call` plus direktori prompt terbatas berisi nama dan deskripsi alat yang tersedia untuk provider yang perlu melihat nama alat tanpa setiap skema lengkap. OpenClaw juga dapat mengekspos satu set kecil terbatas berisi skema alat yang mungkin atau wajib secara langsung untuk turn saat ini.

Semua mode menggunakan katalog yang sama, yang sudah difilter kebijakan, dan jalur eksekusi OpenClaw normal. Jika runtime saat ini tidak dapat meluncurkan proses anak mode kode Node terisolasi, mode `code` default melakukan fallback ke `tools` sebelum Compaction katalog. Dalam mode `directory`, alat yang disediakan klien tetap terlihat langsung untuk run saat ini, sementara alat OpenClaw, alat plugin, dan alat MCP dapat dipadatkan di balik katalog direktori. Panggilan langsung ke nama direktori tersembunyi yang persis dihidrasi dari katalog terotorisasi yang sama sebelum eksekusi.

Semua mode bersifat eksperimental. Pilih eksposur alat langsung untuk katalog alat OpenClaw kecil, dan pilih surface native Codex yang stabil untuk run harness Codex.

Tidak ada konfigurasi pemilihan sumber terpisah. Ketika Tool Search diaktifkan, katalog mencakup alat OpenClaw, MCP, dan klien yang memenuhi syarat setelah pemfilteran kebijakan normal.

## Mengapa ini ada

Katalog besar berguna tetapi mahal. Mengirim setiap skema alat ke model membuat request lebih besar, memperlambat perencanaan, dan meningkatkan risiko pemilihan alat yang tidak disengaja.

Tool Search mengubah bentuknya:

- alat langsung: model melihat setiap skema terpilih sebelum token pertama
- mode kode Tool Search: model melihat satu alat kode ringkas dan kontrak API singkat
- mode alat Tool Search: model melihat tiga alat fallback terstruktur yang ringkas
- mode direktori Tool Search: model melihat direktori terbatas plus kontrol pencarian/deskripsi/panggilan dan satu set kecil terbatas berisi skema yang mungkin atau wajib
- selama turn: model dapat memuat skema yang tersisa sesuai kebutuhan

Eksposur alat langsung masih merupakan default yang tepat untuk katalog kecil. Tool Search paling cocok ketika satu run dapat melihat banyak alat, terutama dari server MCP atau alat aplikasi yang disediakan klien.

## API

`openclaw.tools.search(query, options?)`

Mencari katalog efektif untuk run saat ini. Hasilnya ringkas dan aman untuk dimasukkan kembali ke konteks prompt.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Memuat metadata lengkap untuk satu hasil pencarian, termasuk skema input yang persis.

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

Mode ini juga menjaga alat yang disediakan klien tetap terlihat langsung dan dapat mengekspos satu set kecil terbatas berisi skema alat katalog yang mungkin atau wajib secara langsung untuk turn saat ini. Jika direktori terbatas menghilangkan entri, gunakan `tool_search` untuk menemukannya. Jika model meminta nama alat direktori tersembunyi yang persis secara langsung, OpenClaw menghidrasinya dari katalog terotorisasi sebelum eksekusi normal.
Nama alat klien mode direktori tidak boleh bertabrakan dengan nama alat OpenClaw, plugin, atau MCP karena dispatch tertunda yang persis menggunakan nama tersebut.

## Batas runtime

Bridge kode berjalan dalam subproses Node berumur pendek. Subproses dimulai dengan mode izin Node aktif, environment kosong, tanpa izin sistem berkas atau jaringan, dan tanpa izin proses anak atau worker. OpenClaw memberlakukan timeout wall-clock proses induk dan mematikan subproses saat timeout, termasuk setelah kelanjutan asinkron.

Runtime hanya mengekspos:

- `console.log`, `console.warn`, dan `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Perilaku OpenClaw normal tetap berlaku pada panggilan final:

- kebijakan izinkan dan tolak alat
- pembatasan alat per agen dan per sandbox
- kebijakan alat channel/runtime
- hook persetujuan
- hook plugin `before_tool_call`
- identitas sesi, log, dan telemetri

## Konfigurasi

Aktifkan Tool Search untuk run OpenClaw dengan bridge kode default:

```bash
openclaw config set tools.toolSearch true
```

JSON yang ekuivalen:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

Gunakan alat fallback terstruktur sebagai gantinya untuk run OpenClaw:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

Gunakan surface direktori ringkas sebagai gantinya untuk run OpenClaw:

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

Tool Search mencatat telemetri yang cukup untuk membandingkannya dengan eksposur alat langsung:

- total byte alat dan prompt terserialisasi yang dikirim ke harness
- ukuran katalog dan rincian sumber
- jumlah pencarian, deskripsi, dan panggilan
- panggilan alat final yang dieksekusi melalui OpenClaw
- id dan sumber alat terpilih

Log sesi harus memungkinkan untuk menjawab:

- berapa banyak skema alat yang dilihat model sejak awal
- berapa banyak operasi pencarian dan deskripsi yang dilakukan
- alat final mana yang dipanggil
- apakah hasil berasal dari OpenClaw, MCP, atau alat klien

## Validasi E2E

Runner E2E gateway membuktikan kedua jalur dengan runtime OpenClaw:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Runner ini membuat plugin palsu sementara dengan katalog alat besar, memulai provider OpenAI tiruan, memulai Gateway sekali dalam mode langsung dan sekali dengan Tool Search aktif, lalu membandingkan payload request provider dan log sesi.

Regresi membuktikan:

1. Mode langsung dapat memanggil alat plugin palsu.
2. Tool Search dapat memanggil alat plugin palsu yang sama.
3. Mode langsung mengekspos skema alat plugin palsu secara langsung kepada provider.
4. Tool Search hanya mengekspos bridge ringkas.
5. Payload request Tool Search lebih kecil untuk katalog palsu yang besar.
6. Log sesi menunjukkan jumlah panggilan alat yang diharapkan dan telemetri panggilan yang melalui bridge.

## Perilaku kegagalan

Tool Search harus gagal tertutup:

- jika alat tidak ada dalam kebijakan efektif, pencarian tidak boleh mengembalikannya
- jika alat terpilih menjadi tidak tersedia, `tool_call` harus gagal
- jika kebijakan atau persetujuan memblokir eksekusi, hasil panggilan harus melaporkan blokir tersebut alih-alih melewatinya
- jika bridge kode tidak dapat membuat runtime terisolasi, gunakan `mode: "tools"` atau nonaktifkan Tool Search untuk deployment tersebut

## Terkait

- [Alat dan plugin](/id/tools)
- [Sandbox multi-agen dan alat](/id/tools/multi-agent-sandbox-tools)
- [Alat exec](/id/tools/exec)
- [Penyiapan agen ACP](/id/tools/acp-agents-setup)
- [Membangun plugin](/id/plugins/building-plugins)
