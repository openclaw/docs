---
read_when:
    - Agentların kod veya Markdown düzenlemelerini diff olarak göstermesini istiyorsunuz
    - Canvas'a hazır bir görüntüleyici URL'si veya işlenmiş bir diff dosyası istiyorsunuz
    - Güvenli varsayılanlara sahip, denetimli ve geçici diff yapıtlarına ihtiyacınız var
sidebarTitle: Diffs
summary: Ajanlar için salt okunur fark görüntüleyici ve dosya işleyici (isteğe bağlı plugin aracı)
title: Farklar
x-i18n:
    generated_at: "2026-07-16T17:41:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs`, önceki/sonraki metni veya birleşik bir yamayı salt okunur bir diff yapıtına dönüştüren, isteğe bağlı olarak paketlenmiş bir plugin aracıdır. Ayrıca sistem isteminin başına kısa ajan yönergeleri ekler ve daha kapsamlı talimatlar için eşlik eden bir skill ile birlikte gelir.

Girdi: `before` + `after` metni veya birleşik bir `patch` (birbirini dışlar).

Çıktı: canvas sunumu için bir Gateway görüntüleyici URL'si, ileti teslimatı için işlenmiş bir PNG/PDF dosya yolu veya her ikisi.

## Hızlı başlangıç

<Steps>
  <Step title="Plugini yükleyin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Plugini etkinleştirin">
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
        Önceliği canvas olan akışlar: ajanlar `diffs` öğesini `mode: "view"` ile çağırır ve `details.viewerUrl` öğesini `canvas present` ile açar.
      </Tab>
      <Tab title="file">
        Sohbet dosyası teslimatı: ajanlar `diffs` öğesini `mode: "file"` ile çağırır ve `details.filePath` öğesini `message` ile, `path` veya `filePath` kullanarak gönderir.
      </Tab>
      <Tab title="both">
        Birleşik (varsayılan): ajanlar her iki yapıtı tek çağrıda almak için `diffs` öğesini `mode: "both"` ile çağırır.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Yerleşik sistem yönergelerini devre dışı bırakma

Aracı koruyup sistem isteminin başına eklenen yönergeleri kaldırmak için `plugins.entries.diffs.hooks.allowPromptInjection` değerini `false` olarak ayarlayın:

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

Bu, aracı ve skill'i kullanılabilir tutarken pluginin `before_prompt_build` hook'unu engeller. Hem yönergeleri hem de aracı devre dışı bırakmak için bunun yerine plugini devre dışı bırakın.

## Araç girdisi başvurusu

Belirtilmediği sürece tüm alanlar isteğe bağlıdır.

<ParamField path="before" type="string">
  Özgün metin. `patch` atlandığında `after` ile birlikte gereklidir.
</ParamField>
<ParamField path="after" type="string">
  Güncellenmiş metin. `patch` atlandığında `before` ile birlikte gereklidir.
</ParamField>
<ParamField path="patch" type="string">
  Birleşik diff metni. `before` ve `after` ile birbirini dışlar.
</ParamField>
<ParamField path="path" type="string">
  Önceki/sonraki modu için görüntülenecek dosya adı.
</ParamField>
<ParamField path="lang" type="string">
  Önceki/sonraki modu için dil geçersiz kılma ipucu. Bilinmeyen değerler ve varsayılan görüntüleyici kümesinin dışındaki diller, Diff Viewer Language Pack plugini
  yüklü olmadığı sürece düz metne geri döner.
</ParamField>
<ParamField path="title" type="string">
  Görüntüleyici başlığını geçersiz kılar.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  Çıktı modu. Varsayılanı pluginin `defaults.mode` (`both`) değeridir. Kullanımdan kaldırılmış diğer ad: `"image"`, `"file"` ile aynı şekilde davranır.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Görüntüleyici teması. Varsayılanı pluginin `defaults.theme` değeridir.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff düzeni. Varsayılanı pluginin `defaults.layout` değeridir.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  Tam bağlam kullanılabilir olduğunda değişmeyen bölümleri genişletir. Yalnızca çağrı başına seçenek (plugin varsayılan anahtarı değildir).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  İşlenmiş dosya biçimi. Varsayılanı pluginin `defaults.fileFormat` değeridir.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG/PDF işleme için kalite ön ayarı.
