---
read_when:
    - Configurando o OpenClaw no Oracle Cloud
    - Procurando hospedagem VPS gratuita para o OpenClaw
    - Quer o OpenClaw disponível 24 horas por dia, 7 dias por semana, em um servidor pequeno
summary: Hospede o OpenClaw na camada ARM Always Free da Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-12T00:03:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

Execute um Gateway persistente do OpenClaw na camada ARM **Always Free** da Oracle Cloud (até 4 OCPUs, 24 GB de RAM e 200 GB de armazenamento) sem custo.

## Pré-requisitos

- Conta da Oracle Cloud ([cadastro](https://www.oracle.com/cloud/free/)) -- consulte o [guia de cadastro da comunidade](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) se tiver problemas
- Conta do Tailscale (gratuita em [tailscale.com](https://tailscale.com))
- Um par de chaves SSH
- Cerca de 30 minutos

## Configuração

<Steps>
  <Step title="Criar uma instância do OCI">
    1. Entre no [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Acesse **Compute > Instances > Create Instance**.
    3. Configure:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (ou até 4)
       - **Memory:** 12 GB (ou até 24 GB)
       - **Boot volume:** 50 GB (até 200 GB gratuitos)
       - **SSH key:** adicione sua chave pública
    4. Clique em **Create** e anote o endereço IP público.

    <Tip>
    Se a criação da instância falhar com "Out of capacity", tente outro domínio de disponibilidade ou tente novamente mais tarde. A capacidade da camada gratuita é limitada.
    </Tip>

  </Step>

  <Step title="Conectar-se e atualizar o sistema">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` é necessário para compilar algumas dependências para ARM.

  </Step>

  <Step title="Configurar o usuário e o nome do host">
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

    A partir de agora, conecte-se pelo Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Instalar o OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Quando a mensagem "How do you want to hatch your bot?" aparecer, selecione **Do this later**.

  </Step>

  <Step title="Configurar o Gateway">
    Use autenticação por token com o Tailscale Serve para obter acesso remoto seguro.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` aqui serve apenas para o processamento de IP encaminhado/cliente local pelo proxy local do Tailscale Serve. Isso **não** é `gateway.auth.mode: "trusted-proxy"`. As rotas do visualizador de diferenças mantêm o comportamento de bloqueio seguro nesta configuração: solicitações brutas do visualizador vindas de `127.0.0.1` sem cabeçalhos encaminhados pelo proxy retornam `Diff not found`. Use `mode=file` / `mode=both` para anexos ou habilite intencionalmente visualizadores remotos e defina `plugins.entries.diffs.config.viewerBaseUrl` (ou forneça um `baseUrl` ao proxy) se precisar de links compartilháveis do visualizador.

  </Step>

  <Step title="Restringir a segurança da VCN">
    Bloqueie todo o tráfego, exceto o Tailscale, na borda da rede:

    1. Acesse **Networking > Virtual Cloud Networks** no OCI Console.
    2. Clique na sua VCN e depois em **Security Lists > Default Security List**.
    3. **Remova** todas as regras de entrada, exceto `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Mantenha as regras de saída padrão (permitir todo o tráfego de saída).

    Isso bloqueia SSH na porta 22, HTTP, HTTPS e todo o restante na borda da rede. Desse ponto em diante, você só poderá se conectar pelo Tailscale.

  </Step>

  <Step title="Verificar">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Acesse a interface de controle em qualquer dispositivo da sua tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Substitua `<tailnet-name>` pelo nome da sua tailnet (visível em `tailscale status`).

  </Step>
</Steps>

## Verificar a postura de segurança

Com a VCN restrita (somente a porta UDP 41641 aberta) e o Gateway vinculado ao local loopback, o tráfego público é bloqueado na borda da rede e o acesso administrativo fica restrito à tailnet. Isso elimina a necessidade de várias etapas tradicionais de proteção de VPS:

| Etapa tradicional                 | Necessária?       | Motivo                                                                         |
| --------------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| Firewall UFW                      | Não               | A VCN bloqueia o tráfego antes que ele chegue à instância.                     |
| fail2ban                          | Não               | A porta 22 está bloqueada na VCN; não há superfície para ataques de força bruta. |
| Proteção do sshd                  | Não               | O SSH do Tailscale não usa o sshd.                                             |
| Desabilitar o login do usuário root | Não             | O Tailscale autentica pela identidade da tailnet, não por usuários do sistema. |
| Autenticação SSH somente por chave | Não              | Da mesma forma, a identidade da tailnet substitui as chaves SSH do sistema.    |
| Proteção de IPv6                  | Geralmente não    | Depende das configurações da VCN/sub-rede; verifique o que está realmente atribuído/exposto. |

Ainda recomendado:

- `chmod 700 ~/.openclaw` para restringir as permissões dos arquivos de credenciais.
- `openclaw security audit` para uma verificação da postura específica do OpenClaw.
- Executar regularmente `sudo apt update && sudo apt upgrade` para aplicar correções do sistema operacional.
- Revisar periodicamente os dispositivos no [console de administração do Tailscale](https://login.tailscale.com/admin).

Comandos rápidos de verificação:

```bash
# Confirme que nenhuma porta pública está escutando
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verifique se o SSH do Tailscale está ativo
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Opcional: desabilite completamente o sshd depois de confirmar que o SSH do Tailscale funciona
sudo systemctl disable --now ssh
```

## Observações sobre ARM

A camada Always Free usa ARM (`aarch64`). A maioria dos recursos do OpenClaw funciona normalmente; um pequeno número de binários nativos precisa de compilações para ARM:

- Node.js, Telegram, WhatsApp (Baileys): JavaScript puro, sem problemas.
- A maioria dos pacotes npm com código nativo: artefatos `linux-arm64` pré-compilados disponíveis.
- Utilitários opcionais da CLI (por exemplo, binários Go/Rust distribuídos por Skills): verifique se há uma versão `aarch64` / `linux-arm64` antes de instalar.

Verifique a arquitetura com `uname -m` (deve exibir `aarch64`). Para binários sem uma compilação ARM, instale a partir do código-fonte ou ignore-os.

## Persistência e backups

O estado do OpenClaw fica em:

- `~/.openclaw/` -- `openclaw.json`, `auth-profiles.json` por agente, estado de canais/provedores e dados de sessão.
- `~/.openclaw/workspace/` -- o espaço de trabalho do agente (SOUL.md, memória e artefatos).

Esses dados sobrevivem a reinicializações. Para criar um snapshot portátil:

```bash
openclaw backup create
```

## Alternativa: túnel SSH

Se o Tailscale Serve não estiver funcionando, use um túnel SSH a partir da sua máquina local:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Em seguida, abra `http://localhost:18789`.

## Solução de problemas

**Falha na criação da instância ("Out of capacity")** -- As instâncias ARM da camada gratuita são populares. Tente outro domínio de disponibilidade ou tente novamente fora dos horários de pico.

**O Tailscale não se conecta** -- Execute `sudo tailscale up --ssh --hostname=openclaw --reset` para autenticar novamente.

**O Gateway não inicia** -- Execute `openclaw doctor --non-interactive` e verifique os logs com `journalctl --user -u openclaw-gateway.service -n 50`.

**Problemas com binários ARM** -- A maioria dos pacotes npm funciona em ARM64. Para binários nativos, procure versões `linux-arm64` ou `aarch64`. Verifique a arquitetura com `uname -m`.

## Próximas etapas

- [Canais](/pt-BR/channels) -- conecte Telegram, WhatsApp, Discord e outros
- [Configuração do Gateway](/pt-BR/gateway/configuration) -- todas as opções de configuração
- [Atualização](/pt-BR/install/updating) -- mantenha o OpenClaw atualizado

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [GCP](/pt-BR/install/gcp)
- [Hospedagem em VPS](/pt-BR/vps)
