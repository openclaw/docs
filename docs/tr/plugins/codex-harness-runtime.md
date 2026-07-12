---
read_when:
    - Codex çalışma düzeneği çalışma zamanı destek sözleşmesine ihtiyacınız var
    - Yerel Codex araçlarında, hook'larda, Compaction'da veya geri bildirim yüklemesinde hata ayıklıyorsunuz
    - OpenClaw ve Codex çalıştırma düzeneği turları genelinde Plugin davranışını değiştiriyorsunuz
summary: Codex çalışma düzeneği için çalışma zamanı sınırları, kancalar, araçlar, izinler ve tanılama yöntemleri
title: Codex test düzeneği çalışma zamanı
x-i18n:
    generated_at: "2026-07-12T12:28:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Codex bağdaştırıcı turları için çalışma zamanı sözleşmesi. Kurulum ve yönlendirme için
[Codex bağdaştırıcısı](/tr/plugins/codex-harness) bölümüne bakın. Yapılandırma alanları için
[Codex bağdaştırıcısı referansı](/tr/plugins/codex-harness-reference) bölümüne bakın.

## Genel Bakış

Codex; yerel model döngüsünü, yerel iş parçacığını sürdürmeyi, yerel araç
devamlılığını ve yerel Compaction işlemini yönetir. OpenClaw ise kanal yönlendirmesini, oturum
dosyalarını, görünür ileti teslimini, OpenClaw dinamik araçlarını, onayları, medya
teslimini ve bu sınır çevresindeki transkript yansısını yönetir.

İstem yönlendirmesi yalnızca sağlayıcı dizesini değil, seçilen çalışma zamanını izler.
Yerel bir Codex turu, Codex app-server geliştirici talimatlarını alır; açıkça belirtilen
bir OpenClaw uyumluluk rotası ise Codex tarzı OpenAI kimlik doğrulaması veya aktarımı
kullansa bile normal OpenClaw sistem istemini korur.

OpenClaw, çalışma alanı kişilik dosyalarının ve OpenClaw aracısı kimliğinin
belirleyici kalması için yerel Codex iş parçacıklarını Codex'in yerleşik kişiliği
devre dışı bırakılmış (`personality: "none"`) olarak başlatır ve sürdürür. Bunun dışında
yerel Codex, Codex tarafından yönetilen temel/model talimatlarını ve proje belgesi
yüklemesini korur. Hafif OpenClaw çalıştırmaları (örneğin cron) proje belgesi
yüklemesini yine de engeller.

OpenClaw geliştirici talimatları; kaynak kanalına teslim, OpenClaw dinamik araçları,
ACP devri, bağdaştırıcı bağlamı ve etkin aracı çalışma alanı profil dosyaları gibi
OpenClaw çalışma zamanı konularını kapsar. Skill katalogları ve araç üzerinden
yönlendirilen `MEMORY.md` işaretçileri, tur kapsamlı iş birliği geliştirici talimatları
olarak yansıtılır. Bellek araçları kullanılamadığında etkin `BOOTSTRAP.md` içeriği
ve tam `MEMORY.md`, bunun yerine düz tur giriş bağlamına geri döner.

OpenClaw dinamik araçlarının çoğu aranabilir `openclaw` ad alanını kullanır.
`catalogMode: "direct-only"` olarak işaretlenen araçlar `openclaw_direct` kullanır;
Codex bunu iç içe Code Mode yürütmesine açmak yerine `DirectModelOnly` olarak doğrudan
modele görünür tutar.

## İş parçacığı bağlamaları ve model değişiklikleri

Bir OpenClaw oturumu mevcut bir Codex iş parçacığına bağlandığında sonraki tur,
geçerli olarak seçilmiş modeli, onay politikasını, korumalı alanı, onay inceleyicisini
ve hizmet katmanını app-server'a yeniden gönderir. `openai/gpt-5.5` modelinden
`openai/gpt-5.2` modeline geçmek iş parçacığı bağlamasını korur ancak Codex'ten yeni
seçilen modelle devam etmesini ister.

Gözetimli bağlamalar istisnadır. OpenClaw model seçici kilitli kalır ve sürdürme
işlemleri model ile sağlayıcı geçersiz kılmalarını dışarıda bırakır; böylece Codex,
kanonik iş parçacığının kalıcı modelini ve sağlayıcısını geri yükler. Ayrı bir yerel
Codex denetimi bu kalıcı çifti değiştirebilir ve ilk anlık görüntü Codex'in normal
model farkı uyarısını oluşturabilir; dıştaki OpenClaw modeli ve geri dönüş zinciri
bunların hiçbirinin yerine geçmez.

