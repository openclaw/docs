---
read_when:
    - Menghubungkan OpenClaw ke workspace ClickClack
    - Menguji identitas bot ClickClack
summary: Penyiapan saluran token bot ClickClack dan sintaks target
title: ClickClack
x-i18n:
    generated_at: "2026-06-27T17:09:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack menghubungkan OpenClaw ke workspace ClickClack yang di-host sendiri melalui token bot ClickClack kelas satu.

Gunakan ini saat Anda ingin agen OpenClaw muncul sebagai pengguna bot ClickClack. ClickClack mendukung bot layanan independen dan bot milik pengguna; bot milik pengguna mempertahankan `owner_user_id` dan hanya menerima cakupan token yang Anda berikan.

## Penyiapan cepat

Buat token bot di ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Untuk bot milik pengguna, tambahkan `--owner <user_id>`.

Konfigurasikan OpenClaw:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

Lalu jalankan:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Jika `plugins.allow` adalah daftar pembatas yang tidak kosong, memilih
ClickClack secara eksplisit dalam penyiapan saluran atau menjalankan `openclaw plugins enable clickclack`
akan menambahkan `clickclack` ke daftar tersebut. Instalasi saat onboarding menggunakan perilaku
pemilihan eksplisit yang sama. Jalur ini tidak menimpa `plugins.deny` atau pengaturan
global `plugins.enabled: false`. Perintah langsung
`openclaw plugins install @openclaw/clickclack` mengikuti kebijakan normal
instalasi plugin dan juga mencatat ClickClack dalam allowlist yang sudah ada.

## Beberapa bot

Setiap akun membuka koneksi realtime ClickClack miliknya sendiri dan menggunakan token bot miliknya sendiri.

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"` menggunakan `api.runtime.llm.complete` secara langsung untuk balasan bot singkat.
Saat sebuah akun menetapkan `agentId`, OpenClaw memerlukan bit kepercayaan eksplisit
`plugins.entries.clickclack.llm.allowAgentIdOverride` agar plugin dapat menjalankan completion untuk agen bot tersebut. Biarkan nonaktif jika Anda hanya menggunakan rute
agen default.

## Target

- `channel:<name-or-id>` mengirim ke saluran workspace. Target polos default ke `channel:`.
- `dm:<user_id>` membuat atau menggunakan ulang percakapan langsung dengan pengguna tersebut.
- `thread:<message_id>` membalas di thread yang sudah ada.

Contoh:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Izin

Cakupan token ClickClack diterapkan oleh API ClickClack.

- `bot:read`: membaca data workspace/saluran/pesan/thread/DM/realtime/profil.
- `bot:write`: `bot:read` ditambah pesan saluran, balasan thread, DM, dan unggahan.
- `bot:admin`: `bot:write` ditambah pembuatan saluran.

OpenClaw hanya membutuhkan `bot:write` untuk chat agen normal.

## Pemecahan masalah

- `ClickClack is not configured`: atur `channels.clickclack.token` atau `CLICKCLACK_BOT_TOKEN`.
- `workspace not found`: atur `workspace` ke id atau slug workspace yang dikembalikan oleh ClickClack.
- Tidak ada balasan masuk: pastikan token memiliki akses baca realtime dan bot tidak membalas pesannya sendiri.
- Pengiriman saluran gagal: verifikasi bot adalah anggota workspace dan memiliki `bot:write`.
