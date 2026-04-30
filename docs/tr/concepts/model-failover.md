---
read_when:
    - Kimlik doğrulama profili rotasyonunu, bekleme sürelerini veya model geri dönüş davranışını tanılama
    - Kimlik doğrulama profilleri veya modeller için yük devretme kurallarını güncelleme
    - Oturum modeli geçersiz kılmalarının geri dönüş yeniden denemeleriyle nasıl etkileşime girdiğini anlama
sidebarTitle: Model failover
summary: OpenClaw kimlik doğrulama profillerini nasıl dönüşümlü kullanır ve modeller arasında yedeklere nasıl geçer
title: Model yük devretme
x-i18n:
    generated_at: "2026-04-30T09:17:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8c343186105256cb2e1a65cdfc3e0042ce8d3d14d21cd007d90174e35b98e7
    source_path: concepts/model-failover.md
    workflow: 16
---

OpenClaw hataları iki aşamada ele alır:

1. Mevcut sağlayıcı içinde **kimlik doğrulama profili rotasyonu**.
2. `agents.defaults.model.fallbacks` içindeki sonraki modele **model fallback**.

Bu belge, çalışma zamanı kurallarını ve bunları destekleyen verileri açıklar.

## Çalışma zamanı akışı

Normal bir metin çalıştırması için OpenClaw adayları şu sırayla değerlendirir:

<Steps>
  <Step title="Oturum durumunu çözümle">
    Etkin oturum modelini ve kimlik doğrulama profili tercihini çözümle.
  </Step>
  <Step title="Aday zincirini oluştur">
    Model aday zincirini, mevcut model seçimi ve bu seçim kaynağına ait fallback ilkesi üzerinden oluştur. Yapılandırılmış varsayılanlar, Cron işi birincil modelleri ve otomatik seçilen fallback modelleri yapılandırılmış fallback değerlerini kullanabilir; açık kullanıcı oturumu seçimleri katıdır.
  </Step>
  <Step title="Mevcut sağlayıcıyı dene">
    Mevcut sağlayıcıyı kimlik doğrulama profili rotasyonu/soğuma kurallarıyla dene.
  </Step>
  <Step title="Yük devretmeye değer hatalarda ilerle">
    Bu sağlayıcı yük devretmeye değer bir hatayla tükenirse sonraki model adayına geç.
  </Step>
  <Step title="Fallback geçersiz kılmasını kalıcılaştır">
    Yeniden deneme başlamadan önce seçilen fallback geçersiz kılmasını kalıcılaştır; böylece diğer oturum okuyucuları, çalıştırıcının kullanmak üzere olduğu aynı sağlayıcıyı/modeli görür. Kalıcılaştırılan model geçersiz kılması `modelOverrideSource: "auto"` olarak işaretlenir.
  </Step>
  <Step title="Başarısızlıkta dar kapsamlı geri al">
    Fallback adayı başarısız olursa, yalnızca fallback'e ait oturum geçersiz kılma alanlarını, hâlâ başarısız olan adayla eşleşiyorlarsa geri al.
  </Step>
  <Step title="Tükendiyse FallbackSummaryError fırlat">
    Her aday başarısız olursa, deneme başına ayrıntı ve biliniyorsa en erken soğuma bitişiyle birlikte bir `FallbackSummaryError` fırlat.
  </Step>
</Steps>

Bu, bilinçli olarak "tüm oturumu kaydet ve geri yükle" yaklaşımından daha dardır. Yanıt çalıştırıcısı yalnızca fallback için sahip olduğu model seçimi alanlarını kalıcılaştırır:

- `providerOverride`
- `modelOverride`
- `modelOverrideSource`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Bu, başarısız bir fallback yeniden denemesinin, deneme çalışırken gerçekleşen manuel `/model` değişiklikleri veya oturum rotasyonu güncellemeleri gibi daha yeni ve ilgisiz oturum mutasyonlarının üzerine yazmasını önler.

## Seçim kaynağı ilkesi

OpenClaw seçilen sağlayıcı/model ile bunun neden seçildiğini ayırır. Bu kaynak, fallback zincirine izin verilip verilmediğini kontrol eder:

- **Yapılandırılmış varsayılan**: `agents.defaults.model.primary`, `agents.defaults.model.fallbacks` değerini kullanır.
- **Ajan birincil modeli**: `agents.list[].model`, ilgili ajan model nesnesi kendi `fallbacks` değerini içermediği sürece katıdır. Katı davranışı açık hâle getirmek için `fallbacks: []` kullanın veya o ajanı model fallback'e dahil etmek için boş olmayan bir liste sağlayın.
- **Otomatik fallback geçersiz kılması**: çalışma zamanı fallback'i yeniden denemeden önce `providerOverride`, `modelOverride` ve `modelOverrideSource: "auto"` yazar. Bu otomatik geçersiz kılma, yapılandırılmış fallback zincirinde ilerlemeye devam edebilir ve `/new`, `/reset` ve `sessions.reset` tarafından temizlenir.
- **Kullanıcı oturumu geçersiz kılması**: `/model`, model seçici, `session_status(model=...)` ve `sessions.patch`, `modelOverrideSource: "user"` yazar. Bu, tam bir oturum seçimidir. Seçilen sağlayıcı/model bir yanıt üretmeden önce başarısız olursa OpenClaw ilgisiz bir yapılandırılmış fallback'ten yanıt vermek yerine hatayı bildirir.
- **Eski oturum geçersiz kılması**: daha eski oturum girdilerinde `modelOverrideSource` olmadan `modelOverride` bulunabilir. OpenClaw bunları kullanıcı geçersiz kılması olarak ele alır; böylece açık bir eski seçim sessizce fallback davranışına dönüştürülmez.
- **Cron yük modeli**: bir Cron işi `payload.model` / `--model`, kullanıcı oturumu geçersiz kılması değil iş birincil modelidir. İş `payload.fallbacks` sağlamadığı sürece yapılandırılmış fallback değerlerini kullanır; `payload.fallbacks: []` Cron çalıştırmasını katı hâle getirir.

## Kimlik doğrulama depolaması (anahtarlar + OAuth)

OpenClaw hem API anahtarları hem de OAuth token'ları için **kimlik doğrulama profilleri** kullanır.

