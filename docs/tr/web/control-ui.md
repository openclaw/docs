---
read_when:
    - Gateway’i bir tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı kontrol kullanıcı arayüzü (sohbet, düğümler, yapılandırma)
title: Kontrol Arayüzü
x-i18n:
    generated_at: "2026-05-02T23:39:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50bef807915f27406e19f1c6ca7d839a610d79ba79da85d7a78523400cbf9208
    source_path: web/control-ui.md
    workflow: 16
---

Control UI, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfalı uygulamadır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarlayın (örn. `/openclaw`)

Aynı bağlantı noktasında **doğrudan Gateway WebSocket** ile konuşur.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenmezse önce Gateway'i başlatın: `openclaw gateway`.

Kimlik doğrulama, WebSocket el sıkışması sırasında şunlar üzerinden sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik başlıkları
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir proxy kimlik başlıkları

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için bir token saklar; parolalar kalıcı olarak saklanmaz. Onboarding genellikle ilk bağlantıda paylaşılan gizli anahtarla kimlik doğrulama için bir gateway token'ı oluşturur, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Control UI'ye yeni bir tarayıcıdan veya cihazdan bağlandığınızda Gateway genellikle **tek seferlik eşleştirme onayı** gerektirir. Bu, yetkisiz erişimi önlemeye yönelik bir güvenlik önlemidir.

**Göreceğiniz şey:** "bağlantı kesildi (1008): eşleştirme gerekli"

<Steps>
  <Step title="Bekleyen istekleri listeleyin">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="İstek kimliğine göre onaylayın">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Tarayıcı değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/genel anahtar) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve siz onu okuma erişiminden yazma/yönetici erişimine geçirirseniz bu sessiz bir yeniden bağlanma değil, bir onay yükseltmesi olarak ele alınır. OpenClaw eski onayı etkin tutar, daha geniş kapsamlı yeniden bağlanmayı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik olarak onaylanır.
- `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı kendi cihaz kimliğini sunduğunda Tailscale Serve, Control UI operatör oturumları için eşleştirme turunu atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği oluşturur; bu nedenle tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

</Note>

## Kişisel kimlik (tarayıcıya yerel)

Control UI, paylaşılan oturumlarda atıf için giden iletilere eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Tarayıcı depolamasında yaşar, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz iletilerdeki normal transcript yazarlık meta verilerinin ötesinde başka cihazlara senkronize edilmez veya sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya tarayıcı değiştirmek bunu boş hale sıfırlar.

Aynı tarayıcıya yerel desen, asistan avatarı geçersiz kılması için de geçerlidir. Yüklenen asistan avatarları, yalnızca yerel tarayıcıda gateway tarafından çözümlenen kimliğin üzerine bindirilir ve hiçbir zaman `config.patch` üzerinden gidip gelmez. Paylaşılan `ui.assistant.avatar` yapılandırma alanı, alanı doğrudan yazan UI dışı istemciler için hâlâ kullanılabilir (betikli gateway'ler veya özel panolar gibi).

## Çalışma zamanı yapılandırma uç noktası

Control UI, çalışma zamanı ayarlarını `/__openclaw/control-ui-config.json` adresinden alır. Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı gateway kimlik doğrulaması tarafından korunur: kimliği doğrulanmamış tarayıcılar bunu alamaz ve başarılı bir alma işlemi için halihazırda geçerli bir gateway token'ı/parolası, Tailscale Serve kimliği veya güvenilir proxy kimliği gerekir.

## Dil desteği

Control UI, ilk yüklemede tarayıcı yerel ayarınıza göre kendini yerelleştirebilir. Bunu daha sonra geçersiz kılmak için **Genel Bakış -> Gateway Erişimi -> Dil** bölümünü açın. Yerel ayar seçici Görünüm altında değil, Gateway Erişimi kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışı çeviriler tarayıcıda tembel yüklenir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve sonraki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Doküman çevirileri aynı İngilizce dışı yerel ayar kümesi için oluşturulur, ancak doküman sitesinin yerleşik Mintlify dil seçicisi Mintlify'nin kabul ettiği yerel ayar kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) dokümanlar yayın reposunda hâlâ oluşturulur; Mintlify bu kodları destekleyene kadar bu seçicide görünmeyebilirler.

## Görünüm temaları

Görünüm paneli yerleşik Claw, Knot ve Dash temalarını, ayrıca tarayıcıya yerel bir tweakcn içe aktarma yuvasını tutar. Bir temayı içe aktarmak için [tweakcn temaları](https://tweakcn.com/themes) sayfasını açın, bir tema seçin veya oluşturun, **Paylaş**'a tıklayın ve kopyalanan tema bağlantısını Görünüm'e yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` kayıt URL'lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi düzenleyici URL'lerini, göreli `/themes/<id>` yollarını, ham tema kimliklerini ve `amethyst-haze` gibi varsayılan tema adlarını da kabul eder.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde saklanır. Gateway yapılandırmasına yazılmaz ve cihazlar arasında senkronize edilmez. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; temizlemek, içe aktarılan tema seçiliyse etkin temayı Claw'a geri geçirir.

