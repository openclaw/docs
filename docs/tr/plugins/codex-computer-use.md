---
read_when:
    - Codex modundaki OpenClaw ajanlarının Codex Computer Use kullanmasını istiyorsunuz
    - Codex Computer Use, PeekabooBridge ve doğrudan cua-driver MCP arasında karar veriyorsunuz
    - Codex Computer Use ile doğrudan bir cua-driver MCP kurulumu arasında karar veriyorsunuz
    - Paketle birlikte gelen Codex Plugin'i için computerUse yapılandırıyorsunuz
    - /codex computer-use status veya kurulum sorunlarını gideriyorsunuz
summary: Codex modundaki OpenClaw aracıları için Codex Computer Use kurulumunu yapın
title: Codex Bilgisayar Kullanımı
x-i18n:
    generated_at: "2026-06-30T14:22:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use, yerel masaüstü denetimi için Codex'e özgü bir MCP plugin'idir. OpenClaw,
masaüstü uygulamasını vendor olarak dahil etmez, masaüstü eylemlerini kendisi yürütmez veya
Codex izinlerini atlamaz. Birlikte gelen `codex` plugin'i yalnızca Codex app-server'ı hazırlar:
Codex plugin desteğini etkinleştirir, yapılandırılmış Codex Computer Use plugin'ini bulur veya kurar, `computer-use` MCP sunucusunun kullanılabilir olduğunu denetler ve
ardından Codex modu dönüşleri sırasında yerel MCP araç çağrılarının sahipliğini Codex'e bırakır.

OpenClaw zaten yerel Codex harness'ını kullanırken bu sayfayı kullanın. Çalışma zamanı kurulumu
için [Codex harness](/tr/plugins/codex-harness) bölümüne bakın.

## OpenClaw.app ve Peekaboo

OpenClaw.app'in Peekaboo entegrasyonu Codex Computer Use'tan ayrıdır. macOS uygulaması,
`peekaboo` CLI'ın Peekaboo'nun kendi otomasyon araçları için uygulamanın yerel Accessibility
ve Screen Recording izinlerini yeniden kullanabilmesi amacıyla bir PeekabooBridge soketi
barındırabilir. Bu köprü Codex Computer Use'u kurmaz veya proxy'lemez ve Codex Computer Use,
PeekabooBridge soketi üzerinden çağrı yapmaz.

OpenClaw.app'in Peekaboo CLI otomasyonu için izin farkındalığı olan bir ana makine olmasını
istediğinizde [Peekaboo köprüsü](/tr/platforms/mac/peekaboo) sayfasını kullanın. Codex modundaki
bir OpenClaw aracısının, dönüş başlamadan önce Codex'in yerel `computer-use` MCP plugin'ine
erişebilmesi gerektiğinde bu sayfayı kullanın.

## iOS uygulaması

iOS uygulaması Codex Computer Use'tan ayrıdır. Codex `computer-use` MCP sunucusunu kurmaz
veya proxy'lemez ve bir masaüstü denetim arka ucu değildir. Bunun yerine iOS uygulaması,
bir OpenClaw düğümü olarak bağlanır ve mobil yetenekleri `canvas.*`, `camera.*`, `screen.*`,
`location.*` ve `talk.*` gibi düğüm komutları aracılığıyla sunar.

Bir aracının Gateway üzerinden bir iPhone düğümünü yönetmesini istediğinizde [iOS](/tr/platforms/ios)
sayfasını kullanın. Codex modundaki bir aracının yerel macOS masaüstünü Codex'in yerel
Computer Use plugin'i üzerinden denetlemesi gerektiğinde bu sayfayı kullanın.

## Doğrudan cua-driver MCP

Codex Computer Use, masaüstü denetimini sunmanın tek yolu değildir. OpenClaw tarafından yönetilen
çalışma zamanlarının TryCua'nın sürücüsünü doğrudan çağırmasını istiyorsanız, Codex'e özgü
marketplace akışı yerine OpenClaw'ın MCP kayıt defteri üzerinden upstream `cua-driver mcp`
sunucusunu kullanın.

