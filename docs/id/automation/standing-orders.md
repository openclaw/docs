---
read_when:
    - Menyiapkan alur kerja agen otonom yang berjalan tanpa perintah untuk setiap tugas
    - Menentukan apa yang dapat dilakukan agen secara mandiri dan apa yang memerlukan persetujuan manusia
    - Menata agen multiprogram dengan batasan dan aturan eskalasi yang jelas
summary: Tetapkan kewenangan operasional permanen untuk program agen otonom
title: Perintah tetap
x-i18n:
    generated_at: "2026-07-12T13:57:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

Perintah tetap memberikan agen Anda **wewenang operasional permanen** untuk program yang ditentukan. Alih-alih memberikan instruksi kepada agen untuk setiap tugas, Anda menetapkan program dengan cakupan, pemicu, dan aturan eskalasi yang jelas, lalu agen menjalankannya secara otonom dalam batas tersebut: "Anda bertanggung jawab atas laporan mingguan. Susun setiap hari Jumat, kirimkan, dan lakukan eskalasi hanya jika ada sesuatu yang tampak tidak beres."

## Mengapa menggunakan perintah tetap

**Tanpa perintah tetap:** Anda memberikan instruksi kepada agen untuk setiap tugas, pekerjaan rutin terlupakan atau tertunda, dan Anda menjadi penghambat.

**Dengan perintah tetap:** agen menjalankan tugas secara otonom dalam batas yang ditentukan, pekerjaan rutin berlangsung sesuai jadwal, dan Anda hanya terlibat untuk pengecualian dan persetujuan.

## Cara kerjanya

Perintah tetap ditentukan dalam berkas [ruang kerja agen](/id/concepts/agent-workspace) Anda. Pendekatan yang disarankan adalah menyertakannya secara langsung dalam `AGENTS.md` (yang disisipkan secara otomatis pada setiap sesi) agar agen selalu memilikinya dalam konteks. Untuk konfigurasi yang lebih besar, Anda juga dapat menempatkannya dalam berkas khusus seperti `standing-orders.md` dan merujuknya dari `AGENTS.md`.

Setiap program menentukan:

1. **Cakupan** - tindakan yang diizinkan untuk dilakukan oleh agen
2. **Pemicu** - kapan harus dijalankan (jadwal, peristiwa, atau kondisi)
3. **Gerbang persetujuan** - tindakan yang memerlukan persetujuan manusia sebelum dijalankan
4. **Aturan eskalasi** - kapan harus berhenti dan meminta bantuan

Agen memuat instruksi ini pada setiap sesi melalui berkas bootstrap ruang kerja (lihat [Ruang Kerja Agen](/id/concepts/agent-workspace) untuk daftar lengkap berkas yang disisipkan secara otomatis) dan menjalankannya, dikombinasikan dengan [tugas Cron](/id/automation/cron-jobs) untuk penerapan berbasis waktu.

<Tip>
Tempatkan perintah tetap dalam `AGENTS.md` untuk menjamin bahwa perintah tersebut dimuat pada setiap sesi. Bootstrap ruang kerja secara otomatis menyisipkan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, dan `MEMORY.md` - tetapi tidak menyisipkan sembarang berkas dalam subdirektori.
</Tip>

## Anatomi perintah tetap

```markdown
## Program: Laporan Status Mingguan

**Wewenang:** Mengumpulkan data, membuat laporan, menyampaikannya kepada pemangku kepentingan
**Pemicu:** Setiap hari Jumat pukul 16.00 (diterapkan melalui tugas cron)
**Gerbang persetujuan:** Tidak ada untuk laporan standar. Tandai anomali untuk ditinjau manusia.
**Eskalasi:** Jika sumber data tidak tersedia atau metrik tampak tidak biasa (>2σ dari norma)

### Langkah pelaksanaan

1. Ambil metrik dari sumber yang telah dikonfigurasi
2. Bandingkan dengan minggu sebelumnya dan target
3. Buat laporan di Reports/weekly/YYYY-MM-DD.md
4. Kirim ringkasan melalui saluran yang telah dikonfigurasi
5. Catat penyelesaian ke Agent/Logs/

### Yang TIDAK boleh dilakukan

- Jangan mengirim laporan kepada pihak eksternal
- Jangan mengubah data sumber
- Jangan melewatkan pengiriman jika metrik tampak buruk - laporkan secara akurat
```

