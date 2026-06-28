---
read_when:
    - Kimlik doğrulama profili rotasyonunu, bekleme sürelerini veya model geri dönüş davranışını tanılama
    - Kimlik doğrulama profilleri veya modeller için yük devretme kurallarını güncelleme
    - Oturum modeli geçersiz kılmalarının fallback yeniden denemeleriyle nasıl etkileşime girdiğini anlama
sidebarTitle: Model failover
summary: OpenClaw kimlik doğrulama profillerini nasıl döndürür ve modeller arasında nasıl geri döner
title: Model yük devretme
x-i18n:
    generated_at: "2026-06-28T00:29:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7be9b2ee7c2c6de42d454248a51219c1917ce9a3a93630dad0af6f67ec030de3
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw arızaları iki aşamada ele alır:

1. Geçerli sağlayıcı içinde **kimlik doğrulama profili rotasyonu**.
2. `agents.defaults.model.fallbacks` içindeki bir sonraki modele **model geri dönüşü**.

Bu belge, çalışma zamanı kurallarını ve bunları destekleyen verileri açıklar.

## Çalışma zamanı akışı

Normal bir metin çalıştırması için OpenClaw adayları şu sırayla değerlendirir:

<Steps>
  <Step title="Resolve session state">
    Etkin oturum modelini ve kimlik doğrulama profili tercihini çözümler.
  </Step>
  <Step title="Build candidate chain">
    Geçerli model seçimi ve o seçim kaynağı için geri dönüş ilkesi üzerinden model aday zincirini oluşturur. Yapılandırılmış varsayılanlar, cron işi birincilleri ve otomatik seçilmiş geri dönüş modelleri yapılandırılmış geri dönüşleri kullanabilir; açık kullanıcı oturum seçimleri katıdır.
  </Step>
  <Step title="Try the current provider">
    Geçerli sağlayıcıyı kimlik doğrulama profili rotasyonu/bekleme süresi kurallarıyla dener.
  </Step>
  <Step title="Advance on failover-worthy errors">
    Bu sağlayıcı, yük devretmeyi gerektiren bir hatayla tükenirse bir sonraki model adayına geçer.
  </Step>
  <Step title="Persist fallback override">
    Yeniden deneme başlamadan önce seçili geri dönüş geçersiz kılmasını kalıcı hale getirir; böylece diğer oturum okuyucuları, çalıştırıcının kullanmak üzere olduğu aynı sağlayıcı/modeli görür. Kalıcı hale getirilen model geçersiz kılması `modelOverrideSource: "auto"` olarak işaretlenir.
  </Step>
  <Step title="Roll back narrowly on failure">
    Geri dönüş adayı başarısız olursa yalnızca geri dönüşün sahip olduğu oturum geçersiz kılma alanlarını, hâlâ o başarısız adayla eşleşiyorlarsa geri alır.
  </Step>
  <Step title="Throw FallbackSummaryError if exhausted">
    Her aday başarısız olursa deneme başına ayrıntı ve biliniyorsa en erken bekleme süresi bitişiyle birlikte bir `FallbackSummaryError` fırlatır.
  </Step>
</Steps>

Bu, bilinçli olarak "tüm oturumu kaydet ve geri yükle" yaklaşımından daha dardır. Yanıt çalıştırıcısı yalnızca geri dönüş için sahip olduğu model seçimi alanlarını kalıcı hale getirir:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Bu, başarısız bir geri dönüş yeniden denemesinin, deneme çalışırken gerçekleşen manuel `/model` değişiklikleri veya oturum rotasyonu güncellemeleri gibi daha yeni ve ilgisiz oturum mutasyonlarının üzerine yazmasını önler.

## Seçim kaynağı ilkesi

OpenClaw seçili sağlayıcı/modeli, neden seçildiğinden ayırır. Bu kaynak, geri dönüş zincirine izin verilip verilmeyeceğini denetler:

