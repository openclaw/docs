---
read_when:
    - ClawHub CLI veya OpenClaw kayıt deposu komutları başarısız oluyor
    - Bir paket yüklenemez, yayımlanamaz veya güncellenemez
summary: ClawHub oturum açma, yükleme, yayımlama, eşitleme, güncelleme ve API sorunlarını giderme.
x-i18n:
    generated_at: "2026-05-11T20:25:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Sorun giderme

## `clawhub login` bir tarayıcı açıyor ancak hiç tamamlanmıyor

CLI, tarayıcıyla giriş sırasında kısa ömürlü bir yerel geri çağırma sunucusu başlatır.

- Tarayıcınızın `http://127.0.0.1:<port>/callback` adresine erişebildiğinden emin olun.
- Geri çağırma hiç gelmiyorsa yerel güvenlik duvarı, VPN ve proxy kurallarını kontrol edin.
- Başsız ortamlarda ClawHub web kullanıcı arayüzünde bir API belirteci oluşturun ve şunu çalıştırın:

```bash
clawhub login --token clh_...
```

## `whoami` veya `publish`, `Unauthorized` (401) döndürür

- `clawhub login` ile yeniden oturum açın.
- Özel bir yapılandırma yolu kullanıyorsanız `CLAWHUB_CONFIG_PATH` öğesinin
  geçerli belirtecinizi içeren dosyayı gösterdiğini doğrulayın.
- API belirteci kullanıyorsanız web kullanıcı arayüzünde iptal edilmediğini doğrulayın.

## Arama veya kurulum `Rate limit exceeded` (429) döndürür

Yanıttaki yeniden deneme bilgilerini okuyun:

- `Retry-After`: yeniden denemeden önce beklenecek saniye.
- `RateLimit-Remaining` ve `RateLimit-Limit`: geçerli kotanız.
- `RateLimit-Reset` veya `X-RateLimit-Reset`: sıfırlama zamanlaması.

Birçok kullanıcı tek bir çıkış IP'sini paylaşıyorsa, her kişi yalnızca birkaç
istek gönderse bile anonim IP limitlerine ulaşılabilir. Mümkün olduğunda oturum
açın ve bildirilen gecikmeden sonra yeniden deneyin.

## Arama veya kurulum proxy arkasında başarısız oluyor

CLI standart proxy değişkenlerine uyar:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Desteklenen adlar arasında `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` ve
`http_proxy` bulunur.

## Bir skill aramada görünmüyor

- Biliyorsanız tam slug'ı veya sahip sayfasını kontrol edin.
- Sürümün herkese açık olduğunu ve tarama ya da moderasyon nedeniyle bekletilmediğini doğrulayın.
- Skill size aitse oturum açın ve inceleyin:

```bash
clawhub inspect <skill-slug>
```

Sahibin görebildiği tanılama bilgileri tarama, yükleme kapısı veya moderasyon durumunu açıklayabilir.

## Gerekli meta veriler eksik olduğu için yayımlama başarısız oluyor

Skills için `SKILL.md` frontmatter'ını kontrol edin. Gerekli ortam değişkenleri ve
araçlar, kullanıcıların ve tarayıcıların paketi anlayabilmesi için bildirilmelidir.

Plugin'ler için `package.json` uyumluluk meta verilerini kontrol edin. Kod Plugin'i yayımlamaları,
`openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` gibi OpenClaw uyumluluk alanlarına
ihtiyaç duyar.

Önce yayımlama yükünü önizleyin:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Yayımlama GitHub sahibi veya kaynak hatasıyla başarısız oluyor

ClawHub, paketleri yayımlayanlarıyla ilişkilendirmek için GitHub kimliğini ve kaynak atfını kullanır.

- Paketin sahibi olan veya paketi yayımlayabilen GitHub hesabıyla oturum açtığınızdan emin olun.
- Kaynak URL'sinin herkese açık veya ClawHub tarafından erişilebilir olduğunu kontrol edin.
- GitHub kaynakları için `owner/repo`, `owner/repo@ref` veya tam GitHub URL'si kullanın.

## `sync` hiç Skills bulunmadığını söylüyor

`sync`, `SKILL.md` veya `skill.md` içeren klasörleri arar.

Taramak istediğiniz kökleri belirtin:

```bash
clawhub sync --root /path/to/skills
```

Nelerin yayımlanacağından emin değilseniz önce önizleyin:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` yerel değişiklikler nedeniyle reddediyor

Yerel dosyalar ClawHub'ın bildiği herhangi bir sürümle eşleşmiyor. Birini seçin:

- Yerel düzenlemeleri koruyun ve güncellemeyi atlayın.
- Yayımlanan sürümle üzerine yazın:

```bash
clawhub update <slug> --force
```

- Düzenlenmiş kopyanızı yeni bir slug veya fork olarak yayımlayın.

## OpenClaw'da Plugin kurulumu başarısız oluyor

- Açık bir ClawHub kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

- Tarama durumu ve uyumluluk meta verileri için paket ayrıntı sayfasını kontrol edin.
- OpenClaw sürümünüzün paketin duyurduğu uyumluluk aralığını karşıladığını doğrulayın.
- Paket gizliyse, bekletiliyorsa veya engellenmişse sahibi sorunu çözene kadar kurulamayabilir.

## Genel API istekleri başarısız oluyor

- `429` yeniden deneme üst bilgilerine uyun ve herkese açık liste/arama yanıtlarını önbelleğe alın.
- Kullanıcıları kanonik ClawHub kaydına geri bağlayın.
- Gizli, özel, bekletilen veya moderasyon tarafından engellenen içerikleri herkese açık API yüzeyi dışında yansıtmayın.

Uç nokta ayrıntıları için [HTTP API](/tr/clawhub/http-api) bölümüne bakın.
