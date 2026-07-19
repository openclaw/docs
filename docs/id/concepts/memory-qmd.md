---
read_when:
    - Anda ingin menyiapkan QMD sebagai backend memori Anda
    - Anda menginginkan fitur memori lanjutan seperti pemeringkatan ulang atau jalur terindeks tambahan
summary: Sidecar pencarian lokal-utama dengan BM25, vektor, pemeringkatan ulang, dan perluasan kueri
title: Mesin memori QMD
x-i18n:
    generated_at: "2026-07-19T04:54:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e41e8c0e3b0a0b365fdfc5f00d5f8dd81e90d4cf45c98ea203a64fc9b7d921f0
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) adalah sidecar pencarian yang mengutamakan penggunaan lokal dan berjalan
bersama OpenClaw. QMD menggabungkan BM25, pencarian vektor, dan pemeringkatan ulang dalam satu
biner, serta dapat mengindeks konten di luar berkas memori ruang kerja Anda.

## Keunggulannya dibandingkan bawaan

- **Pemeringkatan ulang dan perluasan kueri** untuk perolehan hasil yang lebih baik.
- **Mengindeks direktori tambahan** - dokumentasi proyek, catatan tim, atau apa pun yang ada di disk.
- **Mengindeks transkrip sesi** - mengingat percakapan sebelumnya.
- **Sepenuhnya lokal** - berjalan dengan plugin penyedia llama.cpp resmi dan
  mengunduh model GGUF secara otomatis.
- **Fallback otomatis** - jika QMD tidak tersedia, OpenClaw beralih ke
  mesin bawaan dengan mulus.

## Memulai

### Prasyarat

- Instal QMD: `npm install -g @tobilu/qmd` atau `bun install -g @tobilu/qmd`
- Build SQLite yang mengizinkan ekstensi (`brew install sqlite` di macOS).
- QMD harus tersedia di `PATH` milik gateway.
- macOS dan Linux langsung dapat digunakan. Dukungan terbaik untuk Windows tersedia melalui WSL2.

### Mengaktifkan

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw membuat direktori utama QMD mandiri di bawah
`~/.openclaw/agents/<agentId>/qmd/` dan mengelola siklus hidup sidecar
secara otomatis - koleksi, pembaruan, dan proses embedding ditangani untuk Anda.
OpenClaw mengutamakan bentuk koleksi dan kueri MCP QMD saat ini, tetapi beralih ke
flag pola koleksi alternatif dan nama alat MCP lama bila diperlukan.
Rekonsiliasi saat startup juga membuat ulang koleksi terkelola yang usang kembali ke
pola kanonisnya ketika koleksi QMD lama dengan nama yang sama masih
tersedia.

## Cara kerja sidecar

- OpenClaw membuat koleksi dari berkas memori ruang kerja Anda dan setiap
  `memory.qmd.paths` yang dikonfigurasi, lalu menjalankan `qmd update` saat pengelola QMD
  dibuka dan secara berkala setelahnya (`memory.qmd.update.interval`, nilai default
  `5m`). Penyegaran dijalankan melalui subproses QMD, bukan penelusuran sistem berkas
  dalam proses. Mode pencarian semantik juga menjalankan `qmd embed`
  (`memory.qmd.update.embedInterval`, nilai default `60m`).
- QMD tetap mengelola `index.sqlite`, konfigurasi koleksi YAML, dan unduhan
  modelnya sendiri di bawah direktori utama QMD per agen; semuanya merupakan artefak alat eksternal,
  bukan tabel status OpenClaw. Koordinasi milik OpenClaw hanya berada di SQLite:
  satu lease bersama membatasi pekerjaan embedding di seluruh agen, sedangkan satu lease dalam setiap
  basis data agen menserialkan penulisan koleksi, pembaruan, dan embedding agen tersebut.
  Runtime tidak lagi membuat sidecar penguncian berkas QMD. `openclaw doctor --fix`
  menghapus sidecar yang telah dihentikan hanya setelah membuktikan bahwa pemilik proses lamanya sudah tidak aktif.
  Peningkatan versi menggunakan peralihan menyeluruh: hentikan dan mulai ulang setiap proses OpenClaw yang
  berbagi direktori status sebelum menggunakan versi baru. Penulis QMD campuran versi lama/baru
  tidak didukung; runtime sengaja tidak melakukan penguncian ganda pada sidecar yang telah
  dihentikan.
