---
read_when:
    - Ajan döngüsünün veya yaşam döngüsü olaylarının tam bir adım adım açıklamasına ihtiyacınız var
    - Oturum kuyruğa alma, transkript yazma veya oturum yazma kilidi davranışını değiştiriyorsunuz
summary: Ajan döngüsünün yaşam döngüsü, akışlar ve bekleme semantiği
title: Ajan döngüsü
x-i18n:
    generated_at: "2026-05-06T09:06:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: e040d090e686db47a432c8d6f13c167838825b16e491297422f909aba0add5f0
    source_path: concepts/agent-loop.md
    workflow: 16
---

Bir ajan döngüsü, bir ajanın tam "gerçek" çalıştırmasıdır: alım → bağlam derleme → model çıkarımı →
araç yürütme → akışlı yanıtlar → kalıcılık. Bir iletiyi eylemlere ve nihai yanıta dönüştüren, bu sırada oturum durumunu tutarlı tutan yetkili yoldur.

OpenClaw'da döngü, model düşünürken, araçları çağırırken ve çıktıyı akışa verirken yaşam döngüsü ve akış olayları yayan, oturum başına tek ve serileştirilmiş bir çalıştırmadır. Bu belge, bu özgün döngünün uçtan uca nasıl bağlandığını açıklar.

## Giriş noktaları

- Gateway RPC: `agent` ve `agent.wait`.
- CLI: `agent` komutu.

## Nasıl çalışır (üst düzey)

1. `agent` RPC parametreleri doğrular, oturumu çözer (sessionKey/sessionId), oturum meta verilerini kalıcılaştırır, hemen `{ runId, acceptedAt }` döndürür.
2. `agentCommand` ajanı çalıştırır:
   - model + thinking/verbose/trace varsayılanlarını çözer
   - Skills anlık görüntüsünü yükler
   - `runEmbeddedPiAgent` çağrısı yapar (pi-agent-core çalışma zamanı)
   - gömülü döngü bir tane yaymazsa **yaşam döngüsü bitiş/hata** yayar
3. `runEmbeddedPiAgent`:
   - çalıştırmaları oturum başına + küresel kuyruklar üzerinden serileştirir
   - model + kimlik doğrulama profilini çözer ve pi oturumunu oluşturur
   - pi olaylarına abone olur ve asistan/araç deltalarını akışa verir
   - zaman aşımını uygular -> süre aşılırsa çalıştırmayı iptal eder
   - Codex app-server dönüşleri için, terminal olaydan önce app-server ilerlemesi üretmeyi durduran kabul edilmiş bir dönüşü iptal eder
   - payload'ları + kullanım meta verilerini döndürür
4. `subscribeEmbeddedPiSession`, pi-agent-core olaylarını OpenClaw `agent` akışına köprüler:
   - araç olayları => `stream: "tool"`
   - asistan deltaları => `stream: "assistant"`
   - yaşam döngüsü olayları => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`, `waitForAgentRun` kullanır:
   - `runId` için **yaşam döngüsü bitiş/hata** bekler
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` döndürür

## Kuyruğa alma + eşzamanlılık

- Çalıştırmalar oturum anahtarı başına (oturum şeridi) ve isteğe bağlı olarak küresel bir şerit üzerinden serileştirilir.
- Bu, araç/oturum yarışlarını önler ve oturum geçmişini tutarlı tutar.
- Mesajlaşma kanalları, bu şerit sistemini besleyen kuyruk modlarını (collect/steer/followup) seçebilir.
  Bkz. [Komut Kuyruğu](/tr/concepts/queue).
- Transkript yazmaları da oturum dosyasında bir oturum yazma kilidiyle korunur. Kilit,
  süreç farkındalığına sahiptir ve dosya tabanlıdır; bu nedenle süreç içi kuyruğu atlayan veya
  başka bir süreçten gelen yazıcıları yakalar. Oturum transkript yazıcıları, oturumu meşgul olarak
  bildirmeden önce en fazla `session.writeLock.acquireTimeoutMs` kadar bekler; varsayılan `60000` ms'dir.
