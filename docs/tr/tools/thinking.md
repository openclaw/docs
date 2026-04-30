---
read_when:
    - thinking, fast-mode veya verbose yönergesi ayrıştırmasını ya da varsayılanlarını ayarlama
summary: /think, /fast, /verbose, /trace için yönerge söz dizimi ve akıl yürütme görünürlüğü
title: Düşünme düzeyleri
x-i18n:
    generated_at: "2026-04-30T09:50:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9fabead8d2f58fc5bce3bf8b281ad9d52da2cd02ba2777bc1597359537b7705
    source_path: tools/thinking.md
    workflow: 16
---

## Ne İşe Yarar

- Herhangi bir gelen gövdede satır içi yönerge: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Seviyeler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (en yüksek bütçe)
  - xhigh → “ultrathink+” (GPT-5.2+ ve Codex modelleri, ayrıca Anthropic Claude Opus 4.7 eforu)
  - adaptive → sağlayıcı tarafından yönetilen uyarlamalı düşünme (Anthropic/Bedrock üzerinde Claude 4.6, Anthropic Claude Opus 4.7 ve Google Gemini dinamik düşünme için desteklenir)
  - max → sağlayıcı en yüksek akıl yürütme düzeyi (Anthropic Claude Opus 4.7; Ollama bunu kendi en yüksek yerel `think` eforuna eşler)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` değerine eşlenir.
  - `highest`, `high` değerine eşlenir.
- Sağlayıcı notları:
  - Düşünme menüleri ve seçicileri sağlayıcı profili tarafından belirlenir. Sağlayıcı plugin'leri, ikili `on` gibi etiketler dahil olmak üzere seçilen model için kesin seviye kümesini bildirir.
  - `adaptive`, `xhigh` ve `max` yalnızca bunları destekleyen sağlayıcı/model profilleri için gösterilir. Desteklenmeyen seviyeler için yazılan yönergeler, o modelin geçerli seçenekleriyle reddedilir.
  - Mevcut kayıtlı desteklenmeyen seviyeler, sağlayıcı profili sırasına göre yeniden eşlenir. `adaptive`, uyarlamalı olmayan modellerde `medium` değerine geri dönerken `xhigh` ve `max`, seçilen model için desteklenen en büyük `off` dışı seviyeye geri döner.
  - Anthropic Claude 4.6 modelleri, açık bir düşünme seviyesi ayarlanmadığında varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.7 varsayılan olarak uyarlamalı düşünmeyi kullanmaz. API eforu varsayılanı, siz açıkça bir düşünme seviyesi ayarlamadıkça sağlayıcıya ait kalır.
  - Anthropic Claude Opus 4.7, `/think xhigh` değerini uyarlamalı düşünmeye ve `output_config.effort: "xhigh"` değerine eşler; çünkü `/think` bir düşünme yönergesidir ve `xhigh`, Opus 4.7 efor ayarıdır.
  - Anthropic Claude Opus 4.7 ayrıca `/think max` değerini de sunar; bu, aynı sağlayıcıya ait en yüksek efor yoluna eşlenir.
  - Düşünme yetenekli Ollama modelleri `/think low|medium|high|max` seçeneklerini sunar; `max`, yerel `think: "high"` değerine eşlenir çünkü Ollama'nın yerel API'si `low`, `medium` ve `high` efor dizgelerini kabul eder.
  - OpenAI GPT modelleri, modele özgü Responses API efor desteği üzerinden `/think` eşlemesi yapar. `/think off`, yalnızca hedef model bunu desteklediğinde `reasoning.effort: "none"` gönderir; aksi halde OpenClaw, desteklenmeyen bir değer göndermek yerine devre dışı akıl yürütme yükünü atlar.
  - Özel OpenAI uyumlu katalog girdileri, `models.providers.<provider>.models[].compat.supportedReasoningEfforts` ayarını `"xhigh"` içerecek şekilde belirleyerek `/think xhigh` kullanımına katılabilir. Bu, giden OpenAI akıl yürütme eforu yüklerini eşleyen aynı uyumluluk meta verisini kullanır; böylece menüler, oturum doğrulaması, ajan CLI'si ve `llm-task` aktarım davranışıyla uyumlu olur.
  - Eski yapılandırılmış OpenRouter Hunter Alpha referansları, proxy akıl yürütme enjeksiyonunu atlar; çünkü kullanımdan kaldırılmış bu rota, akıl yürütme alanları üzerinden nihai yanıt metni döndürebilirdi.
  - Google Gemini, `/think adaptive` değerini Gemini'nin sağlayıcıya ait dinamik düşünmesine eşler. Gemini 3 istekleri sabit bir `thinkingLevel` atlar; Gemini 2.5 istekleri ise `thinkingBudget: -1` gönderir; sabit seviyeler yine de o model ailesi için en yakın Gemini `thinkingLevel` değerine veya bütçesine eşlenir.
  - Anthropic uyumlu akış yolunda MiniMax (`minimax/*`), model parametrelerinde veya istek parametrelerinde açıkça düşünme ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax'in yerel olmayan Anthropic akış biçiminden `reasoning_content` deltalarının sızmasını önler.
  - Z.AI (`zai/*`) yalnızca ikili düşünmeyi (`on`/`off`) destekler. `off` dışındaki tüm seviyeler `on` olarak ele alınır (`low` değerine eşlenir).
  - Moonshot (`moonshot/*`), `/think off` değerini `thinking: { type: "disabled" }` değerine ve `off` dışındaki tüm seviyeleri `thinking: { type: "enabled" }` değerine eşler. Düşünme etkin olduğunda Moonshot yalnızca `tool_choice` için `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalleştirir.

## Çözümleme Sırası

1. İletideki satır içi yönerge (yalnızca o iletiye uygulanır).
2. Oturum geçersiz kılma ayarı (yalnızca yönerge içeren bir ileti gönderilerek ayarlanır).
3. Ajan başına varsayılan (`agents.list[].thinkingDefault` yapılandırmada).
4. Genel varsayılan (`agents.defaults.thinkingDefault` yapılandırmada).
5. Geri dönüş: kullanılabilir olduğunda sağlayıcının bildirdiği varsayılan; aksi halde akıl yürütme yetenekli modeller `medium` değerine veya o model için desteklenen en yakın `off` dışı seviyeye çözülür, akıl yürütme yapmayan modeller ise `off` olarak kalır.

## Oturum Varsayılanı Ayarlama

- **Yalnızca** yönergeden oluşan bir ileti gönderin (boşluklara izin verilir), ör. `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalıcı olur (varsayılan olarak gönderici başına); `/think:off` veya oturum boşta kalma sıfırlamasıyla temizlenir.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Seviye geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değiştirilmez.
- Geçerli düşünme seviyesini görmek için argümansız `/think` (veya `/think:`) gönderin.

## Ajan Tarafından Uygulama

- **Gömülü Pi**: çözümlenen seviye, işlem içi Pi ajan çalışma zamanına geçirilir.

## Hızlı Mod (/fast)

- Seviyeler: `on|off`.
- Yalnızca yönerge içeren ileti, oturum hızlı mod geçersiz kılma ayarını değiştirir ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir.
- Geçerli etkin hızlı mod durumunu görmek için mod olmadan `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca yönergeli `/fast on|off`
  2. Oturum geçersiz kılma ayarı
  3. Ajan başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- `openai-codex/*` için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. OpenClaw, her iki kimlik doğrulama yolu genelinde tek bir ortak `/fast` geçişi tutar.
- OAuth ile kimliği doğrulanmış ve `api.anthropic.com` adresine gönderilen trafik dahil doğrudan genel `anthropic/*` istekleri için hızlı mod, Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto` ayarlar; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yolda `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model parametreleri, ikisi de ayarlandığında hızlı mod varsayılanını geçersiz kılar. OpenClaw yine de Anthropic dışı proxy temel URL'leri için Anthropic hizmet katmanı enjeksiyonunu atlar.
- `/status`, yalnızca hızlı mod etkin olduğunda `Fast` gösterir.

## Ayrıntılı Yönergeler (/verbose veya /v)

- Seviyeler: `on` (asgari) | `full` | `off` (varsayılan).
- Yalnızca yönerge içeren ileti, oturum ayrıntılı modunu değiştirir ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz seviyeler durumu değiştirmeden bir ipucu döndürür.
- `/verbose off`, açık bir oturum geçersiz kılma ayarı kaydeder; bunu Sessions UI üzerinden `inherit` seçerek temizleyin.
- Satır içi yönerge yalnızca o iletiyi etkiler; aksi halde oturum/genel varsayılanlar uygulanır.
- Geçerli ayrıntılı seviyeyi görmek için argümansız `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı mod açıkken, yapılandırılmış araç sonuçları yayan ajanlar (Pi, diğer JSON ajanları) her araç çağrısını, kullanılabiliyorsa `<emoji> <tool-name>: <arg>` (yol/komut) ile ön eklenmiş kendi yalnızca meta veri iletisi olarak geri gönderir. Bu araç özetleri, her araç başlar başlamaz (ayrı baloncuklar olarak) gönderilir; akış deltaları olarak değil.
- Araç hata özetleri normal modda görünür kalır, ancak ham hata ayrıntısı son ekleri ayrıntılı mod `on` veya `full` olmadıkça gizlenir.
- Ayrıntılı mod `full` olduğunda, araç çıktıları tamamlanmadan sonra da iletilir (ayrı baloncuk, güvenli uzunluğa kırpılmış). Bir çalışma devam ederken `/verbose on|full|off` değiştirirseniz, sonraki araç baloncukları yeni ayara uyar.

## Plugin İzleme Yönergeleri (/trace)

- Seviyeler: `on` | `off` (varsayılan).
- Yalnızca yönerge içeren ileti, oturum Plugin izleme çıktısını değiştirir ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi yönerge yalnızca o iletiyi etkiler; aksi halde oturum/genel varsayılanlar uygulanır.
- Geçerli izleme seviyesini görmek için argümansız `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose` seçeneğinden daha dardır: yalnızca Active Memory hata ayıklama özetleri gibi Plugin'e ait izleme/hata ayıklama satırlarını açığa çıkarır.
- İzleme satırları `/status` içinde ve normal asistan yanıtından sonra bir takip tanılama iletisi olarak görünebilir.

## Akıl Yürütme Görünürlüğü (/reasoning)

- Seviyeler: `on|off|stream`.
- Yalnızca yönerge içeren ileti, düşünme bloklarının yanıtlarda gösterilip gösterilmeyeceğini değiştirir.
- Etkinleştirildiğinde akıl yürütme, `Reasoning:` ile ön eklenmiş **ayrı bir ileti** olarak gönderilir.
- `stream` (yalnızca Telegram): yanıt oluşturulurken akıl yürütmeyi Telegram taslak baloncuğuna aktarır, ardından nihai yanıtı akıl yürütme olmadan gönderir.
- Takma ad: `/reason`.
- Geçerli akıl yürütme seviyesini görmek için argümansız `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi yönerge, ardından oturum geçersiz kılma ayarı, ardından ajan başına varsayılan (`agents.list[].reasoningDefault`), ardından geri dönüş (`off`).

Hatalı biçimlendirilmiş yerel model akıl yürütme etiketleri ihtiyatlı şekilde ele alınır. Kapalı `<think>...</think>` blokları normal yanıtlarda gizli kalır ve zaten görünür metinden sonra gelen kapatılmamış akıl yürütme de gizlenir. Bir yanıt tek bir kapatılmamış açılış etiketiyle tamamen sarılmışsa ve aksi halde boş metin olarak teslim edilecekse, OpenClaw hatalı biçimlendirilmiş açılış etiketini kaldırır ve kalan metni teslim eder.

## İlgili

- Yükseltilmiş mod belgeleri [Yükseltilmiş mod](/tr/tools/elevated) içinde bulunur.

## Heartbeat'ler

- Heartbeat yoklama gövdesi, yapılandırılmış heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Heartbeat iletisindeki satır içi yönergeler her zamanki gibi uygulanır (ancak heartbeat'lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimi varsayılan olarak yalnızca nihai yükü gönderir. Ayrı `Reasoning:` iletisini de (varsa) göndermek için `agents.defaults.heartbeat.includeReasoning: true` veya ajan başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web Sohbet UI

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde gelen oturum deposu/yapılandırmasından oturumun kayıtlı seviyesini yansıtır.
- Başka bir seviye seçmek, `sessions.patch` üzerinden oturum geçersiz kılma ayarını hemen yazar; bir sonraki gönderimi beklemez ve tek seferlik bir `thinkingOnce` geçersiz kılma ayarı değildir.
- İlk seçenek her zaman `Default (<resolved level>)` olur; burada çözümlenen varsayılan, etkin oturum modelinin sağlayıcı düşünme profilinden ve `/status` ile `session_status` tarafından kullanılan aynı geri dönüş mantığından gelir.
- Seçici, gateway oturum satırı/varsayılanları tarafından döndürülen `thinkingLevels` değerini kullanır; `thinkingOptions` ise eski etiket listesi olarak tutulur. Tarayıcı UI kendi sağlayıcı regex listesini tutmaz; modele özgü seviye kümelerinin sahibi plugin'lerdir.
- `/think:<level>` hâlâ çalışır ve aynı kayıtlı oturum seviyesini günceller; böylece sohbet yönergeleri ve seçici eşzamanlı kalır.

## Sağlayıcı Profilleri

- Sağlayıcı Plugin'leri, modelin desteklenen düzeylerini ve varsayılanını tanımlamak için `resolveThinkingProfile(ctx)` sunabilir.
- Claude modellerine proxy yapan sağlayıcı Plugin'leri, doğrudan Anthropic ve proxy kataloglarının hizalı kalması için `openclaw/plugin-sdk/provider-model-shared` içindeki `resolveClaudeThinkingProfile(modelId)` işlevini yeniden kullanmalıdır.
- Her profil düzeyinin saklanan kurallı bir `id` değeri vardır (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` veya `max`) ve bir görüntüleme `label` değeri içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Açık bir düşünme geçersiz kılmasını doğrulaması gereken araç Plugin'leri, `api.runtime.agent.resolveThinkingPolicy({ provider, model })` ile `api.runtime.agent.normalizeThinkingLevel(...)` kullanmalıdır; kendi sağlayıcı/model düzey listelerini tutmamalıdırlar.
- Yapılandırılmış özel model meta verilerine erişimi olan araç Plugin'leri, `compat.supportedReasoningEfforts` isteğe bağlı etkinleştirmelerinin Plugin tarafındaki doğrulamaya yansıması için `resolveThinkingPolicy` içine `catalog` geçirebilir.
- Yayımlanmış eski hook'lar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk bağdaştırıcıları olarak kalır, ancak yeni özel düzey kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları/varsayılanları `thinkingLevels`, `thinkingOptions` ve `thinkingDefault` değerlerini sunar; böylece ACP/sohbet istemcileri, çalışma zamanı doğrulamasının kullandığı aynı profil kimliklerini ve etiketlerini işler.
