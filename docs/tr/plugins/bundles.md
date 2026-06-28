---
read_when:
    - Codex, Claude veya Cursor uyumlu bir paket yüklemek istiyorsunuz
    - OpenClaw'ın paket içeriğini yerel özelliklere nasıl eşlediğini anlamanız gerekir
    - Paket algılamasında veya eksik yeteneklerde hata ayıklıyorsunuz
summary: Codex, Claude ve Cursor paketlerini OpenClaw plugin'leri olarak kurun ve kullanın
title: Plugin paketleri
x-i18n:
    generated_at: "2026-06-28T00:50:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b26915603db9d4d4422f4d1542f033be02eb83c5ffefcf93cac7968f624f4969
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw, üç harici ekosistemden Plugin yükleyebilir: **Codex**, **Claude**
ve **Cursor**. Bunlara **paketler** denir; OpenClaw'ın Skills, kancalar ve MCP araçları gibi yerel özelliklere eşlediği içerik ve meta veri paketleridir.

<Info>
  Paketler, yerel OpenClaw Plugin'leriyle **aynı değildir**. Yerel Plugin'ler
  süreç içinde çalışır ve herhangi bir yetenek kaydedebilir. Paketler ise
  seçici özellik eşlemesine ve daha dar bir güven sınırına sahip içerik paketleridir.
</Info>

## Paketler neden var?

Birçok kullanışlı Plugin, Codex, Claude veya Cursor biçiminde yayımlanır. OpenClaw,
yazarlardan bunları yerel OpenClaw Plugin'leri olarak yeniden yazmalarını istemek
yerine, bu biçimleri algılar ve desteklenen içeriklerini yerel özellik kümesine
eşler. Bu, bir Claude komut paketini veya Codex Skills paketini yükleyip hemen
kullanabileceğiniz anlamına gelir.

## Paket yükleme

<Steps>
  <Step title="Bir dizinden, arşivden veya pazaryerinden yükleyin">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Algılamayı doğrulayın">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Paketler, `codex`, `claude` veya `cursor` alt türüyle birlikte `Format: bundle` olarak görünür.

  </Step>

  <Step title="Yeniden başlatın ve kullanın">
    ```bash
    openclaw gateway restart
    ```

    Eşlenen özellikler (Skills, kancalar, MCP araçları, LSP varsayılanları) sonraki oturumda kullanılabilir.

  </Step>
</Steps>

## OpenClaw paketlerden neleri eşler?

Bugün her paket özelliği OpenClaw içinde çalışmaz. Aşağıda çalışanlar ve
algılanıp henüz bağlanmamış olanlar yer alır.

### Şu anda desteklenenler

| Özellik       | Nasıl eşlenir                                                                                       | Şunlar için geçerli |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Skills içeriği | Paket Skills kökleri normal OpenClaw Skills olarak yüklenir                                                 | Tüm biçimler    |
| Komutlar      | `commands/` ve `.cursor/commands/` Skills kökleri olarak ele alınır                                        | Claude, Cursor |
| Kanca paketleri    | OpenClaw tarzı `HOOK.md` + `handler.ts` yerleşimleri                                                   | Codex          |
| MCP araçları     | Paket MCP yapılandırması gömülü OpenClaw ayarlarına birleştirilir; desteklenen stdio ve HTTP sunucuları yüklenir | Tüm biçimler    |
| LSP sunucuları   | Claude `.lsp.json` ve manifest içinde bildirilen `lspServers`, gömülü OpenClaw LSP varsayılanlarına birleştirilir  | Claude         |
| Ayarlar      | Claude `settings.json`, gömülü OpenClaw varsayılanları olarak içe aktarılır                                     | Claude         |

#### Skills içeriği

- paket Skills kökleri normal OpenClaw Skills kökleri olarak yüklenir
- Claude `commands` kökleri ek Skills kökleri olarak ele alınır
- Cursor `.cursor/commands` kökleri ek Skills kökleri olarak ele alınır

Bu, Claude markdown komut dosyalarının normal OpenClaw Skills yükleyicisi
üzerinden çalıştığı anlamına gelir. Cursor komut markdown'ı da aynı yol üzerinden çalışır.

#### Kanca paketleri

- paket kanca kökleri **yalnızca** normal OpenClaw kanca paketi
  yerleşimini kullandıklarında çalışır. Bugün bu öncelikle Codex uyumlu durumdur:
  - `HOOK.md`
  - `handler.ts` veya `handler.js`

#### Gömülü OpenClaw için MCP

- etkin paketler MCP sunucu yapılandırması katkısında bulunabilir
- OpenClaw, paket MCP yapılandırmasını etkin gömülü OpenClaw ayarlarına
  `mcpServers` olarak birleştirir
- OpenClaw, gömülü OpenClaw ajan dönüşleri sırasında desteklenen paket MCP araçlarını
  stdio sunucuları başlatarak veya HTTP sunucularına bağlanarak sunar
