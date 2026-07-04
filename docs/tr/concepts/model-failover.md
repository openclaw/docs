---
read_when:
    - Kimlik doğrulama profili rotasyonunu, bekleme sürelerini veya model geri dönüş davranışını tanılama
    - Kimlik doğrulama profilleri veya modeller için yük devretme kurallarını güncelleme
    - Oturum model geçersiz kılmalarının yedek yeniden denemelerle nasıl etkileştiğini anlama
sidebarTitle: Model failover
summary: OpenClaw kimlik doğrulama profillerini nasıl döndürür ve modeller arasında nasıl geri döner
title: Model yük devri
x-i18n:
    generated_at: "2026-07-04T15:32:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1521e27c53029ead305f29b7a29b627b519adbd28ed30688c01f32542625855f
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw hataları iki aşamada ele alır:

1. Geçerli sağlayıcı içinde **auth profili rotasyonu**.
2. `agents.defaults.model.fallbacks` içindeki sonraki modele **model fallback**.

Bu belge, runtime kurallarını ve bunları destekleyen verileri açıklar.

## Runtime akışı

Normal bir metin çalıştırması için OpenClaw adayları şu sırayla değerlendirir:

<Steps>
  <Step title="Oturum durumunu çözümle">
    Etkin oturum modelini ve auth profili tercihini çözümle.
  </Step>
  <Step title="Aday zincirini oluştur">
    Geçerli model seçiminden ve o seçim kaynağına ait fallback politikasından model aday zincirini oluştur. Yapılandırılmış varsayılanlar, cron işi birincilleri ve otomatik seçilmiş fallback modeller yapılandırılmış fallback'leri kullanabilir; açık kullanıcı oturum seçimleri katıdır.
  </Step>
  <Step title="Geçerli sağlayıcıyı dene">
    Geçerli sağlayıcıyı auth profili rotasyonu/cooldown kurallarıyla dene.
  </Step>
  <Step title="Failover'a uygun hatalarda ilerle">
    Bu sağlayıcı failover'a uygun bir hatayla tükenirse, sonraki model adayına geç.
  </Step>
  <Step title="Fallback override'ını kalıcılaştır">
    Yeniden deneme başlamadan önce seçilen fallback override'ını kalıcılaştır; böylece diğer oturum okuyucuları, runner'ın kullanmak üzere olduğu aynı sağlayıcı/modeli görür. Kalıcılaştırılan model override'ı `modelOverrideSource: "auto"` olarak işaretlenir.
  </Step>
  <Step title="Hata durumunda dar kapsamlı geri al">
    Fallback adayı başarısız olursa, yalnızca fallback'in sahibi olduğu oturum override alanlarını, hâlâ başarısız olan adayla eşleşiyorlarsa geri al.
  </Step>
  <Step title="Tükenirse FallbackSummaryError fırlat">
    Her aday başarısız olursa, deneme başına ayrıntı ve biliniyorsa en yakın cooldown bitiş zamanı içeren bir `FallbackSummaryError` fırlat.
  </Step>
</Steps>

Bu, kasıtlı olarak "tüm oturumu kaydet ve geri yükle" yaklaşımından daha dardır. Yanıt runner'ı yalnızca fallback için sahibi olduğu model seçimi alanlarını kalıcılaştırır:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Bu, başarısız bir fallback yeniden denemesinin, deneme çalışırken gerçekleşen manuel `/model` değişiklikleri veya oturum rotasyonu güncellemeleri gibi daha yeni ve alakasız oturum mutasyonlarının üzerine yazmasını önler.

## Seçim kaynağı politikası

OpenClaw seçilen sağlayıcı/model ile bunun neden seçildiğini birbirinden ayırır. Bu kaynak, fallback zincirine izin verilip verilmediğini kontrol eder:

- **Yapılandırılmış varsayılan**: `agents.defaults.model.primary`, `agents.defaults.model.fallbacks` kullanır.
- **Agent birincili**: `agents.list[].model`, bu agent model nesnesi kendi `fallbacks` listesini içermediği sürece katıdır. Katı davranışı açık yapmak için `fallbacks: []` kullanın veya bu agent'ı model fallback'e dahil etmek için boş olmayan bir liste sağlayın.
- **Otomatik fallback override'ı**: runtime fallback, yeniden denemeden önce `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` ve seçilen kaynak modeli yazar. Bu otomatik override, her mesajda birincili denemeden yapılandırılmış fallback zincirinde ilerlemeye devam edebilir; ancak OpenClaw yapılandırılmış kaynağı periyodik olarak tekrar yoklar ve toparlandığında otomatik override'ı temizler. `/new`, `/reset` ve `sessions.reset` de otomatik kaynaklı override'ları temizler. Açık bir `heartbeat.model` olmadan çalışan Heartbeat, kaynakları artık geçerli yapılandırılmış varsayılanla eşleşmediğinde doğrudan otomatik override'ları temizler.
- **Kullanıcı oturumu override'ı**: `/model`, model seçici, `session_status(model=...)` ve `sessions.patch`, `modelOverrideSource: "user"` yazar. Bu, kesin bir oturum seçimidir. Seçilen sağlayıcı/model yanıt üretmeden önce başarısız olursa OpenClaw, alakasız bir yapılandırılmış fallback'ten yanıt vermek yerine hatayı bildirir.
- **Eski oturum override'ı**: eski oturum girdilerinde `modelOverrideSource` olmadan `modelOverride` olabilir. OpenClaw bunları kullanıcı override'ı olarak ele alır; böylece açık bir eski seçim sessizce fallback davranışına dönüştürülmez.
- **Cron payload modeli**: bir cron işi `payload.model` / `--model`, kullanıcı oturumu override'ı değil, iş birincilidir. İş `payload.fallbacks` sağlamadığı sürece yapılandırılmış fallback'leri kullanır; `payload.fallbacks: []` cron çalıştırmasını katı yapar.

Otomatik fallback birincil yoklama aralığı beş dakikadır ve yapılandırılamaz. OpenClaw, başarısız olan bir birincilin her turda yeniden denenmemesi için son yoklamaları oturum ve birincil model bazında hatırlar. OpenClaw, bir oturum fallback'e geçtiğinde görünür bir bildirim ve seçilen birincile döndüğünde başka bir bildirim gönderir; yapışkan fallback'in her turunda bildirimi tekrarlamaz.

## Auth hatası atlama önbelleği

Varsayılan olarak her yeni tur mevcut fallback yeniden deneme davranışını korur: OpenClaw
yakın zamanda `auth` veya `auth_permanent` ile başarısız olmuş birincil olmayan
adaylar dahil olmak üzere, yapılandırılmış her fallback adayını yeniden dener.

Bu tekrarlanan auth hatalarını bastırmayı tercih eden operatörler şununla etkinleştirebilir:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Etkinleştirildiğinde OpenClaw, auth sınıfı bir hatadan sonra birincil olmayan
fallback adayı için bellek içi, oturum kapsamlı bir atlama işareti kaydeder.
İşaret, oturum id'si, sağlayıcı ve modele göre anahtarlanır. Birincil adaylar
asla atlanmaz; böylece açık bir kullanıcı model seçimi gerçek auth hatasını yine
gösterir. Önbellek süreç yereldir ve Gateway yeniden başlatıldığında temizlenir.

Değer, milisaniye cinsinden bir TTL'dir. `0` veya ayarlanmamış değer önbelleği
devre dışı bırakır. Pozitif değerler 1 saniye ile 10 dakika arasında sınırlandırılır.

## Kullanıcıya görünür fallback bildirimleri

Bir oturum otomatik seçilmiş bir fallback'e geçtiğinde OpenClaw aynı yanıt yüzeyinde bir durum bildirimi gönderir:

```text
↪️ Model Fallback: <fallback> (selected <primary>; <reason>)
```

Daha sonraki bir yoklama başarılı olduğunda ve oturum seçilen birincile döndüğünde OpenClaw şunu gönderir:

```text
↪️ Model Fallback cleared: <primary> (was <fallback>)
```

Bu bildirimler operasyonel mesajlardır, assistant içeriği değildir. Uygun olduğunda yalnızca yan etkili turlar dahil olmak üzere durum değişikliği başına bir kez iletilirler; ancak yapışkan fallback turları bunları tekrarlamaz. İletim normal kaynak-yanıt bastırmasını atlar, bildirim thread'li kanallar için ilk assistant yanıt slotunu tüketmez ve text-to-speech ile commitment extraction kapsamı dışında tutulur.

## Auth depolama (anahtarlar + OAuth)

