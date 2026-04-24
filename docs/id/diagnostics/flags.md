---
read_when:
    - Anda memerlukan log debug yang terarah tanpa menaikkan level logging global
    - Anda perlu menangkap log khusus subsistem untuk dukungan
summary: Flag diagnostik untuk log debug yang terarah
title: Flag diagnostik
x-i18n:
    generated_at: "2026-04-24T09:06:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7e5ec9c5e28ef51f1e617baf62412897df8096f227a74d86a0824e269aafd9d
    source_path: diagnostics/flags.md
    workflow: 15
---

Flag diagnostik memungkinkan Anda mengaktifkan log debug yang terarah tanpa menyalakan logging verbose di mana-mana. Flag bersifat opt-in dan tidak berpengaruh kecuali suatu subsistem memeriksanya.

## Cara kerjanya

- Flag berupa string (tidak peka huruf besar/kecil).
- Anda dapat mengaktifkan flag di konfigurasi atau melalui override env.
- Wildcard didukung:
  - `telegram.*` cocok dengan `telegram.http`
  - `*` mengaktifkan semua flag

## Aktifkan melalui konfigurasi

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Beberapa flag:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

Mulai ulang gateway setelah mengubah flag.

## Override env (sekali pakai)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Nonaktifkan semua flag:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## Ke mana log dikirim

Flag mengeluarkan log ke file log diagnostik standar. Secara default:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Jika Anda mengatur `logging.file`, gunakan path tersebut sebagai gantinya. Log berbentuk JSONL (satu objek JSON per baris). Redaksi tetap berlaku berdasarkan `logging.redactSensitive`.

## Ekstrak log

Pilih file log terbaru:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filter untuk diagnostik HTTP Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Atau tail sambil mereproduksi:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

Untuk gateway jarak jauh, Anda juga dapat menggunakan `openclaw logs --follow` (lihat [/cli/logs](/id/cli/logs)).

## Catatan

- Jika `logging.level` diatur lebih tinggi dari `warn`, log ini mungkin ditekan. Default `info` sudah baik.
- Flag aman untuk dibiarkan aktif; flag hanya memengaruhi volume log untuk subsistem tertentu.
- Gunakan [/logging](/id/logging) untuk mengubah tujuan log, level, dan redaksi.

## Terkait

- [Diagnostik Gateway](/id/gateway/diagnostics)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
