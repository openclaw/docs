---
read_when:
    - Kurulum veya onarım için OpenClaw ile sohbet etmek istiyorsunuz
    - İlk çalıştırma kurulumunu başlangıç sihirbazıyla yapıyorsunuz
    - Varsayılan çalışma alanı yolunu ayarlamak istiyorsunuz
    - Betikler için yalnızca temel yapılandırma bayrağına ihtiyacınız var
summary: '`openclaw setup` için CLI başvurusu (onboarding yedekli sistem aracısı sohbeti)'
title: Kurulum
x-i18n:
    generated_at: "2026-07-16T17:18:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3395dbfe94c2f9686757fff85db709f0a9ed0ac9579e8e3c80ee1d51038f8e18
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` sistem aracısının giriş noktasıdır. Yapılandırılmış bir sistemde, yalnızca
`openclaw setup` çalıştırıldığında etkileşimli bir OpenClaw sohbeti açılır. Yeni bir sistemde ise
yönlendirmeli ilk kuruluma geçilir. Tek bir istek için `-m`/`--message` veya
sihirbazı kullanmadan yapılandırma/çalışma alanı klasörlerini başlatmak için `--baseline` kullanın.

Yönlendirme sırası:

1. Herhangi bir ilk kurulum seçeneği (`--wizard`, `--baseline`, çalışma alanı, sıfırlama,
   etkileşimsiz, akış, mod, Gateway, arka plan hizmeti, atlama, içe aktarma, uzak bağlantı veya kimlik doğrulama
   seçenekleri), ilk kurulumu tam olarak `openclaw onboard` gibi çalıştırır.
2. `-m`/`--message` veya `--yes` sistem aracısını çalıştırır.
3. Yönlendirme seçeneği olmadığında, yapılandırılmış etkileşimli bir sistem OpenClaw'ı açar. Yeni bir
   sistem ilk kurulumu çalıştırır. Yapılandırılmış bir sistemde `--json`, TTY olmasa bile
   sistem genel görünümünü yazdırır; bir ilk kurulum seçeneği, ilk kurulumun
   JSON özetini korur.

Yönlendirmeli modda `--workspace <dir>`, OpenClaw'a önerilen çalışma alanıdır;
yalnızca bu öneriyi onaylamanızdan sonra kalıcı hâle getirilir. Temel, klasik ve
etkileşimsiz kurulum, sağlanan çalışma alanını normal akışları aracılığıyla kalıcı hâle getirir.

Yönlendirmeli çıkarım algılama, macOS veya Linux'ta Gateway ana makinesinde çalışır. CLI
ve macOS uygulaması, yapılandırılmış modelleri, desteklenen CLI oturum açma yöntemlerini,
API anahtarı ortam değişkenlerini ve önceden yüklenmiş Ollama veya LM Studio modellerini
denetleyen, Gateway'e ait aynı algılayıcıyı çağırır. Bu otomatik geçiş sırasında yerel
modeller hiçbir zaman indirilmez; sağlayıcı ve model yapılandırması kaydedilmeden önce
seçilen adayın gerçek bir tamamlama isteğine yanıt vermesi gerekir.

`setup`; kimlik doğrulama (`--auth-choice`, `--token`, sağlayıcı anahtarı bayrakları), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), sıfırlama (`--reset`, `--reset-scope`), akış
(`--flow quickstart|advanced|manual|import`) ve atlama bayrakları
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`) dâhil olmak üzere
`openclaw onboard` ile aynı ilk kurulum bayraklarını kabul eder. Tüm bayrak başvurusu ve
etkileşimsiz örnekler için [İlk kurulum](/tr/cli/onboard) ve
[CLI otomasyonu](/tr/start/wizard-cli-automation) bölümlerine bakın. `openclaw onboard --modern`, aynı çıkarım
geçidine tabi OpenClaw yardımcısı için bir uyumluluk
giriş noktası olarak kalır.

