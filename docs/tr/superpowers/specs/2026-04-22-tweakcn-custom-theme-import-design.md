---
x-i18n:
    generated_at: "2026-05-02T22:22:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9f2b5783c5762ebe7b5db108a89692e653c515138110b4fa9d23663e2ccbbd5
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 16
---

# Tweakcn Özel Tema İçe Aktarma Tasarımı

Durum: 2026-04-22 tarihinde terminalde onaylandı

## Özet

Bir tweakcn paylaşım bağlantısından içe aktarılabilen, tam olarak bir tarayıcı yerel özel Control UI tema yuvası ekleyin. Mevcut yerleşik tema aileleri `claw`, `knot` ve `dash` olarak kalır. Yeni `custom` ailesi normal bir OpenClaw tema ailesi gibi davranır ve içe aktarılan tweakcn yükü hem açık hem de koyu token kümelerini içerdiğinde `light`, `dark` ve `system` modunu destekler.

İçe aktarılan tema, Control UI ayarlarının geri kalanıyla birlikte yalnızca geçerli tarayıcı profilinde saklanır. Gateway yapılandırmasına yazılmaz ve cihazlar ya da tarayıcılar arasında eşitlenmez.

## Sorun

Control UI tema sistemi şu anda üç sabit kodlanmış tema ailesiyle kapalıdır:

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

Kullanıcılar yerleşik aileler ve mod varyantları arasında geçiş yapabilir, ancak repo CSS'ini düzenlemeden tweakcn'den tema getiremezler. İstenen sonuç genel bir tema sisteminden daha küçüktür: üç yerleşiği koruyun ve bir tweakcn bağlantısından değiştirilebilen, kullanıcı denetimli tek bir içe aktarılmış yuva ekleyin.

## Hedefler

- Mevcut yerleşik tema ailelerini değiştirmeden koruyun.
- Tema kitaplığı değil, tam olarak bir içe aktarılmış özel yuva ekleyin.
- Bir tweakcn paylaşım bağlantısını veya doğrudan `https://tweakcn.com/r/themes/{id}` URL'sini kabul edin.
- İçe aktarılan temayı yalnızca tarayıcı yerel depolamasında kalıcı hale getirin.
- İçe aktarılan yuvanın mevcut `light`, `dark` ve `system` mod denetimleriyle çalışmasını sağlayın.
- Hata davranışını güvenli tutun: hatalı bir içe aktarma etkin UI temasını asla bozmaz.

## Hedef dışı konular

- Çoklu tema kitaplığı veya tarayıcı yerel içe aktarma listesi yok.
- Gateway tarafında kalıcılık veya cihazlar arası eşitleme yok.
- Rastgele CSS düzenleyici veya ham tema JSON düzenleyici yok.
- tweakcn'den uzak font varlıklarının otomatik yüklenmesi yok.
- Yalnızca bir modu açığa çıkaran tweakcn yüklerini destekleme girişimi yok.
- Control UI için gereken bağlantı noktaları dışında repo genelinde tema refaktörü yok.

## Kullanıcı kararları zaten verildi

- Üç yerleşik temayı koruyun.
- tweakcn destekli bir içe aktarma yuvası ekleyin.
- İçe aktarılan temayı Gateway yapılandırmasında değil, tarayıcıda saklayın.
- İçe aktarılan yuva için `light`, `dark` ve `system` desteği verin.
- Özel yuvanın bir sonraki içe aktarmayla üzerine yazılması amaçlanan davranıştır.

## Önerilen yaklaşım

Control UI tema modeline dördüncü tema ailesi kimliği olarak `custom` ekleyin. `custom` ailesi yalnızca geçerli bir tweakcn içe aktarması varsa seçilebilir hale gelir. İçe aktarılan yük, OpenClaw'a özgü bir özel tema kaydına normalleştirilir ve UI ayarlarının geri kalanıyla birlikte tarayıcı yerel depolamasında saklanır.

Çalışma zamanında OpenClaw, çözümlenen özel CSS değişken bloklarını tanımlayan yönetilen bir `<style>` etiketi oluşturur:

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

Bu, özel tema değişkenlerini `custom` ailesiyle kapsamlı tutar ve satır içi CSS değişkenlerinin yerleşik ailelere sızmasını önler.

## Mimari

### Tema modeli

`ui/src/ui/theme.ts` dosyasını güncelleyin:

- `ThemeName` kapsamını `custom` içerecek şekilde genişletin.
- `ResolvedTheme` kapsamını `custom` ve `custom-light` içerecek şekilde genişletin.
- `VALID_THEME_NAMES` değerini genişletin.
- `resolveTheme()` fonksiyonunu, `custom` mevcut aile davranışını yansıtacak şekilde güncelleyin:
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> OS tercihine göre `custom` veya `custom-light`

