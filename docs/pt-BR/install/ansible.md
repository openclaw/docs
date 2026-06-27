---
read_when:
    - Você quer implantação automatizada de servidor com reforço de segurança
    - Você precisa de uma configuração isolada por firewall com acesso por VPN
    - Você está implantando em servidores Debian/Ubuntu remotos
summary: Instalação automatizada e reforçada do OpenClaw com Ansible, VPN Tailscale e isolamento por firewall
title: Ansible
x-i18n:
    generated_at: "2026-06-27T17:37:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03eb6f40139d7e154eee92a7a1a67471da90b128cc90daf86fbc87e383a5297c
    source_path: install/ansible.md
    workflow: 16
---

Implante o OpenClaw em servidores de produção com **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- um instalador automatizado com arquitetura que prioriza segurança.

<Info>
O repositório [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) é a fonte da verdade para implantação com Ansible. Esta página é uma visão geral rápida.
</Info>

## Pré-requisitos

| Requisito   | Detalhes                                                  |
| ----------- | --------------------------------------------------------- |
| **SO**      | Debian 11+ ou Ubuntu 20.04+                               |
| **Acesso**  | Privilégios de root ou sudo                               |
| **Rede**    | Conexão com a Internet para instalação de pacotes         |
| **Ansible** | 2.14+ (instalado automaticamente pelo script de início rápido) |

## O que você recebe

- **Segurança baseada em firewall** -- isolamento com UFW + Docker (somente SSH + Tailscale acessíveis)
- **VPN Tailscale** -- acesso remoto seguro sem expor serviços publicamente
- **Docker** -- contêineres de sandbox isolados, bindings somente em localhost
- **Defesa em profundidade** -- arquitetura de segurança em 4 camadas
- **Integração com systemd** -- inicialização automática no boot com hardening
- **Configuração com um comando** -- implantação completa em minutos

## Início rápido

Instalação com um comando:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## O que é instalado

O playbook do Ansible instala e configura:

1. **Tailscale** -- VPN mesh para acesso remoto seguro
2. **Firewall UFW** -- somente portas SSH + Tailscale
3. **Docker CE + Compose V2** -- para o backend padrão de sandbox do agente
4. **Node.js 24 + pnpm** -- dependências de runtime (Node 22 LTS, atualmente `22.19+`, continua com suporte)
5. **OpenClaw** -- baseado no host, não conteinerizado
6. **Serviço systemd** -- inicialização automática com hardening de segurança

<Note>
O Gateway é executado diretamente no host (não no Docker). O sandboxing de agentes é
opcional; este playbook instala o Docker porque ele é o backend padrão de sandbox.
Veja [Sandboxing](/pt-BR/gateway/sandboxing) para detalhes e outros backends.
</Note>

## Configuração pós-instalação

<Steps>
  <Step title="Switch to the openclaw user">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Run the onboarding wizard">
    O script pós-instalação orienta você na configuração das definições do OpenClaw.
  </Step>
  <Step title="Connect messaging providers">
    Faça login no WhatsApp, Telegram, Discord ou Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Verify the installation">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Connect to Tailscale">
    Entre na sua mesh VPN para acesso remoto seguro.
  </Step>
</Steps>

### Comandos rápidos

```bash
# Check service status
sudo systemctl status openclaw

# View live logs
sudo journalctl -u openclaw -f

# Restart gateway
sudo systemctl restart openclaw

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## Arquitetura de segurança

A implantação usa um modelo de defesa em 4 camadas:

1. **Firewall (UFW)** -- somente SSH (22) + Tailscale (41641/udp) expostos publicamente
2. **VPN (Tailscale)** -- Gateway acessível somente pela mesh VPN
3. **Isolamento do Docker** -- a cadeia iptables DOCKER-USER impede exposição de portas externas
4. **Hardening do systemd** -- NoNewPrivileges, PrivateTmp, usuário sem privilégios

Para verificar sua superfície de ataque externa:

```bash
nmap -p- YOUR_SERVER_IP
```

Somente a porta 22 (SSH) deve estar aberta. Todos os outros serviços (Gateway, Docker) ficam bloqueados.

O Docker é instalado para sandboxes de agentes (execução isolada de ferramentas), não para executar o próprio Gateway. Veja [Sandbox multiagente e ferramentas](/pt-BR/tools/multi-agent-sandbox-tools) para configuração de sandbox.

## Instalação manual

Se você preferir controle manual sobre a automação:

<Steps>
  <Step title="Install prerequisites">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clone the repository">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Install Ansible collections">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Run the playbook">
    ```bash
    ./run-playbook.sh
    ```

    Como alternativa, execute diretamente e depois execute manualmente o script de configuração:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Atualização

O instalador Ansible configura o OpenClaw para atualizações manuais. Veja [Atualização](/pt-BR/install/updating) para o fluxo padrão de atualização.

Para executar novamente o playbook do Ansible (por exemplo, para alterações de configuração):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Isso é idempotente e seguro para executar várias vezes.

## Solução de problemas

<AccordionGroup>
  <Accordion title="Firewall blocks my connection">
    - Garanta que você consiga acessar primeiro pela VPN Tailscale
    - O acesso SSH (porta 22) é sempre permitido
    - O Gateway é acessível somente via Tailscale por design

  </Accordion>
  <Accordion title="Service will not start">
    ```bash
    # Check logs
    sudo journalctl -u openclaw -n 100

    # Verify permissions
    sudo ls -la /opt/openclaw

    # Test manual start
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker sandbox issues">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build sandbox image if missing (requires source checkout)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # For npm installs without a source checkout, see
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="Provider login fails">
    Certifique-se de estar executando como o usuário `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Configuração avançada

Para arquitetura de segurança detalhada e solução de problemas, consulte o repositório openclaw-ansible:

- [Arquitetura de segurança](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Detalhes técnicos](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Guia de solução de problemas](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Relacionados

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- guia completo de implantação
- [Docker](/pt-BR/install/docker) -- configuração de Gateway conteinerizado
- [Sandboxing](/pt-BR/gateway/sandboxing) -- configuração de sandbox de agente
- [Sandbox multiagente e ferramentas](/pt-BR/tools/multi-agent-sandbox-tools) -- isolamento por agente
