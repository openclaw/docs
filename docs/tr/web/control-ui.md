---
read_when:
    - Gateway’i bir tarayıcıdan çalıştırmak istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı kontrol kullanıcı arayüzü (sohbet, etkinlik, düğümler, yapılandırma)
title: Denetim Kullanıcı Arayüzü
x-i18n:
    generated_at: "2026-07-03T09:56:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b23d0e2aeefc3b746f1ab51cd9049135e2695ab77cf5cbb5eab6ec0df90f011d
    source_path: web/control-ui.md
    workflow: 16
---

Denetim Arayüzü, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfa uygulamasıdır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` değerini ayarlayın (örn. `/openclaw`)

Aynı bağlantı noktası üzerinden **doğrudan Gateway WebSocket'iyle** konuşur.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenmezse önce Gateway'i başlatın: `openclaw gateway`.

<Note>
Yerel Windows LAN bağlamalarında, `127.0.0.1` Gateway ana makinesinde çalışsa bile Windows Güvenlik Duvarı veya kuruluş tarafından yönetilen Grup İlkesi duyurulan LAN URL'sini engellemeye devam edebilir. Windows ana makinesinde `openclaw gateway status --deep` komutunu çalıştırın; olası engellenmiş bağlantı noktalarını, profil uyuşmazlıklarını ve ilkenin yok sayabileceği yerel güvenlik duvarı kurallarını raporlar.
</Note>

Kimlik doğrulama, WebSocket el sıkışması sırasında şunlarla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik başlıkları
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir proxy kimlik başlıkları

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçilen gateway URL'si için bir token saklar; parolalar kalıcı hale getirilmez. İlk bağlantıda onboarding genellikle paylaşılan gizli kimlik doğrulaması için bir gateway token'ı oluşturur, ancak `gateway.auth.mode` değeri `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Denetim Arayüzü'ne yeni bir tarayıcıdan veya cihazdan bağlandığınızda Gateway genellikle **tek seferlik eşleştirme onayı** ister. Bu, yetkisiz erişimi önlemek için bir güvenlik önlemidir.

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

Tarayıcı değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve onu okuma erişiminden yazma/yönetici erişimine geçirirseniz bu, sessiz bir yeniden bağlantı değil, onay yükseltmesi olarak ele alınır. OpenClaw eski onayı etkin tutar, daha geniş kapsamlı yeniden bağlantıyı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

`openclaw_gateway` adaptörü üzerinden bağlanan Paperclip aracıları aynı ilk çalıştırma onay akışını kullanır. İlk bağlantı denemesinden sonra bekleyen isteği önizlemek için `openclaw devices approve --latest` komutunu çalıştırın, ardından onaylamak için yazdırılan `openclaw devices approve <requestId>` komutunu yeniden çalıştırın. Uzak bir gateway için açık `--url` ve `--token` değerleri geçirin. Onayları yeniden başlatmalar arasında kararlı tutmak için Paperclip'te her çalıştırmada yeni bir geçici cihaz kimliği oluşturmasına izin vermek yerine kalıcı bir `adapterConfig.devicePrivateKeyPem` yapılandırın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik olarak onaylanır.
- Tailscale Serve, `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı cihaz kimliğini sunduğunda Denetim Arayüzü operatör oturumları için eşleştirme gidiş gelişini atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği oluşturur; bu nedenle tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

</Note>

## Kişisel kimlik (tarayıcı yerelinde)

Denetim Arayüzü, paylaşılan oturumlarda atıf için giden iletilere eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Tarayıcı depolamasında yaşar, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz iletilerdeki normal transkript yazarlığı meta verileri dışında diğer cihazlarla eşitlenmez veya sunucu tarafında kalıcı hale getirilmez. Site verilerini temizlemek veya tarayıcı değiştirmek bunu boş değere sıfırlar.

Aynı tarayıcı yereli deseni asistan avatarı geçersiz kılması için de geçerlidir. Yüklenen asistan avatarları, gateway tarafından çözümlenen kimliğin yalnızca yerel tarayıcıda üzerine bindirilir ve hiçbir zaman `config.patch` üzerinden gidip gelmez. Paylaşılan `ui.assistant.avatar` yapılandırma alanı, alanı doğrudan yazan UI dışı istemciler için hâlâ kullanılabilir (betiklenmiş gateway'ler veya özel panolar gibi).

## Çalışma zamanı yapılandırma uç noktası

Denetim Arayüzü çalışma zamanı ayarlarını, gateway'in Denetim Arayüzü temel yoluna göre çözümlenen `/control-ui-config.json` üzerinden alır (örneğin UI `/__openclaw__/` altında sunulduğunda `/__openclaw__/control-ui-config.json`). Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar bunu alamaz ve başarılı bir alma işlemi için zaten geçerli bir gateway token'ı/parolası, Tailscale Serve kimliği veya güvenilir proxy kimliği gerekir.

## Dil desteği

Denetim Arayüzü ilk yüklemede tarayıcı yerel ayarınıza göre kendisini yerelleştirebilir. Daha sonra bunu geçersiz kılmak için **Genel Bakış -> Gateway Erişimi -> Dil** bölümünü açın. Yerel ayar seçici, Görünüm altında değil Gateway Erişimi kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışındaki çeviriler tarayıcıda tembel yüklenir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve gelecekteki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Doküman çevirileri aynı İngilizce dışı yerel ayar kümesi için oluşturulur, ancak doküman sitesinin yerleşik Mintlify dil seçicisi Mintlify'nin kabul ettiği yerel ayar kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) dokümanlar publish deposunda hâlâ oluşturulur; Mintlify bu kodları destekleyene kadar bu seçicide görünmeyebilirler.

## Görünüm temaları

Görünüm paneli yerleşik Claw, Knot ve Dash temalarını ve ayrıca tarayıcı yerelinde bir tweakcn içe aktarma yuvasını tutar. Bir tema içe aktarmak için [tweakcn düzenleyicisini](https://tweakcn.com/editor/theme) açın, bir tema seçin veya oluşturun, **Paylaş**'a tıklayın ve kopyalanan tema bağlantısını Görünüm'e yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` kayıt URL'lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi düzenleyici URL'lerini, göreli `/themes/<id>` yollarını, ham tema kimliklerini ve `amethyst-haze` gibi varsayılan tema adlarını kabul eder.

