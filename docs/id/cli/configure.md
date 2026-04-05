---
read_when:
    - Anda ingin menyesuaikan kredensial, perangkat, atau default agen secara interaktif
summary: Referensi CLI untuk `openclaw configure` (prompt konfigurasi interaktif)
title: configure
x-i18n:
    generated_at: "2026-04-05T13:45:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989569fdb8e1b31ce3438756b3ed9bf18e0c8baf611c5981643ba5925459c98f
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Prompt interaktif untuk menyiapkan kredensial, perangkat, dan default agen.

Catatan: Bagian **Model** sekarang menyertakan multi-select untuk allowlist
`agents.defaults.models` (apa yang muncul di `/model` dan pemilih model).

Saat configure dimulai dari pilihan auth provider, pemilih model default dan
allowlist otomatis mengutamakan provider tersebut. Untuk provider berpasangan seperti
Volcengine/BytePlus, preferensi yang sama juga cocok dengan varian coding-plan
mereka (`volcengine-plan/*`, `byteplus-plan/*`). Jika filter preferred-provider
akan menghasilkan daftar kosong, configure akan kembali ke katalog tanpa filter alih-alih menampilkan pemilih kosong.

Tip: `openclaw config` tanpa subperintah membuka wizard yang sama. Gunakan
`openclaw config get|set|unset` untuk pengeditan non-interaktif.

Untuk pencarian web, `openclaw configure --section web` memungkinkan Anda memilih provider
dan mengonfigurasi kredensialnya. Beberapa provider juga menampilkan prompt tindak lanjut khusus provider:

- **Grok** dapat menawarkan penyiapan `x_search` opsional dengan `XAI_API_KEY` yang sama dan
  memungkinkan Anda memilih model `x_search`.
- **Kimi** dapat menanyakan region API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) dan model pencarian web Kimi default.

Terkait:

- Referensi konfigurasi gateway: [Konfigurasi](/gateway/configuration)
- CLI config: [Config](/cli/config)

## Opsi

- `--section <section>`: filter section yang dapat diulang

Section yang tersedia:

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

- Memilih tempat Gateway berjalan selalu memperbarui `gateway.mode`. Anda dapat memilih "Continue" tanpa section lain jika hanya itu yang Anda perlukan.
- Layanan yang berorientasi channel (Slack/Discord/Matrix/Microsoft Teams) meminta allowlist channel/room selama penyiapan. Anda dapat memasukkan nama atau ID; wizard meresolusikan nama menjadi ID jika memungkinkan.
- Jika Anda menjalankan langkah instalasi daemon, auth token memerlukan token, dan `gateway.auth.token` dikelola oleh SecretRef, configure memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang telah diresolusikan ke metadata environment layanan supervisor.
- Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak teresolusikan, configure memblokir instalasi daemon dengan panduan perbaikan yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak ditetapkan, configure memblokir instalasi daemon sampai mode ditetapkan secara eksplisit.

## Contoh

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
