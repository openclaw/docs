---
read_when:
    - Codex modundaki OpenClaw ajanlarının Codex Computer Use kullanmasını istiyorsunuz
    - Codex Computer Use, PeekabooBridge ve doğrudan cua-driver MCP arasında karar veriyorsunuz
    - Codex Computer Use ile doğrudan cua-driver MCP kurulumu arasında karar veriyorsunuz
    - Paketle birlikte gelen Codex Plugin için computerUse yapılandırıyorsunuz
    - /​codex computer-use durumu veya kurulumu için sorun gideriyorsunuz
summary: Codex modundaki OpenClaw ajanları için Codex Bilgisayar Kullanımı'nı ayarlayın
title: Codex Bilgisayar Kullanımı
x-i18n:
    generated_at: "2026-04-30T09:34:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e3551b9005cdc8084d159c107f9b5039a4b4624847b8cc6e5bcb620510fd54f
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use, yerel masaüstü denetimi için Codex'e özgü bir MCP Plugin'idir. OpenClaw
masaüstü uygulamasını kendi içine dahil etmez, masaüstü eylemlerini kendisi yürütmez veya
Codex izinlerini atlamaz. Paketle gelen `codex` Plugin'i yalnızca Codex app-server'ı hazırlar:
Codex Plugin desteğini etkinleştirir, yapılandırılmış Codex Computer Use Plugin'ini bulur veya yükler,
`computer-use` MCP sunucusunun kullanılabilir olduğunu denetler ve
ardından Codex modu turlarında yerel MCP araç çağrılarının sahipliğini Codex'e bırakır.

OpenClaw yerel Codex harness'ını zaten kullanıyorsa bu sayfayı kullanın. Çalışma zamanı
kurulumunun kendisi için [Codex harness](/tr/plugins/codex-harness) bölümüne bakın.

## OpenClaw.app ve Peekaboo

OpenClaw.app'in Peekaboo entegrasyonu Codex Computer Use'dan ayrıdır. macOS
uygulaması bir PeekabooBridge soketi barındırabilir; böylece `peekaboo` CLI,
Peekaboo'nun kendi otomasyon araçları için uygulamanın yerel Erişilebilirlik ve Ekran Kaydı
izinlerini yeniden kullanabilir. Bu köprü Codex Computer Use'u yüklemez veya proxy'lemez ve
Codex Computer Use, PeekabooBridge soketi üzerinden çağrı yapmaz.

OpenClaw.app'in Peekaboo CLI otomasyonu için izin farkında bir ana makine olmasını
istediğinizde [Peekaboo köprüsü](/tr/platforms/mac/peekaboo) bölümünü kullanın. Bir
Codex modu OpenClaw ajanının, tur başlamadan önce Codex'in yerel `computer-use` MCP Plugin'ine
sahip olması gerektiğinde bu sayfayı kullanın.

## iOS uygulaması

iOS uygulaması Codex Computer Use'dan ayrıdır. Codex `computer-use` MCP sunucusunu
yüklemez veya proxy'lemez ve bir masaüstü denetimi arka ucu değildir.
Bunun yerine iOS uygulaması bir OpenClaw düğümü olarak bağlanır ve mobil
yetenekleri `canvas.*`, `camera.*`, `screen.*`,
`location.*` ve `talk.*` gibi düğüm komutları üzerinden sunar.

Bir ajanın Gateway üzerinden bir iPhone düğümünü yönetmesini istediğinizde
[iOS](/tr/platforms/ios) bölümünü kullanın. Bir Codex modu ajanın yerel
macOS masaüstünü Codex'in yerel Computer Use Plugin'i üzerinden denetlemesi gerektiğinde
bu sayfayı kullanın.

## Doğrudan cua-driver MCP

Codex Computer Use masaüstü denetimini sunmanın tek yolu değildir. OpenClaw tarafından yönetilen
çalışma zamanlarının TryCua'nın sürücüsünü doğrudan çağırmasını istiyorsanız, Codex'e özgü
marketplace akışı yerine upstream `cua-driver mcp` sunucusunu OpenClaw'ın MCP kayıt defteri
üzerinden kullanın.

`cua-driver` yüklendikten sonra ondan OpenClaw komutunu isteyin:

```bash
cua-driver mcp-config --client openclaw
```