## Ne yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Sunucu tarafı STT ile Sohbet oluşturucusuna dikte edin (`chat.transcribeAudio`). Tarayıcı kısa bir mikrofon klibi kaydeder ve bunu Gateway'e gönderir; Gateway yapılandırılmış `tools.media.audio` transkripsiyon işlem hattını çalıştırır ve sağlayıcı kimlik bilgilerini tarayıcıya göstermeden taslak metni döndürür.
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden kısıtlı tek kullanımlık bir tarayıcı token'ı kullanır ve yalnızca arka uç gerçek zamanlı ses plugin'leri Gateway aktarma taşımasını kullanır. Aktarma, tarayıcı mikrofon PCM'ini `talk.realtime.relay*` RPC'leri üzerinden akıtırken sağlayıcı kimlik bilgilerini Gateway'de tutar ve daha büyük yapılandırılmış OpenClaw modeli için `openclaw_agent_consult` araç çağrılarını `chat.send` üzerinden geri gönderir.
    - Sohbet'te araç çağrılarını ve canlı araç çıktı kartlarını akıtın (ajan olayları).

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, dreams">
    - Kanallar: yerleşik ve paketlenmiş/harici plugin kanallarının durumu, QR girişi ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`).
    - Örnekler: varlık listesi + yenileme (`system-presence`).
    - Oturumlar: liste + oturum başına model/düşünme/hızlı/ayrıntılı/iz/reasoning geçersiz kılmaları (`sessions.list`, `sessions.patch`).
    - Dreams: dreaming durumu, etkinleştirme/devre dışı bırakma anahtarı ve Dream Diary okuyucu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, düğümler, exec onayları">
    - Cron işleri: listeleme/ekleme/düzenleme/çalıştırma/etkinleştirme/devre dışı bırakma + çalıştırma geçmişi (`cron.*`).
    - Skills: durum, etkinleştirme/devre dışı bırakma, yükleme, API anahtarı güncellemeleri (`skills.*`).
    - Düğümler: liste + yetenekler (`node.list`).
    - Exec onayları: gateway veya düğüm izin listelerini + `exec host=gateway/node` için sorma politikasını düzenleyin (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Yapılandırma">
    - `~/.openclaw/openclaw.json` görüntüleyin/düzenleyin (`config.get`, `config.set`).
    - Doğrulama ile uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazma işlemleri, eşzamanlı düzenlemelerin üzerine yazılmasını önlemek için bir temel karma koruması içerir.
    - Yazma işlemleri (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma yükündeki ref'ler için etkin SecretRef çözümlemesini önceden kontrol eder; çözümlenemeyen etkin gönderilmiş ref'ler yazmadan önce reddedilir.
    - Şema + form işleme (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, doğrudan alt özetleri, iç içe nesne/joker/array/composition düğümlerinde doküman meta verileri ve mevcut olduğunda plugin + kanal şemaları dahil); Ham JSON düzenleyici yalnızca snapshot güvenli bir ham gidiş dönüşe sahipse kullanılabilir.
    - Bir snapshot ham metni güvenli şekilde gidiş dönüş yapamıyorsa Control UI Form modunu zorunlu kılar ve o snapshot için Ham modu devre dışı bırakır.
    - Ham JSON düzenleyici "Kaydedilene sıfırla", düzleştirilmiş bir snapshot'ı yeniden işlemek yerine ham yazılmış biçimi (biçimlendirme, yorumlar, `$include` düzeni) korur; böylece snapshot güvenli şekilde gidiş dönüş yapabildiğinde harici düzenlemeler sıfırlamadan sonra korunur.
    - Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizeye bozulmayı önlemek için form metin girişlerinde salt okunur işlenir.

  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/modeller snapshot'ları + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Günlükler: filtre/dışa aktarma ile gateway dosya günlüklerinin canlı takibi (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla bir paket/git güncellemesi + yeniden başlatma çalıştırın (`update.run`), ardından çalışan gateway sürümünü doğrulamak için yeniden bağlandıktan sonra `update.status` yoklayın.

  </Accordion>
  <Accordion title="Cron işleri panel notları">
    - Yalıtılmış işler için teslimat varsayılanı özet duyurusudur. Yalnızca dahili çalıştırmalar istiyorsanız yok olarak değiştirebilirsiniz.
    - Duyuru seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) webhook URL'sine ayarlanmış şekilde `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için webhook ve yok teslimat modları kullanılabilir.
    - Gelişmiş düzenleme kontrolleri çalıştırmadan sonra silme, ajan geçersiz kılmasını temizleme, cron kesin/kademeli seçenekleri, ajan model/düşünme geçersiz kılmaları ve en iyi çaba teslimat anahtarlarını içerir.
    - Form doğrulaması alan düzeyi hatalarla satır içidir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Ayrılmış bir bearer token göndermek için `cron.webhookToken` ayarlayın; atlanırsa webhook kimlik doğrulama başlığı olmadan gönderilir.
    - Kullanımdan kaldırılmış yedek: `notify: true` içeren depolanmış eski işler, taşınana kadar `cron.webhook` kullanmaya devam edebilir.

  </Accordion>
