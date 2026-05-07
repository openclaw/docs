---
read_when:
    - Anda menginginkan loop pengembangan lokal tercepat (bun + watch)
    - Anda mengalami masalah skrip instalasi/patch/siklus hidup Bun
summary: 'Alur kerja Bun (eksperimental): instalasi dan hal yang perlu diperhatikan dibandingkan dengan pnpm'
title: Bun (eksperimental)
x-i18n:
    generated_at: "2026-05-07T13:20:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1637cb81310422b718934f9c2d1f506dec46f1624dd9ac850bed04321b863041
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **tidak direkomendasikan untuk runtime Gateway** (masalah yang diketahui dengan WhatsApp dan Telegram). Gunakan Node untuk produksi.
</Warning>

Bun adalah runtime lokal opsional untuk menjalankan TypeScript secara langsung (`bun run ...`, `bun --watch ...`). Manajer paket default tetap `pnpm`, yang didukung sepenuhnya dan digunakan oleh tooling dokumentasi. Bun tidak dapat menggunakan `pnpm-lock.yaml` dan akan mengabaikannya.

## Instal

<Steps>
  <Step title="Instal dependensi">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` diabaikan oleh git, jadi tidak ada perubahan repo. Untuk melewati penulisan lockfile sepenuhnya:

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

- `@whiskeysockets/baileys` `preinstall` -- memeriksa Node major >= 20 (OpenClaw default ke Node 24 dan masih mendukung Node 22 LTS, saat ini `22.16+`)
- `protobufjs` `postinstall` -- menampilkan peringatan tentang skema versi yang tidak kompatibel (tidak ada artefak build)

Jika Anda mengalami masalah runtime yang memerlukan skrip ini, percayai secara eksplisit:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Catatan

Beberapa skrip masih meng-hardcode pnpm (misalnya `docs:build`, `ui:*`, `protocol:check`). Jalankan skrip tersebut melalui pnpm untuk saat ini.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Node.js](/id/install/node)
- [Memperbarui](/id/install/updating)
