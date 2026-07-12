---
read_when:
    - Anda ingin mengetahui arti npm shrinkwrap dalam rilis OpenClaw
    - Anda sedang meninjau lockfile paket, perubahan dependensi, atau risiko rantai pasok
    - Anda sedang memvalidasi paket npm root atau plugin sebelum dipublikasikan
summary: Penjelasan dalam bahasa sederhana dan teknis tentang npm shrinkwrap dalam rilis OpenClaw
title: shrinkwrap npm
x-i18n:
    generated_at: "2026-07-12T14:14:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

Checkout sumber OpenClaw menggunakan `pnpm-lock.yaml`. Paket npm OpenClaw yang dipublikasikan menggunakan `npm-shrinkwrap.json`, yaitu lockfile dependensi npm yang dapat dipublikasikan, sehingga instalasi paket menggunakan graf dependensi yang telah ditinjau selama rilis.

## Mengapa ini penting

Shrinkwrap adalah bukti untuk pohon dependensi yang dikirimkan bersama paket npm: berkas ini memberi tahu npm versi transitif persis yang harus diinstal.

| Berkas                | Tempat berlakunya           | Artinya                            |
| --------------------- | --------------------------- | --------------------------------- |
| `pnpm-lock.yaml`      | Checkout sumber OpenClaw    | Graf dependensi pengelola         |
| `npm-shrinkwrap.json` | Paket npm yang dipublikasikan | Graf instalasi npm untuk pengguna |
| `package-lock.json`   | Aplikasi npm lokal          | Bukan kontrak publikasi OpenClaw  |

Untuk rilis OpenClaw, ini berarti:

- paket yang dipublikasikan tidak meminta npm membuat graf dependensi baru saat instalasi;
- perubahan dependensi dapat ditinjau karena tercantum dalam perbedaan lockfile;
- validasi rilis menguji graf yang sama dengan yang akan diinstal pengguna;
- kejutan terkait ukuran paket atau dependensi native muncul sebelum publikasi.

Shrinkwrap bukan sandbox. Shrinkwrap tidak dengan sendirinya menjadikan dependensi aman, dan tidak menggantikan isolasi host, `openclaw security audit`, asal-usul paket, atau uji smoke instalasi.

OpenClaw adalah gateway, host plugin, perute model, dan runtime agen, sehingga instalasi bawaan memengaruhi waktu mulai, penggunaan disk, pengunduhan paket native, dan paparan rantai pasok. Shrinkwrap memberikan batas yang stabil untuk peninjauan rilis: peninjau dapat melihat pergerakan dependensi transitif, validator menolak penyimpangan lockfile yang tidak diharapkan, dan paket plugin membawa graf dependensinya sendiri yang terkunci alih-alih mengandalkan paket root.

## Membuat dan memeriksa

Paket npm root `openclaw`, paket plugin npm milik OpenClaw (misalnya `@openclaw/discord`), dan paket workspace yang dapat dipublikasikan seperti [`@openclaw/ai`](/reference/openclaw-ai) menyertakan `npm-shrinkwrap.json` saat dipublikasikan. Dependensi workspace tidak disertakan dalam shrinkwrap root karena dipublikasikan bersama paket root; sebagai gantinya, setiap paket workspace yang dapat dipublikasikan mengunci pohon transitifnya sendiri. Paket plugin yang sesuai juga dapat dipublikasikan dengan `bundledDependencies` eksplisit, sehingga berkas dependensi runtime disertakan dalam tarball plugin alih-alih hanya mengandalkan resolusi saat instalasi.

```bash
# Semua paket yang dikelola shrinkwrap (root + plugin yang dapat dipublikasikan)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Hanya paket root
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Hanya paket yang terpengaruh oleh kumpulan perubahan saat ini
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

Generator menyelesaikan format lock npm yang dapat dipublikasikan, tetapi menolak versi paket yang dihasilkan jika belum ada di `pnpm-lock.yaml`. Hal ini mempertahankan batas peninjauan usia dependensi, override, dan patch pnpm.

Tinjau hal-hal berikut sebagai hal yang sensitif terhadap keamanan:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- muatan dependensi plugin yang dibundel
- setiap perbedaan `package-lock.json`

Validator paket OpenClaw mewajibkan shrinkwrap dalam tarball paket root baru dan menolak `package-lock.json` untuk paket yang dipublikasikan. Jalur publikasi npm plugin memeriksa shrinkwrap lokal plugin, menginstal dependensi yang dibundel secara lokal dalam paket, lalu mengemas atau memublikasikannya.

## Memeriksa paket yang dipublikasikan

Paket root:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Paket plugin:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Latar belakang: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
