---
read_when:
    - Agent'ların kod veya markdown düzenlemelerini diff olarak göstermesini istiyorsunuz
    - Canvas'a hazır bir görüntüleyici URL'si veya işlenmiş bir diff dosyası istiyorsunuz
    - Güvenli varsayılanlara sahip kontrollü, geçici diff yapıtlarına ihtiyacınız var
sidebarTitle: Diffs
summary: Agent'lar için salt okunur diff görüntüleyici ve dosya işleyici (isteğe bağlı Plugin tool'u)
title: Diff'ler
x-i18n:
    generated_at: "2026-04-26T11:41:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af098a294a4ba56e1a8df3b4f9650802fc53392634fee97b330f03b69e10781
    source_path: tools/diffs.md
    workflow: 15
---

`diffs`, agent'lar için değişiklik içeriğini salt okunur bir diff yapıtına dönüştüren yardımcı bir skill ile birlikte gelen, isteğe bağlı bir Plugin tool'udur ve kısa yerleşik sistem rehberliği sunar.

Şunlardan birini kabul eder:

- `before` ve `after` metni
- birleşik bir `patch`

Şunları döndürebilir:

- canvas sunumu için bir gateway görüntüleyici URL'si
- mesaj teslimi için işlenmiş bir dosya yolu (PNG veya PDF)
- tek çağrıda her iki çıktı da

Etkinleştirildiğinde Plugin, sistem istemi alanına kısa kullanım rehberliği ekler ve ayrıca agent'ın daha ayrıntılı talimatlara ihtiyaç duyduğu durumlar için ayrıntılı bir skill de açığa çıkarır.

## Hızlı başlangıç

<Steps>
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
        Canvas öncelikli akışlar: agent'lar `mode: "view"` ile `diffs` çağırır ve `details.viewerUrl` değerini `canvas present` ile açar.
      </Tab>
      <Tab title="file">
        Sohbet dosyası teslimi: agent'lar `mode: "file"` ile `diffs` çağırır ve `details.filePath` değerini `message` ile `path` veya `filePath` kullanarak gönderir.
      </Tab>
      <Tab title="both">
        Birleşik: agent'lar her iki yapıtı da tek çağrıda almak için `mode: "both"` ile `diffs` çağırır.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Yerleşik sistem rehberliğini devre dışı bırakın

`diffs` tool'unu etkin tutmak ama yerleşik sistem istemi rehberliğini devre dışı bırakmak istiyorsanız `plugins.entries.diffs.hooks.allowPromptInjection` değerini `false` yapın:

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

Bu, diffs Plugin'inin `before_prompt_build` hook'unu engellerken Plugin'i, tool'u ve yardımcı skill'i kullanılabilir tutar.

Hem rehberliği hem de tool'u devre dışı bırakmak istiyorsanız bunun yerine Plugin'i devre dışı bırakın.

## Tipik agent iş akışı

<Steps>
  <Step title="diffs çağırın">
    Agent, girdiyi kullanarak `diffs` tool'unu çağırır.
  </Step>
  <Step title="Ayrıntıları okuyun">
    Agent, yanıttaki `details` alanlarını okur.
  </Step>
  <Step title="Sunun">
    Agent ya `details.viewerUrl` değerini `canvas present` ile açar, ya `details.filePath` değerini `message` ile `path` veya `filePath` kullanarak gönderir ya da ikisini birden yapar.
  </Step>
</Steps>

## Girdi örnekleri

<Tabs>
  <Tab title="Before ve after">
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

## Tool girdi referansı

Aksi belirtilmedikçe tüm alanlar isteğe bağlıdır.

<ParamField path="before" type="string">
  Özgün metin. `patch` atlandığında `after` ile birlikte zorunludur.
</ParamField>
<ParamField path="after" type="string">
  Güncellenmiş metin. `patch` atlandığında `before` ile birlikte zorunludur.
</ParamField>
<ParamField path="patch" type="string">
  Birleşik diff metni. `before` ve `after` ile karşılıklı dışlayıcıdır.
</ParamField>
<ParamField path="path" type="string">
  Before ve after modu için görüntülenecek dosya adı.
</ParamField>
<ParamField path="lang" type="string">
  Before ve after modu için dil geçersiz kılma ipucu. Bilinmeyen değerler düz metne fallback yapar.
</ParamField>
<ParamField path="title" type="string">
  Görüntüleyici başlığı geçersiz kılması.
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
  Tam bağlam mevcut olduğunda değişmeyen bölümleri genişletin. Yalnızca çağrı başına seçenektir (Plugin varsayılan anahtarı değildir).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  İşlenmiş dosya biçimi. Varsayılan olarak Plugin varsayılanı `defaults.fileFormat` kullanılır.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG veya PDF işleme için kalite ön ayarı.
