---
read_when:
    - Düşünme, hızlı mod veya ayrıntılı yönerge ayrıştırmasını ya da varsayılanlarını ayarlama
summary: '`/think`, `/fast`, `/verbose`, `/trace` ve akıl yürütme görünürlüğü için yönerge sözdizimi'
title: Düşünme düzeyleri
x-i18n:
    generated_at: "2026-04-12T23:33:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3b1341281f07ba4e9061e3355845dca234be04cc0d358594312beeb7676e68
    source_path: tools/thinking.md
    workflow: 15
---

# Düşünme Düzeyleri (`/think` yönergeleri)

## Ne yapar

- Herhangi bir gelen gövde içinde satır içi yönerge: `/t <level>`, `/think:<level>` veya `/thinking <level>`.
- Düzeyler (takma adlar): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (maksimum bütçe)
  - xhigh → “ultrathink+” (yalnızca GPT-5.2 + Codex modelleri)
  - adaptive → sağlayıcı tarafından yönetilen uyarlamalı akıl yürütme bütçesi (Anthropic Claude 4.6 model ailesi için desteklenir)
  - `x-high`, `x_high`, `extra-high`, `extra high` ve `extra_high`, `xhigh` değerine eşlenir.
  - `highest`, `max`, `high` değerine eşlenir.
- Sağlayıcı notları:
  - Anthropic Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmadığında varsayılan olarak `adaptive` kullanır.
  - Anthropic uyumlu akış yolundaki MiniMax (`minimax/*`), model parametrelerinde veya istek parametrelerinde düşünmeyi açıkça ayarlamadığınız sürece varsayılan olarak `thinking: { type: "disabled" }` kullanır. Bu, MiniMax’in yerel olmayan Anthropic akış biçiminden sızan `reasoning_content` delta’larını önler.
  - Z.AI (`zai/*`) yalnızca ikili düşünmeyi (`on`/`off`) destekler. `off` dışındaki herhangi bir düzey `on` olarak değerlendirilir (`low` olarak eşlenir).
  - Moonshot (`moonshot/*`), `/think off` değerini `thinking: { type: "disabled" }` olarak ve `off` dışındaki herhangi bir düzeyi `thinking: { type: "enabled" }` olarak eşler. Düşünme etkin olduğunda Moonshot yalnızca `tool_choice` için `auto|none` kabul eder; OpenClaw uyumsuz değerleri `auto` olarak normalize eder.

## Çözümleme sırası

1. Mesajdaki satır içi yönerge (yalnızca o mesaja uygulanır).
2. Oturum geçersiz kılması (yalnızca yönerge içeren bir mesaj gönderilerek ayarlanır).
3. Aracı başına varsayılan (`config` içinde `agents.list[].thinkingDefault`).
4. Genel varsayılan (`config` içinde `agents.defaults.thinkingDefault`).
5. Geri dönüş: Anthropic Claude 4.6 modelleri için `adaptive`, diğer akıl yürütebilen modeller için `low`, aksi halde `off`.

## Oturum varsayılanı ayarlama

- **Yalnızca** yönergeden oluşan bir mesaj gönderin (boşluklara izin verilir), örneğin `/think:medium` veya `/t high`.
- Bu, geçerli oturum için kalıcı olur (varsayılan olarak gönderici başına); `/think:off` veya oturumun boşta sıfırlanması ile temizlenir.
- Onay yanıtı gönderilir (`Thinking level set to high.` / `Thinking disabled.`). Düzey geçersizse (ör. `/thinking big`), komut bir ipucuyla reddedilir ve oturum durumu değiştirilmez.
- Geçerli düşünme düzeyini görmek için bağımsız değişken olmadan `/think` (veya `/think:`) gönderin.

## Aracıya göre uygulama

- **Gömülü Pi**: çözümlenen düzey, süreç içi Pi aracı çalışma zamanına iletilir.

## Hızlı mod (`/fast`)

- Düzeyler: `on|off`.
- Yalnızca yönerge içeren mesaj, oturum hızlı mod geçersiz kılmasını açar/kapatır ve `Fast mode enabled.` / `Fast mode disabled.` yanıtını verir.
- Geçerli etkin hızlı mod durumunu görmek için mod belirtmeden `/fast` (veya `/fast status`) gönderin.
- OpenClaw hızlı modu şu sırayla çözümler:
  1. Satır içi/yalnızca yönerge içeren `/fast on|off`
  2. Oturum geçersiz kılması
  3. Aracı başına varsayılan (`agents.list[].fastModeDefault`)
  4. Model başına config: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Geri dönüş: `off`
- `openai/*` için hızlı mod, desteklenen Responses isteklerinde `service_tier=priority` göndererek OpenAI öncelikli işlemeye eşlenir.
- `openai-codex/*` için hızlı mod, Codex Responses üzerinde aynı `service_tier=priority` bayrağını gönderir. OpenClaw, her iki kimlik doğrulama yolu için tek bir paylaşılan `/fast` anahtarı kullanır.
- `api.anthropic.com` adresine gönderilen OAuth ile kimliği doğrulanmış trafik dahil doğrudan genel `anthropic/*` istekleri için hızlı mod, Anthropic hizmet katmanlarına eşlenir: `/fast on`, `service_tier=auto`; `/fast off`, `service_tier=standard_only` ayarlar.
- Anthropic uyumlu yoldaki `minimax/*` için `/fast on` (veya `params.fastMode: true`), `MiniMax-M2.7` modelini `MiniMax-M2.7-highspeed` olarak yeniden yazar.
- Açık Anthropic `serviceTier` / `service_tier` model parametreleri, ikisi birden ayarlandığında hızlı mod varsayılanını geçersiz kılar. OpenClaw, Anthropic olmayan vekil `baseUrl` değerleri için yine de Anthropic hizmet katmanı eklemeyi atlar.

