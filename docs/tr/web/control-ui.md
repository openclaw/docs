---
read_when:
    - Gateway'i bir tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı denetim kullanıcı arayüzü (sohbet, düğümler, yapılandırma)
title: Kontrol Arayüzü
x-i18n:
    generated_at: "2026-05-02T21:01:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 88959ccf435b31015039bf28c3043023d99f0b953a1489986ab2d0cbd261771c
    source_path: web/control-ui.md
    workflow: 16
---

Control UI, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfalı uygulamadır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` değerini ayarlayın (örn. `/openclaw`)

Aynı bağlantı noktasında **doğrudan Gateway WebSocket** ile konuşur.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenemezse önce Gateway'i başlatın: `openclaw gateway`.

Kimlik doğrulama, WebSocket el sıkışması sırasında şu yollarla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üst bilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir proxy kimlik üst bilgileri

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için bir token saklar; parolalar kalıcı olarak saklanmaz. Onboarding genellikle ilk bağlantıda paylaşılan giz kimlik doğrulaması için bir gateway token'ı oluşturur, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Control UI'ye yeni bir tarayıcıdan veya cihazdan bağlandığınızda Gateway genellikle **tek seferlik eşleştirme onayı** ister. Bu, yetkisiz erişimi önlemeye yönelik bir güvenlik önlemidir.

**Göreceğiniz şey:** "bağlantı kesildi (1008): eşleştirme gerekli"

<Steps>
  <Step title="Bekleyen istekleri listele">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="İstek kimliğiyle onayla">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Tarayıcı, değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve onu okuma erişiminden yazma/yönetici erişimine değiştirirseniz bu sessiz yeniden bağlantı değil, onay yükseltmesi olarak ele alınır. OpenClaw eski onayı etkin tutar, daha geniş kapsamlı yeniden bağlantıyı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik olarak onaylanır.
- Tailscale Serve, `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı cihaz kimliğini sunduğunda Control UI operatör oturumları için eşleştirme gidiş dönüşünü atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri hâlâ açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği oluşturur; bu yüzden tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

</Note>

## Kişisel kimlik (tarayıcı-yerel)

Control UI, paylaşılan oturumlarda atıf için giden iletilere eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Bu kimlik tarayıcı depolamasında yaşar, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz iletilerdeki normal transkript yazarlığı meta verileri dışında diğer cihazlarla eşitlenmez veya sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya tarayıcı değiştirmek bunu boşa sıfırlar.

