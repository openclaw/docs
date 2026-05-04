---
read_when:
    - Gateway'i bir tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı kontrol kullanıcı arayüzü (sohbet, düğümler, yapılandırma)
title: Kontrol kullanıcı arayüzü
x-i18n:
    generated_at: "2026-05-04T07:09:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07fbbe1c7fec5f67a04a231e02bdf0f7d16be9c5fe188915674d71fcd69002a5
    source_path: web/control-ui.md
    workflow: 16
---

Control UI, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfalık uygulamadır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarını belirleyin (örn. `/openclaw`)

Aynı bağlantı noktasında **doğrudan Gateway WebSocket** ile konuşur.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenmezse önce Gateway’i başlatın: `openclaw gateway`.

Kimlik doğrulama, WebSocket el sıkışması sırasında şu yollarla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üstbilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir proxy kimlik üstbilgileri

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçilen gateway URL’si için bir token tutar; parolalar kalıcı olarak saklanmaz. İlk bağlantıda onboarding genellikle paylaşılan gizli anahtarlı kimlik doğrulama için bir gateway token’ı oluşturur, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Control UI’ye yeni bir tarayıcıdan veya cihazdan bağlandığınızda Gateway genellikle **tek seferlik eşleştirme onayı** ister. Bu, yetkisiz erişimi önlemek için bir güvenlik önlemidir.

**Göreceğiniz şey:** "disconnected (1008): pairing required"

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

Tarayıcı değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve erişimini okuma erişiminden yazma/yönetici erişimine değiştirirseniz bu sessiz bir yeniden bağlanma değil, onay yükseltmesi olarak ele alınır. OpenClaw eski onayı etkin tutar, daha geniş kapsamlı yeniden bağlanmayı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik onaylanır.
- `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı cihaz kimliğini sunduğunda Tailscale Serve, Control UI operatör oturumları için eşleştirme gidiş dönüşünü atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği oluşturur; bu nedenle tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

</Note>

## Kişisel kimlik (tarayıcı-yerel)

Control UI, paylaşılan oturumlarda atıf için giden mesajlara eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Bu kimlik tarayıcı depolamasında bulunur, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz mesajlardaki normal transkript yazarlığı meta verileri dışında diğer cihazlara eşitlenmez veya sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya tarayıcı değiştirmek onu boş durumuna sıfırlar.

Aynı tarayıcı-yerel desen asistan avatarı geçersiz kılma için de geçerlidir. Yüklenen asistan avatarları, yalnızca yerel tarayıcıda gateway tarafından çözümlenen kimliğin üzerine bindirilir ve hiçbir zaman `config.patch` üzerinden gidip gelmez. Paylaşılan `ui.assistant.avatar` yapılandırma alanı, alanı doğrudan yazan UI dışı istemciler (betikli gateway’ler veya özel panolar gibi) için hâlâ kullanılabilir.

## Çalışma zamanı yapılandırma uç noktası

Control UI, çalışma zamanı ayarlarını `/__openclaw/control-ui-config.json` adresinden alır. Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı gateway kimlik doğrulaması tarafından korunur: kimliği doğrulanmamış tarayıcılar bunu alamaz ve başarılı bir alma işlemi için ya zaten geçerli bir gateway token’ı/parolası, Tailscale Serve kimliği ya da güvenilir proxy kimliği gerekir.

## Dil desteği

Control UI ilk yüklemede tarayıcı yerel ayarınıza göre kendini yerelleştirebilir. Daha sonra geçersiz kılmak için **Genel Bakış -> Gateway Erişimi -> Dil** yolunu açın. Yerel ayar seçici, Görünüm altında değil Gateway Erişimi kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışındaki çeviriler tarayıcıda tembel yüklenir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve sonraki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Doküman çevirileri aynı İngilizce dışı yerel ayar kümesi için oluşturulur, ancak doküman sitesinin yerleşik Mintlify dil seçicisi Mintlify’nin kabul ettiği yerel ayar kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) dokümanlar yayın deposunda hâlâ oluşturulur; Mintlify bu kodları destekleyene kadar bu seçicide görünmeyebilirler.

## Görünüm temaları

Görünüm paneli, yerleşik Claw, Knot ve Dash temalarını ve ayrıca bir tarayıcı-yerel tweakcn içe aktarma yuvasını tutar. Bir tema içe aktarmak için [tweakcn düzenleyicisini](https://tweakcn.com/editor/theme) açın, bir tema seçin veya oluşturun, **Paylaş**’a tıklayın ve kopyalanan tema bağlantısını Görünüm’e yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` kayıt URL’lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi düzenleyici URL’lerini, göreli `/themes/<id>` yollarını, ham tema kimliklerini ve `amethyst-haze` gibi varsayılan tema adlarını kabul eder.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde saklanır. Gateway yapılandırmasına yazılmaz ve cihazlar arasında eşitlenmez. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; içe aktarılan tema seçiliyse temizlemek etkin temayı yeniden Claw’a geçirir.

