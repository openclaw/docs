---
read_when:
    - Ajan döngüsünün veya yaşam döngüsü olaylarının tam bir adım adım açıklamasına ihtiyacınız var
    - Oturum kuyruğa alma, transkript yazmaları veya oturum yazma kilidi davranışını değiştiriyorsunuz
summary: Ajan döngüsünün yaşam döngüsü, akışları ve bekleme semantiği
title: Aracı döngüsü
x-i18n:
    generated_at: "2026-05-05T06:16:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c7031a2b70e7a891f51fa127df6f04663db81400715717f50dd840a3fa5b745
    source_path: concepts/agent-loop.md
    workflow: 16
---

Bir ajan döngüsü, bir ajanın eksiksiz “gerçek” çalıştırmasıdır: alım → bağlam derleme → model çıkarımı →
araç yürütme → akış yanıtları → kalıcılık. Bir iletiyi eylemlere ve nihai yanıta dönüştüren, aynı zamanda oturum durumunu tutarlı tutan yetkili yoldur.

OpenClaw içinde döngü, model düşünürken, araçları çağırırken ve çıktı akışı üretirken yaşam döngüsü ve akış olayları yayan, oturum başına tek ve seri hale getirilmiş bir çalıştırmadır. Bu belge, bu özgün döngünün uçtan uca nasıl bağlandığını açıklar.

## Giriş noktaları

- Gateway RPC: `agent` ve `agent.wait`.
- CLI: `agent` komutu.

## Nasıl çalışır (üst düzey)

1. `agent` RPC parametreleri doğrular, oturumu çözümler (sessionKey/sessionId), oturum meta verilerini kalıcı hale getirir, hemen `{ runId, acceptedAt }` döndürür.
2. `agentCommand` ajanı çalıştırır:
   - model + düşünme/ayrıntılı/iz varsayılanlarını çözümler
   - Skills anlık görüntüsünü yükler
   - `runEmbeddedPiAgent` çağırır (pi-agent-core çalışma zamanı)
   - gömülü döngü bir tane yaymazsa **yaşam döngüsü sonu/hatası** yayar
3. `runEmbeddedPiAgent`:
   - çalıştırmaları oturum başına + genel kuyruklar üzerinden seri hale getirir
   - model + kimlik doğrulama profilini çözümler ve Pi oturumunu oluşturur
   - Pi olaylarına abone olur ve asistan/araç deltalarını akıtır
   - zaman aşımını uygular -> aşılırsa çalıştırmayı durdurur
   - Codex app-server dönüşleri için, terminal olaydan önce app-server ilerlemesi üretmeyi durduran kabul edilmiş dönüşü durdurur
   - yükleri + kullanım meta verilerini döndürür
4. `subscribeEmbeddedPiSession`, pi-agent-core olaylarını OpenClaw `agent` akışına köprüler:
   - araç olayları => `stream: "tool"`
   - asistan deltaları => `stream: "assistant"`
   - yaşam döngüsü olayları => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`, `waitForAgentRun` kullanır:
   - `runId` için **yaşam döngüsü sonunu/hatasını** bekler
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` döndürür

## Kuyruğa alma + eşzamanlılık

- Çalıştırmalar oturum anahtarı başına (oturum şeridi) ve isteğe bağlı olarak genel bir şerit üzerinden seri hale getirilir.
- Bu, araç/oturum yarışlarını önler ve oturum geçmişini tutarlı tutar.
- Mesajlaşma kanalları, bu şerit sistemini besleyen kuyruk modlarını (topla/yönlendir/takip) seçebilir.
  Bkz. [Komut Kuyruğu](/tr/concepts/queue).
- Transkript yazmaları da oturum dosyasında bir oturum yazma kilidiyle korunur. Kilit
  süreç farkındadır ve dosya tabanlıdır; bu yüzden süreç içi kuyruğu atlayan veya
  başka bir süreçten gelen yazıcıları yakalar. Oturum transkript yazıcıları, oturumu meşgul
  olarak bildirmeden önce en fazla `session.writeLock.acquireTimeoutMs` kadar bekler;
  varsayılan değer `60000` ms’dir.
- Oturum yazma kilitleri varsayılan olarak yeniden girilebilir değildir. Bir yardımcı, tek mantıksal yazıcıyı
  korurken aynı kilidin edinimini bilerek iç içe yerleştiriyorsa, açıkça
  `allowReentrant: true` ile katılmalıdır.

## Oturum + çalışma alanı hazırlığı

- Çalışma alanı çözümlenir ve oluşturulur; sandbox’lı çalıştırmalar bir sandbox çalışma alanı köküne yönlendirilebilir.
- Skills yüklenir (veya bir anlık görüntüden yeniden kullanılır) ve ortama ve prompt’a enjekte edilir.
- Bootstrap/bağlam dosyaları çözümlenir ve sistem prompt raporuna enjekte edilir.
- Bir oturum yazma kilidi edinilir; akıştan önce `SessionManager` açılır ve hazırlanır. Daha sonraki herhangi bir
  transkript yeniden yazma, Compaction veya kısaltma yolu, transkript dosyasını açmadan veya
  değiştirmeden önce aynı kilidi almalıdır.

