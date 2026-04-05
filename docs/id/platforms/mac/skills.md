---
read_when:
    - Memperbarui UI pengaturan Skills macOS
    - Mengubah gating atau perilaku instalasi Skills
summary: UI pengaturan Skills macOS dan status berbasis gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-05T14:00:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ffd6744646d2c8770fa12a5e511f84a40b5ece67181139250ec4cc4301b49b8
    source_path: platforms/mac/skills.md
    workflow: 15
---

# Skills (macOS)

App macOS menampilkan Skills OpenClaw melalui gateway; app ini tidak mem-parse Skills secara lokal.

## Sumber data

- `skills.status` (gateway) mengembalikan semua Skills beserta eligibility dan requirement yang hilang
  (termasuk blok allowlist untuk Skills bawaan).
- Requirement diturunkan dari `metadata.openclaw.requires` di setiap `SKILL.md`.

## Tindakan instalasi

- `metadata.openclaw.install` mendefinisikan opsi instalasi (brew/node/go/uv).
- App memanggil `skills.install` untuk menjalankan installer di host gateway.
- Temuan `critical` dangerous-code bawaan memblokir `skills.install` secara default; temuan mencurigakan tetap hanya memberi peringatan. Override dangerous ada pada permintaan gateway, tetapi alur app default tetap fail-closed.
- Jika setiap opsi instalasi adalah `download`, gateway menampilkan semua
  pilihan unduhan.
- Jika tidak, gateway memilih satu installer yang diprioritaskan menggunakan preferensi
  instalasi saat ini dan biner host: Homebrew terlebih dahulu ketika
  `skills.install.preferBrew` diaktifkan dan `brew` tersedia, lalu `uv`, lalu
  node manager yang dikonfigurasi dari `skills.install.nodeManager`, kemudian fallback
  berikutnya seperti `go` atau `download`.
- Label instalasi node mencerminkan node manager yang dikonfigurasi, termasuk `yarn`.

## Env/API key

- App menyimpan key di `~/.openclaw/openclaw.json` pada `skills.entries.<skillKey>`.
- `skills.update` mem-patch `enabled`, `apiKey`, dan `env`.

## Mode remote

- Instalasi + pembaruan konfigurasi terjadi di host gateway (bukan di Mac lokal).
