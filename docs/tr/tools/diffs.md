---
read_when:
    - Ajanların kod veya Markdown düzenlemelerini farklar olarak göstermesini istiyorsunuz
    - Kanvasa hazır bir görüntüleyici URL'si veya işlenmiş bir diff dosyası istiyorsunuz
    - Güvenli varsayılanlarla kontrollü, geçici diff yapıtlarına ihtiyacınız var
sidebarTitle: Diffs
summary: Ajanlar için salt okunur fark görüntüleyicisi ve dosya görüntüleyici (isteğe bağlı Plugin aracı)
title: Farklar
x-i18n:
    generated_at: "2026-05-02T09:07:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 935f19ce45ff9a91d2c87c70603ce39b0f27f3fe58e52d809f25000a0c1ae82f
    source_path: tools/diffs.md
    workflow: 16
---

`diffs`, kısa yerleşik sistem yönergelerine ve değişiklik içeriğini aracıların kullanımı için salt okunur bir diff yapıtına dönüştüren eşlik eden bir skill’e sahip isteğe bağlı bir plugin aracıdır.

Şunlardan birini kabul eder:

- `before` ve `after` metni
- unified `patch`

Şunları döndürebilir:

- canvas sunumu için Gateway görüntüleyici URL’si
- ileti teslimi için işlenmiş dosya yolu (PNG veya PDF)
- tek çağrıda iki çıktı birden

Etkinleştirildiğinde plugin, sistem istemi alanına kısa kullanım yönergeleri ekler ve aracının daha kapsamlı talimatlara ihtiyaç duyduğu durumlar için ayrıntılı bir skill de sunar.

