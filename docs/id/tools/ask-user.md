---
read_when:
    - Anda ingin agen mengajukan pertanyaan terstruktur kepada pengguna
    - Anda sedang menjawab atau men-debug prompt ask_user
    - Anda memerlukan skema ask_user, batas waktu, atau perilaku saluran
summary: Cara ask_user menjeda giliran agen untuk keputusan manusia yang terstruktur
title: Tanyakan kepada pengguna
x-i18n:
    generated_at: "2026-07-20T03:57:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 32556314a34c26054c3aabfdd8ecc474cf85196e5cc71adb833face596edbd24
    source_path: tools/ask-user.md
    workflow: 16
---

`ask_user` memungkinkan agen mengajukan satu hingga tiga pertanyaan terstruktur kepada manusia dan
menunggu jawabannya. Fitur ini ditujukan untuk keputusan yang benar-benar berada di tangan pengguna,
bukan konfirmasi rutin atau informasi yang dapat disimpulkan agen dari permintaan,
kode, atau nilai default yang masuk akal.

Alat ini hanya tersedia dalam sesi utama. Subagen dan proses nonutama
lainnya tidak menerimanya.

## Menjawab pertanyaan

Anda dapat menjawab dari permukaan percakapan apa pun yang didukung:

- Control UI web menambatkan panel pertanyaan tepat di atas penyusun pesan. Untuk
  prompt dengan beberapa pertanyaan, panel menampilkan satu pertanyaan pada satu waktu dan bergerak maju
  melalui indikator langkah singkat. Setelah selesai, panel ditutup dan percakapan
  hanya menyimpan ringkasan jawaban yang ringkas.
- Telegram, Discord, dan Slack merender tombol bawaan untuk prompt satu pertanyaan
  dengan satu pilihan.
- Balasan teks biasa dapat digunakan di kanal apa pun. Balas dengan angka, label opsi,
  atau jawaban Anda sendiri.

OpenClaw selalu mengaktifkan jawaban teks bebas **Lainnya**. Agen tidak boleh menambahkan opsi
`Other` ke daftar opsi yang dibuat.

## Perilaku platform

Jawaban dapat digunakan pada setiap permukaan percakapan yang didukung. Control UI web menggunakan
indikator langkah tertambat yang menggantikan penyusun pesan saat diperluas; menciutkannya akan memulihkan
penyusun pesan lengkap di bawah bilah pertanyaan ramping. iOS, macOS, dan Android menampilkan
kartu sebaris; beberapa pertanyaan tetap ditumpuk sebagai pola yang sengaja dibuat ramah sentuhan.
Setiap platform mempertahankan ringkasan pertanyaan dan jawaban dalam linimasa percakapan aktif
tanpa penghapusan berbasis waktu, dan **Lewati** tersedia di mana saja.

Prompt yang tidak dapat menggunakan tombol bawaan, termasuk prompt dengan beberapa pertanyaan dan
beberapa pilihan, diturunkan menjadi teks yang mudah dibaca di kanal. Control UI
mempertahankan indikator langkah terstruktur lengkap.

## Batas waktu dan tanpa jawaban

Batas waktu default adalah 900 detik. `timeoutSeconds` dibatasi pada rentang
30 hingga 3600 detik.

Jika pertanyaan kedaluwarsa atau dibatalkan sebelum jawaban diterima, alat
mengembalikan `status: "no_answer"`. Agen kemudian melanjutkan dengan pertimbangan terbaiknya.
Proses agen yang dihentikan membatalkan pertanyaan Gateway yang tertunda.

## Skema alat

```ts
{
  questions: Array<{
    id: string; // kunci jawaban snake_case yang unik
    header: string; // label singkat; dipotong menjadi 12 karakter
    question: string; // satu kalimat
    options: Array<{
      label: string;
      description?: string;
    }>; // 2-4 opsi
    multiSelect?: boolean;
  }>; // 1-3 pertanyaan
  timeoutSeconds?: number; // bilangan bulat; default 900, dibatasi pada 30-3600
}
```

Dengan `multiSelect: true`, pengguna dapat memilih lebih dari satu opsi. Nilai
jawaban dikembalikan sebagai larik untuk setiap pertanyaan.

Contoh hasil yang telah dijawab:

```json
{
  "status": "answered",
  "answers": {
    "answers": {
      "deploy_target": ["Staging (Recommended)"]
    }
  }
}
```

## Panduan model

Kontrak yang ditujukan kepada model menginstruksikan agen untuk:

- bertanya hanya ketika terhambat oleh keputusan yang benar-benar berada di tangan pengguna;
- mengutamakan satu pertanyaan dan tidak menggunakan lebih dari tiga;
- menempatkan opsi yang direkomendasikan terlebih dahulu dan menambahkan `(Recommended)` pada akhir labelnya;
- tidak menyertakan opsi `Other` yang dibuat karena teks bebas ditambahkan secara otomatis;
- melanjutkan dengan pertimbangan terbaik setelah `no_answer`.

Agen tidak boleh menggunakan `ask_user` untuk menanyakan apakah boleh melanjutkan atau untuk mengonfirmasi
rencananya sendiri.