<Note>
`openclaw setup`, değiştirilebilir yapılandırma kurulumları içindir. Nix modunda (`OPENCLAW_NIX_MODE=1`) yapılandırma dosyası Nix tarafından yönetildiğinden OpenClaw kurulum yazma işlemlerini reddeder. Birinci taraf [nix-openclaw Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kılavuzunu veya başka bir Nix paketi için eşdeğer kaynak yapılandırmasını kullanın.
</Note>

## Seçenekler

| Bayrak                       | Açıklama                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | Tek bir OpenClaw isteği çalıştırır.                                                                             |
| `--yes`                    | Bir `--message` isteği için kalıcı yapılandırma yazma işlemlerini onaylar.                                         |
| `--workspace <dir>`        | Yönlendirmeli modda çalışma alanı önerisi; temel, klasik ve etkileşimsiz kurulumda doğrudan kalıcı hâle getirilir. |
| `--baseline`               | İlk kurulumu çalıştırmadan temel yapılandırma/çalışma alanı/oturum klasörlerini oluşturur.                                  |
| `--wizard`                 | Etkileşimli ilk kurulumu zorlar.                                                                         |
| `--non-interactive`        | İlk kurulumu istemler olmadan çalıştırır.                                                                       |
| `--accept-risk`            | Tam sistem aracısı erişim riskini kabul eder; `--non-interactive` ile birlikte gereklidir.                         |
| `--mode <mode>`            | İlk kurulum modu: `local` veya `remote`.                                                                 |
| `--flow <flow>`            | İlk kurulum akışı: `quickstart`, `advanced`, `manual` veya `import`.                                        |
| `--reset`                  | İlk kurulumdan önce yapılandırmayı + kimlik bilgilerini + oturumları sıfırlar (çalışma alanı yalnızca `--reset-scope full` ile).   |
| `--reset-scope <scope>`    | Sıfırlama kapsamı: `config`, `config+creds+sessions` veya `full`.                                            |
| `--import-from <provider>` | İlk kurulum sırasında çalıştırılacak geçiş sağlayıcısı.                                                          |
| `--import-source <path>`   | `--import-from` için kaynak aracı ana dizini.                                                                |
| `--import-secrets`         | İlk kurulum geçişi sırasında desteklenen gizli bilgileri içe aktarır.                                                 |
| `--remote-url <url>`       | Uzak Gateway WebSocket URL'si.                                                                         |
| `--remote-token <token>`   | Uzak Gateway belirteci (isteğe bağlı).                                                                      |
| `--json`                   | Yapılandırılmış sistem: OpenClaw genel görünümü. İlk kurulum rotası: ilk kurulum özeti.                           |

`--classic` ve `--non-interactive` birbirini dışlar: klasik mod
istemli sihirbazı açarken etkileşimsiz kurulum otomasyon yolunu kullanır.

### Temel mod

`openclaw setup --baseline`, eski yalnızca temel davranışı korur:
yapılandırma, çalışma alanı ve oturum dizinlerini oluşturur, ardından
ilk kurulumu çalıştırmadan çıkar.

## Örnekler

```bash
openclaw setup
openclaw setup -m "status"
openclaw setup -m "restart gateway" --yes
openclaw setup --json
openclaw setup --wizard
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Notlar

- Temel kurulumdan sonra, tam yönlendirmeli süreç için `openclaw onboard`, hedefli değişiklikler için `openclaw configure` veya kanal hesapları eklemek için `openclaw channels add` çalıştırın.
- Hermes durumu algılanırsa etkileşimli ilk kurulum, geçişi otomatik olarak önerebilir. İçe aktarmalı ilk kurulum yeni bir kurulum gerektirir; ilk kurulum dışında deneme çalıştırması planları, yedeklemeler ve üzerine yazma modu için [Geçiş](/tr/cli/migrate) bölümünü kullanın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [İlk kurulum](/tr/cli/onboard)
- [İlk kurulum (CLI)](/tr/start/wizard)
- [Başlarken](/tr/start/getting-started)
- [Kuruluma genel bakış](/tr/install)