Görünüm ayrıca tarayıcı yerelinde bir Metin boyutu ayarı içerir. Ayar, Denetim Arayüzü tercihlerinin geri kalanıyla birlikte depolanır; sohbet metnine, besteci metnine, araç kartlarına ve sohbet kenar çubuklarına uygulanır ve mobil Safari odakta otomatik yakınlaştırma yapmasın diye metin girişlerini en az 16px tutar.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde depolanır. Gateway yapılandırmasına yazılmaz ve cihazlar arasında eşitlenmez. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; temizlemek, içe aktarılan tema seçiliyse etkin temayı yeniden Claw'a geçirir.

## Neler yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Sohbet geçmişi yenilemeleri, büyük oturumların sohbet kullanılabilir hale gelmeden önce tarayıcıyı tam transkript yükünü işlemeye zorlamaması için ileti başına metin sınırları olan sınırlı bir yakın dönem penceresi ister.
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden kısıtlanmış tek kullanımlık bir tarayıcı token'ı kullanır ve yalnızca arka uç gerçek zamanlı ses plugin'leri Gateway relay aktarımını kullanır. İstemcinin sahibi olduğu sağlayıcı oturumları `talk.client.create` ile başlar; Gateway relay oturumları `talk.session.create` ile başlar. Relay, sağlayıcı kimlik bilgilerini Gateway üzerinde tutarken tarayıcı `talk.session.appendAudio` üzerinden mikrofon PCM'i akıtır, Gateway ilkesi ve daha büyük yapılandırılmış OpenClaw modeli için `openclaw_agent_consult` sağlayıcı araç çağrılarını `talk.client.toolCall` üzerinden iletir ve etkin çalışma ses yönlendirmesini `talk.client.steer` veya `talk.session.steer` üzerinden yönlendirir.
    - Araç çağrılarını ve canlı araç çıktı kartlarını Sohbet içinde akıtın (aracı olayları).
    - Mevcut `session.tool` / araç olayı tesliminden canlı araç etkinliğinin tarayıcı yerelinde, redaksiyon öncelikli özetlerini içeren Etkinlik sekmesi.

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, rüyalar">
    - Kanallar: yerleşik ve paketlenmiş/harici plugin kanalları durumu, QR oturum açma ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`).
    - Kanal yoklama yenilemeleri, yavaş sağlayıcı kontrolleri tamamlanırken önceki anlık görüntüyü görünür tutar ve bir yoklama veya denetim UI bütçesini aştığında kısmi anlık görüntüler etiketlenir.
    - Örnekler: varlık listesi + yenileme (`system-presence`).
    - Oturumlar: varsayılan olarak yapılandırılmış aracı oturumlarını listeleyin, eski yapılandırılmamış aracı oturumu anahtarlarından geri dönün ve oturum başına model/düşünme/hızlı/ayrıntılı/izleme/akıl yürütme geçersiz kılmalarını uygulayın (`sessions.list`, `sessions.patch`).
    - Rüyalar: Dreaming durumu, etkinleştirme/devre dışı bırakma anahtarı ve Rüya Günlüğü okuyucusu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, node'lar, exec onayları">
    - Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalışma geçmişi (`cron.*`).
    - Skills: durum, etkinleştirme/devre dışı bırakma, yükleme, API anahtarı güncellemeleri (`skills.*`).
    - Node'lar: liste + sınırlar (`node.list`).
    - Exec onayları: gateway veya node izin listelerini düzenleyin + `exec host=gateway/node` için sorma ilkesi (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Yapılandırma">
    - `~/.openclaw/openclaw.json` görüntüle/düzenle (`config.get`, `config.set`).
    - MCP, yapılandırılmış sunucular, etkinleştirme, OAuth/filtre/paralel özetleri, yaygın operatör komutları ve kapsamlı `mcp` yapılandırma düzenleyicisi için ayrılmış bir ayarlar sayfasına sahiptir.
    - Doğrulamayla uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazmalar, eşzamanlı düzenlemelerin üzerine yazmayı önlemek için temel karma koruması içerir.
    - Yazmalar (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma yükündeki ref'ler için etkin SecretRef çözümlemesini ön kontrolden geçirir; çözümlenmemiş etkin gönderilmiş ref'ler yazmadan önce reddedilir.
    - Form kayıtları, hâlâ kayıtlı gizli değerlere eşlenen redakte edilmiş değerleri korurken kaydedilen yapılandırmadan geri yüklenemeyen eski redakte edilmiş yer tutucuları atar.
    - Şema + form işleme (`config.schema` / `config.schema.lookup`, alan `title` / `description`, eşleşen UI ipuçları, anlık alt özetler, iç içe nesne/joker/array/composition node'larında doküman meta verileri ve kullanılabilir olduğunda plugin + kanal şemaları dahil); Ham JSON düzenleyici yalnızca anlık görüntünün güvenli bir ham gidiş dönüşü olduğunda kullanılabilir.
    - Bir anlık görüntü ham metni güvenle gidiş dönüş yapamıyorsa Denetim Arayüzü Form modunu zorlar ve o anlık görüntü için Ham modu devre dışı bırakır.
    - Ham JSON düzenleyicide "Kaydedilene sıfırla", düzleştirilmiş bir anlık görüntüyü yeniden işlemek yerine ham yazılmış şekli (biçimlendirme, yorumlar, `$include` düzeni) korur; böylece anlık görüntü güvenle gidiş dönüş yapabildiğinde harici düzenlemeler sıfırlamadan sonra da kalır.
    - Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizgeye bozulmayı önlemek için form metin girişlerinde salt okunur işlenir.

  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/modeller anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Olay günlüğü, tarayıcı bu PerformanceObserver giriş türlerini sunduğunda Denetim Arayüzü yenileme/RPC zamanlamalarını, yavaş sohbet/yapılandırma işleme zamanlamalarını ve uzun animasyon kareleri ya da uzun görevler için tarayıcı yanıt verebilirliği girişlerini içerir.
    - Günlükler: filtre/dışa aktarma ile gateway dosya günlüklerinin canlı takibi (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla bir paket/git güncellemesi + yeniden başlatma çalıştırın (`update.run`), ardından çalışan gateway sürümünü doğrulamak için yeniden bağlandıktan sonra `update.status` sorgulayın.

  </Accordion>
  <Accordion title="Cron işleri panel notları">
    - Yalıtılmış işler için iletim varsayılan olarak özet duyurusu yapar. Yalnızca dahili çalıştırmalar istiyorsanız none olarak değiştirebilirsiniz.
    - Duyuru seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) Webhook URL'sine ayarlanmış şekilde `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için Webhook ve none iletim modları kullanılabilir.
    - Gelişmiş düzenleme kontrolleri; çalıştırmadan sonra silme, ajan geçersiz kılmasını temizleme, Cron exact/stagger seçenekleri, ajan model/thinking geçersiz kılmaları ve en iyi çaba iletim anahtarlarını içerir.
    - Form doğrulaması, alan düzeyinde hatalarla satır içindedir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Ayrılmış bir bearer token göndermek için `cron.webhookToken` değerini ayarlayın; atlanırsa Webhook bir kimlik doğrulama üstbilgisi olmadan gönderilir.
    - Kullanımdan kaldırılmış geri dönüş: `notify: true` içeren depolanmış eski işleri `cron.webhook` değerinden açık iş başına Webhook veya tamamlama iletimine taşımak için `openclaw doctor --fix` çalıştırın.

  </Accordion>
