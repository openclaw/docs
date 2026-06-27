---
read_when:
    - Você precisa de um método de instalação diferente do guia rápido de Introdução
    - Você quer implantar em uma plataforma de nuvem
    - Você precisa atualizar, migrar ou desinstalar
summary: Instalar o OpenClaw - script instalador, npm/pnpm/bun, a partir do código-fonte, Docker e mais
title: Instalar
x-i18n:
    generated_at: "2026-06-27T17:38:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## Requisitos do sistema

- **Node 24** (recomendado) ou Node 22.19+ - o script de instalação cuida disso automaticamente
- **macOS, Linux ou Windows** - usuários do Windows podem começar com o app Windows Hub nativo, o instalador CLI do PowerShell ou um Gateway WSL2. Consulte [Windows](/pt-BR/platforms/windows).
- `pnpm` só é necessário se você compilar a partir do código-fonte

## Recomendado: script de instalação

A forma mais rápida de instalar. Ele detecta seu sistema operacional, instala o Node se necessário, instala o OpenClaw e inicia a integração inicial.

<Note>
Usuários de desktop Windows também podem instalar o app complementar nativo [Windows Hub](/pt-BR/platforms/windows#recommended-windows-hub), que inclui configuração, status na bandeja, chat, modo Node e modo MCP local.
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

Para instalar sem executar a integração inicial:

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

Para todas as flags e opções de CI/automação, consulte [Internos do instalador](/pt-BR/install/installer).

## Métodos alternativos de instalação

### Instalador de prefixo local (`install-cli.sh`)

Use isto quando quiser manter o OpenClaw e o Node em um prefixo local, como
`~/.openclaw`, sem depender de uma instalação de Node em todo o sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Ele oferece suporte a instalações npm por padrão, além de instalações por checkout do git no mesmo
fluxo de prefixo. Referência completa: [Internos do instalador](/pt-BR/install/installer#install-clish).

Já instalado? Alterne entre instalações por pacote e por git com
`openclaw update --channel dev` e `openclaw update --channel stable`. Consulte
[Atualização](/pt-BR/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm ou bun

Se você já gerencia o Node por conta própria:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    O instalador hospedado limpa filtros de atualização do npm, como `min-release-age`,
    para a instalação do pacote OpenClaw. Se você instalar manualmente com npm, sua própria
    política do npm ainda se aplica.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    O pnpm exige aprovação explícita para pacotes com scripts de build. Execute `pnpm approve-builds -g` após a primeira instalação.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    O Bun é compatível com o caminho de instalação global da CLI. Para o runtime do Gateway, o Node continua sendo o runtime de daemon recomendado.
    </Note>

  </Tab>
</Tabs>

### A partir do código-fonte

Para contribuidores ou qualquer pessoa que queira executar a partir de um checkout local:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Ou pule o link e use `pnpm openclaw ...` de dentro do repositório. Consulte [Configuração](/pt-BR/start/setup) para fluxos de trabalho de desenvolvimento completos.

### Instalar a partir do checkout main do GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Contêineres e gerenciadores de pacotes

<CardGroup cols={2}>
  <Card title="Docker" href="/pt-BR/install/docker" icon="container">
    Implantações em contêiner ou sem interface gráfica.
  </Card>
  <Card title="Podman" href="/pt-BR/install/podman" icon="container">
    Alternativa sem root ao Docker para contêineres.
  </Card>
  <Card title="Nix" href="/pt-BR/install/nix" icon="snowflake">
    Instalação declarativa via flake do Nix.
  </Card>
  <Card title="Ansible" href="/pt-BR/install/ansible" icon="server">
    Provisionamento automatizado de frota.
  </Card>
  <Card title="Bun" href="/pt-BR/install/bun" icon="zap">
    Uso somente da CLI via runtime Bun.
  </Card>
</CardGroup>

## Verificar a instalação

```bash
openclaw --version      # confirme que a CLI está disponível
openclaw doctor         # verifique problemas de configuração
openclaw gateway status # verifique se o Gateway está em execução
```

Se você quiser inicialização gerenciada após a instalação:

- macOS: LaunchAgent via `openclaw onboard --install-daemon` ou `openclaw gateway install`
- Linux/WSL2: serviço de usuário systemd via os mesmos comandos
- Windows nativo: Scheduled Task primeiro, com fallback para item de login na pasta Startup por usuário se a criação da tarefa for negada

## Hospedagem e implantação

Implante o OpenClaw em um servidor na nuvem ou VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/pt-BR/vps">
    Qualquer VPS Linux.
  </Card>
  <Card title="VM Docker" href="/pt-BR/install/docker-vm-runtime">
    Etapas compartilhadas do Docker.
  </Card>
  <Card title="Kubernetes" href="/pt-BR/install/kubernetes">
    Implantação K8s.
  </Card>
  <Card title="Fly.io" href="/pt-BR/install/fly">
    Implante na Fly.io.
  </Card>
  <Card title="Hetzner" href="/pt-BR/install/hetzner">
    Implantação na Hetzner.
  </Card>
  <Card title="GCP" href="/pt-BR/install/gcp">
    Implantação no Google Cloud.
  </Card>
  <Card title="Azure" href="/pt-BR/install/azure">
    Implantação no Azure.
  </Card>
  <Card title="Railway" href="/pt-BR/install/railway">
    Implantação na Railway.
  </Card>
  <Card title="Render" href="/pt-BR/install/render">
    Implantação na Render.
  </Card>
  <Card title="Northflank" href="/pt-BR/install/northflank">
    Implantação na Northflank.
  </Card>
</CardGroup>

## Atualizar, migrar ou desinstalar

<CardGroup cols={3}>
  <Card title="Atualização" href="/pt-BR/install/updating" icon="refresh-cw">
    Mantenha o OpenClaw atualizado.
  </Card>
  <Card title="Migração" href="/pt-BR/install/migrating" icon="arrow-right">
    Migre para uma nova máquina.
  </Card>
  <Card title="Desinstalar" href="/pt-BR/install/uninstall" icon="trash-2">
    Remova o OpenClaw completamente.
  </Card>
</CardGroup>

## Solução de problemas: `openclaw` não encontrado

Se a instalação foi concluída, mas `openclaw` não é encontrado no seu terminal:

```bash
node -v           # Node instalado?
npm prefix -g     # Onde estão os pacotes globais?
echo "$PATH"      # O diretório bin global está no PATH?
```

Se `$(npm prefix -g)/bin` não estiver no seu `$PATH`, adicione-o ao arquivo de inicialização do seu shell (`~/.zshrc` ou `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Depois, abra um novo terminal. Consulte [Configuração do Node](/pt-BR/install/node) para mais detalhes.