`cua-driver` kurulduktan sonra, OpenClaw komutunu ondan isteyin:

```bash
cua-driver mcp-config --client openclaw
```

veya stdio sunucusunu kendiniz kaydedin:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Bu yol, sürücü şemaları ve yapılandırılmış MCP yanıtları dahil olmak üzere upstream MCP araç
yüzeyini olduğu gibi korur. CUA sürücüsünün normal bir OpenClaw MCP sunucusu olarak kullanılabilir
olmasını istediğinizde bunu kullanın. Codex app-server'ın Codex modu dönüşleri içinde plugin
kurulumunu, MCP yeniden yüklemelerini ve yerel araç çağrılarını sahiplenmesi gerektiğinde bu
sayfadaki Codex Computer Use kurulumunu kullanın.

CUA'nın sürücüsü macOS'a özeldir ve uygulamasının istediği Accessibility ve Screen Recording gibi
yerel macOS izinlerini yine de gerektirir. OpenClaw `cua-driver` kurmaz, bu izinleri vermez veya
upstream sürücünün güvenlik modelini atlamaz.

## Hızlı kurulum

Codex modu dönüşlerinde bir iş parçacığı başlamadan önce Computer Use'un kullanılabilir olması
gerektiğinde `plugins.entries.codex.config.computerUse` ayarını belirleyin. `autoInstall: true`,
Computer Use'u etkinleştirir ve OpenClaw'ın dönüşten önce onu kurmasına veya yeniden
etkinleştirmesine izin verir:

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

Bu yapılandırmayla OpenClaw, her Codex modu dönüşünden önce Codex app-server'ı denetler.
Computer Use eksikse ancak Codex app-server kurulabilir bir marketplace'i zaten keşfetmişse,
OpenClaw Codex app-server'dan plugin'i kurmasını veya yeniden etkinleştirmesini ve MCP
sunucularını yeniden yüklemesini ister. macOS'ta, eşleşen bir marketplace kayıtlı değilse ve
standart Codex uygulama paketi varsa, OpenClaw hata vermeden önce birlikte gelen Codex
marketplace'ini `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
konumundan kaydetmeyi de dener. Kurulum yine de MCP sunucusunu kullanılabilir hale getiremezse,
dönüş iş parçacığı başlamadan önce başarısız olur.

Computer Use yapılandırmasını değiştirdikten sonra, mevcut bir Codex iş parçacığı zaten başladıysa
test etmeden önce etkilenen sohbette `/new` veya `/reset` kullanın.

macOS yönetilen stdio başlangıcında OpenClaw, mevcut olduğunda imzalı masaüstü Codex uygulama
paketini `/Applications/Codex.app/Contents/Resources/codex` konumunda tercih eder. Bu, Computer Use'u
yerel masaüstü denetim izinlerine sahip uygulama paketinin altında tutar. Masaüstü uygulaması
kurulu değilse OpenClaw, plugin'in yanında kurulu yönetilen Codex ikilisine geri döner. Kurulu bir
masaüstü uygulaması desteklenmeyen bir app-server sürümüyle başlatılırsa OpenClaw, eski bir
masaüstü uygulamasının plugin yerelindeki geri dönüşü gölgelemesine izin vermek yerine o alt
süreci kapatır ve sonraki yönetilen ikili adayını yeniden dener. Açık `appServer.command`
yapılandırması veya `OPENCLAW_CODEX_APP_SERVER_BIN` bu yönetilen seçimi yine de geçersiz kılar.

## Komutlar

