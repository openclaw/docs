---
read_when:
    - Düşünme, hızlı mod veya ayrıntılı direktif ayrıştırmasını ya da varsayılanlarını ayarlama
summary: /think, /fast, /verbose, /trace için yönerge söz dizimi ve akıl yürütme görünürlüğü
title: Düşünme seviyeleri
x-i18n:
    generated_at: "2026-07-12T12:54:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## Ne işe yarar

- Herhangi bir gelen iletinin gövdesinde satır içi yönerge: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Düzeyler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`; kabaca Anthropic'in klasik "think" < "think hard" < "think harder" < "ultrathink" sihirli sözcük sıralamasını yansıtır:
  - minimal ~ "düşün"
  - low ~ "iyice düşün"
  - medium ~ "daha da iyi düşün"
  - high ~ "çok derin düşün" (en yüksek bütçe)
  - xhigh ~ "çok derin düşün+" (GPT-5.2+ ve Codex modellerinin yanı sıra Anthropic Claude Opus 4.7+ eforu)
  - adaptive → sağlayıcı tarafından yönetilen uyarlanabilir düşünme (Anthropic/Bedrock üzerindeki Claude 4.6, Anthropic Claude Opus 4.7+ ve Google Gemini dinamik düşünme için desteklenir)
  - max → sağlayıcının en yüksek akıl yürütme düzeyi (Anthropic Claude Opus 4.7+; Ollama bunu kendi en yüksek yerel `think` eforuyla eşler)
  - ultra → seçilen model/çalışma zamanı desteklediğinde sağlayıcının en yüksek akıl yürütme düzeyi ve proaktif alt ajan orkestrasyonu
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` ile eşlenir.
  - `highest`, `high` ile eşlenir.
