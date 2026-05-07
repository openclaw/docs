---
read_when:
    - Gateway'i bir tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı kontrol kullanıcı arayüzü (sohbet, düğümler, yapılandırma)
title: Kontrol Arayüzü
x-i18n:
    generated_at: "2026-05-07T13:28:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9ef19392f0d14aef9373e4469789f5916250f76038c8c81fe8a932c47913ca8
    source_path: web/control-ui.md
    workflow: 16
---

Kontrol UI, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfa uygulamasıdır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarlayın (örn. `/openclaw`)

Aynı port üzerindeki **Gateway WebSocket** ile **doğrudan** konuşur.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenemezse önce Gateway'i başlatın: `openclaw gateway`.

Kimlik doğrulama, WebSocket el sıkışması sırasında şu yollarla sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik başlıkları
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir proxy kimlik başlıkları

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçili Gateway URL'si için bir token tutar; parolalar kalıcı olarak saklanmaz. İlk bağlantıda onboarding genellikle paylaşımlı gizli anahtar kimlik doğrulaması için bir Gateway token'ı oluşturur, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Kontrol UI'ye yeni bir tarayıcıdan veya cihazdan bağlandığınızda Gateway genellikle **tek seferlik eşleştirme onayı** gerektirir. Bu, yetkisiz erişimi önlemek için bir güvenlik önlemidir.

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

Tarayıcı değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/genel anahtar) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve onu okuma erişiminden yazma/yönetici erişimine değiştirirseniz bu, sessiz bir yeniden bağlantı değil, onay yükseltmesi olarak ele alınır. OpenClaw eski onayı etkin tutar, daha geniş kapsamlı yeniden bağlantıyı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik olarak onaylanır.
- `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı kendi cihaz kimliğini sunduğunda Tailscale Serve, Kontrol UI operatör oturumları için eşleştirme gidiş dönüşünü atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği oluşturur; bu nedenle tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

</Note>

## Kişisel kimlik (tarayıcı yerel)

Kontrol UI, paylaşılan oturumlarda atıf için giden iletilere eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Bu kimlik tarayıcı depolamasında bulunur, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz iletilerdeki normal transkript yazarlığı meta verileri dışında diğer cihazlarla eşitlenmez veya sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya tarayıcı değiştirmek bunu boş duruma sıfırlar.

Aynı tarayıcı yerel kalıbı asistan avatarı geçersiz kılması için de geçerlidir. Yüklenen asistan avatarları, Gateway tarafından çözümlenen kimliği yalnızca yerel tarayıcıda kaplar ve hiçbir zaman `config.patch` üzerinden gidip gelmez. Paylaşılan `ui.assistant.avatar` yapılandırma alanı, alanı doğrudan yazan UI dışı istemciler (betikli Gateway'ler veya özel panolar gibi) için hâlâ kullanılabilir.

## Çalışma zamanı yapılandırma uç noktası

Kontrol UI, çalışma zamanı ayarlarını `/__openclaw/control-ui-config.json` üzerinden alır. Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı Gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar bunu alamaz ve başarılı bir alma işlemi ya zaten geçerli bir Gateway token'ı/parolası, Tailscale Serve kimliği ya da güvenilir proxy kimliği gerektirir.

## Dil desteği

Kontrol UI, ilk yüklemede tarayıcı yerel ayarınıza göre kendisini yerelleştirebilir. Daha sonra geçersiz kılmak için **Genel Bakış -> Gateway Erişimi -> Dil** bölümünü açın. Yerel ayar seçici, Görünüm altında değil Gateway Erişimi kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışı çeviriler tarayıcıda tembel yüklenir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve sonraki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Doküman çevirileri aynı İngilizce dışı yerel ayar kümesi için oluşturulur, ancak doküman sitesinin yerleşik Mintlify dil seçicisi Mintlify'nin kabul ettiği yerel ayar kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) dokümanlar yayın reposunda yine de oluşturulur; Mintlify bu kodları destekleyene kadar bu seçicide görünmeyebilirler.

## Görünüm temaları

Görünüm paneli yerleşik Claw, Knot ve Dash temalarını ve ayrıca tarayıcı yerel bir tweakcn içe aktarma yuvasını tutar. Bir tema içe aktarmak için [tweakcn editor](https://tweakcn.com/editor/theme) öğesini açın, bir tema seçin veya oluşturun, **Paylaş** öğesine tıklayın ve kopyalanan tema bağlantısını Görünüm'e yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` kayıt URL'lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi düzenleyici URL'lerini, göreli `/themes/<id>` yollarını, ham tema kimliklerini ve `amethyst-haze` gibi varsayılan tema adlarını kabul eder.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde saklanır. Gateway yapılandırmasına yazılmaz ve cihazlar arasında eşitlenmez. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; temizlemek, içe aktarılan tema seçiliyse etkin temayı Claw'a geri döndürür.

