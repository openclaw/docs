---
read_when:
    - Você quer um gateway em contêiner com Podman em vez de Docker
summary: Executar o OpenClaw em um contêiner rootless do Podman
title: Podman
x-i18n:
    generated_at: "2026-04-23T14:04:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: df478ad4ac63b363c86a53bc943494b32602abfaad8576c5e899e77f7699a533
    source_path: install/podman.md
    workflow: 15
---

# Podman

Execute o Gateway OpenClaw em um contêiner rootless do Podman, gerenciado pelo seu usuário atual sem privilégios de root.

O modelo pretendido é:

- O Podman executa o contêiner do gateway.
- Sua CLI `openclaw` no host é o plano de controle.
- O estado persistente fica no host em `~/.openclaw` por padrão.
- O gerenciamento do dia a dia usa `openclaw --container <name> ...` em vez de `sudo -u openclaw`, `podman exec` ou um usuário de serviço separado.

## Pré-requisitos

- **Podman** em modo rootless
- **CLI do OpenClaw** instalada no host
- **Opcional:** `systemd --user` se você quiser inicialização automática gerenciada por Quadlet
- **Opcional:** `sudo` apenas se você quiser `loginctl enable-linger "$(whoami)"` para persistência após boot em um host headless

## Início rápido

<Steps>
  <Step title="Configuração única">
    Na raiz do repositório, execute `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Iniciar o contêiner do Gateway">
    Inicie o contêiner com `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Executar o onboarding dentro do contêiner">
    Execute `./scripts/run-openclaw-podman.sh launch setup` e depois abra `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Gerenciar o contêiner em execução a partir da CLI do host">
    Defina `OPENCLAW_CONTAINER=openclaw` e depois use os comandos normais de `openclaw` a partir do host.
  </Step>
</Steps>

Detalhes da configuração:

- `./scripts/podman/setup.sh` compila `openclaw:local` no seu armazenamento rootless do Podman por padrão, ou usa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` se você definir um deles.
- Ele cria `~/.openclaw/openclaw.json` com `gateway.mode: "local"` se estiver ausente.
- Ele cria `~/.openclaw/.env` com `OPENCLAW_GATEWAY_TOKEN` se estiver ausente.
- Para inicializações manuais, o auxiliar lê apenas uma pequena allowlist de chaves relacionadas ao Podman de `~/.openclaw/.env` e passa variáveis de ambiente explícitas de runtime para o contêiner; ele não entrega o arquivo de ambiente completo ao Podman.

Configuração gerenciada por Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet é uma opção apenas para Linux porque depende de serviços de usuário do systemd.

Você também pode definir `OPENCLAW_PODMAN_QUADLET=1`.

Variáveis de ambiente opcionais de compilação/configuração:

- `OPENCLAW_IMAGE` ou `OPENCLAW_PODMAN_IMAGE` -- usa uma imagem existente/baixada em vez de compilar `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- instala pacotes apt extras durante a compilação da imagem
- `OPENCLAW_EXTENSIONS` -- pré-instala dependências de plugin no momento da compilação

Inicialização do contêiner:

```bash
./scripts/run-openclaw-podman.sh launch
```

O script inicia o contêiner com seu uid/gid atuais usando `--userns=keep-id` e monta por bind o seu estado do OpenClaw no contêiner.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Depois abra `http://127.0.0.1:18789/` e use o token de `~/.openclaw/.env`.

