---
read_when:
    - iOS Node'unu eşleştirme veya yeniden bağlama
    - Doğrudan Apple Watch Node'unu etkinleştirme veya sorunlarını giderme
    - iOS uygulamasını kaynak koddan çalıştırma
    - Gateway keşfinde veya canvas komutlarında hata ayıklama
summary: 'iOS Node uygulaması: Gateway''e bağlanma, eşleştirme, tuval ve sorun giderme'
title: iOS uygulaması
x-i18n:
    generated_at: "2026-07-16T17:17:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7db2f099602435837cc18fcd3e7670067d4b58b6cdb6f6502704a1565d1d1c61
    source_path: platforms/ios.md
    workflow: 16
---

Kullanılabilirlik: iPhone uygulaması derlemeleri, bir sürüm için etkinleştirildiğinde Apple kanalları üzerinden dağıtılır. Yerel geliştirme derlemeleri de kaynak koddan çalıştırılabilir.

## Ne işe yarar

- WebSocket üzerinden (LAN veya tailnet) bir Gateway'e bağlanır.
- Node yeteneklerini kullanıma sunar: Canvas, ekran anlık görüntüsü, kamera yakalama, konum, konuşma modu, sesle uyandırma ve isteğe bağlı Sağlık özetleri.
- `node.invoke` komutlarını alır ve Node durum olaylarını bildirir.
- Agents yüzeyinden (Files) seçili aracının çalışma alanına salt okunur olarak göz atar: dizinlerde ayrıntıya inme, söz dizimi vurgulamalı metin önizlemeleri, görüntü önizlemeleri ve paylaşım sayfasına aktarma. Yazma işlemi yoktur; önizlemelerin boyutu Gateway tarafından sınırlandırılır.
- Eşleştirilmiş her Gateway için son sohbet oturumlarının ve dökümlerinin küçük, salt okunur bir çevrimdışı önbelleğini tutar: soğuk açılışlarda bilinen son döküm hemen gösterilir ve Gateway yanıt verdiğinde yenilenir, bağlantı kesikken son sohbetlere göz atılabilir ve sıfırlama/unutma işlemi korumalı yerel önbelleği temizler.
- Bağlantı kesikken gönderilen metin mesajlarını Gateway başına kalıcı bir giden kutusunda sıraya alır (en fazla 50): sıradaki baloncuklar dökümde gösterilir, yeniden bağlanıldığında eş etkili yeniden denemelerle sırayla gönderilir, kurallı geçmiş gönderimi doğrulayana kadar kalıcı olarak tutulur, yeniden deneme/silme eylemi gösterilmeden önce artan bekleme süreleriyle yeniden denenir ve 48 saat çevrimdışı kaldıktan sonra gönderilmek yerine zaman aşımına uğrar; sıfırlama/unutma işlemi önbellekle birlikte kuyruğu da temizler.
- İstek üzerine asistan mesajlarını seslendirir: Chat'te bir mesaja uzun basın ve **Dinle**'yi seçin. Uygulama, yapılandırılmış TTS sağlayıcısıyla desteklenen Gateway `tts.speak` kliplerini oynatır; Gateway sesi kullanılamadığında veya oynatılamadığında cihaz üzerindeki konuşma özelliğine geri döner. Oturum değiştirildiğinde veya uygulama arka plana alındığında oynatma durur.

## Gereksinimler

- Başka bir cihazda çalışan Gateway (macOS, Linux veya WSL2 üzerinden Windows).
- Ağ yolu:
  - Bonjour üzerinden aynı LAN, **veya**
  - Tek noktaya yayın DNS-SD üzerinden tailnet (örnek alan adı: `openclaw.internal.`), **veya**
  - Elle girilen ana makine/bağlantı noktası (geri dönüş).

## Hızlı başlangıç (eşleştirme + bağlanma)

Uygulama ilk başlatıldığında kısa bir eşleştirme açıklaması ve
izinler sayfası (bildirimler, kamera, mikrofon, fotoğraflar, kişiler,
takvim, anımsatıcılar, konum) gösterir. Her iznin verilmesi isteğe bağlıdır ve
daha sonra **Settings** -> **Permissions** bölümünden veya iOS Settings uygulamasından
değiştirilebilir.