veya stdio sunucusunu kendiniz kaydedin:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Bu yol, sürücü şemaları ve yapılandırılmış MCP yanıtları dahil olmak üzere upstream MCP
araç yüzeyini olduğu gibi korur. CUA sürücüsünün normal bir OpenClaw MCP sunucusu
olarak kullanılabilir olmasını istediğinizde bunu kullanın. Codex app-server'ın Codex modu
turlarında Plugin kurulumunu, MCP yeniden yüklemelerini ve yerel araç çağrılarını
sahiplenmesi gerektiğinde bu sayfadaki Codex Computer Use kurulumunu kullanın.

CUA'nın sürücüsü macOS'a özeldir ve hâlâ uygulamasının istediği Erişilebilirlik ve
Ekran Kaydı gibi yerel macOS izinlerini gerektirir. OpenClaw `cua-driver` yüklemez,
bu izinleri vermez veya upstream sürücünün güvenlik modelini atlamaz.

## Hızlı kurulum

Codex modu turlarında bir iş parçacığı başlamadan önce Computer Use'un kullanılabilir
olması gerektiğinde `plugins.entries.codex.config.computerUse` değerini ayarlayın:

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
        fallback: "none",
      },
    },
  },
}
```

Bu yapılandırmayla OpenClaw, her Codex modu turundan önce Codex app-server'ı denetler.
Computer Use eksikse ancak Codex app-server yüklenebilir bir marketplace'i zaten keşfetmişse,
OpenClaw Codex app-server'dan Plugin'i yüklemesini veya yeniden etkinleştirmesini ve MCP
sunucularını yeniden yüklemesini ister. macOS'ta, eşleşen hiçbir marketplace kayıtlı değilse
ve standart Codex uygulama paketi mevcutsa, OpenClaw başarısız olmadan önce
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` konumundaki paketle gelen
Codex marketplace'ini de kaydetmeyi dener. Kurulum MCP sunucusunu hâlâ kullanılabilir
hale getiremiyorsa, tur iş parçacığı başlamadan önce başarısız olur.

Mevcut oturumlar çalışma zamanlarını ve Codex iş parçacığı bağlarını korur.
`agentRuntime` veya Computer Use yapılandırmasını değiştirdikten sonra test etmeden önce
etkilenen sohbette `/new` veya `/reset` kullanın.

## Komutlar