## Ne yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden sınırlı tek kullanımlık bir tarayıcı token’ı kullanır ve yalnızca arka uç gerçek zamanlı ses plugin’leri Gateway aktarma taşımasını kullanır. Aktarma, sağlayıcı kimlik bilgilerini Gateway’de tutarken tarayıcı mikrofon PCM’sini `talk.realtime.relay*` RPC’leri üzerinden aktarır ve daha büyük yapılandırılmış OpenClaw modeli için `openclaw_agent_consult` araç çağrılarını `chat.send` üzerinden geri gönderir.
    - Sohbet’te araç çağrılarını + canlı araç çıktı kartlarını yayınlayın (ajan olayları).

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, rüyalar">
    - Kanallar: yerleşik ve paketlenmiş/harici plugin kanallarının durumu, QR girişi ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`).
    - Örnekler: varlık listesi + yenileme (`system-presence`).
    - Oturumlar: liste + oturum başına model/düşünme/hızlı/ayrıntılı/izleme/akıl yürütme geçersiz kılmaları (`sessions.list`, `sessions.patch`).
    - Rüyalar: dreaming durumu, etkinleştir/devre dışı bırak düğmesi ve Rüya Günlüğü okuyucu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, node’lar, exec onayları">
    - Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalışma geçmişi (`cron.*`).
    - Skills: durum, etkinleştir/devre dışı bırak, yükle, API anahtarı güncellemeleri (`skills.*`).
    - Node’lar: liste + yetenekler (`node.list`).
    - Exec onayları: `exec host=gateway/node` için gateway veya node izin listelerini + sorma politikasını düzenle (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Yapılandırma">
    - `~/.openclaw/openclaw.json` dosyasını görüntüle/düzenle (`config.get`, `config.set`).
    - Doğrulamayla uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazmalar, eşzamanlı düzenlemelerin üzerine yazılmasını önlemek için bir temel karma koruması içerir.
    - Yazmalar (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma yükündeki ref’ler için etkin SecretRef çözümlemesini ön denetimden geçirir; çözümlenmemiş etkin gönderilen ref’ler yazmadan önce reddedilir.
    - Şema + form işleme (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, doğrudan alt özetler, iç içe nesne/joker karakter/dizi/bileşim node’larında doküman meta verileri ve mevcut olduğunda plugin + kanal şemaları dahil); Ham JSON düzenleyici yalnızca anlık görüntü güvenli bir ham gidiş dönüşe sahip olduğunda kullanılabilir.
    - Bir anlık görüntü ham metni güvenli şekilde gidip getiremiyorsa Control UI, Form modunu zorlar ve o anlık görüntü için Ham modu devre dışı bırakır.
    - Ham JSON düzenleyicide "Kaydedilene sıfırla", düzleştirilmiş bir anlık görüntüyü yeniden işlemek yerine ham olarak yazılmış şekli (biçimlendirme, yorumlar, `$include` yerleşimi) korur; böylece anlık görüntü güvenli şekilde gidip gelebiliyorsa harici düzenlemeler sıfırlamadan sonra korunur.
    - Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizeye bozulmayı önlemek için form metin girişlerinde salt okunur olarak işlenir.

  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/modeller anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Günlükler: filtre/dışa aktarma ile gateway dosya günlüklerinin canlı kuyruğu (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla bir paket/git güncellemesi + yeniden başlatma çalıştırın (`update.run`), ardından çalışan gateway sürümünü doğrulamak için yeniden bağlandıktan sonra `update.status` yoklaması yapın.

  </Accordion>
  <Accordion title="Cron işleri panel notları">
    - İzole işler için teslim varsayılanı özet duyurusudur. Yalnızca dahili çalışmalar istiyorsanız bunu hiçbiri olarak değiştirebilirsiniz.
    - Duyuru seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) webhook URL’sine ayarlanmış olarak `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için webhook ve hiçbiri teslim modları kullanılabilir.
    - Gelişmiş düzenleme denetimleri; çalıştırmadan sonra silme, ajan geçersiz kılmasını temizleme, cron kesin/kademeli seçenekleri, ajan modeli/düşünme geçersiz kılmaları ve en iyi çaba teslim düğmelerini içerir.
    - Form doğrulaması alan düzeyindeki hatalarla satır içidir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Özel bir bearer token göndermek için `cron.webhookToken` ayarlayın; atlanırsa webhook kimlik doğrulama üstbilgisi olmadan gönderilir.
    - Kullanımdan kaldırılmış yedek: `notify: true` değerine sahip saklanan eski işler, taşınana kadar hâlâ `cron.webhook` kullanabilir.

  </Accordion>