1. Telefonunuzun erişebildiği bir yolla kimliği doğrulanmış bir Gateway başlatın. Önerilen uzak yol Tailscale
   Serve'dür:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Güvenilir bir aynı LAN kurulumu için bunun yerine kimliği doğrulanmış bir `gateway.bind: "lan"`
kullanın. Varsayılan geri döngü bağlamasına telefondan erişilemez. Gateway
henüz yapılandırılmadıysa kurulum kodu oluşturma işleminin bir token veya parola
kimlik doğrulama yolu olması için önce `openclaw onboard` komutunu çalıştırın.

2. [Control UI](/tr/web/control-ui) arayüzünü açın, **Nodes**'u seçin ve
   **Devices** sayfasındaki **Pair mobile device** düğmesine tıklayın. Tam erişim önerilir
   ve varsayılan olarak seçilidir; yalnızca yönetimsel Gateway denetimlerini
   hariç tutmak istediğinizde Limited access'i seçin, ardından **Create setup code** düğmesine tıklayın.

3. iOS uygulamasında **Settings** -> **Gateway** bölümünü açın, QR kodunu tarayın (veya
   kurulum kodunu yapıştırın) ve bağlanın.

   Kurulum kodu hem LAN hem de Tailscale Serve yollarını içeriyorsa uygulama
   bunları sırayla yoklar ve erişilebilen ilk uç noktayı kaydeder.

4. Resmî uygulama otomatik olarak bağlanır. **Pending approval** bir
   istek gösterirse onaylamadan önce rolünü ve kapsamlarını inceleyin.

   **Settings → Gateway**, kaydedilmiş operatör bağlantısının
   **Full** veya **Limited** erişime sahip olup olmadığını gösterir. Düz metin LAN `ws://` kurulumu,
   taşıyıcı token güvenliği için otomatik olarak sınırlandırılır. Sınırlıysa `wss://`
   veya Tailscale Serve'ü yapılandırın, Control UI ya da `openclaw qr` üzerinden yeni bir tam erişim kodunu tarayın,
   ardından ayarları ve yükseltmeleri etkinleştirmek için yeniden bağlanın.

