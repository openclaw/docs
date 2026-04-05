---
read_when:
    - PeekabooBridge'i OpenClaw.app içinde barındırırken
    - Peekaboo'yu Swift Package Manager ile entegre ederken
    - PeekabooBridge protokolünü/yollarını değiştirirken
summary: macOS UI otomasyonu için PeekabooBridge entegrasyonu
title: Peekaboo Bridge
x-i18n:
    generated_at: "2026-04-05T14:00:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30961eb502eecd23c017b58b834bd8cb00cab8b17302617d541afdace3ad8dba
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

# Peekaboo Bridge (macOS UI otomasyonu)

OpenClaw, izin farkındalığına sahip yerel bir UI otomasyon aracısı olarak **PeekabooBridge** barındırabilir. Bu, `peekaboo` CLI'nın macOS uygulamasının TCC izinlerini yeniden kullanırken UI otomasyonunu sürmesini sağlar.

## Bunun ne olduğu (ve ne olmadığı)

- **Ana makine**: OpenClaw.app, bir PeekabooBridge ana makinesi olarak davranabilir.
- **İstemci**: `peekaboo` CLI kullanın (ayrı bir `openclaw ui ...` yüzeyi yoktur).
- **UI**: görsel katmanlar Peekaboo.app içinde kalır; OpenClaw ince bir aracı ana makinedir.

## Bridge'i etkinleştirin

macOS uygulamasında:

- Ayarlar → **Peekaboo Bridge'i Etkinleştir**

Etkinleştirildiğinde OpenClaw yerel bir UNIX soket sunucusu başlatır. Devre dışıysa ana makine durdurulur ve `peekaboo` mevcut diğer ana makinelere geri döner.

## İstemci keşif sırası

Peekaboo istemcileri genellikle ana makineleri şu sırayla dener:

1. Peekaboo.app (tam UX)
2. Claude.app (kuruluysa)
3. OpenClaw.app (ince aracı)

Hangi ana makinenin etkin olduğunu ve hangi soket yolunun kullanımda olduğunu görmek için `peekaboo bridge status --verbose` kullanın. Şunu kullanarak geçersiz kılabilirsiniz:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Güvenlik ve izinler

- Bridge, **çağıran kod imzalarını** doğrular; TeamID'ler için bir izin listesi uygulanır (Peekaboo ana makine TeamID'si + OpenClaw uygulama TeamID'si).
- İsteklerin zaman aşımı yaklaşık 10 saniye sonra olur.
- Gerekli izinler eksikse bridge, Sistem Ayarları'nı başlatmak yerine açık bir hata mesajı döndürür.

## Anlık görüntü davranışı (otomasyon)

Anlık görüntüler bellekte saklanır ve kısa bir süre sonra otomatik olarak süresi dolar.
Daha uzun süre saklama gerekiyorsa, istemciden yeniden yakalayın.

## Sorun giderme

- `peekaboo` “bridge client is not authorized” bildiriyorsa, istemcinin düzgün şekilde imzalandığından emin olun veya yalnızca **hata ayıklama** modunda ana makineyi `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` ile çalıştırın.
- Hiç ana makine bulunamazsa, ana makine uygulamalarından birini (Peekaboo.app veya OpenClaw.app) açın ve izinlerin verildiğini doğrulayın.
