---
read_when:
    - macOS arayüzü olmadan Node eşleştirme onaylarını uygulama
    - Uzak düğümleri onaylamaya yönelik CLI akışları ekleme
    - Gateway protokolünü Node yönetimiyle genişletme
summary: iOS ve diğer uzak Node'lar için Gateway tarafından yönetilen Node eşleştirmesi (Seçenek B)
title: Gateway’e ait eşleştirme
x-i18n:
    generated_at: "2026-05-03T08:56:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0ce46d487990860ac572c27cc9dd83839e87329132e2624944660bafaf723de
    source_path: gateway/pairing.md
    workflow: 16
---

Gateway tarafından sahip olunan eşleştirmede, hangi Node'ların katılmasına izin verileceği konusunda doğruluk kaynağı **Gateway**'dir. UI'lar (macOS uygulaması, gelecekteki istemciler) yalnızca bekleyen istekleri onaylayan veya reddeden frontend'lerdir.

**Önemli:** WS Node'ları `connect` sırasında **cihaz eşleştirmesi** (rol `node`) kullanır.
`node.pair.*` ayrı bir eşleştirme deposudur ve WS el sıkışmasını **geçitlemez**.
Yalnızca açıkça `node.pair.*` çağıran istemciler bu akışı kullanır.

## Kavramlar

- **Bekleyen istek**: bir Node katılmak istedi; onay gerektirir.
- **Eşleştirilmiş Node**: verilen bir kimlik doğrulama token'ı olan onaylı Node.
- **Aktarım**: Gateway WS endpoint'i istekleri iletir ancak üyeliğe karar vermez. (Eski TCP köprüsü desteği kaldırılmıştır.)

## Eşleştirme nasıl çalışır?

