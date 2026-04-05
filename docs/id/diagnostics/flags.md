---
read_when:
    - Anda memerlukan log debug yang ditargetkan tanpa menaikkan level logging global
    - Anda perlu menangkap log khusus subsistem untuk dukungan
summary: Flag diagnostik untuk log debug yang ditargetkan
title: Flag Diagnostik
x-i18n:
    generated_at: "2026-04-05T13:52:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: daf0eca0e6bd1cbc2c400b2e94e1698709a96b9cdba1a8cf00bd580a61829124
    source_path: diagnostics/flags.md
    workflow: 15
---

# Flag Diagnostik

Flag diagnostik memungkinkan Anda mengaktifkan log debug yang ditargetkan tanpa menyalakan logging verbose di semua tempat. Flag bersifat opt-in dan tidak berpengaruh kecuali suatu subsistem memeriksanya.

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

Flag mengirim log ke file log diagnostik standar. Secara default:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

Jika Anda menetapkan `logging.file`, gunakan path itu sebagai gantinya. Log berformat JSONL (satu objek JSON per baris). Redaksi tetap berlaku berdasarkan `logging.redactSensitive`.

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

Untuk Gateway jarak jauh, Anda juga dapat menggunakan `openclaw logs --follow` (lihat [/cli/logs](/cli/logs)).

## Catatan

- Jika `logging.level` disetel lebih tinggi daripada `warn`, log ini mungkin disembunyikan. Default `info` tidak masalah.
- Flag aman dibiarkan tetap aktif; flag hanya memengaruhi volume log untuk subsistem tertentu.
- Gunakan [/logging](/logging) untuk mengubah tujuan log, level, dan redaksi.
