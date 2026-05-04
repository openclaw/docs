---
read_when:
    - Gateway'i bir tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı kontrol kullanıcı arayüzü (sohbet, düğümler, yapılandırma)
title: Kontrol kullanıcı arayüzü
x-i18n:
    generated_at: "2026-05-04T09:36:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b68b5203b369de6a3354a7e7442ee38ee790875b2d7054b0c8ec997098fd9de
    source_path: web/control-ui.md
    workflow: 16
---

Kontrol Arayüzü, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfalı uygulamadır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` değerini ayarlayın (örn. `/openclaw`)

Aynı bağlantı noktasında **doğrudan Gateway WebSocket** ile iletişim kurar.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenmezse önce Gateway’i başlatın: `openclaw gateway`.

Kimlik doğrulama, WebSocket el sıkışması sırasında şu yollarla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üstbilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir proxy kimlik üstbilgileri

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçili gateway URL’si için bir token saklar; parolalar kalıcı olarak saklanmaz. İlk bağlantıda onboarding genellikle paylaşılan gizli anahtar kimlik doğrulaması için bir gateway token’ı oluşturur, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Kontrol Arayüzü’ne yeni bir tarayıcıdan veya cihazdan bağlandığınızda Gateway genellikle **tek seferlik eşleştirme onayı** ister. Bu, yetkisiz erişimi önlemeye yönelik bir güvenlik önlemidir.

**Göreceğiniz şey:** "disconnected (1008): pairing required"

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

Tarayıcı değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/genel anahtar) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve onu okuma erişiminden yazma/yönetici erişimine geçirirseniz bu sessiz bir yeniden bağlanma değil, onay yükseltmesi olarak değerlendirilir. OpenClaw eski onayı etkin tutar, daha geniş kapsamlı yeniden bağlanmayı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token rotasyonu ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik olarak onaylanır.
- `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı cihaz kimliğini sunduğunda Tailscale Serve, Kontrol Arayüzü operatör oturumları için eşleştirme turunu atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği oluşturur; bu nedenle tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

</Note>

## Kişisel kimlik (tarayıcıya yerel)

Kontrol Arayüzü, paylaşılan oturumlarda atıf için giden iletilere eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Bu kimlik tarayıcı depolamasında bulunur, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz iletilerdeki normal transcript yazarlık meta verileri dışında diğer cihazlara eşitlenmez veya sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya tarayıcı değiştirmek bunu boş duruma sıfırlar.

Aynı tarayıcıya yerel desen asistan avatarı geçersiz kılma için de geçerlidir. Yüklenen asistan avatarları, gateway tarafından çözümlenen kimliğin üzerine yalnızca yerel tarayıcıda bindirilir ve hiçbir zaman `config.patch` üzerinden gidip gelmez. Paylaşılan `ui.assistant.avatar` yapılandırma alanı, alanı doğrudan yazan UI dışı istemciler (betikli gateway’ler veya özel panolar gibi) için hâlâ kullanılabilir.

## Çalışma zamanı yapılandırma uç noktası

Kontrol Arayüzü çalışma zamanı ayarlarını `/__openclaw/control-ui-config.json` adresinden alır. Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar bunu alamaz ve başarılı bir alma işlemi için zaten geçerli bir gateway token’ı/parolası, Tailscale Serve kimliği veya güvenilir proxy kimliği gerekir.

## Dil desteği

Kontrol Arayüzü ilk yüklemede tarayıcı yerel ayarınıza göre kendini yerelleştirebilir. Daha sonra geçersiz kılmak için **Genel Bakış -> Gateway Erişimi -> Dil** bölümünü açın. Yerel ayar seçici, Görünüm altında değil Gateway Erişimi kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışı çeviriler tarayıcıda tembel yüklenir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve sonraki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Doküman çevirileri aynı İngilizce dışı yerel ayar kümesi için oluşturulur, ancak doküman sitesinin yerleşik Mintlify dil seçicisi, Mintlify’ın kabul ettiği yerel ayar kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) dokümanlar publish deposunda yine de oluşturulur; Mintlify bu kodları destekleyene kadar bu seçicide görünmeyebilirler.

## Görünüm temaları

