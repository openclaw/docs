---
read_when:
    - Você quer implantação automatizada de servidor com reforço de segurança
    - Você precisa de uma configuração isolada por firewall com acesso por Tailscale VPN
    - Você está implantando em servidores Debian/Ubuntu remotos
summary: Instalação automatizada e reforçada do OpenClaw com Ansible, Tailscale VPN e isolamento por firewall
title: Ansible
x-i18n:
    generated_at: "2026-04-21T05:38:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a23374c971a1f3163dd18c32e553ebaad55b2542c1f25f49bcc9ae464d679e8
    source_path: install/ansible.md
    workflow: 15
---

# Instalação com Ansible

Implante o OpenClaw em servidores de produção com **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- um instalador automatizado com arquitetura focada em segurança.

<Info>
O repositório [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) é a fonte da verdade para implantação com Ansible. Esta página é uma visão geral rápida.
</Info>

## Pré-requisitos

| Requisito | Detalhes                                                  |
| --------- | --------------------------------------------------------- |
| **SO**    | Debian 11+ ou Ubuntu 20.04+                               |
| **Acesso** | Privilégios de root ou sudo                              |
| **Rede**  | Conexão com a Internet para instalação de pacotes         |
| **Ansible** | 2.14+ (instalado automaticamente pelo script de início rápido) |

## O que você recebe

- **Segurança com firewall em primeiro lugar** -- isolamento com UFW + Docker (apenas SSH + Tailscale acessíveis)
- **Tailscale VPN** -- acesso remoto seguro sem expor serviços publicamente
- **Docker** -- contêineres de sandbox isolados, vínculos apenas em localhost
- **Defesa em profundidade** -- arquitetura de segurança em 4 camadas
- **Integração com Systemd** -- inicialização automática no boot com reforço de segurança
- **Configuração com um comando** -- implantação completa em minutos

## Início rápido

Instalação com um comando:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## O que é instalado

O playbook do Ansible instala e configura:

1. **Tailscale** -- mesh VPN para acesso remoto seguro
2. **Firewall UFW** -- apenas portas de SSH + Tailscale
3. **Docker CE + Compose V2** -- para o backend padrão de sandbox do agente
4. **Node.js 24 + pnpm** -- dependências de runtime (Node 22 LTS, atualmente `22.14+`, continua suportado)
5. **OpenClaw** -- baseado no host, não conteinerizado
6. **Serviço Systemd** -- inicialização automática com reforço de segurança

<Note>
O Gateway roda diretamente no host (não em Docker). O sandbox de agente é
opcional; este playbook instala Docker porque ele é o backend de sandbox
padrão. Veja [Sandboxing](/pt-BR/gateway/sandboxing) para detalhes e outros backends.
</Note>

## Configuração pós-instalação

<Steps>
  <Step title="Troque para o usuário openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Execute o assistente de onboarding">
    O script pós-instalação orienta você na configuração das definições do OpenClaw.
  </Step>
  <Step title="Conecte provedores de mensagens">
    Faça login no WhatsApp, Telegram, Discord ou Signal:
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
  <Step title="Conecte-se ao Tailscale">
    Entre na sua mesh VPN para acesso remoto seguro.
  </Step>
</Steps>

### Comandos rápidos

```bash
# Verificar status do serviço
sudo systemctl status openclaw

# Ver logs ao vivo
sudo journalctl -u openclaw -f

# Reiniciar o gateway
sudo systemctl restart openclaw

# Login de provedor (executar como usuário openclaw)
sudo -i -u openclaw
openclaw channels login
```

## Arquitetura de segurança

A implantação usa um modelo de defesa em 4 camadas:

1. **Firewall (UFW)** -- apenas SSH (22) + Tailscale (41641/udp) expostos publicamente
2. **VPN (Tailscale)** -- Gateway acessível apenas pela mesh VPN
3. **Isolamento com Docker** -- a cadeia iptables DOCKER-USER impede exposição externa de portas
4. **Reforço com Systemd** -- NoNewPrivileges, PrivateTmp, usuário sem privilégios

Para verificar sua superfície externa de ataque:

```bash
nmap -p- YOUR_SERVER_IP
```

Apenas a porta 22 (SSH) deve estar aberta. Todos os outros serviços (Gateway, Docker) ficam travados.

O Docker é instalado para sandboxes de agentes (execução isolada de ferramentas), não para executar o próprio Gateway. Veja [Multi-Agent Sandbox and Tools](/pt-BR/tools/multi-agent-sandbox-tools) para configuração de sandbox.

## Instalação manual

Se você preferir controle manual sobre a automação:

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

    Como alternativa, execute diretamente e depois rode manualmente o script de configuração:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Depois execute: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Atualização

O instalador Ansible configura o OpenClaw para atualizações manuais. Veja [Updating](/pt-BR/install/updating) para o fluxo padrão de atualização.

Para executar novamente o playbook do Ansible (por exemplo, para mudanças de configuração):

```bash
cd openclaw-ansible
./run-playbook.sh
```

Isso é idempotente e seguro para executar várias vezes.

## Solução de problemas

<AccordionGroup>
  <Accordion title="O firewall bloqueia minha conexão">
    - Certifique-se de que você consegue acessar pelo Tailscale VPN primeiro
    - O acesso por SSH (porta 22) é sempre permitido
    - O Gateway é acessível apenas via Tailscale por design

  </Accordion>
  <Accordion title="O serviço não inicia">
    ```bash
    # Verificar logs
    sudo journalctl -u openclaw -n 100

    # Verificar permissões
    sudo ls -la /opt/openclaw

    # Testar inicialização manual
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Problemas com sandbox do Docker">
    ```bash
    # Verificar se o Docker está em execução
    sudo systemctl status docker

    # Verificar a imagem do sandbox
    sudo docker images | grep openclaw-sandbox

    # Criar a imagem do sandbox se estiver ausente
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Falha no login do provedor">
    Certifique-se de que você está executando como o usuário `openclaw`:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Configuração avançada

Para arquitetura de segurança detalhada e solução de problemas, veja o repositório openclaw-ansible:

- [Security Architecture](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Technical Details](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Troubleshooting Guide](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Relacionado

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- guia completo de implantação
- [Docker](/pt-BR/install/docker) -- configuração de Gateway conteinerizado
- [Sandboxing](/pt-BR/gateway/sandboxing) -- configuração de sandbox do agente
- [Multi-Agent Sandbox and Tools](/pt-BR/tools/multi-agent-sandbox-tools) -- isolamento por agente
