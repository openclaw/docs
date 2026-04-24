---
read_when:
    - Kimlik doğrulama profili döndürme, bekleme süreleri veya model geri düşme davranışını teşhis etme
    - Kimlik doğrulama profilleri veya modeller için devretme kurallarını güncelleme
    - Oturum model geçersiz kılmalarının geri düşme yeniden denemeleriyle nasıl etkileştiğini anlama
summary: OpenClaw'ın kimlik doğrulama profillerini nasıl döndürdüğü ve modeller arasında nasıl geri düştüğü
title: Model devretme
x-i18n:
    generated_at: "2026-04-24T09:05:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8921c9edd4699d8c623229cd3c82a92768d720fa9711862c270d6edb665841af
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw başarısızlıkları iki aşamada ele alır:

1. Geçerli sağlayıcı içinde **kimlik doğrulama profili döndürme**.
2. `agents.defaults.model.fallbacks` içindeki bir sonraki modele **model geri düşme**.

Bu belge çalışma zamanı kurallarını ve bunları destekleyen verileri açıklar.

## Çalışma zamanı akışı

Normal bir metin çalıştırmasında OpenClaw adayları şu sırayla değerlendirir:

1. O anda seçili oturum modeli.
2. Sırayla yapılandırılmış `agents.defaults.model.fallbacks`.
3. Çalıştırma bir geçersiz kılmayla başladıysa sonda yapılandırılmış birincil model.

Her adayın içinde OpenClaw, bir sonraki model adayına geçmeden önce
kimlik doğrulama profili devretmesini dener.

Yüksek düzeyli sıra:

1. Etkin oturum modelini ve kimlik doğrulama profili tercihini çözümle.
2. Model aday zincirini oluştur.
3. Geçerli sağlayıcıyı kimlik doğrulama profili döndürme/bekleme süresi kurallarıyla dene.
4. Bu sağlayıcı devretmeye değer bir hatayla tüketilirse bir sonraki
   model adayına geç.
5. Çalıştırma başlamadan önce seçilen geri düşme geçersiz kılmasını kalıcılaştır; böylece diğer
   oturum okuyucuları da çalıştırıcının kullanmak üzere olduğu aynı sağlayıcıyı/modeli görür.
6. Geri düşme adayı başarısız olursa yalnızca geri düşmeye ait oturum
   geçersiz kılma alanlarını, hâlâ o başarısız adayla eşleşiyorlarsa geri al.
7. Her aday başarısız olursa, deneme başına ayrıntı içeren ve
   biliniyorsa en yakın bekleme süresi bitişini gösteren bir `FallbackSummaryError` fırlat.

Bu kasıtlı olarak "tüm oturumu kaydet ve geri yükle" yaklaşımından daha dardır. Yanıt
çalıştırıcısı, geri düşme için yalnızca sahip olduğu model seçimi alanlarını kalıcılaştırır:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Bu, başarısız bir geri düşme yeniden denemesinin, çalıştırma sürerken olan
elle `/model` değişiklikleri veya oturum döndürme güncellemeleri gibi daha yeni, ilgisiz oturum
değişikliklerinin üzerine yazmasını önler.

## Kimlik doğrulama depolaması (anahtarlar + OAuth)

OpenClaw, hem API anahtarları hem de OAuth belirteçleri için **kimlik doğrulama profilleri** kullanır.

- Gizli bilgiler `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde bulunur (eski: `~/.openclaw/agent/auth-profiles.json`).
- Çalışma zamanı kimlik doğrulama yönlendirme durumu `~/.openclaw/agents/<agentId>/agent/auth-state.json` içinde bulunur.
- Yapılandırmadaki `auth.profiles` / `auth.order` yalnızca **meta veri + yönlendirme** içindir (gizli bilgi içermez).
- Eski yalnızca içe aktarma amaçlı OAuth dosyası: `~/.openclaw/credentials/oauth.json` (ilk kullanımda `auth-profiles.json` içine içe aktarılır).

Daha fazla ayrıntı: [/concepts/oauth](/tr/concepts/oauth)

Kimlik bilgisi türleri:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ bazı sağlayıcılar için `projectId`/`enterpriseUrl`)

## Profil kimlikleri

OAuth oturum açmaları, birden fazla hesabın birlikte bulunabilmesi için ayrı profiller oluşturur.

- Varsayılan: e-posta mevcut değilse `provider:default`.
- E-postalı OAuth: `provider:<email>` (örneğin `google-antigravity:user@gmail.com`).

Profiller, `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde `profiles` altında bulunur.