- Oturum yazma kilitleri varsayılan olarak yeniden girilebilir değildir. Bir yardımcı, tek bir mantıksal yazıcıyı korurken
  aynı kilidin edinilmesini kasıtlı olarak iç içe geçiriyorsa, bunu açıkça
  `allowReentrant: true` ile etkinleştirmelidir.

## Oturum + çalışma alanı hazırlığı

- Çalışma alanı çözülür ve oluşturulur; sandbox'lı çalıştırmalar bir sandbox çalışma alanı köküne yönlendirilebilir.
- Skills yüklenir (veya bir anlık görüntüden yeniden kullanılır) ve ortama ve isteme enjekte edilir.
- Bootstrap/bağlam dosyaları çözülür ve sistem istemi raporuna enjekte edilir.
- Bir oturum yazma kilidi edinilir; akış başlamadan önce `SessionManager` açılır ve hazırlanır. Daha sonraki herhangi bir
  transkript yeniden yazma, Compaction veya kısaltma yolu, transkript dosyasını açmadan veya
  değiştirmeden önce aynı kilidi almalıdır.

## İstem derleme + sistem istemi

- Sistem istemi, OpenClaw'un temel isteminden, Skills isteminden, bootstrap bağlamından ve çalıştırma başına geçersiz kılmalardan oluşturulur.
- Modele özgü sınırlar ve Compaction yedek belirteçleri uygulanır.
- Modelin ne gördüğü için bkz. [Sistem istemi](/tr/concepts/system-prompt).

## Kanca noktaları (nerede araya girebilirsiniz)

OpenClaw iki kanca sistemine sahiptir:

- **Dahili kancalar** (Gateway kancaları): komutlar ve yaşam döngüsü olayları için olay güdümlü betikler.
- **Plugin kancaları**: ajan/araç yaşam döngüsü ve Gateway işlem hattı içindeki genişletme noktaları.

### Dahili kancalar (Gateway kancaları)

- **`agent:bootstrap`**: sistem istemi son haline getirilmeden önce bootstrap dosyaları oluşturulurken çalışır.
  Bootstrap bağlam dosyaları eklemek/kaldırmak için bunu kullanın.
- **Komut kancaları**: `/new`, `/reset`, `/stop` ve diğer komut olayları (Hooks belgesine bakın).

Kurulum ve örnekler için bkz. [Kancalar](/tr/automation/hooks).

### Plugin kancaları (ajan + Gateway yaşam döngüsü)

Bunlar ajan döngüsü veya Gateway işlem hattı içinde çalışır:

- **`before_model_resolve`**: model çözümlemesinden önce sağlayıcıyı/modeli deterministik olarak geçersiz kılmak için oturum öncesinde çalışır (`messages` yok).
- **`before_prompt_build`**: istem gönderiminden önce `prependContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` enjekte etmek için oturum yüklendikten sonra (`messages` ile) çalışır. Tur başına dinamik metin için `prependContext` kullanın; sistem istemi alanında durması gereken kararlı yönlendirme için sistem bağlamı alanlarını kullanın.
- **`before_agent_start`**: iki aşamada da çalışabilen eski uyumluluk kancası; yukarıdaki açık kancaları tercih edin.
- **`before_agent_reply`**: satır içi eylemlerden sonra ve LLM çağrısından önce çalışır; bir Plugin'in dönüşü üstlenmesine ve sentetik yanıt döndürmesine ya da dönüşü tamamen sessize almasına olanak tanır.
- **`agent_end`**: tamamlandıktan sonra nihai ileti listesini ve çalıştırma meta verilerini inceleyin.
- **`before_compaction` / `after_compaction`**: Compaction döngülerini gözlemleyin veya notlandırın.
- **`before_tool_call` / `after_tool_call`**: araç parametrelerine/sonuçlarına araya girin.
- **`before_install`**: yerleşik tarama bulgularını inceleyin ve isteğe bağlı olarak skill veya Plugin kurulumlarını engelleyin.
- **`tool_result_persist`**: araç sonuçları OpenClaw'a ait bir oturum transkriptine yazılmadan önce bunları eşzamanlı olarak dönüştürün.
- **`message_received` / `message_sending` / `message_sent`**: gelen + giden ileti kancaları.
- **`session_start` / `session_end`**: oturum yaşam döngüsü sınırları.
- **`gateway_start` / `gateway_stop`**: Gateway yaşam döngüsü olayları.