## Gözetim ve güvenli devamlılık

Codex gözetimi, aynı `codex` Plugin'inin isteğe bağlı bir yeteneğidir. Yerel iş
parçacıklarını ayrı bir bağlantı üzerinden keşfeder ve Gateway kataloğuna yalnızca
arşivlenmemiş oturumları yansıtır. Açık `appServer` bağlantı ayarları olmadan bu
bağlantı yönetilen kullanıcı ana dizini stdio'sunu kullanırken sıradan bağdaştırıcı
aracı kapsamlı kalır. Listeleme ve meta veri okumaları pasiftir: bir iş parçacığını
sürdürmez, OpenClaw'u canlı olaylarına abone etmez veya onaylarını yanıtlamaz.

Gateway bilgisayarındaki saklanmış veya boşta bir oturum için **Dal olarak devam et**,
normal ve modeli kilitlenmiş bir Sohbet oluşturur; sınırlı kullanıcı ve asistan
geçmişini kaynağın kalıcı son tamamlanmış turuna kadar yansıtır. İlk normal Sohbet
turu gerçek onay işleyicilerini kurar ve anlık görüntüyü model ya da sağlayıcı geçersiz
kılması olmadan sabitlemek için geçici bir yerel çatallanma kullanır. Codex App Server,
geçerli yerel yapılandırmasını kullanır ve seçilen çifti döndürür; bu model kaynağın
son kaydedilen modelinden farklıysa normal uyarısını verir. OpenClaw, aynı gözetim
bağlantısında kanonik `appServer` kaynaklı Codex bağdaştırıcı iş parçacığını, başlangıç
için döndürülen model ve sağlayıcıyı tam olarak kullanarak kendi cwd'si ve çalışma
zamanı politikası altında başlatır, sınırlı görünür geçmişi ekler ve geçici çatallanmayı
arşivler. Kaynak hiçbir zaman sürdürülmez. Kanonik iş parçacığı tam OpenClaw
bağdaştırıcı araç yüzeyine sahiptir; kaynaktaki akıl yürütme, araç çağrıları ve araç
sonuçları buna kopyalanmaz. Özel bağlantı kapsamı bekleyen ve kesinleşmiş bağlama
durumlarında korunur; böylece sonraki her tur yerel kimlik doğrulaması ve sağlayıcı
yapılandırmasıyla bu bağlantıda kalır. Devre dışı gözetim veya bağlama/bağlantı
sapması, sıradan aracı ana dizini bağdaştırıcısına geçmek yerine güvenli biçimde
başarısız olur.

Özgün CLI veya VS Code kaynağı her iki katalog için de uygun kalır. Kanonik dal,
yerel bir Codex iş parçacığıdır ancak kaynak türü `appServer`'dır; yerel istemciler
bu kaynak türünü filtreleyebilir, dolayısıyla Codex Desktop'ta görünmesi garanti
edilmez.

Etkin kaynaklardan yeni bir dal başlatılamaz ve bunlar arşivlenemez; mevcut gözetimli
bir Sohbet yine de açılabilir. `notLoaded`, etkinliğin bilinmediği anlamına gelir,
boşta olduğu anlamına gelmez; OpenClaw yalnızca başka çalıştırıcı olmadığına ilişkin
açık onaydan ve işlem içi durumun yeniden okunmasından sonra yerel bir `idle` veya
`notLoaded` satırının arşivlenmesine izin verir. Codex, tek bir App Server işlemi
içindeki iş parçacığı değişikliklerini serileştirir ancak işlemler arası özel bir
çalıştırıcı veya onay sahibi kirası sağlamaz; bu nedenle söz konusu okuma, başka bir
işlemin iş parçacığını kullanmadığını kanıtlayamaz. OpenClaw, tam hedefin veya Codex'in
sayfalandırılmış alt öğe sorgusunun döndürdüğü arşivlenmemiş herhangi bir oluşturulmuş
alt öğenin bilinen etkin bağlama sahibini engeller. Listeleme hataları, döngüler ve
güvenlik sınırının tükenmesi güvenli biçimde başarısız olur. Yerel arşivleme başka
bir işlemdeki yeni turla yine de yarışabilir; bu nedenle onay, bilinmeyen istemcileri
ve durum okumasıyla arşivleme arasındaki boşluğu kapsar. Gözetimli, modeli kilitlenmiş
bir Sohbet, yerel bağlamayı koruduğu sürece silinemez.

