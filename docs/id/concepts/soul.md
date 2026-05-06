---
read_when:
    - Anda ingin agen Anda terdengar tidak terlalu generik
    - Anda sedang mengedit SOUL.md
    - Anda menginginkan kepribadian yang lebih kuat tanpa mengorbankan keamanan atau keringkasan
summary: Gunakan SOUL.md untuk memberi agen OpenClaw Anda suara yang nyata alih-alih gaya asisten generik yang hambar
title: Panduan kepribadian SOUL.md
x-i18n:
    generated_at: "2026-05-06T09:09:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2101c0c7a22ab1fe5acfd0d2d413a002326dca380fc6e020a7d77a242d13c3d7
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` adalah tempat suara agen Anda berada.

OpenClaw menyisipkannya pada sesi normal, jadi file ini punya bobot nyata. Jika agen Anda
terdengar hambar, ragu-ragu, atau anehnya terlalu korporat, biasanya inilah file yang perlu diperbaiki.

## Apa yang seharusnya ada di SOUL.md

Masukkan hal-hal yang mengubah rasa saat berbicara dengan agen:

- nada
- opini
- keringkasan
- humor
- batasan
- tingkat keterusterangan bawaan

Jangan **mengubahnya** menjadi:

- kisah hidup
- changelog
- tumpahan kebijakan keamanan
- dinding besar berisi nuansa tanpa efek perilaku

Pendek mengalahkan panjang. Tajam mengalahkan samar.

## Mengapa ini berhasil

Ini selaras dengan panduan prompt OpenAI:

- Panduan rekayasa prompt mengatakan perilaku tingkat tinggi, nada, tujuan, dan
  contoh seharusnya berada di lapisan instruksi berprioritas tinggi, bukan dikubur di
  giliran pengguna.
- Panduan yang sama menyarankan memperlakukan prompt sebagai sesuatu yang Anda iterasikan,
  tetapkan, dan evaluasi, bukan prosa ajaib yang Anda tulis sekali lalu lupakan.

Untuk OpenClaw, `SOUL.md` adalah lapisan itu.

Jika Anda menginginkan kepribadian yang lebih baik, tulis instruksi yang lebih kuat. Jika Anda menginginkan kepribadian yang stabil,
jaga agar tetap ringkas dan berversi.

Referensi OpenAI:

- [Rekayasa prompt](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Peran pesan dan kepatuhan instruksi](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Prompt Molty

Tempelkan ini ke agen Anda dan biarkan agen menulis ulang `SOUL.md`.

Path tetap untuk workspace OpenClaw: gunakan `SOUL.md`, bukan `http://SOUL.md`.

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## Seperti apa yang bagus

Aturan `SOUL.md` yang bagus terdengar seperti ini:

- punya pendirian
- lewati pengisi
- lucu saat memang cocok
- tunjukkan ide buruk sejak awal
- tetap ringkas kecuali kedalaman benar-benar berguna

Aturan `SOUL.md` yang buruk terdengar seperti ini:

- menjaga profesionalisme setiap saat
- memberikan bantuan yang komprehensif dan penuh pertimbangan
- memastikan pengalaman yang positif dan suportif

Daftar kedua itulah cara Anda mendapatkan bubur.

## Satu peringatan

Kepribadian bukan izin untuk ceroboh.

Simpan `AGENTS.md` untuk aturan operasional. Simpan `SOUL.md` untuk suara, sikap, dan
gaya. Jika agen Anda bekerja di kanal bersama, balasan publik, atau permukaan pelanggan,
pastikan nadanya tetap sesuai dengan ruangnya.

Tajam itu bagus. Menyebalkan itu tidak.

## Terkait

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/id/concepts/agent-workspace" icon="folder-open">
    File workspace yang disisipkan OpenClaw ke dalam prompt sistem.
  </Card>
  <Card title="System prompt" href="/id/concepts/system-prompt" icon="message-lines">
    Cara `SOUL.md` disusun ke dalam prompt sistem per giliran.
  </Card>
  <Card title="SOUL.md template" href="/id/reference/templates/SOUL" icon="file-lines">
    Templat awal untuk file kepribadian.
  </Card>
</CardGroup>