Görünüm paneli yerleşik Claw, Knot ve Dash temalarını ve bir tarayıcıya yerel tweakcn içe aktarma yuvasını tutar. Bir temayı içe aktarmak için [tweakcn düzenleyicisini](https://tweakcn.com/editor/theme) açın, bir tema seçin veya oluşturun, **Paylaş**’a tıklayın ve kopyalanan tema bağlantısını Görünüm’e yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` kayıt URL’lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi düzenleyici URL’lerini, göreli `/themes/<id>` yollarını, ham tema kimliklerini ve `amethyst-haze` gibi varsayılan tema adlarını kabul eder.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde saklanır. Gateway yapılandırmasına yazılmaz ve cihazlar arasında eşitlenmez. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; temizlemek, içe aktarılan tema seçiliyse etkin temayı Claw’a geri geçirir.

## Neler yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden kısıtlı tek kullanımlık bir tarayıcı token’ı kullanır ve yalnızca backend gerçek zamanlı ses plugin’leri Gateway aktarım taşımasını kullanır. Aktarım, sağlayıcı kimlik bilgilerini Gateway’de tutarken tarayıcı mikrofon PCM akışını `talk.realtime.relay*` RPC’leri üzerinden gönderir ve daha büyük yapılandırılmış OpenClaw modeli için `openclaw_agent_consult` araç çağrılarını `chat.send` üzerinden geri yollar.
    - Sohbet’te araç çağrılarını + canlı araç çıktı kartlarını yayınlayın (agent olayları).

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, rüyalar">
    - Kanallar: yerleşik ve paketli/harici Plugin kanalları durumu, QR oturum açma ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`).
    - Örnekler: varlık listesi + yenileme (`system-presence`).
    - Oturumlar: liste + oturum başına model/thinking/fast/verbose/trace/reasoning geçersiz kılmaları (`sessions.list`, `sessions.patch`).
    - Rüyalar: Dreaming durumu, etkinleştir/devre dışı bırak anahtarı ve Rüya Günlüğü okuyucu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, node’lar, exec onayları">
    - Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalıştırma geçmişi (`cron.*`).
    - Skills: durum, etkinleştir/devre dışı bırak, yükle, API anahtarı güncellemeleri (`skills.*`).
    - Node’lar: liste + yetenekler (`node.list`).
    - Exec onayları: gateway veya node izin listelerini + `exec host=gateway/node` için sorma politikasını düzenleyin (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Yapılandırma">
    - `~/.openclaw/openclaw.json` dosyasını görüntüleyin/düzenleyin (`config.get`, `config.set`).
    - Doğrulamayla uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazma işlemleri, eşzamanlı düzenlemelerin üzerine yazmayı önlemek için bir temel hash koruması içerir.
    - Yazma işlemleri (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma yükündeki ref’ler için etkin SecretRef çözümlemesini ön denetimden geçirir; çözümlenemeyen etkin gönderilmiş ref’ler yazmadan önce reddedilir.
    - Şema + form işleme (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, doğrudan alt özetleri, iç içe nesne/joker/array/composition düğümlerinde doküman meta verileri ve mevcut olduğunda Plugin + kanal şemaları dahil); Ham JSON düzenleyicisi yalnızca snapshot güvenli bir ham gidiş dönüşe sahipse kullanılabilir.
    - Bir snapshot ham metni güvenle gidip getiremiyorsa Kontrol Arayüzü Form modunu zorlar ve o snapshot için Ham modu devre dışı bırakır.
    - Ham JSON düzenleyicisindeki "Kaydedilene sıfırla", düzleştirilmiş bir snapshot’ı yeniden işlemek yerine ham olarak yazılmış şekli (biçimlendirme, yorumlar, `$include` yerleşimi) korur; böylece snapshot güvenle gidip gelebildiğinde harici düzenlemeler sıfırlamadan sonra korunur.
    - Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizeye bozulmayı önlemek için form metin girişlerinde salt okunur işlenir.

  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/modeller snapshot’ları + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Olay günlüğü, Kontrol Arayüzü yenileme/RPC zamanlamalarının yanı sıra tarayıcı bu PerformanceObserver girdi türlerini sunduğunda uzun animasyon kareleri veya uzun görevler için tarayıcı yanıt verebilirliği girdilerini içerir.
    - Günlükler: filtre/dışa aktarma ile gateway dosya günlüklerinin canlı kuyruğu (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla birlikte paket/git güncellemesi + yeniden başlatma (`update.run`) çalıştırın, ardından çalışan gateway sürümünü doğrulamak için yeniden bağlandıktan sonra `update.status` yoklayın.

  </Accordion>
  <Accordion title="Cron işleri panel notları">
    - Yalıtılmış işler için teslimat varsayılan olarak özet duyurur. Yalnızca dahili çalıştırmalar istiyorsanız none seçeneğine geçebilirsiniz.
    - Duyuru seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) webhook URL’sine ayarlanmış olarak `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için webhook ve none teslimat modları kullanılabilir.
    - Gelişmiş düzenleme denetimleri, çalıştırmadan sonra silme, agent geçersiz kılmasını temizleme, cron exact/stagger seçenekleri, agent model/thinking geçersiz kılmaları ve en iyi çaba teslimat anahtarlarını içerir.
    - Form doğrulaması alan düzeyi hatalarla satır içinde yapılır; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Özel bir bearer token göndermek için `cron.webhookToken` ayarlayın; atlanırsa webhook kimlik doğrulama üstbilgisi olmadan gönderilir.
    - Kullanımdan kaldırılmış fallback: `notify: true` içeren saklanan eski işler, taşınana kadar `cron.webhook` kullanmaya devam edebilir.

  </Accordion>
</AccordionGroup>

## Sohbet davranışı

<AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` **engellemesizdir**: hemen `{ runId, status: "started" }` ile onay verir ve yanıt `chat` olayları üzerinden akış olarak gelir.
    - Sohbet yüklemeleri görüntüleri ve video olmayan dosyaları kabul eder. Görüntüler yerel görüntü yolunu korur; diğer dosyalar yönetilen medya olarak saklanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden göndermek, çalışma sürerken `{ status: "in_flight" }`, tamamlandıktan sonra ise `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları UI güvenliği için boyutla sınırlandırılır. Transkript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır meta veri bloklarını atlayabilir ve aşırı büyük iletileri bir yer tutucuyla (`[chat.history omitted: message too large]`) değiştirebilir.
    - Asistanın/üretilen görüntüler, yönetilen medya referansları olarak kalıcılaştırılır ve kimliği doğrulanmış Gateway medya URL'leri üzerinden geri sunulur; böylece yeniden yüklemeler, ham base64 görüntü yüklerinin sohbet geçmişi yanıtında kalmasına bağlı olmaz.
    - `chat.history`, görünür asistan metninden yalnızca görüntüleme amaçlı satır içi yönerge etiketlerini de çıkarır (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin araç çağrısı XML yüklerini (şunlar dahil: `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları) ve sızmış ASCII/tam genişlikli model kontrol belirteçlerini temizler; görünür metninin tamamı yalnızca tam sessiz belirteç `NO_REPLY` / `no_reply` olan asistan girdilerini atlar.
    - Etkin bir gönderim sırasında ve son geçmiş yenilemesinde, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürürse sohbet görünümü yerel iyimser kullanıcı/asistan iletilerini görünür tutar; Gateway geçmişi yetiştiğinde kanonik transkript bu yerel iletilerin yerini alır.
    - Canlı `chat` olayları teslimat durumudur; `chat.history` ise kalıcı oturum transkriptinden yeniden oluşturulur. Araç-son olaylarından sonra Control UI geçmişi yeniden yükler ve yalnızca küçük bir iyimser kuyruğu birleştirir; transkript sınırı [WebChat](/tr/web/webchat) bölümünde belgelenmiştir.
    - `chat.inject`, oturum transkriptine bir asistan notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (ajan çalıştırma yok, kanal teslimatı yok).
    - Sohbet başlığı, oturum seçiciden önce ajan filtresini gösterir ve oturum seçici seçili ajana göre kapsamlandırılır. Ajan değiştirmek yalnızca o ajana bağlı oturumları gösterir ve henüz kayıtlı pano oturumları yoksa o ajanın ana oturumuna döner.
    - Masaüstü genişliklerinde sohbet kontrolleri tek bir kompakt satırda kalır ve transkriptte aşağı kaydırırken daralır; yukarı kaydırmak, en üste dönmek veya en alta ulaşmak kontrolleri geri getirir.
    - Ardışık yinelenen yalnızca metin iletileri, sayı rozeti olan tek bir balon olarak işlenir. Görüntü, ek, araç çıktısı veya tuval önizlemesi taşıyan iletiler daraltılmaz.
    - Sohbet başlığı model ve düşünme seçicileri, etkin oturumu `sessions.patch` üzerinden hemen yamalar; bunlar tek turluk gönderim seçenekleri değil, kalıcı oturum geçersiz kılmalarıdır.
    - Control UI içinde `/new` yazmak, New Chat ile aynı yeni pano oturumunu oluşturur ve ona geçer. `/reset` yazmak, geçerli oturum için Gateway'in açık yerinde sıfırlamasını korur.
    - Sohbet model seçici, Gateway'in yapılandırılmış model görünümünü ister. `agents.defaults.models` varsa seçiciyi bu izin listesi yönetir. Aksi halde seçici, açık `models.providers.*.models` girdilerini ve kullanılabilir kimlik doğrulaması olan sağlayıcıları gösterir. Tam katalog, hata ayıklama `models.list` RPC'si üzerinden `view: "all"` ile kullanılabilir kalır.
    - Yeni Gateway oturum kullanım raporları yüksek bağlam baskısı gösterdiğinde, sohbet oluşturucu alanı bir bağlam bildirimi ve önerilen Compaction seviyelerinde normal oturum Compaction yolunu çalıştıran kompakt bir düğme gösterir. Eski belirteç anlık görüntüleri, Gateway yeniden güncel kullanım bildirene kadar gizlenir.

  </Accordion>
  <Accordion title="Talk mode (browser realtime)">
    Konuşma modu kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. OpenAI'yi `talk.provider: "openai"` ve `talk.providers.openai.apiKey` ile yapılandırın ya da Google'ı `talk.provider: "google"` ve `talk.providers.google.apiKey` ile yapılandırın; Voice Call gerçek zamanlı sağlayıcı yapılandırması yine yedek olarak yeniden kullanılabilir. Tarayıcı hiçbir zaman standart bir sağlayıcı API anahtarı almaz. OpenAI, WebRTC için geçici bir Realtime istemci sırrı alır. Google Live, Gateway tarafından belirtece kilitlenmiş talimatlar ve araç bildirimleriyle birlikte, tarayıcı WebSocket oturumu için tek kullanımlık, kısıtlanmış bir Live API kimlik doğrulama belirteci alır. Yalnızca arka uç gerçek zamanlı köprüsü sunan sağlayıcılar Gateway röle aktarımı üzerinden çalışır; böylece kimlik bilgileri ve tedarikçi soketleri sunucu tarafında kalırken tarayıcı sesi kimliği doğrulanmış Gateway RPC'leri üzerinden taşınır. Realtime oturum istemi Gateway tarafından birleştirilir; `talk.realtime.session` çağıran tarafından sağlanan talimat geçersiz kılmalarını kabul etmez.

    Sohbet oluşturucuda Konuşma kontrolü, mikrofon dikte düğmesinin yanındaki dalgalar düğmesidir. Konuşma başladığında, oluşturucu durum satırı `Connecting Talk...`, ses bağlandığında `Talk live` veya gerçek zamanlı bir araç çağrısı `chat.send` üzerinden yapılandırılmış daha büyük modele danışırken `Asking OpenClaw...` gösterir.

    Bakımcı canlı smoke testi: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`, OpenAI tarayıcı WebRTC SDP alışverişini, Google Live kısıtlanmış belirteçli tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway röle tarayıcı bağdaştırıcısını doğrular. Komut yalnızca sağlayıcı durumunu yazdırır ve sırları günlüğe kaydetmez.

  </Accordion>
  <Accordion title="Stop and abort">
    - **Durdur**'a tıklayın (`chat.abort` çağırır).
    - Bir çalışma etkinken normal takip iletileri kuyruğa alınır. Kuyruğa alınmış bir iletide **Yönlendir**'e tıklayarak bu takip iletisini çalışan tura enjekte edin.
    - Bant dışı iptal etmek için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi tek başına iptal ifadeleri).
    - `chat.abort`, o oturumun tüm etkin çalışmalarını iptal etmek için `{ sessionKey }` destekler (`runId` olmadan).

  </Accordion>
  <Accordion title="Abort partial retention">
    - Bir çalışma iptal edildiğinde, kısmi asistan metni UI içinde yine de gösterilebilir.
    - Gateway, arabelleğe alınmış çıktı varsa iptal edilmiş kısmi asistan metnini transkript geçmişine kalıcılaştırır.
    - Kalıcılaştırılmış girdiler iptal meta verisi içerir; böylece transkript tüketicileri iptal kısımlarını normal tamamlama çıktısından ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve web push

Control UI bir `manifest.webmanifest` ve bir servis çalışanıyla gelir; böylece modern tarayıcılar onu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık olmasa bile Gateway'in kurulu PWA'yı bildirimlerle uyandırmasını sağlar.

| Yüzey                                                 | Ne yapar                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA bildirimi. Erişilebilir olduğunda tarayıcılar "Uygulamayı kur" seçeneğini sunar. |
| `ui/public/sw.js`                                     | `push` olaylarını ve bildirim tıklamalarını işleyen servis çalışanı. |
| `push/vapid-keys.json` (OpenClaw durum dizini altında) | Web Push yüklerini imzalamak için kullanılan otomatik üretilmiş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                    | Kalıcılaştırılmış tarayıcı abonelik uç noktaları.                  |

Anahtarları sabitlemek istediğinizde (çok ana makineli dağıtımlar, sır döndürme veya testler için) VAPID anahtar çiftini Gateway işlemi üzerindeki ortam değişkenleriyle geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılan: `mailto:openclaw@localhost`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için bu kapsamla sınırlandırılmış Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID açık anahtarını getirir.
- `push.web.subscribe` — bir `endpoint` ile `keys.p256dh`/`keys.auth` kaydeder.
- `push.web.unsubscribe` — kayıtlı bir uç noktayı kaldırır.
- `push.web.test` — çağıranın aboneliğine bir test bildirimi gönderir.

<Note>
Web Push, iOS APNS röle yolundan (röle destekli push için bkz. [Yapılandırma](/tr/gateway/configuration)) ve yerel mobil eşlemeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Barındırılan yerleştirmeler

Asistan iletileri, `[embed ...]` kısa koduyla barındırılan web içeriğini satır içinde işleyebilir. iframe sandbox ilkesi `gateway.controlUi.embedSandbox` tarafından denetlenir:

<Tabs>
  <Tab title="strict">
    Barındırılan yerleştirmeler içinde betik yürütmeyi devre dışı bırakır.
  </Tab>
  <Tab title="scripts (default)">
    Kaynak yalıtımını korurken etkileşimli yerleştirmelere izin verir; bu varsayılandır ve genellikle bağımsız tarayıcı oyunları/widget'ları için yeterlidir.
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
`trusted` değerini yalnızca yerleştirilen belge gerçekten aynı kaynak davranışına ihtiyaç duyduğunda kullanın. Çoğu ajan tarafından üretilen oyun ve etkileşimli tuval için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` yerleştirme URL'leri varsayılan olarak engelli kalır. Bilerek `[embed url="https://..."]` öğesinin üçüncü taraf sayfaları yüklemesini istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Sohbet ileti genişliği

Gruplanmış sohbet iletileri okunabilir bir varsayılan en fazla genişlik kullanır. Geniş monitör dağıtımları, paketlenmiş CSS'i yamalamadan `gateway.controlUi.chatMessageMaxWidth` ayarlayarak bunu geçersiz kılabilir:

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
    Gateway'i loopback üzerinde tutun ve Tailscale Serve'ün onu HTTPS ile proxy'lemesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Varsayılan olarak Control UI/WebSocket Serve istekleri, `gateway.auth.allowTailscale` `true` olduğunda Tailscale kimlik başlıkları (`tailscale-user-login`) üzerinden kimlik doğrulaması yapabilir. OpenClaw kimliği, `x-forwarded-for` adresini `tailscale whois` ile çözümleyip başlıkla eşleştirerek doğrular ve bunları yalnızca istek Tailscale'in `x-forwarded-*` başlıklarıyla loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliği olan Control UI operatör oturumları için bu doğrulanmış Serve yolu cihaz eşleme gidiş gelişini de atlar; cihazsız tarayıcılar ve node rolü bağlantıları normal cihaz denetimlerini izlemeye devam eder. Serve trafiği için bile açık paylaşılan sır kimlik bilgileri gerektirmek istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu zaman uyumsuz Serve kimlik yolu için, aynı istemci IP'si ve kimlik doğrulama kapsamına yönelik başarısız kimlik doğrulama girişimleri hız sınırı yazımlarından önce serileştirilir. Bu nedenle aynı tarayıcıdan gelen eşzamanlı kötü yeniden denemeler, paralel yarışan iki düz eşleşmezlik yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Belirteçsiz Serve kimlik doğrulaması, gateway ana makinesinin güvenilir olduğunu varsayar. Bu ana makinede güvenilmeyen yerel kod çalıştırılabiliyorsa belirteç/parola kimlik doğrulaması zorunlu kılın.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ardından açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Eşleşen paylaşılan sırrı UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvensiz HTTP

Panoyu düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`), tarayıcı **güvenli olmayan bağlamda** çalışır ve WebCrypto'yu engeller. Varsayılan olarak OpenClaw, cihaz kimliği olmayan Kontrol UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Kontrol UI kimlik doğrulaması
- acil durum `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI'ı yerel olarak açın:

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

    `allowInsecureAuth` yalnızca yerel uyumluluk anahtarıdır:

    - localhost Kontrol UI oturumlarının güvenli olmayan HTTP bağlamlarında cihaz kimliği olmadan ilerlemesine izin verir.
    - Eşleştirme kontrollerini atlamaz.
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
    `dangerouslyDisableDeviceAuth`, Kontrol UI cihaz kimliği kontrollerini devre dışı bırakır ve ciddi bir güvenlik düşürmesidir. Acil durum kullanımından sonra hızla geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Güvenilen proxy notu">
    - Başarılı trusted-proxy kimlik doğrulaması, cihaz kimliği olmadan **operatör** Kontrol UI oturumlarına izin verebilir.
    - Bu, node rolündeki Kontrol UI oturumlarını kapsamaz.
    - Aynı ana makinedeki loopback ters proxy'leri yine de trusted-proxy kimlik doğrulamasını karşılamaz; bkz. [Güvenilen proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberi için bkz. [Tailscale](/tr/gateway/tailscale).

## İçerik güvenliği ilkesi

Kontrol UI sıkı bir `img-src` ilkesiyle gelir: yalnızca **aynı kaynaklı** varlıklara, `data:` URL'lerine ve yerel olarak oluşturulmuş `blob:` URL'lerine izin verilir. Uzak `http(s)` ve protokole bağlı görüntü URL'leri tarayıcı tarafından reddedilir ve ağ getirmesi başlatmaz.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görseller (örneğin `/avatars/<id>`) yine de görüntülenir; UI'ın getirip yerel `blob:` URL'lerine dönüştürdüğü kimlik doğrulamalı avatar rotaları da buna dahildir.
- Satır içi `data:image/...` URL'leri yine de görüntülenir (protokol içi yükler için kullanışlıdır).
- Kontrol UI tarafından oluşturulan yerel `blob:` URL'leri yine de görüntülenir.
- Kanal metadata'sı tarafından yayılan uzak avatar URL'leri, Kontrol UI'ın avatar yardımcılarında kaldırılır ve yerleşik logo/rozetle değiştirilir; böylece ele geçirilmiş veya kötü amaçlı bir kanal, operatör tarayıcısından rastgele uzak görsel getirmeleri zorlayamaz.

Bu davranışı elde etmek için hiçbir şeyi değiştirmeniz gerekmez — her zaman etkindir ve yapılandırılamaz.

## Avatar rota kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, Kontrol UI avatar uç noktası API'nin geri kalanıyla aynı gateway token'ını gerektirir:

- `GET /avatar/<agentId>` avatar görselini yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1` aynı kural altında avatar metadata'sını döndürür.
- Her iki rotaya yapılan kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla eşleşir). Bu, avatar rotasının aksi halde korunan ana makinelerde agent kimliğini sızdırmasını önler.
- Kontrol UI, avatarları getirirken gateway token'ını bearer başlığı olarak iletir ve görüntünün panolarda hâlâ görüntülenmesi için kimliği doğrulanmış blob URL'leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan ana makinelerde önerilmez), avatar rotası da gateway'in geri kalanıyla uyumlu olarak kimlik doğrulamasız hâle gelir.

