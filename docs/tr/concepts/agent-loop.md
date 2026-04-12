---
read_when:
    - Ajan döngüsünün veya yaşam döngüsü olaylarının tam bir adım adım açıklamasına ihtiyacınız var
summary: Ajan döngüsü yaşam döngüsü, akışlar ve bekleme semantiği
title: Ajan Döngüsü
x-i18n:
    generated_at: "2026-04-12T23:28:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c2986708b444055340e0c91b8fce7d32225fcccf3d197b797665fd36b1991a5
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Ajan Döngüsü (OpenClaw)

Ajanik döngü, bir ajanın tam “gerçek” çalıştırmasıdır: alım → bağlam birleştirme → model çıkarımı →
araç yürütme → akış halinde yanıtlar → kalıcılık. Bu, bir mesajı eylemlere ve nihai yanıta dönüştüren,
aynı zamanda oturum durumunu tutarlı tutan yetkili yoldur.

OpenClaw’da bir döngü, model düşünürken, araç çağırırken ve çıktıyı akış halinde verirken yaşam döngüsü
ve akış olayları yayan, oturum başına tek ve serileştirilmiş bir çalıştırmadır. Bu belge, bu özgün
döngünün uçtan uca nasıl bağlandığını açıklar.

## Giriş noktaları

- Gateway RPC: `agent` ve `agent.wait`.
- CLI: `agent` komutu.

## Nasıl çalışır (üst düzey)

1. `agent` RPC parametreleri doğrular, oturumu çözer (sessionKey/sessionId), oturum meta verilerini kalıcılaştırır ve hemen `{ runId, acceptedAt }` döndürür.
2. `agentCommand` ajanı çalıştırır:
   - model + thinking/verbose/trace varsayılanlarını çözer
   - Skills anlık görüntüsünü yükler
   - `runEmbeddedPiAgent` çağırır (pi-agent-core çalışma zamanı)
   - gömülü döngü bunu yaymazsa **yaşam döngüsü end/error** yayar
3. `runEmbeddedPiAgent`:
   - çalıştırmaları oturum başına + genel kuyruklar üzerinden serileştirir
   - model + kimlik doğrulama profilini çözer ve Pi oturumunu oluşturur
   - Pi olaylarına abone olur ve assistant/tool delta’larını akış halinde verir
   - zaman aşımını uygular -> aşılırsa çalıştırmayı iptal eder
   - payload’ları + kullanım meta verilerini döndürür
4. `subscribeEmbeddedPiSession`, pi-agent-core olaylarını OpenClaw `agent` akışına köprüler:
   - araç olayları => `stream: "tool"`
   - assistant delta’ları => `stream: "assistant"`
   - yaşam döngüsü olayları => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`, `waitForAgentRun` kullanır:
   - `runId` için **yaşam döngüsü end/error** bekler
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` döndürür

## Kuyruklama + eşzamanlılık

- Çalıştırmalar, oturum anahtarı başına (oturum şeridi) ve isteğe bağlı olarak genel bir şerit üzerinden serileştirilir.
- Bu, araç/oturum yarışlarını önler ve oturum geçmişini tutarlı tutar.
- Mesajlaşma kanalları, bu şerit sistemine veri sağlayan kuyruk modlarını (collect/steer/followup) seçebilir.
  Bkz. [Komut Kuyruğu](/tr/concepts/queue).

## Oturum + çalışma alanı hazırlığı

- Çalışma alanı çözülür ve oluşturulur; sandbox çalıştırmaları bir sandbox çalışma alanı köküne yönlendirilebilir.
- Skills yüklenir (veya bir anlık görüntüden yeniden kullanılır) ve env ile prompt içine enjekte edilir.
- Bootstrap/bağlam dosyaları çözülür ve sistem prompt raporuna enjekte edilir.
- Bir oturum yazma kilidi alınır; `SessionManager`, akış başlamadan önce açılır ve hazırlanır.

## Prompt birleştirme + sistem prompt’u

