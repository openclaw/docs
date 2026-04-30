---
read_when:
    - Ajan döngüsünün veya yaşam döngüsü olaylarının tam bir adım adım anlatımına ihtiyacınız var
    - Oturum kuyruklamasını, transkript yazımlarını veya oturum yazma kilidi davranışını değiştiriyorsunuz
summary: Ajan döngüsünün yaşam döngüsü, akışları ve bekleme semantiği
title: Ajan döngüsü
x-i18n:
    generated_at: "2026-04-30T18:38:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5466893253e1f82482284ff82db56f4c3fca018bf12e4114fad76d37cad954df
    source_path: concepts/agent-loop.md
    workflow: 16
---

Bir ajan döngüsü, bir ajanın tam “gerçek” çalıştırmasıdır: alım → bağlam derleme → model çıkarımı →
araç yürütme → akışlı yanıtlar → kalıcılık. Bir iletiyi eylemlere
ve son yanıta dönüştüren, oturum durumunu tutarlı tutan yetkili yoldur.

OpenClaw'da bir döngü, oturum başına tekil, serileştirilmiş bir çalıştırmadır; model düşünürken,
araçları çağırırken ve çıktı akıtırken yaşam döngüsü ve akış olayları yayar. Bu doküman, bu özgün döngünün
uçtan uca nasıl bağlandığını açıklar.

## Giriş noktaları

- Gateway RPC: `agent` ve `agent.wait`.
- CLI: `agent` komutu.

## Nasıl çalışır (üst düzey)

1. `agent` RPC parametreleri doğrular, oturumu çözümler (sessionKey/sessionId), oturum meta verilerini kalıcılaştırır, hemen `{ runId, acceptedAt }` döndürür.
2. `agentCommand` ajanı çalıştırır:
   - model + düşünme/ayrıntılı/iz varsayılanlarını çözümler
   - Skills anlık görüntüsünü yükler
   - `runEmbeddedPiAgent` çağırır (pi-agent-core çalışma zamanı)
   - gömülü döngü bir tane yaymazsa **yaşam döngüsü bitiş/hata** yayar
3. `runEmbeddedPiAgent`:
   - çalıştırmaları oturum başına + küresel kuyruklarla serileştirir
   - model + kimlik doğrulama profilini çözümler ve pi oturumunu oluşturur
   - pi olaylarına abone olur ve asistan/araç deltalarını akıtır
   - zaman aşımını uygular -> aşılırsa çalıştırmayı iptal eder
   - Codex uygulama sunucusu dönüşlerinde, terminal olaydan önce uygulama sunucusu ilerlemesi üretmeyi durduran kabul edilmiş dönüşü iptal eder
   - yükleri + kullanım meta verilerini döndürür
4. `subscribeEmbeddedPiSession`, pi-agent-core olaylarını OpenClaw `agent` akışına köprüler:
   - araç olayları => `stream: "tool"`
   - asistan deltaları => `stream: "assistant"`
   - yaşam döngüsü olayları => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`, `waitForAgentRun` kullanır:
   - `runId` için **yaşam döngüsü bitiş/hata** bekler
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` döndürür

## Kuyruğa alma + eşzamanlılık

- Çalıştırmalar oturum anahtarı başına (oturum hattı) ve isteğe bağlı olarak küresel bir hat üzerinden serileştirilir.
- Bu, araç/oturum yarışlarını önler ve oturum geçmişini tutarlı tutar.
- Mesajlaşma kanalları, bu hat sistemini besleyen kuyruk modlarını (topla/yönlendir/takip) seçebilir.
  Bkz. [Komut Kuyruğu](/tr/concepts/queue).
- Transkript yazmaları, oturum dosyası üzerindeki bir oturum yazma kilidiyle de korunur. Kilit
  süreç farkındadır ve dosya tabanlıdır; bu nedenle süreç içi kuyruğu atlayan veya
  başka bir süreçten gelen yazarları yakalar.
- Oturum yazma kilitleri varsayılan olarak yeniden girişli değildir. Bir yardımcı, tek bir mantıksal yazarı
  korurken aynı kilidin alınmasını bilerek iç içe geçirirse, bunu açıkça
  `allowReentrant: true` ile etkinleştirmelidir.

## Oturum + çalışma alanı hazırlığı

- Çalışma alanı çözümlenir ve oluşturulur; korumalı alanlı çalıştırmalar bir korumalı alan çalışma alanı köküne yönlendirebilir.
- Skills yüklenir (veya bir anlık görüntüden yeniden kullanılır) ve env ile prompt içine enjekte edilir.
- Önyükleme/bağlam dosyaları çözümlenir ve sistem prompt raporuna enjekte edilir.
- Bir oturum yazma kilidi alınır; `SessionManager` akıştan önce açılır ve hazırlanır. Daha sonraki
  herhangi bir transkript yeniden yazma, compaction veya kırpma yolu, transkript dosyasını açmadan veya
  değiştirmeden önce aynı kilidi almalıdır.

