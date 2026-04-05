---
read_when:
    - Anda menginginkan loop pengembangan lokal tercepat (bun + watch)
    - Anda mengalami masalah Bun terkait instalasi/patch/script lifecycle
summary: 'Alur kerja Bun (eksperimental): instalasi dan hal-hal yang perlu diperhatikan dibandingkan pnpm'
title: Bun (Eksperimental)
x-i18n:
    generated_at: "2026-04-05T13:56:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0845567834124bb9206db64df013dc29f3b61a04da4f7e7f0c2823a9ecd67a6
    source_path: install/bun.md
    workflow: 15
---

# Bun (Eksperimental)

<Warning>
Bun **tidak direkomendasikan untuk runtime gateway** (ada masalah yang diketahui dengan WhatsApp dan Telegram). Gunakan Node untuk produksi.
</Warning>

Bun adalah runtime lokal opsional untuk menjalankan TypeScript secara langsung (`bun run ...`, `bun --watch ...`). Package manager default tetap `pnpm`, yang didukung sepenuhnya dan digunakan oleh tooling dokumentasi. Bun tidak dapat menggunakan `pnpm-lock.yaml` dan akan mengabaikannya.

## Instal

<Steps>
  <Step title="Instal dependensi">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` diabaikan oleh git, jadi tidak ada perubahan repo. Untuk sepenuhnya melewati penulisan lockfile:

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

## Script Lifecycle

Bun memblokir dependency lifecycle script kecuali secara eksplisit dipercaya. Untuk repo ini, script yang umum diblokir tidak diperlukan:

- `@whiskeysockets/baileys` `preinstall` -- memeriksa Node major >= 20 (OpenClaw default ke Node 24 dan tetap mendukung Node 22 LTS, saat ini `22.14+`)
- `protobufjs` `postinstall` -- menampilkan peringatan tentang skema versi yang tidak kompatibel (tidak ada artefak build)

Jika Anda mengalami masalah runtime yang memerlukan script ini, percayai secara eksplisit:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Hal-hal yang perlu diperhatikan

Beberapa script masih meng-hardcode pnpm (misalnya `docs:build`, `ui:*`, `protocol:check`). Jalankan itu melalui pnpm untuk saat ini.
