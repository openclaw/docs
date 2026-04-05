---
read_when:
    - Getting Started hızlı başlangıcı dışında bir kurulum yöntemine ihtiyacınız varsa
    - Bir bulut platformuna dağıtım yapmak istiyorsanız
    - Güncelleme, geçiş veya kaldırma yapmanız gerekiyorsa
summary: OpenClaw kurulumu — kurulum betiği, npm/pnpm/bun, kaynaktan, Docker ve daha fazlası
title: Kurulum
x-i18n:
    generated_at: "2026-04-05T13:57:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: eca17c76a2a66166b3d8cda9dc3144ab920d30ad0ed2a220eb9389d7a383ba5d
    source_path: install/index.md
    workflow: 15
---

# Kurulum

## Önerilen: kurulum betiği

Kurmanın en hızlı yolu. İşletim sisteminizi algılar, gerekirse Node kurar, OpenClaw'ı kurar ve onboarding'i başlatır.

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

Onboarding'i çalıştırmadan kurmak için:

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

Tüm bayraklar ve CI/otomasyon seçenekleri için bkz. [Installer internals](/install/installer).

## Sistem gereksinimleri

- **Node 24** (önerilir) veya Node 22.14+ — kurulum betiği bunu otomatik olarak halleder
- **macOS, Linux veya Windows** — hem yerel Windows hem de WSL2 desteklenir; WSL2 daha kararlıdır. Bkz. [Windows](/platforms/windows).
- `pnpm` yalnızca kaynaktan derleme yapıyorsanız gerekir

## Alternatif kurulum yöntemleri

### Yerel önek kurucusu (`install-cli.sh`)

OpenClaw ve Node'u sistem geneline kurulmuş bir Node'a bağımlı olmadan
`~/.openclaw` gibi yerel bir önek altında tutmak istiyorsanız bunu kullanın:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Varsayılan olarak npm kurulumlarını ve aynı
önek akışı altında git checkout kurulumlarını destekler. Tam başvuru: [Installer internals](/install/installer#install-clish).

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
    pnpm, derleme betikleri içeren paketler için açık onay gerektirir. İlk kurulumdan sonra `pnpm approve-builds -g` çalıştırın.
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

<Accordion title="Sorun giderme: sharp derleme hataları (npm)">
  `sharp`, global olarak kurulmuş bir libvips nedeniyle başarısız olursa:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Kaynaktan

Katkıda bulunanlar veya yerel checkout üzerinden çalıştırmak isteyen herkes için:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```

Veya link vermeyi atlayıp depo içinden `pnpm openclaw ...` kullanın. Tam geliştirme akışları için [Setup](/start/setup) bölümüne bakın.

### GitHub main üzerinden kurulum

```bash
npm install -g github:openclaw/openclaw#main
```

### Kapsayıcılar ve paket yöneticileri

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    Kapsayıcılaştırılmış veya headless dağıtımlar.
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    Docker'a rootless kapsayıcı alternatifi.
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Nix flake üzerinden bildirime dayalı kurulum.
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    Otomatik filo sağlama.
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    Bun çalışma zamanı üzerinden yalnızca CLI kullanımı.
  </Card>
</CardGroup>

## Kurulumu doğrulayın

```bash
openclaw --version      # CLI kullanılabilir mi doğrula
openclaw doctor         # config sorunlarını denetle
openclaw gateway status # Gateway'in çalıştığını doğrula
```

Kurulumdan sonra yönetilen başlatma istiyorsanız:

- macOS: `openclaw onboard --install-daemon` veya `openclaw gateway install` ile LaunchAgent
- Linux/WSL2: aynı komutlarla systemd kullanıcı hizmeti
- Yerel Windows: önce Scheduled Task, görev oluşturma reddedilirse kullanıcı başına Startup-folder oturum açma öğesi yedeği

## Barındırma ve dağıtım

OpenClaw'ı bir bulut sunucusunda veya VPS üzerinde dağıtın:

<CardGroup cols={3}>
  <Card title="VPS" href="/vps">Herhangi bir Linux VPS</Card>
  <Card title="Docker VM" href="/install/docker-vm-runtime">Paylaşılan Docker adımları</Card>
  <Card title="Kubernetes" href="/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/install/azure">Azure</Card>
  <Card title="Railway" href="/install/railway">Railway</Card>
  <Card title="Render" href="/install/render">Render</Card>
  <Card title="Northflank" href="/install/northflank">Northflank</Card>
</CardGroup>

## Güncelleme, geçiş veya kaldırma

<CardGroup cols={3}>
  <Card title="Updating" href="/install/updating" icon="refresh-cw">
    OpenClaw'ı güncel tutun.
  </Card>
  <Card title="Migrating" href="/install/migrating" icon="arrow-right">
    Yeni bir makineye taşıyın.
  </Card>
  <Card title="Uninstall" href="/install/uninstall" icon="trash-2">
    OpenClaw'ı tamamen kaldırın.
  </Card>
</CardGroup>

## Sorun giderme: `openclaw` bulunamadı

Kurulum başarılı olduysa ancak terminalinizde `openclaw` bulunamıyorsa:

```bash
node -v           # Node kurulu mu?
npm prefix -g     # Global paketler nerede?
echo "$PATH"      # Global bin dizini PATH içinde mi?
```

`$(npm prefix -g)/bin`, `$PATH` içinde değilse bunu kabuk başlangıç dosyanıza (`~/.zshrc` veya `~/.bashrc`) ekleyin:

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Ardından yeni bir terminal açın. Daha fazla ayrıntı için [Node setup](/install/node) bölümüne bakın.
