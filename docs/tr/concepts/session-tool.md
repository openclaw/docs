---
read_when:
    - Temsilcinin hangi oturum araçlarına sahip olduğunu anlamak istiyorsunuz
    - Oturumlar arası erişimi veya alt ajan oluşturmayı yapılandırmak istiyorsunuz
    - Başlatılan alt aracının durumunu incelemek istiyorsunuz
summary: Oturumlar arası durum, hatırlama, mesajlaşma ve alt ajan orkestrasyonu için ajan araçları
title: Oturum araçları
x-i18n:
    generated_at: "2026-07-16T17:22:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb0827e2eff6e53d3e7ef6f7d7f0497d8b431fcb23cb4b54c5851229086423cc
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw, aracılara oturumlar arasında çalışma, durumu inceleme ve alt aracıları yönetme araçları sağlar.

## Kullanılabilir araçlar

| Araç               | İşlevi                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | İsteğe bağlı filtrelerle oturumları listeler (tür, etiket, aracı, arşiv, önizleme)  |
| `sessions_history` | Belirli bir oturumun dökümünü okur                                   |
| `sessions_send`    | Başka bir oturuma mesaj gönderir ve isteğe bağlı olarak bekler                       |
| `sessions_spawn`   | Arka plan çalışması için yalıtılmış bir alt aracı oturumu başlatır                     |
| `sessions_yield`   | Geçerli turu sonlandırır ve sonraki alt aracı sonuçlarını bekler               |
| `subagents`        | Bu oturum için başlatılan alt aracıların durumunu listeler                              |
| `session_status`   | `/status` tarzında bir kart gösterir ve isteğe bağlı olarak oturum başına model geçersiz kılması ayarlar |

Bu araçlar yine etkin araç profiline ve izin verme/reddetme politikasına tabidir. `tools.profile: "coding"`, `sessions_spawn`, `sessions_yield` ve `subagents` dahil olmak üzere tam oturum yönetimi kümesini içerir. `tools.profile: "messaging"`, oturumlar arası mesajlaşma araçlarını (`sessions_list`, `sessions_history`, `sessions_send`, `session_status`) içerir ancak alt aracı başlatmayı içermez. Bir mesajlaşma profilini korurken yerel yetkilendirmeye de izin vermek için şunu ekleyin:

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

Grup, sağlayıcı, korumalı alan ve aracı başına politikalar, profil aşamasından sonra da bu araçları kaldırabilir. Etkin araç listesini incelemek için etkilenen oturumdan `/tools` kullanın.

## Oturumları listeleme ve okuma

`sessions_list`, oturumları anahtarları, agentId, türleri, kanalları, modelleri, token sayıları ve zaman damgalarıyla döndürür. `kinds` (dizi; kabul edilen değerler: `main`, `group`, `cron`, `hook`, `node`, `other`), tam `label`, tam `agentId`, `search` metni veya yakınlık (`activeMinutes`) ölçütlerine göre filtreleyin. Varsayılan olarak etkin oturumlar döndürülür; bunun yerine arşivlenmiş oturumları incelemek için `archived: true` geçirin. Satırlar `pinned` ve `archived` durumunu içerir. Posta kutusu tarzında önceliklendirme gerektiğinde `includeDerivedTitles`, `includeLastMessage` veya `messageLimit` (en fazla 20) ayarlayın: görünürlük kapsamlı türetilmiş bir başlık, son mesajın önizleme parçacığı veya her satırdaki sınırlı sayıdaki son mesaj. Türetilmiş başlıklar ve önizlemeler yalnızca çağıranın yapılandırılmış oturum aracı görünürlük politikası kapsamında zaten görebildiği oturumlar için üretilir; böylece ilgisiz oturumlar gizli kalır. Görünürlük kısıtlandığında `sessions_list`, etkin modu ve sonuçların kapsamla sınırlı olabileceğine ilişkin bir uyarıyı gösteren isteğe bağlı `visibility` meta verilerini döndürür.

