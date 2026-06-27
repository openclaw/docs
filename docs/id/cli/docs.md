---
read_when:
    - Anda ingin mencari di dokumentasi OpenClaw langsung dari terminal
    - Anda perlu mengetahui API pencarian terhosting mana yang dipanggil oleh CLI docs
summary: Referensi CLI untuk `openclaw docs` (cari indeks dokumentasi langsung)
title: Dokumentasi
x-i18n:
    generated_at: "2026-06-27T17:18:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8be22f689d40ffec29df9562b69444c0f8b9bb607dfcb79de20b3023e0eb30a
    source_path: cli/docs.md
    workflow: 16
---

# `openclaw docs`

Cari indeks dokumentasi OpenClaw live dari terminal. Perintah ini memanggil API pencarian dokumentasi OpenClaw yang dihosting di Cloudflare dan menampilkan hasilnya di terminal Anda.

## Penggunaan

```bash
openclaw docs                       # print docs entrypoint and example search
openclaw docs <query...>            # search the live docs index
```

Argumen:

| Argumen      | Deskripsi                                                                          |
| ------------ | ---------------------------------------------------------------------------------- |
| `[query...]` | Kueri pencarian bentuk bebas. Kueri multi-kata digabungkan dengan spasi dan dikirim sebagai satu kueri. |

## Contoh

```bash
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Tanpa kueri, `openclaw docs` mencetak URL titik masuk dokumentasi beserta contoh perintah pencarian, alih-alih menjalankan pencarian.

## Cara kerjanya

`openclaw docs` memanggil `https://docs.openclaw.ai/api/search` dan menampilkan hasil JSON. Panggilan pencarian menggunakan batas waktu tetap 30 detik.

## Output

Di terminal kaya (TTY), hasil ditampilkan sebagai judul yang diikuti daftar berpoin. Setiap poin menampilkan judul halaman, URL dokumentasi yang ditautkan, dan cuplikan singkat pada baris berikutnya. Hasil kosong mencetak "Tidak ada hasil.".

Pada output non-kaya (disalurkan, `--no-color`, skrip), data yang sama ditampilkan sebagai Markdown:

```markdown
# Docs search: <query>

- [Title](https://docs.openclaw.ai/...) - snippet
- [Title](https://docs.openclaw.ai/...) - snippet
```

## Kode keluar

| Kode | Arti                                                              |
| ---- | ----------------------------------------------------------------- |
| `0`  | Pencarian berhasil (termasuk respons tanpa hasil).                |
| `1`  | Panggilan API pencarian dokumentasi yang dihosting gagal; stderr dicetak sebaris. |

## Terkait

- [Referensi CLI](/id/cli)
- [Dokumentasi live](https://docs.openclaw.ai)
