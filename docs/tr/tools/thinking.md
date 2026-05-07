---
read_when:
    - Düşünme, hızlı mod veya ayrıntılı yönerge ayrıştırmasını ya da varsayılanlarını ayarlama
summary: /think, /fast, /verbose, /trace ve akıl yürütme görünürlüğü için yönerge söz dizimi
title: Düşünme seviyeleri
x-i18n:
    generated_at: "2026-05-07T13:27:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8890563aa0171d41549f1d1a6af3279babbcba17eb19302753275e9e2ff01980
    source_path: tools/thinking.md
    workflow: 16
---

## Ne yapar

- Herhangi bir gelen gövdede satır içi yönerge: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Seviyeler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (azami bütçe)
  - xhigh → "ultrathink+" (GPT-5.2+ ve Codex modelleri, ayrıca Anthropic Claude Opus 4.7 effort)
  - adaptive → sağlayıcı tarafından yönetilen uyarlamalı düşünme (Anthropic/Bedrock üzerinde Claude 4.6, Anthropic Claude Opus 4.7 ve Google Gemini dinamik düşünme için desteklenir)
  - max → sağlayıcının azami reasoning düzeyi (Anthropic Claude Opus 4.7; Ollama bunu en yüksek yerel `think` effort düzeyine eşler)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` değerine eşlenir.
  - `highest`, `high` değerine eşlenir.
- Sağlayıcı notları:
  - Düşünme menüleri ve seçicileri sağlayıcı profiliyle belirlenir. Sağlayıcı Plugin'leri, ikili `on` gibi etiketler dahil olmak üzere seçilen model için kesin seviye kümesini bildirir.
  - `adaptive`, `xhigh` ve `max` yalnızca bunları destekleyen sağlayıcı/model profilleri için gösterilir. Desteklenmeyen seviyeler için yazılan yönergeler, o modelin geçerli seçenekleriyle birlikte reddedilir.
  - Mevcut kayıtlı desteklenmeyen seviyeler sağlayıcı profili sıralamasına göre yeniden eşlenir. `adaptive`, uyarlamalı olmayan modellerde `medium` değerine geri düşerken, `xhigh` ve `max` seçilen model için desteklenen en büyük `off` dışı seviyeye geri düşer.
  - Anthropic Claude 4.6 modelleri, açık bir düşünme seviyesi ayarlanmadığında varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.7, varsayılan olarak uyarlamalı düşünmeye geçmez. API effort varsayılanı, açıkça bir düşünme seviyesi ayarlamadığınız sürece sağlayıcıya aittir.
  - Anthropic Claude Opus 4.7, `/think xhigh` değerini uyarlamalı düşünmeye ve `output_config.effort: "xhigh"` değerine eşler; çünkü `/think` bir düşünme yönergesidir ve `xhigh`, Opus 4.7 effort ayarıdır.
  - Anthropic Claude Opus 4.7 ayrıca `/think max` sunar; bu, sağlayıcıya ait aynı azami effort yoluna eşlenir.
  - Doğrudan DeepSeek V4 modelleri `/think xhigh|max` sunar; ikisi de DeepSeek `reasoning_effort: "max"` değerine eşlenirken daha düşük `off` dışı seviyeler `high` değerine eşlenir.
  - OpenRouter üzerinden yönlendirilen DeepSeek V4 modelleri `/think xhigh` sunar ve OpenRouter tarafından desteklenen `reasoning_effort` değerlerini gönderir. Kayıtlı `max` geçersiz kılmaları `xhigh` değerine geri düşer.
  - Ollama düşünme yetenekli modelleri `/think low|medium|high|max` sunar; `max`, yerel `think: "high"` değerine eşlenir çünkü Ollama'nın yerel API'si `low`, `medium` ve `high` effort dizelerini kabul eder.
  - OpenAI GPT modelleri `/think` değerini modele özgü Responses API effort desteği üzerinden eşler. `/think off`, yalnızca hedef model desteklediğinde `reasoning.effort: "none"` gönderir; aksi halde OpenClaw, desteklenmeyen bir değer göndermek yerine devre dışı reasoning yükünü atlar.
  - Özel OpenAI uyumlu katalog girdileri, `models.providers.<provider>.models[].compat.supportedReasoningEfforts` değerini `"xhigh"` içerecek şekilde ayarlayarak `/think xhigh` seçeneğine dahil olabilir. Bu, giden OpenAI reasoning effort yüklerini eşleyen aynı uyumluluk meta verisini kullanır; böylece menüler, oturum doğrulaması, ajan CLI ve `llm-task` taşıma davranışıyla uyumlu olur.
  - Eski yapılandırılmış OpenRouter Hunter Alpha referansları, proxy reasoning eklemesini atlar çünkü kullanımdan kaldırılmış bu rota reasoning alanları üzerinden son yanıt metni döndürebilirdi.
  - Google Gemini, `/think adaptive` değerini Gemini'nin sağlayıcıya ait dinamik düşünmesine eşler. Gemini 3 istekleri sabit bir `thinkingLevel` içermezken Gemini 2.5 istekleri `thinkingBudget: -1` gönderir; sabit seviyeler yine de ilgili model ailesi için en yakın Gemini `thinkingLevel` değerine veya bütçesine eşlenir.
  - Anthropic uyumlu akış yolunda MiniMax (`minimax/*`), model parametrelerinde veya istek parametrelerinde açıkça düşünme ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax'in yerel olmayan Anthropic akış biçiminden `reasoning_content` deltalarının sızmasını önler.
  - Z.AI (`zai/*`) yalnızca ikili düşünmeyi (`on`/`off`) destekler. `off` dışındaki her seviye `on` olarak ele alınır (`low` değerine eşlenir).
  - Moonshot (`moonshot/*`), `/think off` değerini `thinking: { type: "disabled" }` değerine, `off` dışındaki her seviyeyi ise `thinking: { type: "enabled" }` değerine eşler. Düşünme etkin olduğunda Moonshot yalnızca `tool_choice` için `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalleştirir.

## Çözümleme sırası

1. Mesajdaki satır içi yönerge (yalnızca o mesaja uygulanır).
2. Oturum geçersiz kılması (yalnızca yönergeden oluşan bir mesaj gönderilerek ayarlanır).
3. Ajan başına varsayılan (`agents.list[].thinkingDefault`, yapılandırmada).
4. Genel varsayılan (`agents.defaults.thinkingDefault`, yapılandırmada).
5. Geri dönüş: varsa sağlayıcının bildirdiği varsayılan; aksi halde reasoning yetenekli modeller `medium` değerine veya o model için desteklenen en yakın `off` dışı seviyeye çözümlenir, reasoning özelliği olmayan modeller ise `off` olarak kalır.

## Oturum varsayılanı ayarlama

- **Yalnızca** yönergeden oluşan bir mesaj gönderin (boşluklara izin verilir), ör. `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalıcı olur (varsayılan olarak gönderen başına); `/think:off` veya oturum boşta sıfırlamasıyla temizlenir.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Seviye geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değişmeden bırakılır.
- Geçerli düşünme seviyesini görmek için bağımsız değişken olmadan `/think` (veya `/think:`) gönderin.

## Ajan tarafından uygulama

- **Yerleşik Pi**: çözümlenen seviye süreç içi Pi ajan çalışma zamanına geçirilir.
- **Claude CLI arka ucu**: `claude-cli` kullanılırken `off` dışı seviyeler Claude Code'a `--effort` olarak geçirilir; bkz. [CLI arka uçları](/tr/gateway/cli-backends).

## Hızlı mod (/fast)

- Seviyeler: `on|off`.
- Yalnızca yönergeden oluşan mesaj, bir oturum hızlı mod geçersiz kılmasını açıp kapatır ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir.
- Geçerli etkin hızlı mod durumunu görmek için mod olmadan `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca yönerge `/fast on|off`
  2. Oturum geçersiz kılması
  3. Ajan başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- `openai-codex/*` için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. OpenClaw, iki kimlik doğrulama yolu arasında tek bir paylaşılan `/fast` anahtarı tutar.
- OAuth kimlik doğrulamalı olarak `api.anthropic.com` adresine gönderilen trafik dahil doğrudan herkese açık `anthropic/*` istekleri için hızlı mod Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto` ayarlar; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yolda `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model parametreleri, ikisi de ayarlandığında hızlı mod varsayılanını geçersiz kılar. OpenClaw yine de Anthropic olmayan proxy temel URL'leri için Anthropic hizmet katmanı eklemesini atlar.
- `/status`, hızlı mod yalnızca etkin olduğunda `Fast` gösterir.

## Ayrıntılı yönergeler (/verbose veya /v)

- Seviyeler: `on` (asgari) | `full` | `off` (varsayılan).
- Yalnızca yönergeden oluşan mesaj, oturum ayrıntılı modunu açıp kapatır ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz seviyeler durumu değiştirmeden bir ipucu döndürür.
- `/verbose off`, açık bir oturum geçersiz kılması kaydeder; bunu Sessions arayüzünden `inherit` seçerek temizleyin.
- Satır içi yönerge yalnızca o mesajı etkiler; aksi halde oturum/genel varsayılanlar uygulanır.
- Geçerli ayrıntı seviyesini görmek için bağımsız değişken olmadan `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı mod açıkken, yapılandırılmış araç sonuçları yayan ajanlar (Pi, diğer JSON ajanları), her araç çağrısını, mümkün olduğunda `<emoji> <tool-name>: <arg>` ön ekiyle kendi yalnızca meta veri mesajı olarak geri gönderir. Bu araç özetleri, her araç başlar başlamaz gönderilir (ayrı baloncuklar), akış deltaları olarak değil.
- Araç hata özetleri normal modda görünür kalır, ancak ham hata ayrıntısı son ekleri ayrıntılı mod `on` veya `full` olmadığı sürece gizlenir.
- Ayrıntılı mod `full` olduğunda, araç çıktıları da tamamlandıktan sonra iletilir (ayrı baloncuk, güvenli bir uzunluğa kırpılmış). Bir çalışma devam ederken `/verbose on|full|off` geçişi yaparsanız, sonraki araç baloncukları yeni ayara uyar.
- `agents.defaults.toolProgressDetail`, `/verbose` araç özetlerinin ve ilerleme taslağı araç satırlarının şeklini denetler. `🛠️ Exec: checking JS syntax` gibi kompakt insan etiketleri için `"explain"` (varsayılan) kullanın; hata ayıklama için ham komut/ayrıntının da eklenmesini istediğinizde `"raw"` kullanın. Ajan başına `agents.list[].toolProgressDetail` varsayılanı geçersiz kılar.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin izleme yönergeleri (/trace)

- Seviyeler: `on` | `off` (varsayılan).
- Yalnızca yönergeden oluşan mesaj, oturum Plugin izleme çıktısını açıp kapatır ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi yönerge yalnızca o mesajı etkiler; aksi halde oturum/genel varsayılanlar uygulanır.
- Geçerli izleme seviyesini görmek için bağımsız değişken olmadan `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose` değerinden daha dardır: yalnızca Active Memory hata ayıklama özetleri gibi Plugin'e ait izleme/hata ayıklama satırlarını gösterir.
- İzleme satırları `/status` içinde ve normal asistan yanıtından sonra takip eden tanılama mesajı olarak görünebilir.

## Reasoning görünürlüğü (/reasoning)

- Seviyeler: `on|off|stream`.
- Yalnızca yönergeden oluşan mesaj, düşünme bloklarının yanıtlarda gösterilip gösterilmeyeceğini açıp kapatır.
- Etkinleştirildiğinde reasoning, `Reasoning:` ön ekiyle **ayrı bir mesaj** olarak gönderilir.
- `stream` (yalnızca Telegram): yanıt oluşturulurken reasoning'i Telegram taslak baloncuğuna akıtır, ardından son yanıtı reasoning olmadan gönderir.
- Takma ad: `/reason`.
- Geçerli reasoning seviyesini görmek için bağımsız değişken olmadan `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi yönerge, ardından oturum geçersiz kılması, ardından ajan başına varsayılan (`agents.list[].reasoningDefault`), ardından geri dönüş (`off`).

Hatalı biçimlendirilmiş yerel model reasoning etiketleri ihtiyatlı şekilde ele alınır. Kapalı `<think>...</think>` blokları normal yanıtlarda gizli kalır ve zaten görünür metinden sonra kapatılmamış reasoning de gizlenir. Bir yanıt tamamen tek bir kapatılmamış açılış etiketiyle sarılmışsa ve aksi halde boş metin olarak iletilecekse, OpenClaw hatalı açılış etiketini kaldırır ve kalan metni iletir.

## İlgili

- Yükseltilmiş mod belgeleri [Yükseltilmiş mod](/tr/tools/elevated) içinde bulunur.

## Heartbeat'ler

- Heartbeat yoklama gövdesi, yapılandırılmış Heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Bir Heartbeat mesajındaki satır içi yönergeler her zamanki gibi uygulanır (ancak Heartbeat'lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimi varsayılan olarak yalnızca son yükü gönderir. Ayrı `Reasoning:` mesajını da göndermek için (varsa) `agents.defaults.heartbeat.includeReasoning: true` veya ajan başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbet arayüzü

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde gelen oturum deposu/yapılandırmasındaki oturumun saklanan düzeyini yansıtır.
- Başka bir düzey seçmek, oturum geçersiz kılmasını `sessions.patch` üzerinden hemen yazar; sonraki gönderimi beklemez ve tek seferlik bir `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman geçersiz kılmayı temizleme seçeneğidir. Oturum, kapalı olmayan etkili bir varsayılanı devralıyorsa `Devralınan: <resolved level>`, devralınan düşünme devre dışıysa `Kapalı` gösterir.
- Açık seçici tercihleri, mevcut olduğunda sağlayıcı etiketlerini koruyarak geçersiz kılma olarak etiketlenir (örneğin sağlayıcı etiketli bir `max` seçeneği için `Geçersiz kılma: maximum`).
- Seçici, gateway oturum satırı/varsayılanları tarafından döndürülen `thinkingLevels` değerlerini kullanır; `thinkingOptions` ise eski etiket listesi olarak korunur. Tarayıcı arayüzü kendi sağlayıcı regex listesini tutmaz; modele özgü düzey kümelerinin sahibi plugins’tir.
- `/think:<level>` hala çalışır ve aynı saklanan oturum düzeyini günceller; böylece sohbet yönergeleri ve seçici senkronize kalır.

## Sağlayıcı profilleri

- Sağlayıcı plugins’i, modelin desteklenen düzeylerini ve varsayılanını tanımlamak için `resolveThinkingProfile(ctx)` sunabilir.
- Claude modellerini proxy eden sağlayıcı plugins’i, doğrudan Anthropic ve proxy kataloglarının hizalı kalması için `openclaw/plugin-sdk/provider-model-shared` içindeki `resolveClaudeThinkingProfile(modelId)` değerini yeniden kullanmalıdır.
- Her profil düzeyinin saklanan kurallı bir `id` değeri vardır (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` veya `max`) ve bir görüntüleme `label` değeri içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Açık bir düşünme geçersiz kılmasını doğrulaması gereken araç plugins’i, `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ile `api.runtime.agent.normalizeThinkingLevel(...)` kullanmalıdır; kendi sağlayıcı/model düzey listelerini tutmamalıdır.
- Yapılandırılmış özel model meta verilerine erişimi olan araç plugins’i, `compat.supportedReasoningEfforts` tercihleri plugin tarafı doğrulamaya yansıtılsın diye `catalog` değerini `resolveThinkingPolicy` içine geçirebilir.
- Yayımlanmış eski hook’lar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk bağdaştırıcıları olarak kalır, ancak yeni özel düzey kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları/varsayılanları `thinkingLevels`, `thinkingOptions` ve `thinkingDefault` değerlerini sunar; böylece ACP/sohbet istemcileri, çalışma zamanı doğrulamasının kullandığı aynı profil kimliklerini ve etiketlerini işler.
