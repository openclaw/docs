---
read_when:
    - Você quer uma implantação automatizada de servidor com reforço de segurança
    - Você precisa de uma configuração isolada por firewall com acesso via VPN
    - Você está implantando em servidores Debian/Ubuntu remotos
summary: Instalação automatizada e reforçada do OpenClaw com Ansible, VPN Tailscale e isolamento por firewall
title: Ansible
x-i18n:
    generated_at: "2026-04-30T09:53:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe42e3f83b02e436f0dc5111dda1e069c573b32fdde23ad50dbb2b147c6dd72
    source_path: install/ansible.md
    workflow: 16
---

# Instalação com Ansible

Implante o OpenClaw em servidores de produção com **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- um instalador automatizado com arquitetura que prioriza a segurança.

<Info>
O repositório [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) é a fonte da verdade para implantação com Ansible. Esta página é uma visão geral rápida.
</Info>

## Pré-requisitos

| Requisito   | Detalhes                                                  |
| ----------- | --------------------------------------------------------- |
| **SO**      | Debian 11+ ou Ubuntu 20.04+                              |
| **Acesso**  | Privilégios de root ou sudo                              |
| **Rede**    | Conexão com a internet para instalação de pacotes         |
| **Ansible** | 2.14+ (instalado automaticamente pelo script de início rápido) |

## O que você recebe

- **Segurança com firewall primeiro** -- UFW + isolamento do Docker (somente SSH + Tailscale acessíveis)
- **VPN Tailscale** -- acesso remoto seguro sem expor serviços publicamente
- **Docker** -- contêineres de sandbox isolados, vinculações somente a localhost
- **Defesa em profundidade** -- arquitetura de segurança em 4 camadas
- **Integração com Systemd** -- inicialização automática na inicialização com hardening
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
4. **Node.js 24 + pnpm** -- dependências de runtime (Node 22 LTS, atualmente `22.14+`, continua com suporte)
5. **OpenClaw** -- baseado no host, não conteinerizado
6. **Serviço Systemd** -- inicialização automática com hardening de segurança

<Note>
O Gateway roda diretamente no host (não no Docker). O sandboxing de agentes é
opcional; este playbook instala o Docker porque ele é o backend padrão de
sandbox. Consulte [Sandboxing](/pt-BR/gateway/sandboxing) para detalhes e outros backends.
</Note>

## Configuração pós-instalação

<Steps>
  <Step title="Mude para o usuário openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Execute o assistente de onboarding">
    O script pós-instalação orienta você na configuração das opções do OpenClaw.
  </Step>
  <Step title="Conecte provedores de mensagens">
    Entre no WhatsApp, Telegram, Discord ou Signal:
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Verifique a instalação">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Conecte ao Tailscale">
    Entre na sua VPN mesh para acesso remoto seguro.
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
2. **VPN (Tailscale)** -- Gateway acessível somente pela VPN mesh
3. **Isolamento do Docker** -- a cadeia iptables DOCKER-USER impede a exposição de portas externas
4. **Hardening do Systemd** -- NoNewPrivileges, PrivateTmp, usuário sem privilégios

Para verificar sua superfície de ataque externa:

```bash
nmap -p- YOUR_SERVER_IP
```

Somente a porta 22 (SSH) deve estar aberta. Todos os outros serviços (Gateway, Docker) ficam bloqueados.

O Docker é instalado para sandboxes de agentes (execução isolada de ferramentas), não para executar o próprio Gateway. Consulte [Sandbox Multiagente e Ferramentas](/pt-BR/tools/multi-agent-sandbox-tools) para configuração de sandbox.

## Instalação manual

Se você preferir controle manual em vez da automação:

<Steps>
  <Step title="Instale os pré-requisitos">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Clone o repositório">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Instale as coleções do Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Execute o playbook">
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

O instalador Ansible configura o OpenClaw para atualizações manuais. Consulte [Atualização](/pt-BR/install/updating) para o fluxo de atualização padrão.

Para executar novamente o playbook do Ansible (por exemplo, para alterações de configuração):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Isso é idempotente e seguro para executar várias vezes.

## Solução de problemas

<AccordionGroup>
  <Accordion title="O firewall bloqueia minha conexão">
    - Garanta que você consiga acessar primeiro pela VPN Tailscale
    - O acesso SSH (porta 22) é sempre permitido
    - O Gateway é acessível somente via Tailscale por design

  </Accordion>
  <Accordion title="O serviço não inicia">
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
  <Accordion title="Problemas com o sandbox do Docker">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build sandbox image if missing
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Falha no login do provedor">
    Certifique-se de estar executando como o usuário `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Configuração avançada

Para arquitetura de segurança detalhada e solução de problemas, consulte o repositório openclaw-ansible:

- [Arquitetura de Segurança](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Detalhes Técnicos](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Guia de Solução de Problemas](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Relacionado

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- guia completo de implantação
- [Docker](/pt-BR/install/docker) -- configuração de Gateway conteinerizado
- [Sandboxing](/pt-BR/gateway/sandboxing) -- configuração de sandbox de agentes
- [Sandbox Multiagente e Ferramentas](/pt-BR/tools/multi-agent-sandbox-tools) -- isolamento por agente
