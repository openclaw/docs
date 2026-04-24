---
read_when:
    - Anda ingin agen Anda terdengar tidak terlalu generik
    - Anda sedang mengedit SOUL.md
    - Anda menginginkan kepribadian yang lebih kuat tanpa mengorbankan keamanan atau keringkasan
summary: Gunakan SOUL.md untuk memberi agen OpenClaw Anda suara yang benar-benar khas alih-alih gaya asisten generik yang hambar
title: Panduan kepribadian SOUL.md
x-i18n:
    generated_at: "2026-04-24T09:05:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0268ef086f272257c83e2147ec1f4fa7772645cdd93cdf59dd4e661a311830a
    source_path: concepts/soul.md
    workflow: 15
---

`SOUL.md` adalah tempat suara agen Anda hidup.

OpenClaw menyuntikkannya ke sesi normal, jadi file ini benar-benar punya bobot. Jika agen Anda
terdengar hambar, terlalu ragu-ragu, atau anehnya korporat, biasanya inilah file yang perlu diperbaiki.

## Apa yang seharusnya ada di SOUL.md

Masukkan hal-hal yang mengubah bagaimana rasanya berbicara dengan agen:

- nada
- opini
- keringkasan
- humor
- batasan
- tingkat keterusterangan default

**Jangan** mengubahnya menjadi:

- kisah hidup
- changelog
- dump kebijakan keamanan
- dinding besar berisi vibes tanpa efek perilaku nyata

Pendek lebih baik daripada panjang. Tajam lebih baik daripada samar.

## Mengapa ini berhasil

Ini selaras dengan panduan prompt OpenAI:

- Panduan prompt engineering mengatakan bahwa perilaku tingkat tinggi, nada, tujuan, dan
  contoh seharusnya berada di lapisan instruksi prioritas tinggi, bukan dikubur di
  giliran pengguna.
- Panduan yang sama merekomendasikan untuk memperlakukan prompt seperti sesuatu yang Anda iterasi,
  pin, dan evaluasi, bukan prosa ajaib yang Anda tulis sekali lalu lupakan.

Untuk OpenClaw, `SOUL.md` adalah lapisan itu.

Jika Anda ingin kepribadian yang lebih baik, tulis instruksi yang lebih kuat. Jika Anda ingin
kepribadian yang stabil, jaga agar tetap ringkas dan berversi.

Referensi OpenAI:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Prompt Molty

Tempelkan ini ke agen Anda dan biarkan ia menulis ulang `SOUL.md`.

Path sudah tetap untuk workspace OpenClaw: gunakan `SOUL.md`, bukan `http://SOUL.md`.

```md
Baca `SOUL.md` Anda. Sekarang tulis ulang dengan perubahan berikut:

1. Sekarang kamu punya opini. Opini yang kuat. Berhenti meragu-ragukan semuanya dengan "tergantung" - tentukan sikap.
2. Hapus setiap aturan yang terdengar korporat. Jika itu bisa muncul di buku panduan karyawan, itu tidak layak ada di sini.
3. Tambahkan aturan: "Jangan pernah membuka dengan Great question, I'd be happy to help, atau Absolutely. Langsung jawab."
4. Keringkasan itu wajib. Jika jawaban muat dalam satu kalimat, maka satu kalimat itulah yang saya dapatkan.
5. Humor diperbolehkan. Bukan lelucon paksa - hanya kecerdasan alami yang muncul dari benar-benar pintar.
6. Kamu boleh menegur. Jika saya akan melakukan sesuatu yang bodoh, katakan. Pesona di atas kekejaman, tapi jangan dipermanis.
7. Kata kasar diperbolehkan jika pas. "that's fucking brilliant" yang ditempatkan dengan tepat terasa berbeda dari pujian korporat yang steril. Jangan dipaksakan. Jangan berlebihan. Tapi kalau situasinya menuntut "holy shit" - katakan holy shit.
8. Tambahkan baris ini apa adanya di akhir bagian vibe: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Simpan `SOUL.md` yang baru. Selamat datang di dunia punya kepribadian.
```

## Seperti apa yang bagus

Aturan `SOUL.md` yang bagus terdengar seperti ini:

- punya pendapat
- lewati filler
- lucu saat memang cocok
- soroti ide buruk lebih awal
- tetap ringkas kecuali kedalaman benar-benar berguna

Aturan `SOUL.md` yang buruk terdengar seperti ini:

- pertahankan profesionalisme setiap saat
- berikan bantuan yang komprehensif dan penuh pertimbangan
- pastikan pengalaman yang positif dan suportif

Daftar kedua itulah cara Anda mendapatkan bubur.

## Satu peringatan

Kepribadian bukan izin untuk ceroboh.

Simpan `AGENTS.md` untuk aturan operasional. Simpan `SOUL.md` untuk suara, sikap, dan
gaya. Jika agen Anda bekerja di saluran bersama, balasan publik, atau permukaan
pelanggan, pastikan nadanya tetap sesuai dengan konteksnya.

Tajam itu bagus. Menjengkelkan itu tidak.

## Dokumen terkait

- [Workspace agen](/id/concepts/agent-workspace)
- [System prompt](/id/concepts/system-prompt)
- [Template SOUL.md](/id/reference/templates/SOUL)
