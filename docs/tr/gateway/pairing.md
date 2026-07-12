---
read_when:
    - macOS kullanıcı arayüzü olmadan Node eşleştirme onaylarını uygulama
    - Uzak Node'ları onaylamak için CLI akışları ekleme
    - Gateway protokolünü Node yönetimiyle genişletme
summary: 'Node yetenek onayları: cihaz eşleştirmesinden sonra Node''lar komutları nasıl kullanılabilir hâle getirir?'
title: Node eşleştirme
x-i18n:
    generated_at: "2026-07-12T12:20:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 753b01681fa9be17df853b63210f54374d054a6dde37746a3b5fda69073af71d
    source_path: gateway/pairing.md
    workflow: 16
---

Node eşleştirmenin iki katmanı vardır ve her ikisi de Gateway'in SQLite durum
veritabanındaki eşleştirilmiş cihaz kaydında saklanır:

- **Cihaz eşleştirme** (`node` rolü), `connect` el sıkışmasını denetler. Aşağıdaki
  [Güvenilen CIDR cihaz otomatik onayı](#trusted-cidr-device-auto-approval)
  bölümüne ve [Kanal eşleştirme](/tr/channels/pairing) sayfasına bakın.
- **Node yetenek onayı** (`node.pair.*`), bağlı bir Node'un bildirdiği hangi
  yetenekleri/komutları sunabileceğini denetler. Doğruluk kaynağı Gateway'dir;
  kullanıcı arayüzleri (macOS uygulaması, Control UI), bekleyen istekleri
  onaylayan veya reddeden ön yüzlerdir.

Önceki bağımsız Node eşleştirme deposu (`nodes/paired.json` ve Node başına bir
belirteç; Ocak 2026'da bağlantı yolundan kaldırıldı) artık yoktur: Gateway'ler
başlatma sırasında kalan tüm satırları bir kez cihaz kayıtlarına aktarır ve
eski dosyaları `.migrated` son ekiyle arşivler. Eski TCP köprüsü desteği
kaldırılmıştır.

## Yetenek onayı nasıl çalışır?

1. Bir Node, Gateway WS'ye bağlanır (bu adımı cihaz eşleştirme denetler).
2. Gateway, bildirilen yetenek/komut yüzeyini onaylanmış yüzeyle karşılaştırır;
   yeni veya genişletilmiş yüzeyler, cihaz kaydında bir **bekleyen istek**
   saklar ve `node.pair.requested` olayını yayınlar.
3. İsteği onaylar veya reddedersiniz (CLI ya da kullanıcı arayüzü).
4. Onaya kadar Node komutları filtrelenmiş kalır; onay, normal komut politikasına
   tabi olarak bildirilen yüzeyi kullanıma açar.

Bekleyen istekler, **Node'un son yeniden denemesinden 5 dakika sonra** otomatik
olarak sona erer; etkin biçimde yeniden bağlanan bir Node, her denemede yeni bir
istek (ve onay istemi) oluşturmak yerine tek bekleyen isteğini etkin tutar.

## CLI iş akışı (başsız kullanıma uygun)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status`, eşleştirilmiş/bağlı Node'ları ve yeteneklerini gösterir.

## API yüzeyi (Gateway protokolü)

Olaylar:

- `node.pair.requested` - yeni bir bekleyen istek oluşturulduğunda yayınlanır.
- `node.pair.resolved` - bir istek onaylandığında, reddedildiğinde veya süresi
  dolduğunda yayınlanır.

Yöntemler:

- `node.pair.list` - bekleyen ve eşleştirilmiş Node'ları listeler
  (`operator.pairing`).
- `node.pair.approve` - bekleyen bir isteği onaylar.
- `node.pair.reject` - bekleyen bir isteği reddeder.
- `node.pair.remove` - eşleştirilmiş bir Node'u kaldırır. Bu işlem,
  eşleştirilmiş cihaz deposundaki cihazın `node` rolünü iptal eder, onaylanmış
  Node yüzeyini onunla birlikte kaldırır ve cihazın Node rolüne ait oturumları
  geçersiz kılar/bağlantısını keser. **Karma rollü** bir cihaz (örneğin ayrıca
  `operator` rolüne sahip olan), satırını korur ve yalnızca `node` rolünü
  kaybeder; yalnızca Node rolüne sahip bir cihazın satırı silinir.
  Yetkilendirme: `operator.pairing`, operatör olmayan Node satırlarını
  kaldırabilir; karma rollü bir cihazda **kendi** Node rolünü iptal eden
  cihaz belirteci çağırıcısı ayrıca `operator.admin` yetkisine ihtiyaç duyar.
- `node.rename` - eşleştirilmiş bir Node'un operatöre gösterilen adını yeniden
  adlandırır.

2026.7 sürümünde kaldırıldı: `node.pair.request` ve `node.pair.verify`.
Bekleyen istekler artık Node bağlantıları sırasında Gateway'in kendisi
tarafından oluşturulur ve bunların kullandığı bağımsız Node başına belirteç
artık mevcut değildir; Node kimlik doğrulaması, cihaz eşleştirme belirtecidir.

Notlar:

- Değişmemiş bir yüzeyle yeniden bağlantılar bekleyen isteği yeniden kullanır;
  yinelenen istekler, operatör görünürlüğü için saklanan Node meta verilerini
  ve izin listesindeki en güncel bildirilmiş komut anlık görüntüsünü yeniler.
- Operatör kapsam düzeyleri ve onay anındaki kontroller
  [Operatör kapsamları](/tr/gateway/operator-scopes) bölümünde özetlenmiştir.
- `node.pair.approve`, ek onay kapsamlarını zorunlu kılmak için bekleyen isteğin
  bildirilmiş komutlarını kullanır:
  - komutsuz istek: `operator.pairing`
  - yürütme dışı komut isteği: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` isteği:
    `operator.pairing` + `operator.admin`

<Warning>
Node eşleştirme onayı, güvenilen yetenek yüzeyini kaydeder. Canlı Node komut yüzeyini Node başına **sabitlemez**.

- Canlı Node komutları, Node'un bağlantı sırasında bildirdiklerinden gelir ve
  Gateway'in genel Node komut politikası (`gateway.nodes.allowCommands` ve
  `denyCommands`) tarafından filtrelenir.
- Node başına `system.run` izin ve sorma politikası, eşleştirme kaydında değil,
  Node üzerindeki `exec.approvals.node.*` altında bulunur.

</Warning>

## Node komutlarının denetlenmesi (2026.3.31+)

<Warning>
**Kırıcı değişiklik:** `2026.3.31` sürümünden itibaren Node eşleştirme onaylanana kadar Node komutları devre dışıdır. Bildirilmiş Node komutlarını kullanıma açmak için artık yalnızca cihaz eşleştirme yeterli değildir.
</Warning>

Bir Node ilk kez bağlandığında eşleştirme otomatik olarak istenir. Bu istek
onaylanana kadar söz konusu Node'dan gelen bekleyen tüm Node komutları
filtrelenir ve yürütülmez. Eşleştirme onaylandıktan sonra Node'un bildirilmiş
komutları, normal komut politikasına tabi olarak kullanılabilir hâle gelir.

Bunun anlamı:

- Daha önce komutları kullanıma açmak için yalnızca cihaz eşleştirmeye güvenen
  Node'ların artık Node eşleştirmeyi de tamamlaması gerekir.
- Eşleştirme onayından önce kuyruğa alınan komutlar ertelenmez, bırakılır.

## Node olaylarının güven sınırları (2026.3.31+)

<Warning>
**Kırıcı değişiklik:** Node kaynaklı çalıştırmalar artık daraltılmış güvenilir bir yüzeyde kalır.
</Warning>

Node kaynaklı özetler ve ilgili oturum olayları, amaçlanan güvenilir yüzeyle
sınırlandırılır. Daha önce daha geniş ana makine veya oturum aracı erişimine
dayanan bildirim güdümlü ya da Node tarafından tetiklenen akışların
ayarlanması gerekebilir. Bu sağlamlaştırma, Node olaylarının Node'un güven
sınırının izin verdiğinin ötesinde ana makine düzeyindeki araç erişimine
yükselmesini önler.

Kalıcı Node mevcudiyeti güncellemeleri aynı kimlik sınırını izler:
`node.presence.alive` olayı yalnızca kimliği doğrulanmış Node cihaz
oturumlarından kabul edilir ve eşleştirme meta verilerini yalnızca cihaz/Node
kimliği zaten eşleştirilmişse günceller. Cihazın kendi bildirdiği bir
`client.id` değeri, son görülme durumunu yazmak için yeterli değildir.

## SSH ile doğrulanmış cihaz otomatik onayı (varsayılan)

Özel/CGNAT adresinden ilk kez yapılan `role: node` cihaz eşleştirmesi, Gateway
**SSH üzerinden makine sahipliğini kanıtlayabildiğinde** otomatik olarak
onaylanır: eşleştirme ana makinesine geri bağlanır (`BatchMode`,
`StrictHostKeyChecking=yes`), orada `openclaw node identity --json` komutunu
çalıştırır ve yalnızca uzaktaki cihaz kimliği ile ortak anahtar bekleyen
istekle tam olarak eşleştiğinde onaylar. Bunu güvenli kılan anahtar
eşleşmesidir: yalnızca erişilebilirlik hiçbir zaman onay sağlamaz; dolayısıyla
aynı NAT'ı kullanan diğer kiracılar, paylaşılan bir ana makinedeki diğer
kullanıcılar ve LAN sahteciliği normal istem akışına yönlendirilir.

Varsayılan olarak etkindir. Tetiklenmesi için gereksinimler:

- Gateway işlemi kullanıcısı (veya `sshVerify.user`), Node ana makinesine
  etkileşimsiz olarak SSH ile bağlanabilir (anahtarlar/aracı; Tailscale SSH de
  çalışır) ve ana makine anahtarına zaten güvenilmektedir.
- Etkileşimsiz `sh -lc` için uzaktaki `PATH` üzerinde `openclaw`
  çözümlenebilmelidir.
- Bağlanan IP, doğrudan (proxy kullanılmayan, local loopback olmayan) özel,
  ULA, bağlantı yerel veya CGNAT adresidir ya da ayarlandığında
  `sshVerify.cidrs` ile eşleşir.
- Güvenilen CIDR onayıyla aynı uygunluk alt sınırı geçerlidir: yalnızca yeni ve
  kapsamsız Node eşleştirme; yükseltmeler, tarayıcılar, Control UI ve WebChat
  her zaman istem gösterir.

Bir yoklama çalışırken Node istemcisine, manuel onay için duraklamak yerine
yeniden denemeyi sürdürmesi (`wait_then_retry`) bildirilir; yoklama başarısız
olursa sonraki deneme normal istem akışına geri döner. Başarısız hedeflere kısa
bir bekleme süresi uygulanır (anahtar uyuşmazlığından sonra 5 dakika).

Onaylanan cihazlar `approvedVia: "ssh-verified"` değerini kaydeder ve ilk
bildirilen yetenek yüzeyleri aynı adımda onaylanır; anahtar eşleşmesi zaten
Node'un operatörün hesabıyla, operatöre ait bir makinede çalıştığını kanıtlar ve
bu, manuel yetenek onayının ileri sürdüğü iddiayla aynıdır. Sonraki yüzey
yükseltmeleri yine istem gösterir.

Sağlamlaştırmak veya devre dışı bırakmak için:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Disable entirely:
        sshVerify: false,
        // ...or scope/tune the probe:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Otomatik onay (macOS uygulaması)

macOS uygulaması, aşağıdaki durumlarda Node yetenek isteklerini **sessizce
onaylamayı** deneyebilir:

- istek `silent` olarak işaretlenmişse (Gateway, cihaz eşleştirme etkileşimsiz
  olarak onaylandığında ilk yetenek yüzeyini sessiz olarak işaretler) ve
- uygulama, aynı kullanıcıyı kullanarak Gateway ana makinesine SSH bağlantısını
  doğrulayabiliyorsa.

Sessiz onay başarısız olursa normal Approve/Reject istemine geri döner.

## Güvenilen CIDR cihaz otomatik onayı

`role: node` için WS cihaz eşleştirmesi varsayılan olarak manuel kalır. Gateway'in
ağ yoluna zaten güvendiği özel Node ağlarında operatörler, açık CIDR'ler veya
tam IP'lerle bunu etkinleştirebilir:

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
- Genel bir LAN veya özel ağ otomatik onay modu yoktur; SSH ile doğrulanmış
  otomatik onay (yukarıda) yalnızca ağ yakınlığı değil, kriptografik bir cihaz
  anahtarı eşleşmesi gerektirir.
- Yalnızca istenen kapsamı olmayan yeni bir `role: node` cihaz eşleştirme
  isteği uygundur.
- Operatör, tarayıcı, Control UI ve WebChat istemcileri manuel kalır.
- Rol, kapsam, meta veri ve ortak anahtar yükseltmeleri manuel kalır.
- Aynı ana makinedeki local loopback güvenilen proxy üstbilgisi yolları uygun
  değildir; çünkü bu yol yerel çağırıcılar tarafından taklit edilebilir.

## Sessiz eşleştirmede yerini alma temizliği

Etkileşimsiz onaylar, kaynaklarını eşleştirilmiş cihaz satırına kaydeder:
aynı ana makine yerel politika onayları `silent`, güvenilen CIDR Node onayları
`trusted-cidr`, SSH ile doğrulanmış Node onayları `ssh-verified` olarak
kaydedilir. Durum dizini geçici olan istemciler (geçici ev dizinleri,
kapsayıcılar, çalıştırma başına korumalı alanlar) her çalıştırmada yeni bir
cihaz anahtar çifti oluşturur ve her çalıştırma yepyeni bir cihaz olarak
sessizce yeniden eşleşir; temizlik yapılmazsa eşleştirilmiş liste her
çalıştırmada bir eski satır büyür.

Gateway, **yerel** bir cihaz eşleştirmesini sessizce onayladığında aynı istemci
kümesine ait (`clientId`, `clientMode` ve görünen ad eşleşen) ve o anda bağlı
olmayan eski `silent` onaylı kayıtları kullanımdan kaldırır. Yerel istemciler
Gateway ana makinesinin kendisinde çalıştığından küme anahtarı farklı bir
makineyle eşleşemez. Kullanımdan kaldırılan satırlar belirteçlerini hemen
kaybeder; eşleşen tüm eski Node eşleştirme girdileri temizlenir ve kaldırma
için bir `node.pair.resolved` olayı yayınlanır.

Sınırlar:

- Yalnızca en son onayı aynı ana makine yerel (`silent`) olan kayıtlar hem
  tetikleyici hem de hedef olarak uygundur. Güvenilen CIDR ve SSH ile
  doğrulanmış eşleştirmeler, görünen meta verilerin makine kimliği olmadığı
  ana makineler arasında gerçekleştiğinden hiçbir zaman otomatik olarak
  kaldırılmaz; bunlar için Control UI temizliğini veya
  `openclaw nodes remove` komutunu kullanın.
- Sahibi tarafından onaylanan ve QR/kurulum kodu (önyükleme) eşleştirmeleri
  hiçbir zaman otomatik olarak kaldırılmaz. Kaynak bilgisi mevcut olmadan önce
  onaylanan kayıtlar, aynı cihaz kimliği daha sonra sessizce yeniden onaylansa
  bile korunur.
- O anda bağlı cihazlar atlanır; böylece ayrı durum dizinlerine sahip eşzamanlı
  yerel oturumlar canlı oldukları sürece belirteçlerini korur. Son bir dakika
  içinde onaylanan kayıtlar da atlanır; böylece eşzamanlı eşleştirme el
  sıkışmaları, bağlantıları kaydedilmeden önce birbirini kullanımdan kaldıramaz.
- Etkilenen istemciler yapıları gereği yereldir; dolayısıyla bir sonraki
  bağlantılarında sessizce yeniden eşleşirler.

## Meta veri yükseltmesinin otomatik onayı

Zaten eşleştirilmiş bir cihaz yalnızca hassas olmayan meta veri
değişiklikleriyle (örneğin görünen ad veya istemci platformu ipuçları) yeniden
bağlandığında OpenClaw bunu bir `metadata-upgrade` olarak ele alır. Sessiz
otomatik onayın kapsamı dardır: yalnızca yerel veya paylaşılan kimlik bilgilerine
sahip olduğunu daha önce kanıtlamış, tarayıcı olmayan güvenilir yerel yeniden
bağlantılara uygulanır; buna işletim sistemi sürümü meta verisi
değişikliklerinden sonra aynı ana makinedeki yerel uygulamanın yeniden
bağlantıları da dahildir. Tarayıcı/Control UI istemcileri ve uzak istemciler
açık yeniden onay akışını kullanmaya devam eder. Kapsam yükseltmeleri (okumadan
yazma/yöneticiye) ve ortak anahtar değişiklikleri, meta veri yükseltmesinin
otomatik onayı için **uygun değildir**; bunlar açık yeniden onay istekleri
olarak kalır.

## QR eşleştirme yardımcıları

`/pair qr`, eşleştirme yükünü yapılandırılmış medya olarak işler; böylece mobil ve
tarayıcı istemcileri bunu doğrudan tarayabilir.

Bir cihaz silindiğinde, o cihaz kimliğine ait bekleyen eski eşleştirme istekleri de
temizlenir; böylece iptal sonrasında `nodes pending` sahipsiz satırlar göstermez.

## Yerellik ve iletilen üstbilgiler

Gateway eşleştirmesi, bir bağlantıyı yalnızca hem ham soket hem de yukarı akış
proxy kanıtı aynı görüşte olduğunda local loopback olarak değerlendirir. Bir istek
local loopback üzerinden gelir ancak `Forwarded`, herhangi bir `X-Forwarded-*`
veya `X-Real-IP` üstbilgi kanıtı taşırsa bu iletilen üstbilgi kanıtı, local loopback
yerelliği iddiasını geçersiz kılar ve eşleştirme yolu isteği sessizce aynı ana
makineden gelen bir bağlantı olarak değerlendirmek yerine açık onay gerektirir.
Operatör kimlik doğrulamasındaki eşdeğer kural için
[Güvenilen Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth) bölümüne bakın.

## Depolama (yerel, özel)

Eşleştirme durumu, Gateway durum dizini (varsayılan `~/.openclaw`) altındaki
paylaşılan SQLite durum veritabanında, eşleştirilmiş cihaz kayıtlarında tutulur:

- `~/.openclaw/state/openclaw.sqlite` (cihaz kimlik doğrulamasına sahip eşleştirilmiş
  cihazlar, onaylanmış Node yüzeyleri, bekleyen yüzey istekleri, bekleyen cihaz
  eşleştirme istekleri ve önyükleme token'ları)

`OPENCLAW_STATE_DIR` değerini geçersiz kılarsanız veritabanı da onunla birlikte
taşınır. JSON depoları kullanan sürümlerden yükseltilen Gateway'ler, bu depoları
başlangıçta içe aktarır ve geride `devices/*.json.migrated` ile
`nodes/*.json.migrated` arşivlerini bırakır.

Güvenlik notları:

- Cihaz token'ları gizli bilgilerdir; durum veritabanını hassas olarak değerlendirin.
- Bir cihaz token'ı `openclaw devices rotate` /
  `device.token.rotate` kullanılarak döndürülür.

## Aktarım davranışı

- Aktarım **durumsuzdur**; üyelik bilgilerini depolamaz.
- Gateway çevrimdışıysa veya eşleştirme devre dışıysa Node'lar eşleştirilemez.
- Uzak modda eşleştirme, uzak Gateway'in deposu üzerinden gerçekleştirilir.

## İlgili

- [Kanal eşleştirmesi](/tr/channels/pairing)
- [Node CLI](/tr/cli/nodes)
- [Cihazlar CLI](/tr/cli/devices)
