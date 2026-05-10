---
read_when:
    - Anda ingin menyesuaikan kredensial, perangkat, atau nilai bawaan agen secara interaktif
summary: Referensi CLI untuk `openclaw configure` (prompt konfigurasi interaktif)
title: Konfigurasi
x-i18n:
    generated_at: "2026-05-10T19:27:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba5320fefb856c208405511619fc1a4314e3f5e3990f221e987a03d692189fb
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompt interaktif untuk perubahan tertarget pada penyiapan yang sudah ada: kredensial, perangkat, default agen, Gateway, saluran, Plugin, Skills, dan pemeriksaan kesehatan.

Gunakan `openclaw onboard` untuk perjalanan pertama kali yang dipandu penuh, `openclaw setup` hanya untuk konfigurasi/ruang kerja dasar, dan `openclaw channels add` ketika Anda hanya perlu menyiapkan akun saluran.

<Note>
Bagian **Model** menyertakan multi-pilih untuk daftar izin `agents.defaults.models` (yang muncul di `/model` dan pemilih model). Pilihan penyiapan bercakupan penyedia menggabungkan model yang dipilih ke dalam daftar izin yang sudah ada, bukan mengganti penyedia lain yang tidak terkait yang sudah ada dalam konfigurasi.

Menjalankan ulang autentikasi penyedia dari konfigurasi mempertahankan `agents.defaults.model.primary` yang sudah ada, bahkan ketika langkah autentikasi penyedia mengembalikan patch konfigurasi dengan model default rekomendasinya sendiri. Artinya, menambahkan atau mengautentikasi ulang xAI, OpenRouter, atau penyedia lain seharusnya membuat model baru tersedia tanpa mengambil alih dari model utama Anda saat ini. Gunakan `openclaw models auth login --provider <id> --set-default` atau `openclaw models set <model>` ketika Anda memang ingin mengubah model default.
</Note>

Ketika konfigurasi dimulai dari pilihan autentikasi penyedia, pemilih model default dan daftar izin otomatis memprioritaskan penyedia tersebut. Untuk penyedia berpasangan seperti Volcengine dan BytePlus, preferensi yang sama juga cocok dengan varian paket coding mereka (`volcengine-plan/*`, `byteplus-plan/*`). Jika filter penyedia pilihan akan menghasilkan daftar kosong, konfigurasi akan kembali ke katalog tanpa filter alih-alih menampilkan pemilih kosong.

<Tip>
`openclaw config` tanpa subperintah membuka wizard yang sama. Gunakan `openclaw config get|set|unset` untuk pengeditan noninteraktif.
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

- Memilih tempat Gateway berjalan selalu memperbarui `gateway.mode`. Anda dapat memilih "Lanjut" tanpa bagian lain jika hanya itu yang Anda perlukan.
- Setelah penulisan konfigurasi lokal, konfigurasi memasang Plugin unduhan yang dipilih ketika jalur penyiapan yang dipilih memerlukannya. Konfigurasi gateway jarak jauh tidak memasang paket Plugin lokal.
- Layanan berorientasi saluran (Slack/Discord/Matrix/Microsoft Teams) meminta daftar izin saluran/ruangan selama penyiapan. Anda dapat memasukkan nama atau ID; wizard menyelesaikan nama menjadi ID jika memungkinkan.
- Jika Anda menjalankan langkah pemasangan daemon, autentikasi token memerlukan token, dan `gateway.auth.token` dikelola SecretRef, konfigurasi memvalidasi SecretRef tetapi tidak menyimpan nilai token teks polos yang terselesaikan ke metadata lingkungan layanan supervisor.
- Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi belum terselesaikan, konfigurasi memblokir pemasangan daemon dengan panduan remediasi yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum ditetapkan, konfigurasi memblokir pemasangan daemon hingga mode ditetapkan secara eksplisit.

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
