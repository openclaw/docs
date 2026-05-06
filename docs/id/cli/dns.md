---
read_when:
    - Anda menginginkan penemuan area luas (DNS-SD) melalui Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Referensi CLI untuk `openclaw dns` (helper penemuan area luas)
title: DNS
x-i18n:
    generated_at: "2026-05-06T09:04:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

Pembantu DNS untuk penemuan area luas (Tailscale + CoreDNS). Saat ini berfokus pada macOS + Homebrew CoreDNS.

Terkait:

- Penemuan Gateway: [Discovery](/id/gateway/discovery)
- Konfigurasi penemuan area luas: [Configuration](/id/gateway/configuration)

## Penyiapan

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Rencanakan atau terapkan penyiapan CoreDNS untuk penemuan DNS-SD unicast.

Opsi:

- `--domain <domain>`: domain penemuan area luas (misalnya `openclaw.internal`)
- `--apply`: instal atau perbarui konfigurasi CoreDNS dan mulai ulang layanan (memerlukan sudo; hanya macOS)

Yang ditampilkan:

- domain penemuan yang di-resolve
- jalur berkas zona
- IP tailnet saat ini
- konfigurasi penemuan `openclaw.json` yang direkomendasikan
- nilai nameserver/domain Tailscale Split DNS yang perlu diatur

Catatan:

- Tanpa `--apply`, perintah ini hanya menjadi pembantu perencanaan dan mencetak penyiapan yang direkomendasikan.
- Jika `--domain` dihilangkan, OpenClaw menggunakan `discovery.wideArea.domain` dari konfigurasi.
- `--apply` saat ini hanya mendukung macOS dan mengharapkan Homebrew CoreDNS.
- `--apply` melakukan bootstrap berkas zona jika diperlukan, memastikan stanza impor CoreDNS ada, dan memulai ulang layanan brew `coredns`.

## Terkait

- [Referensi CLI](/id/cli)
- [Discovery](/id/gateway/discovery)
