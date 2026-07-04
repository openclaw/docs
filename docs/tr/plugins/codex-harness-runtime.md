---
read_when:
    - Codex harness çalışma zamanı destek sözleşmesine ihtiyacınız var
    - Yerel Codex araçları, hook'lar, Compaction veya geri bildirim yüklemesinde hata ayıklıyorsunuz
    - OpenClaw ve Codex koşum turları genelinde Plugin davranışını değiştiriyorsunuz
summary: Codex koşumu için çalışma zamanı sınırları, hook'lar, araçlar, izinler ve tanılamalar
title: Codex harness çalışma zamanı
x-i18n:
    generated_at: "2026-07-04T20:41:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c681de59a53b85402e95b1d3f2aa853e78989185ad05cf1f0497814be5959232
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Bu sayfa, Codex çalışma altyapısı turları için çalışma zamanı sözleşmesini belgeler. Kurulum ve
yönlendirme için [Codex çalışma altyapısı](/tr/plugins/codex-harness) ile başlayın. Yapılandırma alanları için
[Codex çalışma altyapısı referansı](/tr/plugins/codex-harness-reference) bölümüne bakın.

## Genel Bakış

Codex modu, altında farklı bir model çağrısı olan OpenClaw değildir. Codex,
yerel model döngüsünün daha büyük bir bölümüne sahip olur ve OpenClaw plugin, araç, oturum ve
tanılama yüzeylerini bu sınırın etrafında uyarlar.

OpenClaw yine de kanal yönlendirmesine, oturum dosyalarına, görünür ileti teslimine,
OpenClaw dinamik araçlarına, onaylara, medya teslimine ve transkript aynasına sahiptir.
Codex, kanonik yerel iş parçacığına, yerel model döngüsüne, yerel araç
devamına ve yerel Compaction'a sahiptir.

İstem yönlendirmesi yalnızca sağlayıcı dizesini değil, seçilen çalışma zamanını izler. Bir
yerel Codex turu Codex app-server geliştirici yönergelerini alırken,
açık bir OpenClaw uyumluluk rotası Codex biçimli OpenAI kimlik doğrulaması veya aktarımı kullansa bile
normal OpenClaw sistem istemini korur.

Yerel Codex, etkin Codex iş parçacığı yapılandırmasına göre Codex'e ait taban/model yönergelerini ve proje belgesi davranışını korur.
OpenClaw, çalışma alanı kişilik dosyaları ve OpenClaw ajan kimliği yetkili kalacak şekilde,
Codex'in yerleşik kişiliği devre dışı bırakılmış olarak yerel
Codex iş parçacıklarını başlatır ve sürdürür. Hafif
OpenClaw çalıştırmaları mevcut proje belgesi bastırmalarını korumaya devam eder. OpenClaw
geliştirici yönergeleri kaynak kanal teslimi,
OpenClaw dinamik araçları, ACP delegasyonu, bağdaştırıcı bağlamı ve
etkin ajan çalışma alanı profil dosyaları gibi OpenClaw çalışma zamanı konularını kapsar. OpenClaw Skills katalogları ve araçla yönlendirilen
`MEMORY.md` işaretçileri, yerel Codex için tur kapsamlı iş birliği geliştirici
yönergeleri olarak yansıtılır. Etkin `BOOTSTRAP.md` içeriği ve tam
`MEMORY.md` yedek enjeksiyonu yine tur girdisi referans bağlamını kullanır.

## İş parçacığı bağları ve model değişiklikleri

Bir OpenClaw oturumu mevcut bir Codex iş parçacığına eklendiğinde, sonraki tur
geçerli olarak seçilen OpenAI modelini, onay politikasını, sandbox'ı ve hizmet
katmanını yeniden app-server'a gönderir. `openai/gpt-5.5` değerinden
`openai/gpt-5.2` değerine geçmek iş parçacığı bağını korur ancak Codex'ten
yeni seçilen modelle devam etmesini ister.

## Görünür yanıtlar ve Heartbeat'ler

