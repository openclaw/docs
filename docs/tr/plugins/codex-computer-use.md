---
read_when:
    - Codex modundaki OpenClaw ajanlarının Codex Computer Use kullanmasını istiyorsunuz
    - Codex Computer Use, PeekabooBridge ve doğrudan cua-driver MCP arasında karar veriyorsunuz
    - Codex Computer Use ile doğrudan bir cua-driver MCP kurulumu arasında karar veriyorsunuz
    - Birlikte gelen Codex Plugin için computerUse yapılandırıyorsunuz
    - /codex computer-use durumu veya kurulumu için sorun gideriyorsunuz
summary: Codex modundaki OpenClaw aracıları için Codex Computer Use'ı ayarlayın
title: Codex Bilgisayar Kullanımı
x-i18n:
    generated_at: "2026-05-03T08:58:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use, yerel masaüstü denetimi için Codex'e yerel bir MCP Plugin'idir. OpenClaw
masaüstü uygulamasını vendörlemez, masaüstü eylemlerini kendisi yürütmez veya
Codex izinlerini atlatmaz. Birlikte gelen `codex` Plugin'i yalnızca Codex uygulama sunucusunu hazırlar:
Codex Plugin desteğini etkinleştirir, yapılandırılan Codex
Computer Use Plugin'ini bulur veya yükler, `computer-use` MCP sunucusunun kullanılabilir olduğunu denetler ve
ardından Codex modu dönüşlerinde yerel MCP araç çağrılarının sahipliğini Codex'e bırakır.

OpenClaw zaten yerel Codex yürütme ortamını kullanıyorsa bu sayfayı kullanın. Çalışma zamanı
kurulumunun kendisi için [Codex yürütme ortamı](/tr/plugins/codex-harness) bölümüne bakın.

## OpenClaw.app ve Peekaboo

OpenClaw.app'in Peekaboo entegrasyonu Codex Computer Use'dan ayrıdır. macOS uygulaması,
`peekaboo` CLI'nin Peekaboo'nun kendi otomasyon araçları için uygulamanın yerel
Erişilebilirlik ve Ekran Kaydı izinlerini yeniden kullanabilmesi amacıyla bir PeekabooBridge soketi barındırabilir.
Bu köprü Codex Computer Use'u yüklemez veya aracı olarak çalışmaz ve
Codex Computer Use, PeekabooBridge soketi üzerinden çağrı yapmaz.

OpenClaw.app'in Peekaboo CLI otomasyonu için izinlerden haberdar bir ana makine olmasını istediğinizde
[Peekaboo köprüsü](/tr/platforms/mac/peekaboo) bölümünü kullanın. Bir
Codex modu OpenClaw agent'ının, dönüş başlamadan önce Codex'in yerel `computer-use` MCP Plugin'ine
sahip olması gerektiğinde bu sayfayı kullanın.

## iOS uygulaması

iOS uygulaması Codex Computer Use'dan ayrıdır. Codex `computer-use` MCP sunucusunu yüklemez veya
aracı olarak çalışmaz ve bir masaüstü denetimi arka ucu değildir.
Bunun yerine iOS uygulaması bir OpenClaw düğümü olarak bağlanır ve mobil
yetenekleri `canvas.*`, `camera.*`, `screen.*`,
`location.*` ve `talk.*` gibi düğüm komutları üzerinden sunar.

Bir agent'ın Gateway üzerinden bir iPhone düğümünü yönetmesini istediğinizde
[iOS](/tr/platforms/ios) bölümünü kullanın. Bir Codex modu agent'ın yerel
macOS masaüstünü Codex'in yerel Computer Use Plugin'i üzerinden denetlemesi gerektiğinde bu sayfayı kullanın.

## Doğrudan cua-driver MCP

Codex Computer Use, masaüstü denetimini sunmanın tek yolu değildir. OpenClaw tarafından yönetilen
çalışma zamanlarının TryCua'nın sürücüsünü doğrudan çağırmasını istiyorsanız,
Codex'e özgü marketplace akışı yerine OpenClaw'ın MCP kayıt defteri üzerinden upstream
`cua-driver mcp` sunucusunu kullanın.

`cua-driver` yüklendikten sonra OpenClaw komutunu ondan isteyin:

```bash
cua-driver mcp-config --client openclaw
```

