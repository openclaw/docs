---
read_when:
    - Memperbarui UI pengaturan Skills macOS
    - Mengubah pembatasan Skills atau perilaku instalasi
summary: Antarmuka pengaturan Skills macOS dan status yang didukung Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-27T17:44:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

Aplikasi macOS menampilkan Skills OpenClaw melalui Gateway; aplikasi ini tidak mengurai Skills secara lokal.

## Sumber data

- `skills.status` (Gateway) mengembalikan semua Skills beserta kelayakan dan persyaratan yang hilang
  (termasuk blok allowlist untuk Skills bawaan).
- Persyaratan diturunkan dari `metadata.openclaw.requires` di setiap `SKILL.md`.

## Tindakan instalasi

- `metadata.openclaw.install` mendefinisikan opsi instalasi (brew/node/go/uv).
- Aplikasi memanggil `skills.install` untuk menjalankan penginstal di host Gateway.
- `security.installPolicy` yang dimiliki operator dapat memblokir instalasi skill
  yang didukung Gateway sebelum metadata penginstal berjalan. Pemblokiran kode berbahaya bawaan saat instalasi
  bukan bagian dari alur instalasi skill.
- Jika setiap opsi instalasi adalah `download`, Gateway menampilkan semua
  pilihan unduhan.
- Jika tidak, Gateway memilih satu penginstal pilihan menggunakan preferensi
  instalasi saat ini dan biner host: Homebrew terlebih dahulu saat
  `skills.install.preferBrew` diaktifkan dan `brew` tersedia, lalu `uv`, lalu
  pengelola node yang dikonfigurasi dari `skills.install.nodeManager`, lalu
  fallback berikutnya seperti `go` atau `download`.
- Label instalasi Node mencerminkan pengelola node yang dikonfigurasi, termasuk `yarn`.

## Kunci env/API

- Aplikasi menyimpan kunci di `~/.openclaw/openclaw.json` di bawah `skills.entries.<skillKey>`.
- `skills.update` menambal `enabled`, `apiKey`, dan `env`.

## Mode jarak jauh

- Pembaruan instalasi + konfigurasi terjadi di host Gateway (bukan Mac lokal).

## Terkait

- [Skills](/id/tools/skills)
- [Aplikasi macOS](/id/platforms/macos)
