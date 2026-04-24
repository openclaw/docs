---
read_when:
    - Bir ilk katılım yolu seçme
    - Yeni bir ortam kurma
sidebarTitle: Onboarding Overview
summary: OpenClaw ilk katılım seçenekleri ve akışlarına genel bakış
title: İlk katılıma genel bakış
x-i18n:
    generated_at: "2026-04-24T09:32:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a161e504f94c633873a497dd97c971ebfed6f31ef23a3fe9e85eec5a06d1d97
    source_path: start/onboarding-overview.md
    workflow: 15
---

OpenClaw'ın iki ilk katılım yolu vardır. Her ikisi de auth'u, Gateway'i ve
isteğe bağlı sohbet kanallarını yapılandırır — fark yalnızca kurulumla nasıl etkileşim kurduğunuzdur.

## Hangi yolu kullanmalıyım?

|                | CLI ilk katılımı                        | macOS uygulaması ilk katılımı |
| -------------- | -------------------------------------- | ----------------------------- |
| **Platformlar** | macOS, Linux, Windows (yerel veya WSL2) | Yalnızca macOS                |
| **Arayüz**     | Terminal sihirbazı                     | Uygulamada yönlendirmeli UI   |
| **En uygun olduğu kullanım** | Sunucular, başsız kullanım, tam denetim | Masaüstü Mac, görsel kurulum |
| **Otomasyon**  | Betikler için `--non-interactive`      | Yalnızca manuel               |
| **Komut**      | `openclaw onboard`                     | Uygulamayı başlatın           |

Çoğu kullanıcı **CLI ilk katılımı** ile başlamalıdır — her yerde çalışır ve
en fazla denetimi sağlar.

## İlk katılım neyi yapılandırır

Hangi yolu seçerseniz seçin, ilk katılım şunları kurar:

1. **Model sağlayıcısı ve auth** — seçtiğiniz sağlayıcı için API anahtarı, OAuth veya kurulum belirteci
2. **Çalışma alanı** — aracı dosyaları, önyüklemeleme şablonları ve bellek için dizin
3. **Gateway** — port, bağlanma adresi, auth modu
4. **Kanallar** (isteğe bağlı) — BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp ve daha fazlası gibi yerleşik ve paketlenmiş sohbet kanalları
5. **Daemon** (isteğe bağlı) — Gateway'in otomatik başlaması için arka plan hizmeti

## CLI ilk katılımı

Herhangi bir terminalde çalıştırın:

```bash
openclaw onboard
```

Arka plan hizmetini de tek adımda kurmak için `--install-daemon` ekleyin.

Tam başvuru: [İlk katılım (CLI)](/tr/start/wizard)
CLI komut belgeleri: [`openclaw onboard`](/tr/cli/onboard)

## macOS uygulaması ilk katılımı

OpenClaw uygulamasını açın. İlk çalıştırma sihirbazı sizi aynı adımlardan
görsel bir arayüzle geçirir.

Tam başvuru: [İlk katılım (macOS Uygulaması)](/tr/start/onboarding)

## Özel veya listelenmemiş sağlayıcılar

Sağlayıcınız ilk katılımda listelenmiyorsa **Custom Provider** seçin ve şunları girin:

- API uyumluluk modu (OpenAI uyumlu, Anthropic uyumlu veya otomatik algılama)
- Base URL ve API anahtarı
- Model kimliği ve isteğe bağlı takma ad

Birden fazla özel uç nokta bir arada var olabilir — her biri kendi uç nokta kimliğini alır.

## İlgili

- [Başlangıç](/tr/start/getting-started)
- [CLI kurulum başvurusu](/tr/start/wizard-cli-reference)
