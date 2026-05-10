---
read_when:
    - Codex modundaki OpenClaw ajanlarının Codex Computer Use kullanmasını istiyorsunuz
    - Codex Computer Use, PeekabooBridge ve doğrudan cua-driver MCP arasında seçim yapıyorsunuz
    - Codex Computer Use ile doğrudan bir cua-driver MCP kurulumu arasında karar veriyorsunuz
    - Paketle birlikte gelen Codex Plugin için computerUse yapılandırıyorsunuz
    - /codex computer-use durumu veya kurulumu ile ilgili sorunları gideriyorsunuz
summary: Codex modu OpenClaw aracıları için Codex Computer Use’u ayarlayın
title: Codex Bilgisayar Kullanımı
x-i18n:
    generated_at: "2026-05-10T19:44:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e1637ad13a96324aebbf97fb179b8c846b27541e917fd56e586c75e79eea7bb
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use, yerel masaüstü denetimi için Codex'e özgü bir MCP Plugin’idir. OpenClaw
masaüstü uygulamasını vendoring yapmaz, masaüstü eylemlerini kendisi yürütmez
veya Codex izinlerini aşmaz. Birlikte gelen `codex` Plugin’i yalnızca Codex app-server’ı hazırlar:
Codex Plugin desteğini etkinleştirir, yapılandırılmış Codex
Computer Use Plugin’ini bulur veya kurar, `computer-use` MCP sunucusunun kullanılabilir olduğunu denetler ve
ardından Codex modlu turlarda yerel MCP araç çağrılarını Codex’in yönetmesine izin verir.

Bu sayfayı OpenClaw zaten yerel Codex harness’ını kullanıyorken kullanın. Çalışma zamanı
kurulumu için [Codex harness](/tr/plugins/codex-harness) bölümüne bakın.

## OpenClaw.app ve Peekaboo

OpenClaw.app’in Peekaboo entegrasyonu Codex Computer Use’dan ayrıdır. macOS
uygulaması, `peekaboo` CLI’nin Peekaboo’nun kendi otomasyon araçları için
uygulamanın yerel Erişilebilirlik ve Ekran Kaydı izinlerini yeniden kullanabilmesi amacıyla bir PeekabooBridge soketi barındırabilir.
Bu köprü Codex Computer Use’u kurmaz veya proxy’lemez ve
Codex Computer Use, PeekabooBridge soketi üzerinden çağrı yapmaz.

OpenClaw.app’in Peekaboo CLI otomasyonu için izinlerin farkında olan
bir ana makine olmasını istediğinizde [Peekaboo köprüsü](/tr/platforms/mac/peekaboo) bölümünü kullanın. Bir
Codex modlu OpenClaw ajanının, tur başlamadan önce Codex’in yerel `computer-use` MCP Plugin’ine
sahip olması gerektiğinde bu sayfayı kullanın.

## iOS uygulaması

iOS uygulaması Codex Computer Use’dan ayrıdır. Codex `computer-use` MCP sunucusunu
kurmaz veya proxy’lemez ve bir masaüstü denetim arka ucu değildir.
Bunun yerine iOS uygulaması bir OpenClaw düğümü olarak bağlanır ve mobil
yetenekleri `canvas.*`, `camera.*`, `screen.*`,
`location.*` ve `talk.*` gibi düğüm komutları üzerinden sunar.

Bir ajanın Gateway üzerinden bir iPhone düğümünü yönetmesini istediğinizde
[iOS](/tr/platforms/ios) bölümünü kullanın. Codex modlu bir ajanın yerel
macOS masaüstünü Codex’in yerel Computer Use Plugin’i üzerinden denetlemesi gerektiğinde bu sayfayı kullanın.

## Doğrudan cua-driver MCP

Codex Computer Use, masaüstü denetimini sunmanın tek yolu değildir. OpenClaw tarafından
yönetilen çalışma zamanlarının TryCua’nın sürücüsünü doğrudan çağırmasını istiyorsanız,
Codex’e özgü marketplace akışı yerine OpenClaw’ın MCP kayıt defteri üzerinden upstream
`cua-driver mcp` sunucusunu kullanın.

`cua-driver` kurulduktan sonra ondan OpenClaw komutunu isteyin:

```bash
cua-driver mcp-config --client openclaw
```

