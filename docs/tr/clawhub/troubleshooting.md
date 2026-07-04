---
read_when:
    - ClawHub CLI veya OpenClaw kayıt komutları başarısız oluyor
    - Bir paket yüklenemez, yayımlanamaz veya güncellenemez
summary: ClawHub oturum açma, yükleme, yayımlama, güncelleme ve API sorunlarını giderme.
x-i18n:
    generated_at: "2026-07-04T15:30:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Sorun Giderme

## `clawhub login` bir tarayıcı açıyor ancak hiç tamamlanmıyor

CLI, tarayıcıyla oturum açma sırasında kısa ömürlü bir yerel geri çağırma sunucusu başlatır.

- Tarayıcınızın `http://127.0.0.1:<port>/callback` adresine erişebildiğinden emin olun.
- Geri çağırma hiç gelmiyorsa yerel güvenlik duvarı, VPN ve proxy kurallarını kontrol edin.
- Başsız ortamlarda ClawHub web kullanıcı arayüzünde bir API token'ı oluşturun ve şunu çalıştırın:

```bash
clawhub login --token clh_...
```

## `whoami` veya `publish`, `Unauthorized` (401) döndürüyor

- `clawhub login` ile yeniden oturum açın.
- Özel bir yapılandırma yolu kullanıyorsanız `CLAWHUB_CONFIG_PATH` değerinin
  geçerli token'ınızı içeren dosyayı gösterdiğini doğrulayın.
- API token'ı kullanıyorsanız web kullanıcı arayüzünde iptal edilmediğini doğrulayın.

## Arama veya kurulum `Rate limit exceeded` (429) döndürüyor

Yanıttaki yeniden deneme bilgilerini okuyun:

- `Retry-After`: yeniden denemeden önce beklenecek saniye sayısı.
- `RateLimit-Limit`: bu isteğe uygulanan sınır.
- `RateLimit-Remaining`: üst bilgi mevcut olduğunda kalan tam bütçeniz. `429` durumunda bu değer `0` olur.
- `RateLimit-Reset` veya `X-RateLimit-Reset`: sıfırlama zamanlaması.

Birçok kullanıcı tek bir çıkış IP'sini paylaşıyorsa, her kişi yalnızca birkaç
istek gönderse bile anonim IP sınırlarına ulaşılabilir. Mümkün olduğunda oturum
açın ve bildirilen gecikmeden sonra yeniden deneyin.

## Arama veya kurulum bir proxy arkasında başarısız oluyor

CLI standart proxy değişkenlerine uyar:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Desteklenen adlar arasında `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` ve
`http_proxy` bulunur.

## Bir Skills aramada görünmüyor

- Biliyorsanız tam slug'ı veya sahip sayfasını kontrol edin.
- Yayının herkese açık olduğunu ve tarama ya da moderasyon tarafından bekletilmediğini doğrulayın.
- Skills size aitse oturum açın ve inceleyin:

```bash
clawhub inspect @openclaw/demo
```

Sahip tarafından görülebilen tanılama bilgileri tarama, yükleme kapısı veya moderasyon durumunu açıklayabilir.

## Gerekli metadata eksik olduğu için yayınlama başarısız oluyor

Skills için `SKILL.md` frontmatter'ını kontrol edin. Kullanıcıların ve
tarayıcıların paketi anlayabilmesi için gerekli ortam değişkenleri ve araçlar
bildirilmelidir.

Plugin'ler için `package.json` uyumluluk metadata'sını kontrol edin. Kod Plugin
yayınları, `openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` gibi
OpenClaw uyumluluk alanlarına ihtiyaç duyar.

Önce yayınlama yükünü önizleyin:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Bir GitHub sahibi veya kaynak hatası nedeniyle yayınlama başarısız oluyor

ClawHub, paketleri yayıncılarına bağlamak için GitHub kimliği ve kaynak atfını
kullanır.

- Paketin sahibi olan veya paketi yayınlayabilen GitHub hesabıyla oturum açtığınızdan emin olun.
- Kaynak URL'nin herkese açık veya ClawHub tarafından erişilebilir olduğunu kontrol edin.
- GitHub kaynakları için `owner/repo`, `owner/repo@ref` veya tam bir GitHub URL'si kullanın.

## Bir namespace talep edilmiş veya rezerve edilmiş olduğu için yayınlama başarısız oluyor

Sahip kullanıcı adı, kuruluş namespace'i, paket kapsamı, Skills slug'ı veya paket
adı zaten talep edilmiş ya da rezerve edilmiş olduğu için yayınlama başarısız
olursa, önce namespace ile eşleşen sahip üzerinden yayınladığınızı doğrulayın.
Plugin paketleri için `@example-org/example-plugin` gibi kapsamlı adlar,
eşleşen `example-org` sahibi olarak yayınlanmalıdır.

Kuruluşunuzun, projenizin veya markanızın hak sahibi namespace sahibi olduğuna
inanıyor ancak geçerli ClawHub sahibini yönetemiyorsanız herkese açık, hassas
olmayan kanıtlarla bir
[Kuruluş / Namespace Talebi sorunu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
açın. Kanıt yönergeleri ve herkese açık sorunlardan uzak tutulması gerekenler
için [Kuruluş ve Namespace Talepleri](/clawhub/namespace-claims) bölümüne bakın.

## `sync` hiçbir Skills bulunmadığını söylüyor

`sync`, `SKILL.md` veya `skill.md` içeren klasörleri arar.

Taramak istediğiniz kökleri gösterin:

```bash
clawhub sync --root /path/to/skills
```

Neyin yayınlanacağından emin değilseniz önce önizleyin:

```bash
clawhub sync --all --dry-run --no-input
```

## Yerel değişiklikler nedeniyle `update` reddediyor

Yerel dosyalar ClawHub'ın bildiği hiçbir sürümle eşleşmiyor. Birini seçin:

- Yerel düzenlemeleri koruyun ve güncellemeyi atlayın.
- Yayınlanmış sürümle üzerine yazın:

```bash
clawhub update @openclaw/demo --force
```

- Düzenlenmiş kopyanızı yeni bir slug veya fork olarak yayınlayın.

## OpenClaw içinde bir Plugin kurulumu başarısız oluyor

- Açık bir ClawHub kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

- Tarama durumu ve uyumluluk metadata'sı için paket ayrıntı sayfasını kontrol edin.
- OpenClaw sürümünüzün paketin duyurduğu uyumluluk aralığını karşıladığını
  doğrulayın.
- Paket gizliyse, bekletiliyorsa veya engellenmişse sahip sorunu çözene kadar
  kurulabilir olmayabilir.

## Herkese açık API istekleri başarısız oluyor

- `429` yeniden deneme üst bilgilerine uyun ve herkese açık liste/arama yanıtlarını önbelleğe alın.
- Kullanıcıları kanonik ClawHub listelemesine geri bağlayın.
- Gizli, özel, bekletilen veya moderasyon tarafından engellenmiş içeriği
  herkese açık API yüzeyi dışında yansıtmayın.

Uç nokta ayrıntıları için [HTTP API](/clawhub/http-api) bölümüne bakın.
