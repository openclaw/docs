---
read_when:
    - Anda menginginkan dukungan Zalo Personal (tidak resmi) di OpenClaw
    - Anda sedang mengonfigurasi atau mengembangkan plugin zalouser
summary: 'Plugin Zalo Personal: login QR + perpesanan melalui zca-js native (instalasi plugin + konfigurasi saluran + alat)'
title: Plugin pribadi Zalo
x-i18n:
    generated_at: "2026-07-12T14:31:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

Dukungan Zalo Personal untuk OpenClaw melalui Plugin yang menggunakan `zca-js` native untuk
mengotomatiskan akun pengguna Zalo biasa. Biner CLI eksternal `zca`/`openzca`
tidak diperlukan.

<Warning>
Otomatisasi tidak resmi dapat menyebabkan akun ditangguhkan atau diblokir. Gunakan dengan risiko Anda sendiri.
</Warning>

## Penamaan

ID saluran adalah `zalouser` untuk memperjelas bahwa ini mengotomatiskan **akun
pengguna Zalo personal** (tidak resmi). ID saluran `zalo` yang terpisah merupakan integrasi
Bot/Webhook Zalo resmi yang disertakan - lihat [Zalo](/id/channels/zalo).

## Tempat menjalankannya

Plugin ini berjalan **di dalam proses Gateway**. Untuk Gateway jarak jauh,
instal/konfigurasikan Plugin ini pada host tersebut, lalu mulai ulang Gateway.

## Instalasi

### Dari npm

```bash
openclaw plugins install @openclaw/zalouser
```

Gunakan paket tanpa versi untuk mengikuti tag rilis resmi saat ini; sematkan versi
yang tepat hanya jika Anda memerlukan instalasi yang dapat direproduksi. Setelah itu,
mulai ulang Gateway.

### Dari folder lokal (pengembangan)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Setelah itu, mulai ulang Gateway.

## Konfigurasi

Konfigurasi saluran berada di bawah `channels.zalouser` (bukan `plugins.entries.*`):

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

Lihat [Konfigurasi saluran personal Zalo](/id/channels/zalouser) untuk kontrol akses
DM/grup, penyiapan beberapa akun, variabel lingkungan, dan pemecahan masalah.

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "name"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Alat agen

Nama alat: `zalouser`

Tindakan: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Tindakan pesan saluran (bukan alat agen) juga mendukung `react` untuk reaksi
pesan.

## Terkait

- [Konfigurasi saluran personal Zalo](/id/channels/zalouser)
- [Zalo (saluran Bot/Webhook resmi)](/id/channels/zalo)
- [Membangun Plugin](/id/plugins/building-plugins)
- [ClawHub](/clawhub)
