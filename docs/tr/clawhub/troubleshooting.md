---
read_when:
    - ClawHub CLI veya OpenClaw kayıt defteri komutları başarısız oluyor
    - Bir paket yüklenemiyor, yayımlanamıyor veya güncellenemiyor
summary: ClawHub oturum açma, yükleme, yayımlama, güncelleme ve API sorunlarını giderme.
x-i18n:
    generated_at: "2026-07-03T01:02:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Sorun Giderme

## `clawhub login` bir tarayıcı açıyor ancak hiç tamamlanmıyor

CLI, tarayıcı ile oturum açma sırasında kısa ömürlü bir yerel geri çağırma sunucusu başlatır.

- Tarayıcınızın `http://127.0.0.1:<port>/callback` adresine erişebildiğinden emin olun.
- Geri çağırma hiç ulaşmıyorsa yerel güvenlik duvarı, VPN ve proxy kurallarını kontrol edin.
- Başsız ortamlarda, ClawHub web kullanıcı arayüzünde bir API belirteci oluşturun ve şunu çalıştırın:

```bash
clawhub login --token clh_...
```

## `whoami` veya `publish`, `Unauthorized` (401) döndürüyor

- `clawhub login` ile yeniden oturum açın.
- Özel bir yapılandırma yolu kullanıyorsanız `CLAWHUB_CONFIG_PATH` değerinin geçerli belirtecinizi içeren
  dosyayı gösterdiğini doğrulayın.
- API belirteci kullanıyorsanız web kullanıcı arayüzünde iptal edilmediğini doğrulayın.

## Arama veya yükleme `Rate limit exceeded` (429) döndürüyor

Yanıttaki yeniden deneme bilgilerini okuyun:

- `Retry-After`: yeniden denemeden önce beklenecek saniye.
- `RateLimit-Limit`: bu isteğe uygulanan sınır.
- `RateLimit-Remaining`: başlık mevcut olduğunda kalan tam kotanız. `429` durumunda `0` olur.
- `RateLimit-Reset` veya `X-RateLimit-Reset`: sıfırlama zamanlaması.

Birçok kullanıcı aynı çıkış IP adresini paylaşıyorsa, her kişi yalnızca birkaç
istek gönderse bile anonim IP sınırlarına ulaşılabilir. Mümkün olduğunda oturum açın ve
bildirilen gecikmeden sonra yeniden deneyin.

## Arama veya yükleme bir proxy arkasında başarısız oluyor

CLI standart proxy değişkenlerine uyar:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Desteklenen adlar arasında `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` ve
`http_proxy` bulunur.

## Bir beceri aramada görünmüyor

- Biliyorsanız tam slug’ı veya sahip sayfasını kontrol edin.
- Sürümün herkese açık olduğunu ve tarama ya da moderasyon nedeniyle bekletilmediğini doğrulayın.
- Becerinin sahibiyseniz oturum açın ve inceleyin:

```bash
clawhub inspect @openclaw/demo
```

Sahip tarafından görülebilen tanı bilgileri tarama, yükleme kapısı veya moderasyon durumunu açıklayabilir.

## Yayınlama, gerekli meta veriler eksik olduğu için başarısız oluyor

Beceriler için `SKILL.md` frontmatter bölümünü kontrol edin. Gerekli ortam değişkenleri ve
araçlar, kullanıcıların ve tarayıcıların paketi anlayabilmesi için bildirilmelidir.

Plugin’ler için `package.json` uyumluluk meta verilerini kontrol edin. Kod Plugin’i yayınları,
`openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` gibi OpenClaw uyumluluk alanlarına ihtiyaç duyar.

Önce yayınlama yükünü önizleyin:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Yayınlama bir GitHub sahibi veya kaynak hatasıyla başarısız oluyor

ClawHub, paketleri yayıncılarına bağlamak için GitHub kimliğini ve kaynak atfını kullanır.

- Paketin sahibi olan veya paketi yayınlayabilen GitHub hesabıyla oturum açtığınızdan emin olun.
- Kaynak URL’nin herkese açık veya ClawHub tarafından erişilebilir olduğunu kontrol edin.
- GitHub kaynakları için `owner/repo`, `owner/repo@ref` veya tam bir GitHub URL’si kullanın.

## Yayınlama, bir ad alanı talep edildiği veya ayrıldığı için başarısız oluyor

Yayınlama, sahip tanıtıcısı, kuruluş ad alanı, paket kapsamı, beceri
slug’ı veya paket adı zaten talep edildiği ya da ayrıldığı için başarısız olursa, önce ad alanıyla eşleşen sahip üzerinden
yayınladığınızı doğrulayın. Plugin paketleri için
`@example-org/example-plugin` gibi kapsamlı adlar, eşleşen
`example-org` sahibi olarak yayınlanmalıdır.

Kuruluşunuzun, projenizin veya markanızın ilgili ad alanının hak sahibi olduğuna inanıyor ancak
mevcut ClawHub sahibini yönetemiyorsanız, herkese açık ve hassas olmayan kanıtlarla bir
[Kuruluş / Ad Alanı Talebi sorunu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
açın. Kanıt yönergeleri ve herkese açık sorunlarda nelerin
bulundurulmaması gerektiği için
[Kuruluş ve Ad Alanı Talepleri](/clawhub/namespace-claims) bölümüne bakın.

## `sync` hiçbir beceri bulunamadığını söylüyor

`sync`, `SKILL.md` veya `skill.md` içeren klasörleri arar.

Taramak istediğiniz köklere yönlendirin:

```bash
clawhub sync --root /path/to/skills
```

Nelerin yayınlanacağından emin değilseniz önce önizleyin:

```bash
clawhub sync --all --dry-run --no-input
```

## `update`, yerel değişiklikler nedeniyle reddediyor

Yerel dosyalar, ClawHub’ın bildiği hiçbir sürümle eşleşmiyor. Birini seçin:

- Yerel düzenlemeleri koruyun ve güncellemeyi atlayın.
- Yayınlanan sürümle üzerine yazın:

```bash
clawhub update @openclaw/demo --force
```

- Düzenlediğiniz kopyayı yeni bir slug veya fork olarak yayınlayın.

## OpenClaw’da Plugin yüklemesi başarısız oluyor

- Açık bir ClawHub kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

- Tarama durumu ve uyumluluk meta verileri için paket ayrıntı sayfasını kontrol edin.
- OpenClaw sürümünüzün paketin duyurduğu uyumluluk
  aralığını karşıladığını doğrulayın.
- Paket gizliyse, bekletiliyorsa veya engellendiyse, sahibi sorunu çözene kadar
  yüklenemeyebilir.

## Herkese açık API istekleri başarısız oluyor

- `429` yeniden deneme başlıklarına uyun ve herkese açık liste/arama yanıtlarını önbelleğe alın.
- Kullanıcıları kanonik ClawHub listesine geri bağlayın.
- Gizli, özel, bekletilen veya moderasyon tarafından engellenen içeriği
  herkese açık API yüzeyi dışında yansıtmayın.

Uç nokta ayrıntıları için [HTTP API](/clawhub/http-api) bölümüne bakın.
