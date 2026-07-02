---
read_when:
    - Gateway'i bir tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı kontrol kullanıcı arayüzü (sohbet, etkinlik, düğümler, yapılandırma)
title: Kontrol Arayüzü
x-i18n:
    generated_at: "2026-07-02T01:11:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 643249e6857cc1a32302f5139fcf89d46e01127f741f31efd36db4a6c60ef7b7
    source_path: web/control-ui.md
    workflow: 16
---

Control UI, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfalı uygulamadır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarını belirleyin (örn. `/openclaw`)

Aynı bağlantı noktasında **doğrudan Gateway WebSocket** ile konuşur.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenmezse önce Gateway'i başlatın: `openclaw gateway`.

<Note>
Yerel Windows LAN bağlamalarında, Windows Güvenlik Duvarı veya kuruluş tarafından yönetilen Grup İlkesi, Gateway ana makinesinde `127.0.0.1` çalışsa bile duyurulan LAN URL'sini yine de engelleyebilir. Windows ana makinesinde `openclaw gateway status --deep` çalıştırın; muhtemelen engellenmiş bağlantı noktalarını, profil uyumsuzluklarını ve ilkenin yok sayabileceği yerel güvenlik duvarı kurallarını bildirir.
</Note>

Kimlik doğrulama WebSocket el sıkışması sırasında şunlar aracılığıyla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik başlıkları
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir proxy kimlik başlıkları

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için bir token tutar; parolalar kalıcı olarak saklanmaz. İlk bağlantıda onboarding genellikle paylaşılan gizli anahtar kimlik doğrulaması için bir gateway token'ı oluşturur, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Control UI'ye yeni bir tarayıcıdan veya cihazdan bağlandığınızda Gateway genellikle **tek seferlik eşleştirme onayı** ister. Bu, yetkisiz erişimi önlemeye yönelik bir güvenlik önlemidir.

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

Tarayıcı değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) eşleştirmeyi yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve onu okuma erişiminden yazma/yönetici erişimine değiştirirseniz, bu sessiz bir yeniden bağlanma değil, onay yükseltmesi olarak değerlendirilir. OpenClaw eski onayı etkin tutar, daha geniş kapsamlı yeniden bağlanmayı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

`openclaw_gateway` adaptörü üzerinden bağlanan Paperclip aracıları aynı ilk çalıştırma onay akışını kullanır. İlk bağlantı denemesinden sonra bekleyen isteği önizlemek için `openclaw devices approve --latest` çalıştırın, ardından onaylamak için yazdırılan `openclaw devices approve <requestId>` komutunu yeniden çalıştırın. Uzak bir gateway için açık `--url` ve `--token` değerleri geçirin. Yeniden başlatmalar arasında onayları kararlı tutmak için Paperclip'in her çalıştırmada yeni bir geçici cihaz kimliği oluşturmasına izin vermek yerine kalıcı bir `adapterConfig.devicePrivateKeyPem` yapılandırın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik onaylanır.
- `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı cihaz kimliğini sunduğunda Tailscale Serve, Control UI operatör oturumları için eşleştirme turunu atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri hâlâ açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği oluşturur; bu nedenle tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

</Note>

## Kişisel kimlik (tarayıcı yerelinde)

Control UI, paylaşılan oturumlarda atıf için giden iletilere eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Bu kimlik tarayıcı depolamasında yaşar, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz iletilerdeki normal transkript yazarlığı meta verileri dışında diğer cihazlarla eşitlenmez veya sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya tarayıcı değiştirmek bunu boş değere sıfırlar.

Aynı tarayıcı yereli kalıp, asistan avatarı geçersiz kılması için de geçerlidir. Yüklenen asistan avatarları, gateway tarafından çözümlenen kimliği yalnızca yerel tarayıcıda kaplar ve asla `config.patch` üzerinden gidiş dönüş yapmaz. Paylaşılan `ui.assistant.avatar` yapılandırma alanı, alanı doğrudan yazan UI dışı istemciler (betikli gateway'ler veya özel panolar gibi) için hâlâ kullanılabilir.

## Çalışma zamanı yapılandırma uç noktası

Control UI, çalışma zamanı ayarlarını gateway'in Control UI temel yoluna göre çözümlenen `/control-ui-config.json` üzerinden alır (örneğin UI `/__openclaw__/` altında sunulduğunda `/__openclaw__/control-ui-config.json`). Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı gateway kimlik doğrulaması tarafından korunur: kimliği doğrulanmamış tarayıcılar bunu alamaz ve başarılı bir alma işlemi için zaten geçerli bir gateway token'ı/parolası, Tailscale Serve kimliği veya güvenilir proxy kimliği gerekir.

## Dil desteği

Control UI, ilk yüklemede tarayıcı yerel ayarınıza göre kendini yerelleştirebilir. Daha sonra geçersiz kılmak için **Genel Bakış -> Gateway Erişimi -> Dil** bölümünü açın. Yerel ayar seçici, Görünüm altında değil Gateway Erişimi kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışındaki çeviriler tarayıcıda geç yüklenir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve gelecekteki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Docs çevirileri aynı İngilizce dışı yerel ayar kümesi için oluşturulur, ancak docs sitesinin yerleşik Mintlify dil seçicisi Mintlify'nin kabul ettiği yerel ayar kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) docs hâlâ yayın reposunda oluşturulur; Mintlify bu kodları destekleyene kadar bu seçicide görünmeyebilirler.

## Görünüm temaları

Görünüm paneli, yerleşik Claw, Knot ve Dash temalarını ve ayrıca bir tarayıcı yereli tweakcn içe aktarma yuvasını tutar. Bir tema içe aktarmak için [tweakcn düzenleyicisini](https://tweakcn.com/editor/theme) açın, bir tema seçin veya oluşturun, **Paylaş** düğmesine tıklayın ve kopyalanan tema bağlantısını Görünüm'e yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` kayıt URL'lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi düzenleyici URL'lerini, göreli `/themes/<id>` yollarını, ham tema kimliklerini ve `amethyst-haze` gibi varsayılan tema adlarını da kabul eder.

