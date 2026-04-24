---
read_when:
    - Anda menginginkan loop dev lokal tercepat (bun + watch)
    - Anda mengalami masalah instalasi/patch/skrip lifecycle Bun
summary: 'Alur kerja Bun (eksperimental): instalasi dan hal yang perlu diwaspadai vs pnpm'
title: Bun (eksperimental)
x-i18n:
    generated_at: "2026-04-24T09:12:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5637f64fe272faf74915e8de115f21fdf9c9dd0406e5c471932323b2c1d4c0bd
    source_path: install/bun.md
    workflow: 15
---

<Warning>
Bun **tidak direkomendasikan untuk runtime gateway** (ada masalah yang diketahui dengan WhatsApp dan Telegram). Gunakan Node untuk produksi.
</Warning>

Bun adalah runtime lokal opsional untuk menjalankan TypeScript secara langsung (`bun run ...`, `bun --watch ...`). Manajer paket default tetap `pnpm`, yang didukung sepenuhnya dan digunakan oleh tooling dokumentasi. Bun tidak dapat menggunakan `pnpm-lock.yaml` dan akan mengabaikannya.

## Instalasi

<Steps>
  <Step title="Instal dependensi">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` diabaikan oleh git, sehingga tidak ada churn repo. Untuk melewati penulisan lockfile sepenuhnya:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build dan test">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Skrip lifecycle

Bun memblokir skrip lifecycle dependensi kecuali secara eksplisit dipercaya. Untuk repo ini, skrip yang umum diblokir tidak diperlukan:

- `@whiskeysockets/baileys` `preinstall` -- memeriksa Node major >= 20 (default OpenClaw adalah Node 24 dan masih mendukung Node 22 LTS, saat ini `22.14+`)
- `protobufjs` `postinstall` -- menghasilkan peringatan tentang skema versi yang tidak kompatibel (tanpa artefak build)

Jika Anda mengalami masalah runtime yang memerlukan skrip ini, percayai secara eksplisit:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Hal yang perlu diwaspadai

Beberapa skrip masih meng-hardcode pnpm (misalnya `docs:build`, `ui:*`, `protocol:check`). Untuk saat ini, jalankan skrip tersebut melalui pnpm.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Node.js](/id/install/node)
- [Memperbarui](/id/install/updating)