## Döndürme sırası

Bir sağlayıcının birden fazla profili olduğunda OpenClaw sırayı şöyle seçer:

1. **Açık yapılandırma**: `auth.order[provider]` (ayarlanmışsa).
2. **Yapılandırılmış profiller**: sağlayıcıya göre filtrelenmiş `auth.profiles`.
3. **Depolanmış profiller**: sağlayıcı için `auth-profiles.json` içindeki girdiler.

Açık bir sıra yapılandırılmamışsa OpenClaw bir round-robin sırası kullanır:

- **Birincil anahtar:** profil türü (**OAuth, API anahtarlarından önce**).
- **İkincil anahtar:** `usageStats.lastUsed` (her tür içinde en eski önce).
- **Bekleme süresindeki/devre dışı profiller** sona taşınır, en yakın bitişe göre sıralanır.

### Oturum yapışkanlığı (önbellek dostu)

OpenClaw, sağlayıcı önbelleklerini sıcak tutmak için **seçilen kimlik doğrulama profilini oturum başına sabitler**.
Her istekte döndürme yapmaz. Sabitlenmiş profil şu durumlara kadar yeniden kullanılır:

- oturum sıfırlanırsa (`/new` / `/reset`)
- bir Compaction tamamlanırsa (Compaction sayısı artar)
- profil bekleme süresindeyse/devre dışıysa

`/model …@<profileId>` ile elle seçim, o oturum için bir **kullanıcı geçersiz kılması** ayarlar
ve yeni bir oturum başlayana kadar otomatik döndürülmez.

Otomatik sabitlenmiş profiller (oturum yönlendiricisi tarafından seçilenler) bir **tercih** olarak değerlendirilir:
önce onlar denenir, ancak OpenClaw hız sınırlarında/zaman aşımlarında başka bir profile dönebilir.
Kullanıcı tarafından sabitlenmiş profiller o profile kilitli kalır; başarısız olursa ve model geri düşmeleri
yapılandırılmışsa OpenClaw profil değiştirmek yerine bir sonraki modele geçer.

### OAuth neden "kaybolmuş" gibi görünebilir

Aynı sağlayıcı için hem bir OAuth profiline hem de bir API anahtarı profiline sahipseniz, round-robin sabitlenmemişse mesajlar arasında bunlar arasında geçiş yapabilir. Tek bir profili zorlamak için:

- `auth.order[provider] = ["provider:profileId"]` ile sabitleyin veya
- destekleniyorsa UI/sohbet yüzeyinizde profil geçersiz kılmasıyla `/model …` üzerinden oturum başına geçersiz kılma kullanın.

## Bekleme süreleri

Bir profil kimlik doğrulama/hız sınırı hataları nedeniyle (veya hız sınırlaması gibi görünen
bir zaman aşımı nedeniyle) başarısız olduğunda OpenClaw onu bekleme süresine alır ve bir sonraki profile geçer.
Bu hız sınırı kovası yalnızca düz `429` ile sınırlı değildir: ayrıca sağlayıcı
mesajlarını da içerir; örneğin `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` ve
`weekly/monthly limit reached` gibi dönemsel kullanım penceresi sınırları.
Biçim/geçersiz istek hataları (örneğin Cloud Code Assist araç çağrısı ID
doğrulama başarısızlıkları) devretmeye değer kabul edilir ve aynı bekleme sürelerini kullanır.
`Unhandled stop reason: error`,
`stop reason: error` ve `reason: error` gibi OpenAI uyumlu stop-reason hataları zaman aşımı/devretme
sinyalleri olarak sınıflandırılır.
Sağlayıcı kapsamlı genel sunucu metni de kaynak bilinen geçici bir örüntüyle eşleştiğinde
bu zaman aşımı kovasına girebilir. Örneğin Anthropic'in yalın
`An unknown error occurred` metni ve `internal server error`, `unknown error, 520`, `upstream error`
veya `backend error` gibi geçici sunucu metni içeren JSON `api_error` yükleri
devretmeye değer zaman aşımları olarak değerlendirilir. OpenRouter'a özgü
`Provider returned error` gibi genel yukarı akış metni de yalnızca sağlayıcı bağlamı gerçekten OpenRouter ise
zaman aşımı olarak değerlendirilir. `LLM request failed with an unknown error.`
gibi genel iç geri düşme metni ihtiyatlı kalır ve tek başına devretmeyi tetiklemez.

