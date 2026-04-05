---
read_when:
    - Ajanların kod veya markdown düzenlemelerini diff olarak göstermesini istiyorsunuz
    - Canvas için hazır bir görüntüleyici URL'si veya oluşturulmuş bir diff dosyası istiyorsunuz
    - Güvenli varsayılanlarla kontrollü, geçici diff yapıtlarına ihtiyaç duyuyorsunuz
summary: Ajanlar için salt okunur diff görüntüleyici ve dosya oluşturucu (isteğe bağlı eklenti aracı)
title: Diff'ler
x-i18n:
    generated_at: "2026-04-05T14:11:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935539a6e584980eb7e57067c18112bb40a0be8522b9da649c7cf7f180fb45d4
    source_path: tools/diffs.md
    workflow: 15
---

# Diff'ler

`diffs`, kısa yerleşik sistem yönlendirmesine ve değişiklik içeriğini ajanlar için salt okunur bir diff yapıtına dönüştüren yardımcı bir Skill'e sahip isteğe bağlı bir eklenti aracıdır.

Şunlardan birini kabul eder:

- `before` ve `after` metni
- birleşik bir `patch`

Şunları döndürebilir:

- canvas sunumu için bir gateway görüntüleyici URL'si
- mesaj teslimi için oluşturulmuş bir dosya yolu (PNG veya PDF)
- tek çağrıda her iki çıktı

Etkinleştirildiğinde eklenti, sistem istemi alanına kısa kullanım yönlendirmesi ekler ve ayrıca ajanın daha kapsamlı yönergelere ihtiyaç duyduğu durumlar için ayrıntılı bir Skill de sunar.

## Hızlı başlangıç

1. Eklentiyi etkinleştirin.
2. Önce canvas akışları için `mode: "view"` ile `diffs` çağırın.
3. Sohbet dosyası teslim akışları için `mode: "file"` ile `diffs` çağırın.
4. Her iki yapıtı da gerektiğinde `mode: "both"` ile `diffs` çağırın.

## Eklentiyi etkinleştirme

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

## Yerleşik sistem yönlendirmesini devre dışı bırakma

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

Bu, eklentiyi, aracı ve yardımcı Skill'i kullanılabilir tutarken diffs eklentisinin `before_prompt_build` kancasını engeller.

Hem yönlendirmeyi hem de aracı devre dışı bırakmak istiyorsanız bunun yerine eklentiyi devre dışı bırakın.

## Tipik ajan iş akışı

1. Ajan `diffs` çağırır.
2. Ajan `details` alanlarını okur.
3. Ajan şunlardan birini yapar:
   - `canvas present` ile `details.viewerUrl` açar
   - `path` veya `filePath` kullanarak `message` ile `details.filePath` gönderir
   - ikisini de yapar

## Girdi örnekleri

Önce ve sonra:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## Araç girdi başvurusu

Aksi belirtilmedikçe tüm alanlar isteğe bağlıdır:

- `before` (`string`): özgün metin. `patch` verilmemişse `after` ile birlikte gereklidir.
- `after` (`string`): güncellenmiş metin. `patch` verilmemişse `before` ile birlikte gereklidir.
- `patch` (`string`): birleşik diff metni. `before` ve `after` ile birlikte kullanılamaz.
- `path` (`string`): önce/sonra modu için görüntüleme dosya adı.
- `lang` (`string`): önce/sonra modu için dil geçersiz kılma ipucu. Bilinmeyen değerler düz metne geri döner.
- `title` (`string`): görüntüleyici başlığını geçersiz kılma.
- `mode` (`"view" | "file" | "both"`): çıktı modu. Varsayılan olarak eklenti varsayılanı `defaults.mode` kullanılır.
  Kullanımdan kaldırılmış takma ad: `"image"`, `"file"` gibi davranır ve geriye dönük uyumluluk için hâlâ kabul edilir.
