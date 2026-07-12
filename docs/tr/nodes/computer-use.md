---
read_when:
    - Gateway aracısının bir Mac masaüstünü görmesini ve kontrol etmesini sağlama
    - Bilgisayar kullanımı için etkinleştirme, izinler veya güvenlik
    - computer.act Node komutunu veya bu komutu yerine getirenleri genişletme
summary: Computer aracı ve computer.act Node komutu aracılığıyla eşleştirilmiş bir macOS Node'u üzerinde ajan odaklı masaüstü denetimi
title: Bilgisayar kullanımı
x-i18n:
    generated_at: "2026-07-12T11:55:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

Bilgisayar kullanımı, gateway aracısının eşleştirilmiş bir **macOS** masaüstünü görmesini ve denetlemesini sağlar: mevcut `screen.snapshot` Node komutuyla ekran görüntüsü alır ve işaretçi ile klavyeyi tek bir tehlikeli Node komutu olan `computer.act` üzerinden yönetir. Eylem kümesi, temel Anthropic bilgisayar kullanımı eylemlerini izler; isteğe bağlı `computer_20251124` yakınlaştırması kullanıma sunulmaz. Görü özellikli bir model, yerleşik `computer` aracı aracı üzerinden bunu yönetir.

Aracı tek tip bir komut olan `computer.act` komutunu gönderir; bir Node'un bu komutu nasıl yerine getirdiğini bilemez. Bir macOS Node'u, gömülü Peekaboo hizmetleri ve sınırlı CoreGraphics temel işlevleriyle `computer.act` komutunu işlem içinde yerine getirir (doğru TCC izinleri, ek işlem yoktur). Diğer platformlar, aracıya yönelik sözleşmeyi değiştirmeden gelecekte aynı komutu yerine getirebilir.

## Gereksinimler

- Eşleştirilmiş bir **macOS** Node'u (Node modunda çalışan OpenClaw macOS uygulaması).
- macOS uygulamasında **Allow Computer Control** ayarının etkinleştirilmiş olması (varsayılan: kapalı).
- OpenClaw'a macOS **Accessibility** izninin (işaretçi/klavye girdisi için) ve **Screen Recording** izninin (`screen.snapshot` için) verilmiş olması.
- Gateway'de `computer.act` komutunun etkinleştirilmiş olması (tehlikelidir ve varsayılan olarak devre dışıdır).
- Görü özellikli bir aracı modeli.
- `computer` aracını kullanıma sunan araç politikası. Varsayılan `coding` profili bunu sunmaz. `computer` öğesini `tools.alsoAllow` listesine ekleyin; korumalı alan aracıları için ayrıca `tools.sandbox.tools.alsoAllow` listesine de eklenmesi gerekir.

## `computer` aracı aracı

Yerleşik `computer` aracı, çağrı başına bir eylem alır. Koordinatlar, en son ekran görüntüsündeki negatif olmayan tam sayı piksellerdir; Node bunları ekran noktalarına eşler. Koordinat eylemleri, ekran görüntüsü sonucundaki `frameId` değerini aynen geri göndermeli ve açıkça belirtilen bir `screenIndex` bu kareyle eşleşmelidir. OpenClaw ayrıca Node tarafından verilen ekran kimliğini ekran görüntüsünden eyleme taşır; böylece ekranın yeniden bağlanması veya geometrisinin değişmesi, aynı dizini sessizce yeniden hedeflemek yerine işlemi güvenli biçimde başarısız kılar. Bu denetimler, tahmin edilen belirteçleri ve başka bir teslim edilmiş kareye ya da ekrana ait belirteçleri reddeder. Bir belirteç güncellik garantisi değildir: uygulamalar yakalamadan sonra aynı ekrandaki pikselleri değiştirebilir; bu nedenle sahne değişmiş olabilecek her durumda yeni bir ekran görüntüsü alın.

- Okuma: `screenshot`.
- İşaretçi: `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag` (`startCoordinate` ile), `left_mouse_down`, `left_mouse_up`.
- Kaydırma: `scrollDirection` (`up|down|left|right`) ve `scrollAmount` (fare tekerleği kademeleri) ile `scroll`.
- Klavye: `type` (metin), `key` (`cmd+shift+t` veya `Return` gibi bir kombinasyon), `hold_key` (`duration` saniye boyunca basılı tutulan `text` kombinasyonu).
- Tempo: `wait` (`duration` saniye).

Değiştirici tuşlar, tıklama ve kaydırma eylemlerindeki `text` alanında iletilir (`shift`, `ctrl`, `alt`, `cmd`). Bir giriş eyleminden sonra araç, modelin sonucu gözlemleyebilmesi için yeni bir ekran görüntüsü döndürür. Bilgisayar özelliğine sahip birden fazla Node bağlıysa `node` parametresini açıkça geçirin.

