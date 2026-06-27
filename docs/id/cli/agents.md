---
read_when:
    - Anda menginginkan beberapa agen terisolasi (ruang kerja + perutean + autentikasi)
summary: Referensi CLI untuk `openclaw agents` (daftar/tambah/hapus/binding/bind/unbind/atur identitas)
title: Agen
x-i18n:
    generated_at: "2026-06-27T17:17:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7905bc2465c48b5bfee4ce90fdf96dcd92b304a9fb29de93f8f49afdff0e6672
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Kelola agen terisolasi (ruang kerja + autentikasi + perutean).

Terkait:

- [Perutean multi-agen](/id/concepts/multi-agent)
- [Ruang kerja agen](/id/concepts/agent-workspace)
- [Konfigurasi Skills](/id/tools/skills-config): konfigurasi visibilitas skill.

## Contoh

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Binding perutean

Gunakan binding perutean untuk menetapkan lalu lintas kanal masuk ke agen tertentu.

Jika Anda juga menginginkan skill yang terlihat berbeda per agen, konfigurasikan `agents.defaults.skills` dan `agents.list[].skills` di `openclaw.json`. Lihat [Konfigurasi Skills](/id/tools/skills-config) dan [Referensi konfigurasi](/id/gateway/config-agents#agents-defaults-skills).

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

Anda juga dapat menambahkan binding saat membuat agen:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Jika Anda menghilangkan `accountId` (`--bind <channel>`), OpenClaw menyelesaikannya dari hook penyiapan plugin, binding akun paksa, atau jumlah akun yang dikonfigurasi untuk kanal tersebut.

Jika Anda menghilangkan `--agent` untuk `bind` atau `unbind`, OpenClaw menargetkan agen default saat ini.

### Format `--bind`

| Format                       | Arti                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Cocokkan semua akun pada kanal.                                                                   |
| `--bind <channel>:<account>` | Cocokkan satu akun.                                                                               |
| `--bind <channel>`           | Cocokkan hanya akun default kecuali CLI dapat menyelesaikan cakupan akun khusus plugin dengan aman. |

### Perilaku cakupan binding

- Binding tersimpan tanpa `accountId` hanya mencocokkan akun default kanal.
- `accountId: "*"` adalah fallback seluruh kanal (semua akun) dan kurang spesifik dibandingkan binding akun eksplisit.
- Jika agen yang sama sudah memiliki binding kanal yang cocok tanpa `accountId`, dan Anda kemudian membuat binding dengan `accountId` eksplisit atau terselesaikan, OpenClaw meningkatkan binding yang ada tersebut di tempat, bukan menambahkan duplikat.

Contoh:

```bash
# match all accounts on the channel
openclaw agents bind --agent work --bind telegram:*

# match a specific account
openclaw agents bind --agent work --bind telegram:ops

# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:alerts
```

Setelah peningkatan, perutean untuk binding tersebut dicakup ke `telegram:alerts`. Jika Anda juga menginginkan perutean akun default, tambahkan secara eksplisit (misalnya `--bind telegram:default`).

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
- `--bindings`: sertakan aturan perutean lengkap, bukan hanya hitungan/ringkasan per agen

### `agents add [name]`

Opsi:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (dapat diulang)
- `--non-interactive`
- `--json`

Catatan:

- Meneruskan flag penambahan eksplisit apa pun mengalihkan perintah ke jalur non-interaktif.
- Mode non-interaktif memerlukan nama agen dan `--workspace`.
- `main` dicadangkan dan tidak dapat digunakan sebagai id agen baru.
- Dalam mode interaktif, penyemaian autentikasi hanya menyalin profil statis portabel
  (`api_key` dan `token` statis secara default). Profil token refresh OAuth tetap
  tersedia hanya melalui pewarisan baca-tembus dari penyimpanan agen `main` yang sebenarnya.
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
- Direktori ruang kerja, status agen, dan transkrip sesi dipindahkan ke Tong Sampah, bukan dihapus permanen.
- Ketika Gateway dapat dijangkau, penghapusan dikirim melalui Gateway sehingga pembersihan konfigurasi dan penyimpanan sesi berbagi penulis yang sama dengan lalu lintas runtime. Jika Gateway tidak dapat dijangkau, CLI kembali ke jalur lokal offline.
- Jika ruang kerja agen lain adalah path yang sama, berada di dalam ruang kerja ini, atau berisi ruang kerja ini,
  ruang kerja dipertahankan dan `--json` melaporkan `workspaceRetained`,
  `workspaceRetainedReason`, dan `workspaceSharedWith`.

## File identitas

Setiap ruang kerja agen dapat menyertakan `IDENTITY.md` di root ruang kerja:

- Contoh path: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` membaca dari root ruang kerja (atau `--identity-file` eksplisit)

Path avatar diselesaikan relatif terhadap root ruang kerja.

## Tetapkan identitas

`set-identity` menulis kolom ke `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (path relatif ruang kerja, URL http(s), atau URI data)

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
- Jika Anda mengandalkan `--workspace` dan beberapa agen berbagi ruang kerja tersebut, perintah gagal dan meminta Anda meneruskan `--agent`.
- File gambar avatar lokal relatif ruang kerja dibatasi hingga 2 MB. URL HTTP(S) dan URI `data:` tidak diperiksa dengan batas ukuran file lokal.
- Ketika tidak ada kolom identitas eksplisit yang diberikan, perintah membaca data identitas dari `IDENTITY.md`.

Muat dari `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Timpa kolom secara eksplisit:

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
- [Ruang kerja agen](/id/concepts/agent-workspace)
