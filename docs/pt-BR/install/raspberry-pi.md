---
read_when:
    - Configurando o OpenClaw em um Pi
    - Executando o OpenClaw em dispositivos ARM
    - Construindo uma IA pessoal barata e sempre ativa
summary: Hospede o OpenClaw em um Pi para auto-hospedagem sempre ativa
title: Pi
x-i18n:
    generated_at: "2026-04-24T05:59:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 15
---

Execute um Gateway do OpenClaw persistente e sempre ativo em um Pi. Como o Pi é apenas o gateway (os modelos rodam na nuvem via API), até mesmo um Pi modesto lida bem com a carga de trabalho.

## Pré-requisitos

- Pi 4 ou 5 com 2 GB+ de RAM (4 GB recomendado)
- Cartão MicroSD (16 GB+) ou SSD USB (melhor desempenho)
- Fonte de alimentação oficial do Pi
- Conexão de rede (Ethernet ou WiFi)
- Raspberry Pi OS 64-bit (obrigatório -- não use 32-bit)
- Cerca de 30 minutos

## Configuração

<Steps>
  <Step title="Gravar o sistema operacional">
    Use **Raspberry Pi OS Lite (64-bit)** -- não é necessário ambiente gráfico para um servidor headless.

    1. Baixe o [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Escolha o SO: **Raspberry Pi OS Lite (64-bit)**.
    3. Na caixa de diálogo de configurações, pré-configure:
       - Hostname: `gateway-host`
       - Habilitar SSH
       - Definir nome de usuário e senha
       - Configurar WiFi (se não estiver usando Ethernet)
    4. Grave no cartão SD ou unidade USB, insira e inicialize o Pi.

  </Step>

  <Step title="Conectar via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Atualizar o sistema">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Define o fuso horário (importante para Cron e lembretes)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Instalar Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Adicionar swap (importante para 2 GB ou menos)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduz swappiness para dispositivos com pouca RAM
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Instalar o OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Executar o onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Siga o assistente. Chaves de API são recomendadas em vez de OAuth para dispositivos headless. Telegram é o canal mais fácil para começar.

  </Step>

  <Step title="Verificar">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Acessar a Control UI">
    No seu computador, obtenha uma URL do dashboard a partir do Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Depois crie um túnel SSH em outro terminal:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Abra a URL impressa no seu navegador local. Para acesso remoto sempre ativo, consulte [integração com Tailscale](/pt-BR/gateway/tailscale).

  </Step>
</Steps>

## Dicas de desempenho

**Use um SSD USB** -- cartões SD são lentos e se desgastam. Um SSD USB melhora drasticamente o desempenho. Consulte o [guia de boot por USB do Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Habilite cache de compilação de módulos** -- acelera invocações repetidas da CLI em hosts Pi com menor potência:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Reduza o uso de memória** -- para configurações headless, libere memória da GPU e desabilite serviços não usados:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Solução de problemas

**Sem memória** -- Verifique se o swap está ativo com `free -h`. Desabilite serviços não usados (`sudo systemctl disable cups bluetooth avahi-daemon`). Use apenas modelos baseados em API.

**Desempenho lento** -- Use um SSD USB em vez de cartão SD. Verifique limitação térmica/energética da CPU com `vcgencmd get_throttled` (deve retornar `0x0`).

**O serviço não inicia** -- Verifique os logs com `journalctl --user -u openclaw-gateway.service --no-pager -n 100` e execute `openclaw doctor --non-interactive`. Se este for um Pi headless, verifique também se lingering está habilitado: `sudo loginctl enable-linger "$(whoami)"`.

**Problemas com binários ARM** -- Se uma Skill falhar com "exec format error", verifique se o binário tem build para ARM64. Confirme a arquitetura com `uname -m` (deve mostrar `aarch64`).

**WiFi cai** -- Desabilite o gerenciamento de energia do WiFi: `sudo iwconfig wlan0 power off`.

## Próximos passos

- [Canais](/pt-BR/channels) -- conecte Telegram, WhatsApp, Discord e mais
- [Configuração do Gateway](/pt-BR/gateway/configuration) -- todas as opções de configuração
- [Atualizando](/pt-BR/install/updating) -- mantenha o OpenClaw atualizado

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Servidor Linux](/pt-BR/vps)
- [Plataformas](/pt-BR/platforms)
