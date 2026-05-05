---
read_when:
    - Gateway'i bir tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı kontrol kullanıcı arayüzü (sohbet, düğümler, yapılandırma)
title: Kontrol kullanıcı arayüzü
x-i18n:
    generated_at: "2026-05-05T06:20:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d249559d26ef8d257a14b104a797442e9fbb67a8ab31c7fcc9eaa4127f29c933
    source_path: web/control-ui.md
    workflow: 16
---

Control UI, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfalık uygulamadır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarını yapın (örn. `/openclaw`)

Aynı bağlantı noktasında **doğrudan Gateway WebSocket** ile konuşur.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenemezse önce Gateway'i başlatın: `openclaw gateway`.

Kimlik doğrulama, WebSocket el sıkışması sırasında şunlarla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik başlıkları
- `gateway.auth.mode: "trusted-proxy"` olduğunda trusted-proxy kimlik başlıkları

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için bir token tutar; parolalar kalıcı olarak saklanmaz. Onboarding genellikle ilk bağlantıda shared-secret kimlik doğrulaması için bir gateway token oluşturur, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Control UI'ye yeni bir tarayıcıdan veya cihazdan bağlandığınızda, Gateway genellikle **tek seferlik eşleştirme onayı** ister. Bu, yetkisiz erişimi önlemek için bir güvenlik önlemidir.

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

Tarayıcı, değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve onu okuma erişiminden yazma/admin erişimine değiştirirseniz bu, sessiz bir yeniden bağlantı değil, onay yükseltmesi olarak ele alınır. OpenClaw eski onayı etkin tutar, daha geniş kapsamlı yeniden bağlantıyı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik onaylanır.
- Tailscale Serve, `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı cihaz kimliğini sunduğunda Control UI operatör oturumları için eşleştirme gidiş dönüşünü atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği oluşturur, bu yüzden tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

</Note>

## Kişisel kimlik (tarayıcı-yerel)

Control UI, paylaşılan oturumlarda ilişkilendirme için giden iletilere eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Bu kimlik tarayıcı depolamasında bulunur, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz iletilerdeki normal transcript yazarlık meta verileri dışında diğer cihazlara eşitlenmez veya sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya tarayıcı değiştirmek bunu boş hale sıfırlar.

Aynı tarayıcı-yerel desen, asistan avatarı geçersiz kılması için de geçerlidir. Yüklenen asistan avatarları, gateway tarafından çözümlenen kimliğin üzerine yalnızca yerel tarayıcıda bindirilir ve `config.patch` üzerinden hiçbir zaman gidiş dönüş yapmaz. Paylaşılan `ui.assistant.avatar` yapılandırma alanı, alanı doğrudan yazan UI dışı istemciler (betikli gateway'ler veya özel panolar gibi) için hâlâ kullanılabilir.

## Çalışma zamanı yapılandırma uç noktası

Control UI, çalışma zamanı ayarlarını `/__openclaw/control-ui-config.json` üzerinden alır. Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar bunu alamaz ve başarılı bir getirme işlemi için zaten geçerli bir gateway token/parolası, Tailscale Serve kimliği veya trusted-proxy kimliği gerekir.

## Dil desteği

Control UI, ilk yüklemede tarayıcı yerelinize göre kendini yerelleştirebilir. Daha sonra geçersiz kılmak için **Genel Bakış -> Gateway Erişimi -> Dil** bölümünü açın. Yerel seçici Görünüm altında değil, Gateway Erişimi kartında bulunur.

- Desteklenen yereller: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışı çeviriler tarayıcıda lazy-loaded olarak yüklenir.
- Seçilen yerel tarayıcı depolamasına kaydedilir ve gelecekteki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Doküman çevirileri aynı İngilizce dışı yerel kümesi için oluşturulur, ancak doküman sitesinin yerleşik Mintlify dil seçicisi, Mintlify'nin kabul ettiği yerel kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) dokümanlar yayın reposunda hâlâ oluşturulur; Mintlify bu kodları destekleyene kadar o seçicide görünmeyebilirler.

## Görünüm temaları

Görünüm paneli yerleşik Claw, Knot ve Dash temalarını, ayrıca tarayıcı-yerel bir tweakcn içe aktarma yuvasını tutar. Bir temayı içe aktarmak için [tweakcn düzenleyicisini](https://tweakcn.com/editor/theme) açın, bir tema seçin veya oluşturun, **Paylaş**'a tıklayın ve kopyalanan tema bağlantısını Görünüm'e yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` registry URL'lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi düzenleyici URL'lerini, göreli `/themes/<id>` yollarını, ham tema kimliklerini ve `amethyst-haze` gibi varsayılan tema adlarını kabul eder.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde saklanır. Gateway yapılandırmasına yazılmazlar ve cihazlar arasında eşitlenmezler. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; temizlemek, içe aktarılan tema seçiliyse etkin temayı Claw'a geri döndürür.

