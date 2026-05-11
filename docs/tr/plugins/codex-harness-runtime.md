---
read_when:
    - Codex harness çalışma zamanı destek sözleşmesine ihtiyacınız var
    - Yerel Codex araçları, kancalar, Compaction veya geri bildirim yükleme sorunlarını ayıklıyorsunuz
    - Plugin davranışını PI ve Codex harness turları genelinde değiştiriyorsunuz
summary: Codex çalıştırma düzeneği için çalışma zamanı sınırları, kancalar, araçlar, izinler ve tanılamalar
title: Codex çalıştırma düzeneği çalışma zamanı
x-i18n:
    generated_at: "2026-05-11T20:33:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8373441e725360527f89f66883f2bd1a164de558e82d1dee05c29af6756db25e
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Bu sayfa, Codex harness dönüşleri için çalışma zamanı sözleşmesini belgeler. Kurulum ve
yönlendirme için [Codex harness](/tr/plugins/codex-harness) ile başlayın. Yapılandırma alanları için
bkz. [Codex harness başvurusu](/tr/plugins/codex-harness-reference).

## Genel Bakış

Codex modu, altında farklı bir model çağrısı olan PI değildir. Codex, yerel model
döngüsünün daha büyük bir kısmını üstlenir ve OpenClaw kendi plugin, araç, oturum ve
tanılama yüzeylerini bu sınır etrafında uyarlar.

OpenClaw yine kanal yönlendirmesine, oturum dosyalarına, görünür ileti teslimine,
OpenClaw dinamik araçlarına, onaylara, medya teslimine ve bir döküm aynasına sahiptir.
Codex kanonik yerel iş parçacığına, yerel model döngüsüne, yerel araç devamına ve
yerel Compaction işlemine sahiptir.

## İş parçacığı bağlamaları ve model değişiklikleri

Bir OpenClaw oturumu mevcut bir Codex iş parçacığına eklendiğinde, sonraki dönüş
o anda seçili OpenAI modelini, onay politikasını, sandbox'ı ve hizmet katmanını
app-server'a yeniden gönderir. `openai/gpt-5.5` modelinden
`openai/gpt-5.2` modeline geçmek, iş parçacığı bağlamasını korur ancak Codex'ten
yeni seçilen modelle devam etmesini ister.

## Görünür yanıtlar ve Heartbeat'ler

Bir kaynak sohbet dönüşü Codex harness üzerinden çalıştığında, dağıtım açıkça
`messages.visibleReplies` yapılandırmamışsa görünür yanıtlar varsayılan olarak
OpenClaw `message` aracını kullanır. Aracı, Codex dönüşünü yine de özel olarak
bitirebilir; yalnızca `message(action="send")` çağırdığında kanala gönderi yapar.
Doğrudan sohbet son yanıtlarını eski otomatik teslim yolunda tutmak için
`messages.visibleReplies: "automatic"` ayarlayın.

Codex Heartbeat dönüşleri ayrıca varsayılan olarak aranabilir OpenClaw araç kataloğunda
`heartbeat_respond` alır; böylece aracı, uyandırmanın sessiz kalıp kalmayacağını
veya bildirim gönderip göndermeyeceğini, bu denetim akışını son metne kodlamadan
kaydedebilir.

Heartbeat'e özgü inisiyatif kılavuzu, Heartbeat dönüşünün kendisinde Codex
iş birliği modu geliştirici talimatı olarak gönderilir. Olağan sohbet dönüşleri,
normal çalışma zamanı istemlerinde Heartbeat felsefesini taşımak yerine Codex
Default modunu geri yükler.

## Hook sınırları

Codex harness üç hook katmanına sahiptir:

| Katman                                | Sahip                    | Amaç                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| OpenClaw plugin hook'ları             | OpenClaw                 | PI ve Codex harness'ları genelinde ürün/plugin uyumluluğu.         |
| Codex app-server extension middleware | OpenClaw paketli plugin'leri | OpenClaw dinamik araçları etrafında dönüş başına bağdaştırıcı davranışı. |
| Codex yerel hook'ları                 | Codex                    | Codex yapılandırmasından düşük düzey Codex yaşam döngüsü ve yerel araç politikası. |

OpenClaw, OpenClaw plugin davranışını yönlendirmek için proje veya global Codex
`hooks.json` dosyalarını kullanmaz. Desteklenen yerel araç ve izin köprüsü için
OpenClaw, `PreToolUse`, `PostToolUse`, `PermissionRequest` ve `Stop` için
iş parçacığı başına Codex yapılandırması enjekte eder.

