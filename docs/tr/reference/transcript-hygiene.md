---
read_when:
    - Transkript yapısına bağlı sağlayıcı istek reddetmelerinde hata ayıklıyorsunuz
    - Transkript temizleme veya araç çağrısı onarma mantığını değiştiriyorsunuz
    - Sağlayıcılar arasındaki araç çağrısı kimliği uyuşmazlıklarını araştırıyorsunuz
summary: 'Referans: sağlayıcıya özgü transkript temizleme ve onarım kuralları'
title: Transkript temizliği
x-i18n:
    generated_at: "2026-07-12T12:44:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw, bir çalıştırmadan (model bağlamını oluştururken) önce transkriptlere **sağlayıcıya özgü düzeltmeler** uygular. Bunların çoğu, katı sağlayıcı gereksinimlerini karşılamak için kullanılan **bellek içi** ayarlamalardır. Ayrı bir oturum dosyası onarım geçişi de oturum yüklenmeden önce depolanan JSONL'yi yeniden yazabilir, ancak yalnızca hatalı biçimlendirilmiş satırlar veya geçerli kalıcı kayıtlar olmayan kalıcı turlar için. İletilmiş asistan yanıtları diskte korunur; sağlayıcıya özgü asistan ön dolgusunun kaldırılması yalnızca giden yükler oluşturulurken gerçekleşir.

Bir onarım gerçekleştiğinde, atomik değiştirme işleminden önce özgün dosya geçici bir `*.bak-<pid>-<ts>` kardeş dosyasına yazılır ve değiştirme başarılı olduktan sonra kaldırılır. Yedek yalnızca temizleme işleminin kendisi başarısız olursa tutulur; bu durumda dosya yolu geri bildirilir.

Kapsam şunları içerir:

- Yalnızca çalışma zamanına ait istem bağlamının kullanıcıya görünür transkript turlarının dışında tutulması
- Araç çağrısı kimliği temizleme
- Araç çağrısı girdisi doğrulama
- Araç sonucu eşleştirme onarımı
- Tur doğrulama / sıralama
- Düşünce imzası temizleme
- Akıl yürütme imzası temizleme
- Görsel yükü temizleme
- Sağlayıcıda yeniden oynatmadan önce boş metin bloklarını temizleme
- Sağlayıcıda yeniden oynatmadan önce yalnızca tamamlanmamış akıl yürütme içeren uzunluk turlarını temizleme
- Kullanıcı girdisi kaynağını etiketleme (oturumlar arası yönlendirilmiş istemler için)
- Bedrock Converse yeniden oynatması için boş asistan hata turu onarımı

Transkript depolama ayrıntılarına ihtiyacınız varsa
[Oturum yönetimine ayrıntılı bakış](/tr/reference/session-management-compaction) bölümüne bakın.

---

## Genel kural: çalışma zamanı bağlamı kullanıcı transkripti değildir

Bir tur için model istemine çalışma zamanı/sistem bağlamı eklenebilir ancak bu, son kullanıcı tarafından yazılmış içerik değildir. OpenClaw; Gateway yanıtları, kuyruğa alınmış takip iletileri, ACP, CLI ve gömülü OpenClaw çalıştırmaları için transkripte yönelik ayrı bir istem gövdesi tutar. Depolanan görünür kullanıcı turları, çalışma zamanı bağlamıyla zenginleştirilmiş istem yerine bu transkript gövdesini kullanır.

Çalışma zamanı sarmalayıcılarını zaten kalıcı hâle getirmiş eski oturumlarda Gateway geçmişi yüzeyleri; iletileri WebChat, TUI, REST veya SSE istemcilerine döndürmeden önce bir görüntüleme izdüşümü uygular.

---

## Bunun çalıştığı yer

Tüm transkript hijyeni gömülü çalıştırıcıda merkezileştirilmiştir:

- İlke seçimi: `src/agents/transcript-policy.ts`
  (`provider`, `modelApi` ve `modelId` temelinde anahtarlanan `resolveTranscriptPolicy`)
- Temizleme/onarım uygulaması:
  `src/agents/embedded-agent-runner/replay-history.ts` içindeki `sanitizeSessionHistory`

