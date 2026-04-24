---
read_when:
    - Você quer executar o Gateway em um servidor Linux ou VPS na nuvem
    - Você precisa de um mapa rápido dos guias de hospedagem
    - Você quer ajuste fino genérico de servidor Linux para OpenClaw
sidebarTitle: Linux Server
summary: Executar o OpenClaw em um servidor Linux ou VPS na nuvem — seletor de provedor, arquitetura e ajuste fino
title: Servidor Linux
x-i18n:
    generated_at: "2026-04-24T06:19:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec71c7dcceedc20ecbeb3bdbbb7ea0047c1d1164e8049781171d3bdcac37cf95
    source_path: vps.md
    workflow: 15
---

Execute o Gateway do OpenClaw em qualquer servidor Linux ou VPS na nuvem. Esta página ajuda você
a escolher um provedor, explica como implantações na nuvem funcionam e cobre ajustes genéricos de Linux
que se aplicam em qualquer lugar.

## Escolha um provedor

<CardGroup cols={2}>
  <Card title="Railway" href="/pt-BR/install/railway">Configuração no navegador com um clique</Card>
  <Card title="Northflank" href="/pt-BR/install/northflank">Configuração no navegador com um clique</Card>
  <Card title="DigitalOcean" href="/pt-BR/install/digitalocean">VPS paga simples</Card>
  <Card title="Oracle Cloud" href="/pt-BR/install/oracle">Camada ARM Always Free</Card>
  <Card title="Fly.io" href="/pt-BR/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/pt-BR/install/hetzner">Docker em VPS Hetzner</Card>
  <Card title="Hostinger" href="/pt-BR/install/hostinger">VPS com configuração em um clique</Card>
  <Card title="GCP" href="/pt-BR/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/pt-BR/install/azure">VM Linux</Card>
  <Card title="exe.dev" href="/pt-BR/install/exe-dev">VM com proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/pt-BR/install/raspberry-pi">ARM self-hosted</Card>
</CardGroup>

**AWS (EC2 / Lightsail / camada gratuita)** também funciona bem.
Um passo a passo em vídeo da comunidade está disponível em
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(recurso da comunidade -- pode ficar indisponível).

## Como configurações em nuvem funcionam

- O **Gateway é executado no VPS** e é dono do estado + workspace.
- Você se conecta do seu laptop ou telefone via **Control UI** ou **Tailscale/SSH**.
- Trate o VPS como a fonte da verdade e faça **backup** do estado + workspace regularmente.
- Padrão seguro: mantenha o Gateway em loopback local e acesse-o via túnel SSH ou Tailscale Serve.
  Se você fizer bind em `lan` ou `tailnet`, exija `gateway.auth.token` ou `gateway.auth.password`.

Páginas relacionadas: [Acesso remoto ao Gateway](/pt-BR/gateway/remote), [Hub de plataformas](/pt-BR/platforms).

## Agente compartilhado da empresa em um VPS

Executar um único agente para uma equipe é uma configuração válida quando todos os usuários estão no mesmo limite de confiança e o agente é apenas para negócios.

- Mantenha-o em um runtime dedicado (VPS/VM/contêiner + usuário/contas dedicados do SO).
- Não conecte esse runtime a contas pessoais da Apple/Google nem a perfis pessoais de navegador/gerenciador de senhas.
- Se os usuários forem adversariais entre si, separe por gateway/host/usuário do SO.

Detalhes do modelo de segurança: [Segurança](/pt-BR/gateway/security).

## Usar Nodes com um VPS

Você pode manter o Gateway na nuvem e parear **Nodes** nos seus dispositivos locais
(Mac/iOS/Android/headless). Os Nodes fornecem recursos locais de tela/câmera/canvas e `system.run`
enquanto o Gateway permanece na nuvem.

Documentação: [Nodes](/pt-BR/nodes), [CLI de Nodes](/pt-BR/cli/nodes).

## Ajuste de inicialização para VMs pequenas e hosts ARM

Se os comandos da CLI parecerem lentos em VMs de baixo consumo (ou hosts ARM), ative o cache de compilação de módulos do Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` melhora os tempos de inicialização de comandos repetidos.
- `OPENCLAW_NO_RESPAWN=1` evita overhead extra de inicialização de um caminho de autorrespawn.
- A primeira execução do comando aquece o cache; execuções seguintes são mais rápidas.
- Para detalhes específicos do Raspberry Pi, consulte [Raspberry Pi](/pt-BR/install/raspberry-pi).

### Checklist de ajuste do systemd (opcional)

Para hosts de VM usando `systemd`, considere:

- Adicionar envs de serviço para um caminho de inicialização estável:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Manter o comportamento de reinício explícito:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Prefira discos com SSD para caminhos de estado/cache para reduzir penalidades de cold start com I/O aleatório.

Para o caminho padrão `openclaw onboard --install-daemon`, edite a unit de usuário:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Se você instalou intencionalmente uma unit de sistema, edite
`openclaw-gateway.service` via `sudo systemctl edit openclaw-gateway.service`.

Como políticas `Restart=` ajudam na recuperação automatizada:
[o systemd pode automatizar a recuperação de serviço](https://www.redhat.com/en/blog/systemd-automate-recovery).

Para comportamento de OOM no Linux, seleção de processo filho como vítima e diagnóstico de
`exit 137`, consulte [Pressão de memória e OOM kills no Linux](/pt-BR/platforms/linux#memory-pressure-and-oom-kills).

## Relacionado

- [Visão geral de instalação](/pt-BR/install)
- [DigitalOcean](/pt-BR/install/digitalocean)
- [Fly.io](/pt-BR/install/fly)
- [Hetzner](/pt-BR/install/hetzner)
