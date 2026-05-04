---
read_when:
    - Gateway'i bir tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı denetim arayüzü (sohbet, düğümler, yapılandırma)
title: Kontrol kullanıcı arayüzü
x-i18n:
    generated_at: "2026-05-04T09:07:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 896c75116d7a396571017ac6e6db7ff6ce328617e44470c303fd41af58aa2bd7
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

Kimlik doğrulama, WebSocket el sıkışması sırasında şunlarla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üst bilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir proxy kimlik üst bilgileri

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçilen gateway URL'si için bir token tutar; parolalar kalıcı olarak saklanmaz. İlk bağlanmada onboarding genellikle paylaşılan gizli anahtar kimlik doğrulaması için bir gateway token'ı oluşturur, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Control UI'ye yeni bir tarayıcıdan veya cihazdan bağlandığınızda, Gateway genellikle **tek seferlik eşleştirme onayı** ister. Bu, yetkisiz erişimi önlemek için bir güvenlik önlemidir.

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

Tarayıcı değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) eşleştirmeyi yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve onu okuma erişiminden yazma/yönetici erişimine değiştirirseniz, bu sessiz yeniden bağlanma değil, bir onay yükseltmesi olarak değerlendirilir. OpenClaw eski onayı etkin tutar, daha geniş kapsamlı yeniden bağlanmayı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik onaylanır.
- `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı cihaz kimliğini sunduğunda Tailscale Serve, Control UI operatör oturumları için eşleştirme gidiş gelişini atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği oluşturur; bu nedenle tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

</Note>

## Kişisel kimlik (tarayıcıya yerel)

Control UI, paylaşılan oturumlarda atıf için giden iletilere eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Bu kimlik tarayıcı depolamasında tutulur, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz iletilerdeki normal transkript yazarlığı meta verileri dışında diğer cihazlara eşitlenmez veya sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya tarayıcı değiştirmek bunu boş hale sıfırlar.

Aynı tarayıcıya yerel desen, asistan avatarı geçersiz kılması için de geçerlidir. Yüklenen asistan avatarları, gateway tarafından çözümlenen kimliğin üzerine yalnızca yerel tarayıcıda bindirilir ve hiçbir zaman `config.patch` üzerinden gidip gelmez. Paylaşılan `ui.assistant.avatar` config alanı, alanı doğrudan yazan UI dışı istemciler (betikli gateway'ler veya özel panolar gibi) için hâlâ kullanılabilir.

## Çalışma zamanı config uç noktası

Control UI, çalışma zamanı ayarlarını `/__openclaw/control-ui-config.json` konumundan alır. Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar onu alamaz ve başarılı bir alma işlemi için ya zaten geçerli bir gateway token'ı/parolası, Tailscale Serve kimliği ya da güvenilir proxy kimliği gerekir.

## Dil desteği

Control UI, ilk yüklemede tarayıcı yerel ayarınıza göre kendini yerelleştirebilir. Daha sonra bunu geçersiz kılmak için **Genel Bakış -> Gateway Erişimi -> Dil** bölümünü açın. Yerel ayar seçici Görünüm altında değil, Gateway Erişimi kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışındaki çeviriler tarayıcıda tembel yüklenir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve gelecekteki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Docs çevirileri aynı İngilizce dışı yerel ayar kümesi için oluşturulur, ancak docs sitesinin yerleşik Mintlify dil seçicisi Mintlify'nin kabul ettiği yerel ayar kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) docs yine de yayın reposunda oluşturulur; Mintlify bu kodları destekleyene kadar bu seçicide görünmeyebilirler.

## Görünüm temaları

Görünüm paneli, yerleşik Claw, Knot ve Dash temalarının yanı sıra tarayıcıya yerel tek bir tweakcn içe aktarma yuvasını tutar. Bir tema içe aktarmak için [tweakcn düzenleyicisini](https://tweakcn.com/editor/theme) açın, bir tema seçin veya oluşturun, **Paylaş**'a tıklayın ve kopyalanan tema bağlantısını Görünüm'e yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` kayıt URL'lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi düzenleyici URL'lerini, göreli `/themes/<id>` yollarını, ham tema kimliklerini ve `amethyst-haze` gibi varsayılan tema adlarını kabul eder.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde saklanır. Gateway config'e yazılmaz ve cihazlar arasında eşitlenmez. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; içe aktarılan tema seçiliyse temizlemek etkin temayı Claw'a geri döndürür.

