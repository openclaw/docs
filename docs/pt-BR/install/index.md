---
read_when:
    - Você precisa de um método de instalação diferente do guia de início rápido de Primeiros Passos
    - Você quer implantar em uma plataforma de nuvem
    - Você precisa atualizar, migrar ou desinstalar
summary: Instale o OpenClaw — script de instalação, npm/pnpm/bun, a partir do código-fonte, Docker e muito mais
title: Instalar
x-i18n:
    generated_at: "2026-07-12T15:21:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cc819cc6c1d57af0739a7d11f0f2834479ddabbca0571b105b8cb9325e87b145
    source_path: install/index.md
    workflow: 16
---

## Requisitos do sistema

- **Node 22.19+, 23.11+ ou 24+** - Node 24 é o destino padrão; o script de instalação cuida disso automaticamente.
- **macOS, Linux ou Windows** - Usuários do Windows podem começar pelo aplicativo nativo Windows Hub, pelo instalador da CLI para PowerShell ou por um Gateway no WSL2. Consulte [Windows](/pt-BR/platforms/windows).
- `pnpm` só é necessário se você compilar a partir do código-fonte.

## Recomendado: script de instalação

A maneira mais rápida de instalar. Ele detecta seu sistema operacional, instala o Node se necessário, instala o OpenClaw e inicia a configuração inicial.

<Note>
Usuários do Windows para desktop também podem instalar o aplicativo complementar nativo [Windows Hub](/pt-BR/platforms/windows#recommended-windows-hub), que inclui configuração, status na bandeja, chat, modo Node e modo MCP local.
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

Para instalar sem executar a configuração inicial:

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

Para todas as opções e alternativas de CI/automação, consulte [Detalhes internos do instalador](/pt-BR/install/installer).

## Métodos alternativos de instalação

### Instalador com prefixo local (`install-cli.sh`)

Use esta opção quando quiser manter o OpenClaw e o Node em um prefixo local, como
`~/.openclaw`, sem depender de uma instalação do Node em todo o sistema:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Por padrão, ele oferece suporte a instalações via npm, além de instalações por checkout do git no mesmo
fluxo de prefixo. Referência completa: [Detalhes internos do instalador](/pt-BR/install/installer#install-clish).

Já instalou? Alterne entre instalações por pacote e git com
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
    O instalador hospedado ignora filtros de atualidade do npm, como `min-release-age`,
    durante a instalação do pacote OpenClaw. Se você instalar manualmente com o npm, sua própria
    política do npm continuará sendo aplicada.
    </Note>

  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    O pnpm exige aprovação explícita para pacotes com scripts de compilação. Execute `pnpm approve-builds -g` após a primeira instalação.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    O Bun é compatível com o caminho de instalação global da CLI. Para o ambiente de execução do Gateway, o Node continua sendo o ambiente recomendado para o daemon.
    </Note>

  </Tab>
</Tabs>

### A partir do código-fonte

Para colaboradores ou qualquer pessoa que queira executar a partir de um checkout local:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Como alternativa, pule a vinculação e use `pnpm openclaw ...` de dentro do repositório. Consulte [Configuração](/pt-BR/start/setup) para ver os fluxos de desenvolvimento completos.

### Instalar a partir do checkout da branch main no GitHub

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Contêineres e gerenciadores de pacotes

<CardGroup cols={2}>
  <Card title="Docker" href="/pt-BR/install/docker" icon="container">
    Implantações em contêiner ou sem interface gráfica.
  </Card>
  <Card title="Podman" href="/pt-BR/install/podman" icon="container">
    Alternativa ao Docker com contêineres sem privilégios de root.
  </Card>
  <Card title="Nix" href="/pt-BR/install/nix" icon="snowflake">
    Instalação declarativa por meio de um flake do Nix.
  </Card>
  <Card title="Ansible" href="/pt-BR/install/ansible" icon="server">
    Provisionamento automatizado de frotas.
  </Card>
  <Card title="Bun" href="/pt-BR/install/bun" icon="zap">
    Uso somente da CLI por meio do ambiente de execução Bun.
  </Card>
</CardGroup>

## Verificar a instalação

```bash
openclaw --version      # confirme se a CLI está disponível
openclaw doctor         # verifique se há problemas de configuração
openclaw gateway status # verifique se o Gateway está em execução
```

Se quiser uma inicialização gerenciada após a instalação:

- macOS: LaunchAgent por meio de `openclaw onboard --install-daemon` ou `openclaw gateway install`
- Linux/WSL2: serviço de usuário do systemd por meio dos mesmos comandos
- Windows nativo: primeiro, uma Tarefa Agendada; se a criação da tarefa for negada, use como alternativa um item de logon por usuário na pasta Inicializar

## Hospedagem e implantação

Implante o OpenClaw em um servidor de nuvem ou VPS. Consulte [Servidor Linux](/pt-BR/vps) para acessar o seletor completo
de provedores (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi e outros), ou faça uma implantação declarativa no
[Render](/pt-BR/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/pt-BR/vps">
    Escolha um provedor.
  </Card>
  <Card title="VM com Docker" href="/pt-BR/install/docker-vm-runtime">
    Etapas compartilhadas do Docker.
  </Card>
  <Card title="Kubernetes" href="/pt-BR/install/kubernetes">
    Implantação no K8s.
  </Card>
</CardGroup>

## Atualizar, migrar ou desinstalar

<CardGroup cols={3}>
  <Card title="Atualização" href="/pt-BR/install/updating" icon="refresh-cw">
    Mantenha o OpenClaw atualizado.
  </Card>
  <Card title="Migração" href="/pt-BR/install/migrating" icon="arrow-right">
    Mova para uma nova máquina.
  </Card>
  <Card title="Desinstalação" href="/pt-BR/install/uninstall" icon="trash-2">
    Remova completamente o OpenClaw.
  </Card>
</CardGroup>

## Solução de problemas: `openclaw` não encontrado

Quase sempre é um problema com o PATH: o diretório global de binários do npm não está no `PATH` do seu shell. Consulte [Solução de problemas do Node.js](/pt-BR/install/node#troubleshooting) para ver a correção completa, incluindo o caminho no Windows.

```bash
node -v           # o Node está instalado?
npm prefix -g     # onde estão os pacotes globais?
echo "$PATH"      # o diretório global de binários está no PATH?
```
