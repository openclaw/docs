---
read_when:
    - Você quer executar o Gateway em um servidor Linux ou VPS na nuvem
    - Você precisa de um mapa rápido dos guias de hospedagem
    - Você quer ajuste genérico de servidor Linux para o OpenClaw
sidebarTitle: Linux Server
summary: Execute o OpenClaw em um servidor Linux ou VPS na nuvem — seletor de provedor, arquitetura e ajustes
title: Servidor Linux
x-i18n:
    generated_at: "2026-06-27T18:20:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d32ca9cd62e99b340827f086602922eae3731d9b6cb42b1fd629917d604c549b
    source_path: vps.md
    workflow: 16
---

Execute o OpenClaw Gateway em qualquer servidor Linux ou VPS na nuvem. Esta página ajuda você a
escolher um provedor, explica como implantações na nuvem funcionam e cobre ajustes genéricos de Linux
que se aplicam em todos os lugares.

## Escolha um provedor

<CardGroup cols={2}>
  <Card title="Railway" href="/pt-BR/install/railway">Configuração em um clique, pelo navegador</Card>
  <Card title="Northflank" href="/pt-BR/install/northflank">Configuração em um clique, pelo navegador</Card>
  <Card title="DigitalOcean" href="/pt-BR/install/digitalocean">VPS paga simples</Card>
  <Card title="Oracle Cloud" href="/pt-BR/install/oracle">Camada ARM Always Free</Card>
  <Card title="Fly.io" href="/pt-BR/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/pt-BR/install/hetzner">Docker em VPS Hetzner</Card>
  <Card title="Hostinger" href="/pt-BR/install/hostinger">VPS com configuração em um clique</Card>
  <Card title="GCP" href="/pt-BR/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/pt-BR/install/azure">VM Linux</Card>
  <Card title="exe.dev" href="/pt-BR/install/exe-dev">VM com proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/pt-BR/install/raspberry-pi">ARM auto-hospedado</Card>
</CardGroup>

**AWS (EC2 / Lightsail / camada gratuita)** também funciona bem.
Um passo a passo em vídeo da comunidade está disponível em
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(recurso da comunidade -- pode ficar indisponível).

## Como as configurações em nuvem funcionam

- O **Gateway é executado na VPS** e gerencia o estado + workspace.
- Você se conecta pelo notebook ou celular via **Control UI** ou **Tailscale/SSH**.
- Trate a VPS como a fonte da verdade e **faça backup** do estado + workspace regularmente.
- Padrão seguro: mantenha o Gateway em local loopback e acesse-o por túnel SSH ou Tailscale Serve.
  Se você fizer bind para `lan` ou `tailnet`, exija `gateway.auth.token` ou `gateway.auth.password`.

Páginas relacionadas: [acesso remoto ao Gateway](/pt-BR/gateway/remote), [hub de plataformas](/pt-BR/platforms).

## Proteja o acesso administrativo primeiro

Antes de instalar o OpenClaw em uma VPS pública, decida como você quer administrar
a própria máquina.

- Se você quer acesso administrativo somente pela Tailnet, instale o Tailscale primeiro, conecte a VPS
  à sua tailnet, verifique uma segunda sessão SSH pelo IP do Tailscale ou
  nome MagicDNS e então restrinja o SSH público.
- Se você não está usando Tailscale, aplique o endurecimento equivalente ao seu caminho
  SSH antes de expor mais serviços.
- Isso é separado do acesso ao Gateway. Você ainda pode manter o OpenClaw vinculado ao
  local loopback e usar um túnel SSH ou Tailscale Serve para o painel.

As opções de Gateway específicas do Tailscale ficam em [Tailscale](/pt-BR/gateway/tailscale).

## Agente compartilhado da empresa em uma VPS

Executar um único agente para uma equipe é uma configuração válida quando todos os usuários estão no mesmo limite de confiança e o agente é apenas para negócios.

- Mantenha-o em um runtime dedicado (VPS/VM/contêiner + usuário/contas de SO dedicados).
- Não conecte esse runtime a contas pessoais Apple/Google ou perfis pessoais de navegador/gerenciador de senhas.
- Se os usuários forem adversários entre si, separe por gateway/host/usuário de SO.

Detalhes do modelo de segurança: [Segurança](/pt-BR/gateway/security).

## Usar nodes com uma VPS

Você pode manter o Gateway na nuvem e parear **nodes** nos seus dispositivos locais
(Mac/iOS/Android/headless). Nodes fornecem tela/câmera/canvas locais e capacidades `system.run`
enquanto o Gateway permanece na nuvem.

Docs: [Nodes](/pt-BR/nodes), [CLI de Nodes](/pt-BR/cli/nodes).

## Ajuste de inicialização para VMs pequenas e hosts ARM

Se comandos da CLI parecerem lentos em VMs de baixa potência (ou hosts ARM), habilite o cache de compilação de módulos do Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` melhora os tempos de inicialização de comandos repetidos.
- `OPENCLAW_NO_RESPAWN=1` mantém reinicializações rotineiras do Gateway dentro do processo, o que evita transferências extras entre processos e mantém o rastreamento de PID simples em hosts pequenos.
- A primeira execução do comando aquece o cache; as execuções seguintes são mais rápidas.
- Para detalhes específicos do Raspberry Pi, consulte [Raspberry Pi](/pt-BR/install/raspberry-pi).

### Lista de verificação de ajustes do systemd (opcional)

Para hosts de VM usando `systemd`, considere:

- Adicionar variáveis de ambiente de serviço para um caminho de inicialização estável:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Manter o comportamento de reinicialização explícito:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Prefira discos com SSD para caminhos de estado/cache para reduzir penalidades de inicialização a frio por E/S aleatória.

Para o caminho padrão `openclaw onboard --install-daemon`, edite a unidade de usuário:

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

Se você instalou deliberadamente uma unidade de sistema, edite
`openclaw-gateway.service` via `sudo systemctl edit openclaw-gateway.service`.

Como as políticas `Restart=` ajudam na recuperação automatizada:
[o systemd pode automatizar a recuperação de serviços](https://www.redhat.com/en/blog/systemd-automate-recovery).

Para comportamento de OOM no Linux, seleção de vítima de processo filho e diagnósticos de `exit 137`,
consulte [pressão de memória no Linux e encerramentos por OOM](/pt-BR/platforms/linux#memory-pressure-and-oom-kills).

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [DigitalOcean](/pt-BR/install/digitalocean)
- [Fly.io](/pt-BR/install/fly)
- [Hetzner](/pt-BR/install/hetzner)
