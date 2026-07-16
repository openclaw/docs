---
read_when:
    - Anda ingin menginstal dependensi atau menjalankan skrip paket dengan Bun
    - Anda mengalami masalah pada skrip instalasi/patch/siklus hidup Bun
summary: Alur kerja Bun untuk instalasi dan skrip paket; Node diperlukan saat runtime
title: Bun
x-i18n:
    generated_at: "2026-07-16T18:15:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b822f700123b91c785eb881ebf28a63e77915b46dfd44beb9dbf63fb71aaa0d2
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun tidak dapat menjalankan CLI atau Gateway OpenClaw karena tidak menyediakan API `node:sqlite` yang diperlukan. Instal versi Node yang didukung untuk semua perintah runtime OpenClaw.
</Warning>

Bun tetap dapat digunakan sebagai penginstal dependensi dan penjalankan skrip paket opsional. Manajer paket default tetap `pnpm`, yang didukung sepenuhnya dan digunakan oleh alat dokumentasi. Bun tidak dapat menggunakan `pnpm-lock.yaml` dan mengabaikannya.

## Instalasi

<Steps>
  <Step title="Instal dependensi">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` diabaikan oleh git, sehingga tidak ada perubahan pada repo. Untuk sepenuhnya melewati penulisan lockfile:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build dan pengujian">
    ```sh
    bun run build
    bun run vitest run
    ```

    Perintah yang meluncurkan OpenClaw itu sendiri tetap harus dijalankan melalui Node.

  </Step>
</Steps>

## Skrip siklus hidup

Bun memblokir skrip siklus hidup dependensi kecuali jika dipercaya secara eksplisit. Untuk repo ini, skrip yang biasanya diblokir tidak diperlukan:

- `baileys` `preinstall`: memeriksa versi mayor Node >= 20 (OpenClaw memerlukan Node 22.22.3+, 24.15+, atau 25.9+, dengan Node 24 direkomendasikan)
- `protobufjs` `postinstall`: menampilkan peringatan tentang skema versi yang tidak kompatibel (tanpa artefak build)

Jika Anda mengalami masalah runtime yang memerlukan skrip ini, percayai skrip tersebut secara eksplisit:

```sh
bun pm trust baileys protobufjs
```

## Catatan penting

Beberapa skrip paket melakukan hardcode `pnpm` secara internal (misalnya `check:docs`, `ui:*`, `protocol:check`). Menjalankannya melalui `bun run` tetap memanggil `pnpm` melalui shell, jadi jalankan langsung melalui `pnpm`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Node.js](/id/install/node)
- [Pembaruan](/id/install/updating)
