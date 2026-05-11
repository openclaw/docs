---
read_when:
    - Kimlik doğrulama profili rotasyonunu, bekleme sürelerini veya yedek modele geçiş davranışını tanılama
    - Kimlik doğrulama profilleri veya modeller için yük devretme kurallarını güncelleme
    - Oturum modeli geçersiz kılmalarının geri dönüş yeniden denemeleriyle nasıl etkileşime girdiğini anlama
sidebarTitle: Model failover
summary: OpenClaw kimlik doğrulama profillerini nasıl dönüşümlü kullanır ve modeller arasında nasıl yedeklere geçer
title: Model yük devri
x-i18n:
    generated_at: "2026-05-11T20:27:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3983218c9de67bbd100eab655c319ed97350d43e00c826febd47cb014cbe6cf
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw hataları iki aşamada ele alır:

1. Geçerli sağlayıcı içinde **kimlik doğrulama profili rotasyonu**.
2. `agents.defaults.model.fallbacks` içindeki sonraki modele **model geri dönüşü**.

Bu belge çalışma zamanı kurallarını ve bunları destekleyen verileri açıklar.

## Çalışma zamanı akışı

Normal bir metin çalıştırması için OpenClaw adayları şu sırayla değerlendirir:

<Steps>
  <Step title="Resolve session state">
    Etkin oturum modelini ve kimlik doğrulama profili tercihini çözümle.
  </Step>
  <Step title="Build candidate chain">
    Geçerli model seçimi ve bu seçim kaynağının geri dönüş ilkesi üzerinden model aday zincirini oluştur. Yapılandırılmış varsayılanlar, cron işi birincilleri ve otomatik seçilmiş geri dönüş modelleri yapılandırılmış geri dönüşleri kullanabilir; açık kullanıcı oturumu seçimleri katıdır.
  </Step>
  <Step title="Try the current provider">
    Geçerli sağlayıcıyı kimlik doğrulama profili rotasyonu/bekleme süresi kurallarıyla dene.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Bu sağlayıcı devretmeye değer bir hatayla tükenirse sonraki model adayına geç.
  </Step>
  <Step title="Persist fallback override">
    Yeniden deneme başlamadan önce seçilen geri dönüş geçersiz kılmasını kalıcılaştır, böylece diğer oturum okuyucuları çalıştırıcının kullanmak üzere olduğu aynı sağlayıcıyı/modeli görür. Kalıcılaştırılan model geçersiz kılması `modelOverrideSource: "auto"` olarak işaretlenir.
  </Step>
  <Step title="Roll back narrowly on failure">
    Geri dönüş adayı başarısız olursa, yalnızca geri dönüşe ait oturum geçersiz kılma alanları hâlâ başarısız olan adayla eşleşiyorsa bunları geri al.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Her aday başarısız olursa, deneme başına ayrıntı ve biliniyorsa en erken bekleme süresi bitişiyle birlikte bir `FallbackSummaryError` fırlat.
  </Step>
</Steps>

Bu, bilinçli olarak "tüm oturumu kaydet ve geri yükle" yaklaşımından daha dardır. Yanıt çalıştırıcısı yalnızca geri dönüş için sahip olduğu model seçimi alanlarını kalıcılaştırır:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Bu, başarısız bir geri dönüş yeniden denemesinin, deneme çalışırken gerçekleşen manuel `/model` değişiklikleri veya oturum rotasyonu güncellemeleri gibi daha yeni ve ilgisiz oturum değişikliklerinin üzerine yazmasını engeller.

## Seçim kaynağı ilkesi

OpenClaw seçilen sağlayıcı/model ile bunun neden seçildiğini birbirinden ayırır. Bu kaynak, geri dönüş zincirine izin verilip verilmediğini belirler:

- **Yapılandırılmış varsayılan**: `agents.defaults.model.primary`, `agents.defaults.model.fallbacks` kullanır.
- **Ajan birincili**: `agents.list[].model`, ilgili ajan model nesnesi kendi `fallbacks` değerlerini içermedikçe katıdır. Katı davranışı açık hâle getirmek için `fallbacks: []` kullanın veya o ajanı model geri dönüşüne dahil etmek için boş olmayan bir liste sağlayın.
- **Otomatik geri dönüş geçersiz kılması**: çalışma zamanı geri dönüşü yeniden denemeden önce `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` ve seçilen kaynak modeli yazar. Bu otomatik geçersiz kılma, yapılandırılmış geri dönüş zincirinde ilerlemeyi sürdürebilir ve `/new`, `/reset` ve `sessions.reset` tarafından temizlenir. Açık bir `heartbeat.model` olmadan çalışan Heartbeat çalıştırmaları da, kaynağı artık geçerli yapılandırılmış varsayılanla eşleşmediğinde doğrudan bir otomatik geçersiz kılmayı temizler.
- **Kullanıcı oturumu geçersiz kılması**: `/model`, model seçici, `session_status(model=...)` ve `sessions.patch`, `modelOverrideSource: "user"` yazar. Bu, kesin bir oturum seçimidir. Seçilen sağlayıcı/model bir yanıt üretmeden önce başarısız olursa OpenClaw ilgisiz bir yapılandırılmış geri dönüşten yanıt vermek yerine hatayı bildirir.
- **Eski oturum geçersiz kılması**: daha eski oturum girdilerinde `modelOverride` bulunup `modelOverrideSource` bulunmayabilir. OpenClaw bunları kullanıcı geçersiz kılmaları olarak ele alır; böylece açık bir eski seçim sessizce geri dönüş davranışına dönüştürülmez.
- **Cron yük modeli**: bir cron işi `payload.model` / `--model`, kullanıcı oturumu geçersiz kılması değil, iş birincilidir. İş `payload.fallbacks` sağlamadıkça yapılandırılmış geri dönüşleri kullanır; `payload.fallbacks: []` cron çalıştırmasını katı yapar.

## Kimlik doğrulama depolaması (anahtarlar + OAuth)

OpenClaw hem API anahtarları hem de OAuth belirteçleri için **kimlik doğrulama profilleri** kullanır.

- Gizli bilgiler `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde bulunur (eski: `~/.openclaw/agent/auth-profiles.json`).
- Çalışma zamanı kimlik doğrulama yönlendirme durumu `~/.openclaw/agents/<agentId>/agent/auth-state.json` içinde bulunur.
- Config `auth.profiles` / `auth.order`, **yalnızca metadata + yönlendirme** içindir (gizli bilgi içermez).
- Yalnızca eski içe aktarma OAuth dosyası: `~/.openclaw/credentials/oauth.json` (ilk kullanımda `auth-profiles.json` içine aktarılır).

Daha fazla ayrıntı: [OAuth](/tr/concepts/oauth)

Kimlik bilgisi türleri:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (bazı sağlayıcılar için ayrıca `projectId`/`enterpriseUrl`)

## Profil kimlikleri

OAuth oturum açmaları, birden çok hesabın birlikte var olabilmesi için ayrı profiller oluşturur.

- Varsayılan: e-posta yoksa `provider:default`.
- E-posta ile OAuth: `provider:<email>` (örneğin `google-antigravity:user@gmail.com`).

Profiller `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde `profiles` altında bulunur.

## Rotasyon sırası

Bir sağlayıcının birden çok profili olduğunda OpenClaw sırayı şöyle seçer:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (ayarlanmışsa).
  </Step>
  <Step title="Configured profiles">
    Sağlayıcıya göre filtrelenmiş `auth.profiles`.
  </Step>
  <Step title="Stored profiles">
    Sağlayıcı için `auth-profiles.json` içindeki girdiler.
  </Step>
</Steps>

Açık bir sıra yapılandırılmamışsa OpenClaw round-robin sırası kullanır:

- **Birincil anahtar:** profil türü (**API anahtarlarından önce OAuth**).
- **İkincil anahtar:** `usageStats.lastUsed` (her tür içinde önce en eski).
- **Bekleme süresindeki/devre dışı profiller** sona taşınır ve en erken bitiş süresine göre sıralanır.

### Oturum bağlılığı (önbellek dostu)

OpenClaw, sağlayıcı önbelleklerini sıcak tutmak için **seçilen kimlik doğrulama profilini oturum başına sabitler**. Her istekte rotasyon yapmaz. Sabitlenen profil şu durumlara kadar yeniden kullanılır:

- oturum sıfırlanırsa (`/new` / `/reset`)
- bir Compaction tamamlanırsa (Compaction sayısı artar)
- profil bekleme süresindeyse/devre dışıysa

`/model …@<profileId>` aracılığıyla yapılan manuel seçim, ilgili oturum için bir **kullanıcı geçersiz kılması** ayarlar ve yeni bir oturum başlayana kadar otomatik olarak rotasyona sokulmaz.

<Note>
Otomatik sabitlenen profiller (oturum yönlendiricisi tarafından seçilenler) bir **tercih** olarak ele alınır: önce onlar denenir, ancak OpenClaw hız sınırlarında/zaman aşımlarında başka bir profile dönebilir. Özgün profil tekrar kullanılabilir olduğunda, yeni çalıştırmalar seçili modeli veya runtime'ı değiştirmeden onu tekrar tercih edebilir. Kullanıcı tarafından sabitlenen profiller o profile kilitli kalır; profil başarısız olursa ve model yedekleri yapılandırılmışsa OpenClaw profil değiştirmek yerine sonraki modele geçer.
</Note>

### OpenAI Codex aboneliği artı API anahtarı yedeği

OpenAI ajan modelleri için kimlik doğrulama ve runtime ayrıdır. `openai/gpt-*`,
kimlik doğrulama bir Codex abonelik profili ile bir OpenAI API anahtarı yedeği
arasında rotasyon yapabilirken Codex harness üzerinde kalır.

Kullanıcıya dönük sıra için `auth.order.openai` kullanın:

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Mevcut Codex abonelik profilleri eski
`openai-codex:*` profil kimliğini kullanmaya devam edebilir. Sıralı API anahtarı yedeği normal bir
`openai:*` API anahtarı profili olabilir. Abonelik bir Codex kullanım sınırına ulaştığında,
Codex sağlıyorsa OpenClaw tam sıfırlama zamanını kaydeder, sıradaki
kimlik doğrulama profilini dener ve çalıştırmayı Codex harness içinde tutar. Sıfırlama
zamanı geçtikten sonra abonelik profili tekrar uygun hale gelir ve sonraki otomatik
seçim ona geri dönebilir.

Kullanıcı tarafından sabitlenmiş bir profili yalnızca o oturum için tek bir hesabı/anahtarı
zorunlu kılmak istediğinizde kullanın. Kullanıcı tarafından sabitlenen profiller özellikle katıdır ve sessizce
başka bir profile atlamaz.

## Bekleme Süreleri

Bir profil kimlik doğrulama/hız sınırı hataları (veya hız sınırlamaya benzeyen bir zaman aşımı) nedeniyle başarısız olduğunda OpenClaw onu bekleme süresinde işaretler ve sonraki profile geçer.

