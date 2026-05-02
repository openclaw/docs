---
read_when:
    - Codex, Claude veya Cursor uyumlu bir paketi yüklemek istiyorsunuz
    - OpenClaw’ın paket içeriğini yerel özelliklere nasıl eşlediğini anlamanız gerekir
    - Paket algılaması veya eksik yeteneklerle ilgili hata ayıklıyorsunuz
summary: Codex, Claude ve Cursor paketlerini OpenClaw Plugin'leri olarak yükleyin ve kullanın
title: Plugin paketleri
x-i18n:
    generated_at: "2026-05-02T09:00:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b949ad70881714a30ab136261441687b439e39b516638ffa052efeab6b75bd4
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw, üç harici ekosistemden Plugin yükleyebilir: **Codex**, **Claude**
ve **Cursor**. Bunlara **paketler** denir; OpenClaw'ın Skills, hook'lar ve MCP araçları gibi yerel özelliklere eşlediği içerik ve meta veri paketleridir.

<Info>
  Paketler, yerel OpenClaw Plugin'leriyle **aynı değildir**. Yerel Plugin'ler
  işlem içinde çalışır ve herhangi bir yeteneği kaydedebilir. Paketler ise
  seçici özellik eşlemesi ve daha dar bir güven sınırı olan içerik paketleridir.
</Info>

## Paketler neden var?

Birçok yararlı Plugin Codex, Claude veya Cursor biçiminde yayımlanır. Yazarların
bunları yerel OpenClaw Plugin'leri olarak yeniden yazmasını istemek yerine OpenClaw
bu biçimleri algılar ve desteklenen içeriklerini yerel özellik kümesine eşler.
Bu, bir Claude komut paketi veya Codex Skills paketi yükleyip hemen kullanabileceğiniz anlamına gelir.