Transkript hijyeninden ayrı olarak oturum dosyaları, yüklenmeden önce gerekirse onarılır:

- `src/agents/session-file-repair.ts` içindeki `repairSessionFileIfNeeded`
- `src/agents/embedded-agent-runner/run/attempt.ts` ve
  `src/agents/embedded-agent-runner/compact.ts` içinden çağrılır

---

## Genel kural: görsel temizleme

Boyut sınırları nedeniyle sağlayıcı tarafında oluşabilecek reddetmeleri önlemek için görsel yükleri her zaman temizlenir (aşırı büyük base64 görseller küçültülür/yeniden sıkıştırılır). Bu işlem, görsel destekli modellerde görsellerden kaynaklanan token baskısını denetlemeye de yardımcı olur: daha düşük azami boyutlar token kullanımını azaltırken daha yüksek boyutlar ayrıntıları korur.

Uygulama:

- `src/agents/embedded-agent-helpers/images.ts` içindeki
  `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` içindeki `sanitizeContentBlocksImages`
- Azami görsel kenarı `agents.defaults.imageMaxDimensionPx` ile yapılandırılabilir
  (varsayılan: `1200`)
- Bu geçiş yeniden oynatma içeriğini işlerken boş metin blokları kaldırılır.
  Boş hâle gelen asistan turları yeniden oynatma kopyasından çıkarılır;
  boş hâle gelen kullanıcı ve araç sonucu turlarına boş olmayan bir
  atlanmış içerik yer tutucusu eklenir.

---

## Genel kural: hatalı biçimlendirilmiş araç çağrıları

Hem `input` hem de `arguments` alanı eksik olan asistan araç çağrısı blokları, model bağlamı oluşturulmadan önce kaldırılır. Bu, kısmen kalıcı hâle getirilmiş araç çağrılarının (örneğin bir hız sınırı hatasından sonra) sağlayıcı tarafından reddedilmesini önler.

Uygulama:

- `src/agents/session-transcript-repair.ts` içindeki `sanitizeToolCallInputs`
- `sanitizeSessionHistory` içinde uygulanır
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Genel kural: yalnızca tamamlanmamış akıl yürütme içeren turlar

Yalnızca düşünme veya sansürlenmiş düşünme içeriğiyle sağlayıcının çıktı sınırına ulaşan asistan turları, bellek içi yeniden oynatma kopyasından çıkarılır. Bu turlar tamamlanmamış sağlayıcı durumu içerir ve kısmi bir düşünme imzası taşıyabilir.

Boş uzunluk turları değişmeden kalır; görünür metin, araç çağrıları veya bilinmeyen içerik blokları içeren uzunluk turları da aynı şekilde korunur. Depolanan transkriptler yeniden yazılmaz.

Uygulama: `src/agents/embedded-agent-runner/replay-history.ts` içindeki `normalizeAssistantReplayContent`

---

## Genel kural: oturumlar arası girdi kaynağı

Bir agent, `sessions_send` aracılığıyla başka bir oturuma istem gönderdiğinde (agent'tan agent'a yanıt/duyuru adımları dâhil), OpenClaw oluşturulan kullanıcı turunu `message.provenance.kind = "inter_session"` ile kalıcı hâle getirir.

OpenClaw ayrıca etkin model çağrısının yabancı oturum çıktısını harici son kullanıcı talimatlarından ayırt edebilmesi için yönlendirilmiş istem metninin önüne aynı tur içinde bir `[Inter-session message] ... isUser=false` işareti ekler. Bu işaret, mevcut olduğunda kaynak oturumu, kanalı ve aracı içerir. Sağlayıcı uyumluluğu için transkript yine `role: "user"` kullanır ancak hem görünür metin hem de kaynak meta verileri turu oturumlar arası veri olarak işaretler.

Bağlam yeniden oluşturulurken OpenClaw, yalnızca kaynak meta verilerine sahip eski kalıcı oturumlar arası kullanıcı turlarına da aynı işareti uygular.

---

## Sağlayıcı matrisi (geçerli davranış)

**OpenAI / OpenAI Codex**

