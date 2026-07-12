---
read_when:
    - Memperbarui UI pengaturan Skills macOS
    - Mengubah pembatasan Skills atau perilaku penginstalan
summary: UI pengaturan Skills macOS dan status yang didukung Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-12T14:22:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

Aplikasi macOS menampilkan Skills OpenClaw melalui Gateway; aplikasi tersebut tidak mengurai Skills secara lokal.

## Sumber data

- `skills.status` (Gateway) mengembalikan semua Skills beserta kelayakan dan persyaratan yang belum terpenuhi, termasuk pemblokiran daftar izin untuk Skills bawaan.
- Persyaratan berasal dari `metadata.openclaw.requires` di setiap `SKILL.md`.

## Tindakan instalasi

- `metadata.openclaw.install` menentukan opsi instalasi (brew/node/go/uv/download).
- Aplikasi memanggil `skills.install` untuk menjalankan penginstal pada host Gateway.
- `security.installPolicy` yang dikelola operator (`enabled`, `targets`, `exec`) dapat memblokir instalasi Skills melalui Gateway sebelum metadata penginstal dijalankan. Pemindaian bawaan untuk kode berbahaya (yang digunakan untuk instalasi Plugin) tidak terhubung ke alur instalasi Skills.
- Jika setiap opsi instalasi adalah `download`, Gateway menampilkan semua pilihan unduhan.
- Jika tidak, Gateway memilih satu penginstal yang diprioritaskan berdasarkan preferensi instalasi saat ini (`skills.install.preferBrew`, `skills.install.nodeManager`) dan biner pada host: Homebrew terlebih dahulu saat `preferBrew` diaktifkan dan `brew` tersedia, lalu `uv`, kemudian pengelola node yang dikonfigurasi, lalu Homebrew lagi jika tersedia (meskipun tanpa `preferBrew`), kemudian `go`, lalu `download`.
- Label instalasi Node mencerminkan pengelola node yang dikonfigurasi, termasuk `yarn`.

## Kunci lingkungan/API

- Aplikasi menyimpan kunci di `~/.openclaw/openclaw.json` pada `skills.entries.<skillKey>`.
- `skills.update` memperbarui sebagian `enabled`, `apiKey`, dan `env`.

## Mode jarak jauh

- Pembaruan instalasi dan konfigurasi dilakukan pada host Gateway, bukan pada Mac lokal.

## Terkait

- [Skills](/id/tools/skills)
- [Aplikasi macOS](/id/platforms/macos)
