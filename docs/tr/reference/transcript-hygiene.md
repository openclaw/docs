---
read_when:
    - Transkript biçimine bağlı sağlayıcı isteği reddetmelerinde hata ayıklıyorsunuz
    - Transkript temizlemeyi veya araç çağrısı onarma mantığını değiştiriyorsunuz
    - Sağlayıcılar arasında araç çağrısı kimliği uyuşmazlıklarını araştırıyorsunuz
summary: 'Referans: sağlayıcıya özgü transkript arındırma ve onarım kuralları'
title: Transkript hijyeni
x-i18n:
    generated_at: "2026-06-28T01:18:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca1c747b33dc0d6730281d6c91d28a0f8a85bcc5e5cb00dbdebdb55157871a7d
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw, bir çalıştırmadan önce (model bağlamı oluşturulurken) transkriptlere **sağlayıcıya özgü düzeltmeler** uygular. Bunların çoğu, katı sağlayıcı gereksinimlerini karşılamak için kullanılan **bellek içi** ayarlamalardır. Ayrı bir oturum dosyası onarım geçişi de oturum yüklenmeden önce depolanmış JSONL'yi yeniden yazabilir, ancak yalnızca hatalı biçimlendirilmiş satırlar veya geçersiz kalıcı kayıtlar olan kalıcılaştırılmış turlar için. Teslim edilen asistan yanıtları diskte korunur; sağlayıcıya özgü asistan ön doldurma temizleme işlemi yalnızca giden yükler oluşturulurken gerçekleşir. Bir onarım gerçekleştiğinde, atomik değiştirmeden önce özgün dosya geçici bir `*.bak-<pid>-<ts>` kardeşine yazılır ve değiştirme başarılı olduğunda kaldırılır; yedek yalnızca temizlemenin kendisi başarısız olursa tutulur (bu durumda yol geri bildirilir).

Kapsam şunları içerir:

- Kullanıcıya görünür transkript turlarının dışında kalan yalnızca çalışma zamanı istem bağlamı
- Araç çağrısı kimliği temizleme
- Araç çağrısı girdi doğrulaması
- Araç sonucu eşleştirme onarımı
- Tur doğrulama / sıralama
- Düşünce imzası temizleme
- Thinking imzası temizleme
- Görüntü yükü temizleme
- Sağlayıcı yeniden oynatmasından önce boş metin bloğu temizleme
- Sağlayıcı yeniden oynatmasından önce eksik, yalnızca akıl yürütme uzunluk turu temizleme
- Kullanıcı girdisi köken etiketleme (oturumlar arası yönlendirilen istemler için)
- Bedrock Converse yeniden oynatması için boş asistan hata turu onarımı

Transkript depolama ayrıntılarına ihtiyacınız varsa bkz.:

- [Oturum yönetimi derinlemesine inceleme](/tr/reference/session-management-compaction)

---

## Genel kural: çalışma zamanı bağlamı kullanıcı transkripti değildir

Çalışma zamanı/sistem bağlamı bir tur için model istemine eklenebilir, ancak bu
son kullanıcı tarafından yazılmış içerik değildir. OpenClaw, Gateway yanıtları,
kuyruğa alınmış takipler, ACP, CLI ve gömülü OpenClaw çalıştırmaları için ayrı bir
transkripte dönük istem gövdesi tutar. Depolanan görünür kullanıcı turları,
çalışma zamanı ile zenginleştirilmiş istem yerine bu transkript gövdesini kullanır.

Çalışma zamanı sarmalayıcılarını zaten kalıcılaştırmış eski oturumlar için Gateway
geçmiş yüzeyleri, WebChat, TUI, REST veya SSE istemcilerine iletileri döndürmeden
önce bir görüntüleme projeksiyonu uygular.

---

## Bunun çalıştığı yer

Tüm transkript hijyeni gömülü çalıştırıcıda merkezileştirilmiştir:

- İlke seçimi: `src/agents/transcript-policy.ts`
- Temizleme/onarım uygulaması: `src/agents/embedded-agent-runner/replay-history.ts` içindeki `sanitizeSessionHistory`

