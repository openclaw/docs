---
read_when:
    - Anda ingin menyiapkan QMD sebagai backend memori Anda
    - Anda menginginkan fitur memori lanjutan seperti reranking atau jalur terindeks tambahan
summary: Sidecar pencarian local-first dengan BM25, vektor, pemeringkatan ulang, dan perluasan kueri
title: Mesin memori QMD
x-i18n:
    generated_at: "2026-06-28T22:33:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 14af147882829451f026f0b9b6cc052c6e2129626a4ab0d0b1c7b77a31c1c050
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) adalah sidecar pencarian local-first yang berjalan
bersama OpenClaw. QMD menggabungkan BM25, pencarian vektor, dan reranking dalam satu
binary, dan dapat mengindeks konten di luar berkas memori workspace Anda.

## Yang ditambahkan dibanding bawaan

- **Reranking dan perluasan kueri** untuk recall yang lebih baik.
- **Mengindeks direktori tambahan** -- dokumen proyek, catatan tim, apa pun di disk.
- **Mengindeks transkrip sesi** -- mengingat percakapan sebelumnya.
- **Sepenuhnya lokal** -- berjalan dengan plugin provider llama.cpp resmi dan
  mengunduh otomatis model GGUF.
- **Fallback otomatis** -- jika QMD tidak tersedia, OpenClaw beralih ke engine
  bawaan dengan mulus.

## Memulai

### Prasyarat

- Instal QMD: `npm install -g @tobilu/qmd` atau `bun install -g @tobilu/qmd`
- Build SQLite yang mengizinkan ekstensi (`brew install sqlite` di macOS).
- QMD harus berada di `PATH` Gateway.
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
OpenClaw lebih memilih koleksi QMD dan bentuk kueri MCP saat ini, tetapi tetap fallback ke
flag pola koleksi alternatif dan nama alat MCP lama saat diperlukan.
Rekonsiliasi saat boot juga membuat ulang koleksi terkelola yang usang kembali ke
pola kanonisnya ketika koleksi QMD lama dengan nama yang sama masih
ada.

## Cara kerja sidecar

- OpenClaw membuat koleksi dari berkas memori workspace Anda dan setiap
  `memory.qmd.paths` yang dikonfigurasi, lalu menjalankan `qmd update` ketika pengelola QMD
  dibuka dan secara berkala setelahnya (default setiap 5 menit). Refresh ini
  berjalan melalui subprocess QMD, bukan crawl filesystem dalam proses. Mode semantik
  juga menjalankan `qmd embed`.
- Koleksi workspace default melacak `MEMORY.md` plus pohon `memory/`.
  `memory.md` huruf kecil tidak diindeks sebagai berkas memori root.
- Scanner QMD sendiri mengabaikan path tersembunyi dan direktori dependensi/build
  umum seperti `.git`, `.cache`, `node_modules`, `vendor`, `dist`, dan
  `build`. Startup Gateway tidak menginisialisasi QMD secara default, sehingga cold boot
  menghindari impor runtime memori atau pembuatan watcher berumur panjang sebelum
  memori pertama kali digunakan.
- Jika Anda tetap ingin QMD diinisialisasi saat Gateway mulai, setel
  `memory.qmd.update.startup` ke `idle` atau `immediate`. Dengan
  `memory.qmd.update.onBoot: true`, startup menjalankan refresh awal. Dengan
  `onBoot: false`, startup melewati refresh langsung tersebut tetapi tetap membuka
  pengelola berumur panjang ketika interval update atau embed dikonfigurasi, sehingga QMD dapat
  memiliki watcher dan timer regulernya.
- Pencarian menggunakan `searchMode` yang dikonfigurasi (default: `search`; juga mendukung
  `vsearch` dan `query`). `search` hanya BM25, sehingga OpenClaw melewati probe
  kesiapan vektor semantik dan pemeliharaan embedding dalam mode tersebut. Jika suatu mode
  gagal, OpenClaw mencoba ulang dengan `qmd query`.
- Ketika `searchMode` adalah `query`, setel `memory.qmd.rerank` ke `false` untuk menggunakan jalur
  kueri hibrida QMD tanpa reranker. OpenClaw meneruskan `--no-rerank` ke jalur CLI
  QMD langsung dan `rerank: false` ke alat kueri MCP QMD. Opsi ini
  memerlukan QMD 2.1 atau yang lebih baru.
- Dengan rilis QMD yang mengiklankan filter multi-koleksi, OpenClaw mengelompokkan
  koleksi bersumber sama ke dalam satu pemanggilan pencarian QMD. Rilis QMD lama
  mempertahankan fallback per koleksi yang kompatibel.
- Jika QMD gagal sepenuhnya, OpenClaw fallback ke engine SQLite bawaan.
  Upaya berulang pada giliran chat melakukan back off singkat setelah kegagalan membuka sehingga
  binary yang hilang atau dependensi sidecar yang rusak tidak membuat badai percobaan ulang;
  `openclaw memory status` dan probe CLI sekali jalan tetap memeriksa ulang QMD secara langsung.

<Info>
Pencarian pertama mungkin lambat -- QMD mengunduh otomatis model GGUF (~2 GB) untuk
reranking dan perluasan kueri pada proses `qmd query` pertama.
</Info>

## Performa dan kompatibilitas pencarian

OpenClaw menjaga jalur pencarian QMD kompatibel dengan instalasi QMD saat ini dan lama.

