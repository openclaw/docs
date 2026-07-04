---
read_when:
    - Gateway'i bir tarayıcıdan çalıştırmak istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı denetim kullanıcı arayüzü (sohbet, etkinlik, düğümler, yapılandırma)
title: Kontrol Arayüzü
x-i18n:
    generated_at: "2026-07-04T18:18:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00575a4633b192b6121145476c3b15b6b68cfd177322f409cacbb7ef331d09d
    source_path: web/control-ui.md
    workflow: 16
---

Denetim UI'si, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfa uygulamasıdır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` değerini ayarlayın (örn. `/openclaw`)

Aynı bağlantı noktasında **doğrudan Gateway WebSocket** ile konuşur.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenmezse önce Gateway'i başlatın: `openclaw gateway`.

<Note>
Yerel Windows LAN bağlamalarında, `127.0.0.1` Gateway ana makinesinde çalışsa bile Windows Güvenlik Duvarı veya kuruluş tarafından yönetilen Grup İlkesi duyurulan LAN URL'sini hâlâ engelleyebilir. Windows ana makinesinde `openclaw gateway status --deep` çalıştırın; olası engellenmiş bağlantı noktalarını, profil uyumsuzluklarını ve ilkenin yok sayabileceği yerel güvenlik duvarı kurallarını raporlar.
</Note>

Kimlik doğrulama, WebSocket el sıkışması sırasında şunlarla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik başlıkları
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir proxy kimlik başlıkları

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçilen gateway URL'si için bir token tutar; parolalar kalıcı olarak saklanmaz. İlk bağlanmada paylaşılan gizli anahtar kimlik doğrulaması için onboarding genellikle bir gateway token'ı üretir, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Denetim UI'sine yeni bir tarayıcıdan veya cihazdan bağlandığınızda Gateway genellikle **tek seferlik eşleştirme onayı** ister. Bu, yetkisiz erişimi önlemeye yönelik bir güvenlik önlemidir.

**Göreceğiniz şey:** "bağlantı kesildi (1008): eşleştirme gerekli"

<Steps>
  <Step title="Bekleyen istekleri listele">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="İstek kimliğine göre onayla">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Tarayıcı, değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/genel anahtar) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve bunu okuma erişiminden yazma/yönetici erişimine değiştirirseniz bu, sessiz yeniden bağlantı değil bir onay yükseltmesi olarak ele alınır. OpenClaw eski onayı etkin tutar, daha geniş yeniden bağlantıyı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

`openclaw_gateway` adaptörü üzerinden bağlanan Paperclip ajanları aynı ilk çalıştırma onay akışını kullanır. İlk bağlantı denemesinden sonra bekleyen isteği önizlemek için `openclaw devices approve --latest` çalıştırın, ardından onaylamak için yazdırılan `openclaw devices approve <requestId>` komutunu yeniden çalıştırın. Uzak gateway için açık `--url` ve `--token` değerleri geçin. Onayları yeniden başlatmalar arasında kararlı tutmak için Paperclip'te her çalıştırmada yeni bir geçici cihaz kimliği oluşturmasına izin vermek yerine kalıcı bir `adapterConfig.devicePrivateKeyPem` yapılandırın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik olarak onaylanır.
- `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı cihaz kimliğini sunduğunda Tailscale Serve, Denetim UI'si operatör oturumları için eşleştirme gidiş dönüşünü atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri hâlâ açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği üretir; bu nedenle tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

</Note>

## Bir mobil cihaz eşleştirme

Zaten eşleştirilmiş bir yönetici, terminal açmadan iOS/Android bağlantı QR kodunu oluşturabilir:

<Steps>
  <Step title="Mobil eşleştirmeyi aç">
    **Nodes** öğesini seçin, ardından **Devices** kartında **Pair mobile device** seçeneğine tıklayın.
  </Step>
  <Step title="Telefonu bağla">
    OpenClaw mobil uygulamasında **Settings** → **Gateway** bölümünü açın ve QR
    kodunu tarayın. Bunun yerine kurulum kodunu kopyalayıp yapıştırabilirsiniz.
  </Step>
  <Step title="Bağlantıyı doğrula">
    Resmi iOS/Android uygulaması otomatik olarak bağlanır. **Devices** bekleyen
    bir istek gösterirse onaylamadan önce rolünü ve kapsamlarını inceleyin.
  </Step>
</Steps>

Kurulum kodu oluşturmak `operator.admin` gerektirir; buna sahip olmayan oturumlar için düğme devre dışıdır. Kurulum kodu kısa ömürlü bir bootstrap kimlik bilgisi içerir; bu nedenle QR kodunu ve kopyalanan kodu geçerli oldukları sürece parola gibi ele alın. Uzak eşleştirme için Gateway'in `wss://` olarak çözümlenmesi gerekir (örneğin Tailscale Serve/Funnel üzerinden); düz `ws://` loopback ve özel LAN adresleriyle sınırlıdır. Tam güvenlik ve geri dönüş ayrıntıları için [Eşleştirme](/tr/channels/pairing#pair-from-the-control-ui-recommended) bölümüne bakın.

## Kişisel kimlik (tarayıcı-yerel)

Denetim UI'si, paylaşılan oturumlarda atıf için giden iletilere eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Tarayıcı depolamasında yaşar, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz iletilerdeki normal transkript yazarlığı meta verileri dışında diğer cihazlarla eşitlenmez veya sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya tarayıcı değiştirmek bunu boş hale sıfırlar.

