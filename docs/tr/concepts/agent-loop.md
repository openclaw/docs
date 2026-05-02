---
read_when:
    - Aracı döngüsü veya yaşam döngüsü olayları için tam bir adım adım anlatıma ihtiyacınız var
    - Oturum kuyruğa alma, transkript yazımları veya oturum yazma kilidi davranışını değiştiriyorsunuz
summary: Ajan döngüsünün yaşam döngüsü, akışları ve bekleme semantiği
title: Ajan döngüsü
x-i18n:
    generated_at: "2026-05-02T20:43:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39c49e8c5d1e380e0569e31856d855484d5a8fa33b04cf85cccde4c9ac21fbe7
    source_path: concepts/agent-loop.md
    workflow: 16
---

Aracılı döngü, bir ajanın tam “gerçek” çalışmasıdır: alım → bağlam birleştirme → model çıkarımı →
araç yürütme → akışlı yanıtlar → kalıcılık. Bir mesajı eylemlere ve nihai yanıta dönüştüren,
oturum durumunu tutarlı tutan yetkili yoldur.

OpenClaw’da döngü, model düşünürken, araçları çağırırken ve çıktıyı akış olarak verirken yaşam döngüsü ve akış olayları yayan, oturum başına tek ve serileştirilmiş bir çalışmadır. Bu belge, bu özgün döngünün uçtan uca nasıl bağlandığını açıklar.

## Giriş noktaları

- Gateway RPC: `agent` ve `agent.wait`.
- CLI: `agent` komutu.

## Nasıl çalışır (üst düzey)

1. `agent` RPC parametreleri doğrular, oturumu çözer (sessionKey/sessionId), oturum meta verilerini kalıcı hale getirir, hemen `{ runId, acceptedAt }` döndürür.
2. `agentCommand` ajanı çalıştırır:
   - model + düşünme/ayrıntılı/izleme varsayılanlarını çözer
   - Skills anlık görüntüsünü yükler
   - `runEmbeddedPiAgent` çağırır (pi-agent-core çalışma zamanı)
   - gömülü döngü bir tane yaymazsa **yaşam döngüsü bitiş/hata** yayar
3. `runEmbeddedPiAgent`:
   - çalışmaları oturum başına + genel kuyruklar üzerinden serileştirir
   - model + kimlik doğrulama profilini çözer ve Pi oturumunu oluşturur
   - Pi olaylarına abone olur ve asistan/araç deltalarını akış olarak verir
   - zaman aşımını uygular -> aşılırsa çalışmayı iptal eder
   - Codex app-server dönüşleri için, kabul edilmiş bir dönüş terminal olaydan önce app-server ilerlemesi üretmeyi durdurursa onu iptal eder
   - yükleri + kullanım meta verilerini döndürür
4. `subscribeEmbeddedPiSession`, pi-agent-core olaylarını OpenClaw `agent` akışına köprüler:
   - araç olayları => `stream: "tool"`
   - asistan deltaları => `stream: "assistant"`
   - yaşam döngüsü olayları => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`, `waitForAgentRun` kullanır:
   - `runId` için **yaşam döngüsü bitiş/hata** bekler
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` döndürür

## Kuyruğa alma + eşzamanlılık

- Çalışmalar oturum anahtarı başına (oturum hattı) ve isteğe bağlı olarak genel bir hat üzerinden serileştirilir.
- Bu, araç/oturum yarışlarını önler ve oturum geçmişini tutarlı tutar.
- Mesajlaşma kanalları, bu hat sistemini besleyen kuyruk modlarını (collect/steer/followup) seçebilir.
  Bkz. [Komut Kuyruğu](/tr/concepts/queue).
- Transkript yazmaları, oturum dosyasındaki bir oturum yazma kilidiyle de korunur. Kilit,
  süreç farkındalığına sahip ve dosya tabanlıdır; bu nedenle süreç içi kuyruğu atlayan veya
  başka bir süreçten gelen yazarları yakalar. Oturum transkript yazarları, oturumu meşgul olarak
  bildirmeden önce `session.writeLock.acquireTimeoutMs` kadar bekler; varsayılan `60000` ms’dir.
- Oturum yazma kilitleri varsayılan olarak yeniden girilebilir değildir. Bir yardımcı, tek bir mantıksal yazarı korurken
  aynı kilidin edinimini bilinçli olarak iç içe geçiriyorsa, `allowReentrant: true` ile bunu açıkça seçmelidir.

## Oturum + çalışma alanı hazırlığı

- Çalışma alanı çözümlenir ve oluşturulur; korumalı alan çalışmaları bir korumalı alan çalışma alanı köküne yönlendirilebilir.
- Skills yüklenir (veya bir anlık görüntüden yeniden kullanılır) ve env ile isteme enjekte edilir.
- Önyükleme/bağlam dosyaları çözümlenir ve sistem istemi raporuna enjekte edilir.
- Bir oturum yazma kilidi alınır; `SessionManager` akıştan önce açılır ve hazırlanır. Daha sonraki herhangi bir
  transkript yeniden yazma, Compaction veya kırpma yolu, transkript dosyasını açmadan veya
  değiştirmeden önce aynı kilidi almalıdır.