</AccordionGroup>

## Sohbet davranışı

<AccordionGroup>
  <Accordion title="Gönderme ve geçmiş semantiği">
    - `chat.send` **engellemesizdir**: `{ runId, status: "started" }` ile hemen onay verir ve yanıt `chat` olayları üzerinden akar.
    - Sohbet yüklemeleri görselleri ve video olmayan dosyaları kabul eder. Görseller yerel görsel yolunu korur; diğer dosyalar yönetilen medya olarak saklanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden gönderme, çalışırken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları, UI güvenliği için boyutla sınırlıdır. Transkript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır metadata bloklarını atlayabilir ve aşırı büyük mesajları bir yer tutucuyla (`[chat.history omitted: message too large]`) değiştirebilir.
    - Asistan/oluşturulan görseller yönetilen medya başvuruları olarak kalıcı hale getirilir ve kimliği doğrulanmış Gateway medya URL'leri üzerinden geri sunulur; böylece yeniden yüklemeler, ham base64 görsel yüklerinin sohbet geçmişi yanıtında kalmasına bağlı olmaz.
    - `chat.history` ayrıca görünür asistan metninden yalnızca görüntüleme amaçlı satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin tool-call XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış tool-call blokları dahil) ve sızmış ASCII/tam genişlikli model kontrol belirteçlerini çıkarır ve tüm görünür metni yalnızca tam sessiz belirteç `NO_REPLY` / `no_reply` olan asistan girdilerini atlar.
    - Etkin bir gönderme sırasında ve son geçmiş yenilemesinde, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürürse sohbet görünümü yerel iyimser kullanıcı/asistan mesajlarını görünür tutar; Gateway geçmişi yetiştiğinde kanonik transkript bu yerel mesajların yerini alır.
    - Canlı `chat` olayları teslimat durumudur; `chat.history` ise kalıcı oturum transkriptinden yeniden oluşturulur. Tool-final olaylarından sonra Control UI geçmişi yeniden yükler ve yalnızca küçük bir iyimser kuyruğu birleştirir; transkript sınırı [WebChat](/tr/web/webchat) içinde belgelenmiştir.
    - `chat.inject`, oturum transkriptine bir asistan notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (ajan çalıştırması yok, kanal teslimatı yok).
    - Sohbet başlığı model ve düşünme seçicileri etkin oturumu `sessions.patch` üzerinden hemen yamalar; bunlar tek turluk gönderme seçenekleri değil, kalıcı oturum geçersiz kılmalarıdır.
    - Control UI içinde `/new` yazmak, New Chat ile aynı yeni pano oturumunu oluşturur ve ona geçer. `/reset` yazmak, geçerli oturum için Gateway'in açıkça yerinde sıfırlamasını korur.
    - Sohbet model seçici, Gateway'in yapılandırılmış model görünümünü ister. `agents.defaults.models` mevcutsa seçiciyi bu izin listesi yönlendirir. Aksi halde seçici, açık `models.providers.*.models` girdilerini ve kullanılabilir kimlik doğrulamaya sahip sağlayıcıları gösterir. Tam katalog, debug `models.list` RPC üzerinden `view: "all"` ile kullanılabilir kalır.
    - Yeni Gateway oturum kullanım raporları yüksek bağlam baskısı gösterdiğinde sohbet oluşturucu alanı bir bağlam bildirimi ve önerilen Compaction düzeylerinde normal oturum Compaction yolunu çalıştıran kompakt bir düğme gösterir. Eski belirteç anlık görüntüleri, Gateway yeniden güncel kullanım bildirene kadar gizlenir.

  </Accordion>
  <Accordion title="Konuşma modu (tarayıcı gerçek zamanlı)">
    Konuşma modu kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. OpenAI'yi `talk.provider: "openai"` artı `talk.providers.openai.apiKey` ile yapılandırın veya Google'ı `talk.provider: "google"` artı `talk.providers.google.apiKey` ile yapılandırın; Voice Call gerçek zamanlı sağlayıcı yapılandırması yine yedek olarak yeniden kullanılabilir. Tarayıcı hiçbir zaman standart bir sağlayıcı API anahtarı almaz. OpenAI, WebRTC için geçici bir Realtime istemci sırrı alır. Google Live, yönergeleri ve araç bildirimleri Gateway tarafından belirtece kilitlenmiş şekilde, tarayıcı WebSocket oturumu için tek kullanımlık kısıtlı bir Live API auth belirteci alır. Yalnızca arka uç gerçek zamanlı köprüsü sunan sağlayıcılar Gateway röle aktarımı üzerinden çalışır; böylece tarayıcı sesi kimliği doğrulanmış Gateway RPC'leri üzerinden taşınırken kimlik bilgileri ve satıcı soketleri sunucu tarafında kalır. Realtime oturum prompt'u Gateway tarafından birleştirilir; `talk.realtime.session` çağıran tarafından sağlanan yönerge geçersiz kılmalarını kabul etmez.

    Chat oluşturucuda Talk denetimi, mikrofon dikte düğmesinin yanındaki dalgalar düğmesidir. Talk başladığında oluşturucu durum satırı `Connecting Talk...`, ses bağlıyken `Talk live` veya gerçek zamanlı bir araç çağrısı `chat.send` üzerinden yapılandırılmış daha büyük modele danışırken `Asking OpenClaw...` gösterir.

    Maintainer canlı smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`, OpenAI tarayıcı WebRTC SDP alışverişini, Google Live kısıtlı belirteçli tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway röle tarayıcı bağdaştırıcısını doğrular. Komut yalnızca sağlayıcı durumunu yazdırır ve sırları günlüğe kaydetmez.

  </Accordion>
  <Accordion title="Durdurma ve iptal">
    - **Durdur**'a tıklayın (`chat.abort` çağırır).
    - Bir çalıştırma etkinken normal takip mesajları kuyruğa alınır. Kuyruktaki bir mesajda **Yönlendir**'e tıklayarak bu takip mesajını çalışan tura enjekte edin.
    - Bant dışı iptal etmek için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi bağımsız iptal ifadeleri).
    - `chat.abort`, o oturumdaki tüm etkin çalıştırmaları iptal etmek için `{ sessionKey }` destekler (`runId` yok).

  </Accordion>
  <Accordion title="İptal kısmi çıktısını saklama">
    - Bir çalıştırma iptal edildiğinde, kısmi asistan metni UI'da yine de gösterilebilir.
    - Gateway, tamponlanmış çıktı mevcut olduğunda iptal edilmiş kısmi asistan metnini transkript geçmişine kalıcı olarak yazar.
    - Kalıcı girdiler iptal metadata'sı içerir; böylece transkript tüketicileri iptal kısmi çıktıları ile normal tamamlanma çıktısını ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve web push

Control UI bir `manifest.webmanifest` ve bir service worker ile gelir; bu nedenle modern tarayıcılar onu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık olmasa bile Gateway'in kurulu PWA'yı bildirimlerle uyandırmasını sağlar.

| Yüzey                                                 | Ne yapar                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest'i. Erişilebilir olduğunda tarayıcılar "Install app" önerir. |
| `ui/public/sw.js`                                     | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw durum dizini altında) | Web Push yüklerini imzalamak için kullanılan otomatik oluşturulmuş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                    | Kalıcı tarayıcı abonelik uç noktaları.                             |

Anahtarları sabitlemek istediğinizde (çok sunuculu dağıtımlar, sır döndürme veya testler için) VAPID anahtar çiftini Gateway sürecindeki env vars üzerinden geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılan: `mailto:openclaw@localhost`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için şu kapsamla sınırlandırılmış Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID genel anahtarını getirir.
- `push.web.subscribe` — bir `endpoint` ile `keys.p256dh`/`keys.auth` kaydeder.
- `push.web.unsubscribe` — kayıtlı bir uç noktayı kaldırır.
- `push.web.test` — çağıranın aboneliğine bir test bildirimi gönderir.

<Note>
Web Push, iOS APNS röle yolundan (röle destekli push için bkz. [Yapılandırma](/tr/gateway/configuration)) ve yerel mobil eşleştirmeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Barındırılan gömmeler

Asistan mesajları, `[embed ...]` kısa koduyla barındırılan web içeriğini satır içinde render edebilir. iframe sandbox ilkesi `gateway.controlUi.embedSandbox` tarafından denetlenir:

<Tabs>
  <Tab title="katı">
    Barındırılan gömmelerin içinde script yürütmeyi devre dışı bırakır.
  </Tab>
  <Tab title="scriptler (varsayılan)">
    Origin yalıtımını korurken etkileşimli gömmelere izin verir; bu varsayılandır ve genellikle kendi kendine yeten tarayıcı oyunları/widget'ları için yeterlidir.
  </Tab>
  <Tab title="güvenilir">
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
`trusted` değerini yalnızca gömülü belge gerçekten aynı-origin davranışına ihtiyaç duyduğunda kullanın. Çoğu ajan tarafından oluşturulan oyun ve etkileşimli canvas için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` gömme URL'leri varsayılan olarak engellenmiş kalır. Bilerek `[embed url="https://..."]` ile üçüncü taraf sayfaları yüklemek istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Sohbet mesajı genişliği

