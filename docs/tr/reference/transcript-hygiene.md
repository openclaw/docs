---
read_when:
    - Döküm şekline bağlı sağlayıcı istek reddetmelerinde hata ayıklıyorsunuz
    - Döküm temizleme veya araç çağrısı onarım mantığını değiştiriyorsunuz
    - Sağlayıcılar arasında araç çağrısı kimliği uyuşmazlıklarını araştırıyorsunuz
summary: 'Başvuru: sağlayıcıya özgü döküm temizleme ve onarım kuralları'
title: Döküm temizliği
x-i18n:
    generated_at: "2026-04-24T09:31:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c206186f2c4816775db0f2c4663f07f5a55831a8920d1d0261ff9998bd82efc0
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Döküm Temizliği (Sağlayıcı Düzeltmeleri)

Bu belge, bir çalıştırmadan önce dökümlere uygulanan **sağlayıcıya özgü düzeltmeleri**
açıklar (model bağlamı oluşturulurken). Bunlar, katı sağlayıcı
gereksinimlerini karşılamak için kullanılan **bellek içi** ayarlamalardır. Bu
temizlik adımları disk üzerindeki saklanan JSONL dökümünü **yeniden yazmaz**; ancak ayrı bir oturum dosyası
onarım geçişi, oturum yüklenmeden önce geçersiz satırları düşürerek hatalı JSONL dosyalarını
yeniden yazabilir. Bir onarım gerçekleştiğinde özgün dosya, oturum dosyasının yanında yedeklenir.

Kapsam şunları içerir:

- Araç çağrısı kimliği temizleme
- Araç çağrısı girdisi doğrulama
- Araç sonucu eşleştirme onarımı
- Tur doğrulama / sıralama
- Düşünce imzası temizleme
- Görüntü payload temizleme
- Kullanıcı girdi kaynağı etiketleme (oturumlar arası yönlendirilen prompt'lar için)

Döküm depolama ayrıntılarına ihtiyacınız varsa bkz.:

- [/reference/session-management-compaction](/tr/reference/session-management-compaction)

---

## Bunun çalıştığı yer

Tüm döküm temizliği gömülü çalıştırıcıda merkezileştirilmiştir:

- İlke seçimi: `src/agents/transcript-policy.ts`
- Temizleme/onarım uygulaması: `src/agents/pi-embedded-runner/replay-history.ts` içindeki `sanitizeSessionHistory`

İlke, ne uygulanacağına karar vermek için `provider`, `modelApi` ve `modelId` kullanır.

Döküm temizliğinden ayrı olarak, oturum dosyaları yüklemeden önce gerekirse onarılır:

- `src/agents/session-file-repair.ts` içindeki `repairSessionFileIfNeeded`
- `run/attempt.ts` ve `compact.ts` tarafından çağrılır (gömülü çalıştırıcı)

---

## Genel kural: görüntü temizleme

Sağlayıcı tarafı reddedilmeleri boyut
sınırları nedeniyle önlemek için görüntü payload'ları her zaman temizlenir
(aşırı büyük base64 görüntüler küçültülür/yeniden sıkıştırılır).

Bu ayrıca vision yetenekli modeller için görüntü kaynaklı token baskısını denetlemeye de yardımcı olur.
Daha düşük maksimum boyutlar genellikle token kullanımını azaltır; daha yüksek boyutlar ayrıntıyı korur.

Uygulama:

- `src/agents/pi-embedded-helpers/images.ts` içindeki `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` içindeki `sanitizeContentBlocksImages`
- Maksimum görüntü kenarı `agents.defaults.imageMaxDimensionPx` ile yapılandırılabilir (varsayılan: `1200`).

---

## Genel kural: hatalı araç çağrıları

Hem `input` hem de `arguments` alanları eksik olan assistant araç çağrısı blokları,
model bağlamı oluşturulmadan önce düşürülür. Bu, kısmen
kalıcılaştırılmış araç çağrılarından kaynaklanan sağlayıcı reddetmelerini önler (örneğin, bir hız sınırı hatasından sonra).

Uygulama:

- `src/agents/session-transcript-repair.ts` içindeki `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/replay-history.ts` içindeki `sanitizeSessionHistory` içinde uygulanır

---

## Genel kural: oturumlar arası girdi kaynağı

Bir agent, `sessions_send` aracılığıyla (agent-to-agent yanıt/duyuru adımları dahil)
başka bir oturuma prompt gönderdiğinde OpenClaw oluşturulan kullanıcı turunu şu şekilde kalıcılaştırır:

- `message.provenance.kind = "inter_session"`

Bu meta veriler, döküm ekleme anında yazılır ve rolü değiştirmez
(`role: "user"` sağlayıcı uyumluluğu için korunur). Döküm okuyucuları,
yönlendirilmiş iç prompt'ları son kullanıcı tarafından yazılmış talimatlar gibi ele almamak için
bunu kullanabilir.

Bağlam yeniden oluşturma sırasında OpenClaw, modelin bunları
harici son kullanıcı talimatlarından ayırt edebilmesi için bu kullanıcı turlarının başına bellek içinde kısa bir `[Inter-session message]`
işaretleyicisi de ekler.

---

## Sağlayıcı matrisi (geçerli davranış)

**OpenAI / OpenAI Codex**

- Yalnızca görüntü temizleme.
- OpenAI Responses/Codex dökümleri için yetim reasoning imzalarını (ardından içerik bloğu gelmeyen bağımsız reasoning öğeleri) düşürür.
- Araç çağrısı kimliği temizleme yok.
- Araç sonucu eşleştirme onarımı yok.
- Tur doğrulama veya yeniden sıralama yok.
- Sentetik araç sonucu yok.
- Düşünce imzası sıyırma yok.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Araç çağrısı kimliği temizleme: katı alfasayısal.
- Araç sonucu eşleştirme onarımı ve sentetik araç sonuçları.
- Tur doğrulama (Gemini tarzı tur ardışıklığı).
- Google tur sıralama düzeltmesi (geçmiş assistant ile başlıyorsa başa minik bir kullanıcı bootstrap ekler).
- Antigravity Claude: thinking imzalarını normalize eder; imzasız thinking bloklarını düşürür.

**Anthropic / Minimax (Anthropic-compatible)**

- Araç sonucu eşleştirme onarımı ve sentetik araç sonuçları.
- Tur doğrulama (katı ardışıklığı sağlamak için art arda gelen kullanıcı turlarını birleştirir).

**Mistral (model kimliği tabanlı algılama dahil)**

- Araç çağrısı kimliği temizleme: strict9 (uzunluğu 9 olan alfasayısal).

**OpenRouter Gemini**

- Düşünce imzası temizleme: base64 olmayan `thought_signature` değerlerini sıyırır (base64 olanı korur).

**Diğer her şey**

- Yalnızca görüntü temizleme.

---

## Tarihsel davranış (2026.1.22 öncesi)

2026.1.22 sürümünden önce OpenClaw, birden fazla döküm temizleme katmanı uygular:

- Her bağlam oluşturma işleminde çalışan bir **transcript-sanitize extension** vardı ve şunları yapabiliyordu:
  - Araç kullanımı/sonucu eşleşmesini onarmak.
  - Araç çağrısı kimliklerini temizlemek ( `_`/`-` karakterlerini koruyan katı olmayan mod dahil).
- Çalıştırıcı ayrıca sağlayıcıya özgü temizleme yapıyordu; bu da işi yineletiyordu.
- Sağlayıcı ilkesinin dışında ek mutasyonlar da oluyordu; bunlar arasında:
  - Kalıcılaştırmadan önce assistant metninden `<final>` etiketlerini sıyırma.
  - Boş assistant hata turlarını düşürme.
  - Araç çağrılarından sonra assistant içeriğini kırpma.

Bu karmaşıklık sağlayıcılar arası regresyonlara yol açtı (özellikle `openai-responses`
`call_id|fc_id` eşleşmesi). 2026.1.22 temizliği extension'ı kaldırdı, mantığı çalıştırıcıda merkezileştirdi ve OpenAI'yi görüntü temizleme dışında **dokunulmaz**
hale getirdi.

## İlgili

- [Session management](/tr/concepts/session)
- [Session pruning](/tr/concepts/session-pruning)
