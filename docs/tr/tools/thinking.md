---
read_when:
    - Düşünme, fast-mode veya verbose yönerge ayrıştırmasını ya da varsayılanlarını ayarlama
summary: /think, /fast, /verbose, /trace ve akıl yürütme görünürlüğü için yönerge söz dizimi
title: Düşünme düzeyleri
x-i18n:
    generated_at: "2026-05-04T07:09:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fa1b0a2b5f7b93a706488c3ad39dfe08c08eed0bdd30880eb4c07d730ee4d4f
    source_path: tools/thinking.md
    workflow: 16
---

## Ne yapar

- Herhangi bir gelen gövdede satır içi direktif: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Düzeyler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “düşün”
  - low → “sıkı düşün”
  - medium → “daha sıkı düşün”
  - high → “ultra düşün” (maksimum bütçe)
  - xhigh → “ultra düşün+” (GPT-5.2+ ve Codex modelleri, ayrıca Anthropic Claude Opus 4.7 effort)
  - adaptive → sağlayıcı tarafından yönetilen uyarlanabilir düşünme (Anthropic/Bedrock üzerinde Claude 4.6, Anthropic Claude Opus 4.7 ve Google Gemini dinamik düşünme için desteklenir)
  - max → sağlayıcı maksimum akıl yürütmesi (Anthropic Claude Opus 4.7; Ollama bunu en yüksek yerel `think` effort düzeyine eşler)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` değerine eşlenir.
  - `highest`, `high` değerine eşlenir.
- Sağlayıcı notları:
  - Düşünme menüleri ve seçicileri sağlayıcı profili tarafından belirlenir. Sağlayıcı Plugin bileşenleri, seçilen model için tam düzey kümesini, ikili `on` gibi etiketler dahil olmak üzere bildirir.
  - `adaptive`, `xhigh` ve `max` yalnızca bunları destekleyen sağlayıcı/model profilleri için gösterilir. Desteklenmeyen düzeyler için yazılan direktifler, o modelin geçerli seçenekleriyle reddedilir.
  - Mevcut kayıtlı desteklenmeyen düzeyler, sağlayıcı profili sıralamasına göre yeniden eşlenir. `adaptive`, uyarlanabilir olmayan modellerde `medium` değerine geri dönerken, `xhigh` ve `max` seçilen model için desteklenen en büyük `off` dışı düzeye geri döner.
  - Anthropic Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmadığında varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.7 varsayılan olarak uyarlanabilir düşünmeye geçmez. Açıkça bir düşünme düzeyi ayarlamadığınız sürece API effort varsayılanı sağlayıcıya aittir.
  - Anthropic Claude Opus 4.7, `/think xhigh` değerini uyarlanabilir düşünme artı `output_config.effort: "xhigh"` olarak eşler; çünkü `/think` bir düşünme direktifidir ve `xhigh` Opus 4.7 effort ayarıdır.
  - Anthropic Claude Opus 4.7 ayrıca `/think max` sunar; bu, aynı sağlayıcıya ait maksimum effort yoluna eşlenir.
  - DeepSeek V4 modelleri `/think xhigh|max` sunar; ikisi de DeepSeek `reasoning_effort: "max"` değerine eşlenirken daha düşük `off` dışı düzeyler `high` değerine eşlenir.
  - Ollama düşünme özellikli modeller `/think low|medium|high|max` sunar; `max`, yerel `think: "high"` değerine eşlenir çünkü Ollama'nın yerel API'si `low`, `medium` ve `high` effort dizgilerini kabul eder.
  - OpenAI GPT modelleri, `/think` değerini modele özgü Responses API effort desteği üzerinden eşler. `/think off`, yalnızca hedef model desteklediğinde `reasoning.effort: "none"` gönderir; aksi halde OpenClaw desteklenmeyen bir değer göndermek yerine devre dışı akıl yürütme yükünü atlar.
  - Özel OpenAI uyumlu katalog girdileri, `models.providers.<provider>.models[].compat.supportedReasoningEfforts` değerini `"xhigh"` içerecek şekilde ayarlayarak `/think xhigh` özelliğine katılabilir. Bu, giden OpenAI akıl yürütme effort yüklerini eşleyen aynı uyumluluk meta verilerini kullanır; böylece menüler, oturum doğrulaması, ajan CLI'ı ve `llm-task` taşıma davranışıyla uyumlu olur.
  - Eski yapılandırılmış OpenRouter Hunter Alpha başvuruları, emekli edilmiş rota akıl yürütme alanları üzerinden nihai yanıt metni döndürebileceği için proxy akıl yürütme enjeksiyonunu atlar.
  - Google Gemini, `/think adaptive` değerini Gemini'nin sağlayıcıya ait dinamik düşünmesine eşler. Gemini 3 istekleri sabit bir `thinkingLevel` atlar, Gemini 2.5 istekleri ise `thinkingBudget: -1` gönderir; sabit düzeyler yine de o model ailesi için en yakın Gemini `thinkingLevel` değerine veya bütçesine eşlenir.
  - Anthropic uyumlu akış yolundaki MiniMax (`minimax/*`), model parametrelerinde veya istek parametrelerinde açıkça düşünme ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax'in yerel olmayan Anthropic akış biçiminden `reasoning_content` deltalarının sızmasını önler.
  - Z.AI (`zai/*`) yalnızca ikili düşünmeyi (`on`/`off`) destekler. `off` dışındaki herhangi bir düzey `on` olarak değerlendirilir (`low` değerine eşlenir).
  - Moonshot (`moonshot/*`), `/think off` değerini `thinking: { type: "disabled" }` olarak ve `off` dışındaki herhangi bir düzeyi `thinking: { type: "enabled" }` olarak eşler. Düşünme etkinleştirildiğinde Moonshot yalnızca `tool_choice` için `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalleştirir.

## Çözümleme sırası

1. İletideki satır içi direktif (yalnızca o iletiye uygulanır).
2. Oturum geçersiz kılması (yalnızca direktif içeren bir ileti gönderilerek ayarlanır).
3. Ajan başına varsayılan (config içinde `agents.list[].thinkingDefault`).
4. Genel varsayılan (config içinde `agents.defaults.thinkingDefault`).
5. Geri dönüş: mevcutsa sağlayıcı tarafından bildirilen varsayılan; aksi halde akıl yürütme özellikli modeller `medium` değerine veya o model için desteklenen en yakın `off` dışı düzeye çözümlenir, akıl yürütmesiz modeller ise `off` kalır.

## Oturum varsayılanı ayarlama

- **Yalnızca** direktiften oluşan bir ileti gönderin (boşluklara izin verilir), ör. `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalıcı olur (varsayılan olarak gönderen başına); `/think:off` veya oturum boşta sıfırlama ile temizlenir.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Düzey geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değiştirilmez.
- Geçerli düşünme düzeyini görmek için argümansız `/think` (veya `/think:`) gönderin.

## Ajana göre uygulama

- **Gömülü Pi**: çözümlenen düzey, süreç içi Pi ajan çalışma zamanına iletilir.

## Hızlı mod (/fast)

- Düzeyler: `on|off`.
- Yalnızca direktif içeren ileti, oturum hızlı mod geçersiz kılmasını açıp kapatır ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir.
- Geçerli etkili hızlı mod durumunu görmek için modsuz `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca direktif `/fast on|off`
  2. Oturum geçersiz kılması
  3. Ajan başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına config: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- `openai-codex/*` için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. OpenClaw her iki kimlik doğrulama yolu genelinde tek bir ortak `/fast` anahtarı tutar.
- `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dahil doğrudan herkese açık `anthropic/*` istekleri için hızlı mod Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto` ayarlar; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model parametreleri, ikisi de ayarlandığında hızlı mod varsayılanını geçersiz kılar. OpenClaw yine de Anthropic olmayan proxy temel URL'leri için Anthropic hizmet katmanı enjeksiyonunu atlar.
- `/status`, hızlı mod yalnızca etkin olduğunda `Fast` gösterir.

## Ayrıntılı direktifler (/verbose veya /v)

- Düzeyler: `on` (minimal) | `full` | `off` (varsayılan).
- Yalnızca direktif içeren ileti, oturum ayrıntılı günlüğünü açıp kapatır ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz düzeyler durumu değiştirmeden bir ipucu döndürür.
- `/verbose off` açık bir oturum geçersiz kılması saklar; bunu Sessions UI üzerinden `inherit` seçerek temizleyin.
- Satır içi direktif yalnızca o iletiyi etkiler; aksi halde oturum/genel varsayılanlar uygulanır.
- Geçerli ayrıntı düzeyini görmek için argümansız `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı mod açıkken, yapılandırılmış araç sonuçları yayan ajanlar (Pi, diğer JSON ajanları) her araç çağrısını, mevcut olduğunda `<emoji> <tool-name>: <arg>` önekiyle kendi meta veri odaklı iletisi olarak geri gönderir. Bu araç özetleri her araç başlar başlamaz gönderilir (ayrı baloncuklar), akış deltaları olarak değil.
- Araç hatası özetleri normal modda görünür kalır, ancak ham hata ayrıntısı son ekleri ayrıntılı mod `on` veya `full` olmadıkça gizlenir.
- Ayrıntılı mod `full` olduğunda, araç çıktıları tamamlanmadan sonra da iletilir (ayrı baloncuk, güvenli bir uzunluğa kırpılmış). Bir çalışma devam ederken `/verbose on|full|off` değiştirirseniz, sonraki araç baloncukları yeni ayara uyar.
- `agents.defaults.toolProgressDetail`, `/verbose` araç özetlerinin ve ilerleme taslağı araç satırlarının biçimini denetler. `🛠️ Exec: checking JS syntax` gibi kompakt insan etiketleri için `"explain"` (varsayılan) kullanın; hata ayıklama için ham komut/ayrıntının da eklenmesini istediğinizde `"raw"` kullanın. Ajan başına `agents.list[].toolProgressDetail` varsayılanı geçersiz kılar.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin izleme direktifleri (/trace)

- Düzeyler: `on` | `off` (varsayılan).
- Yalnızca direktif içeren ileti, oturum Plugin izleme çıktısını açıp kapatır ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi direktif yalnızca o iletiyi etkiler; aksi halde oturum/genel varsayılanlar uygulanır.
- Geçerli izleme düzeyini görmek için argümansız `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose` değerinden daha dardır: yalnızca Active Memory hata ayıklama özetleri gibi Plugin tarafından sahiplenilen izleme/hata ayıklama satırlarını gösterir.
- İzleme satırları `/status` içinde ve normal asistan yanıtından sonra takip tanılama iletisi olarak görünebilir.

## Akıl yürütme görünürlüğü (/reasoning)

- Düzeyler: `on|off|stream`.
- Yalnızca direktif içeren ileti, düşünme bloklarının yanıtlarda gösterilip gösterilmeyeceğini açıp kapatır.
- Etkinleştirildiğinde akıl yürütme, `Reasoning:` önekiyle **ayrı bir ileti** olarak gönderilir.
- `stream` (yalnızca Telegram): yanıt oluşturulurken akıl yürütmeyi Telegram taslak baloncuğuna akıtır, ardından nihai yanıtı akıl yürütme olmadan gönderir.
- Takma ad: `/reason`.
- Geçerli akıl yürütme düzeyini görmek için argümansız `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi direktif, ardından oturum geçersiz kılması, ardından ajan başına varsayılan (`agents.list[].reasoningDefault`), ardından geri dönüş (`off`).

Hatalı biçimlendirilmiş yerel model akıl yürütme etiketleri ihtiyatlı şekilde ele alınır. Kapalı `<think>...</think>` blokları normal yanıtlarda gizli kalır ve zaten görünür metinden sonraki kapatılmamış akıl yürütme de gizlenir. Bir yanıt tamamen tek bir kapatılmamış açılış etiketiyle sarılmışsa ve aksi halde boş metin olarak teslim edilecekse, OpenClaw hatalı biçimlendirilmiş açılış etiketini kaldırır ve kalan metni teslim eder.

## İlgili

- Yükseltilmiş mod belgeleri [Yükseltilmiş mod](/tr/tools/elevated) içinde bulunur.

## Heartbeat

- Heartbeat yoklama gövdesi, yapılandırılmış Heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Bir Heartbeat iletisindeki satır içi direktifler normal şekilde uygulanır (ancak Heartbeat iletilerinden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimi varsayılan olarak yalnızca nihai yüke yapılır. Ayrı `Reasoning:` iletisini de göndermek için (mevcut olduğunda), `agents.defaults.heartbeat.includeReasoning: true` veya ajan başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbet UI

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde oturumun saklanan düzeyini gelen oturum deposundan/config içinden yansıtır.
- Başka bir düzey seçmek, `sessions.patch` üzerinden oturum geçersiz kılmasını hemen yazar; bir sonraki gönderimi beklemez ve tek seferlik bir `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman `Default (<resolved level>)` olur; çözümlenen varsayılan, etkin oturum modelinin sağlayıcı düşünme profilinden ve `/status` ile `session_status` tarafından kullanılan aynı geri dönüş mantığından gelir.
- Seçici, eski etiket listesi olarak tutulan `thinkingOptions` ile birlikte Gateway oturum satırı/varsayılanları tarafından döndürülen `thinkingLevels` değerini kullanır. Tarayıcı UI kendi sağlayıcı regex listesini tutmaz; modele özgü düzey kümelerinin sahibi Plugin tarafıdır.
- `/think:<level>` hâlâ çalışır ve aynı saklanan oturum düzeyini günceller; böylece sohbet direktifleri ve seçici eşzamanlı kalır.

## Sağlayıcı profilleri

- Sağlayıcı Plugin'leri, modelin desteklenen düzeylerini ve varsayılanını tanımlamak için `resolveThinkingProfile(ctx)` sunabilir.
- Claude modellerine proxy görevi yapan sağlayıcı Plugin'leri, doğrudan Anthropic ve proxy kataloglarının uyumlu kalması için `openclaw/plugin-sdk/provider-model-shared` içinden `resolveClaudeThinkingProfile(modelId)` öğesini yeniden kullanmalıdır.
- Her profil düzeyinin saklanan standart bir `id` değeri vardır (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` veya `max`) ve bir görüntüleme `label` değeri içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Açık bir düşünme geçersiz kılmasını doğrulaması gereken araç Plugin'leri, `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ile `api.runtime.agent.normalizeThinkingLevel(...)` kullanmalıdır; kendi sağlayıcı/model düzeyi listelerini tutmamalıdır.
- Yapılandırılmış özel model meta verilerine erişimi olan araç Plugin'leri, `compat.supportedReasoningEfforts` katılımlarının Plugin tarafı doğrulamaya yansıtılması için `catalog` değerini `resolveThinkingPolicy` içine geçirebilir.
- Yayımlanmış eski hook'lar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk adaptörleri olarak kalır, ancak yeni özel düzey kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları/varsayılanları, ACP/sohbet istemcilerinin çalışma zamanı doğrulamasının kullandığı aynı profil kimliklerini ve etiketlerini işlemesi için `thinkingLevels`, `thinkingOptions` ve `thinkingDefault` sunar.