Görünüm ayrıca tarayıcı yereli Metin boyutu ayarını içerir. Ayar, Control UI tercihlerin geri kalanıyla birlikte saklanır; sohbet metnine, oluşturucu metnine, araç kartlarına ve sohbet kenar çubuklarına uygulanır ve mobil Safari'nin odakta otomatik yakınlaştırma yapmaması için metin girişlerini en az 16px tutar.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde saklanır. Gateway yapılandırmasına yazılmaz ve cihazlar arasında eşitlenmez. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; temizlemek, içe aktarılan tema seçiliyse etkin temayı tekrar Claw'a geçirir.

## Neler yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Sohbet geçmişi yenilemeleri, sohbet kullanılabilir hâle gelmeden önce büyük oturumların tarayıcıyı tam transkript yükünü işlemeye zorlamaması için ileti başına metin sınırlarıyla sınırlı yakın tarihli bir pencere ister.
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden kısıtlı tek kullanımlık bir tarayıcı token'ı kullanır ve yalnızca arka uç gerçek zamanlı ses plugin'leri Gateway aktarma taşımasını kullanır. İstemciye ait sağlayıcı oturumları `talk.client.create` ile başlar; Gateway aktarma oturumları `talk.session.create` ile başlar. Aktarma, tarayıcı `talk.session.appendAudio` üzerinden mikrofon PCM'i akıtırken sağlayıcı kimlik bilgilerini Gateway üzerinde tutar, Gateway politikası ve daha büyük yapılandırılmış OpenClaw modeli için `openclaw_agent_consult` sağlayıcı araç çağrılarını `talk.client.toolCall` üzerinden iletir ve etkin çalışma ses yönlendirmesini `talk.client.steer` veya `talk.session.steer` üzerinden yönlendirir.
    - Sohbet'te araç çağrılarını + canlı araç çıktı kartlarını akıtın (aracı olayları).
    - Mevcut `session.tool` / araç olayı tesliminden gelen canlı araç etkinliğinin tarayıcı yerelinde, önce redaksiyon odaklı özetlerini içeren Etkinlik sekmesi.

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, rüyalar">
    - Kanallar: yerleşik ve paketlenmiş/harici plugin kanalları durumu, QR girişi ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`).
    - Kanal yoklama yenilemeleri, yavaş sağlayıcı denetimleri bitene kadar önceki anlık görüntüyü görünür tutar ve bir yoklama veya denetim UI bütçesini aştığında kısmi anlık görüntüler etiketlenir.
    - Örnekler: varlık listesi + yenileme (`system-presence`).
    - Oturumlar: varsayılan olarak yapılandırılmış aracı oturumlarını listeleyin, eski yapılandırılmamış aracı oturum anahtarlarından geri dönün ve oturum başına model/düşünme/hızlı/ayrıntılı/iz/reasoning geçersiz kılmalarını uygulayın (`sessions.list`, `sessions.patch`).
    - Rüyalar: dreaming durumu, etkinleştir/devre dışı bırak anahtarı ve Dream Diary okuyucusu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, düğümler, yürütme onayları">
    - Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalışma geçmişi (`cron.*`).
    - Skills: durum, etkinleştir/devre dışı bırak, yükle, API anahtarı güncellemeleri (`skills.*`).
    - Düğümler: liste + kapasiteler (`node.list`).
    - Yürütme onayları: gateway veya düğüm izin listelerini düzenle + `exec host=gateway/node` için isteme politikası (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Yapılandırma">
    - `~/.openclaw/openclaw.json` görüntüle/düzenle (`config.get`, `config.set`).
    - MCP, yapılandırılmış sunucular, etkinleştirme, OAuth/filtre/paralel özetleri, yaygın operatör komutları ve kapsamlı `mcp` yapılandırma düzenleyicisi için ayrılmış bir ayarlar sayfasına sahiptir.
    - Doğrulamayla uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazmalar, eşzamanlı düzenlemelerin üzerine yazmayı önlemek için bir temel karma koruması içerir.
    - Yazmalar (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma yükündeki refs için etkin SecretRef çözümlemesini ön kontrolden geçirir; çözümlenmemiş etkin gönderilmiş refs yazmadan önce reddedilir.
    - Form kayıtları, kaydedilmiş gizli değerlere hâlâ eşlenen redakte edilmiş değerleri korurken kaydedilen yapılandırmadan geri yüklenemeyen eski redakte edilmiş yer tutucuları atar.
    - Şema + form işleme (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, anında alt öğe özetleri, iç içe nesne/joker karakter/dizi/bileşim düğümlerinde docs meta verileri ve mevcut olduğunda plugin + kanal şemaları dahil); Ham JSON düzenleyicisi yalnızca anlık görüntü güvenli bir ham gidiş dönüşe sahip olduğunda kullanılabilir.
    - Bir anlık görüntü ham metni güvenli biçimde gidiş dönüş yapamıyorsa Control UI Form modunu zorlar ve o anlık görüntü için Ham modu devre dışı bırakır.
    - Ham JSON düzenleyicisi "Kaydedilene sıfırla", düzleştirilmiş bir anlık görüntüyü yeniden işlemek yerine ham yazılmış şekli (biçimlendirme, yorumlar, `$include` düzeni) korur; böylece anlık görüntü güvenli biçimde gidiş dönüş yapabildiğinde harici düzenlemeler sıfırlamadan sonra da kalır.
    - Yapılandırılmış SecretRef nesne değerleri, kazara nesneden dizeye bozulmayı önlemek için form metin girişlerinde salt okunur işlenir.

  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/modeller anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Olay günlüğü, Control UI yenileme/RPC zamanlamalarını, yavaş sohbet/yapılandırma işleme zamanlamalarını ve tarayıcı bu PerformanceObserver giriş türlerini sunduğunda uzun animasyon kareleri veya uzun görevler için tarayıcı yanıt verebilirlik girişlerini içerir.
    - Günlükler: filtre/dışa aktarma ile gateway dosya günlüklerinin canlı kuyruğu (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla paket/git güncellemesi + yeniden başlatma çalıştır (`update.run`), ardından çalışan gateway sürümünü doğrulamak için yeniden bağlandıktan sonra `update.status` yoklaması yap.

  </Accordion>
  <Accordion title="Cron işleri panel notları">
    - Yalıtılmış işler için teslim varsayılan olarak özet duyurusudur. Yalnızca dahili çalıştırmalar istiyorsanız bunu none olarak değiştirebilirsiniz.
    - Duyuru seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) Webhook URL'sine ayarlanmış halde `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için Webhook ve none teslim modları kullanılabilir.
    - Gelişmiş düzenleme denetimleri; çalıştırmadan sonra silme, ajan geçersiz kılmasını temizleme, cron exact/stagger seçenekleri, ajan model/düşünme geçersiz kılmaları ve en iyi çaba teslim anahtarlarını içerir.
    - Form doğrulaması alan düzeyi hatalarla satır içidir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Ayrılmış bir bearer token göndermek için `cron.webhookToken` ayarlayın; atlanırsa Webhook kimlik doğrulama üst bilgisi olmadan gönderilir.
    - Kullanımdan kaldırılmış geri dönüş: `notify: true` içeren saklanmış eski işleri `cron.webhook` üzerinden açık iş başına Webhook veya tamamlama teslimine geçirmek için `openclaw doctor --fix` çalıştırın.

  </Accordion>