</AccordionGroup>

## MCP sayfası

Ayrılmış MCP sayfası, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucuları için bir operatör görünümüdür. MCP taşıma katmanlarını kendi başına başlatmaz; kaydedilmiş yapılandırmayı incelemek ve düzenlemek için bunu kullanın, ardından canlı sunucu kanıtı gerektiğinde `openclaw mcp doctor --probe` kullanın.

Tipik iş akışı:

1. Kenar çubuğundan **MCP** öğesini açın.
2. Toplam, etkin, OAuth ve filtrelenmiş sunucu sayıları için özet kartlarını kontrol edin.
3. Taşıma, etkinleştirme, kimlik doğrulama, filtreler, zaman aşımları ve komut ipuçları için her sunucu satırını gözden geçirin.
4. Bir sunucu yapılandırılmış kalmalı ancak çalışma zamanı keşfine dahil edilmemeliyse etkinleştirmeyi değiştirin.
5. Sunucu tanımları, üstbilgiler, TLS/mTLS yolları, OAuth meta verileri, araç filtreleri ve Codex projeksiyon meta verileri için kapsamlı `mcp` yapılandırma bölümünü düzenleyin.
6. Bir yapılandırma yazımı için **Kaydet** veya çalışan Gateway değiştirilen yapılandırmayı uygulamalıysa **Kaydet ve Yayınla** kullanın.
7. Düzenlenen işlemin statik tanılama, canlı kanıt veya önbelleğe alınmış çalışma zamanının atılması gerektiğinde bir terminalden `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` veya `openclaw mcp reload` çalıştırın.