- Yalnızca görsel temizleme.
- OpenAI Responses/Codex transkriptlerinde sahipsiz akıl yürütme imzalarını (ardından içerik bloğu gelmeyen bağımsız akıl yürütme öğeleri) ve model rotası değişikliğinden sonra yeniden oynatılabilir OpenAI akıl yürütmesini kaldırır.
- Manuel/WebSocket yeniden oynatmasının gerekli `rs_*` durumunu asistan çıktı öğeleriyle eşleştirmesini sağlamak için şifrelenmiş boş özet öğeleri dâhil yeniden oynatılabilir OpenAI Responses akıl yürütme öğesi yüklerini korur.
- Yerel ChatGPT Codex Responses, oturum `prompt_cache_key` değerini korurken önceki öğe kimlikleri olmadan önceki Responses akıl yürütme/ileti/işlev yüklerini yeniden oynatarak Codex kablo protokolüyle eş davranır.
- OpenAI Responses ailesi yeniden oynatması, aynı modele ait kurallı `call_*|fc_*` akıl yürütme çiftlerini korur ancak pi-ai yük dönüşümünden önce hatalı biçimlendirilmiş veya aşırı uzun `call_id`/işlev çağrısı öğesi kimliklerini belirlenebilir biçimde normalleştirir.
- Araç sonucu eşleştirme onarımı, gerçek eşleşmiş çıktıları taşıyabilir ve eksik araç çağrıları için Codex tarzı `aborted` çıktılar oluşturabilir.
- Tur doğrulaması veya yeniden sıralaması yapılmaz; düşünce imzaları kaldırılmaz.

**OpenAI uyumlu Chat Completions**

- Yerel ve proxy tarzı OpenAI uyumlu sunucuların `reasoning` veya `reasoning_content` gibi önceki turlara ait akıl yürütme alanlarını almaması için geçmiş asistan düşünme/akıl yürütme blokları yeniden oynatmadan önce kaldırılır.
- Aynı turdaki güncel araç çağrısı devamları, araç sonucu yeniden oynatılana kadar asistan akıl yürütme bloğunu araç çağrısına bağlı tutar.
- `reasoning: true` değerine sahip özel/kendi sunucunuzda barındırılan model girdileri, yeniden oynatılan akıl yürütme meta verilerini korur.
- Sağlayıcının sahip olduğu istisnalar, kablo protokolleri yeniden oynatılan akıl yürütme meta verilerini gerektiriyorsa bu davranıştan çıkabilir.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Araç çağrısı kimliği temizleme: katı alfasayısal.
- Araç sonucu eşleştirme onarımı ve yapay araç sonuçları.
- Tur doğrulama (Gemini tarzı tur dönüşümü).
- Google tur sıralaması düzeltmesi (geçmiş asistanla başlıyorsa başına küçük bir kullanıcı başlangıç iletisi ekler).
- Antigravity Claude: düşünme imzalarını normalleştirir; imzasız düşünme bloklarını kaldırır.

**Anthropic / Minimax (Anthropic uyumlu)**

- Araç sonucu eşleştirme onarımı ve yapay araç sonuçları.
- Tur doğrulama (katı dönüşümü karşılamak için art arda gelen kullanıcı turlarını birleştirir).
- Düşünme etkinleştirildiğinde, Cloudflare AI Gateway rotaları dâhil olmak üzere sondaki asistan ön dolgu turları giden Anthropic Messages yüklerinden kaldırılır.
- Bir oturum Compaction işleminden geçtiğinde, Compaction öncesi asistan düşünme imzaları sağlayıcıda yeniden oynatılmadan önce kaldırılır. Düşünme imzaları, oluşturuldukları sırada konuşma önekine kriptografik olarak bağlıdır; Compaction sonrasında önek değişir (özgün içeriğin yerini özetlenmiş içerik alır), bu nedenle özgün imzaların yeniden oynatılması Anthropic'in isteği "Invalid signature in thinking block" hatasıyla reddetmesine neden olur. Düşünme metni imzasız bir blok olarak korunur ve ardından aşağıdaki kural tarafından işlenir.
- Eksik, boş veya yalnızca boşluk içeren yeniden oynatma imzalarına sahip düşünme blokları, sağlayıcı dönüşümünden önce kaldırılır. Bu işlem bir asistan turunu boşaltırsa OpenClaw, boş olmayan atlanmış akıl yürütme metniyle turun yapısını korur.
- Kaldırılması gereken eski, yalnızca düşünme içeren asistan turları; sağlayıcı bağdaştırıcılarının yeniden oynatma turunu kaldırmaması için boş olmayan atlanmış akıl yürütme metniyle değiştirilir.