Doğrudan/kaynak sohbet turu Codex çalışma altyapısı üzerinden çalıştığında, görünür yanıtlar
dahili WebChat yüzeyleri için varsayılan olarak otomatik son asistan teslimine ayarlanır.
Bu, Codex'i Pi çalışma altyapısı istem sözleşmesiyle uyumlu tutar: ajanlar normal şekilde yanıt verir
ve OpenClaw son metni kaynak konuşmaya gönderir. Doğrudan/kaynak sohbetin
ajan `message(action="send")` çağırmadıkça son asistan metnini bilinçli olarak gizli tutması gerektiğinde
`messages.visibleReplies: "message_tool"` değerini ayarlayın.

Codex Heartbeat turları da varsayılan olarak aranabilir OpenClaw
araç kataloğunda `heartbeat_respond` alır; böylece ajan, uyandırmanın sessiz kalması mı
yoksa bildirim göndermesi mi gerektiğini bu kontrol akışını son metne kodlamadan kaydedebilir.

Heartbeat'e özgü inisiyatif rehberliği, Heartbeat turunun kendisinde Codex iş birliği modu
geliştirici yönergesi olarak gönderilir. Sıradan sohbet turları, normal
çalışma zamanı istemlerinde Heartbeat felsefesini taşımak yerine
Codex Varsayılan modunu geri yükler. Boş olmayan bir `HEARTBEAT.md` varsa, Heartbeat
iş birliği modu yönergeleri içeriğini satır içine almak yerine Codex'i dosyaya yönlendirir.

## Hook sınırları

Codex çalışma altyapısının üç hook katmanı vardır:

| Katman                                | Sahip                    | Amaç                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw plugin hook'ları             | OpenClaw                 | OpenClaw ve Codex çalışma altyapıları genelinde ürün/plugin uyumluluğu. |
| Codex app-server uzantı ara katmanı   | OpenClaw paketli plugin'leri | OpenClaw dinamik araçları etrafında tur başına bağdaştırıcı davranışı. |
| Codex yerel hook'ları                 | Codex                    | Codex yapılandırmasından düşük seviyeli Codex yaşam döngüsü ve yerel araç politikası. |

OpenClaw, OpenClaw plugin davranışını yönlendirmek için proje veya genel Codex `hooks.json` dosyalarını kullanmaz.
Desteklenen yerel araç ve izin köprüsü için
OpenClaw, `PreToolUse`, `PostToolUse`,
`PermissionRequest` ve `Stop` için iş parçacığı başına Codex yapılandırması enjekte eder.

Codex app-server onayları etkin olduğunda, yani `approvalPolicy`
`"never"` olmadığında, varsayılan enjekte edilen yerel hook yapılandırması
`PermissionRequest` öğesini atlar; böylece Codex'in app-server inceleyicisi ve OpenClaw'ın onay köprüsü
incelemeden sonra gerçek yükseltmeleri işler. Operatörler, uyumluluk rölesine ihtiyaç duyduklarında
`nativeHookRelay.events` içine açıkça `permission_request` ekleyebilir.

`SessionStart` ve `UserPromptSubmit` gibi diğer Codex hook'ları
Codex düzeyinde kontroller olarak kalır. Bunlar v1 sözleşmesinde OpenClaw plugin hook'ları olarak sunulmaz.

OpenClaw dinamik araçları için OpenClaw, Codex çağrıyı istedikten sonra aracı yürütür;
bu nedenle OpenClaw, çalışma altyapısı bağdaştırıcısında sahip olduğu plugin ve ara katman davranışını tetikler.
Codex'e yerel araçlar için kanonik araç kaydına Codex sahiptir.
OpenClaw seçili olayları aynalayabilir, ancak Codex bu işlemi app-server veya yerel hook
geri çağrıları üzerinden sunmadıkça yerel Codex iş parçacığını yeniden yazamaz.

