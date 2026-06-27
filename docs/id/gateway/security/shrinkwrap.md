---
read_when:
    - Anda ingin tahu apa arti npm shrinkwrap dalam rilis OpenClaw
    - Anda sedang meninjau lockfile paket, perubahan dependensi, atau risiko rantai pasok
    - Anda sedang memvalidasi paket npm root atau plugin sebelum penerbitan
summary: Penjelasan bahasa sederhana dan teknis tentang npm shrinkwrap dalam rilis OpenClaw
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-06-27T17:33:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b71f25f5cecde3c954f71534adc011cd163f2e6344ec2f031ebbc858b55a9cd9
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

Checkout sumber OpenClaw menggunakan `pnpm-lock.yaml`. Paket npm OpenClaw yang dipublikasikan menggunakan `npm-shrinkwrap.json`, lockfile dependensi npm yang dapat dipublikasikan, sehingga instalasi paket menggunakan graf dependensi yang ditinjau selama rilis.

## Versi mudah

Shrinkwrap adalah tanda terima untuk pohon dependensi yang dikirim bersama paket npm. Ini memberi tahu npm versi paket transitif persis mana yang harus diinstal.

Untuk rilis OpenClaw, itu berarti:

- paket yang dipublikasikan tidak meminta npm membuat graf dependensi baru saat waktu instalasi;
- perubahan dependensi menjadi lebih mudah ditinjau karena muncul di lockfile;
- validasi rilis dapat menguji graf yang sama yang akan diinstal pengguna;
- kejutan ukuran paket atau dependensi native lebih mudah ditemukan sebelum publikasi.

Shrinkwrap bukan sandbox. Ia tidak membuat dependensi aman dengan sendirinya, dan tidak menggantikan isolasi host, `openclaw security audit`, asal-usul paket, atau uji smoke instalasi.

Model mental singkat:

| File                  | Tempat relevansinya       | Artinya                           |
| --------------------- | ------------------------- | --------------------------------- |
| `pnpm-lock.yaml`      | Checkout sumber OpenClaw  | Graf dependensi maintainer        |
| `npm-shrinkwrap.json` | Paket npm yang diterbitkan | Graf instalasi npm untuk pengguna |
| `package-lock.json`   | Aplikasi npm lokal        | Bukan kontrak publikasi OpenClaw  |

## Mengapa OpenClaw menggunakannya

OpenClaw adalah Gateway, host Plugin, router model, dan runtime agen. Instalasi default dapat memengaruhi waktu startup, penggunaan disk, unduhan paket native, dan paparan rantai pasok.

Shrinkwrap memberi tinjauan rilis batas yang stabil:

- peninjau dapat melihat pergerakan dependensi transitif;
- validator paket dapat menolak drift lockfile yang tidak diharapkan;
- penerimaan paket dapat menguji instalasi dengan graf yang akan dikirim;
- paket Plugin dapat membawa graf dependensi terkunci miliknya sendiri alih-alih mengandalkan paket root untuk memiliki dependensi khusus Plugin.

Tujuannya bukan "lebih banyak lockfile." Tujuannya adalah instalasi rilis yang dapat direproduksi dengan kepemilikan yang jelas.

## Detail teknis

Paket npm root `openclaw` dan paket Plugin npm milik OpenClaw menyertakan `npm-shrinkwrap.json` saat dipublikasikan. Paket Plugin milik OpenClaw yang sesuai juga dapat dipublikasikan dengan `bundledDependencies` eksplisit, sehingga file dependensi runtime-nya dibawa di dalam tarball Plugin alih-alih hanya bergantung pada resolusi saat instalasi.

Pertahankan batas seperti ini:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Generator menyelesaikan format lock npm yang dapat dipublikasikan tetapi menolak versi paket yang dihasilkan yang belum ada di `pnpm-lock.yaml`. Ini menjaga batas usia dependensi pnpm, override, dan tinjauan patch tetap utuh.

Gunakan perintah khusus root hanya saat sengaja menyegarkan paket root tanpa menyentuh paket Plugin:

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

Tinjau file-file ini sebagai sensitif terhadap keamanan:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- payload dependensi Plugin yang dibundel
- diff `package-lock.json` apa pun

Validator paket OpenClaw mewajibkan shrinkwrap dalam tarball paket root baru. Jalur publikasi npm Plugin memeriksa shrinkwrap lokal Plugin, menginstal dependensi bundel lokal paket, lalu mengemas atau memublikasikan. Validator paket menolak `package-lock.json` untuk paket OpenClaw yang dipublikasikan.

Untuk memeriksa paket root yang dipublikasikan:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Untuk memeriksa paket Plugin milik OpenClaw:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Latar belakang: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
