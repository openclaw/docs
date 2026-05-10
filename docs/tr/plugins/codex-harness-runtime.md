---
read_when:
    - Codex harness çalışma zamanı destek sözleşmesine ihtiyacınız var
    - Codex'in yerel araçlarında, kancalarda, Compaction'da veya geri bildirim yüklemesinde hata ayıklıyorsunuz
    - PI ve Codex koşumu turları genelinde Plugin davranışını değiştiriyorsunuz
summary: Codex çalıştırma altyapısı için çalışma zamanı sınırları, kancalar, araçlar, izinler ve tanılama
title: Codex koşum çalışma zamanı
x-i18n:
    generated_at: "2026-05-10T19:44:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0170c8986b939d8d21684103261c2a7875baf399577eeae572da98c92acbc1e9
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Bu sayfa, Codex harness dönüşleri için çalışma zamanı sözleşmesini belgeler. Kurulum ve
yönlendirme için [Codex harness](/tr/plugins/codex-harness) ile başlayın. Yapılandırma alanları için
[Codex harness referansı](/tr/plugins/codex-harness-reference) bölümüne bakın.

## Genel Bakış

Codex modu, altında farklı bir model çağrısı bulunan PI değildir. Codex, yerel
model döngüsünün daha fazlasına sahip olur ve OpenClaw Plugin, araç, oturum ve
tanılama yüzeylerini bu sınır etrafında uyarlar.

OpenClaw kanal yönlendirmesine, oturum dosyalarına, görünür ileti teslimine,
OpenClaw dinamik araçlarına, onaylara, medya teslimine ve bir döküm aynasına
sahip olmaya devam eder. Codex kanonik yerel iş parçacığına, yerel model
döngüsüne, yerel araç devamına ve yerel Compaction'a sahip olur.

## İş parçacığı bağlamaları ve model değişiklikleri

Bir OpenClaw oturumu mevcut bir Codex iş parçacığına eklendiğinde, sonraki dönüş
o anda seçili OpenAI modelini, onay politikasını, sandbox'ı ve hizmet katmanını
yeniden app-server'a gönderir. `openai/gpt-5.5` modelinden
`openai/gpt-5.2` modeline geçmek iş parçacığı bağlamasını korur ancak Codex'ten
yeni seçilen modelle devam etmesini ister.

## Görünür yanıtlar ve heartbeat'ler

Bir kaynak sohbet dönüşü Codex harness üzerinden çalıştığında, dağıtım açıkça
`messages.visibleReplies` yapılandırmamışsa görünür yanıtlar varsayılan olarak
OpenClaw `message` aracını kullanır. Ajan Codex dönüşünü yine de özel olarak
bitirebilir; kanala yalnızca `message(action="send")` çağırdığında gönderi yapar.
Doğrudan sohbet son yanıtlarını eski otomatik teslim yolunda tutmak için
`messages.visibleReplies: "automatic"` ayarını yapın.

Codex Heartbeat dönüşleri ayrıca varsayılan olarak aranabilir OpenClaw araç
kataloğunda `heartbeat_respond` alır; böylece ajan uyanmanın sessiz kalıp
kalmayacağını veya bildirim gönderip göndermeyeceğini, bu denetim akışını son
metne kodlamadan kaydedebilir.

Heartbeat'e özgü girişim rehberliği, heartbeat dönüşünün kendisinde bir Codex
iş birliği modu geliştirici talimatı olarak gönderilir. Sıradan sohbet dönüşleri,
normal çalışma zamanı istemlerinde heartbeat felsefesini taşımak yerine Codex
Varsayılan modunu geri yükler.

## Hook sınırları

Codex harness'in üç hook katmanı vardır:

| Katman                                | Sahip                    | Amaç                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin hook'ları             | OpenClaw                 | PI ve Codex harness'leri arasında ürün/Plugin uyumluluğu.           |
| Codex app-server uzantı middleware'i  | OpenClaw paketli Plugin'leri | OpenClaw dinamik araçları etrafında dönüş başına bağdaştırıcı davranışı. |
| Codex yerel hook'ları                 | Codex                    | Codex yapılandırmasından düşük düzeyli Codex yaşam döngüsü ve yerel araç politikası. |

OpenClaw, OpenClaw Plugin davranışını yönlendirmek için proje veya genel Codex
`hooks.json` dosyalarını kullanmaz. Desteklenen yerel araç ve izin köprüsü için
OpenClaw, `PreToolUse`, `PostToolUse`, `PermissionRequest` ve `Stop` için iş
parçacığı başına Codex yapılandırması enjekte eder.

