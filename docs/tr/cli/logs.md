---
read_when:
    - Gateway günlüklerini uzaktan izlemeniz gerekir (SSH olmadan)
    - Araçlar için JSON günlük satırları istiyorsunuz
summary: '`openclaw logs` için CLI başvurusu (RPC aracılığıyla Gateway günlüklerini izleme)'
title: Günlükler
x-i18n:
    generated_at: "2026-04-30T09:13:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Gateway dosya günlüklerini RPC üzerinden takip edin (uzak modda çalışır).

İlgili:

- Günlükleme genel bakışı: [Günlükleme](/tr/logging)
- Gateway CLI: [gateway](/tr/cli/gateway)

## Seçenekler

- `--limit <n>`: döndürülecek en fazla günlük satırı sayısı (varsayılan `200`)
- `--max-bytes <n>`: günlük dosyasından okunacak en fazla bayt (varsayılan `250000`)
- `--follow`: günlük akışını takip et
- `--interval <ms>`: takip ederken yoklama aralığı (varsayılan `1000`)
- `--json`: satırla sınırlandırılmış JSON olayları yay
- `--plain`: stilli biçimlendirme olmadan düz metin çıktısı
- `--no-color`: ANSI renklerini devre dışı bırak
- `--local-time`: zaman damgalarını yerel saat diliminizde göster

## Paylaşılan Gateway RPC seçenekleri

`openclaw logs`, standart Gateway istemci bayraklarını da kabul eder:

- `--url <url>`: Gateway WebSocket URL'si
- `--token <token>`: Gateway token'ı
- `--timeout <ms>`: ms cinsinden zaman aşımı (varsayılan `30000`)
- `--expect-final`: Gateway çağrısı ajan destekli olduğunda nihai yanıtı bekle

`--url` geçirdiğinizde CLI, yapılandırmayı veya ortam kimlik bilgilerini otomatik uygulamaz. Hedef Gateway kimlik doğrulaması gerektiriyorsa `--token` değerini açıkça ekleyin.

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
- Örtük local loopback Gateway eşleştirme isterse, bağlantı sırasında kapanırsa veya `logs.tail` yanıtlamadan önce zaman aşımına uğrarsa, `openclaw logs` otomatik olarak yapılandırılmış Gateway dosya günlüğüne geri döner. Açık `--url` hedefleri bu geri dönüşü kullanmaz.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway günlükleme](/tr/gateway/logging)
