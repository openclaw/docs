---
read_when:
    - Gateway’i bir tarayıcıdan çalıştırmak istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı kontrol kullanıcı arayüzü (sohbet, etkinlik, düğümler, yapılandırma)
title: Kontrol Arayüzü
x-i18n:
    generated_at: "2026-06-28T01:27:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc8b9675454d57bbfb6be10bb7ef94152a89a72c94affdf72be8c79cf14cbb08
    source_path: web/control-ui.md
    workflow: 16
---

Denetim UI, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfa uygulamasıdır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarlayın (örn. `/openclaw`)

Aynı portta **doğrudan Gateway WebSocket** ile konuşur.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenemezse önce Gateway'i başlatın: `openclaw gateway`.

Kimlik doğrulama WebSocket el sıkışması sırasında şunlar aracılığıyla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üstbilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir vekil kimlik üstbilgileri

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için bir token saklar; parolalar kalıcı olarak saklanmaz. İlk bağlantıda onboarding genellikle paylaşılan gizli anahtar kimlik doğrulaması için bir gateway token'ı oluşturur, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Denetim UI'ye yeni bir tarayıcıdan veya cihazdan bağlandığınızda Gateway genellikle **tek seferlik eşleştirme onayı** ister. Bu, yetkisiz erişimi önlemek için bir güvenlik önlemidir.

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

Tarayıcı, değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve onu okuma erişiminden yazma/yönetici erişimine değiştirirseniz bu, sessiz bir yeniden bağlanma değil, onay yükseltmesi olarak değerlendirilir. OpenClaw eski onayı etkin tutar, daha geniş kapsamlı yeniden bağlanmayı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

`openclaw_gateway` adaptörü üzerinden bağlanan Paperclip ajanları aynı ilk çalıştırma onay akışını kullanır. İlk bağlantı denemesinden sonra bekleyen isteği önizlemek için `openclaw devices approve --latest` çalıştırın, ardından onaylamak için yazdırılan `openclaw devices approve <requestId>` komutunu yeniden çalıştırın. Uzak bir gateway için açık `--url` ve `--token` değerleri geçirin. Onayları yeniden başlatmalar arasında kararlı tutmak için Paperclip'te her çalıştırmada yeni bir geçici cihaz kimliği oluşturmasına izin vermek yerine kalıcı bir `adapterConfig.devicePrivateKeyPem` yapılandırın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik olarak onaylanır.
- `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı cihaz kimliğini sunduğunda Tailscale Serve, Denetim UI operatör oturumları için eşleştirme gidiş dönüşünü atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği oluşturur; bu nedenle tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

</Note>

## Kişisel kimlik (tarayıcı yerelinde)

Denetim UI, paylaşılan oturumlarda atıf için giden mesajlara eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Tarayıcı depolamasında yaşar, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz mesajlardaki normal transkript yazarlığı meta verileri dışında diğer cihazlarla eşitlenmez veya sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya tarayıcı değiştirmek bunu boş hale sıfırlar.

Aynı tarayıcı yerelindeki desen, asistan avatarı geçersiz kılması için de geçerlidir. Yüklenen asistan avatarları, gateway tarafından çözümlenen kimliğin yalnızca yerel tarayıcıda üzerine bindirilir ve asla `config.patch` üzerinden gidip gelmez. Paylaşılan `ui.assistant.avatar` yapılandırma alanı, alanı doğrudan yazan UI dışı istemciler (betikli gateway'ler veya özel panolar gibi) için hâlâ kullanılabilir.

## Çalışma zamanı yapılandırma uç noktası

Denetim UI, çalışma zamanı ayarlarını gateway'in Denetim UI temel yoluna göre çözümlenen `/control-ui-config.json` dosyasından alır (örneğin UI `/__openclaw__/` altında sunulduğunda `/__openclaw__/control-ui-config.json`). Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar bunu alamaz ve başarılı bir alma işlemi ya zaten geçerli bir gateway token'ı/parolası, Tailscale Serve kimliği ya da güvenilir vekil kimliği gerektirir.

## Dil desteği

Denetim UI, ilk yüklemede tarayıcı yerel ayarınıza göre kendini yerelleştirebilir. Daha sonra geçersiz kılmak için **Genel Bakış -> Gateway Erişimi -> Dil** bölümünü açın. Yerel ayar seçici, Görünüm altında değil Gateway Erişimi kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışı çeviriler tarayıcıda tembel yüklenir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve sonraki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Doküman çevirileri aynı İngilizce dışı yerel ayar kümesi için oluşturulur, ancak doküman sitesinin yerleşik Mintlify dil seçicisi Mintlify'nin kabul ettiği yerel ayar kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) dokümanlar yayın reposunda yine de oluşturulur; Mintlify bu kodları destekleyene kadar bu seçicide görünmeyebilirler.

## Görünüm temaları

Görünüm paneli yerleşik Claw, Knot ve Dash temalarını, ayrıca bir tarayıcı yerelinde tweakcn içe aktarma yuvasını tutar. Bir tema içe aktarmak için [tweakcn düzenleyicisini](https://tweakcn.com/editor/theme) açın, bir tema seçin veya oluşturun, **Paylaş**'a tıklayın ve kopyalanan tema bağlantısını Görünüm'e yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` kayıt URL'lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi düzenleyici URL'lerini, göreli `/themes/<id>` yollarını, ham tema kimliklerini ve `amethyst-haze` gibi varsayılan tema adlarını kabul eder.

