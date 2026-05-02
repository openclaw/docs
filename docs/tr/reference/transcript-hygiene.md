---
read_when:
    - Transkript biçimine bağlı sağlayıcı isteği reddetmelerinde hata ayıklıyorsunuz
    - Transkript temizleme veya araç çağrısı onarım mantığını değiştiriyorsunuz
    - Sağlayıcılar genelinde araç çağrısı kimliği uyuşmazlıklarını araştırıyorsunuz
summary: 'Referans: sağlayıcıya özgü transkript temizleme ve onarım kuralları'
title: Transkript hijyeni
x-i18n:
    generated_at: "2026-05-02T09:06:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6976d4349e47954f49c9dbf300822013851b604ed665f4ab647c62025760a96c
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw, çalıştırmadan önce (model bağlamı oluşturulurken) dökümlere **sağlayıcıya özel düzeltmeler** uygular. Bunların çoğu, katı sağlayıcı gereksinimlerini karşılamak için kullanılan **bellek içi** ayarlamalardır. Ayrı bir oturum dosyası onarım geçişi de oturum yüklenmeden önce saklanan JSONL'yi yeniden yazabilir; bunu hatalı biçimlendirilmiş JSONL satırlarını atarak veya sözdizimsel olarak geçerli olup yeniden oynatma sırasında bir
sağlayıcı tarafından reddedildiği bilinen kalıcılaştırılmış dönüşleri onararak yapar. Bir onarım gerçekleştiğinde, özgün dosya oturum dosyasının yanında yedeklenir.

Kapsam şunları içerir:

- Çalışma zamanına özel istem bağlamının kullanıcıya görünen döküm dönüşlerinin dışında kalması
- Araç çağrısı kimliği temizleme
- Araç çağrısı girdisi doğrulama
- Araç sonucu eşleştirme onarımı
- Dönüş doğrulama / sıralama
- Düşünce imzası temizliği
- Thinking imzası temizliği
- Görsel yükü temizleme
- Sağlayıcı yeniden oynatmasından önce boş metin bloğu temizliği
- Kullanıcı girdisi kaynak etiketleme (oturumlar arası yönlendirilen istemler için)
- Bedrock Converse yeniden oynatması için boş asistan hata dönüşü onarımı

Döküm depolama ayrıntılarına ihtiyacınız varsa bkz.:

- [Oturum yönetimi ayrıntılı incelemesi](/tr/reference/session-management-compaction)

---

## Genel kural: çalışma zamanı bağlamı kullanıcı dökümü değildir

Çalışma zamanı/sistem bağlamı bir dönüş için model istemine eklenebilir, ancak bu
son kullanıcı tarafından yazılmış içerik değildir. OpenClaw; Gateway yanıtları, kuyruğa alınmış takipler, ACP, CLI ve gömülü Pi
çalıştırmaları için ayrı bir döküme yönelik istem gövdesi tutar. Saklanan görünür kullanıcı dönüşleri, çalışma zamanı ile zenginleştirilmiş istem yerine bu döküm gövdesini kullanır.

Çalışma zamanı sarmalayıcılarını zaten kalıcılaştırmış eski oturumlar için Gateway geçmişi
yüzeyleri, iletileri WebChat, TUI, REST veya SSE istemcilerine döndürmeden önce bir görüntüleme projeksiyonu uygular.

---

## Bunun çalıştığı yer

Tüm döküm hijyeni gömülü çalıştırıcıda merkezileştirilmiştir:

- Politika seçimi: `src/agents/transcript-policy.ts`
- Temizleme/onarım uygulaması: `src/agents/pi-embedded-runner/replay-history.ts` içinde `sanitizeSessionHistory`

Politika, ne uygulanacağına karar vermek için `provider`, `modelApi` ve `modelId` kullanır.

Döküm hijyeninden ayrı olarak, oturum dosyaları yüklenmeden önce (gerekirse) onarılır:

- `src/agents/session-file-repair.ts` içinde `repairSessionFileIfNeeded`
- `run/attempt.ts` ve `compact.ts` içinden çağrılır (gömülü çalıştırıcı)

---

## Genel kural: görsel temizleme

Görsel yükleri, boyut sınırları nedeniyle sağlayıcı tarafında reddi önlemek için her zaman temizlenir
(aşırı büyük base64 görselleri küçültme/yeniden sıkıştırma).

Bu, görsel yetenekli modellerde görsel kaynaklı token baskısını denetlemeye de yardımcı olur.
Daha düşük azami boyutlar genelde token kullanımını azaltır; daha yüksek boyutlar ayrıntıyı korur.

