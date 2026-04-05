---
read_when:
    - Anda ingin menyiapkan QMD sebagai backend memori Anda
    - Anda menginginkan fitur memori lanjutan seperti reranking atau path terindeks tambahan
summary: Sidecar pencarian local-first dengan BM25, vektor, reranking, dan ekspansi kueri
title: Mesin Memori QMD
x-i18n:
    generated_at: "2026-04-05T13:51:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa8a31ec1a6cc83b6ab413b7dbed6a88055629251664119bfd84308ed166c58e
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# Mesin Memori QMD

[QMD](https://github.com/tobi/qmd) adalah sidecar pencarian local-first yang berjalan
bersama OpenClaw. Ini menggabungkan BM25, pencarian vektor, dan reranking dalam satu
biner, serta dapat mengindeks konten di luar file memori workspace Anda.

## Apa yang ditambahkan dibanding bawaan

- **Reranking dan ekspansi kueri** untuk recall yang lebih baik.
- **Mengindeks direktori tambahan** -- dokumen proyek, catatan tim, apa pun di disk.
- **Mengindeks transkrip sesi** -- mengingat percakapan sebelumnya.
- **Sepenuhnya lokal** -- berjalan melalui Bun + node-llama-cpp, mengunduh model GGUF secara otomatis.
- **Fallback otomatis** -- jika QMD tidak tersedia, OpenClaw akan kembali ke
  mesin bawaan dengan mulus.

## Memulai

### Prasyarat

- Instal QMD: `bun install -g @tobilu/qmd`
- Build SQLite yang mengizinkan ekstensi (`brew install sqlite` di macOS).
- QMD harus ada di `PATH` gateway.
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
secara otomatis -- koleksi, pembaruan, dan eksekusi embedding ditangani untuk Anda.

## Cara kerja sidecar

- OpenClaw membuat koleksi dari file memori workspace Anda dan semua
  `memory.qmd.paths` yang dikonfigurasi, lalu menjalankan `qmd update` + `qmd embed` saat boot
  dan secara berkala (default setiap 5 menit).
- Penyegaran saat boot berjalan di latar belakang agar startup chat tidak terblokir.
- Pencarian menggunakan `searchMode` yang dikonfigurasi (default: `search`; juga mendukung
  `vsearch` dan `query`). Jika sebuah mode gagal, OpenClaw mencoba lagi dengan `qmd query`.
- Jika QMD gagal sepenuhnya, OpenClaw kembali ke mesin SQLite bawaan.

<Info>
Pencarian pertama mungkin lambat -- QMD mengunduh model GGUF (~2 GB) secara otomatis untuk
reranking dan ekspansi kueri pada eksekusi pertama `qmd query`.
</Info>

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

Aktifkan pengindeksan sesi untuk mengingat percakapan sebelumnya:

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

Transkrip diekspor sebagai giliran User/Assistant yang disanitasi ke koleksi QMD khusus
di bawah `~/.openclaw/agents/<id>/qmd/sessions/`.

## Cakupan pencarian

Secara default, hasil pencarian QMD hanya ditampilkan di sesi DM (bukan grup atau
kanal). Konfigurasikan `memory.qmd.scope` untuk mengubah ini:

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

Ketika cakupan menolak pencarian, OpenClaw mencatat peringatan dengan kanal turunan dan
jenis chat sehingga hasil kosong lebih mudah di-debug.

## Sitasi

Ketika `memory.citations` adalah `auto` atau `on`, cuplikan pencarian menyertakan
footer `Source: <path#line>`. Setel `memory.citations = "off"` untuk menghilangkan footer
sambil tetap meneruskan path ke agen secara internal.

## Kapan digunakan

Pilih QMD ketika Anda memerlukan:

- Reranking untuk hasil berkualitas lebih tinggi.
- Mencari dokumen proyek atau catatan di luar workspace.
- Mengingat percakapan sesi sebelumnya.
- Pencarian sepenuhnya lokal tanpa API key.

Untuk penyiapan yang lebih sederhana, [mesin bawaan](/concepts/memory-builtin) bekerja baik
tanpa dependensi tambahan.

## Pemecahan masalah

**QMD tidak ditemukan?** Pastikan biner ada di `PATH` gateway. Jika OpenClaw
berjalan sebagai layanan, buat symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Pencarian pertama sangat lambat?** QMD mengunduh model GGUF saat pertama kali digunakan. Lakukan pre-warm
dengan `qmd query "test"` menggunakan direktori XDG yang sama dengan yang digunakan OpenClaw.

**Pencarian timeout?** Tingkatkan `memory.qmd.limits.timeoutMs` (default: 4000md).
Setel ke `120000` untuk perangkat keras yang lebih lambat.

**Hasil kosong di chat grup?** Periksa `memory.qmd.scope` -- default hanya
mengizinkan sesi DM.

**Repo sementara yang terlihat workspace menyebabkan `ENAMETOOLONG` atau pengindeksan rusak?**
Traversal QMD saat ini mengikuti perilaku pemindai QMD yang mendasarinya, bukan
aturan symlink bawaan OpenClaw. Simpan checkout monorepo sementara di bawah
direktori tersembunyi seperti `.tmp/` atau di luar root QMD yang diindeks sampai QMD menyediakan
traversal aman dari siklus atau kontrol pengecualian eksplisit.

## Konfigurasi

Untuk seluruh permukaan config (`memory.qmd.*`), mode pencarian, interval pembaruan,
aturan cakupan, dan semua pengaturan lainnya, lihat
[Referensi konfigurasi memori](/reference/memory-config).
