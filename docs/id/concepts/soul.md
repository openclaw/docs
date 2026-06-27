---
read_when:
    - Anda ingin agen Anda terdengar tidak terlalu generik
    - Anda sedang mengedit SOUL.md
    - Anda menginginkan kepribadian yang lebih kuat tanpa mengorbankan keamanan atau keringkasan
summary: Gunakan SOUL.md untuk memberi agen OpenClaw Anda suara yang nyata, bukan gaya asisten generik yang hambar
title: SOUL.md panduan kepribadian
x-i18n:
    generated_at: "2026-06-27T17:27:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` adalah tempat suara agent Anda berada.

OpenClaw menyuntikkannya pada sesi normal, jadi file ini benar-benar berpengaruh. Jika agent Anda
terdengar hambar, terlalu ragu-ragu, atau anehnya korporat, biasanya inilah file yang perlu diperbaiki.

## Apa yang termasuk dalam SOUL.md

Masukkan hal-hal yang mengubah rasa percakapan dengan agent:

- nada
- opini
- keringkasan
- humor
- batasan
- tingkat keterusterangan bawaan

Jangan **pernah** mengubahnya menjadi:

- kisah hidup
- changelog
- tumpukan kebijakan keamanan
- dinding besar berisi nuansa tanpa efek perilaku

Pendek mengalahkan panjang. Tajam mengalahkan samar.

## Mengapa ini berhasil

Ini sejalan dengan panduan prompt OpenAI:

- Panduan rekayasa prompt mengatakan perilaku tingkat tinggi, nada, tujuan, dan
  contoh berada di lapisan instruksi berprioritas tinggi, bukan terkubur di
  giliran pengguna.
- Panduan yang sama menyarankan untuk memperlakukan prompt sebagai sesuatu yang Anda iterasi,
  pin, dan evaluasi, bukan prosa ajaib yang Anda tulis sekali lalu lupakan.

Untuk OpenClaw, `SOUL.md` adalah lapisan itu.

Jika Anda ingin kepribadian yang lebih baik, tulis instruksi yang lebih kuat. Jika Anda ingin kepribadian
yang stabil, jaga agar instruksinya ringkas dan berversi.

Referensi OpenAI:

- [Rekayasa prompt](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Peran pesan dan kepatuhan instruksi](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Prompt Molty

Tempelkan ini ke agent Anda dan biarkan ia menulis ulang `SOUL.md`.

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

## Seperti apa yang baik

Aturan `SOUL.md` yang baik terdengar seperti ini:

- punya pendirian
- lewati pengisi
- lucu saat cocok
- tegur ide buruk sejak awal
- tetap ringkas kecuali kedalaman benar-benar berguna

Aturan `SOUL.md` yang buruk terdengar seperti ini:

- menjaga profesionalisme setiap saat
- memberikan bantuan yang komprehensif dan penuh pertimbangan
- memastikan pengalaman yang positif dan suportif

Daftar kedua itulah cara Anda mendapatkan bubur.

## Satu peringatan

Kepribadian bukan izin untuk ceroboh.

Simpan `AGENTS.md` untuk aturan operasi. Simpan `SOUL.md` untuk suara, sikap, dan
gaya. Jika agent Anda bekerja di kanal bersama, balasan publik, atau permukaan
pelanggan, pastikan nadanya tetap sesuai dengan ruangnya.

Tajam itu bagus. Menyebalkan tidak.

## Terkait

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/id/concepts/agent-workspace" icon="folder-open">
    File workspace yang disuntikkan OpenClaw ke konteks model.
  </Card>
  <Card title="System prompt" href="/id/concepts/system-prompt" icon="message-lines">
    Bagaimana `SOUL.md` disusun ke dalam konteks runtime OpenClaw dan Codex.
  </Card>
  <Card title="SOUL.md template" href="/id/reference/templates/SOUL" icon="file-lines">
    Templat awal untuk file kepribadian.
  </Card>
</CardGroup>
