---
read_when:
    - Codex test altyapısı çalışma zamanı destek sözleşmesine ihtiyacınız var
    - Yerel Codex araçları, hook'ları, Compaction veya geri bildirim yüklemeyi debug ediyorsunuz
    - OpenClaw ve Codex çalıştırma altyapısı turları genelinde Plugin davranışını değiştiriyorsunuz
summary: Codex harness için çalışma zamanı sınırları, hook'lar, araçlar, izinler ve tanılama
title: Codex harness çalışma zamanı
x-i18n:
    generated_at: "2026-06-28T00:51:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84bca37f41003fd78a8e272cb8a54db05e780fab027af60d2ce058cc472ec001
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Bu sayfa, Codex harness turları için runtime sözleşmesini belgeler. Kurulum ve
yönlendirme için [Codex harness](/tr/plugins/codex-harness) ile başlayın. Yapılandırma alanları için
[Codex harness başvurusu](/tr/plugins/codex-harness-reference) bölümüne bakın.

## Genel Bakış

Codex modu, altta farklı bir model çağrısı kullanan OpenClaw değildir. Codex, yerel
model döngüsünün daha fazlasına sahip olur ve OpenClaw; Plugin, araç, oturum ve
tanılama yüzeylerini bu sınırın etrafında uyarlar.

OpenClaw hâlâ kanal yönlendirmesine, oturum dosyalarına, görünür ileti teslimine,
OpenClaw dinamik araçlarına, onaylara, medya teslimine ve transcript aynasına sahip olur.
Codex ise kanonik yerel iş parçacığına, yerel model döngüsüne, yerel araç
devamına ve yerel Compaction'a sahip olur.

Prompt yönlendirmesi yalnızca sağlayıcı dizesini değil, seçili runtime'ı izler. Yerel
bir Codex turu Codex app-server geliştirici talimatlarını alırken, açık bir
OpenClaw uyumluluk rotası Codex tarzı OpenAI kimlik doğrulaması veya aktarımı
kullansa bile normal OpenClaw sistem prompt'unu korur.

Yerel Codex, aktif Codex iş parçacığı yapılandırmasına göre Codex'e ait temel/model
talimatlarını ve proje belgesi davranışını korur. OpenClaw, çalışma alanı
kişilik dosyalarının ve OpenClaw ajan kimliğinin yetkili kalması için yerel
Codex iş parçacıklarını Codex'in yerleşik kişiliği devre dışı bırakılmış olarak
başlatır ve sürdürür. Hafif OpenClaw çalıştırmaları mevcut proje belgesi
bastırmasını yine korur. OpenClaw geliştirici talimatları kaynak kanal teslimi,
OpenClaw dinamik araçları, ACP yetkilendirmesi, bağdaştırıcı bağlamı ve aktif
ajan çalışma alanı profil dosyaları gibi OpenClaw runtime konularını kapsar.
OpenClaw skill katalogları ve araç yönlendirmeli `MEMORY.md` işaretçileri,
yerel Codex için tur kapsamlı iş birliği geliştirici talimatları olarak
yansıtılır. Aktif `BOOTSTRAP.md` içeriği ve tam `MEMORY.md` yedek enjeksiyonu
hâlâ tur girdisi referans bağlamını kullanır.

## İş parçacığı bağlamaları ve model değişiklikleri

Bir OpenClaw oturumu mevcut bir Codex iş parçacığına eklendiğinde, sonraki tur
o anda seçili OpenAI modelini, onay ilkesini, sandbox'ı ve hizmet katmanını
app-server'a yeniden gönderir. `openai/gpt-5.5` değerinden `openai/gpt-5.2`
değerine geçmek iş parçacığı bağlamasını korur, ancak Codex'ten yeni seçilen
modelle devam etmesini ister.

## Görünür yanıtlar ve Heartbeat'ler

Doğrudan/kaynak sohbet turu Codex harness üzerinden çalıştığında, görünür yanıtlar
iç WebChat yüzeyleri için varsayılan olarak otomatik son asistan teslimini kullanır.
Bu, Codex'i Pi harness prompt sözleşmesiyle hizalı tutar: ajanlar normal şekilde
yanıt verir ve OpenClaw son metni kaynak konuşmaya gönderir. Doğrudan/kaynak
sohbetin, ajan `message(action="send")` çağrısı yapmadığı sürece son asistan
metnini kasıtlı olarak gizli tutması gerektiğinde `messages.visibleReplies: "message_tool"`
ayarlayın.

