---
read_when:
    - Kimlik doğrulama profili rotasyonu, bekleme süreleri veya model yedek davranışını tanılama
    - Kimlik doğrulama profilleri veya modeller için yük devretme kurallarını güncelleme
    - Oturum modeli geçersiz kılmalarının yedek seçenek yeniden denemeleriyle nasıl etkileşime girdiğini anlama
sidebarTitle: Model failover
summary: OpenClaw kimlik doğrulama profillerini nasıl döndürür ve modeller arasında nasıl geri dönüş yapar
title: Model yük devretme
x-i18n:
    generated_at: "2026-07-12T11:38:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2da6399c8f5c6d9ab40486b553a41600a3c8eb64efa09e72784b81e42edbba61
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw hataları iki aşamada ele alır:

1. Mevcut sağlayıcı içinde **kimlik doğrulama profili rotasyonu**.
2. `agents.defaults.model.fallbacks` içindeki sonraki modele **model geri dönüşü**.

## Çalışma zamanı akışı

<Steps>
  <Step title="Oturum durumunu çözümle">
    Etkin oturum modelini ve kimlik doğrulama profili tercihini çözümleyin.
  </Step>
  <Step title="Aday zincirini oluştur">
    Model aday zincirini, mevcut model seçiminden ve bu seçim kaynağına yönelik geri dönüş politikasından oluşturun. Yapılandırılmış varsayılanlar, Cron işi birincil modelleri ve otomatik seçilen geri dönüş modelleri yapılandırılmış geri dönüşleri kullanabilir; açık kullanıcı oturumu seçimleri katıdır.
  </Step>
  <Step title="Mevcut sağlayıcıyı dene">
    Mevcut sağlayıcıyı kimlik doğrulama profili rotasyonu/bekleme süresi kurallarıyla deneyin.
  </Step>
  <Step title="Yük devretmeye uygun hatalarda ilerle">
    Bu sağlayıcının seçenekleri yük devretmeye uygun bir hatayla tükenirse sonraki model adayına geçin.
  </Step>
  <Step title="Geri dönüş geçersiz kılmasını kalıcılaştır">
    Yeniden deneme başlamadan önce seçilen geri dönüş geçersiz kılmasını kalıcılaştırın; böylece diğer oturum okuyucuları, çalıştırıcının kullanmak üzere olduğu sağlayıcı/model çiftini görür. Kalıcılaştırılan model geçersiz kılması `modelOverrideSource: "auto"` olarak işaretlenir.
  </Step>
  <Step title="Hata durumunda sınırlı biçimde geri al">
    Geri dönüş adayı başarısız olursa yalnızca geri dönüşün sahip olduğu oturum geçersiz kılma alanlarını, hâlâ başarısız adayla eşleşiyorlarsa geri alın.
  </Step>
  <Step title="Tüm seçenekler tükenirse FallbackSummaryError fırlat">
    Her aday başarısız olursa her denemeye ilişkin ayrıntıları ve biliniyorsa en yakın bekleme süresi bitişini içeren bir `FallbackSummaryError` fırlatın.
  </Step>
</Steps>

Bu yaklaşım kasıtlı olarak "tüm oturumu kaydet ve geri yükle" yaklaşımından daha sınırlıdır. Yanıt çalıştırıcısı yalnızca geri dönüş için sahip olduğu model seçimi alanlarını kalıcılaştırır: `providerOverride`, `modelOverride`, `modelOverrideSource`, `authProfileOverride`, `authProfileOverrideSource`, `authProfileOverrideCompactionCount`. Bu, başarısız bir geri dönüş yeniden denemesinin, deneme sürerken gerçekleşen manuel bir `/model` değişikliği veya oturum rotasyonu güncellemesi gibi daha yeni ve ilgisiz oturum değişikliklerinin üzerine yazmasını önler.

## Seçim kaynağı politikası

Seçim kaynağı, geri dönüş zincirine izin verilip verilmediğini denetler:

- **Yapılandırılmış varsayılan**: `agents.defaults.model.primary`, `agents.defaults.model.fallbacks` değerini kullanır.
- **Aracı birincil modeli**: `agents.list[].model`, ilgili aracının model nesnesi kendi `fallbacks` alanını içermediği sürece katıdır. Katı davranışı açıkça belirtmek için `fallbacks: []`, ilgili aracı için model geri dönüşünü etkinleştirmek üzere boş olmayan bir liste kullanın.
- **Otomatik geri dönüş geçersiz kılması**: Çalışma zamanı geri dönüşü, yeniden denemeden önce `providerOverride`, `modelOverride`, `modelOverrideSource: "auto"` ve seçilen kaynak modeli yazar. Bu geçersiz kılma, her iletide birincil modeli yoklamadan yapılandırılmış geri dönüş zincirinde ilerlemeyi sürdürür; ancak OpenClaw yapılandırılmış kaynağı her 5 dakikada bir (yapılandırılamaz) yoklar ve kaynak düzeldiğinde geçersiz kılmayı temizler. `/new`, `/reset` ve `sessions.reset` de otomatik kaynaklı geçersiz kılmaları temizler. Açık bir `heartbeat.model` olmadan çalışan Heartbeat işlemleri, kaynakları artık geçerli yapılandırılmış varsayılanla eşleşmediğinde doğrudan otomatik geçersiz kılmaları temizler.
- **Kullanıcı oturumu geçersiz kılması**: `/model`, model seçici, `session_status(model=...)` ve `sessions.patch`, `modelOverrideSource: "user"` değerini yazar. Bu, kesin bir oturum seçimidir. Seçilen sağlayıcı/model yanıt üretmeden önce başarısız olursa OpenClaw, ilgisiz bir yapılandırılmış geri dönüşten yanıt vermek yerine hatayı bildirir.
- **Eski oturum geçersiz kılması**: Eski oturum girdilerinde `modelOverrideSource` olmadan `modelOverride` bulunabilir. Açık bir eski seçimin sessizce geri dönüş davranışına dönüştürülmemesi için OpenClaw bunları kullanıcı geçersiz kılmaları olarak değerlendirir.
- **Cron yük modeli**: Bir Cron işindeki `payload.model` / `--model`, kullanıcı oturumu geçersiz kılması değil, işin birincil modelidir. İş `payload.fallbacks` sağlamadığı sürece yapılandırılmış geri dönüşleri kullanır; `payload.fallbacks: []`, Cron çalışmasını katı hâle getirir.

OpenClaw, başarısız bir birincil modelin her turda yeniden denenmemesi için son birincil yoklamaları oturum ve birincil model bazında hatırlar. Bir oturum geri dönüşe geçtiğinde görünür bir bildirim, seçilen birincil modele döndüğünde ise başka bir bildirim gönderir; kalıcı geri dönüşteki her turda bildirimi yinelemez.

## Kimlik doğrulama hatası atlama önbelleği

Varsayılan olarak her yeni tur, mevcut geri dönüş yeniden deneme davranışını korur: OpenClaw, yakın zamanda `auth` veya `auth_permanent` hatasıyla başarısız olan birincil olmayan adaylar dâhil olmak üzere yapılandırılmış her geri dönüş adayını yeniden dener.

Yinelenen kimlik doğrulama hatalarını engellemek için şunu etkinleştirin:

```bash
OPENCLAW_FALLBACK_SKIP_TTL_MS=60000
```

Etkinleştirildiğinde OpenClaw, kimlik doğrulama sınıfı bir hatadan sonra birincil olmayan geri dönüş adayı için oturum kimliği, sağlayıcı ve model anahtarlarına dayalı, bellek içi ve oturum kapsamlı bir atlama işareti kaydeder. Birincil adaylar hiçbir zaman atlanmaz; böylece açık bir kullanıcı model seçimi gerçek kimlik doğrulama hatasını göstermeye devam eder. Önbellek işlem yereldir ve Gateway yeniden başlatıldığında temizlenir.

Değer, milisaniye cinsinden bir TTL'dir. `0` değeri veya ayarlanmamış olması önbelleği devre dışı bırakır. Pozitif değerler 1 saniye ile 10 dakika arasında sınırlandırılır.

## Kullanıcıya görünür geri dönüş bildirimleri

Bir oturum otomatik seçilen bir geri dönüşe geçtiğinde OpenClaw, aynı yanıt yüzeyinde bir durum bildirimi gönderir:

```text
↪️ Model Geri Dönüşü: <fallback> (<primary> seçildi; <reason>)
```

Daha sonraki bir yoklama başarılı olduğunda ve oturum seçilen birincil modele döndüğünde OpenClaw şunu gönderir:

```text
↪️ Model Geri Dönüşü temizlendi: <primary> (önceki: <fallback>)
```

Bu bildirimler yardımcı içeriği değil, işletim iletileridir. Uygun olduğunda yalnızca yan etki içeren turlar da dâhil olmak üzere durum değişikliği başına bir kez iletilirler; ancak kalıcı geri dönüş turlarında yinelenmezler. İletim, normal kaynak yanıtı engellemesini atlar, iş parçacıklı kanallarda ilk yardımcı yanıtı yuvasını tüketmez ve metinden sese dönüştürme ile taahhüt çıkarımının dışında tutulur.

## Kimlik doğrulama depolaması (anahtarlar + OAuth)

OpenClaw hem API anahtarları hem de OAuth belirteçleri için **kimlik doğrulama profilleri** kullanır.

- Gizli bilgiler ve çalışma zamanı kimlik doğrulama yönlendirme durumu `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` içinde bulunur.
- `auth.profiles` / `auth.order` yapılandırması **yalnızca meta veri + yönlendirme** içerir (gizli bilgi içermez).
- Yalnızca eski içe aktarma için kullanılan OAuth dosyası: `~/.openclaw/credentials/oauth.json` (ilk kullanımda aracı başına kimlik doğrulama deposuna aktarılır).
- Eski `auth-profiles.json`, `auth-state.json` ve aracı başına `auth.json` dosyaları `openclaw doctor --fix` tarafından içe aktarılır.

Daha fazla ayrıntı: [OAuth](/tr/concepts/oauth)

Kimlik bilgisi türleri:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (bazı sağlayıcılar için ek olarak `projectId`/`enterpriseUrl`)
- `type: "token"` → isteğe bağlı olarak süresi dolabilen, statik taşıyıcı tarzı belirteç; OpenClaw bunu yenilemez (`aws-sdk` ve diğer kimlik bilgisi zinciri kimlik doğrulama kipleri için kullanılır)

## Profil kimlikleri

OAuth oturum açma işlemleri, birden fazla hesabın birlikte kullanılabilmesi için ayrı profiller oluşturur.

- Varsayılan: E-posta mevcut olmadığında `provider:default`.
- E-posta ile OAuth: `provider:<email>` (örneğin `google-antigravity:user@gmail.com`).

Profiller, aracı başına `openclaw-agent.sqlite` kimlik doğrulama profili deposunda bulunur.

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
    Sağlayıcı için aracı başına SQLite kimlik doğrulama profili girdileri.
  </Step>
</Steps>

Açık bir sıra yapılandırılmamışsa OpenClaw dönüşümlü bir sıra kullanır:

- **Birincil anahtar:** profil türü (**önce OAuth, ardından statik belirteç, sonra API anahtarı**).
- **İkincil anahtar:** `usageStats.lastUsed` (her tür içinde en eski önce).
- **Bekleme süresindeki/devre dışı profiller**, en yakın süre sonu önce olacak şekilde sona taşınır.

### Oturum kalıcılığı (önbellek dostu)

OpenClaw, sağlayıcı önbelleklerini sıcak tutmak için **seçilen kimlik doğrulama profilini oturum başına sabitler**. Her istekte rotasyon yapmaz. Sabitlenen profil şu durumlardan birine kadar yeniden kullanılır:

- oturum sıfırlanır (`/new` / `/reset`)
- bir Compaction tamamlanır (Compaction sayısı artar)
- profil bekleme süresindedir/devre dışıdır

`/model …@<profileId>` aracılığıyla yapılan manuel seçim, ilgili oturum için bir **kullanıcı geçersiz kılması** ayarlar ve yeni bir oturum başlayana kadar otomatik olarak döndürülmez.

<Note>
Otomatik sabitlenen profiller (oturum yönlendiricisi tarafından seçilenler) bir **tercih** olarak değerlendirilir: Önce bunlar denenir, ancak OpenClaw hız sınırları/zaman aşımlarında başka bir profile geçebilir. Asıl profil yeniden kullanılabilir olduğunda yeni çalışmalar, seçilen modeli veya çalışma zamanını değiştirmeden onu tekrar tercih edebilir. Kullanıcı tarafından sabitlenen profiller ilgili profile kilitli kalır; profil başarısız olur ve model geri dönüşleri yapılandırılmışsa OpenClaw profil değiştirmek yerine sonraki modele geçer.
</Note>

