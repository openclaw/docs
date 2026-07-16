---
read_when:
    - Ajan döngüsünün veya yaşam döngüsü olaylarının adım adım tam açıklamasına ihtiyacınız var
    - Oturum kuyruğa alma, transkript yazma veya oturum yazma kilidi davranışını değiştiriyorsunuz
summary: Ajan döngüsü yaşam döngüsü, akışları ve bekleme semantiği
title: Ajan döngüsü
x-i18n:
    generated_at: "2026-07-16T17:03:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3793a2c765c72f7f4bb8e790ce4d61abc279cf3a8a7367ecf8759428d0192279
    source_path: concepts/agent-loop.md
    workflow: 16
---

Ajan döngüsü, bir mesajı eylemlere ve yanıta dönüştüren, oturum başına serileştirilmiş çalıştırmadır: alım, bağlam oluşturma, model çıkarımı, araç yürütme, akış ve kalıcılık.

## Giriş noktaları

- Gateway RPC: `agent` ve `agent.wait`.
- CLI: `openclaw agent`.

## Çalıştırma sırası

1. `agent` RPC, parametreleri doğrular, oturumu çözümler (`sessionKey`/`sessionId`), oturum meta verilerini kalıcılaştırır ve hemen `{ runId, acceptedAt }` döndürür.
2. `agentCommand` turu çalıştırır: model + düşünme/ayrıntılı/izleme varsayılanlarını çözümler, Skills anlık görüntüsünü yükler, `runEmbeddedAgent` çağrısını yapar ve gömülü döngü henüz yayımlamadıysa yedek bir **yaşam döngüsü sonu/hatası** yayımlar.
3. `runEmbeddedAgent`: çalıştırmaları oturum başına ve genel kuyruklar üzerinden serileştirir, model + kimlik doğrulama profilini çözümler, OpenClaw oturumunu oluşturur, çalışma zamanı olaylarına abone olur, asistan/araç farklarını akışla iletir, çalıştırma zaman aşımını uygular (süre dolduğunda iptal eder) ve yüklerle birlikte kullanım meta verilerini döndürür. Codex uygulama sunucusu turlarında ayrıca, kabul edilmiş bir tur terminal olaydan önce uygulama sunucusu ilerlemesi üretmeyi durdurursa turu iptal eder.
4. `subscribeEmbeddedAgentSession`, çalışma zamanı olaylarını `agent` akışına köprüler: araç olaylarını `stream: "tool"` öğesine, asistan farklarını `stream: "assistant"` öğesine, yaşam döngüsü olaylarını `stream: "lifecycle"` öğesine (`phase: "start" | "end" | "error"`).
5. `agent.wait` (`waitForAgentRun`), bir `runId` üzerinde **yaşam döngüsü sonunu/hatasını** bekler ve `{ status: ok|error|timeout, startedAt, endedAt, error? }` döndürür.

## Kuyruklama ve eşzamanlılık

Çalıştırmalar, araç/oturum yarışlarını önlemek için oturum anahtarı başına (oturum hattı) ve isteğe bağlı olarak genel bir hat üzerinden serileştirilir. Mesajlaşma kanalları, bu hat sistemini besleyen bir kuyruk modu (yönlendir/takip/topla/kes) seçer; bkz. [Komut Kuyruğu](/tr/concepts/queue).

Transkript yazımları ayrıca oturum dosyası üzerindeki bir oturum yazma kilidiyle korunur. Kilit, işlem farkındalığına sahip ve dosya tabanlıdır; dolayısıyla işlem içi kuyruğu atlayan veya başka bir işlemden gelen yazıcıları yakalar. Yazıcılar, oturumun meşgul olduğunu bildirmeden önce `session.writeLock.acquireTimeoutMs` kadar bekler (varsayılan `60000` ms; ortam geçersiz kılması `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`).

Oturum yazma kilitleri varsayılan olarak yeniden girişli değildir. Tek bir mantıksal yazıcıyı korurken aynı kilidin alınmasını kasıtlı olarak iç içe geçiren bir yardımcı, `allowReentrant: true` ile açıkça etkinleştirmelidir.

## Oturum ve çalışma alanı hazırlığı

- Çalışma alanı çözümlenir ve oluşturulur; korumalı alanlı çalıştırmalar, korumalı alan çalışma alanı köküne yönlendirilebilir.
- Skills yüklenir (veya bir anlık görüntüden yeniden kullanılır) ve ortama ve isteme eklenir.
- Önyükleme/bağlam dosyaları çözümlenir ve sistem istemine eklenir.
- Akış başlamadan önce bir oturum yazma kilidi alınır ve oturum transkripti hedefi hazırlanır. Daha sonraki tüm transkript yeniden yazma, Compaction veya kısaltma yolları, SQLite transkript satırlarını değiştirmeden önce aynı kilidi almalıdır.