## Ayrıntılı yönergeler (`/verbose` veya `/v`)

- Düzeyler: `on` (minimal) | `full` | `off` (varsayılan).
- Yalnızca yönerge içeren mesaj, oturum ayrıntı düzeyini açar/kapatır ve `Verbose logging enabled.` / `Verbose logging disabled.` yanıtını verir; geçersiz düzeyler durumu değiştirmeden ipucu döndürür.
- `/verbose off`, açık bir oturum geçersiz kılması saklar; bunu Sessions UI üzerinden `inherit` seçerek temizleyin.
- Satır içi yönerge yalnızca o mesaja uygulanır; aksi halde oturum/genel varsayılanlar geçerlidir.
- Geçerli ayrıntı düzeyini görmek için bağımsız değişken olmadan `/verbose` (veya `/verbose:`) gönderin.
- Ayrıntılı mod açık olduğunda, yapılandırılmış araç sonuçları üreten aracılar (Pi, diğer JSON aracıları) her araç çağrısını, mümkün olduğunda `<emoji> <tool-name>: <arg>` (yol/komut) önekiyle kendi meta veri mesajı olarak geri gönderir. Bu araç özetleri, her araç başlar başlamaz gönderilir (ayrı baloncuklar olarak), akış delta’ları olarak değil.
- Araç başarısızlık özetleri normal modda görünür kalır, ancak ham hata ayrıntısı son ekleri `verbose` `on` veya `full` olmadıkça gizlenir.
- `verbose` `full` olduğunda araç çıktıları da tamamlandıktan sonra iletilir (ayrı baloncuk, güvenli bir uzunluğa kırpılmış). Çalışma sürerken `/verbose on|full|off` değerini değiştirirseniz, sonraki araç baloncukları yeni ayara uyar.

## Plugin izleme yönergeleri (`/trace`)

- Düzeyler: `on` | `off` (varsayılan).
- Yalnızca yönerge içeren mesaj, oturum Plugin izleme çıktısını açar/kapatır ve `Plugin trace enabled.` / `Plugin trace disabled.` yanıtını verir.
- Satır içi yönerge yalnızca o mesaja uygulanır; aksi halde oturum/genel varsayılanlar geçerlidir.
- Geçerli izleme düzeyini görmek için bağımsız değişken olmadan `/trace` (veya `/trace:`) gönderin.
- `/trace`, `/verbose` değerinden daha dardır: yalnızca Active Memory hata ayıklama özetleri gibi Plugin’e ait izleme/hata ayıklama satırlarını gösterir.
- İzleme satırları `/status` içinde ve normal asistan yanıtından sonra takip tanı mesajı olarak görünebilir.

## Akıl yürütme görünürlüğü (`/reasoning`)

- Düzeyler: `on|off|stream`.
- Yalnızca yönerge içeren mesaj, yanıtlar içinde düşünme bloklarının gösterilip gösterilmeyeceğini açar/kapatır.
- Etkin olduğunda, akıl yürütme **ayrı bir mesaj** olarak `Reasoning:` önekiyle gönderilir.
- `stream` (yalnızca Telegram): yanıt üretilirken akıl yürütmeyi Telegram taslak baloncuğuna akıtır, ardından son yanıtı akıl yürütme olmadan gönderir.
- Takma ad: `/reason`.
- Geçerli akıl yürütme düzeyini görmek için bağımsız değişken olmadan `/reasoning` (veya `/reasoning:`) gönderin.
- Çözümleme sırası: satır içi yönerge, sonra oturum geçersiz kılması, sonra aracı başına varsayılan (`agents.list[].reasoningDefault`), sonra geri dönüş (`off`).

## İlgili

- Yükseltilmiş mod belgeleri [Elevated mode](/tr/tools/elevated) altında yer alır.

## Heartbeat’ler

- Heartbeat probe gövdesi, yapılandırılmış heartbeat istemidir (varsayılan: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Bir heartbeat mesajındaki satır içi yönergeler her zamanki gibi uygulanır (ancak heartbeat’lerden oturum varsayılanlarını değiştirmekten kaçının).
- Heartbeat teslimi varsayılan olarak yalnızca son yükü gönderir. Ayrı `Reasoning:` mesajını da göndermek için (varsa), `agents.defaults.heartbeat.includeReasoning: true` veya aracı başına `agents.list[].heartbeat.includeReasoning: true` ayarlayın.

## Web sohbet UI

- Web sohbet düşünme seçicisi, sayfa yüklendiğinde gelen oturum deposu/config içindeki oturumun saklanan düzeyini yansıtır.
- Başka bir düzey seçmek, `sessions.patch` aracılığıyla oturum geçersiz kılmasını hemen yazar; bir sonraki gönderimi beklemez ve tek seferlik bir `thinkingOnce` geçersiz kılması değildir.
- İlk seçenek her zaman `Default (<resolved level>)` olur; burada çözümlenen varsayılan etkin oturum modelinden gelir: Anthropic/Bedrock üzerindeki Claude 4.6 için `adaptive`, diğer akıl yürütebilen modeller için `low`, aksi halde `off`.
- Seçici sağlayıcı farkındalığını korur:
  - çoğu sağlayıcı `off | minimal | low | medium | high | adaptive` gösterir
  - Z.AI ikili `off | on` gösterir
- `/think:<level>` hâlâ çalışır ve aynı saklanan oturum düzeyini günceller; böylece sohbet yönergeleri ile seçici senkron kalır.
