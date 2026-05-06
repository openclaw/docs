---
read_when:
    - OpenClaw.app’te PeekabooBridge barındırma
    - Peekaboo'yu Swift Package Manager aracılığıyla entegre etme
    - PeekabooBridge protokolünü/yollarını değiştirme
    - PeekabooBridge, Codex Computer Use ve cua-driver MCP arasında karar verme
summary: macOS kullanıcı arayüzü otomasyonu için PeekabooBridge entegrasyonu
title: Ce-ee köprüsü
x-i18n:
    generated_at: "2026-05-06T09:22:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw, **PeekabooBridge**'i yerel, izin duyarlı bir UI otomasyon aracısı olarak barındırabilir. Bu, `peekaboo` CLI'nin macOS uygulamasının TCC izinlerini yeniden kullanırken UI otomasyonunu yürütmesini sağlar.

## Bu nedir (ve ne değildir)

- **Ana makine**: OpenClaw.app bir PeekabooBridge ana makinesi olarak davranabilir.
- **İstemci**: `peekaboo` CLI'yi kullanın (ayrı bir `openclaw ui ...` yüzeyi yoktur).
- **UI**: görsel katmanlar Peekaboo.app içinde kalır; OpenClaw ince bir aracı ana makinedir.

## Computer Use ile ilişkisi

OpenClaw'ın üç masaüstü denetim yolu vardır ve bunlar bilinçli olarak ayrı tutulur:

- **PeekabooBridge ana makinesi**: OpenClaw.app yerel PeekabooBridge soketini barındırabilir. `peekaboo` CLI istemci olarak kalır ve ekran görüntüleri, tıklamalar, menüler, iletişim kutuları, Dock eylemleri ve pencere yönetimi gibi Peekaboo otomasyon temel öğeleri için OpenClaw.app'in macOS izinlerini kullanır.
- **Codex Computer Use**: birlikte gelen `codex` Plugin'i Codex uygulama sunucusunu hazırlar, Codex'in `computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve ardından Codex modundaki turlarda yerel masaüstü denetim aracı çağrılarını Codex'in sahiplenmesini sağlar. OpenClaw bu eylemleri PeekabooBridge üzerinden vekillemez.
- **Doğrudan `cua-driver` MCP**: OpenClaw, TryCua'nın yukarı akış `cua-driver mcp` sunucusunu normal bir MCP sunucusu olarak kaydedebilir. Bu, aracılara Codex marketplace veya PeekabooBridge soketi üzerinden yönlendirme yapmadan CUA sürücüsünün kendi şemalarını ve pid/pencere/öğe-dizini iş akışını verir.

Geniş macOS otomasyon yüzeyini ve OpenClaw.app'in izin duyarlı köprü ana makinesini istediğinizde Peekaboo'yu kullanın. Codex modundaki bir aracının Codex'in yerel computer-use Plugin'ine dayanması gerektiğinde Codex Computer Use'ı kullanın. CUA sürücüsünü normal bir MCP sunucusu olarak OpenClaw tarafından yönetilen herhangi bir çalışma zamanına açmak istediğinizde doğrudan `cua-driver mcp` kullanın.

## Köprüyü etkinleştirme

macOS uygulamasında:

- Ayarlar → **Peekaboo Bridge'i Etkinleştir**

Etkinleştirildiğinde OpenClaw yerel bir UNIX soket sunucusu başlatır. Devre dışı bırakılırsa ana makine durdurulur ve `peekaboo` diğer kullanılabilir ana makinelere geri döner.

## İstemci keşif sırası

Peekaboo istemcileri genellikle ana makineleri şu sırayla dener:

1. Peekaboo.app (tam UX)
2. Claude.app (yüklüyse)
3. OpenClaw.app (ince aracı)

Hangi ana makinenin etkin olduğunu ve hangi soket yolunun kullanıldığını görmek için `peekaboo bridge status --verbose` kullanın. Şununla geçersiz kılabilirsiniz:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Güvenlik ve izinler

- Köprü **çağıran kod imzalarını** doğrular; TeamID'lerden oluşan bir izin listesi uygulanır (Peekaboo ana makine TeamID'si + OpenClaw uygulama TeamID'si).
- İstekler yaklaşık 10 saniye sonra zaman aşımına uğrar.
- Gerekli izinler eksikse köprü, Sistem Ayarları'nı başlatmak yerine açık bir hata mesajı döndürür.

## Anlık görüntü davranışı (otomasyon)

Anlık görüntüler bellekte saklanır ve kısa bir sürenin ardından otomatik olarak sona erer. Daha uzun saklama gerekiyorsa istemciden yeniden yakalayın.

## Sorun giderme

- `peekaboo` "bridge client is not authorized" bildirirse istemcinin düzgün şekilde imzalandığından emin olun veya ana makineyi yalnızca **hata ayıklama** modunda `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` ile çalıştırın.
- Hiçbir ana makine bulunamazsa ana makine uygulamalarından birini açın (Peekaboo.app veya OpenClaw.app) ve izinlerin verildiğini doğrulayın.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [macOS izinleri](/tr/platforms/mac/permissions)
