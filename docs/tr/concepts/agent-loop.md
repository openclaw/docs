---
read_when:
    - Ajan döngüsünün veya yaşam döngüsü olaylarının tam bir adım adım açıklamasına ihtiyacınız var
    - Oturum kuyruğa alma, transkript yazımları veya oturum yazma kilidi davranışını değiştiriyorsunuz
summary: Ajan döngüsü yaşam döngüsü, akışlar ve bekleme semantiği
title: Ajan döngüsü
x-i18n:
    generated_at: "2026-04-24T09:04:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: a413986168fe7eb1cb229e5ec45027d31fab889ca20ad53f289c8dfce98f7fab
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Ajan Döngüsü (OpenClaw)

Ajanik döngü, bir ajanın tam “gerçek” çalıştırmasıdır: alım → bağlam oluşturma → model çıkarımı →
araç yürütme → akış halinde yanıtlar → kalıcılık. Bu, bir mesajı
eylemlere ve nihai yanıta dönüştüren, oturum durumunu da tutarlı tutan yetkili yoldur.

OpenClaw'da döngü, model düşünürken, araç çağırırken ve çıktı akıtırken
yaşam döngüsü ve akış olayları yayan, oturum başına tek ve serileştirilmiş bir çalıştırmadır. Bu belge, bu özgün döngünün
uçtan uca nasıl bağlandığını açıklar.

## Giriş noktaları

- Gateway RPC: `agent` ve `agent.wait`.
- CLI: `agent` komutu.

## Nasıl çalışır (üst düzey)

1. `agent` RPC parametreleri doğrular, oturumu çözümler (sessionKey/sessionId), oturum meta verilerini kalıcılaştırır ve hemen `{ runId, acceptedAt }` döndürür.
2. `agentCommand` ajanı çalıştırır:
   - model + thinking/verbose/trace varsayılanlarını çözümler
   - Skills anlık görüntüsünü yükler
   - `runEmbeddedPiAgent` çağırır (pi-agent-core çalışma zamanı)
   - gömülü döngü bir tane yaymazsa **lifecycle end/error** yayar
3. `runEmbeddedPiAgent`:
   - oturum başına + genel kuyruklar üzerinden çalıştırmaları serileştirir
   - model + auth profile çözümler ve pi oturumunu oluşturur
   - pi olaylarına abone olur ve assistant/tool delta'larını akıtır
   - zaman aşımını zorunlu kılar -> aşılırsa çalıştırmayı abort eder
   - payload'ları + kullanım meta verilerini döndürür
4. `subscribeEmbeddedPiSession`, pi-agent-core olaylarını OpenClaw `agent` akışına köprüler:
   - araç olayları => `stream: "tool"`
   - asistan delta'ları => `stream: "assistant"`
   - yaşam döngüsü olayları => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`, `waitForAgentRun` kullanır:
   - `runId` için **lifecycle end/error** bekler
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` döndürür

## Kuyruklama + eşzamanlılık

- Çalıştırmalar oturum anahtarı başına (oturum hattı) ve isteğe bağlı olarak genel bir hat üzerinden serileştirilir.
- Bu, araç/oturum yarışlarını önler ve oturum geçmişini tutarlı tutar.
- Mesajlaşma kanalları bu hat sistemine beslenen kuyruk modlarını (collect/steer/followup) seçebilir.
  Bkz. [Komut Kuyruğu](/tr/concepts/queue).
- Transkript yazımları da oturum dosyasındaki bir oturum yazma kilidiyle korunur. Kilit
  süreç farkındalıklıdır ve dosya tabanlıdır; bu yüzden süreç içi kuyruğu atlayan veya
  başka bir süreçten gelen yazıcıları yakalar.
- Oturum yazma kilitleri varsayılan olarak reentrant değildir. Bir yardımcı,
  aynı mantıksal yazarı koruyarak aynı kilidin alınmasını bilerek iç içe geçiriyorsa
  açıkça `allowReentrant: true` ile dahil olmalıdır.

## Oturum + çalışma alanı hazırlığı

- Çalışma alanı çözümlenir ve oluşturulur; sandbox içinde çalışan çalıştırmalar bir sandbox çalışma alanı köküne yönlendirilebilir.
- Skills yüklenir (veya bir anlık görüntüden yeniden kullanılır) ve env ile prompt içine enjekte edilir.
- Bootstrap/context dosyaları çözümlenir ve sistem istemi raporuna enjekte edilir.
- Bir oturum yazma kilidi alınır; `SessionManager`, akış başlamadan önce açılır ve hazırlanır. Daha sonra gelen
  tüm transkript yeniden yazma, Compaction veya truncation yolları, transkript dosyasını açmadan veya
  değiştirmeden önce aynı kilidi almak zorundadır.