`sessions_history`, belirli bir oturumun konuşma dökümünü getirir. Varsayılan olarak araç sonuçları hariç tutulur; bunları görmek için `includeTools: true` geçirin. Sınırlandırılmış en yeni son bölüm için `limit` kullanın. Sayfalama meta verilerine ihtiyaç duyduğunuzda `offset: 0` geçirin; ardından ham döküm dosyalarını okumadan eski OpenClaw döküm pencerelerinde geriye doğru sayfalama yapmak için döndürülen `nextOffset` değerlerini geçirin. Açık ofset sayfaları harici CLI geri dönüş içe aktarımlarını birleştirmez; bu birleştirilmiş görüntüleme geçmişine ihtiyaç duyduğunuzda varsayılan en yeni son bölüm görünümünü (`offset` olmadan) kullanın.

Döndürülen görünüm kasıtlı olarak sınırlandırılmış ve güvenlik filtrelerinden geçirilmiştir:

- aracı metni geri çağırmadan önce normalleştirilir:
  - düşünme etiketleri kaldırılır
  - `<relevant-memories>` / `<relevant_memories>` iskele blokları kaldırılır
  - `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>` ve `<function_calls>...</function_calls>` gibi düz metin araç çağrısı XML yük blokları, düzgün şekilde kapanmayan kesilmiş yükler dahil olmak üzere kaldırılır
  - `[Tool Call: ...]`, `[Tool Result ...]` ve `[Historical context ...]` gibi indirgenmiş araç çağrısı/sonuç iskeleleri kaldırılır
  - `<|assistant|>` gibi sızdırılmış model denetim token'ları, diğer ASCII `<|...|>` token'ları ve tam genişlikli `<｜...｜>` çeşitleri kaldırılır
  - `<invoke ...>` / `</minimax:tool_call>` gibi hatalı biçimlendirilmiş MiniMax araç çağrısı XML'leri kaldırılır
- kimlik bilgisi/token benzeri metinler döndürülmeden önce gizlenir
- uzun metin blokları kesilir
- çok büyük geçmişlerde eski satırlar çıkarılabilir veya aşırı büyük bir satır `[sessions_history omitted: message too large]` ile değiştirilebilir
- araç; `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes` gibi özet bayrakları ve sayfalama meta verilerini bildirir

Her iki araç da bir **oturum anahtarını** (`"main"` gibi) veya önceki bir liste çağrısından alınan **oturum kimliğini** kabul eder.

Tam ham döküme ihtiyaç duyuyorsanız `sessions_history` öğesini filtrelenmemiş bir döküm olarak değerlendirmek yerine kapsamlı SQLite döküm satırlarını inceleyin.

## Oturumlar arası mesaj gönderme

`sessions_send`, başka bir oturuma mesaj iletir ve isteğe bağlı olarak yanıtı bekler:

- **Gönder ve unut:** sıraya ekleyip hemen dönmek için `timeoutSeconds: 0` ayarlayın.
- **Yanıtı bekle:** bir zaman aşımı ayarlayın ve yanıtı satır içinde alın.

Anahtarları `:thread:<id>` ile bitenler gibi ileti dizisi kapsamlı sohbet oturumları, geçerli `sessions_send` hedefleri değildir. Araç üzerinden yönlendirilen mesajların insanlara yönelik etkin bir ileti dizisinde görünmemesi için aracılar arası koordinasyonda üst kanal oturumu anahtarını kullanın.

Mesajlar ve A2A takip yanıtları, alıcı isteminde (`[Inter-session message ... isUser=false]`) ve döküm kaynağında oturumlar arası veri olarak işaretlenir. Alıcı aracı bunları doğrudan son kullanıcı tarafından yazılmış talimatlar olarak değil, araç üzerinden yönlendirilmiş veriler olarak değerlendirmelidir.

