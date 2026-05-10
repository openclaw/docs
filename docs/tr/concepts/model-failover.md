---
read_when:
    - Kimlik doğrulama profili rotasyonunu, bekleme sürelerini veya model geri dönüş davranışını tanılama
    - Kimlik doğrulama profilleri veya modeller için yük devretme kurallarını güncelleme
    - Oturum modeli geçersiz kılmalarının geri dönüş yeniden denemeleriyle nasıl etkileşime girdiğini anlama
sidebarTitle: Model failover
summary: OpenClaw kimlik doğrulama profillerini nasıl dönüşümlü kullanır ve modeller arasında nasıl yedeklere geçer
title: Model yük devretme
x-i18n:
    generated_at: "2026-05-10T19:32:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65de51fd4916aac8183a10afdfe3e0259cb85442de39e6d50fddf8a95bd420ae
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw hataları iki aşamada işler:

1. Geçerli sağlayıcı içinde **kimlik doğrulama profili rotasyonu**.
2. `agents.defaults.model.fallbacks` içindeki bir sonraki modele **model yedeğine geçiş**.

Bu belge, çalışma zamanı kurallarını ve bunları destekleyen verileri açıklar.

## Çalışma zamanı akışı

Normal bir metin çalıştırması için OpenClaw adayları şu sırayla değerlendirir:

<Steps>
  <Step title="Oturum durumunu çözümle">
    Etkin oturum modelini ve kimlik doğrulama profili tercihini çözümle.
  </Step>
  <Step title="Aday zincirini oluştur">
    Geçerli model seçiminden ve bu seçim kaynağına yönelik yedeğe geçiş ilkesinden model aday zincirini oluştur. Yapılandırılmış varsayılanlar, cron işi birincil modelleri ve otomatik seçilen yedek modeller yapılandırılmış yedekleri kullanabilir; açık kullanıcı oturumu seçimleri katıdır.
  </Step>
  <Step title="Geçerli sağlayıcıyı dene">
    Geçerli sağlayıcıyı kimlik doğrulama profili rotasyonu/soğuma kurallarıyla dene.
  </Step>
  <Step title="Devretmeye uygun hatalarda ilerle">
    Bu sağlayıcı devretmeye uygun bir hatayla tükenirse bir sonraki model adayına geç.
  </Step>
  <Step title="Yedek geçiş geçersiz kılmasını kalıcı hale getir">
    Yeniden deneme başlamadan önce seçilen yedek geçiş geçersiz kılmasını kalıcı hale getir; böylece diğer oturum okuyucuları, çalıştırıcının kullanmak üzere olduğu aynı sağlayıcıyı/modeli görür. Kalıcı hale getirilen model geçersiz kılması `modelOverrideSource: "auto"` olarak işaretlenir.
  </Step>
  <Step title="Başarısızlıkta dar kapsamda geri al">
    Yedek aday başarısız olursa yalnızca yedek geçişin sahip olduğu oturum geçersiz kılma alanlarını, hâlâ başarısız olan adayla eşleşiyorlarsa geri al.
  </Step>
  <Step title="Tükenirse FallbackSummaryError fırlat">
    Her aday başarısız olursa, deneme başına ayrıntı ve bilindiğinde en erken soğuma bitiş süresiyle birlikte bir `FallbackSummaryError` fırlat.
  </Step>
</Steps>

Bu, kasıtlı olarak "tüm oturumu kaydet ve geri yükle" yaklaşımından daha dardır. Yanıt çalıştırıcısı, yedek geçiş için yalnızca sahip olduğu model seçimi alanlarını kalıcı hale getirir:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Bu, başarısız bir yedek geçiş yeniden denemesinin, deneme çalışırken gerçekleşen manuel `/model` değişiklikleri veya oturum rotasyonu güncellemeleri gibi daha yeni ve ilgisiz oturum mutasyonlarının üzerine yazmasını engeller.

