---
read_when:
    - Anda menginginkan beberapa agen terisolasi (ruang kerja + perutean + autentikasi)
summary: Referensi CLI untuk `openclaw agents` (daftar/tambah/hapus/pengikatan/ikat/lepas ikatan/atur identitas)
title: Agen
x-i18n:
    generated_at: "2026-07-19T04:50:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c8863b502b018e760a55e5efbac8f7221848fa511b97250c23cd4681c9d71e38
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Kelola agen terisolasi (ruang kerja + autentikasi + perutean). Menjalankan `openclaw agents` tanpa subperintah setara dengan `openclaw agents list`.

Terkait:

- [Perutean multiagen](/id/concepts/multi-agent)
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

## Cakupan perintah

### `agents list`

Opsi: `--json`, `--bindings` (sertakan aturan perutean lengkap, bukan hanya jumlah/ringkasan per agen).

### `agents add [name]`

Opsi: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (dapat diulang), `--non-interactive`, `--json`.

- Meneruskan flag penambahan eksplisit apa pun akan mengalihkan perintah ke jalur noninteraktif.
- Mode noninteraktif memerlukan nama agen dan `--workspace`.
- `main` dicadangkan dan tidak dapat digunakan sebagai ID agen baru.
- Mode interaktif menginisialisasi autentikasi dengan hanya menyalin kredensial statis portabel (`api_key` dan profil `token` statis), kecuali kredensial memilih untuk tidak disalin melalui `copyToAgents: false`; profil token penyegaran OAuth tidak disalin kecuali penyedia memilih untuk ikut serta melalui `copyToAgents: true`. Tanpa penyalinan, OAuth tetap tersedia hanya melalui pewarisan baca-langsung dari penyimpanan agen `main` yang sebenarnya. Jika agen default yang dikonfigurasi bukan `main`, masuklah secara terpisah untuk profil OAuth pada agen baru.

### `agents bindings`

Opsi: `--agent <id>`, `--json`.

### `agents bind`

Opsi: `--agent <id>` (default-nya adalah agen default saat ini), `--bind <channel[:accountId]>` (dapat diulang), `--json`.

### `agents unbind`

Opsi: `--agent <id>` (default-nya adalah agen default saat ini), `--bind <channel[:accountId]>` (dapat diulang), `--all`, `--json`. Menerima `--all` atau satu atau beberapa nilai `--bind`, tetapi tidak keduanya.

### `agents set-identity`

Opsi: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. Lihat [Tetapkan identitas](#set-identity) di bawah.

### `agents delete <id>`

Opsi: `--force`, `--json`.

- `main` tidak dapat dihapus.
- Tanpa `--force`, konfirmasi interaktif diperlukan (gagal dalam sesi non-TTY; jalankan kembali dengan `--force`).
- Direktori ruang kerja, status agen, dan transkrip sesi dipindahkan ke Sampah, bukan dihapus secara permanen. Jika Sampah tidak tersedia, penghapusan konfigurasi agen tetap berhasil dan melaporkan jalur yang memerlukan pembersihan manual.
- Saat Gateway dapat dijangkau, penghapusan dirutekan melalui Gateway agar pembersihan konfigurasi dan penyimpanan sesi menggunakan penulis yang sama dengan lalu lintas runtime. Jika Gateway tidak dapat dijangkau, CLI beralih ke jalur lokal luring.
- Jika ruang kerja agen lain memiliki jalur yang sama, berada di dalam ruang kerja ini, atau memuat ruang kerja ini, ruang kerja tersebut dipertahankan, dan `--json` melaporkan `workspaceRetained`, `workspaceRetainedReason`, dan `workspaceSharedWith`.

## Pengikatan perutean

Gunakan pengikatan perutean untuk menetapkan lalu lintas kanal masuk ke agen tertentu.

Jika Anda juga menginginkan skill yang terlihat berbeda untuk setiap agen, konfigurasikan `agents.defaults.skills` dan `agents.list[].skills` di `openclaw.json`. Lihat [Konfigurasi Skills](/id/tools/skills-config) dan [Referensi konfigurasi](/id/gateway/config-agents#agentsdefaultsskills).

Cantumkan pengikatan:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Tambahkan pengikatan:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Anda juga dapat menambahkan pengikatan saat membuat agen:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Jika Anda menghilangkan `accountId` (`--bind <channel>`), OpenClaw menentukannya dari hook penyiapan plugin, pengikatan akun yang dipaksakan, atau jumlah akun kanal yang dikonfigurasi.

Jika Anda menghilangkan `--agent` untuk `bind` atau `unbind`, OpenClaw menargetkan agen default saat ini.

### Format `--bind`

| Format                       | Arti                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Cocokkan semua akun pada kanal.                                                                    |
| `--bind <channel>:<account>` | Cocokkan satu akun.                                                                                 |
| `--bind <channel>`           | Cocokkan hanya akun default, kecuali CLI dapat menentukan cakupan akun khusus plugin dengan aman.   |

### Perilaku cakupan pengikatan

- Pengikatan tersimpan tanpa `accountId` hanya cocok dengan akun default kanal.
- `accountId: "*"` adalah fallback untuk seluruh kanal (semua akun) dan kurang spesifik dibandingkan pengikatan akun eksplisit.
- Jika agen yang sama sudah memiliki pengikatan kanal yang cocok tanpa `accountId`, lalu Anda mengikatnya dengan `accountId` eksplisit atau yang telah ditentukan, OpenClaw meningkatkan pengikatan yang ada tersebut secara langsung alih-alih menambahkan duplikat.

Contoh:

```bash
# cocokkan semua akun pada kanal
openclaw agents bind --agent work --bind telegram:*

# cocokkan akun tertentu
openclaw agents bind --agent work --bind telegram:ops

# pengikatan awal khusus kanal
openclaw agents bind --agent work --bind telegram

# kemudian tingkatkan ke pengikatan bercakupan akun
openclaw agents bind --agent work --bind telegram:alerts
```

Setelah peningkatan, perutean untuk pengikatan tersebut dibatasi pada `telegram:alerts`. Jika Anda juga menginginkan perutean akun default, tambahkan secara eksplisit (misalnya `--bind telegram:default`).

Hapus pengikatan:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Berkas identitas

Setiap ruang kerja agen dapat menyertakan `IDENTITY.md` di root ruang kerja:

- Contoh jalur: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` membaca dari root ruang kerja (atau `--identity-file` eksplisit).

Jalur avatar ditentukan relatif terhadap root ruang kerja dan tidak dapat keluar darinya, bahkan melalui symlink.

## Tetapkan identitas

`set-identity` menulis bidang ke dalam `agents.list[].identity`: `name`, `theme`, `emoji`, `avatar` (jalur relatif terhadap ruang kerja, URL http(s), atau URI data).

- `--agent` atau `--workspace` memilih agen target. Jika `--workspace` cocok dengan lebih dari satu agen, perintah gagal dan meminta Anda meneruskan `--agent`.
- Berkas gambar avatar lokal yang jalurnya relatif terhadap ruang kerja dibatasi hingga 2 MB. URL HTTP(S) dan URI `data:` tidak diperiksa terhadap batas ukuran berkas lokal.
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
- [Perutean multiagen](/id/concepts/multi-agent)
- [Ruang kerja agen](/id/concepts/agent-workspace)