Hedef yanıt verdikten sonra OpenClaw, aracıların sırayla mesaj gönderdiği bir **geri yanıtlama döngüsü** çalıştırabilir (`session.agentToAgent.maxPingPongTurns` değerine kadar, aralık 0-20, varsayılan 5). Hedef aracı erken durdurmak için `REPLY_SKIP` yanıtını verebilir.

Göndereni hedefin durum değişikliği izleyicisi olarak da kaydetmek için `watch: true` geçirin: başka bir aktör daha sonra hedefe doğrudan insan mesajı gönderdiğinde veya hedefin amacını değiştirdiğinde gönderen, `session_status` `changesSince` öğesine işaret eden bir sistem bildirimi alır. Kayıt başarılı gönderimden sonra gerçekleşir, mesajı gerçekten alan oturumu hedefler ve oturumun geçerli durum sürümünden başlar; dolayısıyla yalnızca sonraki değişiklikler bildirim üretir. Sonuç, kayıt başarılı olduğunda `watched: true` bildirir. Bkz. [Oturum durumu farkındalığı](/concepts/session-state).

## Durum ve yönetim yardımcıları

`session_status`, geçerli veya başka bir görünür oturum için hafif bir `/status` eşdeğeri araçtır. Kullanımı, zamanı, model/çalışma zamanı durumunu ve varsa bağlantılı arka plan görevi bağlamını bildirir. `/status` gibi, seyrek token/önbellek sayaçlarını en son döküm kullanım girdisinden tamamlayabilir ve `model=default` oturum başına geçersiz kılmayı temizler. Çağıranın geçerli oturumu için `sessionKey="current"` kullanın; `openclaw-tui` gibi görünür istemci etiketleri oturum anahtarı değildir.

Rota meta verileri kullanılabildiğinde `session_status`, ayrıca görünür bir `Route context` JSON bloğu ve bununla eşleşen yapılandırılmış `details` alanlarını içerir. Bu alanlar, oturum anahtarını canlı çalışmayı o anda işleyen rotadan ayırt eder:

- `origin`, oturumun oluşturulduğu yerdir veya eski durumda saklanmış kaynak meta verileri yoksa teslim edilebilir oturum anahtarı önekinden çıkarılan sağlayıcıdır.
- `active`, geçerli canlı çalışma rotasıdır. Yalnızca şu anda işlenen canlı veya geçerli oturum için bildirilir.
- `deliveryContext`, oturumda saklanan kalıcı teslimat rotasıdır; OpenClaw, etkin yüzey farklı olsa bile bunu sonraki teslimatlarda yeniden kullanabilir.

## Oturum durumu değişiklikleri

OpenClaw, önemli oturum durumu değişikliklerinin (izlenen oturumlara gönderilen doğrudan insan mesajları, alt çalışma sonuçları, amaç değişiklikleri, Compaction) kalıcı bir sinyal günlüğünü tutar. `sessions_list` satırları ve `session_status`, oturumun `stateVersion` değerini gösterir; `session_status` ise bu sürümden sonraki türü belirlenmiş olayları döndürmek için `changesSince: <version>` kabul eder ve istenen sürüm saklanan geçmişten daha eski olduğunda bunu tam olarak `historyGap` ile bildirir. İzleyiciler — başlatan üst aracılar otomatik olarak, `sessions_send watch: true` açıkça — başka bir aktör izlenen bir oturumu değiştirdiğinde birleştirilmiş tek bir eski durum bildirimi alır.

Tam model için [Oturum durumu farkındalığı](/concepts/session-state) bölümüne bakın: olay türleri, izleyici kaydı, istenmeyen bildirimleri önleme protokolü, uzlaştırma akışı ve geçerli sınırlar.

`sessions_yield`, sonraki mesajın beklediğiniz takip olayı olabilmesi için geçerli turu kasıtlı olarak sonlandırır. Tamamlanma sonuçlarının yoklama döngüleri oluşturmak yerine sonraki mesaj olarak gelmesini istediğinizde alt aracıları başlattıktan sonra bunu kullanın.

