---
read_when:
    - Kimlik doğrulama profili rotasyonunu, bekleme sürelerini veya model geri dönüş davranışını tanılama
    - Kimlik doğrulama profilleri veya modeller için yük devretme kurallarını güncelleme
    - Oturum modeli geçersiz kılmalarının geri dönüş yeniden denemeleriyle nasıl etkileşime girdiğini anlama
sidebarTitle: Model failover
summary: OpenClaw kimlik doğrulama profillerini nasıl sırayla kullanır ve modeller arasında yedeklere nasıl geçer
title: Model yük devri
x-i18n:
    generated_at: "2026-05-06T09:08:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9a77ec2bd4a959db5a56e53b002b8bc5ea9a2efe3c914da61ac8d25de41d6c1
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw hataları iki aşamada ele alır:

1. Geçerli sağlayıcı içinde **kimlik doğrulama profili rotasyonu**.
2. `agents.defaults.model.fallbacks` içindeki sonraki modele **model yedek geçişi**.

Bu belge, çalışma zamanı kurallarını ve bunları destekleyen verileri açıklar.

## Çalışma zamanı akışı

Normal bir metin çalıştırması için OpenClaw adayları şu sırayla değerlendirir:

<Steps>
  <Step title="Oturum durumunu çözümle">
    Etkin oturum modelini ve kimlik doğrulama profili tercihini çözümle.
  </Step>
  <Step title="Aday zinciri oluştur">
    Geçerli model seçiminden ve o seçim kaynağına ait yedek geçiş politikasından model aday zincirini oluştur. Yapılandırılmış varsayılanlar, cron işi birincilleri ve otomatik seçilmiş yedek modeller yapılandırılmış yedekleri kullanabilir; açık kullanıcı oturumu seçimleri katıdır.
  </Step>
  <Step title="Geçerli sağlayıcıyı dene">
    Geçerli sağlayıcıyı kimlik doğrulama profili rotasyonu/cooldown kurallarıyla dene.
  </Step>
  <Step title="Devretmeye uygun hatalarda ilerle">
    Bu sağlayıcı devretmeye uygun bir hatayla tükenirse sonraki model adayına geç.
  </Step>
  <Step title="Yedek geçiş geçersiz kılmasını kalıcılaştır">
    Yeniden deneme başlamadan önce seçilen yedek geçiş geçersiz kılmasını kalıcılaştır; böylece diğer oturum okuyucuları çalıştırıcının kullanmak üzere olduğu aynı sağlayıcıyı/modeli görür. Kalıcılaştırılan model geçersiz kılması `modelOverrideSource: "auto"` olarak işaretlenir.
  </Step>
  <Step title="Hata durumunda dar kapsamlı geri al">
    Yedek aday başarısız olursa yalnızca yedek geçişe ait oturum geçersiz kılma alanlarını, hâlâ bu başarısız adayla eşleşiyorlarsa geri al.
  </Step>
  <Step title="Tükendiyse FallbackSummaryError fırlat">
    Her aday başarısız olursa deneme başına ayrıntı ve biliniyorsa en yakın cooldown bitişiyle birlikte bir `FallbackSummaryError` fırlat.
  </Step>
</Steps>

Bu, bilinçli olarak "tüm oturumu kaydet ve geri yükle" yaklaşımından daha dardır. Yanıt çalıştırıcısı yalnızca yedek geçiş için sahip olduğu model seçimi alanlarını kalıcılaştırır:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Bu, başarısız bir yedek geçiş yeniden denemesinin, deneme çalışırken gerçekleşen manuel `/model` değişiklikleri veya oturum rotasyonu güncellemeleri gibi daha yeni ve ilgisiz oturum mutasyonlarının üzerine yazmasını önler.

## Seçim kaynağı politikası

OpenClaw, seçilen sağlayıcı/model ile bunun neden seçildiğini birbirinden ayırır. Bu kaynak, yedek geçiş zincirine izin verilip verilmediğini kontrol eder:

- **Yapılandırılmış varsayılan**: `agents.defaults.model.primary`, `agents.defaults.model.fallbacks` kullanır.
- **Agent birincili**: `agents.list[].model`, ilgili agent model nesnesi kendi `fallbacks` değerini içermedikçe katıdır. Katı davranışı açık yapmak için `fallbacks: []` kullanın veya bu agent için model yedek geçişini etkinleştirmek üzere boş olmayan bir liste sağlayın.
- **Otomatik yedek geçiş geçersiz kılması**: çalışma zamanı yedek geçişi, yeniden denemeden önce `providerOverride`, `modelOverride` ve `modelOverrideSource: "auto"` yazar. Bu otomatik geçersiz kılma, yapılandırılmış yedek geçiş zincirinde ilerlemeye devam edebilir ve `/new`, `/reset` ve `sessions.reset` tarafından temizlenir.
- **Kullanıcı oturumu geçersiz kılması**: `/model`, model seçici, `session_status(model=...)` ve `sessions.patch`, `modelOverrideSource: "user"` yazar. Bu, tam bir oturum seçimidir. Seçilen sağlayıcı/model yanıt üretmeden önce başarısız olursa OpenClaw ilgisiz bir yapılandırılmış yedekten yanıt vermek yerine hatayı bildirir.
- **Eski oturum geçersiz kılması**: eski oturum girdilerinde `modelOverrideSource` olmadan `modelOverride` bulunabilir. OpenClaw bunları kullanıcı geçersiz kılmaları olarak değerlendirir; böylece açık eski bir seçim sessizce yedek geçiş davranışına dönüştürülmez.
- **Cron yük modeli**: bir cron işi `payload.model` / `--model`, kullanıcı oturumu geçersiz kılması değil, iş birincilidir. İş `payload.fallbacks` sağlamadıkça yapılandırılmış yedekleri kullanır; `payload.fallbacks: []` cron çalıştırmasını katı yapar.

## Kimlik doğrulama depolaması (anahtarlar + OAuth)

OpenClaw hem API anahtarları hem de OAuth token'ları için **kimlik doğrulama profilleri** kullanır.

- Gizli bilgiler `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde tutulur (eski: `~/.openclaw/agent/auth-profiles.json`).
- Çalışma zamanı kimlik doğrulama yönlendirme durumu `~/.openclaw/agents/<agentId>/agent/auth-state.json` içinde tutulur.
- Config `auth.profiles` / `auth.order` yalnızca **metadata + routing** içindir (gizli bilgi yoktur).
- Yalnızca eski içe aktarma OAuth dosyası: `~/.openclaw/credentials/oauth.json` (ilk kullanımda `auth-profiles.json` içine aktarılır).

Daha fazla ayrıntı: [OAuth](/tr/concepts/oauth)

Kimlik bilgisi türleri:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (bazı sağlayıcılar için + `projectId`/`enterpriseUrl`)

## Profil kimlikleri

OAuth oturum açmaları, birden fazla hesabın birlikte var olabilmesi için ayrı profiller oluşturur.

- Varsayılan: e-posta yoksa `provider:default`.
- E-posta ile OAuth: `provider:<email>` (örneğin `google-antigravity:user@gmail.com`).

Profiller `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde `profiles` altında tutulur.

## Rotasyon sırası

Bir sağlayıcının birden fazla profili olduğunda OpenClaw şu şekilde bir sıra seçer:

<Steps>
  <Step title="Açık yapılandırma">
    `auth.order[provider]` (ayarlanmışsa).
  </Step>
  <Step title="Yapılandırılmış profiller">
    Sağlayıcıya göre filtrelenmiş `auth.profiles`.
  </Step>
  <Step title="Saklanan profiller">
    Sağlayıcı için `auth-profiles.json` içindeki girdiler.
  </Step>
</Steps>

Açık bir sıra yapılandırılmamışsa OpenClaw round-robin sırası kullanır:

- **Birincil anahtar:** profil türü (**OAuth, API anahtarlarından önce**).
- **İkincil anahtar:** `usageStats.lastUsed` (her tür içinde en eski önce).
- **Cooldown/devre dışı profiller** sona taşınır ve en yakın bitişe göre sıralanır.

### Oturum yapışkanlığı (cache dostu)

OpenClaw, sağlayıcı önbelleklerini sıcak tutmak için **seçilen kimlik doğrulama profilini oturum başına sabitler**. Her istekte rotasyon yapmaz. Sabitlenen profil şu durumlara kadar yeniden kullanılır:

- oturum sıfırlanırsa (`/new` / `/reset`)
- bir Compaction tamamlanırsa (Compaction sayısı artar)
- profil cooldown/devre dışı durumundaysa

`/model …@<profileId>` ile manuel seçim, o oturum için bir **kullanıcı geçersiz kılması** ayarlar ve yeni bir oturum başlayana kadar otomatik rotasyona sokulmaz.

