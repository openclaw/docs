---
read_when:
    - Anda ingin menyesuaikan kredensial, perangkat, atau pengaturan bawaan agen secara interaktif
summary: Referensi CLI untuk `openclaw configure` (prompt konfigurasi interaktif)
title: Konfigurasi
x-i18n:
    generated_at: "2026-05-02T09:14:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16e45fdead5e8026e8d359a09c799fb1248226a9425fcd9ff956d165b880663d
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompt interaktif untuk menyiapkan kredensial, perangkat, dan default agen.

<Note>
Bagian **Model** menyertakan multi-pilih untuk daftar izin `agents.defaults.models` (yang muncul di `/model` dan pemilih model). Pilihan penyiapan dalam cakupan penyedia menggabungkan model yang dipilih ke daftar izin yang ada, bukan mengganti penyedia lain yang tidak terkait yang sudah ada di konfigurasi.

Menjalankan ulang autentikasi penyedia dari configure mempertahankan `agents.defaults.model.primary` yang sudah ada, bahkan ketika langkah autentikasi penyedia mengembalikan patch konfigurasi dengan model default rekomendasinya sendiri. Ini berarti menambahkan atau mengautentikasi ulang xAI, OpenRouter, atau penyedia lain seharusnya membuat model baru tersedia tanpa mengambil alih dari model utama Anda saat ini. Gunakan `openclaw models auth login --provider <id> --set-default` atau `openclaw models set <model>` ketika Anda memang ingin mengubah model default.
</Note>

Ketika configure dimulai dari pilihan autentikasi penyedia, pemilih model default dan daftar izin otomatis memprioritaskan penyedia tersebut. Untuk penyedia berpasangan seperti Volcengine dan BytePlus, preferensi yang sama juga cocok dengan varian rencana coding mereka (`volcengine-plan/*`, `byteplus-plan/*`). Jika filter penyedia pilihan akan menghasilkan daftar kosong, configure kembali ke katalog tanpa filter alih-alih menampilkan pemilih kosong.

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

- Memilih tempat Gateway berjalan selalu memperbarui `gateway.mode`. Anda dapat memilih "Lanjutkan" tanpa bagian lain jika hanya itu yang Anda perlukan.
- Setelah penulisan konfigurasi lokal, configure memasang plugin yang dapat diunduh yang dipilih ketika jalur penyiapan yang dipilih memerlukannya. Konfigurasi gateway jarak jauh tidak memasang paket plugin lokal.
- Layanan berorientasi kanal (Slack/Discord/Matrix/Microsoft Teams) meminta daftar izin kanal/ruang selama penyiapan. Anda dapat memasukkan nama atau ID; wizard akan menyelesaikan nama menjadi ID bila memungkinkan.
- Jika Anda menjalankan langkah pemasangan daemon, autentikasi token memerlukan token, dan `gateway.auth.token` dikelola SecretRef, configure memvalidasi SecretRef tetapi tidak mempertahankan nilai token teks biasa yang sudah diselesaikan ke metadata lingkungan layanan supervisor.
- Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, configure memblokir pemasangan daemon dengan panduan perbaikan yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum disetel, configure memblokir pemasangan daemon hingga mode disetel secara eksplisit.

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
