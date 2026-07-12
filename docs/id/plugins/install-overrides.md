---
read_when:
    - Menguji alur orientasi atau penyiapan dengan Plugin yang dikemas secara lokal
    - Memverifikasi paket plugin sebelum memublikasikannya
    - Mengganti penginstalan plugin otomatis dengan artefak pengujian
sidebarTitle: Install overrides
summary: Uji penimpaan plugin terpaket dengan alur penginstalan saat penyiapan
title: Penimpaan instalasi Plugin
x-i18n:
    generated_at: "2026-07-12T14:24:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

Penggantian instalasi Plugin memungkinkan pengelola mengarahkan instalasi plugin saat penyiapan ke
paket npm tertentu atau tarball lokal hasil `npm pack`, alih-alih sumber katalog,
bawaan, atau npm default. Penggantian ini hanya tersedia untuk E2E dan validasi
paket; pengguna biasa menginstal plugin dengan
[`openclaw plugins install`](/id/cli/plugins).

<Warning>
Penggantian menjalankan kode plugin dari sumber yang Anda berikan. Gunakan hanya di
direktori status yang terisolasi atau mesin pengujian sekali pakai.
</Warning>

## Lingkungan

Penggantian dinonaktifkan kecuali kedua variabel ditetapkan:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

Peta penggantian adalah JSON dengan id plugin sebagai kunci. Nilainya mendukung:

| Prefiks                | Sumber                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `npm:<registry-spec>` | Paket registri, versi persis, atau tag                                                       |
| `npm-pack:<path.tgz>` | Tarball lokal yang dihasilkan oleh `npm pack`; jalur relatif diselesaikan dari direktori kerja saat ini |

## Perilaku

Saat alur penyiapan menginstal plugin yang id-nya tercantum dalam peta, OpenClaw
menggunakan sumber penggantian alih-alih sumber katalog, bawaan, atau npm
default. Ini berlaku untuk orientasi awal dan alur lain yang menggunakan
penginstal plugin bersama saat penyiapan.

- Penggantian tetap memberlakukan id plugin yang diharapkan: tarball yang dipetakan ke `codex`
  harus menginstal plugin dengan id manifes `codex`.
- Penggantian tidak mewarisi status sumber tepercaya resmi. Bahkan ketika
  entri katalog biasanya mewakili paket milik OpenClaw, penggantian
  diperlakukan sebagai masukan pengujian yang disediakan operator.
- Berkas `.env` ruang kerja tidak dapat mengaktifkan penggantian instalasi; kedua variabel lingkungan tercantum dalam
  daftar blokir dotenv ruang kerja. Tetapkan keduanya di shell tepercaya, tugas CI, atau
  perintah pengujian jarak jauh yang meluncurkan OpenClaw.

## E2E Paket

Gunakan direktori status yang terisolasi agar instalasi paket dan catatan instalasi tidak
menyentuh status OpenClaw normal Anda:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Verifikasi paket yang diinstal di dalam direktori status:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Untuk E2E penyedia langsung, muat kunci API sebenarnya dari shell tepercaya atau rahasia
CI sebelum menjalankan perintah pengujian. Jangan cetak kunci; laporkan hanya
sumbernya dan apakah kunci tersebut tersedia.