</AccordionGroup>

## Sohbet davranışı

<AccordionGroup>
  <Accordion title="Gönderme ve geçmiş semantiği">
    - `chat.send` **engellemesizdir**: `{ runId, status: "started" }` ile hemen onay verir ve yanıt `chat` olayları üzerinden stream edilir.
    - `chat.transcribeAudio`, Chat taslakları için tek seferlik bir dikte yardımcısıdır. Tarayıcıda kaydedilmiş base64 sesi kabul eder, yüklemeleri Gateway WebSocket çerçeve sınırının altında tutar, geçici bir yerel dosya yazar, etkin Gateway yapılandırmasıyla medya-anlama ses transkripsiyonu çalıştırır, `{ text, provider, model }` döndürür ve geçici dosyayı kaldırır. Bir ajan çalışması oluşturmaz ve gerçek zamanlı Talk'tan ayrıdır.
    - Chat yüklemeleri, görüntüleri ve video olmayan dosyaları kabul eder. Görüntüler yerel görüntü yolunu korur; diğer dosyalar yönetilen medya olarak saklanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden gönderme, çalışma sürerken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları, UI güvenliği için boyutla sınırlandırılır. Transkript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır meta veri bloklarını atlayabilir ve aşırı büyük iletileri bir yer tutucuyla değiştirebilir (`[chat.history omitted: message too large]`).
    - Asistan/üretilmiş görüntüler yönetilen medya referansları olarak kalıcı hale getirilir ve kimliği doğrulanmış Gateway medya URL'leri üzerinden geri sunulur; böylece yeniden yüklemeler, ham base64 görüntü yüklerinin chat geçmişi yanıtında kalmasına bağlı olmaz.
    - `chat.history` ayrıca görünür asistan metninden yalnızca gösterim amaçlı satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model kontrol token'larını temizler ve görünür metninin tamamı yalnızca tam sessiz token olan `NO_REPLY` / `no_reply` olan asistan girdilerini atlar.
    - Etkin bir gönderme sırasında ve son geçmiş yenilemesinde, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürürse chat görünümü yerel iyimser kullanıcı/asistan iletilerini görünür tutar; Gateway geçmişi yetiştiğinde kanonik transkript bu yerel iletilerin yerini alır.
    - `chat.inject`, oturum transkriptine bir asistan notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (ajan çalışması yok, kanal teslimi yok).
    - Chat başlığı modeli ve düşünme seçicileri etkin oturumu `sessions.patch` aracılığıyla hemen yamalar; bunlar tek turluk gönderme seçenekleri değil, kalıcı oturum geçersiz kılmalarıdır.
    - Control UI içinde `/new` yazmak, New Chat ile aynı yeni pano oturumunu oluşturur ve ona geçer. `/reset` yazmak, geçerli oturum için Gateway'in açık yerinde sıfırlamasını korur.
    - Chat model seçicisi, Gateway'in yapılandırılmış model görünümünü ister. `agents.defaults.models` varsa, seçiciyi bu izin listesi yönlendirir. Aksi takdirde seçici, açık `models.providers.*.models` girdilerini ve kullanılabilir kimlik doğrulaması olan sağlayıcıları gösterir. Tam katalog, hata ayıklama `models.list` RPC'si üzerinden `view: "all"` ile kullanılabilir kalır.
    - Yeni Gateway oturum kullanım raporları yüksek bağlam baskısı gösterdiğinde, chat oluşturucu alanı bir bağlam bildirimi ve önerilen compaction düzeylerinde normal oturum compaction yolunu çalıştıran bir kompakt düğmesi gösterir. Eski token anlık görüntüleri, Gateway yeniden yeni kullanım raporu verene kadar gizlenir.

  </Accordion>
  <Accordion title="Talk modu (tarayıcı gerçek zamanlı)">
    Talk modu kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. OpenAI'yi `talk.provider: "openai"` artı `talk.providers.openai.apiKey` ile yapılandırın veya Google'ı `talk.provider: "google"` artı `talk.providers.google.apiKey` ile yapılandırın; Voice Call gerçek zamanlı sağlayıcı yapılandırması yine de yedek olarak yeniden kullanılabilir. Tarayıcı hiçbir zaman standart bir sağlayıcı API anahtarı almaz. OpenAI, WebRTC için geçici bir Realtime istemci sırrı alır. Google Live, tarayıcı WebSocket oturumu için tek kullanımlık kısıtlı bir Live API kimlik doğrulama token'ı alır; talimatlar ve araç bildirimleri Gateway tarafından token'a kilitlenir. Yalnızca arka uç gerçek zamanlı köprüsü sunan sağlayıcılar Gateway röle aktarımı üzerinden çalışır; böylece tarayıcı sesi kimliği doğrulanmış Gateway RPC'leri üzerinden hareket ederken kimlik bilgileri ve satıcı socket'leri sunucu tarafında kalır. Realtime oturum istemi Gateway tarafından derlenir; `talk.realtime.session` çağıranın sağladığı talimat geçersiz kılmalarını kabul etmez.

    Chat oluşturucusunda Talk denetimi, mikrofon dikte düğmesinin yanındaki dalga düğmesidir. Talk başladığında oluşturucu durum satırı `Connecting Talk...`, ses bağlıyken `Talk live` veya gerçek zamanlı bir araç çağrısı `chat.send` üzerinden yapılandırılmış daha büyük modele danışırken `Asking OpenClaw...` gösterir.

    Maintainer canlı smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`, OpenAI tarayıcı WebRTC SDP değişimini, Google Live kısıtlı-token tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway röle tarayıcı bağdaştırıcısını doğrular. Komut yalnızca sağlayıcı durumunu yazdırır ve sırları günlüğe yazmaz.

  </Accordion>
  <Accordion title="Durdurma ve iptal">
    - **Stop**'a tıklayın (`chat.abort` çağırır).
    - Bir çalışma etkinken normal takipler kuyruğa alınır. Kuyruktaki bir iletide **Steer**'a tıklayarak bu takibi çalışan tura enjekte edin.
    - Bant dışı iptal etmek için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi bağımsız iptal ifadeleri).
    - `chat.abort`, o oturumun tüm etkin çalışmalarını iptal etmek için `{ sessionKey }` destekler (`runId` yok).

  </Accordion>
  <Accordion title="İptal kısmi koruması">
    - Bir çalışma iptal edildiğinde, kısmi asistan metni UI'da yine de gösterilebilir.
    - Gateway, tamponlanmış çıktı varsa iptal edilen kısmi asistan metnini transkript geçmişine kalıcı olarak kaydeder.
    - Kalıcı girdiler iptal meta verisi içerir; böylece transkript tüketicileri iptal kısımlarını normal tamamlama çıktısından ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve web push

Control UI, bir `manifest.webmanifest` ve bir service worker ile gelir; bu nedenle modern tarayıcılar onu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık olmasa bile Gateway'in yüklü PWA'yı bildirimlerle uyandırmasını sağlar.

| Yüzey                                                 | Ne yapar                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifesti. Tarayıcılar erişilebilir olduğunda "Uygulamayı yükle" seçeneğini sunar. |
| `ui/public/sw.js`                                     | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw durum dizini altında) | Web Push yüklerini imzalamak için kullanılan otomatik oluşturulmuş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                    | Kalıcı tarayıcı aboneliği endpoint'leri.                           |

Anahtarları sabitlemek istediğinizde (çok konaklı dağıtımlar, sır rotasyonu veya testler için) VAPID anahtar çiftini Gateway sürecindeki env var'lar üzerinden geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılan: `mailto:openclaw@localhost`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için şu kapsam kapılı Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID genel anahtarını getirir.
- `push.web.subscribe` — bir `endpoint` ile `keys.p256dh`/`keys.auth` kaydeder.
- `push.web.unsubscribe` — kayıtlı bir endpoint'i kaldırır.
- `push.web.test` — çağıranın aboneliğine bir test bildirimi gönderir.

<Note>
Web Push, iOS APNS röle yolundan (röle destekli push için bkz. [Yapılandırma](/tr/gateway/configuration)) ve yerel mobil eşlemeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Barındırılan yerleştirmeler

Asistan iletileri, `[embed ...]` kısa koduyla barındırılan web içeriğini satır içinde render edebilir. iframe sandbox ilkesi `gateway.controlUi.embedSandbox` tarafından denetlenir:

<Tabs>
  <Tab title="katı">
    Barındırılan yerleştirmelerin içinde script yürütmeyi devre dışı bırakır.
  </Tab>
  <Tab title="script'ler (varsayılan)">
    Kaynak izolasyonunu korurken etkileşimli yerleştirmelere izin verir; varsayılan budur ve genellikle kendi kendine yeterli tarayıcı oyunları/widget'ları için yeterlidir.
  </Tab>
  <Tab title="güvenilir">
    Bilerek daha güçlü ayrıcalıklara ihtiyaç duyan aynı-site belgeleri için `allow-scripts` üzerine `allow-same-origin` ekler.
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
`trusted` değerini yalnızca gömülü belge gerçekten aynı-origin davranışına ihtiyaç duyduğunda kullanın. Ajan tarafından üretilen çoğu oyun ve etkileşimli canvas için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` yerleştirme URL'leri varsayılan olarak engelli kalır. Bilerek `[embed url="https://..."]` ile üçüncü taraf sayfaları yüklemek istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Chat ileti genişliği