</AccordionGroup>

## MCP sayfası

Ayrılmış MCP sayfası, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucuları için bir operatör görünümüdür. MCP aktarımlarını kendisi başlatmaz; bunu kaydedilmiş yapılandırmayı incelemek ve düzenlemek için kullanın, ardından canlı sunucu kanıtına ihtiyaç duyduğunuzda `openclaw mcp doctor --probe` kullanın.

Tipik iş akışı:

1. Kenar çubuğundan **MCP** öğesini açın.
2. Toplam, etkin, OAuth ve filtrelenmiş sunucu sayılarını görmek için özet kartlarını kontrol edin.
3. Her sunucu satırında aktarımı, etkinleştirmeyi, kimlik doğrulamayı, filtreleri, zaman aşımlarını ve komut ipuçlarını gözden geçirin.
4. Bir sunucunun yapılandırılmış kalması ancak çalışma zamanı keşfinin dışında kalması gerektiğinde etkinleştirmeyi değiştirin.
5. Sunucu tanımları, üst bilgiler, TLS/mTLS yolları, OAuth meta verileri, araç filtreleri ve Codex projeksiyon meta verileri için kapsamlı `mcp` yapılandırma bölümünü düzenleyin.
6. Bir yapılandırma yazımı için **Kaydet** öğesini veya çalışan Gateway değişen yapılandırmayı uygulamalıysa **Kaydet ve Yayınla** öğesini kullanın.
7. Düzenlenen süreç statik tanılama, canlı kanıt veya önbelleğe alınmış çalışma zamanını elden çıkarma gerektirdiğinde bir terminalden `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` veya `openclaw mcp reload` çalıştırın.

