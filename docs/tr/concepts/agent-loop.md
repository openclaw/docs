---
read_when:
    - Aracı döngüsünün veya yaşam döngüsü olaylarının tam adım adım açıklamasına ihtiyacınız var
summary: Aracı döngüsünün yaşam döngüsü, akışlar ve bekleme semantiği
title: Agent Loop
x-i18n:
    generated_at: "2026-04-05T13:50:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e562e63c494881e9c345efcb93c5f972d69aaec61445afc3d4ad026b2d26883
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Agent Loop (OpenClaw)

Aracısal bir döngü, bir aracının tam “gerçek” çalıştırmasıdır: alım → bağlam derleme → model çıkarımı →
araç yürütme → akış halinde yanıtlar → kalıcılık. Bu, oturum durumunu tutarlı tutarken bir mesajı
eylemlere ve nihai yanıta dönüştüren yetkili yoldur.

OpenClaw’da bir döngü, oturum başına tek ve serileştirilmiş bir çalıştırmadır; model düşünürken,
araç çağırırken ve çıktı akışı yaparken yaşam döngüsü ve akış olayları üretir. Bu belge, bu özgün
döngünün uçtan uca nasıl bağlandığını açıklar.

## Giriş noktaları

- Gateway RPC: `agent` ve `agent.wait`.
- CLI: `agent` komutu.

## Nasıl çalışır (üst düzey)

1. `agent` RPC parametreleri doğrular, oturumu çözümler (sessionKey/sessionId), oturum meta verilerini kalıcı hale getirir ve hemen `{ runId, acceptedAt }` döndürür.
2. `agentCommand` aracı çalıştırır:
   - model + thinking/verbose varsayılanlarını çözümler
   - Skills anlık görüntüsünü yükler
   - `runEmbeddedPiAgent` çağırır (pi-agent-core çalışma zamanı)
   - gömülü döngü bir tane üretmezse **yaşam döngüsü end/error** yayar
3. `runEmbeddedPiAgent`:
   - çalıştırmaları oturum başına + genel kuyruklar aracılığıyla serileştirir
   - model + auth profile çözümler ve pi oturumunu oluşturur
   - pi olaylarına abone olur ve assistant/tool delta’larını akış halinde iletir
   - zaman aşımını uygular -> aşılırsa çalıştırmayı durdurur
   - yükleri + kullanım meta verilerini döndürür
