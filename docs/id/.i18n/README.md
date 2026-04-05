---
x-i18n:
    generated_at: "2026-04-05T13:42:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: f07671afbba2efa77f5fb43ebed242d0fdca835f7810fdd60998e537b73d1efc
    source_path: .i18n/README.md
    workflow: 15
---

# Aset i18n dokumen OpenClaw

Folder ini menyimpan konfigurasi terjemahan untuk repo dokumen sumber.

Pohon lokal yang dihasilkan dan memori terjemahan langsung kini berada di repo publikasi:

- repo: `openclaw/docs`
- checkout lokal: `~/Projects/openclaw-docs`

## Sumber kebenaran

- Dokumen bahasa Inggris ditulis di `openclaw/openclaw`.
- Pohon dokumen sumber berada di bawah `docs/`.
- Repo sumber tidak lagi menyimpan pohon lokal yang dihasilkan dan dikomit seperti `docs/zh-CN/**`, `docs/ja-JP/**`, `docs/es/**`, `docs/pt-BR/**`, `docs/ko/**`, `docs/de/**`, `docs/fr/**`, `docs/ar/**`, `docs/it/**`, `docs/tr/**`, `docs/id/**`, atau `docs/pl/**`.

## Alur end-to-end

1. Edit dokumen bahasa Inggris di `openclaw/openclaw`.
2. Push ke `main`.
3. `openclaw/openclaw/.github/workflows/docs-sync-publish.yml` mencerminkan pohon dokumen ke `openclaw/docs`.
4. Skrip sinkronisasi menulis ulang `docs/docs.json` publikasi agar blok pemilih lokal yang dihasilkan ada di sana meskipun tidak lagi dikomit di repo sumber.
5. `openclaw/docs/.github/workflows/translate-zh-cn.yml` menyegarkan `docs/zh-CN/**` sekali sehari, sesuai permintaan, dan setelah dispatch rilis repo sumber.
6. `openclaw/docs/.github/workflows/translate-ja-jp.yml` melakukan hal yang sama untuk `docs/ja-JP/**`.
7. `openclaw/docs/.github/workflows/translate-es.yml`, `translate-pt-br.yml`, `translate-ko.yml`, `translate-de.yml`, `translate-fr.yml`, `translate-ar.yml`, `translate-it.yml`, `translate-tr.yml`, `translate-id.yml`, dan `translate-pl.yml` melakukan hal yang sama untuk `docs/es/**`, `docs/pt-BR/**`, `docs/ko/**`, `docs/de/**`, `docs/fr/**`, `docs/ar/**`, `docs/it/**`, `docs/tr/**`, `docs/id/**`, dan `docs/pl/**`.

## Mengapa pemisahan ini ada

- Menjaga output lokal yang dihasilkan tetap berada di luar repo produk utama.
- Menjaga Mintlify tetap pada satu pohon dokumen yang dipublikasikan.
- Mempertahankan pengalih bahasa bawaan dengan membiarkan repo publikasi memiliki pohon lokal yang dihasilkan.

## File di folder ini

- `glossary.<lang>.json` — pemetaan istilah pilihan yang digunakan sebagai panduan prompt.
- `ar-navigation.json`, `de-navigation.json`, `es-navigation.json`, `fr-navigation.json`, `id-navigation.json`, `it-navigation.json`, `ja-navigation.json`, `ko-navigation.json`, `pl-navigation.json`, `pt-BR-navigation.json`, `tr-navigation.json`, `zh-Hans-navigation.json` — blok pemilih lokal Mintlify yang disisipkan kembali ke repo publikasi selama sinkronisasi.
- `<lang>.tm.jsonl` — memori terjemahan yang dikunci oleh workflow + model + hash teks.

Di repo ini, file TM lokal yang dihasilkan seperti `docs/.i18n/zh-CN.tm.jsonl`, `docs/.i18n/ja-JP.tm.jsonl`, `docs/.i18n/es.tm.jsonl`, `docs/.i18n/pt-BR.tm.jsonl`, `docs/.i18n/ko.tm.jsonl`, `docs/.i18n/de.tm.jsonl`, `docs/.i18n/fr.tm.jsonl`, `docs/.i18n/ar.tm.jsonl`, `docs/.i18n/it.tm.jsonl`, `docs/.i18n/tr.tm.jsonl`, `docs/.i18n/id.tm.jsonl`, dan `docs/.i18n/pl.tm.jsonl` memang sengaja tidak lagi dikomit.

## Format glosarium

`glossary.<lang>.json` adalah array entri:

```json
{
  "source": "troubleshooting",
  "target": "故障排除"
}
```

Kolom:

- `source`: frasa bahasa Inggris (atau sumber) yang diprioritaskan.
- `target`: output terjemahan pilihan.

## Mekanisme terjemahan

- `scripts/docs-i18n` masih memiliki tanggung jawab atas pembuatan terjemahan.
- Mode dokumen menulis `x-i18n.source_hash` ke setiap halaman yang diterjemahkan.
- Setiap workflow publikasi menghitung lebih dulu daftar file tertunda dengan membandingkan hash sumber bahasa Inggris saat ini dengan `x-i18n.source_hash` lokal yang tersimpan.
- Jika jumlah tertunda adalah `0`, langkah terjemahan yang mahal dilewati sepenuhnya.
- Jika ada file tertunda, workflow hanya menerjemahkan file-file tersebut.
- Workflow publikasi mencoba ulang kegagalan format model yang bersifat sementara, tetapi file yang tidak berubah tetap dilewati karena pemeriksaan hash yang sama dijalankan pada setiap percobaan ulang.
- Repo sumber juga melakukan dispatch penyegaran zh-CN, ja-JP, es, pt-BR, ko, de, fr, ar, it, tr, id, dan pl setelah rilis GitHub dipublikasikan agar dokumen rilis dapat menyusul tanpa menunggu cron harian.

## Catatan operasional

- Metadata sinkronisasi ditulis ke `.openclaw-sync/source.json` di repo publikasi.
- Secret repo sumber: `OPENCLAW_DOCS_SYNC_TOKEN`
- Secret repo publikasi: `OPENCLAW_DOCS_I18N_OPENAI_API_KEY`
- Jika output lokal terlihat usang, periksa workflow `Translate <locale>` yang sesuai di `openclaw/docs` terlebih dahulu.