## Hızlı başlangıç

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Enable the plugin">
    ```json5
    {
      plugins: {
        entries: {
          diffs: {
            enabled: true,
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Pick a mode">
    <Tabs>
      <Tab title="view">
        Canvas öncelikli akışlar: aracılar `diffs` aracını `mode: "view"` ile çağırır ve `details.viewerUrl` değerini `canvas present` ile açar.
      </Tab>
      <Tab title="file">
        Sohbet dosyası teslimi: aracılar `diffs` aracını `mode: "file"` ile çağırır ve `details.filePath` değerini `message` ile, `path` veya `filePath` kullanarak gönderir.
      </Tab>
      <Tab title="both">
        Birleşik: aracılar tek çağrıda iki yapıtı da almak için `diffs` aracını `mode: "both"` ile çağırır.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Yerleşik sistem yönergelerini devre dışı bırakma

`diffs` aracını etkin tutup yerleşik sistem istemi yönergelerini devre dışı bırakmak istiyorsanız `plugins.entries.diffs.hooks.allowPromptInjection` değerini `false` olarak ayarlayın:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

Bu, plugin’i, aracı ve eşlik eden skill’i kullanılabilir tutarken diffs plugin’inin `before_prompt_build` hook’unu engeller.

Hem yönergeleri hem de aracı devre dışı bırakmak istiyorsanız bunun yerine plugin’i devre dışı bırakın.

## Tipik aracı iş akışı

<Steps>
  <Step title="Call diffs">
    Aracı, girdilerle birlikte `diffs` aracını çağırır.
  </Step>
  <Step title="Read details">
    Aracı yanıttaki `details` alanlarını okur.
  </Step>
  <Step title="Present">
    Aracı ya `details.viewerUrl` değerini `canvas present` ile açar, ya `details.filePath` değerini `message` ile `path` veya `filePath` kullanarak gönderir ya da ikisini birden yapar.
  </Step>
</Steps>

## Girdi örnekleri

<Tabs>
  <Tab title="Before and after">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## Araç girdisi başvurusu

Belirtilmedikçe tüm alanlar isteğe bağlıdır.

<ParamField path="before" type="string">
  Özgün metin. `patch` atlandığında `after` ile birlikte gereklidir.
</ParamField>
<ParamField path="after" type="string">
  Güncellenmiş metin. `patch` atlandığında `before` ile birlikte gereklidir.
</ParamField>
<ParamField path="patch" type="string">
  Unified diff metni. `before` ve `after` ile karşılıklı olarak dışlayıcıdır.
</ParamField>
<ParamField path="path" type="string">
  before ve after modu için görüntüleme dosya adı.
</ParamField>
<ParamField path="lang" type="string">
  before ve after modu için dil geçersiz kılma ipucu. Bilinmeyen değerler düz metne geri döner.
</ParamField>
<ParamField path="title" type="string">
  Görüntüleyici başlığı geçersiz kılma.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Çıktı modu. Varsayılan olarak plugin varsayılanı `defaults.mode` kullanılır. Kullanımdan kaldırılmış takma ad: `"image"`, `"file"` gibi davranır ve geriye dönük uyumluluk için hâlâ kabul edilir.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Görüntüleyici teması. Varsayılan olarak plugin varsayılanı `defaults.theme` kullanılır.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff yerleşimi. Varsayılan olarak plugin varsayılanı `defaults.layout` kullanılır.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Tam bağlam kullanılabilir olduğunda değişmeyen bölümleri genişletir. Yalnızca çağrı başına seçenektir (plugin varsayılan anahtarı değildir).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  İşlenmiş dosya biçimi. Varsayılan olarak plugin varsayılanı `defaults.fileFormat` kullanılır.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG veya PDF işleme için kalite ön ayarı.
</ParamField>
<ParamField path="fileScale" type="number">
  Cihaz ölçeği geçersiz kılma (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSS pikseli cinsinden en fazla işleme genişliği (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  Görüntüleyici ve bağımsız dosya çıktıları için saniye cinsinden yapıt TTL’si. En fazla 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Görüntüleyici URL kaynağı geçersiz kılma. Plugin `viewerBaseUrl` değerini geçersiz kılar. `http` veya `https` olmalıdır, sorgu/hash içeremez.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    Geriye dönük uyumluluk için hâlâ kabul edilir:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` ve `after` her biri en fazla 512 KiB olabilir.
    - `patch` en fazla 2 MiB olabilir.
    - `path` en fazla 2048 bayt olabilir.
    - `lang` en fazla 128 bayt olabilir.
    - `title` en fazla 1024 bayt olabilir.
    - Patch karmaşıklık sınırı: en fazla 128 dosya ve toplam 120000 satır.
    - `patch` ile `before` veya `after` birlikte reddedilir.
    - İşlenmiş dosya güvenlik sınırları (PNG ve PDF için geçerlidir):
      - `fileQuality: "standard"`: en fazla 8 MP (8.000.000 işlenmiş piksel).
      - `fileQuality: "hq"`: en fazla 14 MP (14.000.000 işlenmiş piksel).
      - `fileQuality: "print"`: en fazla 24 MP (24.000.000 işlenmiş piksel).
      - PDF için ayrıca en fazla 50 sayfa sınırı vardır.

  </Accordion>
</AccordionGroup>

## Çıktı ayrıntıları sözleşmesi

Araç, yapılandırılmış meta verileri `details` altında döndürür.

<AccordionGroup>
  <Accordion title="Viewer fields">
    Görüntüleyici oluşturan modlar için paylaşılan alanlar:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (kullanılabildiğinde `agentId`, `sessionId`, `messageChannel`, `agentAccountId`)

  </Accordion>
  <Accordion title="File fields">
    PNG veya PDF işlendiğinde dosya alanları:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (`filePath` ile aynı değer, ileti aracı uyumluluğu için)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases">
    Mevcut çağıranlar için ayrıca döndürülür:

    - `format` (`fileFormat` ile aynı değer)
    - `imagePath` (`filePath` ile aynı değer)
    - `imageBytes` (`fileBytes` ile aynı değer)
    - `imageQuality` (`fileQuality` ile aynı değer)
    - `imageScale` (`fileScale` ile aynı değer)
    - `imageMaxWidth` (`fileMaxWidth` ile aynı değer)

  </Accordion>
</AccordionGroup>

Mod davranışı özeti:

| Mod      | Döndürülen                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Yalnızca görüntüleyici alanları.                                                                                       |
| `"file"` | Yalnızca dosya alanları, görüntüleyici yapıtı yok.                                                                      |
| `"both"` | Görüntüleyici alanları ve dosya alanları. Dosya işleme başarısız olursa görüntüleyici yine `fileError` ve `imageError` takma adıyla döner. |

## Daraltılmış değişmeyen bölümler

