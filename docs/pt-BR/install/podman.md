---
read_when:
    - Você quer um Gateway em contêiner com Podman em vez de Docker
summary: Execute o OpenClaw em um contêiner Podman sem root
title: Podman
x-i18n:
    generated_at: "2026-04-30T09:55:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfdcbbdb62c2f8ca2d6d370b742003e6f92f6921a38c00ba19e810d83e350647
    source_path: install/podman.md
    workflow: 16
---

Execute o Gateway do OpenClaw em um contêiner Podman sem root, gerenciado pelo seu usuário atual não root.

O modelo pretendido é:

- O Podman executa o contêiner do Gateway.
- A CLI `openclaw` do seu host é o plano de controle.
- O estado persistente fica no host em `~/.openclaw` por padrão.
- O gerenciamento diário usa `openclaw --container <name> ...` em vez de `sudo -u openclaw`, `podman exec` ou um usuário de serviço separado.

## Pré-requisitos

- **Podman** em modo sem root
- **CLI do OpenClaw** instalada no host
- **Opcional:** `systemd --user` se você quiser inicialização automática gerenciada por Quadlet
- **Opcional:** `sudo` somente se você quiser `loginctl enable-linger "$(whoami)"` para persistência de inicialização em um host sem monitor

## Início rápido

<Steps>
  <Step title="Configuração única">
    A partir da raiz do repo, execute `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Inicie o contêiner do Gateway">
    Inicie o contêiner com `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Execute o onboarding dentro do contêiner">
    Execute `./scripts/run-openclaw-podman.sh launch setup` e depois abra `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Gerencie o contêiner em execução pela CLI do host">
    Defina `OPENCLAW_CONTAINER=openclaw` e então use comandos normais do `openclaw` a partir do host.
  </Step>
</Steps>

Detalhes da configuração:

- `./scripts/podman/setup.sh` cria `openclaw:local` no seu armazenamento Podman sem root por padrão, ou usa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` se você definir uma delas.
- Ele cria `~/.openclaw/openclaw.json` com `gateway.mode: "local"` se estiver ausente.
- Ele cria `~/.openclaw/.env` com `OPENCLAW_GATEWAY_TOKEN` se estiver ausente.
- Para inicializações manuais, o auxiliar lê apenas uma pequena lista permitida de chaves relacionadas ao Podman de `~/.openclaw/.env` e passa variáveis de ambiente de runtime explícitas para o contêiner; ele não entrega o arquivo de ambiente completo ao Podman.

Configuração gerenciada por Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet é uma opção exclusiva para Linux porque depende de serviços de usuário do systemd.

Você também pode definir `OPENCLAW_PODMAN_QUADLET=1`.

Variáveis de ambiente opcionais de build/configuração:

- `OPENCLAW_IMAGE` ou `OPENCLAW_PODMAN_IMAGE` -- use uma imagem existente/baixada em vez de criar `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- instale pacotes apt extras durante o build da imagem
- `OPENCLAW_EXTENSIONS` -- pré-instale dependências de Plugin no momento do build
- `OPENCLAW_INSTALL_BROWSER` -- pré-instale Chromium e Xvfb para automação de navegador (defina como `1` para habilitar)

Início do contêiner:

```bash
./scripts/run-openclaw-podman.sh launch
```

O script inicia o contêiner com seu uid/gid atual usando `--userns=keep-id` e monta por bind o estado do OpenClaw no contêiner.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Depois abra `http://127.0.0.1:18789/` e use o token de `~/.openclaw/.env`.

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

No macOS, a máquina do Podman pode fazer o navegador parecer não local para o Gateway.
Se a Interface de controle relatar erros de autenticação de dispositivo após a inicialização, use a orientação do Tailscale em
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Para HTTPS ou acesso remoto pelo navegador, siga a documentação principal do Tailscale.

Observação específica do Podman:

- Mantenha o host de publicação do Podman em `127.0.0.1`.
- Prefira `tailscale serve` gerenciado pelo host em vez de `openclaw gateway --tailscale serve`.
- No macOS, se o contexto de autenticação de dispositivo do navegador local não for confiável, use acesso via Tailscale em vez de soluções alternativas ad hoc com túnel local.

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

