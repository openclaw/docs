---
read_when:
    - Codex modundaki OpenClaw ajanlarının Codex Computer Use'ı kullanmasını istiyorsunuz
    - Codex Computer Use, PeekabooBridge ve doğrudan cua-driver MCP arasında seçim yapıyorsunuz
    - Paketle birlikte sunulan Codex Plugin için computerUse'ı yapılandırıyorsunuz
    - /codex bilgisayar kullanımı durumunu veya kurulumunu sorun gideriyorsunuz
summary: Codex modundaki OpenClaw ajanları için Codex Computer Use'ı ayarlama
title: Codex Bilgisayar Kullanımı
x-i18n:
    generated_at: "2026-07-12T11:57:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use, yerel masaüstü denetimi için Codex'e özgü bir MCP Plugin'idir. OpenClaw
masaüstü uygulamasını kendi paketine dahil etmez, masaüstü eylemlerini kendisi yürütmez veya
Codex izinlerini atlamaz. Birlikte sunulan `codex` Plugin'i yalnızca Codex app-server'ı hazırlar:
Codex Plugin desteğini etkinleştirir, yapılandırılmış Computer Use
Plugin'ini bulur veya yükler, `computer-use` MCP sunucusunun kullanılabilir olduğunu denetler ve ardından
Codex modundaki turlar sırasında yerel MCP araç çağrılarının yönetimini
Codex'e bırakır.

OpenClaw zaten yerel Codex çalıştırma düzenini kullanıyorsa bu sayfayı kullanın. Çalışma zamanı
kurulumunun kendisi için [Codex çalıştırma düzeni](/tr/plugins/codex-harness) bölümüne bakın.

Bu, OpenClaw'un yerleşik [Node destekli bilgisayar aracından](/tr/nodes/computer-use) farklıdır. Aynı ajan sözleşmesinin, ajan ister Gateway'de ister başka bir Node'da çalışsın, eşleştirilmiş bir Mac'i denetlemesi gerektiğinde yerleşik aracı kullanın. Yerel MCP yüklemesini, izinleri ve yerel araç çağrılarını Codex app-server'ın yönetmesi gerektiğinde Codex Computer Use'ı kullanın.

## OpenClaw.app ve Peekaboo

OpenClaw.app'in Peekaboo entegrasyonu, Codex Computer Use'dan ayrıdır.
macOS uygulaması, `peekaboo` CLI'ın Peekaboo'nun kendi
otomasyon araçları için uygulamanın yerel Erişilebilirlik ve Ekran Kaydı izinlerini yeniden kullanabilmesi amacıyla bir PeekabooBridge soketi barındırabilir.
Bu köprü, Codex Computer Use'ı yüklemez veya ona vekillik etmez ve
Codex Computer Use, PeekabooBridge soketi üzerinden çağrı yapmaz.

OpenClaw.app'in Peekaboo CLI otomasyonu için
izinlerin farkında olan bir ana makine olmasını istediğinizde [Peekaboo köprüsünü](/tr/platforms/mac/peekaboo) kullanın. Codex modundaki bir OpenClaw ajanının, tur başlamadan önce Codex'in yerel `computer-use` MCP Plugin'ine
erişebilmesi gerektiğinde bu sayfayı kullanın.

## iOS uygulaması

iOS uygulaması, Codex Computer Use'dan ayrıdır. Codex `computer-use` MCP sunucusunu
yüklemez veya ona vekillik etmez ve bir masaüstü denetimi arka ucu değildir.
Bunun yerine iOS uygulaması, bir OpenClaw Node'u olarak bağlanır ve mobil
yetenekleri `canvas.*`, `camera.*`, `screen.*`,
`location.*` ve `talk.*` gibi Node komutları aracılığıyla sunar.

Bir ajanın Gateway aracılığıyla bir iPhone Node'unu yönetmesini
istediğinizde [iOS](/tr/platforms/ios) bölümünü kullanın. Codex modundaki bir ajanın
Codex'in yerel Computer Use Plugin'i aracılığıyla yerel macOS masaüstünü denetlemesi gerektiğinde bu sayfayı kullanın.

## Doğrudan cua-driver MCP

