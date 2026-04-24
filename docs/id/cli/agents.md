---
read_when:
    - Anda menginginkan beberapa agen terisolasi (workspace + routing + autentikasi)
summary: Referensi CLI untuk `openclaw agents` (daftar/tambah/hapus/bindings/bind/unbind/set identity)
title: Agen-agen
x-i18n:
    generated_at: "2026-04-24T09:00:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04d0ce4f3fb3d0c0ba8ffb3676674cda7d9a60441a012bc94ff24a17105632f1
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Kelola agen terisolasi (workspace + autentikasi + routing).

Terkait:

- Routing multi-agen: [Routing Multi-Agen](/id/concepts/multi-agent)
- Workspace agen: [Workspace agen](/id/concepts/agent-workspace)
- Konfigurasi visibilitas Skills: [Konfigurasi Skills](/id/tools/skills-config)

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

## Binding routing

Gunakan binding routing untuk menyematkan lalu lintas kanal masuk ke agen tertentu.

Jika Anda juga menginginkan Skills yang terlihat berbeda per agen, konfigurasikan
`agents.defaults.skills` dan `agents.list[].skills` di `openclaw.json`. Lihat
[Konfigurasi Skills](/id/tools/skills-config) dan
[Referensi Konfigurasi](/id/gateway/config-agents#agents-defaults-skills).

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

Jika Anda menghilangkan `accountId` (`--bind <channel>`), OpenClaw akan menyelesaikannya dari default kanal dan hook penyiapan Plugin jika tersedia.

Jika Anda menghilangkan `--agent` untuk `bind` atau `unbind`, OpenClaw akan menargetkan agen default saat ini.

### Perilaku cakupan binding

- Binding tanpa `accountId` hanya cocok dengan akun default kanal.
- `accountId: "*"` adalah fallback seluruh kanal (semua akun) dan kurang spesifik dibanding binding akun eksplisit.
- Jika agen yang sama sudah memiliki binding kanal yang cocok tanpa `accountId`, dan Anda kemudian melakukan bind dengan `accountId` eksplisit atau yang telah diselesaikan, OpenClaw akan meningkatkan binding yang sudah ada itu di tempat alih-alih menambahkan duplikat.

Contoh:

```bash
# binding awal hanya tingkat kanal
openclaw agents bind --agent work --bind telegram

# kemudian ditingkatkan menjadi binding bercakupan akun
openclaw agents bind --agent work --bind telegram:ops
```

Setelah peningkatan, routing untuk binding tersebut bercakupan ke `telegram:ops`. Jika Anda juga ingin routing akun default, tambahkan secara eksplisit (misalnya `--bind telegram:default`).

Hapus binding:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` menerima `--all` atau satu atau lebih nilai `--bind`, bukan keduanya.

## Permukaan perintah

### `agents`

Menjalankan `openclaw agents` tanpa subperintah setara dengan `openclaw agents list`.

### `agents list`

Opsi:

- `--json`
- `--bindings`: sertakan aturan routing lengkap, bukan hanya jumlah/ringkasan per agen

### `agents add [name]`

Opsi:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (dapat diulang)
- `--non-interactive`
- `--json`

Catatan:

- Meneruskan flag add eksplisit apa pun akan mengalihkan perintah ke jalur non-interaktif.
- Mode non-interaktif memerlukan nama agen dan `--workspace`.
- `main` dicadangkan dan tidak dapat digunakan sebagai ID agen baru.

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
- Direktori workspace, state agen, dan transkrip sesi dipindahkan ke Trash, bukan dihapus permanen.

## File identitas

Setiap workspace agen dapat menyertakan `IDENTITY.md` di root workspace:

- Contoh path: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` membaca dari root workspace (atau `--identity-file` eksplisit)

Path avatar diselesaikan relatif terhadap root workspace.

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
- Jika Anda mengandalkan `--workspace` dan beberapa agen berbagi workspace tersebut, perintah akan gagal dan meminta Anda meneruskan `--agent`.
- Saat tidak ada field identitas eksplisit yang diberikan, perintah membaca data identitas dari `IDENTITY.md`.

Muat dari `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Timpa field secara eksplisit:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Contoh konfigurasi:

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

## Terkait

- [Referensi CLI](/id/cli)
- [Routing multi-agen](/id/concepts/multi-agent)
- [Workspace agen](/id/concepts/agent-workspace)