Sayfa, kimlik bilgisi taşıyan URL benzeri değerleri işlemeden önce redakte eder ve sunucu adlarını komut parçacıklarında tırnak içine alır; böylece kopyalanan komutlar boşluklar veya kabuk meta karakterleriyle de çalışır. Tam CLI ve yapılandırma başvurusu [MCP](/tr/cli/mcp) içinde yer alır.

## Etkinlik sekmesi

Etkinlik sekmesi, canlı araç etkinliği için geçici, tarayıcıya yerel bir gözlemcidir. Chat araç kartlarını besleyen aynı Gateway `session.tool` / araç olay akışından türetilir; başka bir Gateway olay ailesi, uç nokta, kalıcı etkinlik deposu, metrik akışı veya dış gözlemci akışı eklemez.

Etkinlik girdileri yalnızca temizlenmiş özetleri ve redakte edilmiş, kısaltılmış çıktı önizlemelerini tutar. Araç argüman değerleri Etkinlik durumunda saklanmaz; UI argümanların gizli olduğunu gösterir ve yalnızca argüman alanı sayısını kaydeder. Bellek içi liste geçerli tarayıcı sekmesini izler, Control UI içinde gezinmede korunur ve sayfa yeniden yüklendiğinde, oturum değiştirildiğinde veya **Temizle** kullanıldığında sıfırlanır.

## Chat davranışı

