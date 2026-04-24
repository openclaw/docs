---
read_when:
    - Anda menginginkan shell completion untuk zsh/bash/fish/PowerShell
    - Anda perlu menyimpan cache skrip completion di bawah state OpenClaw
summary: Referensi CLI untuk `openclaw completion` (membuat/memasang skrip shell completion)
title: Completion
x-i18n:
    generated_at: "2026-04-24T09:01:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 15
---

# `openclaw completion`

Buat skrip shell completion dan opsional pasang ke profil shell Anda.

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
- `-i, --install`: pasang completion dengan menambahkan baris source ke profil shell Anda
- `--write-state`: tulis skrip completion ke `$OPENCLAW_STATE_DIR/completions` tanpa mencetak ke stdout
- `-y, --yes`: lewati prompt konfirmasi pemasangan

## Catatan

- `--install` menulis blok kecil "OpenClaw Completion" ke dalam profil shell Anda dan mengarahkannya ke skrip cache.
- Tanpa `--install` atau `--write-state`, perintah mencetak skrip ke stdout.
- Pembuatan completion memuat pohon perintah secara eager sehingga subperintah bertingkat disertakan.

## Terkait

- [Referensi CLI](/id/cli)
