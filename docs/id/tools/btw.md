---
read_when:
    - Anda ingin mengajukan pertanyaan sampingan singkat tentang sesi saat ini
    - Anda sedang menerapkan atau men-debug perilaku BTW di berbagai klien
summary: Pertanyaan sampingan sementara dengan /btw
title: Ngomong-ngomong, pertanyaan sampingan
x-i18n:
    generated_at: "2026-07-16T18:37:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 338a54d0e15ec90aebaeeaee551559a26f1437f7b6dcdde4a4b1e63347ad0759
    source_path: tools/btw.md
    workflow: 16
---

`/btw` (alias `/side`) mengajukan pertanyaan sampingan singkat tentang **sesi
saat ini** tanpa menambahkannya ke riwayat percakapan. Fitur ini dimodelkan berdasarkan
`/btw` milik Claude Code, yang disesuaikan dengan arsitektur Gateway dan
multisaluran OpenClaw.

```text
/btw apa yang berubah?
/side apa arti kesalahan ini?
```

## Fungsinya

1. Mengambil snapshot sesi saat ini sebagai konteks latar belakang (termasuk prompt
   proses utama yang sedang berlangsung).
2. Menjalankan kueri sampingan satu kali yang terpisah dengan instruksi agar model hanya menjawab
   pertanyaan sampingan dan tidak melanjutkan atau mengarahkan tugas utama.
3. Mengirimkan jawaban sebagai hasil sampingan langsung, bukan pesan asisten biasa.
4. Tidak pernah menulis pertanyaan atau jawaban ke riwayat sesi atau `chat.history`.

Proses utama, jika sedang aktif, tidak disentuh.

Untuk sesi harness Codex, BTW mencabangkan thread app-server Codex yang aktif menjadi
thread anak sementara, alih-alih menjalankan panggilan penyedia terpisah. Hal ini
mempertahankan OAuth Codex serta perilaku alat/thread native, dan thread hasil
pencabangan mempertahankan kebijakan persetujuan, sandbox, serta permukaan
alat native milik thread induk saat ini. Thread hasil pencabangan menerima prompt batas yang memberi tahu model bahwa
semua yang mendahuluinya merupakan konteks referensi warisan, bukan instruksi aktif,
dan hanya pesan setelah batas tersebut yang aktif. `/btw` memerlukan
thread Codex yang sudah ada; kirim pesan biasa terlebih dahulu.

Untuk alias runtime CLI, BTW memanggil backend CLI pemilik dalam mode
pertanyaan sampingan satu kali: fitur ini memasukkan konteks percakapan yang telah disanitasi ke pemanggilan CLI
baru dengan penggabungan alat dan status sesi yang dapat digunakan kembali dinonaktifkan, serta menambahkan
flag tanpa-melanjutkan/tanpa-alat yang didukung backend. Runtime langsung (non-CLI)
menggunakan panggilan penyedia langsung satu kali sebagai gantinya.

## Hal yang tidak dilakukannya

`/btw` tidak membuat sesi persisten, melanjutkan tugas utama yang belum selesai,
menyimpan data pertanyaan/jawaban ke riwayat transkrip, atau bertahan setelah pemuatan ulang.

## Model pengiriman

Chat asisten biasa menggunakan peristiwa Gateway `chat`. BTW menggunakan peristiwa
`chat.side_result` terpisah agar klien tidak keliru menganggapnya sebagai
riwayat percakapan biasa. Karena tidak diputar ulang dari `chat.history`, hasil ini
menghilang setelah pemuatan ulang.

## Perilaku permukaan

| Permukaan         | Perilaku                                                                                                                                                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TUI               | Dirender sebaris dalam log chat, terlihat berbeda dari balasan biasa, dan dapat ditutup dengan `Enter` atau `Esc`.                                                                                                                                                                           |
| Saluran eksternal | Dikirim sebagai balasan satu kali dengan label yang jelas (Telegram, WhatsApp, Discord tidak memiliki overlay sementara lokal).                                                                                                                                                                         |
| UI Kontrol / web  | Dirender sebagai panel mengambang "Chat sampingan" yang disematkan ke thread. Jawaban terakumulasi sebagai giliran dan input "Tindak lanjut" mengajukan pertanyaan sampingan berikutnya. Menutup (`Esc` atau X) mempertahankan percakapan dan membukanya kembali saat jawaban berikutnya tiba; tombol tempat sampah membuangnya dan menghentikan proses yang tertunda. |

## Popup pilihan (UI Kontrol)

Menyorot teks di dalam pesan chat pada UI Kontrol akan membuka
popup pilihan kecil dengan dua tindakan:

- **Detail selengkapnya** segera mengirim pertanyaan `/btw` implisit yang meminta
  model menjelaskan teks yang disorot dalam konteks sesi saat ini.
  Jawabannya muncul di panel chat sampingan mengambang.
- **Tanyakan di chat sampingan** mengisi awal penyusun pesan dengan draf `/btw` yang mengutip
  teks yang disorot agar Anda dapat mengetik pertanyaan sendiri tentangnya.

Kedua tindakan mengikuti semantik normal `/btw`: pertanyaan dan jawaban tidak masuk
ke riwayat sesi dan proses utama tidak disentuh.

## Kapan menggunakannya

Gunakan `/btw` untuk klarifikasi singkat, jawaban faktual sampingan saat proses panjang
masih berlangsung, atau jawaban sementara yang tidak boleh masuk ke konteks
sesi mendatang.

```text
/btw berkas apa yang sedang kita edit?
/btw rangkum tugas saat ini dalam satu kalimat
/btw berapa hasil 17 * 19?
```

Untuk hal apa pun yang ingin dijadikan bagian dari konteks kerja sesi
mendatang, ajukan pertanyaan secara normal di sesi utama.

## Terkait

<CardGroup cols={2}>
  <Card title="Perintah garis miring" href="/id/tools/slash-commands" icon="terminal">
    Katalog perintah native dan direktif chat.
  </Card>
  <Card title="Tingkat pemikiran" href="/id/tools/thinking" icon="brain">
    Tingkat upaya penalaran untuk panggilan model pertanyaan sampingan.
  </Card>
  <Card title="Sesi" href="/id/concepts/session" icon="comments">
    Kunci sesi, riwayat, dan semantik persistensi.
  </Card>
  <Card title="Perintah pengarahan" href="/id/tools/steer" icon="arrow-right">
    Memasukkan pesan pengarahan ke dalam proses aktif tanpa mengakhirinya.
  </Card>
</CardGroup>
