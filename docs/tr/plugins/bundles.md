---
read_when:
    - Codex, Claude veya Cursor ile uyumlu bir paket yüklemek istiyorsunuz
    - OpenClaw'ın paket içeriğini yerel özelliklere nasıl eşlediğini anlamanız gerekir
    - Paket algılamasında veya eksik yeteneklerde hata ayıklıyorsunuz
summary: Codex, Claude ve Cursor paketlerini OpenClaw Plugin'leri olarak yükleyin ve kullanın
title: Plugin paketleri
x-i18n:
    generated_at: "2026-05-05T01:48:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc06300e765e2faaf51800462003e242d29d4102ac9feaa47f86d4ad35bf157
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw üç harici ekosistemden Plugin yükleyebilir: **Codex**, **Claude**
ve **Cursor**. Bunlara **paketler** denir; OpenClaw’ın Skills, hook’lar
ve MCP araçları gibi yerel özelliklere eşlediği içerik ve metadata paketleridir.

<Info>
  Paketler, yerel OpenClaw Plugin’leriyle **aynı değildir**. Yerel Plugin’ler
  süreç içinde çalışır ve her türlü capability kaydedebilir. Paketler,
  seçici özellik eşlemesine ve daha dar bir güven sınırına sahip içerik paketleridir.
</Info>

## Paketler neden var

Birçok yararlı Plugin, Codex, Claude veya Cursor biçiminde yayımlanır. OpenClaw,
yazarların bunları yerel OpenClaw Plugin’leri olarak yeniden yazmasını istemek
yerine bu biçimleri algılar ve desteklenen içeriklerini yerel özellik kümesine
eşler. Bu, bir Claude komut paketini veya bir Codex skill paketini yükleyip
hemen kullanabileceğiniz anlamına gelir.

## Paket yükleme

<Steps>
  <Step title="Bir dizinden, arşivden veya marketplace’ten yükleyin">
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

    Eşlenen özellikler (Skills, hook’lar, MCP araçları, LSP varsayılanları) sonraki oturumda kullanılabilir.

  </Step>
</Steps>

## OpenClaw paketlerden neleri eşler

Bugün her paket özelliği OpenClaw’da çalışmaz. Aşağıda neyin çalıştığı ve neyin
algılanıp henüz bağlanmadığı listelenmiştir.

### Şu anda desteklenenler

| Özellik       | Nasıl eşlenir                                                                                 | Geçerli olduğu yer |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skill içeriği | Paket skill kökleri normal OpenClaw Skills olarak yüklenir                                           | Tüm biçimler    |
| Komutlar      | `commands/` ve `.cursor/commands/`, skill kökleri olarak işlenir                                  | Claude, Cursor |
| Hook paketleri    | OpenClaw tarzı `HOOK.md` + `handler.ts` düzenleri                                             | Codex          |
| MCP araçları     | Paket MCP yapılandırması gömülü Pi ayarlarına birleştirilir; desteklenen stdio ve HTTP sunucuları yüklenir | Tüm biçimler    |
| LSP sunucuları   | Claude `.lsp.json` ve manifestte bildirilen `lspServers`, gömülü Pi LSP varsayılanlarına birleştirilir  | Claude         |
| Ayarlar      | Claude `settings.json`, gömülü Pi varsayılanları olarak içe aktarılır                                     | Claude         |

#### Skill içeriği

- paket skill kökleri normal OpenClaw skill kökleri olarak yüklenir
- Claude `commands` kökleri ek skill kökleri olarak işlenir
- Cursor `.cursor/commands` kökleri ek skill kökleri olarak işlenir

Bu, Claude markdown komut dosyalarının normal OpenClaw skill yükleyicisi
üzerinden çalıştığı anlamına gelir. Cursor komut markdown’ı aynı yol üzerinden çalışır.

#### Hook paketleri

- paket hook kökleri **yalnızca** normal OpenClaw hook-paketi düzenini
  kullandıklarında çalışır. Bugün bu öncelikli olarak Codex uyumlu durumdur:
  - `HOOK.md`
  - `handler.ts` veya `handler.js`

#### Pi için MCP

- etkin paketler MCP sunucu yapılandırmasına katkıda bulunabilir
- OpenClaw, paket MCP yapılandırmasını etkili gömülü Pi ayarlarına
  `mcpServers` olarak birleştirir
- OpenClaw, stdio sunucuları başlatarak veya HTTP sunucularına bağlanarak
  gömülü Pi agent dönüşlerinde desteklenen paket MCP araçlarını kullanıma sunar
