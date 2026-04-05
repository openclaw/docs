---
read_when:
    - Anda menginginkan discovery area luas (DNS-SD) melalui Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Referensi CLI untuk `openclaw dns` (helper discovery area luas)
title: dns
x-i18n:
    generated_at: "2026-04-05T13:45:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4831fbb7791adfed5195bc4ba36bb248d2bc8830958334211d3c96f824617927
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

Helper DNS untuk discovery area luas (Tailscale + CoreDNS). Saat ini berfokus pada macOS + Homebrew CoreDNS.

Terkait:

- Discovery gateway: [Discovery](/gateway/discovery)
- Konfigurasi discovery area luas: [Konfigurasi](/gateway/configuration)

## Penyiapan

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Rencanakan atau terapkan penyiapan CoreDNS untuk discovery DNS-SD unicast.

Opsi:

- `--domain <domain>`: domain discovery area luas (misalnya `openclaw.internal`)
- `--apply`: instal atau perbarui config CoreDNS dan mulai ulang layanan (memerlukan sudo; hanya macOS)

Yang ditampilkan:

- domain discovery yang telah diresolusikan
- path file zone
- IP tailnet saat ini
- config discovery `openclaw.json` yang direkomendasikan
- nilai nameserver/domain Tailscale Split DNS yang perlu ditetapkan

Catatan:

- Tanpa `--apply`, perintah ini hanya merupakan helper perencanaan dan mencetak penyiapan yang direkomendasikan.
- Jika `--domain` dihilangkan, OpenClaw menggunakan `discovery.wideArea.domain` dari config.
- `--apply` saat ini hanya mendukung macOS dan mengharapkan Homebrew CoreDNS.
- `--apply` melakukan bootstrap file zone jika diperlukan, memastikan stanza import CoreDNS ada, dan memulai ulang layanan brew `coredns`.
