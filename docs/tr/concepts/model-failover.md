---
read_when:
    - Auth profili döndürme, cooldown'lar veya model geri dönüş davranışında hata ayıklıyorsunuz
    - Auth profilleri veya modeller için failover kurallarını güncelliyorsunuz
    - Oturum model geçersiz kılmalarının fallback yeniden denemeleriyle nasıl etkileşime girdiğini anlamak istiyorsunuz
summary: OpenClaw'ın auth profillerini nasıl döndürdüğü ve modeller arasında nasıl geri dönüş yaptığı
title: Model Failover
x-i18n:
    generated_at: "2026-04-05T13:51:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 899041aa0854e4f347343797649fd11140a01e069e88b1fbc0a76e6b375f6c96
    source_path: concepts/model-failover.md
    workflow: 15
---

# Model failover

OpenClaw hataları iki aşamada ele alır:

1. Geçerli sağlayıcı içinde **auth profili döndürme**.
2. `agents.defaults.model.fallbacks` içindeki bir sonraki modele **model geri dönüşü**.

Bu belge çalışma zamanı kurallarını ve bunları destekleyen verileri açıklar.

## Çalışma zamanı akışı

Normal bir metin çalıştırması için OpenClaw adayları şu sırayla değerlendirir:

1. O anda seçili oturum modeli.
2. Sırayla yapılandırılmış `agents.defaults.model.fallbacks`.
3. Çalıştırma bir geçersiz kılmayla başladıysa, sonda yapılandırılmış birincil model.

Her adayın içinde OpenClaw, bir sonraki model adayına geçmeden önce auth profili failover'ını dener.

Yüksek seviyeli sıra:

1. Etkin oturum modelini ve auth profili tercihini çözümle.
2. Model aday zincirini oluştur.
3. Geçerli sağlayıcıyı auth profili döndürme/cooldown kurallarıyla dene.
4. Bu sağlayıcı failover'a değer bir hatayla tükenirse, bir sonraki model adayına geç.
5. Yeniden deneme başlamadan önce seçilen fallback geçersiz kılmasını kalıcı hale getir; böylece diğer oturum okuyucuları çalıştırıcının kullanmak üzere olduğu aynı sağlayıcıyı/modeli görür.
6. Fallback adayı başarısız olursa, yalnızca hâlâ bu başarısız adayla eşleşen fallback'e ait oturum geçersiz kılma alanlarını geri al.
7. Her aday başarısız olursa, deneme başına ayrıntı ve biliniyorsa en yakın cooldown bitiş zamanı ile bir `FallbackSummaryError` fırlat.

Bu bilerek "tüm oturumu kaydet ve geri yükle" yaklaşımından daha dardır. Yanıt çalıştırıcısı fallback için yalnızca sahip olduğu model seçimi alanlarını kalıcı hale getirir:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Bu, başarısız bir fallback yeniden denemesinin, deneme çalışırken gerçekleşen manuel `/model` değişiklikleri veya oturum döndürme güncellemeleri gibi daha yeni ve ilgisiz oturum değişikliklerinin üzerine yazmasını önler.

## Auth depolama (anahtarlar + OAuth)

OpenClaw hem API anahtarları hem de OAuth token'ları için **auth profilleri** kullanır.

- Gizli bilgiler `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde bulunur (legacy: `~/.openclaw/agent/auth-profiles.json`).
- Config `auth.profiles` / `auth.order` yalnızca **meta veriler + yönlendirme** içindir (gizli bilgi içermez).
- Yalnızca içe aktarma için legacy OAuth dosyası: `~/.openclaw/credentials/oauth.json` (ilk kullanımda `auth-profiles.json` içine aktarılır).

Daha fazla ayrıntı: [/concepts/oauth](/concepts/oauth)

Kimlik bilgisi türleri:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ bazı sağlayıcılar için `projectId`/`enterpriseUrl`)

## Profil kimlikleri

OAuth oturum açmaları, birden çok hesabın bir arada bulunabilmesi için farklı profiller oluşturur.

- Varsayılan: e-posta yoksa `provider:default`.
- E-postalı OAuth: `provider:<email>` (örneğin `google-antigravity:user@gmail.com`).

Profiller, `profiles` altında `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde bulunur.

## Döndürme sırası

Bir sağlayıcının birden çok profili olduğunda OpenClaw şu şekilde bir sıra seçer:

1. **Açık config**: `auth.order[provider]` (ayarlıysa).
2. **Yapılandırılmış profiller**: sağlayıcıya göre süzülmüş `auth.profiles`.
3. **Depolanmış profiller**: sağlayıcı için `auth-profiles.json` içindeki girdiler.

