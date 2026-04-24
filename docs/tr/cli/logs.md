---
read_when:
    - Gateway günlüklerini uzaktan (SSH olmadan) takip etmeniz gerekiyor
    - Araçlar için JSON günlük satırları istiyorsunuz
summary: '`openclaw logs` için CLI başvurusu (RPC üzerinden gateway günlüklerini takip etme)'
title: Günlükler
x-i18n:
    generated_at: "2026-04-24T09:02:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94dddb9fd507c2f1d885c5cf92b78fd381355481317bf6f56b794afbd387f402
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

RPC üzerinden Gateway dosya günlüklerini takip edin (uzak modda çalışır).

İlgili:

- Günlükleme genel bakışı: [Günlükleme](/tr/logging)
- Gateway CLI: [gateway](/tr/cli/gateway)

## Seçenekler

- `--limit <n>`: döndürülecek en fazla günlük satırı sayısı (varsayılan `200`)
- `--max-bytes <n>`: günlük dosyasından okunacak en fazla bayt sayısı (varsayılan `250000`)
- `--follow`: günlük akışını takip et
- `--interval <ms>`: takip ederken sorgulama aralığı (varsayılan `1000`)
- `--json`: satır sınırlı JSON olayları üret
- `--plain`: biçemlendirilmiş biçimlendirme olmadan düz metin çıktısı
- `--no-color`: ANSI renklerini devre dışı bırak
- `--local-time`: zaman damgalarını yerel saat diliminizde göster

## Paylaşılan Gateway RPC seçenekleri

`openclaw logs`, standart Gateway istemci bayraklarını da kabul eder:

- `--url <url>`: Gateway WebSocket URL'si
- `--token <token>`: Gateway belirteci
- `--timeout <ms>`: ms cinsinden zaman aşımı (varsayılan `30000`)
- `--expect-final`: Gateway çağrısı aracı destekliyse son yanıtı bekle

`--url` geçirdiğinizde CLI yapılandırma veya ortam kimlik bilgilerini otomatik uygulamaz. Hedef Gateway kimlik doğrulama gerektiriyorsa `--token` değerini açıkça ekleyin.

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
- Yerel loopback Gateway eşleştirme isterse, `openclaw logs` yapılandırılmış yerel günlük dosyasına otomatik olarak geri döner. Açık `--url` hedefleri bu geri dönüşü kullanmaz.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway günlükleme](/tr/gateway/logging)
