---
read_when:
    - Node istemcileri oluşturma veya hata ayıklama (iOS/Android/macOS Node modu)
    - Pairing veya köprü kimlik doğrulama hatalarını inceleme
    - Gateway tarafından açığa çıkarılan Node yüzeyini denetleme
summary: 'Geçmiş köprü protokolü (eski Node''lar): TCP JSONL, Pairing, kapsamlı RPC'
title: Köprü protokolü
x-i18n:
    generated_at: "2026-04-24T09:07:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b2a54f439e586ea7e535cedae4a07c365f95702835b05ba5a779d590dcf967e
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Köprü protokolü (eski Node taşıması)

<Warning>
TCP köprüsü **kaldırıldı**. Mevcut OpenClaw yapıları köprü dinleyicisini içermez ve `bridge.*` yapılandırma anahtarları artık şemada yer almaz. Bu sayfa yalnızca tarihsel başvuru için tutulmaktadır. Tüm Node/operatör istemcileri için [Gateway Protocol](/tr/gateway/protocol) kullanın.
</Warning>

## Neden vardı

- **Güvenlik sınırı**: köprü, tam Gateway API yüzeyi yerine küçük bir izin listesini açığa çıkarır.
- **Pairing + Node kimliği**: Node kabulü Gateway'e aittir ve
  Node başına bir belirtece bağlıdır.
- **Keşif UX'i**: Node'lar LAN üzerinde Bonjour ile Gateway'leri keşfedebilir veya
  bir tailnet üzerinden doğrudan bağlanabilir.
- **Loopback WS**: tam WS denetim düzlemi SSH ile tünellenmedikçe yerel kalır.

## Taşıma

- TCP, satır başına bir JSON nesnesi (JSONL).
- İsteğe bağlı TLS (`bridge.tls.enabled` true olduğunda).
- Tarihsel varsayılan dinleyici portu `18790` idi (mevcut yapılar bir
  TCP köprüsü başlatmaz).

TLS etkin olduğunda keşif TXT kayıtları,
gizli olmayan bir ipucu olarak `bridgeTls=1` ve ayrıca `bridgeTlsSha256` içerir. Bonjour/mDNS TXT kayıtlarının
kimliği doğrulanmadığını unutmayın; istemciler, açık kullanıcı niyeti veya bant dışı başka doğrulama olmadan
ilan edilen parmak izini yetkili bir pin olarak görmemelidir.

## El sıkışma + Pairing

1. İstemci, Node meta verileri + belirteç ile `hello` gönderir (zaten paired ise).
2. Pairing yapılmadıysa Gateway `error` (`NOT_PAIRED`/`UNAUTHORIZED`) ile yanıt verir.
3. İstemci `pair-request` gönderir.
4. Gateway onayı bekler, sonra `pair-ok` ve `hello-ok` gönderir.

Tarihsel olarak `hello-ok`, `serverName` döndürür ve
`canvasHostUrl` içerebilirdi.

## Çerçeveler

İstemci → Gateway:

- `req` / `res`: kapsamlı Gateway RPC'si (chat, sessions, config, health, voicewake, skills.bins)
- `event`: Node sinyalleri (ses transkripti, ajan isteği, sohbet aboneliği, exec yaşam döngüsü)

Gateway → İstemci:

- `invoke` / `invoke-res`: Node komutları (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: abone olunan oturumlar için sohbet güncellemeleri
- `ping` / `pong`: bağlantıyı canlı tutma

Eski izin listesi uygulaması `src/gateway/server-bridge.ts` içinde bulunuyordu (kaldırıldı).

## Exec yaşam döngüsü olayları

Node'lar, system.run etkinliğini görünür kılmak için `exec.finished` veya `exec.denied` olayları gönderebilir.
Bunlar Gateway içinde sistem olaylarına eşlenir. (Eski Node'lar hâlâ `exec.started` yayabilir.)

Yük alanları (aksi belirtilmedikçe tümü isteğe bağlıdır):

- `sessionKey` (gerekli): sistem olayını alacak ajan oturumu.
- `runId`: gruplama için benzersiz exec kimliği.
- `command`: ham veya biçimlendirilmiş komut dizesi.
- `exitCode`, `timedOut`, `success`, `output`: tamamlama ayrıntıları (yalnızca finished).
- `reason`: reddetme nedeni (yalnızca denied).

## Tarihsel tailnet kullanımı

- Köprüyü bir tailnet IP'sine bağlayın: `~/.openclaw/openclaw.json`
  içinde `bridge.bind: "tailnet"` (yalnızca tarihsel; `bridge.*` artık geçerli değildir).
- İstemciler MagicDNS adı veya tailnet IP'si ile bağlanır.
- Bonjour ağlar arasında **geçmez**; gerektiğinde elle ana bilgisayar/port veya geniş alan DNS‑SD kullanın.

## Sürümleme

Köprü **örtük v1** idi (min/maks müzakere yoktu). Bu bölüm
yalnızca tarihsel başvuru niteliğindedir; mevcut Node/operatör istemcileri WebSocket
[Gateway Protocol](/tr/gateway/protocol) kullanır.

## İlgili

- [Gateway protokolü](/tr/gateway/protocol)
- [Node'lar](/tr/nodes)