**Amazon Bedrock (Converse API)**

- Boş asistan akış hatası turları, yeniden oynatmadan önce boş olmayan bir yedek metin bloğuyla onarılır. Bedrock Converse, `content: []` içeren asistan iletilerini reddeder; bu nedenle `stopReason:
"error"` değerine ve boş içeriğe sahip kalıcı asistan turları da yüklenmeden önce diskte onarılır.
- Yalnızca boş metin blokları içeren asistan akış hatası turları, geçersiz bir boş bloğu yeniden oynatmak yerine bellek içi yeniden oynatma kopyasından kaldırılır.
- Bir oturum Compaction işleminden geçtiğinde, yukarıdaki Anthropic ile aynı nedenle Compaction öncesi asistan düşünme imzaları Converse yeniden oynatmasından önce kaldırılır.
- Eksik, boş veya yalnızca boşluk içeren yeniden oynatma imzalarına sahip Claude düşünme blokları, Converse yeniden oynatmasından önce kaldırılır. Bu işlem bir asistan turunu boşaltırsa OpenClaw, boş olmayan atlanmış akıl yürütme metniyle turun yapısını korur.
- Kaldırılması gereken eski, yalnızca düşünme içeren asistan turları; Converse yeniden oynatmasının katı tur yapısını koruması için boş olmayan atlanmış akıl yürütme metniyle değiştirilir.
- Yeniden oynatma, OpenClaw teslimat yansısı ve Gateway tarafından eklenen asistan turlarını filtreler.
- Görsel temizleme genel kural üzerinden uygulanır.

**Mistral (model kimliği tabanlı algılama dâhil)**

- Araç çağrısı kimliği temizleme: strict9 (alfasayısal, 9 karakter uzunluğunda).

**OpenRouter Gemini**

- Düşünce imzası temizleme: base64 olmayan `thought_signature` değerlerini kaldırır (base64 değerlerini korur).

**OpenRouter Anthropic**

- Akıl yürütme etkinleştirildiğinde, doğrulanmış OpenRouter OpenAI uyumlu Anthropic model yüklerinden sondaki asistan ön dolgu turları kaldırılır; bu davranış doğrudan Anthropic ve Cloudflare Anthropic yeniden oynatma davranışıyla eşleşir.

**Diğerlerinin tümü**

- Yalnızca görsel temizleme.

---

## Geçmiş davranış (2026.1.22 öncesi)

2026.1.22 sürümünden önce OpenClaw, birden çok transkript hijyeni katmanı uyguluyordu:

- Her bağlam oluşturma işleminde bir **transkript temizleme uzantısı** çalışıyordu ve şunları yapabiliyordu:
  - Araç kullanımı/sonucu eşleştirmesini onarma.
  - Araç çağrısı kimliklerini temizleme (`_`/`-` karakterlerini koruyan katı olmayan bir mod dâhil).
- Çalıştırıcı ayrıca sağlayıcıya özgü temizleme gerçekleştiriyor ve bu da işi yineliyordu.
- Sağlayıcı ilkesinin dışında; kalıcı hâle getirmeden önce asistan metninden `<final>` etiketlerini kaldırma, boş asistan hata turlarını çıkarma ve araç çağrılarından sonra asistan içeriğini kırpma gibi ek değişiklikler yapılıyordu.

Bu karmaşıklık, sağlayıcılar arası gerilemelere (özellikle `openai-responses` `call_id|fc_id` eşleştirmesinde) neden oldu. 2026.1.22 temizliği uzantıyı kaldırdı, mantığı çalıştırıcıda merkezileştirdi ve OpenAI'ı görsel temizleme dışında **dokunulmaz** hâle getirdi.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