Saat startup, OpenClaw memeriksa teks bantuan QMD yang terinstal sekali per pengelola. Jika
binary mengiklankan dukungan untuk beberapa filter koleksi, OpenClaw mencari semua
koleksi bersumber sama dengan satu perintah:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Ini menghindari memulai satu subprocess QMD untuk setiap koleksi durable-memory.
Koleksi transkrip sesi tetap berada dalam grup sumbernya sendiri, sehingga pencarian campuran
`memory` + `sessions` tetap memberi input diversifier hasil dari kedua
sumber.

Build QMD lama hanya menerima satu filter koleksi. Ketika OpenClaw mendeteksi salah satu
build tersebut, OpenClaw mempertahankan jalur kompatibilitas dan mencari setiap koleksi
secara terpisah sebelum menggabungkan dan mendeduplikasi hasil.

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
hasil pencarian. `memory_get` memahami prefiks ini dan membaca dari root
koleksi yang benar.

## Mengindeks transkrip sesi

Aktifkan pengindeksan sesi untuk mengingat percakapan sebelumnya. QMD membutuhkan sumber sesi
`memorySearch` umum dan eksportir transkrip QMD:

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

Transkrip diekspor sebagai giliran User/Assistant yang disanitasi ke dalam koleksi QMD
khusus di bawah `~/.openclaw/agents/<id>/qmd/sessions/`. Hanya menyetel
`memorySearch.experimental.sessionMemory` tidak mengekspor transkrip ke QMD.

Hit sesi tetap difilter oleh
[`tools.sessions.visibility`](/id/gateway/config-tools#toolssessions). Visibilitas default
`tree` tidak mengekspos sesi sesama agen yang tidak terkait. Jika sesi yang
dikirim Gateway harus dapat diingat dari sesi DM terpisah, setel
`tools.sessions.visibility: "agent"` secara sengaja.

## Cakupan pencarian

Secara default, hasil pencarian QMD dimunculkan dalam sesi langsung dan channel
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
jenis chat sehingga hasil kosong lebih mudah di-debug.

## Sitasi

Ketika `memory.citations` adalah `auto` atau `on`, cuplikan pencarian menyertakan footer
`Source: <path#line>`. Setel `memory.citations = "off"` untuk menghilangkan footer
sambil tetap meneruskan path ke agen secara internal.

## Kapan menggunakan

Pilih QMD ketika Anda membutuhkan:

- Reranking untuk hasil berkualitas lebih tinggi.
- Mencari dokumen atau catatan proyek di luar workspace.
- Mengingat percakapan sesi lampau.
- Pencarian sepenuhnya lokal tanpa kunci API.

Untuk setup yang lebih sederhana, [engine bawaan](/id/concepts/memory-builtin) bekerja dengan baik
tanpa dependensi tambahan.

## Pemecahan masalah

**QMD tidak ditemukan?** Pastikan binary berada di `PATH` Gateway. Jika OpenClaw
berjalan sebagai layanan, buat symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Jika `qmd --version` berfungsi di shell Anda tetapi OpenClaw masih melaporkan
`spawn qmd ENOENT`, proses Gateway kemungkinan memiliki `PATH` yang berbeda dari
shell interaktif Anda. Tetapkan binary secara eksplisit:

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

**Pencarian pertama sangat lambat?** QMD mengunduh model GGUF pada penggunaan pertama. Lakukan pre-warm
dengan `qmd query "test"` menggunakan direktori XDG yang sama dengan yang digunakan OpenClaw.

**Banyak subprocess QMD selama pencarian?** Perbarui QMD jika memungkinkan. OpenClaw menggunakan
satu proses untuk pencarian multi-koleksi bersumber sama hanya ketika QMD yang terinstal
mengiklankan dukungan untuk beberapa filter `-c`; jika tidak, OpenClaw mempertahankan fallback
per koleksi lama demi kebenaran.

**QMD hanya BM25 masih mencoba membangun llama.cpp?** Setel
`memory.qmd.searchMode = "search"`. OpenClaw memperlakukan mode tersebut sebagai hanya leksikal,
tidak menjalankan probe status vektor QMD atau pemeliharaan embedding, dan menyerahkan
pemeriksaan kesiapan semantik ke setup `vsearch` atau `query`.

**Pencarian timeout?** Tingkatkan `memory.qmd.limits.timeoutMs` (default: 4000ms).
Setel ke `120000` untuk hardware yang lebih lambat.

**Hasil kosong dalam chat grup?** Periksa `memory.qmd.scope` -- default hanya
mengizinkan sesi langsung dan channel.

**Pencarian memori root tiba-tiba terlalu luas?** Mulai ulang Gateway atau tunggu
rekonsiliasi startup berikutnya. OpenClaw membuat ulang koleksi terkelola yang usang
kembali ke pola kanonis `MEMORY.md` dan `memory/` ketika mendeteksi konflik
nama yang sama.

**Repo sementara yang terlihat workspace menyebabkan `ENAMETOOLONG` atau pengindeksan rusak?**
Traversal QMD saat ini mengikuti perilaku scanner QMD yang mendasarinya, bukan
aturan symlink bawaan OpenClaw. Simpan checkout monorepo sementara di bawah
direktori tersembunyi seperti `.tmp/` atau di luar root QMD yang diindeks hingga QMD mengekspos
traversal aman-siklus atau kontrol pengecualian eksplisit.

## Konfigurasi

Untuk permukaan konfigurasi lengkap (`memory.qmd.*`), mode pencarian, interval update,
aturan cakupan, dan semua knob lainnya, lihat
[referensi konfigurasi memori](/id/reference/memory-config).

## Terkait

- [Ikhtisar memori](/id/concepts/memory)
- [Engine memori bawaan](/id/concepts/memory-builtin)
- [Memori Honcho](/id/concepts/memory-honcho)
