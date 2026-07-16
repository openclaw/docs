---
read_when:
    - PeekabooBridge'i OpenClaw.app'te Barındırma
    - Peekaboo'yu Swift Package Manager aracılığıyla entegre etme
    - PeekabooBridge protokolünü/yollarını değiştirme
    - PeekabooBridge, Codex Computer Use ve cua-driver MCP arasında seçim yapma
summary: macOS kullanıcı arayüzü otomasyonu için PeekabooBridge entegrasyonu
title: Peekaboo köprüsü
x-i18n:
    generated_at: "2026-07-16T17:19:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 24d4187b2f5c5f11f44a24e25b350adaa3b068f24dce640ec695d52eb61f8e9a
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw, **PeekabooBridge**'i yerel, izinleri dikkate alan bir kullanıcı arayüzü otomasyon aracısı olarak barındırabilir (`PeekabooBridgeHostCoordinator`, `steipete/Peekaboo` Swift paketi tarafından desteklenir). Bu, `peekaboo` CLI'ın macOS uygulamasının TCC izinlerini yeniden kullanarak kullanıcı arayüzü otomasyonunu yürütmesini sağlar.

## Bu nedir (ve ne değildir)

- **Ana makine**: OpenClaw.app, PeekabooBridge ana makinesi olarak çalışabilir.
- **İstemci**: `peekaboo` CLI (ayrı bir `openclaw ui ...` yüzeyi yoktur).
- **Kullanıcı arayüzü**: görsel katmanlar Peekaboo.app içinde kalır; OpenClaw, ince bir aracı ana makinedir.

## Diğer masaüstü denetim yollarıyla ilişkisi

OpenClaw, kasıtlı olarak birbirinden ayrı tutulan dört masaüstü denetim yoluna sahiptir:

- **PeekabooBridge ana makinesi**: OpenClaw.app, yerel PeekabooBridge soketini barındırır. `peekaboo` CLI istemcidir ve ekran görüntüleri, tıklamalar, menüler, iletişim kutuları, Dock eylemleri ve pencere yönetimi için OpenClaw.app'in macOS izinlerini kullanır.
- **Aracı tarafından yürütülen bilgisayar kullanımı (`computer.act`)**: Gateway aracısının yerleşik `computer` aracı, `screen.snapshot` üzerinden ekran görüntüleri yakalar ve tehlikeli `computer.act` Node komutu aracılığıyla işaretçiyi ve klavyeyi denetler. Bir macOS Node'u, PeekabooBridge soketinden veya `peekaboo` CLI'dan geçmeden, bu köprünün sunduğu gömülü Peekaboo otomasyon hizmetlerini ve dar kapsamlı CoreGraphics temel öğelerini kullanarak `computer.act` işlemini süreç içinde gerçekleştirir. Bkz. [Bilgisayar kullanımı](/tr/nodes/computer-use).
- **Codex Bilgisayar Kullanımı**: paketle gelen `codex` Plugin, Codex'in `computer-use` MCP Plugin'ini (`extensions/codex/src/app-server/computer-use.ts`) denetler ve yükleyebilir; ardından Codex modu dönüşlerinde yerel masaüstü denetim aracı çağrılarının Codex tarafından yönetilmesini sağlar. OpenClaw bu eylemlere PeekabooBridge üzerinden aracılık etmez.
- **Doğrudan `cua-driver` MCP**: OpenClaw, TryCua'nın üst akış `cua-driver mcp` sunucusunu normal bir MCP sunucusu olarak kaydedebilir; böylece aracılara Codex pazar yeri veya PeekabooBridge soketi üzerinden yönlendirme yapmadan CUA sürücüsünün kendi şemalarını ve pid/pencere/öğe dizini iş akışını sağlar.