## Prompt derleme + sistem promptu

- Sistem promptu, OpenClaw'ın temel promptundan, Skills promptundan, önyükleme bağlamından ve çalıştırma başına geçersiz kılmalardan oluşturulur.
- Modele özgü sınırlar ve compaction ayrılmış belirteçleri uygulanır.
- Modelin ne gördüğü için bkz. [Sistem promptu](/tr/concepts/system-prompt).

## Kanca noktaları (nerede araya girebilirsiniz)

OpenClaw iki kanca sistemine sahiptir:

- **İç kancalar** (Gateway kancaları): komutlar ve yaşam döngüsü olayları için olay odaklı betikler.
- **Plugin kancaları**: ajan/araç yaşam döngüsü ve Gateway işlem hattı içindeki genişletme noktaları.

### İç kancalar (Gateway kancaları)

- **`agent:bootstrap`**: sistem promptu sonlandırılmadan önce önyükleme dosyaları oluşturulurken çalışır.
  Önyükleme bağlam dosyaları eklemek/kaldırmak için bunu kullanın.
- **Komut kancaları**: `/new`, `/reset`, `/stop` ve diğer komut olayları (bkz. Kancalar dokümanı).

Kurulum ve örnekler için bkz. [Kancalar](/tr/automation/hooks).

### Plugin kancaları (ajan + Gateway yaşam döngüsü)

Bunlar ajan döngüsü veya Gateway işlem hattı içinde çalışır:

- **`before_model_resolve`**: model çözümlemesinden önce sağlayıcı/modeli deterministik olarak geçersiz kılmak için oturum öncesinde çalışır (`messages` yok).
- **`before_prompt_build`**: prompt gönderiminden önce `prependContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` enjekte etmek için oturum yüklendikten sonra çalışır (`messages` ile). Tur başına dinamik metin için `prependContext`, sistem prompt alanında yer alması gereken kararlı rehberlik için sistem bağlamı alanlarını kullanın.
- **`before_agent_start`**: iki aşamadan birinde çalışabilen eski uyumluluk kancası; yukarıdaki açık kancaları tercih edin.
- **`before_agent_reply`**: satır içi eylemlerden sonra ve LLM çağrısından önce çalışır; bir plugin'in dönüşü üstlenmesine ve sentetik bir yanıt döndürmesine veya dönüşü tamamen susturmasına olanak tanır.
- **`agent_end`**: tamamlandıktan sonra son ileti listesini ve çalıştırma meta verilerini inceler.
- **`before_compaction` / `after_compaction`**: compaction döngülerini gözlemler veya notlandırır.
- **`before_tool_call` / `after_tool_call`**: araç parametrelerini/sonuçlarını yakalar.
- **`before_install`**: yerleşik tarama bulgularını inceler ve isteğe bağlı olarak skill veya plugin kurulumlarını engeller.
- **`tool_result_persist`**: araç sonuçları OpenClaw sahipliğindeki bir oturum transkriptine yazılmadan önce eşzamanlı olarak dönüştürür.
- **`message_received` / `message_sending` / `message_sent`**: gelen + giden ileti kancaları.
- **`session_start` / `session_end`**: oturum yaşam döngüsü sınırları.
- **`gateway_start` / `gateway_stop`**: Gateway yaşam döngüsü olayları.

Giden/araç korumaları için kanca karar kuralları:

- `before_tool_call`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` işlem yapmaz ve önceki bir engellemeyi temizlemez.
- `before_install`: `{ block: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` işlem yapmaz ve önceki bir engellemeyi temizlemez.
- `message_sending`: `{ cancel: true }` terminaldir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` işlem yapmaz ve önceki bir iptali temizlemez.

Kanca API'si ve kayıt ayrıntıları için bkz. [Plugin kancaları](/tr/plugins/hooks).

Test düzenekleri bu kancaları farklı biçimde uyarlayabilir. Codex uygulama sunucusu test düzeneği,
belgelenmiş yansıtılmış yüzeyler için uyumluluk sözleşmesi olarak OpenClaw plugin kancalarını korurken,
Codex yerel kancaları ayrı bir daha düşük seviyeli Codex mekanizması olarak kalır.

## Akış + kısmi yanıtlar

- Asistan deltaları pi-agent-core'dan akıtılır ve `assistant` olayları olarak yayılır.
- Blok akışı, kısmi yanıtları `text_end` veya `message_end` üzerinde yayabilir.
- Akıl yürütme akışı ayrı bir akış olarak veya blok yanıtları olarak yayılabilir.
- Parçalama ve blok yanıt davranışı için bkz. [Akış](/tr/concepts/streaming).

## Araç yürütme + mesajlaşma araçları

- Araç başlangıç/güncelleme/bitiş olayları `tool` akışında yayılır.
- Araç sonuçları, günlüğe kaydetme/yayma öncesinde boyut ve görüntü yükleri açısından temizlenir.
- Mesajlaşma aracı gönderimleri, yinelenen asistan onaylarını bastırmak için izlenir.

## Yanıt biçimlendirme + bastırma

- Son yükler şunlardan derlenir:
  - asistan metni (ve isteğe bağlı akıl yürütme)
  - satır içi araç özetleri (ayrıntılı + izinliyse)
  - model hata verdiğinde asistan hata metni
- Tam sessiz belirteç `NO_REPLY` / `no_reply`, giden
  yüklerden filtrelenir.
- Mesajlaşma aracı yinelemeleri son yük listesinden kaldırılır.
- Oluşturulabilir yük kalmazsa ve bir araç hata verdiyse, yedek bir araç hata yanıtı yayılır
  (bir mesajlaşma aracı zaten kullanıcıya görünür bir yanıt göndermediyse).

## Compaction + yeniden denemeler

- Otomatik compaction, `compaction` akış olayları yayar ve yeniden denemeyi tetikleyebilir.
- Yeniden denemede, yinelenen çıktıyı önlemek için bellek içi tamponlar ve araç özetleri sıfırlanır.
- Compaction işlem hattı için bkz. [Compaction](/tr/concepts/compaction).

## Olay akışları (bugün)

- `lifecycle`: `subscribeEmbeddedPiSession` tarafından (ve yedek olarak `agentCommand` tarafından) yayılır
- `assistant`: pi-agent-core'dan akıtılan deltalar
- `tool`: pi-agent-core'dan akıtılan araç olayları

## Sohbet kanalı işleme

- Asistan deltaları sohbet `delta` iletilerine tamponlanır.
- **Yaşam döngüsü bitiş/hata** üzerinde bir sohbet `final` yayılır.

## Zaman aşımları

- `agent.wait` varsayılanı: 30 sn (yalnızca bekleme). `timeoutMs` parametresi geçersiz kılar.
- Ajan çalışma zamanı: `agents.defaults.timeoutSeconds` varsayılanı 172800 sn (48 saat); `runEmbeddedPiAgent` iptal zamanlayıcısında uygulanır.
- Cron çalışma zamanı: yalıtılmış ajan dönüşü `timeoutSeconds` cron tarafından sahiplenilir. Zamanlayıcı bu zamanlayıcıyı yürütme başladığında başlatır, yapılandırılmış son tarihte alttaki çalıştırmayı iptal eder, ardından zaman aşımını kaydetmeden önce sınırlı temizlik çalıştırır; böylece eski bir alt oturum hattı takılı tutamaz.
- Takılı oturum kurtarma: tanılamalar etkinleştirildiğinde, `diagnostics.stuckSessionWarnMs` uzun `processing` oturumlarını algılar. Etkin gömülü çalıştırmalar, etkin yanıt işlemleri ve etkin oturum hattı görevleri varsayılan olarak yalnızca uyarı olarak kalır; tanılamalar oturum için etkin çalışma göstermiyorsa watchdog etkilenen oturum hattını serbest bırakır, böylece kuyruğa alınmış başlangıç işi boşalabilir.
- Model boşta kalma zaman aşımı: OpenClaw, boşta kalma penceresi dolmadan önce yanıt parçaları gelmediğinde model isteğini iptal eder. `models.providers.<id>.timeoutSeconds`, yavaş yerel/kendi barındırılan sağlayıcılar için bu boşta kalma watchdog'unu uzatır; aksi takdirde OpenClaw, yapılandırıldığında `agents.defaults.timeoutSeconds` kullanır ve varsayılan olarak 120 sn ile sınırlar. Açık model veya ajan zaman aşımı olmayan Cron tetikli çalıştırmalar boşta kalma watchdog'unu devre dışı bırakır ve cron dış zaman aşımına dayanır.
- Sağlayıcı HTTP isteği zaman aşımı: `models.providers.<id>.timeoutSeconds`, bağlanma, başlıklar, gövde, SDK istek zaman aşımı, toplam korumalı-fetch iptal işleme ve model akışı boşta kalma watchdog'u dahil olmak üzere bu sağlayıcının model HTTP fetch'lerine uygulanır. Tüm ajan çalışma zamanı zaman aşımını yükseltmeden önce Ollama gibi yavaş yerel/kendi barındırılan sağlayıcılar için bunu kullanın.

## İşlerin erken bitebileceği yerler

- Ajan zaman aşımı (iptal)
- AbortSignal (iptal)
- Gateway bağlantı kesilmesi veya RPC zaman aşımı
- `agent.wait` zaman aşımı (yalnızca bekleme, ajanı durdurmaz)

## İlgili

- [Araçlar](/tr/tools) — kullanılabilir ajan araçları
- [Kancalar](/tr/automation/hooks) — ajan yaşam döngüsü olayları tarafından tetiklenen olay odaklı betikler
- [Compaction](/tr/concepts/compaction) — uzun konuşmaların nasıl özetlendiği
- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Düşünme](/tr/tools/thinking) — düşünme/akıl yürütme seviyesi yapılandırması