- Sistem prompt’u, OpenClaw’ın temel prompt’undan, Skills prompt’undan, bootstrap bağlamından ve çalıştırma başına geçersiz kılmalardan oluşturulur.
- Modele özgü sınırlar ve Compaction rezerv token’ları uygulanır.
- Modelin ne gördüğü için bkz. [Sistem prompt’u](/tr/concepts/system-prompt).

## Hook noktaları (nerede müdahale edebilirsiniz)

OpenClaw’ın iki hook sistemi vardır:

- **İç hook’lar** (Gateway hook’ları): komutlar ve yaşam döngüsü olayları için olay güdümlü betikler.
- **Plugin hook’ları**: ajan/araç yaşam döngüsü ve gateway işlem hattı içindeki uzatma noktaları.

### İç hook’lar (Gateway hook’ları)

- **`agent:bootstrap`**: sistem prompt’u son haline getirilmeden önce bootstrap dosyaları oluşturulurken çalışır.
  Bunu bootstrap bağlam dosyaları eklemek/kaldırmak için kullanın.
- **Komut hook’ları**: `/new`, `/reset`, `/stop` ve diğer komut olayları (bkz. Hooks belgesi).

Kurulum ve örnekler için bkz. [Hooks](/tr/automation/hooks).

### Plugin hook’ları (ajan + gateway yaşam döngüsü)

Bunlar ajan döngüsü veya gateway işlem hattı içinde çalışır:

- **`before_model_resolve`**: model çözümlemesinden önce provider/model’i deterministik olarak geçersiz kılmak için oturum öncesinde (`messages` olmadan) çalışır.
- **`before_prompt_build`**: prompt gönderiminden önce `prependContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` enjekte etmek için oturum yüklendikten sonra (`messages` ile) çalışır. Dönüş başına dinamik metin için `prependContext`, sistem prompt alanında kalması gereken kararlı yönlendirme için system-context alanlarını kullanın.
- **`before_agent_start`**: eski uyumluluk hook’udur; her iki aşamada da çalışabilir; yukarıdaki açık hook’ları tercih edin.
- **`before_agent_reply`**: satır içi eylemlerden sonra ve LLM çağrısından önce çalışır; bir Plugin’in dönüşü sahiplenmesine ve sentetik bir yanıt döndürmesine veya dönüşü tamamen sessize almasına izin verir.
- **`agent_end`**: tamamlandıktan sonra nihai mesaj listesini ve çalıştırma meta verilerini inceler.
- **`before_compaction` / `after_compaction`**: Compaction döngülerini gözlemler veya not ekler.
- **`before_tool_call` / `after_tool_call`**: araç parametrelerini/sonuçlarını keser.
- **`before_install`**: yerleşik tarama bulgularını inceler ve isteğe bağlı olarak Skill veya Plugin kurulumlarını engeller.
- **`tool_result_persist`**: araç sonuçlarını oturum transkriptine yazılmadan önce eşzamanlı olarak dönüştürür.
- **`message_received` / `message_sending` / `message_sent`**: gelen + giden mesaj hook’ları.
- **`session_start` / `session_end`**: oturum yaşam döngüsü sınırları.
- **`gateway_start` / `gateway_stop`**: gateway yaşam döngüsü olayları.

Giden/araç korumaları için hook karar kuralları:

