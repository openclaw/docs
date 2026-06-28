---
read_when:
    - Ajan döngüsünün veya yaşam döngüsü olaylarının tam bir açıklamasına ihtiyacınız var
    - Oturum kuyruğa alma, döküm yazma veya oturum yazma kilidi davranışını değiştiriyorsunuz
summary: Ajan döngüsü yaşam döngüsü, akışlar ve bekleme semantiği
title: Ajan döngüsü
x-i18n:
    generated_at: "2026-06-28T00:26:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ccfdf4a3ea6b9c946064f051e32c88cefbcb707c7426abe85b04294030eedaf
    source_path: concepts/agent-loop.md
    workflow: 16
---

Ajan döngüsü, bir ajanın tam "gerçek" çalıştırmasıdır: alım → bağlam derleme → model çıkarımı →
araç yürütme → akışlı yanıtlar → kalıcılık. Bir iletiyi eylemlere ve nihai yanıta dönüştüren,
oturum durumunu tutarlı tutan yetkili yoldur.

OpenClaw'da döngü, model düşünürken, araçları çağırırken ve çıktı akışı yaparken yaşam döngüsü ve akış olayları
yayan, oturum başına tek ve serileştirilmiş bir çalıştırmadır. Bu belge, bu özgün döngünün
uçtan uca nasıl bağlandığını açıklar.

## Giriş noktaları

- Gateway RPC: `agent` ve `agent.wait`.
- CLI: `agent` komutu.

## Nasıl çalışır (üst düzey)

1. `agent` RPC parametreleri doğrular, oturumu çözer (sessionKey/sessionId), oturum meta verilerini kalıcı hale getirir, hemen `{ runId, acceptedAt }` döndürür.
2. `agentCommand` ajanı çalıştırır:
   - model + thinking/verbose/trace varsayılanlarını çözer
   - skills anlık görüntüsünü yükler
   - `runEmbeddedAgent` çağırır (OpenClaw ajan çalışma zamanı)
   - gömülü döngü bir tane yaymazsa **yaşam döngüsü end/error** yayar
3. `runEmbeddedAgent`:
   - çalıştırmaları oturum başına + global kuyruklar üzerinden serileştirir
   - model + kimlik doğrulama profilini çözer ve OpenClaw oturumunu oluşturur
   - çalışma zamanı olaylarına abone olur ve asistan/araç deltalarının akışını yapar
   - zaman aşımını zorunlu kılar -> aşılırsa çalıştırmayı iptal eder
   - Codex app-server dönüşleri için, terminal olaydan önce app-server ilerlemesi üretmeyi bırakan kabul edilmiş bir dönüşü iptal eder
   - yükleri + kullanım meta verilerini döndürür
4. `subscribeEmbeddedAgentSession`, ajan çalışma zamanı olaylarını OpenClaw `agent` akışına köprüler:
   - araç olayları => `stream: "tool"`
   - asistan deltaları => `stream: "assistant"`
   - yaşam döngüsü olayları => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`, `waitForAgentRun` kullanır:
   - `runId` için **yaşam döngüsü end/error** bekler
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` döndürür

## Kuyruğa alma + eşzamanlılık

- Çalıştırmalar oturum anahtarı başına serileştirilir (oturum yolu) ve isteğe bağlı olarak global bir yol üzerinden geçirilir.
- Bu, araç/oturum yarışlarını önler ve oturum geçmişini tutarlı tutar.
- Mesajlaşma kanalları, bu yol sistemini besleyen kuyruk modlarını (steer/followup/collect/interrupt) seçebilir.
  Bkz. [Komut Kuyruğu](/tr/concepts/queue).
- Transkript yazmaları da oturum dosyasında bir oturum yazma kilidiyle korunur. Kilit
  süreç farkındalıklıdır ve dosya tabanlıdır; bu nedenle süreç içi kuyruğu atlayan veya
  başka bir süreçten gelen yazıcıları yakalar. Oturum transkripti yazıcıları, oturumu meşgul
  olarak bildirmeden önce en fazla `session.writeLock.acquireTimeoutMs` kadar bekler;
  varsayılan `60000` ms'dir.
- Oturum yazma kilitleri varsayılan olarak yeniden girişli değildir. Bir yardımcı, tek bir mantıksal yazıcıyı
  koruyarak aynı kilidin edinimini bilerek iç içe geçirirse, açıkça
  `allowReentrant: true` ile katılmalıdır.

