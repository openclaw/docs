---
read_when:
    - Gateway'i bir tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı kontrol arayüzü (sohbet, düğümler, yapılandırma)
title: Denetim arayüzü
x-i18n:
    generated_at: "2026-05-10T20:00:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb158d1b6b92b7097fe7ba8d61aee5d6c6e67a8d45fc2cb2514c555ef3e52d81
    source_path: web/control-ui.md
    workflow: 16
---

Kontrol Arayüzü, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfa uygulamasıdır:

- varsayılan: `http://<host>:18789/`
- isteğe bağlı önek: `gateway.controlUi.basePath` ayarlayın (örn. `/openclaw`)

Aynı bağlantı noktasında **doğrudan Gateway WebSocket** ile konuşur.

## Hızlı açma (yerel)

Gateway aynı bilgisayarda çalışıyorsa şunu açın:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (veya [http://localhost:18789/](http://localhost:18789/))

Sayfa yüklenemezse önce Gateway'i başlatın: `openclaw gateway`.

Kimlik doğrulama, WebSocket el sıkışması sırasında şunlar üzerinden sağlanır:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik üstbilgileri
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir proxy kimlik üstbilgileri

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için bir belirteç tutar; parolalar kalıcı olarak saklanmaz. Onboarding genellikle ilk bağlantıda paylaşılan giz kimlik doğrulaması için bir gateway belirteci oluşturur, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleştirme (ilk bağlantı)

Kontrol Arayüzü'ne yeni bir tarayıcıdan veya cihazdan bağlandığınızda Gateway genellikle **tek seferlik eşleştirme onayı** ister. Bu, yetkisiz erişimi önlemek için bir güvenlik önlemidir.

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

Tarayıcı, değiştirilmiş kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/açık anahtar) eşleştirmeyi yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaylamadan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşleştirilmişse ve onu okuma erişiminden yazma/yönetici erişimine değiştirirseniz bu, sessiz bir yeniden bağlantı değil, bir onay yükseltmesi olarak değerlendirilir. OpenClaw eski onayı etkin tutar, daha geniş kapsamlı yeniden bağlantıyı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Belirteç döndürme ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik olarak onaylanır.
- Tailscale Serve, `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı cihaz kimliğini sunduğunda Kontrol Arayüzü operatör oturumları için eşleştirme gidiş dönüşünü atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz kimliği oluşturur, bu nedenle tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleştirme gerektirir.

</Note>

## Kişisel kimlik (tarayıcı yerelinde)

Kontrol Arayüzü, paylaşılan oturumlarda atıf için giden iletilere eklenen, tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Tarayıcı depolamasında yaşar, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz iletilerdeki normal transkript yazarlığı meta verilerinin ötesinde diğer cihazlara eşitlenmez ya da sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya tarayıcı değiştirmek bunu boş duruma sıfırlar.

Aynı tarayıcı yerelindeki desen, asistan avatarı geçersiz kılması için de geçerlidir. Yüklenen asistan avatarları, gateway tarafından çözümlenen kimliğin üzerine yalnızca yerel tarayıcıda bindirilir ve hiçbir zaman `config.patch` üzerinden gidiş dönüş yapmaz. Paylaşılan `ui.assistant.avatar` yapılandırma alanı, alanı doğrudan yazan UI dışı istemciler (komut dosyalı gateway'ler veya özel panolar gibi) için hâlâ kullanılabilir.

## Çalışma zamanı yapılandırma uç noktası

Kontrol Arayüzü, çalışma zamanı ayarlarını `/__openclaw/control-ui-config.json` üzerinden alır. Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar bunu getiremez ve başarılı bir getirme işlemi, zaten geçerli bir gateway belirteci/parolası, Tailscale Serve kimliği veya güvenilir proxy kimliği gerektirir.

## Dil desteği

Kontrol Arayüzü ilk yüklemede tarayıcı yerelinize göre kendini yerelleştirebilir. Daha sonra geçersiz kılmak için **Genel Bakış -> Gateway Erişimi -> Dil** bölümünü açın. Yerel seçici, Görünüm altında değil, Gateway Erişimi kartında bulunur.

- Desteklenen yereller: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışı çeviriler tarayıcıda tembel yüklenir.
- Seçilen yerel tarayıcı depolamasına kaydedilir ve sonraki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Doküman çevirileri aynı İngilizce dışı yerel kümesi için oluşturulur, ancak doküman sitesinin yerleşik Mintlify dil seçicisi, Mintlify'nin kabul ettiği yerel kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) dokümanları yayın reposunda yine de oluşturulur; Mintlify bu kodları destekleyene kadar bu seçicide görünmeyebilirler.

## Görünüm temaları

Görünüm paneli yerleşik Claw, Knot ve Dash temalarını, ayrıca tarayıcı yerelinde bir tweakcn içe aktarma yuvasını tutar. Bir temayı içe aktarmak için [tweakcn editor](https://tweakcn.com/editor/theme) sayfasını açın, bir tema seçin veya oluşturun, **Paylaş**'a tıklayın ve kopyalanan tema bağlantısını Görünüm'e yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` kayıt URL'lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi düzenleyici URL'lerini, göreli `/themes/<id>` yollarını, ham tema kimliklerini ve `amethyst-haze` gibi varsayılan tema adlarını kabul eder.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde saklanır. Gateway yapılandırmasına yazılmaz ve cihazlar arasında eşitlenmez. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; temizlemek, içe aktarılan tema seçiliyse etkin temayı tekrar Claw'a geçirir.

## Ne yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Sohbet geçmişi yenilemeleri, büyük oturumların sohbet kullanılabilir hâle gelmeden önce tarayıcıyı tam transkript yükünü işlemeye zorlamaması için ileti başına metin sınırlarıyla sınırlı bir yakın geçmiş penceresi ister.
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden kısıtlanmış tek kullanımlık bir tarayıcı belirteci kullanır ve yalnızca arka uç gerçek zamanlı ses Plugin'leri Gateway aktarma taşımasını kullanır. İstemciye ait sağlayıcı oturumları `talk.client.create` ile başlar; Gateway aktarma oturumları `talk.session.create` ile başlar. Aktarma, sağlayıcı kimlik bilgilerini Gateway üzerinde tutarken tarayıcı mikrofon PCM'ini `talk.session.appendAudio` üzerinden akıtır ve `openclaw_agent_consult` sağlayıcı araç çağrılarını Gateway ilkesi ve daha büyük yapılandırılmış OpenClaw modeli için `talk.client.toolCall` üzerinden iletir.
    - Sohbet içinde araç çağrılarını + canlı araç çıktı kartlarını akıtın (aracı olayları).

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, rüyalar">
    - Kanallar: yerleşik ve paketlenmiş/harici Plugin kanalları durumu, QR girişi ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`).
    - Kanal yoklama yenilemeleri, yavaş sağlayıcı denetimleri bitene kadar önceki anlık görüntüyü görünür tutar ve bir yoklama veya denetim UI bütçesini aştığında kısmi anlık görüntüler etiketlenir.
    - Örnekler: varlık listesi + yenileme (`system-presence`).
    - Oturumlar: varsayılan olarak yapılandırılmış aracı oturumlarını listeleyin, bayat yapılandırılmamış aracı oturum anahtarlarından geri dönün ve oturum başına model/düşünme/hızlı/ayrıntılı/izleme/akıl yürütme geçersiz kılmalarını uygulayın (`sessions.list`, `sessions.patch`).
    - Rüyalar: Dreaming durumu, etkinleştirme/devre dışı bırakma düğmesi ve Dream Diary okuyucu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, düğümler, yürütme onayları">
    - Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalışma geçmişi (`cron.*`).
    - Skills: durum, etkinleştir/devre dışı bırak, yükle, API anahtarı güncellemeleri (`skills.*`).
    - Düğümler: liste + yetenekler (`node.list`).
    - Yürütme onayları: gateway veya düğüm izin listelerini düzenleyin + `exec host=gateway/node` için sorma ilkesi (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Yapılandırma">
    - `~/.openclaw/openclaw.json` dosyasını görüntüle/düzenle (`config.get`, `config.set`).
    - Doğrulamayla uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazmalar, eşzamanlı düzenlemelerin ezilmesini önlemek için bir temel karma koruması içerir.
    - Yazmalar (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma yükündeki başvurular için etkin SecretRef çözümlemesini ön denetimden geçirir; çözümlenemeyen etkin gönderilmiş başvurular yazmadan önce reddedilir.
    - Şema + form işleme (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, anında alt özetler, iç içe nesne/joker karakter/dizi/bileşim düğümlerinde doküman meta verileri ve mevcut olduğunda Plugin + kanal şemaları dahil); Ham JSON düzenleyici yalnızca anlık görüntünün güvenli bir ham gidiş dönüşü olduğunda kullanılabilir.
    - Bir anlık görüntü ham metinle güvenli şekilde gidiş dönüş yapamıyorsa Kontrol Arayüzü Form modunu zorlar ve o anlık görüntü için Ham modu devre dışı bırakır.
    - Ham JSON düzenleyici "Kaydedilene sıfırla", düzleştirilmiş bir anlık görüntüyü yeniden işlemek yerine ham yazılmış şekli (biçimlendirme, yorumlar, `$include` düzeni) korur; böylece anlık görüntü güvenli şekilde gidiş dönüş yapabildiğinde harici düzenlemeler sıfırlamada korunur.
    - Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizgeye bozulmayı önlemek için form metin girişlerinde salt okunur işlenir.

  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/modeller anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Olay günlüğü, Kontrol Arayüzü yenileme/RPC zamanlamalarını, yavaş sohbet/yapılandırma işleme zamanlamalarını ve tarayıcı bu PerformanceObserver giriş türlerini sunduğunda uzun animasyon kareleri veya uzun görevler için tarayıcı yanıt verebilirliği girişlerini içerir.
    - Günlükler: filtre/dışa aktarma ile gateway dosya günlüklerinin canlı kuyruğu (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla bir paket/git güncellemesi + yeniden başlatma çalıştırın (`update.run`), ardından çalışan gateway sürümünü doğrulamak için yeniden bağlandıktan sonra `update.status` durumunu yoklayın.

  </Accordion>
  <Accordion title="Cron işleri paneli notları">
    - Yalıtılmış işler için teslimat varsayılanı özet duyurmaktır. Yalnızca dahili çalıştırmalar istiyorsanız hiçbirine geçebilirsiniz.
    - Duyur seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) webhook URL'sine ayarlanmış şekilde `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için webhook ve hiçbiri teslimat modları kullanılabilir.
    - Gelişmiş düzenleme denetimleri; çalıştırmadan sonra silme, aracı geçersiz kılmasını temizleme, cron tam/sapma seçenekleri, aracı model/düşünme geçersiz kılmaları ve en iyi çaba teslimat düğmelerini içerir.
    - Form doğrulaması alan düzeyinde hatalarla satır içidir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Ayrılmış bir bearer belirteci göndermek için `cron.webhookToken` ayarlayın; atlanırsa webhook kimlik doğrulama üstbilgisi olmadan gönderilir.
    - Kullanımdan kaldırılmış geri dönüş: `notify: true` ile saklanan eski işler, taşınana kadar hâlâ `cron.webhook` kullanabilir.

  </Accordion>
</AccordionGroup>

## Sohbet davranışı

<AccordionGroup>
  <Accordion title="Gönderme ve geçmiş semantiği">
    - `chat.send` **engellemesizdir**: `{ runId, status: "started" }` ile hemen onay verir ve yanıt `chat` olayları üzerinden akar.
    - Sohbet yüklemeleri görselleri ve video olmayan dosyaları kabul eder. Görseller yerel görüntü yolunu korur; diğer dosyalar yönetilen medya olarak depolanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden gönderme, çalışırken `{ status: "in_flight" }`, tamamlandıktan sonra `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları UI güvenliği için boyutla sınırlandırılır. Transkript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır meta veri bloklarını atlayabilir ve aşırı büyük mesajları bir yer tutucuyla değiştirebilir (`[chat.history omitted: message too large]`).
    - Asistan/üretilen görseller yönetilen medya referansları olarak kalıcılaştırılır ve kimlik doğrulamalı Gateway medya URL'leri üzerinden geri sunulur; böylece yeniden yüklemeler, ham base64 görüntü yüklerinin sohbet geçmişi yanıtında kalmasına bağlı olmaz.
    - `chat.history` işlenirken Control UI, görünür asistan metninden yalnızca gösterim amaçlı satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil) ve sızmış ASCII/tam genişlikli model kontrol belirteçlerini temizler; tüm görünür metni yalnızca tam sessiz belirteç `NO_REPLY` / `no_reply` veya Heartbeat onay belirteci `HEARTBEAT_OK` olan asistan girdilerini atlar.
    - Etkin bir gönderim sırasında ve son geçmiş yenilemesinde, `chat.history` kısa süreliğine daha eski bir anlık görüntü döndürürse sohbet görünümü yerel iyimser kullanıcı/asistan mesajlarını görünür tutar; Gateway geçmişi yakaladığında kanonik transkript bu yerel mesajların yerini alır.
    - Canlı `chat` olayları teslimat durumudur; `chat.history` ise dayanıklı oturum transkriptinden yeniden oluşturulur. Araç-son olaylarından sonra Control UI geçmişi yeniden yükler ve yalnızca küçük bir iyimser kuyruğu birleştirir; transkript sınırı [WebChat](/tr/web/webchat) içinde belgelenmiştir.
    - `chat.inject`, oturum transkriptine bir asistan notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (agent çalışması yok, kanal teslimatı yok).
    - Sohbet başlığı, oturum seçiciden önce agent filtresini gösterir ve oturum seçici seçili agent kapsamındadır. Agent değiştirildiğinde yalnızca o agent'a bağlı oturumlar gösterilir ve henüz kaydedilmiş pano oturumları yoksa o agent'ın ana oturumuna geri döner.
    - Masaüstü genişliklerinde sohbet kontrolleri tek bir kompakt satırda kalır ve transkriptte aşağı kaydırırken daralır; yukarı kaydırma, en üste dönme veya en alta ulaşma kontrolleri geri getirir.
    - Art arda gelen yinelenen yalnızca metin mesajları, sayı rozeti olan tek bir balon olarak işlenir. Görsel, ek, araç çıktısı veya tuval önizlemesi taşıyan mesajlar daraltılmadan bırakılır.
    - Sohbet başlığı model ve düşünme seçicileri, etkin oturumu `sessions.patch` üzerinden hemen yamalar; bunlar tek turluk gönderim seçenekleri değil, kalıcı oturum geçersiz kılmalarıdır.
    - Aynı oturum için bir model seçici değişikliği hâlâ kaydedilirken mesaj gönderirseniz, besteci `chat.send` çağırmadan önce bu oturum yamasını bekler; böylece gönderim seçili modeli kullanır.
    - Control UI içinde `/new` yazmak, New Chat ile aynı yeni pano oturumunu oluşturur ve ona geçer; ancak `session.dmScope: "main"` yapılandırılmışsa ve mevcut üst öğe agent'ın ana oturumuysa, bu durumda ana oturumu yerinde sıfırlar. `/reset` yazmak, geçerli oturum için Gateway'in açık yerinde sıfırlamasını korur.
    - Sohbet model seçici, Gateway'in yapılandırılmış model görünümünü ister. `agents.defaults.models` varsa, seçiciyi bu izin listesi yönetir; sağlayıcı kapsamlı katalogları dinamik tutan `provider/*` girdileri dahil. Aksi halde seçici, açık `models.providers.*.models` girdilerini ve kullanılabilir kimlik doğrulaması olan sağlayıcıları gösterir. Tam katalog, hata ayıklama `models.list` RPC'si üzerinden `view: "all"` ile kullanılabilir kalır.
    - Yeni Gateway oturum kullanım raporları geçerli bağlam belirteçlerini içerdiğinde, sohbet besteci alanı kompakt bir bağlam kullanım göstergesi gösterir. Yüksek bağlam baskısında uyarı stiline geçer ve önerilen Compaction düzeylerinde normal oturum Compaction yolunu çalıştıran kompakt bir düğme gösterir. Eski belirteç anlık görüntüleri, Gateway yeniden yeni kullanım bildirene kadar gizlenir.

  </Accordion>
  <Accordion title="Konuşma modu (tarayıcı gerçek zamanlı)">
    Konuşma modu kayıtlı bir gerçek zamanlı ses sağlayıcısı kullanır. OpenAI'yi `talk.realtime.provider: "openai"` ile ve ayrıca `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY` veya bir `openai-codex` OAuth profiliyle yapılandırın; Google'ı `talk.realtime.provider: "google"` ile ve ayrıca `talk.realtime.providers.google.apiKey` ile yapılandırın. Tarayıcı hiçbir zaman standart bir sağlayıcı API anahtarı almaz. OpenAI, WebRTC için kısa ömürlü bir Realtime istemci sırrı alır. Google Live, bir tarayıcı WebSocket oturumu için tek kullanımlık kısıtlanmış bir Live API kimlik doğrulama belirteci alır; yönergeler ve araç bildirimleri Gateway tarafından belirtece kilitlenir. Yalnızca arka uç gerçek zamanlı köprüsü sunan sağlayıcılar Gateway relay aktarımı üzerinden çalışır; böylece kimlik bilgileri ve satıcı soketleri sunucu tarafında kalırken tarayıcı sesi kimlik doğrulamalı Gateway RPC'leri üzerinden taşınır. Realtime oturum istemi Gateway tarafından birleştirilir; `talk.client.create` çağıranın sağladığı yönerge geçersiz kılmalarını kabul etmez.

    Chat bestecisi, Talk başlat/durdur düğmesinin yanında bir Talk seçenekleri düğmesi içerir. Seçenekler bir sonraki Talk oturumuna uygulanır ve sağlayıcıyı, aktarımı, modeli, sesi, akıl yürütme çabasını, VAD eşiğini, sessizlik süresini ve önek dolgusunu geçersiz kılabilir. Bir seçenek boş olduğunda Gateway varsa yapılandırılmış varsayılanları, yoksa sağlayıcı varsayılanını kullanır. Gateway relay seçimi arka uç relay yolunu zorunlu kılar; WebRTC seçimi oturumu istemci sahipliğinde tutar ve sağlayıcı tarayıcı oturumu oluşturamazsa sessizce relay'e geri dönmek yerine başarısız olur.

    Chat bestecisinde Talk kontrolü, mikrofon dikte düğmesinin yanındaki dalgalar düğmesidir. Talk başladığında besteci durum satırı `Connecting Talk...`, ardından ses bağlıyken `Talk live` veya gerçek zamanlı bir araç çağrısı `talk.client.toolCall` üzerinden yapılandırılmış daha büyük modele danışırken `Asking OpenClaw...` gösterir.

    Bakımcı canlı smoke testi: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`, OpenAI arka uç WebSocket köprüsünü, OpenAI tarayıcı WebRTC SDP değişimini, Google Live kısıtlanmış belirteçli tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway relay tarayıcı bağdaştırıcısını doğrular. Komut yalnızca sağlayıcı durumunu yazdırır ve sırları günlüğe kaydetmez.

  </Accordion>
  <Accordion title="Durdurma ve iptal">
    - **Stop** öğesine tıklayın (`chat.abort` çağırır).
    - Bir çalışma etkinken normal takipler kuyruğa alınır. Kuyruktaki bir mesajda **Steer** öğesine tıklayarak bu takibi çalışan tura enjekte edin.
    - Bant dışı iptal etmek için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi tek başına iptal ifadeleri).
    - `chat.abort`, o oturum için tüm etkin çalışmaları iptal etmek üzere `{ sessionKey }` desteği sunar (`runId` yok).

  </Accordion>
  <Accordion title="Kısmi iptalin korunması">
    - Bir çalışma iptal edildiğinde, kısmi asistan metni UI içinde yine de gösterilebilir.
    - Gateway, tamponlanmış çıktı varsa iptal edilmiş kısmi asistan metnini transkript geçmişine kalıcılaştırır.
    - Kalıcılaştırılmış girdiler iptal meta verilerini içerir; böylece transkript tüketicileri iptal kısımlarını normal tamamlanma çıktısından ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve web push

Control UI bir `manifest.webmanifest` ve bir servis çalışanı ile gelir; böylece modern tarayıcılar onu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık değilken bile Gateway'in kurulu PWA'yı bildirimlerle uyandırmasını sağlar.

| Yüzey                                                 | Ne yapar                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifesti. Erişilebilir olduğunda tarayıcılar "Install app" sunar. |
| `ui/public/sw.js`                                     | `push` olaylarını ve bildirim tıklamalarını işleyen servis çalışanı. |
| `push/vapid-keys.json` (OpenClaw durum dizininin altında) | Web Push yüklerini imzalamak için kullanılan otomatik üretilmiş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                    | Kalıcılaştırılmış tarayıcı abonelik uç noktaları.                  |

Anahtarları sabitlemek istediğinizde (çok ana makineli dağıtımlar, sır rotasyonu veya testler için) VAPID anahtar çiftini Gateway sürecinde ortam değişkenleri üzerinden geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılan `mailto:openclaw@localhost`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için bu kapsam kapılı Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID açık anahtarını getirir.
- `push.web.subscribe` — bir `endpoint` ile `keys.p256dh`/`keys.auth` kaydeder.
- `push.web.unsubscribe` — kayıtlı bir uç noktayı kaldırır.
- `push.web.test` — çağıranın aboneliğine bir test bildirimi gönderir.

<Note>
Web Push, iOS APNS relay yolundan (relay destekli push için bkz. [Yapılandırma](/tr/gateway/configuration)) ve yerel mobil eşlemeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Barındırılan yerleştirmeler

Asistan mesajları, `[embed ...]` kısa koduyla barındırılan web içeriğini satır içinde işleyebilir. iframe sandbox ilkesi `gateway.controlUi.embedSandbox` tarafından denetlenir:

<Tabs>
  <Tab title="strict">
    Barındırılan yerleştirmelerin içinde betik yürütmeyi devre dışı bırakır.
  </Tab>
  <Tab title="scripts (varsayılan)">
    Kaynak izolasyonunu korurken etkileşimli yerleştirmelere izin verir; bu varsayılandır ve genellikle kendi kendine yeterli tarayıcı oyunları/widget'ları için yeterlidir.
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
`trusted` değerini yalnızca gömülü belge gerçekten aynı kaynak davranışına ihtiyaç duyduğunda kullanın. Çoğu agent tarafından üretilen oyun ve etkileşimli tuval için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` yerleştirme URL'leri varsayılan olarak engelli kalır. Bilerek `[embed url="https://..."]` üçüncü taraf sayfaları yüklesin istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Sohbet mesajı genişliği

Gruplanmış sohbet mesajları okunabilir bir varsayılan en büyük genişlik kullanır. Geniş monitörlü dağıtımlar, paketlenmiş CSS'i yamalamadan `gateway.controlUi.chatMessageMaxWidth` ayarlayarak bunu geçersiz kılabilir:

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
    Gateway'i loopback üzerinde tutun ve Tailscale Serve'in onu HTTPS ile proxy'lemesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Varsayılan olarak, `gateway.auth.allowTailscale` `true` olduğunda Kontrol UI/WebSocket Serve istekleri Tailscale kimlik başlıkları (`tailscale-user-login`) aracılığıyla kimlik doğrulaması yapabilir. OpenClaw, `x-forwarded-for` adresini `tailscale whois` ile çözümleyip başlıkla eşleştirerek kimliği doğrular ve bunları yalnızca istek Tailscale'in `x-forwarded-*` başlıklarıyla loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliğine sahip Kontrol UI operatör oturumları için bu doğrulanmış Serve yolu cihaz eşleştirme gidiş dönüşünü de atlar; cihazsız tarayıcılar ve node rolü bağlantıları normal cihaz kontrollerini izlemeye devam eder. Serve trafiği için bile açık paylaşılan gizli anahtar kimlik bilgileri gerektirmek istiyorsanız `gateway.auth.allowTailscale: false` ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu asenkron Serve kimlik yolu için, aynı istemci IP'si ve kimlik doğrulama kapsamına ait başarısız kimlik doğrulama denemeleri rate-limit yazımlarından önce serileştirilir. Bu nedenle aynı tarayıcıdan gelen eşzamanlı hatalı yeniden denemeler, paralel yarışan iki düz eşleşmeme yerine ikinci istekte `retry later` gösterebilir.

    <Warning>
    Token'sız Serve kimlik doğrulaması Gateway ana makinesinin güvenilir olduğunu varsayar. Bu ana makinede güvenilmeyen yerel kod çalışabiliyorsa token/parola kimlik doğrulaması gerektir.
    </Warning>

  </Tab>
  <Tab title="Tailnet + token'a bağla">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ardından şunu açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Eşleşen paylaşılan gizli anahtarı UI ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvensiz HTTP

Kontrol panelini düz HTTP üzerinden açarsanız (`http://<lan-ip>` veya `http://<tailscale-ip>`), tarayıcı **güvenli olmayan bir bağlamda** çalışır ve WebCrypto'yu engeller. Varsayılan olarak OpenClaw, cihaz kimliği olmayan Kontrol UI bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost için güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Kontrol UI kimlik doğrulaması
- acil durum `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya UI'yi yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (Gateway ana makinesinde)

<AccordionGroup>
  <Accordion title="Güvensiz kimlik doğrulama geçiş davranışı">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` yalnızca yerel bir uyumluluk geçişidir:

    - Localhost Kontrol UI oturumlarının güvenli olmayan HTTP bağlamlarında cihaz kimliği olmadan ilerlemesine izin verir.
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
    `dangerouslyDisableDeviceAuth`, Kontrol UI cihaz kimliği kontrollerini devre dışı bırakır ve ciddi bir güvenlik düşürmesidir. Acil kullanım sonrasında hızlıca geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Güvenilir proxy notu">
    - Başarılı güvenilir proxy kimlik doğrulaması, **operatör** Kontrol UI oturumlarını cihaz kimliği olmadan kabul edebilir.
    - Bu, node rolü Kontrol UI oturumlarını kapsamaz.
    - Aynı ana makinedeki loopback ters proxy'leri yine de güvenilir proxy kimlik doğrulamasını karşılamaz; bkz. [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberliği için [Tailscale](/tr/gateway/tailscale) bölümüne bakın.

## İçerik güvenliği politikası

Kontrol UI sıkı bir `img-src` politikasıyla gelir: yalnızca **same-origin** varlıklara, `data:` URL'lerine ve yerel olarak oluşturulan `blob:` URL'lerine izin verilir. Uzak `http(s)` ve protokol göreli görsel URL'leri tarayıcı tarafından reddedilir ve ağ fetch'leri başlatmaz.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görseller (örneğin `/avatars/<id>`) hâlâ render edilir; UI'nin fetch edip yerel `blob:` URL'lerine dönüştürdüğü kimliği doğrulanmış avatar rotaları dahil.
- Satır içi `data:image/...` URL'leri hâlâ render edilir (protokol içi payload'lar için yararlıdır).
- Kontrol UI tarafından oluşturulan yerel `blob:` URL'leri hâlâ render edilir.
- Kanal metadata'sı tarafından yayılan uzak avatar URL'leri Kontrol UI'nin avatar yardımcılarında ayıklanır ve yerleşik logo/rozetle değiştirilir; böylece ele geçirilmiş veya kötü niyetli bir kanal, operatör tarayıcısından keyfi uzak görsel fetch'leri zorlayamaz.

Bu davranışı elde etmek için hiçbir şeyi değiştirmeniz gerekmez — her zaman açıktır ve yapılandırılamaz.

## Avatar rota kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, Kontrol UI avatar endpoint'i API'nin geri kalanıyla aynı Gateway token'ını gerektirir:

- `GET /avatar/<agentId>` avatar görselini yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1` aynı kural altında avatar metadata'sını döndürür.
- Her iki rotaya da kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla eşleşir). Bu, avatar rotasının aksi halde korunan ana makinelerde agent kimliğini sızdırmasını önler.
- Kontrol UI, avatarları fetch ederken Gateway token'ını bearer başlığı olarak iletir ve görselin kontrol panellerinde hâlâ render edilmesi için kimliği doğrulanmış blob URL'leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan ana makinelerde önerilmez), Gateway'in geri kalanıyla uyumlu olarak avatar rotası da kimlik doğrulamasız hale gelir.

## Assistant medya rota kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, assistant yerel medya önizlemeleri iki adımlı bir rota kullanır:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` normal Kontrol UI operatör kimlik doğrulamasını gerektirir. Tarayıcı, kullanılabilirliği kontrol ederken Gateway token'ını bearer başlığı olarak gönderir.
- Başarılı metadata yanıtları, tam olarak o kaynak yoluna kapsamlanmış kısa ömürlü bir `mediaTicket` içerir.
- Tarayıcıda render edilen görsel, ses, video ve belge URL'leri etkin Gateway token'ı veya parolası yerine `mediaTicket=<ticket>` kullanır. Bilet hızlıca sona erer ve farklı bir kaynağı yetkilendiremez.

Bu, yeniden kullanılabilir Gateway kimlik bilgilerini görünür medya URL'lerine koymadan normal medya render işlemini tarayıcı yerel medya öğeleriyle uyumlu tutar.

## UI'yi Oluşturma

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

Ardından UI'yi Gateway WS URL'nize yönlendirin (örn. `ws://127.0.0.1:18789`).

## Hata ayıklama/test etme: dev server + uzak Gateway

Kontrol UI statik dosyalardır; WebSocket hedefi yapılandırılabilir ve HTTP origin'inden farklı olabilir. Yerelde Vite dev server isterken Gateway'in başka bir yerde çalışmasını istediğinizde bu kullanışlıdır.

<Steps>
  <Step title="UI dev server'ı başlat">
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
    - `gatewayUrl`, yüklemeden sonra localStorage'da saklanır ve URL'den kaldırılır.
    - `gatewayUrl` aracılığıyla tam bir `ws://` veya `wss://` endpoint geçirirseniz, tarayıcının sorgu dizesini doğru ayrıştırması için `gatewayUrl` değerini URL-encode edin.
    - `token` mümkün olduğunca URL fragment'i (`#token=...`) aracılığıyla geçirilmelidir. Fragment'ler sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca fallback olarak kullanılır ve bootstrap'tan hemen sonra kaldırılır.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında, UI config veya ortam kimlik bilgilerine fallback yapmaz. `token` (veya `password`) değerini açıkça sağlayın. Açık kimlik bilgilerinin eksik olması bir hatadır.
    - Gateway TLS arkasındayken (Tailscale Serve, HTTPS proxy vb.) `wss://` kullanın.
    - `gatewayUrl`, clickjacking'i önlemek için yalnızca üst düzey pencerede (gömülü değil) kabul edilir.
    - Loopback olmayan Kontrol UI dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça ayarlamalıdır (tam origin'ler). Buna uzak dev kurulumları dahildir.
    - Gateway başlangıcı, etkin çalışma zamanı bind ve port değerinden `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel origin'leri tohumlayabilir, ancak uzak tarayıcı origin'leri yine de açık girdiler gerektirir.
    - Sıkı denetlenen yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, herhangi bir tarayıcı origin'ine izin ver anlamına gelir; "kullandığım ana makine neyse onunla eşleştir" anlamına gelmez.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`, Host başlığı origin fallback modunu etkinleştirir, ancak bu tehlikeli bir güvenlik modudur.

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

- [Kontrol Paneli](/tr/web/dashboard) — Gateway kontrol paneli
- [Sağlık Kontrolleri](/tr/gateway/health) — Gateway sağlık izleme
- [TUI](/tr/web/tui) — terminal kullanıcı arayüzü
- [WebChat](/tr/web/webchat) — tarayıcı tabanlı sohbet arayüzü