Gruplanmış chat iletileri okunabilir bir varsayılan maksimum genişlik kullanır. Geniş monitör dağıtımları, paketlenmiş CSS'i yamalamadan `gateway.controlUi.chatMessageMaxWidth` ayarlayarak bunu geçersiz kılabilir:

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
    Gateway'i local loopback üzerinde tutun ve Tailscale Serve'ün onu HTTPS ile proxy'lemesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath`)

    Varsayılan olarak Control UI/WebSocket Serve istekleri, `gateway.auth.allowTailscale` `true` olduğunda Tailscale kimlik başlıkları (`tailscale-user-login`) üzerinden kimlik doğrulayabilir. OpenClaw, `x-forwarded-for` adresini `tailscale whois` ile çözerek ve başlıkla eşleştirerek kimliği doğrular; bunları yalnızca istek Tailscale'in `x-forwarded-*` başlıklarıyla local loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliği olan Control UI operatör oturumları için bu doğrulanmış Serve yolu cihaz eşleme turunu da atlar; cihazsız tarayıcılar ve node-rolü bağlantıları normal cihaz kontrollerini izlemeye devam eder. Serve trafiği için bile açık paylaşılan sır kimlik bilgileri istemek istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu async Serve kimlik yolu için, aynı istemci IP'si ve kimlik doğrulama kapsamındaki başarısız kimlik doğrulama denemeleri, hız sınırı yazımlarından önce seri hale getirilir. Bu nedenle aynı tarayıcıdan gelen eşzamanlı hatalı yeniden denemeler, paralel yarışan iki düz uyuşmazlık yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Token'sız Serve kimlik doğrulaması, gateway konağının güvenilir olduğunu varsayar. O konakta güvenilmeyen yerel kod çalışabiliyorsa token/parola kimlik doğrulaması isteyin.
    </Warning>

  </Tab>
  <Tab title="Tailnet'e bağla + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ardından açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath`)

    Eşleşen paylaşılan sırrı UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvensiz HTTP

