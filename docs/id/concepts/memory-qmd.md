---
read_when:
    - Anda ingin menyiapkan QMD sebagai backend memori Anda
    - Anda menginginkan fitur memori lanjutan seperti pemeringkatan ulang atau jalur terindeks tambahan
summary: Sidecar pencarian yang mengutamakan lokal dengan BM25, vektor, pemeringkatan ulang, dan perluasan kueri
title: Mesin memori QMD
x-i18n:
    generated_at: "2026-07-12T14:10:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) adalah sidecar pencarian yang mengutamakan operasi lokal dan berjalan
bersama OpenClaw. QMD menggabungkan BM25, pencarian vektor, dan pemeringkatan ulang dalam satu
biner, serta dapat mengindeks konten di luar berkas memori ruang kerja Anda.

## Keunggulan dibandingkan bawaan

- **Pemeringkatan ulang dan perluasan kueri** untuk cakupan hasil yang lebih baik.
- **Mengindeks direktori tambahan** - dokumentasi proyek, catatan tim, atau apa pun di disk.
- **Mengindeks transkrip sesi** - mengingat percakapan sebelumnya.
- **Sepenuhnya lokal** - berjalan dengan plugin penyedia llama.cpp resmi dan
  mengunduh model GGUF secara otomatis.
- **Peralihan otomatis** - jika QMD tidak tersedia, OpenClaw beralih ke mesin
  bawaan dengan mulus.

## Memulai

### Prasyarat

- Instal QMD: `npm install -g @tobilu/qmd` atau `bun install -g @tobilu/qmd`
- Build SQLite yang mengizinkan ekstensi (`brew install sqlite` di macOS).
- QMD harus tersedia di `PATH` Gateway.
- macOS dan Linux langsung berfungsi tanpa konfigurasi tambahan. Windows paling baik didukung melalui WSL2.

### Mengaktifkan

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw membuat direktori utama QMD mandiri di
`~/.openclaw/agents/<agentId>/qmd/` dan mengelola siklus hidup sidecar
secara otomatis - koleksi, pembaruan, dan proses embedding ditangani untuk Anda.
OpenClaw mengutamakan bentuk koleksi dan kueri MCP QMD terkini, tetapi beralih ke
flag pola koleksi alternatif dan nama alat MCP lama bila diperlukan.
Rekonsiliasi saat mulai juga membuat ulang koleksi terkelola yang usang agar kembali ke
pola kanonisnya ketika koleksi QMD lama dengan nama yang sama masih
tersedia.

## Cara kerja sidecar

- OpenClaw membuat koleksi dari berkas memori ruang kerja Anda dan
  `memory.qmd.paths` yang dikonfigurasi, lalu menjalankan `qmd update` ketika pengelola QMD
  dibuka dan secara berkala setelahnya (`memory.qmd.update.interval`, nilai bawaan
  `5m`). Penyegaran dijalankan melalui subproses QMD, bukan penelusuran sistem berkas
  dalam proses. Mode pencarian semantik juga menjalankan `qmd embed`
  (`memory.qmd.update.embedInterval`, nilai bawaan `60m`).
- Koleksi ruang kerja bawaan melacak `MEMORY.md` beserta struktur
  `memory/`. `memory.md` dengan huruf kecil tidak diindeks sebagai berkas memori utama.
- Pemindai QMD mengabaikan path tersembunyi dan direktori dependensi/build
  umum seperti `.git`, `.cache`, `node_modules`, `vendor`, `dist`, dan
  `build`. Saat mulai, Gateway tidak menginisialisasi QMD secara bawaan
  (`memory.qmd.update.startup` memiliki nilai bawaan `off`), sehingga proses mulai dingin tidak
  mengimpor runtime memori atau membuat pemantau berumur panjang sebelum
  memori pertama kali digunakan.
- Atur `memory.qmd.update.startup` ke `idle` atau `immediate` untuk tetap menginisialisasi QMD
  saat Gateway dimulai. `memory.qmd.update.onBoot` memiliki nilai bawaan `true` dan
  menjalankan penyegaran awal saat mulai; atur ke `false` untuk melewatkan
  penyegaran langsung tersebut (pengelola berumur panjang tetap dibuka ketika interval
  pembaruan atau embedding dikonfigurasi, sehingga QMD tetap mengelola pemantau/pengatur waktunya secara rutin).
- Pencarian menggunakan `searchMode` yang dikonfigurasi (nilai bawaan: `search`; juga mendukung
  `vsearch` dan `query`). `search` hanya menggunakan BM25, sehingga OpenClaw melewatkan
  pemeriksaan kesiapan vektor semantik dan pemeliharaan embedding dalam mode tersebut. Jika suatu mode
  gagal, OpenClaw mencoba kembali dengan `qmd query`.