4. `subscribeEmbeddedPiSession`, pi-agent-core olaylarını OpenClaw `agent` akışına köprüler:
   - araç olayları => `stream: "tool"`
   - assistant delta’ları => `stream: "assistant"`
   - yaşam döngüsü olayları => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait`, `waitForAgentRun` kullanır:
   - `runId` için **yaşam döngüsü end/error** bekler
   - `{ status: ok|error|timeout, startedAt, endedAt, error? }` döndürür

## Kuyruklama + eşzamanlılık

- Çalıştırmalar oturum anahtarı başına (oturum hattı) ve isteğe bağlı olarak genel bir hat üzerinden serileştirilir.
- Bu, araç/oturum yarışlarını önler ve oturum geçmişini tutarlı tutar.
- Mesajlaşma kanalları, bu hat sistemine beslenen kuyruk modlarını (collect/steer/followup) seçebilir.
  Bkz. [Command Queue](/concepts/queue).

## Oturum + çalışma alanı hazırlığı

- Çalışma alanı çözümlenir ve oluşturulur; sandbox içindeki çalıştırmalar sandbox çalışma alanı köküne yönlendirilebilir.
- Skills yüklenir (veya bir anlık görüntüden yeniden kullanılır) ve env ile prompt içine eklenir.
- Bootstrap/bağlam dosyaları çözümlenir ve sistem prompt raporuna eklenir.
- Bir oturum yazma kilidi alınır; `SessionManager`, akış başlamadan önce açılır ve hazırlanır.

## Prompt derleme + sistem prompt’u

- Sistem prompt’u, OpenClaw’ın temel prompt’undan, Skills prompt’undan, bootstrap bağlamından ve çalıştırma başına geçersiz kılmalardan oluşturulur.
- Modele özgü sınırlar ve compaction rezerv token’ları uygulanır.
- Modelin ne gördüğü için bkz. [System prompt](/concepts/system-prompt).

## Hook noktaları (nerede araya girebilirsiniz)

OpenClaw’ın iki hook sistemi vardır:

- **Internal hooks** (Gateway hook’ları): komutlar ve yaşam döngüsü olayları için olay odaklı script’ler.
- **Plugin hooks**: aracı/araç yaşam döngüsü ve gateway işlem hattı içindeki genişletme noktaları.

### Internal hooks (Gateway hook’ları)

- **`agent:bootstrap`**: sistem prompt’u son halini almadan önce bootstrap dosyaları oluşturulurken çalışır.
  Bunu bootstrap bağlam dosyaları eklemek/çıkarmak için kullanın.
- **Komut hook’ları**: `/new`, `/reset`, `/stop` ve diğer komut olayları (bkz. Hooks belgesi).

Kurulum ve örnekler için bkz. [Hooks](/tr/automation/hooks).

### Plugin hooks (agent + gateway yaşam döngüsü)

Bunlar aracı döngüsü veya gateway işlem hattı içinde çalışır:

- **`before_model_resolve`**: model çözümlemesinden önce sağlayıcıyı/modeli deterministik olarak geçersiz kılmak için oturum öncesi (`messages` olmadan) çalışır.
- **`before_prompt_build`**: prompt gönderiminden önce `prependContext`, `systemPrompt`, `prependSystemContext` veya `appendSystemContext` eklemek için oturum yüklendikten sonra (`messages` ile) çalışır. Tur başına dinamik metin için `prependContext` kullanın; sistem prompt alanında yer alması gereken kararlı yönlendirme için system-context alanlarını kullanın.
- **`before_agent_start`**: eski uyumluluk hook’udur; her iki aşamada da çalışabilir; bunun yerine yukarıdaki açık hook’ları tercih edin.
- **`before_agent_reply`**: satır içi eylemlerden sonra ve LLM çağrısından önce çalışır; bir plugin’in turu sahiplenmesine ve sentetik bir yanıt döndürmesine veya turu tamamen sessize almasına izin verir.
- **`agent_end`**: tamamlandıktan sonra nihai mesaj listesini ve çalıştırma meta verilerini inceler.
- **`before_compaction` / `after_compaction`**: compaction döngülerini gözlemler veya açıklama ekler.
- **`before_tool_call` / `after_tool_call`**: araç parametrelerine/sonuçlarına araya girer.
- **`before_install`**: yerleşik tarama bulgularını inceler ve gerekirse skill veya plugin kurulumlarını engeller.
- **`tool_result_persist`**: araç sonuçları oturum transkriptine yazılmadan önce bunları eşzamanlı olarak dönüştürür.
- **`message_received` / `message_sending` / `message_sent`**: gelen + giden mesaj hook’ları.
- **`session_start` / `session_end`**: oturum yaşam döngüsü sınırları.
- **`gateway_start` / `gateway_stop`**: gateway yaşam döngüsü olayları.

Giden/araç korumaları için hook karar kuralları:

- `before_tool_call`: `{ block: true }` sondur ve daha düşük öncelikli işleyicileri durdurur.
- `before_tool_call`: `{ block: false }` işlem yapmayan bir no-op’tur ve önceki bir engeli temizlemez.
- `before_install`: `{ block: true }` sondur ve daha düşük öncelikli işleyicileri durdurur.
- `before_install`: `{ block: false }` işlem yapmayan bir no-op’tur ve önceki bir engeli temizlemez.
- `message_sending`: `{ cancel: true }` sondur ve daha düşük öncelikli işleyicileri durdurur.
- `message_sending`: `{ cancel: false }` işlem yapmayan bir no-op’tur ve önceki bir iptali temizlemez.

Hook API’si ve kayıt ayrıntıları için bkz. [Plugin hooks](/plugins/architecture#provider-runtime-hooks).

## Akış + kısmi yanıtlar

- Assistant delta’ları pi-agent-core’dan akış halinde gelir ve `assistant` olayları olarak yayımlanır.
- Blok akışı, `text_end` veya `message_end` üzerinde kısmi yanıtlar yayımlayabilir.
- Muhakeme akışı ayrı bir akış olarak veya blok yanıtları olarak yayımlanabilir.
- Parçalama ve blok yanıt davranışı için bkz. [Streaming](/concepts/streaming).

## Araç yürütme + mesajlaşma araçları

- Araç başlangıç/güncelleme/bitiş olayları `tool` akışında yayımlanır.
- Araç sonuçları, günlüklenmeden/yayımlanmadan önce boyut ve görsel yükleri açısından temizlenir.
- Mesajlaşma aracı gönderimleri, yinelenen assistant onaylarını bastırmak için izlenir.

## Yanıt şekillendirme + bastırma

- Nihai yükler şunlardan derlenir:
  - assistant metni (ve isteğe bağlı muhakeme)
  - satır içi araç özetleri (verbose + izinliyse)
  - model hata verirse assistant hata metni
- Tam sessiz belirteç `NO_REPLY` / `no_reply`, giden
  yüklerden filtrelenir.
- Mesajlaşma aracı tekrarları nihai yük listesinden kaldırılır.
- İşlenebilir hiç yük kalmazsa ve bir araç hata verdiyse, yedek bir araç hata yanıtı yayımlanır
  (bir mesajlaşma aracı zaten kullanıcıya görünür bir yanıt göndermediyse).

## Compaction + yeniden denemeler

- Otomatik compaction, `compaction` akış olayları üretir ve yeniden denemeyi tetikleyebilir.
- Yeniden denemede, yinelenen çıktıyı önlemek için bellek içi tamponlar ve araç özetleri sıfırlanır.
- Compaction işlem hattı için bkz. [Compaction](/concepts/compaction).

## Olay akışları (bugün)

- `lifecycle`: `subscribeEmbeddedPiSession` tarafından yayımlanır (ve yedek olarak `agentCommand` tarafından)
- `assistant`: pi-agent-core’dan akış halinde gelen delta’lar
- `tool`: pi-agent-core’dan akış halinde gelen araç olayları

## Sohbet kanalı işleme

- Assistant delta’ları sohbet `delta` mesajları içine tamponlanır.
- Sohbet `final`, **lifecycle end/error** durumunda yayımlanır.

## Zaman aşımları

- `agent.wait` varsayılanı: 30s (yalnızca bekleme). `timeoutMs` parametresi geçersiz kılar.
- Agent çalışma zamanı: `agents.defaults.timeoutSeconds` varsayılanı 172800s (48 saat); `runEmbeddedPiAgent` iptal zamanlayıcısında uygulanır.

## İşlerin erken bitebileceği yerler

- Agent zaman aşımı (iptal)
- AbortSignal (iptal)
- Gateway bağlantısının kesilmesi veya RPC zaman aşımı
- `agent.wait` zaman aşımı (yalnızca bekleme, agent’ı durdurmaz)

## İlgili

- [Tools](/tools) — kullanılabilir agent araçları
- [Hooks](/tr/automation/hooks) — agent yaşam döngüsü olaylarıyla tetiklenen olay odaklı script’ler
- [Compaction](/concepts/compaction) — uzun konuşmaların nasıl özetlendiği
- [Exec Approvals](/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Thinking](/tools/thinking) — thinking/muhakeme düzeyi yapılandırması
