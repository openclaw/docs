---
read_when:
    - Configurando o OpenClaw na DigitalOcean
    - Procurando um VPS pago simples para OpenClaw
summary: Hospedar o OpenClaw em um Droplet da DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-24T05:57:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b3d06a38e257f4a8ab88d1f228c659a6cf1a276fe91c8ba7b89a0084658a314
    source_path: install/digitalocean.md
    workflow: 15
---

Execute um Gateway OpenClaw persistente em um Droplet da DigitalOcean.

## Pré-requisitos

- Conta da DigitalOcean ([cadastro](https://cloud.digitalocean.com/registrations/new))
- Par de chaves SSH (ou disposição para usar autenticação por senha)
- Cerca de 20 minutos

## Configuração

<Steps>
  <Step title="Criar um Droplet">
    <Warning>
    Use uma imagem base limpa (Ubuntu 24.04 LTS). Evite imagens 1-click de terceiros do Marketplace, a menos que você tenha revisado seus scripts de inicialização e padrões de firewall.
    </Warning>

    1. Acesse a [DigitalOcean](https://cloud.digitalocean.com/).
    2. Clique em **Create > Droplets**.
    3. Escolha:
       - **Region:** a mais próxima de você
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** chave SSH (recomendado) ou senha
    4. Clique em **Create Droplet** e anote o endereço IP.

  </Step>

  <Step title="Conectar e instalar">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Instalar Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Instalar OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Executar o onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    O assistente orienta você pela autenticação de modelo, configuração de canais, geração de token do gateway e instalação do daemon (systemd).

  </Step>

  <Step title="Adicionar swap (recomendado para Droplets com 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Verificar o gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Acessar a UI de Controle">
    O gateway faz bind em loopback por padrão. Escolha uma destas opções.

    **Opção A: tunnel SSH (mais simples)**

    ```bash
    # A partir da sua máquina local
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Em seguida, abra `http://localhost:18789`.

    **Opção B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Em seguida, abra `https://<magicdns>/` de qualquer dispositivo no seu tailnet.

    **Opção C: bind em tailnet (sem Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Em seguida, abra `http://<tailscale-ip>:18789` (token obrigatório).

  </Step>
</Steps>

## Solução de problemas

**O Gateway não inicia** -- Execute `openclaw doctor --non-interactive` e verifique os logs com `journalctl --user -u openclaw-gateway.service -n 50`.

**A porta já está em uso** -- Execute `lsof -i :18789` para encontrar o processo e então pare-o.

**Sem memória** -- Verifique se o swap está ativo com `free -h`. Se ainda estiver enfrentando OOM, use modelos baseados em API (Claude, GPT) em vez de modelos locais, ou faça upgrade para um Droplet com 2 GB.

## Próximos passos

- [Canais](/pt-BR/channels) -- conecte Telegram, WhatsApp, Discord e mais
- [Configuração do Gateway](/pt-BR/gateway/configuration) -- todas as opções de configuração
- [Atualizando](/pt-BR/install/updating) -- mantenha o OpenClaw atualizado

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Fly.io](/pt-BR/install/fly)
- [Hetzner](/pt-BR/install/hetzner)
- [Hospedagem VPS](/pt-BR/vps)