- Görüntüleyici `N unmodified lines` gibi satırlar gösterebilir.
- Bu satırlardaki genişletme kontrolleri koşulludur ve her girdi türü için garanti edilmez.
- Genişletme kontrolleri, işlenmiş diff genişletilebilir bağlam verisine sahip olduğunda görünür; bu, before ve after girdileri için tipiktir.
- Birçok unified patch girdisinde, atlanan bağlam gövdeleri ayrıştırılmış patch hunk’larında bulunmaz; bu nedenle satır genişletme kontrolleri olmadan görünebilir. Bu beklenen davranıştır.
- `expandUnchanged` yalnızca genişletilebilir bağlam mevcut olduğunda uygulanır.

## Plugin varsayılanları

Plugin genelindeki varsayılanları `~/.openclaw/openclaw.json` içinde ayarlayın:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

Desteklenen varsayılanlar:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

Açık araç parametreleri bu varsayılanları geçersiz kılar.

### Kalıcı görüntüleyici URL yapılandırması

<ParamField path="viewerBaseUrl" type="string">
  Bir araç çağrısı `baseUrl` geçirmediğinde döndürülen görüntüleyici bağlantıları için plugin’in sahip olduğu geri dönüş değeri. `http` veya `https` olmalıdır, sorgu/hash içeremez.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## Güvenlik yapılandırması

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: görüntüleyici rotalarına yapılan local loopback dışı istekler reddedilir. `true`: token’lı yol geçerliyse uzak görüntüleyicilere izin verilir.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## Yapıt yaşam döngüsü ve depolama

- Yapıtlar temp alt klasörü altında depolanır: `$TMPDIR/openclaw-diffs`.
- Görüntüleyici yapıt meta verileri şunları içerir:
  - rastgele yapıt kimliği (20 hex karakter)
  - rastgele token (48 hex karakter)
  - `createdAt` ve `expiresAt`
  - depolanan `viewer.html` yolu
- Belirtilmediğinde varsayılan yapıt TTL’si 30 dakikadır.
- Kabul edilen en fazla görüntüleyici TTL’si 6 saattir.
- Temizleme, yapıt oluşturulduktan sonra fırsat buldukça çalışır.
- Süresi dolmuş yapıtlar silinir.
- Geri dönüş temizliği, meta veri eksik olduğunda 24 saatten eski bayat klasörleri kaldırır.

## Görüntüleyici URL’si ve ağ davranışı

Görüntüleyici rotası:

- `/plugins/diffs/view/{artifactId}/{token}`

Görüntüleyici varlıkları:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Görüntüleyici belgesi bu varlıkları görüntüleyici URL’sine göre çözümler; bu nedenle isteğe bağlı `baseUrl` yol öneki iki varlık isteği için de korunur.

URL oluşturma davranışı:

- Araç çağrısı `baseUrl` sağlanırsa, sıkı doğrulamadan sonra kullanılır.
- Aksi halde plugin `viewerBaseUrl` yapılandırılmışsa kullanılır.
- İki geçersiz kılma da yoksa görüntüleyici URL’si varsayılan olarak loopback `127.0.0.1` olur.
- Gateway bind modu `custom` ise ve `gateway.customBindHost` ayarlanmışsa o host kullanılır.

`baseUrl` kuralları:

- `http://` veya `https://` olmalıdır.
- Sorgu ve hash reddedilir.
- Kaynak ve isteğe bağlı taban yoluna izin verilir.

## Güvenlik modeli

