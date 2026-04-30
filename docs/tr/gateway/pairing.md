---
read_when:
    - macOS kullanıcı arayüzü olmadan Node eşleştirme onaylarını uygulama
    - Uzak düğümleri onaylamak için CLI akışları ekleme
    - Gateway protokolünü düğüm yönetimiyle genişletme
summary: iOS ve diğer uzak Node'lar için Gateway'e ait Node eşleştirmesi (Seçenek B)
title: Gateway'e ait eşleştirme
x-i18n:
    generated_at: "2026-04-30T09:24:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c662b8f5c1bb44cfc306d42ae19ba1c8bc36e0d96130d730b322ee07e02cad8
    source_path: gateway/pairing.md
    workflow: 16
---

Gateway sahipli eşleştirmede, hangi düğümlerin katılmasına izin verildiği için doğruluk kaynağı **Gateway**’dir. UI’lar (macOS uygulaması, gelecekteki istemciler) bekleyen istekleri onaylayan veya reddeden yalnızca ön yüzlerdir.

**Önemli:** WS düğümleri `connect` sırasında **cihaz eşleştirme** (rol `node`) kullanır. `node.pair.*` ayrı bir eşleştirme deposudur ve WS el sıkışmasını **denetlemez**. Bu akışı yalnızca açıkça `node.pair.*` çağıran istemciler kullanır.

## Kavramlar

- **Bekleyen istek**: Bir düğüm katılmak istedi; onay gerektirir.
- **Eşleştirilmiş düğüm**: Verilmiş bir kimlik doğrulama token’ına sahip onaylı düğüm.
- **Aktarım**: Gateway WS uç noktası istekleri iletir ancak üyeliğe karar vermez. (Eski TCP köprüsü desteği kaldırılmıştır.)

## Eşleştirme nasıl çalışır?

1. Bir düğüm Gateway WS’ye bağlanır ve eşleştirme ister.
2. Gateway bir **bekleyen istek** depolar ve `node.pair.requested` yayar.
3. İsteği onaylar veya reddedersiniz (CLI ya da UI).
4. Onayda Gateway bir **yeni token** verir (yeniden eşleştirmede token’lar döndürülür).
5. Düğüm token’ı kullanarak yeniden bağlanır ve artık “eşleştirilmiş” olur.

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

`nodes status`, eşleştirilmiş/bağlı düğümleri ve yeteneklerini gösterir.

## API yüzeyi (gateway protokolü)

Olaylar:

- `node.pair.requested` — yeni bir bekleyen istek oluşturulduğunda yayılır.
- `node.pair.resolved` — bir istek onaylandığında/reddedildiğinde/süresi dolduğunda yayılır.

Yöntemler:

- `node.pair.request` — bekleyen bir istek oluşturur veya yeniden kullanır.
- `node.pair.list` — bekleyen + eşleştirilmiş düğümleri listeler (`operator.pairing`).
- `node.pair.approve` — bekleyen bir isteği onaylar (token verir).
- `node.pair.reject` — bekleyen bir isteği reddeder.
- `node.pair.remove` — eski bir eşleştirilmiş düğüm girdisini kaldırır.
- `node.pair.verify` — `{ nodeId, token }` doğrular.

Notlar:

- `node.pair.request`, düğüm başına idempotenttir: tekrarlanan çağrılar aynı bekleyen isteği döndürür.
- Aynı bekleyen düğüm için tekrarlanan istekler, depolanan düğüm meta verilerini ve operatör görünürlüğü için izin listesine alınmış en son bildirilen komut anlık görüntüsünü de yeniler.
- Onay **her zaman** yeni bir token üretir; `node.pair.request` içinden hiçbir zaman token döndürülmez.
- İstekler, otomatik onay akışları için ipucu olarak `silent: true` içerebilir.
- `node.pair.approve`, ek onay kapsamlarını zorunlu kılmak için bekleyen isteğin bildirdiği komutları kullanır:
  - komutsuz istek: `operator.pairing`
  - exec olmayan komut isteği: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` isteği:
    `operator.pairing` + `operator.admin`

<Warning>
Düğüm eşleştirme, güven ve kimlik akışının yanı sıra token verme işlemidir. Canlı düğüm komut yüzeyini düğüm başına sabitlemez.

- Canlı düğüm komutları, gateway’in genel düğüm komut ilkesi (`gateway.nodes.allowCommands` ve `denyCommands`) uygulandıktan sonra düğümün bağlantıda bildirdiklerinden gelir.
- Düğüm başına `system.run` izin ve sorma ilkesi eşleştirme kaydında değil, düğümde `exec.approvals.node.*` içinde bulunur.

</Warning>

## Düğüm komutu denetimi (2026.3.31+)

<Warning>
**Kırıcı değişiklik:** `2026.3.31` ile başlayarak, düğüm eşleştirme onaylanana kadar düğüm komutları devre dışıdır. Bildirilen düğüm komutlarını açığa çıkarmak için artık yalnızca cihaz eşleştirme yeterli değildir.
</Warning>

Bir düğüm ilk kez bağlandığında eşleştirme otomatik olarak istenir. Eşleştirme isteği onaylanana kadar, o düğümden gelen tüm bekleyen düğüm komutları filtrelenir ve çalıştırılmaz. Güven eşleştirme onayıyla kurulduktan sonra, düğümün bildirdiği komutlar normal komut ilkesine tabi olarak kullanılabilir hale gelir.

Bunun anlamı:

- Daha önce komutları açığa çıkarmak için yalnızca cihaz eşleştirmeye güvenen düğümler artık düğüm eşleştirmeyi tamamlamalıdır.
- Eşleştirme onayından önce kuyruğa alınan komutlar ertelenmez, bırakılır.

## Düğüm olayı güven sınırları (2026.3.31+)

<Warning>
**Kırıcı değişiklik:** Düğüm kaynaklı çalıştırmalar artık azaltılmış güvenilir yüzeyde kalır.
</Warning>

Düğüm kaynaklı özetler ve ilgili oturum olayları, hedeflenen güvenilir yüzeyle sınırlandırılır. Daha önce daha geniş host veya oturum aracı erişimine dayanan bildirim odaklı ya da düğüm tetikli akışların ayarlanması gerekebilir. Bu güçlendirme, düğüm olaylarının düğümün güven sınırının izin verdiğinin ötesinde host düzeyi araç erişimine yükselmesini engeller.

Kalıcı düğüm varlık güncellemeleri aynı kimlik sınırını izler. `node.presence.alive` olayı
yalnızca kimliği doğrulanmış düğüm cihaz oturumlarından kabul edilir ve eşleştirme meta verilerini yalnızca
cihaz/düğüm kimliği zaten eşleştirilmişse günceller. Kendi bildirdiği `client.id` değerleri,
son görülme durumunu yazmak için yeterli değildir.

## Otomatik onay (macOS uygulaması)

macOS uygulaması şu durumlarda isteğe bağlı olarak **sessiz onay** denemesi yapabilir:

- istek `silent` olarak işaretlenmişse ve
- uygulama, aynı kullanıcıyı kullanarak gateway host’una SSH bağlantısını doğrulayabiliyorsa.

Sessiz onay başarısız olursa normal “Onayla/Reddet” istemine geri döner.

## Güvenilir CIDR cihaz otomatik onayı

`role: node` için WS cihaz eşleştirme varsayılan olarak manuel kalır. Gateway’in ağ yoluna zaten güvendiği özel
düğüm ağlarında operatörler, açık CIDR’ler veya tam IP’ler ile bunu etkinleştirebilir:

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
- Yalnızca istenen kapsamı olmayan yeni `role: node` cihaz eşleştirme uygundur.
- Operatör, tarayıcı, Control UI ve WebChat istemcileri manuel kalır.
- Rol, kapsam, meta veri ve açık anahtar yükseltmeleri manuel kalır.
- Aynı host local loopback güvenilir proxy header yolları uygun değildir çünkü bu
  yol yerel çağıranlar tarafından sahte gösterilebilir.

## Meta veri yükseltme otomatik onayı

Zaten eşleştirilmiş bir cihaz yalnızca hassas olmayan meta veri değişiklikleriyle
yeniden bağlandığında (örneğin görüntü adı veya istemci platformu ipuçları), OpenClaw bunu
`metadata-upgrade` olarak ele alır. Sessiz otomatik onay dardır: yalnızca yerel
veya paylaşılan kimlik bilgilerine sahip olduğunu zaten kanıtlamış güvenilir, tarayıcı olmayan yerel yeniden bağlantılara uygulanır;
OS sürümü meta veri değişikliklerinden sonra aynı host yerel uygulama yeniden bağlantıları buna dahildir. Tarayıcı/Control UI istemcileri ve uzak istemciler yine de
açık yeniden onay akışını kullanır. Kapsam yükseltmeleri (okumadan yazma/admin’e) ve
açık anahtar değişiklikleri meta veri yükseltme otomatik onayı için **uygun değildir** —
açık yeniden onay istekleri olarak kalırlar.

## QR eşleştirme yardımcıları

`/pair qr`, mobil ve
tarayıcı istemcilerinin doğrudan tarayabilmesi için eşleştirme yükünü yapılandırılmış medya olarak oluşturur.

Bir cihazı silmek, o
cihaz kimliği için eski bekleyen eşleştirme isteklerini de temizler; böylece `nodes pending`, iptalden sonra sahipsiz satırlar göstermez.

## Yerellik ve iletilen header’lar

Gateway eşleştirme bir bağlantıyı yalnızca ham soket
ve varsa yukarı akış proxy kanıtı aynı fikirde olduğunda loopback olarak ele alır. Bir istek loopback üzerinden gelir ancak
yerel olmayan bir kaynağı işaret eden `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` header’ları
taşırsa, bu iletilen-header kanıtı
loopback yerellik iddiasını geçersiz kılar. Eşleştirme yolu daha sonra isteği sessizce aynı host bağlantısı olarak ele almak yerine açık onay gerektirir. Operatör kimlik doğrulamasındaki eşdeğer kural için
[Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth) bölümüne bakın.

## Depolama (yerel, özel)

Eşleştirme durumu Gateway durum dizini altında depolanır (varsayılan `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR` değerini geçersiz kılarsanız `nodes/` klasörü de onunla birlikte taşınır.

Güvenlik notları:

- Token’lar gizlidir; `paired.json` dosyasını hassas kabul edin.
- Bir token’ı döndürmek yeniden onay (veya düğüm girdisini silme) gerektirir.

## Aktarım davranışı

- Aktarım **durumsuzdur**; üyelik depolamaz.
- Gateway çevrimdışıysa veya eşleştirme devre dışıysa, düğümler eşleştirilemez.
- Gateway uzak moddaysa, eşleştirme yine de uzak Gateway’in deposuna karşı gerçekleşir.

## İlgili

- [Kanal eşleştirme](/tr/channels/pairing)
- [Düğümler](/tr/nodes)
- [Cihazlar CLI](/tr/cli/devices)
