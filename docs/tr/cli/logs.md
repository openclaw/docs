---
read_when:
    - Gateway günlüklerini uzaktan (SSH olmadan) takip etmeniz gerekiyor
    - Araçlar için JSON günlük satırları istiyorsunuz
summary: '`openclaw logs` için CLI referansı (RPC aracılığıyla Gateway günlüklerini takip etme)'
title: Günlükler
x-i18n:
    generated_at: "2026-07-12T11:35:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Gateway dosya günlüklerinin sonunu RPC üzerinden izler. Uzak modda çalışır.

## Seçenekler

- `--limit <n>`: döndürülecek azami günlük satırı sayısı (varsayılan `200`)
- `--max-bytes <n>`: günlük dosyasından okunacak azami bayt sayısı (varsayılan `250000`)
- `--follow`: günlük akışını takip et
- `--interval <ms>`: takip sırasındaki yoklama aralığı (varsayılan `1000`)
- `--json`: satırla ayrılmış JSON olayları üret
- `--plain`: biçemli biçimlendirme olmadan düz metin çıktısı
- `--no-color`: ANSI renklerini devre dışı bırak
- `--local-time`: zaman damgalarını yerel saat diliminizde göster (varsayılan)
- `--utc`: zaman damgalarını UTC olarak göster

## Paylaşılan Gateway RPC seçenekleri

- `--url <url>`: Gateway WebSocket URL'si
- `--token <token>`: Gateway belirteci
- `--timeout <ms>`: milisaniye cinsinden zaman aşımı (varsayılan `30000`)
- `--expect-final`: Gateway çağrısı aracı destekliyse nihai yanıtı bekle

`--url` iletildiğinde otomatik uygulanan yapılandırma kimlik bilgileri atlanır; hedef Gateway kimlik doğrulaması gerektiriyorsa `--token` seçeneğini açıkça ekleyin.

## Örnekler

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Geri dönüş ve kurtarma davranışı

- Örtük local loopback Gateway eşleştirme isterse, bağlantı sırasında kapanırsa veya `logs.tail` yanıt vermeden önce zaman aşımına uğrarsa `openclaw logs`, yapılandırılmış Gateway dosya günlüğüne otomatik olarak geri döner. Açıkça belirtilen `--url` hedefleri bu geri dönüşü hiçbir zaman kullanmaz.
- `--follow`, örtük yerel Gateway RPC hatasından sonra yapılandırılmış dosyaya geri dönmez; güncelliğini yitirmiş yan yana bir dosya, canlı son izleme sırasında yanıltıcı olabilir. Linux'ta bunun yerine, kullanılabiliyorsa etkin kullanıcı systemd Gateway günlüğünü PID'ye göre kullanır (seçilen kaynağı yazdırır); aksi takdirde canlı Gateway'e yeniden bağlanmayı sürdürür.
- `--follow` sırasında geçici bağlantı kesintileri (WebSocket kapanması, zaman aşımı, bağlantının kopması), üstel geri çekilmeyle otomatik yeniden bağlantıyı tetikler: en fazla 8 yeniden deneme ve denemeler arasında en fazla 30 saniye. Her yeniden denemede stderr'e bir uyarı yazdırılır ve bir yoklama başarılı olduğunda bir kez `[logs] gateway reconnected` bildirimi yazdırılır. `--json` modunda her ikisi de stderr'de `{"type":"notice"}` kayıtları olarak üretilir. Kurtarılamayan hatalarda (kimlik doğrulama hatası, geçersiz yapılandırma) işlem yine hemen sonlandırılır.
- `--follow --json` modunda günlük kaynağı geçişleri `{"type":"meta"}` kayıtları olarak üretilir. İmleçleri her `sourceKind` için ayrı ayrı izleyin: bir akış, Gateway dosya çıktısından (`sourceKind: "file"`) yerel günlük geri dönüşüne (`sourceKind: "journal"`, `localFallback: true`, `service.pid`/`service.unit` ile) geçip kurtarmadan sonra tekrar Gateway dosya çıktısına dönebilir. Oturumun tamamı boyunca tek ve sabit bir kaynak veya imleç bulunduğunu varsaymayın; kurtarma işlemi Gateway dosya imlecini yeniden oynattığında örtüşen satırlara tolerans gösterin.

## İlgili konular

- [Günlük kaydına genel bakış](/tr/logging)
- [Gateway CLI](/tr/cli/gateway)
- [CLI başvurusu](/tr/cli)
- [Gateway günlük kaydı](/tr/gateway/logging)
