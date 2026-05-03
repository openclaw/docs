---
read_when:
    - Transkript yapısıyla bağlantılı sağlayıcı istek retlerinde hata ayıklıyorsunuz
    - Transkript arındırma veya araç çağrısı onarım mantığını değiştiriyorsunuz
    - Sağlayıcılar arasında araç çağrısı kimliği uyuşmazlıklarını araştırıyorsunuz
summary: 'Referans: sağlayıcıya özgü transkript arındırma ve onarım kuralları'
title: Transkript hijyeni
x-i18n:
    generated_at: "2026-05-03T09:02:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff3a364a4c4d1c0d1e03b2860396c2d7e32c554d7acd0791ed2eaadae06d35ab
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw, bir çalıştırmadan önce (model bağlamını oluştururken) transkriptlere **sağlayıcıya özgü düzeltmeler** uygular. Bunların çoğu, katı sağlayıcı gereksinimlerini karşılamak için kullanılan **bellek içi** ayarlamalardır. Ayrı bir oturum dosyası onarım geçişi de oturum yüklenmeden önce saklanan JSONL'yi yeniden yazabilir, ancak yalnızca hatalı biçimlendirilmiş satırlar veya geçersiz dayanıklı kayıtlar olan kalıcı turlar için. Teslim edilen asistan yanıtları diskte korunur; sağlayıcıya özgü asistan ön doldurma ayıklaması yalnızca giden yükler oluşturulurken gerçekleşir. Bir onarım gerçekleştiğinde, özgün dosya oturum dosyasının yanında yedeklenir.

Kapsam şunları içerir:

- Yalnızca çalışma zamanına ait istem bağlamının kullanıcıya görünen transkript turlarının dışında kalması
- Araç çağrısı kimliği temizleme
- Araç çağrısı girdi doğrulaması
- Araç sonucu eşleştirme onarımı
- Tur doğrulama / sıralama
- Düşünce imzası temizliği
- Düşünme imzası temizliği
- Görsel yükü temizleme
- Sağlayıcı yeniden oynatmasından önce boş metin bloğu temizliği
- Kullanıcı girdisi kaynak etiketleme (oturumlar arası yönlendirilmiş istemler için)
- Bedrock Converse yeniden oynatması için boş asistan hata turu onarımı

Transkript depolama ayrıntılarına ihtiyacınız varsa bkz.:

- [Oturum yönetimi ayrıntılı incelemesi](/tr/reference/session-management-compaction)

---

## Genel kural: çalışma zamanı bağlamı kullanıcı transkripti değildir

Çalışma zamanı/sistem bağlamı bir tur için model istemine eklenebilir, ancak bu
son kullanıcı tarafından yazılmış içerik değildir. OpenClaw, Gateway yanıtları,
kuyruğa alınmış takipler, ACP, CLI ve gömülü Pi çalıştırmaları için ayrı bir
transkript odaklı istem gövdesi tutar. Saklanan görünür kullanıcı turları,
çalışma zamanı ile zenginleştirilmiş istem yerine bu transkript gövdesini kullanır.

Çalışma zamanı sarmalayıcılarını zaten kalıcı hale getirmiş eski oturumlar için
Gateway geçmiş yüzeyleri, WebChat, TUI, REST veya SSE istemcilerine mesaj
döndürmeden önce bir görüntüleme projeksiyonu uygular.

---

## Bunun çalıştığı yer

Tüm transkript hijyeni gömülü çalıştırıcıda merkezileştirilmiştir:

- İlke seçimi: `src/agents/transcript-policy.ts`
- Temizleme/onarım uygulaması: `src/agents/pi-embedded-runner/replay-history.ts` içindeki `sanitizeSessionHistory`

İlke, ne uygulanacağına karar vermek için `provider`, `modelApi` ve `modelId` kullanır.

Transkript hijyeninden ayrı olarak, oturum dosyaları yüklemeden önce (gerekirse) onarılır:

- `src/agents/session-file-repair.ts` içindeki `repairSessionFileIfNeeded`
- `run/attempt.ts` ve `compact.ts` içinden çağrılır (gömülü çalıştırıcı)

---

## Genel kural: görsel temizleme

Görsel yükleri, boyut sınırları nedeniyle sağlayıcı tarafında reddedilmeyi
önlemek için her zaman temizlenir (aşırı büyük base64 görselleri küçültme/yeniden sıkıştırma).

Bu ayrıca görme yetenekli modeller için görsel kaynaklı token baskısını denetlemeye
yardımcı olur. Daha düşük azami boyutlar genellikle token kullanımını azaltır;
daha yüksek boyutlar ayrıntıyı korur.

