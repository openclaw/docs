---
read_when:
    - PeekabooBridge'i OpenClaw.app'te barındırma
    - Swift Package Manager ile Peekaboo Entegrasyonu
    - PeekabooBridge protokolünü/yollarını değiştirme
    - PeekabooBridge, Codex Computer Use ve cua-driver MCP arasında karar verme
summary: macOS kullanıcı arayüzü otomasyonu için PeekabooBridge entegrasyonu
title: Ce-ee köprüsü
x-i18n:
    generated_at: "2026-04-30T09:33:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92effdd6cfe4002fff2b8cd1092999f837e93694acf110eaebd30648b0a6946e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw, **PeekabooBridge**'i yerel, izinlere duyarlı bir UI otomasyon
aracısı olarak barındırabilir. Bu, `peekaboo` CLI'nin macOS uygulamasının TCC
izinlerini yeniden kullanırken UI otomasyonunu yürütmesini sağlar.

## Bu nedir (ve ne değildir)

- **Host**: OpenClaw.app bir PeekabooBridge host'u olarak davranabilir.
- **Client**: `peekaboo` CLI'yi kullanın (ayrı bir `openclaw ui ...` yüzeyi yoktur).
- **UI**: görsel katmanlar Peekaboo.app içinde kalır; OpenClaw ince bir aracı host'tur.

## Computer Use ile ilişkisi

OpenClaw'ın üç masaüstü denetimi yolu vardır ve bunlar bilinçli olarak ayrı tutulur:

- **PeekabooBridge host'u**: OpenClaw.app yerel PeekabooBridge soketini barındırabilir.
  `peekaboo` CLI client olarak kalır ve ekran görüntüleri, tıklamalar,
  menüler, iletişim kutuları, Dock eylemleri ve pencere yönetimi gibi Peekaboo
  otomasyon ilkelleri için OpenClaw.app'in macOS izinlerini kullanır.
- **Codex Computer Use**: paketle gelen `codex` Plugin'i Codex app-server'ı hazırlar,
  Codex'in `computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve
  ardından Codex modu dönüşlerinde yerel masaüstü denetimi araç çağrılarını
  Codex'in üstlenmesini sağlar. OpenClaw bu eylemleri PeekabooBridge üzerinden
  proxy'lemez.
- **Doğrudan `cua-driver` MCP**: OpenClaw, TryCua'nın upstream
  `cua-driver mcp` sunucusunu normal bir MCP sunucusu olarak kaydedebilir. Bu,
  aracıların Codex marketplace veya PeekabooBridge soketi üzerinden yönlendirme
  yapmadan CUA driver'ın kendi şemalarına ve pid/pencere/öğe dizini iş akışına
  erişmesini sağlar.

Geniş macOS otomasyon yüzeyini ve OpenClaw.app'in izinlere duyarlı bridge host'unu
istediğinizde Peekaboo kullanın. Bir Codex modu aracısının Codex'in yerel
computer-use Plugin'ine dayanması gerektiğinde Codex Computer Use kullanın.
CUA driver'ı herhangi bir OpenClaw tarafından yönetilen çalışma zamanına normal
bir MCP sunucusu olarak açmak istediğinizde doğrudan `cua-driver mcp` kullanın.

## Bridge'i etkinleştirme

macOS uygulamasında:

- Ayarlar → **Peekaboo Bridge'i Etkinleştir**

Etkinleştirildiğinde OpenClaw yerel bir UNIX soket sunucusu başlatır. Devre dışı
bırakılırsa host durdurulur ve `peekaboo` diğer kullanılabilir host'lara geri döner.

## Client keşif sırası

Peekaboo client'ları genellikle host'ları şu sırayla dener:

1. Peekaboo.app (tam UX)
2. Claude.app (yüklüyse)
3. OpenClaw.app (ince aracı)

Hangi host'un etkin olduğunu ve hangi soket yolunun kullanıldığını görmek için
`peekaboo bridge status --verbose` kullanın. Şununla geçersiz kılabilirsiniz:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Güvenlik ve izinler

- Bridge **çağıran kod imzalarını** doğrular; TeamID allowlist'i uygulanır
  (Peekaboo host TeamID + OpenClaw app TeamID).
- İstekler ~10 saniye sonra zaman aşımına uğrar.
- Gerekli izinler eksikse bridge, System Settings'i başlatmak yerine açık bir
  hata iletisi döndürür.

## Snapshot davranışı (otomasyon)

Snapshot'lar bellekte saklanır ve kısa bir süre sonra otomatik olarak sona erer.
Daha uzun saklama gerekiyorsa client'tan yeniden yakalayın.

## Sorun giderme

- `peekaboo` “bridge client is not authorized” bildirirse client'ın düzgün
  imzalandığından emin olun veya host'u yalnızca **debug** modunda
  `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` ile çalıştırın.
- Hiç host bulunamazsa host uygulamalarından birini açın (Peekaboo.app veya OpenClaw.app)
  ve izinlerin verildiğini doğrulayın.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [macOS izinleri](/tr/platforms/mac/permissions)
