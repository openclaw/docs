---
read_when:
    - Anda menginginkan pelengkapan shell untuk zsh/bash/fish/PowerShell
    - Anda perlu menyimpan skrip pelengkapan dalam cache di status OpenClaw
summary: Referensi CLI untuk `openclaw completion` (membuat/menginstal skrip pelengkapan shell)
title: Penyelesaian
x-i18n:
    generated_at: "2026-07-12T14:03:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

Buat skrip pelengkapan shell, simpan dalam cache di status OpenClaw, dan secara opsional instal ke profil shell Anda.

## Penggunaan

```bash
openclaw completion                          # tampilkan skrip zsh ke stdout
openclaw completion --shell fish             # tampilkan skrip fish
openclaw completion --write-state            # simpan skrip untuk semua shell dalam cache
openclaw completion --write-state --install  # simpan dalam cache, lalu instal dalam satu langkah
openclaw completion --shell bash --write-state
```

## Opsi

- `-s, --shell <shell>`: shell target (`zsh`, `bash`, `powershell`, `fish`; bawaan: `zsh`)
- `-i, --install`: instal pelengkapan dengan menambahkan baris source untuk skrip yang disimpan dalam cache ke profil shell Anda
- `--write-state`: tulis skrip pelengkapan ke `$OPENCLAW_STATE_DIR/completions` (bawaan `~/.openclaw/completions`) tanpa menampilkannya ke stdout; dengan `--shell`, hanya menulis untuk shell tersebut, jika tidak, menulis untuk keempatnya
- `-y, --yes`: lewati permintaan konfirmasi instalasi (noninteraktif)

## Alur instalasi

`--install` mengarahkan profil Anda ke skrip yang disimpan dalam cache, sehingga cache harus tersedia terlebih dahulu: jika tidak ada, perintah akan gagal dan meminta Anda menjalankan `openclaw completion --write-state`. Gabungkan `--write-state --install` untuk melakukan keduanya dalam satu langkah. Tanpa `--shell`, `--install` mendeteksi shell dari `$SHELL` (dengan zsh sebagai cadangan).

Instalasi menulis blok kecil `# OpenClaw Completion` ke profil shell Anda dan mengganti baris lama `source <(openclaw completion ...)` yang lambat dengan baris source yang menggunakan cache:

| Shell      | Profil                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc` (menggunakan `~/.bash_profile` sebagai cadangan jika `~/.bashrc` tidak ada)                                                                                                    |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1` (di Windows: `Documents/PowerShell/Microsoft.PowerShell_profile.ps1`, atau `Documents/WindowsPowerShell/...` untuk Windows PowerShell) |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## Catatan

- Tanpa `--install` atau `--write-state`, perintah menampilkan skrip ke stdout.
- Pembuatan pelengkapan langsung memuat seluruh pohon perintah, termasuk perintah CLI Plugin, sehingga subperintah bertingkat turut disertakan.
- `openclaw update` menyegarkan cache pelengkapan secara otomatis setelah pembaruan berhasil; `openclaw doctor` dapat memperbaiki konfigurasi pelengkapan yang hilang atau kedaluwarsa.

## Terkait

- [Referensi CLI](/id/cli)