- `coding` ve `messaging` araç profilleri varsayılan olarak paket MCP araçlarını
  içerir; bir ajan veya Gateway için devre dışı bırakmak üzere `tools.deny: ["bundle-mcp"]` kullanın
- proje yerelindeki gömülü ajan ayarları paket varsayılanlarından sonra hâlâ uygulanır; bu nedenle çalışma alanı
  ayarları gerektiğinde paket MCP girdilerini geçersiz kılabilir
- paket MCP araç katalogları kayıttan önce deterministik olarak sıralanır; böylece
  yukarı akış `listTools()` sıralama değişiklikleri prompt önbelleği araç bloklarını sürekli değiştirmez

##### Aktarımlar

MCP sunucuları stdio veya HTTP aktarımı kullanabilir:

**Stdio** bir alt süreç başlatır:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** varsayılan olarak `sse` üzerinden, istendiğinde ise `streamable-http` ile çalışan bir MCP sunucusuna bağlanır:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport`, `"streamable-http"` veya `"sse"` olarak ayarlanabilir; atlandığında OpenClaw `sse` kullanır
- `type: "http"` CLI yerel bir alt akış şeklidir; OpenClaw yapılandırmasında `transport: "streamable-http"` kullanın. `openclaw mcp set` ve `openclaw doctor --fix` yaygın takma adı normalleştirir.
- yalnızca `http:` ve `https:` URL şemalarına izin verilir
- `headers` değerleri `${ENV_VAR}` ara değerlemesini destekler
- hem `command` hem de `url` içeren bir sunucu girdisi reddedilir
- URL kimlik bilgileri (userinfo ve sorgu parametreleri), araç
  açıklamalarından ve günlüklerden çıkarılır
- `connectionTimeoutMs`, hem stdio hem de HTTP aktarımları için varsayılan
  30 saniyelik bağlantı zaman aşımını geçersiz kılar

##### Araç adlandırma

OpenClaw, paket MCP araçlarını `serverName__toolName` biçiminde sağlayıcı güvenli
adlarla kaydeder. Örneğin, `"vigil-harbor"` anahtarına sahip ve `memory_search`
aracını sunan bir sunucu `vigil-harbor__memory_search` olarak kaydedilir.

- `A-Za-z0-9_-` dışındaki karakterler `-` ile değiştirilir
- harf olmayan bir karakterle başlayacak parçalar harf öneki alır; böylece `12306` gibi sayısal
  sunucu anahtarları sağlayıcı güvenli araç öneklerine dönüşür
- sunucu önekleri 30 karakterle sınırlıdır
- tam araç adları 64 karakterle sınırlıdır
- boş sunucu adları `mcp` değerine geri döner
- çakışan temizlenmiş adlar sayısal soneklerle ayırt edilir
- son sunulan araç sırası, tekrarlanan gömülü ajan
  dönüşlerini önbellek açısından kararlı tutmak için güvenli ada göre deterministiktir
- profil filtreleme, bir paket MCP sunucusundaki tüm araçları `bundle-mcp`
  tarafından Plugin sahipliğinde kabul eder; bu nedenle profil izin listeleri ve engelleme listeleri tek tek
  sunulan araç adlarını veya `bundle-mcp` Plugin anahtarını içerebilir

#### Gömülü OpenClaw ayarları

- Claude `settings.json`, paket etkin olduğunda varsayılan gömülü OpenClaw ayarları olarak içe aktarılır
- OpenClaw, kabuk geçersiz kılma anahtarlarını uygulamadan önce temizler

Temizlenen anahtarlar:

- `shellPath`
- `shellCommandPrefix`

#### Gömülü OpenClaw LSP

- etkin Claude paketleri LSP sunucu yapılandırması katkısında bulunabilir
- OpenClaw, `.lsp.json` ile manifest içinde bildirilen tüm `lspServers` yollarını yükler
- paket LSP yapılandırması, etkin gömülü OpenClaw LSP varsayılanlarına birleştirilir
- bugün yalnızca desteklenen stdio tabanlı LSP sunucuları çalıştırılabilir; desteklenmeyen
  aktarımlar yine de `openclaw plugins inspect <id>` içinde görünür

### Algılanan ama yürütülmeyenler

Bunlar tanınır ve tanılamalarda gösterilir, ancak OpenClaw bunları çalıştırmaz:

- Claude `agents`, `hooks.json` otomasyonu, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Yetenek raporlamasının ötesindeki Codex satır içi/uygulama meta verileri

## Paket biçimleri

<AccordionGroup>
  <Accordion title="Codex paketleri">
    İşaretçiler: `.codex-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex paketleri, Skills kökleri ve OpenClaw tarzı kanca paketi
    dizinleri (`HOOK.md` + `handler.ts`) kullandıklarında OpenClaw'a en iyi uyar.

  </Accordion>

  <Accordion title="Claude paketleri">
    İki algılama modu:

    - **Manifest tabanlı:** `.claude-plugin/plugin.json`
    - **Manifestsiz:** varsayılan Claude yerleşimi (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude'a özgü davranış:

    - `commands/` Skills içeriği olarak ele alınır
    - `settings.json`, gömülü OpenClaw ayarlarına içe aktarılır (kabuk geçersiz kılma anahtarları temizlenir)
    - `.mcp.json`, desteklenen stdio araçlarını gömülü OpenClaw'a sunar
    - `.lsp.json` ile manifest içinde bildirilen `lspServers` yolları gömülü OpenClaw LSP varsayılanlarına yüklenir
    - `hooks/hooks.json` algılanır ancak yürütülmez
    - Manifest içindeki özel bileşen yolları eklemelidir (varsayılanları genişletir, onların yerine geçmez)

  </Accordion>

  <Accordion title="Cursor paketleri">
    İşaretçiler: `.cursor-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` Skills içeriği olarak ele alınır
    - `.cursor/rules/`, `.cursor/agents/` ve `.cursor/hooks.json` yalnızca algılama amaçlıdır

  </Accordion>
</AccordionGroup>

## Algılama önceliği

OpenClaw önce yerel Plugin biçimini kontrol eder:

1. `openclaw.plugin.json` veya `openclaw.extensions` içeren geçerli `package.json` — **yerel Plugin** olarak ele alınır
2. Paket işaretçileri (`.codex-plugin/`, `.claude-plugin/` veya varsayılan Claude/Cursor yerleşimi) — **paket** olarak ele alınır

Bir dizin ikisini de içeriyorsa OpenClaw yerel yolu kullanır. Bu, çift biçimli
paketlerin kısmen paket olarak yüklenmesini engeller.

## Çalışma zamanı bağımlılıkları ve temizlik

- Üçüncü taraf uyumlu paketler başlangıçta `npm install` onarımı almaz. Bunlar
  `openclaw plugins install` üzerinden yüklenmeli ve ihtiyaç duydukları her şeyi
  yüklü Plugin dizininde sağlamalıdır.
- OpenClaw sahipliğindeki paketlenmiş Plugin'ler ya çekirdekte hafif olarak gönderilir ya da
  Plugin yükleyicisi üzerinden indirilebilir. Gateway başlangıcı bunlar için asla
  paket yöneticisi çalıştırmaz.
- `openclaw doctor --fix`, eski aşamalandırılmış bağımlılık dizinlerini kaldırır ve
  yapılandırma bunlara başvurduğunda yerel Plugin dizininde eksik olan indirilebilir
  Plugin'leri kurtarabilir.

## Güvenlik

Paketlerin güven sınırı yerel Plugin'lere göre daha dardır:

- OpenClaw, rastgele paket çalışma zamanı modüllerini süreç içinde **yüklemez**
- Skills ve kanca paketi yolları Plugin kökü içinde kalmalıdır (sınır kontrolü yapılır)
- Ayar dosyaları aynı sınır kontrolleriyle okunur
- Desteklenen stdio MCP sunucuları alt süreçler olarak başlatılabilir

Bu, paketleri varsayılan olarak daha güvenli kılar; ancak üçüncü taraf
paketleri yine de sundukları özellikler için güvenilir içerik olarak değerlendirmelisiniz.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Paket algılanıyor ancak yetenekler çalışmıyor">
    `openclaw plugins inspect <id>` çalıştırın. Bir yetenek listelenmiş ancak
    bağlanmamış olarak işaretlenmişse bu bir ürün sınırıdır; bozuk yükleme değildir.
  </Accordion>

  <Accordion title="Claude komut dosyaları görünmüyor">
    Paketin etkin olduğundan ve markdown dosyalarının algılanan bir
    `commands/` veya `skills/` kökü içinde olduğundan emin olun.
  </Accordion>

  <Accordion title="Claude ayarları uygulanmıyor">
    Yalnızca `settings.json` içindeki gömülü OpenClaw ayarları desteklenir. OpenClaw,
    paket ayarlarını ham yapılandırma yamaları olarak ele almaz.
  </Accordion>

  <Accordion title="Claude kancaları yürütülmüyor">
    `hooks/hooks.json` yalnızca algılama amaçlıdır. Çalıştırılabilir kancalara ihtiyacınız varsa
    OpenClaw kanca paketi yerleşimini kullanın veya yerel bir Plugin gönderin.
  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin'leri Yükleme ve Yapılandırma](/tr/tools/plugin)
- [Plugin Oluşturma](/tr/plugins/building-plugins) — yerel bir Plugin oluşturun
- [Plugin Manifesti](/tr/plugins/manifest) — yerel manifest şeması
