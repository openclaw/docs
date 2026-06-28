---
read_when:
    - Başlarken hızlı başlangıç kılavuzu dışında bir kurulum yöntemine ihtiyacınız var
    - Bir bulut platformuna dağıtmak istiyorsunuz
    - Güncellemeniz, geçirmeniz veya kaldırmanız gerekir
summary: OpenClaw'ı yükleyin - yükleyici betiği, npm/pnpm/bun, kaynak koddan, Docker ve daha fazlası
title: Kurulum
x-i18n:
    generated_at: "2026-06-28T00:43:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## Sistem gereksinimleri

- **Node 24** (önerilir) veya Node 22.19+ - kurulum betiği bunu otomatik olarak halleder
- **macOS, Linux veya Windows** - Windows kullanıcıları yerel Windows Hub uygulaması, PowerShell CLI kurucusu veya WSL2 Gateway ile başlayabilir. Bkz. [Windows](/tr/platforms/windows).
- `pnpm` yalnızca kaynaktan derleme yaparsanız gerekir

## Önerilen: kurulum betiği

Kurmanın en hızlı yolu. İşletim sisteminizi algılar, gerekirse Node kurar, OpenClaw kurar ve ilk yapılandırmayı başlatır.

<Note>
Windows masaüstü kullanıcıları ayrıca kurulum, tepsi durumu, sohbet, düğüm modu ve yerel MCP modunu içeren yerel [Windows Hub](/tr/platforms/windows#recommended-windows-hub) yardımcı uygulamasını kurabilir.
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

İlk yapılandırmayı çalıştırmadan kurmak için:

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

Tüm bayraklar ve CI/otomasyon seçenekleri için bkz. [Kurucu iç yapısı](/tr/install/installer).

## Alternatif kurulum yöntemleri

### Yerel önek kurucusu (`install-cli.sh`)

Sistem genelindeki bir Node kurulumuna bağlı kalmadan OpenClaw ve Node'un
`~/.openclaw` gibi yerel bir önek altında tutulmasını istediğinizde bunu kullanın:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Varsayılan olarak npm kurulumlarını ve aynı önek akışı altında git checkout
kurulumlarını destekler. Tam başvuru: [Kurucu iç yapısı](/tr/install/installer#install-clish).

Zaten kurulu mu? Paket ve git kurulumları arasında `openclaw update --channel dev` ve `openclaw update --channel stable` ile geçiş yapın. Bkz.
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
    Barındırılan kurucu, OpenClaw paket kurulumu için `min-release-age` gibi npm tazelik filtrelerini temizler. npm ile manuel kurulum yaparsanız kendi npm politikanız yine geçerlidir.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm, derleme betikleri olan paketler için açık onay gerektirir. İlk kurulumdan sonra `pnpm approve-builds -g` çalıştırın.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun, global CLI kurulum yolu için desteklenir. Gateway çalışma zamanı için Node önerilen daemon çalışma zamanı olmaya devam eder.
    </Note>

  </Tab>
</Tabs>

### Kaynaktan

Katkıda bulunanlar veya yerel bir checkout'tan çalıştırmak isteyen herkes için:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Ya da bağlantı adımını atlayıp depo içinden `pnpm openclaw ...` kullanın. Tam geliştirme iş akışları için bkz. [Kurulum](/tr/start/setup).

### GitHub main checkout'undan kurulum

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Konteynerler ve paket yöneticileri

<CardGroup cols={2}>
  <Card title="Docker" href="/tr/install/docker" icon="container">
    Konteynerleştirilmiş veya başsız dağıtımlar.
  </Card>
  <Card title="Podman" href="/tr/install/podman" icon="container">
    Docker'a köksüz konteyner alternatifi.
  </Card>
  <Card title="Nix" href="/tr/install/nix" icon="snowflake">
    Nix flake ile bildirime dayalı kurulum.
  </Card>
  <Card title="Ansible" href="/tr/install/ansible" icon="server">
    Otomatik filo hazırlama.
  </Card>
  <Card title="Bun" href="/tr/install/bun" icon="zap">
    Bun çalışma zamanı üzerinden yalnızca CLI kullanımı.
  </Card>
</CardGroup>

## Kurulumu doğrulama

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Kurulumdan sonra yönetilen başlatma istiyorsanız:

- macOS: `openclaw onboard --install-daemon` veya `openclaw gateway install` ile LaunchAgent
- Linux/WSL2: Aynı komutlarla systemd kullanıcı servisi
- Yerel Windows: Önce Zamanlanmış Görev, görev oluşturma reddedilirse kullanıcı başına Startup klasörü oturum açma öğesi yedeği

## Barındırma ve dağıtım

OpenClaw'u bir bulut sunucusuna veya VPS'ye dağıtın:

<CardGroup cols={3}>
  <Card title="VPS" href="/tr/vps">
    Herhangi bir Linux VPS.
  </Card>
  <Card title="Docker VM" href="/tr/install/docker-vm-runtime">
    Paylaşılan Docker adımları.
  </Card>
  <Card title="Kubernetes" href="/tr/install/kubernetes">
    K8s dağıtımı.
  </Card>
  <Card title="Fly.io" href="/tr/install/fly">
    Fly.io üzerinde dağıtın.
  </Card>
  <Card title="Hetzner" href="/tr/install/hetzner">
    Hetzner dağıtımı.
  </Card>
  <Card title="GCP" href="/tr/install/gcp">
    Google Cloud dağıtımı.
  </Card>
  <Card title="Azure" href="/tr/install/azure">
    Azure dağıtımı.
  </Card>
  <Card title="Railway" href="/tr/install/railway">
    Railway dağıtımı.
  </Card>
  <Card title="Render" href="/tr/install/render">
    Render dağıtımı.
  </Card>
  <Card title="Northflank" href="/tr/install/northflank">
    Northflank dağıtımı.
  </Card>
</CardGroup>

## Güncelleme, taşıma veya kaldırma

<CardGroup cols={3}>
  <Card title="Updating" href="/tr/install/updating" icon="refresh-cw">
    OpenClaw'u güncel tutun.
  </Card>
  <Card title="Migrating" href="/tr/install/migrating" icon="arrow-right">
    Yeni bir makineye taşıyın.
  </Card>
  <Card title="Uninstall" href="/tr/install/uninstall" icon="trash-2">
    OpenClaw'u tamamen kaldırın.
  </Card>
</CardGroup>

## Sorun giderme: `openclaw` bulunamadı

Kurulum başarılı olduysa ancak terminalinizde `openclaw` bulunamıyorsa:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

`$(npm prefix -g)/bin`, `$PATH` içinde değilse kabuk başlangıç dosyanıza (`~/.zshrc` veya `~/.bashrc`) ekleyin:

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Ardından yeni bir terminal açın. Daha fazla ayrıntı için bkz. [Node kurulumu](/tr/install/node).
