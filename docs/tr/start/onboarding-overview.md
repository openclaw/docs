---
read_when:
    - İlk kurulum yolu seçme
    - Yeni bir ortam kurma
sidebarTitle: Onboarding Overview
summary: OpenClaw ilk katılım seçeneklerine ve akışlarına genel bakış
title: İlk katılım genel bakışı
x-i18n:
    generated_at: "2026-07-12T12:45:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3460887108dc078c963802a32238133814afcc7d36b27eb4760280328ee070e5
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw, terminal ve macOS uygulaması üzerinden ilk kuruluma sahiptir. Her ikisi de önce çıkarımı hazırlar:
mevcut yapay zekâ erişimini algılar, canlı bir tamamlamayı zorunlu tutar ve ancak bundan sonra
kalan kurulumu yapılandırmak üzere Crestodian'ı başlatır. Erişilebilir ve yapılandırılmış bir Gateway'in
varsayılan aracısında zaten yapılandırılmış bir model varsa ilk kurulum atlanır ve
normal aracı kullanıcı arayüzü açılır. Terminal akışı ayrıca ayrıntılı kurulum için
tam klasik sihirbazı sunar.

## Hangi yolu kullanmalıyım?

|                  | CLI ilk kurulumu                            | macOS uygulaması ilk kurulumu       |
| ---------------- | ------------------------------------------- | ----------------------------------- |
| **Platformlar**  | macOS, Linux, Windows (yerel veya WSL2)     | Yalnızca macOS                      |
| **Arayüz**       | Çıkarım kurulumu, ardından Crestodian       | Çıkarım kurulumu, ardından Crestodian |
| **En uygun kullanım** | Sunucular, ekransız sistemler, tam denetim | Masaüstü Mac, görsel kurulum         |
| **Otomasyon**    | Betikler için `--non-interactive`           | Yalnızca elle                       |
| **Komut**        | `openclaw onboard`                          | Uygulamayı başlatın                 |

Çoğu kullanıcı **CLI ilk kurulumu** ile başlamalıdır; her yerde çalışır ve
size en fazla denetimi sağlar.

## İlk kurulumun yapılandırdıkları

Yönlendirmeli çıkarım aşaması yalnızca şunları hazırlar:

1. **Model sağlayıcısı ve kimlik doğrulama** — algılanan erişim veya doğrulanmış bir API anahtarı
2. **Doğrulanmış çıkarım** — varsayılan aracının etkin
   modelinde gerçek bir tamamlama

Bu tamamlama başarılı olduktan sonra Crestodian; çalışma alanını, Gateway'i,
Gateway hizmetini, kanalları, aracıları, plugin'leri ve diğer isteğe bağlı özellikleri yapılandırabilir.

Klasik CLI sihirbazı ek olarak şunları yapılandırabilir:

1. **Kanallar** (isteğe bağlı) — Discord, Feishu, Google Chat, iMessage,
   Mattermost, Microsoft Teams, Telegram, WhatsApp ve diğerleri gibi
   yerleşik ve paketlenmiş sohbet kanalları
2. **Gelişmiş Gateway denetimleri** — uzak mod, ağ ayarları ve arka plan hizmeti seçenekleri

## CLI ilk kurulumu

Herhangi bir terminalde çalıştırın:

```bash
openclaw onboard
```

Yönlendirmeli akış mevcut yapay zekâ erişimini algılar, adayları sırayla canlı olarak
sınar, başarısızlık durumunda sonraki adaya geçer ve maskelenmiş elle anahtar girişi sunar.
Modeli ve kimlik bilgisini yalnızca başarılı bir tamamlamadan sonra kaydeder; ardından
çalışma alanını, Gateway'i, kanalları, aracıları, plugin'leri ve diğer
isteğe bağlı özellikleri yapılandırmak üzere Crestodian'ı başlatır. Çıkarım öncesi Crestodian,
yapay zekâyı atlama yolu veya akış içinde klasik kuruluma geçiş yoktur. Bunun yerine klasik
sihirbazı kullanmak istediğinizde çıkın ve `openclaw onboard --classic` komutunu çalıştırın.

Çıkarım başarılı olduktan sonra Crestodian, kanal kurulumunu maskelenmiş bir terminal
sihirbazına devredebilir. Yönlendirmeli veya klasik sağlayıcı kurulumunu açmaz; model
sağlayıcısını ya da kimlik doğrulamasını değiştirmek için Crestodian'dan çıkın ve
`openclaw onboard` komutunu çalıştırın.

Ayrıntılı model/kimlik doğrulama, kanal, beceri, uzak Gateway veya içe aktarma kurulumu için
`openclaw onboard --classic` kullanın. `--install-daemon` eklemek de klasik akışı seçer
ve arka plan hizmetini tek adımda kurar. Konuşmaya dayalı, çıkarım dışı kurulum ve onarım
için `openclaw crestodian` kullanın. `openclaw onboard --modern`, aynı canlı çıkarım
geçidini kullanan bir uyumluluk diğer adıdır.

Tam başvuru: [İlk kurulum (CLI)](/tr/start/wizard)
CLI komut belgeleri: [`openclaw onboard`](/tr/cli/onboard)

## macOS uygulaması ilk kurulumu

OpenClaw uygulamasını açın. Yapılandırılmış yerel veya uzak Gateway'i erişilebilirse
ve varsayılan aracıda zaten yapılandırılmış bir model varsa uygulama ilk kurulumu
ve Crestodian'ı atlayarak normal aracı kullanıcı arayüzünü hemen açar.

Yeni veya eksik bir Gateway için ilk çalıştırma akışı mevcut yapay zekâ
erişimini (Claude Code, Codex veya API anahtarları) algılar, en iyi seçeneği
canlı olarak sınar ve yalnızca gerçek bir yanıttan sonra kaydeder; otomatik olarak
yedek seçeneklere geçer ve hiçbir şey bulunamadığında doğrulanmış bir elle API anahtarı
girme adımı sunar. Hassas kimlik bilgileri maskelenmiş giriş kullanır. Çıkarım başarılı
olduğunda Crestodian başlar ve geri kalan yapılandırmaya yardımcı olur.

Gemini CLI, kurulumdan sonra normal aracılar için kullanılabilir olmaya devam eder ancak
araçsız yoklamayı zorunlu kılamadığı için bu çıkarım geçidinde sunulmaz.

Tam başvuru: [İlk kurulum (macOS uygulaması)](/tr/start/onboarding)

## Özel veya listelenmemiş sağlayıcılar

Sağlayıcınız listelenmemişse `openclaw onboard --classic` komutunu çalıştırın,
**Özel Sağlayıcı** seçeneğini belirleyin ve şunları girin:

- Uç nokta uyumluluğu: OpenAI uyumlu (`/chat/completions`), OpenAI Responses uyumlu (`/responses`), Anthropic uyumlu (`/messages`) veya bilinmiyor (üçünü de yoklar ve otomatik algılar)
- Temel URL ve API anahtarı (uç nokta gerektirmiyorsa API anahtarı isteğe bağlıdır)
- Model kimliği ve isteğe bağlı model diğer adı

Birden fazla özel uç nokta birlikte kullanılabilir; her biri kendi uç nokta kimliğini alır.

## İlgili

- [Başlarken](/tr/start/getting-started)
- [CLI kurulum başvurusu](/tr/start/wizard-cli-reference)
