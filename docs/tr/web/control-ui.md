---
read_when:
    - Gateway'i bir tarayıcıdan yönetmek istiyorsunuz
    - Tailnet erişimini SSH tünelleri olmadan istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı kontrol arayüzü (sohbet, düğümler, yapılandırma)
title: Kontrol Arayüzü
x-i18n:
    generated_at: "2026-05-06T09:36:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c16b37405d7a490b89ea90f2b006c01b9a7b1a3e5278769006b4dc94e7d83aa
    source_path: web/control-ui.md
    workflow: 16
---

Kontrol UI, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfa uygulamasıdır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı ön ek: `gateway.controlUi.basePath` ayarını belirleyin (örn. `/openclaw`)

Aynı bağlantı noktasında **doğrudan Gateway WebSocket** ile konuşur.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenmezse önce Gateway'i başlatın: `openclaw gateway`.

Kimlik doğrulama, WebSocket el sıkışması sırasında şu yollarla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üst bilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilen proxy kimlik üst bilgileri

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçili Gateway URL'si için bir token tutar; parolalar kalıcı olarak saklanmaz. İlk bağlantıda onboarding genellikle paylaşılan gizli anahtar kimlik doğrulaması için bir Gateway token'ı oluşturur, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Kontrol UI'ye yeni bir tarayıcıdan veya cihazdan bağlandığınızda, Gateway genellikle **tek seferlik eşleştirme onayı** ister. Bu, yetkisiz erişimi önlemek için bir güvenlik önlemidir.

**Göreceğiniz şey:** "disconnected (1008): pairing required"

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

Tarayıcı değişmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve onu okuma erişiminden yazma/yönetici erişimine değiştirirseniz bu, sessiz yeniden bağlantı değil bir onay yükseltmesi olarak ele alınır. OpenClaw eski onayı etkin tutar, daha geniş yeniden bağlantıyı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerekmez. Token döndürme ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik onaylanır.
- Tailscale Serve, `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı cihaz kimliğini sunduğunda Kontrol UI operatör oturumları için eşleştirme gidiş dönüşünü atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği oluşturur; bu nedenle tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

</Note>

## Kişisel kimlik (tarayıcı yerelinde)

Kontrol UI, paylaşılan oturumlarda atıf için giden iletilere eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Bu kimlik tarayıcı depolamasında bulunur, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz iletilerdeki normal konuşma dökümü yazarlık meta verileri dışında diğer cihazlara eşitlenmez veya sunucu tarafında kalıcı tutulmaz. Site verilerini temizlemek veya tarayıcı değiştirmek bunu boş duruma sıfırlar.

Aynı tarayıcı yerelindeki desen, asistan avatarı geçersiz kılmasına da uygulanır. Yüklenen asistan avatarları, yalnızca yerel tarayıcıda Gateway tarafından çözümlenen kimliğin üzerine bindirilir ve hiçbir zaman `config.patch` üzerinden gidiş dönüş yapmaz. Paylaşılan `ui.assistant.avatar` yapılandırma alanı, alanı doğrudan yazan UI dışı istemciler için (betiklerle kullanılan Gateway'ler veya özel panolar gibi) hâlâ kullanılabilir.

## Çalışma zamanı yapılandırma uç noktası

Kontrol UI, çalışma zamanı ayarlarını `/__openclaw/control-ui-config.json` adresinden alır. Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı Gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar bunu alamaz ve başarılı bir getirme işlemi için halihazırda geçerli bir Gateway token'ı/parolası, Tailscale Serve kimliği veya güvenilen proxy kimliği gerekir.

## Dil desteği

Kontrol UI, ilk yüklemede tarayıcı yerel ayarınıza göre kendini yerelleştirebilir. Daha sonra geçersiz kılmak için **Genel Bakış -> Gateway Erişimi -> Dil** bölümünü açın. Yerel ayar seçici, Görünüm altında değil Gateway Erişimi kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışındaki çeviriler tarayıcıda tembel yüklenir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve gelecekteki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Doküman çevirileri aynı İngilizce dışı yerel ayar kümesi için oluşturulur, ancak doküman sitesinin yerleşik Mintlify dil seçicisi Mintlify'ın kabul ettiği yerel ayar kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) dokümanlar yayımlama deposunda yine de oluşturulur; Mintlify bu kodları destekleyene kadar o seçicide görünmeyebilir.

## Görünüm temaları

Görünüm paneli yerleşik Claw, Knot ve Dash temalarını, ayrıca tarayıcı yerelinde bir tweakcn içe aktarma yuvasını tutar. Bir tema içe aktarmak için [tweakcn düzenleyicisini](https://tweakcn.com/editor/theme) açın, bir tema seçin veya oluşturun, **Paylaş**'a tıklayın ve kopyalanan tema bağlantısını Görünüm'e yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` kayıt URL'lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi düzenleyici URL'lerini, göreli `/themes/<id>` yollarını, ham tema kimliklerini ve `amethyst-haze` gibi varsayılan tema adlarını kabul eder.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde depolanır. Gateway yapılandırmasına yazılmaz ve cihazlar arasında eşitlenmez. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; temizlemek, içe aktarılan tema seçiliyse etkin temayı tekrar Claw'a geçirir.

