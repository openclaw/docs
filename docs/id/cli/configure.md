---
read_when:
    - Anda ingin menyesuaikan kredensial, perangkat, atau default agen secara interaktif
summary: Referensi CLI untuk `openclaw configure` (prompt konfigurasi interaktif)
title: Konfigurasi
x-i18n:
    generated_at: "2026-06-30T22:34:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96241eddd8bc0eaf936d0bb7555a217858d71dcc8009dc5608cecbc55d292bce
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Prompt interaktif untuk perubahan tertarget pada penyiapan yang sudah ada: kredensial, perangkat, default agen, Gateway, kanal, Plugin, Skills, dan pemeriksaan kesehatan.

Gunakan `openclaw onboard` atau `openclaw setup` untuk alur pertama kali terpandu yang lengkap, `openclaw setup --baseline` hanya untuk konfigurasi/ruang kerja baseline, dan `openclaw channels add` ketika Anda hanya memerlukan penyiapan akun kanal.

<Note>
Bagian **Model** mencakup multi-pilih untuk daftar izin `agents.defaults.models` (yang muncul di `/model` dan pemilih model). Pilihan penyiapan yang tercakup penyedia menggabungkan model yang dipilih ke daftar izin yang ada, alih-alih mengganti penyedia yang tidak terkait yang sudah ada di konfigurasi.

Menjalankan ulang autentikasi penyedia dari configure mempertahankan `agents.defaults.model.primary` yang sudah ada, bahkan ketika langkah autentikasi penyedia mengembalikan patch konfigurasi dengan model default rekomendasinya sendiri. Ini berarti menambahkan atau mengautentikasi ulang xAI, OpenRouter, atau penyedia lain akan membuat model baru tersedia tanpa mengambil alih dari model utama Anda saat ini. Gunakan `openclaw models auth login --provider <id> --set-default` atau `openclaw models set <model>` ketika Anda sengaja ingin mengubah model default.
</Note>

Ketika configure dimulai dari pilihan autentikasi penyedia, pemilih model default dan daftar izin otomatis mengutamakan penyedia tersebut. Untuk penyedia berpasangan seperti Volcengine dan BytePlus, preferensi yang sama juga mencocokkan varian rencana pengodeannya (`volcengine-plan/*`, `byteplus-plan/*`). Jika filter penyedia pilihan akan menghasilkan daftar kosong, configure kembali ke katalog tanpa filter alih-alih menampilkan pemilih kosong.

<Tip>
`openclaw config` tanpa subperintah membuka wizard yang sama. Gunakan `openclaw config get|set|unset` untuk pengeditan non-interaktif.
</Tip>

Untuk pencarian web, `openclaw configure --section web` memungkinkan Anda memilih penyedia
dan mengonfigurasi kredensialnya. Beberapa penyedia juga menampilkan prompt
tindak lanjut khusus penyedia:

- **Grok** dapat menawarkan penyiapan `x_search` opsional dengan profil OAuth xAI yang sama
  atau kunci API dan memungkinkan Anda memilih model `x_search`.
- **Kimi** dapat menanyakan region API Moonshot (`api.moonshot.ai` vs
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
- Setelah penulisan konfigurasi lokal, configure menginstal Plugin unduhan yang dipilih ketika jalur penyiapan yang dipilih memerlukannya. Konfigurasi Gateway jarak jauh tidak menginstal paket Plugin lokal.
- Layanan berorientasi kanal (Slack/Discord/Matrix/Microsoft Teams) meminta daftar izin kanal/ruangan selama penyiapan. Anda dapat memasukkan nama atau ID; wizard menyelesaikan nama menjadi ID jika memungkinkan.
- Jika Anda menjalankan langkah instal daemon, autentikasi token memerlukan token, dan `gateway.auth.token` dikelola SecretRef, configure memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang sudah diselesaikan ke metadata lingkungan layanan supervisor.
- Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi belum terselesaikan, configure memblokir instal daemon dengan panduan remediasi yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak ditetapkan, configure memblokir instal daemon sampai mode ditetapkan secara eksplisit.

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
