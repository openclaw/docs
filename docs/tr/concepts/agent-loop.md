---
read_when:
    - Ajan döngüsünün veya yaşam döngüsü olaylarının tam bir adım adım açıklamasına ihtiyacınız var
    - Oturum kuyruğa alma, transkript yazımları veya oturum yazma kilidi davranışını değiştiriyorsunuz
summary: Aracı döngüsü yaşam döngüsü, akışlar ve bekleme semantiği
title: Ajan döngüsü
x-i18n:
    generated_at: "2026-05-03T21:30:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bdd8e98710dce6412f499c37d2d74445f44f93142364c30993de517fdea6c56
    source_path: concepts/agent-loop.md
    workflow: 16
---

Ajan temelli döngü, bir ajanın tam “gerçek” çalışmasıdır: alım → bağlam oluşturma → model çıkarımı →
araç yürütme → akış halinde yanıtlar → kalıcılık. Bu, oturum durumunu tutarlı tutarken bir iletiyi
eylemlere ve nihai bir yanıta dönüştüren yetkili yoldur.

OpenClaw’da döngü, model düşünürken, araçları çağırırken ve çıktıyı akıtırken yaşam döngüsü ve akış olayları
yayan, oturum başına tek ve serileştirilmiş bir çalışmadır. Bu belge, bu özgün döngünün
uçtan uca nasıl bağlandığını açıklar.

## Giriş noktaları

- Gateway RPC: `agent` ve `agent.wait`.
- CLI: `agent` komutu.

## Nasıl çalışır (üst düzey)

1. `agent` RPC parametreleri doğrular, oturumu çözer (sessionKey/sessionId), oturum meta verilerini kalıcı hale getirir, hemen `{ runId, acceptedAt }` döndürür.
2. `agentCommand` ajanı çalıştırır:
   - model + düşünme/ayrıntılı/izleme varsayılanlarını çözer
   - Skills anlık görüntüsünü yükler
   - `runEmbeddedPiAgent` çağırır (pi-agent-core çalışma zamanı)
   - gömülü döngü bir tane yaymazsa **yaşam döngüsü sonu/hata** yayar
3. `runEmbeddedPiAgent`:
   - oturum başına + genel kuyruklar üzerinden çalışmaları serileştirir
   - model + kimlik doğrulama profilini çözer ve pi oturumunu oluşturur
   - pi olaylarına abone olur ve asistan/araç deltalarını akıtır
   - zaman aşımını uygular -> aşılırsa çalışmayı iptal eder
   - Codex app-server dönüşleri için, kabul edilmiş bir dönüş terminal olaydan önce app-server ilerlemesi üretmeyi durdurursa dönüşü iptal eder
   - yükler + kullanım meta verileri döndürür
4. `subscribeEmbeddedPiSession`, pi-agent-core olaylarını OpenClaw `agent` akışına köprüler:
   - araç olayları => `stream: "tool"`
   - asistan deltaları => `stream: "assistant"`
   - yaşam döngüsü olayları => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`, `waitForAgentRun` kullanır:
   - `runId` için **yaşam döngüsü sonu/hata** bekler
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` döndürür

## Kuyruğa alma + eşzamanlılık

- Çalışmalar oturum anahtarı başına (oturum hattı) ve isteğe bağlı olarak genel bir hat üzerinden serileştirilir.
- Bu, araç/oturum yarışlarını önler ve oturum geçmişini tutarlı tutar.
- Mesajlaşma kanalları, bu hat sistemini besleyen kuyruk modlarını (topla/yönlendir/takip) seçebilir.
  Bkz. [Komut Kuyruğu](/tr/concepts/queue).
- Transkript yazmaları da oturum dosyası üzerinde bir oturum yazma kilidiyle korunur. Kilit
  süreç farkındadır ve dosya tabanlıdır; bu nedenle süreç içi kuyruğu atlayan veya başka
  bir süreçten gelen yazıcıları yakalar. Oturum transkript yazıcıları, oturumu meşgul olarak
  bildirmeden önce `session.writeLock.acquireTimeoutMs` kadar bekler; varsayılan değer `60000` ms’dir.