<Note>
Otomatik sabitlenen profiller (oturum yönlendiricisi tarafından seçilenler) bir **tercih** olarak ele alınır: önce onlar denenir, ancak OpenClaw hız sınırları/zaman aşımlarında başka bir profile dönebilir. Kullanıcı tarafından sabitlenen profiller o profilde kilitli kalır; başarısız olursa ve model yedekleri yapılandırılmışsa OpenClaw profil değiştirmek yerine sonraki modele geçer.
</Note>

### OAuth neden "kaybolmuş gibi görünebilir"

Aynı sağlayıcı için hem OAuth profili hem de API anahtarı profili varsa round-robin, sabitlenmedikçe iletiler arasında bunlar arasında geçiş yapabilir. Tek bir profili zorlamak için:

- `auth.order[provider] = ["provider:profileId"]` ile sabitleyin veya
- Profil geçersiz kılmasıyla `/model …` üzerinden oturum başına geçersiz kılma kullanın (UI/sohbet yüzeyiniz destekliyorsa).

## Cooldown'lar

Bir profil kimlik doğrulama/hız sınırı hataları nedeniyle (veya hız sınırlaması gibi görünen bir zaman aşımıyla) başarısız olduğunda OpenClaw onu cooldown'a alır ve sonraki profile geçer.

<AccordionGroup>
  <Accordion title="Hız sınırı / zaman aşımı sepetine girenler">
    Bu hız sınırı sepeti düz `429` değerinden daha geniştir: `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` gibi sağlayıcı iletilerini ve `weekly/monthly limit reached` gibi dönemsel kullanım penceresi sınırlarını da içerir.

    Format/geçersiz istek hataları (örneğin Cloud Code Assist araç çağrısı kimliği doğrulama hataları) devretmeye uygun kabul edilir ve aynı cooldown'ları kullanır. `Unhandled stop reason: error`, `stop reason: error` ve `reason: error` gibi OpenAI uyumlu durma nedeni hataları, zaman aşımı/devretme sinyalleri olarak sınıflandırılır.

    Kaynak bilinen geçici bir desenle eşleştiğinde genel sunucu metni de bu zaman aşımı sepetine girebilir. Örneğin çıplak pi-ai stream-wrapper iletisi `An unknown error occurred`, her sağlayıcı için devretmeye uygun kabul edilir; çünkü pi-ai, sağlayıcı akışları özel ayrıntılar olmadan `stopReason: "aborted"` veya `stopReason: "error"` ile bittiğinde bunu yayar. `internal server error`, `unknown error, 520`, `upstream error` veya `backend error` gibi geçici sunucu metnine sahip JSON `api_error` yükleri de devretmeye uygun zaman aşımları olarak değerlendirilir.

    Çıplak `Provider returned error` gibi OpenRouter'a özgü genel upstream metin, yalnızca sağlayıcı bağlamı gerçekten OpenRouter olduğunda zaman aşımı olarak ele alınır. `LLM request failed with an unknown error.` gibi genel dahili yedek metinler muhafazakar kalır ve tek başına devretmeyi tetiklemez.

  </Accordion>
  <Accordion title="SDK retry-after sınırları">
    Bazı sağlayıcı SDK'ları, kontrolü OpenClaw'a geri vermeden önce uzun bir `Retry-After` penceresi boyunca bekleyebilir. Anthropic ve OpenAI gibi Stainless tabanlı SDK'lar için OpenClaw, SDK içi `retry-after-ms` / `retry-after` beklemelerini varsayılan olarak 60 saniyeyle sınırlar ve daha uzun yeniden denenebilir yanıtları hemen yüzeye çıkarır; böylece bu devretme yolu çalışabilir. Sınırı `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` ile ayarlayın veya devre dışı bırakın; bkz. [Yeniden deneme davranışı](/tr/concepts/retry).
  </Accordion>
  <Accordion title="Model kapsamlı cooldown'lar">
    Hız sınırı cooldown'ları model kapsamlı da olabilir:

    - OpenClaw, başarısız olan model kimliği bilindiğinde hız sınırı hataları için `cooldownModel` kaydeder.
    - Cooldown farklı bir modele kapsamlanmışsa aynı sağlayıcıdaki kardeş model hâlâ denenebilir.
    - Faturalandırma/devre dışı pencereleri yine de tüm profili modeller genelinde engeller.

  </Accordion>
</AccordionGroup>

Cooldown'lar üstel backoff kullanır:

- 1 dakika
- 5 dakika
- 25 dakika
- 1 saat (üst sınır)