Codex app-server rapor modu `PreToolUse` olayları, plugin onay isteklerini
eşleşen app-server onayına erteler. Bir OpenClaw `before_tool_call` hook'u,
yerel yük rapor onay modunu ayarlarken (`openclaw_approval_mode` değeri `"report"`)
`requireApproval` döndürürse, yerel hook rölesi
plugin onay gereksinimini kaydeder ve yerel karar döndürmez. Codex aynı araç kullanımı için
app-server onay isteğini gönderdiğinde, OpenClaw plugin
onay istemini açar ve kararı Codex'e geri eşler. Codex `PermissionRequest`
olayları ayrı bir onay yoludur ve çalışma zamanı bu köprü için yapılandırıldığında
yine de OpenClaw onayları üzerinden yönlendirilebilir.

Codex app-server öğe bildirimleri, yerel
`PostToolUse` rölesi tarafından zaten kapsanmayan yerel araç tamamlanmaları için eşzamansız `after_tool_call`
gözlemleri de sağlar. Bu gözlemler yalnızca telemetri ve plugin
uyumluluğu içindir; yerel araç çağrısını engelleyemez, geciktiremez veya değiştiremez.

Compaction ve LLM yaşam döngüsü projeksiyonları, yerel Codex hook komutlarından değil,
Codex app-server bildirimlerinden ve OpenClaw bağdaştırıcı durumundan gelir.
OpenClaw'ın `before_compaction`, `after_compaction`, `llm_input` ve
`llm_output` olayları, Codex'in dahili isteğinin veya Compaction yüklerinin bayt bayt yakalanması değil,
bağdaştırıcı düzeyinde gözlemlerdir.

Codex yerel `hook/started` ve `hook/completed` app-server bildirimleri,
yörünge ve hata ayıklama için `codex_app_server.hook` ajan olayları olarak yansıtılır.
Bunlar OpenClaw plugin hook'larını çağırmaz.

## V1 destek sözleşmesi

Codex çalışma zamanı v1'de desteklenenler:

| Yüzey                                         | Destek                                                                           | Neden                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex aracılığıyla OpenAI model döngüsü       | Desteklenir                                                                      | Codex app-server OpenAI turunu, yerel iş parçacığı sürdürmeyi ve yerel araç devamını yönetir.                                                                                                                                                                                                                                                                                                                                                                                       |
| OpenClaw kanal yönlendirme ve teslimi         | Desteklenir                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model çalışma zamanının dışında kalır.                                                                                                                                                                                                                                                                                                                                                                               |
| OpenClaw dinamik araçları                     | Desteklenir                                                                      | Codex, OpenClaw'dan bu araçları yürütmesini ister; bu yüzden OpenClaw yürütme yolunda kalır.                                                                                                                                                                                                                                                                                                                                                                                        |
| İstem ve bağlam Plugin'leri                   | Desteklenir                                                                      | OpenClaw, OpenClaw'a özgü istemi/bağlamı Codex turuna yansıtır; Codex'e ait temel, model ve yapılandırılmış proje dokümanı istemlerini ise yerel Codex hattında bırakır. OpenClaw, yerel iş parçacıkları için Codex'in yerleşik kişiliğini devre dışı bırakır; böylece aracı çalışma alanı kişilik dosyaları yetkili kalır. Yerel Codex geliştirici talimatları yalnızca açıkça `codex_app_server` kapsamına alınmış komut rehberliğini kabul eder; eski global komut ipuçları Codex dışı istem yüzeyleri için kalır. |
| Bağlam motoru yaşam döngüsü                   | Desteklenir                                                                      | Birleştirme, alım ve tur sonrası bakım Codex turlarının çevresinde çalışır. Bağlam motorları yerel Codex Compaction'ın yerini almaz.                                                                                                                                                                                                                                                                                                                                                |
| Dinamik araç kancaları                        | Desteklenir                                                                      | `before_tool_call`, `after_tool_call` ve araç sonucu ara yazılımı OpenClaw'a ait dinamik araçların çevresinde çalışır.                                                                                                                                                                                                                                                                                                                                                              |
| Yaşam döngüsü kancaları                       | Bağdaştırıcı gözlemleri olarak desteklenir                                       | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction` dürüst Codex modu yükleriyle tetiklenir.                                                                                                                                                                                                                                                                                                                                                          |
| Nihai yanıt revizyon kapısı                   | Yerel kanca aktarımı aracılığıyla desteklenir                                    | Codex `Stop`, `before_agent_finalize` öğesine aktarılır; `revise`, sonlandırmadan önce Codex'ten bir model geçişi daha ister.                                                                                                                                                                                                                                                                                                                                                       |
| Yerel kabuk, yama ve MCP engelleme veya gözlem | Yerel kanca aktarımı aracılığıyla desteklenir                                    | Codex `PreToolUse` ve `PostToolUse`, Codex app-server `0.125.0` veya daha yenisindeki MCP yükleri dahil olmak üzere işlenmiş yerel araç yüzeyleri için aktarılır. Engelleme desteklenir; argüman yeniden yazma desteklenmez.                                                                                                                                                                                                                                                        |
| Yerel izin politikası                         | Codex app-server onayları ve uyumluluk yerel kanca aktarımı aracılığıyla desteklenir | Codex app-server onay istekleri Codex incelemesinden sonra OpenClaw üzerinden yönlendirilir. `PermissionRequest` yerel kanca aktarımı, yerel onay modları için isteğe bağlıdır çünkü Codex bunu koruyucu incelemesinden önce yayar.                                                                                                                                                                                                                                                  |
| App-server yörünge yakalama                   | Desteklenir                                                                      | OpenClaw, app-server'a gönderdiği isteği ve aldığı app-server bildirimlerini kaydeder.                                                                                                                                                                                                                                                                                                                                                                                               |

Codex çalışma zamanı v1'de desteklenmeyenler:

| Yüzey                                               | V1 sınırı                                                                                                                                       | Gelecek yol                                                                                |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Yerel araç argüman mutasyonu                        | Codex yerel araç öncesi kancaları engelleyebilir, ancak OpenClaw Codex'e yerel araç argümanlarını yeniden yazmaz.                              | Yedek araç girdisi için Codex kanca/şema desteği gerektirir.                              |
| Düzenlenebilir Codex yerel transkript geçmişi       | Codex kanonik yerel iş parçacığı geçmişinin sahibidir. OpenClaw bir aynaya sahiptir ve gelecekteki bağlamı yansıtabilir, ancak desteklenmeyen iç yapıları değiştirmemelidir. | Yerel iş parçacığı müdahalesi gerekirse açık Codex app-server API'leri ekleyin.           |
| Codex yerel araç kayıtları için `tool_result_persist` | Bu kanca, Codex yerel araç kayıtlarını değil, OpenClaw'a ait transkript yazımlarını dönüştürür.                                                 | Dönüştürülmüş kayıtlar aynalanabilir, ancak kanonik yeniden yazma Codex desteği gerektirir. |
| Zengin yerel Compaction meta verileri               | OpenClaw yerel Compaction isteyebilir, ancak kararlı bir tutulan/bırakılan listesi, token deltası, tamamlama özeti veya özet yükü almaz.        | Daha zengin Codex Compaction olayları gerektirir.                                         |
| Compaction müdahalesi                               | OpenClaw, Plugin'lerin veya bağlam motorlarının yerel Codex Compaction'ı veto etmesine, yeniden yazmasına veya değiştirmesine izin vermez.      | Plugin'lerin yerel Compaction'ı veto etmesi veya yeniden yazması gerekiyorsa Codex Compaction öncesi/sonrası kancaları ekleyin. |
| Bayt bayt model API isteği yakalama                 | OpenClaw app-server isteklerini ve bildirimlerini yakalayabilir, ancak Codex çekirdeği nihai OpenAI API isteğini içeride oluşturur.             | Codex model isteği izleme olayı veya hata ayıklama API'si gerektirir.                     |

## Yerel izinler ve MCP istemleri

`PermissionRequest` için OpenClaw, yalnızca politika karar verdiğinde açık izin
veya ret kararları döndürür. Kararsız sonuç izin değildir. Codex bunu kanca
kararı yok olarak ele alır ve kendi koruyucu veya kullanıcı onayı yoluna düşer.

Codex app-server onay modları varsayılan olarak bu yerel kancayı atlar. Bu davranış
`permission_request`, `nativeHookRelay.events` içinde açıkça dahil edildiğinde
veya bir uyumluluk çalışma zamanı bunu yüklediğinde geçerlidir.

Bir operatör Codex yerel izin isteği için `allow-always` seçtiğinde, OpenClaw
bu kesin sağlayıcı/oturum/araç girdisi/cwd parmak izini sınırlı bir oturum
penceresi için hatırlar. Hatırlanan karar kasıtlı olarak yalnızca tam eşleşmedir:
değişen bir komut, argümanlar, araç yükü veya cwd yeni bir onay oluşturur.

Codex MCP araç onay istemleri, Codex `_meta.codex_approval_kind` değerini
`"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışı üzerinden
yönlendirilir. Codex `request_user_input` istemleri kaynak sohbetine geri
gönderilir ve sıradaki takip mesajı, ek bağlam olarak yönlendirilmek yerine o
yerel sunucu isteğini yanıtlar. Diğer MCP istem istekleri kapalı biçimde başarısız olur.

