---
read_when:
    - Anda menginginkan dukungan Zalo Personal (tidak resmi) di OpenClaw
    - Anda sedang mengonfigurasi atau mengembangkan Plugin zalouser
summary: 'Plugin Zalo Personal: login QR + perpesanan melalui zca-js native (instalasi Plugin + konfigurasi kanal + alat)'
title: Plugin pribadi Zalo
x-i18n:
    generated_at: "2026-04-30T10:05:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

Dukungan Zalo Personal untuk OpenClaw melalui sebuah Plugin, menggunakan `zca-js` native untuk mengotomatiskan akun pengguna Zalo biasa.

<Warning>
Otomatisasi tidak resmi dapat menyebabkan akun ditangguhkan atau diblokir. Gunakan dengan risiko Anda sendiri.
</Warning>

## Penamaan

ID channel adalah `zalouser` untuk memperjelas bahwa ini mengotomatiskan **akun pengguna Zalo personal** (tidak resmi). Kami mempertahankan `zalo` untuk kemungkinan integrasi API Zalo resmi di masa mendatang.

## Tempat berjalan

Plugin ini berjalan **di dalam proses Gateway**.

Jika Anda menggunakan Gateway jarak jauh, instal/konfigurasikan di **mesin yang menjalankan Gateway**, lalu mulai ulang Gateway.

Tidak diperlukan binary CLI `zca`/`openzca` eksternal.

## Instalasi

### Opsi A: instal dari npm

```bash
openclaw plugins install @openclaw/zalouser
```

Jika npm melaporkan paket milik OpenClaw sebagai usang, versi paket tersebut berasal dari rangkaian paket eksternal yang lebih lama; gunakan build OpenClaw terpaket saat ini atau path folder lokal hingga paket npm yang lebih baru diterbitkan.

Mulai ulang Gateway setelahnya.

### Opsi B: instal dari folder lokal (pengembangan)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Mulai ulang Gateway setelahnya.

## Konfigurasi

Konfigurasi channel berada di bawah `channels.zalouser` (bukan `plugins.entries.*`):

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

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Alat agen

Nama alat: `zalouser`

Tindakan: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Tindakan pesan channel juga mendukung `react` untuk reaksi pesan.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins)
- [Plugin komunitas](/id/plugins/community)