## Oturum + çalışma alanı hazırlığı

- Çalışma alanı çözülür ve oluşturulur; sandbox'lı çalıştırmalar bir sandbox çalışma alanı köküne yönlendirilebilir.
- Skills yüklenir (veya bir anlık görüntüden yeniden kullanılır) ve env ile isteme enjekte edilir.
- Bootstrap/bağlam dosyaları çözülür ve sistem istemi raporuna enjekte edilir.
- Bir oturum yazma kilidi edinilir; akıştan önce `SessionManager` açılır ve hazırlanır. Daha sonraki
  herhangi bir transkript yeniden yazma, compaction veya kırpma yolu, transkript dosyasını açmadan veya
  değiştirmeden önce aynı kilidi almalıdır.

## İstem derleme + sistem istemi

- Sistem istemi OpenClaw'un temel isteminden, skills isteminden, bootstrap bağlamından ve çalıştırma başına geçersiz kılmalardan oluşturulur.
- Modele özgü sınırlar ve compaction için ayrılmış token'lar uygulanır.
- Modelin ne gördüğü için bkz. [Sistem istemi](/tr/concepts/system-prompt).

## Kanca noktaları (nerede araya girebilirsiniz)

OpenClaw'da iki kanca sistemi vardır:

- **Dahili kancalar** (Gateway kancaları): komutlar ve yaşam döngüsü olayları için olay güdümlü betikler.
- **Plugin kancaları**: ajan/araç yaşam döngüsü ve gateway işlem hattı içindeki genişletme noktaları.

### Dahili kancalar (Gateway kancaları)

- **`agent:bootstrap`**: sistem istemi sonlandırılmadan önce bootstrap dosyaları oluşturulurken çalışır.
  Bootstrap bağlam dosyaları eklemek/kaldırmak için bunu kullanın.
- **Komut kancaları**: `/new`, `/reset`, `/stop` ve diğer komut olayları (Hooks belgesine bakın).

Kurulum ve örnekler için bkz. [Kancalar](/tr/automation/hooks).

### Plugin kancaları (ajan + gateway yaşam döngüsü)

Bunlar ajan döngüsünün veya gateway işlem hattının içinde çalışır:

- **`before_model_resolve`**: model çözümlemeden önce sağlayıcı/modeli belirlenimci olarak geçersiz kılmak için oturum öncesinde çalışır (`messages` yok).
- **`before_prompt_build`**: istem gönderiminden önce `prependContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` enjekte etmek için oturum yüklendikten sonra (`messages` ile) çalışır. Dönüş başına dinamik metin için `prependContext`, sistem istemi alanında durması gereken kararlı yönergeler için sistem bağlamı alanlarını kullanın.
- **`before_agent_start`**: iki fazdan birinde çalışabilecek eski uyumluluk kancasıdır; yukarıdaki açık kancaları tercih edin.
- **`before_agent_reply`**: satır içi eylemlerden sonra ve LLM çağrısından önce çalışır; bir Plugin'in dönüşü üstlenip sentetik bir yanıt döndürmesine veya dönüşü tamamen sessize almasına izin verir.
- **`agent_end`**: tamamlanmadan sonra nihai ileti listesini ve çalıştırma meta verilerini inceleyin.
- **`before_compaction` / `after_compaction`**: compaction döngülerini gözlemleyin veya açıklama ekleyin.
- **`before_tool_call` / `after_tool_call`**: araç parametrelerini/sonuçlarını araya girip yakalayın.
- **`before_install`**: Plugin kancaları mevcut OpenClaw sürecinde yüklüyken, operatör kurulum ilkesi çalıştıktan sonra aşamaya alınmış skill veya Plugin kurulum materyalini inceleyin.
- **`tool_result_persist`**: araç sonuçlarını OpenClaw'a ait bir oturum transkriptine yazılmadan önce eşzamanlı olarak dönüştürür.
- **`message_received` / `message_sending` / `message_sent`**: gelen + giden ileti kancaları.
- **`session_start` / `session_end`**: oturum yaşam döngüsü sınırları.
- **`gateway_start` / `gateway_stop`**: gateway yaşam döngüsü olayları.

Giden/araç korumaları için kanca karar kuralları:

- `before_tool_call`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` işlem yapmaz ve önceki bir engellemeyi temizlemez.
- `before_install`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` işlem yapmaz ve önceki bir engellemeyi temizlemez.
- CLI kurulum ve güncelleme yollarını kapsaması gereken, operatöre ait kurulum izin/engelleme kararları için `before_install` değil, `security.installPolicy` kullanın.
- `message_sending`: `{ cancel: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` işlem yapmaz ve önceki bir iptali temizlemez.

