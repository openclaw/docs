---
read_when:
    - Codex, Claude veya Cursor ile uyumlu bir paket yüklemek istiyorsunuz
    - OpenClaw'un paket içeriğini yerel özelliklerle nasıl eşleştirdiğini anlamanız gerekir
    - Paket algılamasında veya eksik yeteneklerde hata ayıklıyorsunuz
summary: Codex, Claude ve Cursor paketlerini OpenClaw Plugin'leri olarak yükleyin ve kullanın
title: Plugin paketleri
x-i18n:
    generated_at: "2026-07-12T12:30:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw üç harici ekosistemden plugin yükleyebilir: **Codex**, **Claude**
ve **Cursor**. Bunlara **paketler** denir; OpenClaw'ın Skills, hook'lar ve MCP araçları
gibi yerel özelliklere eşlediği içerik ve meta veri paketleridir.

<Info>
  Paketler, yerel OpenClaw pluginleriyle **aynı değildir**. Yerel pluginler
  işlem içinde çalışır ve herhangi bir yeteneği kaydedebilir. Paketler ise
  seçici özellik eşlemesine ve daha dar bir güven sınırına sahip içerik paketleridir.
</Info>

## Paketler neden vardır?

Birçok kullanışlı plugin Codex, Claude veya Cursor biçiminde yayımlanır. OpenClaw,
yazarların bunları yerel OpenClaw pluginleri olarak yeniden yazmasını gerektirmek yerine
bu biçimleri algılar ve desteklenen içeriklerini yerel özellik kümesine eşler.
Bir Claude komut paketi veya Codex Skills paketi yükleyip hemen kullanabilirsiniz.

## Paket yükleme

