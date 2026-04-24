---
read_when:
    - Memperbarui UI pengaturan Skills di macOS
    - Mengubah gating Skills atau perilaku instalasi
summary: UI pengaturan Skills di macOS dan status yang didukung gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-04-24T09:17:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcd89d27220644866060d0f9954a116e6093d22f7ebd32d09dc16871c25b988e
    source_path: platforms/mac/skills.md
    workflow: 15
---

Aplikasi macOS menampilkan Skills OpenClaw melalui gateway; aplikasi ini tidak mem-parsing skill secara lokal.

## Sumber data

- `skills.status` (gateway) mengembalikan semua skill beserta eligibility dan missing requirements
  (termasuk blok allowlist untuk skill bawaan).
- Requirement diturunkan dari `metadata.openclaw.requires` di setiap `SKILL.md`.

## Aksi instalasi

- `metadata.openclaw.install` menentukan opsi instalasi (brew/node/go/uv).
- Aplikasi memanggil `skills.install` untuk menjalankan installer di host gateway.
- Temuan `critical` dangerous-code bawaan memblokir `skills.install` secara default; temuan suspicious tetap hanya memberi peringatan. Override dangerous memang ada pada permintaan gateway, tetapi alur aplikasi default tetap fail-closed.
- Jika setiap opsi instalasi adalah `download`, gateway menampilkan semua
  pilihan unduhan.
- Jika tidak, gateway memilih satu installer yang diprioritaskan menggunakan preferensi instalasi saat ini
  dan binary host: Homebrew terlebih dahulu ketika
  `skills.install.preferBrew` diaktifkan dan `brew` ada, lalu `uv`, lalu
  node manager yang dikonfigurasi dari `skills.install.nodeManager`, lalu
  fallback berikutnya seperti `go` atau `download`.
- Label instalasi Node mencerminkan node manager yang dikonfigurasi, termasuk `yarn`.

## Env/API key

- Aplikasi menyimpan key di `~/.openclaw/openclaw.json` di bawah `skills.entries.<skillKey>`.
- `skills.update` menambal `enabled`, `apiKey`, dan `env`.

## Mode remote

- Instalasi + pembaruan konfigurasi terjadi di host gateway (bukan di Mac lokal).

## Terkait

- [Skills](/id/tools/skills)
- [Aplikasi macOS](/id/platforms/macos)