Masaüstü denetimi sunmanın tek yolu Codex Computer Use değildir.
OpenClaw tarafından yönetilen çalışma zamanlarının TryCua sürücüsünü doğrudan çağırmasını istiyorsanız,
Codex'e özgü pazar yeri akışı yerine üst kaynak
`cua-driver mcp` sunucusunu OpenClaw'un MCP kayıt defteri üzerinden kullanın.

`cua-driver` yüklendikten sonra OpenClaw komutunu vermesini isteyin:

```bash
cua-driver mcp-config --client openclaw
```

veya stdio sunucusunu doğrudan kaydedin:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Bu yol, sürücü
şemaları ve yapılandırılmış MCP yanıtları dâhil olmak üzere üst kaynak MCP araç yüzeyini değiştirmeden korur. CUA sürücüsünün
normal bir OpenClaw MCP sunucusu olarak kullanılabilmesini istediğinizde bunu kullanın. Codex modundaki turlar içinde Plugin yüklemesini, MCP yeniden yüklemelerini
ve yerel araç çağrılarını Codex app-server'ın yönetmesi gerektiğinde
bu sayfadaki Codex Computer Use kurulumunu kullanın.

CUA sürücüsü macOS'a özgüdür ve Erişilebilirlik ile Ekran Kaydı gibi,
uygulamasının istediği yerel macOS izinlerini yine gerektirir. OpenClaw,
`cua-driver` yüklemez, bu izinleri vermez veya üst kaynak
sürücünün güvenlik modelini atlamaz.

## Hızlı kurulum

Codex modundaki turlarda bir iş parçacığı başlamadan önce
Computer Use'ın kullanılabilir olması gerektiğinde `plugins.entries.codex.config.computerUse` değerini ayarlayın. `autoInstall: true`,
Computer Use'ı etkinleştirir ve OpenClaw'un turdan önce onu yüklemesine veya yeniden etkinleştirmesine izin verir:

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Bu yapılandırmayla OpenClaw, Codex modundaki her turdan önce Codex app-server'ı
denetler. Computer Use eksikse ancak Codex app-server yüklenebilir bir pazar yerini
önceden keşfetmişse OpenClaw, Codex app-server'dan Plugin'i yüklemesini veya
yeniden etkinleştirmesini ve MCP sunucularını yeniden yüklemesini ister. macOS'ta eşleşen bir
pazar yeri kayıtlı değilse ve standart bir masaüstü uygulama paketi varsa OpenClaw,
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled` konumundaki
birlikte sunulan Codex pazar yerini de kaydetmeyi dener;
eski bağımsız kurulumlar için
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` yedek seçenek olarak korunur. Kurulum yine de
MCP sunucusunu kullanılabilir hâle getiremezse tur, iş parçacığı başlamadan önce başarısız olur.

Computer Use yapılandırmasını değiştirdikten sonra, mevcut bir Codex iş parçacığı
zaten başlatılmışsa test etmeden önce etkilenen sohbette `/new` veya `/reset` kullanın.

macOS'ta Computer Use için yönetilen başlatma, önce
`/Applications/ChatGPT.app/Contents/Resources/codex` konumundaki masaüstü uygulaması ikili dosyasını tercih eder, ardından eski
bağımsız kurulumlar için
`/Applications/Codex.app/Contents/Resources/codex` konumuna geri döner. Bu, kendi istemcisini başlatan tek seferlik Computer Use durum ve
yükleme komutları için de geçerlidir. Böylece masaüstü denetimi,
yerel macOS izinlerine sahip uygulama paketinin yönetiminde kalır. Masaüstü uygulaması
yüklü değilse OpenClaw, Plugin'in yanında yüklenmiş olan yönetilen Codex ikili dosyasına
geri döner. Varsayılan yalıtılmış ajan ana dizinini kullanan sıradan yönetilen Codex turları,
eski bir masaüstü uygulamasının güncel model desteğini gölgelemesini önlemek için önce
sabitlenmiş paketi tercih eder. Kullanıcı kapsamlı ana dizinler, yerel
Computer Use durumunu yükleyebildikleri için masaüstünü öncelemeye devam eder. Etkin Codex yapılandırmasında
Computer Use etkinleştirilmiş yalıtılmış bir ajan ana dizini de masaüstünü öncelemeye devam eder. Açık
`appServer.command` yapılandırması veya `OPENCLAW_CODEX_APP_SERVER_BIN`, bu yönetilen seçimi
yine geçersiz kılar.

