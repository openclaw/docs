---
read_when:
    - Düşünme, fast-mode veya verbose yönergesi ayrıştırmasını ya da varsayılanlarını ayarlama
summary: 'Yönerge söz dizimi: /think, /fast, /verbose, /trace ve akıl yürütme görünürlüğü'
title: Düşünme seviyeleri
x-i18n:
    generated_at: "2026-05-10T19:59:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e2360a260aaf4571f2da6c7519fb4987e4c8c7947e3dc37f94a0ad260ad55
    source_path: tools/thinking.md
    workflow: 16
---

## Ne işe yarar

- Herhangi bir gelen gövdede satır içi yönerge: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Seviyeler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (azami bütçe)
  - xhigh → "ultrathink+" (GPT-5.2+ ve Codex modelleri, ayrıca Anthropic Claude Opus 4.7 eforu)
  - adaptive → sağlayıcı tarafından yönetilen uyarlamalı düşünme (Anthropic/Bedrock üzerinde Claude 4.6, Anthropic Claude Opus 4.7 ve Google Gemini dinamik düşünme için desteklenir)
  - max → sağlayıcı azami akıl yürütmesi (Anthropic Claude Opus 4.7; Ollama bunu en yüksek yerel `think` eforuna eşler)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` değerine eşlenir.
  - `highest`, `high` değerine eşlenir.
- Sağlayıcı notları:
  - Düşünme menüleri ve seçicileri sağlayıcı profili tarafından yönlendirilir. Sağlayıcı Plugin'leri, ikili `on` gibi etiketler dahil seçili model için tam seviye kümesini bildirir.
  - `adaptive`, `xhigh` ve `max` yalnızca bunları destekleyen sağlayıcı/model profilleri için gösterilir. Desteklenmeyen seviyeler için yazılan yönergeler, o modelin geçerli seçenekleriyle birlikte reddedilir.
  - Var olan kayıtlı desteklenmeyen seviyeler, sağlayıcı profili sırasına göre yeniden eşlenir. `adaptive`, uyarlamalı olmayan modellerde `medium` değerine geri dönerken `xhigh` ve `max`, seçili model için desteklenen en büyük `off` olmayan seviyeye geri döner.
  - Anthropic Claude 4.6 modelleri, açık bir düşünme seviyesi ayarlanmadığında varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.7 varsayılan olarak uyarlamalı düşünme kullanmaz. Açıkça bir düşünme seviyesi ayarlamadığınız sürece API efor varsayılanı sağlayıcının sorumluluğunda kalır.
  - Anthropic Claude Opus 4.7, `/think xhigh` değerini uyarlamalı düşünme ve `output_config.effort: "xhigh"` olarak eşler; çünkü `/think` bir düşünme yönergesidir ve `xhigh`, Opus 4.7 efor ayarıdır.
  - Anthropic Claude Opus 4.7 ayrıca `/think max` sunar; bu, aynı sağlayıcıya ait azami efor yoluna eşlenir.
  - Doğrudan DeepSeek V4 modelleri `/think xhigh|max` sunar; ikisi de DeepSeek `reasoning_effort: "max"` değerine eşlenirken daha düşük `off` olmayan seviyeler `high` değerine eşlenir.
  - OpenRouter üzerinden yönlendirilen DeepSeek V4 modelleri `/think xhigh` sunar ve OpenRouter destekli `reasoning_effort` değerlerini gönderir. Kayıtlı `max` geçersiz kılmaları `xhigh` değerine geri döner.
  - Ollama düşünme yeteneği olan modeller `/think low|medium|high|max` sunar; `max`, yerel `think: "high"` değerine eşlenir çünkü Ollama'nın yerel API'si `low`, `medium` ve `high` efor dizgelerini kabul eder.
  - OpenAI GPT modelleri, `/think` yönergesini modele özgü Responses API efor desteği üzerinden eşler. `/think off`, yalnızca hedef model desteklediğinde `reasoning.effort: "none"` gönderir; aksi halde OpenClaw desteklenmeyen bir değer göndermek yerine devre dışı akıl yürütme yükünü çıkarır.
  - Özel OpenAI uyumlu katalog girdileri, `models.providers.<provider>.models[].compat.supportedReasoningEfforts` değerini `"xhigh"` içerecek şekilde ayarlayarak `/think xhigh` desteğini etkinleştirebilir. Bu, giden OpenAI akıl yürütme efor yüklerini eşleyen aynı uyumluluk üst verisini kullanır; böylece menüler, oturum doğrulaması, ajan CLI'ı ve `llm-task` taşıma davranışıyla uyumlu olur.
  - Eski yapılandırılmış OpenRouter Hunter Alpha ref'leri proxy akıl yürütme enjeksiyonunu atlar; çünkü emekli edilen bu rota, nihai yanıt metnini akıl yürütme alanları üzerinden döndürebilirdi.
  - Google Gemini, `/think adaptive` değerini Gemini'nin sağlayıcıya ait dinamik düşünmesine eşler. Gemini 3 istekleri sabit bir `thinkingLevel` çıkarır; Gemini 2.5 istekleri ise `thinkingBudget: -1` gönderir; sabit seviyeler yine de o model ailesi için en yakın Gemini `thinkingLevel` değerine veya bütçesine eşlenir.
  - Anthropic uyumlu akış yolundaki MiniMax (`minimax/*`), model parametrelerinde veya istek parametrelerinde açıkça düşünme ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax'in yerel olmayan Anthropic akış biçiminden `reasoning_content` deltalarının sızmasını önler.
  - Z.AI (`zai/*`) yalnızca ikili düşünmeyi (`on`/`off`) destekler. `off` olmayan her seviye `on` olarak ele alınır (`low` değerine eşlenir).
  - Moonshot (`moonshot/*`), `/think off` değerini `thinking: { type: "disabled" }` olarak ve `off` olmayan her seviyeyi `thinking: { type: "enabled" }` olarak eşler. Düşünme etkinleştirildiğinde Moonshot yalnızca `tool_choice` için `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalleştirir.

## Çözümleme sırası

1. Mesajdaki satır içi yönerge (yalnızca o mesaja uygulanır).
2. Oturum geçersiz kılması (yalnızca yönerge içeren bir mesaj gönderilerek ayarlanır).
3. Ajan başına varsayılan (yapılandırmada `agents.list[].thinkingDefault`).
4. Genel varsayılan (yapılandırmada `agents.defaults.thinkingDefault`).
5. Geri dönüş: varsa sağlayıcının bildirdiği varsayılan; aksi halde akıl yürütme yeteneği olan modeller `medium` değerine veya o model için desteklenen en yakın `off` olmayan seviyeye çözülür, akıl yürütmeyen modeller ise `off` kalır.

## Oturum varsayılanı ayarlama

- **Yalnızca** yönergeden oluşan bir mesaj gönderin (boşluklara izin verilir), ör. `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalıcı olur (varsayılan olarak gönderen başına). Oturum geçersiz kılmasını temizlemek ve yapılandırılmış/sağlayıcı varsayılanını devralmak için `/think default` kullanın; takma adlar arasında `inherit`, `clear`, `reset` ve `unpin` bulunur.
- `/think off` açık bir kapalı geçersiz kılması kaydeder. Oturum geçersiz kılmasını değiştirene veya temizleyene kadar düşünmeyi devre dışı bırakır.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Seviye geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değiştirilmeden bırakılır.
- Geçerli düşünme seviyesini görmek için argümansız `/think` (veya `/think:`) gönderin.

## Ajan tarafından uygulama

- **Gömülü Pi**: çözümlenen seviye, işlem içi Pi ajan çalışma zamanına aktarılır.
- **Claude CLI arka ucu**: `claude-cli` kullanılırken `off` olmayan seviyeler Claude Code'a `--effort` olarak aktarılır; bkz. [CLI arka uçları](/tr/gateway/cli-backends).

## Hızlı mod (/fast)

- Seviyeler: `on|off|default`.
- Yalnızca yönerge içeren mesaj bir oturum hızlı mod geçersiz kılmasını açıp kapatır ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir. Oturum geçersiz kılmasını temizlemek ve yapılandırılmış varsayılanı devralmak için `/fast default` kullanın; takma adlar arasında `inherit`, `clear`, `reset` ve `unpin` bulunur.
- Geçerli etkin hızlı mod durumunu görmek için mod belirtmeden `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca yönerge `/fast on|off` geçersiz kılması (`/fast default` bu katmanı temizler)
  2. Oturum geçersiz kılması
  3. Ajan başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- `openai-codex/*` için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. OpenClaw iki kimlik doğrulama yolu arasında tek bir ortak `/fast` anahtarı tutar.
- `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dahil doğrudan genel `anthropic/*` istekleri için hızlı mod Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto` ayarlar; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model parametreleri, ikisi de ayarlandığında hızlı mod varsayılanını geçersiz kılar. OpenClaw yine de Anthropic olmayan proxy taban URL'leri için Anthropic hizmet katmanı enjeksiyonunu atlar.
- `/status`, yalnızca hızlı mod etkin olduğunda `Fast` gösterir.

## Ayrıntılı yönergeler (/verbose veya /v)

- Seviyeler: `on` (asgari) | `full` | `off` (varsayılan).
- Yalnızca yönerge içeren mesaj oturum ayrıntılı günlüğünü açıp kapatır ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz seviyeler durumu değiştirmeden bir ipucu döndürür.
- `/verbose off` açık bir oturum geçersiz kılması kaydeder; Sessions arayüzünde `inherit` seçerek temizleyin.
- Satır içi yönerge yalnızca o mesajı etkiler; aksi halde oturum/genel varsayılanlar uygulanır.
- Geçerli ayrıntılı düzeyi görmek için argümansız `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı mod açıkken, yapılandırılmış araç sonuçları yayan ajanlar (Pi, diğer JSON ajanları), kullanılabildiğinde `<emoji> <tool-name>: <arg>` önekiyle her araç çağrısını kendi yalnızca üst veri mesajı olarak geri gönderir. Bu araç özetleri her araç başlar başlamaz gönderilir (ayrı baloncuklar), akış deltaları olarak değil.
- Araç hata özetleri normal modda görünür kalır, ancak ham hata ayrıntısı sonekleri ayrıntılı mod `on` veya `full` olmadıkça gizlenir.
- Ayrıntılı mod `full` olduğunda, araç çıktıları da tamamlandıktan sonra iletilir (ayrı baloncuk, güvenli bir uzunluğa kırpılmış). Bir çalışma sürerken `/verbose on|full|off` anahtarını değiştirirseniz sonraki araç baloncukları yeni ayara uyar.
- `agents.defaults.toolProgressDetail`, `/verbose` araç özetlerinin ve ilerleme taslağı araç satırlarının biçimini denetler. `🛠️ Exec: checking JS syntax` gibi kısa insan etiketleri için `"explain"` (varsayılan) kullanın; hata ayıklama için ham komut/ayrıntının da eklenmesini istediğinizde `"raw"` kullanın. Ajan başına `agents.list[].toolProgressDetail` varsayılanı geçersiz kılar.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin izleme yönergeleri (/trace)

- Seviyeler: `on` | `off` (varsayılan).
- Yalnızca yönerge içeren mesaj oturum Plugin izleme çıktısını açıp kapatır ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi yönerge yalnızca o mesajı etkiler; aksi halde oturum/genel varsayılanlar uygulanır.
- Geçerli izleme düzeyini görmek için argümansız `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose` yönergesinden daha dardır: yalnızca Active Memory hata ayıklama özetleri gibi Plugin'e ait izleme/hata ayıklama satırlarını gösterir.
- İzleme satırları `/status` içinde ve normal asistan yanıtından sonra izleyen bir tanılama mesajı olarak görünebilir.

## Akıl yürütme görünürlüğü (/reasoning)

- Seviyeler: `on|off|stream`.
- Yalnızca yönerge içeren mesaj, düşünme bloklarının yanıtlarda gösterilip gösterilmeyeceğini açıp kapatır.
- Etkinleştirildiğinde akıl yürütme, `Reasoning:` önekiyle **ayrı bir mesaj** olarak gönderilir.
- `stream` (yalnızca Telegram): yanıt üretilirken akıl yürütmeyi Telegram taslak baloncuğuna akıtır, ardından nihai yanıtı akıl yürütme olmadan gönderir.
- Takma ad: `/reason`.
- Geçerli akıl yürütme düzeyini görmek için argümansız `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi yönerge, ardından oturum geçersiz kılması, ardından ajan başına varsayılan (`agents.list[].reasoningDefault`), ardından genel varsayılan (`agents.defaults.reasoningDefault`), ardından geri dönüş (`off`).

Hatalı biçimlendirilmiş yerel model akıl yürütme etiketleri ihtiyatlı şekilde ele alınır. Kapatılmış `<think>...</think>` blokları normal yanıtlarda gizli kalır ve zaten görünür metinden sonra kapatılmamış akıl yürütme de gizlenir. Bir yanıt tamamen tek bir kapatılmamış açılış etiketiyle sarılmışsa ve aksi halde boş metin olarak iletilecekse, OpenClaw hatalı açılış etiketini kaldırır ve kalan metni iletir.

## İlgili

- Yükseltilmiş mod belgeleri [Yükseltilmiş mod](/tr/tools/elevated) içinde bulunur.

## Heartbeat'ler

- Heartbeat sondası gövdesi, yapılandırılmış Heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Heartbeat mesajındaki satır içi yönergeler her zamanki gibi uygulanır (ancak Heartbeat'lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimi varsayılan olarak yalnızca nihai yüktür. Ayrı `Reasoning:` mesajını da göndermek için (varsa) `agents.defaults.heartbeat.includeReasoning: true` veya ajan başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbet arayüzü

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde inbound oturum deposu/yapılandırmasından oturumun kayıtlı düzeyini yansıtır.
- Başka bir düzey seçmek, oturum geçersiz kılmasını `sessions.patch` üzerinden hemen yazar; sonraki gönderimi beklemez ve tek seferlik bir `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman geçersiz kılmayı temizleme seçimidir. Oturum, kapalı olmayan etkili bir varsayılanı devralıyorsa `Devralınan: <resolved level>`, devralınan düşünme devre dışıysa `Kapalı` gösterir.
- Açık seçici seçimleri geçersiz kılma olarak etiketlenir ve varsa sağlayıcı etiketleri korunur (örneğin sağlayıcı tarafından etiketlenmiş bir `max` seçeneği için `Geçersiz kılma: maximum`).
- Seçici, gateway oturum satırı/varsayılanları tarafından döndürülen `thinkingLevels` değerlerini kullanır; `thinkingOptions` eski etiket listesi olarak tutulur. Tarayıcı arayüzü kendi sağlayıcı regex listesini tutmaz; modele özgü düzey kümelerinin sahibi Plugin'lerdir.
- `/think:<level>` çalışmaya devam eder ve aynı kayıtlı oturum düzeyini günceller; böylece sohbet yönergeleri ve seçici eşzamanlı kalır.

## Sağlayıcı profilleri

- Sağlayıcı Plugin'leri, modelin desteklenen düzeylerini ve varsayılanını tanımlamak için `resolveThinkingProfile(ctx)` sunabilir.
- Claude modellerine proxy yapan sağlayıcı Plugin'leri, doğrudan Anthropic ve proxy kataloglarının uyumlu kalması için `openclaw/plugin-sdk/provider-model-shared` içindeki `resolveClaudeThinkingProfile(modelId)` fonksiyonunu yeniden kullanmalıdır.
- Her profil düzeyinin kayıtlı kanonik bir `id` değeri vardır (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` veya `max`) ve bir görüntüleme `label` değeri içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Açık bir düşünme geçersiz kılmasını doğrulaması gereken araç Plugin'leri, `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ile `api.runtime.agent.normalizeThinkingLevel(...)` kullanmalıdır; kendi sağlayıcı/model düzey listelerini tutmamalıdır.
- Yapılandırılmış özel model meta verilerine erişimi olan araç Plugin'leri, `compat.supportedReasoningEfforts` katılımlarının Plugin tarafı doğrulamaya yansıtılması için `resolveThinkingPolicy` içine `catalog` geçebilir.
- Yayımlanmış eski hook'lar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk bağdaştırıcıları olarak kalır, ancak yeni özel düzey kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları/varsayılanları `thinkingLevels`, `thinkingOptions` ve `thinkingDefault` sunar; böylece ACP/sohbet istemcileri, çalışma zamanı doğrulamasının kullandığı aynı profil kimliklerini ve etiketlerini işler.