`codex` plugin komut yüzeyinin kullanılabilir olduğu herhangi bir sohbet yüzeyinden
`/codex computer-use` komutlarını kullanın. Bunlar OpenClaw sohbet/çalışma zamanı komutlarıdır,
`openclaw codex ...` CLI alt komutları değildir:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` salt okunurdur. Marketplace kaynakları eklemez, plugin kurmaz veya Codex plugin
desteğini etkinleştirmez. Hiçbir yapılandırma Computer Use'u etkinleştirmiyorsa, tek seferlik bir
kurulum komutundan sonra bile `status` devre dışı bildirebilir.

`install`, Codex app-server plugin desteğini etkinleştirir, isteğe bağlı olarak yapılandırılmış bir
marketplace kaynağı ekler, yapılandırılmış plugin'i Codex app-server üzerinden kurar veya yeniden
etkinleştirir, MCP sunucularını yeniden yükler ve MCP sunucusunun araçları sunduğunu doğrular.
Kurulum güvenilen ana makine kaynaklarını değiştirdiği için `install` komutunu yalnızca bir sahip
veya `operator.admin` Gateway istemcisi çalıştırabilir. Diğer yetkili gönderenler, geçersiz kılmalarla
birlikte bile salt okunur `status` komutunu kullanmaya devam edebilir.

## Marketplace seçenekleri

OpenClaw, Codex'in kendisinin sunduğu aynı app-server API'sini kullanır. Marketplace alanları
Codex'in `computer-use` öğesini nerede bulacağını seçer.

| Alan                 | Ne zaman kullanılır                                             | Kurulum desteği                                           |
| -------------------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| Marketplace alanı yok | Codex app-server'ın zaten bildiği marketplace'leri kullanmasını istersiniz. | Evet, app-server yerel bir marketplace döndürdüğünde.     |
| `marketplaceSource`  | App-server'ın ekleyebileceği bir Codex marketplace kaynağınız vardır. | Evet, açık `/codex computer-use install` için.            |
| `marketplacePath`    | Ana makinedeki yerel marketplace dosya yolunu zaten biliyorsunuz. | Evet, açık kurulum ve dönüş başlangıcı otomatik kurulum için. |
| `marketplaceName`    | Zaten kayıtlı bir marketplace'i ada göre seçmek istersiniz.     | Yalnızca seçilen marketplace'in yerel yolu varsa evet.    |

Yeni Codex ana dizinlerinin resmi marketplace'lerini hazırlaması kısa bir süre alabilir. Kurulum
sırasında OpenClaw, `marketplaceDiscoveryTimeoutMs` milisaniyeye kadar `plugin/list` için yoklama
yapar. Varsayılan değer 60 saniyedir.

Birden fazla bilinen marketplace Computer Use içeriyorsa OpenClaw sırasıyla `openai-bundled`,
`openai-curated` ve `local` seçeneklerini tercih eder. Bilinmeyen belirsiz eşleşmeler güvenli
şekilde başarısız olur ve sizden `marketplaceName` veya `marketplacePath` ayarlamanızı ister.

## Birlikte gelen macOS marketplace'i

Güncel Codex masaüstü derlemeleri Computer Use'u burada paketler:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

`computerUse.autoInstall` true olduğunda ve `computer-use` içeren bir marketplace kayıtlı
olmadığında OpenClaw standart birlikte gelen marketplace kökünü otomatik olarak eklemeyi dener:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Bunu Codex ile bir kabuktan açıkça da kaydedebilirsiniz:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Standart olmayan bir Codex uygulama yolu kullanıyorsanız, `/codex computer-use install
--source <marketplace-root>` komutunu bir kez çalıştırın veya `computerUse.marketplacePath`
ayarını yerel bir marketplace dosya yoluna ayarlayın. `--marketplace-path` seçeneğini yalnızca
marketplace JSON dosya yoluna sahip olduğunuzda kullanın; birlikte gelen marketplace kökü için
kullanmayın.

## Uzak katalog sınırı

Codex app-server yalnızca uzak katalog girdilerini listeleyebilir ve okuyabilir, ancak şu anda uzak
`plugin/install` desteği yoktur. Bu, `marketplaceName` alanının durum denetimleri için yalnızca
uzak bir marketplace seçebileceği, ancak kurulumların ve yeniden etkinleştirmelerin yine de
`marketplaceSource` veya `marketplacePath` üzerinden yerel bir marketplace gerektirdiği anlamına
gelir.

Durum, plugin'in uzak bir Codex marketplace'inde kullanılabilir olduğunu ancak uzak kurulumun
desteklenmediğini söylüyorsa, kurulumu yerel bir kaynak veya yol ile çalıştırın:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Yapılandırma başvurusu

| Alan                            | Varsayılan     | Anlam                                                                          |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Computer Use'u zorunlu kıl. Başka bir Computer Use alanı ayarlandığında varsayılan olarak true olur. |
| `autoInstall`                   | false          | Dönüş başlangıcında zaten keşfedilmiş marketplace'lerden kur veya yeniden etkinleştir. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Kurulumun Codex app-server marketplace keşfi için ne kadar bekleyeceği.        |
| `marketplaceSource`             | unset          | Codex app-server `marketplace/add` komutuna geçirilen kaynak dizesi.           |
| `marketplacePath`               | unset          | Plugin'i içeren yerel Codex marketplace dosya yolu.                            |
| `marketplaceName`               | unset          | Seçilecek kayıtlı Codex marketplace adı.                                       |
| `pluginName`                    | `computer-use` | Codex marketplace plugin adı.                                                  |
| `mcpServerName`                 | `computer-use` | Kurulu plugin tarafından sunulan MCP sunucusu adı.                             |

Dönüş başlangıcı otomatik kurulumu, yapılandırılmış `marketplaceSource` değerlerini bilinçli
olarak reddeder. Yeni bir kaynak eklemek açık bir kurulum işlemidir; bu yüzden
`/codex computer-use install --source <marketplace-source>` komutunu bir kez kullanın, ardından
gelecekteki yeniden etkinleştirmeleri keşfedilmiş yerel marketplace'lerden `autoInstall` ile
yönetin. Dönüş başlangıcı otomatik kurulumu yapılandırılmış bir `marketplacePath` kullanabilir,
çünkü bu zaten ana makinede yerel bir yoldur.

## OpenClaw'ın denetledikleri

OpenClaw dahili olarak kararlı bir kurulum nedeni bildirir ve sohbet için kullanıcıya dönük
durumu biçimlendirir:

| Sebep                       | Anlam                                                  | Sonraki adım                                  |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` false olarak çözümlendi.         | `enabled` değerini veya başka bir Computer Use alanını ayarlayın. |
| `marketplace_missing`        | Eşleşen bir pazar yeri yoktu.                          | Kaynağı, yolu veya pazar yeri adını yapılandırın. |
| `plugin_not_installed`       | Pazar yeri var, ancak Plugin yüklü değil.              | Kurulumu çalıştırın veya `autoInstall` etkinleştirin. |
| `plugin_disabled`            | Plugin yüklü ancak Codex yapılandırmasında devre dışı. | Yeniden etkinleştirmek için kurulumu çalıştırın. |
| `remote_install_unsupported` | Seçilen pazar yeri yalnızca uzak.                      | `marketplaceSource` veya `marketplacePath` kullanın. |
| `mcp_missing`                | Plugin etkin, ancak MCP sunucusu kullanılamıyor.       | Codex Computer Use ve işletim sistemi izinlerini kontrol edin. |
| `ready`                      | Plugin ve MCP araçları kullanılabilir.                 | Codex modu turunu başlatın.                   |
| `check_failed`               | Durum denetimi sırasında bir Codex app-server isteği başarısız oldu. | app-server bağlantısını ve günlükleri kontrol edin. |
| `auto_install_blocked`       | Tur başlangıcı kurulumu yeni bir kaynak eklemeyi gerektirirdi. | Önce açık kurulumu çalıştırın.                |