- Sağlayıcı notları:
  - Düşünme menüleri ve seçicileri sağlayıcı profiline göre belirlenir. Sağlayıcı Plugin'leri, ikili `on` gibi etiketler dâhil olmak üzere seçilen modelin tam düzey kümesini bildirir.
  - `adaptive`, `xhigh`, `max` ve `ultra` yalnızca bunları destekleyen sağlayıcı/model/çalışma zamanı profilleri için sunulur. Desteklenmeyen düzeylere ilişkin yazılı yönergeler, ilgili modelin geçerli seçenekleri belirtilerek reddedilir.
  - Daha önce kaydedilmiş ancak artık desteklenmeyen düzeyler, sağlayıcı profili sıralamasına göre yeniden eşlenir. `adaptive`, uyarlanabilir olmayan modellerde `medium` düzeyine geri dönerken `xhigh` ve `max`, seçilen modelin desteklediği `off` dışındaki en yüksek düzeye geri döner.
  - Açıkça bir düşünme düzeyi ayarlanmadığında Anthropic Claude 4.6 modelleri varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.8 ve Opus 4.7, açıkça bir düşünme düzeyi ayarlamadığınız sürece düşünmeyi kapalı tutar. Uyarlanabilir düşünme etkinleştirildikten sonra Opus 4.8'in sağlayıcıya ait varsayılan efor düzeyi `high` olur.
  - Anthropic Claude Opus 4.7+, `/think xhigh` yönergesini uyarlanabilir düşünme ve `output_config.effort: "xhigh"` olarak eşler; çünkü `/think` bir düşünme yönergesidir ve `xhigh`, Opus efor ayarıdır.
  - Anthropic Claude Opus 4.7+ ayrıca `/think max` seçeneğini sunar; bu seçenek aynı sağlayıcıya ait en yüksek efor yoluna eşlenir.
  - Doğrudan DeepSeek V4 modelleri `/think xhigh|max` seçeneklerini sunar; `off` dışındaki daha düşük düzeyler `high` ile eşlenirken bu iki seçenek de DeepSeek `reasoning_effort: "max"` ile eşlenir.
  - OpenRouter üzerinden yönlendirilen DeepSeek V4 modelleri `/think xhigh` seçeneğini sunar ve DeepSeek'e özgü üst düzey `reasoning_effort` yerine OpenRouter tarafından desteklenen `reasoning.effort` değerlerini gönderir. `off` dışındaki daha düşük düzeyler `high` ile eşlenir ve kaydedilmiş `max` geçersiz kılmaları `xhigh` düzeyine geri döner.
  - Düşünme özelliğine sahip Ollama modelleri `/think low|medium|high|max` seçeneklerini sunar; Ollama'nın yerel API'si `low`, `medium` ve `high` efor dizelerini kabul ettiğinden `max`, yerel `think: "high"` ile eşlenir.
  - OpenAI GPT modelleri `/think` yönergesini modele özgü Responses API efor desteği üzerinden eşler. `/think off`, yalnızca hedef model destekliyorsa `reasoning.effort: "none"` gönderir; aksi takdirde OpenClaw, desteklenmeyen bir değer göndermek yerine devre dışı bırakılmış akıl yürütme yükünü atlar.
  - GPT-5.6 Sol ve Terra, Codex çalışma zamanı üzerinden yerel `/think ultra` seçeneğini sunar. GPT-5.6 Luna'nın Codex kataloğu Ultra'yı sunmadığından düzeyleri `max` ile sınırlıdır.
  - Gömülü OpenClaw çalışma zamanı; GPT-5.6 Sol, Terra ve Luna için mantıksal `/think ultra` seçeneğini sunar. Sağlayıcının en yüksek efor düzeyini gönderir ve çalıştırma kapsamlı proaktif alt ajan orkestrasyonu yönlendirmesi ekler.
  - Özel OpenAI uyumlu katalog girdileri, `models.providers.<provider>.models[].compat.supportedReasoningEfforts` ayarına `"xhigh"` ekleyerek `/think xhigh` desteğini etkinleştirebilir. Bu, giden OpenAI akıl yürütme eforu yüklerini eşleyen aynı uyumluluk meta verilerini kullanır; böylece menüler, oturum doğrulaması, ajan CLI'si ve `llm-task`, aktarım davranışıyla tutarlı olur.
  - Yapılandırmada kalmış eski OpenRouter Hunter Alpha başvuruları, kullanımdan kaldırılan bu rota nihai yanıt metnini akıl yürütme alanları üzerinden döndürebildiğinden proxy akıl yürütme eklemesini atlar.
  - Google Gemini, `/think adaptive` yönergesini Gemini'nin sağlayıcıya ait dinamik düşünme özelliğiyle eşler. Gemini 3 isteklerinde sabit bir `thinkingLevel` atlanırken Gemini 2.5 istekleri `thinkingBudget: -1` gönderir; sabit düzeyler ise ilgili model ailesi için en yakın Gemini `thinkingLevel` veya bütçe değeriyle eşlenmeye devam eder.
  - Anthropic uyumlu akış yolundaki MiniMax M2.x (`minimax/MiniMax-M2*`), model veya istek parametrelerinde açıkça düşünme ayarlanmadığı sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, M2.x'in yerel olmayan Anthropic akış biçiminden `reasoning_content` deltalarının sızmasını önler. MiniMax-M3 (ve M3.x) bundan muaftır: M3 düzgün Anthropic düşünme blokları üretir ve düşünme devre dışıyken boş içerik döndürür; dolayısıyla OpenClaw, M3'ü sağlayıcının atlanmış/uyarlanabilir düşünme yolunda tutar.
  - Z.AI (`zai/*`), çoğu GLM modeli için ikilidir (`on`/`off`). GLM-5.2 istisnadır: `/think off|low|high|max` seçeneklerini sunar, `low` ve `high` düzeylerini Z.AI `reasoning_effort: "high"` ile, `max` düzeyini ise `reasoning_effort: "max"` ile eşler.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) her zaman düşünür. Profili yalnızca `on` seçeneğini sunar ve OpenClaw, Moonshot'ın gerektirdiği şekilde giden `thinking` alanını atlar. Diğer `moonshot/*` modelleri `/think off` yönergesini `thinking: { type: "disabled" }`, `off` dışındaki tüm düzeyleri ise `thinking: { type: "enabled" }` ile eşler. Düşünme etkinleştirildiğinde Moonshot yalnızca `tool_choice` için `auto|none` değerlerini kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalleştirir.

## Çözümleme sırası

1. İletideki satır içi yönerge (yalnızca o ileti için geçerlidir).
2. Oturum geçersiz kılması (yalnızca yönerge içeren bir ileti gönderilerek ayarlanır).
3. Ajan başına varsayılan (`agents.list[].thinkingDefault` yapılandırmada).
4. Genel varsayılan (`agents.defaults.thinkingDefault` yapılandırmada).
5. Geri dönüş: varsa sağlayıcının bildirdiği varsayılan; aksi takdirde akıl yürütme özelliğine sahip modeller `medium` veya ilgili modelin desteklediği `off` dışındaki en yakın düzeye çözümlenir, akıl yürütme özelliği olmayan modeller ise `off` olarak kalır.

## Oturum varsayılanını ayarlama