- Ketika `searchMode` adalah `query`, atur `memory.qmd.rerank` ke `false` untuk menggunakan
  jalur kueri hibrida QMD tanpa pemeringkat ulang (memerlukan QMD 2.1 atau yang lebih baru).
  OpenClaw meneruskan `--no-rerank` ke jalur CLI QMD langsung dan
  `rerank: false` ke alat kueri MCP QMD.
- Dengan rilis QMD yang menyatakan dukungan filter multi-koleksi, OpenClaw mengelompokkan
  koleksi dari sumber yang sama ke dalam satu pemanggilan pencarian QMD. Rilis QMD lama
  tetap menggunakan peralihan per koleksi yang kompatibel.
- Jika QMD gagal sepenuhnya, OpenClaw beralih ke mesin SQLite bawaan.
  Upaya berulang pada giliran percakapan akan dijeda singkat setelah kegagalan membuka agar
  biner yang tidak tersedia atau dependensi sidecar yang rusak tidak menimbulkan banjir percobaan ulang;
  `openclaw memory status` dan pemeriksaan CLI sekali jalan tetap memeriksa ulang QMD
  secara langsung.

<Info>
Pencarian pertama mungkin lambat - QMD mengunduh model GGUF (~2 GB) secara otomatis untuk
pemeringkatan ulang dan perluasan kueri saat `qmd query` pertama kali dijalankan.
</Info>

## Performa dan kompatibilitas pencarian

OpenClaw menjaga agar jalur pencarian QMD tetap kompatibel dengan instalasi QMD
terkini maupun lama.

Saat mulai, OpenClaw memeriksa teks bantuan QMD yang terinstal satu kali per pengelola. Jika
biner tersebut menyatakan dukungan untuk beberapa filter koleksi, OpenClaw
mencari semua koleksi dari sumber yang sama dengan satu perintah:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Ini menghindari dimulainya satu subproses QMD untuk setiap koleksi memori persisten.
Koleksi transkrip sesi tetap berada dalam kelompok sumbernya sendiri, sehingga pencarian campuran
`memory` + `sessions` tetap memberi masukan dari kedua sumber kepada
penganekaragam hasil.

Build QMD lama hanya menerima satu filter koleksi. Ketika OpenClaw mendeteksi salah satu
build tersebut, OpenClaw mempertahankan jalur kompatibilitas dan mencari setiap koleksi
secara terpisah sebelum menggabungkan serta menghapus hasil duplikat.

Untuk memeriksa kontrak yang terinstal secara manual, jalankan:

```bash
qmd --help | grep -i collection
```

Bantuan QMD terkini menyebutkan penargetan satu atau beberapa koleksi. Bantuan versi lama
biasanya menjelaskan satu koleksi.

## Penggantian model

Variabel lingkungan model QMD diteruskan tanpa perubahan dari proses Gateway,
sehingga Anda dapat menyesuaikan QMD secara global tanpa menambahkan konfigurasi OpenClaw baru:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Setelah mengubah model embedding, jalankan ulang embedding agar indeks sesuai dengan
ruang vektor baru.

## Mengindeks path tambahan

Arahkan QMD ke direktori tambahan agar dapat dicari:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Cuplikan dari path tambahan muncul sebagai `qmd/<collection>/<relative-path>` dalam
hasil pencarian. `memory_get` memahami prefiks ini dan membaca dari
root koleksi yang benar.

## Mengindeks transkrip sesi

Aktifkan pengindeksan sesi untuk mengingat percakapan sebelumnya. QMD memerlukan sumber sesi
`memorySearch` umum dan pengekspor transkrip QMD:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Transkrip diekspor sebagai giliran Pengguna/Asisten yang telah disanitasi ke koleksi QMD
khusus di bawah `~/.openclaw/agents/<id>/qmd/sessions/`. Hanya mengatur
`memorySearch.experimental.sessionMemory` tidak mengekspor transkrip ke
QMD.