- `before_tool_call`: `{ block: true }` kesindir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` işlem yapmayan bir durumdur ve önceki bir engeli kaldırmaz.
- `before_install`: `{ block: true }` kesindir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` işlem yapmayan bir durumdur ve önceki bir engeli kaldırmaz.
- `message_sending`: `{ cancel: true }` kesindir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` işlem yapmayan bir durumdur ve önceki bir iptali kaldırmaz.

Hook API’si ve kayıt ayrıntıları için bkz. [Plugin hook’ları](/tr/plugins/architecture#provider-runtime-hooks).

## Akış + kısmi yanıtlar

- Assistant delta’ları pi-agent-core’dan akış halinde alınır ve `assistant` olayları olarak yayılır.
- Blok akışı, kısmi yanıtları `text_end` veya `message_end` anında yayabilir.
- Akıl yürütme akışı ayrı bir akış olarak veya blok yanıtları olarak yayılabilir.
- Parçalama ve blok yanıtı davranışı için bkz. [Akış](/tr/concepts/streaming).

## Araç yürütme + mesajlaşma araçları

- Araç start/update/end olayları `tool` akışında yayılır.
- Araç sonuçları, günlüğe kaydetmeden/yaymadan önce boyut ve görsel payload’lar açısından temizlenir.
- Yinelenen assistant onaylarını bastırmak için mesajlaşma aracı gönderimleri izlenir.

## Yanıt şekillendirme + bastırma

- Nihai payload’lar şunlardan birleştirilir:
  - assistant metni (ve isteğe bağlı akıl yürütme)
  - satır içi araç özetleri (verbose + izinliyse)
  - model hata verdiğinde assistant hata metni
- Tam sessiz belirteç `NO_REPLY` / `no_reply`, giden
  payload’lardan süzülür.
- Mesajlaşma aracı tekrarları nihai payload listesinden kaldırılır.
- Görüntülenebilir payload kalmazsa ve bir araç hata verdiyse, yedek bir araç hata yanıtı yayılır
  (bir mesajlaşma aracı kullanıcıya görünen bir yanıt zaten göndermediyse).

## Compaction + yeniden denemeler

- Otomatik Compaction, `compaction` akış olayları yayar ve yeniden denemeyi tetikleyebilir.
- Yeniden denemede, yinelenen çıktıyı önlemek için bellek içi tamponlar ve araç özetleri sıfırlanır.
- Compaction işlem hattısı için bkz. [Compaction](/tr/concepts/compaction).

## Olay akışları (bugün)

- `lifecycle`: `subscribeEmbeddedPiSession` tarafından yayılır (ve yedek olarak `agentCommand` tarafından)
- `assistant`: pi-agent-core’dan akış halinde gelen delta’lar
- `tool`: pi-agent-core’dan akış halinde gelen araç olayları

## Sohbet kanalı işleme

- Assistant delta’ları sohbet `delta` mesajları içine tamponlanır.
- Bir sohbet `final`, **lifecycle end/error** anında yayılır.

## Zaman aşımları

- `agent.wait` varsayılanı: 30 sn (yalnızca bekleme). `timeoutMs` parametresi bunu geçersiz kılar.
- Ajan çalışma zamanı: `agents.defaults.timeoutSeconds` varsayılanı 172800 sn (48 saat); `runEmbeddedPiAgent` iptal zamanlayıcısında uygulanır.
- LLM boşta kalma zaman aşımı: `agents.defaults.llm.idleTimeoutSeconds`, boşta kalma penceresi içinde hiçbir yanıt parçası gelmezse model isteğini iptal eder. Bunu yavaş yerel modeller veya akıl yürütme/araç çağrısı provider’ları için açıkça ayarlayın; devre dışı bırakmak için 0 olarak ayarlayın. Ayarlanmazsa OpenClaw, yapılandırılmışsa `agents.defaults.timeoutSeconds`, aksi halde 120 sn kullanır. Açık bir LLM veya ajan zaman aşımı olmayan Cron tetiklemeli çalıştırmalarda boşta kalma bekçisi devre dışı bırakılır ve dış Cron zaman aşımına güvenilir.

## İşlerin erken bitebileceği yerler

- Ajan zaman aşımı (iptal)
- AbortSignal (iptal)
- Gateway bağlantısının kopması veya RPC zaman aşımı
- `agent.wait` zaman aşımı (yalnızca bekleme, ajanı durdurmaz)

## İlgili

- [Araçlar](/tr/tools) — kullanılabilir ajan araçları
- [Hooks](/tr/automation/hooks) — ajan yaşam döngüsü olayları tarafından tetiklenen olay güdümlü betikler
- [Compaction](/tr/concepts/compaction) — uzun konuşmaların nasıl özetlendiği
- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Thinking](/tr/tools/thinking) — thinking/akıl yürütme düzeyi yapılandırması