Eşleştirilmiş Node katalogları ilk sürümde yalnızca meta veri olarak kalır. Geçerli
Node çağırma sınırı istek/yanıt biçimindedir ve gerçek bir Codex bağdaştırıcı bağlaması
için gereken uzun ömürlü tur olaylarını, onay isteklerini veya akışlı çıktıyı taşıyamaz.
Bu nedenle uzak **Devam et** ve **Arşivle**, satır boşta olsa bile kullanılamaz.

Operatör kurulumu ve görünür Control UI davranışı için
[Codex gözetimi](/tr/plugins/codex-supervision) bölümüne bakın.

## Görünür yanıtlar ve Heartbeat'ler

Codex bağdaştırıcısı üzerinden doğrudan/kaynak sohbet turları, Pi bağdaştırıcı
sözleşmesiyle uyumlu olarak dahili WebChat yüzeylerinde varsayılan biçimde son asistan
yanıtını otomatik teslim eder: aracı normal şekilde yanıt verir ve OpenClaw son metni
kaynak konuşmaya gönderir. Aracı `message(action="send")` çağrısı yapmadıkça son asistan
metnini gizli tutmak için `messages.visibleReplies: "message_tool"` olarak ayarlayın.

Codex Heartbeat turları, aracının uyanmanın sessiz kalması mı yoksa bildirim göndermesi
mi gerektiğini kaydedebilmesi için varsayılan olarak aranabilir OpenClaw araç
kataloğunda `heartbeat_respond` aracını alır. Heartbeat girişim yönergeleri, Heartbeat
turuyla sınırlı bir Codex iş birliği modu geliştirici talimatı olarak gönderilir;
sıradan sohbet turları Codex Default modunda kalır. `HEARTBEAT.md` boş olmadığında
Heartbeat talimatları, içeriğini satır içine eklemek yerine Codex'i dosyaya yönlendirir.

## Kanca sınırları

| Katman                                | Sahip                    | Amaç                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin kancaları             | OpenClaw                 | OpenClaw ve Codex bağdaştırıcıları genelinde ürün/Plugin uyumluluğu. |
| Codex app-server uzantı ara yazılımı  | OpenClaw paketli Plugin'leri | OpenClaw dinamik araçları çevresinde tur başına bağdaştırıcı davranışı. |
| Codex yerel kancaları                 | Codex                    | Codex yapılandırmasından düşük düzeyli Codex yaşam döngüsü ve yerel araç politikası. |

OpenClaw, Plugin davranışını yönlendirmek için proje veya genel Codex `hooks.json`
dosyalarını kullanmaz. Yerel araç ve izin köprüsü için OpenClaw; `PreToolUse`,
`PostToolUse`, `PermissionRequest` ve `Stop` amacıyla iş parçacığı başına Codex
yapılandırması ekler.

Codex app-server onayları etkinleştirildiğinde (`approvalPolicy`, `"never"` değildir)
varsayılan olarak eklenen yerel kanca yapılandırması `PermissionRequest` öğesini
dışarıda bırakır; böylece Codex'in app-server inceleyicisi ve OpenClaw'un onay köprüsü
incelemeden sonra gerçek yükseltmeleri işler. Uyumluluk aktarımını yine de zorlamak
için `nativeHookRelay.events` alanına `permission_request` ekleyin. `SessionStart` ve
`UserPromptSubmit` gibi diğer Codex kancaları Codex düzeyindeki denetimler olarak
kalır; v1 sözleşmesinde OpenClaw Plugin kancaları olarak sunulmaz.

OpenClaw dinamik araçlarında OpenClaw, Codex çağrıyı istedikten sonra aracı yürütür;
dolayısıyla Plugin ve ara yazılım davranışı bağdaştırıcı adaptöründe çalışır. Codex'e
özgü araçlarda kanonik araç kaydını Codex yönetir; OpenClaw seçili olayları
yansıtabilir ancak Codex bunu app-server veya yerel kanca geri çağırmaları aracılığıyla
sunmadıkça yerel iş parçacığını yeniden yazamaz.