## Neler yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden kısıtlı tek kullanımlık bir tarayıcı token'ı kullanır ve yalnızca arka uç gerçek zamanlı ses Plugin'leri Gateway aktarma taşımasını kullanır. Aktarma, sağlayıcı kimlik bilgilerini Gateway üzerinde tutarken tarayıcı `talk.realtime.relay*` RPC'leri üzerinden mikrofon PCM'i yayınlar ve daha büyük yapılandırılmış OpenClaw modeli için `openclaw_agent_consult` araç çağrılarını `chat.send` üzerinden geri gönderir.
    - Sohbet içinde araç çağrılarını + canlı araç çıktı kartlarını yayınlayın (ajan olayları).

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, rüyalar">
    - Kanallar: yerleşik artı paketlenmiş/harici Plugin kanallarının durumu, QR oturum açma ve kanal başına config (`channels.status`, `web.login.*`, `config.patch`).
    - Örnekler: varlık listesi + yenileme (`system-presence`).
    - Oturumlar: liste + oturum başına model/düşünme/hızlı/ayrıntılı/izleme/akıl yürütme geçersiz kılmaları (`sessions.list`, `sessions.patch`).
    - Rüyalar: dreaming durumu, etkinleştir/devre dışı bırak anahtarı ve Rüya Günlüğü okuyucusu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec onayları">
    - Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalıştırma geçmişi (`cron.*`).
    - Skills: durum, etkinleştir/devre dışı bırak, yükle, API anahtarı güncellemeleri (`skills.*`).
    - Node'lar: liste + yetenekler (`node.list`).
    - Exec onayları: gateway veya Node izin listelerini + `exec host=gateway/node` için sorma ilkesini düzenleyin (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - `~/.openclaw/openclaw.json` görüntüle/düzenle (`config.get`, `config.set`).
    - Doğrulamayla uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazmalar, eşzamanlı düzenlemelerin üzerine yazmayı önlemek için temel karma koruması içerir.
    - Yazmalar (`config.set`/`config.apply`/`config.patch`), gönderilen config yükündeki başvurular için etkin SecretRef çözümlemesini önceden kontrol eder; çözümlenemeyen etkin gönderilmiş başvurular yazmadan önce reddedilir.
    - Şema + form oluşturma (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, doğrudan alt özetleri, iç içe nesne/joker/array/bileşim düğümlerinde docs meta verileri, ayrıca varsa Plugin + kanal şemaları dahil); Ham JSON düzenleyicisi yalnızca anlık görüntünün güvenli bir ham gidiş dönüşü olduğunda kullanılabilir.
    - Bir anlık görüntü ham metni güvenli şekilde gidiş dönüş yapamıyorsa, Control UI Form modunu zorunlu kılar ve o anlık görüntü için Ham modu devre dışı bırakır.
    - Ham JSON düzenleyicisi "Kaydedilene sıfırla", düzleştirilmiş bir anlık görüntüyü yeniden oluşturmak yerine ham yazılmış şekli (biçimlendirme, yorumlar, `$include` düzeni) korur; böylece anlık görüntü güvenli şekilde gidiş dönüş yapabildiğinde harici düzenlemeler sıfırlamadan sonra korunur.
    - Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizeye bozulmayı önlemek için form metin girişlerinde salt okunur olarak oluşturulur.

  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/modeller anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Olay günlüğü, Control UI yenileme/RPC sürelerinin yanı sıra tarayıcı bu PerformanceObserver giriş türlerini sunduğunda uzun animasyon kareleri veya uzun görevler için tarayıcı yanıt verebilirlik girişlerini içerir.
    - Günlükler: filtre/dışa aktarma ile gateway dosya günlüklerinin canlı kuyruğu (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla paket/git güncellemesi + yeniden başlatma çalıştırın (`update.run`), ardından çalışan gateway sürümünü doğrulamak için yeniden bağlandıktan sonra `update.status` yoklayın.

  </Accordion>
  <Accordion title="Cron işleri panel notları">
    - Yalıtılmış işler için teslimat varsayılan olarak özet duyurmaya ayarlanır. Yalnızca dahili çalıştırmalar istiyorsanız bunu yok olarak değiştirebilirsiniz.
    - Duyuru seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) webhook URL'sine ayarlanmış şekilde `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için webhook ve yok teslimat modları kullanılabilir.
    - Gelişmiş düzenleme denetimleri; çalıştırmadan sonra sil, ajan geçersiz kılmasını temizle, cron kesin/kademeli seçenekleri, ajan model/düşünme geçersiz kılmaları ve en iyi çaba teslimat anahtarlarını içerir.
    - Form doğrulaması alan düzeyindeki hatalarla satır içidir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Ayrılmış bir bearer token göndermek için `cron.webhookToken` ayarlayın; atlanırsa webhook bir kimlik doğrulama üst bilgisi olmadan gönderilir.
    - Kullanımdan kaldırılmış geri dönüş: `notify: true` içeren saklanmış eski işler, taşınana kadar hâlâ `cron.webhook` kullanabilir.

  </Accordion>
</AccordionGroup>

## Sohbet davranışı

<AccordionGroup>
  <Accordion title="Gönderme ve geçmiş semantiği">
    - `chat.send` **engellemesizdir**: hemen `{ runId, status: "started" }` ile onay verir ve yanıt `chat` olayları üzerinden akar.
    - Sohbet yüklemeleri görselleri ve video olmayan dosyaları kabul eder. Görseller yerel görsel yolunu korur; diğer dosyalar yönetilen medya olarak saklanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden göndermek, çalışırken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları UI güvenliği için boyutla sınırlıdır. Konuşma dökümü girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır metadata bloklarını atlayabilir ve aşırı büyük iletileri bir yer tutucuyla değiştirebilir (`[chat.history omitted: message too large]`).
    - Asistan/oluşturulan görseller yönetilen medya referansları olarak kalıcı hale getirilir ve kimliği doğrulanmış Gateway medya URL'leri üzerinden geri sunulur; böylece yeniden yüklemeler, ham base64 görsel yüklerinin sohbet geçmişi yanıtında kalmasına bağlı olmaz.
    - `chat.history` ayrıca görünür asistan metninden yalnızca görüntüleme amaçlı satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin tool-call XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış tool-call blokları dahil), sızmış ASCII/tam genişlikli model denetim tokenlarını kaldırır ve tüm görünür metni yalnızca tam sessiz token `NO_REPLY` / `no_reply` olan asistan girdilerini atlar.
    - Etkin bir gönderim sırasında ve son geçmiş yenilemesinde, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürürse sohbet görünümü yerel iyimser kullanıcı/asistan iletilerini görünür tutar; Gateway geçmişi yetiştiğinde kanonik konuşma dökümü bu yerel iletilerin yerini alır.
    - Canlı `chat` olayları teslim durumudur; `chat.history` ise kalıcı oturum konuşma dökümünden yeniden oluşturulur. Tool-final olaylarından sonra Control UI geçmişi yeniden yükler ve yalnızca küçük bir iyimser kuyruğu birleştirir; konuşma dökümü sınırı [WebChat](/tr/web/webchat) içinde belgelenmiştir.
    - `chat.inject`, oturum konuşma dökümüne bir asistan notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (agent çalıştırması yok, kanal teslimi yok).
    - Sohbet başlığı modeli ve düşünme seçicileri, etkin oturumu `sessions.patch` üzerinden hemen yamalar; bunlar kalıcı oturum geçersiz kılmalarıdır, tek turluk gönderim seçenekleri değildir.
    - Control UI içinde `/new` yazmak, New Chat ile aynı yeni dashboard oturumunu oluşturur ve ona geçer. `/reset` yazmak, geçerli oturum için Gateway'in açık yerinde sıfırlamasını korur.
    - Sohbet model seçicisi Gateway'in yapılandırılmış model görünümünü ister. `agents.defaults.models` varsa, seçiciyi bu izin listesi yönlendirir. Aksi halde seçici, açık `models.providers.*.models` girdilerini ve kullanılabilir kimlik doğrulamasına sahip providerları gösterir. Tam katalog, hata ayıklama `models.list` RPC'si üzerinden `view: "all"` ile erişilebilir kalır.
    - Yeni Gateway oturum kullanım raporları yüksek context baskısı gösterdiğinde, sohbet oluşturucu alanı bir context bildirimi gösterir ve önerilen compaction düzeylerinde normal oturum compaction yolunu çalıştıran bir compact düğmesi gösterir. Eski token anlık görüntüleri, Gateway tekrar yeni kullanım raporu verene kadar gizlenir.

  </Accordion>
  <Accordion title="Konuşma modu (tarayıcı gerçek zamanlı)">
    Konuşma modu kayıtlı bir gerçek zamanlı ses providerı kullanır. OpenAI'ı `talk.provider: "openai"` ve `talk.providers.openai.apiKey` ile yapılandırın veya Google'ı `talk.provider: "google"` ve `talk.providers.google.apiKey` ile yapılandırın; Voice Call gerçek zamanlı provider yapılandırması hâlâ yedek olarak yeniden kullanılabilir. Tarayıcı hiçbir zaman standart bir provider API anahtarı almaz. OpenAI, WebRTC için geçici bir Realtime istemci sırrı alır. Google Live, tarayıcı WebSocket oturumu için tek kullanımlık, kısıtlı bir Live API auth tokenı alır; talimatlar ve tool bildirimleri Gateway tarafından tokena kilitlenir. Yalnızca backend gerçek zamanlı köprüsü sunan providerlar Gateway relay transport üzerinden çalışır; böylece kimlik bilgileri ve vendor soketleri server tarafında kalırken tarayıcı sesi kimliği doğrulanmış Gateway RPC'leri üzerinden taşınır. Realtime oturum promptu Gateway tarafından birleştirilir; `talk.realtime.session` çağıranın sağladığı talimat geçersiz kılmalarını kabul etmez.

    Chat composer içinde Talk denetimi, mikrofon dikte düğmesinin yanındaki dalga düğmesidir. Talk başladığında composer durum satırı `Connecting Talk...`, ses bağlandığında `Talk live` veya gerçek zamanlı bir tool çağrısı `chat.send` üzerinden yapılandırılmış daha büyük modele danışırken `Asking OpenClaw...` gösterir.

    Bakımcı canlı smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`, OpenAI tarayıcı WebRTC SDP alışverişini, Google Live kısıtlı token tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway relay tarayıcı bağdaştırıcısını doğrular. Komut yalnızca provider durumunu yazdırır ve sırları günlüğe kaydetmez.

  </Accordion>
  <Accordion title="Durdurma ve iptal">
    - **Stop** öğesine tıklayın (`chat.abort` çağırır).
    - Bir çalıştırma etkinken normal takip iletileri kuyruğa alınır. Kuyruktaki bir iletide **Steer** öğesine tıklayarak bu takip iletisini çalışan tura enjekte edin.
    - Bant dışı iptal için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi bağımsız iptal ifadeleri).
    - `chat.abort`, o oturumun tüm etkin çalıştırmalarını iptal etmek için `{ sessionKey }` destekler (`runId` olmadan).

  </Accordion>
  <Accordion title="İptal edilen kısmı saklama">
    - Bir çalıştırma iptal edildiğinde, kısmi asistan metni UI'da hâlâ gösterilebilir.
    - Gateway, arabelleğe alınmış çıktı varsa iptal edilmiş kısmi asistan metnini konuşma dökümü geçmişine kalıcı olarak yazar.
    - Kalıcı girdiler iptal metadata'sı içerir; böylece konuşma dökümü tüketicileri iptal edilmiş kısımları normal tamamlama çıktısından ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve web push

Control UI, bir `manifest.webmanifest` ve bir service worker ile gelir; bu nedenle modern tarayıcılar onu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık değilken bile Gateway'in kurulu PWA'yı bildirimlerle uyandırmasını sağlar.

| Yüzey                                                 | Ne yapar                                                          |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | PWA manifesti. Erişilebilir olduğunda tarayıcılar "Uygulamayı kur" seçeneğini sunar. |
| `ui/public/sw.js`                                     | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw durum dizini altında) | Web Push yüklerini imzalamak için kullanılan otomatik oluşturulmuş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                    | Kalıcı tarayıcı abonelik endpointleri.                            |

Anahtarları sabitlemek istediğinizde (çok hostlu dağıtımlar, secret rotation veya testler için) Gateway işlemi üzerindeki ortam değişkenleriyle VAPID anahtar çiftini geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılan: `mailto:openclaw@localhost`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için şu scope ile sınırlandırılmış Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID public key'i getirir.
- `push.web.subscribe` — `keys.p256dh`/`keys.auth` ile birlikte bir `endpoint` kaydeder.
- `push.web.unsubscribe` — kayıtlı bir endpointi kaldırır.
- `push.web.test` — çağıranın aboneliğine bir test bildirimi gönderir.

<Note>
Web Push, iOS APNS relay yolundan (relay destekli push için bkz. [Yapılandırma](/tr/gateway/configuration)) ve native mobil eşleştirmeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Hosted embedler

Asistan iletileri, `[embed ...]` shortcode ile hosted web içeriğini satır içinde render edebilir. iframe sandbox politikası `gateway.controlUi.embedSandbox` tarafından denetlenir:

<Tabs>
  <Tab title="strict">
    Hosted embedler içinde script yürütmeyi devre dışı bırakır.
  </Tab>
  <Tab title="scripts (varsayılan)">
    Origin izolasyonunu korurken etkileşimli embedlere izin verir; bu varsayılandır ve genellikle kendi kendine yeterli tarayıcı oyunları/widgetları için yeterlidir.
  </Tab>
  <Tab title="trusted">
    Bilinçli olarak daha güçlü ayrıcalıklara ihtiyaç duyan aynı site belgeleri için `allow-scripts` üzerine `allow-same-origin` ekler.
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
`trusted` yalnızca gömülü belge gerçekten same-origin davranışına ihtiyaç duyduğunda kullanın. Çoğu agent tarafından oluşturulan oyun ve etkileşimli canvas için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` embed URL'leri varsayılan olarak engelli kalır. Bilinçli olarak `[embed url="https://..."]` öğesinin üçüncü taraf sayfaları yüklemesini istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Sohbet iletisi genişliği

