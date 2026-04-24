---
read_when:
    - Você precisa de um método de instalação diferente do início rápido de Primeiros passos
    - Você quer implantar em uma plataforma de nuvem
    - Você precisa atualizar, migrar ou desinstalar
summary: Instalar o OpenClaw — script de instalação, npm/pnpm/bun, do código-fonte, Docker e mais
title: Instalar
x-i18n:
    generated_at: "2026-04-24T05:58:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48cb531ff09cd9ba076e5a995753c6acd5273f58d9d0f1e51010bf77a18bf85e
    source_path: install/index.md
    workflow: 15
---

## Requisitos do sistema

- **Node 24** (recomendado) ou Node 22.14+ — o script de instalação cuida disso automaticamente
- **macOS, Linux ou Windows** — tanto Windows nativo quanto WSL2 são compatíveis; WSL2 é mais estável. Consulte [Windows](/pt-BR/platforms/windows).
- `pnpm` só é necessário se você compilar a partir do código-fonte

## Recomendado: script de instalação

A forma mais rápida de instalar. Ele detecta seu SO, instala Node se necessário, instala OpenClaw e inicia o onboarding.

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

Para todas as flags e opções de CI/automação, consulte [Internals do instalador](/pt-BR/install/installer).

## Métodos alternativos de instalação

### Instalador com prefixo local (`install-cli.sh`)

Use isto quando você quiser manter OpenClaw e Node sob um prefixo local como
`~/.openclaw`, sem depender de uma instalação de Node em todo o sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Ele oferece suporte a instalações via npm por padrão, além de instalações por checkout git sob o mesmo
fluxo de prefixo. Referência completa: [Internals do instalador](/pt-BR/install/installer#install-clish).

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

<Accordion title="Solução de problemas: erros de build do sharp (npm)">
  Se `sharp` falhar devido a uma libvips instalada globalmente:

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

Ou ignore o link e use `pnpm openclaw ...` de dentro do repositório. Consulte [Configuração](/pt-BR/start/setup) para fluxos completos de desenvolvimento.

### Instalar do GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Contêineres e gerenciadores de pacotes

<CardGroup cols={2}>
  <Card title="Docker" href="/pt-BR/install/docker" icon="container">
    Implantações em contêiner ou headless.
  </Card>
  <Card title="Podman" href="/pt-BR/install/podman" icon="container">
    Alternativa rootless ao Docker.
  </Card>
  <Card title="Nix" href="/pt-BR/install/nix" icon="snowflake">
    Instalação declarativa via Nix flake.
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
openclaw --version      # confirma que a CLI está disponível
openclaw doctor         # verifica problemas de configuração
openclaw gateway status # verifica se o Gateway está em execução
```

Se você quiser inicialização gerenciada após a instalação:

- macOS: LaunchAgent via `openclaw onboard --install-daemon` ou `openclaw gateway install`
- Linux/WSL2: serviço de usuário systemd pelos mesmos comandos
- Windows nativo: Tarefa Agendada primeiro, com fallback para um item de login na pasta Inicializar por usuário se a criação da tarefa for negada

## Hospedagem e implantação

Implante o OpenClaw em um servidor na nuvem ou VPS:

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
    Mover para uma nova máquina.
  </Card>
  <Card title="Desinstalar" href="/pt-BR/install/uninstall" icon="trash-2">
    Remover completamente o OpenClaw.
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
