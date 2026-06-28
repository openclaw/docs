---
read_when:
    - Eksik operatör kapsamı hatalarında hata ayıklama
    - Cihaz veya Node eşleştirme onaylarını gözden geçirme
    - Gateway RPC yöntemleri ekleme veya sınıflandırma
summary: Gateway istemcileri için operatör rolleri, kapsamları ve onay anı denetimleri
title: Operatör kapsamları
x-i18n:
    generated_at: "2026-06-28T00:37:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc59453ae1a73b52276185de2cedd1ed4da027111168eda8107d6ba0b74aec2f
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operatör kapsamları, bir Gateway istemcisinin kimlik doğrulamasından sonra neler yapabileceğini tanımlar.
Bunlar, güvenilen tek bir Gateway operatör alanı içinde yer alan bir kontrol düzlemi güvenlik bariyeridir;
hasmane çok kiracılı yalıtım değildir. Kişiler, ekipler veya makineler arasında güçlü ayrım gerekiyorsa,
ayrı OS kullanıcıları veya ana bilgisayarlar altında ayrı Gateway'ler çalıştırın.

İlgili: [Güvenlik](/tr/gateway/security), [Gateway protokolü](/tr/gateway/protocol),
[Gateway eşleştirme](/tr/gateway/pairing), [Cihazlar CLI](/tr/cli/devices).

## Roller

Gateway WebSocket istemcileri tek bir rolle bağlanır:

- `operator`: CLI, Control UI, otomasyon ve güvenilen yardımcı süreçler gibi kontrol düzlemi istemcileri.
- `node`: `node.invoke` üzerinden komutları sunan macOS, iOS, Android veya başsız düğümler gibi yetenek ana bilgisayarları.

Operatör RPC yöntemleri `operator` rolünü gerektirir. Node kaynaklı yöntemler
`node` rolünü gerektirir.

## Kapsam düzeyleri

| Kapsam                  | Anlam                                                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Salt okunur durum, listeler, katalog, günlükler, oturum okumaları ve diğer değişiklik yapmayan kontrol düzlemi çağrıları.                                                            |
| `operator.write`        | Mesaj gönderme, araçları çağırma, konuşma/ses ayarlarını güncelleme ve düğüm komut aktarma gibi normal değişiklik yapan operatör eylemleri. Ayrıca `operator.read` kapsamını karşılar. |
| `operator.admin`        | Yönetimsel kontrol düzlemi erişimi. Her `operator.*` kapsamını karşılar. Yapılandırma değişikliği, güncellemeler, yerel kancalar, hassas ayrılmış ad alanları ve yüksek riskli onaylar için gereklidir. |
| `operator.pairing`      | Eşleştirme kayıtlarını veya cihaz belirteçlerini listeleme, onaylama, reddetme, kaldırma, döndürme ve iptal etmeyi içeren cihaz ve düğüm eşleştirme yönetimi.                        |
| `operator.approvals`    | Exec ve Plugin onay API'leri.                                                                                                                                                         |
| `operator.talk.secrets` | Gizli bilgiler dahil edilerek Talk yapılandırmasını okuma.                                                                                                                            |

Bilinmeyen gelecekteki `operator.*` kapsamları, çağıranda `operator.admin` yoksa
tam eşleşme gerektirir.

## Yöntem kapsamı yalnızca ilk kapıdır

Her Gateway RPC'sinin en düşük ayrıcalıklı bir yöntem kapsamı vardır. Bu yöntem kapsamı,
isteğin işleyiciye ulaşıp ulaşamayacağına karar verir. Bazı işleyiciler daha sonra
onaylanan veya değiştirilen somut şeye göre daha sıkı onay zamanı kontrolleri uygular.

Örnekler:

- `device.pair.approve`, `operator.pairing` ile erişilebilir, ancak bir
  operatör cihazını onaylamak yalnızca çağıranın zaten sahip olduğu kapsamları oluşturabilir veya koruyabilir.
- `node.pair.approve`, `operator.pairing` ile erişilebilir, ardından bekleyen düğüm komut listesinden ek
  onay kapsamları türetir.
