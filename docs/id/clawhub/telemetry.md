---
read_when:
    - Mengerjakan kontrol telemetri / privasi
    - Pertanyaan tentang data apa saja yang dikumpulkan
summary: Telemetri instalasi dikumpulkan melalui `clawhub sync` + pilihan untuk tidak ikut.
x-i18n:
    generated_at: "2026-05-12T23:29:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f492fa0176af1cb37fbf694f6c21ed63a769cf9eb8ee4b29f435d5ff0b0e683
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetri

ClawHub menggunakan **telemetri minimal** untuk menghitung **jumlah instalasi** (yang benar-benar digunakan) dan mendukung pengurutan/penyaringan yang lebih baik.
Ini didasarkan pada perintah CLI `clawhub sync`.

## Kapan telemetri dikumpulkan

Telemetri hanya dikirim ketika:

- Anda **masuk** di CLI (kami sudah mewajibkan autentikasi untuk alur sync/publish).
- Anda menjalankan `clawhub sync`.
- Telemetri **tidak dinonaktifkan** (lihat “Cara menonaktifkan” di bawah).

Jika Anda tidak masuk, tidak ada apa pun yang dilaporkan.

## Apa yang kami kumpulkan

Pada setiap `clawhub sync`, CLI melaporkan **snapshot lengkap** dari apa yang ditemukannya, dikelompokkan berdasarkan akar pemindaian (“folder/root”).

Untuk setiap root, kami menyimpan:

- `rootId`: **hash SHA-256** dari jalur root kanonis (server tidak pernah melihat jalur mentah).
- `label`: label yang dapat dibaca manusia yang diturunkan dari dua segmen jalur terakhir (jalur home ditampilkan dengan `~`).
- `firstSeenAt`, `lastSeenAt`, `expiredAt` opsional.

Untuk setiap skill yang ditemukan di bawah root, kami menyimpan:

- `skillId` (diselesaikan berdasarkan slug; hanya skill yang ada di registri yang dilacak).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (upaya terbaik; saat ini versi yang cocok dengan registri jika diketahui).
- `removedAt` opsional ketika instalasi yang sebelumnya dilaporkan menghilang dari root.

### Apa yang _tidak_ kami kumpulkan

- Tidak ada jalur folder absolut mentah (hanya `rootId` yang di-hash + label tampilan singkat).
- Tidak ada isi file.
- Tidak ada log per eksekusi, prompt, atau output CLI lainnya.
- Tidak ada pelacakan untuk skill yang tidak diunggah ke registri (slug yang tidak dikenal diabaikan).

## Jumlah instalasi

Kami mempertahankan dua penghitung per skill:

- `installsCurrent`: pengguna unik yang saat ini memiliki skill terinstal di setidaknya satu root aktif.
- `installsAllTime`: pengguna unik yang pernah melaporkan skill tersebut terinstal.

### Beberapa root

Jika Anda melakukan sinkronisasi dari beberapa folder, kami memperlakukan setiap root pemindaian secara independen. Sebuah skill dianggap “saat ini terinstal” jika ada di **root aktif mana pun**.

### Deteksi penghapusan instalasi

Karena `sync` melaporkan set lengkap per root:

- Jika sebuah skill menghilang dari root pada sinkronisasi berikutnya, kami menandainya sebagai dihapus untuk root tersebut.
- Jika skill dihapus dari semua root Anda, skill tersebut tidak lagi dihitung dalam `installsCurrent`.
- `installsAllTime` tidak pernah berkurang kecuali Anda menghapus telemetri (lihat di bawah).

### Kedaluwarsa (120 hari)

Root yang tidak melaporkan telemetri selama **120 hari** ditandai kedaluwarsa dan instalasinya berhenti dihitung dalam `installsCurrent`.
Ini dievaluasi secara malas (pada laporan telemetri berikutnya) untuk menghindari pekerjaan latar belakang.

## Transparansi + kontrol pengguna

ClawHub menyediakan tab “Terinstal” privat di profil Anda sendiri:

- Menampilkan root + skill terinstal persis seperti yang kami simpan.
- Menyertakan tampilan **ekspor JSON**.
- Menyertakan tindakan **Hapus telemetri** untuk menghapus semua telemetri tersimpan untuk akun Anda.

Orang lain hanya melihat **penghitung instalasi agregat**; tidak ada orang lain yang dapat melihat root/folder Anda.

Menghapus akun Anda juga menghapus data telemetri Anda.

## Cara menonaktifkan telemetri

Tetapkan variabel lingkungan:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Dengan pengaturan ini, CLI tidak akan mengirim telemetri selama `clawhub sync`.
