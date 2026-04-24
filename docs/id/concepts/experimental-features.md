---
read_when:
    - Anda melihat kunci konfigurasi `.experimental` dan ingin mengetahui apakah itu stabil
    - Anda ingin mencoba fitur runtime pratinjau tanpa mencampurkannya dengan default normal
    - Anda menginginkan satu tempat untuk menemukan flag eksperimental yang saat ini didokumentasikan
summary: Arti flag eksperimental di OpenClaw dan flag mana yang saat ini didokumentasikan
title: Fitur eksperimental
x-i18n:
    generated_at: "2026-04-24T09:04:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a97e8efa180844e1ca94495d626956847a15a15bba0846aaf54ff9c918cda02
    source_path: concepts/experimental-features.md
    workflow: 15
---

Fitur eksperimental di OpenClaw adalah **permukaan pratinjau opt-in**. Fitur ini
berada di balik flag eksplisit karena masih membutuhkan pemakaian di dunia nyata sebelum
layak mendapatkan default yang stabil atau kontrak publik jangka panjang.

Perlakukan berbeda dari konfigurasi normal:

- Biarkan **nonaktif secara default** kecuali dokumen terkait menyarankan Anda untuk mencobanya.
- Harapkan **bentuk dan perilaku berubah** lebih cepat daripada konfigurasi stabil.
- Utamakan jalur stabil terlebih dahulu jika sudah ada.
- Jika Anda meluncurkan OpenClaw secara luas, uji flag eksperimental di lingkungan yang
  lebih kecil sebelum memasukkannya ke baseline bersama.

## Flag yang saat ini didokumentasikan

| Permukaan                | Kunci                                                     | Gunakan saat                                                                                                   | Selengkapnya                                                                                  |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime model lokal      | `agents.defaults.experimental.localModelLean`             | Backend lokal yang lebih kecil atau lebih ketat tersendat oleh permukaan tool default penuh OpenClaw          | [Model Lokal](/id/gateway/local-models)                                                          |
| Pencarian memori         | `agents.defaults.memorySearch.experimental.sessionMemory` | Anda ingin `memory_search` mengindeks transkrip sesi sebelumnya dan menerima biaya penyimpanan/pengindeksan tambahan | [Referensi konfigurasi Memory](/id/reference/memory-config#session-memory-search-experimental) |
| Tool perencanaan terstruktur | `tools.experimental.planTool`                         | Anda ingin tool `update_plan` terstruktur diekspos untuk pelacakan pekerjaan multi-langkah di runtime dan UI yang kompatibel | [Referensi konfigurasi Gateway](/id/gateway/config-tools#toolsexperimental)                  |

## Mode lean model lokal

`agents.defaults.experimental.localModelLean: true` adalah katup pelepas tekanan
untuk penyiapan model lokal yang lebih lemah. Ini memangkas tool default yang berat seperti
`browser`, `cron`, dan `message` sehingga bentuk prompt menjadi lebih kecil dan tidak terlalu rapuh
untuk backend kompatibel OpenAI dengan konteks kecil atau yang lebih ketat.

Ini sengaja **bukan** jalur normal. Jika backend Anda menangani runtime penuh
dengan baik, biarkan tetap nonaktif.

## Eksperimental tidak berarti tersembunyi

Jika sebuah fitur eksperimental, OpenClaw harus mengatakannya dengan jelas di dokumentasi dan di
path konfigurasinya sendiri. Yang **tidak** boleh dilakukan adalah menyelundupkan perilaku pratinjau ke dalam
knob default yang tampak stabil lalu berpura-pura itu normal. Itulah cara permukaan
konfigurasi menjadi berantakan.

## Terkait

- [Fitur](/id/concepts/features)
- [Channel rilis](/id/install/development-channels)
