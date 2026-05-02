---
read_when:
    - Ajan döngüsü veya yaşam döngüsü olayları için eksiksiz bir adım adım kılavuza ihtiyacınız var
    - Oturum kuyruğa alma, transkript yazımları veya oturum yazma kilidi davranışını değiştiriyorsunuz
summary: Ajan döngüsü yaşam döngüsü, akışlar ve bekleme semantiği
title: Ajan döngüsü
x-i18n:
    generated_at: "2026-05-02T08:51:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4182cf13d43a111a94014d695dee4b1e7385dd3b928b16e2072bd24189256b49
    source_path: concepts/agent-loop.md
    workflow: 16
---

Ajan tabanlı döngü, bir ajanın tam “gerçek” çalışmasıdır: alım → bağlam derleme → model çıkarımı →
araç yürütme → akış yanıtları → kalıcılık. Bir mesajı eylemlere
ve son yanıta dönüştüren, oturum durumunu tutarlı tutan yetkili yoldur.

OpenClaw’da döngü, model düşünürken, araçları çağırırken ve çıktı akışı üretirken yaşam döngüsü ve akış olayları
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
   - `runEmbeddedPiAgent` (pi-agent-core çalışma zamanı) çağrısını yapar
   - gömülü döngü bir tane yaymazsa **yaşam döngüsü sonu/hatası** yayar
3. `runEmbeddedPiAgent`:
   - çalışmaları oturum başına + global kuyruklar üzerinden serileştirir
   - model + kimlik doğrulama profilini çözer ve pi oturumunu oluşturur
   - pi olaylarına abone olur ve asistan/araç deltalarını akıtır
   - zaman aşımını uygular -> süre aşılırsa çalışmayı iptal eder
   - Codex app-server dönüşleri için, terminal olaydan önce app-server ilerlemesi üretmeyi bırakan kabul edilmiş bir dönüşü iptal eder
   - yükleri + kullanım meta verilerini döndürür
4. `subscribeEmbeddedPiSession`, pi-agent-core olaylarını OpenClaw `agent` akışına köprüler:
   - araç olayları => `stream: "tool"`
   - asistan deltaları => `stream: "assistant"`
   - yaşam döngüsü olayları => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`, `waitForAgentRun` kullanır:
   - `runId` için **yaşam döngüsü sonu/hatasını** bekler
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` döndürür

## Kuyruğa alma + eşzamanlılık

- Çalışmalar oturum anahtarı başına (oturum hattı) ve isteğe bağlı olarak global bir hat üzerinden serileştirilir.
- Bu, araç/oturum yarışlarını önler ve oturum geçmişini tutarlı tutar.
- Mesajlaşma kanalları, bu hat sistemini besleyen kuyruk modlarını (collect/steer/followup) seçebilir.
  Bkz. [Komut Kuyruğu](/tr/concepts/queue).
- Transkript yazmaları da oturum dosyası üzerindeki bir oturum yazma kilidiyle korunur. Kilit
  süreç farkındalığına sahip ve dosya tabanlıdır; bu nedenle süreç içi kuyruğu atlayan veya
  başka bir süreçten gelen yazıcıları yakalar.
- Oturum yazma kilitleri varsayılan olarak yeniden girişli değildir. Bir yardımcı, tek bir mantıksal yazıcıyı
  korurken aynı kilidin edinimini kasıtlı olarak iç içe geçirirse,
  `allowReentrant: true` ile açıkça katılmalıdır.

## Oturum + çalışma alanı hazırlığı

- Çalışma alanı çözülür ve oluşturulur; sandbox çalışmaları bir sandbox çalışma alanı köküne yönlendirilebilir.
- Skills yüklenir (veya bir anlık görüntüden yeniden kullanılır) ve ortama ve isteme enjekte edilir.
- Önyükleme/bağlam dosyaları çözülür ve sistem istemi raporuna enjekte edilir.
- Bir oturum yazma kilidi edinilir; `SessionManager`, akıştan önce açılır ve hazırlanır. Daha sonraki herhangi bir
  transkript yeniden yazma, Compaction veya kırpma yolu, transkript dosyasını açmadan veya
  değiştirmeden önce aynı kilidi almalıdır.

## İstem derleme + sistem istemi

- Sistem istemi, OpenClaw’ın temel isteminden, Skills isteminden, önyükleme bağlamından ve çalışma başına geçersiz kılmalardan oluşturulur.
- Modele özgü sınırlar ve Compaction ayrılmış token’ları uygulanır.
- Modelin ne gördüğü için bkz. [Sistem istemi](/tr/concepts/system-prompt).

## Hook noktaları (nerede araya girebilirsiniz)

OpenClaw’ın iki hook sistemi vardır:

- **Dahili hook’lar** (Gateway hook’ları): komutlar ve yaşam döngüsü olayları için olay güdümlü betikler.
- **Plugin hook’ları**: ajan/araç yaşam döngüsü ve gateway işlem hattı içindeki genişletme noktaları.

### Dahili hook’lar (Gateway hook’ları)

- **`agent:bootstrap`**: sistem istemi sonlandırılmadan önce önyükleme dosyaları oluşturulurken çalışır.
  Bunu, önyükleme bağlam dosyaları eklemek/kaldırmak için kullanın.
- **Komut hook’ları**: `/new`, `/reset`, `/stop` ve diğer komut olayları (bkz. Hooks belgesi).

Kurulum ve örnekler için bkz. [Hooks](/tr/automation/hooks).

### Plugin hook’ları (ajan + gateway yaşam döngüsü)

Bunlar ajan döngüsü veya gateway işlem hattı içinde çalışır:

- **`before_model_resolve`**: model çözümlemesinden önce sağlayıcıyı/modeli deterministik olarak geçersiz kılmak için oturum öncesinde çalışır (`messages` yok).
- **`before_prompt_build`**: istem gönderiminden önce `prependContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` enjekte etmek için oturum yüklemesinden sonra (`messages` ile) çalışır. Dönüş başına dinamik metin için `prependContext`, sistem istemi alanında durması gereken kararlı yönlendirme için sistem bağlamı alanlarını kullanın.
- **`before_agent_start`**: iki aşamadan birinde çalışabilecek eski uyumluluk hook’u; yukarıdaki açık hook’ları tercih edin.
- **`before_agent_reply`**: satır içi eylemlerden sonra ve LLM çağrısından önce çalışır; bir Plugin’in dönüşü sahiplenip sentetik bir yanıt döndürmesine veya dönüşü tamamen susturmasına izin verir.
- **`agent_end`**: tamamlandıktan sonra son mesaj listesini ve çalışma meta verilerini inceleyin.
- **`before_compaction` / `after_compaction`**: Compaction döngülerini gözlemleyin veya notlandırın.
- **`before_tool_call` / `after_tool_call`**: araç parametrelerini/sonuçlarını araya girerek yakalayın.
- **`before_install`**: yerleşik tarama bulgularını inceleyin ve isteğe bağlı olarak skill veya Plugin kurulumlarını engelleyin.
- **`tool_result_persist`**: araç sonuçlarını OpenClaw’a ait bir oturum transkriptine yazılmadan önce eşzamanlı olarak dönüştürür.
- **`message_received` / `message_sending` / `message_sent`**: gelen + giden mesaj hook’ları.
- **`session_start` / `session_end`**: oturum yaşam döngüsü sınırları.
- **`gateway_start` / `gateway_stop`**: gateway yaşam döngüsü olayları.

Giden/araç korumaları için hook karar kuralları:

- `before_tool_call`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` işlem yapmaz ve önceki bir engeli temizlemez.
- `before_install`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` işlem yapmaz ve önceki bir engeli temizlemez.
- `message_sending`: `{ cancel: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` işlem yapmaz ve önceki bir iptali temizlemez.

Hook API’si ve kayıt ayrıntıları için bkz. [Plugin hook’ları](/tr/plugins/hooks).

Harness’lar bu hook’ları farklı şekilde uyarlayabilir. Codex app-server harness’ı,
belgelenmiş yansıtılmış yüzeyler için uyumluluk sözleşmesi olarak OpenClaw Plugin hook’larını korurken,
Codex yerel hook’ları ayrı, daha düşük seviyeli bir Codex mekanizması olarak kalır.

## Akış + kısmi yanıtlar

- Asistan deltaları pi-agent-core’dan akıtılır ve `assistant` olayları olarak yayılır.
- Blok akışı, kısmi yanıtları `text_end` veya `message_end` üzerinde yayabilir.
- Akıl yürütme akışı, ayrı bir akış olarak veya blok yanıtları olarak yayılabilir.
- Parçalama ve blok yanıt davranışı için bkz. [Akış](/tr/concepts/streaming).

## Araç yürütme + mesajlaşma araçları

- Araç başlatma/güncelleme/son olayları `tool` akışında yayılır.
- Araç sonuçları günlüklenmeden/yayılmadan önce boyut ve görüntü yükleri açısından temizlenir.
- Mesajlaşma aracı gönderimleri, yinelenen asistan onaylarını bastırmak için izlenir.

## Yanıt şekillendirme + bastırma

- Son yükler şunlardan derlenir:
  - asistan metni (ve isteğe bağlı akıl yürütme)
  - satır içi araç özetleri (ayrıntılı + izinliyse)
  - model hata verdiğinde asistan hata metni
- Tam sessiz token `NO_REPLY` / `no_reply`, giden
  yüklerden filtrelenir.
