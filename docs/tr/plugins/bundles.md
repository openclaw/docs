---
read_when:
    - Codex, Claude veya Cursor ile uyumlu bir paket yüklemek istiyorsunuz
    - OpenClaw'ın paket içeriğini yerel özelliklere nasıl eşlediğini anlamanız gerekir
    - Paket algılamasında veya eksik yeteneklerde hata ayıklıyorsunuz
summary: Codex, Claude ve Cursor paketlerini OpenClaw Plugin’leri olarak kurun ve kullanın
title: Plugin paketleri
x-i18n:
    generated_at: "2026-04-30T09:33:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d03643c3029f5c6c81fab3aa1c00accba94da64a834e381b29db8f405d6bdee
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw üç harici ekosistemden Plugin yükleyebilir: **Codex**, **Claude**
ve **Cursor**. Bunlara **paketler** denir; OpenClaw'ın Skills, hook'lar ve MCP araçları gibi yerel özelliklere eşlediği içerik ve meta veri paketleridir.

<Info>
  Paketler, yerel OpenClaw Plugin'leriyle **aynı değildir**. Yerel Plugin'ler
  süreç içinde çalışır ve herhangi bir yetenek kaydedebilir. Paketler ise seçici
  özellik eşlemesi ve daha dar bir güven sınırı olan içerik paketleridir.
</Info>

## Paketler neden vardır

Birçok kullanışlı Plugin Codex, Claude veya Cursor biçiminde yayımlanır. OpenClaw,
yazarların bunları yerel OpenClaw Plugin'leri olarak yeniden yazmasını istemek
yerine bu biçimleri algılar ve desteklenen içeriklerini yerel özellik kümesine
eşler. Bu, bir Claude komut paketi veya Codex skill paketi yükleyip hemen
kullanabileceğiniz anlamına gelir.

## Paket yükleme