<AccordionGroup>
  <Accordion title="Hız sınırı / zaman aşımı grubuna neler girer">
    Bu hız sınırı grubu düz `429` değerinden daha geniştir: `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` gibi sağlayıcı iletilerini ve `weekly/monthly limit reached` gibi dönemsel kullanım penceresi sınırlarını da içerir.

    Biçim/geçersiz istek hataları genellikle nihai hatalardır; çünkü aynı yükü yeniden denemek aynı şekilde başarısız olur. Bu yüzden OpenClaw, kimlik doğrulama profillerini döndürmek yerine bunları yüzeye çıkarır. Bilinen yeniden deneme-onarım yolları açıkça dahil olabilir: örneğin Cloud Code Assist araç çağrısı ID doğrulama hataları temizlenir ve `allowFormatRetry` ilkesi üzerinden bir kez yeniden denenir. `Unhandled stop reason: error`, `stop reason: error` ve `reason: error` gibi OpenAI uyumlu durma nedeni hataları zaman aşımı/yük devri sinyalleri olarak sınıflandırılır.

    Kaynak bilinen geçici bir desenle eşleştiğinde genel sunucu metni de bu zaman aşımı grubuna girebilir. Örneğin, yalın pi-ai akış sarmalayıcı iletisi `An unknown error occurred`, her sağlayıcı için yük devrine değer kabul edilir; çünkü pi-ai, sağlayıcı akışları belirli ayrıntılar olmadan `stopReason: "aborted"` veya `stopReason: "error"` ile bittiğinde bunu yayar. `internal server error`, `unknown error, 520`, `upstream error` veya `backend error` gibi geçici sunucu metinleri içeren JSON `api_error` yükleri de yük devrine değer zaman aşımları olarak değerlendirilir.

    OpenRouter'a özgü yalın `Provider returned error` gibi genel yukarı akış metinleri, yalnızca sağlayıcı bağlamı gerçekten OpenRouter olduğunda zaman aşımı olarak değerlendirilir. `LLM request failed with an unknown error.` gibi genel dahili yedek metinler temkinli kalır ve tek başına yük devrini tetiklemez.

  </Accordion>
  <Accordion title="SDK retry-after üst sınırları">
    Bazı sağlayıcı SDK'leri, kontrolü OpenClaw'a döndürmeden önce uzun bir `Retry-After` penceresi boyunca bekleyebilir. Anthropic ve OpenAI gibi Stainless tabanlı SDK'ler için OpenClaw, SDK içi `retry-after-ms` / `retry-after` beklemelerini varsayılan olarak 60 saniye ile sınırlar ve daha uzun yeniden denenebilir yanıtları hemen yüzeye çıkarır; böylece bu yük devri yolu çalışabilir. Sınırı `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` ile ayarlayın veya devre dışı bırakın; bkz. [Yeniden deneme davranışı](/tr/concepts/retry).
  </Accordion>
  <Accordion title="Model kapsamlı bekleme süreleri">
    Hız sınırı bekleme süreleri model kapsamlı da olabilir:

    - OpenClaw, başarısız olan model id'si bilindiğinde hız sınırı hataları için `cooldownModel` kaydeder.
    - Bekleme süresi farklı bir modele kapsamlanmışsa aynı sağlayıcıdaki kardeş bir model yine de denenebilir.
    - Faturalama/devre dışı pencereleri, modeller genelinde profilin tamamını yine de engeller.

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

Faturalama/kredi hataları (örneğin "insufficient credits" / "credit balance too low") yük devrine değer olarak değerlendirilir, ancak genellikle geçici değildir. Kısa bir bekleme süresi yerine OpenClaw, profili **devre dışı** olarak işaretler (daha uzun bir geri çekilme ile) ve sonraki profile/sağlayıcıya döner.

<Note>
Faturalama biçimli her yanıt `402` değildir ve her HTTP `402` buraya girmez. OpenClaw, bir sağlayıcı bunun yerine `401` veya `403` döndürse bile açık faturalama metnini faturalama hattında tutar, ancak sağlayıcıya özgü eşleştiriciler onları sahiplenen sağlayıcıyla kapsamlı kalır (örneğin OpenRouter `403 Key limit exceeded`).

Bu arada geçici `402` kullanım penceresi ve kuruluş/çalışma alanı harcama limiti hataları, ileti yeniden denenebilir göründüğünde (örneğin `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` veya `organization spending limit exceeded`) `rate_limit` olarak sınıflandırılır. Bunlar uzun faturalandırma devre dışı bırakma yolu yerine kısa bekleme/failover yolunda kalır.
</Note>