## İstem birleştirme + sistem istemi

- Sistem istemi OpenClaw’ın temel isteminden, Skills isteminden, önyükleme bağlamından ve çalışma başına geçersiz kılmalardan oluşturulur.
- Modele özgü sınırlar ve Compaction yedek belirteçleri uygulanır.
- Modelin ne gördüğü için bkz. [Sistem istemi](/tr/concepts/system-prompt).

## Kanca noktaları (nerede araya girebilirsiniz)

OpenClaw’da iki kanca sistemi vardır:

- **Dahili kancalar** (Gateway kancaları): komutlar ve yaşam döngüsü olayları için olay güdümlü betikler.
- **Plugin kancaları**: ajan/araç yaşam döngüsü ve gateway hattı içindeki genişletme noktaları.

### Dahili kancalar (Gateway kancaları)

- **`agent:bootstrap`**: sistem istemi sonlandırılmadan önce önyükleme dosyaları oluşturulurken çalışır.
  Bunu önyükleme bağlam dosyaları eklemek/kaldırmak için kullanın.
- **Komut kancaları**: `/new`, `/reset`, `/stop` ve diğer komut olayları (bkz. Kancalar belgesi).

Kurulum ve örnekler için bkz. [Kancalar](/tr/automation/hooks).

### Plugin kancaları (ajan + gateway yaşam döngüsü)

Bunlar ajan döngüsü veya gateway hattı içinde çalışır:

- **`before_model_resolve`**: model çözümlemeden önce sağlayıcı/modeli deterministik olarak geçersiz kılmak için oturum öncesinde çalışır (`messages` yok).
- **`before_prompt_build`**: istem gönderiminden önce `prependContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` enjekte etmek için oturum yüklemesinden sonra (`messages` ile) çalışır. Dönüş başına dinamik metin için `prependContext`, sistem istemi alanında durması gereken kararlı yönlendirme için sistem bağlamı alanlarını kullanın.
- **`before_agent_start`**: iki aşamadan birinde çalışabilen eski uyumluluk kancası; yukarıdaki açık kancaları tercih edin.
- **`before_agent_reply`**: satır içi eylemlerden sonra ve LLM çağrısından önce çalışır; bir Plugin’in dönüşü üstlenip sentetik bir yanıt döndürmesine veya dönüşü tamamen sessize almasına izin verir.
- **`agent_end`**: tamamlanmadan sonra nihai mesaj listesini ve çalışma meta verilerini inceler.
- **`before_compaction` / `after_compaction`**: Compaction döngülerini gözlemler veya açıklama ekler.
- **`before_tool_call` / `after_tool_call`**: araç parametrelerine/sonuçlarına araya girer.
- **`before_install`**: yerleşik tarama bulgularını inceler ve isteğe bağlı olarak Skill veya Plugin kurulumlarını engeller.
- **`tool_result_persist`**: araç sonuçları OpenClaw’a ait bir oturum transkriptine yazılmadan önce bunları eşzamanlı olarak dönüştürür.
- **`message_received` / `message_sending` / `message_sent`**: gelen + giden mesaj kancaları.
- **`session_start` / `session_end`**: oturum yaşam döngüsü sınırları.
- **`gateway_start` / `gateway_stop`**: gateway yaşam döngüsü olayları.

Giden/araç korumaları için kanca karar kuralları:

- `before_tool_call`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` işlem yapmaz ve önceki bir engeli temizlemez.
- `before_install`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` işlem yapmaz ve önceki bir engeli temizlemez.
- `message_sending`: `{ cancel: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` işlem yapmaz ve önceki bir iptali temizlemez.

Kanca API’si ve kayıt ayrıntıları için bkz. [Plugin kancaları](/tr/plugins/hooks).

Test düzenekleri bu kancaları farklı şekilde uyarlayabilir. Codex app-server test düzeneği, belgelenmiş yansıtılmış
yüzeyler için OpenClaw Plugin kancalarını uyumluluk sözleşmesi olarak tutarken, Codex yerel kancaları ayrı bir alt düzey Codex mekanizması olarak kalır.

## Akış + kısmi yanıtlar

- Asistan deltaları pi-agent-core’dan akış olarak alınır ve `assistant` olayları olarak yayılır.
- Blok akışı, kısmi yanıtları `text_end` veya `message_end` üzerinde yayabilir.
- Akıl yürütme akışı ayrı bir akış olarak veya blok yanıtları olarak yayılabilir.
- Parçalama ve blok yanıt davranışı için bkz. [Akış](/tr/concepts/streaming).

## Araç yürütme + mesajlaşma araçları

- Araç başlatma/güncelleme/bitiş olayları `tool` akışında yayılır.
- Araç sonuçları günlüğe yazılmadan/yayılmadan önce boyut ve görüntü yükleri açısından temizlenir.
- Mesajlaşma aracı gönderimleri, yinelenen asistan onaylarını bastırmak için izlenir.

## Yanıt biçimlendirme + bastırma