## Ne yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Sohbet geçmişi yenilemeleri, büyük oturumların sohbet kullanılabilir hale gelmeden önce tarayıcıyı tam bir konuşma dökümü yükünü işlemeye zorlamaması için ileti başına metin sınırlarıyla sınırlı yakın geçmiş penceresi ister.
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden kısıtlı tek kullanımlık tarayıcı token'ı kullanır ve yalnızca arka uçta çalışan gerçek zamanlı ses Plugin'leri Gateway aktarma taşımasını kullanır. İstemciye ait sağlayıcı oturumları `talk.client.create` ile başlar; Gateway aktarma oturumları `talk.session.create` ile başlar. Aktarma, tarayıcı mikrofon PCM'sini `talk.session.appendAudio` üzerinden akıtırken sağlayıcı kimlik bilgilerini Gateway'de tutar ve Gateway ilkesi ile daha büyük yapılandırılmış OpenClaw modeli için `openclaw_agent_consult` sağlayıcı araç çağrılarını `talk.client.toolCall` üzerinden iletir.
    - Sohbet'te araç çağrılarını + canlı araç çıktısı kartlarını akıtın (ajan olayları).

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, rüyalar">
    - Kanallar: yerleşik ve paketli/harici Plugin kanal durumları, QR girişi ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`).
    - Kanal yoklama yenilemeleri, yavaş sağlayıcı kontrolleri biterken önceki anlık görüntüyü görünür tutar ve bir yoklama ya da denetim UI bütçesini aştığında kısmi anlık görüntüler etiketlenir.
    - Örnekler: varlık listesi + yenileme (`system-presence`).
    - Oturumlar: liste + oturum başına model/düşünme/hızlı/ayrıntılı/izleme/akıl yürütme geçersiz kılmaları (`sessions.list`, `sessions.patch`).
    - Rüyalar: Dreaming durumu, etkinleştir/devre dışı bırak düğmesi ve Rüya Günlüğü okuyucu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, düğümler, exec onayları">
    - Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalışma geçmişi (`cron.*`).
    - Skills: durum, etkinleştir/devre dışı bırak, yükle, API anahtarı güncellemeleri (`skills.*`).
    - Düğümler: liste + yetenekler (`node.list`).
    - Exec onayları: Gateway veya düğüm izin listelerini düzenle + `exec host=gateway/node` için sorma ilkesi (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Yapılandırma">
    - `~/.openclaw/openclaw.json` görüntüle/düzenle (`config.get`, `config.set`).
    - Doğrulamayla uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazmalar, eşzamanlı düzenlemelerin üzerine yazılmasını önlemek için bir temel hash koruması içerir.
    - Yazmalar (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma yükündeki referanslar için etkin SecretRef çözümlemesini önceden denetler; çözümlenemeyen etkin gönderilmiş referanslar yazmadan önce reddedilir.
    - Şema + form oluşturma (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, doğrudan alt özetler, iç içe nesne/joker karakter/dizi/bileşim düğümlerinde doküman meta verileri ve kullanılabilir olduğunda Plugin + kanal şemaları dahil); Ham JSON düzenleyicisi yalnızca anlık görüntünün güvenli ham gidiş dönüşü olduğunda kullanılabilir.
    - Bir anlık görüntü ham metni güvenli şekilde gidiş dönüş yapamıyorsa Kontrol UI, Form modunu zorlar ve o anlık görüntü için Ham modu devre dışı bırakır.
    - Ham JSON düzenleyicisindeki "Kaydedilene sıfırla", düzleştirilmiş bir anlık görüntüyü yeniden oluşturmak yerine ham yazılmış şekli (biçimlendirme, yorumlar, `$include` düzeni) korur; böylece anlık görüntü güvenli şekilde gidiş dönüş yapabildiğinde harici düzenlemeler sıfırlamadan sonra korunur.
    - Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizeye bozulmayı önlemek için form metin girişlerinde salt okunur olarak oluşturulur.

  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/modeller anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Olay günlüğü, Control UI yenileme/RPC zamanlamalarını, yavaş sohbet/yapılandırma oluşturma zamanlamalarını ve tarayıcı bu PerformanceObserver giriş türlerini sunduğunda uzun animasyon kareleri veya uzun görevler için tarayıcı yanıt verme girdilerini içerir.
    - Günlükler: Gateway dosya günlüklerinin filtre/dışa aktarma ile canlı kuyruğu (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla bir paket/git güncellemesi + yeniden başlatma çalıştır (`update.run`), ardından yeniden bağlandıktan sonra çalışan Gateway sürümünü doğrulamak için `update.status` yokla.

  </Accordion>
  <Accordion title="Cron işleri panel notları">
    - Yalıtılmış işler için teslim varsayılanı özet duyurusudur. Yalnızca dahili çalışmalar istiyorsanız bunu yok olarak değiştirebilirsiniz.
    - Duyuru seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) Webhook URL'si olacak şekilde `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için Webhook ve yok teslim modları kullanılabilir.
    - Gelişmiş düzenleme denetimleri çalıştırmadan sonra silme, ajan geçersiz kılmasını temizleme, Cron kesin/kademeli seçenekleri, ajan model/düşünme geçersiz kılmaları ve en iyi çaba teslim düğmelerini içerir.
    - Form doğrulaması alan düzeyindeki hatalarla satır içinde yapılır; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Ayrı bir bearer token göndermek için `cron.webhookToken` ayarını belirleyin; atlanırsa Webhook kimlik doğrulama üst bilgisi olmadan gönderilir.
    - Kullanımdan kaldırılmış geri dönüş: `notify: true` ile depolanan eski işler, taşınana kadar `cron.webhook` kullanmaya devam edebilir.

  </Accordion>