Durum `auth-state.json` içinde saklanır:

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

- Faturalandırma geri çekilmesi **5 saat** ile başlar, her faturalandırma hatasında ikiye katlanır ve **24 saat** ile sınırlanır.
- Profil **24 saat** boyunca başarısız olmadıysa geri çekilme sayaçları sıfırlanır (yapılandırılabilir).
- Aşırı yüklenmiş yeniden denemeler, model fallback öncesinde **1 aynı sağlayıcı profil rotasyonuna** izin verir.
- Aşırı yüklenmiş yeniden denemeler varsayılan olarak **0 ms geri çekilme** kullanır.

## Model fallback

Bir sağlayıcının tüm profilleri başarısız olursa OpenClaw `agents.defaults.model.fallbacks` içindeki sonraki modele geçer. Bu, profil rotasyonunu tüketmiş kimlik doğrulama hataları, hız limitleri ve zaman aşımları için geçerlidir (diğer hatalar fallback’i ilerletmez). Yeterli ayrıntı sunmayan sağlayıcı hataları fallback durumunda yine de kesin biçimde etiketlenir: `empty_response`, sağlayıcının kullanılabilir bir ileti veya durum döndürmediği anlamına gelir; `no_error_details`, sağlayıcının açıkça `Unknown error (no error details in response)` döndürdüğü anlamına gelir; `unclassified` ise OpenClaw’ın ham önizlemeyi koruduğu ancak henüz hiçbir sınıflandırıcının eşleşmediği anlamına gelir.

Aşırı yüklenmiş ve hız limiti hataları, faturalandırma beklemelerinden daha agresif ele alınır. OpenClaw varsayılan olarak bir aynı sağlayıcı kimlik doğrulama profili yeniden denemesine izin verir, sonra beklemeden sonraki yapılandırılmış model fallback’ine geçer. `ModelNotReadyException` gibi sağlayıcı-meşgul sinyalleri bu aşırı yüklenmiş kovasına girer. Bunu `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` ve `auth.cooldowns.rateLimitedProfileRotations` ile ayarlayın.

Bir çalışma, yapılandırılmış varsayılan birincilden, bir cron işi birincilinden, açık fallback’leri olan bir aracı birincilinden veya otomatik seçilmiş bir fallback geçersiz kılmasından başladığında OpenClaw eşleşen yapılandırılmış fallback zincirinde ilerleyebilir. Açık fallback’i olmayan aracı birincilleri ve açık kullanıcı seçimleri (örneğin `/model ollama/qwen3.5:27b`, model seçici, `sessions.patch` veya tek seferlik CLI sağlayıcı/model geçersiz kılmaları) katıdır: sağlayıcı/model erişilemezse veya yanıt üretmeden önce başarısız olursa OpenClaw alakasız bir fallback’ten yanıt vermek yerine hatayı bildirir.

### Aday zinciri kuralları

OpenClaw aday listesini o anda istenen `provider/model` ve yapılandırılmış fallback’lerden oluşturur.

<AccordionGroup>
  <Accordion title="Kurallar">
    - İstenen model her zaman ilk sıradadır.
    - Açık yapılandırılmış fallback’ler yinelenmez, ancak model izin listesine göre filtrelenmez. Bunlar açık operatör niyeti olarak ele alınır.
    - Geçerli çalışma aynı sağlayıcı ailesinde yapılandırılmış bir fallback üzerindeyse OpenClaw tam yapılandırılmış zinciri kullanmaya devam eder.
    - Açık fallback geçersiz kılması sağlanmadığında, yapılandırılmış fallback’ler istenen model farklı bir sağlayıcı kullansa bile yapılandırılmış birincilden önce denenir.
    - Fallback çalıştırıcısına açık fallback geçersiz kılması sağlanmadığında, yapılandırılmış birincil sona eklenir; böylece önceki adaylar tükendiğinde zincir normal varsayılana geri oturabilir.
    - Bir çağıran `fallbacksOverride` sağladığında, çalıştırıcı tam olarak istenen modeli ve bu geçersiz kılma listesini kullanır. Boş liste model fallback’ini devre dışı bırakır ve yapılandırılmış birincilin gizli yeniden deneme hedefi olarak eklenmesini önler.

  </Accordion>
