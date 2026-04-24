---
read_when:
    - Anda menginginkan penemuan wide-area (DNS-SD) melalui Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Referensi CLI untuk `openclaw dns` (pembantu penemuan wide-area)
title: DNS
x-i18n:
    generated_at: "2026-04-24T09:01:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

Pembantu DNS untuk penemuan wide-area (Tailscale + CoreDNS). Saat ini berfokus pada CoreDNS di macOS + Homebrew.

Terkait:

- Penemuan Gateway: [Discovery](/id/gateway/discovery)
- Konfigurasi penemuan wide-area: [Konfigurasi](/id/gateway/configuration)

## Penyiapan

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Rencanakan atau terapkan penyiapan CoreDNS untuk penemuan DNS-SD unicast.

Opsi:

- `--domain <domain>`: domain penemuan wide-area (misalnya `openclaw.internal`)
- `--apply`: instal atau perbarui konfigurasi CoreDNS dan mulai ulang layanan (memerlukan sudo; hanya macOS)

Yang ditampilkan:

- domain penemuan yang diselesaikan
- path file zone
- IP tailnet saat ini
- konfigurasi penemuan `openclaw.json` yang direkomendasikan
- nilai nameserver/domain Tailscale Split DNS yang perlu diatur

Catatan:

- Tanpa `--apply`, perintah ini hanya pembantu perencanaan dan mencetak penyiapan yang direkomendasikan.
- Jika `--domain` dihilangkan, OpenClaw menggunakan `discovery.wideArea.domain` dari konfigurasi.
- `--apply` saat ini hanya mendukung macOS dan mengharapkan CoreDNS Homebrew.
- `--apply` melakukan bootstrap file zone jika diperlukan, memastikan stanza import CoreDNS ada, dan memulai ulang layanan brew `coredns`.

## Terkait

- [Referensi CLI](/id/cli)
- [Discovery](/id/gateway/discovery)