## Seçim kaynağı ilkesi

OpenClaw seçilen sağlayıcı/model ile neden seçildiğini ayrı tutar. Bu kaynak, yedek geçiş zincirine izin verilip verilmediğini kontrol eder:

- **Yapılandırılmış varsayılan**: `agents.defaults.model.primary`, `agents.defaults.model.fallbacks` kullanır.
- **Ajan birincil modeli**: `agents.list[].model`, ilgili ajan model nesnesi kendi `fallbacks` alanını içermedikçe katıdır. Katı davranışı açık hale getirmek için `fallbacks: []` kullanın veya ilgili ajanı model yedeğine geçişe dahil etmek için boş olmayan bir liste sağlayın.
- **Otomatik yedek geçiş geçersiz kılması**: bir çalışma zamanı yedek geçişi, yeniden denemeden önce `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` ve seçilen kaynak modeli yazar. Bu otomatik geçersiz kılma yapılandırılmış yedek geçiş zincirinde ilerlemeye devam edebilir ve `/new`, `/reset` ve `sessions.reset` tarafından temizlenir. Açık bir `heartbeat.model` olmadan çalışan Heartbeat çalıştırmaları da, kaynağı artık geçerli yapılandırılmış varsayılanla eşleşmediğinde doğrudan otomatik geçersiz kılmayı temizler.
- **Kullanıcı oturumu geçersiz kılması**: `/model`, model seçici, `session_status(model=...)` ve `sessions.patch`, `modelOverrideSource: "user"` yazar. Bu, kesin bir oturum seçimidir. Seçilen sağlayıcı/model bir yanıt üretmeden önce başarısız olursa OpenClaw ilgisiz bir yapılandırılmış yedekten yanıt vermek yerine hatayı bildirir.
- **Eski oturum geçersiz kılması**: daha eski oturum girdilerinde `modelOverrideSource` olmadan `modelOverride` bulunabilir. OpenClaw bunları kullanıcı geçersiz kılması olarak ele alır; böylece açık bir eski seçim sessizce yedek geçiş davranışına dönüştürülmez.
- **Cron yük modeli**: bir cron işi `payload.model` / `--model`, kullanıcı oturumu geçersiz kılması değil, işin birincil modelidir. İş `payload.fallbacks` sağlamadıkça yapılandırılmış yedekleri kullanır; `payload.fallbacks: []` cron çalıştırmasını katı hale getirir.

## Kimlik doğrulama depolaması (anahtarlar + OAuth)

OpenClaw hem API anahtarları hem de OAuth token'ları için **kimlik doğrulama profilleri** kullanır.

- Gizli bilgiler `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde yaşar (eski: `~/.openclaw/agent/auth-profiles.json`).
- Çalışma zamanı kimlik doğrulama yönlendirme durumu `~/.openclaw/agents/<agentId>/agent/auth-state.json` içinde yaşar.
- Config `auth.profiles` / `auth.order` yalnızca **metadata + routing** amaçlıdır (gizli bilgi içermez).
- Yalnızca eski içe aktarma OAuth dosyası: `~/.openclaw/credentials/oauth.json` (ilk kullanımda `auth-profiles.json` içine aktarılır).

Daha fazla ayrıntı: [OAuth](/tr/concepts/oauth)

Kimlik bilgisi türleri:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (bazı sağlayıcılar için + `projectId`/`enterpriseUrl`)

## Profil kimlikleri

OAuth oturum açmaları, birden fazla hesabın birlikte var olabilmesi için ayrı profiller oluşturur.

- Varsayılan: e-posta yoksa `provider:default`.
- E-posta ile OAuth: `provider:<email>` (örneğin `google-antigravity:user@gmail.com`).

Profiller `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde `profiles` altında yaşar.

## Rotasyon sırası

Bir sağlayıcıda birden fazla profil olduğunda OpenClaw sırayı şöyle seçer:

<Steps>
  <Step title="Açık yapılandırma">
    `auth.order[provider]` (ayarlanmışsa).
  </Step>
  <Step title="Yapılandırılmış profiller">
    Sağlayıcıya göre filtrelenmiş `auth.profiles`.
  </Step>
  <Step title="Depolanan profiller">
    Sağlayıcı için `auth-profiles.json` içindeki girdiler.
  </Step>
</Steps>

Açık bir sıra yapılandırılmamışsa OpenClaw round-robin sırası kullanır:

- **Birincil anahtar:** profil türü (**API anahtarlarından önce OAuth**).
- **İkincil anahtar:** `usageStats.lastUsed` (her tür içinde önce en eski).
- **Soğumada/devre dışı profiller** sona taşınır ve en yakın bitiş süresine göre sıralanır.

### Oturum yapışkanlığı (önbellek dostu)

OpenClaw sağlayıcı önbelleklerini sıcak tutmak için **seçilen kimlik doğrulama profilini oturum başına sabitler**. Her istekte rotasyon yapmaz. Sabitlenen profil şu durumlara kadar yeniden kullanılır:

- oturum sıfırlanır (`/new` / `/reset`)
- bir Compaction tamamlanır (compaction sayısı artar)
- profil soğumada/devre dışıdır

`/model …@<profileId>` üzerinden manuel seçim, ilgili oturum için bir **kullanıcı geçersiz kılması** ayarlar ve yeni bir oturum başlayana kadar otomatik olarak döndürülmez.

<Note>
Otomatik sabitlenen profiller (oturum yönlendiricisi tarafından seçilenler) bir **tercih** olarak ele alınır: önce bunlar denenir, ancak OpenClaw hız sınırlarında/zaman aşımlarında başka bir profile dönebilir. Kullanıcı tarafından sabitlenen profiller ilgili profile kilitli kalır; başarısız olursa ve model yedekleri yapılandırılmışsa OpenClaw profil değiştirmek yerine bir sonraki modele geçer.
</Note>

### OAuth neden "kaybolmuş gibi görünebilir"

Aynı sağlayıcı için hem bir OAuth profiliniz hem de bir API anahtarı profiliniz varsa, sabitlenmedikçe round-robin iletiler arasında bunlar arasında geçiş yapabilir. Tek bir profili zorlamak için:

- `auth.order[provider] = ["provider:profileId"]` ile sabitleyin veya
- Profil geçersiz kılmasıyla `/model …` üzerinden oturum başına geçersiz kılma kullanın (UI/sohbet yüzeyiniz desteklediğinde).

## Soğumalar

Bir profil kimlik doğrulama/hız sınırı hataları nedeniyle (veya hız sınırlaması gibi görünen bir zaman aşımı nedeniyle) başarısız olduğunda OpenClaw onu soğumada işaretler ve bir sonraki profile geçer.

