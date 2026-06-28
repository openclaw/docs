---
read_when:
    - Codex modundaki OpenClaw ajanlarının Codex Computer Use kullanmasını istiyorsunuz
    - Codex Computer Use, PeekabooBridge ve doğrudan cua-driver MCP arasında karar veriyorsunuz
    - Codex Computer Use ile doğrudan cua-driver MCP kurulumu arasında karar veriyorsunuz
    - Birlikte gelen Codex Plugin için computerUse yapılandırıyorsunuz
    - /codex bilgisayar kullanımı durumunu veya kurulumunu sorun gideriyorsunuz
summary: Codex modu OpenClaw ajanları için Codex Computer Use kurun
title: Codex Bilgisayar Kullanımı
x-i18n:
    generated_at: "2026-06-28T00:51:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use, yerel masaüstü denetimi için Codex'e özgü bir MCP Plugin'idir. OpenClaw
masaüstü uygulamasını kendi içine almaz, masaüstü eylemlerini kendisi yürütmez
veya Codex izinlerini atlatmaz. Birlikte gelen `codex` Plugin'i yalnızca Codex app-server'ı
hazırlar: Codex Plugin desteğini etkinleştirir, yapılandırılmış Codex
Computer Use Plugin'ini bulur veya kurar, `computer-use` MCP sunucusunun
kullanılabilir olduğunu denetler ve ardından Codex modu turlarında yerel MCP
araç çağrılarının sahipliğini Codex'e bırakır.

OpenClaw zaten yerel Codex harness'ını kullanırken bu sayfayı kullanın.
Çalışma zamanı kurulumunun kendisi için [Codex harness](/tr/plugins/codex-harness)
bölümüne bakın.

## OpenClaw.app ve Peekaboo

OpenClaw.app'in Peekaboo entegrasyonu Codex Computer Use'dan ayrıdır. macOS
uygulaması bir PeekabooBridge soketi barındırabilir; böylece `peekaboo` CLI,
Peekaboo'nun kendi otomasyon araçları için uygulamanın yerel Accessibility ve
Screen Recording izinlerini yeniden kullanabilir. Bu köprü Codex Computer Use'u
kurmaz veya proxy'lemez ve Codex Computer Use, PeekabooBridge soketi üzerinden
çağrı yapmaz.

OpenClaw.app'in Peekaboo CLI otomasyonu için izinlerden haberdar bir ana makine
olmasını istediğinizde [Peekaboo köprüsü](/tr/platforms/mac/peekaboo) bölümünü
kullanın. Codex modu OpenClaw ajanının, tur başlamadan önce Codex'in yerel
`computer-use` MCP Plugin'ine erişebilmesini istediğinizde bu sayfayı kullanın.

## iOS uygulaması

iOS uygulaması Codex Computer Use'dan ayrıdır. Codex `computer-use` MCP
sunucusunu kurmaz veya proxy'lemez ve bir masaüstü denetimi arka ucu değildir.
Bunun yerine iOS uygulaması bir OpenClaw node'u olarak bağlanır ve mobil
yetenekleri `canvas.*`, `camera.*`, `screen.*`, `location.*` ve `talk.*` gibi
node komutları üzerinden açığa çıkarır.

Bir ajanın gateway üzerinden bir iPhone node'unu yönetmesini istediğinizde
[iOS](/tr/platforms/ios) bölümünü kullanın. Codex modu bir ajanın yerel macOS
masaüstünü Codex'in yerel Computer Use Plugin'i üzerinden denetlemesini
istediğinizde bu sayfayı kullanın.

## Doğrudan cua-driver MCP

Codex Computer Use, masaüstü denetimini açığa çıkarmanın tek yolu değildir.
OpenClaw tarafından yönetilen çalışma zamanlarının TryCua sürücüsünü doğrudan
çağırmasını istiyorsanız, Codex'e özgü marketplace akışı yerine OpenClaw'ın MCP
kayıt defteri üzerinden üst kaynak `cua-driver mcp` sunucusunu kullanın.