Hasil sesi tetap difilter berdasarkan
[`tools.sessions.visibility`](/id/gateway/config-tools#toolssessions). Visibilitas
bawaan `tree` tidak mengekspos sesi agen yang sama tetapi tidak terkait. Jika sesi yang
dikirim oleh Gateway harus dapat diingat dari sesi pesan langsung terpisah,
atur `tools.sessions.visibility: "agent"` secara sengaja.

## Cakupan pencarian

Secara bawaan, hasil pencarian QMD hanya ditampilkan dalam sesi langsung (bukan
percakapan grup atau kanal). Konfigurasikan `memory.qmd.scope` untuk mengubahnya:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Cuplikan di atas adalah aturan bawaan yang sebenarnya. Ketika cakupan menolak pencarian,
OpenClaw mencatat peringatan dengan kanal dan jenis percakapan yang diturunkan agar
hasil kosong lebih mudah di-debug.

## Sitasi

Ketika `memory.citations` adalah `auto` atau `on`, cuplikan pencarian mendapatkan catatan kaki
`Source: <path>#L<line>` (atau `#L<start>-L<end>`) yang ditambahkan. Dalam mode `auto`,
catatan kaki hanya ditambahkan untuk sesi percakapan langsung. Atur
`memory.citations = "off"` untuk menghilangkan catatan kaki sambil tetap meneruskan path kepada
agen secara internal.

## Kapan digunakan

Pilih QMD ketika Anda memerlukan:

- Pemeringkatan ulang untuk hasil berkualitas lebih tinggi.
- Pencarian dokumentasi atau catatan proyek di luar ruang kerja.
- Mengingat percakapan sesi sebelumnya.
- Pencarian sepenuhnya lokal tanpa kunci API.

Untuk penyiapan yang lebih sederhana, [mesin bawaan](/id/concepts/memory-builtin) bekerja dengan baik
tanpa dependensi tambahan.

## Pemecahan masalah

**QMD tidak ditemukan?** Pastikan biner tersedia di `PATH` Gateway. Jika OpenClaw
berjalan sebagai layanan, buat symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Jika `qmd --version` berfungsi di shell Anda tetapi OpenClaw masih melaporkan
`spawn qmd ENOENT`, proses Gateway kemungkinan memiliki `PATH` yang berbeda dari
shell interaktif Anda. Tetapkan biner secara eksplisit:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

Gunakan `command -v qmd` di lingkungan tempat QMD diinstal, lalu periksa ulang
dengan `openclaw memory status --deep`.

**Pencarian pertama sangat lambat?** QMD mengunduh model GGUF saat pertama kali digunakan. Lakukan pemanasan awal
dengan `qmd query "test"` menggunakan direktori XDG yang sama dengan yang digunakan OpenClaw.

**Banyak subproses QMD selama pencarian?** Perbarui QMD jika memungkinkan. OpenClaw
menggunakan satu proses untuk pencarian multi-koleksi dari sumber yang sama hanya ketika
QMD yang terinstal menyatakan dukungan untuk beberapa filter `-c`; jika tidak,
OpenClaw mempertahankan peralihan per koleksi versi lama demi ketepatan.

**QMD khusus BM25 masih mencoba membangun llama.cpp?** Atur
`memory.qmd.searchMode = "search"`. OpenClaw memperlakukan mode tersebut sebagai
khusus leksikal, melewatkan pemeriksaan status vektor QMD dan pemeliharaan embedding, serta
menyerahkan pemeriksaan kesiapan semantik kepada penyiapan `vsearch` atau `query`.

**Waktu pencarian habis?** Tingkatkan `memory.qmd.limits.timeoutMs` (nilai bawaan:
4000ms). Atur lebih tinggi, misalnya `120000`, untuk perangkat keras yang lebih lambat.

**Hasil kosong dalam percakapan grup atau kanal?** Hal ini memang diharapkan dengan
`memory.qmd.scope` bawaan, yang hanya mengizinkan sesi langsung. Tambahkan aturan
`allow` untuk jenis percakapan `group` atau `channel` jika Anda menginginkan hasil QMD
di sana.

**Pencarian memori root tiba-tiba menjadi terlalu luas?** Mulai ulang Gateway atau tunggu
rekonsiliasi saat mulai berikutnya. OpenClaw membuat ulang koleksi terkelola yang usang
agar kembali ke pola kanonis `MEMORY.md` dan `memory/` ketika
mendeteksi konflik nama yang sama.

**Repositori sementara yang terlihat oleh ruang kerja menyebabkan `ENAMETOOLONG` atau pengindeksan rusak?**
Penelusuran QMD mengikuti pemindai QMD yang mendasarinya, bukan aturan symlink
bawaan OpenClaw. Simpan checkout monorepo sementara di bawah direktori
tersembunyi seperti `.tmp/` atau di luar root QMD yang diindeks hingga QMD menyediakan
penelusuran yang aman dari siklus atau kontrol pengecualian eksplisit.

## Konfigurasi

Untuk seluruh permukaan konfigurasi (`memory.qmd.*`), mode pencarian, interval pembaruan,
aturan cakupan, dan semua pengaturan lainnya, lihat
[referensi konfigurasi memori](/id/reference/memory-config).

## Terkait

- [Ikhtisar memori](/id/concepts/memory)
- [Mesin memori bawaan](/id/concepts/memory-builtin)
- [Memori Honcho](/id/concepts/memory-honcho)
