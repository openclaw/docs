---
read_when:
    - Anda ingin agen Pi menggunakan katalog alat yang besar tanpa menambahkan setiap skema alat ke prompt
    - Anda ingin alat OpenClaw, alat MCP, dan alat klien diekspos melalui satu permukaan PI yang ringkas
    - Anda sedang mengimplementasikan atau mendiagnosis penemuan alat untuk eksekusi PI
summary: 'Pencarian Alat: padatkan katalog alat PI yang besar di balik pencarian, deskripsi, dan pemanggilan'
title: Pencarian Alat
x-i18n:
    generated_at: "2026-05-11T20:38:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 410f21a4d56af163d03023f7280469e55e17e8296ee16f7b12cc2589494d0a0c
    source_path: tools/tool-search.md
    workflow: 16
---

Pencarian Alat adalah fitur agen PI OpenClaw yang bersifat eksperimental. Fitur ini memberi agen PI satu
cara ringkas untuk menemukan dan memanggil katalog alat yang besar. Ini berguna ketika suatu run
memiliki banyak alat yang tersedia tetapi model kemungkinan hanya memerlukan beberapa di antaranya.

Halaman ini mendokumentasikan Pencarian Alat PI OpenClaw. Ini bukan permukaan pencarian alat
atau dynamic-tools native Codex. Mode kode native Codex, pencarian alat, deferred
dynamic tools, dan nested tool calls adalah permukaan harness Codex yang stabil dan
tidak bergantung pada `tools.toolSearch`.

Saat diaktifkan untuk PI, model menerima satu alat `tool_search_code` secara default.
Alat tersebut menjalankan body JavaScript singkat dalam subproses Node terisolasi dengan
bridge `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Katalog dapat mencakup alat OpenClaw, alat plugin, alat MCP, dan
alat yang disediakan klien. Model tidak melihat setiap skema lengkap sejak awal.
Sebagai gantinya, model mencari deskriptor ringkas, mendeskripsikan satu alat terpilih ketika
memerlukan skema persisnya, dan memanggil alat tersebut melalui OpenClaw.

Run harness Codex tidak menerima kontrol Pencarian Alat OpenClaw eksperimental ini.
OpenClaw meneruskan kapabilitas produk ke Codex sebagai dynamic tools, dan
Codex memiliki mode kode native yang stabil, pencarian alat native, deferred dynamic
tools, dan nested tool calls.

## Cara sebuah giliran berjalan

Pada waktu perencanaan, runner tertanam PI membangun katalog efektif untuk
run:

1. Menyelesaikan kebijakan alat aktif untuk agen, profil, sandbox, dan sesi.
2. Mencantumkan alat OpenClaw dan plugin yang memenuhi syarat.
3. Mencantumkan alat MCP yang memenuhi syarat melalui runtime MCP sesi.
4. Menambahkan alat klien yang memenuhi syarat yang disediakan untuk run saat ini.
5. Mengindeks deskriptor ringkas untuk pencarian.
6. Mengekspos bridge kode PI atau alat fallback terstruktur ke
   model.

Pada waktu eksekusi, setiap panggilan alat nyata kembali ke OpenClaw. Runtime Node
terisolasi tidak menyimpan implementasi plugin, objek klien MCP, atau rahasia.
`openclaw.tools.call(...)` menyeberangi bridge kembali ke Gateway, tempat
kebijakan, approval, hook, logging, dan penanganan hasil normal tetap berlaku.

## Mode

`tools.toolSearch` memiliki dua mode yang terlihat oleh model:

- `code`: mengekspos `tool_search_code`, bridge JavaScript ringkas default.
- `tools`: mengekspos `tool_search`, `tool_describe`, dan `tool_call` sebagai alat
  terstruktur biasa untuk provider yang tidak boleh menerima kode.

Kedua mode menggunakan katalog dan jalur eksekusi yang sama. Satu-satunya perbedaan adalah
bentuk yang dilihat model. Jika runtime saat ini tidak dapat meluncurkan proses anak
mode kode Node terisolasi, mode default `code` beralih ke `tools` sebelum
pemadatan katalog.

Kedua mode bersifat eksperimental. Lebih utamakan eksposur alat langsung untuk katalog alat PI
kecil, dan lebih utamakan permukaan stabil native Codex untuk run harness Codex.

Tidak ada konfigurasi pemilihan sumber terpisah. Saat Pencarian Alat diaktifkan, katalog
mencakup alat OpenClaw, MCP, dan klien yang memenuhi syarat setelah penyaringan kebijakan normal.

## Mengapa ini ada

Katalog besar berguna tetapi mahal. Mengirim setiap skema alat ke model
membuat permintaan lebih besar, memperlambat perencanaan, dan meningkatkan risiko pemilihan
alat yang tidak disengaja.

Pencarian Alat mengubah bentuknya:

- alat langsung: model melihat setiap skema terpilih sebelum token pertama
- mode kode Pencarian Alat: model melihat satu alat kode ringkas dan kontrak API singkat
- mode alat Pencarian Alat: model melihat tiga alat fallback terstruktur ringkas
- selama giliran: model memuat hanya skema alat yang benar-benar dibutuhkannya

Eksposur alat langsung masih menjadi default yang tepat untuk katalog kecil. Pencarian Alat
paling cocok ketika satu run dapat melihat banyak alat, terutama dari server MCP atau
alat aplikasi yang disediakan klien.

## API

`openclaw.tools.search(query, options?)`

Mencari katalog efektif untuk run saat ini. Hasilnya ringkas dan aman
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

## Batas runtime

Bridge kode berjalan dalam subproses Node berumur pendek. Subproses dimulai
dengan mode izin Node diaktifkan, lingkungan kosong, tanpa grant filesystem atau
jaringan, dan tanpa grant proses anak atau worker. OpenClaw memberlakukan
timeout wall-clock proses induk dan menghentikan subproses saat timeout, termasuk
setelah kelanjutan async.

Runtime hanya mengekspos:

- `console.log`, `console.warn`, dan `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Perilaku OpenClaw normal tetap berlaku pada panggilan akhir:

- kebijakan allow dan deny alat
- pembatasan alat per agen dan per sandbox
- gating khusus pemilik
- hook approval
- hook plugin `before_tool_call`
- identitas sesi, log, dan telemetri

## Konfigurasi

Aktifkan Pencarian Alat untuk run PI dengan bridge kode default:

```bash
openclaw config set tools.toolSearch true
```

JSON ekuivalen:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

Gunakan alat fallback terstruktur sebagai gantinya untuk run PI:

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
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

Pencarian Alat merekam telemetri yang cukup untuk membandingkannya dengan eksposur alat langsung:

- total byte alat dan prompt terserialisasi yang dikirim ke harness
- ukuran katalog dan perincian sumber
- jumlah pencarian, deskripsi, dan panggilan
- panggilan alat akhir yang dieksekusi melalui OpenClaw
- id dan sumber alat terpilih

Log sesi harus memungkinkan untuk menjawab:

- berapa banyak skema alat yang dilihat model sejak awal
- berapa banyak operasi pencarian dan deskripsi yang dilakukannya
- alat akhir mana yang dipanggil
- apakah hasilnya berasal dari OpenClaw, MCP, atau alat klien

## Validasi E2E

Runner E2E gateway membuktikan kedua jalur dengan harness PI:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Runner ini membuat plugin palsu sementara dengan katalog alat besar, memulai provider
OpenAI mock, memulai Gateway sekali dalam mode langsung dan sekali dengan Pencarian Alat
diaktifkan, lalu membandingkan payload permintaan provider dan log sesi.

Regresi membuktikan:

1. Mode langsung dapat memanggil alat plugin palsu.
2. Pencarian Alat dapat memanggil alat plugin palsu yang sama.
3. Mode langsung mengekspos skema alat plugin palsu langsung ke provider.
4. Pencarian Alat hanya mengekspos bridge ringkas.
5. Payload permintaan Pencarian Alat lebih kecil untuk katalog palsu besar.
6. Log sesi menunjukkan jumlah panggilan alat yang diharapkan dan telemetri panggilan melalui bridge.

## Perilaku kegagalan

Pencarian Alat harus gagal secara tertutup:

- jika sebuah alat tidak ada dalam kebijakan efektif, pencarian tidak boleh mengembalikannya
- jika alat terpilih menjadi tidak tersedia, `tool_call` harus gagal
- jika kebijakan atau approval memblokir eksekusi, hasil panggilan harus melaporkan
  blokir tersebut alih-alih melewatinya
- jika bridge kode tidak dapat membuat runtime terisolasi, gunakan `mode: "tools"` atau
  nonaktifkan Pencarian Alat untuk deployment tersebut

## Terkait

- [Alat dan plugin](/id/tools)
- [Sandbox dan alat multi-agen](/id/tools/multi-agent-sandbox-tools)
- [Alat exec](/id/tools/exec)
- [Penyiapan agen ACP](/id/tools/acp-agents-setup)
- [Membangun plugin](/id/plugins/building-plugins)
