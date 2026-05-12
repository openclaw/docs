---
doc-schema-version: 1
read_when:
    - OpenClaw'ın hangi araçları sağladığını anlamak istiyorsunuz
    - Yerleşik araçlar, Skills ve Plugin'ler arasında karar veriyorsunuz
    - Araç politikası, otomasyon veya ajan koordinasyonu için doğru dokümantasyon giriş noktasına ihtiyacınız var
summary: 'OpenClaw araçları, Skills ve Plugin''lere genel bakış: ajanların neleri çağırabileceği ve bunların nasıl genişletileceği'
title: Genel Bakış
x-i18n:
    generated_at: "2026-05-12T01:00:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94424b04a520009d40d851e46f7ea0e4e914ff39b7d79958194bb123a6ec0b7b
    source_path: tools/index.md
    workflow: 16
---

Bu sayfayı doğru Capabilities yüzeyini seçmek için kullanın. **Tools** çağrılabilir
eylemlerdir, **skills** ajanlara nasıl çalışacaklarını öğretir ve **plugins** araçlar,
sağlayıcılar, kanallar, hook'lar ve paketlenmiş skills gibi çalışma zamanı
yetenekleri ekler.

Bu bir genel bakış ve yönlendirme sayfasıdır. Kapsamlı araç politikası,
varsayılanlar, grup üyeliği, sağlayıcı kısıtlamaları ve yapılandırma alanları
için [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools) sayfasını kullanın.

## Buradan başlayın

Çoğu ajan için yerleşik araç kategorileriyle başlayın, ardından politikayı
yalnızca ajanın daha az araç görmesi gerektiğinde veya açık host erişimine
ihtiyacı olduğunda ayarlayın.