veya stdio sunucusunu kendiniz kaydedin:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Bu yol, sürücü şemaları ve yapılandırılmış MCP yanıtları dahil olmak üzere upstream MCP araç
yüzeyini bozulmadan korur. CUA sürücüsünün normal bir OpenClaw MCP sunucusu
olarak kullanılabilir olmasını istediğinizde bunu kullanın. Codex uygulama sunucusunun Plugin yüklemesini,
MCP yeniden yüklemelerini ve Codex modu dönüşlerinde yerel araç çağrılarını üstlenmesi gerektiğinde
bu sayfadaki Codex Computer Use kurulumunu kullanın.

CUA'nın sürücüsü macOS'e özeldir ve yine de uygulamasının istediği Erişilebilirlik ve Ekran Kaydı gibi
yerel macOS izinlerini gerektirir. OpenClaw
`cua-driver` yüklemez, bu izinleri vermez veya upstream
sürücünün güvenlik modelini atlatmaz.

## Hızlı kurulum

Codex modu dönüşlerinde bir iş parçacığı başlamadan önce Computer Use'un kullanılabilir olması gerektiğinde
`plugins.entries.codex.config.computerUse` değerini ayarlayın:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Bu yapılandırmayla OpenClaw, her Codex modu dönüşünden önce Codex uygulama sunucusunu denetler.
Computer Use eksikse ancak Codex uygulama sunucusu yüklenebilir bir
marketplace'i zaten keşfetmişse, OpenClaw Codex uygulama sunucusundan
Plugin'i yüklemesini veya yeniden etkinleştirmesini ve MCP sunucularını yeniden yüklemesini ister. macOS'te,
eşleşen hiçbir marketplace kayıtlı değilse ve standart Codex uygulama paketi varsa, OpenClaw
başarısız olmadan önce birlikte gelen Codex marketplace'ini
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` konumundan kaydetmeyi de dener.
Kurulum MCP sunucusunu yine de kullanılabilir hale getiremezse, dönüş iş parçacığı başlamadan önce
başarısız olur.

Mevcut oturumlar çalışma zamanı ve Codex iş parçacığı bağlamalarını korur. `agentRuntime`
veya Computer Use yapılandırmasını değiştirdikten sonra test etmeden önce etkilenen
sohbette `/new` veya `/reset` kullanın.

## Komutlar

`codex` Plugin komut yüzeyinin kullanılabildiği herhangi bir sohbet yüzeyinden
`/codex computer-use` komutlarını kullanın. Bunlar OpenClaw sohbet/çalışma zamanı komutlarıdır,
`openclaw codex ...` CLI alt komutları değildir:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` salt okunurdur. Marketplace kaynakları eklemez, Plugin yüklemez veya
Codex Plugin desteğini etkinleştirmez.

`install`, Codex uygulama sunucusu Plugin desteğini etkinleştirir, isteğe bağlı olarak yapılandırılmış
bir marketplace kaynağı ekler, yapılandırılan Plugin'i Codex uygulama sunucusu üzerinden
yükler veya yeniden etkinleştirir, MCP sunucularını yeniden yükler ve MCP sunucusunun araçlar sunduğunu doğrular.

## Marketplace seçenekleri

OpenClaw, Codex'in kendisinin sunduğu aynı uygulama sunucusu API'sini kullanır.
Marketplace alanları, Codex'in `computer-use` öğesini nerede bulacağını seçer.

| Alan                 | Şu durumda kullanın                                           | Yükleme desteği                                                |
| -------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| Marketplace alanı yok | Codex uygulama sunucusunun zaten bildiği marketplace'leri kullanmasını istiyorsunuz. | Evet, uygulama sunucusu yerel bir marketplace döndürdüğünde. |
| `marketplaceSource`  | Uygulama sunucusunun ekleyebileceği bir Codex marketplace kaynağınız var. | Evet, açık `/codex computer-use install` için. |
| `marketplacePath`    | Ana makinedeki yerel marketplace dosya yolunu zaten biliyorsunuz. | Evet, açık yükleme ve dönüş başlangıcı otomatik yükleme için. |
| `marketplaceName`    | Zaten kayıtlı bir marketplace'i ada göre seçmek istiyorsunuz. | Yalnızca seçilen marketplace'in yerel bir yolu olduğunda evet. |

Yeni Codex ana dizinlerinin resmi marketplace'lerini başlatmak için kısa bir süre gerekebilir.
Yükleme sırasında OpenClaw, `plugin/list` için en fazla
`marketplaceDiscoveryTimeoutMs` milisaniye boyunca yoklama yapar. Varsayılan değer 60 saniyedir.