OpenClaw hem API anahtarları hem OAuth token'ları için **auth profilleri** kullanır.

- Gizli bilgiler ve runtime auth yönlendirme durumu `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` içinde yaşar.
- `auth.profiles` / `auth.order` yapılandırması **yalnızca metadata + yönlendirme** içindir (gizli bilgi içermez).
- Eski yalnızca içe aktarma OAuth dosyası: `~/.openclaw/credentials/oauth.json` (ilk kullanımda agent başına auth deposuna içe aktarılır).
- Eski `auth-profiles.json`, `auth-state.json` ve agent başına `auth.json` dosyaları `openclaw doctor --fix` tarafından içe aktarılır.

Daha fazla ayrıntı: [OAuth](/tr/concepts/oauth)

Kimlik bilgisi türleri:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (bazı sağlayıcılar için ayrıca `projectId`/`enterpriseUrl`)

## Profil ID'leri

OAuth girişleri, birden fazla hesabın birlikte var olabilmesi için ayrı profiller oluşturur.

- Varsayılan: e-posta yoksa `provider:default`.
- E-postalı OAuth: `provider:<email>` (örneğin `google-antigravity:user@gmail.com`).

Profiller, agent başına `openclaw-agent.sqlite` auth profil deposunda yaşar.

## Rotasyon sırası

Bir sağlayıcının birden fazla profili olduğunda OpenClaw şu şekilde bir sıra seçer:

<Steps>
  <Step title="Açık yapılandırma">
    `auth.order[provider]` (ayarlanmışsa).
  </Step>
  <Step title="Yapılandırılmış profiller">
    Sağlayıcıya göre filtrelenmiş `auth.profiles`.
  </Step>
  <Step title="Depolanan profiller">
    Sağlayıcı için agent başına SQLite auth profil girdileri.
  </Step>
</Steps>

Açık bir sıra yapılandırılmamışsa OpenClaw round-robin sıra kullanır:

- **Birincil anahtar:** profil türü (**API anahtarlarından önce OAuth**).
- **İkincil anahtar:** `usageStats.lastUsed` (her tür içinde en eski önce).
- **Cooldown/devre dışı profiller**, en yakın bitiş zamanına göre sıralanarak sona taşınır.

### Oturum yapışkanlığı (önbellek dostu)

OpenClaw, sağlayıcı önbelleklerini sıcak tutmak için **seçilen auth profilini oturum başına sabitler**. Her istekte rotasyon yapmaz. Sabitlenen profil şu ana kadar yeniden kullanılır:

- oturum sıfırlanır (`/new` / `/reset`)
- bir compaction tamamlanır (compaction sayısı artar)
- profil cooldown'dadır/devre dışıdır

`/model …@<profileId>` ile manuel seçim, o oturum için bir **kullanıcı override'ı** ayarlar ve yeni bir oturum başlayana kadar otomatik olarak döndürülmez.

<Note>
Otomatik sabitlenen profiller (oturum yönlendiricisi tarafından seçilenler) bir **tercih** olarak ele alınır: önce onlar denenir, ancak OpenClaw hız limitlerinde/zaman aşımlarında başka bir profile dönebilir. Özgün profil tekrar kullanılabilir olduğunda, yeni çalıştırmalar seçilen modeli veya runtime'ı değiştirmeden onu yeniden tercih edebilir. Kullanıcı tarafından sabitlenen profiller o profilde kilitli kalır; başarısız olursa ve model fallback'leri yapılandırılmışsa OpenClaw profil değiştirmek yerine sonraki modele geçer.
</Note>

### OpenAI Codex aboneliği ve API anahtarı yedeği

OpenAI agent modelleri için auth ve runtime ayrıdır. `openai/gpt-*`,
auth bir Codex abonelik profili ile bir OpenAI API anahtarı yedeği arasında
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

Hem ChatGPT/Codex OAuth profilleri hem OpenAI API anahtarı profilleri için
`openai:*` kullanın. Abonelik bir Codex kullanım limitine ulaştığında,
OpenClaw Codex bir zaman sağlıyorsa kesin sıfırlanma zamanını kaydeder, sıradaki
auth profilini dener ve çalıştırmayı Codex harness içinde tutar. Sıfırlanma
zamanı geçtikten sonra abonelik profili yeniden uygun olur ve sonraki otomatik
seçim ona dönebilir.