İlke, ne uygulanacağına karar vermek için `provider`, `modelApi` ve `modelId` kullanır.

Transkript hijyeninden ayrı olarak, oturum dosyaları yüklemeden önce (gerekirse) onarılır:

- `src/agents/session-file-repair.ts` içindeki `repairSessionFileIfNeeded`
- `run/attempt.ts` ve `compact.ts` tarafından çağrılır (gömülü çalıştırıcı)

---

## Genel kural: görüntü temizleme

Görüntü yükleri, boyut sınırları nedeniyle sağlayıcı tarafında reddedilmeyi önlemek
için her zaman temizlenir (aşırı büyük base64 görüntüleri küçültme/yeniden sıkıştırma).

Bu ayrıca görme yetenekli modeller için görüntü kaynaklı token baskısını denetlemeye
yardımcı olur. Daha düşük maksimum boyutlar genellikle token kullanımını azaltır;
daha yüksek boyutlar ayrıntıyı korur.

Uygulama:

- `src/agents/embedded-agent-helpers/images.ts` içindeki `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` içindeki `sanitizeContentBlocksImages`
- Maksimum görüntü kenarı `agents.defaults.imageMaxDimensionPx` üzerinden yapılandırılabilir (varsayılan: `1200`).
- Bu geçiş yeniden oynatma içeriğinde ilerlerken boş metin blokları kaldırılır. Boşalan
  asistan turları yeniden oynatma kopyasından düşürülür; boşalan kullanıcı ve araç sonucu
  turları boş olmayan bir atlanmış içerik yer tutucusu alır.

---

## Genel kural: hatalı biçimlendirilmiş araç çağrıları

Hem `input` hem de `arguments` eksik olan asistan araç çağrısı blokları,
model bağlamı oluşturulmadan önce düşürülür. Bu, kısmen kalıcılaştırılmış
araç çağrılarından kaynaklanan sağlayıcı reddetmelerini önler (örneğin, bir hız sınırı
hatasından sonra).

Uygulama:

- `src/agents/session-transcript-repair.ts` içindeki `sanitizeToolCallInputs`
- `src/agents/embedded-agent-runner/replay-history.ts` içindeki `sanitizeSessionHistory` içinde uygulanır

---

## Genel kural: eksik, yalnızca akıl yürütme turları

Yalnızca thinking veya redacted-thinking içerikle sağlayıcı çıktı sınırına ulaşan
asistan turları, bellek içi yeniden oynatma kopyasından çıkarılır. Bu tür turlar
eksik sağlayıcı durumu içerir ve kısmi bir thinking imzası taşıyabilir.

Boş uzunluk turları, görünür metin, araç çağrıları veya bilinmeyen içerik blokları
olan uzunluk turları gibi değişmeden kalır. Depolanan transkriptler yeniden yazılmaz.

Uygulama:

- `src/agents/embedded-agent-runner/replay-history.ts` içindeki `normalizeAssistantReplayContent`

---

## Genel kural: oturumlar arası girdi kökeni

Bir ajan `sessions_send` aracılığıyla başka bir oturuma istem gönderdiğinde (ajanlar
arası yanıt/duyuru adımları dahil), OpenClaw oluşturulan kullanıcı turunu şununla
kalıcılaştırır:

- `message.provenance.kind = "inter_session"`

OpenClaw ayrıca yönlendirilen istem metninden önce aynı turda bir
`[Inter-session message ... isUser=false]` işaretçisi ekler; böylece etkin model çağrısı
yabancı oturum çıktısını harici son kullanıcı talimatlarından ayırt edebilir. Bu işaretçi,
varsa kaynak oturumu, kanalı ve aracı içerir. Transkript sağlayıcı uyumluluğu için hâlâ
`role: "user"` kullanır, ancak görünür metin ve köken meta verileri turun oturumlar arası
veri olduğunu belirtir.

Bağlam yeniden oluşturulurken OpenClaw, yalnızca köken meta verisi olan daha eski
kalıcılaştırılmış oturumlar arası kullanıcı turlarına aynı işaretçiyi uygular.

---

## Sağlayıcı matrisi (geçerli davranış)

**OpenAI / OpenAI Codex**