<AccordionGroup>
  <Accordion title="Hız sınırı / zaman aşımı kovasına neler girer">
    Bu hız sınırı kovası düz `429` değerinden daha geniştir: `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` gibi sağlayıcı iletilerini ve `weekly/monthly limit reached` gibi periyodik kullanım penceresi sınırlarını da içerir.

    Biçim/geçersiz istek hataları genellikle terminaldir çünkü aynı yükü yeniden denemek aynı şekilde başarısız olur; bu yüzden OpenClaw kimlik doğrulama profillerini döndürmek yerine bunları yüzeye çıkarır. Bilinen yeniden deneme-onarma yolları açıkça dahil olabilir: örneğin Cloud Code Assist araç çağrısı kimlik doğrulama hataları temizlenir ve `allowFormatRetry` ilkesi üzerinden bir kez yeniden denenir. `Unhandled stop reason: error`, `stop reason: error` ve `reason: error` gibi OpenAI uyumlu durma nedeni hataları zaman aşımı/devretme sinyalleri olarak sınıflandırılır.

    Kaynak bilinen geçici bir desenle eşleştiğinde genel sunucu metni de bu zaman aşımı kovasına girebilir. Örneğin yalın pi-ai akış sarmalayıcı iletisi `An unknown error occurred`, her sağlayıcı için devretmeye uygun kabul edilir çünkü pi-ai bunu sağlayıcı akışları belirli ayrıntılar olmadan `stopReason: "aborted"` veya `stopReason: "error"` ile bittiğinde yayar. `internal server error`, `unknown error, 520`, `upstream error` veya `backend error` gibi geçici sunucu metinleri içeren JSON `api_error` yükleri de devretmeye uygun zaman aşımları olarak ele alınır.

    Yalın `Provider returned error` gibi OpenRouter’a özgü genel upstream metinleri yalnızca sağlayıcı bağlamı gerçekten OpenRouter olduğunda zaman aşımı olarak ele alınır. `LLM request failed with an unknown error.` gibi genel dahili yedek geçiş metinleri temkinli kalır ve tek başına devretmeyi tetiklemez.

  </Accordion>
  <Accordion title="SDK retry-after sınırları">
    Bazı sağlayıcı SDK’ları aksi halde denetimi OpenClaw’a geri vermeden önce uzun bir `Retry-After` penceresi boyunca bekleyebilir. Anthropic ve OpenAI gibi Stainless tabanlı SDK’lar için OpenClaw, SDK içi `retry-after-ms` / `retry-after` beklemelerini varsayılan olarak 60 saniyeyle sınırlar ve bu devretme yolunun çalışabilmesi için daha uzun yeniden denenebilir yanıtları hemen yüzeye çıkarır. Sınırı `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` ile ayarlayın veya devre dışı bırakın; bkz. [Yeniden deneme davranışı](/tr/concepts/retry).
  </Accordion>
  <Accordion title="Model kapsamlı soğumalar">
    Hız sınırı soğumaları model kapsamlı da olabilir:

    - OpenClaw, başarısız olan model kimliği bilindiğinde hız sınırı başarısızlıkları için `cooldownModel` kaydeder.
    - Aynı sağlayıcıdaki kardeş bir model, soğuma farklı bir modele kapsamlandırılmışsa hâlâ denenebilir.
    - Faturalama/devre dışı pencereleri modeller arasında tüm profili engellemeye devam eder.

  </Accordion>
</AccordionGroup>

Soğumalar üstel backoff kullanır:

- 1 dakika
- 5 dakika
- 25 dakika
- 1 saat (üst sınır)

Durum `auth-state.json` içinde `usageStats` altında depolanır:

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

Faturalama/kredi hataları (örneğin "insufficient credits" / "credit balance too low") devretmeye uygun kabul edilir, ancak genellikle geçici değildir. Kısa bir soğuma yerine OpenClaw profili **devre dışı** olarak işaretler (daha uzun bir backoff ile) ve bir sonraki profile/sağlayıcıya döner.

<Note>
Faturalama biçimindeki her yanıt `402` değildir ve her HTTP `402` buraya düşmez. OpenClaw, sağlayıcı bunun yerine `401` veya `403` döndürse bile açık faturalama metnini faturalama hattında tutar; ancak sağlayıcıya özgü eşleştiriciler onları sahiplenen sağlayıcıyla sınırlı kalır (örneğin OpenRouter `403 Key limit exceeded`).

Bu sırada geçici `402` kullanım penceresi ve organizasyon/çalışma alanı harcama sınırı hataları, ileti yeniden denenebilir göründüğünde `rate_limit` olarak sınıflandırılır (örneğin `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` veya `organization spending limit exceeded`). Bunlar uzun faturalama-devre dışı bırakma yolu yerine kısa soğuma/devretme yolunda kalır.
</Note>

Durum `auth-state.json` içinde depolanır:

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