| Şunu yapmanız gerekiyorsa...                         | Önce bunu kullanın                               | Ardından okuyun                                                         |
| ---------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| Bir ajanın mevcut yeteneklerle işlem yapmasını sağlamak | [Yerleşik araçlar](#built-in-tool-categories)    | [Araç kategorileri](#built-in-tool-categories)                          |
| Bir ajanın neyi çağırabileceğini kontrol etmek       | [Araç politikası](#configure-access-and-approvals) | [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools)                   |
| Bir ajana bir iş akışı öğretmek                      | [Skills](#choose-tools-skills-or-plugins)        | [Skills](/tr/tools/skills) ve [Skills oluşturma](/tr/tools/creating-skills)   |
| Yeni bir entegrasyon veya çalışma zamanı yüzeyi eklemek | [Plugins](#extend-capabilities)                  | [Plugins](/tr/tools/plugin) ve [Plugins oluşturma](/tr/plugins/building-plugins) |
| İşi daha sonra veya arka planda çalıştırmak          | [Otomasyon](/tr/automation)                         | [Otomasyona genel bakış](/tr/automation)                                   |
| Birden fazla ajanı veya harness'ı koordine etmek     | [Alt ajanlar](/tr/tools/subagents)                  | [ACP ajanları](/tr/tools/acp-agents) ve [Ajan gönderimi](/tr/tools/agent-send) |
| Büyük bir PI araç kataloğunda arama yapmak           | [Araç Arama](/tr/tools/tool-search)                 | [Araç Arama](/tr/tools/tool-search)                                        |

## Araçları, Skills'i veya plugins'i seçin

<Steps>
  <Step title="Ajanın işlem yapması gerektiğinde bir araç kullanın">
    Araç, ajanın çağırabileceği türlenmiş bir fonksiyondur; örneğin `exec`,
    `browser`, `web_search`, `message` veya `image_generate`. Ajanın veri
    okuması, dosyaları değiştirmesi, mesaj göndermesi, bir sağlayıcıyı çağırması
    veya başka bir sistemi işletmesi gerektiğinde araçları kullanın. Görünür
    araçlar modele yapılandırılmış fonksiyon tanımları olarak gönderilir.

    Model yalnızca etkin profil, izin ver/reddet politikası, sağlayıcı
    kısıtlamaları, sandbox durumu, kanal izinleri ve plugin kullanılabilirliği
    sonrasında kalan araçları görür.

  </Step>

  <Step title="Ajanın yönergelere ihtiyacı olduğunda bir skill kullanın">
    Skill, ajan istemine yüklenen bir `SKILL.md` yönerge paketidir. Ajan zaten
    ihtiyaç duyduğu araçlara sahipse ancak tekrarlanabilir bir iş akışına,
    inceleme rubriğine, komut dizisine veya çalışma kısıtına ihtiyaç duyuyorsa
    skill kullanın.

    Skills bir workspace'te, paylaşılan skill dizininde, yönetilen OpenClaw
    skill kökünde veya plugin paketinde bulunabilir.

    [Skills](/tr/tools/skills) | [Skills oluşturma](/tr/tools/creating-skills) | [Skills yapılandırması](/tr/tools/skills-config)

  </Step>

  <Step title="OpenClaw'ın yeni bir yeteneğe ihtiyacı olduğunda bir Plugin kullanın">
    Bir Plugin araçlar, Skills, kanallar, model sağlayıcıları, konuşma,
    realtime ses, medya üretimi, web araması, web getirme, hook'lar ve diğer
    çalışma zamanı yetenekleri ekleyebilir. Yeteneğin kodu, kimlik bilgileri,
    yaşam döngüsü hook'ları, manifest meta verileri veya kurulabilir paketi
    olduğunda Plugin kullanın. Mevcut plugins ClawHub, npm, git, yerel dizinler
    veya arşivlerden kurulabilir.

    [Plugins'i kurma ve yapılandırma](/tr/tools/plugin) | [Plugins oluşturma](/tr/plugins/building-plugins) | [Plugin SDK](/tr/plugins/sdk-overview)

  </Step>
</Steps>

## Yerleşik araç kategorileri

Tablo, yüzeyi tanıyabilmeniz için temsilî araçları listeler. Tam politika
başvurusu değildir. Kesin gruplar, varsayılanlar ve izin ver/reddet anlamları
için [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools) sayfasını kullanın.

| Kategori               | Ajanın şunu yapması gerektiğinde kullanın...                                  | Temsilî araçlar                                                       | Sonraki okuma                                                          |
| ---------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Çalışma zamanı         | Komut çalıştırmak, süreçleri yönetmek veya sağlayıcı destekli Python analizi kullanmak | `exec`, `process`, `code_execution`                                  | [Exec](/tr/tools/exec), [Kod yürütme](/tr/tools/code-execution)              |
| Dosyalar               | Workspace dosyalarını okumak ve değiştirmek                                   | `read`, `write`, `edit`, `apply_patch`                               | [Yama uygula](/tr/tools/apply-patch)                                      |
| Web                    | Web'de arama yapmak, X gönderilerinde arama yapmak veya okunabilir sayfa içeriği getirmek | `web_search`, `x_search`, `web_fetch`                                | [Web araçları](/tr/tools/web), [Web getirme](/tr/tools/web-fetch)            |
| Tarayıcı               | Bir tarayıcı oturumunu işletmek                                               | `browser`                                                            | [Tarayıcı](/tr/tools/browser)                                             |
| Mesajlaşma ve kanallar | Yanıtlar veya kanal eylemleri göndermek                                       | `message`                                                            | [Ajan gönderimi](/tr/tools/agent-send)                                    |
| Oturumlar ve ajanlar   | Oturumları incelemek, işi devretmek, başka bir çalışmayı yönlendirmek veya durum bildirmek | `sessions_*`, `subagents`, `agents_list`, `session_status`           | [Alt ajanlar](/tr/tools/subagents), [Oturum aracı](/tr/concepts/session-tool) |
| Otomasyon              | İş zamanlamak veya arka plan olaylarına yanıt vermek                          | `cron`, `heartbeat_respond`                                          | [Otomasyon](/tr/automation)                                               |
| Gateway ve düğümler    | Gateway durumunu veya eşleştirilmiş hedef cihazları incelemek                 | `gateway`, `nodes`                                                   | [Gateway yapılandırması](/tr/gateway/configuration), [Düğümler](/tr/nodes)   |
| Medya                  | Medyayı analiz etmek, üretmek veya seslendirmek                               | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [Medyaya genel bakış](/tr/tools/media-overview)                           |
| Büyük PI katalogları   | Her şemayı modele göndermeden çok sayıda uygun aracı aramak ve çağırmak       | `tool_search_code`, `tool_search`, `tool_describe`                   | [Araç Arama](/tr/tools/tool-search)                                       |

<Note>
Araç Arama deneysel bir PI ajan yüzeyidir. Codex harness çalışmaları
`tools.toolSearch` yerine Codex yerel kod modunu, yerel araç aramayı,
ertelenmiş dinamik araçları ve iç içe araç çağrılarını kullanır.
</Note>

## Plugin tarafından sağlanan araçlar

Plugins ek araçlar kaydedebilir. Plugin yazarları araçları
`api.registerTool(...)` ve manifest'in `contracts.tools` alanı üzerinden bağlar;
sözleşme ayrıntıları için [Plugin SDK](/tr/plugins/sdk-overview) ve
[Plugin manifesti](/tr/plugins/manifest) sayfalarını kullanın.

Yaygın Plugin tarafından sağlanan araçlar şunları içerir:

- Dosya ve markdown farklarını işlemek için [Farklar](/tr/tools/diffs)
- Yalnızca JSON iş akışı adımları için [LLM Görevi](/tr/tools/llm-task)
- Sürdürülebilir onaylarla türlenmiş iş akışları için [Lobster](/tr/tools/lobster)
- Gürültülü `exec` ve `bash` aracı çıktısını sıkıştırmak için
  [Tokenjuice](/tr/tools/tokenjuice)
- Her şemayı isteme koymadan büyük araç kataloglarını keşfetmek ve çağırmak için
  [Araç Arama](/tr/tools/tool-search)
- Düğüm Canvas kontrolü ve A2UI işleme için [Canvas](/tr/plugins/reference/canvas)

## Erişimi ve onayları yapılandırın

Araç politikası model çağrısından önce uygulanır. Politika bir aracı kaldırırsa
model o turun için o aracın şemasını almaz. Bir çalışma, genel yapılandırma,
ajan başına yapılandırma, kanal politikası, sağlayıcı kısıtlamaları, sandbox
kuralları, yalnızca sahip geçidi veya plugin kullanılabilirliği nedeniyle
araçları kaybedebilir.

- [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools) araç profillerini,
  izin ver/reddet listelerini, sağlayıcıya özgü kısıtlamaları, döngü algılamayı
  ve sağlayıcı destekli araç ayarlarını belgeler.
- [Exec onayları](/tr/tools/exec-approvals) host komutu onay politikasını belgeler.
- [Yükseltilmiş exec](/tr/tools/elevated) sandbox dışındaki kontrollü yürütmeyi belgeler.
- [Sandbox ve araç politikası ve yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) hangi katmanın dosya ve süreç erişimini kontrol ettiğini açıklar.
- [Ajan başına sandbox ve araç kısıtlamaları](/tr/tools/multi-agent-sandbox-tools)
  devredilen çalışmalar için ajana özgü kısıtlamaları belgeler.

## Yetenekleri genişletin

OpenClaw'ın yapmasını istediğiniz işe göre genişletme yolunu seçin:

- Mevcut bir Plugin'i [Plugins](/tr/tools/plugin) ile kurun veya yönetin.
- Yeni bir entegrasyonu, sağlayıcıyı, kanalı, aracı veya hook'u
  [Plugins oluşturma](/tr/plugins/building-plugins) ile oluşturun.
- Yeniden kullanılabilir ajan yönergelerini [Skills](/tr/tools/skills) ve
  [Skills oluşturma](/tr/tools/creating-skills) ile ekleyin veya ayarlayın.
- İş akışı plugin dağıtımlı bir skill paketine ait olduğunda yeniden
  kullanılabilir iş akışı materyalini [Skill atölyesi](/tr/plugins/skill-workshop)
  ile paketleyin.
- Uygulama sözleşmelerine ihtiyacınız olduğunda [Plugin SDK](/tr/plugins/sdk-overview)
  ve [Plugin manifesti](/tr/plugins/manifest) sayfalarını kullanın.

## Eksik araçlarda sorun giderme

Model bir aracı göremiyor veya çağıramıyorsa, geçerli tur için etkin politikayla
başlayın:

1. [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools) içindeki etkin profili,
   `tools.allow` ve `tools.deny` ayarlarını kontrol edin.
2. [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools) içindeki sağlayıcıya
   özgü kısıtlamaları kontrol edin ve seçili
   [model sağlayıcısının](/tr/concepts/model-providers) araç şeklini desteklediğini
   doğrulayın.
3. [Sandbox ve araç politikası ve yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) ve [Yükseltilmiş exec](/tr/tools/elevated) ile kanal izinlerini, sandbox durumunu ve yükseltilmiş erişimi kontrol edin.
4. Sahip olan Plugin'in [Plugins](/tr/tools/plugin) içinde kurulu ve etkin olup
   olmadığını kontrol edin.
5. Devredilen çalışmalar için [Ajan başına sandbox ve araç kısıtlamaları](/tr/tools/multi-agent-sandbox-tools)
   içindeki ajan başına kısıtlamaları kontrol edin.
6. Büyük PI katalogları için çalışmanın doğrudan araç gösterimini mi yoksa
   [Araç Arama](/tr/tools/tool-search) mı kullandığını doğrulayın.

## İlgili

- Cron, görevler, Heartbeat, taahhütler, hook'lar, kalıcı emirler ve Task Flow için [Otomasyon](/tr/automation)
- Ajan modeli, oturumlar, bellek ve çok ajanlı koordinasyon için [Ajanlar](/tr/concepts/agent)
- Kanonik araç politikası başvurusu için [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools)
- Plugin kurulumu ve yönetimi için [Plugins](/tr/tools/plugin)
- Plugin yazarı başvurusu için [Plugin SDK](/tr/plugins/sdk-overview)
- Skill yükleme sırası, geçitleri ve yapılandırması için [Skills](/tr/tools/skills)
- Kompakt PI araç kataloğu keşfi için [Araç Arama](/tr/tools/tool-search)