Codex app-server onayları etkinleştirildiğinde, yani `approvalPolicy` `"never"`
değilse, varsayılan enjekte edilen yerel hook yapılandırması `PermissionRequest`
öğesini atlar; böylece Codex'in app-server inceleyicisi ve OpenClaw'ın onay köprüsü
incelemeden sonra gerçek yükseltmeleri işler. Operatörler, uyumluluk aktarıcısına
ihtiyaç duyduklarında `nativeHookRelay.events` içine açıkça `permission_request`
ekleyebilir.

`SessionStart` ve `UserPromptSubmit` gibi diğer Codex hook'ları Codex düzeyinde
denetimler olarak kalır. Bunlar v1 sözleşmesinde OpenClaw plugin hook'ları olarak
sunulmaz.

OpenClaw dinamik araçları için OpenClaw, Codex çağrıyı istedikten sonra aracı
çalıştırır; bu nedenle OpenClaw, sahip olduğu plugin ve middleware davranışını
harness bağdaştırıcısında tetikler. Codex yerel araçları için kanonik araç kaydına
Codex sahiptir. OpenClaw seçili olayları aynalayabilir, ancak Codex bu işlemi
app-server veya yerel hook callback'leri üzerinden sunmadıkça yerel Codex iş
parçacığını yeniden yazamaz.

Codex app-server öğe bildirimleri ayrıca, yerel `PostToolUse` aktarıcısı tarafından
zaten kapsanmayan yerel araç tamamlanmaları için zaman uyumsuz `after_tool_call`
gözlemleri sağlar. Bu gözlemler yalnızca telemetri ve plugin uyumluluğu içindir;
yerel araç çağrısını engelleyemez, geciktiremez veya değiştiremez.

Compaction ve LLM yaşam döngüsü projeksiyonları, yerel Codex hook komutlarından
değil, Codex app-server bildirimlerinden ve OpenClaw bağdaştırıcı durumundan gelir.
OpenClaw'ın `before_compaction`, `after_compaction`, `llm_input` ve
`llm_output` olayları bağdaştırıcı düzeyi gözlemlerdir; Codex'in dahili istek veya
Compaction payload'larının bire bir byte yakalamaları değildir.

Codex yerel `hook/started` ve `hook/completed` app-server bildirimleri, gidişat ve
hata ayıklama için `codex_app_server.hook` aracı olayları olarak yansıtılır.
Bunlar OpenClaw plugin hook'larını çağırmaz.

## V1 destek sözleşmesi

Codex çalışma zamanı v1'de desteklenenler:

| Yüzey                                        | Destek                                                                           | Neden                                                                                                                                                                                                      |
| -------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex üzerinden OpenAI model döngüsü         | Desteklenir                                                                      | Codex app-server, OpenAI dönüşüne, yerel iş parçacığı sürdürmeye ve yerel araç devamına sahiptir.                                                                                                          |
| OpenClaw kanal yönlendirme ve teslimi        | Desteklenir                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model çalışma zamanının dışında kalır.                                                                                                      |
| OpenClaw dinamik araçları                    | Desteklenir                                                                      | Codex bu araçları çalıştırmasını OpenClaw'dan ister, bu nedenle OpenClaw yürütme yolunda kalır.                                                                                                            |
| İstem ve bağlam plugin'leri                  | Desteklenir                                                                      | OpenClaw, iş parçacığını başlatmadan veya sürdürmeden önce istem katmanları oluşturur ve bağlamı Codex dönüşüne yansıtır.                                                                                  |
| Bağlam motoru yaşam döngüsü                  | Desteklenir                                                                      | Birleştirme, içe alma, dönüş sonrası bakım ve bağlam motoru Compaction koordinasyonu Codex dönüşleri için çalışır.                                                                                         |
| Dinamik araç hook'ları                       | Desteklenir                                                                      | `before_tool_call`, `after_tool_call` ve araç sonucu middleware'i OpenClaw'a ait dinamik araçların etrafında çalışır.                                                                                      |
| Yaşam döngüsü hook'ları                      | Bağdaştırıcı gözlemleri olarak desteklenir                                       | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction` dürüst Codex modu payload'larıyla tetiklenir.                                                                            |
| Son yanıt revizyon kapısı                    | Yerel hook aktarıcısı üzerinden desteklenir                                      | Codex `Stop`, `before_agent_finalize` öğesine aktarılır; `revise`, sonlandırmadan önce Codex'ten bir model geçişi daha ister.                                                                              |
| Yerel shell, patch ve MCP engelleme veya gözlemleme | Yerel hook aktarıcısı üzerinden desteklenir                                      | Codex `PreToolUse` ve `PostToolUse`, Codex app-server `0.125.0` veya daha yenisindeki MCP payload'ları dahil, taahhüt edilmiş yerel araç yüzeyleri için aktarılır. Engelleme desteklenir; argüman yeniden yazma desteklenmez. |
| Yerel izin politikası                        | Codex app-server onayları ve uyumluluk yerel hook aktarıcısı üzerinden desteklenir | Codex app-server onay istekleri, Codex incelemesinden sonra OpenClaw üzerinden yönlendirilir. `PermissionRequest` yerel hook aktarıcısı, Codex bunu koruyucu incelemeden önce yaydığı için yerel onay modlarında isteğe bağlıdır. |
| App-server gidişat yakalama                  | Desteklenir                                                                      | OpenClaw, app-server'a gönderdiği isteği ve aldığı app-server bildirimlerini kaydeder.                                                                                                                     |