<AccordionGroup>
  <Accordion title="Gönderme ve geçmiş semantiği">
    - `chat.send` **engellemesizdir**: hemen `{ runId, status: "started" }` ile onay verir ve yanıt `chat` olayları üzerinden akar. Güvenilen Control UI istemcileri, yerel tanılama için isteğe bağlı ACK zamanlama meta verileri de alabilir.
    - Chat yüklemeleri görüntüleri ve video olmayan dosyaları kabul eder. Görüntüler yerel görüntü yolunu korur; diğer dosyalar yönetilen medya olarak saklanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden gönderme, çalışırken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları UI güvenliği için boyutla sınırlandırılır. Transcript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır meta veri bloklarını atlayabilir ve aşırı büyük mesajları bir yer tutucuyla (`[chat.history omitted: message too large]`) değiştirebilir.
    - Görünür bir asistan mesajı `chat.history` içinde kısaltıldığında, yan okuyucu tam görüntüleme-normalize edilmiş transcript girdisini gerektiğinde `sessionKey`, gerektiğinde etkin `agentId` ve transcript `messageId` ile `chat.message.get` üzerinden getirebilir. Gateway yine de daha fazlasını döndüremezse okuyucu, kısaltılmış önizlemeyi sessizce tekrarlamak yerine açık bir kullanılamaz durumu gösterir.
    - Asistan/oluşturulan görüntüler yönetilen medya referansları olarak kalıcılaştırılır ve kimliği doğrulanmış Gateway medya URL'leri üzerinden geri sunulur; böylece yeniden yüklemeler ham base64 görüntü yüklerinin chat geçmişi yanıtında kalmasına bağlı olmaz.
    - `chat.history` işlenirken Control UI, görünür asistan metninden yalnızca görüntülemeye yönelik satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model denetim tokenlarını çıkarır; ayrıca tüm görünür metni yalnızca tam sessiz token `NO_REPLY` / `no_reply` veya Heartbeat onay tokenı `HEARTBEAT_OK` olan asistan girdilerini atlar.
    - Etkin bir gönderme sırasında ve son geçmiş yenilemesinde, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürürse chat görünümü yerel iyimser kullanıcı/asistan mesajlarını görünür tutar; Gateway geçmişi yetiştiğinde kanonik transcript bu yerel mesajların yerini alır.
    - Canlı `chat` olayları teslim durumudur; `chat.history` ise kalıcı oturum transcript'inden yeniden oluşturulur. Araç-son olaylarından sonra Control UI geçmişi yeniden yükler ve yalnızca küçük bir iyimser kuyruğu birleştirir; transcript sınırı [WebChat](/tr/web/webchat) içinde belgelenmiştir.
    - `chat.inject`, oturum transcript'ine bir asistan notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (ajan çalıştırması yok, kanal teslimi yok).
    - Chat üst bilgisi ajan filtresini oturum seçiciden önce gösterir ve oturum seçici seçili ajanla kapsamlandırılır. Ajan değiştirmek yalnızca o ajana bağlı oturumları gösterir ve henüz kaydedilmiş pano oturumları yoksa o ajanın ana oturumuna geri döner.
    - Masaüstü genişliklerinde chat denetimleri tek bir kompakt satırda kalır ve transcript aşağı kaydırılırken daralır; yukarı kaydırmak, en üste dönmek veya en alta ulaşmak denetimleri geri getirir.
    - Ardışık yinelenen yalnızca metin mesajları, sayı rozeti olan tek bir baloncuk olarak işlenir. Görüntü, ek, araç çıktısı veya canvas önizlemesi taşıyan mesajlar daraltılmaz.
    - Chat üst bilgisi model ve düşünme seçicileri, etkin oturumu `sessions.patch` üzerinden hemen yamalar; bunlar tek turluk gönderme seçenekleri değil, kalıcı oturum geçersiz kılmalarıdır.
    - Aynı oturum için bir model seçici değişikliği hâlâ kaydedilirken mesaj gönderirseniz, oluşturucu `chat.send` çağırmadan önce o oturum yamasını bekler; böylece gönderme seçili modeli kullanır.
    - Control UI içinde `/new` yazmak, New Chat ile aynı yeni pano oturumunu oluşturur ve ona geçer; ancak `session.dmScope: "main"` yapılandırılmışsa ve geçerli üst öğe ajanın ana oturumuysa, bunun yerine ana oturumu yerinde sıfırlar. `/reset` yazmak, geçerli oturum için Gateway'in açık yerinde sıfırlamasını korur.
    - Chat model seçici, Gateway'in yapılandırılmış model görünümünü ister. `agents.defaults.models` varsa, bu izin listesi seçiciyi yönlendirir; sağlayıcı kapsamlı katalogları dinamik tutan `provider/*` girdileri de buna dahildir. Aksi halde seçici açık `models.providers.*.models` girdilerini ve kullanılabilir kimlik doğrulaması olan sağlayıcıları gösterir. Tam katalog, `view: "all"` ile hata ayıklama `models.list` RPC'si üzerinden kullanılabilir kalır.
    - Taze Gateway oturum kullanımı raporları geçerli bağlam tokenlarını içerdiğinde, chat oluşturucu alanı kompakt bir bağlam kullanımı göstergesi gösterir. Yüksek bağlam baskısında uyarı stiline geçer ve önerilen Compaction düzeylerinde normal oturum Compaction yolunu çalıştıran kompakt bir düğme gösterir. Eski token anlık görüntüleri, Gateway tekrar taze kullanım raporlayana kadar gizlenir.

  </Accordion>
  <Accordion title="Konuşma modu (tarayıcı gerçek zamanlı)">
    Konuşma modu kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. OpenAI'yi `talk.realtime.provider: "openai"` ile birlikte bir `openai` API anahtarı kimlik doğrulama profili, `talk.realtime.providers.openai.apiKey` veya `OPENAI_API_KEY` ile yapılandırın; OpenAI OAuth profilleri Realtime sesi yapılandırmaz. Google'ı `talk.realtime.provider: "google"` ile birlikte `talk.realtime.providers.google.apiKey` kullanarak yapılandırın. Tarayıcı hiçbir zaman standart sağlayıcı API anahtarı almaz. OpenAI, WebRTC için geçici bir Realtime istemci gizli anahtarı alır. Google Live, tarayıcı WebSocket oturumu için tek kullanımlık kısıtlı Live API kimlik doğrulama tokenı alır; yönergeler ve araç bildirimleri Gateway tarafından token içine kilitlenir. Yalnızca arka uç gerçek zamanlı köprüsü sunan sağlayıcılar Gateway röle aktarımı üzerinden çalışır; böylece kimlik bilgileri ve satıcı soketleri sunucu tarafında kalırken tarayıcı sesi kimliği doğrulanmış Gateway RPC'leri üzerinden taşınır. Realtime oturum istemi Gateway tarafından birleştirilir; `talk.client.create` çağıran tarafından sağlanan yönerge geçersiz kılmalarını kabul etmez.

    Chat oluşturucu, Konuşma başlat/durdur düğmesinin yanında bir Konuşma seçenekleri düğmesi içerir. Seçenekler bir sonraki Konuşma oturumuna uygulanır ve sağlayıcıyı, aktarımı, modeli, sesi, akıl yürütme çabasını, VAD eşiğini, sessizlik süresini ve önek dolguyu geçersiz kılabilir. Bir seçenek boş olduğunda Gateway varsa yapılandırılmış varsayılanları, yoksa sağlayıcı varsayılanını kullanır. Gateway rölesini seçmek arka uç röle yolunu zorlar; WebRTC seçmek oturumu istemciye ait tutar ve sağlayıcı bir tarayıcı oturumu oluşturamazsa sessizce röleye geri dönmek yerine başarısız olur.

    Chat oluşturucuda Konuşma denetimi, mikrofon dikte düğmesinin yanındaki dalgalar düğmesidir. Konuşma başladığında oluşturucu durum satırı önce `Connecting Talk...`, ses bağlıyken `Talk live`, veya gerçek zamanlı bir araç çağrısı `talk.client.toolCall` üzerinden yapılandırılmış daha büyük modele danışırken `Asking OpenClaw...` gösterir.

    Bakımcı canlı smoke testi: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` OpenAI arka uç WebSocket köprüsünü, OpenAI tarayıcı WebRTC SDP değişimini, Google Live kısıtlı-token tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway röle tarayıcı adaptörünü doğrular. Komut yalnızca sağlayıcı durumunu yazdırır ve gizli bilgileri günlüğe kaydetmez.

  </Accordion>
  <Accordion title="Durdurma ve iptal">
    - **Durdur** öğesine tıklayın (`chat.abort` çağırır).
    - Bir çalıştırma etkinken normal takip mesajları kuyruğa alınır. Kuyruktaki bir mesajda **Yönlendir** öğesine tıklayarak o takip mesajını çalışan tura enjekte edin.
    - Bant dışı iptal için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi tek başına iptal ifadeleri).
    - `chat.abort`, o oturum için tüm etkin çalıştırmaları iptal etmek üzere `{ sessionKey }` destekler (`runId` olmadan).

  </Accordion>
  <Accordion title="İptal edilen kısmın korunması">
    - Bir çalıştırma iptal edildiğinde, kısmi asistan metni UI içinde yine de gösterilebilir.
    - Gateway, ara belleğe alınmış çıktı varsa iptal edilmiş kısmi asistan metnini transcript geçmişine kalıcılaştırır.
    - Kalıcılaştırılmış girdiler iptal meta verileri içerir; böylece transcript tüketicileri iptal kısımlarını normal tamamlama çıktısından ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve web push

Control UI bir `manifest.webmanifest` ve bir servis çalışanıyla gelir; bu nedenle modern tarayıcılar bunu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık olmasa bile Gateway'in kurulu PWA'yı bildirimlerle uyandırmasını sağlar.

Sayfa bir OpenClaw güncellemesinden hemen sonra **Protokol uyuşmazlığı** gösterirse, önce panoyu `openclaw dashboard` ile yeniden açın ve sayfayı sert yenileyin. Hâlâ başarısız olursa pano kaynağı için site verilerini temizleyin veya özel bir tarayıcı penceresinde test edin; eski bir sekme veya tarayıcı servis çalışanı önbelleği, daha yeni Gateway'e karşı güncelleme öncesi Control UI paketini çalıştırmaya devam edebilir.

| Yüzey                                                 | Ne yapar                                                          |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | PWA manifesti. Erişilebilir olduğunda tarayıcılar "Uygulamayı yükle" seçeneğini sunar. |
| `ui/public/sw.js`                                     | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw state dir altında)   | Web Push yüklerini imzalamak için kullanılan otomatik oluşturulmuş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                    | Kalıcı hale getirilmiş tarayıcı abonelik uç noktaları.             |

Anahtarları sabitlemek istediğinizde (çok konaklı dağıtımlar, gizli anahtar rotasyonu veya testler için) VAPID anahtar çiftini Gateway sürecindeki ortam değişkenleriyle geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılanı `https://openclaw.ai`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için bu kapsam kapılı Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID genel anahtarını getirir.
- `push.web.subscribe` — bir `endpoint` ile birlikte `keys.p256dh`/`keys.auth` kaydeder.
- `push.web.unsubscribe` — kayıtlı bir uç noktayı kaldırır.
- `push.web.test` — çağıranın aboneliğine test bildirimi gönderir.

