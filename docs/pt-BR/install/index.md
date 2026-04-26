---
read_when:
    - Você precisa de um método de instalação diferente do início rápido de Primeiros passos
    - Você quer implantar em uma plataforma de nuvem
    - Você precisa atualizar, migrar ou desinstalar
summary: Instalar o OpenClaw — script de instalação, npm/pnpm/bun, do código-fonte, Docker e mais
title: Instalar
x-i18n:
    generated_at: "2026-04-26T11:32:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8dc6b9511be6bf9060cc150a7c51daf3b6d556dab4a85910094b4b892145cd7
    source_path: install/index.md
    workflow: 15
---

## Requisitos do sistema

- **Node 24** (recomendado) ou Node 22.14+ — o script do instalador cuida disso automaticamente
- **macOS, Linux ou Windows** — tanto Windows nativo quanto WSL2 são compatíveis; WSL2 é mais estável. Consulte [Windows](/pt-BR/platforms/windows).
- `pnpm` só é necessário se você compilar a partir do código-fonte

## Recomendado: script do instalador

A forma mais rápida de instalar. Ele detecta seu SO, instala o Node se necessário, instala o OpenClaw e inicia o onboarding.

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

Para instalar sem executar o onboarding:

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

Para todos os flags e opções de CI/automação, consulte [Detalhes internos do instalador](/pt-BR/install/installer).

## Métodos alternativos de instalação

### Instalador com prefixo local (`install-cli.sh`)

Use isto quando quiser manter o OpenClaw e o Node sob um prefixo local como
`~/.openclaw`, sem depender de uma instalação do Node em todo o sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Ele oferece suporte a instalações npm por padrão, além de instalações por checkout git dentro do mesmo
fluxo de prefixo. Referência completa: [Detalhes internos do instalador](/pt-BR/install/installer#install-clish).

Já instalou? Alterne entre instalações por pacote e por git com
`openclaw update --channel dev` e `openclaw update --channel stable`. Consulte
[Atualizando](/pt-BR/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm ou bun

Se você já gerencia o Node por conta própria:

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
    pnpm exige aprovação explícita para pacotes com scripts de build. Execute `pnpm approve-builds -g` após a primeira instalação.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun é compatível com o caminho de instalação global da CLI. Para o runtime do Gateway, Node continua sendo o runtime de daemon recomendado.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Solução de problemas: erros de build do sharp (npm)">
  Se `sharp` falhar devido a um libvips instalado globalmente:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### A partir do código-fonte

Para contribuidores ou qualquer pessoa que queira executar a partir de um checkout local:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Ou ignore o link e use `pnpm openclaw ...` de dentro do repositório. Consulte [Setup](/pt-BR/start/setup) para os fluxos completos de desenvolvimento.

### Instalar a partir do main do GitHub

```bash
npm install -g github:openclaw/openclaw#main
```

### Contêineres e gerenciadores de pacotes

<CardGroup cols={2}>
  <Card title="Docker" href="/pt-BR/install/docker" icon="container">
    Implantações em contêiner ou headless.
  </Card>
  <Card title="Podman" href="/pt-BR/install/podman" icon="container">
    Alternativa rootless ao Docker para contêineres.
  </Card>
  <Card title="Nix" href="/pt-BR/install/nix" icon="snowflake">
    Instalação declarativa via flake do Nix.
  </Card>
  <Card title="Ansible" href="/pt-BR/install/ansible" icon="server">
    Provisionamento automatizado de frota.
  </Card>
  <Card title="Bun" href="/pt-BR/install/bun" icon="zap">
    Uso apenas da CLI via runtime Bun.
  </Card>
</CardGroup>

## Verifique a instalação

```bash
openclaw --version      # confirme que a CLI está disponível
openclaw doctor         # verifique problemas de configuração
openclaw gateway status # verifique se o Gateway está em execução
```

Se você quiser inicialização gerenciada após a instalação:

- macOS: LaunchAgent via `openclaw onboard --install-daemon` ou `openclaw gateway install`
- Linux/WSL2: serviço systemd de usuário pelos mesmos comandos
- Windows nativo: Scheduled Task primeiro, com fallback para um item de login na pasta Startup por usuário se a criação da tarefa for negada

## Hospedagem e implantação

Implante o OpenClaw em um servidor em nuvem ou VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/pt-BR/vps">Qualquer VPS Linux</Card>
  <Card title="Docker VM" href="/pt-BR/install/docker-vm-runtime">Etapas compartilhadas do Docker</Card>
  <Card title="Kubernetes" href="/pt-BR/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/pt-BR/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/pt-BR/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/pt-BR/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/pt-BR/install/azure">Azure</Card>
  <Card title="Railway" href="/pt-BR/install/railway">Railway</Card>
  <Card title="Render" href="/pt-BR/install/render">Render</Card>
  <Card title="Northflank" href="/pt-BR/install/northflank">Northflank</Card>
</CardGroup>

## Atualizar, migrar ou desinstalar

<CardGroup cols={3}>
  <Card title="Atualizando" href="/pt-BR/install/updating" icon="refresh-cw">
    Mantenha o OpenClaw atualizado.
  </Card>
  <Card title="Migrando" href="/pt-BR/install/migrating" icon="arrow-right">
    Mude para uma nova máquina.
  </Card>
  <Card title="Desinstalar" href="/pt-BR/install/uninstall" icon="trash-2">
    Remova o OpenClaw completamente.
  </Card>
</CardGroup>

## Solução de problemas: `openclaw` não encontrado

Se a instalação foi bem-sucedida, mas `openclaw` não for encontrado no terminal:

```bash
node -v           # Node instalado?
npm prefix -g     # Onde estão os pacotes globais?
echo "$PATH"      # O diretório global bin está no PATH?
```

Se `$(npm prefix -g)/bin` não estiver no seu `$PATH`, adicione-o ao arquivo de inicialização do shell (`~/.zshrc` ou `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Depois abra um novo terminal. Consulte [Configuração do Node](/pt-BR/install/node) para mais detalhes.
