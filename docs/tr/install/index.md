---
read_when:
    - Başlarken hızlı başlangıcının dışında bir kurulum yöntemine ihtiyacınız var
    - Bir bulut platformuna dağıtmak istiyorsunuz
    - Güncellemeniz, geçiş yapmanız veya kaldırmanız gerekiyor
summary: OpenClaw'ı yükleyin - yükleyici betiği, npm/pnpm/bun, kaynak koddan, Docker ve daha fazlası
title: Kurulum
x-i18n:
    generated_at: "2026-05-06T09:19:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d5b38787ad80f91c82aa1fd4020a11c99f440ccbf2e9b9309da336dd5883462
    source_path: install/index.md
    workflow: 16
---

## Sistem gereksinimleri

- **Node 24** (önerilir) veya Node 22.14+ - yükleyici betiği bunu otomatik olarak halleder
- **macOS, Linux veya Windows** - hem yerel Windows hem de WSL2 desteklenir; WSL2 daha kararlıdır. Bkz. [Windows](/tr/platforms/windows).
- `pnpm` yalnızca kaynaktan derleme yaparsanız gerekir

## Önerilen: yükleyici betiği

Kurmanın en hızlı yolu. İşletim sisteminizi algılar, gerekirse Node yükler, OpenClaw'u kurar ve başlangıç yapılandırmasını başlatır.

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

Başlangıç yapılandırmasını çalıştırmadan kurmak için:

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

Tüm bayraklar ve CI/otomasyon seçenekleri için bkz. [Yükleyici iç ayrıntıları](/tr/install/installer).

## Alternatif kurulum yöntemleri

### Yerel önek yükleyicisi (`install-cli.sh`)

OpenClaw ve Node'un sistem genelindeki bir Node kurulumuna bağlı olmadan
`~/.openclaw` gibi yerel bir önek altında tutulmasını istediğinizde bunu kullanın:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Varsayılan olarak npm kurulumlarını ve aynı önek akışı altında git-checkout
kurulumlarını destekler. Tam başvuru: [Yükleyici iç ayrıntıları](/tr/install/installer#install-clish).

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
    Bun, global CLI kurulum yolu için desteklenir. Gateway çalışma zamanı için Node önerilen artalan hizmeti çalışma zamanı olmaya devam eder.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Troubleshooting: sharp build errors (npm)">
  `sharp`, global olarak kurulmuş libvips nedeniyle başarısız olursa:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Kaynaktan

Katkıda bulunanlar veya yerel bir checkout'tan çalıştırmak isteyen herkes için:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Alternatif olarak link adımını atlayıp depo içinden `pnpm openclaw ...` kullanın. Tam geliştirme iş akışları için bkz. [Kurulum](/tr/start/setup).

### GitHub main dalından kurulum

```bash
npm install -g github:openclaw/openclaw#main
```

### Konteynerler ve paket yöneticileri

<CardGroup cols={2}>
  <Card title="Docker" href="/tr/install/docker" icon="container">
    Konteynerleştirilmiş veya başsız dağıtımlar.
  </Card>
  <Card title="Podman" href="/tr/install/podman" icon="container">
    Docker'a root'suz konteyner alternatifi.
  </Card>
  <Card title="Nix" href="/tr/install/nix" icon="snowflake">
    Nix flake ile bildirimsel kurulum.
  </Card>
  <Card title="Ansible" href="/tr/install/ansible" icon="server">
    Otomatik filo hazırlama.
  </Card>
  <Card title="Bun" href="/tr/install/bun" icon="zap">
    Bun çalışma zamanı üzerinden yalnızca CLI kullanımı.
  </Card>
</CardGroup>

## Kurulumu doğrulayın

```bash
openclaw --version      # CLI'nin kullanılabilir olduğunu doğrulayın
openclaw doctor         # yapılandırma sorunlarını denetleyin
openclaw gateway status # Gateway'in çalıştığını doğrulayın
```

Kurulumdan sonra yönetilen başlatma istiyorsanız:

- macOS: `openclaw onboard --install-daemon` veya `openclaw gateway install` üzerinden LaunchAgent
- Linux/WSL2: aynı komutlar üzerinden systemd kullanıcı hizmeti
- Yerel Windows: Önce Zamanlanmış Görev, görev oluşturma reddedilirse kullanıcı başına Başlangıç klasörü oturum açma öğesi yedeği

## Barındırma ve dağıtım

OpenClaw'u bir bulut sunucusuna veya VPS'e dağıtın:

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
node -v           # Node kurulu mu?
npm prefix -g     # Global paketler nerede?
echo "$PATH"      # Global bin dizini PATH içinde mi?
```

`$(npm prefix -g)/bin`, `$PATH` içinde değilse kabuk başlangıç dosyanıza (`~/.zshrc` veya `~/.bashrc`) ekleyin:

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Ardından yeni bir terminal açın. Daha fazla ayrıntı için bkz. [Node kurulumu](/tr/install/node).