## Neler yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Sohbet geçmişi yenilemeleri, sohbet kullanılabilir hale gelmeden önce büyük oturumların tarayıcıyı tam transkript yükünü işlemeye zorlamaması için ileti başına metin sınırları olan sınırlı bir yakın zaman penceresi ister.
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden kısıtlı tek kullanımlık bir tarayıcı token'ı kullanır ve yalnızca arka uç gerçek zamanlı ses plugin'leri Gateway relay aktarımını kullanır. İstemciye ait sağlayıcı oturumları `talk.client.create` ile başlar; Gateway relay oturumları `talk.session.create` ile başlar. Relay, sağlayıcı kimlik bilgilerini Gateway üzerinde tutarken tarayıcı mikrofon PCM'sini `talk.session.appendAudio` üzerinden yayınlar ve `openclaw_agent_consult` sağlayıcı araç çağrılarını Gateway ilkesi ve daha büyük yapılandırılmış OpenClaw modeli için `talk.client.toolCall` üzerinden iletir.
    - Sohbet içinde araç çağrılarını + canlı araç çıktısı kartlarını yayınlayın (agent olayları).

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, rüyalar">
    - Kanallar: yerleşik ve paketli/harici plugin kanallarının durumu, QR oturum açma ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`).
    - Kanal yoklama yenilemeleri, yavaş sağlayıcı denetimleri tamamlanırken önceki anlık görüntüyü görünür tutar ve bir yoklama veya denetim UI bütçesini aştığında kısmi anlık görüntüler etiketlenir.
    - Örnekler: varlık listesi + yenileme (`system-presence`).
    - Oturumlar: varsayılan olarak yapılandırılmış agent oturumlarını listeleyin, eski yapılandırılmamış agent oturum anahtarlarından geri dönün ve oturum başına model/thinking/fast/verbose/trace/reasoning geçersiz kılmalarını uygulayın (`sessions.list`, `sessions.patch`).
    - Rüyalar: dreaming durumu, etkinleştirme/devre dışı bırakma anahtarı ve Rüya Günlüğü okuyucu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Node'lar, exec onayları">
    - Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalışma geçmişi (`cron.*`).
    - Skills: durum, etkinleştir/devre dışı bırak, yükle, API anahtarı güncellemeleri (`skills.*`).
    - Node'lar: liste + yetenekler (`node.list`).
    - Exec onayları: Gateway veya Node izin listelerini + `exec host=gateway/node` için sorma ilkesini düzenleyin (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Yapılandırma">
    - `~/.openclaw/openclaw.json` görüntüle/düzenle (`config.get`, `config.set`).
    - Doğrulamayla uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazmalar, eşzamanlı düzenlemelerin üzerine yazmayı önlemek için bir temel hash koruması içerir.
    - Yazmalar (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma yükündeki başvurular için etkin SecretRef çözümlemesini önceden denetler; çözümlenemeyen etkin gönderilmiş başvurular yazmadan önce reddedilir.
    - Şema + form işleme (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, anlık alt özetler, iç içe nesne/joker karakter/dizi/bileşim düğümlerindeki doküman meta verileri ve mevcut olduğunda plugin + kanal şemaları dahil); Ham JSON düzenleyici yalnızca anlık görüntü güvenli bir ham gidiş dönüşe sahipse kullanılabilir.
    - Bir anlık görüntü ham metinle güvenli şekilde gidip gelemiyorsa Kontrol UI o anlık görüntü için Form modunu zorlar ve Ham modu devre dışı bırakır.
    - Ham JSON düzenleyicideki "Kaydedilene sıfırla", düzleştirilmiş bir anlık görüntüyü yeniden işlemek yerine ham yazılmış biçimi (biçimlendirme, yorumlar, `$include` düzeni) korur; böylece anlık görüntü güvenli şekilde gidip gelebildiğinde harici düzenlemeler sıfırlama işleminden sağ çıkar.
    - Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizgeye bozulmayı önlemek için form metin girişlerinde salt okunur işlenir.

  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/modeller anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Olay günlüğü; Kontrol UI yenileme/RPC zamanlamalarını, yavaş sohbet/yapılandırma işleme zamanlamalarını ve tarayıcı bu PerformanceObserver giriş türlerini sunduğunda uzun animasyon kareleri veya uzun görevler için tarayıcı yanıt verebilirliği girişlerini içerir.
    - Günlükler: filtre/dışa aktarma ile Gateway dosya günlüklerinin canlı kuyruğu (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla bir paket/git güncellemesi + yeniden başlatma çalıştırın (`update.run`), ardından çalışan Gateway sürümünü doğrulamak için yeniden bağlandıktan sonra `update.status` yoklayın.

  </Accordion>
  <Accordion title="Cron işleri panel notları">
    - Yalıtılmış işler için teslim varsayılanı özet duyurusudur. Yalnızca dahili çalıştırmalar istiyorsanız none'a geçebilirsiniz.
    - Duyuru seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) Webhook URL'sine ayarlanmış olarak `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için Webhook ve none teslim modları kullanılabilir.
    - Gelişmiş düzenleme kontrolleri; çalıştırmadan sonra silme, agent geçersiz kılmasını temizleme, Cron kesin/kademeli seçenekleri, agent model/thinking geçersiz kılmaları ve en iyi çaba teslim anahtarlarını içerir.
    - Form doğrulaması alan düzeyi hatalarla satır içidir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Özel bir bearer token göndermek için `cron.webhookToken` ayarlayın; atlanırsa Webhook kimlik doğrulama başlığı olmadan gönderilir.
    - Kullanımdan kaldırılmış geri dönüş: `notify: true` içeren depolanmış eski işler, taşınana kadar hâlâ `cron.webhook` kullanabilir.

  </Accordion>
