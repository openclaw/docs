---
read_when:
    - Anda ingin UI terminal untuk Gateway (ramah untuk penggunaan jarak jauh)
    - Anda ingin meneruskan url/token/session dari skrip
summary: Referensi CLI untuk `openclaw tui` (UI terminal yang terhubung ke Gateway)
title: tui
x-i18n:
    generated_at: "2026-04-05T13:49:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60e35062c0551f85ce0da604a915b3e1ca2514d00d840afe3b94c529304c2c1a
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Buka UI terminal yang terhubung ke Gateway.

Terkait:

- Panduan TUI: [TUI](/web/tui)

Catatan:

- `tui` menyelesaikan SecretRef auth gateway yang dikonfigurasi untuk auth token/password bila memungkinkan (penyedia `env`/`file`/`exec`).
- Saat diluncurkan dari dalam direktori workspace agen yang dikonfigurasi, TUI otomatis memilih agen tersebut untuk default kunci sesi (kecuali `--session` secara eksplisit adalah `agent:<id>:...`).

## Contoh

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```
