---
read_when:
    - OpenClaw ile konuşan harici bir uygulama, betik, pano, CI işi veya IDE uzantısı oluşturuyorsunuz
    - Gateway RPC ile Plugin SDK arasında seçim yapıyorsunuz
    - Gateway ajan çalıştırmaları, oturumları, olayları, onayları, modelleri veya araçlarıyla entegrasyon yapıyorsunuz
sidebarTitle: External apps
summary: Harici uygulamalar, betikler, panolar, CI işleri ve IDE uzantıları için mevcut entegrasyon yolu
title: Harici uygulamalar için Gateway entegrasyonları
x-i18n:
    generated_at: "2026-06-28T00:34:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69a1bee50620326e68d40c821d36c0e321fced755a2b3904d77e55624117cbff
    source_path: gateway/external-apps.md
    workflow: 16
---

Harici uygulamalar bugün OpenClaw ile Gateway protokolü üzerinden konuşmalıdır. Bir betik, pano, CI işi, IDE eklentisi veya başka bir süreç ajan çalıştırmaları başlatmak, olayları akış olarak almak, sonuçları beklemek, işi iptal etmek veya Gateway kaynaklarını incelemek istediğinde Gateway WebSocket ve RPC yöntemlerini kullanın.

<Warning>
  Henüz herkese açık bir npm istemci paketi yoktur. Sürüm notları yayımlanmış
  bir paketi duyurana ve bu sayfa kurulum talimatlarını içerene kadar OpenClaw
  istemci paketi adlarını uygulama bağımlılıkları olarak eklemeyin.
</Warning>

<Note>
  Bu sayfa OpenClaw sürecinin dışındaki kodlar içindir. OpenClaw içinde çalışan
  Plugin kodu bunun yerine belgelenmiş `openclaw/plugin-sdk/*` alt yollarını kullanmalıdır.
</Note>

## Bugün neler mevcut

| Yüzey                                  | Durum | Ne için kullanılır                                                                            |
| -------------------------------------- | ----- | --------------------------------------------------------------------------------------------- |
| [Gateway protokolü](/tr/gateway/protocol) | Hazır | WebSocket taşıması, bağlantı el sıkışması, yetki kapsamları, protokol sürümleme ve olaylar.   |
| [Gateway RPC başvurusu](/tr/reference/rpc) | Hazır | Ajanlar, oturumlar, görevler, modeller, araçlar, yapıtlar ve onaylar için mevcut Gateway yöntemleri. |
| [`openclaw agent`](/tr/cli/agent)         | Hazır | CLI'ya kabuk üzerinden çıkmanın yeterli olduğu tek seferlik betik entegrasyonu.               |
| [`openclaw message`](/tr/cli/message)     | Hazır | Betiklerden ileti veya kanal eylemleri gönderme.                                              |

Kaynak ağacı, gelecekteki bir istemci kitaplığı için dahili paket çalışmaları içerir, ancak
bu herkese açık bir kurulum yüzeyi değildir. Paketler yayımlanıp sürümlenene kadar
bunu önizleme uygulama ayrıntısı olarak değerlendirin.

## Önerilen yol

1. Bir Gateway çalıştırın veya keşfedin.
2. [Gateway protokolü](/tr/gateway/protocol) üzerinden bağlanın.
3. [Gateway RPC başvurusu](/tr/reference/rpc) içindeki belgelenmiş RPC yöntemlerini çağırın.
4. Test ettiğiniz OpenClaw sürümünü sabitleyin.
5. OpenClaw yükseltirken RPC başvurusunu yeniden kontrol edin.

Ajan çalıştırmaları için `agent` RPC ile başlayın ve terminal sonucu gerektiğinde
bunu `agent.wait` ile eşleştirin. Kalıcı konuşma durumu için `sessions.*`
yöntemlerini kullanın. UI entegrasyonları için Gateway olaylarına abone olun ve yalnızca
uygulamanızın anladığı olay ailelerini işleyin.

## Uygulama kodu ve Plugin kodu

Kod OpenClaw dışında yaşadığında Gateway RPC kullanın:

- Ajan çalıştırmalarını başlatan veya gözlemleyen Node betikleri
- Bir Gateway çağıran CI işleri
- panolar ve yönetim panelleri
- IDE eklentileri
- kanal Plugin'lerine dönüşmesi gerekmeyen harici köprüler
- sahte veya gerçek Gateway taşımalarıyla entegrasyon testleri

Kod OpenClaw içinde çalıştığında Plugin SDK kullanın:

- sağlayıcı Plugin'leri
- kanal Plugin'leri
- araç veya yaşam döngüsü kancaları
- ajan donanımı Plugin'leri
- güvenilir çalışma zamanı yardımcıları

Harici uygulamalar `openclaw/plugin-sdk/*` içe aktarmamalıdır; bu alt yollar
OpenClaw tarafından yüklenen Plugin'ler içindir.

## İlgili

- [Gateway protokolü](/tr/gateway/protocol)
- [Gateway RPC başvurusu](/tr/reference/rpc)
- [CLI agent komutu](/tr/cli/agent)
- [CLI message komutu](/tr/cli/message)
- [Ajan döngüsü](/tr/concepts/agent-loop)
- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
- [Oturumlar](/tr/concepts/session)
- [Arka plan görevleri](/tr/automation/tasks)
- [ACP ajanları](/tr/tools/acp-agents)
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
