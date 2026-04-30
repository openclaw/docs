---
read_when:
    - Transkript biçimiyle ilişkili sağlayıcı istek retlerinde hata ayıklıyorsunuz
    - Transkript arındırma veya araç çağrısı onarma mantığını değiştiriyorsunuz
    - Sağlayıcılar genelindeki araç çağrısı kimliği uyuşmazlıklarını araştırıyorsunuz
summary: 'Referans: sağlayıcıya özel konuşma dökümü temizleme ve onarım kuralları'
title: Transkript hijyeni
x-i18n:
    generated_at: "2026-04-30T09:45:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95f065d87ce58019ff2e6cdd6801879404d3b4fa402d26fc6fed9d51966b0a1
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw, bir çalıştırmadan önce (model bağlamı oluşturulurken) transkriptlere **sağlayıcıya özgü düzeltmeler** uygular. Bunların çoğu, katı sağlayıcı gereksinimlerini karşılamak için kullanılan **bellek içi** ayarlamalardır. Ayrı bir oturum dosyası onarım geçişi de oturum yüklenmeden önce depolanan JSONL’yi yeniden yazabilir; bunu hatalı biçimlendirilmiş JSONL satırlarını bırakarak ya da sözdizimsel olarak geçerli olsa da yeniden oynatma sırasında bir
sağlayıcı tarafından reddedildiği bilinen kalıcılaştırılmış dönüşleri onararak yapar. Bir onarım gerçekleştiğinde, özgün dosya oturum dosyasının yanında yedeklenir.

Kapsam şunları içerir:

- Yalnızca çalışma zamanına ait istem bağlamının kullanıcıya görünür transkript dönüşlerinin dışında kalması
- Araç çağrısı kimliği temizleme
- Araç çağrısı girdisi doğrulama
- Araç sonucu eşleştirme onarımı
- Dönüş doğrulama / sıralama
- Düşünce imzası temizleme
- Thinking imzası temizleme
- Görüntü yükü temizleme
- Sağlayıcı yeniden oynatmasından önce boş metin bloğu temizliği
- Kullanıcı girdisi kaynak etiketi ekleme (oturumlar arası yönlendirilen istemler için)
- Bedrock Converse yeniden oynatması için boş asistan hata dönüşü onarımı

Transkript depolama ayrıntılarına ihtiyacınız varsa, bkz.:

- [Oturum yönetimi derin incelemesi](/tr/reference/session-management-compaction)

---

## Küresel kural: çalışma zamanı bağlamı kullanıcı transkripti değildir

Çalışma zamanı/sistem bağlamı bir dönüş için model istemine eklenebilir, ancak bu
son kullanıcı tarafından yazılmış içerik değildir. OpenClaw; Gateway yanıtları,
kuyruğa alınmış takipler, ACP, CLI ve gömülü Pi çalıştırmaları için transkripte yönelik
ayrı bir istem gövdesi tutar. Depolanan görünür kullanıcı dönüşleri, çalışma zamanı ile
zenginleştirilmiş istem yerine bu transkript gövdesini kullanır.

Çalışma zamanı sarmalayıcılarını zaten kalıcılaştırmış eski oturumlarda, Gateway geçmişi
yüzeyleri WebChat, TUI, REST veya SSE istemcilerine mesajları döndürmeden önce bir görüntüleme projeksiyonu uygular.

---

## Bunun çalıştığı yer

Tüm transkript hijyeni gömülü çalıştırıcıda merkezileştirilmiştir:

- Politika seçimi: `src/agents/transcript-policy.ts`
- Temizleme/onarım uygulaması: `src/agents/pi-embedded-runner/replay-history.ts` içinde `sanitizeSessionHistory`

Politika, neyin uygulanacağına karar vermek için `provider`, `modelApi` ve `modelId` kullanır.

Transkript hijyeninden ayrı olarak, oturum dosyaları yüklemeden önce (gerekirse) onarılır:

- `src/agents/session-file-repair.ts` içinde `repairSessionFileIfNeeded`
- `run/attempt.ts` ve `compact.ts` içinden çağrılır (gömülü çalıştırıcı)

---

## Küresel kural: görüntü temizleme

Görüntü yükleri, boyut sınırları nedeniyle sağlayıcı tarafında reddi önlemek için her zaman temizlenir
(aşırı büyük base64 görüntüleri küçültme/yeniden sıkıştırma).