Görünüm ayrıca tarayıcı yerelinde bir Metin boyutu ayarı içerir. Ayar, Denetim UI tercihlerinin geri kalanıyla birlikte saklanır; sohbet metnine, oluşturucu metnine, araç kartlarına ve sohbet kenar çubuklarına uygulanır ve mobil Safari'nin odaklanınca otomatik yakınlaştırmaması için metin girişlerini en az 16px tutar.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde saklanır. Gateway yapılandırmasına yazılmaz ve cihazlar arasında eşitlenmez. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; temizlemek, içe aktarılan tema seçiliyse etkin temayı tekrar Claw'a geçirir.

## Neler yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Sohbet geçmişi yenilemeleri, mesaj başına metin sınırlarıyla sınırlı yakın dönem penceresi ister; böylece büyük oturumlar sohbet kullanılabilir hale gelmeden önce tarayıcıyı tam transkript yükünü işlemeye zorlamaz.
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden kısıtlı tek kullanımlık tarayıcı token'ı kullanır ve yalnızca arka uç gerçek zamanlı ses plugin'leri Gateway aktarma taşımasını kullanır. İstemciye ait sağlayıcı oturumları `talk.client.create` ile başlar; Gateway aktarma oturumları `talk.session.create` ile başlar. Aktarma, tarayıcı `talk.session.appendAudio` üzerinden mikrofon PCM'i akıtırken sağlayıcı kimlik bilgilerini Gateway'de tutar, Gateway ilkesi ve daha büyük yapılandırılmış OpenClaw modeli için `openclaw_agent_consult` sağlayıcı araç çağrılarını `talk.client.toolCall` üzerinden iletir ve etkin çalışma ses yönlendirmesini `talk.client.steer` veya `talk.session.steer` üzerinden yönlendirir.
    - Araç çağrılarını ve canlı araç çıktı kartlarını Sohbet içinde akıtın (ajan olayları).
    - Mevcut `session.tool` / araç olayı tesliminden canlı araç etkinliğinin tarayıcı yerelinde, önce redaksiyonlu özetlerini içeren Etkinlik sekmesi.

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, rüyalar">
    - Kanallar: yerleşik ve paketli/harici plugin kanallarının durumu, QR girişi ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`).
    - Kanal yoklaması yenilemeleri, yavaş sağlayıcı denetimleri bitene kadar önceki anlık görüntüyü görünür tutar ve bir yoklama veya denetim UI bütçesini aştığında kısmi anlık görüntüler etiketlenir.
    - Örnekler: varlık listesi + yenileme (`system-presence`).
    - Oturumlar: varsayılan olarak yapılandırılmış ajan oturumlarını listeleyin, eskimiş yapılandırılmamış ajan oturumu anahtarlarından geri dönün ve oturum başına model/thinking/fast/verbose/trace/reasoning geçersiz kılmalarını uygulayın (`sessions.list`, `sessions.patch`).
    - Rüyalar: Dreaming durumu, etkinleştirme/devre dışı bırakma düğmesi ve Rüya Günlüğü okuyucusu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, düğümler, exec onayları">
    - Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalışma geçmişi (`cron.*`).
    - Skills: durum, etkinleştir/devre dışı bırak, kur, API anahtarı güncellemeleri (`skills.*`).
    - Düğümler: liste + yetenekler (`node.list`).
    - Exec onayları: gateway veya düğüm izin listelerini düzenle + `exec host=gateway/node` için sorma ilkesi (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Yapılandırma">
    - `~/.openclaw/openclaw.json` dosyasını görüntüleyin/düzenleyin (`config.get`, `config.set`).
    - MCP, yapılandırılmış sunucular, etkinleştirme, OAuth/filtre/paralel özetleri, yaygın operatör komutları ve kapsamlı `mcp` yapılandırma düzenleyicisi için ayrılmış bir ayarlar sayfasına sahiptir.
    - Doğrulamayla uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazma işlemleri, eşzamanlı düzenlemelerin üzerine yazmayı önlemek için bir temel hash koruması içerir.
    - Yazma işlemleri (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma yükündeki ref'ler için etkin SecretRef çözümlemesini önceden denetler; çözümlenemeyen etkin gönderilmiş ref'ler yazmadan önce reddedilir.
    - Form kayıtları, kaydedilmiş gizli değerlere hâlâ eşlenen redakte edilmiş değerleri korurken kaydedilmiş yapılandırmadan geri yüklenemeyen eskimiş redakte edilmiş yer tutucuları atar.
    - Şema + form işleme (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, anlık alt özetler, iç içe nesne/joker/array/composition düğümlerinde doküman meta verileri ve mevcut olduğunda plugin + kanal şemaları dahil); Ham JSON düzenleyici yalnızca anlık görüntü güvenli bir ham gidiş dönüşe sahipse kullanılabilir.
    - Bir anlık görüntü ham metni güvenli şekilde gidiş dönüş yapamıyorsa Denetim UI, Form modunu zorunlu kılar ve o anlık görüntü için Ham modu devre dışı bırakır.
    - Ham JSON düzenleyicideki "Kaydedilene sıfırla", düzleştirilmiş bir anlık görüntüyü yeniden işlemek yerine ham olarak yazılmış şekli (biçimlendirme, yorumlar, `$include` düzeni) korur; böylece anlık görüntü güvenli şekilde gidiş dönüş yapabiliyorsa harici düzenlemeler sıfırlamadan sonra korunur.
    - Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizeye bozulmayı önlemek için form metin girişlerinde salt okunur işlenir.

  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/modeller anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Olay günlüğü, Denetim UI yenileme/RPC zamanlamalarını, yavaş sohbet/yapılandırma işleme zamanlamalarını ve tarayıcı bu PerformanceObserver giriş türlerini sunduğunda uzun animasyon kareleri veya uzun görevler için tarayıcı yanıt verebilirlik girdilerini içerir.
    - Günlükler: filtre/dışa aktarma ile gateway dosya günlüklerinin canlı kuyruğu (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla birlikte bir paket/git güncellemesi + yeniden başlatma çalıştır (`update.run`), ardından çalışan gateway sürümünü doğrulamak için yeniden bağlandıktan sonra `update.status` yokla.

  </Accordion>
  <Accordion title="Cron işleri panel notları">
    - Yalıtılmış işler için teslim varsayılan olarak özet duyurmaya ayarlanır. Yalnızca dahili çalıştırmalar istiyorsanız none seçeneğine geçebilirsiniz.
    - Duyurma seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) webhook URL'sine ayarlanmış olarak `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için webhook ve none teslim modları kullanılabilir.
    - Gelişmiş düzenleme denetimleri; çalıştırmadan sonra silme, ajan geçersiz kılmasını temizleme, cron exact/stagger seçenekleri, ajan model/düşünme geçersiz kılmaları ve en iyi çaba teslim anahtarlarını içerir.
    - Form doğrulaması, alan düzeyindeki hatalarla satır içindedir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Özel bir bearer token göndermek için `cron.webhookToken` değerini ayarlayın; atlanırsa webhook bir auth üstbilgisi olmadan gönderilir.
    - Kullanımdan kaldırılmış geri dönüş: `cron.webhook` içindeki `notify: true` değerine sahip saklanan eski işleri açık iş başına webhook veya tamamlama teslimine geçirmek için `openclaw doctor --fix` çalıştırın.

  </Accordion>