Panoyu düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`), tarayıcı **güvenli olmayan bir bağlamda** çalışır ve WebCrypto'yu engeller. Varsayılan olarak OpenClaw, cihaz kimliği olmayan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- yalnızca localhost için `gateway.controlUi.allowInsecureAuth=true` ile güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Kontrol arayüzü kimlik doğrulaması
- acil durum `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS kullanın (Tailscale Serve) veya arayüzü yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway ana makinesinde)

<AccordionGroup>
  <Accordion title="Güvensiz kimlik doğrulama anahtarının davranışı">
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

    - Güvenli olmayan HTTP bağlamlarında localhost Kontrol arayüzü oturumlarının cihaz kimliği olmadan ilerlemesine izin verir.
    - Eşleştirme denetimlerini atlatmaz.
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
    `dangerouslyDisableDeviceAuth` Kontrol arayüzü cihaz kimliği denetimlerini devre dışı bırakır ve ciddi bir güvenlik düşüşüdür. Acil durum kullanımından sonra hızla geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy notu">
    - Başarılı trusted-proxy kimlik doğrulaması, cihaz kimliği olmadan **operatör** Kontrol arayüzü oturumlarına izin verebilir.
    - Bu, node rolündeki Kontrol arayüzü oturumlarını kapsamaz.
    - Aynı ana makine üzerindeki loopback ters proxy'leri yine de trusted-proxy kimlik doğrulamasını karşılamaz; bkz. [Trusted proxy auth](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberliği için [Tailscale](/tr/gateway/tailscale) bölümüne bakın.