Padrão da CLI do host:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Depois comandos como estes serão executados automaticamente dentro desse contêiner:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # inclui varredura extra de serviços
openclaw doctor
openclaw channels login
```

No macOS, o Podman machine pode fazer o navegador parecer não local para o gateway.
Se a Interface de controle relatar erros de autenticação de dispositivo após a inicialização, use a orientação de Tailscale em
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Para HTTPS ou acesso remoto pelo navegador, siga a documentação principal do Tailscale.

Observação específica do Podman:

- Mantenha o host de publicação do Podman em `127.0.0.1`.
- Prefira `tailscale serve` gerenciado pelo host em vez de `openclaw gateway --tailscale serve`.
- No macOS, se o contexto de autenticação de dispositivo no navegador local for pouco confiável, use acesso por Tailscale em vez de soluções improvisadas de túnel local.

Veja:

- [Tailscale](/pt-BR/gateway/tailscale)
- [Interface de controle](/pt-BR/web/control-ui)

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

Após editar o arquivo Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Para persistência após boot em hosts SSH/headless, habilite lingering para seu usuário atual:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Configuração, ambiente e armazenamento

- **Diretório de configuração:** `~/.openclaw`
- **Diretório de workspace:** `~/.openclaw/workspace`
- **Arquivo de token:** `~/.openclaw/.env`
- **Auxiliar de inicialização:** `./scripts/run-openclaw-podman.sh`

O script de inicialização e o Quadlet montam por bind o estado do host no contêiner:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Por padrão, esses são diretórios do host, não estado anônimo do contêiner, então
`openclaw.json`, `auth-profiles.json` por agente, estado de canal/provider,
sessões e workspace sobrevivem à substituição do contêiner.
A configuração do Podman também inicializa `gateway.controlUi.allowedOrigins` para `127.0.0.1` e `localhost` na porta publicada do gateway, para que o dashboard local funcione com o bind não-loopback do contêiner.

Variáveis de ambiente úteis para o inicializador manual:

- `OPENCLAW_PODMAN_CONTAINER` -- nome do contêiner (`openclaw` por padrão)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- imagem a executar
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- porta do host mapeada para `18789` no contêiner
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- porta do host mapeada para `18790` no contêiner
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interface do host para portas publicadas; o padrão é `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- modo de bind do gateway dentro do contêiner; o padrão é `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (padrão), `auto` ou `host`

O inicializador manual lê `~/.openclaw/.env` antes de finalizar os padrões de contêiner/imagem, então você pode persistir esses valores ali.

Se você usar `OPENCLAW_CONFIG_DIR` ou `OPENCLAW_WORKSPACE_DIR` fora do padrão, defina as mesmas variáveis tanto para `./scripts/podman/setup.sh` quanto para comandos posteriores `./scripts/run-openclaw-podman.sh launch`. O inicializador local do repositório não persiste substituições de caminho personalizadas entre shells.

Observação sobre Quadlet:

- O serviço Quadlet gerado mantém intencionalmente um formato padrão fixo e endurecido: portas publicadas em `127.0.0.1`, `--bind lan` dentro do contêiner e namespace de usuário `keep-id`.
- Ele fixa `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` e `TimeoutStartSec=300`.
- Ele publica tanto `127.0.0.1:18789:18789` (gateway) quanto `127.0.0.1:18790:18790` (bridge).
- Ele lê `~/.openclaw/.env` como `EnvironmentFile` de runtime para valores como `OPENCLAW_GATEWAY_TOKEN`, mas não consome a allowlist de substituições específicas do Podman do inicializador manual.
- Se você precisar de portas publicadas personalizadas, host de publicação ou outras flags de execução do contêiner, use o inicializador manual ou edite `~/.config/containers/systemd/openclaw.container` diretamente e depois recarregue e reinicie o serviço.

## Comandos úteis

- **Logs do contêiner:** `podman logs -f openclaw`
- **Parar o contêiner:** `podman stop openclaw`
- **Remover o contêiner:** `podman rm -f openclaw`
- **Abrir a URL do dashboard a partir da CLI do host:** `openclaw dashboard --no-open`
- **Integridade/status pela CLI do host:** `openclaw gateway status --deep` (sondagem RPC + varredura extra
  de serviços)

## Solução de problemas

- **Permissão negada (EACCES) na configuração ou no workspace:** o contêiner é executado com `--userns=keep-id` e `--user <your uid>:<your gid>` por padrão. Garanta que os caminhos de configuração/workspace no host pertençam ao seu usuário atual.
- **Inicialização do Gateway bloqueada (ausência de `gateway.mode=local`):** garanta que `~/.openclaw/openclaw.json` exista e defina `gateway.mode="local"`. `scripts/podman/setup.sh` cria isso se estiver ausente.
- **Comandos CLI do contêiner atingem o destino errado:** use `openclaw --container <name> ...` explicitamente ou exporte `OPENCLAW_CONTAINER=<name>` no seu shell.
- **`openclaw update` falha com `--container`:** esperado. Recompile/baixe a imagem e depois reinicie o contêiner ou o serviço Quadlet.
- **O serviço Quadlet não inicia:** execute `systemctl --user daemon-reload` e depois `systemctl --user start openclaw.service`. Em sistemas headless, você também pode precisar de `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux bloqueia bind mounts:** deixe o comportamento padrão de montagem como está; o inicializador adiciona `:Z` automaticamente no Linux quando o SELinux está em modo enforcing ou permissive.

## Relacionado

- [Docker](/pt-BR/install/docker)
- [Processo em segundo plano do Gateway](/pt-BR/gateway/background-process)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
