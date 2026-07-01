---
read_when:
    - Gateway günlüklerini uzaktan takip etmeniz gerekir (SSH olmadan)
    - Araçlar için JSON günlük satırları istiyorsunuz
summary: '`openclaw logs` için CLI referansı (RPC üzerinden Gateway günlüklerini takip etme)'
title: Günlükler
x-i18n:
    generated_at: "2026-07-01T15:30:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c2cc14132d46b60fd323b40dad3c524b6eef40b940bb98d4b445d03782e0ea07
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Gateway dosya günlüklerini RPC üzerinden izleyin (uzak modda çalışır).

İlgili:

- Günlük kaydı genel bakışı: [Günlük kaydı](/tr/logging)
- Gateway CLI: [gateway](/tr/cli/gateway)

## Seçenekler

- `--limit <n>`: döndürülecek en fazla günlük satırı sayısı (varsayılan `200`)
- `--max-bytes <n>`: günlük dosyasından okunacak en fazla bayt (varsayılan `250000`)
- `--follow`: günlük akışını takip et
- `--interval <ms>`: takip ederken yoklama aralığı (varsayılan `1000`)
- `--json`: satırla ayrılmış JSON olayları üret
- `--plain`: stillendirilmiş biçimlendirme olmadan düz metin çıktısı
- `--no-color`: ANSI renklerini devre dışı bırak
- `--local-time`: zaman damgalarını yerel saat diliminizde işle (varsayılan)
- `--utc`: zaman damgalarını UTC olarak işle

## Paylaşılan Gateway RPC seçenekleri

`openclaw logs` standart Gateway istemci bayraklarını da kabul eder:

- `--url <url>`: Gateway WebSocket URL'si
- `--token <token>`: Gateway token'ı
- `--timeout <ms>`: ms cinsinden zaman aşımı (varsayılan `30000`)
- `--expect-final`: Gateway çağrısı agent destekliyse nihai yanıtı bekle

`--url` ilettiğinizde CLI, yapılandırma veya ortam kimlik bilgilerini otomatik olarak uygulamaz. Hedef Gateway kimlik doğrulaması gerektiriyorsa `--token` değerini açıkça ekleyin.

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
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Notlar

- Zaman damgaları varsayılan olarak yerel saat diliminizde işlenir. UTC çıktısı için `--utc` kullanın.
- Örtük local loopback Gateway eşleştirme isterse, bağlantı sırasında kapanırsa veya `logs.tail` yanıt vermeden önce zaman aşımına uğrarsa, `openclaw logs` otomatik olarak yapılandırılmış Gateway dosya günlüğüne geri döner. Açık `--url` hedefleri bu geri dönüşü kullanmaz.
- `openclaw logs --follow`, örtük yerel Gateway RPC hatalarından sonra yapılandırılmış dosya geri dönüşlerini takip etmez. Linux'ta, kullanılabilir olduğunda PID'ye göre etkin kullanıcı-systemd Gateway günlüğünü kullanır ve seçilen günlük kaynağını yazdırır; aksi halde olası eski bir yan yana dosyayı izlemek yerine canlı Gateway'i yeniden denemeyi sürdürür.
- `--follow` kullanılırken geçici gateway bağlantı kesilmeleri (WebSocket kapanması, zaman aşımı, bağlantı kopması) üstel geri çekilme ile otomatik yeniden bağlantıyı tetikler (en fazla 8 yeniden deneme, denemeler arası en çok 30 sn). Her yeniden denemede stderr'e bir uyarı yazdırılır ve bir yoklama başarılı olduğunda `[logs] gateway reconnected` bildirimi yazdırılır. `--json` modunda hem yeniden deneme uyarısı hem de yeniden bağlantı geçişi stderr'de `{"type":"notice"}` kayıtları olarak üretilir. Kurtarılamaz hatalar (kimlik doğrulama hatası, hatalı yapılandırma) yine de hemen çıkar.
- `--follow --json` modunda günlük kaynağı geçişleri `{"type":"meta"}` kayıtları olarak üretilir. Tüketiciler imleçleri her `sourceKind` için ayrı izlemelidir: bir akış Gateway dosya çıktısından (`sourceKind: "file"`) yerel günlük geri dönüşüne (`sourceKind: "journal"`, `localFallback: true`, `service.pid`/`service.unit` ile) geçebilir ve kurtarma sonrasında yeniden Gateway dosya çıktısına dönebilir. Tüm takip oturumu boyunca tek bir kararlı kaynak veya imleç varsaymayın ve kurtarma Gateway dosya imlecini yeniden oynattığında çakışan satırları tolere edin.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway günlük kaydı](/tr/gateway/logging)