Codex app-server rapor modundaki `PreToolUse` olayları, Plugin onayını eşleşen
app-server onayına erteler. Bir OpenClaw `before_tool_call` kancası `requireApproval`
döndürürken yerel yük `openclaw_approval_mode: "report"` değerini ayarlarsa yerel
kanca aktarımı Plugin onayı gereksinimini kaydeder ve yerel bir karar döndürmez.
Codex daha sonra aynı araç kullanımı için app-server onay isteğini gönderdiğinde
OpenClaw, Plugin onay istemini açar ve kararı yeniden Codex'e eşler. Codex
`PermissionRequest` olayları ayrı bir onay yoludur ve bu köprü için yapılandırıldığında
yine OpenClaw onayları üzerinden yönlendirilebilir.

Codex app-server öğe bildirimleri ayrıca yerel `PostToolUse` aktarımının hâlihazırda
kapsamadığı yerel araç tamamlamaları için eşzamansız `after_tool_call` gözlemleri
sağlar. Bunlar yalnızca telemetri/uyumluluk amaçlıdır; yerel araç çağrısını engelleyemez,
geciktiremez veya değiştiremez.

Compaction ve LLM yaşam döngüsü yansıtmaları, yerel Codex kanca komutlarından değil,
Codex app-server bildirimlerinden ve OpenClaw bağdaştırıcı durumundan gelir.
`before_compaction`, `after_compaction`, `llm_input` ve `llm_output`, Codex'in dahili
istek veya Compaction yüklerinin bayt düzeyinde birebir yakalamaları değil, bağdaştırıcı
düzeyindeki gözlemlerdir.

Codex yerel `hook/started` ve `hook/completed` app-server bildirimleri, yörünge ve
hata ayıklama amacıyla `codex_app_server.hook` aracı olayları olarak yansıtılır.
Bunlar OpenClaw Plugin kancalarını çağırmaz.

## V1 destek sözleşmesi

Codex çalışma zamanı v1'de desteklenenler:

| Yüzey                                         | Destek                                                                            | Neden                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex üzerinden OpenAI model döngüsü          | Desteklenir                                                                       | Codex app-server; OpenAI turunu, yerel iş parçacığı sürdürme işlemini ve yerel araç devamını yönetir.                                                                                                                                                                                                                                                                                                                                                                                                     |
| OpenClaw kanal yönlendirmesi ve teslimatı     | Desteklenir                                                                       | Telegram, Discord, Slack, WhatsApp, iMessage ve diğer kanallar model çalışma zamanının dışında kalır.                                                                                                                                                                                                                                                                                                                                                                                                     |
| OpenClaw dinamik araçları                     | Desteklenir                                                                       | Codex, OpenClaw'dan bu araçları yürütmesini ister; böylece OpenClaw yürütme yolunda kalır.                                                                                                                                                                                                                                                                                                                                                                                                                |
| İstem ve bağlam Plugin'leri                   | Desteklenir                                                                       | OpenClaw, OpenClaw'a özgü istemi/bağlamı Codex turuna yansıtırken Codex'in yönettiği temel, model ve yapılandırılmış proje belgesi istemlerini yerel Codex hattında bırakır. OpenClaw, yerel iş parçacıkları için Codex'in yerleşik kişiliğini devre dışı bırakır; böylece ajan çalışma alanı kişilik dosyaları yetkili kaynak olmaya devam eder. Yerel Codex geliştirici talimatları yalnızca açıkça `codex_app_server` kapsamına alınmış komut yönlendirmelerini kabul eder; eski küresel komut ipuçları Codex dışı istem yüzeyleri için korunur. |
| Bağlam motoru yaşam döngüsü                   | Desteklenir                                                                       | Birleştirme, içe alma ve tur sonrası bakım işlemleri Codex turlarının çevresinde çalışır. Bağlam motorları yerel Codex Compaction işleminin yerini almaz.                                                                                                                                                                                                                                                                                                                                                  |
| Dinamik araç kancaları                        | Desteklenir                                                                       | `before_tool_call`, `after_tool_call` ve araç sonucu ara yazılımı, OpenClaw'ın yönettiği dinamik araçların çevresinde çalışır.                                                                                                                                                                                                                                                                                                                                                                            |
| Yaşam döngüsü kancaları                       | Bağdaştırıcı gözlemleri olarak desteklenir                                        | `llm_input`, `llm_output`, `agent_end`, `before_compaction` ve `after_compaction`, gerçeği yansıtan Codex modu yükleriyle tetiklenir.                                                                                                                                                                                                                                                                                                                                                                      |
| Nihai yanıt revizyon geçidi                   | Yerel kanca aktarımı aracılığıyla desteklenir                                     | Codex `Stop`, `before_agent_finalize` öğesine aktarılır; `revise`, sonlandırmadan önce Codex'ten bir model geçişi daha ister.                                                                                                                                                                                                                                                                                                                                                                             |
| Yerel kabuk, yama ve MCP engelleme veya izleme | Yerel kanca aktarımı aracılığıyla desteklenir                                    | Codex `PreToolUse` ve `PostToolUse`, Codex app-server `0.142.0` veya daha yeni sürümlerdeki MCP yükleri dâhil olmak üzere kesinleştirilmiş yerel araç yüzeyleri için aktarılır. Engelleme desteklenir; bağımsız değişkenlerin yeniden yazılması desteklenmez.                                                                                                                                                                                                                                                     |
| Yerel izin politikası                         | Codex app-server onayları ve uyumluluk amaçlı yerel kanca aktarımıyla desteklenir | Codex app-server onay istekleri, Codex incelemesinden sonra OpenClaw üzerinden yönlendirilir. Codex bunu koruyucu incelemesinden önce yaydığı için `PermissionRequest` yerel kanca aktarımı, yerel onay modlarında isteğe bağlıdır.                                                                                                                                                                                                                                                                             |
| App-server yörünge yakalama                   | Desteklenir                                                                       | OpenClaw, app-server'a gönderdiği isteği ve app-server'dan aldığı bildirimleri kaydeder.                                                                                                                                                                                                                                                                                                                                                                                                                  |