- `theme` (`"light" | "dark"`): görüntüleyici teması. Varsayılan olarak eklenti varsayılanı `defaults.theme` kullanılır.
- `layout` (`"unified" | "split"`): diff düzeni. Varsayılan olarak eklenti varsayılanı `defaults.layout` kullanılır.
- `expandUnchanged` (`boolean`): tam bağlam mevcut olduğunda değişmemiş bölümleri genişletir. Yalnızca çağrı başına seçenektir (eklenti varsayılan anahtarı değildir).
- `fileFormat` (`"png" | "pdf"`): oluşturulan dosya biçimi. Varsayılan olarak eklenti varsayılanı `defaults.fileFormat` kullanılır.
- `fileQuality` (`"standard" | "hq" | "print"`): PNG veya PDF oluşturma için kalite ön ayarı.
- `fileScale` (`number`): cihaz ölçeği geçersiz kılma (`1`-`4`).
- `fileMaxWidth` (`number`): CSS pikseli cinsinden azami oluşturma genişliği (`640`-`2400`).
- `ttlSeconds` (`number`): görüntüleyici ve bağımsız dosya çıktıları için yapıt TTL'si saniye cinsinden. Varsayılan 1800, azami 21600.
- `baseUrl` (`string`): görüntüleyici URL kaynağını geçersiz kılma. Eklenti `viewerBaseUrl` değerini geçersiz kılar. `http` veya `https` olmalıdır; sorgu/hash içeremez.

Eski girdi takma adları geriye dönük uyumluluk için hâlâ kabul edilir:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

Doğrulama ve sınırlar:

- `before` ve `after` için azami boyut ayrı ayrı 512 KiB.
- `patch` için azami boyut 2 MiB.
- `path` için azami boyut 2048 bayt.
- `lang` için azami boyut 128 bayt.
- `title` için azami boyut 1024 bayt.
- Patch karmaşıklık sınırı: azami 128 dosya ve toplam 120000 satır.
- `patch` ile birlikte `before` veya `after` verilmesi reddedilir.
- Oluşturulan dosya güvenlik sınırları (PNG ve PDF için geçerlidir):
  - `fileQuality: "standard"`: azami 8 MP (8.000.000 oluşturulmuş piksel).
  - `fileQuality: "hq"`: azami 14 MP (14.000.000 oluşturulmuş piksel).
  - `fileQuality: "print"`: azami 24 MP (24.000.000 oluşturulmuş piksel).
  - PDF için ayrıca azami 50 sayfa sınırı vardır.

## Çıktı ayrıntıları sözleşmesi

Araç, yapılandırılmış meta verileri `details` altında döndürür.