</AccordionGroup>

### Hangi hatalar fallback’i ilerletir

<Tabs>
  <Tab title="Şunlarda devam eder">
    - kimlik doğrulama hataları
    - hız limitleri ve bekleme tükenmesi
    - aşırı yüklenmiş/sağlayıcı-meşgul hataları
    - zaman aşımı biçimli failover hataları
    - faturalandırma devre dışı bırakmaları
    - eski kalıcı modelin dış yeniden deneme döngüsü oluşturmaması için failover yoluna normalleştirilen `LiveSessionModelSwitchError`
    - hâlâ kalan adaylar varken diğer tanınmayan hatalar

  </Tab>
  <Tab title="Şunlarda devam etmez">
    - zaman aşımı/failover biçimli olmayan açık iptaller
    - Compaction/yeniden deneme mantığı içinde kalması gereken bağlam taşması hataları (örneğin `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` veya `ollama error: context length exceeded`)
    - geride aday kalmadığında son bilinmeyen hata

  </Tab>
</Tabs>

### Beklemeyi atlama ve yoklama davranışı

Bir sağlayıcı için her kimlik doğrulama profili zaten beklemedeyse OpenClaw bu sağlayıcıyı otomatik olarak sonsuza dek atlamaz. Her aday için ayrı karar verir:

<AccordionGroup>
  <Accordion title="Aday bazında kararlar">
    - Kalıcı kimlik doğrulama hataları tüm sağlayıcıyı hemen atlar.
    - Faturalandırma devre dışı bırakmaları genellikle atlanır, ancak yeniden başlatmadan kurtarma mümkün olsun diye birincil aday bir kısıtlama ile yoklanabilir.
    - Birincil aday, sağlayıcı başına kısıtlama ile bekleme süresinin bitimine yakın yoklanabilir.
    - Aynı sağlayıcı fallback kardeşleri, hata geçici görünüyorsa (`rate_limit`, `overloaded` veya bilinmeyen) beklemeye rağmen denenebilir. Bu, özellikle hız limiti model kapsamlı olduğunda ve kardeş model hemen toparlanabileceğinde önemlidir.
    - Geçici bekleme yoklamaları her fallback çalışması için sağlayıcı başına bir tane ile sınırlıdır; böylece tek bir sağlayıcı sağlayıcılar arası fallback’i durdurmaz.

  </Accordion>
</AccordionGroup>

## Oturum geçersiz kılmaları ve canlı model değiştirme

Oturum model değişiklikleri paylaşılan durumdur. Etkin çalıştırıcı, `/model` komutu, compaction/oturum güncellemeleri ve canlı oturum uzlaştırması aynı oturum girdisinin parçalarını okur veya yazar.

Bu, fallback yeniden denemelerinin canlı model değiştirme ile koordine olması gerektiği anlamına gelir:

- Yalnızca açık kullanıcı kaynaklı model değişiklikleri bekleyen canlı geçişi işaretler. Buna `/model`, `session_status(model=...)` ve `sessions.patch` dahildir.
- Fallback rotasyonu, Heartbeat geçersiz kılmaları veya Compaction gibi sistem kaynaklı model değişiklikleri kendi başına bekleyen canlı geçiş işaretlemez.
- Kullanıcı kaynaklı model geçersiz kılmaları fallback ilkesi için kesin seçimler olarak ele alınır; bu nedenle erişilemeyen seçili sağlayıcı, `agents.defaults.model.fallbacks` tarafından maskelenmek yerine hata olarak yüzeye çıkar.
- Bir fallback yeniden denemesi başlamadan önce yanıt çalıştırıcısı seçili fallback geçersiz kılma alanlarını oturum girdisine kalıcılaştırır.
- Otomatik fallback geçersiz kılmaları sonraki turlarda seçili kalır; böylece OpenClaw her iletide bilinen-kötü birincili yoklamaz. `/new`, `/reset` ve `sessions.reset` otomatik kaynaklı geçersiz kılmaları temizler ve oturumu yapılandırılmış varsayılana döndürür.
- `/status` seçili modeli ve fallback durumu farklı olduğunda etkin fallback modelini ve nedenini gösterir.
- Canlı oturum uzlaştırması, eski çalışma zamanı model alanları yerine kalıcı oturum geçersiz kılmalarını tercih eder.
- Bir canlı geçiş hatası etkin fallback zincirindeki daha sonraki bir adaya işaret ederse OpenClaw önce alakasız adaylarda ilerlemek yerine doğrudan seçili modele atlar.
- Fallback denemesi başarısız olursa çalıştırıcı yalnızca yazdığı geçersiz kılma alanlarını geri alır ve bunu yalnızca hâlâ o başarısız adayla eşleşiyorlarsa yapar.

Bu klasik yarışı önler:

<Steps>
  <Step title="Birincil başarısız olur">
    Seçili birincil model başarısız olur.
  </Step>
  <Step title="Fallback bellekte seçilir">
    Fallback adayı bellekte seçilir.
  </Step>
  <Step title="Oturum deposu hâlâ eski birincili söyler">
    Oturum deposu hâlâ eski birincili yansıtır.
  </Step>
  <Step title="Canlı uzlaştırma eski durumu okur">
    Canlı oturum uzlaştırması eski oturum durumunu okur.
  </Step>
  <Step title="Yeniden deneme geri alınır">
    Fallback denemesi başlamadan önce yeniden deneme eski modele geri çekilir.
  </Step>
</Steps>

Kalıcı fallback geçersiz kılması bu pencereyi kapatır ve dar geri alma daha yeni manuel veya çalışma zamanı oturum değişikliklerini korur.

## Gözlemlenebilirlik ve hata özetleri

`runWithModelFallback(...)`, günlükleri ve kullanıcıya dönük bekleme mesajlarını besleyen deneme başına ayrıntıları kaydeder:

- denenen sağlayıcı/model
- neden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` ve benzeri failover nedenleri)
- isteğe bağlı durum/kod
- insan tarafından okunabilir hata özeti

Yapılandırılmış `model_fallback_decision` günlükleri, bir aday başarısız olduğunda, atlandığında veya daha sonraki bir fallback başarılı olduğunda düz `fallbackStep*` alanlarını da içerir. Bu alanlar denenen geçişi açık hale getirir (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`); böylece günlük ve tanılama dışa aktarıcıları, son fallback de başarısız olsa bile birincil hatayı yeniden oluşturabilir.

Her aday başarısız olduğunda OpenClaw `FallbackSummaryError` fırlatır. Dış yanıt çalıştırıcısı bunu, "tüm modeller geçici olarak hız limitinde" gibi daha belirli bir ileti oluşturmak ve biliniyorsa en yakın bekleme bitişini eklemek için kullanabilir.

Bu bekleme özeti model farkındadır:

- denenen sağlayıcı/model zinciriyle ilgisiz model kapsamlı hız limitleri yok sayılır
- kalan engel eşleşen model kapsamlı bir hız limiti ise OpenClaw o modeli hâlâ engelleyen son eşleşen bitiş zamanını bildirir

## İlgili yapılandırma

Şunlar için [Gateway yapılandırması](/tr/gateway/configuration) bölümüne bakın:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` yönlendirmesi

Daha geniş model seçimi ve fallback genel bakışı için [Modeller](/tr/concepts/models) bölümüne bakın.