Codex çalışma zamanı v1'de desteklenmeyenler:

| Yüzey                                               | V1 sınırı                                                                                                                                             | Gelecekteki yol                                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Yerel araç bağımsız değişkenlerini değiştirme       | Codex yerel araç öncesi kancaları engelleme yapabilir, ancak OpenClaw Codex'e özgü yerel araç bağımsız değişkenlerini yeniden yazmaz.                  | Yeni araç girdisi için Codex kanca/şema desteği gerekir.                                             |
| Düzenlenebilir Codex yerel transkript geçmişi       | Codex, kurallı yerel iş parçacığı geçmişini yönetir. OpenClaw bir yansıyı yönetir ve gelecekteki bağlamı yansıtabilir, ancak desteklenmeyen iç bileşenleri değiştirmemelidir. | Yerel iş parçacığına müdahale gerekiyorsa açık Codex app-server API'leri ekleyin.                     |
| Codex yerel araç kayıtları için `tool_result_persist` | Bu kanca, Codex yerel araç kayıtlarını değil, OpenClaw'ın yönettiği transkript yazımlarını dönüştürür.                                                 | Dönüştürülen kayıtlar yansıtılabilir, ancak kurallı yeniden yazma için Codex desteği gerekir.         |
| Zengin yerel Compaction meta verileri               | OpenClaw yerel Compaction isteyebilir, ancak kararlı bir tutulan/atılan listesi, token farkı, tamamlama özeti veya özet yükü almaz.                     | Daha zengin Codex Compaction olayları gerekir.                                                       |
| Compaction müdahalesi                                | OpenClaw, Plugin'lerin veya bağlam motorlarının yerel Codex Compaction işlemini veto etmesine, yeniden yazmasına ya da değiştirmesine izin vermez.     | Plugin'lerin yerel Compaction işlemini veto etmesi veya yeniden yazması gerekiyorsa Codex Compaction öncesi/sonrası kancaları ekleyin. |
| Bayt bayt model API isteği yakalama                  | OpenClaw, app-server isteklerini ve bildirimlerini yakalayabilir; ancak nihai OpenAI API isteğini Codex çekirdeği dâhilî olarak oluşturur.             | Bir Codex model isteği izleme olayı veya hata ayıklama API'si gerekir.                                |

## Yerel izinler ve MCP bilgi talepleri

`PermissionRequest` için OpenClaw, yalnızca politika karar verdiğinde açıkça izin ver veya reddet
kararları döndürür. Karar verilmemesi izin anlamına gelmez: Codex bunu
kanca kararı olmaması olarak değerlendirir ve kendi koruyucu ya da kullanıcı
onayı yoluna geçer.