Control UI düğmesi, `operator.admin` ile önceden eşleştirilmiş bir oturum gerektirir.
Terminal üzerinden geri dönüş olarak iOS uygulamasında keşfedilmiş bir Gateway seçin (veya
Manual Host'u etkinleştirip ana makineyi/bağlantı noktasını girin), ardından isteği Gateway ana makinesinde onaylayın:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Uygulama, değiştirilmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/ortak anahtar) eşleştirmeyi yeniden denerse önceki bekleyen isteğin yerini yenisi alır ve yeni bir `requestId` oluşturulur. Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

İsteğe bağlı: iOS Node her zaman sıkı denetimli bir alt ağdan bağlanıyorsa açık CIDR'ler veya tam IP'lerle ilk eşleştirmede Node'un otomatik onaylanmasını etkinleştirebilirsiniz:

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

Bu özellik varsayılan olarak devre dışıdır. Yalnızca istenen kapsam içermeyen yeni `role: node` eşleştirmelerine uygulanır. Operatör/tarayıcı eşleştirmesi ve rol, kapsam, meta veri veya ortak anahtardaki herhangi bir değişiklik yine elle onay gerektirir.

5. Bağlantıyı doğrulayın:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Sağlık özetleri

iOS Node, geçerli takvim günü için isteğe bağlı ve salt okunur bir HealthKit
toplamı döndürebilir. iPhone onayı ve açık Gateway komut yetkilendirmesi
birbirinden bağımsız denetimlerdir. Kurulum, çağırma, yük alanları, gizlilik davranışı
ve sorun giderme için [HealthKit özetleri](/platforms/ios-healthkit) bölümüne bakın.

Apple Watch yardımcı uygulaması varsayılan olarak mevcut iPhone aktarmasını kullanmaya devam eder ve
ayrı bir Gateway eşleştirmesi gerektirmez. Apple'ın Watch uygulamasında Watch'u iPhone ile eşleştirin,
**Watch app -> My Watch -> Available
Apps** bölümünden OpenClaw'u yükleyin, ardından OpenClaw'u her iki cihazda da bir kez açın.

## Komut onaylarını inceleme

`operator.admin` kapsamına sahip bir operatör bağlantısı veya Gateway tarafından açıkça hedeflenen,
eşleştirilmiş bir `operator.approvals` bağlantısı, iPhone'da
bekleyen yürütme isteklerini inceleyebilir. Onay kartında Gateway'in
temizlenmiş komut önizlemesi, uyarısı, ana makine bağlamı, sona erme zamanı ve yalnızca
ilgili isteğin sunduğu kararlar gösterilir. Eşleştirilmiş Apple Watch, mevcut
iPhone aktarması üzerinden inceleyen kişi için güvenli olan aynı istemi alır ve kompakt
bir kez izin ver/reddet kararları alt kümesini sunar. Doğrudan Watch Gateway modu
onay istemlerini taşımaz.

Onay durumu Control UI ve desteklenen sohbet yüzeyleriyle paylaşılır. İlk
kaydedilen yanıt geçerli olur. iPhone ve Watch; başka bir yüzey isteği çözdükten,
uzaktan çözüldü bildirimi geldikten ve çözüm onayının
kaybolmuş olabileceği her durumda Gateway'in kurallı terminal kaydını getirir.
Bu geri okuma, isteğin hâlâ beklemede olup olmadığını doğrulayana kadar eylemler kullanılamaz.

Onay sahipliği seçili Gateway'e bağlıdır. Gateway'ler arasında geçiş yapmak,
eski bir istemin yeni bağlantıya uygulanmasına izin vermez. Birleşik onay yöntemlerinden
önceki Gateway'ler, dağıtılmış yürütmeye özgü yöntemlere geri döner;
korunan terminal durumu ve daha zengin yüzeyler arası sonuçlar için güncel bir
Gateway gerekir.

## İsteğe bağlı doğrudan Apple Watch Node

Doğrudan mod, Watch'a kendi imzalı Node kimliğini ve Gateway bağlantısını verir.
Desteklenen Node komutları, eşleştirilmiş iPhone kullanılamadığında bile
OpenClaw etkin olduğu sürece Watch Wi-Fi veya hücresel bağlantısı üzerinden çalışmayı sürdürür.

Gereksinimler:

- iPhone, `operator.admin` kapsamıyla Gateway'e bağlıdır.
- Kurulum kodu, watchOS tarafından güvenilen bir sertifikaya sahip `wss://` Gateway uç noktasını duyurur;
  Watch karşılık gelen `https://` kaynağını yoklar. Düz HTTP ile
  kendinden imzalı veya yalnızca parmak izi temelli güven desteklenmez. Uç nokta yapılandırması için
  [Gateway tarafından yönetilen eşleştirme](/tr/gateway/pairing) bölümüne bakın. Geri döngü, yalnızca iPhone
  ve yalnızca tailnet yollarına Watch tarafından bağımsız olarak erişilemez.
- Hücresel kullanım, etkin hizmete sahip hücresel özellikli bir Apple Watch gerektirir.
- OpenClaw Watch'ta etkindir. Apple, sıradan watchOS uygulamalarının
  genel WebSocket/TCP bağlantılarını açık tutmasına izin vermez; bu nedenle doğrudan Node kısa HTTPS
  yoklamaları kullanır ve uygulama yeniden ön plana geldiğinde yeniden bağlanır. Apple'ın
  [watchOS düşük düzeyli ağ kılavuzuna](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS) bakın.

Kurulum:

1. iPhone'da **Settings -> Apple Watch** bölümünü açın.
2. __Enable Direct Gateway Connection** seçeneğine dokunun.
3. Kısa ömürlü kurulum kodunun süresi dolmadan Watch'ta OpenClaw'u açın.
4. `openclaw nodes status` ile ayrı Apple Watch satırını doğrulayın.

Kurulum kodu, kısa ömürlü ve yalnızca Node'a özel bir önyükleme kimlik bilgisi içerir;
süresi dolana kadar bunu parola gibi koruyun. Kod hiçbir zaman iPhone'un kaydedilmiş Gateway
parolasını veya token'ını içermez. Eşleştirmeden sonra Watch kendi cihaz token'ını saklar ve
önyükleme kimlik bilgisini siler. Doğrudan mod yalnızca aşağıdaki komutları kapsar.
Chat, Talk, onaylar ve mevcut `watch.*` bildirim akışı
iPhone aktarma özellikleri olarak kalır ve eşleştirilmiş iPhone'u gerektirmeye devam eder.

Doğrudan watchOS Node komutları:

| Yüzey        | Komutlar                       | Notlar                                                   |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| Cihaz        | `device.info`, `device.status` | Watch kimliği, pil, termal durum, depolama ve ağ. |
| Bildirimler | `system.notify`                | Uygulama etkinken; Watch izni gerektirir.     |

watchOS, WebKit'i üçüncü taraf uygulamalara sunmadığından doğrudan Watch Node
Canvas komutlarını duyurmaz.

## Resmî derlemeler için aktarma destekli anlık bildirim

Resmî olarak dağıtılan iOS derlemeleri, ham APNs token'ını Gateway'de yayımlamak yerine harici bir anlık bildirim aktarması kullanır. Genel sürüm kanalındaki resmî App Store derlemeleri, `https://ios-push-relay.openclaw.ai` adresindeki barındırılan aktarmayı kullanır; bu temel URL, App Store dağıtımı için koda gömülüdür ve hiçbir geçersiz kılma değerini okumaz.

Özel aktarma dağıtımları, aktarma URL'sinin Gateway aktarma URL'siyle eşleştiği, bilinçli olarak ayrı tutulmuş bir iOS derleme/dağıtım yolu gerektirir. App Store sürüm kanalı hiçbir zaman özel bir aktarma URL'sini kabul etmez. Özel bir aktarma derlemesi kullanıyorsanız eşleşen Gateway aktarma URL'sini ayarlayın:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Akışın işleyişi:

- iOS uygulaması, App Attest ve StoreKit uygulama işlemi JWS'si kullanarak aktarmaya kaydolur.
- Aktarma, opak bir aktarma tanıtıcısı ve kayıt kapsamlı bir gönderme izni döndürür.
- iOS uygulaması eşleştirilmiş Gateway kimliğini (`gateway.identity.get`) getirir ve aktarma kaydına ekler; böylece aktarma destekli kayıt söz konusu Gateway'e devredilir.
- Uygulama, aktarma destekli bu kaydı `push.apns.register` ile eşleştirilmiş Gateway'e iletir.
- Gateway, `push.test`, arka planda uyandırmalar ve uyandırma dürtmeleri için bu saklanan aktarma tanıtıcısını kullanır.
- Uygulama daha sonra farklı bir Gateway'e veya farklı bir aktarma temel URL'sine sahip bir derlemeye bağlanırsa eski bağlamayı yeniden kullanmak yerine aktarma kaydını yeniler.

Gateway'in bu yol için **gereksinim duymadığı** öğeler: dağıtım genelinde aktarma token'ı yoktur; resmî App Store aktarma destekli gönderimleri için doğrudan APNs anahtarı yoktur.

Beklenen operatör akışı:

1. Resmî iOS uygulamasını yükleyin.
2. İsteğe bağlı: yalnızca bilinçli olarak ayrı tutulmuş özel bir aktarma derlemesi kullanırken Gateway'de `gateway.push.apns.relay.baseUrl` değerini ayarlayın.
3. Uygulamayı Gateway ile eşleştirin ve bağlantıyı tamamlamasını bekleyin.
4. Uygulama; bir APNs token'ı olduğunda, operatör oturumu bağlandığında ve aktarma kaydı başarılı olduğunda `push.apns.register` değerini yayımlar.
5. Bundan sonra `push.test`, yeniden bağlanma uyandırmaları ve uyandırma dürtmeleri, saklanan aktarma destekli kaydı kullanabilir.

## Arka planda canlılık işaretleri

iOS uygulamayı sessiz anlık bildirim, arka planda yenileme veya önemli konum değişikliği olayı için uyandırdığında uygulama kısa bir node yeniden bağlantısı kurmayı dener ve ardından `event: "node.presence.alive"` ile `node.event` çağrısını yapar. Gateway bunu, yalnızca kimliği doğrulanmış node cihaz kimliği belirlendikten sonra eşleştirilmiş node/cihaz meta verilerine `lastSeenAtMs`/`lastSeenReason` olarak kaydeder.

Uygulama, arka planda uyandırmayı yalnızca Gateway yanıtı `handled: true` içerdiğinde başarıyla kaydedilmiş sayar. Eski Gateway sürümleri `node.event` isteğini `{ "ok": true }` ile onaylayabilir; bu yanıt uyumludur ancak kalıcı bir son görülme güncellemesi sayılmaz.

Uyumluluk notu:

- `OPENCLAW_APNS_RELAY_BASE_URL`, Gateway için geçici bir ortam değişkeni geçersiz kılması olarak hâlâ çalışır (`gateway.push.apns.relay.baseUrl`, öncelikle yapılandırmayı kullanan yoldur).
- App Store sürüm derlemesinin anlık bildirim modu, barındırılan aktarıcı ana makinesini sabit kodlar ve hiçbir zaman aktarıcı URL'si geçersiz kılmasını okumaz — derleme zamanı ortam değişkeni `OPENCLAW_PUSH_RELAY_BASE_URL` yalnızca yerel/sandbox iOS derleme modlarını etkiler.

## Kimlik doğrulama ve güven akışı

Aktarıcı, doğrudan Gateway üzerinden APNs kullanımının resmî iOS derlemeleri için sağlayamadığı iki kısıtlamayı uygulamak üzere vardır:

- Barındırılan aktarıcıyı yalnızca Apple üzerinden dağıtılan gerçek OpenClaw iOS derlemeleri kullanabilir.
- Bir Gateway, aktarıcı destekli anlık bildirimleri yalnızca söz konusu Gateway ile eşleştirilmiş iOS cihazlarına gönderebilir.

Adım adım:

1. `iOS app -> gateway`: uygulama, normal Gateway kimlik doğrulama akışı üzerinden Gateway ile eşleşerek kimliği doğrulanmış bir node oturumu ve kimliği doğrulanmış bir operatör oturumu edinir. Operatör oturumu `gateway.identity.get` çağrısını yapar.
2. `iOS app -> relay`: uygulama, App Attest kanıtı ve StoreKit uygulama işlemi JWS'siyle HTTPS üzerinden aktarıcı kayıt uç noktalarını çağırır. Aktarıcı; paket kimliğini, App Attest kanıtını ve Apple dağıtım kanıtını doğrular ve resmî/üretim dağıtım yolunu zorunlu kılar — yerel bir derleme resmî Apple dağıtım kanıtını sağlayamadığından, yerel Xcode/geliştirme derlemelerinin barındırılan aktarıcıyı kullanmasını engelleyen budur.
3. `gateway identity delegation`: aktarıcı kaydından önce uygulama, eşleştirilmiş Gateway kimliğini `gateway.identity.get` üzerinden alır ve aktarıcı kayıt yüküne ekler. Aktarıcı, bu Gateway kimliğine devredilmiş bir aktarıcı tanıtıcısı ve kayıt kapsamlı bir gönderme yetkisi döndürür.
4. `gateway -> relay`: Gateway, `push.apns.register` üzerinden gelen aktarıcı tanıtıcısını ve gönderme yetkisini saklar. `push.test`, yeniden bağlantı uyandırmaları ve uyandırma dürtmelerinde Gateway, gönderme isteğini kendi cihaz kimliğiyle imzalar; aktarıcı hem saklanan gönderme yetkisini hem de Gateway imzasını, kayıt sırasında devredilen Gateway kimliğiyle karşılaştırarak doğrular. Başka bir Gateway, tanıtıcıyı bir şekilde ele geçirse bile bu saklanan kaydı yeniden kullanamaz.
5. `relay -> APNs`: aktarıcı, resmî derlemeye ait üretim APNs kimlik bilgilerine ve ham APNs belirtecine sahiptir. Gateway, aktarıcı destekli resmî derlemeler için ham APNs belirtecini hiçbir zaman saklamaz; aktarıcı, eşleştirilmiş Gateway adına son anlık bildirimi APNs'ye gönderir.

Bu tasarımın oluşturulma nedenleri: üretim APNs kimlik bilgilerini kullanıcı Gateway'lerinden uzak tutmak, resmî derlemelerin ham APNs belirteçlerini Gateway üzerinde saklamaktan kaçınmak, barındırılan aktarıcının yalnızca resmî OpenClaw iOS derlemeleri tarafından kullanılmasına izin vermek ve bir Gateway'in farklı bir Gateway'e ait iOS cihazlarına uyandırma bildirimleri göndermesini önlemek.

Yerel/manuel derlemeler doğrudan APNs kullanmaya devam eder. Bu derlemeleri aktarıcı olmadan test ediyorsanız Gateway yine de doğrudan APNs kimlik bilgilerine ihtiyaç duyar:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Bunlar Fastlane ayarları değil, Gateway ana makinesi çalışma zamanı ortam değişkenleridir. `apps/ios/fastlane/.env` yalnızca `APP_STORE_CONNECT_KEY_ID` ve `APP_STORE_CONNECT_ISSUER_ID` gibi App Store Connect kimlik doğrulama bilgilerini saklar; yerel iOS derlemeleri için doğrudan APNs teslimini yapılandırmaz.

`~/.openclaw/credentials/` altındaki diğer sağlayıcı kimlik bilgileriyle uyumlu, önerilen Gateway ana makinesi depolama yöntemi:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` dosyasını commit etmeyin veya depo çalışma kopyasının altına yerleştirmeyin.

## Keşif yolları

### Bonjour (LAN)

iOS uygulaması, `local.` üzerinde `_openclaw-gw._tcp` hizmetini ve yapılandırıldığında aynı geniş alan DNS-SD keşif etki alanını tarar. Aynı LAN'daki Gateway'ler `local.` üzerinden otomatik olarak görünür; ağlar arası keşif, işaret türünü değiştirmeden yapılandırılmış geniş alan etki alanını kullanabilir.

### Tailnet (ağlar arası)

mDNS engelleniyorsa tek noktaya yayın DNS-SD bölgesi (bir etki alanı seçin; örnek: `openclaw.internal.`) ve Tailscale bölünmüş DNS kullanın. CoreDNS örneği için [Bonjour](/tr/gateway/bonjour) sayfasına bakın.

### Manuel ana makine/bağlantı noktası

Settings içinde **Manual Host** seçeneğini etkinleştirin ve Gateway ana makinesi ile bağlantı noktasını girin (varsayılan `18789`).

## Birden fazla Gateway

Uygulama, eşleştirildiği her Gateway'in kaydını tutar; böylece yeniden eşleştirme yapmadan aralarında geçiş yapabilirsiniz:

- **Settings -> Gateway**, etkin Gateway'in işaretlendiği bir **Paired Gateways** listesi gösterir. Geçiş yapmak için bir girdiye dokunun; uygulama mevcut oturumları kapatır ve seçilen Gateway'e yeniden bağlanır. Birden fazla Gateway eşleştirildiğinde bağlantı satırının yanında hızlı geçiş menüsü görünür.
- Kimlik bilgileri, TLS güven kararları, Gateway başına tercihler ve önbelleğe alınmış sohbet geçmişi her Gateway için ayrı saklanır. Geçiş sırasında Gateway'ler arasındaki durum hiçbir zaman karıştırılmaz ve anlık bildirim kaydı etkin Gateway'i izler.
- Eşleştirilmiş bir Gateway'i **Forget** etmek için kaydırın (veya bağlam menüsünü kullanın); bu işlem Gateway'in kimlik bilgilerini, cihaz belirteçlerini, TLS sabitlemesini ve önbelleğe alınmış sohbetlerini kaldırır.
- Keşfedilen Gateway'lere geçiş yapılabilmesi için bunların ağda görünür olması gerekir; manuel Gateway'ler kaydedilmiş ana makine ve bağlantı noktasıyla yeniden bağlanır.

## Canvas + A2UI

iOS node'u bir WKWebView canvas'ı işler. Onu yönetmek için `node.invoke` kullanın:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notlar:

- Gateway canvas ana makinesi, `/__openclaw__/canvas/` ve `/__openclaw__/a2ui/` içeriklerini Gateway HTTP sunucusundan sunar (`gateway.port` ile aynı bağlantı noktası, varsayılan `18789`).
- iOS node'u, yerleşik iskeleti bağlı durumdaki varsayılan görünüm olarak korur. `canvas.a2ui.push` ve `canvas.a2ui.reset`, uygulamanın sahip olduğu paketlenmiş A2UI sayfasını kullanır.
- Uzak Gateway A2UI sayfaları iOS'ta yalnızca görüntülenebilir; yerel A2UI düğme eylemleri yalnızca uygulamanın sahip olduğu paketlenmiş sayfalardan kabul edilir.
- `canvas.navigate` ve `{"url":""}` ile yerleşik iskelete dönün.

## Computer Use ilişkisi

iOS uygulaması bir mobil node yüzeyidir; Codex Computer Use arka ucu değildir. Codex Computer Use ve `cua-driver mcp`, MCP araçları üzerinden yerel bir macOS masaüstünü kontrol eder; iOS uygulaması ise `canvas.*`, `camera.*`, `screen.*`, `location.*` ve `talk.*` gibi OpenClaw node komutları üzerinden iPhone yeteneklerini sunar.

Aracılar, node komutlarını çağırarak iOS uygulamasını OpenClaw üzerinden yine de kullanabilir; ancak bu çağrılar Gateway node protokolü üzerinden geçer ve iOS ön plan/arka plan sınırlarına tabidir. Yerel masaüstü denetimi için [Codex Computer Use](/tr/plugins/codex-computer-use), iOS node yetenekleri için bu sayfayı kullanın.

### Canvas değerlendirmesi / anlık görüntüsü

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Sesle uyandırma + konuşma modu

- Sesle uyandırma ve konuşma modu Settings içinde kullanılabilir.
- OpenAI gerçek zamanlı Talk, `talk.realtime.transport` değeri `webrtc` olduğunda istemcinin sahip olduğu WebRTC'yi kullanır; açık bir `gateway-relay` yapılandırması Gateway'in yönetiminde kalır. Bkz. [Konuşma modu](/tr/nodes/talk).
- Talk özellikli iOS node'ları `talk` yeteneğini duyurur ve `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` ve `talk.ptt.once` bildirimlerinde bulunabilir; Gateway, güvenilir Talk özellikli node'lar için bu bas-konuş komutlarına varsayılan olarak izin verir.
- iOS arka plan sesini askıya alabilir; uygulama etkin değilken ses özelliklerini yalnızca mümkün olduğunda çalışan özellikler olarak değerlendirin.

## Yaygın hatalar

- `NODE_BACKGROUND_UNAVAILABLE`: iOS uygulamasını ön plana getirin (canvas/kamera/ekran komutları bunu gerektirir).
- `A2UI_HOST_UNAVAILABLE`: paketlenmiş A2UI sayfasına uygulamanın WebView'ından erişilemedi; uygulamayı Screen sekmesinde ön planda tutup yeniden deneyin.
- Eşleştirme istemi hiç görünmüyor: `openclaw devices list` komutunu çalıştırın ve manuel olarak onaylayın.
- Watch hiçbir iPhone durumu göstermiyor: iPhone'un `watch.status` içinde `watchPaired: true`
  ve `watchAppInstalled: true` bildirdiğini doğrulayın. Eşleştirme false ise Watch'u
  Apple'ın Watch uygulamasında eşleştirin. Kurulum false ise eşlikçi uygulamayı
  **My Watch -> Available Apps** üzerinden yükleyin. Her iki değişiklikten sonra da
  OpenClaw'u Watch üzerinde bir kez açın; anında erişilebilirlik hâlâ her iki uygulamanın
  çalışıyor olmasını gerektirirken sıraya alınan güncellemeler daha sonra arka planda ulaşabilir.
- Yeniden kurulumdan sonra yeniden bağlantı başarısız oluyor: Keychain eşleştirme belirteci temizlenmiştir; node'u yeniden eşleştirin.

## İlgili belgeler

- [Eşleştirme](/tr/channels/pairing)
- [Keşif](/tr/gateway/discovery)
- [Bonjour](/tr/gateway/bonjour)