<Steps>
  <Step title="Install from a directory, archive, or marketplace">
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

  <Step title="Verify detection">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Paketler, `codex`, `claude` veya `cursor` alt türüyle birlikte `Format: bundle` olarak görünür.

  </Step>

  <Step title="Restart and use">
    ```bash
    openclaw gateway restart
    ```

    Eşlenen özellikler (Skills, hook'lar, MCP araçları, LSP varsayılanları) sonraki oturumda kullanılabilir.

  </Step>
</Steps>

## OpenClaw paketlerden neleri eşler

Bugün her paket özelliği OpenClaw içinde çalışmaz. Aşağıda nelerin çalıştığı ve
nelerin algılanıp henüz bağlanmadığı yer alır.

### Şu anda desteklenenler

| Özellik       | Nasıl eşlenir                                                                                 | Geçerli olduğu yer |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skill içeriği | Paket skill kökleri normal OpenClaw Skills olarak yüklenir                                           | Tüm biçimler    |
| Komutlar      | `commands/` ve `.cursor/commands/`, skill kökleri olarak ele alınır                                  | Claude, Cursor |
| Hook paketleri    | OpenClaw tarzı `HOOK.md` + `handler.ts` yerleşimleri                                             | Codex          |
| MCP araçları     | Paket MCP yapılandırması gömülü Pi ayarlarına birleştirilir; desteklenen stdio ve HTTP sunucuları yüklenir | Tüm biçimler    |
| LSP sunucuları   | Claude `.lsp.json` ve manifest içinde bildirilen `lspServers`, gömülü Pi LSP varsayılanlarına birleştirilir  | Claude         |
| Ayarlar      | Claude `settings.json`, gömülü Pi varsayılanları olarak içe aktarılır                                     | Claude         |

#### Skill içeriği

- paket skill kökleri normal OpenClaw skill kökleri olarak yüklenir
- Claude `commands` kökleri ek skill kökleri olarak ele alınır
- Cursor `.cursor/commands` kökleri ek skill kökleri olarak ele alınır

Bu, Claude markdown komut dosyalarının normal OpenClaw skill yükleyicisi üzerinden
çalıştığı anlamına gelir. Cursor komut markdown'u aynı yol üzerinden çalışır.

#### Hook paketleri

- paket hook kökleri, **yalnızca** normal OpenClaw hook paketi yerleşimini
  kullandıklarında çalışır. Bugün bu öncelikle Codex uyumlu durumdur:
  - `HOOK.md`
  - `handler.ts` veya `handler.js`

#### Pi için MCP

- etkin paketler MCP sunucu yapılandırması katkısı sağlayabilir
- OpenClaw, paket MCP yapılandırmasını etkin gömülü Pi ayarlarına
  `mcpServers` olarak birleştirir
- OpenClaw, desteklenen paket MCP araçlarını gömülü Pi agent dönüşleri sırasında
  stdio sunucularını başlatarak veya HTTP sunucularına bağlanarak açığa çıkarır
- `coding` ve `messaging` araç profilleri varsayılan olarak paket MCP araçlarını
  içerir; bir agent veya gateway için kapsam dışına çıkmak üzere `tools.deny: ["bundle-mcp"]` kullanın
- proje yerel Pi ayarları paket varsayılanlarından sonra hâlâ uygulanır, böylece
  çalışma alanı ayarları gerektiğinde paket MCP girdilerini geçersiz kılabilir
- paket MCP araç katalogları kayıt öncesinde belirlenimci olarak sıralanır; bu
  yüzden upstream `listTools()` sırası değişiklikleri prompt-cache araç bloklarını sarsmaz

##### Taşıma türleri

MCP sunucuları stdio veya HTTP taşımasını kullanabilir:

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
- `type: "http"` CLI yerel downstream biçimidir; OpenClaw yapılandırmasında `transport: "streamable-http"` kullanın. `openclaw mcp set` ve `openclaw doctor --fix` yaygın takma adı normalleştirir.
- yalnızca `http:` ve `https:` URL şemalarına izin verilir
- `headers` değerleri `${ENV_VAR}` interpolasyonunu destekler
- hem `command` hem de `url` içeren bir sunucu girdisi reddedilir
- URL kimlik bilgileri (userinfo ve sorgu parametreleri), araç
  açıklamalarından ve günlüklerden redakte edilir
- `connectionTimeoutMs`, hem stdio hem de HTTP taşımaları için varsayılan 30 saniyelik bağlantı zaman aşımını geçersiz kılar

##### Araç adlandırma

OpenClaw, paket MCP araçlarını sağlayıcı açısından güvenli adlarla
`serverName__toolName` biçiminde kaydeder. Örneğin, `"vigil-harbor"` anahtarlı ve
`memory_search` aracı sunan bir sunucu `vigil-harbor__memory_search` olarak kaydedilir.

- `A-Za-z0-9_-` dışındaki karakterler `-` ile değiştirilir
- sunucu önekleri 30 karakterle sınırlıdır
- tam araç adları 64 karakterle sınırlıdır
- boş sunucu adları `mcp` değerine geri döner
- çakışan temizlenmiş adlar sayısal soneklerle ayrıştırılır
- yinelenen Pi dönüşlerini önbellek açısından kararlı tutmak için son açığa çıkarılan araç sırası güvenli ada göre belirlenimcidir
- profil filtreleme, bir paket MCP sunucusundan gelen tüm araçları `bundle-mcp`
  tarafından Plugin'e ait olarak ele alır; bu nedenle profil izin listeleri ve red listeleri
  tek tek açığa çıkarılmış araç adlarını veya `bundle-mcp` Plugin anahtarını içerebilir

#### Gömülü Pi ayarları

- Claude `settings.json`, paket etkin olduğunda varsayılan gömülü Pi ayarları olarak içe aktarılır
- OpenClaw, shell geçersiz kılma anahtarlarını uygulamadan önce temizler

Temizlenen anahtarlar:

- `shellPath`
- `shellCommandPrefix`

#### Gömülü Pi LSP

- etkin Claude paketleri LSP sunucu yapılandırması katkısı sağlayabilir
- OpenClaw, `.lsp.json` ve manifest içinde bildirilen tüm `lspServers` yollarını yükler
- paket LSP yapılandırması etkin gömülü Pi LSP varsayılanlarına birleştirilir
- bugün yalnızca desteklenen stdio destekli LSP sunucuları çalıştırılabilir; desteklenmeyen
  taşımalar yine de `openclaw plugins inspect <id>` içinde görünür

### Algılanan ancak yürütülmeyenler

Bunlar tanınır ve tanılarda gösterilir, ancak OpenClaw bunları çalıştırmaz:

- Claude `agents`, `hooks.json` otomasyonu, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Yetenek raporlaması dışındaki Codex satır içi/uygulama meta verileri

## Paket biçimleri

<AccordionGroup>
  <Accordion title="Codex bundles">
    İşaretçiler: `.codex-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex paketleri, skill kökleri ve OpenClaw tarzı hook paketi dizinleri
    (`HOOK.md` + `handler.ts`) kullandıklarında OpenClaw'a en iyi şekilde uyar.

  </Accordion>

  <Accordion title="Claude bundles">
    İki algılama modu:

    - **Manifest tabanlı:** `.claude-plugin/plugin.json`
    - **Manifestsiz:** varsayılan Claude yerleşimi (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude'a özgü davranış:

    - `commands/`, skill içeriği olarak ele alınır
    - `settings.json`, gömülü Pi ayarlarına içe aktarılır (shell geçersiz kılma anahtarları temizlenir)
    - `.mcp.json`, desteklenen stdio araçlarını gömülü Pi'ye açığa çıkarır
    - `.lsp.json` ve manifest içinde bildirilen `lspServers` yolları gömülü Pi LSP varsayılanlarına yüklenir
    - `hooks/hooks.json` algılanır ancak yürütülmez
    - Manifest içindeki özel bileşen yolları eklemelidir (varsayılanları genişletir, onların yerine geçmez)

  </Accordion>

  <Accordion title="Cursor bundles">
    İşaretçiler: `.cursor-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/`, skill içeriği olarak ele alınır
    - `.cursor/rules/`, `.cursor/agents/` ve `.cursor/hooks.json` yalnızca algılama amaçlıdır

  </Accordion>
</AccordionGroup>

## Algılama önceliği

OpenClaw önce yerel Plugin biçimini kontrol eder:

1. `openclaw.plugin.json` veya `openclaw.extensions` içeren geçerli `package.json` — **yerel Plugin** olarak ele alınır
2. Paket işaretçileri (`.codex-plugin/`, `.claude-plugin/` veya varsayılan Claude/Cursor yerleşimi) — **paket** olarak ele alınır

Bir dizin ikisini de içeriyorsa OpenClaw yerel yolu kullanır. Bu, çift biçimli
paketlerin kısmen paket olarak yüklenmesini önler.

## Çalışma zamanı bağımlılıkları ve temizlik

- Üçüncü taraf uyumlu paketler başlangıçta `npm install` onarımı almaz. Bunlar
  `openclaw plugins install` üzerinden yüklenmeli ve ihtiyaç duydukları her şeyi
  yüklü Plugin dizininde taşımalıdır.
- OpenClaw'a ait paketlenmiş bundled Plugin'lerin dar bir istisnası vardır: biri
  etkinleştirildiğinde, Gateway başlangıcı import öncesinde eksik bildirilen çalışma zamanı bağımlılıklarını onarabilir.
  Operatörler bu aşamayı `openclaw plugins deps` ile inceleyebilir veya onarabilir.
- Yayın hattı, mümkün olduğunda eksiksiz bir paketlenmiş bağımlılık yükü göndermekten
  hâlâ sorumludur ([Yayımlama](/tr/reference/RELEASING) içindeki postpublish doğrulama kuralına bakın).

## Güvenlik

Paketlerin güven sınırı yerel Plugin'lerden daha dardır:

- OpenClaw rastgele paket çalışma zamanı modüllerini süreç içinde yüklemez
- Skills ve hook paketi yolları Plugin kökü içinde kalmalıdır (sınır denetimli)
- Ayar dosyaları aynı sınır denetimleriyle okunur
- Desteklenen stdio MCP sunucuları alt süreçler olarak başlatılabilir

Bu, paketleri varsayılan olarak daha güvenli kılar, ancak üçüncü taraf paketleri
yine de açığa çıkardıkları özellikler bakımından güvenilir içerik olarak değerlendirmelisiniz.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Bundle is detected but capabilities do not run">
    `openclaw plugins inspect <id>` çalıştırın. Bir yetenek listelenmiş ancak
    bağlı değil olarak işaretlenmişse bu bir ürün sınırıdır; bozuk kurulum değildir.
  </Accordion>

  <Accordion title="Claude command files do not appear">
    Paketin etkin olduğundan ve markdown dosyalarının algılanan bir
    `commands/` veya `skills/` kökü içinde olduğundan emin olun.
  </Accordion>

  <Accordion title="Claude settings do not apply">
    Yalnızca `settings.json` içindeki gömülü Pi ayarları desteklenir. OpenClaw,
    paket ayarlarını ham yapılandırma yamaları olarak ele almaz.
  </Accordion>

  <Accordion title="Claude hooks do not execute">
    `hooks/hooks.json` yalnızca algılama amaçlıdır. Çalıştırılabilir hook'lara
    ihtiyacınız varsa OpenClaw hook paketi yerleşimini kullanın veya yerel bir Plugin gönderin.
  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin'leri Yükleme ve Yapılandırma](/tr/tools/plugin)
- [Plugin Geliştirme](/tr/plugins/building-plugins) — yerel Plugin oluşturma
- [Plugin Manifesti](/tr/plugins/manifest) — yerel manifest şeması