### OpenAI Codex aboneliği ve API anahtarı yedeği

OpenAI aracı modellerinde kimlik doğrulama ve çalışma zamanı ayrıdır. Kimlik doğrulama, Codex abonelik profili ile OpenAI API anahtarı yedeği arasında dönebilirken `openai/gpt-*` Codex koşumunda kalır.

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

Hem ChatGPT/Codex OAuth profilleri hem de OpenAI API anahtarı profilleri için `openai:*` kullanın. Abonelik bir Codex kullanım sınırına ulaştığında OpenClaw, Codex tarafından sağlanmışsa kesin sıfırlanma zamanını kaydeder, sıradaki kimlik doğrulama profilini dener ve çalışmayı Codex koşumu içinde tutar. Sıfırlanma zamanı geçtikten sonra abonelik profili yeniden uygun hâle gelir ve sonraki otomatik seçim bu profile dönebilir.

Yalnızca ilgili oturum için tek bir hesabı/anahtarı zorunlu kılmak istediğinizde kullanıcı tarafından sabitlenen bir profil kullanın. Kullanıcı tarafından sabitlenen profiller kasıtlı olarak katıdır ve sessizce başka bir profile geçmez.

## Bekleme süreleri

Bir profil kimlik doğrulama/hız sınırı hataları (veya hız sınırlamasına benzeyen bir zaman aşımı) nedeniyle başarısız olduğunda OpenClaw profili bekleme süresine alır ve sonraki profile geçer.

<AccordionGroup>
  <Accordion title="Hız sınırı / zaman aşımı grubuna girenler">
    Bu hız sınırı grubu düz `429` hatasından daha geniştir: `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` gibi sağlayıcı iletilerini ve `weekly limit reached` veya `monthly limit exhausted` gibi dönemsel kullanım penceresi sınırlarını da içerir.

    Biçim/geçersiz istek hataları genellikle sonlandırıcıdır; çünkü aynı yükü yeniden denemek aynı şekilde başarısız olur. Bu nedenle OpenClaw, kimlik doğrulama profillerini döndürmek yerine bu hataları gösterir. Bilinen yeniden deneme-onarım yolları açıkça etkinleştirilebilir: Örneğin Cloud Code Assist araç çağrısı kimliği doğrulama hataları temizlenir ve `allowFormatRetry` politikası aracılığıyla bir kez yeniden denenir. `Unhandled stop reason: error`, `stop reason: error` ve `reason: error` gibi OpenAI uyumlu durma nedeni hataları, zaman aşımı/yük devretme sinyalleri olarak sınıflandırılır.

    Kaynak bilinen geçici bir kalıpla eşleştiğinde genel sunucu metni de bu zaman aşımı grubuna girebilir. Örneğin yalın model çalışma zamanı akış sarmalayıcısı iletisi `An unknown error occurred`, paylaşılan model çalışma zamanı tarafından sağlayıcı akışları belirli ayrıntılar olmadan `stopReason: "aborted"` veya `stopReason: "error"` ile sona erdiğinde yayımlandığından her sağlayıcı için yük devretmeye uygun kabul edilir. `internal server error`, `unknown error, 520`, `upstream error` veya `backend error` gibi geçici sunucu metinleri içeren JSON `api_error` yükleri de yük devretmeye uygun zaman aşımları olarak değerlendirilir.

    Yalın `Provider returned error` gibi OpenRouter'a özgü genel yukarı akış metni, yalnızca sağlayıcı bağlamı gerçekten OpenRouter olduğunda zaman aşımı olarak değerlendirilir. `LLM request failed with an unknown error.` gibi genel dâhilî geri dönüş metni ihtiyatlı biçimde ele alınır ve tek başına yük devretmeyi tetiklemez.

  </Accordion>
  <Accordion title="SDK retry-after üst sınırları">
    Bazı sağlayıcı SDK'ları, denetimi OpenClaw'a geri vermeden önce uzun bir `Retry-After` süresi boyunca bekleyebilir. Anthropic ve OpenAI gibi Stainless tabanlı SDK'larda OpenClaw, SDK içindeki `retry-after-ms` / `retry-after` beklemelerini varsayılan olarak 60 saniyeyle sınırlar ve bu yük devretme yolunun çalışabilmesi için daha uzun süre sonra yeniden denenebilir yanıtları hemen iletir. Üst sınırı `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` ile ayarlayın veya devre dışı bırakın; bkz. [Yeniden deneme davranışı](/tr/concepts/retry).
  </Accordion>
  <Accordion title="Model kapsamlı bekleme süreleri">
    Hız sınırı bekleme süreleri model kapsamında da olabilir:

    - OpenClaw, başarısız olan model kimliği bilindiğinde hız sınırı hataları için `cooldownModel` değerini kaydeder.
    - Bekleme süresi farklı bir modelle sınırlıysa aynı sağlayıcıdaki kardeş bir model yine de denenebilir.
    - Faturalandırma/devre dışı bırakma süreleri modeller genelinde profilin tamamını engellemeye devam eder.

  </Accordion>