Codex app-server onayları etkinleştirildiğinde, yani `approvalPolicy`
`"never"` olmadığında, varsayılan enjekte edilen yerel hook yapılandırması
`PermissionRequest` öğesini dışarıda bırakır; böylece Codex'in app-server
inceleyicisi ve OpenClaw'ın onay köprüsü incelemeden sonra gerçek yükseltmeleri
işler. Operatörler uyumluluk aktarımına ihtiyaç duyduklarında
`nativeHookRelay.events` içine açıkça `permission_request` ekleyebilir.

`SessionStart` ve `UserPromptSubmit` gibi diğer Codex hook'ları Codex düzeyi
denetimler olarak kalır. Bunlar v1 sözleşmesinde OpenClaw Plugin hook'ları
olarak sunulmaz.

OpenClaw dinamik araçları için OpenClaw, Codex çağrıyı istedikten sonra aracı
çalıştırır; bu nedenle OpenClaw, harness bağdaştırıcısında sahip olduğu Plugin
ve middleware davranışını tetikler. Codex yerel araçları için Codex kanonik araç
kaydına sahip olur. OpenClaw seçili olayları aynalayabilir, ancak Codex bu
işlemi app-server veya yerel hook geri çağrıları üzerinden sunmadıkça yerel
Codex iş parçacığını yeniden yazamaz.

Compaction ve LLM yaşam döngüsü projeksiyonları, yerel Codex hook komutlarından
değil, Codex app-server bildirimlerinden ve OpenClaw bağdaştırıcı durumundan
gelir. OpenClaw'ın `before_compaction`, `after_compaction`, `llm_input` ve
`llm_output` olayları bağdaştırıcı düzeyi gözlemlerdir; Codex'in dahili istek
veya Compaction yüklerinin bayt bayt yakalamaları değildir.

Codex yerel `hook/started` ve `hook/completed` app-server bildirimleri,
yörünge ve hata ayıklama için `codex_app_server.hook` ajan olayları olarak
yansıtılır. Bunlar OpenClaw Plugin hook'larını çağırmaz.

## V1 destek sözleşmesi

Codex çalışma zamanı v1'de desteklenenler:

| Yüzey                                        | Destek                                                                           | Neden                                                                                                                                                                                                      |
| -------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex üzerinden OpenAI model döngüsü         | Desteklenir                                                                      | Codex app-server OpenAI dönüşüne, yerel iş parçacığı sürdürmeye ve yerel araç devamına sahip olur.                                                                                                         |
| OpenClaw kanal yönlendirme ve teslim         | Desteklenir                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model çalışma zamanının dışında kalır.                                                                                                      |
| OpenClaw dinamik araçları                    | Desteklenir                                                                      | Codex, OpenClaw'dan bu araçları çalıştırmasını ister; bu nedenle OpenClaw yürütme yolunda kalır.                                                                                                           |
| İstem ve bağlam Plugin'leri                  | Desteklenir                                                                      | OpenClaw, iş parçacığını başlatmadan veya sürdürmeden önce istem katmanları oluşturur ve bağlamı Codex dönüşüne yansıtır.                                                                                  |
| Bağlam motoru yaşam döngüsü                  | Desteklenir                                                                      | Codex dönüşleri için birleştirme, alma, dönüş sonrası bakım ve bağlam motoru Compaction koordinasyonu çalışır.                                                                                             |
| Dinamik araç hook'ları                       | Desteklenir                                                                      | `before_tool_call`, `after_tool_call` ve araç sonucu middleware'i OpenClaw'a ait dinamik araçlar etrafında çalışır.                                                                                        |
| Yaşam döngüsü hook'ları                      | Bağdaştırıcı gözlemleri olarak desteklenir                                       | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction` dürüst Codex modu yükleriyle tetiklenir.                                                                                 |
| Son yanıt revizyon kapısı                    | Yerel hook aktarımı üzerinden desteklenir                                        | Codex `Stop`, `before_agent_finalize` öğesine aktarılır; `revise`, Codex'ten sonlandırmadan önce bir model geçişi daha ister.                                                                              |
| Yerel shell, patch ve MCP engelleme veya gözlemleme | Yerel hook aktarımı üzerinden desteklenir                                  | Codex `PreToolUse` ve `PostToolUse`, Codex app-server `0.125.0` veya daha yenisindeki MCP yükleri dahil olmak üzere taahhüt edilmiş yerel araç yüzeyleri için aktarılır. Engelleme desteklenir; argüman yeniden yazma desteklenmez. |
| Yerel izin politikası                        | Codex app-server onayları ve uyumluluk yerel hook aktarımı üzerinden desteklenir | Codex app-server onay istekleri, Codex incelemesinden sonra OpenClaw üzerinden yönlendirilir. `PermissionRequest` yerel hook aktarımı, Codex bunu koruyucu incelemeden önce yaydığı için yerel onay modlarında isteğe bağlıdır. |
| App-server yörünge yakalama                  | Desteklenir                                                                      | OpenClaw app-server'a gönderdiği isteği ve aldığı app-server bildirimlerini kaydeder.                                                                                                                      |