OpenClaw.app'in izinleri dikkate alan köprü ana makinesi üzerinden geniş macOS otomasyon yüzeyi için Peekaboo'yu kullanın. Gateway aracısının, herhangi bir görüntü modelinin kullanabileceği tek tip bir `computer.act` Node komutu üzerinden masaüstünü görmesi ve denetlemesi gerektiğinde aracı tarafından yürütülen bilgisayar kullanımını kullanın. Codex modundaki bir aracının Codex'in yerel Plugin'ine dayanması gerektiğinde Codex Bilgisayar Kullanımı'nı kullanın. CUA sürücüsünü, OpenClaw tarafından yönetilen herhangi bir çalışma zamanına normal bir MCP sunucusu olarak sunmak için doğrudan `cua-driver mcp` kullanın.

## Köprüyü etkinleştirme

macOS uygulamasında: **Settings -> Enable Peekaboo Bridge**. Her ikisi de yerel kullanıcı arayüzü otomasyonuna izin verdiğinden, bu anahtarın kullanılabilmesi için **Allow Computer Control** açık olmalıdır; Computer Control kapalıyken anahtar devre dışıdır ve ana makine çalışmaz. Peekaboo'yu Computer Control olmadan kullanmak için bunun yerine Peekaboo'nun kendi Mac uygulamasını ana makine olarak çalıştırın.

Etkinleştirildiğinde (ve Computer Control açıkken) OpenClaw, `~/Library/Application Support/OpenClaw/<socket-name>` konumunda yerel bir UNIX soket sunucusu başlatır. Devre dışı bırakılırsa ana makine durur ve `peekaboo` kullanılabilir diğer ana makinelere geri döner. Koordinatör ayrıca eski `peekaboo` kurulumları için Application Support altındaki eski soket sembolik bağlantılarını (`clawdbot`, `clawdis`, `moltbot`) geçerli sokete işaret edecek şekilde korur.

## İstemci keşif sırası

Peekaboo istemcileri genellikle ana makineleri şu sırayla dener:

1. Peekaboo.app (tam kullanıcı deneyimi)
2. Claude.app (yüklüyse)
3. OpenClaw.app (ince aracı)

Hangi ana makinenin etkin olduğunu ve hangi soket yolunun kullanıldığını görmek için `peekaboo bridge status --verbose` kullanın. Şununla geçersiz kılın:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Güvenlik ve izinler

- Köprü, **çağıran kodun imzalarını** doğrular; bir TeamID izin listesi uygulanır (Peekaboo ana makinesinin TeamID'si ve çalışan uygulamanın kendi TeamID'si).
- Erişilebilirlik için genel bir `node` çalışma zamanı yerine imzalı köprü/uygulama kimliğini tercih edin. `node` için Erişilebilirlik izni vermek, bu Node yürütülebilir dosyası tarafından başlatılan tüm paketlerin grafik kullanıcı arayüzü otomasyonu erişimini devralmasına olanak tanır; bkz. [macOS izinleri](/tr/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- İstekler 10 saniye sonra zaman aşımına uğrar (`requestTimeoutSec: 10`).
- Gerekli izinler eksikse köprü, System Settings'i başlatmak yerine açık bir hata mesajı döndürür.

## Anlık görüntü davranışı (otomasyon)

Anlık görüntüler, 10 dakikalık geçerlilik süresi ve 50 anlık görüntü sınırıyla bellekte saklanır (`InMemorySnapshotManager`); yapıtlar temizleme sırasında silinmez. Daha uzun süre saklamanız gerekiyorsa istemciden yeniden yakalayın.

## Sorun giderme

- `peekaboo` "bridge client is not authorized" bildirirse istemcinin düzgün şekilde imzalandığından emin olun veya yalnızca **debug** modunda ana makineyi `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` ile çalıştırın.
- Hiçbir ana makine bulunamazsa ana makine uygulamalarından birini (Peekaboo.app veya OpenClaw.app) açın ve izinlerin verildiğini doğrulayın.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [macOS izinleri](/tr/platforms/mac/permissions)
