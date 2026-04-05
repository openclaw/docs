---
read_when:
    - Gateway günlüklerini uzaktan izlemek istediğinizde (SSH olmadan)
    - Araçlar için JSON günlük satırları istediğinizde
summary: '`openclaw logs` için CLI başvurusu (RPC üzerinden gateway günlüklerini izleme)'
title: logs
x-i18n:
    generated_at: "2026-04-05T13:48:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 238a52e31a9a332cab513ced049e92d032b03c50376895ce57dffa2ee7d1e4b4
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

RPC üzerinden Gateway dosya günlüklerini izleyin (uzak modda çalışır).

İlgili:

- Günlükleme genel bakışı: [Logging](/logging)
- Gateway CLI: [gateway](/cli/gateway)

## Seçenekler

- `--limit <n>`: döndürülecek en fazla günlük satırı sayısı (varsayılan `200`)
- `--max-bytes <n>`: günlük dosyasından okunacak en fazla bayt sayısı (varsayılan `250000`)
- `--follow`: günlük akışını izle
- `--interval <ms>`: izleme sırasında yoklama aralığı (varsayılan `1000`)
- `--json`: satır ayrımlı JSON olayları üret
- `--plain`: stillendirilmiş biçimlendirme olmadan düz metin çıktısı
- `--no-color`: ANSI renklerini devre dışı bırak
- `--local-time`: zaman damgalarını yerel saat diliminizde göster

## Paylaşılan Gateway RPC seçenekleri

`openclaw logs`, standart Gateway istemci bayraklarını da kabul eder:

- `--url <url>`: Gateway WebSocket URL'si
- `--token <token>`: Gateway token'ı
- `--timeout <ms>`: ms cinsinden zaman aşımı (varsayılan `30000`)
- `--expect-final`: Gateway çağrısı agent destekliyse nihai yanıtı bekle

`--url` geçirdiğinizde CLI, yapılandırma veya ortam kimlik bilgilerini otomatik olarak uygulamaz. Hedef Gateway kimlik doğrulaması gerektiriyorsa `--token` seçeneğini açıkça ekleyin.

## Örnekler

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Notlar

- Zaman damgalarını yerel saat diliminizde göstermek için `--local-time` kullanın.
- Yerel local loopback Gateway eşleştirme isterse `openclaw logs`, yapılandırılmış yerel günlük dosyasına otomatik olarak geri döner. Açık `--url` hedefleri bu geri dönüşü kullanmaz.