## İçerik güvenliği ilkesi

Kontrol arayüzü sıkı bir `img-src` ilkesiyle gelir: yalnızca **same-origin** varlıklara, `data:` URL'lerine ve yerel olarak oluşturulan `blob:` URL'lerine izin verilir. Uzak `http(s)` ve protokole göreli görüntü URL'leri tarayıcı tarafından reddedilir ve ağ istekleri başlatmaz.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görüntüler (örneğin `/avatars/<id>`) hâlâ işlenir; arayüzün getirip yerel `blob:` URL'lerine dönüştürdüğü kimliği doğrulanmış avatar rotaları buna dahildir.
- Satır içi `data:image/...` URL'leri hâlâ işlenir (protokol içi yükler için kullanışlıdır).
- Kontrol arayüzü tarafından oluşturulan yerel `blob:` URL'leri hâlâ işlenir.
- Kanal metadata'sı tarafından yayımlanan uzak avatar URL'leri, Kontrol arayüzünün avatar yardımcılarında çıkarılır ve yerleşik logo/rozetle değiştirilir; böylece ele geçirilmiş veya kötü amaçlı bir kanal, bir operatör tarayıcısından keyfi uzak görüntü getirmelerini zorlayamaz.

Bu davranışı elde etmek için herhangi bir şeyi değiştirmeniz gerekmez — her zaman etkindir ve yapılandırılamaz.