Uygulama:

- `src/agents/pi-embedded-helpers/images.ts` içindeki `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` içindeki `sanitizeContentBlocksImages`
- Azami görsel kenarı `agents.defaults.imageMaxDimensionPx` ile yapılandırılabilir (varsayılan: `1200`).
- Bu geçiş yeniden oynatma içeriğini dolaşırken boş metin blokları kaldırılır. Boş
  hale gelen asistan turları yeniden oynatma kopyasından düşürülür; boş hale gelen
  kullanıcı ve araç sonucu turları boş olmayan bir atlanmış içerik yer tutucusu alır.

---

## Genel kural: hatalı biçimlendirilmiş araç çağrıları

Hem `input` hem de `arguments` eksik olan asistan araç çağrısı blokları,
model bağlamı oluşturulmadan önce düşürülür. Bu, kısmen kalıcı hale getirilmiş
araç çağrılarından kaynaklanan sağlayıcı reddetmelerini önler (örneğin, hız sınırı
hatasından sonra).

Uygulama:

- `src/agents/session-transcript-repair.ts` içindeki `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts` içindeki `sanitizeSessionHistory` içinde uygulanır

---

## Genel kural: oturumlar arası girdi kaynağı

Bir aracı `sessions_send` aracılığıyla başka bir oturuma istem gönderdiğinde
(aracıdan aracıya yanıt/duyuru adımları dahil), OpenClaw oluşturulan kullanıcı turunu şununla kalıcı hale getirir:

- `message.provenance.kind = "inter_session"`

OpenClaw ayrıca, etkin model çağrısının yabancı oturum çıktısını dış son kullanıcı
talimatlarından ayırt edebilmesi için yönlendirilmiş istem metninin önüne aynı turda
bir `[Inter-session message ... isUser=false]` işaretçisi ekler. Bu işaretçi,
kullanılabilir olduğunda kaynak oturumu, kanalı ve aracı içerir. Transkript,
sağlayıcı uyumluluğu için hâlâ `role: "user"` kullanır, ancak görünür metin ve
kaynak metaverisi turun oturumlar arası veri olduğunu işaretler.

Bağlam yeniden oluşturma sırasında OpenClaw, yalnızca kaynak metaverisine sahip
eski kalıcı oturumlar arası kullanıcı turlarına aynı işaretçiyi uygular.

---

## Sağlayıcı matrisi (geçerli davranış)

**OpenAI / OpenAI Codex**

- Yalnızca görsel temizleme.
- OpenAI Responses/Codex transkriptleri için yetim akıl yürütme imzalarını (ardından içerik bloğu gelmeyen bağımsız akıl yürütme öğeleri) düşürür ve model rota değişiminden sonra yeniden oynatılabilir OpenAI akıl yürütmesini düşürür.
- Manuel/WebSocket yeniden oynatmasının gerekli `rs_*` durumunu asistan çıktı öğeleriyle eşleştirilmiş tutması için şifrelenmiş boş özet öğeleri dahil yeniden oynatılabilir OpenAI Responses akıl yürütme öğesi yüklerini korur.
- Araç çağrısı kimliği temizleme yok.
- Araç sonucu eşleştirme onarımı, gerçek eşleşmiş çıktıları taşıyabilir ve eksik araç çağrıları için Codex tarzı `aborted` çıktıları sentezleyebilir.
- Tur doğrulama veya yeniden sıralama yok.
- Eksik OpenAI Responses ailesi araç çıktıları, Codex yeniden oynatma normalleştirmesiyle eşleşmesi için `aborted` olarak sentezlenir.
- Düşünce imzası ayıklama yok.

**OpenAI uyumlu Gemma 4**

- Yerel OpenAI uyumlu Gemma 4 sunucularının önceki tur akıl yürütme içeriğini almaması için geçmiş asistan düşünme/akıl yürütme blokları yeniden oynatma öncesinde ayıklanır.
- Geçerli aynı tur araç çağrısı devamları, araç sonucu yeniden oynatılana kadar asistan akıl yürütme bloğunu araç çağrısına bağlı tutar.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Araç çağrısı kimliği temizleme: katı alfanümerik.
- Araç sonucu eşleştirme onarımı ve sentetik araç sonuçları.
- Tur doğrulama (Gemini tarzı tur almaşıklığı).
- Google tur sıralaması düzeltmesi (geçmiş asistanla başlıyorsa küçük bir kullanıcı önyüklemesi ekler).
- Antigravity Claude: düşünme imzalarını normalleştirir; imzasız düşünme bloklarını düşürür.

