---
read_when:
    - Gateway günlüklerini uzaktan izlemeniz gerekir (SSH olmadan)
    - Araçlar için JSON günlük satırları istiyorsunuz
summary: '`openclaw logs` için CLI başvurusu (RPC aracılığıyla Gateway günlüklerini takip et)'
title: Günlükler
x-i18n:
    generated_at: "2026-05-03T21:28:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89753a18e31cd643e19db80b6cef4ecac1aae0733e68d6c678e6419e28bd270e
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

RPC üzerinden Gateway dosya günlüklerini takip edin (uzak modda çalışır).

İlgili:

- Günlükleme genel bakışı: [Günlükleme](/tr/logging)
- Gateway CLI: [gateway](/tr/cli/gateway)

## Seçenekler

- `--limit <n>`: döndürülecek maksimum günlük satırı sayısı (varsayılan `200`)
- `--max-bytes <n>`: günlük dosyasından okunacak maksimum bayt sayısı (varsayılan `250000`)
- `--follow`: günlük akışını takip et
- `--interval <ms>`: takip sırasında yoklama aralığı (varsayılan `1000`)
- `--json`: satırla ayrılmış JSON olayları yayınla
- `--plain`: biçimlendirilmiş stil olmadan düz metin çıktısı
- `--no-color`: ANSI renklerini devre dışı bırak
- `--local-time`: zaman damgalarını yerel saat diliminizde işle

## Paylaşılan Gateway RPC seçenekleri

`openclaw logs` standart Gateway istemci bayraklarını da kabul eder:

- `--url <url>`: Gateway WebSocket URL'si
- `--token <token>`: Gateway belirteci
- `--timeout <ms>`: ms cinsinden zaman aşımı (varsayılan `30000`)
- `--expect-final`: Gateway çağrısı aracı destekliyse son yanıtı bekle

`--url` ilettiğinizde CLI yapılandırmayı veya ortam kimlik bilgilerini otomatik olarak uygulamaz. Hedef Gateway kimlik doğrulama gerektiriyorsa `--token` seçeneğini açıkça ekleyin.

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

- Zaman damgalarını yerel saat diliminizde işlemek için `--local-time` kullanın.
- Örtük local loopback Gateway eşleştirme isterse, bağlantı sırasında kapanırsa veya `logs.tail` yanıt vermeden önce zaman aşımına uğrarsa, `openclaw logs` otomatik olarak yapılandırılmış Gateway dosya günlüğüne geri döner. Açık `--url` hedefleri bu geri dönüşü kullanmaz.
- `--follow` kullanılırken geçici gateway bağlantı kesilmeleri (WebSocket kapanması, zaman aşımı, bağlantı kopması) üstel geri çekilmeyle otomatik yeniden bağlanmayı tetikler (en fazla 8 yeniden deneme, denemeler arası en fazla 30 sn). Her yeniden denemede stderr'e bir uyarı yazdırılır ve bir yoklama başarılı olduğunda bir kez `[logs] gateway reconnected` bildirimi yazdırılır. `--json` modunda hem yeniden deneme uyarısı hem de yeniden bağlanma geçişi stderr üzerinde `{"type":"notice"}` kayıtları olarak yayınlanır. Kurtarılamayan hatalar (kimlik doğrulama hatası, hatalı yapılandırma) yine de hemen çıkar.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway günlükleme](/tr/gateway/logging)
