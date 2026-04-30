---
read_when:
    - Anda ingin menyiapkan QMD sebagai backend memori Anda
    - Anda menginginkan fitur memori lanjutan seperti reranking atau jalur terindeks tambahan
summary: Komponen pendamping pencarian yang mengutamakan lokal dengan BM25, vektor, pemeringkatan ulang, dan perluasan kueri
title: Mesin memori QMD
x-i18n:
    generated_at: "2026-04-30T09:43:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71980e3701f9a5ddcfbbfa41497ef51d2aae2993b2326591124cc0a87f9a849f
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) adalah sidecar pencarian yang mengutamakan lokal dan berjalan
bersama OpenClaw. QMD menggabungkan BM25, pencarian vektor, dan pemeringkatan ulang dalam satu
binary, serta dapat mengindeks konten di luar file memori workspace Anda.

## Yang ditambahkan dibanding bawaan

- **Pemeringkatan ulang dan perluasan kueri** untuk recall yang lebih baik.
- **Indeks direktori tambahan** -- dokumentasi proyek, catatan tim, apa pun di disk.
- **Indeks transkrip sesi** -- ingat kembali percakapan sebelumnya.
- **Sepenuhnya lokal** -- berjalan dengan paket runtime node-llama-cpp opsional dan
  mengunduh otomatis model GGUF.
- **Fallback otomatis** -- jika QMD tidak tersedia, OpenClaw beralih ke
  mesin bawaan tanpa hambatan.

## Memulai

### Prasyarat

- Instal QMD: `npm install -g @tobilu/qmd` atau `bun install -g @tobilu/qmd`
- Build SQLite yang mengizinkan ekstensi (`brew install sqlite` di macOS).
- QMD harus ada di `PATH` milik Gateway.
- macOS dan Linux langsung berfungsi. Windows paling baik didukung melalui WSL2.

### Aktifkan

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw membuat home QMD mandiri di bawah
`~/.openclaw/agents/<agentId>/qmd/` dan mengelola siklus hidup sidecar
secara otomatis -- koleksi, pembaruan, dan proses embedding ditangani untuk Anda.
OpenClaw mengutamakan koleksi QMD dan bentuk kueri MCP saat ini, tetapi tetap fallback ke
flag pola koleksi alternatif dan nama alat MCP lama saat diperlukan.
Rekonsiliasi saat boot juga membuat ulang koleksi terkelola yang usang kembali ke
pola kanonisnya ketika koleksi QMD lama dengan nama yang sama masih
ada.

## Cara kerja sidecar

- OpenClaw membuat koleksi dari file memori workspace Anda dan
  `memory.qmd.paths` apa pun yang dikonfigurasi, lalu menjalankan `qmd update` ketika manajer QMD
  dibuka dan secara berkala setelahnya (default setiap 5 menit). Penyegaran ini
  berjalan melalui subprocess QMD, bukan crawl filesystem dalam proses. Mode
  semantik juga menjalankan `qmd embed`.
- Koleksi workspace default melacak `MEMORY.md` ditambah tree `memory/`.
  `memory.md` huruf kecil tidak diindeks sebagai file memori root.
- Pemindai milik QMD mengabaikan path tersembunyi dan direktori dependensi/build
  umum seperti `.git`, `.cache`, `node_modules`, `vendor`, `dist`, dan
  `build`. Startup Gateway tidak menginisialisasi QMD secara default, sehingga boot dingin
  menghindari impor runtime memori atau pembuatan watcher berumur panjang sebelum
  memori pertama kali digunakan.
- Jika Anda tetap menginginkan penyegaran saat Gateway dimulai, set
  `memory.qmd.update.startup` ke `idle` atau `immediate`. Penyegaran startup
  opt-in menggunakan path subprocess QMD satu kali alih-alih membuat watcher
  dalam proses penuh yang berumur panjang.
- Pencarian menggunakan `searchMode` yang dikonfigurasi (default: `search`; juga mendukung
  `vsearch` dan `query`). `search` hanya BM25, sehingga OpenClaw melewati probe kesiapan
  vektor semantik dan pemeliharaan embedding dalam mode tersebut. Jika suatu mode
  gagal, OpenClaw mencoba lagi dengan `qmd query`.
- Dengan rilis QMD yang mengiklankan filter multi-koleksi, OpenClaw mengelompokkan
  koleksi dari sumber yang sama ke satu invocation pencarian QMD. Rilis QMD lama
  tetap memakai fallback per koleksi yang kompatibel.
- Jika QMD gagal sepenuhnya, OpenClaw fallback ke mesin SQLite bawaan.
  Upaya berulang pada giliran chat mundur sebentar setelah kegagalan membuka agar
  binary yang hilang atau dependensi sidecar yang rusak tidak membuat badai retry;
  `openclaw memory status` dan probe CLI satu kali tetap memeriksa ulang QMD secara langsung.

<Info>
Pencarian pertama mungkin lambat -- QMD mengunduh otomatis model GGUF (~2 GB) untuk
pemeringkatan ulang dan perluasan kueri pada proses `qmd query` pertama.
</Info>

## Performa pencarian dan kompatibilitas

OpenClaw menjaga path pencarian QMD tetap kompatibel dengan instalasi QMD saat ini
maupun yang lebih lama.

Saat startup, OpenClaw memeriksa teks bantuan QMD yang terinstal sekali per manajer. Jika
binary mengiklankan dukungan untuk beberapa filter koleksi, OpenClaw mencari semua
koleksi dari sumber yang sama dengan satu perintah:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Ini menghindari memulai satu subprocess QMD untuk setiap koleksi memori tahan lama.
Koleksi transkrip sesi tetap berada dalam grup sumbernya sendiri, sehingga pencarian campuran
`memory` + `sessions` tetap memberi input pendiversifikasi hasil dari kedua
sumber.