<Note>
Web Push, iOS APNS relay yolundan (relay destekli push için bkz. [Yapılandırma](/tr/gateway/configuration)) ve yerel mobil eşleştirmeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Barındırılan gömmeler

Asistan iletileri, `[embed ...]` shortcode ile barındırılan web içeriğini satır içinde işleyebilir. iframe sandbox ilkesi `gateway.controlUi.embedSandbox` tarafından denetlenir:

<Tabs>
  <Tab title="strict">
    Barındırılan gömmeler içinde betik yürütmeyi devre dışı bırakır.
  </Tab>
  <Tab title="scripts (default)">
    Kaynak izolasyonunu korurken etkileşimli gömmelere izin verir; varsayılan budur ve genellikle kendi kendine yeterli tarayıcı oyunları/widget'ları için yeterlidir.
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
`trusted` seçeneğini yalnızca gömülü belgenin gerçekten same-origin davranışına ihtiyaç duyduğu durumlarda kullanın. Çoğu ajan tarafından üretilen oyun ve etkileşimli canvas için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` gömme URL'leri varsayılan olarak engellenmiş kalır. Bilerek `[embed url="https://..."]` öğesinin üçüncü taraf sayfaları yüklemesini istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Sohbet iletisi genişliği

Gruplanmış sohbet iletileri okunabilir bir varsayılan maksimum genişlik kullanır. Geniş monitörlü dağıtımlar, paketlenmiş CSS'ye yama yapmadan `gateway.controlUi.chatMessageMaxWidth` ayarlayarak bunu geçersiz kılabilir:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Değer tarayıcıya ulaşmadan önce doğrulanır. Desteklenen değerler arasında `960px` veya `82%` gibi düz uzunluklar ve yüzdeler ile kısıtlanmış `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` ve `fit-content(...)` genişlik ifadeleri bulunur.

## Tailnet erişimi (önerilir)

<Tabs>
  <Tab title="Entegre Tailscale Serve (tercih edilir)">
    Gateway'i loopback üzerinde tutun ve Tailscale Serve'in onu HTTPS ile proxy etmesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Varsayılan olarak, Control UI/WebSocket Serve istekleri `gateway.auth.allowTailscale` `true` olduğunda Tailscale kimlik başlıkları (`tailscale-user-login`) üzerinden kimlik doğrulayabilir. OpenClaw, `x-forwarded-for` adresini `tailscale whois` ile çözümleyip başlıkla eşleştirerek kimliği doğrular ve bunları yalnızca istek Tailscale'in `x-forwarded-*` başlıklarıyla loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliği kullanan Control UI operatör oturumları için bu doğrulanmış Serve yolu, cihaz eşleştirme gidiş gelişini de atlar; cihazsız tarayıcılar ve node rolü bağlantıları normal cihaz denetimlerini izlemeye devam eder. Serve trafiği için bile açık paylaşılan gizli anahtar kimlik bilgileri gerektirmek istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu asenkron Serve kimlik yolu için, aynı istemci IP'si ve kimlik doğrulama kapsamına ait başarısız kimlik doğrulama denemeleri, rate-limit yazımlarından önce sıraya alınır. Bu nedenle aynı tarayıcıdan eşzamanlı hatalı yeniden denemeler, paralel yarışan iki düz uyumsuzluk yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Tokenless Serve kimlik doğrulaması, gateway konağının güvenilir olduğunu varsayar. Bu konakta güvenilmeyen yerel kod çalışabiliyorsa token/parola kimlik doğrulaması gerektirin.
    </Warning>

  </Tab>
  <Tab title="Tailnet'e bağla + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sonra açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Eşleşen paylaşılan gizli anahtarı UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvensiz HTTP

Panoyu düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`), tarayıcı **güvenli olmayan bağlamda** çalışır ve WebCrypto'yu engeller. OpenClaw varsayılan olarak cihaz kimliği olmayan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Control UI kimlik doğrulaması
- acil durum `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI'ı yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway konağında)

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
    `dangerouslyDisableDeviceAuth`, Control UI cihaz kimliği denetimlerini devre dışı bırakır ve ciddi bir güvenlik düşüşüdür. Acil kullanım sonrasında hızla geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy notu">
    - Başarılı trusted-proxy kimlik doğrulaması, **operatör** Control UI oturumlarını cihaz kimliği olmadan kabul edebilir.
    - Bu, node rolü Control UI oturumlarını kapsamaz.
    - Aynı konak loopback ters proxy'leri trusted-proxy kimlik doğrulamasını yine de karşılamaz; bkz. [Trusted proxy auth](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberi için bkz. [Tailscale](/tr/gateway/tailscale).

## İçerik güvenliği ilkesi

Control UI sıkı bir `img-src` ilkesiyle gelir: yalnızca **same-origin** varlıklar, `data:` URL'leri ve yerel olarak oluşturulmuş `blob:` URL'lerine izin verilir. Uzak `http(s)` ve protokole göreli görüntü URL'leri tarayıcı tarafından reddedilir ve ağ getirmeleri başlatmaz.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görüntüler (örneğin `/avatars/<id>`) hâlâ işlenir; UI'ın getirip yerel `blob:` URL'lerine dönüştürdüğü kimliği doğrulanmış avatar rotaları buna dahildir.
- Satır içi `data:image/...` URL'leri hâlâ işlenir (protokol içi yükler için kullanışlıdır).
- Control UI tarafından oluşturulan yerel `blob:` URL'leri hâlâ işlenir.
- Kanal meta verileri tarafından yayılan uzak avatar URL'leri, Control UI'ın avatar yardımcılarında çıkarılır ve yerleşik logo/rozetle değiştirilir; böylece ele geçirilmiş veya kötü amaçlı bir kanal, operatör tarayıcısından keyfi uzak görüntü getirmelerini zorlayamaz.

Bu davranışı elde etmek için herhangi bir şeyi değiştirmeniz gerekmez — her zaman etkindir ve yapılandırılamaz.

## Avatar rota kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, Control UI avatar uç noktası API'nin geri kalanıyla aynı gateway token'ını gerektirir:

- `GET /avatar/<agentId>` avatar görüntüsünü yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1` avatar meta verilerini aynı kural altında döndürür.
- Her iki rotaya yönelik kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla eşleşir). Bu, avatar rotasının başka türlü korunan konaklarda ajan kimliğini sızdırmasını önler.
- Control UI'ın kendisi avatarları getirirken gateway token'ını bearer başlığı olarak iletir ve görüntünün panolarda hâlâ işlenmesi için kimliği doğrulanmış blob URL'leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan konaklarda önerilmez), gateway'in geri kalanıyla uyumlu olarak avatar rotası da kimliği doğrulanmamış hale gelir.