Aynı tarayıcı-yerel desen, asistan avatarı geçersiz kılması için de geçerlidir. Yüklenen asistan avatarları, gateway tarafından çözümlenen kimliğin üzerine yalnızca yerel tarayıcıda bindirilir ve hiçbir zaman `config.patch` üzerinden gidiş dönüş yapmaz. Paylaşılan `ui.assistant.avatar` yapılandırma alanı, alanı doğrudan yazan UI dışı istemciler (betiklenmiş gateway'ler veya özel panolar gibi) için hâlâ kullanılabilir.

## Çalışma zamanı yapılandırma uç noktası

Denetim UI'si çalışma zamanı ayarlarını, gateway'in Denetim UI'si temel yoluna göre çözümlenen `/control-ui-config.json` yolundan alır (örneğin UI `/__openclaw__/` altında sunulduğunda `/__openclaw__/control-ui-config.json`). Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı gateway kimlik doğrulaması tarafından korunur: kimliği doğrulanmamış tarayıcılar bunu getiremez ve başarılı bir getirme için zaten geçerli bir gateway token'ı/parolası, Tailscale Serve kimliği veya güvenilir proxy kimliği gerekir.

## Dil desteği

Denetim UI'si ilk yüklemede tarayıcı yerel ayarınıza göre kendini yerelleştirebilir. Daha sonra geçersiz kılmak için **Overview -> Gateway Access -> Language** bölümünü açın. Yerel ayar seçici, Appearance altında değil Gateway Access kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışı çeviriler tarayıcıda tembel yüklenir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve sonraki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Docs çevirileri aynı İngilizce dışı yerel ayar kümesi için oluşturulur, ancak docs sitesinin yerleşik Mintlify dil seçicisi Mintlify tarafından kabul edilen yerel ayar kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) docs hâlâ yayın reposunda oluşturulur; Mintlify bu kodları destekleyene kadar bu seçicide görünmeyebilirler.

## Görünüm temaları

Appearance paneli yerleşik Claw, Knot ve Dash temalarını, ayrıca bir tarayıcı-yerel tweakcn içe aktarma yuvasını tutar. Bir tema içe aktarmak için [tweakcn düzenleyicisini](https://tweakcn.com/editor/theme) açın, bir tema seçin veya oluşturun, **Share** öğesine tıklayın ve kopyalanan tema bağlantısını Appearance içine yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` kayıt URL'lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi düzenleyici URL'lerini, göreli `/themes/<id>` yollarını, ham tema kimliklerini ve `amethyst-haze` gibi varsayılan tema adlarını kabul eder.

Appearance ayrıca tarayıcı-yerel bir Metin boyutu ayarı içerir. Ayar, Denetim UI'si tercihlerinin geri kalanıyla birlikte saklanır; sohbet metnine, oluşturucu metnine, araç kartlarına ve sohbet kenar çubuklarına uygulanır ve mobil Safari'nin odakta otomatik yakınlaştırma yapmaması için metin girişlerini en az 16px tutar.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde saklanır. Gateway yapılandırmasına yazılmaz ve cihazlar arasında eşitlenmez. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; temizlemek, içe aktarılan tema seçiliyse etkin temayı Claw'a geri döndürür.

## Neler yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Sohbet geçmişi yenilemeleri, büyük oturumların sohbet kullanılabilir hale gelmeden önce tarayıcıyı tam transkript yükünü işlemeye zorlamaması için ileti başına metin sınırları olan sınırlı bir yakın dönem penceresi ister.
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden kısıtlı tek kullanımlık bir tarayıcı token'ı kullanır ve yalnızca arka uç gerçek zamanlı ses Plugin'leri Gateway röle aktarımını kullanır. İstemciye ait sağlayıcı oturumları `talk.client.create` ile başlar; Gateway röle oturumları `talk.session.create` ile başlar. Röle, tarayıcı mikrofon PCM'sini `talk.session.appendAudio` üzerinden akıtırken sağlayıcı kimlik bilgilerini Gateway üzerinde tutar, Gateway ilkesi ve daha büyük yapılandırılmış OpenClaw modeli için `openclaw_agent_consult` sağlayıcı araç çağrılarını `talk.client.toolCall` üzerinden iletir ve etkin çalıştırma ses yönlendirmesini `talk.client.steer` veya `talk.session.steer` üzerinden yönlendirir.
    - Sohbet içinde araç çağrılarını + canlı araç çıktı kartlarını akıtın (ajan olayları).
    - Mevcut `session.tool` / araç olayı tesliminden canlı araç etkinliğinin tarayıcı-yerel, redaksiyon-öncelikli özetlerini içeren Activity sekmesi.

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, rüyalar">
    - Kanallar: yerleşik artı paketlenmiş/harici Plugin kanallarının durumu, QR oturum açma ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`).
    - Kanal yoklama yenilemeleri, yavaş sağlayıcı denetimleri tamamlanırken önceki anlık görüntüyü görünür tutar ve bir yoklama veya denetim UI bütçesini aştığında kısmi anlık görüntüler etiketlenir.
    - Örnekler: varlık listesi + yenileme (`system-presence`).
    - Oturumlar: varsayılan olarak yapılandırılmış ajan oturumlarını listeleyin, eski yapılandırılmamış ajan oturumu anahtarlarından geri dönün ve oturum başına model/düşünme/hızlı/ayrıntılı/izleme/akıl yürütme geçersiz kılmalarını uygulayın (`sessions.list`, `sessions.patch`).
    - Rüyalar: dreaming durumu, etkinleştir/devre dışı bırak anahtarı ve Rüya Günlüğü okuyucu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, düğümler, exec onayları">
    - Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalıştırma geçmişi (`cron.*`).
    - Skills: durum, etkinleştir/devre dışı bırak, yükle, API anahtarı güncellemeleri (`skills.*`).
    - Düğümler: liste + yetenekler (`node.list`), mobil kurulum kodları oluşturma ve cihaz eşleştirmeyi onaylama (`device.pair.*`).
    - Exec onayları: gateway veya düğüm izin listelerini düzenleme + `exec host=gateway/node` için sorma ilkesi (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Yapılandırma">
    - `~/.openclaw/openclaw.json` dosyasını görüntüleyin/düzenleyin (`config.get`, `config.set`).
    - MCP, yapılandırılmış sunucular, etkinleştirme, OAuth/filtre/paralel özetleri, yaygın operatör komutları ve kapsamlı `mcp` yapılandırma düzenleyicisi için ayrılmış bir ayarlar sayfasına sahiptir.
    - Doğrulamayla uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazma işlemleri, eşzamanlı düzenlemelerin üzerine yazılmasını önlemek için bir temel karma koruması içerir.
    - Yazma işlemleri (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma yükündeki başvurular için etkin SecretRef çözümlemesini önceden denetler; çözümlenemeyen etkin gönderilmiş başvurular yazmadan önce reddedilir.
    - Form kayıtları, kaydedilmiş gizli değerlere hâlâ eşlenen sansürlenmiş değerleri korurken, kaydedilmiş yapılandırmadan geri yüklenemeyen eski sansürlenmiş yer tutucuları atar.
    - Şema + form işleme (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, doğrudan alt özetleri, iç içe nesne/joker karakter/dizi/bileşim düğümlerindeki doküman meta verileri ve kullanılabildiğinde Plugin + kanal şemaları dahil); Ham JSON düzenleyicisi yalnızca anlık görüntü güvenli bir ham gidiş-dönüşe sahip olduğunda kullanılabilir.
    - Bir anlık görüntü ham metni güvenli şekilde gidiş-dönüş yapamıyorsa, Control UI o anlık görüntü için Form modunu zorlar ve Ham modu devre dışı bırakır.
    - Ham JSON düzenleyicisindeki "Kaydedilene sıfırla", düzleştirilmiş bir anlık görüntüyü yeniden işlemek yerine ham olarak yazılmış şekli (biçimlendirme, yorumlar, `$include` düzeni) korur; böylece anlık görüntü güvenli şekilde gidiş-dönüş yapabildiğinde dış düzenlemeler sıfırlamadan sonra da korunur.
    - Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizgeye bozulmayı önlemek için form metin girişlerinde salt okunur olarak işlenir.

  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/modeller anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Olay günlüğü, Control UI yenileme/RPC zamanlamalarını, yavaş sohbet/yapılandırma işleme zamanlamalarını ve tarayıcı bu PerformanceObserver giriş türlerini sunduğunda uzun animasyon kareleri veya uzun görevler için tarayıcı yanıt verebilirlik girdilerini içerir.
    - Günlükler: filtre/dışa aktarma ile gateway dosya günlüklerinin canlı kuyruğu (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla bir paket/git güncellemesi + yeniden başlatma (`update.run`) çalıştırın, ardından çalışan gateway sürümünü doğrulamak için yeniden bağlandıktan sonra `update.status` durumunu yoklayın.

  </Accordion>
  <Accordion title="Cron işleri panel notları">
    - Yalıtılmış işler için teslimat varsayılan olarak özet duyurusudur. Yalnızca dahili çalıştırmalar istiyorsanız hiçbiri seçeneğine geçebilirsiniz.
    - Duyuru seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) webhook URL'sine ayarlanmış şekilde `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için webhook ve hiçbiri teslimat modları kullanılabilir.
    - Gelişmiş düzenleme denetimleri; çalıştırmadan sonra silme, aracı geçersiz kılmayı temizleme, cron tam/sapmalı seçenekleri, aracı model/düşünme geçersiz kılmaları ve en iyi çaba teslimat anahtarlarını içerir.
    - Form doğrulaması, alan düzeyinde hatalarla satır içindedir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Ayrılmış bir bearer token göndermek için `cron.webhookToken` ayarlayın; atlanırsa webhook kimlik doğrulama başlığı olmadan gönderilir.
    - Kullanımdan kaldırılmış geri dönüş: `notify: true` içeren saklanmış eski işleri `cron.webhook` içinden açık iş başına webhook veya tamamlama teslimatına taşımak için `openclaw doctor --fix` çalıştırın.

  </Accordion>
</AccordionGroup>

## MCP sayfası

Ayrılmış MCP sayfası, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucuları için bir operatör görünümüdür. MCP taşıma katmanlarını kendisi başlatmaz; bunu kaydedilmiş yapılandırmayı incelemek ve düzenlemek için kullanın, ardından canlı sunucu kanıtına ihtiyaç duyduğunuzda `openclaw mcp doctor --probe` kullanın.

Tipik iş akışı:

1. Kenar çubuğundan **MCP** öğesini açın.
2. Toplam, etkin, OAuth ve filtrelenmiş sunucu sayıları için özet kartlarını kontrol edin.
3. Taşıma, etkinleştirme, kimlik doğrulama, filtreler, zaman aşımları ve komut ipuçları için her sunucu satırını gözden geçirin.
4. Bir sunucu yapılandırılmış kalmalı ancak çalışma zamanı keşfine dahil edilmemeliyse etkinleştirmeyi değiştirin.
5. Sunucu tanımları, başlıklar, TLS/mTLS yolları, OAuth meta verileri, araç filtreleri ve Codex projeksiyon meta verileri için kapsamlı `mcp` yapılandırma bölümünü düzenleyin.
6. Yapılandırma yazma için **Kaydet** seçeneğini veya çalışan Gateway değiştirilen yapılandırmayı uygulamalıysa **Kaydet ve Yayımla** seçeneğini kullanın.
7. Düzenlenen süreç statik tanılama, canlı kanıt veya önbelleğe alınmış çalışma zamanının atılması gerektirdiğinde bir terminalden `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` veya `openclaw mcp reload` çalıştırın.

Sayfa, kimlik bilgisi taşıyan URL benzeri değerleri işlemeden önce sansürler ve sunucu adlarını komut parçacıklarında tırnak içine alır; böylece kopyalanan komutlar boşluklar veya kabuk meta karakterleriyle de çalışır. Tam CLI ve yapılandırma başvurusu [MCP](/tr/cli/mcp) içindedir.

## Etkinlik sekmesi

Etkinlik sekmesi, canlı araç etkinliği için tarayıcıya yerel geçici bir gözlemcidir. Sohbet araç kartlarını besleyen aynı Gateway `session.tool` / araç olay akışından türetilir; başka bir Gateway olay ailesi, uç nokta, kalıcı etkinlik deposu, metrik akışı veya harici gözlemci akışı eklemez.

Etkinlik girdileri yalnızca temizlenmiş özetleri ve sansürlenmiş, kısaltılmış çıktı önizlemelerini tutar. Araç argümanı değerleri Etkinlik durumunda saklanmaz; UI, argümanların gizlendiğini gösterir ve yalnızca argüman alanı sayısını kaydeder. Bellek içi liste geçerli tarayıcı sekmesini izler, Control UI içinde gezinme sırasında korunur ve sayfa yeniden yüklendiğinde, oturum değiştirildiğinde veya **Temizle** kullanıldığında sıfırlanır.

## Sohbet davranışı

<AccordionGroup>
  <Accordion title="Gönderme ve geçmiş semantiği">
    - `chat.send` **engelleyici değildir**: hemen `{ runId, status: "started" }` ile onay verir ve yanıt `chat` olayları üzerinden akar. Güvenilen Control UI istemcileri, yerel tanılama için isteğe bağlı ACK zamanlama meta verileri de alabilir.
    - Sohbet yüklemeleri görselleri ve video olmayan dosyaları kabul eder. Görseller yerel görsel yolunu korur; diğer dosyalar yönetilen medya olarak saklanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden gönderme, çalışırken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları UI güvenliği için boyutla sınırlandırılmıştır. Transcript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır meta veri bloklarını atlayabilir ve aşırı büyük iletileri bir yer tutucuyla değiştirebilir (`[chat.history omitted: message too large]`).
    - Görünür bir asistan iletisi `chat.history` içinde kısaltıldığında, yan okuyucu gerektiğinde `sessionKey`, gerektiğinde etkin `agentId` ve transcript `messageId` ile `chat.message.get` üzerinden tam ekran-normalize transcript girdisini getirebilir. Gateway yine daha fazlasını döndüremiyorsa, okuyucu kısaltılmış önizlemeyi sessizce yinelemek yerine açık bir kullanılamaz durumu gösterir.
    - Asistan/üretilmiş görseller yönetilen medya başvuruları olarak kalıcı hale getirilir ve kimliği doğrulanmış Gateway medya URL'leri üzerinden geri sunulur; böylece yeniden yüklemeler ham base64 görsel yüklerinin sohbet geçmişi yanıtında kalmasına bağlı olmaz.
    - `chat.history` işlenirken Control UI, görünür asistan metninden yalnızca görüntüleme amaçlı satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model denetim belirteçlerini çıkarır; görünür metninin tamamı tam sessiz belirteç `NO_REPLY` / `no_reply` veya heartbeat onay belirteci `HEARTBEAT_OK` olan asistan girdilerini atlar.
    - Etkin bir gönderim ve son geçmiş yenilemesi sırasında, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürürse sohbet görünümü yerel iyimser kullanıcı/asistan iletilerini görünür tutar; Gateway geçmişi yetiştiğinde kanonik transcript bu yerel iletilerin yerini alır.
    - Canlı `chat` olayları teslimat durumudur; `chat.history` ise kalıcı oturum transcript'inden yeniden oluşturulur. Araç-son olaylarından sonra Control UI geçmişi yeniden yükler ve yalnızca küçük bir iyimser kuyruğu birleştirir; transcript sınırı [WebChat](/tr/web/webchat) içinde belgelenmiştir.
    - `chat.inject`, oturum transcript'ine bir asistan notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (aracı çalıştırması yok, kanal teslimatı yok).
    - Kenar çubuğu, Yeni Oturum eylemi, Tüm Oturumlar bağlantısı ve tam oturum seçiciyi açan bir oturum arama düğmesiyle son oturumları listeler (seçili aracıya göre kapsamlı, arama ve sayfalama ile). Aracıları değiştirmek yalnızca o aracıya bağlı oturumları gösterir ve henüz kaydedilmiş pano oturumları yoksa o aracının ana oturumuna geri döner.
    - Masaüstü genişliklerinde sohbet denetimleri tek bir kompakt satırda kalır ve transcript aşağı kaydırılırken daralır; yukarı kaydırma, en üste dönme veya en alta ulaşma denetimleri geri getirir.
    - Ardışık yinelenen yalnızca metin iletileri, sayı rozeti olan tek bir balon olarak işlenir. Görseller, ekler, araç çıktısı veya tuval önizlemeleri taşıyan iletiler daraltılmaz.
    - Sohbet başlığı model ve düşünme seçicileri, etkin oturumu `sessions.patch` üzerinden hemen yamalar; bunlar kalıcı oturum geçersiz kılmalarıdır, tek dönüşlük gönderme seçenekleri değildir.
    - Aynı oturum için bir model seçici değişikliği hâlâ kaydedilirken ileti gönderirseniz, oluşturucu `chat.send` çağrısı yapmadan önce o oturum yamasını bekler; böylece gönderim seçilen modeli kullanır.
    - Control UI içinde `/new` yazmak, `session.dmScope: "main"` yapılandırılmış ve geçerli üst oturum aracının ana oturumu değilse Yeni Sohbet ile aynı yeni pano oturumunu oluşturur ve ona geçer; bu durumda ana oturumu yerinde sıfırlar. `/reset` yazmak, geçerli oturum için Gateway'in açık yerinde sıfırlamasını korur.
    - Sohbet model seçici, Gateway'in yapılandırılmış model görünümünü ister. `agents.defaults.models` varsa, bu izin listesi seçiciyi yönlendirir; sağlayıcı kapsamlı katalogları dinamik tutan `provider/*` girdileri dahil. Aksi halde seçici açık `models.providers.*.models` girdilerini ve kullanılabilir kimlik doğrulaması olan sağlayıcıları gösterir. Tam katalog, hata ayıklama `models.list` RPC'si üzerinden `view: "all"` ile kullanılabilir kalır.
    - Taze Gateway oturum kullanım raporları geçerli bağlam belirteçlerini içerdiğinde, sohbet oluşturucu araç çubuğu kullanılan yüzdeyi gösteren küçük bir bağlam kullanım halkası gösterir; tam belirteç ayrıntısı araç ipucunda bulunur. Halka, yüksek bağlam baskısında uyarı stiline geçer ve önerilen Compaction düzeylerinde normal oturum Compaction yolunu çalıştıran kompakt bir düğme gösterir. Eski belirteç anlık görüntüleri, Gateway tekrar taze kullanım bildirene kadar gizlenir.

  </Accordion>
  <Accordion title="Konuşma modu (tarayıcı gerçek zamanlı)">
    Konuşma modu kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. OpenAI'yi `talk.realtime.provider: "openai"` ve bir `openai` API anahtarı kimlik doğrulama profili, `talk.realtime.providers.openai.apiKey` veya `OPENAI_API_KEY` ile yapılandırın; OpenAI OAuth profilleri Realtime sesi yapılandırmaz. Google'ı `talk.realtime.provider: "google"` ve `talk.realtime.providers.google.apiKey` ile yapılandırın. Tarayıcı hiçbir zaman standart bir sağlayıcı API anahtarı almaz. OpenAI, WebRTC için geçici bir Realtime istemci sırrı alır. Google Live, tarayıcı WebSocket oturumu için tek kullanımlık kısıtlı bir Live API kimlik doğrulama belirteci alır; talimatlar ve araç bildirimleri Gateway tarafından belirtece kilitlenir. Yalnızca arka uç gerçek zamanlı köprüsü sunan sağlayıcılar Gateway aktarma taşıması üzerinden çalışır; böylece kimlik bilgileri ve tedarikçi soketleri sunucu tarafında kalırken tarayıcı sesi kimliği doğrulanmış Gateway RPC'leri üzerinden taşınır. Realtime oturum istemi Gateway tarafından birleştirilir; `talk.client.create` çağıranın sağladığı talimat geçersiz kılmalarını kabul etmez.

    Sohbet mesaj yazma alanında, Talk başlat/durdur düğmesinin yanında bir Talk seçenekleri düğmesi bulunur. Seçenekler bir sonraki Talk oturumuna uygulanır ve sağlayıcıyı, aktarımı, modeli, sesi, akıl yürütme çabasını, VAD eşiğini, sessizlik süresini ve önek dolgusunu geçersiz kılabilir. Bir seçenek boş olduğunda Gateway, varsa yapılandırılmış varsayılanları veya sağlayıcı varsayılanını kullanır. Gateway geçişini seçmek arka uç geçiş yolunu zorunlu kılar; WebRTC seçmek oturumu istemci sahipliğinde tutar ve sağlayıcı tarayıcı oturumu oluşturamazsa sessizce geçişe dönmek yerine başarısız olur.

    Sohbet mesaj yazma alanında Talk denetimi, mikrofon dikte düğmesinin yanındaki dalgalar düğmesidir. Talk başladığında, mesaj yazma alanının durum satırı ses bağlıyken önce `Connecting Talk...`, ardından `Talk live`; gerçek zamanlı bir araç çağrısı yapılandırılmış daha büyük modele `talk.client.toolCall` üzerinden danışırken ise `Asking OpenClaw...` gösterir.

    Bakımcı canlı smoke testi: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`, OpenAI arka uç WebSocket köprüsünü, OpenAI tarayıcı WebRTC SDP değişimini, Google Live kısıtlı belirteçli tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway geçişli tarayıcı bağdaştırıcısını doğrular. Komut yalnızca sağlayıcı durumunu yazdırır ve gizli bilgileri günlüğe kaydetmez.

  </Accordion>
  <Accordion title="Stop and abort">
    - **Durdur**'a tıklayın (`chat.abort` çağırır).
    - Bir çalışma etkin durumdayken normal takip iletileri kuyruğa alınır. Bu takip iletisini çalışan tura enjekte etmek için kuyruktaki iletide **Yönlendir**'e tıklayın.
    - Bant dışı iptal etmek için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi bağımsız iptal ifadeleri).
    - `chat.abort`, o oturumun tüm etkin çalışmalarını iptal etmek için `{ sessionKey }` desteği sunar (`runId` olmadan).

  </Accordion>
  <Accordion title="Abort partial retention">
    - Bir çalışma iptal edildiğinde, kısmi asistan metni UI'da yine de gösterilebilir.
    - Gateway, arabelleğe alınmış çıktı varsa iptal edilmiş kısmi asistan metnini transkript geçmişine kalıcı olarak yazar.
    - Kalıcı girdiler iptal meta verileri içerir; böylece transkript tüketicileri iptal kısmi çıktılarını normal tamamlanma çıktısından ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve web anlık iletimi

Control UI, `manifest.webmanifest` ve bir service worker ile gelir; bu nedenle modern tarayıcılar onu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık olmasa bile Gateway'in kurulu PWA'yı bildirimlerle uyandırmasını sağlar.

Sayfa bir OpenClaw güncellemesinden hemen sonra **Protokol uyuşmazlığı** gösterirse, önce panoyu `openclaw dashboard` ile yeniden açın ve sayfayı tam yenileyin. Hâlâ başarısız olursa, pano kaynağı için site verilerini temizleyin veya gizli tarayıcı penceresinde test edin; eski bir sekme veya tarayıcı service-worker önbelleği, daha yeni Gateway'e karşı güncelleme öncesi bir Control UI paketini çalıştırmaya devam edebilir.

| Yüzey                                                | Ne yapar                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                     | PWA manifesti. Erişilebilir olduğunda tarayıcılar "Uygulamayı yükle" seçeneğini sunar. |
| `ui/public/sw.js`                                    | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw durum dizini altında) | Web Push yüklerini imzalamak için kullanılan otomatik oluşturulmuş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                   | Kalıcı tarayıcı aboneliği uç noktaları.                           |

Anahtarları sabitlemek istediğinizde (çok konaklı dağıtımlar, gizli bilgi döndürme veya testler için) Gateway sürecinde env vars üzerinden VAPID anahtar çiftini geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılan: `https://openclaw.ai`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için şu kapsam geçitli Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID ortak anahtarını getirir.
- `push.web.subscribe` — bir `endpoint` ile `keys.p256dh`/`keys.auth` kaydeder.
- `push.web.unsubscribe` — kayıtlı bir uç noktayı kaldırır.
- `push.web.test` — çağıranın aboneliğine bir test bildirimi gönderir.

<Note>
Web Push, iOS APNS geçiş yolundan (geçiş destekli anlık iletim için bkz. [Yapılandırma](/tr/gateway/configuration)) ve yerel mobil eşleştirmeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Barındırılan yerleştirmeler

Asistan iletileri, `[embed ...]` kısa koduyla barındırılan web içeriğini satır içinde oluşturabilir. iframe sandbox ilkesi `gateway.controlUi.embedSandbox` tarafından denetlenir:

<Tabs>
  <Tab title="strict">
    Barındırılan yerleştirmelerde betik yürütmeyi devre dışı bırakır.
  </Tab>
  <Tab title="scripts (default)">
    Kaynak yalıtımını korurken etkileşimli yerleştirmelere izin verir; bu varsayılandır ve genellikle kendi kendine yeten tarayıcı oyunları/widget'ları için yeterlidir.
  </Tab>
  <Tab title="trusted">
    Bilerek daha güçlü ayrıcalıklara ihtiyaç duyan aynı site belgeleri için `allow-scripts` üzerine `allow-same-origin` ekler.
  </Tab>
</Tabs>

Örnek:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
`trusted` değerini yalnızca yerleştirilen belge gerçekten same-origin davranışına ihtiyaç duyduğunda kullanın. Çoğu ajan tarafından oluşturulmuş oyun ve etkileşimli canvas için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` yerleştirme URL'leri varsayılan olarak engelli kalır. `[embed url="https://..."]` öğesinin üçüncü taraf sayfaları yüklemesini bilerek istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Sohbet iletisi genişliği

Gruplanmış sohbet iletileri okunabilir bir varsayılan en büyük genişlik kullanır. Geniş monitörlü dağıtımlar, paketlenmiş CSS'i yamalamadan bunu `gateway.controlUi.chatMessageMaxWidth` ayarlayarak geçersiz kılabilir:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Değer tarayıcıya ulaşmadan önce doğrulanır. Desteklenen değerler arasında `960px` veya `82%` gibi düz uzunluklar ve yüzdeler ile kısıtlı `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` ve `fit-content(...)` genişlik ifadeleri bulunur.

## Tailnet erişimi (önerilir)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Gateway'i loopback üzerinde tutun ve Tailscale Serve'ün onu HTTPS ile proxy etmesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Varsayılan olarak Control UI/WebSocket Serve istekleri, `gateway.auth.allowTailscale` `true` olduğunda Tailscale kimlik başlıkları (`tailscale-user-login`) üzerinden kimlik doğrulayabilir. OpenClaw, `x-forwarded-for` adresini `tailscale whois` ile çözerek ve başlıkla eşleştirerek kimliği doğrular; bunları yalnızca istek Tailscale'in `x-forwarded-*` başlıklarıyla loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliğine sahip Control UI operatör oturumları için bu doğrulanmış Serve yolu cihaz eşleştirme turunu da atlar; cihazsız tarayıcılar ve düğüm rolü bağlantıları normal cihaz denetimlerini izlemeye devam eder. Serve trafiği için bile açık paylaşılan gizli kimlik bilgileri gerektirmek istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu asenkron Serve kimlik yolu için, aynı istemci IP'si ve kimlik doğrulama kapsamındaki başarısız kimlik doğrulama denemeleri, rate-limit yazımlarından önce serileştirilir. Bu nedenle aynı tarayıcıdan gelen eşzamanlı hatalı yeniden denemeler, paralel yarışan iki düz uyuşmazlık yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Belirteçsiz Serve kimlik doğrulaması, gateway konağının güvenilir olduğunu varsayar. Bu konakta güvenilmeyen yerel kod çalışabilecekse token/password kimlik doğrulaması gerektirin.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ardından açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Eşleşen paylaşılan gizli bilgiyi UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvensiz HTTP

Panoyu düz HTTP üzerinden (`http://<lan-ip>` veya `http://<tailscale-ip>`) açarsanız, tarayıcı **güvenli olmayan bağlamda** çalışır ve WebCrypto'yu engeller. Varsayılan olarak OpenClaw, cihaz kimliği olmayan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Control UI kimlik doğrulaması
- acil durum `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI'ı yerelde açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway konağında)

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` yalnızca yerel bir uyumluluk anahtarıdır:

    - Localhost Control UI oturumlarının, güvenli olmayan HTTP bağlamlarında cihaz kimliği olmadan devam etmesine izin verir.
    - Eşleştirme denetimlerini atlamaz.
    - Uzak (localhost olmayan) cihaz kimliği gereksinimlerini gevşetmez.

  </Accordion>
  <Accordion title="Break-glass only">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth`, Control UI cihaz kimliği denetimlerini devre dışı bırakır ve ciddi bir güvenlik düşürmesidir. Acil kullanımdan sonra hızla geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Başarılı trusted-proxy kimlik doğrulaması, cihaz kimliği olmadan **operatör** Control UI oturumlarını kabul edebilir.
    - Bu, düğüm rolü Control UI oturumlarına uzanmaz.
    - Aynı konak loopback ters proxy'leri trusted-proxy kimlik doğrulamasını yine de karşılamaz; bkz. [Trusted proxy auth](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberi için bkz. [Tailscale](/tr/gateway/tailscale).

## İçerik güvenliği ilkesi

Control UI sıkı bir `img-src` ilkesiyle gelir: yalnızca **same-origin** varlıklara, `data:` URL'lerine ve yerel olarak oluşturulmuş `blob:` URL'lerine izin verilir. Uzak `http(s)` ve protokol göreli görsel URL'leri tarayıcı tarafından reddedilir ve ağ getirmeleri başlatmaz.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görseller (örneğin `/avatars/<id>`) yine de oluşturulur; UI'ın getirip yerel `blob:` URL'lerine dönüştürdüğü kimliği doğrulanmış avatar rotaları dahil.
- Satır içi `data:image/...` URL'leri yine de oluşturulur (protokol içi yükler için kullanışlıdır).
- Control UI tarafından oluşturulan yerel `blob:` URL'leri yine de oluşturulur.
- Kanal meta verileri tarafından yayılan uzak avatar URL'leri, Control UI'ın avatar yardımcılarında ayıklanır ve yerleşik logo/rozet ile değiştirilir; böylece ele geçirilmiş veya kötü amaçlı bir kanal, bir operatör tarayıcısından rastgele uzak görsel getirmelerini zorlayamaz.

Bu davranışı elde etmek için hiçbir şeyi değiştirmeniz gerekmez — her zaman açıktır ve yapılandırılamaz.

## Avatar rota kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, Control UI avatar uç noktası API'nin geri kalanıyla aynı gateway token'ını gerektirir:

- `GET /avatar/<agentId>` avatar görselini yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1` avatar meta verilerini aynı kural altında döndürür.
- Her iki rotaya yönelik kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla eşleşir). Bu, avatar rotasının aksi halde korunan konaklarda ajan kimliğini sızdırmasını önler.
- Control UI'ın kendisi, avatarları getirirken gateway token'ını bearer başlığı olarak iletir ve görselin panolarda yine de oluşturulması için kimliği doğrulanmış blob URL'leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan host'larda önerilmez), avatar rotası da Gateway'in geri kalanıyla uyumlu olarak kimlik doğrulamasız hale gelir.

