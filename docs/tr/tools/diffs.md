---
read_when:
    - Aracıların kod veya Markdown düzenlemelerini diff olarak göstermesini istiyorsunuz
    - Canvas'a hazır bir görüntüleyici URL'si veya işlenmiş bir diff dosyası istiyorsunuz
    - Güvenli varsayılanlarla kontrollü, geçici diff yapıtlarına ihtiyacınız var
sidebarTitle: Diffs
summary: Ajanlar için salt okunur diff görüntüleyici ve dosya işleyici (isteğe bağlı Plugin aracı)
title: Farklar
x-i18n:
    generated_at: "2026-06-28T01:21:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs`, değişiklik içeriğini ajanlar için salt okunur bir diff yapıtına dönüştüren kısa yerleşik sistem rehberliği ve eşlik eden bir skill içeren isteğe bağlı bir Plugin aracıdır.

Şunlardan birini kabul eder:

- `before` ve `after` metni
- birleşik bir `patch`

Şunları döndürebilir:

- canvas sunumu için bir Gateway görüntüleyici URL'si
- ileti teslimi için işlenmiş bir dosya yolu (PNG veya PDF)
- tek çağrıda her iki çıktı

Etkinleştirildiğinde Plugin, sistem istemi alanına kısa kullanım rehberliği ekler ve ajanın daha kapsamlı yönergelere ihtiyaç duyduğu durumlar için ayrıntılı bir skill de sunar.

## Hızlı başlangıç

<Steps>
  <Step title="Plugin'i yükleyin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Plugin'i etkinleştirin">
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
  <Step title="Bir mod seçin">
    <Tabs>
      <Tab title="view">
        Canvas öncelikli akışlar: ajanlar `diffs` aracını `mode: "view"` ile çağırır ve `details.viewerUrl` değerini `canvas present` ile açar.
      </Tab>
      <Tab title="file">
        Sohbet dosya teslimi: ajanlar `diffs` aracını `mode: "file"` ile çağırır ve `details.filePath` değerini `path` veya `filePath` kullanarak `message` ile gönderir.
      </Tab>
      <Tab title="both">
        Birleşik: ajanlar tek çağrıda her iki yapıtı almak için `diffs` aracını `mode: "both"` ile çağırır.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Yerleşik sistem rehberliğini devre dışı bırakma

`diffs` aracını etkin tutmak ancak yerleşik sistem istemi rehberliğini devre dışı bırakmak istiyorsanız `plugins.entries.diffs.hooks.allowPromptInjection` değerini `false` olarak ayarlayın:

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

Bu, diffs Plugin'inin `before_prompt_build` hook'unu engellerken Plugin'i, aracı ve eşlik eden skill'i kullanılabilir tutar.

Hem rehberliği hem de aracı devre dışı bırakmak istiyorsanız bunun yerine Plugin'i devre dışı bırakın.

## Tipik ajan iş akışı

<Steps>
  <Step title="diffs'i çağırın">
    Ajan, girdilerle birlikte `diffs` aracını çağırır.
  </Step>
  <Step title="Ayrıntıları okuyun">
    Ajan, yanıttaki `details` alanlarını okur.
  </Step>
  <Step title="Sunun">
    Ajan ya `details.viewerUrl` değerini `canvas present` ile açar, `details.filePath` değerini `path` veya `filePath` kullanarak `message` ile gönderir ya da ikisini birden yapar.
  </Step>
</Steps>

## Girdi örnekleri

<Tabs>
  <Tab title="Öncesi ve sonrası">
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

Belirtilmediği sürece tüm alanlar isteğe bağlıdır.

<ParamField path="before" type="string">
  Özgün metin. `patch` atlandığında `after` ile birlikte gereklidir.
</ParamField>
<ParamField path="after" type="string">
  Güncellenmiş metin. `patch` atlandığında `before` ile birlikte gereklidir.
</ParamField>
<ParamField path="patch" type="string">
  Birleşik diff metni. `before` ve `after` ile birlikte kullanılamaz.
</ParamField>
<ParamField path="path" type="string">
  Öncesi ve sonrası modu için görüntülenecek dosya adı.