Codex app-server onay modları, varsayılan olarak bu yerel kancayı dışarıda bırakır. Bu,
`permission_request` açıkça `nativeHookRelay.events` içine eklenmediği veya bir
uyumluluk çalışma zamanı bunu kurmadığı sürece geçerlidir.

Bir operatör, Codex yerel izin isteği için `allow-always` seçtiğinde
OpenClaw, ilgili sağlayıcı/oturum/araç girdisi/cwd parmak izinin tam eşleşmesini
sınırlı bir oturum aralığı boyunca hatırlar. Hatırlanan karar kasıtlı olarak yalnızca
tam eşleşmede geçerlidir: komut, bağımsız değişkenler, araç yükü veya cwd değişirse
yeni bir onay gerekir.

Codex MCP araç onayı bilgi talepleri, Codex `_meta.codex_approval_kind` değerini
`"mcp_tool_call"` olarak işaretlediğinde OpenClaw'ın Plugin onay akışı üzerinden yönlendirilir. Codex
`request_user_input` istemleri kaynak sohbete geri gönderilir ve
kuyruktaki sonraki takip mesajı, ek bağlam olarak yönlendirilmek yerine
bu yerel sunucu isteğini yanıtlar. Diğer MCP bilgi talebi istekleri güvenli biçimde reddedilir.

Bu istemleri taşıyan genel Plugin onay akışı için
[Plugin izin istekleri](/tr/plugins/plugin-permission-requests) bölümüne bakın.

## Kuyruk yönlendirmesi

Etkin çalıştırma kuyruğu yönlendirmesi, Codex app-server `turn/steer` ile eşlenir. Varsayılan
`messages.queue.mode: "steer"` ayarıyla OpenClaw, yönlendirme modundaki sohbet
mesajlarını yapılandırılmış sessiz süre boyunca toplu hâle getirir ve bunları geliş sırasına göre
tek bir `turn/steer` isteği olarak gönderir.

Codex incelemesi ve elle Compaction turları, aynı turdaki yönlendirmeyi reddedebilir. Bu
durumda OpenClaw, istemi başlatmadan önce etkin çalışmanın tamamlanmasını
bekler. Mesajların yönlendirilmek yerine varsayılan olarak kuyruğa alınması
gerektiğinde `/queue followup` veya `/queue collect` kullanın. Bkz. [Yönlendirme kuyruğu](/tr/concepts/queue-steering).

## Codex geri bildirim yükleme

Yerel Codex çalışma düzeneğindeki bir oturum için `/diagnostics [note]`
onaylandığında OpenClaw, ilgili Codex iş parçacıkları için Codex app-server
`feedback/upload` çağrısını da yapar; buna listelenen her iş parçacığının
günlükleri ve mevcut olduğunda oluşturulan Codex alt iş parçacıkları dahildir.

Yükleme, Codex'in OpenAI sunucularına yönelik normal geri bildirim yolu
üzerinden gerçekleştirilir. Söz konusu app-server'da Codex geri bildirimi
devre dışıysa komut, app-server hatasını döndürür. Tamamlanan tanılama yanıtı;
gönderilen iş parçacıklarının kanallarını, OpenClaw oturum kimliklerini, Codex
iş parçacığı kimliklerini ve yerel `codex resume <thread-id>` komutlarını listeler.

Onayı reddeder veya yok sayarsanız OpenClaw bu Codex kimliklerini yazdırmaz
ve Codex geri bildirimi göndermez. Yükleme, yerel Gateway tanılama dışa
aktarımının yerini almaz. Onay, gizlilik, yerel paket ve grup sohbeti davranışı
için bkz. [Tanılama dışa aktarımı](/tr/gateway/diagnostics).

Tam Gateway tanılama paketi olmadan yalnızca o anda bağlı olan iş parçacığı
için Codex geri bildirim yüklemesini istediğinizde `/codex diagnostics [note]`
kullanın.

## Compaction ve transkript yansısı

Seçilen model Codex çalışma düzeneğini kullandığında, yerel iş parçacığı
Compaction işlemi Codex app-server'a aittir. OpenClaw, Codex turları için ön
kontrol Compaction işlemi çalıştırmaz, Codex Compaction işlemini bağlam motoru
Compaction işlemiyle değiştirmez ve yerel Compaction başlatılamadığında
OpenClaw ya da herkese açık OpenAI özetlemesine geri dönmez. OpenClaw; kanal
geçmişi, arama, `/new`, `/reset` ve gelecekteki model ya da çalışma düzeneği
geçişleri için bir transkript yansısı tutar.