## İstem oluşturma

Sistem istemi; OpenClaw'ın temel istemi, Skills istemi, önyükleme bağlamı ve çalıştırma başına geçersiz kılmalardan oluşturulur. Modele özgü sınırlar ve Compaction için ayrılan token'lar uygulanır. Modelin ne gördüğü için bkz. [Sistem istemi](/tr/concepts/system-prompt).

## Kancalar

OpenClaw'ın iki kanca sistemi vardır:

- **Dahili kancalar** (Gateway kancaları): komutlar ve yaşam döngüsü olayları için olay güdümlü betikler.
- **Plugin kancaları**: ajan/araç yaşam döngüsü ve Gateway işlem hattı içindeki genişletme noktaları.

### Dahili kancalar (Gateway kancaları)

- **`agent:bootstrap`**: sistem istemi son hâline getirilmeden önce önyükleme dosyaları oluşturulurken çalışır. Önyükleme bağlam dosyaları eklemek veya kaldırmak için kullanın.
- **Komut kancaları**: `/new`, `/reset`, `/stop` ve diğer komut olayları (Kancalar belgesine bakın).

Kurulum ve örnekler için bkz. [Kancalar](/tr/automation/hooks).

### Plugin kancaları

Bunlar ajan döngüsü veya Gateway işlem hattı içinde çalışır:

| Kanca                                                    | Çalıştığı aşama                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `before_model_resolve`                                  | Oturum öncesinde (`messages` olmadan), çözümlemeden önce sağlayıcıyı/modeli deterministik olarak geçersiz kılmak için.                                                                                                                                                                                                |
| `before_prompt_build`                                   | Oturum yüklendikten sonra (`messages` ile), gönderimden önce `prependContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` eklemek için. Tur başına dinamik metin için `prependContext`, sistem istemi alanına ait kararlı yönlendirmeler için sistem bağlamı alanlarını kullanın. |
| `before_agent_start`                                    | Her iki aşamada da çalışabilen eski uyumluluk kancası; yukarıdaki açık kancaları tercih edin.                                                                                                                                                                                                    |
| `before_agent_reply`                                    | Satır içi eylemlerden sonra, LLM çağrısından önce. Bir Plugin'in turu üstlenip yapay bir yanıt döndürmesine veya turu tamamen sessize almasına olanak tanır.                                                                                                                                                                |
| `agent_end`                                             | Tamamlamadan sonra, son mesaj listesi ve çalıştırma meta verileriyle.                                                                                                                                                                                                                             |
| `before_compaction` / `after_compaction`                | Compaction döngülerini gözlemler veya açıklama ekler.                                                                                                                                                                                                                                                      |
| `before_tool_call` / `after_tool_call`                  | Araç parametrelerini/sonuçlarını yakalar.                                                                                                                                                                                                                                                              |
| `before_install`                                        | Operatör kurulum politikası çalıştıktan sonra, mevcut işlemde Plugin kancaları yüklüyken aşamalandırılmış Skills/Plugin kurulum malzemesi üzerinde.                                                                                                                                                           |
| `tool_result_persist`                                   | Araç sonuçlarını OpenClaw'a ait bir oturum transkriptine yazılmadan önce eşzamanlı olarak dönüştürür.                                                                                                                                                                                      |
| `message_received` / `message_sending` / `message_sent` | Gelen ve giden mesaj kancaları.                                                                                                                                                                                                                                                         |
| `session_start` / `session_end`                         | Oturum yaşam döngüsü sınırları.                                                                                                                                                                                                                                                               |
| `gateway_start` / `gateway_stop`                        | Gateway yaşam döngüsü olayları.                                                                                                                                                                                                                                                                   |

Giden/araç korumaları için kanca karar kuralları:

- `before_tool_call`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur. `{ block: false }` işlem yapmaz ve önceki bir engeli temizlemez.
- `before_install`: yukarıdakiyle aynı terminal/işlem yapmama semantiği. CLI kurulum ve güncelleme yollarını kapsaması gereken, operatöre ait kuruluma izin verme/engelleme kararları için `before_install` değil, `security.installPolicy` kullanın.
- `message_sending`: `{ cancel: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur. `{ cancel: false }` işlem yapmaz ve önceki bir iptali temizlemez.

Kanca API'si ve kayıt ayrıntıları için bkz. [Plugin kancaları](/tr/plugins/hooks).

Çalıştırma çerçeveleri bu kancaları uyarlayabilir. Codex uygulama sunucusu çalıştırma çerçevesi, belgelenmiş yansıtılmış yüzeylerin uyumluluk sözleşmesi olarak OpenClaw Plugin kancalarını korur; Codex yerel kancaları, ayrı ve daha düşük düzeyli bir Codex mekanizmasıdır.

## Akış

- Asistan farkları, ajan çalışma zamanından `assistant` olayları olarak akışla iletilir.
- Blok akışı, `text_end` veya `message_end` üzerinde kısmi yanıtlar yayımlayabilir.
- Akıl yürütme akışı ayrı bir akış veya blok yanıtları olabilir.
- Parçalama ve blok yanıt davranışı için bkz. [Akış](/tr/concepts/streaming).

## Araç yürütme

- Araç başlatma/güncelleme/bitirme olayları `tool` akışında yayımlanır.
- Araç sonuçları, günlüğe kaydedilmeden/yayımlanmadan önce boyut ve görüntü yükleri açısından temizlenir.
- Mesajlaşma aracı gönderimleri, yinelenen asistan onaylarını engellemek için izlenir.

## Yanıt şekillendirme

Son yükler; asistan metninden (isteğe bağlı akıl yürütmeyle birlikte), satır içi araç özetlerinden (ayrıntılı mod etkin ve izin veriliyorsa) ve model hata verdiğinde asistan hata metninden oluşturulur.

- Tam sessizlik token'ı `NO_REPLY`, giden yüklerden filtrelenir.
- Mesajlaşma aracı yinelemeleri son yük listesinden kaldırılır.
- İşlenebilir yük kalmazsa ve bir araç hata verdiyse, bir mesajlaşma aracı zaten kullanıcı tarafından görülebilen bir yanıt göndermediği sürece yedek bir araç hata yanıtı yayımlanır.

## Compaction ve yeniden denemeler

Otomatik Compaction, `compaction` akış olayları yayımlar ve yeniden denemeyi tetikleyebilir. Yeniden denemede, yinelenen çıktıları önlemek için bellek içi arabellekler ve araç özetleri sıfırlanır. Bkz. [Compaction](/tr/concepts/compaction).

## Olay akışları

- `lifecycle`: `subscribeEmbeddedAgentSession` tarafından (ve yedek olarak `agentCommand` tarafından) yayımlanır.
- `assistant`: ajan çalışma zamanından akışla iletilen farklar.
- `tool`: ajan çalışma zamanından akışla iletilen araç olayları.

Gateway, yaşam döngüsü ve araç başlatma/terminal olaylarını sınırlı,
yalnızca meta veri içeren [denetim defterine](/tr/cli/audit) yansıtır. Bu yansıtma; istemleri, mesajları, araç bağımsız değişkenlerini, araç sonuçlarını
veya ham hataları transkript/çalışma zamanı yolundan dışarı kopyalamadan kaynak ve
sonuç kodlarını kaydeder.

## Sohbet kanalı işleme

Asistan farkları, sohbet `delta` mesajlarında arabelleğe alınır. **Yaşam döngüsü sonunda/hatasında** bir sohbet `final` yayımlanır.

## Zaman aşımları

| Zaman aşımı                                      | Varsayılan                              | Notlar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent.wait`                                     | 30s                                    | Yalnızca bekleme içindir; `timeoutMs` parametresi bunu geçersiz kılar. Altta yatan çalıştırmayı durdurmaz.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Agent çalışma zamanı (`agents.defaults.timeoutSeconds`) | 172800s (48h)                          | `runEmbeddedAgent` öğesinin iptal zamanlayıcısı tarafından uygulanır. Sınırsız çalıştırma bütçesi için `0` ayarlayın; model akışı canlılık izleyicileri uygulanmaya devam eder.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Cron yalıtılmış agent turu                         | cron tarafından yönetilir                          | Zamanlayıcı, yürütme başladığında kendi zamanlayıcısını başlatır, yapılandırılmış son tarihte çalıştırmayı iptal eder ve ardından zaman aşımını kaydetmeden önce sınırlı temizleme işlemi gerçekleştirir; böylece eski bir alt oturum hattın takılı kalmasına neden olamaz.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Model boşta kalma zaman aşımı                               | Bulut 120s; kendi barındırılan 300s           | OpenClaw, boşta kalma süresi dolmadan önce hiçbir yanıt parçası gelmezse model isteğini iptal eder. `models.providers.<id>.timeoutSeconds`, yavaş yerel/kendi barındırılan sağlayıcılar için bu boşta kalma izleyicisinin süresini uzatır; ancak bunlar tüm agent çalıştırmasını yönettiğinden, daha düşük sonlu herhangi bir `agents.defaults.timeoutSeconds` veya çalıştırmaya özgü zaman aşımıyla sınırlı kalır. Sınırsız çalıştırma bütçelerinde de sağlayıcı sınıfına özgü boşta kalma izleyicisi korunur. Açık bir model/agent zaman aşımı olmadan Cron tarafından tetiklenen bulut modeli çalıştırmaları aynı varsayılanı kullanır; açık bir cron çalıştırma zaman aşımı olduğunda, yapılandırılmış model yedekleri dış cron son tarihinden önce çalışabilsin diye bulut modeli akışındaki duraklamalar en fazla 60s sürer. Gerçekten yerel uç noktalardaki (geri döngü/özel baseUrl) Cron tarafından tetiklenen çalıştırmalar yerel boşta kalma devre dışı bırakma ayarını korur; ağ baseUrl'lerindeki kendi barındırılan sağlayıcılara örtük 300s izleyici uygulanır. Açık bir cron çalıştırma zaman aşımı olduğunda, yerel/kendi barındırılan duraklamalar bu zaman aşımıyla sınırlanır. Yavaş yerel sağlayıcılar için `models.providers.<id>.timeoutSeconds` ayarlayın. |
| Sağlayıcı HTTP isteği zaman aşımı                    | `models.providers.<id>.timeoutSeconds` | Bağlantıyı, üstbilgileri, gövdeyi, SDK isteği zaman aşımını, korumalı getirme iptal işlemesini ve söz konusu sağlayıcı için model akışı boşta kalma izleyicisini kapsar. Tüm agent çalışma zamanı zaman aşımını artırmadan önce yavaş yerel/kendi barındırılan sağlayıcılar (örneğin Ollama) için kullanın; model isteğinin daha uzun süre çalışması gerekiyorsa agent/çalışma zamanı zaman aşımını en az onun kadar yüksek tutun.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Takılı oturum tanılamaları