## Neler yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden kısıtlı tek kullanımlık bir tarayıcı token'ı kullanır ve yalnızca backend gerçek zamanlı ses plugin'leri Gateway relay taşımasını kullanır. Relay, sağlayıcı kimlik bilgilerini Gateway'de tutarken tarayıcı mikrofon PCM'ini `talk.realtime.relay*` RPC'leri üzerinden stream eder ve daha büyük yapılandırılmış OpenClaw modeli için `openclaw_agent_consult` tool call'larını `chat.send` üzerinden geri gönderir.
    - Sohbet içinde tool call'larını + canlı araç çıktı kartlarını stream edin (ajan olayları).

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, rüyalar">
    - Kanallar: yerleşik artı paketli/harici Plugin kanalları durumu, QR oturum açma ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`).
    - Örnekler: presence listesi + yenileme (`system-presence`).
    - Oturumlar: liste + oturum başına model/thinking/fast/verbose/trace/reasoning geçersiz kılmaları (`sessions.list`, `sessions.patch`).
    - Rüyalar: Dreaming durumu, etkinleştir/devre dışı bırak anahtarı ve Dream Diary okuyucusu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Node'lar, exec onayları">
    - Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalışma geçmişi (`cron.*`).
    - Skills: durum, etkinleştir/devre dışı bırak, kur, API anahtarı güncellemeleri (`skills.*`).
    - Node'lar: liste + yetenekler (`node.list`).
    - Exec onayları: gateway veya Node izin listelerini + `exec host=gateway/node` için ask ilkesini düzenleyin (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Yapılandırma">
    - `~/.openclaw/openclaw.json` görüntüle/düzenle (`config.get`, `config.set`).
    - Doğrulamayla uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazmalar, eşzamanlı düzenlemeleri ezmeyi önlemek için base-hash koruması içerir.
    - Yazmalar (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma payload'ındaki refs için etkin SecretRef çözümlemesini önceden denetler; çözümlenemeyen etkin gönderilmiş refs yazmadan önce reddedilir.
    - Şema + form işleme (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, doğrudan alt özetler, iç içe nesne/joker karakter/dizi/bileşim düğümlerinde doküman meta verileri ve mevcut olduğunda Plugin + kanal şemaları dahil); Ham JSON düzenleyicisi yalnızca snapshot güvenli bir ham gidiş dönüşe sahipse kullanılabilir.
    - Bir snapshot ham metinle güvenli şekilde gidiş dönüş yapamıyorsa Control UI, Form modunu zorlar ve o snapshot için Ham modu devre dışı bırakır.
    - Ham JSON düzenleyicisindeki "Kaydedilene sıfırla", düzleştirilmiş bir snapshot'ı yeniden render etmek yerine ham olarak yazılmış şekli (biçimlendirme, yorumlar, `$include` düzeni) korur; böylece snapshot güvenli şekilde gidiş dönüş yapabildiğinde harici düzenlemeler sıfırlamadan sonra korunur.
    - Yapılandırılmış SecretRef nesne değerleri, kazara nesneden dizgeye bozulmayı önlemek için form metin girişlerinde salt okunur olarak render edilir.

  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/modeller snapshot'ları + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Olay günlüğü, Control UI yenileme/RPC zamanlamalarını ve tarayıcı bu PerformanceObserver giriş türlerini sunduğunda uzun animasyon kareleri veya uzun görevler için tarayıcı yanıt verebilirliği girişlerini içerir.
    - Günlükler: filtre/dışa aktarma ile gateway dosya günlüklerinin canlı tail'i (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla bir paket/git güncellemesi + yeniden başlatma çalıştırın (`update.run`), ardından çalışan gateway sürümünü doğrulamak için yeniden bağlandıktan sonra `update.status` sorgulayın.

  </Accordion>
  <Accordion title="Cron işleri panel notları">
    - İzole işler için teslim varsayılanı özet duyurusudur. Yalnızca dahili çalışmalar istiyorsanız none seçeneğine geçebilirsiniz.
    - Duyuru seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) webhook URL'sine ayarlanmış şekilde `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için webhook ve none teslim modları kullanılabilir.
    - Gelişmiş düzenleme denetimleri, çalıştırmadan sonra silme, ajan geçersiz kılmasını temizleme, cron exact/stagger seçenekleri, ajan model/thinking geçersiz kılmaları ve best-effort teslim anahtarlarını içerir.
    - Form doğrulaması alan düzeyi hatalarla satır içidir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Ayrılmış bearer token göndermek için `cron.webhookToken` ayarını yapın; atlanırsa webhook auth başlığı olmadan gönderilir.
    - Kullanımdan kaldırılmış fallback: `notify: true` içeren saklanan eski işler, taşınana kadar `cron.webhook` kullanmaya devam edebilir.

  </Accordion>