- **Yapılandırılmış varsayılan**: `agents.defaults.model.primary`, `agents.defaults.model.fallbacks` kullanır.
- **Agent birincili**: `agents.list[].model`, ilgili agent model nesnesi kendi `fallbacks` değerini içermediği sürece katıdır. Katı davranışı açık hale getirmek için `fallbacks: []` kullanın veya bu agent için model geri dönüşünü etkinleştirmek üzere boş olmayan bir liste sağlayın.
- **Otomatik geri dönüş geçersiz kılması**: çalışma zamanı geri dönüşü, yeniden denemeden önce `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` ve seçili kaynak modeli yazar. Bu otomatik geçersiz kılma, her iletide birincili yoklamadan yapılandırılmış geri dönüş zincirinde ilerlemeyi sürdürebilir; ancak OpenClaw yapılandırılmış kaynağı düzenli aralıklarla yeniden yoklar ve kurtulduğunda otomatik geçersiz kılmayı temizler. `/new`, `/reset` ve `sessions.reset` de otomatik kaynaklı geçersiz kılmaları temizler. Açık bir `heartbeat.model` olmadan çalışan Heartbeat, kaynakları artık geçerli yapılandırılmış varsayılanla eşleşmediğinde doğrudan otomatik geçersiz kılmaları temizler.
- **Kullanıcı oturumu geçersiz kılması**: `/model`, model seçici, `session_status(model=...)` ve `sessions.patch`, `modelOverrideSource: "user"` yazar. Bu, tam bir oturum seçimidir. Seçili sağlayıcı/model bir yanıt üretmeden önce başarısız olursa OpenClaw, ilgisiz yapılandırılmış bir geri dönüşten yanıt vermek yerine hatayı bildirir.
- **Eski oturum geçersiz kılması**: eski oturum girdilerinde `modelOverride` bulunabilir ancak `modelOverrideSource` olmayabilir. OpenClaw bunları kullanıcı geçersiz kılmaları olarak ele alır; böylece açık eski bir seçim sessizce geri dönüş davranışına dönüştürülmez.
- **Cron yük modeli**: bir cron işi `payload.model` / `--model`, kullanıcı oturumu geçersiz kılması değil, iş birincilidir. İş `payload.fallbacks` sağlamadığı sürece yapılandırılmış geri dönüşleri kullanır; `payload.fallbacks: []`, cron çalışmasını katı hale getirir.

Otomatik geri dönüş birincil yoklama aralığı beş dakikadır ve yapılandırılamaz. OpenClaw son yoklamaları oturum ve birincil model başına hatırlar; böylece başarısız bir birincil her turda yeniden denenmez. OpenClaw bir oturum geri dönüşe geçtiğinde görünür bir bildirim, seçili birincile döndüğünde de başka bir bildirim gönderir; her yapışkan geri dönüş turunda bildirimi tekrarlamaz.

## Kimlik doğrulama hatası atlama önbelleği

Varsayılan olarak her yeni tur, mevcut geri dönüş yeniden deneme davranışını korur: OpenClaw,
yakın zamanda `auth` veya `auth_permanent` ile başarısız olan birincil olmayan
adaylar dahil olmak üzere yapılandırılmış her geri dönüş adayını yeniden dener.

Bu yinelenen kimlik doğrulama hatalarını bastırmayı tercih eden operatörler şununla etkinleştirebilir:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Etkinleştirildiğinde OpenClaw, kimlik doğrulama sınıfı hatasından sonra bir
birincil olmayan geri dönüş adayı için bellek içi, oturum kapsamlı bir atlama işaretçisi kaydeder. İşaretçi
oturum kimliği, sağlayıcı ve modele göre anahtarlanır. Birincil adaylar asla atlanmaz; böylece
açık kullanıcı model seçimi gerçek kimlik doğrulama hatasını yine de yüzeye çıkarır. Önbellek
süreç yereldir ve Gateway yeniden başlatıldığında temizlenir.

Değer milisaniye cinsinden bir TTL değeridir. `0` veya ayarlanmamış değer önbelleği devre dışı bırakır.
Pozitif değerler 1 saniye ile 10 dakika arasında sınırlandırılır.

## Kullanıcıya görünür geri dönüş bildirimleri

Bir oturum otomatik seçilmiş bir geri dönüşe geçtiğinde OpenClaw aynı yanıt yüzeyinde bir durum bildirimi gönderir:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Daha sonraki bir yoklama başarılı olduğunda ve oturum seçili birincile döndüğünde OpenClaw şunu gönderir:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Bu bildirimler operasyonel iletilerdir, asistan içeriği değildir. Uygun olduğunda yalnızca yan etkili turlar dahil her durum değişikliği başına bir kez teslim edilirler; ancak yapışkan geri dönüş turları bunları tekrarlamaz. Teslimat normal kaynak yanıtı bastırmayı atlar, bildirim iş parçacıklı kanallar için ilk asistan yanıt yuvasını tüketmez ve metinden konuşmaya ile taahhüt çıkarımından hariç tutulur.

