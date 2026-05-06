---
read_when:
    - Codex modundaki OpenClaw ajanlarının Codex Computer Use kullanmasını istiyorsunuz
    - Codex Computer Use, PeekabooBridge ve doğrudan cua-driver MCP arasında karar veriyorsunuz
    - Codex Computer Use ile doğrudan bir cua-driver MCP kurulumu arasında karar veriyorsunuz
    - Paketle birlikte gelen Codex Plugin'i için computerUse yapılandırıyorsunuz
    - /codex computer-use status veya install için sorun gideriyorsunuz
summary: Codex modundaki OpenClaw ajanları için Codex Computer Use'ı ayarlama
title: Codex Bilgisayar Kullanımı
x-i18n:
    generated_at: "2026-05-06T09:24:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d23cd0646336e61c77357f769bc1d7ab47a401bcc484f4d16130b942db9f1f4
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use, yerel masaüstü denetimi için Codex-native bir MCP plugin'idir. OpenClaw
masaüstü uygulamasını paketlemez, masaüstü eylemlerini kendisi yürütmez veya
Codex izinlerini atlamaz. Paketlenen `codex` Plugin yalnızca Codex app-server'ı hazırlar:
Codex Plugin desteğini etkinleştirir, yapılandırılan Codex
Computer Use Plugin'ini bulur veya kurar, `computer-use` MCP sunucusunun kullanılabilir olduğunu denetler ve
ardından Codex-mode dönüşleri sırasında native MCP tool çağrılarının sahipliğini Codex'e bırakır.

OpenClaw zaten native Codex harness kullanıyorken bu sayfayı kullanın. Çalışma zamanı
kurulumunun kendisi için [Codex harness](/tr/plugins/codex-harness) bölümüne bakın.

## OpenClaw.app ve Peekaboo

OpenClaw.app'in Peekaboo entegrasyonu Codex Computer Use'dan ayrıdır. macOS
uygulaması bir PeekabooBridge soketi barındırabilir; böylece `peekaboo` CLI, Peekaboo'nun kendi
otomasyon araçları için uygulamanın yerel Accessibility ve Screen Recording izinlerini yeniden kullanabilir.
Bu bridge, Codex Computer Use'u kurmaz veya proxy'lemez ve
Codex Computer Use, PeekabooBridge soketi üzerinden çağrı yapmaz.

OpenClaw.app'in Peekaboo CLI otomasyonu için izinlerin farkında olan bir host olmasını
istediğinizde [Peekaboo bridge](/tr/platforms/mac/peekaboo) kullanın. Bir
Codex-mode OpenClaw agent'ın dönüş başlamadan önce Codex'in native `computer-use` MCP Plugin'ine
sahip olması gerektiğinde bu sayfayı kullanın.

## iOS uygulaması

iOS uygulaması Codex Computer Use'dan ayrıdır. Codex `computer-use` MCP sunucusunu
kurmaz veya proxy'lemez ve bir masaüstü denetimi backend'i değildir.
Bunun yerine iOS uygulaması bir OpenClaw Node'u olarak bağlanır ve mobil
yetenekleri `canvas.*`, `camera.*`, `screen.*`,
`location.*` ve `talk.*` gibi Node komutları üzerinden sunar.

Bir agent'ın iPhone Node'unu Gateway üzerinden yönetmesini istediğinizde [iOS](/tr/platforms/ios)
kullanın. Bir Codex-mode agent'ın yerel macOS masaüstünü
Codex'in native Computer Use Plugin'i üzerinden denetlemesi gerektiğinde bu sayfayı kullanın.

## Doğrudan cua-driver MCP

Codex Computer Use, masaüstü denetimini sunmanın tek yolu değildir. OpenClaw tarafından yönetilen
çalışma zamanlarının TryCua'nın driver'ını doğrudan çağırmasını istiyorsanız,
Codex'e özgü marketplace akışı yerine OpenClaw'ın MCP kayıt defteri üzerinden upstream
`cua-driver mcp` sunucusunu kullanın.

`cua-driver` kurulduktan sonra, ondan OpenClaw komutunu isteyin:

```bash
cua-driver mcp-config --client openclaw
```

