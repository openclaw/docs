---
read_when:
    - Codex, Claude veya Cursor uyumlu bir paket kurmak istiyorsunuz
    - OpenClaw'ın paket içeriğini yerel özelliklere nasıl eşlediğini anlamanız gerekiyor
    - Paket algılamasını veya eksik yetenekleri hata ayıklıyorsunuz
summary: Codex, Claude ve Cursor paketlerini OpenClaw Plugin'leri olarak kurun ve kullanın
title: Plugin paketleri
x-i18n:
    generated_at: "2026-04-24T09:21:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: a455eaa64b227204ca4e2a6283644edb72d7a4cfad0f2fcf4439d061dcb374bc
    source_path: plugins/bundles.md
    workflow: 15
---

OpenClaw, üç harici ekosistemden Plugin kurabilir: **Codex**, **Claude**
ve **Cursor**. Bunlara **paketler** denir — OpenClaw'ın
Skills, kancalar ve MCP araçları gibi yerel özelliklere eşlediği içerik ve meta veri paketleri.

<Info>
  Paketler, yerel OpenClaw Plugin'leri ile **aynı şey değildir**. Yerel Plugin'ler
  süreç içinde çalışır ve herhangi bir yetenek kaydedebilir. Paketler ise
  seçici özellik eşlemesi ve daha dar bir güven sınırı olan içerik paketleridir.
</Info>

## Paketler neden var

Birçok yararlı Plugin, Codex, Claude veya Cursor biçiminde yayımlanır. OpenClaw,
yazarların bunları yerel OpenClaw Plugin'leri olarak yeniden yazmasını istemek yerine
bu biçimleri algılar ve desteklenen içeriklerini yerel özellik kümesine eşler. Bu, bir Claude komut paketi veya Codex Skill paketini
kurup hemen kullanabileceğiniz anlamına gelir.

## Bir paket kurun