- `coding` ve `messaging` araç profilleri varsayılan olarak paket MCP araçlarını
  içerir; bir agent veya gateway için kapsam dışında bırakmak üzere `tools.deny: ["bundle-mcp"]` kullanın
- proje yerelindeki Pi ayarları paket varsayılanlarından sonra uygulanmaya devam eder, böylece workspace
  ayarları gerektiğinde paket MCP girdilerini geçersiz kılabilir
- paket MCP araç katalogları kayıt öncesinde deterministik olarak sıralanır, böylece
  upstream `listTools()` sırası değişiklikleri prompt-cache araç bloklarını sürekli değiştirmez

##### Taşıma yöntemleri

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

**HTTP** varsayılan olarak `sse` üzerinden, istendiğinde ise `streamable-http` üzerinden çalışan bir MCP sunucusuna bağlanır:

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

- `transport`, `"streamable-http"` veya `"sse"` olarak ayarlanabilir; belirtilmediğinde OpenClaw `sse` kullanır
- `type: "http"` CLI’ye özgü bir downstream şeklidir; OpenClaw yapılandırmasında `transport: "streamable-http"` kullanın. `openclaw mcp set` ve `openclaw doctor --fix` yaygın alias’ı normalize eder.
- yalnızca `http:` ve `https:` URL şemalarına izin verilir
- `headers` değerleri `${ENV_VAR}` interpolasyonunu destekler
- hem `command` hem de `url` içeren bir sunucu girdisi reddedilir
- URL kimlik bilgileri (userinfo ve sorgu parametreleri) araç
  açıklamalarından ve log’lardan redakte edilir
- `connectionTimeoutMs`, hem stdio hem de HTTP taşımaları için varsayılan 30 saniyelik bağlantı zaman aşımını
  geçersiz kılar

##### Araç adlandırma

OpenClaw, paket MCP araçlarını `serverName__toolName` biçiminde provider uyumlu adlarla kaydeder.
Örneğin, `"vigil-harbor"` anahtarlı ve `memory_search` aracı sunan bir sunucu,
`vigil-harbor__memory_search` olarak kaydedilir.

- `A-Za-z0-9_-` dışındaki karakterler `-` ile değiştirilir
- sunucu önekleri 30 karakterle sınırlandırılır
- tam araç adları 64 karakterle sınırlandırılır
- boş sunucu adları `mcp` değerine geri döner
- çakışan sanitize edilmiş adlar sayısal soneklerle ayrıştırılır
- tekrar eden Pi dönüşlerini cache-stable tutmak için son kullanıma sunulan araç sırası safe name’e göre deterministiktir
- profil filtreleme, tek bir paket MCP sunucusundan gelen tüm araçları `bundle-mcp`
  Plugin’ine ait sayar; böylece profil allowlist’leri ve deny list’leri tek tek
  sunulan araç adlarını veya `bundle-mcp` Plugin anahtarını içerebilir

#### Gömülü Pi ayarları

- Claude `settings.json`, paket etkin olduğunda varsayılan gömülü Pi ayarları olarak içe aktarılır
- OpenClaw, shell override anahtarlarını uygulamadan önce sanitize eder

Sanitize edilmiş anahtarlar:

- `shellPath`
- `shellCommandPrefix`

#### Gömülü Pi LSP

- etkin Claude paketleri LSP sunucu yapılandırmasına katkıda bulunabilir
- OpenClaw, `.lsp.json` ve manifestte bildirilen `lspServers` yollarını yükler
- paket LSP yapılandırması, etkili gömülü Pi LSP varsayılanlarına birleştirilir
- bugün yalnızca desteklenen stdio tabanlı LSP sunucuları çalıştırılabilir; desteklenmeyen
  taşıma yöntemleri yine de `openclaw plugins inspect <id>` içinde görünür

### Algılanan ama yürütülmeyenler

Bunlar tanınır ve tanılarda gösterilir, ancak OpenClaw bunları çalıştırmaz:

- Claude `agents`, `hooks.json` otomasyonu, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Capability raporlaması dışında Codex inline/app metadata’sı

## Paket biçimleri

