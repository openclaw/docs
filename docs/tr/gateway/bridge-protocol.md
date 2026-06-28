---
read_when:
    - node istemcileri oluşturma veya hata ayıklama (iOS/Android/macOS node modu)
    - Eşleştirme veya köprü kimlik doğrulama hatalarını inceleme
    - Gateway tarafından açığa çıkarılan Node yüzeyini denetleme
summary: 'Geçmiş köprü protokolü (eski düğümler): TCP JSONL, eşleştirme, kapsamlı RPC'
title: Köprü protokolü
x-i18n:
    generated_at: "2026-06-28T00:32:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP köprüsü **kaldırıldı**. Mevcut OpenClaw derlemeleri köprü dinleyicisini göndermiyor ve `bridge.*` yapılandırma anahtarları artık şemada yer almıyor. Bu sayfa yalnızca tarihsel başvuru için tutulmaktadır. Tüm Node/operatör istemcileri için [Gateway Protokolü](/tr/gateway/protocol) kullanın.
</Warning>

## Neden vardı

- **Güvenlik sınırı**: köprü, tüm gateway API yüzeyi yerine küçük bir izin listesi sunar.
- **Eşleme + Node kimliği**: Node kabulü Gateway tarafından yönetilir ve Node başına bir token'a bağlanır.
- **Keşif kullanıcı deneyimi**: Node'lar LAN üzerinde Bonjour ile Gateway'leri keşfedebilir veya doğrudan bir tailnet üzerinden bağlanabilir.
- **Loopback WS**: tam WS kontrol düzlemi, SSH ile tünellenmediği sürece yerel kalır.

## Taşıma

- TCP, satır başına bir JSON nesnesi (JSONL).
- İsteğe bağlı TLS (`bridge.tls.enabled` true olduğunda).
- Tarihsel varsayılan dinleyici bağlantı noktası `18790` idi (mevcut derlemeler bir TCP köprüsü başlatmaz).

TLS etkinleştirildiğinde keşif TXT kayıtları, gizli olmayan bir ipucu olarak `bridgeTls=1` ve `bridgeTlsSha256` içerir. Bonjour/mDNS TXT kayıtlarının kimlik doğrulamasız olduğunu unutmayın; istemciler, açık kullanıcı niyeti veya başka bir bant dışı doğrulama olmadan duyurulan parmak izini yetkili bir pin olarak değerlendirmemelidir.

## El sıkışma + eşleme

1. İstemci, Node metaverileri + token ile `hello` gönderir (zaten eşlendiyse).
2. Eşlenmemişse Gateway `error` (`NOT_PAIRED`/`UNAUTHORIZED`) yanıtı verir.
3. İstemci `pair-request` gönderir.
4. Gateway onay bekler, ardından `pair-ok` ve `hello-ok` gönderir.

Tarihsel olarak `hello-ok`, `serverName` döndürüyordu; barındırılan Plugin yüzeyleri artık `pluginSurfaceUrls` üzerinden duyurulur. Canvas/A2UI, `pluginSurfaceUrls.canvas` kullanır; kullanımdan kaldırılmış `canvasHostUrl` takma adı yeniden düzenlenmiş protokolün parçası değildir.

## Çerçeveler

İstemci → Gateway:

- `req` / `res`: kapsamlı Gateway RPC (sohbet, oturumlar, yapılandırma, sağlık, voicewake, skills.bins)
- `event`: Node sinyalleri (ses dökümü, ajan isteği, sohbet aboneliği, exec yaşam döngüsü)

Gateway → İstemci:

- `invoke` / `invoke-res`: Node komutları (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`)
- `event`: abone olunan oturumlar için sohbet güncellemeleri
- `ping` / `pong`: keepalive

Eski izin listesi uygulaması `src/gateway/server-bridge.ts` içinde yaşıyordu (kaldırıldı).

## Exec yaşam döngüsü olayları

Node'lar, tamamlanan `system.run` etkinliğini göstermek için `exec.finished` olayları yayabilir. Bunlar Gateway içinde sistem olaylarına eşlenir. (Eski Node'lar hâlâ `exec.started` yayabilir.)
Node'lar reddedilen `system.run` denemeleri için `exec.denied` yayabilir; Gateway olayı terminal bir ret olarak kabul eder ve bir sistem olayı kuyruğa almaz veya ajan işini uyandırmaz.

Yük alanları (belirtilmedikçe tümü isteğe bağlıdır):

- `sessionKey` (gerekli): olay korelasyonu ve `exec.finished` için sistem olayı teslimi amacıyla ajan oturumu.
- `runId`: gruplama için benzersiz exec kimliği.
- `command`: ham veya biçimlendirilmiş komut dizesi.
- `exitCode`, `timedOut`, `success`, `output`: tamamlanma ayrıntıları (yalnızca finished).
- `reason`: ret nedeni (yalnızca denied).

## Tarihsel tailnet kullanımı

- Köprüyü bir tailnet IP'sine bağlayın: `~/.openclaw/openclaw.json` içinde `bridge.bind: "tailnet"` (yalnızca tarihsel; `bridge.*` artık geçerli değildir).
- İstemciler MagicDNS adı veya tailnet IP'si üzerinden bağlanır.
- Bonjour ağlar arasında **geçiş yapmaz**; gerektiğinde manuel ana makine/bağlantı noktası veya geniş alan DNS-SD kullanın.

## Sürümleme

Köprü **örtük v1** idi (min/maks pazarlığı yoktu). Bu bölüm yalnızca tarihsel başvuru içindir; mevcut Node/operatör istemcileri WebSocket [Gateway Protokolü](/tr/gateway/protocol) kullanır.

## İlgili

- [Gateway protokolü](/tr/gateway/protocol)
- [Node'lar](/tr/nodes)