- Nihai yükler şunlardan birleştirilir:
  - asistan metni (ve isteğe bağlı akıl yürütme)
  - satır içi araç özetleri (ayrıntılı + izin verildiğinde)
  - model hata verdiğinde asistan hata metni
- Tam sessiz belirteç `NO_REPLY` / `no_reply`, giden
  yüklerden filtrelenir.
- Mesajlaşma aracı yinelemeleri nihai yük listesinden kaldırılır.
- İşlenebilir yük kalmazsa ve bir araç hata verdiyse, yedek bir araç hata yanıtı yayılır
  (bir mesajlaşma aracı zaten kullanıcıya görünür bir yanıt göndermediyse).

## Compaction + yeniden denemeler

- Otomatik Compaction, `compaction` akış olayları yayar ve yeniden denemeyi tetikleyebilir.
- Yeniden denemede, yinelenen çıktıyı önlemek için bellek içi tamponlar ve araç özetleri sıfırlanır.
- Compaction hattı için bkz. [Compaction](/tr/concepts/compaction).

## Olay akışları (bugün)

- `lifecycle`: `subscribeEmbeddedPiSession` tarafından yayılır (ve `agentCommand` tarafından yedek olarak)
- `assistant`: pi-agent-core’dan akışlı deltalar
- `tool`: pi-agent-core’dan akışlı araç olayları

## Sohbet kanalı işleme

- Asistan deltaları sohbet `delta` mesajlarında tamponlanır.
- **Yaşam döngüsü bitiş/hata** üzerinde bir sohbet `final` yayılır.

## Zaman aşımları

- `agent.wait` varsayılanı: 30 sn (yalnızca bekleme). `timeoutMs` parametresi geçersiz kılar.
- Ajan çalışma zamanı: `agents.defaults.timeoutSeconds` varsayılanı 172800 sn (48 saat); `runEmbeddedPiAgent` iptal zamanlayıcısında uygulanır.
- Cron çalışma zamanı: yalıtılmış ajan dönüşü `timeoutSeconds`, Cron tarafından sahiplenilir. Zamanlayıcı bu zamanlayıcıyı yürütme başladığında başlatır, yapılandırılmış son tarihte alttaki çalışmayı iptal eder, ardından zaman aşımını kaydetmeden önce sınırlı temizlik çalıştırır; böylece bayat bir alt oturum hattı takılı tutamaz.
- Oturum canlılık tanıları: tanılar etkinleştirildiğinde, `diagnostics.stuckSessionWarnMs` gözlemlenen yanıt, araç, durum, blok veya ACP ilerlemesi olmayan uzun `processing` oturumlarını sınıflandırır. Etkin gömülü çalışmalar, model çağrıları ve araç çağrıları `session.long_running` olarak raporlanır; yakın zamanda ilerleme göstermeyen etkin çalışma `session.stalled` olarak raporlanır; `session.stuck` etkin çalışma olmayan bayat oturum kayıtları için ayrılmıştır ve yalnızca bu yol, etkilenen oturum hattını serbest bırakarak kuyruktaki başlatma işinin boşalmasını sağlar. Yinelenen `session.stuck` tanıları, oturum değişmeden kaldığı sürece geri çekilir.
- Model boşta kalma zaman aşımı: OpenClaw, boşta kalma penceresi içinde yanıt parçaları gelmezse bir model isteğini iptal eder. `models.providers.<id>.timeoutSeconds`, yavaş yerel/kendi barındırılan sağlayıcılar için bu boşta bekleme gözcüsünü uzatır; aksi halde OpenClaw yapılandırıldığında `agents.defaults.timeoutSeconds` kullanır ve varsayılan olarak 120 sn ile sınırlar. Açık model veya ajan zaman aşımı olmayan Cron tetiklemeli çalışmalar, boşta bekleme gözcüsünü devre dışı bırakır ve Cron dış zaman aşımına güvenir.
- Sağlayıcı HTTP isteği zaman aşımı: `models.providers.<id>.timeoutSeconds`, bağlantı, üstbilgiler, gövde, SDK isteği zaman aşımı, toplam korumalı-fetch iptal işleme ve model akışı boşta bekleme gözcüsü dahil olmak üzere ilgili sağlayıcının model HTTP getirmelerine uygulanır. Tüm ajan çalışma zamanı zaman aşımını yükseltmeden önce Ollama gibi yavaş yerel/kendi barındırılan sağlayıcılar için bunu kullanın.

## İşlerin erken bitebileceği yerler

- Ajan zaman aşımı (iptal)
- AbortSignal (iptal)
- Gateway bağlantı kesilmesi veya RPC zaman aşımı
- `agent.wait` zaman aşımı (yalnızca bekleme, ajanı durdurmaz)

## İlgili

- [Araçlar](/tr/tools) — kullanılabilir ajan araçları
- [Kancalar](/tr/automation/hooks) — ajan yaşam döngüsü olayları tarafından tetiklenen olay güdümlü betikler
- [Compaction](/tr/concepts/compaction) — uzun konuşmaların nasıl özetlendiği
- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Düşünme](/tr/tools/thinking) — düşünme/akıl yürütme düzeyi yapılandırması
