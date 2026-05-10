---
read_when:
    - Codex, Claude veya Cursor ile uyumlu bir paketi yüklemek istiyorsunuz
    - OpenClaw'ın paket içeriğini yerel özelliklere nasıl eşlediğini anlamanız gerekir
    - Paket algılamasında veya eksik yeteneklerde hata ayıklıyorsunuz
summary: Codex, Claude ve Cursor paketlerini OpenClaw Plugin’leri olarak kurun ve kullanın
title: Plugin paketleri
x-i18n:
    generated_at: "2026-05-10T19:43:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f92bb91369f0f5ddd8d960962e875323bb53173b4faebe4ef453d2f2a08826
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw üç dış ekosistemden Plugin kurabilir: **Codex**, **Claude**,
ve **Cursor**. Bunlara **paketler** denir; OpenClaw'ın Skills, hook'lar ve MCP araçları gibi yerel özelliklere eşlediği içerik ve meta veri paketleridir.

<Info>
  Paketler, yerel OpenClaw Plugin'leriyle **aynı şey değildir**. Yerel Plugin'ler
  işlem içinde çalışır ve herhangi bir yetenek kaydedebilir. Paketler, seçici
  özellik eşlemesine ve daha dar bir güven sınırına sahip içerik paketleridir.
</Info>

## Paketler neden var?

Birçok kullanışlı Plugin Codex, Claude veya Cursor biçiminde yayımlanır. OpenClaw,
yazarların bunları yerel OpenClaw Plugin'leri olarak yeniden yazmasını zorunlu
kılmak yerine bu biçimleri algılar ve desteklenen içeriklerini yerel özellik
kümesine eşler. Bu, bir Claude komut paketini veya bir Codex Skills paketini
kurup hemen kullanabileceğiniz anlamına gelir.

## Bir paket kurma