## Kimlik doğrulama depolaması (anahtarlar + OAuth)

OpenClaw hem API anahtarları hem de OAuth belirteçleri için **kimlik doğrulama profilleri** kullanır.

- Gizli bilgiler ve çalışma zamanı kimlik doğrulama yönlendirme durumu `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` içinde yaşar.
- `auth.profiles` / `auth.order` yapılandırması **yalnızca meta veri + yönlendirme** amaçlıdır (gizli bilgi içermez).
- Eski yalnızca içe aktarma OAuth dosyası: `~/.openclaw/credentials/oauth.json` (ilk kullanımda agent başına kimlik doğrulama deposuna içe aktarılır).
- Eski `auth-profiles.json`, `auth-state.json` ve agent başına `auth.json` dosyaları `openclaw doctor --fix` tarafından içe aktarılır.

Daha fazla ayrıntı: [OAuth](/tr/concepts/oauth)

Kimlik bilgisi türleri:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (bazı sağlayıcılar için + `projectId`/`enterpriseUrl`)

## Profil kimlikleri

OAuth oturum açmaları, birden çok hesabın birlikte var olabilmesi için ayrı profiller oluşturur.

- Varsayılan: e-posta yoksa `provider:default`.
- E-posta ile OAuth: `provider:<email>` (örneğin `google-antigravity:user@gmail.com`).

Profiller, agent başına `openclaw-agent.sqlite` kimlik doğrulama profili deposunda yaşar.

## Rotasyon sırası

Bir sağlayıcının birden çok profili olduğunda OpenClaw şu şekilde bir sıra seçer:

<Steps>
  <Step title="Explicit config">
    `auth.order[provider]` (ayarlanmışsa).
  </Step>
  <Step title="Configured profiles">
    Sağlayıcıya göre filtrelenmiş `auth.profiles`.
  </Step>
  <Step title="Stored profiles">
    Sağlayıcı için agent başına SQLite kimlik doğrulama profili girdileri.
  </Step>
</Steps>

Açık bir sıra yapılandırılmamışsa OpenClaw round-robin sırası kullanır:

- **Birincil anahtar:** profil türü (**API anahtarlarından önce OAuth**).
- **İkincil anahtar:** `usageStats.lastUsed` (her tür içinde en eski önce).
- **Bekleme süresindeki/devre dışı profiller** sona taşınır ve en erken bitişe göre sıralanır.

### Oturum yapışkanlığı (önbellek dostu)

OpenClaw, sağlayıcı önbelleklerini sıcak tutmak için **seçili kimlik doğrulama profilini oturum başına sabitler**. Her istekte rotasyon yapmaz. Sabitlenen profil şu ana kadar yeniden kullanılır:

- oturum sıfırlanana kadar (`/new` / `/reset`)
- bir Compaction tamamlanana kadar (compaction sayısı artar)
- profil bekleme süresinde/devre dışı olana kadar

`/model …@<profileId>` üzerinden manuel seçim, bu oturum için bir **kullanıcı geçersiz kılması** ayarlar ve yeni bir oturum başlayana kadar otomatik olarak döndürülmez.

<Note>
Otomatik sabitlenen profiller (oturum yönlendiricisi tarafından seçilenler) bir **tercih** olarak ele alınır: önce onlar denenir, ancak OpenClaw hız sınırları/zaman aşımlarında başka bir profile dönebilir. Özgün profil yeniden kullanılabilir hale geldiğinde yeni çalıştırmalar, seçili modeli veya çalışma zamanını değiştirmeden onu yeniden tercih edebilir. Kullanıcı sabitli profiller o profile kilitli kalır; başarısız olursa ve model geri dönüşleri yapılandırılmışsa OpenClaw profil değiştirmek yerine bir sonraki modele geçer.
</Note>

### OpenAI Codex aboneliği ve API anahtarı yedeği

OpenAI agent modelleri için kimlik doğrulama ve çalışma zamanı ayrıdır. `openai/gpt-*`,
kimlik doğrulama bir Codex abonelik profili ile bir OpenAI API anahtarı yedeği arasında
dönebilirken Codex harness üzerinde kalır.