Gruplandırılmış sohbet iletileri okunabilir bir varsayılan maksimum genişlik kullanır. Geniş monitör dağıtımları, bundled CSS'i yamalamadan `gateway.controlUi.chatMessageMaxWidth` ayarlayarak bunu geçersiz kılabilir:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Değer tarayıcıya ulaşmadan önce doğrulanır. Desteklenen değerler arasında `960px` veya `82%` gibi düz uzunluklar ve yüzdeler ile sınırlandırılmış `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` ve `fit-content(...)` genişlik ifadeleri bulunur.

## Tailnet erişimi (önerilir)

<Tabs>
  <Tab title="Entegre Tailscale Serve (tercih edilir)">
    Gateway'i loopback üzerinde tutun ve Tailscale Serve'ün onu HTTPS ile proxy'lemesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Varsayılan olarak, `gateway.auth.allowTailscale` `true` olduğunda Control UI/WebSocket Serve istekleri Tailscale kimlik başlıkları (`tailscale-user-login`) üzerinden kimlik doğrulayabilir. OpenClaw, `x-forwarded-for` adresini `tailscale whois` ile çözümleyip başlıkla eşleştirerek kimliği doğrular ve bunları yalnızca istek Tailscale'in `x-forwarded-*` başlıklarıyla loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliği olan Control UI operatör oturumları için bu doğrulanmış Serve yolu cihaz eşleştirme gidiş dönüşünü de atlar; cihazsız tarayıcılar ve node-role bağlantıları normal cihaz kontrollerini izlemeye devam eder. Serve trafiği için bile açık shared-secret kimlik bilgileri zorunlu olsun istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu async Serve kimlik yolu için, aynı istemci IP'si ve auth scope'a ait başarısız auth denemeleri rate-limit yazımlarından önce seri hale getirilir. Bu nedenle aynı tarayıcıdan eşzamanlı hatalı yeniden denemeler, paralel yarışan iki düz uyuşmazlık yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Tokensız Serve auth, gateway hostunun güvenilir olduğunu varsayar. Bu host üzerinde güvenilmeyen yerel kod çalışabiliyorsa token/password auth zorunlu kılın.
    </Warning>

  </Tab>
  <Tab title="Tailnet'e bağla + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ardından açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Eşleşen shared secret'ı UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvenli olmayan HTTP