</AccordionGroup>

## MCP sayfası

Özel MCP sayfası, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucuları için bir operatör görünümüdür. MCP aktarımlarını kendisi başlatmaz; kayıtlı yapılandırmayı incelemek ve düzenlemek için bunu kullanın, ardından canlı sunucu kanıtına ihtiyaç duyduğunuzda `openclaw mcp doctor --probe` kullanın.

Tipik iş akışı:

1. Kenar çubuğundan **MCP** öğesini açın.
2. Toplam, etkin, OAuth ve filtrelenmiş sunucu sayıları için özet kartlarını kontrol edin.
3. Her sunucu satırında aktarım, etkinleştirme, kimlik doğrulama, filtreler, zaman aşımları ve komut ipuçlarını gözden geçirin.
4. Bir sunucu yapılandırılmış kalmalı ancak çalışma zamanı keşfinin dışında tutulmalıysa etkinleştirmeyi değiştirin.
5. Sunucu tanımları, üstbilgiler, TLS/mTLS yolları, OAuth meta verileri, araç filtreleri ve Codex projeksiyon meta verileri için kapsamlı `mcp` yapılandırma bölümünü düzenleyin.
6. Yapılandırma yazımı için **Kaydet** öğesini veya çalışan Gateway değiştirilen yapılandırmayı uygulamalıysa **Kaydet ve Yayımla** öğesini kullanın.
7. Düzenlenen süreç statik tanılama, canlı kanıt veya önbelleğe alınmış çalışma zamanı temizliği gerektirdiğinde bir terminalden `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` veya `openclaw mcp reload` çalıştırın.

Sayfa, kimlik bilgisi taşıyan URL benzeri değerleri işlemeden önce redakte eder ve komut parçacıklarında sunucu adlarını tırnak içine alır; böylece kopyalanan komutlar boşluklar veya shell meta karakterleriyle de çalışır. Tam CLI ve yapılandırma başvurusu [MCP](/tr/cli/mcp) içinde yer alır.