OpenClaw, çalışan tek bir Gateway içinde yerel Codex yapılandırması okumalarını ve Computer Use yüklemesini
sıraya koyar. Ayrı bir Codex işlemi veya başka bir Gateway,
bu korumanın parçası değildir. Yerel Codex Plugin yapılandırmasını Gateway dışında değiştirdikten sonra
yeni seçime güvenmeden önce Gateway'i yeniden başlatın ve yeni bir sohbet başlatın.

## Komutlar

`codex` Plugin komut yüzeyinin kullanılabildiği herhangi bir sohbet yüzeyinde
`/codex computer-use` komutlarını kullanın. Bunlar `openclaw codex ...` CLI alt komutları değil,
OpenClaw sohbet/çalışma zamanı komutlarıdır:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` varsayılan eylemdir ve salt okunurdur: pazar yeri
kaynakları eklemez, Plugin yüklemez veya Codex Plugin desteğini etkinleştirmez. Hiçbir yapılandırma
Computer Use'ı etkinleştirmiyorsa `status`, tek seferlik bir yükleme
komutundan sonra bile devre dışı olduğunu bildirebilir.

`install`, Codex app-server Plugin desteğini etkinleştirir, isteğe bağlı olarak
yapılandırılmış bir pazar yeri kaynağı ekler, yapılandırılmış Plugin'i
Codex app-server aracılığıyla yükler veya yeniden etkinleştirir, MCP sunucularını yeniden yükler ve MCP
sunucusunun araçlar sunduğunu doğrular. Yükleme, güvenilen ana makine kaynaklarını değiştirdiği için
`install` komutunu yalnızca bir sahip veya bir `operator.admin` Gateway istemcisi çalıştırabilir. Diğer
yetkili gönderenler, geçersiz kılmalarla birlikte olmak üzere salt okunur `status` komutunu
kullanmaya devam edebilir.

Eski sürümler tek seferlik `--plugin`, `--server` ve `--mcp-server`
kimlik geçersiz kılmalarını kabul ediyordu. Bunun yerine `computerUse.pluginName` ve
`computerUse.mcpServerName` değerlerini kalıcı olarak yapılandırın. Eski bir kimlik bayrağı
kullanıldığında komut, kalıcı hâle getirilecek tam ayarı belirtir ve geçiş yönergelerinde
istenen eylemi desteklenen tüm pazar yeri bayraklarıyla birlikte tekrarlar.

## Pazar yeri seçenekleri

OpenClaw, Codex'in kendisinin sunduğu app-server API'sinin aynısını kullanır.
Pazar yeri alanları, Codex'in `computer-use` öğesini nerede bulacağını seçer.

| Alan                 | Kullanım koşulu                                                  | Yükleme desteği                                                   |
| -------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| Pazar yeri alanı yok | Codex app-server'ın zaten bildiği pazar yerlerini kullanmasını istiyorsanız. | Evet, app-server yerel bir pazar yeri döndürdüğünde.              |
| `marketplaceSource`  | App-server'ın ekleyebileceği bir Codex pazar yeri kaynağınız varsa. | Evet, açık `/codex computer-use install` için.                    |
| `marketplacePath`    | Ana makinedeki yerel pazar yeri dosya yolunu zaten biliyorsanız. | Evet, açık yükleme ve tur başlangıcında otomatik yükleme için.    |
| `marketplaceName`    | Önceden kayıtlı bir pazar yerini adına göre seçmek istiyorsanız. | Yalnızca seçilen pazar yerinin yerel bir yolu olduğunda evet.     |

Yeni Codex ana dizinlerinin resmî
pazar yerlerini hazırlaması kısa sürebilir. Yükleme sırasında OpenClaw, `plugin/list` çağrısını
`marketplaceDiscoveryTimeoutMs` milisaniyeye kadar yoklar (varsayılan 60 saniye).

Bilinen birden fazla pazar yeri Computer Use içeriyorsa OpenClaw önce
`openai-bundled`, ardından `openai-curated`, son olarak `local` seçeneğini tercih eder. Bilinmeyen ve belirsiz
eşleşmeler güvenli biçimde başarısız olur ve `marketplaceName` veya
`marketplacePath` ayarlamanızı ister.

## Birlikte sunulan macOS pazar yeri

Güncel ChatGPT masaüstü derlemeleri Computer Use'ı burada birlikte sunar; eski bağımsız
Codex masaüstü derlemeleri `Codex.app` altında aynı düzeni kullanır:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

`computerUse.autoInstall` true olduğunda ve `computer-use` içeren hiçbir pazar yeri
kayıtlı olmadığında OpenClaw, mevcut olan ilk standart
birlikte sunulan pazar yeri kökünü eklemeyi dener:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Codex ile bir kabuktan açıkça da kaydedebilirsiniz:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

Standart olmayan bir Codex uygulama yolu kullanıyorsanız `/codex computer-use install
--source <marketplace-root>` komutunu bir kez çalıştırın veya `computerUse.marketplacePath` değerini
yerel bir pazar yeri dosya yoluna ayarlayın. `--marketplace-path` seçeneğini, birlikte sunulan pazar yeri kökü için değil,
yalnızca pazar yeri JSON dosya yoluna sahip olduğunuzda kullanın.

### Paylaşılan Plugin önbelleği

Varsayılan `pluginCacheMode: "independent"`, her Codex ana dizinini ve onun
Plugin önbelleğini yönetimsiz bırakır. App-server başlatılmadan önce birlikte sunulan
Computer Use Plugin'ini etkin Codex ana dizininin keşfedilebilir Plugin önbelleğine kopyalamak için
`pluginCacheMode: "shared"` ayarını kullanın. Çalışan Codex istemcileri
sürümlendirilmiş Plugin dizinlerine başvurmaya devam edebildiğinden paylaşılan mod,
eski önbelleğe alınmış sürümleri korur; başarısız bir değiştirme kopyası da etkin önbelleği korur. Açık
`marketplaceName` veya `marketplacePath` yapılandırması, OpenClaw'un bu seçimi geçersiz kılmaması için
bu uzlaştırmayı devre dışı bırakır.

## Uzak katalog sınırı

Codex app-server yalnızca uzakta bulunan katalog girdilerini listeleyip okuyabilir ancak
şu anda uzak `plugin/install` işlemini desteklemez. Bu nedenle `marketplaceName`,
durum denetimleri için yalnızca uzakta bulunan bir pazar yerini seçebilir; ancak yüklemeler ve
yeniden etkinleştirmeler için yine de `marketplaceSource` veya
`marketplacePath` üzerinden yerel bir pazar yeri gerekir.

Durum, Plugin'in uzak bir Codex pazar yerinde kullanılabilir olduğunu ancak
uzak yüklemenin desteklenmediğini bildiriyorsa yerel bir kaynak veya yol ile yüklemeyi çalıştırın:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Yapılandırma başvurusu

| Alan                            | Varsayılan     | Anlamı                                                                                              |
| ------------------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| `enabled`                       | çıkarılan      | Computer Use'u zorunlu kılar. Başka bir Computer Use alanı ayarlandığında varsayılan olarak true olur. |
| `autoInstall`                   | false          | Tur başlangıcında, önceden keşfedilmiş pazaryerlerinden yükler veya yeniden etkinleştirir.          |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Yüklemenin Codex app-server pazaryeri keşfini ne kadar süre bekleyeceği.                             |
| `liveTestTimeoutMs`             | 60000          | Geçici hazırlık iş parçacığı ve onun temizleme istekleri için zaman aşımı.                           |
| `toolCallTimeoutMs`             | 60000          | Computer Use `list_apps` hazırlık aracı çağrısı için zaman aşımı.                                   |
| `healthCheckEnabled`            | false          | Sahip app-server istemcisi etkinken düzenli hazırlık yoklamaları çalıştırır.                         |
| `healthCheckIntervalMinutes`    | 60             | Yoklama sıklığı; kabul edilen değerler 30, 60, 120 veya 240 dakikadır.                               |
| `pluginCacheMode`               | `independent`  | Codex ana dizini önbelleğini paketlenmiş masaüstü Plugin'inden yenilemek için `shared` kullanın.     |
| `strictReadiness`               | false          | Başarısız bir canlı yoklamada uyarıyla devam etmek yerine başlatmayı durdurur.                       |
| `autoRepair`                    | false          | Eski kapsamlı Computer Use MCP alt süreçlerini sonlandırır ve başarısız bir yoklamayı bir kez yeniden dener. |
| `marketplaceSource`             | ayarlanmamış   | Codex app-server `marketplace/add` çağrısına iletilen kaynak dizesi.                                 |
| `marketplacePath`               | ayarlanmamış   | Plugin'i içeren yerel Codex pazaryeri dosya yolu.                                                    |
| `marketplaceName`               | ayarlanmamış   | Seçilecek kayıtlı Codex pazaryeri adı.                                                               |
| `pluginName`                    | `computer-use` | Codex pazaryeri Plugin adı.                                                                          |
| `mcpServerName`                 | `computer-use` | Yüklü Plugin tarafından sunulan MCP sunucusu adı.                                                    |

Tur başlangıcındaki otomatik yükleme, yapılandırılmış `marketplaceSource`
değerlerini bilinçli olarak reddeder. Yeni bir kaynak eklemek açık bir kurulum
işlemidir; bu nedenle `/codex computer-use install --source
<marketplace-source>` komutunu bir kez kullanın, ardından gelecekte keşfedilen
yerel pazaryerlerinden yeniden etkinleştirme işlemlerini `autoInstall` yapsın.
Tur başlangıcındaki otomatik yükleme, yapılandırılmış bir `marketplacePath`
kullanabilir; çünkü bu, ana makinede zaten yerel bir yoldur.

Her alan ayrıca, eşleşen yapılandırma anahtarı ayarlanmamışsa denetlenen bir
ortam değişkeni geçersiz kılmasını kabul eder:

| Alan                            | Ortam değişkeni                                                 |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`             |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`             |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`             |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`    |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                 |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                      |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## OpenClaw neleri denetler?

OpenClaw, kararlı bir kurulum nedenini dahili olarak bildirir ve kullanıcıya
gösterilen durumu sohbet için biçimlendirir:

| Neden                        | Anlamı                                                          | Sonraki adım                                         |
| ---------------------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| `disabled`                   | `computerUse.enabled` false olarak çözümlendi.                   | `enabled` veya başka bir Computer Use alanını ayarlayın. |
| `marketplace_missing`        | Eşleşen bir pazaryeri kullanılamıyordu.                          | Kaynağı, yolu veya pazaryeri adını yapılandırın.      |
| `plugin_not_installed`       | Pazaryeri mevcut, ancak Plugin yüklü değil.                      | Yüklemeyi çalıştırın veya `autoInstall` özelliğini etkinleştirin. |
| `plugin_disabled`            | Plugin yüklü, ancak Codex yapılandırmasında devre dışı.          | Yeniden etkinleştirmek için yüklemeyi çalıştırın.     |
| `remote_install_unsupported` | Seçilen pazaryeri yalnızca uzaktan kullanılabilir.               | `marketplaceSource` veya `marketplacePath` kullanın.  |
| `mcp_missing`                | Plugin etkin, ancak MCP sunucusu kullanılamıyor.                 | Codex Computer Use ve işletim sistemi izinlerini denetleyin. |
| `ready`                      | Plugin ve MCP araçları kullanılabilir.                           | Codex modundaki turu başlatın.                        |
| `check_failed`               | Durum denetimi sırasında bir Codex app-server isteği başarısız oldu. | app-server bağlantısını ve günlükleri denetleyin. |
| `auto_install_blocked`       | Tur başlangıcı kurulumu yeni bir kaynak eklemeyi gerektiriyor.   | Önce açık yüklemeyi çalıştırın.                       |

Sohbet çıktısı; Plugin durumunu, MCP sunucusu durumunu, pazaryerini, mevcut
olduğunda araçları ve başarısız olan kurulum adımına özgü iletiyi içerir.

## macOS izinleri

Computer Use, macOS'a özgüdür. Codex'e ait MCP sunucusunun uygulamaları
inceleyebilmesi veya denetleyebilmesi için yerel işletim sistemi izinlerine
ihtiyacı olabilir. OpenClaw, Computer Use'un yüklü olduğunu ancak MCP
sunucusunun kullanılamadığını söylüyorsa önce Codex tarafındaki Computer Use
kurulumunu doğrulayın:

- Codex app-server, masaüstü denetiminin gerçekleşmesi gereken aynı ana
  makinede çalışıyor.
- Computer Use Plugin'i Codex yapılandırmasında etkin.
- `computer-use` MCP sunucusu Codex app-server MCP durumunda görünüyor.
- macOS, masaüstü denetim uygulaması için gereken izinleri vermiş.
- Geçerli ana makine oturumu denetlenen masaüstüne erişebiliyor.

OpenClaw, `computerUse.enabled` true olduğunda bilinçli olarak güvenli biçimde
başarısız olur. Codex modundaki bir tur, yapılandırmanın zorunlu kıldığı yerel
masaüstü araçları olmadan sessizce ilerlememelidir.

## Sorun giderme

**Durum, yüklü olmadığını söylüyor.** `/codex computer-use install` komutunu
çalıştırın. Pazaryeri keşfedilmezse `--source` veya `--marketplace-path`
iletin.

**Durum, yüklü ancak devre dışı olduğunu söylüyor.** `/codex computer-use
install` komutunu yeniden çalıştırın. Codex app-server yüklemesi, Plugin
yapılandırmasını yeniden etkin olarak yazar.

**Durum, uzaktan yüklemenin desteklenmediğini söylüyor.** Yerel bir pazaryeri
kaynağı veya yolu kullanın. Yalnızca uzaktan kullanılabilen katalog girdileri
incelenebilir ancak mevcut app-server API'si üzerinden yüklenemez.

**Durum, MCP sunucusunun kullanılamadığını söylüyor.** MCP sunucularının
yeniden yüklenmesi için yüklemeyi bir kez daha çalıştırın. Sunucu hâlâ
kullanılamıyorsa Codex Computer Use uygulamasını, Codex app-server MCP
durumunu veya macOS izinlerini düzeltin.

**Durum veya bir yoklama `computer-use.list_apps` çağrısında zaman aşımına
uğruyor.** Plugin ve MCP sunucusu mevcut, ancak yerel Computer Use köprüsü
yanıt vermedi. Codex Computer Use'dan çıkın veya onu yeniden başlatın,
gerekirse Codex Desktop'ı yeniden çalıştırın, ardından yeni bir OpenClaw
oturumunda tekrar deneyin. Ana makine daha önce Computer Use'u eski bir
yönetilen Codex app-server üzerinden çalıştırdıysa yüklü Plugin'i masaüstüyle
paketlenmiş pazaryerinden yenileyin (bağımsız Codex masaüstü yüklemeleri için
`Codex.app` yolunu kullanın):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Bir Computer Use aracı `Native hook relay unavailable` diyor.**
Codex'e özgü araç kancası, yerel köprü veya Gateway geri dönüşü üzerinden
etkin bir OpenClaw aktarıcısına ulaşamadı. `/new` veya `/reset` ile yeni bir
OpenClaw oturumu başlatın. Bir kez çalışıp sonraki bir araç çağrısında yeniden
başarısız olursa `/new` yalnızca geçerli denemeyi temizliyordur; eski iş
parçacıklarının ve kanca kayıtlarının kaldırılması için Codex app-server'ı
veya OpenClaw Gateway'i yeniden başlatın, ardından yeni bir oturumda tekrar
deneyin.

**Tur başlangıcındaki otomatik yükleme bir kaynağı reddediyor.** Bu
bilinçlidir. Önce kaynağı açık `/codex computer-use install --source
<marketplace-source>` komutuyla ekleyin; ardından gelecekteki tur başlangıcı
otomatik yüklemeleri keşfedilen yerel pazaryerini kullanabilir.

## İlgili

- [Codex çalıştırma düzeneği](/tr/plugins/codex-harness)
- [Peekaboo köprüsü](/tr/platforms/mac/peekaboo)
- [iOS uygulaması](/tr/platforms/ios)
