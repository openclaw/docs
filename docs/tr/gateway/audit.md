---
read_when:
    - İçeriği depolamadan Gateway'in yaptıklarının kalıcı bir kaydına ihtiyacınız vardır
    - Mesaj yaşam döngüsü denetimini etkinleştirip etkinleştirmemeye karar veriyorsunuz
    - Denetim kayıtlarının neyi kanıtlayıp neyi kanıtlamadığını açıklamanız gerekir.
summary: Aracı çalıştırmaları, araç eylemleri ve isteğe bağlı ileti yaşam döngüleri için yalnızca meta veriden oluşan denetim geçmişi
title: Denetim geçmişi
x-i18n:
    generated_at: "2026-07-16T17:23:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1005b214a674f0f888d759837bd627be458cefcf9ed61bda722499333361dc45
    source_path: gateway/audit.md
    workflow: 16
---

# Denetim geçmişi

Gateway, paylaşılan OpenClaw durum veritabanında sınırlı, yalnızca meta veri içeren bir denetim günlüğü tutar. Bu günlük; "hangi agent çalıştı, ne zaman çalıştı ve nasıl sonuçlandı", "bir çalıştırma hangi araç eylemlerini yürüttü" ve ileti denetimi etkinleştirildiğinde "kabul edilen bir gelen ileti yönlendirmeye ulaştı mı" ve "bir giden ileti nihai teslimat durumuna ulaştı mı" gibi operasyonel soruları yanıtlar.

Günlük; kimlik, sıralama, kaynak, eylem, durum ve normalleştirilmiş sonuç kodlarını saklar. İstemleri, ileti gövdelerini, araç bağımsız değişkenlerini, araç sonuçlarını, ekleri, dosya adlarını, URL'leri, komut çıktısını veya ham hata metnini hiçbir zaman saklamaz.

## Kayıt aileleri

Denetim etkinleştirildiğinde (varsayılan) çalıştırma ve araç olayları kaydedilir. İleti yaşam döngüsü olayları isteğe bağlıdır ve varsayılan olarak devre dışıdır.

| Aile             | Eylemler                                                 | Varsayılan |
| ---------------- | -------------------------------------------------------- | ---------- |
| Agent çalıştırmaları | `agent.run.started`, `agent.run.finished`                | açık       |
| Araç eylemleri   | `tool.action.started`, `tool.action.finished`                   | açık       |
| İletiler         | `message.inbound.processed`, `message.outbound.finished`                   | kapalı     |

Her kayıt; kararlı bir olay kimliği, monoton artan bir günlük sırası, yaşam döngüsü zaman damgası, aktör, eylem, durum, `schemaVersion: 1` ve `redaction: "metadata_only"` içerir. Alanların tam başvurusu ve sorgu filtreleri için [Denetim kayıtları](/cli/audit) bölümüne bakın.

## İleti yaşam döngüsü olayları