`subagents`, daha önce başlatılmış OpenClaw alt aracıları için görünürlük yardımcısıdır. Etkin/son çalışmaları incelemek üzere `action: "list"` desteği sunar.

## Alt aracıları başlatma

`sessions_spawn`, varsayılan olarak bir arka plan görevi için yalıtılmış bir oturum oluşturur. Her zaman engellemesizdir; hemen bir `runId` ve `childSessionKey` ile döner. Yerel alt aracı çalışmaları, devredilen görevi alt oturumun ilk görünür `[Subagent Task]` mesajında alırken sistem istemi yalnızca alt aracı çalışma zamanı kurallarını ve yönlendirme bağlamını taşır.

Temel seçenekler:

- Harici yürütme düzeni aracıları için `runtime: "subagent"` (varsayılan) veya `"acp"`.
- Alt oturum için `model` ve `thinking` geçersiz kılmaları.
- Başlatmayı bir sohbet ileti dizisine (Discord, Slack vb.) bağlamak için `thread: true`.
- Alt aracıda korumalı alan kullanımını zorunlu kılmak için `sandbox: "require"`.
- Alt aracının geçerli istekte bulunanın dökümüne ihtiyaç duyduğu durumlarda yerel alt aracılar için `context: "fork"`; temiz bir alt aracı için bunu atlayın veya `context: "isolated"` kullanın. `context: "fork"` yalnızca `runtime: "subagent"` ile geçerlidir. İletişim dizisine bağlı yerel alt aracılar, `threadBindings.defaultSpawnContext` aksini belirtmedikçe varsayılan olarak `context: "fork"` kullanır.

Varsayılan yaprak alt aracılara oturum araçları verilmez. `maxSpawnDepth >= 2` olduğunda, 1. derinlikteki yönetici alt aracılar kendi alt aracılarını yönetebilmeleri için ayrıca `sessions_spawn`, `subagents`, `sessions_list` ve `sessions_history` alır. Yaprak çalışmalar yinelemeli yönetim araçlarını yine de almaz.

Tamamlanmadan sonra bir duyuru adımı, sonucu istekte bulunanın kanalına gönderir. Tamamlanma teslimatı, kullanılabildiğinde bağlı ileti dizisi/konu yönlendirmesini korur; tamamlanmanın kaynağı yalnızca bir kanalı tanımlıyorsa OpenClaw, doğrudan teslimat için istekte bulunan oturumun saklanan rotasını (`lastChannel` / `lastTo`) yine de yeniden kullanabilir.

ACP'ye özgü davranış için [ACP Aracıları](/tr/tools/acp-agents) bölümüne bakın.

## Görünürlük

Oturum araçlarının kapsamı, aracının görebileceklerini sınırlandıracak şekilde belirlenir:

| Düzey   | Kapsam                                    |
| ------- | ---------------------------------------- |
| `self`  | Yalnızca geçerli oturum                 |
| `tree`  | Geçerli oturum + başlatılmış alt aracılar     |
| `agent` | Bu aracının tüm oturumları              |
| `all`   | Tüm oturumlar (yapılandırılmışsa aracılar arası) |

Varsayılan değer `tree` şeklindedir. Korumalı alan oturumları, yapılandırmadan bağımsız olarak `tree` ile sınırlandırılır.

## Ek kaynaklar

- [Oturum Yönetimi](/tr/concepts/session): yönlendirme, yaşam döngüsü, bakım
- [Alt aracılar](/tr/tools/subagents): alt oturum yaşam döngüsü ve teslimi
- [ACP Aracıları](/tr/tools/acp-agents): harici çalıştırma düzeneği başlatma
- [Çok aracılı](/tr/concepts/multi-agent): çok aracılı mimari
- [Gateway Yapılandırması](/tr/gateway/configuration): oturum aracı yapılandırma ayarları

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
