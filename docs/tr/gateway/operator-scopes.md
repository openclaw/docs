---
read_when:
    - Eksik operatör kapsamı hatalarında hata ayıklama
    - Cihaz veya Node eşleştirme onaylarını gözden geçirme
    - Gateway RPC yöntemleri ekleme veya sınıflandırma
summary: Gateway istemcileri için operatör rolleri, kapsamları ve onay sırasında yapılan kontroller
title: Operatör kapsamları
x-i18n:
    generated_at: "2026-05-04T07:06:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: f05d6bdbf9bdad2aef1c9664bb7ebb4b6241334b8aefac7993104e9977e40450
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operatör kapsamları, bir Gateway istemcisinin kimlik doğrulamasından sonra neler yapabileceğini tanımlar.
Bunlar tek bir güvenilir Gateway operatör alanı içinde bir kontrol düzlemi koruma sınırıdır,
düşmanca çok kiracılı yalıtım değildir. Kişiler, ekipler veya makineler arasında güçlü ayrım gerekiyorsa,
ayrı OS kullanıcıları ya da ana makineler altında ayrı Gateway'ler çalıştırın.

İlgili: [Güvenlik](/tr/gateway/security), [Gateway protokolü](/tr/gateway/protocol),
[Gateway eşleştirme](/tr/gateway/pairing), [Cihazlar CLI](/tr/cli/devices).

## Roller

Gateway WebSocket istemcileri tek bir rolle bağlanır:

- `operator`: CLI, Control UI, otomasyon ve güvenilir yardımcı süreçler gibi kontrol düzlemi istemcileri.
- `node`: macOS, iOS, Android gibi yetenek ana makineleri veya
  komutları `node.invoke` üzerinden sunan başsız node'lar.

Operatör RPC yöntemleri `operator` rolünü gerektirir. Node kaynaklı yöntemler
`node` rolünü gerektirir.

## Kapsam düzeyleri

| Kapsam                  | Anlam                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Salt okunur durum, listeler, katalog, günlükler, oturum okumaları ve diğer değişiklik yapmayan kontrol düzlemi çağrıları.                                                                  |
| `operator.write`        | Mesaj gönderme, araç çağırma, konuşma/ses ayarlarını güncelleme ve node komut aktarma gibi normal değişiklik yapan operatör eylemleri. `operator.read` kapsamını da karşılar.              |
| `operator.admin`        | Yönetimsel kontrol düzlemi erişimi. Her `operator.*` kapsamını karşılar. Yapılandırma değişikliği, güncellemeler, yerel hook'lar, hassas ayrılmış ad alanları ve yüksek riskli onaylar için gereklidir. |
| `operator.pairing`      | Eşleştirme kayıtlarını veya cihaz token'larını listeleme, onaylama, reddetme, kaldırma, döndürme ve iptal etme dahil cihaz ve node eşleştirme yönetimi.                                    |
| `operator.approvals`    | Exec ve Plugin onay API'leri.                                                                                                                                                              |
| `operator.talk.secrets` | Gizli anahtarlar dahil edilerek Talk yapılandırmasını okuma.                                                                                                                                |

Bilinmeyen gelecekteki `operator.*` kapsamları, çağıranın `operator.admin` kapsamı yoksa
tam eşleşme gerektirir.

## Yöntem kapsamı yalnızca ilk kapıdır

Her Gateway RPC'sinin en düşük ayrıcalıklı bir yöntem kapsamı vardır. Bu yöntem kapsamı,
isteğin işleyiciye ulaşıp ulaşamayacağını belirler. Bazı işleyiciler daha sonra onaylanan
veya değiştirilen somut şeye göre daha sıkı onay zamanı denetimleri uygular.

Örnekler:

- `device.pair.approve` öğesine `operator.pairing` ile erişilebilir, ancak bir
  operatör cihazını onaylamak yalnızca çağıranın zaten sahip olduğu kapsamları oluşturabilir veya koruyabilir.
- `node.pair.approve` öğesine `operator.pairing` ile erişilebilir, ardından bekleyen
  node komut listesinden ek onay kapsamları türetir.
- `chat.send` normalde yazma kapsamlı bir yöntemdir, ancak kalıcı `/config set`
  ve `/config unset` komut düzeyinde `operator.admin` gerektirir.

Bu, daha düşük kapsama sahip operatörlerin tüm eşleştirme onaylarını yalnızca admin'e
özel hale getirmeden düşük riskli eşleştirme eylemleri gerçekleştirmesine olanak tanır.

## Cihaz eşleştirme onayları

Cihaz eşleştirme kayıtları, onaylanmış rollerin ve kapsamların kalıcı kaynağıdır.
Zaten eşleştirilmiş cihazlar sessizce daha geniş erişim elde etmez: daha geniş
bir rol veya daha geniş kapsamlar isteyen yeniden bağlantılar yeni bir bekleyen yükseltme isteği oluşturur.

Bir cihaz isteğini onaylarken:

- Operatör rolü olmayan bir istek, operatör token kapsamı onayı gerektirmez.
- `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` veya `operator.talk.secrets` için bir istek,
  çağıranın bu kapsamları ya da `operator.admin` kapsamını taşımasını gerektirir.
- `operator.admin` için bir istek `operator.admin` gerektirir.
- Açık kapsamı olmayan bir onarım isteği, mevcut operatör
  token kapsamlarını devralabilir. Mevcut token admin kapsamlıysa, onay yine de
  `operator.admin` gerektirir.

Eşleştirilmiş cihaz token oturumları için, çağıranın ayrıca `operator.admin` kapsamı yoksa
yönetim kendi kapsamıyla sınırlıdır: admin olmayan çağıranlar yalnızca kendi eşleştirme kayıtlarını görür,
yalnızca kendi bekleyen isteklerini onaylayabilir veya reddedebilir ve yalnızca
kendi cihaz kayıtlarını döndürebilir, iptal edebilir veya kaldırabilir.

## Node eşleştirme onayları

Eski `node.pair.*`, ayrı bir Gateway sahipli node eşleştirme deposu kullanır. WS node'ları
`role: node` ile cihaz eşleştirmesi kullanır, ancak aynı onay düzeyi söz varlığı
geçerlidir.

`node.pair.approve`, ek gerekli kapsamları türetmek için bekleyen istek komut listesini kullanır:

- Komutsuz istek: `operator.pairing`
- Exec olmayan node komutları: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` veya `system.which`:
  `operator.pairing` + `operator.admin`

Node eşleştirme kimlik ve güven tesis eder. Node'un kendi
`system.run` exec onay politikasının yerini almaz.

## Paylaşılan gizli anahtar kimlik doğrulaması

Paylaşılan Gateway token/parola kimlik doğrulaması, o Gateway için güvenilir operatör erişimi olarak ele alınır.
OpenAI uyumlu HTTP yüzeyleri ve `/tools/invoke`, çağıran daha dar bildirilmiş kapsamlar gönderse bile
paylaşılan gizli anahtar bearer kimlik doğrulaması için normal tam operatör varsayılan kapsam kümesini geri yükler.

Güvenilir proxy kimlik doğrulaması veya private-ingress `none` gibi kimlik taşıyan modlar,
açık bildirilmiş kapsamları yine de dikkate alabilir. Gerçek güven sınırı ayrımı için ayrı Gateway'ler kullanın.
