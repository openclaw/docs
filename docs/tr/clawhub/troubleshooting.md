---
read_when:
    - ClawHub CLI veya OpenClaw kayıt defteri komutları başarısız oluyor
    - Bir paket yüklenemez, yayımlanamaz veya güncellenemez
summary: ClawHub oturum açma, kurulum, yayımlama, güncelleme ve API sorunlarını giderme.
x-i18n:
    generated_at: "2026-07-01T15:30:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Sorun giderme

## `clawhub login` bir tarayıcı açıyor ama hiç tamamlanmıyor

CLI, tarayıcıyla oturum açma sırasında kısa ömürlü bir yerel geri çağrı sunucusu başlatır.

- Tarayıcınızın `http://127.0.0.1:<port>/callback` adresine erişebildiğinden emin olun.
- Geri çağrı hiç gelmiyorsa yerel güvenlik duvarı, VPN ve proxy kurallarını kontrol edin.
- Başsız ortamlarda, ClawHub web kullanıcı arayüzünde bir API token oluşturun ve şunu çalıştırın:

```bash
clawhub login --token clh_...
```

## `whoami` veya `publish`, `Unauthorized` (401) döndürüyor

- `clawhub login` ile yeniden oturum açın.
- Özel bir yapılandırma yolu kullanıyorsanız `CLAWHUB_CONFIG_PATH` değerinin geçerli token'ınızı içeren
  dosyayı gösterdiğini doğrulayın.
- API token kullanıyorsanız bunun web kullanıcı arayüzünde iptal edilmediğini doğrulayın.

## Arama veya yükleme `Rate limit exceeded` (429) döndürüyor

Yanıttaki yeniden deneme bilgilerini okuyun:

- `Retry-After`: yeniden denemeden önce beklenecek saniye.
- `RateLimit-Limit`: bu isteğe uygulanan sınır.
- `RateLimit-Remaining`: başlık mevcut olduğunda kalan kesin kotanız. `429` durumunda bu değer `0` olur.
- `RateLimit-Reset` veya `X-RateLimit-Reset`: sıfırlama zamanlaması.

Çok sayıda kullanıcı aynı çıkış IP'sini paylaşıyorsa, her kişi yalnızca birkaç
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

- Biliyorsanız tam slug'ı veya sahip sayfasını kontrol edin.
- Sürümün herkese açık olduğunu ve tarama ya da moderasyon tarafından bekletilmediğini doğrulayın.
- Becerinin sahibi sizseniz oturum açın ve inceleyin:

```bash
clawhub inspect @openclaw/demo
```

Sahibin görebildiği tanılama bilgileri tarama, yükleme kapısı veya moderasyon durumunu açıklayabilir.

## Gerekli metadata eksik olduğu için yayınlama başarısız oluyor

Beceriler için `SKILL.md` frontmatter bölümünü kontrol edin. Kullanıcıların ve
tarayıcıların paketi anlayabilmesi için gerekli ortam değişkenleri ve
araçlar bildirilmelidir.

Plugin'ler için `package.json` uyumluluk metadata'sını kontrol edin. Kod Plugin yayınları,
`openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` gibi OpenClaw
uyumluluk alanlarına ihtiyaç duyar.

Önce yayınlama payload'unu önizleyin:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Yayınlama bir GitHub sahibi veya kaynak hatasıyla başarısız oluyor

ClawHub, paketleri yayıncılarına bağlamak için GitHub kimliğini ve kaynak atfını kullanır.

- Paketin sahibi olan veya paketi yayınlayabilen GitHub hesabıyla oturum açtığınızdan emin olun.
- Kaynak URL'sinin herkese açık veya ClawHub tarafından erişilebilir olduğunu kontrol edin.
- GitHub kaynakları için `owner/repo`, `owner/repo@ref` veya tam bir GitHub URL'si kullanın.

## Bir namespace talep edilmiş veya ayrılmış olduğu için yayınlama başarısız oluyor

Bir yayınlama işlemi sahip kullanıcı adı, kuruluş namespace'i, paket scope'u, beceri
slug'ı veya paket adı zaten talep edilmiş ya da ayrılmış olduğu için başarısız olursa, önce
namespace ile eşleşen sahiple yayınlama yaptığınızı doğrulayın. Plugin paketleri için
`@example-org/example-plugin` gibi scoped adlar, eşleşen
`example-org` sahibiyle yayınlanmalıdır.

Kuruluşunuzun, projenizin veya markanızın namespace'in hak sahibi olduğuna inanıyor ancak
mevcut ClawHub sahibini yönetemiyorsanız, herkese açık ve hassas olmayan kanıtlarla bir
[Kuruluş / Namespace Talebi sorunu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
açın. Kanıt yönergeleri ve herkese açık sorunlardan nelerin uzak tutulacağı için
[Kuruluş ve Namespace Talepleri](/clawhub/namespace-claims) bölümüne bakın.

## `sync` hiçbir beceri bulunmadığını söylüyor

`sync`, `SKILL.md` veya `skill.md` içeren klasörleri arar.

Taranmasını istediğiniz köklere yönlendirin:

```bash
clawhub sync --root /path/to/skills
```

Nelerin yayınlanacağından emin değilseniz önce önizleyin:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` yerel değişiklikler nedeniyle reddediyor

Yerel dosyalar ClawHub'ın bildiği hiçbir sürümle eşleşmiyor. Birini seçin:

- Yerel düzenlemeleri koruyun ve güncellemeyi atlayın.
- Yayınlanmış sürümle üzerine yazın:

```bash
clawhub update @openclaw/demo --force
```

- Düzenlenmiş kopyanızı yeni bir slug veya fork olarak yayınlayın.

## Bir Plugin yüklemesi OpenClaw içinde başarısız oluyor

- Açık bir ClawHub kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

- Tarama durumu ve uyumluluk metadata'sı için paket ayrıntı sayfasını kontrol edin.
- OpenClaw sürümünüzün paketin ilan ettiği
  uyumluluk aralığını karşıladığını doğrulayın.
- Paket gizliyse, bekletiliyorsa veya engellendiyse, sahibi sorunu çözene kadar
  yüklenemeyebilir.

## Herkese açık API istekleri başarısız oluyor

- `429` yeniden deneme başlıklarına uyun ve herkese açık listeleme/arama yanıtlarını önbelleğe alın.
- Kullanıcıları kanonik ClawHub listelemesine geri yönlendirin.
- Gizli, özel, bekletilen veya moderasyon tarafından engellenen içeriği
  herkese açık API yüzeyi dışında yansıtmayın.

Endpoint ayrıntıları için [HTTP API](/clawhub/http-api) bölümüne bakın.