## Asistan medya rota kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, asistan yerel medya önizlemeleri iki adımlı bir rota kullanır:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` normal Kontrol UI operatör kimlik doğrulamasını gerektirir. Tarayıcı, kullanılabilirliği denetlerken gateway token'ını bearer başlığı olarak gönderir.
- Başarılı metadata yanıtları, tam olarak o kaynak yolu için kapsamlanmış kısa ömürlü bir `mediaTicket` içerir.
- Tarayıcıda görüntülenen görsel, ses, video ve belge URL'leri etkin gateway token'ı veya parolası yerine `mediaTicket=<ticket>` kullanır. Bilet hızla sona erer ve farklı bir kaynağa yetki veremez.

Bu, yeniden kullanılabilir gateway kimlik bilgilerini görünür medya URL'lerine koymadan normal medya görüntülemeyi tarayıcının yerel medya öğeleriyle uyumlu tutar.

## UI'ı derleme

Gateway statik dosyaları `dist/control-ui` konumundan sunar. Bunları şu komutla derleyin:

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

Ardından UI'ı Gateway WS URL'nize yönlendirin (ör. `ws://127.0.0.1:18789`).

## Hata ayıklama/test etme: geliştirme sunucusu + uzak Gateway

Kontrol UI statik dosyalardan oluşur; WebSocket hedefi yapılandırılabilir ve HTTP kaynağından farklı olabilir. Vite geliştirme sunucusunu yerelde, Gateway'i ise başka bir yerde çalıştırmak istediğinizde bu kullanışlıdır.

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

    İsteğe bağlı tek seferlik kimlik doğrulama (gerekirse):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notlar">
    - `gatewayUrl`, yüklemeden sonra localStorage içinde saklanır ve URL'den kaldırılır.
    - `gatewayUrl` üzerinden tam bir `ws://` veya `wss://` uç noktası geçirirseniz, tarayıcının sorgu dizesini doğru ayrıştırması için `gatewayUrl` değerini URL ile kodlayın.
    - `token` mümkün olduğunda URL parçası (`#token=...`) üzerinden geçirilmelidir. Parçalar sunucuya gönderilmez; bu, istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca geri dönüş olarak kullanılır ve bootstrap sonrasında hemen kaldırılır.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında UI, yapılandırma veya ortam kimlik bilgilerine geri dönmez. `token` (veya `password`) açıkça sağlayın. Açık kimlik bilgileri eksikse bu bir hatadır.
    - Gateway TLS arkasındaysa `wss://` kullanın (Tailscale Serve, HTTPS proxy vb.).
    - `gatewayUrl`, clickjacking'i önlemek için yalnızca üst düzey pencerede kabul edilir (gömülü değil).
    - Loopback olmayan Kontrol UI dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça (tam kaynaklar) ayarlamalıdır. Buna uzak geliştirme kurulumları dahildir.
    - Gateway başlangıcı, etkili çalışma zamanı bind ve port değerlerinden `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel kaynakları besleyebilir, ancak uzak tarayıcı kaynakları yine de açık girdiler gerektirir.
    - Sıkı denetlenen yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, herhangi bir tarayıcı kaynağına izin ver anlamına gelir; "kullandığım ana makineyle eşleş" anlamına gelmez.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`, Host-header kaynak geri dönüş modunu etkinleştirir, ancak tehlikeli bir güvenlik modudur.

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
- [Sağlık Kontrolleri](/tr/gateway/health) — gateway sağlık izleme
- [TUI](/tr/web/tui) — terminal kullanıcı arayüzü
- [WebChat](/tr/web/webchat) — tarayıcı tabanlı sohbet arayüzü