Codex çalışma zamanı v1'de desteklenmeyenler:

| Yüzey                                              | V1 sınırı                                                                                                                                       | Gelecek yol                                                                                |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Yerel araç argümanı değiştirme                     | Codex yerel araç öncesi hook'ları engelleyebilir, ancak OpenClaw Codex yerel araç argümanlarını yeniden yazmaz.                                | Yedek araç girdisi için Codex hook/şema desteği gerektirir.                                |
| Düzenlenebilir Codex yerel döküm geçmişi           | Codex kanonik yerel iş parçacığı geçmişine sahiptir. OpenClaw bir aynaya sahiptir ve gelecek bağlamı yansıtabilir, ancak desteklenmeyen dahili öğeleri değiştirmemelidir. | Yerel iş parçacığı cerrahisi gerekiyorsa açık Codex app-server API'leri ekleyin.           |
| Codex yerel araç kayıtları için `tool_result_persist` | Bu hook, Codex yerel araç kayıtlarını değil, OpenClaw'a ait döküm yazımlarını dönüştürür.                                                       | Dönüştürülmüş kayıtlar aynalanabilir, ancak kanonik yeniden yazma Codex desteği gerektirir. |
| Zengin yerel Compaction meta verileri              | OpenClaw, Compaction başlangıcını ve tamamlanmasını gözlemler, ancak kararlı bir tutulan/bırakılan listesi, token farkı veya özet payload'ı almaz. | Daha zengin Codex Compaction olayları gerekir.                                             |
| Compaction müdahalesi                              | Mevcut OpenClaw Compaction hook'ları Codex modunda bildirim düzeyindedir.                                                                       | Plugin'lerin yerel Compaction işlemini veto etmesi veya yeniden yazması gerekiyorsa Codex ön/son Compaction hook'ları ekleyin. |
| Bire bir byte model API isteği yakalama            | OpenClaw app-server isteklerini ve bildirimlerini yakalayabilir, ancak Codex çekirdeği nihai OpenAI API isteğini dahili olarak oluşturur.       | Bir Codex model isteği izleme olayı veya hata ayıklama API'si gerekir.                    |

## Yerel izinler ve MCP talepleri

`PermissionRequest` için OpenClaw yalnızca politika karar verdiğinde açık izin verme
veya reddetme kararları döndürür. Kararsız sonuç izin verme değildir. Codex bunu
hook kararı yok olarak ele alır ve kendi koruyucu veya kullanıcı onay yoluna düşer.

Codex app-server onay modları, varsayılan olarak bu native hook'u atlar. Bu davranış,
`permission_request` açıkça `nativeHookRelay.events` içine eklendiğinde veya bir
uyumluluk runtime'ı bunu yüklediğinde geçerlidir.

Bir operatör, bir Codex native izin isteği için `allow-always` seçtiğinde,
OpenClaw bu tam provider/session/tool input/cwd parmak izini sınırlı bir oturum
penceresi boyunca hatırlar. Hatırlanan karar bilinçli olarak yalnızca tam
eşleşmedir: değişen bir komut, argümanlar, tool payload veya cwd yeni bir onay
oluşturur.

