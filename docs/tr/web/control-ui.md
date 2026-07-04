---
read_when:
    - Gateway'i bir tarayıcıdan çalıştırmak istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı kontrol kullanıcı arayüzü (sohbet, etkinlik, düğümler, yapılandırma)
title: Kontrol Arayüzü
x-i18n:
    generated_at: "2026-07-04T20:41:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 883e951b304a104a5cb2d0197199d06e372b1b8a25efdfd082ae190575bf409d
    source_path: web/control-ui.md
    workflow: 16
---

Kontrol Arayüzü, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfa uygulamasıdır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` değerini ayarlayın (örn. `/openclaw`)

Aynı port üzerinden **doğrudan Gateway WebSocket** ile iletişim kurar.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenmezse önce Gateway'i başlatın: `openclaw gateway`.

<Note>
Yerel Windows LAN bağlamalarında, Gateway ana makinesinde `127.0.0.1` çalışsa bile Windows Güvenlik Duvarı veya kuruluş tarafından yönetilen Grup İlkesi duyurulan LAN URL'sini yine de engelleyebilir. Windows ana makinesinde `openclaw gateway status --deep` çalıştırın; olası engellenmiş portları, profil uyuşmazlıklarını ve ilkenin yok sayabileceği yerel güvenlik duvarı kurallarını raporlar.
</Note>

Kimlik doğrulama, WebSocket el sıkışması sırasında şunlar aracılığıyla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik başlıkları
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir proxy kimlik başlıkları

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçili Gateway URL'si için bir token tutar; parolalar kalıcı olarak saklanmaz. Onboarding genellikle ilk bağlantıda paylaşılan gizli anahtar kimlik doğrulaması için bir Gateway token'ı oluşturur, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Kontrol Arayüzü'ne yeni bir tarayıcıdan veya cihazdan bağlandığınızda, Gateway genellikle **tek seferlik eşleştirme onayı** ister. Bu, yetkisiz erişimi önlemeye yönelik bir güvenlik önlemidir.

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

Tarayıcı, değişmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/genel anahtar) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve erişimini okuma erişiminden yazma/yönetici erişimine değiştirirseniz bu, sessiz bir yeniden bağlantı değil, onay yükseltmesi olarak değerlendirilir. OpenClaw eski onayı etkin tutar, daha geniş yeniden bağlantıyı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

`openclaw_gateway` adaptörü üzerinden bağlanan Paperclip ajanları aynı ilk çalıştırma onay akışını kullanır. İlk bağlantı girişiminden sonra, bekleyen isteği önizlemek için `openclaw devices approve --latest` çalıştırın, ardından onaylamak için yazdırılan `openclaw devices approve <requestId>` komutunu yeniden çalıştırın. Uzak bir Gateway için açık `--url` ve `--token` değerleri geçirin. Yeniden başlatmalar arasında onayları kararlı tutmak için, her çalıştırmada yeni bir geçici cihaz kimliği oluşturmasına izin vermek yerine Paperclip içinde kalıcı bir `adapterConfig.devicePrivateKeyPem` yapılandırın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik olarak onaylanır.
- Tailscale Serve, `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı cihaz kimliğini sunduğunda Kontrol Arayüzü operatör oturumları için eşleştirme turunu atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği oluşturur; bu nedenle tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

</Note>

## Bir mobil cihaz eşleştirme

Zaten eşleştirilmiş bir yönetici, terminal açmadan iOS/Android bağlantı QR kodunu oluşturabilir:

<Steps>
  <Step title="Mobil eşleştirmeyi aç">
    **Düğümler**'i seçin, ardından **Cihazlar** kartında **Mobil cihaz eşleştir**'e tıklayın.
  </Step>
  <Step title="Telefonu bağla">
    OpenClaw mobil uygulamasında **Ayarlar** → **Gateway** bölümünü açın ve QR
    kodunu tarayın. Bunun yerine kurulum kodunu kopyalayıp yapıştırabilirsiniz.
  </Step>
  <Step title="Bağlantıyı onayla">
    Resmi iOS/Android uygulaması otomatik olarak bağlanır. **Cihazlar** bekleyen
    bir istek gösteriyorsa, onaylamadan önce rolünü ve kapsamlarını inceleyin.
  </Step>
</Steps>

