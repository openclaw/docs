---
read_when:
    - Düşünme, hızlı mod veya ayrıntılı yönerge ayrıştırmasını ya da varsayılanlarını ayarlama
summary: /think, /fast, /verbose, /trace ve akıl yürütme görünürlüğü için yönerge söz dizimi
title: Düşünme seviyeleri
x-i18n:
    generated_at: "2026-05-06T09:35:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19fed0d7d8499d177361d125027ca5001dfe73a4ea5bc7f7475faa10541c7a83
    source_path: tools/thinking.md
    workflow: 16
---

## Ne yapar

- Herhangi bir gelen gövdede satır içi yönerge: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Düzeyler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (maksimum bütçe)
  - xhigh → "ultrathink+" (GPT-5.2+ ve Codex modelleri, ayrıca Anthropic Claude Opus 4.7 çabası)
  - adaptive → sağlayıcı tarafından yönetilen uyarlanabilir düşünme (Anthropic/Bedrock üzerindeki Claude 4.6, Anthropic Claude Opus 4.7 ve Google Gemini dinamik düşünmesi için desteklenir)
  - max → sağlayıcının maksimum akıl yürütmesi (Anthropic Claude Opus 4.7; Ollama bunu kendi en yüksek yerel `think` çabasına eşler)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` ile eşleşir.
  - `highest`, `high` ile eşleşir.
- Sağlayıcı notları:
  - Düşünme menüleri ve seçicileri sağlayıcı profiline göre belirlenir. Sağlayıcı Plugin'leri, ikili `on` gibi etiketler dahil seçili model için tam düzey kümesini bildirir.
  - `adaptive`, `xhigh` ve `max` yalnızca bunları destekleyen sağlayıcı/model profilleri için gösterilir. Desteklenmeyen düzeylere yönelik yazılmış yönergeler, o modelin geçerli seçenekleriyle reddedilir.
  - Mevcut kayıtlı desteklenmeyen düzeyler, sağlayıcı profili sıralamasına göre yeniden eşlenir. `adaptive`, uyarlanabilir olmayan modellerde `medium` değerine geri dönerken `xhigh` ve `max`, seçili model için desteklenen en büyük `off` dışı düzeye geri döner.
  - Anthropic Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmadığında varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.7 varsayılan olarak uyarlanabilir düşünmeye geçmez. API çaba varsayılanı, açıkça bir düşünme düzeyi ayarlamadığınız sürece sağlayıcıya ait kalır.
  - Anthropic Claude Opus 4.7, `/think xhigh` değerini uyarlanabilir düşünmeye ve `output_config.effort: "xhigh"` ayarına eşler; çünkü `/think` bir düşünme yönergesidir ve `xhigh`, Opus 4.7 çaba ayarıdır.
  - Anthropic Claude Opus 4.7 ayrıca `/think max` sunar; bu, aynı sağlayıcıya ait maksimum çaba yoluna eşlenir.
  - Doğrudan DeepSeek V4 modelleri `/think xhigh|max` sunar; ikisi de DeepSeek `reasoning_effort: "max"` değerine eşlenirken daha düşük `off` dışı düzeyler `high` değerine eşlenir.
  - OpenRouter üzerinden yönlendirilen DeepSeek V4 modelleri `/think xhigh` sunar ve OpenRouter destekli `reasoning_effort` değerlerini gönderir. Kayıtlı `max` geçersiz kılmaları `xhigh` değerine geri döner.
  - Düşünme özellikli Ollama modelleri `/think low|medium|high|max` sunar; `max`, yerel `think: "high"` değerine eşlenir çünkü Ollama'nın yerel API'si `low`, `medium` ve `high` çaba dizelerini kabul eder.
  - OpenAI GPT modelleri, `/think` değerini modele özgü Responses API çaba desteği üzerinden eşler. `/think off`, yalnızca hedef model desteklediğinde `reasoning.effort: "none"` gönderir; aksi takdirde OpenClaw, desteklenmeyen bir değer göndermek yerine devre dışı bırakılmış akıl yürütme yükünü atlar.
  - Özel OpenAI uyumlu katalog girdileri, `models.providers.<provider>.models[].compat.supportedReasoningEfforts` değerini `"xhigh"` içerecek şekilde ayarlayarak `/think xhigh` desteğine katılabilir. Bu, giden OpenAI akıl yürütme çabası yüklerini eşleyen aynı uyumluluk meta verisini kullanır; böylece menüler, oturum doğrulaması, aracı CLI ve `llm-task` taşıma davranışıyla aynı fikirde olur.
  - Bayat yapılandırılmış OpenRouter Hunter Alpha referansları, emekli edilen rota akıl yürütme alanları üzerinden nihai yanıt metni döndürebileceği için proxy akıl yürütme enjeksiyonunu atlar.
  - Google Gemini, `/think adaptive` değerini Gemini'nin sağlayıcıya ait dinamik düşünmesine eşler. Gemini 3 istekleri sabit bir `thinkingLevel` atlar, Gemini 2.5 istekleri ise `thinkingBudget: -1` gönderir; sabit düzeyler yine de o model ailesi için en yakın Gemini `thinkingLevel` değerine veya bütçesine eşlenir.
  - Anthropic uyumlu akış yolunda MiniMax (`minimax/*`), model parametrelerinde veya istek parametrelerinde açıkça düşünme ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax'in yerel olmayan Anthropic akış biçiminden sızan `reasoning_content` deltalarını önler.
  - Z.AI (`zai/*`) yalnızca ikili düşünmeyi (`on`/`off`) destekler. `off` dışındaki herhangi bir düzey `on` olarak değerlendirilir (`low` değerine eşlenir).
  - Moonshot (`moonshot/*`), `/think off` değerini `thinking: { type: "disabled" }` değerine ve herhangi bir `off` dışı düzeyi `thinking: { type: "enabled" }` değerine eşler. Düşünme etkin olduğunda Moonshot yalnızca `tool_choice` `auto|none` değerlerini kabul eder; OpenClaw uyumsuz değerleri `auto` değerine normalleştirir.

## Çözümleme sırası

1. Mesajdaki satır içi yönerge (yalnızca o mesaja uygulanır).
2. Oturum geçersiz kılması (yalnızca yönerge içeren bir mesaj gönderilerek ayarlanır).
3. Aracı başına varsayılan (yapılandırmada `agents.list[].thinkingDefault`).
4. Genel varsayılan (yapılandırmada `agents.defaults.thinkingDefault`).
5. Geri dönüş: varsa sağlayıcının bildirdiği varsayılan; aksi takdirde akıl yürütme özellikli modeller `medium` değerine veya o model için desteklenen en yakın `off` dışı düzeye çözülür, akıl yürütme özelliği olmayan modeller ise `off` kalır.

## Oturum varsayılanı ayarlama

- **Yalnızca** yönergeden oluşan bir mesaj gönderin (boşluklara izin verilir), ör. `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalıcı olur (varsayılan olarak gönderen başına); `/think:off` veya oturum boşta sıfırlamasıyla temizlenir.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Düzey geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değiştirilmeden bırakılır.
- Geçerli düşünme düzeyini görmek için bağımsız değişken olmadan `/think` (veya `/think:`) gönderin.

## Aracıya göre uygulama

- **Gömülü Pi**: çözümlenen düzey, süreç içindeki Pi aracı çalışma zamanına geçirilir.
- **Claude CLI arka ucu**: `claude-cli` kullanılırken `off` dışı düzeyler Claude Code'a `--effort` olarak geçirilir; bkz. [CLI arka uçları](/tr/gateway/cli-backends).

## Hızlı mod (/fast)

- Düzeyler: `on|off`.
- Yalnızca yönerge içeren mesaj, oturum hızlı mod geçersiz kılmasını açıp kapatır ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir.
- Geçerli etkin hızlı mod durumunu görmek için mod olmadan `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca yönerge `/fast on|off`
  2. Oturum geçersiz kılması
  3. Aracı başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- `openai-codex/*` için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. OpenClaw her iki kimlik doğrulama yolu için tek bir ortak `/fast` anahtarı tutar.
- `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dahil doğrudan genel `anthropic/*` istekleri için hızlı mod Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto` ayarlar; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model parametreleri, ikisi de ayarlandığında hızlı mod varsayılanını geçersiz kılar. OpenClaw, Anthropic olmayan proxy temel URL'leri için Anthropic hizmet katmanı enjeksiyonunu yine de atlar.
- `/status`, hızlı mod yalnızca etkin olduğunda `Fast` gösterir.

## Ayrıntılı yönergeler (/verbose veya /v)

- Düzeyler: `on` (asgari) | `full` | `off` (varsayılan).
- Yalnızca yönerge içeren mesaj oturum ayrıntılı kaydını açıp kapatır ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz düzeyler durumu değiştirmeden bir ipucu döndürür.
- `/verbose off` açık bir oturum geçersiz kılması kaydeder; bunu Sessions UI üzerinden `inherit` seçerek temizleyin.
- Satır içi yönerge yalnızca o mesajı etkiler; aksi takdirde oturum/genel varsayılanlar uygulanır.
- Geçerli ayrıntı düzeyini görmek için bağımsız değişken olmadan `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı mod açıkken, yapılandırılmış araç sonuçları yayan aracılar (Pi, diğer JSON aracıları) her araç çağrısını, varsa `<emoji> <tool-name>: <arg>` önekiyle kendi meta veri odaklı mesajı olarak geri gönderir. Bu araç özetleri, her araç başlar başlamaz gönderilir (ayrı baloncuklar), akış deltaları olarak değil.
- Araç hatası özetleri normal modda görünür kalır, ancak ham hata ayrıntısı sonekleri, ayrıntılı mod `on` veya `full` olmadıkça gizlenir.
- Ayrıntılı mod `full` olduğunda, araç çıktıları da tamamlandıktan sonra iletilir (ayrı baloncuk, güvenli bir uzunluğa kırpılmış). Bir çalışma devam ederken `/verbose on|full|off` değiştirirseniz, sonraki araç baloncukları yeni ayara uyar.
- `agents.defaults.toolProgressDetail`, `/verbose` araç özetlerinin ve ilerleme taslağı araç satırlarının biçimini denetler. `🛠️ Exec: checking JS syntax` gibi kompakt insan etiketleri için `"explain"` (varsayılan) kullanın; hata ayıklama için ham komut/ayrıntının da eklenmesini istediğinizde `"raw"` kullanın. Aracı başına `agents.list[].toolProgressDetail` varsayılanı geçersiz kılar.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin izleme yönergeleri (/trace)

- Düzeyler: `on` | `off` (varsayılan).
- Yalnızca yönerge içeren mesaj, oturum Plugin izleme çıktısını açıp kapatır ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi yönerge yalnızca o mesajı etkiler; aksi takdirde oturum/genel varsayılanlar uygulanır.
- Geçerli izleme düzeyini görmek için bağımsız değişken olmadan `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose` değerinden daha dardır: yalnızca Active Memory hata ayıklama özetleri gibi Plugin'e ait izleme/hata ayıklama satırlarını gösterir.
- İzleme satırları `/status` içinde ve normal asistan yanıtından sonra takip tanılama mesajı olarak görünebilir.

## Akıl yürütme görünürlüğü (/reasoning)

- Düzeyler: `on|off|stream`.
- Yalnızca yönerge içeren mesaj, düşünme bloklarının yanıtlarda gösterilip gösterilmeyeceğini açıp kapatır.
- Etkin olduğunda akıl yürütme, `Reasoning:` önekiyle **ayrı mesaj** olarak gönderilir.
- `stream` (yalnızca Telegram): yanıt oluşturulurken akıl yürütmeyi Telegram taslak baloncuğuna akıtır, ardından nihai yanıtı akıl yürütme olmadan gönderir.
- Takma ad: `/reason`.
- Geçerli akıl yürütme düzeyini görmek için bağımsız değişken olmadan `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi yönerge, ardından oturum geçersiz kılması, ardından aracı başına varsayılan (`agents.list[].reasoningDefault`), ardından geri dönüş (`off`).

Bozuk yerel model akıl yürütme etiketleri muhafazakar şekilde ele alınır. Kapatılmış `<think>...</think>` blokları normal yanıtlarda gizli kalır ve zaten görünür metinden sonra kapatılmamış akıl yürütme de gizlenir. Bir yanıt tamamen tek bir kapatılmamış açılış etiketiyle sarılmışsa ve aksi halde boş metin olarak teslim edilecekse OpenClaw bozuk açılış etiketini kaldırır ve kalan metni teslim eder.

## İlgili

- Yükseltilmiş mod belgeleri [Yükseltilmiş mod](/tr/tools/elevated) bölümündedir.

## Heartbeat'ler

- Heartbeat prob gövdesi, yapılandırılmış heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Bir heartbeat mesajındaki satır içi yönergeler normal şekilde uygulanır (ancak heartbeat'lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimi varsayılan olarak yalnızca nihai yükü gönderir. Ayrı `Reasoning:` mesajını da göndermek için (varsa) `agents.defaults.heartbeat.includeReasoning: true` veya aracı başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbet UI

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde gelen oturum deposu/yapılandırmasındaki oturumun kayıtlı düzeyini yansıtır.
- Başka bir düzey seçmek, `sessions.patch` üzerinden oturum geçersiz kılmasını hemen yazar; bir sonraki göndermeyi beklemez ve tek seferlik `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman `Default (<resolved level>)` olur; burada çözümlenmiş varsayılan, etkin oturum modelinin sağlayıcı düşünme profilinden ve `/status` ile `session_status` tarafından kullanılan aynı geri dönüş mantığından gelir.
- Seçici, Gateway oturum satırı/varsayılanları tarafından döndürülen `thinkingLevels` değerini kullanır; `thinkingOptions` eski etiket listesi olarak tutulur. Tarayıcı UI kendi sağlayıcı regex listesini tutmaz; modele özgü düzey kümeleri Plugin'lere aittir.
- `/think:<level>` hâlâ çalışır ve aynı kayıtlı oturum düzeyini günceller; böylece sohbet yönergeleri ve seçici eşzamanlı kalır.

## Sağlayıcı profilleri

- Sağlayıcı Plugin'leri, modelin desteklenen seviyelerini ve varsayılanını tanımlamak için `resolveThinkingProfile(ctx)` sunabilir.
- Claude modellerini proxy eden sağlayıcı Plugin'leri, doğrudan Anthropic ve proxy kataloglarının hizalı kalması için `openclaw/plugin-sdk/provider-model-shared` içindeki `resolveClaudeThinkingProfile(modelId)` işlevini yeniden kullanmalıdır.
- Her profil seviyesinin depolanan kanonik bir `id` değeri (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` veya `max`) vardır ve bir görüntüleme `label` değeri içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Açık bir düşünme geçersiz kılmasını doğrulaması gereken araç Plugin'leri, `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ile birlikte `api.runtime.agent.normalizeThinkingLevel(...)` kullanmalıdır; kendi sağlayıcı/model seviye listelerini tutmamalıdır.
- Yapılandırılmış özel model meta verilerine erişimi olan araç Plugin'leri, `compat.supportedReasoningEfforts` katılımlarının Plugin tarafı doğrulamaya yansıması için `catalog` değerini `resolveThinkingPolicy` içine iletebilir.
- Yayımlanmış eski hook'lar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk adaptörleri olarak kalır, ancak yeni özel seviye kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları/varsayılanları `thinkingLevels`, `thinkingOptions` ve `thinkingDefault` sunar; böylece ACP/sohbet istemcileri, çalışma zamanı doğrulamasının kullandığı aynı profil kimliklerini ve etiketlerini işler.