## Prompt oluşturma + sistem istemi

- Sistem istemi, OpenClaw'ın temel isteminden, Skills isteminden, bootstrap bağlamından ve çalıştırma başına geçersiz kılmalardan oluşturulur.
- Modele özgü sınırlar ve Compaction rezerv token'ları zorunlu kılınır.
- Modelin ne gördüğü için bkz. [Sistem istemi](/tr/concepts/system-prompt).

## Hook noktaları (nerede müdahale edebilirsiniz)

OpenClaw'ın iki hook sistemi vardır:

- **İç hook'lar** (Gateway hook'ları): komutlar ve yaşam döngüsü olayları için olay güdümlü script'ler.
- **Plugin hook'ları**: ajan/araç yaşam döngüsü ve gateway işlem hattı içindeki uzatma noktaları.

### İç hook'lar (Gateway hook'ları)

- **`agent:bootstrap`**: bootstrap dosyaları oluşturulurken, sistem istemi son hâline getirilmeden önce çalışır.
  Bunu, bootstrap bağlam dosyalarını eklemek/kaldırmak için kullanın.
- **Komut hook'ları**: `/new`, `/reset`, `/stop` ve diğer komut olayları (bkz. Hooks belgesi).

Kurulum ve örnekler için bkz. [Hooks](/tr/automation/hooks).

### Plugin hook'ları (ajan + gateway yaşam döngüsü)

Bunlar ajan döngüsü veya gateway işlem hattı içinde çalışır:

- **`before_model_resolve`**: model çözümlemesinden önce sağlayıcıyı/modeli deterministik olarak geçersiz kılmak için oturum öncesi (`messages` olmadan) çalışır.
- **`before_prompt_build`**: oturum yüklendikten sonra (`messages` ile) çalışır ve istem gönderiminden önce `prependContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` enjekte eder. Tur başına dinamik metin için `prependContext`, sistem istemi alanında durması gereken kararlı yönlendirme için sistem bağlamı alanlarını kullanın.
- **`before_agent_start`**: eski uyumluluk hook'udur; her iki aşamada da çalışabilir; bunun yerine yukarıdaki açık hook'ları tercih edin.
- **`before_agent_reply`**: satır içi eylemlerden sonra ve LLM çağrısından önce çalışır; bir Plugin'in turu sahiplenmesine ve sentetik bir yanıt döndürmesine veya turu tamamen sessize almasına izin verir.
- **`agent_end`**: tamamlandıktan sonra nihai mesaj listesini ve çalıştırma meta verilerini inceler.
- **`before_compaction` / `after_compaction`**: Compaction döngülerini gözlemler veya not düşer.
- **`before_tool_call` / `after_tool_call`**: araç parametrelerine/sonuçlarına müdahale eder.
- **`before_install`**: yerleşik tarama bulgularını inceler ve isteğe bağlı olarak Skill veya Plugin kurulumlarını engeller.
- **`tool_result_persist`**: araç sonuçları OpenClaw'a ait bir oturum transkriptine yazılmadan önce bunları eşzamanlı olarak dönüştürür.
- **`message_received` / `message_sending` / `message_sent`**: gelen + giden mesaj hook'ları.
- **`session_start` / `session_end`**: oturum yaşam döngüsü sınırları.
- **`gateway_start` / `gateway_stop`**: gateway yaşam döngüsü olayları.

Giden/araç korumaları için hook karar kuralları:

- `before_tool_call`: `{ block: true }` kesindir ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` bir no-op'tur ve önceki bir engeli temizlemez.
- `before_install`: `{ block: true }` kesindir ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` bir no-op'tur ve önceki bir engeli temizlemez.
- `message_sending`: `{ cancel: true }` kesindir ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` bir no-op'tur ve önceki bir iptali temizlemez.

Hook API'si ve kayıt ayrıntıları için bkz. [Plugin hook'ları](/tr/plugins/architecture-internals#provider-runtime-hooks).

Harness'ler bu hook'ları farklı şekilde uyarlayabilir. Codex app-server harness'i,
belgelenmiş yansıtılmış yüzeyler için uyumluluk sözleşmesi olarak OpenClaw Plugin hook'larını korurken,
Codex yerel hook'ları ayrı, daha alt düzey bir Codex mekanizması olarak kalır.

## Akış + kısmi yanıtlar

- Asistan delta'ları pi-agent-core'dan akıtılır ve `assistant` olayları olarak yayılır.
- Blok akışı, `text_end` veya `message_end` üzerinde kısmi yanıtlar yayabilir.
- Akıl yürütme akışı ayrı bir akış olarak veya blok yanıtları olarak yayılabilir.
- Parçalama ve blok yanıt davranışı için bkz. [Akış](/tr/concepts/streaming).

## Araç yürütme + mesajlaşma araçları

- Araç start/update/end olayları `tool` akışında yayılır.
- Araç sonuçları, günlükleme/yayımdan önce boyut ve görsel payload'ları açısından sanitize edilir.
- Mesajlaşma aracı gönderimleri, yinelenen asistan onaylarını bastırmak için izlenir.

## Yanıt şekillendirme + bastırma

- Nihai payload'lar şunlardan birleştirilir:
  - asistan metni (ve isteğe bağlı akıl yürütme)
  - satır içi araç özetleri (verbose + izin verildiğinde)
  - model hata verdiğinde asistan hata metni
- Tam sessiz belirteç `NO_REPLY` / `no_reply`, giden
  payload'lardan filtrelenir.
- Mesajlaşma aracı yinelenmeleri nihai payload listesinden kaldırılır.
- Gösterilebilir payload kalmazsa ve bir araç hata verdiyse, fallback bir araç hata yanıtı yayılır
  (bir mesajlaşma aracı zaten kullanıcıya görünür bir yanıt göndermediyse).

## Compaction + yeniden denemeler

- Otomatik Compaction, `compaction` akış olayları yayar ve bir yeniden denemeyi tetikleyebilir.
- Yeniden denemede, yinelenen çıktıyı önlemek için bellek içi tamponlar ve araç özetleri sıfırlanır.
- Compaction işlem hattı için bkz. [Compaction](/tr/concepts/compaction).

## Olay akışları (bugün)

- `lifecycle`: `subscribeEmbeddedPiSession` tarafından yayılır (ve fallback olarak `agentCommand` tarafından)
- `assistant`: pi-agent-core'dan akıtılan delta'lar
- `tool`: pi-agent-core'dan akıtılan araç olayları

## Sohbet kanalı işleme

- Asistan delta'ları sohbet `delta` mesajlarına tamponlanır.
- Bir sohbet `final`, **lifecycle end/error** üzerinde yayılır.

## Zaman aşımları

- `agent.wait` varsayılanı: 30 sn (yalnızca bekleme). `timeoutMs` parametresi bunu geçersiz kılar.
- Ajan çalışma zamanı: `agents.defaults.timeoutSeconds` varsayılanı 172800 sn (48 saat); `runEmbeddedPiAgent` içindeki abort zamanlayıcısında zorunlu kılınır.
- LLM boşta zaman aşımı: `agents.defaults.llm.idleTimeoutSeconds`, boşta kalma penceresi dolmadan önce yanıt parçası gelmezse bir model isteğini abort eder. Bunu yavaş yerel modeller veya akıl yürütme/araç çağrısı sağlayıcıları için açıkça ayarlayın; devre dışı bırakmak için `0` ayarlayın. Ayarlı değilse OpenClaw, yapılandırılmışsa `agents.defaults.timeoutSeconds` değerini, aksi halde 120 sn kullanır. Açık bir LLM veya ajan zaman aşımı olmayan Cron tetiklemeli çalıştırmalar, boşta izleyiciyi devre dışı bırakır ve Cron dış zaman aşımına güvenir.

## İşlerin erken bitebileceği yerler

- Ajan zaman aşımı (abort)
- AbortSignal (iptal)
- Gateway bağlantısının kopması veya RPC zaman aşımı
- `agent.wait` zaman aşımı (yalnızca bekleme, ajanı durdurmaz)

## İlgili

- [Araçlar](/tr/tools) — kullanılabilir ajan araçları
- [Hooks](/tr/automation/hooks) — ajan yaşam döngüsü olayları tarafından tetiklenen olay güdümlü script'ler
- [Compaction](/tr/concepts/compaction) — uzun konuşmaların nasıl özetlendiği
- [Yürütme Onayları](/tr/tools/exec-approvals) — shell komutları için onay geçitleri
- [Thinking](/tr/tools/thinking) — thinking/akıl yürütme düzeyi yapılandırması
