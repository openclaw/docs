---
read_when:
    - macOS UI olmadan Node eşleştirme onaylarını uygulama
    - Uzak Node'ları onaylamak için CLI akışları ekleme
    - Gateway protokolünü Node yönetimiyle genişletme
summary: iOS ve diğer uzak Node'lar için Gateway sahipli node eşleştirmesi (Seçenek B)
title: Gateway sahipli eşleştirme
x-i18n:
    generated_at: "2026-04-26T11:30:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 436391f7576b7285733eb4a8283b73d7b4c52f22b227dd915c09313cfec776bd
    source_path: gateway/pairing.md
    workflow: 15
---

Gateway sahipli eşleştirmede, hangi Node'ların katılmasına izin verildiğinin doğruluk kaynağı **Gateway**'dir. UI'lar (macOS uygulaması, gelecekteki istemciler) yalnızca bekleyen istekleri onaylayan veya reddeden ön yüzlerdir.

**Önemli:** WS Node'ları `connect` sırasında **cihaz eşleştirmesi**ni (rol `node`) kullanır. `node.pair.*` ayrı bir eşleştirme deposudur ve WS el sıkışmasını geçitlemez. Bu akışı yalnızca açıkça `node.pair.*` çağıran istemciler kullanır.

## Kavramlar

- **Bekleyen istek**: bir Node katılmak istedi; onay gerekir.
- **Eşleştirilmiş Node**: onaylanmış ve auth token'ı verilmiş Node.
- **Taşıma**: Gateway WS uç noktası istekleri iletir ama üyeliğe karar vermez. (Eski TCP köprüsü desteği kaldırıldı.)

## Eşleştirme nasıl çalışır

