---
read_when:
    - Configurando o OpenClaw em um Raspberry Pi
    - Executando o OpenClaw em dispositivos ARM
    - Criando uma IA pessoal econômica e sempre ativa
summary: Hospede o OpenClaw em um Raspberry Pi para auto-hospedagem sempre ativa
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-12T15:23:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Execute um Gateway OpenClaw persistente e sempre ativo em um Raspberry Pi. Como o Pi funciona apenas como gateway (os modelos são executados na nuvem via API), até mesmo um Pi modesto lida bem com a carga de trabalho — o custo típico do hardware é de **$35-80, pago uma única vez**, sem mensalidades.

## Compatibilidade de hardware

| Modelo do Pi | RAM    | Funciona? | Observações                                      |
| ------------ | ------ | ---------- | ------------------------------------------------ |
| Pi 5         | 4/8 GB | Melhor     | O mais rápido, recomendado.                      |
| Pi 4         | 4 GB   | Bom        | Equilíbrio ideal para a maioria dos usuários.    |
| Pi 4         | 2 GB   | Aceitável  | Adicione swap.                                   |
| Pi 4         | 1 GB   | Limitado   | Possível com swap e configuração mínima.         |
| Pi 3B+       | 1 GB   | Lento      | Funciona, mas com lentidão.                      |
| Pi Zero 2 W  | 512 MB | Não        | Não recomendado.                                 |

**Mínimo:** 1 GB de RAM, 1 núcleo, 500 MB de espaço livre em disco, sistema operacional de 64 bits.
**Recomendado:** 2 GB+ de RAM, cartão SD de 16 GB+ (ou SSD USB), Ethernet.

## Pré-requisitos

- Raspberry Pi 4 ou 5 com 2 GB+ de RAM (4 GB recomendados)
- Cartão microSD (16 GB+) ou SSD USB (melhor desempenho)
- Fonte de alimentação oficial do Pi
- Conexão de rede (Ethernet ou WiFi)
- Raspberry Pi OS de 64 bits (obrigatório — não use a versão de 32 bits)
- Cerca de 30 minutos

## Configuração

<Steps>
  <Step title="Grave o sistema operacional">
    Use o **Raspberry Pi OS Lite (64-bit)** — não é necessário um ambiente gráfico para um servidor headless.

    1. Baixe o [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Escolha o sistema operacional: **Raspberry Pi OS Lite (64-bit)**.
    3. Na caixa de diálogo de configurações, faça a pré-configuração:
       - Nome do host: `gateway-host`
       - Habilite o SSH
       - Defina o nome de usuário e a senha
       - Configure o WiFi (se não estiver usando Ethernet)
    4. Grave no cartão SD ou na unidade USB, insira-o e inicialize o Pi.

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

    # Defina o fuso horário (importante para o cron e os lembretes)
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

    # Reduza o uso de swap em dispositivos com pouca RAM
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

    Siga o assistente. Chaves de API são recomendadas em vez de OAuth para dispositivos headless. O Telegram é o canal mais fácil para começar.

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

    Abra a URL exibida no navegador local. Para acesso remoto sempre ativo, consulte a [integração com o Tailscale](/pt-BR/gateway/tailscale).

  </Step>
</Steps>

## Dicas de desempenho

**Use um SSD USB** — cartões SD são lentos e se desgastam. Um SSD USB melhora drasticamente o desempenho e suporta mais ciclos de gravação; use-o para `OPENCLAW_STATE_DIR` caso mantenha o sistema operacional no cartão SD. Consulte o [guia de inicialização do Pi por USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Habilite o cache de compilação de módulos** — Acelera as invocações repetidas da CLI em hosts Pi de menor potência. `OPENCLAW_NO_RESPAWN=1` mantém as reinicializações rotineiras do Gateway no mesmo processo, evitando transferências adicionais entre processos e simplificando o rastreamento do PID em hosts pequenos:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Use `/var/tmp`, não `/tmp` — algumas distribuições limpam `/tmp` durante a inicialização, descartando o cache previamente aquecido.

**Reduza o uso de memória** — Para configurações headless, libere memória da GPU e desabilite serviços não utilizados:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Configuração complementar do systemd para reinicializações estáveis** — Se este Pi for usado principalmente para executar o OpenClaw, adicione uma configuração complementar ao serviço:

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

Em seguida, execute `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. Em um Pi headless, também habilite a permanência da sessão uma vez para que o serviço do usuário continue ativo após o logout: `sudo loginctl enable-linger "$(whoami)"`.

## Configuração de modelo recomendada

Como o Pi executa apenas o gateway, use modelos de API hospedados na nuvem — não execute LLMs locais em um Pi, pois até mesmo modelos pequenos são lentos demais para serem úteis:

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

A maioria dos recursos do OpenClaw funciona em ARM64 sem alterações (Node.js, Telegram, WhatsApp/Baileys, Chromium). Os binários que ocasionalmente não oferecem compilações para ARM geralmente são ferramentas CLI opcionais em Go/Rust fornecidas por Skills. Verifique a arquitetura com `uname -m` (deve exibir `aarch64`) e, em seguida, consulte a página de lançamentos do binário ausente em busca de artefatos `linux-arm64` / `aarch64` antes de recorrer à compilação a partir do código-fonte.

## Persistência e backups

O estado do OpenClaw fica armazenado em:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` por agente, estado de canais/provedores e sessões.
- `~/.openclaw/workspace/` — espaço de trabalho do agente (SOUL.md, memória, artefatos).

Esses dados persistem após reinicializações e se beneficiam do uso de SSD em vez de cartão SD, tanto em desempenho quanto em durabilidade. Crie um snapshot portátil com:

```bash
openclaw backup create
```

## Solução de problemas

**Memória insuficiente** — Verifique se o swap está ativo com `free -h`. Desabilite os serviços não utilizados (`sudo systemctl disable cups bluetooth avahi-daemon`). Use apenas modelos baseados em API.

**Desempenho lento** — Use um SSD USB em vez de um cartão SD. Verifique se há limitação da CPU com `vcgencmd get_throttled` (deve retornar `0x0`).

**O serviço não inicia** — Consulte os logs com `journalctl --user -u openclaw-gateway.service --no-pager -n 100` e execute `openclaw doctor --non-interactive`. Se este for um Pi headless, verifique também se a permanência da sessão está habilitada: `sudo loginctl enable-linger "$(whoami)"`.

**Problemas com binários ARM** — Se uma skill falhar com "exec format error", verifique se o binário possui uma compilação para ARM64. Verifique a arquitetura com `uname -m` (deve exibir `aarch64`).

**Quedas no WiFi** — Desabilite o gerenciamento de energia do WiFi: `sudo iwconfig wlan0 power off`.

## Próximas etapas

- [Canais](/pt-BR/channels) — conecte o Telegram, WhatsApp, Discord e outros
- [Configuração do Gateway](/pt-BR/gateway/configuration) — todas as opções de configuração
- [Atualização](/pt-BR/install/updating) — mantenha o OpenClaw atualizado

## Relacionados

- [Visão geral da instalação](/pt-BR/install)
- [Servidor Linux](/pt-BR/vps)
- [Plataformas](/pt-BR/platforms)