`cua-driver` kurulduktan sonra ya OpenClaw komutunu ondan isteyin:

```bash
cua-driver mcp-config --client openclaw
```

ya da stdio sunucusunu kendiniz kaydedin:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Bu yol, sürücü şemaları ve yapılandırılmış MCP yanıtları dahil olmak üzere üst
kaynak MCP araç yüzeyini olduğu gibi korur. CUA sürücüsünün normal bir OpenClaw
MCP sunucusu olarak kullanılabilir olmasını istediğinizde bunu kullanın. Codex
app-server'ın Codex modu turları içinde Plugin kurulumunun, MCP yeniden
yüklemelerinin ve yerel araç çağrılarının sahibi olmasını istediğinizde bu
sayfadaki Codex Computer Use kurulumunu kullanın.

CUA'nın sürücüsü macOS'e özeldir ve yine de Accessibility ve Screen Recording
gibi, uygulamasının istediği yerel macOS izinlerini gerektirir. OpenClaw
`cua-driver` kurmaz, bu izinleri vermez veya üst kaynak sürücünün güvenlik
modelini atlatmaz.

## Hızlı kurulum

Codex modu turlarında bir iş parçacığı başlamadan önce Computer Use'un
kullanılabilir olması gerekiyorsa `plugins.entries.codex.config.computerUse`
değerini ayarlayın. `autoInstall: true`, Computer Use'u seçer ve OpenClaw'ın tur
başlamadan önce onu kurmasına veya yeniden etkinleştirmesine izin verir:

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

Bu yapılandırmayla OpenClaw, her Codex modu turundan önce Codex app-server'ı
denetler. Computer Use eksikse ancak Codex app-server kurulabilir bir
marketplace'i zaten keşfetmişse OpenClaw, Codex app-server'dan Plugin'i
kurmasını veya yeniden etkinleştirmesini ve MCP sunucularını yeniden yüklemesini
ister. macOS'te, eşleşen bir marketplace kayıtlı değilse ve standart Codex
uygulama paketi varsa, OpenClaw başarısız olmadan önce
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` konumundaki
birlikte gelen Codex marketplace'ini kaydetmeyi de dener. Kurulum yine de MCP
sunucusunu kullanılabilir hale getiremiyorsa tur, iş parçacığı başlamadan önce
başarısız olur.

Computer Use yapılandırmasını değiştirdikten sonra, mevcut bir Codex iş
parçacığı zaten başladıysa test etmeden önce etkilenen sohbette `/new` veya
`/reset` kullanın.

macOS yönetilen stdio başlangıcında OpenClaw, varsa
`/Applications/Codex.app/Contents/Resources/codex` konumundaki imzalı masaüstü
Codex uygulama paketini tercih eder. Bu, Computer Use'u yerel masaüstü denetimi
izinlerinin sahibi olan uygulama paketi altında tutar. Masaüstü uygulaması
kurulu değilse OpenClaw, Plugin'in yanında kurulu yönetilen Codex ikilisine geri
döner. Kurulu bir masaüstü uygulaması desteklenmeyen bir app-server sürümüyle
başlatılırsa OpenClaw, eski bir masaüstü uygulamasının Plugin'e yerel geri dönüş
seçeneğini gölgelemesine izin vermek yerine o alt süreci kapatır ve bir sonraki
yönetilen ikili adayını yeniden dener. Açık `appServer.command` yapılandırması
veya `OPENCLAW_CODEX_APP_SERVER_BIN` bu yönetilen seçimi yine de geçersiz kılar.

## Komutlar

`codex` Plugin komut yüzeyinin kullanılabilir olduğu herhangi bir sohbet
yüzeyinden `/codex computer-use` komutlarını kullanın. Bunlar OpenClaw
sohbet/çalışma zamanı komutlarıdır; `openclaw codex ...` CLI alt komutları
değildir:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` salt okunurdur. Marketplace kaynakları eklemez, Plugin kurmaz veya
Codex Plugin desteğini etkinleştirmez. Hiçbir yapılandırma Computer Use'u
seçmiyorsa, `status` tek seferlik bir kurulum komutundan sonra bile devre dışı
raporlayabilir.

