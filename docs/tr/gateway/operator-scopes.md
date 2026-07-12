---
read_when:
    - Eksik operatör kapsamı hatalarında hata ayıklama
    - Cihaz veya Node eşleştirme onaylarını inceleme
    - Gateway RPC yöntemlerini ekleme veya sınıflandırma
summary: Gateway istemcileri için operatör rolleri, kapsamları ve onay zamanı denetimleri
title: Operatör kapsamları
x-i18n:
    generated_at: "2026-07-12T11:46:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operatör kapsamları, bir Gateway istemcisinin kimlik doğrulamasından sonra neler yapabileceğini sınırlar.
Bunlar, güvenilen tek bir Gateway operatör etki alanı içindeki bir kontrol düzlemi güvenlik sınırıdır;
kötü niyetli çok kiracılı ortam yalıtımı değildir. Kişiler, ekipler veya makineler arasında güçlü bir
ayrım sağlamak için ayrı işletim sistemi kullanıcıları ya da ana makineler altında ayrı Gateway'ler çalıştırın.

İlgili: [Güvenlik](/tr/gateway/security), [Gateway protokolü](/tr/gateway/protocol),
[Gateway eşleştirme](/tr/gateway/pairing), [Cihazlar CLI'si](/tr/cli/devices).

## Roller

Her Gateway WebSocket istemcisi tek bir rolle bağlanır:

- `operator`: CLI, Kontrol Arayüzü, otomasyon ve güvenilen yardımcı işlemler gibi
  kontrol düzlemi istemcileri.
- `node`: komutları `node.invoke` aracılığıyla sunan yetenek ana makineleri
  (macOS, iOS, Android, başsız sistemler).

Operatör RPC yöntemleri `operator` rolünü, Node kaynaklı yöntemler ise
`node` rolünü gerektirir.

## Kapsam düzeyleri

| Kapsam                  | Anlamı                                                                                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Salt okunur durum, listeler, katalog, günlükler, oturum okumaları ve durum değişikliğine yol açmayan diğer çağrılar.                                                                       |
| `operator.write`        | Durum değiştiren operatör eylemleri: mesaj gönderme, araç çağırma, konuşma/ses ayarlarını güncelleme, Node komutu aktarma. `operator.read` gereksinimini de karşılar.                       |
| `operator.admin`        | Yönetim erişimi. Tüm `operator.*` kapsamlarının gereksinimini karşılar. Yapılandırma değişiklikleri, güncellemeler, yerel kancalar, ayrılmış ad alanları ve yüksek riskli onaylar için gerekir. |
| `operator.pairing`      | Cihaz ve Node eşleştirme yönetimi: listeleme, onaylama, reddetme, kaldırma, yenileme, iptal etme.                                                                                           |
| `operator.approvals`    | Çalıştırma ve Plugin onay API'leri.                                                                                                                                                        |
| `operator.talk.secrets` | Gizli bilgiler dâhil olmak üzere Konuşma yapılandırmasını okuma.                                                                                                                           |

Gelecekte eklenecek bilinmeyen `operator.*` kapsamları, çağıran zaten
`operator.admin` kapsamına sahip değilse tam eşleşme gerektirir.

## Yöntem kapsamı yalnızca ilk denetimdir

Her Gateway RPC'si, bir isteğin işleyicisine ulaşıp ulaşmayacağını belirleyen
en düşük ayrıcalıklı bir yöntem kapsamına sahiptir. Bazı işleyiciler daha sonra
onaylanan veya değiştirilen somut öğeye göre daha sıkı denetimler uygular:

- `device.pair.approve`, `operator.pairing` ile erişilebilirdir; ancak bir
  operatör cihazı onaylanırken yalnızca çağıranın zaten sahip olduğu kapsamlar
  oluşturulabilir veya korunabilir.
- `node.pair.approve`, `operator.pairing` ile erişilebilirdir ve ardından bekleyen
  Node'un bildirdiği komut listesinden ek onay kapsamları türetir.
- `chat.send`, yazma kapsamlı bir yöntemdir; ancak `/config set` ve
  `/config unset` sohbet komutları, çağıranın sohbet gönderme kapsamından bağımsız
  olarak buna ek olarak `operator.admin` gerektirir.

Bu, daha düşük kapsamlı operatörlerin tüm eşleştirme onaylarını yalnızca yöneticilere
özel hâle getirmeden düşük riskli eşleştirme eylemleri gerçekleştirmesini sağlar.

## Cihaz eşleştirme onayları

Cihaz eşleştirme kayıtları, onaylanmış rollerin ve kapsamların kalıcı kaynağıdır.
Zaten eşleştirilmiş bir cihaz sessizce daha geniş erişim elde etmez: daha geniş
bir rol veya kapsamlar isteyen yeniden bağlantı, bekleyen yeni bir yükseltme isteği
oluşturur.

Bir cihaz isteğini onaylama:

- Operatör rolü içermeyen bir istek, operatör kapsamı onayı gerektirmez.
- Operatör olmayan bir cihaz rolü (örneğin `node`) isteyen bir istek,
  `device.pair.approve` yönteminin kendisi yalnızca `operator.pairing` gerektirse de
  `operator.admin` gerektirir.
- `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` veya `operator.talk.secrets` isteyen bir istek, çağıranın
  bu kapsama ya da `operator.admin` kapsamına zaten sahip olmasını gerektirir.
- `operator.admin` isteyen bir istek, `operator.admin` gerektirir.
- Açık kapsamlar içermeyen bir onarım isteği, mevcut operatör belirtecinin
  kapsamlarını devralabilir; bu belirteç yönetici kapsamlıysa onay yine de
  `operator.admin` gerektirir.

Yönetici olmayan paylaşılan gizli bilgi ve güvenilen proxy oturumları, yalnızca
kendi bildirdikleri operatör kapsamları dâhilindeki operatör cihazı isteklerini
onaylayabilir; bu oturumlar başka durumlarda `operator.pairing` kullanabilse bile,
operatör olmayan rolleri yalnızca yöneticiler onaylayabilir.

Eşleştirilmiş cihaz belirteci oturumlarında, çağıran `operator.admin` kapsamına
sahip değilse yönetim kendi cihazıyla sınırlıdır: yönetici olmayan bir çağıran
yalnızca kendi eşleştirme kayıtlarını görür ve yalnızca kendi cihaz kaydını
onaylayabilir, reddedebilir, yenileyebilir, iptal edebilir veya kaldırabilir.

## Node eşleştirme onayları

Eski `node.pair.*` yöntemleri, Gateway'in sahip olduğu ayrı bir Node eşleştirme
deposunu kullanır. WS Node'ları bunun yerine cihaz eşleştirmeyi (`role: node`)
kullanır; ancak aynı onay terminolojisi geçerlidir. İki deponun ilişkisi için
[Gateway eşleştirme](/tr/gateway/pairing) bölümüne bakın.

`node.pair.approve`, bekleyen isteğin komut listesinden gerekli ek kapsamları
türetir:

| Bildirilen komutlar                                    | Gerekli kapsamlar                      |
| ------------------------------------------------------ | -------------------------------------- |
| yok                                                    | `operator.pairing`                     |
| çalıştırma dışı Node komutları                         | `operator.pairing` + `operator.write`  |
| `system.run`, `system.run.prepare` veya `system.which` | `operator.pairing` + `operator.admin`  |

Bir Node bildirimini onaylamak, ayrı bir çalışma zamanı izin listesi denetimine
sahip komutları etkinleştirmez. Örneğin, `computer.act` bildiren bir Node'u
onaylamak eşleştirme ve yazma kapsamı gerektirir, ancak yalnızca yüzeyi kaydeder.
Bir yönetici veya sahip yine de `computer.act` özelliğini etkinleştirmelidir.
Etkin kaldığı sürece, yazma kapsamlı `node.invoke` yöntemi aracılığıyla çağrılması
her eylem için yönetici kapsamı gerektirmez.

Node eşleştirme, kimlik ve güven oluşturur; Node'un kendi `system.run` çalıştırma
onayı politikasının yerini almaz.

## Paylaşılan gizli bilgiyle kimlik doğrulama

Paylaşılan Gateway belirteci/parolasıyla kimlik doğrulama, ilgili Gateway için
güvenilen operatör erişimi olarak değerlendirilir. OpenAI uyumlu HTTP yüzeyleri,
`/tools/invoke` ve HTTP oturum geçmişi uç noktaları, çağıran daha dar kapsamlar
bildirse bile paylaşılan gizli bilgi taşıyıcı kimlik doğrulaması için varsayılan
operatör kapsamlarının tamamını geri yükler.

Güvenilen proxy kimlik doğrulaması veya özel giriş `none` modu gibi kimlik taşıyan
modlar, açıkça bildirilen kapsamları yine de dikkate alabilir. Gerçek güven sınırı
ayrımı için ayrı Gateway'ler kullanın.
