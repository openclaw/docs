---
read_when:
    - macOS kullanıcı arayüzü olmadan Node eşleştirme onaylarını uygulama
    - Uzak Node’ları onaylamak için CLI akışları ekleme
    - Gateway protokolünü node yönetimiyle genişletme
summary: 'Node yetenek onayları: cihaz eşleştirmesinden sonra Node''ların komutları nasıl erişime açtığı'
title: Node eşleştirme
x-i18n:
    generated_at: "2026-07-16T17:08:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4221d7ad6aa6a9cd8ae33f2d4330c2aa49783340fcf7a657c20d6a94c126d9
    source_path: gateway/pairing.md
    workflow: 16
---

Node eşleştirmenin iki katmanı vardır ve her ikisi de Gateway'in SQLite durum veritabanındaki eşleştirilmiş cihaz kaydında saklanır:

- **Cihaz eşleştirme** (`node` rolü), `connect` el sıkışmasını denetler. Aşağıdaki
  [Güvenilir CIDR cihaz otomatik onayı](#trusted-cidr-device-auto-approval)
  bölümüne ve [Kanal eşleştirme](/tr/channels/pairing) bölümüne bakın.
- **Node yetenek onayı** (`node.pair.*`), bağlı bir Node'un bildirdiği
  hangi yetenekleri/komutları sunabileceğini denetler. Doğruluk kaynağı
  Gateway'dir; kullanıcı arayüzleri (macOS uygulaması, Control UI), bekleyen
  istekleri onaylayan veya reddeden ön yüzlerdir.

Önceki bağımsız Node eşleştirme deposu (Node başına bir belirteç içeren
`nodes/paired.json`, Ocak 2026'da bağlantı yolundan kaldırıldı) artık yoktur:
Gateway'ler başlangıçta kalan tüm satırları bir kez cihaz kayıtlarına aktarır
ve eski dosyaları `.migrated` son ekiyle arşivler. Eski TCP köprüsü desteği
kaldırılmıştır.

## Yetenek onayı nasıl çalışır?

1. Bir Node, Gateway WS'ye bağlanır (cihaz eşleştirme bu adımı denetler).
2. Gateway, bildirilen yetenek/komut yüzeyini onaylanmış yüzeyle karşılaştırır;
   yeni veya genişletilmiş yüzeyler, cihaz kaydında bir **bekleyen istek**
   saklar ve `node.pair.requested` olayını yayınlar.
3. İsteği onaylar veya reddedersiniz (CLI ya da kullanıcı arayüzü).
4. Onaylanana kadar Node komutları filtrelenmiş kalır; onay, normal komut
   politikasına tabi olarak bildirilen yüzeyi kullanıma açar.

Bekleyen isteklerin süresi, **Node'un son yeniden denemesinden 5 dakika sonra**
otomatik olarak dolar; etkin biçimde yeniden bağlanmaya çalışan bir Node,
her denemede yeni bir istek (ve onay istemi) oluşturmak yerine tek bekleyen
isteğini etkin tutar.

## CLI iş akışı (başsız kullanıma uygun)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status`, eşleştirilmiş/bağlı Node'ları ve bunların yeteneklerini gösterir.

## API yüzeyi (Gateway protokolü)

Olaylar:

- `node.pair.requested` - yeni bir bekleyen istek oluşturulduğunda yayınlanır.
- `node.pair.resolved` - bir istek onaylandığında, reddedildiğinde veya
  süresi dolduğunda yayınlanır.

Yöntemler:

- `node.pair.list` - bekleyen ve eşleştirilmiş Node'ları listeler (`operator.pairing`).
- `node.pair.approve` - bekleyen bir isteği onaylar.
- `node.pair.reject` - bekleyen bir isteği reddeder.
- `node.pair.remove` - eşleştirilmiş bir Node'u kaldırır. Bu işlem, eşleştirilmiş
  cihaz deposundaki cihazın `node` rolünü iptal eder, onaylanmış Node
  yüzeyini de kaldırır ve bu cihazın Node rolündeki oturumlarını geçersiz
  kılar/bağlantısını keser. **Karma rollü** bir cihaz (örneğin ayrıca
  `operator` rolüne sahip olan bir cihaz), satırını korur ve yalnızca
  `node` rolünü kaybeder; yalnızca Node olan bir cihazın satırı silinir.
  Yetkilendirme: `operator.pairing`, operatör olmayan Node satırlarını kaldırabilir;
  karma rollü bir cihazda **kendi** Node rolünü iptal eden cihaz belirteçli
  çağıran ayrıca `operator.admin` yetkisine ihtiyaç duyar.
- `node.rename` - eşleştirilmiş bir Node'un operatöre gösterilen adını değiştirir.

2026.7 sürümünde kaldırılanlar: `node.pair.request` ve `node.pair.verify`.
Bekleyen istekler Node bağlantıları sırasında Gateway'in kendisi tarafından
oluşturulur ve bunların hizmet ettiği bağımsız Node başına belirteç artık
mevcut değildir; Node kimlik doğrulaması, cihaz eşleştirme belirtecidir.

Notlar:

- Değişmemiş bir yüzeyle yeniden bağlantılar bekleyen isteği yeniden kullanır;
  yinelenen istekler, operatör görünürlüğü için saklanan Node meta verilerini
  ve izin listesindeki en son bildirilmiş komut anlık görüntüsünü yeniler.
- Operatör kapsam düzeyleri ve onay anındaki denetimler
  [Operatör kapsamları](/tr/gateway/operator-scopes) bölümünde özetlenmiştir.
- `node.pair.approve`, ek onay kapsamlarını zorunlu kılmak için bekleyen isteğin
  bildirdiği komutları kullanır:
  - komutsuz istek: `operator.pairing`
  - olağan komut isteği: `operator.pairing` + `operator.write`
  - `system.run`, `system.run.prepare`,
    `system.which`, `browser.proxy`, `fs.listDir` veya
    `system.execApprovals.get/set` içeren yönetici açısından hassas istek:
    `operator.pairing` + `operator.admin`

<Warning>
Node eşleştirme onayı, güvenilen yetenek yüzeyini kaydeder. Canlı Node komut yüzeyini Node başına **sabitlemez**.

- Canlı Node komutları, Node'un bağlantı sırasında bildirdiklerinden gelir ve
  Gateway'in genel Node komut politikası (`gateway.nodes.allowCommands` ve
  `denyCommands`) tarafından filtrelenir.
- Node başına `system.run` izin verme ve sorma politikası, eşleştirme
  kaydında değil, `exec.approvals.node.*` içindeki Node'da bulunur.

</Warning>

## Node komut denetimi (2026.3.31+)

<Warning>
**Uyumsuz değişiklik:** `2026.3.31` sürümünden itibaren Node eşleştirme onaylanana kadar Node komutları devre dışı bırakılır. Bildirilen Node komutlarını sunmak için artık yalnızca cihaz eşleştirme yeterli değildir.
</Warning>

Bir Node ilk kez bağlandığında eşleştirme otomatik olarak istenir.
Bu istek onaylanana kadar ilgili Node'dan gelen bekleyen tüm Node komutları
filtrelenir ve çalıştırılmaz. Eşleştirme onaylandıktan sonra Node'un bildirdiği
komutlar, normal komut politikasına tabi olarak kullanılabilir hâle gelir.

Bunun anlamı şudur:

- Daha önce komutları sunmak için yalnızca cihaz eşleştirmeye dayanan Node'lar
  artık Node eşleştirmeyi de tamamlamalıdır.
- Eşleştirme onayından önce kuyruğa alınan komutlar ertelenmez, bırakılır.

## Node olayı güven sınırları (2026.3.31+)

<Warning>
**Uyumsuz değişiklik:** Node kaynaklı çalıştırmalar artık daraltılmış bir güvenilen yüzeyde kalır.
</Warning>

Node kaynaklı özetler ve ilgili oturum olayları, amaçlanan güvenilen yüzeyle
sınırlandırılır. Daha önce daha geniş ana makine veya oturum aracı erişimine
dayanan bildirim güdümlü ya da Node tarafından tetiklenen akışların
ayarlanması gerekebilir. Bu sağlamlaştırma, Node olaylarının Node'un güven
sınırının izin verdiğinin ötesinde ana makine düzeyinde araç erişimine
yükselmesini önler.

Kalıcı Node mevcudiyeti güncellemeleri de aynı kimlik sınırını izler:
`node.presence.alive` olayı yalnızca kimliği doğrulanmış Node cihaz oturumlarından
kabul edilir ve eşleştirme meta verilerini yalnızca cihaz/Node kimliği zaten
eşleştirilmişse günceller. Kendisi tarafından bildirilen bir
`client.id` değeri, son görülme durumunu yazmak için yeterli değildir.

## SSH ile doğrulanan cihaz otomatik onayı (varsayılan)

Özel/CGNAT adresinden ilk kez yapılan `role: node` cihaz eşleştirmesi,
Gateway **SSH üzerinden makine sahipliğini kanıtlayabildiğinde** otomatik
olarak onaylanır: eşleştirme ana makinesine (`BatchMode`,
`StrictHostKeyChecking=yes`) geri bağlanır, orada `openclaw node identity --json` komutunu çalıştırır
ve yalnızca uzak cihaz kimliği ile ortak anahtar bekleyen istekle tam olarak
eşleştiğinde onaylar. Bunu güvenli kılan anahtar eşleşmesidir: yalnızca
erişilebilirlik hiçbir zaman onay sağlamaz; dolayısıyla aynı NAT'ı kullanan
diğer kiracılar, paylaşılan bir ana makinedeki diğer kullanıcılar ve LAN
sahteciliği normal istem akışına düşer.

Varsayılan olarak etkindir. Çalışması için gereksinimler:

- Gateway işlemi kullanıcısı (veya `sshVerify.user`), Node ana makinesine
  etkileşimsiz olarak SSH ile bağlanabilmelidir (anahtarlar/aracı; Tailscale
  SSH de çalışır) ve ana makine anahtarına önceden güvenilmiş olmalıdır.
- `openclaw`, etkileşimsiz `sh -lc` için uzak
  `PATH` üzerinde çözümlenir.
- Bağlanan IP doğrudan (proxy'siz, geri döngü olmayan) bir özel, ULA,
  bağlantı yerel veya CGNAT adresidir ya da ayarlandığında
  `sshVerify.cidrs` ile eşleşir.
- Güvenilir CIDR onayıyla aynı uygunluk alt sınırı geçerlidir: yalnızca
  kapsamsız yeni Node eşleştirme; yükseltmeler, tarayıcılar, Control UI ve
  WebChat her zaman istem gösterir.

Bir yoklama çalışırken Node istemcisine, elle onay için duraklamak yerine
yeniden denemeye devam etmesi (`wait_then_retry`) bildirilir; yoklama başarısız
olursa sonraki deneme normal istem akışına geri döner. Başarısız hedeflere kısa
bir bekleme süresi uygulanır (anahtar uyuşmazlığından sonra 5 dakika).

Onaylanan cihazlar `approvedVia: "ssh-verified"` bilgisini kaydeder ve ilk bildirdikleri
yetenek yüzeyi aynı adımda onaylanır; anahtar eşleşmesi, Node'un operatörün
sahip olduğu bir makinede operatör hesabıyla çalıştığını zaten kanıtlar ve bu,
elle verilen bir yetenek onayının ileri sürdüğü iddiayla aynıdır. Sonraki yüzey
yükseltmeleri yine istem gösterir.

Sağlamlaştırmak veya devre dışı bırakmak için:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Tamamen devre dışı bırak:
        sshVerify: false,
        // ...veya yoklamanın kapsamını ayarla/ince ayar yap:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Otomatik onay (macOS uygulaması)

macOS uygulaması, aşağıdaki durumlarda Node yetenek isteklerini **sessizce
onaylamayı** deneyebilir:

- istek `silent` olarak işaretlenmişse (cihaz eşleştirme etkileşimsiz
  olarak onaylandığında Gateway ilk yetenek yüzeyini sessiz olarak işaretler) ve
- uygulama aynı kullanıcıyı kullanarak Gateway ana makinesine SSH bağlantısını
  doğrulayabiliyorsa.

Sessiz onay başarısız olursa normal Approve/Reject istemine geri döner.

## Güvenilir CIDR cihaz otomatik onayı

`role: node` için WS cihaz eşleştirme varsayılan olarak elle yapılır. Gateway'in
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
- Genel bir LAN veya özel ağ otomatik onay modu yoktur; SSH ile doğrulanan
  otomatik onay (yukarıda) yalnızca ağ yakınlığına değil, kriptografik bir
  cihaz anahtarı eşleşmesine ihtiyaç duyar.
- Yalnızca istenen kapsamı olmayan yeni bir `role: node` cihaz eşleştirme
  isteği uygundur.
- Operatör, tarayıcı, Control UI ve WebChat istemcileri elle onaylanmaya
  devam eder.
- Rol, kapsam, meta veri ve ortak anahtar yükseltmeleri elle yapılmaya devam eder.
- Aynı ana makinedeki geri döngü güvenilir proxy üst bilgisi yolları uygun
  değildir; çünkü bu yol yerel çağıranlar tarafından taklit edilebilir.

## Sessiz eşleştirmede eski kayıtları geçersiz kılma temizliği

Etkileşimsiz onaylar, kaynaklarını eşleştirilmiş cihaz satırına kaydeder:
aynı ana makine yerel politika onayları `silent`, güvenilir CIDR Node
onayları `trusted-cidr`, SSH ile doğrulanan Node onayları
`ssh-verified` olarak kaydedilir. Durum dizini geçici olan istemciler (geçici
ana dizinler, kapsayıcılar, çalıştırma başına korumalı alanlar), her çalıştırmada
yeni bir cihaz anahtar çifti oluşturur ve her çalıştırma sessizce yepyeni bir
cihaz olarak yeniden eşleştirilir; temizleme olmadan eşleştirilmişler listesi,
her çalıştırmada bir eski satır büyür.

Gateway bir **yerel** cihaz eşleştirmesini sessizce onayladığında, aynı istemci
kümesine ait olan (`clientId`, `clientMode` ve görünen ad eşleşir)
ve o anda bağlı olmayan eski `silent` onaylı kayıtları kullanımdan
kaldırır. Yerel istemciler doğrudan Gateway ana makinesinde çalıştığından küme
anahtarı farklı bir makineyle eşleşemez. Kullanımdan kaldırılan satırların
belirteçleri hemen geçersiz hâle gelir; eşleşen eski Node eşleştirme girdileri
temizlenir ve bir `node.pair.resolved` kaldırma olayı yayınlanır.

Sınırlar:

- Yalnızca en son onayı aynı ana makinede yerel (`silent`) olan kayıtlar,
  hem tetikleyici hem de hedef olarak uygundur. Güvenilir CIDR ve SSH ile doğrulanmış eşleştirmeler,
  görüntüleme meta verilerinin makine kimliği olmadığı ana makineler arasında gerçekleştiğinden
  hiçbir zaman otomatik olarak kaldırılmaz — bunlar için Control UI temizliğini veya
  `openclaw nodes remove` kullanın.
- Sahibi tarafından onaylanan ve QR/kurulum koduyla (önyükleme) yapılan eşleştirmeler hiçbir zaman
  otomatik olarak kaldırılmaz. Kaynak bilgisi mevcut olmadan önce onaylanan kayıtlar,
  aynı cihaz kimliği daha sonra sessizce yeniden onaylansa bile korunmaya devam eder.
- Hâlihazırda bağlı cihazlar atlanır; böylece ayrı durum dizinlerine sahip
  eşzamanlı yerel oturumlar, etkin oldukları sürece token'larını korur. Son bir dakika
  içinde onaylanan kayıtlar da atlanır; böylece eşzamanlı eşleştirme el sıkışmaları,
  bağlantıları kaydedilmeden önce birbirini devre dışı bırakamaz.
- Etkilenen istemciler yapıları gereği yereldir; bu nedenle bir sonraki
  bağlantılarında sessizce yeniden eşleşirler.

## Meta veri yükseltmelerinin otomatik onayı

Daha önce eşleştirilmiş bir cihaz yalnızca hassas olmayan meta veri
değişiklikleriyle (örneğin görünen ad veya istemci platformu ipuçları) yeniden
bağlandığında OpenClaw bunu bir `metadata-upgrade` olarak değerlendirir. Sessiz otomatik onayın
kapsamı dardır: yalnızca yerel veya paylaşılan kimlik bilgilerine sahip olduğunu
önceden kanıtlamış, tarayıcı dışındaki güvenilir yerel yeniden bağlantılar için
geçerlidir; buna işletim sistemi sürümü meta verisi değişikliklerinden sonra aynı
ana makinedeki yerel uygulamanın yeniden bağlanması da dahildir. Tarayıcı/Control UI
istemcileri ve uzak istemciler açık yeniden onay akışını kullanmaya devam eder.
Kapsam yükseltmeleri (okumadan yazma/yönetici düzeyine) ve genel anahtar değişiklikleri,
meta veri yükseltmelerinin otomatik onayı için **uygun değildir**; bunlar açık yeniden
onay istekleri olarak kalır.

## QR eşleştirme yardımcıları

`/pair qr`, eşleştirme yükünü yapılandırılmış medya olarak işler; böylece mobil ve
tarayıcı istemcileri bunu doğrudan tarayabilir.

Bir cihaz silindiğinde o cihaz kimliğine ait bekleyen eski eşleştirme istekleri de
temizlenir; böylece `nodes pending`, iptal işleminden sonra sahipsiz satırlar göstermez.

## Yerellik ve iletilen üstbilgiler

Gateway eşleştirmesi, bir bağlantıyı yalnızca hem ham soket hem de yukarı akış proxy
kanıtı aynı görüşte olduğunda geri döngü olarak değerlendirir. Bir istek geri döngü
üzerinden geliyor ancak `Forwarded`, herhangi bir `X-Forwarded-*` veya
`X-Real-IP` üstbilgi kanıtı taşıyorsa bu iletilen üstbilgi kanıtı, geri döngü yerelliği
iddiasını geçersiz kılar ve eşleştirme yolu isteği sessizce aynı ana makine bağlantısı
olarak değerlendirmek yerine açık onay gerektirir. Operatör kimlik doğrulamasına ilişkin
eşdeğer kural için
[Güvenilir Proxy Kimlik Doğrulaması](/tr/gateway/trusted-proxy-auth) bölümüne bakın.

## Depolama (yerel, özel)

Eşleştirme durumu, Gateway durum dizini altındaki paylaşılan SQLite durum
veritabanında bulunan eşleştirilmiş cihaz kayıtlarında tutulur (varsayılan
`~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (cihaz kimlik doğrulamasına sahip eşleştirilmiş cihazlar,
  onaylanmış Node yüzeyleri, bekleyen yüzey istekleri, bekleyen cihaz eşleştirme
  istekleri ve önyükleme token'ları)

`OPENCLAW_STATE_DIR` değerini geçersiz kılarsanız veritabanı da onunla birlikte taşınır.
JSON depolarının kullanıldığı sürümlerden yükseltilen Gateway'ler, bu depoları başlangıçta
içe aktarır ve geride `devices/*.json.migrated` ile `nodes/*.json.migrated` arşivlerini bırakır.

Güvenlik notları:

- Cihaz token'ları gizli bilgilerdir; durum veritabanını hassas olarak değerlendirin.
- Bir cihaz token'ı `openclaw devices rotate` /
  `device.token.rotate` kullanılarak döndürülür.

## Aktarım davranışı

- Aktarım **durumsuzdur**; üyelik bilgilerini depolamaz.
- Gateway çevrimdışıysa veya eşleştirme devre dışıysa Node'lar eşleşemez.
- Uzak modda eşleştirme, uzak Gateway'in deposunda gerçekleştirilir.

## İlgili

- [Kanal eşleştirmesi](/tr/channels/pairing)
- [Node CLI](/tr/cli/nodes)
- [Cihazlar CLI](/tr/cli/devices)