</AccordionGroup>

## Sohbet davranışı

<AccordionGroup>
  <Accordion title="Gönderme ve geçmiş semantiği">
    - `chat.send` **engellemesizdir**: hemen `{ runId, status: "started" }` ile onay verir ve yanıt `chat` olayları üzerinden akışla gelir.
    - Sohbet yüklemeleri görüntüleri ve video olmayan dosyaları kabul eder. Görüntüler yerel görüntü yolunu korur; diğer dosyalar yönetilen medya olarak saklanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden göndermek, çalışma sürerken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları UI güvenliği için boyut sınırlıdır. Transkript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır metadata bloklarını atlayabilir ve aşırı büyük iletileri bir yer tutucuyla değiştirebilir (`[chat.history omitted: message too large]`).
    - Yardımcı/üretilmiş görüntüler yönetilen medya referansları olarak kalıcılaştırılır ve kimliği doğrulanmış Gateway medya URL'leri üzerinden geri sunulur; bu nedenle yeniden yüklemeler, ham base64 görüntü yüklerinin sohbet geçmişi yanıtında kalmasına bağlı değildir.
    - `chat.history` işlenirken Control UI, görünen yardımcı metninden yalnızca gösterim amaçlı satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil), sızmış ASCII/tam genişlikli model kontrol belirteçlerini kaldırır ve görünen metninin tamamı yalnızca tam sessiz belirteç `NO_REPLY` / `no_reply` veya Heartbeat onay belirteci `HEARTBEAT_OK` olan yardımcı girdilerini atlar.
    - Etkin bir gönderim sırasında ve son geçmiş yenilemesinde, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürürse sohbet görünümü yerel iyimser kullanıcı/yardımcı iletilerini görünür tutar; Gateway geçmişi yetiştiğinde kanonik transkript bu yerel iletilerin yerini alır.
    - Canlı `chat` olayları teslim durumudur; `chat.history` ise kalıcı oturum transkriptinden yeniden oluşturulur. Araç-final olaylarından sonra Control UI geçmişi yeniden yükler ve yalnızca küçük bir iyimser kuyruğu birleştirir; transkript sınırı [WebChat](/tr/web/webchat) içinde belgelenmiştir.
    - `chat.inject`, oturum transkriptine bir yardımcı notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (agent çalıştırması yok, kanal teslimi yok).
    - Sohbet başlığı, oturum seçiciden önce agent filtresini gösterir ve oturum seçici seçilen agent kapsamındadır. Agent değiştirildiğinde yalnızca o agent'a bağlı oturumlar gösterilir ve henüz kaydedilmiş pano oturumu yoksa o agent'ın ana oturumuna geri dönülür.
    - Masaüstü genişliklerinde sohbet denetimleri tek bir kompakt satırda kalır ve transkriptte aşağı kaydırılırken daralır; yukarı kaydırmak, en üste dönmek veya en alta ulaşmak denetimleri geri getirir.
    - Ardışık yinelenen yalnızca metin iletiler, sayı rozetiyle tek bir balon olarak işlenir. Görüntü, ek, araç çıktısı veya canvas önizlemesi taşıyan iletiler daraltılmaz.
    - Sohbet başlığı model ve düşünme seçicileri, etkin oturumu `sessions.patch` üzerinden hemen yamalar; bunlar kalıcı oturum geçersiz kılmalarıdır, yalnızca tek turluk gönderim seçenekleri değildir.
    - Control UI içinde `/new` yazmak, New Chat ile aynı yeni pano oturumunu oluşturur ve ona geçer. `/reset` yazmak, geçerli oturum için Gateway'in açık yerinde sıfırlamasını korur.
    - Sohbet model seçici, Gateway'in yapılandırılmış model görünümünü ister. `agents.defaults.models` varsa seçiciyi bu izin verilenler listesi yönlendirir. Aksi halde seçici, açık `models.providers.*.models` girdilerini ve kullanılabilir kimlik doğrulaması olan sağlayıcıları gösterir. Tam katalog, hata ayıklama `models.list` RPC'si üzerinden `view: "all"` ile kullanılabilir kalır.
    - Yeni Gateway oturum kullanım raporları yüksek bağlam baskısı gösterdiğinde, sohbet oluşturucu alanı bir bağlam bildirimi ve önerilen Compaction seviyelerinde normal oturum Compaction yolunu çalıştıran kompakt bir düğme gösterir. Eski token anlık görüntüleri, Gateway yeniden güncel kullanım bildirene kadar gizlenir.

  </Accordion>
  <Accordion title="Konuşma modu (tarayıcı gerçek zamanlı)">
    Konuşma modu kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. OpenAI'yi `talk.provider: "openai"` ve `talk.providers.openai.apiKey` ile yapılandırın veya Google'ı `talk.provider: "google"` ve `talk.providers.google.apiKey` ile yapılandırın; Voice Call gerçek zamanlı sağlayıcı yapılandırması yine yedek olarak yeniden kullanılabilir. Tarayıcı hiçbir zaman standart bir sağlayıcı API anahtarı almaz. OpenAI, WebRTC için geçici bir Realtime istemci sırrı alır. Google Live, tarayıcı WebSocket oturumu için tek kullanımlık, kısıtlanmış bir Live API kimlik doğrulama token'ı alır; talimatlar ve araç bildirimleri Gateway tarafından token'a kilitlenir. Yalnızca backend gerçek zamanlı köprüsü sunan sağlayıcılar Gateway aktarım taşıması üzerinden çalışır; böylece kimlik bilgileri ve tedarikçi soketleri sunucu tarafında kalırken tarayıcı sesi kimliği doğrulanmış Gateway RPC'leri üzerinden hareket eder. Realtime oturum istemi Gateway tarafından birleştirilir; `talk.realtime.session` çağıran tarafından sağlanan talimat geçersiz kılmalarını kabul etmez.

    Chat oluşturucuda Talk denetimi, mikrofon dikte düğmesinin yanındaki dalga düğmesidir. Talk başladığında oluşturucu durum satırı `Connecting Talk...`, ardından ses bağlıyken `Talk live` veya gerçek zamanlı bir araç çağrısı `chat.send` üzerinden yapılandırılmış daha büyük modele danışırken `Asking OpenClaw...` gösterir.

    Maintainer canlı smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`, OpenAI tarayıcı WebRTC SDP alışverişini, Google Live kısıtlanmış-token tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway aktarım tarayıcı adaptörünü doğrular. Komut yalnızca sağlayıcı durumunu yazdırır ve sırları günlüğe yazmaz.

  </Accordion>
  <Accordion title="Durdurma ve iptal">
    - **Durdur**'a tıklayın (`chat.abort` çağırır).
    - Bir çalışma etkinken normal takip iletileri kuyruğa alınır. Kuyruktaki bir iletide **Yönlendir**'e tıklayarak bu takip iletisini çalışan tura enjekte edin.
    - Bant dışı iptal etmek için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi tek başına iptal ifadeleri).
    - `chat.abort`, o oturumun tüm etkin çalışmalarını iptal etmek için `{ sessionKey }` destekler (`runId` olmadan).

  </Accordion>
  <Accordion title="İptal kısmi koruması">
    - Bir çalışma iptal edildiğinde, kısmi yardımcı metni UI'da yine de gösterilebilir.
    - Gateway, arabelleğe alınmış çıktı varsa iptal edilmiş kısmi yardımcı metnini transkript geçmişine kalıcılaştırır.
    - Kalıcılaştırılmış girdiler iptal metadata'sı içerir; böylece transkript tüketicileri iptal kısımlarını normal tamamlama çıktısından ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve Web Push

Control UI bir `manifest.webmanifest` ve bir service worker ile gelir; bu nedenle modern tarayıcılar onu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık olmadığında bile Gateway'in kurulu PWA'yı bildirimlerle uyandırmasını sağlar.

| Yüzey                                                 | Ne yapar                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest'i. Tarayıcılar erişilebilir olduğunda "Uygulamayı yükle" seçeneğini sunar. |
| `ui/public/sw.js`                                     | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw durum dizini altında) | Web Push yüklerini imzalamak için kullanılan otomatik oluşturulmuş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                    | Kalıcılaştırılmış tarayıcı abonelik uç noktaları.                  |

Anahtarları sabitlemek istediğinizde (çok makineli dağıtımlar, sır rotasyonu veya testler için) VAPID anahtar çiftini Gateway işlemi üzerindeki ortam değişkenleriyle geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılan `mailto:openclaw@localhost`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için bu kapsam geçitli Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID genel anahtarını getirir.
- `push.web.subscribe` — bir `endpoint` ile `keys.p256dh`/`keys.auth` kaydeder.
- `push.web.unsubscribe` — kayıtlı bir uç noktayı kaldırır.
- `push.web.test` — çağıranın aboneliğine test bildirimi gönderir.

<Note>
Web Push, iOS APNS aktarım yolundan (aktarım destekli push için bkz. [Yapılandırma](/tr/gateway/configuration)) ve yerel mobil eşlemeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Barındırılan yerleştirmeler

Yardımcı iletileri, `[embed ...]` kısa koduyla barındırılan web içeriğini satır içinde işleyebilir. iframe sandbox politikası `gateway.controlUi.embedSandbox` tarafından denetlenir:

<Tabs>
  <Tab title="strict">
    Barındırılan yerleştirmeler içinde betik yürütmeyi devre dışı bırakır.
  </Tab>
  <Tab title="scripts (varsayılan)">
    Kaynak izolasyonunu korurken etkileşimli yerleştirmelere izin verir; bu varsayılandır ve genellikle bağımsız tarayıcı oyunları/widget'ları için yeterlidir.
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
`trusted` değerini yalnızca gömülü belge gerçekten aynı kaynak davranışına ihtiyaç duyduğunda kullanın. Çoğu agent tarafından üretilen oyun ve etkileşimli canvas için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` yerleştirme URL'leri varsayılan olarak engellenmiş kalır. `[embed url="https://..."]` değerinin üçüncü taraf sayfaları yüklemesini özellikle istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Sohbet iletisi genişliği

