---
read_when:
    - Düşünme, fast-mode veya verbose direktif ayrıştırmasını ya da varsayılanlarını ayarlama
summary: '`/think`, `/fast`, `/verbose`, `/trace` ve muhakeme görünürlüğü için direktif sözdizimi'
title: Düşünme düzeyleri
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-25T14:00:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0537f10d3dd3251ac41590bebd2d83ba8b2562725c322040b20f32547c8af88d
    source_path: tools/thinking.md
    workflow: 15
---

## Ne yapar

- Herhangi bir gelen gövdede satır içi direktif: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Düzeyler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (en yüksek bütçe)
  - xhigh → “ultrathink+” (GPT-5.2+ ve Codex modelleri ile Anthropic Claude Opus 4.7 effort)
  - adaptive → sağlayıcı tarafından yönetilen uyarlanabilir düşünme (Anthropic/Bedrock üzerinde Claude 4.6, Anthropic Claude Opus 4.7 ve Google Gemini dynamic thinking için desteklenir)
  - max → sağlayıcı en yüksek muhakeme düzeyi (şu anda Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` ile eşlenir.
  - `highest`, `high` ile eşlenir.
- Sağlayıcı notları:
  - Düşünme menüleri ve seçicileri sağlayıcı profiline göre belirlenir. Sağlayıcı Plugin’leri, `on` gibi etiketler dahil, seçili model için tam düzey kümesini bildirir.
  - `adaptive`, `xhigh` ve `max`, yalnızca bunları destekleyen sağlayıcı/model profilleri için gösterilir. Desteklenmeyen düzeyler için yazılan direktifler, o modelin geçerli seçenekleriyle birlikte reddedilir.
  - Daha önce saklanmış ama artık desteklenmeyen düzeyler, sağlayıcı profil sıralamasına göre yeniden eşlenir. `adaptive`, uyarlanabilir olmayan modellerde `medium` düzeyine düşer; `xhigh` ve `max` ise seçili modelin desteklediği `off` dışındaki en büyük düzeye düşer.
  - Anthropic Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmadığında varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.7, varsayılan olarak uyarlanabilir düşünme kullanmaz. API effort varsayılanı, siz açıkça bir düşünme düzeyi ayarlamadıkça sağlayıcı sahipliğinde kalır.
  - Anthropic Claude Opus 4.7, `/think xhigh` komutunu uyarlanabilir düşünme artı `output_config.effort: "xhigh"` olarak eşler; çünkü `/think` bir düşünme direktifidir ve `xhigh`, Opus 4.7 effort ayarıdır.
  - Anthropic Claude Opus 4.7 ayrıca `/think max` sunar; bu, aynı sağlayıcı sahipliğindeki en yüksek effort yoluna eşlenir.
  - OpenAI GPT modelleri, `/think` komutunu modele özgü Responses API effort desteği üzerinden eşler. `/think off`, yalnızca hedef model bunu destekliyorsa `reasoning.effort: "none"` gönderir; aksi takdirde OpenClaw desteklenmeyen bir değer göndermek yerine devre dışı bırakılmış reasoning yükünü atlar.
  - Google Gemini, `/think adaptive` komutunu Gemini’nin sağlayıcı sahipliğindeki dynamic thinking özelliğine eşler. Gemini 3 istekleri sabit bir `thinkingLevel` içermezken, Gemini 2.5 istekleri `thinkingBudget: -1` gönderir; sabit düzeyler ise yine de o model ailesi için en yakın Gemini `thinkingLevel` veya bütçesine eşlenir.
  - Anthropic uyumlu akış yolundaki MiniMax (`minimax/*`), model parametrelerinde veya istek parametrelerinde açıkça düşünme ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax’in yerel olmayan Anthropic akış biçiminden sızan `reasoning_content` delta’larını önler.
  - Z.AI (`zai/*`) yalnızca ikili düşünmeyi destekler (`on`/`off`). `off` dışındaki herhangi bir düzey `on` olarak ele alınır (`low` ile eşlenir).
  - Moonshot (`moonshot/*`), `/think off` komutunu `thinking: { type: "disabled" }` ile ve `off` dışındaki herhangi bir düzeyi `thinking: { type: "enabled" }` ile eşler. Düşünme etkin olduğunda Moonshot yalnızca `tool_choice` için `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalize eder.

## Çözümleme sırası

1. Mesaj üzerindeki satır içi direktif (yalnızca o mesaja uygulanır).
2. Oturum geçersiz kılması (yalnızca direktif içeren bir mesaj gönderilerek ayarlanır).
3. Ajan başına varsayılan (`config` içinde `agents.list[].thinkingDefault`).
4. Genel varsayılan (`config` içinde `agents.defaults.thinkingDefault`).
5. Fallback: varsa sağlayıcının bildirdiği varsayılan; aksi halde muhakeme yetenekli modeller `medium` veya o model için desteklenen `off` dışındaki en yakın düzeye çözülür, muhakeme desteklemeyen modeller ise `off` olarak kalır.

## Oturum varsayılanı ayarlama

- Yalnızca direktiften oluşan bir mesaj gönderin (boşluk kabul edilir), örneğin `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalıcı olur (varsayılan olarak gönderici başına); `/think:off` veya oturum boşta kalma sıfırlaması ile temizlenir.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Düzey geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değiştirilmeden bırakılır.
- Geçerli düşünme düzeyini görmek için bağımsız değişken olmadan `/think` (veya `/think:`) gönderin.

## Ajan tarafından uygulama

- **Gömülü Pi**: çözümlenen düzey, süreç içi Pi ajan çalışma zamanına geçirilir.

## Fast mode (/fast)

- Düzeyler: `on|off`.
- Yalnızca direktif içeren mesaj, oturum fast-mode geçersiz kılmasını açar/kapatır ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir.
- Geçerli etkili fast-mode durumunu görmek için mod belirtmeden `/fast` (veya `/fast status`) gönderin.
- OpenClaw, fast mode’u şu sırayla çözümler:
  1. Satır içi/yalnızca direktif içeren `/fast on|off`
  2. Oturum geçersiz kılması
  3. Ajan başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- `openai/*` için fast mode, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- `openai-codex/*` için fast mode, Codex Responses üzerinde aynı `service_tier=priority` işaretini gönderir. OpenClaw, her iki kimlik doğrulama yolu için tek bir ortak `/fast` geçişi tutar.
- Doğrudan herkese açık `anthropic/*` isteklerinde, `api.anthropic.com` adresine gönderilen OAuth ile kimliği doğrulanmış trafik dahil, fast mode Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto`; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model parametreleri, ikisi de ayarlandığında fast-mode varsayılanını geçersiz kılar. OpenClaw yine de Anthropic olmayan proxy temel URL’leri için Anthropic hizmet katmanı eklemeyi atlar.
- `/status`, yalnızca fast mode etkin olduğunda `Fast` gösterir.

## Verbose direktifleri (/verbose veya /v)

- Düzeyler: `on` (minimal) | `full` | `off` (varsayılan).
- Yalnızca direktif içeren mesaj, oturum verbose ayarını açar/kapatır ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz düzeylerde durum değiştirilmeden bir ipucu döner.
- `/verbose off`, açık bir oturum geçersiz kılması saklar; bunu Sessions UI içinden `inherit` seçerek temizleyin.
- Satır içi direktif yalnızca o mesaja uygulanır; aksi durumda oturum/genel varsayılanlar kullanılır.
- Geçerli verbose düzeyini görmek için bağımsız değişken olmadan `/verbose` (veya `/verbose:`) gönderin.
- Verbose açık olduğunda, yapılandırılmış araç sonuçları yayan ajanlar (Pi, diğer JSON ajanları) her araç çağrısını, mümkünse `<emoji> <tool-name>: <arg>` önekiyle (yol/komut) kendi başına yalnızca meta veri içeren bir mesaj olarak geri gönderir. Bu araç özetleri, akış delta’ları olarak değil, her araç başlar başlamaz ayrı baloncuklar halinde gönderilir.
- Araç hata özetleri normal modda da görünür kalır, ancak ham hata ayrıntısı son ekleri verbose `on` veya `full` olmadıkça gizlenir.
- Verbose `full` olduğunda, araç çıktıları tamamlandıktan sonra da iletilir (ayrı baloncuk, güvenli bir uzunluğa kısaltılmış şekilde). Bir çalışma sürerken `/verbose on|full|off` değiştirirseniz, sonraki araç baloncukları yeni ayara uyar.

## Plugin trace direktifleri (/trace)

- Düzeyler: `on` | `off` (varsayılan).
- Yalnızca direktif içeren mesaj, oturum Plugin trace çıktısını açar/kapatır ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi direktif yalnızca o mesaja uygulanır; aksi durumda oturum/genel varsayılanlar kullanılır.
- Geçerli trace düzeyini görmek için bağımsız değişken olmadan `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose`’dan daha dardır: yalnızca Plugin sahipliğindeki trace/debug satırlarını, örneğin Active Memory debug özetlerini gösterir.
- Trace satırları `/status` içinde ve normal asistan yanıtından sonra gelen bir tanılama mesajı olarak görünebilir.

## Reasoning görünürlüğü (/reasoning)

- Düzeyler: `on|off|stream`.
- Yalnızca direktif içeren mesaj, yanıtlarda düşünme bloklarının gösterilip gösterilmeyeceğini açar/kapatır.
- Etkinleştirildiğinde reasoning, `Reasoning:` önekiyle **ayrı bir mesaj** olarak gönderilir.
- `stream` (yalnızca Telegram): reasoning’i yanıt üretilirken Telegram taslak baloncuğuna akıtır, ardından reasoning olmadan nihai yanıtı gönderir.
- Takma ad: `/reason`.
- Geçerli reasoning düzeyini görmek için bağımsız değişken olmadan `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi direktif, sonra oturum geçersiz kılması, sonra ajan başına varsayılan (`agents.list[].reasoningDefault`), sonra fallback (`off`).

## İlgili

- Elevated mode belgeleri [Elevated mode](/tr/tools/elevated) bölümünde yer alır.

## Heartbeat’ler

- Heartbeat probe gövdesi, yapılandırılmış heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Bir heartbeat mesajındaki satır içi direktifler normal şekilde uygulanır (ancak heartbeat’lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimatı varsayılan olarak yalnızca nihai yükü gönderir. Ayrı `Reasoning:` mesajını da göndermek için (varsa) `agents.defaults.heartbeat.includeReasoning: true` veya ajan başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbet UI’si

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde gelen oturum deposu/yapılandırmasındaki oturumun kayıtlı düzeyini yansıtır.
- Başka bir düzey seçmek, oturum geçersiz kılmasını hemen `sessions.patch` ile yazar; bir sonraki gönderimi beklemez ve tek kullanımlık bir `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman `Default (<resolved level>)` olur; burada çözümlenen varsayılan, etkin oturum modelinin sağlayıcı düşünme profilinden ve `/status` ile `session_status` tarafından kullanılan aynı fallback mantığından gelir.
- Seçici, gateway oturum satırı/varsayılanları tarafından döndürülen `thinkingLevels` değerini kullanır; `thinkingOptions` ise eski etiket listesi olarak tutulur. Tarayıcı UI’si kendi sağlayıcı regex listesini tutmaz; modele özgü düzey kümeleri Plugin’lerin sahipliğindedir.
- `/think:<level>` hâlâ çalışır ve aynı kayıtlı oturum düzeyini günceller; böylece sohbet direktifleri ile seçici senkron kalır.

## Sağlayıcı profilleri

- Sağlayıcı Plugin’leri, modelin desteklenen düzeylerini ve varsayılanını tanımlamak için `resolveThinkingProfile(ctx)` sunabilir.
- Her profil düzeyi, saklanan kanonik bir `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` veya `max`) taşır ve bir görüntüleme `label`’ı içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Yayımlanmış eski hook’lar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk bağdaştırıcıları olarak kalır, ancak yeni özel düzey kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları/varsayılanları `thinkingLevels`, `thinkingOptions` ve `thinkingDefault` alanlarını sunar; böylece ACP/sohbet istemcileri, çalışma zamanı doğrulamasının kullandığı aynı profil kimliklerini ve etiketleri işler.