Yalnızca o oturum için tek bir hesabı/anahtarı zorlamak istediğinizde kullanıcı
tarafından sabitlenmiş profil kullanın. Kullanıcı tarafından sabitlenmiş profiller
kasıtlı olarak katıdır ve sessizce başka bir profile atlamaz.

## Cooldown'lar

Bir profil auth/hız limiti hataları (veya hız limiti gibi görünen bir zaman aşımı) nedeniyle başarısız olduğunda OpenClaw onu cooldown'a işaretler ve sonraki profile geçer.

<AccordionGroup>
  <Accordion title="Hız limiti / zaman aşımı kovasına ne düşer">
    Bu hız limiti kovası düz `429`'dan daha geniştir: `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` ve `weekly/monthly limit reached` gibi periyodik kullanım penceresi limitleri dahil sağlayıcı mesajlarını da içerir.

    Biçim/geçersiz istek hataları genellikle terminaldir; çünkü aynı payload'ı yeniden denemek aynı şekilde başarısız olur. Bu nedenle OpenClaw auth profillerini döndürmek yerine bunları gösterir. Bilinen yeniden deneme-onarım yolları açıkça dahil olabilir: örneğin Cloud Code Assist tool call ID doğrulama hataları sanitize edilir ve `allowFormatRetry` politikası üzerinden bir kez yeniden denenir. `Unhandled stop reason: error`, `stop reason: error` ve `reason: error` gibi OpenAI uyumlu stop-reason hataları zaman aşımı/failover sinyalleri olarak sınıflandırılır.

    Genel sunucu metni, kaynak bilinen bir geçici kalıpla eşleştiğinde bu zaman aşımı kovasına da düşebilir. Örneğin, yalın model runtime stream-wrapper mesajı `An unknown error occurred`, her sağlayıcı için failover'a uygun kabul edilir; çünkü paylaşılan model runtime, sağlayıcı akışları belirli ayrıntılar olmadan `stopReason: "aborted"` veya `stopReason: "error"` ile bittiğinde bunu yayar. `internal server error`, `unknown error, 520`, `upstream error` veya `backend error` gibi geçici sunucu metni içeren JSON `api_error` payload'ları da failover'a uygun zaman aşımları olarak ele alınır.

    Yalın `Provider returned error` gibi OpenRouter'a özgü genel upstream metni, yalnızca sağlayıcı bağlamı gerçekten OpenRouter olduğunda zaman aşımı olarak ele alınır. `LLM request failed with an unknown error.` gibi genel dahili fallback metni temkinli kalır ve tek başına failover tetiklemez.

  </Accordion>
  <Accordion title="SDK retry-after üst sınırları">
    Bazı sağlayıcı SDK'ları, denetimi OpenClaw'a geri vermeden önce uzun bir `Retry-After` penceresi boyunca bekleyebilir. Anthropic ve OpenAI gibi Stainless tabanlı SDK'lar için OpenClaw, SDK içi `retry-after-ms` / `retry-after` beklemelerini varsayılan olarak 60 saniyeyle sınırlar ve bu yük devri yolunun çalışabilmesi için daha uzun yeniden denenebilir yanıtları hemen yüzeye çıkarır. Üst sınırı `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` ile ayarlayın veya devre dışı bırakın; bkz. [Yeniden deneme davranışı](/tr/concepts/retry).
  </Accordion>
  <Accordion title="Model kapsamlı bekleme süreleri">
    Hız sınırı bekleme süreleri model kapsamlı da olabilir:

    - OpenClaw, başarısız olan model kimliği bilindiğinde hız sınırı hataları için `cooldownModel` kaydeder.
    - Aynı sağlayıcıdaki kardeş bir model, bekleme süresi farklı bir modele kapsamlandıysa yine de denenebilir.
    - Faturalandırma/devre dışı pencereleri, modeller genelinde tüm profili yine de engeller.

  </Accordion>
</AccordionGroup>

Bekleme süreleri üstel geri çekilme kullanır:

- 1 dakika
- 5 dakika
- 25 dakika
- 1 saat (üst sınır)

Durum, ajan başına SQLite kimlik doğrulama durumunda `usageStats` altında saklanır:

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

