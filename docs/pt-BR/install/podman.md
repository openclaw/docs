---
read_when:
    - Você quer um Gateway em contêiner com Podman em vez de Docker
summary: Execute o OpenClaw em um contêiner Podman sem root
title: Podman
x-i18n:
    generated_at: "2026-06-27T17:39:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f6950956551dc3c274db33712cf66632fb5facbca4954bf67c30a8bff740c2f
    source_path: install/podman.md
    workflow: 16
---

Execute o Gateway do OpenClaw em um contêiner Podman sem root, gerenciado pelo seu usuário atual não root.

O modelo pretendido é:

- O Podman executa o contêiner do gateway.
- A CLI `openclaw` do seu host é o plano de controle.
- O estado persistente fica no host em `~/.openclaw` por padrão.
- O gerenciamento diário usa `openclaw --container <name> ...` em vez de `sudo -u openclaw`, `podman exec` ou um usuário de serviço separado.

## Pré-requisitos

- **Podman** em modo sem root
- **CLI do OpenClaw** instalada no host
- **Opcional:** `systemd --user` se você quiser inicialização automática gerenciada por Quadlet
- **Opcional:** `sudo` somente se você quiser `loginctl enable-linger "$(whoami)"` para persistência na inicialização em um host sem interface gráfica

## Início rápido

<Steps>
  <Step title="Configuração única">
    A partir da raiz do repositório, execute `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Iniciar o contêiner do Gateway">
    Inicie o contêiner com `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Executar a integração inicial dentro do contêiner">
    Execute `./scripts/run-openclaw-podman.sh launch setup` e depois abra `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Gerenciar o contêiner em execução a partir da CLI do host">
    Defina `OPENCLAW_CONTAINER=openclaw` e então use comandos normais do `openclaw` a partir do host.
  </Step>
</Steps>

Detalhes da configuração:

- `./scripts/podman/setup.sh` cria `openclaw:local` no seu armazenamento Podman sem root por padrão, ou usa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` se você definir uma delas.
- Ele cria `~/.openclaw/openclaw.json` com `gateway.mode: "local"` se estiver ausente.
- Ele cria `~/.openclaw/.env` com `OPENCLAW_GATEWAY_TOKEN` se estiver ausente.
- Para execuções manuais, o auxiliar lê apenas uma pequena lista permitida de chaves relacionadas ao Podman em `~/.openclaw/.env` e passa variáveis de ambiente de runtime explícitas para o contêiner; ele não entrega o arquivo env completo ao Podman.

Configuração gerenciada por Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet é uma opção exclusiva para Linux porque depende de serviços de usuário do systemd.

Você também pode definir `OPENCLAW_PODMAN_QUADLET=1`.

Variáveis de ambiente opcionais de build/configuração:

- `OPENCLAW_IMAGE` ou `OPENCLAW_PODMAN_IMAGE` -- use uma imagem existente/baixada em vez de criar `openclaw:local`
- `OPENCLAW_IMAGE_APT_PACKAGES` -- instale pacotes apt extras durante a criação da imagem (também aceita o legado `OPENCLAW_DOCKER_APT_PACKAGES`)
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- instale pacotes Python extras durante a criação da imagem; fixe versões e use somente índices de pacotes em que você confia
- `OPENCLAW_EXTENSIONS` -- pré-instale dependências de plugins no momento do build
- `OPENCLAW_INSTALL_BROWSER` -- pré-instale Chromium e Xvfb para automação de navegador (defina como `1` para habilitar)

Inicialização do contêiner:

```bash
./scripts/run-openclaw-podman.sh launch
```

O script inicia o contêiner com seu uid/gid atual usando `--userns=keep-id` e monta por bind o estado do OpenClaw no contêiner.

Integração inicial:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Depois abra `http://127.0.0.1:18789/` e use o token de `~/.openclaw/.env`.

Autenticação de modelo no Podman:

- Use autenticação gerenciada pelo OpenClaw durante a configuração: chaves de API da Anthropic para Anthropic, ou autenticação OAuth/código de dispositivo de navegador do OpenAI Codex para OpenAI com base no Codex.
- O lançador Podman não monta diretórios iniciais de credenciais da CLI do host, como `~/.claude` ou `~/.codex`, no contêiner de configuração ou do gateway.
- Logins existentes da CLI do host são caminhos de conveniência no mesmo host. Para instalações em contêiner, mantenha a autenticação do provedor no estado `~/.openclaw` montado que a configuração gerencia.

