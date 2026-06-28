---
read_when:
    - Configurando o OpenClaw na Oracle Cloud
    - Procurando hospedagem VPS gratuita para o OpenClaw
    - Quer OpenClaw 24/7 em um servidor pequeno
summary: Hospede o OpenClaw na camada ARM Always Free da Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-05-06T06:01:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Execute um Gateway OpenClaw persistente na camada ARM **Always Free** da Oracle Cloud (até 4 OCPU, 24 GB de RAM, 200 GB de armazenamento) sem custo.

## Pré-requisitos

- Conta da Oracle Cloud ([cadastro](https://www.oracle.com/cloud/free/)) -- consulte o [guia de cadastro da comunidade](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) se encontrar problemas
- Conta do Tailscale (gratuita em [tailscale.com](https://tailscale.com))
- Um par de chaves SSH
- Cerca de 30 minutos

## Configuração

<Steps>
  <Step title="Criar uma instância OCI">
    1. Entre no [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Navegue até **Compute > Instances > Create Instance**.
    3. Configure:
       - **Nome:** `openclaw`
       - **Imagem:** Ubuntu 24.04 (aarch64)
       - **Forma:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (ou até 4)
       - **Memória:** 12 GB (ou até 24 GB)
       - **Volume de inicialização:** 50 GB (até 200 GB gratuitos)
       - **Chave SSH:** Adicione sua chave pública
    4. Clique em **Create** e anote o endereço IP público.

    <Tip>
    Se a criação da instância falhar com "Out of capacity", tente outro domínio de disponibilidade ou tente novamente mais tarde. A capacidade da camada gratuita é limitada.
    </Tip>

  </Step>

  <Step title="Conectar e atualizar o sistema">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` é necessário para a compilação ARM de algumas dependências.

  </Step>

  <Step title="Configurar usuário e nome do host">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Habilitar o linger mantém os serviços do usuário em execução após o logout.

  </Step>

  <Step title="Instalar o Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    A partir de agora, conecte-se via Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Instalar o OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Quando solicitado "How do you want to hatch your bot?", selecione **Do this later**.

  </Step>

  <Step title="Configurar o Gateway">
    Use autenticação por token com Tailscale Serve para acesso remoto seguro.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` aqui é apenas para o tratamento de IP encaminhado/cliente local do proxy local Tailscale Serve. Ele **não** é `gateway.auth.mode: "trusted-proxy"`. As rotas do visualizador de diff mantêm comportamento fail-closed nesta configuração: solicitações brutas do visualizador para `127.0.0.1` sem cabeçalhos de proxy encaminhado podem retornar `Diff not found`. Use `mode=file` / `mode=both` para anexos, ou habilite intencionalmente visualizadores remotos e defina `plugins.entries.diffs.config.viewerBaseUrl` (ou passe um `baseUrl` de proxy) se precisar de links de visualizador compartilháveis.

  </Step>

  <Step title="Restringir a segurança da VCN">
    Bloqueie todo o tráfego, exceto Tailscale, na borda da rede:

    1. Vá para **Networking > Virtual Cloud Networks** no Console OCI.
    2. Clique na sua VCN e depois em **Security Lists > Default Security List**.
    3. **Remova** todas as regras de entrada, exceto `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Mantenha as regras de saída padrão (permitir todo o tráfego de saída).

    Isso bloqueia SSH na porta 22, HTTP, HTTPS e todo o restante na borda da rede. A partir deste ponto, você só pode se conectar via Tailscale.

  </Step>

  <Step title="Verificar">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Acesse a Control UI de qualquer dispositivo na sua tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Substitua `<tailnet-name>` pelo nome da sua tailnet (visível em `tailscale status`).

  </Step>
</Steps>

## Verificar a postura de segurança

Com a VCN restrita (apenas UDP 41641 aberto) e o Gateway vinculado ao loopback, o tráfego público é bloqueado na borda da rede e o acesso administrativo fica limitado à tailnet. Isso elimina a necessidade de várias etapas tradicionais de proteção de VPS:

| Etapa tradicional        | Necessário?       | Por quê                                                                    |
| ------------------------ | ----------------- | -------------------------------------------------------------------------- |
| Firewall UFW             | Não               | A VCN bloqueia o tráfego antes que ele chegue à instância.                 |
| fail2ban                 | Não               | A porta 22 é bloqueada na VCN; não há superfície de força bruta.           |
| Proteção do sshd         | Não               | O SSH do Tailscale não usa sshd.                                           |
| Desabilitar login root   | Não               | O Tailscale autentica pela identidade da tailnet, não por usuários do sistema. |
| Autenticação só por chave SSH | Não          | O mesmo — a identidade da tailnet substitui as chaves SSH do sistema.      |
| Proteção IPv6            | Geralmente não    | Depende das configurações da VCN/sub-rede; verifique o que está realmente atribuído/exposto. |

Ainda recomendado:

- `chmod 700 ~/.openclaw` para restringir permissões de arquivos de credenciais.
- `openclaw security audit` para uma verificação de postura específica do OpenClaw.
- `sudo apt update && sudo apt upgrade` regularmente para patches do sistema operacional.
- Revisar periodicamente os dispositivos no [console de administração do Tailscale](https://login.tailscale.com/admin).

Comandos rápidos de verificação:

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## Notas sobre ARM

A camada Always Free é ARM (`aarch64`). A maioria dos recursos do OpenClaw funciona bem; um pequeno número de binários nativos precisa de builds ARM:

- Node.js, Telegram, WhatsApp (Baileys): JavaScript puro, sem problemas.
- A maioria dos pacotes npm com código nativo: artefatos pré-compilados `linux-arm64` disponíveis.
- Auxiliares opcionais de CLI (por exemplo, binários Go/Rust enviados por Skills): verifique se há uma release `aarch64` / `linux-arm64` antes de instalar.

Verifique a arquitetura com `uname -m` (deve imprimir `aarch64`). Para binários sem build ARM, instale a partir do código-fonte ou ignore-os.

## Persistência e backups

O estado do OpenClaw fica em:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` por agente, estado de canal/provedor e dados de sessão.
- `~/.openclaw/workspace/` — o workspace do agente (SOUL.md, memória, artefatos).

Eles sobrevivem a reinicializações. Para criar um snapshot portátil:

```bash
openclaw backup create
```

## Alternativa: túnel SSH

Se o Tailscale Serve não estiver funcionando, use um túnel SSH a partir da sua máquina local:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Então abra `http://localhost:18789`.

## Solução de problemas

**A criação da instância falha ("Out of capacity")** -- Instâncias ARM da camada gratuita são populares. Tente outro domínio de disponibilidade ou tente novamente fora dos horários de pico.

**O Tailscale não conecta** -- Execute `sudo tailscale up --ssh --hostname=openclaw --reset` para autenticar novamente.

**O Gateway não inicia** -- Execute `openclaw doctor --non-interactive` e verifique os logs com `journalctl --user -u openclaw-gateway.service -n 50`.

**Problemas com binários ARM** -- A maioria dos pacotes npm funciona em ARM64. Para binários nativos, procure releases `linux-arm64` ou `aarch64`. Verifique a arquitetura com `uname -m`.

## Próximos passos

- [Canais](/pt-BR/channels) -- conecte Telegram, WhatsApp, Discord e mais
- [Configuração do Gateway](/pt-BR/gateway/configuration) -- todas as opções de configuração
- [Atualização](/pt-BR/install/updating) -- mantenha o OpenClaw atualizado

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [GCP](/pt-BR/install/gcp)
- [Hospedagem VPS](/pt-BR/vps)
