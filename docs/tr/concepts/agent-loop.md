---
read_when:
    - Ajan döngüsünün veya yaşam döngüsü olaylarının tam bir adım adım açıklamasına ihtiyacınız var
    - Oturum kuyruklamasını, transkript yazımlarını veya oturum yazma kilidi davranışını değiştiriyorsunuz
summary: Ajan döngüsünün yaşam döngüsü, akışları ve bekleme semantiği
title: Ajan döngüsü
x-i18n:
    generated_at: "2026-04-30T09:15:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 902d543bd71dd517a810d825cbe92e244fe89230f47eeada72477c657a2bec32
    source_path: concepts/agent-loop.md
    workflow: 16
---

Ajan döngüsü, bir ajanın tam “gerçek” çalışmasıdır: alım → bağlam oluşturma → model çıkarımı →
araç yürütme → akış yanıtları → kalıcılaştırma. Bir iletiyi eylemlere ve son yanıta dönüştüren,
oturum durumunu tutarlı tutan kanonik yoldur.

OpenClaw’da döngü, oturum başına tekil ve serileştirilmiş bir çalışmadır; model düşünürken,
araçları çağırırken ve çıktı akışı üretirken yaşam döngüsü ve akış olayları yayar. Bu belge, bu
özgün döngünün uçtan uca nasıl bağlandığını açıklar.

## Giriş noktaları

- Gateway RPC: `agent` ve `agent.wait`.
- CLI: `agent` komutu.

## Nasıl çalışır (üst düzey)

1. `agent` RPC parametreleri doğrular, oturumu çözümler (sessionKey/sessionId), oturum üst verilerini kalıcılaştırır, hemen `{ runId, acceptedAt }` döndürür.
2. `agentCommand` ajanı çalıştırır:
   - model + thinking/verbose/trace varsayılanlarını çözümler
   - Skills anlık görüntüsünü yükler
   - `runEmbeddedPiAgent` çağırır (pi-agent-core runtime)
   - gömülü döngü bir tane yaymazsa **yaşam döngüsü end/error** yayar
3. `runEmbeddedPiAgent`:
   - çalışmaları oturum başına + küresel kuyruklar üzerinden serileştirir
   - model + kimlik doğrulama profilini çözümler ve pi oturumunu oluşturur
   - pi olaylarına abone olur ve asistan/araç deltalarını akış olarak iletir
   - zaman aşımını uygular -> süre aşılırsa çalışmayı durdurur
   - yükleri + kullanım üst verilerini döndürür
4. `subscribeEmbeddedPiSession`, pi-agent-core olaylarını OpenClaw `agent` akışına köprüler:
   - araç olayları => `stream: "tool"`
   - asistan deltaları => `stream: "assistant"`
   - yaşam döngüsü olayları => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`, `waitForAgentRun` kullanır:
   - `runId` için **yaşam döngüsü end/error** bekler
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` döndürür

## Kuyruğa alma + eşzamanlılık

- Çalışmalar oturum anahtarı başına (oturum hattı) ve isteğe bağlı olarak küresel bir hat üzerinden serileştirilir.
- Bu, araç/oturum yarışlarını önler ve oturum geçmişini tutarlı tutar.
- Mesajlaşma kanalları bu hat sistemini besleyen kuyruk modlarını (collect/steer/followup) seçebilir.
  Bkz. [Komut Kuyruğu](/tr/concepts/queue).
- Transkript yazımları da oturum dosyasında bir oturum yazma kilidiyle korunur. Kilit süreç duyarlı
  ve dosya tabanlıdır; bu yüzden süreç içi kuyruğu atlayan ya da başka bir süreçten gelen yazıcıları
  yakalar.
- Oturum yazma kilitleri varsayılan olarak yeniden girilebilir değildir. Bir yardımcı aynı kilidin
  edinimini, tek bir mantıksal yazıcıyı koruyarak bilinçli şekilde iç içe geçiriyorsa, açıkça
  `allowReentrant: true` ile buna dahil olmalıdır.

## Oturum + çalışma alanı hazırlığı

- Çalışma alanı çözümlenir ve oluşturulur; sandbox içindeki çalışmalar bir sandbox çalışma alanı köküne yönlendirilebilir.
- Skills yüklenir (veya bir anlık görüntüden yeniden kullanılır) ve ortama ve isteme enjekte edilir.
- Bootstrap/bağlam dosyaları çözümlenir ve sistem istemi raporuna enjekte edilir.
- Bir oturum yazma kilidi edinilir; `SessionManager` açılır ve akıştan önce hazırlanır. Daha sonraki
  herhangi bir transkript yeniden yazma, Compaction veya kırpma yolu, transkript dosyasını açmadan
  ya da değiştirmeden önce aynı kilidi almalıdır.

## İstem oluşturma + sistem istemi

