---
read_when:
    - Configurando o OpenClaw na DigitalOcean
    - Procurando um VPS pago simples para o OpenClaw
summary: Hospede o OpenClaw em um Droplet da DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-12T00:02:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

Execute um Gateway persistente do OpenClaw em um Droplet da DigitalOcean (~US$ 6/mês no plano Basic de 1 GB).

A DigitalOcean é uma opção simples de VPS pago. Para opções mais baratas ou gratuitas:

- [Hetzner](/pt-BR/install/hetzner) -- mais núcleos/RAM por dólar.
- [Oracle Cloud](/pt-BR/install/oracle) -- nível ARM Always Free (até 4 OCPUs e 24 GB de RAM), mas o cadastro pode ser trabalhoso e está disponível apenas para ARM.

## Pré-requisitos

- Conta da DigitalOcean ([cadastro](https://cloud.digitalocean.com/registrations/new))
- Par de chaves SSH (ou disposição para usar autenticação por senha)
- Cerca de 20 minutos

## Configuração

<Steps>
  <Step title="Criar um Droplet">
    <Warning>
    Use uma imagem-base limpa (Ubuntu 24.04 LTS). Evite imagens de instalação com um clique de terceiros do Marketplace, a menos que você tenha revisado os scripts de inicialização e as configurações padrão de firewall.
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

    # Instalar o Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Instalar o OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Criar o usuário não root que será proprietário do estado e dos serviços do OpenClaw.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    Use o shell de root apenas para a configuração inicial do sistema. Execute os comandos do OpenClaw como o usuário não root `openclaw`, para que o estado fique em `/home/openclaw/.openclaw/` e o Gateway seja instalado como serviço `--user` do systemd desse usuário.

  </Step>

  <Step title="Executar a configuração inicial">
    ```bash
    openclaw onboard --install-daemon
    ```

    O assistente orienta você pela autenticação do modelo, configuração de canais, geração do token do Gateway e instalação do daemon (serviço de usuário do systemd).

  </Step>

  <Step title="Adicionar swap (recomendado para Droplets de 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Verificar o Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Acessar a interface de controle">
    Por padrão, o Gateway escuta no local loopback. Escolha uma destas opções.

    **Opção A: túnel SSH (mais simples)**

    ```bash
    # Na sua máquina local
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Em seguida, abra `http://localhost:18789`.

    **Opção B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Em seguida, abra `https://<magicdns>/` em qualquer dispositivo da sua tailnet.

    O Tailscale Serve autentica o tráfego da interface de controle e do WebSocket por meio de cabeçalhos de identidade da tailnet, o que pressupõe que o próprio host do Gateway seja confiável. Os endpoints da API HTTP continuam seguindo o modo de autenticação normal do Gateway (token/senha), independentemente disso. Para exigir credenciais explícitas de segredo compartilhado por meio do Serve, defina `gateway.auth.allowTailscale: false` e use `gateway.auth.mode: "token"` ou `"password"`.

    **Opção C: vinculação à tailnet (sem Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Em seguida, abra `http://<tailscale-ip>:18789` (token obrigatório).

  </Step>
</Steps>

## Persistência e backups

O estado do OpenClaw fica em:

- `~/.openclaw/` -- `openclaw.json`, credenciais de canais/provedores, `auth-profiles.json` de cada agente e dados de sessão.
- `~/.openclaw/workspace/` -- o espaço de trabalho do agente (SOUL.md, memória e artefatos).

Esses dados persistem após reinicializações do Droplet. Para criar um snapshot portátil:

```bash
openclaw backup create
```

Os snapshots da DigitalOcean fazem backup de todo o Droplet; `openclaw backup create` é portátil entre hosts.

## Dicas para 1 GB de RAM

O Droplet de US$ 6 tem apenas 1 GB de RAM. Para manter o funcionamento estável:

- Certifique-se de que a etapa de swap acima esteja registrada em `/etc/fstab`, para que persista após reinicializações.
- Prefira modelos baseados em API (Claude, GPT) em vez de modelos locais -- a inferência local de LLM não cabe em 1 GB.
- Defina `agents.defaults.model.primary` como um modelo menor se ocorrerem erros de falta de memória em prompts grandes.
- Monitore com `free -h` e `htop`.

## Solução de problemas

**O Gateway não inicia** -- Execute `openclaw doctor --non-interactive` e verifique os logs com `journalctl --user -u openclaw-gateway.service -n 50`.

**Porta já em uso** -- Execute `lsof -i :18789` para encontrar o processo e, em seguida, interrompa-o.

**Memória insuficiente** -- Verifique se a swap está ativa com `free -h`. Se ainda ocorrerem erros de falta de memória, use modelos baseados em API (Claude, GPT) em vez de modelos locais ou faça upgrade para um Droplet de 2 GB.

## Próximas etapas

- [Canais](/pt-BR/channels) -- conecte Telegram, WhatsApp, Discord e outros
- [Configuração do Gateway](/pt-BR/gateway/configuration) -- todas as opções de configuração
- [Atualização](/pt-BR/install/updating) -- mantenha o OpenClaw atualizado

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Fly.io](/pt-BR/install/fly)
- [Hetzner](/pt-BR/install/hetzner)
- [Hospedagem em VPS](/pt-BR/vps)
