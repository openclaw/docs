---
read_when:
    - Anda menginginkan dukungan Zalo Personal (tidak resmi) di OpenClaw
    - Anda sedang mengonfigurasi atau mengembangkan Plugin zalouser
summary: 'Plugin Zalo Personal: login QR + perpesanan melalui zca-js native (instalasi Plugin + konfigurasi kanal + alat)'
title: Plugin pribadi Zalo
x-i18n:
    generated_at: "2026-05-10T19:49:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 405348eac4c08cc6e28b22cfff615fa34c117dedc51a31613545c4057069c20b
    source_path: plugins/zalouser.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Dukungan Zalo Personal untuk OpenClaw melalui sebuah Plugin, menggunakan `zca-js` native untuk mengotomatiskan akun pengguna Zalo biasa.

<Warning>
Otomatisasi tidak resmi dapat menyebabkan penangguhan atau pemblokiran akun. Gunakan dengan risiko Anda sendiri.
</Warning>

## Penamaan

ID channel adalah `zalouser` untuk memperjelas bahwa ini mengotomatiskan **akun pengguna Zalo personal** (tidak resmi). Kami mempertahankan `zalo` untuk kemungkinan integrasi API resmi Zalo di masa mendatang.

## Tempat menjalankannya

Plugin ini berjalan **di dalam proses Gateway**.

Jika Anda menggunakan Gateway jarak jauh, instal/konfigurasikan di **mesin yang menjalankan Gateway**, lalu mulai ulang Gateway.

Tidak diperlukan biner CLI eksternal `zca`/`openzca`.

## Instalasi

### Opsi A: instal dari npm

```bash
openclaw plugins install @openclaw/zalouser
```

Gunakan paket polos untuk mengikuti tag rilis resmi saat ini. Sematkan versi yang persis hanya saat Anda membutuhkan instalasi yang dapat direproduksi.

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

## Alat agen

Nama alat: `zalouser`

Tindakan: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Tindakan pesan channel juga mendukung `react` untuk reaksi pesan.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins)
- [ClawHub](/id/clawhub)
