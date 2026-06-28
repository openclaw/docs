---
read_when:
    - Menyiapkan alur kerja agen otonom yang berjalan tanpa pemberian prompt untuk setiap tugas
    - Menentukan apa yang dapat dilakukan agen secara mandiri dan apa yang memerlukan persetujuan manusia
    - Menyusun agen multiprogram dengan batasan dan aturan eskalasi yang jelas
summary: Tetapkan kewenangan operasional permanen untuk program agen otonom
title: Instruksi tetap
x-i18n:
    generated_at: "2026-05-12T00:56:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a51baa7aca31cb34b682983374d4d551ed6ab57ae54a5c63e7d044bffeef756
    source_path: automation/standing-orders.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Perintah tetap memberi agen Anda **otoritas operasi permanen** untuk program yang ditentukan. Alih-alih memberikan instruksi tugas satu per satu setiap kali, Anda mendefinisikan program dengan cakupan, pemicu, dan aturan eskalasi yang jelas - lalu agen mengeksekusi secara otonom di dalam batasan tersebut.

Inilah perbedaan antara memberi tahu asisten Anda "kirim laporan mingguan" setiap hari Jumat dan memberikan otoritas tetap: "Anda bertanggung jawab atas laporan mingguan. Susun setiap hari Jumat, kirimkan, dan hanya eskalasikan jika ada sesuatu yang tampak salah."

## Mengapa perintah tetap

**Tanpa perintah tetap:**

- Anda harus memberi prompt kepada agen untuk setiap tugas
- Agen menganggur di antara permintaan
- Pekerjaan rutin terlupakan atau tertunda
- Anda menjadi hambatan

**Dengan perintah tetap:**

- Agen mengeksekusi secara otonom di dalam batasan yang ditentukan
- Pekerjaan rutin berjalan sesuai jadwal tanpa prompt
- Anda hanya terlibat untuk pengecualian dan persetujuan
- Agen mengisi waktu menganggur secara produktif

## Cara kerjanya

Perintah tetap didefinisikan dalam file [ruang kerja agen](/id/concepts/agent-workspace) Anda. Pendekatan yang direkomendasikan adalah menyertakannya langsung di `AGENTS.md` (yang disuntikkan otomatis setiap sesi) sehingga agen selalu memilikinya dalam konteks. Untuk konfigurasi yang lebih besar, Anda juga dapat menaruhnya di file khusus seperti `standing-orders.md` dan merujuknya dari `AGENTS.md`.

Setiap program menentukan:

1. **Cakupan** - apa yang diizinkan untuk dilakukan agen
2. **Pemicu** - kapan mengeksekusi (jadwal, peristiwa, atau kondisi)
3. **Gerbang persetujuan** - apa yang memerlukan persetujuan manusia sebelum bertindak
4. **Aturan eskalasi** - kapan harus berhenti dan meminta bantuan

Agen memuat instruksi ini setiap sesi melalui file bootstrap ruang kerja (lihat [Ruang Kerja Agen](/id/concepts/agent-workspace) untuk daftar lengkap file yang disuntikkan otomatis) dan mengeksekusinya, dikombinasikan dengan [tugas cron](/id/automation/cron-jobs) untuk penegakan berbasis waktu.

<Tip>
Letakkan perintah tetap di `AGENTS.md` untuk menjamin semuanya dimuat setiap sesi. Bootstrap ruang kerja otomatis menyuntikkan `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, dan `MEMORY.md` - tetapi tidak file arbitrer dalam subdirektori.
</Tip>

## Anatomi perintah tetap

```markdown
## Program: Laporan Status Mingguan

**Otoritas:** Mengompilasi data, menghasilkan laporan, mengirimkannya ke pemangku kepentingan
**Pemicu:** Setiap Jumat pukul 16.00 (ditegakkan melalui tugas cron)
**Gerbang persetujuan:** Tidak ada untuk laporan standar. Tandai anomali untuk ditinjau manusia.
**Eskalasi:** Jika sumber data tidak tersedia atau metrik tampak tidak biasa (>2σ dari norma)

### Langkah eksekusi

