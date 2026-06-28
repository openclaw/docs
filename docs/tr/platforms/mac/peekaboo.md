---
read_when:
    - OpenClaw.app’te PeekabooBridge’i Barındırma
    - Peekaboo'yu Swift Package Manager aracılığıyla entegre etme
    - PeekabooBridge protokolünü/yollarını değiştirme
    - PeekabooBridge, Codex Computer Use ve cua-driver MCP arasında karar verme
summary: macOS kullanıcı arayüzü otomasyonu için PeekabooBridge entegrasyonu
title: Peekaboo köprüsü
x-i18n:
    generated_at: "2026-06-28T00:49:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw, **PeekabooBridge**'i yerel, izin farkındalığına sahip bir UI otomasyonu
aracısı olarak barındırabilir. Bu, `peekaboo` CLI'nin macOS uygulamasının TCC
izinlerini yeniden kullanırken UI otomasyonunu yürütmesini sağlar.

## Bunun ne olduğu (ve ne olmadığı)

- **Ana bilgisayar**: OpenClaw.app bir PeekabooBridge ana bilgisayarı olarak davranabilir.
- **İstemci**: `peekaboo` CLI'yi kullanın (ayrı bir `openclaw ui ...` yüzeyi yoktur).
- **UI**: görsel katmanlar Peekaboo.app içinde kalır; OpenClaw ince bir aracı ana bilgisayardır.

## Computer Use ile ilişkisi

OpenClaw'ın üç masaüstü denetim yolu vardır ve bunlar bilerek ayrı tutulur:

- **PeekabooBridge ana bilgisayarı**: OpenClaw.app yerel PeekabooBridge soketini barındırabilir.
  `peekaboo` CLI istemci olarak kalır ve ekran görüntüleri, tıklamalar, menüler,
  iletişim kutuları, Dock eylemleri ve pencere yönetimi gibi Peekaboo otomasyon
  ilkelleri için OpenClaw.app'in macOS izinlerini kullanır.
- **Codex Computer Use**: paketle gelen `codex` Plugin'i Codex uygulama sunucusunu hazırlar,
  Codex'in `computer-use` MCP sunucusunun kullanılabilir olduğunu doğrular ve ardından
  Codex modu dönüşleri sırasında yerel masaüstü denetim aracı çağrılarının Codex'e ait
  olmasını sağlar. OpenClaw bu eylemleri PeekabooBridge üzerinden vekillemez.
- **Doğrudan `cua-driver` MCP**: OpenClaw, TryCua'nın upstream
  `cua-driver mcp` sunucusunu normal bir MCP sunucusu olarak kaydedebilir. Bu, ajanlara
  Codex marketplace veya PeekabooBridge soketi üzerinden yönlendirme yapmadan CUA
  sürücüsünün kendi şemalarını ve pid/pencere/öğe dizini iş akışını sağlar.

Geniş macOS otomasyon yüzeyini ve OpenClaw.app'in izin farkındalığına sahip köprü
ana bilgisayarını istediğinizde Peekaboo'yu kullanın. Codex modu ajanının Codex'in
yerel computer-use Plugin'ine dayanması gerektiğinde Codex Computer Use'ı kullanın.
CUA sürücüsünün, OpenClaw tarafından yönetilen herhangi bir çalışma zamanı ortamına
normal bir MCP sunucusu olarak sunulmasını istediğinizde doğrudan `cua-driver mcp`
kullanın.

## Köprüyü etkinleştirme

macOS uygulamasında:

- Ayarlar → **Peekaboo Bridge'i Etkinleştir**

Etkinleştirildiğinde OpenClaw yerel bir UNIX soket sunucusu başlatır. Devre dışı
bırakılırsa ana bilgisayar durdurulur ve `peekaboo` diğer kullanılabilir ana
bilgisayarlara geri döner.

## İstemci keşif sırası

Peekaboo istemcileri genellikle ana bilgisayarları şu sırayla dener:

1. Peekaboo.app (tam UX)
2. Claude.app (kuruluysa)
3. OpenClaw.app (ince aracı)

Hangi ana bilgisayarın etkin olduğunu ve hangi soket yolunun kullanıldığını görmek
için `peekaboo bridge status --verbose` kullanın. Şununla geçersiz kılabilirsiniz:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Güvenlik ve izinler

- Köprü **çağıran kod imzalarını** doğrular; TeamID'lerden oluşan bir izin listesi
  uygulanır (Peekaboo ana bilgisayar TeamID'si + OpenClaw uygulama TeamID'si).
- Accessibility için genel bir `node` çalışma zamanı yerine imzalı köprü/uygulama
  kimliğini tercih edin. `node`'a Accessibility izni vermek, bu Node yürütülebiliri
  tarafından başlatılan herhangi bir paketin GUI otomasyonu erişimini devralmasına
  izin verir; bkz.
  [macOS izinleri](/tr/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- İstekler yaklaşık 10 saniye sonra zaman aşımına uğrar.
- Gerekli izinler eksikse köprü, Sistem Ayarları'nı başlatmak yerine açık bir hata
  mesajı döndürür.

## Anlık görüntü davranışı (otomasyon)

Anlık görüntüler bellekte saklanır ve kısa bir sürenin ardından otomatik olarak sona
erer. Daha uzun saklama gerekiyorsa istemciden yeniden yakalayın.

## Sorun giderme

- `peekaboo` "bridge client is not authorized" bildirirse istemcinin düzgün şekilde
  imzalandığından emin olun veya ana bilgisayarı yalnızca **hata ayıklama** modunda
  `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` ile çalıştırın.
- Ana bilgisayar bulunamazsa ana bilgisayar uygulamalarından birini (Peekaboo.app veya OpenClaw.app)
  açın ve izinlerin verildiğini doğrulayın.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [macOS izinleri](/tr/platforms/mac/permissions)