</AccordionGroup>

## Sohbet davranışı

<AccordionGroup>
  <Accordion title="Gönderme ve geçmiş semantiği">
    - `chat.send` **engellemesizdir**: `{ runId, status: "started" }` ile hemen onay verir ve yanıt `chat` olayları üzerinden yayınlanır.
    - Sohbet yüklemeleri, görüntüleri ve video olmayan dosyaları kabul eder. Görüntüler yerel görüntü yolunu korur; diğer dosyalar yönetilen medya olarak depolanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden göndermek, çalışırken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları UI güvenliği için boyutla sınırlıdır. Transkript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır meta veri bloklarını atlayabilir ve aşırı büyük mesajları bir yer tutucuyla (`[chat.history omitted: message too large]`) değiştirebilir.
    - Asistan/oluşturulan görüntüler yönetilen medya referansları olarak kalıcı hale getirilir ve kimliği doğrulanmış Gateway medya URL'leri üzerinden geri sunulur; böylece yeniden yüklemeler, ham base64 görüntü yüklerinin sohbet geçmişi yanıtında kalmasına bağlı olmaz.
    - `chat.history` işlenirken Control UI, görünür asistan metninden yalnızca görüntülemeye yönelik satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil), sızmış ASCII/tam genişlikli model kontrol belirteçlerini ayıklar ve tüm görünür metni yalnızca tam sessiz belirteç `NO_REPLY` / `no_reply` ya da heartbeat onay belirteci `HEARTBEAT_OK` olan asistan girdilerini atlar.
    - Etkin bir gönderim sırasında ve son geçmiş yenilemesinde, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürürse sohbet görünümü yerel iyimser kullanıcı/asistan mesajlarını görünür tutar; Gateway geçmişi yetiştiğinde kanonik transkript bu yerel mesajların yerini alır.
    - Canlı `chat` olayları teslim durumudur; `chat.history` ise dayanıklı oturum transkriptinden yeniden oluşturulur. Araç-son olaylarından sonra Control UI geçmişi yeniden yükler ve yalnızca küçük bir iyimser kuyruğu birleştirir; transkript sınırı [WebChat](/tr/web/webchat) içinde belgelenmiştir.
    - `chat.inject`, oturum transkriptine bir asistan notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (ajan çalıştırma yok, kanal teslimi yok).
    - Sohbet başlığı, oturum seçiciden önce ajan filtresini gösterir ve oturum seçici seçili ajana göre kapsamlandırılır. Ajan değiştirmek yalnızca o ajana bağlı oturumları gösterir ve henüz kaydedilmiş pano oturumları yoksa o ajanın ana oturumuna geri döner.
    - Masaüstü genişliklerinde sohbet kontrolleri tek bir kompakt satırda kalır ve transkriptte aşağı kaydırırken daralır; yukarı kaydırmak, en üste dönmek veya en alta ulaşmak kontrolleri geri getirir.
    - Ardışık yinelenen yalnızca metin mesajları, sayı rozeti olan tek bir balon olarak işlenir. Görüntü, ek, araç çıktısı veya canvas önizlemesi taşıyan mesajlar daraltılmaz.
    - Sohbet başlığı model ve düşünme seçicileri, etkin oturumu `sessions.patch` üzerinden hemen yamalar; bunlar tek turluk gönderim seçenekleri değil, kalıcı oturum geçersiz kılmalarıdır.
    - Control UI içinde `/new` yazmak, New Chat ile aynı yeni pano oturumunu oluşturur ve ona geçer. `/reset` yazmak, geçerli oturum için Gateway'in açık yerinde sıfırlamasını korur.
    - Sohbet model seçici, Gateway'in yapılandırılmış model görünümünü ister. `agents.defaults.models` varsa, seçiciyi bu izin verilenler listesi yönlendirir. Aksi halde seçici, açık `models.providers.*.models` girdilerini ve kullanılabilir kimlik doğrulaması olan sağlayıcıları gösterir. Tam katalog, hata ayıklama `models.list` RPC'si üzerinden `view: "all"` ile kullanılabilir kalır.
    - Yeni Gateway oturum kullanım raporları geçerli bağlam belirteçlerini içerdiğinde, sohbet oluşturucu alanı kompakt bir bağlam kullanım göstergesi gösterir. Yüksek bağlam baskısında uyarı stiline geçer ve önerilen Compaction düzeylerinde normal oturum Compaction yolunu çalıştıran kompakt bir düğme gösterir. Eski belirteç anlık görüntüleri, Gateway yeniden güncel kullanım bildirene kadar gizlenir.

  </Accordion>
  <Accordion title="Konuşma modu (tarayıcı gerçek zamanlı)">
    Konuşma modu kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. OpenAI'yi `talk.realtime.provider: "openai"` ve `talk.realtime.providers.openai.apiKey` ile yapılandırın ya da Google'ı `talk.realtime.provider: "google"` ve `talk.realtime.providers.google.apiKey` ile yapılandırın. Tarayıcı hiçbir zaman standart bir sağlayıcı API anahtarı almaz. OpenAI, WebRTC için geçici bir Realtime istemci sırrı alır. Google Live, tarayıcı WebSocket oturumu için tek kullanımlık, sınırlandırılmış bir Live API kimlik doğrulama belirteci alır; yönergeler ve araç bildirimleri Gateway tarafından belirtecin içine kilitlenir. Yalnızca arka uç gerçek zamanlı köprüsü sunan sağlayıcılar Gateway aktarım taşıması üzerinden çalışır; böylece kimlik bilgileri ve tedarikçi soketleri sunucu tarafında kalırken tarayıcı sesi kimliği doğrulanmış Gateway RPC'leri üzerinden taşınır. Realtime oturum istemi Gateway tarafından birleştirilir; `talk.client.create`, çağıranın sağladığı yönerge geçersiz kılmalarını kabul etmez.

    Sohbet oluşturucuda Konuşma kontrolü, mikrofonla dikte düğmesinin yanındaki dalgalar düğmesidir. Konuşma başladığında, oluşturucu durum satırı `Connecting Talk...`, ses bağlandığında `Talk live` veya gerçek zamanlı bir araç çağrısı `talk.client.toolCall` üzerinden yapılandırılmış daha büyük modele danışırken `Asking OpenClaw...` gösterir.

    Bakımcı canlı smoke testi: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`, OpenAI tarayıcı WebRTC SDP alışverişini, Google Live sınırlandırılmış belirteçli tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway aktarım tarayıcı bağdaştırıcısını doğrular. Komut yalnızca sağlayıcı durumunu yazdırır ve sırları günlüğe kaydetmez.

  </Accordion>
  <Accordion title="Durdurma ve iptal">
    - **Stop**'a tıklayın (`chat.abort` çağırır).
    - Bir çalışma etkinken normal takip mesajları kuyruğa alınır. Kuyruktaki bir mesajda **Steer**'a tıklayarak o takip mesajını çalışan tura enjekte edin.
    - Bant dışı iptal etmek için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi bağımsız iptal ifadeleri).
    - `chat.abort`, o oturumun tüm etkin çalışmalarını iptal etmek için `{ sessionKey }` desteği sunar (`runId` yok).

  </Accordion>
  <Accordion title="İptalde kısmi içeriğin korunması">
    - Bir çalışma iptal edildiğinde, kısmi asistan metni UI içinde yine de gösterilebilir.
    - Gateway, tamponlanmış çıktı varsa iptal edilmiş kısmi asistan metnini transkript geçmişine kalıcı olarak yazar.
    - Kalıcı girdiler iptal meta verisi içerir; böylece transkript tüketicileri iptal kısımlarını normal tamamlama çıktısından ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve web push

Control UI, bir `manifest.webmanifest` ve service worker ile gelir; bu nedenle modern tarayıcılar onu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık olmasa bile Gateway'in kurulu PWA'yı bildirimlerle uyandırmasına olanak tanır.

| Yüzey                                                 | Ne yapar                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifesti. Erişilebilir olduğunda tarayıcılar "Uygulamayı yükle" seçeneğini sunar. |
| `ui/public/sw.js`                                     | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw durum dizininin altında) | Web Push yüklerini imzalamak için kullanılan otomatik oluşturulmuş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                    | Kalıcı tarayıcı aboneliği uç noktaları.                            |

Anahtarları sabitlemek istediğinizde (çok ana makineli dağıtımlar, sır döndürme veya testler için) VAPID anahtar çiftini Gateway sürecindeki env vars ile geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılan `mailto:openclaw@localhost`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için bu kapsam korumalı Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID ortak anahtarını getirir.
- `push.web.subscribe` — bir `endpoint` ile `keys.p256dh`/`keys.auth` değerlerini kaydeder.
- `push.web.unsubscribe` — kayıtlı bir uç noktayı kaldırır.
- `push.web.test` — çağıranın aboneliğine bir test bildirimi gönderir.

<Note>
Web Push, iOS APNS aktarım yolundan (aktarım destekli push için bkz. [Yapılandırma](/tr/gateway/configuration)) ve yerel mobil eşlemeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Barındırılan yerleştirmeler

Asistan mesajları, `[embed ...]` kısa koduyla barındırılan web içeriğini satır içinde işleyebilir. iframe sandbox ilkesi `gateway.controlUi.embedSandbox` tarafından kontrol edilir:

<Tabs>
  <Tab title="strict">
    Barındırılan yerleştirmeler içinde betik yürütmeyi devre dışı bırakır.
  </Tab>
  <Tab title="scripts (varsayılan)">
    Kaynak yalıtımını korurken etkileşimli yerleştirmelere izin verir; bu varsayılandır ve genellikle kendi kendine yeterli tarayıcı oyunları/widget'ları için yeterlidir.
  </Tab>
  <Tab title="trusted">
    Bilerek daha güçlü ayrıcalıklara ihtiyaç duyan aynı site belgeleri için `allow-scripts` üstüne `allow-same-origin` ekler.
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
`trusted` değerini yalnızca gömülü belge gerçekten aynı kaynak davranışına ihtiyaç duyduğunda kullanın. Ajan tarafından oluşturulan çoğu oyun ve etkileşimli canvas için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` yerleştirme URL'leri varsayılan olarak engelli kalır. Bilerek `[embed url="https://..."]` değerinin üçüncü taraf sayfaları yüklemesini istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Sohbet mesajı genişliği