<AccordionGroup>
  <Accordion title="Codex paketleri">
    İşaretleyiciler: `.codex-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex paketleri, skill kökleri ve OpenClaw tarzı hook-paketi dizinleri
    (`HOOK.md` + `handler.ts`) kullandıklarında OpenClaw’a en iyi uyar.

  </Accordion>

  <Accordion title="Claude paketleri">
    İki algılama modu:

    - **Manifest tabanlı:** `.claude-plugin/plugin.json`
    - **Manifestsiz:** varsayılan Claude düzeni (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude’a özgü davranış:

    - `commands/`, skill içeriği olarak işlenir
    - `settings.json`, gömülü Pi ayarlarına içe aktarılır (shell override anahtarları sanitize edilir)
    - `.mcp.json`, desteklenen stdio araçlarını gömülü Pi’ye sunar
    - `.lsp.json` ve manifestte bildirilen `lspServers` yolları, gömülü Pi LSP varsayılanlarına yüklenir
    - `hooks/hooks.json` algılanır ancak yürütülmez
    - Manifestteki özel bileşen yolları eklemelidir (varsayılanları genişletir, onların yerine geçmez)

  </Accordion>

  <Accordion title="Cursor paketleri">
    İşaretleyiciler: `.cursor-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/`, skill içeriği olarak işlenir
    - `.cursor/rules/`, `.cursor/agents/` ve `.cursor/hooks.json` yalnızca algılama amaçlıdır

  </Accordion>
</AccordionGroup>

## Algılama önceliği

OpenClaw önce yerel Plugin biçimini kontrol eder:

1. `openclaw.plugin.json` veya `openclaw.extensions` içeren geçerli `package.json` — **yerel Plugin** olarak işlenir
2. Paket işaretleyicileri (`.codex-plugin/`, `.claude-plugin/` veya varsayılan Claude/Cursor düzeni) — **paket** olarak işlenir

Bir dizin ikisini de içeriyorsa OpenClaw yerel yolu kullanır. Bu, çift biçimli
paketlerin kısmen paket olarak yüklenmesini önler.

## Runtime bağımlılıkları ve temizlik

- Üçüncü taraf uyumlu paketler startup `npm install` onarımı almaz. Bunlar
  `openclaw plugins install` üzerinden yüklenmeli ve ihtiyaç duydukları her şeyi
  yüklü Plugin dizininde sağlamalıdır.
- OpenClaw’a ait paketlenmiş Plugin’ler ya core içinde hafif olarak gönderilir ya da
  Plugin yükleyici üzerinden indirilebilir. Gateway startup hiçbir zaman onlar için
  paket yöneticisi çalıştırmaz.
- `openclaw doctor --fix`, legacy staged bağımlılık dizinlerini kaldırır ve
  yapılandırma bunlara başvurduğunda yerel Plugin dizininde eksik olan indirilebilir
  Plugin’leri kurtarabilir.

## Güvenlik

Paketlerin güven sınırı yerel Plugin’lere göre daha dardır:

- OpenClaw, keyfi paket runtime modüllerini süreç içinde yüklemez
- Skills ve hook-paketi yolları Plugin kökü içinde kalmalıdır (sınır kontrolü yapılır)
- Ayar dosyaları aynı sınır kontrolleriyle okunur
- Desteklenen stdio MCP sunucuları alt süreçler olarak başlatılabilir

Bu, paketleri varsayılan olarak daha güvenli yapar, ancak üçüncü taraf
paketleri, sundukları özellikler için yine de güvenilir içerik olarak ele almalısınız.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Paket algılanıyor ancak capability’ler çalışmıyor">
    `openclaw plugins inspect <id>` çalıştırın. Bir capability listelenmiş ancak
    bağlı değil olarak işaretlenmişse bu bir ürün sınırıdır; bozuk yükleme değildir.
  </Accordion>

  <Accordion title="Claude komut dosyaları görünmüyor">
    Paketin etkin olduğundan ve markdown dosyalarının algılanan bir
    `commands/` veya `skills/` kökü içinde olduğundan emin olun.
  </Accordion>

  <Accordion title="Claude ayarları uygulanmıyor">
    Yalnızca `settings.json` içindeki gömülü Pi ayarları desteklenir. OpenClaw,
    paket ayarlarını ham yapılandırma patch’leri olarak işlemez.
  </Accordion>

  <Accordion title="Claude hook’ları yürütülmüyor">
    `hooks/hooks.json` yalnızca algılama amaçlıdır. Çalıştırılabilir hook’lara ihtiyacınız varsa
    OpenClaw hook-paketi düzenini kullanın veya yerel bir Plugin gönderin.
  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin’leri Yükleme ve Yapılandırma](/tr/tools/plugin)
- [Plugin Oluşturma](/tr/plugins/building-plugins) — yerel bir Plugin oluşturun
- [Plugin Manifesti](/tr/plugins/manifest) — yerel manifest şeması