Uygulama:

- `src/agents/pi-embedded-helpers/images.ts` içinde `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` içinde `sanitizeContentBlocksImages`
- Azami görsel kenarı `agents.defaults.imageMaxDimensionPx` ile yapılandırılabilir (varsayılan: `1200`).
- Bu geçiş yeniden oynatma içeriğini gezerken boş metin blokları kaldırılır. Boş hale gelen asistan
  dönüşleri yeniden oynatma kopyasından düşürülür; boş hale gelen kullanıcı ve araç sonucu
  dönüşleri boş olmayan bir atlanmış içerik yer tutucusu alır.

---

## Genel kural: hatalı biçimlendirilmiş araç çağrıları

Hem `input` hem de `arguments` eksik olan asistan araç çağrısı blokları,
model bağlamı oluşturulmadan önce düşürülür. Bu, kısmen kalıcılaştırılmış
araç çağrılarından kaynaklanan sağlayıcı retlerini önler (örneğin, bir hız sınırı hatasından sonra).

Uygulama:

- `src/agents/session-transcript-repair.ts` içinde `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts` içinde `sanitizeSessionHistory` içinde uygulanır

---

## Genel kural: oturumlar arası girdi kaynağı

Bir ajan `sessions_send` aracılığıyla başka bir oturuma istem gönderdiğinde (ajanlar arası
yanıt/duyuru adımları dahil), OpenClaw oluşturulan kullanıcı dönüşünü şu şekilde kalıcılaştırır:

- `message.provenance.kind = "inter_session"`

OpenClaw ayrıca, etkin model çağrısının yabancı oturum çıktısını harici son kullanıcı talimatlarından ayırt edebilmesi için yönlendirilen istem metninden önce aynı dönüşe ait bir `[Inter-session message ... isUser=false]`
işaretçisi ekler. Bu işaretçi, varsa kaynak oturumu, kanalı ve aracı içerir. Döküm, sağlayıcı uyumluluğu için hâlâ
`role: "user"` kullanır, ancak görünür metin ve kaynak meta verileri dönüşü oturumlar arası veri olarak işaretler.

Bağlam yeniden oluşturulurken OpenClaw, yalnızca kaynak meta verileri olan daha eski kalıcılaştırılmış
oturumlar arası kullanıcı dönüşlerine aynı işaretçiyi uygular.

---

## Sağlayıcı matrisi (geçerli davranış)

**OpenAI / OpenAI Codex**

- Yalnızca görsel temizleme.
- OpenAI Responses/Codex dökümleri için sahipsiz reasoning imzalarını (arkasından içerik bloğu gelmeyen bağımsız reasoning öğeleri) düşürür ve bir model rotası değişiminden sonra yeniden oynatılabilir OpenAI reasoning öğelerini düşürür.
- El ile/WebSocket yeniden oynatmanın gerekli `rs_*` durumunu asistan çıktı öğeleriyle eşli tutması için, şifrelenmiş boş özet öğeleri dahil olmak üzere yeniden oynatılabilir OpenAI Responses reasoning öğesi yüklerini korur.
- Araç çağrısı kimliği temizleme yok.
- Araç sonucu eşleştirme onarımı, gerçek eşleşmiş çıktıları taşıyabilir ve eksik araç çağrıları için Codex tarzı `aborted` çıktıları sentezleyebilir.
- Dönüş doğrulama veya yeniden sıralama yok.
- Eksik OpenAI Responses ailesi araç çıktıları, Codex yeniden oynatma normalleştirmesiyle eşleşmesi için `aborted` olarak sentezlenir.
- Düşünce imzası kaldırma yok.

**OpenAI uyumlu Gemma 4**

- Yerel OpenAI uyumlu Gemma 4 sunucularının önceki dönüşlere ait reasoning içeriği almaması için geçmiş asistan thinking/reasoning blokları yeniden oynatmadan önce kaldırılır.
- Geçerli aynı dönüş araç çağrısı devamları, araç sonucu yeniden oynatılana kadar asistan reasoning bloğunu
  araç çağrısına bağlı tutar.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Araç çağrısı kimliği temizleme: katı alfanümerik.
- Araç sonucu eşleştirme onarımı ve sentetik araç sonuçları.
- Dönüş doğrulama (Gemini tarzı dönüş almaşıklığı).
- Google dönüş sıralaması düzeltmesi (geçmiş asistan ile başlıyorsa küçük bir kullanıcı başlatması ekler).
- Antigravity Claude: thinking imzalarını normalleştirir; imzasız thinking bloklarını düşürür.

