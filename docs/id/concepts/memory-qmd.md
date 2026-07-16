---
read_when:
    - Anda ingin menyiapkan QMD sebagai backend memori Anda
    - Anda menginginkan fitur memori tingkat lanjut seperti pemeringkatan ulang atau jalur tambahan yang diindeks
summary: Sidecar pencarian yang mengutamakan lokal dengan BM25, vektor, pemeringkatan ulang, dan perluasan kueri
title: Mesin memori QMD
x-i18n:
    generated_at: "2026-07-16T18:00:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b13017ead7e7340624a35e603a18216a5c23405cbab09e7f53b1e15d74d59d23
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) adalah sidecar pencarian yang mengutamakan operasi lokal dan berjalan
bersama OpenClaw. QMD menggabungkan BM25, pencarian vektor, dan pemeringkatan ulang dalam satu
biner, serta dapat mengindeks konten selain berkas memori ruang kerja Anda.

## Keunggulannya dibandingkan mesin bawaan

- **Pemeringkatan ulang dan perluasan kueri** untuk perolehan hasil yang lebih baik.
- **Indeks direktori tambahan** - dokumentasi proyek, catatan tim, apa pun yang ada di disk.
- **Indeks transkrip sesi** - mengingat percakapan sebelumnya.
- **Sepenuhnya lokal** - berjalan dengan plugin penyedia llama.cpp resmi dan
  mengunduh model GGUF secara otomatis.
- **Fallback otomatis** - jika QMD tidak tersedia, OpenClaw beralih kembali ke
  mesin bawaan dengan mulus.

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

OpenClaw membuat direktori utama QMD yang mandiri di bawah
`~/.openclaw/agents/<agentId>/qmd/` dan mengelola siklus hidup sidecar
secara otomatis - koleksi, pembaruan, dan proses embedding ditangani untuk Anda.
OpenClaw mengutamakan bentuk koleksi dan kueri MCP QMD terkini, tetapi beralih kembali ke
flag pola koleksi alternatif dan nama alat MCP lama bila diperlukan.
Rekonsiliasi saat awal juga membuat ulang koleksi terkelola yang usang kembali ke
pola kanonisnya ketika koleksi QMD lama dengan nama yang sama masih
tersedia.

## Cara kerja sidecar

- OpenClaw membuat koleksi dari berkas memori ruang kerja Anda dan setiap
  `memory.qmd.paths` yang dikonfigurasi, lalu menjalankan `qmd update` ketika pengelola QMD
  dibuka dan secara berkala setelahnya (`memory.qmd.update.interval`, nilai default
  `5m`). Penyegaran dijalankan melalui subproses QMD, bukan penelusuran sistem berkas
  dalam proses. Mode pencarian semantik juga menjalankan `qmd embed`
  (`memory.qmd.update.embedInterval`, nilai default `60m`).
- Koleksi ruang kerja default melacak `MEMORY.md` beserta pohon `memory/`.
  `memory.md` dengan huruf kecil tidak diindeks sebagai berkas memori akar.
- Pemindai QMD sendiri mengabaikan jalur tersembunyi dan direktori dependensi/build
  umum seperti `.git`, `.cache`, `node_modules`, `vendor`, `dist`, dan
  `build`. Secara default, proses awal Gateway tidak menginisialisasi QMD
  (`memory.qmd.update.startup` menggunakan nilai default `off`), sehingga proses awal dingin tidak
  mengimpor runtime memori atau membuat pemantau berumur panjang sebelum
  memori pertama kali digunakan.
- Tetapkan `memory.qmd.update.startup` ke `idle` atau `immediate` untuk tetap menginisialisasi QMD
  saat Gateway dimulai. `memory.qmd.update.onBoot` menggunakan nilai default `true` dan
  menjalankan penyegaran awal saat dimulai; tetapkan ke `false` untuk melewati
  penyegaran langsung tersebut (pengelola berumur panjang tetap terbuka ketika interval
  pembaruan atau embedding dikonfigurasi, sehingga QMD tetap mengelola pemantau/pengatur waktu
  regulernya).