veya stdio sunucusunu kendiniz kaydedin:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Bu yol, sürücü şemaları ve yapılandırılmış MCP yanıtları dahil olmak üzere upstream
MCP araç yüzeyini olduğu gibi korur. CUA sürücüsünün normal bir OpenClaw MCP sunucusu
olarak kullanılabilir olmasını istediğinizde bunu kullanın. Codex app-server’ın Plugin kurulumu,
MCP yeniden yüklemeleri ve Codex modlu turlar içindeki yerel araç çağrılarını yönetmesi
gerektiğinde bu sayfadaki Codex Computer Use kurulumunu kullanın.

CUA’nın sürücüsü macOS’e özeldir ve yine de uygulamasının istediği Erişilebilirlik
ve Ekran Kaydı gibi yerel macOS izinlerini gerektirir. OpenClaw
`cua-driver` kurmaz, bu izinleri vermez veya upstream sürücünün güvenlik modelini aşmaz.

## Hızlı kurulum

Codex modlu turlarda, bir iş parçacığı başlamadan önce Computer Use’un kullanılabilir olması gerektiğinde
`plugins.entries.codex.config.computerUse` ayarını belirleyin:

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
    },
  },
}
```

Bu yapılandırmayla OpenClaw, her Codex modlu turdan önce Codex app-server’ı denetler.
Computer Use eksikse ancak Codex app-server kurulabilir bir marketplace’i zaten keşfetmişse,
OpenClaw Codex app-server’dan Plugin’i kurmasını veya yeniden etkinleştirmesini ve MCP sunucularını
yeniden yüklemesini ister. macOS’te, eşleşen bir marketplace kayıtlı değilse
ve standart Codex uygulama paketi varsa, OpenClaw başarısız olmadan önce
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` içinden
birlikte gelen Codex marketplace’ini de kaydetmeyi dener. Kurulum MCP sunucusunu hâlâ kullanılabilir
hale getiremiyorsa, tur iş parçacığı başlamadan önce başarısız olur.

Computer Use yapılandırmasını değiştirdikten sonra, mevcut bir Codex iş parçacığı zaten başladıysa
test etmeden önce etkilenen sohbette `/new` veya `/reset` kullanın.

## Komutlar