- `chat.send` normalde yazma kapsamlı bir yöntemdir, ancak kalıcı `/config set`
  ve `/config unset` komut düzeyinde `operator.admin` gerektirir.

Bu, daha düşük kapsama sahip operatörlerin tüm eşleştirme onaylarını yalnızca yöneticiye özel yapmadan
düşük riskli eşleştirme eylemlerini gerçekleştirebilmesini sağlar.

## Cihaz eşleştirme onayları

Cihaz eşleştirme kayıtları, onaylanmış rollerin ve kapsamların kalıcı kaynağıdır.
Zaten eşleştirilmiş cihazlar sessizce daha geniş erişim almaz: daha geniş rol
veya daha geniş kapsamlar isteyen yeniden bağlantılar yeni bir bekleyen yükseltme isteği oluşturur.

Bir cihaz isteğini onaylarken:

- Operatör rolü olmayan bir istek, operatör belirteci kapsamı onayı gerektirmez.
- `node` gibi operatör olmayan bir cihaz rolü isteği,
  `device.pair.approve` `operator.pairing` ile erişilebilir olsa bile
  `operator.admin` gerektirir.
- `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` veya `operator.talk.secrets` isteği, çağıranın
  bu kapsamlara ya da `operator.admin` kapsamına sahip olmasını gerektirir.
- `operator.admin` isteği `operator.admin` gerektirir.
- Açık kapsamları olmayan bir onarım isteği mevcut operatör
  belirteci kapsamlarını devralabilir. Mevcut belirteç yönetici kapsamındaysa onay yine
  `operator.admin` gerektirir.

Yönetici olmayan paylaşılan gizli bilgi ve güvenilen proxy oturumları, operatör cihazı
isteklerini yalnızca kendi beyan edilmiş operatör kapsamları içinde onaylayabilir. Bu oturumlar başka şekilde
`operator.pairing` kullanabilse bile operatör olmayan
rolleri onaylamak yalnızca yöneticilere özeldir.

Eşleştirilmiş cihaz belirteci oturumları için, çağıranda
`operator.admin` yoksa yönetim de kendi kapsamıyla sınırlıdır: yönetici olmayan çağıranlar yalnızca kendi eşleştirme
girdilerini görür, yalnızca kendi bekleyen isteklerini onaylayabilir veya reddedebilir ve yalnızca kendi cihaz girdilerini döndürebilir,
iptal edebilir veya kaldırabilir.

## Node eşleştirme onayları

Eski `node.pair.*`, Gateway'in sahip olduğu ayrı bir düğüm eşleştirme deposu kullanır. WS düğümleri
`role: node` ile cihaz eşleştirmeyi kullanır, ancak aynı onay düzeyi sözlüğü
geçerlidir.

`node.pair.approve`, ek gerekli kapsamları türetmek için bekleyen istek komut listesini kullanır:

- Komutsuz istek: `operator.pairing`
- Exec olmayan düğüm komutları: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which`:
  `operator.pairing` + `operator.admin`

Düğüm eşleştirme kimlik ve güven tesis eder. Düğümün kendi
`system.run` exec onay politikasının yerini almaz.

## Paylaşılan gizli bilgi kimlik doğrulaması

Paylaşılan gateway belirteci/parola kimlik doğrulaması, o Gateway için güvenilen operatör erişimi olarak değerlendirilir.
OpenAI uyumlu HTTP yüzeyleri, `/tools/invoke` ve HTTP oturum geçmişi
uç noktaları, çağıran daha dar beyan edilmiş kapsamlar gönderse bile paylaşılan gizli bilgi bearer kimlik doğrulaması için
normal tam operatör varsayılan kapsam kümesini geri yükler.

Güvenilen proxy kimlik doğrulaması veya özel giriş `none` gibi kimlik taşıyan modlar,
açıkça beyan edilmiş kapsamları yine de dikkate alabilir. Gerçek güven
sınırı ayrımı için ayrı Gateway'ler kullanın.
