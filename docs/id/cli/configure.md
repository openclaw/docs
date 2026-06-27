---
read_when:
    - Anda ingin menyesuaikan kredensial, perangkat, atau default agen secara interaktif
summary: Referensi CLI untuk `openclaw configure` (prompt konfigurasi interaktif)
title: Konfigurasi
x-i18n:
    generated_at: "2026-06-27T17:17:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 55178b3d772297686aeead9799b97dd5d836b908baabde1fce7918d38446fcff
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompt interaktif untuk perubahan tertarget pada penyiapan yang sudah ada: kredensial, perangkat, default agen, Gateway, kanal, plugin, Skills, dan pemeriksaan kesehatan.

Gunakan `openclaw onboard` untuk alur terpandu lengkap saat pertama kali dijalankan, `openclaw setup` hanya untuk konfigurasi/ruang kerja dasar, dan `openclaw channels add` saat Anda hanya perlu menyiapkan akun kanal.

<Note>
Bagian **Model** menyertakan multi-pilih untuk allowlist `agents.defaults.models` (yang muncul di `/model` dan pemilih model). Pilihan penyiapan yang dicakup penyedia menggabungkan model yang dipilih ke allowlist yang sudah ada, alih-alih mengganti penyedia lain yang tidak terkait yang sudah ada dalam konfigurasi.

Menjalankan ulang autentikasi penyedia dari configure mempertahankan `agents.defaults.model.primary` yang sudah ada, bahkan saat langkah autentikasi penyedia mengembalikan patch konfigurasi dengan model default rekomendasinya sendiri. Artinya, menambahkan atau mengautentikasi ulang xAI, OpenRouter, atau penyedia lain akan membuat model baru tersedia tanpa mengambil alih dari model utama Anda saat ini. Gunakan `openclaw models auth login --provider <id> --set-default` atau `openclaw models set <model>` saat Anda memang ingin mengubah model default.
</Note>

Saat configure dimulai dari pilihan autentikasi penyedia, pemilih model default dan allowlist otomatis memprioritaskan penyedia tersebut. Untuk penyedia berpasangan seperti Volcengine dan BytePlus, preferensi yang sama juga mencocokkan varian paket coding mereka (`volcengine-plan/*`, `byteplus-plan/*`). Jika filter penyedia pilihan akan menghasilkan daftar kosong, configure akan kembali ke katalog tanpa filter alih-alih menampilkan pemilih kosong.

<Tip>
`openclaw config` tanpa subperintah membuka wizard yang sama. Gunakan `openclaw config get|set|unset` untuk pengeditan non-interaktif.
</Tip>

Untuk pencarian web, `openclaw configure --section web` memungkinkan Anda memilih penyedia
dan mengonfigurasi kredensialnya. Beberapa penyedia juga menampilkan prompt lanjutan
khusus penyedia:

- **Grok** dapat menawarkan penyiapan opsional `x_search` dengan profil OAuth xAI yang sama
  atau kunci API dan memungkinkan Anda memilih model `x_search`.
- **Kimi** dapat meminta wilayah API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) dan model pencarian web Kimi default.

Terkait:

- Referensi konfigurasi Gateway: [Konfigurasi](/id/gateway/configuration)
- CLI konfigurasi: [Konfigurasi](/id/cli/config)

## Opsi

- `--section <section>`: filter bagian yang dapat diulang

Bagian yang tersedia:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Catatan:

- Wizard lengkap dan bagian terkait Gateway menanyakan di mana Gateway berjalan dan memperbarui `gateway.mode`. Filter bagian yang tidak menyertakan `gateway`, `daemon`, atau `health` langsung menuju penyiapan yang diminta.
- Setelah penulisan konfigurasi lokal, configure memasang plugin pilihan yang dapat diunduh saat jalur penyiapan yang dipilih membutuhkannya. Konfigurasi gateway jarak jauh tidak memasang paket plugin lokal.
- Layanan berorientasi kanal (Slack/Discord/Matrix/Microsoft Teams) meminta allowlist kanal/ruang selama penyiapan. Anda dapat memasukkan nama atau ID; wizard menyelesaikan nama menjadi ID jika memungkinkan.
- Jika Anda menjalankan langkah instalasi daemon, autentikasi token memerlukan token, dan `gateway.auth.token` dikelola SecretRef, configure memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang telah diselesaikan ke metadata lingkungan layanan supervisor.
- Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi belum terselesaikan, configure memblokir instalasi daemon dengan panduan remediasi yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum disetel, configure memblokir instalasi daemon sampai mode disetel secara eksplisit.

## Contoh

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Terkait

- [Referensi CLI](/id/cli)
- [Konfigurasi](/id/gateway/configuration)