</AccordionGroup>

## Sohbet davranışı

<AccordionGroup>
  <Accordion title="Gönderme ve geçmiş semantiği">
    - `chat.send` **engellemesizdir**: hemen `{ runId, status: "started" }` ile onaylar ve yanıt `chat` olayları üzerinden akış olarak gelir.
    - Sohbet yüklemeleri görüntüleri ve video olmayan dosyaları kabul eder. Görüntüler yerel görüntü yolunu korur; diğer dosyalar yönetilen medya olarak saklanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden gönderme, çalışırken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları UI güvenliği için boyutla sınırlıdır. Transcript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır metadata bloklarını atlayabilir ve aşırı büyük iletileri bir placeholder (`[chat.history omitted: message too large]`) ile değiştirebilir.
    - Asistan/oluşturulan görüntüler yönetilen medya referansları olarak kalıcı hale getirilir ve kimliği doğrulanmış Gateway medya URL'leri üzerinden geri sunulur; böylece yeniden yüklemeler ham base64 görüntü payload'larının sohbet geçmişi yanıtında kalmasına bağlı olmaz.
    - `chat.history` oluşturulurken Control UI, görünen asistan metninden yalnızca görüntüleme amaçlı satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin tool-call XML payload'larını (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış tool-call blokları dahil) ve sızmış ASCII/tam genişlikli model kontrol token'larını ayıklar; tüm görünür metni yalnızca tam sessiz token `NO_REPLY` / `no_reply` veya Heartbeat onay token'ı `HEARTBEAT_OK` olan asistan girdilerini atlar.
    - Etkin bir gönderim sırasında ve son geçmiş yenilemesinde, `chat.history` kısa süreliğine daha eski bir snapshot döndürürse sohbet görünümü yerel iyimser kullanıcı/asistan iletilerini görünür tutar; Gateway geçmişi yetiştiğinde kanonik transcript bu yerel iletilerin yerini alır.
    - Canlı `chat` olayları teslim durumudur; `chat.history` ise dayanıklı oturum transcript'inden yeniden oluşturulur. Tool-final olaylarından sonra Control UI geçmişi yeniden yükler ve yalnızca küçük bir iyimser kuyruğu birleştirir; transcript sınırı [WebChat](/tr/web/webchat) bölümünde belgelenmiştir.
    - `chat.inject`, oturum transcript'ine bir asistan notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (agent çalıştırması yok, kanal teslimi yok).
    - Sohbet başlığı, oturum seçiciden önce agent filtresini gösterir ve oturum seçici seçili agent kapsamındadır. Agent değiştirildiğinde yalnızca o agent'a bağlı oturumlar gösterilir ve henüz kayıtlı dashboard oturumu yoksa o agent'ın ana oturumuna geri döner.
    - Masaüstü genişliklerinde sohbet denetimleri tek bir kompakt satırda kalır ve transcript aşağı kaydırılırken daralır; yukarı kaydırmak, en üste dönmek veya en alta ulaşmak denetimleri geri getirir.
    - Ardışık yinelenen yalnızca metin iletileri, sayı rozeti olan tek bir balon olarak render edilir. Görüntü, ek, araç çıktısı veya canvas önizlemesi taşıyan iletiler daraltılmaz.
    - Sohbet başlığı model ve thinking seçicileri etkin oturumu `sessions.patch` üzerinden hemen yamalar; bunlar kalıcı oturum geçersiz kılmalarıdır, yalnızca tek dönüşlük gönderme seçenekleri değildir.
    - Control UI içinde `/new` yazmak, New Chat ile aynı yeni dashboard oturumunu oluşturur ve ona geçer. `/reset` yazmak, geçerli oturum için Gateway'in açık yerinde sıfırlamasını korur.
    - Sohbet model seçici, Gateway'in yapılandırılmış model görünümünü ister. `agents.defaults.models` varsa seçiciyi bu allowlist yönlendirir. Aksi halde seçici açık `models.providers.*.models` girdilerini ve kullanılabilir kimlik doğrulaması olan sağlayıcıları gösterir. Tam catalog, debug `models.list` RPC'si üzerinden `view: "all"` ile kullanılabilir kalır.
    - Yeni Gateway oturum kullanım raporları yüksek context baskısı gösterdiğinde, sohbet composer alanı bir context bildirimi ve önerilen Compaction seviyelerinde normal oturum Compaction yolunu çalıştıran kompakt bir düğme gösterir. Gateway yeniden güncel kullanım bildirene kadar eski token snapshot'ları gizlenir.

  </Accordion>
  <Accordion title="Konuşma modu (tarayıcı gerçek zamanlı)">
    Konuşma modu kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. OpenAI'ı `talk.realtime.provider: "openai"` ve `talk.realtime.providers.openai.apiKey` ile yapılandırın veya Google'ı `talk.realtime.provider: "google"` ve `talk.realtime.providers.google.apiKey` ile yapılandırın. Tarayıcı hiçbir zaman standart bir sağlayıcı API anahtarı almaz. OpenAI, WebRTC için geçici bir Realtime istemci secret'ı alır. Google Live, talimatları ve araç bildirimleri Gateway tarafından token'a kilitlenmiş şekilde, tarayıcı WebSocket oturumu için tek kullanımlık kısıtlı bir Live API auth token'ı alır. Yalnızca arka uç gerçek zamanlı köprüsü sunan sağlayıcılar Gateway relay taşıması üzerinden çalışır; böylece kimlik bilgileri ve vendor soketleri sunucu tarafında kalırken tarayıcı sesi kimliği doğrulanmış Gateway RPC'leri üzerinden taşınır. Realtime oturum prompt'u Gateway tarafından derlenir; `talk.client.create` çağıran tarafından sağlanan talimat geçersiz kılmalarını kabul etmez.

    Chat composer'da Talk denetimi, mikrofon dikte düğmesinin yanındaki dalgalar düğmesidir. Talk başladığında composer durum satırı `Connecting Talk...`, ses bağlandığında `Talk live` veya gerçek zamanlı bir araç çağrısı `talk.client.toolCall` üzerinden yapılandırılmış daha büyük modele danışırken `Asking OpenClaw...` gösterir.

    Maintainer canlı smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`, OpenAI tarayıcı WebRTC SDP alışverişini, Google Live kısıtlı-token tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway relay tarayıcı adaptörünü doğrular. Komut yalnızca sağlayıcı durumunu yazdırır ve secret'ları loglamaz.

  </Accordion>
  <Accordion title="Durdurma ve iptal">
    - **Stop** öğesine tıklayın (`chat.abort` çağırır).
    - Bir çalışma etkinken normal takip iletileri kuyruğa alınır. Bu takip iletisini çalışan dönüşe enjekte etmek için kuyruktaki iletide **Steer** öğesine tıklayın.
    - Bant dışı iptal etmek için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi tek başına iptal ifadeleri kullanın).
    - `chat.abort`, o oturumdaki tüm etkin çalışmaları iptal etmek için `{ sessionKey }` desteği sunar (`runId` olmadan).

  </Accordion>
  <Accordion title="Kısmi iptal tutma">
    - Bir çalışma iptal edildiğinde, kısmi asistan metni UI'da yine de gösterilebilir.
    - Gateway, tamponlanmış çıktı varsa iptal edilen kısmi asistan metnini transcript geçmişine kalıcı olarak yazar.
    - Kalıcı girdiler iptal metadata'sı içerir; böylece transcript tüketicileri iptal kısımlarını normal tamamlanma çıktısından ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve web push

Control UI, bir `manifest.webmanifest` ve service worker ile gelir; bu nedenle modern tarayıcılar onu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık değilken bile Gateway'in kurulu PWA'yı bildirimlerle uyandırmasını sağlar.

| Yüzey                                                 | Ne yapar                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest'i. Tarayıcılar erişilebilir olduğunda "Install app" seçeneğini sunar. |
| `ui/public/sw.js`                                     | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw state dir altında)   | Web Push payload'larını imzalamak için kullanılan otomatik oluşturulmuş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                    | Kalıcı tarayıcı abonelik endpoint'leri.                            |

Anahtarları sabitlemek istediğinizde (çok ana makineli dağıtımlar, secret rotasyonu veya testler için) Gateway işlemi üzerinde env var'lar aracılığıyla VAPID anahtar çiftini geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılan `mailto:openclaw@localhost`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için bu scope-gated Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID public key'i getirir.
- `push.web.subscribe` — bir `endpoint` ile `keys.p256dh`/`keys.auth` kaydeder.
- `push.web.unsubscribe` — kayıtlı bir endpoint'i kaldırır.
- `push.web.test` — çağıranın aboneliğine bir test bildirimi gönderir.

<Note>
Web Push, iOS APNS relay yolundan (relay destekli push için bkz. [Yapılandırma](/tr/gateway/configuration)) ve yerel mobil eşlemeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Hosted embed'ler

Asistan iletileri, `[embed ...]` shortcode'u ile hosted web içeriğini satır içinde render edebilir. iframe sandbox ilkesi `gateway.controlUi.embedSandbox` tarafından denetlenir:

<Tabs>
  <Tab title="strict">
    Hosted embed'lerin içinde script çalıştırmayı devre dışı bırakır.
  </Tab>
  <Tab title="scripts (varsayılan)">
    Origin izolasyonunu korurken etkileşimli embed'lere izin verir; bu varsayılandır ve genellikle kendi kendine yeten tarayıcı oyunları/widget'ları için yeterlidir.
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
`trusted` değerini yalnızca gömülü belge gerçekten same-origin davranışına ihtiyaç duyduğunda kullanın. Çoğu agent tarafından oluşturulan oyun ve etkileşimli canvas için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` embed URL'leri varsayılan olarak engelli kalır. Bilerek `[embed url="https://..."]` ile üçüncü taraf sayfaları yüklemek istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Sohbet ileti genişliği