- **Yalnızca** yönergeyi içeren bir ileti gönderin (boşluklara izin verilir); örneğin `/think:medium` veya `/t high`.
- Bu ayar geçerli oturum boyunca korunur (varsayılan olarak gönderici başına). Oturum geçersiz kılmasını temizleyip yapılandırılmış/sağlayıcı varsayılanını devralmak için `/think default` kullanın; takma adlar arasında `inherit`, `clear`, `reset` ve `unpin` bulunur.
- `/think off`, açık bir kapalı geçersiz kılması kaydeder. Oturum geçersiz kılmasını değiştirene veya temizleyene kadar düşünmeyi devre dışı bırakır.
- Bir onay yanıtı gönderilir (`Düşünme düzeyi high olarak ayarlandı.` / `Düşünme devre dışı bırakıldı.`). Düzey geçersizse (örneğin `/thinking big`) komut bir ipucuyla reddedilir ve oturum durumu değiştirilmez.
- Geçerli düşünme düzeyini görmek için bağımsız değişken olmadan `/think` (veya `/think:`) gönderin.

## Ajan tarafından uygulanması

- **Gömülü OpenClaw**: çözümlenen düzey, süreç içi OpenClaw ajan çalışma zamanına aktarılır.
- **Claude CLI arka ucu**: `claude-cli` kullanılırken somut `off` dışı düzeyler Claude Code'a `--effort` olarak aktarılır; `adaptive`, yapılandırılmış efor bayraklarını kaldırır ve etkin eforu Claude Code'un ortamına, ayarlarına ve model varsayılanlarına bırakır. Bkz. [CLI arka uçları](/tr/gateway/cli-backends).

## Hızlı mod (/fast)

