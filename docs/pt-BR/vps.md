---
read_when:
    - Você quer executar o Gateway em um servidor Linux ou VPS na nuvem
    - Você precisa de um panorama rápido dos guias de hospedagem
    - Você quer uma otimização genérica de servidor Linux para o OpenClaw
sidebarTitle: Linux Server
summary: Execute o OpenClaw em um servidor Linux ou VPS na nuvem — seletor de provedor, arquitetura e ajustes
title: Servidor Linux
x-i18n:
    generated_at: "2026-07-12T00:30:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

Execute o Gateway do OpenClaw em qualquer servidor Linux ou VPS na nuvem. Esta página ajuda você a
escolher um provedor, explica como as implantações na nuvem funcionam e aborda ajustes genéricos do Linux
que se aplicam a qualquer ambiente.

## Escolha um provedor

<CardGroup cols={2}>
  <Card title="Azure" href="/pt-BR/install/azure">VM Linux</Card>
  <Card title="DigitalOcean" href="/pt-BR/install/digitalocean">VPS pago simples</Card>
  <Card title="exe.dev" href="/pt-BR/install/exe-dev">VM com proxy HTTPS</Card>
  <Card title="Fly.io" href="/pt-BR/install/fly">Máquinas Fly</Card>
  <Card title="GCP" href="/pt-BR/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/pt-BR/install/hetzner">Docker em VPS da Hetzner</Card>
  <Card title="Hostinger" href="/pt-BR/install/hostinger">VPS com configuração em um clique</Card>
  <Card title="Northflank" href="/pt-BR/install/northflank">Configuração pelo navegador em um clique</Card>
  <Card title="Oracle Cloud" href="/pt-BR/install/oracle">Camada ARM Sempre Gratuita</Card>
  <Card title="Railway" href="/pt-BR/install/railway">Configuração pelo navegador em um clique</Card>
  <Card title="Raspberry Pi" href="/pt-BR/install/raspberry-pi">Hospedagem própria em ARM</Card>
</CardGroup>

A **AWS (EC2 / Lightsail / camada gratuita)** também funciona bem.
Um passo a passo em vídeo feito pela comunidade está disponível em
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(recurso da comunidade — pode ficar indisponível).

## Como funcionam as configurações na nuvem

- O **Gateway é executado no VPS** e controla o estado e o espaço de trabalho.
- Você se conecta pelo laptop ou celular usando a **interface de controle** ou **Tailscale/SSH**.
- Trate o VPS como a fonte da verdade e faça **backup** regularmente do estado e do espaço de trabalho.
- Padrão seguro: mantenha o Gateway em local loopback e acesse-o por um túnel SSH ou pelo Tailscale Serve.
  Se você fizer a associação a `lan` ou `tailnet`, o Gateway exigirá um segredo compartilhado
  (`gateway.auth.token` ou `gateway.auth.password`), a menos que a autenticação seja delegada a um
  proxy confiável.

Páginas relacionadas: [acesso remoto ao Gateway](/pt-BR/gateway/remote), [central de plataformas](/pt-BR/platforms).

## Reforce primeiro a segurança do acesso administrativo

Antes de instalar o OpenClaw em um VPS público, decida como você deseja administrar
o próprio servidor.

- Para acesso administrativo somente pela tailnet: primeiro instale o Tailscale, conecte o VPS à sua
  tailnet, verifique uma segunda sessão SSH pelo IP do Tailscale ou pelo nome do MagicDNS
  e depois restrinja o SSH público.
- Sem o Tailscale: aplique o reforço de segurança equivalente ao seu caminho SSH antes de
  expor mais serviços.
- Isso é separado do acesso ao Gateway. Você ainda pode manter o OpenClaw associado ao
  local loopback e usar um túnel SSH ou o Tailscale Serve para o painel.

As opções do Gateway específicas do Tailscale estão em [Tailscale](/pt-BR/gateway/tailscale).

## Agente compartilhado da empresa em um VPS

Executar um único agente para uma equipe é uma configuração válida quando todos os usuários estão no
mesmo limite de confiança e o agente é usado somente para fins profissionais.

- Mantenha-o em um ambiente de execução dedicado (VPS/VM/contêiner + usuário/contas dedicados do sistema operacional).
- Não conecte esse ambiente de execução a contas pessoais da Apple/Google nem a perfis pessoais de navegador/gerenciador de senhas.
- Se os usuários forem hostis entre si, separe-os por Gateway/host/usuário do sistema operacional.

Detalhes do modelo de segurança: [Segurança](/pt-BR/gateway/security).

## Uso de nós com um VPS

Você pode manter o Gateway na nuvem e parear **nós** nos seus dispositivos locais
(Mac/iOS/Android/sem interface gráfica). Os nós fornecem recursos locais de tela/câmera/canvas e `system.run`,
enquanto o Gateway permanece na nuvem.

Documentação: [Nós](/pt-BR/nodes), [CLI de nós](/pt-BR/cli/nodes).

## Ajustes de inicialização para VMs pequenas e hosts ARM

Se os comandos da CLI parecerem lentos em VMs de baixo consumo de energia (ou hosts ARM), ative o cache de compilação de módulos do Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` melhora o tempo de inicialização de comandos repetidos; a primeira execução aquece o cache.
- `OPENCLAW_NO_RESPAWN=1` mantém as reinicializações rotineiras do Gateway dentro do processo, o que evita transferências adicionais entre processos e simplifica o rastreamento de PID em hosts pequenos.
- Para detalhes específicos do Raspberry Pi, consulte [Raspberry Pi](/pt-BR/install/raspberry-pi).

### Lista de verificação de ajustes do systemd (opcional)

Para hosts de VM que usam `systemd`, considere:

- Variáveis de ambiente do serviço para um caminho de inicialização estável: `OPENCLAW_NO_RESPAWN=1` e
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Comportamento explícito de reinicialização: `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- Discos SSD para os caminhos de estado/cache, a fim de reduzir as penalidades de inicialização a frio causadas por E/S aleatória.

O caminho padrão `openclaw onboard --install-daemon` instala uma unidade de usuário do systemd;
edite-a com:

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

Se você instalou deliberadamente uma unidade do sistema, edite-a por meio de
`sudo systemctl edit openclaw-gateway.service`.

Como as políticas `Restart=` ajudam na recuperação automatizada:
[o systemd pode automatizar a recuperação de serviços](https://www.redhat.com/en/blog/systemd-automate-recovery).

Para saber mais sobre o comportamento de OOM no Linux, a seleção do processo filho a ser encerrado e o diagnóstico de `exit 137`,
consulte [pressão de memória e encerramentos por OOM no Linux](/pt-BR/platforms/linux#memory-pressure-and-oom-kills).

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [DigitalOcean](/pt-BR/install/digitalocean)
- [Fly.io](/pt-BR/install/fly)
- [Hetzner](/pt-BR/install/hetzner)