1. Bir Node Gateway WS'ye bağlanır ve eşleştirme ister.
2. Gateway bir **bekleyen istek** saklar ve `node.pair.requested` yayar.
3. İsteği onaylarsınız veya reddedersiniz (CLI veya UI).
4. Onaylandığında Gateway **yeni bir token** verir (yeniden eşleştirmede token'lar döndürülür).
5. Node token ile yeniden bağlanır ve artık “eşleştirilmiş” olur.

Bekleyen istekler **5 dakika** sonra otomatik olarak sona erer.

## CLI iş akışı (headless dostu)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status`, eşleştirilmiş/bağlı Node'ları ve yeteneklerini gösterir.

## API yüzeyi (Gateway protokolü)

Olaylar:

- `node.pair.requested` — yeni bir bekleyen istek oluşturulduğunda yayılır.
- `node.pair.resolved` — bir istek onaylandığında/reddedildiğinde/süresi dolduğunda yayılır.

Yöntemler:

- `node.pair.request` — bekleyen bir istek oluşturur veya yeniden kullanır.
- `node.pair.list` — bekleyen + eşleştirilmiş Node'ları listeler (`operator.pairing`).
- `node.pair.approve` — bekleyen bir isteği onaylar (token verir).
- `node.pair.reject` — bekleyen bir isteği reddeder.
- `node.pair.verify` — `{ nodeId, token }` doğrular.

Notlar:

- `node.pair.request`, Node başına idempotent'tir: yinelenen çağrılar aynı bekleyen isteği döndürür.
- Aynı bekleyen Node için yinelenen istekler ayrıca operatör görünürlüğü için saklanan Node meta verisini ve izin listesine alınmış bildirilen en son komut anlık görüntüsünü yeniler.
- Onay **her zaman** yeni bir token üretir; `node.pair.request` hiçbir zaman token döndürmez.
- İstekler, otomatik onay akışları için ipucu olarak `silent: true` içerebilir.
- `node.pair.approve`, ek onay kapsamlarını zorlamak için bekleyen isteğin bildirilen komutlarını kullanır:
  - komutsuz istek: `operator.pairing`
  - exec olmayan komut isteği: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` isteği:
    `operator.pairing` + `operator.admin`

Önemli:

- Node eşleştirmesi güven/kimlik akışı ve token verme işlemidir.
- Canlı Node komut yüzeyini Node başına sabitlemez.
- Canlı Node komutları, Gateway'in genel Node komut ilkesi (`gateway.nodes.allowCommands` / `denyCommands`) uygulandıktan sonra Node'un bağlanırken bildirdiği şeylerden gelir.
- Node başına `system.run` izin/sorma ilkesi, eşleştirme kaydında değil, `exec.approvals.node.*` altında Node üzerinde bulunur.

## Node komut geçitlemesi (2026.3.31+)

<Warning>
**Kırıcı değişiklik:** `2026.3.31` ile başlayarak, Node eşleştirmesi onaylanana kadar Node komutları devre dışıdır. Yalnızca cihaz eşleştirmesi artık bildirilen Node komutlarını açığa çıkarmaya yetmez.
</Warning>

Bir Node ilk kez bağlandığında eşleştirme otomatik olarak istenir. Eşleştirme isteği onaylanana kadar o Node'dan gelen tüm bekleyen Node komutları filtrelenir ve yürütülmez. Eşleştirme onayı ile güven kurulduğunda, Node'un bildirdiği komutlar normal komut ilkesine tabi olarak kullanılabilir hale gelir.

Bu şu anlama gelir:

- Daha önce yalnızca cihaz eşleştirmesine güvenerek komut açığa çıkaran Node'ların artık Node eşleştirmesini tamamlaması gerekir.
- Eşleştirme onayından önce kuyruğa alınan komutlar ertelenmez, düşürülür.

## Node olay güven sınırları (2026.3.31+)

<Warning>
**Kırıcı değişiklik:** Node kaynaklı çalıştırmalar artık azaltılmış bir güvenilir yüzeyde kalır.
</Warning>

Node kaynaklı özetler ve ilgili oturum olayları, amaçlanan güvenilir yüzeyle sınırlandırılır. Daha önce daha geniş host veya oturum araç erişimine dayanan bildirim tabanlı veya Node tetiklemeli akışların ayarlanması gerekebilir. Bu sağlamlaştırma, Node olaylarının Node'un güven sınırının izin verdiğinden daha fazla host düzeyi araç erişimine yükselmemesini sağlar.

## Otomatik onay (macOS uygulaması)

macOS uygulaması isteğe bağlı olarak şu durumlarda **sessiz onay** denemesi yapabilir:

- istek `silent` olarak işaretlenmişse ve
- uygulama aynı kullanıcıyı kullanarak Gateway host'una SSH bağlantısını doğrulayabiliyorsa.

Sessiz onay başarısız olursa normal “Approve/Reject” istemine geri döner.

## Güvenilen CIDR cihaz otomatik onayı

`role: node` için WS cihaz eşleştirmesi varsayılan olarak manuel kalır. Gateway'in ağ yoluna zaten güvendiği özel Node ağları için operatörler açık CIDR'lar veya tam IP'lerle katılım sağlayabilir:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Güvenlik sınırı:

- `gateway.nodes.pairing.autoApproveCidrs` ayarlanmamışsa devre dışıdır.
- Genel bir LAN veya özel ağ otomatik onay modu yoktur.
- Yalnızca kapsam istemeyen taze `role: node` cihaz eşleştirmesi uygundur.
- Operatör, Browser, Control UI ve WebChat istemcileri manuel kalır.
- Rol, kapsam, meta veri ve açık anahtar yükseltmeleri manuel kalır.
- Aynı host loopback güvenilir proxy başlık yolları uygun değildir; çünkü bu yol yerel çağıranlar tarafından taklit edilebilir.

## Meta veri yükseltme otomatik onayı

Zaten eşleştirilmiş bir cihaz yalnızca hassas olmayan meta veri değişiklikleriyle (örneğin görünen ad veya istemci platformu ipuçları) yeniden bağlandığında OpenClaw bunu `metadata-upgrade` olarak ele alır. Sessiz otomatik onay dardır: yalnızca yerel veya paylaşılan kimlik bilgilerine sahip olduğunu zaten kanıtlamış güvenilen browser olmayan yerel yeniden bağlantılara uygulanır; buna işletim sistemi sürümü meta verisi değişikliklerinden sonraki aynı host yerel uygulama yeniden bağlantıları da dahildir. Browser/Control UI istemcileri ve uzak istemciler yine açık yeniden onay akışını kullanır. Kapsam yükseltmeleri (read'den write/admin'e) ve açık anahtar değişiklikleri meta veri yükseltme otomatik onayı için **uygun değildir** — açık yeniden onay istekleri olarak kalırlar.

## QR eşleştirme yardımcıları

`/pair qr`, mobil ve browser istemcilerinin doğrudan tarayabilmesi için eşleştirme yükünü yapılandırılmış medya olarak işler.

Bir cihazı silmek, o cihaz kimliği için eski bekleyen eşleştirme isteklerini de temizler; böylece `nodes pending`, iptal sonrası sahipsiz satırlar göstermez.

## Yerellik ve iletilen başlıklar

Gateway eşleştirmesi, bir bağlantıyı yalnızca ham soket ve herhangi bir üst akış proxy kanıtı da aynı şeyi söylüyorsa loopback olarak kabul eder. Bir istek loopback üzerinden geliyorsa ama `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` başlıkları taşıyor ve bunlar yerel olmayan bir kaynağı işaret ediyorsa, bu iletilen başlık kanıtı loopback yerellik iddiasını geçersiz kılar. Eşleştirme yolu o zaman isteği sessizce aynı host bağlantısı gibi kabul etmek yerine açık onay gerektirir. Operatör auth içindeki eşdeğer kural için [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth) bölümüne bakın.

## Depolama (yerel, özel)

Eşleştirme durumu Gateway durum dizini altında saklanır (varsayılan `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR` geçersiz kılınırsa `nodes/` klasörü onunla birlikte taşınır.

Güvenlik notları:

- Token'lar gizlidir; `paired.json` dosyasını hassas kabul edin.
- Bir token'ı döndürmek yeniden onay gerektirir (veya Node girdisinin silinmesini).

## Taşıma davranışı

- Taşıma **durumsuzdur**; üyelik saklamaz.
- Gateway çevrimdışıysa veya eşleştirme devre dışıysa Node'lar eşleştirilemez.
- Gateway uzak moddaysa eşleştirme yine uzak Gateway'in deposuna karşı yapılır.

## İlgili

- [Kanal eşleştirmesi](/tr/channels/pairing)
- [Node'lar](/tr/nodes)
- [Devices CLI](/tr/cli/devices)