- Pencarian menggunakan `searchMode` yang dikonfigurasi (nilai default: `search`; juga mendukung
  `vsearch` dan `query`). `search` hanya menggunakan BM25, sehingga OpenClaw melewati pemeriksaan
  kesiapan vektor semantik dan pemeliharaan embedding dalam mode tersebut. Jika suatu mode
  gagal, OpenClaw mencoba kembali dengan `qmd query`.
- Ketika `searchMode` bernilai `query`, tetapkan `memory.qmd.rerank` ke `false` untuk menggunakan
  jalur kueri hibrida QMD tanpa pemeringkat ulang (memerlukan QMD 2.1 atau yang lebih baru).
  OpenClaw meneruskan `--no-rerank` ke jalur CLI QMD langsung dan
  `rerank: false` ke alat kueri MCP QMD.
- Dengan rilis QMD yang menyatakan dukungan filter multikoleksi, OpenClaw mengelompokkan
  koleksi dengan sumber yang sama ke dalam satu pemanggilan pencarian QMD. Rilis QMD lama
  mempertahankan fallback per koleksi yang kompatibel.
- Jika QMD gagal sepenuhnya, OpenClaw beralih kembali ke mesin SQLite bawaan.
  Upaya berulang pada giliran percakapan dijeda sebentar setelah kegagalan pembukaan agar
  biner yang hilang atau dependensi sidecar yang rusak tidak menimbulkan rentetan percobaan ulang;
  `openclaw memory status` dan pemeriksaan CLI sekali jalan tetap memeriksa ulang QMD
  secara langsung.

<Info>
Pencarian pertama mungkin lambat - QMD mengunduh model GGUF (~2 GB) secara otomatis untuk
pemeringkatan ulang dan perluasan kueri pada proses `qmd query` pertama.
</Info>

## Performa dan kompatibilitas pencarian

OpenClaw menjaga jalur pencarian QMD agar kompatibel dengan instalasi QMD
terkini maupun lama.

Saat dimulai, OpenClaw memeriksa teks bantuan QMD yang terinstal satu kali per pengelola. Jika
biner tersebut menyatakan dukungan untuk beberapa filter koleksi, OpenClaw
mencari semua koleksi dengan sumber yang sama menggunakan satu perintah:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Hal ini mencegah dimulainya satu subproses QMD untuk setiap koleksi memori persisten.
Koleksi transkrip sesi tetap berada dalam grup sumbernya sendiri, sehingga pencarian gabungan
`memory` + `sessions` tetap memberikan masukan dari kedua sumber kepada
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

## Mengindeks jalur tambahan

Arahkan QMD ke direktori tambahan agar direktori tersebut dapat dicari:

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
akar koleksi yang benar.

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

Transkrip diekspor sebagai giliran Pengguna/Asisten yang telah disanitasi ke dalam koleksi QMD
khusus di bawah `~/.openclaw/agents/<id>/qmd/sessions/`. Menetapkan hanya
`memorySearch.experimental.sessionMemory` tidak mengekspor transkrip ke
QMD.