<Steps>
  <Step title="Bir dizinden, arşivden veya pazaryerinden yükleyin">
    ```bash
    # Yerel dizin
    openclaw plugins install ./my-bundle

    # Arşiv
    openclaw plugins install ./my-bundle.tgz

    # Claude pazaryeri
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>`, yerel bir pazaryeri yolu/deposu veya bir git/GitHub kaynağıdır.

  </Step>

  <Step title="Algılamayı doğrulayın">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Paketlerde `Format: bundle` ile birlikte `codex`, `claude` veya `cursor`
    değerlerinden birini içeren `Bundle format:` gösterilir.

  </Step>

  <Step title="Yeniden başlatın ve kullanın">
    ```bash
    openclaw gateway restart
    ```

    Eşlenen özellikler (Skills, hook'lar, MCP araçları, LSP varsayılanları) sonraki oturumda kullanılabilir.

  </Step>
</Steps>

## OpenClaw paketlerden neleri eşler?

Günümüzde her paket özelliği OpenClaw'da çalışmaz. Aşağıda çalışanlar ve
algılanmasına rağmen henüz bağlanmamış olanlar yer almaktadır.

### Şu anda desteklenenler

| Özellik       | Nasıl eşlenir                                                                                       | Geçerli olduğu biçimler |
| ------------- | --------------------------------------------------------------------------------------------------- | ----------------------- |
| Skills içeriği | Paket Skills kökleri normal OpenClaw Skills kökleri olarak yüklenir                                | Tüm biçimler            |
| Komutlar      | `commands/` ve `.cursor/commands/`, Skills kökleri olarak değerlendirilir                           | Claude, Cursor          |
| Hook paketleri | OpenClaw tarzı `HOOK.md` + `handler.ts` düzenleri                                                  | Codex                   |
| MCP araçları  | Paket MCP yapılandırması gömülü OpenClaw ayarlarıyla birleştirilir; desteklenen stdio ve HTTP sunucuları yüklenir | Tüm biçimler |
| LSP sunucuları | Claude `.lsp.json` dosyası ve manifestte bildirilen `lspServers`, gömülü OpenClaw LSP varsayılanlarıyla birleştirilir | Claude |
| Ayarlar       | Claude `settings.json`, gömülü OpenClaw varsayılanları olarak içe aktarılır                         | Claude                  |

#### Skills içeriği

- Paket Skills kökleri normal OpenClaw Skills kökleri olarak yüklenir.
- Claude `commands/` kökleri ek Skills kökleri olarak değerlendirilir.
- Cursor `.cursor/commands/` kökleri ek Skills kökleri olarak değerlendirilir.

Claude markdown komut dosyaları ve Cursor komut markdown dosyaları, normal
OpenClaw Skills yükleyicisi üzerinden çalışır.

#### Hook paketleri

Paket hook kökleri **yalnızca** normal OpenClaw hook paketi düzenini kullandıklarında
çalışır: `HOOK.md` ile birlikte `handler.ts` veya `handler.js`. Günümüzde bu,
öncelikle Codex uyumlu durumlar için geçerlidir.

#### Gömülü OpenClaw için MCP

- Etkin paketler MCP sunucu yapılandırmasına katkıda bulunabilir.
- OpenClaw, paket MCP yapılandırmasını geçerli gömülü OpenClaw ayarlarına
  `mcpServers` olarak ekler.
- OpenClaw, gömülü OpenClaw ajan dönüşleri sırasında stdio sunucularını başlatarak
  veya HTTP sunucularına bağlanarak desteklenen paket MCP araçlarını kullanıma sunar.
- `coding` ve `messaging` araç profilleri varsayılan olarak paket MCP araçlarını
  içerir; bir ajan veya Gateway için bunları devre dışı bırakmak üzere `tools.deny: ["bundle-mcp"]` kullanın.
- Projeye özgü gömülü ajan ayarları paket varsayılanlarından sonra uygulanmaya devam
  eder; böylece çalışma alanı ayarları gerektiğinde paket MCP girdilerini geçersiz kılabilir.
- Paket MCP araç katalogları kayıttan önce deterministik olarak sıralanır; böylece
  üst kaynaktaki `listTools()` sıra değişiklikleri istem önbelleğindeki araç bloklarının sürekli değişmesine neden olmaz.

##### Aktarımlar

MCP sunucuları stdio veya HTTP aktarımını kullanabilir.

**Stdio**, bir alt süreç başlatır:

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

**HTTP**, çalışan bir MCP sunucusuna bağlanır ve `streamable-http`
istenmediği sürece varsayılan olarak `sse` kullanır:

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

- `transport`, `"streamable-http"` veya `"sse"` değerini kabul eder; belirtilmezse varsayılan değer `sse` olur.
- `type: "http"`, CLI'ye özgü bir alt akış biçimidir; OpenClaw yapılandırmasında `transport: "streamable-http"` kullanın. `openclaw mcp set` ve `openclaw doctor --fix`, yaygın diğer adı normalleştirir.
- Yalnızca `http:` ve `https:` URL şemalarına izin verilir.
- `headers` değerleri `${ENV_VAR}` yerleştirmesini destekler.
- Hem `command` hem de `url` içeren bir sunucu girdisi reddedilir.
- URL kimlik bilgileri (kullanıcı bilgileri ve sorgu parametreleri), araç
  açıklamalarından ve günlüklerden gizlenir.
- `connectionTimeoutMs`, hem stdio hem de HTTP aktarımları için varsayılan
  30 saniyelik bağlantı zaman aşımını geçersiz kılar. İstek zaman aşımı varsayılan olarak
  60 saniyedir ve `requestTimeoutMs` ile geçersiz kılınabilir.

##### Araç adlandırma

OpenClaw, paket MCP araçlarını `serverName__toolName` biçiminde sağlayıcı açısından
güvenli adlarla kaydeder. Örneğin, `memory_search` aracını sunan ve anahtarı
`"vigil-harbor"` olan bir sunucu, `vigil-harbor__memory_search` olarak kaydedilir.

- `A-Za-z0-9_-` dışındaki karakterler `-` ile değiştirilir.
- Harf olmayan bir karakterle başlayacak parçalara bir harf öneki eklenir; böylece
  `12306` gibi sayısal sunucu anahtarları sağlayıcı açısından güvenli araç öneklerine dönüşür.
- Sunucu önekleri en fazla 30 karakter olabilir.
- Tam araç adları en fazla 64 karakter olabilir.
- Boş sunucu adları için `mcp` kullanılır.
- Temizlendikten sonra çakışan adlar sayısal son eklerle ayırt edilir.
- Son olarak sunulan araç sırası güvenli ada göre deterministiktir; bu da yinelenen
  gömülü ajan dönüşlerinde önbellek kararlılığını korur.
- Profil filtreleme, tek bir paket MCP sunucusundaki her aracı `bundle-mcp`
  tarafından sahiplenilen bir plugin olarak değerlendirir; böylece profil izin/verme listeleri
  tek tek sunulan araç adlarına veya `bundle-mcp` plugin anahtarına başvurabilir.

#### Gömülü OpenClaw ayarları

Claude `settings.json`, paket etkinleştirildiğinde varsayılan gömülü OpenClaw
ayarları olarak içe aktarılır. OpenClaw, uygulamadan önce kabuk geçersiz kılma
anahtarlarını temizler:

- `shellPath`
- `shellCommandPrefix`

#### Gömülü OpenClaw LSP

- Etkin Claude paketleri LSP sunucu yapılandırmasına katkıda bulunabilir.
- OpenClaw, `.lsp.json` dosyasını ve manifestte bildirilen tüm `lspServers` yollarını yükler.
- Paket LSP yapılandırması, geçerli gömülü OpenClaw LSP varsayılanlarıyla birleştirilir.
- Günümüzde yalnızca desteklenen stdio tabanlı LSP sunucuları çalıştırılabilir; desteklenmeyen
  aktarımlar yine de `openclaw plugins inspect <id>` çıktısında gösterilir.

### Algılanan ancak çalıştırılmayanlar

Bunlar tanınır ve tanılamalarda gösterilir, ancak OpenClaw bunları çalıştırmaz:

- Claude `agents`, `hooks/hooks.json` otomasyonu, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Yetenek raporlamasının ötesindeki Codex `.app.json` meta verileri

## Paket biçimleri

<AccordionGroup>
  <Accordion title="Codex paketleri">
    İşaretleyiciler: `.codex-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex paketleri, Skills kökleri ve OpenClaw tarzı hook paketi dizinleri
    (`HOOK.md` + `handler.ts`) kullandıklarında OpenClaw'a en iyi şekilde uyum sağlar.

  </Accordion>

  <Accordion title="Claude paketleri">
    İki algılama modu:

    - **Manifest tabanlı:** `.claude-plugin/plugin.json`
    - **Manifestsiz:** varsayılan Claude düzeni (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude'a özgü davranış:

    - `commands/`, Skills içeriği olarak değerlendirilir
    - `settings.json`, gömülü OpenClaw ayarlarına aktarılır (kabuk geçersiz kılma anahtarları temizlenir)
    - `.mcp.json`, desteklenen stdio araçlarını gömülü OpenClaw'a sunar
    - `.lsp.json` ile manifestte bildirilen `lspServers` yolları, gömülü OpenClaw LSP varsayılanlarına yüklenir
    - `hooks/hooks.json` algılanır ancak çalıştırılmaz
    - Manifestteki özel bileşen yolları eklemelidir; varsayılanların yerini almak yerine onları genişletir

  </Accordion>

  <Accordion title="Cursor paketleri">
    İşaretleyiciler: `.cursor-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/`, Skills içeriği olarak değerlendirilir
    - `.cursor/rules/`, `.cursor/agents/` ve `.cursor/hooks.json` yalnızca algılanır

  </Accordion>
</AccordionGroup>

## Algılama önceliği

OpenClaw önce yerel plugin biçimini denetler:

1. `openclaw.plugin.json` veya `openclaw.extensions` içeren geçerli bir `package.json` — **yerel plugin** olarak değerlendirilir
2. Paket işaretleyicileri (`.codex-plugin/`, `.claude-plugin/` veya varsayılan Claude/Cursor düzeni) — **paket** olarak değerlendirilir

Bir dizin her ikisini de içeriyorsa OpenClaw yerel yolu kullanır. Bu, çift biçimli
paketlerin kısmen paket olarak yüklenmesini önler.

## Çalışma zamanı bağımlılıkları ve temizleme

- Üçüncü taraf uyumlu paketler, başlangıçta `npm install` onarımı almaz. Bunlar
  `openclaw plugins install` aracılığıyla yüklenmeli ve ihtiyaç duydukları her şeyi
  yüklü plugin dizininde sağlamalıdır.
- OpenClaw'a ait paketlenmiş pluginler ya çekirdekte hafif şekilde sunulur ya da
  plugin yükleyicisi üzerinden indirilebilir. Gateway başlangıcı bunlar için hiçbir zaman
  paket yöneticisi çalıştırmaz.
- `openclaw doctor --fix`, eski yerel paketlenmiş plugin yükleme kayıtlarını kaldırır
  ve yapılandırma bunlara hâlâ başvuruyorsa yerel plugin dizininde eksik olan
  indirilebilir pluginleri kurtarabilir.

## Güvenlik

Paketler, yerel pluginlerden daha dar bir güven sınırına sahiptir:

- OpenClaw, rastgele paket çalışma zamanı modüllerini işlem içinde **yüklemez**.
- Skills ve hook paketi yolları plugin kökünün içinde kalmalıdır (sınır denetimli).
- Ayar dosyaları aynı sınır denetimleriyle okunur.
- Desteklenen stdio MCP sunucuları alt süreçler olarak başlatılabilir.

Bu, paketleri varsayılan olarak daha güvenli kılar; ancak üçüncü taraf paketlerini
sundukları özellikler bakımından yine de güvenilir içerik olarak değerlendirmelisiniz.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Paket algılanıyor ancak yetenekler çalışmıyor">
    `openclaw plugins inspect <id>` komutunu çalıştırın. Bir yetenek listeleniyor ancak
    bağlanmamış olarak işaretleniyorsa bu, bozuk bir yükleme değil ürün sınırlamasıdır.
  </Accordion>

  <Accordion title="Claude komut dosyaları görünmüyor">
    Paketin etkin olduğundan ve markdown dosyalarının algılanan bir
    `commands/` veya `skills/` kökü içinde bulunduğundan emin olun.
  </Accordion>

  <Accordion title="Claude ayarları uygulanmıyor">
    Yalnızca `settings.json` içindeki gömülü OpenClaw ayarları desteklenir. OpenClaw,
    paket ayarlarını ham yapılandırma yamaları olarak değerlendirmez.
  </Accordion>

  <Accordion title="Claude hook'ları çalışmıyor">
    `hooks/hooks.json` yalnızca algılanır. Çalıştırılabilir hook'lara ihtiyacınız varsa
    OpenClaw hook paketi düzenini kullanın veya yerel bir plugin sunun.
  </Accordion>
</AccordionGroup>

## İlgili konular

- [Pluginleri Yükleme ve Yapılandırma](/tr/tools/plugin)
- [Plugin Oluşturma](/tr/plugins/building-plugins) - yerel bir plugin oluşturun
- [Plugin Manifesti](/tr/plugins/manifest) - yerel manifest şeması