Gruplanmış sohbet mesajları okunabilir bir varsayılan en büyük genişlik kullanır. Geniş monitör dağıtımları, paketlenmiş CSS'i yamalamadan `gateway.controlUi.chatMessageMaxWidth` ayarlayarak bunu geçersiz kılabilir:

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
  <Tab title="Tümleşik Tailscale Serve (tercih edilen)">
    Gateway'i loopback üzerinde tutun ve Tailscale Serve'ün onu HTTPS ile proxy'lemesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Varsayılan olarak, `gateway.auth.allowTailscale` `true` olduğunda Control UI/WebSocket Serve istekleri Tailscale kimlik başlıkları (`tailscale-user-login`) üzerinden kimlik doğrulaması yapabilir. OpenClaw, `x-forwarded-for` adresini `tailscale whois` ile çözümleyip başlıkla eşleştirerek kimliği doğrular ve bunları yalnızca istek Tailscale'in `x-forwarded-*` başlıklarıyla loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliği olan Control UI operatör oturumları için bu doğrulanmış Serve yolu cihaz eşleme gidiş gelişini de atlar; cihazsız tarayıcılar ve düğüm rolü bağlantıları normal cihaz kontrollerini izlemeye devam eder. Serve trafiği için bile açık paylaşılan sır kimlik bilgileri gerektirmek istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu async Serve kimlik yolu için aynı istemci IP'si ve kimlik doğrulama kapsamına ait başarısız kimlik doğrulama denemeleri, hız sınırı yazımlarından önce serileştirilir. Bu nedenle aynı tarayıcıdan gelen eşzamanlı hatalı yeniden denemeler, paralel yarışan iki düz uyuşmazlık yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Belirteçsiz Serve kimlik doğrulaması, gateway ana makinesinin güvenilir olduğunu varsayar. Bu ana makinede güvenilmeyen yerel kod çalışabilirse belirteç/parola kimlik doğrulaması gerektirin.
    </Warning>

  </Tab>
  <Tab title="Tailnet'e bağla + belirteç">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ardından açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırdığınız `gateway.controlUi.basePath`)

    Eşleşen paylaşılan sırrı UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvenli olmayan HTTP