- Koleksi ruang kerja default melacak `MEMORY.md` beserta pohon `memory/`.
  `memory.md` dengan huruf kecil tidak diindeks sebagai berkas memori tingkat akar.
- Pemindai QMD sendiri mengabaikan jalur tersembunyi dan direktori dependensi/build
  umum seperti `.git`, `.cache`, `node_modules`, `vendor`, `dist`, dan
  `build`. Startup Gateway tidak menginisialisasi QMD secara default
  (`memory.qmd.update.startup` memiliki nilai default `off`), sehingga boot awal tidak
  mengimpor runtime memori atau membuat pemantau berumur panjang sebelum
  memori pertama kali digunakan.
- Atur `memory.qmd.update.startup` menjadi `idle` atau `immediate` untuk tetap menginisialisasi QMD
  saat gateway dimulai. `memory.qmd.update.onBoot` memiliki nilai default `true` dan
  menjalankan penyegaran awal saat startup; atur menjadi `false` untuk melewati
  penyegaran langsung tersebut (pengelola berumur panjang tetap dibuka saat interval pembaruan atau
  embedding dikonfigurasi, sehingga QMD tetap mengelola pemantau/pengatur waktunya secara rutin).
- Pencarian menggunakan `searchMode` yang dikonfigurasi (nilai default: `search`; juga mendukung
  `vsearch` dan `query`). `search` hanya menggunakan BM25, sehingga OpenClaw melewati pemeriksaan
  kesiapan vektor semantik dan pemeliharaan embedding dalam mode tersebut. Jika suatu mode
  gagal, OpenClaw mencoba kembali dengan `qmd query`.
- Saat `searchMode` bernilai `query`, atur `memory.qmd.rerank` menjadi `false` untuk menggunakan
  jalur kueri hibrida QMD tanpa pemeringkat ulang (memerlukan QMD 2.1 atau yang lebih baru).
  OpenClaw meneruskan `--no-rerank` ke jalur CLI QMD langsung dan
  `rerank: false` ke alat kueri MCP QMD.
- Dengan rilis QMD yang menyatakan dukungan filter multikoleksi, OpenClaw mengelompokkan
  koleksi dari sumber yang sama dalam satu pemanggilan pencarian QMD. Rilis QMD lama
  tetap menggunakan fallback per koleksi yang kompatibel.
- Jika QMD gagal sepenuhnya, OpenClaw beralih ke mesin SQLite bawaan.
  Upaya berulang pada giliran percakapan akan menunggu sejenak setelah kegagalan pembukaan agar
  biner yang tidak tersedia atau dependensi sidecar yang rusak tidak menimbulkan badai percobaan ulang;
  `openclaw memory status` dan pemeriksaan CLI sekali jalan tetap memeriksa ulang QMD
  secara langsung.

<Info>
Pencarian pertama mungkin lambat - QMD mengunduh model GGUF (~2 GB) secara otomatis untuk
pemeringkatan ulang dan perluasan kueri saat `qmd query` pertama kali dijalankan.
</Info>

## Performa dan kompatibilitas pencarian

OpenClaw menjaga agar jalur pencarian QMD kompatibel dengan instalasi QMD
saat ini maupun yang lebih lama.

Saat startup, OpenClaw memeriksa teks bantuan QMD yang terinstal satu kali per pengelola. Jika
biner menyatakan dukungan untuk beberapa filter koleksi, OpenClaw
mencari semua koleksi dari sumber yang sama dengan satu perintah:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Hal ini menghindari pembuatan satu subproses QMD untuk setiap koleksi memori persisten.
Koleksi transkrip sesi tetap berada dalam kelompok sumbernya sendiri, sehingga pencarian gabungan
`memory` + `sessions` tetap memberikan masukan bagi penganekaragam hasil dari
kedua sumber.

