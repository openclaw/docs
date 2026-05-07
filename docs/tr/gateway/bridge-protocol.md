---
read_when:
    - Node istemcilerini derleme veya hata ayıklama (iOS/Android/macOS Node modu)
    - Eşleştirme veya köprü kimlik doğrulaması hatalarını araştırma
    - Gateway tarafından açığa çıkarılan Node yüzeyini denetleme
summary: 'Tarihsel köprü protokolü (eski düğümler): TCP JSONL, eşleştirme, kapsamlandırılmış RPC'
title: Köprü protokolü
x-i18n:
    generated_at: "2026-05-07T13:16:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc906ca3a8a4ebef9b39c53187bcb4d06b287875b8e8748a168812f9a52e6152
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP köprüsü **kaldırıldı**. Mevcut OpenClaw derlemeleri köprü dinleyicisini içermez ve `bridge.*` yapılandırma anahtarları artık şemada yoktur. Bu sayfa yalnızca tarihsel başvuru için tutulmaktadır. Tüm düğüm/operatör istemcileri için [Gateway Protokolü](/tr/gateway/protocol) kullanın.
</Warning>

## Neden vardı?

- **Güvenlik sınırı**: köprü, tam Gateway API yüzeyi yerine küçük bir izin listesi sunar.
- **Eşleme + düğüm kimliği**: düğüm kabulü Gateway tarafından yönetilir ve düğüm başına bir token’a bağlanır.
- **Keşif UX’i**: düğümler LAN üzerinde Bonjour aracılığıyla Gateway’leri keşfedebilir veya bir tailnet üzerinden doğrudan bağlanabilir.
- **Loopback WS**: tam WS kontrol düzlemi SSH üzerinden tünellenmedikçe yerel kalır.

## Taşıma

- TCP, satır başına bir JSON nesnesi (JSONL).
- İsteğe bağlı TLS (`bridge.tls.enabled` true olduğunda).
- Tarihsel varsayılan dinleyici bağlantı noktası `18790` idi (mevcut derlemeler bir TCP köprüsü başlatmaz).

TLS etkinleştirildiğinde, keşif TXT kayıtları gizli olmayan bir ipucu olarak `bridgeTls=1` ve `bridgeTlsSha256` içerir. Bonjour/mDNS TXT kayıtlarının kimliğinin doğrulanmadığını unutmayın; istemciler, açık kullanıcı niyeti veya başka bant dışı doğrulama olmadan ilan edilen parmak izini yetkili bir sabitleme olarak ele almamalıdır.

## El sıkışma + eşleme

1. İstemci, düğüm meta verileri + token (zaten eşlenmişse) ile `hello` gönderir.
2. Eşlenmemişse Gateway `error` (`NOT_PAIRED`/`UNAUTHORIZED`) yanıtı verir.
3. İstemci `pair-request` gönderir.
4. Gateway onay bekler, ardından `pair-ok` ve `hello-ok` gönderir.

Tarihsel olarak `hello-ok`, `serverName` döndürürdü; barındırılan Plugin yüzeyleri artık `pluginSurfaceUrls` üzerinden ilan edilir. Canvas/A2UI `pluginSurfaceUrls.canvas` kullanır; kullanımdan kaldırılan `canvasHostUrl` takma adı yeniden düzenlenen protokolün parçası değildir.

## Çerçeveler

İstemci → Gateway:

- `req` / `res`: kapsamlı Gateway RPC’si (sohbet, oturumlar, yapılandırma, sağlık, voicewake, skills.bins)
- `event`: düğüm sinyalleri (ses dökümü, ajan isteği, sohbet aboneliği, exec yaşam döngüsü)

Gateway → İstemci:

- `invoke` / `invoke-res`: düğüm komutları (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`)
- `event`: abone olunan oturumlar için sohbet güncellemeleri
- `ping` / `pong`: keepalive

Eski izin listesi zorlaması `src/gateway/server-bridge.ts` içinde bulunuyordu (kaldırıldı).

## Exec yaşam döngüsü olayları

Düğümler, system.run etkinliğini yüzeye çıkarmak için `exec.finished` veya `exec.denied` olayları yayabilir.
Bunlar Gateway’de sistem olaylarına eşlenir. (Eski düğümler hâlâ `exec.started` yayabilir.)

Yük alanları (belirtilmedikçe tümü isteğe bağlıdır):

- `sessionKey` (gerekli): sistem olayını alacak ajan oturumu.
- `runId`: gruplama için benzersiz exec kimliği.
- `command`: ham veya biçimlendirilmiş komut dizesi.
- `exitCode`, `timedOut`, `success`, `output`: tamamlama ayrıntıları (yalnızca finished).
- `reason`: reddetme nedeni (yalnızca denied).

## Tarihsel tailnet kullanımı

- Köprüyü bir tailnet IP’sine bağlayın: `~/.openclaw/openclaw.json` içinde `bridge.bind: "tailnet"` (yalnızca tarihsel; `bridge.*` artık geçerli değildir).
- İstemciler MagicDNS adı veya tailnet IP’si üzerinden bağlanır.
- Bonjour ağlar arasında geçiş yapmaz; gerektiğinde manuel host/bağlantı noktası veya geniş alan DNS-SD kullanın.

## Sürümleme

Köprü **örtük v1** idi (min/max pazarlığı yoktu). Bu bölüm yalnızca tarihsel başvuru içindir; mevcut düğüm/operatör istemcileri WebSocket [Gateway Protokolü](/tr/gateway/protocol) kullanır.

## İlgili

- [Gateway protokolü](/tr/gateway/protocol)
- [Düğümler](/tr/nodes)
