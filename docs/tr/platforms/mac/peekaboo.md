---
read_when:
    - PeekabooBridge'i OpenClaw.app içinde barındırma
    - Peekaboo'yu Swift Package Manager ile entegre etme
    - PeekabooBridge protokolünü/yollarını değiştirme
summary: macOS UI otomasyonu için PeekabooBridge entegrasyonu
title: Peekaboo bridge
x-i18n:
    generated_at: "2026-04-24T09:19:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3646f66551645733292fb183e0ff2c56697e7b24248ff7c32a0dc925431f6ba7
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

OpenClaw, yerel ve izin farkındalıklı bir UI otomasyon aracısı olarak **PeekabooBridge** barındırabilir. Bu, `peekaboo` CLI'nin macOS uygulamasının TCC izinlerini yeniden kullanırken UI otomasyonu sürmesini sağlar.

## Bunun ne olduğu (ve olmadığı)

- **Host**: OpenClaw.app, PeekabooBridge host'u olarak davranabilir.
- **İstemci**: `peekaboo` CLI kullanın (ayrı bir `openclaw ui ...` yüzeyi yoktur).
- **UI**: görsel bindirmeler Peekaboo.app içinde kalır; OpenClaw ince bir aracı host'tur.

## Bridge'i etkinleştirme

macOS uygulamasında:

- Settings → **Enable Peekaboo Bridge**

Etkinleştirildiğinde OpenClaw yerel bir UNIX socket sunucusu başlatır. Devre dışıysa host durdurulur ve `peekaboo`, mevcut diğer host'lara geri düşer.

## İstemci keşif sırası

Peekaboo istemcileri genellikle host'ları şu sırayla dener:

1. Peekaboo.app (tam UX)
2. Claude.app (kuruluysa)
3. OpenClaw.app (ince aracı)

Hangi host'un etkin olduğunu ve hangi socket yolunun kullanıldığını görmek için `peekaboo bridge status --verbose` kullanın. Şununla geçersiz kılabilirsiniz:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Güvenlik ve izinler

- Bridge, **çağıran kod imzalarını** doğrular; TeamID izin listesi uygulanır
  (Peekaboo host TeamID + OpenClaw uygulama TeamID).
- İsteklerin zaman aşımı yaklaşık 10 saniyedir.
- Gerekli izinler eksikse bridge, System Settings'i açmak yerine açık bir hata mesajı döndürür.

## Snapshot davranışı (otomasyon)

Snapshot'lar bellekte saklanır ve kısa bir süre sonra otomatik olarak sona erer.
Daha uzun saklama istiyorsanız istemciden yeniden yakalayın.

## Sorun giderme

- `peekaboo` “bridge client is not authorized” bildiriyorsa istemcinin
  düzgün imzalandığından emin olun veya host'u yalnızca **debug** modunda
  `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` ile çalıştırın.
- Hiç host bulunamazsa host uygulamalarından birini (Peekaboo.app veya OpenClaw.app)
  açın ve izinlerin verildiğini doğrulayın.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [macOS izinleri](/tr/platforms/mac/permissions)