- Faturalama backoff’u **5 saat** ile başlar, her faturalama başarısızlığinde ikiye katlanır ve **24 saat** üst sınırına ulaşır.
- Profil **24 saat** boyunca başarısız olmadıysa backoff sayaçları sıfırlanır (yapılandırılabilir).
- Aşırı yüklenmiş yeniden denemeler, model yedeğine geçişten önce **aynı sağlayıcı içinde 1 profil rotasyonuna** izin verir.
- Aşırı yüklenmiş yeniden denemeler varsayılan olarak **0 ms backoff** kullanır.

## Model yedeğine geçiş

Tüm profiller bir sağlayıcı için başarısız olursa, OpenClaw `agents.defaults.model.fallbacks` içindeki sonraki modele geçer. Bu, profil döndürmeyi tüketen kimlik doğrulama hataları, hız sınırları ve zaman aşımları için geçerlidir (diğer hatalar geri dönüşü ilerletmez). Yeterli ayrıntı göstermeyen sağlayıcı hataları yine de geri dönüş durumunda kesin olarak etiketlenir: `empty_response`, sağlayıcının kullanılabilir bir ileti veya durum döndürmediği anlamına gelir; `no_error_details`, sağlayıcının açıkça `Unknown error (no error details in response)` döndürdüğü anlamına gelir; `unclassified` ise OpenClaw’ın ham önizlemeyi koruduğu ancak henüz hiçbir sınıflandırıcının onunla eşleşmediği anlamına gelir.

Aşırı yük ve hız sınırı hataları, faturalandırma bekleme sürelerinden daha agresif şekilde işlenir. Varsayılan olarak OpenClaw aynı sağlayıcıda bir kimlik doğrulama profili yeniden denemesine izin verir, ardından beklemeden yapılandırılmış sonraki model geri dönüşüne geçer. `ModelNotReadyException` gibi sağlayıcı meşgul sinyalleri bu aşırı yük kategorisine girer. Bunu `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` ve `auth.cooldowns.rateLimitedProfileRotations` ile ayarlayın.

Bir çalışma yapılandırılmış varsayılan birincilden, bir Cron işi birincilinden, açık geri dönüşleri olan bir aracı birincilinden veya otomatik seçilmiş bir geri dönüş geçersiz kılmasından başladığında, OpenClaw eşleşen yapılandırılmış geri dönüş zincirinde ilerleyebilir. Açık geri dönüşleri olmayan aracı birincilleri ve açık kullanıcı seçimleri (örneğin `/model ollama/qwen3.5:27b`, model seçici, `sessions.patch` veya tek seferlik CLI sağlayıcı/model geçersiz kılmaları) katıdır: bu sağlayıcı/model erişilemezse veya bir yanıt üretmeden önce başarısız olursa, OpenClaw ilgisiz bir geri dönüşten yanıtlamak yerine hatayı bildirir.

### Aday zincir kuralları

OpenClaw aday listesini şu anda istenen `provider/model` ve yapılandırılmış geri dönüşlerden oluşturur.

<AccordionGroup>
  <Accordion title="Rules">
    - İstenen model her zaman ilk sıradadır.
    - Açık yapılandırılmış geri dönüşlerde yinelenenler kaldırılır, ancak model izin listesine göre filtrelenmez. Bunlar açık operatör niyeti olarak ele alınır.
    - Geçerli çalışma aynı sağlayıcı ailesindeki yapılandırılmış bir geri dönüş üzerindeyse, OpenClaw tam yapılandırılmış zinciri kullanmayı sürdürür.
    - Geçerli çalışma yapılandırmadan farklı bir sağlayıcı üzerindeyse ve bu geçerli model yapılandırılmış geri dönüş zincirinin zaten bir parçası değilse, OpenClaw başka bir sağlayıcıdan ilgisiz yapılandırılmış geri dönüşler eklemez.
    - Geri dönüş çalıştırıcısına açık bir geri dönüş geçersiz kılması sağlanmadığında, yapılandırılmış birincil sona eklenir; böylece önceki adaylar tükendiğinde zincir normal varsayılana geri dönebilir.
    - Bir çağıran `fallbacksOverride` sağladığında, çalıştırıcı tam olarak istenen modeli ve bu geçersiz kılma listesini kullanır. Boş liste, model geri dönüşünü devre dışı bırakır ve yapılandırılmış birincilin gizli yeniden deneme hedefi olarak eklenmesini önler.

  </Accordion>
