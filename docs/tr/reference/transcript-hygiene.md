---
read_when:
    - Transkript yapısına bağlı sağlayıcı isteği reddetmelerinde hata ayıklıyorsunuz
    - Transkript temizleme veya araç çağrısı onarım mantığını değiştiriyorsunuz
    - Sağlayıcılar arasında araç çağrısı kimliği uyuşmazlıklarını araştırıyorsunuz
summary: 'Referans: sağlayıcıya özgü transkript temizleme ve onarım kuralları'
title: Transkript hijyeni
x-i18n:
    generated_at: "2026-05-05T01:49:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9441494f3e8bb18d1648acc789a40bf9501fe3f2d32b6293792e6a24710675d0
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw, bir çalıştırmadan önce (model bağlamı oluşturulurken) transkriptlere **sağlayıcıya özgü düzeltmeler** uygular. Bunların çoğu, katı sağlayıcı gereksinimlerini karşılamak için kullanılan **bellek içi** ayarlamalardır. Ayrı bir oturum dosyası onarım geçişi de oturum yüklenmeden önce depolanan JSONL'yi yeniden yazabilir, ancak yalnızca hatalı biçimlendirilmiş satırlar veya geçersiz dayanıklı kayıtlar olan kalıcı turlar için. Teslim edilen asistan yanıtları diskte korunur; sağlayıcıya özgü asistan ön-doldurma çıkarma işlemi yalnızca giden yükler oluşturulurken gerçekleşir. Bir onarım yapıldığında, özgün dosya oturum dosyasının yanında yedeklenir.

Kapsam şunları içerir:

- Çalışma zamanına özel prompt bağlamının kullanıcıya görünür transkript turlarının dışında kalması
- Araç çağrısı kimliği temizleme
- Araç çağrısı girdisi doğrulama
- Araç sonucu eşleştirme onarımı
- Tur doğrulama / sıralama
- Düşünce imzası temizleme
- Thinking imzası temizleme
- Görüntü yükü temizleme
- Sağlayıcı yeniden oynatmasından önce boş metin bloğu temizleme
- Kullanıcı girdisi köken etiketleme (oturumlar arası yönlendirilen prompt'lar için)
- Bedrock Converse yeniden oynatması için boş asistan hata turu onarımı

Transkript depolama ayrıntılarına ihtiyacınız varsa, bkz.:

- [Oturum yönetimi derinlemesine inceleme](/tr/reference/session-management-compaction)

---

## Genel kural: çalışma zamanı bağlamı kullanıcı transkripti değildir

Çalışma zamanı/sistem bağlamı, bir tur için model prompt'una eklenebilir, ancak bu
son kullanıcı tarafından yazılmış içerik değildir. OpenClaw, Gateway yanıtları,
kuyruğa alınmış takip iletileri, ACP, CLI ve gömülü Pi çalıştırmaları için ayrı bir transkript yüzlü
prompt gövdesi tutar. Depolanan görünür kullanıcı turları, çalışma zamanında zenginleştirilmiş prompt yerine bu transkript gövdesini kullanır.

Çalışma zamanı sarmalayıcılarını zaten kalıcı hale getirmiş eski oturumlar için Gateway geçmişi
yüzeyleri, WebChat, TUI, REST veya SSE istemcilerine iletileri döndürmeden önce bir görüntüleme projeksiyonu uygular.

---

## Bunun çalıştığı yer

Tüm transkript hijyeni gömülü çalıştırıcıda merkezileştirilmiştir:

- İlke seçimi: `src/agents/transcript-policy.ts`
- Temizleme/onarım uygulaması: `src/agents/pi-embedded-runner/replay-history.ts` içinde `sanitizeSessionHistory`

İlke, ne uygulanacağına karar vermek için `provider`, `modelApi` ve `modelId` kullanır.

Transkript hijyeninden ayrı olarak, oturum dosyaları yüklemeden önce (gerekirse) onarılır:

- `src/agents/session-file-repair.ts` içinde `repairSessionFileIfNeeded`
- `run/attempt.ts` ve `compact.ts` üzerinden çağrılır (gömülü çalıştırıcı)

---

## Genel kural: görüntü temizleme

Görüntü yükleri, boyut sınırları nedeniyle sağlayıcı tarafında reddedilmeyi önlemek için her zaman temizlenir
(aşırı büyük base64 görüntüleri küçültme/yeniden sıkıştırma).

Bu, görüntü yetenekli modeller için görüntü kaynaklı token baskısını denetlemeye de yardımcı olur.
Daha düşük azami boyutlar genellikle token kullanımını azaltır; daha yüksek boyutlar ayrıntıyı korur.

Uygulama:

- `src/agents/pi-embedded-helpers/images.ts` içinde `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` içinde `sanitizeContentBlocksImages`
- Azami görüntü kenarı `agents.defaults.imageMaxDimensionPx` üzerinden yapılandırılabilir (varsayılan: `1200`).
- Bu geçiş yeniden oynatma içeriğinde gezinirken boş metin blokları kaldırılır. Boş hale gelen asistan
  turları yeniden oynatma kopyasından düşürülür; boş hale gelen kullanıcı ve araç sonucu
  turları boş olmayan bir atlanmış içerik yer tutucusu alır.

---

## Genel kural: hatalı biçimlendirilmiş araç çağrıları

Hem `input` hem de `arguments` eksik olan asistan araç çağrısı blokları,
model bağlamı oluşturulmadan önce düşürülür. Bu, kısmen kalıcı hale getirilmiş
araç çağrılarından (örneğin, bir hız sınırı hatasından sonra) kaynaklanan sağlayıcı retlerini önler.

Uygulama:

- `src/agents/session-transcript-repair.ts` içinde `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts` içinde `sanitizeSessionHistory` kapsamında uygulanır

---

## Genel kural: oturumlar arası girdi kökeni

Bir agent, `sessions_send` yoluyla başka bir oturuma prompt gönderdiğinde (agent'tan agent'a yanıt/duyuru adımları dahil),
OpenClaw oluşturulan kullanıcı turunu şu değerle kalıcı hale getirir:

- `message.provenance.kind = "inter_session"`

OpenClaw ayrıca, etkin model çağrısının yabancı oturum çıktısını harici son kullanıcı talimatlarından ayırt edebilmesi için
yönlendirilen prompt metninden önce aynı turda bir `[Inter-session message ... isUser=false]`
işareti ekler. Bu işaret, varsa kaynak oturumu, kanalı ve aracı içerir. Transkript, sağlayıcı uyumluluğu için
`role: "user"` kullanmaya devam eder, ancak görünür metin ve köken
metadata'sı turun oturumlar arası veri olduğunu işaretler.

Bağlam yeniden oluşturma sırasında OpenClaw, yalnızca köken metadata'sına sahip olan daha eski kalıcı
oturumlar arası kullanıcı turlarına aynı işareti uygular.

---

## Sağlayıcı matrisi (geçerli davranış)

**OpenAI / OpenAI Codex**

- Yalnızca görüntü temizleme.
- OpenAI Responses/Codex transkriptleri için sahipsiz akıl yürütme imzalarını (sonrasında bir içerik bloğu olmayan bağımsız akıl yürütme öğeleri) düşürür ve bir model rota değişiminden sonra yeniden oynatılabilir OpenAI akıl yürütmesini düşürür.
- Şifrelenmiş boş özet öğeleri dahil olmak üzere yeniden oynatılabilir OpenAI Responses akıl yürütme öğesi yüklerini korur; böylece manuel/WebSocket yeniden oynatma, gerekli `rs_*` durumunu asistan çıktı öğeleriyle eşleştirilmiş tutar.
- Yerel ChatGPT Codex Responses, oturum `prompt_cache_key` değerini korurken önceki Responses akıl yürütme/ileti/işlev yüklerini önceki öğe kimlikleri olmadan yeniden oynatarak Codex tel eşdeğerliğini izler.
- Araç çağrısı kimliği temizleme yok.
- Araç sonucu eşleştirme onarımı gerçek eşleşen çıktıları taşıyabilir ve eksik araç çağrıları için Codex tarzı `aborted` çıktılar sentezleyebilir.
- Tur doğrulama veya yeniden sıralama yok.
- Eksik OpenAI Responses ailesi araç çıktıları, Codex yeniden oynatma normalleştirmesiyle eşleşmesi için `aborted` olarak sentezlenir.
- Düşünce imzası çıkarma yok.

**OpenAI uyumlu Gemma 4**

- Yerel OpenAI uyumlu Gemma 4 sunucularının önceki tur akıl yürütme içeriğini almaması için geçmiş asistan düşünme/akıl yürütme blokları yeniden oynatmadan önce çıkarılır.
- Geçerli aynı tur araç çağrısı devamları, araç sonucu yeniden oynatılana kadar asistan akıl yürütme bloğunu araç çağrısına bağlı tutar.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Araç çağrısı kimliği temizleme: katı alfanümerik.
- Araç sonucu eşleştirme onarımı ve sentetik araç sonuçları.
- Tur doğrulama (Gemini tarzı tur sırayla dönüşümü).
- Google tur sıralama düzeltmesi (geçmiş asistanla başlıyorsa küçük bir kullanıcı önyüklemesi başa eklenir).
- Antigravity Claude: thinking imzalarını normalleştirir; imzasız thinking bloklarını düşürür.

**Anthropic / Minimax (Anthropic uyumlu)**

- Araç sonucu eşleştirme onarımı ve sentetik araç sonuçları.
- Tur doğrulama (katı sırayla dönüşümü karşılamak için ardışık kullanıcı turlarını birleştirir).
- Thinking etkinleştirildiğinde, Cloudflare AI Gateway rotaları dahil olmak üzere giden Anthropic Messages
  yüklerinden sondaki asistan ön-doldurma turları çıkarılır.
- Eksik, boş veya yalnızca boşluk içeren yeniden oynatma imzalarına sahip Thinking blokları
  sağlayıcı dönüşümünden önce çıkarılır. Bu bir asistan turunu boşaltırsa OpenClaw,
  tur biçimini boş olmayan atlanmış akıl yürütme metniyle korur.
- Çıkarılması gereken daha eski yalnızca thinking içeren asistan turları,
  sağlayıcı adaptörlerinin yeniden oynatma turunu düşürmemesi için boş olmayan atlanmış akıl yürütme metniyle değiştirilir.

**Amazon Bedrock (Converse API)**

- Boş asistan akış hatası turları, yeniden oynatmadan önce boş olmayan bir yedek metin bloğuna onarılır. Bedrock Converse, `content: []` içeren asistan iletilerini reddeder; bu nedenle `stopReason: "error"` ve boş içeriğe sahip kalıcı asistan turları da yüklemeden önce diskte onarılır.
- Yalnızca boş metin blokları içeren asistan akış hatası turları,
  geçersiz bir boş bloğu yeniden oynatmak yerine bellek içi yeniden oynatma kopyasından düşürülür.
- Eksik, boş veya yalnızca boşluk içeren yeniden oynatma imzalarına sahip Claude thinking blokları,
  Converse yeniden oynatmasından önce çıkarılır. Bu bir asistan turunu boşaltırsa OpenClaw,
  tur biçimini boş olmayan atlanmış akıl yürütme metniyle korur.
- Çıkarılması gereken daha eski yalnızca thinking içeren asistan turları,
  Converse yeniden oynatmasının katı tur biçimini koruması için boş olmayan atlanmış akıl yürütme metniyle değiştirilir.
- Yeniden oynatma, OpenClaw teslimat yansıtması ve gateway tarafından enjekte edilen asistan turlarını filtreler.
- Görüntü temizleme genel kural aracılığıyla uygulanır.

**Mistral (model kimliğine dayalı algılama dahil)**

- Araç çağrısı kimliği temizleme: strict9 (alfanümerik uzunluk 9).

**OpenRouter Gemini**

- Düşünce imzası temizleme: base64 olmayan `thought_signature` değerlerini çıkarır (base64 olanları tutar).

**OpenRouter Anthropic**

- Akıl yürütme etkinleştirildiğinde, doğrulanmış OpenRouter
  OpenAI uyumlu Anthropic model yüklerinden sondaki asistan ön-doldurma turları çıkarılır; bu, doğrudan Anthropic ve Cloudflare Anthropic yeniden oynatma davranışıyla eşleşir.

**Diğer her şey**

- Yalnızca görüntü temizleme.

---

## Geçmiş davranış (2026.1.22 öncesi)

2026.1.22 sürümünden önce OpenClaw, birden çok transkript hijyeni katmanı uyguluyordu:

- Her bağlam oluşturma işleminde bir **transcript-sanitize extension** çalışıyordu ve şunları yapabiliyordu:
  - Araç kullanımı/sonucu eşleştirmesini onarmak.
  - Araç çağrısı kimliklerini temizlemek (`_`/`-` karakterlerini koruyan katı olmayan bir mod dahil).
- Çalıştırıcı ayrıca sağlayıcıya özgü temizleme gerçekleştiriyordu; bu da işi yineliyordu.
- Sağlayıcı ilkesi dışında ek mutasyonlar gerçekleşiyordu, bunlar şunları içeriyordu:
  - Kalıcı hale getirmeden önce asistan metninden `<final>` etiketlerini çıkarmak.
  - Boş asistan hata turlarını düşürmek.
  - Araç çağrılarından sonra asistan içeriğini kırpmak.

Bu karmaşıklık, sağlayıcılar arası regresyonlara neden oldu (özellikle `openai-responses`
`call_id|fc_id` eşleştirmesi). 2026.1.22 temizliği extension'ı kaldırdı, mantığı çalıştırıcıda merkezileştirdi
ve OpenAI'yi görüntü temizleme dışında **dokunulmaz** hale getirdi.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