## Etkinlik sekmesi

Etkinlik sekmesi, canlı araç etkinliği için geçici ve tarayıcıya yerel bir gözlemcidir. Chat araç kartlarını besleyen aynı Gateway `session.tool` / araç olay akışından türetilir; başka bir Gateway olay ailesi, uç nokta, kalıcı etkinlik deposu, metrik akışı veya harici gözlemci akışı eklemez.

Etkinlik girdileri yalnızca temizlenmiş özetleri ve redakte edilmiş, kısaltılmış çıktı önizlemelerini tutar. Araç argüman değerleri Etkinlik durumunda saklanmaz; UI, argümanların gizlendiğini gösterir ve yalnızca argüman alanı sayısını kaydeder. Bellek içi liste geçerli tarayıcı sekmesini izler, Control UI içinde gezinme sırasında korunur ve sayfa yeniden yüklendiğinde, oturum değiştirildiğinde veya **Temizle** kullanıldığında sıfırlanır.

## Chat davranışı

<AccordionGroup>
  <Accordion title="Gönderme ve geçmiş semantiği">
    - `chat.send` **engellemesizdir**: `{ runId, status: "started" }` ile hemen onay döner ve yanıt `chat` olayları üzerinden akış halinde gelir. Güvenilen Denetim Arayüzü istemcileri yerel tanılama için isteğe bağlı ACK zamanlama meta verileri de alabilir.
    - Sohbet yüklemeleri görüntüleri ve video olmayan dosyaları kabul eder. Görüntüler yerel görüntü yolunu korur; diğer dosyalar yönetilen medya olarak saklanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden göndermek, çalışırken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları UI güvenliği için boyutla sınırlıdır. Döküm girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır meta veri bloklarını atlayabilir ve aşırı büyük iletileri bir yer tutucuyla (`[chat.history omitted: message too large]`) değiştirebilir.
    - Görünür bir asistan iletisi `chat.history` içinde kısaltıldığında, yan okuyucu tam görüntüleme-normalleştirilmiş döküm girdisini gerektiğinde `sessionKey`, gerektiğinde etkin `agentId` ve döküm `messageId` ile `chat.message.get` üzerinden alabilir. Gateway yine daha fazlasını döndüremiyorsa okuyucu, kısaltılmış önizlemeyi sessizce tekrarlamak yerine açık bir kullanılamaz durumu gösterir.
    - Asistan/üretilmiş görüntüler yönetilen medya referansları olarak kalıcı hale getirilir ve kimliği doğrulanmış Gateway medya URL'leri üzerinden geri sunulur; böylece yeniden yüklemeler, ham base64 görüntü yüklerinin sohbet geçmişi yanıtında kalmasına bağlı olmaz.
    - `chat.history` işlenirken Denetim Arayüzü, görünür asistan metninden yalnızca görüntülemeye yönelik satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil), sızmış ASCII/tam genişlikli model kontrol tokenlarını kaldırır ve görünür metninin tamamı yalnızca tam sessiz token `NO_REPLY` / `no_reply` veya Heartbeat onay tokenı `HEARTBEAT_OK` olan asistan girdilerini atlar.
    - Etkin bir gönderim sırasında ve son geçmiş yenilemesinde, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürürse sohbet görünümü yerel iyimser kullanıcı/asistan iletilerini görünür tutar; Gateway geçmişi yetiştiğinde kanonik döküm bu yerel iletilerin yerini alır.
    - Canlı `chat` olayları teslim durumudur; `chat.history` ise kalıcı oturum dökümünden yeniden oluşturulur. Araç-son olaylarından sonra Denetim Arayüzü geçmişi yeniden yükler ve yalnızca küçük bir iyimser kuyruğu birleştirir; döküm sınırı [WebChat](/tr/web/webchat) içinde belgelenmiştir.
    - `chat.inject`, oturum dökümüne bir asistan notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (ajan çalıştırması yok, kanal teslimi yok).
    - Sohbet başlığı, oturum seçiciden önce ajan filtresini gösterir ve oturum seçici seçili ajana göre kapsamlandırılır. Ajan değiştirmek yalnızca o ajana bağlı oturumları gösterir ve henüz kayıtlı pano oturumları yoksa o ajanın ana oturumuna geri döner.
    - Masaüstü genişliklerinde sohbet denetimleri tek bir kompakt satırda kalır ve dökümde aşağı kaydırılırken daralır; yukarı kaydırmak, en üste dönmek veya en alta ulaşmak denetimleri geri getirir.
    - Ardışık yinelenen yalnızca metin iletileri, sayı rozeti olan tek bir balon olarak işlenir. Görüntü, ek, araç çıktısı veya tuval önizlemesi taşıyan iletiler daraltılmaz.
    - Sohbet başlığı model ve düşünme seçicileri, etkin oturumu `sessions.patch` üzerinden hemen yamalar; bunlar tek turla sınırlı gönderim seçenekleri değil, kalıcı oturum geçersiz kılmalarıdır.
    - Aynı oturum için bir model seçici değişikliği hâlâ kaydedilirken ileti gönderirseniz besteci, `chat.send` çağırmadan önce bu oturum yamasını bekler; böylece gönderim seçili modeli kullanır.
    - Denetim Arayüzü'nde `/new` yazmak, `session.dmScope: "main"` yapılandırılmış ve geçerli üst öğe ajanın ana oturumu olmadığı sürece Yeni Sohbet ile aynı yeni pano oturumunu oluşturur ve ona geçer; bu durumda ana oturumu yerinde sıfırlar. `/reset` yazmak, Gateway'in geçerli oturum için açık yerinde sıfırlamasını korur.
    - Sohbet model seçici Gateway'in yapılandırılmış model görünümünü ister. `agents.defaults.models` varsa, `provider/*` girdileri dahil olmak üzere seçiciyi bu izin listesi yönlendirir ve sağlayıcı kapsamlı katalogları dinamik tutar. Aksi halde seçici, açık `models.providers.*.models` girdilerini ve kullanılabilir kimlik doğrulaması olan sağlayıcıları gösterir. Tam katalog, hata ayıklama `models.list` RPC'si üzerinden `view: "all"` ile kullanılabilir kalır.
    - Yeni Gateway oturum kullanım raporları geçerli bağlam tokenlarını içerdiğinde, sohbet besteci alanı kompakt bir bağlam kullanım göstergesi gösterir. Yüksek bağlam baskısında uyarı stiline geçer ve önerilen Compaction düzeylerinde normal oturum Compaction yolunu çalıştıran kompakt bir düğme gösterir. Eski token anlık görüntüleri, Gateway yeniden güncel kullanım bildirene kadar gizlenir.

  </Accordion>
  <Accordion title="Konuşma modu (tarayıcı gerçek zamanlı)">
    Konuşma modu kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. OpenAI'yi `talk.realtime.provider: "openai"` ile birlikte bir `openai` API anahtarı kimlik doğrulama profili, `talk.realtime.providers.openai.apiKey` veya `OPENAI_API_KEY` ile yapılandırın; OpenAI OAuth profilleri Realtime sesi yapılandırmaz. Google'ı `talk.realtime.provider: "google"` ile birlikte `talk.realtime.providers.google.apiKey` ile yapılandırın. Tarayıcı hiçbir zaman standart bir sağlayıcı API anahtarı almaz. OpenAI, WebRTC için geçici bir Realtime istemci sırrı alır. Google Live, tarayıcı WebSocket oturumu için tek kullanımlık, kısıtlı bir Live API kimlik doğrulama tokenı alır; yönergeler ve araç bildirimleri Gateway tarafından tokena kilitlenir. Yalnızca arka uç gerçek zamanlı köprüsü sunan sağlayıcılar Gateway aktarma taşıması üzerinden çalışır; böylece kimlik bilgileri ve satıcı soketleri sunucu tarafında kalırken tarayıcı sesi kimliği doğrulanmış Gateway RPC'leri üzerinden taşınır. Realtime oturum istemi Gateway tarafından birleştirilir; `talk.client.create` çağıran tarafından sağlanan yönerge geçersiz kılmalarını kabul etmez.

    Sohbet bestecisi, Konuşma başlat/durdur düğmesinin yanında bir Konuşma seçenekleri düğmesi içerir. Seçenekler bir sonraki Konuşma oturumuna uygulanır ve sağlayıcı, taşıma, model, ses, akıl yürütme çabası, VAD eşiği, sessizlik süresi ve önek dolgusu değerlerini geçersiz kılabilir. Bir seçenek boş olduğunda Gateway, varsa yapılandırılmış varsayılanları veya sağlayıcı varsayılanını kullanır. Gateway aktarmasını seçmek arka uç aktarma yolunu zorlar; WebRTC seçmek oturumu istemci sahipliğinde tutar ve sağlayıcı bir tarayıcı oturumu oluşturamıyorsa sessizce aktarmaya geri dönmek yerine başarısız olur.

    Sohbet bestecisinde Konuşma denetimi, mikrofon dikte düğmesinin yanındaki dalgalar düğmesidir. Konuşma başladığında besteci durum satırı önce `Connecting Talk...`, ses bağlıyken `Talk live` veya gerçek zamanlı bir araç çağrısı yapılandırılmış daha büyük modele `talk.client.toolCall` üzerinden danışırken `Asking OpenClaw...` gösterir.

    Bakımcı canlı duman testi: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`, OpenAI arka uç WebSocket köprüsünü, OpenAI tarayıcı WebRTC SDP değişimini, Google Live kısıtlı-token tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway aktarma tarayıcı bağdaştırıcısını doğrular. Komut yalnızca sağlayıcı durumunu yazdırır ve sırları günlüğe kaydetmez.

  </Accordion>
  <Accordion title="Durdurma ve iptal">
    - **Durdur**'a tıklayın (`chat.abort` çağırır).
    - Bir çalıştırma etkinken normal takip iletileri kuyruğa alınır. Kuyruktaki bir iletide **Yönlendir**'e tıklayarak bu takip iletisini çalışan tura enjekte edin.
    - Bant dışı iptal etmek için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi tek başına iptal ifadeleri).
    - `chat.abort`, o oturum için tüm etkin çalıştırmaları iptal etmek üzere `{ sessionKey }` destekler (`runId` olmadan).

  </Accordion>
  <Accordion title="İptal kısmi tutma">
    - Bir çalıştırma iptal edildiğinde, kısmi asistan metni UI içinde yine de gösterilebilir.
    - Gateway, arabelleğe alınmış çıktı varsa iptal edilmiş kısmi asistan metnini döküm geçmişine kalıcı hale getirir.
    - Kalıcı girdiler iptal meta verileri içerir; böylece döküm tüketicileri iptal kısımlarını normal tamamlama çıktısından ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve web push

Denetim Arayüzü bir `manifest.webmanifest` ve bir service worker ile gelir; bu nedenle modern tarayıcılar onu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık olmasa bile Gateway'in kurulu PWA'yı bildirimlerle uyandırmasını sağlar.

Sayfa bir OpenClaw güncellemesinin hemen ardından **Protokol uyumsuzluğu** gösterirse önce panoyu `openclaw dashboard` ile yeniden açın ve sayfayı tam yenileyin. Hâlâ başarısız olursa pano kaynağı için site verilerini temizleyin veya özel bir tarayıcı penceresinde test edin; eski bir sekme veya tarayıcı service worker önbelleği, güncelleme öncesi Denetim Arayüzü paketini daha yeni Gateway'e karşı çalıştırmaya devam edebilir.

| Yüzey                                                 | Ne yapar                                                          |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | PWA manifest'i. Erişilebilir olduğunda tarayıcılar "Uygulamayı yükle" seçeneğini sunar. |
| `ui/public/sw.js`                                     | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw durum dizini altında) | Web Push yüklerini imzalamak için kullanılan otomatik oluşturulmuş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                    | Kalıcı hale getirilmiş tarayıcı abonelik uç noktaları.             |

Anahtarları sabitlemek istediğinizde (çok ana makineli dağıtımlar, secret rotasyonu veya testler için) Gateway sürecinde env vars üzerinden VAPID anahtar çiftini geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılanı `https://openclaw.ai`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için bu kapsam kapılı Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID genel anahtarını getirir.
- `push.web.subscribe` — bir `endpoint` ile `keys.p256dh`/`keys.auth` kaydeder.
- `push.web.unsubscribe` — kayıtlı bir uç noktayı kaldırır.
- `push.web.test` — çağıranın aboneliğine test bildirimi gönderir.