Faturalandırma/kredi hataları (örneğin "insufficient credits" / "credit balance too low") yük devrine değer kabul edilir, ancak genellikle geçici değildir. Kısa bir bekleme süresi yerine OpenClaw profili **devre dışı** olarak işaretler (daha uzun bir geri çekilmeyle) ve bir sonraki profile/sağlayıcıya geçer.

<Note>
Faturalandırma biçimindeki her yanıt `402` değildir ve her HTTP `402` buraya düşmez. Bir sağlayıcı bunun yerine `401` veya `403` döndürse bile OpenClaw açık faturalandırma metnini faturalandırma yolunda tutar, ancak sağlayıcıya özel eşleştiriciler onları sahiplenen sağlayıcıyla sınırlı kalır (örneğin OpenRouter `403 Key limit exceeded`).

Bu sırada geçici `402` kullanım penceresi ve organizasyon/çalışma alanı harcama sınırı hataları, ileti yeniden denenebilir göründüğünde (örneğin `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` veya `organization spending limit exceeded`) `rate_limit` olarak sınıflandırılır. Bunlar uzun faturalandırma devre dışı bırakma yolu yerine kısa bekleme/yük devri yolunda kalır.
</Note>

Durum, ajan başına SQLite kimlik doğrulama durumunda saklanır:

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

- Faturalandırma geri çekilmesi **5 saatte** başlar, her faturalandırma hatasında ikiye katlanır ve **24 saatte** üst sınıra ulaşır.
- Profil **24 saat** boyunca başarısız olmadıysa geri çekilme sayaçları sıfırlanır (yapılandırılabilir).
- Aşırı yüklü yeniden denemeler, model geri dönüşünden önce **1 aynı sağlayıcı profil dönüşüne** izin verir.
- Aşırı yüklü yeniden denemeler varsayılan olarak **0 ms geri çekilme** kullanır.

## Model geri dönüşü

Bir sağlayıcı için tüm profiller başarısız olursa OpenClaw, `agents.defaults.model.fallbacks` içindeki bir sonraki modele geçer. Bu, profil dönüşünü tüketen kimlik doğrulama hataları, hız sınırları ve zaman aşımı durumları için geçerlidir (diğer hatalar geri dönüşü ilerletmez). Yeterli ayrıntı sunmayan sağlayıcı hataları yine de geri dönüş durumunda kesin şekilde etiketlenir: `empty_response`, sağlayıcının kullanılabilir ileti veya durum döndürmediği anlamına gelir; `no_error_details`, sağlayıcının açıkça `Unknown error (no error details in response)` döndürdüğü anlamına gelir; `unclassified` ise OpenClaw'ın ham önizlemeyi koruduğu ancak henüz hiçbir sınıflandırıcının onunla eşleşmediği anlamına gelir.

Aşırı yüklü ve hız sınırı hataları, faturalandırma bekleme sürelerinden daha agresif ele alınır. OpenClaw varsayılan olarak bir aynı sağlayıcı kimlik doğrulama profili yeniden denemesine izin verir, ardından beklemeden bir sonraki yapılandırılmış model geri dönüşüne geçer. `ModelNotReadyException` gibi sağlayıcı meşgul sinyalleri bu aşırı yüklü kovaya düşer. Bunu `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` ve `auth.cooldowns.rateLimitedProfileRotations` ile ayarlayın.

Bir çalıştırma yapılandırılmış varsayılan birincilden, bir cron işi birincilinden, açık geri dönüşleri olan bir ajan birincilinden veya otomatik seçilmiş bir geri dönüş geçersiz kılmasından başladığında OpenClaw, eşleşen yapılandırılmış geri dönüş zincirini izleyebilir. Açık geri dönüşleri olmayan ajan birincilleri ve açık kullanıcı seçimleri (örneğin `/model ollama/qwen3.5:27b`, model seçici, `sessions.patch` veya tek seferlik CLI sağlayıcı/model geçersiz kılmaları) katıdır: bu sağlayıcı/model erişilemezse veya yanıt üretmeden önce başarısız olursa OpenClaw, ilgisiz bir geri dönüşten yanıt vermek yerine hatayı bildirir.

### Aday zinciri kuralları

OpenClaw, aday listesini şu anda istenen `provider/model` ve yapılandırılmış geri dönüşlerden oluşturur.