</ParamField>
<ParamField path="lang" type="string">
  Öncesi ve sonrası modu için dil geçersiz kılma ipucu. Varsayılan görüntüleyici kümesi dışındaki bilinmeyen değerler ve diller,
  Diff Viewer Language Pack Plugin'i yüklü değilse düz metne geri döner.
</ParamField>

<ParamField path="title" type="string">
  Görüntüleyici başlığını geçersiz kılma.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Çıktı modu. Varsayılan olarak Plugin varsayılanı `defaults.mode` kullanılır. Kullanımdan kaldırılmış takma ad: `"image"`, `"file"` gibi davranır ve geriye dönük uyumluluk için hâlâ kabul edilir.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Görüntüleyici teması. Varsayılan olarak Plugin varsayılanı `defaults.theme` kullanılır.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff düzeni. Varsayılan olarak Plugin varsayılanı `defaults.layout` kullanılır.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Tam bağlam kullanılabilir olduğunda değişmemiş bölümleri genişletin. Yalnızca çağrı başına seçenektir (Plugin varsayılan anahtarı değildir).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  İşlenmiş dosya biçimi. Varsayılan olarak Plugin varsayılanı `defaults.fileFormat` kullanılır.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG veya PDF işleme için kalite ön ayarı.
</ParamField>
<ParamField path="fileScale" type="number">
  Cihaz ölçeği geçersiz kılma (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSS pikseli cinsinden en yüksek işleme genişliği (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  Görüntüleyici ve bağımsız dosya çıktıları için saniye cinsinden yapıt TTL'si. En fazla 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Görüntüleyici URL kaynak noktasını geçersiz kılma. Plugin `viewerBaseUrl` değerini geçersiz kılar. `http` veya `https` olmalıdır, sorgu/hash içeremez.
</ParamField>

<AccordionGroup>
  <Accordion title="Eski girdi takma adları">
    Geriye dönük uyumluluk için hâlâ kabul edilir:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Doğrulama ve sınırlar">
    - `before` ve `after` her biri en fazla 512 KiB olabilir.
    - `patch` en fazla 2 MiB olabilir.
    - `path` en fazla 2048 bayt olabilir.
    - `lang` en fazla 128 bayt olabilir.
    - `title` en fazla 1024 bayt olabilir.
    - Patch karmaşıklığı üst sınırı: en fazla 128 dosya ve toplam 120000 satır.
    - `patch` ile `before` veya `after` birlikte reddedilir.
    - İşlenmiş dosya güvenlik sınırları (PNG ve PDF için geçerlidir):
      - `fileQuality: "standard"`: en fazla 8 MP (8.000.000 işlenmiş piksel).
      - `fileQuality: "hq"`: en fazla 14 MP (14.000.000 işlenmiş piksel).
      - `fileQuality: "print"`: en fazla 24 MP (24.000.000 işlenmiş piksel).
      - PDF için ayrıca en fazla 50 sayfa sınırı vardır.

  </Accordion>
</AccordionGroup>

## Sözdizimi vurgulama

OpenClaw, yaygın kaynak, yapılandırma ve dokümantasyon dilleri için sözdizimi vurgulama içerir:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` ve `toml`.

`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt` ve `ps1` gibi yaygın takma adlar bu varsayılan dillere normalleştirilir.

Diğer dilleri vurgulamak için Diff Viewer Language Pack Plugin'ini yükleyin:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Dil paketi kullanılabilir olduğunda OpenClaw çok daha fazla dili vurgulayabilir. Paket yüklü değilse, varsayılan listenin dışındaki dosyalar yine de okunabilir düz metin olarak işlenir. Örnekler arasında Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI ve diff dosyaları bulunur.

Ayrıntılar için [Diffs Language Pack Plugin'i](/tr/plugins/reference/diffs-language-pack) ve Shiki'nin üst kaynak dil ve alias kataloğu için [Shiki dilleri](https://shiki.style/languages) bölümüne bakın.

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
    - `context` (kullanılabilir olduğunda `agentId`, `sessionId`, `messageChannel`, `agentAccountId`)

  </Accordion>
  <Accordion title="File fields">
    PNG veya PDF işlendiğinde dosya alanları:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (mesaj aracı uyumluluğu için `filePath` ile aynı değer)
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

| Mod      | Döndürülenler                                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Yalnızca görüntüleyici alanları.                                                                                       |
| `"file"` | Yalnızca dosya alanları, görüntüleyici artifact'ı yok.                                                                 |
| `"both"` | Görüntüleyici alanları artı dosya alanları. Dosya işleme başarısız olursa, görüntüleyici yine `fileError` ve `imageError` alias'ı ile döner. |

## Daraltılmış değiştirilmemiş bölümler

- Görüntüleyici `N unmodified lines` gibi satırlar gösterebilir.
- Bu satırlardaki genişletme denetimleri koşulludur ve her giriş türü için garanti edilmez.
- Genişletme denetimleri, işlenen diff genişletilebilir bağlam verilerine sahip olduğunda görünür; bu, önceki ve sonraki girişler için tipiktir.
- Birçok unified patch girişinde, atlanan bağlam gövdeleri ayrıştırılmış patch hunk'larında bulunmaz; bu nedenle satır genişletme denetimleri olmadan görünebilir. Bu beklenen davranıştır.
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
            ttlSeconds: 21600,
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
- `ttlSeconds`

Açık araç parametreleri bu varsayılanları geçersiz kılar.

### Kalıcı görüntüleyici URL yapılandırması

<ParamField path="viewerBaseUrl" type="string">
  Bir araç çağrısı `baseUrl` iletmediğinde döndürülen görüntüleyici bağlantıları için Plugin'e ait fallback. `http` veya `https` olmalıdır, sorgu/hash olmamalıdır.
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
  `false`: görüntüleyici rotalarına local loopback olmayan istekler reddedilir. `true`: token'laştırılmış yol geçerliyse uzak görüntüleyicilere izin verilir.
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

## Artifact yaşam döngüsü ve depolama

- Yapıtlar geçici alt klasör altında saklanır: `$TMPDIR/openclaw-diffs`.
- Görüntüleyici yapıt meta verileri şunları içerir:
  - rastgele yapıt kimliği (20 onaltılık karakter)
  - rastgele token (48 onaltılık karakter)
  - `createdAt` ve `expiresAt`
  - saklanan `viewer.html` yolu
- Belirtilmediğinde varsayılan yapıt TTL değeri 30 dakikadır.
- Kabul edilen en yüksek görüntüleyici TTL değeri 6 saattir.
- Temizleme, yapıt oluşturulduktan sonra fırsat buldukça çalışır.
- Süresi dolmuş yapıtlar silinir.
- Meta veriler eksik olduğunda yedek temizleme, 24 saatten eski bayat klasörleri kaldırır.

## Görüntüleyici URL'si ve ağ davranışı

Görüntüleyici rotası:

- `/plugins/diffs/view/{artifactId}/{token}`

Görüntüleyici varlıkları:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- diff, Diff Viewer Language Pack içindeki bir dili kullandığında `/plugins/diffs-language-pack/assets/viewer.js`

Görüntüleyici belgesi bu varlıkları görüntüleyici URL'sine göre çözer; bu nedenle isteğe bağlı `baseUrl` yol öneki, her iki varlık isteği için de korunur.

URL oluşturma davranışı:

- Araç çağrısı `baseUrl` sağlanırsa, sıkı doğrulamadan sonra kullanılır.
- Aksi halde Plugin `viewerBaseUrl` yapılandırılmışsa, o kullanılır.
- Her iki geçersiz kılma da yoksa, görüntüleyici URL'si varsayılan olarak loopback `127.0.0.1` değerini kullanır.
- Gateway bağlama modu `custom` ise ve `gateway.customBindHost` ayarlanmışsa, bu ana makine kullanılır.

`baseUrl` kuralları:

- `http://` veya `https://` olmalıdır.
- Sorgu ve hash reddedilir.
- Origin ile isteğe bağlı temel yola izin verilir.

## Güvenlik modeli

<AccordionGroup>
  <Accordion title="Görüntüleyici sertleştirme">
    - Varsayılan olarak yalnızca loopback.
    - Sıkı kimlik ve token doğrulamasıyla tokenlaştırılmış görüntüleyici yolları.
    - Görüntüleyici yanıtı CSP:
      - `default-src 'none'`
      - betikler ve varlıklar yalnızca self kaynağından
      - dışa giden `connect-src` yok
    - Uzak erişim etkinleştirildiğinde uzak kaçırmaları sınırlama:
      - 60 saniyede 40 hata
      - 60 saniyelik kilitleme (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Dosya işleme sertleştirme">
    - Ekran görüntüsü tarayıcı isteği yönlendirmesi varsayılan olarak reddeder.
    - Yalnızca `http://127.0.0.1/plugins/diffs/assets/*` adresindeki yerel görüntüleyici varlıklarına izin verilir.
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
    Platform komut/yol keşfi yedeği.
  </Step>
</Steps>

Yaygın hata metni:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Chrome, Chromium, Edge veya Brave yükleyerek ya da yukarıdaki yürütülebilir yol seçeneklerinden birini ayarlayarak düzeltin.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Girdi doğrulama hataları">
    - `Provide patch or both before and after text.` — hem `before` hem de `after` ekleyin veya `patch` sağlayın.
    - `Provide either patch or before/after input, not both.` — girdi modlarını karıştırmayın.
    - `Invalid baseUrl: ...` — isteğe bağlı yolla `http(s)` origin kullanın; sorgu/hash kullanmayın.
    - `{field} exceeds maximum size (...)` — yük boyutunu azaltın.
    - Büyük patch reddi — patch dosyası sayısını veya toplam satır sayısını azaltın.

  </Accordion>
  <Accordion title="Görüntüleyici erişilebilirliği">
    - Görüntüleyici URL'si varsayılan olarak `127.0.0.1` değerine çözümlenir.
    - Uzak erişim senaryolarında şunlardan birini yapın:
      - Plugin `viewerBaseUrl` ayarlayın veya
      - araç çağrısı başına `baseUrl` geçin veya
      - `gateway.bind=custom` ve `gateway.customBindHost` kullanın
    - `gateway.trustedProxies`, aynı ana makinedeki bir proxy için loopback içeriyorsa (örneğin Tailscale Serve), iletilmiş istemci IP başlıkları olmadan ham loopback görüntüleyici istekleri tasarım gereği kapalı başarısız olur.
    - Bu proxy topolojisi için:
      - yalnızca bir ek gerektiğinde `mode: "file"` veya `mode: "both"` tercih edin ya da
      - paylaşılabilir bir görüntüleyici URL'sine ihtiyaç duyduğunuzda bilinçli olarak `security.allowRemoteViewer` etkinleştirin ve Plugin `viewerBaseUrl` ayarlayın ya da bir proxy/genel `baseUrl` geçin
    - `security.allowRemoteViewer` yalnızca harici görüntüleyici erişimi amaçladığınızda etkinleştirin.

  </Accordion>
  <Accordion title="Değiştirilmemiş satırlar satırında genişletme düğmesi yok">
    Patch genişletilebilir bağlam taşımadığında bu durum patch girdisi için gerçekleşebilir. Bu beklenen bir durumdur ve görüntüleyici hatasına işaret etmez.
  </Accordion>
  <Accordion title="Yapıt bulunamadı">
    - Yapıtın süresi TTL nedeniyle doldu.
    - Token veya yol değişti.
    - Temizleme bayat verileri kaldırdı.

  </Accordion>
</AccordionGroup>

## Operasyonel rehberlik

- Canvas içinde yerel etkileşimli incelemeler için `mode: "view"` tercih edin.
- Ek gerektiren dışa giden sohbet kanalları için `mode: "file"` tercih edin.
- Dağıtımınız uzak görüntüleyici URL'leri gerektirmedikçe `allowRemoteViewer` devre dışı bırakılmış kalsın.
- Hassas diffs için açık ve kısa `ttlSeconds` ayarlayın.
- Gerekli olmadığında diff girdisinde gizli bilgiler göndermekten kaçının.
- Kanalınız görüntüleri agresif biçimde sıkıştırıyorsa (örneğin Telegram veya WhatsApp), PDF çıktısını tercih edin (`fileFormat: "pdf"`).

<Note>
Diff işleme motoru [Diffs](https://diffs.com) tarafından sağlanır.
</Note>

## İlgili

- [Tarayıcı](/tr/tools/browser)
- [Plugins](/tr/tools/plugin)
- [Araçlara genel bakış](/tr/tools)