Gruplanmış sohbet iletileri okunabilir bir varsayılan en büyük genişlik kullanır. Geniş monitörlü dağıtımlar, paketlenmiş CSS'i yamalamadan `gateway.controlUi.chatMessageMaxWidth` ayarlayarak bunu geçersiz kılabilir:

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
    Gateway'i loopback üzerinde tutun ve Tailscale Serve'ün onu HTTPS ile proxy'lemesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Varsayılan olarak Control UI/WebSocket Serve istekleri, `gateway.auth.allowTailscale` `true` olduğunda Tailscale kimlik başlıkları (`tailscale-user-login`) üzerinden kimlik doğrulaması yapabilir. OpenClaw, `x-forwarded-for` adresini `tailscale whois` ile çözümleyip başlıkla eşleştirerek kimliği doğrular ve bunları yalnızca istek Tailscale'in `x-forwarded-*` başlıklarıyla loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliği olan Control UI operatör oturumları için bu doğrulanmış Serve yolu cihaz eşleme gidiş dönüşünü de atlar; cihazsız tarayıcılar ve node rolü bağlantıları normal cihaz kontrollerini izlemeye devam eder. Serve trafiği için bile açık paylaşılan sır kimlik bilgilerini zorunlu kılmak istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu zaman uyumsuz Serve kimlik yolu için, aynı istemci IP'si ve kimlik doğrulama kapsamına ait başarısız kimlik doğrulama denemeleri rate-limit yazımlarından önce serileştirilir. Bu nedenle aynı tarayıcıdan eşzamanlı kötü yeniden denemeler, paralel yarışan iki düz uyuşmazlık yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Token'sız Serve kimlik doğrulaması, gateway makinesinin güvenilir olduğunu varsayar. Bu makinede güvenilmeyen yerel kod çalışabiliyorsa token/password kimlik doğrulaması gerektir.
    </Warning>

  </Tab>
  <Tab title="Tailnet'e bağla + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ardından açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Eşleşen paylaşılan gizli anahtarı UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvensiz HTTP

