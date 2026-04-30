---
read_when:
    - Ajanların kod veya Markdown düzenlemelerini diff olarak göstermesini istiyorsunuz
    - Tuvale hazır bir görüntüleyici URL'si veya işlenmiş bir fark dosyası istiyorsunuz
    - Güvenli varsayılanlara sahip denetimli, geçici diff yapıtlarına ihtiyacınız var
sidebarTitle: Diffs
summary: Ajanlar için salt okunur diff görüntüleyici ve dosya render edici (isteğe bağlı Plugin aracı)
title: Farklar
x-i18n:
    generated_at: "2026-04-30T09:48:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d8938b11f6bc612168057b7f4f5ceaafb22c2445e015fb746795b2e93f033e5
    source_path: tools/diffs.md
    workflow: 16
---

`diffs`, kısa yerleşik sistem yönlendirmesi ve değişiklik içeriğini ajanlar için salt okunur bir diff artifact'e dönüştüren eşlikçi skill ile isteğe bağlı bir plugin aracıdır.

Şunlardan birini kabul eder:

- `before` ve `after` metni
- birleşik bir `patch`

Şunları döndürebilir:

- canvas sunumu için Gateway görüntüleyici URL'si
- mesaj teslimi için işlenmiş dosya yolu (PNG veya PDF)
- tek çağrıda iki çıktı birden

Etkinleştirildiğinde plugin, sistem istemi alanına kısa kullanım yönlendirmesi ekler ve ajanın daha kapsamlı talimatlara ihtiyaç duyduğu durumlar için ayrıntılı bir skill de sunar.

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
        Canvas öncelikli akışlar: ajanlar `diffs` aracını `mode: "view"` ile çağırır ve `details.viewerUrl` değerini `canvas present` ile açar.
      </Tab>
      <Tab title="file">
        Sohbet dosyası teslimi: ajanlar `diffs` aracını `mode: "file"` ile çağırır ve `details.filePath` değerini `message` ile `path` veya `filePath` kullanarak gönderir.
      </Tab>
      <Tab title="both">
        Birleşik: ajanlar tek çağrıda iki artifact'i de almak için `diffs` aracını `mode: "both"` ile çağırır.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Yerleşik sistem yönlendirmesini devre dışı bırakın

`diffs` aracını etkin tutup yerleşik sistem istemi yönlendirmesini devre dışı bırakmak istiyorsanız `plugins.entries.diffs.hooks.allowPromptInjection` değerini `false` olarak ayarlayın:

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

Bu, plugin'i, aracı ve eşlikçi skill'i kullanılabilir tutarken diffs plugin'inin `before_prompt_build` hook'unu engeller.

Hem yönlendirmeyi hem de aracı devre dışı bırakmak istiyorsanız bunun yerine plugin'i devre dışı bırakın.

## Tipik ajan iş akışı

<Steps>
  <Step title="diffs'i çağırın">
    Ajan, girdiyle birlikte `diffs` aracını çağırır.
  </Step>
  <Step title="Ayrıntıları okuyun">
    Ajan, yanıttaki `details` alanlarını okur.
  </Step>
  <Step title="Sunun">
    Ajan `details.viewerUrl` değerini `canvas present` ile açar, `details.filePath` değerini `message` ile `path` veya `filePath` kullanarak gönderir ya da ikisini de yapar.
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

Belirtilmedikçe tüm alanlar isteğe bağlıdır.

<ParamField path="before" type="string">
  Özgün metin. `patch` belirtilmediğinde `after` ile birlikte gereklidir.
</ParamField>
<ParamField path="after" type="string">
  Güncellenmiş metin. `patch` belirtilmediğinde `before` ile birlikte gereklidir.
</ParamField>
<ParamField path="patch" type="string">
  Birleşik diff metni. `before` ve `after` ile birlikte kullanılamaz.
</ParamField>
<ParamField path="path" type="string">
  Öncesi ve sonrası modu için görüntülenecek dosya adı.
</ParamField>
<ParamField path="lang" type="string">
  Öncesi ve sonrası modu için dil geçersiz kılma ipucu. Bilinmeyen değerler düz metne geri döner.
</ParamField>
<ParamField path="title" type="string">
  Görüntüleyici başlığı geçersiz kılma değeri.
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
  Tam bağlam kullanılabilir olduğunda değişmeyen bölümleri genişletin. Yalnızca çağrı başına seçenek (plugin varsayılan anahtarı değildir).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  İşlenmiş dosya biçimi. Varsayılan olarak plugin varsayılanı `defaults.fileFormat` kullanılır.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG veya PDF işleme için kalite ön ayarı.
