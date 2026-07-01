---
read_when:
    - ClawHub CLI veya OpenClaw kayıt komutları başarısız oluyor
    - Bir paket yüklenemiyor, yayımlanamıyor veya güncellenemiyor
summary: ClawHub oturum açma, kurulum, yayımlama, güncelleme ve API sorunlarını giderme.
x-i18n:
    generated_at: "2026-07-01T20:33:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Sorun Giderme

## `clawhub login` bir tarayıcı açıyor ancak hiç tamamlanmıyor

CLI, tarayıcıyla oturum açma sırasında kısa ömürlü bir yerel geri çağrı sunucusu başlatır.

- Tarayıcınızın `http://127.0.0.1:<port>/callback` adresine ulaşabildiğinden emin olun.
- Geri çağrı hiç gelmiyorsa yerel güvenlik duvarı, VPN ve proxy kurallarını kontrol edin.
- Başsız ortamlarda, ClawHub web kullanıcı arayüzünde bir API token oluşturun ve şunu çalıştırın:

```bash
clawhub login --token clh_...
```

## `whoami` veya `publish`, `Unauthorized` (401) döndürüyor

- `clawhub login` ile yeniden oturum açın.
- Özel bir yapılandırma yolu kullanıyorsanız, `CLAWHUB_CONFIG_PATH` değerinin
  mevcut token'ınızı içeren dosyaya işaret ettiğini doğrulayın.
- API token kullanıyorsanız, web kullanıcı arayüzünde iptal edilmediğini doğrulayın.

## Arama veya kurulum `Rate limit exceeded` (429) döndürüyor

Yanıttaki yeniden deneme bilgilerini okuyun:

- `Retry-After`: yeniden denemeden önce beklenecek saniye sayısı.
- `RateLimit-Limit`: bu isteğe uygulanan sınır.
- `RateLimit-Remaining`: başlık mevcut olduğunda kalan tam bütçeniz. `429` durumunda `0` olur.
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

## Bir Skill aramada görünmüyor

- Biliyorsanız tam slug'ı veya sahip sayfasını kontrol edin.
- Sürümün herkese açık olduğunu ve tarama ya da moderasyon nedeniyle bekletilmediğini doğrulayın.
- Skill size aitse oturum açın ve inceleyin:

```bash
clawhub inspect @openclaw/demo
```

Sahibin görebildiği tanılama bilgileri tarama, yükleme kapısı veya moderasyon durumunu açıklayabilir.

## Gerekli meta veriler eksik olduğu için yayınlama başarısız oluyor

Skills için `SKILL.md` frontmatter'ını kontrol edin. Gerekli ortam değişkenleri ve
araçlar, kullanıcıların ve tarayıcıların paketi anlayabilmesi için bildirilmelidir.

Plugin'ler için `package.json` uyumluluk meta verilerini kontrol edin. Kod Plugin'i yayınlamaları,
`openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` gibi OpenClaw
uyumluluk alanlarına ihtiyaç duyar.

Önce yayınlama yükünü önizleyin:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Yayınlama bir GitHub sahibi veya kaynak hatasıyla başarısız oluyor

ClawHub, paketleri yayıncılarıyla ilişkilendirmek için GitHub kimliğini ve kaynak atfını kullanır.

- Paketin sahibi olan veya paketi yayınlayabilen GitHub hesabıyla oturum açtığınızdan emin olun.
- Kaynak URL'sinin herkese açık ya da ClawHub tarafından erişilebilir olduğunu kontrol edin.
- GitHub kaynakları için `owner/repo`, `owner/repo@ref` veya tam bir GitHub URL'si kullanın.

## Bir namespace talep edilmiş veya ayrılmış olduğu için yayınlama başarısız oluyor

Bir yayınlama işlemi; sahip handle'ı, kuruluş namespace'i, paket kapsamı, Skill
slug'ı veya paket adı zaten talep edilmiş ya da ayrılmış olduğu için başarısız
olursa, önce namespace ile eşleşen sahip üzerinden yayınladığınızı doğrulayın.
Plugin paketleri için `@example-org/example-plugin` gibi kapsamlı adlar,
eşleşen `example-org` sahibi olarak yayınlanmalıdır.

Kuruluşunuzun, projenizin veya markanızın namespace'in hak sahibi olduğuna
inanıyor ancak mevcut ClawHub sahibini yönetemiyorsanız, herkese açık ve hassas
olmayan kanıtlarla bir
[Kuruluş / Namespace Talebi sorunu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
açın. Kanıt rehberliği ve herkese açık sorunların dışında tutulması gerekenler için
[Kuruluş ve Namespace Talepleri](/clawhub/namespace-claims) bölümüne bakın.

## `sync` hiçbir Skills bulunmadığını söylüyor

`sync`, `SKILL.md` veya `skill.md` içeren klasörleri arar.

Taramak istediğiniz köklere yönlendirin:

```bash
clawhub sync --root /path/to/skills
```

Ne yayınlanacağından emin değilseniz önce önizleyin:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` yerel değişiklikler nedeniyle reddediyor

Yerel dosyalar, ClawHub'ın bildiği hiçbir sürümle eşleşmiyor. Birini seçin:

- Yerel düzenlemeleri koruyun ve güncellemeyi atlayın.
- Yayınlanmış sürümle üzerine yazın:

```bash
clawhub update @openclaw/demo --force
```

- Düzenlenmiş kopyanızı yeni bir slug veya fork olarak yayınlayın.

## OpenClaw'da bir Plugin kurulumu başarısız oluyor

- Açık bir ClawHub kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

- Tarama durumu ve uyumluluk meta verileri için paket ayrıntı sayfasını kontrol edin.
- OpenClaw sürümünüzün paketin ilan ettiği uyumluluk aralığını karşıladığını doğrulayın.
- Paket gizliyse, bekletiliyorsa veya engellenmişse, sahibi sorunu çözene kadar kurulamayabilir.

## Herkese açık API istekleri başarısız oluyor

- `429` yeniden deneme başlıklarına uyun ve herkese açık listeleme/arama yanıtlarını önbelleğe alın.
- Kullanıcıları kanonik ClawHub listelemesine geri bağlayın.
- Gizli, özel, bekletilen veya moderasyon tarafından engellenen içerikleri
  herkese açık API yüzeyi dışında yansıtmayın.

Uç nokta ayrıntıları için [HTTP API](/clawhub/http-api) bölümüne bakın.
