---
read_when:
    - Anda menginginkan penemuan jaringan area luas (DNS-SD) melalui Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Referensi CLI untuk `openclaw dns` (pembantu penemuan jaringan luas)
title: DNS
x-i18n:
    generated_at: "2026-07-12T14:04:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

Pembantu DNS untuk penemuan area luas (Tailscale + CoreDNS). Saat ini hanya mendukung macOS + CoreDNS dari Homebrew.

Terkait:

- Penemuan Gateway: [Penemuan](/id/gateway/discovery)
- Konfigurasi penemuan area luas: [Konfigurasi](/id/gateway/configuration)

## `dns setup`

Rencanakan atau terapkan penyiapan CoreDNS untuk penemuan DNS-SD unicast.

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| Opsi                | Efek                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| `--domain <domain>` | Domain penemuan area luas (misalnya `openclaw.internal`).                                                  |
| `--apply`           | Instal/perbarui konfigurasi CoreDNS dan mulai (ulang) layanan. Memerlukan sudo, hanya untuk macOS.         |

Tanpa `--domain`, OpenClaw menggunakan `discovery.wideArea.domain` dari konfigurasi.

Tanpa `--apply`, perintah hanya mencetak:

- Domain penemuan yang diuraikan dan jalur berkas zona
- IP tailnet saat ini
- Konfigurasi penemuan `openclaw.json` yang direkomendasikan
- Nilai server nama/domain Split DNS Tailscale yang harus ditetapkan di konsol admin Tailscale

Dengan `--apply` (hanya untuk macOS, memerlukan CoreDNS dari Homebrew):

- Menginisialisasi berkas zona jika belum ada
- Menambahkan stanza impor CoreDNS jika belum ada
- Memulai ulang layanan brew `coredns`

## Terkait

- [Referensi CLI](/id/cli)
- [Penemuan](/id/gateway/discovery)