Sayfa, kimlik bilgisi taşıyan URL benzeri değerleri işlemeden önce redakte eder ve sunucu adlarını komut parçacıklarında tırnak içine alır; böylece kopyalanan komutlar boşluklar veya kabuk meta karakterleriyle de çalışır. Tam CLI ve yapılandırma başvurusu [MCP](/tr/cli/mcp) içinde bulunur.

## Etkinlik sekmesi

Etkinlik sekmesi, canlı araç etkinliği için geçici, tarayıcıya yerel bir gözlemcidir. Chat araç kartlarını besleyen aynı Gateway `session.tool` / araç olay akışından türetilir; başka bir Gateway olay ailesi, uç nokta, kalıcı etkinlik deposu, metrik akışı veya harici gözlemci akışı eklemez.

Etkinlik girdileri yalnızca temizlenmiş özetleri ve redakte edilmiş, kısaltılmış çıktı önizlemelerini tutar. Araç argüman değerleri Etkinlik durumunda depolanmaz; UI, argümanların gizlendiğini gösterir ve yalnızca argüman alanı sayısını kaydeder. Bellek içi liste geçerli tarayıcı sekmesini izler, Control UI içinde gezinme sırasında korunur ve sayfa yeniden yüklendiğinde, oturum değiştirildiğinde veya **Temizle** kullanıldığında sıfırlanır.

## Chat davranışı

