---
read_when:
    - Bir ilk kurulum yolu seçme
    - Yeni bir ortam kurma
sidebarTitle: Onboarding Overview
summary: OpenClaw ilk kurulum seçenekleri ve akışlarına genel bakış
title: Başlangıç sürecine genel bakış
x-i18n:
    generated_at: "2026-05-10T19:55:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9b375b9090250992b9deead25ae6502592cb63c9774204782b2d4f69d8f3395
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw'ın iki ilk kurulum yolu vardır. İkisi de kimlik doğrulamayı, Gateway'i ve
isteğe bağlı sohbet kanallarını yapılandırır; yalnızca kurulumla nasıl etkileşim kurduğunuz farklıdır.

## Hangi yolu kullanmalıyım?

|                | CLI ilk kurulumu                       | macOS uygulaması ilk kurulumu |
| -------------- | -------------------------------------- | ----------------------------- |
| **Platformlar** | macOS, Linux, Windows (yerel veya WSL2) | Yalnızca macOS                |
| **Arayüz**     | Terminal sihirbazı                     | Uygulamada rehberli kullanıcı arayüzü |
| **En uygun**   | Sunucular, başsız kullanım, tam kontrol | Masaüstü Mac, görsel kurulum |
| **Otomasyon**  | Betikler için `--non-interactive`      | Yalnızca manuel               |
| **Komut**      | `openclaw onboard`                     | Uygulamayı başlatın           |

Çoğu kullanıcı **CLI ilk kurulumu** ile başlamalıdır; her yerde çalışır ve size
en fazla kontrolü sağlar.

## İlk kurulumun yapılandırdıkları

Hangi yolu seçerseniz seçin, ilk kurulum şunları ayarlar:

1. **Model sağlayıcısı ve kimlik doğrulama** — seçtiğiniz sağlayıcı için API anahtarı, OAuth veya kurulum belirteci
2. **Çalışma alanı** — agent dosyaları, bootstrap şablonları ve bellek için dizin
3. **Gateway** — bağlantı noktası, bağlanma adresi, kimlik doğrulama modu
4. **Kanallar** (isteğe bağlı) — iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp ve daha fazlası gibi yerleşik ve paketlenmiş sohbet kanalları
5. **Daemon** (isteğe bağlı) — Gateway'in otomatik olarak başlaması için arka plan hizmeti

## CLI ilk kurulumu

Herhangi bir terminalde çalıştırın:

```bash
openclaw onboard
```

Arka plan hizmetini de tek adımda yüklemek için `--install-daemon` ekleyin.

Tam başvuru: [İlk kurulum (CLI)](/tr/start/wizard)
CLI komut belgeleri: [`openclaw onboard`](/tr/cli/onboard)

## macOS uygulaması ilk kurulumu

OpenClaw uygulamasını açın. İlk çalıştırma sihirbazı, aynı adımlarda size
görsel bir arayüzle yol gösterir.

Tam başvuru: [İlk kurulum (macOS Uygulaması)](/tr/start/onboarding)

## Özel veya listelenmeyen sağlayıcılar

Sağlayıcınız ilk kurulumda listelenmiyorsa **Özel Sağlayıcı** seçeneğini belirleyin ve
şunları girin:

- API uyumluluk modu (OpenAI uyumlu, Anthropic uyumlu veya otomatik algılama)
- Temel URL ve API anahtarı
- Model kimliği ve isteğe bağlı takma ad

Birden çok özel uç nokta birlikte var olabilir; her biri kendi uç nokta kimliğini alır.

## İlgili

- [Başlarken](/tr/start/getting-started)
- [CLI kurulum başvurusu](/tr/start/wizard-cli-reference)
