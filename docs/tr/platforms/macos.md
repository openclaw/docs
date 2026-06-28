---
read_when:
    - macOS uygulamasını yükleme
    - macOS’ta yerel ve uzak Gateway modu arasında karar verme
    - macOS uygulama sürümü indirmeleri aranıyor
summary: OpenClaw macOS menü çubuğu uygulamasını yükleyin ve kullanın
title: macOS uygulaması
x-i18n:
    generated_at: "2026-06-28T00:49:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

macOS uygulaması, OpenClaw **menü çubuğu eşlikçisi**dir. Yerel bir tepsi arayüzü, macOS izin istemleri, bildirimler, WebChat, ses girişi, Canvas veya `system.run` gibi Mac üzerinde barındırılan Node araçları istediğinizde kullanın.

Yalnızca CLI ve Gateway'e ihtiyacınız varsa [Başlarken](/tr/start/getting-started) ile başlayın.

## İndir

macOS uygulama derlemelerini
[OpenClaw GitHub releases](https://github.com/openclaw/openclaw/releases) sayfasından indirin.
Bir sürüm macOS uygulama varlıkları içerdiğinde şunları arayın:

- `OpenClaw-<version>.dmg` (tercih edilir)
- `OpenClaw-<version>.zip`

Bazı sürümler yalnızca CLI, kanıt veya Windows varlıkları içerir. En yeni
sürümde macOS uygulama varlığı yoksa, bunu içeren en yeni sürümü kullanın veya
uygulamayı [macOS geliştirme kurulumu](/tr/platforms/mac/dev-setup) ile kaynaktan derleyin.

## İlk çalıştırma

1. **OpenClaw.app**'i kurun ve başlatın.
2. macOS izin kontrol listesini tamamlayın.
3. **Yerel** veya **Uzak** modu seçin.
4. Uygulama isterse `openclaw` CLI'yi kurun.
5. Menü çubuğundan WebChat'i açın ve bir test mesajı gönderin.

CLI/Gateway kurulum yolu için [Başlarken](/tr/start/getting-started) sayfasını kullanın.
İzin kurtarma için [macOS izinleri](/tr/platforms/mac/permissions) sayfasını kullanın.

## Bir Gateway modu seçin

| Mod   | Ne zaman kullanılır                                                                             | Ayrıntı sayfası                                        |
| ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Yerel  | Bu Mac, Gateway'i çalıştırmalı ve launchd ile ayakta tutmalıdır.                         | [macOS'ta Gateway](/tr/platforms/mac/bundled-gateway) |
| Uzak | Başka bir ana makine Gateway'i çalıştırır ve bu Mac onu SSH, LAN veya Tailnet üzerinden kontrol etmelidir. | [Uzaktan kontrol](/tr/platforms/mac/remote)            |

Yerel mod, kurulu bir `openclaw` CLI gerektirir. Uygulama bunu kurabilir veya
[macOS'ta Gateway](/tr/platforms/mac/bundled-gateway) sayfasını izleyebilirsiniz.

## Uygulamanın sahip olduğu alanlar

- Menü çubuğu durumu, bildirimler, sağlık ve WebChat.
- Ekran, mikrofon, konuşma, otomasyon ve erişilebilirlik için macOS izin istemleri.
- Canvas, kamera/ekran yakalama, bildirimler ve `system.run` gibi yerel Node araçları.
- Mac üzerinde barındırılan komutlar için çalıştırma onayı istemleri.
- Uzak mod SSH tünelleri veya doğrudan Gateway bağlantıları.

Uygulama, OpenClaw Gateway'in veya genel CLI belgelerinin yerini **almaz**. Temel
Gateway yapılandırması, sağlayıcılar, plugin'ler, kanallar, araçlar ve güvenlik
kendi belgelerinde yer alır.

## macOS ayrıntı sayfaları

| Görev                                     | Okuyun                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| CLI/Gateway hizmetini kurma veya hata ayıklama | [macOS'ta Gateway](/tr/platforms/mac/bundled-gateway)                                          |
| Durumu bulutla eşitlenen klasörlerin dışında tutma   | [macOS'ta Gateway](/tr/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| Uygulama keşfi ve bağlantı sorunlarını ayıklama     | [macOS'ta Gateway](/tr/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| launchd davranışını anlama              | [Gateway yaşam döngüsü](/tr/platforms/mac/child-process)                                           |
| İzinleri veya imzalama/TCC sorunlarını düzeltme    | [macOS izinleri](/tr/platforms/mac/permissions)                                             |
| Uzak bir Gateway'e bağlanma              | [Uzaktan kontrol](/tr/platforms/mac/remote)                                                     |
| Menü çubuğu durumunu ve sağlık kontrollerini okuma   | [Menü çubuğu](/tr/platforms/mac/menu-bar), [Sağlık kontrolleri](/tr/platforms/mac/health)                 |
| Gömülü sohbet arayüzünü kullanma                 | [WebChat](/tr/platforms/mac/webchat)                                                           |
| Sesle uyandırmayı veya bas-konuşu kullanma           | [Sesle uyandırma](/tr/platforms/mac/voicewake)                                                      |
| Canvas ve Canvas derin bağlantılarını kullanma         | [Canvas](/tr/platforms/mac/canvas)                                                             |
| UI otomasyonu için PeekabooBridge barındırma    | [Peekaboo köprüsü](/tr/platforms/mac/peekaboo)                                                  |
| Komut onaylarını yapılandırma              | [Exec onayları](/tr/tools/exec-approvals), [gelişmiş ayrıntılar](/tr/tools/exec-approvals-advanced) |
| Mac Node komutlarını ve uygulama IPC'sini inceleme    | [macOS IPC](/tr/platforms/mac/xpc)                                                             |
| Günlükleri yakalama                             | [macOS günlükleme](/tr/platforms/mac/logging)                                                     |
| Kaynaktan derleme                        | [macOS geliştirme kurulumu](/tr/platforms/mac/dev-setup)                                                 |

## İlgili

- [Platformlar](/tr/platforms)
- [Başlarken](/tr/start/getting-started)
- [Gateway](/tr/gateway)
- [Exec onayları](/tr/tools/exec-approvals)