- Oturum yazma kilitleri varsayılan olarak yeniden girilebilir değildir. Bir yardımcı, aynı kilidin
  edinimini tek bir mantıksal yazıcıyı koruyarak bilerek iç içe geçiriyorsa, açıkça
  `allowReentrant: true` ile katılmalıdır.

## Oturum + çalışma alanı hazırlığı

- Çalışma alanı çözülür ve oluşturulur; korumalı alanlı çalışmalar bir korumalı alan çalışma alanı köküne yönlendirilebilir.
- Skills yüklenir (veya bir anlık görüntüden yeniden kullanılır) ve ortama ve isteme enjekte edilir.
- Başlatma/bağlam dosyaları çözülür ve sistem istemi raporuna enjekte edilir.
- Bir oturum yazma kilidi edinilir; `SessionManager`, akış başlamadan önce açılır ve hazırlanır. Daha
  sonraki herhangi bir transkript yeniden yazma, Compaction veya kesme yolu, transkript dosyasını açmadan veya
  değiştirmeden önce aynı kilidi almalıdır.

## İstem oluşturma + sistem istemi

- Sistem istemi, OpenClaw’un temel isteminden, Skills isteminden, başlatma bağlamından ve çalışma başına geçersiz kılmalardan oluşturulur.
- Modele özgü sınırlar ve Compaction yedek belirteçleri uygulanır.
- Modelin ne gördüğü için bkz. [Sistem istemi](/tr/concepts/system-prompt).

## Kanca noktaları (nerede araya girebilirsiniz)

OpenClaw’da iki kanca sistemi vardır:

- **Dahili kancalar** (Gateway kancaları): komutlar ve yaşam döngüsü olayları için olay güdümlü betikler.
- **Plugin kancaları**: ajan/araç yaşam döngüsü ve Gateway işlem hattı içindeki uzatma noktaları.

### Dahili kancalar (Gateway kancaları)

- **`agent:bootstrap`**: sistem istemi sonlandırılmadan önce başlatma dosyaları oluşturulurken çalışır.
  Bunu başlatma bağlamı dosyaları eklemek/kaldırmak için kullanın.
- **Komut kancaları**: `/new`, `/reset`, `/stop` ve diğer komut olayları (Hooks belgesine bakın).

Kurulum ve örnekler için bkz. [Kancalar](/tr/automation/hooks).

### Plugin kancaları (ajan + Gateway yaşam döngüsü)

Bunlar ajan döngüsü veya Gateway işlem hattı içinde çalışır:

- **`before_model_resolve`**: model çözümlemeden önce sağlayıcı/modeli deterministik olarak geçersiz kılmak için oturum öncesinde çalışır (`messages` yoktur).
- **`before_prompt_build`**: istem gönderiminden önce `prependContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` enjekte etmek için oturum yüklemesinden sonra (`messages` ile) çalışır. Dönüş başına dinamik metin için `prependContext`, sistem istemi alanında durması gereken kararlı yönlendirme için sistem bağlamı alanlarını kullanın.
- **`before_agent_start`**: iki fazdan birinde çalışabilen eski uyumluluk kancasıdır; yukarıdaki açık kancaları tercih edin.
- **`before_agent_reply`**: satır içi eylemlerden sonra ve LLM çağrısından önce çalışır; bir Plugin’in dönüşü sahiplenip sentetik yanıt döndürmesine veya dönüşü tamamen susturmasına izin verir.
- **`agent_end`**: tamamlandıktan sonra nihai ileti listesini ve çalışma meta verilerini inceleyin.
- **`before_compaction` / `after_compaction`**: Compaction döngülerini gözlemleyin veya açıklama ekleyin.
- **`before_tool_call` / `after_tool_call`**: araç parametrelerine/sonuçlarına araya girin.
- **`before_install`**: yerleşik tarama bulgularını inceleyin ve isteğe bağlı olarak skill veya Plugin kurulumlarını engelleyin.
- **`tool_result_persist`**: araç sonuçlarını OpenClaw’a ait bir oturum transkriptine yazılmadan önce eşzamanlı olarak dönüştürün.
- **`message_received` / `message_sending` / `message_sent`**: gelen + giden ileti kancaları.
- **`session_start` / `session_end`**: oturum yaşam döngüsü sınırları.
- **`gateway_start` / `gateway_stop`**: Gateway yaşam döngüsü olayları.

