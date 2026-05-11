---
read_when:
    - Mengerjakan kontrol telemetri / privasi
    - Pertanyaan tentang data apa yang dikumpulkan
summary: Telemetri instalasi dikumpulkan melalui `clawhub sync` + opsi tidak ikut.
x-i18n:
    generated_at: "2026-05-11T20:25:00Z"
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

- Anda **masuk** di CLI (kami sudah mewajibkan autentikasi untuk alur sinkronisasi/publikasi).
- Anda menjalankan `clawhub sync`.
- Telemetri **tidak dinonaktifkan** (lihat “Cara menonaktifkan” di bawah).

Jika Anda belum masuk, tidak ada yang dilaporkan.

## Apa yang kami kumpulkan

Pada setiap `clawhub sync`, CLI melaporkan **snapshot lengkap** dari apa yang ditemukannya, dikelompokkan berdasarkan akar pemindaian (“folder/akar”).

Untuk setiap akar, kami menyimpan:

- `rootId`: **hash SHA-256** dari jalur akar kanonis (server tidak pernah melihat jalur mentah).
- `label`: label yang dapat dibaca manusia yang diturunkan dari dua segmen jalur terakhir (jalur beranda ditampilkan dengan `~`).
- `firstSeenAt`, `lastSeenAt`, `expiredAt` opsional.

Untuk setiap skill yang ditemukan di bawah sebuah akar, kami menyimpan:

- `skillId` (diselesaikan berdasarkan slug; hanya skill yang ada di registri yang dilacak).
- `firstSeenAt`, `lastSeenAt`.
- `lastVersion` (upaya terbaik; saat ini versi yang cocok dengan registri jika diketahui).
- `removedAt` opsional ketika pemasangan yang sebelumnya dilaporkan hilang dari sebuah akar.

### Apa yang _tidak_ kami kumpulkan

- Tidak ada jalur folder absolut mentah (hanya `rootId` yang di-hash + label tampilan pendek).
- Tidak ada isi file.
- Tidak ada log per eksekusi, prompt, atau keluaran CLI lainnya.
- Tidak ada pelacakan untuk skill yang tidak diunggah ke registri (slug yang tidak dikenal diabaikan).

## Jumlah pemasangan

Kami mempertahankan dua penghitung per skill:

- `installsCurrent`: pengguna unik yang saat ini memiliki skill terpasang di setidaknya satu akar aktif.
- `installsAllTime`: pengguna unik yang pernah melaporkan skill terpasang.

### Beberapa akar

Jika Anda menyinkronkan dari beberapa folder, kami memperlakukan setiap akar pemindaian secara independen. Sebuah skill dianggap “saat ini terpasang” jika ada di **akar aktif mana pun**.

### Deteksi penghapusan pemasangan

Karena `sync` melaporkan seluruh set per akar:

- Jika sebuah skill menghilang dari sebuah akar pada sinkronisasi berikutnya, kami menandainya sebagai dihapus untuk akar tersebut.
- Jika skill dihapus dari semua akar Anda, skill tersebut tidak lagi dihitung dalam `installsCurrent`.
- `installsAllTime` tidak pernah berkurang kecuali Anda menghapus telemetri (lihat di bawah).

### Kedaluwarsa (120 hari)

Akar yang tidak melaporkan telemetri selama **120 hari** ditandai kedaluwarsa dan pemasangannya berhenti dihitung dalam `installsCurrent`.
Ini dievaluasi secara malas (pada laporan telemetri berikutnya) untuk menghindari pekerjaan latar belakang.

## Transparansi + kontrol pengguna

ClawHub menyediakan tab “Terpasang” privat di profil Anda sendiri:

- Menampilkan akar + skill terpasang persis seperti yang kami simpan.
- Menyertakan tampilan **ekspor JSON**.
- Menyertakan tindakan **Hapus telemetri** untuk menghapus semua telemetri tersimpan untuk akun Anda.

Semua orang lain hanya melihat **penghitung pemasangan agregat**; tidak ada orang lain yang dapat melihat akar/folder Anda.

Menghapus akun Anda juga menghapus data telemetri Anda.

## Cara menonaktifkan telemetri

Atur variabel lingkungan:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Dengan ini diatur, CLI tidak akan mengirim telemetri selama `clawhub sync`.