</AccordionGroup>

Normal (faturalandırma dışı, kalıcı kimlik doğrulama dışı) bekleme süreleri, profilin son hata sayısına göre artar:

- 1. hata: 30 saniye
- 2. hata: 1 dakika
- 3. ve sonraki hatalar: 5 dakika (üst sınır)

Profilin hata penceresi sona erdiğinde sayaçlar sıfırlanır (`auth.cooldowns.failureWindowHours`, varsayılan 24).

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

## Faturalandırma nedeniyle devre dışı bırakma

Faturalandırma/kredi hataları (örneğin "yetersiz kredi" / "kredi bakiyesi çok düşük") yük devretmeyi gerektiren durumlar olarak değerlendirilir, ancak genellikle geçici değildir. OpenClaw, kısa bir bekleme süresi uygulamak yerine profili daha uzun bir geri çekilme süresiyle **devre dışı** olarak işaretler ve sonraki profile/sağlayıcıya geçer.

<Note>
Faturalandırmayı çağrıştıran her yanıt `402` değildir ve her HTTP `402` yanıtı da buraya yönlendirilmez. Bir sağlayıcı bunun yerine `401` veya `403` döndürse bile OpenClaw, açık faturalandırma ifadelerini faturalandırma yolunda tutar; ancak sağlayıcıya özgü eşleştiriciler bunların sahibi olan sağlayıcıyla sınırlı kalır (örneğin OpenRouter `403 Key limit exceeded`).

Bu arada geçici `402` kullanım penceresi ve kuruluş/çalışma alanı harcama sınırı hataları, ileti yeniden denenebilir görünüyorsa `rate_limit` olarak sınıflandırılır (örneğin `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` veya `organization spending limit exceeded`). Bunlar, uzun faturalandırma nedeniyle devre dışı bırakma yolu yerine kısa bekleme/yük devretme yolunda kalır.
</Note>

Yüksek güvenilirlikli kalıcı kimlik doğrulama hataları (iptal edilmiş/devre dışı bırakılmış anahtarlar, devre dışı bırakılmış çalışma alanları) benzer bir devre dışı bırakma yoluna girer; ancak bazı sağlayıcılar olaylar sırasında geçici olarak kimlik doğrulama hatasına benzeyen yükler döndürdüğünden, faturalandırma hatalarına göre çok daha kısa sürede toparlanır.

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

Varsayılanlar (`auth.cooldowns.*`):

| Anahtar                       | Varsayılan | Amaç                                                                                     |
| ----------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `billingBackoffHours`         | 5          | Temel faturalandırma geri çekilme süresi; her faturalandırma hatasında iki katına çıkar   |
| `billingMaxHours`             | 24         | Faturalandırma geri çekilme süresinin üst sınırı                                         |
| `authPermanentBackoffMinutes` | 10         | Yüksek güvenilirlikli kalıcı kimlik doğrulama hataları için temel geri çekilme süresi     |
| `authPermanentMaxMinutes`     | 60         | Bu geri çekilme süresinin üst sınırı                                                     |
| `failureWindowHours`          | 24         | Bu pencere içinde hata oluşmazsa hata sayaçları sıfırlanır                               |
| `overloadedProfileRotations`  | 1          | Aşırı yükte model yedeğine geçmeden önce izin verilen aynı sağlayıcı profil geçişleri     |
| `overloadedBackoffMs`         | 0          | Aşırı yük nedeniyle profil geçişini yeniden denemeden önceki sabit gecikme                |
| `rateLimitedProfileRotations` | 1          | Hız sınırında model yedeğine geçmeden önce izin verilen aynı sağlayıcı profil geçişleri   |

