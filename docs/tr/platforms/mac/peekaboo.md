---
read_when:
    - PeekabooBridge'i OpenClaw.app'te barındırma
    - Peekaboo'yu Swift Package Manager aracılığıyla entegre etme
    - PeekabooBridge protokolünü/yollarını değiştirme
    - PeekabooBridge, Codex Computer Use ve cua-driver MCP arasında seçim yapma
summary: macOS kullanıcı arayüzü otomasyonu için PeekabooBridge entegrasyonu
title: Peekaboo köprüsü
x-i18n:
    generated_at: "2026-07-12T12:26:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 030b5017f6a43df58e6843e8a4c37448bdaaa41ac7d7d7ab2a46cce05fa9f893
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw, **PeekabooBridge**'i yerel ve izinleri dikkate alan bir kullanıcı arayüzü otomasyon aracısı olarak barındırabilir (`steipete/Peekaboo` Swift paketi tarafından desteklenen `PeekabooBridgeHostCoordinator`). Bu, `peekaboo` CLI'ın macOS uygulamasının TCC izinlerini yeniden kullanarak kullanıcı arayüzü otomasyonunu yürütmesini sağlar.

## Bu nedir (ve ne değildir)

- **Ana makine**: OpenClaw.app, PeekabooBridge ana makinesi olarak çalışabilir.
- **İstemci**: `peekaboo` CLI (ayrı bir `openclaw ui ...` arayüzü yoktur).
- **Kullanıcı arayüzü**: Görsel katmanlar Peekaboo.app içinde kalır; OpenClaw, ince bir aracı ana makinedir.

## Diğer masaüstü denetim yollarıyla ilişkisi

OpenClaw, kasıtlı olarak birbirinden ayrı tutulan dört masaüstü denetim yoluna sahiptir:

- **PeekabooBridge ana makinesi**: OpenClaw.app, yerel PeekabooBridge soketini barındırır. `peekaboo` CLI istemcidir ve ekran görüntüleri, tıklamalar, menüler, iletişim kutuları, Dock işlemleri ve pencere yönetimi için OpenClaw.app'in macOS izinlarını kullanır.
- **Aracı tarafından yönlendirilen bilgisayar kullanımı (`computer.act`)**: Gateway aracısının yerleşik `computer` aracı, `screen.snapshot` aracılığıyla ekran görüntüleri yakalar ve işaretçi ile klavyeyi tehlikeli `computer.act` Node komutu üzerinden denetler. Bir macOS Node, PeekabooBridge soketinden veya `peekaboo` CLI'dan geçmeden, bu köprünün sunduğu gömülü Peekaboo otomasyon hizmetlerini ve sınırlı CoreGraphics temel işlevlerini kullanarak `computer.act` komutunu işlem içinde gerçekleştirir. Bkz. [Bilgisayar kullanımı](/nodes/computer-use).
- **Codex Bilgisayar Kullanımı**: Paketle gelen `codex` Plugin'i, Codex'in `computer-use` MCP Plugin'ini (`extensions/codex/src/app-server/computer-use.ts`) denetler ve kurabilir; ardından Codex modu dönüşleri sırasında yerel masaüstü denetim aracı çağrılarının yönetimini Codex'e bırakır. OpenClaw bu işlemlere PeekabooBridge üzerinden aracılık etmez.
- **Doğrudan `cua-driver` MCP**: OpenClaw, TryCua'nın üst kaynak `cua-driver mcp` sunucusunu normal bir MCP sunucusu olarak kaydedebilir; böylece aracılara Codex pazar yeri veya PeekabooBridge soketi üzerinden yönlendirme yapmadan CUA sürücüsünün kendi şemalarını ve pid/pencere/öğe dizini iş akışını sunar.

OpenClaw.app'in izinleri dikkate alan köprü ana makinesi üzerinden geniş macOS otomasyon yüzeyi için Peekaboo'yu kullanın. Gateway aracısının, herhangi bir görüntü modelinin yönlendirebileceği tek biçimli bir `computer.act` Node komutuyla masaüstünü görmesi ve denetlemesi gerektiğinde aracı tarafından yönlendirilen bilgisayar kullanımını tercih edin. Codex modundaki bir aracının Codex'in yerel Plugin'ine dayanması gerektiğinde Codex Bilgisayar Kullanımı'nı tercih edin. CUA sürücüsünü, OpenClaw tarafından yönetilen herhangi bir çalışma zamanına normal bir MCP sunucusu olarak sunmak için doğrudan `cua-driver mcp` kullanın.

## Köprüyü etkinleştirme

macOS uygulamasında: **Settings -> Enable Peekaboo Bridge**.

Etkinleştirildiğinde OpenClaw, `~/Library/Application Support/OpenClaw/<socket-name>` konumunda yerel bir UNIX soket sunucusu başlatır. Devre dışı bırakıldığında ana makine durur ve `peekaboo` kullanılabilir diğer ana makinelere geri döner. Koordinatör ayrıca eski `peekaboo` kurulumları için geçerli soketi işaret eden eski soket sembolik bağlantılarını da (Application Support altında `clawdbot`, `clawdis`, `moltbot`) korur.

## İstemci keşif sırası

Peekaboo istemcileri genellikle ana makineleri şu sırayla dener:

1. Peekaboo.app (tam kullanıcı deneyimi)
2. Claude.app (kuruluysa)
3. OpenClaw.app (ince aracı)

Hangi ana makinenin etkin olduğunu ve hangi soket yolunun kullanıldığını görmek için `peekaboo bridge status --verbose` komutunu kullanın. Şununla geçersiz kılın:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Güvenlik ve izinler

- Köprü, **çağıranın kod imzalarını** doğrular; bir TeamID izin listesi uygulanır (Peekaboo ana makinesinin TeamID'si ile çalışan uygulamanın kendi TeamID'si).
- Erişilebilirlik için genel bir `node` çalışma zamanı yerine imzalı köprü/uygulama kimliğini tercih edin. `node` için Erişilebilirlik izni verilmesi, söz konusu Node çalıştırılabilir dosyası tarafından başlatılan tüm paketlerin grafik kullanıcı arayüzü otomasyon erişimini devralmasına olanak tanır; bkz. [macOS izinleri](/tr/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- İstekler 10 saniye sonra zaman aşımına uğrar (`requestTimeoutSec: 10`).
- Gerekli izinler eksikse köprü, System Settings'i başlatmak yerine açık bir hata iletisi döndürür.

## Anlık görüntü davranışı (otomasyon)

Anlık görüntüler, 10 dakikalık geçerlilik süresi ve 50 anlık görüntü sınırıyla bellekte saklanır (`InMemorySnapshotManager`); yapıtlar temizleme sırasında silinmez. Daha uzun süre saklamanız gerekiyorsa istemciden yeniden yakalayın.

## Sorun giderme

- `peekaboo`, "bridge client is not authorized" bildirirse istemcinin doğru şekilde imzalandığından emin olun veya ana makineyi yalnızca **hata ayıklama** modunda `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` ile çalıştırın.
- Hiçbir ana makine bulunamazsa ana makine uygulamalarından birini (Peekaboo.app veya OpenClaw.app) açın ve izinlerin verildiğini doğrulayın.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [macOS izinleri](/tr/platforms/mac/permissions)