Gruplanmış sohbet mesajları okunabilir bir varsayılan maksimum genişlik kullanır. Geniş monitör dağıtımları, paketlenmiş CSS'i yamalamadan `gateway.controlUi.chatMessageMaxWidth` ayarlayarak bunu geçersiz kılabilir:

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
  <Tab title="Entegre Tailscale Serve (tercih edilir)">
    Gateway'i loopback üzerinde tutun ve Tailscale Serve'ın HTTPS ile proxy etmesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Varsayılan olarak Control UI/WebSocket Serve istekleri, `gateway.auth.allowTailscale` `true` olduğunda Tailscale kimlik başlıkları (`tailscale-user-login`) üzerinden kimlik doğrulayabilir. OpenClaw, `x-forwarded-for` adresini `tailscale whois` ile çözerek ve başlıkla eşleştirerek kimliği doğrular; bunları yalnızca istek Tailscale'in `x-forwarded-*` başlıklarıyla loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliğine sahip Control UI operatör oturumları için bu doğrulanmış Serve yolu ayrıca cihaz eşleştirme gidiş dönüşünü atlar; cihazsız tarayıcılar ve node rolü bağlantıları normal cihaz kontrollerini izlemeye devam eder. Serve trafiği için bile açık paylaşılan sır kimlik bilgilerini zorunlu kılmak istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu async Serve kimlik yolu için aynı istemci IP'si ve auth kapsamına yönelik başarısız auth denemeleri, rate-limit yazımlarından önce sıraya alınır. Bu nedenle aynı tarayıcıdan eşzamanlı hatalı yeniden denemeler, paralel yarışan iki düz uyumsuzluk yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Belirteçsiz Serve auth, gateway ana makinesinin güvenilir olduğunu varsayar. Bu ana makinede güvenilmeyen yerel kod çalışabiliyorsa token/password auth zorunlu kılın.
    </Warning>

  </Tab>
  <Tab title="Tailnet'e bağla + belirteç">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ardından açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Eşleşen paylaşılan sırrı UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvensiz HTTP

