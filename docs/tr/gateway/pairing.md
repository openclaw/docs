---
read_when:
    - macOS UI olmadan düğüm eşleştirme onaylarını uygulama
    - Uzak düğümleri onaylamak için CLI akışları ekleme
    - Gateway protokolünü düğüm yönetimiyle genişletme
summary: 'Gateway’e ait düğüm eşleştirme (Seçenek B): iOS ve diğer uzak düğümler için'
title: Gateway’e ait eşleştirme
x-i18n:
    generated_at: "2026-06-28T00:37:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aefddafaef419fc59b04ee17dae8ef21685b4f514f4286530bf07362663a8996
    source_path: gateway/pairing.md
    workflow: 16
---

Gateway sahipli eşlemede, hangi düğümlerin katılmasına izin verildiği konusunda doğruluk kaynağı **Gateway**'dir. UI'lar (macOS uygulaması, gelecekteki istemciler) yalnızca bekleyen istekleri onaylayan veya reddeden ön uçlardır.

**Önemli:** WS düğümleri `connect` sırasında **cihaz eşlemesi** (rol `node`) kullanır. `node.pair.*` ayrı bir eşleme deposudur ve WS el sıkışmasını kapılamaz. Bu akışı yalnızca açıkça `node.pair.*` çağıran istemciler kullanır.

## Kavramlar

- **Bekleyen istek**: bir düğüm katılmak istedi; onay gerektirir.
- **Eşlenmiş düğüm**: verilmiş bir kimlik doğrulama token'ı olan onaylanmış düğüm.
- **Taşıma**: Gateway WS uç noktası istekleri iletir ancak üyeliğe karar vermez. (Eski TCP köprüsü desteği kaldırıldı.)

## Eşleme nasıl çalışır?

