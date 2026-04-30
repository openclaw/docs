---
read_when:
    - Düşünme, fast-mode veya ayrıntılı yönerge ayrıştırmasını ya da varsayılanlarını ayarlama
summary: /think, /fast, /verbose, /trace için yönerge söz dizimi ve akıl yürütme görünürlüğü
title: Düşünme seviyeleri
x-i18n:
    generated_at: "2026-04-30T16:31:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9adf065e46cb64e4c2149b95ecd69ed887a17e2eff5a5569894defa3e7217b7
    source_path: tools/thinking.md
    workflow: 16
---

## Ne İşe Yarar

- Herhangi bir gelen gövdesinde satır içi yönerge: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Seviyeler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (maksimum bütçe)
  - xhigh → “ultrathink+” (GPT-5.2+ ve Codex modelleri, ayrıca Anthropic Claude Opus 4.7 çabası)
  - adaptive → sağlayıcı tarafından yönetilen uyarlanabilir düşünme (Anthropic/Bedrock üzerinde Claude 4.6, Anthropic Claude Opus 4.7 ve Google Gemini dinamik düşünme için desteklenir)
  - max → sağlayıcı maksimum akıl yürütmesi (Anthropic Claude Opus 4.7; Ollama bunu en yüksek yerel `think` çabasına eşler)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` ile eşleşir.
  - `highest`, `high` ile eşleşir.
- Sağlayıcı notları:
  - Düşünme menüleri ve seçicileri sağlayıcı profili odaklıdır. Sağlayıcı Plugin'leri, ikili `on` gibi etiketler dahil olmak üzere seçilen model için kesin seviye kümesini bildirir.
  - `adaptive`, `xhigh` ve `max` yalnızca bunları destekleyen sağlayıcı/model profilleri için gösterilir. Desteklenmeyen seviyeler için yazılan yönergeler, ilgili modelin geçerli seçenekleriyle reddedilir.
  - Mevcut depolanmış desteklenmeyen seviyeler, sağlayıcı profili sıralamasına göre yeniden eşlenir. `adaptive`, uyarlanabilir olmayan modellerde `medium` seviyesine geri dönerken `xhigh` ve `max`, seçilen model için desteklenen en büyük `off` dışı seviyeye geri döner.
  - Anthropic Claude 4.6 modelleri, açık bir düşünme seviyesi ayarlanmadığında varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.7 varsayılan olarak uyarlanabilir düşünmeye geçmez. API çaba varsayılanı, açıkça bir düşünme seviyesi ayarlamadığınız sürece sağlayıcıya ait kalır.
  - Anthropic Claude Opus 4.7, `/think xhigh` değerini uyarlanabilir düşünmeye ve `output_config.effort: "xhigh"` değerine eşler; çünkü `/think` bir düşünme yönergesidir ve `xhigh` Opus 4.7 çaba ayarıdır.
  - Anthropic Claude Opus 4.7 ayrıca `/think max` sunar; bu aynı sağlayıcıya ait maksimum çaba yoluna eşlenir.
  - DeepSeek V4 modelleri `/think xhigh|max` sunar; ikisi de DeepSeek `reasoning_effort: "max"` değerine eşlenirken daha düşük `off` dışı seviyeler `high` değerine eşlenir.
  - Ollama düşünme destekli modeller `/think low|medium|high|max` sunar; Ollama'nın yerel API'si `low`, `medium` ve `high` çaba dizelerini kabul ettiği için `max`, yerel `think: "high"` değerine eşlenir.
  - OpenAI GPT modelleri `/think` değerini modele özgü Responses API çaba desteği üzerinden eşler. `/think off`, yalnızca hedef model bunu desteklediğinde `reasoning.effort: "none"` gönderir; aksi durumda OpenClaw desteklenmeyen bir değer göndermek yerine devre dışı akıl yürütme yükünü atlar.
  - Özel OpenAI uyumlu katalog girdileri, `models.providers.<provider>.models[].compat.supportedReasoningEfforts` değerini `"xhigh"` içerecek şekilde ayarlayarak `/think xhigh` desteğine katılabilir. Bu, giden OpenAI akıl yürütme çaba yüklerini eşleyen aynı uyumluluk meta verisini kullanır; böylece menüler, oturum doğrulaması, aracı CLI ve `llm-task` aktarım davranışıyla uyumlu olur.
  - Eski yapılandırılmış OpenRouter Hunter Alpha referansları proxy akıl yürütme enjeksiyonunu atlar; çünkü kullanımdan kaldırılan bu rota, akıl yürütme alanları üzerinden nihai yanıt metni döndürebilir.
  - Google Gemini, `/think adaptive` değerini Gemini'nin sağlayıcıya ait dinamik düşünmesine eşler. Gemini 3 istekleri sabit bir `thinkingLevel` değerini atlar; Gemini 2.5 istekleri ise `thinkingBudget: -1` gönderir; sabit seviyeler yine de ilgili model ailesi için en yakın Gemini `thinkingLevel` değerine veya bütçesine eşlenir.
  - Anthropic uyumlu akış yolunda MiniMax (`minimax/*`), model parametrelerinde veya istek parametrelerinde düşünmeyi açıkça ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax'in yerel olmayan Anthropic akış biçiminden `reasoning_content` deltalarının sızmasını önler.
  - Z.AI (`zai/*`) yalnızca ikili düşünmeyi (`on`/`off`) destekler. `off` dışındaki her seviye `on` olarak ele alınır (`low` değerine eşlenir).
  - Moonshot (`moonshot/*`), `/think off` değerini `thinking: { type: "disabled" }` değerine ve `off` dışındaki her seviyeyi `thinking: { type: "enabled" }` değerine eşler. Düşünme etkin olduğunda Moonshot yalnızca `tool_choice` için `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalleştirir.

## Çözümleme Sırası

1. İletideki satır içi yönerge (yalnızca o iletiye uygulanır).
2. Oturum geçersiz kılması (yalnızca yönerge içeren bir ileti gönderilerek ayarlanır).
3. Aracı başına varsayılan (yapılandırmada `agents.list[].thinkingDefault`).
4. Küresel varsayılan (yapılandırmada `agents.defaults.thinkingDefault`).
5. Geri dönüş: varsa sağlayıcı tarafından bildirilen varsayılan; aksi durumda akıl yürütme destekli modeller `medium` değerine veya ilgili model için desteklenen en yakın `off` dışı seviyeye çözümlenir, akıl yürütme desteklemeyen modeller ise `off` kalır.

## Oturum Varsayılanı Ayarlama

- **Yalnızca** yönergeden oluşan bir ileti gönderin (boşluklara izin verilir), ör. `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalıcı olur (varsayılan olarak gönderici başına); `/think:off` veya oturum boşta kalma sıfırlamasıyla temizlenir.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Seviye geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değiştirilmeden bırakılır.
- Geçerli düşünme seviyesini görmek için argümansız `/think` (veya `/think:`) gönderin.

## Aracıya Göre Uygulama

- **Gömülü Pi**: çözümlenen seviye, süreç içindeki Pi aracı çalışma zamanına geçirilir.

## Hızlı Mod (/fast)

- Seviyeler: `on|off`.
- Yalnızca yönerge içeren ileti, oturum hızlı mod geçersiz kılmasını değiştirir ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir.
- Geçerli etkin hızlı mod durumunu görmek için mod olmadan `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca yönerge `/fast on|off`
  2. Oturum geçersiz kılması
  3. Aracı başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- `openai-codex/*` için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. OpenClaw her iki kimlik doğrulama yolu arasında tek bir paylaşılan `/fast` anahtarı tutar.
- `api.anthropic.com` adresine gönderilen OAuth kimliği doğrulanmış trafik dahil olmak üzere doğrudan herkese açık `anthropic/*` istekleri için hızlı mod, Anthropic hizmet katmanlarına eşlenir: `/fast on` `service_tier=auto` ayarlar, `/fast off` `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yolda `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model parametreleri, ikisi de ayarlandığında hızlı mod varsayılanını geçersiz kılar. OpenClaw, Anthropic olmayan proxy temel URL'leri için Anthropic hizmet katmanı enjeksiyonunu yine de atlar.
- `/status`, `Fast` değerini yalnızca hızlı mod etkin olduğunda gösterir.

## Ayrıntılı Yönergeler (/verbose veya /v)

- Seviyeler: `on` (minimal) | `full` | `off` (varsayılan).
- Yalnızca yönerge içeren ileti oturum ayrıntılı modunu değiştirir ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz seviyeler durumu değiştirmeden bir ipucu döndürür.
- `/verbose off` açık bir oturum geçersiz kılması depolar; bunu Oturumlar kullanıcı arayüzünde `inherit` seçerek temizleyin.
- Satır içi yönerge yalnızca o iletiyi etkiler; aksi durumda oturum/küresel varsayılanlar uygulanır.
- Geçerli ayrıntılı seviyeyi görmek için argümansız `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı mod açıkken, yapılandırılmış araç sonuçları yayan aracılar (Pi, diğer JSON aracıları), her araç çağrısını, varsa (yol/komut) `<emoji> <tool-name>: <arg>` önekiyle kendi yalnızca meta veri iletisi olarak geri gönderir. Bu araç özetleri, her araç başlar başlamaz gönderilir (ayrı baloncuklar), akış deltaları olarak değil.
- Araç hata özetleri normal modda görünür kalır, ancak ham hata ayrıntısı sonekleri ayrıntılı mod `on` veya `full` olmadığı sürece gizlenir.
- Ayrıntılı mod `full` olduğunda, araç çıktıları tamamlandıktan sonra da iletilir (ayrı baloncuk, güvenli bir uzunluğa kısaltılmış). Bir çalışma sürerken `/verbose on|full|off` değerini değiştirirseniz sonraki araç baloncukları yeni ayara uyar.

## Plugin İzleme Yönergeleri (/trace)

- Seviyeler: `on` | `off` (varsayılan).
- Yalnızca yönerge içeren ileti oturum Plugin izleme çıktısını değiştirir ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi yönerge yalnızca o iletiyi etkiler; aksi durumda oturum/küresel varsayılanlar uygulanır.
- Geçerli izleme seviyesini görmek için argümansız `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose` değerinden daha dardır: yalnızca Active Memory hata ayıklama özetleri gibi Plugin'e ait izleme/hata ayıklama satırlarını gösterir.
- İzleme satırları `/status` içinde ve normal asistan yanıtından sonra takip eden bir tanılama iletisi olarak görünebilir.

## Akıl Yürütme Görünürlüğü (/reasoning)

- Seviyeler: `on|off|stream`.
- Yalnızca yönerge içeren ileti, düşünme bloklarının yanıtlarda gösterilip gösterilmeyeceğini değiştirir.
- Etkinleştirildiğinde akıl yürütme, `Reasoning:` önekiyle **ayrı bir ileti** olarak gönderilir.
- `stream` (yalnızca Telegram): yanıt oluşturulurken akıl yürütmeyi Telegram taslak baloncuğuna aktarır, ardından nihai yanıtı akıl yürütme olmadan gönderir.
- Takma ad: `/reason`.
- Geçerli akıl yürütme seviyesini görmek için argümansız `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi yönerge, sonra oturum geçersiz kılması, sonra aracı başına varsayılan (`agents.list[].reasoningDefault`), sonra geri dönüş (`off`).

Hatalı biçimlendirilmiş yerel model akıl yürütme etiketleri ihtiyatlı şekilde ele alınır. Kapalı <think>...</think> blokları normal yanıtlarda gizli kalır ve zaten görünür metinden sonra gelen kapatılmamış akıl yürütme de gizlenir. Bir yanıt tamamen tek bir kapatılmamış açılış etiketiyle sarılmışsa ve aksi halde boş metin olarak teslim edilecekse OpenClaw hatalı biçimlendirilmiş açılış etiketini kaldırır ve kalan metni teslim eder.

## İlgili

- Yükseltilmiş mod belgeleri [Yükseltilmiş mod](/tr/tools/elevated) içinde bulunur.

## Heartbeats

- Heartbeat sorgu gövdesi, yapılandırılmış Heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Bir Heartbeat iletisindeki satır içi yönergeler her zamanki gibi uygulanır (ancak Heartbeat'lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimi varsayılan olarak yalnızca nihai yükü gönderir. Ayrı `Reasoning:` iletisini de göndermek için (varsa) `agents.defaults.heartbeat.includeReasoning: true` veya aracı başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web Sohbet Kullanıcı Arayüzü

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde gelen oturum deposu/yapılandırmasından oturumun depolanmış seviyesini yansıtır.
- Başka bir seviye seçmek, oturum geçersiz kılmasını `sessions.patch` üzerinden hemen yazar; sonraki gönderimi beklemez ve tek seferlik bir `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman `Default (<resolved level>)` olur; burada çözümlenen varsayılan, etkin oturum modelinin sağlayıcı düşünme profilinden ve `/status` ile `session_status` tarafından kullanılan aynı geri dönüş mantığından gelir.
- Seçici, eski etiket listesi olarak tutulan `thinkingOptions` ile birlikte Gateway oturum satırı/varsayılanları tarafından döndürülen `thinkingLevels` değerini kullanır. Tarayıcı kullanıcı arayüzü kendi sağlayıcı regex listesini tutmaz; modele özgü seviye kümeleri Plugin'lere aittir.
- `/think:<level>` hâlâ çalışır ve aynı depolanmış oturum seviyesini günceller; böylece sohbet yönergeleri ve seçici eşzamanlı kalır.

## Sağlayıcı Profilleri

- Sağlayıcı Plugin'leri, modelin desteklenen düzeylerini ve varsayılanını tanımlamak için `resolveThinkingProfile(ctx)` sunabilir.
- Claude modellerini proxy'leyen sağlayıcı Plugin'leri, doğrudan Anthropic ve proxy kataloglarının hizalı kalması için `openclaw/plugin-sdk/provider-model-shared` içindeki `resolveClaudeThinkingProfile(modelId)` öğesini yeniden kullanmalıdır.
- Her profil düzeyinin saklanan kurallı bir `id` değeri (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` veya `max`) vardır ve bir görüntüleme `label` değeri içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Açık bir düşünme geçersiz kılmasını doğrulaması gereken araç Plugin'leri, `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ile `api.runtime.agent.normalizeThinkingLevel(...)` kullanmalıdır; kendi sağlayıcı/model düzey listelerini tutmamalıdır.
- Yapılandırılmış özel model meta verilerine erişimi olan araç Plugin'leri, `compat.supportedReasoningEfforts` katılımlarının Plugin tarafı doğrulamaya yansıması için `resolveThinkingPolicy` içine `catalog` geçirebilir.
- Yayımlanmış eski hook'lar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk bağdaştırıcıları olarak kalır, ancak yeni özel düzey kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları/varsayılanları `thinkingLevels`, `thinkingOptions` ve `thinkingDefault` sunar; böylece ACP/sohbet istemcileri, çalışma zamanı doğrulamasının kullandığı aynı profil kimliklerini ve etiketlerini işler.