Giden/araç korumaları için kanca karar kuralları:

- `before_tool_call`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` işlem yapmaz ve önceki bir engeli temizlemez.
- `before_install`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` işlem yapmaz ve önceki bir engeli temizlemez.
- `message_sending`: `{ cancel: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` işlem yapmaz ve önceki bir iptali temizlemez.

Kanca API’si ve kayıt ayrıntıları için bkz. [Plugin kancaları](/tr/plugins/hooks).

Çalıştırma düzenekleri bu kancaları farklı şekilde uyarlayabilir. Codex app-server çalıştırma düzeneği,
belgelenmiş yansıtılmış yüzeyler için uyumluluk sözleşmesi olarak OpenClaw Plugin kancalarını korurken,
Codex yerel kancaları ayrı, daha düşük düzeyli bir Codex mekanizması olarak kalır.

## Akış + kısmi yanıtlar

- Asistan deltaları pi-agent-core’dan akıtılır ve `assistant` olayları olarak yayılır.
- Blok akışı, kısmi yanıtları `text_end` veya `message_end` üzerinde yayabilir.
- Akıl yürütme akışı ayrı bir akış olarak veya blok yanıtları olarak yayılabilir.
- Parçalama ve blok yanıt davranışı için bkz. [Akış](/tr/concepts/streaming).

## Araç yürütme + mesajlaşma araçları

- Araç başlatma/güncelleme/son olayları `tool` akışında yayılır.
- Araç sonuçları, günlüğe kaydedilmeden/yayılmadan önce boyut ve görüntü yükleri açısından temizlenir.
- Mesajlaşma aracı gönderimleri, yinelenen asistan onaylarını bastırmak için izlenir.

## Yanıt şekillendirme + bastırma

- Nihai yükler şunlardan oluşturulur:
  - asistan metni (ve isteğe bağlı akıl yürütme)
  - satır içi araç özetleri (ayrıntılı + izin verildiğinde)
  - model hata verdiğinde asistan hata metni
- Tam sessiz belirteç `NO_REPLY` / `no_reply`, giden
  yüklerden filtrelenir.
- Mesajlaşma aracı yinelemeleri nihai yük listesinden kaldırılır.
- İşlenebilir yük kalmazsa ve bir araç hata verdiyse, yedek bir araç hatası yanıtı yayılır
  (bir mesajlaşma aracı zaten kullanıcıya görünür bir yanıt göndermediyse).

## Compaction + yeniden denemeler

- Otomatik Compaction, `compaction` akış olayları yayar ve yeniden denemeyi tetikleyebilir.
- Yeniden denemede, yinelenen çıktıyı önlemek için bellek içi arabellekler ve araç özetleri sıfırlanır.
- Compaction işlem hattı için bkz. [Compaction](/tr/concepts/compaction).

## Olay akışları (bugün)

- `lifecycle`: `subscribeEmbeddedPiSession` tarafından (ve `agentCommand` tarafından yedek olarak) yayılır
- `assistant`: pi-agent-core’dan akıtılan deltalar
- `tool`: pi-agent-core’dan akıtılan araç olayları

## Sohbet kanalı işleme

- Asistan deltaları sohbet `delta` iletilerine arabelleğe alınır.
- **Yaşam döngüsü sonu/hata** üzerinde bir sohbet `final` yayılır.

