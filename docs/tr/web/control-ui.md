---
read_when:
    - Gateway'i bir tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı denetim arayüzü (sohbet, düğümler, yapılandırma)
title: Kontrol Arayüzü
x-i18n:
    generated_at: "2026-05-03T09:01:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 88959ccf435b31015039bf28c3043023d99f0b953a1489986ab2d0cbd261771c
    source_path: web/control-ui.md
    workflow: 16
---

Control UI, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfalı uygulamadır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` değerini ayarlayın (örn. `/openclaw`)

Aynı portta **doğrudan Gateway WebSocket** ile iletişim kurar.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenmezse önce Gateway'i başlatın: `openclaw gateway`.

Kimlik doğrulama WebSocket el sıkışması sırasında şu yollarla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik başlıkları
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir proxy kimlik başlıkları

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçili Gateway URL'si için bir belirteç tutar; parolalar kalıcı olarak saklanmaz. İlk bağlantıda onboarding genellikle paylaşılan gizli anahtar kimlik doğrulaması için bir Gateway belirteci oluşturur, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Control UI'ya yeni bir tarayıcıdan veya cihazdan bağlandığınızda Gateway genellikle **tek seferlik eşleştirme onayı** ister. Bu, yetkisiz erişimi önlemeye yönelik bir güvenlik önlemidir.

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

Tarayıcı değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/genel anahtar) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve onu okuma erişiminden yazma/yönetici erişimine değiştirirseniz bu, sessiz yeniden bağlantı değil, onay yükseltmesi olarak ele alınır. OpenClaw eski onayı etkin tutar, daha geniş kapsamlı yeniden bağlantıyı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Belirteç döndürme ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik olarak onaylanır.
- `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı cihaz kimliğini sunduğunda Tailscale Serve, Control UI operatör oturumları için eşleştirme turunu atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği oluşturur; bu yüzden tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

</Note>

## Kişisel kimlik (tarayıcı yerelinde)

Control UI, paylaşılan oturumlarda atıf için giden iletilere eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Bu kimlik tarayıcı depolamasında tutulur, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz iletilerdeki normal konuşma dökümü yazarlığı meta verileri dışında başka cihazlara eşitlenmez veya sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya tarayıcı değiştirmek onu boş duruma sıfırlar.

