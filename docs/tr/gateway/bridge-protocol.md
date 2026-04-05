---
read_when:
    - Düğüm istemcileri oluşturuyor veya hata ayıklıyorsunuz (iOS/Android/macOS düğüm modu)
    - Eşleme veya bridge kimlik doğrulama hatalarını inceliyorsunuz
    - Gateway tarafından açığa çıkarılan düğüm yüzeyini denetliyorsunuz
summary: 'Geçmiş bridge protokolü (legacy düğümler): TCP JSONL, eşleme, kapsamlı RPC'
title: Bridge Protocol
x-i18n:
    generated_at: "2026-04-05T13:52:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bc25c388f3d65944167d05ca78f987c84ca480f0213e3485b118ebf4858c50f
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Bridge protocol (legacy node transport)

<Warning>
TCP bridge **kaldırıldı**. Güncel OpenClaw sürümleri bridge dinleyicisini içermez ve `bridge.*` yapılandırma anahtarları artık şemada yoktur. Bu sayfa yalnızca geçmişe dönük başvuru için tutulmaktadır. Tüm düğüm/operatör istemcileri için [Gateway Protocol](/gateway/protocol) kullanın.
</Warning>

## Neden vardı

- **Güvenlik sınırı**: bridge, tam gateway API yüzeyi yerine küçük bir izin listesini açığa çıkarır.
- **Eşleme + düğüm kimliği**: düğüm kabulü gateway tarafından sahiplenilir ve düğüm başına bir belirtece bağlıdır.
- **Keşif UX'i**: düğümler LAN üzerinde Bonjour ile gateway'leri keşfedebilir veya doğrudan bir tailnet üzerinden bağlanabilir.
- **Loopback WS**: tam WS kontrol düzlemi, SSH üzerinden tünellenmediği sürece yerel kalır.

## Taşıma

- TCP, satır başına bir JSON nesnesi (JSONL).
- İsteğe bağlı TLS (`bridge.tls.enabled` true olduğunda).
- Geçmişte varsayılan dinleyici portu `18790` idi (güncel sürümler bir TCP bridge başlatmaz).

TLS etkin olduğunda, keşif TXT kayıtları kimliksiz bir ipucu olarak `bridgeTls=1` ve `bridgeTlsSha256` içerir. Bonjour/mDNS TXT kayıtlarının kimliği doğrulanmadığını unutmayın; istemciler, açık kullanıcı niyeti veya başka bir bant dışı doğrulama olmadan ilan edilen parmak izini yetkili bir pin olarak değerlendirmemelidir.

## El sıkışma + eşleme

1. İstemci, düğüm meta verileri + belirteç ile `hello` gönderir (zaten eşlenmişse).
2. Eşlenmemişse, gateway `error` (`NOT_PAIRED`/`UNAUTHORIZED`) yanıtı verir.
3. İstemci `pair-request` gönderir.
4. Gateway onayı bekler, ardından `pair-ok` ve `hello-ok` gönderir.

Geçmişte `hello-ok`, `serverName` döndürürdü ve `canvasHostUrl` içerebilirdi.

## Çerçeveler

İstemci → Gateway:

- `req` / `res`: kapsamlı gateway RPC'si (`chat`, `sessions`, `config`, `health`, `voicewake`, `skills.bins`)
- `event`: düğüm sinyalleri (ses transkripti, ajan isteği, sohbet aboneliği, exec yaşam döngüsü)

Gateway → İstemci:

- `invoke` / `invoke-res`: düğüm komutları (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: abone olunan oturumlar için sohbet güncellemeleri
- `ping` / `pong`: canlı tutma

Legacy izin listesi uygulaması `src/gateway/server-bridge.ts` içinde bulunuyordu (kaldırıldı).

## Exec yaşam döngüsü olayları

Düğümler, `system.run` etkinliğini göstermek için `exec.finished` veya `exec.denied` olayları yayabilir.
Bunlar gateway içinde sistem olaylarına eşlenir. (Legacy düğümler hâlâ `exec.started` yayıyor olabilir.)

Yük alanları (belirtilmedikçe tümü isteğe bağlıdır):

- `sessionKey` (zorunlu): sistem olayını alacak ajan oturumu.
- `runId`: gruplama için benzersiz exec kimliği.
- `command`: ham veya biçimlendirilmiş komut dizgesi.
- `exitCode`, `timedOut`, `success`, `output`: tamamlanma ayrıntıları (yalnızca finished).
- `reason`: reddedilme nedeni (yalnızca denied).

## Geçmiş tailnet kullanımı

- Bridge'i bir tailnet IP'sine bağlayın: `~/.openclaw/openclaw.json` içinde `bridge.bind: "tailnet"` (yalnızca geçmiş içindir; `bridge.*` artık geçerli değildir).
- İstemciler MagicDNS adı veya tailnet IP'si üzerinden bağlanır.
- Bonjour ağlar arasında geçmez; gerektiğinde elle host/port veya geniş alan DNS‑SD kullanın.

## Sürümleme

Bridge **örtük v1** idi (min/max anlaşması yoktu). Bu bölüm yalnızca geçmiş başvurusu içindir; güncel düğüm/operatör istemcileri WebSocket [Gateway Protocol](/gateway/protocol) kullanır.
