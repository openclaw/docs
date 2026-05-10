---
read_when:
    - Mengerjakan kontrol telemetri / privasi
    - Pertanyaan tentang data apa yang dikumpulkan
summary: Telemetri instalasi dikumpulkan melalui `clawhub sync` + opsi tidak ikut serta.
x-i18n:
    generated_at: "2026-05-10T19:26:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub menggunakan **telemetri minimal** untuk menghitung **jumlah pemasangan** (apa yang benar-benar digunakan) dan mendukung pengurutan/penyaringan yang lebih baik.
Ini didasarkan pada perintah CLI `clawhub sync`.

## Kapan telemetri dikumpulkan

Telemetri hanya dikirim ketika:

- Anda **sudah masuk** di CLI (kami sudah mewajibkan autentikasi untuk alur sinkronisasi/publikasi).
- Anda menjalankan `clawhub sync`.
- Telemetri **tidak dinonaktifkan** (lihat “Cara menonaktifkan” di bawah).

Jika Anda belum masuk, tidak ada yang dilaporkan.

## Apa yang kami kumpulkan

Pada setiap `clawhub sync`, CLI melaporkan **snapshot lengkap** dari apa yang ditemukannya, dikelompokkan berdasarkan root pemindaian (“folder/root”).

Untuk setiap root, kami menyimpan:

- `rootId`: **hash SHA-256** dari jalur root kanonis (server tidak pernah melihat jalur mentah).
- `label`: label yang dapat dibaca manusia, berasal dari dua segmen jalur terakhir (jalur home ditampilkan dengan `~`).
- `firstSeenAt`, `lastSeenAt`, `expiredAt` opsional.

Untuk setiap Skills yang ditemukan di bawah sebuah root, kami menyimpan:

- `skillId` (diresolusikan berdasarkan slug; hanya Skills yang ada di registri yang dilacak).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (upaya terbaik; saat ini versi yang cocok dengan registri jika diketahui).
- `removedAt` opsional ketika pemasangan yang sebelumnya dilaporkan menghilang dari sebuah root.

### Apa yang _tidak_ kami kumpulkan

- Tidak ada jalur folder absolut mentah (hanya `rootId` yang di-hash + label tampilan singkat).
- Tidak ada isi file.
- Tidak ada log per proses, prompt, atau keluaran CLI lainnya.
- Tidak ada pelacakan untuk Skills yang belum diunggah ke registri (slug yang tidak dikenal diabaikan).

## Jumlah pemasangan

Kami mempertahankan dua penghitung per Skills:

- `installsCurrent`: pengguna unik yang saat ini memiliki Skills terpasang di setidaknya satu root aktif.
- `installsAllTime`: pengguna unik yang pernah melaporkan Skills tersebut terpasang.

### Beberapa root

Jika Anda menyinkronkan dari beberapa folder, kami memperlakukan setiap root pemindaian secara independen. Sebuah Skills dianggap “saat ini terpasang” jika ada di **root aktif mana pun**.

### Deteksi pencopotan

Karena `sync` melaporkan set lengkap per root:

- Jika sebuah Skills menghilang dari sebuah root pada sinkronisasi berikutnya, kami menandainya sebagai dihapus untuk root tersebut.
- Jika Skills tersebut dihapus dari semua root Anda, Skills itu tidak lagi dihitung dalam `installsCurrent`.
- `installsAllTime` tidak pernah berkurang kecuali Anda menghapus telemetri (lihat di bawah).

### Kedaluwarsa (120 hari)

Root yang tidak melaporkan telemetri selama **120 hari** ditandai kedaluwarsa dan pemasangannya berhenti dihitung dalam `installsCurrent`.
Ini dievaluasi secara malas (pada laporan telemetri berikutnya) untuk menghindari pekerjaan latar belakang.

## Transparansi + kontrol pengguna

ClawHub menyediakan tab “Terpasang” privat di profil Anda sendiri:

- Menampilkan root persis + Skills terpasang yang kami simpan.
- Menyertakan tampilan **ekspor JSON**.
- Menyertakan tindakan **Hapus telemetri** untuk menghapus semua telemetri tersimpan bagi akun Anda.

Orang lain hanya melihat **penghitung pemasangan teragregasi**; tidak ada orang lain yang dapat melihat root/folder Anda.

Menghapus akun Anda juga menghapus data telemetri Anda.

## Cara menonaktifkan telemetri

Atur variabel lingkungan:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Dengan pengaturan ini, CLI tidak akan mengirim telemetri selama `clawhub sync`.
