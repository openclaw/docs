---
read_when:
    - Anda ingin agen mengajukan pertanyaan terstruktur kepada pengguna
    - Anda sedang menjawab atau men-debug prompt ask_user
    - Anda memerlukan skema ask_user, batas waktu, atau perilaku saluran
summary: Cara ask_user menjeda giliran agen untuk keputusan manusia yang terstruktur
title: Tanyakan kepada pengguna
x-i18n:
    generated_at: "2026-07-19T05:13:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f8753f5b164a3656774c2f6133022eaaedb12b2e2d513d9c84279c6ba0e6f870
    source_path: tools/ask-user.md
    workflow: 16
---

`ask_user` memungkinkan agen mengajukan satu hingga tiga pertanyaan terstruktur kepada manusia dan
menunggu jawabannya. Alat ini ditujukan untuk keputusan yang benar-benar menjadi kewenangan pengguna,
bukan konfirmasi rutin atau informasi yang dapat disimpulkan agen dari permintaan,
kode, atau pilihan default yang wajar.

Alat ini hanya tersedia dalam sesi utama. Subagen dan proses non-utama
lainnya tidak menerimanya.

## Menjawab pertanyaan

Anda dapat menjawab dari permukaan percakapan apa pun yang didukung:

- Control UI web menambatkan panel pertanyaan tepat di atas penyusun pesan. Untuk
  prompt dengan beberapa pertanyaan, panel menampilkan satu pertanyaan pada satu waktu dan berlanjut
  melalui stepper singkat. Setelah diselesaikan, panel ditutup dan percakapan
  hanya menyimpan ringkasan jawaban yang ringkas.
- Telegram, Discord, dan Slack merender tombol native untuk prompt satu pertanyaan
  dengan satu pilihan.
- Balasan teks biasa dapat digunakan di saluran apa pun. Balas dengan angka, label opsi,
  atau jawaban Anda sendiri.

OpenClaw selalu mengaktifkan jawaban teks bebas **Lainnya**. Agen tidak boleh menambahkan opsi
`Other` ke daftar opsi yang dibuat.

## Perilaku platform

Jawaban dapat digunakan pada setiap permukaan percakapan yang didukung. Control UI web menggunakan
stepper tertambat yang menggantikan penyusun pesan saat diperluas; menciutkannya akan memulihkan
penyusun pesan lengkap di bawah bilah pertanyaan tipis. iOS, macOS, dan Android menampilkan
kartu sebaris; beberapa pertanyaan tetap ditumpuk sebagai pola yang sengaja dirancang agar ramah
sentuhan. Setiap platform mempertahankan ringkasan pertanyaan dan jawaban di linimasa
percakapan aktif tanpa penghapusan berbasis waktu, dan **Lewati** tersedia di mana saja.

Prompt yang tidak dapat menggunakan tombol native, termasuk prompt dengan beberapa pertanyaan dan
beberapa pilihan, diturunkan menjadi teks yang mudah dibaca di saluran. Control UI
mempertahankan stepper terstruktur lengkap.

## Batas waktu dan tanpa jawaban

Batas waktu default adalah 900 detik. `timeoutSeconds` dibatasi dalam rentang
30 hingga 3600 detik.

Jika pertanyaan kedaluwarsa atau dibatalkan sebelum jawaban diterima, alat
mengembalikan `status: "no_answer"`. Agen kemudian melanjutkan berdasarkan pertimbangan terbaiknya.
Proses agen yang dihentikan akan membatalkan pertanyaan Gateway yang tertunda.

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
  timeoutSeconds?: number; // bilangan bulat; default 900, dibatasi ke 30-3600
}
```

Dengan `multiSelect: true`, pengguna dapat memilih lebih dari satu opsi. Nilai
jawaban dikembalikan sebagai array untuk setiap pertanyaan.

Contoh hasil yang dijawab:

```json
{
  "status": "answered",
  "answers": {
    "answers": {
      "deploy_target": {
        "answers": ["Staging (Recommended)"]
      }
    }
  }
}
```

## Panduan model

Kontrak yang ditujukan kepada model menginstruksikan agen untuk:

- hanya bertanya ketika terhambat oleh keputusan yang benar-benar menjadi kewenangan pengguna;
- mengutamakan satu pertanyaan dan tidak menggunakan lebih dari tiga;
- menempatkan opsi yang direkomendasikan terlebih dahulu dan menambahkan `(Recommended)` pada akhir labelnya;
- tidak menyertakan opsi `Other` yang dibuat karena teks bebas ditambahkan secara otomatis;
- melanjutkan berdasarkan pertimbangan terbaik setelah `no_answer`.

Agen tidak boleh menggunakan `ask_user` untuk menanyakan apakah agen boleh melanjutkan atau untuk mengonfirmasi
rencananya sendiri.
