---
read_when:
    - Anda ingin agen Pi menggunakan katalog alat yang besar tanpa menambahkan setiap skema alat ke prompt
    - Anda ingin alat OpenClaw, alat MCP, dan alat klien diekspos melalui satu permukaan PI yang ringkas
    - Anda sedang mengimplementasikan atau melakukan debug pada penemuan alat untuk eksekusi PI
summary: 'Pencarian Alat: ringkas katalog alat PI besar di balik pencarian, deskripsi, dan panggilan'
title: Pencarian Alat
x-i18n:
    generated_at: "2026-05-10T19:57:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 182b850db5a1d6c9a769d5d50ccae914bc65416c1fd9368f0aeeb43663c0c0ae
    source_path: tools/tool-search.md
    workflow: 16
---

Pencarian Alat memberi agen PI satu cara ringkas untuk menemukan dan memanggil katalog alat yang besar. Ini berguna ketika eksekusi memiliki banyak alat yang tersedia tetapi model kemungkinan hanya membutuhkan beberapa di antaranya.

Ketika diaktifkan untuk PI, model menerima satu alat `tool_search_code` secara default. Alat itu menjalankan body JavaScript singkat dalam subproses Node terisolasi dengan bridge `openclaw.tools`:

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

Katalog dapat mencakup alat OpenClaw, alat Plugin, alat MCP, dan alat yang disediakan klien. Model tidak melihat setiap skema lengkap sejak awal. Sebaliknya, model mencari deskriptor ringkas, mendeskripsikan satu alat terpilih saat membutuhkan skema yang tepat, dan memanggil alat tersebut melalui OpenClaw.

Eksekusi harness Codex tidak menerima kontrol Pencarian Alat OpenClaw ini. OpenClaw meneruskan kapabilitas produk ke Codex sebagai alat dinamis, dan Codex memiliki mode kode native, pencarian alat native, alat dinamis tertunda, dan panggilan alat bersarang.

## Cara sebuah giliran berjalan

Pada waktu perencanaan, runner tertanam PI membangun katalog efektif untuk eksekusi:

1. Menyelesaikan kebijakan alat aktif untuk agen, profil, sandbox, dan sesi.
2. Mencantumkan alat OpenClaw dan Plugin yang memenuhi syarat.
3. Mencantumkan alat MCP yang memenuhi syarat melalui runtime MCP sesi.
4. Menambahkan alat klien yang memenuhi syarat yang disediakan untuk eksekusi saat ini.
5. Mengindeks deskriptor ringkas untuk pencarian.
6. Mengekspos bridge kode PI atau alat fallback terstruktur kepada model.

Pada waktu eksekusi, setiap panggilan alat nyata kembali ke OpenClaw. Runtime Node terisolasi tidak menyimpan implementasi Plugin, objek klien MCP, atau rahasia. `openclaw.tools.call(...)` menyeberangi bridge kembali ke Gateway, tempat kebijakan, persetujuan, hook, pencatatan log, dan penanganan hasil normal tetap berlaku.

## Mode

`tools.toolSearch` memiliki dua mode yang terlihat oleh model:

- `code`: mengekspos `tool_search_code`, bridge JavaScript ringkas default.
- `tools`: mengekspos `tool_search`, `tool_describe`, dan `tool_call` sebagai alat terstruktur biasa untuk penyedia yang tidak boleh menerima kode.

Kedua mode menggunakan katalog dan jalur eksekusi yang sama. Satu-satunya perbedaan adalah bentuk yang dilihat model. Jika runtime saat ini tidak dapat meluncurkan proses anak mode kode Node terisolasi, mode default `code` akan fallback ke `tools` sebelum pemadatan katalog.

Tidak ada konfigurasi pemilihan sumber terpisah. Ketika Pencarian Alat diaktifkan, katalog mencakup alat OpenClaw, MCP, dan klien yang memenuhi syarat setelah penyaringan kebijakan normal.

## Mengapa ini ada

Katalog besar berguna tetapi mahal. Mengirim setiap skema alat ke model membuat permintaan lebih besar, memperlambat perencanaan, dan meningkatkan pemilihan alat yang tidak disengaja.

Pencarian Alat mengubah bentuknya:

