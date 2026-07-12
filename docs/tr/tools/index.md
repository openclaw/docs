---
doc-schema-version: 1
read_when:
    - OpenClaw'ın hangi araçları sunduğunu anlamak istiyorsunuz
    - Yerleşik araçlar, Skills ve Pluginler arasında karar veriyorsunuz
    - Araç politikası, otomasyon veya ajan koordinasyonu için doğru dokümantasyon başlangıç noktasına ihtiyacınız var
summary: 'OpenClaw araçlarına, Skills''e ve Plugin''lere genel bakış: ajanların neleri çağırabileceği ve bunların nasıl genişletileceği'
title: Genel Bakış
x-i18n:
    generated_at: "2026-07-12T12:18:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 628b47a8756e229a712981b669c96a36689909755dcd244667612f8761e67526
    source_path: tools/index.md
    workflow: 16
---

Doğru Yetenekler yüzeyini seçmek için bu sayfayı kullanın. **Araçlar**
çağrılabilir eylemlerdir, **Skills** aracılara nasıl çalışacaklarını öğretir ve **Plugin'ler**
araçlar, sağlayıcılar, kanallar, kancalar ve paketlenmiş
Skills gibi çalışma zamanı yetenekleri ekler.

Bu bir genel bakış ve yönlendirme sayfasıdır. Kapsamlı araç politikası, varsayılanlar,
grup üyeliği, sağlayıcı kısıtlamaları ve yapılandırma alanları için
[Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools) sayfasını kullanın.

## Buradan başlayın

Çoğu aracı için yerleşik araç kategorileriyle başlayın, ardından politikayı yalnızca
aracının daha az araç görmesi veya açık ana makine erişimine ihtiyaç duyması durumunda ayarlayın.

