---
read_when:
    - IPC sözleşmelerini veya menü çubuğu uygulaması IPC'sini düzenleme
summary: OpenClaw uygulaması, Gateway node aktarımı ve PeekabooBridge için macOS IPC mimarisi
title: macOS süreçler arası iletişimi
x-i18n:
    generated_at: "2026-06-28T00:49:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS IPC mimarisi

**Geçerli model:** yerel bir Unix soketi, exec onayları + `system.run` için **node ana makine hizmetini** **macOS uygulamasına** bağlar. Keşif/bağlantı kontrolleri için bir `openclaw-mac` hata ayıklama CLI'ı vardır; agent eylemleri hâlâ Gateway WebSocket ve `node.invoke` üzerinden akar. UI otomasyonu PeekabooBridge kullanır.

## Hedefler

- TCC ile yüz yüze gelen tüm işleri (bildirimler, ekran kaydı, mikrofon, konuşma, AppleScript) sahiplenen tek bir GUI uygulaması örneği.
- Otomasyon için küçük bir yüzey: Gateway + node komutları, ayrıca UI otomasyonu için PeekabooBridge.
- Öngörülebilir izinler: her zaman aynı imzalı bundle ID, launchd tarafından başlatılır; böylece TCC izinleri kalıcı olur.

## Nasıl çalışır

### Gateway + node taşıması

- Uygulama Gateway'i (yerel mod) çalıştırır ve ona bir node olarak bağlanır.
- Agent eylemleri `node.invoke` üzerinden gerçekleştirilir (örn. `system.run`, `system.notify`, `canvas.*`).
- Yaygın Mac node komutları arasında `canvas.*`, `camera.snap`, `camera.clip`,
  `screen.snapshot`, `screen.record`, `system.run` ve `system.notify` bulunur.
- Node, agent'ların ekran,
  kamera, mikrofon, konuşma, otomasyon veya erişilebilirlik erişiminin kullanılabilir olup olmadığını görebilmesi için bir `permissions` haritası raporlar.

### Node hizmeti + uygulama IPC

- Başsız bir node ana makine hizmeti Gateway WebSocket'e bağlanır.
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
- Ana makine tercih sırası (istemci tarafı): Peekaboo.app → Claude.app → OpenClaw.app → yerel yürütme.
- Güvenlik: bridge ana makineleri izin verilen bir TeamID gerektirir; yalnızca DEBUG için aynı UID kaçış yolu `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` ile korunur (Peekaboo kuralı).
- Ayrıntılar için bkz.: [PeekabooBridge kullanımı](/tr/platforms/mac/peekaboo).

## Operasyonel akışlar

- Yeniden başlat/yeniden derle: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Mevcut örnekleri sonlandırır
  - Swift derlemesi + paketleme
  - LaunchAgent'ı yazar/önyükler/kickstart eder
- Tek örnek: aynı bundle ID ile çalışan başka bir örnek varsa uygulama erken çıkar.

## Sağlamlaştırma notları

- Tüm ayrıcalıklı yüzeyler için TeamID eşleşmesi gerektirmeyi tercih edin.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (yalnızca DEBUG) yerel geliştirme için aynı UID çağırıcılarına izin verebilir.
- Tüm iletişim yalnızca yerel kalır; hiçbir ağ soketi dışa açılmaz.
- TCC istemleri yalnızca GUI uygulama bundle'ından kaynaklanır; imzalı bundle ID'yi yeniden derlemeler boyunca sabit tutun.
- IPC sağlamlaştırma: soket modu `0600`, token, eş UID kontrolleri, HMAC challenge/response, kısa TTL.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [macOS IPC akışı (Exec onayları)](/tr/tools/exec-approvals-advanced#macos-ipc-flow)