Birden fazla bilinen marketplace Computer Use içeriyorsa, OpenClaw sırasıyla
`openai-bundled`, ardından `openai-curated`, ardından `local` öğesini tercih eder. Bilinmeyen belirsiz
eşleşmeler güvenli şekilde başarısız olur ve `marketplaceName` veya `marketplacePath` ayarlamanızı ister.

## Birlikte gelen macOS marketplace'i

Güncel Codex masaüstü derlemeleri Computer Use'u burada paketler:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

`computerUse.autoInstall` true olduğunda ve `computer-use` içeren hiçbir marketplace
kayıtlı değilse, OpenClaw standart birlikte gelen marketplace kökünü otomatik olarak eklemeyi dener:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Bunu Codex ile bir kabuktan açıkça da kaydedebilirsiniz:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Standart olmayan bir Codex uygulama yolu kullanıyorsanız, `computerUse.marketplacePath` değerini
yerel bir marketplace dosya yoluna ayarlayın veya bir kez `/codex computer-use install --source
<marketplace-source>` çalıştırın.

## Uzak katalog sınırı

Codex uygulama sunucusu yalnızca uzak katalog girdilerini listeleyebilir ve okuyabilir, ancak şu anda
uzak `plugin/install` desteklemez. Bu, `marketplaceName` değerinin
durum denetimleri için yalnızca uzak bir marketplace seçebileceği, ancak yüklemeler ve yeniden etkinleştirmeler için
yine de `marketplaceSource` veya `marketplacePath` üzerinden yerel bir marketplace gerektiği anlamına gelir.

Durum, Plugin'in uzak bir Codex marketplace'inde kullanılabilir olduğunu ancak uzak yüklemenin
desteklenmediğini söylüyorsa, yüklemeyi yerel bir kaynak veya yolla çalıştırın:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Yapılandırma başvurusu

| Alan                            | Varsayılan     | Anlamı                                                                         |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | çıkarılır      | Computer Use'u zorunlu kılar. Başka bir Computer Use alanı ayarlandığında varsayılan olarak true olur. |
| `autoInstall`                   | false          | Dönüş başlangıcında zaten keşfedilmiş marketplace'lerden yükler veya yeniden etkinleştirir. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Yüklemenin Codex uygulama sunucusu marketplace keşfi için ne kadar bekleyeceği. |
| `marketplaceSource`             | ayarlanmamış   | Codex uygulama sunucusu `marketplace/add` öğesine geçirilen kaynak dizesi.      |
| `marketplacePath`               | ayarlanmamış   | Plugin'i içeren yerel Codex marketplace dosya yolu.                            |
| `marketplaceName`               | ayarlanmamış   | Seçilecek kayıtlı Codex marketplace adı.                                       |
| `pluginName`                    | `computer-use` | Codex marketplace Plugin adı.                                                  |
| `mcpServerName`                 | `computer-use` | Yüklü Plugin tarafından sunulan MCP sunucu adı.                                |

Dönüş başlangıcı otomatik yüklemesi, yapılandırılmış `marketplaceSource`
değerlerini bilerek reddeder. Yeni bir kaynak eklemek açık bir kurulum işlemidir, bu nedenle bir kez
`/codex computer-use install --source <marketplace-source>` kullanın, ardından gelecekteki yeniden etkinleştirmeleri
keşfedilmiş yerel marketplace'lerden `autoInstall` işlemesine izin verin.
Dönüş başlangıcı otomatik yüklemesi yapılandırılmış bir `marketplacePath` kullanabilir, çünkü bu zaten
ana makinede yerel bir yoldur.

## OpenClaw neyi denetler

OpenClaw, içeride kararlı bir kurulum nedeni raporlar ve kullanıcıya gösterilen
durumu sohbet için biçimlendirir:

| Neden                        | Anlamı                                                 | Sonraki adım                                  |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` false olarak çözümlendi.         | `enabled` veya başka bir Computer Use alanı ayarlayın. |
| `marketplace_missing`        | Eşleşen marketplace yoktu.                             | Kaynak, yol veya marketplace adı yapılandırın. |
| `plugin_not_installed`       | Marketplace var, ancak Plugin yüklü değil.             | Yüklemeyi çalıştırın veya `autoInstall` etkinleştirin. |
| `plugin_disabled`            | Plugin yüklü ancak Codex yapılandırmasında devre dışı. | Yeniden etkinleştirmek için yüklemeyi çalıştırın. |
| `remote_install_unsupported` | Seçilen marketplace yalnızca uzak.                     | `marketplaceSource` veya `marketplacePath` kullanın. |
| `mcp_missing`                | Plugin etkin, ancak MCP sunucusu kullanılamıyor.       | Codex Computer Use ve OS izinlerini denetleyin. |
| `ready`                      | Plugin ve MCP araçları kullanılabilir.                 | Codex modu dönüşünü başlatın.                 |
| `check_failed`               | Durum denetimi sırasında bir Codex uygulama sunucusu isteği başarısız oldu. | Uygulama sunucusu bağlantısını ve günlükleri denetleyin. |
| `auto_install_blocked`       | Dönüş başlangıcı kurulumu yeni bir kaynak eklemeyi gerektirirdi. | Önce açık yüklemeyi çalıştırın. |

Sohbet çıktısı, Plugin durumunu, MCP sunucusu durumunu, marketplace'i, varsa araçları
ve başarısız kurulum adımı için belirli iletiyi içerir.

## macOS izinleri

Computer Use macOS'e özeldir. Codex'in sahip olduğu MCP sunucusu, uygulamaları
inceleyebilmeden veya denetleyebilmeden önce yerel OS izinlerine ihtiyaç duyabilir. OpenClaw, Computer Use'un
yüklü olduğunu ancak MCP sunucusunun kullanılamadığını söylüyorsa, önce Codex tarafındaki Computer
Use kurulumunu doğrulayın:

- Codex app-server, masaüstü denetiminin gerçekleşmesi gereken aynı ana makinede
  çalışıyor.
- Computer Use Plugin'i Codex yapılandırmasında etkin.
- `computer-use` MCP sunucusu Codex app-server MCP durumunda görünüyor.
- macOS, masaüstü denetim uygulaması için gerekli izinleri vermiş.
- Geçerli ana makine oturumu, denetlenen masaüstüne erişebiliyor.

OpenClaw, `computerUse.enabled` true olduğunda bilinçli olarak kapalı durumda
başarısız olur. Codex modundaki bir tur, yapılandırmanın gerektirdiği yerel
masaüstü araçları olmadan sessizce devam etmemelidir.

## Sorun Giderme

**Durum yüklü değil diyor.** `/codex computer-use install` çalıştırın. Eğer
marketplace bulunmazsa `--source` veya `--marketplace-path` iletin.

**Durum yüklü ama devre dışı diyor.** `/codex computer-use install` komutunu
yeniden çalıştırın. Codex app-server kurulumu, Plugin yapılandırmasını yeniden
etkin olarak yazar.

**Durum uzak kurulum desteklenmiyor diyor.** Yerel bir marketplace kaynağı veya
yolu kullanın. Yalnızca uzak katalog girdileri incelenebilir, ancak geçerli
app-server API'si üzerinden kurulamaz.

**Durum MCP sunucusu kullanılamıyor diyor.** MCP sunucularının yeniden
yüklenmesi için kurulumu bir kez daha çalıştırın. Kullanılamaz kalırsa Codex
Computer Use uygulamasını, Codex app-server MCP durumunu veya macOS izinlerini
düzeltin.

**Durum veya bir yoklama `computer-use.list_apps` üzerinde zaman aşımına uğruyor.** Plugin ve MCP
sunucusu mevcut, ancak yerel Computer Use köprüsü yanıt vermedi. Codex Computer
Use'tan çıkın veya yeniden başlatın, gerekirse Codex Desktop'ı yeniden başlatın,
ardından yeni bir OpenClaw oturumunda tekrar deneyin.

**Bir Computer Use aracı `Native hook relay unavailable` diyor.** Codex yerel
araç hook'u, yerel köprü veya Gateway yedeği üzerinden etkin bir OpenClaw
aktarısına ulaşamadı. `/new` veya `/reset` ile yeni bir OpenClaw oturumu
başlatın. Bu devam ederse, eski app-server iş parçacıklarının ve hook
kayıtlarının bırakılması için gateway'i yeniden başlatın, ardından tekrar
deneyin.

**Tur başlangıcındaki otomatik kurulum bir kaynağı reddediyor.** Bu bilinçlidir.
Önce kaynağı açıkça `/codex computer-use install --source <marketplace-source>`
ile ekleyin; ardından gelecekteki tur başlangıcı otomatik kurulumu keşfedilen
yerel marketplace'i kullanabilir.
