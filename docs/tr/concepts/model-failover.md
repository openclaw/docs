---
read_when:
    - Auth profili döndürme, bekleme süreleri veya model geri dönüşü davranışında tanılama yapma
    - Auth profilleri veya modeller için geri dönüş kurallarını güncelleme
    - Oturum model geçersiz kılmalarının geri dönüş yeniden denemeleriyle nasıl etkileştiğini anlama
sidebarTitle: Model failover
summary: OpenClaw'ın auth profillerini nasıl döndürdüğü ve modeller arasında nasıl geri dönüş yaptığı
title: Model geri dönüşü
x-i18n:
    generated_at: "2026-04-26T11:27:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e681a456f75073bb34e7af94234efeee57c6c25e9414da19eb9527ccba5444a
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw hataları iki aşamada ele alır:

1. Geçerli sağlayıcı içinde **auth profili döndürme**.
2. `agents.defaults.model.fallbacks` içindeki sonraki modele **model geri dönüşü**.

Bu belge çalışma zamanı kurallarını ve bunları destekleyen verileri açıklar.

## Çalışma zamanı akışı

Normal bir metin çalıştırması için OpenClaw adayları şu sırayla değerlendirir:

<Steps>
  <Step title="Oturum durumunu çözümle">
    Etkin oturum modelini ve auth profili tercihini çözümle.
  </Step>
  <Step title="Aday zincirini oluştur">
    Model aday zincirini, geçerli seçili oturum modelinden başlayarak, ardından sırayla `agents.defaults.model.fallbacks` içinden ve çalıştırma bir geçersiz kılmadan başladıysa en sonda yapılandırılmış birincil modelle bitecek şekilde oluştur.
  </Step>
  <Step title="Geçerli sağlayıcıyı dene">
    Geçerli sağlayıcıyı auth profili döndürme/bekleme süresi kurallarıyla dene.
  </Step>
  <Step title="Geri dönüşe değer hatalarda ilerle">
    Bu sağlayıcı geri dönüşe değer bir hatayla tükenirse, sonraki model adayına geç.
  </Step>
  <Step title="Geri dönüş geçersiz kılmasını kalıcılaştır">
    Seçilen geri dönüş geçersiz kılmasını yeniden deneme başlamadan önce kalıcılaştır; böylece diğer oturum okuyucuları çalıştırıcının kullanmak üzere olduğu aynı sağlayıcı/modeli görür.
  </Step>
  <Step title="Başarısızlıkta dar kapsamlı geri al">
    Geri dönüş adayı başarısız olursa, yalnızca hâlâ başarısız olan adayla eşleşen geri dönüşe ait oturum geçersiz kılma alanlarını geri al.
  </Step>
  <Step title="Tükenirse FallbackSummaryError fırlat">
    Her aday başarısız olursa, deneme başına ayrıntı ve biliniyorsa en erken bekleme süresi bitişi ile birlikte bir `FallbackSummaryError` fırlat.
  </Step>
</Steps>

Bu, kasıtlı olarak "tüm oturumu kaydet ve geri yükle" yaklaşımından daha dardır. Yanıt çalıştırıcısı geri dönüş için yalnızca sahip olduğu model seçimi alanlarını kalıcılaştırır:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Bu, başarısız bir geri dönüş yeniden denemesinin, deneme çalışırken gerçekleşen manuel `/model` değişiklikleri veya oturum döndürme güncellemeleri gibi yeni ve ilgisiz oturum değişikliklerinin üzerine yazmasını önler.

## Auth depolaması (anahtarlar + OAuth)

OpenClaw hem API anahtarları hem de OAuth belirteçleri için **auth profilleri** kullanır.