Ekran görüntüleri **yalnızca modele özel** tutulur: sohbet kanalına hiçbir zaman otomatik olarak teslim edilmezler. Ekrandaki tüm içerikleri güvenilmeyen girdi olarak değerlendirin; araç, kullanıcı isteğiyle çelişen ekran talimatlarını izlememesi için modeli uyarır.

## `computer.act` Node komutu

`computer.act`, aracın girdiyi yönlendirdiği tek Node komutudur (`command: "computer.act"` ile `node.invoke`). Şu özelliklere sahiptir:

- **Varsayılan olarak tehlikelidir**: yerleşik tehlikeli Node komutları arasında listelenir ve açıkça etkinleştirilene kadar çalışma zamanı izin listesinin dışında tutulur. Bir macOS Node'u, yüzeyin bir kez onaylanabilmesi için eşleştirme sırasında yine de bunu bildirebilir.
- Günümüzde **yalnızca macOS'ta** kullanılabilir: yalnızca **Allow Computer Control** etkinleştirilmiş bir macOS Node'u tarafından duyurulur.

Okuma işlemleri `screen.snapshot` komutunu yeniden kullanır; ikinci bir yakalama yolu yoktur. Paylaşılan yakalama komutu için [Kamera ve ekran Node'ları](/tr/nodes/camera) bölümüne bakın.

## Etkinleştirme ve kullanıma açma

1. macOS uygulamasında **Settings → Allow Computer Control** seçeneğini etkinleştirin. Ardından **Settings → Permissions** bölümünü açın ve macOS Sistem Ayarları'nda **Accessibility** ile **Screen Recording** izinlerini verin.
2. Gateway'deki eşleştirme güncellemesini onaylayın (yeni bir komut yeniden eşleştirmeyi zorunlu kılar).
3. Aracı, görü özellikli aracıya sunun. Varsayılan `coding` profili için:

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // Korumalı alan aracıları için bu ikinci geçit de gereklidir:
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. `computer.act` komutunu sınırlı bir süre için kullanıma açın. `phone-control` Plugin'i bir `computer` grubu sunar:

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   Kullanıma açma işlemi `operator.admin` yetkisi (veya sahip) gerektirir ve otomatik olarak sona erer. Eski `/phone arm all` grubu, masaüstü denetimini kasıtlı olarak hariç tutar; açık `computer` grubunu kullanın. Kullanıma açma yalnızca Gateway'in neleri çağırabileceğini değiştirir; macOS uygulaması kendi **Allow Computer Control** ayarını ve işletim sistemi izinlerini uygulamaya devam eder.

Kalıcı yetkilendirme için `computer.act` öğesini `gateway.nodes.allowCommands` listesine ekleyin **ve** `gateway.nodes.denyCommands` listesinden kaldırın; engelleme listesi önceliklidir. Kalıcı yetkilendirme otomatik olarak sona ermez. `/phone arm` öncesinde zaten mevcut olan girdiler, `/phone disarm` sonrasında kalır; geçici bir izni kullanıma açıkken kalıcı izne dönüştürmeyin.

Yetkilendirme, etkinleştirme ile kullanım arasında bilinçli olarak ayrılmıştır. `computer.act` komutunu kullanıma açmak veya kalıcı olarak yapılandırmak yönetici yetkisi gerektirir. Kullanıma açıldıktan sonra, `operator.write` yetkisine sahip kimliği doğrulanmış bir operatör, izin süresi dolana veya devre dışı bırakılana kadar `node.invoke` üzerinden `computer.act` komutunu çağırabilir; eylem başına yönetici denetimi yoktur. `computer.act` bildiren bir Node'un onaylanması, yalnızca yüzeyi daha sonra kullanıma açılabilmesi için kaydeder ve çağrıyı tek başına etkinleştirmez.

## Güvenlik

- Yetkilendirmeden önce her katman (araç politikası, Gateway komut politikası, macOS ayarı, Accessibility ve Screen Recording) aynı fikirde olmalıdır. Kullanıma açıldıktan sonra eylemler, süre dolana veya `/phone disarm` çalıştırılana kadar eylem başına onay olmadan yürütülür.
- Metin girdisi her seferinde bir grafem olarak gönderilir. İptal, bağlantının kesilmesi, duraklatma, devre dışı bırakma veya uç noktanın değiştirilmesi, eski kalan kısmın devam etmesine izin vermek yerine işlemi bir sonraki grafemden önce durdurur.
- Ekran görüntüleri yalnızca modele özeldir ve hiçbir zaman sohbete otomatik olarak gönderilmez (sorun [#44759](https://github.com/openclaw/openclaw/issues/44759)).
- Ekran içeriğini güvenilmeyen olarak değerlendirin; istem enjeksiyonu içerebilir.

## Diğer masaüstü denetimi yollarıyla ilişkisi

Bu, aracı tarafından yönetilen yoldur. PeekabooBridge ana makinesi, Codex Computer Use ve doğrudan `cua-driver` MCP ile ilişkisi için [Peekaboo köprüsü](/tr/platforms/mac/peekaboo) bölümüne bakın.
