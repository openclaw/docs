---
read_when:
    - IPC sözleşmelerini veya menü çubuğu uygulaması IPC'sini düzenleme
summary: OpenClaw uygulaması, gateway Node taşıması ve PeekabooBridge için macOS IPC mimarisi
title: macOS IPC
x-i18n:
    generated_at: "2026-04-24T09:20:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 359a33f1a4f5854bd18355f588b4465b5627d9c8fa10a37c884995375da32cac
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# OpenClaw macOS IPC mimarisi

**Geçerli model:** yerel bir Unix socket, **Node host servisinin** **macOS uygulamasına** bağlanmasını sağlar; bu exec onayları + `system.run` içindir. Keşif/bağlantı kontrolleri için bir `openclaw-mac` debug CLI vardır; ajan eylemleri yine de Gateway WebSocket ve `node.invoke` üzerinden akar. UI otomasyonu PeekabooBridge kullanır.

## Hedefler

- TCC ile ilgili tüm işleri (bildirimler, ekran kaydı, mikrofon, konuşma, AppleScript) sahiplenen tek GUI uygulama örneği.
- Otomasyon için küçük bir yüzey: Gateway + Node komutları ve UI otomasyonu için PeekabooBridge.
- Öngörülebilir izinler: her zaman aynı imzalı bundle ID, launchd tarafından başlatılır; böylece TCC izinleri kalıcı olur.

## Nasıl çalışır

### Gateway + Node taşıması

- Uygulama Gateway'i çalıştırır (yerel mod) ve ona bir Node olarak bağlanır.
- Ajan eylemleri `node.invoke` ile gerçekleştirilir (örn. `system.run`, `system.notify`, `canvas.*`).

### Node servisi + uygulama IPC

- Headless bir Node host servisi Gateway WebSocket'e bağlanır.
- `system.run` istekleri yerel bir Unix socket üzerinden macOS uygulamasına iletilir.
- Uygulama exec işlemini UI bağlamında gerçekleştirir, gerekirse istem gösterir ve çıktıyı döndürür.

Diyagram (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (UI otomasyonu)

- UI otomasyonu, `bridge.sock` adlı ayrı bir UNIX socket ve PeekabooBridge JSON protokolünü kullanır.
- Host tercih sırası (istemci tarafı): Peekaboo.app → Claude.app → OpenClaw.app → yerel yürütme.
- Güvenlik: bridge host'ları izin verilen bir TeamID gerektirir; DEBUG-only aynı UID kaçış kapısı `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` ile korunur (Peekaboo sözleşmesi).
- Ayrıntılar için bkz.: [PeekabooBridge kullanımı](/tr/platforms/mac/peekaboo).

## Operasyonel akışlar

- Yeniden başlatma/yeniden derleme: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Mevcut örnekleri sonlandırır
  - Swift derleme + paketleme yapar
  - LaunchAgent'i yazar/bootstrap eder/kickstart eder
- Tek örnek: aynı bundle ID ile başka bir örnek çalışıyorsa uygulama erkenden çıkar.

## Sağlamlaştırma notları

- Tüm ayrıcalıklı yüzeylerde TeamID eşleşmesini zorunlu kılmayı tercih edin.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (yalnızca DEBUG), yerel geliştirme için aynı UID çağıranlarına izin verebilir.
- Tüm iletişim yalnızca yerel kalır; hiçbir ağ socket'i açığa çıkarılmaz.
- TCC istemleri yalnızca GUI uygulama bundle'ından gelir; yeniden derlemeler arasında imzalı bundle ID'yi kararlı tutun.
- IPC sağlamlaştırma: socket modu `0600`, token, peer-UID kontrolleri, HMAC challenge/response, kısa TTL.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [macOS IPC akışı (Yürütme onayları)](/tr/tools/exec-approvals-advanced#macos-ipc-flow)
