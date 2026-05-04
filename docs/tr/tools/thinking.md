---
read_when:
    - thinking, fast-mode veya verbose yönerge ayrıştırmasını ya da varsayılanlarını ayarlama
summary: /think, /fast, /verbose, /trace için yönerge sözdizimi ve akıl yürütme görünürlüğü
title: Düşünme düzeyleri
x-i18n:
    generated_at: "2026-05-04T18:24:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcd1cd76ca5d0b08656e0629df656ad8aa037201d8de68093b3e46eb0708f811
    source_path: tools/thinking.md
    workflow: 16
---

## Ne Yapar

- Herhangi bir gelen gövdede satır içi yönerge: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Düzeyler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “düşün”
  - low → “yoğun düşün”
  - medium → “daha yoğun düşün”
  - high → “ultrathink” (en yüksek bütçe)
  - xhigh → “ultrathink+” (GPT-5.2+ ve Codex modelleri, ayrıca Anthropic Claude Opus 4.7 çabası)
  - adaptive → sağlayıcı tarafından yönetilen uyarlanabilir düşünme (Anthropic/Bedrock üzerinde Claude 4.6, Anthropic Claude Opus 4.7 ve Google Gemini dinamik düşünme için desteklenir)
  - max → sağlayıcı en yüksek akıl yürütme (Anthropic Claude Opus 4.7; Ollama bunu kendi en yüksek yerel `think` çabasına eşler)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` değerine eşlenir.
  - `highest`, `high` değerine eşlenir.
- Sağlayıcı notları:
  - Düşünme menüleri ve seçiciler, sağlayıcı profiline göre yönlendirilir. Sağlayıcı Plugin'leri, seçili model için ikili `on` gibi etiketler dahil tam düzey kümesini bildirir.
  - `adaptive`, `xhigh` ve `max` yalnızca bunları destekleyen sağlayıcı/model profilleri için gösterilir. Desteklenmeyen düzeyler için yazılan yönergeler, o modelin geçerli seçenekleriyle reddedilir.
  - Mevcut kayıtlı desteklenmeyen düzeyler, sağlayıcı profili sıralamasına göre yeniden eşlenir. `adaptive`, uyarlanabilir olmayan modellerde `medium` değerine geri dönerken `xhigh` ve `max`, seçili model için desteklenen en büyük `off` dışı düzeye geri döner.
  - Anthropic Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmadığında varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.7 varsayılan olarak uyarlanabilir düşünme kullanmaz. Açıkça bir düşünme düzeyi ayarlamadığınız sürece API çabası varsayılanı sağlayıcıya aittir.
  - Anthropic Claude Opus 4.7, `/think xhigh` değerini uyarlanabilir düşünmeye ve `output_config.effort: "xhigh"` değerine eşler; çünkü `/think` bir düşünme yönergesidir ve `xhigh`, Opus 4.7 çaba ayarıdır.
  - Anthropic Claude Opus 4.7 ayrıca `/think max` değerini sunar; bu değer aynı sağlayıcıya ait en yüksek çaba yoluna eşlenir.
  - DeepSeek V4 modelleri `/think xhigh|max` değerlerini sunar; her ikisi de DeepSeek `reasoning_effort: "max"` değerine eşlenirken daha düşük `off` dışı düzeyler `high` değerine eşlenir.
  - Ollama düşünme yetenekli modelleri `/think low|medium|high|max` değerlerini sunar; Ollama'nın yerel API'si `low`, `medium` ve `high` çaba dizelerini kabul ettiği için `max`, yerel `think: "high"` değerine eşlenir.
  - OpenAI GPT modelleri, `/think` değerini modele özgü Responses API çaba desteği üzerinden eşler. `/think off`, `reasoning.effort: "none"` değerini yalnızca hedef model desteklediğinde gönderir; aksi halde OpenClaw, desteklenmeyen bir değer göndermek yerine devre dışı akıl yürütme yükünü atlar.
  - Özel OpenAI uyumlu katalog girişleri, `models.providers.<provider>.models[].compat.supportedReasoningEfforts` değerini `"xhigh"` içerecek şekilde ayarlayarak `/think xhigh` kullanımına katılabilir. Bu, giden OpenAI akıl yürütme çabası yüklerini eşleyen aynı uyumluluk meta verisini kullanır; böylece menüler, oturum doğrulaması, aracı CLI ve `llm-task` taşıma davranışıyla uyumlu olur.
  - Eski yapılandırılmış OpenRouter Hunter Alpha başvuruları, o kullanımdan kaldırılmış rota son yanıt metnini akıl yürütme alanları üzerinden döndürebileceği için proxy akıl yürütme enjeksiyonunu atlar.
  - Google Gemini, `/think adaptive` değerini Gemini'nin sağlayıcıya ait dinamik düşünmesine eşler. Gemini 3 istekleri sabit bir `thinkingLevel` değerini atlar; Gemini 2.5 istekleri ise `thinkingBudget: -1` gönderir. Sabit düzeyler yine de o model ailesi için en yakın Gemini `thinkingLevel` değerine veya bütçesine eşlenir.
  - Anthropic uyumlu akış yolundaki MiniMax (`minimax/*`), model parametrelerinde veya istek parametrelerinde açıkça düşünme ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax'in yerel olmayan Anthropic akış biçiminden `reasoning_content` deltalarının sızmasını önler.
  - Z.AI (`zai/*`) yalnızca ikili düşünmeyi (`on`/`off`) destekler. `off` dışındaki her düzey `on` olarak ele alınır (`low` değerine eşlenir).
  - Moonshot (`moonshot/*`), `/think off` değerini `thinking: { type: "disabled" }` değerine, `off` dışındaki her düzeyi ise `thinking: { type: "enabled" }` değerine eşler. Düşünme etkin olduğunda Moonshot yalnızca `tool_choice` için `auto|none` değerlerini kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalleştirir.

## Çözüm Sırası

1. İletideki satır içi yönerge (yalnızca o iletiye uygulanır).
2. Oturum geçersiz kılması (yalnızca yönerge içeren bir ileti gönderilerek ayarlanır).
3. Aracı başına varsayılan (yapılandırmada `agents.list[].thinkingDefault`).
4. Genel varsayılan (yapılandırmada `agents.defaults.thinkingDefault`).
5. Geri dönüş: varsa sağlayıcı tarafından bildirilen varsayılan; aksi halde akıl yürütme yetenekli modeller `medium` değerine veya o model için desteklenen en yakın `off` dışı düzeye çözümlenir, akıl yürütme yeteneği olmayan modeller ise `off` kalır.

## Oturum Varsayılanı Ayarlama

- **Yalnızca** yönergeden oluşan bir ileti gönderin (boşluklara izin verilir), ör. `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalıcı olur (varsayılan olarak gönderen başına); `/think:off` veya oturum boşta kalma sıfırlaması ile temizlenir.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Düzey geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değiştirilmez.
- Geçerli düşünme düzeyini görmek için argümansız `/think` (veya `/think:`) gönderin.

## Aracıya Göre Uygulama

- **Gömülü Pi**: çözümlenen düzey, süreç içi Pi aracı çalışma zamanına iletilir.
- **Claude CLI arka ucu**: `claude-cli` kullanılırken `off` dışı düzeyler Claude Code'a `--effort` olarak iletilir; bkz. [CLI arka uçları](/tr/gateway/cli-backends).

## Hızlı Mod (/fast)

- Düzeyler: `on|off`.
- Yalnızca yönerge içeren ileti, oturum hızlı mod geçersiz kılmasını açıp kapatır ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir.
- Geçerli etkili hızlı mod durumunu görmek için modsuz `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca yönerge `/fast on|off`
  2. Oturum geçersiz kılması
  3. Aracı başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- `openai-codex/*` için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. OpenClaw her iki kimlik doğrulama yolu arasında tek bir ortak `/fast` anahtarı tutar.
- OAuth ile kimliği doğrulanmış ve `api.anthropic.com` adresine gönderilen trafik dahil doğrudan herkese açık `anthropic/*` istekleri için hızlı mod Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto` ayarlar; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model parametreleri, ikisi de ayarlandığında hızlı mod varsayılanını geçersiz kılar. OpenClaw, Anthropic olmayan proxy temel URL'leri için Anthropic hizmet katmanı enjeksiyonunu yine de atlar.
- `/status`, hızlı mod yalnızca etkin olduğunda `Fast` gösterir.

## Ayrıntılı Yönergeler (/verbose veya /v)

- Düzeyler: `on` (minimal) | `full` | `off` (varsayılan).
- Yalnızca yönerge içeren ileti, oturum ayrıntılı modunu açıp kapatır ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz düzeyler durumu değiştirmeden bir ipucu döndürür.
- `/verbose off`, açık bir oturum geçersiz kılması kaydeder; bunu Sessions UI üzerinden `inherit` seçerek temizleyin.
- Satır içi yönerge yalnızca o iletiyi etkiler; aksi halde oturum/genel varsayılanları uygulanır.
- Geçerli ayrıntılı düzeyi görmek için argümansız `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı mod açık olduğunda, yapılandırılmış araç sonuçları yayan aracılar (Pi, diğer JSON aracıları), her araç çağrısını kendi meta veri içeren iletisi olarak geri gönderir; mümkün olduğunda `<emoji> <tool-name>: <arg>` ön eki kullanılır. Bu araç özetleri, her araç başlar başlamaz gönderilir (ayrı baloncuklar), akış deltaları olarak değil.
- Araç başarısızlığı özetleri normal modda görünür kalır, ancak ham hata ayrıntısı sonekleri ayrıntılı mod `on` veya `full` değilse gizlenir.
- Ayrıntılı mod `full` olduğunda, araç çıktıları tamamlanmadan sonra da iletilir (ayrı baloncuk, güvenli bir uzunluğa kırpılmış). Bir çalışma sürerken `/verbose on|full|off` değerini değiştirirseniz sonraki araç baloncukları yeni ayarı uygular.
- `agents.defaults.toolProgressDetail`, `/verbose` araç özetlerinin ve ilerleme taslağı araç satırlarının biçimini denetler. `🛠️ Exec: checking JS syntax` gibi kısa insan etiketleri için `"explain"` (varsayılan) kullanın; hata ayıklama için ham komut/ayrıntının da eklenmesini istiyorsanız `"raw"` kullanın. Aracı başına `agents.list[].toolProgressDetail` varsayılanı geçersiz kılar.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin İzleme Yönergeleri (/trace)

- Düzeyler: `on` | `off` (varsayılan).
- Yalnızca yönerge içeren ileti, oturum Plugin izleme çıktısını açıp kapatır ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi yönerge yalnızca o iletiyi etkiler; aksi halde oturum/genel varsayılanları uygulanır.
- Geçerli izleme düzeyini görmek için argümansız `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose` değerinden daha dardır: yalnızca Active Memory hata ayıklama özetleri gibi Plugin'e ait izleme/hata ayıklama satırlarını gösterir.
- İzleme satırları `/status` içinde ve normal asistan yanıtından sonra takip tanılama iletisi olarak görünebilir.

## Akıl Yürütme Görünürlüğü (/reasoning)

- Düzeyler: `on|off|stream`.
- Yalnızca yönerge içeren ileti, düşünme bloklarının yanıtlarda gösterilip gösterilmeyeceğini açıp kapatır.
- Etkin olduğunda akıl yürütme, `Reasoning:` ön ekiyle **ayrı bir ileti** olarak gönderilir.
- `stream` (yalnızca Telegram): yanıt oluşturulurken akıl yürütmeyi Telegram taslak baloncuğuna akıtır, ardından son yanıtı akıl yürütme olmadan gönderir.
- Takma ad: `/reason`.
- Geçerli akıl yürütme düzeyini görmek için argümansız `/reasoning` (veya `/reasoning:`) gönderin.
- Çözüm sırası: satır içi yönerge, ardından oturum geçersiz kılması, ardından aracı başına varsayılan (`agents.list[].reasoningDefault`), ardından geri dönüş (`off`).

Hatalı biçimlendirilmiş yerel model akıl yürütme etiketleri temkinli şekilde ele alınır. Kapalı `<think>...</think>` blokları normal yanıtlarda gizli kalır ve zaten görünür metinden sonra kapatılmamış akıl yürütme de gizlenir. Bir yanıt tek bir kapatılmamış açılış etiketiyle tamamen sarılmışsa ve aksi halde boş metin olarak teslim edilecekse OpenClaw hatalı biçimlendirilmiş açılış etiketini kaldırır ve kalan metni teslim eder.

## İlgili

- Yükseltilmiş mod belgeleri [Yükseltilmiş mod](/tr/tools/elevated) içinde bulunur.

## Heartbeats

- Heartbeat yoklama gövdesi yapılandırılmış Heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Heartbeat iletisindeki satır içi yönergeler her zamanki gibi uygulanır (ancak Heartbeat'lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimi varsayılan olarak yalnızca son yükü gönderir. Ayrı `Reasoning:` iletisini de (varsa) göndermek için `agents.defaults.heartbeat.includeReasoning: true` veya aracı başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web Sohbet UI

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde gelen oturum deposu/yapılandırmasından oturumun kayıtlı düzeyini yansıtır.
- Başka bir düzey seçmek, `sessions.patch` üzerinden oturum geçersiz kılmasını hemen yazar; bir sonraki göndermeyi beklemez ve tek kullanımlık bir `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman `Default (<resolved level>)` olur; burada çözümlenen varsayılan, etkin oturum modelinin sağlayıcı düşünme profilinden ve `/status` ile `session_status` tarafından kullanılan aynı geri dönüş mantığından gelir.
- Seçici, Gateway oturum satırı/varsayılanları tarafından döndürülen `thinkingLevels` değerini kullanır; `thinkingOptions` ise eski etiket listesi olarak korunur. Tarayıcı UI kendi sağlayıcı regex listesini tutmaz; modele özgü düzey kümeleri Plugin'lere aittir.
- `/think:<level>` yine çalışır ve aynı kayıtlı oturum düzeyini günceller; böylece sohbet yönergeleri ve seçici senkron kalır.

## Sağlayıcı Profilleri

- Sağlayıcı Plugin'leri, modelin desteklenen düzeylerini ve varsayılanını tanımlamak için `resolveThinkingProfile(ctx)` gösterebilir.
- Claude modellerini proxy eden sağlayıcı Plugin'leri, doğrudan Anthropic ve proxy kataloglarının hizalı kalması için `openclaw/plugin-sdk/provider-model-shared` içindeki `resolveClaudeThinkingProfile(modelId)` öğesini yeniden kullanmalıdır.
- Her profil düzeyinin saklanan kurallı bir `id` değeri (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` veya `max`) vardır ve bir görüntüleme `label` değeri içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Açık bir düşünme geçersiz kılmasını doğrulaması gereken araç Plugin'leri, `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ile `api.runtime.agent.normalizeThinkingLevel(...)` kullanmalıdır; kendi sağlayıcı/model düzeyi listelerini tutmamalıdırlar.
- Yapılandırılmış özel model meta verilerine erişimi olan araç Plugin'leri, `compat.supportedReasoningEfforts` katılımlarının Plugin tarafı doğrulamaya yansıması için `resolveThinkingPolicy` içine `catalog` iletebilir.
- Yayımlanmış eski hook'lar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk adaptörleri olarak kalır, ancak yeni özel düzey kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları/varsayılanları `thinkingLevels`, `thinkingOptions` ve `thinkingDefault` değerlerini gösterir; böylece ACP/sohbet istemcileri, çalışma zamanı doğrulamasının kullandığı aynı profil kimliklerini ve etiketlerini işler.