Gruplandırılmış sohbet iletileri okunabilir bir varsayılan max-width kullanır. Geniş monitör dağıtımları, paketli CSS'i yamalamadan `gateway.controlUi.chatMessageMaxWidth` ayarlayarak bunu geçersiz kılabilir:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Değer tarayıcıya ulaşmadan önce doğrulanır. Desteklenen değerler arasında `960px` veya `82%` gibi düz uzunluklar ve yüzdelerin yanı sıra kısıtlı `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` ve `fit-content(...)` genişlik ifadeleri bulunur.

## Tailnet erişimi (önerilir)

<Tabs>
  <Tab title="Entegre Tailscale Serve (tercih edilir)">
    Gateway'i loopback üzerinde tutun ve Tailscale Serve'ün HTTPS ile proxy'lemesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Varsayılan olarak Control UI/WebSocket Serve istekleri, `gateway.auth.allowTailscale` `true` olduğunda Tailscale kimlik başlıkları (`tailscale-user-login`) üzerinden kimlik doğrulayabilir. OpenClaw, `x-forwarded-for` adresini `tailscale whois` ile çözümleyip başlıkla eşleştirerek kimliği doğrular ve bunları yalnızca istek Tailscale'in `x-forwarded-*` başlıklarıyla local loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliği olan Control UI operatör oturumlarında bu doğrulanmış Serve yolu cihaz eşleme gidiş dönüşünü de atlar; cihazsız tarayıcılar ve node-role bağlantıları normal cihaz kontrollerini izlemeye devam eder. Serve trafiği için bile açık shared-secret kimlik bilgileri istemek istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu async Serve kimlik yolu için, aynı istemci IP'si ve auth scope için başarısız auth denemeleri rate-limit yazımlarından önce seri hale getirilir. Bu nedenle aynı tarayıcıdan gelen eşzamanlı hatalı yeniden denemeler, paralel yarışan iki düz uyuşmazlık yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Tokensız Serve auth, gateway host'unun güvenilir olduğunu varsayar. Bu host üzerinde güvenilmeyen yerel kod çalışabiliyorsa token/password auth gerektirin.
    </Warning>

  </Tab>
  <Tab title="Tailnet'e bağla + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sonra açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Eşleşen paylaşılan sırrı UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvensiz HTTP

