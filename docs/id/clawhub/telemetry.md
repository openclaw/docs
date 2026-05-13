---
read_when:
    - Sedang mengerjakan kontrol telemetri / privasi
    - Pertanyaan tentang data apa yang dikumpulkan
summary: Telemetri instalasi yang dikumpulkan melalui `clawhub sync` + pilihan untuk tidak ikut.
x-i18n:
    generated_at: "2026-05-13T02:52:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub menggunakan **telemetri minimal** untuk menghitung **jumlah pemasangan** (yang benar-benar digunakan) dan mendukung pengurutan/pemfilteran yang lebih baik.
Ini didasarkan pada perintah CLI `clawhub sync`.

## Kapan telemetri dikumpulkan

Telemetri hanya dikirim ketika:

- Anda **masuk** di CLI (kami sudah mewajibkan autentikasi untuk alur sync/publish).
- Anda menjalankan `clawhub sync`.
- Telemetri **tidak dinonaktifkan** (lihat “Cara menonaktifkan” di bawah).

Jika Anda tidak masuk, tidak ada apa pun yang dilaporkan.

## Apa yang kami kumpulkan

Pada setiap `clawhub sync`, CLI melaporkan **snapshot lengkap** dari apa yang ditemukannya, dikelompokkan berdasarkan akar pemindaian (“folder/akar”).

Untuk setiap akar, kami menyimpan:

- `rootId`: **hash SHA-256** dari jalur akar kanonis (server tidak pernah melihat jalur mentah).
- `label`: label yang mudah dibaca manusia yang diturunkan dari dua segmen jalur terakhir (jalur home ditampilkan dengan `~`).
- `firstSeenAt`, `lastSeenAt`, `expiredAt` opsional.

Untuk setiap keterampilan yang ditemukan di bawah suatu akar, kami menyimpan:

- `skillId` (diselesaikan berdasarkan slug; hanya keterampilan yang ada di registri yang dilacak).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (upaya terbaik; saat ini versi yang cocok dengan registri jika diketahui).
- `removedAt` opsional ketika pemasangan yang sebelumnya dilaporkan menghilang dari suatu akar.

### Apa yang _tidak_ kami kumpulkan

- Tidak ada jalur folder absolut mentah (hanya `rootId` yang di-hash + label tampilan singkat).
- Tidak ada isi file.
- Tidak ada log per eksekusi, prompt, atau output CLI lainnya.
- Tidak ada pelacakan untuk keterampilan yang tidak diunggah ke registri (slug yang tidak diketahui diabaikan).

## Jumlah pemasangan

Kami memelihara dua penghitung per keterampilan:

- `installsCurrent`: pengguna unik yang saat ini memiliki keterampilan terpasang di setidaknya satu akar aktif.
- `installsAllTime`: pengguna unik yang pernah melaporkan keterampilan terpasang.

### Beberapa akar

Jika Anda melakukan sync dari beberapa folder, kami memperlakukan setiap akar pemindaian secara independen. Suatu keterampilan dianggap “saat ini terpasang” jika ada di **akar aktif mana pun**.

### Deteksi pencopotan pemasangan

Karena `sync` melaporkan set lengkap per akar:

- Jika suatu keterampilan menghilang dari suatu akar pada sync berikutnya, kami menandainya sebagai dihapus untuk akar tersebut.
- Jika keterampilan dihapus dari semua akar Anda, keterampilan tersebut tidak lagi dihitung dalam `installsCurrent`.
- `installsAllTime` tidak pernah berkurang kecuali Anda menghapus telemetri (lihat di bawah).

### Keusangan (120 hari)

Akar yang tidak melaporkan telemetri selama **120 hari** ditandai usang dan pemasangannya berhenti dihitung dalam `installsCurrent`.
Ini dievaluasi secara malas (pada laporan telemetri berikutnya) untuk menghindari pekerjaan latar belakang.

## Transparansi + kontrol pengguna

ClawHub menyediakan tab “Terpasang” pribadi di profil Anda sendiri:

- Menampilkan akar + keterampilan terpasang persis seperti yang kami simpan.
- Menyertakan tampilan **ekspor JSON**.
- Menyertakan tindakan **Hapus telemetri** untuk menghapus semua telemetri tersimpan untuk akun Anda.

Orang lain hanya melihat **penghitung pemasangan agregat**; tidak ada orang lain yang dapat melihat akar/folder Anda.

Menghapus akun Anda juga menghapus data telemetri Anda.

## Cara menonaktifkan telemetri

Tetapkan variabel lingkungan:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Dengan pengaturan ini, CLI tidak akan mengirim telemetri selama `clawhub sync`.