Bu, görsel yetenekli modeller için görüntü kaynaklı token baskısını denetlemeye de yardımcı olur.
Daha düşük azami boyutlar genellikle token kullanımını azaltır; daha yüksek boyutlar ayrıntıyı korur.

Uygulama:

- `src/agents/pi-embedded-helpers/images.ts` içinde `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` içinde `sanitizeContentBlocksImages`
- Azami görüntü kenarı `agents.defaults.imageMaxDimensionPx` ile yapılandırılabilir (varsayılan: `1200`).
- Bu geçiş yeniden oynatma içeriğini gezerken boş metin blokları kaldırılır. Boş hale
  gelen asistan dönüşleri yeniden oynatma kopyasından düşürülür; boş hale gelen kullanıcı ve araç sonucu
  dönüşleri boş olmayan bir atlanmış içerik yer tutucusu alır.

---

## Küresel kural: hatalı biçimlendirilmiş araç çağrıları

Hem `input` hem de `arguments` eksik olan asistan araç çağrısı blokları, model bağlamı oluşturulmadan
önce düşürülür. Bu, kısmen kalıcılaştırılmış araç çağrılarından kaynaklanan sağlayıcı reddini önler
(örneğin bir hız sınırı hatasından sonra).

Uygulama:

- `src/agents/session-transcript-repair.ts` içinde `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts` içindeki `sanitizeSessionHistory` içinde uygulanır

---

## Küresel kural: oturumlar arası girdi kaynağı

Bir ajan `sessions_send` aracılığıyla başka bir oturuma istem gönderdiğinde (ajanlar arası yanıt/duyuru adımları dahil),
OpenClaw oluşturulan kullanıcı dönüşünü şu şekilde kalıcılaştırır:

- `message.provenance.kind = "inter_session"`

OpenClaw ayrıca, etkin model çağrısının yabancı oturum çıktısını harici son kullanıcı talimatlarından
ayırt edebilmesi için yönlendirilen istem metninin önüne aynı dönüş içinde bir `[Inter-session message ... isUser=false]`
işaretçisi ekler. Bu işaretçi, mevcut olduğunda kaynak oturumu, kanalı ve aracı içerir. Transkript, sağlayıcı
uyumluluğu için hâlâ `role: "user"` kullanır, ancak görünür metin ve kaynak metaverisi dönüşü oturumlar arası veri olarak işaretler.

Bağlam yeniden oluşturma sırasında OpenClaw, yalnızca kaynak metaverisi olan eski kalıcılaştırılmış
oturumlar arası kullanıcı dönüşlerine aynı işaretçiyi uygular.

---

## Sağlayıcı matrisi (geçerli davranış)

**OpenAI / OpenAI Codex**

- Yalnızca görüntü temizleme.
- OpenAI Responses/Codex transkriptleri için sahipsiz reasoning imzalarını (ardından bir içerik bloğu gelmeyen tekil reasoning öğeleri) düşürür ve model rota değişiminden sonra yeniden oynatılabilir OpenAI reasoning içeriğini düşürür.
- Manuel/WebSocket yeniden oynatmasının gerekli `rs_*` durumunu asistan çıktı öğeleriyle eşlenmiş tutması için, şifrelenmiş boş özet öğeleri dahil olmak üzere yeniden oynatılabilir OpenAI Responses reasoning öğesi yüklerini korur.
- Araç çağrısı kimliği temizleme yok.
- Araç sonucu eşleştirme onarımı, gerçek eşleşmiş çıktıları taşıyabilir ve eksik araç çağrıları için Codex tarzı `aborted` çıktılar sentezleyebilir.
- Dönüş doğrulama veya yeniden sıralama yok.
- Eksik OpenAI Responses ailesi araç çıktıları, Codex yeniden oynatma normalizasyonuna uyması için `aborted` olarak sentezlenir.
- Düşünce imzası kaldırma yok.

**OpenAI uyumlu Gemma 4**

- Geçmiş asistan thinking/reasoning blokları, yerel OpenAI uyumlu Gemma 4 sunucularının önceki dönüş reasoning içeriği almaması için yeniden oynatmadan önce çıkarılır.
- Geçerli aynı dönüş araç çağrısı devamları, araç sonucu yeniden oynatılana kadar asistan reasoning bloğunu
  araç çağrısına bağlı tutar.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Araç çağrısı kimliği temizleme: katı alfanümerik.