</ParamField>
<ParamField path="fileScale" type="number">
  Cihaz ölçeğini geçersiz kılar (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSS pikseli cinsinden azami işleme genişliği (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  Görüntüleyici ve bağımsız dosya çıktıları için saniye cinsinden yapıt TTL'si. Azami `21600`.
</ParamField>
<ParamField path="baseUrl" type="string">
  Görüntüleyici URL kökenini geçersiz kılar. Plugin `viewerBaseUrl` değerini geçersiz kılar. `http` veya `https` olmalıdır; sorgu/hash içeremez.
</ParamField>

<AccordionGroup>
  <Accordion title="Doğrulama ve sınırlar">
    - `before`/`after`: her biri en fazla 512 KiB.
    - `patch`: en fazla 2 MiB.
    - `path`: en fazla 2048 bayt.
    - `lang`: en fazla 128 bayt.
    - `title`: en fazla 1024 bayt.
    - Yama karmaşıklığı sınırı: en fazla 128 dosya ve toplam 120000 satır.
    - `patch` öğesinin `before`/`after` ile birlikte kullanılması reddedilir.
    - İşlenmiş dosya güvenlik sınırları (PNG ve PDF):
      - `fileQuality: "standard"`: en fazla 8 MP (8,000,000 işlenmiş piksel).
      - `fileQuality: "hq"`: en fazla 14 MP.
      - `fileQuality: "print"`: en fazla 24 MP.
      - PDF ayrıca 50 sayfayla sınırlandırılır.

  </Accordion>
</AccordionGroup>

## Sözdizimi vurgulama

Yerleşik diller:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml` ve `toml`.

Yaygın diğer adlar (`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1` vb.) bu dillere normalleştirilir.

Daha fazla dil (Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff ve daha fazlası) için Diff Viewer Language Pack pluginini yükleyin:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

Paket olmadan desteklenmeyen diller yine okunabilir düz metin olarak işlenir. Üst kaynak kataloğu için [Diffs Language Pack plugini](/tr/plugins/reference/diffs-language-pack) ve [Shiki dilleri](https://shiki.style/languages) sayfalarına bakın.

## Çıktı ayrıntıları sözleşmesi

Tüm başarılı sonuçlar `changed` içerir: aynı önceki/sonraki girdi, bir yapıt oluşturmadan `false` döndürür; işlenmiş sonuçlar `true` döndürür.

<AccordionGroup>
  <Accordion title="Görüntüleyici alanları (view ve both modları)">
    - `changed`
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
  <Accordion title="Dosya alanları (file ve both modları)">
    - `changed`
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (ileti aracı uyumluluğu için `filePath` ile aynı değer)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
</AccordionGroup>

| Mod      | Döndürülenler                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | Yalnızca görüntüleyici alanları.                                                                |
| `"file"` | Yalnızca dosya alanları; görüntüleyici yapıtı yoktur.                                           |
| `"both"` | Görüntüleyici alanları ve dosya alanları. Dosya işleme başarısız olursa görüntüleyici yine `fileError` ile döner. |

### Daraltılmış değişmeyen bölümler

Görüntüleyici, `N unmodified lines` gibi satırlar gösterir. Genişletme denetimleri yalnızca işlenmiş diff, genişletilebilir bağlam verilerine sahip olduğunda (genellikle önceki/sonraki girdisinde) görünür. Birçok birleşik yama, parçalarında bağlam gövdelerini atlar; dolayısıyla satır bir genişletme denetimi olmadan görünebilir — bu beklenen bir durumdur, hata değildir. `expandUnchanged` yalnızca genişletilebilir bağlam mevcut olduğunda uygulanır.

### Çok dosyalı gezinme

Birden fazla dosyaya dokunan yamalar, değiştirilmiş dosyalar özet kartıyla başlar: toplam `+N` / `-N` sayıları, dosya başına sayılar, eklenen/silinen/yeniden adlandırılan rozetleri ve her dosyaya atlayan bağlantı bağlantıları. İşlenmiş PNG/PDF dosyaları dosya başına başlık sayılarını korur ancak statik bir dosyada işlevsiz oldukları için etkileşimli görünüm anahtarlarını kaldırır.

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

Desteklenen `defaults` anahtarları: `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`. Açık araç çağrısı parametreleri bunları geçersiz kılar.

### Kalıcı görüntüleyici URL yapılandırması

<ParamField path="viewerBaseUrl" type="string">
  Bir araç çağrısı `baseUrl` iletmediğinde döndürülen görüntüleyici bağlantıları için plugine ait geri dönüş değeri. `http` veya `https` olmalıdır; sorgu/hash içeremez.
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
  `false`: görüntüleyici rotalarına geri döngü dışından gelen istekler reddedilir. `true`: belirteçli yol geçerliyse uzak görüntüleyicilere izin verilir.
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

- Yapıtlar `$TMPDIR/openclaw-diffs` altında bulunur.
- Görüntüleyici meta verileri; rastgele 20 onaltılık karakterli bir yapıt kimliği, rastgele 48 onaltılık karakterli bir belirteç, `createdAt`/`expiresAt` ve depolanan `viewer.html` yolunu saklar.
- Varsayılan yapıt TTL'si: 30 dakika. Kabul edilen azami TTL: 6 saat.
- Temizleme, her yapıt oluşturma çağrısından sonra uygun olduğunda çalışır; süresi dolmuş yapıtlar silinir.
- Geri dönüş taraması, meta veriler eksik olduğunda 24 saatten eski bayat klasörleri kaldırır.

## Görüntüleyici URL'si ve ağ davranışı

Görüntüleyici rotası: `/plugins/diffs/view/{artifactId}/{token}`

Görüntüleyici varlıkları:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (yalnızca diff bir dil paketi dili kullandığında)

Görüntüleyici belgesi bu varlıkları görüntüleyici URL'sine göre çözümler; dolayısıyla isteğe bağlı bir `baseUrl` yol öneki, varlık isteklerine de uygulanır.

URL çözümleme sırası: araç çağrısı `baseUrl` (katı doğrulamadan sonra) -> plugin `viewerBaseUrl` -> varsayılan geri döngü `127.0.0.1`. Gateway bağlama modu `custom` ise ve `gateway.customBindHost` ayarlanmışsa geri döngü yerine bu ana makine kullanılır.

`baseUrl` kuralları: `http://` veya `https://` olmalıdır; sorgu ve karma reddedilir; kaynak ile isteğe bağlı temel yola izin verilir.

## Güvenlik modeli

<AccordionGroup>
  <Accordion title="Görüntüleyici güvenliğini artırma">
    - Varsayılan olarak yalnızca geri döngü.
    - Katı kimlik ve belirteç kalıbı doğrulamasına sahip belirteçli görüntüleyici yolları.
    - Görüntüleyici yanıtı CSP'si: `default-src 'none'`; betikler/varlıklar yalnızca kendisinden; dışarıya `connect-src` yok.
    - Uzaktan erişim etkinleştirildiğinde uzaktaki bulunamayan istekleri sınırlama: 60 saniye içinde 40 başarısızlık, 60 saniyelik kilitlenmeyi tetikler (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="Dosya işleme güvenliğini artırma">
    - Ekran görüntüsü tarayıcı isteği yönlendirmesi varsayılan olarak reddedilir.
    - Yalnızca `http://127.0.0.1/plugins/diffs/assets/*` konumundaki yerel görüntüleyici varlıklarına izin verilir.
    - Harici ağ istekleri engellenir.

  </Accordion>
</AccordionGroup>

## Dosya modu için tarayıcı gereksinimleri

`mode: "file"` ve `mode: "both"`, Chromium uyumlu bir tarayıcı gerektirir.

Çözümleme sırası:

<Steps>
  <Step title="Yapılandırma">
    OpenClaw yapılandırmasındaki `browser.executablePath`.
  </Step>
  <Step title="Ortam değişkenleri">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Platform yedeği">
    Chrome, Chromium, Edge ve Brave için yaygın kurulum yolları ve `PATH` aramaları.
  </Step>
</Steps>

Yaygın hata metni: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. Chrome, Chromium, Edge veya Brave'i kurarak ya da yukarıdaki yürütülebilir dosya yolu seçeneklerinden birini ayarlayarak düzeltin.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Girdi doğrulama hataları">
    - `Provide patch or both before and after text.` -- hem `before` hem de `after` değerlerini ekleyin veya `patch` sağlayın.
    - `Provide either patch or before/after input, not both.` -- girdi modlarını karıştırmayın.
    - `Invalid baseUrl: ...` -- isteğe bağlı yola sahip bir `http(s)` kaynağı kullanın; sorgu/karma kullanmayın.
    - `{field} exceeds maximum size (...)` -- veri yükü boyutunu azaltın.
    - Büyük yama reddi -- yama dosyası sayısını veya toplam satır sayısını azaltın.

  </Accordion>
  <Accordion title="Görüntüleyici erişilebilirliği">
    - Görüntüleyici URL'si varsayılan olarak `127.0.0.1` adresine çözümlenir.
    - Uzaktan erişim için plugin `viewerBaseUrl` değerini ayarlayın, her çağrıda `baseUrl` iletin veya `gateway.customBindHost` ile `gateway.bind=custom` kullanın.
    - Aynı ana makinedeki bir proxy için (örneğin Tailscale Serve) `gateway.trustedProxies` geri döngüyü içeriyorsa, iletilmiş istemci IP'si üstbilgileri bulunmayan ham geri döngü görüntüleyici istekleri tasarım gereği güvenli biçimde başarısız olur.
    - Bu proxy topolojisinde ek için `mode: "file"`/`"both"` kullanmayı tercih edin veya paylaşılabilir bir görüntüleyici bağlantısı için `security.allowRemoteViewer` ile plugin `viewerBaseUrl`/proxy `baseUrl` seçeneğini bilinçli olarak etkinleştirin.
    - `security.allowRemoteViewer` seçeneğini yalnızca harici görüntüleyici erişimi amaçlandığında etkinleştirin.

  </Accordion>
  <Accordion title="Değiştirilmemiş satırlar satırında genişletme düğmesi yok">
    Genişletilebilir bağlam içermeyen yama girdisi için beklenen davranıştır; görüntüleyici arızası değildir.
  </Accordion>
  <Accordion title="Yapıt bulunamadı">
    - Yapıtın süresi TTL nedeniyle doldu.
    - Belirteç veya yol değişti.
    - Temizleme, eski verileri kaldırdı.

  </Accordion>
</AccordionGroup>

## İşletim kılavuzu

- Canvas'taki yerel etkileşimli incelemeler için `mode: "view"` kullanmayı tercih edin.
- Ek gerektiren giden sohbet kanalları için `mode: "file"` kullanmayı tercih edin.
- Dağıtımınız uzaktan görüntüleyici URL'leri gerektirmedikçe `allowRemoteViewer` seçeneğini devre dışı tutun.
- Hassas diff'ler için açıkça kısa bir `ttlSeconds` ayarlayın.
- Gerekli olmadığında diff girdisinde gizli bilgiler göndermekten kaçının.
- Kanalınız görüntüleri yoğun biçimde sıkıştırıyorsa (örneğin Telegram veya WhatsApp), PDF çıktısını (`fileFormat: "pdf"`) tercih edin.

<Note>
Diff işleme motoru [Diffs](https://diffs.com) tarafından desteklenmektedir.
</Note>

## İlgili

- [Tarayıcı](/tr/tools/browser)
- [Pluginler](/tr/tools/plugin)
- [Araçlara genel bakış](/tr/tools)