Nelerin kaydedileceğini seçmek için [`audit.messages`](/tr/gateway/configuration-reference#audit) değerini ayarlayın, ardından Gateway'i yeniden başlatın:

- `off` (varsayılan): ileti kaydı yoktur.
- `direct`: yalnızca doğrudan görüşmelerdeki iletiler.
- `all`: doğrudan görüşme, grup ve kanal iletileri.

İleti kayıtlarını iki yetkili sınır oluşturur:

- **Gelen** satırlar, kabul edilmiş bir ileti temel yönlendirmeye ulaştığında yazılır; yinelenen ve nihai işleme sonuçları buna dahildir.
- **Giden** satırlar, paylaşılan kalıcı teslimat nihai bir sonuca ulaştığında yazılır: gönderildi, engellendi, başarısız oldu veya çökme nedeniyle belirsiz gönderimler için açık bir `unknown`. Kuyruk kurtarma ve teslim edilemeyen ileti sonuçları buna dahildir. Her özgün mantıksal yanıt yükü için bir nihai satır oluşturulur; parçalara ayırma ve bağdaştırıcı yayılımı `resultCount` içinde birleştirilir.

### Görüşme türü sınıflandırması

`direct` modu bir gizlilik sınırıdır; bu nedenle bir ileti, yalnızca hedef bilgileri bunu kanıtladığında doğrudan görüşme olarak sınıflandırılır: gönderim yolu hedef görüşme türünü bildirmiştir veya teslimat oturumu rotası, teslimatın yapıldığı kanal ile eşin tam adını belirtir. İlke durumu veya kaynak görüşme gibi daha zayıf sinyaller bir iletiyi `group` olarak sınıflandırabilir (böylece `direct` toplamına dahil edilmez), ancak hiçbir zaman `direct` olduğunu iddia edemez. Doğrudan olduğu kanıtlanamayan iletiler `unknown` olarak sınıflandırılır ve `direct` modunda kaydedilmez. Bu nedenle sohbet türlerini bildirmeyen kanallar, `direct` modunda `all` moduna kıyasla daha az satır kaydedebilir.

## Gizlilik modeli

İleti satırları ham platform tanımlayıcılarını hiçbir zaman saklamaz. Korelasyon mevcut olduğunda hesap, görüşme, ileti ve hedef tanımlayıcıları yalnızca kuruluma özel anahtarlı takma adlar (`hmac-sha256:v1:<keyId>:<digest>`) olarak dışa aktarılır:

- HMAC anahtarı ilk kullanımda oluşturulur, tanımlayıcı türüne göre etki alanları ayrılır ve günlükle aynı durum veritabanında bulunur.
- Takma adlar tek bir kurulum içinde kararlıdır; böylece aynı görüşmeyle ilgili satırlar platform tanımlayıcısını açığa çıkarmadan ilişkilendirilebilir.
- Bu, **anonimleştirme değil, korelasyondur**: durum veritabanına okuma erişimi olan herkes anahtara da sahiptir ve olası ham tanımlayıcıları takma adlarla karşılaştırarak sınayabilir. RPC ve CLI dışa aktarımları anahtarı hiçbir zaman içermez.
- İleti satırları korunurken anahtar malzemesi eksik veya bozuksa Gateway kapalı kalma yaklaşımını benimser ve korelasyonu bölecek yeni bir anahtara sessizce geçmek yerine yeni ileti kayıtlarını bırakır.

Çalıştırma ve araç kayıtları korelasyon için `sessionKey` ve `sessionId` değerlerini korur; standart oturum anahtarları platform hesabı veya eş kimliklerini kendileri içerebilir. İleti kayıtları her ikisini de kasıtlı olarak dışarıda bırakır.

Denetim dışa aktarımları, içerik olmadan bile hassas operasyonel meta verilerdir: zamanlama, kanallar, sonuçlar ve kararlı takma adlar etkinlikleri ilişkilendirebilir. Dışa aktarımları diğer operatör kayıtlarıyla aynı erişim denetimleri ve saklama uygulamalarıyla koruyun.

## Kapsam ve kanıt sınırları

Günlük azami çabaya dayalıdır ve bilinçli olarak sınırlıdır. Onu gerçekleşenlerin kanıtı olarak değil, kaydedilenlerin göstergesi olarak değerlendirin:

- **Bir satırın bulunmaması hiçbir şeyi kanıtlamaz.** Kabul öncesinde bırakılan gelen iletiler, çalışan bir Gateway kaydedicisi olmayan CLI süreçlerinden yapılan gönderimler ve paylaşılan kalıcı teslimatı atlayan Plugin'e özel veya doğrudan gönderim yolları hiçbir kayıt bırakmaz.
- Yazma işlemleri sınırlı bir arka plan çalışanından geçer; çalışan arızası veya kuyruk doygunluğu kayıtların bırakılmasına ve tek bir operasyonel uyarının günlüğe yazılmasına neden olur.
- Çökme nedeniyle belirsiz giden gönderimler, uydurma sonuçlar yerine `unknown` olarak kaydedilir.

Bu günlük hata ayıklamayı ve operasyonel incelemeyi destekler. Kayıpsız bir uyumluluk arşivi değildir; buna ihtiyacınız varsa [OpenTelemetry](/tr/gateway/opentelemetry) veya kanal düzeyi araçlar tarafından beslenen harici bir sistem kullanın.

## Depolama, saklama ve geçiş

Kayıtlar paylaşılan durum veritabanında (`state/openclaw.sqlite`) bulunur ve teslimatın kritik yolunun dışında yazılır. Sorgular 30 günden eski kayıtları hiçbir zaman döndürmez ve günlük 100.000 satırla sınırlıdır; süresi dolan satırlar başlangıçta, saatlik bakım sırasında ve sonraki yazmalarda temizlenir. Saklama bakımı, toplama devre dışı bırakıldığında bile çalışmaya devam eder.

Önceki yalnızca çalıştırma/araç günlüğüne sahip bir Gateway'den yükseltme yapılırken şema başlangıçta (veya `openclaw doctor --fix` aracılığıyla) otomatik olarak taşınır; mevcut satırlar ve günlük sıraları korunur.

## Sorgulama

- CLI: Agent, oturum, çalıştırma, tür, durum, yön, kanal, zaman sınırları ve imleçli sayfalama filtreleriyle [`openclaw audit`](/cli/audit).
- Gateway RPC: `audit.activity.list` (`operator.read` gerektirir), sürümlendirilmiş V1 etkinlik olayı birleşimini döndürür; yayımlanmış `audit.list` RPC, eski çalıştırma/araç istemcileri için değişmeden kalır. [Gateway protokolü](/tr/gateway/protocol#audit-ledger-rpc) bölümüne bakın.

## İlgili

- [Denetim kayıtları CLI'si](/cli/audit)
- [Yapılandırma başvurusu](/tr/gateway/configuration-reference#audit)
- [Gateway protokolü](/tr/gateway/protocol#audit-ledger-rpc)
- [OpenTelemetry](/tr/gateway/opentelemetry)
