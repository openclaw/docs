---
read_when:
    - Anda ingin menyesuaikan kredensial, perangkat, atau pengaturan bawaan agen secara interaktif
summary: Referensi CLI untuk `openclaw configure` (prompt konfigurasi interaktif)
title: Konfigurasi
x-i18n:
    generated_at: "2026-05-01T09:22:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 437a6ec43a48611bf08bdeb0a6e692581c488fac283f0104b172088db37949bb
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompt interaktif untuk menyiapkan kredensial, perangkat, dan default agen.

<Note>
Bagian **Model** menyertakan pilihan ganda untuk daftar izinkan `agents.defaults.models` (yang muncul di `/model` dan pemilih model). Pilihan penyiapan bercakupan penyedia menggabungkan model yang dipilihnya ke daftar izinkan yang ada, alih-alih mengganti penyedia lain yang sudah ada dalam konfigurasi. Menjalankan ulang autentikasi penyedia dari configure akan mempertahankan `agents.defaults.model.primary` yang sudah ada. Gunakan `openclaw models auth login --provider <id> --set-default` atau `openclaw models set <model>` ketika Anda memang ingin mengubah model default.
</Note>

Ketika configure dimulai dari pilihan autentikasi penyedia, pemilih model default dan daftar izinkan otomatis memprioritaskan penyedia tersebut. Untuk penyedia berpasangan seperti Volcengine dan BytePlus, preferensi yang sama juga mencocokkan varian paket pengodeannya (`volcengine-plan/*`, `byteplus-plan/*`). Jika filter penyedia pilihan menghasilkan daftar kosong, configure kembali ke katalog tanpa filter alih-alih menampilkan pemilih kosong.

<Tip>
`openclaw config` tanpa subperintah membuka wizard yang sama. Gunakan `openclaw config get|set|unset` untuk pengeditan noninteraktif.
</Tip>

Untuk pencarian web, `openclaw configure --section web` memungkinkan Anda memilih penyedia
dan mengonfigurasi kredensialnya. Beberapa penyedia juga menampilkan prompt lanjutan
khusus penyedia:

- **Grok** dapat menawarkan penyiapan `x_search` opsional dengan `XAI_API_KEY` yang sama dan
  memungkinkan Anda memilih model `x_search`.
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

- Memilih tempat Gateway berjalan selalu memperbarui `gateway.mode`. Anda dapat memilih "Lanjutkan" tanpa bagian lain jika hanya itu yang Anda perlukan.
- Setelah penulisan konfigurasi lokal, configure mewujudkan dependensi runtime plugin bawaan yang baru diperlukan. Ini adalah langkah perbaikan manajer paket yang sempit, bukan proses `openclaw doctor` penuh. Konfigurasi gateway jarak jauh tidak menginstal dependensi plugin lokal.
- Layanan berorientasi kanal (Slack/Discord/Matrix/Microsoft Teams) meminta daftar izinkan kanal/ruangan selama penyiapan. Anda dapat memasukkan nama atau ID; wizard akan menyelesaikan nama menjadi ID jika memungkinkan.
- Jika Anda menjalankan langkah instal daemon, autentikasi token memerlukan token, dan `gateway.auth.token` dikelola SecretRef, configure memvalidasi SecretRef tetapi tidak mempertahankan nilai token teks biasa yang diselesaikan ke metadata lingkungan layanan supervisor.
- Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi belum terselesaikan, configure memblokir instal daemon dengan panduan perbaikan yang dapat ditindaklanjuti.
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
