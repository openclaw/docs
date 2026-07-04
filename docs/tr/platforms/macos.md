---
read_when:
    - macOS uygulamasını yükleme
    - macOS’ta yerel ve uzak Gateway modu arasında karar verme
    - macOS uygulama sürümü indirmeleri aranıyor
summary: OpenClaw macOS menü çubuğu uygulamasını yükleme ve kullanma
title: macOS uygulaması
x-i18n:
    generated_at: "2026-07-04T06:45:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

macOS uygulaması, OpenClaw **menü çubuğu yardımcısıdır**. Yerel bir tepsi arayüzü, macOS izin istemleri, bildirimler, WebChat, ses girişi, Canvas veya `system.run` gibi Mac'te barındırılan düğüm araçları istediğinizde bunu kullanın.

Yalnızca CLI ve Gateway gerekiyorsa [Başlarken](/tr/start/getting-started) ile başlayın.

## İndirme

macOS uygulama yapılarını
[OpenClaw GitHub sürümlerinden](https://github.com/openclaw/openclaw/releases) indirin.
Bir sürüm macOS uygulama varlıkları içeriyorsa şunları arayın:

- `OpenClaw-<version>.dmg` (tercih edilen)
- `OpenClaw-<version>.zip`

Bazı sürümler yalnızca CLI, kanıt veya Windows varlıkları içerir. En yeni
sürümde macOS uygulama varlığı yoksa, bunu içeren en yeni sürümü kullanın veya
uygulamayı [macOS geliştirme kurulumu](/tr/platforms/mac/dev-setup) ile kaynaktan derleyin.

## İlk çalıştırma

1. **OpenClaw.app**'i yükleyin ve başlatın.
2. Yerel bir Gateway için **Bu Mac** seçeneğini seçin veya uzak bir Gateway'e bağlanın.
3. Yerel mod için, uygulama kullanıcı alanı çalışma zamanını ve Gateway'i yüklerken bekleyin.
4. Sağlayıcı kurulumunu ve macOS izin kontrol listesini tamamlayın.
5. İlk katılım test mesajını gönderin.

CLI/Gateway kurulum yolu için [Başlarken](/tr/start/getting-started) sayfasını kullanın.
İzin kurtarma için [macOS izinleri](/tr/platforms/mac/permissions) sayfasını kullanın.

## Bir Gateway modu seçin

| Mod    | Ne zaman kullanılır                                                                       | Ayrıntı sayfası                                   |
| ------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Yerel  | Bu Mac, Gateway'i çalıştırmalı ve launchd ile canlı tutmalıdır.                            | [macOS'te Gateway](/tr/platforms/mac/bundled-gateway) |
| Uzak   | Başka bir ana makine Gateway'i çalıştırır ve bu Mac onu SSH, LAN veya Tailnet üzerinden denetlemelidir. | [Uzaktan denetim](/tr/platforms/mac/remote)          |

Yerel mod, yüklü bir `openclaw` CLI gerektirir. Yeni bir Mac'te uygulama,
Gateway sihirbazını başlatmadan önce eşleşen CLI'yi ve çalışma zamanını otomatik
olarak yükler. Manuel kurtarma için [macOS'te Gateway](/tr/platforms/mac/bundled-gateway) sayfasına bakın.

## Uygulamanın sahip oldukları

- Menü çubuğu durumu, bildirimler, sağlık ve WebChat.
- Ekran, mikrofon, konuşma, otomasyon ve erişilebilirlik için macOS izin istemleri.
- Canvas, kamera/ekran yakalama, bildirimler ve `system.run` gibi yerel düğüm araçları.
- Mac'te barındırılan komutlar için yürütme onayı istemleri.
- Uzak mod SSH tünelleri veya doğrudan Gateway bağlantıları.

Uygulama, OpenClaw Gateway'in veya genel CLI belgelerinin yerini **almaz**.
Temel Gateway yapılandırması, sağlayıcılar, Plugin'ler, kanallar, araçlar ve
güvenlik kendi belgelerinde yer alır.

## macOS ayrıntı sayfaları

| Görev                                    | Okuyun                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| CLI/Gateway hizmetini yükleme veya hata ayıklama | [macOS'te Gateway](/tr/platforms/mac/bundled-gateway)                                          |
| Durumu bulutla eşitlenen klasörlerin dışında tutma | [macOS'te Gateway](/tr/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| Uygulama keşfi ve bağlantısında hata ayıklama | [macOS'te Gateway](/tr/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| launchd davranışını anlama               | [Gateway yaşam döngüsü](/tr/platforms/mac/child-process)                                       |
| İzinleri veya imzalama/TCC sorunlarını düzeltme | [macOS izinleri](/tr/platforms/mac/permissions)                                                |
| Uzak bir Gateway'e bağlanma              | [Uzaktan denetim](/tr/platforms/mac/remote)                                                    |
| Menü çubuğu durumunu ve sağlık denetimlerini okuma | [Menü çubuğu](/tr/platforms/mac/menu-bar), [Sağlık denetimleri](/tr/platforms/mac/health)         |
| Gömülü sohbet arayüzünü kullanma         | [WebChat](/tr/platforms/mac/webchat)                                                           |
| Sesle uyandırmayı veya bas-konuşu kullanma | [Sesle uyandırma](/tr/platforms/mac/voicewake)                                                 |
| Canvas ve Canvas derin bağlantılarını kullanma | [Canvas](/tr/platforms/mac/canvas)                                                             |
| UI otomasyonu için PeekabooBridge barındırma | [Peekaboo köprüsü](/tr/platforms/mac/peekaboo)                                                 |
| Komut onaylarını yapılandırma            | [Yürütme onayları](/tr/tools/exec-approvals), [gelişmiş ayrıntılar](/tr/tools/exec-approvals-advanced) |
| Mac düğüm komutlarını ve uygulama IPC'sini inceleme | [macOS IPC](/tr/platforms/mac/xpc)                                                             |
| Günlükleri yakalama                      | [macOS günlüğe kaydetme](/tr/platforms/mac/logging)                                            |
| Kaynaktan derleme                        | [macOS geliştirme kurulumu](/tr/platforms/mac/dev-setup)                                       |

## İlgili

- [Platformlar](/tr/platforms)
- [Başlarken](/tr/start/getting-started)
- [Gateway](/tr/gateway)
- [Yürütme onayları](/tr/tools/exec-approvals)