Sohbet çıktısı; Plugin durumunu, MCP sunucusu durumunu, pazar yerini, mevcut
olduğunda araçları ve başarısız kurulum adımına özel iletiyi içerir.

## macOS izinleri

Computer Use macOS'a özgüdür. Codex'e ait MCP sunucusunun uygulamaları
inceleyebilmesi veya denetleyebilmesi için önce yerel işletim sistemi izinlerine
ihtiyacı olabilir. OpenClaw, Computer Use'un yüklü olduğunu ancak MCP
sunucusunun kullanılamadığını söylüyorsa önce Codex tarafındaki Computer Use
kurulumunu doğrulayın:

- Codex app-server, masaüstü denetiminin gerçekleşmesi gereken aynı ana
  makinede çalışıyor.
- Computer Use Plugin'i Codex yapılandırmasında etkin.
- `computer-use` MCP sunucusu Codex app-server MCP durumunda görünüyor.
- macOS, masaüstü denetim uygulaması için gerekli izinleri vermiş.
- Geçerli ana makine oturumu denetlenen masaüstüne erişebiliyor.

OpenClaw, `computerUse.enabled` true olduğunda özellikle kapalı şekilde başarısız
olur. Bir Codex modu turu, yapılandırmanın gerektirdiği yerel masaüstü araçları
olmadan sessizce devam etmemelidir.

