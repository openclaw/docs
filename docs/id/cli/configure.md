---
read_when:
    - Anda ingin menyesuaikan kredensial, perangkat, atau pengaturan bawaan agen secara interaktif
summary: Referensi CLI untuk `openclaw configure` (permintaan konfigurasi interaktif)
title: Konfigurasi
x-i18n:
    generated_at: "2026-04-30T09:38:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bde13a139c299879ff13a85c17afdd55dce7ad758418266854428b059d8a05e
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompt interaktif untuk menyiapkan kredensial, perangkat, dan default agen.

<Note>
Bagian **Model** menyertakan multi-pilih untuk daftar yang diizinkan `agents.defaults.models` (yang muncul di `/model` dan pemilih model). Pilihan penyiapan yang dicakup penyedia menggabungkan model yang dipilih ke dalam daftar yang diizinkan yang sudah ada, alih-alih mengganti penyedia lain yang tidak terkait yang sudah ada di konfigurasi. Menjalankan ulang autentikasi penyedia dari configure mempertahankan `agents.defaults.model.primary` yang sudah ada. Gunakan `openclaw models auth login --provider <id> --set-default` atau `openclaw models set <model>` saat Anda memang ingin mengubah model default.
</Note>

Saat configure dimulai dari pilihan autentikasi penyedia, pemilih model default dan daftar yang diizinkan otomatis mengutamakan penyedia tersebut. Untuk penyedia berpasangan seperti Volcengine dan BytePlus, preferensi yang sama juga cocok dengan varian paket coding mereka (`volcengine-plan/*`, `byteplus-plan/*`). Jika filter penyedia pilihan akan menghasilkan daftar kosong, configure kembali ke katalog tanpa filter alih-alih menampilkan pemilih kosong.

<Tip>
`openclaw config` tanpa subperintah membuka wizard yang sama. Gunakan `openclaw config get|set|unset` untuk pengeditan non-interaktif.
</Tip>

Untuk pencarian web, `openclaw configure --section web` memungkinkan Anda memilih penyedia
dan mengonfigurasi kredensialnya. Beberapa penyedia juga menampilkan prompt lanjutan
khusus penyedia:

- **Grok** dapat menawarkan penyiapan `x_search` opsional dengan `XAI_API_KEY` yang sama dan
  memungkinkan Anda memilih model `x_search`.
- **Kimi** dapat meminta region API Moonshot (`api.moonshot.ai` vs
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

- Memilih tempat Gateway berjalan selalu memperbarui `gateway.mode`. Anda dapat memilih "Lanjutkan" tanpa bagian lain jika hanya itu yang Anda butuhkan.
- Layanan berorientasi kanal (Slack/Discord/Matrix/Microsoft Teams) meminta daftar kanal/ruangan yang diizinkan selama penyiapan. Anda dapat memasukkan nama atau ID; wizard menyelesaikan nama menjadi ID jika memungkinkan.
- Jika Anda menjalankan langkah instal daemon, autentikasi token memerlukan token, dan `gateway.auth.token` dikelola SecretRef, configure memvalidasi SecretRef tetapi tidak menyimpan nilai token teks polos yang telah diselesaikan ke metadata lingkungan layanan supervisor.
- Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, configure memblokir instal daemon dengan panduan perbaikan yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum ditetapkan, configure memblokir instal daemon hingga mode ditetapkan secara eksplisit.

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