`codex` Plugin komut yüzeyinin kullanılabilir olduğu herhangi bir sohbet yüzeyinden
`/codex computer-use` komutlarını kullanın. Bunlar OpenClaw sohbet/çalışma zamanı komutlarıdır,
`openclaw codex ...` CLI alt komutları değildir:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` salt okunurdur. Marketplace kaynakları eklemez, Plugin kurmaz veya
Codex Plugin desteğini etkinleştirmez.

`install`, Codex app-server Plugin desteğini etkinleştirir, isteğe bağlı olarak yapılandırılmış
bir marketplace kaynağı ekler, yapılandırılmış Plugin’i Codex app-server üzerinden kurar
veya yeniden etkinleştirir, MCP sunucularını yeniden yükler ve MCP sunucusunun araçlar sunduğunu doğrular.

## Marketplace seçenekleri

OpenClaw, Codex’in kendi sunduğu aynı app-server API’sini kullanır. Marketplace
alanları, Codex’in `computer-use` öğesini nerede bulacağını seçer.

| Alan                 | Ne zaman kullanılır                                             | Kurulum desteği                                         |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| Marketplace alanı yok | Codex app-server’ın zaten bildiği marketplace’leri kullanmasını istersiniz. | Evet, app-server yerel bir marketplace döndürdüğünde. |
| `marketplaceSource`  | Codex app-server’ın ekleyebileceği bir Codex marketplace kaynağınız vardır. | Evet, açık `/codex computer-use install` için.         |
| `marketplacePath`    | Ana makinedeki yerel marketplace dosya yolunu zaten biliyorsunuzdur. | Evet, açık kurulum ve tur başlangıcında otomatik kurulum için. |
| `marketplaceName`    | Zaten kayıtlı bir marketplace’i adına göre seçmek istersiniz.  | Yalnızca seçilen marketplace’in yerel yolu varsa evet. |

Yeni Codex ana dizinlerinin resmi marketplace’lerini oluşturması için kısa bir süre gerekebilir.
Kurulum sırasında OpenClaw, `marketplaceDiscoveryTimeoutMs` milisaniyeye kadar
`plugin/list` üzerinde yoklama yapar. Varsayılan değer 60 saniyedir.

Birden fazla bilinen marketplace Computer Use içeriyorsa OpenClaw önce
`openai-bundled`, sonra `openai-curated`, sonra `local` öğesini tercih eder. Bilinmeyen belirsiz
eşleşmeler kapalı biçimde başarısız olur ve sizden `marketplaceName` veya `marketplacePath` ayarlamanızı ister.

## Birlikte gelen macOS marketplace’i

Güncel Codex masaüstü derlemeleri Computer Use’u burada birlikte getirir:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

`computerUse.autoInstall` true olduğunda ve `computer-use` içeren hiçbir marketplace
kayıtlı değilse OpenClaw, standart birlikte gelen marketplace kökünü otomatik olarak eklemeyi dener:

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

Codex app-server yalnızca uzak katalog girdilerini listeleyebilir ve okuyabilir, ancak şu anda
uzak `plugin/install` desteklemez. Bu, `marketplaceName` alanının durum denetimleri için
yalnızca uzak bir marketplace seçebileceği, ancak kurulumların ve yeniden etkinleştirmelerin
yine de `marketplaceSource` veya `marketplacePath` üzerinden yerel bir marketplace gerektirdiği anlamına gelir.

Durum, Plugin’in uzak bir Codex marketplace’inde kullanılabilir olduğunu ancak uzak kurulumun
desteklenmediğini söylüyorsa, kurulumu yerel bir kaynak veya yol ile çalıştırın:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Yapılandırma başvurusu

| Alan                            | Varsayılan      | Anlam                                                                          |
| ------------------------------- | --------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred        | Computer Use’u zorunlu kılar. Başka bir Computer Use alanı ayarlandığında varsayılan olarak true olur. |
| `autoInstall`                   | false           | Tur başlangıcında zaten keşfedilmiş marketplace’lerden kurar veya yeniden etkinleştirir. |
| `marketplaceDiscoveryTimeoutMs` | 60000           | Kurulumun Codex app-server marketplace keşfini ne kadar bekleyeceği.           |
| `marketplaceSource`             | unset           | Codex app-server `marketplace/add` öğesine geçirilen kaynak dizesi.            |
| `marketplacePath`               | unset           | Plugin’i içeren yerel Codex marketplace dosya yolu.                            |
| `marketplaceName`               | unset           | Seçilecek kayıtlı Codex marketplace adı.                                       |
| `pluginName`                    | `computer-use`  | Codex marketplace Plugin adı.                                                  |
| `mcpServerName`                 | `computer-use`  | Kurulu Plugin tarafından sunulan MCP sunucusu adı.                             |

Tur başlangıcında otomatik kurulum, yapılandırılmış `marketplaceSource` değerlerini bilerek reddeder.
Yeni bir kaynak eklemek açık bir kurulum işlemidir, bu nedenle bir kez
`/codex computer-use install --source <marketplace-source>` kullanın, ardından keşfedilmiş yerel
marketplace’lerden gelecekteki yeniden etkinleştirmeleri `autoInstall` öğesinin yönetmesine izin verin.
Tur başlangıcında otomatik kurulum yapılandırılmış bir `marketplacePath` kullanabilir, çünkü bu
zaten ana makinedeki yerel bir yoldur.

## OpenClaw’ın denetledikleri

OpenClaw dahili olarak kararlı bir kurulum nedeni bildirir ve kullanıcıya dönük
durumu sohbet için biçimlendirir:

| Neden                        | Anlam                                                  | Sonraki adım                                  |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` false olarak çözümlendi.         | `enabled` veya başka bir Computer Use alanı ayarlayın. |
| `marketplace_missing`        | Eşleşen marketplace yoktu.                             | Kaynak, yol veya marketplace adı yapılandırın. |
| `plugin_not_installed`       | Marketplace var, ancak Plugin kurulu değil.            | Kurulumu çalıştırın veya `autoInstall` etkinleştirin. |
| `plugin_disabled`            | Plugin kurulu ancak Codex yapılandırmasında devre dışı. | Yeniden etkinleştirmek için kurulumu çalıştırın. |
| `remote_install_unsupported` | Seçilen marketplace yalnızca uzaktır.                  | `marketplaceSource` veya `marketplacePath` kullanın. |
| `mcp_missing`                | Plugin etkin, ancak MCP sunucusu kullanılamıyor.       | Codex Computer Use ve işletim sistemi izinlerini denetleyin. |
| `ready`                      | Plugin ve MCP araçları kullanılabilir.                 | Codex modlu turu başlatın.                    |
| `check_failed`               | Durum denetimi sırasında Codex app-server isteği başarısız oldu. | App-server bağlantısını ve günlükleri denetleyin. |
| `auto_install_blocked`       | Tur başlangıcı kurulumu yeni bir kaynak eklemeyi gerektirirdi. | Önce açık kurulumu çalıştırın.                |