Dashboard'u düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`), tarayıcı **güvenli olmayan bir context** içinde çalışır ve WebCrypto'yu engeller. Varsayılan olarak OpenClaw, cihaz kimliği olmayan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost güvenli olmayan HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Control UI auth
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI'ı yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (Gateway ana makinesinde)

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

    - localhost Control UI oturumlarının güvenli olmayan HTTP bağlamlarında cihaz kimliği olmadan ilerlemesine izin verir.
    - Eşleştirme denetimlerini atlatmaz.
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
    `dangerouslyDisableDeviceAuth`, Control UI cihaz kimliği denetimlerini devre dışı bırakır ve ciddi bir güvenlik düşürmesidir. Acil kullanım sonrasında hızla geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Başarılı trusted-proxy kimlik doğrulaması, cihaz kimliği olmadan **operatör** Control UI oturumlarını kabul edebilir.
    - Bu, node rolündeki Control UI oturumlarına genişlemez.
    - Aynı ana makinedeki loopback ters proxy'leri yine de trusted-proxy kimlik doğrulamasını karşılamaz; bkz. [Güvenilen proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberi için bkz. [Tailscale](/tr/gateway/tailscale).

## İçerik güvenliği ilkesi

Control UI sıkı bir `img-src` ilkesiyle gelir: yalnızca **same-origin** varlıklarına, `data:` URL'lerine ve yerel olarak oluşturulan `blob:` URL'lerine izin verilir. Uzak `http(s)` ve protokol göreli görsel URL'leri tarayıcı tarafından reddedilir ve ağ fetch işlemleri başlatmaz.

