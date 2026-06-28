---
read_when:
    - Düşünme, fast-mode veya verbose yönerge ayrıştırmasını ya da varsayılanlarını ayarlama
summary: /think, /fast, /verbose, /trace için direktif söz dizimi ve akıl yürütme görünürlüğü
title: Düşünme düzeyleri
x-i18n:
    generated_at: "2026-06-28T01:26:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cea488a92c6d2a5371dbe0488199f41a56b44616a2936b077644f8a8324e8129
    source_path: tools/thinking.md
    workflow: 16
---

## Ne yapar

- Gelen herhangi bir gövdede satır içi yönerge: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Seviyeler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (maksimum bütçe)
  - xhigh → "ultrathink+" (GPT-5.2+ ve Codex modelleri, ayrıca Anthropic Claude Opus 4.7+ çabası)
  - adaptive → sağlayıcı tarafından yönetilen uyarlamalı düşünme (Anthropic/Bedrock üzerinde Claude 4.6, Anthropic Claude Opus 4.7+ ve Google Gemini dinamik düşünme için desteklenir)
  - max → sağlayıcının maksimum akıl yürütmesi (Anthropic Claude Opus 4.7+; Ollama bunu en yüksek yerel `think` çabasına eşler)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` değerine eşlenir.
  - `highest`, `high` değerine eşlenir.
- Sağlayıcı notları:
  - Düşünme menüleri ve seçiciler sağlayıcı profiline göre çalışır. Sağlayıcı Plugin'leri, ikili `on` gibi etiketler dahil olmak üzere seçilen model için tam seviye kümesini bildirir.
  - `adaptive`, `xhigh` ve `max` yalnızca bunları destekleyen sağlayıcı/model profilleri için gösterilir. Desteklenmeyen seviyeler için yazılmış yönergeler, o modelin geçerli seçenekleriyle reddedilir.
  - Mevcut kayıtlı desteklenmeyen seviyeler, sağlayıcı profili sıralamasına göre yeniden eşlenir. `adaptive`, uyarlamalı olmayan modellerde `medium` değerine geri dönerken, `xhigh` ve `max` seçilen model için desteklenen en büyük `off` dışı seviyeye geri döner.
  - Anthropic Claude 4.6 modelleri, açık bir düşünme seviyesi ayarlanmadığında varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.8 ve Opus 4.7, açıkça bir düşünme seviyesi ayarlamadığınız sürece düşünmeyi kapalı tutar. Opus 4.8'in sağlayıcıya ait çaba varsayılanı, uyarlamalı düşünme etkinleştirildikten sonra `high` olur.
  - Anthropic Claude Opus 4.7+, `/think xhigh` değerini uyarlamalı düşünmeye ve `output_config.effort: "xhigh"` değerine eşler; çünkü `/think` bir düşünme yönergesidir ve `xhigh` Opus çaba ayarıdır.
  - Anthropic Claude Opus 4.7+ ayrıca `/think max` değerini sunar; bu aynı sağlayıcıya ait maksimum çaba yoluna eşlenir.
  - Doğrudan DeepSeek V4 modelleri `/think xhigh|max` değerini sunar; ikisi de DeepSeek `reasoning_effort: "max"` değerine eşlenirken daha düşük `off` dışı seviyeler `high` değerine eşlenir.
  - OpenRouter üzerinden yönlendirilen DeepSeek V4 modelleri `/think xhigh` değerini sunar ve OpenRouter destekli `reasoning_effort` değerlerini gönderir. Kayıtlı `max` geçersiz kılmaları `xhigh` değerine geri döner.
  - Ollama düşünme yetenekli modelleri `/think low|medium|high|max` değerini sunar; `max`, yerel `think: "high"` değerine eşlenir çünkü Ollama'nın yerel API'si `low`, `medium` ve `high` çaba dizelerini kabul eder.
  - OpenAI GPT modelleri `/think` değerini modele özgü Responses API çaba desteği üzerinden eşler. `/think off`, yalnızca hedef model destekliyorsa `reasoning.effort: "none"` gönderir; aksi halde OpenClaw, desteklenmeyen bir değer göndermek yerine devre dışı bırakılmış akıl yürütme yükünü atlar.
  - Özel OpenAI uyumlu katalog girdileri, `models.providers.<provider>.models[].compat.supportedReasoningEfforts` değerini `"xhigh"` içerecek şekilde ayarlayarak `/think xhigh` desteğine katılabilir. Bu, giden OpenAI akıl yürütme çabası yüklerini eşleyen aynı uyumluluk meta verisini kullanır; böylece menüler, oturum doğrulaması, ajan CLI'si ve `llm-task` taşıma davranışıyla aynı fikirde olur.
  - Eskimiş yapılandırılmış OpenRouter Hunter Alpha başvuruları, kullanımdan kaldırılmış bu rota son yanıt metnini akıl yürütme alanları üzerinden döndürebildiği için proxy akıl yürütme enjeksiyonunu atlar.
  - Google Gemini, `/think adaptive` değerini Gemini'nin sağlayıcıya ait dinamik düşünmesine eşler. Gemini 3 istekleri sabit bir `thinkingLevel` değerini atlar; Gemini 2.5 istekleri ise `thinkingBudget: -1` gönderir; sabit seviyeler yine de o model ailesi için en yakın Gemini `thinkingLevel` değerine veya bütçesine eşlenir.
  - Anthropic uyumlu akış yolundaki MiniMax M2.x (`minimax/MiniMax-M2*`), model parametrelerinde veya istek parametrelerinde açıkça düşünme ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, M2.x'in yerel olmayan Anthropic akış biçiminden `reasoning_content` deltalarının sızmasını önler. MiniMax-M3 (ve M3.x) muaf tutulur: M3 düzgün Anthropic düşünme blokları yayar ve düşünme devre dışıyken boş içerik döndürür; bu nedenle OpenClaw, M3'ü sağlayıcının atlanmış/uyarlamalı düşünme yolunda tutar.
  - Z.AI (`zai/*`) çoğu GLM modeli için ikilidir (`on`/`off`). GLM-5.2 istisnadır: `/think off|low|high|max` değerini sunar, `low` ve `high` değerlerini Z.AI `reasoning_effort: "high"` değerine eşler ve `max` değerini `reasoning_effort: "max"` değerine eşler.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) her zaman düşünür. Profili yalnızca `on` değerini sunar ve OpenClaw, Moonshot tarafından zorunlu kılındığı şekilde giden `thinking` alanını atlar. Diğer `moonshot/*` modelleri `/think off` değerini `thinking: { type: "disabled" }` değerine, `off` dışı herhangi bir seviyeyi ise `thinking: { type: "enabled" }` değerine eşler. Düşünme etkinleştirildiğinde Moonshot yalnızca `tool_choice` için `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` değerine normalleştirir.

## Çözümleme sırası

1. Mesaj üzerindeki satır içi yönerge (yalnızca o mesaja uygulanır).
2. Oturum geçersiz kılması (yalnızca yönerge içeren bir mesaj gönderilerek ayarlanır).
3. Ajan başına varsayılan (yapılandırmadaki `agents.list[].thinkingDefault`).
4. Genel varsayılan (yapılandırmadaki `agents.defaults.thinkingDefault`).
5. Geri dönüş: varsa sağlayıcının bildirdiği varsayılan; aksi halde akıl yürütme yetenekli modeller `medium` değerine veya o model için desteklenen en yakın `off` dışı seviyeye çözümlenir, akıl yürütmeyen modeller ise `off` kalır.

## Oturum varsayılanı ayarlama

- **Yalnızca** yönerge olan bir mesaj gönderin (boşluklara izin verilir), ör. `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalıcı olur (varsayılan olarak gönderen başına). Oturum geçersiz kılmasını temizlemek ve yapılandırılmış/sağlayıcı varsayılanını devralmak için `/think default` kullanın; takma adlar arasında `inherit`, `clear`, `reset` ve `unpin` bulunur.
- `/think off`, açık bir kapalı geçersiz kılması kaydeder. Oturum geçersiz kılmasını değiştirene veya temizleyene kadar düşünmeyi devre dışı bırakır.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Seviye geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değiştirilmez.
- Geçerli düşünme seviyesini görmek için argümansız `/think` (veya `/think:`) gönderin.

## Ajana göre uygulama

- **Gömülü OpenClaw**: çözümlenen seviye, süreç içi OpenClaw ajan çalışma zamanına geçirilir.
- **Claude CLI arka ucu**: `claude-cli` kullanılırken `off` dışı seviyeler Claude Code'a `--effort` olarak geçirilir; bkz. [CLI arka uçları](/tr/gateway/cli-backends).

## Hızlı mod (/fast)

- Seviyeler: `auto|on|off|default`.
- Yalnızca yönerge içeren mesaj, bir oturum hızlı mod geçersiz kılmasını açıp kapatır ve `Fast mode set to auto.`, `Fast mode enabled.` veya `Fast mode disabled.` yanıtını verir. Oturum geçersiz kılmasını temizlemek ve yapılandırılmış varsayılanı devralmak için `/fast default` kullanın; takma adlar arasında `inherit`, `clear`, `reset` ve `unpin` bulunur.
- Geçerli etkin hızlı mod durumunu görmek için modsuz `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca yönerge `/fast auto|on|off` geçersiz kılması (`/fast default` bu katmanı temizler)
  2. Oturum geçersiz kılması
  3. Ajan başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `auto`, oturum/yapılandırma modunu otomatik olarak tutar ancak her yeni model çağrısını bağımsız olarak çözümler. Otomatik kesimden önce başlayan çağrılarda hızlı mod etkin olur; daha sonraki yeniden deneme, geri dönüş, araç sonucu veya devam çağrıları hızlı mod devre dışı olarak başlar. Kesim varsayılan olarak 60 saniyedir; değiştirmek için etkin modelde `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` ayarını yapın.
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- Codex destekli `openai/*` / `openai-codex/*` modelleri için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. Yerel Codex uygulama sunucusu dönüşleri kademeyi yalnızca `turn/start` veya iş parçacığı başlatma/sürdürme sırasında alır; bu nedenle `auto`, zaten çalışan bir uygulama sunucusu dönüşünü yeniden kademelendiremez; OpenClaw'ın başlattığı bir sonraki model dönüşüne uygulanır.
- OAuth kimlik doğrulamalı olarak `api.anthropic.com` adresine gönderilen trafik dahil doğrudan genel `anthropic/*` istekleri için hızlı mod Anthropic hizmet kademelerine eşlenir: `/fast on`, `service_tier=auto` ayarlar; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model parametreleri, ikisi de ayarlandığında hızlı mod varsayılanını geçersiz kılar. OpenClaw yine de Anthropic olmayan proxy temel URL'leri için Anthropic hizmet kademesi enjeksiyonunu atlar.
- `/status`, hızlı mod etkin olduğunda `Fast`, yapılandırılmış mod otomatik olduğunda `Fast:auto` gösterir.

## Ayrıntılı yönergeler (/verbose veya /v)

- Seviyeler: `on` (minimal) | `full` | `off` (varsayılan).
- Yalnızca yönerge içeren mesaj, oturum ayrıntılı modunu açıp kapatır ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz seviyeler durumu değiştirmeden bir ipucu döndürür.
- `/verbose off`, açık bir oturum geçersiz kılması kaydeder; bunu Oturumlar arayüzünde `inherit` seçerek temizleyin.
- Yetkili harici kanal gönderenleri oturum ayrıntılı geçersiz kılmasını kalıcı hale getirebilir. Dahili Gateway/webchat istemcilerinin bunu kalıcı hale getirmek için `operator.admin` yetkisine ihtiyacı vardır.
- Satır içi yönerge yalnızca o mesajı etkiler; aksi halde oturum/genel varsayılanlar uygulanır.
- Geçerli ayrıntılı seviyeyi görmek için argümansız `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı mod açıkken, yapılandırılmış araç sonuçları yayan ajanlar her araç çağrısını, mümkün olduğunda `<emoji> <tool-name>: <arg>` ön ekiyle kendi yalnızca meta veri mesajı olarak geri gönderir. Bu araç özetleri her araç başlar başlamaz gönderilir (ayrı baloncuklar), akış deltaları olarak değil.
- Araç hata özetleri normal modda görünür kalır, ancak ham hata ayrıntısı son ekleri ayrıntılı mod `full` değilse gizlenir.
- Ayrıntılı mod `full` olduğunda, araç çıktıları tamamlandıktan sonra da iletilir (ayrı baloncuk, güvenli bir uzunluğa kırpılmış). Bir çalıştırma devam ederken `/verbose on|full|off` değerini değiştirirseniz, sonraki araç baloncukları yeni ayara uyar.
- `agents.defaults.toolProgressDetail`, `/verbose` araç özetlerinin ve ilerleme taslağı araç satırlarının şeklini kontrol eder. `🛠️ Exec: checking JS syntax` gibi kompakt insan etiketleri için `"explain"` (varsayılan) kullanın; hata ayıklama için ham komut/ayrıntının da eklenmesini istediğinizde `"raw"` kullanın. Ajan başına `agents.list[].toolProgressDetail` varsayılanı geçersiz kılar.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin izleme yönergeleri (/trace)

- Seviyeler: `on` | `off` (varsayılan).
- Yalnızca yönerge içeren mesaj, oturum Plugin izleme çıktısını açıp kapatır ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi yönerge yalnızca o mesajı etkiler; aksi halde oturum/genel varsayılanlar uygulanır.
- Geçerli izleme seviyesini görmek için argümansız `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose` değerinden daha dardır: yalnızca Active Memory hata ayıklama özetleri gibi Plugin'e ait izleme/hata ayıklama satırlarını açığa çıkarır.
- İzleme satırları `/status` içinde ve normal asistan yanıtından sonra bir takip tanılama mesajı olarak görünebilir.

## Akıl yürütme görünürlüğü (/reasoning)

- Seviyeler: `on|off|stream`.
- Yalnızca yönerge içeren mesaj, düşünme bloklarının yanıtlarda gösterilip gösterilmeyeceğini açıp kapatır.
- Etkinleştirildiğinde akıl yürütme, `Thinking` ön ekiyle **ayrı bir mesaj** olarak gönderilir.
- `stream`: etkin kanal akıl yürütme önizlemelerini desteklediğinde yanıt oluşturulurken akıl yürütmeyi akış olarak gönderir, ardından son yanıtı akıl yürütme olmadan gönderir.
- Takma ad: `/reason`.
- Geçerli akıl yürütme seviyesini görmek için argümansız `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi yönerge, ardından oturum geçersiz kılması, ardından ajan başına varsayılan (`agents.list[].reasoningDefault`), ardından genel varsayılan (`agents.defaults.reasoningDefault`), ardından geri dönüş (`off`).

Hatalı biçimlendirilmiş yerel model akıl yürütme etiketleri temkinli şekilde işlenir. Kapatılmış `<think>...</think>` blokları normal yanıtlarda gizli kalır ve zaten görünür metinden sonra gelen kapatılmamış akıl yürütme de gizlenir. Bir yanıt tamamen tek bir kapatılmamış açılış etiketiyle sarılmışsa ve aksi halde boş metin olarak iletilecekse, OpenClaw hatalı biçimlendirilmiş açılış etiketini kaldırır ve kalan metni iletir.

## İlgili

- Yükseltilmiş mod belgeleri [Yükseltilmiş mod](/tr/tools/elevated) içinde bulunur.

## Heartbeat'ler

- Heartbeat denetim gövdesi yapılandırılmış heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Bir heartbeat iletisindeki satır içi yönergeler her zamanki gibi uygulanır (ancak heartbeat'lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimi varsayılan olarak yalnızca son yükü gönderir. Ayrı `Thinking` iletisini de göndermek için (varsa), `agents.defaults.heartbeat.includeReasoning: true` veya aracı başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbet kullanıcı arayüzü

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde gelen oturum deposundan/yapılandırmasından oturumun saklanan düzeyini yansıtır.
- Başka bir düzey seçmek, oturum geçersiz kılmasını `sessions.patch` aracılığıyla hemen yazar; bir sonraki gönderimi beklemez ve tek seferlik bir `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman geçersiz kılmayı temizleme seçeneğidir. Devralınan düşünme devre dışı olduğunda `Inherited: Off` dahil olmak üzere `Inherited: <resolved level>` gösterir.
- Açık seçici seçenekleri, sağlayıcı etiketleri mevcut olduğunda bunları korurken doğrudan düzey etiketlerini kullanır (örneğin sağlayıcı etiketli bir `max` seçeneği için `Maximum`).
- Seçici, Gateway oturum satırı/varsayılanları tarafından döndürülen `thinkingLevels` değerini kullanır; `thinkingOptions` ise eski etiket listesi olarak tutulur. Tarayıcı kullanıcı arayüzü kendi sağlayıcı regex listesini tutmaz; modele özgü düzey kümelerinin sahibi plugin'lerdir.
- `/think:<level>` çalışmaya devam eder ve aynı saklanan oturum düzeyini günceller; böylece sohbet yönergeleri ve seçici eşzamanlı kalır.

## Sağlayıcı profilleri

- Sağlayıcı plugin'leri, modelin desteklenen düzeylerini ve varsayılanını tanımlamak için `resolveThinkingProfile(ctx)` sunabilir.
- Claude modellerini proxy eden sağlayıcı plugin'leri, doğrudan Anthropic ve proxy kataloglarının hizalı kalması için `openclaw/plugin-sdk/provider-model-shared` içinden `resolveClaudeThinkingProfile(modelId)` kullanmalıdır.
- Her profil düzeyinin saklanan kanonik bir `id` değeri vardır (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` veya `max`) ve bir görüntüleme `label` değeri içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Profil kancaları, mevcut olduğunda `reasoning`, `compat.thinkingFormat` ve `compat.supportedReasoningEfforts` dahil birleştirilmiş katalog olgularını alır. Bu olguları, yalnızca yapılandırılmış istek sözleşmesi eşleşen yükü desteklediğinde ikili veya özel profilleri sunmak için kullanın.
- Açık bir düşünme geçersiz kılmasını doğrulaması gereken araç plugin'leri, `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ile `api.runtime.agent.normalizeThinkingLevel(...)` kullanmalıdır; kendi sağlayıcı/model düzey listelerini tutmamalıdır.
- Yapılandırılmış özel model meta verilerine erişimi olan araç plugin'leri, `compat.supportedReasoningEfforts` katılımlarının plugin tarafı doğrulamaya yansıtılması için `resolveThinkingPolicy` içine `catalog` geçirebilir.
- Yayımlanmış eski kancalar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk adaptörleri olarak kalır, ancak yeni özel düzey kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları/varsayılanları `thinkingLevels`, `thinkingOptions` ve `thinkingDefault` değerlerini sunar; böylece ACP/sohbet istemcileri, çalışma zamanı doğrulamasının kullandığı aynı profil kimliklerini ve etiketlerini işler.
