---
read_when:
    - Ajanların kod veya Markdown düzenlemelerini diff olarak göstermesini istiyorsunuz
    - Canvas için hazır bir görüntüleyici URL'si veya işlenmiş bir diff dosyası istiyorsunuz
    - Güvenli varsayılanlara sahip kontrollü, geçici diff yapıtlarına ihtiyacınız var
summary: Ajanlar için salt okunur diff görüntüleyici ve dosya işleyici (isteğe bağlı Plugin aracı)
title: Diff'ler
x-i18n:
    generated_at: "2026-04-24T09:34:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe32441699b06dd27580b7e80afcfa3d1e466d7e2b74e52e60b327e73325eeca
    source_path: tools/diffs.md
    workflow: 15
---

`diffs`, kısa yerleşik sistem rehberliğine ve değişiklik içeriğini ajanlar için salt okunur bir diff yapıtına dönüştüren yardımcı bir Skill'e sahip isteğe bağlı bir Plugin aracıdır.

Şunlardan birini kabul eder:

- `before` ve `after` metni
- birleşik bir `patch`

Şunları döndürebilir:

- canvas sunumu için bir Gateway görüntüleyici URL'si
- mesaj teslimi için işlenmiş bir dosya yolu (PNG veya PDF)
- tek çağrıda her iki çıktı da

Etkinleştirildiğinde Plugin, sistem istemi alanına kısa kullanım rehberliği ekler ve ayrıca ajanın daha ayrıntılı yönergelere ihtiyaç duyduğu durumlar için ayrıntılı bir Skill sunar.

## Hızlı başlangıç

1. Plugin'i etkinleştirin.
2. Canvas öncelikli akışlar için `mode: "view"` ile `diffs` çağırın.
3. Sohbet dosyası teslim akışları için `mode: "file"` ile `diffs` çağırın.
4. Her iki yapıta da ihtiyacınız olduğunda `mode: "both"` ile `diffs` çağırın.

## Plugin'i etkinleştirin

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

## Yerleşik sistem rehberliğini devre dışı bırakın

`diffs` aracını etkin tutup yerleşik sistem istemi rehberliğini devre dışı bırakmak istiyorsanız `plugins.entries.diffs.hooks.allowPromptInjection` değerini `false` olarak ayarlayın:

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

Bu, Plugin'i, aracı ve yardımcı Skill'i kullanılabilir tutarken diffs Plugin'inin `before_prompt_build` kancasını engeller.

Hem rehberliği hem de aracı devre dışı bırakmak istiyorsanız bunun yerine Plugin'i devre dışı bırakın.

## Tipik ajan iş akışı

1. Ajan `diffs` çağırır.
2. Ajan `details` alanlarını okur.
3. Ajan şunlardan birini yapar:
   - `canvas present` ile `details.viewerUrl` açar
   - `path` veya `filePath` kullanarak `message` ile `details.filePath` gönderir
   - ikisini birden yapar

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

- `before` (`string`): özgün metin. `patch` atlandığında `after` ile birlikte zorunludur.
- `after` (`string`): güncellenmiş metin. `patch` atlandığında `before` ile birlikte zorunludur.
- `patch` (`string`): birleşik diff metni. `before` ve `after` ile birlikte kullanılamaz.
- `path` (`string`): önce ve sonra modu için görüntülenecek dosya adı.
- `lang` (`string`): önce ve sonra modu için dil geçersiz kılma ipucu. Bilinmeyen değerler düz metne geri döner.
- `title` (`string`): görüntüleyici başlığı geçersiz kılması.
- `mode` (`"view" | "file" | "both"`): çıktı modu. Plugin varsayılanı `defaults.mode` olur.
  Eski takma ad: `"image"`, `"file"` gibi davranır ve geriye dönük uyumluluk için hâlâ kabul edilir.
- `theme` (`"light" | "dark"`): görüntüleyici teması. Plugin varsayılanı `defaults.theme` olur.
- `layout` (`"unified" | "split"`): diff yerleşimi. Plugin varsayılanı `defaults.layout` olur.
- `expandUnchanged` (`boolean`): tam bağlam mevcut olduğunda değişmemiş bölümleri genişletir. Yalnızca çağrı başına seçenektir (Plugin varsayılan anahtarı değildir).
- `fileFormat` (`"png" | "pdf"`): işlenmiş dosya biçimi. Plugin varsayılanı `defaults.fileFormat` olur.
- `fileQuality` (`"standard" | "hq" | "print"`): PNG veya PDF işleme için kalite ön ayarı.
- `fileScale` (`number`): cihaz ölçeği geçersiz kılması (`1`-`4`).
- `fileMaxWidth` (`number`): CSS piksel cinsinden en fazla işleme genişliği (`640`-`2400`).
- `ttlSeconds` (`number`): görüntüleyici ve bağımsız dosya çıktıları için yapıt TTL'si, saniye cinsinden. Varsayılan 1800, en fazla 21600.
- `baseUrl` (`string`): görüntüleyici URL origin geçersiz kılması. Plugin `viewerBaseUrl` değerini geçersiz kılar. `http` veya `https` olmalıdır, query/hash içermez.