`codex` Plugin komut yüzeyinin kullanılabilir olduğu herhangi bir sohbet yüzeyinden
`/codex computer-use` komutlarını kullanın. Bunlar OpenClaw sohbet/çalışma zamanı
komutlarıdır, `openclaw codex ...` CLI alt komutları değildir:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` salt okunurdur. Marketplace kaynakları eklemez, Plugin yüklemez veya
Codex Plugin desteğini etkinleştirmez.

`install`, Codex app-server Plugin desteğini etkinleştirir, isteğe bağlı olarak yapılandırılmış
bir marketplace kaynağı ekler, yapılandırılmış Plugin'i Codex app-server üzerinden yükler veya
yeniden etkinleştirir, MCP sunucularını yeniden yükler ve MCP sunucusunun araçları sunduğunu
doğrular.

## Marketplace seçenekleri

OpenClaw, Codex'in kendisinin sunduğu app-server API'sini kullanır. Marketplace alanları,
Codex'in `computer-use` değerini nerede bulacağını seçer.

| Alan                 | Ne zaman kullanılır                                             | Kurulum desteği                                         |
| -------------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| Marketplace alanı yok | Codex app-server'ın zaten bildiği marketplace'leri kullanmasını istiyorsunuz. | Evet, app-server yerel bir marketplace döndürdüğünde. |
| `marketplaceSource`  | app-server'ın ekleyebileceği bir Codex marketplace kaynağınız var. | Evet, açık `/codex computer-use install` için.         |
| `marketplacePath`    | Ana makinedeki yerel marketplace dosya yolunu zaten biliyorsunuz. | Evet, açık kurulum ve tur başlangıcı otomatik kurulumu için. |
| `marketplaceName`    | Zaten kayıtlı bir marketplace'i adına göre seçmek istiyorsunuz. | Yalnızca seçilen marketplace'in yerel yolu olduğunda evet. |

Yeni Codex ana dizinlerinin resmi marketplace'lerini tohumlaması için kısa bir ana ihtiyaç
olabilir. Kurulum sırasında OpenClaw, `marketplaceDiscoveryTimeoutMs` milisaniyeye kadar
`plugin/list` için yoklama yapar. Varsayılan değer 60 saniyedir.

Birden fazla bilinen marketplace Computer Use içeriyorsa OpenClaw önce `openai-bundled`,
ardından `openai-curated`, ardından `local` tercih eder. Bilinmeyen belirsiz eşleşmeler
güvenli şekilde başarısız olur ve `marketplaceName` veya `marketplacePath` ayarlamanızı ister.

## Paketle gelen macOS marketplace'i

Güncel Codex masaüstü derlemeleri Computer Use'u burada paketler:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

`computerUse.autoInstall` true olduğunda ve `computer-use` içeren hiçbir marketplace
kayıtlı olmadığında, OpenClaw standart paketle gelen marketplace kökünü otomatik olarak
eklemeyi dener:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Bunu Codex ile bir kabuktan açıkça da kaydedebilirsiniz:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Standart dışı bir Codex uygulama yolu kullanıyorsanız `computerUse.marketplacePath` değerini
yerel bir marketplace dosya yoluna ayarlayın veya `/codex computer-use install --source
<marketplace-source>` komutunu bir kez çalıştırın.

## Uzak katalog sınırı

Codex app-server yalnızca uzak katalog girdilerini listeleyebilir ve okuyabilir, ancak şu anda
uzak `plugin/install` desteklemez. Bu, `marketplaceName` değerinin durum denetimleri için
yalnızca uzak bir marketplace seçebileceği, ancak kurulumların ve yeniden etkinleştirmelerin
hâlâ `marketplaceSource` veya `marketplacePath` üzerinden yerel bir marketplace gerektirdiği
anlamına gelir.

Durum, Plugin'in uzak bir Codex marketplace'inde kullanılabilir olduğunu ancak uzak kurulumun
desteklenmediğini söylüyorsa kurulumu yerel bir kaynak veya yol ile çalıştırın:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Yapılandırma başvurusu

| Alan                            | Varsayılan     | Anlamı                                                                         |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Computer Use'u zorunlu kılar. Başka bir Computer Use alanı ayarlandığında varsayılan olarak true olur. |
| `autoInstall`                   | false          | Tur başlangıcında zaten keşfedilmiş marketplace'lerden yükler veya yeniden etkinleştirir. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Kurulumun Codex app-server marketplace keşfini ne kadar bekleyeceği.           |
| `marketplaceSource`             | unset          | Codex app-server `marketplace/add` öğesine geçirilen kaynak dizgesi.           |
| `marketplacePath`               | unset          | Plugin'i içeren yerel Codex marketplace dosya yolu.                            |
| `marketplaceName`               | unset          | Seçilecek kayıtlı Codex marketplace adı.                                       |
| `pluginName`                    | `computer-use` | Codex marketplace Plugin adı.                                                  |
| `mcpServerName`                 | `computer-use` | Yüklü Plugin tarafından sunulan MCP sunucu adı.                                |

Tur başlangıcı otomatik kurulumu, yapılandırılmış `marketplaceSource` değerlerini bilerek reddeder.
Yeni bir kaynak eklemek açık bir kurulum işlemidir; bu nedenle
`/codex computer-use install --source <marketplace-source>` komutunu bir kez kullanın, ardından
`autoInstall` değerinin keşfedilmiş yerel marketplace'lerden gelecekteki yeniden etkinleştirmeleri
yönetmesine izin verin. Tur başlangıcı otomatik kurulumu yapılandırılmış bir `marketplacePath`
kullanabilir, çünkü bu zaten ana makinede yerel bir yoldur.

## OpenClaw'ın denetledikleri

OpenClaw içeride kararlı bir kurulum nedeni raporlar ve kullanıcıya gösterilen durumu
sohbet için biçimlendirir:

| Neden                        | Anlamı                                                 | Sonraki adım                                  |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` false olarak çözümlendi.         | `enabled` veya başka bir Computer Use alanı ayarlayın. |
| `marketplace_missing`        | Eşleşen marketplace yoktu.                             | Kaynak, yol veya marketplace adı yapılandırın. |
| `plugin_not_installed`       | Marketplace var, ancak Plugin yüklü değil.             | Kurulumu çalıştırın veya `autoInstall` etkinleştirin. |
| `plugin_disabled`            | Plugin yüklü, ancak Codex yapılandırmasında devre dışı. | Yeniden etkinleştirmek için kurulumu çalıştırın. |
| `remote_install_unsupported` | Seçilen marketplace yalnızca uzak.                     | `marketplaceSource` veya `marketplacePath` kullanın. |
| `mcp_missing`                | Plugin etkin, ancak MCP sunucusu kullanılamıyor.       | Codex Computer Use'u ve işletim sistemi izinlerini denetleyin. |
| `ready`                      | Plugin ve MCP araçları kullanılabilir.                 | Codex modu turunu başlatın.                  |
| `check_failed`               | Durum denetimi sırasında bir Codex app-server isteği başarısız oldu. | app-server bağlantısını ve günlükleri denetleyin. |
| `auto_install_blocked`       | Tur başlangıcı kurulumu yeni bir kaynak eklemeyi gerektirirdi. | Önce açık kurulumu çalıştırın.               |

