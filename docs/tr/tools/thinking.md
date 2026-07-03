---
read_when:
    - Düşünme, hızlı mod veya ayrıntılı yönerge ayrıştırmasını ya da varsayılanlarını ayarlama
summary: /think, /fast, /verbose, /trace için yönerge söz dizimi ve akıl yürütme görünürlüğü
title: Düşünme seviyeleri
x-i18n:
    generated_at: "2026-07-03T09:56:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6383ac18fbef0d06a97df5c204d57829ae4993b8287f8ef60aeae197ea711722
    source_path: tools/thinking.md
    workflow: 16
---

## Ne işe yarar

- Herhangi bir gelen gövdede satır içi yönerge: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Seviyeler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "düşün"
  - low → "yoğun düşün"
  - medium → "daha yoğun düşün"
  - high → "ultrathink" (azami bütçe)
  - xhigh → "ultrathink+" (GPT-5.2+ ve Codex modelleri, ayrıca Anthropic Claude Opus 4.7+ çabası)
  - adaptive → sağlayıcı tarafından yönetilen uyarlamalı düşünme (Anthropic/Bedrock üzerinde Claude 4.6, Anthropic Claude Opus 4.7+ ve Google Gemini dinamik düşünme için desteklenir)
  - max → sağlayıcı azami akıl yürütmesi (Anthropic Claude Opus 4.7+; Ollama bunu en yüksek yerel `think` çabasına eşler)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` değerine eşlenir.
  - `highest`, `high` değerine eşlenir.
- Sağlayıcı notları:
  - Düşünme menüleri ve seçicileri sağlayıcı profiline göre çalışır. Sağlayıcı Plugin'leri, ikili `on` gibi etiketler dahil seçili model için tam seviye kümesini bildirir.
  - `adaptive`, `xhigh` ve `max` yalnızca bunları destekleyen sağlayıcı/model profilleri için gösterilir. Desteklenmeyen seviyelere yönelik yazılmış yönergeler, o modelin geçerli seçenekleriyle reddedilir.
  - Mevcut saklanan desteklenmeyen seviyeler, sağlayıcı profili sırasına göre yeniden eşlenir. `adaptive`, uyarlamalı olmayan modellerde `medium` değerine düşer; `xhigh` ve `max` ise seçili model için desteklenen en büyük `off` dışı seviyeye düşer.
  - Anthropic Claude 4.6 modellerinde açık bir düşünme seviyesi ayarlanmadığında varsayılan değer `adaptive` olur.
  - Anthropic Claude Opus 4.8 ve Opus 4.7, siz açıkça bir düşünme seviyesi ayarlamadığınız sürece düşünmeyi kapalı tutar. Uyarlamalı düşünme etkinleştirildikten sonra Opus 4.8'in sağlayıcıya ait çaba varsayılanı `high` olur.
  - Anthropic Claude Opus 4.7+, `/think xhigh` değerini uyarlamalı düşünmeye ve `output_config.effort: "xhigh"` değerine eşler; çünkü `/think` bir düşünme yönergesidir ve `xhigh` Opus çaba ayarıdır.
  - Anthropic Claude Opus 4.7+ ayrıca `/think max` değerini de sunar; bu değer aynı sağlayıcıya ait azami çaba yoluna eşlenir.
  - Doğrudan DeepSeek V4 modelleri `/think xhigh|max` değerlerini sunar; ikisi de DeepSeek `reasoning_effort: "max"` değerine eşlenirken daha düşük `off` dışı seviyeler `high` değerine eşlenir.
  - OpenRouter üzerinden yönlendirilen DeepSeek V4 modelleri `/think xhigh` değerini sunar ve DeepSeek'e özgü üst düzey `reasoning_effort` yerine OpenRouter destekli `reasoning.effort` değerlerini gönderir. Daha düşük `off` dışı seviyeler `high` değerine eşlenir ve saklanan `max` geçersiz kılmaları `xhigh` değerine düşer.
  - Ollama düşünme özellikli modeller `/think low|medium|high|max` değerlerini sunar; Ollama'nın yerel API'si `low`, `medium` ve `high` çaba dizelerini kabul ettiği için `max`, yerel `think: "high"` değerine eşlenir.
  - OpenAI GPT modelleri `/think` değerini modele özgü Responses API çaba desteği üzerinden eşler. `/think off`, yalnızca hedef model desteklediğinde `reasoning.effort: "none"` gönderir; aksi takdirde OpenClaw desteklenmeyen bir değer göndermek yerine devre dışı bırakılmış akıl yürütme yükünü atlar.
  - Özel OpenAI uyumlu katalog girdileri, `models.providers.<provider>.models[].compat.supportedReasoningEfforts` değerini `"xhigh"` içerecek şekilde ayarlayarak `/think xhigh` desteğini seçebilir. Bu, giden OpenAI akıl yürütme çabası yüklerini eşleyen aynı uyumluluk meta verisini kullanır; böylece menüler, oturum doğrulaması, aracı CLI ve `llm-task` taşıma davranışıyla aynı fikirde olur.
  - Eskimiş yapılandırılmış OpenRouter Hunter Alpha başvuruları, kullanımdan kaldırılan rota son yanıt metnini akıl yürütme alanları üzerinden döndürebildiği için proxy akıl yürütme enjeksiyonunu atlar.
  - Google Gemini, `/think adaptive` değerini Gemini'nin sağlayıcıya ait dinamik düşünmesine eşler. Gemini 3 istekleri sabit bir `thinkingLevel` değerini atlar; Gemini 2.5 istekleri ise `thinkingBudget: -1` gönderir. Sabit seviyeler yine de ilgili model ailesi için en yakın Gemini `thinkingLevel` değerine veya bütçesine eşlenir.
  - Anthropic uyumlu akış yolundaki MiniMax M2.x (`minimax/MiniMax-M2*`), model parametrelerinde veya istek parametrelerinde açıkça düşünme ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, M2.x'in yerel olmayan Anthropic akış biçiminden `reasoning_content` deltalarının sızmasını önler. MiniMax-M3 (ve M3.x) muaftır: M3 uygun Anthropic düşünme blokları yayar ve düşünme devre dışı bırakıldığında boş içerik döndürür; bu yüzden OpenClaw M3'ü sağlayıcının atlanmış/uyarlamalı düşünme yolunda tutar.
  - Z.AI (`zai/*`), çoğu GLM modeli için ikilidir (`on`/`off`). GLM-5.2 istisnadır: `/think off|low|high|max` değerlerini sunar, `low` ve `high` değerlerini Z.AI `reasoning_effort: "high"` değerine, `max` değerini de `reasoning_effort: "max"` değerine eşler.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) her zaman düşünür. Profili yalnızca `on` değerini sunar ve OpenClaw, Moonshot tarafından gerekli olduğu gibi giden `thinking` alanını atlar. Diğer `moonshot/*` modelleri `/think off` değerini `thinking: { type: "disabled" }` değerine, `off` olmayan herhangi bir seviyeyi de `thinking: { type: "enabled" }` değerine eşler. Düşünme etkin olduğunda Moonshot yalnızca `tool_choice` için `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` değerine normalleştirir.

## Çözümleme sırası

1. Mesajdaki satır içi yönerge (yalnızca o mesaja uygulanır).
2. Oturum geçersiz kılması (yalnızca yönerge içeren bir mesaj gönderilerek ayarlanır).
3. Aracı başına varsayılan (`agents.list[].thinkingDefault` yapılandırmada).
4. Genel varsayılan (`agents.defaults.thinkingDefault` yapılandırmada).
5. Geri dönüş: varsa sağlayıcı tarafından bildirilen varsayılan; aksi takdirde akıl yürütme özellikli modeller `medium` değerine veya o model için desteklenen en yakın `off` dışı seviyeye çözümlenir, akıl yürütme özelliği olmayan modeller ise `off` kalır.

## Oturum varsayılanı ayarlama

- **Yalnızca** yönergeden oluşan bir mesaj gönderin (boşluklara izin verilir), ör. `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalıcı olur (varsayılan olarak gönderen başına). Oturum geçersiz kılmasını temizleyip yapılandırılmış/sağlayıcı varsayılanını devralmak için `/think default` kullanın; takma adlar arasında `inherit`, `clear`, `reset` ve `unpin` bulunur.
- `/think off`, açık bir kapalı geçersiz kılması saklar. Oturum geçersiz kılmasını değiştirene veya temizleyene kadar düşünmeyi devre dışı bırakır.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Seviye geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değişmeden bırakılır.
- Geçerli düşünme seviyesini görmek için bağımsız değişken olmadan `/think` (veya `/think:`) gönderin.

## Aracıya göre uygulama

- **Gömülü OpenClaw**: çözümlenen seviye süreç içi OpenClaw aracı çalışma zamanına aktarılır.
- **Claude CLI arka ucu**: `claude-cli` kullanılırken kapalı olmayan seviyeler Claude Code'a `--effort` olarak aktarılır; bkz. [CLI arka uçları](/tr/gateway/cli-backends).

## Hızlı mod (/fast)

- Seviyeler: `auto|on|off|default`.
- Yalnızca yönerge içeren mesaj, oturum hızlı mod geçersiz kılmasını açıp kapatır ve `Fast mode set to auto.`, `Fast mode enabled.` veya `Fast mode disabled.` yanıtını verir. Oturum geçersiz kılmasını temizleyip yapılandırılmış varsayılanı devralmak için `/fast default` kullanın; takma adlar arasında `inherit`, `clear`, `reset` ve `unpin` bulunur.
- Geçerli etkin hızlı mod durumunu görmek için mod olmadan `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca yönerge `/fast auto|on|off` geçersiz kılması (`/fast default` bu katmanı temizler)
  2. Oturum geçersiz kılması
  3. Aracı başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `auto`, oturum/yapılandırma modunu otomatik olarak tutar ancak her yeni model çağrısını bağımsız olarak çözümler. Otomatik kesimden önce başlayan çağrılarda hızlı mod etkin olur; daha sonraki yeniden deneme, geri dönüş, araç sonucu veya devam çağrıları hızlı mod devre dışı olarak başlar. Kesim varsayılan olarak 60 saniyedir; değiştirmek için etkin modelde `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` ayarlayın.
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- Codex destekli `openai/*` / `openai-codex/*` modelleri için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. Yerel Codex uygulama sunucusu dönüşleri katmanı yalnızca `turn/start` veya iş parçacığı başlatma/sürdürme sırasında alır; bu nedenle `auto`, zaten çalışan bir uygulama sunucusu dönüşünün katmanını yeniden belirleyemez; OpenClaw'ın başlattığı bir sonraki model dönüşüne uygulanır.
- `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dahil doğrudan herkese açık `anthropic/*` istekleri için hızlı mod Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto` ayarlar; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model parametreleri, ikisi de ayarlandığında hızlı mod varsayılanını geçersiz kılar. OpenClaw, Anthropic olmayan proxy temel URL'leri için Anthropic hizmet katmanı enjeksiyonunu yine de atlar.
- `/status`, hızlı mod etkin olduğunda `Fast`, yapılandırılmış mod otomatik olduğunda `Fast:auto` gösterir.

## Ayrıntılı yönergeler (/verbose veya /v)

- Seviyeler: `on` (en az) | `full` | `off` (varsayılan).
- Yalnızca yönerge içeren mesaj oturum ayrıntılılığını açıp kapatır ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz seviyeler durumu değiştirmeden bir ipucu döndürür.
- `/verbose off`, açık bir oturum geçersiz kılması saklar; bunu Sessions arayüzünde `inherit` seçerek temizleyin.
- Yetkili dış kanal göndericileri oturum ayrıntılılık geçersiz kılmasını kalıcı hale getirebilir. Dahili gateway/webchat istemcilerinin bunu kalıcı hale getirmek için `operator.admin` iznine ihtiyacı vardır.
- Satır içi yönerge yalnızca o mesajı etkiler; aksi takdirde oturum/genel varsayılanlar uygulanır.
- Geçerli ayrıntılılık seviyesini görmek için bağımsız değişken olmadan `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılılık açık olduğunda, yapılandırılmış araç sonuçları yayan aracılar her araç çağrısını, varsa `<emoji> <tool-name>: <arg>` önekiyle kendi yalnızca meta veri mesajı olarak geri gönderir. Bu araç özetleri, akış deltaları olarak değil, her araç başlar başlamaz gönderilir (ayrı baloncuklar).
- Araç hatası özetleri normal modda görünür kalır, ancak ham hata ayrıntısı sonekleri ayrıntılılık `full` olmadığı sürece gizlenir.
- Ayrıntılılık `full` olduğunda, araç çıktıları tamamlanmadan sonra da iletilir (ayrı baloncuk, güvenli bir uzunluğa kırpılmış). Bir çalışma devam ederken `/verbose on|full|off` geçişi yaparsanız, sonraki araç baloncukları yeni ayara uyar.
- `agents.defaults.toolProgressDetail`, `/verbose` araç özetlerinin ve ilerleme taslağı araç satırlarının biçimini denetler. `🛠️ Exec: checking JS syntax` gibi kısa insan etiketleri için `"explain"` (varsayılan) kullanın; hata ayıklama için ham komut/ayrıntının da eklenmesini istediğinizde `"raw"` kullanın. Aracı başına `agents.list[].toolProgressDetail` varsayılanı geçersiz kılar.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin izleme yönergeleri (/trace)

- Seviyeler: `on` | `off` (varsayılan).
- Yalnızca yönerge içeren mesaj, oturum Plugin izleme çıktısını açıp kapatır ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi yönerge yalnızca o mesajı etkiler; aksi takdirde oturum/genel varsayılanlar uygulanır.
- Geçerli izleme seviyesini görmek için bağımsız değişken olmadan `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose` değerinden daha dardır: yalnızca Active Memory hata ayıklama özetleri gibi Plugin'e ait izleme/hata ayıklama satırlarını gösterir.
- İzleme satırları `/status` içinde ve normal asistan yanıtından sonra bir takip tanılama mesajı olarak görünebilir.

## Akıl yürütme görünürlüğü (/reasoning)

- Seviyeler: `on|off|stream`.
- Yalnızca yönerge içeren mesaj, düşünme bloklarının yanıtlarda gösterilip gösterilmeyeceğini açıp kapatır.
- Etkinleştirildiğinde akıl yürütme, `Thinking` önekiyle **ayrı bir mesaj** olarak gönderilir.
- `stream`: etkin kanal akıl yürütme önizlemelerini desteklediğinde yanıt üretilirken akıl yürütmeyi akış halinde gönderir, ardından son yanıtı akıl yürütme olmadan gönderir.
- Takma ad: `/reason`.
- Geçerli akıl yürütme seviyesini görmek için bağımsız değişken olmadan `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi yönerge, sonra oturum geçersiz kılması, sonra aracı başına varsayılan (`agents.list[].reasoningDefault`), sonra genel varsayılan (`agents.defaults.reasoningDefault`), sonra geri dönüş (`off`).

Hatalı biçimlendirilmiş yerel model akıl yürütme etiketleri ihtiyatlı şekilde ele alınır. Kapatılmış `<think>...</think>` blokları normal yanıtlarda gizli kalır ve zaten görünür metinden sonra gelen kapatılmamış akıl yürütme de gizlenir. Bir yanıt tamamen tek bir kapatılmamış açılış etiketiyle sarılmışsa ve aksi halde boş metin olarak iletilecekse, OpenClaw hatalı biçimlendirilmiş açılış etiketini kaldırır ve kalan metni iletir.

## İlgili

- Yükseltilmiş mod belgeleri [Yükseltilmiş mod](/tr/tools/elevated) içinde yer alır.

## Heartbeat'ler

- Heartbeat yoklama gövdesi, yapılandırılmış Heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Bir Heartbeat iletisindeki satır içi yönergeler her zamanki gibi uygulanır (ancak Heartbeat'lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat iletimi varsayılan olarak yalnızca son yükü gönderir. Ayrı `Thinking` iletisini de göndermek için (mevcut olduğunda), `agents.defaults.heartbeat.includeReasoning: true` veya ajan başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbet kullanıcı arayüzü

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde gelen oturum deposundan/yapılandırmasından oturumun saklanan düzeyini yansıtır.
- Başka bir düzey seçmek, oturum geçersiz kılmasını `sessions.patch` üzerinden hemen yazar; sonraki göndermeyi beklemez ve tek kullanımlık bir `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman geçersiz kılmayı temizleme seçeneğidir. Devralınan düşünme devre dışı olduğunda `Inherited: Off` dahil olmak üzere `Inherited: <resolved level>` gösterir.
- Açık seçici seçimleri, sağlayıcı etiketleri varsa bunları koruyarak doğrudan düzey etiketlerini kullanır (örneğin sağlayıcı etiketli bir `max` seçeneği için `Maximum`).
- Seçici, Gateway oturum satırı/varsayılanları tarafından döndürülen `thinkingLevels` değerini kullanır; `thinkingOptions` ise eski etiket listesi olarak tutulur. Tarayıcı kullanıcı arayüzü kendi sağlayıcı regex listesini tutmaz; modele özgü düzey kümelerinin sahibi Plugin'lerdir.
- `/think:<level>` hâlâ çalışır ve aynı saklanan oturum düzeyini günceller; böylece sohbet yönergeleri ve seçici eşzamanlı kalır.

## Sağlayıcı profilleri

- Sağlayıcı Plugin'leri, modelin desteklenen düzeylerini ve varsayılanını tanımlamak için `resolveThinkingProfile(ctx)` sunabilir.
- Claude modellerine vekil olan sağlayıcı Plugin'leri, doğrudan Anthropic ve vekil katalogların uyumlu kalması için `openclaw/plugin-sdk/provider-model-shared` içinden `resolveClaudeThinkingProfile(modelId)` öğesini yeniden kullanmalıdır.
- Her profil düzeyinin saklanan kurallı bir `id` değeri vardır (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` veya `max`) ve bir görüntüleme `label` değeri içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Profil kancaları, mevcut olduğunda `reasoning`, `compat.thinkingFormat` ve `compat.supportedReasoningEfforts` dahil birleştirilmiş katalog bilgilerini alır. Bu bilgileri, yalnızca yapılandırılmış istek sözleşmesi eşleşen yükü desteklediğinde ikili veya özel profilleri sunmak için kullanın.
- Açık bir düşünme geçersiz kılmasını doğrulaması gereken araç Plugin'leri, `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ile `api.runtime.agent.normalizeThinkingLevel(...)` kullanmalıdır; kendi sağlayıcı/model düzey listelerini tutmamalıdır.
- Yapılandırılmış özel model üst verilerine erişimi olan araç Plugin'leri, `compat.supportedReasoningEfforts` kabul seçeneklerinin Plugin tarafı doğrulamaya yansıtılması için `catalog` değerini `resolveThinkingPolicy` içine aktarabilir.
- Yayımlanmış eski kancalar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk bağdaştırıcıları olarak kalır, ancak yeni özel düzey kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları/varsayılanları, ACP/sohbet istemcilerinin çalışma zamanı doğrulamasının kullandığı aynı profil kimliklerini ve etiketlerini işlemesi için `thinkingLevels`, `thinkingOptions` ve `thinkingDefault` sunar.