veya stdio sunucusunu kendiniz kaydedin:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Bu yol, driver şemaları ve yapılandırılmış MCP yanıtları dahil olmak üzere upstream MCP tool
yüzeyini olduğu gibi korur. CUA driver'ının normal bir OpenClaw MCP sunucusu olarak
kullanılabilir olmasını istediğinizde bunu kullanın. Codex app-server'ın Plugin kurulumu,
MCP yeniden yüklemeleri ve Codex-mode dönüşleri içindeki native tool çağrılarına sahip olması
gerektiğinde bu sayfadaki Codex Computer Use kurulumunu kullanın.

CUA'nın driver'ı macOS'a özgüdür ve yine de uygulamasının istediği Accessibility ve
Screen Recording gibi yerel macOS izinlerini gerektirir. OpenClaw
`cua-driver` kurmaz, bu izinleri vermez veya upstream
driver'ın güvenlik modelini atlamaz.

## Hızlı kurulum

Codex-mode dönüşlerinin bir thread başlamadan önce Computer Use'a sahip olması gerektiğinde
`plugins.entries.codex.config.computerUse` ayarlayın:

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

Bu yapılandırmayla OpenClaw, her Codex-mode dönüşünden önce Codex app-server'ı denetler.
Computer Use eksikse ancak Codex app-server kurulabilir bir marketplace'i zaten keşfetmişse,
OpenClaw Codex app-server'dan Plugin'i kurmasını veya yeniden etkinleştirmesini ve MCP sunucularını
yeniden yüklemesini ister. macOS'ta eşleşen bir marketplace kayıtlı değilse
ve standart Codex uygulama paketi varsa, OpenClaw başarısız olmadan önce
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` konumundaki
paketlenen Codex marketplace'i kaydetmeyi de dener. Kurulum yine de MCP sunucusunu
kullanılabilir hale getiremezse, dönüş thread başlamadan önce başarısız olur.

Mevcut oturumlar çalışma zamanlarını ve Codex thread bağlamalarını korur. `agentRuntime`
veya Computer Use yapılandırmasını değiştirdikten sonra test etmeden önce etkilenen sohbette
`/new` veya `/reset` kullanın.

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
bir marketplace kaynağı ekler, yapılandırılan Plugin'i Codex app-server üzerinden kurar
veya yeniden etkinleştirir, MCP sunucularını yeniden yükler ve MCP sunucusunun tool'lar sunduğunu doğrular.

## Marketplace seçenekleri

OpenClaw, Codex'in kendisinin sunduğu aynı app-server API'sini kullanır.
Marketplace alanları, Codex'in `computer-use` öğesini nerede bulacağını seçer.

| Alan                 | Ne zaman kullanılır                                          | Kurulum desteği                                          |
| -------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| Marketplace alanı yok | Codex app-server'ın zaten bildiği marketplace'leri kullanmasını istersiniz. | Evet, app-server yerel bir marketplace döndürdüğünde.    |
| `marketplaceSource`  | Codex app-server'ın ekleyebileceği bir Codex marketplace kaynağınız vardır. | Evet, açık `/codex computer-use install` için.           |
| `marketplacePath`    | Host üzerindeki yerel marketplace dosya yolunu zaten biliyorsunuzdur. | Evet, açık kurulum ve dönüş başlangıcı otomatik kurulumu için. |
| `marketplaceName`    | Zaten kayıtlı bir marketplace'i adına göre seçmek istersiniz. | Yalnızca seçilen marketplace'in yerel bir yolu varsa evet. |

Yeni Codex home'larının resmi marketplace'lerini hazırlaması için kısa bir süre gerekebilir.
Kurulum sırasında OpenClaw, `marketplaceDiscoveryTimeoutMs` milisaniyeye kadar
`plugin/list` sorgular. Varsayılan değer 60 saniyedir.

Bilinen birden çok marketplace Computer Use içeriyorsa OpenClaw önce
`openai-bundled`, sonra `openai-curated`, ardından `local` seçeneğini tercih eder. Bilinmeyen belirsiz
eşleşmeler güvenli şekilde başarısız olur ve `marketplaceName` veya `marketplacePath`
ayarlamanızı ister.

## Paketlenen macOS marketplace

Güncel Codex masaüstü derlemeleri Computer Use'u burada paketler:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

`computerUse.autoInstall` true olduğunda ve `computer-use` içeren hiçbir marketplace
kayıtlı olmadığında OpenClaw standart paketlenmiş marketplace kökünü otomatik olarak eklemeyi
dener:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Bunu Codex ile bir shell'den açıkça da kaydedebilirsiniz:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Standart olmayan bir Codex uygulama yolu kullanıyorsanız `computerUse.marketplacePath` değerini
yerel bir marketplace dosya yoluna ayarlayın veya `/codex computer-use install --source
<marketplace-source>` komutunu bir kez çalıştırın.

## Uzak katalog sınırı

Codex app-server uzak-only katalog girdilerini listeleyebilir ve okuyabilir, ancak şu anda
uzak `plugin/install` desteği yoktur. Bu, `marketplaceName` değerinin durum denetimleri için
uzak-only bir marketplace seçebileceği, ancak kurulumların ve yeniden etkinleştirmelerin
yine de `marketplaceSource` veya `marketplacePath` üzerinden yerel bir marketplace gerektirdiği anlamına gelir.

Durum, Plugin'in uzak bir Codex marketplace içinde kullanılabilir olduğunu ancak uzak
kurulumun desteklenmediğini söylüyorsa, kurulumu yerel bir kaynak veya yol ile çalıştırın:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Yapılandırma başvurusu

| Alan                            | Varsayılan     | Anlam                                                                          |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | çıkarımlanır   | Computer Use'u zorunlu kılar. Başka bir Computer Use alanı ayarlandığında varsayılan olarak true olur. |
| `autoInstall`                   | false          | Dönüş başlangıcında zaten keşfedilmiş marketplace'lerden kurar veya yeniden etkinleştirir. |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Kurulumun Codex app-server marketplace keşfini ne kadar bekleyeceği.           |
| `marketplaceSource`             | ayarlanmamış   | Codex app-server `marketplace/add` öğesine geçirilen kaynak string'i.          |
| `marketplacePath`               | ayarlanmamış   | Plugin'i içeren yerel Codex marketplace dosya yolu.                            |
| `marketplaceName`               | ayarlanmamış   | Seçilecek kayıtlı Codex marketplace adı.                                       |
| `pluginName`                    | `computer-use` | Codex marketplace Plugin adı.                                                  |
| `mcpServerName`                 | `computer-use` | Kurulu Plugin tarafından sunulan MCP sunucu adı.                               |

Dönüş başlangıcı otomatik kurulumu yapılandırılmış `marketplaceSource` değerlerini bilinçli olarak reddeder.
Yeni bir kaynak eklemek açık bir kurulum işlemidir; bu yüzden
`/codex computer-use install --source <marketplace-source>` komutunu bir kez kullanın, ardından
`autoInstall` gelecekte keşfedilmiş yerel marketplace'lerden yeniden etkinleştirmeleri yönetsin.
Dönüş başlangıcı otomatik kurulumu yapılandırılmış bir `marketplacePath` kullanabilir, çünkü bu
zaten host üzerinde yerel bir yoldur.

## OpenClaw'ın denetledikleri

OpenClaw, dahili olarak kararlı bir kurulum gerekçesi bildirir ve kullanıcıya dönük
durumu sohbet için biçimlendirir:

| Gerekçe                      | Anlam                                                  | Sonraki adım                                  |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` false olarak çözümlendi.         | `enabled` veya başka bir Computer Use alanı ayarlayın. |
| `marketplace_missing`        | Eşleşen marketplace yoktu.                             | Kaynak, yol veya marketplace adı yapılandırın. |
| `plugin_not_installed`       | Marketplace var, ancak Plugin kurulu değil.            | Kurulumu çalıştırın veya `autoInstall` etkinleştirin. |
| `plugin_disabled`            | Plugin kurulu ancak Codex yapılandırmasında devre dışı. | Yeniden etkinleştirmek için kurulumu çalıştırın. |
| `remote_install_unsupported` | Seçilen marketplace uzak-only.                         | `marketplaceSource` veya `marketplacePath` kullanın. |
| `mcp_missing`                | Plugin etkin, ancak MCP sunucusu kullanılamıyor.       | Codex Computer Use ve OS izinlerini denetleyin. |
| `ready`                      | Plugin ve MCP tool'ları kullanılabilir.                | Codex-mode dönüşünü başlatın.                 |
| `check_failed`               | Durum denetimi sırasında bir Codex app-server isteği başarısız oldu. | App-server bağlantısını ve log'ları denetleyin. |
| `auto_install_blocked`       | Dönüş başlangıcı kurulumu yeni bir kaynak eklemeyi gerektirirdi. | Önce açık kurulumu çalıştırın.                |

