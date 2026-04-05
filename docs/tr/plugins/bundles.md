---
read_when:
    - Codex, Claude veya Cursor ile uyumlu bir paket yüklemek istediğinizde
    - OpenClaw'un paket içeriğini yerel özelliklere nasıl eşlediğini anlamanız gerektiğinde
    - paket algılama veya eksik yeteneklerde hata ayıklarken
summary: Codex, Claude ve Cursor paketlerini OpenClaw plugin'leri olarak yükleyin ve kullanın
title: Plugin Paketleri
x-i18n:
    generated_at: "2026-04-05T14:01:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8b1eb4633bdff75425d8c2e29be352e11a4cdad7f420c0c66ae5ef07bf9bdcc
    source_path: plugins/bundles.md
    workflow: 15
---

# Plugin Paketleri

OpenClaw, üç harici ekosistemden plugin yükleyebilir: **Codex**, **Claude**,
ve **Cursor**. Bunlara **paketler** denir — OpenClaw'un Skills, hook'lar ve MCP araçları gibi yerel özelliklere eşlediği içerik ve meta veri paketleri.

<Info>
  Paketler, yerel OpenClaw plugin'leriyle **aynı şey değildir**. Yerel plugin'ler
  işlem içinde çalışır ve herhangi bir yeteneği kaydedebilir. Paketler ise
  seçmeli özellik eşlemesi ve daha dar bir güven sınırı olan içerik paketleridir.
</Info>

## Paketler neden vardır

Birçok yararlı plugin, Codex, Claude veya Cursor biçiminde yayımlanır. OpenClaw,
yazarların bunları yerel OpenClaw plugin'leri olarak yeniden yazmasını istemek
yerine bu biçimleri algılar ve desteklenen içeriklerini yerel özellik kümesine
eşler. Bu, bir Claude komut paketini veya bir Codex Skills paketini yükleyip
hemen kullanabileceğiniz anlamına gelir.

## Bir paket yükleyin