Padrão da CLI do host:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Então comandos como estes serão executados automaticamente dentro desse contêiner:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # inclui varredura extra de serviço
openclaw doctor
openclaw channels login
```

No macOS, a máquina Podman pode fazer o navegador parecer não local para o gateway.
Se a Control UI relatar erros de autenticação de dispositivo após a inicialização, use a orientação de Tailscale em
[Podman e Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman e Tailscale

Para HTTPS ou acesso remoto pelo navegador, siga a documentação principal do Tailscale.

Observação específica do Podman:

- Mantenha o host de publicação do Podman em `127.0.0.1`.
- Prefira `tailscale serve` gerenciado pelo host em vez de `openclaw gateway --tailscale serve`.
- No macOS, se o contexto local de autenticação de dispositivo do navegador não for confiável, use acesso via Tailscale em vez de soluções improvisadas de túnel local.

Consulte:

- [Tailscale](/pt-BR/gateway/tailscale)
- [Control UI](/pt-BR/web/control-ui)

## Systemd (Quadlet, opcional)

Se você executou `./scripts/podman/setup.sh --quadlet`, a configuração instala um arquivo Quadlet em:

```bash
~/.config/containers/systemd/openclaw.container
```

Comandos úteis:

- **Iniciar:** `systemctl --user start openclaw.service`
- **Parar:** `systemctl --user stop openclaw.service`
- **Status:** `systemctl --user status openclaw.service`
- **Logs:** `journalctl --user -u openclaw.service -f`

Depois de editar o arquivo Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Para persistência na inicialização em hosts SSH/sem interface gráfica, habilite lingering para seu usuário atual:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Configuração, env e armazenamento

- **Diretório de configuração:** `~/.openclaw`
- **Diretório de workspace:** `~/.openclaw/workspace`
- **Arquivo de token:** `~/.openclaw/.env`
- **Auxiliar de inicialização:** `./scripts/run-openclaw-podman.sh`

O script de inicialização e o Quadlet montam por bind o estado do host no contêiner:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Por padrão, esses são diretórios do host, não estado anônimo do contêiner, portanto
`openclaw.json`, `auth-profiles.json` por agente, estado de canal/provedor,
sessões e workspace sobrevivem à substituição do contêiner.
A configuração Podman também semeia `gateway.controlUi.allowedOrigins` para `127.0.0.1` e `localhost` na porta publicada do gateway para que o dashboard local funcione com o bind não loopback do contêiner.

Variáveis de ambiente úteis para o lançador manual:

- `OPENCLAW_PODMAN_CONTAINER` -- nome do contêiner (`openclaw` por padrão)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- imagem a executar
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- porta do host mapeada para a porta `18789` do contêiner
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- porta do host mapeada para a porta `18790` do contêiner
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interface do host para portas publicadas; o padrão é `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- modo de bind do gateway dentro do contêiner; o padrão é `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (padrão), `auto` ou `host`

O lançador manual lê `~/.openclaw/.env` antes de finalizar os padrões de contêiner/imagem, então você pode persistir esses valores ali.

Se você usar um `OPENCLAW_CONFIG_DIR` ou `OPENCLAW_WORKSPACE_DIR` diferente do padrão, defina as mesmas variáveis tanto para `./scripts/podman/setup.sh` quanto para comandos posteriores de `./scripts/run-openclaw-podman.sh launch`. O lançador local do repositório não persiste substituições de caminhos personalizados entre shells.

Observação sobre Quadlet:

- O serviço Quadlet gerado mantém intencionalmente um formato padrão fixo e reforçado: portas publicadas em `127.0.0.1`, `--bind lan` dentro do contêiner e namespace de usuário `keep-id`.
- Ele fixa `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` e `TimeoutStartSec=300`.
- Ele publica tanto `127.0.0.1:18789:18789` (gateway) quanto `127.0.0.1:18790:18790` (bridge).
- Ele lê `~/.openclaw/.env` como um `EnvironmentFile` de runtime para valores como `OPENCLAW_GATEWAY_TOKEN`, mas não consome a lista permitida de substituições específicas do Podman do lançador manual.
- Se você precisar de portas de publicação personalizadas, host de publicação personalizado ou outras flags de execução de contêiner, use o lançador manual ou edite `~/.config/containers/systemd/openclaw.container` diretamente, depois recarregue e reinicie o serviço.

## Comandos úteis

- **Logs do contêiner:** `podman logs -f openclaw`
- **Parar contêiner:** `podman stop openclaw`
- **Remover contêiner:** `podman rm -f openclaw`
- **Abrir URL do dashboard a partir da CLI do host:** `openclaw dashboard --no-open`
- **Integridade/status via CLI do host:** `openclaw gateway status --deep` (sondagem RPC + varredura extra
  de serviço)

## Solução de problemas

- **Permissão negada (EACCES) na configuração ou no workspace:** O contêiner é executado com `--userns=keep-id` e `--user <your uid>:<your gid>` por padrão. Garanta que os caminhos de configuração/workspace do host pertençam ao seu usuário atual.
- **Início do Gateway bloqueado (`gateway.mode=local` ausente):** Garanta que `~/.openclaw/openclaw.json` exista e defina `gateway.mode="local"`. `scripts/podman/setup.sh` cria isso se estiver ausente.
- **Comandos da CLI do contêiner atingem o destino errado:** Use `openclaw --container <name> ...` explicitamente, ou exporte `OPENCLAW_CONTAINER=<name>` no seu shell.
- **`openclaw update` falha com `--container`:** Esperado. Recrie/baixe a imagem e depois reinicie o contêiner ou o serviço Quadlet.
- **O serviço Quadlet não inicia:** Execute `systemctl --user daemon-reload` e depois `systemctl --user start openclaw.service`. Em sistemas sem interface gráfica, talvez você também precise de `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux bloqueia montagens bind:** Deixe o comportamento de montagem padrão como está; o lançador adiciona automaticamente `:Z` no Linux quando o SELinux está em modo enforcing ou permissive.

## Relacionados

- [Docker](/pt-BR/install/docker)
- [Processo em segundo plano do Gateway](/pt-BR/gateway/background-process)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