Aynı tarayıcı yereli desen, asistan avatarı geçersiz kılması için de geçerlidir. Yüklenen asistan avatarları, Gateway tarafından çözümlenen kimliğin üzerine yalnızca yerel tarayıcıda uygulanır ve hiçbir zaman `config.patch` üzerinden gidip gelmez. Paylaşılan `ui.assistant.avatar` yapılandırma alanı, alanı doğrudan yazan UI dışı istemciler (betikli Gateway'ler veya özel panolar gibi) için hâlâ kullanılabilir.

## Çalışma zamanı yapılandırma uç noktası

Control UI, çalışma zamanı ayarlarını `/__openclaw/control-ui-config.json` adresinden alır. Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı Gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar onu alamaz ve başarılı bir getirme işlemi için ya zaten geçerli bir Gateway belirteci/parolası, Tailscale Serve kimliği ya da güvenilir proxy kimliği gerekir.

## Dil desteği

Control UI ilk yüklemede tarayıcı yerel ayarınıza göre kendini yerelleştirebilir. Daha sonra geçersiz kılmak için **Genel Bakış -> Gateway Erişimi -> Dil** bölümünü açın. Yerel ayar seçici, Görünüm altında değil Gateway Erişimi kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışı çeviriler tarayıcıda tembel yüklenir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve sonraki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Dokümantasyon çevirileri aynı İngilizce dışı yerel ayar kümesi için oluşturulur, ancak dokümantasyon sitesinin yerleşik Mintlify dil seçicisi Mintlify'nin kabul ettiği yerel ayar kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) dokümantasyon yayın deposunda yine de oluşturulur; Mintlify bu kodları destekleyene kadar bu seçicide görünmeyebilirler.

## Görünüm temaları

Görünüm paneli yerleşik Claw, Knot ve Dash temalarını, ayrıca tarayıcı yerelinde bir tweakcn içe aktarma yuvasını tutar. Bir tema içe aktarmak için [tweakcn themes](https://tweakcn.com/themes) sayfasını açın, bir tema seçin veya oluşturun, **Paylaş** düğmesine tıklayın ve kopyalanan tema bağlantısını Görünüm'e yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` kayıt URL'lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi düzenleyici URL'lerini, göreli `/themes/<id>` yollarını, ham tema kimliklerini ve `amethyst-haze` gibi varsayılan tema adlarını kabul eder.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde saklanır. Gateway yapılandırmasına yazılmaz ve cihazlar arasında eşitlenmez. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; temizlemek, içe aktarılan tema seçiliyse etkin temayı yeniden Claw'a geçirir.

## Neler yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden kısıtlı tek kullanımlık tarayıcı belirteci kullanır ve yalnızca backend gerçek zamanlı ses plugin'leri Gateway röle aktarımını kullanır. Röle, sağlayıcı kimlik bilgilerini Gateway üzerinde tutarken tarayıcı mikrofon PCM akışını `talk.realtime.relay*` RPC'leri üzerinden gönderir ve daha büyük yapılandırılmış OpenClaw modeli için `openclaw_agent_consult` araç çağrılarını `chat.send` üzerinden geri yollar.
    - Sohbet içinde araç çağrılarını + canlı araç çıktı kartlarını yayınlayın (ajan olayları).

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, rüyalar">
    - Kanallar: yerleşik ve paketli/harici plugin kanallarının durumu, QR oturum açma ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`).
    - Örnekler: varlık listesi + yenileme (`system-presence`).
    - Oturumlar: liste + oturum başına model/düşünme/hızlı/ayrıntılı/izleme/akıl yürütme geçersiz kılmaları (`sessions.list`, `sessions.patch`).
    - Rüyalar: Dreaming durumu, etkinleştirme/devre dışı bırakma anahtarı ve Dream Diary okuyucu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Node'lar, yürütme onayları">
    - Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalışma geçmişi (`cron.*`).
    - Skills: durum, etkinleştir/devre dışı bırak, yükle, API anahtarı güncellemeleri (`skills.*`).
    - Node'lar: liste + yetenekler (`node.list`).
    - Yürütme onayları: Gateway veya Node izin listelerini + `exec host=gateway/node` için sorma ilkesini düzenleyin (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Yapılandırma">
    - `~/.openclaw/openclaw.json` görüntüle/düzenle (`config.get`, `config.set`).
    - Doğrulamayla uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazmalar, eşzamanlı düzenlemelerin üzerine yazmayı önlemek için temel karma koruması içerir.
    - Yazmalar (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma yükündeki ref'ler için etkin SecretRef çözümlemesini ön kontrolden geçirir; çözümlenmemiş etkin gönderilmiş ref'ler yazmadan önce reddedilir.
    - Şema + form işleme (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, anlık alt özetler, iç içe nesne/joker dizi/dizi/bileşim düğümlerinde dokümantasyon meta verileri, ayrıca mevcut olduğunda plugin + kanal şemaları dahil); Ham JSON düzenleyici yalnızca anlık görüntü güvenli bir ham gidiş dönüşe sahip olduğunda kullanılabilir.
    - Bir anlık görüntü ham metni güvenli şekilde gidiş dönüş yapamıyorsa Control UI Form modunu zorlar ve bu anlık görüntü için Ham modu devre dışı bırakır.
    - Ham JSON düzenleyici "Kaydedilene sıfırla", düzleştirilmiş bir anlık görüntüyü yeniden işlemek yerine ham yazılmış biçimi (biçimlendirme, yorumlar, `$include` düzeni) korur; böylece anlık görüntü güvenli şekilde gidiş dönüş yapabiliyorsa harici düzenlemeler sıfırlamadan sonra da korunur.
    - Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizeye bozulmayı önlemek için form metin girişlerinde salt okunur işlenir.

  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/modeller anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Günlükler: filtre/dışa aktarma ile Gateway dosya günlüklerinin canlı kuyruğu (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla bir paket/git güncellemesi + yeniden başlatma çalıştırın (`update.run`), ardından yeniden bağlandıktan sonra çalışan Gateway sürümünü doğrulamak için `update.status` sorgulayın.

  </Accordion>
  <Accordion title="Cron işleri paneli notları">
    - İzole işler için teslimat varsayılan olarak özet duyurusudur. Yalnızca dahili çalıştırmalar istiyorsanız hiçbiri seçeneğine geçebilirsiniz.
    - Duyuru seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) Webhook URL'sine ayarlanmış şekilde `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için Webhook ve hiçbiri teslimat modları kullanılabilir.
    - Gelişmiş düzenleme denetimleri çalıştırmadan sonra sil, ajan geçersiz kılmasını temizle, Cron kesin/kademeli seçenekleri, ajan model/düşünme geçersiz kılmaları ve en iyi çaba teslimat anahtarlarını içerir.
    - Form doğrulaması alan düzeyi hatalarla satır içidir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Ayrı bir bearer belirteci göndermek için `cron.webhookToken` ayarlayın; atlanırsa Webhook kimlik doğrulama başlığı olmadan gönderilir.
    - Kullanımdan kaldırılmış geri dönüş: `notify: true` olan saklanmış eski işler, taşınana kadar hâlâ `cron.webhook` kullanabilir.

  </Accordion>
</AccordionGroup>

## Sohbet davranışı

<AccordionGroup>
  <Accordion title="Gönderme ve geçmiş semantiği">
    - `chat.send` **engellemesizdir**: hemen `{ runId, status: "started" }` ile onay verir ve yanıt `chat` olayları üzerinden akışla gelir.
    - Sohbet yüklemeleri görselleri ve video olmayan dosyaları kabul eder. Görseller yerel görsel yolunu korur; diğer dosyalar yönetilen medya olarak saklanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden göndermek, çalışırken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları UI güvenliği için boyutla sınırlandırılmıştır. Döküm girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır meta veri bloklarını atlayabilir ve aşırı büyük iletileri bir yer tutucuyla (`[chat.history omitted: message too large]`) değiştirebilir.
    - Asistan/üretilmiş görseller yönetilen medya referansları olarak kalıcılaştırılır ve kimliği doğrulanmış Gateway medya URL'leri üzerinden geri sunulur; böylece yeniden yüklemeler, ham base64 görsel yüklerinin sohbet geçmişi yanıtında kalmasına bağlı olmaz.
    - `chat.history` ayrıca görünür asistan metninden yalnızca gösterim amaçlı satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model kontrol belirteçlerini çıkarır; görünür metninin tamamı yalnızca tam sessiz belirteç `NO_REPLY` / `no_reply` olan asistan girdilerini atlar.
    - Etkin bir gönderim sırasında ve son geçmiş yenilemesinde, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürürse sohbet görünümü yerel iyimser kullanıcı/asistan iletilerini görünür tutar; Gateway geçmişi yetiştiğinde kanonik döküm bu yerel iletilerin yerini alır.
    - `chat.inject`, oturum dökümüne bir asistan notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (aracı çalıştırması yok, kanal teslimi yok).
    - Sohbet başlığı model ve düşünme seçicileri, etkin oturumu `sessions.patch` üzerinden hemen yamalar; bunlar kalıcı oturum geçersiz kılmalarıdır, yalnızca tek turluk gönderme seçenekleri değildir.
    - Control UI içinde `/new` yazmak, New Chat ile aynı yeni pano oturumunu oluşturur ve ona geçer. `/reset` yazmak, geçerli oturum için Gateway'in açık yerinde sıfırlamasını korur.
    - Sohbet model seçici, Gateway'in yapılandırılmış model görünümünü ister. `agents.defaults.models` varsa seçiciyi bu izin listesi yönlendirir. Aksi takdirde seçici açık `models.providers.*.models` girdilerini ve kullanılabilir kimlik doğrulaması olan sağlayıcıları gösterir. Tam katalog, hata ayıklama `models.list` RPC'si üzerinden `view: "all"` ile kullanılabilir kalır.
    - Yeni Gateway oturum kullanım raporları yüksek bağlam baskısı gösterdiğinde, sohbet oluşturucu alanı bir bağlam bildirimi ve önerilen Compaction düzeylerinde normal oturum Compaction yolunu çalıştıran bir sıkıştırma düğmesi gösterir. Eski belirteç anlık görüntüleri, Gateway yeniden güncel kullanım bildirene kadar gizlenir.

  </Accordion>
  <Accordion title="Konuşma modu (tarayıcı gerçek zamanlı)">
    Konuşma modu kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. OpenAI'yi `talk.provider: "openai"` artı `talk.providers.openai.apiKey` ile yapılandırın veya Google'ı `talk.provider: "google"` artı `talk.providers.google.apiKey` ile yapılandırın; Voice Call gerçek zamanlı sağlayıcı yapılandırması geri dönüş olarak yine de yeniden kullanılabilir. Tarayıcı hiçbir zaman standart bir sağlayıcı API anahtarı almaz. OpenAI, WebRTC için geçici bir Realtime istemci gizli anahtarı alır. Google Live, tarayıcı WebSocket oturumu için tek kullanımlık, kısıtlanmış bir Live API kimlik doğrulama belirteci alır; yönergeler ve araç bildirimleri Gateway tarafından belirtece kilitlenir. Yalnızca arka uç gerçek zamanlı köprüsü sunan sağlayıcılar Gateway aktarma taşıması üzerinden çalışır; böylece kimlik bilgileri ve satıcı soketleri sunucu tarafında kalırken tarayıcı sesi kimliği doğrulanmış Gateway RPC'leri üzerinden hareket eder. Realtime oturum istemi Gateway tarafından birleştirilir; `talk.realtime.session` çağıranın sağladığı yönerge geçersiz kılmalarını kabul etmez.

    Chat oluşturucuda Konuşma denetimi, mikrofon dikte düğmesinin yanındaki dalga düğmesidir. Konuşma başladığında oluşturucu durum satırı ses bağlanırken `Connecting Talk...`, ses bağlıyken `Talk live` veya gerçek zamanlı bir araç çağrısı yapılandırılmış daha büyük modele `chat.send` üzerinden danışırken `Asking OpenClaw...` gösterir.

    Bakımcı canlı duman testi: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` OpenAI tarayıcı WebRTC SDP alışverişini, Google Live kısıtlanmış belirteçli tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway aktarma tarayıcı bağdaştırıcısını doğrular. Komut yalnızca sağlayıcı durumunu yazdırır ve gizli bilgileri günlüğe yazmaz.

  </Accordion>
  <Accordion title="Durdurma ve iptal">
    - **Stop** öğesine tıklayın (`chat.abort` çağırır).
    - Bir çalışma etkinken normal takip iletileri kuyruğa alınır. Kuyruktaki bir iletide **Steer** öğesine tıklayarak bu takip iletisini çalışan tura enjekte edin.
    - Bant dışı iptal etmek için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi tek başına iptal ifadeleri kullanın).
    - `chat.abort`, o oturum için tüm etkin çalışmaları iptal etmek üzere `{ sessionKey }` destekler (`runId` yok).

  </Accordion>
  <Accordion title="İptal kısmi çıktısını tutma">
    - Bir çalışma iptal edildiğinde, kısmi asistan metni UI'da yine de gösterilebilir.
    - Gateway, tamponlanmış çıktı varsa iptal edilmiş kısmi asistan metnini döküm geçmişine kalıcılaştırır.
    - Kalıcılaştırılmış girdiler iptal meta verileri içerir; böylece döküm tüketicileri iptal kısmi çıktıları ile normal tamamlanma çıktısını ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve web push

Control UI bir `manifest.webmanifest` ve bir service worker ile gelir; bu nedenle modern tarayıcılar onu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık olmasa bile Gateway'in yüklü PWA'yı bildirimlerle uyandırmasını sağlar.

| Yüzey                                                 | Ne yapar                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA bildirimi. Erişilebilir olduğunda tarayıcılar "Install app" sunar. |
| `ui/public/sw.js`                                     | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw durum dizini altında) | Web Push yüklerini imzalamak için kullanılan otomatik oluşturulmuş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                    | Kalıcılaştırılmış tarayıcı abonelik uç noktaları.                  |

Anahtarları sabitlemek istediğinizde (çok ana makineli dağıtımlar, gizli bilgi rotasyonu veya testler için) VAPID anahtar çiftini Gateway işlemi üzerindeki ortam değişkenleriyle geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılan `mailto:openclaw@localhost`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için bu kapsam kapılı Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID genel anahtarını getirir.
- `push.web.subscribe` — bir `endpoint` ve `keys.p256dh`/`keys.auth` kaydeder.
- `push.web.unsubscribe` — kayıtlı bir uç noktayı kaldırır.
- `push.web.test` — çağıranın aboneliğine bir test bildirimi gönderir.

<Note>
Web Push, iOS APNS aktarma yolundan (aktarma destekli push için bkz. [Yapılandırma](/tr/gateway/configuration)) ve yerel mobil eşleştirmeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Barındırılan yerleştirmeler

Asistan iletileri, `[embed ...]` kısa koduyla barındırılan web içeriğini satır içinde işleyebilir. iframe sandbox ilkesi `gateway.controlUi.embedSandbox` tarafından denetlenir:

<Tabs>
  <Tab title="strict">
    Barındırılan yerleştirmeler içinde betik çalıştırmayı devre dışı bırakır.
  </Tab>
  <Tab title="scripts (varsayılan)">
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
`trusted` yalnızca gömülü belge gerçekten aynı kaynak davranışına ihtiyaç duyduğunda kullanın. Çoğu aracı tarafından üretilen oyun ve etkileşimli canvas için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` yerleştirme URL'leri varsayılan olarak engellenir. Bilerek `[embed url="https://..."]` öğesinin üçüncü taraf sayfaları yüklemesini istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Sohbet iletisi genişliği

Gruplanmış sohbet iletileri okunabilir bir varsayılan en büyük genişlik kullanır. Geniş monitör dağıtımları, paketlenmiş CSS'i yamalamadan `gateway.controlUi.chatMessageMaxWidth` ayarlayarak bunu geçersiz kılabilir:

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
  <Tab title="Entegre Tailscale Serve (tercih edilen)">
    Gateway'i loopback üzerinde tutun ve Tailscale Serve'ün onu HTTPS ile proxy'lemesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Varsayılan olarak Control UI/WebSocket Serve istekleri, `gateway.auth.allowTailscale` `true` olduğunda Tailscale kimlik üstbilgileri (`tailscale-user-login`) üzerinden kimlik doğrulayabilir. OpenClaw, `x-forwarded-for` adresini `tailscale whois` ile çözümleyip üstbilgiyle eşleştirerek kimliği doğrular ve bunları yalnızca istek Tailscale'in `x-forwarded-*` üstbilgileriyle loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliğine sahip Control UI operatör oturumları için bu doğrulanmış Serve yolu, cihaz eşleştirme gidiş dönüşünü de atlar; cihazsız tarayıcılar ve node rolü bağlantıları normal cihaz kontrollerini izlemeye devam eder. Serve trafiği için bile açık paylaşılan gizli kimlik bilgilerini zorunlu kılmak istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu eşzamansız Serve kimlik yolu için, aynı istemci IP'si ve kimlik doğrulama kapsamı için başarısız kimlik doğrulama denemeleri, hız sınırı yazmalarından önce sıralanır. Bu nedenle aynı tarayıcıdan gelen eşzamanlı kötü yeniden denemeler, paralel yarışan iki düz uyumsuzluk yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Belirteçsiz Serve kimlik doğrulaması gateway ana makinesinin güvenilir olduğunu varsayar. O ana makinede güvenilmeyen yerel kod çalışabiliyorsa token/parola kimlik doğrulamasını zorunlu kılın.
    </Warning>

  </Tab>
  <Tab title="Tailnet'e bağla + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ardından açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Eşleşen paylaşılan gizli bilgiyi UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvensiz HTTP

Panoyu düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`), tarayıcı **güvenli olmayan bağlamda** çalışır ve WebCrypto'yu engeller. Varsayılan olarak OpenClaw, cihaz kimliği olmayan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Control UI kimlik doğrulaması
- acil durum `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI'ı yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway ana makinesinde)

<AccordionGroup>
  <Accordion title="Güvensiz kimlik doğrulama anahtarı davranışı">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` yalnızca yerel uyumluluk anahtarıdır:

    - Güvenli olmayan HTTP bağlamlarında localhost Control UI oturumlarının cihaz kimliği olmadan devam etmesine izin verir.
    - Eşleştirme denetimlerini atlamaz.
    - Uzak (localhost olmayan) cihaz kimliği gereksinimlerini gevşetmez.

  </Accordion>
  <Accordion title="Yalnızca acil durum için">
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
  <Accordion title="Güvenilir proxy notu">
    - Başarılı güvenilir proxy kimlik doğrulaması, cihaz kimliği olmadan **operator** Control UI oturumlarını kabul edebilir.
    - Bu, node-role Control UI oturumlarına genişletilmez.
    - Aynı ana makinedeki loopback ters proxy’leri yine de güvenilir proxy kimlik doğrulamasını karşılamaz; bkz. [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberliği için [Tailscale](/tr/gateway/tailscale) bölümüne bakın.

## İçerik güvenliği ilkesi

Control UI sıkı bir `img-src` ilkesiyle gelir: yalnızca **same-origin** varlıklara, `data:` URL’lerine ve yerel olarak oluşturulmuş `blob:` URL’lerine izin verilir. Uzak `http(s)` ve protokole göreli görüntü URL’leri tarayıcı tarafından reddedilir ve ağ getirme istekleri oluşturmaz.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görseller (örneğin `/avatars/<id>`) hâlâ işlenir; UI’ın getirip yerel `blob:` URL’lerine dönüştürdüğü kimliği doğrulanmış avatar rotaları buna dahildir.
- Satır içi `data:image/...` URL’leri hâlâ işlenir (protokol içi yükler için yararlıdır).
- Control UI tarafından oluşturulan yerel `blob:` URL’leri hâlâ işlenir.
- Kanal meta verilerinin yaydığı uzak avatar URL’leri, Control UI’ın avatar yardımcılarında kaldırılır ve yerleşik logo/rozet ile değiştirilir; böylece ele geçirilmiş veya kötü amaçlı bir kanal, bir operator tarayıcısından rastgele uzak görüntü getirme isteklerini zorlayamaz.

Bu davranışı elde etmek için hiçbir şeyi değiştirmeniz gerekmez — her zaman açıktır ve yapılandırılamaz.

## Avatar rotası kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında Control UI avatar uç noktası, API’nin geri kalanıyla aynı gateway token’ını gerektirir:

- `GET /avatar/<agentId>` avatar görselini yalnızca kimliği doğrulanmış çağırıcılara döndürür. `GET /avatar/<agentId>?meta=1` aynı kurala göre avatar meta verilerini döndürür.
- Her iki rotaya yapılan kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla uyumlu şekilde). Bu, avatar rotasının aksi halde korunan ana makinelerde agent kimliğini sızdırmasını önler.
- Control UI, avatarları getirirken gateway token’ını bearer başlığı olarak iletir ve görselin panolarda hâlâ işlenmesi için kimliği doğrulanmış blob URL’leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan ana makinelerde önerilmez), avatar rotası da gateway’in geri kalanıyla uyumlu olarak kimlik doğrulamasız hale gelir.

## UI’ı oluşturma

Gateway statik dosyaları `dist/control-ui` konumundan sunar. Bunları şu komutla oluşturun:

```bash
pnpm ui:build
```

İsteğe bağlı mutlak taban (sabit varlık URL’leri istediğinizde):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Yerel geliştirme için (ayrı geliştirme sunucusu):

```bash
pnpm ui:dev
```

Ardından UI’ı Gateway WS URL’nize yönlendirin (örn. `ws://127.0.0.1:18789`).

## Hata ayıklama/test etme: geliştirme sunucusu + uzak Gateway

Control UI statik dosyalardan oluşur; WebSocket hedefi yapılandırılabilir ve HTTP origin’den farklı olabilir. Vite geliştirme sunucusunu yerelde kullanmak, ancak Gateway’i başka yerde çalıştırmak istediğinizde bu kullanışlıdır.

<Steps>
  <Step title="UI geliştirme sunucusunu başlatın">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="gatewayUrl ile açın">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    İsteğe bağlı tek seferlik kimlik doğrulaması (gerekiyorsa):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notlar">
    - `gatewayUrl`, yüklemeden sonra localStorage içinde saklanır ve URL’den kaldırılır.
    - `gatewayUrl` üzerinden tam bir `ws://` veya `wss://` uç noktası geçirirseniz, tarayıcının sorgu dizesini doğru ayrıştırması için `gatewayUrl` değerini URL olarak kodlayın.
    - `token` mümkün olduğunda URL fragment’i (`#token=...`) üzerinden geçirilmelidir. Fragment’ler sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca yedek olarak kullanılır ve önyüklemeden hemen sonra kaldırılır.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında UI, config veya ortam kimlik bilgilerine geri dönmez. `token` (veya `password`) değerini açıkça sağlayın. Açık kimlik bilgilerinin eksik olması bir hatadır.
    - Gateway TLS arkasındaysa (Tailscale Serve, HTTPS proxy vb.) `wss://` kullanın.
    - Clickjacking’i önlemek için `gatewayUrl` yalnızca üst düzey pencerede (gömülü değilken) kabul edilir.
    - local loopback olmayan Control UI dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça ayarlamalıdır (tam origin’ler). Uzak geliştirme kurulumları buna dahildir.
    - Gateway başlangıcı, etkin çalışma zamanı bağlama ve bağlantı noktasından `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel origin’leri besleyebilir, ancak uzak tarayıcı origin’leri yine de açık girdilere ihtiyaç duyar.
    - Sıkı denetimli yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, herhangi bir tarayıcı origin’ine izin ver anlamına gelir; "kullandığım ana makine neyse onunla eşleştir" anlamına gelmez.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`, Host başlığı origin yedek modunu etkinleştirir, ancak bu tehlikeli bir güvenlik modudur.

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

- [Dashboard](/tr/web/dashboard) — gateway panosu
- [Health Checks](/tr/gateway/health) — gateway sağlık izleme
- [TUI](/tr/web/tui) — terminal kullanıcı arayüzü
- [WebChat](/tr/web/webchat) — tarayıcı tabanlı sohbet arayüzü
