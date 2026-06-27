---
read_when:
    - Menguji alur onboarding atau penyiapan terhadap plugin yang dikemas secara lokal
    - Memverifikasi paket plugin sebelum menerbitkannya
    - Mengganti instalasi Plugin otomatis dengan artefak pengujian
sidebarTitle: Install overrides
summary: Uji override Plugin terpaket dengan alur instalasi saat penyiapan
title: Penggantian instalasi Plugin
x-i18n:
    generated_at: "2026-06-27T17:48:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

Override instalasi Plugin memungkinkan pemelihara menguji instalasi Plugin saat penyiapan terhadap
paket npm tertentu atau tarball `npm-pack` lokal. Override ini hanya untuk E2E dan validasi
paket. Pengguna normal sebaiknya menginstal Plugin dengan
[`openclaw plugins install`](/id/cli/plugins).

<Warning>
Override mengeksekusi kode Plugin dari sumber yang Anda berikan. Gunakan hanya di
direktori state yang terisolasi atau mesin uji sekali pakai.
</Warning>

## Lingkungan

Override dinonaktifkan kecuali kedua variabel ditetapkan:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

Peta override adalah JSON yang dikunci berdasarkan id Plugin. Nilai mendukung:

- `npm:<registry-spec>` untuk paket registry dan versi atau tag yang tepat
- `npm-pack:<path.tgz>` untuk tarball lokal yang dihasilkan oleh `npm pack`

Path relatif `npm-pack:` diselesaikan dari direktori kerja saat ini.

## Perilaku

Ketika alur saat penyiapan meminta untuk menginstal Plugin yang id-nya muncul di peta,
OpenClaw menggunakan sumber override alih-alih sumber npm dari katalog, bawaan, atau default.
Ini berlaku untuk onboarding dan alur lain yang menggunakan penginstal Plugin bersama
saat penyiapan.

Override tetap memberlakukan id Plugin yang diharapkan. Tarball yang dipetakan ke `codex`
harus menginstal Plugin yang id manifesnya adalah `codex`.

Override tidak mewarisi status sumber tepercaya resmi. Bahkan ketika entri katalog
biasanya mewakili paket milik OpenClaw, override diperlakukan sebagai input uji
yang disediakan operator.

File `.env` workspace tidak dapat mengaktifkan override instalasi. Tetapkan variabel ini di
shell tepercaya, job CI, atau perintah uji jarak jauh yang meluncurkan OpenClaw.

## Paket E2E

Gunakan direktori state yang terisolasi agar instalasi paket dan catatan instalasi tidak
menyentuh state OpenClaw normal Anda:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Verifikasi paket yang terinstal di bawah direktori state:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Untuk E2E penyedia live, ambil API key nyata dari shell tepercaya atau secret CI
sebelum menjalankan perintah uji. Jangan mencetak key; laporkan hanya sumbernya dan
apakah key tersebut ada.
