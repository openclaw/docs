---
read_when:
    - ClawHub CLI veya OpenClaw kayıt deposu komutları başarısız oluyor
    - Bir paket yüklenemiyor, yayımlanamıyor veya güncellenemiyor
summary: ClawHub oturum açma, kurulum, yayımlama, güncelleme ve API sorunlarını giderme.
x-i18n:
    generated_at: "2026-06-28T05:07:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Sorun Giderme

## `clawhub login` tarayıcı açıyor ancak hiç tamamlanmıyor

CLI, tarayıcıyla oturum açma sırasında kısa ömürlü bir yerel geri çağırma sunucusu başlatır.

- Tarayıcınızın `http://127.0.0.1:<port>/callback` adresine erişebildiğinden emin olun.
- Geri çağırma hiç gelmiyorsa yerel güvenlik duvarı, VPN ve proxy kurallarını kontrol edin.
- Başsız ortamlarda, ClawHub web arayüzünde bir API belirteci oluşturun ve şunu çalıştırın:

```bash
clawhub login --token clh_...
```

## `whoami` veya `publish`, `Unauthorized` (401) döndürüyor

- `clawhub login` ile yeniden oturum açın.
- Özel bir yapılandırma yolu kullanıyorsanız, `CLAWHUB_CONFIG_PATH` değerinin
  geçerli belirtecinizi içeren dosyayı gösterdiğini doğrulayın.
- Bir API belirteci kullanıyorsanız, web arayüzünde iptal edilmediğini doğrulayın.

## Arama veya kurulum `Rate limit exceeded` (429) döndürüyor

Yanıttaki yeniden deneme bilgilerini okuyun:

- `Retry-After`: yeniden denemeden önce beklenecek saniye sayısı.
- `RateLimit-Limit`: bu isteğe uygulanan sınır.
- `RateLimit-Remaining`: üst bilgi mevcut olduğunda tam kalan kotanız. `429` durumunda `0` olur.
- `RateLimit-Reset` veya `X-RateLimit-Reset`: sıfırlama zamanlaması.

Birçok kullanıcı tek bir çıkış IP'sini paylaşıyorsa, her kişi yalnızca birkaç
istek gönderse bile anonim IP sınırlarına ulaşılabilir. Mümkünse oturum açın ve
bildirilen gecikmeden sonra yeniden deneyin.

## Arama veya kurulum bir proxy arkasında başarısız oluyor

CLI standart proxy değişkenlerine uyar:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Desteklenen adlar arasında `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` ve
`http_proxy` bulunur.

## Bir beceri aramada görünmüyor

- Biliyorsanız tam slug'ı veya sahip sayfasını kontrol edin.
- Sürümün herkese açık olduğunu ve tarama ya da moderasyon tarafından bekletilmediğini doğrulayın.
- Becerinin sahibiyseniz, oturum açın ve inceleyin:

```bash
clawhub inspect @openclaw/demo
```

Sahibin görebildiği tanılama bilgileri tarama, yükleme kapısı veya moderasyon durumunu açıklayabilir.

## Gerekli meta veriler eksik olduğu için yayımlama başarısız oluyor

Beceriler için `SKILL.md` frontmatter bölümünü kontrol edin. Gerekli ortam değişkenleri ve
araçlar, kullanıcıların ve tarayıcıların paketi anlayabilmesi için bildirilmelidir.

Plugin'ler için `package.json` uyumluluk meta verilerini kontrol edin. code-plugin yayımlamaları,
`openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` gibi OpenClaw uyumluluk alanlarına
ihtiyaç duyar.

Önce yayımlama yükünün önizlemesini alın:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Bir GitHub sahibi veya kaynak hatası nedeniyle yayımlama başarısız oluyor

ClawHub, paketleri yayımlayıcılarına bağlamak için GitHub kimliğini ve kaynak ilişkilendirmesini kullanır.

- Paketin sahibi olan veya paketi yayımlayabilen GitHub hesabıyla oturum açtığınızdan emin olun.
- Kaynak URL'nin herkese açık veya ClawHub tarafından erişilebilir olduğunu kontrol edin.
- GitHub kaynakları için `owner/repo`, `owner/repo@ref` veya tam GitHub URL'si kullanın.

## Bir ad alanı talep edildiği veya ayrıldığı için yayımlama başarısız oluyor

Sahip kullanıcı adı, kuruluş ad alanı, paket kapsamı, beceri slug'ı veya paket adı zaten
talep edilmiş ya da ayrılmış olduğu için yayımlama başarısız olursa, önce ad alanıyla eşleşen
sahiple yayımladığınızı doğrulayın. Plugin paketleri için
`@example-org/example-plugin` gibi kapsamlı adlar, eşleşen `example-org` sahibi olarak
yayımlanmalıdır.

Kuruluşunuzun, projenizin veya markanızın ilgili ad alanının hak sahibi olduğunu düşünüyorsanız ancak
mevcut ClawHub sahibini yönetemiyorsanız, herkese açık ve hassas olmayan kanıtlarla bir
[Kuruluş / Ad Alanı Talebi sorunu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
açın. Kanıt rehberliği ve herkese açık sorunların dışında tutulması gerekenler için
[Kuruluş ve Ad Alanı Talepleri](/tr/clawhub/namespace-claims) bölümüne bakın.

## `sync` hiçbir beceri bulunmadığını söylüyor

`sync`, `SKILL.md` veya `skill.md` içeren klasörleri arar.

Taramak istediğiniz kökleri gösterin:

```bash
clawhub sync --root /path/to/skills
```

Nelerin yayımlanacağından emin değilseniz önce önizleme yapın:

```bash
clawhub sync --all --dry-run --no-input
```

## Yerel değişiklikler nedeniyle `update` reddediyor

Yerel dosyalar ClawHub'ın bildiği hiçbir sürümle eşleşmiyor. Birini seçin:

- Yerel düzenlemeleri koruyun ve güncellemeyi atlayın.
- Yayımlanmış sürümle üzerine yazın:

```bash
clawhub update @openclaw/demo --force
```

- Düzenlediğiniz kopyayı yeni bir slug veya fork olarak yayımlayın.

## OpenClaw'da bir Plugin kurulumu başarısız oluyor

- Açık bir ClawHub kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

- Tarama durumu ve uyumluluk meta verileri için paket ayrıntı sayfasını kontrol edin.
- OpenClaw sürümünüzün paketin duyurduğu uyumluluk aralığını karşıladığını doğrulayın.
- Paket gizliyse, bekletiliyorsa veya engellendiyse, sahibi sorunu çözene kadar kurulamayabilir.

## Herkese açık API istekleri başarısız oluyor

- `429` yeniden deneme üst bilgilerine uyun ve herkese açık liste/arama yanıtlarını önbelleğe alın.
- Kullanıcıları kanonik ClawHub listesine geri yönlendirin.
- Gizli, özel, bekletilen veya moderasyon tarafından engellenmiş içeriği herkese açık
  API yüzeyi dışında yansıtmayın.

Uç nokta ayrıntıları için [HTTP API](/tr/clawhub/http-api) bölümüne bakın.
