---
read_when:
    - Gateway günlüklerini uzaktan takip etmeniz gerekir (SSH olmadan)
    - Araçlar için JSON günlük satırları istiyorsunuz
summary: '`openclaw logs` için CLI başvurusu (RPC aracılığıyla Gateway günlüklerini takip et)'
title: Günlükler
x-i18n:
    generated_at: "2026-06-28T00:22:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3835880c0919d4c0c67bd3b371f9f8b0f396b80a9456c545ea0caa064a6361c0
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Gateway dosya günlüklerini RPC üzerinden izler (uzak modda çalışır).

İlgili:

- Günlükleme genel bakışı: [Günlükleme](/tr/logging)
- Gateway CLI: [gateway](/tr/cli/gateway)

## Seçenekler

- `--limit <n>`: döndürülecek en fazla günlük satırı sayısı (varsayılan `200`)
- `--max-bytes <n>`: günlük dosyasından okunacak en fazla bayt (varsayılan `250000`)
- `--follow`: günlük akışını izle
- `--interval <ms>`: izleme sırasında yoklama aralığı (varsayılan `1000`)
- `--json`: satırla ayrılmış JSON olayları üret
- `--plain`: biçimlendirilmiş stil olmadan düz metin çıktısı
- `--no-color`: ANSI renklerini devre dışı bırak
- `--local-time`: zaman damgalarını yerel saat diliminizde işle (varsayılan)
- `--utc`: zaman damgalarını UTC olarak işle

## Paylaşılan Gateway RPC seçenekleri

`openclaw logs` standart Gateway istemci bayraklarını da kabul eder:

- `--url <url>`: Gateway WebSocket URL'si
- `--token <token>`: Gateway token'ı
- `--timeout <ms>`: ms cinsinden zaman aşımı (varsayılan `30000`)
- `--expect-final`: Gateway çağrısı agent destekliyse son yanıtı bekle

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
- Örtük local loopback Gateway eşleştirme isterse, bağlantı sırasında kapanırsa veya `logs.tail` yanıt vermeden önce zaman aşımına uğrarsa `openclaw logs`, otomatik olarak yapılandırılmış Gateway dosya günlüğüne geri döner. Açık `--url` hedefleri bu geri dönüşü kullanmaz.
- `openclaw logs --follow`, örtük yerel Gateway RPC hatalarından sonra yapılandırılmış dosya geri dönüşlerini izlemez. Linux'ta, kullanılabiliyorsa PID'ye göre etkin kullanıcı-systemd Gateway günlüğünü kullanır ve seçilen günlük kaynağını yazdırır; aksi takdirde potansiyel olarak eski bir yan yana dosyayı izlemek yerine canlı Gateway'i yeniden denemeyi sürdürür.
- `--follow` kullanılırken geçici gateway bağlantı kesilmeleri (WebSocket kapanması, zaman aşımı, bağlantı düşmesi), üstel geri çekilme ile otomatik yeniden bağlanmayı tetikler (en fazla 8 yeniden deneme, denemeler arasında 30 sn ile sınırlı). Her yeniden denemede stderr'e bir uyarı yazdırılır ve bir yoklama başarılı olduğunda `[logs] gateway reconnected` bildirimi yazdırılır. `--json` modunda hem yeniden deneme uyarısı hem de yeniden bağlanma geçişi stderr üzerinde `{"type":"notice"}` kayıtları olarak üretilir. Kurtarılamayan hatalar (kimlik doğrulama hatası, kötü yapılandırma) yine hemen çıkar.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gateway günlükleme](/tr/gateway/logging)
