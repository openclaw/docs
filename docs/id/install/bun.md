---
read_when:
    - Anda menginginkan siklus pengembangan lokal tercepat (bun + watch)
    - Anda mengalami masalah instalasi, patch, atau skrip siklus hidup Bun
summary: 'Alur kerja Bun (eksperimental): instalasi dan hal-hal yang perlu diperhatikan dibandingkan pnpm'
title: Bun (eksperimental)
x-i18n:
    generated_at: "2026-04-30T09:54:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **tidak direkomendasikan untuk runtime Gateway** (masalah yang diketahui dengan WhatsApp dan Telegram). Gunakan Node untuk produksi.
</Warning>

Bun adalah runtime lokal opsional untuk menjalankan TypeScript secara langsung (`bun run ...`, `bun --watch ...`). Package manager default tetap `pnpm`, yang didukung sepenuhnya dan digunakan oleh tooling docs. Bun tidak dapat menggunakan `pnpm-lock.yaml` dan akan mengabaikannya.

## Instalasi

<Steps>
  <Step title="Instal dependensi">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` masuk gitignore, sehingga tidak ada churn repo. Untuk melewati penulisan lockfile sepenuhnya:

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

## Skrip lifecycle

Bun memblokir skrip lifecycle dependensi kecuali dipercaya secara eksplisit. Untuk repo ini, skrip yang umum diblokir tidak diperlukan:

- `@whiskeysockets/baileys` `preinstall` -- memeriksa Node major >= 20 (OpenClaw default ke Node 24 dan masih mendukung Node 22 LTS, saat ini `22.14+`)
- `protobufjs` `postinstall` -- mengeluarkan peringatan tentang skema versi yang tidak kompatibel (tanpa artefak build)

Jika Anda mengalami masalah runtime yang memerlukan skrip ini, percayai secara eksplisit:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Catatan

Beberapa skrip masih meng-hardcode pnpm (misalnya `docs:build`, `ui:*`, `protocol:check`). Jalankan skrip tersebut melalui pnpm untuk saat ini.

## Terkait

- [Ringkasan instalasi](/id/install)
- [Node.js](/id/install/node)
- [Memperbarui](/id/install/updating)