Kanca API'si ve kayıt ayrıntıları için bkz. [Plugin kancaları](/tr/plugins/hooks).

Harness'lar bu kancaları farklı şekilde uyarlayabilir. Codex app-server harness'ı,
belgelenmiş yansıtılmış yüzeyler için uyumluluk sözleşmesi olarak OpenClaw Plugin kancalarını korurken,
Codex yerel kancaları ayrı bir daha düşük düzeyli Codex mekanizması olarak kalır.

## Akış + kısmi yanıtlar

- Asistan deltaları ajan çalışma zamanından akışla iletilir ve `assistant` olayları olarak yayılır.
- Blok akışı, kısmi yanıtları `text_end` veya `message_end` üzerinde yayabilir.
- Akıl yürütme akışı ayrı bir akış olarak veya blok yanıtları olarak yayılabilir.
- Parçalama ve blok yanıt davranışı için bkz. [Akış](/tr/concepts/streaming).

## Araç yürütme + mesajlaşma araçları

- Araç başlangıç/güncelleme/bitiş olayları `tool` akışında yayılır.
- Araç sonuçları, günlüğe yazılmadan/yayılmadan önce boyut ve görüntü yükleri açısından temizlenir.
- Mesajlaşma aracı gönderimleri, yinelenen asistan onaylarını bastırmak için izlenir.

## Yanıt biçimlendirme + bastırma

- Nihai yükler şunlardan derlenir:
  - asistan metni (ve isteğe bağlı akıl yürütme)
  - satır içi araç özetleri (verbose + izin verildiğinde)
  - model hata verdiğinde asistan hata metni
- Tam sessizlik token'ı `NO_REPLY` / `no_reply`, giden
  yüklerden filtrelenir.
- Mesajlaşma aracı yinelemeleri nihai yük listesinden kaldırılır.
- İşlenebilir yük kalmazsa ve bir araç hata verdiyse, yedek bir araç hata yanıtı yayılır
  (bir mesajlaşma aracı zaten kullanıcıya görünür bir yanıt göndermediyse).

## Compaction + yeniden denemeler

- Otomatik compaction, `compaction` akış olayları yayar ve bir yeniden denemeyi tetikleyebilir.
- Yeniden denemede, yinelenen çıktıyı önlemek için bellek içi tamponlar ve araç özetleri sıfırlanır.
- Compaction işlem hattı için bkz. [Compaction](/tr/concepts/compaction).

## Olay akışları (bugün)

- `lifecycle`: `subscribeEmbeddedAgentSession` tarafından yayılır (ve `agentCommand` tarafından yedek olarak)
- `assistant`: ajan çalışma zamanından akışla iletilen deltalar
- `tool`: ajan çalışma zamanından akışla iletilen araç olayları

## Sohbet kanalı işleme

- Asistan deltaları sohbet `delta` iletilerine tamponlanır.
- **Yaşam döngüsü end/error** üzerinde bir sohbet `final` yayılır.

## Zaman aşımları

