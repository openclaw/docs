---
read_when:
    - Tekrarlanabilir, geri alınabilir kurulumlar istiyorsunuz
    - Zaten Nix/NixOS/Home Manager kullanıyorsunuz
    - Her şeyin sabitlenmiş ve bildirimsel olarak yönetilmesini istiyorsunuz
summary: OpenClaw’ı Nix ile deklaratif olarak yükleyin
title: Nix
x-i18n:
    generated_at: "2026-05-06T17:57:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw'u **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** ile bildirimsel olarak kurun - birinci taraf, kapsamlı Home Manager modülü.

<Info>
[nix-openclaw](https://github.com/openclaw/nix-openclaw) reposu, Nix kurulumu için doğruluk kaynağıdır. Bu sayfa hızlı bir genel bakıştır.
</Info>

## Ne elde edersiniz

- Gateway + macOS uygulaması + araçlar (whisper, spotify, kameralar) -- hepsi sabitlenmiş
- Yeniden başlatmalardan sonra çalışmaya devam eden launchd servisi
- Bildirimsel yapılandırmaya sahip Plugin sistemi
- Anında geri alma: `home-manager switch --rollback`

## Hızlı başlangıç

<Steps>
  <Step title="Determinate Nix'i kurun">
    Nix zaten kurulu değilse [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer) talimatlarını izleyin.
  </Step>
  <Step title="Yerel bir flake oluşturun">
    nix-openclaw reposundaki agent-first şablonunu kullanın:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Gizli bilgileri yapılandırın">
    Mesajlaşma botu token'ınızı ve model sağlayıcısı API anahtarınızı ayarlayın. `~/.secrets/` altındaki düz dosyalar yeterlidir.
  </Step>
  <Step title="Şablon yer tutucularını doldurun ve geçiş yapın">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Doğrulayın">
    launchd servisinin çalıştığını ve botunuzun mesajlara yanıt verdiğini doğrulayın.
  </Step>
</Steps>

Tam modül seçenekleri ve örnekler için [nix-openclaw README](https://github.com/openclaw/nix-openclaw) dosyasına bakın.

## Nix modu çalışma zamanı davranışı

`OPENCLAW_NIX_MODE=1` ayarlandığında (nix-openclaw ile otomatik), OpenClaw Nix tarafından yönetilen kurulumlar için deterministik bir moda girer. Diğer Nix paketleri de aynı modu ayarlayabilir; nix-openclaw birinci taraf referanstır.

Bunu manuel olarak da ayarlayabilirsiniz:

```bash
export OPENCLAW_NIX_MODE=1
```

macOS'te GUI uygulaması kabuk ortam değişkenlerini otomatik olarak devralmaz. Bunun yerine Nix modunu defaults üzerinden etkinleştirin:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix modunda neler değişir

- Otomatik kurulum ve kendi kendini değiştirme akışları devre dışı bırakılır
- `openclaw.json` değişmez kabul edilir. Başlangıçtan türetilen varsayılanlar yalnızca çalışma zamanında kalır; setup, onboarding, değişiklik yapan `openclaw update`, Plugin install/update/uninstall/enable, `doctor --fix`, `doctor --generate-gateway-token` ve `openclaw config set` gibi yapılandırma yazıcıları dosyayı düzenlemeyi reddeder.
- Aracılar bunun yerine Nix kaynağını düzenlemelidir. nix-openclaw için agent-first [Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) bölümünü kullanın ve yapılandırmayı `programs.openclaw.config` veya `instances.<name>.config` altında ayarlayın.
- Eksik bağımlılıklar Nix'e özgü düzeltme mesajları gösterir
- UI, salt okunur Nix modu banner'ı gösterir

### Yapılandırma ve durum yolları

OpenClaw JSON5 yapılandırmasını `OPENCLAW_CONFIG_PATH` üzerinden okur ve değiştirilebilir verileri `OPENCLAW_STATE_DIR` içinde saklar. Nix altında çalışırken, çalışma zamanı durumu ve yapılandırmanın değişmez store dışında kalması için bunları açıkça Nix tarafından yönetilen konumlara ayarlayın.

| Değişken               | Varsayılan                              |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Servis PATH keşfi

launchd/systemd gateway servisi, `nix` ile kurulan çalıştırılabilirleri kabuk üzerinden çağıran Plugin'lerin ve araçların manuel PATH kurulumu olmadan çalışması için Nix-profile ikili dosyalarını otomatik keşfeder:

- `NIX_PROFILES` ayarlandığında, her giriş sağdan sola öncelikle servis PATH'ine eklenir (Nix kabuk önceliğiyle eşleşir - en sağdaki kazanır).
- `NIX_PROFILES` ayarlı olmadığında, `~/.nix-profile/bin` yedek olarak eklenir.

Bu, hem macOS launchd hem de Linux systemd servis ortamları için geçerlidir.

## İlgili

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Doğruluk kaynağı Home Manager modülü ve tam kurulum kılavuzu.
  </Card>
  <Card title="Kurulum sihirbazı" href="/tr/start/wizard" icon="wand-magic-sparkles">
    Nix dışı CLI kurulum adımları.
  </Card>
  <Card title="Docker" href="/tr/install/docker" icon="docker">
    Nix dışı alternatif olarak konteynerleştirilmiş kurulum.
  </Card>
  <Card title="Güncelleme" href="/tr/install/updating" icon="arrow-up-right-from-square">
    Home Manager tarafından yönetilen kurulumları paketle birlikte güncelleme.
  </Card>
</CardGroup>