Panoyu düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`), tarayıcı **güvenli olmayan bağlamda** çalışır ve WebCrypto'yu engeller. OpenClaw varsayılan olarak cihaz kimliği olmayan Control UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost için güvenli olmayan HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Control UI kimlik doğrulaması
- acil durum için `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI'ı yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway ana makinesinde)

<AccordionGroup>
  <Accordion title="Güvenli olmayan kimlik doğrulama anahtarının davranışı">
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

    - localhost Control UI oturumlarının, güvenli olmayan HTTP bağlamlarında cihaz kimliği olmadan devam etmesine izin verir.
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
    `dangerouslyDisableDeviceAuth`, Control UI cihaz kimliği kontrollerini devre dışı bırakır ve ciddi bir güvenlik düşüşüdür. Acil durum kullanımından sonra hızla geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Güvenilen proxy notu">
    - Başarılı güvenilen proxy kimlik doğrulaması, cihaz kimliği olmadan **operatör** Control UI oturumlarını kabul edebilir.
    - Bu, düğüm rolündeki Control UI oturumlarını kapsamaz.
    - Aynı ana makinedeki loopback ters proxy'leri yine de güvenilen proxy kimlik doğrulamasını karşılamaz; bkz. [Güvenilen proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberi için [Tailscale](/tr/gateway/tailscale) sayfasına bakın.

