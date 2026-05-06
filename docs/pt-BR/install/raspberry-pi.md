---
read_when:
    - Configurando o OpenClaw em um Raspberry Pi
    - Executando o OpenClaw em dispositivos ARM
    - Criando uma IA pessoal barata e sempre ativa
summary: Hospede o OpenClaw em um Raspberry Pi para auto-hospedagem sempre ativa
title: Raspberry Pi
x-i18n:
    generated_at: "2026-05-06T06:01:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96df076c2707b0b27751d452f15fad774356a86e96d10bce998581235776c4bc
    source_path: install/raspberry-pi.md
    workflow: 16
---

Execute um Gateway OpenClaw persistente e sempre ativo em um Raspberry Pi. Como o Pi é apenas o gateway (os modelos são executados na nuvem via API), até um Pi modesto lida bem com a carga de trabalho — o custo típico de hardware é **US$ 35–80 uma única vez**, sem mensalidades.

## Compatibilidade de hardware

| Modelo de Pi | RAM    | Funciona? | Observações                                |
| ------------ | ------ | --------- | ------------------------------------------ |
| Pi 5         | 4/8 GB | Melhor    | Mais rápido, recomendado.                  |
| Pi 4         | 4 GB   | Bom       | Ponto ideal para a maioria dos usuários.   |
| Pi 4         | 2 GB   | OK        | Adicione swap.                             |
| Pi 4         | 1 GB   | Apertado  | Possível com swap, configuração mínima.    |
| Pi 3B+       | 1 GB   | Lento     | Funciona, mas com lentidão.                |
| Pi Zero 2 W  | 512 MB | Não       | Não recomendado.                           |

**Mínimo:** 1 GB de RAM, 1 núcleo, 500 MB de disco livre, sistema operacional de 64 bits.
**Recomendado:** 2 GB+ de RAM, cartão SD de 16 GB+ (ou SSD USB), Ethernet.

## Pré-requisitos

- Raspberry Pi 4 ou 5 com 2 GB+ de RAM (4 GB recomendado)
- Cartão MicroSD (16 GB+) ou SSD USB (melhor desempenho)
- Fonte de alimentação oficial do Pi
- Conexão de rede (Ethernet ou WiFi)
- Raspberry Pi OS de 64 bits (obrigatório -- não use 32 bits)
- Cerca de 30 minutos

## Configuração

<Steps>
  <Step title="Grave o sistema operacional">
    Use **Raspberry Pi OS Lite (64-bit)** -- não é necessário desktop para um servidor sem monitor.

    1. Baixe o [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Escolha o sistema operacional: **Raspberry Pi OS Lite (64-bit)**.
    3. Na caixa de diálogo de configurações, pré-configure:
       - Nome do host: `gateway-host`
       - Habilite SSH
       - Defina nome de usuário e senha
       - Configure WiFi (se não estiver usando Ethernet)
    4. Grave no seu cartão SD ou unidade USB, insira-o e inicialize o Pi.

  </Step>

  <Step title="Conecte via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Atualize o sistema">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Instale o Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Adicione swap (importante para 2 GB ou menos)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Instale o OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Execute a configuração inicial">
    ```bash
    openclaw onboard --install-daemon
    ```

    Siga o assistente. Chaves de API são recomendadas em vez de OAuth para dispositivos sem monitor. Telegram é o canal mais fácil para começar.

  </Step>

  <Step title="Verifique">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Acesse a Control UI">
    No seu computador, obtenha uma URL do painel a partir do Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Em seguida, crie um túnel SSH em outro terminal:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Abra a URL exibida no seu navegador local. Para acesso remoto sempre ativo, consulte a [integração com Tailscale](/pt-BR/gateway/tailscale).

  </Step>
</Steps>

## Dicas de desempenho

**Use um SSD USB** -- Cartões SD são lentos e se desgastam. Um SSD USB melhora drasticamente o desempenho. Consulte o [guia de inicialização USB do Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Habilite o cache de compilação de módulos** -- Acelera invocações repetidas da CLI em hosts Pi de menor potência:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Reduza o uso de memória** -- Para configurações sem monitor, libere memória da GPU e desabilite serviços não usados:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Drop-in do systemd para reinicializações estáveis** -- Se este Pi executa principalmente o OpenClaw, adicione um drop-in de serviço:

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

Em seguida, `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. Em um Pi sem monitor, também habilite lingering uma vez para que o serviço de usuário sobreviva ao logout: `sudo loginctl enable-linger "$(whoami)"`.

## Configuração de modelo recomendada

Como o Pi executa apenas o gateway, use modelos de API hospedados na nuvem:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

Não execute LLMs locais em um Pi — até modelos pequenos são lentos demais para serem úteis. Deixe Claude ou GPT fazerem o trabalho do modelo.

## Observações sobre binários ARM

A maioria dos recursos do OpenClaw funciona em ARM64 sem alterações (Node.js, Telegram, WhatsApp/Baileys, Chromium). Os binários que ocasionalmente não têm builds ARM normalmente são ferramentas CLI opcionais em Go/Rust enviadas por Skills. Verifique a página de release de um binário ausente em busca de artefatos `linux-arm64` / `aarch64` antes de recorrer à compilação a partir do código-fonte.

## Persistência e backups

O estado do OpenClaw fica em:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` por agente, estado de canais/provedores, sessões.
- `~/.openclaw/workspace/` — workspace do agente (SOUL.md, memória, artefatos).

Eles sobrevivem a reinicializações. Faça um snapshot portátil com:

```bash
openclaw backup create
```

Se você mantiver esses arquivos em um SSD, tanto o desempenho quanto a durabilidade melhoram em comparação com o cartão SD.

## Solução de problemas

**Sem memória** -- Verifique se o swap está ativo com `free -h`. Desabilite serviços não usados (`sudo systemctl disable cups bluetooth avahi-daemon`). Use apenas modelos baseados em API.

**Desempenho lento** -- Use um SSD USB em vez de um cartão SD. Verifique se há limitação de CPU com `vcgencmd get_throttled` (deve retornar `0x0`).

**O serviço não inicia** -- Verifique os logs com `journalctl --user -u openclaw-gateway.service --no-pager -n 100` e execute `openclaw doctor --non-interactive`. Se este for um Pi sem monitor, também verifique se lingering está habilitado: `sudo loginctl enable-linger "$(whoami)"`.

**Problemas com binários ARM** -- Se uma skill falhar com "exec format error", verifique se o binário tem um build ARM64. Verifique a arquitetura com `uname -m` (deve mostrar `aarch64`).

**Quedas de WiFi** -- Desabilite o gerenciamento de energia do WiFi: `sudo iwconfig wlan0 power off`.

## Próximos passos

- [Canais](/pt-BR/channels) -- conecte Telegram, WhatsApp, Discord e outros
- [Configuração do Gateway](/pt-BR/gateway/configuration) -- todas as opções de configuração
- [Atualização](/pt-BR/install/updating) -- mantenha o OpenClaw atualizado

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Servidor Linux](/pt-BR/vps)
- [Plataformas](/pt-BR/platforms)