</AccordionGroup>

### Hangi hatalar geri dönüşü ilerletir

<Tabs>
  <Tab title="Continues on">
    - kimlik doğrulama hataları
    - hız sınırları ve bekleme süresi tükenmesi
    - aşırı yük/sağlayıcı meşgul hataları
    - zaman aşımı biçimli devretme hataları
    - faturalandırma devre dışı bırakmaları
    - `LiveSessionModelSwitchError`; eski kalıcı modelin dış bir yeniden deneme döngüsü oluşturmaması için bir devretme yoluna normalleştirilir
    - hâlâ kalan adaylar varken diğer tanınmayan hatalar

  </Tab>
  <Tab title="Does not continue on">
    - zaman aşımı/devretme biçimli olmayan açık iptaller
    - Compaction/yeniden deneme mantığı içinde kalması gereken bağlam taşması hataları (örneğin `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` veya `ollama error: context length exceeded`)
    - kalan aday yokken son bir bilinmeyen hata

  </Tab>
</Tabs>

### Bekleme süresi atlama ve yoklama davranışı

Bir sağlayıcı için her kimlik doğrulama profili zaten bekleme süresindeyse, OpenClaw bu sağlayıcıyı otomatik olarak sonsuza dek atlamaz. Aday başına karar verir:

<AccordionGroup>
  <Accordion title="Per-candidate decisions">
    - Kalıcı kimlik doğrulama hataları tüm sağlayıcıyı hemen atlar.
    - Faturalandırma devre dışı bırakmaları genellikle atlar, ancak birincil aday yine de sınırlı aralıklarla yoklanabilir; böylece yeniden başlatmadan kurtarma mümkün olur.
    - Birincil aday, sağlayıcı başına bir sınırlamayla bekleme süresinin sona ermesine yakın yoklanabilir.
    - Hata geçici görünüyorsa (`rate_limit`, `overloaded` veya bilinmeyen), aynı sağlayıcıdaki geri dönüş kardeşleri bekleme süresine rağmen denenebilir. Bu, özellikle hız sınırı model kapsamlı olduğunda ve kardeş bir model hemen toparlanabildiğinde önemlidir.
    - Geçici bekleme süresi yoklamaları, tek bir sağlayıcının sağlayıcılar arası geri dönüşü durdurmaması için her geri dönüş çalışmasında sağlayıcı başına bir ile sınırlıdır.

  </Accordion>
</AccordionGroup>

## Oturum geçersiz kılmaları ve canlı model değiştirme

Oturum model değişiklikleri paylaşılan durumdur. Etkin çalıştırıcı, `/model` komutu, Compaction/oturum güncellemeleri ve canlı oturum uzlaştırması aynı oturum girdisinin parçalarını okur veya yazar.

Bu, geri dönüş yeniden denemelerinin canlı model değiştirme ile koordine edilmesi gerektiği anlamına gelir:

- Yalnızca açık kullanıcı güdümlü model değişiklikleri bekleyen canlı geçişi işaretler. Buna `/model`, `session_status(model=...)` ve `sessions.patch` dahildir.
- Geri dönüş döndürme, Heartbeat geçersiz kılmaları veya Compaction gibi sistem güdümlü model değişiklikleri tek başına bekleyen canlı geçiş işaretlemez.
- Kullanıcı güdümlü model geçersiz kılmaları, geri dönüş politikası için kesin seçimler olarak ele alınır; bu nedenle erişilemeyen seçilmiş sağlayıcı, `agents.defaults.model.fallbacks` tarafından gizlenmek yerine hata olarak görünür.
- Bir geri dönüş yeniden denemesi başlamadan önce, yanıt çalıştırıcısı seçilen geri dönüş geçersiz kılma alanlarını oturum girdisine kalıcı olarak yazar.
- Otomatik geri dönüş geçersiz kılmaları sonraki turlarda seçili kalır; böylece OpenClaw her iletide bilinen hatalı birincili yoklamaz. `/new`, `/reset` ve `sessions.reset`, otomatik kaynaklı geçersiz kılmaları temizler ve oturumu yapılandırılmış varsayılana döndürür.
- `/status`, seçilen modeli ve geri dönüş durumu farklı olduğunda etkin geri dönüş modelini ve nedenini gösterir.
- Canlı oturum uzlaştırması, eski çalışma zamanı model alanları yerine kalıcı oturum geçersiz kılmalarını tercih eder.
- Canlı geçiş hatası etkin geri dönüş zincirindeki daha sonraki bir adayı işaret ediyorsa, OpenClaw önce ilgisiz adayları dolaşmak yerine doğrudan seçilen modele atlar.
- Geri dönüş denemesi başarısız olursa, çalıştırıcı yalnızca yazdığı geçersiz kılma alanlarını ve yalnızca hâlâ başarısız adayla eşleşiyorlarsa geri alır.

Bu klasik yarışı önler:

<Steps>
  <Step title="Primary fails">
    Seçilen birincil model başarısız olur.
  </Step>
  <Step title="Fallback chosen in memory">
    Geri dönüş adayı bellekte seçilir.
  </Step>
  <Step title="Session store still says old primary">
    Oturum deposu hâlâ eski birincili yansıtır.
  </Step>
  <Step title="Live reconciliation reads stale state">
    Canlı oturum uzlaştırması eski oturum durumunu okur.
  </Step>
  <Step title="Retry snapped back">
    Yeniden deneme, geri dönüş denemesi başlamadan önce eski modele geri çekilir.
  </Step>
</Steps>

Kalıcı geri dönüş geçersiz kılması bu pencereyi kapatır ve dar geri alma daha yeni manuel veya çalışma zamanı oturum değişikliklerini korur.

## Gözlemlenebilirlik ve hata özetleri

`runWithModelFallback(...)`, günlükleri ve kullanıcıya gösterilen bekleme süresi iletilerini besleyen deneme başına ayrıntıları kaydeder:

- denenen sağlayıcı/model
- neden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` ve benzer devretme nedenleri)
- isteğe bağlı durum/kod
- insan tarafından okunabilir hata özeti

Yapılandırılmış `model_fallback_decision` günlükleri, bir aday başarısız olduğunda, atlandığında veya daha sonraki bir geri dönüş başarılı olduğunda düz `fallbackStep*` alanlarını da içerir. Bu alanlar denenen geçişi açık hale getirir (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`); böylece günlük ve tanılama dışa aktarıcıları, son geri dönüş de başarısız olsa bile birincil hatayı yeniden oluşturabilir.

Her aday başarısız olduğunda OpenClaw `FallbackSummaryError` fırlatır. Dış yanıt çalıştırıcısı bunu, "tüm modeller geçici olarak hız sınırında" gibi daha belirli bir ileti oluşturmak ve biliniyorsa en yakın bekleme süresi bitişini dahil etmek için kullanabilir.

Bu bekleme süresi özeti model farkındadır:

- denenen sağlayıcı/model zinciriyle ilgisiz model kapsamlı hız sınırları yok sayılır
- kalan engel eşleşen model kapsamlı bir hız sınırıysa, OpenClaw o modeli hâlâ engelleyen son eşleşen sona erme zamanını bildirir

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