<AccordionGroup>
  <Accordion title="Gönderme ve geçmiş semantiği">
    - `chat.send` **engellemesizdir**: `{ runId, status: "started" }` ile hemen onay verir ve yanıt `chat` olayları üzerinden akar. Güvenilir Control UI istemcileri yerel tanılama için isteğe bağlı ACK zamanlama meta verileri de alabilir.
    - Chat yüklemeleri görselleri ve video olmayan dosyaları kabul eder. Görseller yerel görsel yolunu korur; diğer dosyalar yönetilen medya olarak depolanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden gönderme, çalışırken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları UI güvenliği için boyutla sınırlandırılmıştır. Transkript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır meta veri bloklarını atlayabilir ve aşırı büyük iletileri bir yer tutucuyla değiştirebilir (`[chat.history omitted: message too large]`).
    - Görünür bir asistan iletisi `chat.history` içinde kısaltıldığında, yan okuyucu tam görüntüleme-normalize edilmiş transkript girdisini gerektiğinde `sessionKey`, gerektiğinde etkin `agentId` ve transkript `messageId` ile `chat.message.get` üzerinden getirebilir. Gateway hâlâ daha fazlasını döndüremiyorsa okuyucu, kısaltılmış önizlemeyi sessizce tekrarlamak yerine açık bir kullanılamaz durumu gösterir.
    - Asistan/oluşturulan görseller yönetilen medya referansları olarak kalıcılaştırılır ve kimliği doğrulanmış Gateway medya URL'leri üzerinden geri sunulur; böylece yeniden yüklemeler ham base64 görsel yüklerinin Chat geçmişi yanıtında kalmasına bağlı olmaz.
    - `chat.history` işlenirken Control UI, görünür asistan metninden yalnızca görüntüleme amaçlı satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model kontrol tokenlarını çıkarır; ayrıca tüm görünür metni yalnızca tam sessiz token `NO_REPLY` / `no_reply` veya Heartbeat onay tokenı `HEARTBEAT_OK` olan asistan girdilerini atlar.
    - Etkin bir gönderim ve son geçmiş yenilemesi sırasında, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürürse Chat görünümü yerel iyimser kullanıcı/asistan iletilerini görünür tutar; Gateway geçmişi yetiştiğinde kanonik transkript bu yerel iletilerin yerini alır.
    - Canlı `chat` olayları iletim durumudur; `chat.history` ise kalıcı oturum transkriptinden yeniden oluşturulur. Araç-final olaylarından sonra Control UI geçmişi yeniden yükler ve yalnızca küçük bir iyimser kuyruğu birleştirir; transkript sınırı [WebChat](/tr/web/webchat) içinde belgelenmiştir.
    - `chat.inject`, oturum transkriptine bir asistan notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (ajan çalıştırması yok, kanal iletimi yok).
    - Kenar çubuğu, Yeni Oturum eylemi, Tüm Oturumlar bağlantısı ve tam oturum seçiciyi açan bir oturum arama düğmesiyle son oturumları listeler (seçili ajanla kapsamlandırılmış, arama ve sayfalandırma ile). Ajanları değiştirmek yalnızca o ajana bağlı oturumları gösterir ve henüz kaydedilmiş pano oturumları yoksa o ajanın ana oturumuna geri döner.
    - Masaüstü genişliklerinde Chat kontrolleri tek bir kompakt satırda kalır ve transkriptte aşağı kaydırırken daralır; yukarı kaydırmak, en üste dönmek veya en alta ulaşmak kontrolleri geri getirir.
    - Ardışık yinelenen yalnızca metin iletileri, sayı rozeti olan tek bir balon olarak işlenir. Görsel, ek, araç çıktısı veya canvas önizlemesi taşıyan iletiler daraltılmaz.
    - Chat başlığı model ve thinking seçicileri, etkin oturumu `sessions.patch` üzerinden hemen yamalar; bunlar kalıcı oturum geçersiz kılmalarıdır, yalnızca tek tur gönderim seçenekleri değildir.
    - Aynı oturum için bir model seçici değişikliği hâlâ kaydedilirken ileti gönderirseniz, besteci `chat.send` çağırmadan önce o oturum yamasını bekler; böylece gönderim seçili modeli kullanır.
    - Control UI içinde `/new` yazmak, geçerli üst öğe ajanın ana oturumu olduğunda `session.dmScope: "main"` yapılandırılmış olması dışında Yeni Chat ile aynı yeni pano oturumunu oluşturur ve ona geçer; bu durumda ana oturumu yerinde sıfırlar. `/reset` yazmak, geçerli oturum için Gateway'in açık yerinde sıfırlamasını korur.
    - Chat model seçici Gateway'in yapılandırılmış model görünümünü ister. `agents.defaults.models` varsa, sağlayıcı kapsamlı katalogları dinamik tutan `provider/*` girdileri dahil olmak üzere seçiciyi bu izin listesi yönlendirir. Aksi halde seçici açık `models.providers.*.models` girdilerini ve kullanılabilir kimlik doğrulamaya sahip sağlayıcıları gösterir. Tam katalog, hata ayıklama `models.list` RPC'si üzerinden `view: "all"` ile kullanılabilir kalır.
    - Güncel Gateway oturum kullanım raporları geçerli bağlam tokenlarını içerdiğinde, Chat besteci araç çubuğu kullanılan yüzdeyle küçük bir bağlam kullanım halkası gösterir; tam token ayrıntısı araç ipucunda bulunur. Halka, yüksek bağlam baskısında uyarı stiline geçer ve önerilen Compaction düzeylerinde normal oturum Compaction yolunu çalıştıran kompakt bir düğme gösterir. Eski token anlık görüntüleri, Gateway yeniden güncel kullanım bildirene kadar gizlenir.

  </Accordion>
  <Accordion title="Konuşma modu (tarayıcı gerçek zamanlı)">
    Konuşma modu kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. OpenAI'yi `talk.realtime.provider: "openai"` ve bir `openai` API anahtarı kimlik doğrulama profili, `talk.realtime.providers.openai.apiKey` veya `OPENAI_API_KEY` ile yapılandırın; OpenAI OAuth profilleri Realtime sesi yapılandırmaz. Google'ı `talk.realtime.provider: "google"` ve `talk.realtime.providers.google.apiKey` ile yapılandırın. Tarayıcı hiçbir zaman standart bir sağlayıcı API anahtarı almaz. OpenAI, WebRTC için geçici bir Realtime istemci sırrı alır. Google Live, talimatları ve araç bildirimleri Gateway tarafından tokena kilitlenmiş şekilde, bir tarayıcı WebSocket oturumu için tek kullanımlık kısıtlı bir Live API kimlik doğrulama tokenı alır. Yalnızca arka uç gerçek zamanlı köprüsü sunan sağlayıcılar Gateway aktarma taşıması üzerinden çalışır; böylece kimlik bilgileri ve satıcı soketleri sunucu tarafında kalırken tarayıcı sesi kimliği doğrulanmış Gateway RPC'leri üzerinden taşınır. Realtime oturum istemi Gateway tarafından birleştirilir; `talk.client.create` çağıran tarafından sağlanan talimat geçersiz kılmalarını kabul etmez.

    Chat bestecisi, Konuşma başlat/durdur düğmesinin yanında bir Konuşma seçenekleri düğmesi içerir. Seçenekler sonraki Konuşma oturumuna uygulanır ve sağlayıcı, taşıma, model, ses, akıl yürütme çabası, VAD eşiği, sessizlik süresi ve önek dolgusu değerlerini geçersiz kılabilir. Bir seçenek boş olduğunda Gateway varsa yapılandırılmış varsayılanları veya sağlayıcı varsayılanını kullanır. Gateway aktarmayı seçmek arka uç aktarma yolunu zorlar; WebRTC seçmek oturumu istemci sahipliğinde tutar ve sağlayıcı bir tarayıcı oturumu oluşturamazsa sessizce aktarmaya geri dönmek yerine başarısız olur.

    Chat bestecisinde Konuşma kontrolü, mikrofon dikte düğmesinin yanındaki dalgalar düğmesidir. Konuşma başladığında besteci durum satırı `Connecting Talk...`, ardından ses bağlıyken `Talk live` veya gerçek zamanlı bir araç çağrısı `talk.client.toolCall` üzerinden yapılandırılmış daha büyük modele danışırken `Asking OpenClaw...` gösterir.

    Bakımcı canlı smoke testi: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`, OpenAI arka uç WebSocket köprüsünü, OpenAI tarayıcı WebRTC SDP değişimini, Google Live kısıtlı-token tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway aktarma tarayıcı adaptörünü doğrular. Komut yalnızca sağlayıcı durumunu yazdırır ve gizli bilgileri günlüğe yazmaz.

  </Accordion>
  <Accordion title="Durdurma ve iptal">
    - **Durdur** öğesine tıklayın (`chat.abort` çağırır).
    - Bir çalıştırma etkinken normal takip iletileri kuyruğa alınır. Kuyruktaki bir iletide **Yönlendir** öğesine tıklayarak o takip iletisini çalışan tura enjekte edin.
    - Bant dışı iptal etmek için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi bağımsız iptal ifadeleri).
    - `chat.abort`, o oturumun tüm etkin çalıştırmalarını iptal etmek için `{ sessionKey }` destekler (`runId` yok).

  </Accordion>
  <Accordion title="İptal kısmi tutma">
    - Bir çalıştırma iptal edildiğinde, kısmi asistan metni UI içinde hâlâ gösterilebilir.
    - Gateway, arabelleğe alınmış çıktı varsa iptal edilmiş kısmi asistan metnini transkript geçmişine kalıcılaştırır.
    - Kalıcılaştırılmış girdiler iptal meta verileri içerir; böylece transkript tüketicileri iptal kısımlarını normal tamamlama çıktısından ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve web push

Control UI bir `manifest.webmanifest` ve bir service worker ile gelir; bu nedenle modern tarayıcılar bunu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık değilken bile Gateway'in kurulu PWA'yı bildirimlerle uyandırmasına olanak tanır.

OpenClaw güncellemesinden hemen sonra sayfada **Protocol mismatch** görünürse, önce `openclaw dashboard` ile panoyu yeniden açın ve sayfayı tam yenileyin. Hâlâ başarısız olursa, pano kaynağı için site verilerini temizleyin veya özel tarayıcı penceresinde test edin; eski bir sekme ya da tarayıcı service worker önbelleği, güncelleme öncesi bir Control UI paketini daha yeni Gateway ile çalıştırmaya devam edebilir.

| Yüzey                                                 | Ne yapar                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifesti. Tarayıcılar erişilebilir olduğunda "Uygulamayı yükle" seçeneğini sunar. |
| `ui/public/sw.js`                                     | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw durum dizini altında) | Web Push yüklerini imzalamak için kullanılan otomatik oluşturulmuş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                    | Kalıcı tarayıcı abonelik endpoint'leri.                            |

Anahtarları sabitlemek istediğinizde (çok ana makineli dağıtımlar, gizli anahtar rotasyonu veya testler için) VAPID anahtar çiftini Gateway sürecindeki ortam değişkenleriyle geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılan `https://openclaw.ai`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için şu kapsam kapılı Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID açık anahtarını getirir.
- `push.web.subscribe` — `endpoint` ile `keys.p256dh`/`keys.auth` değerlerini kaydeder.
- `push.web.unsubscribe` — kayıtlı bir endpoint'i kaldırır.
- `push.web.test` — çağıranın aboneliğine test bildirimi gönderir.