Panoyu düz HTTP üzerinden (`http://<lan-ip>` veya `http://<tailscale-ip>`) açarsanız, tarayıcı **güvenli olmayan bir bağlamda** çalışır ve WebCrypto'yu engeller. OpenClaw, varsayılan olarak cihaz kimliği olmayan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost için güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Control UI kimlik doğrulaması
- acil durum `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI'ı yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (Gateway ana makinesinde)

<AccordionGroup>
  <Accordion title="Güvensiz kimlik doğrulama geçiş düğmesi davranışı">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` yalnızca yerel bir uyumluluk geçiş düğmesidir:

    - localhost Control UI oturumlarının güvenli olmayan HTTP bağlamlarında cihaz kimliği olmadan devam etmesine izin verir.
    - Eşleştirme denetimlerini atlamaz.
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
    `dangerouslyDisableDeviceAuth`, Control UI cihaz kimliği denetimlerini devre dışı bırakır ve ciddi bir güvenlik düşürmesidir. Acil kullanım sonrası hızlıca geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Güvenilir proxy notu">
    - Başarılı trusted-proxy kimlik doğrulaması, cihaz kimliği olmadan **operatör** Control UI oturumlarını kabul edebilir.
    - Bu, node rolündeki Control UI oturumlarına genişlemez.
    - Aynı ana makinedeki loopback ters proxy'leri yine de trusted-proxy kimlik doğrulamasını karşılamaz; bkz. [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberi için [Tailscale](/tr/gateway/tailscale) sayfasına bakın.