- Gizli bilgiler `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde yaşar (eski: `~/.openclaw/agent/auth-profiles.json`).
- Çalışma zamanı kimlik doğrulama yönlendirme durumu `~/.openclaw/agents/<agentId>/agent/auth-state.json` içinde yaşar.
- Config `auth.profiles` / `auth.order` yalnızca **metadata + yönlendirme** içindir (gizli bilgi içermez).
- Yalnızca eski içe aktarma OAuth dosyası: `~/.openclaw/credentials/oauth.json` (ilk kullanımda `auth-profiles.json` içine aktarılır).

Daha fazla ayrıntı: [OAuth](/tr/concepts/oauth)

Kimlik bilgisi türleri:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (bazı sağlayıcılar için ayrıca `projectId`/`enterpriseUrl`)

## Profil kimlikleri

OAuth oturum açmaları, birden çok hesabın birlikte var olabilmesi için ayrı profiller oluşturur.

- Varsayılan: e-posta yoksa `provider:default`.
- E-postalı OAuth: `provider:<email>` (örneğin `google-antigravity:user@gmail.com`).

Profiller, `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` içinde `profiles` altında yaşar.

## Rotasyon sırası

Bir sağlayıcının birden çok profili olduğunda OpenClaw şu şekilde bir sıra seçer:

<Steps>
  <Step title="Açık config">
    `auth.order[provider]` (ayarlanmışsa).
  </Step>
  <Step title="Yapılandırılmış profiller">
    Sağlayıcıya göre filtrelenmiş `auth.profiles`.
  </Step>
  <Step title="Depolanan profiller">
    Sağlayıcı için `auth-profiles.json` içindeki girdiler.
  </Step>
</Steps>

Açık bir sıra yapılandırılmamışsa OpenClaw round‑robin sırası kullanır:

- **Birincil anahtar:** profil türü (**OAuth, API anahtarlarından önce**).
- **İkincil anahtar:** `usageStats.lastUsed` (her tür içinde en eski önce).
- **Soğumadaki/devre dışı profiller** sona taşınır ve en erken bitişe göre sıralanır.

### Oturum yapışkanlığı (önbellek dostu)

OpenClaw sağlayıcı önbelleklerini sıcak tutmak için **seçilen kimlik doğrulama profilini oturum başına sabitler**. Her istekte rotasyon yapmaz. Sabitlenen profil şu ana kadar yeniden kullanılır:

- oturum sıfırlanana kadar (`/new` / `/reset`)
- bir Compaction tamamlanana kadar (Compaction sayısı artar)
- profil soğumada/devre dışı olana kadar

`/model …@<profileId>` üzerinden manuel seçim, bu oturum için bir **kullanıcı geçersiz kılması** ayarlar ve yeni bir oturum başlayana kadar otomatik döndürülmez.

<Note>
Otomatik sabitlenen profiller (oturum yönlendiricisi tarafından seçilenler) bir **tercih** olarak ele alınır: önce onlar denenir, ancak OpenClaw hız sınırlarında/zaman aşımlarında başka bir profile dönebilir. Kullanıcı tarafından sabitlenen profiller o profile kilitli kalır; başarısız olursa ve model fallback'leri yapılandırılmışsa OpenClaw profil değiştirmek yerine sonraki modele geçer.
</Note>

### OAuth neden "kaybolmuş gibi görünebilir"

Aynı sağlayıcı için hem OAuth profiline hem de API anahtarı profiline sahipseniz, sabitlenmediği sürece round‑robin iletiler arasında bunlar arasında geçiş yapabilir. Tek bir profili zorlamak için:

- `auth.order[provider] = ["provider:profileId"]` ile sabitleyin veya
- `/model …` üzerinden profil geçersiz kılmasıyla oturum başına geçersiz kılma kullanın (UI/sohbet yüzeyiniz destekliyorsa).

## Soğumalar

Bir profil kimlik doğrulama/hız sınırı hataları nedeniyle (veya hız sınırlaması gibi görünen bir zaman aşımı nedeniyle) başarısız olduğunda OpenClaw onu soğumaya alır ve sonraki profile geçer.

<AccordionGroup>
  <Accordion title="Hız sınırı / zaman aşımı kovasına neler girer">
    Bu hız sınırı kovası düz `429` değerinden daha geniştir: `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` gibi sağlayıcı iletilerini ve `weekly/monthly limit reached` gibi dönemsel kullanım penceresi sınırlarını da içerir.

    Biçim/geçersiz istek hataları (örneğin Cloud Code Assist araç çağrısı kimliği doğrulama hataları) yük devretmeye değer olarak ele alınır ve aynı soğumaları kullanır. `Unhandled stop reason: error`, `stop reason: error` ve `reason: error` gibi OpenAI uyumlu durma nedeni hataları zaman aşımı/yük devretme sinyalleri olarak sınıflandırılır.

    Genel sunucu metni, kaynak bilinen geçici bir desenle eşleştiğinde bu zaman aşımı kovasına da düşebilir. Örneğin düz pi-ai akış sarmalayıcı iletisi `An unknown error occurred`, her sağlayıcı için yük devretmeye değer olarak ele alınır; çünkü pi-ai bunu sağlayıcı akışları belirli ayrıntılar olmadan `stopReason: "aborted"` veya `stopReason: "error"` ile bittiğinde yayar. `internal server error`, `unknown error, 520`, `upstream error` veya `backend error` gibi geçici sunucu metni içeren JSON `api_error` yükleri de yük devretmeye değer zaman aşımları olarak ele alınır.

    OpenRouter'a özgü düz `Provider returned error` gibi genel yukarı akış metni yalnızca sağlayıcı bağlamı gerçekten OpenRouter olduğunda zaman aşımı olarak ele alınır. `LLM request failed with an unknown error.` gibi genel dahili fallback metni temkinli kalır ve tek başına yük devretmeyi tetiklemez.

  </Accordion>
  <Accordion title="SDK retry-after üst sınırları">
    Bazı sağlayıcı SDK'leri, kontrolü OpenClaw'a geri vermeden önce aksi hâlde uzun bir `Retry-After` penceresi boyunca bekleyebilir. Anthropic ve OpenAI gibi Stainless tabanlı SDK'ler için OpenClaw varsayılan olarak SDK içi `retry-after-ms` / `retry-after` beklemelerini 60 saniyeyle sınırlar ve daha uzun yeniden denenebilir yanıtları hemen yüzeye çıkarır; böylece bu yük devretme yolu çalışabilir. Üst sınırı `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS` ile ayarlayın veya devre dışı bırakın; bkz. [Yeniden deneme davranışı](/tr/concepts/retry).
  </Accordion>
  <Accordion title="Model kapsamlı soğumalar">
    Hız sınırı soğumaları model kapsamlı da olabilir:

    - OpenClaw, başarısız olan model kimliği bilindiğinde hız sınırı hataları için `cooldownModel` kaydeder.
    - Soğuma farklı bir modele kapsamlanmışsa aynı sağlayıcıdaki kardeş bir model hâlâ denenebilir.
    - Faturalama/devre dışı pencereleri modeller genelinde tüm profili engellemeye devam eder.

  </Accordion>
</AccordionGroup>

Soğumalar üstel geri çekilme kullanır:

- 1 dakika
- 5 dakika
- 25 dakika
- 1 saat (üst sınır)

Durum, `auth-state.json` içinde `usageStats` altında depolanır:

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

Faturalama/kredi hataları (örneğin "insufficient credits" / "credit balance too low") yük devretmeye değer olarak ele alınır, ancak genellikle geçici değildir. Kısa bir soğuma yerine OpenClaw profili **devre dışı** olarak işaretler (daha uzun geri çekilmeyle) ve sonraki profile/sağlayıcıya döner.

<Note>
Faturalama biçimindeki her yanıt `402` değildir ve her HTTP `402` buraya düşmez. OpenClaw, bir sağlayıcı bunun yerine `401` veya `403` döndürse bile açık faturalama metnini faturalama hattında tutar; ancak sağlayıcıya özgü eşleştiriciler onları sahiplenen sağlayıcıyla sınırlı kalır (örneğin OpenRouter `403 Key limit exceeded`).

Bu sırada geçici `402` kullanım penceresi ve kuruluş/çalışma alanı harcama sınırı hataları, ileti yeniden denenebilir göründüğünde `rate_limit` olarak sınıflandırılır (örneğin `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` veya `organization spending limit exceeded`). Bunlar uzun faturalama devre dışı bırakma yolu yerine kısa soğuma/yük devretme yolunda kalır.
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

- Faturalama geri çekilmesi **5 saat** ile başlar, her faturalama hatasında iki katına çıkar ve **24 saat** ile sınırlandırılır.
- Profil **24 saat** boyunca başarısız olmamışsa geri çekilme sayaçları sıfırlanır (yapılandırılabilir).
- Aşırı yüklenmiş yeniden denemeler, model fallback'ten önce **1 aynı sağlayıcı profil rotasyonuna** izin verir.
- Aşırı yüklenmiş yeniden denemeler varsayılan olarak **0 ms geri çekilme** kullanır.

## Model fallback

Bir sağlayıcı için tüm profiller başarısız olursa OpenClaw `agents.defaults.model.fallbacks` içindeki sonraki modele geçer. Bu, profil rotasyonunu tüketen kimlik doğrulama hataları, hız sınırları ve zaman aşımları için geçerlidir (diğer hatalar fallback'i ilerletmez). Yeterli ayrıntı açığa çıkarmayan sağlayıcı hataları fallback durumunda yine de kesin biçimde etiketlenir: `empty_response`, sağlayıcının kullanılabilir bir ileti veya durum döndürmediği anlamına gelir; `no_error_details`, sağlayıcının açıkça `Unknown error (no error details in response)` döndürdüğü anlamına gelir; `unclassified`, OpenClaw'ın ham önizlemeyi koruduğu ancak henüz hiçbir sınıflandırıcının onunla eşleşmediği anlamına gelir.

Aşırı yük ve hız sınırı hataları, faturalandırma bekleme sürelerinden daha agresif ele alınır. Varsayılan olarak OpenClaw, aynı sağlayıcıda bir kimlik doğrulama profili yeniden denemesine izin verir, ardından beklemeden yapılandırılmış bir sonraki model geri dönüşüne geçer. `ModelNotReadyException` gibi sağlayıcı-meşgul sinyalleri bu aşırı yük grubuna girer. Bunu `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` ve `auth.cooldowns.rateLimitedProfileRotations` ile ayarlayın.

Bir çalıştırma yapılandırılmış varsayılan birincilden, bir cron işi birincilinden, açık geri dönüşleri olan bir aracı birincilinden veya otomatik seçilmiş bir geri dönüş geçersiz kılmasından başladığında OpenClaw eşleşen yapılandırılmış geri dönüş zincirini izleyebilir. Açık geri dönüşleri olmayan aracı birincilleri ve açık kullanıcı seçimleri (örneğin `/model ollama/qwen3.5:27b`, model seçici, `sessions.patch` veya tek seferlik CLI sağlayıcı/model geçersiz kılmaları) katıdır: ilgili sağlayıcı/model erişilemezse veya yanıt üretmeden önce başarısız olursa OpenClaw, alakasız bir geri dönüşten yanıt vermek yerine hatayı bildirir.

### Aday zinciri kuralları

OpenClaw, aday listesini o anda istenen `provider/model` ve yapılandırılmış geri dönüşlerden oluşturur.

<AccordionGroup>
  <Accordion title="Kurallar">
    - İstenen model her zaman ilk sıradadır.
    - Açık yapılandırılmış geri dönüşlerin yinelenenleri kaldırılır, ancak model izin listesine göre filtrelenmez. Bunlar açık operatör niyeti olarak ele alınır.
    - Geçerli çalıştırma aynı sağlayıcı ailesindeki yapılandırılmış bir geri dönüş üzerindeyse OpenClaw tam yapılandırılmış zinciri kullanmaya devam eder.
    - Geçerli çalıştırma yapılandırmadan farklı bir sağlayıcı üzerindeyse ve bu geçerli model zaten yapılandırılmış geri dönüş zincirinin parçası değilse OpenClaw başka bir sağlayıcıdan alakasız yapılandırılmış geri dönüşleri eklemez.
    - Geri dönüş çalıştırıcısına açık bir geri dönüş geçersiz kılması sağlanmadığında, zincirin önceki adaylar tükendiğinde normal varsayılana geri dönebilmesi için yapılandırılmış birincil sona eklenir.
    - Bir çağıran `fallbacksOverride` sağladığında, çalıştırıcı tam olarak istenen modeli ve bu geçersiz kılma listesini kullanır. Boş liste model geri dönüşünü devre dışı bırakır ve yapılandırılmış birincilin gizli yeniden deneme hedefi olarak eklenmesini engeller.

  </Accordion>
</AccordionGroup>

### Hangi hatalar geri dönüşü ilerletir

<Tabs>
  <Tab title="Şunlarda devam eder">
    - kimlik doğrulama hataları
    - hız sınırları ve bekleme süresi tükenmeleri
    - aşırı yük/sağlayıcı-meşgul hataları
    - zaman aşımı biçimli devretme hataları
    - faturalandırma devre dışı bırakmaları
    - eski kalıcı modelin dış bir yeniden deneme döngüsü oluşturmaması için devretme yoluna normalleştirilen `LiveSessionModelSwitchError`
    - hâlâ kalan adaylar varken diğer tanınmayan hatalar

  </Tab>
  <Tab title="Şunlarda devam etmez">
    - zaman aşımı/devretme biçimli olmayan açık iptaller
    - compaction/yeniden deneme mantığı içinde kalması gereken bağlam taşması hataları (örneğin `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` veya `ollama error: context length exceeded`)
    - aday kalmadığında son bilinmeyen hata

  </Tab>
</Tabs>

### Bekleme süresi atlama ve yoklama davranışı

Bir sağlayıcının her kimlik doğrulama profili zaten bekleme süresindeyse OpenClaw bu sağlayıcıyı otomatik olarak sonsuza dek atlamaz. Aday bazında karar verir:

<AccordionGroup>
  <Accordion title="Aday bazında kararlar">
    - Kalıcı kimlik doğrulama hataları tüm sağlayıcıyı hemen atlar.
    - Faturalandırma devre dışı bırakmaları genellikle atlanır, ancak yeniden başlatma gerekmeden toparlanmanın mümkün olması için birincil aday yine de kısıtlı biçimde yoklanabilir.
    - Birincil aday, sağlayıcı bazında bir kısıtlama ile bekleme süresinin bitimine yakın yoklanabilir.
    - Hata geçici görünüyorsa (`rate_limit`, `overloaded` veya bilinmeyen), aynı sağlayıcıdaki geri dönüş kardeşleri bekleme süresine rağmen denenebilir. Bu özellikle hız sınırı model kapsamlı olduğunda ve bir kardeş model hemen toparlanabildiğinde önemlidir.
    - Geçici bekleme süresi yoklamaları, tek bir sağlayıcının sağlayıcılar arası geri dönüşü duraksatmaması için geri dönüş çalıştırması başına sağlayıcı başına bir ile sınırlıdır.

  </Accordion>
</AccordionGroup>

## Oturum geçersiz kılmaları ve canlı model değiştirme

Oturum model değişiklikleri paylaşılan durumdur. Etkin çalıştırıcı, `/model` komutu, compaction/oturum güncellemeleri ve canlı oturum uzlaştırması aynı oturum girdisinin parçalarını okur veya yazar.

Bu, geri dönüş yeniden denemelerinin canlı model değiştirme ile koordine edilmesi gerektiği anlamına gelir:

- Yalnızca açık kullanıcı odaklı model değişiklikleri bekleyen bir canlı değişimi işaretler. Buna `/model`, `session_status(model=...)` ve `sessions.patch` dahildir.
- Geri dönüş rotasyonu, heartbeat geçersiz kılmaları veya compaction gibi sistem odaklı model değişiklikleri kendi başlarına bekleyen bir canlı değişimi asla işaretlemez.
- Kullanıcı odaklı model geçersiz kılmaları, geri dönüş politikası için kesin seçimler olarak ele alınır; bu nedenle erişilemeyen seçilmiş bir sağlayıcı, `agents.defaults.model.fallbacks` tarafından maskelenmek yerine hata olarak görünür.
- Bir geri dönüş yeniden denemesi başlamadan önce yanıt çalıştırıcısı, seçili geri dönüş geçersiz kılma alanlarını oturum girdisine kalıcı olarak yazar.
- Otomatik geri dönüş geçersiz kılmaları sonraki turlarda seçili kalır; böylece OpenClaw bilinen kötü bir birincili her mesajda yoklamaz. `/new`, `/reset` ve `sessions.reset` otomatik kaynaklı geçersiz kılmaları temizler ve oturumu yapılandırılmış varsayılana döndürür.
- `/status` seçili modeli ve geri dönüş durumu farklı olduğunda etkin geri dönüş modelini ve nedenini gösterir.
- Canlı oturum uzlaştırması, eski çalışma zamanı model alanları yerine kalıcı oturum geçersiz kılmalarını tercih eder.
- Bir canlı değişim hatası etkin geri dönüş zincirindeki sonraki bir adayı gösteriyorsa OpenClaw önce alakasız adayları dolaşmak yerine doğrudan seçilen modele atlar.
- Geri dönüş denemesi başarısız olursa çalıştırıcı yalnızca yazdığı geçersiz kılma alanlarını geri alır ve bunu yalnızca hâlâ başarısız adayla eşleşiyorlarsa yapar.

Bu, klasik yarışı önler:

<Steps>
  <Step title="Birincil başarısız olur">
    Seçili birincil model başarısız olur.
  </Step>
  <Step title="Geri dönüş bellekte seçilir">
    Geri dönüş adayı bellekte seçilir.
  </Step>
  <Step title="Oturum deposu hâlâ eski birincili gösterir">
    Oturum deposu hâlâ eski birincili yansıtır.
  </Step>
  <Step title="Canlı uzlaştırma eski durumu okur">
    Canlı oturum uzlaştırması eski oturum durumunu okur.
  </Step>
  <Step title="Yeniden deneme geri alınır">
    Geri dönüş denemesi başlamadan önce yeniden deneme eski modele geri alınır.
  </Step>
</Steps>

Kalıcı geri dönüş geçersiz kılması bu aralığı kapatır ve dar kapsamlı geri alma, daha yeni manuel veya çalışma zamanı oturum değişikliklerini sağlam bırakır.

## Gözlemlenebilirlik ve hata özetleri

`runWithModelFallback(...)`, günlükleri ve kullanıcıya gösterilen bekleme süresi mesajlarını besleyen deneme bazında ayrıntıları kaydeder:

- denenen sağlayıcı/model
- neden (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` ve benzeri devretme nedenleri)
- isteğe bağlı durum/kod
- insan tarafından okunabilir hata özeti