<Note>
Web Push, iOS APNS relay yolundan (relay destekli push için bkz. [Yapılandırma](/tr/gateway/configuration)) ve yerel mobil eşleştirmeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Barındırılan yerleştirmeler

Asistan mesajları, `[embed ...]` kısa koduyla barındırılan web içeriğini satır içinde işleyebilir. iframe sandbox politikası `gateway.controlUi.embedSandbox` tarafından denetlenir:

<Tabs>
  <Tab title="strict">
    Barındırılan yerleştirmeler içinde betik yürütmeyi devre dışı bırakır.
  </Tab>
  <Tab title="scripts (default)">
    Kaynak yalıtımını korurken etkileşimli yerleştirmelere izin verir; bu varsayılandır ve genellikle kendi içinde çalışan tarayıcı oyunları/widget'ları için yeterlidir.
  </Tab>
  <Tab title="trusted">
    Bilinçli olarak daha güçlü ayrıcalıklar gerektiren aynı site belgeleri için `allow-scripts` üstüne `allow-same-origin` ekler.
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
`trusted` değerini yalnızca yerleştirilmiş belge gerçekten aynı kaynak davranışına ihtiyaç duyduğunda kullanın. Çoğu agent tarafından oluşturulan oyun ve etkileşimli canvas için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` yerleştirme URL'leri varsayılan olarak engellenmeye devam eder. Bilerek `[embed url="https://..."]` ile üçüncü taraf sayfaları yüklemek istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarını yapın.

## Sohbet mesajı genişliği

Gruplanmış sohbet mesajları okunabilir varsayılan bir maksimum genişlik kullanır. Geniş monitörlü dağıtımlar, paketlenmiş CSS'yi yamamadan `gateway.controlUi.chatMessageMaxWidth` ayarıyla bunu geçersiz kılabilir:

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
    Gateway'i loopback üzerinde tutun ve Tailscale Serve ile HTTPS üzerinden proxy'leyin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Varsayılan olarak, `gateway.auth.allowTailscale` `true` olduğunda Control UI/WebSocket Serve istekleri Tailscale kimlik başlıkları (`tailscale-user-login`) aracılığıyla kimlik doğrulayabilir. OpenClaw, `x-forwarded-for` adresini `tailscale whois` ile çözümleyip başlıkla eşleştirerek kimliği doğrular ve bunları yalnızca istek Tailscale'in `x-forwarded-*` başlıklarıyla loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliğine sahip Control UI operatör oturumlarında, bu doğrulanmış Serve yolu cihaz eşleştirme gidiş gelişini de atlar; cihazsız tarayıcılar ve node rolü bağlantıları normal cihaz denetimlerini izlemeye devam eder. Serve trafiği için bile açık paylaşılan gizli anahtar kimlik bilgilerini zorunlu kılmak istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu asenkron Serve kimlik yolu için aynı istemci IP'si ve kimlik doğrulama kapsamındaki başarısız kimlik doğrulama girişimleri, rate-limit yazımlarından önce sıraya alınır. Bu nedenle aynı tarayıcıdan eşzamanlı hatalı yeniden denemeler, paralel yarışan iki düz eşleşmezlik yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Token'sız Serve kimlik doğrulaması, gateway ana makinesinin güvenilir olduğunu varsayar. Bu ana makinede güvenilmeyen yerel kod çalışabiliyorsa token/parola kimlik doğrulamasını zorunlu kılın.
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

## Güvenli olmayan HTTP

Panoyu düz HTTP üzerinden (`http://<lan-ip>` veya `http://<tailscale-ip>`) açarsanız, tarayıcı **güvenli olmayan bağlamda** çalışır ve WebCrypto'yu engeller. Varsayılan olarak OpenClaw, cihaz kimliği olmayan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost güvenli olmayan HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Control UI kimlik doğrulaması
- acil durum `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI'yi yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway ana makinesinde)

<AccordionGroup>
  <Accordion title="Güvenli olmayan kimlik doğrulama anahtarı davranışı">
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

    - Localhost Control UI oturumlarının güvenli olmayan HTTP bağlamlarında cihaz kimliği olmadan ilerlemesine izin verir.
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
    `dangerouslyDisableDeviceAuth`, Control UI cihaz kimliği denetimlerini devre dışı bırakır ve ciddi bir güvenlik düşürmesidir. Acil kullanım sonrasında hızla geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy notu">
    - Başarılı trusted-proxy kimlik doğrulaması, cihaz kimliği olmadan **operatör** Control UI oturumlarını kabul edebilir.
    - Bu, node rolü Control UI oturumlarına genişletilmez.
    - Aynı ana makine loopback ters proxy'leri yine de trusted-proxy kimlik doğrulamasını karşılamaz; bkz. [Trusted proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberi için bkz. [Tailscale](/tr/gateway/tailscale).

## İçerik güvenliği politikası

Control UI sıkı bir `img-src` politikasıyla gelir: yalnızca **aynı kaynaklı** varlıklara, `data:` URL'lerine ve yerel olarak oluşturulan `blob:` URL'lerine izin verilir. Uzak `http(s)` ve protokole göreli görsel URL'leri tarayıcı tarafından reddedilir ve ağ getirme işlemi başlatmaz.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görseller (örneğin `/avatars/<id>`) işlenmeye devam eder; UI'nin getirip yerel `blob:` URL'lerine dönüştürdüğü kimliği doğrulanmış avatar rotaları dahil.
- Satır içi `data:image/...` URL'leri işlenmeye devam eder (protokol içi yükler için kullanışlıdır).
- Control UI tarafından oluşturulan yerel `blob:` URL'leri işlenmeye devam eder.
- Kanal metadata'sı tarafından yayımlanan uzak avatar URL'leri, Control UI'nin avatar yardımcılarında çıkarılır ve yerleşik logo/rozetle değiştirilir; böylece ele geçirilmiş veya kötü niyetli bir kanal, operatör tarayıcısından keyfi uzak görsel getirmelerini zorlayamaz.

Bu davranışı elde etmek için hiçbir şeyi değiştirmeniz gerekmez — her zaman etkindir ve yapılandırılamaz.

## Avatar rota kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, Control UI avatar endpoint'i API'nin geri kalanıyla aynı gateway token'ını gerektirir:

- `GET /avatar/<agentId>` avatar görselini yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1` avatar metadata'sını aynı kuralla döndürür.
- Her iki rotaya kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla eşleşir). Bu, avatar rotasının aksi halde korunan ana makinelerde agent kimliğini sızdırmasını önler.
- Control UI, avatarları getirirken gateway token'ını bearer başlığı olarak iletir ve görselin panolarda işlenmeye devam etmesi için kimliği doğrulanmış blob URL'leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan ana makinelerde önerilmez), avatar rotası da gateway'in geri kalanıyla uyumlu şekilde kimlik doğrulamasız hâle gelir.

