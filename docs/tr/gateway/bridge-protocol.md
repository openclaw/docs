---
read_when:
    - Node istemcilerini derleme veya hata ayıklama (iOS/Android/macOS Node modu)
    - Eşleştirme veya köprü kimlik doğrulama hatalarını araştırma
    - Gateway tarafından kullanıma açılan Node yüzeyini denetleme
summary: 'Tarihsel köprü protokolü (eski düğümler): TCP JSONL, eşleştirme, kapsamlandırılmış RPC'
title: Köprü protokolü
x-i18n:
    generated_at: "2026-05-06T17:55:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84c4b5c344d880d4283eebd8596e8b5b0aad5cae747694784011deb1547db30
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP köprüsü **kaldırıldı**. Güncel OpenClaw derlemeleri köprü dinleyicisini göndermez ve `bridge.*` yapılandırma anahtarları artık şemada yer almaz. Bu sayfa yalnızca tarihsel başvuru amacıyla tutulmaktadır. Tüm düğüm/operatör istemcileri için [Gateway Protokolü](/tr/gateway/protocol) kullanın.
</Warning>

## Neden vardı

- **Güvenlik sınırı**: Köprü, tam Gateway API yüzeyi yerine küçük bir izin listesi sunar.
- **Eşleştirme + düğüm kimliği**: Düğüm kabulü Gateway tarafından yönetilir ve düğüm başına bir tokene bağlıdır.
- **Keşif kullanıcı deneyimi**: Düğümler LAN üzerinde Bonjour ile Gateway’leri keşfedebilir veya bir tailnet üzerinden doğrudan bağlanabilir.
- **Loopback WS**: Tam WS kontrol düzlemi SSH ile tünellenmedikçe yerel kalır.

## Aktarım

- TCP, satır başına bir JSON nesnesi (JSONL).
- İsteğe bağlı TLS (`bridge.tls.enabled` true olduğunda).
- Tarihsel varsayılan dinleyici portu `18790` idi (güncel derlemeler TCP köprüsü başlatmaz).

TLS etkinleştirildiğinde, keşif TXT kayıtları gizli olmayan bir ipucu olarak `bridgeTls=1` ve `bridgeTlsSha256` içerir. Bonjour/mDNS TXT kayıtlarının kimliği doğrulanmamıştır; istemciler, açık kullanıcı niyeti veya başka bir bant dışı doğrulama olmadan duyurulan parmak izini yetkili bir sabitleme olarak değerlendirmemelidir.

## El sıkışma + eşleştirme

1. İstemci, düğüm meta verileri + token (zaten eşleştirilmişse) ile `hello` gönderir.
2. Eşleştirilmemişse Gateway `error` (`NOT_PAIRED`/`UNAUTHORIZED`) yanıtı verir.
3. İstemci `pair-request` gönderir.
4. Gateway onay bekler, ardından `pair-ok` ve `hello-ok` gönderir.

Tarihsel olarak, `hello-ok` `serverName` döndürür ve `canvasHostUrl` içerebilirdi.

## Çerçeveler

İstemci → Gateway:

- `req` / `res`: kapsamlı Gateway RPC (sohbet, oturumlar, yapılandırma, sağlık, voicewake, skills.bins)
- `event`: düğüm sinyalleri (ses dökümü, ajan isteği, sohbet aboneliği, exec yaşam döngüsü)

Gateway → İstemci:

- `invoke` / `invoke-res`: düğüm komutları (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: abone olunan oturumlar için sohbet güncellemeleri
- `ping` / `pong`: keepalive

Eski izin listesi zorlaması `src/gateway/server-bridge.ts` içinde bulunuyordu (kaldırıldı).

## Exec yaşam döngüsü olayları

Düğümler system.run etkinliğini yüzeye çıkarmak için `exec.finished` veya `exec.denied` olayları yayabilir.
Bunlar Gateway’de sistem olaylarına eşlenir. (Eski düğümler hâlâ `exec.started` yayabilir.)

Yük alanları (belirtilmedikçe tümü isteğe bağlıdır):

- `sessionKey` (gerekli): sistem olayını alacak ajan oturumu.
- `runId`: gruplama için benzersiz exec kimliği.
- `command`: ham veya biçimlendirilmiş komut dizesi.
- `exitCode`, `timedOut`, `success`, `output`: tamamlama ayrıntıları (yalnızca finished).
- `reason`: reddetme nedeni (yalnızca denied).

## Tarihsel tailnet kullanımı

- Köprüyü bir tailnet IP’sine bağlayın: `~/.openclaw/openclaw.json` içinde
  `bridge.bind: "tailnet"` (yalnızca tarihsel; `bridge.*` artık geçerli değildir).
- İstemciler MagicDNS adı veya tailnet IP’si üzerinden bağlanır.
- Bonjour ağlar arasında çalışmaz; gerektiğinde elle host/port veya geniş alan DNS-SD kullanın.

## Sürümleme

Köprü **örtük v1** idi (min/max anlaşması yoktu). Bu bölüm yalnızca tarihsel başvuru amaçlıdır; güncel düğüm/operatör istemcileri WebSocket [Gateway Protokolü](/tr/gateway/protocol) kullanır.

## İlgili

- [Gateway protokolü](/tr/gateway/protocol)
- [Düğümler](/tr/nodes)