`custom` için eski takma adlar eklenmez.

### Kalıcılık modeli

`ui/src/ui/storage.ts` içindeki `UiSettings` kalıcılığını isteğe bağlı tek bir özel tema yüküyle genişletin:

- `customTheme?: ImportedCustomTheme`

Önerilen saklanan şekil:

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

Notlar:

- `sourceUrl`, normalleştirme sonrası özgün kullanıcı girdisini saklar.
- `themeId`, URL'den çıkarılan tweakcn tema kimliğidir.
- `label`, varsa tweakcn `name` alanıdır, yoksa `Custom` olur.
- `light` ve `dark`, ham tweakcn yükleri değil, zaten normalleştirilmiş OpenClaw token haritalarıdır.
- İçe aktarılan yük, diğer tarayıcı yerel ayarlarının yanında yaşar ve aynı yerel depolama belgesinde serileştirilir.
- Saklanan özel tema verisi yükleme sırasında eksik veya geçersizse yükü yok sayın ve kalıcı aile `custom` olduğunda `theme: "claw"` değerine geri dönün.

### Çalışma zamanı uygulaması

Control UI çalışma zamanında, `ui/src/ui/app-settings.ts` ve `ui/src/ui/theme.ts` yakınında sahip olunan dar kapsamlı bir özel tema stil sayfası yöneticisi ekleyin.

Sorumluluklar:

- `document.head` içinde tek bir kararlı `<style id="openclaw-custom-theme">` etiketi oluşturun veya güncelleyin.
- Yalnızca geçerli bir özel tema yükü varsa CSS yayınlayın.
- Yük temizlendiğinde stil etiketi içeriğini kaldırın.
- Yerleşik aile CSS'ini `ui/src/styles/base.css` içinde tutun; içe aktarılan tokenları depoya işlenen stil sayfasına eklemeyin.

Bu yönetici ayarlar yüklendiğinde, kaydedildiğinde, içe aktarıldığında veya temizlendiğinde çalışır.

### Açık mod seçicileri

Uygulama, aileler arası açık stil için `custom-light` özel durumuna almak yerine `data-theme-mode="light"` kullanımını tercih etmelidir. Mevcut bir seçici `data-theme="light"` değerine sabitlenmişse ve her açık aileye uygulanması gerekiyorsa, bu çalışmanın parçası olarak genişletin.

## İçe aktarma UX'i

`ui/src/ui/views/config.ts` dosyasındaki `Appearance` bölümünü güncelleyin:

- `Claw`, `Knot` ve `Dash` yanına bir `Custom` tema kartı ekleyin.
- İçe aktarılmış özel tema yokken kartı devre dışı gösterin.
- Tema ızgarasının altına şunları içeren bir içe aktarma paneli ekleyin:
  - tweakcn paylaşım bağlantısı veya `/r/themes/{id}` URL'si için bir metin girdisi
  - bir `Import` düğmesi
  - özel yük zaten varsa bir `Replace` yolu
  - özel yük zaten varsa bir `Clear` eylemi
- Yük varsa içe aktarılan tema etiketini ve kaynak ana makinesini gösterin.
- Etkin tema `custom` ise, bir değiştirme içe aktarması hemen uygulanır.
- Etkin tema `custom` değilse, içe aktarma yalnızca kullanıcı `Custom` kartını seçene kadar yeni yükü saklar.

`ui/src/ui/views/config-quick.ts` içindeki hızlı ayarlar tema seçici de yalnızca yük varsa `Custom` göstermelidir.

## URL ayrıştırma ve uzaktan getirme

Tarayıcı içe aktarma yolu şunları kabul eder:

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

Uygulama iki biçimi de şuna normalleştirmelidir:

- `https://tweakcn.com/r/themes/{id}`

Tarayıcı daha sonra normalleştirilmiş `/r/themes/{id}` uç noktasını doğrudan getirir.

Harici yük için dar kapsamlı bir şema doğrulayıcı kullanın. Bu güvenilmeyen bir harici sınır olduğu için zod şeması tercih edilir.

Gerekli uzak alanlar:

- üst düzey `name`, isteğe bağlı string olarak
- `cssVars.theme`, isteğe bağlı object olarak
- `cssVars.light`, object olarak
- `cssVars.dark`, object olarak

`cssVars.light` veya `cssVars.dark` eksikse içe aktarmayı reddedin. Bu kasıtlıdır: onaylanan ürün davranışı, eksik bir tarafın en iyi çabayla sentezlenmesi değil, tam mod desteğidir.

## Token eşleme