<AccordionGroup>
  <Accordion title="Kurallar">
    - İstenen model her zaman ilk sıradadır.
    - Açık yapılandırılmış geri dönüşler tekilleştirilir ancak model izin listesince filtrelenmez. Açık operatör niyeti olarak ele alınırlar.
    - Geçerli çalıştırma aynı sağlayıcı ailesindeki yapılandırılmış bir geri dönüş üzerindeyse OpenClaw tam yapılandırılmış zinciri kullanmaya devam eder.
    - Açık bir geri dönüş geçersiz kılması sağlanmadığında, istenen model farklı bir sağlayıcı kullansa bile yapılandırılmış geri dönüşler yapılandırılmış birincilden önce denenir.
    - Geri dönüş çalıştırıcısına açık bir geri dönüş geçersiz kılması sağlanmadığında, yapılandırılmış birincil sona eklenir; böylece önceki adaylar tükendiğinde zincir normal varsayılana geri yerleşebilir.
    - Bir çağıran `fallbacksOverride` sağladığında, çalıştırıcı tam olarak istenen modeli ve o geçersiz kılma listesini kullanır. Boş liste model geri dönüşünü devre dışı bırakır ve yapılandırılmış birincilin gizli bir yeniden deneme hedefi olarak eklenmesini önler.

  </Accordion>
</AccordionGroup>

### Hangi hatalar geri dönüşü ilerletir