Panoyu düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`), tarayıcı **güvenli olmayan bağlamda** çalışır ve WebCrypto'yu engeller. Varsayılan olarak OpenClaw, cihaz kimliği olmayan Kontrol UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost için güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Kontrol UI kimlik doğrulaması
- acil durum `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI'yi yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (Gateway ana makinesinde)

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

    - Güvenli olmayan HTTP bağlamlarında localhost Kontrol UI oturumlarının cihaz kimliği olmadan devam etmesine izin verir.
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
    `dangerouslyDisableDeviceAuth` Kontrol UI cihaz kimliği kontrollerini devre dışı bırakır ve ciddi bir güvenlik düşürmesidir. Acil kullanım sonrasında hızla geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Güvenilir proxy notu">
    - Başarılı trusted-proxy kimlik doğrulaması, **operatör** Kontrol UI oturumlarını cihaz kimliği olmadan kabul edebilir.
    - Bu, düğüm rolü Kontrol UI oturumlarını kapsamaz.
    - Aynı ana makine local loopback ters proxy'leri yine de trusted-proxy kimlik doğrulamasını karşılamaz; bkz. [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberliği için bkz. [Tailscale](/tr/gateway/tailscale).

## İçerik güvenliği ilkesi

Kontrol UI sıkı bir `img-src` ilkesiyle gelir: yalnızca **aynı kaynaklı** varlıklara, `data:` URL'lerine ve yerel olarak oluşturulmuş `blob:` URL'lerine izin verilir. Uzak `http(s)` ve protokol göreli görüntü URL'leri tarayıcı tarafından reddedilir ve ağ istekleri oluşturmaz.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görüntüler (örneğin `/avatars/<id>`) yine görüntülenir; UI'nin çekip yerel `blob:` URL'lerine dönüştürdüğü kimliği doğrulanmış avatar rotaları buna dahildir.
- Satır içi `data:image/...` URL'leri yine görüntülenir (protokol içi yükler için kullanışlıdır).
- Kontrol UI tarafından oluşturulan yerel `blob:` URL'leri yine görüntülenir.
- Kanal meta verileri tarafından yayılan uzak avatar URL'leri, Kontrol UI avatar yardımcılarında kaldırılır ve yerleşik logo/rozetle değiştirilir; böylece ele geçirilmiş veya kötü amaçlı bir kanal, operatör tarayıcısından keyfi uzak görüntü istekleri yapılmasını zorlayamaz.