**Anthropic / Minimax (Anthropic uyumlu)**

- Araç sonucu eşleştirme onarımı ve sentetik araç sonuçları.
- Tur doğrulama (katı almaşıklığı karşılamak için ardışık kullanıcı turlarını birleştirir).
- Düşünme etkin olduğunda, Cloudflare AI Gateway rotaları dahil, sondaki asistan ön doldurma turları giden Anthropic Messages yüklerinden ayıklanır.
- Eksik, boş veya yalnızca boşluk içeren yeniden oynatma imzalarına sahip düşünme blokları sağlayıcı dönüşümünden önce ayıklanır. Bu bir asistan turunu boşaltırsa OpenClaw, tur şeklini boş olmayan atlanmış akıl yürütme metniyle korur.
- Ayıklanması gereken eski yalnızca düşünme içeren asistan turları, sağlayıcı bağdaştırıcılarının yeniden oynatma turunu düşürmemesi için boş olmayan atlanmış akıl yürütme metniyle değiştirilir.

**Amazon Bedrock (Converse API)**

- Boş asistan akış hatası turları, yeniden oynatma öncesinde boş olmayan yedek metin bloğuna onarılır. Bedrock Converse `content: []` içeren asistan mesajlarını reddeder; bu nedenle `stopReason: "error"` ve boş içerik içeren kalıcı asistan turları da yükleme öncesinde diskte onarılır.
- Yalnızca boş metin blokları içeren asistan akış hatası turları, geçersiz boş bloğu yeniden oynatmak yerine bellek içi yeniden oynatma kopyasından düşürülür.
- Eksik, boş veya yalnızca boşluk içeren yeniden oynatma imzalarına sahip Claude düşünme blokları Converse yeniden oynatmasından önce ayıklanır. Bu bir asistan turunu boşaltırsa OpenClaw, tur şeklini boş olmayan atlanmış akıl yürütme metniyle korur.
- Ayıklanması gereken eski yalnızca düşünme içeren asistan turları, Converse yeniden oynatmasının katı tur şeklini koruması için boş olmayan atlanmış akıl yürütme metniyle değiştirilir.
- Yeniden oynatma, OpenClaw teslimat yansıtması ve Gateway tarafından enjekte edilmiş asistan turlarını filtreler.
- Görsel temizleme genel kural üzerinden uygulanır.

**Mistral (model kimliği tabanlı algılama dahil)**

- Araç çağrısı kimliği temizleme: strict9 (alfanümerik uzunluk 9).

**OpenRouter Gemini**

- Düşünce imzası temizliği: base64 olmayan `thought_signature` değerlerini ayıklar (base64 olanları tutar).

**OpenRouter Anthropic**

- Akıl yürütme etkin olduğunda, doğrulanmış OpenRouter OpenAI uyumlu Anthropic model yüklerinden sondaki asistan ön doldurma turları ayıklanır; bu, doğrudan Anthropic ve Cloudflare Anthropic yeniden oynatma davranışıyla eşleşir.

**Diğer her şey**

- Yalnızca görsel temizleme.

---

## Geçmiş davranış (2026.1.22 öncesi)

2026.1.22 sürümünden önce OpenClaw, birden çok transkript hijyeni katmanı uyguluyordu:

- Her bağlam oluşturmasında bir **transkript temizleme Plugin** çalışırdı ve şunları yapabilirdi:
  - Araç kullanımı/sonucu eşleştirmesini onarmak.
  - Araç çağrısı kimliklerini temizlemek (`_`/`-` koruyan katı olmayan mod dahil).
- Çalıştırıcı da sağlayıcıya özgü temizleme yapıyordu; bu, işi yineliyordu.
- Sağlayıcı ilkesi dışında ek mutasyonlar gerçekleşiyordu, bunlar dahil:
  - Kalıcı hale getirme öncesinde asistan metninden `<final>` etiketlerini ayıklamak.
  - Boş asistan hata turlarını düşürmek.
  - Araç çağrılarından sonra asistan içeriğini kırpmak.

Bu karmaşıklık, sağlayıcılar arası gerilemelere neden oldu (özellikle `openai-responses`
`call_id|fc_id` eşleştirmesi). 2026.1.22 temizliği uzantıyı kaldırdı, mantığı
çalıştırıcıda merkezileştirdi ve OpenAI'yi görsel temizleme dışında **dokunulmaz** hale getirdi.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