1. Bir düğüm Gateway WS'ye bağlanır ve eşleme ister.
2. Gateway bir **bekleyen istek** depolar ve `node.pair.requested` yayar.
3. İsteği onaylar veya reddedersiniz (CLI ya da UI).
4. Onaylandığında Gateway bir **yeni token** verir (yeniden eşlemede token'lar döndürülür).
5. Düğüm token'ı kullanarak yeniden bağlanır ve artık "eşlenmiştir".

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

`nodes status` eşlenmiş/bağlı düğümleri ve yeteneklerini gösterir.

## API yüzeyi (Gateway protokolü)

Olaylar:

- `node.pair.requested` - yeni bir bekleyen istek oluşturulduğunda yayılır.
- `node.pair.resolved` - bir istek onaylandığında/reddedildiğinde/süresi dolduğunda yayılır.

Yöntemler:

- `node.pair.request` - bir bekleyen istek oluşturur veya yeniden kullanır.
- `node.pair.list` - bekleyen + eşlenmiş düğümleri listeler (`operator.pairing`).
- `node.pair.approve` - bir bekleyen isteği onaylar (token verir).
- `node.pair.reject` - bir bekleyen isteği reddeder.
- `node.pair.remove` - eşlenmiş bir düğümü kaldırır. Cihaz destekli eşlemelerde bu, cihazın `node` rolünü iptal eder: `devices/paired.json` dosyasını değiştirir ve bu cihazın düğüm rolü oturumlarını geçersiz kılar/bağlantısını keser. Bir **karma rollü** cihaz (ör. ayrıca `operator` da taşıyorsa) satırını korur ve yalnızca `node` rolünü kaybeder; yalnızca düğüm olan cihaz satırı silinir. Ayrıca eşleşen tüm eski Gateway sahipli düğüm eşleme girdilerini kaldırır. Yetkilendirme: `operator.pairing`, operatör olmayan düğüm satırlarını kaldırabilir; karma rollü bir cihazda **kendi** düğüm rolünü iptal eden cihaz-token çağıranı ayrıca `operator.admin` gerektirir.
- `node.pair.verify` - `{ nodeId, token }` doğrular.

Notlar:

- `node.pair.request` düğüm başına idempotenttir: yinelenen çağrılar aynı bekleyen isteği döndürür.
- Aynı bekleyen düğüm için yinelenen istekler, depolanan düğüm metadata'sını ve operatör görünürlüğü için en son izin listesine alınmış bildirilen komut anlık görüntüsünü de yeniler.
- Onay **her zaman** yeni bir token üretir; `node.pair.request` üzerinden hiçbir zaman token döndürülmez.
- Operatör kapsam düzeyleri ve onay zamanı denetimleri [Operatör kapsamları](/tr/gateway/operator-scopes) bölümünde özetlenir.
- İstekler, otomatik onay akışları için ipucu olarak `silent: true` içerebilir.
- `node.pair.approve`, ek onay kapsamlarını zorunlu kılmak için bekleyen isteğin bildirilen komutlarını kullanır:
  - komutsuz istek: `operator.pairing`
  - exec olmayan komut isteği: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` isteği:
    `operator.pairing` + `operator.admin`

<Warning>
Düğüm eşleme, token verme ile birlikte bir güven ve kimlik akışıdır. Canlı düğüm komut yüzeyini düğüm başına sabitlemez.

- Canlı düğüm komutları, Gateway'in genel düğüm komut ilkesi (`gateway.nodes.allowCommands` ve `denyCommands`) uygulandıktan sonra düğümün bağlanırken bildirdiklerinden gelir.
- Düğüm başına `system.run` izin verme ve sorma ilkesi, eşleme kaydında değil, düğümde `exec.approvals.node.*` içinde bulunur.

</Warning>

## Düğüm komut kapılaması (2026.3.31+)

<Warning>
**Kırıcı değişiklik:** `2026.3.31` itibarıyla, düğüm eşlemesi onaylanana kadar düğüm komutları devre dışıdır. Yalnızca cihaz eşlemesi artık bildirilen düğüm komutlarını açığa çıkarmak için yeterli değildir.
</Warning>

Bir düğüm ilk kez bağlandığında, eşleme otomatik olarak istenir. Eşleme isteği onaylanana kadar, o düğümden gelen tüm bekleyen düğüm komutları filtrelenir ve yürütülmez. Eşleme onayıyla güven kurulduktan sonra, düğümün bildirdiği komutlar normal komut ilkesine tabi olarak kullanılabilir hale gelir.

Bu şu anlama gelir:

- Daha önce komutları açığa çıkarmak için yalnızca cihaz eşlemesine dayanan düğümler artık düğüm eşlemesini tamamlamalıdır.
- Eşleme onayından önce kuyruğa alınan komutlar ertelenmez, düşürülür.

## Düğüm olayı güven sınırları (2026.3.31+)

<Warning>
**Kırıcı değişiklik:** Düğüm kaynaklı çalıştırmalar artık azaltılmış güvenilir yüzeyde kalır.
</Warning>

Düğüm kaynaklı özetler ve ilgili oturum olayları, amaçlanan güvenilir yüzeyle sınırlandırılır. Daha önce daha geniş ana makine veya oturum aracı erişimine dayanan bildirim odaklı ya da düğüm tetiklemeli akışların ayarlanması gerekebilir. Bu sıkılaştırma, düğüm olaylarının düğümün güven sınırının izin verdiğinin ötesinde ana makine düzeyinde araç erişimine yükselmesini engeller.

Kalıcı düğüm varlığı güncellemeleri aynı kimlik sınırını izler. `node.presence.alive` olayı yalnızca kimliği doğrulanmış düğüm cihaz oturumlarından kabul edilir ve eşleme metadata'sını yalnızca cihaz/düğüm kimliği zaten eşlenmişse günceller. Kendi bildirdiği `client.id` değerleri, son görülme durumunu yazmak için yeterli değildir.

## Otomatik onay (macOS uygulaması)

macOS uygulaması şu durumlarda isteğe bağlı olarak **sessiz onay** deneyebilir:

- istek `silent` olarak işaretlenmişse ve
- uygulama aynı kullanıcıyı kullanarak Gateway ana makinesine SSH bağlantısını doğrulayabiliyorsa.

Sessiz onay başarısız olursa normal "Onayla/Reddet" istemine geri döner.

## Güvenilir CIDR cihaz otomatik onayı

`role: node` için WS cihaz eşlemesi varsayılan olarak manuel kalır. Gateway'in ağ yoluna zaten güvendiği özel düğüm ağlarında operatörler açık CIDR'ler veya tam IP'lerle bunu etkinleştirebilir:

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

- `gateway.nodes.pairing.autoApproveCidrs` ayarlı değilse devre dışıdır.
- Genel LAN veya özel ağ otomatik onay modu yoktur.
- Yalnızca istenen kapsamı olmayan yeni `role: node` cihaz eşlemesi uygundur.
- Operatör, tarayıcı, Control UI ve WebChat istemcileri manuel kalır.
- Rol, kapsam, metadata ve ortak anahtar yükseltmeleri manuel kalır.
- Aynı ana makine loopback güvenilir proxy üstbilgisi yolları uygun değildir çünkü bu yol yerel çağıranlar tarafından taklit edilebilir.

## Metadata yükseltmesi otomatik onayı

Zaten eşlenmiş bir cihaz yalnızca hassas olmayan metadata değişiklikleriyle (örneğin görünen ad veya istemci platformu ipuçları) yeniden bağlandığında, OpenClaw bunu `metadata-upgrade` olarak ele alır. Sessiz otomatik onay dardır: yalnızca yerel veya paylaşılan kimlik bilgilerine sahip olduğunu zaten kanıtlamış güvenilir tarayıcı olmayan yerel yeniden bağlantılar için geçerlidir; buna OS sürümü metadata değişikliklerinden sonra aynı ana makinedeki yerel uygulama yeniden bağlantıları dahildir. Tarayıcı/Control UI istemcileri ve uzak istemciler hâlâ açık yeniden onay akışını kullanır. Kapsam yükseltmeleri (okumadan yazma/admin'e) ve ortak anahtar değişiklikleri metadata yükseltmesi otomatik onayı için **uygun değildir** - bunlar açık yeniden onay istekleri olarak kalır.

## QR eşleme yardımcıları

`/pair qr`, eşleme yükünü yapılandırılmış medya olarak işler; böylece mobil ve tarayıcı istemcileri bunu doğrudan tarayabilir.

Bir cihazın silinmesi, o cihaz kimliği için eskimiş bekleyen eşleme isteklerini de temizler; böylece `nodes pending`, iptalden sonra sahipsiz satırlar göstermez.

## Yerellik ve iletilen üstbilgiler

Gateway eşlemesi, bir bağlantıyı yalnızca hem ham soket hem de varsa yukarı akış proxy kanıtı aynı fikirde olduğunda loopback olarak kabul eder. Bir istek loopback üzerinden gelip `Forwarded`, herhangi bir `X-Forwarded-*` veya `X-Real-IP` üstbilgisi kanıtı taşıyorsa, bu iletilen üstbilgi kanıtı loopback yerellik iddiasını geçersiz kılar. Eşleme yolu daha sonra isteği aynı ana makine bağlantısı olarak sessizce ele almak yerine açık onay gerektirir. Operatör kimlik doğrulamasındaki eşdeğer kural için [Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth) bölümüne bakın.

## Depolama (yerel, özel)

Eşleme durumu Gateway durum dizini altında depolanır (varsayılan `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR` değerini geçersiz kılarsanız, `nodes/` klasörü de onunla birlikte taşınır.

Güvenlik notları:

- Token'lar gizlidir; `paired.json` dosyasını hassas kabul edin.
- Bir token'ı döndürmek yeniden onay gerektirir (veya düğüm girdisini silmeyi).

## Taşıma davranışı

- Taşıma **durumsuzdur**; üyeliği depolamaz.
- Gateway çevrimdışıysa veya eşleme devre dışıysa, düğümler eşlenemez.
- Gateway uzak moddaysa, eşleme yine de uzak Gateway'in deposuna karşı gerçekleşir.

## İlgili

- [Kanal eşlemesi](/tr/channels/pairing)
- [Düğümler](/tr/nodes)
- [Cihazlar CLI](/tr/cli/devices)