Sohbet çıktısı Plugin durumunu, MCP sunucusu durumunu, marketplace’i, kullanılabilir olduğunda araçları
ve başarısız kurulum adımı için belirli iletiyi içerir.

## macOS izinleri

Computer Use macOS’e özeldir. Codex tarafından yönetilen MCP sunucusunun uygulamaları inceleyebilmesi
veya denetleyebilmesi için yerel işletim sistemi izinlerine ihtiyacı olabilir. OpenClaw Computer Use’un
kurulu olduğunu ancak MCP sunucusunun kullanılamadığını söylüyorsa, önce Codex tarafındaki Computer
Use kurulumunu doğrulayın:

- Codex app-server, masaüstü denetiminin gerçekleşmesi gereken aynı ana
  makinede çalışıyor.
- Computer Use Plugin'i Codex yapılandırmasında etkinleştirilmiş.
- `computer-use` MCP sunucusu, Codex app-server MCP durumunda görünüyor.
- macOS, masaüstü denetim uygulaması için gerekli izinleri vermiş.
- Geçerli ana makine oturumu, denetlenen masaüstüne erişebiliyor.

`computerUse.enabled` true olduğunda OpenClaw bilerek kapalı şekilde başarısız
olur. Bir Codex modu turu, yapılandırmanın gerektirdiği yerel masaüstü araçları
olmadan sessizce devam etmemelidir.

## Sorun Giderme

**Durum yüklü olmadığını söylüyor.** `/codex computer-use install` komutunu
çalıştırın. Marketplace keşfedilmezse `--source` veya `--marketplace-path`
geçirin.

**Durum yüklü ama devre dışı olduğunu söylüyor.** `/codex computer-use install`
komutunu yeniden çalıştırın. Codex app-server kurulumu, Plugin yapılandırmasını
yeniden etkin olarak yazar.

**Durum uzaktan kurulumun desteklenmediğini söylüyor.** Yerel bir marketplace
kaynağı veya yolu kullanın. Yalnızca uzak katalog girdileri incelenebilir, ancak
geçerli app-server API üzerinden yüklenemez.

**Durum MCP sunucusunun kullanılamadığını söylüyor.** MCP sunucularının yeniden
yüklenmesi için kurulumu bir kez daha çalıştırın. Kullanılamaz kalırsa Codex
Computer Use uygulamasını, Codex app-server MCP durumunu veya macOS izinlerini
düzeltin.

**Durum veya bir yoklama `computer-use.list_apps` üzerinde zaman aşımına
uğruyor.** Plugin ve MCP sunucusu mevcut, ancak yerel Computer Use köprüsü yanıt
vermedi. Codex Computer Use'dan çıkın veya yeniden başlatın, gerekirse Codex
Desktop'ı yeniden açın, ardından yeni bir OpenClaw oturumunda tekrar deneyin.

**Bir Computer Use aracı `Native hook relay unavailable` diyor.** Codex'e özgü
araç hook'u, yerel köprü veya Gateway yedeği üzerinden etkin bir OpenClaw
aktarıcısına ulaşamadı. `/new` veya `/reset` ile yeni bir OpenClaw oturumu
başlatın. Devam ederse eski app-server iş parçacıklarının ve hook kayıtlarının
bırakılması için gateway'i yeniden başlatın, ardından tekrar deneyin.

**Tur başlangıcındaki otomatik kurulum bir kaynağı reddediyor.** Bu bilinçlidir.
Önce açıkça `/codex computer-use install --source <marketplace-source>` ile
kaynağı ekleyin; ardından gelecekteki tur başlangıcı otomatik kurulumu
keşfedilen yerel marketplace'i kullanabilir.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Peekaboo köprüsü](/tr/platforms/mac/peekaboo)
- [iOS uygulaması](/tr/platforms/ios)
