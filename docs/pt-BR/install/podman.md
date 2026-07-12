---
read_when:
    - Você quer um Gateway em contêiner com o Podman em vez do Docker
summary: Execute o OpenClaw em um contêiner Podman sem privilégios de root
title: Podman
x-i18n:
    generated_at: "2026-07-12T15:18:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

Execute o Gateway do OpenClaw em um contêiner Podman sem privilégios de root, gerenciado pelo seu usuário atual não root.

O modelo:

- O Podman executa o contêiner do Gateway.
- A CLI `openclaw` do seu host é o plano de controle.
- Por padrão, o estado persistente fica no host, em `~/.openclaw`.
- O gerenciamento diário usa `openclaw --container <name> ...` em vez de `sudo -u openclaw`, `podman exec` ou um usuário de serviço separado.

## Pré-requisitos

- **Podman** no modo sem privilégios de root
- **CLI do OpenClaw** instalada no host
- **Opcional:** `systemd --user` se você quiser inicialização automática gerenciada pelo Quadlet
- **Opcional:** `sudo` somente se você quiser usar `loginctl enable-linger "$(whoami)"` para persistência após a inicialização em um host sem monitor

## Início rápido

<Steps>
  <Step title="Configuração inicial">
    Na raiz do repositório, execute `./scripts/podman/setup.sh`.

    Isso cria `openclaw:local` no seu armazenamento Podman sem privilégios de root (ou baixa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, se definida), cria `~/.openclaw/openclaw.json` com `gateway.mode: "local"` caso não exista e cria `~/.openclaw/.env` com um `OPENCLAW_GATEWAY_TOKEN` gerado caso não exista.

    Variáveis de ambiente opcionais para o momento da compilação:

    | Variável | Efeito |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | Usa uma imagem existente/baixada em vez de criar `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | Instala pacotes apt adicionais durante a criação da imagem (também aceita a variável legada `OPENCLAW_DOCKER_APT_PACKAGES`) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | Instala pacotes Python adicionais durante a criação da imagem; fixe as versões e use somente índices de pacotes em que você confia |
    | `OPENCLAW_EXTENSIONS` | Compila/empacota os plugins selecionados compatíveis e instala suas dependências de runtime |
    | `OPENCLAW_INSTALL_BROWSER` | Pré-instala o Chromium e o Xvfb para automação de navegador (defina como `1`) |

    Para usar uma configuração gerenciada pelo Quadlet (somente Linux + serviços de usuário do systemd):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    Ou defina `OPENCLAW_PODMAN_QUADLET=1`.

  </Step>

  <Step title="Inicie o contêiner do Gateway">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    Inicia o contêiner com seu uid/gid atual usando `--userns=keep-id` e monta por vínculo o estado do OpenClaw no contêiner.

  </Step>

  <Step title="Execute a integração inicial dentro do contêiner">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Em seguida, abra `http://127.0.0.1:18789/` e use o token de `~/.openclaw/.env`.

    Autenticação do modelo: use a autenticação gerenciada pelo OpenClaw durante a configuração (chaves de API da Anthropic ou autenticação OAuth pelo navegador/código do dispositivo do OpenAI Codex para o OpenAI baseado no Codex). O inicializador do Podman não monta diretórios de credenciais de CLIs do host, como `~/.claude` ou `~/.codex`, no contêiner de configuração ou do Gateway. Logins existentes nas CLIs do host são apenas caminhos convenientes no mesmo host -- para instalações em contêiner, mantenha a autenticação do provedor no estado montado em `~/.openclaw` que é gerenciado pela configuração.

  </Step>

  <Step title="Gerencie o contêiner em execução pela CLI do host">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    Depois disso, os comandos normais do `openclaw` são executados automaticamente dentro desse contêiner:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # inclui uma verificação adicional de serviços
    openclaw doctor
    openclaw channels login
    ```

    No macOS, a máquina do Podman pode fazer o navegador parecer não local para o Gateway. Se a IU de controle relatar erros de autenticação do dispositivo após a inicialização, siga as orientações sobre o Tailscale em [Podman e Tailscale](#podman-and-tailscale).

  </Step>
</Steps>

O inicializador manual lê apenas uma pequena lista de chaves relacionadas ao Podman permitidas em `~/.openclaw/.env` e passa variáveis de ambiente de runtime explícitas ao contêiner; ele não fornece o arquivo de ambiente completo ao Podman.

<a id="podman-and-tailscale"></a>

## Podman e Tailscale

Para acesso via HTTPS ou navegador remoto, siga a documentação principal do Tailscale.

Observações específicas do Podman:

- Mantenha o host de publicação do Podman em `127.0.0.1`.
- Prefira `tailscale serve` gerenciado pelo host em vez de `openclaw gateway --tailscale serve`.
- No macOS, se o contexto de autenticação do dispositivo no navegador local não for confiável, use o acesso pelo Tailscale em vez de soluções alternativas improvisadas com túneis locais.

Consulte [Tailscale](/pt-BR/gateway/tailscale) e [Interface de controle](/pt-BR/web/control-ui).

## Systemd (Quadlet, opcional)

Se você executou `./scripts/podman/setup.sh --quadlet`, a configuração instala um arquivo Quadlet em `~/.config/containers/systemd/openclaw.container`.

| Ação   | Comando                                    |
| ------ | ------------------------------------------ |
| Iniciar | `systemctl --user start openclaw.service`  |
| Parar   | `systemctl --user stop openclaw.service`   |
| Status  | `systemctl --user status openclaw.service` |
| Logs    | `journalctl --user -u openclaw.service -f` |

Após editar o arquivo Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Para persistência após a inicialização em hosts SSH/sem interface gráfica, habilite o lingering para o usuário atual:

```bash
sudo loginctl enable-linger "$(whoami)"
```

O serviço Quadlet gerado mantém uma configuração padrão fixa e reforçada: portas publicadas em `127.0.0.1` (`18789` para o Gateway, `18790` para a ponte), `--bind lan` dentro do contêiner, namespace de usuário `keep-id`, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` e `TimeoutStartSec=300`. Ele lê `~/.openclaw/.env` como um `EnvironmentFile` de runtime para valores como `OPENCLAW_GATEWAY_TOKEN`, mas não utiliza a lista de permissões de substituições específicas do Podman do inicializador manual. Para personalizar as portas de publicação, o host de publicação ou outras opções de execução do contêiner, use o inicializador manual ou edite `~/.config/containers/systemd/openclaw.container` diretamente e, em seguida, recarregue e reinicie o serviço.