<Steps>
  <Step title="Bir dizinden, arşivden veya marketplace'ten yükleyin">
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

    Paketler, `codex`, `claude` veya `cursor` alt türüne sahip `Format: bundle` olarak görünür.

  </Step>

  <Step title="Yeniden başlatın ve kullanın">
    ```bash
    openclaw gateway restart
    ```

    Eşlenen özellikler (Skills, hook'lar, MCP araçları, LSP varsayılanları) sonraki oturumda kullanılabilir olur.

  </Step>
</Steps>

## OpenClaw'un paketlerden eşledikleri

Bugün her paket özelliği OpenClaw'da çalışmaz. Burada neyin çalıştığı ve neyin
algılandığı ancak henüz bağlanmadığı açıklanmıştır.

### Şu anda desteklenenler

| Özellik         | Nasıl eşlenir                                                                              | Şunlar için geçerlidir |
| --------------- | ------------------------------------------------------------------------------------------ | ---------------------- |
| Skill içeriği   | Paket skill kökleri normal OpenClaw Skills olarak yüklenir                                 | Tüm biçimler           |
| Komutlar        | `commands/` ve `.cursor/commands/` skill kökleri olarak değerlendirilir                    | Claude, Cursor         |
| Hook paketleri  | OpenClaw tarzı `HOOK.md` + `handler.ts` düzenleri                                          | Codex                  |
| MCP araçları    | Paket MCP yapılandırması gömülü Pi ayarlarına birleştirilir; desteklenen stdio ve HTTP sunucuları yüklenir | Tüm biçimler |
| LSP sunucuları  | Claude `.lsp.json` ve manifest içinde bildirilen `lspServers`, gömülü Pi LSP varsayılanlarına birleştirilir | Claude |
| Ayarlar         | Claude `settings.json`, gömülü Pi varsayılanları olarak içe aktarılır                      | Claude                 |

#### Skill içeriği

- paket skill kökleri normal OpenClaw Skills kökleri olarak yüklenir
- Claude `commands` kökleri ek skill kökleri olarak değerlendirilir
- Cursor `.cursor/commands` kökleri ek skill kökleri olarak değerlendirilir

Bu, Claude markdown komut dosyalarının normal OpenClaw Skills yükleyicisi
üzerinden çalıştığı anlamına gelir. Cursor komut markdown'u da aynı yol
üzerinden çalışır.

#### Hook paketleri

- paket hook kökleri, yalnızca normal OpenClaw hook-paketi düzenini
  kullandıklarında çalışır. Bugün bu öncelikle Codex ile uyumlu durumdur:
  - `HOOK.md`
  - `handler.ts` veya `handler.js`

#### Pi için MCP

- etkin paketler MCP sunucu yapılandırmasına katkıda bulunabilir
- OpenClaw, paket MCP yapılandırmasını etkin gömülü Pi ayarlarına
  `mcpServers` olarak birleştirir
- OpenClaw, stdio sunucuları başlatarak veya HTTP sunucularına bağlanarak
  gömülü Pi aracı turları sırasında desteklenen paket MCP araçlarını sunar
- proje yerelindeki Pi ayarları, paket varsayılanlarından sonra yine uygulanır;
  bu nedenle gerektiğinde çalışma alanı ayarları paket MCP girdilerini geçersiz kılabilir
- paket MCP araç katalogları, kaydetmeden önce deterministik olarak sıralanır;
  böylece yukarı akış `listTools()` sırası değişiklikleri prompt-cache araç bloklarını bozmaz

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

**HTTP**, varsayılan olarak `sse` üzerinden çalışan bir MCP sunucusuna veya istenirse `streamable-http` üzerinden bağlanır:

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

- `transport`, `"streamable-http"` veya `"sse"` olarak ayarlanabilir; belirtilmezse OpenClaw `sse` kullanır
- yalnızca `http:` ve `https:` URL şemalarına izin verilir
- `headers` değerleri `${ENV_VAR}` enterpolasyonunu destekler
- hem `command` hem `url` içeren bir sunucu girdisi reddedilir
- URL kimlik bilgileri (userinfo ve sorgu parametreleri), araç
  açıklamalarından ve günlüklerden sansürlenir
- `connectionTimeoutMs`, hem stdio hem de HTTP taşımaları için
  varsayılan 30 saniyelik bağlantı zaman aşımını geçersiz kılar

##### Araç adlandırma

OpenClaw, paket MCP araçlarını sağlayıcı açısından güvenli adlarla
`serverName__toolName` biçiminde kaydeder. Örneğin, `"vigil-harbor"` anahtarlı ve
`memory_search` aracını sunan bir sunucu, `vigil-harbor__memory_search` olarak kaydedilir.

- `A-Za-z0-9_-` dışındaki karakterler `-` ile değiştirilir
- sunucu önekleri en fazla 30 karakterle sınırlandırılır
- tam araç adları en fazla 64 karakterle sınırlandırılır
- boş sunucu adları `mcp` değerine geri döner
- çakışan temizlenmiş adlar sayısal son eklerle ayrıştırılır
- son görünen araç sırası, tekrarlanan Pi
  turlarını önbellek açısından kararlı tutmak için güvenli ada göre deterministiktir

#### Gömülü Pi ayarları

- Claude `settings.json`, paket etkin olduğunda varsayılan gömülü Pi ayarları olarak
  içe aktarılır
- OpenClaw, uygulamadan önce shell geçersiz kılma anahtarlarını temizler

Temizlenen anahtarlar:

- `shellPath`
- `shellCommandPrefix`

#### Gömülü Pi LSP

- etkin Claude paketleri LSP sunucu yapılandırmasına katkıda bulunabilir
- OpenClaw, `.lsp.json` ile birlikte manifest içinde bildirilen tüm `lspServers` yollarını yükler
- paket LSP yapılandırması etkin gömülü Pi LSP varsayılanlarına birleştirilir
- bugün yalnızca desteklenen stdio tabanlı LSP sunucuları çalıştırılabilir; desteklenmeyen
  taşımalar yine de `openclaw plugins inspect <id>` içinde görünür

### Algılanan ancak çalıştırılmayanlar

Bunlar tanınır ve tanılamada gösterilir, ancak OpenClaw bunları çalıştırmaz:

- Claude `agents`, `hooks.json` otomasyonu, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- Yetenek raporlamasının ötesindeki Codex satır içi/uygulama meta verileri

## Paket biçimleri

<AccordionGroup>
  <Accordion title="Codex paketleri">
    İşaretleyiciler: `.codex-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex paketleri, skill kökleri ve OpenClaw tarzı
    hook-paketi dizinleri (`HOOK.md` + `handler.ts`) kullandıklarında OpenClaw'a en iyi şekilde uyar.

  </Accordion>

  <Accordion title="Claude paketleri">
    İki algılama modu:

    - **Manifest tabanlı:** `.claude-plugin/plugin.json`
    - **Manifestsiz:** varsayılan Claude düzeni (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude'a özgü davranış:

    - `commands/` skill içeriği olarak değerlendirilir
    - `settings.json`, gömülü Pi ayarlarına içe aktarılır (shell geçersiz kılma anahtarları temizlenir)
    - `.mcp.json`, desteklenen stdio araçlarını gömülü Pi'ye sunar
    - `.lsp.json` ile manifest içinde bildirilen `lspServers` yolları, gömülü Pi LSP varsayılanlarına yüklenir
    - `hooks/hooks.json` algılanır ancak çalıştırılmaz
    - Manifest içindeki özel bileşen yolları ekleyicidir (varsayılanları değiştirmez, genişletir)

  </Accordion>

  <Accordion title="Cursor paketleri">
    İşaretleyiciler: `.cursor-plugin/plugin.json`

    İsteğe bağlı içerik: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` skill içeriği olarak değerlendirilir
    - `.cursor/rules/`, `.cursor/agents/` ve `.cursor/hooks.json` yalnızca algılama içindir

  </Accordion>
</AccordionGroup>

## Algılama önceliği

OpenClaw önce yerel plugin biçimini denetler:

1. `openclaw.plugin.json` veya `openclaw.extensions` içeren geçerli `package.json` — **yerel plugin** olarak değerlendirilir
2. Paket işaretleyicileri (`.codex-plugin/`, `.claude-plugin/` veya varsayılan Claude/Cursor düzeni) — **paket** olarak değerlendirilir

Bir dizin her ikisini de içeriyorsa OpenClaw yerel yolu kullanır. Bu, çift biçimli paketlerin kısmen paket olarak yüklenmesini önler.

## Güvenlik

Paketlerin güven sınırı, yerel plugin'lere göre daha dardır:

- OpenClaw, rastgele paket çalışma zamanı modüllerini işlem içinde yüklemez
- Skills ve hook-paketi yolları plugin kökü içinde kalmalıdır (sınır denetimli)
- Ayar dosyaları aynı sınır denetimleriyle okunur
- Desteklenen stdio MCP sunucuları alt süreç olarak başlatılabilir

Bu, paketleri varsayılan olarak daha güvenli hâle getirir; ancak yine de üçüncü taraf
paketleri, açığa çıkardıkları özellikler için güvenilir içerik olarak değerlendirmelisiniz.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Paket algılanıyor ama yetenekler çalışmıyor">
    `openclaw plugins inspect <id>` komutunu çalıştırın. Bir yetenek listelenmiş ancak
    bağlanmamış olarak işaretlenmişse bu bir bozuk yükleme değil, ürün sınırıdır.
  </Accordion>

  <Accordion title="Claude komut dosyaları görünmüyor">
    Paketin etkin olduğundan ve markdown dosyalarının algılanan bir
    `commands/` veya `skills/` kökü içinde bulunduğundan emin olun.
  </Accordion>

  <Accordion title="Claude ayarları uygulanmıyor">
    Yalnızca `settings.json` içindeki gömülü Pi ayarları desteklenir. OpenClaw,
    paket ayarlarını ham yapılandırma yamaları olarak değerlendirmez.
  </Accordion>

  <Accordion title="Claude hook'ları çalışmıyor">
    `hooks/hooks.json` yalnızca algılama içindir. Çalıştırılabilir hook'lara ihtiyacınız varsa
    OpenClaw hook-paketi düzenini kullanın veya yerel bir plugin gönderin.
  </Accordion>
</AccordionGroup>

## İlgili

- [Plugin'leri Yükleme ve Yapılandırma](/tools/plugin)
- [Plugin Geliştirme](/plugins/building-plugins) — yerel bir plugin oluşturun
- [Plugin Manifesti](/plugins/manifest) — yerel manifest şeması