Bu davranışı elde etmek için herhangi bir şeyi değiştirmeniz gerekmez — her zaman açıktır ve yapılandırılamaz.

## Avatar rota kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, Kontrol UI avatar uç noktası API'nin geri kalanıyla aynı Gateway belirtecini gerektirir:

- `GET /avatar/<agentId>` avatar görüntüsünü yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1` aynı kural kapsamında avatar meta verilerini döndürür.
- Her iki rotaya yapılan kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla eşleşir). Bu, aksi takdirde korunan ana makinelerde avatar rotasının aracı kimliğini sızdırmasını önler.
- Kontrol UI'nin kendisi, avatarları çekerken Gateway belirtecini bearer üst bilgisi olarak iletir ve görüntünün panolarda yine görüntülenmesi için kimliği doğrulanmış blob URL'leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan ana makinelerde önerilmez), Gateway'in geri kalanıyla uyumlu olarak avatar rotası da kimliği doğrulanmamış hale gelir.

## Yardımcı medya rota kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, yardımcı yerel medya önizlemeleri iki adımlı bir rota kullanır:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` normal Kontrol UI operatör kimlik doğrulamasını gerektirir. Tarayıcı, kullanılabilirliği kontrol ederken Gateway belirtecini bearer üst bilgisi olarak gönderir.
- Başarılı meta veri yanıtları, tam olarak o kaynak yoluyla kapsamlandırılmış kısa ömürlü bir `mediaTicket` içerir.
- Tarayıcıda görüntülenen görüntü, ses, video ve belge URL'leri etkin Gateway belirteci veya parola yerine `mediaTicket=<ticket>` kullanır. Bilet hızla sona erer ve farklı bir kaynağı yetkilendiremez.