Pratikte bunun anlamı:

- Göreli yollar altında sunulan avatarlar ve görseller (örneğin `/avatars/<id>`), UI'ın fetch edip yerel `blob:` URL'lerine dönüştürdüğü kimliği doğrulanmış avatar rotaları dahil olmak üzere render edilmeye devam eder.
- Satır içi `data:image/...` URL'leri render edilmeye devam eder (protokol içi payload'lar için kullanışlıdır).
- Control UI tarafından oluşturulan yerel `blob:` URL'leri render edilmeye devam eder.
- Kanal metadata'sı tarafından yayılan uzak avatar URL'leri, Control UI'ın avatar yardımcıları tarafından çıkarılır ve yerleşik logo/badge ile değiştirilir; böylece ele geçirilmiş veya kötü amaçlı bir kanal, operatör tarayıcısından keyfi uzak görsel fetch işlemlerini zorlayamaz.

Bu davranışı elde etmek için hiçbir şeyi değiştirmeniz gerekmez; her zaman açıktır ve yapılandırılamaz.

## Avatar rotası kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, Control UI avatar endpoint'i API'nin geri kalanıyla aynı Gateway token'ını gerektirir:

- `GET /avatar/<agentId>` avatar görselini yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1` aynı kural altında avatar metadata'sını döndürür.
- Her iki rotaya yönelik kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla uyumlu olarak). Bu, avatar rotasının aksi halde korunan ana makinelerde ajan kimliğini sızdırmasını önler.
- Control UI, avatarları fetch ederken Gateway token'ını bearer header olarak iletir ve görselin panolarda render edilmeye devam etmesi için kimliği doğrulanmış blob URL'leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan ana makinelerde önerilmez), avatar rotası da Gateway'in geri kalanıyla uyumlu olarak kimliği doğrulanmamış hale gelir.

## Asistan medya rotası kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, asistan yerel-medya önizlemeleri iki adımlı bir rota kullanır:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` normal Control UI operatör kimlik doğrulamasını gerektirir. Tarayıcı, kullanılabilirliği denetlerken Gateway token'ını bearer header olarak gönderir.
- Başarılı metadata yanıtları, tam olarak o kaynak yoluyla kapsamlandırılmış kısa ömürlü bir `mediaTicket` içerir.
- Tarayıcıda render edilen görsel, ses, video ve belge URL'leri etkin Gateway token'ı veya parola yerine `mediaTicket=<ticket>` kullanır. Bilet hızla sona erer ve farklı bir kaynağı yetkilendiremez.