Build QMD lama hanya menerima satu filter koleksi. Saat OpenClaw mendeteksi salah satu
build tersebut, OpenClaw mempertahankan jalur kompatibilitas dan mencari setiap koleksi
secara terpisah sebelum menggabungkan dan menghapus duplikasi hasil.

Untuk memeriksa kontrak yang terinstal secara manual, jalankan:

```bash
qmd --help | grep -i collection
```

Bantuan QMD saat ini menyebutkan penargetan satu atau beberapa koleksi. Bantuan versi lama
biasanya menjelaskan satu koleksi.

## Penggantian model

Variabel lingkungan model QMD diteruskan tanpa perubahan dari proses gateway,
sehingga Anda dapat menyesuaikan QMD secara global tanpa menambahkan konfigurasi OpenClaw baru:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Setelah mengubah model embedding, jalankan ulang embedding agar indeks sesuai dengan
ruang vektor baru.

## Mengindeks jalur tambahan

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

Cuplikan dari jalur tambahan muncul sebagai `qmd/<collection>/<relative-path>` dalam
hasil pencarian. `memory_get` memahami prefiks ini dan membaca dari
akar koleksi yang tepat.

## Mengindeks transkrip sesi

Aktifkan pengindeksan sesi untuk mengingat percakapan sebelumnya. QMD memerlukan
sumber sesi umum `memorySearch` dan pengekspor transkrip QMD:

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

Transkrip diekspor sebagai giliran Pengguna/Asisten yang telah disanitasi ke dalam koleksi QMD
khusus di bawah `~/.openclaw/agents/<id>/qmd/sessions/`. Mengatur hanya
`memorySearch.experimental.sessionMemory` tidak mengekspor transkrip ke
QMD.

