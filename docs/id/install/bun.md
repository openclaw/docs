---
read_when:
    - Anda menginginkan siklus pengembangan lokal tercepat (bun + watch)
    - Anda mengalami masalah pada skrip instalasi/patch/siklus hidup Bun
summary: 'Alur kerja Bun (eksperimental): instalasi dan hal-hal yang perlu diperhatikan dibandingkan dengan pnpm'
title: Bun (eksperimental)
x-i18n:
    generated_at: "2026-07-12T14:18:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun tidak direkomendasikan untuk runtime Gateway (terdapat masalah yang diketahui pada WhatsApp dan Telegram). Gunakan Node untuk produksi.
</Warning>

Bun adalah runtime lokal opsional untuk menjalankan TypeScript secara langsung (`bun run ...`, `bun --watch ...`). Manajer paket default tetap `pnpm`, yang didukung sepenuhnya dan digunakan oleh perangkat dokumentasi. Bun tidak dapat menggunakan `pnpm-lock.yaml` dan mengabaikannya.

## Instalasi

<Steps>
  <Step title="Instal dependensi">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` diabaikan oleh git, sehingga tidak ada perubahan yang tidak perlu pada repositori. Untuk sepenuhnya melewati penulisan berkas kunci:

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

Bun memblokir skrip siklus hidup dependensi kecuali dipercaya secara eksplisit. Untuk repositori ini, skrip yang umumnya diblokir tidak diperlukan:

- `baileys` `preinstall`: memeriksa versi mayor Node >= 20 (OpenClaw memerlukan Node 22.19+ atau 23.11+, dengan Node 24 direkomendasikan)
- `protobufjs` `postinstall`: menampilkan peringatan tentang skema versi yang tidak kompatibel (tanpa artefak build)

Jika Anda mengalami masalah runtime yang memerlukan skrip tersebut, percayai skrip itu secara eksplisit:

```sh
bun pm trust baileys protobufjs
```

## Catatan penting

Beberapa skrip paket menetapkan `pnpm` secara langsung secara internal (misalnya `check:docs`, `ui:*`, `protocol:check`). Menjalankannya melalui `bun run` tetap memanggil `pnpm` lewat shell, jadi jalankan saja skrip tersebut secara langsung melalui `pnpm`.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Node.js](/id/install/node)
- [Pembaruan](/id/install/updating)