Açık bir sıra yapılandırılmamışsa, OpenClaw round‑robin sırası kullanır:

- **Birincil anahtar:** profil türü (**API anahtarlarından önce OAuth**).
- **İkincil anahtar:** `usageStats.lastUsed` (her tür içinde en eski önce).
- **Cooldown/devre dışı profiller** sona taşınır, en yakın bitiş zamanına göre sıralanır.

### Oturum yapışkanlığı (önbellek dostu)

OpenClaw, sağlayıcı önbelleklerini sıcak tutmak için **seçilen auth profilini oturum başına sabitler**.
Her istekte döndürme yapmaz. Sabitlenen profil şu durumlara kadar yeniden kullanılır:

- oturum sıfırlanırsa (`/new` / `/reset`)
- bir compaction tamamlanırsa (compaction sayısı artar)
- profil cooldown/devre dışı durumundaysa

`/model …@<profileId>` yoluyla manuel seçim, o oturum için bir **kullanıcı geçersiz kılması** ayarlar
ve yeni bir oturum başlayana kadar otomatik olarak döndürülmez.

Otomatik sabitlenen profiller (oturum yönlendiricisi tarafından seçilenler) bir **tercih** olarak değerlendirilir:
önce onlar denenir, ancak OpenClaw oran sınırlarında/zaman aşımlarında başka bir profile dönebilir.
Kullanıcı tarafından sabitlenen profiller o profile kilitli kalır; başarısız olursa ve model fallback'leri
yapılandırılmışsa OpenClaw profil değiştirmek yerine bir sonraki modele geçer.

### OAuth neden "kaybolmuş gibi" görünebilir?

Aynı sağlayıcı için hem bir OAuth profiline hem de bir API anahtarı profiline sahipseniz, round‑robin sabitlenmediği sürece mesajlar arasında bunlar arasında geçiş yapabilir. Tek bir profili zorlamak için:

- `auth.order[provider] = ["provider:profileId"]` ile sabitleyin veya
- Profil geçersiz kılması içeren `/model …` üzerinden oturum başına bir geçersiz kılma kullanın (UI/sohbet yüzeyiniz destekliyorsa).

## Cooldown'lar

Bir profil auth/oran sınırı hataları nedeniyle başarısız olduğunda (veya oran sınırlamasına benzeyen bir zaman aşımında), OpenClaw onu cooldown durumunda işaretler ve bir sonraki profile geçer.
Bu oran sınırı grubu yalnızca düz `429` ile sınırlı değildir: `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` ve `weekly/monthly limit reached`
gibi dönemsel kullanım penceresi sınırları gibi sağlayıcı mesajlarını da içerir.
Biçim/geçersiz istek hataları (örneğin Cloud Code Assist tool call ID
doğrulama başarısızlıkları) failover'a değer kabul edilir ve aynı cooldown'ları kullanır.
`Unhandled stop reason: error`,
`stop reason: error` ve `reason: error` gibi OpenAI uyumlu stop-reason hataları zaman aşımı/failover
sinyalleri olarak sınıflandırılır.
Sağlayıcı kapsamlı genel sunucu metni de, kaynak bilinen geçici bir desenle eşleştiğinde bu zaman aşımı grubuna girebilir. Örneğin, Anthropic için yalın
`An unknown error occurred` ve `internal server error`, `unknown error, 520`, `upstream error`
veya `backend error` gibi geçici sunucu metni içeren JSON `api_error` payload'ları failover'a değer zaman aşımları olarak değerlendirilir. OpenRouter'a özgü
yalın `Provider returned error` gibi genel upstream metinler de yalnızca sağlayıcı bağlamı gerçekten OpenRouter olduğunda
zaman aşımı olarak değerlendirilir. `LLM request failed with an unknown error.` gibi genel iç fallback metni
daha temkinli kalır ve tek başına failover tetiklemez.

Oran sınırı cooldown'ları modele özgü de olabilir:

- OpenClaw, başarısız olan model kimliği bilindiğinde oran sınırı başarısızlıkları için `cooldownModel` kaydeder.
- Aynı sağlayıcıdaki kardeş bir model, cooldown farklı bir modele
  kapsamlandırılmışsa yine de denenebilir.
- Faturalama/devre dışı pencereleri, modeller arasında yine de tüm profili engeller.

Cooldown'lar üstel geri çekilme kullanır:

- 1 dakika
- 5 dakika
- 25 dakika
- 1 saat (üst sınır)

Durum, `usageStats` altında `auth-profiles.json` içinde saklanır:

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

## Faturalama nedeniyle devre dışı bırakma

