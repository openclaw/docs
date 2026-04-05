---
read_when:
    - Bir onboarding yolu seçiyorsunuz
    - Yeni bir ortam kuruyorsunuz
sidebarTitle: Onboarding Overview
summary: OpenClaw onboarding seçenekleri ve akışlarına genel bakış
title: Onboarding Genel Bakış
x-i18n:
    generated_at: "2026-04-05T14:08:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 374697c1dbe0c3871c43164076fbed7119ef032f4a40d0f6e421051f914806e5
    source_path: start/onboarding-overview.md
    workflow: 15
---

# Onboarding Genel Bakış

OpenClaw'ın iki onboarding yolu vardır. Her ikisi de kimlik doğrulamayı, Gateway'i ve
isteğe bağlı sohbet kanallarını yapılandırır — yalnızca kurulumla nasıl etkileşim kurduğunuz açısından farklıdırlar.

## Hangi yolu kullanmalıyım?

|                | CLI onboarding                          | macOS uygulaması onboarding |
| -------------- | --------------------------------------- | --------------------------- |
| **Platformlar**| macOS, Linux, Windows (yerel veya WSL2) | Yalnızca macOS              |
| **Arayüz**     | Terminal sihirbazı                      | Uygulama içinde yönlendirmeli UI |
| **En uygun olduğu durumlar** | Sunucular, başsız kullanım, tam kontrol | Masaüstü Mac, görsel kurulum |
| **Otomasyon**  | Betikler için `--non-interactive`       | Yalnızca manuel             |
| **Komut**      | `openclaw onboard`                      | Uygulamayı başlatın         |

Çoğu kullanıcı **CLI onboarding** ile başlamalıdır — her yerde çalışır ve size
en fazla denetimi sağlar.

## Onboarding'in yapılandırdıkları

Hangi yolu seçerseniz seçin, onboarding şunları kurar:

1. **Model sağlayıcısı ve kimlik doğrulama** — seçtiğiniz sağlayıcı için API anahtarı, OAuth veya kurulum token'ı
2. **Çalışma alanı** — ajan dosyaları, önyükleme şablonları ve bellek için dizin
3. **Gateway** — port, bağlanma adresi, kimlik doğrulama modu
4. **Kanallar** (isteğe bağlı) — BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp ve daha fazlası gibi yerleşik ve paketlenmiş sohbet kanalları
5. **Daemon** (isteğe bağlı) — Gateway'in otomatik olarak başlaması için arka plan hizmeti

## CLI onboarding

Herhangi bir terminalde çalıştırın:

```bash
openclaw onboard
```

Arka plan hizmetini de tek adımda kurmak için `--install-daemon` ekleyin.

Tam başvuru: [Onboarding (CLI)](/start/wizard)
CLI komut belgeleri: [`openclaw onboard`](/cli/onboard)

## macOS uygulaması onboarding

OpenClaw uygulamasını açın. İlk çalıştırma sihirbazı sizi aynı adımlardan
görsel bir arayüzle geçirir.

Tam başvuru: [Onboarding (macOS Uygulaması)](/start/onboarding)

## Özel veya listelenmemiş sağlayıcılar

Sağlayıcınız onboarding içinde listelenmiyorsa, **Custom Provider** seçeneğini seçin ve
şunları girin:

- API uyumluluk modu (OpenAI uyumlu, Anthropic uyumlu veya otomatik algılama)
- Temel URL ve API anahtarı
- Model kimliği ve isteğe bağlı takma ad

Birden fazla özel uç nokta birlikte var olabilir — her biri kendi uç nokta kimliğini alır.