<Steps>
  <Step title="Bir dizinden, arşivden veya marketplace'ten kurun">
    ```bash
    # Yerel dizin
    openclaw plugins install ./my-bundle

    # Arşiv
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

    Paketler, `codex`, `claude` veya `cursor` alt türü ile `Format: bundle` olarak görünür.

  </Step>

  <Step title="Yeniden başlatın ve kullanın">
    ```bash
    openclaw gateway restart
    ```

    Eşlenen özellikler (Skills, kancalar, MCP araçları, LSP varsayılanları) bir sonraki oturumda kullanılabilir olur.

  </Step>
</Steps>

## OpenClaw'ın paketlerden eşlediği şeyler

Bugün OpenClaw içinde her paket özelliği çalışmaz. Burada neyin çalıştığı ve neyin algılandığı ama henüz bağlanmadığı belirtilmiştir.

### Şimdi desteklenenler

| Özellik        | Nasıl eşlenir                                                                                | Şuna uygulanır |
| -------------- | -------------------------------------------------------------------------------------------- | -------------- |
| Skill içeriği  | Paket Skill kökleri normal OpenClaw Skills olarak yüklenir                                   | Tüm biçimler   |
| Komutlar       | `commands/` ve `.cursor/commands/`, Skill kökleri olarak ele alınır                          | Claude, Cursor |
| Kanca paketleri | OpenClaw tarzı `HOOK.md` + `handler.ts` düzenleri                                           | Codex          |
| MCP araçları   | Paket MCP config'i gömülü Pi ayarlarına birleştirilir; desteklenen stdio ve HTTP sunucuları yüklenir | Tüm biçimler |
| LSP sunucuları | Claude `.lsp.json` ve manifest'te bildirilen `lspServers`, gömülü Pi LSP varsayılanlarına birleştirilir | Claude |
| Ayarlar        | Claude `settings.json`, gömülü Pi varsayılanları olarak içe aktarılır                        | Claude         |

#### Skill içeriği

- paket Skill kökleri normal OpenClaw Skill kökleri olarak yüklenir
- Claude `commands` kökleri ek Skill kökleri olarak ele alınır
- Cursor `.cursor/commands` kökleri ek Skill kökleri olarak ele alınır

Bu, Claude markdown komut dosyalarının normal OpenClaw Skill
yükleyicisi üzerinden çalıştığı anlamına gelir. Cursor komut markdown'ı da aynı yol üzerinden çalışır.

#### Kanca paketleri

- paket kanca kökleri **yalnızca** normal OpenClaw kanca paketi
  düzenini kullandıklarında çalışır. Bugün bu öncelikle Codex uyumlu durumdur:
  - `HOOK.md`
  - `handler.ts` veya `handler.js`

#### Pi için MCP

- etkin paketler MCP sunucu config'ine katkıda bulunabilir
- OpenClaw, paket MCP config'ini etkin gömülü Pi ayarlarına
  `mcpServers` olarak birleştirir
- OpenClaw, stdio sunucuları başlatarak veya HTTP sunucularına bağlanarak
  gömülü Pi aracı turları sırasında desteklenen paket MCP araçlarını sunar
- `coding` ve `messaging` araç profilleri varsayılan olarak paket MCP araçlarını içerir; bir aracı veya gateway için devre dışı bırakmak üzere `tools.deny: ["bundle-mcp"]` kullanın
- proje yerel Pi ayarları, paket varsayılanlarından sonra yine uygulanır; bu yüzden çalışma alanı
  ayarları gerektiğinde paket MCP girdilerini geçersiz kılabilir
- paket MCP araç katalogları kayıt öncesi deterministik olarak sıralanır; böylece
  upstream `listTools()` sırası değişiklikleri prompt-cache araç bloklarını bozmaz

##### Taşımalar

MCP sunucuları stdio veya HTTP taşıması kullanabilir:

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

**HTTP**, varsayılan olarak `sse`, istendiğinde ise `streamable-http` üzerinden çalışan bir MCP sunucusuna bağlanır:

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
- yalnızca `http:` ve `https:` URL düzenlerine izin verilir
- `headers` değerleri `${ENV_VAR}` yerine koymayı destekler
- hem `command` hem de `url` içeren bir sunucu girdisi reddedilir
- URL kimlik bilgileri (userinfo ve sorgu parametreleri) araç
  açıklamalarından ve günlüklerden redakte edilir
- `connectionTimeoutMs`, hem stdio hem de HTTP taşımaları için varsayılan 30 saniyelik bağlantı zaman aşımını geçersiz kılar

##### Araç adlandırma

OpenClaw, paket MCP araçlarını sağlayıcı açısından güvenli adlarla
`serverName__toolName` biçiminde kaydeder. Örneğin `"vigil-harbor"` anahtarlı ve
`memory_search` aracını sunan bir sunucu `vigil-harbor__memory_search` olarak kaydolur.

- `A-Za-z0-9_-` dışındaki karakterler `-` ile değiştirilir
- sunucu önekleri 30 karakterle sınırlandırılır
- tam araç adları 64 karakterle sınırlandırılır
- boş sunucu adları `mcp` olarak fallback yapar
- çakışan sanitize adlar sayısal soneklerle ayrıştırılır
- tekrar eden Pi
  turlarını önbellek açısından kararlı tutmak için nihai sunulan araç sırası güvenli ada göre deterministiktir
- profil filtreleme, bir paket MCP sunucusundaki tüm araçları
  `bundle-mcp` tarafından sahiplenilen Plugin araçları olarak ele alır; böylece profil allowlist'leri ve deny listeleri ya
  tek tek sunulan araç adlarını ya da `bundle-mcp` Plugin anahtarını içerebilir

#### Gömülü Pi ayarları

- Claude `settings.json`, paket
  etkin olduğunda varsayılan gömülü Pi ayarları olarak içe aktarılır
- OpenClaw, uygulamadan önce kabuk geçersiz kılma anahtarlarını sanitize eder

Sanitize edilen anahtarlar:

- `shellPath`
- `shellCommandPrefix`

#### Gömülü Pi LSP

- etkin Claude paketleri LSP sunucu config'ine katkıda bulunabilir
- OpenClaw `.lsp.json` ile manifest'te bildirilen `lspServers` yollarını yükler
- paket LSP config'i, etkin gömülü Pi LSP varsayılanlarına birleştirilir
- bugün yalnızca desteklenen stdio destekli LSP sunucuları çalıştırılabilir; desteklenmeyen
  taşımalar yine de `openclaw plugins inspect <id>` içinde görünür

### Algılanır ama yürütülmez

Bunlar tanınır ve tanılamada gösterilir, ancak OpenClaw bunları çalıştırmaz:

- Claude `agents`, `hooks.json` otomasyonu, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Yetenek raporlamasının ötesindeki Codex satır içi/uygulama meta verileri

## Paket biçimleri

<AccordionGroup>
  <Accordion title="Codex paketleri">
    İşaretleyiciler: `.codex-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex paketleri, Skill kökleri ve OpenClaw tarzı
    kanca paketi dizinleri (`HOOK.md` + `handler.ts`) kullandıklarında OpenClaw'a en iyi uyum sağlar.

  </Accordion>

  <Accordion title="Claude paketleri">
    İki algılama modu:

    - **Manifest tabanlı:** `.claude-plugin/plugin.json`
    - **Manifest'siz:** varsayılan Claude düzeni (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude'ya özgü davranış:

    - `commands/`, Skill içeriği olarak ele alınır
    - `settings.json`, gömülü Pi ayarlarına içe aktarılır (kabuk geçersiz kılma anahtarları sanitize edilir)
    - `.mcp.json`, gömülü Pi için desteklenen stdio araçlarını sunar
    - `.lsp.json` ile manifest'te bildirilen `lspServers` yolları, gömülü Pi LSP varsayılanlarına yüklenir
    - `hooks/hooks.json` algılanır ama yürütülmez
    - Manifest içindeki özel bileşen yolları toplamsaldır (varsayılanların yerini almaz, onları genişletir)

  </Accordion>

  <Accordion title="Cursor paketleri">
    İşaretleyiciler: `.cursor-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/`, Skill içeriği olarak ele alınır
    - `.cursor/rules/`, `.cursor/agents/` ve `.cursor/hooks.json` yalnızca algılamadır

  </Accordion>