Kurulum kodu oluşturmak `operator.admin` gerektirir; buna sahip olmayan
oturumlarda düğme devre dışıdır. Kurulum kodu kısa ömürlü bir önyükleme kimlik bilgisi
içerir, bu nedenle QR kodu ve kopyalanan kod geçerli oldukları süre boyunca bir parola gibi ele alınmalıdır. Uzak
eşleştirme için Gateway `wss://` olarak çözümlenmelidir (örneğin Tailscale
Serve/Funnel üzerinden); düz `ws://` loopback ve özel LAN adresleriyle sınırlıdır.
Tam güvenlik ve geri dönüş ayrıntıları için [Eşleştirme](/tr/channels/pairing#pair-from-the-control-ui-recommended) bölümüne bakın.

## Kişisel kimlik (tarayıcı yerelinde)

Kontrol Arayüzü, paylaşılan oturumlarda atıf için giden iletilere eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Tarayıcı depolamasında bulunur, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz iletilerdeki normal transcript yazarlık meta verileri dışında diğer cihazlara eşitlenmez veya sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya tarayıcı değiştirmek bunu boşa sıfırlar.

Aynı tarayıcı yerelindeki desen, asistan avatarı geçersiz kılması için de geçerlidir. Yüklenen asistan avatarları yalnızca yerel tarayıcıda Gateway tarafından çözümlenen kimliğin üzerine bindirilir ve hiçbir zaman `config.patch` üzerinden gidiş dönüş yapmaz. Paylaşılan `ui.assistant.avatar` yapılandırma alanı, alanı doğrudan yazan UI dışı istemciler (betikli Gateway'ler veya özel panolar gibi) için hâlâ kullanılabilir.

## Çalışma zamanı yapılandırma endpoint'i

Kontrol Arayüzü, çalışma zamanı ayarlarını Gateway'in Kontrol Arayüzü temel yoluna göre çözümlenen `/control-ui-config.json` adresinden alır (örneğin UI `/__openclaw__/` altında sunulduğunda `/__openclaw__/control-ui-config.json`). Bu endpoint, HTTP yüzeyinin geri kalanıyla aynı Gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar bunu alamaz ve başarılı bir alma işlemi, zaten geçerli bir Gateway token'ı/parolası, Tailscale Serve kimliği veya güvenilir proxy kimliği gerektirir.

## Dil desteği

Kontrol Arayüzü, ilk yüklemede tarayıcı yerel ayarınıza göre kendisini yerelleştirebilir. Daha sonra geçersiz kılmak için **Genel Bakış -> Gateway Erişimi -> Dil** bölümünü açın. Yerel ayar seçici, Görünüm altında değil Gateway Erişimi kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışındaki çeviriler tarayıcıda tembel yüklenir.
- Seçili yerel ayar tarayıcı depolamasına kaydedilir ve sonraki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Doküman çevirileri aynı İngilizce dışı yerel ayar kümesi için oluşturulur, ancak doküman sitesinin yerleşik Mintlify dil seçicisi Mintlify'nin kabul ettiği yerel ayar kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) dokümanlar yayın deposunda hâlâ oluşturulur; Mintlify bu kodları destekleyene kadar bu seçicide görünmeyebilir.

## Görünüm temaları

Görünüm paneli, yerleşik Claw, Knot ve Dash temalarının yanı sıra bir tarayıcı yerelindeki tweakcn içe aktarma yuvasını tutar. Bir tema içe aktarmak için [tweakcn editor](https://tweakcn.com/editor/theme) sayfasını açın, bir tema seçin veya oluşturun, **Paylaş**'a tıklayın ve kopyalanan tema bağlantısını Görünüm'e yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` kayıt URL'lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi editör URL'lerini, göreli `/themes/<id>` yollarını, ham tema kimliklerini ve `amethyst-haze` gibi varsayılan tema adlarını kabul eder.

Görünüm ayrıca tarayıcı yerelinde bir Metin boyutu ayarı içerir. Ayar, Kontrol Arayüzü tercihlerinin geri kalanıyla birlikte saklanır; sohbet metnine, oluşturucu metnine, araç kartlarına ve sohbet kenar çubuklarına uygulanır ve mobil Safari'nin odakta otomatik yakınlaştırma yapmaması için metin girişlerini en az 16px tutar.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde saklanır. Gateway yapılandırmasına yazılmaz ve cihazlar arasında eşitlenmez. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; temizlemek, içe aktarılan tema seçiliyse etkin temayı Claw'a geri döndürür.

## Neler yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Sohbet geçmişi yenilemeleri, büyük oturumların sohbet kullanılabilir hale gelmeden önce tarayıcıyı tam transcript yükünü işlemeye zorlamaması için ileti başına metin sınırlarıyla sınırlı bir yakın geçmiş penceresi ister.
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden kısıtlı tek kullanımlık tarayıcı token'ı kullanır ve yalnızca backend gerçek zamanlı ses Plugin'leri Gateway aktarma taşımasını kullanır. İstemciye ait sağlayıcı oturumları `talk.client.create` ile başlar; Gateway aktarma oturumları `talk.session.create` ile başlar. Aktarma, tarayıcı `talk.session.appendAudio` üzerinden mikrofon PCM akışı gönderirken sağlayıcı kimlik bilgilerini Gateway üzerinde tutar, `openclaw_agent_consult` sağlayıcı araç çağrılarını Gateway ilkesi ve daha büyük yapılandırılmış OpenClaw modeli için `talk.client.toolCall` üzerinden iletir ve etkin çalışma ses yönlendirmesini `talk.client.steer` veya `talk.session.steer` üzerinden yönlendirir.
    - Araç çağrılarını ve canlı araç çıktı kartlarını Sohbet içinde akışla gösterin (ajan olayları).
    - Mevcut `session.tool` / araç olay tesliminden canlı araç etkinliğinin tarayıcı yerelinde, önce redaksiyonlu özetlerini içeren Etkinlik sekmesi.

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, rüyalar">
    - Kanallar: yerleşik ve paketlenmiş/harici Plugin kanallarının durumu, QR oturum açma ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`).
    - Kanal yoklama yenilemeleri, yavaş sağlayıcı kontrolleri tamamlanırken önceki anlık görüntüyü görünür tutar ve bir yoklama veya denetim UI bütçesini aştığında kısmi anlık görüntüler etiketlenir.
    - Örnekler: varlık listesi + yenileme (`system-presence`).
    - Oturumlar: varsayılan olarak yapılandırılmış ajan oturumlarını listeleyin, sık kullanılan oturumları sabitleyin, yeniden adlandırın, etkin olmayan oturumları arşivleyin veya geri yükleyin, eski yapılandırılmamış ajan oturum anahtarlarından geri dönün ve oturum başına model/düşünme/hızlı/ayrıntılı/izleme/akıl yürütme geçersiz kılmalarını uygulayın (`sessions.list`, `sessions.patch`). Sabitlenmiş oturumlar son sabitlenmemiş oturumların üstünde sıralanır; arşivlenmiş oturumlar Oturumlar sayfasının arşivlenmiş görünümünde bulunur ve transcript'lerini korur.
    - Rüyalar: dreaming durumu, etkinleştirme/devre dışı bırakma anahtarı ve Dream Diary okuyucusu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, düğümler, exec onayları">
    - Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalışma geçmişi (`cron.*`).
    - Skills: durum, etkinleştirme/devre dışı bırakma, yükleme, API anahtarı güncellemeleri (`skills.*`).
    - Düğümler: liste + yetenekler (`node.list`), mobil kurulum kodları oluşturma ve cihaz eşleştirmeyi onaylama (`device.pair.*`).
    - Exec onayları: Gateway veya düğüm izin listelerini düzenleyin + `exec host=gateway/node` için sorma ilkesi (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - `~/.openclaw/openclaw.json` dosyasını görüntüleyin/düzenleyin (`config.get`, `config.set`).
    - MCP, yapılandırılmış sunucular, etkinleştirme, OAuth/filtre/paralel özetleri, yaygın operatör komutları ve kapsamı belirlenmiş `mcp` yapılandırma düzenleyicisi için ayrılmış bir ayarlar sayfasına sahiptir.
    - Doğrulamayla birlikte uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazma işlemleri, eşzamanlı düzenlemelerin üzerine yazılmasını önlemek için bir temel hash koruması içerir.
    - Yazma işlemleri (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma yükündeki ref’ler için etkin SecretRef çözümlemesini ön kontrolden geçirir; çözümlenemeyen etkin gönderilmiş ref’ler yazmadan önce reddedilir.
    - Form kayıtları, kaydedilmiş yapılandırmadan geri yüklenemeyen eski maskelenmiş yer tutucuları atarken, hâlâ kayıtlı gizli değerlere eşleşen maskelenmiş değerleri korur.
    - Şema + form işleme (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, doğrudan alt özetler, iç içe nesne/joker karakter/dizi/bileşim düğümlerinde doküman meta verileri ve kullanılabildiğinde Plugin + kanal şemaları dahil); Raw JSON düzenleyicisi yalnızca anlık görüntü güvenli bir ham gidiş-dönüşe sahipse kullanılabilir.
    - Bir anlık görüntü ham metni güvenli şekilde gidiş-dönüş yapamıyorsa, Control UI Form modunu zorunlu kılar ve bu anlık görüntü için Raw modunu devre dışı bırakır.
    - Raw JSON düzenleyicisindeki "Kaydedilene sıfırla", düzleştirilmiş bir anlık görüntüyü yeniden işlemek yerine ham olarak yazılmış şekli (biçimlendirme, yorumlar, `$include` yerleşimi) korur; böylece anlık görüntü güvenli şekilde gidiş-dönüş yapabildiğinde dış düzenlemeler sıfırlama sonrasında da kalır.
    - Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizgeye bozulmayı önlemek için form metin girişlerinde salt okunur işlenir.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Hata ayıklama: durum/sağlık/modeller anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Olay günlüğü; Control UI yenileme/RPC zamanlamalarını, yavaş sohbet/yapılandırma işleme zamanlamalarını ve tarayıcı bu PerformanceObserver giriş türlerini sunduğunda uzun animasyon kareleri veya uzun görevler için tarayıcı yanıt verebilirliği girişlerini içerir.
    - Günlükler: filtre/dışa aktarma ile gateway dosya günlüklerinin canlı kuyruğu (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla birlikte paket/git güncellemesi + yeniden başlatma çalıştırın (`update.run`), ardından çalışan gateway sürümünü doğrulamak için yeniden bağlandıktan sonra `update.status` sorgulayın.

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - Yalıtılmış işler için teslim varsayılanı özet duyurusudur. Yalnızca dahili çalıştırmalar istiyorsanız bunu hiçbiri olarak değiştirebilirsiniz.
    - Duyuru seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) webhook URL’sine ayarlanmışken `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için webhook ve hiçbiri teslim modları kullanılabilir.
    - Gelişmiş düzenleme kontrolleri; çalıştırmadan sonra silme, ajan geçersiz kılmasını temizleme, cron kesin/kademeli seçenekleri, ajan model/düşünme geçersiz kılmaları ve en iyi çaba teslim anahtarlarını içerir.
    - Form doğrulaması, alan düzeyi hatalarla satır içidir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Ayrılmış bir bearer token göndermek için `cron.webhookToken` ayarlayın; atlanırsa webhook kimlik doğrulama başlığı olmadan gönderilir.
    - Kullanımdan kaldırılmış geri dönüş: `notify: true` içeren kayıtlı eski işleri `cron.webhook` üzerinden açık iş başına webhook veya tamamlama teslimine geçirmek için `openclaw doctor --fix` çalıştırın.

  </Accordion>
</AccordionGroup>

## MCP sayfası

Ayrılmış MCP sayfası, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucuları için bir operatör görünümüdür. MCP aktarımlarını kendi başına başlatmaz; kayıtlı yapılandırmayı incelemek ve düzenlemek için kullanın, ardından canlı sunucu kanıtı gerektiğinde `openclaw mcp doctor --probe` kullanın.

Tipik iş akışı:

1. Kenar çubuğundan **MCP** açın.
2. Toplam, etkin, OAuth ve filtrelenmiş sunucu sayıları için özet kartlarını kontrol edin.
3. Her sunucu satırını aktarım, etkinleştirme, kimlik doğrulama, filtreler, zaman aşımları ve komut ipuçları açısından gözden geçirin.
4. Bir sunucunun yapılandırılmış kalıp çalışma zamanı keşfinin dışında kalması gerekiyorsa etkinleştirmeyi değiştirin.
5. Sunucu tanımları, başlıklar, TLS/mTLS yolları, OAuth meta verileri, araç filtreleri ve Codex projeksiyon meta verileri için kapsamı belirlenmiş `mcp` yapılandırma bölümünü düzenleyin.
6. Yapılandırma yazımı için **Kaydet** kullanın veya çalışan Gateway değişen yapılandırmayı uygulamalıysa **Kaydet ve Yayımla** kullanın.
7. Düzenlenen sürecin statik tanılamaya, canlı kanıta veya önbelleğe alınmış çalışma zamanının atılmasına ihtiyacı olduğunda bir terminalden `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` veya `openclaw mcp reload` çalıştırın.

Sayfa, kimlik bilgisi taşıyan URL benzeri değerleri işlemeden önce maskeler ve komut parçacıklarında sunucu adlarını tırnak içine alır; böylece kopyalanan komutlar boşluklar veya kabuk meta karakterleriyle de çalışır. Tam CLI ve yapılandırma başvurusu [MCP](/tr/cli/mcp) bölümündedir.

## Etkinlik sekmesi

Etkinlik sekmesi, canlı araç etkinliği için geçici, tarayıcıya yerel bir gözlemcidir. Sohbet araç kartlarını besleyen aynı Gateway `session.tool` / araç olay akışından türetilir; başka bir Gateway olay ailesi, uç nokta, kalıcı etkinlik deposu, metrik akışı veya dış gözlemci akışı eklemez.

Etkinlik girişleri yalnızca temizlenmiş özetleri ve maskelenmiş, kısaltılmış çıktı önizlemelerini tutar. Araç argümanı değerleri Etkinlik durumunda saklanmaz; UI, argümanların gizli olduğunu gösterir ve yalnızca argüman alanı sayısını kaydeder. Bellek içi liste geçerli tarayıcı sekmesini izler, Control UI içinde gezinme sırasında korunur ve sayfa yeniden yüklemede, oturum değişiminde veya **Temizle** ile sıfırlanır.

## Sohbet davranışı

<AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` **engellemesizdir**: hemen `{ runId, status: "started" }` ile onay verir ve yanıt `chat` olayları üzerinden akar. Güvenilir Control UI istemcileri yerel tanılama için isteğe bağlı ACK zamanlama meta verileri de alabilir.
    - Sohbet yüklemeleri görüntüleri ve video olmayan dosyaları kabul eder. Görüntüler yerel görüntü yolunu korur; diğer dosyalar yönetilen medya olarak saklanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden gönderme, çalışırken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları UI güvenliği için boyut sınırlıdır. Transkript girişleri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır meta veri bloklarını atlayabilir ve aşırı büyük iletileri bir yer tutucuyla değiştirebilir (`[chat.history omitted: message too large]`).
    - Görünür bir asistan iletisi `chat.history` içinde kısaltıldığında, yan okuyucu gerektiğinde `sessionKey`, gerekiyorsa etkin `agentId` ve transkript `messageId` ile `chat.message.get` üzerinden tam, görüntüleme-normalize edilmiş transkript girişini alabilir. Gateway hâlâ daha fazlasını döndüremiyorsa okuyucu, kısaltılmış önizlemeyi sessizce tekrarlamak yerine açık bir kullanılamaz durum gösterir.
    - Asistan/oluşturulan görüntüler yönetilen medya referansları olarak kalıcılaştırılır ve kimliği doğrulanmış Gateway medya URL’leri üzerinden geri sunulur; bu nedenle yeniden yüklemeler ham base64 görüntü yüklerinin sohbet geçmişi yanıtında kalmasına bağlı değildir.
    - `chat.history` işlenirken Control UI, görünür asistan metninden yalnızca görüntüleme amaçlı satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model kontrol token’larını ayıklar; ayrıca tüm görünür metni yalnızca tam sessiz token `NO_REPLY` / `no_reply` veya Heartbeat onay token’ı `HEARTBEAT_OK` olan asistan girişlerini atlar.
    - Etkin bir gönderim ve son geçmiş yenilemesi sırasında, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürürse sohbet görünümü yerel iyimser kullanıcı/asistan iletilerini görünür tutar; Gateway geçmişi yakaladığında kanonik transkript bu yerel iletilerin yerini alır.
    - Canlı `chat` olayları teslim durumudur; `chat.history` ise kalıcı oturum transkriptinden yeniden oluşturulur. Araç-son olaylarından sonra Control UI geçmişi yeniden yükler ve yalnızca küçük bir iyimser kuyruğu birleştirir; transkript sınırı [WebChat](/tr/web/webchat) içinde belgelenmiştir.
    - `chat.inject`, oturum transkriptine bir asistan notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (ajan çalıştırması yok, kanal teslimi yok).
    - Kenar çubuğu, Yeni Oturum eylemi, Tüm Oturumlar bağlantısı ve tam oturum seçiciyi açan bir oturum arama düğmesiyle son oturumları listeler (seçilen ajana göre kapsamlı, arama ve sayfalandırma ile). Ajan değiştirmek yalnızca o ajana bağlı oturumları gösterir ve henüz kayıtlı pano oturumları yoksa o ajanın ana oturumuna geri döner.
    - Her oturum seçici satırı oturumu yeniden adlandırabilir, sabitleyebilir veya arşivleyebilir. Etkin bir çalıştırma ve bir ajanın ana oturumu arşivlenemez. Geçerli seçili oturumu arşivlemek Sohbet’i o ajanın ana oturumuna geri geçirir.
    - Masaüstü genişliklerinde sohbet kontrolleri tek bir kompakt satırda kalır ve transkriptte aşağı kaydırırken daralır; yukarı kaydırmak, üste dönmek veya en alta ulaşmak kontrolleri geri getirir.
    - Ardışık yinelenen yalnızca metin iletileri, sayı rozetiyle tek balon olarak işlenir. Görüntü, ek, araç çıktısı veya canvas önizlemesi taşıyan iletiler daraltılmaz.
    - Sohbet başlığı model ve düşünme seçicileri, etkin oturumu `sessions.patch` üzerinden hemen yamalar; bunlar tek turluk gönderim seçenekleri değil, kalıcı oturum geçersiz kılmalarıdır.
    - Aynı oturum için bir model seçici değişikliği hâlâ kaydedilirken ileti gönderirseniz, besteci `chat.send` çağırmadan önce o oturum yamasını bekler; böylece gönderim seçilen modeli kullanır.
    - Control UI içinde `/new` yazmak, `session.dmScope: "main"` yapılandırılmış ve geçerli üst öğe ajanın ana oturumu olmadıkça Yeni Sohbet ile aynı yeni pano oturumunu oluşturur ve ona geçer; bu durumda ana oturumu yerinde sıfırlar. `/reset` yazmak, geçerli oturum için Gateway’in açık yerinde sıfırlamasını korur.
    - Sohbet model seçici, Gateway’in yapılandırılmış model görünümünü ister. `agents.defaults.models` varsa, seçiciyi bu izin listesi yönlendirir; sağlayıcı kapsamlı katalogları dinamik tutan `provider/*` girişleri dahil. Aksi halde seçici, açık `models.providers.*.models` girişlerini ve kullanılabilir kimlik doğrulaması olan sağlayıcıları gösterir. Tam katalog, `view: "all"` ile hata ayıklama `models.list` RPC’si üzerinden kullanılabilir kalır.
    - Taze Gateway oturum kullanım raporları geçerli bağlam token’larını içerdiğinde, sohbet besteci araç çubuğu kullanılan yüzdeyle küçük bir bağlam kullanım halkası gösterir; tam token ayrıntısı ipucunda yer alır. Halka, yüksek bağlam baskısında uyarı stiline geçer ve önerilen Compaction düzeylerinde normal oturum Compaction yolunu çalıştıran kompakt bir düğme gösterir. Eski token anlık görüntüleri, Gateway yeniden taze kullanım bildirene kadar gizlenir.

  </Accordion>
  <Accordion title="Talk mode (browser realtime)">
    Konuşma modu, kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. OpenAI’yi `talk.realtime.provider: "openai"` ile birlikte bir `openai` API anahtarı kimlik doğrulama profili, `talk.realtime.providers.openai.apiKey` veya `OPENAI_API_KEY` ile yapılandırın; OpenAI OAuth profilleri Realtime sesi yapılandırmaz. Google’ı `talk.realtime.provider: "google"` ile birlikte `talk.realtime.providers.google.apiKey` ile yapılandırın. Tarayıcı hiçbir zaman standart bir sağlayıcı API anahtarı almaz. OpenAI, WebRTC için geçici bir Realtime istemci sırrı alır. Google Live, Gateway tarafından token içine kilitlenmiş talimatlar ve araç bildirimleriyle, tarayıcı WebSocket oturumu için tek kullanımlık kısıtlı bir Live API kimlik doğrulama token’ı alır. Yalnızca backend gerçek zamanlı köprüsü sunan sağlayıcılar Gateway relay aktarımı üzerinden çalışır; böylece tarayıcı sesi kimliği doğrulanmış Gateway RPC’leri üzerinden taşınırken kimlik bilgileri ve satıcı soketleri sunucu tarafında kalır. Realtime oturum istemi Gateway tarafından birleştirilir; `talk.client.create` çağıran tarafından sağlanan talimat geçersiz kılmalarını kabul etmez.

    Chat oluşturucusunda, Talk başlat/durdur düğmesinin yanında bir Talk seçenekleri düğmesi bulunur. Seçenekler bir sonraki Talk oturumu için geçerlidir ve sağlayıcıyı, aktarımı, modeli, sesi, akıl yürütme çabasını, VAD eşiğini, sessizlik süresini ve önek dolgusunu geçersiz kılabilir. Bir seçenek boş olduğunda, Gateway varsa yapılandırılmış varsayılanları veya sağlayıcı varsayılanını kullanır. Gateway relay seçildiğinde arka uç relay yolu zorlanır; WebRTC seçildiğinde oturum istemci sahipliğinde kalır ve sağlayıcı bir tarayıcı oturumu oluşturamazsa sessizce relay'e geri dönmek yerine başarısız olur.

    Chat oluşturucusunda Talk kontrolü, mikrofon dikte düğmesinin yanındaki dalgalar düğmesidir. Talk başladığında, oluşturucu durum satırı önce `Connecting Talk...`, ardından ses bağlıyken `Talk live` veya gerçek zamanlı bir araç çağrısı `talk.client.toolCall` üzerinden yapılandırılmış daha büyük modele danışırken `Asking OpenClaw...` gösterir.

    Maintainer canlı smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`, OpenAI arka uç WebSocket köprüsünü, OpenAI tarayıcı WebRTC SDP değişimini, Google Live kısıtlı token tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway relay tarayıcı adaptörünü doğrular. Komut yalnızca sağlayıcı durumunu yazdırır ve gizli bilgileri günlüğe kaydetmez.

  </Accordion>
  <Accordion title="Durdur ve iptal et">
    - **Stop**'a tıklayın (`chat.abort` çağırır).
    - Bir çalıştırma etkinken normal takip iletileri kuyruğa alınır. Bu takibi çalışan tura enjekte etmek için kuyruğa alınmış bir iletide **Steer**'e tıklayın.
    - Bant dışı iptal etmek için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi tek başına iptal ifadeleri).
    - `chat.abort`, o oturumdaki tüm etkin çalıştırmaları iptal etmek için `{ sessionKey }` desteği sunar (`runId` olmadan).

  </Accordion>
  <Accordion title="Kısmi iptal saklama">
    - Bir çalıştırma iptal edildiğinde, kısmi assistant metni UI'da hâlâ gösterilebilir.
    - Gateway, tamponlanmış çıktı varsa iptal edilen kısmi assistant metnini transkript geçmişine kalıcı olarak yazar.
    - Kalıcı girdiler iptal meta verisi içerir; böylece transkript tüketicileri iptal kısımlarını normal tamamlama çıktısından ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve web push

Control UI bir `manifest.webmanifest` ve bir service worker ile gelir; böylece modern tarayıcılar onu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık olmasa bile Gateway'in kurulu PWA'yı bildirimlerle uyandırmasını sağlar.

Bir OpenClaw güncellemesinden hemen sonra sayfa **Protokol uyuşmazlığı** gösterirse, önce `openclaw dashboard` ile panoyu yeniden açın ve sayfayı hard-refresh yapın. Hâlâ başarısız olursa, pano origin'i için site verilerini temizleyin veya özel bir tarayıcı penceresinde test edin; eski bir sekme veya tarayıcı service-worker önbelleği, daha yeni Gateway'e karşı güncelleme öncesi bir Control UI paketini çalıştırmaya devam edebilir.

| Yüzey                                                 | Ne yapar                                                          |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | PWA manifest'i. Erişilebilir olduğunda tarayıcılar "Install app" sunar. |
| `ui/public/sw.js`                                     | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw state dir altında)   | Web Push yüklerini imzalamak için kullanılan otomatik oluşturulmuş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                    | Kalıcı tarayıcı abonelik endpoint'leri.                           |

Anahtarları sabitlemek istediğinizde (çok makineli dağıtımlar, gizli bilgi rotasyonu veya testler için) VAPID anahtar çiftini Gateway sürecinde env vars ile geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılanı `https://openclaw.ai`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için bu kapsam kapılı Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID public key'i getirir.
- `push.web.subscribe` — bir `endpoint` ile `keys.p256dh`/`keys.auth` kaydeder.
- `push.web.unsubscribe` — kayıtlı bir endpoint'i kaldırır.
- `push.web.test` — çağıranın aboneliğine bir test bildirimi gönderir.

<Note>
Web Push, iOS APNS relay yolundan (relay destekli push için bkz. [Yapılandırma](/tr/gateway/configuration)) ve yerel mobil eşleştirmeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Barındırılan yerleştirmeler

Assistant iletileri, `[embed ...]` shortcode'u ile barındırılan web içeriğini satır içinde render edebilir. iframe sandbox ilkesi `gateway.controlUi.embedSandbox` tarafından denetlenir:

<Tabs>
  <Tab title="strict">
    Barındırılan yerleştirmelerin içinde script yürütmeyi devre dışı bırakır.
  </Tab>
  <Tab title="scripts (default)">
    Origin izolasyonunu korurken etkileşimli yerleştirmelere izin verir; bu varsayılandır ve genellikle kendi kendine yeterli tarayıcı oyunları/widget'ları için yeterlidir.
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
`trusted` yalnızca yerleştirilmiş belge gerçekten same-origin davranışına ihtiyaç duyduğunda kullanılmalıdır. Çoğu agent tarafından oluşturulan oyun ve etkileşimli canvas için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` yerleştirme URL'leri varsayılan olarak engelli kalır. Bilerek `[embed url="https://..."]` öğesinin üçüncü taraf sayfaları yüklemesini istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Chat ileti genişliği

Gruplanmış chat iletileri okunabilir bir varsayılan max-width kullanır. Geniş monitör dağıtımları, paketlenmiş CSS'i yamamadan `gateway.controlUi.chatMessageMaxWidth` ayarlayarak bunu geçersiz kılabilir:

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
    Gateway'i loopback üzerinde tutun ve Tailscale Serve'ün onu HTTPS ile proxy'lemesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Varsayılan olarak Control UI/WebSocket Serve istekleri, `gateway.auth.allowTailscale` `true` olduğunda Tailscale kimlik başlıkları (`tailscale-user-login`) üzerinden kimlik doğrulayabilir. OpenClaw, `x-forwarded-for` adresini `tailscale whois` ile çözerek ve başlıkla eşleştirerek kimliği doğrular; bunları yalnızca istek Tailscale'in `x-forwarded-*` başlıklarıyla loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliğine sahip Control UI operatör oturumları için bu doğrulanmış Serve yolu cihaz eşleştirme gidiş dönüşünü de atlar; cihazsız tarayıcılar ve node-role bağlantıları normal cihaz kontrollerini izlemeye devam eder. Serve trafiği için bile açık paylaşılan gizli kimlik bilgileri gerektirmek istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu async Serve kimlik yolu için, aynı istemci IP'si ve auth kapsamına ait başarısız auth denemeleri rate-limit yazımlarından önce serileştirilir. Bu nedenle aynı tarayıcıdan eşzamanlı kötü yeniden denemeler, paralel yarışan iki düz uyuşmazlık yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Tokensiz Serve auth, gateway host'unun güvenilir olduğunu varsayar. Bu host üzerinde güvenilmeyen yerel kod çalışabiliyorsa token/password auth gerektirin.
    </Warning>

  </Tab>
  <Tab title="Tailnet'e bağla + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ardından açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Eşleşen paylaşılan gizli bilgiyi UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvensiz HTTP

Panoyu düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`), tarayıcı **güvenli olmayan bağlamda** çalışır ve WebCrypto'yu engeller. Varsayılan olarak OpenClaw, cihaz kimliği olmayan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Control UI auth
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI'ı yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway host'unda)

<AccordionGroup>
  <Accordion title="Güvensiz-auth toggle davranışı">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` yalnızca yerel bir uyumluluk toggle'ıdır:

    - Localhost Control UI oturumlarının güvenli olmayan HTTP bağlamlarında cihaz kimliği olmadan devam etmesine izin verir.
    - Eşleştirme kontrollerini atlamaz.
    - Uzak (localhost olmayan) cihaz kimliği gereksinimlerini gevşetmez.

  </Accordion>
  <Accordion title="Yalnızca break-glass">
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
    `dangerouslyDisableDeviceAuth`, Control UI cihaz kimliği kontrollerini devre dışı bırakır ve ciddi bir güvenlik düşüşüdür. Acil kullanım sonrası hızla geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy notu">
    - Başarılı trusted-proxy auth, cihaz kimliği olmadan **operatör** Control UI oturumlarını kabul edebilir.
    - Bu, node-role Control UI oturumlarına genişletilmez.
    - Aynı host loopback reverse proxy'leri yine de trusted-proxy auth gereksinimini karşılamaz; bkz. [Trusted proxy auth](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberi için bkz. [Tailscale](/tr/gateway/tailscale).

## Content security policy

Control UI sıkı bir `img-src` ilkesiyle gelir: yalnızca **same-origin** varlıklar, `data:` URL'leri ve yerel olarak oluşturulmuş `blob:` URL'lerine izin verilir. Uzak `http(s)` ve protokol göreli görüntü URL'leri tarayıcı tarafından reddedilir ve ağ fetch'i başlatmaz.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görüntüler (örneğin `/avatars/<id>`) render edilmeye devam eder; UI'ın getirip yerel `blob:` URL'lere dönüştürdüğü kimlik doğrulamalı avatar rotaları dahil.
- Satır içi `data:image/...` URL'leri render edilmeye devam eder (protokol içi yükler için kullanışlıdır).
- Control UI tarafından oluşturulan yerel `blob:` URL'leri render edilmeye devam eder.
- Kanal meta verilerinin yaydığı uzak avatar URL'leri Control UI'ın avatar yardımcılarında çıkarılır ve yerleşik logo/rozet ile değiştirilir; böylece ele geçirilmiş veya kötü amaçlı bir kanal, operatör tarayıcısından rastgele uzak görüntü fetch'leri zorlayamaz.

Bu davranışı elde etmek için hiçbir şeyi değiştirmeniz gerekmez — her zaman açıktır ve yapılandırılamaz.

## Avatar rota auth

Gateway auth yapılandırıldığında, Control UI avatar endpoint'i API'nin geri kalanıyla aynı gateway token'ını gerektirir:

- `GET /avatar/<agentId>` avatar görüntüsünü yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1` aynı kural altında avatar meta verisini döndürür.
- Her iki rotaya kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla eşleşir). Bu, avatar rotasının aksi halde korunan host'larda agent kimliğini sızdırmasını engeller.
- Control UI, avatarları getirirken gateway token'ını bearer başlığı olarak iletir ve görüntünün panolarda hâlâ render edilmesi için kimlik doğrulamalı blob URL'leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan ana makinelerde önerilmez), avatar rotası da Gateway'in geri kalanıyla uyumlu şekilde kimlik doğrulamasız hale gelir.

## Asistan medya rotası kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, asistan yerel medya önizlemeleri iki adımlı bir rota kullanır:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` normal Control UI operatör kimlik doğrulamasını gerektirir. Tarayıcı, kullanılabilirliği denetlerken Gateway belirtecini bearer üst bilgisi olarak gönderir.
- Başarılı meta veri yanıtları, tam olarak o kaynak yoluna kapsamlandırılmış kısa ömürlü bir `mediaTicket` içerir.
- Tarayıcıda işlenen görüntü, ses, video ve belge URL'leri etkin Gateway belirteci veya parolası yerine `mediaTicket=<ticket>` kullanır. Bilet hızla sona erer ve farklı bir kaynağı yetkilendiremez.

Bu, yeniden kullanılabilir Gateway kimlik bilgilerini görünür medya URL'lerine koymadan normal medya işlemeyi tarayıcı yerel medya öğeleriyle uyumlu tutar.

## UI'yı derleme

Gateway, statik dosyaları `dist/control-ui` konumundan sunar. Bunları şu komutla derleyin:

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

Ardından UI'yı Gateway WS URL'nize yönlendirin (örn. `ws://127.0.0.1:18789`).

## Boş Control UI sayfası

Tarayıcı boş bir pano yüklüyorsa ve DevTools yararlı bir hata göstermiyorsa, bir uzantı veya erken içerik betiği JavaScript modül uygulamasının değerlendirilmesini engellemiş olabilir. Statik sayfa, başlangıçtan sonra `<openclaw-app>` kaydedilmediğinde görünen düz bir HTML kurtarma paneli içerir.

Tarayıcı ortamını değiştirdikten sonra panelin **Tekrar dene** eylemini kullanın veya şu denetimlerden sonra elle yeniden yükleyin:

- Tüm sayfalara enjekte edilen uzantıları, özellikle `<all_urls>` içerik betiklerine sahip uzantıları devre dışı bırakın.
- Gizli pencere, temiz bir tarayıcı profili veya başka bir tarayıcı deneyin.
- Gateway'i çalışır durumda tutun ve tarayıcı değişikliğinden sonra aynı pano URL'sini doğrulayın.

## Hata ayıklama/test etme: geliştirme sunucusu + uzak Gateway

Control UI statik dosyalardır; WebSocket hedefi yapılandırılabilir ve HTTP kaynağından farklı olabilir. Vite geliştirme sunucusunu yerelde, Gateway'i ise başka bir yerde çalıştırmak istediğinizde bu kullanışlıdır.

<Steps>
  <Step title="UI geliştirme sunucusunu başlat">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="gatewayUrl ile aç">
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
    - `gatewayUrl` üzerinden tam bir `ws://` veya `wss://` uç noktası geçirirseniz tarayıcının sorgu dizesini doğru ayrıştırması için `gatewayUrl` değerini URL ile kodlayın.
    - Mümkün olduğunda `token`, URL parçası (`#token=...`) üzerinden geçirilmelidir. Parçalar sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca yedek olarak kullanılır ve bootstrap sonrasında hemen kaldırılır.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında UI, yapılandırma veya ortam kimlik bilgilerine geri dönmez. `token` (veya `password`) açıkça sağlayın. Açık kimlik bilgilerinin eksik olması bir hatadır.
    - Gateway TLS arkasındayken (Tailscale Serve, HTTPS proxy vb.) `wss://` kullanın.
    - `gatewayUrl`, clickjacking'i önlemek için yalnızca üst düzey bir pencerede kabul edilir (gömülü değil).
    - Genel non-loopback Control UI dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça ayarlamalıdır (tam kaynaklar). Loopback, RFC1918/link-local, `.local`, `.ts.net` veya Tailscale CGNAT ana makinelerinden gelen özel same-origin LAN/Tailnet yüklemeleri, Host üst bilgisi yedeği etkinleştirilmeden kabul edilir.
    - Gateway başlangıcı etkin çalışma zamanı bağlama ve bağlantı noktasından `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel kaynakları tohumlayabilir, ancak uzak tarayıcı kaynakları yine de açık girdiler gerektirir.
    - Sıkı denetimli yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, "kullandığım ana makine neyse onunla eşleş" değil, herhangi bir tarayıcı kaynağına izin ver anlamına gelir.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` Host üst bilgisi kaynak yedeği modunu etkinleştirir, ancak bu tehlikeli bir güvenlik modudur.

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
