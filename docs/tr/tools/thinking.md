---
read_when:
    - Düşünme, hızlı mod veya ayrıntılı yönerge ayrıştırmasını ya da varsayılanlarını ayarlama
summary: /think, /fast, /verbose, /trace ve akıl yürütme görünürlüğü için yönerge sözdizimi
title: Düşünme Düzeyleri
x-i18n:
    generated_at: "2026-04-17T08:52:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1cb44a7bf75546e5a8c3204e12f3297221449b881161d173dea4983da3921649
    source_path: tools/thinking.md
    workflow: 15
---

# Düşünme Düzeyleri (`/think` yönergeleri)

## Ne işe yarar

- Herhangi bir gelen gövde içinde satır içi yönerge: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Düzeyler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (maksimum bütçe)
  - xhigh → “ultrathink+” (GPT-5.2 + Codex modelleri ve Anthropic Claude Opus 4.7 çabası)
  - adaptive → sağlayıcı tarafından yönetilen uyarlanabilir düşünme (Anthropic Claude 4.6 ve Opus 4.7 için desteklenir)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` ile eşlenir.
  - `highest`, `max`, `high` ile eşlenir.
- Sağlayıcı notları:
  - Anthropic Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmadığında varsayılan olarak `adaptive` kullanır.
  - Anthropic Claude Opus 4.7 varsayılan olarak uyarlanabilir düşünmeyi kullanmaz. API çaba varsayılanı, siz açıkça bir düşünme düzeyi ayarlamadığınız sürece sağlayıcı tarafından belirlenmeye devam eder.
  - Anthropic Claude Opus 4.7, `/think xhigh` değerini uyarlanabilir düşünme artı `output_config.effort: "xhigh"` olarak eşler; çünkü `/think` bir düşünme yönergesidir ve `xhigh`, Opus 4.7 çaba ayarıdır.
  - Anthropic uyumlu akış yolundaki MiniMax (`minimax/*`), model parametrelerinde veya istek parametrelerinde düşünmeyi açıkça ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax’ın yerel olmayan Anthropic akış biçiminden sızan `reasoning_content` deltalarını önler.
  - Z.AI (`zai/*`) yalnızca ikili düşünmeyi (`on`/`off`) destekler. `off` dışındaki tüm düzeyler `on` olarak değerlendirilir (`low` ile eşlenir).
  - Moonshot (`moonshot/*`), `/think off` değerini `thinking: { type: "disabled" }` ile, `off` dışındaki tüm düzeyleri ise `thinking: { type: "enabled" }` ile eşler. Düşünme etkin olduğunda Moonshot yalnızca `tool_choice` `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalleştirir.

## Çözümleme sırası

1. Mesaj üzerindeki satır içi yönerge (yalnızca o mesaj için geçerlidir).
2. Oturum geçersiz kılması (yalnızca yönergeden oluşan bir mesaj gönderilerek ayarlanır).
3. Aracı başına varsayılan (`config` içinde `agents.list[].thinkingDefault`).
4. Genel varsayılan (`config` içinde `agents.defaults.thinkingDefault`).
5. Geri dönüş: Anthropic Claude 4.6 modelleri için `adaptive`, Anthropic Claude Opus 4.7 için açıkça yapılandırılmadıkça `off`, diğer akıl yürütme yetenekli modeller için `low`, aksi halde `off`.

## Bir oturum varsayılanı ayarlama

- **Yalnızca** yönergeden oluşan bir mesaj gönderin (boşluklara izin verilir), örneğin `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalıcı olur (varsayılan olarak gönderici başına); `/think:off` veya oturum boşta sıfırlaması ile temizlenir.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Düzey geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değiştirilmeden bırakılır.
- Geçerli düşünme düzeyini görmek için `/think` (veya `/think:`) gönderin.

## Aracıya göre uygulama

- **Gömülü Pi**: çözümlenen düzey, süreç içi Pi aracı çalışma zamanına iletilir.

## Hızlı mod (`/fast`)

- Düzeyler: `on|off`.
- Yalnızca yönergeden oluşan mesaj, bir oturum hızlı mod geçersiz kılmasını açıp kapatır ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir.
- Geçerli etkili hızlı mod durumunu görmek için, mod belirtmeden `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca yönergeden oluşan `/fast on|off`
  2. Oturum geçersiz kılması
  3. Aracı başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- `openai-codex/*` için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` işaretini gönderir. OpenClaw, her iki kimlik doğrulama yolu için de tek paylaşılan bir `/fast` anahtarı tutar.
- `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dahil doğrudan genel `anthropic/*` isteklerinde, hızlı mod Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto`; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model parametreleri, ikisi de ayarlandığında hızlı mod varsayılanını geçersiz kılar. OpenClaw yine de Anthropic olmayan proxy temel URL’leri için Anthropic hizmet katmanı eklemeyi atlar.

## Ayrıntılı yönergeler (`/verbose` veya `/v`)

- Düzeyler: `on` (minimal) | `full` | `off` (varsayılan).
- Yalnızca yönergeden oluşan mesaj oturum ayrıntılı modunu açıp kapatır ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz düzeyler durumu değiştirmeden bir ipucu döndürür.
- `/verbose off`, açık bir oturum geçersiz kılması saklar; bunu Sessions UI üzerinden `inherit` seçerek temizleyin.
- Satır içi yönerge yalnızca o mesajı etkiler; aksi halde oturum/genel varsayılanlar uygulanır.
- Geçerli ayrıntılı düzeyi görmek için `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı mod açık olduğunda, yapılandırılmış araç sonuçları üreten aracılar (Pi, diğer JSON aracılar) her araç çağrısını, varsa `<emoji> <tool-name>: <arg>` (yol/komut) önekiyle kendi meta veriye özel mesajı olarak geri gönderir. Bu araç özetleri, her araç başlar başlamaz gönderilir (ayrı baloncuklar olarak), akış deltaları olarak değil.
- Araç hata özetleri normal modda görünür kalır, ancak ham hata ayrıntısı son ekleri, ayrıntılı mod `on` veya `full` olmadıkça gizlenir.
- Ayrıntılı mod `full` olduğunda, araç çıktıları tamamlandıktan sonra da iletilir (ayrı baloncuk, güvenli bir uzunluğa kadar kırpılmış olarak). Çalışma sürerken `/verbose on|full|off` ile geçiş yaparsanız, sonraki araç baloncukları yeni ayarı dikkate alır.

## Plugin izleme yönergeleri (`/trace`)

- Düzeyler: `on` | `off` (varsayılan).
- Yalnızca yönergeden oluşan mesaj, oturum Plugin izleme çıktısını açıp kapatır ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi yönerge yalnızca o mesajı etkiler; aksi halde oturum/genel varsayılanlar uygulanır.
- Geçerli izleme düzeyini görmek için `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose`’tan daha dardır: yalnızca Plugin sahipli izleme/hata ayıklama satırlarını, örneğin Active Memory hata ayıklama özetlerini açığa çıkarır.
- İzleme satırları `/status` içinde ve normal asistan yanıtından sonra gelen bir takip tanılama mesajı olarak görünebilir.

## Akıl yürütme görünürlüğü (`/reasoning`)

- Düzeyler: `on|off|stream`.
- Yalnızca yönergeden oluşan mesaj, yanıtlarda düşünme bloklarının gösterilip gösterilmeyeceğini açıp kapatır.
- Etkinleştirildiğinde, akıl yürütme `Reasoning:` önekiyle **ayrı bir mesaj** olarak gönderilir.
- `stream` (yalnızca Telegram): akıl yürütmeyi yanıt oluşturulurken Telegram taslak baloncuğuna akıtır, ardından son yanıtı akıl yürütme olmadan gönderir.
- Takma ad: `/reason`.
- Geçerli akıl yürütme düzeyini görmek için `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi yönerge, ardından oturum geçersiz kılması, ardından aracı başına varsayılan (`agents.list[].reasoningDefault`), ardından geri dönüş (`off`).

## İlgili

- Yükseltilmiş mod belgeleri [Elevated mode](/tr/tools/elevated) içinde bulunur.

## Heartbeat'ler

- Heartbeat yoklama gövdesi, yapılandırılmış heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Bir heartbeat mesajındaki satır içi yönergeler her zamanki gibi uygulanır (ancak heartbeat’lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimi varsayılan olarak yalnızca son yükü gönderir. Ayrı `Reasoning:` mesajını da göndermek için (varsa), `agents.defaults.heartbeat.includeReasoning: true` veya aracı başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbet arayüzü

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde gelen oturum deposu/yapılandırmasından oturumun saklanan düzeyini yansıtır.
- Başka bir düzey seçmek, geçersiz kılmayı hemen `sessions.patch` üzerinden yazar; sonraki gönderimi beklemez ve tek seferlik bir `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman `Default (<resolved level>)` olur; burada çözümlenen varsayılan etkin oturum modelinden gelir: Anthropic üzerindeki Claude 4.6 için `adaptive`, yapılandırılmadıkça Anthropic Claude Opus 4.7 için `off`, diğer akıl yürütme yetenekli modeller için `low`, aksi halde `off`.
- Seçici sağlayıcıya duyarlı kalır:
  - çoğu sağlayıcı `off | minimal | low | medium | high | adaptive` gösterir
  - Anthropic Claude Opus 4.7, `off | minimal | low | medium | high | xhigh | adaptive` gösterir
  - Z.AI ikili `off | on` gösterir
- `/think:<level>` yine çalışır ve aynı saklanan oturum düzeyini günceller; böylece sohbet yönergeleri ile seçici senkronize kalır.