</AccordionGroup>

## Algılama önceliği

OpenClaw önce yerel Plugin biçimini kontrol eder:

1. `openclaw.plugin.json` veya `openclaw.extensions` içeren geçerli `package.json` — **yerel Plugin** olarak ele alınır
2. Paket işaretleyicileri (`.codex-plugin/`, `.claude-plugin/` veya varsayılan Claude/Cursor düzeni) — **paket** olarak ele alınır

Bir dizin her ikisini de içeriyorsa, OpenClaw yerel yolu kullanır. Bu,
çift biçimli paketlerin kısmen paket olarak kurulmasını önler.

## Çalışma zamanı bağımlılıkları ve temizlik

- Paketlenmiş Plugin çalışma zamanı bağımlılıkları, OpenClaw paketinin
  `dist/*` altında gönderilir. OpenClaw başlangıçta paketlenmiş
  Plugin'ler için `npm install` çalıştırmaz; tam bir paketlenmiş
  bağımlılık payload'u göndermek sürüm hattının sorumluluğundadır (bkz.
  [Releasing](/tr/reference/RELEASING) içindeki yayımlama sonrası doğrulama kuralı).

## Güvenlik

Paketlerin güven sınırı, yerel Plugin'lere göre daha dardır:

- OpenClaw, rastgele paket çalışma zamanı modüllerini süreç içinde **yüklemez**
- Skill ve kanca paketi yolları Plugin kökü içinde kalmalıdır (sınır denetimli)
- Ayar dosyaları da aynı sınır denetimleriyle okunur
- Desteklenen stdio MCP sunucuları alt süreç olarak başlatılabilir

Bu, paketleri varsayılan olarak daha güvenli yapar, ancak yine de üçüncü taraf
paketleri sundukları özellikler için güvenilir içerik olarak değerlendirmelisiniz.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Paket algılanıyor ama yetenekler çalışmıyor">
    `openclaw plugins inspect <id>` çalıştırın. Bir yetenek listeleniyor ama
    bağlanmadı olarak işaretleniyorsa, bu bozuk kurulum değil, ürün sınırlamasıdır.
  </Accordion>

  <Accordion title="Claude komut dosyaları görünmüyor">
    Paketin etkin olduğundan ve markdown dosyalarının algılanan
    `commands/` veya `skills/` kökü içinde olduğundan emin olun.
  </Accordion>

  <Accordion title="Claude ayarları uygulanmıyor">
    Yalnızca `settings.json` içindeki gömülü Pi ayarları desteklenir. OpenClaw,
    paket ayarlarını ham config patch'leri olarak değerlendirmez.
  </Accordion>

  <Accordion title="Claude kancaları çalışmıyor">
    `hooks/hooks.json` yalnızca algılamadır. Çalıştırılabilir kancalara ihtiyacınız varsa
    OpenClaw kanca paketi düzenini kullanın veya yerel bir Plugin gönderin.
  </Accordion>
</AccordionGroup>

## İlgili

- [Install and Configure Plugins](/tr/tools/plugin)
- [Building Plugins](/tr/plugins/building-plugins) — yerel bir Plugin oluşturun
- [Plugin Manifest](/tr/plugins/manifest) — yerel manifest şeması