Codex MCP tool onay elicitations, Codex `_meta.codex_approval_kind` değerini
`"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışı üzerinden
yönlendirilir. Codex `request_user_input` istemleri kaynak sohbete geri
gönderilir ve sıradaki bir sonraki takip mesajı, ek bağlam olarak yönlendirilmek
yerine bu native server isteğini yanıtlar. Diğer MCP elicitation istekleri kapalı
başarısız olur.

## Kuyruk yönlendirme

Etkin çalıştırma kuyruk yönlendirmesi, Codex app-server `turn/steer` üzerine
eşlenir. Varsayılan `messages.queue.mode: "steer"` ile OpenClaw, kuyruğa alınan
sohbet mesajlarını yapılandırılmış sessizlik penceresi için toplar ve bunları
geliş sırasıyla tek bir `turn/steer` isteği olarak gönderir. Eski `queue` modu
ayrı `turn/steer` istekleri gönderir.

Codex inceleme ve manuel Compaction dönüşleri aynı dönüş yönlendirmesini
reddedebilir. Bu durumda OpenClaw, seçili mod fallback'e izin verdiğinde takip
kuyruğunu kullanır. Bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

## Codex geri bildirim yüklemesi

Native Codex harness kullanan bir oturum için `/diagnostics [note]`
onaylandığında, OpenClaw ilgili Codex thread'leri için Codex app-server
`feedback/upload` da çağırır. Yükleme, app-server'dan mümkün olduğunda her
listelenen thread ve oluşturulan Codex alt thread'leri için logları dahil etmesini
ister.

Yükleme, Codex'in normal geri bildirim yolu üzerinden OpenAI sunucularına gider.
Codex geri bildirimi bu app-server'da devre dışıysa, komut app-server hatasını
döndürür. Tamamlanan diagnostics yanıtı, gönderilen thread'ler için kanalları,
OpenClaw oturum kimliklerini, Codex thread kimliklerini ve yerel
`codex resume <thread-id>` komutlarını listeler.

Onayı reddeder veya yok sayarsanız, OpenClaw bu Codex kimliklerini yazdırmaz ve
Codex geri bildirimi göndermez. Yükleme, yerel Gateway diagnostics dışa
aktarımının yerini almaz. Onay, gizlilik, yerel paket ve grup sohbeti davranışı
için bkz. [Diagnostics dışa aktarımı](/tr/gateway/diagnostics).

`/codex diagnostics [note]` komutunu yalnızca tam Gateway diagnostics paketi
olmadan, şu anda ekli thread için özellikle Codex geri bildirim yüklemesini
istediğinizde kullanın.

## Compaction ve transcript aynası

Seçili model Codex harness kullandığında, native thread Compaction işlemi Codex
app-server'a devredilir. OpenClaw kanal geçmişi, arama, `/new`, `/reset` ve
gelecekteki model ya da harness geçişleri için bir transcript aynası tutar.

Ayna, app-server bunları yaydığında kullanıcı istemini, son assistant metnini ve
hafif Codex reasoning veya plan kayıtlarını içerir. Bugün OpenClaw yalnızca
native Compaction başlatma ve tamamlanma sinyallerini kaydeder. Henüz insan
tarafından okunabilir bir Compaction özeti veya Codex'in Compaction sonrasında
hangi girdileri tuttuğuna dair denetlenebilir bir liste sunmaz.

Canonical native thread Codex'e ait olduğundan, `tool_result_persist` şu anda
Codex-native tool sonuç kayıtlarını yeniden yazmaz. Yalnızca OpenClaw'ın
OpenClaw'a ait bir oturum transcript tool sonucu yazdığı durumlarda uygulanır.

## Medya ve teslimat

OpenClaw medya teslimatını ve medya provider seçimini sahiplenmeye devam eder.
Görüntü, video, müzik, PDF, TTS ve medya anlama; `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` ve `messages.tts` gibi eşleşen provider/model
ayarlarını kullanır.

Metin, görüntüler, video, müzik, TTS, onaylar ve messaging-tool çıktısı normal
OpenClaw teslimat yolu üzerinden devam eder. Medya üretimi PI gerektirmez. Codex,
`savedPath` içeren bir native görüntü üretimi öğesi yaydığında, Codex dönüşünde
assistant metni olmasa bile OpenClaw bu tam dosyayı normal yanıt-medya yolu
üzerinden iletir.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Codex harness referansı](/tr/plugins/codex-harness-reference)
- [Native Codex Pluginleri](/tr/plugins/codex-native-plugins)
- [Plugin hook'ları](/tr/plugins/hooks)
- [Ajan harness Pluginleri](/tr/plugins/sdk-agent-harness)
- [Diagnostics dışa aktarımı](/tr/gateway/diagnostics)
- [Trajectory dışa aktarımı](/tr/tools/trajectory)
