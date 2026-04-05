---
read_when:
    - Transcript yapısına bağlı sağlayıcı istek reddetmelerinde hata ayıklıyorsunuz
    - Transcript temizleme veya araç çağrısı onarım mantığını değiştiriyorsunuz
    - Sağlayıcılar arasında araç çağrısı kimliği uyumsuzluklarını araştırıyorsunuz
summary: 'Başvuru: sağlayıcıya özgü transcript temizleme ve onarım kuralları'
title: Transcript Hijyeni
x-i18n:
    generated_at: "2026-04-05T14:08:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 217afafb693cf89651e8fa361252f7b5c197feb98d20be4697a83e6dedc0ec3f
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Transcript Hijyeni (Sağlayıcı Düzeltmeleri)

Bu belge, bir çalıştırma öncesinde transcript'lere uygulanan **sağlayıcıya özgü düzeltmeleri**
(a model bağlamı oluşturulurken) açıklar. Bunlar, katı sağlayıcı gereksinimlerini karşılamak için
kullanılan **bellek içi** ayarlamalardır. Bu hijyen adımları, diskte depolanan JSONL transcript'ini
**yeniden yazmaz**; ancak ayrı bir oturum dosyası onarım geçişi, oturum yüklenmeden önce geçersiz
satırları bırakarak bozuk JSONL dosyalarını yeniden yazabilir. Bir onarım gerçekleştiğinde, özgün
dosya oturum dosyasının yanında yedeklenir.

Kapsam şunları içerir:

- Araç çağrısı kimliği temizleme
- Araç çağrısı girdi doğrulaması
- Araç sonucu eşleme onarımı
- Tur doğrulaması / sıralama
- Düşünce imzası temizliği
- Görsel yükü temizleme
- Kullanıcı girdisi köken etiketleme (oturumlar arası yönlendirilmiş istemler için)

Transcript depolama ayrıntılarına ihtiyacınız varsa, şuraya bakın:

- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## Bunun çalıştığı yer

Tüm transcript hijyeni, gömülü runner içinde merkezileştirilmiştir:

- İlke seçimi: `src/agents/transcript-policy.ts`
- Temizleme/onarım uygulaması: `src/agents/pi-embedded-runner/google.ts` içindeki `sanitizeSessionHistory`

İlke, neyin uygulanacağına karar vermek için `provider`, `modelApi` ve `modelId` kullanır.

Transcript hijyeninden ayrı olarak, oturum dosyaları yüklemeden önce (gerekirse) onarılır:

- `src/agents/session-file-repair.ts` içindeki `repairSessionFileIfNeeded`
- `run/attempt.ts` ve `compact.ts` içinden çağrılır (gömülü runner)

---

## Genel kural: görsel temizleme

Görsel yükleri, boyut sınırları nedeniyle sağlayıcı tarafında reddedilmeyi önlemek için her zaman temizlenir
(aşırı büyük base64 görseller küçültülür/yeniden sıkıştırılır).

Bu ayrıca, görsel destekli modeller için görsel kaynaklı token baskısını kontrol etmeye de yardımcı olur.
Daha düşük azami boyutlar genellikle token kullanımını azaltır; daha yüksek boyutlar ayrıntıyı korur.

Uygulama:

- `src/agents/pi-embedded-helpers/images.ts` içindeki `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` içindeki `sanitizeContentBlocksImages`
- Azami görsel kenar boyutu `agents.defaults.imageMaxDimensionPx` ile yapılandırılabilir (varsayılan: `1200`).

---

## Genel kural: bozuk araç çağrıları

Hem `input` hem de `arguments` eksik olan asistan araç çağrısı blokları,
model bağlamı oluşturulmadan önce kaldırılır. Bu, kısmen kalıcı hale gelmiş
araç çağrılarından kaynaklanan sağlayıcı reddetmelerini önler (örneğin, hız sınırı hatasından sonra).

Uygulama:

- `src/agents/session-transcript-repair.ts` içindeki `sanitizeToolCallInputs`
- `src/agents/pi-embedded-runner/google.ts` içindeki `sanitizeSessionHistory` içinde uygulanır