## İçerik güvenliği ilkesi

Control UI sıkı bir `img-src` ilkesiyle gelir: yalnızca **aynı kökenli** varlıklara, `data:` URL'lerine ve yerel olarak oluşturulan `blob:` URL'lerine izin verilir. Uzak `http(s)` ve protokole bağlı göreli görüntü URL'leri tarayıcı tarafından reddedilir ve ağ isteği oluşturmaz.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görüntüler (örneğin `/avatars/<id>`) yine işlenir; UI'ın alıp yerel `blob:` URL'lerine dönüştürdüğü kimliği doğrulanmış avatar rotaları da buna dahildir.
- Satır içi `data:image/...` URL'leri yine işlenir (protokol içi yükler için kullanışlıdır).
- Control UI tarafından oluşturulan yerel `blob:` URL'leri yine işlenir.
- Kanal meta verileri tarafından yayılan uzak avatar URL'leri, Control UI'ın avatar yardımcılarında kaldırılır ve yerleşik logo/rozet ile değiştirilir; böylece ele geçirilmiş veya kötü niyetli bir kanal, operatör tarayıcısından keyfi uzak görüntü getirmelerini zorlayamaz.

Bu davranışı elde etmek için hiçbir şeyi değiştirmeniz gerekmez; her zaman açıktır ve yapılandırılamaz.