Aynı tarayıcı-yerel kalıp asistan avatarı geçersiz kılması için de geçerlidir. Yüklenen asistan avatarları, gateway tarafından çözümlenen kimliğin üzerine yalnızca yerel tarayıcıda bindirilir ve hiçbir zaman `config.patch` üzerinden gidip gelmez. Paylaşılan `ui.assistant.avatar` yapılandırma alanı, alanı doğrudan yazan UI dışı istemciler (betikli gateway'ler veya özel panolar gibi) için hâlâ kullanılabilir.

## Çalışma zamanı yapılandırma uç noktası

Control UI, çalışma zamanı ayarlarını `/__openclaw/control-ui-config.json` adresinden alır. Bu uç nokta, HTTP yüzeyinin geri kalanı ile aynı gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar bunu alamaz ve başarılı bir alma işlemi için zaten geçerli bir gateway token'ı/parolası, Tailscale Serve kimliği veya güvenilir proxy kimliği gerekir.

## Dil desteği

Control UI, ilk yüklemede tarayıcı yerel ayarınıza göre kendini yerelleştirebilir. Daha sonra geçersiz kılmak için **Genel Bakış -> Gateway Erişimi -> Dil** bölümünü açın. Yerel ayar seçici, Görünüm altında değil Gateway Erişimi kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışı çeviriler tarayıcıda geç yüklenir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve sonraki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Doküman çevirileri aynı İngilizce dışı yerel ayar kümesi için oluşturulur, ancak doküman sitesinin yerleşik Mintlify dil seçicisi Mintlify'nin kabul ettiği yerel ayar kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) dokümanlar yayımlama deposunda hâlâ oluşturulur; Mintlify bu kodları destekleyene kadar bu seçicide görünmeyebilirler.

## Görünüm temaları

Görünüm paneli yerleşik Claw, Knot ve Dash temalarını, ayrıca tarayıcı-yerel bir tweakcn içe aktarma yuvasını tutar. Bir tema içe aktarmak için [tweakcn temaları](https://tweakcn.com/themes) sayfasını açın, bir tema seçin veya oluşturun, **Paylaş**'a tıklayın ve kopyalanan tema bağlantısını Görünüm'e yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` kayıt URL'lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi düzenleyici URL'lerini, göreli `/themes/<id>` yollarını, ham tema kimliklerini ve `amethyst-haze` gibi varsayılan tema adlarını kabul eder.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde saklanır. Gateway yapılandırmasına yazılmazlar ve cihazlar arasında eşitlenmezler. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; temizlemek, içe aktarılan tema seçiliyse etkin temayı tekrar Claw'a geçirir.

## Ne yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden kısıtlı tek kullanımlık bir tarayıcı token'ı kullanır ve yalnızca arka uç gerçek zamanlı ses plugin'leri Gateway aktarma taşımasını kullanır. Aktarma, tarayıcı `talk.realtime.relay*` RPC'leri üzerinden mikrofon PCM akışı gönderirken sağlayıcı kimlik bilgilerini Gateway'de tutar ve daha büyük yapılandırılmış OpenClaw modeli için `openclaw_agent_consult` araç çağrılarını `chat.send` üzerinden geri gönderir.
    - Sohbet'te araç çağrılarını + canlı araç çıktı kartlarını yayınlayın (aracı olayları).

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, dreams">
    - Kanallar: yerleşik ve paketli/harici plugin kanalları durumu, QR girişi ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`).
    - Örnekler: varlık listesi + yenileme (`system-presence`).
    - Oturumlar: liste + oturum başına model/düşünme/hızlı/ayrıntılı/izleme/akıl yürütme geçersiz kılmaları (`sessions.list`, `sessions.patch`).
    - Dreams: dreaming durumu, etkinleştirme/devre dışı bırakma anahtarı ve Dream Diary okuyucu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, yürütme onayları">
    - Cron işleri: listeleme/ekleme/düzenleme/çalıştırma/etkinleştirme/devre dışı bırakma + çalıştırma geçmişi (`cron.*`).
    - Skills: durum, etkinleştirme/devre dışı bırakma, yükleme, API anahtarı güncellemeleri (`skills.*`).
    - Düğümler: liste + yetenekler (`node.list`).
    - Yürütme onayları: gateway veya düğüm izin listelerini + `exec host=gateway/node` için sorma politikasını düzenleme (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Yapılandırma">
    - `~/.openclaw/openclaw.json` dosyasını görüntüleme/düzenleme (`config.get`, `config.set`).
    - Doğrulama ile uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazmalar, eşzamanlı düzenlemelerin üzerine yazmayı önlemek için taban karma koruması içerir.
    - Yazmalar (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma yükündeki referanslar için etkin SecretRef çözümlemesini ön kontrolden geçirir; çözümlenemeyen etkin gönderilmiş referanslar yazmadan önce reddedilir.
    - Şema + form işleme (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, anlık alt öge özetleri, iç içe nesne/joker karakter/dizi/bileşim düğümlerindeki doküman meta verileri ve kullanılabilir olduğunda plugin + kanal şemaları dahil); Ham JSON düzenleyici yalnızca anlık görüntü güvenli ham gidiş dönüşe sahipse kullanılabilir.
    - Bir anlık görüntü ham metni güvenli şekilde gidiş dönüş yapamıyorsa Control UI Form modunu zorunlu kılar ve o anlık görüntü için Ham modu devre dışı bırakır.
    - Ham JSON düzenleyicisindeki "Kaydedilene sıfırla", düzleştirilmiş bir anlık görüntüyü yeniden işlemek yerine ham yazılmış şekli (biçimlendirme, yorumlar, `$include` düzeni) korur; böylece anlık görüntü güvenli şekilde gidiş dönüş yapabiliyorsa harici düzenlemeler sıfırlamadan sonra korunur.
    - Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizeye bozulmayı önlemek için form metin girişlerinde salt okunur işlenir.

  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/modeller anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Günlükler: filtre/dışa aktarma ile gateway dosya günlüklerinin canlı takibi (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla birlikte paket/git güncellemesi + yeniden başlatma çalıştır (`update.run`), ardından çalışan gateway sürümünü doğrulamak için yeniden bağlandıktan sonra `update.status` yokla.

  </Accordion>
  <Accordion title="Cron işleri panel notları">
    - Yalıtılmış işler için teslim varsayılanı özet duyurudur. Yalnızca dahili çalıştırmalar istiyorsanız yok seçeneğine geçebilirsiniz.
    - Duyuru seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) webhook URL'sine ayarlanmış şekilde `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için webhook ve yok teslim modları kullanılabilir.
    - Gelişmiş düzenleme kontrolleri; çalıştırmadan sonra silme, aracı geçersiz kılmasını temizleme, cron kesin/dağıtmalı seçenekleri, aracı model/düşünme geçersiz kılmaları ve en iyi çaba teslim anahtarlarını içerir.
    - Form doğrulaması alan düzeyi hatalarla satır içidir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Özel bir bearer token göndermek için `cron.webhookToken` ayarlayın; atlanırsa webhook kimlik doğrulama üst bilgisi olmadan gönderilir.
    - Kullanımdan kaldırılmış geri dönüş: `notify: true` içeren saklanmış eski işler, taşınana kadar `cron.webhook` kullanmaya devam edebilir.

  </Accordion>
</AccordionGroup>

## Sohbet davranışı

<AccordionGroup>
  <Accordion title="Gönderme ve geçmiş semantiği">
    - `chat.send` **bloklamaz**: `{ runId, status: "started" }` ile hemen onay verir ve yanıt `chat` olayları üzerinden akış olarak gelir.
    - Sohbet yüklemeleri görüntüleri ve video olmayan dosyaları kabul eder. Görüntüler yerel görüntü yolunu korur; diğer dosyalar yönetilen medya olarak depolanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden gönderme, çalışırken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları UI güvenliği için boyutla sınırlandırılmıştır. Transkript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır metadata bloklarını atlayabilir ve aşırı büyük mesajları bir yer tutucuyla değiştirebilir (`[chat.history omitted: message too large]`).
    - Assistant/oluşturulmuş görüntüler yönetilen medya referansları olarak kalıcı hale getirilir ve kimliği doğrulanmış Gateway medya URL'leri üzerinden geri sunulur; bu nedenle yeniden yüklemeler, ham base64 görüntü yüklerinin sohbet geçmişi yanıtında kalmasına bağlı değildir.
    - `chat.history` ayrıca görünen assistant metninden yalnızca gösterim amaçlı satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin tool-call XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış tool-call blokları dahil) ve sızmış ASCII/tam genişlikli model kontrol token'larını çıkarır; görünen metninin tamamı yalnızca tam sessiz token `NO_REPLY` / `no_reply` olan assistant girdilerini atlar.
    - Etkin bir gönderim sırasında ve son geçmiş yenilemesinde, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürürse sohbet görünümü yerel iyimser kullanıcı/assistant mesajlarını görünür tutar; Gateway geçmişi yetiştiğinde kanonik transkript bu yerel mesajların yerini alır.
    - `chat.inject`, oturum transkriptine bir assistant notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (agent çalıştırması yok, kanal teslimi yok).
    - Sohbet başlığı model ve düşünme seçicileri etkin oturumu `sessions.patch` üzerinden hemen yamalar; bunlar tek turla sınırlı gönderim seçenekleri değil, kalıcı oturum geçersiz kılmalarıdır.
    - Control UI içinde `/new` yazmak, New Chat ile aynı yeni dashboard oturumunu oluşturur ve ona geçer. `/reset` yazmak, geçerli oturum için Gateway'in açık yerinde sıfırlamasını korur.
    - Sohbet model seçici, Gateway'in yapılandırılmış model görünümünü ister. `agents.defaults.models` varsa seçiciyi bu izin listesi yönlendirir. Aksi halde seçici, açık `models.providers.*.models` girdilerini ve kullanılabilir kimlik doğrulaması olan sağlayıcıları gösterir. Tam katalog, hata ayıklama `models.list` RPC'si üzerinden `view: "all"` ile kullanılabilir kalır.
    - Yeni Gateway oturum kullanım raporları yüksek context baskısı gösterdiğinde, sohbet oluşturucu alanı bir context bildirimi ve önerilen compaction düzeylerinde normal oturum compaction yolunu çalıştıran kompakt bir düğme gösterir. Gateway yeniden güncel kullanım bildirene kadar eski token anlık görüntüleri gizlenir.

  </Accordion>
  <Accordion title="Konuşma modu (tarayıcı gerçek zamanlı)">
    Konuşma modu kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. OpenAI'yi `talk.provider: "openai"` artı `talk.providers.openai.apiKey` ile yapılandırın veya Google'ı `talk.provider: "google"` artı `talk.providers.google.apiKey` ile yapılandırın; Voice Call gerçek zamanlı sağlayıcı yapılandırması hâlâ yedek olarak yeniden kullanılabilir. Tarayıcı hiçbir zaman standart bir sağlayıcı API anahtarı almaz. OpenAI, WebRTC için geçici bir Realtime istemci sırrı alır. Google Live, tarayıcı WebSocket oturumu için tek kullanımlık, kısıtlı bir Live API kimlik doğrulama token'ı alır; talimatlar ve araç bildirimleri Gateway tarafından token içine kilitlenir. Yalnızca arka uç gerçek zamanlı köprüsü sunan sağlayıcılar Gateway relay transport üzerinden çalışır; böylece kimlik bilgileri ve satıcı soketleri sunucu tarafında kalırken tarayıcı sesi kimliği doğrulanmış Gateway RPC'leri üzerinden taşınır. Realtime oturum prompt'u Gateway tarafından birleştirilir; `talk.realtime.session` çağıranın sağladığı talimat geçersiz kılmalarını kabul etmez.

    Chat oluşturucuda Talk denetimi, mikrofon dikte düğmesinin yanındaki dalgalar düğmesidir. Talk başladığında, oluşturucu durum satırı `Connecting Talk...`, ardından ses bağlıyken `Talk live` veya gerçek zamanlı bir araç çağrısı yapılandırılmış daha büyük modele `chat.send` üzerinden danışırken `Asking OpenClaw...` gösterir.

    Maintainer canlı smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` OpenAI tarayıcı WebRTC SDP alışverişini, Google Live kısıtlı-token tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway relay tarayıcı bağdaştırıcısını doğrular. Komut yalnızca sağlayıcı durumunu yazdırır ve sırları günlüğe yazmaz.

  </Accordion>
  <Accordion title="Durdurma ve iptal">
    - **Stop**'a tıklayın (`chat.abort` çağırır).
    - Bir çalıştırma etkin durumdayken normal takip mesajları kuyruğa alınır. Kuyruktaki bir mesajda **Steer**'a tıklayarak bu takip mesajını çalışan tura enjekte edin.
    - Bant dışı iptal etmek için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi tek başına iptal ifadeleri).
    - `chat.abort`, o oturumdaki tüm etkin çalıştırmaları iptal etmek için `{ sessionKey }` desteği sunar (`runId` olmadan).

  </Accordion>
  <Accordion title="İptal kısmi koruması">
    - Bir çalıştırma iptal edildiğinde, kısmi assistant metni UI içinde yine de gösterilebilir.
    - Gateway, tamponlanmış çıktı varsa iptal edilen kısmi assistant metnini transkript geçmişine kalıcı olarak yazar.
    - Kalıcı girdiler iptal metadata'sı içerir; böylece transkript tüketicileri iptal kısımlarını normal tamamlanma çıktısından ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve web push

Control UI bir `manifest.webmanifest` ve bir service worker ile gelir; bu nedenle modern tarayıcılar onu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık olmasa bile Gateway'in kurulu PWA'yı bildirimlerle uyandırmasına olanak tanır.

| Yüzey                                                 | Ne yapar                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest'i. Tarayıcılar erişilebilir olduğunda "Uygulamayı kur" seçeneğini sunar. |
| `ui/public/sw.js`                                     | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw durum dizini altında) | Web Push yüklerini imzalamak için kullanılan otomatik oluşturulmuş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                    | Kalıcı tarayıcı abonelik uç noktaları.                             |

Anahtarları sabitlemek istediğinizde (çok ana makineli dağıtımlar, sır rotasyonu veya testler için) VAPID anahtar çiftini Gateway sürecindeki env var'lar üzerinden geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılan `mailto:openclaw@localhost`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için bu kapsam kapılı Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID açık anahtarını getirir.
- `push.web.subscribe` — bir `endpoint` ile `keys.p256dh`/`keys.auth` kaydeder.
- `push.web.unsubscribe` — kayıtlı bir uç noktayı kaldırır.
- `push.web.test` — çağıranın aboneliğine bir test bildirimi gönderir.

<Note>
Web Push, iOS APNS relay yolundan (relay destekli push için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın) ve yerel mobil eşlemeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Barındırılan embed'ler

Assistant mesajları, `[embed ...]` shortcode'u ile barındırılan web içeriğini satır içinde işleyebilir. Iframe sandbox ilkesi `gateway.controlUi.embedSandbox` tarafından denetlenir:

<Tabs>
  <Tab title="katı">
    Barındırılan embed'ler içinde script yürütmeyi devre dışı bırakır.
  </Tab>
  <Tab title="script'ler (varsayılan)">
    Origin izolasyonunu korurken etkileşimli embed'lere izin verir; bu varsayılandır ve genellikle kendi kendine yeterli tarayıcı oyunları/widget'ları için yeterlidir.
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
`trusted` yalnızca gömülü belge gerçekten same-origin davranışına ihtiyaç duyduğunda kullanın. Çoğu agent tarafından oluşturulmuş oyun ve etkileşimli canvas için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` embed URL'leri varsayılan olarak engelli kalır. Bilerek `[embed url="https://..."]` öğesinin üçüncü taraf sayfaları yüklemesini istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

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

Değer tarayıcıya ulaşmadan önce doğrulanır. Desteklenen değerler `960px` veya `82%` gibi düz uzunlukları ve yüzdeleri, ayrıca kısıtlı `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` ve `fit-content(...)` genişlik ifadelerini içerir.

## Tailnet erişimi (önerilir)

<Tabs>
  <Tab title="Entegre Tailscale Serve (tercih edilen)">
    Gateway'i loopback üzerinde tutun ve Tailscale Serve'ün onu HTTPS ile proxy'lemesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Varsayılan olarak, Control UI/WebSocket Serve istekleri `gateway.auth.allowTailscale` `true` olduğunda Tailscale kimlik başlıkları (`tailscale-user-login`) üzerinden kimlik doğrulayabilir. OpenClaw, `x-forwarded-for` adresini `tailscale whois` ile çözümleyip başlıkla eşleştirerek kimliği doğrular ve bunları yalnızca istek Tailscale'in `x-forwarded-*` başlıklarıyla loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliğine sahip Control UI operatör oturumları için bu doğrulanmış Serve yolu cihaz eşleme gidiş dönüşünü de atlar; cihazsız tarayıcılar ve node-role bağlantıları normal cihaz kontrollerini izlemeye devam eder. Serve trafiği için bile açık paylaşılan sır kimlik bilgileri istemek istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu async Serve kimlik yolu için, aynı istemci IP'si ve kimlik doğrulama kapsamına ait başarısız auth denemeleri rate-limit yazımlarından önce serileştirilir. Bu nedenle aynı tarayıcıdan gelen eşzamanlı kötü yeniden denemeler, paralel yarışan iki düz uyumsuzluk yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Tokensız Serve auth, gateway ana makinesinin güvenilir olduğunu varsayar. Bu ana makinede güvenilmeyen yerel kod çalışabiliyorsa token/password auth gerektirin.
    </Warning>

  </Tab>
  <Tab title="Tailnet'e bağla + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ardından açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Eşleşen paylaşılan sırrı UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvensiz HTTP

Dashboard'u düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`), tarayıcı **güvenli olmayan bir context** içinde çalışır ve WebCrypto'yu engeller. Varsayılan olarak OpenClaw, cihaz kimliği olmayan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Control UI auth
- acil durum `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI'yi yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway ana makinesinde)

<AccordionGroup>
  <Accordion title="Güvenli olmayan kimlik doğrulama geçişi davranışı">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` yalnızca yerel uyumluluk geçişidir:

    - Güvenli olmayan HTTP bağlamlarında localhost Denetim kullanıcı arayüzü oturumlarının cihaz kimliği olmadan devam etmesine izin verir.
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
    `dangerouslyDisableDeviceAuth` Denetim kullanıcı arayüzü cihaz kimliği denetimlerini devre dışı bırakır ve güvenliği ciddi biçimde düşürür. Acil kullanım sonrası hızla geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Güvenilir proxy notu">
    - Başarılı güvenilir proxy kimlik doğrulaması, **operatör** Denetim kullanıcı arayüzü oturumlarını cihaz kimliği olmadan kabul edebilir.
    - Bu, düğüm rolündeki Denetim kullanıcı arayüzü oturumlarına genişletilmez.
    - Aynı ana makinedeki loopback ters proxy'leri yine de güvenilir proxy kimlik doğrulamasını karşılamaz; bkz. [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberi için bkz. [Tailscale](/tr/gateway/tailscale).

## İçerik güvenliği ilkesi

Denetim kullanıcı arayüzü sıkı bir `img-src` ilkesiyle gelir: yalnızca **aynı kaynaklı** varlıklara, `data:` URL'lerine ve yerel olarak oluşturulan `blob:` URL'lerine izin verilir. Uzak `http(s)` ve protokole göreli görüntü URL'leri tarayıcı tarafından reddedilir ve ağ getirme istekleri oluşturmaz.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görüntüler (örneğin `/avatars/<id>`) işlenmeye devam eder; buna kullanıcı arayüzünün getirip yerel `blob:` URL'lerine dönüştürdüğü kimliği doğrulanmış avatar rotaları da dahildir.
- Satır içi `data:image/...` URL'leri işlenmeye devam eder (protokol içi yükler için kullanışlıdır).
- Denetim kullanıcı arayüzü tarafından oluşturulan yerel `blob:` URL'leri işlenmeye devam eder.
- Kanal meta verileri tarafından yayımlanan uzak avatar URL'leri, Denetim kullanıcı arayüzünün avatar yardımcılarında çıkarılır ve yerleşik logo/rozetle değiştirilir; böylece ele geçirilmiş veya kötü amaçlı bir kanal, bir operatör tarayıcısından rastgele uzak görüntü getirme işlemlerini zorlayamaz.

Bu davranışı elde etmek için herhangi bir şeyi değiştirmeniz gerekmez — her zaman etkindir ve yapılandırılamaz.

## Avatar rota kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, Denetim kullanıcı arayüzü avatar uç noktası API'nin geri kalanıyla aynı Gateway token'ını gerektirir:

- `GET /avatar/<agentId>` avatar görüntüsünü yalnızca kimliği doğrulanmış çağırıcılara döndürür. `GET /avatar/<agentId>?meta=1` aynı kural kapsamında avatar meta verilerini döndürür.
- Her iki rotaya yapılan kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla uyumlu şekilde). Bu, avatar rotasının başka türlü korunan ana makinelerde ajan kimliğini sızdırmasını önler.
- Denetim kullanıcı arayüzü avatarları getirirken Gateway token'ını bearer üst bilgisi olarak iletir ve görüntünün panolarda yine de işlenmesi için kimliği doğrulanmış blob URL'leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan ana makinelerde önerilmez), avatar rotası da Gateway'in geri kalanıyla uyumlu olarak kimliği doğrulanmamış hale gelir.