## Perintah tetap ditambah tugas Cron

Perintah tetap menentukan **apa** yang boleh dilakukan oleh agen. [Tugas Cron](/id/automation/cron-jobs) menentukan **kapan** hal tersebut dilakukan. Keduanya bekerja bersama:

```text
Perintah Tetap: "Anda bertanggung jawab atas triase kotak masuk harian"
    ↓
Tugas Cron (setiap hari pukul 08.00): "Jalankan triase kotak masuk sesuai perintah tetap"
    ↓
Agen: Membaca perintah tetap → menjalankan langkah-langkah → melaporkan hasil
```

Instruksi tugas cron harus merujuk pada perintah tetap, bukan menduplikasinya:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Jalankan triase kotak masuk harian sesuai perintah tetap. Periksa surel untuk menemukan peringatan baru. Urai, kategorikan, dan simpan setiap item. Laporkan ringkasan kepada pemilik. Eskalasikan hal yang tidak diketahui."
```

## Contoh

### Contoh 1: konten dan media sosial (siklus mingguan)

```markdown
## Program: Konten & Media Sosial

**Wewenang:** Menyusun draf konten, menjadwalkan kiriman, menyusun laporan keterlibatan
**Gerbang persetujuan:** Semua kiriman memerlukan tinjauan pemilik selama 30 hari pertama, lalu mendapatkan persetujuan tetap
**Pemicu:** Siklus mingguan (tinjauan Senin → draf pertengahan minggu → ringkasan Jumat)

### Siklus mingguan

- **Senin:** Tinjau metrik platform dan keterlibatan audiens
- **Selasa-Kamis:** Susun draf kiriman media sosial, buat konten blog
- **Jumat:** Susun ringkasan pemasaran mingguan → kirimkan kepada pemilik

### Aturan konten

- Gaya bahasa harus sesuai dengan merek (lihat SOUL.md atau panduan gaya bahasa merek)
- Jangan pernah mengidentifikasi diri sebagai AI dalam konten yang ditujukan kepada publik
- Sertakan metrik jika tersedia
- Fokus pada nilai bagi audiens, bukan promosi diri
```

### Contoh 2: operasi keuangan (dipicu oleh peristiwa)

```markdown
## Program: Pemrosesan Keuangan

**Wewenang:** Memproses data transaksi, membuat laporan, mengirim ringkasan
**Gerbang persetujuan:** Tidak ada untuk analisis. Rekomendasi memerlukan persetujuan pemilik.
**Pemicu:** Berkas data baru terdeteksi ATAU siklus bulanan terjadwal

### Saat data baru tiba

1. Deteksi berkas baru dalam direktori masukan yang ditentukan
2. Urai dan kategorikan semua transaksi
3. Bandingkan dengan target anggaran
4. Tandai: item yang tidak biasa, pelanggaran ambang batas, tagihan berulang baru
5. Buat laporan dalam direktori keluaran yang ditentukan
6. Kirim ringkasan kepada pemilik melalui saluran yang telah dikonfigurasi

### Aturan eskalasi

- Satu item > $500: peringatan segera
- Kategori > anggaran sebesar 20%: tandai dalam laporan
- Transaksi tidak dikenali: minta pemilik menentukan kategorinya
- Pemrosesan gagal setelah 2 kali percobaan ulang: laporkan kegagalan, jangan menebak
```

### Contoh 3: pemantauan dan peringatan (berkelanjutan)

```markdown
## Program: Pemantauan Sistem

**Wewenang:** Memeriksa kesehatan sistem, memulai ulang layanan, mengirim peringatan
**Gerbang persetujuan:** Mulai ulang layanan secara otomatis. Lakukan eskalasi jika mulai ulang gagal dua kali.
**Pemicu:** Setiap siklus Heartbeat

### Pemeriksaan

- Titik akhir kesehatan layanan merespons
- Ruang disk di atas ambang batas
- Tugas tertunda tidak kedaluwarsa (>24 jam)
- Saluran pengiriman beroperasi

### Matriks respons

