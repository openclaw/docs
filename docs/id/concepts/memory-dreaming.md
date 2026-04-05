---
read_when:
    - Anda ingin promosi memori berjalan secara otomatis
    - Anda ingin memahami mode dan ambang dreaming
    - Anda ingin menyetel konsolidasi tanpa mencemari MEMORY.md
summary: Promosi latar belakang dari ingatan jangka pendek ke memori jangka panjang
title: Dreaming (eksperimental)
x-i18n:
    generated_at: "2026-04-05T13:51:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9dbb29e9b49e940128c4e08c3fd058bb6ebb0148ca214b78008e3d5763ef1ab
    source_path: concepts/memory-dreaming.md
    workflow: 15
---

# Dreaming (eksperimental)

Dreaming adalah proses konsolidasi memori latar belakang di `memory-core`.

Disebut "dreaming" karena sistem meninjau kembali apa yang muncul sepanjang hari
dan memutuskan apa yang layak disimpan sebagai konteks yang tahan lama.

Dreaming bersifat **eksperimental**, **opt-in**, dan **nonaktif secara default**.

## Apa yang dilakukan dreaming

1. Melacak peristiwa recall jangka pendek dari hasil `memory_search` di
   `memory/YYYY-MM-DD.md`.
2. Memberi skor pada kandidat recall tersebut dengan sinyal berbobot.
3. Mempromosikan hanya kandidat yang memenuhi syarat ke `MEMORY.md`.

Ini menjaga agar memori jangka panjang tetap berfokus pada konteks yang tahan lama dan berulang, bukan
detail sekali pakai.

## Sinyal promosi

Dreaming menggabungkan empat sinyal:

- **Frekuensi**: seberapa sering kandidat yang sama dipanggil kembali.
- **Relevansi**: seberapa kuat skor recall saat diambil.
- **Keberagaman kueri**: berapa banyak intent kueri berbeda yang memunculkannya.
- **Keterkinian**: pembobotan temporal atas recall terbaru.

Promosi mengharuskan semua gerbang ambang yang dikonfigurasi lolos, bukan hanya satu sinyal.

### Bobot sinyal

| Sinyal     | Bobot | Deskripsi                                       |
| ---------- | ----- | ----------------------------------------------- |
| Frekuensi  | 0.35  | Seberapa sering entri yang sama dipanggil ulang |
| Relevansi  | 0.35  | Rata-rata skor recall saat diambil              |
| Keberagaman | 0.15 | Jumlah intent kueri berbeda yang memunculkannya |
| Keterkinian | 0.15 | Peluruhan temporal (paruh waktu 14 hari)        |

## Cara kerjanya

1. **Pelacakan recall** -- Setiap hasil `memory_search` dicatat ke
   `memory/.dreams/short-term-recall.json` dengan jumlah recall, skor, dan hash
   kueri.
2. **Penskoran terjadwal** -- Pada irama yang dikonfigurasi, kandidat diperingkat
   menggunakan sinyal berbobot. Semua gerbang ambang harus lolos secara bersamaan.
3. **Promosi** -- Entri yang memenuhi syarat ditambahkan ke `MEMORY.md` dengan
   stempel waktu promosi.
4. **Pembersihan** -- Entri yang sudah dipromosikan difilter dari siklus berikutnya. Kunci
   file mencegah eksekusi bersamaan.

## Mode

`dreaming.mode` mengontrol irama dan ambang default:

| Mode   | Irama          | minScore | minRecallCount | minUniqueQueries |
| ------ | -------------- | -------- | -------------- | ---------------- |
| `off`  | Dinonaktifkan  | --       | --             | --               |
| `core` | Setiap hari 3 pagi | 0.75  | 3              | 2                |
| `rem`  | Setiap 6 jam   | 0.85     | 4              | 3                |
| `deep` | Setiap 12 jam  | 0.80     | 3              | 3                |

## Model penjadwalan

Saat dreaming diaktifkan, `memory-core` mengelola jadwal berulang
secara otomatis. Anda tidak perlu membuat pekerjaan cron secara manual untuk fitur ini.

Anda tetap dapat menyetel perilaku dengan override eksplisit seperti:

- `dreaming.frequency` (ekspresi cron)
- `dreaming.timezone`
- `dreaming.limit`
- `dreaming.minScore`
- `dreaming.minRecallCount`
- `dreaming.minUniqueQueries`

## Konfigurasi

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "mode": "core"
          }
        }
      }
    }
  }
}
```

## Perintah chat

Ganti mode dan periksa status dari chat:

```
/dreaming core          # Beralih ke mode core (setiap malam)
/dreaming rem           # Beralih ke mode rem (setiap 6 jam)
/dreaming deep          # Beralih ke mode deep (setiap 12 jam)
/dreaming off           # Nonaktifkan dreaming
/dreaming status        # Tampilkan konfigurasi dan irama saat ini
/dreaming help          # Tampilkan panduan mode
```

## Perintah CLI

Pratinjau dan terapkan promosi dari baris perintah:

```bash
# Pratinjau kandidat promosi
openclaw memory promote

# Terapkan promosi ke MEMORY.md
openclaw memory promote --apply

# Batasi jumlah pratinjau
openclaw memory promote --limit 5

# Sertakan entri yang sudah dipromosikan
openclaw memory promote --include-promoted

# Periksa status dreaming
openclaw memory status --deep
```

Lihat [CLI memori](/cli/memory) untuk referensi flag lengkap.

## UI Dreams

Saat dreaming diaktifkan, sidebar Gateway menampilkan tab **Dreams** dengan
statistik memori (jumlah jangka pendek, jumlah jangka panjang, jumlah yang dipromosikan) dan waktu siklus terjadwal berikutnya.

## Bacaan lanjutan

- [Memori](/concepts/memory)
- [Pencarian Memori](/concepts/memory-search)
- [CLI memori](/cli/memory)
- [Referensi konfigurasi memori](/reference/memory-config)