Codex Heartbeat turları varsayılan olarak aranabilir OpenClaw araç kataloğunda
`heartbeat_respond` da alır; böylece ajan, bu kontrol akışını son metne
kodlamadan uyanmanın sessiz kalması mı yoksa bildirim göndermesi mi gerektiğini
kaydedebilir.

Heartbeat'e özgü inisiyatif rehberliği, Heartbeat turunun kendisinde Codex iş
birliği modu geliştirici talimatı olarak gönderilir. Olağan sohbet turları,
normal runtime prompt'larında Heartbeat felsefesini taşımak yerine Codex Default
modunu geri yükler. Boş olmayan bir `HEARTBEAT.md` mevcut olduğunda, Heartbeat
iş birliği modu talimatları içeriğini satır içine almak yerine Codex'i dosyaya
yönlendirir.

## Hook sınırları

Codex harness üç hook katmanına sahiptir:

| Katman                                | Sahip                    | Amaç                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin hook'ları             | OpenClaw                 | OpenClaw ve Codex harness'leri genelinde ürün/Plugin uyumluluğu.    |
| Codex app-server uzantı middleware'i  | OpenClaw paketli Plugin'leri | OpenClaw dinamik araçları etrafında tur başına bağdaştırıcı davranışı. |
| Codex yerel hook'ları                 | Codex                    | Codex yapılandırmasından düşük seviyeli Codex yaşam döngüsü ve yerel araç ilkesi. |

OpenClaw, OpenClaw Plugin davranışını yönlendirmek için proje veya genel Codex
`hooks.json` dosyalarını kullanmaz. Desteklenen yerel araç ve izin köprüsü için
OpenClaw, `PreToolUse`, `PostToolUse`, `PermissionRequest` ve `Stop` için iş
parçacığı başına Codex yapılandırması enjekte eder.

Codex app-server onayları etkinleştirildiğinde, yani `approvalPolicy` `"never"`
değilse, varsayılan enjekte edilen yerel hook yapılandırması `PermissionRequest`
öğesini atlar; böylece Codex'in app-server inceleyicisi ve OpenClaw'ın onay
köprüsü incelemeden sonra gerçek yükseltmeleri işler. Operatörler uyumluluk
aktarımına ihtiyaç duyduklarında `nativeHookRelay.events` içine açıkça
`permission_request` ekleyebilir.

`SessionStart` ve `UserPromptSubmit` gibi diğer Codex hook'ları Codex düzeyi
denetimler olarak kalır. Bunlar v1 sözleşmesinde OpenClaw Plugin hook'ları
olarak sunulmaz.

OpenClaw dinamik araçları için OpenClaw, Codex çağrıyı istedikten sonra aracı
çalıştırır; bu nedenle OpenClaw, sahip olduğu Plugin ve middleware davranışını
harness bağdaştırıcısında tetikler. Codex'e yerel araçlar için Codex kanonik
araç kaydına sahip olur. OpenClaw seçili olayları aynalayabilir, ancak Codex bu
işlemi app-server veya yerel hook callback'leri üzerinden sunmadığı sürece
yerel Codex iş parçacığını yeniden yazamaz.

Codex app-server rapor modu `PreToolUse` olayları, Plugin onay isteklerini
eşleşen app-server onayına erteler. Bir OpenClaw `before_tool_call` hook'u,
yerel yük rapor onay modunu ayarlarken (`openclaw_approval_mode` `"report"` ise)
`requireApproval` döndürürse, yerel hook aktarımı Plugin onay gereksinimini
kaydeder ve yerel bir karar döndürmez. Codex aynı araç kullanımı için app-server
onay isteğini gönderdiğinde, OpenClaw Plugin onay istemini açar ve kararı
Codex'e geri eşler. Codex `PermissionRequest` olayları ayrı bir onay yoludur ve
runtime bu köprü için yapılandırıldığında yine OpenClaw onayları üzerinden
yönlendirilebilir.

Codex app-server öğe bildirimleri, yerel `PostToolUse` aktarımı tarafından
zaten kapsanmayan yerel araç tamamlamaları için zaman uyumsuz `after_tool_call`
gözlemleri de sağlar. Bu gözlemler yalnızca telemetri ve Plugin uyumluluğu
içindir; yerel araç çağrısını engelleyemez, geciktiremez veya değiştiremezler.

Compaction ve LLM yaşam döngüsü projeksiyonları, yerel Codex hook komutlarından
değil Codex app-server bildirimlerinden ve OpenClaw bağdaştırıcı durumundan gelir.
OpenClaw'ın `before_compaction`, `after_compaction`, `llm_input` ve
`llm_output` olayları, Codex'in iç isteğinin veya Compaction yüklerinin bayt bayt
yakalamaları değil, bağdaştırıcı düzeyi gözlemlerdir.

