---
read_when:
    - IPC sözleşmelerini veya menü çubuğu uygulamasının IPC'sini düzenleme
summary: OpenClaw uygulaması, Gateway Node aktarımı ve PeekabooBridge için macOS IPC mimarisi
title: macOS IPC
x-i18n:
    generated_at: "2026-07-12T12:29:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS IPC mimarisi

Yerel bir Unix soketi, çalıştırma onayları ve `system.run` için Node ana makine hizmetini macOS uygulamasına bağlar. Keşif/bağlantı denetimleri için bir `openclaw-mac` hata ayıklama CLI'ı (`apps/macos/Sources/OpenClawMacCLI`) bulunur; ajan eylemleri yine Gateway WebSocket ve `node.invoke` üzerinden gerçekleşir. Node destekli `computer.act` yolu, gömülü Peekaboo otomasyonunu işlem içinde çalıştırır; bağımsız Peekaboo istemcileri PeekabooBridge kullanır.

## Hedefler

- TCC ile etkileşime giren tüm işleri (bildirimler, ekran kaydı, mikrofon, konuşma, AppleScript) yöneten tek bir GUI uygulaması örneği.
- Otomasyon için küçük bir yüzey: Gateway + Node komutları, işlem içi `computer.act` ve bağımsız kullanıcı arayüzü otomasyon istemcileri için PeekabooBridge.
- Öngörülebilir izinler: TCC izinlerinin kalıcı olması için her zaman launchd tarafından başlatılan aynı imzalı paket kimliği.

## Nasıl çalışır?

### Gateway + Node aktarımı

- Uygulama, Gateway'i (yerel modda) çalıştırır ve ona bir Node olarak bağlanır.
- Ajan eylemleri `node.invoke` aracılığıyla gerçekleştirilir (ör. `system.run`, `system.notify`, `canvas.*`).
- Node komutları `canvas.*`, `camera.snap`, `camera.clip`, `screen.snapshot`, `screen.record`, `computer.act`, `system.run` ve `system.notify` öğelerini içerir.
- Node, ajanların ekran, kamera, mikrofon, konuşma, otomasyon veya erişilebilirlik erişiminin kullanılabilir olup olmadığını görebilmesi için bir `permissions` eşlemesi bildirir.

### Node hizmeti + uygulama IPC'si

- Başsız bir Node ana makine hizmeti, Gateway WebSocket'e bağlanır.
- `system.run` istekleri yerel bir Unix soketi (`ExecApprovalsSocket.swift`) üzerinden macOS uygulamasına iletilir.
- Uygulama, çalıştırma işlemini kullanıcı arayüzü bağlamında gerçekleştirir, gerekirse kullanıcıdan onay ister ve çıktıyı döndürür.

Diyagram (SCI):

```text
Ajan -> Gateway -> Node Hizmeti (WS)
                      |  IPC (UDS + belirteç + HMAC + TTL)
                      v
                  Mac Uygulaması (UI + TCC + system.run)
```

### PeekabooBridge (kullanıcı arayüzü otomasyonu)

- Yerleşik ajan `computer` aracı bu soketi **kullanmaz**. Eşleştirilmiş bir macOS Node'u, gömülü Peekaboo hizmetleriyle uygulama işlemi içinde `computer.act` işlemini gerçekleştirir.
- Kullanıcı arayüzü otomasyonu, ayrı bir UNIX soketi (`~/Library/Application Support/OpenClaw/<socket>`) ve PeekabooBridge JSON protokolünü kullanır.
- Ana makine tercih sırası (istemci tarafında): Peekaboo.app -> Claude.app -> OpenClaw.app -> yerel çalıştırma.
- Güvenlik: köprü ana makineleri izin verilenler listesindeki bir TeamID'yi zorunlu kılar (paketle gelen `PeekabooBridgeHostCoordinator`, sabit bir ekibin yanı sıra uygulamanın kendi imzalama ekibine de izin verir); yalnızca DEBUG için sunulan aynı UID'li kaçış mekanizması `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` ile korunur (Peekaboo kuralı).
- Ayrıntılar için bkz. [PeekabooBridge kullanımı](/tr/platforms/mac/peekaboo).

## İşletim akışları

- Yeniden başlatma/derleme: `scripts/restart-mac.sh` mevcut örnekleri sonlandırır, Swift aracılığıyla yeniden derler, yeniden paketler ve tekrar başlatır. Kullanılabilir bir imzalama kimliğini otomatik olarak algılar ve bulunamazsa `--no-sign` seçeneğine geri döner; imzalamayı zorunlu kılmak için `--sign` seçeneğini (anahtar yoksa başarısız olur), imzasız yolu zorlamak içinse `--no-sign` seçeneğini kullanın. Ortamda ayarlanmış `SIGN_IDENTITY`, imzalı yolda kaldırılır; böylece `scripts/codesign-mac-app.sh` betiğinin kendi kimlik otomatik algılama mekanizması sertifikayı seçer.
- Tek örnek: uygulama, yinelenen bir paket kimliği için `NSWorkspace.runningApplications` değerini denetler ve birden fazla örnek bulunursa çıkar (`MenuBar.swift` içindeki `isDuplicateInstance()`).

## Güçlendirme notları

- Tüm ayrıcalıklı yüzeyler için TeamID eşleşmesini zorunlu kılmayı tercih edin.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (yalnızca DEBUG), yerel geliştirme için aynı UID'ye sahip çağıranlara izin verebilir.
- Tüm iletişim yalnızca yerel olarak gerçekleşir; hiçbir ağ soketi dışarıya açılmaz.
- TCC istemleri yalnızca GUI uygulama paketinden kaynaklanır; yeniden derlemeler boyunca imzalı paket kimliğini sabit tutun.
- Çalıştırma onayları soketi güçlendirmesi: `0600` dosya modu, paylaşılan belirteç, eş UID denetimi (`getpeereid`), HMAC-SHA256 sınama/yanıt mekanizması ve isteklerde kısa bir TTL.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [macOS IPC akışı (çalıştırma onayları)](/tr/tools/exec-approvals-advanced#macos-ipc-flow)
