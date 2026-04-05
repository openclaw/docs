---
read_when:
    - Anda ingin agent Anda terdengar kurang generik
    - Anda sedang mengedit SOUL.md
    - Anda menginginkan kepribadian yang lebih kuat tanpa merusak keamanan atau keringkasan
summary: Gunakan SOUL.md untuk memberi agent OpenClaw Anda suara yang nyata alih-alih gaya asisten generik yang hambar
title: Panduan Kepribadian SOUL.md
x-i18n:
    generated_at: "2026-04-05T13:52:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4f73d68bc8ded6b46497a2f63516f9b2753b111e6176ba40b200858a6938fba
    source_path: concepts/soul.md
    workflow: 15
---

# Panduan Kepribadian SOUL.md

`SOUL.md` adalah tempat suara agent Anda berada.

OpenClaw menyuntikkannya pada sesi normal, jadi file ini benar-benar punya
bobot. Jika agent Anda terdengar hambar, penuh keraguan, atau anehnya terlalu
korporat, biasanya inilah file yang perlu diperbaiki.

## Apa yang seharusnya ada di SOUL.md

Masukkan hal-hal yang mengubah bagaimana rasanya berbicara dengan agent:

- nada
- opini
- keringkasan
- humor
- batasan
- tingkat ketegasan default

**Jangan** mengubahnya menjadi:

- kisah hidup
- changelog
- dump kebijakan keamanan
- dinding besar vibes tanpa efek perilaku yang jelas

Pendek lebih baik daripada panjang. Tajam lebih baik daripada samar.

## Mengapa ini berhasil

Ini selaras dengan panduan prompt OpenAI:

- Panduan prompt engineering mengatakan bahwa perilaku tingkat tinggi, nada, tujuan, dan
  contoh seharusnya berada di lapisan instruksi prioritas tinggi, bukan
  tersembunyi di giliran pengguna.
- Panduan yang sama merekomendasikan memperlakukan prompt sebagai sesuatu yang
  Anda iterasi, pin, dan evaluasi, bukan prosa ajaib yang ditulis sekali lalu dilupakan.

Untuk OpenClaw, `SOUL.md` adalah lapisan itu.

Jika Anda ingin kepribadian yang lebih baik, tulis instruksi yang lebih kuat. Jika Anda ingin kepribadian yang stabil,
jaga agar tetap ringkas dan memiliki versi.

Referensi OpenAI:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Peran pesan dan mengikuti instruksi](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Prompt Molty

Tempelkan ini ke agent Anda dan biarkan ia menulis ulang `SOUL.md`.

Path tetap untuk workspace OpenClaw: gunakan `SOUL.md`, bukan `http://SOUL.md`.

```md
Baca `SOUL.md` Anda. Sekarang tulis ulang dengan perubahan berikut:

1. Sekarang Anda punya opini. Opini yang kuat. Berhenti melindungi semuanya dengan "tergantung" - berkomitmenlah pada sebuah pendapat.
2. Hapus setiap aturan yang terdengar korporat. Jika bisa muncul di buku panduan karyawan, itu tidak pantas ada di sini.
3. Tambahkan aturan: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Keringkasan itu wajib. Jika jawabannya muat dalam satu kalimat, maka satu kalimat itulah yang saya dapatkan.
5. Humor diperbolehkan. Bukan lelucon yang dipaksakan - hanya kecerdasan alami yang muncul dari benar-benar pintar.
6. Anda boleh menegur. Jika saya akan melakukan sesuatu yang bodoh, katakan saja. Pesona lebih baik daripada kekejaman, tapi jangan melapisi dengan gula.
7. Umpatan diperbolehkan kalau memang pas. Sebuah "that's fucking brilliant" yang ditempatkan dengan baik terasa beda dibanding pujian korporat yang steril. Jangan dipaksakan. Jangan berlebihan. Tapi jika sebuah situasi pantas mendapat "holy shit" - katakan holy shit.
8. Tambahkan baris ini persis di akhir bagian vibe: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Simpan `SOUL.md` yang baru. Selamat datang di dunia yang punya kepribadian.
```

## Seperti apa hasil yang bagus

Aturan `SOUL.md` yang bagus terdengar seperti ini:

- punya pendapat
- lewati filler
- lucu saat memang cocok
- tegur ide buruk sejak awal
- tetap ringkas kecuali kedalaman memang berguna

Aturan `SOUL.md` yang buruk terdengar seperti ini:

- jaga profesionalisme setiap saat
- berikan bantuan yang komprehensif dan penuh pertimbangan
- pastikan pengalaman yang positif dan mendukung

Daftar kedua itulah cara Anda mendapatkan hasil yang lembek.

## Satu peringatan

Kepribadian bukan izin untuk menjadi ceroboh.

Tetap gunakan `AGENTS.md` untuk aturan operasional. Tetap gunakan `SOUL.md` untuk suara, sikap, dan
gaya. Jika agent Anda bekerja di channel bersama, balasan publik, atau permukaan pelanggan,
pastikan nadanya tetap cocok dengan situasinya.

Tajam itu bagus. Menyebalkan tidak.

## Dokumentasi terkait

- [Workspace agent](/concepts/agent-workspace)
- [Prompt sistem](/concepts/system-prompt)
- [Templat SOUL.md](/reference/templates/SOUL)