Codex yerel `hook/started` ve `hook/completed` app-server bildirimleri, yörünge
ve hata ayıklama için `codex_app_server.hook` ajan olayları olarak yansıtılır.
Bunlar OpenClaw Plugin hook'larını çağırmaz.

## V1 destek sözleşmesi

Codex runtime v1'de desteklenenler:

| Yüzey                                        | Destek                                                                            | Neden                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex üzerinden OpenAI model döngüsü          | Desteklenir                                                                       | Codex app-server, OpenAI turunu, yerel iş parçacığını sürdürmeyi ve yerel araç devamını sahiplenir.                                                                                                                                                                                                                                                                                                                                                                                  |
| OpenClaw kanal yönlendirme ve teslimi         | Desteklenir                                                                       | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model çalışma zamanının dışında kalır.                                                                                                                                                                                                                                                                                                                                                                                |
| OpenClaw dinamik araçları                     | Desteklenir                                                                       | Codex, OpenClaw'dan bu araçları yürütmesini ister, bu nedenle OpenClaw yürütme yolunda kalır.                                                                                                                                                                                                                                                                                                                                                                                        |
| İstem ve bağlam Plugin'leri                   | Desteklenir                                                                       | OpenClaw, Codex'e ait temel, model ve yapılandırılmış proje dokümanı istemlerini yerel Codex hattında bırakırken OpenClaw'a özgü istem/bağlamı Codex turuna yansıtır. OpenClaw, ajan çalışma alanı kişilik dosyalarının yetkili kalması için yerel iş parçacıklarında Codex'in yerleşik kişiliğini devre dışı bırakır. Yerel Codex geliştirici talimatları yalnızca açıkça `codex_app_server` kapsamına alınmış komut rehberliğini kabul eder; eski genel komut ipuçları Codex dışı istem yüzeyleri için kalır. |
| Bağlam motoru yaşam döngüsü                   | Desteklenir                                                                       | Birleştirme, alma ve tur sonrası bakım Codex turlarının etrafında çalışır. Bağlam motorları yerel Codex compaction'ın yerine geçmez.                                                                                                                                                                                                                                                                                                                                                 |
| Dinamik araç hook'ları                        | Desteklenir                                                                       | `before_tool_call`, `after_tool_call` ve araç sonucu ara katmanı OpenClaw'a ait dinamik araçların etrafında çalışır.                                                                                                                                                                                                                                                                                                                                                                 |
| Yaşam döngüsü hook'ları                       | Bağdaştırıcı gözlemleri olarak desteklenir                                        | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction` dürüst Codex modu yükleriyle tetiklenir.                                                                                                                                                                                                                                                                                                                                                           |
| Son yanıt düzeltme kapısı                     | Yerel hook aktarımı üzerinden desteklenir                                         | Codex `Stop`, `before_agent_finalize`'a aktarılır; `revise`, sonlandırmadan önce Codex'ten bir model geçişi daha ister.                                                                                                                                                                                                                                                                                                                                                              |
| Yerel shell, patch ve MCP engelleme veya gözlemleme | Yerel hook aktarımı üzerinden desteklenir                                         | Codex `PreToolUse` ve `PostToolUse`, Codex app-server `0.125.0` veya daha yenisindeki MCP yükleri dahil olmak üzere kaydedilmiş yerel araç yüzeyleri için aktarılır. Engelleme desteklenir; argüman yeniden yazma desteklenmez.                                                                                                                                                                                                                                                       |
| Yerel izin politikası                         | Codex app-server onayları ve uyumluluk yerel hook aktarımı üzerinden desteklenir | Codex app-server onay istekleri, Codex incelemesinden sonra OpenClaw üzerinden yönlendirilir. `PermissionRequest` yerel hook aktarımı, yerel onay modları için isteğe bağlıdır çünkü Codex bunu koruyucu incelemesinden önce yayar.                                                                                                                                                                                                                                                    |
| App-server yörünge yakalama                   | Desteklenir                                                                       | OpenClaw, app-server'a gönderdiği isteği ve aldığı app-server bildirimlerini kaydeder.                                                                                                                                                                                                                                                                                                                                                                                               |

Codex çalışma zamanı v1'de desteklenmez:

