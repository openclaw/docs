---
read_when:
    - Getting Started hızlı başlangıcının dışında bir kurulum yöntemine ihtiyacınız var
    - Bir bulut platformuna dağıtım yapmak istiyorsunuz
    - Güncellemeniz, taşımanız veya kaldırmanız gerekiyor
summary: OpenClaw'ı kurun — kurulum betiği, npm/pnpm/bun, kaynaktan, Docker ve daha fazlası
title: Kurulum
x-i18n:
    generated_at: "2026-04-26T11:33:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8dc6b9511be6bf9060cc150a7c51daf3b6d556dab4a85910094b4b892145cd7
    source_path: install/index.md
    workflow: 15
---

## Sistem gereksinimleri

- **Node 24** (önerilir) veya Node 22.14+ — kurulum betiği bunu otomatik olarak halleder
- **macOS, Linux veya Windows** — hem yerel Windows hem de WSL2 desteklenir; WSL2 daha kararlıdır. Bkz. [Windows](/tr/platforms/windows).
- `pnpm` yalnızca kaynaktan derleme yaparsanız gerekir

## Önerilen: kurulum betiği

Kurmanın en hızlı yolu. İşletim sisteminizi algılar, gerekirse Node'u kurar, OpenClaw'ı kurar ve eşleştirmeyi başlatır.

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

Eşleştirmeyi çalıştırmadan kurmak için:

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

Tüm bayraklar ve CI/otomasyon seçenekleri için bkz. [Installer internals](/tr/install/installer).

## Alternatif kurulum yöntemleri

### Yerel önek kurucusu (`install-cli.sh`)

OpenClaw ve Node'un sistem geneline kurulu bir Node'a bağlı olmadan
`~/.openclaw` gibi yerel bir önek altında tutulmasını istiyorsanız bunu kullanın:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Varsayılan olarak npm kurulumlarını destekler, ayrıca aynı
önek akışı altında git checkout kurulumlarını da destekler. Tam başvuru: [Installer internals](/tr/install/installer#install-clish).

Zaten kurulu mu? Paket ve git kurulumları arasında
`openclaw update --channel dev` ve `openclaw update --channel stable` ile geçiş yapın. Bkz.
[Güncelleme](/tr/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm veya bun

Node'u zaten kendiniz yönetiyorsanız:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
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
    Bun, genel CLI kurulum yolu için desteklenir. Gateway çalışma zamanı için Node önerilen daemon çalışma zamanı olmaya devam eder.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Sorun giderme: sharp derleme hataları (npm)">
  `sharp`, genel olarak kurulmuş bir libvips nedeniyle başarısız olursa:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Kaynaktan

Katkıda bulunanlar veya yerel bir checkout üzerinden çalıştırmak isteyen herkes için:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Ya da link adımını atlayıp depo içinden `pnpm openclaw ...` kullanın. Tam geliştirme iş akışları için bkz. [Setup](/tr/start/setup).

### GitHub main üzerinden kurulum

```bash
npm install -g github:openclaw/openclaw#main
```

### Container'lar ve paket yöneticileri

<CardGroup cols={2}>
  <Card title="Docker" href="/tr/install/docker" icon="container">
    Container tabanlı veya headless dağıtımlar.
  </Card>
  <Card title="Podman" href="/tr/install/podman" icon="container">
    Docker'a rootsuz container alternatifi.
  </Card>
  <Card title="Nix" href="/tr/install/nix" icon="snowflake">
    Nix flake üzerinden bildirime dayalı kurulum.
  </Card>
  <Card title="Ansible" href="/tr/install/ansible" icon="server">
    Otomatik filo sağlama.
  </Card>
  <Card title="Bun" href="/tr/install/bun" icon="zap">
    Bun çalışma zamanı üzerinden yalnızca CLI kullanımı.
  </Card>
</CardGroup>

## Kurulumu doğrulayın

```bash
openclaw --version      # CLI'nin kullanılabildiğini doğrula
openclaw doctor         # yapılandırma sorunlarını denetle
openclaw gateway status # Gateway'in çalıştığını doğrula
```

Kurulumdan sonra yönetilen başlangıç istiyorsanız:

- macOS: `openclaw onboard --install-daemon` veya `openclaw gateway install` üzerinden LaunchAgent
- Linux/WSL2: aynı komutlar üzerinden systemd kullanıcı hizmeti
- Yerel Windows: önce Scheduled Task, görev oluşturma reddedilirse kullanıcı başına Startup klasörü oturum açma öğesi geri dönüşü

## Barındırma ve dağıtım

OpenClaw'ı bir bulut sunucusuna veya VPS'e dağıtın:

<CardGroup cols={3}>
  <Card title="VPS" href="/tr/vps">Herhangi bir Linux VPS</Card>
  <Card title="Docker VM" href="/tr/install/docker-vm-runtime">Paylaşılan Docker adımları</Card>
  <Card title="Kubernetes" href="/tr/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/tr/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/tr/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/tr/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/tr/install/azure">Azure</Card>
  <Card title="Railway" href="/tr/install/railway">Railway</Card>
  <Card title="Render" href="/tr/install/render">Render</Card>
  <Card title="Northflank" href="/tr/install/northflank">Northflank</Card>
</CardGroup>

## Güncelleyin, taşıyın veya kaldırın

<CardGroup cols={3}>
  <Card title="Güncelleme" href="/tr/install/updating" icon="refresh-cw">
    OpenClaw'ı güncel tutun.
  </Card>
  <Card title="Taşıma" href="/tr/install/migrating" icon="arrow-right">
    Yeni bir makineye taşıyın.
  </Card>
  <Card title="Kaldırma" href="/tr/install/uninstall" icon="trash-2">
    OpenClaw'ı tamamen kaldırın.
  </Card>
</CardGroup>

## Sorun giderme: `openclaw` bulunamadı

Kurulum başarılı olduysa ama terminalinizde `openclaw` bulunamıyorsa:

```bash
node -v           # Node kurulu mu?
npm prefix -g     # Genel paketler nerede?
echo "$PATH"      # Genel bin dizini PATH içinde mi?
```

`$(npm prefix -g)/bin`, `$PATH` içinde değilse bunu kabuk başlangıç dosyanıza (`~/.zshrc` veya `~/.bashrc`) ekleyin:

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Ardından yeni bir terminal açın. Daha fazla ayrıntı için bkz. [Node setup](/tr/install/node).