<Note>
Web Push, iOS APNS relay yolundan (relay destekli push için bkz. [Yapılandırma](/tr/gateway/configuration)) ve yerel mobil eşleştirmeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Barındırılan gömmeler

Asistan mesajları, `[embed ...]` shortcode'u ile barındırılan web içeriğini satır içinde işleyebilir. iframe sandbox ilkesi `gateway.controlUi.embedSandbox` tarafından kontrol edilir:

<Tabs>
  <Tab title="strict">
    Barındırılan gömmeler içinde betik yürütmeyi devre dışı bırakır.
  </Tab>
  <Tab title="scripts (default)">
    Kaynak izolasyonunu korurken etkileşimli gömmelere izin verir; bu varsayılandır ve genellikle kendi kendine yeterli tarayıcı oyunları/widget'ları için yeterlidir.
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
`trusted` değerini yalnızca gömülü belge gerçekten aynı kaynak davranışına ihtiyaç duyduğunda kullanın. Çoğu ajan tarafından oluşturulan oyun ve etkileşimli canvas için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` gömme URL'leri varsayılan olarak engelli kalır. Bilerek `[embed url="https://..."]` öğesinin üçüncü taraf sayfaları yüklemesini istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Sohbet mesajı genişliği

Gruplanmış sohbet mesajları okunabilir bir varsayılan azami genişlik kullanır. Geniş monitör dağıtımları, paketlenmiş CSS'ye yama yapmadan `gateway.controlUi.chatMessageMaxWidth` ayarlayarak bunu geçersiz kılabilir:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Değer tarayıcıya ulaşmadan önce doğrulanır. Desteklenen değerler arasında `960px` veya `82%` gibi düz uzunluklar ve yüzdelerin yanı sıra sınırlandırılmış `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` ve `fit-content(...)` genişlik ifadeleri bulunur.

## Tailnet erişimi (önerilir)

<Tabs>
  <Tab title="Entegre Tailscale Serve (tercih edilir)">
    Gateway'i loopback üzerinde tutun ve Tailscale Serve'ün bunu HTTPS ile proxy'lemesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath`)

    Varsayılan olarak, Control UI/WebSocket Serve istekleri `gateway.auth.allowTailscale` `true` olduğunda Tailscale kimlik başlıkları (`tailscale-user-login`) üzerinden kimlik doğrulayabilir. OpenClaw kimliği, `x-forwarded-for` adresini `tailscale whois` ile çözümleyip başlıkla eşleştirerek doğrular ve bunları yalnızca istek Tailscale'in `x-forwarded-*` başlıklarıyla loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliğine sahip Control UI operatör oturumları için bu doğrulanmış Serve yolu ayrıca cihaz eşleştirme gidiş dönüşünü atlar; cihazsız tarayıcılar ve node rolü bağlantıları normal cihaz kontrollerini izlemeye devam eder. Serve trafiği için bile açık paylaşılan secret kimlik bilgileri gerektirmek istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu async Serve kimlik yolu için aynı istemci IP'si ve auth kapsamına ait başarısız auth denemeleri, rate-limit yazımlarından önce seri hale getirilir. Bu nedenle aynı tarayıcıdan gelen eşzamanlı kötü yeniden denemeler, paralel yarışan iki düz uyuşmazlık yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Token'sız Serve auth, gateway ana makinesinin güvenilir olduğunu varsayar. Güvenilmeyen yerel kod bu ana makinede çalışabiliyorsa token/password auth gerektirin.
    </Warning>

  </Tab>
  <Tab title="Tailnet'e bağla + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sonra açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath`)

    Eşleşen paylaşılan secret'ı UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvensiz HTTP