Giden/araç korumaları için kanca karar kuralları:

- `before_tool_call`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` işlemsizdir ve önceki bir engeli temizlemez.
- `before_install`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` işlemsizdir ve önceki bir engeli temizlemez.
- `message_sending`: `{ cancel: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` işlemsizdir ve önceki bir iptali temizlemez.

Kanca API'si ve kayıt ayrıntıları için bkz. [Plugin kancaları](/tr/plugins/hooks).

Harness'lar bu kancaları farklı şekilde uyarlayabilir. Codex app-server harness'ı, belgelenmiş aynalanmış
yüzeyler için OpenClaw Plugin kancalarını uyumluluk sözleşmesi olarak korurken,
Codex yerel kancaları ayrı, daha düşük düzeyli bir Codex mekanizması olarak kalır.

## Akış + kısmi yanıtlar

- Asistan deltaları pi-agent-core'dan akışa verilir ve `assistant` olayları olarak yayılır.
- Blok akışı, `text_end` veya `message_end` üzerinde kısmi yanıtlar yayabilir.
- Akıl yürütme akışı ayrı bir akış olarak veya blok yanıtları olarak yayılabilir.
- Parçalama ve blok yanıt davranışı için bkz. [Akış](/tr/concepts/streaming).

## Araç yürütme + mesajlaşma araçları

- Araç başlangıç/güncelleme/bitiş olayları `tool` akışında yayılır.
- Araç sonuçları, günlüğe yazılmadan/yayılmadan önce boyut ve görüntü payload'ları açısından temizlenir.
- Mesajlaşma aracı gönderimleri, yinelenen asistan onaylarını bastırmak için izlenir.

## Yanıt şekillendirme + bastırma

- Nihai payload'lar şunlardan derlenir:
  - asistan metni (ve isteğe bağlı akıl yürütme)
  - satır içi araç özetleri (verbose + izin verildiğinde)
  - model hata verdiğinde asistan hata metni
- Tam sessiz belirteç `NO_REPLY` / `no_reply`, giden
  payload'lardan filtrelenir.
- Mesajlaşma aracı tekrarları nihai payload listesinden kaldırılır.
- İşlenebilir payload kalmazsa ve bir araç hata verdiyse, yedek bir araç hata yanıtı yayılır
  (bir mesajlaşma aracı zaten kullanıcı tarafından görülebilir bir yanıt göndermediyse).

## Compaction + yeniden denemeler

- Otomatik Compaction, `compaction` akış olayları yayar ve yeniden denemeyi tetikleyebilir.
- Yeniden denemede, yinelenen çıktıyı önlemek için bellek içi arabellekler ve araç özetleri sıfırlanır.
- Compaction işlem hattı için bkz. [Compaction](/tr/concepts/compaction).

## Olay akışları (bugün)

- `lifecycle`: `subscribeEmbeddedPiSession` tarafından yayılır (ve yedek olarak `agentCommand` tarafından)
- `assistant`: pi-agent-core'dan akışa verilen deltalar
- `tool`: pi-agent-core'dan akışa verilen araç olayları

## Sohbet kanalı işleme

- Asistan deltaları sohbet `delta` iletilerinde arabelleğe alınır.
- **Yaşam döngüsü bitiş/hata** üzerinde bir sohbet `final` yayılır.

## Zaman aşımları

