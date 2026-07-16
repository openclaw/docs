---
read_when:
    - ClawHub CLI veya OpenClaw kayıt defteri komutları başarısız oluyor
    - Bir paket yüklenemiyor, yayımlanamıyor veya güncellenemiyor
summary: ClawHub oturum açma, yükleme, yayımlama, güncelleme ve API sorunlarını giderme.
x-i18n:
    generated_at: "2026-07-16T16:45:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Sorun Giderme

## `clawhub login` bir tarayıcı açıyor ancak hiçbir zaman tamamlanmıyor

CLI, tarayıcıyla oturum açma sırasında kısa ömürlü bir yerel geri çağırma sunucusu başlatır.

- Tarayıcınızın `http://127.0.0.1:<port>/callback` adresine erişebildiğinden emin olun.
- Geri çağırma hiçbir zaman ulaşmazsa yerel güvenlik duvarı, VPN ve proxy kurallarını kontrol edin.
- Grafik arabirimi olmayan ortamlarda ClawHub web kullanıcı arabiriminde bir API belirteci oluşturun ve şunu çalıştırın:

```bash
clawhub login --token clh_...
```

## `whoami` veya `publish`, `Unauthorized` (401) döndürüyor

- `clawhub login` ile yeniden oturum açın.
- Özel bir yapılandırma yolu kullanıyorsanız `CLAWHUB_CONFIG_PATH` değerinin, geçerli
  belirtecinizi içeren dosyayı gösterdiğini doğrulayın.
- Bir API belirteci kullanıyorsanız web kullanıcı arabiriminde iptal edilmediğini doğrulayın.

## Arama veya yükleme, `Rate limit exceeded` (429) döndürüyor

Yanıttaki yeniden deneme bilgilerini okuyun:

- `Retry-After`: yeniden denemeden önce beklenecek saniye sayısı.
- `RateLimit-Limit`: bu isteğe uygulanan sınır.
- `RateLimit-Remaining`: üst bilgi mevcut olduğunda kalan bütçenizin tam değeri. `429` durumunda bu değer `0` olur.
- `RateLimit-Reset` veya `X-RateLimit-Reset`: sıfırlama zamanlaması.

Birçok kullanıcı tek bir çıkış IP'sini paylaşıyorsa her kişi yalnızca birkaç
istek gönderse bile anonim IP sınırlarına ulaşılabilir. Mümkün olduğunda oturum
açın ve bildirilen gecikmeden sonra yeniden deneyin.

## Arama veya yükleme, proxy arkasında başarısız oluyor

CLI, standart proxy değişkenlerini dikkate alır:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Desteklenen adlar arasında `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` ve
`http_proxy` bulunur.

## Bir beceri aramada görünmüyor

- Biliyorsanız tam kısa adı veya sahip sayfasını kontrol edin.
- Sürümün herkese açık olduğunu ve tarama ya da moderasyon nedeniyle bekletilmediğini doğrulayın.
- Becerinin sahibiyseniz oturum açın ve beceriyi inceleyin:

```bash
clawhub inspect @openclaw/demo
```

Sahibin görebildiği tanılama bilgileri; tarama, yükleme geçidi veya moderasyon durumunu açıklayabilir.

## Gerekli meta veriler eksik olduğu için yayımlama başarısız oluyor

Beceriler için `SKILL.md` ön bilgisini kontrol edin. Kullanıcıların ve
tarayıcıların paketi anlayabilmesi için gerekli ortam değişkenleri ve araçlar bildirilmelidir.

Pluginler için `package.json` uyumluluk meta verilerini kontrol edin. Kod plugini yayımlamalarında
`openclaw.compat.pluginApi` ve `openclaw.build.openclawVersion` gibi OpenClaw uyumluluk alanları
gereklidir.

Önce yayımlama yükünü önizleyin:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## GitHub sahibi veya kaynak hatası nedeniyle yayımlama başarısız oluyor

ClawHub, paketleri yayımcılarıyla ilişkilendirmek için GitHub kimliğini ve kaynak
atıf bilgisini kullanır.

- Paketin sahibi olan veya paketi yayımlayabilen GitHub hesabıyla oturum
  açtığınızdan emin olun.
- Kaynak URL'sinin herkese açık veya ClawHub tarafından erişilebilir olduğunu kontrol edin.
- GitHub kaynakları için `owner/repo`, `owner/repo@ref` veya tam bir GitHub URL'si kullanın.

## Bir ad alanı sahiplenilmiş veya ayrılmış olduğu için yayımlama başarısız oluyor

Sahip tanıtıcısı, kuruluş ad alanı, paket kapsamı, beceri kısa adı veya paket adı
zaten sahiplenildiği ya da ayrıldığı için yayımlama başarısız olursa önce ad
alanıyla eşleşen sahip üzerinden yayımlama yaptığınızı doğrulayın. Plugin paketleri için
`@example-org/example-plugin` gibi kapsamlı adlar, eşleşen
`example-org` sahibi olarak yayımlanmalıdır.

Kuruluşunuzun, projenizin veya markanızın ad alanının hak sahibi olduğuna inanıyor
ancak mevcut ClawHub sahibini yönetemiyorsanız herkese açık, hassas olmayan kanıtlarla bir
[Kuruluş / Ad Alanı Talebi sorunu](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
açın. Kanıtlarla ilgili rehberlik ve herkese açık sorunlara nelerin
eklenmemesi gerektiği için
[Kuruluş ve Ad Alanı Talepleri](/clawhub/namespace-claims) sayfasına bakın.

## `sync` hiçbir beceri bulunamadığını söylüyor

`sync`, `SKILL.md` veya `skill.md` içeren klasörleri arar.

Taramak istediğiniz kök dizinleri belirtin:

```bash
clawhub sync --root /path/to/skills
```

Nelerin yayımlanacağından emin değilseniz önce önizleyin:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` yerel değişiklikler nedeniyle işlemi reddediyor

Yerel dosyalar, ClawHub'ın bildiği hiçbir sürümle eşleşmiyor. Birini seçin:

- Yerel düzenlemeleri koruyun ve güncellemeyi atlayın.
- Yayımlanan sürümle üzerine yazın:

```bash
clawhub update @openclaw/demo --force
```

- Düzenlediğiniz kopyayı yeni bir kısa ad veya çatallanmış sürüm olarak yayımlayın.

## OpenClaw'da bir Plugin yüklemesi başarısız oluyor

- Açık bir ClawHub kaynağı kullanın:

```bash
openclaw plugins install clawhub:<package>
```

- Tarama durumu ve uyumluluk meta verileri için paket ayrıntıları sayfasını kontrol edin.
- OpenClaw sürümünüzün paketin bildirdiği
  uyumluluk aralığını karşıladığını doğrulayın.
- Paket gizlenmiş, bekletilmiş veya engellenmişse sahibi sorunu çözene
  kadar yüklenemeyebilir.

## Herkese açık API istekleri başarısız oluyor

- `429` yeniden deneme üst bilgilerine uyun ve herkese açık liste/arama yanıtlarını önbelleğe alın.
- Kullanıcıları standart ClawHub listelemesine yönlendirin.
- Gizli, özel, bekletilmiş veya moderasyon nedeniyle engellenmiş içeriği herkese
  açık API yüzeyinin dışında yansıtmayın.

Uç nokta ayrıntıları için [HTTP API](/clawhub/http-api) sayfasına bakın.
