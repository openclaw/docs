---
read_when:
    - Anda menginginkan siklus pengembangan lokal tercepat (bun + watch)
    - Anda mengalami masalah skrip instalasi/patch/siklus hidup Bun
summary: 'Alur kerja Bun (eksperimental): instalasi dan hal yang perlu diperhatikan dibandingkan pnpm'
title: Bun (eksperimental)
x-i18n:
    generated_at: "2026-06-27T17:37:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **tidak direkomendasikan untuk runtime Gateway** (masalah yang diketahui dengan WhatsApp dan Telegram). Gunakan Node untuk produksi.
</Warning>

Bun adalah runtime lokal opsional untuk menjalankan TypeScript secara langsung (`bun run ...`, `bun --watch ...`). Manajer paket default tetap `pnpm`, yang didukung sepenuhnya dan digunakan oleh alat dokumentasi. Bun tidak dapat menggunakan `pnpm-lock.yaml` dan akan mengabaikannya.

## Instalasi

<Steps>
  <Step title="Instal dependensi">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` diabaikan oleh git, sehingga tidak ada perubahan berulang pada repo. Untuk sepenuhnya melewati penulisan lockfile:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Bangun dan uji">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Skrip siklus hidup

Bun memblokir skrip siklus hidup dependensi kecuali dipercaya secara eksplisit. Untuk repo ini, skrip yang umum diblokir tidak diperlukan:

- `baileys` `preinstall` -- memeriksa Node mayor >= 20 (OpenClaw default ke Node 24 dan masih mendukung Node 22 LTS, saat ini `22.19+`)
- `protobufjs` `postinstall` -- menghasilkan peringatan tentang skema versi yang tidak kompatibel (tidak ada artefak build)

Jika Anda mengalami masalah runtime yang memerlukan skrip ini, percayai skrip tersebut secara eksplisit:

```sh
bun pm trust baileys protobufjs
```

## Catatan

Beberapa skrip masih mengodekan pnpm secara tetap (misalnya `check:docs`, `ui:*`, `protocol:check`). Jalankan skrip tersebut melalui pnpm untuk saat ini.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Node.js](/id/install/node)
- [Memperbarui](/id/install/updating)