Panoyu düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`), tarayıcı **güvenli olmayan bağlamda** çalışır ve WebCrypto'yu engeller. Varsayılan olarak OpenClaw, cihaz kimliği olmayan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Control UI auth
- acil durum `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI'yi yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway ana makinesinde)

<AccordionGroup>
  <Accordion title="Güvensiz auth anahtarı davranışı">
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

    - Localhost Control UI oturumlarının güvenli olmayan HTTP bağlamlarında cihaz kimliği olmadan devam etmesine izin verir.
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
    `dangerouslyDisableDeviceAuth`, Control UI cihaz kimliği kontrollerini devre dışı bırakır ve ciddi bir güvenlik düşürmesidir. Acil kullanım sonrasında hızla geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy notu">
    - Başarılı trusted-proxy auth, **operatör** Control UI oturumlarını cihaz kimliği olmadan kabul edebilir.
    - Bu, node rolü Control UI oturumlarına genişletilmez.
    - Aynı ana makinedeki loopback ters proxy'leri yine de trusted-proxy auth koşullarını karşılamaz; bkz. [Güvenilir proxy auth](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberi için bkz. [Tailscale](/tr/gateway/tailscale).

## Content security policy

Control UI sıkı bir `img-src` ilkesiyle gelir: yalnızca **same-origin** varlıklar, `data:` URL'leri ve yerel olarak oluşturulan `blob:` URL'lerine izin verilir. Uzak `http(s)` ve protokol göreli görüntü URL'leri tarayıcı tarafından reddedilir ve ağ getirme istekleri oluşturmaz.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görüntüler (örneğin `/avatars/<id>`), UI'nin getirip yerel `blob:` URL'lerine dönüştürdüğü kimlik doğrulamalı avatar rotaları dahil, işlenmeye devam eder.
- Satır içi `data:image/...` URL'leri işlenmeye devam eder (protokol içi yükler için kullanışlıdır).
- Control UI tarafından oluşturulan yerel `blob:` URL'leri işlenmeye devam eder.
- Kanal metadata'sı tarafından yayılan uzak avatar URL'leri Control UI'nin avatar yardımcılarında temizlenir ve yerleşik logo/rozet ile değiştirilir; böylece ele geçirilmiş veya kötü amaçlı bir kanal, operatör tarayıcısından keyfi uzak görüntü getirmelerini zorlayamaz.

