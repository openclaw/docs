---
read_when:
    - Eksik operatör kapsamı hatalarında hata ayıklama
    - Cihaz veya Node eşleştirme onaylarını inceleme
    - Gateway RPC yöntemlerini ekleme veya sınıflandırma
summary: Gateway istemcileri için operatör rolleri, kapsamları ve onay sırasındaki kontroller
title: Operatör kapsamları
x-i18n:
    generated_at: "2026-07-16T17:26:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e74cdd87d21a9e0eafea6b7e4b18ab2e5b74e6c570603b1d4ad4dff83c65619
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operatör kapsamları, bir Gateway istemcisinin kimlik doğrulamasından sonra neler yapabileceğini sınırlar.
Bunlar, güvenilen tek bir Gateway operatör etki alanı içindeki kontrol düzlemi korumasıdır;
kötü niyetli çok kiracılı ortam yalıtımı değildir. Kişiler, ekipler veya makineler arasında
güçlü ayrım sağlamak için farklı işletim sistemi kullanıcıları ya da ana makineler altında ayrı Gateway'ler çalıştırın.

İlgili: [Güvenlik](/tr/gateway/security), [Gateway protokolü](/tr/gateway/protocol),
[Gateway eşleştirmesi](/tr/gateway/pairing), [Cihazlar CLI'si](/tr/cli/devices).

## Roller

Her Gateway WebSocket istemcisi tek bir rolle bağlanır:

- `operator`: CLI, Control UI, otomasyon ve
  güvenilen yardımcı süreçler gibi kontrol düzlemi istemcileri.
- `node`: komutları `node.invoke` aracılığıyla sunan
  yetenek ana makineleri (macOS, iOS, Android, başsız sistemler).

Operatör RPC yöntemleri `operator` rolünü; node kaynaklı yöntemler
`node` rolünü gerektirir.

## Kapsam düzeyleri

| Kapsam                  | Anlamı                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Salt okunur durum, listeler, katalog, günlükler, oturum okumaları ve değişiklik yapmayan diğer çağrılar.                                                       |
| `operator.write`        | Değişiklik yapan operatör eylemleri: mesaj gönderme, araç çağırma, konuşma/ses ayarlarını güncelleme, node komutu aktarma. `operator.read` kapsamını da karşılar. |
| `operator.admin`        | Yönetici erişimi. Her `operator.*` kapsamını karşılar. Yapılandırma değişikliği, güncellemeler, yerel kancalar, ayrılmış ad alanları ve yüksek riskli onaylar için gereklidir. |
| `operator.pairing`      | Cihaz ve node eşleştirme yönetimi: listeleme, onaylama, reddetme, kaldırma, yenileme, iptal etme.                                                               |
| `operator.approvals`    | Yürütme ve plugin onay API'leri.                                                                                                                               |
| `operator.talk.secrets` | Gizli bilgiler dâhil olmak üzere Talk yapılandırmasını okuma.                                                                                                  |

Gelecekteki bilinmeyen `operator.*` kapsamları, çağıran zaten
`operator.admin` kapsamına sahip değilse tam eşleşme gerektirir.

## Yöntem kapsamı yalnızca ilk denetimdir

Her Gateway RPC'si, bir isteğin işleyicisine ulaşıp ulaşmayacağını belirleyen
en az ayrıcalıklı bir yöntem kapsamına sahiptir. Bazı işleyiciler daha sonra
onaylanan veya değiştirilen somut şeye göre daha sıkı denetimler uygular:

- `device.pair.approve`, `operator.pairing` ile erişilebilirdir; ancak bir
  operatör cihazı onaylanırken yalnızca çağıranın zaten sahip olduğu kapsamlar oluşturulabilir veya korunabilir.
- `node.pair.approve`, `operator.pairing` ile erişilebilirdir; ardından bekleyen
  node'un bildirdiği komut listesinden ek onay kapsamları türetir.
- `chat.send` yazma kapsamlı bir yöntemdir; ancak `/config set` ve
  `/config unset` sohbet komutları, çağıranın sohbet gönderme kapsamından bağımsız olarak
  buna ek olarak `operator.admin` gerektirir.

Bu sayede daha düşük kapsamlı operatörler, tüm eşleştirme onaylarını yalnızca
yöneticilere özel hâle getirmeden düşük riskli eşleştirme eylemleri gerçekleştirebilir.

## Cihaz eşleştirme onayları

Cihaz eşleştirme kayıtları, onaylanan rollerin ve kapsamların kalıcı kaynağıdır.
Önceden eşleştirilmiş bir cihaz sessizce daha geniş erişim elde etmez: daha geniş
bir rol veya daha geniş kapsamlar isteyen yeniden bağlantı, bekleyen yeni bir
yükseltme isteği oluşturur.

Bir cihaz isteğini onaylama:

- Operatör rolü olmayan bir istek, operatör kapsamı onayı gerektirmez.
- Operatör dışı bir cihaz rolü isteği (örneğin `node`),
  `device.pair.approve` yalnızca `operator.pairing` gerektirse bile
  `operator.admin` gerektirir.
- `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` veya `operator.talk.secrets` isteği, çağıranın ilgili kapsama
  ya da `operator.admin` kapsamına zaten sahip olmasını gerektirir.
- `operator.admin` isteği, `operator.admin` gerektirir.
- Açık kapsamları olmayan bir onarım isteği, mevcut operatör
  token'ının kapsamlarını devralabilir; bu token yönetici kapsamlıysa onay yine de
  `operator.admin` gerektirir.

Yönetici olmayan paylaşılan gizli bilgi ve güvenilen proxy oturumları,
operatör cihazı isteklerini yalnızca kendi bildirdikleri operatör kapsamları
dâhilinde onaylayabilir; bu oturumlar normalde `operator.pairing`
kullanabilse bile operatör dışı rolleri yalnızca yöneticiler onaylayabilir.

Eşleştirilmiş cihaz token'ı oturumlarında, çağıran `operator.admin` kapsamına
sahip değilse yönetim kendi kapsamıyla sınırlıdır: yönetici olmayan bir çağıran
yalnızca kendi eşleştirme girdilerini görür ve yalnızca kendi cihaz girdisini
onaylayabilir, reddedebilir, yenileyebilir, iptal edebilir veya kaldırabilir.

## Node eşleştirme onayları

Eski `node.pair.*` yöntemleri, Gateway'in sahip olduğu ayrı bir node eşleştirme deposu kullanır.
WS node'ları bunun yerine cihaz eşleştirmesini (`role: node`) kullanır; ancak aynı onay
terminolojisi geçerlidir. İki deponun ilişkisi için [Gateway eşleştirmesi](/tr/gateway/pairing) bölümüne bakın.

`node.pair.approve`, bekleyen isteğin komut listesinden gerekli ek kapsamları türetir:

| Bildirilen komutlar                                                                                                  | Gerekli kapsamlar                      |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| yok                                                                                                                  | `operator.pairing`                    |
| sıradan node komutları                                                                                               | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` veya `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

Bir node bildirimini onaylamak, ayrı bir çalışma zamanı izin listesi denetimi olan
komutları etkinleştirmez. Örneğin `computer.act` bildiren bir node'u onaylamak,
eşleştirme ile yazma kapsamı gerektirir; ancak yalnızca yüzeyi kaydeder.
Bir yönetici veya sahip yine de `computer.act` öğesini etkinleştirmelidir. Etkin
kaldığı sürece yazma kapsamlı `node.invoke` yöntemi üzerinden çağrılması,
her eylem için yönetici kapsamı gerektirmez.

Node eşleştirmesi kimlik ve güven oluşturur; node'un kendi
`system.run` yürütme onayı politikasının yerini almaz.

## Paylaşılan gizli bilgiyle kimlik doğrulama

Paylaşılan Gateway token'ı/parolasıyla kimlik doğrulama, ilgili Gateway için
güvenilen operatör erişimi olarak değerlendirilir. OpenAI uyumlu HTTP yüzeyleri,
`/tools/invoke` ve HTTP oturum geçmişi uç noktaları, çağıran daha dar bildirilmiş
kapsamlar gönderse bile paylaşılan gizli bilgi taşıyıcılı kimlik doğrulama için
tam varsayılan operatör kapsamı kümesini geri yükler.

Güvenilen proxy ile kimlik doğrulama veya özel giriş `none` gibi
kimlik taşıyan modlar, açıkça bildirilen kapsamları yine de uygulayabilir.
Gerçek güven sınırı ayrımı için ayrı Gateway'ler kullanın.