`/compact` veya bir Plugin tarafından istenen elle compact işlemi gibi açık
Compaction istekleri, `thread/compact/start` ile yerel Codex Compaction
işlemini başlatır. OpenClaw, Codex eşleşen `contextCompaction` tamamlanma
öğesini yayınlayana kadar isteği ve paylaşılan istemci kirasını açık tutar,
ardından Compaction turunu tamamlanmış olarak bildirir. Bu sonlandırıcı tur,
yapılandırılmış Compaction zaman aşımını aşarsa OpenClaw yerel bir tur kesintisi
ister. Kira ve iş parçacığı başına Compaction engeli, Codex sonlandırıcı durumu
bildirene veya kesinti RPC'sini doğrulayana kadar tutulmaya devam eder. Codex,
kesinti ek süresi içinde doğrulama yapmazsa OpenClaw engeli serbest bırakmadan
önce bağlantıyı kullanımdan kaldırır. Uzak bağlantılar ayrıca eşleşen iş
parçacığı bağını ayırır; böylece sonraki işler, doğrulanmamış bir uzak turla
çakışamaz. Kullanımdan kaldırılmış bir bağlantıdaki diğer turlar başarısız olur
ve yeni bir istemciyle yeniden denenebilir. İstemcinin kapanması, isteğin iptal
edilmesi veya başarısız bir Compaction turu, başarısız bir işlem döndürür.
Bağlam baskısına bağlı otomatik Compaction, Codex'in görevidir; OpenClaw yerel
Compaction işlemini yalnızca elle istenen tetikleyiciler için başlatır.

Bir bağlam motoru Codex iş parçacığı önyükleme izdüşümü istediğinde OpenClaw,
araç çağrısı adlarını ve kimliklerini, girdi biçimlerini ve gizlenmiş araç
sonucu içeriğini yeni Codex iş parçacığına yansıtır. Ham araç çağrısı bağımsız
değişken değerlerini bu izdüşüme kopyalamaz.

Yansı; kullanıcı istemini, son asistan metnini ve app-server bunları
yayınladığında hafif Codex akıl yürütme veya plan kayıtlarını içerir. OpenClaw,
yerel Compaction başlangıcını ve sonlandırıcı durumunu kaydeder ancak insanlar
tarafından okunabilir bir Compaction özeti ya da Codex'in Compaction sonrasında
hangi girdileri tuttuğuna ilişkin denetlenebilir bir liste sunmaz.

Codex, kurallı yerel iş parçacığının sahibi olduğundan `tool_result_persist`,
Codex'e özgü araç sonucu kayıtlarını yeniden yazmaz. Yalnızca OpenClaw,
OpenClaw'a ait bir oturum transkriptine araç sonucu yazdığında uygulanır.

## Medya ve teslimat

OpenClaw, medya teslimatının ve medya sağlayıcısı seçiminin sahibi olmaya devam
eder. Görsel, video, müzik, PDF, TTS ve medya anlama işlemleri;
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` ve
`messages.tts` gibi eşleşen sağlayıcı/model ayarlarını kullanır.

Metin, görseller, video, müzik, TTS, onaylar ve mesajlaşma aracı çıktıları
normal OpenClaw teslimat yolu üzerinden ilerlemeye devam eder; medya üretimi,
eski çalışma zamanını gerektirmez. Codex, `savedPath` içeren yerel bir görsel
üretim öğesi yayınladığında, Codex turunda asistan metni bulunmasa bile
OpenClaw tam olarak bu dosyayı normal yanıt medyası yolu üzerinden iletir.

## İlgili konular

- [Codex çalışma düzeneği](/tr/plugins/codex-harness)
- [Codex çalışma düzeneği başvurusu](/tr/plugins/codex-harness-reference)
- [Codex gözetimi](/tr/plugins/codex-supervision)
- [Yerel Codex Plugin'leri](/tr/plugins/codex-native-plugins)
- [Plugin kancaları](/tr/plugins/hooks)
- [Ajan çalışma düzeneği Plugin'leri](/tr/plugins/sdk-agent-harness)
- [Tanılama dışa aktarımı](/tr/gateway/diagnostics)
- [Yörünge dışa aktarımı](/tr/tools/trajectory)