- Gizli bilgiler `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde bulunur (eski konum: `~/.openclaw/agent/auth-profiles.json`).
- Çalışma zamanı auth yönlendirme durumu `~/.openclaw/agents/<agentId>/agent/auth-state.json` içinde bulunur.
- Yapılandırmadaki `auth.profiles` / `auth.order` yalnızca **meta veri + yönlendirme** içindir (gizli bilgi içermez).
- Eski yalnızca içe aktarma OAuth dosyası: `~/.openclaw/credentials/oauth.json` (ilk kullanımda `auth-profiles.json` içine aktarılır).

Daha fazla ayrıntı: [OAuth](/tr/concepts/oauth)

Kimlik bilgisi türleri:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ bazı sağlayıcılar için `projectId`/`enterpriseUrl`)

## Profil kimlikleri

OAuth girişleri, birden fazla hesabın birlikte var olabilmesi için ayrı profiller oluşturur.

- Varsayılan: e-posta yoksa `provider:default`.
- E-posta ile OAuth: `provider:<email>` (örneğin `google-antigravity:user@gmail.com`).

Profiller, `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` altında `profiles` içinde yaşar.

## Döndürme sırası

Bir sağlayıcının birden fazla profili olduğunda OpenClaw şu şekilde bir sıra seçer:

<Steps>
  <Step title="Açık yapılandırma">
    `auth.order[provider]` (ayarlıysa).
  </Step>
  <Step title="Yapılandırılmış profiller">
    Sağlayıcıya göre filtrelenmiş `auth.profiles`.
  </Step>
  <Step title="Saklanan profiller">
    Sağlayıcı için `auth-profiles.json` içindeki girdiler.
  </Step>
</Steps>

Açık bir sıra yapılandırılmamışsa OpenClaw round-robin bir sıra kullanır:

- **Birincil anahtar:** profil türü (**API anahtarlarından önce OAuth**).
- **İkincil anahtar:** `usageStats.lastUsed` (her tür içinde en eski ilk).
- **Bekleme süresindeki/devre dışı profiller**, en yakın bitişe göre sıralanarak sona taşınır.

### Oturum yapışkanlığı (önbellek dostu)

OpenClaw, sağlayıcı önbelleklerini sıcak tutmak için **seçilen auth profilini oturum başına sabitler**. Her istekte döndürmez. Sabitlenmiş profil şu durumlara kadar yeniden kullanılır:

- oturum sıfırlanırsa (`/new` / `/reset`)
- bir Compaction tamamlanırsa (compaction sayısı artar)
- profil bekleme süresinde/devre dışıysa

`/model …@<profileId>` aracılığıyla yapılan manuel seçim, o oturum için bir **kullanıcı geçersiz kılması** ayarlar ve yeni bir oturum başlayana kadar otomatik olarak döndürülmez.

<Note>
Otomatik sabitlenen profiller (oturum yönlendiricisi tarafından seçilenler) bir **tercih** olarak ele alınır: önce onlar denenir, ancak OpenClaw oran sınırlarında/zaman aşımlarında başka bir profile dönebilir. Kullanıcı tarafından sabitlenen profiller o profile kilitli kalır; başarısız olursa ve model geri dönüşleri yapılandırılmışsa OpenClaw profilleri değiştirmek yerine sonraki modele geçer.
</Note>

### OAuth neden "kaybolmuş gibi" görünebilir

Aynı sağlayıcı için hem bir OAuth profiline hem de bir API anahtarı profiline sahipseniz, round-robin sabitlenmediği sürece iletiler arasında bunlar arasında geçiş yapabilir. Tek bir profili zorlamak için:

- `auth.order[provider] = ["provider:profileId"]` ile sabitleyin veya
- Oturum başına bir geçersiz kılmayı, profil geçersiz kılmasıyla birlikte `/model …` aracılığıyla kullanın (UI/sohbet yüzeyiniz destekliyorsa).

## Bekleme süreleri

Bir profil auth/oran sınırı hataları nedeniyle başarısız olduğunda (veya oran sınırına benzer görünen bir zaman aşımı yaşadığında), OpenClaw onu bekleme süresine alır ve sonraki profile geçer.

<AccordionGroup>
  <Accordion title="Oran sınırı / zaman aşımı grubuna neler girer">
    Bu oran sınırı grubu yalnızca düz `429`'dan daha geniştir: ayrıca `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` ve `weekly/monthly limit reached` gibi dönemsel kullanım penceresi sınırları gibi sağlayıcı iletilerini de içerir.

    Biçim/geçersiz istek hataları (örneğin Cloud Code Assist araç çağrısı kimlik doğrulama hataları) geri dönüşe değer olarak değerlendirilir ve aynı bekleme sürelerini kullanır. `Unhandled stop reason: error`, `stop reason: error` ve `reason: error` gibi OpenAI uyumlu durma nedeni hataları zaman aşımı/geri dönüş sinyalleri olarak sınıflandırılır.

    Kaynak bilinen geçici bir kalıpla eşleştiğinde genel sunucu metni de bu zaman aşımı grubuna girebilir. Örneğin yalın pi-ai akış sarmalayıcı iletisi `An unknown error occurred`, sağlayıcı akışları belirli ayrıntılar olmadan `stopReason: "aborted"` veya `stopReason: "error"` ile bittiğinde pi-ai bunu yaydığı için her sağlayıcı için geri dönüşe değer olarak değerlendirilir. `internal server error`, `unknown error, 520`, `upstream error` veya `backend error` gibi geçici sunucu metinleri içeren JSON `api_error` yükleri de geri dönüşe değer zaman aşımları olarak değerlendirilir.

    OpenRouter'a özgü genel upstream metni, örneğin yalın `Provider returned error`, yalnızca sağlayıcı bağlamı gerçekten OpenRouter ise zaman aşımı olarak değerlendirilir. `LLM request failed with an unknown error.` gibi genel iç geri dönüş metni ise temkinli kalır ve tek başına geri dönüşü tetiklemez.

  </Accordion>
  <Accordion title="SDK retry-after üst sınırları">
    Bazı sağlayıcı SDK'ları, kontrolü OpenClaw'a geri vermeden önce uzun bir `Retry-After` penceresi boyunca uyuyabilir. Anthropic ve OpenAI gibi Stainless tabanlı SDK'larda OpenClaw, SDK içi `retry-after-ms` / `retry-after` beklemelerini varsayılan olarak 60 saniye ile sınırlar ve bu geri dönüş yolu çalışabilsin diye daha uzun yeniden denenebilir yanıtları hemen yüzeye çıkarır. Üst sınırı ayarlamak veya devre dışı bırakmak için `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` kullanın; bkz. [Yeniden deneme davranışı](/tr/concepts/retry).
  </Accordion>
  <Accordion title="Model kapsamlı bekleme süreleri">
    Oran sınırı bekleme süreleri model kapsamlı da olabilir:

    - OpenClaw, başarısız model kimliği bilindiğinde oran sınırı hataları için `cooldownModel` kaydeder.
    - Bekleme süresi farklı bir modele kapsamlandırılmışsa, aynı sağlayıcıdaki kardeş bir model yine de denenebilir.
    - Faturalama/devre dışı pencereleri ise tüm profil üzerinde, modeller arasında da engelleyici olmaya devam eder.

  </Accordion>
</AccordionGroup>

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

## Faturalama devre dışı bırakmaları

Faturalama/kredi hataları (örneğin "insufficient credits" / "credit balance too low"), geri dönüşe değer olarak değerlendirilir, ancak genellikle geçici değildir. OpenClaw kısa bir bekleme süresi yerine profili **devre dışı** olarak işaretler (daha uzun bir geri çekilme ile) ve sonraki profile/sağlayıcıya döner.

<Note>
Faturalama görünümlü her yanıt `402` değildir ve her HTTP `402` de buraya düşmez. OpenClaw, bir sağlayıcı bunun yerine `401` veya `403` döndürse bile açık faturalama metnini faturalama yolunda tutar, ancak sağlayıcıya özgü eşleştiriciler onları sahiplenen sağlayıcıyla sınırlı kalır (örneğin OpenRouter `403 Key limit exceeded`).

Bu arada geçici `402` kullanım penceresi ve kuruluş/çalışma alanı harcama sınırı hataları, ileti yeniden denenebilir görünüyorsa `rate_limit` olarak sınıflandırılır (örneğin `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` veya `organization spending limit exceeded`). Bunlar uzun faturalama-devre dışı bırakma yolu yerine kısa bekleme süresi/geri dönüş yolunda kalır.
</Note>

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

- Faturalama geri çekilmesi **5 saatten** başlar, her faturalama hatasında iki katına çıkar ve **24 saat** ile sınırlanır.
- Geri çekilme sayaçları, profil **24 saat** boyunca başarısız olmadıysa sıfırlanır (yapılandırılabilir).
- Aşırı yük yeniden denemeleri, model geri dönüşünden önce **aynı sağlayıcı içinde 1 auth profili döndürmeye** izin verir.
- Aşırı yük yeniden denemeleri varsayılan olarak **0 ms geri çekilme** kullanır.

## Model geri dönüşü

Bir sağlayıcının tüm profilleri başarısız olursa OpenClaw, `agents.defaults.model.fallbacks` içindeki sonraki modele geçer. Bu, auth hataları, oran sınırları ve profil döndürmesini tüketen zaman aşımları için geçerlidir (diğer hatalar geri dönüşü ilerletmez).

Aşırı yük ve oran sınırı hataları, faturalama bekleme sürelerinden daha agresif ele alınır. Varsayılan olarak OpenClaw, aynı sağlayıcı içinde bir auth profili yeniden denemesine izin verir, ardından beklemeden yapılandırılmış sonraki model geri dönüşüne geçer. `ModelNotReadyException` gibi sağlayıcı meşgul sinyalleri bu aşırı yük grubuna girer. Bunu `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` ve `auth.cooldowns.rateLimitedProfileRotations` ile ayarlayın.

Bir çalıştırma model geçersiz kılmasıyla başladıysa (kancalar veya CLI), geri dönüşler yapılandırılmış geri dönüşler denendikten sonra yine de `agents.defaults.model.primary` ile sona erer.

### Aday zinciri kuralları

OpenClaw, aday listesini geçerli istenen `provider/model` ile yapılandırılmış geri dönüşlerden oluşturur.

<AccordionGroup>
  <Accordion title="Kurallar">
    - İstenen model her zaman ilk sıradadır.
    - Açık yapılandırılmış geri dönüşler yinelenenlerden arındırılır ancak model allowlist'ine göre filtrelenmez. Bunlar açık operatör niyeti olarak değerlendirilir.
    - Geçerli çalıştırma aynı sağlayıcı ailesinde zaten yapılandırılmış bir geri dönüş üzerindeyse, OpenClaw tam yapılandırılmış zinciri kullanmaya devam eder.
    - Geçerli çalıştırma yapılandırmadan farklı bir sağlayıcı üzerindeyse ve bu geçerli model yapılandırılmış geri dönüş zincirinin parçası değilse, OpenClaw başka bir sağlayıcıdan ilgisiz yapılandırılmış geri dönüşleri sona eklemez.
    - Çalıştırma bir geçersiz kılmadan başladıysa, zincirin önceki adaylar tükendiğinde yeniden normal varsayılana yerleşebilmesi için yapılandırılmış birincil model sona eklenir.

  </Accordion>
</AccordionGroup>

### Hangi hatalar geri dönüşü ilerletir

<Tabs>
  <Tab title="Şunlarda devam eder">
    - auth hataları
    - oran sınırları ve bekleme süresi tükenmesi
    - aşırı yük/sağlayıcı meşgul hataları
    - zaman aşımı biçimli geri dönüş hataları
    - faturalama nedeniyle devre dışı bırakmalar
    - `LiveSessionModelSwitchError`; bu, eski kalıcı modelin dış bir yeniden deneme döngüsü oluşturmasını önlemek için geri dönüş yoluna normalize edilir
    - hâlâ kalan adaylar varken diğer tanınmayan hatalar

  </Tab>
  <Tab title="Şunlarda devam etmez">
    - zaman aşımı/geri dönüş biçiminde olmayan açık iptaller
    - Compaction/yeniden deneme mantığı içinde kalması gereken bağlam taşması hataları (örneğin `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` veya `ollama error: context length exceeded`)
    - hiç aday kalmadığında son bilinmeyen hata

  </Tab>
</Tabs>

### Bekleme süresi atlama ile prob davranışı

Bir sağlayıcının tüm auth profilleri zaten bekleme süresindeyken OpenClaw bu sağlayıcıyı sonsuza kadar otomatik olarak atlamaz. Aday başına karar verir:

<AccordionGroup>
  <Accordion title="Aday başına kararlar">
    - Kalıcı auth hataları tüm sağlayıcıyı hemen atlar.
    - Faturalama nedeniyle devre dışı bırakmalar genellikle atlanır, ancak yeniden başlatma olmadan kurtarma mümkün olsun diye birincil aday sınırlı sıklıkta yine de prob edilebilir.
    - Birincil aday, sağlayıcı başına sınırlama ile bekleme süresi bitimine yakın prob edilebilir.
    - Aynı sağlayıcıdaki geri dönüş kardeşleri, hata geçici görünüyorsa (`rate_limit`, `overloaded` veya bilinmeyen) bekleme süresine rağmen denenebilir. Bu özellikle oran sınırı model kapsamlı olduğunda ve kardeş bir model hemen toparlanabildiğinde önemlidir.
    - Geçici bekleme süresi probları, tek bir sağlayıcının sağlayıcılar arası geri dönüşü duraklatmaması için geri dönüş çalıştırması başına sağlayıcı başına bir ile sınırlıdır.

  </Accordion>
</AccordionGroup>

## Oturum geçersiz kılmaları ve canlı model değiştirme

Oturum modeli değişiklikleri paylaşılan durumdur. Etkin çalıştırıcı, `/model` komutu, Compaction/oturum güncellemeleri ve canlı oturum uzlaştırması aynı oturum girdisinin parçalarını okur veya yazar.

Bu, geri dönüş yeniden denemelerinin canlı model değiştirme ile eşgüdüm kurması gerektiği anlamına gelir:

- Yalnızca açık kullanıcı kaynaklı model değişiklikleri bekleyen canlı değişimi işaretler. Buna `/model`, `session_status(model=...)` ve `sessions.patch` dahildir.
- Geri dönüş döndürmesi, Heartbeat geçersiz kılmaları veya Compaction gibi sistem kaynaklı model değişiklikleri kendi başlarına bekleyen canlı değişim işaretlemez.
- Bir geri dönüş yeniden denemesi başlamadan önce yanıt çalıştırıcısı seçilen geri dönüş geçersiz kılma alanlarını oturum girdisine kalıcı olarak yazar.
- Canlı oturum uzlaştırması, eski çalışma zamanı model alanları yerine kalıcı oturum geçersiz kılmalarını tercih eder.
- Geri dönüş denemesi başarısız olursa çalıştırıcı yalnızca yazdığı geçersiz kılma alanlarını ve yalnızca bunlar hâlâ başarısız adayla eşleşiyorsa geri alır.

Bu, klasik yarış durumunu önler:

<Steps>
  <Step title="Birincil başarısız olur">
    Seçilen birincil model başarısız olur.
  </Step>
  <Step title="Geri dönüş bellekte seçilir">
    Geri dönüş adayı bellekte seçilir.
  </Step>
  <Step title="Oturum deposu hâlâ eski birincili söyler">
    Oturum deposu hâlâ eski birincili yansıtır.
  </Step>
  <Step title="Canlı uzlaştırma eski durumu okur">
    Canlı oturum uzlaştırması eski oturum durumunu okur.
  </Step>
  <Step title="Yeniden deneme geri sıçrar">
    Yeniden deneme, geri dönüş denemesi başlamadan önce eski modele geri sıçrar.
  </Step>
</Steps>

Kalıcı geri dönüş geçersiz kılması bu pencereyi kapatır ve dar kapsamlı geri alma, daha yeni manuel veya çalışma zamanı oturum değişikliklerini sağlam tutar.

## Gözlemlenebilirlik ve başarısızlık özetleri

`runWithModelFallback(...)`, günlükleri ve kullanıcıya dönük bekleme süresi iletilerini besleyen deneme başına ayrıntıları kaydeder:

- denenen sağlayıcı/model
- neden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` ve benzeri geri dönüş nedenleri)
- isteğe bağlı durum/kod
- insan tarafından okunabilir hata özeti

Her aday başarısız olduğunda OpenClaw `FallbackSummaryError` fırlatır. Dış yanıt çalıştırıcısı bunu, "tüm modeller geçici olarak oran sınırlı" gibi daha özel bir ileti oluşturmak ve biliniyorsa en erken bekleme süresi bitişini eklemek için kullanabilir.

Bu bekleme süresi özeti model farkındadır:

- denenen sağlayıcı/model zinciri için ilgisiz model kapsamlı oran sınırları yok sayılır
- kalan engel eşleşen model kapsamlı bir oran sınırıysa OpenClaw, hâlâ o modeli engelleyen son eşleşen bitiş zamanını bildirir

## İlgili yapılandırma

Şunlar için [Gateway yapılandırması](/tr/gateway/configuration) bölümüne bakın:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` yönlendirmesi

Daha geniş model seçimi ve geri dönüş genel bakışı için [Modeller](/tr/concepts/models) bölümüne bakın.
