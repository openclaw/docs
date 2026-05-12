---
read_when:
    - ClawHub CLI veya OpenClaw kayıt deposu komutları başarısız oluyor
    - Bir paket yüklenemez, yayımlanamaz veya güncellenemez
summary: ClawHub oturum açma, yükleme, yayımlama, eşitleme, güncelleme ve API sorunlarını giderme.
x-i18n:
    generated_at: "2026-05-12T12:50:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Sorun giderme

## `clawhub login` bir tarayıcı açıyor ancak hiç tamamlanmıyor

CLI, tarayıcı oturumu açma sırasında kısa ömürlü bir yerel geri çağrı sunucusu başlatır.

- Tarayıcınızın `http://127.0.0.1:<port>/callback` adresine erişebildiğinden emin olun.
- Geri çağrı hiç ulaşmıyorsa yerel güvenlik duvarı, VPN ve proxy kurallarını kontrol edin.
- Başsız ortamlarda ClawHub web kullanıcı arayüzünde bir API token oluşturun ve şunu çalıştırın:

```bash
clawhub login --token clh_...
```

## `whoami` veya `publish`, `Unauthorized` (401) döndürüyor

- `clawhub login` ile yeniden oturum açın.
- Özel bir yapılandırma yolu kullanıyorsanız `CLAWHUB_CONFIG_PATH` değerinin
  geçerli token'ınızı içeren dosyayı gösterdiğini doğrulayın.
- Bir API token kullanıyorsanız web kullanıcı arayüzünde iptal edilmediğini doğrulayın.

## Arama veya yükleme `Rate limit exceeded` (429) döndürüyor

Yanıttaki yeniden deneme bilgilerini okuyun:

- `Retry-After`: yeniden denemeden önce beklenmesi gereken saniye.
- `RateLimit-Remaining` ve `RateLimit-Limit`: geçerli bütçeniz.
- `RateLimit-Reset` veya `X-RateLimit-Reset`: sıfırlanma zamanı.

Birçok kullanıcı tek bir çıkış IP'sini paylaşıyorsa, her kişi yalnızca birkaç
istek gönderse bile anonim IP sınırlarına takılabilir. Mümkün olduğunda oturum
açın ve bildirilen gecikmeden sonra yeniden deneyin.

## Arama veya yükleme proxy arkasında başarısız oluyor

CLI standart proxy değişkenlerini dikkate alır:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Desteklenen adlar arasında `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` ve
`http_proxy` bulunur.

## Bir skill aramada görünmüyor

- Biliyorsanız tam slug'ı veya sahip sayfasını kontrol edin.
- Sürümün herkese açık olduğunu ve tarama ya da moderasyon tarafından tutulmadığını doğrulayın.
- Skill size aitse oturum açın ve inceleyin:

```bash
clawhub inspect <skill-slug>
```

Sahip tarafından görülebilen tanı bilgileri tarama, yükleme kapısı veya moderasyon
durumunu açıklayabilir.

## Gerekli meta veriler eksik olduğu için yayımlama başarısız oluyor

Skills için `SKILL.md` frontmatter bölümünü kontrol edin. Gerekli ortam
değişkenleri ve araçlar, kullanıcıların ve tarayıcıların paketi anlayabilmesi
için bildirilmelidir.

Plugin'ler için `package.json` uyumluluk meta verilerini kontrol edin. Kod
Plugin yayımlamaları, `openclaw.compat.pluginApi` ve
`openclaw.build.openclawVersion` gibi OpenClaw uyumluluk alanlarına ihtiyaç duyar.

Önce yayımlama yükünü önizleyin:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Yayımlama bir GitHub sahibi veya kaynak hatasıyla başarısız oluyor

ClawHub, paketleri yayımlayanlarıyla ilişkilendirmek için GitHub kimliğini ve
kaynak atfını kullanır.

- Paketin sahibi olan veya paketi yayımlayabilen GitHub hesabıyla oturum açtığınızdan
  emin olun.
- Kaynak URL'nin herkese açık olduğunu veya ClawHub tarafından erişilebilir olduğunu kontrol edin.
- GitHub kaynakları için `owner/repo`, `owner/repo@ref` veya tam bir GitHub URL'si kullanın.

## `sync` hiçbir skill bulunamadığını söylüyor

`sync`, `SKILL.md` veya `skill.md` içeren klasörleri arar.

Taramak istediğiniz kökleri gösterin:

```bash
clawhub sync --root /path/to/skills
```

Ne yayımlanacağından emin değilseniz önce önizleyin:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` yerel değişiklikler nedeniyle reddediyor

Yerel dosyalar, ClawHub'ın bildiği hiçbir sürümle eşleşmiyor. Birini seçin:

- Yerel düzenlemeleri koruyun ve güncellemeyi atlayın.
- Yayımlanmış sürümle üzerine yazın:

```bash
clawhub update <slug> --force
```

- Düzenlenmiş kopyanızı yeni bir slug veya fork olarak yayımlayın.

## Bir Plugin yüklemesi OpenClaw içinde başarısız oluyor

- Açık bir ClawHub kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

- Tarama durumu ve uyumluluk meta verileri için paket ayrıntı sayfasını kontrol edin.
- OpenClaw sürümünüzün paketin duyurduğu uyumluluk aralığını karşıladığını
  doğrulayın.
- Paket gizliyse, tutuluyorsa veya engellendiyse sahibi sorunu çözene kadar
  yüklenebilir olmayabilir.

## Herkese açık API istekleri başarısız oluyor

- `429` yeniden deneme üstbilgilerine uyun ve herkese açık liste/arama yanıtlarını önbelleğe alın.
- Kullanıcıları kanonik ClawHub listesine geri yönlendirin.
- Gizli, özel, tutulan veya moderasyon tarafından engellenmiş içeriği herkese
  açık API yüzeyi dışında yansıtmayın.

Uç nokta ayrıntıları için [HTTP API](/tr/clawhub/http-api) bölümüne bakın.
