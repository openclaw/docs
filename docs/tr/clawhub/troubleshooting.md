---
read_when:
    - ClawHub CLI veya OpenClaw registry komutları başarısız oluyor
    - Bir paket yüklenemez, yayımlanamaz veya güncellenemez
summary: ClawHub oturum açma, yükleme, yayımlama, güncelleme ve API sorunlarını giderme.
x-i18n:
    generated_at: "2026-07-04T06:47:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Sorun Giderme

## `clawhub login` bir tarayıcı açıyor ancak hiç tamamlanmıyor

CLI, tarayıcı oturumu açma sırasında kısa ömürlü bir yerel callback sunucusu başlatır.

- Tarayıcınızın `http://127.0.0.1:<port>/callback` adresine erişebildiğinden emin olun.
- Callback hiç gelmiyorsa yerel güvenlik duvarı, VPN ve proxy kurallarını kontrol edin.
- Headless ortamlarda ClawHub web UI içinde bir API token oluşturun ve şunu çalıştırın:

```bash
clawhub login --token clh_...
```

## `whoami` veya `publish`, `Unauthorized` (401) döndürüyor

- `clawhub login` ile tekrar oturum açın.
- Özel bir config yolu kullanıyorsanız `CLAWHUB_CONFIG_PATH` değerinin mevcut token'ınızı içeren
  dosyayı gösterdiğini doğrulayın.
- Bir API token kullanıyorsanız bunun web UI içinde iptal edilmediğini doğrulayın.

## Arama veya kurulum `Rate limit exceeded` (429) döndürüyor

Yanıttaki yeniden deneme bilgilerini okuyun:

- `Retry-After`: yeniden denemeden önce beklenecek saniye sayısı.
- `RateLimit-Limit`: bu isteğe uygulanan limit.
- `RateLimit-Remaining`: header mevcut olduğunda tam kalan kotanız. `429` durumunda bu değer `0` olur.
- `RateLimit-Reset` veya `X-RateLimit-Reset`: sıfırlama zamanlaması.

Birçok kullanıcı tek bir çıkış IP'sini paylaşıyorsa, her kişi yalnızca birkaç
istek gönderse bile anonim IP limitlerine ulaşılabilir. Mümkün olduğunda oturum
açın ve bildirilen gecikmeden sonra yeniden deneyin.

## Arama veya kurulum bir proxy arkasında başarısız oluyor

CLI standart proxy değişkenlerine uyar:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Desteklenen adlar arasında `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` ve
`http_proxy` bulunur.

## Bir skill aramada görünmüyor

- Biliyorsanız tam slug veya sahip sayfasını kontrol edin.
- Yayının herkese açık olduğunu ve tarama ya da moderasyon nedeniyle bekletilmediğini doğrulayın.
- Skill size aitse oturum açın ve inceleyin:

```bash
clawhub inspect @openclaw/demo
```

Sahip tarafından görülebilen tanılamalar tarama, yükleme kapısı veya moderasyon durumunu açıklayabilir.

## Gerekli metadata eksik olduğu için yayınlama başarısız oluyor

Skills için `SKILL.md` frontmatter bölümünü kontrol edin. Gerekli ortam değişkenleri ve
araçlar, kullanıcıların ve tarayıcıların paketi anlayabilmesi için bildirilmelidir.

Plugin'ler için `package.json` uyumluluk metadata'sını kontrol edin. Kod Plugin'i yayınları
`openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` gibi OpenClaw uyumluluk alanlarına
ihtiyaç duyar.

Önce yayın payload'unu önizleyin:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Yayınlama GitHub sahibi veya kaynak hatasıyla başarısız oluyor

ClawHub, paketleri yayıncılarına bağlamak için GitHub kimliği ve kaynak atfı kullanır.

- Paketin sahibi olan veya paketi yayınlayabilen GitHub hesabıyla oturum açtığınızdan emin olun.
- Kaynak URL'nin herkese açık veya ClawHub tarafından erişilebilir olduğunu kontrol edin.
- GitHub kaynakları için `owner/repo`, `owner/repo@ref` veya tam bir GitHub URL'si kullanın.

## Bir namespace talep edilmiş veya ayrılmış olduğu için yayınlama başarısız oluyor

Yayınlama; sahip kullanıcı adı, kuruluş namespace'i, paket scope'u, skill
slug'ı veya paket adı zaten talep edilmiş ya da ayrılmış olduğu için başarısız olursa, önce
namespace ile eşleşen sahip üzerinden yayınladığınızı doğrulayın. Plugin paketleri için
`@example-org/example-plugin` gibi scoped adlar, eşleşen `example-org` sahibi olarak
yayınlanmalıdır.

Kuruluşunuzun, projenizin veya markanızın hak sahibi namespace sahibi olduğuna inanıyor ancak
mevcut ClawHub sahibini yönetemiyorsanız herkese açık, hassas olmayan kanıtlarla bir
[Kuruluş / Namespace Talebi sorunu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
açın. Kanıt rehberliği ve herkese açık sorunların dışında tutulması gerekenler için
[Kuruluş ve Namespace Talepleri](/clawhub/namespace-claims) bölümüne bakın.

## `sync` skill bulunamadığını söylüyor

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

- Yerel düzenlemeleri tutun ve güncellemeyi atlayın.
- Yayınlanan sürümle üzerine yazın:

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
- OpenClaw sürümünüzün paketin duyurduğu
  uyumluluk aralığını karşıladığını doğrulayın.
- Paket gizli, bekletiliyor veya engellenmişse, sahibi sorunu çözene kadar
  kurulabilir olmayabilir.

## Herkese açık API istekleri başarısız oluyor

- `429` yeniden deneme header'larına uyun ve herkese açık liste/arama yanıtlarını cache'leyin.
- Kullanıcıları kanonik ClawHub listelemesine geri yönlendirin.
- Gizli, özel, bekletilen veya moderasyon tarafından engellenmiş içeriği
  herkese açık API yüzeyi dışında mirror'lamayın.

Endpoint ayrıntıları için [HTTP API](/clawhub/http-api) bölümüne bakın.
