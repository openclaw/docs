---
read_when:
    - Düşünme, fast-mode veya verbose direktif ayrıştırmasını ya da varsayılanlarını ayarlama
summary: '`/think`, `/fast`, `/verbose`, `/trace` ve akıl yürütme görünürlüğü için direktif sözdizimi'
title: Düşünme düzeyleri
x-i18n:
    generated_at: "2026-04-24T09:37:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc251ffa601646bf8672200b416661ae91fb21ff84525eedf6d6c538ff0e36cf
    source_path: tools/thinking.md
    workflow: 15
---

## Ne yapar

- Herhangi bir gelen gövdede satır içi direktif: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Düzeyler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “düşün”
  - low → “sert düşün”
  - medium → “daha sert düşün”
  - high → “ultrathink” (maksimum bütçe)
  - xhigh → “ultrathink+” (GPT-5.2+ ve Codex modelleri, ayrıca Anthropic Claude Opus 4.7 effort)
  - adaptive → sağlayıcı tarafından yönetilen uyarlanabilir düşünme (Anthropic/Bedrock üzerindeki Claude 4.6 ve Anthropic Claude Opus 4.7 için desteklenir)
  - max → sağlayıcı maksimum akıl yürütmesi (şu anda Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` değerine eşlenir.
  - `highest`, `high` değerine eşlenir.
- Sağlayıcı notları:
  - Düşünme menüleri ve seçicileri sağlayıcı profiline göre yönlendirilir. Sağlayıcı Plugin’leri, ikili `on` gibi etiketler dahil seçili model için tam düzey kümesini bildirir.
  - `adaptive`, `xhigh` ve `max` yalnızca bunları destekleyen sağlayıcı/model profilleri için ilan edilir. Desteklenmeyen düzeyler için yazılan direktifler, o modelin geçerli seçenekleriyle birlikte reddedilir.
  - Önceden depolanmış desteklenmeyen düzeyler, sağlayıcı profil sıralamasına göre yeniden eşlenir. `adaptive`, uyarlanabilir olmayan modellerde `medium` değerine geri düşer; `xhigh` ve `max` ise seçili model için desteklenen en büyük `off` olmayan düzeye geri düşer.
  - Anthropic Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmadığında varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.7 varsayılan olarak uyarlanabilir düşünmeyi kullanmaz. API effort varsayılanı, siz açıkça bir düşünme düzeyi ayarlamadıkça sağlayıcıya aittir.
  - Anthropic Claude Opus 4.7, `/think xhigh` değerini uyarlanabilir düşünme artı `output_config.effort: "xhigh"` olarak eşler; çünkü `/think` bir düşünme direktifidir ve `xhigh` Opus 4.7 effort ayarıdır.
  - Anthropic Claude Opus 4.7 ayrıca `/think max` da sunar; aynı sağlayıcıya ait maksimum effort yoluna eşlenir.
  - OpenAI GPT modelleri, `/think` değerini modele özgü Responses API effort desteği üzerinden eşler. `/think off`, yalnızca hedef model bunu destekliyorsa `reasoning.effort: "none"` gönderir; aksi takdirde OpenClaw desteklenmeyen bir değer göndermek yerine devre dışı reasoning yükünü atlar.
  - Anthropic uyumlu akış yolundaki MiniMax (`minimax/*`), model parametrelerinde veya istek parametrelerinde açıkça düşünme ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax’ın yerel olmayan Anthropic akış biçiminden sızan `reasoning_content` deltalarını önler.
  - Z.AI (`zai/*`) yalnızca ikili düşünmeyi destekler (`on`/`off`). `off` dışındaki tüm düzeyler `on` olarak değerlendirilir (`low` değerine eşlenir).
  - Moonshot (`moonshot/*`), `/think off` değerini `thinking: { type: "disabled" }` ve `off` dışındaki her düzeyi `thinking: { type: "enabled" }` olarak eşler. Düşünme etkin olduğunda Moonshot yalnızca `tool_choice` `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalleştirir.

## Çözümleme sırası

1. Mesaj üzerindeki satır içi direktif (yalnızca o mesaja uygulanır).
2. Oturum geçersiz kılması (yalnızca direktif içeren mesaj gönderilerek ayarlanır).
3. Ajan başına varsayılan (`agents.list[].thinkingDefault` yapılandırmada).
4. Genel varsayılan (`agents.defaults.thinkingDefault` yapılandırmada).
5. Geri dönüş: varsa sağlayıcının bildirdiği varsayılan; aksi takdirde akıl yürütme yetenekli modeller `medium` veya o model için desteklenen en yakın `off` olmayan düzeye çözülür, akıl yürütmeyen modeller ise `off` olarak kalır.

## Oturum varsayılanı ayarlama

- **Yalnızca** direktiften oluşan bir mesaj gönderin (boşluk serbesttir), ör. `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalıcı olur (varsayılan olarak gönderen başına); `/think:off` veya oturum boşta sıfırlaması ile temizlenir.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Düzey geçersizse (örn. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değiştirilmez.
- Geçerli düşünme düzeyini görmek için bağımsız değişken olmadan `/think` (veya `/think:`) gönderin.

## Ajana göre uygulama

- **Gömülü Pi**: çözümlenen düzey, süreç içi Pi ajan çalışma zamanına geçirilir.

## Hızlı mod (/fast)

- Düzeyler: `on|off`.
- Yalnızca direktif içeren mesaj, oturum hızlı mod geçersiz kılmasını değiştirir ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir.
- Geçerli etkin hızlı mod durumunu görmek için mod olmadan `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca direktif içeren `/fast on|off`
  2. Oturum geçersiz kılması
  3. Ajan başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işleme ile eşlenir.
- `openai-codex/*` için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. OpenClaw her iki kimlik doğrulama yolu arasında tek bir ortak `/fast` düğmesi tutar.
- `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dahil doğrudan genel `anthropic/*` istekleri için hızlı mod, Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto` ayarlar; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model parametreleri, her ikisi de ayarlandığında hızlı mod varsayılanını geçersiz kılar. OpenClaw yine de Anthropic olmayan proxy temel URL’leri için Anthropic hizmet katmanı eklemeyi atlar.
- `/status`, yalnızca hızlı mod etkinken `Fast` gösterir.

## Ayrıntılı direktifler (/verbose veya /v)

- Düzeyler: `on` (minimal) | `full` | `off` (varsayılan).
- Yalnızca direktif içeren mesaj, oturum ayrıntı düzeyini değiştirir ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz düzeyler durumu değiştirmeden bir ipucu döndürür.
- `/verbose off`, açık bir oturum geçersiz kılması depolar; bunu Sessions UI üzerinden `inherit` seçerek temizleyin.
- Satır içi direktif yalnızca o mesaja etki eder; aksi hâlde oturum/genel varsayılanlar uygulanır.
- Geçerli ayrıntı düzeyini görmek için bağımsız değişken olmadan `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı mod açıkken, yapılandırılmış araç sonuçları üreten ajanlar (Pi, diğer JSON ajanları), her araç çağrısını mevcutsa `<emoji> <tool-name>: <arg>` ön ekiyle (yol/komut) kendi meta veri mesajı olarak geri gönderir. Bu araç özetleri, her araç başlar başlamaz (ayrı baloncuklar olarak) gönderilir; akış deltaları olarak değil.
- Araç hata özeti normal modda görünür kalır, ancak ham hata ayrıntısı son ekleri `verbose` `on` veya `full` olmadıkça gizlenir.
- `verbose` `full` olduğunda araç çıktıları da tamamlandıktan sonra iletilir (ayrı baloncuk, güvenli uzunluğa kırpılmış). Çalışma sürerken `/verbose on|full|off` değiştirirseniz sonraki araç baloncukları yeni ayara uyar.

## Plugin izleme direktifleri (/trace)

- Düzeyler: `on` | `off` (varsayılan).
- Yalnızca direktif içeren mesaj, oturum Plugin izleme çıktısını değiştirir ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi direktif yalnızca o mesaja etki eder; aksi hâlde oturum/genel varsayılanlar uygulanır.
- Geçerli izleme düzeyini görmek için bağımsız değişken olmadan `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose`’dan daha dardır: yalnızca Active Memory hata ayıklama özetleri gibi Plugin sahipli izleme/hata ayıklama satırlarını açığa çıkarır.
- İzleme satırları `/status` içinde ve normal asistan yanıtından sonra gelen takip tanılama mesajı olarak görünebilir.

## Akıl yürütme görünürlüğü (/reasoning)

- Düzeyler: `on|off|stream`.
- Yalnızca direktif içeren mesaj, yanıtlarda düşünme bloklarının gösterilip gösterilmeyeceğini değiştirir.
- Etkinleştirildiğinde, akıl yürütme `Reasoning:` ön ekiyle **ayrı bir mesaj** olarak gönderilir.
- `stream` (yalnızca Telegram): yanıt üretilirken akıl yürütmeyi Telegram taslak baloncuğuna akıtır, ardından akıl yürütme olmadan son yanıtı gönderir.
- Takma ad: `/reason`.
- Geçerli akıl yürütme düzeyini görmek için bağımsız değişken olmadan `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi direktif, sonra oturum geçersiz kılması, sonra ajan başına varsayılan (`agents.list[].reasoningDefault`), sonra geri dönüş (`off`).

## İlgili

- Yükseltilmiş mod belgeleri [Elevated mode](/tr/tools/elevated) içinde bulunur.

## Heartbeat’ler

- Heartbeat prob gövdesi yapılandırılmış heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Heartbeat mesajındaki satır içi direktifler normal şekilde uygulanır (ancak heartbeat’lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimi varsayılan olarak yalnızca son yükü gönderir. Ayrı `Reasoning:` mesajını da göndermek için (varsa) `agents.defaults.heartbeat.includeReasoning: true` veya ajan başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbet UI’si

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde gelen oturum deposu/yapılandırmasından oturumun depolanmış düzeyini yansıtır.
- Başka bir düzey seçmek, oturum geçersiz kılmasını hemen `sessions.patch` ile yazar; bir sonraki gönderimi beklemez ve tek seferlik bir `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman `Default (<resolved level>)` olur; burada çözümlenen varsayılan, etkin oturum modelinin sağlayıcı düşünme profilinden ve `/status` ile `session_status` tarafından kullanılan aynı geri dönüş mantığından gelir.
- Seçici, gateway oturum satırından döndürülen `thinkingOptions` kullanır. Tarayıcı UI’si kendi sağlayıcı regex listesini tutmaz; modele özgü düzey kümelerinin sahibi Plugin’lerdir.
- `/think:<level>` hâlâ çalışır ve aynı depolanmış oturum düzeyini günceller; böylece sohbet direktifleri ve seçici eşzamanlı kalır.

## Sağlayıcı profilleri

- Sağlayıcı Plugin’leri, modelin desteklenen düzeylerini ve varsayılanını tanımlamak için `resolveThinkingProfile(ctx)` açığa çıkarabilir.
- Her profil düzeyinin depolanmış kurallı bir `id` değeri vardır (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` veya `max`) ve bir görüntüleme `label` değeri içerebilir. İkili sağlayıcılar `{ id: "low", label: "on" }` kullanır.
- Yayınlanmış eski kancalar (`supportsXHighThinking`, `isBinaryThinking` ve `resolveDefaultThinkingLevel`) uyumluluk bağdaştırıcıları olarak kalır, ancak yeni özel düzey kümeleri `resolveThinkingProfile` kullanmalıdır.
- Gateway satırları `thinkingOptions` ve `thinkingDefault` açığa çıkarır; böylece ACP/sohbet istemcileri, çalışma zamanı doğrulamasının kullandığı aynı profili işler.