## Asistan medya rota kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, asistan yerel medya önizlemeleri iki adımlı bir rota kullanır:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` normal Control UI operatör kimlik doğrulamasını gerektirir. Tarayıcı, kullanılabilirliği denetlerken gateway token'ını bearer başlığı olarak gönderir.
- Başarılı meta veri yanıtları, tam olarak o kaynak yoluna kapsamlanmış kısa ömürlü bir `mediaTicket` içerir.
- Tarayıcıda işlenen görüntü, ses, video ve belge URL'leri etkin gateway token'ı veya parolası yerine `mediaTicket=<ticket>` kullanır. Bilet hızla süresi dolar ve farklı bir kaynağı yetkilendiremez.

Bu, yeniden kullanılabilir gateway kimlik bilgilerini görünür medya URL'lerine koymadan normal medya işlemeyi tarayıcı yerel medya öğeleriyle uyumlu tutar.

## UI'ı derleme

Gateway statik dosyaları `dist/control-ui` üzerinden sunar. Bunları şu komutla derleyin:

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

Ardından UI'ı Gateway WS URL'nize yönlendirin (örn. `ws://127.0.0.1:18789`).

## Boş Control UI sayfası

Tarayıcı boş bir pano yüklüyorsa ve DevTools yararlı bir hata göstermiyorsa, bir uzantı veya erken çalışan content script JavaScript module uygulamasının değerlendirilmesini engellemiş olabilir. Statik sayfa, başlangıçtan sonra `<openclaw-app>` kaydedilmediğinde görünen düz bir HTML kurtarma paneli içerir.