- Yalnızca görüntü temizleme.
- OpenAI Responses/Codex transkriptleri için öksüz akıl yürütme imzalarını (ardından içerik bloğu gelmeyen bağımsız akıl yürütme öğeleri) düşür ve model rota geçişinden sonra yeniden oynatılabilir OpenAI akıl yürütmesini düşür.
- El ile/WebSocket yeniden oynatmasının gerekli `rs_*` durumunu asistan çıktı öğeleriyle eşleştirilmiş tutması için, şifrelenmiş boş özet öğeleri dahil yeniden oynatılabilir OpenAI Responses akıl yürütme öğesi yüklerini koru.
- Yerel ChatGPT Codex Responses, oturum `prompt_cache_key` değerini korurken önceki Responses akıl yürütme/ileti/fonksiyon yüklerini önceki öğe kimlikleri olmadan yeniden oynatarak Codex kablo uyumluluğunu izler.
- OpenAI Responses ailesi yeniden oynatma, kanonik `call_*|fc_*` aynı model akıl yürütme çiftlerini korur, ancak pi-ai yük dönüştürmesinden önce hatalı biçimlendirilmiş veya aşırı uzun `call_id` / fonksiyon çağrısı öğe kimliklerini deterministik olarak normalleştirir.
- Araç sonucu eşleştirme onarımı gerçek eşleşen çıktıları taşıyabilir ve eksik araç çağrıları için Codex tarzı `aborted` çıktıları sentezleyebilir.
- Tur doğrulaması veya yeniden sıralama yok.
- Eksik OpenAI Responses ailesi araç çıktıları, Codex yeniden oynatma normalleştirmesiyle eşleşmesi için `aborted` olarak sentezlenir.
- Düşünce imzası temizleme yok.

**OpenAI uyumlu Chat Completions**

- Geçmiş asistan thinking/akıl yürütme blokları, yerel ve proxy tarzı OpenAI uyumlu
  sunucuların `reasoning` veya `reasoning_content` gibi önceki tur akıl yürütme alanlarını
  almaması için yeniden oynatmadan önce temizlenir.
- Geçerli aynı tur araç çağrısı devamları, araç sonucu yeniden oynatılana kadar
  asistan akıl yürütme bloğunu araç çağrısına bağlı tutar.
- `reasoning: true` içeren özel/kendi barındırılan model girişleri, yeniden oynatılan
  akıl yürütme meta verilerini korur.
- Sağlayıcıya ait istisnalar, kablo protokolleri yeniden oynatılan akıl yürütme meta
  verilerini gerektirdiğinde bu davranıştan çıkabilir.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Araç çağrısı kimliği temizleme: katı alfanümerik.
- Araç sonucu eşleştirme onarımı ve sentetik araç sonuçları.
- Tur doğrulama (Gemini tarzı tur değişimi).
- Google tur sıralama düzeltmesi (geçmiş asistanla başlıyorsa küçük bir kullanıcı başlangıcı ekle).
- Antigravity Claude: thinking imzalarını normalleştir; imzasız thinking bloklarını düşür.

**Anthropic / Minimax (Anthropic uyumlu)**

- Araç sonucu eşleştirme onarımı ve sentetik araç sonuçları.
- Tur doğrulama (katı değişimi karşılamak için ardışık kullanıcı turlarını birleştir).
- Thinking etkin olduğunda, Cloudflare AI Gateway rotaları dahil giden Anthropic Messages
  yüklerinden sondaki asistan ön doldurma turları temizlenir.
- Oturum compact edilmişse, sağlayıcı yeniden oynatmasından önce Compaction öncesi
  asistan thinking imzaları temizlenir. Thinking imzaları üretim zamanında konuşma
  önekine kriptografik olarak bağlıdır; Compaction sonrasında önek değişir (özetlenen
  içerik bir Compaction özetiyle değiştirilir), bu nedenle özgün imzaların yeniden
  oynatılması Anthropic'in isteği "Invalid signature in thinking block" ile reddetmesine
  neden olur. Thinking metni imzasız bir blok olarak korunur ve ardından aşağıdaki
  kural tarafından işlenir.
