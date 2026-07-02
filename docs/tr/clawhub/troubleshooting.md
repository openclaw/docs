---
read_when:
    - ClawHub CLI veya OpenClaw registry komutları başarısız oluyor
    - Bir paket yüklenemez, yayımlanamaz veya güncellenemez
summary: ClawHub oturum açma, yükleme, yayımlama, güncelleme ve API sorunlarını giderme.
x-i18n:
    generated_at: "2026-07-02T08:42:46Z"
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
- Başsız ortamlarda, ClawHub web arayüzünde bir API token'ı oluşturun ve şunu çalıştırın:

```bash
clawhub login --token clh_...
```

## `whoami` veya `publish`, `Unauthorized` (401) döndürüyor

- `clawhub login` ile tekrar oturum açın.
- Özel bir yapılandırma yolu kullanıyorsanız, `CLAWHUB_CONFIG_PATH` değerinin
  geçerli token'ınızı içeren dosyayı gösterdiğini doğrulayın.
- Bir API token'ı kullanıyorsanız, web arayüzünde iptal edilmediğini doğrulayın.

## Arama veya yükleme `Rate limit exceeded` (429) döndürüyor

Yanıttaki yeniden deneme bilgilerini okuyun:

- `Retry-After`: yeniden denemeden önce beklenecek saniye sayısı.
- `RateLimit-Limit`: bu isteğe uygulanan sınır.
- `RateLimit-Remaining`: başlık mevcut olduğunda tam kalan kotanız. `429` durumunda `0` olur.
- `RateLimit-Reset` veya `X-RateLimit-Reset`: sıfırlama zamanı.

Birçok kullanıcı tek bir çıkış IP'sini paylaşıyorsa, her kişi yalnızca birkaç
istek gönderse bile anonim IP sınırlarına ulaşılabilir. Mümkün olduğunda oturum
açın ve bildirilen gecikmeden sonra yeniden deneyin.

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
- Sürümün herkese açık olduğunu ve tarama ya da moderasyon nedeniyle bekletilmediğini doğrulayın.
- Becerinin sahibi sizseniz oturum açın ve inceleyin:

```bash
clawhub inspect @openclaw/demo
```

Sahibin görebileceği tanı bilgileri tarama, yükleme kapısı veya moderasyon durumunu açıklayabilir.

## Gerekli meta veriler eksik olduğu için yayınlama başarısız oluyor

Beceriler için `SKILL.md` frontmatter'ını kontrol edin. Gerekli ortam değişkenleri ve
araçlar, kullanıcıların ve tarayıcıların paketi anlayabilmesi için belirtilmelidir.

Plugin'ler için `package.json` uyumluluk meta verilerini kontrol edin. Kod Plugin'i yayınları,
`openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` gibi OpenClaw uyumluluk alanlarına ihtiyaç duyar.

Önce yayınlama yükünü önizleyin:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub sahibi veya kaynak hatası nedeniyle yayınlama başarısız oluyor

ClawHub, paketleri yayıncılarına bağlamak için GitHub kimliğini ve kaynak atfını kullanır.

- Paketin sahibi olan veya paketi yayınlayabilen GitHub hesabıyla oturum açtığınızdan emin olun.
- Kaynak URL'sinin herkese açık veya ClawHub tarafından erişilebilir olduğunu kontrol edin.
- GitHub kaynakları için `owner/repo`, `owner/repo@ref` veya tam bir GitHub URL'si kullanın.

## Bir ad alanı sahiplenildiği veya rezerve edildiği için yayınlama başarısız oluyor

Bir yayınlama; sahip kullanıcı adı, kuruluş ad alanı, paket kapsamı, beceri
slug'ı veya paket adı zaten sahiplenildiği ya da rezerve edildiği için başarısız olursa,
önce ad alanıyla eşleşen sahip olarak yayınladığınızı doğrulayın. Plugin paketleri için
`@example-org/example-plugin` gibi kapsamlı adlar, eşleşen
`example-org` sahibi olarak yayınlanmalıdır.

Kuruluşunuzun, projenizin veya markanızın ad alanının hak sahibi olduğuna inanıyor ancak
geçerli ClawHub sahibini yönetemiyorsanız, herkese açık ve hassas olmayan kanıtlarla bir
[Kuruluş / Ad Alanı Talebi issue'su](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
açın. Kanıt yönergeleri ve herkese açık issue'larda nelerin tutulmaması gerektiği için
[Kuruluş ve Ad Alanı Talepleri](/clawhub/namespace-claims) bölümüne bakın.

## `sync` hiçbir beceri bulunmadığını söylüyor

`sync`, `SKILL.md` veya `skill.md` içeren klasörleri arar.

Taramak istediğiniz köklere yönlendirin:

```bash
clawhub sync --root /path/to/skills
```

Neyin yayınlanacağından emin değilseniz önce önizleyin:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` yerel değişiklikler nedeniyle reddediyor

Yerel dosyalar, ClawHub'ın bildiği hiçbir sürümle eşleşmiyor. Birini seçin:

- Yerel düzenlemeleri tutun ve güncellemeyi atlayın.
- Yayınlanmış sürümle üzerine yazın:

```bash
clawhub update @openclaw/demo --force
```

- Düzenlediğiniz kopyayı yeni bir slug veya fork olarak yayınlayın.

## Bir Plugin yüklemesi OpenClaw'da başarısız oluyor

- Açık bir ClawHub kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

- Tarama durumu ve uyumluluk meta verileri için paket ayrıntı sayfasını kontrol edin.
- OpenClaw sürümünüzün paketin duyurduğu
  uyumluluk aralığını karşıladığını doğrulayın.
- Paket gizliyse, bekletiliyorsa veya engellendiyse, sahibi sorunu çözene kadar
  yüklenebilir olmayabilir.

## Genel API istekleri başarısız oluyor

- `429` yeniden deneme başlıklarına uyun ve genel liste/arama yanıtlarını önbelleğe alın.
- Kullanıcıları kanonik ClawHub listesine geri bağlayın.
- Gizli, özel, bekletilen veya moderasyon tarafından engellenen içeriği
  genel API yüzeyi dışında yansıtmayın.

Uç nokta ayrıntıları için [HTTP API](/clawhub/http-api) bölümüne bakın.