Panoyu düz HTTP üzerinden (`http://<lan-ip>` veya `http://<tailscale-ip>`) açarsanız tarayıcı **güvenli olmayan bağlamda** çalışır ve WebCrypto'yu engeller. Varsayılan olarak OpenClaw, cihaz kimliği olmayan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Control UI auth
- acil durum `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI’yi yerel olarak açın:

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

    `allowInsecureAuth` yalnızca yerel bir uyumluluk anahtarıdır:

    - Güvenli olmayan HTTP bağlamlarında localhost Control UI oturumlarının cihaz kimliği olmadan devam etmesine izin verir.
    - Eşleştirme kontrollerini atlatmaz.
    - Uzak (localhost olmayan) cihaz kimliği gereksinimlerini gevşetmez.

  </Accordion>
  <Accordion title="Yalnızca acil durum">
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
    `dangerouslyDisableDeviceAuth`, Control UI cihaz kimliği kontrollerini devre dışı bırakır ve ciddi bir güvenlik düşürmesidir. Acil kullanım sonrasında hızlıca geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Güvenilen proxy notu">
    - Başarılı güvenilen proxy kimlik doğrulaması, cihaz kimliği olmadan **operatör** Control UI oturumlarını kabul edebilir.
    - Bu, node rolündeki Control UI oturumlarını kapsamaz.
    - Aynı ana makinedeki loopback ters proxy’leri yine de güvenilen proxy kimlik doğrulamasını karşılamaz; bkz. [Güvenilen proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberi için [Tailscale](/tr/gateway/tailscale) sayfasına bakın.

## İçerik güvenlik ilkesi

Control UI sıkı bir `img-src` ilkesiyle gelir: yalnızca **aynı origin** varlıklarına, `data:` URL’lerine ve yerel olarak oluşturulan `blob:` URL’lerine izin verilir. Uzak `http(s)` ve protokole göreli görüntü URL’leri tarayıcı tarafından reddedilir ve ağ getirme istekleri oluşturmaz.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görüntüler (örneğin `/avatars/<id>`) render edilmeye devam eder; buna UI’nin getirip yerel `blob:` URL’lerine dönüştürdüğü kimliği doğrulanmış avatar rotaları da dahildir.
- Satır içi `data:image/...` URL’leri render edilmeye devam eder (protokol içi yükler için kullanışlıdır).
- Control UI tarafından oluşturulan yerel `blob:` URL’leri render edilmeye devam eder.
- Kanal metadata’sı tarafından yayılan uzak avatar URL’leri, Control UI’nin avatar yardımcılarında kaldırılır ve yerleşik logo/rozet ile değiştirilir; böylece ele geçirilmiş veya kötü amaçlı bir kanal, operatör tarayıcısından keyfi uzak görüntü getirmelerini zorlayamaz.

Bu davranışı elde etmek için herhangi bir şeyi değiştirmeniz gerekmez — her zaman açıktır ve yapılandırılamaz.

## Avatar rotası kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, Control UI avatar endpoint’i API’nin geri kalanıyla aynı gateway token’ını gerektirir:

- `GET /avatar/<agentId>` avatar görüntüsünü yalnızca kimliği doğrulanmış çağırıcılara döndürür. `GET /avatar/<agentId>?meta=1` avatar metadata’sını aynı kural altında döndürür.
- Her iki rotaya yapılan kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla eşleşir). Bu, avatar rotasının aksi halde korunan ana makinelerde agent kimliğini sızdırmasını önler.
- Control UI, avatarları getirirken gateway token’ını bearer header olarak iletir ve görüntünün dashboard’larda yine de render edilmesi için kimliği doğrulanmış blob URL’leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan ana makinelerde önerilmez), gateway’in geri kalanıyla uyumlu şekilde avatar rotası da kimliği doğrulanmamış hale gelir.

## Assistant medya rotası kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, assistant yerel medya önizlemeleri iki adımlı bir rota kullanır:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` normal Control UI operatör kimlik doğrulamasını gerektirir. Tarayıcı, erişilebilirliği kontrol ederken gateway token’ını bearer header olarak gönderir.
- Başarılı metadata yanıtları, tam olarak o kaynak yoluna kapsamlanmış kısa ömürlü bir `mediaTicket` içerir.
- Tarayıcıda render edilen görüntü, ses, video ve belge URL’leri etkin gateway token’ı veya parolası yerine `mediaTicket=<ticket>` kullanır. Ticket hızlıca sona erer ve farklı bir kaynağı yetkilendiremez.