Bazı sağlayıcı SDK'leri aksi hâlde denetimi OpenClaw'a geri vermeden önce
uzun bir `Retry-After` penceresi boyunca uyuyabilir. Anthropic ve
OpenAI gibi Stainless tabanlı SDK'lerde OpenClaw, SDK içi `retry-after-ms` / `retry-after`
beklemelerini varsayılan olarak 60 saniye ile sınırlar ve daha uzun yeniden denenebilir yanıtları
hemen yüzeye çıkarır; böylece bu devretme yolu çalışabilir. Sınırı ayarlamak veya devre dışı bırakmak için
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` kullanın; bkz. [/concepts/retry](/tr/concepts/retry).

Hız sınırı bekleme süreleri model kapsamlı da olabilir:

- OpenClaw, başarısız olan model kimliği biliniyorsa hız sınırı başarısızlıkları için `cooldownModel` kaydeder.
- Aynı sağlayıcıdaki kardeş bir model, bekleme süresi farklı bir modele
  kapsamlanmışsa yine de denenebilir.
- Faturalama/devre dışı pencereleri ise modeli ne olursa olsun tüm profili engeller.

Bekleme süreleri üstel geri çekilme kullanır:

- 1 dakika
- 5 dakika
- 25 dakika
- 1 saat (üst sınır)

Durum, `auth-state.json` içinde `usageStats` altında saklanır:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Faturalama nedeniyle devre dışı bırakmalar

Faturalama/kredi başarısızlıkları (örneğin “insufficient credits” / “credit balance too low”) devretmeye değer kabul edilir, ancak genellikle geçici değildir. Kısa bir bekleme süresi yerine OpenClaw profili **devre dışı** olarak işaretler (daha uzun bir geri çekilme ile) ve sonraki profile/sağlayıcıya döner.

Faturalama benzeri her yanıt `402` değildir ve her HTTP `402` de
buraya düşmez. OpenClaw, sağlayıcı `401` veya `403` döndürse bile
açık faturalama metnini faturalama yolunda tutar, ancak sağlayıcıya özgü eşleştiriciler yalnızca kendi sağlayıcılarıyla sınırlı kalır
(örneğin OpenRouter `403 Key limit exceeded`).
Bu arada geçici `402` kullanım penceresi ve
kuruluş/çalışma alanı harcama limiti hataları, mesaj yeniden denenebilir görünüyorsa `rate_limit` olarak sınıflandırılır
(örneğin `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` veya `organization spending limit exceeded`).
Bunlar uzun
faturalama-devre dışı bırakma yolu yerine kısa bekleme süresi/devretme yolunda kalır.

Durum, `auth-state.json` içinde saklanır:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Varsayılanlar:

- Faturalama geri çekilmesi **5 saat** ile başlar, her faturalama başarısızlığında iki katına çıkar ve **24 saat** ile sınırlanır.
- Profil 24 saat boyunca başarısız olmadıysa geri çekilme sayaçları sıfırlanır (yapılandırılabilir).
- Aşırı yüklü yeniden denemeler, model geri düşmeden önce **aynı sağlayıcı içinde 1 profil döndürmeye** izin verir.
- Aşırı yüklü yeniden denemeler varsayılan olarak **0 ms geri çekilme** kullanır.

## Model geri düşme

Bir sağlayıcı için tüm profiller başarısız olursa OpenClaw
`agents.defaults.model.fallbacks` içindeki bir sonraki modele geçer. Bu, kimlik doğrulama hataları, hız sınırları ve
profil döndürmesini tüketen zaman aşımları için geçerlidir (diğer hatalar geri düşmeyi ilerletmez).

Aşırı yüklü ve hız sınırı hataları, faturalama bekleme
sürelerinden daha agresif ele alınır. Varsayılan olarak OpenClaw, aynı sağlayıcı içinde bir kimlik doğrulama profili yeniden denemesine izin verir,
ardından beklemeden yapılandırılmış bir sonraki model geri düşmesine geçer.
`ModelNotReadyException` gibi sağlayıcı meşgul sinyalleri bu aşırı yüklü kovaya düşer.
Bunu `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` ve
`auth.cooldowns.rateLimitedProfileRotations` ile ayarlayın.

Bir çalıştırma bir model geçersiz kılmasıyla (hook'lar veya CLI) başlıyorsa, geri düşmeler
yapılandırılmış geri düşmeler denendikten sonra yine `agents.defaults.model.primary` ile biter.

### Aday zinciri kuralları

OpenClaw aday listesini o anda istenen `provider/model`
ve yapılandırılmış geri düşmelerden oluşturur.

Kurallar:

- İstenen model her zaman ilk sıradadır.
- Açıkça yapılandırılmış geri düşmeler tekilleştirilir ancak model
  izin listesinden filtrelenmez. Bunlar açık operatör niyeti olarak değerlendirilir.
- Geçerli çalıştırma zaten aynı sağlayıcı ailesinde yapılandırılmış bir geri düşme üzerindeyse
  OpenClaw tüm yapılandırılmış zinciri kullanmaya devam eder.
- Geçerli çalıştırma yapılandırmadan farklı bir sağlayıcı üzerindeyse ve bu geçerli
  model yapılandırılmış geri düşme zincirinin parçası değilse OpenClaw
  başka bir sağlayıcıdan ilgisiz yapılandırılmış geri düşmeleri eklemez.
- Çalıştırma bir geçersiz kılmadan başladıysa yapılandırılmış birincil model sona eklenir;
  böylece zincir önceki adaylar tüketildiğinde yeniden normal varsayılan üzerine oturabilir.

### Hangi hatalar geri düşmeyi ilerletir

Model geri düşme şu durumlarda devam eder:

- kimlik doğrulama hataları
- hız sınırları ve bekleme süresi tükenmesi
- aşırı yüklenme/sağlayıcı meşgul hataları
- zaman aşımı biçimli devretme hataları
- faturalama nedeniyle devre dışı bırakmalar
- `LiveSessionModelSwitchError`; bu, devretme yoluna normalize edilir, böylece
  eski kalıcı model dış bir yeniden deneme döngüsü oluşturmaz
- hâlâ kalan adaylar varken diğer tanınmayan hatalar

Model geri düşme şu durumlarda devam etmez:

- zaman aşımı/devretme biçimli olmayan açık iptaller
- Compaction/yeniden deneme mantığı içinde kalması gereken bağlam taşması hataları
  (örneğin `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` veya `ollama error: context