## Bir paket yükleme

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

    Paketler, `codex`, `claude` veya `cursor` alt türüyle `Format: bundle` olarak görünür.

  </Step>

  <Step title="Yeniden başlatın ve kullanın">
    ```bash
    openclaw gateway restart
    ```

    Eşlenen özellikler (Skills, hook'lar, MCP araçları, LSP varsayılanları) bir sonraki oturumda kullanılabilir.

  </Step>
</Steps>

## OpenClaw paketlerden neleri eşler?

Bugün her paket özelliği OpenClaw'da çalışmaz. Aşağıda çalışanlar ve algılanıp
henüz bağlanmamış olanlar yer alır.

### Şu anda desteklenenler

| Özellik      | Nasıl eşlenir                                                                               | Geçerli olduğu biçimler |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skills içeriği | Paket Skills kökleri normal OpenClaw Skills'leri olarak yüklenir                            | Tüm biçimler   |
| Komutlar      | `commands/` ve `.cursor/commands/` Skills kökleri olarak değerlendirilir                    | Claude, Cursor |
| Hook paketleri | OpenClaw tarzı `HOOK.md` + `handler.ts` düzenleri                                           | Codex          |
| MCP araçları  | Paket MCP yapılandırması gömülü Pi ayarlarına birleştirilir; desteklenen stdio ve HTTP sunucuları yüklenir | Tüm biçimler   |
| LSP sunucuları | Claude `.lsp.json` ve manifestte bildirilen `lspServers`, gömülü Pi LSP varsayılanlarına birleştirilir | Claude         |
| Ayarlar       | Claude `settings.json`, gömülü Pi varsayılanları olarak içe aktarılır                       | Claude         |

#### Skills içeriği

- paket Skills kökleri normal OpenClaw Skills kökleri olarak yüklenir
- Claude `commands` kökleri ek Skills kökleri olarak değerlendirilir
- Cursor `.cursor/commands` kökleri ek Skills kökleri olarak değerlendirilir

Bu, Claude markdown komut dosyalarının normal OpenClaw Skills yükleyicisi
üzerinden çalıştığı anlamına gelir. Cursor komut markdown'ı da aynı yoldan çalışır.

#### Hook paketleri

- paket hook kökleri **yalnızca** normal OpenClaw hook paketi düzenini
  kullandıklarında çalışır. Bugün bu öncelikle Codex uyumlu durumdur:
  - `HOOK.md`
  - `handler.ts` veya `handler.js`

#### Pi için MCP

- etkinleştirilmiş paketler MCP sunucu yapılandırması katkısı sağlayabilir
- OpenClaw, paket MCP yapılandırmasını etkin gömülü Pi ayarlarına
  `mcpServers` olarak birleştirir
- OpenClaw, gömülü Pi ajan turları sırasında desteklenen paket MCP araçlarını
  stdio sunucuları başlatarak veya HTTP sunucularına bağlanarak sunar
- `coding` ve `messaging` araç profilleri varsayılan olarak paket MCP araçlarını
  içerir; bir ajan veya Gateway için kapsam dışında bırakmak üzere `tools.deny: ["bundle-mcp"]` kullanın
- proje yerel Pi ayarları paket varsayılanlarından sonra hâlâ uygulanır, bu nedenle çalışma alanı
  ayarları gerektiğinde paket MCP girişlerini geçersiz kılabilir
- paket MCP araç katalogları kayıt öncesinde deterministik olarak sıralanır, böylece
  üst kaynak `listTools()` sıra değişiklikleri istem önbelleği araç bloklarını gereksiz yere değiştirmez

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

- `transport`, `"streamable-http"` veya `"sse"` olarak ayarlanabilir; atlanırsa OpenClaw `sse` kullanır
- `type: "http"` CLI'ye özgü bir aşağı akış biçimidir; OpenClaw yapılandırmasında `transport: "streamable-http"` kullanın. `openclaw mcp set` ve `openclaw doctor --fix` yaygın takma adı normalleştirir.
- yalnızca `http:` ve `https:` URL şemalarına izin verilir
- `headers` değerleri `${ENV_VAR}` interpolasyonunu destekler
- hem `command` hem de `url` içeren bir sunucu girişi reddedilir
- URL kimlik bilgileri (userinfo ve sorgu parametreleri) araç
  açıklamalarından ve günlüklerden çıkarılır
- `connectionTimeoutMs`, hem stdio hem de HTTP aktarımları için varsayılan 30 saniyelik bağlantı zaman aşımını geçersiz kılar

##### Araç adlandırma

OpenClaw, paket MCP araçlarını sağlayıcı açısından güvenli adlarla
`serverName__toolName` biçiminde kaydeder. Örneğin, `"vigil-harbor"` anahtarlı bir sunucu
`memory_search` aracını sunuyorsa bu araç `vigil-harbor__memory_search` olarak kaydedilir.

- `A-Za-z0-9_-` dışındaki karakterler `-` ile değiştirilir
- sunucu önekleri 30 karakterle sınırlandırılır
- tam araç adları 64 karakterle sınırlandırılır
- boş sunucu adları `mcp` değerine döner
- çakışan temizlenmiş adlar sayısal soneklerle ayrıştırılır
- tekrarlanan Pi turlarını önbellek açısından kararlı tutmak için son sunulan araç sırası güvenli ada göre deterministiktir
- profil filtreleme, tek bir paket MCP sunucusundan gelen tüm araçları `bundle-mcp` tarafından Plugin sahipliğinde kabul eder; bu nedenle profil izin listeleri ve engelleme listeleri tek tek sunulan araç adlarını veya `bundle-mcp` Plugin anahtarını içerebilir

#### Gömülü Pi ayarları

- Claude `settings.json`, paket etkinleştirildiğinde varsayılan gömülü Pi ayarları olarak içe aktarılır
- OpenClaw, shell geçersiz kılma anahtarlarını uygulamadan önce temizler

Temizlenen anahtarlar:

- `shellPath`
- `shellCommandPrefix`

#### Gömülü Pi LSP

- etkinleştirilmiş Claude paketleri LSP sunucu yapılandırması katkısı sağlayabilir
- OpenClaw, `.lsp.json` ile manifestte bildirilen tüm `lspServers` yollarını yükler
- paket LSP yapılandırması, etkin gömülü Pi LSP varsayılanlarına birleştirilir
- bugün yalnızca desteklenen stdio destekli LSP sunucuları çalıştırılabilir; desteklenmeyen
  aktarımlar yine de `openclaw plugins inspect <id>` içinde görünür

### Algılanan ancak çalıştırılmayanlar

Bunlar tanınır ve tanılamalarda gösterilir, ancak OpenClaw bunları çalıştırmaz:

- Claude `agents`, `hooks.json` otomasyonu, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- yetenek raporlaması dışındaki Codex satır içi/uygulama meta verileri

## Paket biçimleri

<AccordionGroup>
  <Accordion title="Codex paketleri">
    İşaretçiler: `.codex-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex paketleri, Skills kökleri ve OpenClaw tarzı hook paketi dizinleri
    (`HOOK.md` + `handler.ts`) kullandıklarında OpenClaw'a en iyi şekilde uyar.

  </Accordion>

  <Accordion title="Claude paketleri">
    İki algılama modu:

    - **Manifest tabanlı:** `.claude-plugin/plugin.json`
    - **Manifestsiz:** varsayılan Claude düzeni (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude'a özgü davranış:

    - `commands/` Skills içeriği olarak değerlendirilir
    - `settings.json` gömülü Pi ayarlarına içe aktarılır (shell geçersiz kılma anahtarları temizlenir)
    - `.mcp.json` desteklenen stdio araçlarını gömülü Pi'ye sunar
    - `.lsp.json` ve manifestte bildirilen `lspServers` yolları gömülü Pi LSP varsayılanlarına yüklenir
    - `hooks/hooks.json` algılanır ancak çalıştırılmaz
    - Manifestteki özel bileşen yolları ekleyicidir (varsayılanları değiştirmenin yerine genişletir)

  </Accordion>

  <Accordion title="Cursor paketleri">
    İşaretçiler: `.cursor-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` Skills içeriği olarak değerlendirilir
    - `.cursor/rules/`, `.cursor/agents/` ve `.cursor/hooks.json` yalnızca algılanır

  </Accordion>
</AccordionGroup>

## Algılama önceliği

OpenClaw önce yerel Plugin biçimini kontrol eder:

1. `openclaw.plugin.json` veya `openclaw.extensions` içeren geçerli `package.json` — **yerel Plugin** olarak değerlendirilir
2. Paket işaretçileri (`.codex-plugin/`, `.claude-plugin/` veya varsayılan Claude/Cursor düzeni) — **paket** olarak değerlendirilir

Bir dizin her ikisini de içeriyorsa OpenClaw yerel yolu kullanır. Bu,
çift biçimli paketlerin kısmen paket olarak yüklenmesini önler.

## Çalışma zamanı bağımlılıkları ve temizlik

- Üçüncü taraf uyumlu paketler başlangıçta `npm install` onarımı almaz. Bunlar
  `openclaw plugins install` üzerinden yüklenmeli ve ihtiyaç duydukları her şeyi
  yüklü Plugin dizininde birlikte göndermelidir.
- OpenClaw'a ait paketlenmiş Plugin'ler ya çekirdekte hafif olarak gönderilir ya da
  Plugin yükleyicisi üzerinden indirilebilir. Gateway başlangıcı bunlar için hiçbir zaman
  paket yöneticisi çalıştırmaz.
- `openclaw doctor --fix`, eski hazırlanmış bağımlılık dizinlerini kaldırır ve yerel
  Plugin dizininde eksik olan yapılandırılmış indirilebilir Plugin'leri yükleyebilir.

## Güvenlik

Paketlerin güven sınırı yerel Plugin'lere göre daha dardır:

- OpenClaw rastgele paket çalışma zamanı modüllerini işlem içinde **yüklemez**
- Skills ve hook paketi yolları Plugin kökü içinde kalmalıdır (sınır denetimli)
- Ayar dosyaları aynı sınır denetimleriyle okunur
- Desteklenen stdio MCP sunucuları alt süreçler olarak başlatılabilir

Bu, paketleri varsayılan olarak daha güvenli kılar; ancak üçüncü taraf
paketleri yine de sundukları özellikler için güvenilir içerik olarak ele almalısınız.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Paket algılanıyor ancak yetenekler çalışmıyor">
    `openclaw plugins inspect <id>` komutunu çalıştırın. Bir yetenek listelenmiş ancak
    bağlı değil olarak işaretlenmişse bu bir ürün sınırlamasıdır; bozuk bir kurulum değildir.
  </Accordion>

  <Accordion title="Claude komut dosyaları görünmüyor">
    Paketin etkin olduğundan ve markdown dosyalarının algılanan bir
    `commands/` veya `skills/` kökü içinde olduğundan emin olun.
  </Accordion>

  <Accordion title="Claude ayarları uygulanmıyor">
    Yalnızca `settings.json` içindeki gömülü Pi ayarları desteklenir. OpenClaw,
    paket ayarlarını ham yapılandırma yamaları olarak değerlendirmez.
  </Accordion>

  <Accordion title="Claude hook'ları çalışmıyor">
    `hooks/hooks.json` yalnızca algılanır. Çalıştırılabilir hook'lara ihtiyacınız varsa
    OpenClaw hook paketi düzenini kullanın veya yerel bir Plugin gönderin.
  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin'leri Yükleme ve Yapılandırma](/tr/tools/plugin)
- [Plugin Oluşturma](/tr/plugins/building-plugins) — yerel bir Plugin oluşturun
- [Plugin Manifesti](/tr/plugins/manifest) — yerel manifest şeması