Bu, yeniden kullanılabilir Gateway kimlik bilgilerini görünür medya URL'lerine koymadan normal medya görüntülemeyi tarayıcıya özgü medya öğeleriyle uyumlu tutar.

## UI'yi derleme

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

Ardından UI'yi Gateway WS URL'nize yönlendirin (örn. `ws://127.0.0.1:18789`).

## Hata ayıklama/test: geliştirme sunucusu + uzak Gateway

Kontrol UI statik dosyalardan oluşur; WebSocket hedefi yapılandırılabilir ve HTTP kaynağından farklı olabilir. Bu, Vite geliştirme sunucusunu yerelde, Gateway'i ise başka bir yerde çalıştırmak istediğinizde kullanışlıdır.

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

    İsteğe bağlı tek seferlik kimlik doğrulaması (gerekirse):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notlar">
    - `gatewayUrl` yüklemeden sonra localStorage içinde saklanır ve URL'den kaldırılır.
    - `gatewayUrl` üzerinden tam bir `ws://` veya `wss://` uç noktası geçirirseniz, tarayıcının sorgu dizesini doğru ayrıştırması için `gatewayUrl` değerini URL kodlamasından geçirin.
    - `token` mümkün olduğunca URL parçası (`#token=...`) üzerinden geçirilmelidir. Parçalar sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca yedek olarak kullanılır ve bootstrap sonrasında hemen kaldırılır.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında UI, yapılandırma veya ortam kimlik bilgilerine geri dönmez. `token` (veya `password`) değerini açıkça sağlayın. Açık kimlik bilgilerinin eksik olması hatadır.
    - Gateway TLS arkasındaysa (Tailscale Serve, HTTPS proxy vb.) `wss://` kullanın.
    - `gatewayUrl`, clickjacking'i önlemek için yalnızca üst düzey pencerede kabul edilir (gömülü olarak değil).
    - local loopback olmayan Kontrol UI dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça (tam kaynaklar olarak) ayarlamalıdır. Buna uzak geliştirme kurulumları da dahildir.
    - Gateway başlatması, etkin çalışma zamanı bağlama ve bağlantı noktasından `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel kaynakları ekleyebilir, ancak uzak tarayıcı kaynakları yine de açık girdiler gerektirir.
    - Sıkı denetlenen yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, herhangi bir tarayıcı kaynağına izin ver anlamına gelir; "kullandığım ana makine neyse onunla eşleştir" anlamına gelmez.
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
- [Sağlık Kontrolleri](/tr/gateway/health) — Gateway sağlık izleme
- [TUI](/tr/web/tui) — terminal kullanıcı arayüzü
- [WebChat](/tr/web/webchat) — tarayıcı tabanlı sohbet arayüzü