## İçerik güvenliği ilkesi

Control UI, sıkı bir `img-src` ilkesiyle gelir: yalnızca **same-origin** varlıklara, `data:` URL'lerine ve yerel olarak oluşturulan `blob:` URL'lerine izin verilir. Uzak `http(s)` ve protokole göreli görüntü URL'leri tarayıcı tarafından reddedilir ve ağ getirme istekleri oluşturmaz.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görüntüler (örneğin `/avatars/<id>`) işlenmeye devam eder; UI'ın getirip yerel `blob:` URL'lerine dönüştürdüğü kimliği doğrulanmış avatar rotaları buna dahildir.
- Satır içi `data:image/...` URL'leri işlenmeye devam eder (protokol içi yükler için kullanışlıdır).
- Control UI tarafından oluşturulan yerel `blob:` URL'leri işlenmeye devam eder.
- Kanal metadatası tarafından yayımlanan uzak avatar URL'leri, Control UI'ın avatar yardımcıları tarafından ayıklanır ve yerleşik logo/rozetle değiştirilir; böylece ele geçirilmiş veya kötü amaçlı bir kanal, operatör tarayıcısından rastgele uzak görüntü getirme isteklerini zorlayamaz.

Bu davranışı elde etmek için herhangi bir şeyi değiştirmeniz gerekmez; her zaman etkindir ve yapılandırılamaz.

## Avatar rotası kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, Control UI avatar uç noktası API'nin geri kalanıyla aynı Gateway token'ını gerektirir:

- `GET /avatar/<agentId>` avatar görüntüsünü yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1` aynı kural altında avatar metadatasını döndürür.
- Her iki rotaya yapılan kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla eşleşecek şekilde). Bu, avatar rotasının aksi halde korunan ana makinelerde ajan kimliğini sızdırmasını engeller.
- Control UI, avatarları getirirken Gateway token'ını bearer başlığı olarak iletir ve görüntünün panolarda yine de işlenmesi için kimliği doğrulanmış blob URL'leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan ana makinelerde önerilmez), avatar rotası da Gateway'in geri kalanıyla uyumlu olarak kimliği doğrulanmamış hale gelir.

## Asistan medya rotası kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, asistan yerel medya önizlemeleri iki adımlı bir rota kullanır:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` normal Control UI operatör kimlik doğrulamasını gerektirir. Tarayıcı, kullanılabilirliği denetlerken Gateway token'ını bearer başlığı olarak gönderir.
- Başarılı metadata yanıtları, tam olarak o kaynak yoluna kapsamlanmış kısa ömürlü bir `mediaTicket` içerir.
- Tarayıcıda işlenen görüntü, ses, video ve belge URL'leri, etkin Gateway token'ı veya parolası yerine `mediaTicket=<ticket>` kullanır. Bilet hızlıca sona erer ve farklı bir kaynağı yetkilendiremez.

Bu, yeniden kullanılabilir Gateway kimlik bilgilerini görünür medya URL'lerine koymadan normal medya işlemesini tarayıcı yerel medya öğeleriyle uyumlu tutar.

## UI'ı oluşturma

Gateway, statik dosyaları `dist/control-ui` konumundan sunar. Bunları şu komutla oluşturun:

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

Ardından UI'ı Gateway WS URL'nize yönlendirin (örn. `ws://127.0.0.1:18789`).

## Hata ayıklama/test: geliştirme sunucusu + uzak Gateway

Control UI statik dosyalardan oluşur; WebSocket hedefi yapılandırılabilir ve HTTP origin'den farklı olabilir. Vite geliştirme sunucusunu yerelde, Gateway'i ise başka bir yerde çalıştırmak istediğinizde bu kullanışlıdır.

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
    - `gatewayUrl` yükleme sonrasında localStorage'da saklanır ve URL'den kaldırılır.
    - `gatewayUrl` üzerinden tam bir `ws://` veya `wss://` uç noktası geçirirseniz, tarayıcının sorgu dizgesini doğru ayrıştırması için `gatewayUrl` değerini URL kodlamasından geçirin.
    - `token` mümkün olduğunda URL parçası (`#token=...`) üzerinden geçirilmelidir. Parçalar sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca yedek olarak kullanılır ve bootstrap sonrasında hemen ayıklanır.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında UI, yapılandırma veya ortam kimlik bilgilerine geri dönmez. `token` (veya `password`) değerini açıkça sağlayın. Açık kimlik bilgilerinin eksik olması bir hatadır.
    - Gateway TLS arkasındayken (Tailscale Serve, HTTPS proxy vb.) `wss://` kullanın.
    - `gatewayUrl`, tıklama kaçırmayı önlemek için yalnızca üst düzey bir pencerede (gömülü değil) kabul edilir.
    - local loopback olmayan Control UI dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça ayarlamalıdır (tam origin'ler). Buna uzak geliştirme kurulumları dahildir.
    - Gateway başlangıcı, etkin çalışma zamanı bind ve port değerinden `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel origin'leri tohumlayabilir, ancak uzak tarayıcı origin'leri yine de açık girdilere ihtiyaç duyar.
    - Sıkı denetimli yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, "kullandığım ana makine neyse onunla eşleştir" değil, herhangi bir tarayıcı origin'ine izin ver anlamına gelir.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`, Host başlığı origin yedek modunu etkinleştirir, ancak tehlikeli bir güvenlik modudur.

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

- [Pano](/tr/web/dashboard) — Gateway panosu
- [Sağlık Denetimleri](/tr/gateway/health) — Gateway sağlık izleme
- [TUI](/tr/web/tui) — terminal kullanıcı arayüzü
- [WebChat](/tr/web/webchat) — tarayıcı tabanlı sohbet arayüzü