Bu istemleri taşıyan genel Plugin onay akışı için bkz.
[Plugin izin istekleri](/tr/plugins/plugin-permission-requests).

## Kuyruk yönlendirme

Etkin çalışma kuyruğu yönlendirmesi Codex app-server `turn/steer` üzerine eşlenir.
Varsayılan `messages.queue.mode: "steer"` ile OpenClaw, yönlendirme modu sohbet
mesajlarını yapılandırılmış sessiz pencere için toplu hale getirir ve bunları
varış sırasına göre tek bir `turn/steer` isteği olarak gönderir.

Codex incelemesi ve manuel Compaction dönüşleri, aynı dönüşteki yönlendirmeyi reddedebilir. Bu
durumda OpenClaw, istemi başlatmadan önce etkin çalışmanın bitmesini bekler.
İletilerin yönlendirme yerine varsayılan olarak kuyruğa alınması gerektiğinde
`/queue followup` veya `/queue collect` kullanın. Bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

## Codex geri bildirim yüklemesi

Yerel Codex çalışma koşumunu kullanan bir oturum için `/diagnostics [note]`
onaylandığında, OpenClaw ilgili Codex iş parçacıkları için Codex app-server
`feedback/upload` çağrısını da yapar. Yükleme, app-server'dan listelenen her iş
parçacığı ve varsa oluşturulan Codex alt iş parçacıkları için günlükleri dahil
etmesini ister.

Yükleme, Codex'in OpenAI sunucularına yönelik normal geri bildirim yolu
üzerinden gider. Bu app-server'da Codex geri bildirimi devre dışıysa komut
app-server hatasını döndürür. Tamamlanan tanılama yanıtı, gönderilen iş
parçacıkları için kanalları, OpenClaw oturum kimliklerini, Codex iş parçacığı
kimliklerini ve yerel `codex resume <thread-id>` komutlarını listeler.

Onayı reddeder veya yok sayarsanız OpenClaw bu Codex kimliklerini yazdırmaz ve
Codex geri bildirimi göndermez. Yükleme, yerel Gateway tanılama dışa aktarımının
yerini almaz. Onay, gizlilik, yerel paket ve grup sohbeti davranışı için bkz.
[Tanılama dışa aktarımı](/tr/gateway/diagnostics).

`/codex diagnostics [note]` komutunu yalnızca tam Gateway tanılama paketi
olmadan, şu anda bağlı olan iş parçacığı için özel olarak Codex geri bildirim
yüklemesini istediğinizde kullanın.

## Compaction ve transkript aynası