Depois de editar o arquivo Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Para persistência de inicialização em hosts SSH/sem monitor, habilite o lingering para seu usuário atual:

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
`openclaw.json`, `auth-profiles.json` por agente, estado de canal/provedor,
sessões e workspace sobrevivem à substituição do contêiner.
A configuração do Podman também semeia `gateway.controlUi.allowedOrigins` para `127.0.0.1` e `localhost` na porta publicada do Gateway para que o dashboard local funcione com o bind não local loopback do contêiner.

Variáveis de ambiente úteis para o inicializador manual:

- `OPENCLAW_PODMAN_CONTAINER` -- nome do contêiner (`openclaw` por padrão)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- imagem a executar
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- porta do host mapeada para a porta `18789` do contêiner
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- porta do host mapeada para a porta `18790` do contêiner
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interface do host para portas publicadas; o padrão é `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- modo de bind do Gateway dentro do contêiner; o padrão é `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (padrão), `auto` ou `host`

O inicializador manual lê `~/.openclaw/.env` antes de finalizar os padrões de contêiner/imagem, então você pode persistir esses valores ali.

Se você usar um `OPENCLAW_CONFIG_DIR` ou `OPENCLAW_WORKSPACE_DIR` não padrão, defina as mesmas variáveis tanto para `./scripts/podman/setup.sh` quanto para comandos posteriores de `./scripts/run-openclaw-podman.sh launch`. O inicializador local do repo não persiste substituições de caminho personalizadas entre shells.

Observação sobre Quadlet:

- O serviço Quadlet gerado mantém intencionalmente um formato padrão fixo e reforçado: portas publicadas em `127.0.0.1`, `--bind lan` dentro do contêiner e namespace de usuário `keep-id`.
- Ele fixa `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` e `TimeoutStartSec=300`.
- Ele publica tanto `127.0.0.1:18789:18789` (Gateway) quanto `127.0.0.1:18790:18790` (bridge).
- Ele lê `~/.openclaw/.env` como um `EnvironmentFile` de runtime para valores como `OPENCLAW_GATEWAY_TOKEN`, mas não consome a lista permitida de substituições específicas do Podman do inicializador manual.
- Se você precisar de portas de publicação personalizadas, host de publicação ou outros flags de execução de contêiner, use o inicializador manual ou edite `~/.config/containers/systemd/openclaw.container` diretamente, depois recarregue e reinicie o serviço.

## Comandos úteis

- **Logs do contêiner:** `podman logs -f openclaw`
- **Parar contêiner:** `podman stop openclaw`
- **Remover contêiner:** `podman rm -f openclaw`
- **Abrir URL do dashboard pela CLI do host:** `openclaw dashboard --no-open`
- **Saúde/status via CLI do host:** `openclaw gateway status --deep` (sondagem RPC + varredura extra
  de serviço)

## Solução de problemas

- **Permissão negada (EACCES) na configuração ou no workspace:** O contêiner é executado com `--userns=keep-id` e `--user <your uid>:<your gid>` por padrão. Garanta que os caminhos de configuração/workspace do host pertençam ao seu usuário atual.
- **Inicialização do Gateway bloqueada (`gateway.mode=local` ausente):** Garanta que `~/.openclaw/openclaw.json` exista e defina `gateway.mode="local"`. `scripts/podman/setup.sh` cria isso se estiver ausente.
- **Comandos da CLI do contêiner atingem o alvo errado:** Use `openclaw --container <name> ...` explicitamente, ou exporte `OPENCLAW_CONTAINER=<name>` no seu shell.
- **`openclaw update` falha com `--container`:** Esperado. Recrie/baixe a imagem e depois reinicie o contêiner ou o serviço Quadlet.
- **O serviço Quadlet não inicia:** Execute `systemctl --user daemon-reload` e depois `systemctl --user start openclaw.service`. Em sistemas sem monitor, você também pode precisar de `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux bloqueia montagens bind:** Deixe o comportamento padrão de montagem como está; o inicializador adiciona automaticamente `:Z` no Linux quando o SELinux está em modo enforcing ou permissive.

## Relacionado

- [Docker](/pt-BR/install/docker)
- [Processo em segundo plano do Gateway](/pt-BR/gateway/background-process)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