<Steps>
  <Step title="Bir dizinden, arşivden veya pazaryerinden kurun">
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

    Paketler `Format: bundle` olarak, `codex`, `claude` veya `cursor` alt türüyle gösterilir.

  </Step>

  <Step title="Yeniden başlatın ve kullanın">
    ```bash
    openclaw gateway restart
    ```

    Eşlenen özellikler (Skills, hook'lar, MCP araçları, LSP varsayılanları) sonraki oturumda kullanılabilir.

  </Step>
</Steps>

## OpenClaw paketlerden neleri eşler?

Bugün her paket özelliği OpenClaw'da çalışmaz. Aşağıda nelerin çalıştığı ve
nelerin algılanıp henüz bağlanmadığı gösterilir.

### Şu anda desteklenenler

| Özellik       | Nasıl eşlenir                                                                                 | Geçerli olduğu yerler |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skills içeriği | Paket Skills kökleri normal OpenClaw Skills olarak yüklenir                                           | Tüm biçimler    |
| Komutlar      | `commands/` ve `.cursor/commands/` Skills kökleri olarak değerlendirilir                                  | Claude, Cursor |
| Hook paketleri    | OpenClaw tarzı `HOOK.md` + `handler.ts` düzenleri                                             | Codex          |
| MCP araçları     | Paket MCP yapılandırması gömülü Pi ayarlarıyla birleştirilir; desteklenen stdio ve HTTP sunucuları yüklenir | Tüm biçimler    |
| LSP sunucuları   | Claude `.lsp.json` ve manifestte bildirilen `lspServers`, gömülü Pi LSP varsayılanlarıyla birleştirilir  | Claude         |
| Ayarlar      | Claude `settings.json`, gömülü Pi varsayılanları olarak içe aktarılır                                     | Claude         |

#### Skills içeriği

- paket Skills kökleri normal OpenClaw Skills kökleri olarak yüklenir
- Claude `commands` kökleri ek Skills kökleri olarak değerlendirilir
- Cursor `.cursor/commands` kökleri ek Skills kökleri olarak değerlendirilir

Bu, Claude markdown komut dosyalarının normal OpenClaw Skills yükleyicisi
üzerinden çalıştığı anlamına gelir. Cursor komut markdown'ı aynı yol üzerinden çalışır.

#### Hook paketleri

- paket hook kökleri **yalnızca** normal OpenClaw hook paketi düzenini
  kullandıklarında çalışır. Bugün bu, öncelikle Codex uyumlu durumdur:
  - `HOOK.md`
  - `handler.ts` veya `handler.js`

#### Pi için MCP

- etkinleştirilmiş paketler MCP sunucu yapılandırmasına katkıda bulunabilir
- OpenClaw, paket MCP yapılandırmasını geçerli gömülü Pi ayarlarına
  `mcpServers` olarak birleştirir
- OpenClaw, stdio sunucularını başlatarak veya HTTP sunucularına bağlanarak
  gömülü Pi ajan dönüşleri sırasında desteklenen paket MCP araçlarını sunar
- `coding` ve `messaging` araç profilleri varsayılan olarak paket MCP araçlarını
  içerir; bir ajan veya Gateway için kapsam dışında bırakmak üzere `tools.deny: ["bundle-mcp"]` kullanın
- proje yerel Pi ayarları paket varsayılanlarından sonra da uygulanır; bu nedenle
  çalışma alanı ayarları gerektiğinde paket MCP girdilerini geçersiz kılabilir
- paket MCP araç katalogları kayıttan önce deterministik olarak sıralanır; böylece
  üst kaynak `listTools()` sıra değişiklikleri prompt-cache araç bloklarını sürekli değiştirmez

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

**HTTP** varsayılan olarak `sse` üzerinden veya istendiğinde `streamable-http` ile çalışan bir MCP sunucusuna bağlanır:

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
- `type: "http"` CLI'ye özgü bir aşağı akış şeklidir; OpenClaw yapılandırmasında `transport: "streamable-http"` kullanın. `openclaw mcp set` ve `openclaw doctor --fix` yaygın takma adı normalleştirir.
- yalnızca `http:` ve `https:` URL şemalarına izin verilir
- `headers` değerleri `${ENV_VAR}` aradeğerlemesini destekler
- hem `command` hem de `url` içeren bir sunucu girdisi reddedilir
- URL kimlik bilgileri (userinfo ve sorgu parametreleri) araç
  açıklamalarından ve günlüklerden maskelenir
- `connectionTimeoutMs`, hem stdio hem de HTTP aktarımları için varsayılan 30 saniyelik bağlantı zaman aşımını geçersiz kılar

##### Araç adlandırma

OpenClaw paket MCP araçlarını, sağlayıcı açısından güvenli adlarla
`serverName__toolName` biçiminde kaydeder. Örneğin, `"vigil-harbor"` anahtarlı ve
`memory_search` aracını sunan bir sunucu `vigil-harbor__memory_search` olarak kaydedilir.

- `A-Za-z0-9_-` dışındaki karakterler `-` ile değiştirilir
- harf olmayan bir karakterle başlayacak parçalar bir harf öneki alır; böylece
  `12306` gibi sayısal sunucu anahtarları sağlayıcı açısından güvenli araç öneklerine dönüşür
- sunucu önekleri 30 karakterle sınırlandırılır
- tam araç adları 64 karakterle sınırlandırılır
- boş sunucu adları `mcp` değerine geri döner
- çakışan arındırılmış adlar sayısal son eklerle ayrıştırılır
- yinelenen Pi dönüşlerini önbellek açısından kararlı tutmak için son sunulan araç sırası güvenli ada göre deterministiktir
- profil filtrelemesi, bir paket MCP sunucusundaki tüm araçları `bundle-mcp`
  tarafından Plugin'e ait kabul eder; bu nedenle profil izin listeleri ve engel listeleri
  tekil sunulan araç adlarını ya da `bundle-mcp` Plugin anahtarını içerebilir

#### Gömülü Pi ayarları

- Claude `settings.json`, paket etkinleştirildiğinde varsayılan gömülü Pi ayarları olarak içe aktarılır
- OpenClaw, shell geçersiz kılma anahtarlarını uygulamadan önce arındırır

Arındırılmış anahtarlar:

- `shellPath`
- `shellCommandPrefix`

#### Gömülü Pi LSP

- etkinleştirilmiş Claude paketleri LSP sunucu yapılandırmasına katkıda bulunabilir
- OpenClaw, `.lsp.json` ile manifestte bildirilen tüm `lspServers` yollarını yükler
- paket LSP yapılandırması geçerli gömülü Pi LSP varsayılanlarıyla birleştirilir
- bugün yalnızca desteklenen stdio destekli LSP sunucuları çalıştırılabilir; desteklenmeyen
  aktarımlar yine de `openclaw plugins inspect <id>` içinde görünür

### Algılanan ancak yürütülmeyenler

Bunlar tanınır ve tanılarda gösterilir, ancak OpenClaw bunları çalıştırmaz:

- Claude `agents`, `hooks.json` otomasyonu, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Yetenek raporlamasının ötesindeki Codex satır içi/uygulama meta verileri

## Paket biçimleri

<AccordionGroup>
  <Accordion title="Codex paketleri">
    İşaretleyiciler: `.codex-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex paketleri, Skills kökleri ve OpenClaw tarzı hook paketi
    dizinleri (`HOOK.md` + `handler.ts`) kullandıklarında OpenClaw'a en iyi şekilde uyar.

  </Accordion>

  <Accordion title="Claude paketleri">
    İki algılama modu:

    - **Manifest tabanlı:** `.claude-plugin/plugin.json`
    - **Manifestsiz:** varsayılan Claude düzeni (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude'a özgü davranış:

    - `commands/` Skills içeriği olarak değerlendirilir
    - `settings.json` gömülü Pi ayarlarına içe aktarılır (shell geçersiz kılma anahtarları arındırılır)
    - `.mcp.json` desteklenen stdio araçlarını gömülü Pi'ye sunar
    - `.lsp.json` ile manifestte bildirilen `lspServers` yolları gömülü Pi LSP varsayılanlarına yüklenir
    - `hooks/hooks.json` algılanır ancak yürütülmez
    - Manifestteki özel bileşen yolları eklemelidir (varsayılanları değiştirmenin yerine genişletir)

  </Accordion>

  <Accordion title="Cursor paketleri">
    İşaretleyiciler: `.cursor-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` Skills içeriği olarak değerlendirilir
    - `.cursor/rules/`, `.cursor/agents/` ve `.cursor/hooks.json` yalnızca algılama amaçlıdır

  </Accordion>
</AccordionGroup>

## Algılama önceliği

OpenClaw önce yerel Plugin biçimini denetler:

1. `openclaw.plugin.json` veya `openclaw.extensions` içeren geçerli `package.json` — **yerel Plugin** olarak değerlendirilir
2. Paket işaretleyicileri (`.codex-plugin/`, `.claude-plugin/` veya varsayılan Claude/Cursor düzeni) — **paket** olarak değerlendirilir

Bir dizin ikisini de içeriyorsa OpenClaw yerel yolu kullanır. Bu, çift biçimli
paketlerin kısmen paket olarak kurulmasını önler.

## Çalışma zamanı bağımlılıkları ve temizlik

- Üçüncü taraf uyumlu paketler başlangıçta `npm install` onarımı almaz. Bunlar
  `openclaw plugins install` üzerinden kurulmalı ve ihtiyaç duydukları her şeyi
  kurulu Plugin dizininde göndermelidir.
- OpenClaw'a ait paketlenmiş Plugin'ler ya çekirdekte hafif olarak gönderilir ya da
  Plugin kurucu aracılığıyla indirilebilir. Gateway başlangıcı bunlar için hiçbir zaman
  paket yöneticisi çalıştırmaz.
- `openclaw doctor --fix` eski aşamalandırılmış bağımlılık dizinlerini kaldırır ve
  yapılandırma bunlara başvurduğunda yerel Plugin dizininde eksik olan indirilebilir
  Plugin'leri kurtarabilir.

## Güvenlik

Paketlerin güven sınırı yerel Plugin'lere göre daha dardır:

- OpenClaw rastgele paket çalışma zamanı modüllerini işlem içinde yüklemez
- Skills ve hook paketi yolları Plugin kökünün içinde kalmalıdır (sınır denetimli)
- Ayar dosyaları aynı sınır denetimleriyle okunur
- Desteklenen stdio MCP sunucuları alt süreç olarak başlatılabilir

Bu, paketleri varsayılan olarak daha güvenli yapar; ancak üçüncü taraf
paketleri yine de sundukları özellikler için güvenilir içerik olarak değerlendirmelisiniz.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Paket algılanıyor ancak yetenekler çalışmıyor">
    `openclaw plugins inspect <id>` çalıştırın. Bir yetenek listelenmiş ancak
    bağlı değil olarak işaretlenmişse, bu bozuk bir kurulum değil, ürün sınırıdır.
  </Accordion>

  <Accordion title="Claude komut dosyaları görünmüyor">
    Paketin etkinleştirildiğinden ve markdown dosyalarının algılanan bir
    `commands/` veya `skills/` kökünün içinde olduğundan emin olun.
  </Accordion>

  <Accordion title="Claude ayarları uygulanmıyor">
    Yalnızca `settings.json` dosyasındaki gömülü Pi ayarları desteklenir. OpenClaw,
    paket ayarlarını ham yapılandırma yamaları olarak değerlendirmez.
  </Accordion>

  <Accordion title="Claude hook'ları yürütülmüyor">
    `hooks/hooks.json` yalnızca algılama amaçlıdır. Çalıştırılabilir hook'lara ihtiyacınız varsa
    OpenClaw hook paketi düzenini kullanın veya yerel bir Plugin gönderin.
  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin'leri Kurma ve Yapılandırma](/tr/tools/plugin)
- [Plugin Oluşturma](/tr/plugins/building-plugins) — yerel bir Plugin oluşturun
- [Plugin Manifesti](/tr/plugins/manifest) — yerel manifest şeması