- Eksik, boş veya boşluklardan oluşan yeniden oynatma imzalarına sahip thinking blokları,
  sağlayıcı dönüştürmesinden önce temizlenir. Bu bir asistan turunu boşaltırsa OpenClaw,
  tur biçimini boş olmayan atlanmış akıl yürütme metniyle korur.
- Temizlenmesi gereken daha eski yalnızca thinking asistan turları, sağlayıcı
  bağdaştırıcılarının yeniden oynatma turunu düşürmemesi için boş olmayan atlanmış
  akıl yürütme metniyle değiştirilir.

**Amazon Bedrock (Converse API)**

- Boş asistan akış hata turları, yeniden oynatmadan önce boş olmayan bir yedek metin bloğuna
  onarılır. Bedrock Converse `content: []` içeren asistan iletilerini reddettiğinden,
  `stopReason: "error"` ve boş içeriğe sahip kalıcılaştırılmış asistan turları da yüklemeden
  önce diskte onarılır.
- Yalnızca boş metin blokları içeren asistan akış hata turları, geçersiz bir boş bloğu
  yeniden oynatmak yerine bellek içi yeniden oynatma kopyasından düşürülür.
- Oturum compact edilmişse, yukarıdaki Anthropic ile aynı nedenle Converse yeniden
  oynatmasından önce Compaction öncesi asistan thinking imzaları temizlenir.
- Eksik, boş veya boşluklardan oluşan yeniden oynatma imzalarına sahip Claude thinking
  blokları, Converse yeniden oynatmasından önce temizlenir. Bu bir asistan turunu boşaltırsa
  OpenClaw, tur biçimini boş olmayan atlanmış akıl yürütme metniyle korur.
- Temizlenmesi gereken daha eski yalnızca thinking asistan turları, Converse yeniden oynatması
  katı tur biçimini korusun diye boş olmayan atlanmış akıl yürütme metniyle değiştirilir.
- Yeniden oynatma, OpenClaw teslimat yansıtması ve Gateway tarafından enjekte edilmiş asistan turlarını filtreler.
- Görüntü temizleme genel kural üzerinden uygulanır.

**Mistral (model kimliği tabanlı algılama dahil)**

- Araç çağrısı kimliği temizleme: strict9 (alfanümerik uzunluk 9).

**OpenRouter Gemini**

- Düşünce imzası temizleme: base64 olmayan `thought_signature` değerlerini temizle (base64 olanları tut).

**OpenRouter Anthropic**

- Akıl yürütme etkin olduğunda, doğrudan Anthropic ve Cloudflare Anthropic yeniden oynatma
  davranışıyla eşleşecek şekilde, doğrulanmış OpenRouter OpenAI uyumlu Anthropic model
  yüklerinden sondaki asistan ön doldurma turları temizlenir.

**Diğer her şey**

- Yalnızca görüntü temizleme.

---

## Tarihsel davranış (2026.1.22 öncesi)

2026.1.22 sürümünden önce OpenClaw, birden çok transkript hijyeni katmanı uyguluyordu:

- Her bağlam oluşturmasında bir **transcript-sanitize uzantısı** çalışır ve şunları yapabilirdi:
  - Araç kullanımı/sonucu eşleştirmesini onarmak.
  - Araç çağrısı kimliklerini temizlemek (`_`/`-` karakterlerini koruyan katı olmayan mod dahil).
- Çalıştırıcı ayrıca sağlayıcıya özgü temizleme yapıyordu; bu da işi yineledi.
- Sağlayıcı ilkesinin dışında ek mutasyonlar gerçekleşiyordu, bunlar dahil:
  - Kalıcılaştırmadan önce asistan metninden `<final>` etiketlerini temizleme.
  - Boş asistan hata turlarını düşürme.
  - Araç çağrılarından sonra asistan içeriğini kırpma.

Bu karmaşıklık sağlayıcılar arası gerilemelere neden oldu (özellikle `openai-responses`
`call_id|fc_id` eşleştirmesi). 2026.1.22 temizliği uzantıyı kaldırdı, mantığı
çalıştırıcıda merkezileştirdi ve OpenAI'yi görüntü temizleme dışında **dokunulmaz** yaptı.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
