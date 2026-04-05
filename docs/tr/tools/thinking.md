---
read_when:
    - Düşünme, hızlı mod veya ayrıntılı yönerge ayrıştırmasını ya da varsayılanlarını ayarlıyorsanız
summary: /think, /fast, /verbose ve akıl yürütme görünürlüğü için yönerge sözdizimi
title: Düşünme Düzeyleri
x-i18n:
    generated_at: "2026-04-05T14:14:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: f60aeb6ab4c7ce858f725f589f54184b29d8c91994d18c8deafa75179b9a62cb
    source_path: tools/thinking.md
    workflow: 15
---

# Düşünme Düzeyleri (/think yönergeleri)

## Ne yapar

- Herhangi bir gelen gövde içinde satır içi yönerge: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Düzeyler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (en yüksek bütçe)
  - xhigh → “ultrathink+” (yalnızca GPT-5.2 + Codex modelleri)
  - adaptive → sağlayıcı tarafından yönetilen uyarlanabilir akıl yürütme bütçesi (Anthropic Claude 4.6 model ailesi için desteklenir)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` değerine eşlenir.
  - `highest`, `max`, `high` değerine eşlenir.
- Sağlayıcı notları:
  - Anthropic Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmadığında varsayılan olarak `adaptive` kullanır.
  - Anthropic uyumlu akış yolundaki MiniMax (`minimax/*`), model parametrelerinde veya istek parametrelerinde düşünmeyi açıkça ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax'in yerel olmayan Anthropic akış biçiminden sızan `reasoning_content` deltalarını önler.
  - Z.AI (`zai/*`) yalnızca ikili düşünmeyi destekler (`on`/`off`). `off` dışındaki herhangi bir düzey `on` olarak değerlendirilir (`low` düzeyine eşlenir).
  - Moonshot (`moonshot/*`), `/think off` değerini `thinking: { type: "disabled" }` olarak ve `off` dışındaki herhangi bir düzeyi `thinking: { type: "enabled" }` olarak eşler. Düşünme etkin olduğunda Moonshot yalnızca `tool_choice` için `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalize eder.

## Çözümleme sırası

1. Mesaj üzerindeki satır içi yönerge (yalnızca o mesaja uygulanır).
2. Oturum geçersiz kılması (yalnızca yönerge içeren bir mesaj gönderilerek ayarlanır).
3. Ajan başına varsayılan (`config` içinde `agents.list[].thinkingDefault`).
4. Genel varsayılan (`config` içinde `agents.defaults.thinkingDefault`).
5. Geri dönüş: Anthropic Claude 4.6 modelleri için `adaptive`, akıl yürütebilen diğer modeller için `low`, aksi halde `off`.

## Oturum varsayılanı ayarlama

- **Yalnızca** yönergeden oluşan bir mesaj gönderin (boşluk olabilir), örneğin `/think:medium` veya `/t high`.
- Bu, mevcut oturum için kalıcı olur (varsayılan olarak gönderici başına); `/think:off` ile veya oturum boşta sıfırlanınca temizlenir.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Düzey geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değiştirilmez.
- Geçerli düşünme düzeyini görmek için bağımsız değişken olmadan `/think` (veya `/think:`) gönderin.

## Ajan bazında uygulama

- **Gömülü Pi**: çözümlenen düzey, süreç içi Pi ajan çalışma zamanına geçirilir.

## Hızlı mod (/fast)

- Düzeyler: `on|off`.
- Yalnızca yönergeden oluşan mesaj, oturum hızlı mod geçersiz kılmasını açar/kapatır ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir.
- Geçerli etkili hızlı mod durumunu görmek için kip belirtmeden `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca yönergeden oluşan `/fast on|off`
  2. Oturum geçersiz kılması
  3. Ajan başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına yapılandırma: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- `openai-codex/*` için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. OpenClaw her iki kimlik doğrulama yolu için tek bir ortak `/fast` anahtarı kullanır.
- Doğrudan genel `anthropic/*` istekleri için, `api.anthropic.com` adresine gönderilen OAuth kimlik doğrulamalı trafik dahil, hızlı mod Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto` ayarlar; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` modelini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model parametreleri, her ikisi de ayarlanmışsa hızlı mod varsayılanını geçersiz kılar. OpenClaw yine de Anthropic olmayan proxy temel URL'leri için Anthropic hizmet katmanı eklemesini atlar.

## Ayrıntılı yönergeler (/verbose veya /v)

- Düzeyler: `on` (minimal) | `full` | `off` (varsayılan).
- Yalnızca yönergeden oluşan mesaj, oturum ayrıntılı modunu açar/kapatır ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz düzeyler durumu değiştirmeden bir ipucu döndürür.
- `/verbose off`, açık bir oturum geçersiz kılması saklar; bunu Sessions UI üzerinden `inherit` seçilerek temizleyin.
- Satır içi yönerge yalnızca o mesaja uygulanır; aksi halde oturum/genel varsayılanlar geçerlidir.
- Geçerli ayrıntı düzeyini görmek için bağımsız değişken olmadan `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı mod açık olduğunda, yapılandırılmış araç sonuçları üreten ajanlar (Pi, diğer JSON ajanları) her araç çağrısını kendi meta veri-only mesajı olarak geri gönderir; varsa `<emoji> <tool-name>: <arg>` öneki kullanılır (yol/komut). Bu araç özetleri, her araç başlar başlamaz gönderilir (ayrı baloncuklar olarak), akış deltaları şeklinde değil.
- Araç hata özetleri normal modda görünür kalır, ancak ham hata ayrıntısı sonekleri `verbose` `on` veya `full` olmadıkça gizlenir.
- `verbose` `full` olduğunda araç çıktıları da tamamlandıktan sonra iletilir (ayrı baloncuk, güvenli bir uzunlukta kesilmiş). Bir çalışma devam ederken `/verbose on|full|off` değiştirirseniz sonraki araç baloncukları yeni ayara uyar.

## Akıl yürütme görünürlüğü (/reasoning)

- Düzeyler: `on|off|stream`.
- Yalnızca yönergeden oluşan mesaj, yanıtlarda düşünme bloklarının gösterilip gösterilmeyeceğini değiştirir.
- Etkin olduğunda, akıl yürütme `Reasoning:` önekiyle **ayrı bir mesaj** olarak gönderilir.
- `stream` (yalnızca Telegram): yanıt üretilirken akıl yürütmeyi Telegram taslak baloncuğuna akıtır, ardından son yanıtı akıl yürütme olmadan gönderir.
- Takma ad: `/reason`.
- Geçerli akıl yürütme düzeyini görmek için bağımsız değişken olmadan `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi yönerge, ardından oturum geçersiz kılması, ardından ajan başına varsayılan (`agents.list[].reasoningDefault`), ardından geri dönüş (`off`).

## İlgili

- Elevated mode belgeleri [Elevated mode](/tr/tools/elevated) bölümünde bulunur.

## Heartbeat'ler

- Heartbeat probe gövdesi yapılandırılmış heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Heartbeat mesajındaki satır içi yönergeler normal şekilde uygulanır (ancak heartbeat'lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimi varsayılan olarak yalnızca son yükü gönderir. Ayrı `Reasoning:` mesajını da göndermek için (varsa) `agents.defaults.heartbeat.includeReasoning: true` veya ajan başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbet arayüzü

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde gelen oturum deposu/yapılandırmasından oturumun saklanan düzeyini yansıtır.
- Başka bir düzey seçmek oturum geçersiz kılmasını hemen `sessions.patch` ile yazar; sonraki gönderimi beklemez ve tek seferlik bir `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman `Default (<resolved level>)` olur; burada çözümlenen varsayılan, etkin oturum modelinden gelir: Anthropic/Bedrock üzerinde Claude 4.6 için `adaptive`, akıl yürütebilen diğer modeller için `low`, aksi halde `off`.
- Seçici sağlayıcı farkındalığını korur:
  - çoğu sağlayıcı `off | minimal | low | medium | high | adaptive` gösterir
  - Z.AI ikili `off | on` gösterir
- `/think:<level>` hâlâ çalışır ve aynı saklanan oturum düzeyini günceller; böylece sohbet yönergeleri ile seçici senkronize kalır.