- Araç sonucu eşleştirme onarımı ve sentetik araç sonuçları.
- Dönüş doğrulama (Gemini tarzı dönüş sıralaması).
- Google dönüş sıralaması düzeltmesi (geçmiş asistanla başlıyorsa başa küçük bir kullanıcı bootstrap’i ekle).
- Antigravity Claude: thinking imzalarını normalleştirir; imzasız thinking bloklarını düşürür.

**Anthropic / Minimax (Anthropic uyumlu)**

- Araç sonucu eşleştirme onarımı ve sentetik araç sonuçları.
- Dönüş doğrulama (katı sıralamayı karşılamak için ardışık kullanıcı dönüşlerini birleştirir).
- Thinking etkin olduğunda, Cloudflare AI Gateway rotaları dahil olmak üzere, sondaki asistan prefill dönüşleri giden Anthropic Messages
  yüklerinden çıkarılır.
- Eksik, boş veya boşluklardan oluşan yeniden oynatma imzalarına sahip thinking blokları,
  sağlayıcı dönüşümünden önce çıkarılır. Bu bir asistan dönüşünü boşaltırsa, OpenClaw
  boş olmayan atlanmış-reasoning metniyle dönüş şeklini korur.
- Çıkarılması gereken eski yalnızca thinking asistan dönüşleri, sağlayıcı bağdaştırıcılarının yeniden oynatma
  dönüşünü düşürmemesi için boş olmayan atlanmış-reasoning metniyle değiştirilir.

**Amazon Bedrock (Converse API)**

- Boş asistan akış hatası dönüşleri, yeniden oynatmadan önce boş olmayan bir yedek metin bloğuna onarılır. Bedrock Converse `content: []` içeren asistan mesajlarını reddeder, bu nedenle `stopReason: "error"` ve boş içerik içeren kalıcılaştırılmış asistan dönüşleri de yüklemeden önce diskte onarılır.
- Yalnızca boş metin blokları içeren asistan akış hatası dönüşleri, geçersiz bir boş blok yeniden oynatmak yerine bellek içi yeniden oynatma kopyasından düşürülür.
- Eksik, boş veya boşluklardan oluşan yeniden oynatma imzalarına sahip Claude thinking blokları,
  Converse yeniden oynatmasından önce çıkarılır. Bu bir asistan dönüşünü boşaltırsa, OpenClaw
  boş olmayan atlanmış-reasoning metniyle dönüş şeklini korur.
- Çıkarılması gereken eski yalnızca thinking asistan dönüşleri, Converse yeniden oynatmasının katı dönüş şeklini koruması için boş olmayan atlanmış-reasoning metniyle değiştirilir.
- Yeniden oynatma, OpenClaw teslimat yansısı ve gateway tarafından enjekte edilmiş asistan dönüşlerini filtreler.
- Görüntü temizleme küresel kural üzerinden uygulanır.

**Mistral (model kimliğine dayalı algılama dahil)**

- Araç çağrısı kimliği temizleme: strict9 (alfanümerik uzunluk 9).

**OpenRouter Gemini**

- Düşünce imzası temizleme: base64 olmayan `thought_signature` değerlerini çıkarır (base64 olanları tutar).

**Diğer her şey**

- Yalnızca görüntü temizleme.

---

## Geçmiş davranış (2026.1.22 öncesi)

2026.1.22 sürümünden önce OpenClaw, birden fazla transkript hijyeni katmanı uyguluyordu:

- Her bağlam oluşturma işleminde bir **transcript-sanitize uzantısı** çalışır ve şunları yapabilirdi:
  - Araç kullanımı/sonucu eşleştirmesini onarmak.
  - Araç çağrısı kimliklerini temizlemek (`_`/`-` karakterlerini koruyan katı olmayan bir mod dahil).
- Çalıştırıcı ayrıca sağlayıcıya özgü temizleme yapıyordu; bu da işi yineleyerek yapıyordu.
- Sağlayıcı politikası dışında ek mutasyonlar gerçekleşiyordu, şunlar dahil:
  - Kalıcılaştırmadan önce asistan metninden `<final>` etiketlerini çıkarma.
  - Boş asistan hata dönüşlerini düşürme.
  - Araç çağrılarından sonra asistan içeriğini kırpma.

Bu karmaşıklık, sağlayıcılar arası gerilemelere neden oldu (özellikle `openai-responses`
`call_id|fc_id` eşleştirmesi). 2026.1.22 temizliği uzantıyı kaldırdı, mantığı çalıştırıcıda merkezileştirdi
ve OpenAI’yi görüntü temizleme dışında **dokunulmaz** hale getirdi.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
