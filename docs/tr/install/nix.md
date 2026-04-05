---
read_when:
    - Tekrarlanabilir, geri alınabilir kurulumlar istiyorsunuz
    - Zaten Nix/NixOS/Home Manager kullanıyorsunuz
    - Her şeyin sabitlenmiş ve bildirime dayalı olarak yönetilmesini istiyorsunuz
summary: OpenClaw’ı Nix ile bildirime dayalı olarak kurun
title: Nix
x-i18n:
    generated_at: "2026-04-05T13:57:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e1e73533db1350d82d3a786092b4328121a082dfeeedee7c7574021dada546
    source_path: install/nix.md
    workflow: 15
---

# Nix kurulumu

OpenClaw’ı **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** ile bildirime dayalı olarak kurun -- her şey dahil bir Home Manager modülü.

<Info>
Nix kurulumu için doğruluk kaynağı [nix-openclaw](https://github.com/openclaw/nix-openclaw) reposudur. Bu sayfa hızlı bir genel bakıştır.
</Info>

## Elde edecekleriniz

- Gateway + macOS uygulaması + araçlar (whisper, spotify, kameralar) -- hepsi sabitlenmiş
- Yeniden başlatmalardan sonra da çalışan Launchd hizmeti
- Bildirime dayalı yapılandırmaya sahip plugin sistemi
- Anında geri alma: `home-manager switch --rollback`

## Hızlı başlangıç

<Steps>
  <Step title="Determinate Nix kurun">
    Nix henüz kurulu değilse [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer) yönergelerini izleyin.
  </Step>
  <Step title="Yerel bir flake oluşturun">
    nix-openclaw reposundaki agent-first şablonunu kullanın:
    ```bash
    mkdir -p ~/code/openclaw-local
    # templates/agent-first/flake.nix dosyasını nix-openclaw reposundan kopyalayın
    ```
  </Step>
  <Step title="Gizli bilgileri yapılandırın">
    Mesajlaşma bot token’ınızı ve model provider API key’inizi ayarlayın. `~/.secrets/` altındaki düz dosyalar gayet uygundur.
  </Step>
  <Step title="Şablon yer tutucularını doldurun ve switch çalıştırın">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Doğrulayın">
    Launchd hizmetinin çalıştığını ve botunuzun mesajlara yanıt verdiğini doğrulayın.
  </Step>
</Steps>

Tam modül seçenekleri ve örnekler için [nix-openclaw README](https://github.com/openclaw/nix-openclaw) dosyasına bakın.

## Nix Mode çalışma zamanı davranışı

`OPENCLAW_NIX_MODE=1` ayarlandığında (nix-openclaw ile otomatik olarak), OpenClaw otomatik kurulum akışlarını devre dışı bırakan deterministik bir moda girer.

Bunu el ile de ayarlayabilirsiniz:

```bash
export OPENCLAW_NIX_MODE=1
```

macOS üzerinde GUI uygulaması kabuk ortam değişkenlerini otomatik olarak devralmaz. Bunun yerine defaults aracılığıyla Nix mode’u etkinleştirin:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix mode’da neler değişir

- Otomatik kurulum ve kendini değiştirme akışları devre dışı bırakılır
- Eksik bağımlılıklar Nix’e özgü düzeltme mesajları gösterir
- UI, salt okunur bir Nix mode başlığı gösterir

### Yapılandırma ve durum yolları

OpenClaw, JSON5 yapılandırmasını `OPENCLAW_CONFIG_PATH` içinden okur ve değiştirilebilir verileri `OPENCLAW_STATE_DIR` içinde depolar. Nix altında çalışırken, çalışma zamanı durumu ve yapılandırma değiştirilemez store dışında kalsın diye bunları Nix tarafından yönetilen konumlara açıkça ayarlayın.

| Değişken               | Varsayılan                              |
| ---------------------- | -------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                          |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`    |

## İlgili

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- tam kurulum kılavuzu
- [Wizard](/start/wizard) -- Nix olmayan CLI kurulumu
- [Docker](/install/docker) -- kapsayıcılı kurulum
