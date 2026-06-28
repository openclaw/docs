---
doc-schema-version: 1
read_when:
    - OpenClaw'un hangi araçları sağladığını anlamak istiyorsunuz
    - Yerleşik araçlar, Skills ve Plugin'ler arasında karar veriyorsunuz
    - Araç ilkesi, otomasyon veya ajan koordinasyonu için doğru dokümantasyon giriş noktasına ihtiyacınız var
summary: 'OpenClaw araçları, Skills ve Plugin''lerine genel bakış: ajanların neleri çağırabileceği ve bunların nasıl genişletileceği'
title: Genel Bakış
x-i18n:
    generated_at: "2026-06-28T01:23:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f49afa2354ebb26eeb5f036cd1f2f7ceb228b01287adbc6c305addfb0af4502d
    source_path: tools/index.md
    workflow: 16
---

Doğru Yetenekler yüzeyini seçmek için bu sayfayı kullanın. **Araçlar** çağrılabilir
eylemlerdir, **Skills** aracılara nasıl çalışacaklarını öğretir ve **Plugin'ler**
araçlar, sağlayıcılar, kanallar, hook'lar ve paketlenmiş Skills gibi çalışma zamanı
yetenekleri ekler.

Bu bir genel bakış ve yönlendirme sayfasıdır. Kapsamlı araç ilkesi, varsayılanlar,
grup üyeliği, sağlayıcı kısıtlamaları ve yapılandırma alanları için
[Tools and custom providers](/tr/gateway/config-tools) sayfasını kullanın.

## Buradan başlayın

Çoğu aracı için yerleşik araç kategorileriyle başlayın, ardından ilkeyi yalnızca
aracının daha az araç görmesi gerektiğinde veya açık ana makine erişimine ihtiyaç duyduğunda
ayarlayın.