Tanılamalar etkinleştirildiğinde, `diagnostics.stuckSessionWarnMs` (varsayılan `120000` ms), gözlemlenmiş yanıt, araç, durum, blok veya ACP ilerlemesi olmayan uzun `processing` oturumlarını sınıflandırır:

- Etkin gömülü çalıştırmalar, model çağrıları ve araç çağrıları `session.long_running` olarak bildirilir. Sahibi belirli sessiz model çağrıları, yavaş veya akış kullanmayan sağlayıcıların çok erken takılmış olarak işaretlenmemesi için `diagnostics.stuckSessionAbortMs` zamanına kadar `session.long_running` olarak kalır.
- Yakın zamanda ilerleme göstermeyen etkin çalışma `session.stalled` olarak bildirilir. Sahibi belirli model çağrıları iptal eşiğinde veya sonrasında `session.stalled` durumuna geçer; sahipsiz eski model/araç etkinliği uzun süre çalışıyor olarak gizlenmez.
- `session.stuck`, sahipsiz eski model/araç etkinliğine sahip boşta bekleyen kuyruk oturumları da dahil olmak üzere kurtarılabilir eski oturum kayıtları için ayrılmıştır.

`diagnostics.stuckSessionAbortMs` varsayılan olarak en az 5 dakika ve uyarı eşiğinin 3 katıdır. Eski oturum kayıtları, kurtarma eşikleri geçildikten hemen sonra etkilenen oturum hattını serbest bırakır; takılmış gömülü çalıştırmalar yalnızca iptal eşiğinden sonra iptal edilip boşaltılır, böylece kuyruktaki çalışma yalnızca yavaş olan çalıştırmalar kesilmeden devam eder. Kurtarma, yapılandırılmış istenen/tamamlanan sonuçları yayınlar; tanılama durumu yalnızca aynı işleme nesli hâlâ güncelse boşta olarak işaretlenir ve yinelenen `session.stuck` tanılamaları oturum değişmeden kaldığı sürece giderek seyrekleşir.

## İşlemlerin erken sona erebileceği durumlar

- Agent zaman aşımı (iptal)
- AbortSignal (iptal)
- Gateway bağlantısının kesilmesi veya RPC zaman aşımı
- `agent.wait` zaman aşımı (yalnızca bekleme içindir, agent'ı durdurmaz)

## İlgili

- [Araçlar](/tr/tools) - kullanılabilir agent araçları
- [Kancalar](/tr/automation/hooks) - agent yaşam döngüsü olayları tarafından tetiklenen olay güdümlü betikler
- [Compaction](/tr/concepts/compaction) - uzun konuşmaların nasıl özetlendiği
- [Yürütme Onayları](/tr/tools/exec-approvals) - kabuk komutları için onay eşikleri
- [Düşünme](/tr/tools/thinking) - düşünme/akıl yürütme düzeyi yapılandırması
