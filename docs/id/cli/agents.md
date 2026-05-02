---
read_when:
    - Anda menginginkan beberapa agen terisolasi (ruang kerja + perutean + autentikasi)
summary: Referensi CLI untuk `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Agen
x-i18n:
    generated_at: "2026-05-02T20:41:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3522394dd416a9c8b4bf25767a14073484df0ff3d7c546cf6c730f111c5c51dc
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Kelola agen terisolasi (workspace + auth + perutean).

Terkait:

- [Perutean multi-agen](/id/concepts/multi-agent)
- [Workspace agen](/id/concepts/agent-workspace)
- [Konfigurasi Skills](/id/tools/skills-config): konfigurasi visibilitas skill.

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

Gunakan binding perutean untuk menetapkan trafik kanal masuk ke agen tertentu.

Jika Anda juga menginginkan skill terlihat yang berbeda per agen, konfigurasikan `agents.defaults.skills` dan `agents.list[].skills` di `openclaw.json`. Lihat [Konfigurasi Skills](/id/tools/skills-config) dan [Referensi konfigurasi](/id/gateway/config-agents#agents-defaults-skills).

Cantumkan binding:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Tambahkan binding:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Jika Anda menghilangkan `accountId` (`--bind <channel>`), OpenClaw menyelesaikannya dari default kanal dan hook penyiapan Plugin jika tersedia.

Jika Anda menghilangkan `--agent` untuk `bind` atau `unbind`, OpenClaw menargetkan agen default saat ini.

### Perilaku cakupan binding

- Binding tanpa `accountId` hanya cocok dengan akun default kanal.
- `accountId: "*"` adalah fallback seluruh kanal (semua akun) dan kurang spesifik dibandingkan binding akun eksplisit.
- Jika agen yang sama sudah memiliki binding kanal yang cocok tanpa `accountId`, dan Anda kemudian membuat binding dengan `accountId` eksplisit atau terselesaikan, OpenClaw meningkatkan binding yang ada tersebut di tempat alih-alih menambahkan duplikat.

Contoh:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Setelah peningkatan, perutean untuk binding tersebut dicakup ke `telegram:ops`. Jika Anda juga menginginkan perutean akun default, tambahkan secara eksplisit (misalnya `--bind telegram:default`).

Hapus binding:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` menerima `--all` atau satu atau beberapa nilai `--bind`, bukan keduanya.

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

- Meneruskan flag tambah eksplisit apa pun mengalihkan perintah ke jalur non-interaktif.
- Mode non-interaktif memerlukan nama agen dan `--workspace`.
- `main` dicadangkan dan tidak dapat digunakan sebagai id agen baru.
- Dalam mode interaktif, penyemaian auth hanya menyalin profil statis portabel
  (`api_key` dan `token` statis secara default). Profil token penyegaran OAuth tetap
  tersedia hanya melalui pewarisan baca-langsung dari penyimpanan agen `main` yang sebenarnya.
  Jika agen default yang dikonfigurasi bukan `main`, masuk secara terpisah untuk profil
  OAuth pada agen baru.

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
- Direktori workspace, status agen, dan transkrip sesi dipindahkan ke Trash, bukan dihapus permanen.
- Ketika Gateway dapat dijangkau, penghapusan dikirim melalui Gateway sehingga pembersihan konfigurasi dan penyimpanan sesi berbagi penulis yang sama dengan trafik runtime. Jika Gateway tidak dapat dijangkau, CLI beralih ke jalur lokal offline.
- Jika workspace agen lain adalah jalur yang sama, berada di dalam workspace ini, atau berisi workspace ini,
  workspace dipertahankan dan `--json` melaporkan `workspaceRetained`,
  `workspaceRetainedReason`, dan `workspaceSharedWith`.

## File identitas

Setiap workspace agen dapat menyertakan `IDENTITY.md` di root workspace:

- Contoh jalur: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` membaca dari root workspace (atau `--identity-file` eksplisit)

Jalur avatar diselesaikan relatif terhadap root workspace.

## Atur identitas

`set-identity` menulis bidang ke `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (jalur relatif workspace, URL http(s), atau data URI)

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
- Jika tidak ada bidang identitas eksplisit yang diberikan, perintah membaca data identitas dari `IDENTITY.md`.

Muat dari `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Timpa bidang secara eksplisit:

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
- [Perutean multi-agen](/id/concepts/multi-agent)
- [Workspace agen](/id/concepts/agent-workspace)
