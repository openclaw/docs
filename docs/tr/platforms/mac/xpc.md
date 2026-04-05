---
read_when:
    - IPC sözleşmeleri veya menü çubuğu uygulaması IPC'si düzenlenirken
summary: OpenClaw uygulaması, gateway düğüm taşıması ve PeekabooBridge için macOS IPC mimarisi
title: macOS IPC
x-i18n:
    generated_at: "2026-04-05T14:00:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0211c334a4a59b71afb29dd7b024778172e529fa618985632d3d11d795ced92
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# OpenClaw macOS IPC mimarisi

**Geçerli model:** yerel bir Unix soketi, exec onayları ve `system.run` için **node host hizmetini** **macOS uygulamasına** bağlar. Keşif/bağlantı kontrolleri için bir `openclaw-mac` hata ayıklama CLI'si vardır; aracı eylemleri hâlâ Gateway WebSocket ve `node.invoke` üzerinden akar. UI otomasyonu PeekabooBridge kullanır.

## Hedefler

- TCC ile ilgili tüm işleri sahiplenen tek bir GUI uygulaması örneği (bildirimler, ekran kaydı, mikrofon, konuşma, AppleScript).
- Otomasyon için küçük bir yüzey: Gateway + node komutları ve UI otomasyonu için PeekabooBridge.
- Öngörülebilir izinler: her zaman aynı imzalı bundle ID, launchd tarafından başlatılır, böylece TCC izinleri kalıcı olur.

## Nasıl çalışır

### Gateway + node taşıması

- Uygulama Gateway'i çalıştırır (yerel mod) ve ona bir düğüm olarak bağlanır.
- Aracı eylemleri `node.invoke` aracılığıyla gerçekleştirilir (ör. `system.run`, `system.notify`, `canvas.*`).

### Node hizmeti + uygulama IPC'si

- Başsız bir node host hizmeti Gateway WebSocket'e bağlanır.
- `system.run` istekleri, yerel bir Unix soketi üzerinden macOS uygulamasına iletilir.
- Uygulama exec işlemini UI bağlamında gerçekleştirir, gerekirse istem gösterir ve çıktıyı döndürür.

Diyagram (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (UI otomasyonu)

- UI otomasyonu, `bridge.sock` adlı ayrı bir UNIX soketi ve PeekabooBridge JSON protokolünü kullanır.
- Host tercih sırası (istemci tarafı): Peekaboo.app → Claude.app → OpenClaw.app → yerel yürütme.
- Güvenlik: bridge host'ları izin verilen bir TeamID gerektirir; DEBUG-only same-UID escape hatch, `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` ile korunur (Peekaboo geleneği).
- Ayrıntılar için bkz.: [PeekabooBridge kullanımı](/platforms/mac/peekaboo).

## Operasyonel akışlar

- Yeniden başlatma/yeniden derleme: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Mevcut örnekleri sonlandırır
  - Swift derleme + paketleme
  - LaunchAgent'ı yazar/önyükler/başlatır
- Tek örnek: aynı bundle ID ile çalışan başka bir örnek varsa uygulama erken çıkar.

## Sertleştirme notları

- Tüm ayrıcalıklı yüzeyler için TeamID eşleşmesini zorunlu tutmayı tercih edin.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (yalnızca DEBUG) yerel geliştirme için aynı UID'ye sahip çağıranlara izin verebilir.
- Tüm iletişim yalnızca yerel kalır; hiçbir ağ soketi açığa çıkarılmaz.
- TCC istemleri yalnızca GUI uygulama bundle'ından kaynaklanır; yeniden derlemeler boyunca imzalı bundle ID'yi kararlı tutun.
- IPC sertleştirmesi: soket modu `0600`, token, peer-UID denetimleri, HMAC challenge/response, kısa TTL.