| Kondisi             | Tindakan                              | Eskalasi?                       |
| ------------------- | ------------------------------------- | ------------------------------- |
| Layanan tidak aktif | Mulai ulang secara otomatis           | Hanya jika mulai ulang gagal 2x |
| Ruang disk < 10%    | Peringatkan pemilik                   | Ya                              |
| Tugas basi > 24 jam | Ingatkan pemilik                      | Tidak                           |
| Saluran luring      | Catat dan coba lagi pada siklus berikutnya | Jika luring > 2 jam        |
```

## Pola jalankan-verifikasi-laporkan

Perintah tetap bekerja paling baik jika digabungkan dengan disiplin pelaksanaan yang ketat. Setiap tugas dalam perintah tetap harus mengikuti siklus ini:

1. **Jalankan** - Lakukan pekerjaan yang sebenarnya (jangan hanya mengakui instruksi)
2. **Verifikasi** - Pastikan hasilnya benar (berkas tersedia, pesan terkirim, data terurai)
3. **Laporkan** - Beri tahu pemilik apa yang telah dilakukan dan apa yang telah diverifikasi

```markdown
### Aturan pelaksanaan

- Setiap tugas mengikuti Jalankan-Verifikasi-Laporkan. Tanpa pengecualian.
- "Saya akan melakukannya" bukanlah pelaksanaan. Lakukan, lalu laporkan.
- "Selesai" tanpa verifikasi tidak dapat diterima. Berikan bukti.
- Jika pelaksanaan gagal: coba lagi sekali dengan pendekatan yang disesuaikan.
- Jika masih gagal: laporkan kegagalan beserta diagnosisnya. Jangan pernah gagal tanpa pemberitahuan.
- Jangan pernah mencoba ulang tanpa batas - maksimal 3 percobaan, lalu eskalasikan.
```

Pola ini mencegah mode kegagalan agen yang paling umum: mengakui tugas tanpa menyelesaikannya.

## Arsitektur multiprogram

Untuk agen yang mengelola beberapa bidang, atur perintah tetap sebagai program terpisah dengan batas yang jelas:

```markdown
## Program 1: [Domain A] (Mingguan)

...

## Program 2: [Domain B] (Bulanan + Sesuai Permintaan)

...

## Program 3: [Domain C] (Sesuai Kebutuhan)

...

## Aturan Eskalasi (Semua Program)

- [Kriteria eskalasi umum]
- [Gerbang persetujuan yang berlaku di seluruh program]
```

Setiap program harus memiliki:

- **Irama pemicu** tersendiri (mingguan, bulanan, dipicu peristiwa, berkelanjutan)
- **Gerbang persetujuan** tersendiri (beberapa program memerlukan pengawasan lebih ketat daripada yang lain)
- **Batas** yang jelas (agen harus mengetahui di mana satu program berakhir dan program lainnya dimulai)

## Praktik terbaik

### Lakukan

- Mulai dengan wewenang terbatas dan perluas seiring tumbuhnya kepercayaan
- Tentukan gerbang persetujuan eksplisit untuk tindakan berisiko tinggi
- Sertakan bagian "Yang TIDAK boleh dilakukan" - batas sama pentingnya dengan izin
- Gabungkan dengan tugas cron untuk pelaksanaan berbasis waktu yang andal
- Tinjau log agen setiap minggu untuk memastikan perintah tetap dipatuhi
- Perbarui perintah tetap seiring berkembangnya kebutuhan Anda - perintah tersebut merupakan dokumen yang terus berkembang

### Hindari

- Memberikan wewenang luas pada hari pertama ("lakukan apa pun yang menurut Anda terbaik")
- Melewatkan aturan eskalasi - setiap program memerlukan klausul "kapan harus berhenti dan bertanya"
- Menganggap agen akan mengingat instruksi lisan - masukkan semuanya ke dalam berkas
- Mencampur berbagai bidang dalam satu program - gunakan program terpisah untuk domain yang berbeda
- Lupa menerapkannya dengan tugas cron - perintah tetap tanpa pemicu hanya menjadi saran

## Terkait

- [Otomatisasi](/id/automation): semua mekanisme otomatisasi dalam satu ikhtisar.
- [Tugas Cron](/id/automation/cron-jobs): penerapan jadwal untuk perintah tetap.
- [Hook](/id/automation/hooks): skrip berbasis peristiwa untuk peristiwa siklus hidup agen.
- [Webhook](/id/automation/cron-jobs#webhooks): pemicu peristiwa HTTP masuk.
- [Ruang kerja agen](/id/concepts/agent-workspace): tempat perintah tetap disimpan, termasuk daftar lengkap berkas bootstrap yang disisipkan secara otomatis (`AGENTS.md`, `SOUL.md`, dan sebagainya).