---

## Genel kural: oturumlar arası girdi kökeni

Bir ajan `sessions_send` aracılığıyla başka bir oturuma istem gönderdiğinde (ajanlar arası yanıt/duyuru adımları dahil),
OpenClaw oluşturulan kullanıcı turunu şununla kalıcı hale getirir:

- `message.provenance.kind = "inter_session"`

Bu meta veri, transcript'e ekleme sırasında yazılır ve rolü değiştirmez
(sağlayıcı uyumluluğu için `role: "user"` olarak kalır). Transcript okuyucuları bunu,
yönlendirilmiş dahili istemleri son kullanıcı tarafından yazılmış yönergeler gibi ele almaktan kaçınmak için kullanabilir.

Bağlam yeniden oluşturma sırasında OpenClaw ayrıca bu kullanıcı turlarına bellek içinde kısa bir
`[Inter-session message]` işaretçisi ekler, böylece model bunları harici son kullanıcı yönergelerinden ayırt edebilir.

---

## Sağlayıcı matrisi (mevcut davranış)

**OpenAI / OpenAI Codex**

- Yalnızca görsel temizleme.
- OpenAI Responses/Codex transcript'leri için sahipsiz akıl yürütme imzalarını (ardından içerik bloğu gelmeyen bağımsız akıl yürütme öğeleri) kaldırır.
- Araç çağrısı kimliği temizleme yok.
- Araç sonucu eşleme onarımı yok.
- Tur doğrulaması veya yeniden sıralama yok.
- Sentetik araç sonucu yok.
- Düşünce imzası çıkarma yok.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Araç çağrısı kimliği temizleme: katı alfasayısal.
- Araç sonucu eşleme onarımı ve sentetik araç sonuçları.
- Tur doğrulaması (Gemini tarzı tur dönüşümlülüğü).
- Google tur sıralaması düzeltmesi (geçmiş asistanla başlıyorsa başa küçük bir kullanıcı önyüklemesi ekler).
- Antigravity Claude: düşünme imzalarını normalleştirir; imzasız düşünme bloklarını kaldırır.

**Anthropic / Minimax (Anthropic uyumlu)**

- Araç sonucu eşleme onarımı ve sentetik araç sonuçları.
- Tur doğrulaması (katı dönüşümlülüğü karşılamak için art arda gelen kullanıcı turlarını birleştirir).

**Mistral (model kimliği tabanlı algılama dahil)**

- Araç çağrısı kimliği temizleme: strict9 (uzunluğu 9 olan alfasayısal).

**OpenRouter Gemini**

- Düşünce imzası temizliği: base64 olmayan `thought_signature` değerlerini kaldırır (base64 olanları korur).

**Diğer her şey**

- Yalnızca görsel temizleme.

---

## Geçmiş davranış (2026.1.22 öncesi)

2026.1.22 sürümünden önce OpenClaw, transcript hijyeninin birden çok katmanını uyguluyordu:

- Her bağlam oluşturulmasında çalışan bir **transcript-sanitize extension** vardı ve şunları yapabiliyordu:
  - Araç kullanımı/sonuç eşlemesini onarmak.
  - Araç çağrısı kimliklerini temizlemek (`_`/`-` koruyan katı olmayan bir mod dahil).
- Runner ayrıca sağlayıcıya özgü temizleme de yapıyordu; bu da işi yineliyordu.
- Sağlayıcı ilkesinin dışında ek mutasyonlar gerçekleşiyordu; bunlar arasında şunlar vardı:
  - Kalıcı hale getirmeden önce asistan metninden `<final>` etiketlerini çıkarmak.
  - Boş asistan hata turlarını kaldırmak.
  - Araç çağrılarından sonra asistan içeriğini kırpmak.

Bu karmaşıklık, sağlayıcılar arası gerilemelere neden oldu (özellikle `openai-responses`
`call_id|fc_id` eşlemesi). 2026.1.22 temizliği extension'ı kaldırdı, mantığı runner içinde
merkezileştirdi ve OpenAI'yi görsel temizleme dışında **dokunulmaz** hale getirdi.