- Sistem istemi; OpenClaw’ın temel isteminden, Skills isteminden, bootstrap bağlamından ve çalışma başına geçersiz kılmalardan oluşturulur.
- Modele özgü sınırlar ve Compaction için ayrılmış tokenlar uygulanır.
- Modelin ne gördüğü için bkz. [Sistem istemi](/tr/concepts/system-prompt).

## Hook noktaları (nerede araya girebilirsiniz)

OpenClaw’da iki hook sistemi vardır:

- **Dahili hook’lar** (Gateway hook’ları): komutlar ve yaşam döngüsü olayları için olay güdümlü betikler.
- **Plugin hook’ları**: ajan/araç yaşam döngüsü ve Gateway hattı içindeki genişletme noktaları.

### Dahili hook’lar (Gateway hook’ları)

- **`agent:bootstrap`**: sistem istemi son haline getirilmeden önce bootstrap dosyaları oluşturulurken çalışır.
  Bunu bootstrap bağlam dosyaları eklemek/kaldırmak için kullanın.
- **Komut hook’ları**: `/new`, `/reset`, `/stop` ve diğer komut olayları (bkz. Hook’lar belgesi).

Kurulum ve örnekler için bkz. [Hook’lar](/tr/automation/hooks).

### Plugin hook’ları (ajan + gateway yaşam döngüsü)

Bunlar ajan döngüsü veya gateway hattı içinde çalışır:

- **`before_model_resolve`**: model çözümlemeden önce sağlayıcı/modeli deterministik olarak geçersiz kılmak için oturum öncesinde çalışır (`messages` yoktur).
- **`before_prompt_build`**: istem gönderiminden önce `prependContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` enjekte etmek için oturum yüklendikten sonra çalışır (`messages` ile). Tur başına dinamik metin için `prependContext`, sistem istemi alanında kalması gereken kararlı rehberlik için sistem bağlamı alanlarını kullanın.
- **`before_agent_start`**: iki fazdan birinde çalışabilen eski uyumluluk hook’u; yukarıdaki açık hook’ları tercih edin.
- **`before_agent_reply`**: satır içi eylemlerden sonra ve LLM çağrısından önce çalışır; bir Plugin’in turu üstlenip sentetik bir yanıt döndürmesine veya turu tamamen susturmasına izin verir.
- **`agent_end`**: tamamlandıktan sonra son ileti listesini ve çalışma üst verilerini inceler.
- **`before_compaction` / `after_compaction`**: Compaction döngülerini gözlemler veya açıklama ekler.
- **`before_tool_call` / `after_tool_call`**: araç parametrelerini/sonuçlarını araya girerek yakalar.
- **`before_install`**: yerleşik tarama bulgularını inceler ve isteğe bağlı olarak skill ya da Plugin kurulumlarını engeller.
- **`tool_result_persist`**: araç sonuçlarını OpenClaw’a ait bir oturum transkriptine yazılmadan önce eşzamanlı olarak dönüştürür.
- **`message_received` / `message_sending` / `message_sent`**: gelen + giden ileti hook’ları.
- **`session_start` / `session_end`**: oturum yaşam döngüsü sınırları.
- **`gateway_start` / `gateway_stop`**: gateway yaşam döngüsü olayları.

Giden/araç korumaları için hook karar kuralları:

- `before_tool_call`: `{ block: true }` sonlandırıcıdır ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` hiçbir işlem yapmaz ve önceki bir engellemeyi temizlemez.
- `before_install`: `{ block: true }` sonlandırıcıdır ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` hiçbir işlem yapmaz ve önceki bir engellemeyi temizlemez.
- `message_sending`: `{ cancel: true }` sonlandırıcıdır ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` hiçbir işlem yapmaz ve önceki bir iptali temizlemez.

Hook API’si ve kayıt ayrıntıları için bkz. [Plugin hook’ları](/tr/plugins/hooks).

Harness’lar bu hook’ları farklı şekilde uyarlayabilir. Codex app-server harness’ı, belgelenmiş yansıtılmış
yüzeyler için uyumluluk sözleşmesi olarak OpenClaw Plugin hook’larını korurken, Codex yerel hook’ları
ayrı bir alt düzey Codex mekanizması olarak kalır.

## Akış + kısmi yanıtlar

- Asistan deltaları pi-agent-core’dan akış olarak alınır ve `assistant` olayları olarak yayılır.
- Blok akışı, kısmi yanıtları `text_end` veya `message_end` üzerinde yayabilir.
- Akıl yürütme akışı ayrı bir akış olarak veya blok yanıtları olarak yayılabilir.
- Parçalama ve blok yanıt davranışı için bkz. [Akış](/tr/concepts/streaming).

## Araç yürütme + mesajlaşma araçları

- Araç start/update/end olayları `tool` akışında yayılır.
- Araç sonuçları günlüğe yazılmadan/yayılmadan önce boyut ve görüntü yükleri için temizlenir.
- Mesajlaşma aracı gönderimleri, yinelenen asistan onaylarını bastırmak için izlenir.

## Yanıt biçimlendirme + bastırma

- Son yükler şunlardan oluşturulur:
  - asistan metni (ve isteğe bağlı akıl yürütme)
  - satır içi araç özetleri (verbose + izin verildiğinde)
  - model hata verdiğinde asistan hata metni
- Tam sessiz token `NO_REPLY` / `no_reply`, giden yüklerden filtrelenir.
- Mesajlaşma aracı yinelemeleri son yük listesinden kaldırılır.
- İşlenebilir yük kalmazsa ve bir araç hata verdiyse, yedek bir araç hata yanıtı yayılır
  (bir mesajlaşma aracı zaten kullanıcıya görünür bir yanıt göndermediyse).

## Compaction + yeniden denemeler

- Otomatik Compaction, `compaction` akış olayları yayar ve yeniden denemeyi tetikleyebilir.
- Yeniden denemede, yinelenen çıktıyı önlemek için bellek içi tamponlar ve araç özetleri sıfırlanır.
- Compaction hattı için bkz. [Compaction](/tr/concepts/compaction).

## Olay akışları (bugün)

- `lifecycle`: `subscribeEmbeddedPiSession` tarafından yayılır (ve yedek olarak `agentCommand` tarafından)
- `assistant`: pi-agent-core’dan akış olarak gelen deltalar
- `tool`: pi-agent-core’dan akış olarak gelen araç olayları

## Sohbet kanalı işleme

- Asistan deltaları sohbet `delta` iletilerine tamponlanır.
- **Yaşam döngüsü end/error** olduğunda bir sohbet `final` yayılır.

## Zaman aşımları

- `agent.wait` varsayılanı: 30 sn (yalnızca bekleme). `timeoutMs` parametresi geçersiz kılar.
- Ajan çalışma zamanı: `agents.defaults.timeoutSeconds` varsayılanı 172800 sn (48 saat); `runEmbeddedPiAgent` durdurma zamanlayıcısında uygulanır.
- Cron çalışma zamanı: yalıtılmış ajan turu `timeoutSeconds`, cron’a aittir. Zamanlayıcı bu süreölçeri yürütme başladığında başlatır, yapılandırılmış son sürede alttaki çalışmayı durdurur, sonra zaman aşımını kaydetmeden önce sınırlı temizlik çalıştırır; böylece eski bir alt oturum hattı takılı tutamaz.
- Takılmış oturum kurtarma: tanılama etkinleştirildiğinde, `diagnostics.stuckSessionWarnMs` uzun süren `processing` oturumlarını algılar. Etkin gömülü çalışmalar, etkin yanıt işlemleri ve etkin oturum hattı görevleri varsayılan olarak yalnızca uyarı düzeyinde kalır; tanılamalar oturum için etkin çalışma göstermiyorsa, watchdog etkilenen oturum hattını serbest bırakır, böylece kuyruktaki başlatma işleri boşalabilir.
- Model boşta kalma zaman aşımı: OpenClaw, boşta kalma penceresi dolmadan önce hiçbir yanıt parçası gelmezse model isteğini durdurur. `models.providers.<id>.timeoutSeconds`, yavaş yerel/kendi barındırılan sağlayıcılar için bu boşta kalma watchdog’unu uzatır; aksi halde OpenClaw, yapılandırıldığında `agents.defaults.timeoutSeconds` kullanır ve varsayılan olarak 120 sn ile sınırlar. Açık bir model veya ajan zaman aşımı olmayan Cron tetikli çalışmalar, boşta kalma watchdog’unu devre dışı bırakır ve cron dış zaman aşımına dayanır.
- Sağlayıcı HTTP isteği zaman aşımı: `models.providers.<id>.timeoutSeconds`, bağlanma, başlıklar, gövde, SDK istek zaman aşımı, toplam korumalı-fetch durdurma işleme ve model akışı boşta kalma watchdog’u dahil olmak üzere bu sağlayıcının model HTTP fetch’lerine uygulanır. Tüm ajan çalışma zamanı zaman aşımını yükseltmeden önce Ollama gibi yavaş yerel/kendi barındırılan sağlayıcılar için bunu kullanın.

## İşlerin erken bitebileceği yerler

- Ajan zaman aşımı (durdurma)
- AbortSignal (iptal)
- Gateway bağlantı kopması veya RPC zaman aşımı
- `agent.wait` zaman aşımı (yalnızca bekleme, ajanı durdurmaz)

## İlgili

- [Araçlar](/tr/tools) — kullanılabilir ajan araçları
- [Hook’lar](/tr/automation/hooks) — ajan yaşam döngüsü olaylarıyla tetiklenen olay güdümlü betikler
- [Compaction](/tr/concepts/compaction) — uzun konuşmaların nasıl özetlendiği
- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Düşünme](/tr/tools/thinking) — düşünme/akıl yürütme düzeyi yapılandırması