| Yüzey                                               | V1 sınırı                                                                                                                                       | Gelecek yol                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Yerel araç argümanı mutasyonu                       | Codex yerel araç öncesi hook'ları engelleyebilir, ancak OpenClaw Codex'e yerel araç argümanlarını yeniden yazmaz.                              | Değiştirme aracı girdisi için Codex hook/şema desteği gerekir.                            |
| Düzenlenebilir Codex yerel transkript geçmişi       | Codex, kanonik yerel iş parçacığı geçmişini sahiplenir. OpenClaw bir yansıyı sahiplenir ve gelecekteki bağlamı yansıtabilir, ancak desteklenmeyen iç öğeleri mutasyona uğratmamalıdır. | Yerel iş parçacığı cerrahisi gerekiyorsa açık Codex app-server API'leri ekleyin.          |
| Codex'e yerel araç kayıtları için `tool_result_persist` | Bu hook, Codex'e yerel araç kayıtlarını değil, OpenClaw'a ait transkript yazımlarını dönüştürür.                                                | Dönüştürülmüş kayıtlar yansıtılabilir, ancak kanonik yeniden yazma Codex desteği gerektirir. |
| Zengin yerel compaction meta verileri               | OpenClaw yerel compaction isteyebilir, ancak kararlı bir tutulan/bırakılan listesi, token deltası, tamamlama özeti veya özet yükü almaz.        | Daha zengin Codex compaction olayları gerekir.                                            |
| Compaction müdahalesi                               | OpenClaw, Plugin'lerin veya bağlam motorlarının yerel Codex compaction'ı veto etmesine, yeniden yazmasına veya değiştirmesine izin vermez.       | Plugin'lerin yerel compaction'ı veto etmesi veya yeniden yazması gerekiyorsa Codex compaction öncesi/sonrası hook'ları ekleyin. |
| Bayt bayt model API isteği yakalama                 | OpenClaw app-server isteklerini ve bildirimlerini yakalayabilir, ancak Codex çekirdeği nihai OpenAI API isteğini dahili olarak oluşturur.       | Codex model isteği izleme olayı veya hata ayıklama API'si gerekir.                        |

## Yerel izinler ve MCP elicitations

`PermissionRequest` için OpenClaw, yalnızca politika karar verdiğinde açık izin
verme veya reddetme kararları döndürür. Kararsız sonuç izin değildir. Codex bunu
hook kararı yok olarak ele alır ve kendi koruyucu veya kullanıcı onayı yoluna
devreder.

Codex app-server onay modları varsayılan olarak bu yerel hook'u atlar. Bu
davranış, `permission_request` açıkça `nativeHookRelay.events` içinde yer
aldığında veya bir uyumluluk çalışma zamanı bunu yüklediğinde geçerlidir.

Bir operatör, Codex yerel izin isteği için `allow-always` seçtiğinde, OpenClaw bu
kesin sağlayıcı/oturum/araç girdisi/cwd parmak izini sınırlı bir oturum
penceresi boyunca hatırlar. Hatırlanan karar kasıtlı olarak yalnızca tam
eşleşmelidir: değişen bir komut, argümanlar, araç yükü veya cwd yeni bir onay
oluşturur.