## Zaman aşımları

- `agent.wait` varsayılanı: 30 sn (yalnızca bekleme). `timeoutMs` parametresi geçersiz kılar.
- Ajan çalışma zamanı: `agents.defaults.timeoutSeconds` varsayılanı 172800 sn’dir (48 saat); `runEmbeddedPiAgent` iptal zamanlayıcısında uygulanır.
- Cron çalışma zamanı: yalıtılmış ajan dönüşü `timeoutSeconds` değerinin sahibi Cron’dur. Zamanlayıcı bu zamanlayıcıyı yürütme başladığında başlatır, yapılandırılmış son tarihte alttaki çalışmayı iptal eder, ardından zaman aşımını kaydetmeden önce sınırlı temizlik çalıştırır; böylece eski bir alt oturum hattı takılı tutamaz.
- Oturum canlılık tanılamaları: tanılamalar etkinken, `diagnostics.stuckSessionWarnMs`, gözlemlenen yanıt, araç, durum, blok veya ACP ilerlemesi olmayan uzun `processing` oturumlarını sınıflandırır. Etkin gömülü çalışmalar, model çağrıları ve araç çağrıları `session.long_running` olarak bildirilir; yakın zamanda ilerleme olmayan etkin çalışma `session.stalled` olarak bildirilir; `session.stuck` etkin çalışma olmadan eski oturum kayıt tutma için ayrılmıştır. Eski oturum kayıt tutma, etkilenen oturum hattını hemen serbest bırakır; durmuş gömülü çalışmalar, kuyruğa alınmış işlerin yalnızca yavaş olan çalışmaları kesmeden devam edebilmesi için yalnızca uzatılmış ilerlemesizlik penceresinden sonra (en az 10 dakika ve uyarı eşiğinin 5 katı) iptal edilip boşaltılır. Yinelenen `session.stuck` tanılamaları, oturum değişmeden kaldığı sürece geri çekilir.
- Model boşta kalma zaman aşımı: OpenClaw, boşta kalma penceresinden önce hiçbir yanıt parçası gelmezse model isteğini iptal eder. `models.providers.<id>.timeoutSeconds`, yavaş yerel/kendi barındırılan sağlayıcılar için bu boşta kalma bekçisini uzatır; aksi takdirde OpenClaw yapılandırıldığında `agents.defaults.timeoutSeconds` kullanır ve varsayılan olarak 120 sn ile sınırlar. Açık model veya ajan zaman aşımı olmayan Cron tetikli çalışmalar boşta kalma bekçisini devre dışı bırakır ve Cron dış zaman aşımına dayanır.
- Sağlayıcı HTTP isteği zaman aşımı: `models.providers.<id>.timeoutSeconds`, bağlantı, başlıklar, gövde, SDK isteği zaman aşımı, toplam korumalı getirme iptal işleme ve model akışı boşta kalma bekçisi dahil olmak üzere o sağlayıcının model HTTP getirmelerine uygulanır. Bunu, tüm ajan çalışma zamanı zaman aşımını yükseltmeden önce Ollama gibi yavaş yerel/kendi barındırılan sağlayıcılar için kullanın.

## İşlerin erken bitebileceği yerler

- Ajan zaman aşımı (iptal)
- AbortSignal (iptal)
- Gateway bağlantı kesilmesi veya RPC zaman aşımı
- `agent.wait` zaman aşımı (yalnızca bekleme, ajanı durdurmaz)

## İlgili

- [Araçlar](/tr/tools) — kullanılabilir ajan araçları
- [Kancalar](/tr/automation/hooks) — ajan yaşam döngüsü olayları tarafından tetiklenen olay güdümlü betikler
- [Compaction](/tr/concepts/compaction) — uzun konuşmaların nasıl özetlendiği
- [Yürütme Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Düşünme](/tr/tools/thinking) — düşünme/akıl yürütme düzeyi yapılandırması