Sohbet çıktısı, Plugin durumunu, MCP sunucu durumunu, marketplace'i, mevcut olduğunda tool'ları
ve başarısız kurulum adımına özgü mesajı içerir.

## macOS izinleri

Computer Use macOS'a özgüdür. Codex'e ait MCP sunucusunun uygulamaları inceleyebilmesi
veya denetleyebilmesi için yerel OS izinleri gerekebilir. OpenClaw Computer Use'un
kurulu olduğunu ancak MCP sunucusunun kullanılamadığını söylüyorsa, önce Codex tarafındaki Computer
Use kurulumunu doğrulayın:

- Codex app-server, masaüstü denetiminin gerçekleşmesi gereken aynı ana makinede
  çalışıyor.
- Computer Use Plugin'i Codex yapılandırmasında etkinleştirilmiş.
- `computer-use` MCP sunucusu Codex app-server MCP durumunda görünüyor.
- macOS, masaüstü denetimi uygulaması için gerekli izinleri vermiş.
- Geçerli ana makine oturumu, denetlenen masaüstüne erişebiliyor.

`computerUse.enabled` true olduğunda OpenClaw kasıtlı olarak kapalı durumda
başarısız olur. Codex modu bir tur, yapılandırmanın gerektirdiği yerel masaüstü
araçları olmadan sessizce devam etmemelidir.