`install`, Codex app-server Plugin desteğini etkinleştirir, isteğe bağlı olarak
yapılandırılmış bir marketplace kaynağı ekler, yapılandırılmış Plugin'i Codex
app-server üzerinden kurar veya yeniden etkinleştirir, MCP sunucularını yeniden
yükler ve MCP sunucusunun araçları açığa çıkardığını doğrular.

## Marketplace seçenekleri

OpenClaw, Codex'in kendisinin açığa çıkardığı aynı app-server API'sini kullanır.
Marketplace alanları, Codex'in `computer-use` değerini nerede bulacağını seçer.

| Alan                 | Ne zaman kullanılır                                           | Kurulum desteği                                         |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| Marketplace alanı yok | Codex app-server'ın zaten bildiği marketplace'leri kullanmasını istiyorsunuz. | Evet, app-server yerel bir marketplace döndürdüğünde. |
| `marketplaceSource`  | App-server'ın ekleyebileceği bir Codex marketplace kaynağınız var. | Evet, açık `/codex computer-use install` için.          |
| `marketplacePath`    | Ana makinedeki yerel marketplace dosya yolunu zaten biliyorsunuz. | Evet, açık kurulum ve tur başlangıcı otomatik kurulum için. |
| `marketplaceName`    | Zaten kayıtlı bir marketplace'i ada göre seçmek istiyorsunuz. | Yalnızca seçilen marketplace'in yerel yolu varsa evet. |

Yeni Codex ana dizinlerinin resmi marketplace'lerini tohumlaması kısa bir an
gerektirebilir. Kurulum sırasında OpenClaw, `marketplaceDiscoveryTimeoutMs`
milisaniyeye kadar `plugin/list` için yoklama yapar. Varsayılan değer 60
saniyedir.

Birden fazla bilinen marketplace Computer Use içeriyorsa OpenClaw sırasıyla
`openai-bundled`, ardından `openai-curated`, ardından `local` değerini tercih
eder. Bilinmeyen belirsiz eşleşmeler güvenli biçimde başarısız olur ve
`marketplaceName` veya `marketplacePath` ayarlamanızı ister.

## Birlikte gelen macOS marketplace

Son Codex masaüstü derlemeleri Computer Use'u burada paketler:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

`computerUse.autoInstall` true olduğunda ve `computer-use` içeren bir
marketplace kayıtlı olmadığında OpenClaw standart birlikte gelen marketplace
kökünü otomatik olarak eklemeyi dener:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Bunu Codex ile bir kabuktan açıkça da kaydedebilirsiniz:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Standart dışı bir Codex uygulama yolu kullanıyorsanız bir kez `/codex
computer-use install --source <marketplace-root>` çalıştırın veya
`computerUse.marketplacePath` değerini yerel bir marketplace dosya yoluna
ayarlayın. `--marketplace-path` seçeneğini yalnızca marketplace JSON dosya
yolunuz olduğunda kullanın; birlikte gelen marketplace kökü için kullanmayın.

## Uzak katalog sınırı

Codex app-server yalnızca uzak katalog girdilerini listeleyebilir ve okuyabilir,
ancak şu anda uzak `plugin/install` desteklemez. Bu, `marketplaceName` değerinin
durum denetimleri için yalnızca uzak bir marketplace seçebileceği, ancak kurulum
ve yeniden etkinleştirmelerin yine de `marketplaceSource` veya
`marketplacePath` üzerinden yerel bir marketplace gerektirdiği anlamına gelir.