Geriye dönük uyumluluk için hâlâ kabul edilen eski girdi takma adları:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

Doğrulama ve sınırlar:

- `before` ve `after` ayrı ayrı en fazla 512 KiB.
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

## Çıktı `details` sözleşmesi

Araç, `details` altında yapılandırılmış meta veriler döndürür.

Görüntüleyici oluşturan modlar için paylaşılan alanlar:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context` (varsa `agentId`, `sessionId`, `messageChannel`, `agentAccountId`)

PNG veya PDF işlendiğinde dosya alanları:

- `artifactId`
- `expiresAt`
- `filePath`
- `path` (`filePath` ile aynı değer, message aracı uyumluluğu için)
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
- `mode: "both"`: görüntüleyici alanları artı dosya alanları. Dosya işleme başarısız olursa görüntüleyici yine `fileError` ve uyumluluk takma adı `imageError` ile döner.

## Daraltılmış değişmemiş bölümler

- Görüntüleyici `N unmodified lines` gibi satırlar gösterebilir.
- Bu satırlardaki genişletme denetimleri koşulludur ve her girdi türü için garanti edilmez.
- Genişletme denetimleri, işlenmiş diff genişletilebilir bağlam verisine sahip olduğunda görünür; bu genellikle önce ve sonra girdileri için tipiktir.
- Birçok birleşik patch girdisinde atlanan bağlam gövdeleri ayrıştırılmış patch hunk'larında bulunmadığından, satır genişletme denetimleri olmadan görünebilir. Bu beklenen davranıştır.
- `expandUnchanged`, yalnızca genişletilebilir bağlam mevcut olduğunda uygulanır.

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

Kalıcı görüntüleyici URL yapılandırması:

- `viewerBaseUrl` (`string`, isteğe bağlı)
  - Bir araç çağrısı `baseUrl` geçmediğinde döndürülen görüntüleyici bağlantıları için Plugin'e ait fallback.
  - `http` veya `https` olmalıdır, query/hash içermez.

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
  - `false`: görüntüleyici rotalarına yapılan local loopback dışı istekler reddedilir.
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

- Yapıtlar temp alt klasörü altında depolanır: `$TMPDIR/openclaw-diffs`.
- Görüntüleyici yapıtı meta verileri şunları içerir:
  - rastgele yapıt kimliği (20 hex karakter)
  - rastgele token (48 hex karakter)
  - `createdAt` ve `expiresAt`
  - depolanmış `viewer.html` yolu
- Varsayılan yapıt TTL'si belirtilmezse 30 dakikadır.
- Kabul edilen en yüksek görüntüleyici TTL'si 6 saattir.
- Temizleme, yapıt oluşturulduktan sonra fırsatçı biçimde çalışır.
- Süresi dolmuş yapıtlar silinir.
- Fallback temizleme, meta veriler eksik olduğunda 24 saatten eski bayat klasörleri kaldırır.

## Görüntüleyici URL'si ve ağ davranışı

Görüntüleyici rotası:

- `/plugins/diffs/view/{artifactId}/{token}`

Görüntüleyici varlıkları:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Görüntüleyici belgesi bu varlıkları görüntüleyici URL'sine göreli olarak çözümler; bu nedenle isteğe bağlı `baseUrl` yol öneki, bu varlık istekleri için de korunur.

URL oluşturma davranışı:

- Araç çağrısı `baseUrl` sağlanmışsa sıkı doğrulamadan sonra kullanılır.
- Aksi halde Plugin `viewerBaseUrl` yapılandırılmışsa o kullanılır.
- Bu geçersiz kılmaların hiçbiri yoksa görüntüleyici URL'si varsayılan olarak local loopback `127.0.0.1` olur.
- Gateway bind modu `custom` ise ve `gateway.customBindHost` ayarlıysa o ana makine kullanılır.

`baseUrl` kuralları:

- `http://` veya `https://` olmalıdır.
- Query ve hash reddedilir.
- Origin artı isteğe bağlı temel yola izin verilir.

## Güvenlik modeli

Görüntüleyici sağlamlaştırması:

- Varsayılan olarak yalnızca local loopback.
- Sıkı kimlik ve token doğrulamasına sahip belirteçli görüntüleyici yolları.
- Görüntüleyici yanıtı CSP:
  - `default-src 'none'`
  - betikler ve varlıklar yalnızca self üzerinden
  - giden `connect-src` yok
- Uzak erişim etkinleştirildiğinde uzak miss daraltması:
  - 60 saniyede 40 başarısızlık
  - 60 saniye kilitleme (`429 Too Many Requests`)

Dosya işleme sağlamlaştırması:

- Ekran görüntüsü tarayıcı istek yönlendirmesi varsayılan olarak engellemedir.
- Yalnızca `http://127.0.0.1/plugins/diffs/assets/*` içindeki yerel görüntüleyici varlıklarına izin verilir.
- Harici ağ istekleri engellenir.

## Dosya modu için tarayıcı gereksinimleri

`mode: "file"` ve `mode: "both"` bir Chromium uyumlu tarayıcı gerektirir.

Çözümleme sırası:

1. OpenClaw yapılandırmasındaki `browser.executablePath`.
2. Ortam değişkenleri:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Platform komutu/yolu keşfi fallback'i.

Yaygın hata metni:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Chrome, Chromium, Edge veya Brave kurarak ya da yukarıdaki yürütülebilir yol seçeneklerinden birini ayarlayarak düzeltin.

## Sorun giderme

Girdi doğrulama hataları:

- `Provide patch or both before and after text.`
  - Hem `before` hem `after` ekleyin veya `patch` sağlayın.
- `Provide either patch or before/after input, not both.`
  - Girdi modlarını karıştırmayın.
- `Invalid baseUrl: ...`
  - Query/hash olmadan isteğe bağlı yola sahip `http(s)` origin kullanın.
- `{field} exceeds maximum size (...)`
  - Yük boyutunu azaltın.
- Büyük patch reddi
  - Patch dosya sayısını veya toplam satır sayısını azaltın.

Görüntüleyici erişilebilirlik sorunları:

- Görüntüleyici URL'si varsayılan olarak `127.0.0.1` adresine çözümlenir.
- Uzak erişim senaryoları için ya:
  - Plugin `viewerBaseUrl` ayarlayın, veya
  - araç çağrısı başına `baseUrl` geçin, veya
  - `gateway.bind=custom` ve `gateway.customBindHost` kullanın
- `gateway.trustedProxies`, aynı ana makine proxy'si için local loopback içeriyorsa (örneğin Tailscale Serve), iletilen istemci-IP başlıkları olmayan ham local loopback görüntüleyici istekleri tasarım gereği güvenli şekilde kapatılır.
- Bu proxy topolojisi için:
  - yalnızca eke ihtiyacınız varsa `mode: "file"` veya `mode: "both"` tercih edin, veya
  - paylaşılabilir bir görüntüleyici URL'sine ihtiyacınız olduğunda bilinçli olarak `security.allowRemoteViewer` etkinleştirin ve Plugin `viewerBaseUrl` ayarlayın ya da bir proxy/genel `baseUrl` geçin
- `security.allowRemoteViewer` değerini yalnızca harici görüntüleyici erişimini amaçladığınızda etkinleştirin.

Değiştirilmemiş satırlar satırında genişlet düğmesi yok:

- Bu, patch genişletilebilir bağlam taşımadığında patch girdisi için olabilir.
- Bu beklenen bir durumdur ve görüntüleyici hatasına işaret etmez.

Yapıt bulunamadı:

- Yapıt TTL nedeniyle süresi doldu.
- Token veya yol değişti.
- Temizleme bayat verileri kaldırdı.

## İşletim rehberliği

- Canvas içinde yerel etkileşimli incelemeler için `mode: "view"` tercih edin.
- Ek gerektiren giden sohbet kanalları için `mode: "file"` tercih edin.
- Dağıtımınız uzak görüntüleyici URL'leri gerektirmediği sürece `allowRemoteViewer` devre dışı bırakılmış halde tutun.
- Hassas diff'ler için açık, kısa `ttlSeconds` ayarlayın.
- Gerekmediğinde diff girdisine gizli bilgileri göndermekten kaçının.
- Kanalınız görselleri agresif biçimde sıkıştırıyorsa (örneğin Telegram veya WhatsApp), PDF çıktısını tercih edin (`fileFormat: "pdf"`).

Diff işleme motoru:

- [Diffs](https://diffs.com) tarafından desteklenir.

## İlgili belgeler

- [Araçlara genel bakış](/tr/tools)
- [Plugin'ler](/tr/tools/plugin)
- [Tarayıcı](/tr/tools/browser)