- `agent.wait` varsayılanı: 30 sn (yalnızca bekleme). `timeoutMs` parametresi geçersiz kılar.
- Ajan çalışma zamanı: `agents.defaults.timeoutSeconds` varsayılanı 172800 sn'dir (48 saat); `runEmbeddedPiAgent` iptal zamanlayıcısında uygulanır.
- Cron çalışma zamanı: yalıtılmış ajan dönüşü `timeoutSeconds`, cron tarafından sahiplenilir. Zamanlayıcı bu zamanlayıcıyı yürütme başladığında başlatır, yapılandırılmış son tarihte alttaki çalıştırmayı iptal eder, ardından zaman aşımını kaydetmeden önce sınırlı temizlik çalıştırır; böylece eski bir alt oturum şeridi takılı tutamaz.
- Oturum canlılık tanılamaları: tanılamalar etkinken, `diagnostics.stuckSessionWarnMs`, gözlemlenen yanıt, araç, durum, blok veya ACP ilerlemesi olmayan uzun `processing` oturumlarını sınıflandırır. Etkin gömülü çalıştırmalar, model çağrıları ve araç çağrıları `session.long_running` olarak raporlanır; yakın zamanda ilerleme olmayan etkin iş `session.stalled` olarak raporlanır; `session.stuck`, etkin iş olmayan eski oturum defteri tutma için ayrılmıştır. Eski oturum defteri tutma, etkilenen oturum şeridini hemen serbest bırakır; takılmış gömülü çalıştırmalar yalnızca `diagnostics.stuckSessionAbortMs` sonrasında (varsayılan: en az 10 dakika ve uyarı eşiğinin 5 katı) iptal edilip boşaltılır; böylece kuyruğa alınmış iş, yalnızca yavaş olan çalıştırmaları kesmeden devam edebilir. Kurtarma, yapılandırılmış istenen/tamamlanan sonuçlar yayar ve tanılama durumu yalnızca aynı işleme nesli hâlâ güncelse boşta olarak işaretlenir. Yinelenen `session.stuck` tanılamaları, oturum değişmeden kaldığı sürece geri çekilir.
- Model boşta kalma zaman aşımı: OpenClaw, boşta kalma penceresinden önce yanıt parçaları gelmezse bir model isteğini iptal eder. `models.providers.<id>.timeoutSeconds`, yavaş yerel/kendi barındırılan sağlayıcılar için bu boşta kalma gözetleyicisini uzatır; aksi halde OpenClaw, yapılandırıldığında `agents.defaults.timeoutSeconds` kullanır ve varsayılan olarak 120 sn ile sınırlar. Açık model veya ajan zaman aşımı olmayan Cron tetiklemeli çalıştırmalar boşta kalma gözetleyicisini devre dışı bırakır ve cron dış zaman aşımına dayanır.
- Sağlayıcı HTTP isteği zaman aşımı: `models.providers.<id>.timeoutSeconds`, bağlanma, başlıklar, gövde, SDK istek zaman aşımı, toplam korumalı-fetch iptal işleme ve model akışı boşta kalma gözetleyicisi dahil olmak üzere bu sağlayıcının model HTTP fetch'leri için geçerlidir. Tüm ajan çalışma zamanı zaman aşımını yükseltmeden önce, Ollama gibi yavaş yerel/kendi barındırılan sağlayıcılar için bunu kullanın.

## İşlerin erken bitebileceği yerler

- Ajan zaman aşımı (iptal)
- AbortSignal (iptal)
- Gateway bağlantı kesilmesi veya RPC zaman aşımı
- `agent.wait` zaman aşımı (yalnızca bekleme, ajanı durdurmaz)

## İlgili

- [Araçlar](/tr/tools) — kullanılabilir ajan araçları
- [Kancalar](/tr/automation/hooks) — ajan yaşam döngüsü olaylarıyla tetiklenen olay güdümlü betikler
- [Compaction](/tr/concepts/compaction) — uzun konuşmaların nasıl özetlendiği
- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay geçitleri
- [Düşünme](/tr/tools/thinking) — düşünme/akıl yürütme düzeyi yapılandırması
