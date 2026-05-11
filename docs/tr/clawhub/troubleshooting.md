---
read_when:
    - ClawHub CLI veya OpenClaw kayıt deposu komutları başarısız oluyor
    - Bir paket kurulamaz, yayımlanamaz veya güncellenemez
summary: ClawHub oturum açma, kurulum, yayımlama, eşitleme, güncelleme ve API sorunlarını giderme.
x-i18n:
    generated_at: "2026-05-11T22:20:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e23936085ebc5422d71df8a9feffbbe56ce562de8d203462d712cc58f88a0ed
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Sorun giderme

## `clawhub login` bir tarayıcı açıyor ancak hiç tamamlanmıyor

CLI, tarayıcıyla oturum açma sırasında kısa ömürlü bir yerel geri çağrı sunucusu başlatır.

- Tarayıcınızın `http://127.0.0.1:<port>/callback` adresine erişebildiğinden emin olun.
- Geri çağrı hiç gelmiyorsa yerel güvenlik duvarı, VPN ve proxy kurallarını kontrol edin.
- Başsız ortamlarda, ClawHub web kullanıcı arayüzünde bir API token'ı oluşturun ve şunu çalıştırın:

```bash
clawhub login --token clh_...
```

## `whoami` veya `publish`, `Unauthorized` (401) döndürüyor

- `clawhub login` ile yeniden oturum açın.
- Özel bir yapılandırma yolu kullanıyorsanız, `CLAWHUB_CONFIG_PATH` değerinin
  geçerli token'ınızı içeren dosyaya işaret ettiğini doğrulayın.
- Bir API token'ı kullanıyorsanız, bunun web kullanıcı arayüzünde iptal edilmediğini doğrulayın.

## Arama veya kurulum `Rate limit exceeded` (429) döndürüyor

Yanıttaki yeniden deneme bilgilerini okuyun:

- `Retry-After`: yeniden denemeden önce beklenecek saniye sayısı.
- `RateLimit-Remaining` ve `RateLimit-Limit`: geçerli bütçeniz.
- `RateLimit-Reset` veya `X-RateLimit-Reset`: sıfırlama zamanı.

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

## Bir skill aramada görünmüyor

- Biliyorsanız tam slug'ı veya sahip sayfasını kontrol edin.
- Sürümün herkese açık olduğunu ve tarama ya da moderasyon nedeniyle bekletilmediğini doğrulayın.
- Skill size aitse oturum açın ve inceleyin:

```bash
clawhub inspect <skill-slug>
```

Sahibin görebildiği tanılama bilgileri tarama, yükleme kapısı veya moderasyon durumunu açıklayabilir.

## Gerekli metadata eksik olduğu için yayımlama başarısız oluyor

Skills için `SKILL.md` frontmatter bölümünü kontrol edin. Gerekli ortam değişkenleri ve
araçlar, kullanıcıların ve tarayıcıların paketi anlayabilmesi için belirtilmelidir.

Plugin paketleri için `package.json` uyumluluk metadata'sını kontrol edin. Code-plugin yayımları,
`openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` gibi OpenClaw uyumluluk
alanlarına ihtiyaç duyar.

Önce yayımlama yükünü önizleyin:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Bir GitHub sahibi veya kaynak hatası nedeniyle yayımlama başarısız oluyor

ClawHub, paketleri yayımlayanlarla ilişkilendirmek için GitHub kimliği ve kaynak atfı kullanır.

- Paketin sahibi olan veya paketi yayımlayabilen GitHub hesabıyla oturum açtığınızdan emin olun.
- Kaynak URL'sinin herkese açık olduğunu veya ClawHub tarafından erişilebilir olduğunu kontrol edin.
- GitHub kaynakları için `owner/repo`, `owner/repo@ref` veya tam bir GitHub URL'si kullanın.

## `sync` hiçbir skill bulunmadığını söylüyor

`sync`, `SKILL.md` veya `skill.md` içeren klasörleri arar.

Taramak istediğiniz köklere yönlendirin:

```bash
clawhub sync --root /path/to/skills
```

Neyin yayımlanacağından emin değilseniz önce önizleyin:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` yerel değişiklikler nedeniyle reddediyor

Yerel dosyalar, ClawHub'ın bildiği herhangi bir sürümle eşleşmiyor. Birini seçin:

- Yerel düzenlemeleri koruyun ve güncellemeyi atlayın.
- Yayımlanmış sürümle üzerine yazın:

```bash
clawhub update <slug> --force
```

- Düzenlenmiş kopyanızı yeni bir slug veya fork olarak yayımlayın.

## OpenClaw'da bir Plugin kurulumu başarısız oluyor

- Açık bir ClawHub kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

- Tarama durumu ve uyumluluk metadata'sı için paket ayrıntı sayfasını kontrol edin.
- OpenClaw sürümünüzün paketin duyurduğu uyumluluk aralığını karşıladığını doğrulayın.
- Paket gizliyse, bekletiliyorsa veya engellendiyse, sahip sorunu çözene kadar
  kurulamayabilir.

## Genel API istekleri başarısız oluyor

- `429` yeniden deneme üst bilgilerine uyun ve genel liste/arama yanıtlarını önbelleğe alın.
- Kullanıcıları kanonik ClawHub listesine geri bağlayın.
- Gizli, özel, bekletilen veya moderasyon tarafından engellenen içeriği genel API yüzeyi dışında yansıtmayın.

Uç nokta ayrıntıları için [HTTP API](/tr/clawhub/http-api) bölümüne bakın.
