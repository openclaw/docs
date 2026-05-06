---
read_when:
    - Tekrarlanabilir ve geri alınabilir kurulumlar istiyorsunuz
    - Zaten Nix/NixOS/Home Manager kullanıyorsunuz
    - Her şeyin sabitlenmesini ve bildirimsel olarak yönetilmesini istiyorsunuz
summary: OpenClaw'u Nix ile deklaratif olarak kurun
title: Nix
x-i18n:
    generated_at: "2026-05-06T09:19:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

OpenClaw'ı **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** ile bildirimsel olarak kurun - her şey dahil bir Home Manager modülü.

<Info>
[nix-openclaw](https://github.com/openclaw/nix-openclaw) deposu, Nix kurulumu için doğruluk kaynağıdır. Bu sayfa hızlı bir genel bakıştır.
</Info>

## Neler elde edersiniz

- Gateway + macOS uygulaması + araçlar (whisper, spotify, kameralar) -- tümü sabitlenmiş
- Yeniden başlatmalardan sonra da çalışmaya devam eden launchd hizmeti
- Bildirimsel yapılandırmalı Plugin sistemi
- Anında geri alma: `home-manager switch --rollback`

## Hızlı başlangıç

<Steps>
  <Step title="Determinate Nix'i kurun">
    Nix henüz kurulu değilse [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer) talimatlarını izleyin.
  </Step>
  <Step title="Yerel bir flake oluşturun">
    nix-openclaw deposundaki ajan öncelikli şablonu kullanın:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Gizli bilgileri yapılandırın">
    Mesajlaşma botu token'ınızı ve model sağlayıcısı API anahtarınızı ayarlayın. `~/.secrets/` konumundaki düz dosyalar gayet iyi çalışır.
  </Step>
  <Step title="Şablon yer tutucularını doldurun ve geçiş yapın">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Doğrulayın">
    launchd hizmetinin çalıştığını ve botunuzun mesajlara yanıt verdiğini doğrulayın.
  </Step>
</Steps>

Tam modül seçenekleri ve örnekler için [nix-openclaw README](https://github.com/openclaw/nix-openclaw) dosyasına bakın.

## Nix modu çalışma zamanı davranışı

`OPENCLAW_NIX_MODE=1` ayarlandığında (nix-openclaw ile otomatik), OpenClaw otomatik kurulum akışlarını devre dışı bırakan deterministik bir moda girer.

Bunu elle de ayarlayabilirsiniz:

```bash
export OPENCLAW_NIX_MODE=1
```

macOS'te GUI uygulaması kabuk ortam değişkenlerini otomatik olarak devralmaz. Bunun yerine defaults üzerinden Nix modunu etkinleştirin:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix modunda ne değişir

- Otomatik kurulum ve kendi kendini değiştirme akışları devre dışı bırakılır
- Eksik bağımlılıklar Nix'e özel düzeltme mesajları gösterir
- UI salt okunur bir Nix modu banner'ı gösterir

### Yapılandırma ve durum yolları

OpenClaw JSON5 yapılandırmasını `OPENCLAW_CONFIG_PATH` konumundan okur ve değiştirilebilir verileri `OPENCLAW_STATE_DIR` içinde saklar. Nix altında çalışırken, çalışma zamanı durumu ve yapılandırmanın değişmez store dışında kalması için bunları açıkça Nix tarafından yönetilen konumlara ayarlayın.

| Değişken               | Varsayılan                              |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Hizmet PATH keşfi

launchd/systemd Gateway hizmeti, Plugin'lerin ve `nix` ile kurulmuş yürütülebilirleri kabuk üzerinden çağıran araçların elle PATH ayarı yapmadan çalışması için Nix profili ikililerini otomatik olarak keşfeder:

- `NIX_PROFILES` ayarlandığında her giriş, sağdan sola öncelik sırasıyla hizmet PATH'ine eklenir (Nix kabuk önceliğiyle eşleşir - en sağdaki kazanır).
- `NIX_PROFILES` ayarlı olmadığında, yedek olarak `~/.nix-profile/bin` eklenir.

Bu, hem macOS launchd hem de Linux systemd hizmet ortamları için geçerlidir.

## İlgili

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Doğruluk kaynağı Home Manager modülü ve tam kurulum kılavuzu.
  </Card>
  <Card title="Kurulum sihirbazı" href="/tr/start/wizard" icon="wand-magic-sparkles">
    Nix dışı CLI kurulum adım adım açıklaması.
  </Card>
  <Card title="Docker" href="/tr/install/docker" icon="docker">
    Nix dışı alternatif olarak container tabanlı kurulum.
  </Card>
  <Card title="Güncelleme" href="/tr/install/updating" icon="arrow-up-right-from-square">
    Home Manager tarafından yönetilen kurulumları paketle birlikte güncelleme.
  </Card>
</CardGroup>