length exceeded`)
- aday kalmadığında son bilinmeyen hata

### Bekleme süresi atlama ve yoklama davranışı

Bir sağlayıcı için her kimlik doğrulama profili zaten bekleme süresindeyse OpenClaw
o sağlayıcıyı otomatik olarak sonsuza dek atlamaz. Aday başına karar verir:

- Kalıcı kimlik doğrulama hataları tüm sağlayıcıyı hemen atlar.
- Faturalama nedeniyle devre dışı bırakmalar genellikle atlanır, ancak yeniden başlatma olmadan kurtarma mümkün olsun diye
  birincil aday yine de bir sınırlama altında yoklanabilir.
- Birincil aday, bekleme süresi bitimine yakın, sağlayıcı başına bir sınırlamayla yoklanabilir.
- Aynı sağlayıcıdaki geri düşme kardeşleri, başarısızlık geçici görünüyorsa (`rate_limit`, `overloaded` veya bilinmeyen) bekleme süresine rağmen denenebilir. Bu,
  özellikle hız sınırı model kapsamlı olduğunda ve kardeş bir modelin
  hemen toparlanabilmesi durumunda önemlidir.
- Geçici bekleme süresi yoklamaları, tek bir sağlayıcının sağlayıcılar arası geri düşmeyi durdurmaması için
  geri düşme çalıştırması başına sağlayıcı başına bir tane ile sınırlandırılır.

## Oturum geçersiz kılmaları ve canlı model değiştirme

Oturum modeli değişiklikleri paylaşılan durumdur. Etkin çalıştırıcı, `/model` komutu,
Compaction/oturum güncellemeleri ve canlı oturum uzlaştırması aynı oturum girdisinin
parçalarını okur veya yazar.

Bu, geri düşme yeniden denemelerinin canlı model değiştirmeyle koordineli olması gerektiği anlamına gelir:

- Yalnızca açık kullanıcı kaynaklı model değişiklikleri bekleyen bir canlı geçiş işaretler. Buna
  `/model`, `session_status(model=...)` ve `sessions.patch` dahildir.
- Geri düşme döndürme, Heartbeat geçersiz kılmaları
  veya Compaction gibi sistem kaynaklı model değişiklikleri kendi başına hiçbir zaman bekleyen canlı geçiş işaretlemez.
- Geri düşme yeniden denemesi başlamadan önce yanıt çalıştırıcısı seçilmiş
  geri düşme geçersiz kılma alanlarını oturum girdisine kalıcılaştırır.
- Canlı oturum uzlaştırması, eski çalışma zamanı model alanları yerine
  kalıcı oturum geçersiz kılmalarını tercih eder.
- Geri düşme denemesi başarısız olursa çalıştırıcı yalnızca yazdığı geçersiz kılma alanlarını
  ve yalnızca hâlâ o başarısız adayla eşleşiyorlarsa geri alır.

Bu, klasik yarış durumunu önler:

1. Birincil başarısız olur.
2. Geri düşme adayı bellekte seçilir.
3. Oturum deposu hâlâ eski birinciliği gösterir.
4. Canlı oturum uzlaştırması eski oturum durumunu okur.
5. Yeniden deneme, geri düşme denemesi başlamadan önce eski modele geri çekilir.

Kalıcı geri düşme geçersiz kılması bu pencereyi kapatır ve dar geri alma
daha yeni elle veya çalışma zamanı oturum değişikliklerini sağlam tutar.

## Gözlemlenebilirlik ve başarısızlık özetleri

`runWithModelFallback(...)`, günlükleri ve
kullanıcıya dönük bekleme süresi mesajlarını besleyen deneme başına ayrıntıları kaydeder:

- denenen sağlayıcı/model
- neden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` ve
  benzeri devretme nedenleri)
- isteğe bağlı durum/kod
- insan tarafından okunabilir hata özeti

Her aday başarısız olduğunda OpenClaw `FallbackSummaryError` fırlatır. Dış
yanıt çalıştırıcısı bunu "tüm modeller geçici olarak hız sınırında"
gibi daha belirli bir mesaj oluşturmak ve biliniyorsa en yakın bekleme süresi bitişini eklemek için kullanabilir.

Bu bekleme süresi özeti model farkındalıklıdır:

- denenen
  sağlayıcı/model zinciri için ilgisiz model kapsamlı hız sınırları yok sayılır
- kalan engel eşleşen bir model kapsamlı hız sınırıysa OpenClaw
  hâlâ o modeli engelleyen son eşleşen bitiş zamanını bildirir

## İlgili yapılandırma

Şunlar için [Gateway yapılandırması](/tr/gateway/configuration) bölümüne bakın:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` yönlendirmesi

Daha geniş model seçimi ve geri düşme genel görünümü için [Models](/tr/concepts/models) sayfasına bakın.