Yapılandırılmış `model_fallback_decision` günlükleri, bir aday başarısız olduğunda, atlandığında veya sonraki bir geri dönüş başarılı olduğunda düz `fallbackStep*` alanlarını da içerir. Bu alanlar denenen geçişi açık hale getirir (`fallbackStepFromModel`, `fallbackStepToModel`, `fallbackStepFromFailureReason`, `fallbackStepFromFailureDetail`, `fallbackStepFinalOutcome`); böylece günlük ve tanılama dışa aktarıcıları, son geri dönüş de başarısız olsa bile birincil hatayı yeniden oluşturabilir.

Her aday başarısız olduğunda OpenClaw `FallbackSummaryError` fırlatır. Dış yanıt çalıştırıcısı bunu kullanarak "tüm modeller geçici olarak hız sınırında" gibi daha belirli bir mesaj oluşturabilir ve biliniyorsa en yakın bekleme süresi bitişini ekleyebilir.

Bu bekleme süresi özeti model farkındadır:

- alakasız model kapsamlı hız sınırları denenen sağlayıcı/model zinciri için yok sayılır
- kalan blok eşleşen model kapsamlı bir hız sınırıysa OpenClaw, bu modeli hâlâ engelleyen son eşleşen bitiş zamanını bildirir

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
