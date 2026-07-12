---
read_when:
    - Eski Node istemci kodunu veya arşivlenmiş eşleştirme günlüklerini inceleme
    - Eski node yüzeyinin daha önce neleri kullanıma sunduğunu denetleme
summary: 'Geçmiş köprü protokolü (eski Node''lar): TCP JSONL, eşleştirme, kapsamlı RPC'
title: Köprü protokolü
x-i18n:
    generated_at: "2026-07-12T12:17:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP köprüsü **kaldırılmıştır**. Güncel OpenClaw derlemeleri köprü dinleyicisini içermez ve `bridge.*` yapılandırma anahtarları artık şemada yer almaz. Bu sayfa yalnızca tarihsel referans niteliğindedir. Tüm Node/operatör istemcileri için [Gateway protokolünü](/tr/gateway/protocol) kullanın.
</Warning>

## Neden vardı?

- **Güvenlik sınırı**: Gateway API yüzeyinin tamamı yerine küçük bir izin verilenler listesi sunuyordu.
- **Eşleştirme + Node kimliği**: Node kabulü Gateway tarafından yönetiliyor ve Node başına bir belirteçle ilişkilendiriliyordu.
- **Keşif kullanıcı deneyimi**: Node'lar LAN üzerinde Bonjour aracılığıyla Gateway'leri keşfedebiliyor veya bir tailnet üzerinden doğrudan bağlanabiliyordu.
- **local loopback WS**: Tam WS kontrol düzlemi, SSH üzerinden tünellenmediği sürece yerel kalıyordu.

## Aktarım

- TCP, satır başına bir JSON nesnesi (JSONL).
- İsteğe bağlı TLS (`bridge.tls.enabled: true`).
- Varsayılan dinleyici bağlantı noktası `18790` idi.

TLS etkinleştirildiğinde keşif TXT kayıtları, gizli olmayan bir ipucu olarak `bridgeTls=1` ile birlikte `bridgeTlsSha256` değerini içeriyordu. Bonjour/mDNS TXT kayıtlarının kimliği doğrulanmaz; istemciler, bant dışı başka bir doğrulama olmadan duyurulan parmak izini yetkili bir sabitleme değeri olarak kabul edemezdi.

## El sıkışma ve eşleştirme

1. İstemci, Node meta verileriyle ve önceden eşleştirilmişse belirteçle birlikte `hello` gönderir.
2. Eşleştirilmemişse Gateway, `error` (`NOT_PAIRED` / `UNAUTHORIZED`) yanıtını verir.
3. İstemci `pair-request` gönderir.
4. Gateway onay bekler, ardından `pair-ok` ve `hello-ok` gönderir.

`hello-ok` daha önce `serverName` döndürüyordu; barındırılan Plugin yüzeyleri artık güncel Gateway protokolünde `pluginSurfaceUrls` üzerinden duyurulur (Canvas/A2UI, `pluginSurfaceUrls.canvas` kullanır).

## Çerçeveler

İstemciden Gateway'e:

- `req` / `res`: kapsamı sınırlandırılmış Gateway RPC'si (sohbet, oturumlar, yapılandırma, sistem durumu, sesle uyandırma, skills.bins).
- `event`: Node sinyalleri (ses dökümü, ajan isteği, sohbet aboneliği, yürütme yaşam döngüsü).

Gateway'den istemciye:

- `invoke` / `invoke-res`: Node komutları (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`).
- `event`: abone olunan oturumların sohbet güncellemeleri.
- `ping` / `pong`: bağlantıyı canlı tutma.

İzin verilenler listesinin uygulanması `src/gateway/server-bridge.ts` içinde yer alıyordu (kaldırıldı).

## Yürütme yaşam döngüsü olayları

Node'lar, tamamlanan `system.run` etkinliğini göstermek için `exec.finished` yayımlıyordu; bu etkinlik Gateway tarafından sistem olaylarına eşleniyordu (eski Node'lar ayrıca `exec.started` da yayımlayabiliyordu). `exec.denied`, reddedilen bir `system.run` girişimini, sistem olayı kuyruğa eklemeden veya ajan çalışmasını uyandırmadan nihai bir ret olarak işaretliyordu.

Yük alanları (belirtilmedikçe tümü isteğe bağlıdır):

| Alan                             | Notlar                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `sessionKey`                     | Zorunlu. Olay ilişkilendirmesi ve `exec.finished` için sistem olayı tesliminde kullanılan ajan oturumu. |
| `runId`                          | Gruplandırma için benzersiz yürütme kimliği.                                                             |
| `command`                        | Ham veya biçimlendirilmiş komut dizesi.                                                                  |
| `exitCode`, `timedOut`, `output` | Tamamlanma ayrıntıları (yalnızca tamamlananlar).                                                         |
| `reason`                         | Ret nedeni (yalnızca reddedilenler).                                                                     |

## Tarihsel tailnet kullanımı

- Köprüyü bir tailnet IP'sine bağlama: `~/.openclaw/openclaw.json` içinde `bridge.bind: "tailnet"` (yalnızca tarihsel kullanım; `bridge.*` artık geçerli bir yapılandırma değildir).
- İstemciler MagicDNS adı veya tailnet IP'si üzerinden bağlanıyordu.
- Bonjour ağlar arasında çalışmaz; aksi durumda geniş alan DNS-SD veya elle belirtilen bir ana makine/bağlantı noktası gerekliydi.

## Sürümleme

Köprü, en düşük/en yüksek sürüm uzlaşması olmadan örtük v1 kullanıyordu. Güncel Node/operatör istemcileri, protokol sürümü aralığı üzerinde uzlaşan WebSocket [Gateway protokolünü](/tr/gateway/protocol) kullanır.

## İlgili

- [Gateway protokolü](/tr/gateway/protocol)
- [Node'lar](/tr/nodes)