Sohbet çıktısı, Plugin durumunu, MCP sunucusu durumunu, marketplace'i, kullanılabilir olduğunda
araçları ve başarısız olan kurulum adımına özgü iletiyi içerir.

## macOS izinleri

Computer Use macOS'a özeldir. Codex'in sahip olduğu MCP sunucusunun uygulamaları inceleyebilmesi
veya denetleyebilmesi için yerel işletim sistemi izinlerine ihtiyacı olabilir. OpenClaw,
Computer Use'un yüklü olduğunu ancak MCP sunucusunun kullanılamadığını söylüyorsa önce Codex
tarafındaki Computer Use kurulumunu doğrulayın:

- Codex app-server, masaüstü denetiminin gerçekleşmesi gereken aynı ana makinede
  çalışıyor.
- Computer Use Plugin'i Codex yapılandırmasında etkin.
- `computer-use` MCP sunucusu Codex app-server MCP durumunda görünüyor.
- macOS, masaüstü denetimi uygulaması için gerekli izinleri vermiş.
- Mevcut ana makine oturumu denetlenen masaüstüne erişebiliyor.

OpenClaw, `computerUse.enabled` true olduğunda bilinçli olarak kapalı hata verir. Bir
Codex modu turu, yapılandırmanın gerekli kıldığı yerel masaüstü araçları olmadan
sessizce devam etmemelidir.

## Sorun giderme

**Durum yüklü olmadığını söylüyor.** `/codex computer-use install` çalıştırın. Eğer
marketplace bulunmazsa `--source` veya `--marketplace-path` iletin.

**Durum yüklü ancak devre dışı olduğunu söylüyor.** `/codex computer-use install` komutunu tekrar çalıştırın.
Codex app-server kurulumu, Plugin yapılandırmasını yeniden etkin olarak yazar.

**Durum uzaktan kurulumun desteklenmediğini söylüyor.** Yerel bir marketplace kaynağı veya
yolu kullanın. Yalnızca uzaktan katalog girdileri incelenebilir, ancak mevcut
app-server API'si üzerinden kurulamaz.

**Durum MCP sunucusunun kullanılamadığını söylüyor.** MCP sunucularının yeniden
yüklenmesi için kurulumu bir kez daha çalıştırın. Kullanılamaz kalırsa Codex Computer Use uygulamasını,
Codex app-server MCP durumunu veya macOS izinlerini düzeltin.

**Durum veya bir yoklama `computer-use.list_apps` üzerinde zaman aşımına uğruyor.** Plugin ve MCP
sunucusu mevcut, ancak yerel Computer Use köprüsü yanıt vermedi. Codex Computer Use'dan çıkın veya
onu yeniden başlatın, gerekirse Codex Desktop'ı yeniden açın, ardından yeni bir
OpenClaw oturumunda yeniden deneyin.

**Bir Computer Use aracı `Native hook relay unavailable` diyor.** Codex yerel
araç kancası, yerel köprü veya Gateway geri dönüşü üzerinden etkin bir OpenClaw rölesine
ulaşamadı. `/new` veya `/reset` ile yeni bir OpenClaw oturumu başlatın. Bu
devam ederse eski app-server iş parçacıklarının ve kanca kayıtlarının bırakılması için
Gateway'i yeniden başlatın, ardından yeniden deneyin.

**Tur başlangıcında otomatik kurulum bir kaynağı reddediyor.** Bu bilinçli bir davranıştır. Önce
kaynağı açıkça `/codex computer-use install --source <marketplace-source>` ile ekleyin,
ardından gelecekteki tur başlangıcı otomatik kurulumu keşfedilen yerel
marketplace'i kullanabilir.