Bu davranışı elde etmek için hiçbir şeyi değiştirmeniz gerekmez — her zaman açıktır ve yapılandırılamaz.

## Avatar rota auth

Gateway auth yapılandırıldığında, Control UI avatar uç noktası API'nin geri kalanıyla aynı gateway token'ını gerektirir:

- `GET /avatar/<agentId>` avatar görüntüsünü yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1` aynı kural altında avatar metadata'sını döndürür.
- Her iki rotaya yapılan kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla eşleşir). Bu, avatar rotasının aksi halde korunan ana makinelerde ajan kimliğini sızdırmasını önler.
- Control UI avatarları getirirken gateway token'ını bearer başlığı olarak iletir ve görüntünün panolarda yine de işlenmesi için kimliği doğrulanmış blob URL'leri kullanır.

Gateway auth'u devre dışı bırakırsanız (paylaşılan ana makinelerde önerilmez), gateway'in geri kalanıyla uyumlu olarak avatar rotası da kimlik doğrulamasız hale gelir.

## Asistan medya rota auth

Gateway auth yapılandırıldığında, asistan yerel medya önizlemeleri iki adımlı bir rota kullanır:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` normal Control UI operatör auth'u gerektirir. Tarayıcı, kullanılabilirliği denetlerken gateway token'ını bearer başlığı olarak gönderir.
- Başarılı metadata yanıtları, tam olarak bu kaynak yoluna kapsamlanmış kısa ömürlü bir `mediaTicket` içerir.
- Tarayıcıda işlenen görüntü, ses, video ve belge URL'leri etkin gateway token'ı veya password yerine `mediaTicket=<ticket>` kullanır. Bilet hızla sona erer ve farklı bir kaynak için yetki veremez.