Hasil sesi tetap difilter berdasarkan
[`tools.sessions.visibility`](/id/gateway/config-tools#toolssessions). Visibilitas
`tree` default tidak mengekspos sesi lain yang tidak terkait dari agen yang sama. Jika sesi
yang dikirim oleh Gateway perlu dapat diingat dari sesi DM terpisah,
tetapkan `tools.sessions.visibility: "agent"` secara sengaja.

## Cakupan pencarian

Secara default, hasil pencarian QMD hanya ditampilkan dalam sesi langsung (bukan
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

Cuplikan di atas merupakan aturan default yang sebenarnya. Ketika cakupan menolak pencarian,
OpenClaw mencatat peringatan dengan kanal dan jenis percakapan yang diturunkan agar hasil
kosong lebih mudah di-debug.

## Kutipan

Ketika `memory.citations` bernilai `auto` atau `on`, cuplikan pencarian akan mendapatkan
footer `Source: <path>#L<line>` (atau `#L<start>-L<end>`). Dalam mode `auto`,
footer hanya ditambahkan untuk sesi percakapan langsung. Tetapkan
`memory.citations = "off"` untuk menghilangkan footer sambil tetap meneruskan jalur kepada
agen secara internal.

## Waktu penggunaan

Pilih QMD ketika Anda memerlukan:

- Pemeringkatan ulang untuk hasil berkualitas lebih tinggi.
- Pencarian dokumentasi proyek atau catatan di luar ruang kerja.
- Mengingat percakapan sesi sebelumnya.
- Pencarian sepenuhnya lokal tanpa kunci API.

Untuk penyiapan yang lebih sederhana, [mesin bawaan](/id/concepts/memory-builtin) berfungsi dengan baik
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

**Pencarian pertama sangat lambat?** QMD mengunduh model GGUF saat penggunaan pertama. Lakukan pemanasan awal
dengan `qmd query "test"` menggunakan direktori XDG yang sama dengan yang digunakan OpenClaw.

**Banyak subproses QMD selama pencarian?** Perbarui QMD jika memungkinkan. OpenClaw
menggunakan satu proses untuk pencarian multikoleksi dengan sumber yang sama hanya ketika
QMD yang terinstal menyatakan dukungan untuk beberapa filter `-c`; jika tidak,
OpenClaw mempertahankan fallback per koleksi versi lama demi kebenaran hasil.

**QMD yang hanya menggunakan BM25 masih mencoba membangun llama.cpp?** Tetapkan
`memory.qmd.searchMode = "search"`. OpenClaw memperlakukan mode tersebut sebagai
khusus leksikal, melewati pemeriksaan status vektor QMD dan pemeliharaan embedding, serta
menyerahkan pemeriksaan kesiapan semantik kepada penyiapan `vsearch` atau `query`.

**Pencarian mengalami batas waktu?** Tingkatkan `memory.qmd.limits.timeoutMs` (nilai default: 4000ms).
Tetapkan nilai yang lebih tinggi, misalnya `120000`, untuk perangkat keras yang lebih lambat. Batas ini berlaku untuk
perintah pencarian QMD sendiri selama pemanggilan `memory_search` agen; penyiapan, sinkronisasi,
fallback bawaan, dan pekerjaan korpus tambahan memiliki tenggat waktunya sendiri yang lebih singkat.

**Hasil kosong dalam percakapan grup atau kanal?** Hal ini wajar dengan
`memory.qmd.scope` default, yang hanya mengizinkan sesi langsung. Tambahkan aturan
`allow` untuk jenis percakapan `group` atau `channel` jika Anda menginginkan hasil QMD
di sana.

**Pencarian memori akar tiba-tiba menjadi terlalu luas?** Mulai ulang Gateway atau tunggu
rekonsiliasi awal berikutnya. OpenClaw membuat ulang koleksi terkelola yang usang
kembali ke pola kanonis `MEMORY.md` dan `memory/` ketika
mendeteksi konflik dengan nama yang sama.

**Repositori sementara yang terlihat oleh ruang kerja menyebabkan `ENAMETOOLONG` atau pengindeksan rusak?**
Penelusuran QMD mengikuti pemindai QMD yang mendasarinya, bukan aturan symlink
bawaan OpenClaw. Simpan checkout monorepo sementara di bawah direktori
tersembunyi seperti `.tmp/` atau di luar akar QMD yang diindeks hingga QMD menyediakan
penelusuran yang aman dari siklus atau kontrol pengecualian eksplisit.

## Konfigurasi

Untuk seluruh cakupan konfigurasi (`memory.qmd.*`), mode pencarian, interval pembaruan,
aturan cakupan, dan semua opsi lainnya, lihat
[referensi konfigurasi memori](/id/reference/memory-config).

## Terkait

- [Ringkasan memori](/id/concepts/memory)
- [Mesin memori bawaan](/id/concepts/memory-builtin)
- [Memori Honcho](/id/concepts/memory-honcho)