1. Ambil metrik dari sumber yang dikonfigurasi
2. Bandingkan dengan minggu sebelumnya dan target
3. Hasilkan laporan di Reports/weekly/YYYY-MM-DD.md
4. Kirim ringkasan melalui kanal yang dikonfigurasi
5. Catat penyelesaian ke Agent/Logs/

### Yang TIDAK boleh dilakukan

- Jangan kirim laporan ke pihak eksternal
- Jangan ubah data sumber
- Jangan lewati pengiriman jika metrik tampak buruk - laporkan secara akurat
```

## Perintah tetap plus tugas cron

Perintah tetap mendefinisikan **apa** yang diizinkan untuk dilakukan agen. [Tugas Cron](/id/automation/cron-jobs) mendefinisikan **kapan** hal itu terjadi. Keduanya bekerja bersama:

```
Perintah Tetap: "Anda bertanggung jawab atas triase kotak masuk harian"
    ↓
Tugas Cron (08.00 setiap hari): "Eksekusi triase kotak masuk sesuai perintah tetap"
    ↓
Agen: Membaca perintah tetap → mengeksekusi langkah → melaporkan hasil
```

Prompt tugas cron harus merujuk ke perintah tetap, bukan menduplikasinya:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Eksekusi triase kotak masuk harian sesuai perintah tetap. Periksa email untuk peringatan baru. Urai, kategorikan, dan simpan setiap item. Laporkan ringkasan kepada pemilik. Eskalasikan hal yang tidak dikenal."
```

## Contoh

### Contoh 1: konten dan media sosial (siklus mingguan)

```markdown
## Program: Konten & Media Sosial

**Otoritas:** Menyusun draf konten, menjadwalkan posting, mengompilasi laporan keterlibatan
**Gerbang persetujuan:** Semua posting memerlukan tinjauan pemilik selama 30 hari pertama, lalu persetujuan tetap
**Pemicu:** Siklus mingguan (tinjauan Senin → draf pertengahan minggu → ringkasan Jumat)

### Siklus mingguan

- **Senin:** Tinjau metrik platform dan keterlibatan audiens
- **Selasa-Kamis:** Susun draf posting sosial, buat konten blog
- **Jumat:** Kompilasi ringkasan pemasaran mingguan → kirim ke pemilik

### Aturan konten

- Suara harus sesuai dengan merek (lihat SOUL.md atau panduan suara merek)
- Jangan pernah mengidentifikasi diri sebagai AI dalam konten yang menghadap publik
- Sertakan metrik jika tersedia
- Fokus pada nilai bagi audiens, bukan promosi diri
```

### Contoh 2: operasi keuangan (dipicu peristiwa)

```markdown
## Program: Pemrosesan Keuangan

**Otoritas:** Memproses data transaksi, menghasilkan laporan, mengirim ringkasan
**Gerbang persetujuan:** Tidak ada untuk analisis. Rekomendasi memerlukan persetujuan pemilik.
**Pemicu:** File data baru terdeteksi ATAU siklus bulanan terjadwal

### Saat data baru tiba

1. Deteksi file baru di direktori input yang ditentukan
2. Urai dan kategorikan semua transaksi
3. Bandingkan dengan target anggaran
4. Tandai: item tidak biasa, pelanggaran ambang batas, tagihan berulang baru
5. Hasilkan laporan di direktori output yang ditentukan
6. Kirim ringkasan kepada pemilik melalui kanal yang dikonfigurasi

### Aturan eskalasi

- Satu item > $500: peringatan langsung
- Kategori > anggaran sebesar 20%: tandai dalam laporan
- Transaksi tidak dapat dikenali: minta pemilik untuk kategorisasi
- Pemrosesan gagal setelah 2 percobaan ulang: laporkan kegagalan, jangan menebak
```

### Contoh 3: pemantauan dan peringatan (berkelanjutan)