## Kullanıcı arayüzünü derleme

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

Ardından kullanıcı arayüzünü Gateway WS URL'nize yönlendirin (örn. `ws://127.0.0.1:18789`).

## Hata ayıklama/test etme: geliştirme sunucusu + uzak Gateway

Denetim kullanıcı arayüzü statik dosyalardır; WebSocket hedefi yapılandırılabilir ve HTTP kaynağından farklı olabilir. Vite geliştirme sunucusunu yerelde, Gateway'i ise başka bir yerde çalıştırmak istediğinizde bu kullanışlıdır.

<Steps>
  <Step title="Kullanıcı arayüzü geliştirme sunucusunu başlatın">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="gatewayUrl ile açın">
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
  <Accordion title="Notlar">
    - `gatewayUrl` yüklemeden sonra localStorage içinde saklanır ve URL'den kaldırılır.
    - `gatewayUrl` aracılığıyla tam bir `ws://` veya `wss://` uç noktası geçirirseniz, tarayıcının sorgu dizesini doğru ayrıştırması için `gatewayUrl` değerini URL ile kodlayın.
    - `token` mümkün olduğunca URL parçası (`#token=...`) aracılığıyla geçirilmelidir. Parçalar sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca yedek olarak kullanılır ve bootstrap sonrasında hemen çıkarılır.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında, kullanıcı arayüzü yapılandırma veya ortam kimlik bilgilerine geri dönmez. `token` (veya `password`) değerini açıkça sağlayın. Açık kimlik bilgilerinin eksik olması bir hatadır.
    - Gateway TLS arkasındaysa (Tailscale Serve, HTTPS proxy vb.) `wss://` kullanın.
    - Tıklama ele geçirmeyi önlemek için `gatewayUrl` yalnızca üst düzey bir pencerede kabul edilir (gömülü değil).
    - local loopback olmayan Denetim kullanıcı arayüzü dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça ayarlamalıdır (tam kaynaklar). Buna uzak geliştirme kurulumları dahildir.
    - Gateway başlatma, etkin çalışma zamanı bağlama adresi ve bağlantı noktasından `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel kaynakları tohumlayabilir; ancak uzak tarayıcı kaynakları yine de açık girdiler gerektirir.
    - Sıkı denetimli yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, "kullandığım ana makine neyse onu eşleştir" değil, herhangi bir tarayıcı kaynağına izin ver anlamına gelir.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` Host üst bilgisi kaynak yedek modunu etkinleştirir, ancak bu tehlikeli bir güvenlik modudur.

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