- Mesajlaşma aracı yinelemeleri son yük listesinden kaldırılır.
- İşlenebilir yük kalmazsa ve bir araç hata verdiyse, yedek bir araç hata yanıtı yayılır
  (bir mesajlaşma aracı zaten kullanıcıya görünür bir yanıt göndermediyse).

## Compaction + yeniden denemeler

- Otomatik Compaction, `compaction` akış olayları yayar ve yeniden denemeyi tetikleyebilir.
- Yeniden denemede, yinelenen çıktıyı önlemek için bellek içi tamponlar ve araç özetleri sıfırlanır.
- Compaction işlem hattı için bkz. [Compaction](/tr/concepts/compaction).

## Olay akışları (bugün)

- `lifecycle`: `subscribeEmbeddedPiSession` tarafından yayılır (ve `agentCommand` tarafından yedek olarak)
- `assistant`: pi-agent-core’dan akıtılan deltalar
- `tool`: pi-agent-core’dan akıtılan araç olayları

## Sohbet kanalı işleme

- Asistan deltaları sohbet `delta` mesajlarında tamponlanır.
- **yaşam döngüsü sonu/hatası** üzerinde bir sohbet `final` yayılır.

## Zaman aşımları

- `agent.wait` varsayılanı: 30 sn (yalnızca bekleme). `timeoutMs` parametresi geçersiz kılar.
- Ajan çalışma zamanı: `agents.defaults.timeoutSeconds` varsayılanı 172800 sn (48 saat); `runEmbeddedPiAgent` iptal zamanlayıcısında uygulanır.
- Cron çalışma zamanı: yalıtılmış ajan dönüşü `timeoutSeconds`, cron tarafından sahiplenilir. Zamanlayıcı bu zamanlayıcıyı yürütme başladığında başlatır, yapılandırılmış son tarihte alttaki çalışmayı iptal eder, ardından zaman aşımını kaydetmeden önce sınırlı temizlik çalıştırır; böylece eski bir alt oturum hattı takılı tutamaz.
- Oturum canlılığı tanıları: tanılar etkinleştirildiğinde, `diagnostics.stuckSessionWarnMs` gözlemlenen yanıt, araç, durum, blok veya ACP ilerlemesi olmayan uzun `processing` oturumlarını sınıflandırır. Etkin gömülü çalışmalar, model çağrıları ve araç çağrıları `session.long_running` olarak bildirilir; yakın zamanda ilerleme olmayan etkin çalışma `session.stalled` olarak bildirilir; `session.stuck`, etkin çalışma olmayan eski oturum kayıt tutma durumları için ayrılmıştır ve yalnızca bu yol, kuyruğa alınmış başlangıç çalışmasının akabilmesi için etkilenen oturum hattını serbest bırakır. Yinelenen `session.stuck` tanıları, oturum değişmeden kaldığı sürece geri çekilir.
- Model boşta kalma zaman aşımı: OpenClaw, boşta kalma penceresinden önce yanıt parçaları gelmezse bir model isteğini iptal eder. `models.providers.<id>.timeoutSeconds`, yavaş yerel/kendi barındırılan sağlayıcılar için bu boşta kalma gözcüsünü uzatır; aksi takdirde OpenClaw, yapılandırıldığında `agents.defaults.timeoutSeconds` kullanır ve varsayılan olarak 120 sn ile sınırlar. Açık model veya ajan zaman aşımı olmayan Cron tetikli çalışmalar, boşta kalma gözcüsünü devre dışı bırakır ve cron dış zaman aşımına güvenir.
- Sağlayıcı HTTP isteği zaman aşımı: `models.providers.<id>.timeoutSeconds`, bağlantı, başlıklar, gövde, SDK istek zaman aşımı, toplam korumalı fetch iptal işleme ve model akışı boşta kalma gözcüsü dahil olmak üzere o sağlayıcının model HTTP fetch’lerine uygulanır. Tüm ajan çalışma zamanı zaman aşımını yükseltmeden önce bunu Ollama gibi yavaş yerel/kendi barındırılan sağlayıcılar için kullanın.

## İşlerin erken bitebileceği yerler

- Ajan zaman aşımı (iptal)
- AbortSignal (iptal)
- Gateway bağlantı kesilmesi veya RPC zaman aşımı
- `agent.wait` zaman aşımı (yalnızca bekleme, ajanı durdurmaz)

## İlgili

- [Araçlar](/tr/tools) — kullanılabilir ajan araçları
- [Hooks](/tr/automation/hooks) — ajan yaşam döngüsü olayları tarafından tetiklenen olay güdümlü betikler
- [Compaction](/tr/concepts/compaction) — uzun konuşmaların nasıl özetlendiği
- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Düşünme](/tr/tools/thinking) — düşünme/akıl yürütme düzeyi yapılandırması