Durum `auth-state.json` içinde `usageStats` altında saklanır:

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

## Faturalandırma devre dışı bırakmaları

Faturalandırma/kredi hataları (örneğin "insufficient credits" / "credit balance too low") devretmeye uygun kabul edilir, ancak genellikle geçici değildir. Kısa bir cooldown yerine OpenClaw profili **devre dışı** olarak işaretler (daha uzun bir backoff ile) ve sonraki profile/sağlayıcıya döner.

<Note>
Faturalandırma biçimli her yanıt `402` değildir ve her HTTP `402` buraya düşmez. OpenClaw, bir sağlayıcı bunun yerine `401` veya `403` döndürse bile açık faturalandırma metnini faturalandırma hattında tutar, ancak sağlayıcıya özgü eşleştiriciler kendi sahibi olan sağlayıcıyla sınırlı kalır (örneğin OpenRouter `403 Key limit exceeded`).

Bu arada geçici `402` kullanım penceresi ve kuruluş/çalışma alanı harcama sınırı hataları, ileti yeniden denenebilir görünüyorsa `rate_limit` olarak sınıflandırılır (örneğin `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` veya `organization spending limit exceeded`). Bunlar uzun faturalandırma devre dışı bırakma yolu yerine kısa cooldown/devretme yolunda kalır.
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

- Faturalandırma backoff'u **5 saat** ile başlar, her faturalandırma hatasında ikiye katlanır ve **24 saat** ile sınırlanır.
- Profil **24 saat** boyunca başarısız olmadıysa backoff sayaçları sıfırlanır (yapılandırılabilir).
- Aşırı yüklenmiş yeniden denemeler, model yedek geçişinden önce **1 aynı sağlayıcı profil rotasyonuna** izin verir.
- Aşırı yüklenmiş yeniden denemeler varsayılan olarak **0 ms backoff** kullanır.

## Model yedek geçişi

Bir sağlayıcının tüm profilleri başarısız olursa OpenClaw `agents.defaults.model.fallbacks` içindeki sonraki modele geçer. Bu, profil rotasyonunu tüketen kimlik doğrulama hataları, hız sınırları ve zaman aşımları için geçerlidir (diğer hatalar yedek geçişi ilerletmez). Yeterli ayrıntı göstermeyen sağlayıcı hataları yine de yedek geçiş durumunda kesin biçimde etiketlenir: `empty_response`, sağlayıcının kullanılabilir ileti veya durum döndürmediği anlamına gelir; `no_error_details`, sağlayıcının açıkça `Unknown error (no error details in response)` döndürdüğü anlamına gelir; `unclassified` ise OpenClaw'ın ham önizlemeyi koruduğu ancak henüz hiçbir sınıflandırıcının bununla eşleşmediği anlamına gelir.

Aşırı yük ve oran sınırı hataları, faturalandırma bekleme sürelerinden daha agresif şekilde ele alınır. Varsayılan olarak OpenClaw, aynı sağlayıcı için bir kimlik doğrulama profili yeniden denemesine izin verir, ardından beklemeden yapılandırılmış bir sonraki model geri dönüşüne geçer. `ModelNotReadyException` gibi sağlayıcı meşgul sinyalleri bu aşırı yük kovasına girer. Bunu `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` ve `auth.cooldowns.rateLimitedProfileRotations` ile ayarlayın.

Bir çalıştırma yapılandırılmış varsayılan birincilden, bir cron işi birincilinden, açık geri dönüşleri olan bir aracı birincilinden veya otomatik seçilmiş bir geri dönüş geçersiz kılmasından başladığında, OpenClaw eşleşen yapılandırılmış geri dönüş zincirini izleyebilir. Açık geri dönüşleri olmayan aracı birincilleri ve açık kullanıcı seçimleri (örneğin `/model ollama/qwen3.5:27b`, model seçici, `sessions.patch` veya tek seferlik CLI sağlayıcı/model geçersiz kılmaları) katıdır: bu sağlayıcı/model erişilemezse veya bir yanıt üretmeden önce başarısız olursa, OpenClaw ilgisiz bir geri dönüşten yanıtlamak yerine hatayı bildirir.

### Aday zincir kuralları

OpenClaw, aday listesini o anda istenen `provider/model` ile yapılandırılmış geri dönüşlerden oluşturur.