Kullanıcıya dönük sıra için `auth.order.openai` kullanın:

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Hem ChatGPT/Codex OAuth profilleri hem de OpenAI API anahtarı
profilleri için `openai:*` kullanın. Abonelik bir Codex kullanım sınırına ulaştığında,
Codex sağlıyorsa OpenClaw tam sıfırlama zamanını kaydeder, sıradaki
kimlik doğrulama profilini dener ve çalıştırmayı Codex harness içinde tutar. Sıfırlama
zamanı geçtikten sonra abonelik profili yeniden uygun olur ve bir sonraki otomatik
seçim ona dönebilir.

Kullanıcı sabitli profili yalnızca bu oturum için tek bir hesabı/anahtarı zorlamak istediğinizde
kullanın. Kullanıcı sabitli profiller bilinçli olarak katıdır ve sessizce
başka bir profile atlamaz.

## Bekleme süreleri

Bir profil kimlik doğrulama/hız sınırı hataları (veya hız sınırlaması gibi görünen bir zaman aşımı) nedeniyle başarısız olduğunda OpenClaw onu bekleme süresinde olarak işaretler ve bir sonraki profile geçer.

<AccordionGroup>
  <Accordion title="What lands in the rate-limit / timeout bucket">
    Bu hız sınırı kovası düz `429` değerinden daha geniştir: `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` gibi sağlayıcı iletilerini ve `weekly/monthly limit reached` gibi dönemsel kullanım penceresi sınırlarını da içerir.

    Biçim/geçersiz istek hataları genellikle terminaldir; çünkü aynı yükü yeniden denemek aynı şekilde başarısız olur. Bu yüzden OpenClaw kimlik doğrulama profillerini döndürmek yerine bunları yüzeye çıkarır. Bilinen yeniden deneme-onarım yolları açıkça etkinleştirilebilir: örneğin Cloud Code Assist araç çağrısı kimliği doğrulama hataları temizlenir ve `allowFormatRetry` ilkesi üzerinden bir kez yeniden denenir. `Unhandled stop reason: error`, `stop reason: error` ve `reason: error` gibi OpenAI uyumlu durma nedeni hataları zaman aşımı/yük devretme sinyalleri olarak sınıflandırılır.

    Genel sunucu metni de kaynak bilinen geçici bir örüntüyle eşleştiğinde bu zaman aşımı kovasına düşebilir. Örneğin düz model çalışma zamanı akış sarmalayıcı iletisi `An unknown error occurred`, paylaşılan model çalışma zamanı, sağlayıcı akışları belirli ayrıntılar olmadan `stopReason: "aborted"` veya `stopReason: "error"` ile bittiğinde bunu yaydığı için her sağlayıcı için yük devretmeye değer olarak ele alınır. `internal server error`, `unknown error, 520`, `upstream error` veya `backend error` gibi geçici sunucu metinleri içeren JSON `api_error` yükleri de yük devretmeye değer zaman aşımları olarak ele alınır.

    Düz `Provider returned error` gibi OpenRouter'a özgü genel yukarı akış metni yalnızca sağlayıcı bağlamı gerçekten OpenRouter olduğunda zaman aşımı olarak ele alınır. `LLM request failed with an unknown error.` gibi genel dahili geri dönüş metni ise korumacı kalır ve tek başına yük devretmeyi tetiklemez.

  </Accordion>
  <Accordion title="SDK retry-after sınırları">
    Bazı sağlayıcı SDK'ları, denetimi OpenClaw'a geri döndürmeden önce uzun bir `Retry-After` penceresi boyunca bekleyebilir. Anthropic ve OpenAI gibi Stainless tabanlı SDK'lar için OpenClaw, SDK içi `retry-after-ms` / `retry-after` beklemelerini varsayılan olarak 60 saniyeyle sınırlar ve daha uzun yeniden denenebilir yanıtları hemen yüzeye çıkarır; böylece bu geri dönüş yolu çalışabilir. Sınırı `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` ile ayarlayın veya devre dışı bırakın; bkz. [Yeniden deneme davranışı](/tr/concepts/retry).
  </Accordion>
  <Accordion title="Model kapsamlı bekleme süreleri">
    Hız sınırı bekleme süreleri model kapsamlı da olabilir:

    - OpenClaw, başarısız olan model kimliği bilindiğinde hız sınırı hataları için `cooldownModel` kaydeder.
    - Bekleme süresi farklı bir modele kapsamlanmışsa aynı sağlayıcıdaki kardeş model yine de denenebilir.
    - Faturalandırma/devre dışı pencereleri modeller genelinde tüm profili engellemeye devam eder.

  </Accordion>
