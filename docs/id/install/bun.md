---
read_when:
    - Anda menginginkan loop pengembangan lokal tercepat (bun + watch)
    - Anda mengalami masalah skrip instalasi/patch/siklus hidup Bun
summary: 'Alur kerja Bun (eksperimental): instalasi dan hal-hal yang perlu diperhatikan dibandingkan pnpm'
title: Bun (eksperimental)
x-i18n:
    generated_at: "2026-05-10T19:39:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97a7da26520d66e6033065c50d6490c869ace3d5f0b25aafcd196074cf7df7c
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **tidak direkomendasikan untuk runtime gateway** (masalah yang diketahui dengan WhatsApp dan Telegram). Gunakan Node untuk produksi.
</Warning>

Bun adalah runtime lokal opsional untuk menjalankan TypeScript secara langsung (`bun run ...`, `bun --watch ...`). Manajer paket bawaan tetap `pnpm`, yang didukung penuh dan digunakan oleh tooling docs. Bun tidak dapat menggunakan `pnpm-lock.yaml` dan akan mengabaikannya.

## Instal

<Steps>
  <Step title="Instal dependensi">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` diabaikan oleh git, sehingga tidak ada churn repo. Untuk sepenuhnya melewati penulisan lockfile:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build dan uji">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Skrip siklus hidup

Bun memblokir skrip siklus hidup dependensi kecuali dipercaya secara eksplisit. Untuk repo ini, skrip yang umum diblokir tidak diperlukan:

- `baileys` `preinstall` -- memeriksa versi mayor Node >= 20 (OpenClaw secara bawaan menggunakan Node 24 dan masih mendukung Node 22 LTS, saat ini `22.16+`)
- `protobufjs` `postinstall` -- mengeluarkan peringatan tentang skema versi yang tidak kompatibel (tidak ada artefak build)

Jika Anda mengalami masalah runtime yang memerlukan skrip ini, percayai secara eksplisit:

```sh
bun pm trust baileys protobufjs
```

## Catatan

Beberapa skrip masih meng-hardcode pnpm (misalnya `docs:build`, `ui:*`, `protocol:check`). Jalankan skrip tersebut melalui pnpm untuk saat ini.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Node.js](/id/install/node)
- [Memperbarui](/id/install/updating)
