---
read_when:
    - Você quer uma implantação automatizada do servidor com reforço de segurança
    - Você precisa de uma configuração isolada por firewall com acesso via VPN
    - Você está implantando em servidores Debian/Ubuntu remotos
summary: Instalação automatizada e reforçada do OpenClaw com Ansible, VPN Tailscale e isolamento por firewall
title: Ansible
x-i18n:
    generated_at: "2026-07-16T12:36:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f6b473cd5a8b80389b5ed746c4e2f2729d95bb15a2daaaa183fbdfbe144e647
    source_path: install/ansible.md
    workflow: 16
---

Implante o OpenClaw em servidores de produção com o **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**, um instalador automatizado com uma arquitetura que prioriza a segurança.

<Info>
O repositório [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) é a fonte oficial para a implantação com Ansible. Esta página apresenta uma visão geral rápida.
</Info>

## Pré-requisitos

| Requisito | Detalhes                                                   |
| ----------- | --------------------------------------------------------- |
| SO          | Debian 11+ ou Ubuntu 20.04+                               |
| Acesso      | Privilégios de root ou sudo                               |
| Rede        | Conexão com a internet para instalação de pacotes         |
| Ansible     | 2.14+ (instalado automaticamente pelo script de início rápido) |

## O que está incluído

- Segurança com firewall em primeiro lugar: UFW + isolamento do Docker (somente SSH + Tailscale acessíveis)
- VPN Tailscale para acesso remoto sem expor serviços publicamente
- Docker para contêineres de sandbox isolados com vinculações somente ao localhost
- Integração com systemd com proteção reforçada e inicialização automática durante o boot
- Configuração com um único comando

## Início rápido

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## O que é instalado

1. Tailscale (VPN em malha para acesso remoto seguro)
2. Firewall UFW (somente portas de SSH + Tailscale)
3. Docker CE + Compose V2 (backend padrão de sandbox dos agentes)
4. Node.js e pnpm (o OpenClaw requer Node 22.22.3+, 24.15+ ou 25.9+; recomenda-se o Node 24)
5. OpenClaw, instalado diretamente no host, sem conteinerização
6. Um serviço systemd com proteção de segurança reforçada

<Note>
O Gateway é executado diretamente no host, não no Docker. O sandboxing dos agentes é
opcional; este playbook instala o Docker porque ele é o backend padrão de sandbox.
Consulte [Sandboxing](/pt-BR/gateway/sandboxing) para conhecer outros backends.
</Note>

## Configuração pós-instalação

<Steps>
  <Step title="Mudar para o usuário openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Executar o assistente de integração">
    O script de pós-instalação orienta a configuração do OpenClaw.
  </Step>
  <Step title="Conectar canais de mensagens">
    Faça login no WhatsApp, Telegram, Discord ou Signal:
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="Verificar a instalação">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Conectar-se ao Tailscale">
    Entre na malha da VPN para obter acesso remoto seguro.
  </Step>
</Steps>

### Comandos rápidos

```bash
# Verificar o status do serviço
sudo systemctl status openclaw

# Exibir logs em tempo real
sudo journalctl -u openclaw -f

# Reiniciar o Gateway
sudo systemctl restart openclaw

# Login no canal (execute como o usuário openclaw)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## Arquitetura de segurança

Modelo de defesa em quatro camadas:

1. Firewall (UFW): somente SSH (22) e Tailscale (41641/udp) expostos publicamente
2. VPN (Tailscale): Gateway acessível somente pela malha da VPN
3. Isolamento do Docker: a cadeia `DOCKER-USER` do iptables impede a exposição externa de portas
4. Proteção reforçada do systemd: `NoNewPrivileges`, `PrivateTmp`, usuário sem privilégios

Verifique sua superfície externa de ataque:

```bash
nmap -p- YOUR_SERVER_IP
```

Somente a porta 22 (SSH) deve estar aberta. O Gateway e o Docker permanecem protegidos.

O Docker é instalado para sandboxes de agentes (execução isolada de ferramentas), não para executar o Gateway. Consulte [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) para configurar o sandbox.

## Instalação manual

<Steps>
  <Step title="Instalar os pré-requisitos">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clonar o repositório">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Instalar as coleções do Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Executar o playbook">
    ```bash
    ./run-playbook.sh
    ```

    Ou execute o playbook diretamente e depois execute o script de configuração manualmente:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Depois, execute: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Atualização

O instalador do Ansible configura o OpenClaw para atualizações manuais; consulte [Atualização](/pt-BR/install/updating) para conhecer o fluxo padrão.

Para executar novamente o playbook (por exemplo, após alterações na configuração):

```bash
cd openclaw-ansible
./run-playbook.sh
```

A operação é idempotente e pode ser executada várias vezes com segurança.

## Solução de problemas

<AccordionGroup>
  <Accordion title="O firewall bloqueia minha conexão">
    - Primeiro, conecte-se pela VPN Tailscale; por padrão, o Gateway só pode ser acessado dessa forma.
    - SSH (porta 22) é sempre permitido.

  </Accordion>
  <Accordion title="O serviço não inicia">
    ```bash
    # Verificar os logs
    sudo journalctl -u openclaw -n 100

    # Verificar as permissões
    sudo ls -la /opt/openclaw

    # Testar a inicialização manual
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Problemas com o sandbox do Docker">
    ```bash
    # Verificar se o Docker está em execução
    sudo systemctl status docker

    # Verificar a imagem do sandbox
    sudo docker images | grep openclaw-sandbox

    # Criar a imagem do sandbox caso ela não exista (requer um checkout do código-fonte)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # Para instalações com npm sem um checkout do código-fonte, consulte
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Falha no login do canal">
    Certifique-se de estar executando como o usuário `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## Configuração avançada

Para obter detalhes sobre a arquitetura de segurança e a solução de problemas, consulte o repositório openclaw-ansible:

- [Arquitetura de segurança](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Detalhes técnicos](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Guia de solução de problemas](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Relacionados

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): guia completo de implantação
- [Docker](/pt-BR/install/docker): configuração conteinerizada do Gateway
- [Sandboxing](/pt-BR/gateway/sandboxing): configuração do sandbox dos agentes
- [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools): isolamento por agente