| Şunu yapmanız gerekiyorsa...                            | Önce bunu kullanın                              | Sonra okuyun                                                                                                      |
| ------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Bir aracının mevcut yeteneklerle eyleme geçmesine izin vermek | [Yerleşik araçlar](#built-in-tool-categories)    | [Araç kategorileri](#built-in-tool-categories)                                                                    |
| Bir aracının neleri çağırabileceğini denetlemek              | [Araç ilkesi](#configure-access-and-approvals) | [Tools and custom providers](/tr/gateway/config-tools)                                                             |
| Bir aracıya iş akışı öğretmek                   | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/tr/tools/skills), [Skills oluşturma](/tr/tools/creating-skills) ve [Skill Workshop](/tr/tools/skill-workshop) |
| Yeni bir entegrasyon veya çalışma zamanı yüzeyi eklemek    | [Plugin'ler](#extend-capabilities)                | [Plugin'ler](/tr/tools/plugin) ve [Plugin oluşturma](/tr/plugins/building-plugins)                                         |
| İşi daha sonra veya arka planda çalıştırmak         | [Otomasyon](/tr/automation)                      | [Otomasyona genel bakış](/tr/automation)                                                                              |
| Birden fazla aracıyı veya harness'ı koordine etmek     | [Alt aracılar](/tr/tools/subagents)                 | [ACP aracıları](/tr/tools/acp-agents) ve [Aracı gönderimi](/tr/tools/agent-send)                                             |
| Büyük bir OpenClaw araç kataloğunda arama yapmak        | [Araç Arama](/tr/tools/tool-search)              | [Araç Arama](/tr/tools/tool-search)                                                                               |

## Araçlar, Skills veya Plugin'ler arasında seçim yapın

<Steps>
  <Step title="Use a tool when the agent needs to act">
    Araç, aracının çağırabileceği yazılmış bir işlevdir; örneğin `exec`, `browser`,
    `web_search`, `message` veya `image_generate`. Aracının veri okuması, dosyaları
    değiştirmesi, mesaj göndermesi, bir sağlayıcıyı çağırması veya başka bir sistemi
    işletmesi gerektiğinde araçları kullanın. Görünür araçlar modele yapılandırılmış işlev
    tanımları olarak gönderilir.

    Model yalnızca etkin profilden, izin ver/reddet ilkesinden, sağlayıcı kısıtlamalarından,
    sandbox durumundan, kanal izinlerinden ve Plugin kullanılabilirliğinden geçen araçları görür.

  </Step>

  <Step title="Use a skill when the agent needs instructions">
    Skill, aracı istemine yüklenen bir `SKILL.md` yönerge paketidir. Aracı zaten
    ihtiyaç duyduğu araçlara sahipse ancak tekrarlanabilir bir iş akışına, inceleme rubriğine,
    komut sırasına veya işletim kısıtına ihtiyaç duyuyorsa Skill kullanın.

    Skills bir çalışma alanında, paylaşılan Skill dizininde, yönetilen OpenClaw
    Skill kökünde veya Plugin paketinde bulunabilir.

    [Skills](/tr/tools/skills) | [Skill Workshop](/tr/tools/skill-workshop) | [Skills oluşturma](/tr/tools/creating-skills) | [Skills yapılandırması](/tr/tools/skills-config)

  </Step>

  <Step title="Use a plugin when OpenClaw needs a new capability">
    Bir Plugin araçlar, Skills, kanallar, model sağlayıcıları, konuşma, gerçek zamanlı
    ses, medya üretimi, web araması, web getirme, hook'lar ve diğer çalışma zamanı
    yetenekleri ekleyebilir. Yetenek kod, kimlik bilgileri, yaşam döngüsü hook'ları,
    manifest meta verileri veya kurulabilir paketleme içeriyorsa Plugin kullanın. Mevcut
    Plugin'ler ClawHub, npm, git, yerel dizinler veya arşivlerden kurulabilir.

    [Plugin'leri kurma ve yapılandırma](/tr/tools/plugin) | [Plugin oluşturma](/tr/plugins/building-plugins) | [Plugin SDK](/tr/plugins/sdk-overview)

  </Step>
</Steps>

## Yerleşik araç kategorileri

Tablo, yüzeyi tanıyabilmeniz için temsili araçları listeler. Tam ilke başvurusu
değildir. Kesin gruplar, varsayılanlar ve izin ver/reddet semantiği için
[Tools and custom providers](/tr/gateway/config-tools) sayfasını kullanın.

| Kategori                | Aracı şunu yapmaya ihtiyaç duyduğunda kullanın...                                                | Temsili araçlar                                                 | Sonra okuyun                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Çalışma zamanı                 | Komut çalıştırmak, süreçleri yönetmek veya sağlayıcı destekli Python analizi kullanmak        | `exec`, `process`, `code_execution`                                  | [Exec](/tr/tools/exec), [Kod yürütme](/tr/tools/code-execution)                                |
| Dosyalar                   | Çalışma alanı dosyalarını okumak ve değiştirmek                                               | `read`, `write`, `edit`, `apply_patch`                               | [Patch uygula](/tr/tools/apply-patch)                                                           |
| Web                     | Web'de arama yapmak, X gönderilerinde arama yapmak veya okunabilir sayfa içeriği getirmek                | `web_search`, `x_search`, `web_fetch`                                | [Web araçları](/tr/tools/web), [Web getirme](/tr/tools/web-fetch)                                      |
| Tarayıcı                 | Bir tarayıcı oturumunu işletmek                                                     | `browser`                                                            | [Tarayıcı](/tr/tools/browser)                                                                   |
| Mesajlaşma ve kanallar  | Yanıtlar veya kanal eylemleri göndermek                                               | `message`                                                            | [Aracı gönderimi](/tr/tools/agent-send)                                                             |
| Oturumlar ve aracılar     | Oturumları incelemek, iş devretmek, başka bir çalıştırmayı yönlendirmek veya durum bildirmek          | `sessions_*`, `subagents`, `agents_list`, `session_status`, `goal`   | [Hedef](/tr/tools/goal), [Alt aracılar](/tr/tools/subagents), [Oturum aracı](/tr/concepts/session-tool) |
| Otomasyon              | İşi zamanlamak veya arka plan olaylarına yanıt vermek                                 | `cron`, `heartbeat_respond`                                          | [Otomasyon](/tr/automation)                                                                   |
| Gateway ve düğümler       | Gateway durumunu veya eşleştirilmiş hedef cihazları incelemek                                | `gateway`, `nodes`                                                   | [Gateway yapılandırması](/tr/gateway/configuration), [Düğümler](/tr/nodes)                            |
| Medya                   | Medyayı analiz etmek, üretmek veya seslendirmek                                             | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [Medyaya genel bakış](/tr/tools/media-overview)                                                     |
| Büyük OpenClaw katalogları | Her şemayı modele göndermeden çok sayıda uygun aracı aramak ve çağırmak | `tool_search_code`, `tool_search`, `tool_describe`                   | [Araç Arama](/tr/tools/tool-search)                                                           |

<Note>
Araç Arama deneysel bir OpenClaw aracı yüzeyidir. Codex harness çalıştırmaları,
`tools.toolSearch` yerine Codex'e özgü kod modu, yerel araç arama, ertelenmiş
dinamik araçlar ve iç içe araç çağrıları kullanır.
</Note>

## Plugin tarafından sağlanan araçlar

Plugin'ler ek araçlar kaydedebilir. Plugin yazarları araçları
`api.registerTool(...)` ve manifestin `contracts.tools` alanı üzerinden bağlar; sözleşme
ayrıntıları için [Plugin SDK](/tr/plugins/sdk-overview) ve [Plugin manifest](/tr/plugins/manifest)
sayfalarını kullanın.

Yaygın Plugin tarafından sağlanan araçlar şunları içerir:

- Dosya ve markdown farklarını işlemek için [Diffs](/tr/tools/diffs)
- Yalnızca JSON iş akışı adımları için [LLM Görevi](/tr/tools/llm-task)
- Sürdürülebilir onaylara sahip yazılmış iş akışları için [Lobster](/tr/tools/lobster)
- Gürültülü `exec` ve `bash` araç çıktısını sıkıştırmak için [Tokenjuice](/tr/tools/tokenjuice)
- Her şemayı isteme koymadan büyük araç kataloglarını keşfetmek ve çağırmak için [Araç Arama](/tr/tools/tool-search)
- Düğüm Canvas denetimi ve A2UI işleme için [Canvas](/tr/plugins/reference/canvas)

## Erişimi ve onayları yapılandırın

Araç ilkesi model çağrısından önce uygulanır. İlke bir aracı kaldırırsa model,
o aracın şemasını ilgili tur için almaz. Bir çalıştırma; global yapılandırma,
aracı başına yapılandırma, kanal ilkesi, sağlayıcı kısıtlamaları, sandbox kuralları,
kanal/çalışma zamanı ilkesi veya Plugin kullanılabilirliği nedeniyle araçları kaybedebilir.

- [Tools and custom providers](/tr/gateway/config-tools), araç profillerini,
  izin ver/reddet listelerini, sağlayıcıya özgü kısıtlamaları, döngü algılamayı ve
  sağlayıcı destekli araç ayarlarını belgeler.
- [Exec onayları](/tr/tools/exec-approvals), ana makine komutu onay ilkesini belgeler.
- [Yükseltilmiş exec](/tr/tools/elevated), sandbox dışındaki denetimli yürütmeyi belgeler.
- [Sandbox ile araç ilkesi ile yükseltilmiş erişim](/tr/gateway/sandbox-vs-tool-policy-vs-elevated), dosya ve süreç erişimini hangi katmanın denetlediğini açıklar.
- [Aracı başına sandbox ve araç kısıtlamaları](/tr/tools/multi-agent-sandbox-tools),
  devredilen çalıştırmalar için aracıya özgü kısıtlamaları belgeler.

## Yetenekleri genişletin

OpenClaw'ın yapmasını istediğiniz işe göre genişletme yolunu seçin:

- [Plugin'ler](/tr/tools/plugin) ile mevcut bir Plugin'i kurun veya yönetin.
- [Plugin oluşturma](/tr/plugins/building-plugins) ile yeni bir entegrasyon, sağlayıcı, kanal, araç veya hook oluşturun.
- [Skills](/tr/tools/skills) ve [Skills oluşturma](/tr/tools/creating-skills) ile yeniden kullanılabilir aracı yönergeleri ekleyin veya ayarlayın.
- Uygulama sözleşmelerine ihtiyaç duyduğunuzda [Plugin SDK](/tr/plugins/sdk-overview) ve [Plugin manifest](/tr/plugins/manifest) kullanın.

## Eksik araçlarda sorun giderin

Model bir aracı göremiyor veya çağıramıyorsa geçerli tur için etkin ilkeyle başlayın:

1. [Tools and custom providers](/tr/gateway/config-tools) içinde etkin profili,
   `tools.allow` ve `tools.deny` değerlerini kontrol edin.
2. [Tools and custom providers](/tr/gateway/config-tools) içindeki sağlayıcıya özgü
   kısıtlamaları kontrol edin ve seçilen [model sağlayıcısının](/tr/concepts/model-providers)
   araç şeklini desteklediğini doğrulayın.
3. [Sandbox ile araç ilkesi ile yükseltilmiş erişim](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) ve [Yükseltilmiş exec](/tr/tools/elevated) ile kanal izinlerini, sandbox durumunu ve yükseltilmiş erişimi kontrol edin.
4. Sahip olan Plugin'in [Plugin'ler](/tr/tools/plugin) içinde kurulu ve etkin olup olmadığını kontrol edin.
5. Devredilen çalıştırmalar için [Aracı başına sandbox ve araç kısıtlamaları](/tr/tools/multi-agent-sandbox-tools)
   içindeki aracı başına kısıtlamaları kontrol edin.
6. Büyük OpenClaw katalogları için çalıştırmanın doğrudan araç gösterimi mi yoksa
   [Araç Arama](/tr/tools/tool-search) mı kullandığını doğrulayın.

## İlgili

- Cron, görevler, Heartbeat, taahhütler, hook'lar, kalıcı emirler ve Task Flow için [Otomasyon](/tr/automation)
- Aracı modeli, oturumlar, bellek ve çok aracılı koordinasyon için [Aracılar](/tr/concepts/agent)
- Kanonik araç ilkesi başvurusu için [Tools and custom providers](/tr/gateway/config-tools)
- Plugin kurulumu ve yönetimi için [Plugin'ler](/tr/tools/plugin)
- Plugin yazarı başvurusu için [Plugin SDK](/tr/plugins/sdk-overview)
- Skill yükleme sırası, geçitleme ve yapılandırma için [Skills](/tr/tools/skills)
- Oluşturulan ve incelenen Skill oluşturma için [Skill Workshop](/tr/tools/skill-workshop)
- Kompakt OpenClaw araç kataloğu keşfi için [Araç Arama](/tr/tools/tool-search)
