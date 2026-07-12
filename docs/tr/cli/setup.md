---
read_when:
    - İlk çalıştırma kurulumunu CLI başlangıç sihirbazıyla yapıyorsunuz
    - Varsayılan çalışma alanı yolunu ayarlamak istiyorsunuz
    - Betikler için yalnızca temel kurulumu kullanan bayrağa ihtiyacınız var
summary: '`openclaw setup` için CLI başvurusu (başlangıç kurulumunun diğer adı; temel kurulum bir bayrakla kullanılabilir)'
title: Kurulum
x-i18n:
    generated_at: "2026-07-12T11:36:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup`, `openclaw onboard` ile aynı rehberli ilk katılım akışını çalıştırır:
önce çıkarımı doğrulayıp kalıcı hâle getirir, ardından çalışma alanını, Gateway'i,
kanalları, Skills'i ve sistem durumunu yapılandırmak üzere Crestodian'ı başlatır.
Sihirbazı kullanmadan yalnızca yapılandırma/çalışma alanı klasörlerini başlatmanız
gerektiğinde `--baseline` seçeneğini kullanın.

Rehberli modda `--workspace <dir>`, Crestodian'a önerilen çalışma alanıdır;
yalnızca bu öneriyi onaylamanızdan sonra kalıcı hâle getirilir. Temel, klasik ve
etkileşimsiz kurulum, sağlanan çalışma alanını normal akışları üzerinden kalıcı
hâle getirir.

`setup`; kimlik doğrulama (`--auth-choice`, `--token`, sağlayıcı anahtarı
bayrakları), Gateway (`--gateway-port`, `--gateway-bind`, `--gateway-auth`,
`--install-daemon`), Tailscale (`--tailscale`), sıfırlama (`--reset`,
`--reset-scope`), akış (`--flow quickstart|advanced|manual|import`) ve atlama
bayrakları (`--skip-channels`, `--skip-skills`, `--skip-bootstrap`,
`--skip-search`, `--skip-health`, `--skip-ui`, `--skip-hooks`) dâhil olmak üzere
`openclaw onboard` ile aynı ilk katılım bayraklarını kabul eder. Bayrakların tam
referansı ve etkileşimsiz örnekler için [İlk katılım](/tr/cli/onboard) ve
[CLI otomasyonu](/tr/start/wizard-cli-automation) sayfalarına bakın.
`openclaw onboard --modern`, çıkarım denetimli Crestodian yardımcısının
uyumluluk takma adıdır ve `setup` eşdeğeri yoktur.

<Note>
`openclaw setup`, değiştirilebilir yapılandırma kurulumları içindir. Nix modunda (`OPENCLAW_NIX_MODE=1`), yapılandırma dosyası Nix tarafından yönetildiği için OpenClaw kurulum yazma işlemlerini reddeder. Birinci taraf [nix-openclaw Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kılavuzunu veya başka bir Nix paketi için eşdeğer kaynak yapılandırmasını kullanın.
</Note>

## Seçenekler

| Bayrak                     | Açıklama                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Rehberli moddaki çalışma alanı önerisi; temel, klasik ve etkileşimsiz kurulumda doğrudan kalıcı hâle getirilir.   |
| `--baseline`               | İlk katılım olmadan temel yapılandırma/çalışma alanı/oturum klasörlerini oluşturur.                               |
| `--wizard`                 | Uyumluluk için kabul edilir; kurulum varsayılan olarak ilk katılımı çalıştırır.                                   |
| `--non-interactive`        | İlk katılımı istemler olmadan çalıştırır.                                                                         |
| `--accept-risk`            | Tam sistem aracı erişimi riskini kabul eder; `--non-interactive` ile birlikte zorunludur.                         |
| `--mode <mode>`            | İlk katılım modu: `local` veya `remote`.                                                                          |
| `--flow <flow>`            | İlk katılım akışı: `quickstart`, `advanced`, `manual` veya `import`.                                              |
| `--reset`                  | İlk katılımdan önce yapılandırmayı + kimlik bilgilerini + oturumları sıfırlar (çalışma alanı yalnızca `--reset-scope full` ile). |
| `--reset-scope <scope>`    | Sıfırlama kapsamı: `config`, `config+creds+sessions` veya `full`.                                                 |
| `--import-from <provider>` | İlk katılım sırasında çalıştırılacak geçiş sağlayıcısı.                                                           |
| `--import-source <path>`   | `--import-from` için kaynak aracın ana dizini.                                                                    |
| `--import-secrets`         | İlk katılım geçişi sırasında desteklenen gizli bilgileri içe aktarır.                                             |
| `--remote-url <url>`       | Uzak Gateway WebSocket URL'si.                                                                                    |
| `--remote-token <token>`   | Uzak Gateway belirteci (isteğe bağlı).                                                                            |
| `--json`                   | Bir JSON özeti çıktılar.                                                                                          |

`--classic` ile `--non-interactive` birbirini dışlar: klasik mod istemli
sihirbazı açarken etkileşimsiz kurulum otomasyon yolunu kullanır.

### Temel mod

`openclaw setup --baseline`, eski yalnızca temel davranışı korur:
yapılandırma, çalışma alanı ve oturum dizinlerini oluşturur, ardından ilk
katılımı çalıştırmadan çıkar.

## Örnekler

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Notlar

- Temel kurulumdan sonra tam rehberli süreç için `openclaw setup` veya `openclaw onboard`, hedefli değişiklikler için `openclaw configure` ya da kanal hesapları eklemek için `openclaw channels add` komutunu çalıştırın.
- Hermes durumu algılanırsa etkileşimli ilk katılım geçişi otomatik olarak önerebilir. İçe aktarmalı ilk katılım yeni bir kurulum gerektirir; ilk katılım dışında deneme çalıştırması planları, yedeklemeler ve üzerine yazma modu için [Geçiş](/tr/cli/migrate) sayfasını kullanın.

## İlgili

- [CLI referansı](/tr/cli)
- [İlk katılım](/tr/cli/onboard)
- [İlk katılım (CLI)](/tr/start/wizard)
- [Başlangıç](/tr/start/getting-started)
- [Kuruluma genel bakış](/tr/install)