## Asistan medya rotası kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, asistan yerel medya önizlemeleri iki adımlı bir rota kullanır:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` normal Control UI operatör kimlik doğrulamasını gerektirir. Tarayıcı, kullanılabilirliği denetlerken Gateway belirtecini bearer üst bilgisi olarak gönderir.
- Başarılı meta veri yanıtları, tam olarak o kaynak yoluna kapsamlanmış kısa ömürlü bir `mediaTicket` içerir.
- Tarayıcıda işlenen görüntü, ses, video ve belge URL'leri etkin Gateway belirteci veya parolası yerine `mediaTicket=<ticket>` kullanır. Bilet hızla sona erer ve farklı bir kaynağı yetkilendiremez.

Bu, yeniden kullanılabilir Gateway kimlik bilgilerini görünür medya URL'lerine koymadan normal medya işlemeyi tarayıcıya özgü medya öğeleriyle uyumlu tutar.

## UI'yı derleme

Gateway, statik dosyaları `dist/control-ui` konumundan sunar. Bunları şu komutla derleyin:

```bash
pnpm ui:build
```

İsteğe bağlı mutlak taban (sabit varlık URL'leri istediğinizde):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Yerel geliştirme için (ayrı geliştirme sunucusu):

```bash
pnpm ui:dev
```

Ardından UI'yı Gateway WS URL'nize yönlendirin (örn. `ws://127.0.0.1:18789`).

## Boş Control UI sayfası

Tarayıcı boş bir gösterge paneli yüklüyorsa ve DevTools yararlı bir hata göstermiyorsa, bir uzantı veya erken çalışan içerik betiği JavaScript modül uygulamasının değerlendirilmesini engellemiş olabilir. Statik sayfa, başlatmadan sonra `<openclaw-app>` kaydedilmediğinde görünen düz bir HTML kurtarma paneli içerir.

Tarayıcı ortamını değiştirdikten sonra panelin **Try again** eylemini kullanın veya şu denetimlerden sonra elle yeniden yükleyin:

- Tüm sayfalara enjekte eden uzantıları, özellikle `<all_urls>` içerik betiklerine sahip uzantıları devre dışı bırakın.
- Gizli pencere, temiz bir tarayıcı profili veya başka bir tarayıcı deneyin.
- Gateway'i çalışır durumda tutun ve tarayıcı değişikliğinden sonra aynı gösterge paneli URL'sini doğrulayın.

## Hata ayıklama/test etme: geliştirme sunucusu + uzak Gateway

Control UI statik dosyalardan oluşur; WebSocket hedefi yapılandırılabilir ve HTTP origin'inden farklı olabilir. Vite geliştirme sunucusunu yerelde kullanmak, ancak Gateway'i başka bir yerde çalıştırmak istediğinizde bu kullanışlıdır.

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    İsteğe bağlı tek seferlik kimlik doğrulaması (gerekirse):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` yüklendikten sonra localStorage içinde saklanır ve URL'den kaldırılır.
    - `gatewayUrl` üzerinden tam bir `ws://` veya `wss://` uç noktası geçirirseniz, tarayıcının sorgu dizesini doğru ayrıştırması için `gatewayUrl` değerini URL olarak kodlayın.
    - `token` mümkün olduğunda URL parçası (`#token=...`) üzerinden geçirilmelidir. Parçalar sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca fallback olarak kullanılır ve bootstrap sonrasında hemen temizlenir.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında UI, config veya ortam kimlik bilgilerine fallback yapmaz. `token` (veya `password`) değerini açıkça sağlayın. Açık kimlik bilgilerinin eksik olması hatadır.
    - Gateway TLS arkasındayken `wss://` kullanın (Tailscale Serve, HTTPS proxy vb.).
    - `gatewayUrl`, clickjacking'i önlemek için yalnızca üst düzey pencerede kabul edilir (gömülü değil).
    - Herkese açık non-loopback Control UI dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça ayarlamalıdır (tam origin'ler). Loopback, RFC1918/link-local, `.local`, `.ts.net` veya Tailscale CGNAT host'larından özel same-origin LAN/Tailnet yüklemeleri, Host-header fallback etkinleştirilmeden kabul edilir.
    - Gateway başlatma, etkin çalışma zamanı bağlama adresi ve portundan `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel origin'leri ekebilir, ancak uzak tarayıcı origin'leri yine de açık girdiler gerektirir.
    - Sıkı denetlenen yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, "kullandığım host neyse onunla eşleş" değil, herhangi bir tarayıcı origin'ine izin ver anlamına gelir.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`, Host-header origin fallback modunu etkinleştirir, ancak bu tehlikeli bir güvenlik modudur.

  </Accordion>
</AccordionGroup>

Örnek:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Uzak erişim kurulum ayrıntıları: [Uzak erişim](/tr/gateway/remote).

## İlgili

- [Gösterge Paneli](/tr/web/dashboard) — Gateway gösterge paneli
- [Sağlık Denetimleri](/tr/gateway/health) — Gateway sağlık izleme
- [TUI](/tr/web/tui) — terminal kullanıcı arayüzü
- [WebChat](/tr/web/webchat) — tarayıcı tabanlı sohbet arayüzü