## Sorun giderme

**Durum yüklü olmadığını söylüyor.** `/codex computer-use install` çalıştırın.
Marketplace keşfedilmezse `--source` veya `--marketplace-path` geçirin.

**Durum yüklü ama devre dışı olduğunu söylüyor.** `/codex computer-use install`
komutunu tekrar çalıştırın. Codex app-server kurulumu, Plugin yapılandırmasını
yeniden etkin olarak yazar.

**Durum uzak kurulumun desteklenmediğini söylüyor.** Yerel bir marketplace kaynağı
veya yolu kullanın. Yalnızca uzak katalog girdileri incelenebilir, ancak geçerli
app-server API'si üzerinden yüklenemez.

**Durum MCP sunucusunun kullanılamadığını söylüyor.** MCP sunucularının yeniden
yüklenmesi için kurulumu bir kez yeniden çalıştırın. Kullanılamaz durumda
kalırsa Codex Computer Use uygulamasını, Codex app-server MCP durumunu veya
macOS izinlerini düzeltin.

**Durum veya bir yoklama `computer-use.list_apps` üzerinde zaman aşımına uğruyor.**
Plugin ve MCP sunucusu mevcut, ancak yerel Computer Use köprüsü yanıt vermedi.
Codex Computer Use uygulamasından çıkın veya uygulamayı yeniden başlatın,
gerekirse Codex Desktop'ı yeniden başlatın, ardından yeni bir OpenClaw oturumunda
yeniden deneyin.

**Bir Computer Use aracı `Native hook relay unavailable` diyor.** Codex'e özgü
araç hook'u, yerel köprü veya Gateway yedek yolu üzerinden etkin bir OpenClaw
aktarımına ulaşamadı. `/new` veya `/reset` ile yeni bir OpenClaw oturumu başlatın.
Bu devam ederse eski app-server iş parçacıklarının ve hook kayıtlarının
bırakılması için gateway'i yeniden başlatın, ardından yeniden deneyin.

**Tur başlangıcı otomatik yükleme bir kaynağı reddediyor.** Bu kasıtlıdır. Önce
kaynağı açıkça `/codex computer-use install --source <marketplace-source>` ile
ekleyin; ardından gelecekteki tur başlangıcı otomatik yükleme, keşfedilen yerel
marketplace'i kullanabilir.

## İlgili

- [Codex harness](/tr/plugins/codex-harness)
- [Peekaboo bridge](/tr/platforms/mac/peekaboo)
- [iOS uygulaması](/tr/platforms/ios)
