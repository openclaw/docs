---
read_when:
    - Menguji alur orientasi awal atau penyiapan terhadap Plugin yang dikemas secara lokal
    - Memverifikasi paket Plugin sebelum menerbitkannya
    - Mengganti instalasi Plugin otomatis dengan artefak pengujian
sidebarTitle: Install overrides
summary: Uji penimpaan Plugin terpaket dengan alur penginstalan saat penyiapan
title: Pengesampingan instalasi Plugin
x-i18n:
    generated_at: "2026-05-10T19:44:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0fca17c1c78b11a87a1ec265510d9bc5aa9826822f4888e37ff1b3f3803598e
    source_path: plugins/install-overrides.md
    workflow: 16
---

Override instalasi Plugin memungkinkan pemelihara menguji instalasi Plugin saat
penyiapan terhadap paket npm tertentu atau tarball npm-pack lokal. Override ini
hanya untuk validasi E2E dan paket. Pengguna biasa sebaiknya memasang Plugin
dengan [`openclaw plugins install`](/id/cli/plugins).

<Warning>
Override menjalankan kode Plugin dari sumber yang Anda berikan. Gunakan hanya di
direktori keadaan terisolasi atau mesin uji sekali pakai.
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

- `npm:<registry-spec>` untuk paket registry dan versi atau tag eksak
- `npm-pack:<path.tgz>` untuk tarball lokal yang dibuat oleh `npm pack`

Jalur `npm-pack:` relatif diresolve dari direktori kerja saat ini.

## Perilaku

Ketika alur saat penyiapan meminta untuk memasang Plugin yang id-nya muncul di peta,
OpenClaw menggunakan sumber override alih-alih sumber npm dari katalog, bawaan, atau default.
Ini berlaku untuk onboarding dan alur lain yang menggunakan penginstal Plugin
saat penyiapan bersama.

Override tetap memberlakukan id Plugin yang diharapkan. Tarball yang dipetakan ke `codex`
harus memasang Plugin yang id manifestnya adalah `codex`.

Override tidak mewarisi status sumber tepercaya resmi. Bahkan ketika entri katalog
biasanya merepresentasikan paket milik OpenClaw, override diperlakukan sebagai
input uji yang disediakan operator.

File `.env` workspace tidak dapat mengaktifkan override instalasi. Tetapkan variabel ini di
shell tepercaya, job CI, atau perintah uji jarak jauh yang meluncurkan OpenClaw.

## E2E Paket

Gunakan direktori keadaan terisolasi agar instalasi paket dan catatan instalasi tidak
menyentuh keadaan OpenClaw normal Anda:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Verifikasi paket yang terpasang di bawah direktori keadaan:

```bash
find "$OPENCLAW_STATE_DIR/npm/node_modules" -maxdepth 3 -name package.json -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/package-lock.json"
```

Untuk E2E provider live, muat kunci API nyata dari shell tepercaya atau secret CI
sebelum meluncurkan perintah uji. Jangan cetak kunci; laporkan hanya sumber dan
apakah kunci tersedia.