Aşırı yük ve hız sınırı hataları, faturalandırma bekleme sürelerine göre daha agresif ele alınır: OpenClaw varsayılan olarak aynı sağlayıcıdaki kimlik doğrulama profiliyle bir kez yeniden denemeye izin verir, ardından beklemeden yapılandırılmış sonraki yedek modele geçer.

## Model yedeğine geçiş

Bir sağlayıcının tüm profilleri başarısız olursa OpenClaw, `agents.defaults.model.fallbacks` içindeki sonraki modele geçer. Bu davranış; kimlik doğrulama hataları, hız sınırları ve profil geçişlerini tüketen zaman aşımları için geçerlidir (diğer hatalar yedek modele ilerletmez). Yeterli ayrıntı sunmayan sağlayıcı hataları da yedek durumunda hassas biçimde etiketlenir: `empty_response`, sağlayıcının kullanılabilir bir ileti veya durum döndürmediği anlamına gelir; `no_error_details`, sağlayıcının açıkça `Unknown error (no error details in response)` döndürdüğü anlamına gelir; `unclassified` ise OpenClaw'ın ham önizlemeyi koruduğu ancak henüz hiçbir sınıflandırıcının eşleşmediği anlamına gelir.

`ModelNotReadyException` gibi sağlayıcının meşgul olduğunu belirten sinyaller aşırı yük kategorisine girer ve hız sınırlarıyla aynı şekilde bir profil geçişi ardından yedeğe geçme ilkesini izler (yukarıdaki varsayılanlar tablosuna bakın).

Bir çalıştırma; yapılandırılmış varsayılan birincil modelden, bir Cron işi birincil modelinden, açık yedekleri olan bir ajan birincil modelinden veya otomatik seçilmiş bir yedek geçersiz kılmasından başlatıldığında OpenClaw, eşleşen yapılandırılmış yedek zincirini izleyebilir. Açık yedekleri olmayan ajan birincil modelleri ve açık kullanıcı seçimleri (örneğin `/model ollama/qwen3.5:27b`, model seçici, `sessions.patch` veya tek seferlik CLI sağlayıcı/model geçersiz kılmaları) katıdır: söz konusu sağlayıcıya/modele erişilemiyorsa veya yanıt üretmeden önce başarısız olursa OpenClaw, ilgisiz bir yedekten yanıt vermek yerine hatayı bildirir.

### Aday zinciri kuralları

OpenClaw, aday listesini o anda istenen `provider/model` ile yapılandırılmış yedeklerden oluşturur.

<AccordionGroup>
  <Accordion title="Kurallar">
    - İstenen model her zaman ilk sıradadır.
    - Açıkça yapılandırılmış yedeklerde yinelenenler kaldırılır ancak model izin listesine göre filtrelenmez. Bunlar, operatörün açık niyeti olarak değerlendirilir.
    - Geçerli çalıştırma zaten aynı sağlayıcı ailesindeki yapılandırılmış bir yedekteyse OpenClaw, yapılandırılmış zincirin tamamını kullanmaya devam eder.
    - Açık bir yedek geçersiz kılması sağlanmadığında, istenen model farklı bir sağlayıcı kullansa bile yapılandırılmış yedekler yapılandırılmış birincil modelden önce denenir.
    - Yedek çalıştırıcıya açık bir yedek geçersiz kılması sağlanmadığında, önceki adaylar tükendikten sonra zincirin normal varsayılana dönebilmesi için yapılandırılmış birincil model sona eklenir.
    - Çağıran taraf `fallbacksOverride` sağladığında çalıştırıcı yalnızca istenen modeli ve bu geçersiz kılma listesini kullanır. Boş bir liste model yedeğine geçişi devre dışı bırakır ve yapılandırılmış birincil modelin gizli bir yeniden deneme hedefi olarak eklenmesini önler.

  </Accordion>
</AccordionGroup>

### Hangi hatalar yedeğe geçişi ilerletir?