## Avatar rotası kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, Control UI avatar uç noktası API'nin geri kalanıyla aynı gateway token'ını gerektirir:

- `GET /avatar/<agentId>` avatar görüntüsünü yalnızca kimliği doğrulanmış çağırıcılara döndürür. `GET /avatar/<agentId>?meta=1` aynı kural altında avatar meta verilerini döndürür.
- Her iki rotaya yapılan kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla uyumlu şekilde). Bu, avatar rotasının, aksi halde korunan ana makinelerde ajan kimliğini sızdırmasını önler.
- Control UI'ın kendisi avatarları alırken gateway token'ını bearer başlığı olarak iletir ve görüntünün panolarda yine işlenmesi için kimliği doğrulanmış blob URL'leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan ana makinelerde önerilmez), avatar rotası da gateway'in geri kalanıyla uyumlu şekilde kimlik doğrulamasız hale gelir.

## Asistan medya rotası kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, asistan yerel medya önizlemeleri iki adımlı bir rota kullanır:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` normal Control UI operatör kimlik doğrulamasını gerektirir. Tarayıcı, kullanılabilirliği denetlerken gateway token'ını bearer başlığı olarak gönderir.
- Başarılı meta veri yanıtları, tam olarak o kaynak yoluna kapsamlanmış kısa ömürlü bir `mediaTicket` içerir.
- Tarayıcıda işlenen görüntü, ses, video ve belge URL'leri, etkin gateway token'ı veya parolası yerine `mediaTicket=<ticket>` kullanır. Bilet kısa sürede sona erer ve farklı bir kaynağı yetkilendiremez.

Bu, yeniden kullanılabilir gateway kimlik bilgilerini görünür medya URL'lerine koymadan normal medya işlemenin tarayıcı yerel medya öğeleriyle uyumlu kalmasını sağlar.

## UI'ı oluşturma

Gateway, statik dosyaları `dist/control-ui` dizininden sunar. Bunları şu komutla oluşturun:

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

## Hata ayıklama/test: geliştirme sunucusu + uzak Gateway

Control UI statik dosyalardan oluşur; WebSocket hedefi yapılandırılabilir ve HTTP kökeninden farklı olabilir. Vite geliştirme sunucusunu yerelde kullanmak, Gateway'i ise başka yerde çalıştırmak istediğinizde bu kullanışlıdır.

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
    - `gatewayUrl` yüklendikten sonra localStorage içinde saklanır ve URL'den kaldırılır.
    - `gatewayUrl` üzerinden tam bir `ws://` veya `wss://` uç noktası geçirirseniz, tarayıcının sorgu dizesini doğru ayrıştırması için `gatewayUrl` değerini URL kodlamasından geçirin.
    - `token` mümkün olduğunda URL parçası (`#token=...`) üzerinden geçirilmelidir. Parçalar sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca yedek olarak kullanılır ve bootstrap sonrasında hemen kaldırılır.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında, UI yapılandırma veya ortam kimlik bilgilerine geri dönmez. `token` (veya `password`) değerini açıkça sağlayın. Açık kimlik bilgilerinin eksik olması hatadır.
    - Gateway TLS arkasındaysa (Tailscale Serve, HTTPS proxy vb.) `wss://` kullanın.
    - Clickjacking'i önlemek için `gatewayUrl` yalnızca üst düzey pencerede (gömülü değil) kabul edilir.
    - local loopback olmayan Control UI dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça ayarlamalıdır (tam kökenler). Uzak geliştirme kurulumları da buna dahildir.
    - Gateway başlatması, etkin çalışma zamanı bağlama ve port değerinden `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel kökenleri ekleyebilir, ancak uzak tarayıcı kökenleri yine de açık girişler gerektirir.
    - Sıkı denetimli yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, "kullandığım ana makine neyse onunla eşleştir" değil, herhangi bir tarayıcı kökenine izin ver anlamına gelir.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`, Host başlığı köken yedekleme modunu etkinleştirir, ancak bu tehlikeli bir güvenlik modudur.

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
