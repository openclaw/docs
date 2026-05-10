---
read_when:
    - Konuşma dökümü yapısına bağlı sağlayıcı istek reddetmelerinde hata ayıklıyorsunuz
    - Transkript temizleme veya araç çağrısı onarım mantığını değiştiriyorsunuz
    - Sağlayıcılar arasında araç çağrısı kimliği uyuşmazlıklarını araştırıyorsunuz
summary: 'Referans: sağlayıcıya özgü döküm temizleme ve onarım kuralları'
title: Transkript temizliği
x-i18n:
    generated_at: "2026-05-10T19:55:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 197081fe829cf6463e84c5ead9b4c631a8088e771e68163a35ed39d9efbdbf6a
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw, bir çalıştırmadan önce (model bağlamı oluşturulurken) dökümlere **sağlayıcıya özgü düzeltmeler** uygular. Bunların çoğu, katı sağlayıcı gereksinimlerini karşılamak için kullanılan **bellek içi** ayarlamalardır. Ayrı bir oturum dosyası onarım geçişi de oturum yüklenmeden önce saklanan JSONL'yi yeniden yazabilir, ancak yalnızca bozuk satırlar veya geçersiz kalıcı kayıtlar olan kalıcılaştırılmış dönüşler için. Teslim edilmiş asistan yanıtları diskte korunur; sağlayıcıya özgü asistan ön doldurma kaldırma yalnızca giden yükler oluşturulurken gerçekleşir. Bir onarım yapıldığında, özgün dosya oturum dosyasının yanında yedeklenir.

Kapsam şunları içerir:

- Çalışma zamanına özgü prompt bağlamının kullanıcıya görünür döküm dönüşlerinin dışında kalması
- Araç çağrısı kimliği temizleme
- Araç çağrısı girdisi doğrulama
- Araç sonucu eşleştirme onarımı
- Dönüş doğrulama / sıralama
- Düşünce imzası temizleme
- Thinking imzası temizleme
- Görsel yükü temizleme
- Sağlayıcı yeniden oynatması öncesi boş metin bloğu temizleme
- Kullanıcı girdisi köken etiketleme (oturumlar arası yönlendirilen promptlar için)
- Bedrock Converse yeniden oynatması için boş asistan hata dönüşü onarımı

Döküm depolama ayrıntılarına ihtiyacınız varsa bkz.:

- [Oturum yönetimi derinlemesine incelemesi](/tr/reference/session-management-compaction)

---

## Genel kural: çalışma zamanı bağlamı kullanıcı dökümü değildir

Çalışma zamanı/sistem bağlamı bir dönüş için model promptuna eklenebilir, ancak bu
son kullanıcı tarafından yazılmış içerik değildir. OpenClaw, Gateway yanıtları,
kuyruğa alınmış takipler, ACP, CLI ve gömülü Pi çalıştırmaları için ayrı bir
döküme dönük prompt gövdesi tutar. Saklanan görünür kullanıcı dönüşleri, çalışma
zamanı ile zenginleştirilmiş prompt yerine bu döküm gövdesini kullanır.

Çalışma zamanı sarmalayıcılarını zaten kalıcılaştırmış eski oturumlar için Gateway
geçmiş yüzeyleri, WebChat, TUI, REST veya SSE istemcilerine mesajları döndürmeden
önce bir görüntüleme projeksiyonu uygular.

---

## Bunun çalıştığı yer

Tüm döküm hijyeni gömülü çalıştırıcıda merkezileştirilmiştir:

- Politika seçimi: `src/agents/transcript-policy.ts`
- Temizleme/onarım uygulaması: `src/agents/pi-embedded-runner/replay-history.ts` içindeki `sanitizeSessionHistory`

Politika, neyin uygulanacağına karar vermek için `provider`, `modelApi` ve `modelId` kullanır.

Döküm hijyeninden ayrı olarak, oturum dosyaları yüklemeden önce (gerekirse) onarılır:

- `src/agents/session-file-repair.ts` içindeki `repairSessionFileIfNeeded`
- `run/attempt.ts` ve `compact.ts` içinden çağrılır (gömülü çalıştırıcı)

---

## Genel kural: görsel temizleme

Görsel yükleri, boyut sınırları nedeniyle sağlayıcı tarafında reddedilmeyi
önlemek için her zaman temizlenir (aşırı büyük base64 görselleri küçültme/yeniden sıkıştırma).

Bu ayrıca görme yeteneğine sahip modeller için görsel kaynaklı token baskısını
kontrol etmeye yardımcı olur. Daha düşük azami boyutlar genellikle token kullanımını
azaltır; daha yüksek boyutlar ayrıntıyı korur.

Uygulama:

- `src/agents/pi-embedded-helpers/images.ts` içindeki `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` içindeki `sanitizeContentBlocksImages`
- Azami görsel kenarı `agents.defaults.imageMaxDimensionPx` ile yapılandırılabilir (varsayılan: `1200`).
- Bu geçiş yeniden oynatma içeriğini gezerken boş metin blokları kaldırılır. Boş hale
  gelen asistan dönüşleri yeniden oynatma kopyasından düşürülür; boş hale gelen kullanıcı
  ve araç sonucu dönüşleri boş olmayan bir atlanmış içerik yer tutucusu alır.

---

## Genel kural: bozuk araç çağrıları

Hem `input` hem de `arguments` eksik olan asistan araç çağrısı blokları, model bağlamı
oluşturulmadan önce düşürülür. Bu, kısmen kalıcılaştırılmış araç çağrılarından
(sağlayıcı hız sınırı hatasından sonra olduğu gibi) kaynaklanan sağlayıcı reddetmelerini
önler.

Uygulama:

- `src/agents/session-transcript-repair.ts` içindeki `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts` içindeki `sanitizeSessionHistory` içinde uygulanır

---

## Genel kural: oturumlar arası girdi kökeni

Bir aracı, `sessions_send` aracılığıyla (aracıdan aracıya yanıt/duyuru adımları dahil)
başka bir oturuma prompt gönderdiğinde, OpenClaw oluşturulan kullanıcı dönüşünü şununla kalıcılaştırır:

- `message.provenance.kind = "inter_session"`

OpenClaw ayrıca yönlendirilen prompt metninin başına aynı dönüşte bir
`[Inter-session message ... isUser=false]` işareti ekler; böylece etkin model çağrısı,
yabancı oturum çıktısını harici son kullanıcı talimatlarından ayırt edebilir. Bu işaret,
varsa kaynak oturumu, kanalı ve aracı içerir. Döküm, sağlayıcı uyumluluğu için hâlâ
`role: "user"` kullanır, ancak görünür metin ve köken metadatası dönüşü
oturumlar arası veri olarak işaretler.

Bağlam yeniden oluşturulurken OpenClaw, yalnızca köken metadatası bulunan eski
kalıcılaştırılmış oturumlar arası kullanıcı dönüşlerine aynı işareti uygular.

---

## Sağlayıcı matrisi (mevcut davranış)

**OpenAI / OpenAI Codex**

- Yalnızca görsel temizleme.
- OpenAI Responses/Codex dökümleri için yalnız kalmış reasoning imzalarını (ardından içerik bloğu gelmeyen bağımsız reasoning öğeleri) düşürür ve model rota değişiminden sonra yeniden oynatılabilir OpenAI reasoning'i düşürür.
- Şifrelenmiş boş özet öğeleri dahil yeniden oynatılabilir OpenAI Responses reasoning öğesi yüklerini korur; böylece manuel/WebSocket yeniden oynatma, gerekli `rs_*` durumunu asistan çıktı öğeleriyle eşli tutar.
- Yerel ChatGPT Codex Responses, önceki Responses reasoning/message/function yüklerini önceki öğe kimlikleri olmadan yeniden oynatıp oturum `prompt_cache_key` değerini koruyarak Codex kablo uyumluluğunu izler.
- Araç çağrısı kimliği temizleme yok.
- Araç sonucu eşleştirme onarımı gerçek eşleşmiş çıktıları taşıyabilir ve eksik araç çağrıları için Codex tarzı `aborted` çıktıları sentezleyebilir.
- Dönüş doğrulama veya yeniden sıralama yok.
- Eksik OpenAI Responses ailesi araç çıktıları, Codex yeniden oynatma normalleştirmesiyle eşleşmesi için `aborted` olarak sentezlenir.
- Düşünce imzası kaldırma yok.

**OpenAI uyumlu Chat Completions**

- Geçmiş asistan thinking/reasoning blokları yeniden oynatmadan önce kaldırılır; böylece
  yerel ve proxy tarzı OpenAI uyumlu sunucular, `reasoning` veya `reasoning_content`
  gibi önceki dönüş reasoning alanlarını almaz.
- Mevcut aynı dönüş araç çağrısı devamları, araç sonucu yeniden oynatılana kadar
  asistan reasoning bloğunu araç çağrısına bağlı tutar.
- Sağlayıcıya ait istisnalar, kablo protokolleri yeniden oynatılmış reasoning metadatası
  gerektirdiğinde devre dışı kalmayı seçebilir.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Araç çağrısı kimliği temizleme: katı alfanümerik.
- Araç sonucu eşleştirme onarımı ve sentetik araç sonuçları.
- Dönüş doğrulama (Gemini tarzı dönüş almaşığı).
- Google dönüş sıralama düzeltmesi (geçmiş asistanla başlıyorsa küçük bir kullanıcı önyüklemesi başa eklenir).
- Antigravity Claude: thinking imzalarını normalleştirir; imzasız thinking bloklarını düşürür.