</AccordionGroup>

Bekleme süreleri üstel geri çekilme kullanır:

- 1 dakika
- 5 dakika
- 25 dakika
- 1 saat (sınır)

Durum, ajan başına SQLite kimlik doğrulama durumunda `usageStats` altında depolanır:

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

Faturalandırma/kredi hataları (örneğin "insufficient credits" / "credit balance too low") geri dönüşe uygun kabul edilir, ancak genellikle geçici değildir. Kısa bir bekleme süresi yerine OpenClaw profili **devre dışı** olarak işaretler (daha uzun bir geri çekilme ile) ve sonraki profile/sağlayıcıya döner.

<Note>
Faturalandırma biçimli her yanıt `402` değildir ve her HTTP `402` buraya düşmez. OpenClaw, bir sağlayıcı bunun yerine `401` veya `403` döndürse bile açık faturalandırma metnini faturalandırma hattında tutar; ancak sağlayıcıya özgü eşleştiriciler onları sahiplenen sağlayıcıyla sınırlı kalır (örneğin OpenRouter `403 Key limit exceeded`).

Bu arada geçici `402` kullanım penceresi ve organizasyon/çalışma alanı harcama sınırı hataları, ileti yeniden denenebilir göründüğünde `rate_limit` olarak sınıflandırılır (örneğin `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` veya `organization spending limit exceeded`). Bunlar uzun faturalandırma-devre dışı bırakma yolu yerine kısa bekleme/geri dönüş yolunda kalır.
</Note>

Durum, ajan başına SQLite kimlik doğrulama durumunda depolanır:

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
- Aşırı yüklenmiş yeniden denemeler, model geri dönüşünden önce **1 aynı sağlayıcı profil rotasyonuna** izin verir.
- Aşırı yüklenmiş yeniden denemeler varsayılan olarak **0 ms geri çekilme** kullanır.

## Model geri dönüşü

Bir sağlayıcıya ait tüm profiller başarısız olursa OpenClaw, `agents.defaults.model.fallbacks` içindeki sonraki modele geçer. Bu, kimlik doğrulama hataları, hız sınırları ve profil rotasyonunu tüketmiş zaman aşımları için geçerlidir (diğer hatalar geri dönüşü ilerletmez). Yeterli ayrıntı sunmayan sağlayıcı hataları yine de geri dönüş durumunda hassas biçimde etiketlenir: `empty_response`, sağlayıcının kullanılabilir bir ileti veya durum döndürmediği anlamına gelir; `no_error_details`, sağlayıcının açıkça `Unknown error (no error details in response)` döndürdüğü anlamına gelir; `unclassified` ise OpenClaw'ın ham önizlemeyi koruduğu ancak henüz hiçbir sınıflandırıcının bununla eşleşmediği anlamına gelir.

Aşırı yük ve hız sınırı hataları, faturalandırma beklemelerinden daha agresif işlenir. Varsayılan olarak OpenClaw, aynı sağlayıcıda bir kimlik doğrulama profili yeniden denemesine izin verir, ardından beklemeden yapılandırılmış bir sonraki model geri dönüşüne geçer. `ModelNotReadyException` gibi sağlayıcı meşgul sinyalleri bu aşırı yük kovasına düşer. Bunu `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` ve `auth.cooldowns.rateLimitedProfileRotations` ile ayarlayın.

Bir çalışma yapılandırılmış varsayılan birincilden, bir cron işi birincilinden, açık geri dönüşleri olan bir ajan birincilinden veya otomatik seçilmiş bir geri dönüş geçersiz kılmasından başladığında OpenClaw, eşleşen yapılandırılmış geri dönüş zincirinde ilerleyebilir. Açık geri dönüşleri olmayan ajan birincilleri ve açık kullanıcı seçimleri (örneğin `/model ollama/qwen3.5:27b`, model seçici, `sessions.patch` veya tek seferlik CLI sağlayıcı/model geçersiz kılmaları) katıdır: bu sağlayıcı/model erişilemezse veya yanıt üretmeden önce başarısız olursa OpenClaw, ilgisiz bir geri dönüşten yanıt vermek yerine hatayı bildirir.

### Aday zinciri kuralları

OpenClaw, aday listesini o anda istenen `provider/model` ve yapılandırılmış geri dönüşlerden oluşturur.