</ParamField>
<ParamField path="fileScale" type="number">
  Cihaz ölçeği geçersiz kılma değeri (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSS pikseli cinsinden en fazla işleme genişliği (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  Görüntüleyici ve bağımsız dosya çıktıları için saniye cinsinden artifact TTL'si. En fazla 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  Görüntüleyici URL origin geçersiz kılma değeri. Plugin `viewerBaseUrl` değerini geçersiz kılar. `http` veya `https` olmalıdır, sorgu/hash içermez.
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
    - `before` ve `after` her biri en fazla 512 KiB.
    - `patch` en fazla 2 MiB.
    - `path` en fazla 2048 bayt.
    - `lang` en fazla 128 bayt.
    - `title` en fazla 1024 bayt.
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

Araç, `details` altında yapılandırılmış metadata döndürür.

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
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` kullanılabilir olduğunda)

  </Accordion>
  <Accordion title="Dosya alanları">
    PNG veya PDF işlendiğinde dosya alanları:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (`message` aracı uyumluluğu için `filePath` ile aynı değer)
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

| Mod      | Döndürülen                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | Yalnızca görüntüleyici alanları.                                                                                       |
| `"file"` | Yalnızca dosya alanları, görüntüleyici yapıtı yok.                                                                     |
| `"both"` | Görüntüleyici alanları ve dosya alanları. Dosya işleme başarısız olursa görüntüleyici yine `fileError` ve `imageError` takma adıyla döner. |

## Daraltılmış değişmemiş bölümler

- Görüntüleyici `N unmodified lines` gibi satırlar gösterebilir.
- Bu satırlardaki genişletme kontrolleri koşulludur ve her girdi türü için garanti edilmez.
- Genişletme kontrolleri, işlenen fark genişletilebilir bağlam verisine sahip olduğunda görünür; bu, önceki ve sonraki girdiler için tipiktir.
- Birçok birleşik yama girdisinde, atlanan bağlam gövdeleri ayrıştırılan yama hunk'larında mevcut değildir; bu yüzden satır genişletme kontrolleri olmadan görünebilir. Bu beklenen davranıştır.
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
  Bir araç çağrısı `baseUrl` iletmediğinde döndürülen görüntüleyici bağlantıları için Plugin'e ait yedek değer. `http` veya `https` olmalıdır; sorgu/hash olmamalıdır.
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
  `false`: görüntüleyici rotalarına local loopback olmayan istekler reddedilir. `true`: token'lı yol geçerliyse uzak görüntüleyicilere izin verilir.
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

- Yapıtlar geçici alt klasör altında saklanır: `$TMPDIR/openclaw-diffs`.
- Görüntüleyici yapıtı meta verileri şunları içerir:
  - rastgele yapıt kimliği (20 onaltılık karakter)
  - rastgele token (48 onaltılık karakter)
  - `createdAt` ve `expiresAt`
  - saklanan `viewer.html` yolu
- Belirtilmediğinde varsayılan yapıt TTL değeri 30 dakikadır.
- Kabul edilen en yüksek görüntüleyici TTL değeri 6 saattir.
- Temizlik, yapıt oluşturulduktan sonra fırsatçı olarak çalışır.
- Süresi dolan yapıtlar silinir.
- Yedek temizlik, meta veriler eksik olduğunda 24 saatten eski bayat klasörleri kaldırır.

## Görüntüleyici URL'si ve ağ davranışı

Görüntüleyici rotası:

- `/plugins/diffs/view/{artifactId}/{token}`

Görüntüleyici varlıkları:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Görüntüleyici belgesi bu varlıkları görüntüleyici URL'sine göre çözer; bu nedenle isteğe bağlı `baseUrl` yol ön eki her iki varlık isteği için de korunur.

URL oluşturma davranışı:

- Araç çağrısı `baseUrl` sağlarsa, katı doğrulamadan sonra kullanılır.
- Aksi halde Plugin `viewerBaseUrl` yapılandırılmışsa, o kullanılır.
- İki geçersiz kılma da yoksa görüntüleyici URL'si varsayılan olarak local loopback `127.0.0.1` olur.
- Gateway bağlama modu `custom` ise ve `gateway.customBindHost` ayarlanmışsa, bu ana makine kullanılır.

`baseUrl` kuralları:

- `http://` veya `https://` olmalıdır.
- Sorgu ve hash reddedilir.
- Kaynak ve isteğe bağlı temel yola izin verilir.

## Güvenlik modeli

<AccordionGroup>
  <Accordion title="Görüntüleyici güçlendirmesi">
    - Varsayılan olarak yalnızca local loopback.
    - Katı kimlik ve token doğrulamasıyla token'lı görüntüleyici yolları.
    - Görüntüleyici yanıtı CSP:
      - `default-src 'none'`
      - betikler ve varlıklar yalnızca kendisinden
      - giden `connect-src` yok
    - Uzak erişim etkinleştirildiğinde uzak ıskalama sınırlaması:
      - 60 saniyede 40 başarısızlık
      - 60 saniye kilitleme (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="Dosya işleme sağlamlaştırması">
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
  <Step title="Platform geri dönüşü">
    Platform komut/yol keşfi geri dönüşü.
  </Step>
</Steps>

Yaygın hata metni:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Chrome, Chromium, Edge veya Brave kurarak ya da yukarıdaki çalıştırılabilir yol seçeneklerinden birini ayarlayarak düzeltin.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Girdi doğrulama hataları">
    - `Provide patch or both before and after text.` — hem `before` hem de `after` ekleyin veya `patch` sağlayın.
    - `Provide either patch or before/after input, not both.` — girdi modlarını karıştırmayın.
    - `Invalid baseUrl: ...` — isteğe bağlı yol içeren, sorgu/hash içermeyen `http(s)` origin kullanın.
    - `{field} exceeds maximum size (...)` — yük boyutunu azaltın.
    - Büyük yama reddi — yama dosyası sayısını veya toplam satır sayısını azaltın.

  </Accordion>
  <Accordion title="Görüntüleyici erişilebilirliği">
    - Görüntüleyici URL'si varsayılan olarak `127.0.0.1` değerine çözümlenir.
    - Uzaktan erişim senaryoları için şunlardan birini yapın:
      - Plugin `viewerBaseUrl` ayarlayın veya
      - her araç çağrısında `baseUrl` geçin veya
      - `gateway.bind=custom` ve `gateway.customBindHost` kullanın
    - `gateway.trustedProxies`, aynı ana makinedeki bir proxy için loopback içeriyorsa (örneğin Tailscale Serve), iletilmiş istemci-IP başlıkları olmayan ham loopback görüntüleyici istekleri tasarım gereği kapalı başarısız olur.
    - Bu proxy topolojisi için:
      - yalnızca bir eke ihtiyacınız olduğunda `mode: "file"` veya `mode: "both"` tercih edin ya da
      - paylaşılabilir bir görüntüleyici URL'sine ihtiyacınız olduğunda bilinçli olarak `security.allowRemoteViewer` etkinleştirin ve Plugin `viewerBaseUrl` ayarlayın veya bir proxy/genel `baseUrl` geçin
    - `security.allowRemoteViewer` yalnızca harici görüntüleyici erişimi amaçladığınızda etkinleştirin.

  </Accordion>
  <Accordion title="Değiştirilmemiş satırlar satırında genişletme düğmesi yok">
    Bu, yama girdisi için yama genişletilebilir bağlam taşımadığında olabilir. Bu beklenen bir durumdur ve görüntüleyici hatasına işaret etmez.
  </Accordion>
  <Accordion title="Yapıt bulunamadı">
    - Yapıt TTL nedeniyle süresi doldu.
    - Belirteç veya yol değişti.
    - Temizleme eski verileri kaldırdı.

  </Accordion>
</AccordionGroup>

## Operasyonel rehberlik

- Canvas içinde yerel etkileşimli incelemeler için `mode: "view"` tercih edin.
- Ek gerektiren giden sohbet kanalları için `mode: "file"` tercih edin.
- Dağıtımınız uzaktan görüntüleyici URL'leri gerektirmedikçe `allowRemoteViewer` devre dışı bırakın.
- Hassas diff'ler için açıkça kısa `ttlSeconds` ayarlayın.
- Gerekli olmadığında diff girdisinde sır göndermekten kaçının.
- Kanalınız görüntüleri yoğun şekilde sıkıştırıyorsa (örneğin Telegram veya WhatsApp), PDF çıktısını (`fileFormat: "pdf"`) tercih edin.

<Note>
Diff işleme altyapısı [Diffs](https://diffs.com) tarafından desteklenir.
</Note>

## İlgili

- [Tarayıcı](/tr/tools/browser)
- [Plugins](/tr/tools/plugin)
- [Araçlara genel bakış](/tr/tools)