- `agent.wait` varsayılanı: 30 sn (yalnızca bekleme). `timeoutMs` parametresi geçersiz kılar.
- Ajan çalışma zamanı: `agents.defaults.timeoutSeconds` varsayılanı 172800 sn'dir (48 saat); `runEmbeddedAgent` iptal zamanlayıcısında uygulanır.
- Cron çalışma zamanı: yalıtılmış ajan dönüşü `timeoutSeconds`, cron'a aittir. Zamanlayıcı, yürütme başladığında bu zamanlayıcıyı başlatır, yapılandırılan son tarihte alttaki çalıştırmayı iptal eder, ardından zaman aşımını kaydetmeden önce sınırlı temizlik çalıştırır; böylece eski bir alt oturum yolu takılı tutamaz.
- Oturum canlılığı tanıları: tanılar etkinleştirildiğinde, `diagnostics.stuckSessionWarnMs` gözlemlenmiş yanıt, araç, durum, blok veya ACP ilerlemesi olmayan uzun `processing` oturumlarını sınıflandırır. Etkin gömülü çalıştırmalar, model çağrıları ve araç çağrıları `session.long_running` olarak bildirilir; sahipli sessiz model çağrıları da yavaş veya akışsız sağlayıcıların çok erken takılmış olarak bildirilmemesi için `diagnostics.stuckSessionAbortMs` değerine kadar `session.long_running` kalır. Yakın zamanda ilerleme göstermeyen etkin işler `session.stalled` olarak bildirilir; sahipli model çağrıları iptal eşiğinde veya sonrasında `session.stalled` durumuna geçer ve sahipsiz eski model/araç etkinliği uzun süre çalışıyor olarak gizlenmez. `session.stuck`, eski sahipsiz model/araç etkinliği olan boşta kuyruğa alınmış oturumlar dahil kurtarılabilir eski oturum defter tutma işlemleri için ayrılmıştır. Eski oturum defter tutma, kurtarma kapıları geçtikten hemen sonra etkilenen oturum yolunu serbest bırakır; takılmış gömülü çalıştırmalar yalnızca `diagnostics.stuckSessionAbortMs` sonrasında (varsayılan: en az 5 dakika ve uyarı eşiğinin 3 katı) iptal edilip boşaltılır; böylece kuyruktaki işler yalnızca yavaş çalışan çalıştırmalar kesilmeden sürdürülebilir. Kurtarma yapılandırılmış requested/completed sonuçları yayar ve tanı durumu yalnızca aynı işleme nesli hâlâ güncelse boşta olarak işaretlenir. Yinelenen `session.stuck` tanıları, oturum değişmeden kaldığı sürece geri çekilir.
- Model boşta zaman aşımı: OpenClaw, boşta penceresinden önce hiçbir yanıt parçası gelmezse model isteğini iptal eder. `models.providers.<id>.timeoutSeconds`, yavaş yerel/kendi barındırdığı sağlayıcılar için bu boşta bekçi zamanlayıcısını uzatır; ancak yine de daha düşük herhangi bir `agents.defaults.timeoutSeconds` veya çalıştırmaya özgü zaman aşımıyla sınırlıdır, çünkü bunlar tüm ajan çalıştırmasını kontrol eder. Aksi takdirde OpenClaw, yapılandırılmışsa `agents.defaults.timeoutSeconds` kullanır ve varsayılan olarak 120 sn ile sınırlandırır. Açık model veya ajan zaman aşımı olmayan Cron tetiklemeli bulut model çalıştırmaları aynı varsayılan boşta bekçi zamanlayıcısını kullanır; açık bir cron çalıştırma zaman aşımı olduğunda, yapılandırılmış model yedekleri dış cron son tarihinden önce çalışabilsin diye bulut model akış takılmaları 60 sn ile sınırlandırılır. Cron tetiklemeli yerel veya kendi barındırdığı model çalıştırmaları, açık bir zaman aşımı yapılandırılmadıkça örtük bekçi zamanlayıcısını devre dışı bırakır ve açık cron çalıştırma zaman aşımları yerel/kendi barındırdığı sağlayıcılar için boşta penceresi olarak kalır; bu nedenle yavaş yerel sağlayıcılar `models.providers.<id>.timeoutSeconds` ayarlamalıdır.
- Sağlayıcı HTTP isteği zaman aşımı: `models.providers.<id>.timeoutSeconds`, bağlantı, başlıklar, gövde, SDK istek zaman aşımı, toplam guarded-fetch iptal işleme ve model akışı boşta bekçi zamanlayıcısı dahil olmak üzere ilgili sağlayıcının model HTTP fetch'leri için geçerlidir. Ollama gibi yavaş yerel/kendi barındırdığı sağlayıcılar için bunu, tüm ajan çalışma zamanı zaman aşımını yükseltmeden önce kullanın ve model isteğinin daha uzun çalışması gerekiyorsa ajan/çalışma zamanı zaman aşımını en az bu kadar yüksek tutun.

## İşlerin erken bitebileceği yerler

- Ajan zaman aşımı (iptal)
- AbortSignal (iptal)
- Gateway bağlantısının kesilmesi veya RPC zaman aşımı
- `agent.wait` zaman aşımı (yalnızca bekleme, ajanı durdurmaz)

## İlgili

- [Araçlar](/tr/tools) — kullanılabilir ajan araçları
- [Hook'lar](/tr/automation/hooks) — ajan yaşam döngüsü olaylarıyla tetiklenen olay güdümlü betikler
- [Compaction](/tr/concepts/compaction) — uzun konuşmaların nasıl özetlendiği
- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Düşünme](/tr/tools/thinking) — düşünme/akıl yürütme düzeyi yapılandırması
