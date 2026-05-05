---
read_when:
    - Düşünme, hızlı mod veya ayrıntılı yönergelerin ayrıştırmasını ya da varsayılanlarını ayarlama
summary: /think, /fast, /verbose, /trace ve akıl yürütme görünürlüğü için yönerge söz dizimi
title: Düşünme düzeyleri
x-i18n:
    generated_at: "2026-05-05T01:50:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2282c9eccda4693680bbfbfc42de508021f4472b00d40a1a8c1bc19a4516012
    source_path: tools/thinking.md
    workflow: 16
---

## Ne yapar

- Herhangi bir gelen gövdede satır içi direktif: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Düzeyler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “düşün”
  - low → “çok düşün”
  - medium → “daha çok düşün”
  - high → “ultrathink” (azami bütçe)
  - xhigh → “ultrathink+” (GPT-5.2+ ve Codex modelleri, ayrıca Anthropic Claude Opus 4.7 çabası)
  - adaptive → sağlayıcı tarafından yönetilen uyarlanabilir düşünme (Anthropic/Bedrock üzerinde Claude 4.6, Anthropic Claude Opus 4.7 ve Google Gemini dinamik düşünme için desteklenir)
  - max → sağlayıcı azami akıl yürütme (Anthropic Claude Opus 4.7; Ollama bunu en yüksek yerel `think` çabasına eşler)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` değerine eşlenir.
  - `highest`, `high` değerine eşlenir.
- Sağlayıcı notları:
  - Düşünme menüleri ve seçiciler sağlayıcı profiline göre belirlenir. Sağlayıcı Plugin'leri, ikili `on` gibi etiketler dahil seçili model için kesin düzey kümesini bildirir.
  - `adaptive`, `xhigh` ve `max` yalnızca bunları destekleyen sağlayıcı/model profilleri için gösterilir. Desteklenmeyen düzeyler için yazılan direktifler, o modelin geçerli seçenekleriyle birlikte reddedilir.
  - Mevcut depolanmış desteklenmeyen düzeyler, sağlayıcı profili sırasına göre yeniden eşlenir. `adaptive`, uyarlanabilir olmayan modellerde `medium` değerine geri dönerken `xhigh` ve `max`, seçili model için desteklenen en büyük `off` olmayan düzeye geri döner.
  - Anthropic Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmadığında varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.7 varsayılan olarak uyarlanabilir düşünmeyi kullanmaz. Açıkça bir düşünme düzeyi ayarlamadığınız sürece API çabası varsayılanı sağlayıcıya ait kalır.
  - Anthropic Claude Opus 4.7, `/think xhigh` değerini uyarlanabilir düşünmeye ve `output_config.effort: "xhigh"` değerine eşler; çünkü `/think` bir düşünme direktifidir ve `xhigh`, Opus 4.7 çaba ayarıdır.
  - Anthropic Claude Opus 4.7 ayrıca `/think max` değerini de sunar; bu aynı sağlayıcıya ait azami çaba yoluna eşlenir.
  - Doğrudan DeepSeek V4 modelleri `/think xhigh|max` sunar; her ikisi de DeepSeek `reasoning_effort: "max"` değerine eşlenirken daha düşük `off` olmayan düzeyler `high` değerine eşlenir.
  - OpenRouter üzerinden yönlendirilen DeepSeek V4 modelleri `/think xhigh` sunar ve OpenRouter destekli `reasoning_effort` değerlerini gönderir. Depolanmış `max` geçersiz kılmaları `xhigh` değerine geri döner.
  - Ollama düşünme yetenekli modeller `/think low|medium|high|max` sunar; `max`, yerel `think: "high"` değerine eşlenir çünkü Ollama'nın yerel API'si `low`, `medium` ve `high` çaba dizelerini kabul eder.
  - OpenAI GPT modelleri `/think` değerini modele özel Responses API çaba desteği üzerinden eşler. `/think off`, yalnızca hedef model desteklediğinde `reasoning.effort: "none"` gönderir; aksi halde OpenClaw desteklenmeyen bir değer göndermek yerine devre dışı akıl yürütme yükünü atlar.
  - Özel OpenAI uyumlu katalog girdileri, `models.providers.<provider>.models[].compat.supportedReasoningEfforts` değerini `"xhigh"` içerecek şekilde ayarlayarak `/think xhigh` seçeneğine katılabilir. Bu, giden OpenAI akıl yürütme çabası yüklerini eşleyen aynı uyumluluk meta verisini kullanır; böylece menüler, oturum doğrulama, ajan CLI ve `llm-task` taşıma davranışıyla aynı fikirde olur.
  - Bayat yapılandırılmış OpenRouter Hunter Alpha başvuruları, kullanımdan kaldırılan bu rota akıl yürütme alanları üzerinden nihai yanıt metni döndürebildiği için proxy akıl yürütme enjeksiyonunu atlar.
  - Google Gemini, `/think adaptive` değerini Gemini'nin sağlayıcıya ait dinamik düşünmesine eşler. Gemini 3 istekleri sabit bir `thinkingLevel` göndermezken Gemini 2.5 istekleri `thinkingBudget: -1` gönderir; sabit düzeyler yine de o model ailesi için en yakın Gemini `thinkingLevel` veya bütçesine eşlenir.
  - Anthropic uyumlu akış yolundaki MiniMax (`minimax/*`), model parametrelerinde veya istek parametrelerinde düşünmeyi açıkça ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax'in yerel olmayan Anthropic akış biçiminden `reasoning_content` deltalarının sızmasını önler.
  - Z.AI (`zai/*`) yalnızca ikili düşünmeyi (`on`/`off`) destekler. `off` olmayan her düzey `on` olarak ele alınır (`low` değerine eşlenir).
  - Moonshot (`moonshot/*`), `/think off` değerini `thinking: { type: "disabled" }` değerine, `off` olmayan her düzeyi ise `thinking: { type: "enabled" }` değerine eşler. Düşünme etkinleştirildiğinde Moonshot yalnızca `tool_choice` `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalleştirir.

## Çözümleme sırası

1. İleti üzerindeki satır içi direktif (yalnızca o iletiye uygulanır).
2. Oturum geçersiz kılması (yalnızca direktiften oluşan bir ileti gönderilerek ayarlanır).
3. Ajan başına varsayılan (yapılandırmada `agents.list[].thinkingDefault`).
4. Genel varsayılan (yapılandırmada `agents.defaults.thinkingDefault`).
5. Geri dönüş: varsa sağlayıcının bildirdiği varsayılan; aksi halde akıl yürütme yetenekli modeller `medium` değerine veya o model için desteklenen en yakın `off` olmayan düzeye çözümlenir, akıl yürütme desteklemeyen modeller ise `off` kalır.

## Oturum varsayılanı ayarlama

- **Yalnızca** direktiften oluşan bir ileti gönderin (boşluklara izin verilir), ör. `/think:medium` veya `/t high`.
- Bu, geçerli oturum için geçerli kalır (varsayılan olarak gönderen başına); `/think:off` veya oturum boşta kalma sıfırlaması ile temizlenir.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Düzey geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değiştirilmez.
- Geçerli düşünme düzeyini görmek için argümansız `/think` (veya `/think:`) gönderin.

## Ajan tarafından uygulama

- **Gömülü Pi**: çözümlenen düzey, işlem içi Pi ajan çalışma zamanına aktarılır.
- **Claude CLI arka ucu**: `claude-cli` kullanılırken `off` olmayan düzeyler Claude Code'a `--effort` olarak aktarılır; bkz. [CLI arka uçları](/tr/gateway/cli-backends).

## Hızlı mod (/fast)

- Düzeyler: `on|off`.
- Yalnızca direktiften oluşan ileti, oturum hızlı mod geçersiz kılmasını açıp kapatır ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir.
- Geçerli etkili hızlı mod durumunu görmek için mod belirtmeden `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca direktif `/fast on|off`
  2. Oturum geçersiz kılması
  3. Ajan başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- `openai-codex/*` için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. OpenClaw, iki kimlik doğrulama yolu arasında tek bir paylaşılan `/fast` anahtarı tutar.
- OAuth ile kimliği doğrulanmış ve `api.anthropic.com` adresine gönderilen trafik dahil doğrudan herkese açık `anthropic/*` istekleri için hızlı mod Anthropic hizmet katmanlarına eşlenir: `/fast on` `service_tier=auto`, `/fast off` `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`) `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model parametreleri, ikisi de ayarlandığında hızlı mod varsayılanını geçersiz kılar. OpenClaw yine de Anthropic olmayan proxy temel URL'leri için Anthropic hizmet katmanı enjeksiyonunu atlar.
- `/status`, yalnızca hızlı mod etkin olduğunda `Fast` gösterir.

## Ayrıntılı mod direktifleri (/verbose veya /v)

- Düzeyler: `on` (asgari) | `full` | `off` (varsayılan).
- Yalnızca direktiften oluşan ileti oturum ayrıntılı modunu açıp kapatır ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz düzeyler durumu değiştirmeden bir ipucu döndürür.
- `/verbose off` açık bir oturum geçersiz kılması depolar; bunu Sessions UI üzerinden `inherit` seçerek temizleyin.
- Satır içi direktif yalnızca o iletiyi etkiler; aksi halde oturum/genel varsayılanlar uygulanır.
- Geçerli ayrıntı düzeyini görmek için argümansız `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı mod açıkken, yapılandırılmış araç sonuçları yayan ajanlar (Pi, diğer JSON ajanları), her araç çağrısını mümkün olduğunda `<emoji> <tool-name>: <arg>` önekiyle kendi yalnızca meta veri içeren iletisi olarak geri gönderir. Bu araç özetleri her araç başlar başlamaz gönderilir (ayrı balonlar), akış deltaları olarak değil.
- Araç hata özetleri normal modda görünür kalır, ancak ham hata ayrıntısı sonekleri ayrıntılı mod `on` veya `full` olmadıkça gizlenir.
- Ayrıntılı mod `full` olduğunda, araç çıktıları tamamlanmadan sonra da iletilir (ayrı balon, güvenli bir uzunluğa kırpılmış). Bir çalışma devam ederken `/verbose on|full|off` değiştirirseniz sonraki araç balonları yeni ayara uyar.
- `agents.defaults.toolProgressDetail`, `/verbose` araç özetlerinin ve ilerleme taslağı araç satırlarının biçimini denetler. `🛠️ Exec: checking JS syntax` gibi kısa insan etiketleri için `"explain"` (varsayılan) kullanın; hata ayıklama için ham komut/ayrıntının da eklenmesini istediğinizde `"raw"` kullanın. Ajan başına `agents.list[].toolProgressDetail` varsayılanı geçersiz kılar.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin izleme direktifleri (/trace)

- Düzeyler: `on` | `off` (varsayılan).
- Yalnızca direktiften oluşan ileti, oturum Plugin izleme çıktısını açıp kapatır ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi direktif yalnızca o iletiyi etkiler; aksi halde oturum/genel varsayılanlar uygulanır.
- Geçerli izleme düzeyini görmek için argümansız `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose` değerinden daha dardır: yalnızca Active Memory hata ayıklama özetleri gibi Plugin'e ait izleme/hata ayıklama satırlarını gösterir.
- İzleme satırları `/status` içinde ve normal asistan yanıtından sonra takip amaçlı tanılama iletisi olarak görünebilir.

## Akıl yürütme görünürlüğü (/reasoning)

- Düzeyler: `on|off|stream`.
- Yalnızca direktiften oluşan ileti, düşünme bloklarının yanıtlarda gösterilip gösterilmeyeceğini açıp kapatır.
- Etkinleştirildiğinde akıl yürütme, `Reasoning:` önekiyle **ayrı bir ileti** olarak gönderilir.
- `stream` (yalnızca Telegram): yanıt oluşturulurken akıl yürütmeyi Telegram taslak balonuna akar, ardından nihai yanıtı akıl yürütme olmadan gönderir.
- Takma ad: `/reason`.
- Geçerli akıl yürütme düzeyini görmek için argümansız `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi direktif, ardından oturum geçersiz kılması, ardından ajan başına varsayılan (`agents.list[].reasoningDefault`), ardından geri dönüş (`off`).

Hatalı biçimlendirilmiş yerel model akıl yürütme etiketleri temkinli şekilde ele alınır. Kapalı `<think>...</think>` blokları normal yanıtlarda gizli kalır ve zaten görünür metinden sonra gelen kapatılmamış akıl yürütme de gizlenir. Bir yanıt tek bir kapatılmamış açılış etiketiyle tamamen sarılmışsa ve aksi halde boş metin olarak iletilecekse OpenClaw hatalı biçimlendirilmiş açılış etiketini kaldırır ve kalan metni iletir.

## İlgili

- Yükseltilmiş mod belgeleri [Yükseltilmiş mod](/tr/tools/elevated) içinde bulunur.

## Heartbeat'ler

- Heartbeat yoklama gövdesi, yapılandırılmış Heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Heartbeat iletisindeki satır içi direktifler her zamanki gibi uygulanır (ancak Heartbeat'lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimi varsayılan olarak yalnızca nihai yükü gönderir. Ayrı `Reasoning:` iletisini de göndermek için (varsa) `agents.defaults.heartbeat.includeReasoning: true` veya ajan başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbet UI

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde gelen oturum deposu/yapılandırmasından oturumun depolanmış düzeyini yansıtır.
- Başka bir düzey seçmek, oturum geçersiz kılmasını `sessions.patch` üzerinden hemen yazar; bir sonraki göndermeyi beklemez ve tek seferlik bir `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman `Default (<resolved level>)` olur; burada çözümlenen varsayılan, etkin oturum modelinin sağlayıcı düşünme profilinden ve `/status` ile `session_status` tarafından kullanılan aynı geri dönüş mantığından gelir.
- Seçici, Gateway oturum satırı/varsayılanları tarafından döndürülen `thinkingLevels` değerini kullanır; `thinkingOptions` ise eski etiket listesi olarak korunur. Tarayıcı UI kendi sağlayıcı regex listesini tutmaz; modele özgü düzey kümeleri Plugin'lere aittir.
- `/think:<level>` hâlâ çalışır ve aynı depolanmış oturum düzeyini günceller; böylece sohbet direktifleri ve seçici eşzamanlı kalır.

## Sağlayıcı profilleri

- Sağlayıcı Plugin'leri, modelin desteklenen düzeylerini ve varsayılanını tanımlamak için `resolveThinkingProfile(ctx)` sunabilir.
- Claude modellerini proxy eden sağlayıcı Plugin'leri, doğrudan Anthropic ve proxy kataloglarının hizalı kalması için `openclaw/plugin-sdk/provider-model-shared` içinden `resolveClaudeThinkingProfile(modelId)` öğesini yeniden kullanmalıdır.
- Her profil düzeyinin saklanan kanonik bir `id` değeri (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` veya `max`) vardır ve bir görüntüleme `label` değeri içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Açık bir düşünme geçersiz kılmasını doğrulaması gereken araç Plugin'leri, `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ile `api.runtime.agent.normalizeThinkingLevel(...)` kullanmalıdır; kendi sağlayıcı/model düzeyi listelerini tutmamalıdır.
- Yapılandırılmış özel model meta verilerine erişimi olan araç Plugin'leri, Plugin tarafı doğrulamada `compat.supportedReasoningEfforts` katılımlarının yansıtılması için `catalog` değerini `resolveThinkingPolicy` içine geçirebilir.
- Yayımlanmış eski hook'lar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk bağdaştırıcıları olarak kalır, ancak yeni özel düzey kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları/varsayılanları `thinkingLevels`, `thinkingOptions` ve `thinkingDefault` sunar; böylece ACP/sohbet istemcileri, çalışma zamanı doğrulamasının kullandığı aynı profil kimliklerini ve etiketlerini işler.