**Anthropic / Minimax (Anthropic uyumlu)**

- Araç sonucu eşleştirme onarımı ve sentetik araç sonuçları.
- Dönüş doğrulama (katı almaşıklığı karşılamak için ardışık kullanıcı dönüşlerini birleştirir).
- Thinking etkin olduğunda, Cloudflare AI Gateway rotaları dahil olmak üzere, sonda bulunan asistan prefill dönüşleri giden Anthropic Messages
  yüklerinden kaldırılır.
- Eksik, boş veya yalnızca boşluk içeren yeniden oynatma imzalarına sahip Thinking blokları,
  sağlayıcı dönüşümünden önce kaldırılır. Bu bir asistan dönüşünü boşaltırsa OpenClaw,
  dönüş şeklini boş olmayan atlanmış reasoning metniyle korur.
- Kaldırılması gereken eski yalnızca thinking içeren asistan dönüşleri, sağlayıcı adaptörlerinin yeniden oynatma
  dönüşünü düşürmemesi için boş olmayan atlanmış reasoning metniyle değiştirilir.

**Amazon Bedrock (Converse API)**

- Boş asistan akış hatası dönüşleri, yeniden oynatmadan önce boş olmayan bir yedek metin bloğuna onarılır. Bedrock Converse, `content: []` içeren asistan iletilerini reddeder; bu nedenle
  `stopReason: "error"` ve boş içeriğe sahip kalıcılaştırılmış asistan dönüşleri de yüklemeden önce diskte
  onarılır.
- Yalnızca boş metin blokları içeren asistan akış hatası dönüşleri, geçersiz boş bir bloğu yeniden oynatmak yerine
  bellek içi yeniden oynatma kopyasından düşürülür.
- Eksik, boş veya yalnızca boşluk içeren yeniden oynatma imzalarına sahip Claude thinking blokları
  Converse yeniden oynatmasından önce kaldırılır. Bu bir asistan dönüşünü boşaltırsa OpenClaw,
  dönüş şeklini boş olmayan atlanmış reasoning metniyle korur.
- Kaldırılması gereken eski yalnızca thinking içeren asistan dönüşleri, Converse yeniden oynatmasının katı dönüş şeklini koruması için boş olmayan atlanmış reasoning metniyle değiştirilir.
- Yeniden oynatma, OpenClaw teslimat yansıtması ve gateway tarafından eklenen asistan dönüşlerini filtreler.
- Görsel temizleme genel kural üzerinden uygulanır.

**Mistral (model kimliğine dayalı algılama dahil)**

- Araç çağrısı kimliği temizleme: strict9 (alfanümerik uzunluk 9).

**OpenRouter Gemini**

- Düşünce imzası temizliği: base64 olmayan `thought_signature` değerlerini kaldırır (base64 değerleri tutar).

**OpenRouter Anthropic**

- Reasoning etkin olduğunda, doğrulanmış OpenRouter
  OpenAI uyumlu Anthropic model yüklerinden sonda bulunan asistan prefill dönüşleri kaldırılır; bu, doğrudan Anthropic ve Cloudflare Anthropic yeniden oynatma davranışıyla eşleşir.

**Diğer her şey**

- Yalnızca görsel temizleme.

---

## Geçmiş davranış (2026.1.22 öncesi)

2026.1.22 sürümünden önce OpenClaw birden çok döküm hijyeni katmanı uyguluyordu:

- Her bağlam oluşturmasında bir **transcript-sanitize uzantısı** çalışırdı ve şunları yapabilirdi:
  - Araç kullanımı/sonucu eşleştirmesini onarırdı.
  - Araç çağrısı kimliklerini temizlerdi (`_`/`-` değerlerini koruyan katı olmayan mod dahil).
- Çalıştırıcı ayrıca sağlayıcıya özel temizleme gerçekleştirirdi; bu da işi yinelerdi.
- Sağlayıcı politikası dışında ek mutasyonlar gerçekleşirdi, bunlar dahil:
  - Kalıcılaştırmadan önce asistan metninden `<final>` etiketlerini kaldırma.
  - Boş asistan hata dönüşlerini düşürme.
  - Araç çağrılarından sonra asistan içeriğini kırpma.

Bu karmaşıklık sağlayıcılar arası regresyonlara neden oldu (özellikle `openai-responses`
`call_id|fc_id` eşleştirmesi). 2026.1.22 temizliği uzantıyı kaldırdı, mantığı çalıştırıcıda merkezileştirdi ve OpenAI'yi görsel temizleme dışında **dokunulmaz** hale getirdi.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