```markdown
## Program: Pemantauan Sistem

**Otoritas:** Memeriksa kesehatan sistem, memulai ulang layanan, mengirim peringatan
**Gerbang persetujuan:** Mulai ulang layanan secara otomatis. Eskalasikan jika mulai ulang gagal dua kali.
**Pemicu:** Setiap siklus Heartbeat

### Pemeriksaan

- Endpoint kesehatan layanan merespons
- Ruang disk di atas ambang batas
- Tugas tertunda tidak kedaluwarsa (>24 jam)
- Kanal pengiriman beroperasi

### Matriks respons

| Kondisi          | Tindakan                 | Eskalasi?                |
| ---------------- | ------------------------ | ------------------------ |
| Layanan mati     | Mulai ulang otomatis     | Hanya jika mulai ulang gagal 2x |
| Ruang disk < 10% | Peringatkan pemilik      | Ya                       |
| Tugas kedaluwarsa > 24j | Ingatkan pemilik       | Tidak                    |
| Kanal offline    | Catat dan coba lagi siklus berikutnya | Jika offline > 2 jam     |
```

## Pola eksekusi-verifikasi-laporan

Perintah tetap bekerja paling baik saat digabungkan dengan disiplin eksekusi yang ketat. Setiap tugas dalam perintah tetap harus mengikuti loop ini:

1. **Eksekusi** - Lakukan pekerjaan sebenarnya (jangan hanya mengakui instruksi)
2. **Verifikasi** - Pastikan hasilnya benar (file ada, pesan terkirim, data terurai)
3. **Laporan** - Beri tahu pemilik apa yang sudah dilakukan dan apa yang sudah diverifikasi

```markdown
### Aturan eksekusi

- Setiap tugas mengikuti Eksekusi-Verifikasi-Laporan. Tanpa pengecualian.
- "Saya akan melakukannya" bukan eksekusi. Lakukan, lalu laporkan.
- "Selesai" tanpa verifikasi tidak dapat diterima. Buktikan.
- Jika eksekusi gagal: coba ulang sekali dengan pendekatan yang disesuaikan.
- Jika masih gagal: laporkan kegagalan dengan diagnosis. Jangan pernah gagal diam-diam.
- Jangan pernah mencoba ulang tanpa batas - maksimal 3 percobaan, lalu eskalasikan.
```

Pola ini mencegah mode kegagalan agen yang paling umum: mengakui tugas tanpa menyelesaikannya.

## Arsitektur multi-program

Untuk agen yang mengelola beberapa urusan, atur perintah tetap sebagai program terpisah dengan batasan yang jelas:

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

- **Irama pemicu** sendiri (mingguan, bulanan, dipicu peristiwa, berkelanjutan)
- **Gerbang persetujuan** sendiri (beberapa program memerlukan pengawasan lebih banyak daripada yang lain)
- **Batasan** yang jelas (agen harus tahu di mana satu program berakhir dan program lain dimulai)

## Praktik terbaik

### Lakukan

- Mulai dengan otoritas sempit dan perluas seiring kepercayaan terbangun
- Definisikan gerbang persetujuan eksplisit untuk tindakan berisiko tinggi
- Sertakan bagian "Yang TIDAK boleh dilakukan" - batasan sama pentingnya dengan izin
- Kombinasikan dengan tugas cron untuk eksekusi berbasis waktu yang andal
- Tinjau log agen setiap minggu untuk memverifikasi perintah tetap diikuti
- Perbarui perintah tetap seiring kebutuhan Anda berkembang - itu adalah dokumen hidup

### Hindari

- Memberikan otoritas luas pada hari pertama ("lakukan apa pun yang menurut Anda terbaik")
- Melewati aturan eskalasi - setiap program memerlukan klausul "kapan harus berhenti dan bertanya"
- Mengasumsikan agen akan mengingat instruksi verbal - letakkan semuanya dalam file
- Mencampur urusan dalam satu program - pisahkan program untuk domain yang berbeda
- Lupa menegakkan dengan tugas cron - perintah tetap tanpa pemicu menjadi saran

## Terkait

- [Otomasi](/id/automation): semua mekanisme otomasi sekilas.
- [Tugas Cron](/id/automation/cron-jobs): penegakan jadwal untuk perintah tetap.
- [Hook](/id/automation/hooks): skrip yang dipicu peristiwa untuk peristiwa siklus hidup agen.
- [Webhook](/id/automation/cron-jobs#webhooks): pemicu peristiwa HTTP masuk.
- [Ruang kerja agen](/id/concepts/agent-workspace): tempat perintah tetap berada, termasuk daftar lengkap file bootstrap yang disuntikkan otomatis (`AGENTS.md`, `SOUL.md`, dll.).