- alat langsung: model melihat setiap skema terpilih sebelum token pertama
- mode kode Pencarian Alat: model melihat satu alat kode ringkas dan kontrak API singkat
- mode alat Pencarian Alat: model melihat tiga alat fallback terstruktur ringkas
- selama giliran: model hanya memuat skema alat yang benar-benar dibutuhkannya

Eksposur alat langsung tetap menjadi default yang tepat untuk katalog kecil. Pencarian Alat paling baik saat satu eksekusi dapat melihat banyak alat, terutama dari server MCP atau alat aplikasi yang disediakan klien.

## API

`openclaw.tools.search(query, options?)`

Mencari katalog efektif untuk eksekusi saat ini. Hasilnya ringkas dan aman untuk dimasukkan kembali ke konteks prompt.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

Memuat metadata lengkap untuk satu hasil pencarian, termasuk skema input yang tepat.

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

Bridge kode berjalan dalam subproses Node berumur pendek. Subproses dimulai dengan mode izin Node diaktifkan, lingkungan kosong, tanpa izin filesystem atau jaringan, dan tanpa izin proses anak atau worker. OpenClaw memberlakukan timeout waktu dinding proses induk dan mematikan subproses saat timeout, termasuk setelah kelanjutan asinkron.

Runtime hanya mengekspos:

- `console.log`, `console.warn`, dan `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

Perilaku OpenClaw normal tetap berlaku untuk panggilan akhir:

- kebijakan izinkan dan tolak alat
- pembatasan alat per agen dan per sandbox
- gating khusus pemilik
- hook persetujuan
- hook Plugin `before_tool_call`
- identitas sesi, log, dan telemetri

## Konfigurasi

Aktifkan Pencarian Alat untuk eksekusi PI dengan bridge kode default:

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

Gunakan alat fallback terstruktur sebagai gantinya untuk eksekusi PI:

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
- ukuran katalog dan rincian sumber
- jumlah pencarian, deskripsi, dan panggilan
- panggilan alat akhir yang dieksekusi melalui OpenClaw
- id dan sumber alat terpilih

Log sesi harus memungkinkan untuk menjawab:

- berapa banyak skema alat yang dilihat model sejak awal
- berapa banyak operasi pencarian dan deskripsi yang dilakukannya
- alat akhir mana yang dipanggil
- apakah hasil berasal dari OpenClaw, MCP, atau alat klien

## Validasi E2E

Runner E2E Gateway membuktikan kedua jalur dengan harness PI:

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

Ini membuat Plugin palsu sementara dengan katalog alat besar, memulai penyedia OpenAI tiruan, memulai Gateway sekali dalam mode langsung dan sekali dengan Pencarian Alat diaktifkan, lalu membandingkan payload permintaan penyedia dan log sesi.

Regresi membuktikan:

1. Mode langsung dapat memanggil alat Plugin palsu.
2. Pencarian Alat dapat memanggil alat Plugin palsu yang sama.
3. Mode langsung mengekspos skema alat Plugin palsu langsung ke penyedia.
4. Pencarian Alat hanya mengekspos bridge ringkas.
5. Payload permintaan Pencarian Alat lebih kecil untuk katalog palsu yang besar.
6. Log sesi menampilkan jumlah panggilan alat yang diharapkan dan telemetri panggilan yang melalui bridge.

## Perilaku kegagalan

Pencarian Alat harus gagal secara tertutup:

- jika suatu alat tidak ada dalam kebijakan efektif, pencarian tidak boleh mengembalikannya
- jika alat terpilih menjadi tidak tersedia, `tool_call` harus gagal
- jika kebijakan atau persetujuan memblokir eksekusi, hasil panggilan harus melaporkan blokir tersebut, bukan melewatinya
- jika bridge kode tidak dapat membuat runtime terisolasi, gunakan `mode: "tools"` atau nonaktifkan Pencarian Alat untuk deployment tersebut

## Terkait

- [Alat dan Plugin](/id/tools)
- [Sandbox multi-agen dan alat](/id/tools/multi-agent-sandbox-tools)
- [Alat exec](/id/tools/exec)
- [Penyiapan agen ACP](/id/tools/acp-agents-setup)
- [Membangun Plugin](/id/plugins/building-plugins)
