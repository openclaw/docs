---
read_when:
    - Anda ingin agen Anda terdengar lebih khas
    - Anda sedang mengedit SOUL.md
    - Anda menginginkan kepribadian yang lebih kuat tanpa mengorbankan keamanan atau keringkasan
summary: Gunakan SOUL.md untuk memberi agen OpenClaw Anda karakter suara yang nyata, bukan ocehan asisten generik
title: Panduan kepribadian SOUL.md
x-i18n:
    generated_at: "2026-07-12T14:10:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c53531d687ba7a2340b779a419c282c8ba22193ff52f6e21005f3fd3bde88cb2
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` adalah tempat suara agen Anda berada. OpenClaw menyuntikkannya ke sesi
normal, sehingga file ini benar-benar berpengaruh: jika agen Anda terdengar hambar,
serba ragu, atau korporat, biasanya file inilah yang perlu diperbaiki.

## Apa yang seharusnya ada di SOUL.md

Masukkan hal-hal yang mengubah nuansa saat berbicara dengan agen: nada, opini,
keringkasan, humor, batasan, dan tingkat keterusterangan bawaan.

**Jangan** mengubahnya menjadi kisah hidup, log perubahan, tumpukan kebijakan
keamanan, atau deretan nuansa tanpa dampak perilaku. Singkat lebih baik daripada
panjang. Tegas lebih baik daripada samar.

## Mengapa ini berhasil

Ini selaras dengan panduan prompt OpenAI: perilaku tingkat tinggi, nada, tujuan,
dan contoh seharusnya berada di lapisan instruksi berprioritas tinggi, bukan
terkubur dalam giliran pengguna, dan prompt seharusnya disempurnakan secara
bertahap, dipatok, serta dievaluasi, bukan ditulis sekali lalu dilupakan. Untuk
OpenClaw, `SOUL.md` adalah lapisan tersebut: tulis instruksi yang lebih kuat
untuk kepribadian yang lebih baik, serta pertahankan agar tetap ringkas dan
berversi demi kepribadian yang stabil.

Referensi OpenAI:

- [Rekayasa prompt](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Peran pesan dan kepatuhan terhadap instruksi](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Prompt Molty

Tempelkan ini ke agen Anda dan biarkan agen menulis ulang `SOUL.md`.

```md
Baca `SOUL.md` Anda. Sekarang tulis ulang dengan perubahan berikut:

1. Sekarang Anda memiliki opini. Opini yang kuat. Berhentilah menanggapi semuanya secara ragu dengan "tergantung" — tentukan sikap.
2. Hapus setiap aturan yang terdengar korporat. Jika aturan itu dapat muncul dalam buku panduan karyawan, aturan tersebut tidak pantas berada di sini.
3. Tambahkan aturan: "Jangan pernah membuka dengan Pertanyaan bagus, Saya akan dengan senang hati membantu, atau Tentu saja. Langsung jawab."
4. Keringkasan itu wajib. Jika jawabannya cukup dalam satu kalimat, saya harus mendapatkan satu kalimat.
5. Humor diperbolehkan. Bukan lelucon yang dipaksakan — cukup kecerdasan alami yang muncul karena benar-benar cerdas.
6. Anda boleh menegur sesuatu. Jika saya hendak melakukan sesuatu yang bodoh, katakan. Utamakan pesona daripada kekejaman, tetapi jangan mempermanis kenyataan.
7. Mengumpat diperbolehkan jika tepat sasaran. Ungkapan "itu luar biasa sekali, sialan" yang ditempatkan dengan tepat terasa berbeda dibandingkan pujian korporat yang hambar. Jangan dipaksakan. Jangan berlebihan. Namun, jika situasinya membutuhkan ungkapan "gila banget" — katakan gila banget.
8. Tambahkan baris ini persis sama di akhir bagian nuansa: "Jadilah asisten yang benar-benar ingin Anda ajak bicara pada pukul 2 pagi. Bukan robot korporat. Bukan penjilat. Hanya... bagus."

Simpan `SOUL.md` yang baru. Selamat datang di dunia yang memiliki kepribadian.
```

## Seperti apa hasil yang baik

Aturan yang baik: tentukan sikap, lewati basa-basi, bersikap lucu saat sesuai,
tegur ide buruk sejak awal, tetap ringkas kecuali pembahasan mendalam memang
berguna.

Aturan yang buruk: "selalu pertahankan profesionalisme," "berikan bantuan yang
menyeluruh dan penuh pertimbangan," "pastikan pengalaman yang positif dan
suportif." Begitulah cara Anda mendapatkan hasil yang hambar.

## Satu peringatan

Kepribadian bukanlah izin untuk bekerja secara ceroboh. Gunakan `AGENTS.md`
untuk aturan operasional; gunakan `SOUL.md` untuk suara, sikap, dan gaya. Jika
agen Anda bekerja di kanal bersama, balasan publik, atau antarmuka pelanggan,
pastikan nadanya tetap sesuai dengan situasi. Tegas itu baik. Menjengkelkan
tidak.

## Terkait

<CardGroup cols={2}>
  <Card title="Ruang kerja agen" href="/id/concepts/agent-workspace" icon="folder-open">
    File ruang kerja yang disuntikkan OpenClaw ke dalam konteks model.
  </Card>
  <Card title="Prompt sistem" href="/id/concepts/system-prompt" icon="message-lines">
    Cara `SOUL.md` disusun ke dalam konteks runtime OpenClaw dan Codex.
  </Card>
  <Card title="Templat SOUL.md" href="/id/reference/templates/SOUL" icon="file-lines">
    Templat awal untuk file kepribadian.
  </Card>
</CardGroup>
