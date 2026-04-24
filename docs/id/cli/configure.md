---
read_when:
    - Anda ingin menyesuaikan kredensial, perangkat, atau default agen secara interaktif
summary: Referensi CLI untuk `openclaw configure` (prompt konfigurasi interaktif)
title: Konfigurasi
x-i18n:
    generated_at: "2026-04-24T09:01:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 822c01f8c0fe9dc4c170f3418bc836b1d18b4713551355b0a18de9e613754dd0
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Prompt interaktif untuk menyiapkan kredensial, perangkat, dan default agen.

Catatan: Bagian **Model** sekarang menyertakan multi-select untuk allowlist
`agents.defaults.models` (apa yang muncul di `/model` dan pemilih model).
Pilihan penyiapan yang dibatasi provider menggabungkan model yang dipilih ke
allowlist yang ada alih-alih mengganti provider lain yang tidak terkait yang
sudah ada di konfigurasi.

Saat configure dimulai dari pilihan autentikasi provider, pemilih model default dan
allowlist otomatis memprioritaskan provider tersebut. Untuk provider berpasangan seperti
Volcengine/BytePlus, preferensi yang sama juga mencocokkan varian coding-plan mereka
(`volcengine-plan/*`, `byteplus-plan/*`). Jika filter preferred-provider
menghasilkan daftar kosong, configure fallback ke katalog tanpa filter
alih-alih menampilkan pemilih kosong.

Tip: `openclaw config` tanpa subperintah membuka wizard yang sama. Gunakan
`openclaw config get|set|unset` untuk pengeditan non-interaktif.

Untuk pencarian web, `openclaw configure --section web` memungkinkan Anda memilih provider
dan mengonfigurasi kredensialnya. Beberapa provider juga menampilkan prompt lanjutan khusus provider:

- **Grok** dapat menawarkan penyiapan `x_search` opsional dengan `XAI_API_KEY` yang sama dan
  memungkinkan Anda memilih model `x_search`.
- **Kimi** dapat menanyakan region API Moonshot (`api.moonshot.ai` vs
  `api.moonshot.cn`) dan model pencarian web Kimi default.

Terkait:

- Referensi konfigurasi Gateway: [Konfigurasi](/id/gateway/configuration)
- CLI config: [Config](/id/cli/config)

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

- Memilih tempat Gateway berjalan selalu memperbarui `gateway.mode`. Anda dapat memilih "Continue" tanpa section lain jika itu saja yang Anda perlukan.
- Layanan berorientasi kanal (Slack/Discord/Matrix/Microsoft Teams) meminta allowlist kanal/room selama penyiapan. Anda dapat memasukkan nama atau ID; wizard menyelesaikan nama ke ID jika memungkinkan.
- Jika Anda menjalankan langkah pemasangan daemon, autentikasi token memerlukan token, dan `gateway.auth.token` dikelola SecretRef, configure memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang telah diselesaikan ke metadata environment layanan supervisor.
- Jika autentikasi token memerlukan token dan token SecretRef yang dikonfigurasi tidak dapat diselesaikan, configure memblokir pemasangan daemon dengan panduan perbaikan yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi dan `gateway.auth.mode` tidak diatur, configure memblokir pemasangan daemon sampai mode diatur secara eksplisit.

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