**Anthropic / Minimax (Anthropic uyumlu)**

- Araç sonucu eşleştirme onarımı ve sentetik araç sonuçları.
- Dönüş doğrulama (katı almaşığı karşılamak için ardışık kullanıcı dönüşlerini birleştirir).
- Thinking etkin olduğunda, Cloudflare AI Gateway rotaları dahil giden Anthropic Messages
  yüklerinden sondaki asistan ön doldurma dönüşleri kaldırılır.
- Eksik, boş veya yalnızca boşluk içeren yeniden oynatma imzalarına sahip Thinking blokları,
  sağlayıcı dönüşümünden önce kaldırılır. Bu bir asistan dönüşünü boşaltırsa OpenClaw,
  dönüş şeklini boş olmayan atlanmış reasoning metniyle korur.
- Kaldırılması gereken eski yalnızca thinking içeren asistan dönüşleri, sağlayıcı
  adaptörlerinin yeniden oynatma dönüşünü düşürmemesi için boş olmayan atlanmış reasoning metniyle değiştirilir.

**Amazon Bedrock (Converse API)**

- Boş asistan akış hatası dönüşleri yeniden oynatma öncesinde boş olmayan bir yedek metin bloğuna
  onarılır. Bedrock Converse `content: []` içeren asistan mesajlarını reddeder; bu nedenle
  `stopReason: "error"` ve boş içerik içeren kalıcılaştırılmış asistan dönüşleri de
  yüklemeden önce diskte onarılır.
- Yalnızca boş metin blokları içeren asistan akış hatası dönüşleri, geçersiz boş bir bloğu
  yeniden oynatmak yerine bellek içi yeniden oynatma kopyasından düşürülür.
- Eksik, boş veya yalnızca boşluk içeren yeniden oynatma imzalarına sahip Claude thinking blokları,
  Converse yeniden oynatmasından önce kaldırılır. Bu bir asistan dönüşünü boşaltırsa OpenClaw,
  dönüş şeklini boş olmayan atlanmış reasoning metniyle korur.
- Kaldırılması gereken eski yalnızca thinking içeren asistan dönüşleri, Converse yeniden oynatmasının
  katı dönüş şeklini koruması için boş olmayan atlanmış reasoning metniyle değiştirilir.
- Yeniden oynatma, OpenClaw teslimat aynası ve gateway tarafından enjekte edilmiş asistan dönüşlerini filtreler.
- Görsel temizleme genel kural üzerinden uygulanır.

**Mistral (model kimliğine dayalı algılama dahil)**

- Araç çağrısı kimliği temizleme: strict9 (alfanümerik uzunluk 9).

**OpenRouter Gemini**

- Düşünce imzası temizleme: base64 olmayan `thought_signature` değerlerini kaldırır (base64 olanları tutar).

**OpenRouter Anthropic**

- Reasoning etkin olduğunda doğrulanmış OpenRouter OpenAI uyumlu Anthropic model yüklerinden
  sondaki asistan ön doldurma dönüşleri kaldırılır; bu, doğrudan Anthropic ve Cloudflare
  Anthropic yeniden oynatma davranışıyla eşleşir.

**Diğer her şey**

- Yalnızca görsel temizleme.

---

## Geçmiş davranış (2026.1.22 öncesi)

2026.1.22 sürümünden önce OpenClaw, döküm hijyeninin birden çok katmanını uyguluyordu:

- Her bağlam oluşturmasında bir **döküm temizleme Plugin'i** çalışırdı ve şunları yapabilirdi:
  - Araç kullanımı/sonucu eşleştirmesini onarırdı.
  - Araç çağrısı kimliklerini temizlerdi (`_`/`-` karakterlerini koruyan katı olmayan mod dahil).
- Çalıştırıcı ayrıca sağlayıcıya özgü temizleme yapıyordu; bu da işi yineliyordu.
- Sağlayıcı politikasının dışında ek mutasyonlar gerçekleşiyordu, örneğin:
  - Kalıcılaştırma öncesinde asistan metninden `<final>` etiketlerini kaldırma.
  - Boş asistan hata dönüşlerini düşürme.
  - Araç çağrılarından sonra asistan içeriğini kırpma.

Bu karmaşıklık, sağlayıcılar arası regresyonlara neden oldu (özellikle `openai-responses`
`call_id|fc_id` eşleştirmesi). 2026.1.22 temizliği eklentiyi kaldırdı, mantığı
çalıştırıcıda merkezileştirdi ve OpenAI'yi görsel temizleme dışında **dokunulmaz**
hale getirdi.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