- Düzeyler: `auto|on|off|default`.
- Yalnızca yönerge içeren ileti, oturumun hızlı mod geçersiz kılmasını değiştirir ve `Hızlı mod otomatik olarak ayarlandı.`, `Hızlı mod etkinleştirildi.` veya `Hızlı mod devre dışı bırakıldı.` yanıtını verir. Oturum geçersiz kılmasını temizleyip yapılandırılmış varsayılanı devralmak için `/fast default` kullanın; takma adlar arasında `inherit`, `clear`, `reset` ve `unpin` bulunur.
- Geçerli etkin hızlı mod durumunu görmek için bir mod belirtmeden `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca yönerge içeren `/fast auto|on|off` geçersiz kılması (`/fast default` bu katmanı temizler)
  2. Oturum geçersiz kılması
  3. Ajan başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `auto`, oturum/yapılandırma modunu otomatik olarak korur ancak her yeni model çağrısını bağımsız olarak çözümler. Otomatik kesim süresinden önce başlayan çağrılarda hızlı mod etkinleştirilir; daha sonraki yeniden deneme, geri dönüş, araç sonucu veya devam çağrıları hızlı mod devre dışı olarak başlar. Kesim süresi varsayılan olarak 60 saniyedir; değiştirmek için etkin modelde `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` ayarını yapın.
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- Codex destekli `openai/*` / `openai-codex/*` modelleri için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. Yerel Codex uygulama sunucusu turları katmanı yalnızca `turn/start` veya iş parçacığı başlatma/sürdürme sırasında alır; dolayısıyla `auto`, çalışmakta olan bir uygulama sunucusu turunun katmanını değiştiremez. Bu ayar OpenClaw'ın başlattığı bir sonraki model turuna uygulanır.
- OAuth kimlik doğrulamalı olarak `api.anthropic.com` adresine gönderilen trafik dâhil doğrudan herkese açık `anthropic/*` isteklerinde hızlı mod, Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto`; `/fast off` ise `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açıkça belirtilen Anthropic `serviceTier` / `service_tier` model parametreleri, her ikisi de ayarlandığında hızlı mod varsayılanını geçersiz kılar. OpenClaw, Anthropic dışı proxy temel URL'leri için Anthropic hizmet katmanı eklemesini yine de atlar.
- `/status`, hızlı mod etkinleştirildiğinde `Fast`, yapılandırılmış mod otomatik olduğunda ise `Fast:auto` gösterir.

## Ayrıntılı çıktı yönergeleri (/verbose veya /v)

- Düzeyler: `on` (asgari) | `full` | `off` (varsayılan).
- Yalnızca yönerge içeren ileti, oturumun ayrıntılı çıktısını değiştirir ve `Ayrıntılı günlük kaydı etkinleştirildi.` / `Ayrıntılı günlük kaydı devre dışı bırakıldı.` yanıtını verir; geçersiz düzeyler durumu değiştirmeden bir ipucu döndürür.
- `/verbose off`, açık bir oturum geçersiz kılması kaydeder; bunu Sessions kullanıcı arayüzünde `inherit` seçeneğini belirleyerek temizleyin.
- Yetkilendirilmiş harici kanal göndericileri, oturumun ayrıntılı çıktı geçersiz kılmasını kalıcı hâle getirebilir. Dâhilî Gateway/web sohbeti istemcilerinin bunu kalıcı hâle getirebilmesi için `operator.admin` gerekir.
- Satır içi yönerge yalnızca o iletiyi etkiler; aksi durumda oturum/genel varsayılanlar uygulanır.
- Geçerli ayrıntılı çıktı düzeyini görmek için bağımsız değişken olmadan `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı çıktı açıkken yapılandırılmış araç sonuçları üreten ajanlar, her araç çağrısını mümkün olduğunda `<emoji> <tool-name>: <arg>` önekiyle yalnızca meta veri içeren ayrı bir ileti olarak geri gönderir. Bu araç özetleri, her araç başlar başlamaz (ayrı baloncuklar hâlinde) gönderilir; akış deltaları olarak gönderilmez.
- Araç hatası özetleri normal modda görünür kalır ancak ham hata ayrıntısı son ekleri, ayrıntılı çıktı `full` olmadığı sürece gizlenir.
- Ayrıntılı çıktı `full` olduğunda araç çıktıları da tamamlandıktan sonra iletilir (ayrı bir baloncukta, güvenli bir uzunluğa kısaltılmış olarak). Bir çalıştırma devam ederken `/verbose on|full|off` ile ayarı değiştirirseniz sonraki araç baloncukları yeni ayara uyar.
- `agents.defaults.toolProgressDetail`, `/verbose` araç özetlerinin ve ilerleme taslağındaki araç satırlarının biçimini denetler. `🛠️ Exec: JS söz dizimi denetleniyor` gibi kısa ve insanların anlayabileceği etiketler için `"explain"` (varsayılan) kullanın; hata ayıklamak amacıyla ham komutun/ayrıntının da eklenmesini istiyorsanız `"raw"` kullanın. Ajan başına `agents.list[].toolProgressDetail`, varsayılanı geçersiz kılar.
  - `explain`: `🛠️ Exec: /tmp/app.js için JS söz dizimini denetle`
  - `raw`: `🛠️ Exec: /tmp/app.js için JS söz dizimini denetle, node --check /tmp/app.js`

## Plugin izleme yönergeleri (/trace)

- Düzeyler: `on` | `off` (varsayılan).
- Yalnızca yönerge içeren ileti, oturumun Plugin izleme çıktısını değiştirir ve `Plugin izlemesi etkinleştirildi.` / `Plugin izlemesi devre dışı bırakıldı.` yanıtını verir.
- Satır içi yönerge yalnızca o iletiyi etkiler; aksi durumda oturum/genel varsayılanlar uygulanır.
- Geçerli izleme düzeyini görmek için bağımsız değişken olmadan `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose` seçeneğinden daha dar kapsamlıdır: yalnızca Active Memory hata ayıklama özetleri gibi Plugin'e ait izleme/hata ayıklama satırlarını gösterir.
- İzleme satırları `/status` içinde ve normal asistan yanıtından sonra gönderilen bir tanılama iletisinde görünebilir.

## Akıl yürütmenin görünürlüğü (/reasoning)

- Düzeyler: `on|off|stream`.
- Yalnızca direktif içeren mesaj, düşünme bloklarının yanıtlarda gösterilip gösterilmeyeceğini değiştirir.
- Etkinleştirildiğinde akıl yürütme, başına `Thinking` eklenmiş **ayrı bir mesaj** olarak gönderilir.
- `stream`: etkin kanal akıl yürütme önizlemelerini destekliyorsa yanıt oluşturulurken akıl yürütmeyi akış halinde gönderir, ardından nihai yanıtı akıl yürütme olmadan gönderir.
- Diğer ad: `/reason`.
- Geçerli akıl yürütme düzeyini görmek için bağımsız değişken olmadan `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi direktif, ardından oturum geçersiz kılması, ardından ajan başına varsayılan (`agents.list[].reasoningDefault`), ardından genel varsayılan (`agents.defaults.reasoningDefault`), ardından geri dönüş değeri (`off`).

Hatalı yerel model akıl yürütme etiketleri ihtiyatlı biçimde işlenir. Kapatılmış `<think>...</think>` blokları normal yanıtlarda gizli kalır ve görünür metinden sonra gelen kapatılmamış akıl yürütme de gizlenir. Bir yanıtın tamamı tek bir kapatılmamış açılış etiketiyle sarılmışsa ve aksi takdirde boş metin olarak teslim edilecekse OpenClaw, hatalı açılış etiketini kaldırır ve kalan metni teslim eder.

## İlgili

- Yükseltilmiş mod belgeleri [Yükseltilmiş mod](/tr/tools/elevated) bölümündedir.

## Heartbeat'ler

- Heartbeat yoklamasının gövdesi, yapılandırılmış Heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Bir Heartbeat mesajındaki satır içi direktifler her zamanki gibi uygulanır (ancak oturum varsayılanlarını Heartbeat'lerden değiştirmekten kaçının).
- Heartbeat teslimatı varsayılan olarak yalnızca nihai yükü içerir. Ayrı `Thinking` mesajını da göndermek için (kullanılabiliyorsa) `agents.defaults.heartbeat.includeReasoning: true` veya ajan başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbeti kullanıcı arayüzü

- Sayfa yüklendiğinde web sohbetindeki düşünme seçicisi, gelen oturum deposunda/yapılandırmasında saklanan oturum düzeyini yansıtır.
- Başka bir düzey seçildiğinde oturum geçersiz kılması `sessions.patch` aracılığıyla hemen yazılır; bir sonraki gönderimi beklemez ve tek kullanımlık bir `thinkingOnce` geçersiz kılması değildir.
- Model, akıl yürütme veya hız seçicisi değişiklikleri uygulanmaya devam ederken gönderim yapılırsa bekleyen tüm seçici yamalarının tamamlanması beklenir; bir değişiklik başarısız olursa mesaj incelenmek üzere gönderilmeden kalır.
- İlk seçenek her zaman geçersiz kılmayı temizleme seçeneğidir. Devralınan düşünme devre dışı olduğunda `Inherited: Off` dâhil olmak üzere `Inherited: <resolved level>` gösterir.
- Açık seçici tercihleri, sağlayıcı etiketleri mevcut olduğunda bunları koruyarak doğrudan düzey etiketlerini kullanır (örneğin sağlayıcı tarafından `max` seçeneği için etiketlenmiş `Maximum`).
- Seçici, Gateway oturum satırı/varsayılanları tarafından döndürülen `thinkingLevels` değerini kullanır; `thinkingOptions` ise eski bir etiket listesi olarak korunur. Tarayıcı kullanıcı arayüzü kendi sağlayıcı düzenli ifade listesini tutmaz; modele özgü düzey kümelerinin sahibi Plugin'lerdir.
- `/think:<level>` çalışmaya devam eder ve saklanan aynı oturum düzeyini günceller; böylece sohbet direktifleriyle seçici eşzamanlı kalır.

## Sağlayıcı profilleri

- Sağlayıcı Plugin'leri, modelin desteklediği düzeyleri ve varsayılanı tanımlamak için `resolveThinkingProfile(ctx)` sunabilir.
- Claude modellerine vekâlet eden sağlayıcı Plugin'leri, doğrudan Anthropic ve vekil kataloglarının uyumlu kalması için `openclaw/plugin-sdk/provider-model-shared` içindeki `resolveClaudeThinkingProfile(modelId)` işlevini yeniden kullanmalıdır.
- Her profil düzeyi, saklanan kurallı bir `id` değerine (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` veya `ultra`) sahiptir ve bir görüntüleme `label` değeri içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Profil kancaları, mevcut olduğunda `reasoning`, `compat.thinkingFormat` ve `compat.supportedReasoningEfforts` dâhil birleştirilmiş katalog bilgilerini alır. İkili veya özel profilleri yalnızca yapılandırılmış istek sözleşmesi eşleşen yükü desteklediğinde sunmak için bu bilgileri kullanın.
- Açık bir düşünme geçersiz kılmasını doğrulaması gereken araç Plugin'leri, `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` ile `api.runtime.agent.normalizeThinkingLevel(...)` kullanmalıdır; kendi sağlayıcı/model düzeyi listelerini tutmamalıdır. Her zaman gömülü olan bir çalıştırma gibi yürütme yolunun sahibi araç olduğunda `agentRuntime` iletin.
- Yapılandırılmış özel model meta verilerine erişimi olan araç Plugin'leri, `compat.supportedReasoningEfforts` katılımlarının Plugin tarafı doğrulamaya yansıtılması için `catalog` değerini `resolveThinkingPolicy` işlevine iletebilir.
- Yayımlanmış eski kancalar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk bağdaştırıcıları olarak kalır, ancak yeni özel düzey kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları/varsayılanları `thinkingLevels`, `thinkingOptions` ve `thinkingDefault` değerlerini sunar; böylece ACP/sohbet istemcileri çalışma zamanı doğrulamasının kullandığı profil kimliklerini ve etiketlerini aynı şekilde işler.