<AccordionGroup>
  <Accordion title="Görüntüleyici güçlendirme">
    - Varsayılan olarak yalnızca loopback.
    - Katı kimlik ve belirteç doğrulamasıyla belirteçli görüntüleyici yolları.
    - Görüntüleyici yanıt CSP'si:
      - `default-src 'none'`
      - betikler ve varlıklar yalnızca kendinden
      - giden `connect-src` yok
    - Uzak erişim etkinleştirildiğinde uzak ıskalama sınırlaması:
      - 60 saniyede 40 hata
      - 60 saniye kilitleme (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Dosya işleme güçlendirme">
    - Ekran görüntüsü tarayıcı isteği yönlendirmesi varsayılan olarak reddeder.
    - Yalnızca `http://127.0.0.1/plugins/diffs/assets/*` konumundaki yerel görüntüleyici varlıklarına izin verilir.
    - Harici ağ istekleri engellenir.

  </Accordion>
</AccordionGroup>

## Dosya modu için tarayıcı gereksinimleri

`mode: "file"` ve `mode: "both"` Chromium uyumlu bir tarayıcı gerektirir.

Çözüm sırası:

<Steps>
  <Step title="Yapılandırma">
    OpenClaw yapılandırmasında `browser.executablePath`.
  </Step>
  <Step title="Ortam değişkenleri">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Platform yedeği">
    Platform komutu/yol keşfi yedeği.
  </Step>
</Steps>

Yaygın hata metni:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Chrome, Chromium, Edge veya Brave kurarak ya da yukarıdaki çalıştırılabilir yol seçeneklerinden birini ayarlayarak düzeltin.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Girdi doğrulama hataları">
    - `Provide patch or both before and after text.` — hem `before` hem de `after` ekleyin ya da `patch` sağlayın.
    - `Provide either patch or before/after input, not both.` — girdi modlarını karıştırmayın.
    - `Invalid baseUrl: ...` — isteğe bağlı yolla `http(s)` kaynağı kullanın, sorgu/hash kullanmayın.
    - `{field} exceeds maximum size (...)` — yük boyutunu azaltın.
    - Büyük yama reddi — yama dosyası sayısını veya toplam satır sayısını azaltın.

  </Accordion>
  <Accordion title="Görüntüleyici erişilebilirliği">
    - Görüntüleyici URL'si varsayılan olarak `127.0.0.1` adresine çözümlenir.
    - Uzak erişim senaryoları için şunlardan birini yapın:
      - Plugin `viewerBaseUrl` değerini ayarlayın, veya
      - her araç çağrısında `baseUrl` geçirin, veya
      - `gateway.bind=custom` ve `gateway.customBindHost` kullanın
    - `gateway.trustedProxies`, aynı ana makine proxy'si için loopback içeriyorsa (örneğin Tailscale Serve), iletilmiş istemci-IP üst bilgileri olmayan ham loopback görüntüleyici istekleri tasarım gereği kapalı başarısız olur.
    - Bu proxy topolojisi için:
      - yalnızca bir eke ihtiyacınız olduğunda `mode: "file"` veya `mode: "both"` tercih edin, veya
      - paylaşılabilir bir görüntüleyici URL'sine ihtiyacınız olduğunda bilinçli olarak `security.allowRemoteViewer` etkinleştirin ve Plugin `viewerBaseUrl` değerini ayarlayın ya da proxy/genel `baseUrl` geçirin
    - `security.allowRemoteViewer` değerini yalnızca harici görüntüleyici erişimi amaçladığınızda etkinleştirin.

  </Accordion>
  <Accordion title="Değiştirilmemiş satırlar satırında genişletme düğmesi yok">
    Yama girdisi için yama genişletilebilir bağlam taşımadığında bu olabilir. Bu beklenen bir durumdur ve görüntüleyici hatasına işaret etmez.
  </Accordion>
  <Accordion title="Artefakt bulunamadı">
    - Artefakt TTL nedeniyle süresi doldu.
    - Belirteç veya yol değişti.
    - Temizleme eski verileri kaldırdı.

  </Accordion>
</AccordionGroup>

## Operasyonel rehberlik

- Tuvalde yerel etkileşimli incelemeler için `mode: "view"` tercih edin.
- Ek gerektiren giden sohbet kanalları için `mode: "file"` tercih edin.
- Dağıtımınız uzak görüntüleyici URL'leri gerektirmedikçe `allowRemoteViewer` devre dışı kalsın.
- Hassas diff'ler için açık ve kısa `ttlSeconds` ayarlayın.
- Gerekli olmadığında diff girdisinde gizli bilgiler göndermekten kaçının.
- Kanalınız görüntüleri agresif biçimde sıkıştırıyorsa (örneğin Telegram veya WhatsApp), PDF çıktısını (`fileFormat: "pdf"`) tercih edin.

<Note>
Diff işleme motoru [Diffs](https://diffs.com) tarafından desteklenir.
</Note>

## İlgili

- [Tarayıcı](/tr/tools/browser)
- [Plugins](/tr/tools/plugin)
- [Araçlara genel bakış](/tr/tools)