## Configuração, ambiente e armazenamento

- **Diretório de configuração:** `~/.openclaw`
- **Diretório do espaço de trabalho:** `~/.openclaw/workspace`
- **Arquivo de token:** `~/.openclaw/.env`
- **Auxiliar de inicialização:** `./scripts/run-openclaw-podman.sh`

O script de inicialização e o Quadlet montam o estado do host no contêiner por bind: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. Por padrão, esses são diretórios do host, não um estado anônimo do contêiner; portanto, `openclaw.json`, os arquivos `auth-profiles.json` de cada agente, o estado dos canais/provedores, as sessões e o espaço de trabalho sobrevivem à substituição do contêiner. A configuração também preenche `gateway.controlUi.allowedOrigins` para `127.0.0.1` e `localhost` na porta publicada do Gateway, para que o painel local funcione com o bind não loopback do contêiner.

Variáveis de ambiente úteis para o inicializador manual (mantenha-as em `~/.openclaw/.env`; o inicializador lê esse arquivo antes de finalizar os padrões do contêiner e da imagem):

| Variável                                   | Padrão           | Efeito                                         |
| ------------------------------------------ | ---------------- | ---------------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | Nome do contêiner                              |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | Imagem a ser executada                         |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | Porta do host mapeada para a porta `18789` do contêiner |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | Porta do host mapeada para a porta `18790` do contêiner |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | Interface do host para as portas publicadas    |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | Modo de bind do Gateway dentro do contêiner    |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`, `auto` ou `host`                    |

Se você usar um `OPENCLAW_CONFIG_DIR` ou `OPENCLAW_WORKSPACE_DIR` diferente do padrão, defina as mesmas variáveis tanto para `./scripts/podman/setup.sh` quanto para os comandos posteriores de `./scripts/run-openclaw-podman.sh launch` -- o inicializador local do repositório não mantém substituições de caminhos personalizados entre shells.

## Atualização de imagens

Depois de recompilar ou obter uma nova imagem, reinicie o contêiner ou o serviço Quadlet.
Na primeira inicialização de uma nova versão do OpenClaw, o Gateway executa reparos seguros
de estado e de plugins antes de informar que está pronto.

Se o Gateway encerrar em vez de ficar pronto, execute a mesma imagem uma vez com
`openclaw doctor --fix` usando o mesmo estado/configuração montado e depois reinicie o
Gateway normalmente:

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

Em hosts com SELinux, adicione `,Z` a ambas as montagens bind se o Podman bloquear o acesso ao estado montado.

## Comandos úteis

- **Logs do contêiner:** `podman logs -f openclaw`
- **Parar o contêiner:** `podman stop openclaw`
- **Remover o contêiner:** `podman rm -f openclaw`
- **Abrir a URL do painel pela CLI do host:** `openclaw dashboard --no-open`
- **Integridade/status pela CLI do host:** `openclaw gateway status --deep` (sondagem RPC + verificação adicional de serviços)

## Solução de problemas

- **Permissão negada (EACCES) na configuração ou no workspace:** Por padrão, o contêiner é executado com `--userns=keep-id` e `--user <your uid>:<your gid>`. Verifique se os caminhos de configuração/workspace do host pertencem ao usuário atual.
- **Inicialização do Gateway bloqueada (`gateway.mode=local` ausente):** Verifique se `~/.openclaw/openclaw.json` existe e define `gateway.mode="local"`. `scripts/podman/setup.sh` cria esse arquivo caso ele não exista.
- **O contêiner reinicia após uma atualização da imagem:** Execute uma vez o comando `openclaw doctor --fix` em [Atualização de imagens](#upgrading-images) e, em seguida, inicie o Gateway novamente.
- **Os comandos da CLI do contêiner atingem o destino errado:** Use explicitamente `openclaw --container <name> ...` ou exporte `OPENCLAW_CONTAINER=<name>` no shell.
- **`openclaw update` falha com `--container`:** Isso é esperado. Recrie/baixe a imagem e reinicie o contêiner ou o serviço Quadlet.
- **O serviço Quadlet não inicia:** Execute `systemctl --user daemon-reload` e depois `systemctl --user start openclaw.service`. Em sistemas sem interface gráfica, talvez também seja necessário executar `sudo loginctl enable-linger "$(whoami)"`.
- **O SELinux bloqueia montagens bind:** Não altere o comportamento padrão de montagem; o inicializador adiciona `:Z` automaticamente no Linux quando o SELinux está no modo enforcing ou permissive.

## Relacionados

- [Docker](/pt-BR/install/docker)
- [Processo em segundo plano do Gateway](/pt-BR/gateway/background-process)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
