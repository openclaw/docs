---
read_when:
    - Gateway'i bir tarayıcıdan yönetmek istiyorsunuz
    - SSH tünelleri olmadan Tailnet erişimi istiyorsunuz
sidebarTitle: Control UI
summary: Gateway için tarayıcı tabanlı kontrol arayüzü (sohbet, düğümler, yapılandırma)
title: Kontrol kullanıcı arayüzü
x-i18n:
    generated_at: "2026-05-11T20:39:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0033b2666fe76bd23d5585d05b39fdd33f8d15d4e7c16561b5cfd0e75b8d22e
    source_path: web/control-ui.md
    workflow: 16
---

Kontrol UI, Gateway tarafından sunulan küçük bir **Vite + Lit** tek sayfa uygulamasıdır:

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
- `gateway.auth.allowTailscale: true` olduğunda Tailscale Serve kimlik başlıkları
- `gateway.auth.mode: "trusted-proxy"` olduğunda güvenilir proxy kimlik başlıkları

Pano ayarları paneli, geçerli tarayıcı sekmesi oturumu ve seçili gateway URL'si için bir token tutar; parolalar kalıcı olarak saklanmaz. Onboarding genellikle ilk bağlantıda paylaşılan gizli anahtar kimlik doğrulaması için bir gateway token'ı oluşturur, ancak `gateway.auth.mode` `"password"` olduğunda parola kimlik doğrulaması da çalışır.

## Cihaz eşleme (ilk bağlantı)

Kontrol UI'ye yeni bir tarayıcıdan veya cihazdan bağlandığınızda, Gateway genellikle **tek seferlik eşleme onayı** ister. Bu, yetkisiz erişimi önlemeye yönelik bir güvenlik önlemidir.

**Göreceğiniz şey:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Bekleyen istekleri listele">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="İstek ID'siyle onayla">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Tarayıcı değişen kimlik doğrulama ayrıntılarıyla (rol/kapsamlar/public key) eşlemeyi yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur. Onaydan önce `openclaw devices list` komutunu yeniden çalıştırın.

Tarayıcı zaten eşlenmişse ve onu okuma erişiminden yazma/admin erişimine değiştirirseniz, bu sessiz bir yeniden bağlanma değil, onay yükseltmesi olarak değerlendirilir. OpenClaw eski onayı etkin tutar, daha geniş yeniden bağlanmayı engeller ve yeni kapsam kümesini açıkça onaylamanızı ister.

Onaylandıktan sonra cihaz hatırlanır ve `openclaw devices revoke --device <id> --role <role>` ile iptal etmediğiniz sürece yeniden onay gerektirmez. Token döndürme ve iptal için [Cihazlar CLI](/tr/cli/devices) bölümüne bakın.

<Note>
- Doğrudan local loopback tarayıcı bağlantıları (`127.0.0.1` / `localhost`) otomatik olarak onaylanır.
- Tailscale Serve, `gateway.auth.allowTailscale: true` olduğunda, Tailscale kimliği doğrulandığında ve tarayıcı kendi cihaz kimliğini sunduğunda Kontrol UI operatör oturumları için eşleme turunu atlayabilir.
- Doğrudan Tailnet bağlamaları, LAN tarayıcı bağlantıları ve cihaz kimliği olmayan tarayıcı profilleri yine de açık onay gerektirir.
- Her tarayıcı profili benzersiz bir cihaz ID'si oluşturur; bu nedenle tarayıcı değiştirmek veya tarayıcı verilerini temizlemek yeniden eşleme gerektirir.

</Note>

## Kişisel kimlik (tarayıcı yerel)

Kontrol UI, paylaşılan oturumlarda atıf için giden iletilere eklenen tarayıcı başına kişisel kimliği (görünen ad ve avatar) destekler. Bu kimlik tarayıcı depolamasında yaşar, geçerli tarayıcı profiliyle sınırlıdır ve gerçekten gönderdiğiniz iletilerdeki normal transkript yazarlığı meta verileri dışında diğer cihazlarla eşitlenmez veya sunucu tarafında kalıcı olarak saklanmaz. Site verilerini temizlemek veya tarayıcı değiştirmek onu boş duruma sıfırlar.