## Asistan medya rota kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, asistan yerel medya önizlemeleri iki adımlı bir rota kullanır:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` normal Control UI operatör kimlik doğrulamasını gerektirir. Tarayıcı, kullanılabilirliği denetlerken gateway token'ını bearer başlığı olarak gönderir.
- Başarılı metadata yanıtları, tam olarak o kaynak yoluna kapsamlanmış kısa ömürlü bir `mediaTicket` içerir.
- Tarayıcıda işlenen görsel, ses, video ve belge URL'leri etkin gateway token'ı veya parolası yerine `mediaTicket=<ticket>` kullanır. Bilet hızla sona erer ve farklı bir kaynağı yetkilendiremez.

Bu, yeniden kullanılabilir gateway kimlik bilgilerini görünür medya URL'lerine koymadan normal medya işlemeyi tarayıcıya yerel medya öğeleriyle uyumlu tutar.

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

Tarayıcı boş bir pano yükler ve DevTools yararlı bir hata göstermiyorsa, bir uzantı veya erken içerik betiği JavaScript modül uygulamasının değerlendirilmesini engellemiş olabilir. Statik sayfa, başlangıçtan sonra `<openclaw-app>` kaydedilmediğinde görünen düz bir HTML kurtarma paneli içerir.

Tarayıcı ortamını değiştirdikten sonra panelin **Tekrar dene** eylemini kullanın veya şu denetimlerden sonra elle yeniden yükleyin:

- Tüm sayfalara enjekte eden uzantıları, özellikle `<all_urls>` içerik betiklerine sahip uzantıları devre dışı bırakın.
- Özel pencere, temiz tarayıcı profili veya başka bir tarayıcı deneyin.
- Gateway'i çalışır durumda tutun ve tarayıcı değişikliğinden sonra aynı pano URL'sini doğrulayın.

## Hata ayıklama/test: dev sunucusu + uzak Gateway

Control UI statik dosyalardır; WebSocket hedefi yapılandırılabilir ve HTTP kaynağından farklı olabilir. Vite dev sunucusunu yerelde, Gateway'i ise başka yerde çalıştırmak istediğinizde bu kullanışlıdır.

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
    - `token`, mümkün olduğunda URL parçası (`#token=...`) üzerinden geçirilmelidir. Parçalar sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca yedek olarak kullanılır ve önyüklemeden hemen sonra temizlenir.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında UI, config veya ortam kimlik bilgilerine geri dönmez. `token` (veya `password`) değerini açıkça sağlayın. Açık kimlik bilgilerinin eksik olması bir hatadır.
    - Gateway TLS arkasındayken (Tailscale Serve, HTTPS proxy vb.) `wss://` kullanın.
    - Tıklama hırsızlığını önlemek için `gatewayUrl` yalnızca üst düzey bir pencerede (gömülü değil) kabul edilir.
    - Genel non-loopback Control UI dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça (tam origin'ler olarak) ayarlamalıdır. Loopback, RFC1918/link-local, `.local`, `.ts.net` veya Tailscale CGNAT ana makinelerinden yapılan özel aynı origin LAN/Tailnet yüklemeleri, Host-header geri dönüşü etkinleştirilmeden kabul edilir.
    - Gateway başlatma, etkin çalışma zamanı bağlama adresi ve portundan `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel origin'leri ekebilir, ancak uzak tarayıcı origin'leri yine de açık girdiler gerektirir.
    - Sıkı denetlenen yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, "kullandığım ana makineyle eşleştir" değil, herhangi bir tarayıcı origin'ine izin ver anlamına gelir.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`, Host-header origin geri dönüş modunu etkinleştirir, ancak bu tehlikeli bir güvenlik modudur.

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
