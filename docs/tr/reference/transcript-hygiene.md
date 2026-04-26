---
read_when:
    - Transkript biçimine bağlı sağlayıcı istek reddetmelerinde hata ayıklıyorsunuz
    - Transkript temizleme veya tool-call onarım mantığını değiştiriyorsunuz
    - Sağlayıcılar arasında tool-call kimliği uyuşmazlıklarını inceliyorsunuz
summary: 'Referans: sağlayıcıya özgü transkript temizleme ve onarım kuralları'
title: Transkript hijyeni
x-i18n:
    generated_at: "2026-04-26T11:40:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: e380be2b011afca5fedf89579e702c6d221d42e777c23bd766c8df07ff05ed18
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Bu belge, bir çalıştırmadan önce transkriptlere uygulanan **sağlayıcıya özgü düzeltmeleri**
(model bağlamını oluşturma) açıklar. Bunların çoğu, katı sağlayıcı gereksinimlerini karşılamak için kullanılan **bellek içi** ayarlamalardır. Ayrı bir oturum dosyası onarım geçişi de, oturum yüklenmeden önce depolanan JSONL'yi yeniden yazabilir; bu işlem ya bozuk JSONL satırlarını silerek ya da sözdizimsel olarak geçerli fakat yeniden oynatma sırasında bir sağlayıcı tarafından reddedileceği bilinen kalıcı dönüşleri onararak yapılır. Bir onarım gerçekleştiğinde, özgün dosya oturum dosyasının yanında yedeklenir.

Kapsama şunlar dahildir:

- Kullanıcıya görünen transkript dönüşlerinin dışında kalan yalnızca çalışma zamanına ait prompt bağlamı
- Tool call kimliği temizleme
- Tool call girdi doğrulaması
- Tool result eşleştirme onarımı
- Dönüş doğrulama / sıralama
- Düşünce imzası temizliği
- Akıl yürütme imzası temizliği
- Görüntü yükü temizleme
- Kullanıcı girdisi köken etiketleme (oturumlar arası yönlendirilen prompt'lar için)
- Bedrock Converse yeniden oynatımı için boş assistant hata dönüşü onarımı

Transkript depolama ayrıntılarına ihtiyacınız varsa bkz.:

- [Oturum yönetimi derinlemesine inceleme](/tr/reference/session-management-compaction)

---

## Genel kural: çalışma zamanı bağlamı kullanıcı transkripti değildir

Çalışma zamanı/sistem bağlamı bir dönüş için model prompt'una eklenebilir, ancak
son kullanıcı tarafından yazılmış içerik değildir. OpenClaw, Gateway yanıtları,
kuyruğa alınmış takipler, ACP, CLI ve gömülü Pi çalıştırmaları için transkripte
yönelik ayrı bir prompt gövdesi tutar. Depolanan görünür kullanıcı dönüşleri,
çalışma zamanı ile zenginleştirilmiş prompt yerine bu transkript gövdesini kullanır.

Çalışma zamanı sarmalayıcılarını zaten kalıcı hale getirmiş eski oturumlar için,
Gateway geçmiş yüzeyleri, iletileri WebChat,
TUI, REST veya SSE istemcilerine döndürmeden önce bir görüntüleme projeksiyonu uygular.

---

## Bunun çalıştığı yer

Tüm transkript hijyeni gömülü çalıştırıcıda merkezileştirilmiştir:

- Politika seçimi: `src/agents/transcript-policy.ts`
- Temizleme/onarım uygulaması: `src/agents/pi-embedded-runner/replay-history.ts` içindeki `sanitizeSessionHistory`

Politika, neyin uygulanacağına karar vermek için `provider`, `modelApi` ve `modelId` kullanır.

Transkript hijyeninden ayrı olarak, oturum dosyaları yüklemeden önce (gerekirse) onarılır:

- `src/agents/session-file-repair.ts` içindeki `repairSessionFileIfNeeded`
- `run/attempt.ts` ve `compact.ts` tarafından çağrılır (gömülü çalıştırıcı)

---

## Genel kural: görüntü temizleme

Görüntü yükleri, boyut sınırları nedeniyle sağlayıcı tarafında reddedilmeyi önlemek için her zaman temizlenir
(aşırı büyük base64 görüntüler küçültülür/yeniden sıkıştırılır).

Bu ayrıca, görme yetenekli modeller için görüntü kaynaklı token baskısını kontrol etmeye de yardımcı olur.
Daha düşük azami görüntü boyutları genellikle token kullanımını azaltır; daha yüksek boyutlar ayrıntıyı korur.

Uygulama:

- `src/agents/pi-embedded-helpers/images.ts` içindeki `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` içindeki `sanitizeContentBlocksImages`
- Maksimum görüntü kenarı, `agents.defaults.imageMaxDimensionPx` ile yapılandırılabilir (varsayılan: `1200`).

---

## Genel kural: bozuk tool call'lar

Hem `input` hem de `arguments` eksik olan assistant tool-call blokları,
model bağlamı oluşturulmadan önce kaldırılır. Bu, kısmen kalıcı hale gelmiş
tool call'lardan kaynaklanan sağlayıcı reddetmelerini önler (örneğin, bir hız sınırı hatasından sonra).

Uygulama:

- `src/agents/session-transcript-repair.ts` içindeki `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts` içindeki `sanitizeSessionHistory` içinde uygulanır

---

## Genel kural: oturumlar arası girdi kökeni

Bir agent, `sessions_send` aracılığıyla başka bir oturuma prompt gönderdiğinde (buna
agent'tan agent'a yanıt/duyuru adımları da dahildir), OpenClaw oluşturulan kullanıcı dönüşünü şu şekilde kalıcı hale getirir:

- `message.provenance.kind = "inter_session"`

Bu meta veri, transkripte ekleme sırasında yazılır ve rolü değiştirmez
(sağlayıcı uyumluluğu için `role: "user"` olarak kalır). Transkript okuyucuları bunu,
yönlendirilmiş iç prompt'ları son kullanıcı tarafından yazılmış talimatlar olarak ele almaktan kaçınmak için kullanabilir.

Bağlam yeniden oluşturma sırasında OpenClaw ayrıca bu kullanıcı dönüşlerine bellek içinde
kısa bir `[Inter-session message]` işaretçisi ekler; böylece model bunları
harici son kullanıcı talimatlarından ayırt edebilir.

---

## Sağlayıcı matrisi (mevcut davranış)

**OpenAI / OpenAI Codex**

- Yalnızca görüntü temizleme.
- OpenAI Responses/Codex transkriptleri için sahipsiz akıl yürütme imzalarını (ardından gelen içerik bloğu olmayan bağımsız akıl yürütme öğeleri) kaldırır ve model rotası değişikliğinden sonra yeniden oynatılabilir OpenAI akıl yürütmesini kaldırır.
- Tool call kimliği temizleme yok.
- Tool result eşleştirme onarımı, gerçek eşleşen çıktıları taşıyabilir ve eksik tool call'lar için Codex tarzı `aborted` çıktılar sentezleyebilir.
- Dönüş doğrulama veya yeniden sıralama yok.
- Eksik OpenAI Responses ailesi tool çıktıları, Codex yeniden oynatma normalleştirmesiyle eşleşmesi için `aborted` olarak sentezlenir.
- Düşünce imzası kaldırma yok.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Tool call kimliği temizleme: katı alfasayısal.
- Tool result eşleştirme onarımı ve sentetik tool sonuçları.
- Dönüş doğrulama (Gemini tarzı dönüş sırayla değişimi).
- Google dönüş sıralama düzeltmesi (geçmiş assistant ile başlıyorsa başına küçük bir kullanıcı bootstrap'ı ekler).
- Antigravity Claude: akıl yürütme imzalarını normalleştirir; imzasız akıl yürütme bloklarını kaldırır.

**Anthropic / Minimax (Anthropic uyumlu)**

- Tool result eşleştirme onarımı ve sentetik tool sonuçları.
- Dönüş doğrulama (katı sırayla değişimi karşılamak için ardışık kullanıcı dönüşlerini birleştirir).
- Eksik, boş veya sadece boşluk içeren yeniden oynatma imzalarına sahip akıl yürütme blokları
  sağlayıcı dönüştürmesinden önce kaldırılır. Bu, bir assistant dönüşünü boşaltırsa OpenClaw,
  boş olmayan atlanmış akıl yürütme metniyle dönüş biçimini korur.
- Kaldırılması gereken eski yalnızca-akıl-yürütme assistant dönüşleri,
  sağlayıcı bağdaştırıcılarının yeniden oynatma dönüşünü düşürmemesi için
  boş olmayan atlanmış akıl yürütme metniyle değiştirilir.

**Amazon Bedrock (Converse API)**

- Boş assistant akış-hatası dönüşleri, yeniden oynatmadan önce boş olmayan bir geri dönüş metin bloğuna onarılır. Bedrock Converse, `content: []` içeren assistant iletilerini reddeder; bu nedenle
  `stopReason: "error"` ve boş içerik içeren kalıcı assistant dönüşleri de yüklemeden önce diskte onarılır.
- Eksik, boş veya sadece boşluk içeren yeniden oynatma imzalarına sahip Claude akıl yürütme blokları
  Converse yeniden oynatmasından önce kaldırılır. Bu, bir assistant dönüşünü boşaltırsa OpenClaw,
  boş olmayan atlanmış akıl yürütme metniyle dönüş biçimini korur.
- Kaldırılması gereken eski yalnızca-akıl-yürütme assistant dönüşleri,
  Converse yeniden oynatımının katı dönüş biçimini koruması için boş olmayan
  atlanmış akıl yürütme metniyle değiştirilir.
- Yeniden oynatma, OpenClaw teslimat aynası ve gateway tarafından eklenmiş assistant dönüşlerini filtreler.
- Görüntü temizleme genel kural üzerinden uygulanır.

**Mistral (model kimliği tabanlı algılama dahil)**

- Tool call kimliği temizleme: strict9 (uzunluğu 9 olan alfasayısal).

**OpenRouter Gemini**

- Düşünce imzası temizliği: base64 olmayan `thought_signature` değerlerini kaldırır (base64 olanları korur).

**Diğer her şey**

- Yalnızca görüntü temizleme.

---

## Geçmiş davranış (2026.1.22 öncesi)

2026.1.22 sürümünden önce OpenClaw, birden fazla katmanlı transkript hijyeni uyguluyordu:

- Her bağlam oluşturma sırasında çalışan bir **transcript-sanitize extension** şunları yapabiliyordu:
  - Tool use/result eşleştirmesini onarmak.
  - Tool call kimliklerini temizlemek (`_`/`-` karakterlerini koruyan katı olmayan mod dahil).
- Çalıştırıcı ayrıca sağlayıcıya özgü temizleme de yapıyordu; bu da işi yineliyordu.
- Sağlayıcı politikasının dışında ek mutasyonlar gerçekleşiyordu; bunlar arasında şunlar vardı:
  - Kalıcı hale getirmeden önce assistant metninden `<final>` etiketlerini kaldırmak.
  - Boş assistant hata dönüşlerini kaldırmak.
  - Tool call'lardan sonra assistant içeriğini kırpmak.

Bu karmaşıklık, sağlayıcılar arası gerilemelere neden oldu (`openai-responses`
`call_id|fc_id` eşleştirmesi özellikle dikkat çekicidir). 2026.1.22 temizliği, extension'ı kaldırdı, mantığı çalıştırıcıda merkezileştirdi ve OpenAI'yi görüntü temizleme dışında **dokunulmaz** hale getirdi.

## İlgili

- [Oturum yönetimi](/tr/concepts/session)
- [Oturum budama](/tr/concepts/session-pruning)