Codex çalışma zamanı v1'de desteklenmeyenler:

| Yüzey                                               | V1 sınırı                                                                                                                                       | Gelecek yol                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Yerel araç argümanı değiştirme                      | Codex yerel araç ön hook'ları engelleyebilir, ancak OpenClaw Codex yerel araç argümanlarını yeniden yazmaz.                                    | Yedek araç girdisi için Codex hook/şema desteği gerektirir.                               |
| Düzenlenebilir Codex yerel döküm geçmişi            | Codex kanonik yerel iş parçacığı geçmişine sahip olur. OpenClaw bir aynaya sahip olur ve gelecekteki bağlamı yansıtabilir, ancak desteklenmeyen dahili öğeleri değiştirmemelidir. | Yerel iş parçacığı cerrahisi gerekiyorsa açık Codex app-server API'leri ekleyin.          |
| Codex yerel araç kayıtları için `tool_result_persist` | Bu hook, Codex yerel araç kayıtlarını değil, OpenClaw'a ait döküm yazımlarını dönüştürür.                                                     | Dönüştürülmüş kayıtlar aynalanabilir, ancak kanonik yeniden yazma Codex desteği gerektirir. |
| Zengin yerel Compaction meta verileri               | OpenClaw Compaction başlangıcını ve tamamlanmasını gözlemler, ancak kararlı bir tutulan/çıkarılan listesi, token deltası veya özet yükü almaz. | Daha zengin Codex Compaction olayları gerekir.                                            |
| Compaction müdahalesi                               | Mevcut OpenClaw Compaction hook'ları Codex modunda bildirim düzeyindedir.                                                                      | Plugin'lerin yerel Compaction'ı veto etmesi veya yeniden yazması gerekiyorsa Codex ön/son Compaction hook'ları ekleyin. |
| Bayt bayt model API isteği yakalama                 | OpenClaw app-server isteklerini ve bildirimlerini yakalayabilir, ancak Codex çekirdeği son OpenAI API isteğini dahili olarak oluşturur.        | Bir Codex model isteği izleme olayı veya hata ayıklama API'si gerekir.                   |

## Yerel izinler ve MCP elicitations

`PermissionRequest` için OpenClaw yalnızca politika karar verdiğinde açık izin
veya ret kararları döndürür. Kararsız sonuç izin değildir. Codex bunu hook
kararı yok olarak değerlendirir ve kendi koruyucu veya kullanıcı onayı yoluna
düşer.

Codex app-server onay modları bu yerel hook'u varsayılan olarak dışarıda
bırakır. Bu davranış, `permission_request` açıkça `nativeHookRelay.events`
içine dahil edildiğinde veya bir uyumluluk çalışma zamanı bunu kurduğunda
geçerlidir.

Bir operatör Codex yerel izin isteği için `allow-always` seçtiğinde,
OpenClaw bu tam sağlayıcı/oturum/araç girdisi/cwd parmak izini sınırlı bir
oturum penceresi için hatırlar. Hatırlanan karar kasıtlı olarak yalnızca tam
eşleşmeye yöneliktir: değişen bir komut, argümanlar, araç yükü veya cwd yeni
bir onay oluşturur.

