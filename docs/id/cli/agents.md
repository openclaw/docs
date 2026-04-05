---
read_when:
    - Anda menginginkan beberapa agen terisolasi (workspace + perutean + auth)
summary: Referensi CLI untuk `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: agents
x-i18n:
    generated_at: "2026-04-05T13:45:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90b90c4915993bd8af322c0590d4cb59baabb8940598ce741315f8f95ef43179
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Kelola agen terisolasi (workspace + auth + perutean).

Terkait:

- Perutean multi-agen: [Perutean Multi-Agen](/concepts/multi-agent)
- Workspace agen: [Workspace agen](/concepts/agent-workspace)
- Konfigurasi visibilitas skill: [Konfigurasi Skills](/tools/skills-config)

## Contoh

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Binding perutean

Gunakan binding perutean untuk menyematkan lalu lintas channel masuk ke agen tertentu.

Jika Anda juga menginginkan Skills yang terlihat berbeda per agen, konfigurasikan
`agents.defaults.skills` dan `agents.list[].skills` di `openclaw.json`. Lihat
[Konfigurasi Skills](/tools/skills-config) dan
[Referensi Konfigurasi](/gateway/configuration-reference#agentsdefaultsskills).

Daftar binding:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Tambahkan binding:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Jika Anda menghilangkan `accountId` (`--bind <channel>`), OpenClaw meresolusikannya dari default channel dan hook penyiapan plugin bila tersedia.

Jika Anda menghilangkan `--agent` untuk `bind` atau `unbind`, OpenClaw menargetkan agen default saat ini.

### Perilaku cakupan binding

- Binding tanpa `accountId` hanya cocok dengan akun default channel.
- `accountId: "*"` adalah fallback seluruh channel (semua akun) dan kurang spesifik dibanding binding akun eksplisit.
- Jika agen yang sama sudah memiliki binding channel yang cocok tanpa `accountId`, lalu Anda mengikat dengan `accountId` eksplisit atau yang telah diresolusikan, OpenClaw meningkatkan binding yang sudah ada tersebut di tempat alih-alih menambahkan duplikat.

Contoh:

```bash
# binding awal hanya channel
openclaw agents bind --agent work --bind telegram

# kemudian tingkatkan ke binding bercakupan akun
openclaw agents bind --agent work --bind telegram:ops
```

Setelah peningkatan, perutean untuk binding tersebut dicakup ke `telegram:ops`. Jika Anda juga menginginkan perutean akun default, tambahkan secara eksplisit (misalnya `--bind telegram:default`).

Hapus binding:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` menerima `--all` atau satu atau beberapa nilai `--bind`, tidak keduanya.

## Permukaan perintah

### `agents`

Menjalankan `openclaw agents` tanpa subperintah setara dengan `openclaw agents list`.

### `agents list`

Opsi:

- `--json`
- `--bindings`: sertakan aturan perutean lengkap, bukan hanya jumlah/ringkasan per agen

### `agents add [name]`

Opsi:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (dapat diulang)
- `--non-interactive`
- `--json`

Catatan:

- Meneruskan flag add eksplisit apa pun mengalihkan perintah ke jalur non-interaktif.
- Mode non-interaktif memerlukan nama agen dan `--workspace`.
- `main` dicadangkan dan tidak dapat digunakan sebagai id agen baru.

### `agents bindings`

Opsi:

- `--agent <id>`
- `--json`

### `agents bind`

Opsi:

- `--agent <id>` (default ke agen default saat ini)
- `--bind <channel[:accountId]>` (dapat diulang)
- `--json`

### `agents unbind`

Opsi:

- `--agent <id>` (default ke agen default saat ini)
- `--bind <channel[:accountId]>` (dapat diulang)
- `--all`
- `--json`

### `agents delete <id>`

Opsi:

- `--force`
- `--json`

Catatan:

- `main` tidak dapat dihapus.
- Tanpa `--force`, konfirmasi interaktif diperlukan.
- Workspace, status agen, dan direktori transkrip sesi dipindahkan ke Trash, bukan dihapus permanen.

## File identitas

Setiap workspace agen dapat menyertakan `IDENTITY.md` di root workspace:

- Contoh path: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` membaca dari root workspace (atau `--identity-file` eksplisit)

Path avatar diresolusikan relatif terhadap root workspace.

## Set identity

`set-identity` menulis field ke `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (path relatif workspace, URL http(s), atau URI data)

Opsi:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Catatan:

- `--agent` atau `--workspace` dapat digunakan untuk memilih agen target.
- Jika Anda mengandalkan `--workspace` dan beberapa agen berbagi workspace tersebut, perintah gagal dan meminta Anda meneruskan `--agent`.
- Saat tidak ada field identitas eksplisit yang diberikan, perintah membaca data identitas dari `IDENTITY.md`.

Muat dari `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Timpa field secara eksplisit:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Contoh config:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```