Faturalama/kredi başarısızlıkları (örneğin “insufficient credits” / “credit balance too low”) failover'a değer kabul edilir, ancak bunlar genellikle geçici değildir. Kısa bir cooldown yerine OpenClaw profili **devre dışı** olarak işaretler (daha uzun bir geri çekilmeyle) ve bir sonraki profile/sağlayıcıya döner.

Her faturalama benzeri yanıt `402` değildir ve her HTTP `402` de buraya düşmez.
Bir sağlayıcı bunun yerine `401` veya `403` döndürse bile OpenClaw açık faturalama metnini faturalama hattında tutar, ancak sağlayıcıya özgü eşleştiriciler onları sahip olan sağlayıcıyla sınırlı kalır
(örneğin OpenRouter `403 Key limit exceeded`). Bu arada geçici `402` kullanım penceresi ve
organization/workspace harcama sınırı hataları, mesaj yeniden denenebilir görünüyorsa `rate_limit` olarak sınıflandırılır
(örneğin `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` veya `organization spending limit exceeded`).
Bunlar uzun
faturalama-devre dışı bırakma yolu yerine kısa cooldown/failover yolunda kalır.

Durum `auth-profiles.json` içinde saklanır:

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
- Bir profil **24 saat** boyunca başarısız olmadıysa geri çekilme sayaçları sıfırlanır (yapılandırılabilir).
- Aşırı yüklenmiş yeniden denemeler, model fallback'inden önce **aynı sağlayıcı içinde 1 auth profili döndürmesine** izin verir.
- Aşırı yüklenmiş yeniden denemeler varsayılan olarak **0 ms geri çekilme** kullanır.

## Model fallback

