---
read_when:
    - Eksik operatör kapsamı hatalarında hata ayıklama
    - Cihaz veya Node eşleştirme onaylarını inceleme
    - Gateway RPC yöntemleri ekleme veya sınıflandırma
summary: Gateway istemcileri için operatör rolleri, kapsamları ve onay zamanı kontrolleri
title: Operatör kapsamları
x-i18n:
    generated_at: "2026-05-03T08:55:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48f59f96b41333af9124ad4083ac5442eedb2d6cebdfff74e3ba256f06d36add
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operatör kapsamları, bir Gateway istemcisinin kimlik doğrulamasından sonra ne yapabileceğini tanımlar.
Bunlar, güvenilir tek bir Gateway operatör etki alanı içinde bir kontrol düzlemi koruma sınırıdır;
düşmanca çok kiracılı yalıtım değildir. Kişiler, ekipler veya makineler arasında güçlü ayrım gerekiyorsa,
ayrı OS kullanıcıları veya ana makineler altında ayrı Gateway'ler çalıştırın.

İlgili: [Güvenlik](/tr/gateway/security), [Gateway protokolü](/tr/gateway/protocol),
[Gateway eşleştirme](/tr/gateway/pairing), [Cihazlar CLI](/tr/cli/devices).

## Roller

Gateway WebSocket istemcileri tek bir rolle bağlanır:

- `operator`: CLI, Kontrol kullanıcı arayüzü, otomasyon ve güvenilir yardımcı süreçler gibi kontrol düzlemi istemcileri.
- `node`: `node.invoke` üzerinden komutları sunan macOS, iOS, Android veya başsız Node'lar gibi yetenek ana makineleri.

Operatör RPC yöntemleri `operator` rolünü gerektirir. Node kaynaklı yöntemler
`node` rolünü gerektirir.

## Kapsam düzeyleri

| Kapsam                  | Anlam                                                                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Salt okunur durum, listeler, katalog, günlükler, oturum okumaları ve diğer değiştirme yapmayan kontrol düzlemi çağrıları.                                                                |
| `operator.write`        | Mesaj gönderme, araç çağırma, konuşma/ses ayarlarını güncelleme ve Node komut aktarma gibi normal değişiklik yapan operatör eylemleri. `operator.read` kapsamını da karşılar.            |
| `operator.admin`        | Yönetimsel kontrol düzlemi erişimi. Her `operator.*` kapsamını karşılar. Yapılandırma değişikliği, güncellemeler, yerel kancalar, hassas ayrılmış ad alanları ve yüksek riskli onaylar için gereklidir. |
| `operator.pairing`      | Eşleştirme kayıtlarını veya cihaz token'larını listeleme, onaylama, reddetme, kaldırma, döndürme ve iptal etme dahil cihaz ve Node eşleştirme yönetimi.                                  |
| `operator.approvals`    | Exec ve Plugin onay API'leri.                                                                                                                                                            |
| `operator.talk.secrets` | Gizli bilgiler dahil edilmiş şekilde Talk yapılandırmasını okuma.                                                                                                                        |

Bilinmeyen gelecekteki `operator.*` kapsamları, çağıranda `operator.admin`
yoksa tam eşleşme gerektirir.

## Yöntem kapsamı yalnızca ilk kapıdır

Her Gateway RPC'sinin en az ayrıcalıklı bir yöntem kapsamı vardır. Bu yöntem kapsamı,
isteğin işleyiciye ulaşıp ulaşamayacağını belirler. Bazı işleyiciler daha sonra
onaylanan veya değiştirilen somut şeye göre daha katı onay zamanı kontrolleri uygular.

Örnekler:

- `device.pair.approve`, `operator.pairing` ile erişilebilir, ancak bir
  operatör cihazını onaylamak yalnızca çağıranın zaten sahip olduğu kapsamları oluşturabilir veya koruyabilir.
- `node.pair.approve`, `operator.pairing` ile erişilebilir, ardından bekleyen Node komut listesinden ek onay kapsamları türetir.
- `chat.send` normalde yazma kapsamlı bir yöntemdir, ancak kalıcı `/config set`
  ve `/config unset` komut düzeyinde `operator.admin` gerektirir.

Bu, daha düşük kapsamlı operatörlerin tüm eşleştirme onaylarını yalnızca yöneticiye özgü hale getirmeden
düşük riskli eşleştirme eylemlerini gerçekleştirmesine olanak tanır.

## Cihaz eşleştirme onayları

Cihaz eşleştirme kayıtları, onaylanmış rollerin ve kapsamların kalıcı kaynağıdır.
Zaten eşleştirilmiş cihazlar sessizce daha geniş erişim elde etmez: daha geniş
rol veya daha geniş kapsamlar isteyen yeniden bağlantılar yeni bir bekleyen yükseltme isteği oluşturur.

Bir cihaz isteğini onaylarken:

- Operatör rolü olmayan bir istek, operatör token kapsamı onayına ihtiyaç duymaz.
- `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` veya `operator.talk.secrets` isteği, çağıranın
  bu kapsamlara ya da `operator.admin` kapsamına sahip olmasını gerektirir.
- `operator.admin` isteği `operator.admin` gerektirir.
- Açık kapsamları olmayan bir onarım isteği, mevcut operatör token kapsamlarını devralabilir.
  Mevcut token yönetici kapsamlıysa onay yine de `operator.admin` gerektirir.

Eşleştirilmiş cihaz token oturumları için yönetim, çağıranda ayrıca
`operator.admin` olmadığı sürece kendi kapsamındadır: yönetici olmayan çağıranlar
yalnızca kendi cihaz girişlerini döndürebilir, iptal edebilir veya kaldırabilir.

## Node eşleştirme onayları

Eski `node.pair.*`, Gateway'e ait ayrı bir Node eşleştirme deposu kullanır. WS Node'ları
`role: node` ile cihaz eşleştirmeyi kullanır, ancak aynı onay düzeyi sözlüğü
geçerlidir.

`node.pair.approve`, ek gerekli kapsamları türetmek için bekleyen istek komut listesini kullanır:

- Komutsuz istek: `operator.pairing`
- Exec olmayan Node komutları: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which`:
  `operator.pairing` + `operator.admin`

Node eşleştirme kimlik ve güven tesis eder. Node'un kendi
`system.run` exec onay politikasının yerini almaz.

## Paylaşılan gizli bilgi kimlik doğrulaması

Paylaşılan Gateway token/parola kimlik doğrulaması, o Gateway için güvenilir operatör erişimi olarak ele alınır.
OpenAI uyumlu HTTP yüzeyleri ve `/tools/invoke`, çağıran daha dar bildirilmiş kapsamlar gönderse bile
paylaşılan gizli bilgi bearer kimlik doğrulaması için normal tam operatör varsayılan kapsam kümesini geri yükler.

Güvenilir proxy kimlik doğrulaması veya özel giriş `none` gibi kimlik taşıyan modlar,
açıkça bildirilmiş kapsamlara yine de uyabilir. Gerçek güven sınırı ayrımı için ayrı Gateway'ler kullanın.