Aynı tarayıcı yerel deseni asistan avatarı geçersiz kılmasına da uygulanır. Yüklenen asistan avatarları, gateway tarafından çözümlenen kimliğin yalnızca yerel tarayıcı üzerinde üstüne bindirilir ve hiçbir zaman `config.patch` üzerinden gidiş dönüş yapmaz. Paylaşılan `ui.assistant.avatar` yapılandırma alanı, alanı doğrudan yazan UI dışı istemciler (betikli gateway'ler veya özel panolar gibi) için hâlâ kullanılabilir.

## Çalışma zamanı yapılandırma uç noktası

Kontrol UI, çalışma zamanı ayarlarını `/__openclaw/control-ui-config.json` adresinden alır. Bu uç nokta, HTTP yüzeyinin geri kalanıyla aynı gateway kimlik doğrulamasıyla korunur: kimliği doğrulanmamış tarayıcılar onu alamaz ve başarılı bir alma işlemi için zaten geçerli bir gateway token'ı/parolası, Tailscale Serve kimliği veya güvenilir proxy kimliği gerekir.

## Dil desteği

Kontrol UI, ilk yüklemede tarayıcı yerel ayarınıza göre kendisini yerelleştirebilir. Daha sonra geçersiz kılmak için **Genel Bakış -> Gateway Erişimi -> Dil** bölümünü açın. Yerel ayar seçici, Görünüm altında değil, Gateway Erişimi kartında bulunur.

- Desteklenen yerel ayarlar: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- İngilizce dışındaki çeviriler tarayıcıda lazy-loaded olarak yüklenir.
- Seçilen yerel ayar tarayıcı depolamasına kaydedilir ve gelecekteki ziyaretlerde yeniden kullanılır.
- Eksik çeviri anahtarları İngilizceye geri döner.

Doküman çevirileri aynı İngilizce dışı yerel ayar kümesi için oluşturulur, ancak doküman sitesinin yerleşik Mintlify dil seçicisi Mintlify'nin kabul ettiği yerel ayar kodlarıyla sınırlıdır. Tayca (`th`) ve Farsça (`fa`) dokümanlar yayın deposunda hâlâ oluşturulur; Mintlify bu kodları destekleyene kadar o seçicide görünmeyebilirler.

## Görünüm temaları

Görünüm paneli yerleşik Claw, Knot ve Dash temalarını, ayrıca bir tarayıcı yerel tweakcn içe aktarma yuvasını tutar. Bir tema içe aktarmak için [tweakcn editor](https://tweakcn.com/editor/theme) adresini açın, bir tema seçin veya oluşturun, **Paylaş** düğmesine tıklayın ve kopyalanan tema bağlantısını Görünüm'e yapıştırın. İçe aktarıcı ayrıca `https://tweakcn.com/r/themes/<id>` kayıt URL'lerini, `https://tweakcn.com/editor/theme?theme=amethyst-haze` gibi düzenleyici URL'lerini, göreli `/themes/<id>` yollarını, ham tema ID'lerini ve `amethyst-haze` gibi varsayılan tema adlarını kabul eder.

İçe aktarılan temalar yalnızca geçerli tarayıcı profilinde saklanır. Gateway yapılandırmasına yazılmaz ve cihazlar arasında eşitlenmez. İçe aktarılan temayı değiştirmek tek yerel yuvayı günceller; temizlemek, içe aktarılan tema seçiliyse etkin temayı tekrar Claw'a geçirir.

## Neler yapabilir (bugün)

<AccordionGroup>
  <Accordion title="Sohbet ve Konuşma">
    - Gateway WS üzerinden modelle sohbet edin (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Sohbet geçmişi yenilemeleri, sohbet kullanılabilir hale gelmeden önce büyük oturumların tarayıcıyı tam transkript payload'ını render etmeye zorlamaması için ileti başına metin sınırları olan sınırlı bir yakın dönem penceresi ister.
    - Tarayıcı gerçek zamanlı oturumları üzerinden konuşun. OpenAI doğrudan WebRTC kullanır, Google Live WebSocket üzerinden kısıtlı tek kullanımlık bir tarayıcı token'ı kullanır ve yalnızca backend gerçek zamanlı ses Plugin'leri Gateway relay taşımasını kullanır. İstemciye ait sağlayıcı oturumları `talk.client.create` ile başlar; Gateway relay oturumları `talk.session.create` ile başlar. Relay, sağlayıcı kimlik bilgilerini Gateway üzerinde tutarken tarayıcı `talk.session.appendAudio` üzerinden mikrofon PCM akışı yapar ve `openclaw_agent_consult` sağlayıcı araç çağrılarını Gateway politikası ve daha büyük yapılandırılmış OpenClaw modeli için `talk.client.toolCall` üzerinden iletir.
    - Sohbet'te araç çağrılarını + canlı araç çıktı kartlarını akış olarak gösterin (ajan olayları).

  </Accordion>
  <Accordion title="Kanallar, örnekler, oturumlar, rüyalar">
    - Kanallar: yerleşik ve paketlenmiş/harici Plugin kanallarının durumu, QR girişi ve kanal başına yapılandırma (`channels.status`, `web.login.*`, `config.patch`).
    - Kanal yoklaması yenilemeleri, yavaş sağlayıcı kontrolleri bitene kadar önceki anlık görüntüyü görünür tutar ve bir yoklama veya denetim UI bütçesini aştığında kısmi anlık görüntüler etiketlenir.
    - Örnekler: presence listesi + yenileme (`system-presence`).
    - Oturumlar: varsayılan olarak yapılandırılmış ajan oturumlarını listeleyin, eski yapılandırılmamış ajan oturum anahtarlarından geri düşün ve oturum başına model/thinking/fast/verbose/trace/reasoning geçersiz kılmalarını uygulayın (`sessions.list`, `sessions.patch`).
    - Rüyalar: dreaming durumu, etkinleştir/devre dışı bırak anahtarı ve Rüya Günlüğü okuyucusu (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, düğümler, exec onayları">
    - Cron işleri: listele/ekle/düzenle/çalıştır/etkinleştir/devre dışı bırak + çalışma geçmişi (`cron.*`).
    - Skills: durum, etkinleştir/devre dışı bırak, yükle, API anahtarı güncellemeleri (`skills.*`).
    - Düğümler: liste + sınırlar (`node.list`).
    - Exec onayları: gateway veya düğüm izin listelerini düzenle + `exec host=gateway/node` için sorma politikası (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Yapılandırma">
    - `~/.openclaw/openclaw.json` görüntüle/düzenle (`config.get`, `config.set`).
    - Doğrulamayla uygula + yeniden başlat (`config.apply`) ve son etkin oturumu uyandır.
    - Yazmalar, eşzamanlı düzenlemelerin üzerine yazılmasını önlemek için bir temel hash koruması içerir.
    - Yazmalar (`config.set`/`config.apply`/`config.patch`), gönderilen yapılandırma payload'ındaki referanslar için etkin SecretRef çözümlemesini ön kontrolden geçirir; çözümlenemeyen etkin gönderilmiş referanslar yazmadan önce reddedilir.
    - Şema + form render etme (`config.schema` / `config.schema.lookup`; alan `title` / `description`, eşleşen UI ipuçları, doğrudan alt özetler, iç içe nesne/wildcard/dizi/bileşim düğümlerinde doküman meta verileri ve kullanılabilir olduğunda Plugin + kanal şemaları dahil); Ham JSON düzenleyicisi yalnızca anlık görüntünün güvenli bir ham gidiş dönüşü olduğunda kullanılabilir.
    - Bir anlık görüntü ham metni güvenli şekilde gidiş dönüş yapamıyorsa Kontrol UI Form modunu zorunlu kılar ve o anlık görüntü için Ham modu devre dışı bırakır.
    - Ham JSON düzenleyicisindeki "Kaydedilene sıfırla", düzleştirilmiş bir anlık görüntüyü yeniden render etmek yerine ham yazılmış şekli (biçimlendirme, yorumlar, `$include` yerleşimi) korur; böylece anlık görüntü güvenli şekilde gidiş dönüş yapabiliyorsa harici düzenlemeler sıfırlama sırasında korunur.
    - Yapılandırılmış SecretRef nesne değerleri, yanlışlıkla nesneden dizeye bozulmayı önlemek için form metin girişlerinde salt okunur render edilir.

  </Accordion>
  <Accordion title="Hata ayıklama, günlükler, güncelleme">
    - Hata ayıklama: durum/sağlık/modeller anlık görüntüleri + olay günlüğü + manuel RPC çağrıları (`status`, `health`, `models.list`).
    - Olay günlüğü, Control UI yenileme/RPC zamanlamalarını, yavaş sohbet/yapılandırma render zamanlamalarını ve tarayıcı bu PerformanceObserver giriş türlerini sunduğunda uzun animasyon kareleri veya uzun görevler için tarayıcı yanıt verebilirliği girişlerini içerir.
    - Günlükler: filtre/dışa aktarma ile gateway dosya günlüklerinin canlı kuyruğu (`logs.tail`).
    - Güncelleme: yeniden başlatma raporuyla paket/git güncellemesi + yeniden başlatma (`update.run`) çalıştırın, ardından çalışan gateway sürümünü doğrulamak için yeniden bağlandıktan sonra `update.status` yoklayın.

  </Accordion>
  <Accordion title="Cron işleri panel notları">
    - Yalıtılmış işler için teslimat varsayılan olarak özet duyurusudur. Yalnızca dahili çalıştırmalar istiyorsanız none seçeneğine geçebilirsiniz.
    - Duyuru seçildiğinde kanal/hedef alanları görünür.
    - Webhook modu, `delivery.to` geçerli bir HTTP(S) webhook URL'sine ayarlanmış olarak `delivery.mode = "webhook"` kullanır.
    - Ana oturum işleri için webhook ve none teslimat modları kullanılabilir.
    - Gelişmiş düzenleme denetimleri arasında çalıştırmadan sonra sil, ajan geçersiz kılmasını temizle, cron exact/stagger seçenekleri, ajan model/thinking geçersiz kılmaları ve best-effort teslimat anahtarları bulunur.
    - Form doğrulaması alan düzeyi hatalarla satır içidir; geçersiz değerler düzeltilene kadar kaydet düğmesini devre dışı bırakır.
    - Ayrılmış bir bearer token göndermek için `cron.webhookToken` ayarlayın; atlanırsa webhook auth başlığı olmadan gönderilir.
    - Kullanımdan kaldırılmış geri dönüş: `notify: true` içeren depolanmış eski işler, taşınana kadar hâlâ `cron.webhook` kullanabilir.

  </Accordion>
</AccordionGroup>

## Sohbet davranışı

<AccordionGroup>
  <Accordion title="Gönderme ve geçmiş semantiği">
    - `chat.send` **engellemesizdir**: hemen `{ runId, status: "started" }` ile onay verir ve yanıt `chat` olayları üzerinden akar.
    - Sohbet yüklemeleri görselleri ve video olmayan dosyaları kabul eder. Görseller yerel görsel yolunu korur; diğer dosyalar yönetilen medya olarak saklanır ve geçmişte ek bağlantıları olarak gösterilir.
    - Aynı `idempotencyKey` ile yeniden gönderme, çalışırken `{ status: "in_flight" }`, tamamlandıktan sonra ise `{ status: "ok" }` döndürür.
    - `chat.history` yanıtları, UI güvenliği için boyutla sınırlıdır. Transcript girdileri çok büyük olduğunda Gateway uzun metin alanlarını kısaltabilir, ağır metadata bloklarını atlayabilir ve aşırı büyük mesajları bir yer tutucuyla (`[chat.history omitted: message too large]`) değiştirebilir.
    - Assistant/üretilen görseller yönetilen medya referansları olarak kalıcılaştırılır ve kimliği doğrulanmış Gateway medya URL'leri üzerinden geri sunulur; bu nedenle yeniden yüklemeler, ham base64 görsel yüklerinin sohbet geçmişi yanıtında kalmasına bağlı değildir.
    - `chat.history` işlenirken Control UI, görünen assistant metninden yalnızca gösterime yönelik satır içi yönerge etiketlerini (örneğin `[[reply_to_*]]` ve `[[audio_as_voice]]`), düz metin tool-call XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış tool-call blokları dahil) ve sızmış ASCII/tam genişlikli model denetim tokenlarını kaldırır; ayrıca tüm görünen metni yalnızca tam sessiz token `NO_REPLY` / `no_reply` veya Heartbeat onay tokenı `HEARTBEAT_OK` olan assistant girdilerini atlar.
    - Etkin bir gönderme sırasında ve son geçmiş yenilemesinde, `chat.history` kısa süreliğine daha eski bir snapshot döndürürse sohbet görünümü yerel iyimser kullanıcı/assistant mesajlarını görünür tutar; Gateway geçmişi yetiştiğinde kanonik transcript bu yerel mesajların yerini alır.
    - Canlı `chat` olayları teslimat durumudur; `chat.history` ise kalıcı session transcript'inden yeniden oluşturulur. Tool-final olaylarından sonra Control UI geçmişi yeniden yükler ve yalnızca küçük bir iyimser kuyruğu birleştirir; transcript sınırı [WebChat](/tr/web/webchat) içinde belgelenmiştir.
    - `chat.inject`, session transcript'ine bir assistant notu ekler ve yalnızca UI güncellemeleri için bir `chat` olayı yayınlar (agent çalışması yok, kanal teslimatı yok).
    - Sohbet başlığı, session seçiciden önce agent filtresini gösterir ve session seçici seçili agent ile kapsamlandırılır. Agent değiştirmek yalnızca o agent'a bağlı sessionları gösterir ve henüz kayıtlı dashboard sessionları yoksa o agent'ın ana sessionına döner.
    - Masaüstü genişliklerinde sohbet denetimleri tek bir kompakt satırda kalır ve transcript aşağı kaydırılırken daralır; yukarı kaydırmak, en üste dönmek veya en alta ulaşmak denetimleri geri getirir.
    - Ardışık yinelenen yalnızca metin mesajları, sayı rozetiyle tek balon olarak işlenir. Görsel, ek, araç çıktısı veya canvas önizlemesi taşıyan mesajlar daraltılmaz.
    - Sohbet başlığındaki model ve thinking seçicileri, etkin sessionı `sessions.patch` aracılığıyla hemen yamalar; bunlar tek turluk gönderme seçenekleri değil, kalıcı session geçersiz kılmalarıdır.
    - Aynı session için bir model seçici değişikliği hâlâ kaydedilirken mesaj gönderirseniz composer, seçilen modelin kullanılması için `chat.send` çağırmadan önce o session yamasını bekler.
    - Control UI içinde `/new` yazmak, `session.dmScope: "main"` yapılandırılmış ve mevcut üst öğe agent'ın ana sessionı olmadığı sürece New Chat ile aynı yeni dashboard sessionını oluşturur ve ona geçer; bu durumda ana sessionı yerinde sıfırlar. `/reset` yazmak, Gateway'in mevcut session için açık yerinde sıfırlamasını korur.
    - Sohbet model seçici, Gateway'in yapılandırılmış model görünümünü ister. `agents.defaults.models` varsa, bu allowlist seçiciyi yönlendirir; provider kapsamlı katalogları dinamik tutan `provider/*` girdileri buna dahildir. Aksi halde seçici, açık `models.providers.*.models` girdilerini ve kullanılabilir auth bulunan providerları gösterir. Tam katalog, debug `models.list` RPC'si üzerinden `view: "all"` ile erişilebilir kalır.
    - Yeni Gateway session kullanım raporları güncel context tokenlarını içerdiğinde, sohbet composer alanı kompakt bir context kullanım göstergesi gösterir. Yüksek context baskısında uyarı stiline geçer ve önerilen Compaction seviyelerinde normal session Compaction yolunu çalıştıran kompakt bir düğme gösterir. Eski token snapshotları, Gateway yeniden taze kullanım bildirene kadar gizlenir.

  </Accordion>
  <Accordion title="Konuşma modu (tarayıcı gerçek zamanlı)">
    Konuşma modu kayıtlı bir gerçek zamanlı ses providerı kullanır. OpenAI'yi `talk.realtime.provider: "openai"` ile ve ayrıca `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY` veya bir `openai-codex` OAuth profiliyle yapılandırın; Google'ı `talk.realtime.provider: "google"` ve `talk.realtime.providers.google.apiKey` ile yapılandırın. Tarayıcı hiçbir zaman standart bir provider API anahtarı almaz. OpenAI, WebRTC için geçici bir Realtime istemci secret'ı alır. Google Live, Gateway tarafından token içine kilitlenmiş talimatlar ve araç bildirimleriyle birlikte tarayıcı WebSocket sessionı için tek kullanımlık, kısıtlı bir Live API auth tokenı alır. Yalnızca backend gerçek zamanlı köprüsü sunan providerlar Gateway relay transport üzerinden çalışır; böylece kimlik bilgileri ve vendor soketleri sunucu tarafında kalırken tarayıcı sesi kimliği doğrulanmış Gateway RPC'leri üzerinden taşınır. Realtime session istemi Gateway tarafından birleştirilir; `talk.client.create` çağıranın sağladığı talimat geçersiz kılmalarını kabul etmez.

    Chat composer, Talk başlat/durdur düğmesinin yanında bir Talk seçenekleri düğmesi içerir. Seçenekler bir sonraki Talk sessionına uygulanır ve provider, transport, model, voice, reasoning effort, VAD eşiği, sessizlik süresi ve prefix padding değerlerini geçersiz kılabilir. Bir seçenek boş olduğunda Gateway, varsa yapılandırılmış varsayılanları veya provider varsayılanını kullanır. Gateway relay seçmek backend relay yolunu zorunlu kılar; WebRTC seçmek sessionı istemci sahipliğinde tutar ve provider tarayıcı sessionı oluşturamazsa sessizce relay'e düşmek yerine başarısız olur.

    Chat composer içinde Talk denetimi, mikrofon dictation düğmesinin yanındaki dalgalar düğmesidir. Talk başladığında composer durum satırı `Connecting Talk...`, ses bağlıyken `Talk live` veya gerçek zamanlı bir tool call, `talk.client.toolCall` aracılığıyla yapılandırılmış daha büyük modele danışırken `Asking OpenClaw...` gösterir.

    Maintainer canlı smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`, OpenAI backend WebSocket köprüsünü, OpenAI tarayıcı WebRTC SDP alışverişini, Google Live kısıtlı token tarayıcı WebSocket kurulumunu ve sahte mikrofon medyasıyla Gateway relay tarayıcı adaptörünü doğrular. Komut yalnızca provider durumunu yazdırır ve secretları loglamaz.

  </Accordion>
  <Accordion title="Durdurma ve iptal">
    - **Stop**'a tıklayın (`chat.abort` çağırır).
    - Bir çalışma etkinken normal takip mesajları kuyruğa alınır. Kuyruktaki bir mesajda **Steer**'e tıklayarak o takip mesajını çalışan tura enjekte edin.
    - Bant dışı iptal etmek için `/stop` yazın (veya `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` gibi tek başına iptal ifadeleri).
    - `chat.abort`, o session için tüm etkin çalışmaları iptal etmek üzere `{ sessionKey }` destekler (`runId` olmadan).

  </Accordion>
  <Accordion title="İptal kısmi tutma">
    - Bir çalışma iptal edildiğinde, kısmi assistant metni UI içinde hâlâ gösterilebilir.
    - Gateway, arabelleğe alınmış çıktı varsa iptal edilmiş kısmi assistant metnini transcript geçmişinde kalıcılaştırır.
    - Kalıcılaştırılmış girdiler iptal metadata'sı içerir; böylece transcript tüketicileri iptal kısımlarını normal tamamlama çıktısından ayırt edebilir.

  </Accordion>
</AccordionGroup>

## PWA kurulumu ve Web Push

Control UI bir `manifest.webmanifest` ve service worker ile gelir; bu nedenle modern tarayıcılar bunu bağımsız bir PWA olarak kurabilir. Web Push, sekme veya tarayıcı penceresi açık olmasa bile Gateway'in kurulu PWA'yı bildirimlerle uyandırmasını sağlar.

| Yüzey                                                 | Ne yapar                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest'i. Erişilebilir olduğunda tarayıcılar "Install app" önerir. |
| `ui/public/sw.js`                                     | `push` olaylarını ve bildirim tıklamalarını işleyen service worker. |
| `push/vapid-keys.json` (OpenClaw state dizini altında) | Web Push yüklerini imzalamak için kullanılan otomatik üretilmiş VAPID anahtar çifti. |
| `push/web-push-subscriptions.json`                    | Kalıcılaştırılmış tarayıcı abonelik endpoint'leri.                 |

Anahtarları sabitlemek istediğinizde (çok hostlu dağıtımlar, secret rotasyonu veya testler için) VAPID anahtar çiftini Gateway sürecindeki env var'lar üzerinden geçersiz kılın:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (varsayılan `mailto:openclaw@localhost`)

Control UI, tarayıcı aboneliklerini kaydetmek ve test etmek için şu scope kapılı Gateway yöntemlerini kullanır:

- `push.web.vapidPublicKey` — etkin VAPID public key'i getirir.
- `push.web.subscribe` — bir `endpoint` ile `keys.p256dh`/`keys.auth` kaydeder.
- `push.web.unsubscribe` — kayıtlı bir endpoint'i kaldırır.
- `push.web.test` — çağıranın aboneliğine bir test bildirimi gönderir.

<Note>
Web Push, iOS APNS relay yolundan (relay destekli push için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın) ve yerel mobil eşleşmeyi hedefleyen mevcut `push.test` yönteminden bağımsızdır.
</Note>

## Hosted embed'ler

Assistant mesajları, `[embed ...]` shortcode ile hosted web içeriğini satır içinde işleyebilir. iframe sandbox ilkesi `gateway.controlUi.embedSandbox` tarafından denetlenir:

<Tabs>
  <Tab title="strict">
    Hosted embed'lerin içinde script yürütmeyi devre dışı bırakır.
  </Tab>
  <Tab title="scripts (default)">
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
`trusted` değerini yalnızca gömülü belge gerçekten same-origin davranışına ihtiyaç duyduğunda kullanın. Çoğu agent tarafından üretilen oyun ve etkileşimli canvas için `scripts` daha güvenli seçimdir.
</Warning>

Mutlak harici `http(s)` embed URL'leri varsayılan olarak engelli kalır. Bilerek `[embed url="https://..."]` değerinin üçüncü taraf sayfaları yüklemesini istiyorsanız `gateway.controlUi.allowExternalEmbedUrls: true` ayarlayın.

## Sohbet mesajı genişliği

Gruplanmış sohbet mesajları okunabilir bir varsayılan max-width kullanır. Geniş monitör dağıtımları, paketlenmiş CSS'i yamalamadan `gateway.controlUi.chatMessageMaxWidth` ayarlayarak bunu geçersiz kılabilir:

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
  <Tab title="Entegre Tailscale Serve (tercih edilen)">
    Gateway'i loopback üzerinde tutun ve Tailscale Serve'ün HTTPS ile proxy etmesine izin verin:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Açın:

    - `https://<magicdns>/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Varsayılan olarak, `gateway.auth.allowTailscale` `true` olduğunda Denetim Arayüzü/WebSocket Serve istekleri Tailscale kimlik başlıkları (`tailscale-user-login`) ile kimlik doğrulayabilir. OpenClaw, `x-forwarded-for` adresini `tailscale whois` ile çözümleyip başlıkla eşleştirerek kimliği doğrular ve bunları yalnızca istek Tailscale'in `x-forwarded-*` başlıklarıyla loopback'e ulaştığında kabul eder. Tarayıcı cihaz kimliğine sahip Denetim Arayüzü operatör oturumları için bu doğrulanmış Serve yolu, cihaz eşleştirme gidiş dönüşünü de atlar; cihazsız tarayıcılar ve düğüm rolü bağlantıları normal cihaz kontrollerini izlemeye devam eder. Serve trafiği için bile açık paylaşılan gizli kimlik bilgileri gerektirmek istiyorsanız `gateway.auth.allowTailscale: false` olarak ayarlayın. Ardından `gateway.auth.mode: "token"` veya `"password"` kullanın.

    Bu zaman uyumsuz Serve kimliği yolu için, aynı istemci IP'si ve kimlik doğrulama kapsamına ait başarısız kimlik doğrulama denemeleri, hız sınırı yazımlarından önce seri hale getirilir. Bu nedenle aynı tarayıcıdan gelen eşzamanlı hatalı yeniden denemelerde, paralel yarışan iki düz uyuşmazlık yerine ikinci istekte `retry later` görünebilir.

    <Warning>
    Jetonsuz Serve kimlik doğrulaması, gateway ana makinesinin güvenilir olduğunu varsayar. Bu ana makinede güvenilmeyen yerel kod çalışabiliyorsa jeton/parola kimlik doğrulaması gerektirin.
    </Warning>

  </Tab>
  <Tab title="tailnet + jetona bağla">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Ardından şunu açın:

    - `http://<tailscale-ip>:18789/` (veya yapılandırılmış `gateway.controlUi.basePath` değeriniz)

    Eşleşen paylaşılan gizli anahtarı arayüz ayarlarına yapıştırın (`connect.params.auth.token` veya `connect.params.auth.password` olarak gönderilir).

  </Tab>
</Tabs>

## Güvensiz HTTP

Panoyu düz HTTP üzerinden (`http://<lan-ip>` veya `http://<tailscale-ip>`) açarsanız tarayıcı **güvenli olmayan bağlamda** çalışır ve WebCrypto'yu engeller. Varsayılan olarak OpenClaw, cihaz kimliği olmayan Denetim Arayüzü bağlantılarını **engeller**.

Belgelenmiş istisnalar:

- `gateway.controlUi.allowInsecureAuth=true` ile yalnızca localhost için güvensiz HTTP uyumluluğu
- `gateway.auth.mode: "trusted-proxy"` üzerinden başarılı operatör Denetim Arayüzü kimlik doğrulaması
- acil durum `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Önerilen düzeltme:** HTTPS (Tailscale Serve) kullanın veya arayüzü yerel olarak açın:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway ana makinesinde)

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

    - Localhost Denetim Arayüzü oturumlarının, güvenli olmayan HTTP bağlamlarında cihaz kimliği olmadan devam etmesine izin verir.
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
    `dangerouslyDisableDeviceAuth`, Denetim Arayüzü cihaz kimliği kontrollerini devre dışı bırakır ve ciddi bir güvenlik düşürmesidir. Acil kullanım sonrasında hızla geri alın.
    </Warning>

  </Accordion>
  <Accordion title="Güvenilir proxy notu">
    - Başarılı güvenilir proxy kimlik doğrulaması, cihaz kimliği olmadan **operatör** Denetim Arayüzü oturumlarını kabul edebilir.
    - Bu, düğüm rolü Denetim Arayüzü oturumlarını kapsamaz.
    - Aynı ana makinedeki loopback ters proxy'leri yine de güvenilir proxy kimlik doğrulamasını sağlamaz; bkz. [Güvenilir proxy kimlik doğrulaması](/tr/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

HTTPS kurulum rehberliği için bkz. [Tailscale](/tr/gateway/tailscale).

## İçerik güvenliği politikası

Denetim Arayüzü sıkı bir `img-src` politikasıyla gelir: yalnızca **aynı kökenli** varlıklara, `data:` URL'lerine ve yerel olarak oluşturulan `blob:` URL'lerine izin verilir. Uzak `http(s)` ve protokole göreli görüntü URL'leri tarayıcı tarafından reddedilir ve ağ getirme istekleri oluşturmaz.

Bunun pratikte anlamı:

- Göreli yollar altında sunulan avatarlar ve görüntüler (örneğin `/avatars/<id>`) hâlâ işlenir; buna arayüzün getirip yerel `blob:` URL'lerine dönüştürdüğü kimlik doğrulamalı avatar rotaları da dahildir.
- Satır içi `data:image/...` URL'leri hâlâ işlenir (protokol içi yükler için kullanışlıdır).
- Denetim Arayüzü tarafından oluşturulan yerel `blob:` URL'leri hâlâ işlenir.
- Kanal meta verilerinin yaydığı uzak avatar URL'leri, Denetim Arayüzü'nün avatar yardımcılarında ayıklanır ve yerleşik logo/rozetle değiştirilir; böylece ele geçirilmiş veya kötü amaçlı bir kanal, operatör tarayıcısından rastgele uzak görüntü getirme isteği başlatamaz.

Bu davranışı elde etmek için hiçbir şeyi değiştirmeniz gerekmez — her zaman açıktır ve yapılandırılamaz.

## Avatar rotası kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, Denetim Arayüzü avatar uç noktası API'nin geri kalanıyla aynı gateway jetonunu gerektirir:

- `GET /avatar/<agentId>`, avatar görüntüsünü yalnızca kimliği doğrulanmış çağıranlara döndürür. `GET /avatar/<agentId>?meta=1`, avatar meta verilerini aynı kural altında döndürür.
- Her iki rotaya yapılan kimliği doğrulanmamış istekler reddedilir (kardeş assistant-media rotasıyla eşleşir). Bu, avatar rotasının başka türlü korunan ana makinelerde ajan kimliğini sızdırmasını önler.
- Denetim Arayüzü, avatarları getirirken gateway jetonunu bearer başlığı olarak iletir ve görüntünün panolarda hâlâ işlenebilmesi için kimliği doğrulanmış blob URL'leri kullanır.

Gateway kimlik doğrulamasını devre dışı bırakırsanız (paylaşılan ana makinelerde önerilmez), avatar rotası da gateway'in geri kalanıyla uyumlu olarak kimlik doğrulamasız hale gelir.

## Asistan medya rotası kimlik doğrulaması

Gateway kimlik doğrulaması yapılandırıldığında, asistan yerel medya önizlemeleri iki adımlı bir rota kullanır:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` normal Denetim Arayüzü operatör kimlik doğrulamasını gerektirir. Tarayıcı, kullanılabilirliği kontrol ederken gateway jetonunu bearer başlığı olarak gönderir.
- Başarılı meta veri yanıtları, tam olarak o kaynak yoluna kapsamlandırılmış kısa ömürlü bir `mediaTicket` içerir.
- Tarayıcıda işlenen görüntü, ses, video ve belge URL'leri etkin gateway jetonu veya parolası yerine `mediaTicket=<ticket>` kullanır. Bilet hızla sona erer ve farklı bir kaynağı yetkilendiremez.

Bu, yeniden kullanılabilir gateway kimlik bilgilerini görünür medya URL'lerine koymadan normal medya işlemenin tarayıcıya yerleşik medya öğeleriyle uyumlu kalmasını sağlar.

## Arayüzü derleme

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

Ardından arayüzü Gateway WS URL'nize yönlendirin (ör. `ws://127.0.0.1:18789`).

## Boş Denetim Arayüzü sayfası

Tarayıcı boş bir pano yüklüyorsa ve DevTools işe yarar bir hata göstermiyorsa, bir uzantı veya erken içerik betiği JavaScript modül uygulamasının değerlendirilmesini engellemiş olabilir. Statik sayfa, başlangıçtan sonra `<openclaw-app>` kaydedilmediğinde görünen düz bir HTML kurtarma paneli içerir.

Tarayıcı ortamını değiştirdikten sonra panelin **Tekrar dene** eylemini kullanın veya şu kontrollerden sonra elle yeniden yükleyin:

- Tüm sayfalara enjekte eden uzantıları, özellikle `<all_urls>` içerik betiklerine sahip uzantıları devre dışı bırakın.
- Gizli pencere, temiz bir tarayıcı profili veya başka bir tarayıcı deneyin.
- Gateway'i çalışır durumda tutun ve tarayıcı değişikliğinden sonra aynı pano URL'sini doğrulayın.

## Hata ayıklama/test etme: geliştirme sunucusu + uzak Gateway

Denetim Arayüzü statik dosyalardır; WebSocket hedefi yapılandırılabilir ve HTTP kökeninden farklı olabilir. Bu, Vite geliştirme sunucusunu yerelde isterken Gateway'in başka yerde çalıştığı durumlarda kullanışlıdır.

<Steps>
  <Step title="Arayüz geliştirme sunucusunu başlatın">
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
    - `gatewayUrl`, yükleme sonrasında localStorage içinde saklanır ve URL'den kaldırılır.
    - `gatewayUrl` üzerinden tam bir `ws://` veya `wss://` uç noktası geçirirseniz tarayıcının sorgu dizesini doğru ayrıştırması için `gatewayUrl` değerini URL kodlayın.
    - `token` mümkün olduğunda URL parçası (`#token=...`) üzerinden geçirilmelidir. Parçalar sunucuya gönderilmez; bu da istek günlüğü ve Referer sızıntısını önler. Eski `?token=` sorgu parametreleri uyumluluk için hâlâ bir kez içe aktarılır, ancak yalnızca yedek olarak kullanılır ve bootstrap sonrasında hemen temizlenir.
    - `password` yalnızca bellekte tutulur.
    - `gatewayUrl` ayarlandığında arayüz yapılandırmaya veya ortam kimlik bilgilerine geri dönmez. `token` (veya `password`) değerini açıkça sağlayın. Eksik açık kimlik bilgileri hatadır.
    - Gateway TLS arkasındaysa (Tailscale Serve, HTTPS proxy vb.) `wss://` kullanın.
    - `gatewayUrl`, clickjacking'i önlemek için yalnızca üst düzey pencerede kabul edilir (gömülü olarak değil).
    - loopback olmayan Denetim Arayüzü dağıtımları `gateway.controlUi.allowedOrigins` değerini açıkça ayarlamalıdır (tam kökenler). Buna uzak geliştirme kurulumları dahildir.
    - Gateway başlangıcı, etkin çalışma zamanı bağlama adresi ve portundan `http://localhost:<port>` ve `http://127.0.0.1:<port>` gibi yerel kökenleri oluşturabilir; ancak uzak tarayıcı kökenleri yine de açık girdiler gerektirir.
    - Sıkı denetlenen yerel testler dışında `gateway.controlUi.allowedOrigins: ["*"]` kullanmayın. Bu, herhangi bir tarayıcı kökenine izin ver anlamına gelir; "kullandığım ana makineyle eşleştir" anlamına gelmez.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`, Host başlığı köken yedekleme modunu etkinleştirir; ancak bu tehlikeli bir güvenlik modudur.

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