Bu, yeniden kullanılabilir gateway kimlik bilgilerini görünür medya URL'lerine koymadan normal medya işlemeyi tarayıcı yerel medya öğeleriyle uyumlu tutar.

## UI'yi derleme

Gateway statik dosyaları `dist/control-ui` konumundan sunar. Bunları şu komutla derleyin:

```bash
pnpm ui:build
```

İsteğe bağlı mutlak taban (sabit varlık URL'leri istediğinizde):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Yerel geliştirme için (ayrı dev sunucusu):

```bash
pnpm ui:dev
```

Ardından UI'yi Gateway WS URL'nize yönlendirin (örn. `ws://127.0.0.1:18789`).

## Boş Control UI sayfası

Tarayıcı boş bir pano yüklerse ve DevTools yararlı bir hata göstermezse, bir eklenti veya erken content script JavaScript modül uygulamasının değerlendirilmesini engellemiş olabilir. Statik sayfa, başlangıçtan sonra `<openclaw-app>` kaydedilmediğinde görünen düz HTML kurtarma paneli içerir.

Tarayıcı ortamını değiştirdikten sonra panelin **Tekrar dene** eylemini kullanın veya bu kontrollerden sonra elle yeniden yükleyin:

- Tüm sayfalara enjekte olan eklentileri, özellikle `<all_urls>` content script'lerine sahip eklentileri devre dışı bırakın.
- Gizli pencere, temiz bir tarayıcı profili veya başka bir tarayıcı deneyin.
- Gateway'i çalışır durumda tutun ve tarayıcı değişikliğinden sonra aynı pano URL'sini doğrulayın.

## Hata ayıklama/test: dev sunucusu + uzak Gateway

Control UI statik dosyalardan oluşur; WebSocket hedefi yapılandırılabilir ve HTTP origin'den farklı olabilir. Bu, Vite dev sunucusunu yerel olarak kullanıp Gateway'i başka yerde çalıştırmak istediğinizde kullanışlıdır.

<Steps>
  <Step title="UI dev sunucusunu başlat">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="gatewayUrl ile aç">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    İsteğe bağlı tek seferlik auth (gerekirse):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notlar">
    - `gatewayUrl`, yüklemeden sonra localStorage içinde saklanır ve URL'den kaldırılır.
    - `gatewayUrl` aracılığıyla tam bir `ws://` veya `wss://` uç noktası geçirirseniz, tarayıcının sorgu dizesini doğru ayrıştırması için `gatewayUrl` değerini URL kodlamasından geçirin.
    - `token`, mümkün olduğunda URL parçası (`#token=...`) üzerinden geçirilmelidir. Parçalar sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca yedek olarak kullanılır ve bootstrap işleminden hemen sonra kaldırılır.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında, kullanıcı arayüzü yapılandırma veya ortam kimlik bilgilerine geri dönmez. `token` (veya `password`) değerini açıkça sağlayın. Açık kimlik bilgilerinin eksik olması bir hatadır.
    - Gateway TLS arkasındayken (Tailscale Serve, HTTPS proxy vb.) `wss://` kullanın.
    - `gatewayUrl`, clickjacking'i önlemek için yalnızca üst düzey bir pencerede kabul edilir (gömülü olarak değil).
    - Herkese açık, loopback olmayan Denetim Kullanıcı Arayüzü dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça (tam origin'ler) ayarlamalıdır. Loopback, RFC1918/link-local, `.local`, `.ts.net` veya Tailscale CGNAT host'larından gelen özel aynı origin LAN/Tailnet yüklemeleri, Host üst bilgisi yedeği etkinleştirilmeden kabul edilir.
    - Gateway başlangıcı, etkin çalışma zamanı bind ve port değerinden `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel origin'leri ekleyebilir, ancak uzak tarayıcı origin'leri yine de açık girdiler gerektirir.
    - Sıkı denetimli yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, "kullandığım host ile eşleştir" değil, herhangi bir tarayıcı origin'ine izin ver anlamına gelir.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`, Host üst bilgisi origin yedek modunu etkinleştirir, ancak bu tehlikeli bir güvenlik modudur.

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
- [Sağlık Denetimleri](/tr/gateway/health) — gateway sağlık izleme
- [TUI](/tr/web/tui) — terminal kullanıcı arayüzü
- [WebChat](/tr/web/webchat) — tarayıcı tabanlı sohbet arayüzü