<Tabs>
  <Tab title="Şunlarda devam eder">
    - kimlik doğrulama hataları
    - hız sınırları ve bekleme süresi tükenmesi
    - aşırı yüklü/sağlayıcı meşgul hataları
    - zaman aşımı biçimli yük devri hataları
    - faturalandırma devre dışı bırakmaları
    - eski kalıcı modelin dış bir yeniden deneme döngüsü oluşturmaması için yük devri yoluna normalleştirilen `LiveSessionModelSwitchError`
    - hâlâ kalan adaylar olduğunda diğer tanınmayan hatalar

  </Tab>
  <Tab title="Şunlarda devam etmez">
    - zaman aşımı/yük devri biçimli olmayan açık iptaller
    - Compaction/yeniden deneme mantığının içinde kalması gereken bağlam taşması hataları (örneğin `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` veya `ollama error: context length exceeded`)
    - kalan aday olmadığında son bilinmeyen hata
    - Claude Fable 5 güvenlik retleri; doğrudan API anahtarı istekleri bunları bunun yerine Anthropic'in `claude-opus-4-8`'e sunucu tarafı geri dönüşü aracılığıyla sağlayıcı düzeyinde ele alır (bkz. [Anthropic](/tr/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Bekleme süresi atlama ve yoklama davranışı

Bir sağlayıcı için her kimlik doğrulama profili zaten bekleme süresindeyken OpenClaw o sağlayıcıyı otomatik olarak sonsuza dek atlamaz. Aday başına karar verir:

<AccordionGroup>
  <Accordion title="Aday başına kararlar">
    - Kalıcı kimlik doğrulama hataları tüm sağlayıcıyı hemen atlar.
    - Faturalandırma devre dışı bırakmaları genellikle atlar, ancak birincil aday yeniden başlatmadan kurtarmayı mümkün kılmak için bir kısıtlama altında yine de yoklanabilir.
    - Birincil aday, sağlayıcı başına kısıtlamayla bekleme süresi bitimine yakın yoklanabilir.
    - Aynı sağlayıcı geri dönüş kardeşleri, hata geçici göründüğünde (`rate_limit`, `overloaded` veya bilinmeyen) bekleme süresine rağmen denenebilir. Bu, özellikle hız sınırı model kapsamlı olduğunda ve bir kardeş model hâlâ hemen toparlanabileceğinde önemlidir.
    - Geçici bekleme süresi yoklamaları, tek bir sağlayıcının sağlayıcılar arası geri dönüşü durdurmaması için geri dönüş çalıştırması başına sağlayıcı başına birle sınırlıdır.

  </Accordion>
</AccordionGroup>

## Oturum geçersiz kılmaları ve canlı model değiştirme

Oturum model değişiklikleri paylaşılan durumdur. Etkin çalıştırıcı, `/model` komutu, Compaction/oturum güncellemeleri ve canlı oturum uzlaştırması aynı oturum girdisinin parçalarını okur veya yazar.

Bu, geri dönüş yeniden denemelerinin canlı model değiştirmeyle koordine olması gerektiği anlamına gelir:

- Yalnızca açık kullanıcı güdümlü model değişiklikleri bekleyen bir canlı değiştirmeyi işaretler. Buna `/model`, `session_status(model=...)` ve `sessions.patch` dahildir.
- Geri dönüş dönüşü, Heartbeat geçersiz kılmaları veya Compaction gibi sistem güdümlü model değişiklikleri kendi başlarına bekleyen canlı değiştirmeyi asla işaretlemez.
- Kullanıcı güdümlü model geçersiz kılmaları, geri dönüş politikası için kesin seçimler olarak ele alınır; bu nedenle erişilemeyen seçilmiş bir sağlayıcı, `agents.defaults.model.fallbacks` tarafından maskelenmek yerine hata olarak yüzeye çıkar.
- Bir geri dönüş yeniden denemesi başlamadan önce yanıt çalıştırıcısı, seçilen geri dönüş geçersiz kılma alanlarını oturum girdisine kalıcı olarak yazar.
- Otomatik geri dönüş geçersiz kılmaları sonraki turlarda seçili kalır; böylece OpenClaw bilinen kötü birincili her iletide yoklamaz. OpenClaw yapılandırılmış kaynağı periyodik olarak yeniden yoklar ve toparlandığında otomatik geçersiz kılmayı temizler; `/new`, `/reset` ve `sessions.reset` otomatik kaynaklı geçersiz kılmaları hemen temizler.
- Kullanıcı yanıtları, geri dönüş geçişlerini ve geri dönüş temizlenmiş toparlanmayı durum değişikliği başına bir kez duyurur. Yapışkan geri dönüş turları bildirimi yinelemez.
- `/status` seçilen modeli ve geri dönüş durumu farklı olduğunda etkin geri dönüş modelini ve nedeni gösterir.
- Canlı oturum uzlaştırması, eski runtime model alanları yerine kalıcı oturum geçersiz kılmalarını tercih eder.
- Bir canlı değiştirme hatası etkin geri dönüş zincirindeki daha sonraki bir adayı işaret ediyorsa OpenClaw önce ilgisiz adaylar arasında yürümek yerine doğrudan o seçili modele atlar.
- Geri dönüş denemesi başarısız olursa çalıştırıcı yalnızca yazdığı geçersiz kılma alanlarını ve yalnızca hâlâ o başarısız adayla eşleşiyorlarsa geri alır.

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

Kalıcı geri dönüş geçersiz kılması bu pencereyi kapatır ve dar geri alma, daha yeni manuel veya runtime oturum değişikliklerini olduğu gibi tutar.

## Gözlemlenebilirlik ve hata özetleri

`runWithModelFallback(...)`, günlükleri ve kullanıcıya dönük bekleme süresi mesajlaşmasını besleyen deneme başına ayrıntıları kaydeder:

- denenen sağlayıcı/model
- neden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` ve benzer yük devri nedenleri)
- isteğe bağlı durum/kod
- insan tarafından okunabilir hata özeti

Yapılandırılmış `model_fallback_decision` günlükleri, bir aday başarısız olduğunda, atlandığında veya daha sonraki bir geri dönüş başarılı olduğunda düz `fallbackStep*` alanlarını da içerir. Bu alanlar denenen geçişi açık hale getirir (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`); böylece günlük ve tanılama dışa aktarıcıları, son geri dönüş de başarısız olsa bile birincil hatayı yeniden oluşturabilir.

Her aday başarısız olduğunda OpenClaw `FallbackSummaryError` fırlatır. Dış yanıt çalıştırıcısı bunu, "tüm modeller geçici olarak hız sınırında" gibi daha belirli bir ileti oluşturmak ve biliniyorsa en yakın bekleme süresi bitimini eklemek için kullanabilir.

Bu bekleme süresi özeti model farkındadır:

- ilgisiz model kapsamlı hız sınırları, denenen sağlayıcı/model zinciri için yok sayılır
- kalan engel eşleşen model kapsamlı bir hız sınırıysa OpenClaw, o modeli hâlâ engelleyen son eşleşen bitiş zamanını bildirir

## İlgili yapılandırma

Şunun için bkz. [Gateway yapılandırması](/tr/gateway/configuration):

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` yönlendirmesi

Daha kapsamlı model seçimi ve yedek davranışı özeti için [Modeller](/tr/concepts/models) bölümüne bakın.