## Avatar rotası kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, Kontrol arayüzü avatar endpoint'i API'nin geri kalanıyla aynı gateway token'ını gerektirir:

- `GET /avatar/<agentId>` avatar görüntüsünü yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1` aynı kural kapsamında avatar metadata'sını döndürür.
- Her iki rotaya yapılan kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla uyumlu olarak). Bu, avatar rotasının aksi halde korunan ana makinelerde ajan kimliğini sızdırmasını önler.
- Kontrol arayüzü, avatarları getirirken gateway token'ını bearer header olarak iletir ve görüntünün panolarda hâlâ işlenmesi için kimliği doğrulanmış blob URL'leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan ana makinelerde önerilmez), avatar rotası da gateway'in geri kalanıyla uyumlu olarak kimliği doğrulanmamış hale gelir.

## Arayüzü derleme

Gateway statik dosyaları `dist/control-ui` konumundan sunar. Bunları şu komutla derleyin:

```bash
pnpm ui:build
```

İsteğe bağlı mutlak base (sabit varlık URL'leri istediğinizde):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Yerel geliştirme için (ayrı geliştirme sunucusu):

```bash
pnpm ui:dev
```

Ardından arayüzü Gateway WS URL'nize yönlendirin (ör. `ws://127.0.0.1:18789`).

## Hata ayıklama/test: geliştirme sunucusu + uzak Gateway

Kontrol arayüzü statik dosyalardan oluşur; WebSocket hedefi yapılandırılabilir ve HTTP origin'inden farklı olabilir. Vite geliştirme sunucusunu yerelde kullanmak, ancak Gateway'i başka bir yerde çalıştırmak istediğinizde bu kullanışlıdır.

<Steps>
  <Step title="Arayüz geliştirme sunucusunu başlatın">
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
    - `gatewayUrl` yüklemeden sonra localStorage içinde saklanır ve URL'den kaldırılır.
    - `gatewayUrl` üzerinden tam bir `ws://` veya `wss://` endpoint'i geçiriyorsanız, tarayıcının query string'i doğru ayrıştırması için `gatewayUrl` değerini URL-encode edin.
    - `token` mümkün olduğunda URL fragment'i (`#token=...`) üzerinden geçirilmelidir. Fragment'ler sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` query parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca fallback olarak kullanılır ve bootstrap sonrasında hemen çıkarılır.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında arayüz config veya environment kimlik bilgilerine fallback yapmaz. `token` (veya `password`) açıkça sağlayın. Açık kimlik bilgilerinin eksik olması hatadır.
    - Gateway TLS arkasındayken (Tailscale Serve, HTTPS proxy vb.) `wss://` kullanın.
    - `gatewayUrl` clickjacking'i önlemek için yalnızca üst düzey bir pencerede (gömülü değil) kabul edilir.
    - Loopback olmayan Kontrol arayüzü dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça ayarlamalıdır (tam origin'ler). Buna uzak geliştirme kurulumları dahildir.
    - Gateway başlangıcı, etkili runtime bind ve porttan `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel origin'leri seed edebilir, ancak uzak tarayıcı origin'leri yine de açık girdilere ihtiyaç duyar.
    - Sıkı denetlenen yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, "kullandığım ana makineyle eşleştir" değil, herhangi bir tarayıcı origin'ine izin ver anlamına gelir.
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

- [Pano](/tr/web/dashboard) — gateway panosu
- [Sağlık Denetimleri](/tr/gateway/health) — gateway sağlık izlemesi
- [TUI](/tr/web/tui) — terminal kullanıcı arayüzü
- [WebChat](/tr/web/webchat) — tarayıcı tabanlı sohbet arayüzü