<Tabs>
  <Tab title="Şu durumlarda devam eder">
    - kimlik doğrulama hataları
    - hız sınırları ve bekleme süresinin tükenmesi
    - aşırı yük/sağlayıcı meşgul hataları
    - zaman aşımı biçimindeki yük devretme hataları
    - faturalandırma nedeniyle devre dışı bırakmalar
    - kalıcı duruma kaydedilmiş eski bir modelin dış yeniden deneme döngüsü oluşturmaması için yük devretme yoluna normalleştirilen `LiveSessionModelSwitchError`
    - hâlâ kalan adaylar varken diğer tanınmayan hatalar

  </Tab>
  <Tab title="Şu durumlarda devam etmez">
    - zaman aşımı/yük devretme biçiminde olmayan açık iptaller
    - Compaction/yeniden deneme mantığı içinde kalması gereken bağlam taşması hataları (örneğin `request_too_large`, `input token count exceeds the maximum number of input tokens`, `input exceeds the maximum number of tokens`, `input too long for the model` veya `ollama error: context length exceeded`)
    - hiç aday kalmadığında oluşan son bilinmeyen hata
    - Claude Fable 5 güvenlik retleri; doğrudan API anahtarı istekleri bunları bunun yerine Anthropic'in sunucu tarafında `claude-opus-4-8` modeline geçişi aracılığıyla sağlayıcı düzeyinde işler (bkz. [Anthropic](/tr/providers/anthropic#safety-refusal-fallback-claude-fable-5))

  </Tab>
</Tabs>

### Bekleme süresinde atlama ve yoklama davranışı

Bir sağlayıcının tüm kimlik doğrulama profilleri zaten bekleme süresindeyken OpenClaw bu sağlayıcıyı otomatik olarak sonsuza dek atlamaz. Her aday için ayrı bir karar verir:

<AccordionGroup>
  <Accordion title="Aday başına kararlar">
    - Kalıcı kimlik doğrulama hataları sağlayıcının tamamının hemen atlanmasına neden olur.
    - Faturalandırma nedeniyle devre dışı bırakmalar genellikle atlanır ancak yeniden başlatma gerektirmeden kurtarmayı mümkün kılmak için birincil aday belirli aralıklarla yine de yoklanabilir.
    - Birincil aday, sağlayıcı başına sıklık sınırlamasıyla bekleme süresinin bitimine yakın yoklanabilir.
    - Hata geçici görünüyorsa (`rate_limit`, `overloaded` veya bilinmeyen), aynı sağlayıcıdaki kardeş yedekler bekleme süresine rağmen denenebilir. Bu özellikle hız sınırı model kapsamında olduğunda ve kardeş bir modelin hemen toparlanabilmesi durumunda önemlidir.
    - Tek bir sağlayıcının sağlayıcılar arası yedeğe geçişi geciktirmemesi için geçici bekleme süresi yoklamaları, her yedek çalıştırmasında sağlayıcı başına bir kezle sınırlıdır.

  </Accordion>
</AccordionGroup>

## Oturum geçersiz kılmaları ve canlı model değiştirme

Oturum modeli değişiklikleri paylaşılan durumdur. Etkin çalıştırıcı, `/model` komutu, Compaction/oturum güncellemeleri ve canlı oturum uzlaştırması aynı oturum girdisinin farklı bölümlerini okur veya yazar.

Bu nedenle yedek yeniden denemelerinin canlı model değiştirmeyle koordineli çalışması gerekir:

- Yalnızca kullanıcı tarafından açıkça gerçekleştirilen model değişiklikleri, bekleyen bir canlı geçişi işaretler. Buna `/model`, `session_status(model=...)` ve `sessions.patch` dahildir.
- Yedek geçişi, Heartbeat geçersiz kılmaları veya Compaction gibi sistem kaynaklı model değişiklikleri kendi başlarına bekleyen bir canlı geçişi işaretlemez.
- Kullanıcı kaynaklı model geçersiz kılmaları, yedek ilkesi açısından kesin seçimler olarak değerlendirilir; bu nedenle erişilemeyen seçili bir sağlayıcı, `agents.defaults.model.fallbacks` tarafından gizlenmek yerine hata olarak gösterilir.
- Yedek yeniden denemesi başlamadan önce yanıt çalıştırıcısı, seçilen yedek geçersiz kılma alanlarını oturum girdisine kalıcı olarak yazar.
- Otomatik yedek geçersiz kılmaları sonraki turlarda seçili kalır; böylece OpenClaw her iletide hatalı olduğu bilinen birincil modeli yoklamaz. OpenClaw, yapılandırılmış kaynağı düzenli olarak yeniden yoklar ve kaynak toparlandığında otomatik geçersiz kılmayı temizler; `/new`, `/reset` ve `sessions.reset`, otomatik kaynaklı geçersiz kılmaları hemen temizler.
- Kullanıcı yanıtları, her durum değişikliğinde yedeğe geçişleri ve yedeğin kaldırılmasıyla gerçekleşen toparlanmayı bir kez bildirir. Kalıcı yedek turları bildirimi tekrarlamaz.
- `/status`, seçilen modeli; yedek durumu farklı olduğunda ise etkin yedek modeli ve nedenini gösterir.
- Canlı oturum uzlaştırması, eski çalışma zamanı model alanları yerine kalıcı oturum geçersiz kılmalarını tercih eder.
- Bir canlı geçiş hatası etkin yedek zincirindeki sonraki bir adayı işaret ediyorsa OpenClaw, önce ilgisiz adayları dolaşmak yerine doğrudan seçilen modele atlar.
- Yedek denemesi başarısız olursa çalıştırıcı yalnızca kendisinin yazdığı geçersiz kılma alanlarını ve yalnızca hâlâ başarısız adayla eşleşiyorlarsa geri alır.

Bu, klasik yarış durumunu önler:

<Steps>
  <Step title="Birincil model başarısız olur">
    Seçilen birincil model başarısız olur.
  </Step>
  <Step title="Yedek bellekte seçilir">
    Yedek aday bellekte seçilir.
  </Step>
  <Step title="Oturum deposu hâlâ eski birincil modeli gösterir">
    Oturum deposu hâlâ eski birincil modeli yansıtır.
  </Step>
  <Step title="Canlı uzlaştırma eski durumu okur">
    Canlı oturum uzlaştırması eski oturum durumunu okur.
  </Step>
  <Step title="Yeniden deneme eski modele döner">
    Yedek denemesi başlamadan önce yeniden deneme eski modele geri döndürülür.
  </Step>
</Steps>

Kalıcı olarak yazılan yedek geçersiz kılması bu pencereyi kapatır; dar kapsamlı geri alma ise daha yeni manuel veya çalışma zamanı oturum değişikliklerini korur.

## Gözlemlenebilirlik ve hata özetleri

`runWithModelFallback(...)`, günlükleri ve kullanıcıya gösterilen bekleme süresi iletilerini besleyen deneme başına ayrıntıları kaydeder:

- denenen sağlayıcı/model
- neden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` ve benzer yük devretme nedenleri)
- isteğe bağlı durum/kod
- insan tarafından okunabilir hata özeti

Yapılandırılmış `model_fallback_decision` günlükleri ayrıca bir aday başarısız olduğunda, atlandığında veya sonraki bir yük devretme başarılı olduğunda düz `fallbackStep*` alanlarını içerir. Bu alanlar, denenen geçişi açıkça belirtir (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome); böylece günlük ve tanılama dışa aktarıcıları, son yük devretme de başarısız olsa bile birincil hatayı yeniden oluşturabilir.

Tüm adaylar başarısız olduğunda OpenClaw, `FallbackSummaryError` hatasını oluşturur. Dış yanıt çalıştırıcısı bunu kullanarak "tüm modeller geçici olarak hız sınırına tabi" gibi daha özel bir mesaj oluşturabilir ve biliniyorsa en yakın bekleme süresi bitişini ekleyebilir.

Bu bekleme süresi özeti modeli dikkate alır:

- denenen sağlayıcı/model zinciriyle ilgisi olmayan model kapsamlı hız sınırları yok sayılır
- kalan engel, eşleşen model kapsamlı bir hız sınırıysa OpenClaw, söz konusu modeli hâlâ engelleyen son eşleşen bitiş zamanını bildirir

## İlgili yapılandırma

Şunlar için [Gateway yapılandırması](/gateway/configuration) bölümüne bakın:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.authPermanentBackoffMinutes` / `auth.cooldowns.authPermanentMaxMinutes`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` yönlendirmesi

Daha kapsamlı model seçimi ve yük devretme genel bakışı için [Modeller](/tr/concepts/models) bölümüne bakın.