## Prompt derleme + sistem prompt’u

- Sistem prompt’u OpenClaw’ın temel prompt’undan, Skills prompt’undan, bootstrap bağlamından ve çalıştırma başına geçersiz kılmalardan oluşturulur.
- Modele özgü sınırlar ve Compaction yedek belirteçleri uygulanır.
- Modelin ne gördüğü için bkz. [Sistem prompt’u](/tr/concepts/system-prompt).

## Hook noktaları (nerede araya girebilirsiniz)

OpenClaw’ın iki hook sistemi vardır:

- **Dahili hook’lar** (Gateway hook’ları): komutlar ve yaşam döngüsü olayları için olay odaklı betikler.
- **Plugin hook’ları**: ajan/araç yaşam döngüsü ve gateway işlem hattı içindeki genişletme noktaları.

### Dahili hook’lar (Gateway hook’ları)

- **`agent:bootstrap`**: sistem prompt’u son haline getirilmeden önce bootstrap dosyaları oluşturulurken çalışır.
  Bootstrap bağlam dosyaları eklemek/kaldırmak için bunu kullanın.
- **Komut hook’ları**: `/new`, `/reset`, `/stop` ve diğer komut olayları (bkz. Hook’lar belgesi).

Kurulum ve örnekler için bkz. [Hook’lar](/tr/automation/hooks).

### Plugin hook’ları (ajan + gateway yaşam döngüsü)

Bunlar ajan döngüsünün veya gateway işlem hattının içinde çalışır:

- **`before_model_resolve`**: model çözümlemeden önce sağlayıcıyı/modeli deterministik olarak geçersiz kılmak için oturum öncesinde çalışır (`messages` yoktur).
- **`before_prompt_build`**: prompt gönderiminden önce `prependContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` enjekte etmek için oturum yüklendikten sonra (`messages` ile) çalışır. Dönüş başına dinamik metin için `prependContext`, sistem prompt alanında durması gereken kararlı yönlendirme için sistem bağlamı alanlarını kullanın.
- **`before_agent_start`**: her iki aşamada da çalışabilen eski uyumluluk hook’u; yukarıdaki açık hook’ları tercih edin.
- **`before_agent_reply`**: satır içi eylemlerden sonra ve LLM çağrısından önce çalışır; bir Plugin’in dönüşü sahiplenip sentetik bir yanıt döndürmesine veya dönüşü tamamen sessize almasına olanak tanır.
- **`agent_end`**: tamamlanmadan sonra nihai ileti listesini ve çalıştırma meta verilerini inceleyin.
- **`before_compaction` / `after_compaction`**: Compaction döngülerini gözlemleyin veya açıklama ekleyin.
- **`before_tool_call` / `after_tool_call`**: araç parametrelerine/sonuçlarına araya girin.
- **`before_install`**: yerleşik tarama bulgularını inceleyin ve isteğe bağlı olarak skill veya Plugin kurulumlarını engelleyin.
- **`tool_result_persist`**: araç sonuçlarını OpenClaw’a ait bir oturum transkriptine yazılmadan önce eşzamanlı olarak dönüştürür.
- **`message_received` / `message_sending` / `message_sent`**: gelen + giden ileti hook’ları.
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
belgelenmiş yansıtılmış yüzeyler için uyumluluk sözleşmesi olarak OpenClaw Plugin hook’larını
korurken, Codex yerel hook’ları ayrı bir alt düzey Codex mekanizması olarak kalır.

## Akış + kısmi yanıtlar

- Asistan deltaları pi-agent-core’dan akıtılır ve `assistant` olayları olarak yayılır.
- Blok akışı, kısmi yanıtları `text_end` veya `message_end` üzerinde yayabilir.
- Akıl yürütme akışı ayrı bir akış olarak veya blok yanıtları olarak yayılabilir.
- Parçalama ve blok yanıt davranışı için bkz. [Akış](/tr/concepts/streaming).

## Araç yürütme + mesajlaşma araçları

- Araç başlatma/güncelleme/sonlandırma olayları `tool` akışında yayılır.
- Araç sonuçları günlüğe kaydetmeden/yaymadan önce boyut ve görsel yükleri için temizlenir.
- Mesajlaşma aracı gönderimleri, yinelenen asistan onaylarını bastırmak için izlenir.

## Yanıt şekillendirme + bastırma

- Nihai yükler şunlardan derlenir:
  - asistan metni (ve isteğe bağlı akıl yürütme)
  - satır içi araç özetleri (ayrıntılı + izin verildiğinde)
  - model hata verdiğinde asistan hata metni
- Tam sessiz belirteç `NO_REPLY` / `no_reply`, giden
  yüklerden filtrelenir.
- Mesajlaşma aracı yinelenenleri nihai yük listesinden kaldırılır.
- İşlenebilir yük kalmazsa ve bir araç hata verdiyse, yedek bir araç hata yanıtı yayılır
  (bir mesajlaşma aracı zaten kullanıcıya görünür bir yanıt göndermediyse).