Bu, yeniden kullanılabilir Gateway kimlik bilgilerini görünür medya URL'lerine koymadan normal medya render işlemini tarayıcıya yerleşik medya öğeleriyle uyumlu tutar.

## UI'ı oluşturma

Gateway statik dosyaları `dist/control-ui` konumundan sunar. Bunları şu komutla oluşturun:

```bash
pnpm ui:build
```

İsteğe bağlı mutlak taban (sabit varlık URL'leri istediğinizde):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Yerel geliştirme için (ayrı dev server):

```bash
pnpm ui:dev
```

Ardından UI'ı Gateway WS URL'nize yönlendirin (örn. `ws://127.0.0.1:18789`).

## Hata ayıklama/test etme: dev server + uzak Gateway

Control UI statik dosyalardan oluşur; WebSocket hedefi yapılandırılabilir ve HTTP origin'inden farklı olabilir. Bu, Vite dev server'ı yerelde istediğiniz, ancak Gateway'in başka bir yerde çalıştığı durumlarda kullanışlıdır.

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
    - `gatewayUrl` yüklemeden sonra localStorage'da saklanır ve URL'den kaldırılır.
    - `gatewayUrl` üzerinden tam bir `ws://` veya `wss://` endpoint'i geçirirseniz, tarayıcının query string'i doğru ayrıştırması için `gatewayUrl` değerini URL-encode edin.
    - `token` mümkün olduğunda URL fragment'ı (`#token=...`) üzerinden geçirilmelidir. Fragment'lar sunucuya gönderilmez; bu, istek günlüğü ve Referer sızıntısını önler. Eski `?token=` query parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca fallback olarak kullanılır ve bootstrap sonrasında hemen çıkarılır.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında UI, yapılandırmaya veya ortam kimlik bilgilerine geri dönmez. `token` (veya `password`) değerini açıkça sağlayın. Açık kimlik bilgilerinin eksik olması hatadır.
    - Gateway TLS arkasındaysa (Tailscale Serve, HTTPS proxy vb.) `wss://` kullanın.
    - `gatewayUrl`, clickjacking'i önlemek için yalnızca üst düzey bir pencerede (gömülü değil) kabul edilir.
    - loopback olmayan Control UI dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça ayarlamalıdır (tam origin'ler). Buna uzak dev kurulumları da dahildir.
    - Gateway başlangıcı, etkin runtime bind ve port'tan `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel origin'leri seed edebilir, ancak uzak tarayıcı origin'leri yine de açık girdilere ihtiyaç duyar.
    - Sıkı denetlenen yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, herhangi bir tarayıcı origin'ine izin ver anlamına gelir; "kullandığım ana makine neyse onunla eşleş" anlamına gelmez.
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

- [Dashboard](/tr/web/dashboard) — Gateway panosu
- [Health Checks](/tr/gateway/health) — Gateway sağlık izleme
- [TUI](/tr/web/tui) — terminal kullanıcı arayüzü
- [WebChat](/tr/web/webchat) — tarayıcı tabanlı sohbet arayüzü