Görüntüleyici oluşturan modlar için ortak alanlar:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context` (mevcutsa `agentId`, `sessionId`, `messageChannel`, `agentAccountId`)

PNG veya PDF oluşturulduğunda dosya alanları:

- `artifactId`
- `expiresAt`
- `filePath`
- `path` (`filePath` ile aynı değer; message aracı uyumluluğu için)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

Mevcut çağıranlar için uyumluluk takma adları da döndürülür:

- `format` (`fileFormat` ile aynı değer)
- `imagePath` (`filePath` ile aynı değer)
- `imageBytes` (`fileBytes` ile aynı değer)
- `imageQuality` (`fileQuality` ile aynı değer)
- `imageScale` (`fileScale` ile aynı değer)
- `imageMaxWidth` (`fileMaxWidth` ile aynı değer)

Mod davranışı özeti:

- `mode: "view"`: yalnızca görüntüleyici alanları.
- `mode: "file"`: yalnızca dosya alanları, görüntüleyici yapıtı yok.
- `mode: "both"`: görüntüleyici alanları + dosya alanları. Dosya oluşturma başarısız olursa görüntüleyici yine `fileError` ve uyumluluk takma adı `imageError` ile döner.

## Daraltılmış değişmemiş bölümler

- Görüntüleyici `N unmodified lines` gibi satırlar gösterebilir.
- Bu satırlardaki genişletme denetimleri koşulludur ve her girdi türü için garanti edilmez.
- Genişletme denetimleri, oluşturulan diff genişletilebilir bağlam verisi içerdiğinde görünür; bu durum genellikle before/after girdisi için tipiktir.
- Birçok birleşik patch girdisinde, atlanan bağlam gövdeleri çözümlenen patch hunk'larında bulunmaz; bu yüzden satır genişletme denetimleri olmadan görünebilir. Bu beklenen davranıştır.
- `expandUnchanged` yalnızca genişletilebilir bağlam mevcut olduğunda uygulanır.

## Eklenti varsayılanları

Eklenti genelindeki varsayılanları `~/.openclaw/openclaw.json` içinde ayarlayın:

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

Kalıcı görüntüleyici URL yapılandırması:

- `viewerBaseUrl` (`string`, isteğe bağlı)
  - Araç çağrısı `baseUrl` geçmediğinde döndürülen görüntüleyici bağlantıları için eklentiye ait geri dönüş değeri.
  - `http` veya `https` olmalıdır; sorgu/hash içeremez.

Örnek:

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

- `security.allowRemoteViewer` (`boolean`, varsayılan `false`)
  - `false`: görüntüleyici yollarına yapılan loopback dışı istekler reddedilir.
  - `true`: belirteçli yol geçerliyse uzak görüntüleyicilere izin verilir.

Örnek:

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

- Yapıtlar temp alt klasörü altında saklanır: `$TMPDIR/openclaw-diffs`.
- Görüntüleyici yapıt meta verileri şunları içerir:
  - rastgele yapıt kimliği (20 hex karakter)
  - rastgele token (48 hex karakter)
  - `createdAt` ve `expiresAt`
  - saklanan `viewer.html` yolu
- Belirtilmediğinde varsayılan yapıt TTL'si 30 dakikadır.
- Kabul edilen azami görüntüleyici TTL'si 6 saattir.
- Temizleme, yapıt oluşturulduktan sonra fırsatçı biçimde çalışır.
- Süresi dolmuş yapıtlar silinir.
- Meta veriler eksik olduğunda geri dönüş temizliği 24 saatten eski bayat klasörleri kaldırır.

## Görüntüleyici URL'si ve ağ davranışı

Görüntüleyici yolu:

- `/plugins/diffs/view/{artifactId}/{token}`

Görüntüleyici varlıkları:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Görüntüleyici belgesi bu varlıkları görüntüleyici URL'sine göre çözümler; bu yüzden isteğe bağlı `baseUrl` yol öneki bu varlık isteklerinde de korunur.

URL oluşturma davranışı:

- Araç çağrısı `baseUrl` sağlanırsa, katı doğrulamadan sonra kullanılır.
- Aksi hâlde eklenti `viewerBaseUrl` yapılandırılmışsa kullanılır.
- Bu geçersiz kılmalardan hiçbiri yoksa görüntüleyici URL'si varsayılan olarak loopback `127.0.0.1` kullanır.
- Gateway bind modu `custom` ise ve `gateway.customBindHost` ayarlıysa o host kullanılır.

`baseUrl` kuralları:

- `http://` veya `https://` olmalıdır.
- Sorgu ve hash reddedilir.
- Kaynak artı isteğe bağlı temel yola izin verilir.

## Güvenlik modeli

Görüntüleyici güçlendirmesi:

- Varsayılan olarak yalnızca loopback.
- Katı kimlik ve token doğrulaması ile belirteçli görüntüleyici yolları.
- Görüntüleyici yanıt CSP'si:
  - `default-src 'none'`
  - script'ler ve varlıklar yalnızca self'den
  - dışa dönük `connect-src` yok
- Uzak erişim etkinleştirildiğinde uzak hata sınırlaması:
  - 60 saniyede 40 başarısız istek
  - 60 saniyelik kilitleme (`429 Too Many Requests`)

Dosya oluşturma güçlendirmesi:

- Ekran görüntüsü tarayıcı istek yönlendirmesi varsayılan olarak reddeder.
- Yalnızca `http://127.0.0.1/plugins/diffs/assets/*` altındaki yerel görüntüleyici varlıklarına izin verilir.
- Harici ağ istekleri engellenir.

## Dosya modu için tarayıcı gereksinimleri

`mode: "file"` ve `mode: "both"` için Chromium uyumlu bir tarayıcı gerekir.

Çözümleme sırası:

1. OpenClaw yapılandırmasında `browser.executablePath`.
2. Ortam değişkenleri:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Platform komutu/yolu keşfi geri dönüşü.

Yaygın hata metni:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Bunu düzeltmek için Chrome, Chromium, Edge veya Brave kurun ya da yukarıdaki çalıştırılabilir yol seçeneklerinden birini ayarlayın.

## Sorun giderme

Girdi doğrulama hataları:

- `Provide patch or both before and after text.`
  - Hem `before` hem `after` ekleyin veya `patch` sağlayın.
- `Provide either patch or before/after input, not both.`
  - Girdi modlarını karıştırmayın.
- `Invalid baseUrl: ...`
  - İsteğe bağlı yola sahip `http(s)` kaynak kullanın; sorgu/hash yok.
- `{field} exceeds maximum size (...)`
  - Yük boyutunu azaltın.
- Büyük patch reddi
  - Patch dosya sayısını veya toplam satır sayısını azaltın.

Görüntüleyici erişilebilirlik sorunları:

- Görüntüleyici URL'si varsayılan olarak `127.0.0.1` çözülür.
- Uzak erişim senaryoları için şunlardan birini yapın:
  - eklenti `viewerBaseUrl` ayarlayın veya
  - araç çağrısı başına `baseUrl` geçin veya
  - `gateway.bind=custom` ve `gateway.customBindHost` kullanın
- `gateway.trustedProxies`, aynı host üzerindeki bir proxy için loopback içeriyorsa (örneğin Tailscale Serve), yönlendirilmiş istemci IP başlıkları olmayan ham loopback görüntüleyici istekleri tasarım gereği kapalı biçimde başarısız olur.
- Bu proxy topolojisi için:
  - yalnızca bir ek gerekiyorsa `mode: "file"` veya `mode: "both"` tercih edin ya da
  - paylaşılabilir bir görüntüleyici URL'sine ihtiyacınız varsa bilerek `security.allowRemoteViewer` etkinleştirin ve eklenti `viewerBaseUrl` ayarlayın veya bir proxy/public `baseUrl` geçin
- `security.allowRemoteViewer` yalnızca harici görüntüleyici erişimi amaçladığınızda etkinleştirin.

Değişmemiş satırlar satırında genişletme düğmesi yok:

- Bu, patch genişletilebilir bağlam taşımadığında patch girdisi için gerçekleşebilir.
- Bu beklenen bir durumdur ve görüntüleyici arızası anlamına gelmez.

Yapıt bulunamadı:

- Yapıt TTL nedeniyle süresi doldu.
- Token veya yol değişti.
- Temizleme bayat verileri kaldırdı.

## Operasyonel yönlendirme

- Canvas içindeki yerel etkileşimli incelemeler için `mode: "view"` tercih edin.
- Ek gerektiren dış sohbet kanalları için `mode: "file"` tercih edin.
- Dağıtımınız uzak görüntüleyici URL'leri gerektirmedikçe `allowRemoteViewer` devre dışı kalsın.
- Hassas diff'ler için açık kısa `ttlSeconds` ayarlayın.
- Gerekmediğinde diff girdisinde sırları göndermekten kaçının.
- Kanalınız görselleri agresif biçimde sıkıştırıyorsa (örneğin Telegram veya WhatsApp), PDF çıktıyı tercih edin (`fileFormat: "pdf"`).

Diff oluşturma motoru:

- [Diffs](https://diffs.com) tarafından desteklenir.

## İlgili belgeler

- [Araçlara genel bakış](/tools)
- [Eklentiler](/tools/plugin)
- [Tarayıcı](/tools/browser)