Bu, yeniden kullanılabilir gateway kimlik bilgilerini görünür medya URL’lerine koymadan normal medya render işlemini tarayıcıya özgü medya öğeleriyle uyumlu tutar.

## UI’yi derleme

Gateway statik dosyaları `dist/control-ui` konumundan sunar. Bunları şu komutla derleyin:

```bash
pnpm ui:build
```

İsteğe bağlı mutlak taban (sabit varlık URL’leri istediğinizde):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Yerel geliştirme için (ayrı dev server):

```bash
pnpm ui:dev
```

Ardından UI’yi Gateway WS URL’nize yönlendirin (örn. `ws://127.0.0.1:18789`).

## Hata ayıklama/test: dev server + uzak Gateway

Control UI statik dosyalardır; WebSocket hedefi yapılandırılabilir ve HTTP origin’den farklı olabilir. Vite dev server’ı yerelde kullanmak, ancak Gateway’i başka bir yerde çalıştırmak istediğinizde bu kullanışlıdır.

<Steps>
  <Step title="UI dev server’ını başlatın">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="gatewayUrl ile açın">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    İsteğe bağlı tek seferlik kimlik doğrulama (gerekirse):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notlar">
    - `gatewayUrl` yüklemeden sonra localStorage’da saklanır ve URL’den kaldırılır.
    - `gatewayUrl` aracılığıyla tam bir `ws://` veya `wss://` endpoint’i geçiriyorsanız, tarayıcının query string’i doğru ayrıştırması için `gatewayUrl` değerini URL-encode edin.
    - `token` mümkün olduğunda URL fragment’i (`#token=...`) üzerinden geçirilmelidir. Fragment’ler sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` query parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca fallback olarak kullanılır ve bootstrap sonrasında hemen kaldırılır.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında, UI yapılandırma veya ortam kimlik bilgilerine fallback yapmaz. `token` (veya `password`) değerini açıkça sağlayın. Açık kimlik bilgilerinin eksik olması hatadır.
    - Gateway TLS arkasındaysa `wss://` kullanın (Tailscale Serve, HTTPS proxy vb.).
    - `gatewayUrl`, clickjacking’i önlemek için yalnızca üst düzey bir pencerede (gömülü değil) kabul edilir.
    - local loopback olmayan Control UI dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça ayarlamalıdır (tam origin’ler). Buna uzak dev kurulumları dahildir.
    - Gateway başlatma, etkin çalışma zamanı bind ve port değerinden `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel origin’leri seed edebilir, ancak uzak tarayıcı origin’leri yine de açık girdiler gerektirir.
    - Sıkı kontrollü yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, herhangi bir tarayıcı origin’ine izin ver anlamına gelir; “kullandığım ana makine neyse onunla eşleş” anlamına gelmez.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` Host-header origin fallback modunu etkinleştirir, ancak bu tehlikeli bir güvenlik modudur.

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

- [Dashboard](/tr/web/dashboard) — gateway dashboard’u
- [Health Checks](/tr/gateway/health) — gateway sağlık izleme
- [TUI](/tr/web/tui) — terminal kullanıcı arayüzü
- [WebChat](/tr/web/webchat) — tarayıcı tabanlı sohbet arayüzü