## Compaction + yeniden denemeler

- Otomatik Compaction, `compaction` akış olayları yayar ve bir yeniden denemeyi tetikleyebilir.
- Yeniden denemede, yinelenen çıktıyı önlemek için bellek içi tamponlar ve araç özetleri sıfırlanır.
- Compaction işlem hattı için bkz. [Compaction](/tr/concepts/compaction).

## Olay akışları (bugün)

- `lifecycle`: `subscribeEmbeddedPiSession` tarafından yayılır (ve `agentCommand` tarafından yedek olarak)
- `assistant`: pi-agent-core’dan akıtılan deltalar
- `tool`: pi-agent-core’dan akıtılan araç olayları

## Sohbet kanalı işleme

- Asistan deltaları sohbet `delta` iletilerine tamponlanır.
- **Yaşam döngüsü sonu/hatası** üzerinde bir sohbet `final` yayılır.

## Zaman aşımları

- `agent.wait` varsayılanı: 30 sn (yalnızca bekleme). `timeoutMs` parametresi geçersiz kılar.
- Ajan çalışma zamanı: `agents.defaults.timeoutSeconds` varsayılanı 172800 sn’dir (48 saat); `runEmbeddedPiAgent` durdurma zamanlayıcısında uygulanır.
- Cron çalışma zamanı: yalıtılmış ajan dönüşü `timeoutSeconds` cron’a aittir. Zamanlayıcı bu zamanlayıcıyı yürütme başladığında başlatır, yapılandırılmış son tarihte alttaki çalıştırmayı durdurur, ardından zaman aşımını kaydetmeden önce sınırlı temizlik çalıştırır; böylece eski bir alt oturum şeridi takılı tutamaz.
- Oturum canlılık tanıları: tanılar etkinken, `diagnostics.stuckSessionWarnMs`; gözlemlenen yanıt, araç, durum, blok veya ACP ilerlemesi olmayan uzun `processing` oturumlarını sınıflandırır. Etkin gömülü çalıştırmalar, model çağrıları ve araç çağrıları `session.long_running` olarak raporlanır; yakın zamanda ilerlemesi olmayan etkin iş `session.stalled` olarak raporlanır; `session.stuck`, etkin iş olmadan eski oturum defter tutma işlemleri için ayrılmıştır. Eski oturum defter tutma, etkilenen oturum şeridini hemen serbest bırakır; durmuş gömülü çalıştırmalar ancak `diagnostics.stuckSessionAbortMs` sonrasında durdurularak boşaltılır (varsayılan: en az 10 dakika ve uyarı eşiğinin 5 katı), böylece kuyruğa alınan işler yalnızca yavaş olan çalıştırmalar kesilmeden devam edebilir. Kurtarma, yapılandırılmış istenen/tamamlanan sonuçları yayar ve tanı durumu yalnızca aynı işleme nesli hâlâ güncelse boşta olarak işaretlenir. Yinelenen `session.stuck` tanıları, oturum değişmeden kaldığı sürece geri çekilir.
- Model boşta zaman aşımı: OpenClaw, boşta penceresinden önce hiçbir yanıt parçası gelmediğinde bir model isteğini durdurur. `models.providers.<id>.timeoutSeconds`, yavaş yerel/kendi barındırılan sağlayıcılar için bu boşta bekçi süresini uzatır; aksi takdirde OpenClaw yapılandırıldığında `agents.defaults.timeoutSeconds` kullanır ve varsayılan olarak 120 sn ile sınırlar. Açık model veya ajan zaman aşımı olmayan Cron tetikli çalıştırmalar boşta bekçisini devre dışı bırakır ve cron dış zaman aşımına güvenir.
- Sağlayıcı HTTP isteği zaman aşımı: `models.providers.<id>.timeoutSeconds`, bağlantı, başlıklar, gövde, SDK isteği zaman aşımı, toplam korumalı fetch durdurma işleme ve model akışı boşta bekçisi dahil olmak üzere ilgili sağlayıcının model HTTP fetch’lerine uygulanır. Bunu, tüm ajan çalışma zamanı zaman aşımını yükseltmeden önce Ollama gibi yavaş yerel/kendi barındırılan sağlayıcılar için kullanın.

## İşlerin erken bitebileceği yerler

- Ajan zaman aşımı (durdurma)
- AbortSignal (iptal)
- Gateway bağlantı kesilmesi veya RPC zaman aşımı
- `agent.wait` zaman aşımı (yalnızca bekleme, ajanı durdurmaz)

## İlgili

- [Araçlar](/tr/tools) — kullanılabilir ajan araçları
- [Hook’lar](/tr/automation/hooks) — ajan yaşam döngüsü olayları tarafından tetiklenen olay odaklı betikler
- [Compaction](/tr/concepts/compaction) — uzun konuşmaların nasıl özetlendiği
- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Düşünme](/tr/tools/thinking) — düşünme/akıl yürütme düzeyi yapılandırması