| Şunları yapmanız gerekiyorsa...                          | Önce bunu kullanın                                  | Ardından okuyun                                                                                                       |
| ------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Bir aracının mevcut yeteneklerle işlem yapmasını sağlamak | [Yerleşik araçlar](#built-in-tool-categories)       | [Araç kategorileri](#built-in-tool-categories)                                                                        |
| Bir aracının neleri çağırabileceğini denetlemek          | [Araç politikası](#configure-access-and-approvals)  | [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools)                                                                 |
| Bir aracıya iş akışı öğretmek                            | [Skills](#choose-tools-skills-or-plugins)           | [Skills](/tr/tools/skills), [Skills oluşturma](/tr/tools/creating-skills) ve [Skills Atölyesi](/tr/tools/skill-workshop)       |
| Yeni bir entegrasyon veya çalışma zamanı yüzeyi eklemek  | [Plugin'ler](#extend-capabilities)                  | [Plugin'ler](/tr/tools/plugin) ve [Plugin oluşturma](/tr/plugins/building-plugins)                                          |
| Çalışmayı daha sonra veya arka planda yürütmek           | [Otomasyon](/tr/automation)                            | [Otomasyona genel bakış](/tr/automation)                                                                                 |
| Birden fazla aracıyı veya çalıştırma düzenini koordine etmek | [Alt aracılar](/tr/tools/subagents)                | [ACP aracıları](/tr/tools/acp-agents) ve [Aracı gönderimi](/tr/tools/agent-send)                                            |
| Büyük bir OpenClaw araç kataloğunda arama yapmak         | [Araç Arama](/tr/tools/tool-search)                    | [Araç Arama](/tr/tools/tool-search)                                                                                      |

## Araçları, Skills'i veya Plugin'leri seçin

<Steps>
  <Step title="Aracının işlem yapması gerektiğinde bir araç kullanın">
    Araç, aracının çağırabileceği `exec`, `browser`,
    `web_search`, `message` veya `image_generate` gibi türü belirlenmiş bir işlevdir. Aracının
    veri okuması, dosyaları değiştirmesi, mesaj göndermesi, bir sağlayıcıyı çağırması veya
    başka bir sistemi çalıştırması gerektiğinde araçları kullanın. Görünür araçlar modele yapılandırılmış
    işlev tanımları olarak gönderilir.

    Model yalnızca etkin profil, izin verme/reddetme
    politikası, sağlayıcı kısıtlamaları, korumalı alan durumu, kanal izinleri ve
    Plugin kullanılabilirliğinden geçen araçları görür.

  </Step>

  <Step title="Aracının talimatlara ihtiyacı olduğunda Skills kullanın">
    Skill, aracı istemine yüklenen bir `SKILL.md` talimat paketidir. Aracı
    ihtiyaç duyduğu araçlara zaten sahipse ancak tekrarlanabilir bir
    iş akışına, inceleme ölçütlerine, komut dizisine veya çalışma
    kısıtlamasına ihtiyaç duyuyorsa bir Skill kullanın.

    Skills bir çalışma alanında, paylaşılan Skill dizininde, yönetilen OpenClaw
    Skill kökünde veya Plugin paketinde bulunabilir.

    [Skills](/tr/tools/skills) | [Skills Atölyesi](/tr/tools/skill-workshop) | [Skills oluşturma](/tr/tools/creating-skills) | [Skills yapılandırması](/tr/tools/skills-config)

  </Step>

  <Step title="OpenClaw'un yeni bir yeteneğe ihtiyacı olduğunda Plugin kullanın">
    Bir Plugin; araçlar, Skills, kanallar, model sağlayıcıları, konuşma,
    gerçek zamanlı ses, medya üretimi, web araması, web getirme, kancalar ve diğer
    çalışma zamanı yeteneklerini ekleyebilir. Yetenek kod,
    kimlik bilgileri, yaşam döngüsü kancaları, bildirim meta verileri veya kurulabilir
    paketleme içeriyorsa bir Plugin kullanın. Mevcut Plugin'ler ClawHub, npm, git,
    yerel dizinler veya arşivlerden kurulabilir.

    [Plugin'leri kurma ve yapılandırma](/tr/tools/plugin) | [Plugin oluşturma](/tr/plugins/building-plugins) | [Plugin SDK](/tr/plugins/sdk-overview)

  </Step>
</Steps>

## Yerleşik araç kategorileri

Tablo, yüzeyi tanıyabilmeniz için temsili araçları listeler. Bu,
tam politika referansı değildir. Kesin gruplar, varsayılanlar ve izin verme/reddetme
anlamları için [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools) sayfasını kullanın.

| Kategori                | Aracının şunları yapması gerektiğinde kullanın...                            | Temsili araçlar                                                                                      | Ardından okuyun                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Çalışma zamanı          | Komut çalıştırmak, süreçleri yönetmek veya sağlayıcı destekli Python analizi kullanmak | `exec`, `process`, `code_execution`                                                             | [Exec](/tr/tools/exec), [Kod yürütme](/tr/tools/code-execution)                                           |
| Dosyalar                | Çalışma alanı dosyalarını okumak ve değiştirmek                               | `read`, `write`, `edit`, `apply_patch`                                                               | [Yama uygulama](/tr/tools/apply-patch)                                                                 |
| Web                     | Web'de arama yapmak, X gönderilerini aramak veya okunabilir sayfa içeriğini getirmek | `web_search`, `x_search`, `web_fetch`                                                           | [Web araçları](/tr/tools/web), [Web getirme](/tr/tools/web-fetch)                                         |
| Tarayıcı                | Bir tarayıcı oturumunu çalıştırmak                                             | `browser`                                                                                            | [Tarayıcı](/tr/tools/browser)                                                                          |
| Mesajlaşma ve kanallar  | Yanıtlar veya kanal eylemleri göndermek                                        | `message`                                                                                            | [Aracı gönderimi](/tr/tools/agent-send)                                                                |
| Oturumlar ve aracılar   | Oturumları incelemek, çalışma devretmek, başka bir çalıştırmayı yönlendirmek veya durum bildirmek | `sessions_*`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [Hedef](/tr/tools/goal), [Alt aracılar](/tr/tools/subagents), [Oturum aracı](/tr/concepts/session-tool) |
| Otomasyon               | Çalışma zamanlamak veya arka plan olaylarına yanıt vermek                      | `cron`, `heartbeat_respond`                                                                          | [Otomasyon](/tr/automation)                                                                            |
| Gateway ve Node'lar     | Gateway durumunu veya eşleştirilmiş hedef cihazları incelemek                  | `gateway`, `nodes`                                                                                   | [Gateway yapılandırması](/tr/gateway/configuration), [Node'lar](/tr/nodes)                                |
| Medya                   | Medyayı analiz etmek, üretmek veya seslendirmek                                | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                 | [Medyaya genel bakış](/tr/tools/media-overview)                                                        |
| Büyük OpenClaw katalogları | Her şemayı modele göndermeden çok sayıda uygun aracı aramak ve çağırmak     | `tool_search_code`, `tool_search`, `tool_describe`                                                   | [Araç Arama](/tr/tools/tool-search)                                                                    |

<Note>
Araç Arama, deneysel bir OpenClaw aracı yüzeyidir. Codex çalıştırma düzenleri,
`tools.toolSearch` yerine Codex'e özgü kod modunu, yerel araç aramasını, ertelenmiş
dinamik araçları ve iç içe araç çağrılarını kullanır.
</Note>

## Plugin tarafından sağlanan araçlar

Plugin'ler ek araçlar kaydedebilir. Plugin yazarları araçları
`api.registerTool(...)` ve bildirimin `contracts.tools` alanı üzerinden bağlar; sözleşme
ayrıntıları için [Plugin SDK](/tr/plugins/sdk-overview) ve [Plugin bildirimi](/tr/plugins/manifest)
sayfalarını kullanın.

Plugin tarafından sağlanan yaygın araçlar şunlardır:

- Dosya ve Markdown farklarını görüntülemek için [Farklar](/tr/tools/diffs)
- Web sohbetinde bağımsız satır içi SVG ve HTML için [Bileşen gösterme](/tools/show-widget)
- Yalnızca JSON kullanan iş akışı adımları için [LLM Görevi](/tr/tools/llm-task)
- Sürdürülebilir onaylara sahip türü belirlenmiş iş akışları için [Lobster](/tr/tools/lobster)
- Gürültülü `exec` ve `bash` aracı çıktılarını sıkıştırmak için
  [Tokenjuice](/tr/tools/tokenjuice)
- Her şemayı isteme koymadan büyük araç kataloglarını keşfetmek ve çağırmak için
  [Araç Arama](/tr/tools/tool-search)
- Node Canvas denetimi ve A2UI görüntüleme için
  [Canvas](/tr/plugins/reference/canvas)

## Erişimi ve onayları yapılandırın

Araç politikası model çağrısından önce uygulanır. Politika bir aracı kaldırırsa
model, söz konusu dönüş için o aracın şemasını almaz. Bir çalıştırma; genel yapılandırma,
aracı başına yapılandırma, kanal politikası, sağlayıcı kısıtlamaları, korumalı alan
kuralları, kanal/çalışma zamanı politikası veya Plugin kullanılabilirliği nedeniyle araçlarını kaybedebilir.

- [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools); araç profillerini,
  izin verme/reddetme listelerini, sağlayıcıya özgü kısıtlamaları, döngü algılamayı ve
  sağlayıcı destekli araç ayarlarını belgeler.
- [Exec onayları](/tr/tools/exec-approvals), ana makine komutu onay
  politikasını belgeler.
- [Yükseltilmiş exec](/tr/tools/elevated), korumalı alan dışında denetimli yürütmeyi
  belgeler.
- [Korumalı alan ile araç politikası ile yükseltilmiş erişim karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
  dosya ve süreç erişimini hangi katmanın denetlediğini açıklar.
- [Aracı başına korumalı alan ve araç kısıtlamaları](/tr/tools/multi-agent-sandbox-tools),
  devredilmiş çalıştırmalar için aracıya özgü kısıtlamaları belgeler.

## Yetenekleri genişletin

OpenClaw'un yapmasını istediğiniz işe göre genişletme yolunu seçin:

- Mevcut bir Plugin'i [Plugin'ler](/tr/tools/plugin) ile kurun veya yönetin.
- [Plugin oluşturma](/tr/plugins/building-plugins) ile yeni bir entegrasyon, sağlayıcı,
  kanal, araç veya kanca oluşturun.
- [Skills](/tr/tools/skills) ve [Skills oluşturma](/tr/tools/creating-skills) ile
  yeniden kullanılabilir aracı talimatları ekleyin veya ayarlayın.
- Uygulama sözleşmelerine ihtiyaç duyduğunuzda [Plugin SDK](/tr/plugins/sdk-overview) ve
  [Plugin bildirimi](/tr/plugins/manifest) sayfalarını kullanın.

## Eksik araçlarla ilgili sorunları giderin

Model bir aracı göremiyor veya çağıramıyorsa mevcut dönüş için geçerli
politikayla başlayın:

1. [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools) bölümündeki
   etkin profili, `tools.allow` ve `tools.deny` ayarlarını denetleyin.
2. [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools) bölümündeki
   sağlayıcıya özgü kısıtlamaları denetleyin ve seçilen
   [model sağlayıcısının](/tr/concepts/model-providers) araç
   şeklini desteklediğini doğrulayın.
3. [Korumalı alan ile araç politikası ile yükseltilmiş erişim karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
   ve [Yükseltilmiş exec](/tr/tools/elevated) ile kanal izinlerini, korumalı alan durumunu
   ve yükseltilmiş erişimi denetleyin.
4. Sahip Plugin'in [Plugin'ler](/tr/tools/plugin) bölümünde kurulmuş ve
   etkinleştirilmiş olup olmadığını denetleyin.
5. Devredilmiş çalıştırmalar için [Aracı başına korumalı alan ve araç kısıtlamaları](/tr/tools/multi-agent-sandbox-tools)
   bölümündeki aracı başına kısıtlamaları denetleyin.
6. Büyük OpenClaw katalogları için çalıştırmanın doğrudan araç sunumunu mu yoksa
   [Araç Arama](/tr/tools/tool-search) özelliğini mi kullandığını doğrulayın.

## İlgili

- Cron, görevler, Heartbeat, taahhütler, hook'lar, sürekli talimatlar ve TaskFlow için [Otomasyon](/tr/automation)
- Aracı modeli, oturumlar, bellek ve çok aracılı koordinasyon için [Aracılar](/tr/concepts/agent)
- Standart araç politikası başvurusu için [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools)
- Plugin kurulumu ve yönetimi için [Plugin'ler](/tr/tools/plugin)
- Plugin geliştiricisi başvurusu için [Plugin SDK](/tr/plugins/sdk-overview)
- Skills yükleme sırası, geçit oluşturma ve yapılandırma için [Skills](/tr/tools/skills)
- Oluşturulan ve incelenen Skills'lerin geliştirilmesi için [Skills Atölyesi](/tr/tools/skill-workshop)
- Kompakt OpenClaw araç kataloğunu keşfetmek için [Araç Arama](/tr/tools/tool-search)