Durum, Plugin'in uzak bir Codex marketplace'inde kullanılabilir olduğunu ancak
uzak kurulumun desteklenmediğini söylüyorsa kurulumu yerel bir kaynak veya yolla
çalıştırın:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Yapılandırma başvurusu

| Alan                            | Varsayılan     | Anlam                                                                          |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Computer Use'u zorunlu kıl. Başka bir Computer Use alanı ayarlandığında varsayılan olarak true olur. |
| `autoInstall`                   | false          | Tur başlangıcında zaten keşfedilmiş marketplace'lerden kur veya yeniden etkinleştir. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Kurulumun Codex app-server marketplace keşfini ne kadar bekleyeceği.           |
| `marketplaceSource`             | unset          | Codex app-server `marketplace/add` komutuna geçirilen kaynak dizesi.           |
| `marketplacePath`               | unset          | Plugin'i içeren yerel Codex marketplace dosya yolu.                            |
| `marketplaceName`               | unset          | Seçilecek kayıtlı Codex marketplace adı.                                       |
| `pluginName`                    | `computer-use` | Codex marketplace Plugin adı.                                                  |
| `mcpServerName`                 | `computer-use` | Kurulu Plugin tarafından açığa çıkarılan MCP sunucu adı.                       |

Tur başlangıcı otomatik kurulum, yapılandırılmış `marketplaceSource` değerlerini
bilerek reddeder. Yeni bir kaynak eklemek açık bir kurulum işlemidir; bu yüzden
bir kez `/codex computer-use install --source <marketplace-source>` kullanın,
ardından gelecekteki yeniden etkinleştirmeleri keşfedilmiş yerel
marketplace'lerden `autoInstall` ile yönetin. Tur başlangıcı otomatik kurulum,
yapılandırılmış bir `marketplacePath` kullanabilir, çünkü bu zaten ana makinede
yerel bir yoldur.

## OpenClaw neyi denetler

OpenClaw içeride kararlı bir kurulum nedeni bildirir ve kullanıcıya yönelik
durumu sohbet için biçimlendirir:

| Neden                        | Anlam                                                  | Sonraki adım                                  |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` false olarak çözümlendi.         | `enabled` veya başka bir Computer Use alanı ayarlayın. |
| `marketplace_missing`        | Eşleşen marketplace kullanılamıyordu.                  | Kaynağı, yolu veya marketplace adını yapılandırın. |
| `plugin_not_installed`       | Marketplace mevcut, ancak Plugin yüklü değil.          | Yüklemeyi çalıştırın veya `autoInstall` etkinleştirin. |
| `plugin_disabled`            | Plugin yüklü ancak Codex yapılandırmasında devre dışı. | Yeniden etkinleştirmek için yüklemeyi çalıştırın. |
| `remote_install_unsupported` | Seçilen marketplace yalnızca uzaktan kullanılabilir.   | `marketplaceSource` veya `marketplacePath` kullanın. |
| `mcp_missing`                | Plugin etkin, ancak MCP sunucusu kullanılamıyor.       | Codex Computer Use ve işletim sistemi izinlerini denetleyin. |
| `ready`                      | Plugin ve MCP araçları kullanılabilir.                 | Codex modu oturumunu başlatın.                |
| `check_failed`               | Durum denetimi sırasında bir Codex app-server isteği başarısız oldu. | app-server bağlantısını ve günlükleri denetleyin. |
| `auto_install_blocked`       | Oturum başlangıcı kurulumu yeni bir kaynak eklemeyi gerektirirdi. | Önce açık yüklemeyi çalıştırın.               |

Sohbet çıktısı, kullanılabildiğinde Plugin durumunu, MCP sunucusu durumunu,
marketplace’i, araçları ve başarısız olan kurulum adımı için belirli iletiyi içerir.

## macOS izinleri

Computer Use macOS’a özgüdür. Codex’in sahip olduğu MCP sunucusunun uygulamaları
inceleyebilmesi veya denetleyebilmesi için önce yerel işletim sistemi izinlerine
ihtiyacı olabilir. OpenClaw, Computer Use’un yüklü olduğunu ancak MCP sunucusunun
kullanılamadığını söylüyorsa, önce Codex tarafındaki Computer Use kurulumunu doğrulayın:

- Codex app-server, masaüstü denetiminin gerçekleşmesi gereken aynı ana makinede
  çalışıyor.
- Computer Use Plugin’i Codex yapılandırmasında etkin.
- `computer-use` MCP sunucusu Codex app-server MCP durumunda görünüyor.
- macOS, masaüstü denetimi uygulaması için gerekli izinleri vermiş.
- Geçerli ana makine oturumu, denetlenen masaüstüne erişebiliyor.

OpenClaw, `computerUse.enabled` true olduğunda kasıtlı olarak kapalı şekilde başarısız olur. Bir
Codex modu oturumu, yapılandırmanın gerektirdiği yerel masaüstü araçları olmadan
sessizce devam etmemelidir.

## Sorun giderme

**Durum yüklü değil diyor.** `/codex computer-use install` çalıştırın. Marketplace
bulunmazsa `--source` veya `--marketplace-path` iletin.

**Durum yüklü ancak devre dışı diyor.** `/codex computer-use install` komutunu tekrar çalıştırın.
Codex app-server yüklemesi Plugin yapılandırmasını yeniden etkin olarak yazar.

**Durum uzaktan yüklemenin desteklenmediğini söylüyor.** Yerel bir marketplace kaynağı veya
yolu kullanın. Yalnızca uzaktan kullanılabilen katalog girdileri incelenebilir, ancak
geçerli app-server API’si üzerinden yüklenemez.

**Durum MCP sunucusunun kullanılamadığını söylüyor.** MCP sunucularının yeniden
yüklenmesi için yüklemeyi bir kez daha çalıştırın. Kullanılamaz kalırsa Codex Computer Use uygulamasını,
Codex app-server MCP durumunu veya macOS izinlerini düzeltin.

**Durum veya bir yoklama `computer-use.list_apps` üzerinde zaman aşımına uğruyor.** Plugin ve MCP
sunucusu mevcut, ancak yerel Computer Use köprüsü yanıt vermedi. Codex Computer Use’u kapatın veya
yeniden başlatın, gerekirse Codex Desktop’ı yeniden açın, ardından yeni bir
OpenClaw oturumunda tekrar deneyin. Ana makine daha önce Computer Use’u daha eski
yönetilen bir Codex app-server üzerinden çalıştırdıysa, yüklü Plugin’i masaüstüyle paketlenen
marketplace’ten yenileyin:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Bir Computer Use aracı `Native hook relay unavailable` diyor.** Codex’e özgü
araç kancası, yerel köprü veya Gateway geri dönüşü üzerinden etkin bir OpenClaw aktarımına
ulaşamadı. `/new` veya `/reset` ile yeni bir OpenClaw oturumu başlatın. Bir kez çalışıp
sonra daha sonraki bir araç çağrısında yeniden başarısız olursa, `/new` yalnızca
geçerli denemeyi temizliyordur; eski iş parçacıklarının ve kanca kayıtlarının bırakılması için
Codex app-server’ı veya OpenClaw Gateway’i yeniden başlatın, ardından yeni bir oturumda tekrar deneyin.

**Oturum başlangıcı otomatik yüklemesi bir kaynağı reddediyor.** Bu kasıtlıdır. Önce
kaynağı açık `/codex computer-use install --source <marketplace-source>` komutuyla ekleyin,
sonra gelecekteki oturum başlangıcı otomatik yüklemesi keşfedilen yerel
marketplace’i kullanabilir.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Peekaboo köprüsü](/tr/platforms/mac/peekaboo)
- [iOS uygulaması](/tr/platforms/ios)
