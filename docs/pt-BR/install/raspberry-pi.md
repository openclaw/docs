---
read_when:
    - Configurando o OpenClaw em um Raspberry Pi
    - Executando o OpenClaw em dispositivos ARM
    - Criando uma IA pessoal econômica e sempre ativa
summary: Hospede o OpenClaw em um Raspberry Pi para auto-hospedagem sempre ativa
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-12T00:03:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Execute um Gateway do OpenClaw persistente e sempre ativo em um Raspberry Pi. Como o Pi funciona apenas como gateway (os modelos são executados na nuvem via API), mesmo um Pi modesto lida bem com a carga de trabalho — o custo típico do hardware é de **US$ 35–80, pago uma única vez**, sem mensalidades.

## Compatibilidade de hardware

| Modelo do Pi | RAM    | Funciona? | Observações                                  |
| ------------ | ------ | ---------- | -------------------------------------------- |
| Pi 5         | 4/8 GB | Melhor     | O mais rápido; recomendado.                  |
| Pi 4         | 4 GB   | Bom        | Equilíbrio ideal para a maioria dos usuários. |
| Pi 4         | 2 GB   | Adequado   | Adicione swap.                               |
| Pi 4         | 1 GB   | Limitado   | Possível com swap e configuração mínima.     |
| Pi 3B+       | 1 GB   | Lento      | Funciona, mas com lentidão.                  |
| Pi Zero 2 W  | 512 MB | Não        | Não recomendado.                             |

**Mínimo:** 1 GB de RAM, 1 núcleo, 500 MB de espaço livre em disco e sistema operacional de 64 bits.
**Recomendado:** 2 GB ou mais de RAM, cartão SD de 16 GB ou mais (ou SSD USB) e Ethernet.

## Pré-requisitos

- Raspberry Pi 4 ou 5 com 2 GB ou mais de RAM (4 GB recomendados)
- Cartão microSD (16 GB ou mais) ou SSD USB (melhor desempenho)
- Fonte de alimentação oficial do Pi
- Conexão de rede (Ethernet ou WiFi)
- Raspberry Pi OS de 64 bits (obrigatório — não use a versão de 32 bits)
- Cerca de 30 minutos

## Configuração

<Steps>
  <Step title="Grave o sistema operacional">
    Use o **Raspberry Pi OS Lite (64-bit)** — não é necessário um ambiente de desktop para um servidor sem monitor.

    1. Baixe o [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Escolha o sistema operacional: **Raspberry Pi OS Lite (64-bit)**.
    3. Na caixa de diálogo de configurações, faça a pré-configuração:
       - Nome do host: `gateway-host`
       - Ative o SSH
       - Defina o nome de usuário e a senha
       - Configure o WiFi (se não estiver usando Ethernet)
    4. Grave a imagem no cartão SD ou na unidade USB, insira-o e inicialize o Pi.

  </Step>

  <Step title="Conecte-se via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Atualize o sistema">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Defina o fuso horário (importante para cron e lembretes)
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

    # Reduza a tendência de uso de swap em dispositivos com pouca RAM
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Instale o OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Execute a integração inicial">
    ```bash
    openclaw onboard --install-daemon
    ```

    Siga o assistente. Chaves de API são recomendadas em vez de OAuth para dispositivos sem monitor. O Telegram é o canal mais fácil para começar.

  </Step>

  <Step title="Verifique">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Acesse a interface de controle">
    No seu computador, obtenha uma URL do painel no Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Em seguida, crie um túnel SSH em outro terminal:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Abra a URL exibida no navegador local. Para acesso remoto permanente, consulte a [integração com o Tailscale](/pt-BR/gateway/tailscale).

  </Step>
</Steps>

## Dicas de desempenho

**Use um SSD USB** — cartões SD são lentos e se desgastam. Um SSD USB melhora consideravelmente o desempenho e suporta mais ciclos de gravação; use-o para `OPENCLAW_STATE_DIR` caso mantenha o sistema operacional no SD. Consulte o [guia de inicialização por USB do Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Ative o cache de compilação de módulos** — acelera execuções repetidas da CLI em hosts Pi com menor capacidade de processamento. `OPENCLAW_NO_RESPAWN=1` mantém as reinicializações rotineiras do Gateway no mesmo processo, evitando transferências adicionais entre processos e simplificando o acompanhamento do PID em hosts pequenos:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Use `/var/tmp`, não `/tmp` — algumas distribuições limpam `/tmp` durante a inicialização, o que remove o cache já aquecido.

**Reduza o uso de memória** — para configurações sem monitor, libere memória da GPU e desative serviços não utilizados:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Configuração complementar do systemd para reinicializações estáveis** — se este Pi for usado principalmente para executar o OpenClaw, adicione uma configuração complementar ao serviço:

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

Depois, execute `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. Em um Pi sem monitor, também ative uma vez a permanência do serviço para que o serviço do usuário continue em execução após o logout: `sudo loginctl enable-linger "$(whoami)"`.

## Configuração de modelo recomendada

Como o Pi executa apenas o gateway, use modelos de API hospedados na nuvem — não execute LLMs locais em um Pi, pois mesmo os modelos pequenos são lentos demais para serem úteis:

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

## Observações sobre binários ARM

A maioria dos recursos do OpenClaw funciona em ARM64 sem alterações (Node.js, Telegram, WhatsApp/Baileys e Chromium). Os binários que ocasionalmente não têm compilações para ARM costumam ser ferramentas opcionais de CLI em Go/Rust fornecidas por skills. Verifique a arquitetura com `uname -m` (deve exibir `aarch64`) e consulte a página de lançamentos do binário ausente para procurar artefatos `linux-arm64` / `aarch64` antes de recorrer à compilação a partir do código-fonte.

## Persistência e backups

O estado do OpenClaw fica em:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` de cada agente, estado de canais/provedores e sessões.
- `~/.openclaw/workspace/` — espaço de trabalho do agente (SOUL.md, memória e artefatos).

Esses dados sobrevivem às reinicializações e se beneficiam do uso de SSD em vez de cartão SD, tanto em desempenho quanto em longevidade. Crie um snapshot portátil com:

```bash
openclaw backup create
```

## Solução de problemas

**Memória insuficiente** — verifique se a swap está ativa com `free -h`. Desative serviços não utilizados (`sudo systemctl disable cups bluetooth avahi-daemon`). Use apenas modelos baseados em API.

**Desempenho lento** — use um SSD USB em vez de um cartão SD. Verifique se há limitação da CPU com `vcgencmd get_throttled` (deve retornar `0x0`).

**O serviço não inicia** — consulte os logs com `journalctl --user -u openclaw-gateway.service --no-pager -n 100` e execute `openclaw doctor --non-interactive`. Se este for um Pi sem monitor, verifique também se a permanência está ativada: `sudo loginctl enable-linger "$(whoami)"`.

**Problemas com binários ARM** — se uma skill falhar com "exec format error", verifique se o binário possui uma compilação para ARM64. Confirme a arquitetura com `uname -m` (deve exibir `aarch64`).

**Quedas do WiFi** — desative o gerenciamento de energia do WiFi: `sudo iwconfig wlan0 power off`.

## Próximas etapas

- [Canais](/pt-BR/channels) — conecte Telegram, WhatsApp, Discord e outros
- [Configuração do Gateway](/pt-BR/gateway/configuration) — todas as opções de configuração
- [Atualização](/pt-BR/install/updating) — mantenha o OpenClaw atualizado

## Conteúdo relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Servidor Linux](/pt-BR/vps)
- [Plataformas](/pt-BR/platforms)