## Sorun giderme

**Durum yüklü olmadığını söylüyor.** `/codex computer-use install` çalıştırın.
Pazar yeri keşfedilmezse `--source` veya `--marketplace-path` geçirin.

**Durum yüklü ancak devre dışı olduğunu söylüyor.** `/codex computer-use install`
komutunu yeniden çalıştırın. Codex app-server kurulumu, Plugin yapılandırmasını
yeniden etkin olarak yazar.

**Durum uzak kurulumun desteklenmediğini söylüyor.** Yerel bir pazar yeri kaynağı
veya yolu kullanın. Yalnızca uzak katalog girdileri incelenebilir, ancak geçerli
app-server API'si üzerinden kurulamaz.

**Durum MCP sunucusunun kullanılamadığını söylüyor.** MCP sunucularının yeniden
yüklenmesi için kurulumu bir kez daha çalıştırın. Kullanılamaz kalırsa Codex
Computer Use uygulamasını, Codex app-server MCP durumunu veya macOS izinlerini
düzeltin.

**Durum veya bir yoklama `computer-use.list_apps` üzerinde zaman aşımına
uğruyor.** Plugin ve MCP sunucusu mevcut, ancak yerel Computer Use köprüsü yanıt
vermedi. Codex Computer Use'u kapatın veya yeniden başlatın, gerekirse Codex
Desktop'ı yeniden başlatın, ardından yeni bir OpenClaw oturumunda tekrar deneyin.
Ana makine daha önce Computer Use'u daha eski bir yönetilen Codex app-server
üzerinden çalıştırdıysa yüklü Plugin'i masaüstüyle birlikte gelen pazar yerinden
yenileyin:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Bir Computer Use aracı `Native hook relay unavailable` diyor.** Codex'e özgü
araç hook'u, yerel köprü veya Gateway geri dönüşü üzerinden etkin bir OpenClaw
rölesine ulaşamadı. `/new` veya `/reset` ile yeni bir OpenClaw oturumu başlatın.
Bir kez çalışıp daha sonra sonraki bir araç çağrısında yeniden başarısız olursa
`/new` yalnızca geçerli denemeyi temizliyordur; eski iş parçacıklarının ve hook
kayıtlarının bırakılması için Codex app-server'ı veya OpenClaw Gateway'i yeniden
başlatın, ardından yeni bir oturumda tekrar deneyin.

**Tur başlangıcı otomatik kurulumu bir kaynağı reddediyor.** Bu kasıtlıdır.
Önce açık `/codex computer-use install --source <marketplace-source>` ile kaynağı
ekleyin; ardından gelecekteki tur başlangıcı otomatik kurulumu keşfedilen yerel
pazar yerini kullanabilir.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Peekaboo köprüsü](/tr/platforms/mac/peekaboo)
- [iOS uygulaması](/tr/platforms/ios)