Seçilen model Codex çalışma koşumunu kullandığında, yerel iş parçacığı
Compaction'ı Codex app-server'a aittir. OpenClaw, Codex dönüşleri için ön kontrol
Compaction'ı çalıştırmaz, Codex Compaction'ını context-engine Compaction'ı ile
değiştirmez ve yerel Codex Compaction'ı başlatılamadığında OpenClaw veya genel
OpenAI özetlemeye geri dönmez. OpenClaw; kanal geçmişi, arama, `/new`, `/reset`
ve gelecekteki model ya da çalışma koşumu geçişleri için bir transkript aynası
tutar.

`/compact` gibi açık Compaction istekleri veya Plugin tarafından istenen manuel
compact işlemi, `thread/compact/start` ile yerel Codex Compaction'ını başlatır.
OpenClaw, Codex eşleşen `contextCompaction` tamamlama öğesini yayımlayana kadar
isteği ve paylaşılan istemci kirasını açık tutar, ardından Compaction dönüşünü
tamamlandı olarak bildirir. Bu terminal dönüş yapılandırılmış Compaction zaman
aşımını aşarsa OpenClaw yerel dönüş kesintisi ister. Kira ve iş parçacığı başına
Compaction çiti, Codex terminal durumu bildirene veya kesinti RPC'sini onaylayana
kadar tutulmaya devam eder. Codex kesinti ek süresi içinde onay vermezse
OpenClaw, çiti serbest bırakmadan önce bağlantıyı emekliye ayırır. Uzak
bağlantılar, daha sonraki çalışmanın onaylanmamış bir uzak dönüşle çakışmaması
için eşleşen iş parçacığı bağını da ayırır. Emekliye ayrılmış bir bağlantıdaki
diğer dönüşler başarısız olur ve yeni bir istemcide yeniden denenebilir. İstemci
kapanışı, istek iptali veya başarısız bir Compaction dönüşü, başarısız bir işlem
döndürür.

Bir context engine, Codex iş parçacığı önyükleme projeksiyonu istediğinde
OpenClaw; araç çağrısı adlarını ve kimliklerini, girdi şekillerini ve redakte
edilmiş araç sonucu içeriğini yeni Codex iş parçacığına projekte eder. Ham araç
çağrısı argüman değerlerini bu projeksiyona kopyalamaz.

Ayna, app-server bunları yayımladığında kullanıcı istemini, son asistan metnini
ve hafif Codex akıl yürütme veya plan kayıtlarını içerir. OpenClaw, yerel
Compaction başlangıcını ve terminal durumunu kaydeder, ancak insan tarafından
okunabilir bir Compaction özeti veya Codex'in Compaction sonrasında hangi
girdileri tuttuğuna dair denetlenebilir bir liste sunmaz.

Codex kanonik yerel iş parçacığının sahibi olduğu için `tool_result_persist` şu
anda Codex'e yerel araç sonucu kayıtlarını yeniden yazmaz. Yalnızca OpenClaw,
OpenClaw'a ait bir oturum transkripti araç sonucu yazarken uygulanır.

## Medya ve teslimat

OpenClaw medya teslimatının ve medya sağlayıcı seçiminin sahibi olmaya devam
eder. Görsel, video, müzik, PDF, TTS ve medya anlama; `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` ve `messages.tts` gibi eşleşen sağlayıcı/model
ayarlarını kullanır.

Metin, görseller, video, müzik, TTS, onaylar ve ileti araç çıktısı normal
OpenClaw teslimat yolu üzerinden devam eder. Medya üretimi eski çalışma zamanını
gerektirmez. Codex, `savedPath` içeren yerel bir görsel üretim öğesi
yayımladığında, Codex dönüşünde asistan metni olmasa bile OpenClaw bu tam dosyayı
normal yanıt medyası yolu üzerinden iletir.

## İlgili

- [Codex çalışma koşumu](/tr/plugins/codex-harness)
- [Codex çalışma koşumu referansı](/tr/plugins/codex-harness-reference)
- [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins)
- [Plugin kancaları](/tr/plugins/hooks)
- [Ajan çalışma koşumu Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
- [Yörünge dışa aktarımı](/tr/tools/trajectory)