Build QMD lama hanya menerima satu filter koleksi. Ketika OpenClaw mendeteksi salah satu
build tersebut, OpenClaw mempertahankan path kompatibilitas dan mencari setiap koleksi
secara terpisah sebelum menggabungkan dan menghapus duplikasi hasil.

Untuk memeriksa kontrak yang terinstal secara manual, jalankan:

```bash
qmd --help | grep -i collection
```

Bantuan QMD saat ini mengatakan filter koleksi dapat menargetkan satu atau beberapa koleksi.
Bantuan lama biasanya menjelaskan satu koleksi.

## Override model

Variabel lingkungan model QMD diteruskan tanpa perubahan dari proses Gateway,
sehingga Anda dapat menyetel QMD secara global tanpa menambahkan konfigurasi OpenClaw baru:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Setelah mengubah model embedding, jalankan ulang embedding agar indeks cocok dengan
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
hasil pencarian. `memory_get` memahami prefix ini dan membaca dari root koleksi
yang benar.

## Mengindeks transkrip sesi

Aktifkan pengindeksan sesi untuk mengingat kembali percakapan sebelumnya:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Transkrip diekspor sebagai giliran User/Assistant yang disanitasi ke koleksi QMD
khusus di bawah `~/.openclaw/agents/<id>/qmd/sessions/`.

## Cakupan pencarian

Secara default, hasil pencarian QMD ditampilkan dalam sesi langsung dan channel
(bukan grup). Konfigurasikan `memory.qmd.scope` untuk mengubah ini:

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

Ketika cakupan menolak pencarian, OpenClaw mencatat peringatan dengan channel turunan dan
jenis chat agar hasil kosong lebih mudah di-debug.

## Sitasi

Ketika `memory.citations` adalah `auto` atau `on`, cuplikan pencarian menyertakan footer
`Source: <path#line>`. Set `memory.citations = "off"` untuk menghilangkan footer
sambil tetap meneruskan path ke agen secara internal.

## Kapan digunakan

Pilih QMD ketika Anda membutuhkan:

- Pemeringkatan ulang untuk hasil berkualitas lebih tinggi.
- Pencarian dokumentasi proyek atau catatan di luar workspace.
- Mengingat kembali percakapan sesi terdahulu.
- Pencarian sepenuhnya lokal tanpa kunci API.

Untuk setup yang lebih sederhana, [mesin bawaan](/id/concepts/memory-builtin) berfungsi baik
tanpa dependensi tambahan.

## Pemecahan masalah

**QMD tidak ditemukan?** Pastikan binary ada di `PATH` milik Gateway. Jika OpenClaw
berjalan sebagai layanan, buat symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Jika `qmd --version` berfungsi di shell Anda tetapi OpenClaw masih melaporkan
`spawn qmd ENOENT`, proses Gateway kemungkinan memiliki `PATH` yang berbeda dari
shell interaktif Anda. Pin binary secara eksplisit:

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

**Pencarian pertama sangat lambat?** QMD mengunduh model GGUF saat pertama kali digunakan. Lakukan pre-warm
dengan `qmd query "test"` menggunakan direktori XDG yang sama dengan yang digunakan OpenClaw.

**Banyak subprocess QMD selama pencarian?** Perbarui QMD jika memungkinkan. OpenClaw menggunakan
satu proses untuk pencarian multi-koleksi dari sumber yang sama hanya ketika QMD yang terinstal
mengiklankan dukungan untuk beberapa filter `-c`; jika tidak, OpenClaw mempertahankan fallback
per koleksi lama demi kebenaran.

**QMD hanya BM25 masih mencoba membangun llama.cpp?** Set
`memory.qmd.searchMode = "search"`. OpenClaw memperlakukan mode tersebut sebagai hanya leksikal,
tidak menjalankan probe status vektor QMD atau pemeliharaan embedding, dan menyerahkan
pemeriksaan kesiapan semantik ke setup `vsearch` atau `query`.

**Pencarian timeout?** Tingkatkan `memory.qmd.limits.timeoutMs` (default: 4000ms).
Set ke `120000` untuk perangkat keras yang lebih lambat.

**Hasil kosong di chat grup?** Periksa `memory.qmd.scope` -- default hanya
mengizinkan sesi langsung dan channel.

**Pencarian memori root tiba-tiba menjadi terlalu luas?** Mulai ulang Gateway atau tunggu
rekonsiliasi startup berikutnya. OpenClaw membuat ulang koleksi terkelola yang usang
kembali ke pola kanonis `MEMORY.md` dan `memory/` ketika mendeteksi konflik
nama yang sama.

**Repo sementara yang terlihat workspace menyebabkan `ENAMETOOLONG` atau pengindeksan rusak?**
Traversal QMD saat ini mengikuti perilaku pemindai QMD yang mendasari, bukan
aturan symlink bawaan OpenClaw. Simpan checkout monorepo sementara di bawah
direktori tersembunyi seperti `.tmp/` atau di luar root QMD yang diindeks sampai QMD mengekspos
traversal aman siklus atau kontrol pengecualian eksplisit.

## Konfigurasi

Untuk permukaan konfigurasi lengkap (`memory.qmd.*`), mode pencarian, interval pembaruan,
aturan cakupan, dan semua knob lainnya, lihat
[referensi konfigurasi Memori](/id/reference/memory-config).

## Terkait

- [Ringkasan memori](/id/concepts/memory)
- [Mesin memori bawaan](/id/concepts/memory-builtin)
- [Memori Honcho](/id/concepts/memory-honcho)