<AccordionGroup>
  <Accordion title="Kurallar">
    - İstenen model her zaman ilk sıradadır.
    - Açık yapılandırılmış geri dönüşlerin yinelenenleri kaldırılır, ancak model izin listesine göre filtrelenmez. Bunlar açık operatör niyeti olarak ele alınır.
    - Geçerli çalışma aynı sağlayıcı ailesindeki yapılandırılmış bir geri dönüş üzerindeyse OpenClaw tam yapılandırılmış zinciri kullanmayı sürdürür.
    - Açık bir geri dönüş geçersiz kılması sağlanmadığında, istenen model farklı bir sağlayıcı kullansa bile yapılandırılmış geri dönüşler yapılandırılmış birincilden önce denenir.
    - Geri dönüş çalıştırıcısına açık bir geri dönüş geçersiz kılması sağlanmadığında, zincirin önceki adaylar tükendiğinde normal varsayılana geri oturabilmesi için yapılandırılmış birincil sona eklenir.
    - Bir çağıran `fallbacksOverride` sağladığında, çalıştırıcı tam olarak istenen modeli ve bu geçersiz kılma listesini kullanır. Boş liste model geri dönüşünü devre dışı bırakır ve yapılandırılmış birincilin gizli yeniden deneme hedefi olarak eklenmesini önler.

  </Accordion>
</AccordionGroup>

### Hangi hatalar geri dönüşü ilerletir

<Tabs>
  <Tab title="Şunlarda devam eder">
    - kimlik doğrulama hataları
    - hız sınırları ve bekleme süresi tükenmesi
    - aşırı yük/sağlayıcı meşgul hataları
    - zaman aşımı biçimli geri dönüş hataları
    - faturalandırma devre dışı bırakmaları
    - `LiveSessionModelSwitchError`; kalıcı eski bir modelin dış yeniden deneme döngüsü oluşturmaması için geri dönüş yoluna normalleştirilir
    - hâlâ kalan adaylar varsa diğer tanınmayan hatalar

  </Tab>
  <Tab title="Şunlarda devam etmez">
    - zaman aşımı/geri dönüş biçimli olmayan açık iptaller
    - compaction/yeniden deneme mantığı içinde kalması gereken bağlam taşması hataları (örneğin `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` veya `ollama error: context length exceeded`)
    - aday kalmadığında son bilinmeyen hata

  </Tab>
</Tabs>

### Bekleme atlama ve yoklama davranışı

Bir sağlayıcının her kimlik doğrulama profili zaten bekleme süresindeyken OpenClaw o sağlayıcıyı otomatik olarak sonsuza dek atlamaz. Aday başına karar verir:

<AccordionGroup>
  <Accordion title="Aday başına kararlar">
    - Kalıcı kimlik doğrulama hataları tüm sağlayıcıyı hemen atlar.
    - Faturalandırma devre dışı bırakmaları genellikle atlanır, ancak yeniden başlatmadan kurtarmanın mümkün olması için birincil aday bir kısıtlama altında yine de yoklanabilir.
    - Birincil aday, bekleme süresinin bitimine yakın, sağlayıcı başına bir kısıtlama ile yoklanabilir.
    - Aynı sağlayıcıdaki geri dönüş kardeşleri, hata geçici görünüyorsa (`rate_limit`, `overloaded` veya bilinmeyen) bekleme süresine rağmen denenebilir. Bu, özellikle hız sınırı model kapsamlıysa ve kardeş model hemen toparlanabilecekse önemlidir.
    - Geçici bekleme yoklamaları, tek bir sağlayıcının sağlayıcılar arası geri dönüşü duraksatmaması için geri dönüş çalışması başına sağlayıcı başına bir ile sınırlıdır.

  </Accordion>
</AccordionGroup>

## Oturum geçersiz kılmaları ve canlı model değiştirme

Oturum model değişiklikleri paylaşılan durumdur. Etkin çalıştırıcı, `/model` komutu, compaction/oturum güncellemeleri ve canlı oturum uzlaştırması aynı oturum girdisinin parçalarını okur veya yazar.

Bu, geri dönüş yeniden denemelerinin canlı model değiştirmeyle koordine olması gerektiği anlamına gelir:

- Yalnızca açık kullanıcı odaklı model değişiklikleri bekleyen bir canlı geçişi işaretler. Buna `/model`, `session_status(model=...)` ve `sessions.patch` dahildir.
- Geri dönüş rotasyonu, Heartbeat geçersiz kılmaları veya compaction gibi sistem odaklı model değişiklikleri kendi başlarına bekleyen bir canlı geçişi asla işaretlemez.
- Kullanıcı odaklı model geçersiz kılmaları geri dönüş politikası için tam seçimler olarak ele alınır; bu nedenle erişilemeyen seçilmiş bir sağlayıcı, `agents.defaults.model.fallbacks` tarafından maskelenmek yerine hata olarak yüzeye çıkar.
- Bir geri dönüş yeniden denemesi başlamadan önce yanıt çalıştırıcısı, seçilen geri dönüş geçersiz kılma alanlarını oturum girdisine kalıcı olarak yazar.
- Otomatik geri dönüş geçersiz kılmaları sonraki turlarda seçili kalır; böylece OpenClaw bilinen kötü bir birincili her iletide yoklamaz. OpenClaw yapılandırılmış kökeni periyodik olarak yeniden yoklar ve toparlandığında otomatik geçersiz kılmayı temizler; `/new`, `/reset` ve `sessions.reset` otomatik kaynaklı geçersiz kılmaları hemen temizler.
- Kullanıcı yanıtları geri dönüş geçişlerini ve geri dönüş temizlendi kurtarmasını durum değişikliği başına bir kez duyurur. Yapışkan geri dönüş turları bildirimi yinelemez.
- `/status` seçilen modeli ve geri dönüş durumu farklıysa etkin geri dönüş modelini ve nedenini gösterir.
- Canlı oturum uzlaştırması, eski çalışma zamanı model alanları yerine kalıcı oturum geçersiz kılmalarını tercih eder.
- Bir canlı geçiş hatası etkin geri dönüş zincirindeki daha sonraki bir adayı işaret ederse OpenClaw önce ilgisiz adaylarda ilerlemek yerine doğrudan o seçili modele atlar.
- Geri dönüş denemesi başarısız olursa çalıştırıcı yalnızca yazdığı geçersiz kılma alanlarını geri alır ve bunu yalnızca hâlâ o başarısız adayla eşleşiyorlarsa yapar.

Bu klasik yarışı önler:

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
  <Step title="Yeniden deneme geri çekilir">
    Yeniden deneme, geri dönüş denemesi başlamadan önce eski modele geri çekilir.
  </Step>
</Steps>

Kalıcı geri dönüş geçersiz kılması bu pencereyi kapatır ve dar geri alma daha yeni manuel veya çalışma zamanı oturum değişikliklerini sağlam tutar.

## Gözlemlenebilirlik ve hata özetleri

`runWithModelFallback(...)`, günlükleri ve kullanıcıya dönük bekleme mesajlarını besleyen deneme başına ayrıntıları kaydeder:

- denenen sağlayıcı/model
- neden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` ve benzer geri dönüş nedenleri)
- isteğe bağlı durum/kod
- insan tarafından okunabilir hata özeti

Yapılandırılmış `model_fallback_decision` günlükleri, bir aday başarısız olduğunda, atlandığında veya daha sonraki bir geri dönüş başarılı olduğunda düz `fallbackStep*` alanlarını da içerir. Bu alanlar denenen geçişi açık hale getirir (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`); böylece günlük ve tanılama dışa aktarıcıları, terminal geri dönüşü de başarısız olsa bile birincil hatayı yeniden oluşturabilir.

Her aday başarısız olduğunda OpenClaw `FallbackSummaryError` fırlatır. Dış yanıt çalıştırıcısı bunu kullanarak "all models are temporarily rate-limited" gibi daha özgül bir ileti oluşturabilir ve biliniyorsa en yakın bekleme bitişini dahil edebilir.

Bu bekleme özeti model farkındadır:

- ilgisiz model kapsamlı hız sınırları, denenen sağlayıcı/model zinciri için yok sayılır
- kalan engel eşleşen model kapsamlı bir hız sınırıysa OpenClaw, o modeli hâlâ engelleyen son eşleşen bitiş zamanını bildirir

## İlgili yapılandırma

Şunun için [Gateway yapılandırması](/tr/gateway/configuration) bölümüne bakın:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` yönlendirmesi

Daha geniş model seçimi ve yedek modele geçiş genel bakışı için [Modeller](/tr/concepts/models) sayfasına bakın.