1. Bir Node Gateway WS'ye bağlanır ve eşleştirme ister.
2. Gateway bir **bekleyen istek** saklar ve `node.pair.requested` yayar.
3. İsteği onaylar veya reddedersiniz (CLI ya da UI).
4. Onayda Gateway bir **yeni token** verir (yeniden eşleştirmede token'lar döndürülür).
5. Node token'ı kullanarak yeniden bağlanır ve artık “eşleştirilmiş” olur.

Bekleyen istekler **5 dakika** sonra otomatik olarak sona erer.

## CLI iş akışı (başsız kullanıma uygun)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` eşleştirilmiş/bağlı Node'ları ve yeteneklerini gösterir.

## API yüzeyi (gateway protokolü)

Olaylar:

- `node.pair.requested` — yeni bir bekleyen istek oluşturulduğunda yayılır.
- `node.pair.resolved` — bir istek onaylandığında/reddedildiğinde/süresi dolduğunda yayılır.

Yöntemler:

- `node.pair.request` — bekleyen bir istek oluştur veya yeniden kullan.
- `node.pair.list` — bekleyen + eşleştirilmiş Node'ları listele (`operator.pairing`).
- `node.pair.approve` — bekleyen bir isteği onayla (token verir).
- `node.pair.reject` — bekleyen bir isteği reddet.
- `node.pair.remove` — eski bir eşleştirilmiş Node girdisini kaldır.
- `node.pair.verify` — `{ nodeId, token }` doğrula.

Notlar:

- `node.pair.request` Node başına idempotent'tir: yinelenen çağrılar aynı bekleyen isteği döndürür.
- Aynı bekleyen Node için yinelenen istekler, operatör görünürlüğü için saklanan Node meta verilerini ve en son izin listesine alınmış bildirilen komut anlık görüntüsünü de yeniler.
- Onay **her zaman** yeni bir token üretir; `node.pair.request` üzerinden hiçbir zaman token döndürülmez.
- Operatör kapsam düzeyleri ve onay zamanı denetimleri [Operatör kapsamları](/tr/gateway/operator-scopes) bölümünde özetlenmiştir.
- İstekler, otomatik onay akışları için bir ipucu olarak `silent: true` içerebilir.
- `node.pair.approve`, ek onay kapsamlarını zorunlu kılmak için bekleyen isteğin bildirdiği komutları kullanır:
  - komutsuz istek: `operator.pairing`
  - exec olmayan komut isteği: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` isteği:
    `operator.pairing` + `operator.admin`

<Warning>
Node eşleştirmesi, token verilmesiyle birlikte bir güven ve kimlik akışıdır. Canlı Node komut yüzeyini Node başına sabitlemez.

- Canlı Node komutları, Gateway'in genel Node komut ilkesi (`gateway.nodes.allowCommands` ve `denyCommands`) uygulandıktan sonra Node'un bağlantıda bildirdiği şeylerden gelir.
- Node başına `system.run` izin verme ve sorma ilkesi eşleştirme kaydında değil, Node üzerinde `exec.approvals.node.*` içinde bulunur.

</Warning>

## Node komut geçitlemesi (2026.3.31+)

<Warning>
**Kırıcı değişiklik:** `2026.3.31` sürümünden başlayarak, Node eşleştirmesi onaylanana kadar Node komutları devre dışıdır. Bildirilen Node komutlarını açığa çıkarmak için artık yalnızca cihaz eşleştirmesi yeterli değildir.
</Warning>

Bir Node ilk kez bağlandığında eşleştirme otomatik olarak istenir. Eşleştirme isteği onaylanana kadar, o Node'dan gelen tüm bekleyen Node komutları filtrelenir ve çalıştırılmaz. Eşleştirme onayıyla güven kurulduktan sonra, Node'un bildirdiği komutlar normal komut ilkesine tabi olarak kullanılabilir hale gelir.

Bu şu anlama gelir:

- Komutları açığa çıkarmak için daha önce yalnızca cihaz eşleştirmesine güvenen Node'lar artık Node eşleştirmesini tamamlamalıdır.
- Eşleştirme onayından önce kuyruğa alınan komutlar ertelenmez, düşürülür.

## Node olayı güven sınırları (2026.3.31+)

<Warning>
**Kırıcı değişiklik:** Node kaynaklı çalıştırmalar artık azaltılmış güvenilir yüzeyde kalır.
</Warning>

Node kaynaklı özetler ve ilgili oturum olayları, amaçlanan güvenilir yüzeyle sınırlandırılır. Daha önce daha geniş host veya oturum aracı erişimine dayanan bildirim güdümlü ya da Node tarafından tetiklenen akışların ayarlanması gerekebilir. Bu sertleştirme, Node olaylarının Node'un güven sınırının izin verdiğinin ötesinde host düzeyinde araç erişimine yükselmesini engeller.

Kalıcı Node varlık güncellemeleri aynı kimlik sınırını izler. `node.presence.alive` olayı yalnızca kimliği doğrulanmış Node cihaz oturumlarından kabul edilir ve eşleştirme meta verilerini yalnızca cihaz/Node kimliği zaten eşleştirilmişse günceller. Kendi bildirdiği `client.id` değerleri, son görülme durumunu yazmak için yeterli değildir.

## Otomatik onay (macOS uygulaması)

macOS uygulaması şu durumlarda isteğe bağlı olarak **sessiz onay** denemesi yapabilir:

- istek `silent` olarak işaretlenmişse ve
- uygulama aynı kullanıcıyı kullanarak gateway host'una SSH bağlantısını doğrulayabiliyorsa.

Sessiz onay başarısız olursa, normal “Onayla/Reddet” istemine geri döner.

## Güvenilir CIDR cihaz otomatik onayı

`role: node` için WS cihaz eşleştirmesi varsayılan olarak elle yapılmaya devam eder. Gateway'in ağ yoluna zaten güvendiği özel Node ağlarında, operatörler açık CIDR'ler veya tam IP'lerle bunu etkinleştirebilir:

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
- Genel LAN veya özel ağ otomatik onay modu yoktur.
- Yalnızca istenen kapsamı olmayan yeni `role: node` cihaz eşleştirmesi uygundur.
- Operatör, tarayıcı, Control UI ve WebChat istemcileri elle onayda kalır.
- Rol, kapsam, meta veri ve açık anahtar yükseltmeleri elle onayda kalır.
- Aynı host local loopback güvenilir proxy başlık yolları uygun değildir, çünkü bu yol yerel çağıranlar tarafından sahte olarak üretilebilir.

## Meta veri yükseltmesi otomatik onayı

Zaten eşleştirilmiş bir cihaz yalnızca hassas olmayan meta veri değişiklikleriyle (örneğin, görünen ad veya istemci platformu ipuçları) yeniden bağlandığında, OpenClaw bunu `metadata-upgrade` olarak ele alır. Sessiz otomatik onay dardır: yalnızca yerel veya paylaşılan kimlik bilgilerine sahip olduğunu zaten kanıtlamış güvenilir tarayıcı dışı yerel yeniden bağlanmalara uygulanır; buna OS sürümü meta veri değişikliklerinden sonra aynı host yerel uygulama yeniden bağlanmaları dahildir. Tarayıcı/Control UI istemcileri ve uzak istemciler hâlâ açık yeniden onay akışını kullanır. Kapsam yükseltmeleri (okumadan yazma/admin'e) ve açık anahtar değişiklikleri meta veri yükseltmesi otomatik onayı için **uygun değildir** — bunlar açık yeniden onay istekleri olarak kalır.

## QR eşleştirme yardımcıları

`/pair qr`, mobil ve tarayıcı istemcilerinin doğrudan tarayabilmesi için eşleştirme yükünü yapılandırılmış medya olarak işler.

Bir cihazı silmek, o cihaz id'si için eski bekleyen eşleştirme isteklerini de temizler; böylece `nodes pending`, iptal sonrasında sahipsiz satırlar göstermez.

## Yerellik ve iletilmiş başlıklar

Gateway eşleştirmesi, bir bağlantıyı yalnızca hem ham soket hem de herhangi bir üst proxy kanıtı aynı fikirde olduğunda loopback olarak ele alır. Bir istek loopback üzerinden gelir ancak yerel olmayan bir kaynağa işaret eden `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` başlıkları taşıyorsa, bu iletilmiş başlık kanıtı loopback yerellik iddiasını geçersiz kılar. Eşleştirme yolu daha sonra isteği sessizce aynı host bağlantısı olarak ele almak yerine açık onay gerektirir. Operatör kimlik doğrulamasındaki eşdeğer kural için [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth) bölümüne bakın.

## Depolama (yerel, özel)

Eşleştirme durumu Gateway durum dizini altında saklanır (varsayılan `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR` değerini geçersiz kılarsanız, `nodes/` klasörü de onunla birlikte taşınır.

Güvenlik notları:

- Token'lar gizlidir; `paired.json` dosyasını hassas kabul edin.
- Bir token'ı döndürmek yeniden onay (veya Node girdisinin silinmesi) gerektirir.

## Aktarım davranışı

- Aktarım **durumsuzdur**; üyeliği saklamaz.
- Gateway çevrimdışıysa veya eşleştirme devre dışıysa, Node'lar eşleşemez.
- Gateway uzak moddaysa, eşleştirme yine uzak Gateway'in deposuna karşı gerçekleşir.

## İlgili

- [Kanal eşleştirmesi](/tr/channels/pairing)
- [Node'lar](/tr/nodes)
- [Cihazlar CLI](/tr/cli/devices)
