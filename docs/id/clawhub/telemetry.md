---
read_when:
    - Mengerjakan kontrol telemetri / privasi
    - Pertanyaan tentang data apa yang dikumpulkan
summary: Telemetri instalasi dikumpulkan melalui `clawhub sync` + opsi keluar.
x-i18n:
    generated_at: "2026-05-12T15:43:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub menggunakan **telemetri minimal** untuk menghitung **jumlah pemasangan** (yang benar-benar digunakan) dan mendukung pengurutan/penyaringan yang lebih baik.
Ini didasarkan pada perintah CLI `clawhub sync`.

## Kapan telemetri dikumpulkan

Telemetri hanya dikirim ketika:

- Anda **sudah masuk** di CLI (kami sudah mewajibkan autentikasi untuk alur sync/publish).
- Anda menjalankan `clawhub sync`.
- Telemetri **tidak dinonaktifkan** (lihat “Cara menonaktifkan” di bawah).

Jika Anda belum masuk, tidak ada yang dilaporkan.

## Apa yang kami kumpulkan

Pada setiap `clawhub sync`, CLI melaporkan **snapshot lengkap** dari apa yang ditemukan, dikelompokkan berdasarkan akar pemindaian (“folder/root”).

Untuk setiap root, kami menyimpan:

- `rootId`: **hash SHA-256** dari path root kanonis (server tidak pernah melihat path mentah).
- `label`: label yang mudah dibaca manusia, berasal dari dua segmen path terakhir (path home ditampilkan dengan `~`).
- `firstSeenAt`, `lastSeenAt`, `expiredAt` opsional.

Untuk setiap Skill yang ditemukan di bawah root, kami menyimpan:

- `skillId` (diselesaikan berdasarkan slug; hanya Skills yang ada di registry yang dilacak).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (upaya terbaik; saat ini versi yang cocok dengan registry jika diketahui).
- `removedAt` opsional ketika pemasangan yang sebelumnya dilaporkan menghilang dari root.

### Apa yang _tidak_ kami kumpulkan

- Tidak ada path folder absolut mentah (hanya `rootId` yang di-hash + label tampilan singkat).
- Tidak ada isi file.
- Tidak ada log per eksekusi, prompt, atau output CLI lainnya.
- Tidak ada pelacakan untuk Skills yang belum diunggah ke registry (slug yang tidak dikenal diabaikan).

## Jumlah pemasangan

Kami mempertahankan dua penghitung per Skill:

- `installsCurrent`: pengguna unik yang saat ini memiliki Skill terpasang di setidaknya satu root aktif.
- `installsAllTime`: pengguna unik yang pernah melaporkan Skill tersebut terpasang.

### Beberapa root

Jika Anda melakukan sync dari beberapa folder, kami memperlakukan setiap root pemindaian secara independen. Sebuah Skill dianggap “saat ini terpasang” jika ada di **root aktif mana pun**.

### Deteksi penghapusan pemasangan

Karena `sync` melaporkan set lengkap per root:

- Jika sebuah Skill menghilang dari root pada sync berikutnya, kami menandainya sebagai dihapus untuk root tersebut.
- Jika Skill dihapus dari semua root Anda, Skill tersebut tidak lagi dihitung dalam `installsCurrent`.
- `installsAllTime` tidak pernah berkurang kecuali Anda menghapus telemetri (lihat di bawah).

### Kedaluwarsa (120 hari)

Root yang tidak melaporkan telemetri selama **120 hari** ditandai kedaluwarsa dan pemasangannya berhenti dihitung dalam `installsCurrent`.
Ini dievaluasi secara malas (pada laporan telemetri berikutnya) untuk menghindari pekerjaan latar belakang.

## Transparansi + kontrol pengguna

ClawHub menyediakan tab “Terpasang” pribadi di profil Anda sendiri:

- Menampilkan root + Skills terpasang persis seperti yang kami simpan.
- Menyertakan tampilan **ekspor JSON**.
- Menyertakan tindakan **Hapus telemetri** untuk menghapus semua telemetri tersimpan untuk akun Anda.

Orang lain hanya melihat **penghitung pemasangan agregat**; tidak ada orang lain yang dapat melihat root/folder Anda.

Menghapus akun Anda juga menghapus data telemetri Anda.

## Cara menonaktifkan telemetri

Tetapkan variabel lingkungan:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Dengan pengaturan ini, CLI tidak akan mengirim telemetri selama `clawhub sync`.
