---
read_when:
    - Anda ingin menyesuaikan kredensial, perangkat, atau default agen secara interaktif
summary: Referensi CLI untuk `openclaw configure` (perintah konfigurasi interaktif)
title: Konfigurasikan
x-i18n:
    generated_at: "2026-07-19T04:51:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5980d06e75a5df9e5269d0ef78431f730d6f5fd050dca74784ef3426fb0433d8
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompt interaktif untuk perubahan terarah pada penyiapan yang sudah ada: kredensial, perangkat, default agen, Gateway, saluran, Plugin, Skills, dan pemeriksaan kesehatan.

Gunakan `openclaw onboard` atau `openclaw setup` untuk seluruh proses terpandu saat pertama kali dijalankan, `openclaw setup --baseline` hanya untuk konfigurasi dasar/ruang kerja, dan `openclaw channels add` jika Anda hanya perlu menyiapkan akun saluran.

<Tip>
`openclaw config` tanpa subperintah akan membuka wizard yang sama. Gunakan `openclaw config get|set|unset` untuk pengeditan noninteraktif.
</Tip>

## Opsi

`--section <section>`: filter bagian yang dapat diulang. Bagian yang tersedia:

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

Memilih `gateway`, `daemon`, atau `health` (atau menjalankan wizard lengkap tanpa `--section`) akan meminta lokasi tempat Gateway berjalan dan memperbarui `gateway.mode`. Filter bagian yang melewati ketiganya langsung menuju penyiapan yang diminta tanpa prompt mode Gateway. Memilih mode Gateway jarak jauh akan menulis konfigurasi jarak jauh dan langsung keluar; langkah khusus lokal seperti pemasangan Plugin tidak akan dijalankan.

<Note>
`openclaw configure` memerlukan terminal interaktif (stdin dan stdout harus berupa TTY). Tanpanya, perintah `openclaw config get|set|patch|validate` noninteraktif yang setara akan dicetak, lalu proses keluar dengan kesalahan alih-alih hanya berjalan sebagian.
</Note>

## Bagian model

<Note>
**Model** mencakup pilihan ganda untuk daftar eksplisit `agents.defaults.modelPolicy.allow` (yang ditampilkan di `/model` dan pemilih model). Pilihan penyiapan yang terbatas pada penyedia akan menggabungkan model yang dipilih ke dalam daftar yang ada, alih-alih menggantikan penyedia lain yang tidak terkait dan sudah ada dalam konfigurasi. Alias dan parameter per model tetap berada di bawah `agents.defaults.models`; entri tersebut tidak membatasi penggantian model dengan sendirinya.

Menjalankan ulang autentikasi penyedia melalui configure akan mempertahankan `agents.defaults.model.primary` yang sudah ada, meskipun langkah autentikasi penyedia mengembalikan tambalan konfigurasi dengan model default rekomendasinya sendiri. Menambahkan atau mengautentikasi ulang penyedia membuat modelnya tersedia tanpa mengambil alih model utama Anda saat ini. Gunakan `openclaw models auth login --provider <id> --set-default` atau `openclaw models set <model>` untuk secara sengaja mengubah model default.
</Note>

Saat configure dimulai dari pilihan autentikasi penyedia, pemilih model default dan kebijakan model secara otomatis memprioritaskan penyedia tersebut. Untuk penyedia berpasangan seperti Volcengine dan BytePlus, preferensi yang sama juga mencocokkan varian paket pengodeannya (`volcengine-plan/*`, `byteplus-plan/*`). Jika filter penyedia pilihan akan menghasilkan daftar kosong, configure kembali menggunakan katalog tanpa filter, alih-alih menampilkan pemilih kosong.

## Bagian web

`openclaw configure --section web` memilih penyedia pencarian web dan mengonfigurasi kredensialnya. Beberapa penyedia menampilkan tindak lanjut khusus penyedia:

- **Grok** dapat menawarkan penyiapan `x_search` opsional dengan profil OAuth xAI atau kunci API yang sama, serta memungkinkan Anda memilih model `x_search`.
- **Kimi** dapat meminta wilayah API Moonshot (`api.moonshot.ai` atau `api.moonshot.cn`) dan model pencarian web Kimi default.

## Catatan lainnya

- Setelah konfigurasi lokal ditulis, configure memasang Plugin yang dapat diunduh dan dipilih apabila jalur penyiapan yang dipilih memerlukannya. Konfigurasi Gateway jarak jauh tidak memasang paket Plugin lokal.
- Layanan berorientasi saluran (Slack/Discord/Matrix/Microsoft Teams) meminta daftar saluran/ruang yang diizinkan selama penyiapan. Anda dapat memasukkan nama atau ID; wizard akan mengubah nama menjadi ID jika memungkinkan.
- Jika Anda menjalankan langkah pemasangan daemon, autentikasi token memerlukan token. Jika `gateway.auth.token` dikelola oleh SecretRef, configure akan memvalidasi SecretRef, tetapi tidak menyimpan nilai token teks biasa yang telah diuraikan ke dalam metadata lingkungan layanan supervisor; jika SecretRef tidak dapat diuraikan, configure akan memblokir pemasangan daemon dengan panduan perbaikan yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` telah dikonfigurasi, sedangkan `gateway.auth.mode` belum ditetapkan, configure akan memblokir pemasangan daemon hingga Anda menetapkan mode secara eksplisit.

## Terkait

- [Referensi CLI](/id/cli)
- [Konfigurasi](/id/gateway/configuration)
- CLI konfigurasi: [Konfigurasi](/id/cli/config)