Hasil sesi tetap difilter berdasarkan
[`tools.sessions.visibility`](/id/gateway/config-tools#toolssessions). Visibilitas
`tree` default mencakup sesi saat ini, sesi yang dibuat olehnya,
dan sesi grup agen yang sama yang dipantau melalui kesadaran grup sekitar. Dengan
`session.dmScope: "main"`, pengguna dalam penyiapan DM multipengguna berbagi sesi
utama dan dapat mengingat konten dari grup yang dipantaunya. Gunakan
`dmScope` per rekan untuk isolasi DM, atau atur visibilitas menjadi `"self"` agar tidak menggunakan pembacaan
sesi terpantau sekitar. Sesi agen yang sama lainnya yang tidak terkait tetap memerlukan
visibilitas `"agent"`.

## Cakupan pencarian

Secara default, hasil pencarian QMD hanya ditampilkan dalam sesi langsung (bukan
percakapan grup atau saluran). Konfigurasikan `memory.qmd.scope` untuk mengubahnya:

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

Cuplikan di atas adalah aturan default yang sebenarnya. Saat cakupan menolak pencarian,
OpenClaw mencatat peringatan beserta saluran dan jenis percakapan yang diturunkan agar hasil
kosong lebih mudah di-debug.

## Kutipan

Saat `memory.citations` bernilai `auto` atau `on`, cuplikan pencarian akan mendapatkan
footer `Source: <path>#L<line>` (atau `#L<start>-L<end>`) yang ditambahkan. Dalam mode `auto`,
footer hanya ditambahkan untuk sesi percakapan langsung. Atur
`memory.citations = "off"` untuk menghilangkan footer sambil tetap meneruskan jalur ke
agen secara internal.

## Kapan digunakan

Pilih QMD saat Anda memerlukan:

- Pemeringkatan ulang untuk hasil berkualitas lebih tinggi.
- Pencarian dokumentasi atau catatan proyek di luar ruang kerja.
- Mengingat percakapan sesi sebelumnya.
- Pencarian sepenuhnya lokal tanpa kunci API.

Untuk penyiapan yang lebih sederhana, [mesin bawaan](/id/concepts/memory-builtin) berfungsi dengan baik
tanpa dependensi tambahan.

## Pemecahan masalah

**QMD tidak ditemukan?** Pastikan biner tersedia di `PATH` milik gateway. Jika OpenClaw
berjalan sebagai layanan, buat symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Jika `qmd --version` berfungsi di shell Anda tetapi OpenClaw masih melaporkan
`spawn qmd ENOENT`, proses gateway kemungkinan memiliki `PATH` yang berbeda dari
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

Gunakan `command -v qmd` dalam lingkungan tempat QMD diinstal, lalu periksa kembali
dengan `openclaw memory status --deep`.

**Pencarian pertama sangat lambat?** QMD mengunduh model GGUF saat pertama kali digunakan. Lakukan pemanasan awal
dengan `qmd query "test"` menggunakan direktori XDG yang sama dengan yang digunakan OpenClaw.

**Banyak subproses QMD selama pencarian?** Perbarui QMD jika memungkinkan. OpenClaw
menggunakan satu proses untuk pencarian multikoleksi dari sumber yang sama hanya ketika
QMD yang terinstal menyatakan dukungan untuk beberapa filter `-c`; jika tidak,
OpenClaw mempertahankan fallback per koleksi yang lama demi ketepatan.

**QMD yang hanya menggunakan BM25 masih mencoba membangun llama.cpp?** Atur
`memory.qmd.searchMode = "search"`. OpenClaw memperlakukan mode tersebut sebagai
hanya leksikal, melewati pemeriksaan status vektor QMD dan pemeliharaan embedding, serta
menyerahkan pemeriksaan kesiapan semantik kepada penyiapan `vsearch` atau `query`.

**Pencarian kehabisan waktu?** Tingkatkan `memory.qmd.limits.timeoutMs` (nilai default: 4000ms).
Atur ke nilai yang lebih tinggi, misalnya `120000`, untuk perangkat keras yang lebih lambat. Batas ini berlaku untuk
perintah pencarian QMD sendiri selama pemanggilan `memory_search` oleh agen; penyiapan, sinkronisasi,
fallback bawaan, dan pekerjaan korpus tambahan tetap menggunakan tenggat waktunya sendiri yang lebih singkat.

**Hasil kosong dalam percakapan grup atau saluran?** Hal ini sudah diperkirakan dengan
`memory.qmd.scope` default, yang hanya mengizinkan sesi langsung. Tambahkan
aturan `allow` untuk jenis percakapan `group` atau `channel` jika Anda menginginkan hasil QMD
di sana.

**Pencarian memori tingkat akar tiba-tiba menjadi terlalu luas?** Mulai ulang gateway atau tunggu
rekonsiliasi startup berikutnya. OpenClaw membuat ulang koleksi terkelola yang usang
kembali ke pola kanonis `MEMORY.md` dan `memory/` saat
mendeteksi konflik nama yang sama.

**Repo sementara yang terlihat oleh ruang kerja menyebabkan `ENAMETOOLONG` atau pengindeksan rusak?**
Penelusuran QMD mengikuti pemindai QMD yang mendasarinya, bukan aturan symlink
bawaan OpenClaw. Simpan checkout monorepo sementara di dalam direktori
tersembunyi seperti `.tmp/` atau di luar root QMD yang diindeks hingga QMD menyediakan
penelusuran yang aman dari siklus atau kontrol pengecualian eksplisit.

## Konfigurasi

Untuk seluruh cakupan konfigurasi (`memory.qmd.*`), mode pencarian, interval pembaruan,
aturan cakupan, dan semua opsi lainnya, lihat
[Referensi konfigurasi memori](/id/reference/memory-config).

## Terkait

- [Ikhtisar memori](/id/concepts/memory)
- [Mesin memori bawaan](/id/concepts/memory-builtin)
- [Memori Honcho](/id/concepts/memory-honcho)