<AccordionGroup>
  <Accordion title="Kurallar">
    - İstenen model her zaman ilk sıradadır.
    - Açık yapılandırılmış geri dönüşlerin yinelenenleri kaldırılır ancak model izin verilenler listesine göre filtrelenmez. Bunlar açık operatör niyeti olarak ele alınır.
    - Geçerli çalıştırma aynı sağlayıcı ailesinde zaten yapılandırılmış bir geri dönüşteyse, OpenClaw tam yapılandırılmış zinciri kullanmaya devam eder.
    - Geçerli çalıştırma yapılandırmadan farklı bir sağlayıcıdaysa ve bu geçerli model yapılandırılmış geri dönüş zincirinin zaten bir parçası değilse, OpenClaw başka bir sağlayıcıdan ilgisiz yapılandırılmış geri dönüşleri eklemez.
    - Geri dönüş çalıştırıcısına açık bir geri dönüş geçersiz kılması sağlanmadığında, yapılandırılmış birincil sona eklenir; böylece önceki adaylar tükendiğinde zincir normal varsayılana geri dönebilir.
    - Bir çağıran `fallbacksOverride` sağladığında, çalıştırıcı tam olarak istenen modeli ve bu geçersiz kılma listesini kullanır. Boş liste, model geri dönüşünü devre dışı bırakır ve yapılandırılmış birincilin gizli bir yeniden deneme hedefi olarak eklenmesini önler.

  </Accordion>
</AccordionGroup>

### Hangi hatalar geri dönüşü ilerletir

<Tabs>
  <Tab title="Devam eder">
    - kimlik doğrulama hataları
    - oran sınırları ve bekleme süresi tükenmesi
    - aşırı yük/sağlayıcı meşgul hataları
    - zaman aşımı biçimli yük devretme hataları
    - faturalandırma devre dışı bırakmaları
    - eski bir kalıcı modelin dış bir yeniden deneme döngüsü oluşturmaması için yük devretme yoluna normalleştirilen `LiveSessionModelSwitchError`
    - hâlâ kalan adaylar varken diğer tanınmayan hatalar

  </Tab>
  <Tab title="Devam etmez">
    - zaman aşımı/yük devretme biçimli olmayan açık iptaller
    - compaction/yeniden deneme mantığı içinde kalması gereken bağlam taşması hataları (örneğin `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` veya `ollama error: context length exceeded`)
    - hiç aday kalmadığında son bilinmeyen hata

  </Tab>
</Tabs>

### Bekleme süresi atlama ve yoklama davranışı

Bir sağlayıcının tüm kimlik doğrulama profilleri zaten bekleme süresindeyken, OpenClaw bu sağlayıcıyı otomatik olarak sonsuza kadar atlamaz. Aday başına karar verir:

<AccordionGroup>
  <Accordion title="Aday başına kararlar">
    - Kalıcı kimlik doğrulama hataları tüm sağlayıcıyı hemen atlar.
    - Faturalandırma devre dışı bırakmaları genellikle atlanır, ancak yeniden başlatmadan kurtarmanın mümkün olması için birincil aday kısıtlama ile yine de yoklanabilir.
    - Birincil aday, sağlayıcı başına kısıtlama ile bekleme süresi bitimine yakın yoklanabilir.
    - Hata geçici görünüyorsa (`rate_limit`, `overloaded` veya unknown), aynı sağlayıcıdaki geri dönüş kardeşleri bekleme süresine rağmen denenebilir. Bu, oran sınırı model kapsamlı olduğunda ve kardeş bir modelin hâlâ hemen toparlanabileceği durumlarda özellikle önemlidir.
    - Geçici bekleme süresi yoklamaları, tek bir sağlayıcının sağlayıcılar arası geri dönüşü duraklatmaması için geri dönüş çalıştırması başına sağlayıcı başına bir ile sınırlıdır.

  </Accordion>
</AccordionGroup>

## Oturum geçersiz kılmaları ve canlı model değiştirme

Oturum model değişiklikleri paylaşılan durumdur. Etkin çalıştırıcı, `/model` komutu, compaction/oturum güncellemeleri ve canlı oturum uzlaştırması aynı oturum girdisinin parçalarını okur veya yazar.

Bu, geri dönüş yeniden denemelerinin canlı model değiştirme ile koordine edilmesi gerektiği anlamına gelir:

- Yalnızca açık kullanıcı güdümlü model değişiklikleri bekleyen bir canlı geçişi işaretler. Buna `/model`, `session_status(model=...)` ve `sessions.patch` dahildir.
- Geri dönüş rotasyonu, heartbeat geçersiz kılmaları veya compaction gibi sistem güdümlü model değişiklikleri kendi başlarına hiçbir zaman bekleyen bir canlı geçiş işaretlemez.
- Kullanıcı güdümlü model geçersiz kılmaları, geri dönüş politikası için tam seçimler olarak ele alınır; bu nedenle erişilemeyen seçili bir sağlayıcı, `agents.defaults.model.fallbacks` tarafından gizlenmek yerine hata olarak yüzeye çıkar.
- Bir geri dönüş yeniden denemesi başlamadan önce, yanıt çalıştırıcısı seçilen geri dönüş geçersiz kılma alanlarını oturum girdisine kalıcı olarak yazar.
- Otomatik geri dönüş geçersiz kılmaları sonraki turlarda seçili kalır; böylece OpenClaw her mesajda bilinen bozuk bir birincili yoklamaz. `/new`, `/reset` ve `sessions.reset`, otomatik kaynaklı geçersiz kılmaları temizler ve oturumu yapılandırılmış varsayılana döndürür.
- `/status` seçilen modeli ve geri dönüş durumu farklı olduğunda etkin geri dönüş modelini ve nedenini gösterir.
- Canlı oturum uzlaştırması, eski çalışma zamanı model alanları yerine kalıcı oturum geçersiz kılmalarını tercih eder.
- Bir canlı geçiş hatası etkin geri dönüş zincirindeki daha sonraki bir adayı işaret ederse, OpenClaw önce ilgisiz adayları yürümek yerine doğrudan seçilen modele atlar.
- Geri dönüş denemesi başarısız olursa, çalıştırıcı yalnızca yazdığı geçersiz kılma alanlarını ve yalnızca hâlâ başarısız adayla eşleşiyorlarsa geri alır.

Bu klasik yarış durumunu önler:

<Steps>
  <Step title="Birincil başarısız olur">
    Seçilen birincil model başarısız olur.
  </Step>
  <Step title="Geri dönüş bellekte seçilir">
    Geri dönüş adayı bellekte seçilir.
  </Step>
  <Step title="Oturum deposu hâlâ eski birincili söylüyor">
    Oturum deposu hâlâ eski birincili yansıtır.
  </Step>
  <Step title="Canlı uzlaştırma eski durumu okur">
    Canlı oturum uzlaştırması eski oturum durumunu okur.
  </Step>
  <Step title="Yeniden deneme geri çekilir">
    Geri dönüş denemesi başlamadan önce yeniden deneme eski modele geri çekilir.
  </Step>
</Steps>

Kalıcı geri dönüş geçersiz kılması bu pencereyi kapatır ve dar geri alma daha yeni manuel veya çalışma zamanı oturum değişikliklerini korur.

## Gözlemlenebilirlik ve hata özetleri

`runWithModelFallback(...)`, günlükleri ve kullanıcıya yönelik bekleme süresi mesajlarını besleyen deneme başına ayrıntıları kaydeder:

- denenen sağlayıcı/model
- neden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` ve benzer yük devretme nedenleri)
- isteğe bağlı durum/kod
- insan tarafından okunabilir hata özeti

Yapılandırılmış `model_fallback_decision` günlükleri, bir aday başarısız olduğunda, atlandığında veya daha sonraki bir geri dönüş başarılı olduğunda düz `fallbackStep*` alanlarını da içerir. Bu alanlar denenen geçişi açık hale getirir (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`); böylece günlük ve tanılama dışa aktarıcıları, son geri dönüş de başarısız olsa bile birincil hatayı yeniden oluşturabilir.

Her aday başarısız olduğunda, OpenClaw `FallbackSummaryError` fırlatır. Dış yanıt çalıştırıcısı bunu kullanarak "tüm modeller geçici olarak oran sınırına takıldı" gibi daha özel bir mesaj oluşturabilir ve biliniyorsa en yakın bekleme süresi bitişini dahil edebilir.

Bu bekleme süresi özeti model farkındadır:

- ilgisiz model kapsamlı oran sınırları, denenen sağlayıcı/model zinciri için yok sayılır
- kalan engel eşleşen model kapsamlı bir oran sınırıysa, OpenClaw o modeli hâlâ engelleyen son eşleşen bitiş zamanını bildirir

## İlgili yapılandırma

Şunlar için [Gateway yapılandırmasına](/tr/gateway/configuration) bakın:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` yönlendirmesi

Daha geniş model seçimi ve geri dönüş genel bakışı için [Modeller](/tr/concepts/models) bölümüne bakın.
