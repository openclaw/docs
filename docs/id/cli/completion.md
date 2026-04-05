---
read_when:
    - Anda menginginkan completion shell untuk zsh/bash/fish/PowerShell
    - Anda perlu menyimpan cache skrip completion di bawah state OpenClaw
summary: Referensi CLI untuk `openclaw completion` (menghasilkan/menginstal skrip completion shell)
title: completion
x-i18n:
    generated_at: "2026-04-05T13:45:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7bbf140a880bafdb7140149f85465d66d0d46e5a3da6a1e41fb78be2fd2bd4d0
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

Hasilkan skrip completion shell dan secara opsional instal ke profil shell Anda.

## Penggunaan

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Opsi

- `-s, --shell <shell>`: target shell (`zsh`, `bash`, `powershell`, `fish`; default: `zsh`)
- `-i, --install`: instal completion dengan menambahkan baris source ke profil shell Anda
- `--write-state`: tulis skrip completion ke `$OPENCLAW_STATE_DIR/completions` tanpa mencetak ke stdout
- `-y, --yes`: lewati prompt konfirmasi instalasi

## Catatan

- `--install` menulis blok kecil "OpenClaw Completion" ke profil shell Anda dan mengarahkannya ke skrip yang di-cache.
- Tanpa `--install` atau `--write-state`, perintah akan mencetak skrip ke stdout.
- Pembuatan completion memuat tree perintah secara eager sehingga subperintah bertingkat ikut disertakan.