tweakcn değişkenlerini körü körüne yansıtmayın. Sınırlı bir alt kümeyi OpenClaw tokenlarına normalleştirin ve geri kalanını bir yardımcıda türetin.

### Doğrudan içe aktarılan tokenlar

Her tweakcn mod bloğundan:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

Varsa paylaşılan `cssVars.theme` içinden:

- `font-sans`
- `font-mono`

Bir mod bloğu `font-sans`, `font-mono` veya `radius` değerini geçersiz kılarsa, moda yerel değer kazanır.

### OpenClaw için türetilen tokenlar

İçe aktarıcı, içe aktarılan temel renklerden yalnızca OpenClaw'a özgü değişkenleri türetir:

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

Türetme kuralları, bağımsız olarak test edilebilmeleri için saf bir yardımcıda yaşar. Kesin renk karıştırma formülleri bir uygulama detayıdır, ancak yardımcı iki kısıtı karşılamalıdır:

- içe aktarılan tema niyetine yakın okunabilir kontrastı korumak
- aynı içe aktarılan yük için kararlı çıktı üretmek

### v1'de yok sayılan tokenlar

Bu tweakcn tokenları ilk sürümde kasıtlı olarak yok sayılır:

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

Bu, kapsamı mevcut Control UI'ın gerçekten ihtiyaç duyduğu tokenlar üzerinde tutar.

### Fontlar

Font yığını stringleri varsa içe aktarılır, ancak OpenClaw v1'de uzak font varlıklarını yüklemez. İçe aktarılan yığın tarayıcıda kullanılamayan fontlara başvuruyorsa normal yedek davranışı geçerli olur.

## Hata davranışı

Hatalı içe aktarmalar kapalı şekilde başarısız olmalıdır.

- Geçersiz URL biçimi: satır içi doğrulama hatası göster, getirme yapma.
- Desteklenmeyen ana makine veya yol şekli: satır içi doğrulama hatası göster, getirme yapma.
- Ağ hatası, OK olmayan yanıt veya hatalı biçimlendirilmiş JSON: satır içi hata göster, geçerli saklanan yükü dokunmadan bırak.
- Şema hatası veya eksik açık/koyu bloklar: satır içi hata göster, geçerli saklanan yükü dokunmadan bırak.
- Temizleme eylemi:
  - saklanan özel yükü kaldırır
  - yönetilen özel stil etiketi içeriğini kaldırır
  - `custom` etkinse tema ailesini yeniden `claw` değerine geçirir
- İlk yüklemede geçersiz saklanan özel yük:
  - saklanan yükü yok say
  - özel CSS yayınlama
  - kalıcı tema ailesi `custom` ise `claw` değerine geri dön

Başarısız bir içe aktarma hiçbir noktada etkin belgede kısmi özel CSS değişkenleri uygulanmış bırakmamalıdır.

## Uygulamada değişmesi beklenen dosyalar

Birincil dosyalar:

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

Olası yeni yardımcılar:

- `ui/src/ui/custom-theme.ts`

Testler:

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- URL ayrıştırma ve yük normalleştirme için yeni odaklı testler

## Test

Asgari uygulama kapsamı:

- paylaşım bağlantısı URL'sini tweakcn tema kimliğine ayrıştır
- `/themes/{id}` ve `/r/themes/{id}` değerlerini getirme URL'sine normalleştir
- desteklenmeyen ana makineleri ve hatalı biçimlendirilmiş kimlikleri reddet
- tweakcn yük şeklini doğrula
- geçerli bir tweakcn yükünü normalleştirilmiş OpenClaw açık ve koyu token haritalarına eşle
- özel yükü tarayıcı yerel ayarlarında yükle ve kaydet
- `custom` değerini `light`, `dark` ve `system` için çözümle
- yük yokken `Custom` seçimini devre dışı bırak
- `custom` zaten etkin olduğunda içe aktarılan temayı hemen uygula
- etkin özel tema temizlendiğinde `claw` değerine geri dön

Manuel doğrulama hedefi:

- Settings'ten bilinen bir tweakcn temasını içe aktar
- `light`, `dark` ve `system` arasında geçiş yap
- `custom` ile yerleşik aileler arasında geçiş yap
- sayfayı yeniden yükle ve içe aktarılan özel temanın yerelde kalıcı olduğunu doğrula

## Dağıtım notları

Bu özellik kasıtlı olarak küçüktür. Kullanıcılar daha sonra birden fazla içe aktarılmış tema, yeniden adlandırma, dışa aktarma veya cihazlar arası eşitleme isterse bunu devam tasarımı olarak ele alın. Bu uygulamada bir tema kitaplığı soyutlamasını önceden oluşturmayın.