Bir sağlayıcının tüm profilleri başarısız olursa OpenClaw,
`agents.defaults.model.fallbacks` içindeki bir sonraki modele geçer. Bu auth başarısızlıkları, oran sınırları ve
profil döndürmesini tüketen zaman aşımları için geçerlidir (diğer hatalar fallback'i ilerletmez).

Aşırı yüklenme ve oran sınırı hataları, faturalama cooldown'larından daha agresif ele alınır. Varsayılan olarak OpenClaw, aynı sağlayıcı içinde bir auth profili yeniden denemesine izin verir,
ardından beklemeden bir sonraki yapılandırılmış model fallback'ine geçer.
`ModelNotReadyException` gibi sağlayıcı meşgul sinyalleri bu aşırı yüklenmiş
gruba girer. Bunu `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` ve
`auth.cooldowns.rateLimitedProfileRotations` ile ayarlayın.

Bir çalıştırma model geçersiz kılmasıyla başladığında (hook'lar veya CLI), fallback'ler yapılandırılmış fallback'ler denendikten sonra yine `agents.defaults.model.primary` üzerinde biter.

### Aday zinciri kuralları

OpenClaw, o anda istenen `provider/model` ile yapılandırılmış fallback'lerden aday listesini oluşturur.

Kurallar:

- İstenen model her zaman ilk sıradadır.
- Açıkça yapılandırılmış fallback'ler tekilleştirilir ancak model allowlist'i ile süzülmez. Bunlar açık operatör niyeti olarak değerlendirilir.
- Geçerli çalıştırma aynı sağlayıcı ailesindeki yapılandırılmış bir fallback üzerinde zaten bulunuyorsa,
  OpenClaw tam yapılandırılmış zinciri kullanmaya devam eder.
- Geçerli çalıştırma config'ten farklı bir sağlayıcı üzerindeyse ve bu geçerli
  model zaten yapılandırılmış fallback zincirinin parçası değilse, OpenClaw başka bir sağlayıcıdan ilgisiz yapılandırılmış fallback'leri eklemez.
- Çalıştırma bir geçersiz kılmayla başladıysa, zincir önceki adaylar tükendiğinde normal varsayılana geri oturabilsin diye yapılandırılmış birincil model sona eklenir.

### Hangi hatalar fallback'i ilerletir

Model fallback şu durumlarda devam eder:

- auth başarısızlıkları
- oran sınırları ve cooldown tükenmesi
- aşırı yüklenme/sağlayıcı meşgul hataları
- zaman aşımı biçimli failover hataları
- faturalama nedeniyle devre dışı bırakmalar
- `LiveSessionModelSwitchError`; bu hata, eski kalıcı modelin dış yeniden deneme döngüsü oluşturmasını engellemek için bir failover yoluna normalize edilir
- kalan adaylar hâlâ varken diğer tanınmayan hatalar

Model fallback şu durumlarda devam etmez:

- zaman aşımı/failover biçiminde olmayan açık iptaller
- compaction/yeniden deneme mantığı içinde kalması gereken bağlam taşması hataları
  (örneğin `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` veya `ollama error: context
length exceeded`)
- aday kalmadığında son bilinmeyen hata

### Cooldown atlama ve probe davranışı

Bir sağlayıcının tüm auth profilleri zaten cooldown durumundaysa OpenClaw o sağlayıcıyı otomatik olarak sonsuza kadar atlamaz. Aday başına bir karar verir:

- Kalıcı auth başarısızlıkları tüm sağlayıcıyı hemen atlar.
- Faturalama nedeniyle devre dışı bırakmalar genellikle atlanır, ancak kurtarma yeniden başlatma olmadan mümkün olsun diye birincil aday yine de throttled şekilde problanabilir.
- Birincil aday, cooldown bitişine yakın, sağlayıcı başına bir throttle ile problanabilir.
- Başarısızlık geçici görünüyorsa (`rate_limit`, `overloaded` veya bilinmeyen), aynı sağlayıcıdaki fallback kardeşleri cooldown'a rağmen denenebilir. Bu özellikle bir oran sınırı modele özgüyse ve kardeş bir model hâlâ hemen toparlanabilecekse önemlidir.
- Geçici cooldown probları, tek bir sağlayıcının sağlayıcılar arası fallback'i durdurmaması için fallback çalıştırması başına sağlayıcı başına bir tane ile sınırlıdır.

## Oturum geçersiz kılmaları ve canlı model geçişi

Oturum model değişiklikleri paylaşılan durumdur. Etkin çalıştırıcı, `/model` komutu,
compaction/oturum güncellemeleri ve canlı oturum uzlaştırması aynı oturum girdisinin
parçalarını okur veya yazar.

Bu, fallback yeniden denemelerinin canlı model geçişiyle koordine olması gerektiği anlamına gelir:

- Bekleyen canlı geçişi yalnızca açık kullanıcı kaynaklı model değişiklikleri işaretler. Buna `/model`, `session_status(model=...)` ve `sessions.patch` dahildir.
- Fallback döndürmesi, heartbeat geçersiz kılmaları veya compaction gibi sistem kaynaklı model değişiklikleri kendi başına hiçbir zaman bekleyen canlı geçiş işaretlemez.
- Fallback yeniden denemesi başlamadan önce yanıt çalıştırıcısı seçilen
  fallback geçersiz kılma alanlarını oturum girdisine kalıcı hale getirir.
- Canlı oturum uzlaştırması, eski çalışma zamanı model alanları yerine kalıcı oturum geçersiz kılmalarını tercih eder.
- Fallback denemesi başarısız olursa çalıştırıcı yalnızca yazdığı geçersiz kılma alanlarını ve yalnızca hâlâ bu başarısız adayla eşleşiyorlarsa geri alır.

Bu, klasik yarışı önler:

1. Birincil başarısız olur.
2. Fallback adayı bellekte seçilir.
3. Oturum deposu hâlâ eski birinciliği gösterir.
4. Canlı oturum uzlaştırması eski oturum durumunu okur.
5. Yeniden deneme, fallback denemesi başlamadan önce eski modele geri çekilir.

Kalıcı fallback geçersiz kılması bu pencereyi kapatır ve dar geri alma,
daha yeni manuel veya çalışma zamanı oturum değişikliklerini sağlam tutar.

## Gözlemlenebilirlik ve başarısızlık özetleri

`runWithModelFallback(...)`, günlükleri ve kullanıcıya dönük cooldown mesajlarını besleyen deneme başına ayrıntıları kaydeder:

- denenen sağlayıcı/model
- neden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` ve
  benzer failover nedenleri)
- isteğe bağlı durum/kod
- insanlar tarafından okunabilir hata özeti

Her aday başarısız olduğunda OpenClaw `FallbackSummaryError` fırlatır. Dış
yanıt çalıştırıcısı bunu "tüm modeller geçici olarak oran sınırlı" gibi
daha spesifik bir mesaj oluşturmak ve biliniyorsa en yakın cooldown bitiş zamanını eklemek için kullanabilir.

Bu cooldown özeti model farkındalıklıdır:

- ilgisiz modele özgü oran sınırları, denenmiş
  sağlayıcı/model zinciri için yok sayılır
- kalan engel eşleşen modele özgü bir oran sınırıysa, OpenClaw
  o modeli hâlâ engelleyen son eşleşen bitiş zamanını bildirir

## İlgili config

Şunlar için [Gateway configuration](/gateway/configuration) sayfasına bakın:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` yönlendirmesi

Daha geniş model seçimi ve fallback genel görünümü için [Models](/concepts/models) sayfasına bakın.