Codex MCP araç onayı istemleri, Codex `_meta.codex_approval_kind` değerini
`"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışı üzerinden
yönlendirilir. Codex `request_user_input` istemleri kaynak sohbete geri
gönderilir ve sıradaki bir sonraki takip mesajı, ek bağlam olarak
yönlendirilmek yerine bu yerel sunucu isteğini yanıtlar. Diğer MCP istem
istekleri güvenli biçimde kapalı başarısız olur.

## Kuyruk yönlendirme

Etkin çalışma kuyruğu yönlendirmesi, Codex uygulama sunucusu `turn/steer`
üzerine eşlenir. Varsayılan `messages.queue.mode: "steer"` ile OpenClaw,
yapılandırılmış sessiz pencere boyunca sıraya alınan sohbet mesajlarını
topluca işler ve bunları geliş sırasına göre tek bir `turn/steer` isteği olarak
gönderir. Eski `queue` modu ayrı `turn/steer` istekleri gönderir.

Codex inceleme ve manuel Compaction dönüşleri aynı dönüşte yönlendirmeyi
reddedebilir. Bu durumda OpenClaw, seçilen mod geri dönüşe izin verdiğinde
takip kuyruğunu kullanır. Bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

## Codex geri bildirim yükleme

Yerel Codex harness kullanan bir oturum için `/diagnostics [note]`
onaylandığında OpenClaw, ilgili Codex iş parçacıkları için Codex uygulama
sunucusu `feedback/upload` çağrısını da yapar. Yükleme, uygulama sunucusundan
listelenen her iş parçacığı ve varsa oluşturulmuş Codex alt iş parçacıkları
için günlükleri dahil etmesini ister.

Yükleme, Codex'in OpenAI sunucularına giden normal geri bildirim yolu üzerinden
gerçekleşir. Bu uygulama sunucusunda Codex geri bildirimi devre dışıysa komut
uygulama sunucusu hatasını döndürür. Tamamlanan tanılama yanıtı, gönderilen iş
parçacıkları için kanalları, OpenClaw oturum kimliklerini, Codex iş parçacığı
kimliklerini ve yerel `codex resume <thread-id>` komutlarını listeler.

Onayı reddeder veya yok sayarsanız OpenClaw bu Codex kimliklerini yazdırmaz ve
Codex geri bildirimi göndermez. Yükleme, yerel Gateway tanılama dışa aktarımının
yerini almaz. Onay, gizlilik, yerel paket ve grup sohbeti davranışı için bkz.
[Tanılama dışa aktarımı](/tr/gateway/diagnostics).

`/codex diagnostics [note]` komutunu yalnızca tam Gateway tanılama paketi
olmadan, şu anda ekli iş parçacığı için özellikle Codex geri bildirim
yüklemesini istediğinizde kullanın.

## Compaction ve transkript yansıtması

Seçilen model Codex harness kullandığında, yerel iş parçacığı Compaction işlemi
Codex uygulama sunucusuna devredilir. OpenClaw; kanal geçmişi, arama, `/new`,
`/reset` ve gelecekteki model ya da harness geçişleri için bir transkript
yansıtması tutar.

Yansıtma, kullanıcı istemini, son asistan metnini ve uygulama sunucusu bunları
yayınladığında hafif Codex akıl yürütme ya da plan kayıtlarını içerir. Bugün
OpenClaw yalnızca yerel Compaction başlangıç ve tamamlanma sinyallerini kaydeder.
Henüz insan tarafından okunabilir bir Compaction özeti veya Codex'in Compaction
sonrasında hangi girdileri tuttuğuna dair denetlenebilir bir liste sunmaz.

Kanonik yerel iş parçacığı Codex'e ait olduğundan, `tool_result_persist` şu anda
Codex yerel araç sonucu kayıtlarını yeniden yazmaz. Yalnızca OpenClaw, OpenClaw'a
ait bir oturum transkripti araç sonucu yazdığında uygulanır.

## Medya ve teslimat

OpenClaw medya teslimatına ve medya sağlayıcı seçimine sahip olmaya devam eder.
Görüntü, video, müzik, PDF, TTS ve medya anlama; `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` ve `messages.tts` gibi eşleşen
sağlayıcı/model ayarlarını kullanır.

Metin, görüntüler, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktısı normal
OpenClaw teslimat yolu üzerinden devam eder. Medya üretimi PI gerektirmez.
Codex, `savedPath` içeren yerel bir görüntü üretme öğesi yayınladığında, Codex
dönüşünde asistan metni olmasa bile OpenClaw bu tam dosyayı normal yanıt-medya
yolu üzerinden iletir.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Codex harness referansı](/tr/plugins/codex-harness-reference)
- [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins)
- [Plugin hook'ları](/tr/plugins/hooks)
- [Aracı harness Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
- [Yörünge dışa aktarımı](/tr/tools/trajectory)
