---
read_when:
    - Başlarken hızlı başlangıcından farklı bir kurulum yöntemine ihtiyacınız var
    - Bir bulut platformuna dağıtım yapmak istiyorsunuz
    - Güncellemeniz, taşımanız veya kaldırmanız gerekir
summary: OpenClaw'ı yükleme - yükleyici betiği, npm/pnpm/bun, kaynak koddan, Docker ve daha fazlası
title: Yükle
x-i18n:
    generated_at: "2026-07-16T17:33:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc6c6c33294852c90d2d2904b78ff8b0483b8e72a380d5835c5bdda67547de0c
    source_path: install/index.md
    workflow: 16
---

## Sistem gereksinimleri

- **Node 22.22.3+, 24.15+ veya 25.9+** - Varsayılan hedef Node 24'tür; yükleyici betiği bunu otomatik olarak halleder.
- **macOS, Linux veya Windows** - Windows kullanıcıları yerel Windows Hub uygulaması, PowerShell CLI yükleyicisi veya WSL2 Gateway ile başlayabilir. Bkz. [Windows](/tr/platforms/windows).
- `pnpm` yalnızca kaynaktan derleme yapıyorsanız gereklidir.

## Önerilen: yükleyici betiği

En hızlı yükleme yöntemidir. İşletim sisteminizi algılar, gerekirse Node'u yükler, OpenClaw'u yükler ve ilk kurulumu başlatır.

<Note>
Windows masaüstü kullanıcıları; kurulum, sistem tepsisi durumu, sohbet, node modu ve yerel MCP modu içeren yerel [Windows Hub](/tr/platforms/windows#recommended-windows-hub) yardımcı uygulamasını da yükleyebilir.
</Note>

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

İlk kurulumu çalıştırmadan yüklemek için:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

Tüm bayraklar ve CI/otomasyon seçenekleri için [Yükleyicinin işleyişi](/tr/install/installer) bölümüne bakın.

## Alternatif yükleme yöntemleri

### Yerel önek yükleyicisi (`install-cli.sh`)

OpenClaw ve Node'u sistem genelindeki bir Node kurulumuna bağlı olmadan
`~/.openclaw` gibi yerel bir önek altında tutmak istediğinizde bunu kullanın:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Varsayılan olarak npm yüklemelerini ve aynı önek akışı altında git çalışma kopyası
yüklemelerini destekler. Tam başvuru: [Yükleyicinin işleyişi](/tr/install/installer#install-clish).

Zaten yüklü mü? `openclaw update --channel dev` ve `openclaw update --channel stable` ile paket ve git
yüklemeleri arasında geçiş yapın. Bkz.
[Güncelleme](/tr/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm veya bun

Node'u zaten kendiniz yönetiyorsanız:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Barındırılan yükleyici, OpenClaw paketinin yüklenmesi için `min-release-age`
    gibi npm güncellik filtrelerini temizler. npm ile elle yükleme yaparsanız kendi
    npm politikanız geçerliliğini korur.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm, derleme betikleri içeren paketler için açık onay gerektirir. İlk yüklemeden sonra `pnpm approve-builds -g` komutunu çalıştırın.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun global paketi yükleyebilir ancak OpenClaw durumu `node:sqlite` kullandığından ortaya çıkan `openclaw` yürütülebilir dosyası, desteklenen bir Node çalışma zamanı gerektirir.
    </Note>

  </Tab>
</Tabs>

### Kaynaktan

Katkıda bulunanlar veya yerel bir çalışma kopyasından çalıştırmak isteyenler için:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Alternatif olarak bağlantı oluşturmayı atlayıp depo içinden `pnpm openclaw ...` kullanın. Eksiksiz geliştirme iş akışları için [Kurulum](/tr/start/setup) bölümüne bakın.

### GitHub ana dal çalışma kopyasından yükleme

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Kapsayıcılar ve paket yöneticileri

<CardGroup cols={2}>
  <Card title="Docker" href="/tr/install/docker" icon="container">
    Kapsayıcı tabanlı veya ekransız dağıtımlar.
  </Card>
  <Card title="Podman" href="/tr/install/podman" icon="container">
    Docker'a kök ayrıcalığı gerektirmeyen kapsayıcı alternatifi.
  </Card>
  <Card title="Nix" href="/tr/install/nix" icon="snowflake">
    Nix flake aracılığıyla bildirimsel yükleme.
  </Card>
  <Card title="Ansible" href="/tr/install/ansible" icon="server">
    Otomatik filo hazırlama.
  </Card>
  <Card title="Bun" href="/tr/install/bun" icon="zap">
    İsteğe bağlı bağımlılık yükleyicisi ve paket betiği çalıştırıcısı.
  </Card>
</CardGroup>

## Yüklemeyi doğrulama

```bash
openclaw --version      # CLI'nin kullanılabilir olduğunu doğrulayın
openclaw doctor         # yapılandırma sorunlarını denetleyin
openclaw gateway status # Gateway'in çalıştığını doğrulayın
```

Yüklemeden sonra yönetilen başlatma istiyorsanız:

- macOS: `openclaw onboard --install-daemon` veya `openclaw gateway install` aracılığıyla LaunchAgent
- Linux/WSL2: aynı komutlar aracılığıyla systemd kullanıcı hizmeti
- Yerel Windows: Önce Scheduled Task; görev oluşturma reddedilirse kullanıcıya özel Startup klasörü oturum açma öğesi yedeği

## Barındırma ve dağıtım

OpenClaw'u bir bulut sunucusuna veya VPS'ye dağıtın. Eksiksiz sağlayıcı seçicisi
(DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway, Northflank,
Oracle Cloud, Raspberry Pi ve diğerleri) için [Linux sunucusu](/tr/vps) bölümüne
bakın veya [Render](/tr/install/render) üzerinde bildirimsel olarak dağıtın.

<CardGroup cols={3}>
  <Card title="VPS" href="/tr/vps">
    Bir sağlayıcı seçin.
  </Card>
  <Card title="Docker VM" href="/tr/install/docker-vm-runtime">
    Paylaşılan Docker adımları.
  </Card>
  <Card title="Kubernetes" href="/tr/install/kubernetes">
    K8s dağıtımı.
  </Card>
</CardGroup>

## Güncelleme, taşıma veya kaldırma

<CardGroup cols={3}>
  <Card title="Güncelleme" href="/tr/install/updating" icon="refresh-cw">
    OpenClaw'u güncel tutun.
  </Card>
  <Card title="Taşıma" href="/tr/install/migrating" icon="arrow-right">
    Yeni bir makineye taşıyın.
  </Card>
  <Card title="Kaldırma" href="/tr/install/uninstall" icon="trash-2">
    OpenClaw'u tamamen kaldırın.
  </Card>
</CardGroup>

## Sorun giderme: `openclaw` bulunamadı

Bu neredeyse her zaman bir PATH sorunudur: npm'in global bin dizini, kabuğunuzun `PATH` değişkeninde değildir. Windows yolu da dahil olmak üzere çözümün tamamı için [Node.js sorun giderme](/tr/install/node#troubleshooting) bölümüne bakın.

```bash
node -v           # Node yüklü mü?
npm prefix -g     # Global paketler nerede?
echo "$PATH"      # Global bin dizini PATH içinde mi?
```
