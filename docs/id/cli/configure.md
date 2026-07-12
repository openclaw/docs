---
read_when:
    - Anda ingin menyesuaikan kredensial, perangkat, atau pengaturan default agen secara interaktif
summary: Referensi CLI untuk `openclaw configure` (prompt konfigurasi interaktif)
title: Konfigurasikan
x-i18n:
    generated_at: "2026-07-12T14:04:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompt interaktif untuk perubahan yang ditargetkan pada penyiapan yang sudah ada: kredensial, perangkat, default agen, Gateway, saluran, Plugin, Skills, dan pemeriksaan kesehatan.

Gunakan `openclaw onboard` atau `openclaw setup` untuk seluruh proses terpandu saat pertama kali dijalankan, `openclaw setup --baseline` hanya untuk konfigurasi/ruang kerja dasar, dan `openclaw channels add` jika Anda hanya perlu menyiapkan akun saluran.

<Tip>
`openclaw config` tanpa subperintah membuka wizard yang sama. Gunakan `openclaw config get|set|unset` untuk pengeditan noninteraktif.
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

Memilih `gateway`, `daemon`, atau `health` (atau menjalankan seluruh wizard tanpa `--section`) akan menanyakan lokasi Gateway dijalankan dan memperbarui `gateway.mode`. Filter bagian yang melewatkan ketiganya akan langsung menuju penyiapan yang diminta tanpa prompt mode Gateway. Memilih mode Gateway jarak jauh akan menulis konfigurasi jarak jauh dan langsung keluar; langkah khusus lokal seperti pemasangan Plugin tidak akan dijalankan.

<Note>
`openclaw configure` memerlukan terminal interaktif (stdin dan stdout harus berupa TTY). Tanpanya, perintah ini akan menampilkan perintah noninteraktif `openclaw config get|set|patch|validate` yang setara dan keluar dengan galat alih-alih menjalankan proses secara parsial.
</Note>

## Bagian model

<Note>
**Model** menyertakan pilihan jamak untuk daftar izin `agents.defaults.models` (yang ditampilkan di `/model` dan pemilih model). Pilihan penyiapan yang dicakup penyedia akan menggabungkan model yang dipilih ke daftar izin yang sudah ada, bukan menggantikan penyedia lain yang telah ada dalam konfigurasi.

Menjalankan ulang autentikasi penyedia dari configure akan mempertahankan `agents.defaults.model.primary` yang sudah ada, meskipun langkah autentikasi penyedia mengembalikan tambalan konfigurasi dengan model default rekomendasinya sendiri. Menambahkan atau mengautentikasi ulang penyedia membuat modelnya tersedia tanpa mengambil alih model utama Anda saat ini. Gunakan `openclaw models auth login --provider <id> --set-default` atau `openclaw models set <model>` untuk mengubah model default secara sengaja.
</Note>

Saat configure dimulai dari pilihan autentikasi penyedia, pemilih model default dan daftar izin akan otomatis memprioritaskan penyedia tersebut. Untuk penyedia berpasangan seperti Volcengine dan BytePlus, preferensi yang sama juga mencocokkan varian paket pemrogramannya (`volcengine-plan/*`, `byteplus-plan/*`). Jika filter penyedia pilihan akan menghasilkan daftar kosong, configure akan kembali menggunakan katalog tanpa filter alih-alih menampilkan pemilih kosong.

## Bagian web

`openclaw configure --section web` memilih penyedia pencarian web dan mengonfigurasi kredensialnya. Beberapa penyedia menampilkan langkah lanjutan khusus penyedia:

- **Grok** dapat menawarkan penyiapan opsional `x_search` dengan profil OAuth xAI atau kunci API yang sama, serta memungkinkan Anda memilih model `x_search`.
- **Kimi** dapat meminta wilayah API Moonshot (`api.moonshot.ai` atau `api.moonshot.cn`) dan model pencarian web Kimi default.

## Catatan lainnya

- Setelah konfigurasi lokal ditulis, configure memasang Plugin pilihan yang dapat diunduh jika jalur penyiapan yang dipilih memerlukannya. Konfigurasi Gateway jarak jauh tidak memasang paket Plugin lokal.
- Layanan berorientasi saluran (Slack/Discord/Matrix/Microsoft Teams) akan meminta daftar izin saluran/ruang selama penyiapan. Anda dapat memasukkan nama atau ID; wizard akan mengubah nama menjadi ID jika memungkinkan.
- Jika Anda menjalankan langkah pemasangan daemon, autentikasi token memerlukan token. Jika `gateway.auth.token` dikelola oleh SecretRef, configure memvalidasi SecretRef tetapi tidak menyimpan nilai token teks biasa yang telah diuraikan ke metadata lingkungan layanan supervisor; jika SecretRef tidak dapat diuraikan, configure memblokir pemasangan daemon dengan panduan perbaikan yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi sementara `gateway.auth.mode` belum ditetapkan, configure memblokir pemasangan daemon hingga Anda menetapkan modenya secara eksplisit.

## Terkait

- [Referensi CLI](/id/cli)
- [Konfigurasi](/id/gateway/configuration)
- CLI konfigurasi: [Konfigurasi](/id/cli/config)