Codex MCP araç onayı elicitations, Codex `_meta.codex_approval_kind` değerini
`"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışı üzerinden
yönlendirilir. Codex `request_user_input` istemleri kaynak sohbetine geri
gönderilir ve sıradaki bir sonraki takip mesajı, ekstra bağlam olarak
yönlendirilmek yerine bu yerel sunucu isteğini yanıtlar. Diğer MCP elicitation
istekleri kapalı şekilde başarısız olur.

Bu istemleri taşıyan genel Plugin onay akışı için bkz.
[Plugin izin istekleri](/tr/plugins/plugin-permission-requests).

## Kuyruk yönlendirme

Etkin çalışma kuyruğu yönlendirmesi Codex app-server `turn/steer` üzerine
eşlenir. Varsayılan `messages.queue.mode: "steer"` ile OpenClaw, yapılandırılmış
sessiz pencere için yönlendirme modundaki sohbet mesajlarını toplu hale getirir
ve bunları geliş sırasına göre tek bir `turn/steer` isteği olarak gönderir.

Codex incelemesi ve manuel Compaction turları, aynı tur yönlendirmesini reddedebilir. Bu
durumda OpenClaw, istemi başlatmadan önce etkin çalışmanın bitmesini bekler.
İletilerin yönlendirme yerine varsayılan olarak kuyruğa alınması gerektiğinde
`/queue followup` veya `/queue collect` kullanın. Bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

## Codex geri bildirim yüklemesi

Yerel Codex koşumunu kullanan bir oturum için `/diagnostics [note]` onaylandığında,
OpenClaw ilgili Codex iş parçacıkları için Codex uygulama sunucusunun
`feedback/upload` çağrısını da yapar. Yükleme, uygulama sunucusundan listelenen
her iş parçacığı ve varsa oluşturulan Codex alt iş parçacıkları için günlükleri
eklemesini ister.

Yükleme, Codex'in OpenAI sunucularına giden normal geri bildirim yolundan geçer. Bu
uygulama sunucusunda Codex geri bildirimi devre dışıysa, komut uygulama sunucusu
hatasını döndürür. Tamamlanan tanılama yanıtı; gönderilen iş parçacıkları için
kanalları, OpenClaw oturum kimliklerini, Codex iş parçacığı kimliklerini ve yerel
`codex resume <thread-id>` komutlarını listeler.

Onayı reddeder veya yok sayarsanız, OpenClaw bu Codex kimliklerini yazdırmaz ve
Codex geri bildirimi göndermez. Yükleme, yerel Gateway tanılama dışa aktarımının
yerini almaz. Onay, gizlilik, yerel paket ve grup sohbeti davranışı için
bkz. [Tanılama dışa aktarımı](/tr/gateway/diagnostics).

Tam Gateway tanılama paketi olmadan, yalnızca şu anda bağlı iş parçacığı için
Codex geri bildirim yüklemesini özellikle istediğinizde `/codex diagnostics [note]`
kullanın.

## Compaction ve döküm aynası

Seçilen model Codex koşumunu kullandığında, yerel iş parçacığı Compaction'ı
Codex uygulama sunucusuna aittir. OpenClaw, Codex turları için ön kontrol
Compaction'ı çalıştırmaz, Codex Compaction'ını bağlam motoru Compaction'ı ile
değiştirmez ve yerel Codex Compaction'ı başlatılamadığında OpenClaw'a veya genel
OpenAI özetlemesine geri dönmez. OpenClaw; kanal geçmişi, arama, `/new`,
`/reset` ve gelecekteki model veya koşum değişiklikleri için bir döküm aynası
tutar.

`/compact` gibi açık Compaction istekleri veya Plugin tarafından istenen manuel
compact işlemi, `thread/compact/start` ile yerel Codex Compaction'ını başlatır.
OpenClaw, bu yerel işlemi başlattıktan sonra döner. Tamamlanmasını beklemez,
ayrı bir OpenClaw zaman aşımı uygulamaz, paylaşılan Codex uygulama sunucusunu
yeniden başlatmaz veya işlemi OpenClaw tarafından tamamlanmış bir Compaction
olarak kaydetmez.

Bir bağlam motoru Codex iş parçacığı önyükleme projeksiyonu istediğinde, OpenClaw
araç çağrısı adlarını ve kimliklerini, girdi şekillerini ve düzeltilmiş araç
sonucu içeriğini yeni Codex iş parçacığına projekte eder. Ham araç çağrısı
bağımsız değişken değerlerini bu projeksiyona kopyalamaz.

Ayna, kullanıcı istemini, son asistan metnini ve uygulama sunucusu bunları
yayınladığında hafif Codex akıl yürütme veya plan kayıtlarını içerir. OpenClaw
bugün yalnızca Compaction istediğinde açık yerel Compaction başlatma sinyallerini
kaydeder. İnsan tarafından okunabilir bir Compaction özeti veya Codex'in
Compaction sonrası hangi girdileri tuttuğuna dair denetlenebilir bir liste
sunmaz.

Kanonik yerel iş parçacığının sahibi Codex olduğundan, `tool_result_persist`
şu anda Codex'e yerel araç sonucu kayıtlarını yeniden yazmaz. Yalnızca OpenClaw,
OpenClaw'a ait bir oturum dökümü araç sonucu yazarken uygulanır.

## Medya ve teslim

OpenClaw medya tesliminin ve medya sağlayıcı seçiminin sahibi olmaya devam eder.
Görüntü, video, müzik, PDF, TTS ve medya anlama; `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` ve `messages.tts` gibi eşleşen sağlayıcı/model
ayarlarını kullanır.

Metin, görüntüler, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktısı normal
OpenClaw teslim yolundan geçmeye devam eder. Medya üretimi eski çalışma zamanını gerektirmez.
Codex, `savedPath` içeren yerel bir görüntü üretimi öğesi yayınladığında, Codex
turunda asistan metni olmasa bile OpenClaw bu tam dosyayı normal yanıt-medya yolu
üzerinden iletir.

## İlgili

- [Codex koşumu](/tr/plugins/codex-harness)
- [Codex koşumu başvurusu](/tr/plugins/codex-harness-reference)
- [Yerel Codex pluginleri](/tr/plugins/codex-native-plugins)
- [Plugin kancaları](/tr/plugins/hooks)
- [Ajan koşumu pluginleri](/tr/plugins/sdk-agent-harness)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
- [Yörünge dışa aktarımı](/tr/tools/trajectory)
