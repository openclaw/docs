---
read_when:
    - Anda menginginkan dukungan Zalo Personal (tidak resmi) di OpenClaw
    - Anda sedang mengonfigurasi atau mengembangkan plugin zalouser
summary: 'Plugin Zalo Personal: login QR + pesan melalui `zca-js` native (instalasi plugin + konfigurasi channel + tool)'
title: Plugin Zalo Personal
x-i18n:
    generated_at: "2026-04-05T14:02:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3218c3ee34f36466d952aec1b479d451a6235c7c46918beb28698234a7fd0968
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (plugin)

Dukungan Zalo Personal untuk OpenClaw melalui plugin, menggunakan `zca-js` native untuk mengotomatiskan akun pengguna Zalo biasa.

> **Peringatan:** Otomasi tidak resmi dapat menyebabkan akun ditangguhkan/diblokir. Gunakan dengan risiko Anda sendiri.

## Penamaan

ID channel adalah `zalouser` untuk memperjelas bahwa ini mengotomatiskan **akun pengguna Zalo personal** (tidak resmi). Kami mempertahankan `zalo` untuk potensi integrasi API Zalo resmi di masa mendatang.

## Tempat plugin ini berjalan

Plugin ini berjalan **di dalam proses Gateway**.

Jika Anda menggunakan Gateway jarak jauh, instal/konfigurasikan di **mesin yang menjalankan Gateway**, lalu restart Gateway.

Tidak diperlukan biner CLI `zca`/`openzca` eksternal.

## Instalasi

### Opsi A: instal dari npm

```bash
openclaw plugins install @openclaw/zalouser
```

Restart Gateway setelahnya.

### Opsi B: instal dari folder lokal (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Restart Gateway setelahnya.

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
openclaw message send --channel zalouser --target <threadId> --message "Halo dari OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Tool agen

Nama tool: `zalouser`

Action: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Action pesan channel juga mendukung `react` untuk reaksi pesan.