Tarayıcı ortamını değiştirdikten sonra panelin **Yeniden dene** eylemini kullanın veya şu denetimlerden sonra elle yeniden yükleyin:

- Tüm sayfalara enjekte eden uzantıları, özellikle `<all_urls>` content script'leri olan uzantıları devre dışı bırakın.
- Gizli bir pencere, temiz bir tarayıcı profili veya başka bir tarayıcı deneyin.
- Gateway'i çalışır durumda tutun ve tarayıcı değişikliğinden sonra aynı pano URL'sini doğrulayın.

## Hata ayıklama/test: dev sunucusu + uzak Gateway

Control UI statik dosyalardır; WebSocket hedefi yapılandırılabilir ve HTTP origin'den farklı olabilir. Vite dev sunucusunu yerelde kullanmak, ancak Gateway'i başka yerde çalıştırmak istediğinizde bu kullanışlıdır.

<Steps>
  <Step title="UI dev sunucusunu başlatın">
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
    - `gatewayUrl` aracılığıyla tam bir `ws://` veya `wss://` uç noktası geçirirseniz, tarayıcının sorgu dizesini doğru ayrıştırması için `gatewayUrl` değerini URL ile kodlayın.
    - `token`, mümkün olduğunda URL parçası (`#token=...`) aracılığıyla geçirilmelidir. Parçalar sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca yedek olarak kullanılır ve önyüklemeden hemen sonra kaldırılır.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında, kullanıcı arayüzü yapılandırma veya ortam kimlik bilgilerine geri dönmez. `token` (veya `password`) değerini açıkça sağlayın. Açık kimlik bilgilerinin eksik olması bir hatadır.
    - Gateway, TLS arkasındayken (Tailscale Serve, HTTPS proxy vb.) `wss://` kullanın.
    - Clickjacking'i önlemek için `gatewayUrl` yalnızca üst düzey bir pencerede (gömülü değil) kabul edilir.
    - Herkese açık, loopback olmayan Denetim Kullanıcı Arayüzü dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça (tam origin'ler) ayarlamalıdır. Loopback, RFC1918/link-local, `.local`, `.ts.net` veya Tailscale CGNAT ana makinelerinden yapılan özel aynı-origin LAN/Tailnet yüklemeleri, Host üst bilgisi yedeklemesini etkinleştirmeden kabul edilir.
    - Gateway başlatması, etkin çalışma zamanı bağlaması ve bağlantı noktasından `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel origin'leri tohumlayabilir, ancak uzak tarayıcı origin'leri yine de açık girdiler gerektirir.
    - Sıkı denetimli yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, "kullandığım ana makineyle eşleştir" değil, herhangi bir tarayıcı origin'ine izin ver anlamına gelir.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`, Host üst bilgisi origin yedekleme modunu etkinleştirir, ancak bu tehlikeli bir güvenlik modudur.

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
