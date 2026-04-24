---
read_when:
    - Anda ingin dukungan Zalo Personal (tidak resmi) di OpenClaw
    - Anda sedang mengonfigurasi atau mengembangkan Plugin zalouser
summary: 'Plugin Zalo Personal: login QR + messaging melalui zca-js native (instalasi Plugin + konfigurasi channel + tool)'
title: Plugin Zalo Personal
x-i18n:
    generated_at: "2026-04-24T09:21:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: d678bd55fd405a9c689d1202870cc03bfb825a9314c433a0ab729d376e3b67a3
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (Plugin)

Dukungan Zalo Personal untuk OpenClaw melalui Plugin, menggunakan `zca-js` native untuk mengotomatisasi akun pengguna Zalo biasa.

> **Warning:** Otomasi tidak resmi dapat menyebabkan akun ditangguhkan/diblokir. Gunakan dengan risiko Anda sendiri.

## Penamaan

Id channel adalah `zalouser` untuk memperjelas bahwa ini mengotomatisasi **akun pengguna Zalo pribadi** (tidak resmi). Kami mempertahankan `zalo` untuk kemungkinan integrasi API Zalo resmi di masa depan.

## Tempat Plugin berjalan

Plugin ini berjalan **di dalam proses Gateway**.

Jika Anda menggunakan Gateway remote, instal/konfigurasikan Plugin ini pada **mesin yang menjalankan Gateway**, lalu mulai ulang Gateway.

Tidak diperlukan biner CLI `zca`/`openzca` eksternal.

## Instalasi

### Opsi A: instal dari npm

```bash
openclaw plugins install @openclaw/zalouser
```

Mulai ulang Gateway setelahnya.

### Opsi B: instal dari folder lokal (dev)

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

## Tool agen

Nama tool: `zalouser`

Tindakan: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Tindakan pesan channel juga mendukung `react` untuk reaksi pesan.

## Terkait

- [Membangun Plugins](/id/plugins/building-plugins)
- [Plugin komunitas](/id/plugins/community)