</ParamField>
<ParamField path="fileScale" type="number">
  Aygıt ölçeği geçersiz kılması (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSS pikseli cinsinden azami işleme genişliği (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  Görüntüleyici ve bağımsız dosya çıktıları için saniye cinsinden yapıt TTL'si. Azami 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Görüntüleyici URL origin geçersiz kılması. Plugin `viewerBaseUrl` değerini geçersiz kılar. `http` veya `https` olmalı, query/hash içermemelidir.
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
    - `before` ve `after` alanlarının her biri en fazla 512 KiB.
    - `patch` en fazla 2 MiB.
    - `path` en fazla 2048 bayt.
    - `lang` en fazla 128 bayt.
    - `title` en fazla 1024 bayt.
    - Patch karmaşıklık sınırı: en fazla 128 dosya ve toplam 120000 satır.
    - `patch` ile birlikte `before` veya `after` verilmesi reddedilir.
    - İşlenmiş dosya güvenlik sınırları (PNG ve PDF için geçerlidir):
      - `fileQuality: "standard"`: en fazla 8 MP (8,000,000 işlenmiş piksel).
      - `fileQuality: "hq"`: en fazla 14 MP (14,000,000 işlenmiş piksel).
      - `fileQuality: "print"`: en fazla 24 MP (24,000,000 işlenmiş piksel).
      - PDF ayrıca en fazla 50 sayfa ile sınırlıdır.
  </Accordion>
</AccordionGroup>

## Çıktı ayrıntıları sözleşmesi

Tool, yapılandırılmış metadata'yı `details` altında döndürür.

<AccordionGroup>
  <Accordion title="Görüntüleyici alanları">
    Görüntüleyici oluşturan modlar için paylaşılan alanlar:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, kullanılabiliyorsa `agentAccountId`)

  </Accordion>
  <Accordion title="Dosya alanları">
    PNG veya PDF işlendiğinde dosya alanları:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (`filePath` ile aynı değer, message tool uyumluluğu için)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Uyumluluk takma adları">
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

| Mod      | Döndürülen şey                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| `"view"` | Yalnızca görüntüleyici alanları.                                                                                   |
| `"file"` | Yalnızca dosya alanları, görüntüleyici yapıtı yok.                                                                 |
| `"both"` | Görüntüleyici alanları artı dosya alanları. Dosya işleme başarısız olursa görüntüleyici yine `fileError` ve `imageError` takma adıyla döner. |

## Daraltılmış değişmeyen bölümler

- Görüntüleyici `N unmodified lines` gibi satırlar gösterebilir.
- Bu satırlardaki genişletme denetimleri koşulludur ve her girdi türü için garanti edilmez.
- Genişletme denetimleri, işlenmiş diff genişletilebilir bağlam verisine sahip olduğunda görünür; bu, genellikle before ve after girdileri için tipiktir.
- Birçok birleşik patch girdisinde atlanan bağlam gövdeleri ayrıştırılmış patch hunk'larında bulunmaz; bu nedenle satır genişletme denetimleri olmadan görünebilir. Bu beklenen davranıştır.
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

Açık tool parametreleri bu varsayılanları geçersiz kılar.

### Kalıcı görüntüleyici URL config'i

<ParamField path="viewerBaseUrl" type="string">
  Bir tool çağrısı `baseUrl` geçmediğinde döndürülen görüntüleyici bağlantıları için Plugin sahipli fallback. `http` veya `https` olmalı, query/hash içermemelidir.
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

## Güvenlik config'i

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: görüntüleyici route'larına yapılan loopback dışı istekler reddedilir. `true`: token içeren yol geçerliyse uzak görüntüleyicilere izin verilir.
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

- Yapıtlar geçici alt klasörde saklanır: `$TMPDIR/openclaw-diffs`.
- Görüntüleyici yapıt metadata'sı şunları içerir:
  - rastgele yapıt kimliği (20 hex karakter)
  - rastgele token (48 hex karakter)
  - `createdAt` ve `expiresAt`
  - saklanan `viewer.html` yolu
- Belirtilmediğinde varsayılan yapıt TTL'si 30 dakikadır.
- Kabul edilen azami görüntüleyici TTL'si 6 saattir.
- Temizleme, yapıt oluşturulduktan sonra fırsatçı olarak çalışır.
- Süresi dolan yapıtlar silinir.
- Fallback temizleme, metadata eksik olduğunda 24 saatten eski bayat klasörleri kaldırır.

## Görüntüleyici URL'si ve ağ davranışı

Görüntüleyici route'u:

- `/plugins/diffs/view/{artifactId}/{token}`

Görüntüleyici varlıkları:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Görüntüleyici belgesi bu varlıkları görüntüleyici URL'sine göre çözümler; bu nedenle isteğe bağlı `baseUrl` yol öneki hem varlık istekleri için de korunur.

URL oluşturma davranışı:

- Tool çağrısı `baseUrl` sağlıyorsa, katı doğrulamadan sonra kullanılır.
- Aksi halde Plugin `viewerBaseUrl` yapılandırılmışsa kullanılır.
- Bu geçersiz kılmaların hiçbiri yoksa görüntüleyici URL'si varsayılan olarak loopback `127.0.0.1` kullanır.
- Gateway bind modu `custom` ise ve `gateway.customBindHost` ayarlıysa o host kullanılır.

`baseUrl` kuralları:

- `http://` veya `https://` ile başlamalıdır.
- Query ve hash reddedilir.
- Origin artı isteğe bağlı temel yola izin verilir.

## Güvenlik modeli

<AccordionGroup>
  <Accordion title="Görüntüleyici sertleştirme">
    - Varsayılan olarak yalnızca loopback.
    - Katı kimlik ve token doğrulamasıyla token içeren görüntüleyici yolları.
    - Görüntüleyici yanıt CSP'si:
      - `default-src 'none'`
      - betikler ve varlıklar yalnızca self üzerinden
      - giden `connect-src` yok
    - Uzak erişim etkin olduğunda uzak miss kısıtlaması:
      - 60 saniyede 40 başarısızlık
      - 60 saniyelik kilitleme (`429 Too Many Requests`)
  </Accordion>
  <Accordion title="Dosya işleme sertleştirme">
    - Ekran görüntüsü tarayıcı istek yönlendirmesi varsayılan olarak deny kullanır.
    - Yalnızca `http://127.0.0.1/plugins/diffs/assets/*` altındaki yerel görüntüleyici varlıklarına izin verilir.
    - Dış ağ istekleri engellenir.
  </Accordion>
</AccordionGroup>

## File modu için tarayıcı gereksinimleri

`mode: "file"` ve `mode: "both"`, Chromium uyumlu bir tarayıcı gerektirir.

Çözümleme sırası:

<Steps>
  <Step title="Config">
    OpenClaw config içindeki `browser.executablePath`.
  </Step>
  <Step title="Ortam değişkenleri">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
  </Step>
  <Step title="Platform fallback">
    Platform komutu/yolu keşfi fallback'i.
  </Step>
</Steps>

Yaygın hata metni:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Chrome, Chromium, Edge veya Brave kurarak ya da yukarıdaki çalıştırılabilir yol seçeneklerinden birini ayarlayarak düzeltin.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Girdi doğrulama hataları">
    - `Provide patch or both before and after text.` — hem `before` hem `after` ekleyin veya `patch` sağlayın.
    - `Provide either patch or before/after input, not both.` — girdi modlarını karıştırmayın.
    - `Invalid baseUrl: ...` — isteğe bağlı yol içeren `http(s)` origin kullanın, query/hash kullanmayın.
    - `{field} exceeds maximum size (...)` — payload boyutunu azaltın.
    - Büyük patch reddi — patch dosya sayısını veya toplam satır sayısını azaltın.
  </Accordion>
  <Accordion title="Görüntüleyici erişilebilirliği">
    - Görüntüleyici URL'si varsayılan olarak `127.0.0.1` adresine çözülür.
    - Uzak erişim senaryoları için ya:
      - Plugin `viewerBaseUrl` ayarlayın, ya
      - tool çağrısı başına `baseUrl` geçin, ya da
      - `gateway.bind=custom` ve `gateway.customBindHost` kullanın
    - `gateway.trustedProxies`, aynı host proxy'si için loopback içeriyorsa (örneğin Tailscale Serve), yönlendirilmiş istemci-IP üstbilgileri olmayan ham loopback görüntüleyici istekleri tasarım gereği fail closed davranır.
    - Bu proxy topolojisi için:
      - yalnızca eke ihtiyacınız varsa `mode: "file"` veya `mode: "both"` tercih edin, ya da
      - paylaşılabilir bir görüntüleyici URL'sine ihtiyacınız varsa bilinçli olarak `security.allowRemoteViewer` etkinleştirin ve Plugin `viewerBaseUrl` ayarlayın veya proxy/genel `baseUrl` geçin
    - `security.allowRemoteViewer` özelliğini yalnızca dış görüntüleyici erişimi amaçladığınızda etkinleştirin.
  </Accordion>
  <Accordion title="Değişmemiş satırlar satırında genişlet düğmesi yok">
    Bu, patch girdisi için patch genişletilebilir bağlam taşımadığında olabilir. Bu beklenen davranıştır ve görüntüleyici hatasına işaret etmez.
  </Accordion>
  <Accordion title="Yapıt bulunamadı">
    - Yapıt TTL nedeniyle süresi doldu.
    - Token veya yol değişti.
    - Temizleme bayat verileri kaldırdı.
  </Accordion>
</AccordionGroup>

## Operasyonel rehberlik

- Canvas içinde yerel etkileşimli incelemeler için `mode: "view"` tercih edin.
- Ek gerektiren giden sohbet kanalları için `mode: "file"` tercih edin.
- Kurulumunuz uzak görüntüleyici URL'leri gerektirmediği sürece `allowRemoteViewer` devre dışı bırakılmış halde kalsın.
- Hassas diff'ler için açık ve kısa `ttlSeconds` ayarlayın.
- Gerekmediğinde diff girdisine sır eklemekten kaçının.
- Kanalınız görselleri agresif biçimde sıkıştırıyorsa (örneğin Telegram veya WhatsApp), PDF çıktısını tercih edin (`fileFormat: "pdf"`).

<Note>
Diff işleme motoru [Diffs](https://diffs.com) tarafından desteklenmektedir.
</Note>

## İlgili

- [Browser](/tr/tools/browser)
- [Plugins](/tr/tools/plugin)
- [Tools overview](/tr/tools)
